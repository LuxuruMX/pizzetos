'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { IoReload } from "react-icons/io5";
import { FaClock } from "react-icons/fa";

export default function TodosPedidosPage() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('hoy');
  const [statusFiltro, setStatusFiltro] = useState(null);
  const [idSuc, setIdSuc] = useState(null);

  // Función para obtener todos los pedidos
  const fetchTodosPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:8000/pos/pedidos-cocina?filtro=${filtro}`;
      
      // Agregar filtro de status si existe
      if (statusFiltro !== null && statusFiltro !== '') {
        url += `&status=${statusFiltro}`;
      }
      
      // Agregar filtro de sucursal si existe
      if (idSuc) {
        url += `&id_suc=${idSuc}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener los pedidos');
      }
      
      const data = await response.json();
      setPedidos(data.pedidos);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchTodosPedidos();
  }, [filtro, statusFiltro, idSuc]);

  // Columnas de la tabla
  const columns = [
    { 
      header: 'ID PEDIDO', 
      accessor: 'id_venta',
      render: (row) => <span className="font-semibold">#{row.id_venta}</span>
    },
    { 
      header: 'CLIENTE', 
      accessor: 'cliente',
      render: (row) => <span className="text-gray-700">{row.cliente}</span>
    },
    { 
      header: 'SUCURSAL', 
      accessor: 'sucursal',
      render: (row) => <span className="text-gray-600">{row.sucursal}</span>
    },
    { 
      header: 'ITEMS', 
      accessor: 'cantidad_items',
      render: (row) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
          {row.cantidad_items}
        </span>
      )
    },
    { 
      header: 'TOTAL', 
      accessor: 'total',
      render: (row) => (
        <span className="text-green-600 font-bold">
          ${row.total.toFixed(2)}
        </span>
      )
    },
    { 
      header: 'FECHA', 
      accessor: 'fecha_hora',
      render: (row) => (
        <span className="text-gray-500 text-sm">
          {new Date(row.fecha_hora).toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      header: 'ESTADO',
      accessor: 'status_texto',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === 0 ? 'bg-gray-200 text-gray-800' :
          row.status === 1 ? 'bg-yellow-200 text-yellow-800' :
          row.status === 2 ? 'bg-green-200 text-green-800' :
          'bg-red-200 text-red-800'
        }`}>
          {row.status_texto}
        </span>
      )
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Todos los Pedidos</h1>
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
            </select>

            <select 
              value={statusFiltro ?? ''} 
              onChange={(e) => setStatusFiltro(e.target.value === '' ? null : parseInt(e.target.value))}
              className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="0">Esperando</option>
              <option value="1">Preparando</option>
              <option value="2">Completado</option>
            </select>

            <button 
              onClick={fetchTodosPedidos}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 transition-colors"
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

        {pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-6 text-sm text-gray-600">
              <span>
                Total de pedidos: <span className="font-semibold text-gray-800">{pedidos.length}</span>
              </span>
              <span>
                Esperando: <span className="font-semibold text-gray-800">
                  {pedidos.filter(p => p.status === 0).length}
                </span>
              </span>
              <span>
                Preparando: <span className="font-semibold text-yellow-600">
                  {pedidos.filter(p => p.status === 1).length}
                </span>
              </span>
              <span>
                Completados: <span className="font-semibold text-green-600">
                  {pedidos.filter(p => p.status === 2).length}
                </span>
              </span>
            </div>
            <Table
              columns={columns}
              data={pedidos}
            />
          </>
        )}
      </Card>
    </div>
  );
}