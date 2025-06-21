import React from 'react';
import { FiHash, FiMap } from 'react-icons/fi';
import { ParticipantDetailResponse } from '@/generated/api/data-contracts';
import { PARTICIPANT_LABELS, ParticipantType } from '@/types/ParticipantTypes';

interface ParticipantDisplayProps {
  participants: ParticipantDetailResponse[];
  type: ParticipantType;
  mode?: 'card' | 'simple' | 'detailed';
  colorScheme?: 'green' | 'red' | 'purple' | 'blue';
  showHeader?: boolean;
}

const ParticipantDisplay = ({ 
  participants, 
  type, 
  mode = 'card',
  colorScheme = 'blue',
  showHeader = true 
}: ParticipantDisplayProps) => {
  
  if (!participants || participants.length === 0) {
    return (
      <div className="bg-dark rounded-md p-3">
        <span className="text-gray-400">No hay {PARTICIPANT_LABELS[type].toLowerCase()} registrados</span>
      </div>
    );
  }

  // Configuración de colores según el tipo
  const getColorScheme = () => {
    const colorSchemes = {
      green: {
        bg: 'bg-green-900 bg-opacity-30',
        border: 'border-l-2 border-green-600',
        text: 'text-green-400',
        avatar: 'bg-green-900 bg-opacity-30',
        avatarText: 'text-green-400'
      },
      red: {
        bg: 'bg-red-900 bg-opacity-30',
        border: 'border-l-2 border-red-600',
        text: 'text-red-400',
        avatar: 'bg-red-900 bg-opacity-30',
        avatarText: 'text-red-400'
      },
      purple: {
        bg: 'bg-purple-900 bg-opacity-30',
        border: 'border-l-2 border-purple-600',
        text: 'text-purple-400',
        avatar: 'bg-purple-900 bg-opacity-30',
        avatarText: 'text-purple-400'
      },
      blue: {
        bg: 'bg-blue-900 bg-opacity-30',
        border: 'border-l-2 border-blue-600',
        text: 'text-blue-400',
        avatar: 'bg-blue-900 bg-opacity-30',
        avatarText: 'text-blue-400'
      }
    };
    return colorSchemes[colorScheme];
  };

  const colors = getColorScheme();
  // Renderizado simple (para listas pequeñas)
  if (mode === 'simple') {
    return (
      <div className="mb-4">
        {showHeader && (
          <h4 className="font-medium text-white mb-2">{PARTICIPANT_LABELS[type]}</h4>
        )}
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div key={index} className="text-gray-300">
              <div className="font-medium text-white">{participant.fullName}</div>
              {participant.idNumber && (
                <div className="text-gray-400 text-sm">RUT: {participant.idNumber}</div>
              )}
              {participant.address && (
                <div className="text-gray-400 text-sm">Dirección: {participant.address}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizado detallado (modo card - para CaseDetailsCard)
  if (mode === 'detailed') {
    return (
      <div className={`bg-dark bg-opacity-50 rounded-lg p-4 ${colors.border}`}>
        {showHeader && (
          <h3 className={`${colors.text} font-semibold text-lg mb-3 flex items-center`}>
            <FiHash className="mr-2" /> 
            {PARTICIPANT_LABELS[type]}
          </h3>
        )}
        
        <div className="space-y-3">
          {participants.map((participant, index) => (
            <div key={index} className="bg-dark rounded-lg p-4">
              <div className="mb-2 flex items-center">
                <div className={`h-10 w-10 rounded-full ${colors.avatar} flex items-center justify-center mr-3`}>
                  <span className={`${colors.avatarText} font-bold`}>
                    {participant.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{participant.fullName}</p>
                  {participant.idNumber && (
                    <p className="text-gray-400 text-xs flex items-center">
                      <FiHash className="mr-1" size={12} />
                      RUT: {participant.idNumber}
                    </p>
                  )}
                </div>
              </div>
              
              {participant.address && (
                <div className="mt-2 ml-1 flex items-start">
                  <FiMap className="mr-2 text-gray-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{participant.address}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizado por defecto (modo card básico)
  return (
    <div className={`${colors.bg} rounded-lg p-4 ${colors.border}`}>
      {showHeader && (
        <h3 className={`${colors.text} font-semibold text-lg mb-3`}>
          {PARTICIPANT_LABELS[type]}
        </h3>
      )}
      
      <div className="space-y-2">
        {participants.map((participant, index) => (
          <div key={index} className="bg-dark/50 rounded-md p-3">
            <div className="font-medium text-white">{participant.fullName}</div>
            {participant.idNumber && (
              <div className="text-sm text-gray-300">{participant.idNumber}</div>
            )}
            {participant.address && (
              <div className="text-sm text-gray-400">{participant.address}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantDisplay;