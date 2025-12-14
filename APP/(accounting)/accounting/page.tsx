export default function AccountingPage() {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Panel de Auditoría y Cierre Diario</h2>
        <p className="text-gray-600 mb-6">
          Auditoría por excepción y ejecución del Motor de Liquidación Diaria (DLE).
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded p-6">
            <h3 className="font-semibold mb-2">Reporte de Excepciones</h3>
            <p className="text-sm text-gray-400">
              Placeholder: Discrepancias entre recaudo esperado vs. registrado
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded p-6">
            <h3 className="font-semibold mb-2">Cartera Vencida</h3>
            <p className="text-sm text-gray-400">
              Placeholder: Segmentación por rangos de mora
            </p>
          </div>
        </div>
        
        <div className="border-2 border-green-600 border-dashed rounded p-8 text-center">
          <button className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 cursor-not-allowed opacity-50">
            EJECUTAR CIERRE DIARIO (DLE)
          </button>
          <p className="text-sm text-gray-400 mt-4">
            Botón placeholder - ejecutará la liquidación diaria automática
          </p>
        </div>
      </div>
    </div>
  );
}
