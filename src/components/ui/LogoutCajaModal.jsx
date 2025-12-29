'use client';

import { FaExclamationTriangle } from 'react-icons/fa';
import Button from './Button';

export default function LogoutCajaModal({ isOpen, onClose, onConfirm, onRedirectCaja }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <FaExclamationTriangle className="text-yellow-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sesión con caja abierta</h3>
                </div>

                <p className="text-gray-600 mb-6">
                    Se ha detectado que tienes una caja activa. ¿Qué deseas hacer antes de cerrar sesión?
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onRedirectCaja();
                            onClose();
                        }}
                    >
                        Cerrar Caja
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Cerrar Sesión <br /> (Mantener Caja)
                    </Button>
                </div>
            </div>
        </div>
    );
}
