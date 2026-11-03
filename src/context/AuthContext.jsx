import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from '../services/auth.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (e, p) => setUser(await auth.login(e, p)),
      loginDemo: async () => setUser(await auth.loginDemo()),
      register: async (e, p, empresa) => setUser(await auth.register(e, p, empresa)),
      logout: async () => {
        await auth.logout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
