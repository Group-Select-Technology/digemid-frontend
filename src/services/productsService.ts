import api from './api';
import type {
  CreateProductDto,
  Product,
  ProductPaginationParams,
  ProductsPaginatedResponse,
  UpdateProductDto,
} from '../types';

/**
 * `POST /products` y `PATCH /products/:id` son `multipart/form-data`: los arreglos viajan
 * serializados como JSON y las banderas booleanas solo se envían cuando son `true` (la API
 * interpreta cualquier string como verdadero, y el valor por defecto ya es `false`).
 */
const appendCommonFields = (formData: FormData, dto: CreateProductDto | UpdateProductDto): void => {
  if (dto.name !== undefined) formData.append('name', dto.name.trim());
  if (dto.description !== undefined) formData.append('description', dto.description.trim());

  const slug = dto.slug?.trim();
  if (slug) formData.append('slug', slug);

  if (dto.model !== undefined) formData.append('model', dto.model.trim());

  // Igual que el slug: si el frontend genera y envía un sku, la API lo respeta; si no llega, lo genera ella misma.
  const sku = dto.sku?.trim();
  if (sku) formData.append('sku', sku);

  const warranty = dto.warranty?.trim();
  if (warranty) formData.append('warranty', warranty);

  const datasheetUrl = dto.datasheetUrl?.trim();
  if (datasheetUrl) formData.append('datasheetUrl', datasheetUrl);

  if (dto.stock !== undefined) formData.append('stock', String(dto.stock));
  if (dto.originalPrice !== undefined) formData.append('originalPrice', String(dto.originalPrice));
  if (dto.brandId !== undefined) formData.append('brandId', String(dto.brandId));
  if (dto.categoryId !== undefined) formData.append('categoryId', String(dto.categoryId));

  if (dto.includes) formData.append('includes', JSON.stringify(dto.includes));
  if (dto.specifications) formData.append('specifications', JSON.stringify(dto.specifications));
  if (dto.connections?.length) formData.append('connections', JSON.stringify(dto.connections));
};

const buildCreateFormData = (dto: CreateProductDto): FormData => {
  const formData = new FormData();
  appendCommonFields(formData, dto);

  // Al crear no hace falta desmarcar nada: solo se envía cuando es true (el default ya es false).
  if (dto.isFeatured) formData.append('isFeatured', 'true');
  if (dto.isBestSeller) formData.append('isBestSeller', 'true');

  // El orden de las imágenes define el campo `order` (la primera es la principal).
  dto.images.forEach((image) => formData.append('images', image));

  return formData;
};

const buildUpdateFormData = (dto: UpdateProductDto): FormData => {
  const formData = new FormData();
  appendCommonFields(formData, dto);

  // Al actualizar sí hace falta poder desmarcar: se envía siempre el valor explícito true/false.
  if (dto.isActive !== undefined) formData.append('isActive', dto.isActive ? 'true' : 'false');
  if (dto.isFeatured !== undefined) formData.append('isFeatured', dto.isFeatured ? 'true' : 'false');
  if (dto.isBestSeller !== undefined)
    formData.append('isBestSeller', dto.isBestSeller ? 'true' : 'false');
  if (dto.discountPercentage !== undefined)
    formData.append('discountPercentage', String(dto.discountPercentage));
  if (dto.discountCash !== undefined) formData.append('discountCash', String(dto.discountCash));

  // Si se envían imágenes nuevas, la API reemplaza por completo el set anterior.
  dto.images?.forEach((image) => formData.append('images', image));

  // Solo se aplica cuando NO se envían imágenes nuevas: reordena las existentes sin re-subirlas.
  if (!dto.images?.length && dto.imagesOrder?.length)
    formData.append('imagesOrder', JSON.stringify(dto.imagesOrder));

  return formData;
};

export const productsService = {
  getAll: (params?: ProductPaginationParams) =>
    api.get<ProductsPaginatedResponse>('/products', { params }).then((r) => r.data),

  /** Detalle público (sin el usuario que lo registró). Acepta UUID o slug. */
  getOnePublic: (term: string) => api.get<Product>(`/products/${term}`).then((r) => r.data),

  /** Detalle administrativo: incluye el usuario. Requiere estar autenticado. */
  getOne: (term: string) => api.get<Product>(`/products/admin/${term}`).then((r) => r.data),

  create: (dto: CreateProductDto) =>
    api
      .post<Product>('/products', buildCreateFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  update: (id: string, dto: UpdateProductDto) =>
    api
      .patch<Product>(`/products/${id}`, buildUpdateFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};
