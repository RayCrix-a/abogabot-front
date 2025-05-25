import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiFileText, FiX } from 'react-icons/fi';
import { Plus, X as XIcon, Edit, Trash2, Save, User, PlusCircle } from 'lucide-react';
import { useLawsuits } from '@/hooks/useLawsuits'; // Cambio aquí
import { useParticipants } from '@/hooks/useParticipants';
import { useProceedingTypes } from '@/hooks/useProceedingTypes';

// Esquema de validación actualizado para múltiples participantes
const caseSchema = z.object({
  proceedingType: z.string().min(1, 'Seleccione un tipo de procedimiento'),
  legalMatter: z.string().min(1, 'Seleccione una materia legal'),
  
  // CAMBIO: Aceptar números en lugar de strings
  plaintiffIds: z.array(z.number()).min(1, 'Debe seleccionar al menos un demandante'),
  defendantIds: z.array(z.number()).min(1, 'Debe seleccionar al menos un demandado'),
  attorneyIds: z.array(z.number()).optional(),
  representativeIds: z.array(z.number()).optional(),
  
  institution: z.string().min(1, 'Tribunal requerido'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  claims: z.array(z.string()).optional()
});

const CaseForm = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [claimInput, setClaimInput] = useState('');
  const [claimsList, setClaimsList] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Estados para overlay de gestión de participantes
  const [overlayAbierto, setOverlayAbierto] = useState(false);
  const [tipoOverlay, setTipoOverlay] = useState('');
  const [editandoIndice, setEditandoIndice] = useState(-1);
  
  // Estados para selecciones múltiples
  // Ahora almacenamos objetos {id, rut} en lugar de solo RUTs
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState({
    demandantes: [],
    demandados: [],
    abogados: [],
    representantes: []
  });
  
  // Estado para el formulario del overlay
  const [formData, setFormData] = useState({
    id: null,  // Agregamos el campo id para guardar el ID numérico
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
const { createLawsuit, isCreatingLawsuit } = useLawsuits();  
const { 
    plaintiffs, defendants, lawyers, representatives,
    createPlaintiff, createDefendant, createLawyer, createRepresentative,
    updatePlaintiff, updateDefendant, updateLawyer, updateRepresentative,
    deletePlaintiff, deleteDefendant, deleteLawyer, deleteRepresentative,
    isLoadingPlaintiffs, isLoadingDefendants, isLoadingLawyers, isLoadingRepresentatives 
  } = useParticipants();
  const { proceedingTypeOptions, isLoading: isLoadingProceedingTypes } = useProceedingTypes();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      proceedingType: '',
      legalMatter: '',
      plaintiffIds: [],
      defendantIds: [],
      attorneyIds: [],
      representativeIds: [],
      institution: 'S.J.L. EN LO CIVIL',
      description: '',
      claims: []
    }
  });

  // ... (mantener todas las funciones de validación y manejo sin cambios)
  // Funciones de validación
  const validarRUT = (rut) => {
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

  const formatearRUT = (valor) => {
    const limpio = valor.replace(/[^0-9kK]/g, '');
    
    if (limpio.length <= 1) return limpio;
    
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1).toUpperCase();
    
    let cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${cuerpoFormateado}-${dv}`;
  };

  const validarNombre = (nombre) => {
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

  const validarDireccion = (direccion) => {
    if (!direccion.trim()) {
      return 'La dirección es obligatoria';
    }
    
    if (direccion.length > 255) {
      return 'La dirección no puede exceder 255 caracteres';
    }
    
    return '';
  };

  const manejarCambioRUT = (valor) => {
    const soloValidos = valor.replace(/[^0-9kK]/g, '');
    
    if (soloValidos.length > 9) return;
    
    const rutFormateado = formatearRUT(soloValidos);
    const error = validarRUT(rutFormateado);
    
    setFormData(prev => ({ ...prev, rut: rutFormateado }));
    setErroresValidacion(prev => ({ ...prev, rut: error }));
  };

  const manejarCambioNombre = (valor) => {
    const soloLetras = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    
    if (soloLetras.length > 100) return;
    
    const error = validarNombre(soloLetras);
    
    setFormData(prev => ({ ...prev, nombre: soloLetras }));
    setErroresValidacion(prev => ({ ...prev, nombre: error }));
  };

  const manejarCambioDireccion = (valor) => {
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
  const obtenerDatosPorTipo = (tipo) => {
    switch(tipo) {
      case 'demandantes': return plaintiffs || [];
      case 'demandados': return defendants || [];
      case 'abogados': return lawyers || [];
      case 'representantes': return representatives || [];
      default: return [];
    }
  };

const agregarPersonaSeleccionada = (tipo, rutPersona) => {
  const yaSeleccionada = personasSeleccionadas[tipo].some(p => p.rut === rutPersona);
  
  if (rutPersona && !yaSeleccionada) {
    const personas = obtenerDatosPorTipo(tipo);
    const personaCompleta = personas.find(p => p.idNumber === rutPersona);
    
    if (!personaCompleta) {
      toast.error('No se encontró la información completa de la persona');
      return;
    }
    
    const nuevaPersona = { id: personaCompleta.id, rut: rutPersona };
    
    setPersonasSeleccionadas(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], nuevaPersona]
    }));

      // Actualizar el formulario principal con los IDs numéricos
      switch(tipo) {
        case 'demandantes':
          setValue('plaintiffIds', [...personasSeleccionadas.demandantes.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
        case 'demandados':
          setValue('defendantIds', [...personasSeleccionadas.demandados.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
        case 'abogados':
          setValue('attorneyIds', [...personasSeleccionadas.abogados.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
        case 'representantes':
          setValue('representativeIds', [...personasSeleccionadas.representantes.map(p => Number(p.id)), Number(nuevaPersona.id)]);
          break;
      }
    }
  };

  const eliminarPersonaSeleccionada = (tipo, rutPersona) => {
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

  const obtenerPersonaPorRut = (tipo, rutOPersona) => {
    const datos = obtenerDatosPorTipo(tipo);
    // Si recibimos un objeto {id, rut}, extraemos el rut
    const rut = typeof rutOPersona === 'object' ? rutOPersona.rut : rutOPersona;
    return datos.find(persona => persona.idNumber === rut);
  };

  // Funciones del overlay
  const abrirOverlay = (tipo) => {
    setTipoOverlay(tipo);
    setOverlayAbierto(true);
    setEditandoIndice(-1);
    setFormData({ rut: '', nombre: '', direccion: '' });
  };

  const cerrarOverlay = () => {
    setOverlayAbierto(false);
    setTipoOverlay('');
    setEditandoIndice(-1);
    setFormData({ id: null, rut: '', nombre: '', direccion: '' });
    setErroresValidacion({ rut: '', nombre: '', direccion: '' });
  };

  const obtenerTitulo = () => {
    const titulos = {
      'demandantes': 'Gestionar Demandantes',
      'demandados': 'Gestionar Demandados',
      'abogados': 'Gestionar Abogados Patrocinantes',
      'representantes': 'Gestionar Representantes Legales'
    };
    return titulos[tipoOverlay] || '';
  };

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
        toast.error(`Error al crear ${tipoOverlay}: ${error.message}`);
      }
    }
  };

  const editarPersona = (indice) => {
    const datosActuales = obtenerDatosPorTipo(tipoOverlay);
    const persona = datosActuales[indice];
    if (persona) {
      setFormData({
        id: persona.id,   // Guardamos el ID numérico para operaciones de API
        rut: persona.idNumber,
        nombre: persona.fullName,
        direccion: persona.address || ''
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
          id: formData.id,        // Incluimos el ID numérico 
          idNumber: formData.rut,
          fullName: formData.nombre,
          address: formData.direccion
        };
        
        const id = formData.id; // Usamos el ID numérico para la API
        
        console.log(`Guardando edición de ${tipoOverlay}`, { id, data: datosActualizados });
        
        switch(tipoOverlay) {
          case 'demandantes':
            await updatePlaintiff({ 
              id, 
              data: datosActualizados 
            });
            break;
          case 'demandados':
            await updateDefendant({ 
              id, 
              data: datosActualizados 
            });
            break;
          case 'abogados':
            await updateLawyer({ 
              id, 
              data: datosActualizados 
            });
            break;
          case 'representantes':
            await updateRepresentative({ 
              id, 
              data: datosActualizados 
            });
            break;
        }
        
        // Limpiar el formulario y cerrar modo edición
        setEditandoIndice(-1);
        setFormData({ id: null, rut: '', nombre: '', direccion: '' });
        setErroresValidacion({ rut: '', nombre: '', direccion: '' });
      } catch (error) {
        console.error(`Error al actualizar ${tipoOverlay}:`, error);
        toast.error(`Error al actualizar ${tipoOverlay}: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const eliminarPersona = async (indice) => {
    try {
      const datosActuales = obtenerDatosPorTipo(tipoOverlay);
      const persona = datosActuales[indice];
      
      if (!persona) {
        toast.error('No se pudo encontrar la persona a eliminar');
        return;
      }
      
      // Usar el ID numérico de la API
      const id = persona.id;
      const rutCompleto = persona.idNumber;
      
      console.log(`Eliminando ${tipoOverlay} con id numérico:`, id);
      console.log(`RUT de la persona:`, rutCompleto);
      
      // Verificamos si la persona está seleccionada en algún grupo
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
        
        // Remover de las selecciones
        Object.keys(personasSeleccionadas).forEach((tipo) => {
          if (personasSeleccionadas[tipo].some(p => p.rut === rutCompleto)) {
            eliminarPersonaSeleccionada(tipo, rutCompleto);
          }
        });
      }

      // Eliminar de la base de datos usando el ID numérico
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
      toast.error(`Error al eliminar ${tipoOverlay}: ${error.message || 'Error desconocido'}`);
    }
  };

  // Función principal para enviar el caso - ACTUALIZADA
