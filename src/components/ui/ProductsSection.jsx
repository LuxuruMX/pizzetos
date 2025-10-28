import ProductCard from '@/components/ui/ProductCard';
import { useRef } from 'react'; // Importamos useRef para manejar el desplazamiento

const ProductsSection = ({ 
  categorias, 
  categoriaActiva, 
  onCategoriaChange, 
  productos, 
  onAddToCart 
}) => {
  const categoriesContainerRef = useRef(null); // Referencia para el contenedor de categorías

  const scroll = (direction) => {
    const container = categoriesContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8; // Desplazar el 80% del ancho visible
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth' // Desplazamiento suave
      });
    }
  };

  return (
    <div className="w-2/3 ml-6 flex flex-col overflow-y-auto" 
         style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      {/* ocultar scrollbar horizontal (WebKit, Firefox, IE/Edge) */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-black">Punto de Venta</h1>

        {/* Contenedor para Categorías con Scroll Horizontal y Flechas */}
        <div className="relative mb-6">
          {/* Card exterior que encierra el contenedor de categorías y las flechas */}
          <div className="border border-gray-300 rounded-lg p-1 shadow-sm bg-white">
            {/* Contenedor de flechas izquierda y contenedor interno con categorías */}
            <div className="flex items-center">
              {/* Flecha Izquierda */}
              <button
                onClick={() => scroll('left')}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full mr-1 flex-shrink-0 z-10"
                aria-label="Desplazar categorías a la izquierda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Contenedor de Categorías con Scroll Horizontal y Scrollbar Oculto */}
              <div
                ref={categoriesContainerRef} // Asignamos la referencia aquí
                className="flex-1 overflow-x-auto hide-scrollbar flex justify-start py-1"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              >
                <div className="flex space-x-4 min-w-max">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria}
                      onClick={() => onCategoriaChange(categoria)}
                      className={`px-4 py-2 rounded-lg flex-shrink-0 ${
                        categoriaActiva === categoria
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flecha Derecha */}
              <button
                onClick={() => scroll('right')}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full ml-1 flex-shrink-0 z-10"
                aria-label="Desplazar categorías a la derecha"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
        {productos.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center">No hay productos disponibles</p>
        ) : (
          productos.map((producto) => {
            if (!producto) return null;
            const tipoId = Object.keys(producto).find((key) => key.startsWith('id_'));
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