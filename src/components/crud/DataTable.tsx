import { useState, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/table';

export interface Column<T> {
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
  tableClassName?: string;
  getRowProps?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
  rowClassName?: (row: T, index: number) => string;
  /** Si es `false`, no se ordena al hacer clic en el encabezado (útil cuando el orden lo define el arrastre). */
  sortable?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No hay registros.',
  keyExtractor,
  tableClassName,
  getRowProps,
  rowClassName,
  sortable = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (header: string) => {
    if (sortKey === header) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(header);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortable || !sortKey) return data;
    const col = columns.find((c) => c.header === sortKey);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, columns, sortable]);

  if (loading) {
    return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>;
  }

  if (error) {
    return <p className="p-6 text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <Table className={tableClassName}>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            {columns.map((col) => {
              const canSort = sortable && !!col.sortValue;
              return (
                <th
                  key={col.header}
                  onClick={canSort ? () => handleSort(col.header) : undefined}
                  className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 capitalize uppercase ${
                    canSort
                      ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                      : ''
                  } ${col.className ?? ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {canSort && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {sortKey === col.header ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const { className: extraClass, ...rowProps } = getRowProps?.(row, index) ?? {};
              const className = [rowClassName?.(row, index), extraClass].filter(Boolean).join(' ');

              return (
                <TableRow key={keyExtractor(row)} className={className || undefined} {...rowProps}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.header}
                      className={`px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300 capitalize ${col.className ?? ''}`}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
