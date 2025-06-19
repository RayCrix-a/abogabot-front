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
  
  const [currentChatId, setCurrentChatId] = useState<string | null>('new-chat');
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
        recordsPerPage: 50
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      return response.data;
    },
    staleTime: 30000,
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
      staleTime: 10000,
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
    lastMessage: '',
    timestamp: new Date(apiChat.createdAt),
    messageCount: 0,
    status: 'active',
    createdAt: new Date(apiChat.createdAt)
  }));

  // Función para iniciar un nuevo chat
  const startNewChat = useCallback(async (initialMessage?: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (initialMessage) {
        const result = await createChatMutation.mutateAsync(initialMessage);
        return result.sessionId;
      } else {
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

    if (chatId === 'new-chat') {
      console.log('Seleccionando nuevo chat');
      setCurrentChatId('new-chat');
      setError(null);
      return;
    }

    // Si el ID ya está seleccionado, no hacemos nada
    if (currentChatId === chatId) {
      console.log('Chat ya seleccionado:', chatId);
      return;
    }

    const chat = chatHistory.find(c => c.id === chatId);
    
    if (!chat) {
     // console.warn('Chat no encontrado en historial:', chatId);
     
      // A pesar de no encontrarlo, intentamos seleccionarlo
      // ya que podría ser un chat recién creado que aún no aparece en el historial

      //console.log('Forzando selección de chat aunque no esté en el historial:', chatId);
      setCurrentChatId(chatId);
      
      // Invalidar las consultas para forzar una actualización del historial
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
      return;
    }

    console.log('Seleccionando chat existente:', chatId);
    setCurrentChatId(chatId);
    setError(null);
  }, [chatHistory, currentChatId, queryClient]);

  // Función para enviar mensaje con sessionId explícito
  const sendMessage = useCallback(async (message: string, explicitSessionId?: string | null): Promise<ChatLastAnswerResponse | null> => {
    if (!message.trim()) return null;

    try {
      setIsLoading(true);
      setError(null);      const targetSessionId = explicitSessionId !== undefined ? explicitSessionId : currentChatId;      if (!targetSessionId || targetSessionId === 'new-chat') {
        // Estamos creando un nuevo chat
        const result = await createChatMutation.mutateAsync(message);
        
        // Garantizar que el currentChatId se actualice inmediatamente con el nuevo sessionId
        const newSessionId = result.sessionId;
        
        // Actualizar el estado de inmediato antes de cualquier operación async
        setCurrentChatId(newSessionId);
          // Crear una estructura temporal para el nuevo chat y actualizar el historial local
        // Esto ayuda a que la UI muestre el nuevo chat inmediatamente sin esperar a la API
        const tempNewChat = {
          sessionId: newSessionId,
          title: 'Nueva conversación', 
          createdAt: new Date().toISOString()
        };
        
        // Invalidar las consultas para forzar una actualización del historial
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', newSessionId] });
          // Forzar refresco inmediato del historial de chats
        try {
          await queryClient.refetchQueries({ queryKey: ['chats'], type: 'active' });
        } catch (err) {
          console.error('Error al refrescar historial después de crear chat:', err);
        }
        
        return result;
      } else {
        // Continuamos un chat existente
        const result = await continueChatMutation.mutateAsync({
          sessionId: targetSessionId,
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

  // Función para eliminar un chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      if (!chatId) {
        toast.error('ID de chat no válido');
        return;
      }

      const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este chat?');
      if (!confirmDelete) return;

      if (currentChatId === chatId) {
        setCurrentChatId('new-chat');
      }

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
    if (!chatId) return [];
    
    return [];
  }, [currentChatId]);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para obtener título del chat actual
  const getCurrentChatTitle = useCallback((): string => {
    if (currentChatId === 'new-chat') return 'Nueva consulta legal';
    
    const currentChat = chatHistory.find(chat => chat.id === currentChatId);
    const title = currentChat?.title || 'Chat Legal';
    
    return title;
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
    hasActiveChat: currentChatId !== 'new-chat',
    chatCount: chatHistory.length,
    currentChat: chatHistory.find(chat => chat.id === currentChatId) || null,
    
    // Estados de mutación
    isCreatingChat: createChatMutation.isLoading,
    isSendingMessage: continueChatMutation.isLoading || createChatMutation.isLoading
  };
};