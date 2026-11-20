import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SESSION_KEY = 'zedbiz-lens:demo-session:v1';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const DemoSessionContext = createContext(null);

function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    const expiresAt = Number(session?.expiresAt || 0);
    return expiresAt > Date.now() ? expiresAt : 0;
  } catch {
    return 0;
  }
}

export function DemoSessionProvider({ children }) {
  const [expiresAt, setExpiresAt] = useState(readSession);
  const active = expiresAt > Date.now();

  const endDemoSession = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* session storage can be unavailable */ }
    setExpiresAt(0);
  }, []);

  const beginDemoSession = useCallback(() => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt })); } catch { /* public demo can still be used in memory */ }
    setExpiresAt(expiresAt);
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    if (!expiresAt || expiresAt <= Date.now()) {
      endDemoSession();
      return undefined;
    }
    const timer = window.setTimeout(endDemoSession, Math.min(expiresAt - Date.now(), 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [active, expiresAt, endDemoSession]);

  const value = useMemo(() => ({ active, beginDemoSession, endDemoSession }), [active, beginDemoSession, endDemoSession]);
  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error('useDemoSession must be used inside DemoSessionProvider.');
  return context;
}
