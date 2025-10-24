// src/services/orderService.js
import api from '@/services/api';

const CATEGORIAS = ['hamburguesas', 'alitas', 'costillas'];

export const fetchProductosPorCategoria = async () => {
  try {
    const [resHamb, resAlis, resCos] = await Promise.all([
      api.get('/prices/hamburguesas'),
      api.get('/prices/alitas'),
      api.get('/prices/costillas'),
    ]);

    // Validar que las respuestas tengan datos
    const hamburguesas = Array.isArray(resHamb.data) ? resHamb.data : [];
    const alitas = Array.isArray(resAlis.data) ? resAlis.data : [];
    const costillas = Array.isArray(resCos.data) ? resCos.data : [];

    console.log('Productos cargados:', { hamburguesas, alitas, costillas });

    return {
      hamburguesas,
      alitas,
      costillas,
    };
  } catch (error) {
    console.error('Error al cargar productos:', error);
    // Retornar estructura vacía en caso de error
    return {
      hamburguesas: [],
      alitas: [],
      costillas: [],
    };
  }
};

export const enviarOrdenAPI = async (orden, id_suc = 1, id_cliente = 1) => {
  if (orden.length === 0) {
    throw new Error('La orden está vacía');
  }

  const groupedItems = orden.reduce((acc, item) => {
    if (!acc[item.tipoId]) {
      acc[item.tipoId] = { [item.tipoId]: item.id, cantidad: 0 };
    }
    acc[item.tipoId].cantidad += item.cantidad;
    return acc;
  }, {});

  const ordenParaEnviar = {
    id_suc,
    id_cliente,
    items: Object.values(groupedItems),
  };

  console.log('Enviando orden:', ordenParaEnviar);
  
  const response = await api.post('/pos/', ordenParaEnviar);
  return response.data;
};

export { CATEGORIAS };