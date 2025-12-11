import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  // Login
  async login(username, password) {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', '');
    params.append('client_id', '');
    params.append('client_secret', '');

    const response = await axios.post(`${API_URL}/login/`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    return response.data;
  },

  // Logout
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
    }
  },
};