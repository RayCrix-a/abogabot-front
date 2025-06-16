import { DefendantResource } from '@/generated/api/DefendantResource';
import { LawsuitResource } from '@/generated/api/LawsuitResource';
import { LawyerResource } from '@/generated/api/LawyerResource';
import { PlaintiffResource } from '@/generated/api/PlaintiffResource';
import { ProceedingTypeResource } from '@/generated/api/ProceedingTypeResource';
import { SubjectMatterResource } from '@/generated/api/SubjectMatterResource';
import { RegulationResource } from '@/generated/api/RegulationResource';
import { RepresentativeResource } from '@/generated/api/RepresentativeResource';
import { ChatResource } from '@/generated/api/ChatResource';

// Get API base URL from environment variables with a fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_ABOGABOT_API_URL || 'http://localhost:8080';

// Create instances of API resources
export const defendantResource = new DefendantResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const lawsuitResource = new LawsuitResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const lawyerResource = new LawyerResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const plaintiffResource = new PlaintiffResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const proceedingTypeResource = new ProceedingTypeResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const subjectMatterResource = new SubjectMatterResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});


export const regulationResource = new RegulationResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const representativeResource = new RepresentativeResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Function to generate documents with streaming support
export const generateLawsuitDocument = async (id : number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lawsuit/generate?id=${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error al generar documento: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Error en generateLawsuitDocument:', error);
    throw error;
  }
};

export const chatResource = new ChatResource({
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});