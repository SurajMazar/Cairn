import { Dialog } from './Dialog';
import ui from '../styles/ui.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      initialFocus="none"
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${ui.btn} ${danger ? ui.btnDanger : ui.btnPrimary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--ink-muted)', maxWidth: '44ch' }}>{description}</p>
    </Dialog>
  );
}
