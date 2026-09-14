import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { slidersService } from '../../services/slidersService';
import type { PaginationMeta, Slider, SliderPaginationParams } from '../../types';
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
  TextField,
  ToggleField,
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
/** Debe coincidir con `MAX_SLIDERS` de la API: el carrusel solo admite 5 banners. */
const MAX_SLIDERS = 5;

type StatusFilter = '' | '0' | '1';

interface SliderForm {
  title: string;
  redirectUrl: string;
  orderIndex: string;
  isActive: boolean;
  desktopImage: File[];
  mobileImage: File[];
}

const emptyForm: SliderForm = {
  title: '',
  redirectUrl: '',
  orderIndex: '',
  isActive: true,
  desktopImage: [],
  mobileImage: [],
};

export default function SlidersPage() {
  const { user } = useAuth();
  const canWrite = canWriteGsp(user?.roleCode);

  const [sliders, setSliders] = useState<Slider[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [form, setForm] = useState<SliderForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSlider, setDetailSlider] = useState<Slider | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetSlider, setTargetSlider] = useState<Slider | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSliders = useCallback(async (pageIndex: number, isActive: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params: SliderPaginationParams = {
        limit: PAGE_SIZE,
        offset: (pageIndex - 1) * PAGE_SIZE,
      };
      if (isActive) params.isActive = isActive;

      const response = await slidersService.getAll(params);
      setSliders(response.data);
      setMeta(response.meta);
    } catch {
      setError('Error al cargar los sliders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSliders(page, statusFilter);
  }, [page, statusFilter, fetchSliders]);

  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  const canCreateMore = !meta || meta.totalItems < MAX_SLIDERS;

  const openCreate = () => {
    setEditingSlider(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (slider: Slider) => {
    setEditingSlider(slider);
    setForm({
      title: slider.title ?? '',
      redirectUrl: slider.redirectUrl ?? '',
      orderIndex: String(slider.orderIndex),
      isActive: slider.isActive,
      desktopImage: [],
      mobileImage: [],
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openDetail = async (slider: Slider) => {
    setDetailSlider(slider);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await slidersService.getOne(slider.id);
      setDetailSlider(full);
    } catch {
      toast.error('No se pudo cargar el detalle del slider.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    // Ambas imagenes deben viajar siempre juntas: nunca se reemplaza solo una.
    if (form.desktopImage.length !== form.mobileImage.length) {
      setFormError(
        'Debes subir ambas imágenes (PC y celular) juntas, o ninguna si no deseas reemplazarlas.'
      );
      return;
    }

    if (!editingSlider && (form.desktopImage.length === 0 || form.mobileImage.length === 0)) {
      setFormError('Debes subir la imagen para PC y la imagen para celular.');
      return;
    }

    const orderIndex = form.orderIndex.trim() ? Number(form.orderIndex) : undefined;
    if (orderIndex !== undefined && (Number.isNaN(orderIndex) || orderIndex < 0 || orderIndex > 4)) {
      setFormError('El orden debe ser un número entre 0 y 4.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingSlider) {
        await slidersService.update(editingSlider.id, {
          title: form.title.trim() || undefined,
          redirectUrl: form.redirectUrl.trim() || undefined,
          orderIndex,
          isActive: form.isActive,
          desktopImage: form.desktopImage[0],
          mobileImage: form.mobileImage[0],
        });
        toast.success('Slider actualizado correctamente.');
      } else {
        await slidersService.create({
          title: form.title.trim() || undefined,
          redirectUrl: form.redirectUrl.trim() || undefined,
          orderIndex,
          desktopImage: form.desktopImage[0],
          mobileImage: form.mobileImage[0],
        });
        toast.success('Slider creado correctamente.');
      }
      setFormOpen(false);
      fetchSliders(page, statusFilter);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar el slider.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetSlider) return;
    setDeleting(true);
    try {
      await slidersService.remove(targetSlider.id);
      toast.success('Slider eliminado correctamente.');
      setDeleteOpen(false);
      // Si era el último registro de la página, retrocedemos una.
      const isLastOnPage = sliders.length === 1 && page > 1;
      if (isLastOnPage) setPage(page - 1);
      else fetchSliders(page, statusFilter);
    } catch (err) {
      setDeleteOpen(false);
      toast.error(extractApiError(err) ?? 'Error al eliminar el slider.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Slider>[] = [
    {
      header: '#',
      className: 'w-14',
      sortValue: (slider) => slider.id,
      render: (slider) => <span className="text-gray-400 dark:text-gray-500">{slider.id}</span>,
    },
    {
      header: 'Imagen',
      className: 'normal-case',
      render: (slider) => (
        <img
          src={slider.desktopImageUrl}
          alt={slider.title ?? `Slider #${slider.id}`}
          className="h-12 w-20 rounded-lg object-cover"
        />
      ),
    },
    {
      header: 'Título',
      sortValue: (slider) => slider.title ?? '',
      render: (slider) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {slider.title || 'Sin título'}
        </span>
      ),
    },
    {
      header: 'Redirección',
      className: 'normal-case',
      render: (slider) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {slider.redirectUrl || 'Sin datos'}
        </span>
      ),
    },
    {
      header: 'Orden',
      className: 'w-20',
      sortValue: (slider) => slider.orderIndex,
      render: (slider) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{slider.orderIndex}</span>
      ),
    },
    {
      header: 'Estado',
      sortValue: (slider) => (slider.isActive ? 'Activo' : 'Inactivo'),
      render: (slider) => (
        <StatusBadge tone={slider.isActive ? 'success' : 'danger'}>
          {slider.isActive ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      header: 'Acciones',
      render: (slider) => (
        <RowActions
          actions={[
            viewAction(() => openDetail(slider)),
            ...(canWrite
              ? [
                  editAction(() => openEdit(slider)),
                  deleteAction(() => {
                    setTargetSlider(slider);
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
      <PageMeta title="Sliders | GSP" description="Gestión de banners del carrusel principal" />
      <PageBreadCrumb pageTitle="Sliders" />

      <CrudCard
        title="Lista de Sliders"
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} de ${MAX_SLIDERS} sliders · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Banners del carrusel de la página principal'
        }
        actions={
          <CanAccess roles={GSP_WRITE_ROLES}>
            <span
              title={!canCreateMore ? `Ya existen ${MAX_SLIDERS} sliders (máximo permitido)` : undefined}
            >
              <Button
                size="sm"
                onClick={openCreate}
                disabled={!canCreateMore}
                startIcon={<PlusIcon className="h-4 w-4" />}
              >
                Nuevo Slider
              </Button>
            </span>
          </CanAccess>
        }
        filters={
          <>
            <Field label="Estado" className="w-40">
              <select
                value={statusFilter}
                onChange={(e) => applyFilter(() => setStatusFilter(e.target.value as StatusFilter))}
                className={inputClass}
              >
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </Field>
            {statusFilter && (
              <Button size="sm" variant="outline" onClick={() => applyFilter(() => setStatusFilter(''))}>
                Limpiar filtros
              </Button>
            )}
          </>
        }
      >
        <DataTable
          columns={columns}
          data={sliders}
          loading={loading}
          error={error}
          emptyMessage="No hay sliders registrados."
          keyExtractor={(slider) => slider.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="sliders" />
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
        className="max-w-3xl p-6"
      >
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
          {editingSlider ? 'Editar Slider' : 'Nuevo Slider'}
        </h4>
        <FormAlert message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Título (Opcional)"
            hint="Texto interno para SEO, accesibilidad (alt) o referencia en el admin"
            value={form.title}
            onChange={(title) => setForm({ ...form, title })}
            placeholder="Banner impresoras térmicas"
            disabled={saving}
          />
          <TextField
            label="URL de redirección (Opcional)"
            hint="Ruta o URL a la que redirige al hacer clic"
            value={form.redirectUrl}
            onChange={(redirectUrl) => setForm({ ...form, redirectUrl })}
            placeholder="/products/pos-808l"
            disabled={saving}
          />
          <TextField
            label="Orden (Opcional)"
            hint="0 = primero. Si no se envía, se agrega al final. Máximo 4."
            type="number"
            min={0}
            value={form.orderIndex}
            onChange={(orderIndex) => setForm({ ...form, orderIndex })}
            placeholder="0"
            disabled={saving}
          />
          {editingSlider && (
            <ToggleField
              label="Activo"
              description="Visible en el carrusel de la página principal"
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
              disabled={saving}
            />
          )}
        </div>

        {/* Ancho completo: el PC es panorámico (1920x600) y el de celular es vertical (800x1000),
            por lo que necesitan todo el ancho del modal para mostrarse en su proporción real. */}
        <div className="mt-4 grid grid-cols-1 gap-4">
          <ImageDropzone
            label="Imagen para PC"
            hint="1920x600 px recomendado · JPG, PNG o WebP · Máx. 5 MB"
            required={!editingSlider}
            files={form.desktopImage}
            onChange={(desktopImage) => setForm({ ...form, desktopImage })}
            currentImageUrl={editingSlider?.desktopImageUrl}
            disabled={saving}
          />
          <ImageDropzone
            label="Imagen para celular"
            hint="800x1000 px recomendado · JPG, PNG o WebP · Máx. 5 MB"
            required={!editingSlider}
            files={form.mobileImage}
            onChange={(mobileImage) => setForm({ ...form, mobileImage })}
            currentImageUrl={editingSlider?.mobileImageUrl}
            disabled={saving}
          />
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
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} className="max-w-3xl p-6">
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
          Detalle del Slider
        </h4>
        {detailSlider && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="font-semibold text-2xl text-gray-800 dark:text-white/90">
                  {detailSlider.title || 'Sin título'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">#{detailSlider.id}</p>
              </div>
              <StatusBadge tone={detailSlider.isActive ? 'success' : 'danger'}>
                {detailSlider.isActive ? 'Activo' : 'Inactivo'}
              </StatusBadge>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {detailLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando detalle…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex min-h-[160px] items-center justify-center bg-gray-50 p-3 dark:bg-gray-800">
                      <img
                        src={detailSlider.desktopImageUrl}
                        alt={detailSlider.title ?? 'Imagen PC'}
                        className="max-h-64 w-auto max-w-full object-contain"
                      />
                    </div>
                    <p className="border-t border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Imagen PC · 1920×600 recomendado
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex min-h-[160px] items-center justify-center bg-gray-50 p-3 dark:bg-gray-800">
                      <img
                        src={detailSlider.mobileImageUrl}
                        alt={detailSlider.title ?? 'Imagen celular'}
                        className="max-h-64 w-auto max-w-full object-contain"
                      />
                    </div>
                    <p className="border-t border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Imagen celular · 800×1000 recomendado
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Redirección</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {detailSlider.redirectUrl ?? 'Sin datos'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Orden</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {detailSlider.orderIndex}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Creado</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(detailSlider.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Actualizado</dt>
                    <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                      {formatDate(detailSlider.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </>
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
        title="Eliminar Slider"
        message={`¿Estás seguro de que deseas eliminar el slider "${targetSlider?.title || `#${targetSlider?.id}`}"?`}
      />
    </>
  );
}
