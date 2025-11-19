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

  const cargarProductosOriginales = (productos) => {
    // Convertir los productos del backend al formato del carrito
    const productosConvertidos = productos.map((prod, index) => ({
      id: `original_${index}`,
      tipoId: prod.tipo_id || 'id_pizza',
      nombre: prod.nombre,
      precioOriginal: prod.precio || 0,
      precioUnitario: prod.precio || 0,
      cantidad: prod.cantidad,
      subtotal: (prod.precio || 0) * prod.cantidad,
      tamano: prod.tamano || 'N/A',
      productos: null,
      esPaquete: prod.tipo.includes('Paquete'),
      esOriginal: true,
      statusOriginal: prod.status,
      idProductoBackend: prod.id_producto // Si el backend lo proporciona
    }));

    setProductosOriginales(productosConvertidos);
    setOrden(recalcularPrecios(productosConvertidos));
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

    // Agregar productos eliminados con status 0
    productosEliminados.forEach(prod => {
      modificados.push({
        id_producto: prod.idProductoBackend,
        status: 0,
        cantidad: prod.cantidad
      });
    });

    // Agregar productos nuevos (que no existían originalmente)
    orden.forEach(item => {
      if (item.esNuevo) {
        modificados.push({
          id_producto: item.id,
          status: 1, // Status por defecto para nuevos
          cantidad: item.cantidad,
          tipo: item.tipoId,
          nombre: item.nombre,
          precio: item.precioUnitario
        });
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