import { useState, useEffect, useCallback, useMemo } from 'react';
import { FiClock, FiEye, FiDownload, FiRefreshCw, FiCheck, FiX, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatRelativeTime } from '@/utils/dateUtils';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useAuth0 } from '@auth0/auth0-react';
import { TaskSummaryResponse, LawsuitDetailResponse } from '@/generated/api/data-contracts';

interface DocumentVersioningProps {
  lawsuitId: number;
  onGenerateDocument: () => void;
  isGenerating: boolean;
  currentCaseData: LawsuitDetailResponse;
  onFirstVersionSelect?: (version: TaskSummaryResponse, content: string) => void;
  onStartEditing?: () => void;
}

const DocumentVersioning = ({ 
  lawsuitId, 
  onGenerateDocument,
  isGenerating,
  currentCaseData,
  onFirstVersionSelect,
  onStartEditing
}: DocumentVersioningProps) => {
  const { getAccessTokenSilently } = useAuth0();
  const [selectedRevision, setSelectedRevision] = useState<TaskSummaryResponse | null>(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState<string>('');
  const [versionCaseData, setVersionCaseData] = useState<LawsuitDetailResponse | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [hasNotifiedFirstVersion, setHasNotifiedFirstVersion] = useState(false);

  const { 
    useLawsuitRevisions, 
    lawsuitResource 
  } = useLawsuits();
  
  // Obtener las revisiones de la demanda
  const { 
    data: revisions = [], 
    isLoading: isLoadingRevisions, 
    refetch: refetchRevisions 
  } = useLawsuitRevisions(lawsuitId);

  // Memoizar las revisiones ordenadas para evitar recalculos innecesarios
  const sortedRevisions = useMemo(() => {
    return [...revisions].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [revisions]);

  // Función para obtener el contenido de una revisión (memoizada)
  const getRevisionContent = useCallback(async (revision: TaskSummaryResponse): Promise<string> => {
    try {
      const accessToken = await getAccessTokenSilently();
      
      const makeApiCall = async () => {
        const contentResponse = await lawsuitResource.getRevisionResponse(
          lawsuitId, 
          revision.uuid,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          }
        );
        return contentResponse;
      };
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const contentResponse = await makeApiCall();
          return await contentResponse.text();
        } catch (networkError) {
          if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error(`Error de conexión después de ${maxRetries} intentos:`, networkError);
              throw networkError;
            }
            console.warn(`Reintentando conexión (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          } else {
            throw networkError;
          }
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error al obtener datos de la versión:', error);
      return '';
    }
  }, [getAccessTokenSilently, lawsuitId, lawsuitResource]);

  // Función para manejar la selección de versión (memoizada)
  const handleVersionSelect = useCallback(async (revision: TaskSummaryResponse) => {
    if (selectedRevision?.uuid === revision.uuid) return;

    setIsLoadingContent(true);
    setSelectedRevision(revision);
    
    try {
      const accessToken = await getAccessTokenSilently();
      
      // Obtener el contenido de la versión
      const contentResponse = await lawsuitResource.getRevisionResponse(
        lawsuitId, 
        revision.uuid,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );
      
      const content = await contentResponse.text();
      setSelectedVersionContent(content);
      
      // Obtener los datos del caso en esa versión
      const requestResponse = await lawsuitResource.getRevisionRequest(
        lawsuitId, 
        revision.uuid,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );
      
      const versionData = requestResponse.data;
      setVersionCaseData(versionData);
      
    } catch (error) {
      console.error('Error al obtener datos de la versión:', error);
      toast.error('Error al cargar los datos de la versión');
    } finally {
      setIsLoadingContent(false);
    }
  }, [selectedRevision?.uuid, getAccessTokenSilently, lawsuitId, lawsuitResource]);

  // Efecto para seleccionar automáticamente la versión más reciente
  // Solo se ejecuta cuando cambian las revisiones ordenadas
  useEffect(() => {
    if (sortedRevisions.length > 0 && !selectedRevision) {
      const latestRevision = sortedRevisions[0];
      handleVersionSelect(latestRevision);
    }
  }, [sortedRevisions, selectedRevision, handleVersionSelect]);

  // Efecto para notificar la primera versión (más antigua)
  // Solo se ejecuta una vez cuando hay revisiones y existe la callback
  useEffect(() => {
    if (onFirstVersionSelect && sortedRevisions.length > 0 && !hasNotifiedFirstVersion) {
      const oldestRevisions = [...sortedRevisions].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      const firstVersion = oldestRevisions[0];
      if (firstVersion) {
        getRevisionContent(firstVersion).then(content => {
          if (content && onFirstVersionSelect) {
            onFirstVersionSelect(firstVersion, content);
            setHasNotifiedFirstVersion(true);
          }
        });
      }
    }
  }, [onFirstVersionSelect, sortedRevisions, hasNotifiedFirstVersion, getRevisionContent]);

  // Efecto para refrescar revisiones después de generar un documento
  // Solo se ejecuta cuando isGenerating cambia de true a false
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isGenerating && revisions.length > 0) {
      timeoutId = setTimeout(() => {
        refetchRevisions();
      }, 1000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGenerating, refetchRevisions, revisions.length]);

  // Funciones auxiliares memoizadas
  const getStatusIcon = useCallback((revision: TaskSummaryResponse) => {
    if (revision.createdAt) {
      return <FiCheck className="text-green-400" />;
    }
    return <FiClock className="text-gray-400" />;
  }, []);

  const getStatusColor = useCallback((revision: TaskSummaryResponse) => {
    if (revision.createdAt) {
      return 'bg-green-900/30 border-green-700 text-green-300';
    }
    return 'bg-gray-900/30 border-gray-700 text-gray-300';
  }, []);

  const getStatusText = useCallback((revision: TaskSummaryResponse) => {
    return revision.createdAt ? 'Completado' : 'Procesando';
  }, []);

  // Función para descargar versión (memoizada)
  const downloadVersion = useCallback(async (revision: TaskSummaryResponse) => {
    try {
      const accessToken = await getAccessTokenSilently();
      
      const response = await lawsuitResource.getRevisionResponse(
        lawsuitId, 
        revision.uuid,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }
        }
      );
      
      const content = await response.text();
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demanda-v${revision.uuid.substring(0, 8)}-${new Date(revision.createdAt).toLocaleDateString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Documento descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar versión:', error);
      toast.error('Error al descargar el documento');
    }
  }, [getAccessTokenSilently, lawsuitId, lawsuitResource]);

  // Función para editar versión (memoizada)
  const handleEditVersion = useCallback(() => {
    if (onStartEditing) {
      onStartEditing();
    }
  }, [onStartEditing]);

  return (
    <div className="bg-dark-lighter rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Versiones del Documento</h2>
          <p className="text-gray-400">
            Historial de todas las versiones generadas de la demanda
          </p>
        </div>
        
        <div className="flex gap-3">          
          {/* Botón para editar la versión seleccionada */}
          {versionCaseData && onStartEditing && (
            <button
              onClick={handleEditVersion}
              className="btn-secondary py-2 px-4 flex items-center gap-2"
              title="Editar esta versión para generar una nueva"
            >
              <FiEdit className="w-4 h-4" />
              Editar Versión
            </button>
          )}
          
          <button
            onClick={onGenerateDocument}
            disabled={isGenerating}
            className="btn-primary py-2 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FiRefreshCw className="w-4 h-4" />
                Nueva Versión
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-96">
        {/* Lista de versiones */}
        <div className="w-1/3 border-r border-gray-700 pr-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Historial ({revisions.length})
          </h3>
          
          {isLoadingRevisions ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Cargando versiones...</p>
            </div>
          ) : sortedRevisions.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-80">
              {sortedRevisions.map((revision, index) => (
                <div
                  key={revision.uuid}
                  onClick={() => handleVersionSelect(revision)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-700/50 ${
                    selectedRevision?.uuid === revision.uuid
                      ? 'bg-primary/20 border-primary/50'
                      : 'bg-dark border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(revision)}
                      <span className="text-white font-medium text-sm">
                        Versión {sortedRevisions.length - index}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-primary px-2 py-1 rounded text-white">
                          Actual
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadVersion(revision);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                      title="Descargar esta versión"
                    >
                      <FiDownload className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mb-2 ${getStatusColor(revision)}`}>
                    {getStatusText(revision)}
                  </div>
                  
                  <p className="text-gray-400 text-xs mt-1">
                    ID: {revision.uuid}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiClock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">No hay versiones</p>
              <p className="text-gray-500 text-xs">
                Genera tu primera versión del documento
              </p>
            </div>
          )}
        </div>

        {/* Vista previa de la versión seleccionada */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedRevision 
                ? `Versión ${sortedRevisions.length - sortedRevisions.findIndex(r => r.uuid === selectedRevision.uuid)}`
                : 'Vista Previa'
              }
            </h3>
          </div>

          <div className="bg-dark border border-gray-700 rounded-lg p-4 h-80 overflow-y-auto">
            {isLoadingContent ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Cargando contenido...</p>
                </div>
              </div>
            ) : selectedVersionContent ? (
              <div className="text-gray-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {selectedVersionContent}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FiEye className="w-8 h-8 mx-auto mb-2" />
                  <p>Selecciona una versión para ver su contenido</p>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional de la versión */}
          {selectedRevision && (
            <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-2">Información de la versión</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded ${getStatusColor(selectedRevision)}`}>
                    {getStatusText(selectedRevision)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">UUID:</span>
                  <span className="ml-2 text-green-400 font-mono">
                    {selectedRevision.uuid}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Creada:</span>
                  <span className="ml-2 text-white">
                    {new Date(selectedRevision.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVersioning;