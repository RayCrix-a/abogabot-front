import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiFileText, FiClock, FiUser } from 'react-icons/fi';

const CaseCard = ({ caseData }) => {
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString || 'Fecha no disponible';
    }
  };
  // Función para determinar el estado
  const getStatus = () => {
    const statusMap = {
      'IN_PROGRESS': 'En curso',
      'PENDING': 'Pendiente',
      'FINALIZED': 'Finalizado',
      'DRAFT': 'Borrador'
    };
    return statusMap[caseData.status] || 'En curso';
  };

  // Función para determinar el color de estado
  const getStatusColor = (status) => {
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
  const id = caseData.id;
  const title = caseData.subjectMatter || caseData.title || 'Caso sin título';
  const description = caseData.narrative || caseData.description || '';
  const createdAt = caseData.createdAt;
  const status = getStatus();
  
  // Construir texto de partes involucradas
  const getParties = () => {
    let parties = '';
    
    // Si tenemos datos de plaintiffs y defendants
    if (caseData.plaintiffs && caseData.defendants) {
      const plaintiffNames = caseData.plaintiffs.map(p => p.fullName);
      const defendantNames = caseData.defendants.map(d => d.fullName);
      
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
    return caseData.parties || 'Partes no especificadas';
  };

  return (
    <Link href={`/cases/${id}`} className="block">
      <div className="bg-dark-lighter hover:bg-dark-light rounded-lg shadow-lg overflow-hidden transition-all duration-200 transform hover:-translate-y-1 border border-gray-800">
        {/* Barra superior de estado */}
        <div className={`h-2 w-full ${getStatusColor(status).split(' ')[0]}`}></div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-lg truncate">{title}</h3>
            <span className={`ml-2 px-3 py-1 rounded-md text-xs font-medium flex-shrink-0 ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
            {description}
          </p>
          
          <div className="border-t border-gray-700 pt-3 mt-2">
            <div className="flex flex-wrap gap-y-2 text-xs text-gray-400">
              <div className="flex items-center w-full">
                <FiFileText className="mr-2 text-primary" />
                <span className="mr-2 font-medium">Tipo:</span> 
                {caseData.proceedingType?.description || 'No especificado'}
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
  );
};

export default CaseCard;