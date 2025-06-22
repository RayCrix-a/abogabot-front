import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  roleResource
} from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'
import { PaginableRoleResponse, RoleCreateRequest, RoleUpdateRequest, RoleDetailResponse } from '@/generated/api/data-contracts';

export const useRoles = (page: number = 1, recordsPerPage : number = 10) => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const { 
    data: roleResponse, 
    isLoading 
  } = useQuery({
    queryKey: ['roles', page, recordsPerPage],
    queryFn: async () : Promise<PaginableRoleResponse> => {
      const accessToken = await getAccessTokenSilently();
      const response = await roleResource.getAllRoles({page, recordsPerPage},{
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    }
  });

   const useRoleInfo = (id : string | null) => {
      return useQuery({
        queryKey: ['role', id],
        queryFn: async () => {
          if (!id) return null;
          const accessToken = await getAccessTokenSilently();
          const response = await roleResource.getRole(id, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          }
      });
          return response.data;
        },
        enabled: !!id // Solo ejecutar si hay un ID
      });
    };
  

  // Mutaciones para crear roles
  const createRoleMutation = useMutation({
    mutationFn: async (data : RoleCreateRequest) => {
      const accessToken = await getAccessTokenSilently();
      const response = await roleResource.createRole(data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries(['roles', page, recordsPerPage]);
      }, 1000); 
      toast.success('Rol creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear rol: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  // Mutaciones para actualizar roles
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data } : { id: string, data: RoleUpdateRequest}) => {
      const accessToken = await getAccessTokenSilently();
      const response = await roleResource.updateRole(id, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: (op) => {
      setTimeout(() => {
        queryClient.invalidateQueries(['roles', page, recordsPerPage]);
        queryClient.invalidateQueries(['role', op.id]);
      }, 1000); 
      toast.success('Rol actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar rol: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  // Mutaciones para eliminar roles
  const deleteRoleMutation = useMutation({
    mutationFn: async (id : string) => {
      const accessToken = await getAccessTokenSilently();
      const response = await roleResource.deleteRole(id, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: (op) => {
      setTimeout(() => {
        queryClient.invalidateQueries(['roles', page, recordsPerPage]);
        queryClient.invalidateQueries(['role', op.id]);
      }, 1000); 
      toast.success('Rol eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar rol: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  return {
    // Datos
    roleResponse,
    isLoading,
    useRoleInfo,
    
    // Funciones para crear
    createRole: createRoleMutation.mutateAsync,
    
    // Funciones para actualizar
    updateRole: updateRoleMutation.mutateAsync,
    
    // Funciones para eliminar
    deleteRole: deleteRoleMutation.mutateAsync
  };
}