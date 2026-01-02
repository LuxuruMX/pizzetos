"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { IoReload, IoMailOpenSharp, IoClose } from "react-icons/io5";
import { FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import { MdComment } from "react-icons/md";
import api from "@/services/api";
import { pagarVenta } from "@/services/orderService";
import PaymentModal from "@/components/ui/PaymentModal";

import { getSucursalFromToken } from "@/services/jwt";
import CancellationModal from "@/components/ui/CancellationModal";

export default function AnticiposPage() {
    const [loading, setLoading] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [error, setError] = useState(null);
    const [statusFiltro, setStatusFiltro] = useState(1); // 1 = Normal/Pendiente por defecto
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [pedidoDetalle, setPedidoDetalle] = useState(null);
    const [modalPagosOpen, setModalPagosOpen] = useState(false);

    const [pedidoAPagar, setPedidoAPagar] = useState(null);
    const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
    const [pedidoACancelar, setPedidoACancelar] = useState(null);
    const [canceling, setCanceling] = useState(false);


    const verDetalle = async (id) => {
        setLoadingDetalle(true);
        setModalOpen(true);
        try {
            const response = await api.get(`/pos/pedidos-cocina/${id}/detalle`);

            if (response.status === 200) {
                const data = response.data;
                setPedidoDetalle(data);
            } else {
                throw new Error('Error al obtener el detalle');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error al cargar el detalle del pedido');
            setModalOpen(false);
        } finally {
            setLoadingDetalle(false);
        }
    };


    const fetchPedidosEspeciales = async () => {
        setLoading(true);
        setError(null);
        try {
            const idSuc = getSucursalFromToken();
            const response = await api.get(`/pos/ver-pedidos-especiales?id_suc=${idSuc}&status=${statusFiltro}`);

            const data = Array.isArray(response.data) ? response.data : response.data?.pedidos || [];

            setPedidos(data);
        } catch (err) {
            setError(err.message || "Error al obtener los pedidos especiales");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };


    const cerrarModal = () => {
        setModalOpen(false);
        setPedidoDetalle(null);
    };

    const completarPedidoEspecial = async (id_pespeciales) => {
        try {
            // "y solo envia su id a esto: /pos/completar-pespecial/{id_pespeciales}"
            const response = await api.patch(`/pos/completar-pespecial/${id_pespeciales}`);

            if (response.status === 200) {
                // Éxito
                fetchPedidosEspeciales(); // Recargar lista
            } else {
                throw new Error('Error al completar el pedido especial');
            }
        } catch (err) {
            console.error('Error al completar:', err);
            alert('Error al completar el pedido. ' + (err.response?.data?.message || err.message));
        }
    };

    const handleFinishOrder = (row) => {
        if (row.saldo_pendiente > 0) {
            // Si debe, abrir modal de pagos
            setPedidoAPagar(row);
            setModalPagosOpen(true);
        } else {
            // Si no debe, completar directamente
            if (confirm("¿Confirmar entrega del pedido?")) {
                completarPedidoEspecial(row.id_pespeciales);
            }
        }
    };

    const handleCancel = (row) => {
        setPedidoACancelar(row);
        setCancellationModalOpen(true);
    };

    const confirmCancellation = async (motivo) => {
        setCanceling(true);
        try {
            const response = await api.patch(`/pos/${pedidoACancelar.id_venta}/cancelar?motivo_cancelacion=${encodeURIComponent(motivo)}`);

            if (response.status === 200) {
                fetchPedidosEspeciales();
                setCancellationModalOpen(false);
                setPedidoACancelar(null);
            } else {
                throw new Error("Error al cancelar");
            }
        } catch (error) {
            console.error(error);
            alert("Error al cancelar el pedido: " + (error.response?.data?.message || error.message));
        } finally {
            setCanceling(false);
        }
    };

    const handleEdit = (pedido) => {
        // Navigate to POS with the sale ID to edit
        router.push(`/pos/${pedido.id_venta}`);
    };

    useEffect(() => {
        fetchPedidosEspeciales();
    }, [statusFiltro]); // Refetch when filter changes

    const columns = [
        {
            header: "ID",
            accessor: "id_pespeciales",
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
            render: (row) => {
                // Disable edit/finish if status is not 1 (Pendiente/Normal)
                const isActionable = parseInt(statusFiltro) === 1;

                return (
                    <div className="flex justify-center gap-2">
                        <button
                            onClick={() => handleEdit(row)}
                            disabled={!isActionable}
                            className={`p-2 rounded-full transition-colors ${isActionable
                                ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                            title={isActionable ? "Editar pedido" : "No disponible"}
                        >
                            <FaEdit size={18} />
                        </button>

                        <button
                            onClick={() => handleFinishOrder(row)}
                            disabled={!isActionable}
                            className={`p-2 rounded-full transition-colors ${isActionable
                                ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                            title={isActionable ? "Terminar y Pagar" : "No disponible"}
                        >
                            <FaCheck size={20} />
                        </button>

                        <button
                            onClick={() => verDetalle(row.id_venta)}
                            className="text-gray-600 hover:text-gray-800 transition-colors p-2 hover:bg-gray-50 rounded-full"
                            title="Ver detalle"
                        >
                            <IoMailOpenSharp size={18} />
                        </button>

                        <button
                            onClick={() => handleCancel(row)}
                            disabled={!isActionable}
                            className={`transition-colors p-2 rounded-full ${isActionable
                                ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                            title={isActionable ? "Cancelar pedido" : "No disponible"}
                        >
                            <FaTrash size={18} />
                        </button>
                    </div>
                );
            },
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
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Pedidos Especiales / Anticipos
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Gestión de pedidos con fecha de entrega programada
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFiltro}
                            onChange={(e) => setStatusFiltro(Number(e.target.value))}
                            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        >
                            <option value={1}>Pendientes</option>
                            <option value={2}>Completados</option>
                            <option value={0}>Cancelados</option>
                        </select>

                        <button
                            onClick={fetchPedidosEspeciales}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 transition-colors disabled:opacity-70"
                            disabled={loading}
                        >
                            <IoReload className={loading ? "animate-spin" : ""} />
                            <span>Actualizar</span>
                        </button>
                    </div>
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

            {/* Modal de detalle con efecto blur */}
            {modalOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-white/30"
                    onClick={cerrarModal}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-black">
                                {loadingDetalle ? 'Cargando...' : `Pedido #${pedidoDetalle?.id_venta}`}
                            </h2>
                            <button
                                onClick={cerrarModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                <IoClose />
                            </button>
                        </div>

                        {loadingDetalle ? (
                            <div className="p-6 text-center">
                                <p>Cargando detalle del pedido...</p>
                            </div>
                        ) : pedidoDetalle && (
                            <div className="p-6">
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Cliente</p>
                                        <p className="font-semibold text-lg text-black">{pedidoDetalle.cliente}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Sucursal</p>
                                        <p className="font-semibold text-lg text-black">{pedidoDetalle.sucursal}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Estado</p>
                                        <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${pedidoDetalle.status === 0 ? 'bg-gray-200 text-black' :
                                            pedidoDetalle.status === 1 ? 'bg-yellow-200 text-yellow-800' :
                                                pedidoDetalle.status === 5 ? 'bg-red-200 text-red-800' :
                                                    'bg-green-200 text-green-800'
                                            }`}>
                                            {pedidoDetalle.status_texto}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Tiempo transcurrido</p>
                                        <p className="font-semibold text-lg text-black">
                                            {pedidoDetalle.tiempo_transcurrido_minutos} minutos
                                        </p>
                                    </div>
                                </div>

                                {/* Sección de comentarios en el modal */}
                                {pedidoDetalle.comentarios && (
                                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                        <div className="flex items-start gap-3">
                                            <MdComment className="text-2xl text-yellow-600 flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-black mb-2">
                                                    Comentarios especiales
                                                </h4>
                                                <p className="text-gray-800 italic">
                                                    "{pedidoDetalle.comentarios}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-4 text-black">
                                        Productos ({pedidoDetalle.cantidad_items} items)
                                    </h3>

                                    {/* Leyenda de estado de productos */}
                                    <div className="mb-4 flex flex-wrap gap-3 text-xs text-black">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded border border-red-500 bg-red-50"></div>
                                            <span>Cancelado</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded border border-gray-300 bg-gray-50"></div>
                                            <span>En espera</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded border border-green-500 bg-green-50"></div>
                                            <span>Cocinado</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {pedidoDetalle.productos.map((prod, idx) => (
                                            <div key={idx} className={`border-l-4 rounded pl-4 py-2 text-black ${prod.status === 0 ? 'bg-red-50 border-red-500' :
                                                prod.status === 1 ? 'bg-gray-50 border-gray-300' :
                                                    prod.status === 2 ? 'bg-green-50 border-green-500' :
                                                        'bg-gray-100 border-gray-200'
                                                }`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-lg">
                                                            {prod.cantidad}x {prod.nombre || 'Producto sin nombre'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{prod.tipo}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-500">
                                        Fecha: {new Date(pedidoDetalle.fecha_hora).toLocaleString('es-MX')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {
                modalPagosOpen && pedidoAPagar && (
                    <PaymentModal
                        isOpen={modalPagosOpen}
                        onClose={() => {
                            setModalPagosOpen(false);
                            setPedidoAPagar(null);
                        }}
                        total={pedidoAPagar.saldo_pendiente} // Cobra solo lo que falta
                        onConfirm={async (pagos) => {
                            try {
                                // 1. Pagar lo restante
                                await pagarVenta(pedidoAPagar.id_venta, pagos);
                                setModalPagosOpen(false);

                                // 2. Completar el pedido especial automáticamente
                                await completarPedidoEspecial(pedidoAPagar.id_pespeciales);

                                setPedidoAPagar(null);
                            } catch (error) {
                                alert(error.response?.data?.message || 'Error al procesar el pago');
                            }
                        }}
                    />
                )
            }

            <CancellationModal
                isOpen={cancellationModalOpen}
                onClose={() => {
                    setCancellationModalOpen(false);
                    setPedidoACancelar(null);
                }}
                onConfirm={confirmCancellation}
                loading={canceling}
            />
        </div>
    );
}
