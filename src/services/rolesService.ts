import api from './api';
import type { Role, CreateRoleDto, UpdateRoleDto, PaginationStatusParams } from '../types';

export const rolesService = {
  getAll: (params?: PaginationStatusParams) =>
    api.get<Role[]>('/roles', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Role>(`/roles/${id}`).then((r) => r.data),

  create: (dto: CreateRoleDto) =>
    api.post<Role>('/roles', dto).then((r) => r.data),

  update: (id: number, dto: UpdateRoleDto) =>
    api.patch<Role>(`/roles/${id}`, dto).then((r) => r.data),

  updateStatus: (id: number, status: boolean) =>
    api.patch(`/roles/${id}/${status}`).then((r) => r.data),
};
