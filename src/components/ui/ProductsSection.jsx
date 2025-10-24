// src/components/pos/ProductsSection.jsx
import ProductCard from '@/components/ui/ProductCard';

const ProductsSection = ({ 
  categorias, 
  categoriaActiva, 
  onCategoriaChange, 
  productos, 
  onAddToCart 
}) => {
  return (
    <div className="w-2/3 ml-6 flex flex-col overflow-y-auto" 
         style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-center mb-6">Punto de Venta</h1>

        {/* Selector de Categorías */}
        <div className="flex justify-center space-x-4 mb-6">
          {categorias.map(categoria => (
            <button
              key={categoria}
              onClick={() => onCategoriaChange(categoria)}
              className={`px-4 py-2 rounded-lg ${
                categoriaActiva === categoria
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
        {productos.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center">No hay productos disponibles</p>
        ) : (
          productos.map(producto => {
            if (!producto) return null;
            const tipoId = Object.keys(producto).find(key => key.startsWith('id_'));
            if (!tipoId) return null;
            
            return (
              <ProductCard
                key={producto[tipoId]}
                producto={producto}
                tipoId={tipoId}
                onAddToCart={onAddToCart}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductsSection;