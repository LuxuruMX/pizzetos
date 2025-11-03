'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientes } from '@/hooks/useClientes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function AgregarClientePage() {
  const router = useRouter();
  const { createCliente } = useClientes(); 

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
  });

  const [direccionForm, setDireccionForm] = useState({
    calle: '',
    manzana: '',
    lote: '',
    colonia: '',
    referencia: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChangeCliente = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangeDireccion = (e) => {
    const { name, value } = e.target;
    setDireccionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple (puedes hacerla más exhaustiva)
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor completa todos los campos obligatorios del cliente.');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        // Convertimos telefono a número si el backend lo requiere
        telefono: parseInt(formData.telefono, 10), 
        // Enviamos la dirección como un array, ya que el backend lo espera así
        direcciones: [direccionForm],
      };

      // Llamamos a la función createCliente del hook
      const result = await createCliente(dataToSend);

      if (result.success) {
        router.push('/clientes'); // Redirige a la lista de clientes
      } else {
        // Maneja el error devuelto por el hook
        alert(`Error al crear cliente: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
        // Este catch manejará errores inesperados no capturados por el hook
        console.error('Error inesperado al crear cliente:', error);
        alert('Error inesperado al crear cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Button
            variant="ghost"
            icon={FaArrowLeft}
            onClick={() => router.back()} // Vuelve a la página anterior (ej: lista de clientes)
          >
            Volver
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Agregar Nuevo Cliente
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChangeCliente}
                placeholder="Nombre del cliente"
                required
              />
              <Input
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChangeCliente}
                placeholder="Apellido del cliente"
                required
              />
              <Input
                label="Teléfono"
                name="telefono"
                type="number"
                value={formData.telefono}
                onChange={handleChangeCliente}
                placeholder="Número de teléfono"
                required
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Dirección de Entrega</h2>
            <p className="text-sm text-gray-500 mb-4">Se puede agregar más direcciones después de crear el cliente.</p>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Calle"
                name="calle"
                value={direccionForm.calle}
                onChange={handleChangeDireccion}
                placeholder="Calle y número"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Manzana"
                  name="manzana"
                  value={direccionForm.manzana}
                  onChange={handleChangeDireccion}
                  placeholder="Manzana"
                />
                <Input
                  label="Lote"
                  name="lote"
                  value={direccionForm.lote}
                  onChange={handleChangeDireccion}
                  placeholder="Lote"
                />
              </div>
              <Input
                label="Colonia"
                name="colonia"
                value={direccionForm.colonia}
                onChange={handleChangeDireccion}
                placeholder="Colonia"
                required
              />
              <Input
                label="Referencia"
                name="referencia"
                value={direccionForm.referencia}
                onChange={handleChangeDireccion}
                placeholder="Punto de referencia"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              icon={FaSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cliente'}
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