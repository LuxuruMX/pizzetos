import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaTimes } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

const DeliveryPaymentModal = ({ isOpen, onClose, total, onConfirm }) => {
    // Usamos un objeto para tracking de selección: { 1: true, 3: true }
    const [selectedMethods, setSelectedMethods] = useState({ 2: true }); // Default: Tarjeta (ID 2)

    // Estado para montos a cobrar por cada método: { 1: 100, 2: 155 }
    const [amounts, setAmounts] = useState({});

    // Referencia solo para Transferencia (ID 1)
    const [referenciaInput, setReferenciaInput] = useState('');

    // Cantidad con la que paga (solo para Efectivo ID 3) - Para calcular cambio
    const [efectivoEntregado, setEfectivoEntregado] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset states
            setSelectedMethods({ 2: true }); // Default Tarjeta
            setAmounts({ 2: total }); // Todo el monto a tarjeta por defecto
            setReferenciaInput('');
            setEfectivoEntregado('');
        }
    }, [isOpen, total]);

    const metodosPago = [
        { id: 3, nombre: 'Transferencia', icon: <FaExchangeAlt />, descripcion: 'Requiere referencia' },
        { id: 1, nombre: 'Tarjeta', icon: <FaCreditCard />, descripcion: 'Se enviará terminal' },
        { id: 2, nombre: 'Efectivo', icon: <FaMoneyBillWave />, descripcion: 'Se enviará cambio' },
    ];

    const handleToggleMethod = (id) => {
        const newSelected = { ...selectedMethods };

        if (newSelected[id]) {
            // Si ya estaba seleccionado, lo quitamos
            // PERO no dejamos quitar el último si es el único
            const count = Object.keys(newSelected).length;
            if (count > 1) {
                delete newSelected[id];
                const newAmounts = { ...amounts };
                delete newAmounts[id];
                setAmounts(newAmounts);
            }
        } else {
            // Lo agregamos
            newSelected[id] = true;
            // No asignamos monto automático, el usuario deberá ajustar
        }
        setSelectedMethods(newSelected);
    };

    const handleAmountChange = (id, value) => {
        const val = parseFloat(value) || 0;
        setAmounts(prev => ({ ...prev, [id]: val }));
    };

    // Auto-distribuir restante si se selecciona solo uno o al iniciar
    useEffect(() => {
        // Si hay solo un método seleccionado, le asignamos el total automáticamente
        const keys = Object.keys(selectedMethods);
        if (keys.length === 1) {
            const id = keys[0];
            setAmounts({ [id]: total });
        }
    }, [selectedMethods, total]);


    const handleConfirmar = () => {
        const selectedIds = Object.keys(selectedMethods).map(Number);

        // 1. Validar que la suma de montos sea igual al total
        const currentSum = selectedIds.reduce((acc, id) => acc + (amounts[id] || 0), 0);

        // Tolerancia pequeña por decimales
        if (Math.abs(currentSum - total) > 0.01) {
            showToast.error(`La suma de los montos ($${currentSum.toFixed(2)}) debe ser igual al total ($${total.toFixed(2)})`);
            return;
        }

        // 2. Validaciones específicas
        if (selectedMethods[3]) { // Transferencia
            if (!referenciaInput.trim()) {
                showToast.error('Debes ingresar la referencia para la Transferencia');
                return;
            }
        }

        if (selectedMethods[2]) { // Efectivo
            const montoACobrar = amounts[2] || 0;
            const entregado = parseFloat(efectivoEntregado) || 0;
            if (entregado < montoACobrar) {
                showToast.error(`El efectivo entregado ($${entregado}) debe ser mayor o igual al monto a cobrar en efectivo ($${montoACobrar})`);
                return;
            }
        }

        // 3. Construir payload
        // Si hay múltiples, enviamos un array. Si hay uno, también (el parent lo manejará).
        const pagosPayload = selectedIds.map(id => {
            let item = {
                id_metpago: id,
                monto: amounts[id] || 0,
                referencia: '' // Default empty
            };

            if (id === 3) { // Transferencia
                item.referencia = referenciaInput.trim();
            } else if (id === 2) { // Efectivo
                // Aquí usamos la referencia para guardar con cuánto pagó ("Paga con: 500") 
                // O el cambio? El requerimiento dice: "con cuanto va a pagar"
                // En el backend actual, reference se usaba para eso en efectivo.
                // Guardaremos el monto entregado como referencia para que el repartidor sepa.
                item.referencia = efectivoEntregado;
            }

            return item;
        });

        // El componente padre espera un array de pagos ahora, o un objeto unico?
        // El plan dice modificar page.jsx para aceptar array.
        // Por compatibilidad con `DeliveryPaymentModal` original interface, pasamos el array directo.
        // NOTA: El componente padre `handleConfirmarPagoDomicilio` recibe `pagoData`.
        // Lo mandaremos como array directamente.

        onConfirm(pagosPayload);
    };

    if (!isOpen) return null;

    const currentTotalAllocated = Object.keys(selectedMethods).reduce((acc, id) => acc + (amounts[id] || 0), 0);
    const remaining = total - currentTotalAllocated;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Método de Pago - Domicilio</h2>
                    <button onClick={onClose} className="text-white hover:text-red-200 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="mb-6 text-center bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-sm">Total de la orden</p>
                        <p className="text-4xl font-bold text-gray-900">${total.toFixed(2)}</p>
                        {Math.abs(remaining) > 0.01 && (
                            <p className={`text-sm mt-1 font-bold ${remaining > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {remaining > 0 ? `Falta asignar: $${remaining.toFixed(2)}` : `Excedido por: $${Math.abs(remaining).toFixed(2)}`}
                            </p>
                        )}
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-3">Selecciona métodos de pago (puedes elegir varios):</p>

                    <div className="space-y-4">
                        {metodosPago.map((metodo) => {
                            const isSelected = !!selectedMethods[metodo.id];

                            return (
                                <div key={metodo.id}
                                    className={`border rounded-lg p-3 transition-colors ${isSelected ? 'border-yellow-500 bg-yellow-50/50' : 'border-gray-200'}`}>

                                    {/* Header checkbox */}
                                    <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => handleToggleMethod(metodo.id)}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-yellow-500 border-yellow-500 text-white' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <span className="text-xs font-bold">✓</span>}
                                        </div>
                                        <div className="text-xl text-gray-600">{metodo.icon}</div>
                                        <div className="flex-1">
                                            <span className="font-semibold text-gray-800">{metodo.nombre}</span>
                                        </div>
                                    </div>

                                    {/* Inputs Details (Only if selected) */}
                                    {isSelected && (
                                        <div className="ml-8 mt-2 space-y-3">
                                            {/* Monto Field */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Monto a cobrar con {metodo.nombre}</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        value={amounts[metodo.id] === undefined ? '' : amounts[metodo.id]}
                                                        // Si es único, mostramos el total y disableamos, o dejamos editar? Mejor dejar editar por si quiere agregar otro
                                                        // Pero el useEffect lo sobrescribe si es unico.
                                                        // Permitir edición siempre.
                                                        onChange={(e) => handleAmountChange(metodo.id, e.target.value)}
                                                        className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-yellow-500 text-sm text-black"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            {/* Specific Fields */}
                                            {metodo.id === 3 && ( // Transferencia
                                                <div>
                                                    <label className="block text-xs font-medium text-blue-800 mb-1">Número de Referencia *</label>
                                                    <input
                                                        type="text"
                                                        value={referenciaInput}
                                                        onChange={(e) => setReferenciaInput(e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-blue-200 rounded bg-blue-50 focus:ring-1 focus:ring-blue-500 text-sm text-black"
                                                        placeholder="Ref de transferencia"
                                                    />
                                                </div>
                                            )}

                                            {metodo.id === 1 && ( // Tarjeta
                                                <p className="text-xs text-gray-500 italic bg-white p-1 rounded">
                                                    Se enviará terminal.
                                                </p>
                                            )}

                                            {metodo.id === 2 && ( // Efectivo
                                                <div>
                                                    <label className="block text-xs font-medium text-green-800 mb-1">¿Con cuánto paga el cliente?</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                        <input
                                                            type="number"
                                                            value={efectivoEntregado}
                                                            onChange={(e) => setEfectivoEntregado(e.target.value)}
                                                            className="w-full pl-7 pr-3 py-1.5 border border-green-200 rounded bg-green-50 focus:ring-1 focus:ring-green-500 text-sm text-black"
                                                            placeholder="Monto entregado"
                                                        />
                                                    </div>
                                                    {amounts[3] > 0 && parseFloat(efectivoEntregado) >= amounts[3] && (
                                                        <p className="text-xs text-green-700 mt-1 font-bold">
                                                            Cambio: ${(parseFloat(efectivoEntregado) - amounts[3]).toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                    <button
                        onClick={handleConfirmar}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg flex justify-center items-center gap-2"
                    >
                        <span>Confirmar Pagos</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">${currentTotalAllocated.toFixed(2)}</span>
                    </button>
                    {Math.abs(remaining) > 0.01 && (
                        <p className="text-center text-xs text-red-500 mt-2">
                            Asegúrate de que la suma coincida con el total para continuar.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryPaymentModal;
