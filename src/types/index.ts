// ---- Roles ----
export type RoleCode = 'ADMIN' | 'SOPORTE' | 'DESARROLLO';

export interface Role {
  id: number;
  code: RoleCode;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateRoleDto {
  code: RoleCode;
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

// ---- People ----
export type DocumentType = 'DNI' | 'PASSPORT' | 'RUC';

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  phone?: string;
  personalEmail?: string;
  photoUrl?: string;
}

export interface UpdatePersonDto {
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
}

// ---- Users ----
export interface User {
  id: number;
  corporateEmail: string;
  isActive: boolean;
  lastLogin: string | null;
  person: Person;
  role: {
    id: number;
    code: string;
    name: string;
  };
}

export interface CreateUserDto {
  corporateEmail: string;
  passwordHash: string;
  roleCode: RoleCode;
  person: {
    firstName: string;
    lastName: string;
    documentType: DocumentType;
    documentNumber: string;
  };
}

export interface UpdateUserDto {
  corporateEmail?: string;
  roleCode?: RoleCode;
}

// ---- Pagination ----
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationStatusParams extends PaginationParams {
  isActive?: '0' | '1';
}

// ---- Digemid ----
export interface DigemidProduct {
  id: number;
  codigoProducto: string;
  nombreProducto: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacion: string;
  fraccion: string;
  numeroRegistroSanitario: string;
  nombreTitular: string;
  nombreFabricante: string;
  nombreIFA: string;
  nombreRubro: string;
  situacion: string;
}

export interface UpdateDigemidDto {
  codigoProducto?: string;
  nombreProducto?: string;
  concentracion?: string;
  formaFarmaceutica?: string;
  presentacion?: string;
  fraccion?: string;
  numeroRegistroSanitario?: string;
  nombreTitular?: string;
  nombreFabricante?: string;
  nombreIFA?: string;
  nombreRubro?: string;
  situacion?: string;
}
