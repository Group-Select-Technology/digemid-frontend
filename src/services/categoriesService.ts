import api from './api';
import type {
  CategoriesPaginatedResponse,
  Category,
  CategoryPaginationParams,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types';

/**
 * La API espera `multipart/form-data` por la imagen opcional. Los campos vacíos se omiten
 * porque el backend valida longitudes mínimas sobre los opcionales que sí llegan.
 */
const buildFormData = (dto: CreateCategoryDto | UpdateCategoryDto): FormData => {
  const formData = new FormData();

  if (dto.name !== undefined) formData.append('name', dto.name.trim());

  const description = dto.description?.trim();
  if (description) formData.append('description', description);

  const slug = dto.slug?.trim();
  if (slug) formData.append('slug', slug);

  // Cadena vacía = categoría raíz (el backend la normaliza a null).
  if (dto.parentId !== undefined) {
    formData.append('parentId', dto.parentId === null ? '' : String(dto.parentId));
  }

  if ('isActive' in dto && dto.isActive !== undefined) {
    formData.append('isActive', dto.isActive ? 'true' : 'false');
  }

  if (dto.file) formData.append('file', dto.file);

  return formData;
};

export const categoriesService = {
  getAll: (params?: CategoryPaginationParams) =>
    api.get<CategoriesPaginatedResponse>('/categories', { params }).then((r) => r.data),

  getOne: (id: number) => api.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (dto: CreateCategoryDto) =>
    api
      .post<Category>('/categories', buildFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  update: (id: number, dto: UpdateCategoryDto) =>
    api
      .patch<Category>(`/categories/${id}`, buildFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/categories/${id}`).then((r) => r.data),
};
