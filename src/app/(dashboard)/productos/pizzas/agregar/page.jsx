'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function CrearPizzaPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    especialidad: '',
    tamaño: '',
    categoria: '',
  });

  const [categorias, setCategorias] = useState([]);
  const [tamanos, setTamanos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar catálogos al montar el componente
  useState(() => {
    const fetchData = async () => {
      try {
        const [cats, tams, especs] = await Promise.all([
          catalogsService.getCategorias(),
          catalogsService.getTamanosPizza(),
          catalogsService.getEspecialidades()
        ]);

        setCategorias(cats);
        setTamanos(tams);
        setEspecialidades(especs);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast.error('Error al cargar los datos');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.especialidad || !formData.tamaño || !formData.categoria) {
      showToast.warning('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        id_esp: parseInt(formData.especialidad),
        id_tamano: parseInt(formData.tamaño),
        id_cat: parseInt(formData.categoria),
      };

      await api.post('/ventas/pizzas', dataToSend); // Ruta para crear

      showToast.success('Pizza creada exitosamente');
      router.push('/productos/pizzas');
    } catch (error) {
      console.error('Error creating pizza:', error);
      showToast.error('Error al crear la pizza');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando datos...</p>
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
            onClick={() => router.push('/productos/pizzas')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Crear Nueva Pizza
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Select
            label="Especialidad"
            name="especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            options={especialidades}
            valueKey="id_esp"
            labelKey="nombre"
            placeholder="Selecciona una especialidad"
            required
          />

          <Select
            label="Tamaño"
            name="tamaño"
            value={formData.tamaño}
            onChange={handleChange}
            options={tamanos}
            valueKey="id_tamañop"
            labelKey="tamano"
            placeholder="Selecciona un tamaño"
            required
          />

          <Select
            label="Categoría"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            options={categorias}
            valueKey="id_cat"
            labelKey="descripcion"
            placeholder="Selecciona una categoría"
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Crear Pizza'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/productos/pizzas')}
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