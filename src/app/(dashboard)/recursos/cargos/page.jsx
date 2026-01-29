'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Popconfirm from '@/components/ui/Popconfirm';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

export default function CargosPage() {
  const router = useRouter();
  const [cargos, setCargos] = useState([]);
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
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await api.get('/recursos/cargos');
      setCargos(response.data);
    } catch (error) {
      console.error('Error fetching cargos:', error);
      showToast.error('Error al cargar los cargos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cargo) => {
    try {
      await api.delete(`/recursos/cargos/${cargo.id_cargo}`);
      showToast.success('Cargo eliminado correctamente ✅');
      fetchCargos();
    } catch (error) {
      console.error('Error deleting cargo:', error);
      const errorMsg = error.response?.data?.Message || error.response?.data?.detail || 'Error al eliminar el cargo ❌';
      showToast.error(errorMsg);
    }
  };

  const PermissionIcon = ({ value }) => {
    return value ? (
      <FaCheck className="text-green-500 mx-auto" />
    ) : (
      <FaTimes className="text-red-500 mx-auto" />
    );
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
            <p className="text-gray-600">Cargando cargos...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cargos y Permisos</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona los cargos y sus permisos del sistema
            </p>
          </div>
          {permisos.crear_producto && (
            <Button
              icon={FaPlus}
              onClick={() => router.push('/recursos/cargos/agregar')}
            >
              Agregar Cargo
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Cargo
                </th>
                <th colSpan="4" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-blue-50">
                  Productos
                </th>
                <th colSpan="4" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-green-50">
                  Empleados
                </th>
                <th colSpan="4" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                  Ventas
                </th>
                <th colSpan="4" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-purple-50">
                  Recursos
                </th>
                <th rowSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
              <tr>
                {/* Productos */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-blue-50">C</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-blue-50">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-blue-50">E</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-blue-50 border-r">V</th>

                {/* Empleados */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-green-50">C</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-green-50">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-green-50">E</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-green-50 border-r">V</th>

                {/* Ventas */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-yellow-50">C</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-yellow-50">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-yellow-50">E</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-yellow-50 border-r">V</th>

                {/* Recursos */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-purple-50">C</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-purple-50">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-purple-50">E</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-purple-50 border-r">V</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargos.length === 0 ? (
                <tr>
                  <td colSpan="18" className="px-6 py-4 text-center text-gray-500">
                    No hay cargos registrados
                  </td>
                </tr>
              ) : (
                cargos.map((cargo) => (
                  <tr key={cargo.id_permiso} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900 border-r">
                      {cargo.cargo}
                    </td>

                    {/* Productos */}
                    <td className="px-2 py-3 text-center bg-blue-50"><PermissionIcon value={cargo.crear_producto} /></td>
                    <td className="px-2 py-3 text-center bg-blue-50"><PermissionIcon value={cargo.modificar_producto} /></td>
                    <td className="px-2 py-3 text-center bg-blue-50"><PermissionIcon value={cargo.eliminar_producto} /></td>
                    <td className="px-2 py-3 text-center bg-blue-50 border-r"><PermissionIcon value={cargo.ver_producto} /></td>

                    {/* Empleados */}
                    <td className="px-2 py-3 text-center bg-green-50"><PermissionIcon value={cargo.crear_empleado} /></td>
                    <td className="px-2 py-3 text-center bg-green-50"><PermissionIcon value={cargo.modificar_empleado} /></td>
                    <td className="px-2 py-3 text-center bg-green-50"><PermissionIcon value={cargo.eliminar_empleado} /></td>
                    <td className="px-2 py-3 text-center bg-green-50 border-r"><PermissionIcon value={cargo.ver_empleado} /></td>

                    {/* Ventas */}
                    <td className="px-2 py-3 text-center bg-yellow-50"><PermissionIcon value={cargo.crear_venta} /></td>
                    <td className="px-2 py-3 text-center bg-yellow-50"><PermissionIcon value={cargo.modificar_venta} /></td>
                    <td className="px-2 py-3 text-center bg-yellow-50"><PermissionIcon value={cargo.eliminar_venta} /></td>
                    <td className="px-2 py-3 text-center bg-yellow-50 border-r"><PermissionIcon value={cargo.ver_venta} /></td>

                    {/* Recursos */}
                    <td className="px-2 py-3 text-center bg-purple-50"><PermissionIcon value={cargo.crear_recurso} /></td>
                    <td className="px-2 py-3 text-center bg-purple-50"><PermissionIcon value={cargo.modificar_recurso} /></td>
                    <td className="px-2 py-3 text-center bg-purple-50"><PermissionIcon value={cargo.eliminar_recurso} /></td>
                    <td className="px-2 py-3 text-center bg-purple-50 border-r"><PermissionIcon value={cargo.ver_recurso} /></td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        {permisos.modificar_recurso && (
                          <button
                            onClick={() => router.push(`/recursos/cargos/${cargo.id_cargo}`)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar"
                          >
                            <FaEdit size={18} />
                          </button>
                        )}
                        {permisos.eliminar_recurso && (
                          <Popconfirm
                            title="¿Seguro que quiere eliminar?"
                            okText="Sí"
                            cancelText="No"
                            onConfirm={() => handleDelete(cargo)}
                          >
                            <button
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar"
                            >
                              <FaTrash size={18} />
                            </button>
                          </Popconfirm>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p className="font-semibold mb-1">Leyenda:</p>
          <p><strong>C</strong> = Crear | <strong>M</strong> = Modificar | <strong>E</strong> = Eliminar | <strong>V</strong> = Ver</p>
        </div>
      </Card>
    </div>
  );
}
