// src/types/ParticipantTypes.ts
import { ParticipantDetailResponse } from '@/generated/api/data-contracts';

/**
 * Interfaz para el resumen de persona (usando las mismas propiedades que la API)
 */
export interface PersonSummary {
  id: number | null;
  idNumber: string; // RUT - usando el mismo nombre que la API
}

/**
 * Interfaz para persona completa (usando las mismas propiedades que la API)
 */
export interface Person extends PersonSummary {
  fullName: string; // Nombre - usando el mismo nombre que la API
  address: string; // Dirección - usando el mismo nombre que la API
}

/**
 * Tipos de participantes disponibles
 */
export type ParticipantType = 'demandantes' | 'demandados' | 'abogados' | 'representantes';

/**
 * Mapa de traducciones para mostrar en la UI
 */
export const PARTICIPANT_LABELS: Record<ParticipantType, string> = {
  demandantes: 'Demandantes',
  demandados: 'Demandados',
  abogados: 'Abogado Patrocinante',
  representantes: 'Representante Legal'
};

/**
 * Configuración para cada tipo de participante
 */
export interface ParticipantConfig {
  type: ParticipantType;
  label: string;
  isOptional: boolean;
  allowMultiple: boolean;
  placeholder: string;
}

export const PARTICIPANT_CONFIGS: Record<ParticipantType, ParticipantConfig> = {
  demandantes: {
    type: 'demandantes',
    label: 'Demandantes',
    isOptional: false,
    allowMultiple: true,
    placeholder: 'Buscar demandante por RUT o nombre...'
  },
  demandados: {
    type: 'demandados',
    label: 'Demandados',
    isOptional: false,
    allowMultiple: true,
    placeholder: 'Buscar demandado por RUT o nombre...'
  },
  abogados: {
    type: 'abogados',
    label: 'Abogado Patrocinante',
    isOptional: false,
    allowMultiple: false,
    placeholder: 'Buscar abogado por RUT o nombre...'
  },
  representantes: {
    type: 'representantes',
    label: 'Representante Legal',
    isOptional: true,
    allowMultiple: false,
    placeholder: 'Buscar representante por RUT o nombre...'
  }
};

/**
 * Utilidad para convertir de ParticipantDetailResponse a PersonSummary
 */
export const mapApiParticipantToPersonSummary = (participant: ParticipantDetailResponse): PersonSummary => {
  return {
    id: participant.id,
    idNumber: participant.idNumber
  };
};

/**
 * Utilidad para convertir de ParticipantDetailResponse a Person
 */
export const mapApiParticipantToPerson = (participant: ParticipantDetailResponse): Person => {
  return {
    id: participant.id,
    idNumber: participant.idNumber,
    fullName: participant.fullName,
    address: participant.address || '' // El address siempre existe en ParticipantDetailResponse
  };
};