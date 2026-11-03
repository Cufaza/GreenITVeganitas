import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes resolving conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MODAL_DURATION = 200;

/** Keeps a modal mounted during its exit animation. */
export function useModalAnimation(isOpen) {
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => { setVisible(false); setClosing(false); }, MODAL_DURATION);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    visible,
    overlayClass: closing ? 'overlay-exit' : 'overlay-enter',
    modalClass: closing ? 'modal-exit' : 'modal-enter',
  };
}

/* ── Card ── */
export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-lg border bg-card text-card-foreground shadow-sm print-break-avoid', className)} {...props} />
));
export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
));
export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

/* ── Button ── */
const BUTTON_VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  brand: 'bg-brand text-brand-foreground hover:bg-brand/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};
const BUTTON_SIZES = { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-md px-3', lg: 'h-11 rounded-md px-8', icon: 'h-10 w-10' };

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      BUTTON_VARIANTS[variant],
      BUTTON_SIZES[size],
      className,
    )}
    {...props}
  />
));

/* ── Input / Label ── */
export const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      type === 'number' && '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
      className,
    )}
    {...props}
  />
));

export const Label = ({ className, ...props }) => (
  <label className={cn('mb-1 block text-xs font-medium text-muted-foreground', className)} {...props} />
);

/** Label + control stacked, canonical form field. */
export const Field = ({ label, htmlFor, className, children }) => (
  <div className={className}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

/* ── Badge ── */
const BADGE_VARIANTS = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  brand: 'border-transparent bg-brand/10 text-brand',
  warning: 'border-transparent bg-amber-100 text-amber-700',
  outline: 'text-foreground',
};
export const Badge = ({ className, variant = 'default', ...props }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', BADGE_VARIANTS[variant], className)} {...props} />
);

/* ── Table ── */
export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-[13px]', className)} {...props} />
  </div>
));
export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:hover:bg-transparent', className)} {...props} />
));
export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
export const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn('border-t-2 border-foreground/15 bg-muted/40 font-semibold [&_tr]:hover:bg-transparent', className)} {...props} />
));
export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b transition-colors hover:bg-muted/50', className)} {...props} />
));
export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', className)} {...props} />
));
export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />
));

/* ── Page header (title + subtitle + actions) ── */
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 lg:justify-end print:hidden">{actions}</div>}
  </div>
);

/* ── Section title (brand icon + uppercase text) ── */
export const SectionTitle = ({ icon: Icon, children, right }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-brand" />}
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</h2>
    </div>
    {right}
  </div>
);

/* ── Empty state ── */
export const EmptyState = ({ icon: Icon, title, children, actions }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center">
    {Icon && (
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
        <Icon className="h-8 w-8 text-brand" />
      </div>
    )}
    <p className="text-base font-semibold">{title}</p>
    {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
  </div>
);
