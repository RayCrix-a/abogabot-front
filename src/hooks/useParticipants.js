import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  plaintiffResource, 
  defendantResource, 
  lawyerResource, 
  representativeResource 
} from '@/lib/apiClient';
import { toast } from 'react-toastify';

export const useParticipants = () => {
  const queryClient = useQueryClient();

  // Queries para obtener los participantes con datos completos
  const { 
    data: plaintiffs = [], 
    isLoading: isLoadingPlaintiffs 
  } = useQuery({
    queryKey: ['plaintiffs'],
    queryFn: async () => {
      // Primero obtenemos la lista básica
      const response = await plaintiffResource.getAllPlaintiffs();
      const basicList = response.data;
      
      // Luego obtenemos los datos completos de cada demandante
      const detailedPromises = basicList.map(async (plaintiff) => {
        try {
          const detailResponse = await plaintiffResource.getPlaintiff(plaintiff.id);
          return detailResponse.data;
        } catch (error) {
          console.error(`Error al obtener detalles del demandante ${plaintiff.id}:`, error);
          // Si falla, retornamos los datos básicos
          return plaintiff;
        }
      });
      
      const detailedList = await Promise.all(detailedPromises);
      return detailedList;
    }
  });

  const { 
    data: defendants = [], 
    isLoading: isLoadingDefendants 
  } = useQuery({
    queryKey: ['defendants'],
    queryFn: async () => {
      // Primero obtenemos la lista básica
      const response = await defendantResource.getAllDefendants();
      const basicList = response.data;
      
      // Luego obtenemos los datos completos de cada demandado
      const detailedPromises = basicList.map(async (defendant) => {
        try {
          const detailResponse = await defendantResource.getDefendant(defendant.id);
          return detailResponse.data;
        } catch (error) {
          console.error(`Error al obtener detalles del demandado ${defendant.id}:`, error);
          // Si falla, retornamos los datos básicos
          return defendant;
        }
      });
      
      const detailedList = await Promise.all(detailedPromises);
      return detailedList;
    }
  });

  const { 
    data: lawyers = [], 
    isLoading: isLoadingLawyers 
  } = useQuery({
    queryKey: ['lawyers'],
    queryFn: async () => {
      // Primero obtenemos la lista básica
      const response = await lawyerResource.getAllLawyers();
      const basicList = response.data;
      
      // Luego obtenemos los datos completos de cada abogado
      const detailedPromises = basicList.map(async (lawyer) => {
        try {
          const detailResponse = await lawyerResource.getLawyer(lawyer.id);
          return detailResponse.data;
        } catch (error) {
          console.error(`Error al obtener detalles del abogado ${lawyer.id}:`, error);
          // Si falla, retornamos los datos básicos
          return lawyer;
        }
      });
      
      const detailedList = await Promise.all(detailedPromises);
      return detailedList;
    }
  });

  const { 
    data: representatives = [], 
    isLoading: isLoadingRepresentatives 
  } = useQuery({
    queryKey: ['representatives'],
    queryFn: async () => {
      // Primero obtenemos la lista básica
      const response = await representativeResource.getAllRepresentatives();
      const basicList = response.data;
      
      // Luego obtenemos los datos completos de cada representante
      const detailedPromises = basicList.map(async (representative) => {
        try {
          const detailResponse = await representativeResource.getRepresentative(representative.id);
          return detailResponse.data;
        } catch (error) {
          console.error(`Error al obtener detalles del representante ${representative.id}:`, error);
          // Si falla, retornamos los datos básicos
          return representative;
        }
      });
      
      const detailedList = await Promise.all(detailedPromises);
      return detailedList;
    }
  });

  // Mutaciones para crear participantes
  const createPlaintiffMutation = useMutation({
    mutationFn: async (data) => {
      const response = await plaintiffResource.createPlaintiff(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plaintiffs']);
      toast.success('Demandante creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear demandante: ${error.message}`);
    }
  });

  const createDefendantMutation = useMutation({
    mutationFn: async (data) => {
      const response = await defendantResource.createDefendant(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['defendants']);
      toast.success('Demandado creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear demandado: ${error.message}`);
    }
  });

  const createLawyerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await lawyerResource.createLawyer(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lawyers']);
      toast.success('Abogado creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear abogado: ${error.message}`);
    }
  });

  const createRepresentativeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await representativeResource.createRepresentative(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['representatives']);
      toast.success('Representante creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear representante: ${error.message}`);
    }
  });

  // Mutaciones para actualizar participantes
  const updatePlaintiffMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await plaintiffResource.updatePlaintiff(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plaintiffs']);
      toast.success('Demandante actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar demandante: ${error.message}`);
    }
  });

  const updateDefendantMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await defendantResource.updateDefendant(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['defendants']);
      toast.success('Demandado actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar demandado: ${error.message}`);
    }
  });

  const updateLawyerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await lawyerResource.updateLawyer(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lawyers']);
      toast.success('Abogado actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar abogado: ${error.message}`);
    }
  });

  const updateRepresentativeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await representativeResource.updateRepresentative(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['representatives']);
      toast.success('Representante actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar representante: ${error.message}`);
    }
  });

  // Mutaciones para eliminar participantes
  const deletePlaintiffMutation = useMutation({
    mutationFn: async (id) => {
      const response = await plaintiffResource.deletePlaintiff(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plaintiffs']);
      toast.success('Demandante eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar demandante: ${error.message}`);
    }
  });

  const deleteDefendantMutation = useMutation({
    mutationFn: async (id) => {
      const response = await defendantResource.deleteDefendant(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['defendants']);
      toast.success('Demandado eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar demandado: ${error.message}`);
    }
  });

  const deleteLawyerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await lawyerResource.deleteLawyer(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lawyers']);
      toast.success('Abogado eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar abogado: ${error.message}`);
    }
  });

  const deleteRepresentativeMutation = useMutation({
    mutationFn: async (id) => {
      const response = await representativeResource.deleteRepresentative(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['representatives']);
      toast.success('Representante eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar representante: ${error.message}`);
    }
  });

  return {
    // Datos
    plaintiffs,
    defendants,
    lawyers,
    representatives,
    
    // Estados de carga
    isLoadingPlaintiffs,
    isLoadingDefendants,
    isLoadingLawyers,
    isLoadingRepresentatives,
    
    // Funciones para crear
    createPlaintiff: createPlaintiffMutation.mutateAsync,
    createDefendant: createDefendantMutation.mutateAsync,
    createLawyer: createLawyerMutation.mutateAsync,
    createRepresentative: createRepresentativeMutation.mutateAsync,
    
    // Funciones para actualizar
    updatePlaintiff: updatePlaintiffMutation.mutateAsync,
    updateDefendant: updateDefendantMutation.mutateAsync,
    updateLawyer: updateLawyerMutation.mutateAsync,
    updateRepresentative: updateRepresentativeMutation.mutateAsync,
    
    // Funciones para eliminar
    deletePlaintiff: deletePlaintiffMutation.mutateAsync,
    deleteDefendant: deleteDefendantMutation.mutateAsync,
    deleteLawyer: deleteLawyerMutation.mutateAsync,
    deleteRepresentative: deleteRepresentativeMutation.mutateAsync
  };
};