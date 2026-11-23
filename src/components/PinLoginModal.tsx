import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';

interface PinLoginModalProps {
  isOpen: boolean;
  expectedPin: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  expectedPin,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setShowPin(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Masukkan PIN berupa 4 hingga 6 digit angka.');
      return;
    }
    if (pin !== expectedPin) {
      setError('PIN Admin tidak sesuai. Silakan coba lagi.');
      setPin('');
      inputRef.current?.focus();
      return;
    }
    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="pin-modal-title" className="text-base font-bold text-slate-900">
                Akses Mode Admin
              </h2>
              <p className="text-xs text-slate-500">
                Masukkan PIN untuk mengelola layanan portal
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="admin-pin-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
              PIN Admin (4–6 digit)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setPin(digitsOnly);
                  if (error) setError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-3 pr-11 text-lg font-semibold tracking-[0.35em] text-center text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
              />
              <button
                type="button"
                onClick={() => setShowPin((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5">
            Petunjuk demo: PIN default awal adalah <strong className="font-bold text-slate-800 tabular-nums">1234</strong>. Anda dapat mengubah PIN kapan saja melalui menu PIN &amp; Backup setelah masuk.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              Masuk Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
