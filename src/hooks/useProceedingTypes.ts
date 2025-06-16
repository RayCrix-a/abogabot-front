import { useQuery } from '@tanstack/react-query';
import { proceedingTypeResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Hook para gestionar los tipos de procedimiento
 * Proporciona funciones para obtener los tipos de procedimientos
 */
export const useProceedingTypes = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { 
    data: proceedingTypes = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['proceedingTypes'],
    queryFn: async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const response = await proceedingTypeResource.getAllProceedingTypes({
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data;
      } catch (error) {
        console.error('Error al obtener tipos de procedimiento:', error);
        toast.error('Error al cargar los tipos de procedimiento');
        throw error;
      }
    }
  });

  // Transformar los datos al formato que espera el select
  const proceedingTypeOptions = proceedingTypes.map(type => ({
    value: type.name,
    label: type.description
  }));

  return {
    proceedingTypes,
    proceedingTypeOptions,
    isLoading,
    error
  };
};