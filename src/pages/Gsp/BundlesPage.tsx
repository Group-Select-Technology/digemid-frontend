import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatCurrency, toNumber } from '../../utils/format';
import {
  BUNDLE_TYPE_LABELS,
  BUNDLE_TYPES,
  primaryImagePath,
  uniqueBundleBrands,
} from '../../utils/bundle';
import { bundlesService } from '../../services/bundlesService';
import type { Bundle, BundlePaginationParams, BundleType, PaginationMeta } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import CrudCard from '../../components/crud/CrudCard';
import Pagination from '../../components/crud/Pagination';
import ConfirmModal from '../../components/crud/ConfirmModal';
import RowActions from '../../components/crud/RowActions';
import { deleteAction, editAction, viewAction } from '../../components/crud/rowActionPresets';
import StatusBadge from '../../components/crud/StatusBadge';
import { Field, inputClass } from '../../components/crud/FormControls';
import Button from '../../components/ui/button/Button';
import { PlusIcon } from '../../icons';
import CanAccess from '../../components/auth/CanAccess';
import { useAuth } from '../../context/AuthContext';
import { GSP_WRITE_ROLES, canWriteGsp } from '../../constants/roles';
import BundleDetailModal from './BundleDetailModal';

const PAGE_SIZE = 10;

type TriState = '' | '0' | '1';

interface Filters {
  search: string;
  type: '' | BundleType;
  isActive: TriState;
  isFeatured: TriState;
  isBestSeller: TriState;
  hasDiscount: TriState;
  minPrice: string;
  maxPrice: string;
}

const emptyFilters: Filters = {
  search: '',
  type: '',
  isActive: '',
  isFeatured: '',
  isBestSeller: '',
  hasDiscount: '',
  minPrice: '',
  maxPrice: '',
};

