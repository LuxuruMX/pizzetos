'use client';

import { useState, useEffect, useRef } from 'react';
import {jwtDecode} from 'jwt-decode';
import { useAuth } from '@/hooks/useAuth';
import { FaSignOutAlt, FaUser, FaCog, FaBars } from 'react-icons/fa';

export default function NavBarTop({ onToggle }) {
  const { logout } = useAuth();
  const [nickname, setNickname] = useState('Usuario');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Leer nickname del token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setNickname(decoded.sub || 'Usuario');
        } catch (e) {
          console.error('Token inválido', e);
          setNickname('Usuario');
        }
      }
    }
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Abrir menú lateral"
          >
            <FaBars className="text-xl" />
          </button>
          {/* Título */}
          <h2 className="text-xl font-semibold text-gray-800">
            Panel de Administración
          </h2>
        </div>

        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none px-2 py-1 rounded-md transition-shadow duration-150 shadow-sm hover:shadow-md focus:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            title="Abrir menú de usuario"
          >
            <FaUser className="text-gray-500" />
            <span className="text-sm font-semibold">{nickname}</span>
          </button>

          {/* Menú desplegable */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                {nickname}
              </div>
              <button
                onClick={() => {
                  // Aquí irá la lógica de configuración más adelante
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaCog className="text-gray-500" />
                Configuración
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-800 flex items-center gap-2"
              >
                <FaSignOutAlt className="text-red-500" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}