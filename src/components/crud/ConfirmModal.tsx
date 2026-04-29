import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {title}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
