/** Los campos `decimal` de MySQL pueden llegar como string; esto los normaliza a número. */
export const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (value: number | string | null | undefined): string =>
  toNumber(value).toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  });

export const formatDate = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString('es-PE') : '—';

/** Réplica del slug que genera la API, para mostrar una vista previa antes de guardar. */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
