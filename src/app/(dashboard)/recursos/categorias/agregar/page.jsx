'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarCategoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    setLoading(true);
    try {
      await api.post('/recursos/categorias', formData);
      alert('Categoría creada correctamente ✅');
      router.push('/recursos/categorias');
    } catch (error) {
      console.error('Error creating categoria:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al crear la categoría ❌';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <button
            onClick={() => router.push('/recursos/categorias')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a Categorías
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Agregar Nueva Categoría</h1>
          <p className="text-gray-600 text-sm mt-1">
            Crea una nueva categoría de productos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Ej: Pizzas, Bebidas, Postres..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Categoría'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/recursos/categorias')}
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
