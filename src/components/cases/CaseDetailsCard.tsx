import React from 'react';
import { LawsuitDetailResponse } from '@/generated/api/data-contracts';
import { FiFileText, FiUser, FiBookOpen, FiBriefcase, FiClipboard, FiCalendar } from 'react-icons/fi';
import ParticipantDisplay from '@/components/participants/ParticipantDisplay';

interface CaseDetailsCardProps {
  caseData: LawsuitDetailResponse;
}

const CaseDetailsCard: React.FC<CaseDetailsCardProps> = ({ caseData }) => {
  return (
    <div className="bg-gradient-to-r from-dark-lighter to-dark-light rounded-lg p-6 mb-6 shadow-lg border-l-4 border-primary">
      <h2 className="text-primary text-2xl font-bold mb-5 flex items-center border-b border-gray-700 pb-3">
        <FiFileText className="mr-3" />
        Detalles Actuales del Documento
      </h2>
      
      {/* Título del caso en formato grande y destacado */}
      <div className="mb-6 bg-dark-light p-4 rounded-md border-l-2 border-primary">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider">Título del Caso</h3>
        <p className="text-white text-xl font-bold">{caseData.title || 'Caso sin título'}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda - Información del procedimiento */}
        <div>
          <div className="bg-dark bg-opacity-50 rounded-lg p-4 mb-5 border-l-2 border-blue-600">
            <h3 className="text-blue-400 font-semibold text-lg mb-3 flex items-center">
              <FiBookOpen className="mr-2" /> 
              Información del Procedimiento
            </h3>
            <div className="space-y-4">              
              {/* Tipo de procedimiento */}
              <div className="flex items-start">
                <div className="bg-blue-900 bg-opacity-30 p-2 rounded-full mr-3 mt-1">
                  <FiBriefcase className="text-blue-400" />
                </div>
                <div>
                  <span className="text-gray-400 text-sm block">Tipo de procedimiento</span>
                  <span className="text-white font-medium">{caseData.proceedingType || 'No especificado'}</span>
                </div>
              </div>
              
              {/* Materia legal */}
              <div className="flex items-start">
                <div className="bg-blue-900 bg-opacity-30 p-2 rounded-full mr-3 mt-1">
                  <FiClipboard className="text-blue-400" />
                </div>
                <div>
                  <span className="text-gray-400 text-sm block">Materia legal</span>
                  <span className="text-white font-medium">{caseData.subjectMatter || 'No especificado'}</span>
                </div>
              </div>
              
              {/* Fecha de inicio */}
              {caseData.createdAt && (
                <div className="flex items-start">
                  <div className="bg-blue-900 bg-opacity-30 p-2 rounded-full mr-3 mt-1">
                    <FiCalendar className="text-blue-400" />
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm block">Fecha de inicio</span>
                    <span className="text-white font-medium">
                      {new Date(caseData.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Abogado patrocinante - Usando componente reutilizable */}
          {caseData.attorneyOfRecord && (
            <ParticipantDisplay
              participants={[caseData.attorneyOfRecord]}
              type="abogados"
              mode="detailed"
              colorScheme="purple"
            />
          )}
        </div>
        
        {/* Columna derecha - Partes involucradas usando componentes reutilizables */}
        <div className="space-y-5">
          {/* Demandantes */}
          {caseData.plaintiffs && caseData.plaintiffs.length > 0 && (
            <ParticipantDisplay
              participants={caseData.plaintiffs}
              type="demandantes"
              mode="detailed"
              colorScheme="green"
            />
          )}
          
          {/* Demandados */}
          {caseData.defendants && caseData.defendants.length > 0 && (
            <ParticipantDisplay
              participants={caseData.defendants}
              type="demandados"
              mode="detailed"
              colorScheme="red"
            />
          )}
          
          {/* Representante - Si existe */}
          {caseData.representative && (
            <div className="mt-4">
              <ParticipantDisplay
                participants={[caseData.representative]}
                type="representantes"
                mode="detailed"
                colorScheme="blue"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsCard;