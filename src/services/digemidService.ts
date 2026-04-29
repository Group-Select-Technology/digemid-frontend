import api from './api';
import type { DigemidProduct, PaginationParams } from '../types';

export const digemidService = {
  getAll: (params?: PaginationParams) =>
    api.get<DigemidProduct[]>('/digemid', { params }).then((r) => r.data),

  // Not yet functional — placeholder for future endpoint
  getOne: (id: number) =>
    api.get<DigemidProduct>(`/digemid/${id}`).then((r) => r.data),

  // Not yet functional — placeholder for future endpoint
  update: (id: number, dto: Partial<DigemidProduct>) =>
    api.patch<DigemidProduct>(`/digemid/${id}`, dto).then((r) => r.data),

  // Not yet functional — placeholder for future endpoint
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
