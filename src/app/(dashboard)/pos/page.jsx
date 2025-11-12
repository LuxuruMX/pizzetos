'use client';

import { useState, useEffect } from 'react';
import { catalogsService } from '@/services/catalogsService'; 
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS } from '@/services/orderService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';
import ProductModal from '@/components/ui/ProductModal';
import Select from 'react-select';
import { PiPlusFill } from "react-icons/pi";
import Link from 'next/link';

const POS = () => {
  const [productos, setProductos] = useState({
    hamburguesas: [],
    alitas: [],
    costillas: [],
    spaguetty: [],
    papas: [],
    rectangular: [],
    barra: [],
    mariscos: [],
    refrescos: [],
    magno: [],
    pizzas: []
  });
  const [categorias] = useState(CATEGORIAS);
  const [categoriaActiva, setCategoriaActiva] = useState('pizzas');
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);

  const {
    orden,
    total,
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  } = useCart();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [productosData, clientesData] = await Promise.all([
          fetchProductosPorCategoria(),
          catalogsService.getNombresClientes() 
        ]);

        setProductos(productosData);

        const opcionesClientes = clientesData.map(cliente => ({
          value: cliente.id_clie,
          label: cliente.nombre || cliente.razon_social || 'Nombre no disponible',
        }));
        setClientes(opcionesClientes);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleEnviarOrden = async () => {
    if (!clienteSeleccionado) {
      alert('Por favor, selecciona un cliente antes de enviar la orden.');
      return;
    }
    const idCliente = clienteSeleccionado.value;
    if (idCliente == null || idCliente === '') {
      alert('El cliente seleccionado no tiene un ID válido.');
      console.error("Objeto clienteSeleccionado recibido:", clienteSeleccionado);
      return;
    }

    try {
      console.log("ID Cliente a enviar a la API:", idCliente);
      await enviarOrdenAPI(orden, idCliente);
      limpiarCarrito();
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
  };

  // Categorías que requieren modal
  const categoriasConModal = ['pizzas', 'refrescos', 'mariscos'];

  const handleProductoClick = (producto, tipoId) => {
    // Si es una categoría especial, abrir modal
    if (categoriasConModal.includes(categoriaActiva)) {
      const productosCategoria = productos[categoriaActiva];
      
      // Agrupar variantes por nombre
      const variantes = productosCategoria.filter(p => p.nombre === producto.nombre);
      
      setProductoSeleccionado(producto.nombre);
      setVariantesProducto(variantes);
      setModalAbierto(true);
    } else {
      // Para otras categorías, agregar directamente al carrito
      agregarAlCarrito(producto, tipoId);
    }
  };

  const handleSeleccionarVariante = (variante, tipoId) => {
    agregarAlCarrito(variante, tipoId);
    setModalAbierto(false);
  };

  const procesarProductos = () => {
    const productosCategoria = productos[categoriaActiva] || [];
    
    // Si es una categoría especial, agrupar por nombre
    if (categoriasConModal.includes(categoriaActiva)) {
      const nombresUnicos = {};
      productosCategoria.forEach(producto => {
        if (!nombresUnicos[producto.nombre]) {
          nombresUnicos[producto.nombre] = producto;
        }
      });
      return Object.values(nombresUnicos);
    }
    
    // Para otras categorías, devolver todos los productos
    return productosCategoria;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl">Cargando productos y clientes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black">Punto de Venta</h1>
        </div>

        {/* Sección de Paquetes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow">
            Paquete 1
          </button>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow">
            Paquete 2
          </button>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow">
            Paquete 3
          </button>
        </div>

        {/* Sección de Cliente */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
          <div className="flex items-center gap-2">
            <Link 
              href="/clientes/agregar" 
              className='text-yellow-400 text-4xl hover:text-yellow-500 transition-colors'
            >
              <PiPlusFill />
            </Link>
            <Select
              options={clientes}
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
              placeholder="Buscar y seleccionar cliente..."
              isClearable
              isSearchable
              className="w-full text-black"
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-1">
        <CartSection
          orden={orden}
          total={total}
          onUpdateQuantity={actualizarCantidad}
          onRemove={eliminarDelCarrito}
          onEnviarOrden={handleEnviarOrden}
        />
        
        <ProductsSection
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onCategoriaChange={handleCategoriaChange}
          productos={procesarProductos()}
          onProductoClick={handleProductoClick}
          mostrarPrecio={!categoriasConModal.includes(categoriaActiva)}
        />
      </div>

      {/* Modal para seleccionar tamaño */}
      {modalAbierto && (
        <ProductModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          nombreProducto={productoSeleccionado}
          variantes={variantesProducto}
          onSeleccionar={handleSeleccionarVariante}
        />
      )}
    </div>
  );
};

export default POS;