import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as inventory from '../services/inventory.js';
import { calcTotales } from '../lib/calc.js';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `i-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [store, setStore] = useState({ userId: null, data: null });

  useEffect(() => {
    if (!user) {
      setStore({ userId: null, data: null });
      return;
    }
    let vivo = true;
    inventory.loadData(user).then((data) => vivo && setStore({ userId: user.id, data }));
    return () => {
      vivo = false;
    };
  }, [user]);

  useEffect(() => {
    if (user && store.data && store.userId === user.id) inventory.saveData(user.id, store.data);
  }, [store, user]);

  const setData = useCallback((fn) => setStore((s) => (s.data ? { ...s, data: fn(s.data) } : s)), []);

  const actions = useMemo(
    () => ({
      addItem: (item) => setData((d) => ({ ...d, items: [...d.items, { ...item, id: newId() }] })),
      updateItem: (item) => setData((d) => ({ ...d, items: d.items.map((i) => (i.id === item.id ? item : i)) })),
      removeItem: (id) => setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) })),
      updateSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      resetDemo: async () => user && setStore({ userId: user.id, data: await inventory.resetDemo(user.id) }),
      clearAll: async () => user && setStore({ userId: user.id, data: await inventory.clearData(user.id, store.data?.settings?.empresa) }),
    }),
    [setData, user, store.data?.settings?.empresa],
  );

  const data = store.userId === user?.id ? store.data : null;
  const calculo = useMemo(() => (data ? calcTotales(data.items, data.settings) : null), [data]);

  const value = useMemo(
    () => ({ ready: !!data, items: data?.items ?? [], settings: data?.settings ?? {}, calculo, ...actions }),
    [data, calculo, actions],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
