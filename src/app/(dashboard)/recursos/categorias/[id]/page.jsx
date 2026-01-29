'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

export default function EditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: ''
  });

  useEffect(() => {
    fetchCategoria();
  }, []);

  const fetchCategoria = async () => {
    try {
      const response = await api.get('/ventas/categoria');
      const categoria = response.data.find(c => c.id_cat === parseInt(params.id));

      if (!categoria) {
        showToast.error('Categoría no encontrada');
        router.push('/recursos/categorias');
        return;
      }

      setFormData({
        descripcion: categoria.descripcion
      });
    } catch (error) {
      console.error('Error fetching categoria:', error);
      showToast.error('Error al cargar la categoría');
      router.push('/recursos/categorias');
    } finally {
      setLoading(false);
    }
  };

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
      showToast.error('La descripción es obligatoria');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/ventas/categoria/${params.id}`, formData);
      showToast.success('Categoría actualizada correctamente ✅');
      router.push('/recursos/categorias');
    } catch (error) {
      console.error('Error updating categoria:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al actualizar la categoría ❌';
      showToast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando categoría...</p>
          </div>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Editar Categoría</h1>
          <p className="text-gray-600 text-sm mt-1">
            Modifica la información de la categoría
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
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/recursos/categorias')}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
