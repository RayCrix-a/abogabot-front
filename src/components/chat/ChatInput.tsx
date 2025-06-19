import { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  resetKey?: string | number;
}

const ChatInput = ({ onSendMessage, disabled, placeholder = "Escribe tu mensaje...", resetKey }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  
  // Resetear el mensaje cuando cambia resetKey
  useEffect(() => {
    setMessage('');
  }, [resetKey]);

  // Manejar el envío del mensaje
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  // Manejar el envío con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Manejar cambios en el input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 px-4 py-3 rounded-md bg-dark-input text-white 
          border border-gray-700 focus:border-primary focus:outline-none 
          focus:ring-1 focus:ring-primary transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`ml-2 p-3 rounded-full transition-colors ${
          !message.trim() || disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-dark'
        }`}
      >
        <FiSend className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;