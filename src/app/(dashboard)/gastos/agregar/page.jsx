'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import { getSucursalFromToken } from '@/services/jwt';
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
    // sucursal se obtendrá al enviar
  });

  // Ya no necesitamos cargar sucursales si la tomamos del token
  // pero tal vez necesitamos otros catálogos? El código original tenía placeholders.
  // Si no hay otros catalogos, podemos simplificar mucho.
  // El usuario dijo "en la parte de seleccionar la sucursal... que ya no aparesca".

  const [loading, setLoading] = useState(false);
  // Eliminamos loadingCatalogs si ya no cargamos nada
  // const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // useEffect(() => {
  //   fetchCatalogs(); // Si ya no hay catalogos, esto se va
  // }, []);

  /* Eliminamos fetchCatalogs y sucursales state */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.descripcion || !formData.precio) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const id_suc = getSucursalFromToken();

      const dataToSend = {
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        id_suc: parseInt(id_suc),
        id_caja: 0, // Ya no es obligatorio tener caja abierta
        // 'fecha' y 'evaluado' no se envían, la base de datos los manejará
      };

      await api.post('/gastos/', dataToSend);

      router.push('/gastos'); // Redirige a la lista de gastos
    } catch (error) {
      console.error('Error creating gasto:', error);
      alert('Error al crear el gasto');
    } finally {
      setLoading(false);
    }
  };

  /* Eliminado check de loadingCatalogs */

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