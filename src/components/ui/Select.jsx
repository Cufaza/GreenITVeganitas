import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './UIComponents.jsx';

const ITEM_H = 36;
const MAX_H = 260;
const TYPEAHEAD_MS = 500;

/**
 * Replacement for native <select>: portaled dropdown that flips up when needed.
 * Keyboard (ARIA listbox, focus stays on the trigger): ArrowUp/Down, Home/End,
 * Enter/Space to pick, Escape/Tab to close, type-ahead by label.
 */
export function Select({ value, onChange, options, placeholder = 'Elegí…', className, disabled = false, id }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const h = Math.min(options.length * ITEM_H + 8, MAX_H);
    const flip = r.bottom + h > window.innerHeight && r.top - h > 0;
    setCoords({ top: flip ? r.top - h - 4 : r.bottom + 4, left: r.left, width: r.width });
  }, [options.length]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const openAt = (index) => {
    place();
    setActive(index);
    setOpen(true);
  };
  const close = () => { setOpen(false); setActive(-1); };
  const pick = (index) => {
    const o = options[index];
    if (o) onChange(o.value);
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popupRef.current?.contains(e.target)) return;
      close();
    };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, place]);

  // Keep the active option visible while navigating with the keyboard.
  useEffect(() => {
    if (open && active >= 0) popupRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const typeahead = (char) => {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : '') + char.toLowerCase(), at: now };
    const q = typed.current.text;
    const from = open ? active : selectedIndex;
    // Search after the current option first, then wrap around.
    const order = options.map((_, i) => (from + 1 + i) % options.length);
    const hit = order.find((i) => options[i].label.toLowerCase().startsWith(q))
      ?? order.find((i) => options[i].label.toLowerCase().startsWith(q[0]));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else onChange(options[hit].value); // closed: like a native select, change in place
  };

  const onKeyDown = (e) => {
    if (disabled || !options.length) return;
    const last = options.length - 1;
    const start = selectedIndex >= 0 ? selectedIndex : 0;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openAt(start);
        else setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openAt(start);
        else setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActive(last); }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) pick(active);
        else openAt(start);
        break;
      case 'Escape':
        if (open) { e.preventDefault(); e.stopPropagation(); close(); }
        break;
      case 'Tab':
        if (open) close();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
    }
  };

  const optionId = (i) => `${listId}-opt-${i}`;

  return (
    <div className="relative w-full">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        onClick={() => (open ? close() : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={onKeyDown}
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
          id={listId}
          role="listbox"
          aria-labelledby={id}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          className="z-[90] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="max-h-[260px] overflow-y-auto p-1">
            {options.map((o, i) => (
              <div
                key={o.value}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={o.value === value}
                // mousedown would blur the trigger and move focus away; keep it on the trigger
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(i)}
                className={cn(
                  'flex w-full cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                  i === active && 'bg-accent text-accent-foreground',
                  o.value === value && 'font-medium',
                )}
              >
                <span>{o.label}</span>
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-brand" />}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default Select;
