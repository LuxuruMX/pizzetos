import api from './api';

export const productsService = {
  // Obtener todos los productos de una categoría
  async getAll(categoria) {
    const response = await api.get(`/ventas/${categoria}/`);
    return response.data;
  },

  // Obtener un producto por ID
  async getById(categoria, id) {
    const response = await api.get(`/ventas/${categoria}/${id}`);
    return response.data;
  },

  // Crear un nuevo producto
  async create(categoria, data) {
    const response = await api.post(`/ventas/${categoria}/`, data);
    return response.data;
  },

  // Actualizar un producto
  async update(categoria, id, data) {
    const response = await api.put(`/ventas/${categoria}/${id}`, data);
    return response.data;
  },

  // Eliminar un producto
  async delete(categoria, id) {
    const response = await api.delete(`/ventas/${categoria}/${id}`);
    return response.data;
  },
};
