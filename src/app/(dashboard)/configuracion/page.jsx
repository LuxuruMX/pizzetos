"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { toast } from "react-toastify";
import { POS_CONFIG } from "@/config/posConfig";
import { IoSave } from "react-icons/io5";

export default function ConfiguracionPage() {
    const [lockViewport, setLockViewport] = useState(true);
    const [printerSize, setPrinterSize] = useState("58mm");

    useEffect(() => {
        // Cargar valores iniciales actuales (que ya vienen del localStorage gracias al cambio en posConfig)
        setLockViewport(POS_CONFIG.lockViewport);
        setPrinterSize(POS_CONFIG.PRINTER_SIZE);
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem("POS_LOCK_VIEWPORT", lockViewport);
            localStorage.setItem("POS_PRINTER_SIZE", printerSize);

            toast.success("Configuración guardada. Recargando...");

            // Pequeño delay para que se vea el toast antes de refrescar
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración");
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Card>
                <div className="mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Configuración del POS
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Ajustes locales de la terminal
                    </p>
                </div>

                <div className="space-y-6">

                    {/* Opción 1: Viewport Lock */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-gray-800">Bloquear Altura (Viewport Lock)</h3>
                            <p className="text-sm text-gray-600">
                                Evita que la pantalla se desplace verticalmente (recomendado para POS).
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={lockViewport}
                                onChange={(e) => setLockViewport(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Opción 2: Printer Size */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-gray-800">Tamaño de Impresión</h3>
                            <p className="text-sm text-gray-600">
                                Ancho del papel para los tickets.
                            </p>
                        </div>
                        <select
                            value={printerSize}
                            onChange={(e) => setPrinterSize(e.target.value)}
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border text-gray-600"
                        >
                            <option value="58mm">58mm</option>
                            <option value="80mm">80mm</option>
                        </select>
                    </div>

                    {/* Botón Guardar */}
                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded transition-colors shadow"
                        >
                            <IoSave size={20} />
                            Guardar Cambios
                        </button>
                    </div>

                </div>
            </Card>

            <p className="text-center text-gray-400 text-xs mt-8">
                Nota: Estas configuraciones se guardan solo en este navegador.
            </p>
        </div>
    );
}
