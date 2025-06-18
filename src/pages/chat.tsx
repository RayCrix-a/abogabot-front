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
    chatCount
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
  };

  // Función para manejar cuando se envía un mensaje
  const handleMessageSent = (message: string) => {
    // El hook se encarga de toda la lógica de mensajes
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