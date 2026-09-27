import type { ReactNode } from 'react';

interface CalendarModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function CalendarModal({ title, onClose, children }: CalendarModalProps) {
  return (
    <div className="fcal-modal-mask" onClick={onClose}>
      <div className="fcal-modal" onClick={event => event.stopPropagation()}>
        <div className="fcal-modal-head">
          <strong>{title}</strong>
          <button type="button" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="fcal-modal-body">{children}</div>
      </div>
    </div>
  );
}
