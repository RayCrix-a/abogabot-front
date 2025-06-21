import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiHome, FiFolder, FiMessageCircle, FiClock, FiSettings, FiActivity, FiUsers } from 'react-icons/fi';
import { useLawsuits } from '@/hooks/useLawsuits';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface RecentCaseItemProps {
  title: string;
  date: string;
  path: string;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const router = useRouter();
  const { lawsuits } = useLawsuits();
  const [isNavigating, setIsNavigating] = useState(false);

  // Efecto para sincronizar el estado del sidebar con localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', isOpen.toString());
  }, [isOpen]);

  // Efecto para manejar la transición suave al navegar a chat legal
  useEffect(() => {
    if (router.pathname === '/chat' && isOpen && !isNavigating) {
      // Solo cerrar automáticamente cuando navegamos POR PRIMERA VEZ a chat
      const isFirstTimeNavigation = !sessionStorage.getItem('chatVisited');
      if (isFirstTimeNavigation) {
        // Agregar un pequeño delay para que la transición sea más suave
        setTimeout(() => {
          onToggle(); // Cerrar sidebar cuando se navega por primera vez a chat legal
        }, 150); // 150ms de delay para transición más suave
        sessionStorage.setItem('chatVisited', 'true');
      }
    }
    
    // Limpiar el flag cuando salimos de chat
    if (router.pathname !== '/chat') {
      sessionStorage.removeItem('chatVisited');
    }

    // Reset del estado de navegación
    setIsNavigating(false);
  }, [router.pathname]); // Removido isOpen y onToggle de las dependencias

  // Filtrar casos recientes (no finalizados)
  const recentCases = lawsuits?.filter(c => c.status !== 'FINALIZED').slice(0, 5) || [];

  // Verificar si una ruta está activa
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  // Manejar clicks en los enlaces para transición más suave
  const handleNavClick = (path: string) => {
    setIsNavigating(true);
    // No hacer nada más aquí, dejar que Next.js maneje la navegación
  };

  // Datos de navegación con Chat Legal
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <FiHome className="w-5 h-5" />
    },
    {
      name: 'Casos',
      path: '/cases',
      icon: <FiFolder className="w-5 h-5" />
    },
    {
      name: 'Chat Legal',
      path: '/chat',
      icon: <FiMessageCircle className="w-5 h-5" />
    },
    {
      name: 'Historial',
      path: '/history',
      icon: <FiClock className="w-5 h-5" />
    },
    {
      name: 'Registro de actividad',
      path: '/activity-log',
      icon: <FiActivity  className="w-5 h-5" />
    },
    {
      name: 'Usuarios, roles y permisos',
      path: '/user-admin',
      icon: <FiUsers className="w-5 h-5" />
    },
    {
      name: 'Configuración',
      path: '/settings',
      icon: <FiSettings className="w-5 h-5" />
    }
  ];

  return (
    <aside
      className={`bg-dark border-r border-gray-800 transition-all duration-500 ease-in-out ${
        isOpen ? 'w-64' : 'w-0 md:w-16'
      } overflow-hidden`}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-dark-light flex items-center justify-center overflow-hidden">
            <img src="/images/logo.png" alt="AbogaBot Logo" className="w-6 h-6" />
          </div>
          {isOpen && (
            <span className="ml-3 text-white font-semibold text-lg transition-opacity duration-300">
              AbogaBot
            </span>
          )}
        </div>

        {/* Navegación */}
        <nav className="mt-5 px-2 flex-grow">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`sidebar-item transition-all duration-200 ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.icon}
                  {isOpen && (
                    <span className="transition-opacity duration-300">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección de casos recientes (solo visible cuando el sidebar está abierto Y no estamos en chat) */}
        {isOpen && router.pathname !== '/chat' && (
          <div className="mt-auto px-3 py-4 border-t border-gray-800 transition-all duration-300">
            <h3 className="text-xs uppercase font-medium text-gray-400 mb-3 tracking-wider">
              Casos recientes
            </h3>
            <ul className="space-y-2">
              {recentCases.length > 0 ? (
                recentCases.map((caseItem) => (
                  <RecentCaseItem
                    key={caseItem.id}
                    title={caseItem.title ?? 'Caso sin Titulo'}
                    date={`Creado: ${new Date(caseItem.createdAt).toLocaleDateString()}`}
                    path={`/cases/${caseItem.id}`}
                  />
                ))
              ) : (
                <li className="text-gray-500 text-sm px-2">No hay casos recientes</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

// Componente para renderizar un caso reciente
const RecentCaseItem = ({ title, date, path }: RecentCaseItemProps) => {
  return (
    <li>
      <Link
        href={path}
        className="block p-2 hover:bg-dark-light rounded-md transition-colors duration-200 text-sm"
      >
        <h4 className="text-white font-medium truncate">{title}</h4>
        <p className="text-xs text-gray-400">{date}</p>
      </Link>
    </li>
  );
};

export default Sidebar;