import { useState, useEffect, useRef, ReactNode } from 'react';
import { FiMessageCircle, FiClock, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Interfaz actualizada para el objeto Chat desde la API
interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: string;
  createdAt: Date;
}

// Props para el componente ChatLayout
interface ChatLayoutProps {
  children: ReactNode;
  currentChatId: string | null;
  chatHistory: Chat[];
  onStartNewChat: () => Promise<string | null>;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  leftSidebarOpen?: boolean;
  isLoading?: boolean;
}

const ChatLayout = ({ 
  children, 
  currentChatId, 
  chatHistory = [], 
  onStartNewChat, 
  onSelectChat, 
  onDeleteChat,
  leftSidebarOpen = false,
  isLoading = false
}: ChatLayoutProps) => {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Manejar estado del sidebar derecho en localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('rightSidebarOpen');
    if (savedState !== null) {
      setRightSidebarOpen(savedState === 'true');
    }
  }, []);

  // Guardar estado cuando cambie
  useEffect(() => {
    localStorage.setItem('rightSidebarOpen', rightSidebarOpen.toString());
  }, [rightSidebarOpen]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} atrás`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Hace poco';
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (deletingChatId === chatId) return;
    
    try {
      setDeletingChatId(chatId);
      await onDeleteChat(chatId);
    } catch (error) {
      console.error('Error al eliminar chat:', error);
      toast.error('Error al eliminar la conversación');
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleStartNewChat = async () => {
    try {
      const result = await onStartNewChat();
      if (result) {
        toast.success('Nueva conversación iniciada');
      }
    } catch (error) {
      console.error('Error al iniciar nuevo chat:', error);
      toast.error('Error al iniciar nueva conversación');
    }
  };

  // Función para seleccionar chat
  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  return (
    <div className="h-full flex">
      {/* Contenido principal del chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header del chat */}
        <div className="bg-dark-lighter px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiMessageCircle className="text-primary mr-2 w-5 h-5" />
              <div>
                <h1 className="text-lg font-semibold text-white">Chat Legal</h1>
                <p className="text-gray-400 text-sm">
                  Consulta con AbogaBot sobre temas legales
                  {chatHistory.length > 0 && (
                    <span className="ml-2">• {chatHistory.length} conversación{chatHistory.length === 1 ? '' : 'es'}</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Controles del header */}
            <div className="flex items-center space-x-2">
              {/* Botón para abrir el sidebar derecho - Solo visible cuando está cerrado */}
              {!rightSidebarOpen && (
                <button
                  onClick={toggleRightSidebar}
                  className="p-2 text-gray-400 hover:text-white hover:bg-dark-light rounded-md transition-colors"
                  title="Mostrar historial"
                >
                  <FiClock className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenido del chat */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Overlay para móvil */}
      {rightSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleRightSidebar}
        />
      )}

      {/* Sidebar de Historial (Derecho) */}
      <aside
        ref={historyRef}
        className={`bg-dark-lighter border-l border-gray-700 transition-all duration-300 overflow-hidden
          md:relative md:z-auto
          ${rightSidebarOpen ? 'w-80' : 'w-0'}
          ${rightSidebarOpen ? 'fixed right-0 top-0 bottom-0 z-50 md:static' : ''}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header del historial */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FiClock className="mr-2 w-5 h-5" />
                Historial
              </h2>
              <button
                onClick={toggleRightSidebar}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                title="Cerrar historial"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido del historial */}
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            {/* Botón Nuevo chat */}
            <button
              onClick={handleStartNewChat}
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-md flex items-center justify-center gap-2 mb-4 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus className="w-4 h-4" />
              {isLoading ? 'Cargando...' : 'Nuevo Chat'}
            </button>

            {/* Lista de chats del historial */}
            <div className="flex-1 overflow-y-auto space-y-2 chat-history-scroll">
              {isLoading && chatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-400 text-sm">Cargando historial...</p>
                </div>
              ) : chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group fade-in hover-lift ${
                      currentChatId === chat.id
                        ? 'bg-primary/20 border border-primary/30 shadow-custom'
                        : 'bg-dark hover:bg-dark-light hover:shadow-custom'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white text-sm truncate flex-1 mr-2">
                        {chat.title || 'Conversación sin título'}
                      </h3>
                      <button 
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        disabled={deletingChatId === chat.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                        title="Eliminar chat"
                      >
                        {deletingChatId === chat.id ? (
                          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiTrash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {chat.lastMessage}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatTimestamp(chat.timestamp)}</span>
                      {chat.messageCount > 0 && (
                        <span className="bg-dark/50 px-2 py-1 rounded-full">
                          {chat.messageCount} mensaje{chat.messageCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Mostrar indicador de chat activo */}
                    {currentChatId === chat.id && (
                      <div className="mt-2 flex items-center text-xs text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                        Chat activo
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    No hay chats en el historial
                  </p>
                  <p className="text-gray-500 text-xs">
                    Inicia una nueva conversación para comenzar
                  </p>
                </div>
              )}
            </div>

            {/* Footer del historial */}
            {chatHistory.length > 0 && (
              <div className="pt-4 border-t border-gray-700 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    {chatHistory.length} chat{chatHistory.length !== 1 ? 's' : ''} en total
                  </p>
                  {chatHistory.length > 5 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Desplázate para ver más
                    </p>
                  )}
                  {/* Mostrar currentChatId actual - ESTE SE MANTIENE */}
                  <p className="text-xs text-blue-400 mt-1">
                    Actual: {currentChatId === 'new-chat' ? 'nuevo chat' : currentChatId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ChatLayout;