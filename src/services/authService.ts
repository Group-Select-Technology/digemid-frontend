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

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/auth/profile');
  return data;
}

export async function changePassword(payload: ChangePasswordDto): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>('/auth/change-password', payload);
  return data;
}
