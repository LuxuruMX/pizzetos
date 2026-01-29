'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Popconfirm from '@/components/ui/Popconfirm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [permisos, setPermisos] = useState(null);

  useEffect(() => {
    // Leer permisos del token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setPermisos(decoded.permisos || {});
        } catch (e) {
          console.error('Token inválido', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await api.get('/recursos/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria) => {
    router.push(`/recursos/categorias/${categoria.id_cat}`);
  };

  const handleDelete = async (categoria) => {
    try {
      await api.delete(`/recursos/categorias/${categoria.id_cat}`);
      showToast.success('Categoría eliminada correctamente ✅');
      fetchCategorias();
    } catch (error) {
      console.error('Error deleting categoria:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al eliminar la categoría ❌';
      showToast.error(errorMsg);
    }
  };

  const handleAdd = () => {
    router.push('/recursos/categorias/agregar');
  };

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
      header: 'ID',
      accessor: 'id_cat',
      render: (row) => <span className="font-mono text-gray-600">#{row.id_cat}</span>
    },
    {
      header: 'DESCRIPCIÓN',
      accessor: 'descripcion',
      render: (row) => <span className="font-semibold text-gray-900">{row.descripcion}</span>
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando categorías...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona las categorías de productos
            </p>
          </div>
          {permisos.crear_recurso && (
            <Button icon={FaPlus} onClick={handleAdd}>
              Agregar Categoría
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          data={categorias}
          // onEdit={handleEdit} // <-- Ya no es necesario pasarlas aquí si Table no las usa
          // onDelete={handleDelete} // <-- Ya no es necesario pasarlas aquí si Table no las usa
          renderActions={(row) => (
            <div className="flex justify-center gap-2">
              {permisos.modificar_recurso && ( // <-- La condición ahora SI controla la visibilidad
                <button
                  onClick={() => handleEdit(row)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <FaEdit size={18} />
                </button>
              )}
              {permisos.eliminar_recurso && ( // <-- La condición ahora SI controla la visibilidad
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
          )}
        />
      </Card>
    </div>
  );
}
