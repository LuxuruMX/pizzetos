import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaTimes } from 'react-icons/fa';

const DeliveryPaymentModal = ({ isOpen, onClose, total, onConfirm }) => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState(1); // 1: Transferencia, 2: Tarjeta, 3: Efectivo
    const [referenciaInput, setReferenciaInput] = useState('');
    const [cantidadEfectivo, setCantidadEfectivo] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMetodoSeleccionado(1);
            setReferenciaInput('');
            setCantidadEfectivo('');
        }
    }, [isOpen]);

    const metodosPago = [
        { id: 1, nombre: 'Transferencia', icon: <FaExchangeAlt />, descripcion: 'Pago inmediato con referencia' },
        { id: 2, nombre: 'Tarjeta', icon: <FaCreditCard />, descripcion: 'Llevar terminal' },
        { id: 3, nombre: 'Efectivo', icon: <FaMoneyBillWave />, descripcion: 'Llevar cambio' },
    ];

    const handleConfirmar = () => {
        // Validaciones según el método seleccionado
        if (metodoSeleccionado === 1) {
            // Transferencia: requiere referencia
            if (!referenciaInput.trim()) {
                alert('Por favor ingresa el número de referencia de la transferencia');
                return;
            }
        } else if (metodoSeleccionado === 3) {
            // Efectivo: requiere cantidad con la que pagará
            const cantidad = parseFloat(cantidadEfectivo);
            if (isNaN(cantidad) || cantidad <= 0) {
                alert('Por favor ingresa una cantidad válida');
                return;
            }
            if (cantidad < total) {
                alert(`La cantidad debe ser mayor o igual al total ($${total.toFixed(2)})`);
                return;
            }
        }

        // Construir objeto de pago según el método
        let pagoData;

        if (metodoSeleccionado === 1) {
            // Transferencia: pago completo con referencia
            pagoData = {
                id_metpago: 1,
                monto: total,
                referencia: referenciaInput.trim()
            };
        } else if (metodoSeleccionado === 2) {
            // Tarjeta: solo indicar que es tarjeta, sin referencia
            pagoData = {
                id_metpago: 2,
                monto: total,
                referencia: ''
            };
        } else if (metodoSeleccionado === 3) {
            // Efectivo: cantidad con la que pagará en referencia
            pagoData = {
                id_metpago: 3,
                monto: total,
                referencia: cantidadEfectivo
            };
        }

        onConfirm(pagoData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Método de Pago - Domicilio</h2>
                    <button onClick={onClose} className="text-white hover:text-red-200 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 text-center bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-sm">Total de la orden</p>
                        <p className="text-4xl font-bold text-gray-900">${total.toFixed(2)}</p>
                    </div>

                    {/* Selector de Método */}
                    <div className="space-y-3 mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Selecciona el método de pago:</p>
                        {metodosPago.map((metodo) => (
                            <button
                                key={metodo.id}
                                onClick={() => setMetodoSeleccionado(metodo.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${metodoSeleccionado === metodo.id
                                        ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-200'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`text-2xl ${metodoSeleccionado === metodo.id ? 'text-yellow-600' : 'text-gray-400'}`}>
                                    {metodo.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className={`font-semibold ${metodoSeleccionado === metodo.id ? 'text-yellow-700' : 'text-gray-700'}`}>
                                        {metodo.nombre}
                                    </div>
                                    <div className="text-xs text-gray-500">{metodo.descripcion}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${metodoSeleccionado === metodo.id
                                        ? 'border-yellow-500 bg-yellow-500'
                                        : 'border-gray-300'
                                    }`}>
                                    {metodoSeleccionado === metodo.id && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Campos condicionales según el método */}
                    {metodoSeleccionado === 1 && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Número de Referencia *
                            </label>
                            <input
                                type="text"
                                value={referenciaInput}
                                onChange={(e) => setReferenciaInput(e.target.value)}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                placeholder="Ej: REF123456789"
                            />
                            <p className="text-xs text-blue-600 mt-2">
                                Ingresa el número de referencia de la transferencia
                            </p>
                        </div>
                    )}

                    {metodoSeleccionado === 2 && (
                        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-purple-900">
                                <strong>Nota:</strong> Se enviará la terminal con el repartidor para que el cliente pague con tarjeta al recibir su pedido.
                            </p>
                        </div>
                    )}

                    {metodoSeleccionado === 3 && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-green-900 mb-2">
                                ¿Con cuánto va a pagar el cliente? *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                                <input
                                    type="number"
                                    value={cantidadEfectivo}
                                    onChange={(e) => setCantidadEfectivo(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                                    placeholder="0.00"
                                    min={total}
                                    step="0.01"
                                />
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                                Ingresa la cantidad con la que pagará para calcular el cambio
                            </p>
                            {cantidadEfectivo && parseFloat(cantidadEfectivo) >= total && (
                                <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                                    <strong>Cambio a entregar:</strong> ${(parseFloat(cantidadEfectivo) - total).toFixed(2)}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleConfirmar}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                    >
                        Confirmar y Enviar Orden
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryPaymentModal;
