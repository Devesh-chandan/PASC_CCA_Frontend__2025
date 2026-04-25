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

/* ── Design tokens per variant ───────────────────────────── */
const VARIANTS = {
  success: {
    accentBar: '#10b981',
    iconBg: 'rgba(16,185,129,0.10)',
    iconColor: '#10b981',
    icon: CheckCircle2,
    label: 'Success',
  },
  error: {
    accentBar: '#ef4444',
    iconBg: 'rgba(239,68,68,0.10)',
    iconColor: '#ef4444',
    icon: XCircle,
    label: 'Error',
  },
  warning: {
    accentBar: '#FDB811',
    iconBg: 'rgba(253,184,17,0.12)',
    iconColor: '#c98d00',
    icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    accentBar: '#2BA6DF',
    iconBg: 'rgba(43,166,223,0.10)',
    iconColor: '#2BA6DF',
    icon: Info,
    label: 'Info',
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
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.34,1.26,0.64,1), opacity 0.28s ease',
        willChange: 'transform, opacity',
        position: 'relative',
        /* Solid card — matches var(--color-card) system */
        backgroundColor: 'var(--color-card)',
        border: `1px solid var(--color-border)`,
        borderLeft: `3px solid ${variant.accentBar}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '13px 13px 13px 16px' }}>
        {/* Icon square — matches site's icon-square pattern */}
        <div
          style={{
            flexShrink: 0,
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: variant.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1px',
          }}
        >
          <Icon size={17} color={variant.iconColor} strokeWidth={2.3} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
            }}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p
              style={{
                margin: '3px 0 0',
                fontSize: '0.8rem',
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
            padding: '3px',
            borderRadius: '6px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
            transition: 'opacity 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: variant.accentBar,
          opacity: 0.35,
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
