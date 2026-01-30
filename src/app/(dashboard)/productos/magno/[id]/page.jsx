'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { catalogsService } from '@/services/catalogsService';
import { productsService } from '@/services/productsService';
import api from '@/services/api';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarMagnoPage() {
  const router = useRouter();
  const params = useParams();
  const { updateProduct } = useProducts('magno');

  const [formData, setFormData] = useState({
    especialidad: '',
    refresco: '',
    precio: '',
  });

  const [refrescos, setRefrescos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const init = async () => {
      const refs = await fetchRefrescos();
      const esps = await fetchEspecialidades();
      if (params.id) {
        await fetchProduct(refs, esps);
      }
    };
    init();
  }, [params.id]);

  const fetchRefrescos = async () => {
    try {
      const response = await api.get('/ventas/refrescos/');
      setRefrescos(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching refrescos:', error);
      showToast.error('Error al cargar refrescos');
      return [];
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const data = await catalogsService.getEspecialidades();
      setEspecialidades(data);
      return data;
    } catch (error) {
      console.error('Error fetching especialidades:', error);
      showToast.error('Error al cargar especialidades');
      return [];
    }
  };

  const fetchProduct = async (currentRefrescos = [], currentEspecialidades = []) => {
    try {
      const product = await productsService.getById('magno', params.id);

      let refrescoValue = '';
      if (product.id_refresco) {
        refrescoValue = product.id_refresco.toString();
      } else if (product.refresco) {
        // Find by name if ID is missing
        const found = currentRefrescos.find(r =>
          r.nombre.toLowerCase() === product.refresco.toLowerCase() ||
          `${r.nombre} - ${r.tamaño}`.toLowerCase() === product.refresco.toLowerCase()
        );
        if (found) {
          refrescoValue = found.id_refresco.toString();
        }
      }

      let especialidadValue = '';
      if (product.id_especialidad) {
        especialidadValue = product.id_especialidad.toString();
      } else if (product.especialidad) {
        const found = currentEspecialidades.find(e =>
          e.nombre.toLowerCase() === product.especialidad.toLowerCase()
        );
        if (found) {
          especialidadValue = found.id_esp.toString();
        }
      }

      setFormData({
        especialidad: especialidadValue,
        refresco: refrescoValue,
        precio: product.precio || '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast.error('Error al cargar el producto');
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

    if (!formData.especialidad || !formData.precio) {
      showToast.warning('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);

    const productData = {
      id_especialidad: parseInt(formData.especialidad),
      id_refresco: parseInt(formData.refresco),
      precio: parseFloat(formData.precio),
    };

    const result = await updateProduct(params.id, productData);
    setLoading(false);

    if (result.success) {
      showToast.success('Producto actualizado correctamente');
      router.push('/productos/magno');
    } else {
      showToast.error(result.error);
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
            onClick={() => router.push('/productos/magno')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Magno
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
            placeholder="Ej: 120.00"
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
