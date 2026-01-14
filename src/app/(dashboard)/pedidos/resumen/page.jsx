"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { IoReload } from "react-icons/io5";
import { FaEdit, FaTrash } from "react-icons/fa";
import Popconfirm from "@/components/ui/Popconfirm";
import api from "@/services/api";
import { MdOutlinePayments } from "react-icons/md";
import PaymentModal from "@/components/ui/PaymentModal";
import { pagarVenta } from "@/services/orderService";
import CancellationModal from "@/components/ui/CancellationModal";


export default function TodosPedidosPage() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("hoy");
  const [statusFiltro, setStatusFiltro] = useState(null);
  const [idSuc, setIdSuc] = useState(null);
  const [modalPagosOpen, setModalPagosOpen] = useState(false);
  const [permisos, setPermisos] = useState(null);

  const [pedidoAPagar, setPedidoAPagar] = useState(null);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const router = useRouter();

  const fetchTodosPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = { filtro };

      if (statusFiltro !== null && statusFiltro !== "") {
        params.status = statusFiltro;
      }

      if (idSuc) {
        params.id_suc = idSuc;
      }

      const response = await api.get("/pos/pedidos-resumen", { params });

      setPedidos(response.data.pedidos);
    } catch (err) {
      setError(err.message || "Error al obtener los pedidos");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (product) => {
    router.push(`/pos/${product.id_venta}`);
  };

  const handleDelete = (row) => {
    setPedidoACancelar(row);
    setCancellationModalOpen(true);
  };

  const confirmCancellation = async (motivo) => {
    setCanceling(true);
    try {
      await api.patch(`/pos/${pedidoACancelar.id_venta}/cancelar?motivo_cancelacion=${encodeURIComponent(motivo)}`);
      fetchTodosPedidos();
      setCancellationModalOpen(false);
      setPedidoACancelar(null);
    } catch (error) {
      console.error(error);
      alert("Error al cancelar el pedido: " + (error.response?.data?.message || error.message));
    } finally {
      setCanceling(false);
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    // Cargar permisos
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const jwtDecode = require('jwt-decode').jwtDecode;
          const decoded = jwtDecode(token);
          setPermisos(decoded.permisos || {});
        } catch (e) {
          console.error("Error decoding token", e);
        }
      }
    }
    fetchTodosPedidos();
  }, [filtro, statusFiltro, idSuc]);

  // Calcular suma total de todos los pedidos
  const sumaTotal = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);

  // Columnas de la tabla
  const columns = [
    {
      header: "ID PEDIDO",
      accessor: "id_venta",
      render: (row) => <span className="font-semibold">#{row.id_venta}</span>,
    },
    {
      header: "CLIENTE",
      accessor: "cliente",
      render: (row) => <span className="text-gray-700">{row.cliente}</span>,
    },
    {
      header: "SUCURSAL",
      accessor: "sucursal",
      render: (row) => <span className="text-gray-600">{row.sucursal}</span>,
    },
    {
      header: "PRODUCTOS",
      accessor: "cantidad_items",
      render: (row) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
          {row.cantidad_items}
        </span>
      ),
    },
    {
      header: "TOTAL",
      accessor: "total",
      render: (row) => (
        <span className="text-green-600 font-bold">
          ${row.total.toFixed(2)}
        </span>
      ),
    },
    {
      header: "FECHA",
      accessor: "fecha_hora",
      render: (row) => (
        <span className="text-gray-500 text-sm">
          {new Date(row.fecha_hora).toLocaleString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "ESTADO",
      accessor: "status_texto",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === 0
            ? "bg-gray-200 text-gray-800"
            : row.status === 1
              ? "bg-yellow-200 text-yellow-800"
              : row.status === 2
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
        >
          {row.status_texto}
        </span>
      ),
    },
    {
      header: "DETALLE",
      accessor: "detalle",
      render: (row) => {
        // Solo mostrar detalle para pedidos de domicilio (tipo_servicio === 2) o cancelados
        if ((row.tipo_servicio !== 2 && row.status !== 5) || !row.detalle) {
          return <span className="text-gray-400 text-sm">-</span>;
        }

        // Determinar el color y estilo según el tipo de detalle
        let badgeClass = "bg-blue-100 text-blue-800";

        if (row.status === 5) {
          badgeClass = "bg-red-100 text-red-800";
        } else if (row.detalle.includes("Pago realizado")) {
          badgeClass = "bg-green-100 text-green-800";
        } else if (row.detalle.includes("terminal")) {
          badgeClass = "bg-purple-100 text-purple-800";
        } else if (row.detalle.includes("cambio")) {
          badgeClass = "bg-orange-100 text-orange-800";
        }

        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
            {row.detalle}
          </span>
        );
      },
    },
    {
      header: "ACCIONES",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center gap-2">
          {row.status !== 5 && (
            <>
              {permisos?.modificar_venta && (
                <button
                  onClick={() => handleEdit(row)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <FaEdit size={22} />
                </button>
              )}

              {permisos?.eliminar_venta && (
                <button
                  onClick={() => handleDelete(row)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Eliminar"
                >
                  <FaTrash size={22} />
                </button>
              )}
            </>
          )}

          {
            !row.pagado && (
              <button
                onClick={() => {
                  setPedidoAPagar(row);
                  setModalPagosOpen(true);
                }}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="Pagar"
              >
                <MdOutlinePayments size={22} />
              </button>
            )
          }
        </div >
      ),
    },
  ];

  if (loading && pedidos.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando pedidos...</p>
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
            <p className="text-red-600">{error}</p>
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
              Todos los Pedidos
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Historial completo de pedidos
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="todos">Todos los registros</option>
            </select>

            <select
              value={statusFiltro ?? ""}
              onChange={(e) =>
                setStatusFiltro(
                  e.target.value === "" ? null : parseInt(e.target.value)
                )
              }
              className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="0">Esperando</option>
              <option value="1">Preparando</option>
              <option value="2">Completado</option>
              <option value="5">Cancelado</option>
            </select>

            <button
              onClick={fetchTodosPedidos}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              {loading ? (
                "Cargando..."
              ) : (
                <>
                  <IoReload />
                  <span>Actualizar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-6 text-sm">
              <span className="text-gray-600">
                Total de pedidos:{" "}
                <span className="font-semibold text-gray-800">
                  {pedidos.length}
                </span>
              </span>
              <span className="text-gray-600">
                Esperando:{" "}
                <span className="font-semibold text-gray-800">
                  {pedidos.filter((p) => p.status === 0).length}
                </span>
              </span>
              <span className="text-gray-600">
                Preparando:{" "}
                <span className="font-semibold text-yellow-600">
                  {pedidos.filter((p) => p.status === 1).length}
                </span>
              </span>
              <span className="text-gray-600">
                Completados:{" "}
                <span className="font-semibold text-green-600">
                  {pedidos.filter((p) => p.status === 2).length}
                </span>
              </span>
              <span className="text-gray-600">
                Cancelados:{" "}
                <span className="font-semibold text-red-600">
                  {pedidos.filter((p) => p.status === 5).length}
                </span>
              </span>
              <span className="text-gray-600 ml-auto">
                Suma total:{" "}
                <span className="font-bold text-green-600 text-lg">
                  ${sumaTotal.toFixed(2)}
                </span>
              </span>
            </div>
            <Table columns={columns} data={pedidos} />
          </>
        )}
      </Card>

      {
        modalPagosOpen && pedidoAPagar && (
          <PaymentModal
            isOpen={modalPagosOpen}
            onClose={() => {
              setModalPagosOpen(false);
              setPedidoAPagar(null);
            }}
            total={pedidoAPagar.total}
            onConfirm={async (pagos) => {
              try {
                await pagarVenta(pedidoAPagar.id_venta, pagos);
                setModalPagosOpen(false);
                setPedidoAPagar(null);
                fetchTodosPedidos(); // Recargar lista
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
    </div >
  );
}
