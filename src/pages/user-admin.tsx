import { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import ChatBox from '@/components/chat/ChatBox';
import ChatLayout from '@/components/layout/ChatLayout';
import { useChatLegal } from '@/hooks/useChats';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { toast } from 'react-toastify';

const UserAdminPage = () => {
  const { user } = useAuth0();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    

  // Detectar el estado del sidebar desde localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebarOpen');
      setLeftSidebarOpen(savedState === 'true');
    };

    checkSidebarState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarOpen') {
        setLeftSidebarOpen(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleSidebarToggle = (e: CustomEvent) => {
      setLeftSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    const handleToggleFromNavbar = () => {
      const currentState = localStorage.getItem('sidebarOpen') === 'true';
      setLeftSidebarOpen(!currentState);
    };

    window.addEventListener('toggleSidebar', handleToggleFromNavbar);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
      window.removeEventListener('toggleSidebar', handleToggleFromNavbar);
    };
  }, []);


  return (
    <MainLayout title="Administración de usuarios" description="Administra acceso de usuarios al sistema">
      <p>Placeholder</p>
    </MainLayout>
  );
};

export default withAuthenticationRequired(UserAdminPage);