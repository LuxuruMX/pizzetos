import api from './api';

export const catalogsService = {
  // Obtener categorías
  async getCategorias() {
    try {
      const response = await api.get('/ventas/categoria');
      return response.data;
    } catch (error) {
      console.error('Error fetching categorias:', error);
      throw error;
    }
  },

  // Obtener tamaños de pizza
  async getTamanosPizza() {
    try {
      const response = await api.get('/ventas/tamanos-pizza');
      return response.data;
    } catch (error) {
      console.error('Error fetching tamanos pizza:', error);
      throw error;
    }
  },

  // Obtener tamaños de refresco
  async getTamanosRefresco() {
    try {
      const response = await api.get('/ventas/tamanos-refresco');
      return response.data;
    } catch (error) {
      console.error('Error fetching tamanos refresco:', error);
      throw error;
    }
  },

  // Obtener especialidades
  async getEspecialidades() {
    try {
      const response = await api.get('/ventas/especialidad');
      return response.data;
    } catch (error) {
      console.error('Error fetching especialidades:', error);
      throw error;
    }
  }
};
