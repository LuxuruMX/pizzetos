import api from './api';

export const catalogsService = {
  getCategorias: async () => {
    const response = await api.get('/ventas/categoria');
    return response.data;
  },

  getEspecialidades: async () => {
    const response = await api.get('/ventas/especialidad');
    return response.data;
  },

  getTamanosPizza: async () => {
    const response = await api.get('/ventas/tamanos-pizza');
    return response.data;
  },

  getTamanosRefresco: async () => {
    const response = await api.get('/ventas/tamanos-refresco');
    return response.data;
  },

  getCargos: async () => {
    const response = await api.get('/recursos/cargos/');
    return response.data;
  },

  getSucursales: async () => {
    const response = await api.get('/recursos/sucursales');
    return response.data;
  },

  getCargosEmpleados: async () => {
    const response = await api.get('/empleados/cargo');
    return response.data;
  }
};
