// Persistencia SIMULADA del inventario (localStorage). Misma interfaz que tendría un servicio con
// Supabase: ver SUPABASE.md para el reemplazo.
import { demoData, emptyData } from '../data/demo.js';

const key = (userId) => `greenit.data.${userId}`;

const save = (userId, data) => {
  try {
    localStorage.setItem(key(userId), JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible */
  }
};

export async function loadData(user) {
  try {
    const raw = localStorage.getItem(key(user.id));
    if (raw) return JSON.parse(raw);
  } catch {
    /* se regenera abajo */
  }
  const data = user.demo ? demoData() : emptyData(user.empresa);
  save(user.id, data);
  return data;
}

export async function saveData(userId, data) {
  save(userId, data);
}

export async function resetDemo(userId) {
  const data = demoData();
  save(userId, data);
  return data;
}

export async function clearData(userId, empresa = '') {
  const data = emptyData(empresa);
  save(userId, data);
  return data;
}
