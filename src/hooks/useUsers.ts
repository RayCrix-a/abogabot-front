import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  userResource
} from '@/lib/apiClient';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react'
import { PaginableUserResponse, UserCreateRequest, UserUpdateRequest, UserDetailResponse } from '@/generated/api/data-contracts';

export const useUsers = (page: number = 1, recordsPerPage : number = 10) => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const { 
    data: userResponse, 
    isLoading 
  } = useQuery({
    queryKey: ['users', page, recordsPerPage],
    queryFn: async () : Promise<PaginableUserResponse> => {
      const accessToken = await getAccessTokenSilently();
      const response = await userResource.getAllUsers({page, recordsPerPage},{
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    }
  });

   const useUserInfo = (id : string | null) => {
      return useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
          if (!id) return null;
          const accessToken = await getAccessTokenSilently();
          const response = await userResource.getUser(id, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          }
      });
          return response.data;
        },
        enabled: !!id // Solo ejecutar si hay un ID
      });
    };
  

  // Mutaciones para crear usuarios
  const createUserMutation = useMutation({
    mutationFn: async (data : UserCreateRequest) => {
      const accessToken = await getAccessTokenSilently();
      const response = await userResource.createUser(data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries(['users', page, recordsPerPage]);
        queryClient.refetchQueries(['users', page, recordsPerPage]);
      }, 1000); 
      toast.success('Usuario creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear usuario: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  // Mutaciones para actualizar usuarios
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data } : { id: string, data: UserUpdateRequest}) => {
      const accessToken = await getAccessTokenSilently();
      const response = await userResource.updateUser(id, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: (op) => {
      setTimeout(() => {
        queryClient.invalidateQueries(['users', page, recordsPerPage]);
        queryClient.invalidateQueries(['user', op.id]);
      }, 1000); 
      toast.success('Usuario actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar usuario: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  // Mutaciones para eliminar usuarios
  const deleteUserMutation = useMutation({
    mutationFn: async (id : string) => {
      const accessToken = await getAccessTokenSilently();
      const response = await userResource.deleteUser(id, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
      return response.data;
    },
    onSuccess: (op) => {
      setTimeout(() => {
        queryClient.invalidateQueries(['users', page, recordsPerPage]);
        queryClient.invalidateQueries(['user', op.id]);
      }, 1000); 
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar usuario: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  });

  return {
    // Datos
    userResponse,
    isLoading,
    useUserInfo,
    
    // Funciones para crear
    createUser: createUserMutation.mutateAsync,
    
    // Funciones para actualizar
    updateUser: updateUserMutation.mutateAsync,
    
    // Funciones para eliminar
    deleteUser: deleteUserMutation.mutateAsync
  };
}