import type { BundleItem, BundleProductImage, BundleType } from '../types';

export const BUNDLE_TYPE_LABELS: Record<BundleType, string> = {
  KIT: 'Kit',
  PACKS: 'Pack',
  MINIPACKS: 'Minipack',
  SUPERPACKS: 'Superpack',
  COMBOS: 'Combo',
};

export const BUNDLE_TYPE_HINTS: Record<BundleType, string> = {
  KIT: '4 o más productos distintos',
  PACKS: '3 productos distintos',
  MINIPACKS: '2 productos distintos',
  SUPERPACKS: 'Agrupación amplia de productos',
  COMBOS: 'Combinación de productos',
};

export const BUNDLE_TYPES: BundleType[] = ['KIT', 'PACKS', 'MINIPACKS', 'SUPERPACKS', 'COMBOS'];

/** Imagen principal del producto: `order === 0`. Si no hay, usa la de menor order. */
export function primaryImagePath(images?: BundleProductImage[]): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => a.order - b.order);
  return (sorted.find((image) => image.order === 0) ?? sorted[0]).imagePath;
}

/** Marcas de los productos del bundle, sin repetir. */
export function uniqueBundleBrands(items?: BundleItem[]): string[] {
  const names = (items ?? [])
    .map((item) => item.product?.brand?.trim())
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

/** Normaliza una conexión a mayúsculas para comparar y mostrar (usb === USB). */
export function normalizeConnection(value: string): string {
  return value.trim().toUpperCase();
}

/** Conexiones de los productos del bundle, en mayúsculas y sin repetir. */
export function uniqueBundleConnections(items?: BundleItem[]): string[] {
  const values = (items ?? [])
    .flatMap((item) => item.product?.connections ?? [])
    .map(normalizeConnection)
    .filter(Boolean);
  return [...new Set(values)];
}

export function typeCountHint(type: BundleType, count: number): string | null {
  if (type === 'MINIPACKS' && count !== 2) return 'Un minipack suele incluir exactamente 2 productos.';
  if (type === 'PACKS' && count !== 3) return 'Un pack suele incluir exactamente 3 productos.';
  if (type === 'KIT' && count < 4) return 'Un kit suele incluir 4 o más productos.';
  return null;
}
