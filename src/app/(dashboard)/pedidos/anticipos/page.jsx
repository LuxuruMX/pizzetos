"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { IoReload, IoMailOpenSharp } from "react-icons/io5";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import api from "@/services/api";

export default function AnticiposPage() {
    const [loading, setLoading] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchPedidosEspeciales = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("/pos/ver-pedidos-especiales");

            const data = Array.isArray(response.data) ? response.data : response.data?.pedidos || [];

            setPedidos(data);
        } catch (err) {
            setError(err.message || "Error al obtener los pedidos especiales");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pedido) => {
        // Navigate to POS with the sale ID to edit
        router.push(`/pos/${pedido.id_venta}`);
    };

    useEffect(() => {
        fetchPedidosEspeciales();
    }, []);

    const columns = [
        {
            header: "ID",
            accessor: "id_pespeciales", // Using specific ID from JSON
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">#{row.id_pespeciales}</span>
                    <span className="text-xs text-gray-500">Venta: #{row.id_venta}</span>
                </div>
            ),
        },
        {
            header: "CLIENTE",
            accessor: "cliente_nombre",
            render: (row) => (
                <div className="flex flex-col max-w-[200px]">
                    <span className="font-medium text-gray-800">{row.cliente_nombre}</span>
                    <span className="text-xs text-gray-500 truncate" title={row.direccion_detalles}>
                        {row.direccion_detalles}
                    </span>
                </div>
            ),
        },
        {
            header: "FECHAS",
            accessor: "fecha_creacion",
            render: (row) => (
                <div className="flex flex-col text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Creación:</span>
                        <span>
                            {new Date(row.fecha_creacion).toLocaleDateString("es-MX", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2 text-blue-600 font-medium">
                        <span>Entrega:</span>
                        <span>
                            {new Date(row.fecha_entrega).toLocaleDateString("es-MX", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            header: "CANT.",
            accessor: "cantidad_productos",
            render: (row) => (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    {row.cantidad_productos}
                </span>
            ),
        },
        {
            header: "PAGOS",
            accessor: "total_venta",
            render: (row) => (
                <div className="flex flex-col text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-semibold">${row.total_venta}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-green-600">
                        <span>Anticipo:</span>
                        <span>-${row.anticipo}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-red-600 font-bold border-t border-gray-200 mt-1 pt-1">
                        <span>Resta:</span>
                        <span>${row.saldo_pendiente}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "ACCIONES",
            accessor: "actions",
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="Editar pedido"
                    >
                        <FaEdit size={18} />
                    </button>

                    <button
                        disabled
                        className="text-gray-400 cursor-not-allowed p-2 rounded-full"
                        title="Pagar restante (Próximamente)"
                    >
                        <FaCheck size={20} />
                    </button>

                    <button
                        disabled
                        className="text-gray-400 cursor-not-allowed p-2 rounded-full"
                        title="Eliminar (Próximamente)"
                    >
                        <IoMailOpenSharp size={18} />
                    </button>

                    <button
                        disabled
                        className="text-gray-400 cursor-not-allowed p-2 rounded-full"
                        title="Eliminar (Próximamente)"
                    >
                        <FaTrash size={18} />
                    </button>

                </div>
            ),
        },
    ];

    if (loading && pedidos.length === 0) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando anticipos...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center py-8">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchPedidosEspeciales}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Pedidos Especiales / Anticipos
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Gestión de pedidos con fecha de entrega programada
                        </p>
                    </div>

                    <button
                        onClick={fetchPedidosEspeciales}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 transition-colors disabled:opacity-70"
                        disabled={loading}
                    >
                        <IoReload className={loading ? "animate-spin" : ""} />
                        <span>Actualizar</span>
                    </button>
                </div>

                {pedidos.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg">No hay pedidos especiales pendientes</p>
                        <p className="text-gray-400 text-sm mt-2">Los nuevos pedidos especiales aparecerán aquí</p>
                    </div>
                ) : (
                    <Table columns={columns} data={pedidos} />
                )}
            </Card>
        </div>
    );
}
