'use client';

import React, { useState, useEffect, useRef } from "react";
import GpsIcon from "@/app/components/icons/GpsIcon";
import CameraIcon from "@/app/components/icons/CameraIcon";
import Spinner from "@/app/components/Spinner";
import { StatusBadge } from "@/app/components/StatusBadge";
import { useToast } from "@/app/components/Toast";
import { useGeolocation } from "@/app/hooks/useGeolocation";
import { useImageCapture } from "@/app/hooks/useImageCapture";
import { useSyncQueue } from "@/app/hooks/useSyncQueue";
import { createCollectionEvent } from "@/app/actions/collection";

/**
 * PÁGINA COBRANZA V2 - Rediseño por Tobias van Schneider
 *
 * Experiencia de captura de datos optimizada para el campo (mobile-first).
 * Se enfoca en la velocidad, legibilidad y confirmación clara de las acciones.
 */

// --- SUB-COMPONENTES ---

// Animación de Éxito (Simulación de Lottie con CSS)
const SuccessAnimation = () => (
    <div className="flex flex-col items-center justify-center">
        <svg className="w-24 h-24" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
        <p className="mt-4 text-lg font-semibold text-blue-950">Pago Registrado Exitosamente</p>
        <style jsx>{`
            .checkmark__circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 3;
                stroke-miterlimit: 10;
                stroke: #1D4ED8; /* blue-700 */
                animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            .checkmark__check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                stroke-width: 4;
                stroke: #1D4ED8;
                animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }
            @keyframes stroke {
                100% { stroke-dashoffset: 0; }
            }
        `}</style>
    </div>
);


