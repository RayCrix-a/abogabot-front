import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Message } from './ChatBox';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isBot = message.sender === 'bot';
  
  // Formatear la fecha del mensaje
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return format(date, 'HH:mm', { locale: es });
  };
  
  return (
    <div 
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
          <img 
            src="/images/logo.png" 
            alt="AbogaBot" 
            className="w-5 h-5 object-contain"
          />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isBot ? 'bg-dark-light' : 'bg-primary'} p-3 rounded-lg`}>
        <div className="text-sm text-white">{message.content}</div>
        <div className="text-xs text-right mt-1 text-gray-400">
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
      
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2">
          <span className="text-white text-sm font-medium">U</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
