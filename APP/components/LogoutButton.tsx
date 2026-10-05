'use client';

/**
 * COMPONENTE: Botón de Logout V2
 * Rediseñado para la nueva UI. Ahora es un icono sutil para el header.
 */

import { logout } from '@/app/actions/auth';
import React from 'react';

// Icono de Salida (Logout)
const LogoutIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);


export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white-pure/10 hover:bg-white-pure/20 transition-colors duration-300"
      >
        <LogoutIcon className="w-5 h-5 text-white-soft/80 group-hover:text-white-pure transition-colors" />
        <span 
          className="absolute -top-10 left-1/2 -translate-x-1/2
                     px-3 py-1.5 text-xs font-semibold text-white-pure bg-blue-950/80 rounded-md
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap"
        >
          Cerrar Sesión
        </span>
      </button>
    </form>
  );
}