/**
 * VALIDACIONES DE PARTICIPANTES
 */

/**
 * Valida un RUT chileno
 * @param rut - RUT a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateRUT = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, '');

  if (cleanRut.length < 8 || cleanRut.length > 9) {
    return 'El RUT debe tener 7-8 dígitos más el dígito verificador';
  }

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  if (body.length < 7 || body.length > 8) {
    return 'El RUT debe tener 7-8 dígitos';
  }

  if (!/^[0-9K]$/.test(dv)) {
    return 'El dígito verificador debe ser un número (0-9) o la letra K';
  }

  return '';
};

/**
 * Formatea un RUT con puntos y guión
 * @param value - Valor a formatear
 * @returns RUT formateado
 */
export const formatRUT = (value: string): string => {
  const clean = value.replace(/[^0-9kK]/g, '');

  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
};

/**
 * Valida un nombre completo
 * @param name - Nombre a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateFullName = (name: string): string => {
  if (!name.trim()) {
    return 'El nombre es obligatorio';
  }

  if (name.length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(name)) {
    return 'El nombre solo puede contener letras y tildes';
  }

  return '';
};

/**
 * Valida una dirección
 * @param address - Dirección a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateAddress = (address: string): string => {
  if (!address.trim()) {
    return 'La dirección es obligatoria';
  }

  if (address.length > 255) {
    return 'La dirección no puede exceder 255 caracteres';
  }

  return '';
};

/**
 * VALIDACIONES DE CASOS
 */

/**
 * Valida el título de un caso
 * @param title - Título a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateCaseTitle = (title: string): string => {
  if (!title.trim()) {
    return 'El título es obligatorio';
  }

  if (title.length > 100) {
    return 'El título no puede exceder 100 caracteres';
  }

  return '';
};

/**
 * Valida la descripción/narrativa de un caso
 * @param description - Descripción a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateCaseDescription = (description: string): string => {
  if (!description.trim()) {
    return 'La descripción es obligatoria';
  }

  if (description.length < 20) {
    return 'La descripción debe tener al menos 20 caracteres';
  }

  if (description.length > 5000) {
    return 'La descripción no puede exceder 5000 caracteres';
  }

  return '';
};

/**
 * Valida una petición al tribunal
 * @param claim - Petición a validar
 * @returns string con mensaje de error, vacío si es válido
 */
export const validateClaim = (claim: string): string => {
  if (!claim.trim()) {
    return 'La petición no puede estar vacía';
  }

  if (claim.length > 500) {
    return 'La petición no puede exceder 500 caracteres';
  }

  return '';
};

/**
 * INTERFACES PARA ERRORES DE VALIDACIÓN
 */

export interface ParticipantValidationErrors {
  idNumber: string;
  fullName: string;
  address: string;
}

export interface CaseValidationErrors {
  title: string;
  proceedingType: string;
  legalMatter: string;
  institution: string;
  description: string;
  participants: {
    demandantes: string;
    demandados: string;
    abogados: string;
    representantes: string;
  };
}

/**
 * ESTADOS INICIALES DE ERRORES
 */

export const initialParticipantValidationErrors: ParticipantValidationErrors = {
  idNumber: '',
  fullName: '',
  address: ''
};

export const initialCaseValidationErrors: CaseValidationErrors = {
  title: '',
  proceedingType: '',
  legalMatter: '',
  institution: '',
  description: '',
  participants: {
    demandantes: '',
    demandados: '',
    abogados: '',
    representantes: ''
  }
};

/**
 * FUNCIONES DE UTILIDAD PARA VALIDACIÓN
 */

/**
 * Verifica si un objeto de errores tiene algún error
 * @param errors - Objeto de errores a verificar
 * @returns true si hay errores, false si no
 */
export const hasValidationErrors = (errors: Record<string, any>): boolean => {
  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].trim() !== '') {
        return true;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  return checkObject(errors);
};

/**
 * Limpia todos los errores de un objeto de errores
 * @param errors - Objeto de errores a limpiar
 * @returns Objeto de errores limpio
 */
export const clearValidationErrors = <T extends Record<string, any>>(errors: T): T => {
  const clearObject = (obj: any): any => {
    const cleared: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        cleared[key] = '';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleared[key] = clearObject(obj[key]);
      } else {
        cleared[key] = obj[key];
      }
    }
    return cleared;
  };

  return clearObject(errors);
};

/**
 * VALIDACIONES ESPECÍFICAS PARA FORMULARIOS
 */

/**
 * Valida todos los campos de un participante
 * @param participant - Datos del participante
 * @returns Objeto con errores de validación
 */
export const validateParticipant = (participant: {
  idNumber: string;
  fullName: string;
  address: string;
}): ParticipantValidationErrors => {
  return {
    idNumber: validateRUT(participant.idNumber),
    fullName: validateFullName(participant.fullName),
    address: validateAddress(participant.address)
  };
};

/**
 * Valida si un participante es válido (sin errores)
 * @param participant - Datos del participante
 * @returns true si es válido, false si tiene errores
 */
export const isValidParticipant = (participant: {
  idNumber: string;
  fullName: string;
  address: string;
}): boolean => {
  const errors = validateParticipant(participant);
  return !hasValidationErrors(errors);
};

/**
 * CONSTANTES DE VALIDACIÓN
 */

export const VALIDATION_LIMITS = {
  RUT_MIN_LENGTH: 8,
  RUT_MAX_LENGTH: 9,
  NAME_MAX_LENGTH: 100,
  ADDRESS_MAX_LENGTH: 255,
  CASE_TITLE_MAX_LENGTH: 100,
  CASE_DESCRIPTION_MIN_LENGTH: 20,
  CASE_DESCRIPTION_MAX_LENGTH: 5000,
  CLAIM_MAX_LENGTH: 500
} as const;

/**
 * REGEX PATTERNS
 */

export const VALIDATION_PATTERNS = {
  RUT_CHARS: /[^0-9kK]/g,
  NAME_CHARS: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
  DV_CHAR: /^[0-9K]$/
} as const;