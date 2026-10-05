'use client';

import { MetricCard, CompactMetric } from "@/app/components/MetricCard";
import { StatusBadge } from "@/app/components/StatusBadge";

/**
 * DASHBOARD DEL INVERSIONISTA - Enfoque: Control Total del Negocio
 *
 * Pensado para un inversionista de gota a gota que necesita:
 * - Control de flujo de caja en tiempo real
 * - ROI y rentabilidad clara
 * - Gestión de riesgo y morosidad
 * - Rendimiento de cobradores
 * - Proyecciones de negocio
 *
 * Estilo: iOS-inspired, directo al grano, sin fluff
 */

export default function OwnerDashboard() {
  // TODO: Reemplazar con datos reales de Supabase
  const mockData = {
    cashFlow: {
      expected: 125000,
      collected: 98500,
      pending: 26500,
      percentage: 78.8,
    },
    roi: {
      invested: 500000,
      returned: 625000,
      profit: 125000,
      percentage: 25,
      monthlyRate: 2.1,
    },
    risk: {
      total: 45000,
      overdue1_7: 12000,
      overdue8_15: 18000,
      overdue16plus: 15000,
      criticalClients: 8,
    },
    collectors: [
      { name: 'Juan Pérez', collected: 38500, expected: 45000, rate: 85.6, delays: 3 },
      { name: 'María García', collected: 42000, expected: 48000, rate: 87.5, delays: 1 },
      { name: 'Carlos Ruiz', collected: 18000, expected: 32000, rate: 56.3, delays: 12 },
    ],
    alerts: [
      { type: 'critical', message: '8 clientes con más de 15 días de atraso' },
      { type: 'warning', message: 'Cobrador Carlos Ruiz bajo 60% de efectividad' },
      { type: 'info', message: 'Ruta Norte excedió meta diaria en 15%' },
    ],
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Status Badge - Online/Offline/Syncing */}
      <StatusBadge />

      {/* Header con resumen ejecutivo */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Inversionista</h1>
            <p className="text-blue-100 text-sm mt-1">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition-all">
            Exportar Reporte
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-blue-100 text-xs mb-1">Recaudado Hoy</p>
            <p className="text-2xl font-bold">${mockData.cashFlow.collected.toLocaleString()}</p>
            <p className="text-xs text-blue-200 mt-1">{mockData.cashFlow.percentage}% de meta</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-blue-100 text-xs mb-1">ROI Mensual</p>
            <p className="text-2xl font-bold">{mockData.roi.monthlyRate}%</p>
            <p className="text-xs text-emerald-300 mt-1">+0.3% vs mes anterior</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-blue-100 text-xs mb-1">En Riesgo</p>
            <p className="text-2xl font-bold">${mockData.risk.total.toLocaleString()}</p>
            <p className="text-xs text-red-300 mt-1">{mockData.risk.criticalClients} clientes críticos</p>
          </div>
        </div>
      </div>

      {/* Alertas Críticas */}
      {mockData.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 px-1">⚠️ Requieren Atención</h2>
          {mockData.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`
                p-4 rounded-2xl border-l-4 flex items-start gap-3
                ${alert.type === 'critical' ? 'bg-red-50 border-red-500' : ''}
                ${alert.type === 'warning' ? 'bg-amber-50 border-amber-500' : ''}
                ${alert.type === 'info' ? 'bg-blue-50 border-blue-500' : ''}
              `}
            >
              <span className="text-xl">
                {alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'}
              </span>
              <p className="text-sm font-medium text-gray-900 flex-1">{alert.message}</p>
              <button className="text-xs text-gray-600 hover:text-gray-900">Ver →</button>
            </div>
          ))}
        </div>
      )}

      {/* Métricas Principales - Estilo iOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Capital en la Calle"
          value={`$${mockData.roi.invested.toLocaleString()}`}
          subtitle="Total prestado activo"
          icon="💰"
          color="blue"
        />
        <MetricCard
          title="Retorno Total"
          value={`$${mockData.roi.returned.toLocaleString()}`}
          subtitle="Principal + intereses"
          trend="up"
          trendValue={`+${mockData.roi.percentage}%`}
          icon="📈"
          color="green"
        />
        <MetricCard
          title="Ganancia Neta"
          value={`$${mockData.roi.profit.toLocaleString()}`}
          subtitle="Después de gastos"
          trend="up"
          trendValue={`ROI ${mockData.roi.percentage}%`}
          icon="✨"
          color="purple"
        />
      </div>

      {/* Flujo de Caja HOY */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Flujo de Efectivo Hoy</h2>
          <span className="text-2xl font-bold text-gray-900">
            ${mockData.cashFlow.collected.toLocaleString()}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso de meta diaria</span>
            <span className="font-bold text-gray-900">{mockData.cashFlow.percentage}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${mockData.cashFlow.percentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <CompactMetric
            label="Esperado Hoy"
            value={`$${mockData.cashFlow.expected.toLocaleString()}`}
            icon="🎯"
            color="#3b82f6"
          />
          <CompactMetric
            label="Recaudado"
            value={`$${mockData.cashFlow.collected.toLocaleString()}`}
            icon="✅"
            color="#10b981"
          />
          <CompactMetric
            label="Pendiente"
            value={`$${mockData.cashFlow.pending.toLocaleString()}`}
            icon="⏳"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Cartera en Riesgo */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cartera en Riesgo</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-yellow-50 rounded-2xl">
            <p className="text-xs text-gray-600 mb-1">1-7 días</p>
            <p className="text-xl font-bold text-gray-900">
              ${(mockData.risk.overdue1_7 / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-2xl">
            <p className="text-xs text-gray-600 mb-1">8-15 días</p>
            <p className="text-xl font-bold text-gray-900">
              ${(mockData.risk.overdue8_15 / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-2xl">
            <p className="text-xs text-gray-600 mb-1">+16 días</p>
            <p className="text-xl font-bold text-red-600">
              ${(mockData.risk.overdue16plus / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-900">
            {mockData.risk.criticalClients} clientes requieren acción inmediata
          </p>
          <button className="mt-2 text-sm text-red-600 font-semibold hover:text-red-700">
            Ver lista completa →
          </button>
        </div>
      </div>

      {/* Rendimiento de Cobradores */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Rendimiento de Cobradores</h2>

        <div className="space-y-3">
          {mockData.collectors.map((collector, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {collector.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{collector.name}</p>
                    <p className="text-xs text-gray-500">
                      ${collector.collected.toLocaleString()} / ${collector.expected.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${collector.rate >= 80 ? 'text-green-600' : collector.rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {collector.rate}%
                  </p>
                  <p className="text-xs text-gray-500">{collector.delays} atrasos</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${collector.rate >= 80 ? 'bg-green-500' : collector.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${collector.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proyección Next 7 días */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Proyección - Próximos 7 Días</h2>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => {
            const height = Math.random() * 60 + 40; // Mock data
            return (
              <div key={idx} className="text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-600">{day}</p>
                <p className="text-xs text-gray-500">${(15 + idx * 2)}k</p>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-900">
            Entrada proyectada: $892,500 en los próximos 7 días
          </p>
        </div>
      </div>
    </div>
  );
}