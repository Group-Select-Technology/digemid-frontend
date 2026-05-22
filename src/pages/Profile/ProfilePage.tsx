import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { EyeCloseIcon, EyeIcon } from '../../icons';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { changePassword, getProfile, type UserProfile } from '../../services/authService';
import { extractApiError } from '../../utils/apiError';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordVisibility = Record<keyof PasswordForm, boolean>;

type PasswordFormErrors = Partial<Record<keyof PasswordForm, string>>;

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const initialPasswordVisibility: PasswordVisibility = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

function validatePasswordForm(form: PasswordForm): PasswordFormErrors {
  const errors: PasswordFormErrors = {};

  if (!form.currentPassword.trim()) {
    errors.currentPassword = 'Ingresa tu contraseña actual.';
  } else if (form.currentPassword.length < 8) {
    errors.currentPassword = 'La contraseña actual debe tener al menos 8 caracteres.';
  }

  if (!form.newPassword.trim()) {
    errors.newPassword = 'Ingresa tu nueva contraseña.';
  } else if (form.newPassword.length < 8) {
    errors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres.';
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (!form.confirmPassword.trim()) {
    errors.confirmPassword = 'Repite la nueva contraseña.';
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>(initialPasswordVisibility);
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => toast.error('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: undefined }));
  };

  const togglePasswordVisibility = (field: keyof PasswordForm) => {
    setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
  };

  const closePasswordForm = () => {
    if (savingPassword) return;

    setIsPasswordFormOpen(false);
    setPasswordForm(initialPasswordForm);
    setPasswordVisibility(initialPasswordVisibility);
    setPasswordErrors({});
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validatePasswordForm(passwordForm);
    if (Object.keys(validationErrors).length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    setSavingPassword(true);
    let shouldLogout = false;

    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      shouldLogout = true;
      toast.success(`${response.message}. Vuelve a iniciar sesión.`);
      logout();
    } catch (err) {
      toast.error(extractApiError(err) ?? 'No se pudo actualizar la contraseña.');
    } finally {
      if (!shouldLogout) {
        setSavingPassword(false);
      }
    }
  };

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

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-700 dark:text-white/80">
                    Cambiar contraseña
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Ingresa tu contraseña actual y define una nueva.
                  </p>
                </div>

                {!isPasswordFormOpen ? (
                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    onClick={() => setIsPasswordFormOpen(true)}
                  >
                    Actualizar
                  </Button>
                ) : null}
              </div>

              {isPasswordFormOpen ? (
                <form
                  className="mt-6 space-y-5 border-t border-gray-100 pt-6 dark:border-gray-800"
                  onSubmit={handlePasswordSubmit}
                >
                  <div>
                    <Label htmlFor="currentPassword">
                      Contraseña actual <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={passwordVisibility.currentPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña actual"
                        value={passwordForm.currentPassword}
                        onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                        error={Boolean(passwordErrors.currentPassword)}
                        hint={passwordErrors.currentPassword}
                        disabled={savingPassword}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-5 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => togglePasswordVisibility('currentPassword')}
                        disabled={savingPassword}
                        aria-label={passwordVisibility.currentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                      >
                        {passwordVisibility.currentPassword ? (
                          <EyeIcon className="size-5 fill-current" />
                        ) : (
                          <EyeCloseIcon className="size-5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">
                      Nueva contraseña <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={passwordVisibility.newPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu nueva contraseña"
                        value={passwordForm.newPassword}
                        onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                        error={Boolean(passwordErrors.newPassword)}
                        hint={passwordErrors.newPassword}
                        disabled={savingPassword}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-5 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => togglePasswordVisibility('newPassword')}
                        disabled={savingPassword}
                        aria-label={passwordVisibility.newPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                      >
                        {passwordVisibility.newPassword ? (
                          <EyeIcon className="size-5 fill-current" />
                        ) : (
                          <EyeCloseIcon className="size-5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Repetir nueva contraseña <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                        placeholder="Repite la nueva contraseña"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                        error={Boolean(passwordErrors.confirmPassword)}
                        hint={passwordErrors.confirmPassword}
                        disabled={savingPassword}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-5 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        disabled={savingPassword}
                        aria-label={passwordVisibility.confirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                      >
                        {passwordVisibility.confirmPassword ? (
                          <EyeIcon className="size-5 fill-current" />
                        ) : (
                          <EyeCloseIcon className="size-5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                      onClick={closePasswordForm}
                      disabled={savingPassword}
                    >
                      Cancelar
                    </button>
                    <Button className="w-full sm:w-auto" size="sm" disabled={savingPassword}>
                      {savingPassword ? 'Actualizando...' : 'Guardar nueva contraseña'}
                    </Button>
                  </div>
                </form>
              ) : null}
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
