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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // 1. Identificar y agrupar Pizzas Custom por tamaño
    const customPizzasGrouped = {};
    const customPizzaIds = new Set();

    nuevaOrden.forEach(item => {
      if (item.esCustomPizza) {
        const tamano = item.ingredientes?.tamano || 'unknown'; 
        // Nota: 'tamano' en ingredientes es el ID del tamaño, 'tamano' en item root es el nombre.
        // Usaremos el ID del tamaño si existe en ingredientes para agrupar, es más seguro.
        // Si no, fallback al nombre.
        const key = item.ingredientes?.tamano || item.tamano;
        
        if (!customPizzasGrouped[key]) {
          customPizzasGrouped[key] = [];
        }
        customPizzasGrouped[key].push(item);
        customPizzaIds.add(item.id);
      }
    });

    // 2. Calcular costos para Custom Pizzas
    const customPizzaCosts = {}; // id -> { subtotal, precioUnitario }

    Object.keys(customPizzasGrouped).forEach(key => {
      const items = customPizzasGrouped[key];
      
      // Expandir items a unidades individuales para ordenar por precio
      const unidades = [];
      items.forEach(item => {
        for (let i = 0; i < item.cantidad; i++) {
          unidades.push({
            itemId: item.id,
            precio: item.precioOriginal
          });
        }
      });

      // Ordenar por precio descendente (primero los caros, para cobrarlos en pares)
      unidades.sort((a, b) => b.precio - a.precio);

      const pares = Math.floor(unidades.length / 2);
      const sobra = unidades.length % 2;

      // Aplicar lógica:
      // Pares: El primero (caro) se paga full, el segundo (barato) es gratis (2x1)
      // Sobra: Se paga con 40% de descuento (x 0.6)
      
      const costosPorUnitId = unidades.map(() => 0); // Placeholder

      let unitIndex = 0;
      
      // Procesar pares
      for (let i = 0; i < pares; i++) {
        // Primer item del par (Caro) - Paga 100%
        costosPorUnitId[unitIndex] = unidades[unitIndex].precio;
        unitIndex++;
        
        // Segundo item del par (Barato) - Paga 0%
        costosPorUnitId[unitIndex] = 0;
        unitIndex++;
      }

      // Procesar sobra
      if (sobra > 0) {
        costosPorUnitId[unitIndex] = unidades[unitIndex].precio * 0.6;
        unitIndex++;
      }

      // Re-agregar costos a los items originales
      unidades.forEach((u, idx) => {
        if (!customPizzaCosts[u.itemId]) {
          customPizzaCosts[u.itemId] = { total: 0, count: 0 };
        }
        customPizzaCosts[u.itemId].total += costosPorUnitId[idx];
        customPizzaCosts[u.itemId].count += 1;
      });
    });

    return nuevaOrden.map(item => {
      // Caso 1: Custom Pizza (Calculado arriba)
      if (item.esCustomPizza) {
        const costData = customPizzaCosts[item.id];
        if (costData) {
          return {
            ...item,
            subtotal: costData.total,
            precioUnitario: item.cantidad > 0 ? (costData.total / item.cantidad) : 0
          };
        }
        return item; // Should not happen if logic is correct
      }

      // Caso 2: Paquetes (Sin cambios)
      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad
        };
      }

      // Caso 3: Items normales
      const categoriasConDescuento = ['id_pizza', 'id_maris'];

      if (!categoriasConDescuento.includes(item.tipoId)) {
        return {
          ...item,
          precioUnitario: item.precioOriginal,
          subtotal: item.precioOriginal * item.cantidad
        };
      }

      // Normales con descuento (Pizzas normales, Mariscos)
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
      
      // Lógica específica para agrupar id_rect en grupos de 4
      if (tipoId === 'id_rec') {
        const tamano = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
        // Buscar un grupo existente que tenga menos de 4 items
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete && item.cantidad < 4
        );

        let nuevaOrden;

        if (grupoExistente) {
           nuevaOrden = prevOrden.map((item) => {
             if (item.id === grupoExistente.id) {
               const productoExistente = item.productos.find(p => p.id === id);
               let nuevosProductos;
               if (productoExistente) {
                 nuevosProductos = item.productos.map(p => 
                   p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                 );
               } else {
                 nuevosProductos = [...item.productos, { id, nombre, cantidad: 1 }];
               }
               return {
                 ...item,
                 cantidad: item.cantidad + 1,
                 productos: nuevosProductos
               };
             }
             return item;
           });
        } else {
           // Crear nuevo grupo
           nuevaOrden = [
             ...prevOrden,
             {
               id: `${tipoId}_${tamano}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: `Rectangular ${tamano}`,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1,
               subtotal: precioOriginal,
               tamano,
               productos: [{ id, nombre, cantidad: 1 }],
               esPaquete: false
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

      // Lógica específica para agrupar id_barr e id_magno en grupos de 2
      if (tipoId === 'id_barr' || tipoId === 'id_magno') {
        const tamano = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
        // Buscar un grupo existente que tenga menos de 2 items
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && item.tamano === tamano && !item.esPaquete && item.cantidad < 2
        );

        let nuevaOrden;

        if (grupoExistente) {
           nuevaOrden = prevOrden.map((item) => {
             if (item.id === grupoExistente.id) {
               const productoExistente = item.productos.find(p => p.id === id);
               let nuevosProductos;
               if (productoExistente) {
                 nuevosProductos = item.productos.map(p => 
                   p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                 );
               } else {
                 nuevosProductos = [...item.productos, { id, nombre, cantidad: 1 }];
               }
               return {
                 ...item,
                 cantidad: item.cantidad + 1,
                 productos: nuevosProductos
               };
             }
             return item;
           });
        } else {
           // Crear nuevo grupo
           nuevaOrden = [
             ...prevOrden,
             {
               id: `${tipoId}_${tamano}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: `${tipoId === 'id_barr' ? 'Barra' : 'Magno'} ${tamano}`,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1,
               subtotal: precioOriginal,
               tamano,
               productos: [{ id, nombre, cantidad: 1 }],
               esPaquete: false
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

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