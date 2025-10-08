'use client';

import { useAuth } from '@/hooks/useAuth';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function NavBarTop() {
  const { logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-800">
          Panel de Administración
        </h2>

        {/* Usuario y logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <FaUser className="text-gray-500" />
            <span className="text-sm font-medium">Admin</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <FaSignOutAlt />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}