import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatLegal } from '@/hooks/useChats';
import { ChatHistoryMessage } from '@/generated/api/data-contracts';

export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isError?: boolean;
}

interface ChatBoxProps {
  caseId?: string;
  onMessageSent?: (message: string) => void;
  chatTitle: string;
  currentChatId: string; // Obligatorio para buenas prácticas
  forceRefresh?: boolean;
}

const ChatBox = ({ onMessageSent, chatTitle, currentChatId: propCurrentChatId }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const {
    sendMessage,
    isSendingMessage,
    useCurrentChatMessages,
    convertApiMessagesToLocal,
    getCurrentChatTitle
  } = useChatLegal();

  const effectiveCurrentChatId = propCurrentChatId;

  // Query para obtener mensajes del chat actual
  const { 
    data: apiMessages, 
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages 
  } = useCurrentChatMessages(effectiveCurrentChatId && effectiveCurrentChatId !== 'new-chat' ? effectiveCurrentChatId : null);

  // Forzar refetch cuando cambie el currentChatId
  useEffect(() => {
    if (effectiveCurrentChatId && effectiveCurrentChatId !== 'new-chat') {
      refetchMessages();
    } else {
      setMessages([]);
    }
  }, [effectiveCurrentChatId, refetchMessages]);

  // Actualizar mensajes locales cuando cambien los de la API
  useEffect(() => {
    if (apiMessages && effectiveCurrentChatId && effectiveCurrentChatId !== 'new-chat') {
      const localMessages = convertApiMessagesToLocal(apiMessages);
      setMessages(localMessages);
    } else if (effectiveCurrentChatId === 'new-chat') {
      setMessages([]);
    }
  }, [apiMessages, convertApiMessagesToLocal, effectiveCurrentChatId]);

  // Desplazar al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Manejar errores de mensajes
  useEffect(() => {
    if (messagesError) {
      console.error('Error al cargar mensajes:', messagesError);
      toast.error('Error al cargar el historial del chat');
    }
  }, [messagesError]);
  // Función para enviar un nuevo mensaje con sessionId explícito
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSendingMessage) return;

    // Crear mensaje del usuario inmediatamente para UI responsiva
    const userMessage: Message = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    if (onMessageSent) {
      onMessageSent(content);
    }    try {
      // Si estamos en un nuevo chat, forzar un refetch después de enviar el mensaje
      // para asegurar que el nuevo sessionId se refleje en la UI
      const isNewChatSession = effectiveCurrentChatId === 'new-chat';
      const response = await sendMessage(content, effectiveCurrentChatId);      // Si era un chat nuevo y tenemos una respuesta con sessionId, seleccionar ese chat
      // Esto mantendrá al usuario en la misma conversación después de crear un nuevo chat
      if (isNewChatSession && response && response.sessionId) {

        
        // SOLUCIÓN DIRECTA: Enviar comando de selección inmediatamente
        if (onMessageSent) {
          onMessageSent(`__select_chat__:${response.sessionId}`);
        }
        
        // Programar múltiples intentos de selección para garantizar que funcione
        const retryIntervals = [500, 1000, 2000]; // Intentos a 0.5s, 1s y 2s
        
        retryIntervals.forEach(delay => {
          setTimeout(() => {
            if (onMessageSent) {
              onMessageSent(`__select_chat__:${response.sessionId}`);
            }
          }, delay);
        });
      }
      
      if (response) {
        const botMessage: Message = {
          id: Date.now() + 1,
          content: response.answer,
          sender: 'bot',
          timestamp: response.createdAt
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        if (onMessageSent) {
          onMessageSent(botMessage.content);
        }
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Error al enviar el mensaje');
    } finally {
      setIsTyping(false);
    }
  };

  // Función para desplazarse al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Obtener título dinámico
  const dynamicTitle = getCurrentChatTitle() || chatTitle;

  // Mensaje de bienvenida para nuevos chats
  const welcomeMessage: Message = {
    id: 0,
    content: 'Hola, soy AbogaBot. Estoy aquí para ayudarte con tus consultas legales. ¿En qué puedo asistirte hoy?',
    sender: 'bot',
    timestamp: new Date().toISOString()
  };

  // Determinar qué mensajes mostrar
  const isNewChat = effectiveCurrentChatId === 'new-chat';
  
  const displayMessages = isNewChat && messages.length === 0 
    ? [welcomeMessage] 
    : messages;

  return (
    <div className="flex flex-col h-full chat-container">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
        {isLoadingMessages && effectiveCurrentChatId && effectiveCurrentChatId !== 'new-chat' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Cargando conversación...</p>
            </div>
          </div>
        ) : (
          <>
            {isNewChat && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <p className="text-gray-400 mb-2">
                    {dynamicTitle}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Escribe tu consulta legal para comenzar
                  </p>
                </div>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">📱</span>
                  </div>
                  <p className="text-gray-400 mb-2">
                    Chat cargando...
                  </p>
                  <p className="text-gray-500 text-sm">
                    Esperando mensajes del servidor
                  </p>
                </div>
              </div>
            ) : (
              <>
                {displayMessages.map(message => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                  />
                ))}
                
                {/* Indicador de typing */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-dark-light p-3 rounded-lg max-w-[70%]">
                      <div className="typing-indicator">
                        <span className="text-gray-400 text-sm mr-2">AbogaBot está escribiendo</span>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        )}
      </div>
        {/* Entrada de texto */}
      <div className="p-4 border-t border-gray-700 chat-input-container">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isSendingMessage}
          placeholder="Escribe tu consulta legal..."
          resetKey={effectiveCurrentChatId} // Resetear el input cuando cambie el chat
        />
        
        {/* Indicador de estado */}
        {isSendingMessage && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-400">
              Enviando mensaje...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;