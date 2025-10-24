// src/components/ui/ProductCard.jsx
const ProductCard = ({ producto, tipoId, onAddToCart }) => {
  // Validaciones defensivas
  if (!producto || !tipoId) {
    return null;
  }

  const nombre = producto.nombre || 'Sin nombre';
  const precio = parseFloat(producto.precio) || 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      <h3 className="font-semibold text-lg">{nombre}</h3>
      <p className="text-gray-600">Precio: ${precio.toFixed(2)}</p>
      <button
        onClick={() => onAddToCart(producto, tipoId)}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Agregar
      </button>
    </div>
  );
};

export default ProductCard;