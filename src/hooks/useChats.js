import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatResource } from '@/lib/apiClient';
import { useAuth0 } from '@auth0/auth0-react'

/**
 * Hook para consultar regulaciones basadas en un relato
 */
export const useChats = () => {
  const { user, getAccessTokenSilently } = useAuth0();
    const queryClient = useQueryClient();
  
    // Query para obtener todas las demandas
    const {
      data: chats,
      isLoading: isLoadingChats,
      error: chatsError,
      refetch: refetchChats
    } = useQuery({
      queryKey: ['chats'],
      queryFn: async () => {
        const accessToken = await getAccessTokenSilently();
        const response = await chatResource.getAllChats({
          headers: {
              Authorization: `Bearer ${accessToken}`,
          }
      });
        return response.data;
      }
  });

  return {
    chats,
    isLoadingChats,
    chatsError,
    refetchChats,
    useChats
  };
};