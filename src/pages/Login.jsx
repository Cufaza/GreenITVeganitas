import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../data/demo.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login, register, loginDemo } = useAuth();
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login">
      <section className="login-brand">
        <Logo height={56} />
        <h1>Medí el consumo de tu infraestructura IT. Reducí su costo y su huella de carbono.</h1>
        <ul>
          <li>Cálculo de kWh, costo y CO₂ con datos reales de Argentina.</li>
          <li>Recomendaciones de ahorro ordenadas por impacto.</li>
          <li>Todas las cuentas visibles en la sección Cálculos.</li>
        </ul>
        <div className="login-credit">
          <img src="/veganitas-logo.svg" alt="Veganitas" height="44" />
          <span>Prototipo del Equipo 1 Veganitas · Innovación y Emprendedorismo · Ing. Informática</span>
        </div>
      </section>
      <section className="login-form">
        <div className="card">
          <div className="tabs">
            <button className={modo === 'login' ? 'on' : ''} onClick={() => setModo('login')}>Ingresar</button>
            <button className={modo === 'reg' ? 'on' : ''} onClick={() => setModo('reg')}>Crear cuenta</button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => (modo === 'login' ? login(email, password) : register(email, password, empresa)));
            }}
          >
            {modo === 'reg' && (
              <label>Empresa
                <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nombre de tu PyME" />
              </label>
            )}
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label>Contraseña
              <input type="password" required minLength={modo === 'reg' ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-block" disabled={busy}>{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
          </form>
          <div className="sep"><span>o</span></div>
          <button className="btn btn-orange btn-block" disabled={busy} onClick={() => run(loginDemo)}>
            Entrar con la cuenta de demostración
          </button>
          <p className="hint center">Usuario: {DEMO_EMAIL} · Clave: {DEMO_PASSWORD}</p>
          <p className="hint center">Demo: las cuentas se guardan solo en este navegador.</p>
        </div>
      </section>
    </div>
  );
}
