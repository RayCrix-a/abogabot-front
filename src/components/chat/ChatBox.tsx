import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatBoxProps {
  caseId: string;
  onMessageSent: (message: string) => void;
  chatTitle: string;
}

const ChatBox = ({ caseId, onMessageSent, chatTitle }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar mensajes iniciales cuando cambia el caseId
  useEffect(() => {
    if (caseId) {
      loadInitialMessages();
    } else {
      setMessages([]);
    }
  }, [caseId]);

  // Desplazar al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para cargar mensajes iniciales
  const loadInitialMessages = () => {
    setLoading(true);
    
    // Simular carga de mensajes existentes para este chat
    setTimeout(() => {
      const initialMessages: Message[] = [
        {
          id: 1,
          content: 'Hola, soy AbogaBot. He revisado tu consulta legal anterior y estoy listo para ayudarte.',
          sender: 'bot',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];
      
      setMessages(initialMessages);
      setLoading(false);
    }, 1000);
  };

  // Función para enviar un nuevo mensaje
  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    // Añadir mensaje del usuario inmediatamente
    const userMessage: Message = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Notificar al componente padre sobre el nuevo mensaje
    if (onMessageSent) {
      onMessageSent(content);
    }

    // Mostrar indicador de typing
    setIsTyping(true);
    setLoading(true);
    
    try {
      // Aquí iría la llamada real a la API de AbogaBot
      // Por ahora simulamos la respuesta
      setTimeout(() => {
        const botResponse: Message = {
          id: Date.now() + 1,
          content: generateBotResponse(content),
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        setLoading(false);

        // Notificar sobre la respuesta del bot también
        if (onMessageSent) {
          onMessageSent(botResponse.content);
        }
      }, 1500 + Math.random() * 1000); // Simular tiempo de respuesta variable
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setIsTyping(false);
      setLoading(false);
      
      // Mensaje de error
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Función para generar respuestas simuladas del bot
  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      'Entiendo tu consulta. Basándome en la legislación chilena, puedo decirte que...',
      'Esa es una excelente pregunta legal. Según el Código Civil chileno...',
      'Para tu situación específica, te recomiendo considerar los siguientes aspectos legales...',
      'Según la jurisprudencia reciente en Chile, este tipo de casos se resuelven...',
      'Es importante que sepas que en materia legal chilena, este procedimiento requiere...'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Función para desplazarse al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función para limpiar el chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full chat-container">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Cargando conversación...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <p className="text-gray-400 mb-2">
                    {chatTitle || 'Nueva conversación'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Envía un mensaje para comenzar tu consulta legal
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map(message => (
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
          onSendMessage={sendMessage} 
          disabled={loading}
          placeholder="Escribe tu consulta legal..."
        />
      </div>
    </div>
  );
};

export default ChatBox;