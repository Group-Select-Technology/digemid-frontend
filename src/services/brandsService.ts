import api from './api';
import type {
  Brand,
  BrandsPaginatedResponse,
  CreateBrandDto,
  PaginationParams,
  UpdateBrandDto,
} from '../types';

export const brandsService = {
  getAll: (params?: PaginationParams) =>
    api.get<BrandsPaginatedResponse>('/brands', { params }).then((r) => r.data),

  getOne: (id: number) => api.get<Brand>(`/brands/${id}`).then((r) => r.data),

  create: (dto: CreateBrandDto) => api.post<Brand>('/brands', dto).then((r) => r.data),

  update: (id: number, dto: UpdateBrandDto) =>
    api.patch<Brand>(`/brands/${id}`, dto).then((r) => r.data),

  remove: (id: number) => api.delete(`/brands/${id}`).then((r) => r.data),
};
