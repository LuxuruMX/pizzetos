import api from '@/services/api';

/**
 * Fetch available ingredients for custom pizzas
 * @returns {Promise<Array>} Array of ingredients with id_ingrediente and nombre
 */
export const fetchIngredientes = async () => {
  try {
    const response = await api.get('/prices/ingredientes');
    return response.data;
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    throw new Error('No se pudieron cargar los ingredientes');
  }
};

/**
 * Fetch available pizza sizes and prices
 * @returns {Promise<Array>} Array of sizes with id_tamañop, tamano, and precio
 */
export const fetchTamanosPizzas = async () => {
  try {
    const response = await api.get('/prices/tamanosPizzas');
    return response.data;
  } catch (error) {
    console.error('Error fetching pizza sizes:', error);
    throw new Error('No se pudieron cargar los tamaños de pizza');
  }
};
