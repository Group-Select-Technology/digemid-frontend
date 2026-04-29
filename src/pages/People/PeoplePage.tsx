import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { peopleService } from '../../services/peopleService';
import type { Person, UpdatePersonDto } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/crud/ConfirmModal';
import { PencilIcon, TrashBinIcon } from '../../icons';

const DOC_TYPES = ['DNI', 'PASSPORT', 'RUC'] as const;

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Person[] | null>(null);
  const [searching, setSearching] = useState(false);

  const displayData = searchResults ?? people;

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [form, setForm] = useState<UpdatePersonDto>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPeople = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await peopleService.getAll();
      setPeople(data);
    } catch {
      setError('Error al cargar las personas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

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
      const result = await peopleService.getOne(term);
      setSearchResults([result]);
    } catch {
      setSearchResults([]);
      setError('No se encontró ninguna persona con ese número de documento.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
    setError(null);
  };

  const openEdit = (person: Person) => {
    setEditingPerson(person);
    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      documentType: person.documentType as UpdatePersonDto['documentType'],
      documentNumber: person.documentNumber,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!editingPerson) return;
    setSaving(true);
    try {
      await peopleService.update(editingPerson.id, form);
      toast.success('Persona actualizada correctamente.');
      setFormOpen(false);
      setSearchResults(null);
      setSearchTerm('');
      fetchPeople();
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar los datos.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (person: Person) => {
    setTargetPerson(person);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!targetPerson) return;
    setDeleting(true);
    try {
      await peopleService.remove(targetPerson.id);
      toast.success('Persona eliminada correctamente.');
      setDeleteOpen(false);
      setSearchResults(null);
      setSearchTerm('');
      fetchPeople();
    } catch {
      toast.error('Error al eliminar la persona.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Person>[] = [
    {
      header: '#',
      className: 'w-12',
      sortValue: (p) => p.id,
      render: (p) => <span className="text-gray-500 dark:text-gray-400">{p.id}</span>,
    },
    {
      header: 'Nombre',
      sortValue: (p) => p.firstName,
      render: (p) => <span className="font-medium text-gray-800 dark:text-white/90 cap">{p.firstName}</span>,
    },
    {
      header: 'Apellido',
      sortValue: (p) => p.lastName,
      render: (p) => p.lastName,
    },
    {
      header: 'Tipo Doc.',
      sortValue: (p) => p.documentType,
      render: (p) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          {p.documentType}
        </span>
      ),
    },
    {
      header: 'Nro. Documento',
      sortValue: (p) => p.documentNumber,
      render: (p) => p.documentNumber,
    },
    {
      header: 'Acciones',
      render: (p) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-brand-500 transition" title="Editar">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openDelete(p)} className="p-1.5 text-gray-500 hover:text-red-500 transition" title="Eliminar">
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Personas" description="Gestión de personas" />
      <PageBreadCrumb pageTitle="Personas" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Lista de Personas</h3>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) clearSearch();
                }}
                placeholder="Buscar por nro. documento..."
                className="w-56 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-3 pr-8 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        </div>

        <DataTable
          columns={columns}
          data={displayData}
          loading={loading || searching}
          error={error}
          emptyMessage={searchResults !== null ? 'No se encontró ninguna persona con ese número de documento.' : 'No hay personas registradas.'}
          keyExtractor={(p) => p.id}
        />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setFormError(null); }} className="max-w-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          Editar Persona
        </h4>
        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {formError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={form.firstName ?? ''}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
              <input
                type="text"
                value={form.lastName ?? ''}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Documento</label>
              <select
                value={form.documentType ?? ''}
                onChange={(e) => setForm({ ...form, documentType: e.target.value as UpdatePersonDto['documentType'] })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nro. Documento</label>
              <input
                type="text"
                value={form.documentNumber ?? ''}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Persona"
        message={`¿Estás seguro de que deseas eliminar a "${targetPerson?.firstName} ${targetPerson?.lastName}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}
