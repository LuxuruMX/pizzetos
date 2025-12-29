'use client';

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaReceipt, FaShoppingCart } from 'react-icons/fa';
import Table from './Table';

export default function CorteDetailsModal({ isOpen, onClose, dayData, reporteData, dailyGastos, isLoading }) {
    const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'ingresos' | 'gastos'

    if (!isOpen || !dayData) return null;

    // Flatten all pagos from all sucursales for statistics
    const allPagos = reporteData?.flatMap(sucursal => sucursal.pagos || []) || [];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    // Columns for Pagos List (Detailed)
    const pagosColumns = [
        {
            header: 'FOLIO',
            accessor: 'id_venta',
            render: row => <span className="font-semibold text-gray-800">#{row.id_venta}</span>
        },
        {
            header: 'CAJA',
            accessor: 'id_caja',
            render: row => <span className="text-gray-600 text-sm">Caja #{row.id_caja}</span>
        },
        {
            header: 'MÉTODO',
            accessor: 'metodo_pago',
            render: row => {
                const icons = {
                    'Tarjeta': <FaCreditCard className="text-blue-500" />,
                    'Efectivo': <FaMoneyBillWave className="text-green-500" />,
                    'Transferencia': <FaExchangeAlt className="text-purple-500" />
                };
                const method = row.metodo_pago || 'Otro';

                return (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        {icons[method] || <FaMoneyBillWave />}
                        <span className="font-medium">{method}</span>
                    </div>
                );
            }
        },
        {
            header: 'REFERENCIA',
            accessor: 'referencia',
            render: row => (
                <span className="text-gray-500 text-sm italic">
                    {row.referencia || '-'}
                </span>
            )
        },
        {
            header: 'MONTO',
            accessor: 'monto',
            render: row => <span className="font-bold text-gray-800">{formatCurrency(row.monto)}</span>
        }
    ];

    // Columns for Gastos List
    const gastosColumns = [
        {
            header: 'DESCRIPCIÓN',
            accessor: 'descripcion',
            render: row => <span className="font-medium text-gray-800">{row.descripcion || 'Sin descripción'}</span>
        },
        {
            header: 'CATEGORÍA',
            accessor: 'categoria',
            render: row => <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{row.categoria || 'General'}</span>
        },
        {
            header: 'MONTO',
            accessor: 'precio',
            render: row => <span className="font-bold text-red-600">-{formatCurrency(row.precio)}</span>
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Detalle del Día</h2>
                        <p className="text-blue-600 font-medium">{dayData.dateStr}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Resumen Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Ingresos</span>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <FaMoneyBillWave />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(dayData.ingresos)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gastos</span>
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <FaReceipt />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(dayData.gastos)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Balance</span>
                                <div className={`p-2 rounded-lg ${dayData.balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <FaShoppingCart />
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${dayData.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                {formatCurrency(dayData.balance)}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown Payment Methods Cards */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose de Ingresos por Método de Pago</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaMoneyBillWave className="text-green-600" size={20} />
                                    <span className="text-green-700 text-sm font-semibold">Efectivo</span>
                                </div>
                                <p className="text-2xl font-bold text-green-900">{formatCurrency(dayData.efectivo)}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    {dayData.ingresos > 0 ? ((dayData.efectivo / dayData.ingresos) * 100).toFixed(1) : 0}% del total
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaCreditCard className="text-blue-600" size={20} />
                                    <span className="text-blue-700 text-sm font-semibold">Tarjeta</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{formatCurrency(dayData.tarjeta)}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {dayData.ingresos > 0 ? ((dayData.tarjeta / dayData.ingresos) * 100).toFixed(1) : 0}% del total
                                </p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaExchangeAlt className="text-purple-600" size={20} />
                                    <span className="text-purple-700 text-sm font-semibold">Transferencia</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-900">{formatCurrency(dayData.transferencia)}</p>
                                <p className="text-xs text-purple-600 mt-1">
                                    {dayData.ingresos > 0 ? ((dayData.transferencia / dayData.ingresos) * 100).toFixed(1) : 0}% del total
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cash Registers and Branch Information */}
                    {!isLoading && reporteData && reporteData.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {reporteData.map((sucursalData, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaReceipt className="text-purple-600" />
                                        Sucursal: {sucursalData.sucursal}
                                    </h3>

                                    {/* Cash Registers for this branch */}
                                    {sucursalData.cajas && sucursalData.cajas.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-3">Cajas Registradoras</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {sucursalData.cajas.map((caja) => (
                                                    <div key={caja.id_caja} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="font-bold text-green-900">Caja #{caja.id_caja}</span>
                                                                <p className="text-sm text-gray-700 mt-1">{caja.empleado}</p>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded text-xs font-semibold ${caja.hora_cierre ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                {caja.hora_cierre ? 'Cerrada' : 'Abierta'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Apertura:</span>
                                                                <span className="font-medium text-gray-800">{formatDate(caja.hora_apertura)}</span>
                                                            </div>
                                                            {caja.hora_cierre && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cierre:</span>
                                                                    <span className="font-medium text-gray-800">{formatDate(caja.hora_cierre)}</span>
                                                                </div>
                                                            )}
                                                            {caja.observaciones_apertura && (
                                                                <div className="mt-2 pt-2 border-t border-green-200">
                                                                    <p className="text-xs text-gray-600 italic">Obs. Apertura: {caja.observaciones_apertura}</p>
                                                                </div>
                                                            )}
                                                            {caja.observaciones_cierre && (
                                                                <div className="mt-1">
                                                                    <p className="text-xs text-gray-600 italic">Obs. Cierre: {caja.observaciones_cierre}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment summary for this branch */}
                                    {sucursalData.pagos && sucursalData.pagos.length > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                <FaShoppingCart className="text-blue-600" />
                                                Resumen de Pagos
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 block">Transacciones:</span>
                                                    <span className="font-bold text-gray-800">{sucursalData.pagos.length}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 block">Total:</span>
                                                    <span className="font-bold text-blue-700">
                                                        {formatCurrency(sucursalData.pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0))}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 block">Ticket Promedio:</span>
                                                    <span className="font-bold text-green-700">
                                                        {formatCurrency(sucursalData.pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0) / sucursalData.pagos.length)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 block">Más Alto:</span>
                                                    <span className="font-bold text-purple-700">
                                                        {formatCurrency(Math.max(...sucursalData.pagos.map(p => parseFloat(p.monto || 0))))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!sucursalData.cajas?.length && !sucursalData.pagos?.length && (
                                        <p className="text-sm text-gray-500 italic">No hay datos disponibles para esta sucursal</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Overall Statistics */}
                    {!isLoading && allPagos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Estadísticas Generales del Día</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <FaShoppingCart className="text-blue-600" />
                                        Totales
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total de Transacciones:</span>
                                            <span className="font-bold text-gray-800">{allPagos.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ticket Promedio:</span>
                                            <span className="font-bold text-blue-700">
                                                {formatCurrency(dayData.ingresos / (allPagos.length || 1))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Transacción Más Alta:</span>
                                            <span className="font-bold text-green-700">
                                                {formatCurrency(Math.max(...allPagos.map(p => parseFloat(p.monto || 0))))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Transacción Más Baja:</span>
                                            <span className="font-bold text-orange-700">
                                                {formatCurrency(Math.min(...allPagos.map(p => parseFloat(p.monto || 0))))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Branch totals */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <FaReceipt className="text-purple-600" />
                                        Desglose por Sucursal
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {reporteData?.map((sucursal) => {
                                            const total = sucursal.pagos?.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0) || 0;
                                            return (
                                                <div key={sucursal.sucursal} className="flex justify-between">
                                                    <span className="text-gray-600">{sucursal.sucursal}:</span>
                                                    <span className="font-bold text-purple-700">{formatCurrency(total)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('resumen')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'resumen'
                                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Resumen
                            </button>
                            <button
                                onClick={() => setActiveTab('ingresos')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'ingresos'
                                    ? 'bg-white text-yellow-600 border-b-2 border-yellow-600'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Detalle de Ingresos
                            </button>
                            <button
                                onClick={() => setActiveTab('gastos')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'gastos'
                                    ? 'bg-white text-red-600 border-b-2 border-red-600'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Detalle de Gastos ({dailyGastos?.length || 0})
                            </button>
                        </div>

                        <div className="p-0">
                            {isLoading ? (
                                <div className="p-12 flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'resumen' && (
                                        <div className="p-8 text-center">
                                            <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                                                <FaShoppingCart className="text-blue-600" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Resumen del Día</h3>
                                            <p className="text-gray-600 mb-4">
                                                Este día se registraron <span className="font-bold text-green-600">{formatCurrency(dayData.ingresos)}</span> en ingresos
                                                y <span className="font-bold text-red-600">{formatCurrency(dayData.gastos)}</span> en gastos.
                                            </p>
                                            <p className="text-lg">
                                                Balance: <span className={`font-bold ${dayData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    {formatCurrency(dayData.balance)}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'ingresos' && (
                                        allPagos && allPagos.length > 0 ? (
                                            <Table columns={pagosColumns} data={allPagos} />
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                No hay registros de ingresos detallados para este día.
                                            </div>
                                        )
                                    )}

                                    {activeTab === 'gastos' && (
                                        dailyGastos && dailyGastos.length > 0 ? (
                                            <Table columns={gastosColumns} data={dailyGastos} />
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                No hay registros de gastos para este día.
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
