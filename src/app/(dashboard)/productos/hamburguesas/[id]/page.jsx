'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsService } from '@/services/productsService';
import { catalogsService } from '@/services/catalogsService';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarHamburguesasPage() {
  const router = useRouter();
  const params = useParams();
  
  const [formData, setFormData] = useState({
    paquete: '',
    precio: '',
    categoria: '',
  });
  
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const cats = await catalogsService.getCategorias();
      setCategorias(cats);
      
      const product = await productsService.getById('hamburguesas', params.id);
      
      const categoriaEncontrada = cats.find(
        cat => cat.descripcion === product.categoria
      );
      
      setFormData({
        paquete: product.paquete || '',
        precio: product.precio || '',
        categoria: categoriaEncontrada ? categoriaEncontrada.id_cat : '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error al cargar los datos');
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
    
    if (!formData.paquete || !formData.precio || !formData.categoria) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        paquete: formData.paquete,
        precio: parseFloat(formData.precio),
        id_cat: parseInt(formData.categoria),
      };

      await api.put(`/ventas/hamburguesas/${params.id}`, dataToSend);
      
      alert('Producto actualizado correctamente ✅');
      router.push('/productos/hamburguesas');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto ❌');
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
            onClick={() => router.push('/productos/hamburguesas')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Hamburguesa
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Paquete"
            name="paquete"
            value={formData.paquete}
            onChange={handleChange}
            placeholder="Ej: Hamburguesa Doble con Papas"
            required
          />

          <Input
            label="Precio"
            name="precio"
            type="number"
            step="0.01"
            value={formData.precio}
            onChange={handleChange}
            placeholder="Ej: 95.00"
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            
            <Button 
              type="button"
              variant="secondary"
              onClick={() => router.push('/productos/hamburguesas')}
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
