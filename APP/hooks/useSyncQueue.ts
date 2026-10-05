'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, PendingCollection } from '@/lib/db/indexeddb';
import { createCollectionEvent } from '@/app/actions/collection';
import { useOnlineStatus } from './useOnlineStatus';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  syncErrors: string[];
}

/**
 * Hook para manejar la cola de sincronización offline
 * Retry automático con backoff exponencial
 */
export function useSyncQueue() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncErrors: [],
  });

  // Cargar pending count al montar
  useEffect(() => {
    loadPendingCount();
  }, []);

  // Auto-sync cuando se recupera conexión
  useEffect(() => {
    if (wasOffline && isOnline) {
      syncAll();
    }
  }, [wasOffline, isOnline]);

  const loadPendingCount = async () => {
    try {
      await db.init();
      const count = await db.getPendingCount();
      setState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const syncAll = useCallback(async () => {
    if (state.isSyncing || !isOnline) return;

    setState(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      await db.init();
      const pending = await db.getAllPendingCollections();
      const errors: string[] = [];

      for (const item of pending) {
        if (item.syncStatus === 'pending' || item.syncStatus === 'failed') {
          try {
            await syncSingleCollection(item);
            await db.deletePendingCollection(item.id);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${item.id}: ${errorMsg}`);

            // Marcar como failed si supera 3 intentos
            if (item.retryCount >= 3) {
              await db.updatePendingCollection(item.id, {
                syncStatus: 'failed',
                lastError: errorMsg,
              });
            } else {
              await db.updatePendingCollection(item.id, {
                retryCount: item.retryCount + 1,
                lastError: errorMsg,
              });
            }
          }
        }
      }

      // Actualizar métricas
      const remainingCount = await db.getPendingCount();
      await db.updateSyncMetrics({
        lastSyncAt: new Date().toISOString(),
        totalPending: remainingCount,
        totalSynced: pending.length - errors.length,
        totalFailed: errors.length,
      });

      setState(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: remainingCount,
        lastSyncAt: new Date().toISOString(),
        syncErrors: errors,
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncErrors: ['Failed to sync: ' + (error instanceof Error ? error.message : 'Unknown')],
      }));
    }
  }, [isOnline, state.isSyncing]);

  const syncSingleCollection = async (item: PendingCollection) => {
    // Convertir base64 a File si existe foto
    let photoFile: File | undefined;
    if (item.photoBase64) {
      const blob = base64ToBlob(item.photoBase64);
      photoFile = new File([blob], `receipt_${item.id}.jpg`, { type: 'image/jpeg' });
    }

    const result = await createCollectionEvent({
      clientId: item.clientId,
      loanId: item.loanId,
      amount: item.amount,
      latitude: item.latitude,
      longitude: item.longitude,
      photo: photoFile,
      notes: item.notes,
    });

    if (!result.success) {
      throw new Error(result.error || 'Sync failed');
    }
  };

  const addToQueue = useCallback(async (collection: Omit<PendingCollection, 'id' | 'syncStatus' | 'retryCount' | 'capturedAt'>) => {
    try {
      await db.init();

      const pending: PendingCollection = {
        id: crypto.randomUUID(),
        ...collection,
        syncStatus: 'pending',
        retryCount: 0,
        capturedAt: new Date().toISOString(),
      };

      await db.addPendingCollection(pending);
      await loadPendingCount();

      // Intentar sync inmediato si hay conexión
      if (isOnline) {
        setTimeout(() => syncAll(), 500);
      }

      return pending.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }, [isOnline, syncAll]);

  return {
    ...state,
    isOnline,
    syncAll,
    addToQueue,
    refreshCount: loadPendingCount,
  };
}

// Utilidad para convertir base64 a Blob
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
