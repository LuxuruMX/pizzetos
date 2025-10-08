'use client';

import { useState, useEffect } from 'react';
import { productsService } from '@/services/productsService';

export function useProducts(categoria) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [categoria]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getAll(categoria);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.detail || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      const newProduct = await productsService.create(categoria, productData);
      setProducts([...products, newProduct]);
      return { success: true, data: newProduct };
    } catch (err) {
      console.error('Error creating product:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Error al crear producto' 
      };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updatedProduct = await productsService.update(categoria, id, productData);
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      return { success: true, data: updatedProduct };
    } catch (err) {
      console.error('Error updating product:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Error al actualizar producto' 
      };
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsService.delete(categoria, id);
      setProducts(products.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting product:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Error al eliminar producto' 
      };
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
