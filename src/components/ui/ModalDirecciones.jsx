import { useEffect } from 'react';
import Button from './Button';
import Input from './Input';

export default function ModalDirecciones({
  isOpen,
  onClose,
  cliente,
  direccionActual,
  onSubmit,
  loading = false,
}) {
  const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : '';

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
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    // Opcional: Validar campos aquí antes de enviar
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-100 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {direccionActual ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
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
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                {direccionActual ? 'Guardar Cambios' : 'Agregar Dirección'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}