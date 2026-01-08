'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogsService } from '@/services/catalogsService';
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS, fetchPizzaDescriptions } from '@/services/orderService';
import { fetchIngredientes, fetchTamanosPizzas } from '@/services/pricesService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';
import ProductModal from '@/components/ui/ProductModal';
import PaymentModal from '@/components/ui/PaymentModal';
import AddressSelectionModal from '@/components/ui/AddressSelectionModal';
import DeliveryPaymentModal from '@/components/ui/DeliveryPaymentModal';
import { ModalPaquete1, ModalPaquete2, ModalPaquete3 } from '@/components/ui/PaquetesModal';
import CustomPizzaModal from '@/components/ui/CustomPizzaModal';
import { MdComment } from "react-icons/md";

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
  const router = useRouter();
  const initialCartFromUrl = decodeCartFromUrl();

  // Estados del componente
  const {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    agregarPizzaCustom,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  } = useCart(initialCartFromUrl);

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
  const [descripcionesPizzas, setDescripcionesPizzas] = useState([]);
  const [categorias] = useState(CATEGORIAS);
  const [categoriaActiva, setCategoriaActiva] = useState('pizzas');
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tipoServicio, setTipoServicio] = useState(0);
  const [pagos, setPagos] = useState([]);
  const [modalPagosAbierto, setModalPagosAbierto] = useState(false);
  const [mesa, setMesa] = useState('');
  const [nombreClie, setNombreClie] = useState('');
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(null);
  const [modalDireccionAbierto, setModalDireccionAbierto] = useState(false);
  const [modalPagoDomicilioAbierto, setModalPagoDomicilioAbierto] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [modalComentarios, setModalComentarios] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);
  const [modalPaquete1, setModalPaquete1] = useState(false);
  const [modalPaquete2, setModalPaquete2] = useState(false);
  const [modalPaquete3, setModalPaquete3] = useState(false);
  const [modalCustomPizza, setModalCustomPizza] = useState(false);
  const [ingredientes, setIngredientes] = useState([]);
  const [tamanosPizzas, setTamanosPizzas] = useState([]);
  const [grupoRectangularIncompleto, setGrupoRectangularIncompleto] = useState(false);
  const [grupoBarraMagnoIncompleto, setGrupoBarraMagnoIncompleto] = useState(false);

  // Estado para auto-selección de tamaño (pizzas y mariscos)
  const [ultimoTamanoSeleccionado, setUltimoTamanoSeleccionado] = useState(null);
  const [usarTamanoAutomatico, setUsarTamanoAutomatico] = useState(false);

  // Efecto para verificar id_caja y cargar datos

  useEffect(() => {
    const hayRectangulares = orden.some(item => item.tipoId === 'id_rec');
    const cantidadTotalRectangulares = orden.reduce((acc, item) => {
      if (item.tipoId === 'id_rec') {
        return acc + item.cantidad;
      }
      return acc;
    }, 0);

    // Si hay rectangulares en el carrito y no son multiplos de 4, entonces grupo incompleto
    if (hayRectangulares && cantidadTotalRectangulares % 4 !== 0) {
      setGrupoRectangularIncompleto(true);
    } else {
      setGrupoRectangularIncompleto(false);
    }
  }, [orden]);


  useEffect(() => {
    const tiposRevisar = ['id_barr', 'id_magno'];
    let hayIncompleto = false;

    for (const tipo of tiposRevisar) {
      const hayProducto = orden.some(item => item.tipoId === tipo);
      const cantidadTotal = orden.reduce((acc, item) => {
        if (item.tipoId === tipo) {
          return acc + item.cantidad;
        }
        return acc;
      }, 0);

      if (hayProducto && cantidadTotal % 2 !== 0) {
        hayIncompleto = true;
        break;
      }
    }
    setGrupoBarraMagnoIncompleto(hayIncompleto);
  }, [orden]);


  useEffect(() => {
    const checkAndRedirect = async () => {
      const idCaja = localStorage.getItem('id_caja');
      if (!idCaja) {
        setTimeout(() => {
          router.push('/caja');
        }, 0); // Un delay de 0 lo pone al final de la cola de tareas actuales
        return; // Detener la ejecución de este efecto si nos vamos
      }

      // Si hay id_caja, procedemos a cargar los datos
      try {
        setLoading(true);
        const [productosData, clientesData, descripcionesData, ingredientesData, tamanosData] = await Promise.all([
          fetchProductosPorCategoria(),
          catalogsService.getNombresClientes(),
          fetchPizzaDescriptions(),
          fetchIngredientes(),
          fetchTamanosPizzas()
        ]);

        if (descripcionesData) {
          setDescripcionesPizzas(descripcionesData);
        }

        setProductos(productosData);

        const opcionesClientes = clientesData.map(cliente => ({
          value: cliente.id_clie,
          label: cliente.nombre || cliente.razon_social || 'Nombre no disponible',
        }));
        setClientes(opcionesClientes);
        setIngredientes(ingredientesData || []);
        setTamanosPizzas(tamanosData || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    // Llamamos a la función asíncrona
    checkAndRedirect();

  }, [router]); // Asegura que el efecto se vuelva a ejecutar si 'router' cambia


  // --- El resto de tus funciones permanecen iguales ---
  // (handleEnviarOrden, handleConfirmarPagos, etc.)

  const handleEnviarOrden = async () => {
    // Validar que los grupos de Pizza Rectangular tengan exactamente 4 items
    const gruposRectangularesIncompletos = orden.some(item => item.tipoId === 'id_rec' && item.cantidad < 4);

    if (gruposRectangularesIncompletos) {
      alert('Debes completar 4 porciones para la pizza Rectangular. Cada grupo debe tener 4 items.');
      return;
    }

    if (tipoServicio === 2) { // Domicilio
      if (!clienteSeleccionado || !direccionSeleccionada) {
        setModalDireccionAbierto(true);
        return;
      }
    } else if (tipoServicio === 1) {
      if (pagos.length === 0) {
        setModalPagosAbierto(true);
        return;
      }
    } else if (tipoServicio === 3) { // Pedidos Especiales
      if (!clienteSeleccionado || !direccionSeleccionada || !fechaEntrega) {
        setModalDireccionAbierto(true);
        return;
      }
    } else if (tipoServicio === 0) {
      if (!mesa || mesa.trim() === '') {
        alert('Por favor, ingresa el número de mesa.');
        return;
      }
    }

    try {
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

      if (tipoServicio === 3) {
        datosExtra.id_cliente = clienteSeleccionado.value;
        datosExtra.id_direccion = direccionSeleccionada;
        datosExtra.fecha_entrega = fechaEntrega;
      }

      const payload = { orden, datosExtra, comentarios, tipoServicio, pagos };
      console.log('Enviando orden al backend (handleEnviarOrden):', JSON.stringify(payload, null, 2));

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagos);

      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setDireccionSeleccionada(null);
      setFechaEntrega(null);
      setTipoServicio(0);
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const handleConfirmarPagos = (pagosConfirmados) => {
    setPagos(pagosConfirmados);
    setModalPagosAbierto(false);

    if (tipoServicio === 3) {
      enviarOrdenEspecial(clienteSeleccionado, direccionSeleccionada, fechaEntrega, pagosConfirmados);
    } else {
      enviarOrdenConPagos(pagosConfirmados);
    }
  };

  const enviarOrdenConPagos = async (pagosConfirmados) => {
    try {
      const datosExtra = {};
      if (nombreClie.trim()) {
        datosExtra.nombreClie = nombreClie;
      }
      const payload = { orden, datosExtra, comentarios, tipoServicio, pagosConfirmados };
      console.log('Enviando orden al backend (enviarOrdenConPagos):', JSON.stringify(payload, null, 2));

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

  const enviarOrdenDomicilio = async (cliente, idDireccion, pagoData) => {
    try {
      const datosExtra = {
        id_cliente: cliente.value,
        id_direccion: idDireccion
      };
      // Convertir pagoData a array de pagos
      const pagosArray = pagoData ? [pagoData] : [];

      const payload = { orden, datosExtra, comentarios, tipoServicio, pagosArray };
      console.log('Enviando orden al backend (enviarOrdenDomicilio):', JSON.stringify(payload, null, 2));

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagosArray);
      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setDireccionSeleccionada(null);
      setFechaEntrega(null);
      setClienteSeleccionado(null);
      setTipoServicio(0);
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const enviarOrdenEspecial = async (cliente, idDireccion, fecha, pagosConfirmados = []) => {
    try {
      const datosExtra = {
        id_cliente: cliente.value,
        id_direccion: idDireccion,
        fecha_entrega: fecha
      };
      const payload = { orden, datosExtra, comentarios, tipoServicio, pagosConfirmados };
      console.log('Enviando orden al backend (enviarOrdenEspecial):', JSON.stringify(payload, null, 2));

      await enviarOrdenAPI(orden, datosExtra, comentarios, tipoServicio, pagosConfirmados);
      limpiarCarrito();
      setComentarios('');
      setPagos([]);
      setMesa('');
      setNombreClie('');
      setDireccionSeleccionada(null);
      setFechaEntrega(null);
      setClienteSeleccionado(null);
      setTipoServicio(0);
    } catch (error) {
      console.error('Error al enviar la orden:', error);
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
  };

  const categoriasConModal = ['pizzas', 'refrescos', 'mariscos'];
  const categoriasConAutoTamano = ['pizzas', 'mariscos'];

  const handleProductoClick = (producto, tipoId) => {
    if (categoriasConModal.includes(categoriaActiva)) {
      const productosCategoria = productos[categoriaActiva];
      const variantes = productosCategoria.filter(p => p.nombre === producto.nombre);

      // Si es pizza o mariscos y hay tamaño guardado y debe usar automático
      if (categoriasConAutoTamano.includes(categoriaActiva) && ultimoTamanoSeleccionado && usarTamanoAutomatico) {
        // Buscar la variante que coincida con el tamaño guardado
        const varianteConTamano = variantes.find(v => {
          const tamano = v.subcategoria || v.tamano || v.tamaño;
          return tamano === ultimoTamanoSeleccionado.tamano;
        });

        if (varianteConTamano) {
          const tipoIdVariante = Object.keys(varianteConTamano).find(key => key.startsWith('id_'));
          agregarAlCarrito(varianteConTamano, tipoIdVariante);
          setUsarTamanoAutomatico(false); // Próxima vez mostrará modal
          return;
        }
      }

      // Mostrar modal normalmente
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

    // Guardar tamaño solo para pizzas y mariscos
    if (categoriasConAutoTamano.includes(categoriaActiva)) {
      const tamano = variante.subcategoria || variante.tamano || variante.tamaño;
      setUltimoTamanoSeleccionado({ tamano, tipoId });
      setUsarTamanoAutomatico(true); // Próxima vez usará este tamaño
    }
  };

  const handleConfirmarPaquete1 = () => {
    agregarPaquete({
      numeroPaquete: 1,
      precio: 295,
      detallePaquete: "4,8",
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
      detallePaquete: pizzasSeleccionadas.join(','),
      idRefresco: 17
    });
    setModalPaquete3(false);
  };

  const handleConfirmarCustomPizza = (customPizzaData) => {
    // Get ingredient names for display
    const ingredientesNombres = customPizzaData.ingredientes
      .map(idIng => {
        const ing = ingredientes.find(i => i.id_ingrediente === idIng);
        return ing ? ing.nombre : '';
      })
      .filter(nombre => nombre !== '');

    agregarPizzaCustom({
      ...customPizzaData,
      ingredientesNombres
    });
    setModalCustomPizza(false);
  };

  const handleConfirmarDireccion = (cliente, idDireccion, fecha = null) => {
    setClienteSeleccionado(cliente);
    setDireccionSeleccionada(idDireccion);
    if (fecha) setFechaEntrega(fecha);
    setModalDireccionAbierto(false);

    if (tipoServicio === 2) {
      // Para domicilio, abrir modal de pago
      setModalPagoDomicilioAbierto(true);
    } else if (tipoServicio === 3) {
      // Para pedidos especiales, ahora pedimos pago (anticipo)
      setModalPagosAbierto(true);
    }
  };

  const handleConfirmarPagoDomicilio = (pagoData) => {
    setModalPagoDomicilioAbierto(false);
    enviarOrdenDomicilio(clienteSeleccionado, direccionSeleccionada, pagoData);
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

    // Multiplicar por 4 el precio de las rectangulares para mostrar
    if (categoriaActiva === 'rectangular') {
      return productosCategoria.map(producto => ({
        ...producto,
        precio: parseFloat(producto.precio) * 4
      }));
    }

    if (categoriaActiva === 'barra' || categoriaActiva === 'magno') {
      return productosCategoria.map(producto => ({
        ...producto,
        precio: parseFloat(producto.precio) * 2
      }));
    }


    return productosCategoria;
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl">Verificando acceso...</p>
      </div>
    );
  }

  // Renderizado normal del componente
  return (
    <div className="max-w-full mx-auto p-4 bg-gray-100 min-h-screen flex flex-col">
      {/* ... Resto del JSX del componente ... */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black">Punto de Venta</h1>
        </div>
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
          <button
            onClick={() => setModalCustomPizza(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors shadow"
          >
            Por Ingrediente
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
          deshabilitarCategorias={grupoRectangularIncompleto || grupoBarraMagnoIncompleto}
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

      {/* Modales JSX ... */}
      {modalAbierto && (
        <ProductModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          nombreProducto={productoSeleccionado}
          variantes={variantesProducto}
          onSeleccionar={handleSeleccionarVariante}
          descripcion={descripcionesPizzas.find(d => d.nombre === productoSeleccionado)?.descripcion}
        />
      )}

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
        hamburguesas={productos.hamburguesas.filter(h => h.nombre.toLowerCase().includes('sencilla'))}
        alitas={productos.alitas}
      />

      <ModalPaquete3
        isOpen={modalPaquete3}
        onClose={() => setModalPaquete3(false)}
        onConfirmar={handleConfirmarPaquete3}
        pizzas={productos.pizzas}
      />

      <PaymentModal
        isOpen={modalPagosAbierto}
        onClose={() => setModalPagosAbierto(false)}
        total={total}
        onConfirm={handleConfirmarPagos}
        allowPartial={tipoServicio === 3}
      />

      <AddressSelectionModal
        isOpen={modalDireccionAbierto}
        onClose={() => setModalDireccionAbierto(false)}
        onConfirm={handleConfirmarDireccion}
        clientes={clientes}
        clienteSeleccionado={clienteSeleccionado}
        onClienteChange={setClienteSeleccionado}
        onClienteCreado={(nuevoCliente) => {
          setClientes(prev => [...prev, nuevoCliente]);
        }}
        askForDate={tipoServicio === 3}
      />

      <DeliveryPaymentModal
        isOpen={modalPagoDomicilioAbierto}
        onClose={() => setModalPagoDomicilioAbierto(false)}
        total={total}
        onConfirm={handleConfirmarPagoDomicilio}
      />

      <CustomPizzaModal
        isOpen={modalCustomPizza}
        onClose={() => setModalCustomPizza(false)}
        tamanos={tamanosPizzas}
        ingredientes={ingredientes}
        onConfirmar={handleConfirmarCustomPizza}
      />
    </div>
  );
};

export default POS;