import { useState } from 'react';
import { FiSend } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSendMessage, disabled, placeholder = "Escribe tu mensaje..." }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  // Manejar el envío del mensaje
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
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

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="input-field flex-1 py-2"
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`ml-2 p-2 rounded-full ${
          !message.trim() || disabled
            ? 'bg-gray-700 text-gray-500'
            : 'bg-primary text-white hover:bg-primary-dark'
        } transition-colors`}
      >
        <FiSend className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;
