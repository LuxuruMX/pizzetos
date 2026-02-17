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
import { showToast } from '@/utils/toast';

export default function AgregarEmpleadoPage() {
  const router = useRouter();

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
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [cargosData, sucursalesData] = await Promise.all([
        catalogsService.getCargosEmpleados(),
        catalogsService.getSucursales()
      ]);

      setCargos(cargosData);
      setSucursales(sucursalesData);
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

    if (!formData.nombre || !formData.direccion || !formData.telefono ||
      !formData.cargo || !formData.sucursal) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    setError(''); // Limpiar errores previos

    try {
      const dataToSend = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        telefono: formData.telefono,
        id_ca: parseInt(formData.cargo),
        id_suc: parseInt(formData.sucursal),
        status: true,
      };

      if (formData.nickName && formData.nickName.trim() !== '') {
        dataToSend.nickName = formData.nickName.trim();
      }

      if (formData.password && formData.password.trim() !== '') {
        dataToSend.password = formData.password;
      }

      const response = await api.post('/empleados', dataToSend);
      const result = response.data; // Ajusta esto si usas fetch en lugar de axios

      // Verificar si el backend devolvió un mensaje de error lógico
      if (result.message === "El nickName ya existe, elija otro usuario") {
        setError('El nombre de usuario ya está en uso. Por favor, elige otro.');
        setLoading(false);
        return;
      }

      // Si todo salió bien
      showToast.success('Empleado agregado correctamente ✅');
      router.push('/empleados');
    } catch (error) {
      console.error('Error creating empleado:', error);
      setError('Error al crear el empleado. Intenta nuevamente.');
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
            onClick={() => router.push('/empleados')}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Agregar Empleado
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
            placeholder="Ej: jperez"
          />

          <Input
            label="Contraseña - Opcional"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Ingresa una contraseña"
          />
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}

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
