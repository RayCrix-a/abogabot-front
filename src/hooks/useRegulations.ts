import { useMutation } from '@tanstack/react-query';
import { regulationResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Hook para consultar regulaciones basadas en un relato
 */
export const useRegulations = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  // Mutación para consultar regulaciones
  const lookupRegulationsMutation = useMutation({
    mutationFn: async (narrative : string) => {
      try {
        const accessToken = await getAccessTokenSilently();
        const response = await regulationResource.lookupRegulations({ narrative }, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data;
      } catch (error) {
        console.error('Error al consultar regulaciones:', error);
        toast.error('Error al consultar regulaciones');
        throw error;
      }
    }
  });

  return {
    lookupRegulations: lookupRegulationsMutation.mutate,
    regulations: lookupRegulationsMutation.data || [],
    isLoading: lookupRegulationsMutation.isLoading,
    error: lookupRegulationsMutation.error
  };
};