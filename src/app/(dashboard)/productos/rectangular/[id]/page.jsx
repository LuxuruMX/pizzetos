'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsService } from '@/services/productsService';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarRectangularPage() {
  const router = useRouter();
  const params = useParams();

  const [formData, setFormData] = useState({
    especialidad: '',
    categoria: '',
    precio: '',
  });

  const [categorias, setCategorias] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [cats, esps] = await Promise.all([
        catalogsService.getCategorias(),
        catalogsService.getEspecialidades()
      ]);

      setCategorias(cats);
      setEspecialidades(esps);

      const product = await productsService.getById('rectangular', params.id);

      const categoriaEncontrada = cats.find(
        cat => cat.descripcion === product.categoria
      );

      const especialidadEncontrada = esps.find(
        esp => esp.nombre === product.especialidad
      );

      setFormData({
        especialidad: especialidadEncontrada ? especialidadEncontrada.id_esp : '',
        categoria: categoriaEncontrada ? categoriaEncontrada.id_cat : '',
        precio: product.precio || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast.error('Error al cargar los datos');
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

    if (!formData.especialidad || !formData.categoria || !formData.precio) {
      showToast.warning('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        id_esp: parseInt(formData.especialidad),
        id_cat: parseInt(formData.categoria),
        precio: parseFloat(formData.precio),
      };

      await api.put(`/ventas/rectangular/${params.id}`, dataToSend);
      showToast.success('Pizza rectangular actualizada exitosamente');
      router.push('/productos/rectangular');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast.error('Error al actualizar la pizza rectangular');
    } finally {
      setLoading(false);
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
            onClick={() => router.push('/productos/rectangular')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Pizza Rectangular
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

          <Input
            label="Precio"
            name="precio"
            type="number"
            step="0.01"
            value={formData.precio}
            onChange={handleChange}
            placeholder="Ej: 180.00"
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
              onClick={() => router.push('/productos/rectangular')}
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
