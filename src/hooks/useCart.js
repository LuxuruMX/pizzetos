import { useState } from 'react';

export const useCart = () => {
  const [orden, setOrden] = useState([]);

  // Función para calcular el precio con descuento
  const calcularPrecioConDescuento = (producto, tipoId, cantidad, ordenActual) => {
    // Solo aplicar descuentos a pizzas y mariscos
    const categoriasConDescuento = ['id_pizza', 'id_maris'];
    
    if (!categoriasConDescuento.includes(tipoId)) {
      return parseFloat(producto.precio);
    }

    // Obtener el tamaño del producto
    const tamanoActual = producto.subcategoria || producto.tamano || producto.tamaño;
    
    // Contar cuántos productos del mismo tamaño hay en el carrito (incluyendo el actual)
    const productosDelMismoTamano = ordenActual.filter(item => {
      if (!categoriasConDescuento.includes(item.tipoId)) return false;
      const tamanoItem = item.tamano;
      return tamanoItem === tamanoActual;
    });

    // Calcular total de productos del mismo tamaño
    let totalMismoTamano = productosDelMismoTamano.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Si estamos agregando/actualizando, incluir la cantidad actual
    const productoExistente = ordenActual.find(
      item => item.id === producto[tipoId] && item.tipoId === tipoId
    );
    
    if (productoExistente) {
      totalMismoTamano = totalMismoTamano - productoExistente.cantidad + cantidad;
    } else {
      totalMismoTamano += cantidad;
    }

    // Si hay 2 o más del mismo tamaño, precio original (sin descuento)
    // Si hay menos de 2, aplicar descuento del 40%
    const precioBase = parseFloat(producto.precio);
    
    if (totalMismoTamano >= 2) {
      return precioBase; // Precio original
    } else {
      return precioBase * 0.6; // 40% de descuento (paga el 60%)
    }
  };

  // Función para recalcular todos los precios del carrito
  const recalcularPrecios = (nuevaOrden) => {
    return nuevaOrden.map(item => {
      const precioUnitario = calcularPrecioConDescuento(
        { 
          [item.tipoId]: item.id, 
          precio: item.precioOriginal,
          subcategoria: item.tamano,
          tamano: item.tamano,
          tamaño: item.tamano
        },
        item.tipoId,
        item.cantidad,
        nuevaOrden
      );
      
      return {
        ...item,
        precioUnitario,
        subtotal: precioUnitario * item.cantidad
      };
    });
  };

  const agregarAlCarrito = (producto, tipoId) => {
    const id = producto[tipoId];
    const precioOriginal = parseFloat(producto.precio);
    const tamano = producto.subcategoria || producto.tamano || producto.tamaño || 'N/A';

    setOrden((prevOrden) => {
      const itemExistente = prevOrden.find(
        (item) => item.id === id && item.tipoId === tipoId
      );

      let nuevaOrden;

      if (itemExistente) {
        // Si ya existe, incrementar cantidad
        nuevaOrden = prevOrden.map((item) =>
          item.id === id && item.tipoId === tipoId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Si no existe, agregar nuevo item
        nuevaOrden = [
          ...prevOrden,
          {
            id,
            tipoId,
            nombre: producto.nombre,
            precioOriginal,
            precioUnitario: precioOriginal,
            cantidad: 1,
            subtotal: precioOriginal,
            tamano
          },
        ];
      }

      // Recalcular precios de todos los items
      return recalcularPrecios(nuevaOrden);
    });
  };

  const actualizarCantidad = (id, tipoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId);
      return;
    }

    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.map((item) =>
        item.id === id && item.tipoId === tipoId
          ? { ...item, cantidad: nuevaCantidad }
          : item
      );

      // Recalcular precios de todos los items
      return recalcularPrecios(nuevaOrden);
    });
  };

  const eliminarDelCarrito = (id, tipoId) => {
    setOrden((prevOrden) => {
      const nuevaOrden = prevOrden.filter(
        (item) => !(item.id === id && item.tipoId === tipoId)
      );

      // Recalcular precios de todos los items restantes
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