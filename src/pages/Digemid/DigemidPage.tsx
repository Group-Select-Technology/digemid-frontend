import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { digemidService } from '../../services/digemidService';
import type { DigemidProduct, UpdateDigemidDto } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/crud/ConfirmModal';
import { EyeIcon, PencilIcon, TrashBinIcon } from '../../icons';

const PAGE_SIZE = 20;

export default function DigemidPage() {
  const [products, setProducts] = useState<DigemidProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DigemidProduct[] | null>(null);
  const [searching, setSearching] = useState(false);

  const displayData = searchResults ?? products;

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<DigemidProduct | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigemidProduct | null>(null);
  const [editForm, setEditForm] = useState<UpdateDigemidDto>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<DigemidProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // ── Search ──────────────────────────────────────────────────────────────────
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
      const result = await digemidService.getOne(term);
      setSearchResults([result]);
    } catch {
      setSearchResults([]);
      setError('No se encontró ningún producto con ese código o ID.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
    setError(null);
  };

  // ── Detail ───────────────────────────────────────────────────────────────────
  const openDetail = (product: DigemidProduct) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const openEdit = (product: DigemidProduct) => {
    setEditingProduct(product);
    setEditForm({
      codigoProducto: product.codigoProducto,
      nombreProducto: product.nombreProducto,
      concentracion: product.concentracion,
      formaFarmaceutica: product.formaFarmaceutica,
      presentacion: product.presentacion,
      fraccion: product.fraccion,
      numeroRegistroSanitario: product.numeroRegistroSanitario,
      nombreTitular: product.nombreTitular,
      nombreFabricante: product.nombreFabricante,
      nombreIFA: product.nombreIFA,
      nombreRubro: product.nombreRubro,
      situacion: product.situacion,
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      await digemidService.update(editingProduct.id, editForm);
      toast.success('Producto actualizado correctamente.');
      setEditOpen(false);
      clearSearch();
      fetchProducts(page);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar los cambios.';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const openDelete = (product: DigemidProduct) => {
    setTargetProduct(product);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!targetProduct) return;
    setDeleting(true);
    try {
      await digemidService.remove(targetProduct.id);
      toast.success('Producto eliminado correctamente.');
      setDeleteOpen(false);
      clearSearch();
      fetchProducts(page);
    } catch {
      toast.error('Error al eliminar el producto.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Dropzone ──────────────────────────────────────────────────────────────────
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

  // ── Columns ───────────────────────────────────────────────────────────────────
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
      render: (p) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openDetail(p)}
            title="Ver detalle"
            className="p-1.5 text-gray-500 hover:text-brand-500 transition rounded"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(p)}
            title="Editar"
            className="p-1.5 text-gray-500 hover:text-brand-500 transition rounded"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDelete(p)}
            title="Eliminar"
            className="p-1.5 text-gray-500 hover:text-red-500 transition rounded"
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <>
      <PageMeta title="DIGEMID" description="Catálogo de productos DIGEMID" />
      <PageBreadCrumb pageTitle="DIGEMID" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Table header */}
        <div className="flex flex-col gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Catálogo de Productos
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Página {page + 1} · {PAGE_SIZE} registros por página
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value.trim()) clearSearch();
                  }}
                  placeholder="Buscar por código o ID..."
                  className="w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-3 pr-8 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              <Button size="sm" disabled={searching || !searchTerm.trim()}>
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>
            <Button size="sm" onClick={openUploadModal}>
              Subir Excel
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={displayData}
          loading={loading || searching}
          error={error}
          emptyMessage={
            searchResults !== null
              ? 'No se encontró ningún producto con ese código o ID.'
              : 'No hay productos registrados. Sube un archivo Excel para comenzar.'
          }
          keyExtractor={(p) => p.id}
        />

        {/* Pagination — only shown when not in search mode */}
        {!loading && !error && searchResults === null && (
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

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        className="max-w-2xl w-full mx-4 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          Detalle del Producto
        </h4>
        {detailProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {(
              [
                ['ID', String(detailProduct.id)],
                ['Código de Producto', detailProduct.codigoProducto],
                ['Nombre del Producto', detailProduct.nombreProducto],
                ['Concentración', detailProduct.concentracion],
                ['Forma Farmacéutica', detailProduct.formaFarmaceutica],
                ['Presentación', detailProduct.presentacion],
                ['Fracción', detailProduct.fraccion],
                ['N° Registro Sanitario', detailProduct.numeroRegistroSanitario],
                ['Titular', detailProduct.nombreTitular],
                ['Fabricante', detailProduct.nombreFabricante],
                ['Nombre IFA', detailProduct.nombreIFA],
                ['Rubro', detailProduct.nombreRubro],
                ['Situación', detailProduct.situacion],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className="text-sm text-gray-800 dark:text-white/90 break-words">
                  {value || '—'}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={editOpen}
        onClose={() => { if (!saving) { setEditOpen(false); setEditError(null); } }}
        className="max-w-2xl w-full mx-4 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          Editar Producto
        </h4>
        {editError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {editError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Código de Producto</label>
            <input
              type="text"
              value={editForm.codigoProducto ?? ''}
              onChange={(e) => setEditForm({ ...editForm, codigoProducto: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nombre del Producto</label>
            <input
              type="text"
              value={editForm.nombreProducto ?? ''}
              onChange={(e) => setEditForm({ ...editForm, nombreProducto: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Concentración</label>
            <input
              type="text"
              value={editForm.concentracion ?? ''}
              onChange={(e) => setEditForm({ ...editForm, concentracion: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Forma Farmacéutica</label>
            <input
              type="text"
              value={editForm.formaFarmaceutica ?? ''}
              onChange={(e) => setEditForm({ ...editForm, formaFarmaceutica: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Presentación</label>
            <input
              type="text"
              value={editForm.presentacion ?? ''}
              onChange={(e) => setEditForm({ ...editForm, presentacion: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fracción</label>
            <input
              type="text"
              value={editForm.fraccion ?? ''}
              onChange={(e) => setEditForm({ ...editForm, fraccion: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>N° Registro Sanitario</label>
            <input
              type="text"
              value={editForm.numeroRegistroSanitario ?? ''}
              onChange={(e) => setEditForm({ ...editForm, numeroRegistroSanitario: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Titular</label>
            <input
              type="text"
              value={editForm.nombreTitular ?? ''}
              onChange={(e) => setEditForm({ ...editForm, nombreTitular: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fabricante</label>
            <input
              type="text"
              value={editForm.nombreFabricante ?? ''}
              onChange={(e) => setEditForm({ ...editForm, nombreFabricante: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nombre IFA</label>
            <input
              type="text"
              value={editForm.nombreIFA ?? ''}
              onChange={(e) => setEditForm({ ...editForm, nombreIFA: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Rubro</label>
            <input
              type="text"
              value={editForm.nombreRubro ?? ''}
              onChange={(e) => setEditForm({ ...editForm, nombreRubro: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Situación</label>
            <input
              type="text"
              value={editForm.situacion ?? ''}
              onChange={(e) => setEditForm({ ...editForm, situacion: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => { setEditOpen(false); setEditError(null); }} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${targetProduct?.nombreProducto}" (${targetProduct?.codigoProducto})? Esta acción no se puede deshacer.`}
      />

      {/* ── Upload Excel Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadOpen}
        onClose={closeUploadModal}
        className="max-w-lg w-full mx-4 p-6"
      >
        {/* Processing overlay */}
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
            {isDragActive ? (
              <p className="text-sm text-brand-500 font-medium">Suelta el archivo aquí...</p>
            ) : uploadFile ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Arrastra un archivo aquí o{' '}
                  <span className="text-brand-500">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400">Formatos: .xlsx, .xls · Máx. 15 MB</p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="outline" onClick={closeUploadModal} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </div>
      </Modal>
    </>
  );
}