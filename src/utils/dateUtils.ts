/**
 * Timezone offset para Chile 
 * - Invierno (marzo-septiembre): UTC-4
 * - Verano (octubre-febrero): UTC-3
 */
const getChileTimezoneOffset = (): number => {
  const now = new Date();
  const month = now.getUTCMonth() + 1; // getUTCMonth() devuelve 0-11, necesitamos 1-12
  
  // Horario de invierno: marzo (3) a septiembre (9) = UTC-4
  // Horario de verano: octubre (10) a febrero (2) = UTC-3
  if (month >= 3 && month <= 9) {
    return -4; // UTC-4 (horario de invierno)
  } else {
    return -3; // UTC-3 (horario de verano)
  }
};

/**
 * Convierte una fecha UTC a hora de Chile
 * Ajusta automáticamente entre UTC-4 (invierno) y UTC-3 (verano)
 * @param utcDateString - Fecha en formato ISO string UTC
 * @returns Date object ajustado a hora de Chile
 */
export const convertUTCToChileTime = (utcDateString: string): Date => {
  try {
    if (!utcDateString) {
      console.warn('Fecha UTC vacía proporcionada');
      return new Date();
    }

    let date: Date;
    
    // Manejar diferentes formatos de fecha que puede devolver la API
    if (utcDateString.includes('T')) {
      // Formato ISO completo: "2025-06-19T15:30:00Z" o "2025-06-19T15:30:00"
      date = new Date(utcDateString);
    } else if (utcDateString.includes(' ')) {
      // Formato "2025-06-19 15:30:00"
      date = new Date(utcDateString.replace(' ', 'T'));
    } else {
      // Intentar crear Date directamente
      date = new Date(utcDateString);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida recibida:', utcDateString);
      return new Date();
    }
    
    // Obtener el offset correcto según la época del año
    const timezoneOffset = getChileTimezoneOffset();
    
    // Convertir UTC a hora de Chile (UTC-4 en invierno, UTC-3 en verano)
    const chileTime = new Date(date.getTime() + (timezoneOffset * 60 * 60 * 1000));
    
    return chileTime;
  } catch (error) {
    console.error('Error al convertir fecha UTC a hora de Chile:', error, utcDateString);
    return new Date();
  }
};

/**
 * Formatea un número con padding de ceros
 */
const pad = (num: number): string => {
  return num.toString().padStart(2, '0');
};

/**
 * Formatea la hora de un mensaje para mostrar en el chat
 * Convierte de UTC a hora de Chile y muestra solo HH:mm
 * @param utcTimestamp - Timestamp UTC del mensaje
 * @returns String con formato "HH:mm" en hora de Chile
 */
export const formatMessageTime = (utcTimestamp: string): string => {
  try {
    if (!utcTimestamp) return '';
    
    const chileTime = convertUTCToChileTime(utcTimestamp);
    return `${pad(chileTime.getHours())}:${pad(chileTime.getMinutes())}`;
  } catch (error) {
    console.error('Error al formatear hora del mensaje:', error, utcTimestamp);
    return '';
  }
};

/**
 * Formatea el tiempo relativo para el historial de chats
 * Muestra "hace X minutos/horas/días" en español
 * @param utcTimestamp - Timestamp UTC del último mensaje
 * @returns String con tiempo relativo en español
 */
