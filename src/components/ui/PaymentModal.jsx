import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaTimes, FaTrash } from 'react-icons/fa';

const PaymentModal = ({ isOpen, onClose, total, onConfirm }) => {
  const [pagos, setPagos] = useState([]);
  const [montoRestante, setMontoRestante] = useState(total);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(1); // 1: Tarjeta, 2: Efectivo, 3: Transferencia
  const [montoInput, setMontoInput] = useState('');
  const [referenciaInput, setReferenciaInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPagos([]);
      setMontoRestante(total);
      setMontoInput(total.toString());
      setMetodoSeleccionado(1);
      setReferenciaInput('');
    }
  }, [isOpen, total]);

  const metodosPago = [
    { id: 1, nombre: 'Tarjeta', icon: <FaCreditCard /> },
    { id: 2, nombre: 'Efectivo', icon: <FaMoneyBillWave /> },
    { id: 3, nombre: 'Transferencia', icon: <FaExchangeAlt /> },
  ];

  const handleAgregarPago = () => {
    const monto = parseFloat(montoInput);
    if (isNaN(monto) || monto <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    if (monto > montoRestante) {
      alert('El monto no puede ser mayor al restante');
      return;
    }

    // Validar referencia para tarjeta o transferencia
    if ((metodoSeleccionado === 1 || metodoSeleccionado === 3) && !referenciaInput.trim()) {
      alert('Por favor ingresa el número de referencia/folio');
      return;
    }

    const nuevoPago = {
      id_metpago: metodoSeleccionado,
      monto: monto,
      nombreMetodo: metodosPago.find(m => m.id === metodoSeleccionado)?.nombre,
      referencia: (metodoSeleccionado === 1 || metodoSeleccionado === 3) ? referenciaInput.trim() : ''
    };

    const nuevosPagos = [...pagos, nuevoPago];
    setPagos(nuevosPagos);

    const nuevoRestante = montoRestante - monto;
    setMontoRestante(parseFloat(nuevoRestante.toFixed(2)));
    setMontoInput(parseFloat(nuevoRestante.toFixed(2)).toString());
    setReferenciaInput('');
  };

  const handleEliminarPago = (index) => {
    const pagoEliminado = pagos[index];
    const nuevosPagos = pagos.filter((_, i) => i !== index);
    setPagos(nuevosPagos);

    const nuevoRestante = montoRestante + pagoEliminado.monto;
    setMontoRestante(parseFloat(nuevoRestante.toFixed(2)));
    setMontoInput(parseFloat(nuevoRestante.toFixed(2)).toString());
  };

  const handleConfirmar = () => {
    if (montoRestante > 0.01) { // Margen de error pequeño por decimales
      alert(`Falta cubrir $${montoRestante.toFixed(2)} del total`);
      return;
    }
    onConfirm(pagos);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Métodos de Pago</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-gray-500 text-sm">Total a Pagar</p>
            <p className="text-4xl font-bold text-gray-900">${total.toFixed(2)}</p>
            {montoRestante > 0 && (
              <p className="text-red-500 text-sm mt-1 font-medium">
                Restante: ${montoRestante.toFixed(2)}
              </p>
            )}
          </div>

          {/* Selector de Método */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {metodosPago.map((metodo) => (
              <button
                key={metodo.id}
                onClick={() => setMetodoSeleccionado(metodo.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${metodoSeleccionado === metodo.id
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <div className="text-xl mb-1">{metodo.icon}</div>
                <span className="text-xs font-medium">{metodo.nombre}</span>
              </button>
            ))}
          </div>

          {/* Input de Referencia (solo para Tarjeta y Transferencia) */}
          {(metodoSeleccionado === 1 || metodoSeleccionado === 3) && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Número de Referencia/Folio *
              </label>
              <input
                type="text"
                value={referenciaInput}
                onChange={(e) => setReferenciaInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                placeholder="Ingresa el folio o número de transacción"
              />
            </div>
          )}

          {/* Input de Monto */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Monto a agregar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={montoInput}
                  onChange={(e) => setMontoInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAgregarPago}
                disabled={montoRestante <= 0}
                className="bg-gray-900 hover:bg-black text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de Pagos */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Pagos Agregados</h3>
            {pagos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">No hay pagos agregados</p>
            ) : (
              <div className="space-y-2">
                {pagos.map((pago, index) => (
                  <div key={index} className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {metodosPago.find(m => m.id === pago.id_metpago)?.icon}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{pago.nombreMetodo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">${pago.monto.toFixed(2)}</span>
                        <button
                          onClick={() => handleEliminarPago(index)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <FaTrash size={20} />
                        </button>
                      </div>
                    </div>
                    {pago.referencia && (
                      <div className="mt-1 text-xs text-gray-500">
                        Ref: {pago.referencia}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmar}
            disabled={montoRestante > 0.01}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Pagos
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
