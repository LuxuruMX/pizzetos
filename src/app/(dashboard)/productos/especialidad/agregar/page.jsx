'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarEspecialidadPage() {
  const router = useRouter();
  const { createProduct } = useProducts('especialidad');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const [loading, setLoading] = useState(false);

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
    const result = await createProduct(formData);
    setLoading(false);

    if (result.success) {
      showToast.success('Especialidad creada exitosamente');
      router.push('/productos/especialidad');
    } else {
      showToast.error(result.error);
    }
  };

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
          Agregar Especialidad
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
              {loading ? 'Guardando...' : 'Guardar'}
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
