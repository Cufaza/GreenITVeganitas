import { useEffect, useRef } from 'react';

/** Sumar's custom cursor (dot that eases toward the pointer and grows over interactive elements). Fine pointers only. */
export default function Cursor({ rootRef }) {
  const cursorRef = useRef(null);

  useEffect(() => {
    const c = cursorRef.current;
    const root = rootRef.current;
    if (!c || !root) return undefined;
    const mq = window.matchMedia('(pointer: fine) and (min-width: 861px)');
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let enabled = false;

    const loop = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * 0.28;
      y += dy * 0.28;
      c.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (c.style.opacity !== '1') {
        x = tx;
        y = ty;
        c.style.opacity = '1';
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const hot = (e) => e.target.closest?.('.magnet, button, a, summary, label');
    const onOver = (e) => hot(e) && c.classList.add('lg');
    const onOut = (e) => hot(e) && c.classList.remove('lg');
    const onLeave = () => { c.style.opacity = '0'; };

    const enable = () => {
      if (enabled) return;
      enabled = true;
      root.classList.add('has-cursor');
      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseover', onOver, { passive: true });
      document.addEventListener('mouseout', onOut, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    };
    const disable = () => {
      if (!enabled) return;
      enabled = false;
      root.classList.remove('has-cursor');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      c.style.opacity = '0';
    };
    const sync = () => (mq.matches ? enable() : disable());
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      disable();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);

  return <div className="cursor" ref={cursorRef} aria-hidden="true" style={{ opacity: 0 }} />;
}
