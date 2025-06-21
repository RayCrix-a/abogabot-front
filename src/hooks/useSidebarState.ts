import { useState, useEffect } from 'react';

const useSidebarState = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebarOpen');
      setIsSidebarOpen(savedState === 'true');
    };

    checkSidebarState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarOpen') {
        setIsSidebarOpen(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    const handleToggleFromNavbar = () => {
      const currentState = localStorage.getItem('sidebarOpen') === 'true';
      setIsSidebarOpen(!currentState);
    };

    window.addEventListener('toggleSidebar', handleToggleFromNavbar);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
      window.removeEventListener('toggleSidebar', handleToggleFromNavbar);
    };
  }, []);

  return isSidebarOpen;
};

export default useSidebarState;