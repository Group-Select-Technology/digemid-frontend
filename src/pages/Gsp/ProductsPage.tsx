import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatCurrency, toNumber } from '../../utils/format';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import { categoriesService } from '../../services/categoriesService';
import type {
  Brand,
  Category,
  PaginationMeta,
  Product,
  ProductPaginationParams,
} from '../../types';
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
import ProductDetailModal from './ProductDetailModal';

const PAGE_SIZE = 10;
const OPTIONS_LIMIT = 100;

type TriState = '' | '0' | '1';

interface Filters {
  search: string;
  brandId: string;
  categoryId: string;
  isActive: TriState;
  inStock: TriState;
  isFeatured: TriState;
  isBestSeller: TriState;
  hasDiscount: TriState;
  minPrice: string;
  maxPrice: string;
}

const emptyFilters: Filters = {
  search: '',
  brandId: '',
  categoryId: '',
  isActive: '',
  inStock: '',
  isFeatured: '',
  isBestSeller: '',
  hasDiscount: '',
  minPrice: '',
  maxPrice: '',
};

function ProductThumb({ product }: { product: Product }) {
  const cover = [...(product.images ?? [])].sort((a, b) => a.order - b.order)[0];
  if (cover) {
    return (
      <img
        src={cover.imagePath}
        alt={product.name}
        className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
      {product.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = canWriteGsp(user?.roleCode);

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filtros aplicados vs. texto en edición del buscador
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(
    async (pageIndex: number, activeFilters: Filters, trash: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params: ProductPaginationParams = {
          limit: PAGE_SIZE,
          offset: (pageIndex - 1) * PAGE_SIZE,
          isAdminPage: '1',
        };

        if (activeFilters.search.trim()) params.search = activeFilters.search.trim();
        if (activeFilters.brandId) params.brandId = Number(activeFilters.brandId);
        if (activeFilters.categoryId) params.categoryId = Number(activeFilters.categoryId);
        if (activeFilters.isActive) params.isActive = activeFilters.isActive;
        if (activeFilters.inStock) params.inStock = activeFilters.inStock;
        if (activeFilters.isFeatured) params.isFeatured = activeFilters.isFeatured;
        if (activeFilters.isBestSeller) params.isBestSeller = activeFilters.isBestSeller;
        if (activeFilters.hasDiscount) params.hasDiscount = activeFilters.hasDiscount;
        if (activeFilters.minPrice) params.minPrice = toNumber(activeFilters.minPrice);
        if (activeFilters.maxPrice) params.maxPrice = toNumber(activeFilters.maxPrice);
        if (trash) params.withDeleted = '1';

        const response = await productsService.getAll(params);
        setProducts(response.data);
        setMeta(response.meta);
      } catch (err) {
        setError(extractApiError(err) ?? 'Error al cargar los productos.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchOptions = useCallback(async () => {
    const [brandsResult, categoriesResult] = await Promise.allSettled([
      brandsService.getAll({ limit: OPTIONS_LIMIT }),
      categoriesService.getAll({ limit: OPTIONS_LIMIT }),
    ]);
    if (brandsResult.status === 'fulfilled') setBrands(brandsResult.value.data);
    if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value.data);
  }, []);

  useEffect(() => {
    fetchProducts(page, filters, showTrash);
  }, [page, filters, showTrash, fetchProducts]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const refresh = () => fetchProducts(page, filters, showTrash);

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

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
    [brands]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.id),
        label: category.parent ? `${category.parent.name} › ${category.name}` : category.name,
      })),
    [categories]
  );

  const openCreate = () => navigate('/gsp/productos/nuevo');

  // Enviamos el producto en el state para que el formulario no tenga que volver a consultarlo.
  const openEdit = (product: Product) =>
    navigate(`/gsp/productos/${product.id}/editar`, { state: { product } });

  const handleDelete = async () => {
    if (!targetProduct) return;
    setDeleting(true);
    try {
      await productsService.remove(targetProduct.id);
      toast.success('Producto eliminado correctamente.');
      setDeleteOpen(false);
      if (products.length === 1 && page > 1) setPage(page - 1);
      else refresh();
    } catch (err) {
      toast.error(extractApiError(err) ?? 'Error al eliminar el producto.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      header: 'Producto',
      sortValue: (product) => product.name,
      render: (product) => (
        <div className="flex items-center gap-3">
          <ProductThumb product={product} />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-white/90">{product.name}</p>
            <p className="truncate text-xs lowercase text-gray-400 dark:text-gray-500">
              /{product.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Marca',
      sortValue: (product) => product.brand?.name ?? '',
      render: (product) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {product.brand?.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Categoría',
      sortValue: (product) => product.category?.name ?? '',
      render: (product) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {product.category?.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Precio',
      className: 'normal-case',
      sortValue: (product) => toNumber(product.finalPrice),
      render: (product) => {
        const hasDiscount =
          toNumber(product.discountPercentage) > 0 || toNumber(product.discountCash) > 0;
        return (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {formatCurrency(product.finalPrice)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Stock',
      className: 'w-20',
      sortValue: (product) => product.stock,
      render: (product) => (
        <StatusBadge tone={product.stock > 0 ? 'info' : 'neutral'}>{product.stock}</StatusBadge>
      ),
    },
    {
      header: 'Estado',
      render: (product) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge tone={product.isActive ? 'success' : 'danger'}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </StatusBadge>
          {product.isFeatured && <StatusBadge tone="warning">Destacado</StatusBadge>}
          {product.isBestSeller && <StatusBadge tone="warning">Top ventas</StatusBadge>}
        </div>
      ),
    },
    {
      header: 'Acciones',
      render: (product) => (
        <RowActions
          actions={[
            viewAction(() => {
              setDetailProduct(product);
              setDetailOpen(true);
            }),
            ...(canWrite && !showTrash
              ? [
                  editAction(() => openEdit(product)),
                  deleteAction(() => {
                    setTargetProduct(product);
                    setDeleteOpen(true);
                  }),
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Productos | GSP" description="Gestión de productos del catálogo GSP" />
      <PageBreadCrumb pageTitle="Productos" />

      <CrudCard
        title={showTrash ? 'Productos eliminados' : 'Catálogo de Productos'}
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} productos · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Productos publicados en la tienda GSP'
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
                  placeholder="Buscar por nombre o slug..."
                  className={`${inputClass} w-56 pr-8`}
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
              <Button size="sm" variant="outline">
                Buscar
              </Button>
            </form>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPage(1);
                setShowTrash(!showTrash);
              }}
            >
              {showTrash ? 'Ver activos' : 'Ver papelera'}
            </Button>
            {!showTrash && (
              <CanAccess roles={GSP_WRITE_ROLES}>
                <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
                  Nuevo Producto
                </Button>
              </CanAccess>
            )}
          </>
        }
        filters={
          <>
            <Field label="Marca" className="w-44">
              <select
                value={filters.brandId}
                onChange={(e) => updateFilter('brandId', e.target.value)}
                className={inputClass}
              >
                <option value="">Todas</option>
                {brandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoría" className="w-52">
              <select
                value={filters.categoryId}
                onChange={(e) => updateFilter('categoryId', e.target.value)}
                className={inputClass}
              >
                <option value="">Todas</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            <Field label="Stock" className="w-36">
              <select
                value={filters.inStock}
                onChange={(e) => updateFilter('inStock', e.target.value as TriState)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Con stock</option>
                <option value="0">Sin stock</option>
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
          data={products}
          loading={loading}
          error={error}
          emptyMessage={
            showTrash
              ? 'No hay productos eliminados.'
              : 'No hay productos que coincidan con los filtros.'
          }
          keyExtractor={(product) => product.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="productos" />
        )}
      </CrudCard>

      <ProductDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={detailProduct}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${targetProduct?.name}"? El producto pasará a la papelera.`}
      />
    </>
  );
}
