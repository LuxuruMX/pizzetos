import api from '@/services/api';
import {getSucursalFromToken} from '@/services/jwt';

const CATEGORIAS = ['pizzas', 'hamburguesas', 'alitas', 'costillas', 'spaguetty', 'papas', 'rectangular', 'barra', 'mariscos', 'refrescos', 'magno'];

// Estado de la caché
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const fetchProductosPorCategoria = async (force = false) => {
  const now = Date.now();

  if (cachedData && lastFetchTime && !force) {
    if (now - lastFetchTime < CACHE_DURATION) {
      console.log('Usando datos de caché');
      return cachedData;
    }
  }

  console.log('Actualizando datos desde la API...');
  try {
    const [
      ResPizza, resHamb, resAlis, resCos, resSpag, resPapa,
      ResRec, ResBarr, ResMar, ResRefr, ResMag
    ] = await Promise.all([
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

    cachedData = {
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

    lastFetchTime = now;

    return cachedData;
  } catch (error) {
    console.error('Error al cargar productos:', error);
    if (cachedData) {
      console.warn('Devuelta datos de caché debido a error.');
      return cachedData; // Devolver caché si falla la actualización
    }
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

// Opcional: función para invalidar la caché manualmente
export const invalidateCache = () => {
  cachedData = null;
  lastFetchTime = null;
  console.log('Caché invalidada.');
};


export const fetchDetalleVenta = async (idVenta) => {
  try {
    const response = await api.get(`/pos/pedidos-cocina/${idVenta}/detalle`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de venta:', error);
    throw new Error('No se pudo cargar el detalle del pedido');
  }
};



export const actualizarPedidoCocina = async (idVenta, datos) => {
  try {
    const payload = {
      status: datos.status,
      productos: datos.productos.map(prod => ({
        id_producto: prod.id_producto,
        status: prod.status,
        cantidad: prod.cantidad,
        // Incluir otros campos según tu backend
        ...(prod.tipo && { tipo: prod.tipo }),
        ...(prod.nombre && { nombre: prod.nombre }),
        ...(prod.precio && { precio: prod.precio })
      }))
    };

    // Agregar comentarios solo si existen
    if (datos.comentarios && datos.comentarios.trim()) {
      payload.comentarios = datos.comentarios.trim();
    }

    const response = await api.patch(`/pos/pedidos-cocina/${idVenta}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar pedido:', error.response?.data || error.message);
    
    if (error.response?.data?.detail) {
      const detalles = error.response.data.detail;
      if (Array.isArray(detalles)) {
        console.error('Errores de validación:');
        detalles.forEach(err => {
          console.error(`- Campo: ${err.loc?.join(' > ')}`);
          console.error(`  Mensaje: ${err.msg}`);
        });
      }
    }
    
    throw new Error(error.response?.data?.message || 'Error al actualizar el pedido');
  }
};


export const enviarOrdenAPI = async (orden, id_cliente, comentarios = '') => {
  if (orden.length === 0) {
    throw new Error('La orden está vacía');
  }

  const id_suc = getSucursalFromToken();

  // Construir el array de items según el formato del backend
  const items = orden.flatMap(item => {
    // Si es un paquete, manejar de manera especial
    if (item.esPaquete) {
      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        id_paquete: item.datoPaquete.id_paquete,
        id_refresco: item.datoPaquete.id_refresco
      };

      // Agregar campos opcionales solo si existen
      if (item.datoPaquete.detalle_paquete) {
        itemData.detalle_paquete = item.datoPaquete.detalle_paquete;
      }
      if (item.datoPaquete.id_pizza) {
        itemData.id_pizza = parseInt(item.datoPaquete.id_pizza);
      }
      if (item.datoPaquete.id_hamb) {
        itemData.id_hamb = parseInt(item.datoPaquete.id_hamb);
      }
      if (item.datoPaquete.id_alis) {
        itemData.id_alis = parseInt(item.datoPaquete.id_alis);
      }

      return itemData;
    }
    
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

  // Agregar comentarios solo si existen
  if (comentarios && comentarios.trim()) {
    ordenParaEnviar.comentarios = comentarios.trim();
  }

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