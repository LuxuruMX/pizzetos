'use client';

import { useState, useEffect } from 'react';
import { catalogsService } from '@/services/catalogsService';
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS } from '@/services/orderService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';
import ProductModal from '@/components/ui/ProductModal';
import PaymentModal from '@/components/ui/PaymentModal';
import AddressSelectionModal from '@/components/ui/AddressSelectionModal';
import { ModalPaquete1, ModalPaquete2, ModalPaquete3 } from '@/components/ui/PaquetesModal';
import { MdComment } from "react-icons/md";

// Función para decodificar el carrito desde la URL
const decodeCartFromUrl = () => {
  if (typeof window !== 'undefined' && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedCart = urlParams.get('cart');
    try {
      if (encodedCart) {
        const decodedString = decodeURIComponent(escape(atob(encodedCart)));
        const parsed = JSON.parse(decodedString);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error al decodificar el carrito desde la URL:', e);
    }
  }
  return [];
};

const POS = () => {
  const initialCartFromUrl = decodeCartFromUrl();

  const {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  } = useCart(initialCartFromUrl); // Pasa el carrito inicial aquí

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

  // Estado para tipo de servicio y pagos
  const [tipoServicio, setTipoServicio] = useState(0);
  const [pagos, setPagos] = useState([]);
  const [modalPagosAbierto, setModalPagosAbierto] = useState(false);
  const [mesa, setMesa] = useState('');
  const [nombreClie, setNombreClie] = useState('');

  // Estados para dirección de domicilio
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [modalDireccionAbierto, setModalDireccionAbierto] = useState(false);

  // Estados para comentarios
  const [comentarios, setComentarios] = useState('');
  const [modalComentarios, setModalComentarios] = useState(false);

  // Estados para el modal de productos
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);

  // Estados para modales de paquetes
  const [modalPaquete1, setModalPaquete1] = useState(false);
  const [modalPaquete2, setModalPaquete2] = useState(false);
  const [modalPaquete3, setModalPaquete3] = useState(false);

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

  // El modal de dirección se abre manualmente al enviar orden, no automáticamente

  const handleEnviarOrden = async () => {
    // Validación por tipo de servicio
    if (tipoServicio === 2) { // Domicilio
      // Abrir modal si no hay cliente o dirección seleccionada
      if (!clienteSeleccionado || !direccionSeleccionada) {
        setModalDireccionAbierto(true);
        return;
      }
    } else if (tipoServicio === 1) { // Para Llevar
      // Validar pagos si es necesario (aunque el modal se abre si no hay pagos)
      if (pagos.length === 0) {
        setModalPagosAbierto(true);
        return;
      }
    } else if (tipoServicio === 0) { // Comer Aquí
      if (!mesa || mesa.trim() === '') {
        alert('Por favor, ingresa el número de mesa.');
        return;
      }
    }

    try {
      // Preparar datos adicionales según tipo de servicio
      const datosExtra = {};

      if (tipoServicio === 0) {
        datosExtra.mesa = parseInt(mesa);
        if (nombreClie.trim()) {
          datosExtra.nombreClie = nombreClie;
        }
      }

      if (tipoServicio === 1) {
        if (nombreClie.trim()) {
          datosExtra.nombreClie = nombreClie;
        }
      }

      if (tipoServicio === 2) {
        datosExtra.id_cliente = clienteSeleccionado.value;
        datosExtra.id_direccion = direccionSeleccionada;
      }

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagos);

      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setDireccionSeleccionada(null);
      setTipoServicio(0); // Reset a Comedor
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const handleConfirmarPagos = (pagosConfirmados) => {
    setPagos(pagosConfirmados);
    setModalPagosAbierto(false);
    enviarOrdenConPagos(pagosConfirmados);
  };

  const enviarOrdenConPagos = async (pagosConfirmados) => {
    try {
      const datosExtra = {};

      // Incluir el nombre del cliente si está presente
      if (nombreClie.trim()) {
        datosExtra.nombreClie = nombreClie;
      }

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagosConfirmados);
      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setTipoServicio(0);
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const enviarOrdenDomicilio = async (cliente, idDireccion) => {
    try {
      const datosExtra = {
        id_cliente: cliente.value,
        id_direccion: idDireccion
      };

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagos);

      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setDireccionSeleccionada(null);
      setClienteSeleccionado(null);
      setTipoServicio(0); // Reset a Comedor
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
    if (categoriasConModal.includes(categoriaActiva)) {
      const productosCategoria = productos[categoriaActiva];
      const variantes = productosCategoria.filter(p => p.nombre === producto.nombre);

      setProductoSeleccionado(producto.nombre);
      setVariantesProducto(variantes);
      setModalAbierto(true);
    } else {
      agregarAlCarrito(producto, tipoId);
    }
  };

  const handleSeleccionarVariante = (variante, tipoId) => {
    agregarAlCarrito(variante, tipoId);
    setModalAbierto(false);
  };

  // Handlers para los paquetes
  const handleConfirmarPaquete1 = () => {
    agregarPaquete({
      numeroPaquete: 1,
      precio: 295,
      detallePaquete: "4,8", // IDs de las pizzas
      idRefresco: 17
    });
    setModalPaquete1(false);
  };

  const handleConfirmarPaquete2 = (seleccion) => {
    agregarPaquete({
      numeroPaquete: 2,
      precio: 265,
      idHamb: seleccion.tipo === 'hamburguesa' ? seleccion.idProducto : null,
      idAlis: seleccion.tipo === 'alitas' ? seleccion.idProducto : null,
      idPizza: seleccion.idPizza,
      idRefresco: 17
    });
    setModalPaquete2(false);
  };

  const handleConfirmarPaquete3 = (pizzasSeleccionadas) => {
    agregarPaquete({
      numeroPaquete: 3,
      precio: 395,
      detallePaquete: pizzasSeleccionadas.join(','), // IDs de las 3 pizzas
      idRefresco: 17
    });
    setModalPaquete3(false);
  };

  const handleConfirmarDireccion = (cliente, idDireccion) => {
    setClienteSeleccionado(cliente);
    setDireccionSeleccionada(idDireccion);
    setModalDireccionAbierto(false);
    // Enviar la orden inmediatamente
    enviarOrdenDomicilio(cliente, idDireccion);
  };

  const procesarProductos = () => {
    const productosCategoria = productos[categoriaActiva] || [];

    if (categoriasConModal.includes(categoriaActiva)) {
      const nombresUnicos = {};
      productosCategoria.forEach(producto => {
        if (!nombresUnicos[producto.nombre]) {
          nombresUnicos[producto.nombre] = producto;
        }
      });
      return Object.values(nombresUnicos);
    }

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
    <div className="max-w-full mx-auto p-4 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black">Punto de Venta</h1>
        </div>

        {/* Sección de Paquetes */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setModalPaquete1(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow"
          >
            Paquete 1
          </button>
          <button
            onClick={() => setModalPaquete2(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow"
          >
            Paquete 2
          </button>
          <button
            onClick={() => setModalPaquete3(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-4 rounded-lg transition-colors shadow"
          >
            Paquete 3
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <ProductsSection
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onCategoriaChange={handleCategoriaChange}
          productos={procesarProductos()}
          onProductoClick={handleProductoClick}
          mostrarPrecio={!categoriasConModal.includes(categoriaActiva)}
        />

        <CartSection
          orden={orden}
          total={total}
          onUpdateQuantity={actualizarCantidad}
          onRemove={eliminarDelCarrito}
          onEnviarOrden={handleEnviarOrden}
          comentarios={comentarios}
          onAbrirComentarios={() => setModalComentarios(true)}
          tipoServicio={tipoServicio}
          onTipoServicioChange={setTipoServicio}
          mesa={mesa}
          onMesaChange={setMesa}
          nombreClie={nombreClie}
          onNombreClieChange={setNombreClie}
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

      {/* Modal de Comentarios */}
      {modalComentarios && (
        <div className="fixed inset-0 bg-white/30 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <MdComment className="text-2xl text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Comentarios de la orden</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Agrega instrucciones especiales para esta orden (opcional)
            </p>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ejemplo: Sin cebolla, extra queso, bien cocida..."
              maxLength={255}
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="text-xs text-gray-500">
                {comentarios.length}/255 caracteres
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalComentarios(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalComentarios(false)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Paquetes */}
      <ModalPaquete1
        isOpen={modalPaquete1}
        onClose={() => setModalPaquete1(false)}
        onConfirmar={handleConfirmarPaquete1}
      />

      <ModalPaquete2
        isOpen={modalPaquete2}
        onClose={() => setModalPaquete2(false)}
        onConfirmar={handleConfirmarPaquete2}
        pizzas={productos.pizzas}
        hamburguesas={productos.hamburguesas}
        alitas={productos.alitas}
      />

      <ModalPaquete3
        isOpen={modalPaquete3}
        onClose={() => setModalPaquete3(false)}
        onConfirmar={handleConfirmarPaquete3}
        pizzas={productos.pizzas}
      />

      {/* Modal de Pagos */}
      <PaymentModal
        isOpen={modalPagosAbierto}
        onClose={() => setModalPagosAbierto(false)}
        total={total}
        onConfirm={handleConfirmarPagos}
      />

      {/* Modal de Dirección */}
      <AddressSelectionModal
        isOpen={modalDireccionAbierto}
        onClose={() => setModalDireccionAbierto(false)}
        onConfirm={handleConfirmarDireccion}
        clientes={clientes}
        clienteSeleccionado={clienteSeleccionado}
        onClienteChange={setClienteSeleccionado}
        onClienteCreado={(nuevoCliente) => {
          // Agregar el nuevo cliente a la lista
          setClientes(prev => [...prev, nuevoCliente]);
        }}
      />
    </div>
  );
};

export default POS;