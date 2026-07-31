import type { ReactNode } from 'react';

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const hoverClasses: Record<Tone, string> = {
  success: 'hover:bg-green-200 dark:hover:bg-green-900/50',
  danger: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  warning: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  info: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
  neutral: 'hover:bg-gray-200 dark:hover:bg-gray-700',
};

type Size = 'sm' | 'md';

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-0.5 text-xs font-medium',
  md: 'px-3 py-1.5 text-xs font-semibold',
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  onClick?: () => void;
  title?: string;
}

export default function StatusBadge({
  children,
  tone = 'neutral',
  size = 'sm',
  onClick,
  title,
}: StatusBadgeProps) {
  const className = `inline-flex items-center gap-1 rounded-full whitespace-nowrap ${sizeClasses[size]} ${toneClasses[tone]}`;

  if (!onClick) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return (
    <button onClick={onClick} title={title} className={`${className} ${hoverClasses[tone]} transition`}>
      {children}
    </button>
  );
}
