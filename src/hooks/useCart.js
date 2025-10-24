import { useState, useEffect, useCallback } from 'react';

export const useCart = () => {
  const [orden, setOrden] = useState([]);
  const [total, setTotal] = useState(0);

  // Recalcular total cuando cambia la orden
  useEffect(() => {
    const nuevoTotal = orden.reduce((acc, item) => acc + item.subtotal, 0);
    setTotal(nuevoTotal);
  }, [orden]);

  const agregarAlCarrito = useCallback((producto, tipoId) => {
    const idProducto = producto[tipoId];
    const precioNumerico = parseFloat(producto.precio);

    setOrden(prevOrden => {
      const itemExistenteIndex = prevOrden.findIndex(
        item => item.id === idProducto && item.tipoId === tipoId
      );

      if (itemExistenteIndex > -1) {
        const nuevaOrden = [...prevOrden];
        const item = nuevaOrden[itemExistenteIndex];
        nuevaOrden[itemExistenteIndex] = {
          ...item,
          cantidad: item.cantidad + 1,
          subtotal: (item.cantidad + 1) * item.precioUnitario,
        };
        return nuevaOrden;
      }

      return [
        ...prevOrden,
        {
          id: idProducto,
          nombre: producto.nombre,
          precioUnitario: precioNumerico,
          cantidad: 1,
          subtotal: precioNumerico,
          tipoId,
        },
      ];
    });
  }, []);

  const actualizarCantidad = useCallback((id, tipoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id, tipoId);
      return;
    }

    setOrden(prevOrden =>
      prevOrden.map(item => {
        if (item.id === id && item.tipoId === tipoId) {
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        }
        return item;
      })
    );
  }, []);

  const eliminarDelCarrito = useCallback((id, tipoId) => {
    setOrden(prevOrden =>
      prevOrden.filter(item => !(item.id === id && item.tipoId === tipoId))
    );
  }, []);

  const limpiarCarrito = useCallback(() => {
    setOrden([]);
  }, []);

  return {
    orden,
    total,
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  };
};