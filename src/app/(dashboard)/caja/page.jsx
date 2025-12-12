'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AbrirCajaForm from '@/components/caja/AbrirCajaForm';
import CajaControlPanel from '@/components/caja/CajaControlPanel';

export default function CajaPage() {
    const router = useRouter();
    const [cajaId, setCajaId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si hay una caja abierta en localStorage
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('id_caja');
            if (storedId) {
                setCajaId(storedId);
            }
        }
        setLoading(false);
    }, []);

    const handleCajaAbierta = (id) => {
        localStorage.setItem('id_caja', id);
        setCajaId(id);
        router.push('/pos');
    };

    const handleCajaCerrada = () => {
        localStorage.removeItem('id_caja');
        setCajaId(null);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando estado de caja...</div>;
    }

    return (
        <div className="container mx-auto max-w-4xl p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Gestión de Caja</h1>

            {cajaId ? (
                <>
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-center shadow-sm">
                        <span className="font-semibold">Caja Abierta</span> (ID: {cajaId})
                    </div>
                    <CajaControlPanel
                        cajaId={cajaId}
                        onClose={handleCajaCerrada}
                    />
                </>
            ) : (
                <AbrirCajaForm onSuccess={handleCajaAbierta} />
            )}
        </div>
    );
}
