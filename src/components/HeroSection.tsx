import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { HeroInfo } from '../types';

interface HeroSectionProps {
  hero: HeroInfo;
  visibleServicesCount: number;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  visibleServicesCount,
  onExploreClick,
}) => {
  const images = useMemo(() => {
    const list = (hero.backgroundImages || []).filter((u) => u && u.trim().length > 0);
    if (list.length > 0) return list;
    return hero.backgroundUrl ? [hero.backgroundUrl] : [];
  }, [hero.backgroundImages, hero.backgroundUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveIndex(0);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const intervalMs = Math.max(3, hero.slideIntervalSeconds || 15) * 1000;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [images.length, hero.slideIntervalSeconds]);

  const safeIndex = images.length > 0 ? activeIndex % images.length : 0;

  return (
    <section
      id="beranda"
      className="relative w-full overflow-hidden bg-gradient-to-br from-slate-800 via-sky-900 to-slate-900 text-white"
    >
      {/* Background School Building Slideshow */}
      {images.map((src, idx) => {
        if (failedUrls[src]) return null;
        const isCurrent = idx === safeIndex;
        return (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={`Latar belakang ${hero.title} (${idx + 1})`}
            referrerPolicy="no-referrer"
            onError={() =>
              setFailedUrls((prev) => ({
                ...prev,
                [src]: true,
              }))
            }
            className={`absolute inset-0 w-full h-full object-cover object-center scale-[1.12] origin-bottom-left select-none pointer-events-none transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}

      {/* Atmospheric Contrast Scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-slate-800/65 via-sky-950/55 to-slate-900/75"
      />

      {/* Subtle Ambient Decorative Circles matching reference */}
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-20 w-80 h-80 rounded-full bg-white/[0.06] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/[0.06] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="hidden md:block absolute left-1/3 bottom-6 w-52 h-52 rounded-full bg-white/[0.05] pointer-events-none"
      />

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center text-center">
        {hero.kicker && (
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-xs text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white">
            {hero.kicker}
          </span>
        )}

        <h1 className="mt-5 font-serif text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-tight text-white drop-shadow-sm text-balance">
          {hero.title}
        </h1>

        {hero.subtitle && (
          <p className="mt-3 text-base sm:text-xl font-medium text-white/90 max-w-2xl text-balance">
            {hero.subtitle}
          </p>
        )}

        <div className="mt-7">
          <button
            type="button"
            onClick={onExploreClick}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm sm:text-base shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <LayoutGrid className="w-4 h-4 text-slate-800" aria-hidden="true" />
            <span>{hero.ctaLabel || 'Jelajahi Layanan'}</span>
          </button>
        </div>

        {/* 3 Glassmorphic Stat Cards */}
        <div className="mt-10 sm:mt-12 grid grid-cols-3 gap-2.5 sm:gap-5 max-w-xl w-full">
          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-3.5 sm:px-5 sm:py-4 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
              {visibleServicesCount}
            </div>
            <div className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/85">
              Layanan Digital
            </div>
          </div>

          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-3.5 sm:px-5 sm:py-4 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
              {hero.stat2Value}
            </div>
            <div className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/85">
              {hero.stat2Label}
            </div>
          </div>

          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-3.5 sm:px-5 sm:py-4 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
              {hero.stat3Value}
            </div>
            <div className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/85">
              {hero.stat3Label}
            </div>
          </div>
        </div>

        {/* Interactive Slideshow Indicators (only when multiple images exist) */}
        {images.length > 1 && (
          <div
            className="mt-7 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Pilih gambar latar belakang beranda"
          >
            {images.map((_, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Gambar latar ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    active ? 'w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/75'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
