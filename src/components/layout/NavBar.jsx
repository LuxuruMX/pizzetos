'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  FaPizzaSlice,
  FaBorderAll
} from 'react-icons/fa';
import { GrResources } from "react-icons/gr";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { TbHierarchy3, TbTransfer } from "react-icons/tb";
import { FaMoneyBills } from "react-icons/fa6";
import { RiCustomerServiceFill } from "react-icons/ri";
import { MdPointOfSale, MdOutlineBlindsClosed, MdOutlinePendingActions } from "react-icons/md";
import { IoIosAlbums, IoIosSettings } from "react-icons/io";


// Configuración del menú con permisos asociados
const menuConfig = [
  { name: 'Inicio', path: '/dashboard', icon: FaHome, permiso: null },
  {
    name: 'Empleados',
    path: '/empleados',
    icon: FaUser,
    permiso: 'ver_empleado'
  },
  {
    name: 'Corte mensual',
    path: '/corte',
    icon: MdOutlineBlindsClosed,
    permiso: null
  },
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
    name: 'Recursos',
    icon: GrResources,
    permiso: 'ver_recurso',
    submenu: [
      { name: 'Categorias', path: '/recursos/categorias', icon: BiSolidCategoryAlt },
      { name: 'Sucursales', path: '/recursos/sucursales', icon: FaCodeBranch },
      { name: 'Cargos', path: '/recursos/cargos', icon: TbHierarchy3 },
    ]
  },
  { name: 'Clientes', path: '/clientes', icon: RiCustomerServiceFill },
  {
    name: "Venta",
    icon: MdPointOfSale,
    permiso: 'ver_venta',
    submenu: [
      { name: 'Resume', path: '/pedidos/resumen', icon: FaBorderAll, permiso: ['ver_venta'] },
      { name: 'Flujo de caja', path: '/caja', icon: TbTransfer, permiso: ['ver_venta', 'crear_venta'] },
      { name: 'Venta', path: '/pos', icon: FaShoppingBasket, permiso: ['ver_venta', 'crear_venta'] },
      { name: 'Pedidos', path: '/pedidos', icon: IoIosAlbums, permiso: 'ver_venta' },
      { name: 'Anticipos', path: '/pedidos/anticipos', icon: MdOutlinePendingActions, permiso: 'ver_venta' },
      { name: 'Gastos', path: '/gastos', icon: FaMoneyBills, permiso: ['ver_venta', 'crear_venta'] }
    ]
  },
  {
    name: 'Configuración',
    icon: IoIosSettings,
    permiso: null,
    path: '/configuracion'
  }
];

export default function NavBar({ isOpen, onClose }) {
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

  // Helper para verificar permisos (soporta string o array)
  const hasPermission = (permiso) => {
    if (!permiso) return true;
    if (Array.isArray(permiso)) {
      return permiso.every(p => userPermisos?.[p] === true);
    }
    return userPermisos?.[permiso] === true;
  };

  // Filtrar menús según permisos
  const visibleMenus = menuConfig.filter(item => hasPermission(item.permiso));

  // Mostrar loading mientras se carga el token
  if (!mounted || userPermisos === null) {
    return (
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 mb-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-400">Pizzetos</h1>
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 transition-opacity bg-opacity-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto scrollbar-hidden`}>
        <div className="p-4">
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
                        {item.submenu.filter(sub => hasPermission(sub.permiso)).map((subitem) => (
                          <Link
                            key={subitem.path}
                            href={subitem.path}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === subitem.path
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.path
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
        </div>
      </aside>
    </>
  );
}