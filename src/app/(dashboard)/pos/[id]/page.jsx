"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchProductosPorCategoria,
  fetchDetalleVenta,
  actualizarPedidoCocina,
  CATEGORIAS,
} from "@/services/orderService";
import { useCartEdit } from "@/hooks/useCartEdit";
import CartSection from "@/components/ui/CartSection";
import ProductsSection from "@/components/ui/ProductsSection";
import Link from "next/link";
import {
  ModalPaquete1,
  ModalPaquete2,
  ModalPaquete3,
} from "@/components/ui/PaquetesModal";
import CustomPizzaModal from "@/components/ui/CustomPizzaModal";
import PDFViewerModal from "@/components/ui/PDFViewerModal";
import TicketPDF from "@/components/ui/TicketPDF";
import { pdf } from '@react-pdf/renderer';
import { MdComment, MdArrowBack, MdPrint } from "react-icons/md";
import { fetchIngredientes, fetchTamanosPizzas } from '@/services/pricesService';
import { getProductTypeId } from '@/utils/productUtils';
import ProductModal from "@/components/ui/ProductModal";



const POSEdit = () => {
  const params = useParams();
  const router = useRouter();
  const idVenta = params.id;

  // Estados principales
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [loading, setLoading] = useState(true);
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
    pizzas: [],
  });

  // Estados para modales de paquetes y custom pizza
  const [modalPaquete1, setModalPaquete1] = useState(false);
  const [modalPaquete2, setModalPaquete2] = useState(false); // Fix overlap issues by putting this here if needed, but wait, state is further down.
  const [modalPaquete3, setModalPaquete3] = useState(false);
  const [modalCustomPizza, setModalCustomPizza] = useState(false);

  // Estados para datos de custom pizza y validaciones
  const [ingredientes, setIngredientes] = useState([]);
  const [tamanosPizzas, setTamanosPizzas] = useState([]);
  const [grupoRectangularIncompleto, setGrupoRectangularIncompleto] = useState(false);
  const [grupoBarraMagnoIncompleto, setGrupoBarraMagnoIncompleto] = useState(false);

  // Estado para auto-selección de tamaño (pizzas y mariscos)
  const [ultimoTamanoSeleccionado, setUltimoTamanoSeleccionado] = useState(null);
  const [usarTamanoAutomatico, setUsarTamanoAutomatico] = useState(false);

  // Estado para impresión
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    actualizarCantidad,
    eliminarDelCarrito,
    getPayloadActualizacion,
    cargarProductosOriginales,
    statusPrincipal,
    setStatusPrincipal,
    toggleQueso,
    agregarPizzaCustom
  } = useCartEdit();

  const [categorias] = useState(CATEGORIAS);
  const [categoriaActiva, setCategoriaActiva] = useState("pizzas");

  // Estados para tipo de servicio (interno para lógica de productos)
  const [tipoServicio, setTipoServicio] = useState(0);

  // Estados para comentarios
  const [comentarios, setComentarios] = useState("");
  const [modalComentarios, setModalComentarios] = useState(false);



  // Estados para el modal de productos
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);





  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [detalleData, productosData, ingredientesData, tamanosData] = await Promise.all([
          fetchDetalleVenta(idVenta),
          fetchProductosPorCategoria(),
          fetchIngredientes(),
          fetchTamanosPizzas()
        ]);

        console.log("Detalle de venta recibido:", detalleData);

        setDetalleVenta(detalleData);
        setProductos(productosData);
        setComentarios(detalleData.comentarios || "");
        setStatusPrincipal(detalleData.status);

        // Guardar ingredientes y tamaños
        setIngredientes(ingredientesData || []);
        setTamanosPizzas(tamanosData || []);

        // Cargar productos originales
        if (detalleData.productos && Array.isArray(detalleData.productos)) {
          // Pasamos ingredientesData para que pueda mapear nombres de custom pizzas
          cargarProductosOriginales(detalleData.productos, productosData, ingredientesData || []);
        } else {
          console.warn("No se encontraron productos en el detalle de venta");
          cargarProductosOriginales([], productosData, ingredientesData || []);
        }


      } catch (error) {
        console.error("Error al cargar datos:", error);
        alert("Error al cargar el detalle del pedido");
      } finally {
        setLoading(false);
      }
    };

    if (idVenta) {
      cargarDatos();
    }
  }, [idVenta]);

  // Efecto para verificar grupos incompletos (Portado de POS Creation)
  useEffect(() => {
    const hayRectangulares = orden.some(item => item.tipoId === 'id_rec');
    // Calcular total de porciones/slices reales
    // En POS Edit, item.cantidad puede ser la cantidad de grupos si ya está agrupado,
    // o cantidad de items. Dependiendo de cómo lo maneje useCartEdit.
    // useCartEdit maneja grupos.
    const cantidadTotalRectangulares = orden.reduce((acc, item) => {
      if (item.tipoId === 'id_rec') {
        if (item.productos && Array.isArray(item.productos)) {
          // Si tiene subproductos, contar sus cantidades
          // OJO: En useCartEdit, item.cantidad es la cantidad de GRUPOS si está bien formado.
          // Pero necesitamos verificar slices individuales.
          const slicesEnGrupo = item.productos.reduce((s, p) => p.status !== 0 ? s + p.cantidad : s, 0);
          return acc + slicesEnGrupo;
        }
        return acc + (item.status !== 0 ? item.cantidad : 0);
      }
      return acc;
    }, 0);

    // Si hay rectangulares y no son multiplos de 4
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
          if (item.productos && Array.isArray(item.productos)) {
            const slicesEnGrupo = item.productos.reduce((s, p) => p.status !== 0 ? s + p.cantidad : s, 0);
            return acc + slicesEnGrupo;
          }
          return acc + (item.status !== 0 ? item.cantidad : 0);
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

  const handleActualizarPedido = async () => {
    // Validar grupos incompletos
    if (grupoRectangularIncompleto) {
      alert('Debes completar 4 porciones para cada pizza Rectangular.');
      return;
    }
    if (grupoBarraMagnoIncompleto) {
      alert('Debes completar 2 porciones para cada pizza Barra o Magno.');
      return;
    }

    // Ya no validamos servicio/pagos/cliente, asumimos que viene del backend y es readonly aquí.

    try {
      const items = getPayloadActualizacion();

      // Si el status principal es 2 (Listo), cambiarlo a 1 (En preparación)
      const nuevoStatusPrincipal = statusPrincipal === 2 ? 1 : statusPrincipal;

      // Mantener datos originales del servicio (readonly)
      const payload = {
        id_suc: detalleVenta.id_suc || 1,
        total: total,
        comentarios: comentarios.trim() || null,
        status: nuevoStatusPrincipal,
        tipo_servicio: detalleVenta.tipo_servicio, // Usar original
        items: items
      };

      // Pasar passthrough de datos originales si es necesario
      if (detalleVenta.mesa) payload.mesa = detalleVenta.mesa;
      if (detalleVenta.nombreClie) payload.nombreClie = detalleVenta.nombreClie;
      if (detalleVenta.cliente) payload.id_cliente = detalleVenta.cliente;
      if (detalleVenta.id_direccion) payload.id_direccion = detalleVenta.id_direccion;

      // Nota: Si el backend requiere "pagos" para "Llevar", tendremos que enviarlos de vuelta.
      // Asumiremos que el backend no borra pagos si no se mandan en update, o que fetchDetalleVenta trae pagos y aquí los reenvíamos.
      // Si fetchDetalleVenta NO trae array de pagos, esto podría ser un problema si el backend espera recibirlos siempre.
      // Por ahora enviaremos "pagos: []" o lo que tengamos, pero como quitamos el estado `pagos`,
      // enviaremos vacío o null. Dependerá de la lógica del backend "actualizarPedidoCocina".
      // Si actualiza solo status/items, perfecto.

      // Mostrar en consola lo que se envía al backend
      console.log("═══════════════════════════════════════════════════════");
      console.log("📤 ENVIANDO ACTUALIZACIÓN AL BACKEND - POS EDIT (PRODUCT ONLY)");
      console.log("═══════════════════════════════════════════════════════");
      console.log("🆔 ID Venta:", idVenta);
      console.log("📦 Tipo de Servicio (Original):", detalleVenta.tipo_servicio);
      console.log("💰 Total:", total);
      console.log("📋 Items enviados:", items.length);
      console.log(JSON.stringify(payload, null, 2));
      console.log("═══════════════════════════════════════════════════════\n");

      await actualizarPedidoCocina(idVenta, payload);

      alert("Pedido actualizado exitosamente");
      router.push("/pos");
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      alert(error.message || "Hubo un error al actualizar el pedido.");
    }
  };

  const handleConfirmarPagos = (pagosConfirmados) => {
    setPagos(pagosConfirmados);
    setModalPagosAbierto(false);
  };

  const handleConfirmarDireccion = (cliente, idDireccion) => {
    setClienteSeleccionado(cliente);
    setDireccionSeleccionada(idDireccion);
    setModalDireccionAbierto(false);
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
  };

  // Categorías que requieren modal
  const categoriasConModal = ["pizzas", "refrescos", "mariscos"];
  const categoriasConAutoTamano = ['pizzas', 'mariscos']; // Para auto-selección

  const handleProductoClick = (producto, tipoId) => {
    if (categoriasConModal.includes(categoriaActiva)) {
      const productosCategoria = productos[categoriaActiva];
      const variantes = productosCategoria.filter(
        (p) => p.nombre === producto.nombre
      );

      // Lógica de Auto-Tamaño
      if (categoriasConAutoTamano.includes(categoriaActiva) && ultimoTamanoSeleccionado && usarTamanoAutomatico) {
        const varianteConTamano = variantes.find(v => {
          const tamano = v.subcategoria || v.tamano || v.tamaño;
          return tamano === ultimoTamanoSeleccionado.tamano;
        });

        if (varianteConTamano) {
          const tipoIdVariante = getProductTypeId(varianteConTamano);
          agregarAlCarrito(varianteConTamano, tipoIdVariante);
          setUsarTamanoAutomatico(false);
          return;
        }
      }

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
      setUsarTamanoAutomatico(true);
    }
  };

  // Handlers para los paquetes
  const handleConfirmarPaquete1 = () => {
    agregarPaquete({
      numeroPaquete: 1,
      precio: 295,
      detallePaquete: "4,8",
      idRefresco: 17,
    });
    setModalPaquete1(false);
  };

  const handleConfirmarPaquete2 = (seleccion) => {
    agregarPaquete({
      numeroPaquete: 2,
      precio: 265,
      idHamb: seleccion.tipo === "hamburguesa" ? seleccion.idProducto : null,
      idAlis: seleccion.tipo === "alitas" ? seleccion.idProducto : null,
      idPizza: seleccion.idPizza,
      idRefresco: 17,
    });
    setModalPaquete2(false);
  };

  const handleConfirmarPaquete3 = (pizzasSeleccionadas) => {
    agregarPaquete({
      numeroPaquete: 3,
      precio: 395,
      detallePaquete: pizzasSeleccionadas.join(","),
      idRefresco: 17,
    });
    setModalPaquete3(false);
  };

  const handleConfirmarCustomPizza = (customPizzaData) => {
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

  const handleImprimirTicket = async () => {
    if (!detalleVenta) return;

    // Construir objeto orden temporal para impresión
    const ordenImpresion = {
      orden: orden,
      total: total,
      datosExtra: {
        nombreClie: nombreClie,
        mesa: mesa,
        id_cliente: clienteSeleccionado?.value,
        id_direccion: direccionSeleccionada,
        fecha_entrega: detalleVenta.fecha_entrega
      },
      cliente: clienteSeleccionado ? { ...clienteSeleccionado, nombre: clienteSeleccionado.label } : null,
      tipoServicio: tipoServicio,
      comentarios: comentarios,
      folio: idVenta,
      fecha: new Date().toISOString()
    };

    try {
      const blob = await pdf(
        <TicketPDF
          orden={ordenImpresion.orden}
          total={ordenImpresion.total}
          datosExtra={ordenImpresion.datosExtra}
          fecha={ordenImpresion.fecha}
          cliente={ordenImpresion.cliente}
          tipoServicio={ordenImpresion.tipoServicio}
          comentarios={ordenImpresion.comentarios}
          folio={ordenImpresion.folio}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);
    } catch (error) {
      console.error("Error generando PDF:", error);
    }
  };

  const procesarProductos = () => {
    const productosCategoria = productos[categoriaActiva] || [];

    if (categoriasConModal.includes(categoriaActiva)) {
      const nombresUnicos = {};
      productosCategoria.forEach((producto) => {
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
        <p className="text-xl">Cargando pedido...</p>
      </div>
    );
  }

  if (!detalleVenta) {
    return (
      <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600">No se pudo cargar el pedido</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/pos" className="text-gray-600 hover:text-gray-800">
            <MdArrowBack className="text-2xl" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">
              Editar Pedido #{idVenta}
            </h1>
            <p className="text-sm text-gray-600">
              {detalleVenta.sucursal} -
              <span
                className={`ml-2 font-semibold ${detalleVenta.status === 0
                  ? "text-gray-400"
                  : detalleVenta.status === 1
                    ? "text-yellow-400"
                    : "text-green-600"
                  }`}
              >
                {detalleVenta.status_texto}
              </span>
            </p>
          </div>
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
          <button
            onClick={() => setModalCustomPizza(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors shadow"
          >
            Por Ingrediente
          </button>
          <button
            onClick={handleImprimirTicket}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors ml-2"
            title="Reimprimir ticket"
          >
            <MdPrint size={24} />
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
          onEnviarOrden={handleActualizarPedido}
          comentarios={comentarios}
          onAbrirComentarios={() => setModalComentarios(true)}
          hideServiceSelection={true}
          esEdicion={true}
          textoBoton="Actualizar Pedido"
          onToggleQueso={toggleQueso}
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
              <h2 className="text-2xl font-bold text-gray-800">
                Comentarios del pedido
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Modifica las instrucciones especiales para este pedido (opcional)
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

      {/* Modal Custom Pizza */}
      {modalCustomPizza && (
        <CustomPizzaModal
          isOpen={modalCustomPizza}
          onClose={() => setModalCustomPizza(false)}
          onConfirm={handleConfirmarCustomPizza}
          ingredientes={ingredientes}
          tamanos={tamanosPizzas}
        />
      )}

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        pdfUrl={pdfUrl}
      />

    </div>
  );
};

export default POSEdit;
