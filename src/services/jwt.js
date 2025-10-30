export const getSucursalFromToken = () => {
  const token = localStorage.getItem('access_token'); // Ajusta la clave si es diferente
  if (!token) {
    throw new Error('No se encontró el token JWT en localStorage.');
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

    const payload = JSON.parse(jsonPayload);
    const id_suc = payload.sucursal; // Ajusta la clave según tu JWT

    if (!id_suc) {
      throw new Error('El token no contiene la información de la sucursal (id_suc).');
    }

    return id_suc;
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    throw new Error('Token inválido o malformado.');
  }
};