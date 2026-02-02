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

/**
 * Fetch available specialities for Pizza Mitad
 * @returns {Promise<Array>} Array of specialities
 */
export const fetchEspecialidades = async () => {
  try {
    const response = await api.get('/prices/especialidades');
    return response.data;
  } catch (error) {
    console.error('Error fetching specialities:', error);
    throw new Error('No se pudieron cargar las especialidades');
  }
};
