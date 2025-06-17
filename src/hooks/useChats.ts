import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: string;
  createdAt: Date;
}

/**
 * Hook personalizado para gestionar el estado y funcionalidades del Chat Legal
 */
export const useChatLegal = () => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial de chats al inicializar
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Función para cargar el historial de chats
  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Por ahora usamos datos mock, pero aquí iría la llamada a la API
      const mockHistory: Chat[] = [
        {
          id: '1',
          title: 'Consulta sobre contrato laboral',
          lastMessage: 'Gracias por la información sobre las clausulas...',
          timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
          messageCount: 12,
          status: 'active',
          createdAt: new Date(Date.now() - 86400000) // 1 día atrás
        },
        {
          id: '2', 
          title: 'Duda sobre responsabilidad civil',
          lastMessage: 'Entiendo, entonces en este caso...',
          timestamp: new Date(Date.now() - 86400000), // 1 día atrás
          messageCount: 8,
          status: 'active',
          createdAt: new Date(Date.now() - 172800000) // 2 días atrás
        },
        {
          id: '3',
          title: 'Procedimiento de divorcio',
          lastMessage: 'AbogaBot: Los pasos que debes seguir son...',
          timestamp: new Date(Date.now() - 172800000), // 2 días atrás
          messageCount: 15,
          status: 'active',
          createdAt: new Date(Date.now() - 259200000) // 3 días atrás
        }
      ];

      // Ordenar por fecha de último mensaje (más recientes primero)
      const sortedHistory = mockHistory.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      setChatHistory(sortedHistory);
    } catch (err) {
      console.error('Error al cargar historial de chats:', err);
      setError('Error al cargar el historial de chats');
      toast.error('Error al cargar el historial de chats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para iniciar un nuevo chat
  const startNewChat = useCallback(async () => {
    try {
      const newChatId = `chat-${Date.now()}`;
      
      // Aquí iría la lógica para crear un nuevo chat en el backend
      console.log('Iniciando nuevo chat:', newChatId);
      
      setCurrentChatId(newChatId);
      
      // Opcionalmente, añadir el nuevo chat al historial
      const newChat: Chat = {
        id: newChatId,
        title: 'Nueva consulta legal',
        lastMessage: '',
        timestamp: new Date(),
        messageCount: 0,
        status: 'active',
        createdAt: new Date()
      };
      
      setChatHistory(prev => [newChat, ...prev]);
      
      return newChatId;
    } catch (err) {
      console.error('Error al iniciar nuevo chat:', err);
      setError('Error al iniciar nuevo chat');
      toast.error('Error al iniciar nuevo chat');
      return null;
    }
  }, []);

  // Función para seleccionar un chat existente
  const selectChat = useCallback((chatId: string) => {
    if (!chatId) {
      console.warn('ID de chat no válido');
      return;
    }

    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) {
      toast.error('Chat no encontrado');
      return;
    }

    setCurrentChatId(chatId);
    console.log('Chat seleccionado:', chatId);
  }, [chatHistory]);

  // Función para eliminar un chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      if (!chatId) {
        toast.error('ID de chat no válido');
        return;
      }

      // Confirmar eliminación
      const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este chat?');
      if (!confirmDelete) {
        return;
      }

      // Aquí iría la llamada a la API para eliminar el chat
      console.log('Eliminando chat:', chatId);

      // Actualizar el estado local
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // Si el chat eliminado era el activo, limpiar la selección
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }

      toast.success('Chat eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar chat:', err);
      setError('Error al eliminar el chat');
      toast.error('Error al eliminar el chat');
    }
  }, [currentChatId]);

  // Función para actualizar el último mensaje de un chat
  const updateChatLastMessage = useCallback((chatId: string, message: string) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? {
              ...chat,
              lastMessage: message,
              timestamp: new Date(),
              messageCount: chat.messageCount + 1
            }
          : chat
      )
    );
  }, []);

  // Función para actualizar el título de un chat
  const updateChatTitle = useCallback((chatId: string, newTitle: string) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: newTitle }
          : chat
      )
    );
  }, []);

  // Función para formatear timestamp
  const formatTimestamp = useCallback((timestamp: Date | string) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diff = now.getTime() - messageDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} atrás`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Hace poco';
    }
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    currentChatId,
    chatHistory,
    isLoading,
    error,
    
    // Acciones
    startNewChat,
    selectChat,
    deleteChat,
    updateChatLastMessage,
    updateChatTitle,
    loadChatHistory,
    clearError,
    
    // Utilidades
    formatTimestamp,
    
    // Computed values
    hasActiveChat: !!currentChatId,
    chatCount: chatHistory.length,
    currentChat: chatHistory.find(chat => chat.id === currentChatId) || null
  };
};