import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { assetsService } from '../../services/assetsService';
import type { Asset, DigemidPaginationMeta } from '../../types';
import { extractApiError } from '../../utils/apiError';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { EyeIcon } from '../../icons';
import type { AssetsGalleryConfig } from './assetsGalleryConfig';

const PAGE_SIZE = 10;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const displayFolder = (folder: string | null) => folder ?? '—';

interface AssetsGalleryPageProps {
  config: AssetsGalleryConfig;
}

export default function AssetsGalleryPage({ config }: AssetsGalleryPageProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<DigemidPaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const displayData = searchResults ?? assets;

  const fetchAssets = useCallback(
    async (pageIndex: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await assetsService.getAll({
          limit: PAGE_SIZE,
          offset: (pageIndex - 1) * PAGE_SIZE,
          folder: config.folder,
        });
        setAssets(response.data);
        setMeta(response.meta);
      } catch {
        setError(config.loadErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    [config.folder, config.loadErrorMessage],
  );

  useEffect(() => {
    fetchAssets(page);
  }, [page, fetchAssets]);

  useEffect(() => {
    if (!uploadFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

  const goToPage = (newPage: number) => {
    if (!meta) return;
    if (newPage < 1 || newPage > meta.totalPages) return;
    setPage(newPage);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const result = await assetsService.getOne(term, config.folder);
      setSearchResults([result]);
    } catch {
      setSearchResults([]);
      setError('No se encontró ninguna imagen con esa referencia.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
    setError(null);
  };

  const openDetail = async (asset: Asset) => {
    setDetailOpen(true);
    setDetailAsset(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const result = await assetsService.getOne(asset.reference, config.folder);
      setDetailAsset(result);
    } catch {
      setDetailError('No se pudo cargar el detalle de la imagen.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailAsset(null);
    setDetailError(null);
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadFilename('');
    setUploadError(null);
    setUploadOpen(true);
  };

  const closeUploadModal = () => {
    if (uploading) return;
    setUploadOpen(false);
    setUploadFile(null);
    setUploadFilename('');
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten archivos de imagen.');
      return;
    }
    setUploadFile(file);
    setUploadError(null);
    if (!uploadFilename.trim()) {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setUploadFilename(baseName);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadFilename.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      await assetsService.uploadSelectPos(uploadFile, uploadFilename.trim());
      toast.success('Imagen subida correctamente.');
      closeUploadModal();
      setPage(1);
      clearSearch();
      fetchAssets(1);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al subir la imagen.';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const columns: Column<Asset>[] = [
    {
      header: 'Vista Previa',
      className: 'w-[90px]',
      render: (a) => (
        <a
          href={a.cloudfrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <img
            src={a.cloudfrontUrl}
            alt={a.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
      ),
    },
    {
      header: 'Archivo',
      className: config.showFolderColumn ? 'w-[28%]' : 'w-[36%]',
      sortValue: (a) => a.filename,
      render: (a) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{a.filename}</span>
      ),
    },
    ...(config.showFolderColumn
      ? [
          {
            header: 'Carpeta',
            className: 'w-[14%]',
            sortValue: (a: Asset) => a.folder ?? '',
            render: (a: Asset) => (
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {displayFolder(a.folder)}
              </span>
            ),
          } as Column<Asset>,
        ]
      : []),
    {
      header: 'Tamaño',
      className: 'w-[10%]',
      sortValue: (a) => a.sizeBytes,
      render: (a) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {formatBytes(a.sizeBytes)}
        </span>
      ),
    },
    {
      header: 'Fecha de creación',
      className: 'w-[22%]',
      sortValue: (a) => new Date(a.createdAt).getTime(),
      render: (a) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {formatDate(a.createdAt)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'w-[72px] text-center',
      render: (a) => (
        <div className="flex justify-center">
          <button
            onClick={() => openDetail(a)}
            title="Ver detalle"
            className="p-1.5 text-gray-500 hover:text-brand-500 transition rounded"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const detailFields: [string, string, boolean?][] = detailAsset
    ? [
        ['Referencia', detailAsset.reference],
        ['Archivo', detailAsset.filename],
        ['Nombre original', detailAsset.originalName],
        ...(config.showFolderColumn
          ? [['Carpeta', displayFolder(detailAsset.folder)] as [string, string]]
          : []),
        ['Tipo MIME', detailAsset.mimeType],
        ['Tamaño', formatBytes(detailAsset.sizeBytes)],
        ['Aplicación origen', detailAsset.sourceApp],
        ['Estado', detailAsset.status],
        ['URL CloudFront', detailAsset.cloudfrontUrl, true],
        ['Fecha de creación', formatDate(detailAsset.createdAt)],
        ['Última actualización', formatDate(detailAsset.updatedAt)],
      ]
    : [];

  const isLoading = loading || searching;
  const emptyMessage =
    searchResults !== null
      ? 'No se encontró ninguna imagen con esa referencia.'
      : config.emptyMessage;

  const renderMobileCards = () => (
    <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.05]">
      {displayData.map((asset) => (
        <div key={asset.id} className="flex items-center gap-3 px-4 py-4">
          <a
            href={asset.cloudfrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <img
              src={asset.cloudfrontUrl}
              alt={asset.originalName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </a>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-gray-800 dark:text-white/90 truncate">
              {asset.filename}
            </p>
            {config.showFolderColumn && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
                {displayFolder(asset.folder)}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {formatBytes(asset.sizeBytes)} · {formatDate(asset.createdAt)}
            </p>
          </div>
          <button
            onClick={() => openDetail(asset)}
            title="Ver detalle"
            className="shrink-0 p-2 text-gray-500 hover:text-brand-500 transition rounded"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );

  const renderTableContent = () => {
    if (isLoading) {
      return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>;
    }

    if (error) {
      return <p className="p-6 text-sm text-red-500">{error}</p>;
    }

    if (displayData.length === 0) {
      return (
        <p className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
      );
    }

    return (
      <>
        {renderMobileCards()}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={displayData}
            loading={false}
            error={null}
            emptyMessage={emptyMessage}
            keyExtractor={(a) => a.id}
            tableClassName="table-fixed w-full"
          />
        </div>
      </>
    );
  };

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <>
      <PageMeta title={config.pageTitle} description={config.metaDescription} />
      <PageBreadCrumb pageTitle={config.pageTitle} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 px-4 py-5 border-b border-gray-100 dark:border-white/[0.05] sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {config.listTitle}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {searchResults !== null
                ? `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} de búsqueda`
                : meta
                  ? `${meta.totalItems.toLocaleString()} registros · página ${meta.currentPage} de ${meta.totalPages}`
                  : `${PAGE_SIZE} registros por página`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-52">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value.trim()) clearSearch();
                  }}
                  placeholder="Buscar por referencia..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-3 pr-8 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button size="sm" disabled={searching || !searchTerm.trim()} className="w-full sm:w-auto">
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>
            {config.showUpload && (
              <Button size="md" onClick={openUploadModal} className="w-full">
                Subir imagen
              </Button>
            )}
          </div>
        </div>

        {renderTableContent()}

        {!isLoading && !error && searchResults === null && meta && meta.totalPages > 0 && (
          <div className="flex flex-col gap-3 px-4 py-4 border-t border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-xs text-center text-gray-400 dark:text-gray-500 sm:text-left">
              {((meta.currentPage - 1) * meta.itemsPerPage + 1).toLocaleString()}
              {'–'}
              {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems).toLocaleString()}
              {' de '}
              {meta.totalItems.toLocaleString()} registros
            </span>
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => goToPage(1)} disabled={page === 1}>
                «
              </Button>
              <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                <span className="hidden sm:inline">← Anterior</span>
                <span className="sm:hidden">←</span>
              </Button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const half = 2;
                let start = Math.max(1, page - half);
                const end = Math.min(meta.totalPages, start + 4);
                start = Math.max(1, end - 4);
                return start + i;
              }).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition ${
                    p === page
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={page >= meta.totalPages}
              >
                <span className="hidden sm:inline">Siguiente →</span>
                <span className="sm:hidden">→</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(meta.totalPages)}
                disabled={page >= meta.totalPages}
              >
                »
              </Button>
            </div>
          </div>
        )}
      </div>

      {config.showUpload && (
        <Modal
          isOpen={uploadOpen}
          onClose={closeUploadModal}
          className="max-w-lg overflow-y-auto p-4 sm:p-6"
        >
          <h4 className="mb-5 pr-10 text-lg font-semibold text-gray-800 dark:text-white">
            Subir imagen de producto
          </h4>

          {uploadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {uploadError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Archivo de imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600 dark:text-gray-400 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
            </div>

            {previewUrl && (
              <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-h-48 w-auto object-contain rounded-lg"
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Nombre del archivo</label>
              <input
                type="text"
                value={uploadFilename}
                onChange={(e) => setUploadFilename(e.target.value)}
                placeholder="Ej: Clindamicina"
                disabled={uploading}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Se usará como nombre base del archivo (sin extensión).
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={closeUploadModal} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadFilename.trim()}
            >
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </div>
        </Modal>
      )}

      <Modal isOpen={detailOpen} onClose={closeDetail} className="max-w-4xl overflow-y-auto p-4 sm:p-6">
        <h4 className="mb-5 pr-10 text-lg font-semibold text-gray-800 dark:text-white">
          Detalle de la Imagen
        </h4>

        {detailLoading && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Cargando detalle...
          </p>
        )}

        {detailError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {detailError}
          </div>
        )}

        {!detailLoading && detailAsset && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="order-2 space-y-4 lg:order-1">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                {detailFields.map(([label, value, isLink]) => (
                  <div key={label} className={isLink ? 'sm:col-span-2' : undefined}>
                    <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {label}
                    </p>
                    {isLink ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-brand-500 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="break-words text-sm text-gray-800 dark:text-white/90">{value}</p>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  ID
                </p>
                <p className="break-all font-mono text-xs text-gray-500 dark:text-gray-400">
                  {detailAsset.id}
                </p>
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <a
                href={detailAsset.cloudfrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                <img
                  src={detailAsset.cloudfrontUrl}
                  alt={detailAsset.originalName}
                  className="h-auto w-full object-contain"
                />
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={closeDetail} className="w-full sm:w-auto">
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}
