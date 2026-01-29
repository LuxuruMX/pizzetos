'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

export default function AgregarCargoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    // Productos
    crear_producto: false,
    modificar_producto: false,
    eliminar_producto: false,
    ver_producto: false,
    // Empleados
    crear_empleado: false,
    modificar_empleado: false,
    eliminar_empleado: false,
    ver_empleado: false,
    // Ventas
    crear_venta: false,
    modificar_venta: false,
    eliminar_venta: false,
    ver_venta: false,
    // Recursos
    crear_recurso: false,
    modificar_recurso: false,
    eliminar_recurso: false,
    ver_recurso: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSelectAll = (module) => {
    const allChecked = formData[`crear_${module}`] &&
      formData[`modificar_${module}`] &&
      formData[`eliminar_${module}`] &&
      formData[`ver_${module}`];

    setFormData(prev => ({
      ...prev,
      [`crear_${module}`]: !allChecked,
      [`modificar_${module}`]: !allChecked,
      [`eliminar_${module}`]: !allChecked,
      [`ver_${module}`]: !allChecked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      showToast.warning('El nombre del cargo es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await api.post('/recursos/cargos', formData);
      router.push('/recursos/cargos');
    } catch (error) {
      console.error('Error creating cargo:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al crear el cargo';
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const PermissionSection = ({ title, module, color }) => {
    const allChecked = formData[`crear_${module}`] &&
      formData[`modificar_${module}`] &&
      formData[`eliminar_${module}`] &&
      formData[`ver_${module}`];

    return (
      <div className={`p-4 rounded-lg border-2 ${color}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">{title}</h3>
          <button
            type="button"
            onClick={() => handleSelectAll(module)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name={`crear_${module}`}
              checked={formData[`crear_${module}`]}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Crear</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name={`modificar_${module}`}
              checked={formData[`modificar_${module}`]}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Modificar</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name={`eliminar_${module}`}
              checked={formData[`eliminar_${module}`]}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Eliminar</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name={`ver_${module}`}
              checked={formData[`ver_${module}`]}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Ver</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <button
            onClick={() => router.push('/recursos/cargos')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Volver a Cargos
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Agregar Nuevo Cargo</h1>
          <p className="text-gray-600 text-sm mt-1">
            Define el nombre del cargo y sus permisos en el sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cargo <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Administrador, Cajero, Gerente..."
              required
            />
          </div>

          {/* Permisos */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Permisos del Cargo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PermissionSection
                title="Productos"
                module="producto"
                color="border-blue-200 bg-blue-50"
              />
              <PermissionSection
                title="Empleados"
                module="empleado"
                color="border-green-200 bg-green-50"
              />
              <PermissionSection
                title="Ventas"
                module="venta"
                color="border-yellow-200 bg-yellow-50"
              />
              <PermissionSection
                title="Recursos"
                module="recurso"
                color="border-purple-200 bg-purple-50"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cargo'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/recursos/cargos')}
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
