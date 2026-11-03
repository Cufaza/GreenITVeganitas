import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button, cn } from './ui/UIComponents.jsx';
import { backdropClose } from './ui/backdropClose.js';

/** Centered alert dialog: replaces window.confirm(). */
export default function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'default' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const danger = variant === 'danger';
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" {...backdropClose(onClose)}>
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-xl border bg-background shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center p-8 text-center">
          <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', danger ? 'bg-red-100 text-red-600' : 'bg-brand/10 text-brand')}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold">{title}</h3>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={onClose}>{cancelText}</Button>
            <Button variant={danger ? 'destructive' : 'default'} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
