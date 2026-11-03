import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing.css';
import { useAuth } from '../context/AuthContext.jsx';
import Nav from './Nav.jsx';
import Hero from './Hero.jsx';
import Proof from './Proof.jsx';
import Problem from './Problem.jsx';
import Features from './Features.jsx';
import Case from './Case.jsx';
import Ods from './Ods.jsx';
import Transparency from './Transparency.jsx';
import Pricing from './Pricing.jsx';
import Faq from './Faq.jsx';
import FinalCta from './FinalCta.jsx';
import Footer from './Footer.jsx';

const FONTS = 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Playfair+Display:ital,wght@1,700&display=swap';
const BG = '#070b10';

export default function Landing() {
  const { user, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lenisRef = useRef(null);

  const startDemo = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await loginDemo();
      navigate('/panel');
    } catch (e) {
      setError(e?.message || 'No pudimos abrir la demo. Probá de nuevo.');
      setBusy(false);
    }
  }, [loginDemo, navigate]);
  const cta = { user, busy, error, startDemo };

  // Landing-only page setup: fonts, dark canvas behind overscroll, anchor offset. All undone on unmount.
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS;
    document.head.appendChild(link);
    const html = document.documentElement;
    const prev = [html.style.background, document.body.style.background, html.style.scrollPaddingTop];
    html.style.background = BG;
    document.body.style.background = BG;
    html.style.scrollPaddingTop = '96px';
    return () => {
      link.remove();
      [html.style.background, document.body.style.background, html.style.scrollPaddingTop] = prev;
    };
  }, []);

  // Smooth scroll (Lenis), disabled under prefers-reduced-motion; destroyed on unmount.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)) });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const onMenuChange = useCallback((open) => {
    if (open) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, []);

  // Anchor links: with Lenis active, scroll through it (scroll-padding-top covers the native case)
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    const lenis = lenisRef.current;
    if (!a || !lenis || a.getAttribute('href').length < 2) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.history.pushState(null, '', a.getAttribute('href'));
    lenis.scrollTo(target, { offset: -84 });
  };

  return (
    <div className="landing" onClick={onClick}>
      <div className="l-grain" aria-hidden="true" />
      <a href="#contenido" className="l-skip">Saltar al contenido</a>
      <Nav cta={cta} onMenuChange={onMenuChange} />
      <main id="contenido">
        <Hero cta={cta} />
        <Proof />
        <Problem />
        <Features />
        <Case />
        <Ods />
        <Transparency />
        <Pricing />
        <Faq />
        <FinalCta cta={cta} />
      </main>
      <Footer user={user} />
    </div>
  );
}
