import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useRef } from 'react';
import ProductCard from "@/components/ui/ProductCard"

const ProductsSection = ({
  categorias,
  categoriaActiva,
  onCategoriaChange,
  productos,
  onProductoClick,
  mostrarPrecio = true,
  deshabilitarCategorias = false
}) => {
  const categoriesContainerRef = useRef(null);

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

  return (
    <div className="w-2/3 ml-6 flex flex-col overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 8rem)' }}>
      <div className="px-6 pt-6">

        {/* Contenedor para Categorías con Scroll Horizontal y Flechas */}
        <div className="relative mb-4">
          {/* Mensaje de advertencia cuando hay grupo incompleto */}
          {deshabilitarCategorias && (
            <div className="mb-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
              <p className="text-sm font-medium">
                Completa las 4 porciones de Pizza Rectangular antes de cambiar de categoría
              </p>
            </div>
          )}

          <div className="border border-gray-300 rounded-lg p-1 shadow-sm bg-white">
            <div className="flex items-center">
              {/* Flecha Izquierda */}
              <button
                onClick={() => scroll('left', categoriesContainerRef)}
                disabled={deshabilitarCategorias}
                className={`p-2 rounded-full mr-1 flex-shrink-0 z-10 ${deshabilitarCategorias
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
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
                  {categorias.map((categoria) => {
                    const esActiva = categoriaActiva === categoria;
                    const estaDeshabilitada = deshabilitarCategorias && !esActiva;

                    return (
                      <button
                        key={categoria}
                        onClick={() => onCategoriaChange(categoria)}
                        disabled={estaDeshabilitada}
                        className={`px-4 py-2 rounded-lg flex-shrink-0 transition-all ${esActiva
                          ? 'bg-orange-400 text-white'
                          : estaDeshabilitada
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        title={estaDeshabilitada ? 'Completa las 4 porciones rectangulares primero' : ''}
                      >
                        {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flecha Derecha */}
              <button
                onClick={() => scroll('right', categoriesContainerRef)}
                disabled={deshabilitarCategorias}
                className={`p-2 rounded-full ml-1 flex-shrink-0 z-10 ${deshabilitarCategorias
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
                aria-label="Desplazar categorías a la derecha"
              >
                <FaChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
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
                  onProductoClick={onProductoClick}
                  mostrarPrecio={mostrarPrecio}
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