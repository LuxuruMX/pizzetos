'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/PedidosCard'
import { IoMailOpenSharp, IoSend, IoReload, IoClose } from "react-icons/io5";
import { FaClock } from "react-icons/fa";
import { PiCookingPotFill } from "react-icons/pi";
import { MdComment } from "react-icons/md";
import api from '@/services/api';

export default function App() {
    const [loading, setLoading] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [filtro, setFiltro] = useState('todos');
    const [statusFiltro, setStatusFiltro] = useState(null);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoDetalle, setPedidoDetalle] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const fetchPedidos = async () => {
      setLoading(true);
      setError(null);
      try {
        let params = { filtro };
        if (statusFiltro !== null) {
          params.status = statusFiltro;
        }
        
        const response = await api.get('/pos/pedidos-cocina', { params });
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
          const data = response.data;
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
          const data = response.data;
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
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchPedidos, 60000);
      return () => clearInterval(interval);
    }, [filtro, statusFiltro]);

    // Mapear los pedidos a formato de cards
    const cardsData = pedidos.map((pedido) => {
      const colorTiempo = pedido.tiempo_transcurrido_minutos > 30 
        ? 'text-red-600' 
        : pedido.tiempo_transcurrido_minutos > 15 
        ? 'text-yellow-600' 
        : 'text-green-600';

      // Definir acciones con estado habilitado/deshabilitado
      const actions = [
        { 
          icon: <PiCookingPotFill />, 
          onClick: () => togglePreparacion(pedido.id_venta),
          disabled: false // Siempre habilitado para toggle
        },
        { 
          icon: <IoMailOpenSharp />, 
          onClick: () => verDetalle(pedido.id_venta),
          disabled: false // Siempre habilitado
        },
        { 
          icon: <IoSend />, 
          onClick: () => completarPedido(pedido.id_venta, pedido.status),
          disabled: pedido.status !== 1 // Solo habilitado si está en preparación
        }
      ];

      return {
        id: pedido.id_venta,
        title: `Pedido #${pedido.id_venta} - ${pedido.cliente}`,
        description: (
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
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  pedido.status === 0 ? 'bg-gray-200 text-black' :
                  pedido.status === 1 ? 'bg-yellow-200 text-yellow-800' :
                  pedido.status === 2 ? 'bg-green-200 text-green-800':
                  'bg-red-200 text-red-800'
                }`}>
                  {pedido.status_texto}
                </span>
              </p>
            </div>

            {/* Sección de comentarios en la card */}
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
                <div key={idx} className={`mb-2 pl-2 border-l-2 rounded ${
                  prod.status === 0 ? 'bg-red-100 border-red-300' :
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
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-gray-500">
                {new Date(pedido.fecha_hora).toLocaleString('es-MX')}
              </p>
            </div>
          </>
        ),
        actions: actions
      };
    });

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className='text-3xl font-bold text-black'>Pedidos de Cocina</h1>
            
            <div className="flex gap-4 items-center">
              <select 
                value={statusFiltro ?? ''} 
                onChange={(e) => setStatusFiltro(e.target.value === '' ? null : parseInt(e.target.value))}
                className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Todos los estados</option>
                <option value="0">Esperando</option>
                <option value="1">Preparando</option>
              </select>

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
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {loading && pedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando pedidos...</p>
            </div>
          ) : cardsData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay pedidos para mostrar</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 items-start">
              {cardsData.map((card) => (
                <Card
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  actions={card.actions}
                  loading={loading}
                  maxHeight={200}
                />
              ))}
            </div>
          )}
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
                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        pedidoDetalle.status === 0 ? 'bg-gray-200 text-black' :
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
                        <div key={idx} className={`border-l-4 rounded pl-4 py-2 text-black ${
                          prod.status === 0 ? 'bg-red-50 border-red-500' :
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
      </div>
    );
}