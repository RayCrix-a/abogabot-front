import React, { useState, useEffect } from 'react';

interface OfflineNotificationProps {
  onRetry?: () => void;
}

const OfflineNotification: React.FC<OfflineNotificationProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Configurar el estado inicial
    setIsOnline(navigator.onLine);

    // Configurar event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpiar event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // No mostrar nada si estamos en línea
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-md shadow-lg z-50">
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Sin conexión al servidor</span>
        </div>
        <p className="text-sm mt-1">La conexión con el servidor se ha perdido.</p>
        {onRetry && (
          <button
            className="mt-2 bg-white text-red-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-50"
            onClick={onRetry}
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineNotification;
