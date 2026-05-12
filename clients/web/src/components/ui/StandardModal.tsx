import { ActionButton } from './ActionButton';

export function StandardModal({
  title,
  copy,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  copy: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="decision-modal">
      <div className="decision-modal__panel">
        <div className="decision-modal__title">{title}</div>
        <div className="decision-modal__copy">{copy}</div>
        <div className="decision-modal__actions">
          {cancelLabel && onCancel ? (
            <ActionButton quiet onClick={onCancel}>
              {cancelLabel}
            </ActionButton>
          ) : null}
          <ActionButton onClick={onConfirm}>{confirmLabel}</ActionButton>
        </div>
      </div>
    </div>
  );
}
