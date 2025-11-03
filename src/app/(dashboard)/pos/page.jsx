'use client';

import { useState, useEffect } from 'react';
import { catalogsService } from '@/services/catalogsService'; 
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS } from '@/services/orderService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';
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
    paquete1: [],
    paquete2: [],
    paquete3: [],
    magno: [],
    pizzas: []
  });
  const [categorias] = useState(CATEGORIAS);
  const [categoriaActiva, setCategoriaActiva] = useState('pizzas');
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

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

  // Define las subcategorías por categoría
  const subcategoriasPorCategoria = {
    'pizzas': ['Chica', 'Mediana', 'Grande', 'Familiar'],
    'refrescos': ['355ml', '600ml', '2L'],
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
    setSubcategoriaActiva(null);
  };

  const productosFiltrados = () => {
    const productosCategoria = productos[categoriaActiva] || [];
    
    if (!subcategoriaActiva) {
      return productosCategoria;
    }
    
    return productosCategoria.filter(producto => 
      producto.subcategoria === subcategoriaActiva || 
      producto.tamano === subcategoriaActiva ||
      producto.tamaño === subcategoriaActiva
    );
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-black">Punto de Venta</h1>
        <div className="w-1/3">
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
          subcategorias={subcategoriasPorCategoria[categoriaActiva] || []}
          subcategoriaActiva={subcategoriaActiva}
          onSubcategoriaChange={setSubcategoriaActiva}
          productos={productosFiltrados()}
          onAddToCart={agregarAlCarrito}
        />
      </div>
    </div>
  );
};

export default POS;