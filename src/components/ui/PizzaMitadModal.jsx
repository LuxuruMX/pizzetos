
import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaPizzaSlice } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

const PizzaMitadModal = ({ isOpen, onClose, tamanos, especialidades, onConfirmar }) => {
    const [tamanoSeleccionado, setTamanoSeleccionado] = useState(null);
    const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState([]);

    if (!isOpen) return null;

    const handleToggleEspecialidad = (especialidad) => {
        setEspecialidadesSeleccionadas(prev => {
            const index = prev.findIndex(e => {
                if (e.id_esp && especialidad.id_esp) {
                    return e.id_esp === especialidad.id_esp;
                }
                return e.nombre === especialidad.nombre;
            });

            if (index >= 0) {
                // Si ya está seleccionada, quitarla
                return prev.filter((_, i) => i !== index);
            } else {
                // Si hay menos de 2, agregarla
                if (prev.length < 2) {
                    return [...prev, especialidad];
                } else {
                    // Si ya hay 2, reemplazar la primera (FIFO rotation) o avisar?
                    // Mejor avisar para no confundir o reemplazar la última? 
                    // UX POS: Shift items. [A, B] -> Click C -> [B, C]
                    return [prev[1], especialidad];
                }
            }
        });
    };

    const handleConfirmar = () => {
        if (!tamanoSeleccionado) {
            showToast.error('Por favor, selecciona un tamaño de pizza');
            return;
        }
        if (especialidadesSeleccionadas.length !== 2) {
            showToast.error('Por favor, selecciona 2 especialidades');
            return;
        }

        onConfirmar({
            tamano: tamanoSeleccionado.id_tamañop,
            // Enviar solo NOMBRES o IDs dependiendo de lo que el backend espere en "ingredientes"
            // El usuario dijo "en lugar de enviar ingredientes, seran especialidades"
            // Y el payload example mostraba ingredientes: [0, 0] (ids)
            // Usar id_esp que viene de la API
            especialidades: especialidadesSeleccionadas, // Enviar objetos completos para que useCartEdit extraiga IDs y nombres
            especialidadesNombres: especialidadesSeleccionadas.map(e => e.nombre),
            precio: parseFloat(tamanoSeleccionado.precio),
            nombreTamano: tamanoSeleccionado.tamano
        });

        // Reset state
        setTamanoSeleccionado(null);
        setEspecialidadesSeleccionadas([]);
    };

    const handleCancelar = () => {
        setTamanoSeleccionado(null);
        setEspecialidadesSeleccionadas([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-orange-600">
                    <div className="flex items-center gap-3">
                        <FaPizzaSlice className="text-white text-3xl" />
                        <h2 className="text-2xl font-bold text-white">Mitades</h2>
                    </div>
                    <button
                        onClick={handleCancelar}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <IoClose className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Selection */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Tamaños Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-white z-10 py-2 border-b">
                                1. Selecciona el tamaño:
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {tamanos.map((tamano) => {
                                    const isSelected = tamanoSeleccionado?.id_tamañop === tamano.id_tamañop;
                                    return (
                                        <button
                                            key={tamano.id_tamañop}
                                            onClick={() => setTamanoSeleccionado(tamano)}
                                            className={`p-3 rounded-lg border-2 transition-all text-center ${isSelected
                                                ? 'border-red-500 bg-red-50 shadow-md transform scale-105'
                                                : 'border-gray-200 bg-gray-50 hover:border-red-300'
                                                }`}
                                        >
                                            <div className="font-bold text-gray-800">
                                                {tamano.tamano}
                                            </div>
                                            <div className="text-red-600 font-bold">
                                                ${parseFloat(tamano.precio).toFixed(2)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Especialidades Section */}
                        <div>
                            <div className="sticky top-0 bg-white z-10 py-2 border-b flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    2. Selecciona 2 especialidades:
                                </h3>
                                <div className="text-sm font-bold text-gray-600">
                                    Seleccionadas: <span className={especialidadesSeleccionadas.length === 2 ? 'text-green-600' : 'text-red-600'}>
                                        {especialidadesSeleccionadas.length}/2
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-4">
                                {especialidades.map((esp) => {
                                    const index = especialidadesSeleccionadas.findIndex(e => {
                                        if (e.id_esp && esp.id_esp) {
                                            return e.id_esp === esp.id_esp;
                                        }
                                        return e.nombre === esp.nombre;
                                    });
                                    const isSelected = index >= 0;

                                    return (
                                        <button
                                            key={esp.id_esp || esp.nombre} // Fallback to name if id missing
                                            onClick={() => handleToggleEspecialidad(esp)}
                                            className={`p-3 rounded-lg border-2 transition-all text-sm relative overflow-hidden ${isSelected
                                                ? 'border-red-500 bg-red-50 text-red-800 font-bold shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-bl-lg font-bold">
                                                    #{index + 1}
                                                </div>
                                            )}
                                            {esp.nombre}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary (Desktop) or Bottom (Mobile) */}
                    <div className="w-full lg:w-80 bg-gray-50 rounded-xl p-6 border h-fit sticky top-0">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Resumen</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Tamaño</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {tamanoSeleccionado ? tamanoSeleccionado.tamano : 'No seleccionado'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Especialidades</p>
                                <div className="space-y-2 mt-1">
                                    <div className={`p-2 rounded border ${especialidadesSeleccionadas[0] ? 'bg-white border-green-200' : 'bg-gray-100 border-dashed border-gray-300'}`}>
                                        <span className="text-xs font-bold text-gray-400 mr-2">1/2</span>
                                        <span className="font-medium text-gray-800">
                                            {especialidadesSeleccionadas[0]?.nombre || 'Selecciona...'}
                                        </span>
                                    </div>
                                    <div className={`p-2 rounded border ${especialidadesSeleccionadas[1] ? 'bg-white border-green-200' : 'bg-gray-100 border-dashed border-gray-300'}`}>
                                        <span className="text-xs font-bold text-gray-400 mr-2">2/2</span>
                                        <span className="font-medium text-gray-800">
                                            {especialidadesSeleccionadas[1]?.nombre || 'Selecciona...'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-gray-600 font-medium">Total</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${tamanoSeleccionado ? parseFloat(tamanoSeleccionado.precio).toFixed(2) : '0.00'}
                                    </p>
                                </div>

                                <button
                                    onClick={handleConfirmar}
                                    disabled={!tamanoSeleccionado || especialidadesSeleccionadas.length !== 2}
                                    className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg ${(!tamanoSeleccionado || especialidadesSeleccionadas.length !== 2)
                                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                        : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transform hover:-translate-y-1'
                                        }`}
                                >
                                    Agregar al Pedido
                                </button>
                            </div>

                            <button
                                onClick={handleCancelar}
                                className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PizzaMitadModal;
