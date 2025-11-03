'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useClientes } from '@/hooks/useClientes';
import { clientesService } from '@/services/clientesService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { FaPlus, FaEdit, FaTrash, FaAddressBook } from 'react-icons/fa';
import Popconfirm from '@/components/ui/Popconfirm';
import ModalDirecciones from '@/components/ui/ModalDirecciones';

export default function ClientesPage() {
  const router = useRouter();
  const { clientes, loading: loadingClientes, error: errorClientes, deleteCliente } = useClientes();
  const [permisos, setPermisos] = useState(null);

  // Estados para el modal de direcciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [direccionActual, setDireccionActual] = useState(null);
  const [loadingDireccion, setLoadingDireccion] = useState(false);

  useEffect(() => {
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

  const handleAddAddress = (cliente) => {
    setClienteSeleccionado(cliente);
    setDireccionActual(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClienteSeleccionado(null);
    setDireccionActual(null);
  };

  // Función para enviar la dirección al backend usando clientesService
  const handleSubmitDireccion = async (formData) => {
    if (!clienteSeleccionado) return;

    setLoadingDireccion(true);
    try {
      await clientesService.addDireccion(clienteSeleccionado.id_clie, {
        calle: formData.calle,
        manzana: formData.manzana,
        lote: formData.lote,
        colonia: formData.colonia,
        referencia: formData.referencia
      });

      alert('Dirección guardada correctamente');
      handleCloseModal();

    } catch (err) {
      console.error('Error al guardar dirección:', err);
      const errorMsg = err.response?.data?.detail || 'Error al guardar la dirección';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoadingDireccion(false);
    }
  };

  const handleEdit = (cliente) => {
    router.push(`/clientes/${cliente.id_clie}`);
  };

  const handleDelete = async (cliente) => {
    const result = await deleteCliente(cliente.id_clie);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  const handleAdd = () => {
    router.push('/clientes/agregar');
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

  const columns = [
    {
      header: 'NOMBRE',
      accessor: 'nombre',
      render: (row) => <span>{row.nombre}</span>
    },
    {
      header: 'APELLIDO',
      accessor: 'apellido',
      render: (row) => <span>{row.apellido}</span>
    },
    {
      header: 'TELÉFONO',
      accessor: 'telefono',
      render: (row) => <span>{row.telefono}</span>
    },
    {
      header: 'ACCIONES',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-center gap-2">
          {/* Botón Agregar Dirección */}
          {permisos.modificar_venta && (
            <button
              onClick={() => handleAddAddress(row)}
              className="text-green-500 hover:text-green-700 transition-colors"
              title="Agregar dirección"
            >
              <FaAddressBook size={18} />
            </button>
          )}
          
          {/* Botón Editar */}
          {permisos.modificar_venta && (
            <button
              onClick={() => handleEdit(row)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Editar Cliente"
            >
              <FaEdit size={18} />
            </button>
          )}

          {/* Botón Eliminar */}
          {permisos.eliminar_venta && (
            <Popconfirm
              title="¿Seguro que quiere eliminar este cliente?"
              okText="Sí"
              cancelText="No"
              onConfirm={() => handleDelete(row)}
            >
              <button
                className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                title="Eliminar Cliente"
              >
                <FaTrash size={18} />
              </button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  if (loadingClientes) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (errorClientes) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">Error: {errorClientes}</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona la información de los clientes
            </p>
          </div>

          {permisos.crear_venta && (
            <Button icon={FaPlus} onClick={handleAdd}>
              Añadir Cliente
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          data={clientes}
        />
      </Card>

      {/* Modal de Direcciones */}
      <ModalDirecciones
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cliente={clienteSeleccionado}
        direccionActual={direccionActual}
        onSubmit={handleSubmitDireccion}
        loading={loadingDireccion}
      />
    </div>
  );
}