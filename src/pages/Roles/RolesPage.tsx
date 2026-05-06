import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extractApiError } from '../../utils/apiError';
import { rolesService } from '../../services/rolesService';
import type { Role, CreateRoleDto, UpdateRoleDto } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/crud/ConfirmModal';
import { PencilIcon, PlusIcon } from '../../icons';
import CanAccess from '../../components/auth/CanAccess';

const ROLE_CODES = ['ADMIN', 'SOPORTE', 'DESARROLLO'] as const;
const emptyForm: CreateRoleDto = { code: 'ADMIN', name: '', description: '' };

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form, setForm] = useState<CreateRoleDto>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetRole, setTargetRole] = useState<Role | null>(null);
    const [confirming, setConfirming] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await rolesService.getAll();
            setRoles(data);
        } catch {
            setError('Error al cargar los roles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoles(); }, []);

    const openCreate = () => { setEditingRole(null); setForm(emptyForm); setFormError(null); setFormOpen(true); };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setForm({ code: role.code, name: role.name, description: role.description });
        setFormError(null);
        setFormOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingRole) {
                const dto: UpdateRoleDto = { name: form.name, description: form.description };
                await rolesService.update(editingRole.id, dto);
                toast.success('Rol actualizado correctamente.');
            } else {
                await rolesService.create(form);
                toast.success('Rol creado correctamente.');
            }
            setFormOpen(false);
            fetchRoles();
        } catch (err) {
            const msg = extractApiError(err) ?? 'Error al guardar el rol.';
            setFormError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const openToggleStatus = (role: Role) => { setTargetRole(role); setConfirmOpen(true); };

    const handleConfirm = async () => {
        if (!targetRole) return;
        setConfirming(true);
        try {
            await rolesService.updateStatus(targetRole.id, !targetRole.isActive);
            toast.success(`Rol ${!targetRole.isActive ? 'activado' : 'desactivado'} correctamente.`);
            setConfirmOpen(false);
            fetchRoles();
        } catch {
            toast.error('Error al cambiar el estado del rol.');
        } finally {
            setConfirming(false);
        }
    };

    const columns: Column<Role>[] = [
        {
            header: '#',
            className: 'w-12',
            sortValue: (role) => role.id,
            render: (role) => <span className="text-gray-500 dark:text-gray-400">{role.id}</span>,
        },
        {
            header: 'Código',
            sortValue: (role) => role.code,
            render: (role) => <span className="font-medium text-gray-800 dark:text-white/90">{role.code}</span>,
        },
        {
            header: 'Nombre',
            sortValue: (role) => role.name,
            render: (role) => role.name,
        },
        {
            header: 'Descripción',
            sortValue: (role) => role.description ?? '',
            render: (role) => (
                <span className="block truncate max-w-xs text-gray-500 dark:text-gray-400">{role.description}</span>
            ),
        },
        {
            header: 'Estado',
            sortValue: (role) => (role.isActive ? 'Activo' : 'Inactivo'),
            render: (role) => (
                <CanAccess roles={['ADMIN']}>
                    <button
                        onClick={() => openToggleStatus(role)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition ${role.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                    >
                        {role.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                </CanAccess>
            ),
        },
        {
            header: 'Acciones',
            render: (role) => (
                <CanAccess roles={['ADMIN']}>
                    <button
                        onClick={() => openEdit(role)}
                        className="p-1.5 text-gray-500 hover:text-brand-500 transition"
                        title="Editar"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </CanAccess>
            ),
        },
    ];

    return (
        <>
            <PageMeta title="Roles" description="Gestión de roles del sistema" />
            <PageBreadCrumb pageTitle="Roles" />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.05]">
                    <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Lista de Roles</h3>
                    <CanAccess roles={['ADMIN']}>
                        <Button size="sm" onClick={openCreate} startIcon={<PlusIcon className="w-4 h-4" />}>
                            Nuevo Rol
                        </Button>
                    </CanAccess>
                </div>

                <DataTable
                    columns={columns}
                    data={roles}
                    loading={loading}
                    error={error}
                    emptyMessage="No hay roles registrados."
                    keyExtractor={(r) => r.id}
                />
            </div>

            {/* Form Modal */}
            <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setFormError(null); }} className="max-w-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
                    {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                </h4>
                {formError && (
                    <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {formError}
                    </div>
                )}
                <div className="flex flex-col gap-4">
                    {!editingRole && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                            <select
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value as CreateRoleDto['code'] })}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {ROLE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: Administrador"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Descripción del rol..."
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                loading={confirming}
                title={targetRole?.isActive ? 'Desactivar Rol' : 'Activar Rol'}
                message={`¿Estás seguro de que deseas ${targetRole?.isActive ? 'desactivar' : 'activar'} el rol "${targetRole?.name}"?`}
            />
        </>
    );
}
