import api from './api';
import type {
  CreateSupportDto,
  SupportModel,
  SupportPaginatedResponse,
  SupportPaginationParams,
  UpdateSupportDto,
} from '../types';

/**
 * Modelos de soporte y sus drivers. `/support/catalog` es exclusivo del catálogo
 * público y no se usa en el panel administrativo.
 */
export const supportService = {
  getAll: (params?: SupportPaginationParams) =>
    api.get<SupportPaginatedResponse>('/support', { params }).then((r) => r.data),

  getOne: (idOrName: number | string) =>
    api.get<SupportModel>(`/support/${idOrName}`).then((r) => r.data),

  create: (dto: CreateSupportDto) => api.post<SupportModel>('/support', dto).then((r) => r.data),

  update: (id: number, dto: UpdateSupportDto) =>
    api.patch<SupportModel>(`/support/${id}`, dto).then((r) => r.data),

  remove: (id: number) => api.delete(`/support/${id}`).then((r) => r.data),
};
