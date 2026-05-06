import api from './api';

export interface UserProfile {
  id: number;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  person: {
    id: number;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
  };
  role: {
    id: number;
    code: string;
    name: string;
  };
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/auth/profile');
  return data;
}
