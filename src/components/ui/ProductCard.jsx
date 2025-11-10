const ProductCard = ({ producto, tipoId, onProductoClick, mostrarPrecio = true }) => {
  if (!producto || !tipoId) {
    return null;
  }

  const nombre = producto.nombre || 'Sin nombre';
  const precio = parseFloat(producto.precio) || 0;

  return (
    <button
      onClick={() => onProductoClick(producto, tipoId)}
      className="w-full bg-white p-4 rounded-lg shadow-md flex flex-col text-left hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer transition-all duration-200 border-l-4 border-yellow-400 relative overflow-hidden group"
    >
      {/* Efecto de fondo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative z-10">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{nombre}</h3>
        {mostrarPrecio && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Precio</span>
            <span className="text-xl font-bold text-yellow-600">${precio.toFixed(2)}</span>
          </div>
        )}
        {!mostrarPrecio && (
          <span className="text-sm text-yellow-600 font-semibold">Ver opciones →</span>
        )}
      </div>
    </button>
  );
};

export default ProductCard;