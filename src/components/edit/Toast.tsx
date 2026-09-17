'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  toast: (type: ToastType, text: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((type: ToastType, text: string) => {
    const id = ++toastId;
    setMessages((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`
              pointer-events-auto flex items-center gap-2.5 px-4 py-2.5
              border border-[color:var(--color-nis-ink)] bg-[color:var(--color-nis-white)]
              shadow-[4px_4px_0_0_var(--color-nis-accent)]
              animate-[slideIn_200ms_ease-out]
              min-w-[240px] max-w-[360px]
            `}
          >
            {msg.type === 'success' && (
              <Check className="h-4 w-4 shrink-0 text-[color:var(--color-nis-deep-forest)]" />
            )}
            {msg.type === 'error' && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--color-nis-earth)]" />
            )}
            <span className="font-sans text-sm font-medium text-[color:var(--color-nis-ink)] flex-1">
              {msg.text}
            </span>
            <button
              type="button"
              onClick={() => dismiss(msg.id)}
              className="text-nis-muted hover:text-[color:var(--color-nis-ink)] transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
