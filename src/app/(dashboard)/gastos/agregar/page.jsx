'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarGastoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    descripcion: '',
    precio: '',
    sucursal: '',
  });

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      // Si solo necesitas las sucursales, puedes llamar solo a ese servicio
      // const sucursalesData = await catalogsService.getSucursales();
      // setSucursales(sucursalesData);

      // O si usas Promise.all como en tu ejemplo, pero solo asignas las sucursales
      const [, sucursalesData] = await Promise.all([
        // catalogsService.getOtroCatalogo(), // Si necesitas otros catálogos
        new Promise(resolve => resolve([])), // Placeholder si no necesitas el primer catálogo
        catalogsService.getSucursales()
      ]);

      setSucursales(sucursalesData);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      alert('Error al cargar los catálogos');
    } finally {
      setLoadingCatalogs(false);
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

    if (!formData.descripcion || !formData.precio || !formData.sucursal) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        id_suc: formData.sucursal,
        // 'fecha' y 'evaluado' no se envían, la base de datos los manejará
      };

      await api.post('/gastos/', dataToSend);

      router.push('/gastos'); // Redirige a la lista de gastos
    } catch (error) {
      console.error('Error creating gasto:', error);
      alert('Error al crear el gasto ❌');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando formulario...</p>
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
            onClick={() => router.push('/gastos')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Agregar Gasto
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej: 1kg de carne"
            required
          />

          <Input
            label="Precio"
            name="precio"
            type="number"
            step="0.01"
            value={formData.precio}
            onChange={handleChange}
            placeholder="Ej: 1300.00"
            required
          />

          <Select
            label="Sucursal"
            name="sucursal"
            value={formData.sucursal}
            onChange={handleChange}
            options={sucursales}
            valueKey="id_suc"
            labelKey="nombre"
            placeholder="Selecciona una sucursal"
            required
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
              onClick={() => router.push('/gastos')}
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