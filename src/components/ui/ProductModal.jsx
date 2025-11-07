import { IoClose } from 'react-icons/io5';

const ProductModal = ({ isOpen, onClose, nombreProducto, variantes, onSeleccionar }) => {
  if (!isOpen) return null;

  // Función para obtener el nombre del tamaño
  const obtenerTamano = (variante) => {
    return variante.subcategoria || variante.tamano || variante.tamaño || 'Sin especificar';
  };

  // Función para obtener el tipoId
  const obtenerTipoId = (variante) => {
    return Object.keys(variante).find((key) => key.startsWith('id_'));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{nombreProducto}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">Selecciona el tamaño:</p>
          <div className="space-y-3">
            {variantes.map((variante) => {
              const tipoId = obtenerTipoId(variante);
              const tamano = obtenerTamano(variante);
              const precio = parseFloat(variante.precio) || 0;

              return (
                <button
                  key={variante[tipoId]}
                  onClick={() => onSeleccionar(variante, tipoId)}
                  className="w-full bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-400 rounded-lg p-4 flex justify-between items-center transition-all"
                >
                  <span className="font-semibold text-gray-800 text-lg">{tamano}</span>
                  <span className="text-green-600 font-bold text-xl">${precio.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;