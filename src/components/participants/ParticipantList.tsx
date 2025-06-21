// src/components/participants/ParticipantList.tsx
import { Edit, Trash2 } from 'lucide-react';
import { ParticipantDetailResponse } from '@/generated/api/data-contracts';

interface ParticipantListProps {
  participants: ParticipantDetailResponse[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  isDeleting?: number | null;
}

const ParticipantList = ({ participants, onEdit, onDelete, isDeleting }: ParticipantListProps) => {
  if (participants.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        No hay personas registradas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {participants.map((participant, idx) => (        <div key={idx} className="bg-gray-700 p-3 rounded-md">
          <div className="font-medium">{participant.fullName}</div>
          <div className="text-sm text-gray-300">{participant.idNumber}</div>          <div className="text-sm text-gray-400">
            {participant.address || 'Sin dirección'}
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => onEdit(idx)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              disabled={isDeleting === idx}
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(idx)}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center"
              disabled={isDeleting === idx}
            >
              {isDeleting === idx ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParticipantList;