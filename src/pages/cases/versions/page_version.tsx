import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import DocumentVersioning from '@/components/document/DocumentVersioning';
import EditCaseForm from '@/components/cases/EditCaseForm';
import CaseDetailsCard from '@/components/cases/CaseDetailsCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { LawsuitDetailResponse, TaskSummaryResponse, LawsuitRequest } from '@/generated/api/data-contracts';
import { useQueryClient } from '@tanstack/react-query';

const VersionsPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasCheckedRevisions, setHasCheckedRevisions] = useState(false);
  const queryClient = useQueryClient();
  
  // Obtener datos del caso usando hooks
  const { 
    useLawsuit, 
    generate,
    useLawsuitRevisions,
    updateLawsuit
  } = useLawsuits();
  
  const { data: lawsuit, isLoading: isLoadingLawsuit, error: lawsuitError } = useLawsuit(Number(id));
  
  // Verificar si hay revisiones existentes
  const { data: revisions = [], isLoading: isLoadingRevisions } = useLawsuitRevisions(Number(id));
  
  // Memoizar el ID numérico para evitar recalculos
  const lawsuitId = useMemo(() => Number(id), [id]);

  // Efecto para redirigir si no hay revisiones (solo se ejecuta una vez)
  useEffect(() => {
    if (!isLoadingRevisions && !hasCheckedRevisions && revisions.length === 0) {
      setHasCheckedRevisions(true);
      router.push(`/cases/${id}`);
      toast.info('No hay versiones disponibles para este caso');
    } else if (!isLoadingRevisions && revisions.length > 0) {
      setHasCheckedRevisions(true);
    }
  }, [revisions.length, isLoadingRevisions, id, router, hasCheckedRevisions]);

  // Función para generar documento (memoizada)
  const handleGenerateDocument = useCallback(async () => {
    if (!id) return;
    
    setIsGenerating(true);
    
    try {
      await generate(lawsuitId, () => {
        // No necesitamos procesar el contenido aquí, solo generar la nueva versión
      });
      toast.success('Documento generado exitosamente');
      
    } catch (error) {
      console.error('Error al generar documento:', error);
      toast.error(`Error al generar el documento: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGenerating(false);
    }
  }, [id, lawsuitId, generate]);

  // Funciones de edición (memoizadas)
  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Manejar la actualización del caso desde la vista de edición (memoizada)
  const handleUpdateCase = useCallback(async (updatedData: LawsuitRequest) => {
    try {
      await updateLawsuit({ id: lawsuitId, data: updatedData });
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit', lawsuitId] });
      
      toast.success('Caso actualizado exitosamente');
      setIsEditing(false);
      
      // Recargar las revisiones después de un breve retraso
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['lawsuit-revisions', lawsuitId] });
      }, 500);
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      toast.error(`Error al actualizar el caso: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }, [lawsuitId, updateLawsuit, queryClient]);

  // Si está cargando, mostrar indicador
  if (isLoadingLawsuit || (isLoadingRevisions && !hasCheckedRevisions)) {
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
          <p>{lawsuitError instanceof Error? lawsuitError.message : 'Error desconocido'}</p>
          <Link href={`/cases/${id}`}>
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

  // Si no hay revisiones y ya hemos verificado, no renderizar nada (se redirigirá)
  if (hasCheckedRevisions && revisions.length === 0) {
    return null;
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
          <div className="flex items-center space-x-4">
            <Link href={`/cases/${id}`}>
              <button className="flex items-center text-gray-400 hover:text-white">
                <FiArrowLeft className="mr-2" />
                Volver al Caso
              </button>
            </Link>
          </div>
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
        <>
          {/* Detalles del documento actual */}
          <CaseDetailsCard caseData={lawsuit} />
          
          {/* Mostrar componente de versionado si no estamos en modo edición */}
          <DocumentVersioning
            lawsuitId={lawsuitId}
            onGenerateDocument={handleGenerateDocument}
            isGenerating={isGenerating}
            currentCaseData={lawsuit}
            onStartEditing={handleStartEditing}
          />
        </>
      )}
    </MainLayout>
  );
};

export default withAuthenticationRequired(VersionsPage);