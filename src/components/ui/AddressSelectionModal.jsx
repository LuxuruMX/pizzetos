'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { catalogsService } from '@/services/catalogsService';
import { clientesService } from '@/services/clientesService';
import { FaMapMarkerAlt, FaTimes, FaUserPlus, FaPlus, FaCalendarAlt } from 'react-icons/fa';
import AddClientModal from './AddClientModal';
import ModalDirecciones from './ModalDirecciones';
import { showToast } from '@/utils/toast';

const AddressSelectionModal = ({ isOpen, onClose, onConfirm, clientes, clienteSeleccionado, onClienteChange, onClienteCreado, askForDate = false }) => {
    const [direcciones, setDirecciones] = useState([]);
    const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalAgregarCliente, setModalAgregarCliente] = useState(false);
    const [modalAgregarDireccion, setModalAgregarDireccion] = useState(false);
    const [loadingDireccion, setLoadingDireccion] = useState(false);
    const [fechaEntrega, setFechaEntrega] = useState('');

    useEffect(() => {
        const fetchDirecciones = async () => {
            if (clienteSeleccionado?.value) {
                setLoading(true);
                setError(null);
                setDireccionSeleccionada(null);
                try {
                    const data = await catalogsService.getClientesDirecciones(clienteSeleccionado.value);
                    setDirecciones(data);
                    if (data.length === 0) {
                        setError('Este cliente no tiene direcciones registradas.');
                    }
                } catch (err) {
                    console.error('Error al cargar direcciones:', err);
                    setError('Error al cargar las direcciones del cliente.');
                    setDirecciones([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setDirecciones([]);
                setDireccionSeleccionada(null);
            }
        };

        if (isOpen) {
            setDireccionSeleccionada(null); // Reset selection when modal opens
            setFechaEntrega('');
            fetchDirecciones();
        }
    }, [clienteSeleccionado, isOpen]);

    const handleClienteCreado = (nuevoCliente) => {
        console.log('AddressSelectionModal - handleClienteCreado llamado con:', nuevoCliente);
        // Notificar al componente padre para que actualice la lista de clientes
        if (onClienteCreado) {
            onClienteCreado(nuevoCliente);
        }
        // Seleccionar automáticamente el nuevo cliente
        onClienteChange(nuevoCliente);
        console.log('AddressSelectionModal - Cliente cambiado, el useEffect debería dispararse');
    };

    const handleDireccionCreada = async (dataDireccion) => {
        if (!clienteSeleccionado?.value) return;

        setLoadingDireccion(true);
        try {
            const response = await clientesService.addDireccion(clienteSeleccionado.value, dataDireccion);
            // Recargar las direcciones del cliente
            const data = await catalogsService.getClientesDirecciones(clienteSeleccionado.value);
            setDirecciones(data);
            setError(null);
            // Si la respuesta incluye el id de la nueva dirección, seleccionarla automáticamente
            if (response?.id_dir) {
                setDireccionSeleccionada(response.id_dir);
            } else if (data.length > 0) {
                // Seleccionar la última dirección agregada
                setDireccionSeleccionada(data[data.length - 1].id_dir);
            }
            setModalAgregarDireccion(false);
        } catch (err) {
            console.error('Error al crear dirección:', err);
            showToast.error(err.message || 'Error al crear la dirección');
        } finally {
            setLoadingDireccion(false);
        }
    };

    const handleConfirm = () => {
        if (clienteSeleccionado && direccionSeleccionada) {
            if (askForDate && !fechaEntrega) return;

            // Encontrar el objeto de dirección completo
            const direccionObj = direcciones.find(d => d.id_dir === direccionSeleccionada);

            onConfirm(clienteSeleccionado, direccionSeleccionada, fechaEntrega, direccionObj);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="text-2xl text-orange-500" />
                        <h2 className="text-2xl font-bold text-gray-800">Seleccionar Dirección de Entrega</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Customer Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cliente <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Select
                                    options={clientes}
                                    value={clienteSeleccionado}
                                    onChange={onClienteChange}
                                    placeholder="Buscar y seleccionar cliente..."
                                    isClearable
                                    isSearchable
                                    className="text-black"
                                    noOptionsMessage={() => "No se encontraron clientes"}
                                    filterOption={(option, inputValue) => {
                                        if (!inputValue) return true;
                                        const label = option.label.toLowerCase();
                                        const telefono = option.data.telefono ? String(option.data.telefono) : '';
                                        const search = inputValue.toLowerCase();
                                        return label.includes(search) || telefono.includes(search);
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAgregarCliente(true)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                                title="Agregar nuevo cliente"
                            >
                                <FaUserPlus />
                                <span className="hidden sm:inline">Nuevo</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            ¿No encuentras al cliente? Haz clic en <span className="text-yellow-600 font-medium">Nuevo</span> para agregarlo.
                        </p>
                    </div>

                    {/* Date Selection for Special Orders */}
                    {askForDate && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Entrega <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
                                <FaCalendarAlt className="text-gray-400" />
                                <input
                                    type="datetime-local"
                                    value={fechaEntrega}
                                    onChange={(e) => setFechaEntrega(e.target.value)}
                                    className="flex-1 outline-none text-gray-700"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Address List */}
                    {clienteSeleccionado && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setModalAgregarDireccion(true)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                    title="Agregar nueva dirección a este cliente"
                                >
                                    <FaPlus className="text-xs" />
                                    <span>Nueva Dirección</span>
                                </button>
                            </div>

                            {loading && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Cargando direcciones...</p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <p className="text-yellow-800">{error}</p>
                                </div>
                            )}

                            {!loading && !error && direcciones.length > 0 && (
                                <div className="space-y-3">
                                    {direcciones.map((direccion) => (
                                        <div
                                            key={direccion.id_dir}
                                            onClick={() => setDireccionSeleccionada(direccion.id_dir)}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${direccionSeleccionada === direccion.id_dir
                                                ? 'border-orange-500 bg-orange-50 shadow-md'
                                                : 'border-gray-300 hover:border-orange-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="direccion"
                                                    checked={direccionSeleccionada === direccion.id_dir}
                                                    onChange={() => setDireccionSeleccionada(direccion.id_dir)}
                                                    className="mt-1 text-orange-500 focus:ring-orange-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800 mb-1">
                                                        {direccion.calle}
                                                    </p>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p>
                                                            <span className="font-medium">Manzana:</span> {direccion.manzana} |
                                                            <span className="font-medium"> Lote:</span> {direccion.lote}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Colonia:</span> {direccion.colonia}
                                                        </p>
                                                        {direccion.referencia && (
                                                            <p className="italic">
                                                                <span className="font-medium">Referencia:</span> {direccion.referencia}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-gray-50">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!clienteSeleccionado || !direccionSeleccionada || (askForDate && !fechaEntrega)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Confirmar Selección
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para agregar nuevo cliente */}
            <AddClientModal
                isOpen={modalAgregarCliente}
                onClose={() => setModalAgregarCliente(false)}
                onClienteCreado={handleClienteCreado}
            />

            {/* Modal para agregar nueva dirección */}
            <ModalDirecciones
                isOpen={modalAgregarDireccion}
                onClose={() => setModalAgregarDireccion(false)}
                cliente={clienteSeleccionado ? { nombre: clienteSeleccionado.label.split(' ')[0], apellido: clienteSeleccionado.label.split(' ').slice(1).join(' ') || '' } : null}
                direccionActual={null}
                onSubmit={handleDireccionCreada}
                loading={loadingDireccion}
            />
        </div>
    );
};

export default AddressSelectionModal;

