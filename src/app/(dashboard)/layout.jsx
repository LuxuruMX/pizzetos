'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import NavBarTop from '@/components/layout/NavBarTop';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* El sidebar sigue igual */}
      <NavBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenedor principal */}
      <div className="flex flex-col">
        {/* NavBarTop fijo */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
          <NavBarTop onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>

        {/* Espacio para el NavBarTop fijo */}
        <div className="pt-16"> {/* Ajusta el padding según la altura de tu NavBarTop */}
          <main className="flex-1 overflow-auto p-4 ml-0"> {/* Ajusta el margen izquierdo para el sidebar */}
            {children}
            <ToastContainer />
          </main>
        </div>
      </div>
    </div>
  );
}