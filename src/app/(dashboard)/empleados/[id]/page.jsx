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

export default function EditarEmpleadoPage() {
  const router = useRouter();
  const params = useParams();
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    cargo: '',
    sucursal: '',
    nickName: '',
    password: '',
  });
  
  const [cargos, setCargos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [cargosData, sucursalesData] = await Promise.all([
        catalogsService.getCargos(),
        catalogsService.getSucursales()
      ]);
      
      setCargos(cargosData);
      setSucursales(sucursalesData);
      
      const response = await api.get(`/empleados/${params.id}`);
      const empleado = response.data;
      
      // Buscar los IDs basados en los nombres
      const cargoEncontrado = cargosData.find(
        c => c.nombre === empleado.cargo
      );
      
      const sucursalEncontrada = sucursalesData.find(
        s => s.nombre === empleado.sucursal
      );
      
      setFormData({
        nombre: empleado.nombre || '',
        direccion: empleado.direccion || '',
        telefono: empleado.telefono || '',
        cargo: cargoEncontrado ? cargoEncontrado.id_ca : '',
        sucursal: sucursalEncontrada ? sucursalEncontrada.id_suc : '',
        nickName: empleado.nickName || '',
        password: '',
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
    
    if (!formData.nombre || !formData.direccion || !formData.telefono || 
        !formData.cargo || !formData.sucursal) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        telefono: formData.telefono,
        id_ca: parseInt(formData.cargo),
        id_suc: parseInt(formData.sucursal),
        status: true,
      };

      // Solo agregar nickname si se proporcionó
      if (formData.nickName && formData.nickName.trim() !== '') {
        dataToSend.nickName = formData.nickName;
      }

      // Solo agregar password si el usuario ingresó una nueva
      if (formData.password && formData.password.trim() !== '') {
        dataToSend.password = formData.password;
      }

      await api.put(`/empleados/${params.id}`, dataToSend);
      
      router.push('/empleados');
    } catch (error) {
      console.error('Error updating empleado:', error);
      alert('Error al actualizar el empleado ❌');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando empleado...</p>
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
            onClick={() => router.push('/empleados')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Empleado
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            required
          />

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Ej: Calle 123, Colonia Centro"
            required
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ej: 1234567890"
            required
          />

          <Select
            label="Cargo"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            options={cargos}
            valueKey="id_ca"
            labelKey="nombre"
            placeholder="Selecciona un cargo"
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

          <Input
            label="Usuario (Nickname) - Opcional"
            name="nickName"
            value={formData.nickName}
            onChange={handleChange}
            placeholder="Dejar vacío para mantener el usuario actual"
          />

          <Input
            label="Contraseña - Opcional"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Dejar vacío para mantener la contraseña actual"
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
              onClick={() => router.push('/empleados')}
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
