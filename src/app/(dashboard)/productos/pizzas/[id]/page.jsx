'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsService } from '@/services/productsService';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import { showToast } from '@/utils/toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarPizzasPage() {
  const router = useRouter();
  const params = useParams();

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

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [cats, tams, especs] = await Promise.all([
        catalogsService.getCategorias(),
        catalogsService.getTamanosPizza(),
        catalogsService.getEspecialidades() // Asumiendo que esta función devuelve [{ id_esp: X, nombre: "Nombre" }, ...]
      ]);

      setCategorias(cats);
      setTamanos(tams);
      setEspecialidades(especs);

      const product = await productsService.getById('pizzas', params.id);

      const especialidadEncontrada = especs.find(
        esp => esp.nombre === product.especialidad // Compara con la descripción recibida
      );
      const tamanoEncontrado = tams.find(
        tam => tam.tamano === product.tamaño        // Compara con la descripción recibida
      );
      const categoriaEncontrada = cats.find(
        cat => cat.descripcion === product.categoria // Compara con la descripción recibida
      );

      setFormData({
        especialidad: especialidadEncontrada ? especialidadEncontrada.id_esp.toString() : '', // Guarda el ID como string
        tamaño: tamanoEncontrado ? tamanoEncontrado.id_tamañop.toString() : '',              // Guarda el ID como string
        categoria: categoriaEncontrada ? categoriaEncontrada.id_cat.toString() : '',        // Guarda el ID como string
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

      await api.put(`/ventas/pizzas/${params.id}`, dataToSend);
      showToast.success('Pizza actualizada exitosamente');
      router.push('/productos/pizzas');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast.error('Error al actualizar el producto');
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
            onClick={() => router.push('/productos/pizzas')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Pizza
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Select
            label="Especialidad"
            name="especialidad"
            value={formData.especialidad} // Recibe el ID como string
            onChange={handleChange}
            options={especialidades}
            valueKey="id_esp"    // Clave del ID en el objeto del catálogo
            labelKey="nombre"    // Clave de la descripción en el objeto del catálogo
            placeholder="Selecciona una especialidad"
            required
          />

          <Select
            label="Tamaño"
            name="tamaño"
            value={formData.tamaño} // Recibe el ID como string
            onChange={handleChange}
            options={tamanos}
            valueKey="id_tamañop" // Clave del ID en el objeto del catálogo
            labelKey="tamano"    // Clave de la descripción en el objeto del catálogo
            placeholder="Selecciona un tamaño"
            required
          />

          <Select
            label="Categoría"
            name="categoria"
            value={formData.categoria} // Recibe el ID como string
            onChange={handleChange}
            options={categorias}
            valueKey="id_cat"      // Clave del ID en el objeto del catálogo
            labelKey="descripcion" // Clave de la descripción en el objeto del catálogo
            placeholder="Selecciona una categoría"
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