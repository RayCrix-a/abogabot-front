import { useState, useEffect } from 'react';
import { FiShare2, FiEye, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Document, Paragraph, TextRun, Packer } from 'docx';

const DocumentViewer = ({ documentData, lawsuit, onGenerateDocument }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Si el documento tiene contenido, establecerlo
    if (documentData?.content) {
      setMarkdownContent(documentData.content);
    }
  }, [documentData]);
  
  // Función para convertir texto a párrafos de Word
  const convertToWordParagraphs = (text) => {
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
      });
    });
  };

  // Función para descargar en formato Word
  const handleDownloadWord = async () => {
    if (!documentData) {
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
      a.download = `demanda-${lawsuit?.id || 'documento'}.docx`;
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
  const handleShare = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor ingrese un correo electrónico');
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
    setIsPreviewOpen(!isPreviewOpen);
  };

  // Click fuera del modal para cerrar
  const handleClickOutside = (e) => {
    if (e.target === e.currentTarget) {
      setIsPreviewOpen(false);
    }
  };

  // Función para generar un nuevo documento
  const handleGenerateDocument = async () => {
    if (!lawsuit?.id) {
      toast.error('No hay una demanda válida para generar el documento');
      return;
    }
    
    // Limpiar completamente el contenido antes de generar
    setMarkdownContent('');
    setIsGenerating(true);
    setMarkdownContent('Generando documento...\n');
    // Abrir vista previa inmediatamente
    setIsPreviewOpen(true);
    
    try {
      console.log(`Iniciando generación para demanda ID: ${lawsuit.id}`);
      
      // Función para manejar cada chunk del stream
      const handleChunk = (chunk) => {
        setMarkdownContent(prevContent => prevContent + chunk);
      };
      
      await onGenerateDocument(lawsuit.id, handleChunk);
    } catch (error) {
      console.error('Error al generar el documento:', error);
      setMarkdownContent('Error al generar el documento. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-900 text-green-300';
      case 'Pendiente':
        return 'bg-yellow-900 text-yellow-300';
      case 'En curso':
      default:
        return 'bg-blue-900 text-blue-300';
    }
  };

  return (
    <div className="bg-dark-lighter rounded-lg overflow-hidden">
      <div className="p-5">
        <h2 className="text-xl font-bold mb-4">{documentData?.title || 'Documento de demanda'}</h2>
        
        {/* Contenido del documento */}
        <div className="bg-dark p-4 rounded-md border border-gray-700 mb-4 font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {isGenerating ? (
            <div>
              {markdownContent}
              <div className="animate-pulse mt-2">▋</div>
            </div>
          ) : (
            markdownContent || 'No hay contenido para mostrar. Genera un documento primero.'
          )}
        </div>
        
        {/* Información del documento */}
        {documentData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Detalles del documento</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Tipo de procedimiento</td>
                    <td className="py-2 text-white">{lawsuit?.proceedingType?.description || 'No especificado'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Materia</td>
                    <td className="py-2 text-white">{lawsuit?.subjectMatter || 'No especificado'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Estado</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(documentData.status || 'En curso')}`}>
                        {documentData.status || 'En curso'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">Fecha creación</td>
                    <td className="py-2 text-white">
                      {lawsuit?.createdAt ? new Date(lawsuit.createdAt).toLocaleDateString() : 'No disponible'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Partes involucradas</h3>
              <div className="space-y-3">
                {lawsuit?.plaintiffs && lawsuit.plaintiffs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-white">Demandante(s):</h4>
                    <ul className="list-disc list-inside text-gray-400">
                      {lawsuit.plaintiffs.map((plaintiff, idx) => (
                        <li key={idx}>{plaintiff.fullName}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {lawsuit?.defendants && lawsuit.defendants.length > 0 && (
                  <div>
                    <h4 className="font-medium text-white">Demandado(s):</h4>
                    <ul className="list-disc list-inside text-gray-400">
                      {lawsuit.defendants.map((defendant, idx) => (
                        <li key={idx}>{defendant.fullName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleGenerateDocument}
            disabled={isGenerating || !lawsuit?.id}
            className="btn flex items-center gap-2 bg-primary text-white hover:bg-primary-dark"
          >
            <FiEye className="w-4 h-4" />
            {isGenerating ? 'Generando...' : 'Generar documento'}
          </button>
          
          <button
            onClick={togglePreview}
            disabled={!markdownContent}
            className="btn flex items-center gap-2 bg-blue-900 text-blue-300 hover:bg-blue-800"
          >
            <FiEye className="w-4 h-4" />
            Vista previa
          </button>
          
          <button
            onClick={handleDownloadWord}
            disabled={!markdownContent}
            className="btn flex items-center gap-2 bg-green-900 text-green-300 hover:bg-green-800"
          >
            <FiFileText className="w-4 h-4" />
            Descargar Word
          </button>
          
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!markdownContent}
            className="btn flex items-center gap-2 bg-purple-900 text-purple-300 hover:bg-purple-800"
          >
            <FiShare2 className="w-4 h-4" />
            Compartir
          </button>
        </div>
      </div>
      
      {/* Vista previa del documento (modal) */}
      {isPreviewOpen && markdownContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleClickOutside}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
            <div className="bg-gray-100 border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Vista previa del documento</h3>
              <button 
                onClick={togglePreview}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-8">
              <div className="bg-white p-6 font-serif text-black">
                {/* Renderizar contenido Markdown como HTML básico */}
                <div dangerouslySetInnerHTML={{ __html: markdownContent
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n/g, '<br/>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}></div>
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