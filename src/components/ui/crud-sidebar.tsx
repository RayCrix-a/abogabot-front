import { ReactNode } from 'react';
import { XIcon } from 'lucide-react';

interface CrudSidebarProps {
  children: ReactNode
  title: string,
  isOpen: boolean
  onClose: () => void
}

const CrudSidebar = (props : CrudSidebarProps) => {


  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={props.onClose}
      />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 shadow-xl">
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {props.title}
            </h2>
            <button 
              onClick={props.onClose}
              className="text-gray-400 hover:text-white"
            >
              <XIcon size={24} />
            </button>
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default CrudSidebar;