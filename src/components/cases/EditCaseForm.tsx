import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiSave, FiX } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useProceedingTypes } from '@/hooks/useProceedingTypes';
import { useSubjectMatters } from '@/hooks/useSubjectMatters';
import { LawsuitDetailResponse, LawsuitRequest } from '@/generated/api/data-contracts';
import { ParticipantType, PersonSummary, mapApiParticipantToPersonSummary } from '@/types/ParticipantTypes';
import ParticipantSection from '@/components/participants/ParticipantSection';
import ClaimsSection from '@/components/claims/ClaimsSection';

// Esquema de validación
const editCaseSchema = z.object({
  title: z.string().max(100, 'El título no puede exceder 100 caracteres'),
  proceedingType: z.string().min(1, 'Seleccione un tipo de procedimiento'),
  legalMatter: z.string().min(1, 'Seleccione una materia legal'),
  institution: z.string().min(1, 'Tribunal requerido'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
});

interface EditCaseFormData {
  title: string;
  proceedingType: string;
  legalMatter: string;
  institution: string;
  description: string;
}

export interface EditCaseFormProps { 
  caseData: LawsuitDetailResponse;
  onCancel: () => void;
  onEdit?: (data: LawsuitRequest) => Promise<void>;
  hasGeneratedVersions?: boolean;
  switchToVersionsTab?: () => void;
}

const EditCaseForm = ({ 
  caseData, 
  onCancel, 
  onEdit, 
  hasGeneratedVersions = false, 
  switchToVersionsTab 
}: EditCaseFormProps) => {
  const [saving, setSaving] = useState(false);
  const [claims, setClaims] = useState<string[]>([]);
  const queryClient = useQueryClient();
  
  // Estado para participantes seleccionados
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, PersonSummary[]>>({
    demandantes: [],
    demandados: [],
    abogados: [],
    representantes: []
  });
  
  // Hooks para acceder a datos de la API
  const { updateLawsuit } = useLawsuits();
  const { proceedingTypeOptions, isLoading: isLoadingProceedingTypes } = useProceedingTypes();
  const { subjectMatterOptions, isLoading: isLoadingSubjectMatters } = useSubjectMatters();
  
  // Preparar valores iniciales
  const getInitialValues = (): EditCaseFormData => {
    return {
      title: caseData.title || '',
      proceedingType: caseData.proceedingType || '',
      legalMatter: caseData.subjectMatter || '',
      institution: caseData.institution || 'S.J.L. EN LO CIVIL',
      description: caseData.narrative || '',
    };
  };
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EditCaseFormData>({
    resolver: zodResolver(editCaseSchema),
    defaultValues: getInitialValues()
  });

  // Inicializar datos del caso al cargar
  useEffect(() => {
    if (caseData) {
      // Inicializar personas seleccionadas usando las nuevas interfaces
      const demandantesSeleccionados = (caseData.plaintiffs || []).map(p => 
        mapApiParticipantToPersonSummary(p)
      );
      
      const demandadosSeleccionados = (caseData.defendants || []).map(d => 
        mapApiParticipantToPersonSummary(d)
      );
      
      const abogadosSeleccionados = caseData.attorneyOfRecord ? [
        mapApiParticipantToPersonSummary(caseData.attorneyOfRecord)
      ] : [];
      
      const representantesSeleccionados = caseData.representative ? [
        mapApiParticipantToPersonSummary(caseData.representative)
      ] : [];

      setSelectedParticipants({
        demandantes: demandantesSeleccionados,
        demandados: demandadosSeleccionados,
        abogados: abogadosSeleccionados,
        representantes: representantesSeleccionados
      });

      // Inicializar claims
      if (caseData.claims && caseData.claims.length > 0) {
        setClaims(caseData.claims);
      }
    }
  }, [caseData]);

  // Manejar cambios en participantes
  const handleParticipantsChange = (type: ParticipantType, participants: PersonSummary[]) => {
    setSelectedParticipants(prev => ({
      ...prev,
      [type]: participants
    }));
  };

  // Función principal para enviar el formulario actualizado
  const onSubmit = async (data: EditCaseFormData) => {
    if (!caseData?.id) {
      toast.error('Error: No se puede actualizar el caso sin ID');
      return;
    }

    setSaving(true);
    try {
      // Obtener RUTs para el backend usando las nuevas interfaces
      const plaintiffRuts = selectedParticipants.demandantes.map(p => p.idNumber);
      const defendantRuts = selectedParticipants.demandados.map(p => p.idNumber);
      const attorneyRuts = selectedParticipants.abogados.map(p => p.idNumber);
      const representativeRuts = selectedParticipants.representantes.map(p => p.idNumber);

      // Validaciones
      if (plaintiffRuts.length === 0) {
        toast.error('Debe seleccionar al menos un demandante');
        setSaving(false);
        return;
      }
      
      if (defendantRuts.length === 0) {
        toast.error('Debe seleccionar al menos un demandado');
        setSaving(false);
        return;
      }
      
      if (attorneyRuts.length === 0) {
        toast.error('Debe seleccionar un abogado patrocinante');
        setSaving(false);
        return;
      }
      
      // Preparar datos para la API
      const lawsuitRequest: LawsuitRequest = {
        title: data.title,
        proceedingType: data.proceedingType,
        subjectMatter: data.legalMatter,
        status: caseData.status, // Mantener el status actual
        plaintiffs: plaintiffRuts,
        defendants: defendantRuts,
        attorneyOfRecord: attorneyRuts[0],
        representative: representativeRuts.length > 0 ? representativeRuts[0] : undefined,
        claims: claims,
        institution: data.institution,
        narrative: data.description
      };

      // Si se proporcionó la función onEdit, usarla directamente
      if (onEdit) {
        await onEdit(lawsuitRequest);
      } else {
        // Comportamiento tradicional: llamada a la API
        await updateLawsuit({ id: caseData.id, data: lawsuitRequest });
        // Invalidar consultas para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
        queryClient.invalidateQueries({ queryKey: ['lawsuit', caseData.id] });
        
        toast.success('Caso actualizado exitosamente');
        
        // Si hay versiones generadas y existe la función para cambiar a la pestaña de versiones, redirigir
        if (hasGeneratedVersions && switchToVersionsTab) {
          onCancel(); // Cerrar formulario de edición
          setTimeout(() => {
            switchToVersionsTab(); // Cambiar a la pestaña de versiones después de un pequeño delay
            toast.info('Puede generar una nueva versión del documento con los cambios realizados');
          }, 300);
        } else {
          onCancel(); // Solo cerrar el formulario si no hay versiones o no se proporcionó la función
        }
      }
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      toast.error(`Error al actualizar el caso: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setSaving(false);
    }
  };

  // Opciones para los selectores
  const institutions = [
    { value: 'S.J.L. EN LO CIVIL', label: 'Juzgado de Letras en lo Civil' },
    { value: 'CORTE DE APELACIONES', label: 'Corte de Apelaciones' },
    { value: 'JUZGADO DE FAMILIA', label: 'Juzgado de Familia' },
    { value: 'JUZGADO DE GARANTÍA', label: 'Juzgado de Garantía' },
    { value: 'TRIBUNAL ORAL EN LO PENAL', label: 'Tribunal Oral en lo Penal' }
  ];

  // Errores para la sección de participantes
  const participantErrors = {
    demandantes: selectedParticipants.demandantes.length === 0 ? 'Debe seleccionar al menos un demandante' : '',
    demandados: selectedParticipants.demandados.length === 0 ? 'Debe seleccionar al menos un demandado' : '',
    abogados: selectedParticipants.abogados.length === 0 ? 'Debe seleccionar un abogado patrocinante' : '',
    representantes: ''
  };

  // Mostrar indicador de carga
  const isLoading = isLoadingProceedingTypes || isLoadingSubjectMatters;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-400">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-800 min-h-screen p-1">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Editar caso</h2>
            <p className="text-gray-400">Modifique los datos del caso legal</p>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
            title="Cerrar"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="bg-[#0F1625] rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Título del caso */}
            <div>
              <label className="block mb-4 text-white font-medium">Título Caso</label>
              <input 
                {...register('title')}
                placeholder="Ingrese el título del caso"
                className={`w-full bg-[#080d1a] text-white p-3 rounded-md border ${
                  errors.title ? 'border-red-500' : 'border-gray-500'
                } hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors resize-none`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Tipo de procedimiento y materia legal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-4 text-white font-medium">Tipo de procedimiento</label>
                <select
                  {...register('proceedingType')}
                  className={`w-full bg-[#2D3342] text-white p-3 rounded-md border ${
                    errors.proceedingType ? 'border-red-500' : 'border-gray-500'
                  } hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors`}
                  disabled={isLoadingProceedingTypes}
                >
                  <option value="">Seleccione una opción</option>
                  {proceedingTypeOptions.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.proceedingType && (
                  <p className="mt-1 text-sm text-red-500">{errors.proceedingType.message}</p>
                )}
              </div>
              
              <div>
                <label className="block mb-4 text-white font-medium">Materia legal</label>
                <select 
                  {...register('legalMatter')}
                  className={`w-full bg-[#2D3342] text-white p-3 rounded-md border ${
                    errors.legalMatter ? 'border-red-500' : 'border-gray-500'
                  } hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors`}
                  disabled={isLoadingSubjectMatters}
                >
                  <option value="">Seleccione una opción</option>
                  {subjectMatterOptions.map(matter => (
                    <option key={matter.value} value={matter.value}>
                      {matter.label}
                    </option>
                  ))}
                </select>
                {errors.legalMatter && (
                  <p className="mt-1 text-sm text-red-500">{errors.legalMatter.message}</p>
                )}
              </div>
            </div>
            
            {/* Sección de participantes */}
            <ParticipantSection
              selectedParticipants={selectedParticipants}
              onParticipantsChange={handleParticipantsChange}
              errors={participantErrors}
            />

            {/* Tribunal */}
            <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
              <label className="block mb-4 text-white font-medium">Tribunal</label>
              <select 
                {...register('institution')}
                className={`w-full bg-[#2D3342] text-white p-3 rounded-md border ${
                  errors.institution ? 'border-red-500' : 'border-gray-500'
                } hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors`}
              >
                {institutions.map(inst => (
                  <option key={inst.value} value={inst.value}>
                    {inst.label}
                  </option>
                ))}
              </select>
              {errors.institution && (
                <p className="mt-1 text-sm text-red-500">{errors.institution.message}</p>
              )}
            </div>
            
            {/* Peticiones al tribunal */}
            <ClaimsSection
              claims={claims}
              onClaimsChange={setClaims}
            />
            
            {/* Descripción del caso */}
            <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
              <label className="block mb-4 text-white font-medium">Descripción del caso</label>
              <textarea 
                {...register('description')}
                placeholder="Ingrese de forma detallada la descripción del caso"
                rows={5}
                className={`w-full bg-[#080d1a] text-white p-3 rounded-md border ${
                  errors.description ? 'border-red-500' : 'border-gray-500'
                } hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors resize-none`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2 font-medium transition-colors shadow-lg"
              >
                <FiX className="w-5 h-5" />
                Descartar cambios
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2 font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCaseForm;