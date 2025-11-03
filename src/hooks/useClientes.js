'use client';

import { useState, useEffect } from 'react';
import { clientesService } from '@/services/clientesService';

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetchClientes remplaza a fetchProducts
  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesService.getAll(); // Llama al servicio de clientes
      setClientes(data);
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err.response?.data?.detail || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta al montar el hook
  useEffect(() => {
    fetchClientes();
  }, []); // Quitamos dependencias si no se recarga dinámicamente

  const createCliente = async (clienteData) => {
    try {
      const nuevoCliente = await clientesService.create(clienteData); // Llama al servicio
      setClientes([...clientes, nuevoCliente]); // Añade el nuevo cliente a la lista
      return { success: true, data: nuevoCliente };
    } catch (err) {
      console.error('Error creating cliente:', err);
      return {
        success: false,
        error: err.response?.data?.detail || 'Error al crear cliente'
      };
    }
  };

  // updateCliente
  const updateCliente = async (id, clienteData) => {
    try {
      const clienteActualizado = await clientesService.update(id, clienteData); // Llama al servicio
      setClientes(clientes.map(c => c.id_clie === id ? clienteActualizado : c)); // Asume que el ID se llama id_clie
      return { success: true, data: clienteActualizado };
    } catch (err) {
      console.error('Error updating cliente:', err);
      return {
        success: false,
        error: err.response?.data?.detail || 'Error al actualizar cliente'
      };
    }
  };

  // deleteCliente
  const deleteCliente = async (id) => {
    try {
      await clientesService.delete(id); // Llama al servicio
      setClientes(clientes.filter(c => c.id_clie !== id)); // Asume que el ID se llama id_clie
      return { success: true };
    } catch (err) {
      console.error('Error deleting cliente:', err);
      return {
        success: false,
        error: err.response?.data?.detail || 'Error al eliminar cliente'
      };
    }
  };

  return {
    clientes, // Cambiamos products por clientes
    loading,
    error,
    fetchClientes, // Nuevo nombre
    createCliente, // Nueva función
    updateCliente, // Nueva función
    deleteCliente, // Nueva función
  };
  
}