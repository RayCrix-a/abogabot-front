import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react';
import { chatResource } from '@/lib/apiClient';
import { 
  ChatPrompt, 
  ChatLastAnswerResponse, 
  ChatHistoryMessage, 
  ChatSummaryResponse,
  PaginableChatResponse 
} from '@/generated/api/data-contracts';

// Interfaz para el chat local (adaptada para compatibilidad con componentes existentes)
export interface Chat {
  id: string; // sessionId de la API
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: string;
  createdAt: Date;
}

// Interfaz para los mensajes locales
export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot'; // Adaptado desde 'human'/'ai'
  timestamp: string;
  isError?: boolean;
}

/**
 * Hook personalizado para gestionar el Chat Legal con API real
 */
export const useChatLegal = () => {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Query para obtener todas las conversaciones
  const {
    data: chatListResponse,
    isLoading: isLoadingChats,
    error: chatsError,
    refetch: refetchChats
  } = useQuery({
    queryKey: ['chats'],
    queryFn: async (): Promise<PaginableChatResponse> => {
      const accessToken = await getAccessTokenSilently();
      const response = await chatResource.getAllChats({
        page: 1,
        recordsPerPage: 50 // Obtener hasta 50 conversaciones
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    },
    staleTime: 30000, // 30 segundos
  });

  // Query para obtener mensajes de un chat específico
  const useCurrentChatMessages = (sessionId: string | null) => {
    return useQuery({
      queryKey: ['chat-messages', sessionId],
      queryFn: async (): Promise<ChatHistoryMessage[]> => {
        if (!sessionId) return [];
        const accessToken = await getAccessTokenSilently();
        const response = await chatResource.getChat(sessionId, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        });
        return response.data;
      },
      enabled: !!sessionId,
      staleTime: 10000, // 10 segundos
    });
  };

  // Mutación para crear nuevo chat
  const createChatMutation = useMutation({
    mutationFn: async (prompt: string): Promise<ChatLastAnswerResponse> => {
      const accessToken = await getAccessTokenSilently();
      const chatPrompt: ChatPrompt = { question: prompt };
      const response = await chatResource.createNewChat(chatPrompt, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentChatId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.sessionId] });
    },
    onError: (error) => {
      console.error('Error al crear nuevo chat:', error);
      setError('Error al crear nuevo chat');
      toast.error('Error al crear nuevo chat');
    }
  });

  // Mutación para continuar chat existente
  const continueChatMutation = useMutation({
    mutationFn: async ({ sessionId, prompt }: { sessionId: string, prompt: string }): Promise<ChatLastAnswerResponse> => {
      const accessToken = await getAccessTokenSilently();
      const chatPrompt: ChatPrompt = { question: prompt };
      const response = await chatResource.continueChat(sessionId, chatPrompt, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => {
      console.error('Error al continuar chat:', error);
      setError('Error al enviar mensaje');
      toast.error('Error al enviar mensaje');
    }
  });

  // Convertir datos de la API al formato esperado por los componentes
  const chatHistory: Chat[] = (chatListResponse?.results || []).map((apiChat: ChatSummaryResponse) => ({
    id: apiChat.sessionId,
    title: apiChat.title,
    lastMessage: '', // La API no devuelve último mensaje en el resumen
    timestamp: new Date(apiChat.createdAt),
    messageCount: 0, // Calculado dinámicamente si es necesario
    status: 'active',
    createdAt: new Date(apiChat.createdAt)
  }));

  // Función para iniciar un nuevo chat
  const startNewChat = useCallback(async (initialMessage?: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (initialMessage) {
        // Si hay mensaje inicial, crear chat con ese mensaje
        const result = await createChatMutation.mutateAsync(initialMessage);
        return result.sessionId;
      } else {
        // Cambiar a modo de nuevo chat sin crear aún
        setCurrentChatId('new-chat');
        setIsLoading(false);
        return 'new-chat';
      }
    } catch (err) {
      console.error('Error al iniciar nuevo chat:', err);
      setError('Error al iniciar nuevo chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createChatMutation]);

  // Función para seleccionar un chat existente
  const selectChat = useCallback((chatId: string) => {
    if (!chatId) {
      console.warn('ID de chat no válido');
      return;
    }

    const chat = chatHistory.find(c => c.id === chatId);
    
    if (!chat && chatId !== 'new-chat') {
      console.warn('Chat no encontrado:', chatId);
      toast.error('Chat no encontrado');
      return;
    }

    setCurrentChatId(chatId);
    setError(null);
  }, [chatHistory]);

  // Función para enviar mensaje
  const sendMessage = useCallback(async (message: string): Promise<ChatLastAnswerResponse | null> => {
    if (!message.trim()) return null;

    try {
      setIsLoading(true);
      setError(null);

      if (!currentChatId || currentChatId === 'new-chat') {
        // Crear nuevo chat con el primer mensaje
        const result = await createChatMutation.mutateAsync(message);
        return result;
      } else {
        // Continuar chat existente
        const result = await continueChatMutation.mutateAsync({
          sessionId: currentChatId,
          prompt: message
        });
        return result;
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('Error al enviar mensaje');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, createChatMutation, continueChatMutation]);

  // Función para eliminar un chat (no está en la API, simular localmente)
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      if (!chatId) {
        toast.error('ID de chat no válido');
        return;
      }

      const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este chat?');
      if (!confirmDelete) return;

      // Como no hay endpoint de eliminación, solo removemos localmente
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }

      // Invalidar queries para "simular" eliminación
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.removeQueries({ queryKey: ['chat-messages', chatId] });

      toast.success('Chat eliminado del historial local');
    } catch (err) {
      console.error('Error al eliminar chat:', err);
      setError('Error al eliminar el chat');
      toast.error('Error al eliminar el chat');
    }
  }, [currentChatId, queryClient]);

  // Función para convertir mensajes de API a formato local
  const convertApiMessagesToLocal = useCallback((apiMessages: ChatHistoryMessage[]): Message[] => {
    return apiMessages.map((msg, index) => ({
      id: index + 1,
      content: msg.content,
      sender: msg.role === 'human' ? 'user' : 'bot',
      timestamp: msg.createdAt,
      isError: false
    }));
  }, []);

  // Función para obtener mensajes del chat actual
  const getCurrentChatMessages = useCallback((sessionId?: string): Message[] => {
    const chatId = sessionId || currentChatId;
    if (!chatId || chatId === 'new-chat') return [];
    
    // Necesitamos usar el hook dentro del componente, no aquí
    return [];
  }, [currentChatId]);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para obtener título del chat actual
  const getCurrentChatTitle = useCallback((): string => {
    if (!currentChatId || currentChatId === 'new-chat') return 'Nueva consulta legal';
    
    const currentChat = chatHistory.find(chat => chat.id === currentChatId);
    return currentChat?.title || 'Chat Legal';
  }, [currentChatId, chatHistory]);

  // Actualizar estado de carga general
  const isLoadingGeneral = isLoading || isLoadingChats || createChatMutation.isLoading || continueChatMutation.isLoading;

  return {
    // Estado
    currentChatId,
    chatHistory,
    isLoading: isLoadingGeneral,
    error: error || (chatsError ? 'Error al cargar chats' : null),
    
    // Acciones principales
    startNewChat,
    selectChat,
    sendMessage,
    deleteChat,
    
    // Funciones auxiliares
    clearError,
    getCurrentChatMessages,
    getCurrentChatTitle,
    refetchChats,
    
    // Hooks específicos para componentes
    useCurrentChatMessages,
    convertApiMessagesToLocal,
    
    // Computed values
    hasActiveChat: !!currentChatId && currentChatId !== 'new-chat',
    chatCount: chatHistory.length,
    currentChat: chatHistory.find(chat => chat.id === currentChatId) || null,
    
    // Estados de mutación
    isCreatingChat: createChatMutation.isLoading,
    isSendingMessage: continueChatMutation.isLoading || createChatMutation.isLoading
  };
};