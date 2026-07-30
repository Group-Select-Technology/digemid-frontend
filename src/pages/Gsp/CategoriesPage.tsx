import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatDate, slugify } from '../../utils/format';
import { categoriesService } from '../../services/categoriesService';
import type {
  Category,
  CategoryPaginationParams,
  CreateCategoryDto,
  PaginationMeta,
} from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import CrudCard from '../../components/crud/CrudCard';
import Pagination from '../../components/crud/Pagination';
import ConfirmModal from '../../components/crud/ConfirmModal';
import RowActions from '../../components/crud/RowActions';
import { deleteAction, editAction, viewAction } from '../../components/crud/rowActionPresets';
import {
  Field,
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
  inputClass,
} from '../../components/crud/FormControls';
import ImageDropzone from '../../components/crud/ImageDropzone';
import StatusBadge from '../../components/crud/StatusBadge';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { PlusIcon } from '../../icons';
import CanAccess from '../../components/auth/CanAccess';
import { useAuth } from '../../context/AuthContext';
import { GSP_WRITE_ROLES, canWriteGsp } from '../../constants/roles';

const PAGE_SIZE = 10;
const PARENT_OPTIONS_LIMIT = 100;

type SonsFilter = '' | '0' | '1';
type StatusFilter = '' | '0' | '1';

interface CategoryForm {
  name: string;
  description: string;
  slug: string;
  parentId: string;
  isActive: boolean;
  file: File[];
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  slug: '',
  parentId: '',
  isActive: true,
  file: [],
};

