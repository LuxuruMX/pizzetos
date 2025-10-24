'use client';

import { useState, useEffect } from 'react';
import { fetchProductosPorCategoria, enviarOrdenAPI, CATEGORIAS } from '@/services/orderService';
import { useCart } from '@/hooks/useCart';
import CartSection from '@/components/ui/CartSection';
import ProductsSection from '@/components/ui/ProductsSection';

const POS = () => {
  const [productos, setProductos] = useState({
    hamburguesas: [],
    alitas: [],
    costillas: [],
  });
  const [categoriaActiva, setCategoriaActiva] = useState('hamburguesas');
  const [loading, setLoading] = useState(true);

  const {
    orden,
    total,
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
  } = useCart();

  // Cargar productos al montar
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        const data = await fetchProductosPorCategoria();
        setProductos(data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        // No mostramos alert aquí porque el servicio ya maneja el error
        // y retorna arrays vacíos
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Enviar orden
  const handleEnviarOrden = async () => {
    try {
      await enviarOrdenAPI(orden);
      limpiarCarrito();
      alert('Orden enviada correctamente.');
    } catch (error) {
      alert(error.message || 'Hubo un error al enviar la orden.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-xl">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-100 min-h-screen flex">
      <CartSection
        orden={orden}
        total={total}
        onUpdateQuantity={actualizarCantidad}
        onRemove={eliminarDelCarrito}
        onEnviarOrden={handleEnviarOrden}
      />

      <ProductsSection
        categorias={CATEGORIAS}
        categoriaActiva={categoriaActiva}
        onCategoriaChange={setCategoriaActiva}
        productos={productos[categoriaActiva] || []}
        onAddToCart={agregarAlCarrito}
      />
    </div>
  );
};

export default POS;