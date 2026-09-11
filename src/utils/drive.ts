const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com']);

export const extractGoogleDriveFileId = (raw: string | null | undefined): string | null => {
  if (!raw) return null;

  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (!DRIVE_HOSTS.has(host)) return null;

    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1]) return fileMatch[1];

    return url.searchParams.get('id');
  } catch {
    return null;
  }
};

/**
 * Convierte un enlace de vista de Google Drive
 * (`/file/d/ID/view?usp=sharing`) en descarga directa
 * (`/uc?export=download&id=ID`). Cualquier otra URL se deja igual.
 */
export const toDirectDownloadUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const id = extractGoogleDriveFileId(trimmed);
  if (!id) return trimmed;

  return `https://drive.google.com/uc?export=download&id=${id}`;
};
