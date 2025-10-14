'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Popconfirm from '@/components/ui/Popconfirm';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function CostillasPage() {
  const router = useRouter();
  const { products, loading, error, deleteProduct } = useProducts('costillas');

  const handleEdit = (product) => {
    router.push(`/productos/costillas/${product.id_cos}`);
  };

  const handleDelete = async (product) => {
    const result = await deleteProduct(product.id_cos);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleAdd = () => {
    router.push('/productos/costillas/agregar');
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Costillas</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona los productos de costillas
            </p>
          </div>
          <Button icon={FaPlus} onClick={handleAdd}>
            Añadir
          </Button>
        </div>

        <Table
          columns={columns}
          data={products}
        />
      </Card>
    </div>
  );
}
