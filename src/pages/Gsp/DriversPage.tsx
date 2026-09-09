import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { primaryImagePath } from '../../utils/bundle';
import { supportService } from '../../services/supportService';
import { categoriesService } from '../../services/categoriesService';
import { productsService } from '../../services/productsService';
import type {
  Category,
  CreateSupportDriverDto,
  PaginationMeta,
  Product,
  SupportModel,
  SupportPaginationParams,
} from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import CrudCard from '../../components/crud/CrudCard';
import Pagination from '../../components/crud/Pagination';
import ConfirmModal from '../../components/crud/ConfirmModal';
import RowActions from '../../components/crud/RowActions';
import { deleteAction, viewAction } from '../../components/crud/rowActionPresets';
import { Field, FormAlert, SelectField, TextField, inputClass } from '../../components/crud/FormControls';
import StatusBadge from '../../components/crud/StatusBadge';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { DownloadIcon, PlusIcon, TrashBinIcon } from '../../icons';

const PAGE_SIZE = 10;
const CATEGORY_OPTIONS_LIMIT = 100;
const PRODUCT_SEARCH_LIMIT = 8;

type StatusFilter = '' | '0' | '1';

interface Filters {
  search: string;
  isActive: StatusFilter;
}

const emptyFilters: Filters = { search: '', isActive: '' };

interface DriverRow extends CreateSupportDriverDto {
  key: string;
}

interface SupportForm {
  name: string;
  order: string;
  categoryId: string;
  drivers: DriverRow[];
}

const newDriverRow = (): DriverRow => ({ key: crypto.randomUUID(), name: '', fileUrl: '' });

const emptyForm = (order = 0): SupportForm => ({
  name: '',
  order: String(order),
  categoryId: '',
  drivers: [newDriverRow()],
});

