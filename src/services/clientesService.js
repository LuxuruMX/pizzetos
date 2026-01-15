import api from './api';

export const clientesService = {
  // Obtener todos los clientes
  async getAll() {
    const response = await api.get('/clientes/'); // Endpoint raíz para clientes
    return response.data;
  },

  // Obtener un cliente por ID
  async getById(id) {
    const response = await api.get(`/clientes/${id}`); // Endpoint para un cliente específico
    return response.data;
  },

  // Crear un nuevo cliente
  async create(data) {
    const response = await api.post('/clientes/', data); // Endpoint para crear
    return response.data;
  },

  // Actualizar un cliente
  async update(id, data) {
    const response = await api.put(`/clientes/${id}`, data); // Endpoint para actualizar
    return response.data;
  },

  // Eliminar un cliente
  async deleteCliente(id) {
    const response = await api.patch(`/clientes/${id}`); // Endpoint para eliminar
    return response.data;
  },

  async addDireccion(id, data) {
    const response = await api.post(`/clientes/${id}/direcciones`, data);
    return response.data;
  },
  async onlyDirecciones(id) {
    const response = await api.get(`/clientes/direccion/${id}`);
    return response.data;
  }
};