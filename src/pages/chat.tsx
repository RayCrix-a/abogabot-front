import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiMessageCircle } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import ChatBox from '@/components/chat/ChatBox';
import ChatLayout from '@/components/layout/ChatLayout';
import { useChatLegal } from '@/hooks/useChats';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';

const ChatLegalPage = () => {
  const { user } = useAuth0();
  const router = useRouter();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  
  // Usar el hook personalizado para manejar el estado del chat
  const {
    currentChatId,
    chatHistory,
    isLoading,
    error,
    startNewChat,
    selectChat,
    deleteChat,
    updateChatLastMessage,
    hasActiveChat,
    currentChat,
    clearError
  } = useChatLegal();

  // Detectar el estado del sidebar desde localStorage Y permitir cambios
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebarOpen');
      setLeftSidebarOpen(savedState === 'true');
    };

    // Verificar estado inicial
    checkSidebarState();

    // Escuchar cambios en localStorage (si otros componentes lo modifican)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarOpen') {
        setLeftSidebarOpen(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar evento personalizado para cambios inmediatos del sidebar
    const handleSidebarToggle = (e: CustomEvent) => {
      setLeftSidebarOpen(e.detail.isOpen);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    // NUEVO: Escuchar clicks en el botón hamburguesa
    const handleToggleFromNavbar = () => {
      const currentState = localStorage.getItem('sidebarOpen') === 'true';
      setLeftSidebarOpen(!currentState);
    };

    // Crear un event listener personalizado para el navbar
    window.addEventListener('toggleSidebar', handleToggleFromNavbar);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
      window.removeEventListener('toggleSidebar', handleToggleFromNavbar);
    };
  }, []);

  // Manejar errores
  useEffect(() => {
    if (error) {
      console.error('Chat Legal Error:', error);
      // El hook ya maneja los toast, pero podríamos agregar lógica adicional aquí
    }
  }, [error]);

  // Función para manejar cuando se envía un mensaje
  const handleMessageSent = (message: string) => {
    if (currentChatId && message) {
      updateChatLastMessage(currentChatId, message);
    }
  };

  // Renderizado del contenido principal del chat
  const renderChatContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-400">Cargando chat...</p>
          </div>
        </div>
      );
    }

    if (hasActiveChat) {
      return (
        <ChatBox 
          caseId={currentChatId || ''} 
          onMessageSent={handleMessageSent}
          chatTitle={currentChat?.title || 'Chat Legal'}
        />
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <FiMessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Bienvenido al Chat Legal
          </h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Inicia una nueva conversación para consultar con AbogaBot sobre temas legales.
          </p>
          <button
            onClick={startNewChat}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiMessageCircle className="w-4 h-4" />
            {isLoading ? 'Iniciando...' : 'Iniciar nueva consulta'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Chat Legal" description="Consulta legal con IA">
      <ChatLayout
        currentChatId={currentChatId}
        chatHistory={chatHistory as any}
        onStartNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        leftSidebarOpen={leftSidebarOpen}
      >
        {renderChatContent()}
      </ChatLayout>
    </MainLayout>
  );
};

export default withAuthenticationRequired(ChatLegalPage);