import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Notification from '../components/common/Notification';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (message, { tone = 'success', title } = {}) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { id, message, tone, title }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex flex-col gap-2 sm:left-auto sm:w-96 lg:bottom-6" role="status" aria-live="polite">
        {toasts.map((t) => (
          <Notification key={t.id} tone={t.tone} title={t.title} onDismiss={() => dismiss(t.id)} className="pointer-events-auto animate-sheet shadow-pop">
            {t.message}
          </Notification>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
