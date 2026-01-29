'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

export default function EditarSucursalPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  useEffect(() => {
    fetchSucursal();
  }, []);

  const fetchSucursal = async () => {
    try {
      const response = await api.get(`/recursos/sucursales/${params.id}`);

      setFormData({
        nombre: response.data.nombre || '',
        direccion: response.data.direccion || '',
        telefono: String(response.data.telefono || '')
      });
    } catch (error) {
      console.error('Error fetching sucursal:', error);
      showToast.error('Error al cargar la sucursal');
      router.push('/recursos/sucursales');
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

    if (!formData.nombre.trim() || !formData.direccion.trim() || !String(formData.telefono).trim()) {
      showToast.warning('Todos los campos son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/recursos/sucursales/${params.id}`, formData);
      router.push('/recursos/sucursales');
    } catch (error) {
      console.error('Error updating sucursal:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al actualizar la sucursal';
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
            <p className="text-gray-600">Cargando sucursal...</p>
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
            onClick={() => router.push('/recursos/sucursales')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a Sucursales
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Editar Sucursal</h1>
          <p className="text-gray-600 text-sm mt-1">
            Modifica la información de la sucursal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Sucursal Centro, Sucursal Norte..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Ej: Av. Principal #123, Col. Centro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="Ej: 555-1234"
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
              onClick={() => router.push('/recursos/sucursales')}
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
