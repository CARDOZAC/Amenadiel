'use client';

import { useOnlineStatus } from '@/app/hooks/useOnlineStatus';
import { useSyncQueue } from '@/app/hooks/useSyncQueue';

/**
 * Badge de estado estilo iOS - Muestra conectividad y sync
 */
export function StatusBadge() {
  const { isOnline } = useOnlineStatus();
  const { isSyncing, pendingCount } = useSyncQueue();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null; // No mostrar nada si todo está OK
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`
          px-4 py-2 rounded-full text-xs font-semibold
          backdrop-blur-xl shadow-lg
          flex items-center gap-2
          transition-all duration-300
          ${!isOnline
            ? 'bg-red-500/90 text-white'
            : isSyncing
            ? 'bg-blue-500/90 text-white'
            : 'bg-amber-500/90 text-white'
          }
        `}
      >
        {!isOnline && (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Sin conexión
          </>
        )}

        {isOnline && isSyncing && (
          <>
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sincronizando...
          </>
        )}

        {isOnline && !isSyncing && pendingCount > 0 && (
          <>
            <span className="w-2 h-2 rounded-full bg-white" />
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </>
        )}
      </div>
    </div>
  );
}
