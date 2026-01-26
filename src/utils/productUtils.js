/**
 * Determina el ID del tipo de producto de manera segura y priorizada.
 * Prioriza 'id_pizza' y 'id_maris' para asegurar que la lógica de agrupación se active correctamente.
 * 
 * @param {Object} producto - El objeto del producto
 * @returns {string|undefined} - El key del ID (ej. 'id_pizza', 'id_hamb') o undefined si no encuentra.
 */
export const getProductTypeId = (producto) => {
  if (!producto) return undefined;

  // Lógica priorizada para Pizza y Mariscos (que comparten lógica de agrupación)
  if ('id_pizza' in producto) return 'id_pizza';
  if ('id_maris' in producto) return 'id_maris';
  
  // Para otros tipos, buscar cualquier key que empiece con 'id_'
  // Excluimos 'id_suc' y 'id_producto' si fueran genéricos que no definen el tipo principal
  const keys = Object.keys(producto);
  return keys.find(key => key.startsWith('id_') && key !== 'id_suc');
};
