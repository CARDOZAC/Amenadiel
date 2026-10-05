/**
 * IndexedDB Layer - Offline-First Storage
 * Estilo: Simple, directo, sin abstracciones innecesarias
 */

const DB_NAME = 'dle_offline_db';
const DB_VERSION = 1;

export interface PendingCollection {
  id: string; // UUID temporal
  clientId: string;
  loanId: string;
  amount: number;
  latitude: number;
  longitude: number;
  photoBase64?: string; // Foto en base64 para offline
  notes?: string;
  capturedAt: string; // ISO timestamp
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  lastError?: string;
}

export interface CachedLoan {
  id: string;
  clientName: string;
  clientId: string;
  routeId: string;
  dailyPayment: number;
  balance: number;
  daysOverdue: number;
  lastPaymentDate?: string;
  cachedAt: string;
}

export interface SyncMetrics {
  lastSyncAt?: string;
  totalPending: number;
  totalSynced: number;
  totalFailed: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para cobros pendientes de sincronizar
        if (!db.objectStoreNames.contains('pending_collections')) {
          const pendingStore = db.createObjectStore('pending_collections', { keyPath: 'id' });
          pendingStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          pendingStore.createIndex('capturedAt', 'capturedAt', { unique: false });
        }

        // Store para préstamos en caché (para trabajar offline)
        if (!db.objectStoreNames.contains('cached_loans')) {
          const loansStore = db.createObjectStore('cached_loans', { keyPath: 'id' });
          loansStore.createIndex('routeId', 'routeId', { unique: false });
          loansStore.createIndex('daysOverdue', 'daysOverdue', { unique: false });
        }

        // Store para métricas de sincronización
        if (!db.objectStoreNames.contains('sync_metrics')) {
          db.createObjectStore('sync_metrics', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('DB not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ========== PENDING COLLECTIONS ==========

  async addPendingCollection(collection: PendingCollection): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('pending_collections', 'readwrite');
      const request = store.add(collection);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPendingCollections(): Promise<PendingCollection[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('pending_collections', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingCollection(id: string, updates: Partial<PendingCollection>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const store = this.getStore('pending_collections', 'readwrite');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Collection not found'));
          return;
        }

        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deletePendingCollection(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('pending_collections', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('pending_collections', 'readonly');
      const index = store.index('syncStatus');
      const request = index.count(IDBKeyRange.only('pending'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== CACHED LOANS ==========

  async cacheLoans(loans: CachedLoan[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('cached_loans', 'readwrite');

      // Clear existing cache
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new cache
        let pending = loans.length;
        if (pending === 0) {
          resolve();
          return;
        }

        loans.forEach(loan => {
          const request = store.add(loan);
          request.onsuccess = () => {
            pending--;
            if (pending === 0) resolve();
          };
          request.onerror = () => reject(request.error);
        });
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async getCachedLoans(): Promise<CachedLoan[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('cached_loans', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SYNC METRICS ==========

  async updateSyncMetrics(metrics: SyncMetrics): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('sync_metrics', 'readwrite');
      const request = store.put({ id: 'main', ...metrics });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncMetrics(): Promise<SyncMetrics | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('sync_metrics', 'readonly');
      const request = store.get('main');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ========== UTILITY ==========

  async clearAllData(): Promise<void> {
    const stores = ['pending_collections', 'cached_loans', 'sync_metrics'];
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Singleton instance
export const db = new IndexedDBManager();
