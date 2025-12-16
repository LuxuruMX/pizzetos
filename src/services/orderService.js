import api from '@/services/api';
import {getSucursalFromToken} from '@/services/jwt';

const CATEGORIAS = ['pizzas', 'hamburguesas', 'alitas', 'costillas', 'spaguetty', 'papas', 'rectangular', 'barra', 'mariscos', 'refrescos', 'magno'];

// Estado de la caché
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const fetchPizzaDescriptions = async () => {
  try {
    const response = await api.get('/prices/descripciones');
    return response.data;
  } catch (error) {
    console.warn('Error fetching pizza descriptions:', error);
    return [];
  }
};

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
      return cachedData;
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

export const invalidateCache = () => {
  cachedData = null;
  lastFetchTime = null;
  console.log('Caché invalidada.');
};


export const fetchDetalleVenta = async (idVenta) => {
  try {
    const response = await api.get(`/pos/edit/${idVenta}/detalle`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de venta:', error);
    throw new Error('No se pudo cargar el detalle del pedido');
  }
};

/**
 * Actualizar un pedido existente
 * Recibe el payload generado por getPayloadActualizacion() del hook
 */
export const actualizarPedidoCocina = async (idVenta, datos) => {
  try {
    const response = await api.put(`/pos/${idVenta}`, datos);
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

export const enviarOrdenAPI = async (orden, datosExtra = {}, comentarios = '', tipo_servicio = 2, pagos = []) => {
  if (orden.length === 0) {
    throw new Error('La orden está vacía');
  }

  const id_suc = getSucursalFromToken();

  // Construir el array de items según el formato del backend
  const items = orden.flatMap(item => {
    // Si es un paquete
    if (item.esPaquete) {
      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        id_paquete: item.datoPaquete.id_paquete,
        id_refresco: item.datoPaquete.id_refresco,
        status: 1
      };

      // Agregar campos opcionales
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
    
    // Si es un item agrupado (pizzas/mariscos con productos múltiples)
    if (item.productos && Array.isArray(item.productos)) {
      return item.productos.map(producto => {
        const itemData = {
          cantidad: parseInt(producto.cantidad),
          precio_unitario: parseFloat(item.precioUnitario),
          [item.tipoId]: parseInt(producto.id),  // Usa tipoId del item padre
          status: 1
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
        [item.tipoId]: itemId,  // Usa item.tipoId como clave (ej: id_alis, id_hamb)
        status: 1
      };
      return itemData;
    }
  });

  // Calcular el total
  const total = parseFloat(orden.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

  // Construir payload base
  const ordenParaEnviar = {
    id_suc: parseInt(id_suc),
    total,
    status: 0, // El usuario indicó status 1 en el ejemplo
    tipo_servicio: parseInt(tipo_servicio),
    items,
    id_caja: localStorage.getItem('id_caja') ? parseInt(localStorage.getItem('id_caja')) : 0,
  };

  // Agregar campos según tipo de servicio
  if (tipo_servicio === 0) { // Comer aquí
    if (datosExtra.mesa) {
      ordenParaEnviar.mesa = parseInt(datosExtra.mesa);
    }
    if (datosExtra.nombreClie) {
      ordenParaEnviar.nombreClie = datosExtra.nombreClie;
    }
    // No lleva pagos ni id_cliente obligatoriamente
  } else if (tipo_servicio === 1) { // Para llevar
    ordenParaEnviar.pagos = pagos.map(p => ({
      id_metpago: parseInt(p.id_metpago),
      monto: parseFloat(p.monto)
    }));
    if (datosExtra.nombreClie) {
      ordenParaEnviar.nombreClie = datosExtra.nombreClie;
    }
    // No lleva mesa ni id_cliente
  } else if (tipo_servicio === 2) { // Domicilio
    if (datosExtra.id_cliente) {
      ordenParaEnviar.id_cliente = parseInt(datosExtra.id_cliente);
    }
    if (datosExtra.id_direccion) {
      ordenParaEnviar.id_direccion = parseInt(datosExtra.id_direccion);
    } else {
      // Valor por defecto temporal si se requiere, o se omite si el backend lo permite
      ordenParaEnviar.id_direccion = 1; // Hardcoded temporal según ejemplo del usuario
    }
    // No lleva mesa ni pagos
  }

  // Agregar comentarios solo si existen
  if (comentarios && comentarios.trim()) {
    ordenParaEnviar.comentarios = comentarios.trim();
  }

  try {
    const response = await api.post('/pos/', ordenParaEnviar);
    return response.data;
  } catch (error) {
    console.error('Error al enviar orden:', error.response?.data || error.message);
    
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