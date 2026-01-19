'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSucursalFromToken, getPermisosFromToken } from '@/services/jwt';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Popconfirm from '@/components/ui/Popconfirm';
import { showToast } from '@/utils/toast';

export default function GastosPage() {
  const router = useRouter();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los totales
  const [totalHoy, setTotalHoy] = useState(0);
  const [totalUltimos30Dias, setTotalUltimos30Dias] = useState(0);
  const [totalNoEvaluados, setTotalNoEvaluados] = useState(0);

  // Estados para los filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [permisos, setPermisos] = useState(null);

  // Nuevo useEffect para verificar id_caja y permisos
  const [cajaAbierta, setCajaAbierta] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('id_caja');
      setCajaAbierta(!!storedId);

      const perms = getPermisosFromToken();
      setPermisos(perms);
    }
  }, []);

  useEffect(() => {
    if (permisos !== null) {
      fetchGastos();
    }
  }, [permisos]);

  // useEffect para recalcular totales cuando cambien los gastos
  useEffect(() => {
    calcularTotales(gastos);
  }, [gastos]);

  const fetchGastos = async (inicio = '', fin = '') => {
    try {
      setLoading(true);
      setError(null);

      // Construir query params
      const queryParams = new URLSearchParams();
      if (inicio) queryParams.append('fecha_inicio', inicio);
      if (fin) queryParams.append('fecha_fin', fin);

      const id_suc = getSucursalFromToken();
      if (id_suc) queryParams.append('id_suc', id_suc);

      const queryString = queryParams.toString();
      const url = `/gastos${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url);
      setGastos(response.data);

      // La función calcularTotales se ejecutará en el useEffect de arriba
    } catch (error) {
      console.error('Error fetching gastos:', error);
      setError('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    fetchGastos(fechaInicio, fechaFin);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    fetchGastos(); // Volver a cargar sin filtros
  };

  const calcularTotales = (gastosData) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30); // 30 días atrás

    let sumaHoy = 0;
    let suma30Dias = 0;
    let sumaNoEvaluados = 0;

    gastosData.forEach(gasto => {
      const fechaGasto = new Date(gasto.fecha);
      const precio = parseFloat(gasto.precio) || 0;

      const fechaGastoSolo = new Date(fechaGasto);
      fechaGastoSolo.setHours(0, 0, 0, 0);

      if (fechaGastoSolo.getTime() === hoy.getTime()) {
        sumaHoy += precio;
      }

      if (fechaGasto >= hace30Dias && fechaGasto <= new Date()) {
        suma30Dias += precio;
      }

      if (!gasto.evaluado) {
        if (fechaGastoSolo.getTime() === hoy.getTime()) {

        }

        if (fechaGasto >= hace30Dias && fechaGasto <= new Date()) {
        }

        sumaNoEvaluados += precio;
      }
    });

    setTotalHoy(sumaHoy);
    setTotalUltimos30Dias(suma30Dias);
    setTotalNoEvaluados(sumaNoEvaluados);
  };

  const handleEdit = (gasto) => {
    router.push(`/gastos/${gasto.id_gastos}`);
  };

  const handleDelete = async (gasto) => {
    try {
      await api.delete(`/gastos/${gasto.id_gastos}`);
      // Actualizar la lista local y recalcular totales
      const nuevosGastos = gastos.filter(g => g.id_gastos !== gasto.id_gastos);
      setGastos(nuevosGastos);
      // El useEffect de arriba se encargará de recalcular
    } catch (error) {
      console.error('Error deleting gasto:', error);
      showToast.error('Error al eliminar el gasto');
    }
  };

  const handleAdd = () => {
    router.push('/gastos/agregar');
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Renderizado condicional mientras se verifica el id_caja y los permisos
  if (permisos === null) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      header: 'DESCRIPCIÓN',
      accessor: 'descripcion',
      render: (row) => <span className="font-semibold">{row.descripcion}</span>
    },
    {
      header: 'PRECIO',
      accessor: 'precio',
      render: (row) => {
        const precio = parseFloat(row.precio);
        return <span className="text-blue-500 font-medium">${isNaN(precio) ? '0.00' : precio.toFixed(2)}</span>;
      }
    },
    {
      header: 'FECHA',
      accessor: 'fecha',
      render: (row) => <span className="text-gray-600">{formatFecha(row.fecha)}</span>
    },
    {
      header: 'SUCURSAL',
      accessor: 'sucursal',
      render: (row) => <span className="text-gray-500 italic">{row.sucursal}</span>
    },
    {
      header: 'EVALUADO',
      accessor: 'evaluado',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.evaluado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {row.evaluado ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      header: 'ACCIONES',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-center gap-2">
          {permisos.modificar_producto && (
            <button
              onClick={() => handleEdit(row)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Editar"
            >
              <FaEdit size={18} />
            </button>
          )}

          {permisos.eliminar_producto && (
            <Popconfirm
              title="¿Seguro que quiere eliminar?"
              okText="Sí"
              cancelText="No"
              onConfirm={() => handleDelete(row)}
            >
              <button
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Eliminar"
              >
                <FaTrash size={18} />
              </button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando gastos...</p>
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
        {/* Controles de filtro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={aplicarFiltros}
              className="w-full"
            >
              Filtrar
            </Button>
            <Button
              onClick={limpiarFiltros}
              variant="secondary"
              className="w-full"
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Nueva sección para los totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Verde: Total Gastos (evaluados y no evaluados) */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800">Gastos de Hoy (Total)</h3>
            <p className="text-2xl font-bold text-green-600">${totalHoy.toFixed(2)}</p>
          </div>
          {/* Azul: Total Gastos de los últimos 30 días (evaluados y no evaluados) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">Gastos Últimos 30 Días (Total)</h3>
            <p className="text-2xl font-bold text-blue-600">${totalUltimos30Dias.toFixed(2)}</p>
          </div>
          {/* Amarillo: Total Gastos No Evaluados */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800">Total No Evaluados</h3>
            <p className="text-2xl font-bold text-yellow-600">${totalNoEvaluados.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona los gastos de las sucursales
            </p>
          </div>
          {permisos.crear_venta && (
            <div className="tooltip" data-tip={!cajaAbierta ? "Debes tener una caja abierta" : ""}>
              <Button
                icon={FaPlus}
                onClick={handleAdd}
                disabled={!cajaAbierta}
                title={!cajaAbierta ? "Debes tener una caja abierta para registrar gastos" : "Registrar nuevo gasto"}
              >
                Añadir
              </Button>
            </div>
          )}
        </div>

        <Table
          columns={columns}
          data={gastos}
        />
      </Card >
    </div >
  );
}