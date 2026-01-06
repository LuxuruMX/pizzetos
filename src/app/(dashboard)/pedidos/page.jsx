'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/PedidosCard'
import { IoMailOpenSharp, IoSend, IoReload, IoClose } from "react-icons/io5";
import { FaClock } from "react-icons/fa";
import { PiCookingPotFill } from "react-icons/pi";
import { MdComment } from "react-icons/md";
import api from '@/services/api';

export default function Pedidos() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ya no enviamos filtros, traemos todo lo activo
      const response = await api.get('/pos/pedidos-cocina');
      setPedidos(response.data.pedidos);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle entre Esperando (0) y Preparando (1)
  const togglePreparacion = async (id_venta) => {
    try {
      const response = await api.patch(`/pos/${id_venta}/toggle-preparacion`);

      if (response.status === 200) {
        fetchPedidos();
      } else {
        const error = response.data;
        alert(error.detail);
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      alert('Error al actualizar el estado del pedido');
    }
  };

  // Completar pedido (1 -> 2)
  const completarPedido = async (id_venta, status) => {
    // Solo permitir si está en estado 1 (Preparando)
    if (status !== 1) {
      return;
    }

    try {
      const response = await api.patch(`/pos/${id_venta}/completar`);

      if (response.status === 200) {
        fetchPedidos();
      } else {
        const error = response.data;
        alert(error.detail);
      }
    } catch (err) {
      console.error('Error al completar:', err);
      alert('Error al completar el pedido');
    }
  };

  // Ver detalle del pedido en modal
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

  const cerrarModal = () => {
    setModalOpen(false);
    setPedidoDetalle(null);
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchPedidos();
    // Auto-refresh cada 10 segundos
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  // Función auxiliar para renderizar una card
  const renderCard = (pedido) => {
    const colorTiempo = pedido.tiempo_transcurrido_minutos > 30
      ? 'text-red-600'
      : pedido.tiempo_transcurrido_minutos > 15
        ? 'text-yellow-600'
        : 'text-green-600';

    const actions = [
      {
        icon: <PiCookingPotFill />,
        iconDescription: 'Preparar',
        onClick: () => togglePreparacion(pedido.id_venta),
        disabled: false
      },
      {
        icon: <IoMailOpenSharp />,
        iconDescription: 'Ver detalle',
        onClick: () => verDetalle(pedido.id_venta),
        disabled: false
      },
      {
        icon: <IoSend />,
        iconDescription: 'Completar',
        onClick: () => completarPedido(pedido.id_venta, pedido.status),
        disabled: pedido.status !== 1
      }
    ];

    const description = (
      <>
        <div className="mb-3 pb-2 border-b">
          <p className="mb-1 flex items-center gap-2">
            <FaClock className={colorTiempo} />
            <b>Tiempo:</b>
            <span className={colorTiempo}>
              {pedido.tiempo_transcurrido_minutos} min
            </span>
          </p>
          <p className="mb-1"><b>Sucursal:</b> {pedido.sucursal}</p>
          <p className="mb-1">
            <b>Estado:</b>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${pedido.status === 0 ? 'bg-gray-200 text-black' :
              pedido.status === 1 ? 'bg-yellow-200 text-yellow-800' :
                pedido.status === 2 ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
              }`}>
              {pedido.status_texto}
            </span>
          </p>
        </div>

        {pedido.comentarios && (
          <div className="mb-3 pb-2 border-b bg-yellow-50 p-2 rounded">
            <p className="flex items-center gap-2 font-semibold text-sm mb-1">
              <MdComment className="text-yellow-600" />
              Comentarios:
            </p>
            <p className="text-xs text-gray-700 italic pl-6">
              "{pedido.comentarios}"
            </p>
          </div>
        )}

        <div className="mb-2">
          <p className="font-bold mb-2">Productos ({pedido.cantidad_items} items):</p>
          {pedido.productos.map((prod, idx) => (
            <div key={idx} className={`mb-2 pl-2 border-l-2 rounded ${prod.status === 0 ? 'bg-red-100 border-red-300' :
              prod.status === 1 ? 'bg-gray-100 border-gray-300' :
                prod.status === 2 ? 'bg-green-100 border-green-300' :
                  'bg-gray-50 border-gray-200'
              }`}>
              <p className="font-semibold text-sm">
                {prod.cantidad}x {prod.nombre || 'Producto sin nombre'}
              </p>
              <p className="text-xs text-gray-600">
                {prod.tipo}
              </p>
              {prod.es_personalizado && prod.detalles_ingredientes && (
                <div className="mt-1 text-xs bg-white/50 p-1 rounded">
                  <p className="font-semibold text-gray-700">Tamaño: {prod.detalles_ingredientes.tamano}</p>
                  <p className="text-gray-600">
                    Ingredientes ({prod.detalles_ingredientes.cantidad_ingredientes}): {prod.detalles_ingredientes.ingredientes.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-gray-500">
            {new Date(pedido.fecha_hora).toLocaleString('es-MX')}
          </p>
        </div>
      </>
    );

    return (
      <Card
        key={pedido.id_venta}
        title={`Pedido #${pedido.id_venta} - ${pedido.cliente}`}
        description={description}
        actions={actions}
        loading={loading}
        maxHeight={200}
      />
    );
  };

  // Filtrar pedidos
  const pedidosEnEspera = pedidos.filter(p => p.status === 0);
  const pedidosPreparando = pedidos.filter(p => p.status === 1);

  // Dividir pedidos en 2 filas aproximadamente iguales
  const splitIntoRows = (array) => {
    const midIndex = Math.ceil(array.length / 2);
    return [
      array.slice(0, midIndex),
      array.slice(midIndex)
    ];
  };

  const [esperaFila1, esperaFila2] = splitIntoRows(pedidosEnEspera);
  const [preparandoFila1, preparandoFila2] = splitIntoRows(pedidosPreparando);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className='text-3xl font-bold text-black'>Pedidos de Cocina</h1>

          <button
            onClick={fetchPedidos}
            className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? 'Cargando...' : (
              <>
                <IoReload />
                <span>Actualizar</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna En Espera */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[500px]">
            <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              En Espera ({pedidosEnEspera.length})
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Fila 1 */}
              <div className="flex-1 space-y-4">
                {esperaFila1.map(renderCard)}
                {esperaFila1.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay pedidos en espera</p>
                )}
              </div>

              {/* Fila 2 */}
              <div className="flex-1 space-y-4">
                {esperaFila2.map(renderCard)}
                {esperaFila2.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay pedidos en espera</p>
                )}
              </div>
            </div>
          </div>

          {/* Columna Preparando */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 min-h-[500px]">
            <h2 className="text-xl font-bold mb-4 text-yellow-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              Preparando ({pedidosPreparando.length})
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Fila 1 */}
              <div className="flex-1 space-y-4">
                {preparandoFila1.map(renderCard)}
                {preparandoFila1.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay pedidos en preparación</p>
                )}
              </div>

              {/* Fila 2 */}
              <div className="flex-1 space-y-4">
                {preparandoFila2.map(renderCard)}
                {preparandoFila2.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay pedidos en preparación</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                          <div className="flex-1">
                            <p className="font-bold text-lg">
                              {prod.cantidad}x {prod.nombre || 'Producto sin nombre'}
                            </p>
                            <p className="text-sm text-gray-600">{prod.tipo}</p>
                            {prod.es_personalizado && prod.detalles_ingredientes && (
                              <div className="mt-2 bg-white/70 p-3 rounded border border-gray-200">
                                <p className="font-semibold text-sm text-gray-800 mb-1">
                                  🍕 Tamaño: {prod.detalles_ingredientes.tamano}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">Ingredientes ({prod.detalles_ingredientes.cantidad_ingredientes}):</span>
                                </p>
                                <ul className="mt-1 ml-4 list-disc text-sm text-gray-600">
                                  {prod.detalles_ingredientes.ingredientes.map((ing, ingIdx) => (
                                    <li key={ingIdx}>{ing}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
    </div>
  );
}