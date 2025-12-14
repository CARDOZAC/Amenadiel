/**
 * Página de Login
 * Formulario simple para autenticación con email/password
 */

import { login } from '@/app/actions/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sistema DLE
            </h1>
            <p className="text-gray-600">
              Gestión de Microcrédito Diario
            </p>
          </div>

          {/* Form */}
          <form action={login}>
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="usuario@amenadiel.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>

          {/* Usuarios de Prueba (solo para desarrollo) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              Usuarios de prueba (contraseña: <code className="bg-gray-100 px-1 rounded">12345</code>):
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-purple-50 px-3 py-2 rounded">
                <span className="font-medium text-purple-700">Patrón:</span>
                <code className="text-purple-900">patron@amenadiel.com</code>
              </div>
              <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded">
                <span className="font-medium text-green-700">Contador:</span>
                <code className="text-green-900">contador@amenadiel.com</code>
              </div>
              <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded">
                <span className="font-medium text-blue-700">Cobrador:</span>
                <code className="text-blue-900">cobrador@amenadiel.com</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sistema de Alto Rendimiento para Microcrédito
        </p>
      </div>
    </div>
  );
}
