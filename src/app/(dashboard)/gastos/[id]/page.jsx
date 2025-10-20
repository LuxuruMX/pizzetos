'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarGastoPage() {
  const router = useRouter();
  const params = useParams(); // params.id <- Importante: debe ser 'id' si el archivo es [id]/page.js

  const [formData, setFormData] = useState({
    descripcion: '',
    precio: '',
    sucursal: '', // Este campo ahora almacenará el id_suc
  });

  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]); // <-- Cambiado a params.id

  const fetchData = async () => {
    try {
      // Primero cargar las sucursales
      const sucursalesData = await catalogsService.getSucursales();
      setSucursales(sucursalesData);

      // Luego cargar el gasto
      // Ahora params.id debería contener el valor correcto
      const response = await api.get(`/gastos/${params.id}`); // <-- Cambiado a params.id
      const gasto = response.data;

      // Buscar el id_suc basado en el nombre que viene del backend (gasto.sucursal)
      const sucursalEncontrada = sucursalesData.find(
        suc => suc.nombre === gasto.sucursal
      );

      setFormData({
        descripcion: gasto.descripcion || '',
        precio: gasto.precio || '',
        // Guardar el id_suc para que el Select se pre-seleccione correctamente
        sucursal: sucursalEncontrada ? sucursalEncontrada.id_suc : '',
      });
    } catch (error) {
      console.error('Error fetching gasto data:', error); // Mensaje de error actualizado
      alert('Error al cargar los datos del gasto');
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

    if (!formData.descripcion || !formData.precio || !formData.sucursal) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        // Enviar el id_suc seleccionado
        id_suc: parseInt(formData.sucursal),
      };

      await api.put(`/gastos/${params.id}`, dataToSend);

      router.push('/gastos');
    } catch (error) {
      console.error('Error updating gasto:', error);
      alert('Error al actualizar el gasto');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando gasto...</p>
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
          Editar Gasto
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
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