import { FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import { useState } from 'react';
import ProductCard from "@/components/ui/ProductCard"
import { getProductTypeId } from '@/utils/productUtils';

const ProductsSection = ({
  categorias,
  categoriaActiva,
  onCategoriaChange,
  productos,
  onProductoClick,
  mostrarPrecio = true,
  deshabilitarCategorias = false
}) => {
  const [mostrarMasCategorias, setMostrarMasCategorias] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const catToTipoId = {
    'pizzas': 'id_pizza',
    'mariscos': 'id_maris',
    'hamburguesas': 'id_hamb',
    'alitas': 'id_alis',
    'costillas': 'id_cos',
    'spaguetty': 'id_spag',
    'papas': 'id_papa',
    'refrescos': 'id_refresco',
    'rectangular': 'id_rec',
    'barra': 'id_barr',
    'magno': 'id_magno'
  };


  // const tipoId declaraction removed here, will be used inside map loop or derived locally


  // Categorías principales que siempre se muestran
  const categoriasPrincipales = ['pizzas', 'mariscos', 'rectangular', 'barra'];

  // Categorías secundarias que se muestran en el dropdown
  const categoriasSecundarias = categorias.filter(cat => !categoriasPrincipales.includes(cat));

  const renderCategoryButton = (categoria) => {
    const esActiva = categoriaActiva === categoria;
    const estaDeshabilitada = deshabilitarCategorias && !esActiva;

    return (
      <button
        key={categoria}
        onClick={() => {
          onCategoriaChange(categoria);
          // Si selecciona una categoría secundaria, cerrar el dropdown
          if (categoriasSecundarias.includes(categoria)) {
            setMostrarMasCategorias(false);
          }
        }}
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
  };

  return (
    <div className="w-2/3 ml-6 flex flex-col h-full" >
      <div className="px-6 pt-6">

        {/* Contenedor para Categorías */}
        <div className="relative mb-4">
          {/* Mensaje de advertencia cuando hay grupo incompleto */}
          {deshabilitarCategorias && (
            <div className="mb-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
              <p className="text-sm font-medium">
                Completa las 4 porciones de Pizza Rectangular antes de cambiar de categoría
              </p>
            </div>
          )}

          <div className="border border-gray-300 rounded-lg p-3 shadow-sm bg-white">
            {/* Categorías Principales */}
            <div className="flex flex-wrap gap-2 items-center">
              {categoriasPrincipales.map(categoria => renderCategoryButton(categoria))}

              {/* Botón "Más" para mostrar categorías secundarias */}
              {categoriasSecundarias.length > 0 && (
                <button
                  onClick={() => setMostrarMasCategorias(!mostrarMasCategorias)}
                  disabled={deshabilitarCategorias}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${categoriasSecundarias.includes(categoriaActiva)
                    ? 'bg-orange-400 text-white'
                    : deshabilitarCategorias
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                >
                  Extras
                  {mostrarMasCategorias ? (
                    <FaChevronUp className="h-4 w-4" />
                  ) : (
                    <FaChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Buscador */}
              <div className="relative flex items-center ml-auto">
                <FaSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-40 transition-all focus:w-60 text-sm text-black"
                />
              </div>
            </div>

            {/* Categorías Secundarias (Collapsible) */}
            {mostrarMasCategorias && categoriasSecundarias.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {categoriasSecundarias.map(categoria => renderCategoryButton(categoria))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de productos */}
      <div className="flex-1 px-6 pb-6 pt-1" >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.length === 0 ? (
            <p className="text-gray-500 col-span-3 text-center">No hay productos disponibles</p>
          ) : (
            productos
              .filter(producto => {
                if (!searchTerm) return true;
                const termino = searchTerm.toLowerCase();
                const nombre = (producto.nombre || '').toLowerCase();
                return nombre.includes(termino);
              })
              .map((producto) => {
                if (!producto) return null;
                // Determinar tipoId basado en la categoría activa (prioridad) o fallback a detección 
                const tipoId = catToTipoId[categoriaActiva] || getProductTypeId(producto);

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
      </div >
    </div >
  );
};

export default ProductsSection;