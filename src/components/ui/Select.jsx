import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './UIComponents.jsx';

const ITEM_H = 36;
const MAX_H = 260;

/** Replacement for native <select>: portaled dropdown that flips up when needed. */
export function Select({ value, onChange, options, placeholder = 'Elegí…', className, disabled = false, id }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = Math.min(options.length * ITEM_H + 8, MAX_H);
    const flip = r.bottom + h > window.innerHeight && r.top - h > 0;
    setCoords({ top: flip ? r.top - h - 4 : r.bottom + 4, left: r.left, width: r.width });
  }, [options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, place]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative w-full">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { if (!open) place(); setOpen((o) => !o); }}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          open && 'ring-2 ring-ring ring-offset-2',
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>
      {open && createPortal(
        <div
          ref={popupRef}
          role="listbox"
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[90] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="max-h-[260px] overflow-y-auto p-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                  o.value === value ? 'bg-accent font-medium text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <span>{o.label}</span>
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-brand" />}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default Select;
