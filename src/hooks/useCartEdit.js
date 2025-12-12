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
      // Si el item está cancelado (status 0) y no es un grupo, su subtotal es 0
      if (item.status === 0 && !item.productos) {
        return {
          ...item,
          subtotal: 0,
        };
      }

      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad,
        };
      }

      // Categorías con descuento 2x1
      const categoriasConDescuento = ["id_pizza", "id_maris"];

      if (!categoriasConDescuento.includes(item.tipoId)) {
        return {
          ...item,
          precioUnitario: item.precioOriginal,
          subtotal: item.precioOriginal * item.cantidad,
        };
      }

      // Para items agrupados, filtrar los que tienen status 0 antes de calcular pares
      let cantidadParaCalculo = item.cantidad;
      if (item.productos) {
        cantidadParaCalculo = item.productos.reduce((acc, p) => {
          return p.status === 0 ? acc : acc + p.cantidad;
        }, 0);
      }

      // Aplicar descuento para pizzas/mariscos
      const { precioUnitario, subtotal } = calcularPrecioYSubtotal(
        item.precioOriginal,
        cantidadParaCalculo
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
      // Usar index para garantizar unicidad si hay múltiples líneas del mismo producto
      const idCarrito = `original_${prod.tipo}_${prod.id}_${index}_${prod.tamaño || 'std'}`;

      // Preparar objeto base
      const itemBase = {
        // IDs
        id: idCarrito,
        idProducto: prod.id, // ID real del producto
        tipoId: prod.tipo, // 'id_pizza', 'id_hamb', etc.
        
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

      // Si es un paquete, agregar datoPaquete con la información del backend
      if (esPaquete) {
        itemBase.datoPaquete = {
          id_paquete: prod.id,
          id_refresco: prod.id_refresco || null,
          detalle_paquete: prod.detalle_paquete || null,
          id_pizza: prod.id_pizza || null,
          id_hamb: prod.id_hamb || null,
          id_alis: prod.id_alis || null,
        };
      }

      return itemBase;
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

      if (categoriasAgrupables.includes(prod.tipoId)) {
        // Buscar todos los productos del mismo tipo y tamaño
        const grupo = productos.filter(
          (p, i) =>
            !yaAgrupados.has(i) &&
            p.tipoId === prod.tipoId &&
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

        // SIEMPRE crear item agrupado para pizzas y mariscos
        const cantidadTotal = grupo.reduce((sum, p) => sum + p.cantidad, 0);
        const productosDetalle = grupo.map((p) => ({
          id: p.id, // Usar el ID único del item (no el del producto)
          idProducto: p.idProducto, // Guardar ID del producto para referencia
          nombre: p.nombre,
          cantidad: p.cantidad,
          status: p.status,
          esOriginal: p.esOriginal
        }));

        // El status del grupo es 1 si al menos uno de los productos es activo (no 0)
        const statusGrupo = grupo.some(p => p.status !== 0) ? 1 : 0;

        agrupados.push({
          id: `${prod.tipoId}_${prod.tamano}_${Date.now()}_${Math.random()}`,
          idProducto: null, // No hay un ID único cuando está agrupado
          tipoId: prod.tipoId,
          nombre: `${prod.tipoId === "id_pizza" ? "Pizzas" : "Mariscos"} ${
            prod.tamano
          }`,
          tamano: prod.tamano,
          precioOriginal: prod.precioOriginal,
          precioUnitario: prod.precioOriginal * 0.6, // Primera es suelta
          cantidad: cantidadTotal,
          subtotal: 0, // Se recalcula
          status: statusGrupo,
          esPaquete: false,
          esOriginal: true,
          esModificado: false,
          productos: productosDetalle,
        });
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
            item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete
        );

        let nuevaOrden;

        if (itemMismoTamano) {
          // Agregar al grupo existente
          nuevaOrden = prevOrden.map((item) => {
            if (
              item.tipoId === tipoId &&
              item.tamano === tamano &&
              !item.esPaquete
            ) {
              const productoExistente = item.productos?.find(
                (p) => p.idProducto === id && (p.status === 1 || p.esNuevo)
              );

              if (productoExistente) {
                // Incrementar cantidad del producto existente (solo si es editable)
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar grupo si estaba cancelado
                  productos: item.productos.map((p) =>
                    p.id === productoExistente.id ? { ...p, cantidad: p.cantidad + 1, status: 1 } : p
                  ),
                  esModificado: item.esOriginal,
                };
              } else {
                // Agregar nuevo producto al grupo (nueva línea)
                const nuevoIdSubItem = `${tipoId}_${id}_${Date.now()}`;
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar grupo
                  productos: [
                    ...(item.productos || []),
                    { 
                      id: nuevoIdSubItem, 
                      idProducto: id, 
                      nombre, 
                      cantidad: 1, 
                      status: 1, 
                      esOriginal: false,
                      esNuevo: true 
                    },
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
              tipoId: tipoId,
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
              esOriginal: false,
              esNuevo: true,
              productos: [{ 
                id: `${tipoId}_${id}_${Date.now()}_sub`, 
                idProducto: id, 
                nombre, 
                cantidad: 1, 
                status: 1, 
                esOriginal: false,
                esNuevo: true 
              }],
            },
          ];
        }

        return recalcularPrecios(nuevaOrden);
      } else {
        const itemExistente = prevOrden.find(
          (item) =>
            item.idProducto === id && item.tipoId === tipoId && !item.esPaquete
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            item.idProducto === id && item.tipoId === tipoId && !item.esPaquete
              ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  status: 1, // Reactivar si estaba cancelado
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
              tipoId: tipoId,
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
        tipoId: "id_paquete",
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
        if (item.id === id && item.tipoId === tipoId) {
          if (productoId && item.productos) {
            // Actualizar cantidad de un producto específico en un grupo
            const productoActual = item.productos.find(
              (p) => p.id === productoId
            );

            // Si el producto tiene status 2, no permitir cambios
            if (productoActual.status === 2) return item;

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
              status: item.status === 2 ? 2 : 1 // Mantener status 2 si ya lo tiene
            };
          }
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Eliminar del carrito (o cambiar status a 0 si es original)
  const eliminarDelCarrito = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      let nuevaOrden;

      if (productoId) {
        // Eliminar/Cancelar producto específico de un grupo
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId && item.productos) {
            const productoAEliminar = item.productos.find(
              (p) => p.id === productoId
            );

            // Si el producto tiene status 2, no permitir eliminar
            if (productoAEliminar.status === 2) return item;

            // Verificar si es un producto original usando la propiedad del objeto
            const esOriginal = productoAEliminar.esOriginal;

            if (esOriginal) {
              // Toggle status: si es 0 pasa a 1, si es otro pasa a 0
              const nuevoStatus = productoAEliminar.status === 0 ? 1 : 0;
              
              const nuevosProductos = item.productos.map((p) =>
                p.id === productoId ? { ...p, status: nuevoStatus } : p
              );

              // Actualizar status del grupo: si todos están en 0, grupo en 0. Si hay alguno activo (no 0), grupo en 1.
              const algunActivo = nuevosProductos.some(p => p.status !== 0);

              return {
                ...item,
                status: algunActivo ? 1 : 0,
                productos: nuevosProductos,
                esModificado: true,
              };
            } else {
              // Si no es original, eliminarlo físicamente
              const nuevosProductos = item.productos.filter(
                (p) => p.id !== productoId
              );

              if (nuevosProductos.length === 0) {
                return null; // Eliminar el item completo si no quedan productos
              }

              return {
                ...item,
                cantidad: item.cantidad - productoAEliminar.cantidad,
                productos: nuevosProductos,
                esModificado: item.esOriginal,
              };
            }
          }
          return item;
        }).filter(Boolean); // Filtrar nulos
      } else {
        // Eliminar/Cancelar item completo
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId) {
            // Si el item tiene status 2, no permitir eliminar
            if (item.status === 2) return item;

            if (item.esOriginal) {
              // Toggle status
              const nuevoStatus = item.status === 0 ? 1 : 0;
              
              // Si es un grupo, propagar el status a todos los hijos
              let productosActualizados = item.productos;
              if (item.productos) {
                productosActualizados = item.productos.map(p => ({
                  ...p,
                  status: nuevoStatus
                }));
              }

              return {
                ...item,
                status: nuevoStatus,
                productos: productosActualizados,
                esModificado: true
              };
            } else {
              // Marcar para eliminar
              return null;
            }
          }
          return item;
        }).filter(Boolean);
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  // Generar payload para actualizar el pedido
  const getPayloadActualizacion = () => {
    const items = [];

    // Procesar productos actuales del carrito
    orden.forEach((item) => {
      if (item.esPaquete) {
        // Paquetes
        const paqueteData = {
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          id_paquete: item.datoPaquete.id_paquete,
          status: item.status ?? 1,
        };

        // Si es nuevo, incluir detalles de composición
        if (!item.esOriginal) {
           if (item.datoPaquete.detalle_paquete) {
             paqueteData.detalle_paquete = item.datoPaquete.detalle_paquete;
           }
           if (item.datoPaquete.id_pizza) {
             paqueteData.id_pizza = item.datoPaquete.id_pizza;
           }
           if (item.datoPaquete.id_hamb) {
             paqueteData.id_hamb = item.datoPaquete.id_hamb;
           }
           if (item.datoPaquete.id_alis) {
             paqueteData.id_alis = item.datoPaquete.id_alis;
           }
           if (item.datoPaquete.id_refresco) {
             paqueteData.id_refresco = item.datoPaquete.id_refresco;
           }
        }

        items.push(paqueteData);

      } else if (item.productos && item.productos.length > 0) {
        // Items agrupados (pizzas/mariscos del mismo tamaño)
        item.productos.forEach((prod) => {
          items.push({
            cantidad: prod.cantidad,
            precio_unitario: item.precioUnitario || 0,
            [item.tipoId]: prod.idProducto || prod.id, // Usar idProducto si existe, sino id
            status: prod.status !== undefined ? prod.status : (item.status ?? 1),
          });
        });
      } else {
        // Items individuales
        items.push({
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || 0,
          [item.tipoId]: item.idProducto,
          status: item.status ?? 1,
        });
      }
    });

    // Marcar productos eliminados con status 0
    productosOriginales.forEach((prodOrig) => {
      const existeEnOrden = orden.some((item) => {
        if (item.productos) {
          // Verificar si el producto original existe en algún sub-item
          // Nota: prodOrig.idProducto es el ID del catálogo
          return item.productos.some((p) => p.idProducto === prodOrig.idProducto);
        }
        return item.idProducto === prodOrig.idProducto;
      });

      // Si no existe en la orden actual, agregarlo como cancelado
      // PERO cuidado: si se separó en múltiples líneas (una status 2, una status 1), 
      // la lógica de "existeEnOrden" podría ser engañosa si no cuidamos los IDs únicos.
      // Sin embargo, aquí estamos verificando si el PRODUCTO (catálogo) sigue presente.
      // Si el usuario eliminó TODAS las instancias de ese producto, entonces sí se manda status 0.
      // Si queda al menos una instancia (ej: la status 2), entonces no se manda este bloque de eliminación global.
      // La eliminación individual (bajar cantidad o quitar un sub-item) ya se maneja en el loop de `orden` 
      // si es que mantenemos los items con status 0 en `orden`.
      // REVISIÓN: `eliminarDelCarrito` mantiene los items originales con status 0 en `orden`.
      // Por lo tanto, `productosOriginales` solo es necesario si por alguna razón se eliminó físicamente del array `orden`.
      // En la lógica actual, los items originales NO se eliminan de `orden`, solo cambian de status.
      // Los items NUEVOS sí se eliminan físicamente.
      // Así que este bloque de `productosOriginales` es redundante si garantizamos que los originales nunca salen de `orden`.
      // Pero por seguridad, lo dejaremos, asegurando que use el formato correcto.

      if (!existeEnOrden) {
        items.push({
          cantidad: 0,
          precio_unitario: prodOrig.precioOriginal || 0,
          [prodOrig.tipoId]: prodOrig.idProducto,
          status: 0, // Cancelado
        });
      }
    });

    return items;
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
