import { useQuery } from '@tanstack/react-query';
import { subjectMatterResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Hook para gestionar los tipos de procedimiento
 * Proporciona funciones para obtener los tipos de procedimientos
 */
export const useSubjectMatters = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { 
    data: subjectMatters = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['subjectMatters'],
    queryFn: async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const response = await subjectMatterResource.getAllSubjectMatters({page: undefined, recordsPerPage: undefined},{
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data.results;
      } catch (error) {
        console.error('Error al obtener materias legales:', error);
        toast.error('Error al cargar las materias legales');
        throw error;
      }
    }
  });

  // Transformar los datos al formato que espera el select
  const subjectMatterOptions = subjectMatters.map(type => ({
    value: type.name,
    label: type.description
  }));

  return {
    subjectMatters,
    subjectMatterOptions,
    isLoading,
    error
  };
};