'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { abrirCaja } from '@/services/cajaService';

export default function AbrirCajaForm({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        monto_inicial: '',
        observaciones_apertura: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await abrirCaja(formData);
            if (onSuccess) {
                onSuccess(result.id_caja);
            }
        } catch (err) {
            setError('Error al abrir la caja. Por favor intente nuevamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Apertura de Caja" className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label="Monto Inicial"
                    name="monto_inicial"
                    type="number"
                    step="0.01"
                    value={formData.monto_inicial}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                />

                <Input
                    label="Observaciones"
                    name="observaciones_apertura"
                    value={formData.observaciones_apertura}
                    onChange={handleChange}
                    placeholder="Opcional"
                />

                <Button
                    type="submit"
                    fullWidth
                    disabled={loading}
                >
                    {loading ? 'Abriendo...' : 'Abrir Caja'}
                </Button>
            </form>
        </Card>
    );
}
