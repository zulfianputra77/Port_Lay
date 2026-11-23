import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const styleMap = {
          info: {
            wrapper: 'bg-white border-blue-200 text-slate-800',
            iconWrap: 'text-blue-600',
            Icon: Info,
          },
          success: {
            wrapper: 'bg-white border-emerald-200 text-slate-800',
            iconWrap: 'text-emerald-600',
            Icon: CheckCircle2,
          },
          warning: {
            wrapper: 'bg-white border-amber-200 text-slate-800',
            iconWrap: 'text-amber-600',
            Icon: AlertCircle,
          },
          error: {
            wrapper: 'bg-white border-rose-200 text-slate-800',
            iconWrap: 'text-rose-600',
            Icon: XCircle,
          },
        }[toast.type];

        const { Icon } = styleMap;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg transition-all duration-200 ${styleMap.wrapper}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${styleMap.iconWrap}`} aria-hidden="true" />
            <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
