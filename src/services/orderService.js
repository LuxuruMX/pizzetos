// src/services/orderService.js
import api from '@/services/api';

const CATEGORIAS = ['pizzas', 'hamburguesas', 'alitas', 'costillas', 'spaguetty', 'papas', 'rectangular', 'barra', 'mariscos', 'resfrescos', 'paquete1', 'paquete2', 'paquete3', 'magno'];

export const fetchProductosPorCategoria = async () => {
  try {
    const [ResPizza, resHamb, resAlis, resCos, resSpag, resPapa, ResRec, ResBarr, ResMar, ResRefr, ResPaq1, ResPaq2, ResPaq3, ResMag ] = await Promise.all([
      api.get('/prices/pizzas'),
      api.get('/prices/hamburguesas'),
      api.get('/prices/alitas'),
      api.get('/prices/costillas'),
      api.get('/prices/spaguetty'),
      api.get('/prices/papas'),
      api.get('/prices/rectangular'),
      api.get('/prices/barra'),
      api.get('/prices/mariscos'),
      api.get('/prices/refrescos'),
      api.get('/prices/paquete1'),
      api.get('/prices/paquete2'),
      api.get('/prices/paquete3'),
      api.get('/prices/magno'),
    ]);

    // Validar que las respuestas tengan datos
    const hamburguesas = Array.isArray(resHamb.data) ? resHamb.data : [];
    const alitas = Array.isArray(resAlis.data) ? resAlis.data : [];
    const costillas = Array.isArray(resCos.data) ? resCos.data : [];
    const spaguetty = Array.isArray(resSpag.data) ? resSpag.data : [];
    const papas = Array.isArray(resPapa.data) ? resPapa.data : [];
    const rectangular = Array.isArray(ResRec.data) ? ResRec.data : [];
    const barra = Array.isArray(ResBarr.data) ? ResBarr.data : [];
    const mariscos = Array.isArray(ResMar.data) ? ResMar.data : [];
    const resfrescos = Array.isArray(ResRefr.data) ? ResRefr.data : [];
    const paquete1 = Array.isArray(ResPaq1.data) ? ResPaq1.data : [];
    const paquete2 = Array.isArray(ResPaq2.data) ? ResPaq2.data : [];
    const paquete3 = Array.isArray(ResPaq3.data) ? ResPaq3.data : [];
    const magno = Array.isArray(ResMag.data) ? ResMag.data : [];
    const pizzas = Array.isArray(ResPizza.data) ? ResPizza.data : [];

    console.log('Productos cargados:', { hamburguesas, alitas, costillas, spaguetty, papas, rectangular, barra, mariscos, resfrescos, paquete1, paquete2, paquete3, magno, pizzas });

    return {
      hamburguesas,
      alitas,
      costillas,
      spaguetty,
      papas,
      rectangular,
      barra,
      mariscos,
      resfrescos,
      paquete1,
      paquete2,
      paquete3,
      magno,
      pizzas
    };
  } catch (error) {
    console.error('Error al cargar productos:', error);
    // Retornar estructura vacía en caso de error
    return {
      hamburguesas: [],
      alitas: [],
      costillas: [],
      spaguetty: [],
      papas: [],
      rectangular: [],
      barra: [],
      mariscos: [],
      resfrescos: [],
      paquete1: [],
      paquete2: [],
      paquete3: [],
      magno: [],
      pizzas: []
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