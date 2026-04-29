import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { digemidService } from '../../services/digemidService';
import type { DigemidProduct } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';

const PAGE_SIZE = 20;

export default function DigemidPage() {
  const [products, setProducts] = useState<DigemidProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchProducts = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await digemidService.getAll({
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
      });
      setProducts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError('Error al cargar los datos DIGEMID.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const goToPage = (newPage: number) => {
    if (newPage < 0) return;
    if (newPage > page && !hasMore) return;
    setPage(newPage);
  };

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 15 * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === 'file-too-large') {
        setUploadError('El archivo supera el límite de 15 MB.');
      } else if (code === 'file-invalid-type') {
        setUploadError('Solo se permiten archivos .xlsx o .xls.');
      } else {
        setUploadError('Archivo no válido.');
      }
    },
  });

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await digemidService.uploadExcel(uploadFile);
      toast.success(`${result.message} — ${result.total} registros procesados.`);
      setUploadOpen(false);
      setUploadFile(null);
      setPage(0);
      fetchProducts(0);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al procesar el archivo.';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadError(null);
    setUploadOpen(true);
  };

  const closeUploadModal = () => {
    if (uploading) return;
    setUploadOpen(false);
    setUploadFile(null);
    setUploadError(null);
  };

  const columns: Column<DigemidProduct>[] = [
    {
      header: '#',
      className: 'w-14',
      sortValue: (p) => p.id,
      render: (p) => (
        <span className="text-sm text-gray-400 dark:text-gray-500">{p.id}</span>
      ),
    },
    {
      header: 'Código',
      sortValue: (p) => p.codigoProducto,
      render: (p) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
          {p.codigoProducto}
        </span>
      ),
    },
    {
      header: 'Producto',
      sortValue: (p) => p.nombreProducto,
      render: (p) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {p.nombreProducto}
        </span>
      ),
    },
    {
      header: 'Concentración',
      sortValue: (p) => p.concentracion,
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{p.concentracion}</span>
      ),
    },
    {
      header: 'Forma Farm.',
      sortValue: (p) => p.formaFarmaceutica,
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{p.formaFarmaceutica}</span>
      ),
    },
    {
      header: 'Reg. Sanitario',
      sortValue: (p) => p.numeroRegistroSanitario,
      render: (p) => (
        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
          {p.numeroRegistroSanitario}
        </span>
      ),
    },
    {
      header: 'Titular',
      sortValue: (p) => p.nombreTitular,
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{p.nombreTitular}</span>
      ),
    },
    {
      header: 'Situación',
      sortValue: (p) => p.situacion,
      render: (p) => {
        const isActive = p.situacion?.toUpperCase().includes('ACTIV');
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {p.situacion}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      render: () => (
        <div className="flex items-center gap-1">
          {/* Ver detalle — endpoint /digemid/:id no funcional aún */}
          <button
            disabled
            title="Ver detalle (próximamente)"
            className="p-1.5 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          {/* Editar — endpoint PATCH /digemid/:id no funcional aún */}
          <button
            disabled
            title="Editar (próximamente)"
            className="p-1.5 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {/* Eliminar — endpoint DELETE /digemid/:id no funcional aún */}
          <button
            disabled
            title="Eliminar (próximamente)"
            className="p-1.5 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="DIGEMID" description="Catálogo de productos DIGEMID" />
      <PageBreadCrumb pageTitle="DIGEMID" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.05]">
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Catálogo de Productos
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Página {page + 1} · {PAGE_SIZE} registros por página
            </p>
          </div>
          <Button size="sm" onClick={openUploadModal}>
            Subir Excel
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          error={error}
          emptyMessage="No hay productos registrados. Sube un archivo Excel para comenzar."
          keyExtractor={(p) => p.id}
        />

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {products.length} registros en esta página
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(page - 1)}
                disabled={page === 0}
              >
                ← Anterior
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {page + 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={!hasMore}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Excel Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={closeUploadModal}
        className="max-w-lg w-full mx-4 p-6"
      >
        {/* Processing overlay — blocks all interaction until upload finishes */}
        {uploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <svg
              className="animate-spin h-10 w-10 text-brand-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Procesando archivo, por favor espere...
            </p>
          </div>
        )}
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Subir catálogo Excel
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Carga un archivo{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">.xlsx</span> o{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">.xls</span> de
          máximo <span className="font-medium text-gray-700 dark:text-gray-300">15 MB</span>.
          El proceso reemplazará todos los registros actuales.
        </p>

        {uploadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {uploadError}
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
              : 'border-gray-300 bg-gray-50 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <svg
                width="28"
                height="28"
                viewBox="0 0 29 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {uploadFile ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {uploadFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  o haz clic para seleccionar
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={closeUploadModal} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
            {uploading ? 'Procesando...' : 'Subir y procesar'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
