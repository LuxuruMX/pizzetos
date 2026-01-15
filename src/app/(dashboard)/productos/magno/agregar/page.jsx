'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarMagnoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    especialidad: '',
    refresco: '',
    precio: '',
  });

  const [especialidades, setEspecialidades] = useState([]);
  const [refrescos, setRefrescos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [esps, refs] = await Promise.all([
        catalogsService.getEspecialidades(),
        api.get('/ventas/refrescos/').then(res => res.data)
      ]);

      setEspecialidades(esps);
      setRefrescos(refs);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      showToast.error('Error al cargar los catálogos');
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

    if (!formData.especialidad || !formData.refresco || !formData.precio) {
      showToast.warning('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        id_especialidad: parseInt(formData.especialidad),
        id_refresco: parseInt(formData.refresco),
        precio: parseFloat(formData.precio),
      };

      await api.post('/ventas/magno', dataToSend);

      showToast.success('Producto creado correctamente');
      router.push('/productos/magno');
    } catch (error) {
      console.error('Error creating product:', error);
      showToast.error('Error al crear el producto');
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
            onClick={() => router.push('/productos/magno')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Agregar Magno
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
            label="Refresco"
            name="refresco"
            value={formData.refresco}
            onChange={handleChange}
            options={refrescos.map(ref => ({
              id_refresco: ref.id_refresco,
              label: `${ref.nombre} - ${ref.tamaño}`
            }))}
            valueKey="id_refresco"
            labelKey="label"
            placeholder="Selecciona un refresco"
            required
          />

          <Input
            label="Precio"
            name="precio"
            type="number"
            step="0.01"
            value={formData.precio}
            onChange={handleChange}
            placeholder="Ej: 150.00"
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
              onClick={() => router.push('/productos/magno')}
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
