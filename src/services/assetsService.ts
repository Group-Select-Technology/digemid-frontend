import api from './api';
import type { Asset, AssetsPaginatedResponse, AssetsPaginationParams } from '../types';

export const assetsService = {
  getAll: (params?: AssetsPaginationParams) =>
    api.get<AssetsPaginatedResponse>('/assets', { params }).then((r) => r.data),

  getOne: (term: string) =>
    api.get<Asset>(`/assets/${term}`).then((r) => r.data),
};
