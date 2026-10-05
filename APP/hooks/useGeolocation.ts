'use client';

import { useState, useCallback } from 'react';

interface Coordinates {
  lat: number;
  lon: number;
}

interface UseGeolocationReturn {
  coordinates: Coordinates | null;
  error: string | null;
  loading: boolean;
  capture: () => void;
  reset: () => void;
}

/**
 * Custom hook para capturar coordenadas GPS del navegador
 * Utiliza la API nativa de Geolocalización del navegador (segura y gratuita)
 */
export function useGeolocation(): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(() => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true, // Máxima precisión GPS
      timeout: 10000, // 10 segundos
      maximumAge: 0, // No usar caché
    };

    navigator.geolocation.getCurrentPosition(
      // Éxito
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
        setError(null);
      },
      // Error
      (err) => {
        setLoading(false);
        setCoordinates(null);

        // Mensajes de error user-friendly
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso denegado. Active el GPS en configuración del navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('No se pudo obtener ubicación. Intente de nuevo.');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado. Intente de nuevo.');
            break;
          default:
            setError('Error desconocido al obtener ubicación.');
        }
      },
      options
    );
  }, []);

  const reset = useCallback(() => {
    setCoordinates(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    coordinates,
    error,
    loading,
    capture,
    reset,
  };
}
