'use client';

import { useState, useCallback, ChangeEvent } from 'react';

interface UseImageCaptureReturn {
  file: File | null;
  preview: string | null;
  error: string | null;
  uploading: boolean;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESS_THRESHOLD = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Custom hook para capturar fotos con la cámara del dispositivo
 * Soporta compresión automática para archivos >2MB
 */
export function useImageCapture(): UseImageCaptureReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear canvas para compresión'));
            return;
          }

          // Reducir dimensiones proporcionalmente si es muy grande
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Comprimir a JPEG con calidad 0.8
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir imagen'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Error al cargar imagen'));
      };
      reader.onerror = () => reject(new Error('Error al leer archivo'));
    });
  };

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setUploading(true);

    try {
      // Validar tipo de archivo
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        throw new Error('Solo se permiten imágenes (JPEG, PNG, WebP)');
      }

      // Validar tamaño máximo
      if (selectedFile.size > MAX_FILE_SIZE) {
        throw new Error('La imagen no puede superar 5MB');
      }

      // Comprimir si es necesario
      let processedFile = selectedFile;
      if (selectedFile.size > COMPRESS_THRESHOLD) {
        processedFile = await compressImage(selectedFile);
      }

      // Generar preview
      const previewUrl = URL.createObjectURL(processedFile);
      setPreview(previewUrl);
      setFile(processedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar imagen');
      setFile(null);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
  }, [preview]);

  return {
    file,
    preview,
    error,
    uploading,
    handleFileSelect,
    reset,
  };
}