export default function DriversPage() {
  const [models, setModels] = useState<SupportModel[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados vs. texto en edición del buscador
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState('');

  // Opciones del select de categoría (solo categorías padre, que es lo que valida la API al crear)
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SupportForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Buscador de productos para autocompletar nombre (modelo) y categoría
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailModel, setDetailModel] = useState<SupportModel | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetModel, setTargetModel] = useState<SupportModel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchModels = useCallback(async (pageIndex: number, activeFilters: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params: SupportPaginationParams = {
        limit: PAGE_SIZE,
        offset: (pageIndex - 1) * PAGE_SIZE,
      };
      if (activeFilters.search.trim()) params.search = activeFilters.search.trim();
      if (activeFilters.isActive) params.isActive = activeFilters.isActive;

      const response = await supportService.getAll(params);
      setModels(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(extractApiError(err) ?? 'Error al cargar los modelos de soporte.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategoryOptions = useCallback(async () => {
    try {
      const response = await categoriesService.getAll({
        sons: '1',
        isActive: '1',
        limit: CATEGORY_OPTIONS_LIMIT,
      });
      setCategoryOptions(response.data);
    } catch {
      setCategoryOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchModels(page, filters);
  }, [page, filters, fetchModels]);

  useEffect(() => {
    fetchCategoryOptions();
  }, [fetchCategoryOptions]);

  // Búsqueda de productos por nombre, modelo o SKU para autocompletar el formulario
  useEffect(() => {
    const term = productQuery.trim();
    if (term.length < 2) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }

    let cancelled = false;
    setSearchingProducts(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await productsService.getAll({
          search: term,
          isActive: '1',
          limit: PRODUCT_SEARCH_LIMIT,
          offset: 0,
        });
        if (!cancelled) setProductResults(response.data);
      } catch {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setSearchingProducts(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const refresh = () => fetchModels(page, filters);

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

  const hasActiveFilters = filters.search !== '' || filters.isActive !== '';

  const categorySelectOptions = useMemo(
    () => categoryOptions.map((category) => ({ value: String(category.id), label: category.name })),
    [categoryOptions]
  );

  const openCreate = () => {
    setForm(emptyForm(models.length));
    setFormError(null);
    setProductQuery('');
    setProductResults([]);
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const selectProduct = (product: Product) => {
    // La categoría del modelo de soporte debe ser una categoría padre: si el producto
    // está en una subcategoría, usamos la categoría raíz de esa subcategoría.
    const rootCategoryId = product.category?.parent?.id ?? product.category?.id ?? null;
    setForm((prev) => ({
      ...prev,
      name: product.model?.trim() || product.name,
      categoryId: rootCategoryId ? String(rootCategoryId) : prev.categoryId,
    }));
    setSelectedProduct(product);
    setProductQuery('');
    setProductResults([]);
  };

  const clearSelectedProduct = () => setSelectedProduct(null);

  const addDriverRow = () => setForm((prev) => ({ ...prev, drivers: [...prev.drivers, newDriverRow()] }));

  const removeDriverRow = (key: string) =>
    setForm((prev) => ({ ...prev, drivers: prev.drivers.filter((driver) => driver.key !== key) }));

  const updateDriverRow = (key: string, field: 'name' | 'fileUrl', value: string) =>
    setForm((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) => (driver.key === key ? { ...driver, [field]: value } : driver)),
    }));

  const handleSave = async () => {
    const name = form.name.trim();
    if (name.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!form.categoryId) {
      setFormError('Debes seleccionar una categoría.');
      return;
    }
    const order = Number(form.order);
    if (Number.isNaN(order) || order < 0) {
      setFormError('El orden debe ser un número entero mayor o igual a 0.');
      return;
    }
    const drivers = form.drivers.map((driver) => ({
      name: driver.name.trim(),
      fileUrl: driver.fileUrl.trim(),
    }));
    if (drivers.length === 0) {
      setFormError('Debes incluir al menos un driver.');
      return;
    }
    if (drivers.some((driver) => !driver.name || !driver.fileUrl)) {
      setFormError('Cada driver necesita un nombre y una URL de archivo.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await supportService.create({
        name,
        order,
        categoryId: Number(form.categoryId),
        drivers,
      });
      toast.success('Modelo de soporte creado correctamente.');
      setFormOpen(false);
      refresh();
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al crear el modelo de soporte.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (model: SupportModel) => {
    setDetailModel(model);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await supportService.getOne(model.id);
      setDetailModel(full);
    } catch {
      toast.error('No se pudo cargar el detalle del modelo.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!targetModel) return;
    setDeleting(true);
    try {
      await supportService.remove(targetModel.id);
      toast.success('Modelo de soporte eliminado correctamente.');
      setDeleteOpen(false);
      const isLastOnPage = models.length === 1 && page > 1;
      if (isLastOnPage) setPage(page - 1);
      else refresh();
    } catch (err) {
      setDeleteOpen(false);
      toast.error(extractApiError(err) ?? 'Error al eliminar el modelo de soporte.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SupportModel>[] = [
    {
      header: '#',
      className: 'w-14',
      sortValue: (model) => model.id,
      render: (model) => <span className="text-gray-400 dark:text-gray-500">{model.id}</span>,
    },
    {
      header: 'Modelo',
      sortValue: (model) => model.name,
      render: (model) => <span className="font-medium text-gray-800 dark:text-white/90">{model.name}</span>,
    },
    {
      header: 'Categoría',
      className: 'normal-case',
      render: (model) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {model.category?.name ?? 'Sin categoría'}
        </span>
      ),
    },
    {
      header: 'Drivers',
      render: (model) => (
        <StatusBadge tone="info">
          {model.drivers?.length ?? 0} driver{(model.drivers?.length ?? 0) === 1 ? '' : 's'}
        </StatusBadge>
      ),
    },
    {
      header: 'Orden',
      className: 'normal-case',
      sortValue: (model) => model.order,
      render: (model) => <span className="text-sm text-gray-600 dark:text-gray-400">{model.order}</span>,
    },
    {
      header: 'Estado',
      sortValue: (model) => (model.isActive ? 'Activo' : 'Inactivo'),
      render: (model) => (
        <StatusBadge tone={model.isActive ? 'success' : 'danger'}>
          {model.isActive ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      header: 'Registrado',
      className: 'normal-case',
      sortValue: (model) => model.createdAt,
      render: (model) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(model.createdAt)}</span>
      ),
    },
    {
      header: 'Acciones',
      render: (model) => (
        <RowActions
          actions={[
            viewAction(() => openDetail(model)),
            deleteAction(() => {
              setTargetModel(model);
              setDeleteOpen(true);
            }),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Drivers | GSP" description="Gestión de modelos de soporte y sus drivers" />
      <PageBreadCrumb pageTitle="Drivers de Soporte" />

      <CrudCard
        title="Modelos de Soporte"
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} modelos · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Modelos y drivers que se muestran en el Centro de Drivers de la tienda'
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
                  placeholder="Buscar por nombre del modelo..."
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
              <Button type="submit" size="sm" variant="outline">
                Buscar
              </Button>
            </form>
            <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
              Nuevo Modelo
            </Button>
          </>
        }
        filters={
          <>
            <Field label="Estado" className="w-40">
              <select
                value={filters.isActive}
                onChange={(e) => updateFilter('isActive', e.target.value as StatusFilter)}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
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
          data={models}
          loading={loading}
          error={error}
          emptyMessage="No hay modelos de soporte registrados."
          keyExtractor={(model) => model.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="modelos" />
        )}
      </CrudCard>

      {/* Formulario de creación */}
      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        className="max-w-2xl p-6"
      >
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">Nuevo Modelo de Soporte</h4>
        <FormAlert message={formError} />

        <div className="mb-5 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar producto para autocompletar</p>
          <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
            Busca por nombre, modelo o SKU y selecciona un producto para completar el nombre del modelo y la
            categoría automáticamente. Es solo una ayuda: puedes editar los campos después.
          </p>
          <div className="relative">
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, modelo o SKU..."
              disabled={saving}
              className={inputClass}
            />
            {productQuery.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {searchingProducts ? (
                  <p className="px-3 py-2 text-sm text-gray-400">Buscando...</p>
                ) : productResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">No hay productos activos que coincidan.</p>
                ) : (
                  <ul>
                    {productResults.map((product) => {
                      const cover = primaryImagePath(product.images);
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => selectProduct(product)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {cover ? (
                              <img src={cover} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
                                {product.name.charAt(0)}
                              </div>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-800 dark:text-white">
                                {product.name}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                Modelo: {product.model || 'Sin modelo'}
                                {product.category
                                  ? ` · ${product.category.parent?.name ?? product.category.name}`
                                  : ''}
                              </span>
                              <span className="block truncate text-[11px] text-gray-400">
                                {product.sku ? `SKU: ${product.sku}` : 'Sin SKU'}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          {selectedProduct && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-gray-700 dark:bg-brand-500/10 dark:text-gray-200">
              <span className="truncate">
                Autocompletado desde <span className="font-medium">{selectedProduct.name}</span>
                {selectedProduct.model ? ` (modelo: ${selectedProduct.model})` : ''}
              </span>
              <button
                type="button"
                onClick={clearSelectedProduct}
                title="Quitar referencia"
                className="shrink-0 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Nombre del modelo"
            required
            hint="Se autocompleta al elegir un producto; también puedes escribirlo o editarlo manualmente."
            value={form.name}
            onChange={(name) => setForm({ ...form, name })}
            placeholder="POS-805L"
            disabled={saving}
          />
          <TextField
            label="Orden"
            required
            type="number"
            min={0}
            value={form.order}
            onChange={(order) => setForm({ ...form, order })}
            placeholder="0"
            disabled={saving}
          />
          <SelectField
            label="Categoría"
            required
            className="sm:col-span-2"
            value={form.categoryId}
            onChange={(categoryId) => setForm({ ...form, categoryId })}
            options={categorySelectOptions}
            placeholder="Selecciona una categoría"
            disabled={saving}
            hint="Solo se listan categorías padre activas, tal como lo exige la API."
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drivers <span className="text-red-500">*</span>
            </p>
            <Button size="sm" variant="outline" onClick={addDriverRow} disabled={saving} startIcon={<PlusIcon className="h-3.5 w-3.5" />}>
              Agregar driver
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {form.drivers.map((driver, index) => (
              <div
                key={driver.key}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-start"
              >
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={driver.name}
                    onChange={(e) => updateDriverRow(driver.key, 'name', e.target.value)}
                    placeholder={`Driver Para ${form.name || 'el modelo'} V${index + 1}`}
                    disabled={saving}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={driver.fileUrl}
                    onChange={(e) => updateDriverRow(driver.key, 'fileUrl', e.target.value)}
                    placeholder="https://cdn.example.com/drivers/archivo.exe"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDriverRow(driver.key)}
                  disabled={saving || form.drivers.length === 1}
                  title={form.drivers.length === 1 ? 'Debe quedar al menos un driver' : 'Quitar driver'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashBinIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Nombre y URL del archivo son obligatorios para cada driver.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      {/* Detalle */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} className="max-w-lg p-6">
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">Detalle del Modelo</h4>
        {detailModel && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-2xl text-gray-800 dark:text-white/90">{detailModel.name}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">#{detailModel.id}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge tone={detailModel.isActive ? 'success' : 'danger'}>
                  {detailModel.isActive ? 'Activo' : 'Inactivo'}
                </StatusBadge>
                <StatusBadge tone="neutral">Orden: {detailModel.order}</StatusBadge>
                <StatusBadge tone="neutral">{detailModel.category?.name ?? 'Sin categoría'}</StatusBadge>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {detailLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando detalle…</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Drivers ({detailModel.drivers?.length ?? 0})
                  </p>
                  {detailModel.drivers?.length ? (
                    <ul className="space-y-2">
                      {detailModel.drivers.map((driver) => (
                        <li
                          key={driver.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                              {driver.name}
                            </p>
                            <StatusBadge tone={driver.isActive ? 'success' : 'danger'} size="sm">
                              {driver.isActive ? 'Activo' : 'Inactivo'}
                            </StatusBadge>
                          </div>
                          <a
                            href={driver.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Descargar / abrir archivo"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay drivers asociados.</p>
                  )}
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Creado</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(detailModel.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Actualizado</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(detailModel.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Modelo de Soporte"
        message={`¿Estás seguro de que deseas eliminar el modelo "${targetModel?.name}"? Se eliminarán también sus ${targetModel?.drivers?.length ?? 0} driver(s) asociados.`}
      />
    </>
  );
}
