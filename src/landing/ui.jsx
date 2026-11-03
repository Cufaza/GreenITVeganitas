import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

/** Primary CTA: starts the demo session, or goes to the panel if the user is already logged in. */
export function PrimaryCta({ cta, className, children = 'Probar la demo' }) {
  if (cta.user) {
    return <Link to="/panel" className={cx('btn-primary magnet', className)}>Ir al panel <span aria-hidden="true">→</span></Link>;
  }
  return (
    <button type="button" className={cx('btn-primary magnet', className)} onClick={cta.startDemo} disabled={cta.busy || cta.loading}>
      {cta.busy && <Loader2 className="spin" aria-hidden="true" />}
      {cta.busy ? 'Abriendo la demo…' : children}
    </button>
  );
}

/** "Ingresar" text link (hidden when there is a session). */
export function SecondaryCta({ cta, className = 'link-sec magnet' }) {
  if (cta.user) return null;
  return <Link to="/login" className={className}>Ingresar <span className="arr" aria-hidden="true">→</span></Link>;
}

export const CtaError = ({ cta }) => (cta.error ? <p role="alert" className="cta-error">{cta.error}</p> : null);

/** Watti avatar with PNG fallback. */
export function WattiAvatar({ size = 30, className }) {
  const [src, setSrc] = useState('/watti.svg');
  return <img src={src} onError={() => setSrc('/watti_128.png')} width={size} height={size} alt="" className={className} />;
}

/** Sumar's RevealObserver: adds `.in` to every `.reveal` once it is 12% visible. Scoped to the landing root. */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = root.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/** Cached prefers-reduced-motion query (reactive). */
export function useReducedMotionQuery() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}

export const useLatest = (value) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
