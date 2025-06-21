import { useState } from 'react';
import { ParticipantType, PersonSummary, PARTICIPANT_CONFIGS, mapApiParticipantToPersonSummary } from '@/types/ParticipantTypes';
import { useParticipants } from '@/hooks/useParticipants';
import { toast } from 'react-toastify';
import ParticipantSelector from './ParticipantSelector';
import ParticipantManager from './ParticipantManager';

interface ParticipantSectionProps {
  selectedParticipants: Record<string, PersonSummary[]>;
  onParticipantsChange: (type: ParticipantType, participants: PersonSummary[]) => void;
  errors: Record<string, string>;
}

const ParticipantSection = ({ selectedParticipants, onParticipantsChange, errors }: ParticipantSectionProps) => {
  const [activeManager, setActiveManager] = useState<ParticipantType | null>(null);
  const { plaintiffs, defendants, lawyers, representatives } = useParticipants();

  // Obtener datos según el tipo
  const getParticipantsData = (type: ParticipantType) => {
    switch (type) {
      case 'demandantes': return plaintiffs || [];
      case 'demandados': return defendants || [];
      case 'abogados': return lawyers || [];
      case 'representantes': return representatives || [];
      default: return [];
    }
  };

  // Agregar participante
  const handleAddParticipant = (type: ParticipantType, idNumber: string) => {
    const participants = getParticipantsData(type);
    const participant = participants.find(p => p.idNumber === idNumber);
    
    if (!participant) {
      toast.error('No se encontró la información completa de la persona');
      return;
    }

    const config = PARTICIPANT_CONFIGS[type];
    const currentSelected = selectedParticipants[type] || [];
    const alreadySelected = currentSelected.some(p => p.idNumber === idNumber);

    if (alreadySelected) {
      toast.warning('Esta persona ya está seleccionada');
      return;
    }

    const personSummary = mapApiParticipantToPersonSummary(participant);

    // Para abogados y representantes solo permitir uno
    if (!config.allowMultiple) {
      onParticipantsChange(type, [personSummary]);
    } else {
      onParticipantsChange(type, [...currentSelected, personSummary]);
    }
  };

  // Remover participante
  const handleRemoveParticipant = (type: ParticipantType, idNumber: string) => {
    const currentSelected = selectedParticipants[type] || [];
    const updatedParticipants = currentSelected.filter(p => p.idNumber !== idNumber);
    onParticipantsChange(type, updatedParticipants);
  };

  // Abrir gestor
  const handleOpenManager = (type: ParticipantType) => {
    setActiveManager(type);
  };

  // Cerrar gestor
  const handleCloseManager = () => {
    setActiveManager(null);
  };

  const participantTypes: ParticipantType[] = ['demandantes', 'demandados', 'abogados', 'representantes'];

  return (
    <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Participantes del caso</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Demandantes y Demandados */}
        <div className="space-y-6">
          <ParticipantSelector
            type="demandantes"
            selectedParticipants={selectedParticipants.demandantes || []}
            onAddParticipant={(idNumber) => handleAddParticipant('demandantes', idNumber)}
            onRemoveParticipant={(idNumber) => handleRemoveParticipant('demandantes', idNumber)}
            onOpenManager={() => handleOpenManager('demandantes')}
            error={errors.demandantes}
          />
          
          <ParticipantSelector
            type="demandados"
            selectedParticipants={selectedParticipants.demandados || []}
            onAddParticipant={(idNumber) => handleAddParticipant('demandados', idNumber)}
            onRemoveParticipant={(idNumber) => handleRemoveParticipant('demandados', idNumber)}
            onOpenManager={() => handleOpenManager('demandados')}
            error={errors.demandados}
          />
        </div>

        {/* Columna derecha: Abogados y Representantes */}
        <div className="space-y-6">
          <ParticipantSelector
            type="abogados"
            selectedParticipants={selectedParticipants.abogados || []}
            onAddParticipant={(idNumber) => handleAddParticipant('abogados', idNumber)}
            onRemoveParticipant={(idNumber) => handleRemoveParticipant('abogados', idNumber)}
            onOpenManager={() => handleOpenManager('abogados')}
            error={errors.abogados}
          />
          
          <ParticipantSelector
            type="representantes"
            selectedParticipants={selectedParticipants.representantes || []}
            onAddParticipant={(idNumber) => handleAddParticipant('representantes', idNumber)}
            onRemoveParticipant={(idNumber) => handleRemoveParticipant('representantes', idNumber)}
            onOpenManager={() => handleOpenManager('representantes')}
            error={errors.representantes}
          />
        </div>
      </div>

      {/* Managers */}
      {participantTypes.map(type => (
        <ParticipantManager
          key={type}
          type={type}
          isOpen={activeManager === type}
          onClose={handleCloseManager}
        />
      ))}
    </div>
  );
};

export default ParticipantSection;