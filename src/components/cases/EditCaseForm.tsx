import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiSave, FiX } from 'react-icons/fi';
import { Plus, X as XIcon, Edit, Trash2, Save, User, PlusCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useParticipants } from '@/hooks/useParticipants';
import { useProceedingTypes } from '@/hooks/useProceedingTypes';
import { useSubjectMatters } from '@/hooks/useSubjectMatters';
import { LawsuitDetailResponse, LawsuitRequest, ParticipantSummaryResponse } from '@/generated/api/data-contracts';
import { LawsuitFormSchema, Persona, PersonaSummary } from './CaseForm';


// Esquema de validación actualizado
const editCaseSchema = z.object({
  title: z.string().max(100, 'El título no puede exceder 100 caracteres'),
  proceedingType: z.string().min(1, 'Seleccione un tipo de procedimiento'),
  legalMatter: z.string().min(1, 'Seleccione una materia legal'),
  
  // CAMBIO: Aceptar números en lugar de strings
  plaintiffIds: z.array(z.number()).min(1, 'Debe seleccionar al menos un demandante'),
  defendantIds: z.array(z.number()).min(1, 'Debe seleccionar al menos un demandado'),
  // CAMBIO: Solo un abogado, obligatorio
  attorneyIds: z.array(z.number()).length(1, 'Debe seleccionar un abogado patrocinante'),
  // CAMBIO: Solo un representante, opcional
  representativeIds: z.array(z.number()).max(1).optional(),
  
  institution: z.string().min(1, 'Tribunal requerido'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  claims: z.array(z.string()).optional()
});

export interface EditCaseFormProps { 
  caseData: LawsuitDetailResponse,
  onCancel: any
}
const EditCaseForm = ({ caseData, onCancel } : EditCaseFormProps) => {
  const [saving, setSaving] = useState(false);
  const [claimInput, setClaimInput] = useState('');
  const [claimsList, setClaimsList] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const queryClient = useQueryClient();
  
  // Estados para overlay de gestión de participantes
  const [overlayAbierto, setOverlayAbierto] = useState(false);
  const [tipoOverlay, setTipoOverlay] = useState('');
  const [editandoIndice, setEditandoIndice] = useState(-1);
  
  // Estados para selecciones múltiples
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<Record<string, PersonaSummary[]>>({
    demandantes: ([] as PersonaSummary[]),
    demandados: ([] as PersonaSummary[]),
    abogados: ([] as PersonaSummary[]),
    representantes: ([] as PersonaSummary[])
  });
  
  // Estado para el formulario del overlay
  const [formData, setFormData] = useState({
    id: (null as number|null),
    rut: '',
    nombre: '',
    direccion: ''
  });

  const [erroresValidacion, setErroresValidacion] = useState({
    rut: '',
    nombre: '',
    direccion: ''
  });
  
  // Hooks para acceder a datos de la API
  const { updateLawsuit } = useLawsuits();
  const { 
    plaintiffs, defendants, lawyers, representatives,
    createPlaintiff, createDefendant, createLawyer, createRepresentative,
    updatePlaintiff, updateDefendant, updateLawyer, updateRepresentative,
    deletePlaintiff, deleteDefendant, deleteLawyer, deleteRepresentative,
    isLoadingPlaintiffs, isLoadingDefendants, isLoadingLawyers, isLoadingRepresentatives 
  } = useParticipants();
  const { proceedingTypeOptions, isLoading: isLoadingProceedingTypes } = useProceedingTypes();
  const { subjectMatterOptions, isLoading: isLoadingSubjectMatters } = useSubjectMatters();
  
  // Preparar valores iniciales
  const getInitialValues = () : LawsuitFormSchema => {
    return {
      title: caseData.title || '',
      proceedingType:  caseData.proceedingType || '',
      legalMatter: caseData.subjectMatter || '',
      plaintiffIds: ([] as number[]),
      defendantIds: ([] as number[]),
      attorneyIds: ([] as number[]),
      representativeIds: ([] as number[]),
      institution: caseData.institution || 'S.J.L. EN LO CIVIL',
      description: caseData.narrative || '',
      claims: ([] as string[]),
    };
  };
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LawsuitFormSchema>({
    resolver: zodResolver(editCaseSchema),
    defaultValues: getInitialValues()
  });

  // Inicializar datos del caso al cargar
  useEffect(() => {
    if (caseData && plaintiffs.length > 0 && defendants.length > 0) {
      // Inicializar personas seleccionadas basándose en los datos del caso
      const demandantesSeleccionados = (caseData.plaintiffs || []).map(p => ({
        id: p.id,
        rut: p.idNumber
      }));
      
      const demandadosSeleccionados = (caseData.defendants || []).map(d => ({
        id: d.id,
        rut: d.idNumber
      }));
      
      const abogadosSeleccionados = caseData.attorneyOfRecord ? [{
        id: caseData.attorneyOfRecord.id,
        rut: caseData.attorneyOfRecord.idNumber
      }] : [];
      
      const representantesSeleccionados = caseData.representative ? [{
        id: caseData.representative.id,
        rut: caseData.representative.idNumber
      }] : [];

      setPersonasSeleccionadas({
        demandantes: demandantesSeleccionados,
        demandados: demandadosSeleccionados,
        abogados: abogadosSeleccionados,
        representantes: representantesSeleccionados
      });

      // Actualizar formulario con IDs
      setValue('plaintiffIds', demandantesSeleccionados.map(p => Number(p.id)));
      setValue('defendantIds', demandadosSeleccionados.map(d => Number(d.id)));
      setValue('attorneyIds', abogadosSeleccionados.map(a => Number(a.id)));
      setValue('representativeIds', representantesSeleccionados.map(r => Number(r.id)));

      // Inicializar claims
      if (caseData.claims && caseData.claims.length > 0) {
        setClaimsList(caseData.claims);
      }
    }
  }, [caseData, plaintiffs, defendants, lawyers, representatives, setValue]);

  // Funciones de validación
  const validarRUT = (rut : string) => {
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return 'El RUT debe tener 7-8 dígitos más el dígito verificador';
    }
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    if (cuerpo.length < 7 || cuerpo.length > 8) {
      return 'El RUT debe tener 7-8 dígitos';
    }
    
    if (!/^[0-9K]$/.test(dv)) {
      return 'El dígito verificador debe ser un número (0-9) o la letra K';
    }
    
    return '';
  };

  const formatearRUT = (valor : string) => {
    const limpio = valor.replace(/[^0-9kK]/g, '');
    
    if (limpio.length <= 1) return limpio;
    
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1).toUpperCase();
    
    let cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${cuerpoFormateado}-${dv}`;
  };

  const validarNombre = (nombre : string) => {
    if (!nombre.trim()) {
      return 'El nombre es obligatorio';
    }
    
    if (nombre.length > 100) {
      return 'El nombre no puede exceder 100 caracteres';
    }
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
      return 'El nombre solo puede contener letras y tildes';
    }
    
    return '';
  };

  const validarDireccion = (direccion : string) => {
    if (!direccion.trim()) {
      return 'La dirección es obligatoria';
    }
    
    if (direccion.length > 255) {
      return 'La dirección no puede exceder 255 caracteres';
    }
    
    return '';
  };

  const manejarCambioRUT = (valor : string) => {
    const soloValidos = valor.replace(/[^0-9kK]/g, '');
    
    if (soloValidos.length > 9) return;
    
    const rutFormateado = formatearRUT(soloValidos);
    const error = validarRUT(rutFormateado);
    
    setFormData(prev => ({ ...prev, rut: rutFormateado }));
    setErroresValidacion(prev => ({ ...prev, rut: error }));
  };

  const manejarCambioNombre = (valor : string) => {
    const soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    
    if (soloLetras.length > 100) return;
    
    const error = validarNombre(soloLetras);
    
    setFormData(prev => ({ ...prev, nombre: soloLetras }));
    setErroresValidacion(prev => ({ ...prev, nombre: error }));
  };

  const manejarCambioDireccion = (valor : string) => {
    if (valor.length > 255) return;
    
    const error = validarDireccion(valor);
    
    setFormData(prev => ({ ...prev, direccion: valor }));
    setErroresValidacion(prev => ({ ...prev, direccion: error }));
  };

  const formularioEsValido = () => {
    const rutValido = !erroresValidacion.rut && formData.rut.trim();
    const nombreValido = !erroresValidacion.nombre && formData.nombre.trim();
    const direccionValida = !erroresValidacion.direccion && formData.direccion.trim();
    
    return rutValido && nombreValido && direccionValida;
  };

  // Funciones para manejar selecciones múltiples
  const obtenerDatosPorTipo = (tipo : string) => {
    switch(tipo) {
      case 'demandantes': return plaintiffs || [];
      case 'demandados': return defendants || [];
      case 'abogados': return lawyers || [];
      case 'representantes': return representatives || [];
      default: return [];
    }
  };
  const agregarPersonaSeleccionada = (tipo : string, rutPersona : string) => {
    const yaSeleccionada = personasSeleccionadas[tipo].some(p => p.rut === rutPersona);
    
    if (rutPersona && !yaSeleccionada) {
      const personas = obtenerDatosPorTipo(tipo);
      const personaCompleta = personas.find(p => p.idNumber === rutPersona);
      
      if (!personaCompleta) {
        toast.error('No se encontró la información completa de la persona');
        return;
      }
      
      const nuevaPersona = { id: personaCompleta.id, rut: rutPersona };
      
      // Para abogados y representantes solo permitir uno
      if ((tipo === 'abogados' || tipo === 'representantes')) {
        setPersonasSeleccionadas(prev => ({
          ...prev,
          [tipo]: [nuevaPersona] // Reemplazar el anterior
        }));
      } else {
        setPersonasSeleccionadas(prev => ({
          ...prev,
          [tipo]: [...prev[tipo], nuevaPersona]
        }));
      }

      // Actualizar el formulario principal con los IDs numéricos
      switch(tipo) {
        case 'demandantes':
          setValue('plaintiffIds', [...personasSeleccionadas.demandantes.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
        case 'demandados':
          setValue('defendantIds', [...personasSeleccionadas.demandados.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
        case 'abogados':
          setValue('attorneyIds', [Number(nuevaPersona.id)]); // Solo un abogado
          break;
        case 'representantes':
          setValue('representativeIds', [Number(nuevaPersona.id)]); // Solo un representante
          break;
      }
    }
  };

  const eliminarPersonaSeleccionada = (tipo : string, rutPersona : string) => {
    setPersonasSeleccionadas(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter(persona => persona.rut !== rutPersona)
    }));
    
    // Actualizar el formulario principal
    switch(tipo) {
      case 'demandantes':
        setValue('plaintiffIds', personasSeleccionadas.demandantes
          .filter(persona => persona.rut !== rutPersona)
          .map(persona => Number(persona.id)));
        break;
      case 'demandados':
        setValue('defendantIds', personasSeleccionadas.demandados
          .filter(persona => persona.rut !== rutPersona)
          .map(persona => Number(persona.id)));
        break;
      case 'abogados':
        setValue('attorneyIds', personasSeleccionadas.abogados
          .filter(persona => persona.rut !== rutPersona)
          .map(persona => Number(persona.id)));
        break;
      case 'representantes':
        setValue('representativeIds', personasSeleccionadas.representantes
          .filter(persona => persona.rut !== rutPersona)
          .map(persona => Number(persona.id)));
        break;
    }
  };

  const obtenerPersonaPorRut = (tipo : string, rutOPersona : PersonaSummary) => {
    const datos = obtenerDatosPorTipo(tipo);
    const rut = typeof rutOPersona === 'object' ? rutOPersona.rut : rutOPersona;
    return datos.find(persona => persona.idNumber === rut);
  };

  // Funciones del overlay
  const abrirOverlay = (tipo : string) => {
    setTipoOverlay(tipo);
    setOverlayAbierto(true);
    setEditandoIndice(-1);
    setFormData({ id: null, rut: '', nombre: '', direccion: '' });
  };

  const cerrarOverlay = () => {
    setOverlayAbierto(false);
    setTipoOverlay('');
    setEditandoIndice(-1);
    setFormData({ id: null, rut: '', nombre: '', direccion: '' });
    setErroresValidacion({ rut: '', nombre: '', direccion: '' });
  };
  const obtenerTitulo = () => {
    const titulos : Record<string, string> = {
      'demandantes': 'Gestionar Demandantes',
      'demandados': 'Gestionar Demandados',
      'abogados': 'Gestionar Abogado Patrocinante',
      'representantes': 'Gestionar Representante Legal'
    };
    return titulos[tipoOverlay] || '';
  };

  // Funciones para gestión de participantes en overlay
  const agregarPersona = async () => {
    const errorRut = validarRUT(formData.rut);
    const errorNombre = validarNombre(formData.nombre);
    const errorDireccion = validarDireccion(formData.direccion);
    
    setErroresValidacion({
      rut: errorRut,
      nombre: errorNombre,
      direccion: errorDireccion
    });
    
    if (!errorRut && !errorNombre && !errorDireccion && formularioEsValido()) {
      const datosActuales = obtenerDatosPorTipo(tipoOverlay);
      const rutExistente = datosActuales.find(persona => persona.idNumber === formData.rut);
      
      if (rutExistente) {
        setErroresValidacion(prev => ({ ...prev, rut: 'Este RUT ya está registrado' }));
        return;
      }
      
      try {
        const newParticipant = {
          idNumber: formData.rut,
          fullName: formData.nombre,
          address: formData.direccion
        };
        
        switch(tipoOverlay) {
          case 'demandantes':
            await createPlaintiff(newParticipant);
            break;
          case 'demandados':
            await createDefendant(newParticipant);
            break;
          case 'abogados':
            await createLawyer(newParticipant);
            break;
          case 'representantes':
            await createRepresentative(newParticipant);
            break;
        }        
        
        setFormData({ id: null, rut: '', nombre: '', direccion: '' });
        setErroresValidacion({ rut: '', nombre: '', direccion: '' });
      } catch (error) {
        toast.error(`Error al crear ${tipoOverlay}: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }
  };

  const editarPersona = (indice : number) => {
    const datosActuales = obtenerDatosPorTipo(tipoOverlay);
    const persona = datosActuales[indice];
    if (persona) {
      setFormData({
        id: persona.id,
        rut: persona.idNumber,
        nombre: persona.fullName,
        direccion: ''
      });
      setEditandoIndice(indice);
      setErroresValidacion({ rut: '', nombre: '', direccion: '' });
    }
  };

  const guardarEdicion = async () => {
    const errorRut = validarRUT(formData.rut);
    const errorNombre = validarNombre(formData.nombre);
    const errorDireccion = validarDireccion(formData.direccion);
    
    setErroresValidacion({
      rut: errorRut,
      nombre: errorNombre,
      direccion: errorDireccion
    });
    
    if (!errorRut && !errorNombre && !errorDireccion && formularioEsValido()) {
      try {
        const datosActualizados = {
          id: formData.id,
          idNumber: formData.rut,
          fullName: formData.nombre,
          address: formData.direccion
        };
        
        const id = formData.id!;
        
        switch(tipoOverlay) {
          case 'demandantes':
            await updatePlaintiff({ id, data: datosActualizados });
            break;
          case 'demandados':
            await updateDefendant({ id, data: datosActualizados });
            break;
          case 'abogados':
            await updateLawyer({ id, data: datosActualizados });
            break;
          case 'representantes':
            await updateRepresentative({ id, data: datosActualizados });
            break;
        }
        
        setEditandoIndice(-1);
        setFormData({ id: null, rut: '', nombre: '', direccion: '' });
        setErroresValidacion({ rut: '', nombre: '', direccion: '' });
      } catch (error) {
        console.error(`Error al actualizar ${tipoOverlay}:`, error);
        toast.error(`Error al actualizar ${tipoOverlay}: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
      }
    }
  };

  const eliminarPersona = async (indice : number) => {
    try {
      const datosActuales = obtenerDatosPorTipo(tipoOverlay);
      const persona = datosActuales[indice];
      
      if (!persona) {
        toast.error('No se pudo encontrar la persona a eliminar');
        return;
      }
      
      const id = persona.id;
      const rutCompleto = persona.idNumber;
      
      const estaSeleccionada = Object.keys(personasSeleccionadas).some(
        (tipo) => personasSeleccionadas[tipo].some(p => p.rut === rutCompleto)
      );
      
      if (estaSeleccionada) {
        const confirmacion = window.confirm(
          'Esta persona está seleccionada en el formulario. Si la elimina, se quitará de las selecciones. ¿Desea continuar?'
        );
        
        if (!confirmacion) {
          return;
        }
        
        Object.keys(personasSeleccionadas).forEach((tipo) => {
          if (personasSeleccionadas[tipo].some(p => p.rut === rutCompleto)) {
            eliminarPersonaSeleccionada(tipo, rutCompleto);
          }
        });
      }

      switch(tipoOverlay) {
        case 'demandantes':
          await deletePlaintiff(id);
          break;
        case 'demandados':
          await deleteDefendant(id);
          break;
        case 'abogados':
          await deleteLawyer(id);
          break;
        case 'representantes':
          await deleteRepresentative(id);
          break;
      }
    } catch (error) {
      console.error(`Error al eliminar ${tipoOverlay}:`, error);
      toast.error(`Error al eliminar ${tipoOverlay}: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    }
  };

  // Funciones para peticiones
  const handleAddClaim = (claim : string) => {
    if (!claim || typeof claim !== 'string') {
      return;
    }
    
    const normalizedClaim = claim.trim().toUpperCase();
    if (normalizedClaim) {
      const exists = claimsList.some(c => c.toUpperCase() === normalizedClaim);
      if (exists) {
        toast.warning('Esta petición ya ha sido agregada');
        setClaimInput('');
        return;
      }
      setClaimsList(prev => [...prev, normalizedClaim]);
      setClaimInput('');
    }
  };

  const handleKeyPress = (e : any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (claimInput && claimInput.trim()) {
        handleAddClaim(claimInput);
      }
    }
  };

  const handleDeleteClaim = (claimToDelete : string) => {
    setClaimsList(prev => prev.filter(claim => claim !== claimToDelete));
  };

  // Función principal para enviar el formulario actualizado
  const onSubmit = async (data : LawsuitFormSchema) => {
    if (!caseData?.id) {
      toast.error('Error: No se puede actualizar el caso sin ID');
      return;
    }

    setSaving(true);
    try {
      // Obtener RUTs para el backend
      const plaintiffRuts = personasSeleccionadas.demandantes.map(p => p.rut);
      const defendantRuts = personasSeleccionadas.demandados.map(p => p.rut);
      const attorneyRuts = personasSeleccionadas.abogados.map(p => p.rut);
      const representativeRuts = personasSeleccionadas.representantes.map(p => p.rut);
        // Validar que tenemos al menos un demandante y demandado
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
      
      // Validar que tenemos un abogado patrocinante
      if (attorneyRuts.length === 0) {
        toast.error('Debe seleccionar un abogado patrocinante');
        setSaving(false);
        return;
      }
      
      // Preparar datos para la API
      const lawsuitRequest : LawsuitRequest = {
        title: data.title,
        proceedingType: data.proceedingType,
        subjectMatter: data.legalMatter,
        status: caseData.status, // Mantener el status actual
        plaintiffs: plaintiffRuts,
        defendants: defendantRuts,
        attorneyOfRecord: attorneyRuts[0],
        representative: representativeRuts.length > 0 ? representativeRuts[0] : undefined,
        claims: claimsList,
        institution: data.institution,
        narrative: data.description
      };
      
      // Llamada a la API
      await updateLawsuit({ id: caseData.id, data: lawsuitRequest });
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      queryClient.invalidateQueries({ queryKey: ['lawsuit', caseData.id] });
      
      toast.success('Caso actualizado exitosamente');
      onCancel(); // Cerrar formulario de edición
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      toast.error(`Error al actualizar el caso: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
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

  const predefinedClaims = [
    'DEMANDA CIVIL',
    'DEMANDA EJECUTIVA Y MANDAMIENTO DE EJECUCIÓN Y EMBARGO',
    'SEÑALA BIENES PARA EMBARGO Y DEPOSITARIO PROVISIONAL',
    'ACOMPAÑA DOCUMENTOS, CON CITACIÓN',
    'FORMACIÓN DE CUADERNO SEPARADO',
    'PATROCINIO Y PODER',
    'FORMA DE NOTIFICACIÓN ELECTRÓNICA'
  ];

  // Componente de búsqueda con autocompletado
  const AutocompleteSearch = ({ tipo, placeholder, onSelect } : {tipo: string, placeholder: string, onSelect: any}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<ParticipantSummaryResponse[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showingRecommendations, setShowingRecommendations] = useState(false);
    const searchRef = useRef(null);
    const personas = obtenerDatosPorTipo(tipo);
    const seleccionadas = personasSeleccionadas[tipo] || [];

    const getRecentlyCreated = () => {
      return personas
        .filter(persona => {
          return !seleccionadas.some(p => p.rut === persona.idNumber);
        })
        .slice(-5)
        .reverse();
    };

    useEffect(() => {
      if (searchTerm.trim() === '') {
        if (showResults) {
          setResults(getRecentlyCreated());
          setShowingRecommendations(true);
        } else {
          setResults([]);
        }
        return;
      }

      setShowingRecommendations(false);
      const termLower = searchTerm.toLowerCase();
      const filtered = personas
        .filter(persona => {
          const yaSeleccionada = seleccionadas.some(p => p.rut === persona.idNumber);
          return !yaSeleccionada && (
            persona.fullName.toLowerCase().includes(termLower) || 
            persona.idNumber.toLowerCase().includes(termLower)
          );
        })
        .slice(0, 5);
      
      setResults(filtered);
    }, [searchTerm, personas, seleccionadas, tipo, showResults]);

    useEffect(() => {
      const handleClickOutside = (event : any) => {
        if (searchRef.current && !(searchRef.current as any).contains(event.target)) {
          setShowResults(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSearchChange = (e : any) => {
      setSearchTerm(e.target.value);
      setShowResults(true);
    };

    const handleSelectResult = (persona : ParticipantSummaryResponse) => {
      onSelect(persona.idNumber);
      setSearchTerm('');
      setShowResults(false);
    };

    const handleFocus = () => {
      setShowResults(true);
      if (searchTerm.trim() === '') {
        setResults(getRecentlyCreated());
        setShowingRecommendations(true);
      }
    };

    return (
      <div ref={searchRef} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="bg-[#2D3342] text-white w-full p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
        />
        
        {showResults && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {showingRecommendations && (
              <div className="px-2.5 py-1.5 text-xs text-gray-400 border-b border-gray-600">
                Últimos registros creados
              </div>
            )}
            {results.map((persona) => (
              <div
                key={persona.idNumber}
                onClick={() => handleSelectResult(persona)}
                className="p-2.5 hover:bg-gray-700 cursor-pointer text-white text-sm"
              >
                <div className="font-medium">{persona.fullName}</div>
                <div className="text-xs text-gray-300">{persona.idNumber}</div>
              </div>
            ))}
          </div>
        )}

        {showResults && searchTerm && results.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg p-2.5 text-center text-sm text-gray-400">
            No se encontraron resultados
          </div>
        )}
      </div>
    );
  };

  // Componente de búsqueda con autocompletado para peticiones predefinidas
  const PredefinedClaimsAutocomplete = ({ onSelect } : { onSelect: any}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showingAllOptions, setShowingAllOptions] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
      if (searchTerm.trim() === '') {
        if (showResults) {
          setResults(predefinedClaims.slice(0, 5));
          setShowingAllOptions(true);
        } else {
          setResults([]);
        }
        return;
      }

      setShowingAllOptions(false);
      const termLower = searchTerm.toLowerCase();
      const filtered = predefinedClaims
        .filter(claim => claim.toLowerCase().includes(termLower))
        .slice(0, 5);
    
      setResults(filtered);
    }, [searchTerm, showResults]);

    useEffect(() => {
      const handleClickOutside = (event : any) => {
        if (searchRef.current && !(searchRef.current as any).contains(event.target)) {
          setShowResults(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSearchChange = (e : any) => {
      setSearchTerm(e.target.value);
      setShowResults(true);
    };

    const handleSelectResult = (claim : string) => {
      onSelect(claim);
      setSearchTerm('');
      setShowResults(false);
    };

    const handleFocus = () => {
      setShowResults(true);
      if (searchTerm.trim() === '') {
        setResults(predefinedClaims.slice(0, 5));
        setShowingAllOptions(true);
      }
    };

    return (
      <div ref={searchRef} className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          placeholder="Buscar petición predefinida..."
          className="bg-[#2D3342] text-white w-full p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
        />
        
        {showResults && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {showingAllOptions && (
              <div className="px-2.5 py-1.5 text-xs text-gray-400 border-b border-gray-600">
                Peticiones predefinidas
              </div>
            )}
            {results.map((claim) => (
              <div
                key={claim}
                onClick={() => handleSelectResult(claim)}
                className="p-2.5 hover:bg-gray-700 cursor-pointer text-white text-sm"
              >
                {claim}
              </div>
            ))}
          </div>
        )}

        {showResults && searchTerm && results.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg p-2.5 text-center text-sm text-[#ffffff]">
            ⚠️ No se encontraron peticiones, dale al botón "➕" para agregar una nueva ⚠️ ➡️
          </div>
        )}
      </div>
    );
  };

  // Componente para selector múltiple compacto
  const SelectorMultipleCompacto = ({ tipo, titulo, esOpcional = false } : {tipo: string, titulo: string, esOpcional?: boolean}) => {
    const personas = obtenerDatosPorTipo(tipo);
    const seleccionadas = personasSeleccionadas[tipo] || [];

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium flex items-center gap-2 text-white">
            {titulo} {esOpcional && <span className="text-sm text-gray-400 font-normal">(opcional)</span>}
            <span className="text-sm text-blue-400">
              {seleccionadas.length > 0 && `(${seleccionadas.length})`}
            </span>
          </h4>
          <button 
            type="button"
            onClick={() => abrirOverlay(tipo)}
            className="bg-blue-500 hover:bg-blue-600 p-1.5 rounded-full transition-colors"
            title={`Gestionar ${titulo.toLowerCase()}`}
          >
            <Plus size={16} className="text-white" />
          </button>
        </div>
        
        <div className="space-y-3">
          <AutocompleteSearch 
            tipo={tipo} 
            placeholder={`Buscar por RUT o nombre...`}
            onSelect={(rutPersona : string) => agregarPersonaSeleccionada(tipo, rutPersona)}
          />
          
          {seleccionadas.length > 0 ? (
            <div className="bg-gray-700/30 border border-gray-600 rounded-md p-3">
              <div className="flex flex-wrap gap-2">
                {seleccionadas.map((persona) => {
                  const personaCompleta = obtenerPersonaPorRut(tipo, persona);
                  return personaCompleta ? (
                    <div key={persona.rut} className="bg-gray-600/50 border border-gray-500 px-2 py-1 rounded-md flex items-center gap-2 text-sm">
                      <div>
                        <span className="text-white">{personaCompleta.idNumber + ' - ' + personaCompleta.fullName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => eliminarPersonaSeleccionada(tipo, persona.rut)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-700 rounded-md p-4 text-center">
              <div className="text-gray-500 text-sm">
                Sin selección
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mostrar indicador de carga
  const isLoading = isLoadingProceedingTypes || isLoadingSubjectMatters || isLoadingPlaintiffs || 
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
            <XIcon size={20} />
          </button>
        </div>
          <div className="bg-[#0F1625] rounded-xl p-8">
          <div className="p-6 relative">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                {/* Título del caso */}
                <div>
                  <label className="block mb-4 text-white font-medium">Título Caso</label>
                  <input 
                    {...register('title')}
                    placeholder=""
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
                
                {/* Sección integrada de participantes */}
                <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Participantes del caso</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda: Demandantes y Demandados */}
                    <div className="space-y-6">
                      {/* Demandantes */}
                      <div>
                        <SelectorMultipleCompacto tipo="demandantes" titulo="Demandantes" />
                        {errors.plaintiffIds && (
                          <p className="mt-1 text-sm text-red-500">{errors.plaintiffIds.message}</p>
                        )}
                      </div>
                      
                      {/* Demandados */}
                      <div>
                        <SelectorMultipleCompacto tipo="demandados" titulo="Demandados" />
                        {errors.defendantIds && (
                          <p className="mt-1 text-sm text-red-500">{errors.defendantIds.message}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Columna derecha: Abogados y Representantes */}
                    <div className="space-y-6">                      {/* Abogados */}
                      <div>
                        <SelectorMultipleCompacto tipo="abogados" titulo="Abogado Patrocinante" esOpcional={false} />
                        {errors.attorneyIds && (
                          <p className="mt-1 text-sm text-red-500">{errors.attorneyIds.message}</p>
                        )}
                      </div>
                      
                      {/* Representantes */}
                      <div>
                        <SelectorMultipleCompacto tipo="representantes" titulo="Representante Legal" esOpcional={true} />
                      </div>
                    </div>
                  </div>
                </div>

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
                <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
                  <label className="block mb-4 text-white font-medium">Peticiones al tribunal</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <PredefinedClaimsAutocomplete onSelect={handleAddClaim} />
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        title="Añadir petición personalizada"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white cursor-pointer focus:outline-none transition-colors shadow-md"
                      >
                        {showCustomInput ? (
                          <FiX className="w-5 h-5" />
                        ) : (
                          <PlusCircle className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {showCustomInput && (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={claimInput}
                          onChange={(e) => setClaimInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Escriba una petición personalizada"
                          className="flex-1 bg-[#2D3342] text-white p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (claimInput && claimInput.trim()) {
                              handleAddClaim(claimInput);
                            }
                          }}
                          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    )}
                    
                    <div className="bg-gray-900/50 border border-gray-600 p-4 rounded-md min-h-[100px]">
                      {claimsList.length > 0 ? (
                        <ul className="space-y-2">
                          {claimsList.map((claim, index) => (
                            <li key={index} className="flex justify-between items-start p-3 bg-gray-700/50 border border-gray-600 rounded-md hover:bg-gray-700/70 transition-colors">
                              <span className="text-white break-words pr-2" style={{ wordBreak: 'break-word', flex: '1' }}>
                                {claim}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteClaim(claim)}
                                className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0 transition-colors"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No hay peticiones agregadas</p>
                      )}
                    </div>
                  </div>
                </div>
                
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
      </div>

      {/* Overlay lateral */}
      {overlayAbierto && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cerrarOverlay}
          ></div>
          
          <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 shadow-xl">
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={24} />
                  {obtenerTitulo()}
                </h2>
                <button 
                  onClick={cerrarOverlay}
                  className="text-gray-400 hover:text-white"
                >
                  <XIcon size={24} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  {editandoIndice >= 0 ? 'Editar' : 'Agregar'} persona
                </h3>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="RUT (ej: 12345678-9)"
                      value={formData.rut}
                      onChange={(e) => manejarCambioRUT(e.target.value)}
                      onKeyPress={(e) => {
                        if (!/[0-9kK]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
                        erroresValidacion.rut ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                      }`}
                    />
                    {erroresValidacion.rut && (
                      <p className="text-red-400 text-sm mt-1">{erroresValidacion.rut}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formData.nombre}
                      onChange={(e) => manejarCambioNombre(e.target.value)}
                      onKeyPress={(e) => {
                        if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
                        erroresValidacion.nombre ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                      }`}
                    />
                    {erroresValidacion.nombre && (
                      <p className="text-red-400 text-sm mt-1">{erroresValidacion.nombre}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">{formData.nombre.length}/100 caracteres</p>
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={formData.direccion}
                      onChange={(e) => manejarCambioDireccion(e.target.value)}
                      className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
                        erroresValidacion.direccion ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                      }`}
                    />
                    {erroresValidacion.direccion && (
                      <p className="text-red-400 text-sm mt-1">{erroresValidacion.direccion}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">{formData.direccion.length}/255 caracteres</p>
                  </div>
                  
                  <button 
                    onClick={editandoIndice >= 0 ? guardarEdicion : agregarPersona}
                    className={`w-full p-3 rounded-md flex items-center justify-center gap-2 ${
                      formularioEsValido() 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!formularioEsValido()}
                  >
                    <Save size={18} />
                    {editandoIndice >= 0 ? 'Guardar cambios' : 'Agregar persona'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-medium mb-3">Lista de personas</h3>
                <div className="space-y-2">
                  {obtenerDatosPorTipo(tipoOverlay).map((persona, idx) => (
                    <div key={idx} className="bg-gray-700 p-3 rounded-md">
                      <div className="font-medium">{persona.fullName}</div>
                      <div className="text-sm text-gray-300">{persona.idNumber}</div>
                      <div className="text-sm text-gray-400">Sin dirección</div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => editarPersona(idx)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => eliminarPersona(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {obtenerDatosPorTipo(tipoOverlay).length === 0 && (
                    <div className="text-gray-400 text-center py-8">
                      No hay personas registradas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCaseForm;