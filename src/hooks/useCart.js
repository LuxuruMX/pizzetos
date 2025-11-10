import { useState } from 'react';

export const useCart = () => {
  const [orden, setOrden] = useState([]);

  // Función para calcular el precio y subtotal con descuento
  const calcularPrecioYSubtotal = (precioBase, cantidad) => {
    // Calcular cuántas promociones 2x1 hay
    const pares = Math.floor(cantidad / 2);
    const sueltos = cantidad % 2;
    
    // Subtotal: (pares × precio original) + (sueltos × precio con descuento)
    const subtotal = (pares * precioBase) + (sueltos * precioBase * 0.6);
    
    // Precio unitario promedio (para mostrar)
    const precioUnitario = subtotal / cantidad;
    
    return {
      precioUnitario,
      subtotal
    };
  };

  // Función para recalcular todos los precios del carrito
  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map(item => {
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

  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamano = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';
    const nombre = producto.nombre;

    setOrden((prevOrden) => {
      const categoriasConDescuento = ['id_pizza', 'id_maris'];
      
      // Si es pizza o marisco, buscar si ya existe un item del mismo tamaño
      if (categoriasConDescuento.includes(tipoId)) {
        const itemMismoTamano = prevOrden.find(
          (item) => item.tipoId === tipoId && item.tamano === tamano
        );

        let nuevaOrden;

        if (itemMismoTamano) {
          // Ya existe un item del mismo tamaño, agregar a la lista de productos
          nuevaOrden = prevOrden.map((item) => {
            if (item.tipoId === tipoId && item.tamano === tamano) {
              // Verificar si el producto específico ya está en la lista
              const productoExistente = item.productos.find(p => p.id === id);
              
              if (productoExistente) {
                // Incrementar cantidad del producto existente
                return {
                  ...item,
                  cantidad: item.cantidad + 1,
                  productos: item.productos.map(p =>
                    p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
                  )
                };
              } else {
                // Agregar nuevo producto a la lista
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
          // No existe, crear nuevo item agrupado
          nuevaOrden = [
            ...prevOrden,
            {
              id: `${tipoId}_${tamano}`, // ID único por tipo y tamaño
              tipoId,
              nombre: `${tipoId === 'id_pizza' ? 'Pizza' : 'Marisco'} ${tamano}`,
              precioOriginal,
              precioUnitario: precioOriginal * 0.6,
              cantidad: 1,
              subtotal: precioOriginal * 0.6,
              tamano,
              productos: [{ id, nombre, cantidad: 1 }] // Lista de productos agrupados
            },
          ];
        }

        return recalcularPrecios(nuevaOrden);
      } else {
        // Para otras categorías, comportamiento normal
        const itemExistente = prevOrden.find(
          (item) => item.id === id && item.tipoId === tipoId
        );

        let nuevaOrden;

        if (itemExistente) {
          nuevaOrden = prevOrden.map((item) =>
            item.id === id && item.tipoId === tipoId
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
              productos: null
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
            // Actualizar cantidad de un producto específico dentro del grupo
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
        // Eliminar un producto específico del grupo
        nuevaOrden = prevOrden.map((item) => {
          if (item.id === id && item.tipoId === tipoId && item.productos) {
            const productoAEliminar = item.productos.find(p => p.id === productoId);
            const nuevosProductos = item.productos.filter(p => p.id !== productoId);
            
            if (nuevosProductos.length === 0) {
              return null; // Marcar para eliminar
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
        // Eliminar item completo
        nuevaOrden = prevOrden.filter(
          (item) => !(item.id === id && item.tipoId === tipoId)
        );
      }

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
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  };
};