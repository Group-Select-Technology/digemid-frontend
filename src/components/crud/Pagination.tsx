import Button from '../ui/button/Button';
import type { PaginationMeta } from '../../types';

interface PaginationProps {
  meta: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const MAX_PAGE_PILLS = 5;

export default function Pagination({
  meta,
  page,
  onPageChange,
  itemLabel = 'registros',
}: PaginationProps) {
  if (meta.totalItems === 0) return null;

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > meta.totalPages || newPage === page) return;
    onPageChange(newPage);
  };

  const firstItem = (meta.currentPage - 1) * meta.itemsPerPage + 1;
  const lastItem = Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems);

  const pills = Array.from({ length: Math.min(MAX_PAGE_PILLS, meta.totalPages) }, (_, i) => {
    const end = Math.min(meta.totalPages, Math.max(1, page - 2) + MAX_PAGE_PILLS - 1);
    const start = Math.max(1, end - MAX_PAGE_PILLS + 1);
    return start + i;
  });

  return (
    <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {firstItem.toLocaleString()}
        {'–'}
        {lastItem.toLocaleString()}
        {' de '}
        {meta.totalItems.toLocaleString()} {itemLabel}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="outline" onClick={() => goToPage(1)} disabled={page === 1}>
          «
        </Button>
        <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
          ← Anterior
        </Button>
        {pills.map((pill) => (
          <button
            key={pill}
            onClick={() => goToPage(pill)}
            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition ${
              pill === page
                ? 'bg-brand-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {pill}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => goToPage(page + 1)}
          disabled={page >= meta.totalPages}
        >
          Siguiente →
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => goToPage(meta.totalPages)}
          disabled={page >= meta.totalPages}
        >
          »
        </Button>
      </div>
    </div>
  );
}