// En CaseForm.jsx, línea ~290, corregir esta función:

// En CaseForm.jsx, reemplazar completamente la función onSubmit:

const onSubmit = async (data) => {
  console.log('🚀 onSubmit ejecutado con data:', data);
  console.log('🚀 personasSeleccionadas:', personasSeleccionadas);
  console.log('🚀 claimsList:', claimsList);
  
  setSaving(true);
  toast.info('Procesando solicitud...');
  
  try {
    // CAMBIO: Obtener RUTs en lugar de IDs numéricos
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
    
    // CAMBIO: Enviar RUTs como strings al backend
    const lawsuitRequest = {
      proceedingType: data.proceedingType,
      subjectMatter: data.legalMatter,
      plaintiffs: plaintiffRuts,                    // Array de RUTs como strings
      defendants: defendantRuts,                    // Array de RUTs como strings
      attorneyOfRecord: attorneyRuts.length > 0 ? attorneyRuts[0] : undefined,     // RUT como string
      representative: representativeRuts.length > 0 ? representativeRuts[0] : undefined, // RUT como string
      claims: claimsList,
      institution: data.institution,
      narrative: data.description
    };
    
    // LOGS DE DEBUG - AQUÍ VAN LOS LOGS
    console.log('📤 Datos enviados al backend:', JSON.stringify(lawsuitRequest, null, 2));
    console.log('📤 Tipos de datos:', {
      proceedingType: typeof lawsuitRequest.proceedingType,
      subjectMatter: typeof lawsuitRequest.subjectMatter,
      plaintiffs: Array.isArray(lawsuitRequest.plaintiffs) && lawsuitRequest.plaintiffs.map(p => typeof p),
      defendants: Array.isArray(lawsuitRequest.defendants) && lawsuitRequest.defendants.map(d => typeof d),
      attorneyOfRecord: typeof lawsuitRequest.attorneyOfRecord,
      representative: typeof lawsuitRequest.representative,
      claims: Array.isArray(lawsuitRequest.claims) && lawsuitRequest.claims.map(c => typeof c),
      institution: typeof lawsuitRequest.institution,
      narrative: typeof lawsuitRequest.narrative
    });
    
    // Llamada a la API
    await createLawsuit(lawsuitRequest);
    toast.success('Caso creado exitosamente');
    router.push('/dashboard');
    
  } catch (error) {
    console.error('🔥 Error completo:', error);
    toast.error(`Error al crear el caso: ${error.message || 'Error desconocido'}`);
  } finally {
    setSaving(false);
  }
};

  // ... (mantener todo el resto del componente sin cambios hasta la función onSubmit)
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

  const predefinedClaims = [
    'DEMANDA CIVIL',
    'DEMANDA EJECUTIVA Y MANDAMIENTO DE EJECUCIÓN Y EMBARGO',
    'SEÑALA BIENES PARA EMBARGO Y DEPOSITARIO PROVISIONAL',
    'ACOMPAÑA DOCUMENTOS, CON CITACIÓN',
    'FORMACIÓN DE CUADERNO SEPARADO',
    'PATROCINIO Y PODER',
    'FORMA DE NOTIFICACIÓN ELECTRÓNICA'
  ];

  // Funciones para peticiones
