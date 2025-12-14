export default function CollectorPage() {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Registro Rápido de Pagos</h2>
        <p className="text-gray-600 mb-6">
          Interfaz para captura rápida de pagos post-jornada.
        </p>
        
        <div className="space-y-4 border-2 border-dashed border-gray-300 rounded p-8 text-center">
          <p className="text-gray-500">PLACEHOLDER</p>
          <p className="text-sm text-gray-400">
            Funcionalidad pendiente:
          </p>
          <ul className="text-sm text-gray-400 text-left max-w-md mx-auto">
            <li>• Seleccionar Cliente</li>
            <li>• Ingresar Monto Recaudado</li>
            <li>• Captura de Geolocalización (GPS)</li>
            <li>• Timestamp automático</li>
            <li>• Confirmación de pago</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
