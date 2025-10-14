'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Popconfirm from '@/components/ui/Popconfirm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function SucursalesPage() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/recursos/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
      setError('Error al cargar las sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sucursal) => {
    router.push(`/recursos/sucursales/${sucursal.id_suc}`);
  };

  const handleDelete = async (sucursal) => {
    try {
      await api.delete(`/recursos/sucursales?id_suc=${sucursal.id_suc}`);
      alert('Sucursal eliminada correctamente ✅');
      fetchSucursales();
    } catch (error) {
      console.error('Error deleting sucursal:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al eliminar la sucursal ❌';
      alert(errorMsg);
    }
  };

  const handleAdd = () => {
    router.push('/recursos/sucursales/agregar');
  };

  const columns = [
    { 
      header: 'NOMBRE', 
      accessor: 'nombre',
      render: (row) => <span className="font-semibold text-gray-900">{row.nombre}</span>
    },
    { 
      header: 'DIRECCIÓN', 
      accessor: 'direccion',
      render: (row) => <span className="text-gray-700">{row.direccion}</span>
    },
    { 
      header: 'TELÉFONO', 
      accessor: 'telefono',
      render: (row) => <span className="text-gray-700">{row.telefono}</span>
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando sucursales...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona las sucursales de la empresa
            </p>
          </div>
          <Button icon={FaPlus} onClick={handleAdd}>
            Agregar Sucursal
          </Button>
        </div>

        <Table
          columns={columns}
          data={sucursales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          renderActions={(row) => (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleEdit(row)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Editar"
              >
                <FaEdit size={18} />
              </button>
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
            </div>
          )}
        />
      </Card>
    </div>
  );
}
