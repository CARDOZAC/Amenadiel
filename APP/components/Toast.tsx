'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

/**
 * Toast estilo iOS - Animación suave desde arriba
 */
export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);

    // Auto-cerrar
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
      `}
    >
      <div
        className={`
          ${colors[type]} text-white
          px-6 py-3 rounded-2xl shadow-lg
          flex items-center gap-3
          backdrop-blur-xl bg-opacity-95
          min-w-[280px] max-w-md
        `}
      >
        <span className="text-xl font-bold">{icons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Hook para manejar toasts fácilmente
 */
interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${1 + index * 5}rem` }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );

  return {
    showToast,
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    warning: (msg: string) => showToast(msg, 'warning'),
    info: (msg: string) => showToast(msg, 'info'),
    ToastContainer,
  };
}
