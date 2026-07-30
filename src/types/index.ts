// ---- Auth ----
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  roleCode: RoleCode;
}

// ---- Roles ----
/** Roles del panel interno (DIGEMID, Select POS, Cobranzas, gestión de usuarios). */
export type CoreRoleCode = 'ADMIN' | 'SOPORTE' | 'DESARROLLO';
/** Roles de la tienda GSP: solo ven el catálogo (categorías, marcas y productos). */
export type GspRoleCode = 'ADMIN_GSP' | 'ASESOR_GSP' | 'SOPORTE_GSP';

export type RoleCode = CoreRoleCode | GspRoleCode;

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
  email: string;
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
  email?: string;
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

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---- Digemid ----
export interface DigemidProductUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface DigemidProduct {
  id: number;
  codigoProducto: string;
  nombreProducto: string;
  nombreConcatenado: string;
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
  patologia: string | null;
  categoria: string | null;
  indicaciones: string | null;
  createdAt: string;
  updatedAt: string;
  user?: DigemidProductUser;
}

export type DigemidProductDetail = Omit<DigemidProduct, 'user'>;

export type DigemidPaginationMeta = PaginationMeta;

export type DigemidPaginatedResponse = PaginatedResponse<DigemidProduct>;

export interface UpdateDigemidDto {
  codigoProducto?: string;
  nombreProducto?: string;
  nombreConcatenado?: string;
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

// ---- Assets ----
export type AssetFolder = 'cobranzas' | 'selectpos';
export type AssetStatus = 'ACTIVE' | 'INACTIVE';

export interface Asset {
  id: string;
  reference: string;
  filename: string;
  originalName: string;
  folder: string | null;
  mimeType: string;
  sizeBytes: number;
  sourceApp: string;
  cloudfrontUrl: string;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssetsPaginationParams extends PaginationParams {
  folder?: string;
}

export interface AssetsPaginatedResponse {
  data: Asset[];
  meta: DigemidPaginationMeta;
}

// ---- GSP · Categorías ----
/** Forma reducida con la que viajan `parent` y `children` dentro de una categoría. */
export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Presente cuando la consulta se hizo sin `sons=1`. */
  parent?: CategorySummary | null;
  /** Presente solo cuando la consulta se hizo con `sons=1`. */
  children?: CategorySummary[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
  parentId?: number | null;
  file?: File | null;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  isActive?: boolean;
}

export interface CategoryPaginationParams extends PaginationStatusParams {
  /** `1` = solo padres (incluye `children`), `0` = solo hojas, omitido = todas (incluye `parent`). */
  sons?: '0' | '1';
}

export type CategoriesPaginatedResponse = PaginatedResponse<Category>;

// ---- GSP · Marcas ----
export interface Brand {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
}

export type UpdateBrandDto = Partial<CreateBrandDto>;

export type BrandsPaginatedResponse = PaginatedResponse<Brand>;

// ---- GSP · Productos ----
export interface ProductImage {
  id: number;
  imagePath: string;
  order: number;
}

export interface ProductBrand {
  id: number;
  name: string;
  description: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
  /** Presente solo cuando la categoría del producto es una subcategoría (hija). */
  parent?: CategorySummary | null;
}

export interface ProductUser {
  id: number;
  email: string;
  fullName: string | null;
  role: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  stock: number;
  includes: string[];
  connections: string[] | null;
  specifications: string[];
  /** Los montos pueden llegar como string desde MySQL; normalizar con `toNumber`. */
  originalPrice: number | string;
  discountPercentage: number | string;
  discountCash: number | string;
  finalPrice: number | string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand: ProductBrand | null;
  category: ProductCategory | null;
  images: ProductImage[];
  /** Solo viene con `isAdminPage=1` o desde `GET /products/admin/:term`. */
  user?: ProductUser;
}

export interface CreateProductDto {
  name: string;
  description: string;
  slug?: string;
  stock?: number;
  includes: string[];
  connections?: string[];
  specifications: string[];
  originalPrice: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  brandId: number;
  categoryId: number;
  images: File[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  slug?: string;
  stock?: number;
  includes?: string[];
  connections?: string[];
  specifications?: string[];
  originalPrice?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  brandId?: number;
  categoryId?: number;
  isActive?: boolean;
  discountPercentage?: number;
  discountCash?: number;
  /** Si se envían, reemplazan por completo el set de imágenes anterior. */
  images?: File[];
  /** IDs de las imágenes existentes en el nuevo orden (la primera es la principal). No se debe enviar junto con `images`. */
  imagesOrder?: number[];
}

export interface ProductPaginationParams extends PaginationParams {
  isActive?: '0' | '1';
  inStock?: '0' | '1';
  isBestSeller?: '0' | '1';
  isFeatured?: '0' | '1';
  hasDiscount?: '0' | '1';
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  brandId?: number;
  search?: string;
  connection?: string;
  /** Solo acepta `'1'`: devuelve únicamente los productos eliminados. */
  withDeleted?: '1';
  /** Solo acepta `'1'`: incluye el usuario que registró cada producto. */
  isAdminPage?: '1';
}

export type ProductsPaginatedResponse = PaginatedResponse<Product>;
