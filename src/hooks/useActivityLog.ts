import { useQuery } from '@tanstack/react-query';
import { activityLogResource, subjectMatterResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Hook para revisar los registros de actividad
 * Proporciona funciones para obtener los registros de actividad
 */
export const useActivityLog = (page: number = 1, recordsPerPage: number = 10) => {
  const { getAccessTokenSilently } = useAuth0();
  const { 
    data: activityLogResponse, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['activityLogs', page, recordsPerPage],
    queryFn: async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const response = await activityLogResource.getAllActivityLogs({page, recordsPerPage},{
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data;
      } catch (error) {
        console.error('Error al obtener los registros de actividad:', error);
        toast.error('Error al obtener los registros de actividad');
        throw error;
      }
    }
  });

  return {
    activityLogResponse,
    isLoading,
    error
  };
};