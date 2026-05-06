import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProfile, type UserProfile } from '../../services/authService';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => toast.error('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageMeta title="Mi perfil" description="Información de tu cuenta" />
      <PageBreadCrumb pageTitle="Mi perfil" />

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar + name */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
                  <span className="text-3xl font-bold text-brand-600 dark:text-brand-300">
                    {profile.person.firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 capitalize">
                    {profile.person.firstName} {profile.person.lastName}
                  </h2>
                  <span className="mt-1 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-sm font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 capitalize">
                    {profile.role.name}
                  </span>
                  <span className={`ml-2 inline-block rounded-full px-3 py-0.5 text-sm font-medium ${
                    profile.isActive
                      ? 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                      : 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-400'
                  }`}>
                    {profile.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-white/80">
                Información de cuenta
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Correo corporativo
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Rol
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90 capitalize">{profile.role.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Código de rol
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{profile.role.code}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Último acceso
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">
                    {profile.lastLogin
                      ? new Date(profile.lastLogin).toLocaleString('es-PE')
                      : 'Nunca'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Personal info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-white/80">
                Datos personales
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Nombres
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90 capitalize">{profile.person.firstName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Apellidos
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90 capitalize">{profile.person.lastName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Tipo de documento
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{profile.person.documentType}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Número de documento
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{profile.person.documentNumber}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-20">
            No se pudo cargar la información del perfil.
          </p>
        )}
      </div>
    </>
  );
}
