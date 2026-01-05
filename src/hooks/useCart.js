import { useState, useEffect } from 'react';

const encodeCart = (cart) => {
  if (!cart || !Array.isArray(cart)) return '';
  const jsonString = JSON.stringify(cart);
  // Codificar a Base64 para URL
  return typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(jsonString))) : '';
};

// Función para actualizar la URL en un efecto secundario
const updateUrl = (newCart) => {
  if (typeof window !== 'undefined') {
    const encodedCart = encodeCart(newCart);
    const newUrl = new URL(window.location);
    if (encodedCart) {
      newUrl.searchParams.set('cart', encodedCart);
    } else {
      newUrl.searchParams.delete('cart');
    }
    window.history.replaceState({}, '', newUrl);
  }
};

export const useCart = (initialCartFromUrl = []) => {
  const [orden, setOrden] = useState(initialCartFromUrl);

  useEffect(() => {
    if (initialCartFromUrl.length === 0 && typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedCart = urlParams.get('cart');
      if (encodedCart) {
        try {
          const decodedString = decodeURIComponent(escape(atob(encodedCart)));
          const parsed = JSON.parse(decodedString);
          const initialCart = Array.isArray(parsed) ? parsed : [];
          setOrden(initialCart);
        } catch (e) {
          console.error('Error al decodificar el carrito desde la URL:', e);
          setOrden([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    updateUrl(orden);
  }, [orden]);

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

  // Función para recalcular todos los precios del carrito
  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map(item => {
      // Los paquetes no tienen descuento 2x1
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

  const agregarPizzaCustom = (customPizza) => {
    setOrden((prevOrden) => {
      const idUnico = `custom_pizza_${Date.now()}`;
      const ingredientesNombres = customPizza.ingredientesNombres || [];
      const nombreIngredientes = ingredientesNombres.length > 0 
        ? ingredientesNombres.slice(0, 3).join(', ') + (ingredientesNombres.length > 3 ? '...' : '')
        : 'Personalizada';

      const nuevaPizza = {
        id: idUnico,
        tipoId: 'custom_pizza',
        esCustomPizza: true,
        nombre: `Pizza ${customPizza.nombreTamano} - ${nombreIngredientes}`,
        precioOriginal: customPizza.precio,
        precioUnitario: customPizza.precio,
        cantidad: 1,
        subtotal: customPizza.precio,
        tamano: customPizza.nombreTamano,
        ingredientes: {
          tamano: customPizza.tamano,
          ingredientes: customPizza.ingredientes
        }
      };

      return recalcularPrecios([...prevOrden, nuevaPizza]);
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
              const productoExistente = item.productos.find(p => p.id === id);

              if (productoExistente) {
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: item.productos.map(p =>
                    p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                  )
                };
              } else {
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: [...item.productos, { id, nombre, cantidad: 1 }]
                };
              }
            }
            return item;
          });
        } else {
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${tamano}`,
              tipoId,
              nombre: `${tipoId === 'id_pizza' ? 'Pizza' : 'Marisco'} ${tamano}`,
              precioOriginal,
              precioUnitario: precioOriginal * 0.6,
              cantidad: 1,
              subtotal: precioOriginal * 0.6,
              tamano,
              productos: [{ id, nombre, cantidad: 1 }],
              esPaquete: false
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
              ? { ...item, cantidad: item.cantidad + 1 }
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
              esPaquete: false
            },
          ];
        }
        // No llamar a updateUrl aquí
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
              )
            };
          } else {
            return { ...item, cantidad: nuevaCantidad };
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
              return null;
            }

            return {
              ...item,
              cantidad: item.cantidad - productoAEliminar.cantidad,
              productos: nuevosProductos
            };
          }
          return item;
        }).filter(item => item !== null);
      } else {
        nuevaOrden = prevOrden.filter(
          (item) => !(item.id === id && item.tipoId === tipoId)
        );
      }

      // No llamar a updateUrl aquí
      return recalcularPrecios(nuevaOrden);
    });
  };

  const limpiarCarrito = () => {
    setOrden([]);
  };

  const total = orden.reduce((acc, item) => acc + item.subtotal, 0);

  return {
    orden,
    total,
    agregarAlCarrito,
    agregarPaquete,
    agregarPizzaCustom,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  };
};