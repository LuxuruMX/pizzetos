import api from '@/services/api';
import { getSucursalFromToken, getUsuarioIdFromToken } from '@/services/jwt';

export const abrirCaja = async (data) => {
  try {
    const id_suc = getSucursalFromToken();
    const id_emp = getUsuarioIdFromToken();

    const payload = {
      id_suc: parseInt(id_suc),
      id_emp: parseInt(id_emp),
      monto_inicial: parseFloat(data.monto_inicial),
      observaciones_apertura: data.observaciones_apertura || '',
    };

    const response = await api.post('/caja/abrir', payload);
    return response.data;
  } catch (error) {
    console.error('Error al abrir caja:', error);
    
    // 👇 ESTO TE DIRÁ EXACTAMENTE QUÉ CAMPO ESTÁ FALLANDO
    if (error.response?.data?.detail) {
      console.error('❌ Detalle del error:', error.response.data.detail);
    }
    
    throw error;
  }
};

export const cerrarCaja = async (idCaja, data) => {
  try {
    const payload = {
      monto_final: parseFloat(data.monto_final),
      observaciones_cierre: data.observaciones_cierre || '',
    };
    const response = await api.patch(`/caja/cerrar/${idCaja}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    throw error;
  }
};



export const getCaja = async (idCaja) => {
  try {
    const response = await api.get(`/caja/detalles/${idCaja}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener caja:', error);
    throw error;
  }
};

export const getVentasCaja = async (idCaja) => {
  try {
    const response = await api.get(`/caja/ventas/${idCaja}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas de caja:', error);
    throw error;
  }
};

export const getGastosCaja = async (idCaja) => {
  try {
    const response = await api.get(`/gastos/${idCaja}/caja`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener gastos de caja:', error);
    throw error;
  }
};
