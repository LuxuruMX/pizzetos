'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { FaPlus } from 'react-icons/fa';

export default function MagnoPage() {
  const router = useRouter();
  const { products, loading, error, deleteProduct } = useProducts('magno');

  const handleEdit = (product) => {
    router.push(`/productos/magno/${product.id_magno}`);
  };

  const handleDelete = async (product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.especialidad}"?`)) {
      const result = await deleteProduct(product.id_magno);
      if (result.success) {
        alert('Producto eliminado correctamente ✅');
      } else {
        alert(result.error);
      }
    }
  };

  const handleAdd = () => {
    router.push('/productos/magno/agregar');
  };

  const columns = [
    { 
      header: 'ESPECIALIDAD', 
      accessor: 'especialidad',
      render: (row) => <span className="font-semibold">{row.especialidad}</span>
    },
    { 
      header: 'REFRESCO', 
      accessor: 'refresco',
      render: (row) => <span className="text-gray-700">{row.refresco}</span>
    },
    { 
      header: 'PRECIO', 
      accessor: 'precio',
      render: (row) => {
        const precio = parseFloat(row.precio);
        return <span className="text-blue-500 font-medium">${isNaN(precio) ? '0.00' : precio.toFixed(2)}</span>;
      }
    },
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
            <h1 className="text-2xl font-bold text-gray-800">Magno</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona los productos Magno
            </p>
          </div>
          <Button icon={FaPlus} onClick={handleAdd}>
            Añadir
          </Button>
        </div>

        <Table
          columns={columns}
          data={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
