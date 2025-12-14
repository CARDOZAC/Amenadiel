'use client';

/**
 * Componente: Botón de Logout
 * Client component para manejar el formulario de logout
 */

import { logout } from '@/app/actions/auth';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm hover:underline px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition"
      >
        Cerrar Sesión
      </button>
    </form>
  );
}
