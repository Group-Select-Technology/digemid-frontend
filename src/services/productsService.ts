import api from './api';
import type {
  CreateProductDto,
  Product,
  ProductPaginationParams,
  ProductsPaginatedResponse,
  UpdateProductDto,
} from '../types';

/**
 * `POST /products` es `multipart/form-data`: los arreglos viajan serializados como JSON y las
 * banderas booleanas solo se envían cuando son `true` (la API interpreta cualquier string como
 * verdadero, y el valor por defecto ya es `false`).
 */
const buildCreateFormData = (dto: CreateProductDto): FormData => {
  const formData = new FormData();

  formData.append('name', dto.name.trim());
  formData.append('description', dto.description.trim());

  const slug = dto.slug?.trim();
  if (slug) formData.append('slug', slug);

  formData.append('stock', String(dto.stock ?? 0));
  formData.append('originalPrice', String(dto.originalPrice));
  formData.append('brandId', String(dto.brandId));
  formData.append('categoryId', String(dto.categoryId));

  formData.append('includes', JSON.stringify(dto.includes));
  formData.append('specifications', JSON.stringify(dto.specifications));
  if (dto.connections?.length) {
    formData.append('connections', JSON.stringify(dto.connections));
  }

  if (dto.isFeatured) formData.append('isFeatured', 'true');
  if (dto.isBestSeller) formData.append('isBestSeller', 'true');

  // El orden de las imágenes define el campo `order` (la primera es la principal).
  dto.images.forEach((image) => formData.append('images', image));

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

  /**
   * Pendiente en la API: `ProductsService.update()` todavía es un stub, así que este método
   * queda listo para conectarse pero aún no persiste cambios.
   */
  update: (id: string, dto: UpdateProductDto) =>
    api.patch<Product>(`/products/${id}`, dto).then((r) => r.data),

  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};
