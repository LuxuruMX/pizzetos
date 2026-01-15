'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { productsService } from '@/services/productsService';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarEspecialidadPage() {
  const router = useRouter();
  const params = useParams();
  const { updateProduct } = useProducts('especialidad');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const product = await productsService.getById('especialidad', params.id);
      setFormData({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast.error('Error al cargar el producto');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre) {
      showToast.warning('Por favor completa el nombre');
      return;
    }

    setLoading(true);
    const result = await updateProduct(params.id, formData);
    setLoading(false);

    if (result.success) {
      showToast.success('Especialidad actualizada exitosamente');
      router.push('/productos/especialidad');
    } else {
      showToast.error(result.error);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando producto...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Button
            variant="ghost"
            icon={FaArrowLeft}
            onClick={() => router.push('/productos/especialidad')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Especialidad
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Pizza Especial"
            required
          />

          <Input
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej: Pizza con ingredientes especiales"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/productos/especialidad')}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
