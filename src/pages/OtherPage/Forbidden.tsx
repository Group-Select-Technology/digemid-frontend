import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function Forbidden() {
  return (
    <>
      <PageMeta
        title="403 | Acceso denegado"
        description="No tienes permisos para acceder a esta sección"
      />
      <div className="relative z-1 flex min-h-[70vh] flex-col items-center justify-center overflow-hidden p-6">
        <GridShape />
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
            Acceso Denegado
          </h1>

          <img src="/images/error/403.svg" alt="403 Forbidden" className="dark:hidden" />
          <img
            src="/images/error/403-dark.svg"
            alt="403 Forbidden"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            No tienes permisos para acceder a esta sección.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </>
  );
}
