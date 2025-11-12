import api from '@/services/api';
import {getSucursalFromToken} from '@/services/jwt';

const CATEGORIAS = ['pizzas', 'hamburguesas', 'alitas', 'costillas', 'spaguetty', 'papas', 'rectangular', 'barra', 'mariscos', 'refrescos', 'magno'];

export const fetchProductosPorCategoria = async () => {
  try {
    const [ResPizza, resHamb, resAlis, resCos, resSpag, resPapa, ResRec, ResBarr, ResMar, ResRefr, ResMag ] = await Promise.all([
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
      api.get('/prices/magno'),
    ]);

    const hamburguesas = Array.isArray(resHamb.data) ? resHamb.data : [];
    const alitas = Array.isArray(resAlis.data) ? resAlis.data : [];
    const costillas = Array.isArray(resCos.data) ? resCos.data : [];
    const spaguetty = Array.isArray(resSpag.data) ? resSpag.data : [];
    const papas = Array.isArray(resPapa.data) ? resPapa.data : [];
    const rectangular = Array.isArray(ResRec.data) ? ResRec.data : [];
    const barra = Array.isArray(ResBarr.data) ? ResBarr.data : [];
    const mariscos = Array.isArray(ResMar.data) ? ResMar.data : [];
    const refrescos = Array.isArray(ResRefr.data) ? ResRefr.data : [];
    const magno = Array.isArray(ResMag.data) ? ResMag.data : [];
    const pizzas = Array.isArray(ResPizza.data) ? ResPizza.data : [];


    return {
      hamburguesas,
      alitas,
      costillas,
      spaguetty,
      papas,
      rectangular,
      barra,
      mariscos,
      refrescos,
      magno,
      pizzas
    };
  } catch (error) {
    console.error('Error al cargar productos:', error);
    return {
      hamburguesas: [],
      alitas: [],
      costillas: [],
      spaguetty: [],
      papas: [],
      rectangular: [],
      barra: [],
      mariscos: [],
      refrescos: [],
      magno: [],
      pizzas: []
    };
  }
};

export const enviarOrdenAPI = async (orden, id_cliente) => {
  if (orden.length === 0) {
    throw new Error('La orden está vacía');
  }

  const id_suc = getSucursalFromToken();

  // Construir el array de items según el formato del backend
  const items = orden.flatMap(item => {
    // Verificar si es un item agrupado (pizzas o mariscos con productos múltiples)
    if (item.productos && Array.isArray(item.productos)) {
      // Expandir cada producto del grupo en un item separado
      return item.productos.map(producto => {
        const itemData = {
          cantidad: parseInt(producto.cantidad),
          precio_unitario: parseFloat(item.precioUnitario),
          [item.tipoId]: parseInt(producto.id)
        };
        return itemData;
      });
    } else {
      // Item normal (no agrupado)
      const itemId = parseInt(item.id);
      
      if (isNaN(itemId)) {
        console.error('ID inválido encontrado:', item);
        throw new Error(`El ID del producto "${item.nombre}" no es válido: ${item.id}`);
      }

      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        [item.tipoId]: itemId
      };
      return itemData;
    }
  });

  // Calcular el total
  const total = parseFloat(orden.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

  const ordenParaEnviar = {
    id_suc: parseInt(id_suc),
    id_cliente: parseInt(id_cliente),
    total,
    items,
  };

  try {
    const response = await api.post('/pos/', ordenParaEnviar);
    return response.data;
  } catch (error) {
    console.error('Error al enviar orden:', error.response?.data || error.message);
    
    // Mostrar detalles del error de validación
    if (error.response?.data?.detail) {
      const detalles = error.response.data.detail;
      if (Array.isArray(detalles)) {
        console.error('Errores de validación:');
        detalles.forEach(err => {
          console.error(`- Campo: ${err.loc?.join(' > ')}`);
          console.error(`  Tipo: ${err.type}`);
          console.error(`  Mensaje: ${err.msg}`);
          console.error(`  Valor recibido: ${err.input}`);
        });
      }
    }
    
    throw error;
  }
};

export { CATEGORIAS };