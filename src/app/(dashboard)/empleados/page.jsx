'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function EmpleadosPage() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [permisos, setPermisos] = useState(null);
  
    useEffect(() => {
      // Leer permisos del token
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setPermisos(decoded.permisos || {});
          } catch (e) {
            console.error('Token inválido', e);
          }
        }
      }
    }, []);

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      console.log('Respuesta empleados:', response.data);
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error fetching empleados:', error);
      console.error('Error response:', error.response?.data);
      alert('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/empleados/${id}`);
      
      // Actualizar el estado local
      setEmpleados(empleados.map(emp => 
        emp.id_emp === id ? { ...emp, status: !currentStatus } : emp
      ));
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;

    try {
      await api.delete(`/empleados/${id}`);
      setEmpleados(empleados.filter(emp => emp.id_emp !== id));
      alert('Empleado eliminado correctamente');
    } catch (error) {
      console.error('Error deleting empleado:', error);
      alert('Error al eliminar el empleado');
    }
  };

  if (permisos === null) {
      return (
        <div className="p-6">
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando...</p>
            </div>
          </Card>
        </div>
      );
    }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando empleados...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Empleados</h1>
          {permisos.crear_producto && (
          <Button 
            icon={FaPlus}
            onClick={() => router.push('/empleados/agregar')}
          >
            Agregar Empleado
          </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No hay empleados registrados
                  </td>
                </tr>
              ) : (
                empleados.map((empleado) => (
                  <tr key={empleado.id_emp} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {empleado.direccion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.telefono}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.sucursal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empleado.nickName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleStatus(empleado.id_emp, empleado.status)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          empleado.status ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            empleado.status ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`ml-2 text-xs font-medium ${empleado.status ? 'text-green-600' : 'text-gray-500'}`}>
                        {empleado.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {permisos.modificar_empleado && (
                        <button
                          onClick={() => router.push(`/empleados/${empleado.id_emp}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <FaEdit size={18} />
                        </button>
                        )}
                        {permisos.eliminar_empleado && (
                        <button
                          onClick={() => handleDelete(empleado.id_emp)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <FaTrash size={18} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