const handleAddClaim = (claim) => {
  // CAMBIO: Verificar que claim existe y es string antes de usar trim
  if (!claim || typeof claim !== 'string') {
    console.log('handleAddClaim recibió:', claim);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // CAMBIO: Asegurar que claimInput existe
      if (claimInput && claimInput.trim()) {
        handleAddClaim(claimInput);
      }
    }
  };

  const handleDeleteClaim = (claimToDelete) => {
    setClaimsList(prev => prev.filter(claim => claim !== claimToDelete));
  };

  // Componente de búsqueda con autocompletado
  const AutocompleteSearch = ({ tipo, placeholder, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showingRecommendations, setShowingRecommendations] = useState(false);
    const searchRef = useRef(null);
    const personas = obtenerDatosPorTipo(tipo);
    const seleccionadas = personasSeleccionadas[tipo] || [];

    // Obtener los últimos 5 registros creados (ordenados por fecha de creación descendente)
    const getRecentlyCreated = () => {
      // Asumimos que las personas más recientes están al final del array
      // Si el API devuelve por fecha de creación en otro orden, habría que ajustar esto
      return personas
        .filter(persona => {
          // Verificar que la persona no está ya seleccionada
          return !seleccionadas.some(p => p.rut === persona.idNumber);
        })
        .slice(-5) // Últimos 5 elementos
        .reverse(); // Para que los más recientes aparezcan primero
    };

    // Filtrar personas basado en el término de búsqueda
    useEffect(() => {
      if (searchTerm.trim() === '') {
        if (showResults) {
          // Mostrar recomendaciones al hacer clic cuando el campo está vacío
          setResults(getRecentlyCreated());
          setShowingRecommendations(true);
        } else {
          setResults([]);
        }
        return;
      }

      // Si hay término de búsqueda, mostrar resultados filtrados
      setShowingRecommendations(false);
      const termLower = searchTerm.toLowerCase();
      const filtered = personas
        .filter(persona => {
          // Verificar que la persona no está ya seleccionada
          const yaSeleccionada = seleccionadas.some(p => p.rut === persona.idNumber);
          return !yaSeleccionada && (
            persona.fullName.toLowerCase().includes(termLower) || 
            persona.idNumber.toLowerCase().includes(termLower)
          );
        })
        .slice(0, 5); // Máximo 5 resultados
      
      setResults(filtered);
    }, [searchTerm, personas, seleccionadas, tipo, showResults]);

    // Manejar click fuera del componente para cerrar resultados
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setShowResults(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setShowResults(true);
    };

    const handleSelectResult = (persona) => {
      onSelect(persona.idNumber);
      setSearchTerm('');
      setShowResults(false);
    };

    const handleFocus = () => {
      setShowResults(true);
      if (searchTerm.trim() === '') {
        // Al enfocar con campo vacío, mostrar las últimas 5 personas creadas
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
  const PredefinedClaimsAutocomplete = ({ onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showingAllOptions, setShowingAllOptions] = useState(false);
    const searchRef = useRef(null);

    // Filtrar peticiones basado en el término de búsqueda
    useEffect(() => {
      if (searchTerm.trim() === '') {
        if (showResults) {
          // Mostrar todas las peticiones cuando se hace clic y no hay búsqueda
          setResults(predefinedClaims.slice(0, 5)); // Mostrar hasta 5 resultados
          setShowingAllOptions(true);
        } else {
          setResults([]);
        }
        return;
      }

      // Si hay término de búsqueda, filtrar resultados
      setShowingAllOptions(false);
      const termLower = searchTerm.toLowerCase();
      const filtered = predefinedClaims
        .filter(claim => claim.toLowerCase().includes(termLower))
        .slice(0, 5); // Máximo 5 resultados
    
      setResults(filtered);
    }, [searchTerm, showResults]);

    // Manejar click fuera del componente para cerrar resultados
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setShowResults(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setShowResults(true);
    };

    const handleSelectResult = (claim) => {
      onSelect(claim);
      setSearchTerm('');
      setShowResults(false);
    };

    const handleFocus = () => {
      setShowResults(true);
      if (searchTerm.trim() === '') {
        // Al enfocar con campo vacío, mostrar todas las peticiones predefinidas
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
          <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg p-2.5 text-center text-sm text-gray-400">
            No se encontraron peticiones
          </div>
        )}
      </div>
    );
  };

  // Componente para selector múltiple compacto (para la sección integrada)
  const SelectorMultipleCompacto = ({ tipo, titulo, esOpcional = false }) => {
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
            onSelect={(rutPersona) => agregarPersonaSeleccionada(tipo, rutPersona)}
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

  return (
    <div className="relative bg-gray-800 min-h-screen p-1">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Nuevo caso</h2>
          <p className="text-gray-400">Complete el formulario para registrar un nuevo caso legal</p>
        </div>
        
        <div className="bg-[#0F1625] rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="space-y-6">
                  {/* Abogados */}
                  <div>
                    <SelectorMultipleCompacto tipo="abogados" titulo="Abogados Patrocinantes" esOpcional={true} />
                  </div>
                  
                  {/* Representantes */}
                  <div>
                    <SelectorMultipleCompacto tipo="representantes" titulo="Representantes Legales" esOpcional={true} />
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
                        // CAMBIO: Verificar que claimInput existe antes de llamar handleAddClaim
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
                      <div className="text-sm text-gray-400">{persona.address}</div>
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

export default CaseForm;