import React, { useEffect, useState } from 'react';
import { Cloud, Lock, ShieldCheck, X } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../firebase';

export interface AuthActionResponse {
  ok: boolean;
  error?: string;
}

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<AuthActionResponse>;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
}) => {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError('');
    const result = await onGoogleSignIn();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Gagal masuk ke Mode Admin.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="admin-login-title" className="text-base font-bold text-slate-900">
                Login Mode Admin
              </h2>
              <p className="text-xs text-slate-500">
                Masuk dengan akun Google resmi pengelola portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup dialog login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900">Akun Admin Terdaftar:</p>
                <p className="mt-0.5 font-mono text-[11px] sm:text-xs text-blue-800 break-all">
                  {PRIMARY_ADMIN_EMAIL}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2 border-t border-blue-200/60">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Semua perubahan profil, banner, visi misi, dan daftar layanan akan tersimpan{' '}
                <strong className="text-slate-800">permanen di Cloud Firestore</strong> dan tidak akan kembali ke data awal.
              </p>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 leading-relaxed"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.98h5.27c-.45 2.38-2.52 3.88-5.27 3.88a5.96 5.96 0 1 1 0-11.92c1.49 0 2.84.54 3.88 1.54l2.18-2.18A9.04 9.04 0 0 0 12.18 3a9.01 9.01 0 0 0 0 18.02c5.2 0 8.64-3.65 8.64-8.79 0-.6-.06-1.08-.17-1.13Z"
                />
              </svg>
              <span>{submitting ? 'Menghubungkan Google...' : 'Masuk Admin dengan Google'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
