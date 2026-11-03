import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send, X } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { AVISO, FUERA_DE_ALCANCE, PREGUNTAS, SALUDO, interpretar, responder } from '../../lib/watti.js';
import { Button, Input, cn, useModalAnimation } from '../ui/UIComponents.jsx';

const TYPING_MS = 600;
const isMobile = () => window.matchMedia('(max-width: 639px)').matches;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Watti avatar (SVG, PNG fallback). `state`: idle | float | think | happy micro-animations. */
function Avatar({ className, state = 'idle' }) {
  const [src, setSrc] = useState('/watti.svg');
  return (
    <img
      src={src}
      onError={() => setSrc('/watti_128.png')}
      alt=""
      draggable={false}
      className={cn('shrink-0 rounded-full', state === 'float' && 'watti-float', state === 'think' && 'watti-think', state === 'happy' && 'watti-happy', className)}
    />
  );
}

function Respuesta({ r, onNavigate }) {
  return (
    <div className="space-y-2">
      {r.parrafos.map((p, i) => <p key={i}>{p}</p>)}
      {r.lista && <ul className="list-disc space-y-1 pl-4">{r.lista.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      {r.accion && (
        <Link to={r.accion.to} onClick={onNavigate} className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-brand hover:underline">
          {r.accion.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

const Chip = ({ children, ...props }) => (
  <Button type="button" variant="outline" size="sm" className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-left text-xs font-medium leading-snug" {...props}>
    {children}
  </Button>
);

export default function WattiWidget({ hideFab = false }) {
  const { items, settings } = useData();
  const [open, setOpen] = useState(false);
  const panel = useModalAnimation(open);
  const [msgs, setMsgs] = useState([{ id: 0, role: 'bot', kind: 'saludo', texto: SALUDO }]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [happy, setHappy] = useState(false);
  const [greet, setGreet] = useState(true); // first appearance of the button
  const [saluda, setSaluda] = useState(false);
  const nextId = useRef(1);
  const timers = useRef([]);
  const fabRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wasOpen = useRef(false);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The mascot waves (hops) shortly after the button first appears
  useEffect(() => {
    later(() => setSaluda(true), 500);
    later(() => setSaluda(false), 2000);
  }, []);

  // Focus: into the input on open, back to the button on close. Escape closes.
  useEffect(() => {
    if (open && panel.visible) inputRef.current?.focus({ preventScroll: true });
  }, [open, panel.visible]);
  useEffect(() => {
    if (wasOpen.current && !open) fabRef.current?.focus();
    wasOpen.current = open;
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    // Escape closes Watti only if focus is inside it, or no other dialog / open listbox is on screen
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const inside = document.getElementById('watti-panel')?.contains(e.target);
      const other = document.querySelector('[role="dialog"]:not(#watti-panel), [role="alertdialog"], [role="listbox"]');
      if (inside || !other) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Auto-scroll to the newest message (only the message box, never the page)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [msgs, typing, panel.visible]);

  const push = (m) => setMsgs((prev) => [...prev, { id: nextId.current++, ...m }]);

  const ask = (texto, forcedId) => {
    const clean = texto.trim();
    if (!clean || typing) return;
    const qid = forcedId ?? interpretar(clean);
    push({ role: 'user', texto: clean });
    setDraft('');
    setTyping(true);
    later(() => {
      const r = qid ? responder(qid, { items, settings }) : null;
      // The "load your inventory first" answer does not count as asked, so its chip stays available
      push(r ? { role: 'bot', kind: 'respuesta', qid: r.datos?.sinEquipos ? undefined : qid, r } : { role: 'bot', kind: 'fuera', texto: FUERA_DE_ALCANCE });
      setTyping(false);
      setHappy(true);
      later(() => setHappy(false), 1100);
    }, TYPING_MS);
  };

  const last = msgs[msgs.length - 1];
  const asked = new Set(msgs.map((m) => m.qid).filter(Boolean));
  const pendientes = PREGUNTAS.filter((p) => !asked.has(p.id));
  let chips = [];
  if (!typing && last.role === 'bot') {
    chips = last.kind === 'respuesta' ? pendientes.slice(0, 3) : last.kind === 'fuera' && !pendientes.length ? PREGUNTAS : pendientes;
  }

  const avatarState = typing ? 'think' : happy ? 'happy' : 'idle';

  return (
    <div className="print:hidden">
      {!open && !hideFab && (
        <button
          ref={fabRef}
          type="button"
          aria-label="Abrir Watti, tu asistente de energía"
          aria-expanded="false"
          aria-controls="watti-panel"
          title="Watti, tu asistente de energía"
          onClick={() => setOpen(true)}
          onAnimationEnd={(e) => e.animationName === 'watti-fab-in' && setGreet(false)}
          className={cn(
            'fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary shadow-lg ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            greet ? 'watti-fab-in' : 'watti-fab-back',
          )}
        >
          <Avatar className="h-full w-full" state={saluda ? 'happy' : 'float'} />
        </button>
      )}

      {panel.visible && (
        <section
          id="watti-panel"
          role="dialog"
          aria-label="Watti, tu asistente de energía"
          className={cn(
            'fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-card text-card-foreground shadow-2xl',
            'sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(600px,calc(100dvh-2rem))] sm:w-[400px] sm:rounded-xl sm:border',
            panel.modalClass === 'modal-exit' ? 'watti-out' : 'watti-in',
          )}
        >
          <header className="flex items-center gap-3 border-b-2 border-brand bg-primary px-4 py-3 text-primary-foreground">
            <Avatar className="h-9 w-9" state={avatarState} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold">Watti</p>
              <p className="truncate text-xs text-primary-foreground/70">Tu asistente de energía</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar Watti"
              onClick={() => setOpen(false)}
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div ref={listRef} role="log" aria-label="Conversación con Watti" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-secondary/30 p-3">
            {msgs.map((m) => (m.role === 'user' ? (
              <div key={m.id} className="watti-msg ml-auto w-fit max-w-[85%] break-words rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">{m.texto}</div>
            ) : (
              <div key={m.id} className="watti-msg flex items-end gap-2">
                <Avatar className="h-7 w-7" />
                <div className="max-w-[85%] break-words rounded-2xl rounded-bl-sm border border-l-[3px] border-l-brand bg-card px-3 py-2 text-sm leading-relaxed shadow-sm">
                  {m.kind === 'respuesta' ? <Respuesta r={m.r} onNavigate={() => isMobile() && setOpen(false)} /> : m.texto}
                </div>
              </div>
            )))}

            {typing && (
              <div className="watti-msg flex items-end gap-2">
                <Avatar className="h-7 w-7" state="think" />
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-l-[3px] border-l-brand bg-card px-3 py-2.5 shadow-sm">
                  <span className="sr-only">Watti está escribiendo…</span>
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 150, 300].map((d) => <i key={d} className="watti-dot h-1.5 w-1.5 rounded-full bg-brand" style={{ animationDelay: `${d}ms` }} />)}
                  </span>
                  <span aria-hidden="true" className="text-xs text-muted-foreground">escribiendo…</span>
                </div>
              </div>
            )}

            {chips.length > 0 && (
              <div role="group" className="watti-msg flex flex-wrap gap-1.5 pl-9" aria-label="Preguntas sugeridas">
                {chips.map((p) => <Chip key={p.id} onClick={() => ask(p.texto, p.id)}>{p.texto}</Chip>)}
              </div>
            )}
          </div>

          <div className="border-t bg-card p-3">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={200}
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Escribí tu pregunta para Watti"
                placeholder="Escribí tu pregunta…"
              />
              <Button type="submit" variant="brand" size="icon" aria-label="Enviar pregunta" disabled={!draft.trim() || typing} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{AVISO}</p>
          </div>
        </section>
      )}
    </div>
  );
}
