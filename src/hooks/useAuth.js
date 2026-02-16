'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setUser({ token });
    }
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      console.log('Token:', data.access_token);
      
      setUser({ token: data.access_token });
      router.push('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      let errorMessage = 'Login fallido. Revisa usuario y contraseña';
      
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
           errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
           errorMessage = error.response.data.message;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/login');
  };

  return { user, login, logout };
}