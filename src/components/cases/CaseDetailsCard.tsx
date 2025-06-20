import React from 'react';
import { LawsuitDetailResponse } from '@/generated/api/data-contracts';
import { FiFileText, FiUser, FiUsers, FiMap, FiClipboard, FiBriefcase, FiBookOpen, FiHash, FiCalendar } from 'react-icons/fi';

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
        {/* Columna izquierda */}
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
          
          {/* Abogado patrocinante */}
          <div className="bg-dark bg-opacity-50 rounded-lg p-4 border-l-2 border-purple-600">
            <h3 className="text-purple-400 font-semibold text-lg mb-3 flex items-center">
              <FiUser className="mr-2" /> 
              Abogado Patrocinante
            </h3>
            {caseData.attorneyOfRecord ? (
              <div className="bg-dark rounded-lg p-4">
                <div className="mb-2 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-900 bg-opacity-30 flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-bold">{caseData.attorneyOfRecord.fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{caseData.attorneyOfRecord.fullName}</p>
                    {caseData.attorneyOfRecord.idNumber && (
                      <p className="text-gray-400 text-xs flex items-center">
                        <FiHash className="mr-1" size={12} />
                        {caseData.attorneyOfRecord.idNumber}
                      </p>
                    )}
                  </div>
                </div>
                
                {caseData.attorneyOfRecord.address && (
                  <div className="mt-3 ml-1 flex items-start">
                    <FiMap className="mr-2 text-gray-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{caseData.attorneyOfRecord.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-dark rounded-md p-3">
                <span className="text-gray-400">No se ha asignado un abogado patrocinante</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Columna derecha - Partes involucradas */}
        <div className="space-y-5">
          {/* Demandantes */}
          <div className="bg-dark bg-opacity-50 rounded-lg p-4 border-l-2 border-green-600">
            <h3 className="text-green-400 font-semibold text-lg mb-3 flex items-center">
              <FiUsers className="mr-2" /> 
              Demandante(s)
            </h3>
            {caseData.plaintiffs && caseData.plaintiffs.length > 0 ? (
              <div className="space-y-3">
                {caseData.plaintiffs.map((plaintiff, index) => (
                  <div key={index} className="bg-dark rounded-lg p-4">
                    <div className="mb-2 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-900 bg-opacity-30 flex items-center justify-center mr-3">
                        <span className="text-green-400 font-bold">{plaintiff.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{plaintiff.fullName}</p>
                        {plaintiff.idNumber && (
                          <p className="text-gray-400 text-xs flex items-center">
                            <FiHash className="mr-1" size={12} />
                            {plaintiff.idNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {plaintiff.address && (
                      <div className="mt-2 ml-1 flex items-start">
                        <FiMap className="mr-2 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{plaintiff.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark rounded-md p-3">
                <span className="text-gray-400">No hay demandantes registrados</span>
              </div>
            )}
          </div>
          
          {/* Demandados */}
          <div className="bg-dark bg-opacity-50 rounded-lg p-4 border-l-2 border-red-600">
            <h3 className="text-red-400 font-semibold text-lg mb-3 flex items-center">
              <FiUsers className="mr-2" /> 
              Demandado(s)
            </h3>
            {caseData.defendants && caseData.defendants.length > 0 ? (
              <div className="space-y-3">
                {caseData.defendants.map((defendant, index) => (
                  <div key={index} className="bg-dark rounded-lg p-4">
                    <div className="mb-2 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-900 bg-opacity-30 flex items-center justify-center mr-3">
                        <span className="text-red-400 font-bold">{defendant.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{defendant.fullName}</p>
                        {defendant.idNumber && (
                          <p className="text-gray-400 text-xs flex items-center">
                            <FiHash className="mr-1" size={12} />
                            {defendant.idNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {defendant.address && (
                      <div className="mt-2 ml-1 flex items-start">
                        <FiMap className="mr-2 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{defendant.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark rounded-md p-3">
                <span className="text-gray-400">No hay demandados registrados</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsCard;
