import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';


export interface Message { 
  id: number,
  content: string,
  sender: string,
  timestamp: string
}
const ChatBox = ({ caseId } : {caseId: number}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (caseId) {
      loadInitialMessages();
    }
  }, [caseId]);

  // Desplazar al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para cargar mensajes iniciales
  const loadInitialMessages = () => {
    // En una implementación real, aquí se cargarían los mensajes desde la API
    setLoading(true);
    setTimeout(() => {
      const initialMessages = [
        {
          id: 1,
          content: 'Hola, soy AbogaBot. He generado una demanda civil basada en los datos proporcionados.',
          sender: 'bot',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];
      setMessages(initialMessages);
      setLoading(false);
    }, 1000);
  };

  // Función para enviar un nuevo mensaje
  const sendMessage = (content : string) => {
    if (!content.trim()) return;

    // Añadir mensaje del usuario
    const userMessage = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simular respuesta del bot
    setLoading(true);
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        content: `Bien hecho, agrega los siguientes detalles: ${content}`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setLoading(false);
    }, 1500);
  };

  // Función para desplazarse al último mensaje
  const scrollToBottom = () => {
    (messagesEndRef.current as any).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">
              Aún no hay mensajes. Escribe algo para comenzar.
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex space-x-2 items-center text-gray-400">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="animate-pulse">...</span>
                </div>
                <span>AbogaBot está escribiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Entrada de texto */}
      <div className="p-4 border-t border-gray-700">
        <ChatInput onSendMessage={sendMessage} disabled={loading} />
      </div>
    </div>
  );
};

export default ChatBox;
