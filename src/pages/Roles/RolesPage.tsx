import { useEffect, useState } from 'react';
import { rolesService } from '../../services/rolesService';
import type { Role } from '../../types';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import DataTable, { type Column } from '../../components/crud/DataTable';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchRoles();
  }, []);

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
      render: (role) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{role.code}</span>
      ),
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
        <span className="block max-w-xs truncate text-gray-500 dark:text-gray-400">
          {role.description}
        </span>
      ),
    },
    {
      header: 'Estado',
      sortValue: (role) => (role.isActive ? 'Activo' : 'Inactivo'),
      render: (role) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            role.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {role.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Roles" description="Consulta de roles del sistema" />
      <PageBreadCrumb pageTitle="Roles" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-white/[0.05]">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Lista de Roles</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Vista de solo lectura
          </p>
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
    </>
  );
}
