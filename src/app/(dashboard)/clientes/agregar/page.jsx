'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientes } from '@/hooks/useClientes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

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

  // Verifica si el usuario empezó a llenar algún campo de dirección
  const direccionTieneDatos = () => {
    return Object.values(direccionForm).some(valor => valor.trim() !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de datos del cliente (siempre obligatorios)
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      showToast.error('Por favor completa todos los campos obligatorios del cliente.');
      return;
    }

    // Si hay datos en la dirección, validar campos esenciales
    if (direccionTieneDatos()) {
      if (!direccionForm.calle || !direccionForm.colonia) {
        showToast.error('Si agregas una dirección, los campos Calle y Colonia son obligatorios.');
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        telefono: parseInt(formData.telefono, 10),
        // Solo enviar direcciones si el usuario llenó algún campo
        direcciones: direccionTieneDatos() ? [direccionForm] : [],
      };

      const result = await createCliente(dataToSend);

      if (result.success) {
        router.push('/clientes');
        showToast.success('Cliente creado exitosamente');
      } else {
        showToast.error(`Error al crear cliente: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error inesperado al crear cliente:', error);
      showToast.error('Error inesperado al crear cliente.');
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
            onClick={() => router.back()}
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
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Dirección de Entrega (Opcional)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Puedes agregar una dirección ahora o hacerlo después.
              {direccionTieneDatos() && (
                <span className="text-orange-600 font-medium"> Si llenas algún campo, Calle y Colonia son obligatorios.</span>
              )}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label={`Calle${direccionTieneDatos() ? ' *' : ''}`}
                name="calle"
                value={direccionForm.calle}
                onChange={handleChangeDireccion}
                placeholder="Calle y número"
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
                label={`Colonia${direccionTieneDatos() ? ' *' : ''}`}
                name="colonia"
                value={direccionForm.colonia}
                onChange={handleChangeDireccion}
                placeholder="Colonia"
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
              onClick={() => router.back()}
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