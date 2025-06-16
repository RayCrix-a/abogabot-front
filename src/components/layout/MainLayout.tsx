import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { withAuthenticationRequired } from '@auth0/auth0-react'

const MainLayout = ({ children, title, description } : {children: any, title: string, description: string}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Efecto para manejar la hidratación y cargar el estado del sidebar
  useEffect(() => {
    setIsMounted(true);
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setIsSidebarOpen(savedSidebarState === 'true');
    }
  }, []);

  // Función para alternar el estado del sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  // No renderizan la interfaz hasta que estemos en el cliente
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} | AbogaBot` : 'AbogaBot - Su asistente legal con AI'}</title>
        <meta 
          name="description" 
          content={description || 'AbogaBot - Plataforma de asistencia legal con inteligencia artificial'} 
        />
      </Head>

      <div className="flex h-screen bg-dark overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Navbar superior */}
          <Navbar toggleSidebar={toggleSidebar} />

          {/* Contenido */}
          <main className="flex-1 overflow-y-auto bg-dark-lighter p-4">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default withAuthenticationRequired(MainLayout);
