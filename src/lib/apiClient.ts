import { DefendantResource } from '@/generated/api/DefendantResource';
import { LawsuitResource } from '@/generated/api/LawsuitResource';
import { LawyerResource } from '@/generated/api/LawyerResource';
import { PlaintiffResource } from '@/generated/api/PlaintiffResource';
import { ProceedingTypeResource } from '@/generated/api/ProceedingTypeResource';
import { SubjectMatterResource } from '@/generated/api/SubjectMatterResource';
import { RegulationResource } from '@/generated/api/RegulationResource';
import { RepresentativeResource } from '@/generated/api/RepresentativeResource';
import { ChatResource } from '@/generated/api/ChatResource';
import { UserResource } from '@/generated/api/UserResource';
import { RoleResource } from '@/generated/api/RoleResource';
import { PermissionResource } from '@/generated/api/PermissionResource';
import { ActivityLogResource } from '@/generated/api/ActivityLogResource';

// Get API base URL from environment variables with a fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_ABOGABOT_API_URL || 'http://localhost:8080';

const apiConfig = {
  baseUrl: API_BASE_URL,
  baseApiParams: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
}

// Create instances of API resources
export const defendantResource = new DefendantResource(apiConfig);
export const lawsuitResource = new LawsuitResource(apiConfig);
export const lawyerResource = new LawyerResource(apiConfig);
export const plaintiffResource = new PlaintiffResource(apiConfig);
export const proceedingTypeResource = new ProceedingTypeResource(apiConfig);
export const subjectMatterResource = new SubjectMatterResource(apiConfig);
export const regulationResource = new RegulationResource(apiConfig);
export const representativeResource = new RepresentativeResource(apiConfig);
export const chatResource = new ChatResource(apiConfig);
export const userResource = new UserResource(apiConfig);
export const roleResource = new RoleResource(apiConfig);
export const permissionResource = new PermissionResource(apiConfig);
export const activityLogResource = new ActivityLogResource(apiConfig);
