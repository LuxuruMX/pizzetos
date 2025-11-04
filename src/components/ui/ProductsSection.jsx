import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useRef } from 'react';
import ProductCard from "@/components/ui/ProductCard"

const ProductsSection = ({ 
  categorias, 
  categoriaActiva, 
  onCategoriaChange,
  subcategorias = [], 
  subcategoriaActiva = null, 
  onSubcategoriaChange = null, 
  productos, 
  onAddToCart 
}) => {
  const categoriesContainerRef = useRef(null);
  const subcategoriesContainerRef = useRef(null);

  const scroll = (direction, containerRef) => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const mostrarSubcategorias = subcategorias && subcategorias.length > 0;

  return (
    <div className="w-2/3 ml-6 flex flex-col overflow-y-auto" 
         style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="px-6 pt-6">

        {/* Contenedor para Categorías con Scroll Horizontal y Flechas */}
        <div className="relative mb-4">
          <div className="border border-gray-300 rounded-lg p-1 shadow-sm bg-white">
            <div className="flex items-center">
              {/* Flecha Izquierda */}
              <button
                onClick={() => scroll('left', categoriesContainerRef)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full mr-1 flex-shrink-0 z-10"
                aria-label="Desplazar categorías a la izquierda"
              >
                <FaChevronLeft className="h-5 w-5" />
              </button>

              {/* Contenedor de Categorías */}
              <div
                ref={categoriesContainerRef}
                className="flex-1 overflow-x-auto hide-scrollbar flex justify-start py-1"
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
                onClick={() => scroll('right', categoriesContainerRef)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full ml-1 flex-shrink-0 z-10"
                aria-label="Desplazar categorías a la derecha"
              >
                <FaChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor para Subcategorías */}
        {mostrarSubcategorias && (
          <div className="relative mb-6">
            <div className="border border-gray-300 rounded-lg p-1 shadow-sm bg-gray-50">
              <div className="flex items-center">
                {/* Flecha Izquierda */}
                <button
                  onClick={() => scroll('left', subcategoriesContainerRef)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-full mr-1 flex-shrink-0 z-10"
                  aria-label="Desplazar subcategorías a la izquierda"
                >
                  <FaChevronLeft className="h-4 w-4" />
                </button>

                {/* Contenedor de Subcategorías */}
                <div
                  ref={subcategoriesContainerRef}
                  className="flex-1 overflow-x-auto hide-scrollbar flex justify-start py-1"
                >
                  <div className="flex space-x-3 min-w-max">
                    {/* Botón "Todas" */}
                    <button
                      onClick={() => onSubcategoriaChange && onSubcategoriaChange(null)}
                      className={`px-3 py-1.5 text-sm rounded-lg flex-shrink-0 ${
                        subcategoriaActiva === null
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      Todas
                    </button>
                    {subcategorias.map((subcategoria) => (
                      <button
                        key={subcategoria}
                        onClick={() => onSubcategoriaChange && onSubcategoriaChange(subcategoria)}
                        className={`px-3 py-1.5 text-sm rounded-lg flex-shrink-0 ${
                          subcategoriaActiva === subcategoria
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                      >
                        {subcategoria}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flecha Derecha */}
                <button
                  onClick={() => scroll('right', subcategoriesContainerRef)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-full ml-1 flex-shrink-0 z-10"
                  aria-label="Desplazar subcategorías a la derecha"
                >
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de productos con scroll vertical */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
};

export default ProductsSection;