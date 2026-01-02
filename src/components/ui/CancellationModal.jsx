'use client';

import { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

export default function CancellationModal({ isOpen, onClose, onConfirm, loading }) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Cancelar Pedido</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo de cancelación
                        </label>
                        <textarea
                            id="reason"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-700"
                            placeholder="Escriba el motivo..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            disabled={loading || !reason.trim()}
                        >
                            {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
