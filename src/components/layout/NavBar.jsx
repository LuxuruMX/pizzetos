'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaHome, 
  FaDrumstickBite, 
  FaHamburger, 
  FaFish,
  FaGlassWhiskey,
  FaUtensils,
  FaPalette,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: FaHome },
  { 
    name: 'Productos', 
    icon: FaUtensils,
    submenu: [
      { name: 'Alitas', path: '/productos/alitas', icon: FaDrumstickBite },
      { name: 'Costillas', path: '/productos/costillas', icon: FaDrumstickBite },
      { name: 'Hamburguesas', path: '/productos/hamburguesas', icon: FaHamburger },
      { name: 'Magno', path: '/productos/magno', icon: FaUtensils },
      { name: 'Papas', path: '/productos/papas', icon: FaUtensils },
      { name: 'Mariscos', path: '/productos/mariscos', icon: FaFish },
      { name: 'Rectangulares', path: '/productos/rectangulares', icon: FaUtensils },
      { name: 'Refrescos', path: '/productos/refrescos', icon: FaGlassWhiskey },
      { name: 'Spaguetty', path: '/productos/spaguetty', icon: FaUtensils },
      { name: 'Especialidades', path: '/productos/especialidades', icon: FaUtensils },
      { name: 'Barra', path: '/productos/barra', icon: FaGlassWhiskey },
    ]
  },
  { name: 'Componentes Demo', path: '/componentes-demo', icon: FaPalette },
];

export default function NavBar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-yellow-400">Pizzetos</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              <div>
                {/* Botón para abrir/cerrar submenu */}
                <button
                  onClick={() => toggleMenu(item.name)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="text-lg" />
                    <span>{item.name}</span>
                  </div>
                  {openMenus[item.name] ? (
                    <FaChevronDown className="text-sm" />
                  ) : (
                    <FaChevronRight className="text-sm" />
                  )}
                </button>
                
                {/* Submenu desplegable */}
                {openMenus[item.name] && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.path}
                        href={subitem.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                          pathname === subitem.path
                            ? 'bg-yellow-500 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <subitem.icon className="text-sm" />
                        <span className="text-sm">{subitem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="text-lg" />
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}