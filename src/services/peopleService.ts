import api from './api';
import type { Person, UpdatePersonDto, PaginationParams } from '../types';

export const peopleService = {
  getAll: (params?: PaginationParams) =>
    api.get<Person[]>('/people', { params }).then((r) => r.data),

  getOne: (term: string) =>
    api.get<Person>(`/people/${term}`).then((r) => r.data),

  update: (id: number, dto: UpdatePersonDto) =>
    api.patch<Person>(`/people/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/people/${id}`).then((r) => r.data),
};
