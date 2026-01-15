import { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import Popconfirm from './Popconfirm';
import { clientesService } from '@/services/clientesService';
import { showToast } from '@/utils/toast';
import { FaTrash } from 'react-icons/fa';

export default function ModalDirecciones({
  isOpen,
  onClose,
  cliente,
  direccionActual,
  onSubmit,
  loading = false,
}) {
  const [direcciones, setDirecciones] = useState([]);
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : '';

  // Fetch direcciones when modal opens
  useEffect(() => {
    const fetchDirecciones = async () => {
      if (isOpen && cliente?.id_clie) {
        setLoadingDirecciones(true);
        try {
          const data = await clientesService.onlyDirecciones(cliente.id_clie);
          setDirecciones(data || []);
        } catch (error) {
          console.error('Error al cargar direcciones:', error);
          showToast.error('Error al cargar las direcciones');
          setDirecciones([]);
        } finally {
          setLoadingDirecciones(false);
        }
      }
    };

    fetchDirecciones();
  }, [isOpen, cliente?.id_clie]);

  // Manejar el cierre con la tecla Esc
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Manejar clic fuera del contenido del modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    await onSubmit(data);

    // Refresh direcciones list after adding
    try {
      const updatedData = await clientesService.onlyDirecciones(cliente.id_clie);
      setDirecciones(updatedData || []);
      e.target.reset(); // Clear form
    } catch (error) {
      console.error('Error al actualizar lista de direcciones:', error);
    }
  };

  // Manejar eliminación de dirección
  const handleDelete = async (id_dir) => {
    setDeletingId(id_dir);
    try {
      await clientesService.deleteDireccion(id_dir);
      showToast.success('Dirección eliminada correctamente');

      // Refresh direcciones list
      const updatedData = await clientesService.onlyDirecciones(cliente.id_clie);
      setDirecciones(updatedData || []);
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      const errorMsg = error.response?.data?.detail || 'Error al eliminar la dirección';
      showToast.error(`Error: ${errorMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Gestionar Direcciones
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Cerrar"
            >
              &times;
            </button>
          </div>
          <p className="text-gray-600 mt-2 mb-4">
            Cliente: <span className="font-semibold">{clienteNombre}</span>
          </p>

          {/* Lista de direcciones existentes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Direcciones Registradas
            </h3>

            {loadingDirecciones ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Cargando direcciones...</p>
              </div>
            ) : direcciones.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">No hay direcciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {direcciones.map((dir) => (
                  <div
                    key={dir.id_dir}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{dir.calle}</p>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          {(dir.manzana || dir.lote) && (
                            <p>
                              {dir.manzana && `Manzana: ${dir.manzana}`}
                              {dir.manzana && dir.lote && ' • '}
                              {dir.lote && `Lote: ${dir.lote}`}
                            </p>
                          )}
                          <p>Colonia: {dir.colonia}</p>
                          {dir.referencia && (
                            <p className="italic">Ref: {dir.referencia}</p>
                          )}
                        </div>
                      </div>
                      <Popconfirm
                        title="¿Seguro que quiere eliminar esta dirección?"
                        okText="Sí"
                        cancelText="No"
                        onConfirm={() => handleDelete(dir.id_dir)}
                      >
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors ml-3"
                          disabled={deletingId === dir.id_dir}
                          title="Eliminar dirección"
                        >
                          <FaTrash size={18} />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario para agregar nueva dirección */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Agregar Nueva Dirección
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="calle" className="block text-sm font-medium text-gray-700 mb-1">
                    Calle
                  </label>
                  <Input
                    type="text"
                    id="calle"
                    name="calle"
                    defaultValue={direccionActual?.calle || ''}
                    required
                    placeholder="Calle y número"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="manzana" className="block text-sm font-medium text-gray-700 mb-1">
                      Manzana
                    </label>
                    <Input
                      type="text"
                      id="manzana"
                      name="manzana"
                      defaultValue={direccionActual?.manzana || ''}
                      placeholder="Manzana"
                    />
                  </div>
                  <div>
                    <label htmlFor="lote" className="block text-sm font-medium text-gray-700 mb-1">
                      Lote
                    </label>
                    <Input
                      type="text"
                      id="lote"
                      name="lote"
                      defaultValue={direccionActual?.lote || ''}
                      placeholder="Lote"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="colonia" className="block text-sm font-medium text-gray-700 mb-1">
                    Colonia
                  </label>
                  <Input
                    type="text"
                    id="colonia"
                    name="colonia"
                    defaultValue={direccionActual?.colonia || ''}
                    required
                    placeholder="Colonia"
                  />
                </div>
                <div>
                  <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <Input
                    type="text"
                    id="referencia"
                    name="referencia"
                    defaultValue={direccionActual?.referencia || ''}
                    placeholder="Punto de referencia"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cerrar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  Agregar Dirección
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}