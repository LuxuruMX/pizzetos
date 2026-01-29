"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { IoReload } from "react-icons/io5";
import { FaEdit, FaTrash } from "react-icons/fa";
import api from "@/services/api";
import { MdOutlinePayments, MdPrint } from "react-icons/md";
import PaymentModal from "@/components/ui/PaymentModal";
import { pagarVenta, fetchProductosPorCategoria, fetchTicketDetalle } from "@/services/orderService";
import { catalogsService } from "@/services/catalogsService";
import CancellationModal from "@/components/ui/CancellationModal";
import { pdf } from '@react-pdf/renderer';
import TicketPDF from '@/components/ui/TicketPDF';
import PDFViewerModal from '@/components/ui/PDFViewerModal';
import { PRECIOS_ORILLA_QUESO } from '@/config/prices';
import toast from 'react-hot-toast';

// Función auxiliar para reconstruir la orden (adaptada de useCartEdit)
const reconstructOrderForTicket = (productosBackend, productosCache) => {
  // Helper para buscar precio en caché si no viene en el backend
  const findPrice = (nombre, categoria, size = null) => {
    if (!productosCache || !productosCache[categoria]) return 0;

    // Si tenemos tamaño, intentar filtrar por nombre y tamaño
    if (size) {
      // Normalizar nombres para comparación flexible
      const targetName = nombre.toLowerCase();
      const targetSize = size.toLowerCase();

      const match = productosCache[categoria].find(p => {
        const pName = p.nombre.toLowerCase();
        const pSize = (p.tamano || '').toLowerCase();
        return (pName === targetName || targetName.includes(pName)) && pSize === targetSize;
      });

      if (match) return parseFloat(match.precio);
    }

    // Fallback: buscar solo por nombre (primer coincidencia)
    const producto = productosCache[categoria].find(p => p.nombre === nombre || nombre.includes(p.nombre));
    return producto ? parseFloat(producto.precio) : 0;
  };

  // Helper para obtener precio de paquete
  const getPaquetePrice = (num) => {
    return num === 1 ? 295 : num === 2 ? 265 : num === 3 ? 395 : 0;
  };

  const newItems = [];
  const pizzasBySize = {}; // Objeto para agrupar pizzas: { 'Mediana': [prod1, prod2], 'Grande': [...] }

  productosBackend.forEach((prod, index) => {
    // 1. Manejo de PIZZAS y MARISCOS (Normales y Personalizadas)
    // Se unifican para que compartan la lógica de promociones (2x1) por tamaño
    if (prod.tipo === 'Pizza' || prod.tipo === 'Pizza Personalizada' || prod.tipo === 'Mariscos') {
      let size = 'Grande'; // Default
      let cleanName = prod.nombre;

      // Intentar extraer tamaño del nombre o propiedades
      if (prod.tamano) {
        size = prod.tamano;
      } else if (prod.detalles_ingredientes && prod.detalles_ingredientes.tamano) {
        size = prod.detalles_ingredientes.tamano;
      } else if (prod.nombre.includes(' - ')) {
        const parts = prod.nombre.split(' - ');
        size = parts[parts.length - 1];
        cleanName = parts.slice(0, parts.length - 1).join(' - ');
      }

      // Limpiar nombre si es personalizada
      if (prod.tipo === 'Pizza Personalizada') {
        cleanName = 'Personalizada';
        if (prod.detalles_ingredientes && prod.detalles_ingredientes.ingredientes) {
          // Opcional: Agregar ingredientes al nombre o guardarlos aparte
        }
      } else {
        // Quitar el tamaño del nombre si viene tipo "Hawaiana - Mediana" -> "Hawaiana"
        cleanName = cleanName.replace(` - ${size}`, '');
      }

      if (!pizzasBySize[size]) {
        pizzasBySize[size] = [];
      }

      // Buscar precio si falta
      let precio = prod.precio || findPrice(cleanName, 'pizzas', size);
      // Si no se encuentra, usar 0 por ahora

      pizzasBySize[size].push({
        ...prod,
        nombre: cleanName,
        tamano: size,
        ingredientesNombres: prod.tipo === 'Pizza Personalizada' && prod.detalles_ingredientes
          ? prod.detalles_ingredientes.ingredientes
          : [],
        conQueso: prod.con_queso || prod.conQueso,
        precioUnitario: precio,
        cantidad: prod.cantidad || 1,
        // Si el backend no envía subtotal, lo calcularemos en el grupo o estimado aquí
        subtotal: (precio * (prod.cantidad || 1)) || 0
      });

    }
    // 2. Manejo de PAQUETES
    else if (prod.tipo === 'Paquete') {
      const numPaquete = prod.nombre.includes('1') ? 1 : prod.nombre.includes('2') ? 2 : 3;

      // Prioridad: precio_base de DB > precioUnitario de DB > Hardcoded
      let precio = 0;
      if (prod.precio_base !== undefined && prod.precio_base !== null) {
        precio = parseFloat(prod.precio_base);
      } else if (prod.precioUnitario !== undefined && prod.precioUnitario !== null) {
        precio = parseFloat(prod.precioUnitario);
      } else {
        precio = getPaquetePrice(numPaquete);
      }

      let detallePaqueteStr = '';
      let refresco = '';
      let complemento = ''; // alitas
      let pizza = '';
      let pizzasArr = [];

      if (prod.detalles_ingredientes) {
        refresco = prod.detalles_ingredientes.refresco;

        if (prod.detalles_ingredientes.pizzas) {
          pizzasArr = prod.detalles_ingredientes.pizzas; // Array de nombres
          detallePaqueteStr = pizzasArr.join(', ');
        }

        if (numPaquete === 2) {
          pizza = pizzasArr[0] || '';
          complemento = prod.detalles_ingredientes.alitas || prod.detalles_ingredientes.complemento || '';
        }
      }

      newItems.push({
        id: `pkt_${index}`,
        tipoId: 'id_paquete',
        nombre: prod.nombre,
        cantidad: prod.cantidad,
        precioUnitario: precio,
        subtotal: precio * prod.cantidad,
        esPaquete: true,
        numeroPaquete: numPaquete,
        detallePaquete: detallePaqueteStr,
        nombresDetalle: {
          rectangular: detallePaqueteStr,
          pizzas: pizzasArr,
          pizza: pizza,
          complemento: complemento,
          refresco: refresco
        }
      });
    }
    // 3. Manejo de GRUPOS ESPECIALES (Rectangular, Barra, Magno)
    else if (['Rectangular', 'Barra', 'Magno'].includes(prod.tipo)) {
      const tipoId = prod.tipo === 'Rectangular' ? 'id_rec' : prod.tipo === 'Barra' ? 'id_barr' : 'id_magno';

      // Prioridad: precio_base de DB > precioUnitario de DB > Cache
      let precio = 0;
      if (prod.precio_base !== undefined && prod.precio_base !== null) {
        precio = parseFloat(prod.precio_base);
      } else if (prod.precioUnitario !== undefined && prod.precioUnitario !== null) {
        precio = parseFloat(prod.precioUnitario);
      } else {
        precio = findPrice(prod.tipo, prod.tipo.toLowerCase());
      }

      // Convertir especialidades (array strings) a productos (array objetos)
      let productosGrupo = [];
      if (prod.especialidades && Array.isArray(prod.especialidades)) {
        const counts = {};
        prod.especialidades.forEach(esp => {
          counts[esp] = (counts[esp] || 0) + 1;
        });
        productosGrupo = Object.keys(counts).map(key => ({
          nombre: key,
          cantidad: counts[key]
        }));
      }

      newItems.push({
        id: `grp_${index}`,
        tipoId: tipoId,
        nombre: prod.nombre,
        cantidad: prod.cantidad,
        subtotal: precio * prod.cantidad,
        productos: productosGrupo
      });
    }
    // 4. OTROS (Refrescos, complementos sueltos)
    else {
      let cat = 'refrescos';
      if (prod.tipo === 'Refresco') cat = 'refrescos';

      let precio = 0;
      if (prod.precio_base !== undefined && prod.precio_base !== null) {
        precio = parseFloat(prod.precio_base);
      } else if (prod.precioUnitario !== undefined && prod.precioUnitario !== null) {
        precio = parseFloat(prod.precioUnitario);
      } else {
        precio = prod.precio || findPrice(prod.nombre, cat);
      }

      newItems.push({
        id: `item_${index}`,
        tipoId: 'item_simple',
        nombre: prod.nombre,
        cantidad: prod.cantidad,
        precioUnitario: precio,
        subtotal: precio * prod.cantidad,
        tamano: prod.tamano || 'N/A'
      });
    }
  });

  // Agregar los grupos de pizzas formados
  Object.keys(pizzasBySize).forEach(size => {
    const pizzas = pizzasBySize[size];
    if (pizzas.length > 0) {
      const totalQty = pizzas.reduce((acc, p) => acc + p.cantidad, 0);

      const unidades = [];
      let costoTotalQueso = 0;

      pizzas.forEach(prod => {
        // 1. Obtener precio inicial (de DB o Unitario)
        let rawPrice = 0;
        if (prod.precio_base !== undefined && prod.precio_base !== null) {
          rawPrice = parseFloat(prod.precio_base);
        } else {
          rawPrice = parseFloat(prod.precioUnitario || prod.precio || 0);
        }

        let precioBase = rawPrice;
        let precioExtra = 0;

        // 2. Separar costo de Queso / Extras
        if (prod.conQueso) {
          const sizeName = prod.tamano;
          const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
            key => key.toLowerCase() === sizeName.toLowerCase()
          ) || sizeName;

          // Usar precio_extra de DB si existe, si no, fallback a config
          const extraPrecio = prod.precio_extra !== undefined
            ? parseFloat(prod.precio_extra)
            : (PRECIOS_ORILLA_QUESO[tamanoKey] || 0);

          precioExtra = extraPrecio;

          // Restar el extra si el precio parece incluirlo
          // (Heurística: si al restar queda > 0 o si usamos precio_base que venia "sucio")
          // Para seguridad, asumiremos que si trae queso, el rawPrice lo incluye.
          // Excepto si el rawPrice es muy bajo (menor al extra), lo cual indicaria error.

          if (rawPrice >= precioExtra) {
            precioBase = rawPrice - precioExtra;
          }
        }

        // Protección contra negativos
        if (precioBase < 0) precioBase = 0;

        costoTotalQueso += precioExtra * prod.cantidad;

        for (let i = 0; i < prod.cantidad; i++) {
          unidades.push({
            precio: precioBase
          });
        }
      });

      unidades.sort((a, b) => b.precio - a.precio);

      const pares = Math.floor(unidades.length / 2);
      const sobra = unidades.length % 2;
      let nuevoSubtotal = 0;
      let unitIndex = 0;

      for (let i = 0; i < pares; i++) {
        nuevoSubtotal += unidades[unitIndex].precio;
        unitIndex++;
        unitIndex++;
      }

      if (sobra > 0) {
        nuevoSubtotal += unidades[unitIndex].precio * 0.6;
        unitIndex++;
      }

      nuevoSubtotal += costoTotalQueso;

      // Si el cálculo da algo muy loco (ej. 0), fallback al original sumado
      const totalSubOriginal = pizzas.reduce((acc, p) => acc + p.subtotal, 0);
      if (nuevoSubtotal <= 0 && totalSubOriginal > 0) nuevoSubtotal = totalSubOriginal;

      newItems.push({
        tipoId: 'pizza_group',
        tamano: size,
        nombre: `Pizzas ${size}`,
        cantidad: totalQty,
        subtotal: nuevoSubtotal,
        productos: pizzas
      });
    }
  });

  return newItems;
};

