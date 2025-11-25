import { useState } from "react";

export const useCartEdit = () => {
  const [orden, setOrden] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [statusPrincipal, setStatusPrincipal] = useState(1);

  const calcularPrecioYSubtotal = (precioBase, cantidad) => {
    const pares = Math.floor(cantidad / 2);
    const sueltos = cantidad % 2;
    const subtotal = pares * precioBase + sueltos * precioBase * 0.6;
    const precioUnitario = subtotal / cantidad;

    return {
      precioUnitario,
      subtotal,
    };
  };

  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map((item) => {
      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad,
        };
      }

      // Categorías con descuento 2x1
      const categoriasConDescuento = ["id_pizza", "id_maris"];

      if (!categoriasConDescuento.includes(item.tipo)) {
        return {
          ...item,
          precioUnitario: item.precioOriginal,
          subtotal: item.precioOriginal * item.cantidad,
        };
      }

      // Aplicar descuento para pizzas/mariscos
      const { precioUnitario, subtotal } = calcularPrecioYSubtotal(
        item.precioOriginal,
        item.cantidad
      );

      return {
        ...item,
        precioUnitario,
        subtotal,
      };
    });
  };

  // Cargar productos desde el backend y completar con datos de la caché
  // Cargar productos desde el backend y completar con datos de la caché
  const cargarProductosOriginales = (productosBackend, productosCache) => {
    // Mapear tipo del backend al nombre de categoría
    const tipoMap = {
      'id_pizza': 'pizzas',
      'id_hamb': 'hamburguesas',
      'id_alis': 'alitas',
      'id_cos': 'costillas',
      'id_spag': 'spaguetty',
      'id_papa': 'papas',
      'id_rect': 'rectangular',
      'id_barr': 'barra',
      'id_maris': 'mariscos',
      'id_refresco': 'refrescos',
      'id_paquete': 'paquetes'
    };

    const productosConvertidos = productosBackend.map((prod, index) => {
      const esPaquete = prod.tipo === 'id_paquete';
      
      let nombre = `Producto ${prod.id}`;
      let precio = 0;

      // Buscar en la caché de productos
      const categoria = tipoMap[prod.tipo];
      if (categoria && productosCache[categoria]) {
        const categoriaProductos = productosCache[categoria];

        // Determinar el campo ID que usa esta categoría
        const tipoIdCampo = prod.tipo; // ej: 'id_pizza', 'id_hamb'

        // Para pizzas, mariscos y refrescos que tienen tamaño/subcategoría
        if (['id_pizza', 'id_maris', 'id_refresco'].includes(prod.tipo) && prod.tamaño) {
          // Buscar por ID del producto y tamaño específico
          const variante = categoriaProductos.find(p => 
            p[tipoIdCampo] === prod.id && 
            (p.subcategoria === prod.tamaño || p.tamaño === prod.tamaño)
          );
          
          if (variante) {
            nombre = variante.nombre;
            precio = parseFloat(variante.precio);
          } else {
            // Fallback: buscar solo por ID
            const productoBase = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
            if (productoBase) {
              nombre = `${productoBase.nombre} ${prod.tamaño}`;
              precio = parseFloat(productoBase.precio);
            }
          }
        } else {
          // Para productos sin variantes de tamaño
          const producto = categoriaProductos.find(p => p[tipoIdCampo] === prod.id);
          
          if (producto) {
            nombre = producto.nombre;
            precio = parseFloat(producto.precio);
          }
        }
      }

      // Si es un paquete, establecer nombre y precio fijo
      if (esPaquete) {
        nombre = `Paquete ${prod.id}`;
        precio = prod.id === 1 ? 295 : prod.id === 2 ? 265 : prod.id === 3 ? 395 : 0;
      }

      // Crear ID único para el carrito
      const idCarrito = `original_${prod.tipo}_${prod.id || index}_${prod.tamaño || 'std'}`;

      return {
        // IDs
        id: idCarrito,
        idProducto: prod.id, // ID real del producto
        tipo: prod.tipo, // 'id_pizza', 'id_hamb', etc.
        
        // Información del producto
        nombre: nombre,
        tamano: prod.tamaño || 'N/A',
        
        // Precios (obtenidos de la caché)
        precioOriginal: precio,
        precioUnitario: precio,
        
        // Cantidad y cálculos
        cantidad: prod.cantidad,
        subtotal: precio * prod.cantidad,
        
        // Estado
        status: prod.status,
        esPaquete: esPaquete,
        esOriginal: true,
        esModificado: false,
        
        // Para items agrupados (pizzas del mismo tamaño)
        productos: null
      };
    });

    // Agrupar pizzas/mariscos del mismo tamaño
    const productosAgrupados = agruparProductosPorTamano(productosConvertidos);

    setProductosOriginales(productosConvertidos);
    setOrden(recalcularPrecios(productosAgrupados));
  };

  // Agrupar pizzas/mariscos del mismo tamaño en un solo item del carrito
  const agruparProductosPorTamano = (productos) => {
    const agrupados = [];
    const categoriasAgrupables = ["id_pizza", "id_maris"];
    const yaAgrupados = new Set();

    productos.forEach((prod, index) => {
      if (yaAgrupados.has(index)) return;

      if (categoriasAgrupables.includes(prod.tipo)) {
        // Buscar todos los productos del mismo tipo y tamaño
        const grupo = productos.filter(
          (p, i) =>
            !yaAgrupados.has(i) &&
            p.tipo === prod.tipo &&
            p.tamano === prod.tamano &&
            !p.esPaquete
        );

        grupo.forEach((p, i) => {
          const idx = productos.findIndex(
            (item) =>
              item.id === p.id && !yaAgrupados.has(productos.indexOf(item))
          );
          if (idx !== -1) yaAgrupados.add(idx);
        });

        if (grupo.length > 1) {
          // Crear item agrupado
          const cantidadTotal = grupo.reduce((sum, p) => sum + p.cantidad, 0);
          const productosDetalle = grupo.map((p) => ({
            id: p.idProducto,
            nombre: p.nombre,
            cantidad: p.cantidad,
          }));

          agrupados.push({
            id: `${prod.tipo}_${prod.tamano}_${Date.now()}`,
            idProducto: null, // No hay un ID único cuando está agrupado
            tipo: prod.tipo,
            nombre: `${prod.tipo === "id_pizza" ? "Pizzas" : "Mariscos"} ${
              prod.tamano
            }`,
            tamano: prod.tamano,
            precioOriginal: prod.precioOriginal,
            precioUnitario: prod.precioOriginal * 0.6, // Primera es suelta
            cantidad: cantidadTotal,
            subtotal: 0, // Se recalcula
            status: prod.status,
            esPaquete: false,
            esOriginal: true,
            esModificado: false,
            productos: productosDetalle,
          });
        } else {
          agrupados.push(prod);
        }
      } else {
        agrupados.push(prod);
      }
    });

    return agrupados;
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamano =
      producto.subcategoria || producto.tamano || producto.tamaño || "N/A";
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      const categoriasConDescuento = ["id_pizza", "id_maris"];

      if (categoriasConDescuento.includes(tipoId)) {
        // Buscar grupo del mismo tamaño
        const itemMismoTamano = prevOrden.find(
          (item) =>
            item.tipo === tipoId && item.tamano === tamano && !item.esPaquete
        );

        let nuevaOrden;

        if (itemMismoTamano) {
          // Agregar al grupo existente
          nuevaOrden = prevOrden.map((item) => {
            if (
              item.tipo === tipoId &&
              item.tamano === tamano &&
              !item.esPaquete
            ) {
              const productoExistente = item.productos?.find(
                (p) => p.id === id
              );

              if (productoExistente) {
                // Incrementar cantidad del producto existente
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: item.productos.map((p) =>
                    p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                  ),
                  esModificado: item.esOriginal,
                };
              } else {
                // Agregar nuevo producto al grupo
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: [
                    ...(item.productos || []),
                    { id, nombre, cantidad: 1 },
                  ],
                  esModificado: item.esOriginal,
                };
              }
            }
            return item;
          });
        } else {
          // Crear nuevo grupo
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${tamano}_${Date.now()}`,
              idProducto: id,
              tipo: tipoId,
              nombre: `${
                tipoId === "id_pizza" ? "Pizza" : "Marisco"
              } ${tamano}`,
              tamano,
              precioOriginal,
              precioUnitario: precioOriginal * 0.6,
              cantidad: 1,
              subtotal: precioOriginal * 0.6,
              status: 1,
              esPaquete: false,
              esOriginal: false,
              esNuevo: true,
              productos: [{ id, nombre, cantidad: 1 }],
            },
          ];
        }

        return recalcularPrecios(nuevaOrden);
      } else {
        // Productos sin agrupación
        const itemExistente = prevOrden.find(
          (item) =>
            item.idProducto === id && item.tipo === tipoId && !item.esPaquete
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            item.idProducto === id && item.tipo === tipoId && !item.esPaquete
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  esModificado: item.esOriginal,
                }
              : item
          );
        } else {
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${id}_${Date.now()}`,
              idProducto: id,
              tipo: tipoId,
              nombre,
              tamano: "N/A",
              precioOriginal,
              precioUnitario: precioOriginal,
              cantidad: 1,
              subtotal: precioOriginal,
              status: 1,
              esPaquete: false,
              esOriginal: false,
              esNuevo: true,
              productos: null,
            },
          ];
        }
        return recalcularPrecios(nuevaOrden);
      }
    });
  };

  // Agregar paquete
  const agregarPaquete = (paquete) => {
    setOrden((prevOrden) => {
      const nuevoPaquete = {
        id: `paquete_${paquete.numeroPaquete}_${Date.now()}`,
        idProducto: null, // Los paquetes no tienen ID de producto individual
        tipo: "id_paquete",
        nombre: `Paquete ${paquete.numeroPaquete}`,
        tamano: "N/A",
        precioOriginal: paquete.precio,
        precioUnitario: paquete.precio,
        cantidad: 1,
        subtotal: paquete.precio,
        status: 1,
        esPaquete: true,
        esOriginal: false,
        esNuevo: true,
        productos: null,
        datoPaquete: {
          id_paquete: paquete.numeroPaquete,
          id_refresco: paquete.idRefresco,
          detalle_paquete: paquete.detallePaquete || null,
          id_pizza: paquete.idPizza || null,
          id_hamb: paquete.idHamb || null,
          id_alis: paquete.idAlis || null,
        },
      };

      return recalcularPrecios([...prevOrden, nuevoPaquete]);
    });
  };

  // Actualizar cantidad
  const actualizarCantidad = (id, tipoId, nuevaCantidad, productoId = null) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId, productoId);
      return;
    }

    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        if (item.id === id && item.tipo === tipoId) {
          if (productoId && item.productos) {
            // Actualizar cantidad de un producto específico en un grupo
            const productoActual = item.productos.find(
              (p) => p.id === productoId
            );
            const diferencia = nuevaCantidad - productoActual.cantidad;

            return {
              ...item,
              cantidad: item.cantidad + diferencia,
              productos: item.productos.map((p) =>
                p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
              ),
              esModificado: item.esOriginal,
            };
          } else {
            // Actualizar cantidad del item completo
            return {
              ...item,
              cantidad: nuevaCantidad,
              esModificado: item.esOriginal,
            };
          }
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      let nuevaOrden;

      if (productoId) {
        // Eliminar producto específico de un grupo
        nuevaOrden = prevOrden
          .map((item) => {
            if (item.id === id && item.tipo === tipoId && item.productos) {
              const productoAEliminar = item.productos.find(
                (p) => p.id === productoId
              );
              const nuevosProductos = item.productos.filter(
                (p) => p.id !== productoId
              );

              if (nuevosProductos.length === 0) {
                return null; // Eliminar el item completo
              }

              return {
                ...item,
                cantidad: item.cantidad - productoAEliminar.cantidad,
                productos: nuevosProductos,
                esModificado: item.esOriginal,
              };
            }
            return item;
          })
          .filter((item) => item !== null);
      } else {
        // Eliminar item completo
        nuevaOrden = prevOrden.filter(
          (item) => !(item.id === id && item.tipo === tipoId)
        );
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Generar payload para actualizar el pedido
  const getPayloadActualizacion = () => {
    const productosParaBackend = [];

    // Procesar productos actuales del carrito
    orden.forEach((item) => {
      if (item.esPaquete) {
        // Paquetes
        productosParaBackend.push({
          id: item.idProducto,
          cantidad: item.cantidad,
          tipo: item.tipo,
          nombre: item.nombre,
          precio_unitario: item.precioUnitario,
          status: item.status || 1,
        });
      } else if (item.productos && item.productos.length > 0) {
        // Items agrupados (pizzas/mariscos del mismo tamaño)
        item.productos.forEach((prod) => {
          productosParaBackend.push({
            id: prod.id,
            cantidad: prod.cantidad,
            tipo: item.tipo,
            nombre: prod.nombre,
            tamaño: item.tamano,
            precio_unitario: item.precioUnitario,
            status: item.status || 1,
          });
        });
      } else {
        // Items individuales
        productosParaBackend.push({
          id: item.idProducto,
          cantidad: item.cantidad,
          tipo: item.tipo,
          nombre: item.nombre,
          tamaño: item.tamano !== "N/A" ? item.tamano : null,
          precio_unitario: item.precioUnitario,
          status: item.status || 1,
        });
      }
    });

    // Marcar productos eliminados con status 0
    productosOriginales.forEach((prodOrig) => {
      const existeEnOrden = orden.some((item) => {
        if (item.productos) {
          return item.productos.some((p) => p.id === prodOrig.idProducto);
        }
        return item.idProducto === prodOrig.idProducto;
      });

      if (!existeEnOrden) {
        productosParaBackend.push({
          id: prodOrig.idProducto,
          cantidad: 0,
          tipo: prodOrig.tipo,
          nombre: prodOrig.nombre,
          tamaño: prodOrig.tamano !== "N/A" ? prodOrig.tamano : null,
          precio_unitario: prodOrig.precioOriginal,
          status: 0, // Cancelado
        });
      }
    });

    return productosParaBackend;
  };

  const total = orden.reduce((acc, item) => acc + item.subtotal, 0);

  return {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    actualizarCantidad,
    eliminarDelCarrito,
    cargarProductosOriginales,
    getPayloadActualizacion,
    statusPrincipal,
    setStatusPrincipal,
  };
};
