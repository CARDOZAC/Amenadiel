/**
 * Next.js Middleware - Route Protection and Role-Based Access Control
 *
 * Este middleware:
 * 1. Refresca la sesión de Supabase en cada request
 * 2. Protege rutas según el rol del usuario
 * 3. Redirige a la ruta correcta según el rol
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/lib/types/database.types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refrescar sesión (actualiza el token si está por expirar)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ========================================================================
  // Rutas públicas (no requieren autenticación)
  // ========================================================================
  const publicRoutes = ['/login', '/'];

  if (publicRoutes.includes(pathname)) {
    // Si el usuario ya está logueado y visita login o /, redirigir a su dashboard
    if (user) {
      const userRole = await getUserRole(supabase, user.id);
      const dashboardUrl = getDashboardForRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return response;
  }

  // ========================================================================
  // Rutas protegidas (requieren autenticación)
  // ========================================================================

  // Si no hay usuario, redirigir a login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Obtener el rol del usuario desde public.users
  const userRole = await getUserRole(supabase, user.id);

  if (!userRole) {
    // Si no se encuentra el rol, cerrar sesión y redirigir a login
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ========================================================================
  // Control de Acceso por Rol
  // ========================================================================

  // Reglas de acceso:
  // - owner: acceso a TODAS las rutas (solo lectura en algunas)
  // - accountant: acceso SOLO a /accounting
  // - collector: acceso SOLO a /collector

  if (pathname.startsWith('/collector')) {
    if (userRole !== 'collector' && userRole !== 'owner') {
      // Redirigir a su propio dashboard
      const dashboardUrl = getDashboardForRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  if (pathname.startsWith('/accounting')) {
    if (userRole !== 'accountant' && userRole !== 'owner') {
      const dashboardUrl = getDashboardForRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  if (pathname.startsWith('/owner')) {
    if (userRole !== 'owner') {
      const dashboardUrl = getDashboardForRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return response;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Obtiene el rol del usuario desde public.users
 */
async function getUserRole(
  supabase: any,
  userId: string
): Promise<'owner' | 'accountant' | 'collector' | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role as 'owner' | 'accountant' | 'collector';
}

/**
 * Retorna la URL del dashboard correspondiente al rol
 */
function getDashboardForRole(
  role: 'owner' | 'accountant' | 'collector' | null
): string {
  switch (role) {
    case 'owner':
      return '/owner';
    case 'accountant':
      return '/accounting';
    case 'collector':
      return '/collector';
    default:
      return '/login';
  }
}

// ============================================================================
// Configuración de Matcher
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