function BundleThumb({ bundle }: { bundle: Bundle }) {
  if (bundle.imagePath) {
    return (
      <img
        src={bundle.imagePath}
        alt={bundle.title}
        className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
      {bundle.title.charAt(0).toUpperCase()}
    </div>
  );
}

export default function BundlesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = canWriteGsp(user?.roleCode);

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBundle, setDetailBundle] = useState<Bundle | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'delete' | 'toggle'>('delete');
  const [targetBundle, setTargetBundle] = useState<Bundle | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchBundles = useCallback(
    async (pageIndex: number, activeFilters: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const params: BundlePaginationParams = {
          limit: PAGE_SIZE,
          offset: (pageIndex - 1) * PAGE_SIZE,
          isAdminPage: '1',
        };

        if (activeFilters.search.trim()) params.search = activeFilters.search.trim();
        if (activeFilters.type) params.type = activeFilters.type;
        if (activeFilters.isActive) params.isActive = activeFilters.isActive;
        if (activeFilters.isFeatured) params.isFeatured = activeFilters.isFeatured;
        if (activeFilters.isBestSeller) params.isBestSeller = activeFilters.isBestSeller;
        if (activeFilters.hasDiscount) params.hasDiscount = activeFilters.hasDiscount;
        if (activeFilters.minPrice) params.minPrice = toNumber(activeFilters.minPrice);
        if (activeFilters.maxPrice) params.maxPrice = toNumber(activeFilters.maxPrice);

        const response = await bundlesService.getAll(params);
        setBundles(response.data);
        setMeta(response.meta);
      } catch (err) {
        setError(extractApiError(err) ?? 'Error al cargar los kits, packs y minipacks.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBundles(page, filters);
  }, [page, filters, fetchBundles]);

  const refresh = () => fetchBundles(page, filters);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilter('search', searchInput);
  };

  const clearFilters = () => {
    setPage(1);
    setSearchInput('');
    setFilters(emptyFilters);
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== ''),
    [filters]
  );

  const openCreate = () => navigate('/gsp/kits/nuevo');

  const openEdit = (bundle: Bundle) =>
    navigate(`/gsp/kits/${bundle.id}/editar`, { state: { bundle } });

  const openConfirm = (bundle: Bundle, type: 'delete' | 'toggle') => {
    setTargetBundle(bundle);
    setConfirmType(type);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!targetBundle) return;
    setConfirming(true);
    try {
      if (confirmType === 'delete') {
        await bundlesService.remove(targetBundle.id);
        toast.success('Registro eliminado correctamente.');
        setConfirmOpen(false);
        if (bundles.length === 1 && page > 1) {
          setPage(page - 1);
          return;
        }
      } else {
        await bundlesService.update(targetBundle.id, { isActive: !targetBundle.isActive });
        toast.success(
          `Registro ${targetBundle.isActive ? 'desactivado' : 'activado'} correctamente.`
        );
        setConfirmOpen(false);
      }
      refresh();
    } catch (err) {
      toast.error(extractApiError(err) ?? 'Error al realizar la acción.');
    } finally {
      setConfirming(false);
    }
  };

  const confirmTexts =
    confirmType === 'delete'
      ? {
          title: 'Eliminar kit / pack',
          message: `¿Estás seguro de que deseas eliminar "${targetBundle?.title}"? Pasará a la papelera.`,
        }
      : {
          title: targetBundle?.isActive ? 'Desactivar' : 'Activar',
          message: targetBundle?.isActive
            ? `¿Deseas desactivar "${targetBundle?.title}"? Dejará de mostrarse en la tienda.`
            : `¿Deseas activar "${targetBundle?.title}"?`,
        };

  const columns: Column<Bundle>[] = [
    {
      header: 'Combo',
      sortValue: (bundle) => bundle.title,
      render: (bundle) => {
        const relatedCovers = bundle.items
          .map((item) => primaryImagePath(item.product.images))
          .filter((path): path is string => Boolean(path))
          .slice(0, 4);

        return (
          <div className="flex items-center gap-3">
            <BundleThumb bundle={bundle} />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-white/90">{bundle.title}</p>
              <p className="truncate text-xs lowercase text-gray-400 dark:text-gray-500">
                /{bundle.slug}
              </p>
              {bundle.sku && (
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  SKU: {bundle.sku}
                </p>
              )}
              {relatedCovers.length > 0 && (
                <div className="mt-1 flex -space-x-1.5">
                  {relatedCovers.map((src, index) => (
                    <img
                      key={`${src}-${index}`}
                      src={src}
                      alt=""
                      className="h-5 w-5 rounded-full border border-white object-cover dark:border-gray-900"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Tipo',
      sortValue: (bundle) => bundle.type,
      render: (bundle) => (
        <StatusBadge tone="info">{BUNDLE_TYPE_LABELS[bundle.type] ?? bundle.type}</StatusBadge>
      ),
    },
    {
      header: 'Marcas',
      sortValue: (bundle) => uniqueBundleBrands(bundle.items).join(', '),
      render: (bundle) => {
        const brands = uniqueBundleBrands(bundle.items);
        if (!brands.length) return <span className="text-sm text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {brands.map((brand) => (
              <StatusBadge key={brand} tone="neutral">
                {brand}
              </StatusBadge>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Productos',
      className: 'w-24',
      sortValue: (bundle) => bundle.items.length,
      render: (bundle) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {bundle.items.length}{' '}
          <span className="text-xs text-gray-400">
            · {bundle.items.reduce((sum, item) => sum + item.quantity, 0)} uds
          </span>
        </span>
      ),
    },
    {
      header: 'Precio',
      className: 'normal-case',
      sortValue: (bundle) => toNumber(bundle.finalPrice),
      render: (bundle) => {
        const hasDiscount =
          toNumber(bundle.discountPercentage) > 0 || toNumber(bundle.discountCash) > 0;
        return (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {formatCurrency(bundle.finalPrice)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(bundle.originalPrice)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Estado',
      render: (bundle) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge
            tone={bundle.isActive ? 'success' : 'danger'}
            onClick={canWrite ? () => openConfirm(bundle, 'toggle') : undefined}
            title={canWrite ? 'Cambiar estado' : undefined}
          >
            {bundle.isActive ? 'Activo' : 'Inactivo'}
          </StatusBadge>
          {bundle.isFeatured && <StatusBadge tone="warning">Destacado</StatusBadge>}
          {bundle.isBestSeller && <StatusBadge tone="warning">Top ventas</StatusBadge>}
        </div>
      ),
    },
    {
      header: 'Acciones',
      render: (bundle) => (
        <RowActions
          actions={[
            viewAction(() => {
              setDetailBundle(bundle);
              setDetailOpen(true);
            }),
            ...(canWrite
              ? [
                  editAction(() => openEdit(bundle)),
                  deleteAction(() => openConfirm(bundle, 'delete')),
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Kits y packs | GSP"
        description="Gestión de kits, packs y minipacks del catálogo GSP"
      />
      <PageBreadCrumb pageTitle="Kits, packs y minipacks" />

      <CrudCard
        title="Kits, packs y minipacks"
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} registros · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Agrupaciones de productos publicadas en la tienda GSP'
        }
        actions={
          <>
            <form onSubmit={submitSearch} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!e.target.value.trim() && filters.search) updateFilter('search', '');
                  }}
                  placeholder="Buscar por título, slug o SKU..."
                  className={`${inputClass} w-72 pr-8`}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      updateFilter('search', '');
                    }}
                    title="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" variant="outline">
                Buscar
              </Button>
            </form>
            <CanAccess roles={GSP_WRITE_ROLES}>
              <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
                Nuevo combo
              </Button>
            </CanAccess>
          </>
        }
        filters={
          <>
            <Field label="Tipo" className="w-40">
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value as Filters['type'])}
                className={inputClass}
              >
                <option value="">Todos</option>
                {BUNDLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {BUNDLE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado" className="w-36">
              <select
                value={filters.isActive}
                onChange={(e) => updateFilter('isActive', e.target.value as TriState)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </Field>
            <Field label="Destacado" className="w-36">
              <select
                value={filters.isFeatured}
                onChange={(e) => updateFilter('isFeatured', e.target.value as TriState)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Más vendido" className="w-36">
              <select
                value={filters.isBestSeller}
                onChange={(e) => updateFilter('isBestSeller', e.target.value as TriState)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Descuento" className="w-36">
              <select
                value={filters.hasDiscount}
                onChange={(e) => updateFilter('hasDiscount', e.target.value as TriState)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Con descuento</option>
                <option value="0">Sin descuento</option>
              </select>
            </Field>
            <Field label="Precio mín." className="w-28">
              <input
                type="number"
                min={0}
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Precio máx." className="w-28">
              <input
                type="number"
                min={0}
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className={inputClass}
              />
            </Field>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={bundles}
          loading={loading}
          error={error}
          emptyMessage="No hay registros que coincidan con los filtros."
          keyExtractor={(bundle) => bundle.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="registros" />
        )}
      </CrudCard>

      <BundleDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        bundle={detailBundle}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={confirming}
        title={confirmTexts.title}
        message={confirmTexts.message}
      />
    </>
  );
}
