import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMenu, FiBell, FiMoon, FiSun, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const profileRef = useRef(null);

  // Cerrar menú de perfil al hacer clic fuera
  const handleClickOutside = (e) => {
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      setIsProfileOpen(false);
    }
  };

  // Agregar event listener al montar y limpiarlo al desmontar
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Alternar modo oscuro/claro
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Aquí iría la lógica para cambiar el tema
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-dark border-b border-gray-800">
      {/* Parte izquierda */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-light"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Parte derecha */}
      <div className="flex items-center space-x-3">
        {/* Botón Nuevo Caso */}
        {/* <Link href="/cases/new">
          <button className="btn-primary text-sm py-1.5 px-3">
            Nuevo Casooo
          </button>
        </Link> */}

        {/* Botón de tema */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-light"
        >
          {isDarkMode ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>

        {/* Notificaciones */}
        <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-light">
          <FiBell className="w-5 h-5" />
        </button>

        {/* Perfil de usuario */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span className="text-white font-medium hidden md:block">
              {user?.name || 'Usuario'}
            </span>
          </button>

          {/* Menú desplegable de perfil */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-lighter border border-gray-700 rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-light"
                  >
                    <FiUser className="mr-2 w-4 h-4" />
                    Perfil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-light"
                  >
                    <FiSettings className="mr-2 w-4 h-4" />
                    Configuración
                  </Link>
                </li>
                <li className="border-t border-gray-700">
                  <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-dark-light"
                  >
                    <FiLogOut className="mr-2 w-4 h-4" />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
