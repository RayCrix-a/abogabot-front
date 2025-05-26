import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiSave, FiX } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useParticipants } from '@/hooks/useParticipants';
import { useProceedingTypes } from '@/hooks/useProceedingTypes';

// Esquema de validación para el formulario de edición de caso
const editCaseSchema = z.object({
  proceedingType: z.string().min(1, 'Seleccione un tipo de procedimiento'),
  subjectMatter: z.string().min(1, 'Ingrese una materia legal'),
  plaintiffs: z.array(z.string()).min(1, 'Debe seleccionar al menos un demandante'),
  attorneyOfRecord: z.string().optional(),
  defendants: z.array(z.string()).min(1, 'Debe seleccionar al menos un demandado'),
  representative: z.string().optional(),
  claims: z.array(z.string()).min(1, 'Ingrese al menos una petición'),
  institution: z.string().min(1, 'Ingrese el tribunal'),
  narrative: z.string().min(20, 'La descripción debe tener al menos 20 caracteres')
});

const EditCaseForm = ({ caseData, onCancel }) => {
  const [saving, setSaving] = useState(false);
  const [claimInput, setClaimInput] = useState('');
  const [claimsList, setClaimsList] = useState([]);
  const queryClient = useQueryClient();
  
  // Hooks para acceder a la API
  const { updateLawsuit } = useLawsuits();
  const {
    plaintiffs,
    lawyers,
    defendants,
    representatives,
    isLoadingPlaintiffs,
    isLoadingLawyers,
    isLoadingDefendants,
    isLoadingRepresentatives
  } = useParticipants();
  const { proceedingTypeOptions, isLoading: isLoadingProceedingTypes } = useProceedingTypes();
  
  // Preparar valores iniciales para el formulario
  const getInitialValues = () => {
    return {
      proceedingType: caseData.proceedingType?.name || '',
      subjectMatter: caseData.subjectMatter || '',
      plaintiffs: caseData.plaintiffs?.map(p => p.idNumber) || [],
      attorneyOfRecord: caseData.attorneyOfRecord?.idNumber || '',
      defendants: caseData.defendants?.map(d => d.idNumber) || [],
      representative: caseData.representative?.idNumber || '',
      claims: caseData.claims || [],
      institution: caseData.institution || '',
      narrative: caseData.narrative || ''
    };
  };
  
  // Configuración del formulario con React Hook Form
  const { 
    register, 
    handleSubmit, 
    control,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(editCaseSchema),
    defaultValues: getInitialValues()
  });

  // Inicializar la lista de claims con los valores existentes
  useEffect(() => {
    if (caseData.claims && caseData.claims.length > 0) {
      setClaimsList(caseData.claims);
    }
  }, [caseData]);

  // Actualizar claims en el formulario cuando cambia la lista
  useEffect(() => {
    setValue('claims', claimsList);
  }, [claimsList, setValue]);

  // Resetear el formulario cuando cambia caseData
  useEffect(() => {
    reset(getInitialValues());
  }, [caseData, reset]);

  // Función para añadir petición
  const handleAddClaim = () => {
    if (claimInput.trim()) {
      setClaimsList(prev => [...prev, claimInput.trim()]);
      setClaimInput('');
    }
  };

  // Función para eliminar petición
  const handleRemoveClaim = (index) => {
    setClaimsList(prev => prev.filter((_, i) => i !== index));
  };

  // Manejar el envío del formulario
  const onSubmit = async (data) => {
    // Validar que tenemos el ID del caso
    if (!caseData?.id) {
      toast.error('Error: No se puede actualizar el caso sin ID');
      return;
    }

    setSaving(true);
    try {
      console.log('Datos del formulario:', data);
      console.log('ID del caso:', caseData.id);
      console.log('Status actual del caso:', caseData.status);
      
      // Transformar datos al formato esperado por la API según el swagger
      const lawsuitRequest = {
        proceedingType: data.proceedingType,
        subjectMatter: data.subjectMatter,
        status: caseData.status, // Mantener el status actual del caso
        plaintiffs: data.plaintiffs,
        attorneyOfRecord: data.attorneyOfRecord || undefined,
        defendants: data.defendants,
        representative: data.representative || undefined,
        claims: data.claims,
        institution: data.institution,
        narrative: data.narrative
      };
      
      console.log('Datos enviados a la API:', lawsuitRequest);
      
      // CORRECCIÓN: Pasar el objeto con id y data como espera la mutación
      await updateLawsuit({ id: caseData.id, data: lawsuitRequest });
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit', caseData.id] });
      
      onCancel(); // Cerrar formulario de edición
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      // El toast de error se maneja en el hook useLawsuits
    } finally {
      setSaving(false);
    }
  };

  // Mostrar indicador de carga mientras se obtienen los datos
  const isLoading = isLoadingProceedingTypes || isLoadingPlaintiffs || 
                    isLoadingLawyers || isLoadingDefendants || 
                    isLoadingRepresentatives;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-400">Cargando datos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Editar caso</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
      
      {/* Tipo de procedimiento y materia legal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-gray-300">Tipo de procedimiento</label>
          <select 
            {...register('proceedingType')}
            className={`input-field ${errors.proceedingType ? 'border-red-500' : ''}`}
          >
            <option value="">Seleccione una opción</option>
            {proceedingTypeOptions?.map(type => (
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
          <label className="block mb-1 text-gray-300">Materia legal</label>
          <input 
            type="text" 
            {...register('subjectMatter')}
            placeholder="Ej: Prescripción extintiva"
            className={`input-field ${errors.subjectMatter ? 'border-red-500' : ''}`}
          />
          {errors.subjectMatter && (
            <p className="mt-1 text-sm text-red-500">{errors.subjectMatter.message}</p>
          )}
        </div>
      </div>
      
      {/* Selección de demandantes */}
      <div>
        <label className="block mb-1 text-gray-300">Demandantes</label>
        <Controller
          name="plaintiffs"
          control={control}
          render={({ field }) => (
            <select
              multiple
              value={field.value}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                field.onChange(selectedOptions);
              }}
              className={`input-field h-32 ${errors.plaintiffs ? 'border-red-500' : ''}`}
            >
              {plaintiffs?.map(plaintiff => (
                <option key={plaintiff.idNumber} value={plaintiff.idNumber}>
                  {plaintiff.fullName} ({plaintiff.idNumber})
                </option>
              ))}
            </select>
          )}
        />
        {errors.plaintiffs && (
          <p className="mt-1 text-sm text-red-500">{errors.plaintiffs.message}</p>
        )}
      </div>
      
      {/* Abogado patrocinante */}
      <div>
        <label className="block mb-1 text-gray-300">Abogado patrocinante</label>
        <select 
          {...register('attorneyOfRecord')}
          className={`input-field ${errors.attorneyOfRecord ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccione un abogado</option>
          {lawyers?.map(lawyer => (
            <option key={lawyer.idNumber} value={lawyer.idNumber}>
              {lawyer.fullName} ({lawyer.idNumber})
            </option>
          ))}
        </select>
        {errors.attorneyOfRecord && (
          <p className="mt-1 text-sm text-red-500">{errors.attorneyOfRecord.message}</p>
        )}
      </div>
      
      {/* Selección de demandados */}
      <div>
        <label className="block mb-1 text-gray-300">Demandados</label>
        <Controller
          name="defendants"
          control={control}
          render={({ field }) => (
            <select
              multiple
              value={field.value}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                field.onChange(selectedOptions);
              }}
              className={`input-field h-32 ${errors.defendants ? 'border-red-500' : ''}`}
            >
              {defendants?.map(defendant => (
                <option key={defendant.idNumber} value={defendant.idNumber}>
                  {defendant.fullName} ({defendant.idNumber})
                </option>
              ))}
            </select>
          )}
        />
        {errors.defendants && (
          <p className="mt-1 text-sm text-red-500">{errors.defendants.message}</p>
        )}
      </div>
      
      {/* Representante legal (opcional) */}
      <div>
        <label className="block mb-1 text-gray-300">Representante legal (opcional)</label>
        <select 
          {...register('representative')}
          className={`input-field ${errors.representative ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccione un representante</option>
          {representatives?.map(representative => (
            <option key={representative.idNumber} value={representative.idNumber}>
              {representative.fullName} ({representative.idNumber})
            </option>
          ))}
        </select>
        {errors.representative && (
          <p className="mt-1 text-sm text-red-500">{errors.representative.message}</p>
        )}
      </div>
      
      {/* Peticiones */}
      <div>
        <label className="block mb-1 text-gray-300">Peticiones al tribunal</label>
        <div className="flex mb-2">
          <input
            type="text"
            value={claimInput}
            onChange={(e) => setClaimInput(e.target.value)}
            placeholder="Agregue una petición"
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={handleAddClaim}
            className="ml-2 btn-secondary"
          >
            Agregar
          </button>
        </div>
        
        {/* Lista de peticiones */}
        <div className={`bg-dark p-3 rounded-md ${errors.claims ? 'border border-red-500' : 'border border-gray-700'}`}>
          {claimsList.length > 0 ? (
            <ul className="space-y-2">
              {claimsList.map((claim, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-dark-light rounded">
                  <span className="text-gray-300">{claim}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClaim(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm p-2">No hay peticiones agregadas</p>
          )}
        </div>
        {errors.claims && (
          <p className="mt-1 text-sm text-red-500">{errors.claims.message}</p>
        )}
      </div>
      
      {/* Tribunal */}
      <div>
        <label className="block mb-1 text-gray-300">Tribunal</label>
        <input 
          type="text" 
          {...register('institution')}
          placeholder="Ej: S.J.L. EN LO CIVIL"
          className={`input-field ${errors.institution ? 'border-red-500' : ''}`}
        />
        {errors.institution && (
          <p className="mt-1 text-sm text-red-500">{errors.institution.message}</p>
        )}
      </div>
      
      {/* Descripción / Relato */}
      <div>
        <label className="block mb-1 text-gray-300">Descripción del caso (relato)</label>
        <textarea 
          {...register('narrative')}
          placeholder="Ingrese el relato detallado del caso"
          rows={8}
          className={`input-field ${errors.narrative ? 'border-red-500' : ''}`}
        />
        {errors.narrative && (
          <p className="mt-1 text-sm text-red-500">{errors.narrative.message}</p>
        )}
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <FiSave className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};

export default EditCaseForm;