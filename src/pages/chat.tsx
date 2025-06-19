import { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import ChatBox from '@/components/chat/ChatBox';
import ChatLayout from '@/components/layout/ChatLayout';
import { useChatLegal } from '@/hooks/useChats';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { toast } from 'react-toastify';

const ChatLegalPage = () => {
  const { user } = useAuth0();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const {
    currentChatId,
    chatHistory,
    isLoading,
    error,
    startNewChat,
    selectChat,
    deleteChat,
    hasActiveChat,
    getCurrentChatTitle,
    clearError,
    chatCount,
    refetchChats
  } = useChatLegal();

  // Detectar el estado del sidebar desde localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebarOpen');
      setLeftSidebarOpen(savedState === 'true');
    };

    checkSidebarState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarOpen') {
        setLeftSidebarOpen(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleSidebarToggle = (e: CustomEvent) => {
      setLeftSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    const handleToggleFromNavbar = () => {
      const currentState = localStorage.getItem('sidebarOpen') === 'true';
      setLeftSidebarOpen(!currentState);
    };

    window.addEventListener('toggleSidebar', handleToggleFromNavbar);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
      window.removeEventListener('toggleSidebar', handleToggleFromNavbar);
    };
  }, []);

  // Manejar errores de la API
  useEffect(() => {
    if (error) {
      console.error('Chat Legal Error:', error);
      toast.error(error);
      setTimeout(() => {
        clearError();
      }, 5000);
    }
  }, [error, clearError]);
  // Función para manejar el inicio de nuevo chat
  const handleStartNewChat = async (): Promise<string | null> => {
    try {
      const newChatId = await startNewChat();
      
      // Forzar actualización después de iniciar un nuevo chat
      if (newChatId) {
        // Esta actualización puede ser necesaria si el componente no se refresca automáticamente
        setTimeout(() => {
          // Refrescar la lista de chats para mostrar el nuevo chat
          clearError(); // Esto forzará una re-renderización
        }, 200);
      }
      
      return newChatId;
    } catch (error) {
      console.error('Error al iniciar nuevo chat:', error);
      toast.error('Error al iniciar nueva conversación');
      return null;
    }
  };

  // Función para manejar la selección de chat
  const handleSelectChat = (chatId: string) => {
    try {
      selectChat(chatId);
    } catch (error) {
      console.error('Error al seleccionar chat:', error);
      toast.error('Error al cargar la conversación');
    }
  };

  // Función para manejar la eliminación de chat
  const handleDeleteChat = async (chatId: string): Promise<void> => {
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Error al eliminar chat:', error);
      toast.error('Error al eliminar la conversación');
    }
  };  // Función para manejar cuando se envía un mensaje
  const handleMessageSent = (message: string) => {    // Comprobar si es un mensaje especial de selección de chat
    if (message.startsWith('__select_chat__:')) {
      // Extraer el ID del chat
      const chatId = message.replace('__select_chat__:', '');
      
      // Forzar la selección del chat sin verificar el historial
      // Primero refrescar chats para asegurar datos actualizados
      refetchChats()
        .then(() => {
          // Seleccionar el chat independientemente de si aparece en el historial o no
          selectChat(chatId);
          
          // Refrescar una vez más después de un breve retraso
          setTimeout(() => {
            refetchChats();
          }, 500);
        })
        .catch(error => {
          console.error('Error al refrescar historial:', error);
          // Intentar seleccionar el chat de todas formas
          selectChat(chatId);
        });
      
      return; // No procesar este mensaje como un mensaje normal
    }
    // El hook se encarga de toda la lógica de mensajes normales
  };

  // Renderizado del contenido principal del chat
  const renderChatContent = () => {
    if (isLoading && chatHistory.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-400">Cargando chat legal...</p>
          </div>
        </div>
      );
    }

    return (
      <ChatBox 
        onMessageSent={handleMessageSent}
        chatTitle={getCurrentChatTitle()}
        currentChatId={currentChatId!} // Nunca será null aquí
      />
    );
  };

  return (
    <MainLayout title="Chat Legal" description="Consulta legal con IA">
      <ChatLayout
        currentChatId={currentChatId}
        chatHistory={chatHistory as any}
        onStartNewChat={handleStartNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        leftSidebarOpen={leftSidebarOpen}
        isLoading={isLoading}
      >
        {renderChatContent()}
        
        {/* Indicador de estado global */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </ChatLayout>
    </MainLayout>
  );
};

export default withAuthenticationRequired(ChatLegalPage);