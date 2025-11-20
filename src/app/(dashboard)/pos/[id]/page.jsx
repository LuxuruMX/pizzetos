"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { catalogsService } from "@/services/catalogsService";
import {
  fetchProductosPorCategoria,
  fetchDetalleVenta,
  actualizarPedidoCocina,
  CATEGORIAS,
} from "@/services/orderService";
import { useCartEdit } from "@/hooks/useCartEdit";
import CartSection from "@/components/ui/CartSection";
import ProductsSection from "@/components/ui/ProductsSection";
import ProductModal from "@/components/ui/ProductModal";
import {
  ModalPaquete1,
  ModalPaquete2,
  ModalPaquete3,
} from "@/components/ui/PaquetesModal";
import Select from "react-select";
import { MdComment, MdArrowBack } from "react-icons/md";
import Link from "next/link";

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

  const {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    actualizarCantidad,
    eliminarDelCarrito,
    getProductosModificados,
    cargarProductosOriginales,
    statusPrincipal,
    setStatusPrincipal,
  } = useCartEdit();

  const [categorias] = useState(CATEGORIAS);
  const [categoriaActiva, setCategoriaActiva] = useState("pizzas");
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estados para comentarios
  const [comentarios, setComentarios] = useState("");
  const [modalComentarios, setModalComentarios] = useState(false);

  // Estados para el modal de productos
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);

  // Estados para modales de paquetes
  const [modalPaquete1, setModalPaquete1] = useState(false);
  const [modalPaquete2, setModalPaquete2] = useState(false);
  const [modalPaquete3, setModalPaquete3] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [detalleData, productosData, clientesData] = await Promise.all([
          fetchDetalleVenta(idVenta), // <-- Asume que aquí viene detalleVenta.productos
          fetchProductosPorCategoria(),
          catalogsService.getNombresClientes(),
        ]);

        setDetalleVenta(detalleData);
        setProductos(productosData);
        setComentarios(detalleData.comentarios || "");
        setStatusPrincipal(detalleData.status);

        if (detalleData.productos && Array.isArray(detalleData.productos)) {
          cargarProductosOriginales(detalleData.productos); // Llama a la función del hook
        } else {
          console.warn(
            "detalleVenta.productos no encontrado o no es un array:",
            detalleData
          );
          setOrden([]); // Opcional: Limpiar carrito si no hay productos
        }

        const opcionesClientes = clientesData.map((cliente) => ({
          value: cliente.id_clie,
          label:
            cliente.nombre || cliente.razon_social || "Nombre no disponible",
        }));
        setClientes(opcionesClientes);

        const clienteEncontrado = opcionesClientes.find(
          (c) => c.label === detalleData.cliente
        );
        if (clienteEncontrado) {
          setClienteSeleccionado(clienteEncontrado);
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

  const handleActualizarPedido = async () => {
    if (!clienteSeleccionado) {
      alert("Por favor, selecciona un cliente antes de actualizar el pedido.");
      return;
    }

    try {
      const productosModificados = getProductosModificados();

      // Si el status principal es 2, cambiarlo a 1
      const nuevoStatusPrincipal = statusPrincipal === 2 ? 1 : statusPrincipal;

      await actualizarPedidoCocina(idVenta, {
        productos: productosModificados,
        status: nuevoStatusPrincipal,
        comentarios: comentarios.trim() || null,
      });

      alert("Pedido actualizado exitosamente");
      router.push("/pos"); // O redirigir a donde necesites
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      alert(error.message || "Hubo un error al actualizar el pedido.");
    }
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaActiva(categoria);
  };

  // Categorías que requieren modal
  const categoriasConModal = ["pizzas", "refrescos", "mariscos"];

  const handleProductoClick = (producto, tipoId) => {
    if (categoriasConModal.includes(categoriaActiva)) {
      const productosCategoria = productos[categoriaActiva];
      const variantes = productosCategoria.filter(
        (p) => p.nombre === producto.nombre
      );

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
    <div className="max-w-7xl mx-auto p-4 bg-gray-100 min-h-screen flex flex-col">
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
              {detalleVenta.cliente} - {detalleVenta.sucursal} -
              <span
                className={`ml-2 font-semibold ${
                  detalleVenta.status === 0
                    ? "text-red-600"
                    : detalleVenta.status === 1
                    ? "text-yellow-600"
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
        </div>

        {/* Sección de Cliente */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
          </label>
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
          onEnviarOrden={handleActualizarPedido}
          comentarios={comentarios}
          onAbrirComentarios={() => setModalComentarios(true)}
          esEdicion={true}
          textoBoton="Actualizar Pedido"
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
    </div>
  );
};

export default POSEdit;
