'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms — default 4500
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  /** Convenience helpers */
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

/* ── Context ─────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ── Provider ────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // keep max 5
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/* ── Design tokens for each variant ─────────────────────── */
const VARIANTS = {
  success: {
    bar: '#10b981',           // emerald green
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    icon: CheckCircle2,
    iconColor: '#10b981',
    titleColor: '#065f46',
    titleColorDark: '#34d399',
  },
  error: {
    bar: '#ef4444',           // red
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    icon: XCircle,
    iconColor: '#ef4444',
    titleColor: '#991b1b',
    titleColorDark: '#f87171',
  },
  warning: {
    bar: '#FDB811',           // site gold
    bg: 'rgba(253,184,17,0.08)',
    border: 'rgba(253,184,17,0.30)',
    icon: AlertTriangle,
    iconColor: '#FDB811',
    titleColor: '#92400e',
    titleColorDark: '#FDB811',
  },
  info: {
    bar: '#2BA6DF',           // site blue
    bg: 'rgba(43,166,223,0.08)',
    border: 'rgba(43,166,223,0.25)',
    icon: Info,
    iconColor: '#2BA6DF',
    titleColor: '#134467',    // site navy
    titleColorDark: '#55B8E5',
  },
} as const;

/* ── Single Toast Item ───────────────────────────────────── */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? 4500;
  const variant = VARIANTS[toast.type];
  const Icon = variant.icon;

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 320);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        /* Slide-in from right + fade */
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.34,1.26,0.64,1), opacity 0.28s ease',
        willChange: 'transform, opacity',
        position: 'relative',
        background: `var(--toast-bg, ${variant.bg})`,
        border: `1px solid ${variant.border}`,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: variant.bar,
          borderRadius: '0.75rem 0 0 0.75rem',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 14px 14px 18px' }}>
        {/* Icon */}
        <div style={{ flexShrink: 0, marginTop: '1px' }}>
          <Icon size={20} color={variant.iconColor} strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="dark:hidden"
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '0.875rem',
              color: variant.titleColor,
              lineHeight: 1.4,
              fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
            }}
          >
            {toast.title}
          </p>
          <p
            className="hidden dark:block"
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '0.875rem',
              color: variant.titleColorDark,
              lineHeight: 1.4,
              fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
            }}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
              }}
            >
              {toast.message}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '4px',
          right: 0,
          height: '2px',
          background: variant.bar,
          opacity: 0.3,
          transformOrigin: 'left',
          animation: `toast-progress-shrink ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

/* ── Container ───────────────────────────────────────────── */
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-progress-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}
