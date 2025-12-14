export default function OwnerPage() {
  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Dashboard de KPIs - Solo Lectura</h2>
        <p className="text-gray-600 mb-6">
          Métricas críticas para decisiones de reinversión y evaluación de riesgo.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="border-2 border-dashed border-purple-300 rounded p-6">
            <h3 className="font-semibold mb-2 text-purple-700">
              Flujo Neto de Efectivo
            </h3>
            <p className="text-3xl font-bold text-gray-400">$0.00</p>
            <p className="text-sm text-gray-400 mt-2">Liquidez inmediata</p>
          </div>
          
          <div className="border-2 border-dashed border-purple-300 rounded p-6">
            <h3 className="font-semibold mb-2 text-purple-700">
              Tasa de Recaudo Efectivo (TRE)
            </h3>
            <p className="text-3xl font-bold text-gray-400">0%</p>
            <p className="text-sm text-gray-400 mt-2">
              Recuperación de capital
            </p>
          </div>
          
          <div className="border-2 border-dashed border-purple-300 rounded p-6">
            <h3 className="font-semibold mb-2 text-purple-700">
              Capital en Riesgo
            </h3>
            <p className="text-3xl font-bold text-gray-400">$0.00</p>
            <p className="text-sm text-gray-400 mt-2">Cartera en mora</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 rounded p-6">
            <h3 className="font-semibold mb-4">Cartera por Antigüedad de Mora</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>-1 a -5 días:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>6 a 12 días:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>13 a 19 días:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>20+ días:</span>
                <span>$0.00</span>
              </div>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded p-6">
            <h3 className="font-semibold mb-4">
              Concentración por Cobrador
            </h3>
            <p className="text-sm text-gray-400">
              Placeholder: Distribución del capital por cobrador para gestión
              de riesgo de personal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
