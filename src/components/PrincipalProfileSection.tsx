import React, { useEffect, useState } from 'react';
import { Pencil, User } from 'lucide-react';
import { PrincipalProfileInfo } from '../types';

interface PrincipalProfileSectionProps {
  leadership: PrincipalProfileInfo;
  isAdminMode: boolean;
  onEditClick: () => void;
}

export const PrincipalProfileSection: React.FC<PrincipalProfileSectionProps> = ({
  leadership,
  isAdminMode,
  onEditClick,
}) => {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [leadership.photoUrl]);

  if (!leadership.visible && !isAdminMode) {
    return null;
  }

  return (
    <section
      id="profil"
      className={`scroll-mt-24 ${!leadership.visible ? 'opacity-65' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
            {leadership.sectionTitle || 'Profil Kepala Sekolah & Visi Misi'}
          </h2>
          {!leadership.visible && isAdminMode && (
            <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              Bagian ini sedang disembunyikan dari pengunjung. Aktifkan di Pengaturan Admin jika ingin ditampilkan.
            </p>
          )}
        </div>

        {isAdminMode && (
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/70 border border-blue-200 dark:border-sky-800 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span>Edit Profil &amp; Visi Misi</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 lg:p-10 transition-colors">
        {/* Top Row: Principal Photo + Name (Left) & Greeting Message (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
              {leadership.photoUrl && !photoError ? (
                <img
                  src={leadership.photoUrl}
                  alt={`Foto ${leadership.principalName}`}
                  referrerPolicy="no-referrer"
                  onError={() => setPhotoError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 p-6 text-center">
                  <User className="w-14 h-14 text-slate-400" aria-hidden="true" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Foto Kepala Sekolah
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 w-full max-w-[280px] text-center lg:text-left">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug text-balance">
                {leadership.principalName}
              </h3>
              <p className="text-sm font-semibold text-blue-700 dark:text-sky-400 mt-0.5">
                {leadership.principalTitle}
              </p>
              {leadership.principalNip && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                  NIP. {leadership.principalNip}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              {leadership.greetingTitle || 'Sambutan Kepala Sekolah'}
            </h3>
            <div className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
              {leadership.greetingMessage}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">{leadership.principalName}</span>
              <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-500 dark:text-slate-400">{leadership.principalTitle}</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Visi & Misi Sekolah */}
        <div className="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {leadership.visionTitle || 'Visi Sekolah'}
            </h3>
            <p className="font-serif text-lg sm:text-xl text-slate-800 dark:text-slate-100 leading-relaxed text-balance">
              &ldquo;{leadership.visionText}&rdquo;
            </p>
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-10">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {leadership.missionTitle || 'Misi Sekolah'}
            </h3>
            {leadership.missionItems.length > 0 ? (
              <ol className="space-y-3">
                {leadership.missionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-semibold text-blue-700 dark:text-sky-400 tabular-nums shrink-0 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada daftar misi yang diisi.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
