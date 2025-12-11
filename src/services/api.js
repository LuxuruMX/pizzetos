import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type') || 'Bearer';
      
      if (token) {
        config.headers.Authorization = `${tokenType} ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