export default function TodosPedidosPage() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("hoy");
  const [statusFiltro, setStatusFiltro] = useState(null);
  const [idSuc] = useState(null);
  const [modalPagosOpen, setModalPagosOpen] = useState(false);
  const [permisos, setPermisos] = useState(null);

  // Cached Catalogs
  const [productosCache, setProductosCache] = useState(null);
  const [clientesCache, setClientesCache] = useState(null);

  const [pedidoAPagar, setPedidoAPagar] = useState(null);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const router = useRouter();

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [p, c] = await Promise.all([
          fetchProductosPorCategoria(),
          catalogsService.getNombresClientes()
        ]);
        setProductosCache(p);
        setClientesCache(c);
      } catch (e) {
        console.error("Error loading ticket catalogs", e);
      }
    };
    loadCatalogs();
  }, []);

  const handlePrint = async (row) => {
    try {
      setLoading(true);

      // Usar caché o fallback
      let prods = productosCache;
      let clis = clientesCache;

      if (!prods || !clis) {
        try {
          const [p, c] = await Promise.all([
            fetchProductosPorCategoria(),
            catalogsService.getNombresClientes()
          ]);
          prods = p;
          clis = c;
          setProductosCache(p);
          setClientesCache(c);
        } catch (e) {
          console.error("Error fetching catalogs fallback", e);
          // Intentar continuar con lo que haya
          prods = prods || {};
          clis = clis || [];
        }
      }

      // 1. Obtener detalles completos
      const detalle = await fetchTicketDetalle(row.id_venta);

      // 2. Reconstruir orden
      const ordenTicket = reconstructOrderForTicket(detalle.productos, prods);

      let clienteObj = { nombre: 'No especificado', telefono: detalle.telefono || '' };

      if (detalle.cliente) {
        // Intentar ver si es un ID y buscarlo
        const encontrado = clis.find(c => c.id_clie === detalle.cliente);
        if (encontrado) {
          clienteObj = encontrado;
          // Si el detalle traía teléfono más fresco, usarlo, si no el del catálogo
          if (detalle.telefono) clienteObj.telefono = detalle.telefono;
        } else if (typeof detalle.cliente === 'string') {
          // Si no se encontró por ID, y es string, es el nombre directo
          clienteObj.nombre = detalle.cliente;
        }
      }

      // Fallbacks adicionales
      if (clienteObj.nombre === 'No especificado') {
        if (detalle.nombreClie) clienteObj.nombre = detalle.nombreClie;
        else if (detalle.nombre_cliente) clienteObj.nombre = detalle.nombre_cliente;
      }

      // Calcular total basado en los items reconstruidos para consistencia
      const calculatedTotal = ordenTicket.reduce((acc, item) => acc + item.subtotal, 0);

      // 4. Datos Extra
      let direccionCompleta = detalle.direccion_completa || '';

      // Si el backend devuelve un objeto 'direccion', lo formateamos
      if (detalle.direccion && typeof detalle.direccion === 'object') {
        const d = detalle.direccion;
        const parts = [];
        if (d.calle) parts.push(d.calle);
        if (d.numero) parts.push(`#${d.numero}`);
        if (d.cruzamientos) parts.push(`Cruz: ${d.cruzamientos}`);
        if (d.colonia) parts.push(`Col: ${d.colonia}`);
        if (d.referencia) parts.push(`Ref: ${d.referencia}`);
        // Agregar manzana y lote si existen
        if (d.manzana) parts.push(`Mz: ${d.manzana}`);
        if (d.lote) parts.push(`Lt: ${d.lote}`);

        if (parts.length > 0) {
          direccionCompleta = parts.join(', ');
        }
      }

      const datosExtra = {
        mesa: detalle.mesa,
        nombreClie: clienteObj.nombre, // Pasamos el nombre ya resuelto aquí tambien
        id_direccion: detalle.id_direccion,
        direccion_completa: direccionCompleta,
        telefono: clienteObj.telefono
      };

      // 5. Generar PDF
      const blob = await pdf(
        <TicketPDF
          orden={ordenTicket}
          total={calculatedTotal}
          datosExtra={datosExtra}
          fecha={detalle.fecha}
          cliente={clienteObj} // Pasamos el objeto resuelto
          tipoServicio={detalle.tipo_servicio}
          comentarios={detalle.comentarios}
          folio={detalle.id_venta}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);

    } catch (err) {
      console.error("Error al imprimir ticket:", err);
      toast.error("Error al generar el ticket. Consulta la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  };



  const fetchTodosPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = { filtro };

      if (statusFiltro !== null && statusFiltro !== "") {
        params.status = statusFiltro;
      }

      if (idSuc) {
        params.id_suc = idSuc;
      }

      const response = await api.get("/pos/pedidos-resumen", { params });

      setPedidos(response.data.pedidos);
    } catch (err) {
      setError(err.message || "Error al obtener los pedidos");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (product) => {
    router.push(`/pos/${product.id_venta}`);
  };

  const handleDelete = (row) => {
    setPedidoACancelar(row);
    setCancellationModalOpen(true);
  };

  const confirmCancellation = async (motivo) => {
    setCanceling(true);
    try {
      await api.patch(`/pos/${pedidoACancelar.id_venta}/cancelar?motivo_cancelacion=${encodeURIComponent(motivo)}`);
      fetchTodosPedidos();
      setCancellationModalOpen(false);
      setPedidoACancelar(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al cancelar el pedido: " + (error.response?.data?.message || error.message));
    } finally {
      setCanceling(false);
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    // Cargar permisos
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const jwtDecode = require('jwt-decode').jwtDecode;
          const decoded = jwtDecode(token);
          setPermisos(decoded.permisos || {});
        } catch (e) {
          console.error("Error decoding token", e);
        }
      }
    }
    fetchTodosPedidos();
  }, [filtro, statusFiltro, idSuc]);

  // Calcular suma total de todos los pedidos
  const sumaTotal = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);

  // Columnas de la tabla
  const columns = [
    {
      header: "ID PEDIDO",
      accessor: "id_venta",
      render: (row) => <span className="font-semibold">#{row.id_venta}</span>,
    },
    {
      header: "CLIENTE",
      accessor: "cliente",
      render: (row) => <span className="text-gray-700">{row.cliente}</span>,
    },
    {
      header: "SUCURSAL",
      accessor: "sucursal",
      render: (row) => <span className="text-gray-600">{row.sucursal}</span>,
    },
    {
      header: "PRODUCTOS",
      accessor: "cantidad_items",
      render: (row) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
          {row.cantidad_items}
        </span>
      ),
    },
    {
      header: "TOTAL",
      accessor: "total",
      render: (row) => (
        <span className="text-green-600 font-bold">
          ${row.total.toFixed(2)}
        </span>
      ),
    },
    {
      header: "FECHA",
      accessor: "fecha_hora",
      render: (row) => (
        <span className="text-gray-500 text-sm">
          {new Date(row.fecha_hora).toLocaleString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "ESTADO",
      accessor: "status_texto",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === 0
            ? "bg-gray-200 text-gray-800"
            : row.status === 1
              ? "bg-yellow-200 text-yellow-800"
              : row.status === 2
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
        >
          {row.status_texto}
        </span>
      ),
    },
    {
      header: "DETALLE",
      accessor: "detalle",
      render: (row) => {
        // Solo mostrar detalle para pedidos de domicilio (tipo_servicio === 2) o cancelados
        if ((row.tipo_servicio !== 2 && row.status !== 5) || !row.detalle) {
          return <span className="text-gray-400 text-sm">-</span>;
        }

        // Determinar el color y estilo según el tipo de detalle
        let badgeClass = "bg-blue-100 text-blue-800";

        if (row.status === 5) {
          badgeClass = "bg-red-100 text-red-800";
        } else if (row.detalle.includes("Pago realizado")) {
          badgeClass = "bg-green-100 text-green-800";
        } else if (row.detalle.includes("terminal")) {
          badgeClass = "bg-purple-100 text-purple-800";
        } else if (row.detalle.includes("cambio")) {
          badgeClass = "bg-orange-100 text-orange-800";
        }

        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
            {row.detalle}
          </span>
        );
      },
    },
    {
      header: "ACCIONES",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-center gap-2">
          {row.status !== 5 && (
            <>
              {permisos?.modificar_venta && row.status !== 2 && (
                <button
                  onClick={() => handleEdit(row)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <FaEdit size={22} />
                </button>
              )}

              {permisos?.eliminar_venta && row.status !== 2 && (
                <button
                  onClick={() => handleDelete(row)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Eliminar"
                >
                  <FaTrash size={22} />
                </button>
              )}
            </>
          )}

          {
            !row.pagado && row.status !== 5 && (
              <button
                onClick={() => {
                  setPedidoAPagar(row);
                  setModalPagosOpen(true);
                }}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="Pagar"
              >
                <MdOutlinePayments size={22} />
              </button>
            )
          }
          {
            <button
              onClick={() => handlePrint(row)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title="Imprimir"
            >
              <MdPrint size={22} />
            </button>
          }
        </div >
      ),
    },
  ];

  if (loading && pedidos.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando pedidos...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Todos los Pedidos
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Historial completo de pedidos
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="todos">Todos los registros</option>
            </select>

            <select
              value={statusFiltro ?? ""}
              onChange={(e) =>
                setStatusFiltro(
                  e.target.value === "" ? null : parseInt(e.target.value)
                )
              }
              className="px-4 py-2 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="0">Esperando</option>
              <option value="1">Preparando</option>
              <option value="2">Completado</option>
              <option value="5">Cancelado</option>
            </select>

            <button
              onClick={fetchTodosPedidos}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              {loading ? (
                "Cargando..."
              ) : (
                <>
                  <IoReload />
                  <span>Actualizar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay pedidos para mostrar</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-6 text-sm">
              <span className="text-gray-600">
                Total de pedidos:{" "}
                <span className="font-semibold text-gray-800">
                  {pedidos.length}
                </span>
              </span>
              <span className="text-gray-600">
                Esperando:{" "}
                <span className="font-semibold text-gray-800">
                  {pedidos.filter((p) => p.status === 0).length}
                </span>
              </span>
              <span className="text-gray-600">
                Preparando:{" "}
                <span className="font-semibold text-yellow-600">
                  {pedidos.filter((p) => p.status === 1).length}
                </span>
              </span>
              <span className="text-gray-600">
                Completados:{" "}
                <span className="font-semibold text-green-600">
                  {pedidos.filter((p) => p.status === 2).length}
                </span>
              </span>
              <span className="text-gray-600">
                Cancelados:{" "}
                <span className="font-semibold text-red-600">
                  {pedidos.filter((p) => p.status === 5).length}
                </span>
              </span>
              <span className="text-gray-600 ml-auto">
                Suma total:{" "}
                <span className="font-bold text-green-600 text-lg">
                  ${sumaTotal.toFixed(2)}
                </span>
              </span>
            </div>
            <Table columns={columns} data={pedidos} />
          </>
        )}
      </Card>

      {
        modalPagosOpen && pedidoAPagar && (
          <PaymentModal
            isOpen={modalPagosOpen}
            onClose={() => {
              setModalPagosOpen(false);
              setPedidoAPagar(null);
            }}
            total={pedidoAPagar.total}
            onConfirm={async (pagos) => {
              try {
                await pagarVenta(pedidoAPagar.id_venta, pagos);
                setModalPagosOpen(false);
                setPedidoAPagar(null);
                fetchTodosPedidos(); // Recargar lista
              } catch (error) {
                toast.error(error.response?.data?.message || 'Error al procesar el pago');
              }
            }}
          />
        )
      }

      <CancellationModal
        isOpen={cancellationModalOpen}
        onClose={() => {
          setCancellationModalOpen(false);
          setPedidoACancelar(null);
        }}
        onConfirm={confirmCancellation}
        loading={canceling}
      />

      <PDFViewerModal
        isOpen={pdfModalOpen}
        pdfUrl={pdfUrl}
        onClose={() => {
          setPdfModalOpen(false);
          setPdfUrl(null);
        }}
      />
    </div >
  );
}
