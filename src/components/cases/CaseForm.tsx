import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiFileText } from 'react-icons/fi';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useProceedingTypes } from '@/hooks/useProceedingTypes';
import { LawsuitRequest } from '@/generated/api/data-contracts';
import { ParticipantType, PersonSummary } from '@/types/ParticipantTypes';
import ParticipantSection from '@/components/participants/ParticipantSection';
import ClaimsSection from '@/components/claims/ClaimsSection';

// Esquema de validación actualizado para usar las interfaces correctas
const caseSchema = z.object({
  title: z.string().max(100, 'El título no puede exceder 100 caracteres'),
  proceedingType: z.string().min(1, 'Seleccione un tipo de procedimiento'),
  legalMatter: z.string().min(1, 'Seleccione una materia legal'),
  institution: z.string().min(1, 'Tribunal requerido'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
});

interface CaseFormData {
  title: string;
  proceedingType: string;
  legalMatter: string;
  institution: string;
  description: string;
}

const CaseForm = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [claims, setClaims] = useState<string[]>([]);
  
  // Estado para participantes seleccionados
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, PersonSummary[]>>({
    demandantes: [],
    demandados: [],
    abogados: [],
    representantes: []
  });

  // Hooks para datos de la API
  const { createLawsuit, isCreatingLawsuit } = useLawsuits();
  const { proceedingTypeOptions, isLoading: isLoadingProceedingTypes } = useProceedingTypes();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      proceedingType: '',
      legalMatter: '',
      institution: 'S.J.L. EN LO CIVIL',
      description: '',
    }
  });

  // Manejar cambios en participantes
  const handleParticipantsChange = (type: ParticipantType, participants: PersonSummary[]) => {
    setSelectedParticipants(prev => ({
      ...prev,
      [type]: participants
    }));
  };

  // Función principal para enviar el caso
  const onSubmit = async (data: CaseFormData) => {
    console.log('🚀 onSubmit ejecutado con data:', data);
    console.log('🚀 participantes seleccionados:', selectedParticipants);
    console.log('🚀 peticiones:', claims);

    setSaving(true);
    toast.info('Procesando solicitud...');

    try {
      // Obtener RUTs de los participantes seleccionados
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

      // Preparar request para la API
      const lawsuitRequest: LawsuitRequest = {
        title: data.title,
        proceedingType: data.proceedingType,
        subjectMatter: data.legalMatter,
        plaintiffs: plaintiffRuts,
        defendants: defendantRuts,
        attorneyOfRecord: attorneyRuts[0],
        representative: representativeRuts.length > 0 ? representativeRuts[0] : undefined,
        claims: claims,
        institution: data.institution,
        narrative: data.description
      };

      console.log('📤 Datos enviados al backend:', JSON.stringify(lawsuitRequest, null, 2));

      // Llamada a la API
      await createLawsuit(lawsuitRequest);
      toast.success('Caso creado exitosamente');
      router.push('/');

    } catch (error) {
      console.error('🔥 Error completo:', error);
      toast.error(`Error al crear el caso: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setSaving(false);
    }
  };

  // Opciones para los selectores
  const legalMatters = [
    { value: 'Cobro de deuda', label: 'Cobro de deuda' },
    { value: 'Incumplimiento de contrato', label: 'Incumplimiento de contrato' },
    { value: 'Arrendamiento', label: 'Arrendamiento' },
    { value: 'Responsabilidad civil', label: 'Responsabilidad civil' },
    { value: 'Derecho del consumidor', label: 'Derecho del consumidor' },
    { value: 'Prescripción extintiva', label: 'Prescripción extintiva' },
    { value: 'Indemnización de perjuicios', label: 'Indemnización de perjuicios' }
  ];

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

  return (
    <div className="relative bg-gray-800 min-h-screen p-1">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Nuevo caso</h2>
          <p className="text-gray-400">Complete el formulario para registrar un nuevo caso legal</p>
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
                >
                  <option value="">Seleccione una opción</option>
                  {legalMatters.map(matter => (
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

            {/* Botón de acción */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={saving || isCreatingLawsuit}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2 font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiFileText className="w-5 h-5" />
                {saving || isCreatingLawsuit ? 'Creando...' : 'Crear caso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaseForm;