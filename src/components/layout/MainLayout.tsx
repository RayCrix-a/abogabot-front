import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import NetworkErrorBoundary from './NetworkErrorBoundary';
import OfflineNotification from './OfflineNotification';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const MainLayout = ({ children, title, description }: MainLayoutProps) => {
  const router = useRouter();
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

  // Efecto para manejar el comportamiento del sidebar en la página de chat
  useEffect(() => {
    if (router.pathname === '/chat') {
      // En la página de chat, inicializar con sidebar cerrado pero PERMITIR que se abra
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
  }, [router.pathname]); // Removido isSidebarOpen de las dependencias

  // Función para alternar el estado del sidebar
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    
    // Emitir evento personalizado para que otros componentes puedan escuchar
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
      detail: { isOpen: newState } 
    }));
  };

  // No renderizar la interfaz hasta que estemos en el cliente
  if (!isMounted) {
    return null;
  }

  // Determinar si estamos en una página que necesita layout especial
  const isSpecialLayout = router.pathname === '/chat';

  // Función para reintentar conexión en caso de error de red
  const handleRetryConnection = () => {
    // Simplemente recarga la página actual
    window.location.reload();
  };

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
        <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300">
          {/* Navbar superior */}
          <Navbar toggleSidebar={toggleSidebar} />          {/* Contenido */}
          <main className={`flex-1 overflow-y-auto bg-dark-lighter ${isSpecialLayout ? 'p-0' : 'p-4'}`}>
            <div className={isSpecialLayout ? 'h-full p-4' : ''}>
              <NetworkErrorBoundary onErrorReset={handleRetryConnection}>
                {children}
              </NetworkErrorBoundary>
            </div>
          </main>
          
          {/* Notificación de desconexión */}
          <OfflineNotification onRetry={handleRetryConnection} />

          {/* Footer - ocultarlo en páginas especiales para maximizar espacio */}
          {!isSpecialLayout && <Footer />}
        </div>
      </div>
    </>
  );
};

export default withAuthenticationRequired(MainLayout);