'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { registrarMovimiento, cerrarCaja } from '@/services/cajaService';

export default function CajaControlPanel({ cajaId, onClose }) {
    const [activeTab, setActiveTab] = useState('movimiento'); // 'movimiento' | 'cerrar'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Estado Movimiento
    const [movData, setMovData] = useState({
        tipo_movimiento: 'ingreso',
        monto: '',
        concepto: ''
    });

    // Estado Cierre
    const [cierreData, setCierreData] = useState({
        monto_final: '',
        observaciones_cierre: ''
    });

    const handleMovChange = (e) => {
        const { name, value } = e.target;
        setMovData(prev => ({ ...prev, [name]: value }));
    };

    const handleCierreChange = (e) => {
        const { name, value } = e.target;
        setCierreData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegistrarMovimiento = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await registrarMovimiento(cajaId, movData);
            setMessage({ type: 'success', text: 'Movimiento registrado exitosamente' });
            setMovData({ ...movData, monto: '', concepto: '' }); // Limpiar campos
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al registrar movimiento' });
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        if (!window.confirm('¿Está seguro que desea cerrar la caja?')) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await cerrarCaja(cajaId, cierreData);
            if (onClose) onClose();
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cerrar la caja' });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4 justify-center">
                <Button
                    variant={activeTab === 'movimiento' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('movimiento')}
                >
                    Registrar Movimiento
                </Button>
                <Button
                    variant={activeTab === 'cerrar' ? 'danger' : 'outline'}
                    onClick={() => setActiveTab('cerrar')}
                >
                    Cerrar Caja
                </Button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'movimiento' && (
                <Card title="Registrar Movimiento" className="max-w-md mx-auto">
                    <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</label>
                            <div className="flex gap-4 text-black">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo_movimiento"
                                        value="ingreso"
                                        checked={movData.tipo_movimiento === 'ingreso'}
                                        onChange={handleMovChange}
                                        className="text-yellow-500 focus:ring-yellow-500"
                                    />
                                    <span>Ingreso</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo_movimiento"
                                        value="egreso"
                                        checked={movData.tipo_movimiento === 'egreso'}
                                        onChange={handleMovChange}
                                        className="text-yellow-500 focus:ring-yellow-500"
                                    />
                                    <span>Egreso</span>
                                </label>
                            </div>
                        </div>

                        <Input
                            label="Monto"
                            name="monto"
                            type="number"
                            step="0.01"
                            value={movData.monto}
                            onChange={handleMovChange}
                            required
                            placeholder="0.00"
                        />

                        <Input
                            label="Concepto"
                            name="concepto"
                            value={movData.concepto}
                            onChange={handleMovChange}
                            required
                            placeholder="Ej: Venta extra, Pago proveedor..."
                        />

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </form>
                </Card>
            )}

            {activeTab === 'cerrar' && (
                <Card title="Cerrar Caja" className="max-w-md mx-auto border-2 border-red-100">
                    <div className="mb-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                        Al cerrar la caja, no podrá registrar más movimientos hasta abrir una nueva.
                    </div>
                    <form onSubmit={handleCerrarCaja} className="space-y-4">
                        <Input
                            label="Monto Final en Caja"
                            name="monto_final"
                            type="number"
                            step="0.01"
                            value={cierreData.monto_final}
                            onChange={handleCierreChange}
                            required
                            placeholder="0.00"
                        />

                        <Input
                            label="Observaciones de Cierre"
                            name="observaciones_cierre"
                            value={cierreData.observaciones_cierre}
                            onChange={handleCierreChange}
                            placeholder="Opcional"
                        />

                        <Button type="submit" variant="danger" fullWidth disabled={loading}>
                            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
}
