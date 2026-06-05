import api from './api';
import type { Asset, AssetFolder, AssetsPaginatedResponse, AssetsPaginationParams } from '../types';

export const assetsService = {
  getAll: (params?: AssetsPaginationParams) =>
    api.get<AssetsPaginatedResponse>('/assets', { params }).then((r) => r.data),

  getOne: (term: string, folder: AssetFolder) =>
    api.get<Asset>(`/assets/${term}`, { params: { folder } }).then((r) => r.data),

  uploadSelectPos: (file: File, filename: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    return api
      .post<Asset>('/assets/select-pos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  removeSelectPos: (id: string) =>
    api.delete(`/assets/select-pos/${id}`).then((r) => r.data),
};
