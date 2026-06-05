import type { AssetFolder } from '../../types';

export interface AssetsGalleryConfig {
  folder: AssetFolder;
  pageTitle: string;
  metaDescription: string;
  listTitle: string;
  emptyMessage: string;
  loadErrorMessage: string;
  showUpload: boolean;
  showDelete: boolean;
  showFolderColumn: boolean;
}

export const COBRANZAS_GALLERY_CONFIG: AssetsGalleryConfig = {
  folder: 'cobranzas',
  pageTitle: 'Cobranzas',
  metaDescription: 'Imágenes de vouchers de cobranzas',
  listTitle: 'Imágenes de Cobranzas',
  emptyMessage: 'No hay imágenes registradas en la carpeta de cobranzas.',
  loadErrorMessage: 'Error al cargar las imágenes de cobranzas.',
  showUpload: false,
  showDelete: false,
  showFolderColumn: true,
};

export const SELECT_POS_GALLERY_CONFIG: AssetsGalleryConfig = {
  folder: 'selectpos',
  pageTitle: 'Select Punto de Venta',
  metaDescription: 'Galería de imágenes de productos farmacéuticos y markets',
  listTitle: 'Galería de Productos',
  emptyMessage: 'No hay imágenes registradas en Select Punto de Venta.',
  loadErrorMessage: 'Error al cargar las imágenes de productos.',
  showUpload: true,
  showDelete: true,
  showFolderColumn: false,
};
