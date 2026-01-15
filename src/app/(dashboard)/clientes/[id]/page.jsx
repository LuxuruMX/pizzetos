'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientesService } from '@/services/clientesService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const idCliente = params.id;

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
  });
  // Estado para manejar la lista de direcciones
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (idCliente) {
      fetchData();
    }
  }, [idCliente]); // Se ejecuta cuando cambia el idCliente

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Llamamos directamente al servicio para obtener el cliente por ID
      const cliente = await clientesService.getById(idCliente);

      // Rellenamos el formulario del cliente
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        telefono: cliente.telefono ? cliente.telefono.toString() : '', // Convertir a string
      });

      // Rellenamos el estado de direcciones
      setDirecciones(cliente.direcciones || []);

    } catch (error) {
      console.error('Error fetching cliente data:', error);
      showToast.error('Error al cargar los datos del cliente.');

    } finally {
      setLoadingData(false);
    }
  };

  const handleChangeCliente = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangeDireccion = (index, e) => {
    const { name, value } = e.target;
    setDirecciones(prevDirecciones => {
      const nuevasDirecciones = [...prevDirecciones];
      nuevasDirecciones[index] = {
        ...nuevasDirecciones[index],
        [name]: value
      };
      return nuevasDirecciones;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      showToast.error('Por favor completa todos los campos obligatorios del cliente.');
      return;
    }

    setLoading(true);

    try {
      // Datos del cliente a enviar incluyendo las direcciones
      const dataClienteToSend = {
        ...formData,
        telefono: parseInt(formData.telefono, 10),
        direcciones: direcciones.map(dir => ({
          id_dir: dir.id_dir || 0,
          calle: dir.calle || '',
          manzana: dir.manzana || '',
          lote: dir.lote || '',
          colonia: dir.colonia || '',
          referencia: dir.referencia || ''
        }))
      };
      await clientesService.update(idCliente, dataClienteToSend);

      showToast.success('Cliente actualizado exitosamente.');
      router.push('/clientes');
    } catch (error) {
      console.error('Error updating cliente:', error);
      showToast.error('Error al actualizar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando cliente...</p>
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
            onClick={() => router.back()}
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Editar Cliente
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChangeCliente}
                placeholder="Nombre del cliente"
                required
              />
              <Input
                label="Apellido *"
                name="apellido"
                value={formData.apellido}
                onChange={handleChangeCliente}
                placeholder="Apellido del cliente"
                required
              />
              <Input
                label="Teléfono *"
                name="telefono"
                type="number"
                value={formData.telefono}
                onChange={handleChangeCliente}
                placeholder="Número de teléfono"
                required
              />
            </div>
          </div>

          {/* Sección de Direcciones */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Direcciones</h2>
            <p className="text-sm text-gray-500 mb-4">Puedes editar las direcciones existentes.</p>
            {direcciones.length === 0 ? (
              <p className="text-gray-500 italic">No hay direcciones registradas para este cliente.</p>
            ) : (
              direcciones.map((direccion, index) => (
                <div key={direccion.id_dir || index} className="border border-gray-200 rounded p-4 mb-4 bg-gray-50">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Dirección {index + 1}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      label="Calle"
                      name="calle"
                      value={direccion.calle}
                      onChange={(e) => handleChangeDireccion(index, e)}
                      placeholder="Calle y número"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Manzana"
                        name="manzana"
                        value={direccion.manzana}
                        onChange={(e) => handleChangeDireccion(index, e)}
                        placeholder="Manzana"
                      />
                      <Input
                        label="Lote"
                        name="lote"
                        value={direccion.lote}
                        onChange={(e) => handleChangeDireccion(index, e)}
                        placeholder="Lote"
                      />
                    </div>
                    <Input
                      label="Colonia"
                      name="colonia"
                      value={direccion.colonia}
                      onChange={(e) => handleChangeDireccion(index, e)}
                      placeholder="Colonia"
                    />
                    <Input
                      label="Referencia"
                      name="referencia"
                      value={direccion.referencia}
                      onChange={(e) => handleChangeDireccion(index, e)}
                      placeholder="Punto de referencia"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Actualizar Cliente'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()} // Vuelve sin guardar
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