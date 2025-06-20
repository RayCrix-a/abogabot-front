import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import DocumentVersioning from '@/components/document/DocumentVersioning';
import EditCaseForm from '@/components/cases/EditCaseForm';
import { useLawsuits } from '@/hooks/useLawsuits';
import { FiArrowLeft, FiFile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { LawsuitDetailResponse, TaskSummaryResponse, LawsuitRequest } from '@/generated/api/data-contracts';
import { useQueryClient } from '@tanstack/react-query';

const VersionsPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstVersion, setFirstVersion] = useState<TaskSummaryResponse | null>(null);
  const [firstVersionContent, setFirstVersionContent] = useState('');
  const [firstVersionCaseData, setFirstVersionCaseData] = useState<LawsuitDetailResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar el modo de edición
  const queryClient = useQueryClient();
  
  // Obtener datos del caso usando hooks
  const { 
    useLawsuit, 
    generate,
    useLawsuitRevisions,
    lawsuitResource,
    updateLawsuit
  } = useLawsuits();
  
  const { getAccessTokenSilently } = useAuth0();
  const { data: lawsuit, isLoading: isLoadingLawsuit, error: lawsuitError } = useLawsuit(Number(id));
  
  // Verificar si hay revisiones existentes
  const { data: revisions = [], isLoading: isLoadingRevisions } = useLawsuitRevisions(Number(id));
  // Efecto para redirigir si no hay revisiones
  useEffect(() => {
    if (!isLoadingRevisions && revisions.length === 0) {
      // Si no hay revisiones, redirigir a la página principal del caso
      router.push(`/cases/${id}`);
      toast.info('No hay versiones disponibles para este caso');
    }
  }, [revisions, isLoadingRevisions, id, router]);

  // Generar documento
  const handleGenerateDocument = async () => {
    if (!id) return;
    
    setIsGenerating(true);
    
    try {
      await generate(Number(id), () => {
        // No necesitamos procesar el contenido aquí, solo generar la nueva versión
      });
      toast.success('Documento generado exitosamente');
      
    } catch (error) {
      console.error('Error al generar documento:', error);
      toast.error(`Error al generar el documento: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGenerating(false);
    }
  };  // Iniciar modo de edición - Ahora se maneja dentro de la misma página
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // Cancelar edición y volver a la vista de versiones
  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  // Manejar la actualización del caso desde la vista de edición
  const handleUpdateCase = async (updatedData: LawsuitRequest) => {
    try {
      await updateLawsuit({ id: Number(id), data: updatedData });
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit', Number(id)] });
      
      toast.success('Caso actualizado exitosamente');
      setIsEditing(false); // Volver a la vista de versiones
      
      // Recargar las revisiones después de un breve retraso
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['lawsuit-revisions', Number(id)] });
      }, 500);
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      toast.error(`Error al actualizar el caso: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Si está cargando, mostrar indicador
  if (isLoadingLawsuit) {
    return (
      <MainLayout title="Cargando versiones..." description="Cargando historial de versiones">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  // Si hay error, mostrar mensaje
  if (lawsuitError) {
    return (
      <MainLayout title="Error" description="Error al cargar las versiones">
        <div className="bg-red-900 text-red-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error al cargar las versiones</h2>
          <p>{lawsuitError instanceof Error? lawsuitError.message : 'Error desconocido'}</p>          <Link href={`/cases/${id}`}>
            <button className="mt-4 btn-primary">Volver al Caso</button>
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
  const pageTitle = `Versiones - ${lawsuit.subjectMatter || 'Caso'}`;
  return (
    <MainLayout 
      title={pageTitle} 
      description={`Historial de versiones del caso: ${lawsuit.subjectMatter}`}
    >
      {/* Cabecera con navegación */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">            <Link href={`/cases/${id}`}>
              <button className="flex items-center text-gray-400 hover:text-white">
                <FiArrowLeft className="mr-2" />
                Volver al Caso
              </button>
            </Link>
            <Link href={`/cases/${id}`}>
              <button className="flex items-center btn-outline-primary py-1 px-3">
                <FiFile className="mr-2" />
                Ver Documento
              </button>
            </Link>
          </div>
          
          <h1 className="text-xl font-bold text-white">{lawsuit.title || lawsuit.subjectMatter}</h1>
        </div>
      </div>

      {/* Modo edición - Mostrar formulario de edición */}
      {isEditing ? (
        <div className="bg-dark-lighter rounded-lg p-6">
          <EditCaseForm 
            caseData={lawsuit} 
            hasGeneratedVersions={true} 
            onCancel={handleCancelEditing}
            onEdit={handleUpdateCase} 
          />
        </div>
      ) : (
        /* Mostrar componente de versionado si no estamos en modo edición */
        <DocumentVersioning
          lawsuitId={Number(id)}
          onGenerateDocument={handleGenerateDocument}
          isGenerating={isGenerating}
          currentCaseData={lawsuit}
          onStartEditing={handleStartEditing}        onFirstVersionSelect={async (version, content) => {
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
    </MainLayout>
  );
};

export default withAuthenticationRequired(VersionsPage);