/** Placeholder cuando la categoría no tiene imagen. */
function CategoryThumb({ category }: { category: Category }) {
  if (category.imagePath) {
    return (
      <img
        src={category.imagePath}
        alt={category.name}
        className="h-10 w-10 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
      {category.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const canWrite = canWriteGsp(user?.roleCode);

  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [sonsFilter, setSonsFilter] = useState<SonsFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  // Opciones del select de categoría padre
  const [parentOptions, setParentOptions] = useState<Category[]>([]);

  // Modal de formulario
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  /** Padre con el que se abrió el formulario: solo enviamos `parentId` si cambia. */
  const [initialParentId, setInitialParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmaciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'delete' | 'toggle'>('delete');
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchCategories = useCallback(
    async (pageIndex: number, sons: SonsFilter, isActive: StatusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const params: CategoryPaginationParams = {
          limit: PAGE_SIZE,
          offset: (pageIndex - 1) * PAGE_SIZE,
        };
        if (sons) params.sons = sons;
        if (isActive) params.isActive = isActive;

        const response = await categoriesService.getAll(params);
        setCategories(response.data);
        setMeta(response.meta);
      } catch {
        setError('Error al cargar las categorías.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchParentOptions = useCallback(async () => {
    try {
      const response = await categoriesService.getAll({ limit: PARENT_OPTIONS_LIMIT });
      setParentOptions(response.data);
    } catch {
      setParentOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories(page, sonsFilter, statusFilter);
  }, [page, sonsFilter, statusFilter, fetchCategories]);

  useEffect(() => {
    fetchParentOptions();
  }, [fetchParentOptions]);

  const refresh = () => {
    fetchCategories(page, sonsFilter, statusFilter);
    fetchParentOptions();
  };

  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  const parentSelectOptions = useMemo(
    () =>
      parentOptions
        .filter((option) => option.id !== editingCategory?.id)
        .map((option) => ({ value: String(option.id), label: option.name })),
    [parentOptions, editingCategory]
  );

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setInitialParentId('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    // El listado con `sons=1` no trae `parent`, así que lo resolvemos desde la lista completa.
    const fromOptions = parentOptions.find((option) => option.id === category.id);
    const parent = category.parent ?? fromOptions?.parent ?? null;
    const parentId = parent ? String(parent.id) : '';

    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
      slug: category.slug ?? '',
      parentId,
      isActive: category.isActive,
      file: [],
    });
    setInitialParentId(parentId);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const payload: CreateCategoryDto = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      slug: form.slug.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
      file: form.file[0] ?? null,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.id, {
          ...payload,
          // Omitido si no cambió, para no reasignar el padre por accidente.
          parentId: form.parentId === initialParentId ? undefined : payload.parentId,
          isActive: form.isActive,
        });
        toast.success('Categoría actualizada correctamente.');
      } else {
        await categoriesService.create(payload);
        toast.success('Categoría creada correctamente.');
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar la categoría.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (category: Category) => {
    setDetailCategory(category);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await categoriesService.getOne(category.id);
      setDetailCategory(full);
    } catch {
      toast.error('No se pudo cargar el detalle de la categoría.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openConfirm = (category: Category, type: 'delete' | 'toggle') => {
    setTargetCategory(category);
    setConfirmType(type);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!targetCategory) return;
    setConfirming(true);
    try {
      if (confirmType === 'delete') {
        await categoriesService.remove(targetCategory.id);
        toast.success('Categoría eliminada correctamente.');
        if (categories.length === 1 && page > 1) {
          setPage(page - 1);
          setConfirmOpen(false);
          return;
        }
      } else {
        await categoriesService.update(targetCategory.id, { isActive: !targetCategory.isActive });
        toast.success(
          `Categoría ${targetCategory.isActive ? 'desactivada' : 'activada'} correctamente.`
        );
      }
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      setConfirmOpen(false);
      toast.error(extractApiError(err) ?? 'Error al realizar la acción.');
    } finally {
      setConfirming(false);
    }
  };

  const confirmTexts =
    confirmType === 'delete'
      ? {
          title: 'Eliminar Categoría',
          message: `¿Estás seguro de que deseas eliminar "${targetCategory?.name}"? No podrás eliminarla si tiene subcategorías o productos asociados.`,
        }
      : {
          title: targetCategory?.isActive ? 'Desactivar Categoría' : 'Activar Categoría',
          message: targetCategory?.isActive
            ? `¿Deseas desactivar "${targetCategory?.name}"? La API rechaza la desactivación si la categoría tiene productos asociados.`
            : `¿Deseas activar "${targetCategory?.name}"?`,
        };

  const columns: Column<Category>[] = [
    {
      header: '#',
      className: 'w-14',
      sortValue: (category) => category.id,
      render: (category) => (
        <span className="text-gray-400 dark:text-gray-500">{category.id}</span>
      ),
    },
    {
      header: 'Categoría',
      sortValue: (category) => category.name,
      render: (category) => (
        <div className="flex items-center gap-3">
          <CategoryThumb category={category} />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-white/90">{category.name}</p>
            <p className="truncate text-xs lowercase text-gray-400 dark:text-gray-500">
              /{category.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Jerarquía',
      className: 'normal-case',
      render: (category) => {
        if (category.children && category.children.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {category.children.map((child) => (
                <StatusBadge key={child.id} tone="info">
                  {child.name}
                </StatusBadge>
              ))}
            </div>
          );
        }
        if (category.parent) {
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Subcategoría de{' '}
              <span className="font-medium text-gray-800 dark:text-white/90">
                {category.parent.name}
              </span>
            </span>
          );
        }
        return <span className="text-sm text-gray-400 dark:text-gray-500">Categoría raíz</span>;
      },
    },
    {
      header: 'Descripción',
      className: 'normal-case',
      render: (category) => (
        <span className="line-clamp-2 max-w-xs text-sm text-gray-600 dark:text-gray-400">
          {category.description || 'Sin datos'}
        </span>
      ),
    },
    {
      header: 'Estado',
      sortValue: (category) => (category.isActive ? 'Activo' : 'Inactivo'),
      render: (category) => (
        <StatusBadge
          tone={category.isActive ? 'success' : 'danger'}
          onClick={canWrite ? () => openConfirm(category, 'toggle') : undefined}
          title={canWrite ? 'Cambiar estado' : undefined}
        >
          {category.isActive ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
    {
      header: 'Acciones',
      render: (category) => {
        const hasChildren = !!category.children?.length;
        return (
          <RowActions
            actions={[
              viewAction(() => openDetail(category)),
              ...(canWrite
                ? [
                    editAction(() => openEdit(category)),
                    {
                      ...deleteAction(() => openConfirm(category, 'delete')),
                      disabled: hasChildren,
                      title: hasChildren
                        ? 'No se puede eliminar: tiene subcategorías'
                        : 'Eliminar',
                    },
                  ]
                : []),
            ]}
          />
        );
      },
    },
  ];

  const slugPreview = form.slug.trim() || slugify(form.name);

  return (
    <>
      <PageMeta title="Categorías | GSP" description="Gestión de categorías del catálogo GSP" />
      <PageBreadCrumb pageTitle="Categorías" />

      <CrudCard
        title="Lista de Categorías"
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} categorías · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Categorías y subcategorías del catálogo'
        }
        actions={
          <CanAccess roles={GSP_WRITE_ROLES}>
            <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
              Nueva Categoría
            </Button>
          </CanAccess>
        }
        filters={
          <>
            <Field label="Jerarquía" className="w-48">
              <select
                value={sonsFilter}
                onChange={(e) => applyFilter(() => setSonsFilter(e.target.value as SonsFilter))}
                className={inputClass}
              >
                <option value="">Todas</option>
                <option value="1">Solo con subcategorías</option>
                <option value="0">Solo sin subcategorías</option>
              </select>
            </Field>
            <Field label="Estado" className="w-40">
              <select
                value={statusFilter}
                onChange={(e) => applyFilter(() => setStatusFilter(e.target.value as StatusFilter))}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Activas</option>
                <option value="0">Inactivas</option>
              </select>
            </Field>
            {(sonsFilter || statusFilter) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  applyFilter(() => {
                    setSonsFilter('');
                    setStatusFilter('');
                  })
                }
              >
                Limpiar filtros
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          error={error}
          emptyMessage="No hay categorías que coincidan con los filtros."
          keyExtractor={(category) => category.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="categorías" />
        )}
      </CrudCard>

      {/* Formulario */}
      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        className="max-w-2xl p-6"
      >
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </h4>
        <FormAlert message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Nombre"
            required
            value={form.name}
            onChange={(name) => setForm({ ...form, name })}
            placeholder="Impresoras"
            disabled={saving}
          />
          <TextField
            label="Slug (Opcional)"
            hint={slugPreview ? `Se guardará como: /${slugPreview}` : 'Se genera desde el nombre'}
            value={form.slug}
            onChange={(slug) => setForm({ ...form, slug })}
            placeholder="impresoras"
            disabled={saving}
          />
          <TextAreaField
            label="Descripción (Opcional)"
            className="sm:col-span-2"
            hint="Opcional · entre 2 y 255 caracteres"
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="Impresoras térmicas para tickets y documentos de venta."
            disabled={saving}
          />
          <SelectField
            label="Categoría padre"
            hint="Déjalo vacío para crear una categoría raíz"
            value={form.parentId}
            onChange={(parentId) => setForm({ ...form, parentId })}
            options={parentSelectOptions}
            placeholder="Ninguna (categoría raíz)"
            disabled={saving}
          />
          {editingCategory && (
            <SelectField
              label="Estado"
              hint="No se puede desactivar si tiene productos asociados"
              value={form.isActive ? '1' : '0'}
              onChange={(value) => setForm({ ...form, isActive: value === '1' })}
              options={[
                { value: '1', label: 'Activa' },
                { value: '0', label: 'Inactiva' },
              ]}
              disabled={saving}
            />
          )}
          <div className="sm:col-span-2">
            <ImageDropzone
              label="Imagen"
              files={form.file}
              onChange={(file) => setForm({ ...form, file })}
              currentImageUrl={editingCategory?.imagePath}
              disabled={saving}
            />
          </div>
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
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
          Detalle de la Categoría
        </h4>
        {detailCategory && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {detailCategory.imagePath ? (
                <img
                  src={detailCategory.imagePath}
                  alt={detailCategory.name}
                  className="h-32 w-32 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
                  {detailCategory.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-2xl text-gray-800 dark:text-white/90">
                  {detailCategory.name}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">/{detailCategory.slug}</p>
                <StatusBadge tone={detailCategory.isActive ? 'success' : 'danger'}>
                  {detailCategory.isActive ? 'Activa' : 'Inactiva'}
                </StatusBadge>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {detailLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando detalle…</p>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Descripción</dt>
                  <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                    {detailCategory.description || 'Sin datos'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Categoría padre</dt>
                  <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                    {detailCategory.parent?.name ?? 'Categoría raíz'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Subcategorías</dt>
                  <dd className="mt-1">
                    {detailCategory.children?.length ? (
                      <ul className="space-y-2">
                        {detailCategory.children.map((child) => (
                          <li key={child.id} className="flex items-center gap-3">
                            {child.imagePath ? (
                              <img
                                src={child.imagePath}
                                alt={child.name}
                                className="h-8 w-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                {child.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                {child.name}
                              </p>
                              <p className="truncate text-xs lowercase text-gray-400 dark:text-gray-500">
                                /{child.slug}
                              </p>
                            </div>
                            <StatusBadge tone={child.isActive ? 'success' : 'danger'}>
                              {child.isActive ? 'Activa' : 'Inactiva'}
                            </StatusBadge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-800 dark:text-white/90">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Creada</dt>
                  <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                    {formatDate(detailCategory.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Actualizada</dt>
                  <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                    {formatDate(detailCategory.updatedAt)}
                  </dd>
                </div>
              </dl>
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
