import api from './api';
import type { CreateSupportDto, SupportModel, SupportPaginatedResponse, SupportPaginationParams } from '../types';

/**
 * Modelos de soporte y sus drivers. Solo consume lo ya implementado en la API
 * (`create`, `findAll`, `findOne`, `remove`). El endpoint `update` es un stub sin
 * lógica en el backend y `/support/catalog` es exclusivo del catálogo público,
 * por lo que ninguno de los dos se usa aquí.
 */
export const supportService = {
  getAll: (params?: SupportPaginationParams) =>
    api.get<SupportPaginatedResponse>('/support', { params }).then((r) => r.data),

  getOne: (idOrName: number | string) =>
    api.get<SupportModel>(`/support/${idOrName}`).then((r) => r.data),

  create: (dto: CreateSupportDto) => api.post<SupportModel>('/support', dto).then((r) => r.data),

  remove: (id: number) => api.delete(`/support/${id}`).then((r) => r.data),
};
