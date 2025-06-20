import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import CaseDetails from '@/components/cases/CaseDetails';
import DocumentViewer from '@/components/document/DocumentViewer';
import DocumentVersioning from '@/components/document/DocumentVersioning';
import { useLawsuits } from '@/hooks/useLawsuits';
import { FiArrowLeft, FiFile, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { LawsuitDetailResponse, LawsuitRequest, LawsuitStatus, TaskSummaryResponse } from '@/generated/api/data-contracts';

const CaseDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query as { id: string};
  const [activeTab, setActiveTab] = useState('document'); // 'document' o 'versions'
  const [markdownContent, setMarkdownContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstVersion, setFirstVersion] = useState<TaskSummaryResponse | null>(null);
  const [firstVersionContent, setFirstVersionContent] = useState('');
  const [firstVersionCaseData, setFirstVersionCaseData] = useState<LawsuitDetailResponse | null>(null);
  
  // CAMBIO PRINCIPAL: Mover el estado isEditing aquí
  const [isEditing, setIsEditing] = useState(false);
  
  // Obtener datos del caso usando los nuevos hooks
  const { 
    useLawsuit, 
    deleteLawsuit, 
    updateLawsuit,
    useLawsuitLastRevisions,
    useLawsuitRevisions,
    generate,
    lawsuitResource,
    loading: isLoadingGeneration
  } = useLawsuits();
  
  const { getAccessTokenSilently } = useAuth0();
  const { data: lawsuit, isLoading: isLoadingLawsuit, error: lawsuitError } = useLawsuit(Number(id));
  const { data: revision, isLoading: isLoadingRevision, error: revisiontError } = useLawsuitLastRevisions(Number(id));
  
  // Obtener todas las revisiones del caso
  const { data: revisions = [], isLoading: isLoadingRevisions } = useLawsuitRevisions(Number(id));
  // Efecto para obtener la primera versión del historial
  useEffect(() => {
    const fetchFirstVersion = async () => {
      if (!revisions.length || !id) return;
      
      // Ordenar revisiones de más antigua a más reciente
      const sortedRevisions = [...revisions].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      // Obtener la revisión más antigua (la primera versión)
      const oldestRevision = sortedRevisions[0];
      if (oldestRevision) {
        setFirstVersion(oldestRevision);
        
        try {
          const accessToken = await getAccessTokenSilently();
          
          // Obtener el contenido de la primera versión
          const contentResponse = await lawsuitResource.getRevisionResponse(
            Number(id), 
            oldestRevision.uuid,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              }
            }
          );
          
          const content = await contentResponse.text();
          setFirstVersionContent(content);
          
          // Obtener los datos del caso en la primera versión
          const requestResponse = await lawsuitResource.getRevisionRequest(
            Number(id), 
            oldestRevision.uuid,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              }
            }
          );
          
          if (requestResponse.data) {
            console.log("Datos de primera versión obtenidos:", requestResponse.data);
            setFirstVersionCaseData(requestResponse.data);
          }
        } catch (error) {
          console.error('Error al obtener datos de la primera versión:', error);
        }
      }
    };
    
    fetchFirstVersion();
  }, [revisions, id, getAccessTokenSilently, lawsuitResource]);

  useEffect(() => {
    // CAMBIO: Siempre mostrar la versión más reciente en la vista principal
    if (revision) {
      setMarkdownContent(revision);
    }
  }, [revision]);

  // Manejar eliminación de caso  
  const handleDeleteCase = async () => {
    if (!id) {
      console.error('No se puede eliminar caso: ID no especificado');
      return false;
    }
    
    try {
      console.log('Intentando eliminar caso con ID:', id);
      const numericId = parseInt(id, 10);
      
      if (isNaN(numericId)) {
        console.log('Usando ID como string:', id);
        await deleteLawsuit(Number(id));
      } else {
        console.log('Usando ID como número:', numericId);
        await deleteLawsuit(numericId);
      }
      
      console.log('Operación de eliminación completada exitosamente');
      queryClient.removeQueries(['lawsuit', id]);
      
      toast.success('Caso eliminado exitosamente');
      router.push('/');
      return true;
    } catch (error) {
      console.error('Error detallado al eliminar demanda:', error);
      toast.error(`Error al eliminar el caso: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
      return false;
    }
  };

  // CORRECCIÓN PRINCIPAL: Manejar cambio de estado del caso
  const handleStatusChange = async (newStatus : LawsuitStatus) => {
    try {
      if (!id || !lawsuit) {
        console.error('No se puede cambiar estado: falta ID o datos del caso');
        return;
      }
      
      // CORRECCIÓN: Construir datos correctamente basándose en la estructura actual del caso
      const updateData : LawsuitRequest = {
        title: lawsuit.title || '',
        // CORRECCIÓN: Manejar proceedingType correctamente
        proceedingType: lawsuit.proceedingType || '',
        subjectMatter: lawsuit.subjectMatter || '',
        status: newStatus,
        // CORRECCIÓN: Asegurar que los arrays están definidos
        plaintiffs: (lawsuit.plaintiffs || []).map(p => p.idNumber),
        defendants: (lawsuit.defendants || []).map(d => d.idNumber),
        attorneyOfRecord: lawsuit.attorneyOfRecord?.idNumber,
        representative: lawsuit.representative?.idNumber || undefined,
        claims: lawsuit.claims || [],
        institution: lawsuit.institution || '',
        narrative: lawsuit.narrative || ''
      };
      
      console.log('Actualizando estado con ID:', id, 'y datos:', updateData);
      await updateLawsuit({ id: parseInt(id, 10), data: updateData });
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      toast.error(`Error al cambiar el estado: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Manejar edición del caso
  const handleEditCase = async (updatedData : LawsuitRequest) => {
    try {
      await updateLawsuit({ id: parseInt(id, 10), data: updatedData });
    } catch (error) {
      console.error('Error al actualizar el caso:', error);
      toast.error(`Error al actualizar el caso: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Generar documento - MEJORADO para manejar tanto vista principal como versiones
  const handleGenerateDocument = async () => {
    if (!id) return;
    
    setMarkdownContent('');
    setIsGenerating(true);
    
    try {
      await generate(Number(id), (chunk) => {
        // Solo actualizar el contenido en la vista principal
        if (activeTab === 'document') {
          setMarkdownContent(prev => prev + chunk);
        }
      });
      toast.success('Documento generado exitosamente');
      
    } catch (error) {
      console.error('Error al generar documento:', error);
      toast.error(`Error al generar el documento: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // CAMBIO: Funciones para manejar el modo edición
  const startEditing = () => {
    console.log('🚀 Iniciando modo edición desde página principal');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    console.log('📝 Cancelando edición desde página principal');
    setIsEditing(false);
  };

  // Si está cargando, mostrar indicador
  if (isLoadingLawsuit) {
    return (
      <MainLayout title="Cargando caso..." description="Cargando detalles del caso">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  // Si hay error, mostrar mensaje
  if (lawsuitError) {
    return (
      <MainLayout title="Error" description="Error al cargar el caso">
        <div className="bg-red-900 text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error al cargar el caso</h2>
          <p>{lawsuitError instanceof Error? lawsuitError.message : 'Error desconocido'}</p>
          <Link href="/">
            <button className="mt-4 btn-primary">Volver al Dashboard</button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (!lawsuit) {
    return (
      <MainLayout title="Caso no encontrado" description="El caso solicitado no existe">
        <div className="bg-dark p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2 text-white">Caso no encontrado</h2>
          <p className="text-gray-400 mb-4">El caso que estás buscando no existe o ha sido eliminado.</p>
          <Link href="/">
            <button className="btn-primary">Volver al Dashboard</button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Construir título de la página
  const pageTitle = lawsuit.subjectMatter || 'Detalles de caso';

  return (
    <MainLayout 
      title={pageTitle} 
      description={`Detalles del caso: ${pageTitle}`}
    >
      {/* Cabecera */}
      <div className="mb-6">
        <Link href="/">
          <button className="flex items-center text-gray-400 hover:text-white mb-4">
            <FiArrowLeft className="mr-2" />
            Volver al Dashboard
          </button>
        </Link>
      </div>

      {/* CAMBIO: CaseDetails siempre muestra datos actuales - sin props de versión */}      <CaseDetails 
        caseData={lawsuit} 
        onDelete={handleDeleteCase} 
        onStatusChange={handleStatusChange}
        onEdit={handleEditCase}
        isEditing={isEditing}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        versionCaseData={firstVersionCaseData || undefined}
      />

      {/* CAMBIO PRINCIPAL: Solo mostrar pestañas y contenido si NO estamos editando */}
      {!isEditing && (
        <>
          {/* Pestañas - SIN indicadores de versión en la pestaña principal */}
          <div className="flex border-b border-gray-700 mt-6 mb-4">
            <button
              className={`py-2 px-4 font-medium flex items-center ${
                activeTab === 'document'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('document')}
            >
              <FiFile className="mr-2" />
              Documento
            </button>
            <button
              className={`py-2 px-4 font-medium flex items-center ${
                activeTab === 'versions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('versions')}
            >
              <FiClock className="mr-2" />
              Versiones
            </button>
          </div>

          {/* Contenido según pestaña activa */}
          <div className="bg-dark-lighter rounded-lg">            
            {activeTab === 'document' ? (              
              <DocumentViewer 
                lawsuit={lawsuit}
                content={firstVersionContent || markdownContent}
                onGenerateDocument={handleGenerateDocument}
                isGenerating={isGenerating}
                title={`Demanda: ${lawsuit?.subjectMatter}`}
                versionInfo={firstVersion ? {
                  version: 1,
                  createdAt: firstVersion.createdAt,
                  uuid: firstVersion.uuid,
                  status: 'Completado'
                } : undefined}
                versionCaseData={firstVersionCaseData || undefined}
              />
            ) : (              
            <DocumentVersioning
                lawsuitId={Number(id)}
                onGenerateDocument={handleGenerateDocument}
                isGenerating={isGenerating}
                currentCaseData={lawsuit}
                onFirstVersionSelect={async (version, content) => {
                  // Actualizar la primera versión cuando se obtiene desde el componente
                  setFirstVersion(version);
                  setFirstVersionContent(content);
                  
                  // Obtener datos del caso para la primera versión
                  try {
                    const accessToken = await getAccessTokenSilently();
                    const requestResponse = await lawsuitResource.getRevisionRequest(
                      Number(id), 
                      version.uuid,
                      {
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                        }
                      }
                    );
                    
                    if (requestResponse.data) {
                      setFirstVersionCaseData(requestResponse.data);
                    }
                  } catch (error) {
                    console.error('Error al obtener datos de la versión desde el componente:', error);
                  }
                }}
              />
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default withAuthenticationRequired(CaseDetail);