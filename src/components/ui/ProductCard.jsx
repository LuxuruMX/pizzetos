const ProductCard = ({ producto, tipoId, onProductoClick, mostrarPrecio = true }) => {
  if (!producto || !tipoId) {
    return null;
  }

  const nombre = producto.nombre || 'Sin nombre';
  const precio = parseFloat(producto.precio) || 0;

  return (
    <button
      onClick={() => onProductoClick(producto, tipoId)}
      className="w-full bg-white p-4 rounded-lg shadow-md flex flex-col text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
    >
      <h3 className="font-semibold text-lg text-black">{nombre}</h3>
      {mostrarPrecio && (
        <p className="text-gray-600">Precio: ${precio.toFixed(2)}</p>
      )}
      <div className="max-w-full bg-yellow-400 h-1" />
    </button>
  );
};

export default ProductCard;