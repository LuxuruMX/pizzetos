'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarSucursalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
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
    
    if (!formData.nombre.trim() || !formData.direccion.trim() || !String(formData.telefono).trim()) {
      alert('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/recursos/sucursales', formData);
      router.push('/recursos/sucursales');
    } catch (error) {
      console.error('Error creating sucursal:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al crear la sucursal ❌';
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
            onClick={() => router.push('/recursos/sucursales')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a Sucursales
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Agregar Nueva Sucursal</h1>
          <p className="text-gray-600 text-sm mt-1">
            Registra una nueva sucursal de la empresa
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
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Sucursal'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/recursos/sucursales')}
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
