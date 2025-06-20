import { useState, useEffect } from 'react';
import { FiShare2, FiEye, FiFileText, FiRefreshCw, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { LawsuitDetailResponse } from '@/generated/api/data-contracts';
import { formatRelativeTime } from '@/utils/dateUtils';

interface DocumentViewerProps {
  lawsuit: LawsuitDetailResponse;
  content: string;
  onGenerateDocument: () => void;
  isGenerating?: boolean;
  title?: string;
  versionInfo?: {
    version?: number;
    createdAt?: string;
    uuid?: string;
    status?: string;
  };
  versionCaseData?: LawsuitDetailResponse; // Datos del caso para la versión específica
  onSwitchToVersions?: () => void; // Nueva prop para cambiar a la pestaña de versiones
  isFirstGeneration?: boolean; // Indica si es la primera generación (para usar streaming)
}

const DocumentViewer = ({ 
  lawsuit, 
  content,
  onGenerateDocument,
  isGenerating = false,
  title,
  versionInfo,
  versionCaseData,
  onSwitchToVersions,
  isFirstGeneration: propIsFirstGeneration
}: DocumentViewerProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  
  // Usar datos de la versión cuando estén disponibles, de lo contrario usar datos actuales
  const displayData = versionCaseData || lawsuit;
  
  useEffect(() => {
    // Si hay contenido, establecerlo
    if (content) {
      setMarkdownContent(content);
    }
  }, [content]);
  
  // Función para convertir texto a párrafos de Word
  const convertToWordParagraphs = (text : string) => {
    return text.split('\n').map(line => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: 'Times New Roman',
            size: 24, // 12pt
          })
        ],
        spacing: {
          after: 200,
          line: 360,
        },
        alignment: 'justify'
      } as any);
    });
  };

  // Función para descargar en formato Word
  const handleDownloadWord = async () => {
    if (!markdownContent.trim()) {
      toast.error('No hay documento para descargar');
      return;
    }
    
    try {
      // Crear documento
      const doc = new Document({
        sections: [{
          properties: {},
          children: convertToWordParagraphs(markdownContent)
        }]
      });

      // Generar archivo Word
      const blob = await Packer.toBlob(doc);
      
      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `demanda-${lawsuit?.id || 'documento'}-${new Date().toISOString().split('T')[0]}.docx`;
      window.document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Documento descargado en formato Word correctamente');
    } catch (error) {
      console.error('Error al descargar el documento en Word:', error);
      toast.error('Error al descargar el documento en Word');
    }
  };
  
  // Función para manejar compartir
  const handleShare = (e : any) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor ingrese un correo electrónico');
      return;
    }
    
    if (!markdownContent.trim()) {
      toast.error('No hay documento para compartir');
      return;
    }
    
    toast.info(`Compartiendo documento con ${email}...`);
    // Aquí iría la lógica real para compartir por email
    setTimeout(() => {
      toast.success(`Documento compartido con ${email}`);
      setShowShareModal(false);
      setEmail('');
    }, 1500);
  };
    // Función para ver la vista previa
  const togglePreview = () => {
    if (!markdownContent.trim() && !isGenerating) {
      toast.error('No hay contenido para mostrar en vista previa');
      return;
    }
    setIsPreviewOpen(!isPreviewOpen);
  };

  // Función para abrir la vista previa (sin toggle)
  const openPreview = () => {
    setIsPreviewOpen(true);
  };

  // Click fuera del modal para cerrar
  const handleClickOutside = (e : any) => {
    // Si está generando, no permitir cerrar haciendo clic fuera
    if (e.target === e.currentTarget && !isGenerating) {
      setIsPreviewOpen(false);
    }
  };

  // Función para obtener color según estado
  const getStatusColor = (status : string) => {
    switch (status) {
      case 'Finalizado':
      case 'Completado':
        return 'bg-green-900 text-green-300';
      case 'Pendiente':
        return 'bg-yellow-900 text-yellow-300';
      case 'En curso':
      default:
        return 'bg-blue-900 text-blue-300';
    }
  };

  // Determinar el título del documento
  const documentTitle = title || `Demanda: ${lawsuit?.subjectMatter || 'Documento legal'}`;
    // Determinar el estado actual
  const currentStatus = lawsuit?.status === 'FINALIZED' ? 'Finalizado' : 
                       lawsuit?.status === 'PENDING' ? 'Pendiente' : 'En curso';
                         // Determinar si es la primera generación (no hay versiones ni contenido o se especificó en las props)
  const isFirstGeneration = propIsFirstGeneration !== undefined ? propIsFirstGeneration : (!versionInfo && !markdownContent.trim());

  return (
    <div className="bg-dark-lighter rounded-lg overflow-hidden">
      <div className="p-5">
        <h2 className="text-xl font-bold mb-4">{documentTitle}</h2>
        
        {/* Información de versión si está disponible */}
        {versionInfo && (
          <div className="mb-4 bg-dark p-3 rounded-md border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(versionInfo.status || 'Completado')}`}>
                  {versionInfo.status || 'Completado'}
                </div>
                <span className="ml-2 text-white font-medium">Versión {versionInfo.version || 1}</span>
              </div>
              {versionInfo.createdAt && (
                <p className="text-gray-400 text-xs">{versionInfo.createdAt ? formatRelativeTime(versionInfo.createdAt) : 'No disponible'}</p>
              )}
            </div>
            {versionInfo.uuid && (
                <p className="text-gray-500 text-xs mt-1">ID: {versionInfo.uuid}</p>
            )}
          </div>
        )}
          {/* Contenido del documento */}
        <div className="bg-dark p-4 rounded-md border border-gray-700 mb-4 font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {isGenerating && !isPreviewOpen ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400">Generando documento...</p>
                <p className="text-gray-500 text-xs mt-1">Ver en la vista previa para seguir en tiempo real</p>
              </div>
            </div>
          ) : markdownContent ? (
            markdownContent
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <FiFileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500">No hay contenido para mostrar</p>
                <p className="text-gray-600 text-xs mt-1">Genera un documento para ver el contenido aquí</p>
              </div>
            </div>
          )}
        </div>
          {/* Información del documento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Detalles del documento</h3>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-gray-400">Tipo de procedimiento</td>
                  <td className="py-2 text-white">{displayData?.proceedingType || 'No especificado'}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-gray-400">Materia</td>
                  <td className="py-2 text-white">{displayData?.subjectMatter || 'No especificado'}</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-gray-400">Estado</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      displayData?.status === 'FINALIZED' ? 'Finalizado' : 
                      displayData?.status === 'PENDING' ? 'Pendiente' : 'En curso'
                    )}`}>
                      {displayData?.status === 'FINALIZED' ? 'Finalizado' : 
                      displayData?.status === 'PENDING' ? 'Pendiente' : 'En curso'}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-gray-400">Fecha creación</td>
                  <td className="py-2 text-white">
                    {displayData?.createdAt ? new Date(displayData.createdAt).toLocaleDateString() : 
                      versionInfo?.createdAt ? new Date(versionInfo.createdAt).toLocaleDateString() : 'No disponible'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Partes involucradas</h3>
            <div className="space-y-3">
              {displayData?.plaintiffs && displayData.plaintiffs.length > 0 && (
                <div>
                  <h4 className="font-medium text-white">Demandante(s):</h4>
                  <ul className="list-disc list-inside text-gray-400">
                    {displayData.plaintiffs.map((plaintiff, idx) => (
                      <li key={idx}>{plaintiff.fullName}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {displayData?.defendants && displayData.defendants.length > 0 && (
                <div>
                  <h4 className="font-medium text-white">Demandado(s):</h4>
                  <ul className="list-disc list-inside text-gray-400">
                    {displayData.defendants.map((defendant, idx) => (
                      <li key={idx}>{defendant.fullName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>          
          {/* La información de la versión ahora se muestra en la parte superior del componente */}
          {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 mt-6">          <button
            onClick={() => {
              // Si hay versiones, usar onSwitchToVersions para ir a la página de versiones
              // De lo contrario, generar un nuevo documento
              if (versionInfo && versionInfo.version === 1) {
                if (onSwitchToVersions) {
                  onSwitchToVersions();
                }
              } else {
                // Abrir vista previa automáticamente al generar
                openPreview();
                // Comportamiento original si no hay versión 1
                onGenerateDocument();
              }
            }}
            disabled={isGenerating}
            className={`btn flex items-center gap-2 ${
              isGenerating 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                : isFirstGeneration
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {/* Mostrar icono según el estado */}
            {isGenerating ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : versionInfo ? (
              <FiClock className="w-4 h-4" />
            ) : (
              <FiRefreshCw className="w-4 h-4" />
            )}
            {isGenerating ? 'Generando...' : versionInfo ? 'Ver todas las versiones' : isFirstGeneration ? 'Generar primer documento (streaming)' : 'Generar documento'}
          </button>
          
          <button
            onClick={togglePreview}
            disabled={!markdownContent.trim() || isGenerating}
            className="btn flex items-center gap-2 bg-blue-900 text-blue-300 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiEye className="w-4 h-4" />
            Vista previa
          </button>
          
          <button
            onClick={handleDownloadWord}
            disabled={!markdownContent.trim() || isGenerating}
            className="btn flex items-center gap-2 bg-green-900 text-green-300 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiFileText className="w-4 h-4" />
            Descargar Word
          </button>
          
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!markdownContent.trim() || isGenerating}
            className="btn flex items-center gap-2 bg-purple-900 text-purple-300 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShare2 className="w-4 h-4" />
            Compartir
          </button>
        </div>

        {/* Mensaje informativo si no hay contenido */}
        {!markdownContent.trim() && !isGenerating && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-start gap-3">
              <FiFileText className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-medium">¿Cómo generar tu documento?</h4>
                <p className="text-blue-200 text-sm mt-1">
                  Haz clic en "Generar nueva versión" para crear el documento legal basado en los datos del caso. 
                  Cada generación creará una nueva versión que podrás ver en la pestaña "Versiones".
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
        {/* Vista previa del documento (modal) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleClickOutside}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
            <div className="bg-gray-100 border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {isGenerating ? 'Generando documento en tiempo real...' : 'Vista previa del documento'}
              </h3>
              {/* Solo mostrar botón de cerrar si no está generando */}
              {!isGenerating && (
                <button 
                  onClick={togglePreview}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="p-8">
              <div className="bg-white p-6 font-serif text-black">
                {markdownContent.trim() ? (
                  /* Renderizar contenido Markdown como HTML básico */
                  <div dangerouslySetInnerHTML={{ __html: markdownContent
                    .replace(/\n\n/g, '<br/><br/>')
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }}></div>
                ) : isGenerating ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Generando documento, por favor espere...</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay contenido disponible para mostrar</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para compartir documento */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-dark-lighter rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">Compartir documento</h3>
            <form onSubmit={handleShare}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingrese el correo electrónico"
                  className="input-field"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;