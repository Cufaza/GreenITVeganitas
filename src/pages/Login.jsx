import { useState } from 'react';
import { AlertCircle, ArrowRight, Calculator, Eye, EyeOff, Leaf, Loader2, PiggyBank, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../data/demo.js';
import Logo from '../components/Logo.jsx';
import { Button, Input, cn } from '../components/ui/UIComponents.jsx';

const FEATURES = [
  [Zap, 'Cálculo de kWh, costo y CO₂ con datos reales de Argentina.'],
  [PiggyBank, 'Recomendaciones de ahorro ordenadas por impacto.'],
  [Calculator, 'Todas las cuentas visibles en la sección Cálculos.'],
];

const LABEL = 'ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const FIELD = 'h-11 bg-secondary/30 transition-all focus:bg-background';

export default function Login() {
  const { login, register, loginDemo } = useAuth();
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background animate-in fade-in duration-500 lg:flex-row">
      {/* Brand panel */}
      <section className="relative overflow-hidden bg-brand text-brand-foreground lg:flex lg:w-1/2 xl:w-3/5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/0 via-black/10 to-black/40" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
        <Leaf className="pointer-events-none absolute -bottom-10 right-6 h-64 w-64 rotate-12 text-white/[0.07]" strokeWidth={1} />

        <div className="relative z-10 flex h-full w-full flex-col justify-between gap-10 p-8 sm:p-12">
          <div className="brightness-0 invert"><Logo height={48} /></div>
          <div className="max-w-xl space-y-8">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
              Medí el consumo de tu infraestructura IT. Reducí su costo y su huella de carbono.
            </h1>
            <ul className="space-y-3">
              {FEATURES.map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/90 sm:text-base">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15"><Icon className="h-4 w-4" /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 items-center rounded-xl bg-white p-1.5 shadow-sm">
              <img src="/veganitas-logo.svg" alt="Veganitas" className="h-10 w-auto" />
            </span>
            <p className="text-xs leading-relaxed text-white/75">Prototipo del Equipo 1 Veganitas · Innovación y Emprendedorismo · Ing. Informática</p>
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold tracking-tight">{modo === 'login' ? 'Bienvenido' : 'Creá tu cuenta'}</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            {modo === 'login' ? 'Ingresá para ver el consumo de tu empresa.' : 'Empezá a medir tu infraestructura IT.'}
          </p>

          <div role="tablist" className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
            {[['login', 'Ingresar'], ['reg', 'Crear cuenta']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={modo === m}
                onClick={() => setModo(m)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  modo === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => (modo === 'login' ? login(email, password) : register(email, password, empresa)));
            }}
          >
            {modo === 'reg' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label htmlFor="l-empresa" className={LABEL}>Empresa</label>
                <Input id="l-empresa" className={FIELD} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de tu PyME" />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="l-email" className={LABEL}>Email</label>
              <Input id="l-email" className={FIELD} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="l-pass" className={LABEL}>Contraseña</label>
              <div className="relative">
                <Input
                  id="l-pass"
                  className={cn(FIELD, 'pr-10')}
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={modo === 'reg' ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-r-md border-l-4 border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{modo === 'login' ? 'Ingresar' : 'Crear cuenta'} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="brand" className="h-11 w-full font-semibold" disabled={busy} onClick={() => run(loginDemo)}>
            <Leaf className="h-4 w-4" /> Entrar con la cuenta de demostración
          </Button>
          <div className="mt-4 space-y-1 text-center text-xs text-muted-foreground">
            <p>Usuario: <span className="font-medium text-foreground">{DEMO_EMAIL}</span> · Clave: <span className="font-medium text-foreground">{DEMO_PASSWORD}</span></p>
            <p className="text-muted-foreground/70">Demo: las cuentas se guardan solo en este navegador.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
