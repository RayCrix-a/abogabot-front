import { useEffect } from 'react';

/**
 * Hook para detectar clics fuera de un elemento
 * @param {React.RefObject} ref - Referencia al elemento a monitorear
 * @param {Function} callback - Función a ejecutar cuando se detecta un clic fuera
 */
export const useDetectClickOutside = (ref : any, callback : any) => {
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    // Agregar event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Limpiar event listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};
