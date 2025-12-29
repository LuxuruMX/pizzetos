'use client';

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaMoneyBillWave, FaCreditCard, FaExchangeAlt, FaReceipt, FaShoppingCart } from 'react-icons/fa';
import Table from './Table';

export default function CorteDetailsModal({ isOpen, onClose, dayData, dailyPedidos, dailyGastos }) {
    const [activeTab, setActiveTab] = useState('ingresos'); // 'ingresos' | 'gastos'

    if (!isOpen || !dayData) return null;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    // Columns for Pedidos List
    const pedidosColumns = [
        {
            header: 'FOLIO',
            accessor: 'id_venta',
            render: row => <span className="font-semibold text-gray-800">#{row.id_venta}</span>
        },
        {
            header: 'HORA',
            accessor: 'fecha_hora',
            render: row => <span className="text-gray-600 text-sm">{formatDate(row.fecha_hora)}</span>
        },
        {
            header: 'MÉTODO PAGO',
            accessor: 'pagos',
            render: row => {
                // If it has multiple payments, show primary or "Mixto"
                if (!row.pagos || row.pagos.length === 0) return <span className="text-gray-500 text-xs">Desconocido</span>;
                return (
                    <div className="flex flex-col gap-1">
                        {row.pagos.map((p, idx) => {
                            const icons = {
                                1: <FaCreditCard className="text-blue-500" />,   // Tarjeta
                                2: <FaMoneyBillWave className="text-green-500" />, // Efectivo
                                3: <FaExchangeAlt className="text-purple-500" />   // Transferencia
                            };
                            const labels = { 1: 'Tarjeta', 2: 'Efectivo', 3: 'Transf.' };
                            return (
                                <div key={idx} className="flex items-center gap-1 text-xs text-gray-700">
                                    {icons[p.id_metpago] || <FaMoneyBillWave />}
                                    <span>{labels[p.id_metpago] || 'Otro'}</span>
                                    {p.referencia && <span className="text-gray-400 italic">({p.referencia})</span>}
                                </div>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            header: 'MONTO',
            accessor: 'total',
            render: row => <span className="font-bold text-gray-800">{formatCurrency(row.total)}</span>
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

                    {/* Breakdown Payment Methods Mini-Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-6 text-sm">
                        <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center">
                            <span className="block text-green-700 text-xs font-semibold mb-1">Efectivo</span>
                            <span className="block font-bold text-green-900">{formatCurrency(dayData.efectivo)}</span>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                            <span className="block text-blue-700 text-xs font-semibold mb-1">Tarjeta</span>
                            <span className="block font-bold text-blue-900">{formatCurrency(dayData.tarjeta)}</span>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg text-center">
                            <span className="block text-purple-700 text-xs font-semibold mb-1">Transferencia</span>
                            <span className="block font-bold text-purple-900">{formatCurrency(dayData.transferencia)}</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('ingresos')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'ingresos'
                                    ? 'bg-white text-yellow-600 border-b-2 border-yellow-600'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Detalle de Ingresos ({dailyPedidos.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('gastos')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'gastos'
                                    ? 'bg-white text-red-600 border-b-2 border-red-600'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Detalle de Gastos ({dailyGastos.length})
                            </button>
                        </div>

                        <div className="p-0">
                            {activeTab === 'ingresos' ? (
                                dailyPedidos.length > 0 ? (
                                    <Table columns={pedidosColumns} data={dailyPedidos} />
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        No hay registros de ingresos para este día.
                                    </div>
                                )
                            ) : (
                                dailyGastos.length > 0 ? (
                                    <Table columns={gastosColumns} data={dailyGastos} />
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        No hay registros de gastos para este día.
                                    </div>
                                )
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
