'use client';

import { useEffect } from 'react';

/**
 * Registra el Service Worker para PWA
 * Solo se ejecuta en cliente, no en servidor
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado:', registration.scope);

          // Listener para updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay un nuevo SW disponible
                  console.log('[PWA] Nueva versión disponible');
                  // Opcionalmente mostrar notificación al usuario
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Error registrando Service Worker:', error);
        });

      // Listener para mensajes del SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          // Disparar sync de cola (lo maneja useSyncQueue)
          window.dispatchEvent(new CustomEvent('sw-sync-request'));
        }
      });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
