import { useState, useEffect } from 'react';
import { PRECIOS_ORILLA_QUESO } from '@/config/prices';

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
    // Calcular costos para grupos de Pizzas (Normales, Mariscos, Custom)
    // El grupo se identifica por tipoId === 'pizza_group'
    
    return nuevaOrden.map(item => {
      // Caso 1: Grupo de Pizzas Unificadas
      if (item.tipoId === 'pizza_group') {
        // Expandir todos los productos a unidades individuales para ordenar por precio
        const unidades = [];
        let costoTotalQueso = 0; // Acumular el costo del queso por separado
        
        if (item.productos) {
            item.productos.forEach(prod => {
                // Obtener el precio base (sin queso)
                let precioBase = parseFloat(prod.precio || 0);
                
                // Si tiene queso, restar el costo del queso del precio para obtener el precio base
                if (prod.conQueso) {
                    const sizeName = item.tamano;
                    const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
                        key => key.toLowerCase() === sizeName.toLowerCase()
                    ) || sizeName;
                    const extraPrecio = PRECIOS_ORILLA_QUESO[tamanoKey] || 0;
                    precioBase -= extraPrecio;
                    // Sumar el costo del queso por cada unidad
                    costoTotalQueso += extraPrecio * prod.cantidad;
                }
                
                for (let i = 0; i < prod.cantidad; i++) {
                    unidades.push({
                        precio: precioBase // Usar precio base sin queso para el descuento
                    });
                }
            });
        }

        // Ordenar por precio descendente (primero los caros, para cobrarlos en pares)
        unidades.sort((a, b) => b.precio - a.precio);

        const pares = Math.floor(unidades.length / 2);
        const sobra = unidades.length % 2;
        let nuevoSubtotal = 0;

        let unitIndex = 0;
        
        // Procesar pares (2x1: Se paga el más caro del par)
        for (let i = 0; i < pares; i++) {
            // Primer item del par (Caro) - Paga 100%
            nuevoSubtotal += unidades[unitIndex].precio;
            unitIndex++;
            // Segundo item del par (Barato) - Paga 0%
            unitIndex++;
        }

        // Procesar sobra (Se paga con 40% de descuento -> x 0.6)
        if (sobra > 0) {
            nuevoSubtotal += unidades[unitIndex].precio * 0.6;
            unitIndex++;
        }

        // Sumar el costo del queso DESPUÉS del descuento 2x1
        nuevoSubtotal += costoTotalQueso;

        return {
            ...item,
            subtotal: nuevoSubtotal,
            precioUnitario: unidades.length > 0 ? (nuevoSubtotal / unidades.length) : 0
        };
      }

      // Caso 2: Paquetes (Sin cambios)
      if (item.esPaquete) {
        return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad
        };
      }

      // Caso 3: Otros Grupos (Rec, Barr, Magno)
      // Recalcular subtotal basado en cantidad de GRUPOS, no contenido interno variable
      // (Asumiendo tarifa plana por el grupo, o suma de productos? 
      //  El código original para Rec/Barr/Magno seteaba precioUnitario fijo al crear.
      //  Calculamos subtotal = precioUnitario * cantidad (de grupos))
      
      return {
          ...item,
          subtotal: item.precioUnitario * item.cantidad
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
        idRefresco: paquete.idRefresco,
        detallePaquete: paquete.detallePaquete,
        nombresDetalle: paquete.nombresDetalle,
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
      const tamano = customPizza.nombreTamano || customPizza.tamano;
      const ingredientesNombres = customPizza.ingredientesNombres || [];
      const nombreIngredientes = ingredientesNombres.length > 0 
        ? ingredientesNombres.slice(0, 3).join(', ') + (ingredientesNombres.length > 3 ? '...' : '')
        : 'Personalizada';
      
      const idProducto = `custom_${Date.now()}`;
      const nombreProducto = `Pizza Custom - ${nombreIngredientes}`;
      const precio = customPizza.precio;

      // Buscar grupo existente por tamaño
      const existingGroupIndex = prevOrden.findIndex(
        item => item.tipoId === 'pizza_group' && item.tamano === tamano
      );

      let nuevaOrden = [...prevOrden];

      if (existingGroupIndex >= 0) {
          // Agregar al grupo existente
          const group = nuevaOrden[existingGroupIndex];
          const nuevosProductos = [
              ...(group.productos || []),
              {
                  id: idProducto,
                  nombre: nombreProducto,
                  precio: precio,
                  cantidad: 1,
                  tipoId: 'custom_pizza', // Guardar tipoId
                  // Guardar detalles extra si es necesario para edición
                  esCustom: true,
                  ingredientes: {
                    tamano: customPizza.tamano,
                    ingredientes: customPizza.ingredientes
                  }
              }
          ];
          
          nuevaOrden[existingGroupIndex] = {
              ...group,
              cantidad: group.cantidad + 1,
              productos: nuevosProductos
          };
      } else {
          // Crear nuevo grupo
          nuevaOrden.push({
              id: `pizza_group_${tamano}`,
              tipoId: 'pizza_group',
              nombre: `Pizzas ${tamano}`,
              tamano: tamano,
              esPaquete: false,
              cantidad: 1,
              precioUnitario: 0, // Se calcula en recalcular
              subtotal: 0,
              productos: [{
                  id: idProducto,
                  nombre: nombreProducto,
                  precio: precio,
                  cantidad: 1,
                  tipoId: 'custom_pizza', // Guardar tipoId
                  esCustom: true,
                  ingredientes: {
                    tamano: customPizza.tamano,
                    ingredientes: customPizza.ingredientes
                  }
              }]
          });
      }

      return recalcularPrecios(nuevaOrden);
    });
  };


  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamanoRaw = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
    const tamano = typeof tamanoRaw === 'string' ? tamanoRaw.trim() : tamanoRaw;
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      
      // Lógica específica para agrupar id_rect en grupos de 4
      if (tipoId === 'id_rec') {
        // Buscar un grupo existente que tenga menos de 4 items (slices)
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && !item.esPaquete && 
          (item.productos.reduce((acc, p) => acc + p.cantidad, 0) < 4)
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
                 // No incrementamos item.cantidad, esa es la cantidad de GRUPOS
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
               id: `${tipoId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: `Rectangular`,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1, // 1 Grupo
               subtotal: precioOriginal,
               productos: [{ id, nombre, cantidad: 1 }],
               esPaquete: false
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

      // Lógica específica para agrupar id_barr e id_magno en grupos de 2
      if (tipoId === 'id_barr' || tipoId === 'id_magno') {
        // Buscar un grupo existente que tenga menos de 2 items
        const grupoExistente = prevOrden.find(
          (item) => item.tipoId === tipoId && !item.esPaquete && 
          (item.productos.reduce((acc, p) => acc + p.cantidad, 0) < 2)
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
                 // No incrementamos item.cantidad
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
               id: `${tipoId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
               tipoId,
               nombre: `${tipoId === 'id_barr' ? 'Barra' : 'Magno'}`,
               precioOriginal,
               precioUnitario: precioOriginal,
               cantidad: 1, // 1 Grupo
               subtotal: precioOriginal,
               productos: [{ id, nombre, cantidad: 1 }],
               esPaquete: false
             }
           ];
        }
        return recalcularPrecios(nuevaOrden);
      }

      const categoriasConDescuento = ['id_pizza', 'id_maris'];

      if (categoriasConDescuento.includes(tipoId)) {
        // Lógica UNIFICADA para Pizzas y Mariscos
        const existingGroupIndex = prevOrden.findIndex(
            item => item.tipoId === 'pizza_group' && 
            (typeof item.tamano === 'string' ? item.tamano.trim().toLowerCase() : item.tamano) === 
            (typeof tamano === 'string' ? tamano.trim().toLowerCase() : tamano)
        );

        let nuevaOrden = [...prevOrden];

        if (existingGroupIndex >= 0) {
            // Grupo existe
            const group = nuevaOrden[existingGroupIndex];
            
            // Buscar si ya existe este producto específico en el grupo
            const existingProdIndex = group.productos.findIndex(p => p.id === id);

            let nuevosProductos = [...group.productos];
            if (existingProdIndex >= 0) {
                // Aumentar cantidad del producto existente
                nuevosProductos[existingProdIndex] = {
                    ...nuevosProductos[existingProdIndex],
                    cantidad: nuevosProductos[existingProdIndex].cantidad + 1
                };
            } else {
                // Agregar nuevo producto al grupo
                nuevosProductos.push({
                    id,
                    nombre,
                    precio: precioOriginal,
                    cantidad: 1,
                    tipoId // Guardar tipoId (id_pizza o id_maris)
                });
            }

            nuevaOrden[existingGroupIndex] = {
                ...group,
                cantidad: group.cantidad + 1,
                productos: nuevosProductos
            };

        } else {
            // Crear nuevo grupo de Pizzas
            nuevaOrden.push({
                id: `pizza_group_${tamano}`,
                tipoId: 'pizza_group',
                nombre: `Pizzas ${tamano}`,
                tamano: tamano,
                esPaquete: false,
                cantidad: 1,
                precioUnitario: 0, 
                subtotal: 0,
                productos: [{
                    id,
                    nombre,
                    precio: precioOriginal,
                    cantidad: 1,
                    tipoId // Guardar tipoId
                }]
            });
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
              tamano: tamano,
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

            // Para grupos especiales, la cantidad del padre es la cantidad de GRUPOS, no la suma de producots
            const gruposEspeciales = ['id_rec', 'id_barr', 'id_magno'];
            let nuevaCantidadPadre = item.cantidad + diferencia;
            
            if (gruposEspeciales.includes(item.tipoId)) {
                nuevaCantidadPadre = item.cantidad; // No cambia al mover subproductos
            }

            return {
              ...item,
              cantidad: nuevaCantidadPadre,
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

  const toggleQueso = (id, tipoId, productoId = null) => {
    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) => {
        // Caso específico para pizza_group (donde viven las pizzas ahora)
        if (item.id === id && item.tipoId === 'pizza_group' && item.productos) {
           const sizeName = item.tamano; // El grupo define el tamaño
           // Normalizar nombre de tamaño para buscar en diccionario
           const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
             key => key.toLowerCase() === sizeName.toLowerCase()
           ) || sizeName;
           const extraPrecio = PRECIOS_ORILLA_QUESO[tamanoKey] || 0;

           if (extraPrecio === 0) return item; // No aplica si no hay precio

           const nuevosProductos = [];
           let cantidadAjustada = item.cantidad;

           item.productos.forEach(prod => {
             if (prod.id === productoId) {
                const conQuesoNuevo = !prod.conQueso;
                
                // Si estamos ACTIVANDO el queso y la cantidad es mayor a 1
                if (conQuesoNuevo && prod.cantidad > 1) {
                  // Separar: crear uno sin queso (cantidad - 1) y uno con queso (cantidad 1)
                  
                  // Producto sin queso (cantidad original - 1)
                  nuevosProductos.push({
                    ...prod,
                    cantidad: prod.cantidad - 1,
                    conQueso: false
                  });
                  
                  // Producto con queso (cantidad 1) - crear nuevo ID único
                  nuevosProductos.push({
                    ...prod,
                    id: `${prod.id}_queso_${Date.now()}`,
                    cantidad: 1,
                    conQueso: true,
                    precio: parseFloat(prod.precio) + extraPrecio
                  });
                  
                  // No cambiamos cantidadAjustada porque el total de pizzas sigue igual
                } else {
                  // Si estamos DESACTIVANDO el queso o la cantidad es 1
                  let nuevoPrecio = parseFloat(prod.precio);
                  
                  if (conQuesoNuevo) {
                      nuevoPrecio += extraPrecio;
                  } else {
                      nuevoPrecio -= extraPrecio;
                  }

                  nuevosProductos.push({
                      ...prod,
                      conQueso: conQuesoNuevo,
                      precio: nuevoPrecio
                  });
                }
             } else {
               // Producto no afectado
               nuevosProductos.push(prod);
             }
           });

           return {
               ...item,
               cantidad: cantidadAjustada,
               productos: nuevosProductos
           };
        }
        
        // Caso para items sueltos (si existieran pizzas sueltas fuera de grupo, id_rec, etc.)
        // id_rec / id_barr no pidieron queso, solo pizzas/mariscos
        // Pero si hubiese un id_pizza suelto (legacy logic):
        if (item.id === id && (item.tipoId === 'id_pizza' || item.tipoId === 'id_maris')) {
           const sizeName = item.tamano || 'Grande'; // Fallback
           const tamanoKey = Object.keys(PRECIOS_ORILLA_QUESO).find(
             key => key.toLowerCase() === sizeName.toLowerCase()
           ) || sizeName;
           const extraPrecio = PRECIOS_ORILLA_QUESO[tamanoKey] || 0;
           
           if (extraPrecio === 0) return item;

           const conQuesoNuevo = !item.conQueso;
           let nuevoPrecio = parseFloat(item.precioUnitario);

           if (conQuesoNuevo) {
               nuevoPrecio += extraPrecio;
           } else {
               nuevoPrecio -= extraPrecio;
           }
           
           return {
               ...item,
               conQueso: conQuesoNuevo,
               precioUnitario: nuevoPrecio,
               subtotal: nuevoPrecio * item.cantidad
           };
        }

        return item;
      });

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
    toggleQueso,
    eliminarDelCarrito,
    limpiarCarrito,
  };
};