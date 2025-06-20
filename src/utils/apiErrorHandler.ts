import { toast } from 'react-hot-toast'; // Asegúrate de tener esta librería o usar tu propio sistema de notificaciones

// Constantes para los reintentos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

/**
 * Envoltura para las llamadas a API con manejo de errores de red y reintentos
 * @param apiCall - Función de llamada a la API que devuelve una promesa
 * @param retryCount - Número de reintentos actuales (uso interno)
 * @returns Resultado de la llamada API
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    // Intenta la llamada a la API
    return await apiCall();
  } catch (error) {
    // Si es un error de "Failed to fetch" y no hemos alcanzado el máximo de reintentos
    if (error instanceof TypeError && error.message.includes('fetch') && retryCount < MAX_RETRIES) {
      console.warn(`Error de conexión, reintentando (${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Espera un tiempo antes de reintentar
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      
      // Reintenta la llamada
      return withErrorHandling(apiCall, retryCount + 1);
    }

    // Si es un error de red pero ya hemos reintentado el máximo de veces
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Error de conexión persistente después de reintentos:', error);
      toast.error('Error de conexión con el servidor. Por favor, verifica tu conexión a internet o intenta más tarde.');
    }
    
    // Para cualquier otro tipo de error, simplemente lo propagamos
    throw error;
  }
}

/**
 * Verifica el estado de conexión al backend
 * @returns true si hay conexión, false si no
 */
export async function checkBackendConnection(apiBaseUrl: string): Promise<boolean> {
  try {
    // Intenta hacer una solicitud simple al backend
    const response = await fetch(`${apiBaseUrl}/health`, { 
      method: 'GET',
      mode: 'no-cors',
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000)
    });
    return true;
  } catch (error) {
    console.error('Error al verificar la conexión con el backend:', error);
    return false;
  }
}

/**
 * Detector de conexión a internet
 * @returns Un objeto con métodos para verificar y monitorear la conexión
 */
export function useConnectionDetector() {
  // Verifica si el navegador es compatible con la API navigator.onLine
  const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine
    : true;

  // Retorna un objeto con métodos útiles
  return {
    isOnline,
    
    // Función para monitorear cambios en la conexión
    monitorConnection(onStatusChange: (status: boolean) => void) {
      if (typeof window === 'undefined') return () => {}; // No hacer nada en SSR
      
      const handleOnline = () => onStatusChange(true);
      const handleOffline = () => onStatusChange(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Función para limpiar los event listeners
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  };
}
