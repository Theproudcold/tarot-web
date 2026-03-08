import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const DEFAULT_DURATION = 2400;

const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
});

const toneStyles = {
  success: {
    container: 'border-emerald-300/30 bg-emerald-500/15 text-emerald-50',
    icon: 'bg-emerald-400/20 text-emerald-50',
    symbol: '✓',
  },
  error: {
    container: 'border-rose-300/30 bg-rose-500/15 text-rose-50',
    icon: 'bg-rose-400/20 text-rose-100',
    symbol: '!',
  },
  info: {
    container: 'border-sky-300/30 bg-sky-500/15 text-sky-50',
    icon: 'bg-sky-400/20 text-sky-50',
    symbol: 'i',
  },
};

const ToastViewport = ({ toast }) => {
  if (!toast?.message) {
    return null;
  }

  const toneStyle = toneStyles[toast.tone] || toneStyles.success;

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-[10000] flex justify-center">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-md animate-fadeIn ${toneStyle.container}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${toneStyle.icon}`}>
          {toneStyle.symbol}
        </span>
        <span className="leading-5">{toast.message}</span>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(({ message, tone = 'success', duration = DEFAULT_DURATION }) => {
    if (!message) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      tone,
    });

    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const value = useMemo(() => ({ showToast, hideToast }), [hideToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
