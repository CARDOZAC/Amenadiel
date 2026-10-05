import { createClient } from '@/lib/supabase/server';

/**
 * Sube una foto de recibo de cobro a Supabase Storage
 *
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario (cobrador) que sube la foto
 * @returns URL pública de la foto subida
 */
export async function uploadCollectionReceipt(
  file: File,
  userId: string
): Promise<string> {
  const supabase = await createClient();

  // Generar nombre único: {userId}/{timestamp}_{random}.jpg
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${timestamp}_${randomString}.${fileExtension}`;

  // Subir archivo al bucket 'collection-receipts'
  const { data, error } = await supabase.storage
    .from('collection-receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error al subir foto a Supabase Storage:', error);
    throw new Error(`Error al subir foto: ${error.message}`);
  }

  // Obtener URL pública del archivo
  const { data: publicUrlData } = supabase.storage
    .from('collection-receipts')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Elimina una foto de recibo de cobro de Supabase Storage
 *
 * @param path - Ruta del archivo en el bucket (ej: "userId/timestamp_random.jpg")
 */
export async function deleteCollectionReceipt(path: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from('collection-receipts')
    .remove([path]);

  if (error) {
    console.error('Error al eliminar foto de Supabase Storage:', error);
    throw new Error(`Error al eliminar foto: ${error.message}`);
  }
}

/**
 * Extrae la ruta del archivo desde una URL pública de Supabase Storage
 *
 * @param publicUrl - URL pública del archivo
 * @returns Ruta del archivo en el bucket
 */
export function extractStoragePath(publicUrl: string): string {
  // URL format: https://{project}.supabase.co/storage/v1/object/public/collection-receipts/{path}
  const parts = publicUrl.split('/collection-receipts/');
  if (parts.length < 2) {
    throw new Error('URL de almacenamiento inválida');
  }
  return parts[1];
}
