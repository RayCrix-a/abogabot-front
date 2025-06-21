// src/components/participants/ParticipantManager.tsx
import { useState } from 'react';
import { X as XIcon, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantDetailResponse, ParticipantRequest } from '@/generated/api/data-contracts';
import { ParticipantType, PARTICIPANT_LABELS, Person, mapApiParticipantToPerson } from '@/types/ParticipantTypes';
import ParticipantForm from './ParticipantForm';
import ParticipantList from './ParticipantList';

interface ParticipantManagerProps {
  type: ParticipantType;
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantManager = ({ type, isOpen, onClose }: ParticipantManagerProps) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingParticipant, setEditingParticipant] = useState<Person | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const {
    plaintiffs, defendants, lawyers, representatives,
    createPlaintiff, createDefendant, createLawyer, createRepresentative,
    updatePlaintiff, updateDefendant, updateLawyer, updateRepresentative,
    deletePlaintiff, deleteDefendant, deleteLawyer, deleteRepresentative
  } = useParticipants();
  // Obtener datos según el tipo
  const getParticipantsData = (): ParticipantDetailResponse[] => {
    switch (type) {
      case 'demandantes': return plaintiffs || [];
      case 'demandados': return defendants || [];
      case 'abogados': return lawyers || [];
      case 'representantes': return representatives || [];
      default: return [];
    }
  };

  const participants = getParticipantsData();

  // Crear participante
  const handleCreateParticipant = async (participantData: Person) => {
    const requestData: ParticipantRequest = {
      idNumber: participantData.idNumber,
      fullName: participantData.fullName,
      address: participantData.address
    };

    try {
      switch (type) {
        case 'demandantes':
          await createPlaintiff(requestData);
          break;
        case 'demandados':
          await createDefendant(requestData);
          break;
        case 'abogados':
          await createLawyer(requestData);
          break;
        case 'representantes':
          await createRepresentative(requestData);
          break;
      }
      
      // Limpiar formulario
      setEditingParticipant(null);
      setEditingIndex(-1);
    } catch (error) {
      console.error('Error al crear participante:', error);
      throw error;
    }
  };

  // Actualizar participante
  const handleUpdateParticipant = async (participantData: Person) => {
    if (!participantData.id) {
      toast.error('ID de participante no válido');
      return;
    }

    const requestData: ParticipantRequest = {
      idNumber: participantData.idNumber,
      fullName: participantData.fullName,
      address: participantData.address
    };

    try {
      switch (type) {
        case 'demandantes':
          await updatePlaintiff({ id: participantData.id, data: requestData });
          break;
        case 'demandados':
          await updateDefendant({ id: participantData.id, data: requestData });
          break;
        case 'abogados':
          await updateLawyer({ id: participantData.id, data: requestData });
          break;
        case 'representantes':
          await updateRepresentative({ id: participantData.id, data: requestData });
          break;
      }
      
      // Limpiar formulario
      setEditingParticipant(null);
      setEditingIndex(-1);
    } catch (error) {
      console.error('Error al actualizar participante:', error);
      throw error;
    }
  };

  // Manejar guardado (crear o actualizar)
  const handleSave = async (participantData: Person) => {
    if (editingIndex >= 0) {
      await handleUpdateParticipant(participantData);
    } else {
      await handleCreateParticipant(participantData);
    }
  };

  // Editar participante
  const handleEdit = (index: number) => {
    const participant = participants[index];
    if (participant) {
      const personData = mapApiParticipantToPerson(participant);
      setEditingParticipant(personData);
      setEditingIndex(index);
    }
  };

  // Eliminar participante
  const handleDelete = async (index: number) => {
    const participant = participants[index];
    if (!participant) {
      toast.error('No se pudo encontrar el participante a eliminar');
      return;
    }

    try {
      setDeletingIndex(index);

      switch (type) {
        case 'demandantes':
          await deletePlaintiff(participant.id);
          break;
        case 'demandados':
          await deleteDefendant(participant.id);
          break;
        case 'abogados':
          await deleteLawyer(participant.id);
          break;
        case 'representantes':
          await deleteRepresentative(participant.id);
          break;
      }
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      toast.error(`Error al eliminar ${type}: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setDeletingIndex(null);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingParticipant(null);
    setEditingIndex(-1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 shadow-xl">
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={24} />
              Gestionar {PARTICIPANT_LABELS[type]}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XIcon size={24} />
            </button>
          </div>

          {/* Formulario */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">
              {editingIndex >= 0 ? 'Editar' : 'Agregar'} persona
            </h3>
            <ParticipantForm
              participant={editingParticipant}
              onSave={handleSave}
              isEditing={editingIndex >= 0}
            />
            {editingIndex >= 0 && (
              <button
                onClick={handleCancelEdit}
                className="w-full mt-2 p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {/* Lista de participantes */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-medium mb-3">Lista de personas</h3>
            <ParticipantList
              participants={participants}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deletingIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManager;