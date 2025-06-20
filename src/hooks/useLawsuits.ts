import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lawsuitResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react'
import { LawsuitRequest, LawsuitStatus, LawsuitSummaryResponse, TaskSummaryResponse } from '@/generated/api/data-contracts';

/**
 * Hook para gestionar demandas legales
 * Proporciona funciones para listar, obtener, crear y eliminar demandas
 */
export const useLawsuits = () => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  // Query para obtener todas las demandas
  const {
    data: lawsuits,
    isLoading: isLoadingLawsuits,
    error: lawsuitsError,
    refetch: refetchLawsuits
  } = useQuery({
    queryKey: ['lawsuits'],
    queryFn: async () : Promise<LawsuitSummaryResponse[]> => {
      const accessToken = await getAccessTokenSilently();
      const response = await lawsuitResource.getAllLawsuits({
        page: undefined,
        recordsPerPage: undefined

      },{
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data.results;
    }
  });

  // Mutación para crear una nueva demanda
const createLawsuitMutation = useMutation({
  mutationFn: async (data : LawsuitRequest) => {
    const accessToken = await getAccessTokenSilently();
    const response = await lawsuitResource.createLawsuit(data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    return response.data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
  },
  onError: (error) => {
    console.error('Error al crear demanda:', error);
    toast.error(`Error al crear la demanda: ${error && error instanceof Error  ? error.message : 'Error desconocido'}`);
  }
});

  // Mutación para actualizar una demanda
  const updateLawsuitMutation = useMutation({
    mutationFn: async ({ id, data} : { id: number, data: LawsuitRequest}) => {
      const accessToken = await getAccessTokenSilently();
      const response = await lawsuitResource.updateLawsuit(id, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit'] });
    },
    onError: (error) => {
      console.error('Error al actualizar demanda:', error);
      toast.error(`Error al actualizar la demanda: ${error && error instanceof Error  ? error.message : 'Error desconocido'}`);
    }
  });  

  // Mutación para eliminar una demanda
  const deleteLawsuitMutation = useMutation({
    mutationFn: async (id : number) => {
      console.log('Ejecutando mutación para eliminar demanda con ID:', id);
      try {
        const accessToken = await getAccessTokenSilently();
        // Llamada explícita a la API usando el método deleteLawsuit
        const response = await lawsuitResource.deleteLawsuit(id, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        console.log('Respuesta de eliminación:', response);
        // Validar la respuesta
        if (!response || response.status >= 400) {
          throw new Error(`Error al eliminar la demanda: ${response?.statusText || 'Error desconocido'}`);
        }
        return response.data;
      } catch (error) {
        console.error('Error en la llamada a deleteLawsuit:', error);
        throw error; // Propagar el error para que onError lo maneje
      }
    },
    onMutate: async (deletedId) => {
      console.log('onMutate iniciado para ID:', deletedId);
      // Cancelar queries en curso
      await queryClient.cancelQueries(['lawsuits']);
      await queryClient.cancelQueries(['lawsuit', deletedId]);
      
      // Guardar estado previo
      const previousLawsuits = queryClient.getQueryData(['lawsuits']) as LawsuitSummaryResponse[];
      console.log('Estado previo guardado:', previousLawsuits ? 'Sí' : 'No');
      
      // Actualizar optimistamente
      if (previousLawsuits) {
        queryClient.setQueryData(['lawsuits'], 
          previousLawsuits.filter(l => l.id !== deletedId)
        );
        console.log('Estado actualizado optimisticamente');
      }
      
      return { previousLawsuits };
    },    
    onSuccess: () => {
      console.log('Eliminación exitosa, invalidando queries');
      // Importante: Usar la forma de objeto para invalidateQueries para asegurar que funcione bien con React Query v4+
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit'] });
    },
    onError: (error, deletedId, context) => {
      console.error('Error detectado en onError:', error);
      // Revertir los cambios optimistas
      if (context?.previousLawsuits) {
        console.log('Revirtiendo cambios optimistas');
        queryClient.setQueryData(['lawsuits'], context.previousLawsuits);
      }
      console.error('Error al eliminar demanda:', error);
      toast.error(`Error al eliminar la demanda: ${error && error instanceof Error  ? error.message : 'Error desconocido'}`);
    },
    onSettled: () => {
      console.log('Operación finalizada (onSettled)');
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
    }
  });

  /**
   * Función para obtener una demanda por ID
   * @param {number} id - Identificador de la demanda
   * @returns {Object} - Query result con la demanda solicitada
   */
  const useLawsuit = (id : number) => {
    return useQuery({
      queryKey: ['lawsuit', id],
      queryFn: async () => {
        if (!id) return null;
        const accessToken = await getAccessTokenSilently();
        const response = await lawsuitResource.getLawsuit(id, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data;
      },
      enabled: !!id // Solo ejecutar si hay un ID
    });
  };

  /**
   * Función para obtener revisiones de una demanda
   * @param {number} id - Identificador de la demanda
   * @returns {Object} - Query result con las revisiones
   */
  const useLawsuitRevisions = (id : number) => {
    return useQuery({
      queryKey: ['lawsuit-revisions', id],
      queryFn: async () : Promise<TaskSummaryResponse[]> => {
        if (!id) return [];
        const accessToken = await getAccessTokenSilently();
        const response = await lawsuitResource.getRevisions(id, {
          page: undefined,
          recordsPerPage: undefined
        }, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data.results;
      },
      enabled: !!id
    });
  };

  /**
   * Función para obtener el contenido de una revisión específica
   * @param {number} id - Identificador de la demanda
   * @param {string} uuid - Identificador de la revisión
   * @returns {Object} - Query result con el contenido de la revisión
   */
  const useLawsuitRevision = (id: number, uuid: string) => {
    return useQuery({
      queryKey: ['lawsuit-revision', id, uuid],
      queryFn: async () => {
        if (!id || !uuid) return null;
        const accessToken = await getAccessTokenSilently();
        const response = await lawsuitResource.getRevisionResponse(id, uuid, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return await response.text();
      },
      enabled: !!(id && uuid)
    });
  };

  /**
   * Función para obtener la petición de una revisión específica
   * @param {number} id - Identificador de la demanda
   * @param {string} uuid - Identificador de la revisión
   * @returns {Object} - Query result con los datos de la demanda en esa revisión
   */
  const useLawsuitRevisionRequest = (id: number, uuid: string) => {
    return useQuery({
      queryKey: ['lawsuit-revision-request', id, uuid],
      queryFn: async () => {
        if (!id || !uuid) return null;
        const accessToken = await getAccessTokenSilently();
        const response = await lawsuitResource.getRevisionRequest(id, uuid, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
        return response.data;
      },
      enabled: !!(id && uuid)
    });
  };

  /**
   * Función para obtener revisiones de una demanda (mantener compatibilidad)
   * @param {number} id - Identificador de la demanda
   * @returns {string} - Query result con las revisiones
   */
  const useLawsuitLastRevisions = (id : number) => {
    return useQuery({
      queryKey: ['lawsuit-last-revisions', id],
      queryFn: async () : Promise<string | null> => {
        if (!id) return null;
        try {
          const accessToken = await getAccessTokenSilently();
          const response = await lawsuitResource.getRevisions(id, {page: undefined, recordsPerPage: undefined}, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
          const innerResponse = response.data.results;
          if (!innerResponse || innerResponse.length === 0) return null;
          const lastRevision = innerResponse.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          const responseRevision = await lawsuitResource.getRevisionResponse(id, lastRevision.uuid, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
          return await responseRevision.text();
        } catch (error) {
          console.error('Error fetching last revisions:', error);
          return null;
        }
      },
      enabled: !!id,
      retry: false
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Función para previsualizar un documento antes de generarlo
  const previewDocument = useCallback(async (id: number): Promise<string> => {
    try {
      console.log(`Iniciando previsualización de documento para caso ID: ${id}`);
      const accessToken = await getAccessTokenSilently();
      const response = await lawsuitResource.request({
        path: `/lawsuit/${id}/preview`,
        method: 'GET',
        baseUrl: process.env.NEXT_PUBLIC_ABOGABOT_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Error al previsualizar documento: ${response.statusText}`);
      }

      const data = await response.text();
      return data;
    } catch (error) {
      console.error('Error en previewDocument:', error);
      throw error;
    }
  }, [getAccessTokenSilently, lawsuitResource]);

  const generate = useCallback(async (id : number, onProgress : (chunk: string) => void) => {
    try {
      setLoading(true);
      console.log(`Iniciando generación de documento para caso ID: ${id}`);
      const accessToken = await getAccessTokenSilently();
      const response = await lawsuitResource.request({
        path: `/lawsuit/${id}/generate`,
        method: 'POST',
        baseUrl: process.env.NEXT_PUBLIC_ABOGABOT_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (!response.ok || !response.body) {
        throw new Error(`Error al generar documento: ${response.statusText}`);
      }

      // Procesar el stream de respuesta
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Decodificar el chunk y acumularlo
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        // Llamar al callback de progreso si existe
        if (onProgress) {
          onProgress(chunk);
        }
      }

      // Invalidar las queries de revisiones para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['lawsuit-revisions', id] });

      return accumulatedContent;
    } catch (error) {
      console.error('Error en generateLawsuitDocument:', error);
      setError(error && error instanceof Error  ? error.message : "Error desconocido");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, queryClient]);
  return {
  lawsuits,
  isLoadingLawsuits,
  lawsuitsError,
  refetchLawsuits,
  useLawsuit,
  useLawsuitRevisions,
  useLawsuitRevision,
  useLawsuitRevisionRequest, // Nueva función
  useLawsuitLastRevisions,
  
  // CAMBIOS: Usar mutateAsync para poder hacer await
  createLawsuit: createLawsuitMutation.mutateAsync,
  isCreatingLawsuit: createLawsuitMutation.isLoading,
  
  updateLawsuit: updateLawsuitMutation.mutateAsync,
  isUpdatingLawsuit: updateLawsuitMutation.isLoading,
  
  deleteLawsuit: deleteLawsuitMutation.mutateAsync,
  isDeletingLawsuit: deleteLawsuitMutation.isLoading,
  
  // Funciones de generación de documentos
  previewDocument,
  generate,
    // Exponer el lawsuitResource para uso directo en componentes
  lawsuitResource,
  
  loading,
  error
};
};