const ProgressBar = ({ step, totalSteps }: { step: number; totalSteps: number }) => (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${(step / totalSteps) * 100}%` }}
      ></div>
    </div>
);


// --- COMPONENTE PRINCIPAL ---

export default function CollectorPageV2() {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const totalSteps = 3;

    // Datos del formulario
    const [formData, setFormData] = useState({
        clientId: 'demo-client-123', // Mock por ahora
        clientName: 'Cliente Ejemplo 1', // Mock
        loanId: 'demo-loan-456', // Mock
        amount: '',
        notes: '',
    });

    // Hooks para GPS, Foto, Sync y Toast
    const gps = useGeolocation();
    const photo = useImageCapture();
    const { isOnline, addToQueue } = useSyncQueue();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Resetear el formulario después de la animación
    useEffect(() => {
        if (submitted) {
            const timer = setTimeout(() => {
                setSubmitted(false);
                setStep(1);
                setFormData({ clientId: 'demo-client-123', clientName: 'Cliente Ejemplo 1', amount: '', notes: '' });
                gps.reset();
                photo.reset();
                setErrorMessage(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [submitted, gps, photo]);

    const handleNext = () => {
        // Validación antes de pasar al siguiente paso
        if (step === 2) {
            setErrorMessage(null);
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setErrorMessage('Ingrese un monto válido mayor a 0');
                return;
            }
            if (!gps.coordinates) {
                setErrorMessage('Capture la ubicación GPS antes de continuar');
                return;
            }
            if (!photo.file) {
                setErrorMessage('Tome una foto del recibo antes de continuar');
                return;
            }
        }
        setStep(prev => Math.min(prev + 1, totalSteps));
    };

    const handleBack = () => {
        setErrorMessage(null);
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrorMessage(null);

        try {
            if (!gps.coordinates || !photo.file) {
                throw new Error('Faltan datos requeridos');
            }

            // Convertir foto a base64 para almacenamiento offline
            const photoBase64 = await fileToBase64(photo.file);

            // Si hay conexión, intentar enviar directamente
            if (isOnline) {
                try {
                    const result = await createCollectionEvent({
                        clientId: formData.clientId,
                        loanId: formData.loanId,
                        amount: parseFloat(formData.amount),
                        latitude: gps.coordinates.lat,
                        longitude: gps.coordinates.lon,
                        photo: photo.file,
                        notes: formData.notes || undefined,
                    });

                    if (!result.success) {
                        throw new Error(result.error || 'Error al guardar');
                    }

                    toast.success('Pago registrado exitosamente');
                    setSubmitted(true);
                } catch (error) {
                    // Si falla online, guardar offline
                    toast.warning('Guardando offline, se sincronizará después');
                    await saveOffline(photoBase64);
                    setSubmitted(true);
                }
            } else {
                // Sin conexión: guardar offline directamente
                toast.info('Sin conexión - Guardado offline');
                await saveOffline(photoBase64);
                setSubmitted(true);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Error al guardar pago');
            toast.error('Error al procesar el pago');
            setSubmitting(false);
        }
    };

    // Helper para guardar offline
    const saveOffline = async (photoBase64: string) => {
        if (!gps.coordinates) return;

        await addToQueue({
            clientId: formData.clientId,
            loanId: formData.loanId,
            amount: parseFloat(formData.amount),
            latitude: gps.coordinates.lat,
            longitude: gps.coordinates.lon,
            photoBase64,
            notes: formData.notes || undefined,
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Toast Container */}
            <toast.ToastContainer />

            {/* Status Badge */}
            <StatusBadge />

            <div className="bg-white-soft rounded-2xl shadow-lg border border-white-pure/50">
                {submitted ? (
                    <div className="p-8 md:p-12 text-center">
                        <SuccessAnimation />
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-blue-950">Registro de Pago</h2>
                            <p className="text-sm text-slate-500 mt-1">Paso {step} de {totalSteps}</p>
                            <div className="mt-4">
                                <ProgressBar step={step} totalSteps={totalSteps} />
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Paso 1: Seleccionar Cliente */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-blue-900">1. Seleccionar Cliente</h3>
                                    <input type="search" placeholder="Buscar cliente por nombre o ID..." className="w-full px-4 py-3 bg-white-blue rounded-lg text-blue-950 placeholder:text-slate-400 shadow-neumorphic-sm-inset focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-lg border border-blue-200 cursor-pointer hover:border-blue-500 transition-colors">
                                            <div>
                                                <p className="font-semibold text-blue-800">Cliente Ejemplo 1</p>
                                                <p className="text-xs text-slate-500">ID: 12345</p>
                                            </div>
                                            <span className="text-sm font-mono text-blue-900">$150.00</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Paso 2: Ingresar Monto y Capturas */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-blue-900">2. Registrar Monto</h3>
                                    <div>
                                        <label htmlFor="amount" className="text-sm font-medium text-slate-600">Monto Recaudado</label>
                                        <input
                                            type="number"
                                            id="amount"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full mt-2 p-4 text-center font-mono text-5xl bg-white-blue rounded-lg text-blue-950 placeholder:text-slate-300 shadow-neumorphic-sm-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Botones GPS y Foto */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Botón GPS */}
                                        <button
                                            type="button"
                                            onClick={gps.capture}
                                            disabled={gps.loading}
                                            className={`relative w-full flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                                                gps.coordinates
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                            }`}
                                        >
                                            {gps.loading ? (
                                                <Spinner size="md" className="text-blue-600" />
                                            ) : gps.coordinates ? (
                                                <span className="text-2xl">✓</span>
                                            ) : (
                                                <GpsIcon className="w-6 h-6 text-slate-500" />
                                            )}
                                            <span className="text-sm">
                                                {gps.loading ? 'Capturando...' : gps.coordinates ? 'GPS Capturado' : 'Capturar GPS'}
                                            </span>
                                        </button>

                                        {/* Botón Foto */}
                                        <label
                                            className={`relative w-full flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 cursor-pointer ${
                                                photo.file
                                                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                            }`}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={photo.handleFileSelect}
                                                className="hidden"
                                            />
                                            {photo.uploading ? (
                                                <Spinner size="md" className="text-blue-600" />
                                            ) : photo.preview ? (
                                                <img
                                                    src={photo.preview}
                                                    alt="Preview"
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            ) : (
                                                <CameraIcon className="w-6 h-6 text-slate-500" />
                                            )}
                                            <span className="text-sm">
                                                {photo.uploading ? 'Procesando...' : photo.file ? 'Foto Tomada' : 'Tomar Foto'}
                                            </span>
                                        </label>
                                    </div>

                                    {/* Errores de GPS o Foto */}
                                    {gps.error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-700">{gps.error}</p>
                                        </div>
                                    )}
                                    {photo.error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-700">{photo.error}</p>
                                        </div>
                                    )}

                                    {/* Campo de notas opcional */}
                                    <div>
                                        <label htmlFor="notes" className="text-sm font-medium text-slate-600">Notas (opcional)</label>
                                        <textarea
                                            id="notes"
                                            placeholder="Agregar comentarios..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            className="w-full mt-2 px-4 py-3 bg-white-blue rounded-lg text-blue-950 placeholder:text-slate-400 shadow-neumorphic-sm-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Paso 3: Confirmación */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-blue-950 text-center">3. Confirmar Registro</h3>

                                    {/* Resumen del Pago */}
                                    <div className="p-6 bg-blue-50/70 rounded-xl border border-blue-200">
                                        <p className="text-slate-600">Cliente:</p>
                                        <p className="font-semibold text-lg text-blue-900">{formData.clientName}</p>

                                        <p className="text-slate-600 mt-4">Monto:</p>
                                        <p className="font-mono text-4xl font-bold text-blue-950">${formData.amount}</p>

                                        {/* GPS Capturado */}
                                        {gps.coordinates && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <p className="text-slate-600 text-sm">Ubicación GPS:</p>
                                                <p className="font-mono text-xs text-blue-700">
                                                    Lat: {gps.coordinates.lat.toFixed(6)}, Lon: {gps.coordinates.lon.toFixed(6)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Preview de Foto */}
                                        {photo.preview && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <p className="text-slate-600 text-sm mb-2">Foto del recibo:</p>
                                                <img
                                                    src={photo.preview}
                                                    alt="Preview del recibo"
                                                    className="w-full max-w-xs mx-auto rounded-lg border-2 border-blue-300"
                                                />
                                            </div>
                                        )}

                                        {/* Notas */}
                                        {formData.notes && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <p className="text-slate-600 text-sm">Notas:</p>
                                                <p className="text-blue-900 text-sm mt-1">{formData.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-400 text-center">
                                        Revise los datos antes de confirmar. Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Navegación del Formulario */}
                        <div className="p-6 border-t border-slate-100">
                            {/* Mensaje de Error */}
                            {errorMessage && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    disabled={step === 1 || submitting}
                                    className="px-6 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                                >
                                    Atrás
                                </button>
                                {step < totalSteps && (
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-2 rounded-lg font-semibold text-white-pure bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                    >
                                        Siguiente
                                    </button>
                                )}
                                {step === totalSteps && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white-pure bg-gradient-primary transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50"
                                    >
                                        {submitting && <Spinner size="sm" className="text-white-pure" />}
                                        {submitting ? 'Guardando...' : 'Confirmar y Guardar Pago'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Utilidad para convertir File a base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}