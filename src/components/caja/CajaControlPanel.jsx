'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaCoins, FaShoppingCart, FaChartLine, FaReceipt } from 'react-icons/fa';
import Card from '../ui/Card';
import { getCaja, cerrarCaja } from '@/services/cajaService';

// Importar dinámicamente el componente de PDF para evitar problemas de SSR
const PDFDownloadButton = dynamic(
    () => import('./PDFDownloadButton'),
    { ssr: false }
);

export default function CajaControlPanel({ cajaId, onClose }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [cajaDetails, setCajaDetails] = useState(null);

    const [cierreData, setCierreData] = useState({
        monto_final: '',
        observaciones_cierre: ''
    });

    const [isMounted, setIsMounted] = useState(false);

    // Detectar cuando el componente está montado en el cliente
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fetchCajaData = async () => {
            try {
                setLoadingData(true);
                const data = await getCaja(cajaId);
                setCajaDetails(data);
            } catch (error) {
                console.error('Error al cargar datos de caja:', error);
                setMessage({
                    type: 'error',
                    text: 'Error al cargar los datos de la caja. Por favor, recarga la página.'
                });
            } finally {
                setLoadingData(false);
            }
        };

        if (cajaId) {
            fetchCajaData();
        }
    }, [cajaId]);

    const handleCierreChange = (e) => {
        const { name, value } = e.target;
        setCierreData(prev => ({ ...prev, [name]: value }));
    };

    const handleCerrarCaja = async () => {
        if (!window.confirm('¿Está seguro que desea cerrar la caja?')) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await cerrarCaja(cajaId, cierreData);
            setMessage({ type: 'success', text: 'Caja cerrada exitosamente' });

            // Limpiar localStorage y redirigir después de 1.5 segundos
            setTimeout(() => {
                localStorage.removeItem('id_caja');
                if (onClose) onClose();
                router.push('/caja');
            }, 1500);
        } catch (error) {
            console.error('Error al cerrar caja:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Error al cerrar la caja. Por favor, intenta de nuevo.'
            });
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando detalles de caja...</p>
                </div>
            </div>
        );
    }

    if (!cajaDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">No se pudieron cargar los datos de la caja</p>
                </div>
            </div>
        );
    }

    const montoInicial = parseFloat(cajaDetails.monto_inicial || 0);
    const totalVentas = parseFloat(cajaDetails.total_ventas || 0);
    const numeroVentas = cajaDetails.numero_ventas || 0;
    const efectivo = parseFloat(cajaDetails.total_efectivo || 0);
    const tarjeta = parseFloat(cajaDetails.total_tarjeta || 0);
    const transferencia = parseFloat(cajaDetails.total_transferencia || 0);

    const balanceEsperado = montoInicial + totalVentas;
    const montoFinalIngresado = parseFloat(cierreData.monto_final) || 0;
    const diferencia = cierreData.monto_final ? montoFinalIngresado - balanceEsperado : 0;
    const hayDiferencia = cierreData.monto_final && diferencia !== 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-full mx-auto space-y-6">
                {message.text && (
                    <div className={`p-4 rounded-lg text-center font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Info */}
                        <Card>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Caja #{cajaDetails.id_caja}</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Apertura: {new Date(cajaDetails.fecha_apertura).toLocaleString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Cajero: <span className="font-medium">{cajaDetails.usuario_apertura || 'N/A'}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        Activa
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Key Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="hover:shadow-md transition-shadow" padding="none">
                                <div className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
                                        <FaCoins size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fondo Inicial</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(montoInicial)}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow" padding="none">
                                <div className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <FaShoppingCart size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Ventas</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalVentas)}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow" padding="none">
                                <div className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                        <FaReceipt size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Núm. Ventas</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{numeroVentas}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow" padding="none">
                                <div className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                        <FaChartLine size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Balance Esperado</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(balanceEsperado)}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Sales Breakdown */}
                        <Card title="Desglose de Ventas por Método de Pago">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-5 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-200 text-green-700 rounded-lg">
                                            <FaMoneyBillWave size={20} />
                                        </div>
                                        <span className="font-semibold text-green-900">Efectivo</span>
                                    </div>
                                    <p className="text-3xl font-bold text-green-800">{formatCurrency(efectivo)}</p>
                                    <p className="text-xs text-green-600 mt-2">
                                        {totalVentas > 0 ? ((efectivo / totalVentas) * 100).toFixed(1) : 0}% del total
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-5 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-200 text-blue-700 rounded-lg">
                                            <FaCreditCard size={20} />
                                        </div>
                                        <span className="font-semibold text-blue-900">Tarjeta</span>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-800">{formatCurrency(tarjeta)}</p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        {totalVentas > 0 ? ((tarjeta / totalVentas) * 100).toFixed(1) : 0}% del total
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-5 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-200 text-purple-700 rounded-lg">
                                            <FaExchangeAlt size={20} />
                                        </div>
                                        <span className="font-semibold text-purple-900">Transferencia</span>
                                    </div>
                                    <p className="text-3xl font-bold text-purple-800">{formatCurrency(transferencia)}</p>
                                    <p className="text-xs text-purple-600 mt-2">
                                        {totalVentas > 0 ? ((transferencia / totalVentas) * 100).toFixed(1) : 0}% del total
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Close Form */}
                    <div className="lg:col-span-1">
                        <Card className="border-2 border-red-100 sticky top-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Cerrar Caja</h3>

                            <div className="mb-6 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <p className="font-medium mb-1">⚠️ Importante:</p>
                                <p>Al cerrar la caja, se guardará el balance final y no podrá registrar más ventas en esta sesión.</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">
                                        Monto Final en Caja (Recuento Físico) *
                                    </label>
                                    <div className="relative text-black">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            name="monto_final"
                                            type="number"
                                            step="0.01"
                                            value={cierreData.monto_final}
                                            onChange={handleCierreChange}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Balance Info */}
                                {cierreData.monto_final && (
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Balance esperado:</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(balanceEsperado)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Monto contado:</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(montoFinalIngresado)}</span>
                                        </div>
                                        <div className="border-t-2 border-gray-300 pt-2 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-700">Diferencia:</span>
                                                <span className={`text-lg font-bold ${diferencia > 0 ? 'text-green-600' : diferencia < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {diferencia > 0 && '+'}{formatCurrency(diferencia)}
                                                    {diferencia > 0 && <span className="text-sm ml-2">(Sobrante)</span>}
                                                    {diferencia < 0 && <span className="text-sm ml-2">(Faltante)</span>}
                                                    {diferencia === 0 && <span className="text-sm ml-2 text-green-600">✓ Cuadra perfecto</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {hayDiferencia && Math.abs(diferencia) > 0.01 && (
                                    <div className={`p-4 rounded-lg border-2 ${diferencia > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <p className={`text-sm font-medium ${diferencia > 0 ? 'text-green-800' : 'text-red-800'}`}>
                                            {diferencia > 0
                                                ? '💰 Hay un sobrante. Verifica que no falte registrar algún gasto.'
                                                : '⚠️ Hay un faltante. Verifica el conteo o si falta registrar alguna venta.'
                                            }
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">
                                        Observaciones de Cierre
                                    </label>
                                    <textarea
                                        name="observaciones_cierre"
                                        value={cierreData.observaciones_cierre}
                                        onChange={handleCierreChange}
                                        placeholder="Opcional: Notas sobre el cierre, incidencias, etc."
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-black"
                                    />
                                </div>

                                <button
                                    onClick={handleCerrarCaja}
                                    disabled={loading || !cierreData.monto_final}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Cerrando...
                                        </span>
                                    ) : (
                                        'Confirmar Cierre de Caja'
                                    )}
                                </button>
                                {isMounted && (
                                    <div className="mt-4">
                                        <PDFDownloadButton
                                            cajaDetails={cajaDetails}
                                            cierreData={cierreData}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}