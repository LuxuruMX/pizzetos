'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import CorteDetailsModal from '@/components/ui/CorteDetailsModal';
import api from '@/services/api';
import { IoReload, IoEye } from 'react-icons/io5';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaChartPie } from 'react-icons/fa';

export default function CortePage() {
    const [loading, setLoading] = useState(false);
    const [pagos, setPagos] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [error, setError] = useState(null);
    const [fecha, setFecha] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState(null);
    const [selectedDayReporte, setSelectedDayReporte] = useState([]);
    const [selectedDayGastos, setSelectedDayGastos] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [year, month] = fecha.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            const formatDate = (d) => d.toISOString().split('T')[0];

            // Fetch gastos (expenses)
            const gastosPromise = api.get('/gastos', {
                params: {
                    fecha_inicio: formatDate(startDate),
                    fecha_fin: formatDate(endDate)
                }
            });

            // Fetch simplified daily income data (amounts by payment method)
            const corteDiarioPromise = api.get('/corte/resumen-mes', {
                params: {
                    fecha_inicio: formatDate(startDate),
                    fecha_fin: formatDate(endDate)
                }
            });

            const [gastosRes, corteDiarioRes] = await Promise.all([gastosPromise, corteDiarioPromise]);

            setGastos(gastosRes.data);
            setPagos(corteDiarioRes.data || []);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar datos del corte.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Clear modal state when month changes to prevent showing old data
        setSelectedDayReporte([]);
        setSelectedDayGastos([]);
        setSelectedDayData(null);
        setShowModal(false);
    }, [fecha]);

    // Calculations - Now working with simplified daily data
    const stats = useMemo(() => {
        let totalIngresos = 0;
        let totalEfectivo = 0;
        let totalTarjeta = 0;
        let totalTransferencia = 0;

        // pagos now contains daily summaries with efectivo, tarjeta, transferencia amounts
        pagos.forEach(dia => {
            totalEfectivo += parseFloat(dia.efectivo || 0);
            totalTarjeta += parseFloat(dia.tarjeta || 0);
            totalTransferencia += parseFloat(dia.transferencia || 0);
        });

        totalIngresos = totalEfectivo + totalTarjeta + totalTransferencia;

        const totalGastos = gastos.reduce((acc, g) => acc + parseFloat(g.precio || 0), 0);
        const balanceNeto = totalIngresos - totalGastos;

        const gastosPorCategoria = gastos.reduce((acc, g) => {
            const cat = g.descripcion || 'General';
            acc[cat] = (acc[cat] || 0) + parseFloat(g.precio || 0);
            return acc;
        }, {});

        return {
            totalIngresos,
            totalGastos,
            balanceNeto,
            totalEfectivo,
            totalTarjeta,
            totalTransferencia,
            gastosPorCategoria
        };
    }, [pagos, gastos]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    // Prepare table data: Daily summary
    const dailyData = useMemo(() => {
        const days = {};
        const [year, month] = fecha.split('-');
        const lastDay = new Date(year, month, 0).getDate();

        // Initialize all days of the month
        for (let i = 1; i <= lastDay; i++) {
            days[i] = {
                day: i,
                ingresos: 0,
                gastos: 0,
                efectivo: 0,
                tarjeta: 0,
                transferencia: 0
            };
        }

        // pagos now contains simplified daily data with amounts already separated
        pagos.forEach(dia => {
            const d = parseInt(dia.dia); // Expecting 'dia' field with day number
            if (days[d]) {
                days[d].efectivo = parseFloat(dia.efectivo || 0);
                days[d].tarjeta = parseFloat(dia.tarjeta || 0);
                days[d].transferencia = parseFloat(dia.transferencia || 0);
                days[d].ingresos = days[d].efectivo + days[d].tarjeta + days[d].transferencia;
            }
        });

        // Add gastos to each day
        gastos.forEach(g => {
            if (g.fecha) {
                const parts = g.fecha.split('T')[0].split('-');
                if (parts.length === 3) {
                    const d = parseInt(parts[2]);
                    if (parseInt(parts[1]) === parseInt(month) && days[d]) {
                        days[d].gastos += parseFloat(g.precio || 0);
                    }
                }
            }
        });

        return Object.values(days).map(d => ({
            ...d,
            balance: d.ingresos - d.gastos,
            dateStr: `${d.day} de ${new Date(year, month - 1).toLocaleString('es-MX', { month: 'long' })}`
        }));
    }, [pagos, gastos, fecha]);

    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleViewDetails = async (row) => {
        const [year, month] = fecha.split('-');

        setSelectedDayData(row);
        setShowModal(true);
        setLoadingDetails(true);
        setSelectedDayReporte([]); // Clear previous data

        try {
            // Construct date string YYYY-MM-DD
            const dayStr = String(row.day).padStart(2, '0');
            const fullDate = `${year}-${month}-${dayStr}`;

            // New endpoint to fetch details for a specific day
            const response = await api.get('/corte/reporte-dia', {
                params: {
                    fecha: fullDate
                }
            });

            setSelectedDayReporte(response.data || []);

        } catch (error) {
            console.error("Error fetching day details:", error);
            // Optionally set an error state for the modal
        } finally {
            setLoadingDetails(false);
        }

        // Filter gastos for this day (we still use the pre-fetched gastos as they are usually fewer)
        // Or we could also move this to the backend call if we wanted to
        const dayGastos = gastos.filter(g => {
            if (!g.fecha) return false;
            const parts = g.fecha.split('T')[0].split('-'); // YYYY-MM-DD
            if (parts.length === 3) {
                // Check year, month and day
                return parseInt(parts[0]) === parseInt(year) &&
                    parseInt(parts[1]) === parseInt(month) &&
                    parseInt(parts[2]) === row.day;
            }
            return false;
        });

        setSelectedDayGastos(dayGastos);
    };

    const dailyColumns = [
        { header: 'FECHA', accessor: 'dateStr', render: row => <span className="text-gray-600">{row.dateStr}</span> },
        { header: 'EFECTIVO', accessor: 'efectivo', render: row => <span className="text-gray-700 font-medium">{formatCurrency(row.efectivo)}</span> },
        { header: 'TARJETA', accessor: 'tarjeta', render: row => <span className="text-blue-600 font-medium">{formatCurrency(row.tarjeta)}</span> },
        { header: 'TRANSFERENCIA', accessor: 'transferencia', render: row => <span className="text-purple-600 font-medium">{formatCurrency(row.transferencia)}</span> },
        { header: 'TOTAL INGRESOS', accessor: 'ingresos', render: row => <span className="text-green-600 font-medium">{formatCurrency(row.ingresos)}</span> },
        { header: 'GASTOS', accessor: 'gastos', render: row => <span className="text-red-600 font-medium">{formatCurrency(row.gastos)}</span> },
        { header: 'BALANCE', accessor: 'balance', render: row => <span className={`font-bold ${row.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(row.balance)}</span> },
        {
            header: 'ACCIONES', accessor: 'actions', render: row => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => handleViewDetails(row)}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        title="Ver detalle del día"
                    >
                        <IoEye size={20} />
                    </button>
                </div>
            )
        }
    ];

    const methodBreakdown = [
        { name: 'Efectivo', value: stats.totalEfectivo, color: 'bg-green-100', barColor: 'bg-green-500', textColor: 'text-green-600', icon: <FaMoneyBillWave size={16} /> },
        { name: 'Tarjeta', value: stats.totalTarjeta, color: 'bg-blue-100', barColor: 'bg-blue-500', textColor: 'text-blue-600', icon: <FaCreditCard size={16} /> },
        { name: 'Transferencia', value: stats.totalTransferencia, color: 'bg-purple-100', barColor: 'bg-purple-500', textColor: 'text-purple-600', icon: <FaExchangeAlt size={16} /> }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Corte Mensual</h1>
                    <p className="text-gray-500 text-sm">Resumen financiero del mes</p>
                </div>
                <div className="flex gap-4 items-center mt-4 md:mt-0">
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button onClick={fetchData} disabled={loading} className="flex items-center gap-2">
                        {loading ? 'Cargando...' : <><IoReload /> Actualizar</>}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Ingresos</p>
                            <h2 className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalIngresos)}</h2>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <FaMoneyBillWave size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Balance Neto</p>
                            <h2 className={`text-3xl font-bold mt-1 ${stats.balanceNeto >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(stats.balanceNeto)}</h2>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <FaChartPie size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Gastos</p>
                            <h2 className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalGastos)}</h2>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full text-red-600">
                            <FaCreditCard size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Métodos de Pago</p>
                            <div className="mt-2 space-y-1">
                                {methodBreakdown.map((method, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            {method.icon}
                                            <span className="text-xs text-gray-600">{method.name}:</span>
                                        </div>
                                        <span className={`text-xs font-semibold ${method.textColor}`}>
                                            {formatCurrency(method.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                            <FaChartPie size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Method Distribution Chart */}
            <Card title="Distribución de Ingresos por Método de Pago">
                <div className="space-y-4">
                    {methodBreakdown.map((method, index) => (
                        <div key={index}>
                            <div className="flex justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {method.icon}
                                    <span className="font-medium text-gray-700">{method.name}</span>
                                </div>
                                <span className={`font-semibold ${method.textColor}`}>
                                    {formatCurrency(method.value)} ({stats.totalIngresos > 0 ? ((method.value / stats.totalIngresos) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${method.barColor}`}
                                    style={{ width: stats.totalIngresos > 0 ? `${(method.value / stats.totalIngresos) * 100}%` : '0%' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Detailed Table */}
            <Card title="Desglose Diario por Método de Pago">
                <Table columns={dailyColumns} data={dailyData} />
            </Card>

            <CorteDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                dayData={selectedDayData}
                reporteData={selectedDayReporte}
                dailyGastos={selectedDayGastos}
                isLoading={loadingDetails}
            />
        </div>
    );
}