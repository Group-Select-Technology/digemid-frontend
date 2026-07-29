import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { brandsService } from '../../services/brandsService';
import type { Brand, CreateBrandDto, PaginationMeta } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import CrudCard from '../../components/crud/CrudCard';
import Pagination from '../../components/crud/Pagination';
import ConfirmModal from '../../components/crud/ConfirmModal';
import RowActions from '../../components/crud/RowActions';
import { deleteAction, editAction } from '../../components/crud/rowActionPresets';
import { FormAlert, TextAreaField, TextField } from '../../components/crud/FormControls';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { PlusIcon } from '../../icons';
import CanAccess from '../../components/auth/CanAccess';
import { GSP_WRITE_ROLES } from '../../constants/roles';

const PAGE_SIZE = 10;

const emptyForm: CreateBrandDto = { name: '', description: '' };

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<CreateBrandDto>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetBrand, setTargetBrand] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = useCallback(async (pageIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await brandsService.getAll({
        limit: PAGE_SIZE,
        offset: (pageIndex - 1) * PAGE_SIZE,
      });
      setBrands(response.data);
      setMeta(response.meta);
    } catch {
      setError('Error al cargar las marcas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands(page);
  }, [page, fetchBrands]);

  const openCreate = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name, description: brand.description ?? '' });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    const payload: CreateBrandDto = { name: form.name.trim() };
    const description = form.description?.trim();
    if (description) payload.description = description;

    setSaving(true);
    setFormError(null);
    try {
      if (editingBrand) {
        await brandsService.update(editingBrand.id, payload);
        toast.success('Marca actualizada correctamente.');
      } else {
        await brandsService.create(payload);
        toast.success('Marca creada correctamente.');
      }
      setFormOpen(false);
      fetchBrands(page);
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar la marca.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetBrand) return;
    setDeleting(true);
    try {
      await brandsService.remove(targetBrand.id);
      toast.success('Marca eliminada correctamente.');
      setDeleteOpen(false);
      // Si era el último registro de la página, retrocedemos una.
      const isLastOnPage = brands.length === 1 && page > 1;
      if (isLastOnPage) setPage(page - 1);
      else fetchBrands(page);
    } catch (err) {
      toast.error(extractApiError(err) ?? 'Error al eliminar la marca.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Brand>[] = [
    {
      header: '#',
      className: 'w-14',
      sortValue: (brand) => brand.id,
      render: (brand) => <span className="text-gray-400 dark:text-gray-500">{brand.id}</span>,
    },
    {
      header: 'Marca',
      sortValue: (brand) => brand.name,
      render: (brand) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{brand.name}</span>
      ),
    },
    {
      header: 'Descripción',
      className: 'normal-case',
      render: (brand) => (
        <span className="line-clamp-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
          {brand.description || '—'}
        </span>
      ),
    },
    {
      header: 'Registrada',
      className: 'normal-case',
      sortValue: (brand) => brand.createdAt,
      render: (brand) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(brand.createdAt)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (brand) => (
        <CanAccess roles={GSP_WRITE_ROLES}>
          <RowActions
            actions={[
              editAction(() => openEdit(brand)),
              deleteAction(() => {
                setTargetBrand(brand);
                setDeleteOpen(true);
              }),
            ]}
          />
        </CanAccess>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Marcas | GSP" description="Gestión de marcas del catálogo GSP" />
      <PageBreadCrumb pageTitle="Marcas" />

      <CrudCard
        title="Lista de Marcas"
        subtitle={
          meta
            ? `${meta.totalItems.toLocaleString()} marcas · página ${meta.currentPage} de ${meta.totalPages}`
            : 'Marcas disponibles para asociar a los productos'
        }
        actions={
          <CanAccess roles={GSP_WRITE_ROLES}>
            <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="h-4 w-4" />}>
              Nueva Marca
            </Button>
          </CanAccess>
        }
      >
        <DataTable
          columns={columns}
          data={brands}
          loading={loading}
          error={error}
          emptyMessage="No hay marcas registradas."
          keyExtractor={(brand) => brand.id}
        />
        {!loading && !error && meta && (
          <Pagination meta={meta} page={page} onPageChange={setPage} itemLabel="marcas" />
        )}
      </CrudCard>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        className="max-w-lg p-6"
      >
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
          {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
        </h4>
        <FormAlert message={formError} />
        <div className="flex flex-col gap-4">
          <TextField
            label="Nombre"
            required
            value={form.name}
            onChange={(name) => setForm({ ...form, name })}
            placeholder="Epson"
            disabled={saving}
          />
          <TextAreaField
            label="Descripción (Opcional)"
            hint="Opcional · entre 2 y 500 caracteres"
            value={form.description ?? ''}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="Marca especializada en impresoras y equipos de impresión."
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

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Marca"
        message={`¿Estás seguro de que deseas eliminar la marca "${targetBrand?.name}"? No podrás eliminarla si tiene productos asociados.`}
      />
    </>
  );
}
