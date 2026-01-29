import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaPizzaSlice } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

const CustomPizzaModal = ({ isOpen, onClose, tamanos, ingredientes, onConfirmar }) => {
    const [tamanoSeleccionado, setTamanoSeleccionado] = useState(null);
    const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);

    if (!isOpen) return null;

    const handleToggleIngrediente = (idIngrediente) => {
        setIngredientesSeleccionados(prev => {
            if (prev.includes(idIngrediente)) {
                return prev.filter(id => id !== idIngrediente);
            } else {
                return [...prev, idIngrediente];
            }
        });
    };

    const handleConfirmar = () => {
        if (!tamanoSeleccionado) {
            showToast.error('Por favor, selecciona un tamaño de pizza');
            return;
        }
        if (ingredientesSeleccionados.length === 0) {
            showToast.error('Por favor, selecciona al menos un ingrediente');
            return;
        }

        onConfirmar({
            tamano: tamanoSeleccionado.id_tamañop,
            ingredientes: ingredientesSeleccionados,
            precio: parseFloat(tamanoSeleccionado.precio),
            nombreTamano: tamanoSeleccionado.tamano
        });

        // Reset state
        setTamanoSeleccionado(null);
        setIngredientesSeleccionados([]);
    };

    const handleCancelar = () => {
        setTamanoSeleccionado(null);
        setIngredientesSeleccionados([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-orange-500 to-red-500">
                    <div className="flex items-center gap-3">
                        <FaPizzaSlice className="text-white text-3xl" />
                        <h2 className="text-2xl font-bold text-white">Pizza Por Ingrediente</h2>
                    </div>
                    <button
                        onClick={handleCancelar}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <IoClose className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Tamaños Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            1. Selecciona el tamaño:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {tamanos.map((tamano) => {
                                const isSelected = tamanoSeleccionado?.id_tamañop === tamano.id_tamañop;
                                return (
                                    <button
                                        key={tamano.id_tamañop}
                                        onClick={() => setTamanoSeleccionado(tamano)}
                                        className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                            ? 'border-orange-500 bg-orange-50 shadow-md'
                                            : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-800 text-lg mb-1">
                                            {tamano.tamano}
                                        </div>
                                        <div className="text-green-600 font-bold text-xl">
                                            ${parseFloat(tamano.precio).toFixed(2)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ingredientes Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            2. Selecciona los ingredientes:
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {ingredientes.map((ingrediente) => {
                                const isSelected = ingredientesSeleccionados.includes(ingrediente.id_ingrediente);
                                return (
                                    <button
                                        key={ingrediente.id_ingrediente}
                                        onClick={() => handleToggleIngrediente(ingrediente.id_ingrediente)}
                                        className={`p-3 rounded-lg border-2 transition-all text-sm ${isSelected
                                            ? 'border-orange-500 bg-orange-500 text-white shadow-md'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                                            }`}
                                    >
                                        {ingrediente.nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    {tamanoSeleccionado && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Tamaño seleccionado:</p>
                                    <p className="font-semibold text-gray-800">{tamanoSeleccionado.tamano}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Precio:</p>
                                    <p className="font-bold text-green-600 text-xl">
                                        ${parseFloat(tamanoSeleccionado.precio).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            {ingredientesSeleccionados.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">
                                        Ingredientes seleccionados: {ingredientesSeleccionados.length}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={handleCancelar}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
                    >
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomPizzaModal;
