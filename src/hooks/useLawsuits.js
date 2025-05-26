import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lawsuitResource } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useState, useCallback } from 'react';
import { ContentType } from '@/generated/api/http-client'; // Añade esta importación
/**
 * Hook para gestionar demandas legales
 * Proporciona funciones para listar, obtener, crear y eliminar demandas
 */
export const useLawsuits = () => {
  const queryClient = useQueryClient();

  // Query para obtener todas las demandas
  const {
    data: lawsuits,
    isLoading: isLoadingLawsuits,
    error: lawsuitsError,
    refetch: refetchLawsuits
  } = useQuery({
    queryKey: ['lawsuits'],
    queryFn: async () => {
      const response = await lawsuitResource.getAllLawsuits();
      return response.data;
    }
  });

  // Mutación para crear una nueva demanda
const createLawsuitMutation = useMutation({
  mutationFn: async (data) => {
    const response = await lawsuitResource.createLawsuit(data);
    return response.data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
    toast.success('Demanda creada exitosamente');
  },
  onError: (error) => {
    console.error('Error al crear demanda:', error);
    toast.error(`Error al crear la demanda: ${error.message || 'Error desconocido'}`);
  }
});

  // Mutación para actualizar una demanda
  const updateLawsuitMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await lawsuitResource.updateLawsuit(id, data);
      return response.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit'] });
      toast.success('Demanda actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error al actualizar demanda:', error);
      toast.error(`Error al actualizar la demanda: ${error.message || 'Error desconocido'}`);
    }
  });  // Mutación para eliminar una demanda
  const deleteLawsuitMutation = useMutation({
    mutationFn: async (id) => {
      console.log('Ejecutando mutación para eliminar demanda con ID:', id);
      try {
        // Llamada explícita a la API usando el método deleteLawsuit
        const response = await lawsuitResource.deleteLawsuit(id);
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
      const previousLawsuits = queryClient.getQueryData(['lawsuits']);
      console.log('Estado previo guardado:', previousLawsuits ? 'Sí' : 'No');
      
      // Actualizar optimistamente
      if (previousLawsuits) {
        queryClient.setQueryData(['lawsuits'], 
          previousLawsuits.filter(l => l.id !== deletedId)
        );
        console.log('Estado actualizado optimistamente');
      }
      
      return { previousLawsuits };
    },    onSuccess: () => {
      console.log('Eliminación exitosa, invalidando queries');
      // Importante: Usar la forma de objeto para invalidateQueries para asegurar que funcione bien con React Query v4+
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit'] });
      toast.success('Demanda eliminada exitosamente');
    },
    onError: (error, deletedId, context) => {
      console.error('Error detectado en onError:', error);
      // Revertir los cambios optimistas
      if (context?.previousLawsuits) {
        console.log('Revirtiendo cambios optimistas');
        queryClient.setQueryData(['lawsuits'], context.previousLawsuits);
      }
      console.error('Error al eliminar demanda:', error);
      toast.error(`Error al eliminar la demanda: ${error.message || 'Error desconocido'}`);
    },
    onSettled: () => {
      console.log('Operación finalizada (onSettled)');
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
    }
  });
  
  // Mutación para actualizar el estado de una demanda
  const updateLawsuitStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await lawsuitResource.updateLawsuit(id, { status });
      return response.data;
    },
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries(['lawsuits']);
      queryClient.invalidateQueries(['lawsuit', id]);
      let message = 'Estado actualizado correctamente';
      switch (status) {
        case 'IN_PROGRESS':
          message = 'Caso marcado como en curso';
          break;
        case 'PENDING':
          message = 'Caso marcado como pendiente';
          break;
        case 'FINALIZED':
          message = 'Caso finalizado y movido al historial';
          break;
        case 'DRAFT':
          message = 'Caso guardado como borrador';
          break;
      }
      toast.success(message);
    },
    onError: (error) => {
      console.error('Error al actualizar el estado:', error);
      toast.error('Error al actualizar el estado del caso');
    }
  });

  /**
   * Función para obtener una demanda por ID
   * @param {number} id - Identificador de la demanda
   * @returns {Object} - Query result con la demanda solicitada
   */
  const useLawsuit = (id) => {
    return useQuery({
      queryKey: ['lawsuit', id],
      queryFn: async () => {
        if (!id) return null;
        const response = await lawsuitResource.getLawsuit(id);
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
  const useLawsuitRevisions = (id) => {
    return useQuery({
      queryKey: ['lawsuit-revisions', id],
      queryFn: async () => {
        if (!id) return [];
        const response = await lawsuitResource.getRevisions(id);
        return response.data;
      },
      enabled: !!id
    });
  };

  /**
   * Función para obtener revisiones de una demanda
   * @param {number} id - Identificador de la demanda
   * @returns {string} - Query result con las revisiones
   */
  const useLawsuitLastRevisions = (id) => {
    return useQuery({
      queryKey: ['lawsuit-last-revisions', id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const response = await lawsuitResource.getRevisions(id);
          const innerResponse = response.data;
          if (!innerResponse || innerResponse.length === 0) return null;
          const lastRevision = innerResponse.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          const responseRevision = await lawsuitResource.getRevisionResponse(id, lastRevision.uuid);
          return await responseRevision.text();
        } catch (error) {
          console.error('Error fetching last revisions:', error);
          return null;
        }
      },
      enabled: !!id && id !== 'undefined',
      retry: false
    });
  };

  /**
   * Función para obtener una revisión específica
   * @param {number} id - Identificador de la demanda
   * @param {string} uuid - Identificador de la revisión
   * @returns {Object} - Query result con la revisión
   */
  const useLawsuitRevision = (id, uuid) => {
    return useQuery({
      queryKey: ['lawsuit-revision', id, uuid],
      queryFn: async () => {
        if (!id || !uuid) return null;
        const response = await lawsuitResource.getRevisionResponse(id, uuid);
        return response.data;
      },
      enabled: !!(id && uuid)
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (id, onProgress) => {
    try {
      setLoading(true);
      console.log(`Iniciando generación de documento para caso ID: ${id}`);
      
      const response = await lawsuitResource.request({
        path: `/lawsuit/${id}/generate`,
        method: 'POST',
        baseUrl: process.env.NEXT_PUBLIC_ABOGABOT_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
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

      return accumulatedContent;
    } catch (error) {
      console.error('Error en generateLawsuitDocument:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
  lawsuits,
  isLoadingLawsuits,
  lawsuitsError,
  refetchLawsuits,
  useLawsuit,
  useLawsuitRevisions,
  useLawsuitRevision,
  useLawsuitLastRevisions,
  
  // CAMBIOS: Usar mutateAsync para poder hacer await
  createLawsuit: createLawsuitMutation.mutateAsync,
  isCreatingLawsuit: createLawsuitMutation.isPending,
  
  updateLawsuit: updateLawsuitMutation.mutateAsync,
  isUpdatingLawsuit: updateLawsuitMutation.isPending,
  
  deleteLawsuit: deleteLawsuitMutation.mutateAsync,
  isDeletingLawsuit: deleteLawsuitMutation.isPending,
  
  updateLawsuitStatus: updateLawsuitStatusMutation.mutateAsync,
  isUpdatingStatus: updateLawsuitStatusMutation.isPending,
  
  loading,
  error,
  generate
};
};