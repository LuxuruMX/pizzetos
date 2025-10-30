'use client';

import { useState, useEffect } from 'react';
import { catalogsService } from '@/services/catalogsService'; 
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS } from '@/services/orderService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';
import Select from 'react-select';

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
    // 1. Verificar que se haya seleccionado un cliente
    if (!clienteSeleccionado) {
      alert('Por favor, selecciona un cliente antes de enviar la orden.');
      return;
    }
    const idCliente = clienteSeleccionado.value;
    if (idCliente == null || idCliente === '') {
      alert('El cliente seleccionado no tiene un ID válido.');
      console.error("Objeto clienteSeleccionado recibido:", clienteSeleccionado); // Log adicional para debug
      return;
    }

    try {
      // 3. Ahora sí, usar el idCliente (que es clienteSeleccionado.value)
      console.log("ID Cliente a enviar a la API:", idCliente); // Log para confirmar valor
      await enviarOrdenAPI(orden, idCliente); // Pasar el ID del cliente a la función
      limpiarCarrito();
      // Opcional: Limpiar la selección del cliente después de enviar
      // setClienteSeleccionado(null);
      alert('Orden enviada correctamente.');
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
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
      {/* Contenedor para el título y el selector de cliente */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-black">Punto de Venta</h1>
        <div className="w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
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
          onCategoriaChange={setCategoriaActiva}
          productos={productos[categoriaActiva] || []}
          onAddToCart={agregarAlCarrito}
        />
      </div>
    </div>
  );
};

export default POS;