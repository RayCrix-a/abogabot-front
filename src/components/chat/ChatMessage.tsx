import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isError?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isBot = message.sender === 'bot';
  
  // Formatear la fecha del mensaje
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    try {
      // Manejar diferentes formatos de fecha que puede devolver la API
      let date: Date;
      
      // Si es formato ISO completo
      if (timestamp.includes('T')) {
        date = new Date(timestamp);
      } else {
        // Si es formato "2025-06-16 00:09:56"
        date = new Date(timestamp.replace(' ', 'T'));
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', timestamp);
        return '';
      }
      
      return format(date, 'HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error, timestamp);
      return '';
    }
  };
  
  return (
    <div 
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 message-slide-in`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
          <img 
            src="/images/logo.png" 
            alt="AbogaBot" 
            className="w-5 h-5 object-contain"
            onError={(e) => {
              // Fallback si no se encuentra la imagen
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '🤖';
            }}
          />
        </div>
      )}
      
      <div className={`max-w-[70%] ${
        isBot 
          ? message.isError 
            ? 'bg-red-600 text-white' 
            : 'bg-dark-light text-white' 
          : 'bg-primary text-white'
      } p-3 rounded-lg`}>
        {/* Contenido del mensaje */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-right mt-1 opacity-70">
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
      
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2 flex-shrink-0">
          <span className="text-white text-sm font-medium">U</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;