import { useState, useEffect } from 'react';

export const useCartEdit = () => {
  const [orden, setOrden] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [productosEliminados, setProductosEliminados] = useState([]);
  const [statusPrincipal, setStatusPrincipal] = useState(1);

  const calcularPrecioYSubtotal = (precioBase, cantidad) => {
    const pares = Math.floor(cantidad / 2);
    const sueltos = cantidad % 2;
    const subtotal = (pares * precioBase) + (sueltos * precioBase * 0.6);
    const precioUnitario = subtotal / cantidad;

    return {
      precioUnitario,
      subtotal
    };
  };

  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map(item => {
      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad
        };
      }

      const categoriasConDescuento = ['id_pizza', 'id_maris'];

      if (!categoriasConDescuento.includes(item.tipoId)) {
        return {
          ...item,
          precioUnitario: item.precioOriginal,
          subtotal: item.precioOriginal * item.cantidad
        };
      }

      const { precioUnitario, subtotal } = calcularPrecioYSubtotal(
        item.precioOriginal,
        item.cantidad
      );

      return {
        ...item,
        precioUnitario,
        subtotal
      };
    });
  };

  const cargarProductosOriginales = (productosBackend) => {
    // Convertir los productos del backend al formato del carrito
    // Asume que detalleVenta.productos es un array de objetos con: id_producto, tipo_id, nombre, precio, cantidad, status, tamano, etc.
    const productosConvertidos = productosBackend.map((prod, index) => {
      // Suponiendo que el backend devuelve un campo tipo_id como 'id_pizza', 'id_hamb', etc.
      const tipoId = prod.tipo_id; // Ajusta según tu estructura real de detalleVenta.productos

      // Ajustar el nombre si es un paquete
      const esPaquete = prod.tipo && prod.tipo.toLowerCase().includes('paquete');
      const nombre = esPaquete ? prod.nombre || `Paquete ${prod.numero_paquete || 'Desconocido'}` : prod.nombre;

      // Asumiendo que el backend devuelve el precio unitario original
      const precioOriginal = prod.precio_unitario || prod.precio || 0;

      // Generar un ID único para el carrito (importante para el manejo de estado)
      // Si no hay un ID único del backend para la línea del pedido, usamos un temporal
      const idCarrito = `original_${prod.id_producto}_${index}`; // Ajusta según tu estructura

      return {
        id: idCarrito, // ID interno para el carrito
        idProductoBackend: prod.id_producto, // ID real del producto para el backend
        tipoId: tipoId,
        nombre: nombre,
        precioOriginal: precioOriginal,
        precioUnitario: precioOriginal, // Se recalcula si aplica descuento
        cantidad: prod.cantidad || 1,
        subtotal: (precioOriginal * (prod.cantidad || 1)),
        tamano: prod.tamano || prod.subcategoria || 'N/A', // Ajusta según tu estructura
        productos: null, // No se usa para items simples, pero inicializamos
        esPaquete: esPaquete,
        esOriginal: true, // Marcar como original
        statusOriginal: prod.status, // Guardar el status original si aplica
        // Campos específicos de paquetes, si aplica
        ...(esPaquete && {
          numeroPaquete: prod.numero_paquete,
          datoPaquete: {
            id_paquete: prod.numero_paquete,
            id_refresco: prod.id_refresco,
            detalle_paquete: prod.detalle_paquete,
            id_pizza: prod.id_pizza,
            id_hamb: prod.id_hamb,
            id_alis: prod.id_alis,
          }
        })
      };
    });

    setProductosOriginales(productosConvertidos); // Guardar originales
    setOrden(recalcularPrecios(productosConvertidos)); // Cargarlos en el carrito y recalcular
    setProductosEliminados([]); // Reiniciar eliminados al cargar originales
  };

  const agregarPaquete = (paquete) => {
    setOrden((prevOrden) => {
      const idUnico = `paquete_${paquete.numeroPaquete}_${Date.now()}`;

      const nuevoPaquete = {
        id: idUnico,
        tipoId: 'paquete',
        esPaquete: true,
        numeroPaquete: paquete.numeroPaquete,
        nombre: `Paquete ${paquete.numeroPaquete}`,
        precioOriginal: paquete.precio,
        precioUnitario: paquete.precio,
        cantidad: 1,
        subtotal: paquete.precio,
        tamano: 'N/A',
        esOriginal: false,
        esNuevo: true,
        datoPaquete: {
          id_paquete: paquete.numeroPaquete,
          id_refresco: paquete.idRefresco,
          detalle_paquete: paquete.detallePaquete || null,
          id_pizza: paquete.idPizza || null,
          id_hamb: paquete.idHamb || null,
          id_alis: paquete.idAlis || null
        }
      };

      return recalcularPrecios([...prevOrden, nuevoPaquete]);
    });
  };

  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamano = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      const categoriasConDescuento = ['id_pizza', 'id_maris'];

      if (categoriasConDescuento.includes(tipoId)) {
        const itemMismoTamano = prevOrden.find(
          (item) => item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete
        );

        let nuevaOrden;

        if (itemMismoTamano) {
          nuevaOrden = prevOrden.map((item) => {
            if (item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete) {
              const productoExistente = item.productos?.find(p => p.id === id);

              if (productoExistente) {
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: item.productos.map(p =>
                    p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                  ),
                  esModificado: item.esOriginal ? true : item.esModificado
                };
              } else {
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: [...(item.productos || []), { id, nombre, cantidad: 1 }],
                  esModificado: item.esOriginal ? true : item.esModificado
                };
              }
            }
            return item;
          });
        } else {
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${tamano}_${Date.now()}`,
              tipoId,
              nombre: `${tipoId === 'id_pizza' ? 'Pizza' : 'Marisco'} ${tamano}`,
              precioOriginal,
              precioUnitario: precioOriginal * 0.6,
              cantidad: 1,
              subtotal: precioOriginal * 0.6,
              tamano,
              productos: [{ id, nombre, cantidad: 1 }],
              esPaquete: false,
              esOriginal: false,
              esNuevo: true
            },
          ];
        }

        return recalcularPrecios(nuevaOrden);
      } else {
        const itemExistente = prevOrden.find(
          (item) => item.id === id && item.tipoId === tipoId && !item.esPaquete
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            item.id === id && item.tipoId === tipoId && !item.esPaquete
              ? { 
                  ...item, 
                  cantidad: item.cantidad + 1,
                  esModificado: item.esOriginal ? true : item.esModificado
                }
              : item
          );
        } else {
          nuevaOrden = [
            ...prevOrden,
            {
              id,
              tipoId,
              nombre,
              precioOriginal,
              precioUnitario: precioOriginal,
              cantidad: 1,
              subtotal: precioOriginal,
              tamano: 'N/A',
              productos: null,
              esPaquete: false,
              esOriginal: false,
              esNuevo: true
            },
          ];
        }
        return recalcularPrecios(nuevaOrden);
      }
    });
  };

  const actualizarCantidad = (id, tipoId, nuevaCantidad, productoId = null) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId, productoId);
      return;
    }

    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        if (item.id === id && item.tipoId === tipoId) {
          if (productoId && item.productos) {
            const diferencia = nuevaCantidad - item.productos.find(p => p.id === productoId).cantidad;

            return {
              ...item,
              cantidad: item.cantidad + diferencia,
              productos: item.productos.map(p =>
                p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
              ),
              esModificado: item.esOriginal ? true : item.esModificado
            };
          } else {
            return { 
              ...item, 
              cantidad: nuevaCantidad,
              esModificado: item.esOriginal ? true : item.esModificado
            };
          }
        }
        return item;
      });

      return recalcularPrecios(nuevaOrden);
    });
  };

  const eliminarDelCarrito = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      let nuevaOrden;

      if (productoId) {
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId && item.productos) {
            const productoAEliminar = item.productos.find(p => p.id === productoId);
            const nuevosProductos = item.productos.filter(p => p.id !== productoId);

            if (nuevosProductos.length === 0) {
              // Si era un producto original, marcarlo como eliminado
              if (item.esOriginal) {
                setProductosEliminados(prev => [...prev, {
                  ...item,
                  statusNuevo: 0 // Cancelado
                }]);
              }
              return null;
            }

            return {
              ...item,
              cantidad: item.cantidad - productoAEliminar.cantidad,
              productos: nuevosProductos,
              esModificado: item.esOriginal ? true : item.esModificado
            };
          }
          return item;
        }).filter(item => item !== null);
      } else {
        // Si es un producto original, marcarlo como eliminado (status 0)
        const itemAEliminar = prevOrden.find(
          (item) => item.id === id && item.tipoId === tipoId
        );

        if (itemAEliminar && itemAEliminar.esOriginal) {
          setProductosEliminados(prev => [...prev, {
            ...itemAEliminar,
            statusNuevo: 0 // Cancelado
          }]);
        }

        nuevaOrden = prevOrden.filter(
          (item) => !(item.id === id && item.tipoId === tipoId)
        );
      }

      return recalcularPrecios(nuevaOrden);
    });
  };

  const getProductosModificados = () => {
    const modificados = [];

    // 1. Productos eliminados (estaban originalmente, ahora no)
    const idsActuales = orden.filter(item => !item.esNuevo).map(item => item.idProductoBackend).filter(Boolean);
    productosOriginales.forEach(prodOrig => {
      if (!idsActuales.includes(prodOrig.idProductoBackend)) {
        modificados.push({
          id_producto: prodOrig.idProductoBackend,
          status: 0, // Cancelado
          cantidad: 0 // o la cantidad original si el backend lo requiere
        });
      }
    });

    // 2. Productos modificados (cantidad cambiada)
    orden.forEach(item => {
      if (item.esOriginal) {
        const original = productosOriginales.find(orig => orig.idProductoBackend === item.idProductoBackend);
        if (original && original.cantidad !== item.cantidad) {
          modificados.push({
            id_producto: item.idProductoBackend,
            status: 1, // Activo
            cantidad: item.cantidad
          });
        }
      }
    });

    // 3. Productos nuevos agregados
    orden.forEach(item => {
      if (item.esNuevo && item.idProductoBackend) { // Asegurar que tiene ID si es nuevo
        modificados.push({
          id_producto: item.idProductoBackend,
          status: 1, // Activo
          cantidad: item.cantidad,
          tipo_id: item.tipoId, // Ajusta según estructura backend
          nombre: item.nombre,
          precio_unitario: item.precioUnitario
        });
      }
    });

    // 4. Paquetes nuevos (si no tienen idProductoBackend, se manejan diferente si aplica)
    orden.forEach(item => {
      if (item.esPaquete && item.esNuevo) {
         // Si tu backend maneja paquetes como items separados o con un id_producto específico, ajusta aquí
         // Por ahora, asumimos que pueden tener un idProductoBackend o se manejan como items especiales
         // Si no, podrías necesitar una lógica específica para paquetes en el payload de actualización
         if(item.idProductoBackend) {
            modificados.push({
                id_producto: item.idProductoBackend,
                status: 1,
                cantidad: item.cantidad,
                tipo_id: 'paquete', // o como lo maneje tu backend
                nombre: item.nombre,
                precio_unitario: item.precioUnitario,
                // ... otros campos específicos de paquete
            });
         }
         // Si no tienen idProductoBackend, el backend debe saber cómo manejarlo
      }
    });

    return modificados;
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
    getProductosModificados,
    statusPrincipal,
    setStatusPrincipal
  };
};