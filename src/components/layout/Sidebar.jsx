import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect } from 'react';
import { FiHome, FiFolder, FiClock, FiSettings } from 'react-icons/fi';
import { useLawsuits } from '@/hooks/useLawsuits'; // Cambio aquí

const Sidebar = ({ isOpen, onToggle }) => {
  const router = useRouter();
  const { lawsuits } = useLawsuits(); // Cambio aquí

  // Efecto para sincronizar el estado del sidebar con localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', isOpen);
  }, [isOpen]);

  // Filtrar casos recientes (no finalizados)
  const recentCases = lawsuits?.filter(c => c.status !== 'FINALIZED').slice(0, 5) || [];

  // Verificar si una ruta está activa
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  // Datos de navegación
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
      name: 'Historial',
      path: '/history',
      icon: <FiClock className="w-5 h-5" />
    },
    {
      name: 'Configuración',
      path: '/settings',
      icon: <FiSettings className="w-5 h-5" />
    }
  ];

  return (
    <aside
      className={`bg-dark border-r border-gray-800 transition-all duration-300 ${
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
            <span className="ml-3 text-white font-semibold text-lg">AbogaBot</span>
          )}
        </div>

        {/* Navegación */}
        <nav className="mt-5 px-2 flex-grow">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.icon}
                  {isOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección de casos recientes (solo visible cuando el sidebar está abierto) */}
        {isOpen && (
          <div className="mt-auto px-3 py-4 border-t border-gray-800">
            <h3 className="text-xs uppercase font-medium text-gray-400 mb-3 tracking-wider">
              Casos recientes
            </h3>
            <ul className="space-y-2">
              {recentCases.length > 0 ? (
                recentCases.map((caseItem) => (
                  <RecentCaseItem
                    key={caseItem.id}
                    title={caseItem.subjectMatter} // Cambio aquí
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
const RecentCaseItem = ({ title, date, path }) => {
  return (
    <li>
      <Link
        href={path}
        className="block p-2 hover:bg-dark-light rounded-md transition-colors text-sm"
      >
        <h4 className="text-white font-medium truncate">{title}</h4>
        <p className="text-xs text-gray-400">{date}</p>
      </Link>
    </li>
  );
};

export default Sidebar;