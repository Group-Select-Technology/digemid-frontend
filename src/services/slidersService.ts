import api from './api';
import type {
  CreateSliderDto,
  Slider,
  SliderPaginationParams,
  SlidersPaginatedResponse,
  UpdateSliderDto,
} from '../types';

/**
 * `POST /sliders` y `PATCH /sliders/:id` son `multipart/form-data`: las imágenes de pc
 * (`desktopImage`) y celular (`mobileImage`) siempre viajan juntas, nunca una sola.
 */
const buildFormData = (dto: CreateSliderDto | UpdateSliderDto): FormData => {
  const formData = new FormData();

  const title = dto.title?.trim();
  if (title) formData.append('title', title);

  const redirectUrl = dto.redirectUrl?.trim();
  if (redirectUrl) formData.append('redirectUrl', redirectUrl);

  if (dto.orderIndex !== undefined) formData.append('orderIndex', String(dto.orderIndex));

  if ('isActive' in dto && dto.isActive !== undefined) {
    formData.append('isActive', dto.isActive ? 'true' : 'false');
  }

  if (dto.desktopImage) formData.append('desktopImage', dto.desktopImage);
  if (dto.mobileImage) formData.append('mobileImage', dto.mobileImage);

  return formData;
};

export const slidersService = {
  /** Listado administrativo (paginado, incluye inactivos según filtro). */
  getAll: (params?: SliderPaginationParams) =>
    api.get<SlidersPaginatedResponse>('/sliders/admin', { params }).then((r) => r.data),

  getOne: (id: number) => api.get<Slider>(`/sliders/${id}`).then((r) => r.data),

  create: (dto: CreateSliderDto) =>
    api
      .post<Slider>('/sliders', buildFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  update: (id: number, dto: UpdateSliderDto) =>
    api
      .patch<Slider>(`/sliders/${id}`, buildFormData(dto), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/sliders/${id}`).then((r) => r.data),
};
