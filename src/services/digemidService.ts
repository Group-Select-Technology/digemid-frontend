import api from './api';
import type {
  DigemidProduct,
  DigemidProductDetail,
  DigemidPaginatedResponse,
  UpdateDigemidDto,
  PaginationParams,
} from '../types';

export const digemidService = {
  getAll: (params?: PaginationParams) =>
    api.get<DigemidPaginatedResponse>('/digemid', { params }).then((r) => r.data),

  getOne: (term: string | number) =>
    api.get<DigemidProductDetail>(`/digemid/${term}`).then((r) => r.data),

  update: (id: number, dto: UpdateDigemidDto) =>
    api.patch<DigemidProduct>(`/digemid/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/digemid/${id}`).then((r) => r.data),

  uploadExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ total: number; message: string }>('/digemid/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
