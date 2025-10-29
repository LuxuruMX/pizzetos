'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { 
  FaHome, 
  FaDrumstickBite, 
  FaHamburger, 
  FaFish,
  FaGlassWhiskey,
  FaUtensils,
  FaChevronDown,
  FaChevronRight,
  FaUser,
  FaCodeBranch,
  FaShoppingBasket,
  FaPizzaSlice
} from 'react-icons/fa';
import { GrResources } from "react-icons/gr";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { TbHierarchy3 } from "react-icons/tb";
import { FaMoneyBills } from "react-icons/fa6";

// Configuración del menú con permisos asociados
const menuConfig = [
  { name: 'Dashboard', path: '/dashboard', icon: FaHome, permiso: null },
  { 
    name: 'Productos', 
    icon: FaUtensils,
    permiso: 'ver_producto',
    submenu: [
      { name: 'Pizzas', path: '/productos/pizzas', icon: FaPizzaSlice },
      { name: 'Alitas', path: '/productos/alitas', icon: FaDrumstickBite },
      { name: 'Costillas', path: '/productos/costillas', icon: FaDrumstickBite },
      { name: 'Hamburguesas', path: '/productos/hamburguesas', icon: FaHamburger },
      { name: 'Magno', path: '/productos/magno', icon: FaUtensils },
      { name: 'Papas', path: '/productos/papas', icon: FaUtensils },
      { name: 'Mariscos', path: '/productos/mariscos', icon: FaFish },
      { name: 'Rectangular', path: '/productos/rectangular', icon: FaUtensils },
      { name: 'Refrescos', path: '/productos/refrescos', icon: FaGlassWhiskey },
      { name: 'Spaguetty', path: '/productos/spaguetty', icon: FaUtensils },
      { name: 'Especialidad', path: '/productos/especialidad', icon: FaUtensils },
      { name: 'Barra', path: '/productos/barra', icon: FaGlassWhiskey },
    ]
  },
  { 
    name: 'Empleados', 
    path: '/empleados', 
    icon: FaUser,
    permiso: 'ver_empleado'
  },
  {
    name: 'Recursos',
    icon: GrResources,
    permiso: 'ver_recurso',
    submenu: [
      { name: 'Categorias', path: '/recursos/categorias', icon: BiSolidCategoryAlt },
      { name: 'Sucursales', path: '/recursos/sucursales',  icon: FaCodeBranch },
      { name: 'Cargos', path: '/recursos/cargos', icon: TbHierarchy3 },
    ]
  },
  { 
    name: 'POS', 
    path: '/pos', 
    icon: FaShoppingBasket,
    permiso: 'ver_venta'
  },
  { 
    name: 'Gastos', 
    path: '/gastos', 
    icon: FaMoneyBills,
    permiso: 'ver_venta'
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});
  const [mounted, setMounted] = useState(false);
  const [userPermisos, setUserPermisos] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserPermisos(decoded.permisos || {});
        } catch (e) {
          console.error('Token inválido o expirado', e);
        }
      }
    }
  }, []);

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Filtrar menús según permisos
  const visibleMenus = menuConfig.filter(item => {
    if (!item.permiso) return true; // Si no requiere permiso, siempre visible
    return userPermisos?.[item.permiso] === true;
  });

  // Mostrar loading mientras se carga el token
  if (!mounted || userPermisos === null) {
    return (
      <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-400">Pizzetos</h1>
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-yellow-400">Pizzetos</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>

      <nav className="space-y-2">
        {visibleMenus.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              <div>
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