// Autenticación SIMULADA para la demo (localStorage). No es segura: sirve solo para mostrar el flujo.
// Para producción, reemplazar por Supabase Auth. Ver SUPABASE.md.
import { DEMO_EMAIL, DEMO_PASSWORD } from '../data/demo.js';

const USERS_KEY = 'greenit.users';
const SESSION_KEY = 'greenit.session';

const read = (k, d) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* almacenamiento no disponible */
  }
};

async function hash(email, password) {
  const text = `greenit:${email}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `plain:${text}`;
}

const publico = (u) => ({ id: u.id, email: u.email, empresa: u.empresa, demo: !!u.demo });
const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(16).slice(2)}`);

async function ensureDemoUser() {
  const users = read(USERS_KEY, []);
  if (!users.some((u) => u.email === DEMO_EMAIL)) {
    users.push({
      id: 'demo-user',
      email: DEMO_EMAIL,
      empresa: 'Estudio Contable Delta',
      demo: true,
      hash: await hash(DEMO_EMAIL, DEMO_PASSWORD),
    });
    write(USERS_KEY, users);
  }
}

export async function getSession() {
  await ensureDemoUser();
  const id = read(SESSION_KEY, null);
  if (!id) return null;
  const u = read(USERS_KEY, []).find((x) => x.id === id);
  return u ? publico(u) : null;
}

export async function login(email, password) {
  await ensureDemoUser();
  const e = String(email).trim().toLowerCase();
  const u = read(USERS_KEY, []).find((x) => x.email === e);
  if (!u || u.hash !== (await hash(e, password))) throw new Error('Email o contraseña incorrectos.');
  write(SESSION_KEY, u.id);
  return publico(u);
}

export async function loginDemo() {
  return login(DEMO_EMAIL, DEMO_PASSWORD);
}

export async function register(email, password, empresa) {
  await ensureDemoUser();
  const e = String(email).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(e)) throw new Error('Ingresá un email válido.');
  if (String(password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  const users = read(USERS_KEY, []);
  if (users.some((u) => u.email === e)) throw new Error('Ya existe una cuenta con ese email.');
  const u = { id: newId(), email: e, empresa: String(empresa || '').trim(), demo: false, hash: await hash(e, password) };
  users.push(u);
  write(USERS_KEY, users);
  write(SESSION_KEY, u.id);
  return publico(u);
}

export async function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}
