import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiFileText, FiClock, FiUser } from 'react-icons/fi';
import { LawsuitDetailResponse, LawsuitSummaryResponse } from '@/generated/api/data-contracts';

interface CaseCardProps {
  caseData: LawsuitSummaryResponse;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

const CaseCard = ({ caseData, isSelectable = false, isSelected = false, onToggleSelect } : CaseCardProps) => {
  // Función para formatear la fecha
  const formatDate = (dateString : string) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString || 'Fecha no disponible';
    }
  };

  // Función para determinar el estado - CORREGIDA para usar el estado real
  const getStatus = () => {
    // Si no hay status, usar valor por defecto
    if (!caseData.status) {
      return 'En curso';
    }

    const statusMap = {
      'IN_PROGRESS': 'En curso',
      'PENDING': 'Pendiente',
      'FINALIZED': 'Finalizado',
      'DRAFT': 'Borrador'
    };

    return statusMap[caseData.status] || 'En curso';
  };

  // Función para determinar el color de estado
  const getStatusColor = (status : string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-600 text-white';
      case 'Pendiente':
        return 'bg-amber-500 text-white';
      case 'En curso':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  // Para manejar posibles formatos de datos diferentes
  const id = caseData?.id;
  const title = caseData?.title || 'Caso sin título';
  const subjectMatter = caseData?.subjectMatter || 'Caso sin materia legal';
  
  // CORRECCIÓN: Manejo mejorado del tipo de procedimiento
  const getProceedingType = () => {
    const { proceedingType } = caseData || {};
    
    if (!proceedingType) {
      return 'Tipo de procedimiento no especificado';
    }
    return proceedingType;
  };
  
  const createdAt = caseData?.createdAt;
  const status = getStatus();

  // Construir texto de partes involucradas
  const getParties = () => {
    const { plaintiffs, defendants } = caseData || {};
    let parties = '';
    
    // Si tenemos datos de plaintiffs y defendants
    if (plaintiffs && defendants) {
      const plaintiffNames = plaintiffs.map(p => p.fullName);
      const defendantNames = defendants.map(d => d.fullName);
      
      if (plaintiffNames.length > 0 && defendantNames.length > 0) {
        parties = `${plaintiffNames[0]} vs. ${defendantNames[0]}`;
        
        // Si hay más de uno, indicar
        if (plaintiffNames.length + defendantNames.length > 2) {
          parties += ` y otros`;
        }
        
        return parties;
      }
    }
    
    // Si no tenemos datos de la API, usar el valor existente o un valor por defecto
    return 'Partes no especificadas';
  };  // Esta función maneja si se hace clic en la tarjeta para seleccionarla
  const handleCardSelection = (e: React.MouseEvent) => {
    if (isSelectable && onToggleSelect && caseData.id) {
      e.preventDefault(); // Evitar navegación
      e.stopPropagation(); // Evitar que el evento se propague
      onToggleSelect(caseData.id);
    }
  };
  
  return (
    <div 
      className={`relative ${isSelectable ? 'cursor-pointer' : ''} ${
        isSelected ? 'ring-4 ring-primary ring-opacity-70' : ''
      }`}
      onClick={isSelectable ? handleCardSelection : undefined}
    >
      {isSelectable && (
        <div className="absolute top-0 left-0 w-full h-full z-10 flex items-center justify-center pointer-events-none">
          <div className={`absolute top-0 right-0 m-3 rounded-full ${
            isSelected ? 'bg-primary text-white' : 'bg-gray-700/50 border border-gray-500'
          } w-8 h-8 flex items-center justify-center`}>
            {isSelected && (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        </div>
      )}      <Link href={`/cases/${id}`} className={`block ${isSelectable ? 'pointer-events-none' : ''}`}>
        <div className={`bg-dark-lighter hover:bg-dark-light rounded-lg shadow-lg overflow-hidden transition-all duration-200 transform ${!isSelectable && 'hover:-translate-y-1'} border border-gray-800 ${isSelected ? 'bg-dark-light border-primary/50' : ''}`}>
          {/* Barra superior de estado */}
          <div className={`h-2 w-full ${getStatusColor(status).split(' ')[0]}`}></div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg truncate">{title}</h3>
              <span className={`ml-2 px-3 py-1 rounded-md text-xs font-medium flex-shrink-0 ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>          
            <div className="border-t border-gray-700 pt-3 mt-2">
              <div className="flex flex-wrap gap-y-2 text-xs text-gray-400">
                <div className="flex items-center w-full">
                  <FiFileText className="mr-2 text-primary" />
                  <span className="mr-2 font-medium">Caso Nº:</span>{id}
                </div>
                <div className="flex items-center w-full">
                  <FiFileText className="mr-2 text-primary" />
                  <span className="mr-2 font-medium">Tipo:</span>{getProceedingType()}
                </div>
                <div className="flex items-center w-full">
                  <FiFileText className="mr-2 text-primary" />
                  <span className="mr-2 font-medium">Materia:</span>{subjectMatter}
                </div>
                <div className="flex items-center w-full">
                  <FiClock className="mr-2 text-primary" />
                  <span className="mr-2 font-medium">Creado:</span> {formatDate(createdAt)}
                </div>
                <div className="flex items-center w-full">
                  <FiUser className="mr-2 text-primary" />
                  <span className="mr-2 font-medium">Partes:</span> {getParties()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CaseCard;