export const formatRelativeTime = (utcTimestamp: string | Date): string => {
  try {
    let date: Date;
    
    if (typeof utcTimestamp === 'string') {
      date = convertUTCToChileTime(utcTimestamp);
    } else {
      date = utcTimestamp;
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida para tiempo relativo:', utcTimestamp);
      return 'Hace poco';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    
    if (diffInMinutes < 1) {
      return 'hace menos de un minuto';
    } else if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 30) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInMonths < 12) {
      return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
    } else {
      const diffInYears = Math.floor(diffInMonths / 12);
      return `hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error al formatear tiempo relativo:', error, utcTimestamp);
    return 'Hace poco';
  }
};

/**
 * Nombres de meses en español
 */
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Formatea una fecha completa en formato chileno
 * @param utcTimestamp - Timestamp UTC
 * @returns String con formato completo de fecha
 */
export const formatFullDate = (utcTimestamp: string): string => {
  try {
    if (!utcTimestamp) return 'Fecha no disponible';
    
    const chileTime = convertUTCToChileTime(utcTimestamp);
    const day = chileTime.getDate();
    const month = MONTHS[chileTime.getMonth()];
    const year = chileTime.getFullYear();
    const hour = pad(chileTime.getHours());
    const minute = pad(chileTime.getMinutes());
    
    return `${day} de ${month} de ${year} a las ${hour}:${minute}`;
  } catch (error) {
    console.error('Error al formatear fecha completa:', error, utcTimestamp);
    return utcTimestamp || 'Fecha no disponible';
  }
};

/**
 * Obtiene la fecha y hora actual en hora de Chile
 * Ajusta automáticamente para horario de invierno/verano
 * @returns Date object con hora actual de Chile
 */
export const getCurrentChileTime = (): Date => {
  const now = new Date();
  const timezoneOffset = getChileTimezoneOffset();
  return new Date(now.getTime() + (timezoneOffset * 60 * 60 * 1000));
};

/**
 * Formatea una fecha como YYYY-MM-DD
 */
const formatDateOnly = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Verifica si una fecha es de hoy en hora de Chile
 * @param utcTimestamp - Timestamp UTC
 * @returns boolean indicando si la fecha es de hoy
 */
export const isToday = (utcTimestamp: string): boolean => {
  try {
    const chileTime = convertUTCToChileTime(utcTimestamp);
    const today = getCurrentChileTime();
    
    return formatDateOnly(chileTime) === formatDateOnly(today);
  } catch (error) {
    console.error('Error al verificar si es hoy:', error, utcTimestamp);
    return false;
  }
};

/**
 * Verifica si una fecha es de ayer en hora de Chile
 * @param utcTimestamp - Timestamp UTC
 * @returns boolean indicando si la fecha es de ayer
 */
export const isYesterday = (utcTimestamp: string): boolean => {
  try {
    const chileTime = convertUTCToChileTime(utcTimestamp);
    const yesterday = new Date(getCurrentChileTime());
    yesterday.setDate(yesterday.getDate() - 1);
    
    return formatDateOnly(chileTime) === formatDateOnly(yesterday);
  } catch (error) {
    console.error('Error al verificar si es ayer:', error, utcTimestamp);
    return false;
  }
};

/**
 * Convierte la hora actual de Chile a UTC para enviar al backend
 * @returns String en formato ISO UTC
 */
export const convertChileTimeToUTC = (): string => {
  const now = new Date();
  const timezoneOffset = getChileTimezoneOffset();
  
  // Crear fecha en hora de Chile
  const chileTime = new Date(now.getTime() + (timezoneOffset * 60 * 60 * 1000));
  
  // Convertir de vuelta a UTC restando el offset
  const utcTime = new Date(chileTime.getTime() - (timezoneOffset * 60 * 60 * 1000));
  
  return utcTime.toISOString();
};

/**
 * Obtiene información del timezone actual de Chile
 * Útil para debugging
 * @returns Objeto con información del timezone
 */
export const getChileTimezoneInfo = () => {
  const offset = getChileTimezoneOffset();
  const season = offset === -4 ? 'invierno' : 'verano';
  const utcString = offset === -4 ? 'UTC-4' : 'UTC-3';
  
  return {
    offset,
    season,
    utcString,
    description: `Horario de ${season} en Chile (${utcString})`
  };
};

/**
 * Formatea la hora del mensaje de manera inteligente
 * - Si es de hoy: muestra solo la hora
 * - Si es de ayer: muestra "Ayer HH:mm"
 * - Si es más antiguo: muestra fecha y hora
 * @param utcTimestamp - Timestamp UTC
 * @returns String formateado según la antigüedad
 */
export const formatSmartMessageTime = (utcTimestamp: string): string => {
  try {
    if (!utcTimestamp) return '';
    
    if (isToday(utcTimestamp)) {
      return formatMessageTime(utcTimestamp);
    } else if (isYesterday(utcTimestamp)) {
      const chileTime = convertUTCToChileTime(utcTimestamp);
      return `Ayer ${pad(chileTime.getHours())}:${pad(chileTime.getMinutes())}`;
    } else {
      const chileTime = convertUTCToChileTime(utcTimestamp);
      return `${pad(chileTime.getDate())}/${pad(chileTime.getMonth() + 1)} ${pad(chileTime.getHours())}:${pad(chileTime.getMinutes())}`;
    }
  } catch (error) {
    console.error('Error al formatear hora inteligente:', error, utcTimestamp);
    return formatMessageTime(utcTimestamp);
  }
};