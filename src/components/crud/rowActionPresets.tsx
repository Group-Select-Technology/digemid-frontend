import { EyeIcon, PencilIcon, TrashBinIcon } from '../../icons';
import type { RowAction } from './RowActions';

export const viewAction = (onClick: () => void, title = 'Ver detalles'): RowAction => ({
  icon: <EyeIcon className="h-4 w-4" />,
  title,
  onClick,
});

export const editAction = (onClick: () => void, title = 'Editar'): RowAction => ({
  icon: <PencilIcon className="h-4 w-4" />,
  title,
  onClick,
});

export const deleteAction = (onClick: () => void, title = 'Eliminar'): RowAction => ({
  icon: <TrashBinIcon className="h-4 w-4" />,
  title,
  onClick,
  tone: 'danger',
});
