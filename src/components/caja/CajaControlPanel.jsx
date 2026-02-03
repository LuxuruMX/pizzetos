'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaCoins, FaShoppingCart, FaChartLine, FaReceipt } from 'react-icons/fa';
import Card from '../ui/Card';
import { getCaja, cerrarCaja, getVentasCaja, getGastosCaja } from '@/services/cajaService';
import { FaChevronDown, FaChevronUp, FaFileInvoiceDollar, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmModal from '../ui/ConfirmModal';

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
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [cierreData, setCierreData] = useState({
        monto_final: '',
        observaciones_cierre: ''
    });

    // Estado para desglose de ventas y gastos
    const [ventasData, setVentasData] = useState([]);
    const [gastosData, setGastosData] = useState([]);
    const [loadingVentas, setLoadingVentas] = useState(false);
    const [showVentas, setShowVentas] = useState(false);
    const [showGastos, setShowGastos] = useState(false);

    const [alertState, setAlertState] = useState(null); // { type: 'closed' | 'notFound', data: any }
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

                if (data.estado === 'cerrada') {
                    setAlertState({ type: 'closed', data: data });
                    setCajaDetails(data); // Optional: keep data for display if needed, but modal blocks
                } else {
                    setCajaDetails(data);
                }

                // Fetch gastos AND ventas immediately
                try {
                    const [gastos, ventas] = await Promise.all([
                        getGastosCaja(cajaId),
                        getVentasCaja(cajaId)
                    ]);
                    setGastosData(gastos);
                    setVentasData(ventas);
                } catch (err) {
                    console.error("Error fetching gastos/ventas:", err);
                }

            } catch (error) {
                console.error('Error al cargar datos de caja:', error);

                // Check for 404 or specific error message
                if (error.response?.status === 404 || error.response?.data?.detail === 'Caja no encontrada') {
                    setAlertState({ type: 'notFound' });
                } else {
                    setMessage({
                        type: 'error',
                        text: 'Error al cargar los datos de la caja. Por favor, recarga la página.'
                    });
                }
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

    const handleResetCaja = () => {
        localStorage.removeItem('id_caja');
        if (onClose) onClose(); // This should trigger parent to clear state
        router.push('/caja');
    };

    const handleCerrarCajaClick = () => {
        setShowConfirmModal(true);
    };

    const confirmCerrarCaja = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await cerrarCaja(cajaId, cierreData);
            setMessage({ type: 'success', text: 'Caja cerrada exitosamente' });

            // Limpiar localStorage y redirigir después de 1.5 segundos
            setTimeout(() => {
                handleResetCaja();
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

    const handleToggleVentas = () => {
        // Data is already pre-fetched
        setShowVentas(!showVentas);
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

    if (alertState) {
        return (
            <div className="fixed inset-0 bg-black/60 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in-up">
                    <div className="mb-6 flex justify-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${alertState.type === 'closed' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                            {alertState.type === 'closed' ? <FaExclamationTriangle size={40} /> : <FaExclamationTriangle size={40} />}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {alertState.type === 'closed' ? 'Caja Cerrada' : 'Caja No Encontrad'}
                    </h2>

                    <p className="text-gray-600 mb-8">
                        {alertState.type === 'closed'
                            ? `Su caja fue cerrada el ${new Date(alertState.data.fecha_cierre || Date.now()).toLocaleString('es-MX')}. Si no la cerró usted, comuníquese con el administrador.`
                            : 'No se ha encontrado la información de esta caja. Es posible que haya sido eliminada o el ID sea incorrecto.'
                        }
                    </p>

                    <button
                        onClick={handleResetCaja}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Abrir otra caja
                    </button>
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

    // Calcular total de gastos
    const totalGastos = gastosData.reduce((acc, gasto) =>
        acc + (parseFloat(gasto.precio || gasto.monto) || 0), 0
    );

    const balanceEsperado = efectivo - totalGastos;
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
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                        <FaFileInvoiceDollar size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Gastos</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalGastos)}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow" padding="none">
                                <div className="p-5 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <FaShoppingCart size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Venta Total</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalVentas)}</p>
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
                                    <p className="text-3xl font-bold text-green-800">{formatCurrency(efectivo - totalGastos)}</p>
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

                        {/* Detalle de Ventas Colapsable */}
                        <Card title="Detalle de Ventas por Caja">
                            <div className="flex flex-col">
                                <button
                                    onClick={handleToggleVentas}
                                    className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="font-semibold text-gray-700">
                                        {showVentas ? 'Ocultar detalles' : 'Ver detalles de ventas'}
                                    </span>
                                    {showVentas ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
                                </button>

                                {showVentas && (
                                    <div className="mt-4 overflow-x-auto">
                                        {loadingVentas ? (
                                            <div className="text-center py-4 text-gray-500">Cargando ventas...</div>
                                        ) : ventasData.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">No hay ventas registradas en esta sesión.</div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Venta</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {ventasData.map((venta, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">#{venta.id_venta}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{venta.Metodo}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-400">{venta.referencia || '-'}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                                                                {formatCurrency(venta.monto)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Detalle de Gastos Colapsable */}
                        <Card title="Detalle de Gastos">
                            <div className="flex flex-col">
                                <button
                                    onClick={() => setShowGastos(!showGastos)}
                                    className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="font-semibold text-gray-700">
                                        {showGastos ? 'Ocultar gastos' : 'Ver detalle de gastos'}
                                    </span>
                                    {showGastos ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
                                </button>

                                {showGastos && (
                                    <div className="mt-4 overflow-x-auto">
                                        {gastosData.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">No hay gastos registrados en esta sesión.</div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {gastosData.map((gasto, index) => (
                                                        <tr key={gasto.id_gastos || index} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                {gasto.descripcion}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                                                                {formatCurrency(gasto.precio || gasto.monto)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
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
                                                ? 'Hay un sobrante. Verifica que no falte registrar algún gasto.'
                                                : 'Hay un faltante. Verifica el conteo o si falta registrar alguna venta.'
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
                                    onClick={handleCerrarCajaClick}
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
                                            ventasData={ventasData}
                                            gastosData={gastosData}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmCerrarCaja}
                title="Cerrar Caja"
                message="¿Está seguro que desea cerrar la caja? Al cerrar la caja, se guardará el balance final y no podrá registrar más ventas en esta sesión."
                confirmText="Sí, cerrar caja"
                cancelText="Cancelar"
            />
        </div>
    );
}