import MainLayout from '@/components/layout/MainLayout';
import ChatBox, { Message } from '@/components/chat/ChatBox';
import {useChats} from '@/hooks/useChats';

const ChatPage = () => {
  const { chats, isLoadingChats } = useChats();

  return (
    <MainLayout title="Chat" description="Asistente legal con IA">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Chat con AbogaBot
        </h1>
        <p className="text-gray-400">
          Aquí puedes interactuar con AbogaBot para obtener asistencia legal.
        </p>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 bg-dark-lighter rounded-lg h-[calc(100vh-220px)]">        
         <p>{chats?.map(c => c.title)}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
