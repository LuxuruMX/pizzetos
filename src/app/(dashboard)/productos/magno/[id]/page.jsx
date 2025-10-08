'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { productsService } from '@/services/productsService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const product = await productsService.getById('magno', params.id);
      setFormData({
        especialidad: product.especialidad || '',
        refresco: product.refresco || '',
        precio: product.precio || '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Error al cargar el producto');
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
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    
    const productData = {
      ...formData,
      precio: parseFloat(formData.precio),
    };

    const result = await updateProduct(params.id, productData);
    setLoading(false);

    if (result.success) {
      alert('Producto actualizado correctamente ✅');
      router.push('/productos/magno');
    } else {
      alert(result.error);
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
          <Input
            label="Especialidad"
            name="especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            placeholder="Ej: Combo Especial"
            required
          />

          <Input
            label="Refresco"
            name="refresco"
            value={formData.refresco}
            onChange={handleChange}
            placeholder="Ej: Coca Cola"
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
