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
    const stored = raw && JSON.parse(raw);
    // ponytail: one-off migration of the old demo case (Estudio Contable Delta); drop it once nobody has it cached.
    const staleDemo = user.demo && stored?.settings?.empresa?.startsWith('Estudio Contable Delta');
    if (stored && !staleDemo) return stored;
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
