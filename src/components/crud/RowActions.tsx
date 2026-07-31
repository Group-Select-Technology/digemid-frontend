import type { ReactNode } from 'react';

export interface RowAction {
  icon: ReactNode;
  title: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export default function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <button
          key={action.title}
          onClick={action.onClick}
          title={action.title}
          disabled={action.disabled}
          className={`rounded p-1.5 text-gray-500 transition disabled:cursor-not-allowed disabled:opacity-40 ${
            action.tone === 'danger' ? 'hover:text-red-500' : 'hover:text-brand-500'
          }`}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
