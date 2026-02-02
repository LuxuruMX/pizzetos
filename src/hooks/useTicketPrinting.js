import { useState, useEffect, useCallback } from "react";
import { pdf } from '@react-pdf/renderer';
import TicketPDF from '@/components/ui/TicketPDF';
import { fetchProductosPorCategoria, fetchTicketDetalle } from "@/services/orderService";
import { catalogsService } from "@/services/catalogsService";
import { showToast } from '@/utils/toast';
import { PRECIOS_ORILLA_QUESO } from '@/config/prices';

// Función auxiliar para reconstruir la orden (fuera del hook para pureza)
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
  const pizzasBySize = {};

  productosBackend.forEach((prod, index) => {
    if (!['Pizza', 'Pizza Personalizada', 'Mariscos', 'Paquete', 'Rectangular', 'Barra', 'Magno', 'Refresco'].includes(prod.tipo)) {
      if (productosCache) {
        const cleanName = prod.nombre.split(' - ')[0].trim();
        const isPizza = productosCache.pizzas?.some(p =>
          p.nombre === cleanName ||
          prod.nombre.includes(p.nombre)
        );

        if (isPizza) {
          prod.tipo = 'Pizza';
        }
        // Intento 2: Buscar en Mariscos
        else if (productosCache.mariscos?.some(p => prod.nombre.includes(p.nombre))) {
          prod.tipo = 'Mariscos';
        }
      }
    }
    // 1. Manejo de PIZZAS y MARISCOS (Normales, Personalizadas y Mitad)
    // Se unifican para que compartan la lógica de promociones (2x1) por tamaño
    if (prod.tipo === 'Pizza' || prod.tipo === 'Pizza Personalizada' || prod.tipo === 'Mariscos' || prod.tipo === 'Pizza Mitad') { // Añadido Pizza Mitad
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

      // Limpiar nombre si es personalizada o mitad
      if (prod.tipo === 'Pizza Personalizada') {
        cleanName = 'Personalizada';
      } else if (prod.tipo === 'Pizza Mitad') {
         // Intentar extraer nombre de especialidades si vienen
         if (prod.detalles_ingredientes && prod.detalles_ingredientes.especialidades) {
             const espe = prod.detalles_ingredientes.especialidades;
             cleanName = `Mitad: ${espe.join(' / ')}`;
         } else {
             cleanName = 'Mitad y Mitad';
         }
      } else {
        // Quitar el tamaño del nombre si viene tipo "Hawaiana - Mediana" -> "Hawaiana"
        cleanName = cleanName.replace(` - ${size}`, '');
      }

      if (!pizzasBySize[size]) {
        pizzasBySize[size] = [];
      }
      // Precio base
      let precio = 0;
      if (prod.precio_base !== undefined && prod.precio_base !== null) {
        precio = parseFloat(prod.precio_base);
      } else if (prod.precioUnitario !== undefined && prod.precioUnitario !== null) {
        precio = parseFloat(prod.precioUnitario);
      } else {
        precio = findPrice(prod.nombre, 'pizzas', size);
        if (precio === 0) precio = findPrice(prod.nombre, 'mariscos', size); // Probar mariscos
      }

      pizzasBySize[size].push({
        ...prod,
        nombre: cleanName,
        tamano: size,
        ingredientesNombres: prod.tipo === 'Pizza Personalizada' && prod.detalles_ingredientes
          ? prod.detalles_ingredientes.ingredientes
          : [],
        especialidades: prod.tipo === 'Pizza Mitad' && prod.detalles_ingredientes && prod.detalles_ingredientes.especialidades
           ? prod.detalles_ingredientes.especialidades 
           : [], // Guardar especialidades aparte por si el PDF las usa distinto (aunque arriba las meti en el nombre)
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


export const useTicketPrinting = () => {
  const [printing, setPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [productosCache, setProductosCache] = useState(null);
  const [clientesCache, setClientesCache] = useState(null);

  // Warmup al montar
  useEffect(() => {
    const warmUp = async () => {
      try {
        const dummyData = {
          orden: [],
          total: 0,
          datosExtra: {},
          fecha: new Date().toISOString(),
          cliente: { nombre: 'Warmup' },
          tipoServicio: 1,
          comentarios: '',
          folio: 0
        };
        await pdf(<TicketPDF {...dummyData} />).toBlob();
        console.log("PDF Generator warmed up (Hook)");
      } catch (e) {
        console.error("Error warming up PDF", e);
      }
    };
    warmUp();
  }, []);

  const loadCatalogs = useCallback(async () => {
    if (productosCache && clientesCache) return { prods: productosCache, clis: clientesCache };

    try {
      const [p, c] = await Promise.all([
        fetchProductosPorCategoria(),
        catalogsService.getNombresClientes()
      ]);
      setProductosCache(p);
      setClientesCache(c);
      return { prods: p, clis: c };
    } catch (e) {
      console.error("Error loading catalogs for ticket", e);
      return { prods: productosCache || {}, clis: clientesCache || [] };
    }
  }, [productosCache, clientesCache]);

  const handlePrintTicket = async (ventaRow) => {
    try {
      setPrinting(true);

      // 0. Cargar catálogos si faltan
      const { prods, clis } = await loadCatalogs();
      if (!prods || Object.keys(prods).length === 0) {
        showToast.error("No se pudieron cargar datos para el ticket.");
        setPrinting(false);
        return;
      }

      // 1. Obtener detalles completos
      const detalle = await fetchTicketDetalle(ventaRow.id_venta);

      // 2. Reconstruir orden
      const ordenTicket = reconstructOrderForTicket(detalle.productos, prods);

      let clienteObj = { nombre: 'No especificado', telefono: detalle.telefono || '' };

      if (detalle.cliente) {
        const encontrado = clis.find(c => c.id_clie === detalle.cliente);
        if (encontrado) {
          clienteObj = encontrado;
          if (detalle.telefono) clienteObj.telefono = detalle.telefono;
        } else if (typeof detalle.cliente === 'string') {
          clienteObj.nombre = detalle.cliente;
        }
      }

      if (clienteObj.nombre === 'No especificado') {
        if (detalle.nombreClie) clienteObj.nombre = detalle.nombreClie;
        else if (detalle.nombre_cliente) clienteObj.nombre = detalle.nombre_cliente;
      }

      const calculatedTotal = ordenTicket.reduce((acc, item) => acc + item.subtotal, 0);

      let direccionCompleta = detalle.direccion_completa || '';
      if (detalle.direccion && typeof detalle.direccion === 'object') {
        const d = detalle.direccion;
        const parts = [];
        if (d.calle) parts.push(d.calle);
        if (d.numero) parts.push(`#${d.numero}`);
        if (d.cruzamientos) parts.push(`Cruz: ${d.cruzamientos}`);
        if (d.colonia) parts.push(`Col: ${d.colonia}`);
        if (d.referencia) parts.push(`Ref: ${d.referencia}`);
        if (d.manzana) parts.push(`Mz: ${d.manzana}`);
        if (d.lote) parts.push(`Lt: ${d.lote}`);
        if (parts.length > 0) direccionCompleta = parts.join(', ');
      }

      const datosExtra = {
        mesa: detalle.mesa,
        nombreClie: clienteObj.nombre,
        id_direccion: detalle.id_direccion,
        direccion_completa: direccionCompleta,
        telefono: clienteObj.telefono
      };


      // 4. Generar PDF
      const blob = await pdf(
        <TicketPDF
          orden={ordenTicket}
          total={calculatedTotal}
          datosExtra={datosExtra}
          fecha={detalle.fecha}
          cliente={clienteObj}
          tipoServicio={detalle.tipo_servicio}
          comentarios={detalle.comentarios}
          folio={detalle.id_venta}
          pagos={detalle.pagos || []}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);

    } catch (err) {
      console.error("Error al imprimir ticket:", err);
      showToast.error("Error generando ticket.");
    } finally {
      setPrinting(false);
    }
  };

  const closePdfModal = () => {
    setPdfModalOpen(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  return {
    handlePrintTicket,
    printing,
    pdfUrl,
    pdfModalOpen,
    closePdfModal
  };
};
