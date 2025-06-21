import { Plus } from 'lucide-react';
import { FiX } from 'react-icons/fi';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantSummaryResponse } from '@/generated/api/data-contracts';
import { ParticipantType, PARTICIPANT_CONFIGS, PersonSummary, mapApiParticipantToPersonSummary } from '@/types/ParticipantTypes';
import AutocompleteSearch from './AutocompleteSearch';

interface ParticipantSelectorProps {
  type: ParticipantType;
  selectedParticipants: PersonSummary[];
  onAddParticipant: (idNumber: string) => void;
  onRemoveParticipant: (idNumber: string) => void;
  onOpenManager: () => void;
  error?: string;
}

const ParticipantSelector = ({ 
  type, 
  selectedParticipants, 
  onAddParticipant, 
  onRemoveParticipant, 
  onOpenManager,
  error 
}: ParticipantSelectorProps) => {
  const { plaintiffs, defendants, lawyers, representatives } = useParticipants();
  
  const config = PARTICIPANT_CONFIGS[type];

  // Obtener datos según el tipo
  const getParticipantsData = (): ParticipantSummaryResponse[] => {
    switch (type) {
      case 'demandantes': return plaintiffs || [];
      case 'demandados': return defendants || [];
      case 'abogados': return lawyers || [];
      case 'representantes': return representatives || [];
      default: return [];
    }
  };

  const participants = getParticipantsData();

  // Encontrar participante por ID number
  const findParticipantByIdNumber = (idNumber: string): ParticipantSummaryResponse | undefined => {
    return participants.find(p => p.idNumber === idNumber);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-medium flex items-center gap-2 text-white">
          {config.label} {config.isOptional && <span className="text-sm text-gray-400 font-normal">(opcional)</span>}
          <span className="text-sm text-blue-400">
            {selectedParticipants.length > 0 && `(${selectedParticipants.length})`}
          </span>
        </h4>
        <button
          type="button"
          onClick={onOpenManager}
          className="bg-blue-500 hover:bg-blue-600 p-1.5 rounded-full transition-colors"
          title={`Gestionar ${config.label.toLowerCase()}`}
        >
          <Plus size={16} className="text-white" />
        </button>
      </div>

      <div className="space-y-3">
        <AutocompleteSearch
          participants={participants}
          selectedParticipants={selectedParticipants}
          placeholder={config.placeholder}
          onSelect={onAddParticipant}
        />

        {selectedParticipants.length > 0 ? (
          <div className="bg-gray-700/30 border border-gray-600 rounded-md p-3">
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((personSummary) => {
                const participant = findParticipantByIdNumber(personSummary.idNumber);
                return participant ? (
                  <div key={personSummary.idNumber} className="bg-gray-600/50 border border-gray-500 px-2 py-1 rounded-md flex items-center gap-2 text-sm">
                    <div>
                      <span className="text-white">{participant.idNumber} - {participant.fullName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(personSummary.idNumber)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-700 rounded-md p-4 text-center">
            <div className="text-gray-500 text-sm">
              Sin selección
            </div>
          </div>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantSelector;