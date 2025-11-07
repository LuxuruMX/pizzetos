import { useState } from 'react';

export const useCart = () => {
  const [orden, setOrden] = useState([]);

  // Función para calcular el precio y subtotal con descuento
  const calcularPrecioYSubtotal = (producto, tipoId, cantidad, ordenActual) => {
    // Solo aplicar descuentos a pizzas y mariscos
    const categoriasConDescuento = ['id_pizza', 'id_maris'];
    
    const precioBase = parseFloat(producto.precio);
    
    if (!categoriasConDescuento.includes(tipoId)) {
      return {
        precioUnitario: precioBase,
        subtotal: precioBase * cantidad
      };
    }

    // Obtener el tamaño del producto
    const tamanoActual = producto.subcategoria || producto.tamano || producto.tamaño;
    
    // Contar cuántos productos del mismo tamaño hay en el carrito
    let totalMismoTamano = 0;
    
    ordenActual.forEach(item => {
      if (!categoriasConDescuento.includes(item.tipoId)) return;
      const tamanoItem = item.tamano;
      if (tamanoItem === tamanoActual) {
        totalMismoTamano += item.cantidad;
      }
    });

    // Si hay 2 o más del mismo tamaño: 2x1 al precio original
    // Si hay menos de 2: aplicar descuento del 40%
    if (totalMismoTamano >= 2) {
      // Calcular cuántas promociones 2x1 hay
      const pares = Math.floor(totalMismoTamano / 2);
      const sueltos = totalMismoTamano % 2;
      
      // Subtotal: (pares × precio original) + (sueltos × precio con descuento)
      const subtotal = (pares * precioBase) + (sueltos * precioBase * 0.6);
      
      // Precio unitario promedio (para mostrar)
      const precioUnitario = subtotal / totalMismoTamano;
      
      return {
        precioUnitario,
        subtotal
      };
    } else {
      // Menos de 2: aplicar descuento del 40%
      const precioConDescuento = precioBase * 0.6;
      return {
        precioUnitario: precioConDescuento,
        subtotal: precioConDescuento * cantidad
      };
    }
  };

  // Función para recalcular todos los precios del carrito
  const recalcularPrecios = (nuevaOrden) => {
    // Agrupar por tamaño para calcular correctamente
    const itemsPorTamano = {};
    
    nuevaOrden.forEach(item => {
      const categoriasConDescuento = ['id_pizza', 'id_maris'];
      if (categoriasConDescuento.includes(item.tipoId)) {
        const key = `${item.tipoId}_${item.tamano}`;
        if (!itemsPorTamano[key]) {
          itemsPorTamano[key] = [];
        }
        itemsPorTamano[key].push(item);
      }
    });

    return nuevaOrden.map(item => {
      const { precioUnitario, subtotal } = calcularPrecioYSubtotal(
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
        subtotal
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
            precioUnitario: precioOriginal * 0.6,
            cantidad: 1,
            subtotal: precioOriginal * 0.6,
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