'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useProducts } from '@/hooks/useProducts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Popconfirm from '@/components/ui/Popconfirm';

export default function AlitasPage() {
  const router = useRouter();
  const { products, loading, error, deleteProduct } = useProducts('alitas');
  
  // Estado para los permisos
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

  const handleEdit = (product) => {
    router.push(`/productos/alitas/${product.id_alis}`);
  };

  const handleDelete = async (product) => {
    const result = await deleteProduct(product.id_alis);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleAdd = () => {
    router.push('/productos/alitas/agregar');
  };

  // Si aún no se cargan los permisos, muestra loading
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

  // Columnas de la tabla
  const columns = [
    { 
      header: 'ORDEN', 
      accessor: 'orden',
      render: (row) => <span className="font-semibold">{row.orden}</span>
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
      header: 'CATEGORÍA', 
      accessor: 'categoria',
      render: (row) => <span className="text-gray-500 italic">{row.categoria}</span>
    },
    {
      header: 'ACCIONES',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-center gap-2">
          {/* Botón Editar */}
          {permisos.modificar_producto && (
            <button
              onClick={() => handleEdit(row)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Editar"
            >
              <FaEdit size={18} />
            </button>
          )}

          {/* Botón Eliminar */}
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
            <p className="text-gray-600">Cargando productos...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Alitas</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona los productos de alitas
            </p>
          </div>

          {/* Botón Añadir: solo si tiene permiso */}
          {permisos.crear_producto && (
            <Button icon={FaPlus} onClick={handleAdd}>
              Añadir
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          data={products}
        />
      </Card>
    </div>
  );
}