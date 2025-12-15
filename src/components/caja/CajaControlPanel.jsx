'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { cerrarCaja, getCaja } from '@/services/cajaService';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaCoins, FaShoppingCart, FaChartLine } from 'react-icons/fa';

export default function CajaControlPanel({ cajaId, onClose }) {
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [cajaDetails, setCajaDetails] = useState(null);

    const [cierreData, setCierreData] = useState({
        monto_final: '',
        observaciones_cierre: ''
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getCaja(cajaId);
                setCajaDetails(data);
            } catch (error) {
                console.error('Error loading caja details:', error);
                setMessage({ type: 'error', text: 'Error al cargar detalles de la caja' });
            } finally {
                setLoadingData(false);
            }
        };

        if (cajaId) {
            fetchDetails();
        }
    }, [cajaId]);

    const handleCierreChange = (e) => {
        const { name, value } = e.target;
        setCierreData(prev => ({ ...prev, [name]: value }));
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

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    };

    if (loadingData) {
        return <div className="p-8 text-center text-gray-500">Cargando detalles de caja...</div>;
    }

    // Default values if API returns incomplete data
    const montoInicial = parseFloat(cajaDetails?.monto_inicial || 0);
    // Assuming API returns 'total_ventas' and breakdown. If not, we might need to adjust based on actual API response.
    // For now, mapping to likely field names.
    const totalVentas = parseFloat(cajaDetails?.total_ventas || 0);
    const ganancia = totalVentas; // O totalVentas - gastos si los hubiera en esta caja

    // Breakdown
    const efectivo = parseFloat(cajaDetails?.total_efectivo || 0);
    const tarjeta = parseFloat(cajaDetails?.total_tarjeta || 0);
    const transferencia = parseFloat(cajaDetails?.total_transferencia || 0);


    return (
        <div className="space-y-8">
            {message.text && (
                <div className={`p-4 rounded-lg text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Header Info */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Caja #{cajaId} - Abierta</h2>
                    <p className="text-sm text-gray-500">
                        {cajaDetails?.fecha_apertura ? new Date(cajaDetails.fecha_apertura).toLocaleString('es-MX') : 'Fecha desconocida'}
                    </p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Activa
                </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                        <FaCoins size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Fondo Inicial</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(montoInicial)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FaShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Ventas</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVentas)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <FaChartLine size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ganancia Neta</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(ganancia)}</p>
                    </div>
                </div>
            </div>

            {/* Sales Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Desglose de Ventas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-green-700">
                            <FaMoneyBillWave />
                            <span className="font-medium">Efectivo</span>
                        </div>
                        <p className="text-xl font-bold text-green-800">{formatCurrency(efectivo)}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-blue-700">
                            <FaCreditCard />
                            <span className="font-medium">Tarjeta</span>
                        </div>
                        <p className="text-xl font-bold text-blue-800">{formatCurrency(tarjeta)}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-purple-700">
                            <FaExchangeAlt />
                            <span className="font-medium">Transferencia</span>
                        </div>
                        <p className="text-xl font-bold text-purple-800">{formatCurrency(transferencia)}</p>
                    </div>
                </div>
            </div>

            {/* Close Form */}
            <Card title="Cerrar Caja" className="max-w-md mx-auto border-2 border-red-50 mt-8">
                <div className="mb-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                    Al cerrar la caja, se guardará el balance final y no podrá registrar más ventas en esta sesión.
                </div>
                <form onSubmit={handleCerrarCaja} className="space-y-4">
                    <Input
                        label="Monto Final en Caja (Recuento Físico)"
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
        </div>
    );
}
