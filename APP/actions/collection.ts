'use server';

import { createClient } from '@/lib/supabase/server';
import { uploadCollectionReceipt } from '@/lib/supabase/storage';
import { redirect } from 'next/navigation';
import type { GeoPoint } from '@/lib/types/database.types';

interface CreateCollectionEventParams {
  loanId: string;
  amount: string;
  location: { lat: number; lon: number };
  photoFile?: File;
  notes?: string;
}

/**
 * Server Action para crear un evento de cobro
 * Valida usuario, sube foto, y registra el pago en la base de datos
 */
export async function createCollectionEvent(params: CreateCollectionEventParams) {
  const supabase = await createClient();

  // 1. Validar sesión del usuario
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'No autenticado. Por favor inicie sesión.' };
  }

  // 2. Verificar que el usuario es un cobrador
  type UserRow = { role?: 'collector' | 'owner' | 'accountant'; id: string };
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { error: 'Error al verificar usuario.' };
  }

  const typedUser = userData as UserRow;

  if (typedUser.role !== 'collector' && typedUser.role !== 'owner') {
    return { error: 'Permisos insuficientes. Solo cobradores pueden registrar pagos.' };
  }

  // 3. Validar parámetros
  const amountNum = parseFloat(params.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { error: 'El monto debe ser mayor a 0.' };
  }

  if (
    params.location.lat < -90 ||
    params.location.lat > 90 ||
    params.location.lon < -180 ||
    params.location.lon > 180
  ) {
    return { error: 'Coordenadas GPS inválidas.' };
  }

  // 4. Verificar que el préstamo existe y está activo
  type LoanRow = { id: string; status?: string | null; client_id?: string | null };
  const { data: loanData, error: loanError } = await supabase
    .from('loans')
    .select('id, status, client_id')
    .eq('id', params.loanId)
    .single();

  if (loanError || !loanData) {
    return { error: 'Préstamo no encontrado.' };
  }

  const typedLoan = loanData as LoanRow;

  if (typedLoan.status !== 'active') {
    return { error: 'El préstamo no está activo.' };
  }

  // 5. Subir foto a Supabase Storage (si existe)
  let photoUrl: string | null = null;
  if (params.photoFile) {
    try {
      photoUrl = await uploadCollectionReceipt(params.photoFile, user.id);
    } catch (error) {
      console.error('Error al subir foto:', error);
      return { error: 'Error al subir foto. Intente de nuevo.' };
    }
  }

  // 6. Convertir coordenadas a formato GeoJSON Point
  const geoPoint: GeoPoint = {
    type: 'Point',
    coordinates: [params.location.lon, params.location.lat], // [longitud, latitud]
  };

  // 7. Obtener o crear daysheet del día actual
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: existingDaysheet, error: daysheetQueryError } = await supabase
    .from('daysheets')
    .select('id')
    .eq('collector_id', user.id)
    .eq('work_date', today)
    .single();

  let daysheetId: string;

  if (daysheetQueryError || !existingDaysheet) {
    // Crear nuevo daysheet si no existe
    const { data: newDaysheet, error: createDaysheetError } = await supabase
      .from('daysheets')
      .insert({
        collector_id: user.id,
        work_date: today,
        status: 'draft',
        expected_cash: '0',
        total_expenses: '0',
        cash_variance: '0',
      } as any)
      .select('id')
      .single();

    if (createDaysheetError || !newDaysheet) {
      return { error: 'Error al crear hoja de día.' };
    }
    daysheetId = (newDaysheet as any).id;
  } else {
    daysheetId = (existingDaysheet as any).id;
  }

  // 8. Insertar evento de cobro
  const { data: collectionEvent, error: insertError } = await supabase
    .from('collection_events')
    .insert({
      loan_id: params.loanId,
      collector_id: user.id,
      daysheet_id: daysheetId,
      amount: params.amount,
      event_type: 'full_payment', // Por defecto, el DLE determinará el tipo real
      location: geoPoint as any, // Supabase maneja GeoJSON automáticamente
      photo_url: photoUrl,
      notes: params.notes || null,
      collected_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single();

  if (insertError || !collectionEvent) {
    console.error('Error al insertar evento de cobro:', insertError);
    return { error: 'Error al registrar pago. Intente de nuevo.' };
  }

  // 9. Actualizar expected_cash del daysheet
  const { error: updateDaysheetError } = await supabase.rpc(
    'update_daysheet_expected_cash',
    ({
      p_daysheet_id: daysheetId,
      p_amount: params.amount,
    } as any)
  );

  if (updateDaysheetError) {
    console.error('Error al actualizar daysheet:', updateDaysheetError);
    // No fallar si esto falla, el evento ya se registró
  }

  return {
    success: true,
    collectionEventId: (collectionEvent as any).id,
    message: 'Pago registrado exitosamente',
  };
}
