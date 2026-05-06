import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { digemidService } from '../../services/digemidService';
import { usersService } from '../../services/usersService';
import { peopleService } from '../../services/peopleService';
import { BoxIcon, GroupIcon, UserIcon, DownloadIcon, ArrowRightIcon } from '../../icons';

interface Stats {
  totalDigemid: number | null;
  totalUsers: number | null;
  totalPeople: number | null;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  loading,
  icon,
  colorClass,
  link,
  linkLabel,
}: {
  title: string;
  value: number | null;
  loading: boolean;
  icon: React.ReactNode;
  colorClass: string;
  link: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        ) : value !== null ? (
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {value.toLocaleString('es-PE')}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No disponible</p>
        )}
      </div>
      <Link
        to={link}
        className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition"
      >
        {linkLabel}
        <ArrowRightIcon className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── Quick action link ────────────────────────────────────────────────────────
function QuickLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-500 dark:hover:text-brand-400 transition"
    >
      {icon}
      {label}
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const canSeeUsersAndPeople =
    user?.roleCode === 'ADMIN' || user?.roleCode === 'DESARROLLO';

  const [stats, setStats] = useState<Stats>({
    totalDigemid: null,
    totalUsers: null,
    totalPeople: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [digemidRes, usersRes, peopleRes] = await Promise.allSettled([
      digemidService.getAll({ limit: 1, offset: 0 }),
      canSeeUsersAndPeople ? usersService.getAll({ limit: 500 }) : Promise.resolve(null),
      canSeeUsersAndPeople ? peopleService.getAll({ limit: 500 }) : Promise.resolve(null),
    ]);

    setStats({
      totalDigemid:
        digemidRes.status === 'fulfilled' ? digemidRes.value.meta.totalItems : null,
      totalUsers:
        usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)
          ? usersRes.value.length
          : null,
      totalPeople:
        peopleRes.status === 'fulfilled' && Array.isArray(peopleRes.value)
          ? peopleRes.value.length
          : null,
    });
    setLoading(false);
  }, [canSeeUsersAndPeople]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const longitud = user?.fullName?.split(' ').length ?? 0;
  const firstName = user?.fullName?.split(' ')[0] ?? 'Usuario';
  const lastName = user?.fullName?.split(' ')[longitud - 2] ?? 'Usuario';

  return (
    <>
      <PageMeta title="Dashboard | DIGEMID" description="Panel principal del sistema" />

      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {greeting}, 
          <span className='capitalize'> {firstName} {lastName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Aquí tienes un resumen del sistema DIGEMID.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Productos DIGEMID"
          value={stats.totalDigemid}
          loading={loading}
          icon={<BoxIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          colorClass="bg-blue-50 dark:bg-blue-500/10"
          link="/digemid"
          linkLabel="Ver catálogo"
        />
        {canSeeUsersAndPeople && (
          <>
            <StatCard
              title="Usuarios del sistema"
              value={stats.totalUsers}
              loading={loading}
              icon={<UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              colorClass="bg-purple-50 dark:bg-purple-500/10"
              link="/usuarios"
              linkLabel="Gestionar usuarios"
            />
            <StatCard
              title="Personas registradas"
              value={stats.totalPeople}
              loading={loading}
              icon={<GroupIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              colorClass="bg-emerald-50 dark:bg-emerald-500/10"
              link="/personas"
              linkLabel="Ver personas"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
          Accesos rápidos
        </p>
        <div className="flex flex-wrap gap-3">
          <QuickLink
            to="/digemid"
            label="Catálogo DIGEMID"
            icon={<BoxIcon className="w-4 h-4" />}
          />
          {user?.roleCode === 'ADMIN' && (
            <QuickLink
              to="/digemid"
              label="Subir Excel"
              icon={<DownloadIcon className="w-4 h-4" />}
            />
          )}
          {canSeeUsersAndPeople && (
            <QuickLink
              to="/usuarios"
              label="Usuarios"
              icon={<UserIcon className="w-4 h-4" />}
            />
          )}
          {canSeeUsersAndPeople && (
            <QuickLink
              to="/personas"
              label="Personas"
              icon={<GroupIcon className="w-4 h-4" />}
            />
          )}
          <QuickLink
            to="/profile"
            label="Mi perfil"
            icon={<UserIcon className="w-4 h-4" />}
          />
        </div>
      </div>
    </>
  );
}
