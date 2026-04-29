import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { usersService } from '../../services/usersService';
import { rolesService } from '../../services/rolesService';
import type { User, CreateUserDto, UpdateUserDto, Role } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/crud/ConfirmModal';
import { PencilIcon, PlusIcon, TrashBinIcon } from '../../icons';

const ROLE_CODES = ['ADMIN', 'SOPORTE', 'DESARROLLO'] as const;
const DOC_TYPES = ['DNI', 'PASSPORT', 'RUC'] as const;

const emptyForm: CreateUserDto = {
  corporateEmail: '',
  passwordHash: '',
  roleCode: 'ADMIN',
  person: { firstName: '', lastName: '', documentType: 'DNI', documentNumber: '' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserDto>(emptyForm);
  const [editForm, setEditForm] = useState<UpdateUserDto>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm modals
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'delete' | 'toggle' | 'reset'>('delete');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Reset password result
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        usersService.getAll(),
        rolesService.getAll(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ corporateEmail: user.corporateEmail, roleCode: user.role.code as CreateUserDto['roleCode'] });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        await usersService.update(editingUser.id, editForm);
        toast.success('Usuario actualizado correctamente.');
      } else {
        await usersService.create(form);
        toast.success('Usuario creado correctamente.');
      }
      setFormOpen(false);
      fetchAll();
    } catch (err) {
      const msg = extractApiError(err) ?? 'Error al guardar el usuario.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (user: User, type: 'delete' | 'toggle' | 'reset') => {
    setTargetUser(user);
    setConfirmType(type);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!targetUser) return;
    setConfirming(true);
    try {
      if (confirmType === 'delete') {
        await usersService.remove(targetUser.id);
        toast.success('Usuario eliminado correctamente.');
      } else if (confirmType === 'toggle') {
        await usersService.updateStatus(targetUser.id, !targetUser.isActive);
        toast.success(`Usuario ${!targetUser.isActive ? 'activado' : 'desactivado'} correctamente.`);
      } else if (confirmType === 'reset') {
        const newPassword: string = await usersService.resetPassword(targetUser.id);
        toast.success('Contraseña reseteada correctamente.');
        setConfirmOpen(false);
        setResetPasswordData({ email: targetUser.corporateEmail, password: newPassword });
        setResetPasswordOpen(true);
        return;
      }
      setConfirmOpen(false);
      fetchAll();
    } catch {
      toast.error('Error al realizar la acción.');
    } finally {
      setConfirming(false);
    }
  };

  const confirmMessages: Record<string, { title: string; message: string }> = {
    delete: {
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar al usuario "${targetUser?.corporateEmail}"? Esta acción no se puede deshacer.`,
    },
    toggle: {
      title: targetUser?.isActive ? 'Desactivar Usuario' : 'Activar Usuario',
      message: `¿Estás seguro de que deseas ${targetUser?.isActive ? 'desactivar' : 'activar'} al usuario "${targetUser?.corporateEmail}"?`,
    },
    reset: {
      title: 'Resetear Contraseña',
      message: `¿Estás seguro de que deseas resetear la contraseña del usuario "${targetUser?.corporateEmail}"?`,
    },
  };

  const columns: Column<User>[] = [
    {
      header: '#',
      className: 'w-12',
      sortValue: (user) => user.id,
      render: (user) => <span className="text-gray-500 dark:text-gray-400">{user.id}</span>,
    },
    {
      header: 'Nombre',
      sortValue: (user) => user.person ? `${user.person.firstName} ${user.person.lastName}` : '',
      render: (user) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {user.person ? `${user.person.firstName} ${user.person.lastName}` : '—'}
        </span>
      ),
    },
    {
      header: 'Correo',
      sortValue: (user) => user.corporateEmail,
      render: (user) => user.corporateEmail,
    },
    {
      header: 'Rol',
      sortValue: (user) => user.role?.name ?? '',
      render: (user) => user.role?.name ?? '—',
    },
    {
      header: 'Estado',
      sortValue: (user) => (user.isActive ? 'Activo' : 'Inactivo'),
      render: (user) => (
        <button
          onClick={() => openConfirm(user, 'toggle')}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
            user.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {user.isActive ? 'Activo' : 'Inactivo'}
        </button>
      ),
    },
    {
      header: 'Acciones',
      render: (user) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(user)} className="p-1.5 text-gray-500 hover:text-brand-500 transition" title="Editar">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openConfirm(user, 'reset')} className="p-1.5 text-gray-500 hover:text-yellow-500 transition" title="Resetear contraseña">
            🔑
          </button>
          <button onClick={() => openConfirm(user, 'delete')} className="p-1.5 text-gray-500 hover:text-red-500 transition" title="Eliminar">
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Usuarios" description="Gestión de usuarios del sistema" />
      <PageBreadCrumb pageTitle="Usuarios" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.05]">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Lista de Usuarios</h3>
          <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>
            Nuevo Usuario
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          error={error}
          emptyMessage="No hay usuarios registrados."
          keyExtractor={(u) => u.id}
        />
      </div>

      {/* Form Modal */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setFormError(null); }} className="max-w-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h4>
        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {formError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          {editingUser ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  value={editForm.corporateEmail ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, corporateEmail: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <select
                  value={editForm.roleCode ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, roleCode: e.target.value as CreateUserDto['roleCode'] })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  value={form.corporateEmail}
                  onChange={(e) => setForm({ ...form, corporateEmail: e.target.value })}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={form.passwordHash}
                  onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <select
                  value={form.roleCode}
                  onChange={(e) => setForm({ ...form, roleCode: e.target.value as CreateUserDto['roleCode'] })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ROLE_CODES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <hr className="border-gray-100 dark:border-gray-700" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Datos de la persona</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.person.firstName}
                    onChange={(e) => setForm({ ...form, person: { ...form.person, firstName: e.target.value } })}
                    placeholder="Juan"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={form.person.lastName}
                    onChange={(e) => setForm({ ...form, person: { ...form.person, lastName: e.target.value } })}
                    placeholder="Pérez"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Documento</label>
                  <select
                    value={form.person.documentType}
                    onChange={(e) => setForm({ ...form, person: { ...form.person, documentType: e.target.value as 'DNI' | 'PASSPORT' | 'RUC' } })}
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
                    value={form.person.documentNumber}
                    onChange={(e) => setForm({ ...form, person: { ...form.person, documentNumber: e.target.value } })}
                    placeholder="72345678"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </>
          )}
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

      {/* Reset Password Result Modal */}
      <Modal isOpen={resetPasswordOpen} onClose={() => { setResetPasswordOpen(false); setCopied(false); }} className="max-w-md p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Contraseña restablecida
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Se generó una nueva contraseña para <span className="font-medium text-gray-700 dark:text-gray-300">{resetPasswordData?.email}</span>. Cópiala y compártela de forma segura.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
          <span className="flex-1 font-mono text-base tracking-widest text-gray-800 dark:text-white select-all">
            {resetPasswordData?.password}
          </span>
          <button
            onClick={() => {
              if (!resetPasswordData) return;
              navigator.clipboard.writeText(resetPasswordData.password);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition bg-brand-500 text-white hover:bg-brand-600 active:scale-95"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={() => { setResetPasswordOpen(false); setCopied(false); }}>Cerrar</Button>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={confirming}
        title={confirmMessages[confirmType]?.title ?? ''}
        message={confirmMessages[confirmType]?.message ?? ''}
      />
    </>
  );
}
