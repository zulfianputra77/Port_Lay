import React from 'react';
import { Clock, Info, MapPin, Plus } from 'lucide-react';
import { AboutInfo, SchoolInfo } from '../types';
import { PortalTheme, ThemeToggle } from './ThemeToggle';

interface AboutSectionProps {
  school: SchoolInfo;
  about: AboutInfo;
  isAdminMode?: boolean;
  onAddClick?: () => void;
  theme: PortalTheme;
  onChangeTheme: (theme: PortalTheme) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  school,
  about,
  isAdminMode = false,
  onAddClick,
  theme,
  onChangeTheme,
}) => {
  const extraItems = (about.extraItems || []).filter(
    (item) => item.label.trim() || item.value.trim()
  );

  return (
    <section
      id="tentang"
      className="mt-16 pt-12 border-t border-slate-200/80 dark:border-slate-800 scroll-mt-24"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 lg:p-10 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
                {about.title}
              </h2>
              {isAdminMode && onAddClick && (
                <button
                  type="button"
                  onClick={onAddClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/70 border border-blue-200 dark:border-sky-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tambah Info Tentang</span>
                </button>
              )}
            </div>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {about.description}
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-10">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Alamat Sekolah</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{about.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Jam Layanan</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{about.serviceHours}</p>
              </div>
            </div>

            {extraItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {item.label || 'Informasi Tambahan'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} {school.name}. Seluruh hak cipta dilindungi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Tema Tampilan:</span>
          <ThemeToggle theme={theme} onChangeTheme={onChangeTheme} />
        </div>
      </footer>
    </section>
  );
};
