import api from '@/services/api';
import {getSucursalFromToken} from '@/services/jwt';

const CATEGORIAS = ['pizzas', 'mariscos', 'rectangular', 'barra', 'refrescos', 'hamburguesas', 'alitas', 'costillas', 'spaguetty', 'papas', 'magno'];

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
      let idPizzas = [];
      
      // Determinar IDs de pizzas
      if (item.datoPaquete.detalle_paquete) {
        // Paquete 1 y 3 usan detalle_paquete como string "4,8"
        idPizzas = item.datoPaquete.detalle_paquete.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (item.datoPaquete.id_pizza) {
        // Paquete 2 usa id_pizza
        idPizzas = [parseInt(item.datoPaquete.id_pizza)];
      } else {
        // Fallback
        idPizzas = [0];
      }

      const paqueteData = {
          id_paquete: parseInt(item.datoPaquete.id_paquete),
          id_pizzas: idPizzas,
          id_refresco: parseInt(item.datoPaquete.id_refresco || 17)
      };

      // Solo agregar hamburguesa si existe y es mayor a 0
      if (item.datoPaquete.id_hamb && parseInt(item.datoPaquete.id_hamb) > 0) {
        paqueteData.id_hamb = parseInt(item.datoPaquete.id_hamb);
      }

      // Solo agregar alitas si existe y es mayor a 0
      if (item.datoPaquete.id_alis && parseInt(item.datoPaquete.id_alis) > 0) {
        paqueteData.id_alis = parseInt(item.datoPaquete.id_alis);
      }

      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        id_paquete: paqueteData,
        status: 1
      };

      return itemData;
    }
    
    // Si es una pizza custom (por ingrediente)
    if (item.esCustomPizza) {
      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        ingredientes: {
          tamano: parseInt(item.ingredientes.tamano),
          ingredientes: item.ingredientes.ingredientes.map(id => parseInt(id))
        },
        status: 1
      };
      return itemData;
    }
    
    // Si es un item agrupado especial (rectangular, barra, magno)
    const gruposEspeciales = ['id_rec', 'id_barr', 'id_magno'];
    if (gruposEspeciales.includes(item.tipoId) && item.productos && Array.isArray(item.productos)) {
      const ids = [];
      item.productos.forEach(p => {
        for (let i = 0; i < p.cantidad; i++) {
          ids.push(parseInt(p.id));
        }
      });

      return {
        cantidad: parseInt(item.cantidad), // Se envía la cantidad de grupos
        precio_unitario: parseFloat(item.precioUnitario),
        [item.tipoId]: ids,
        status: 1
      };
    }

    // NUEVO: Manejo de pizza_group (Unificado)
    if (item.tipoId === 'pizza_group' && item.productos && Array.isArray(item.productos)) {
      // Expandir productos del grupo a items individuales para el backend
      return item.productos.flatMap(producto => {
        const itemsIndividuales = [];
        
        // Repetir por cantidad de producto *interno*
        for (let i = 0; i < producto.cantidad; i++) {
            if (producto.esCustom || producto.tipoId === 'custom_pizza') {
               // Es Pizza Custom
               const itemData = {
                  cantidad: 1, 
                  precio_unitario: parseFloat(producto.precio), 
                  ingredientes: {
                    // Mapeo simple de tamaño string a ID si fuese necesario, pero aquí ya viene el ID o el objeto ingredientes
                    // Si producto.ingredientes.tamano es el ID, lo usamos.
                    tamano: parseInt(producto.ingredientes?.tamano || 0), 
                    ingredientes: producto.ingredientes?.ingredientes?.map(id => parseInt(id)) || []
                  },
                  queso: producto.conQueso ? 1 : 0, // Añadir campo queso
                  status: 1
               };
               itemsIndividuales.push(itemData);
            } else {
               // Es Pizza Normal / Marisco
               // Usamos el tipoId guardado (id_pizza o id_maris)
               const tipoIdReal = producto.tipoId || 'id_pizza'; 
               
               const itemData = {
                  cantidad: 1, 
                  precio_unitario: parseFloat(producto.precio), 
                  [tipoIdReal]: parseInt(producto.id),
                  queso: producto.conQueso ? 1 : 0, // Añadir campo queso
                  status: 1
               };
               itemsIndividuales.push(itemData);
            }
        }
        return itemsIndividuales;
      });
    }

    // Si es un item agrupado (pizzas/mariscos con productos múltiples - LEGACY, pero mantenemos por si acaso)
    if (item.productos && Array.isArray(item.productos)) {
      return item.productos.map(producto => {
        const itemData = {
          cantidad: parseInt(producto.cantidad),
          precio_unitario: parseFloat(item.precioUnitario),
          [item.tipoId]: parseInt(producto.id),
          status: 1
        };
        return itemData;
      });
    } else {
      // Item normal (no agrupado)
      const itemId = parseInt(item.id);
      
      if (isNaN(itemId)) {
        // Ignorar items generados que no sean válidos para backend si se cuelan
        return [];
      }

      const itemData = {
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precioUnitario),
        [item.tipoId]: itemId,
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
      monto: parseFloat(p.monto),
      referencia: p.referencia || ""
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
    // Agregar pagos para domicilio
    ordenParaEnviar.pagos = pagos.map(p => ({
      id_metpago: parseInt(p.id_metpago),
      monto: parseFloat(p.monto),
      referencia: p.referencia || ""
    }));
  } else if (tipo_servicio === 3) { // Pedidos Especiales (Domicilio + Fecha)
    if (datosExtra.id_cliente) {
      ordenParaEnviar.id_cliente = parseInt(datosExtra.id_cliente);
    }
    if (datosExtra.id_direccion) {
      ordenParaEnviar.id_direccion = parseInt(datosExtra.id_direccion);
    }
    if (datosExtra.fecha_entrega) {
      // Formatear a ISO string si no lo es
      const fecha = new Date(datosExtra.fecha_entrega);
      ordenParaEnviar.fecha_entrega = fecha.toISOString();
    }

    ordenParaEnviar.pagos = pagos.map(p => ({
      id_metpago: parseInt(p.id_metpago),
      monto: parseFloat(p.monto),
      referencia: p.referencia || ""
    }));
  }

  // Agregar comentarios solo si existen
  if (comentarios && comentarios.trim()) {
    ordenParaEnviar.comentarios = comentarios.trim();
  }

  try {
    console.log('Payload FINAL enviado a API /pos/:', JSON.stringify(ordenParaEnviar, null, 2));
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

export const pagarVenta = async (id_venta, pagos) => {
  try {
    const payload = {
      id_venta: parseInt(id_venta),
      id_caja: localStorage.getItem('id_caja') ? parseInt(localStorage.getItem('id_caja')) : 0,
      pagos: pagos.map(p => ({
        id_metpago: parseInt(p.id_metpago),
        monto: parseFloat(p.monto),
        referencia: p.referencia || ""
      }))
    };
    
    // Log payload for debugging
    console.log('Enviando pago:', payload);
    
    const response = await api.post('/pos/pagar', payload);
    return response.data;
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    
    // Mejorar el error para mostrar detalles del backend
    if (error.response?.data?.detail) {
      console.error('Detalle del error:', error.response.data.detail);
      throw new Error(typeof error.response.data.detail === 'string' 
        ? error.response.data.detail 
        : JSON.stringify(error.response.data.detail)
      );
    }
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw error;
  }
};

export { CATEGORIAS };