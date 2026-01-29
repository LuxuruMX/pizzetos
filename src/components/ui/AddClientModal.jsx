'use client';

import { useState } from 'react';
import { useClientes } from '@/hooks/useClientes';
import Input from '@/components/ui/Input';
import { FaTimes, FaUserPlus, FaSave } from 'react-icons/fa';
import { showToast } from '@/utils/toast';

const AddClientModal = ({ isOpen, onClose, onClienteCreado }) => {
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

    const resetForm = () => {
        setFormData({ nombre: '', apellido: '', telefono: '' });
        setDireccionForm({ calle: '', manzana: '', lote: '', colonia: '', referencia: '' });
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

            // Debug: Ver qué devuelve la API
            console.log('Resultado de createCliente:', result);

            if (result.success) {
                // El ID puede venir en diferentes propiedades dependiendo de la API
                const clienteData = result.data;
                console.log('Cliente creado:', clienteData);

                // Buscar el ID en diferentes posibles propiedades
                const clienteId = clienteData.id_clie || clienteData.id || clienteData.cliente_id;

                if (!clienteId) {
                    console.error('No se pudo obtener el ID del cliente:', clienteData);
                    showToast.error('Cliente creado pero no se pudo obtener el ID. Por favor recarga la página.');
                    resetForm();
                    onClose();
                    return;
                }

                // Crear objeto cliente para el select
                const nuevoCliente = {
                    value: clienteId,
                    label: `${formData.nombre} ${formData.apellido}`,
                    telefono: formData.telefono
                };

                console.log('Nuevo cliente para select:', nuevoCliente);

                resetForm();
                onClienteCreado(nuevoCliente);
                onClose();
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

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-orange-500 to-orange-600">
                    <div className="flex items-center gap-3">
                        <FaUserPlus className="text-2xl text-white" />
                        <h2 className="text-xl font-bold text-white">Agregar Nuevo Cliente</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Información del Cliente */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Información del Cliente
                            </h3>
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

                        {/* Dirección de Entrega */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Dirección de Entrega
                                <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Puedes agregar una dirección ahora o hacerlo después.
                                {direccionTieneDatos() && (
                                    <span className="text-orange-600 font-medium block mt-1">
                                        ⚠️ Si llenas algún campo, Calle y Colonia son obligatorios.
                                    </span>
                                )}
                            </p>
                            <div className="space-y-4">
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
                    </div>

                    {/* Footer */}
                    <div className="border-t p-5 bg-gray-50">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <FaSave />
                                {loading ? 'Guardando...' : 'Guardar Cliente'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
