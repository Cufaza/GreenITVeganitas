import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { PREGUNTAS, responder } from '../../lib/watti.js';
import { DEMO } from '../demo.js';
import { WattiAvatar, useReducedMotionQuery } from '../ui.jsx';

// Timings ported from sumar's IaChat
const TYPING_INTERVAL_MS = 68;
const SEND_PAUSE_MS = 400;
const THINK_DELAY_MS = 220;
const THINK_DURATION_MS = 1400;
const BOT_INTERVAL_MS = 20;
const TURN_PAUSE_MS = 900;
const DONE_PAUSE_MS = 1200;
const EXIT_STAGGER_MS = 140;
const EXIT_ANIM_MS = 280;
const RESTART_BUFFER_MS = 120;

// Real Watti answers (src/lib/watti.js) over the demo inventory: first paragraph of each
const IDS = ['consumo-total', 'pcs-fuera-horario', 'medida-top', 'plan-completo'];
const TURNS = IDS.map((id) => ({
  user: PREGUNTAS.find((p) => p.id === id).texto,
  bot: responder(id, { items: DEMO.items, settings: DEMO.settings }).parrafos[0],
}));

let nextId = 0;
const uid = () => {
  nextId += 1;
  return nextId;
};

export default function WattiChat() {
  const ref = useRef(null);
  const msgsRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduce = useReducedMotionQuery();

  const [step, setStep] = useState('idle');
  const [turnIdx, setTurnIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [botTyped, setBotTyped] = useState('');

  // Keep the newest message visible: scrolls the message box only, never the page
  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, botTyped]);

  // Kick off when the card enters the viewport
  useEffect(() => {
    if (!inView || reduce || step !== 'idle') return undefined;
    const t = setTimeout(() => setStep('typing'), 700);
    return () => clearTimeout(t);
  }, [inView, reduce, step]);

  // Phase machine (typing -> sending -> thinking -> bot typewriter -> next turn -> exit -> restart)
  useEffect(() => {
    if (!inView || reduce) return undefined;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let iv = 0;

    if (step === 'typing') {
      const target = TURNS[turnIdx].user;
      let i = 0;
      iv = setInterval(() => {
        i += 1;
        setInputText(target.slice(0, i));
        if (i >= target.length) {
          clearInterval(iv);
          later(() => setStep('sending'), SEND_PAUSE_MS);
        }
      }, TYPING_INTERVAL_MS);
    } else if (step === 'sending') {
      setMessages((prev) => [...prev, { id: uid(), role: 'user', text: TURNS[turnIdx].user }]);
      setInputText('');
      later(() => setStep('thinking'), THINK_DELAY_MS);
    } else if (step === 'thinking') {
      later(() => {
        setBotTyped('');
        setStep('bot');
      }, THINK_DURATION_MS);
    } else if (step === 'bot') {
      const target = TURNS[turnIdx].bot;
      let i = 0;
      iv = setInterval(() => {
        i += 1;
        setBotTyped(target.slice(0, i));
        if (i >= target.length) {
          clearInterval(iv);
          setMessages((prev) => [...prev, { id: uid(), role: 'bot', text: target, noAnim: true }]);
          setBotTyped('');
          const next = turnIdx + 1;
          if (next < TURNS.length) later(() => { setTurnIdx(next); setStep('typing'); }, TURN_PAUSE_MS);
          else later(() => setStep('done'), DONE_PAUSE_MS);
        }
      }, BOT_INTERVAL_MS);
    } else if (step === 'done') {
      // Exit messages one by one (newest first), then restart
      const snapshot = [...messages];
      const count = snapshot.length;
      snapshot.forEach((msg, i) => {
        const delay = (count - 1 - i) * EXIT_STAGGER_MS;
        later(() => setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, exiting: true } : m))), delay);
        later(() => setMessages((prev) => prev.filter((m) => m.id !== msg.id)), delay + EXIT_ANIM_MS);
      });
      later(() => {
        setTurnIdx(0);
        setStep('idle');
      }, count * EXIT_STAGGER_MS + RESTART_BUFFER_MS);
    }

    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, [step, turnIdx, inView, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reduced motion: show the whole conversation, no typing
  const shownMessages = reduce
    ? TURNS.flatMap((t, i) => [{ id: `u${i}`, role: 'user', text: t.user }, { id: `b${i}`, role: 'bot', text: t.bot, noAnim: true }])
    : messages;
  const isThinking = step === 'thinking';
  const isBotTyping = step === 'bot' && botTyped.length > 0;

  return (
    <div ref={ref} className="ia-wrap">
      <div className="ia-window">
        <div className="ia-header">
          <div className="ia-avatar"><WattiAvatar size={26} /></div>
          <div>
            <div className="ia-name">Watti, tu asistente de energía</div>
            <div className="ia-status"><span className="ia-dot" />Demo con respuestas predefinidas</div>
          </div>
        </div>

        <div ref={msgsRef} className="ia-messages" role="img" aria-label="Conversación de ejemplo con Watti sobre el caso de demostración">
          {shownMessages.map((msg) => (
            msg.role === 'user' ? (
              <div key={msg.id} className={`ia-row ia-row--user${msg.exiting ? ' ia-row--exiting' : ''}`}>
                <div className="ia-bubble ia-bubble--user">{msg.text}</div>
              </div>
            ) : (
              <div key={msg.id} className={`ia-row${msg.noAnim ? ' ia-row--no-anim' : ''}${msg.exiting ? ' ia-row--exiting' : ''}`}>
                <div className="ia-bot-av"><WattiAvatar size={18} /></div>
                <div className="ia-bubble ia-bubble--bot">{msg.text}</div>
              </div>
            )
          ))}

          {isThinking && (
            <div className="ia-row">
              <div className="ia-bot-av"><WattiAvatar size={18} /></div>
              <div className="ia-bubble ia-bubble--bot ia-thinking"><span /><span /><span /></div>
            </div>
          )}

          {isBotTyping && (
            <div className="ia-row ia-row--no-anim">
              <div className="ia-bot-av"><WattiAvatar size={18} /></div>
              <div className="ia-bubble ia-bubble--bot">
                {botTyped}
                <span className="ia-cursor">|</span>
              </div>
            </div>
          )}
        </div>

        <div className="ia-compose" aria-hidden="true">
          <div className="ia-compose-field">
            {inputText ? <span>{inputText}<span className="ia-cursor">|</span></span> : <span className="ia-placeholder">Preguntale a Watti…</span>}
          </div>
          <button type="button" tabIndex={-1} className={`ia-send-btn${inputText ? ' ia-send-btn--active' : ''}`} aria-label="Enviar">↑</button>
        </div>
      </div>
    </div>
  );
}
