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

export default function AgregarRefrescosPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nombre: '',
    tamano: '',
    categoria: '',
  });
  
  const [categorias, setCategorias] = useState([]);
  const [tamanos, setTamanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [cats, tams] = await Promise.all([
        catalogsService.getCategorias(),
        catalogsService.getTamanosRefresco()
      ]);
      
      setCategorias(cats);
      setTamanos(tams);
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
    
    if (!formData.nombre || !formData.tamano || !formData.categoria) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        nombre: formData.nombre,
        id_tamano: parseInt(formData.tamano),
        id_cat: parseInt(formData.categoria),
      };

      await api.post('/ventas/refrescos', dataToSend);
      router.push('/productos/refrescos');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error al crear el producto');
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
            onClick={() => router.push('/productos/refrescos')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Agregar Refresco
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Coca Cola"
            required
          />

          <Select
            label="Tamaño"
            name="tamano"
            value={formData.tamano}
            onChange={handleChange}
            options={tamanos}
            valueKey="id_tamano"
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
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
            
            <Button 
              type="button"
              variant="secondary"
              onClick={() => router.push('/productos/refrescos')}
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
