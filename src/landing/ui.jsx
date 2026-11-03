import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

/** Text reveal: adds `.in` once the element is 12% visible, then stops observing. */
export function Reveal({ as: Tag = 'div', d = 0, className, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cx('reveal', d ? `d${d}` : '', shown && 'in', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHead({ eyebrow, title, lead, center = false, id }) {
  return (
    <div className={cx('l-head', center && 'center')}>
      <Reveal as="p" className="l-eyebrow">{eyebrow}</Reveal>
      <Reveal as="h2" d={1} className="l-h2" id={id}>{title}</Reveal>
      {lead && <Reveal as="p" d={2} className="l-lead">{lead}</Reveal>}
    </div>
  );
}

/** Primary CTA: starts the demo session, or goes to the panel if the user is already logged in. */
export function PrimaryCta({ cta, className, children = 'Probar la demo' }) {
  if (cta.user) {
    return <Link to="/panel" className={cx('l-btn l-btn-primary', className)}>Ir al panel <ArrowRight aria-hidden="true" /></Link>;
  }
  return (
    <button type="button" className={cx('l-btn l-btn-primary', className)} onClick={cta.startDemo} disabled={cta.busy || cta.loading}>
      {cta.busy && <Loader2 className="l-spin" aria-hidden="true" />}
      {cta.busy ? 'Abriendo la demo…' : children}
    </button>
  );
}

export function SecondaryCta({ cta }) {
  if (cta.user) return null;
  return <Link to="/login" className="l-link-arrow">Ingresar <ArrowRight aria-hidden="true" /></Link>;
}

export const CtaError = ({ cta }) => (cta.error ? <p role="alert" className="l-error">{cta.error}</p> : null);

/** Watti avatar with PNG fallback. */
export function WattiAvatar({ size = 30, className }) {
  const [src, setSrc] = useState('/watti.svg');
  return <img src={src} onError={() => setSrc('/watti_128.png')} width={size} height={size} alt="" className={className} />;
}
