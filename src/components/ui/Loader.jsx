import { Leaf } from 'lucide-react';
import { cn } from './UIComponents.jsx';

const SIZES = {
  sm: { ring: 'h-14 w-14', bubble: 'h-10 w-10', icon: 'h-4 w-4', text: 'text-xs' },
  md: { ring: 'h-[4.5rem] w-[4.5rem]', bubble: 'h-14 w-14', icon: 'h-6 w-6', text: 'text-sm' },
  lg: { ring: 'h-24 w-24', bubble: 'h-[4.5rem] w-[4.5rem]', icon: 'h-9 w-9', text: 'text-base' },
};

/** Brand loader: leaf + halo + spinning ring. Canonical page/list loading state. */
export function Loader({ text, subtext, size = 'md', className }) {
  const s = SIZES[size];
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center text-center animate-in fade-in duration-500', className)}>
      <div className={cn('relative', s.ring)}>
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
        <div className={cn('absolute inset-0 m-auto flex items-center justify-center rounded-full border border-brand/10 bg-background shadow-sm', s.bubble)}>
          <Leaf className={cn('animate-pulse text-brand', s.icon)} />
        </div>
      </div>
      {text && <p className={cn('mt-4 font-medium text-muted-foreground', s.text)}>{text}</p>}
      {subtext && <p className="mt-1 text-xs text-muted-foreground/70">{subtext}</p>}
    </div>
  );
}

export default Loader;
