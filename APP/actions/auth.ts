'use server';

/**
 * Server Actions - Authentication
 * Todas las operaciones de autenticación se ejecutan en el servidor
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Action: Login con email y password
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validación básica
  if (!email || !password) {
    return {
      error: 'Email y contraseña son requeridos',
    };
  }

  const supabase = await createClient();

  // Intentar login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error);
    return {
      error: 'Credenciales inválidas',
    };
  }

  // Obtener el rol del usuario desde public.users
  type RoleRow = { role: 'owner' | 'accountant' | 'collector' };
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user?.id)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user role:', userError);
    await supabase.auth.signOut();
    return {
      error: 'Error al obtener información del usuario',
    };
  }

  // Redirigir según el rol
  const role = (userData as RoleRow).role as 'owner' | 'accountant' | 'collector';

  switch (role) {
    case 'owner':
      return redirect('/owner');
    case 'accountant':
      return redirect('/accounting');
    case 'collector':
      return redirect('/collector');
    default:
      return {
        error: 'Rol de usuario no válido',
      };
  }
}

/**
 * Action: Logout
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Action: Obtener usuario actual
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Obtener datos completos del usuario desde public.users
  type UserRow = {
    role?: 'owner' | 'accountant' | 'collector';
    full_name?: string | null;
    phone?: string | null;
  };

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    return null;
  }

  const typedUser = userData as UserRow;

  return {
    ...user,
    role: typedUser.role,
    full_name: typedUser.full_name,
    phone: typedUser.phone,
  };
}
