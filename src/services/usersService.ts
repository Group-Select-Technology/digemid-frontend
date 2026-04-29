import api from './api';
import type { User, CreateUserDto, UpdateUserDto, PaginationParams } from '../types';

export const usersService = {
  getAll: (params?: PaginationParams) =>
    api.get<User[]>('/users', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    api.post<User>('/users', dto).then((r) => r.data),

  update: (id: number, dto: UpdateUserDto) =>
    api.patch<User>(`/users/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/users/${id}`).then((r) => r.data),

  resetPassword: (id: number) =>
    api.patch(`/users/${id}/reset-password`).then((r) => r.data),

  updateStatus: (id: number, status: boolean) =>
    api.patch(`/users/${id}/${status}`).then((r) => r.data),
};
