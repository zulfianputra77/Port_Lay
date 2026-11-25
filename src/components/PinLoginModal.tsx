import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, User, X } from 'lucide-react';

export interface AuthActionResponse {
  ok: boolean;
  error?: string;
}

interface PinLoginModalProps {
  isOpen: boolean;
  credentialsConfigured: boolean;
  adminUsernameHint: string;
  onClose: () => void;
  onAuthenticate: (
    username: string,
    password: string,
    isInitialSetup: boolean
  ) => Promise<AuthActionResponse>;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  credentialsConfigured,
  adminUsernameHint,
  onClose,
  onAuthenticate,
}) => {
  const [username, setUsername] = useState(adminUsernameHint || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(adminUsernameHint || '');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
      setSubmitting(false);
      setTimeout(() => usernameInputRef.current?.focus(), 60);
    }
  }, [isOpen, adminUsernameHint]);

  if (!isOpen) return null;

  const isSetupMode = !credentialsConfigured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!/^[a-zA-Z0-9._@-]{3,64}$/.test(cleanUser)) {
      setError('Username minimal 3 karakter (huruf, angka, titik, garis bawah, atau @).');
      return;
    }
    if (cleanPass.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (isSetupMode && cleanPass !== confirmPassword.trim()) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setSubmitting(true);
    setError('');
    const result = await onAuthenticate(cleanUser, cleanPass, isSetupMode);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Username atau password Admin tidak sesuai.');
      if (!isSetupMode) {
        setPassword('');
      }
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
              {isSetupMode ? (
                <KeyRound className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 id="admin-login-title" className="text-base font-bold text-slate-900">
                {isSetupMode ? 'Buat Akun Admin Pertama Kali' : 'Login Mode Admin'}
              </h2>
              <p className="text-xs text-slate-500">
                {isSetupMode
                  ? 'Tetapkan username dan password untuk mengamankan portal'
                  : 'Masukkan username dan password Admin untuk mengelola portal'}
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
          {/* Username */}
          <div>
            <label
              htmlFor="admin-username-input"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Username Admin
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                ref={usernameInputRef}
                id="admin-username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder={isSetupMode ? 'Contoh: admin atau admin_smpn4' : 'Masukkan username...'}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              {isSetupMode ? 'Buat Password Admin' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Masukkan password..."
                className="w-full px-4 py-2.5 pr-11 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSetupMode && (
            <div>
              <label
                htmlFor="admin-password-confirm"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Konfirmasi Password
              </label>
              <input
                id="admin-password-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ulangi password..."
                className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {isSetupMode && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 leading-relaxed">
              Username dan password Anda akan dienkripsi serta disimpan di database server. Anda bisa mengisi password seperti <strong>silahkanmasuk</strong> atau kombinasi pilihan Anda sendiri.
            </p>
          )}

          {error && (
            <p className="text-xs font-medium text-rose-600 leading-relaxed" role="alert">
              {error}
            </p>
          )}

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
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors shadow-xs"
            >
              {submitting ? 'Memproses...' : isSetupMode ? 'Simpan & Masuk Admin' : 'Masuk Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
