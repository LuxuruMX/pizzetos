'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/PedidosCard'
import { IoMailOpenSharp, IoSend, IoReload, IoClose } from "react-icons/io5";
import { FaClock } from "react-icons/fa";
import { PiCookingPotFill } from "react-icons/pi";
import { MdComment, MdExpandMore, MdExpandLess } from "react-icons/md";
import api from '@/services/api';
import { showToast } from '@/utils/toast';

import { getSucursalFromToken } from '@/services/jwt';

export default function Pedidos() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState({});
  const [currentVersion, setCurrentVersion] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar el tiempo actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada 60 segundos

    return () => clearInterval(timer);
  }, []);

  // Función para calcular el tiempo transcurrido en minutos
  const calcularTiempoTranscurrido = (fechaHora) => {
    const fechaPedido = new Date(fechaHora);
    const diffMs = currentTime - fechaPedido;
    const diffMinutos = Math.floor(diffMs / 60000);
    return diffMinutos >= 0 ? diffMinutos : 0;
  };

  const toggleIngredientes = (prodIndex) => {
    setExpandedIngredients(prev => ({
      ...prev,
      [prodIndex]: !prev[prodIndex]
    }));
  };

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/pos/pedidos-cocina');
      setPedidos(response.data.pedidos);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkVersion = async () => {
    try {
      const id_suc = getSucursalFromToken();
      if (!id_suc) {
        console.error("No se pudo obtener id_suc del token");
        return;
      }

      const response = await api.get(`/pos/pedidos-cocina/verificacion/${id_suc}`);
      const newVersion = response.data.version;

      if (currentVersion !== newVersion) {
        console.log(`Nueva versión detectada: ${newVersion} (Anterior: ${currentVersion})`);
        setCurrentVersion(newVersion);
        await fetchPedidos(); // Solo aquí recargamos todo si hay cambios globales
      }
    } catch (err) {
      console.error('Error verificando versión:', err);
    }
  };

  // Función para actualizar localmente un pedido específico
  const updateLocalPedido = (id_venta, updates) => {
    setPedidos(prevPedidos =>
      prevPedidos.map(pedido =>
        pedido.id_venta === id_venta
          ? { ...pedido, ...updates }
          : pedido
      )
    );
  };

  // Toggle entre Esperando (0) y Preparando (1)
  const togglePreparacion = async (pedidoActual) => {
    const { id_venta, status } = pedidoActual;

    // Actualización optimista: cambiar estado inmediatamente
    const nuevoStatus = status === 0 ? 1 : 0;
    updateLocalPedido(id_venta, { status: nuevoStatus });

    try {
      const response = await api.patch(`/pos/${id_venta}/toggle-preparacion`);

      if (response.status !== 200) {
        const error = response.data;
        showToast.error(error.detail);
        // Revertir en caso de error
        updateLocalPedido(id_venta, { status: status });
      } else {
        // Actualizar version si es exitoso
        const id_suc = getSucursalFromToken();
        if (id_suc) {
          try {
            const vResponse = await api.get(`/pos/pedidos-cocina/verificacion/${id_suc}`);
            setCurrentVersion(vResponse.data.version);
          } catch (e) { console.error(e); }
        }
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
      showToast.error('Error al actualizar el estado del pedido');
      // Revertir en caso de error de red
      updateLocalPedido(id_venta, { status: status });
    }
  };

  // Completar pedido (1 -> 2)
  const completarPedido = async (pedidoActual) => {
    const { id_venta, status } = pedidoActual;

    // Solo permitir si está en estado 1 (Preparando)
    if (status !== 1) {
      return;
    }

    // Actualización optimista
    updateLocalPedido(id_venta, { status: 2 });

    try {
      const response = await api.patch(`/pos/${id_venta}/completar`);

      if (response.status !== 200) {
        const error = response.data;
        showToast.error(error.detail);
        // Revertir en caso de error
        updateLocalPedido(id_venta, { status: 1 });
      } else {
        // Actualizar version si es exitoso
        const id_suc = getSucursalFromToken();
        if (id_suc) {
          try {
            const vResponse = await api.get(`/pos/pedidos-cocina/verificacion/${id_suc}`);
            setCurrentVersion(vResponse.data.version);
          } catch (e) { console.error(e); }
        }
      }
    } catch (err) {
      console.error('Error al completar:', err);
      showToast.error('Error al completar el pedido');
      // Revertir en caso de error de red
      updateLocalPedido(id_venta, { status: 1 });
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
      showToast.error('Error al cargar el detalle del pedido');
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
    checkVersion();
    // Auto-refresh verificando versión cada 3 segundos
    const interval = setInterval(checkVersion, 3000);
    return () => clearInterval(interval);
  }, [currentVersion]);


  // Función auxiliar para renderizar una card
  const renderCard = (pedido) => {
    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fecha_hora);

    const colorTiempo = tiempoTranscurrido > 30
      ? 'text-red-600'
      : tiempoTranscurrido > 15
        ? 'text-yellow-600'
        : 'text-green-600';

    const actions = [
      {
        icon: <PiCookingPotFill />,
        iconDescription: 'Preparar',
        onClick: () => togglePreparacion(pedido),
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
        onClick: () => completarPedido(pedido),
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
              {tiempoTranscurrido} min
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
                {prod.con_queso && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                    Orilla de Queso
                  </span>
                )}
              </p>
              {prod.es_personalizado && prod.detalles_ingredientes && (
                <div className="mt-1 text-xs bg-white/50 p-1 rounded">
                  <p className="font-semibold text-gray-700">Tamaño: {prod.detalles_ingredientes.tamano}</p>
                  <p className="text-gray-600">
                    Ingredientes ({prod.detalles_ingredientes.cantidad_ingredientes}): {prod.detalles_ingredientes.ingredientes.join(', ')}
                  </p>
                </div>
              )}
              {prod.tipo === 'Paquete' && prod.detalles_ingredientes && (
                <div className="mt-1 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                  {prod.detalles_ingredientes.pizzas && prod.detalles_ingredientes.pizzas.length > 0 && (
                    <div className="mb-1">
                      <p className="font-semibold text-gray-700">Pizzas:</p>
                      <ul className="list-disc list-inside ml-1 text-gray-600">
                        {prod.detalles_ingredientes.pizzas.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {prod.detalles_ingredientes.hamburguesa && (
                    <p className="mb-1"><span className="font-semibold text-gray-700">Hamburguesa:</span> {prod.detalles_ingredientes.hamburguesa}</p>
                  )}
                  {prod.detalles_ingredientes.alitas && (
                    <p className="mb-1"><span className="font-semibold text-gray-700">Alitas:</span> {prod.detalles_ingredientes.alitas}</p>
                  )}
                  {prod.detalles_ingredientes.refresco && (
                    <p><span className="font-semibold text-gray-700">Refresco:</span> {prod.detalles_ingredientes.refresco}</p>
                  )}
                </div>
              )}
              {prod.especialidades && prod.especialidades.length > 0 && (
                <div className="mt-1 text-xs bg-blue-50 p-1 rounded border border-blue-100">
                  <p className="font-semibold text-blue-800">Especialidades:</p>
                  <ul className="list-disc list-inside text-blue-700">
                    {prod.especialidades.map((esp, i) => (
                      <li key={i} className="truncate">{esp}</li>
                    ))}
                  </ul>
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
        maxHeight={150}
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
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        {/* Carrusel En Espera */}
        <div className="bg-red-50 p-4 rounded-lg border border-gray-200 mb-8 flex">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2 vertical-title mr-4 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            Preparando
          </h2>

          {/* Contenedor del carrusel horizontal */}
          <div className="overflow-x-auto hide-scrollbar pb-2 flex-grow w-0">
            <div className="flex space-x-4 w-max min-w-full">
              {pedidosEnEspera.length > 0 ? (
                pedidosEnEspera.map(renderCard)
              ) : (
                <p className="text-gray-500 text-center py-8 w-full">No hay pedidos en espera</p>
              )}
            </div>
          </div>
        </div>

        {/* Carrusel Preparando */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex">
          <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2 vertical-title mr-4 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            Entregado
          </h2>

          {/* Contenedor del carrusel horizontal */}
          <div className="overflow-x-auto hide-scrollbar pb-2 flex-grow w-0">
            <div className="flex space-x-4 w-max min-w-full">
              {pedidosPreparando.length > 0 ? (
                pedidosPreparando.map(renderCard)
              ) : (
                <p className="text-gray-500 text-center py-8 w-full">No hay pedidos en preparación</p>
              )}
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
                      {calcularTiempoTranscurrido(pedidoDetalle.fecha_hora)} minutos
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
                            {prod.con_queso && (
                              <span className="inline-block mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-bold rounded-full">
                                🧀 Con Queso
                              </span>
                            )}
                            {prod.es_personalizado && prod.detalles_ingredientes && (
                              <div className="mt-3 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <div className="flex justify-between items-center cursor-pointer mb-2"
                                  onClick={() => toggleIngredientes(idx)}>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">Tamaño Personalizado</p>
                                      <p className="font-bold text-gray-800">{prod.detalles_ingredientes.tamano}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                      {prod.detalles_ingredientes.cantidad_ingredientes}
                                    </span>
                                    {expandedIngredients[idx] ? <MdExpandLess /> : <MdExpandMore />}
                                  </div>
                                </div>

                                {expandedIngredients[idx] && (
                                  <div className="mt-2 pt-2 border-t border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-2">
                                      Ingredientes Seleccionados
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {prod.detalles_ingredientes.ingredientes.map((ing, ingIdx) => (
                                        <span
                                          key={ingIdx}
                                          className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 border border-orange-200"
                                        >
                                          {ing}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {prod.tipo === 'Paquete' && prod.detalles_ingredientes && (
                              <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide mb-2">Contenido del Paquete</p>

                                {prod.detalles_ingredientes.pizzas && prod.detalles_ingredientes.pizzas.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">Pizzas:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
                                      {prod.detalles_ingredientes.pizzas.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                  </div>
                                )}

                                {prod.detalles_ingredientes.hamburguesa && (
                                  <div className="mb-1 text-sm">
                                    <span className="font-bold text-gray-700">Hamburguesa: </span>
                                    <span className="text-gray-800">{prod.detalles_ingredientes.hamburguesa}</span>
                                  </div>
                                )}
                                {prod.detalles_ingredientes.alitas && (
                                  <div className="mb-1 text-sm">
                                    <span className="font-bold text-gray-700">Alitas: </span>
                                    <span className="text-gray-800">{prod.detalles_ingredientes.alitas}</span>
                                  </div>
                                )}
                                {prod.detalles_ingredientes.refresco && (
                                  <div className="text-sm">
                                    <span className="font-bold text-gray-700">Refresco: </span>
                                    <span className="text-gray-800">{prod.detalles_ingredientes.refresco}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {prod.especialidades && prod.especialidades.length > 0 && (
                              <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-2">
                                  Especialidades
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {prod.especialidades.map((esp, i) => (
                                    <span
                                      key={i}
                                      className="bg-white px-2 py-1 rounded text-xs font-medium text-blue-800 border border-blue-200 shadow-sm"
                                    >
                                      {esp}
                                    </span>
                                  ))}
                                </div>
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
      <style jsx>{`
      .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;  /* Chrome, Safari, Opera*/
      }
      .vertical-title {
        writing-mode: vertical-lr;
        text-orientation: upright;
        letter-spacing: 0.1em;
      }
    `}</style>
    </div>
  );
}