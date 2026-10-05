'use client';

import React, { useState } from "react";
import AlertTriangleIcon from "@/app/components/icons/AlertTriangleIcon";
import CashIcon from "@/app/components/icons/CashIcon";

/**
 * PÁGINA CONTABILIDAD V2 - Rediseño por Tobias van Schneider
 *
 * Interfaz de misión crítica para el contador. El foco está en la acción
 * principal (Cierre Diario) y la rápida identificación de anomalías.
 */

// --- SUB-COMPONENTES ---

const StatCard = ({ title, value, icon: Icon, iconBg }: { title: string, value: string, icon: React.ElementType, iconBg: string }) => (
    <div className="bg-white-soft/80 p-6 rounded-2xl border border-white-pure/50 shadow-sm">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className="w-6 h-6 text-white-pure" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-blue-900/80">{title}</h4>
                <p className="font-mono text-2xl font-bold text-blue-950">{value}</p>
            </div>
        </div>
    </div>
);

const ExceptionsTable = () => {
    const exceptions = [
        { id: 'TRX-001', type: 'Faltante', amount: '$50.00', collector: 'Cobrador A', details: 'No reportado' },
        { id: 'TRX-002', type: 'Sobrante', amount: '$15.50', collector: 'Cobrador B', details: 'Cliente pagó de más' },
        { id: 'TRX-003', type: 'Faltante', amount: '$120.00', collector: 'Cobrador A', details: 'Error en digitación' },
    ];

    return (
        <div className="bg-white-soft/80 rounded-2xl border border-white-pure/50 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-semibold text-blue-900">Auditoría de Excepciones</h4>
                <span className="text-xs font-bold text-crimson-600 bg-crimson-100 px-2 py-1 rounded-full">3 Anomalías Detectadas</span>
             </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-blue-900/70">
                        <th className="p-4 font-semibold">ID Transacción</th>
                        <th className="p-4 font-semibold">Tipo</th>
                        <th className="p-4 font-semibold">Monto</th>
                        <th className="p-4 font-semibold">Cobrador</th>
                        <th className="p-4 font-semibold">Detalles</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {exceptions.map((ex) => (
                        <tr key={ex.id} className="hover:bg-blue-50/50 transition-colors data-[type=faltante]:bg-crimson-50/50" data-type={ex.type.toLowerCase()}>
                            <td className="p-4 font-mono text-blue-950">{ex.id}</td>
                            <td className="p-4">
                                <span className={`font-semibold ${ex.type === 'Faltante' ? 'text-crimson-700' : 'text-green-700'}`}>
                                    {ex.type}
                                </span>
                            </td>
                            <td className="p-4 font-mono font-semibold">{ex.amount}</td>
                            <td className="p-4 text-blue-900">{ex.collector}</td>
                            <td className="p-4 text-slate-500">{ex.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};


const ConfirmationModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/30 backdrop-blur-sm">
            <div className="glass-card w-full max-w-lg p-8 m-4 text-center transform transition-all"
                 style={{ animation: 'fade-in 0.3s ease-out' }}
            >
                <AlertTriangleIcon className="w-16 h-16 text-crimson-500 mx-auto" />
                <h2 className="mt-6 text-2xl font-bold font-display text-blue-950">
                    Confirmación Requerida
                </h2>
                <p className="mt-2 text-blue-900/80">
                    Está a punto de ejecutar el <strong>Cierre Diario de Liquidación (DLE)</strong>.
                    Esta acción es irreversible y afectará todos los balances y carteras.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button onClick={onClose} className="px-8 py-3 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onClose} className="px-8 py-3 rounded-lg font-semibold text-white-pure bg-crimson-600 hover:bg-crimson-700 transition-colors shadow-lg shadow-crimson-500/20">
                        Sí, Ejecutar Cierre
                    </button>
                </div>
            </div>
             <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function AccountingPageV2() {
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    return (
        <>
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <div className="space-y-8">
                <div className="p-8 text-center bg-white-soft rounded-2xl border border-white-pure/50 shadow-sm">
                    <h2 className="text-xl font-semibold text-blue-900">Motor de Liquidación Diaria (DLE)</h2>
                    <p className="text-sm text-slate-500 mt-1 mb-6 max-w-xl mx-auto">
                        Esta es la acción más crítica del sistema. Al ejecutar el cierre, se consolidarán todas las transacciones del día, se actualizarán las carteras y se generarán los reportes financieros para el Patrón.
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="relative px-12 py-5 rounded-xl font-bold text-xl text-white-pure
                                   bg-crimson-600 hover:bg-crimson-700
                                   shadow-lg shadow-crimson-500/30 hover:shadow-xl hover:shadow-crimson-500/50
                                   transform hover:-translate-y-1 transition-all duration-300"
                    >
                        <span className="absolute inset-0 animate-pulse-glow rounded-xl"></span>
                        <span className="relative">EJECUTAR CIERRE DIARIO</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Recaudo Total Registrado" value="$1,850.75" icon={CashIcon} iconBg="bg-blue-600" />
                    <StatCard title="Total de Excepciones" value="$185.50" icon={AlertTriangleIcon} iconBg="bg-crimson-600" />
                </div>

                <ExceptionsTable />
            </div>
        </>
    );
}