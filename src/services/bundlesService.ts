import api from './api';
import type {
  Bundle,
  BundlePaginationParams,
  BundlesPaginatedResponse,
  CreateBundleDto,
  UpdateBundleDto,
} from '../types';

/**
 * `POST /bundles` y `PATCH /bundles/:id` son `multipart/form-data`: `items` viaja
 * serializado como JSON y las banderas booleanas siguen la misma convención que productos
 * (en el alta solo se envían cuando son `true`; en la edición siempre el valor explícito).
 */
const appendCommonFields = (formData: FormData, dto: CreateBundleDto | UpdateBundleDto): void => {
  if (dto.title !== undefined) formData.append('title', dto.title.trim());
  if (dto.description !== undefined) formData.append('description', dto.description.trim());

  const slug = dto.slug?.trim();
  if (slug) formData.append('slug', slug);

  const sku = dto.sku?.trim();
  if (sku) formData.append('sku', sku);

  if (dto.type !== undefined) formData.append('type', dto.type);
  if (dto.originalPrice !== undefined) formData.append('originalPrice', String(dto.originalPrice));
  if (dto.items) formData.append('items', JSON.stringify(dto.items));
};

const buildCreateFormData = (dto: CreateBundleDto): FormData => {
  const formData = new FormData();
  appendCommonFields(formData, dto);

  if (dto.isFeatured) formData.append('isFeatured', 'true');
  if (dto.isBestSeller) formData.append('isBestSeller', 'true');
  formData.append('image', dto.image);

  return formData;
};

const buildUpdateFormData = (dto: UpdateBundleDto): FormData => {
  const formData = new FormData();
  appendCommonFields(formData, dto);

  if (dto.isActive !== undefined) formData.append('isActive', dto.isActive ? 'true' : 'false');
  if (dto.isFeatured !== undefined) formData.append('isFeatured', dto.isFeatured ? 'true' : 'false');
  if (dto.isBestSeller !== undefined)
    formData.append('isBestSeller', dto.isBestSeller ? 'true' : 'false');
  if (dto.discountPercentage !== undefined)
    formData.append('discountPercentage', String(dto.discountPercentage));
  if (dto.discountCash !== undefined) formData.append('discountCash', String(dto.discountCash));
  if (dto.image) formData.append('image', dto.image);

  return formData;
};

export const bundlesService = {
  getAll: (params?: BundlePaginationParams) =>
    api.get<BundlesPaginatedResponse>('/bundles', { params }).then((r) => r.data),

  /** Detalle administrativo: incluye el usuario. Requiere estar autenticado. */
  getOne: (id: string) => api.get<Bundle>(`/bundles/admin/${id}`).then((r) => r.data),

  create: (dto: CreateBundleDto) =>
    api
      .post<Bundle>('/bundles', buildCreateFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  update: (id: string, dto: UpdateBundleDto) =>
    api
      .patch<Bundle>(`/bundles/${id}`, buildUpdateFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  remove: (id: string) => api.delete(`/bundles/${id}`).then((r) => r.data),
};
