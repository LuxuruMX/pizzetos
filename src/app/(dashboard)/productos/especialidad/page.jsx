'use client';

import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { FaPlus } from 'react-icons/fa';

export default function EspecialidadPage() {
  const router = useRouter();
  const { products, loading, error, deleteProduct } = useProducts('especialidad');

  const handleEdit = (product) => {
    router.push(`/productos/especialidad/${product.id_esp}`);
  };

  const handleDelete = async (product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.nombre}"?`)) {
      const result = await deleteProduct(product.id_esp);
      if (result.success) {
        alert('Producto eliminado correctamente ✅');
      } else {
        alert(result.error);
      }
    }
  };

  const handleAdd = () => {
    router.push('/productos/especialidad/agregar');
  };

  const columns = [
    { 
      header: 'NOMBRE', 
      accessor: 'nombre',
      render: (row) => <span className="font-semibold">{row.nombre}</span>
    },
    { 
      header: 'DESCRIPCIÓN', 
      accessor: 'descripcion',
      render: (row) => <span className="text-gray-600">{row.descripcion}</span>
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
            <h1 className="text-2xl font-bold text-gray-800">Especialidad</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona las especialidades
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
