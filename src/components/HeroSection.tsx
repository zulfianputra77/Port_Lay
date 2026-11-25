import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
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

  const titleWords = useMemo(
    () => (hero.title || 'SMP NEGERI 004 JAMBI').trim().split(/\s+/).filter(Boolean),
    [hero.title]
  );

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

      {/* Atmospheric Contrast Scrim (stays light regardless of page theme) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-sky-950/60 to-slate-900/80"
      />

      {/* Subtle Ambient Decorative Circles */}
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
        {hero.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl lg:text-2xl font-bold tracking-[0.18em] uppercase text-sky-100 drop-shadow-xs"
          >
            {hero.subtitle}
          </motion.p>
        )}

        {hero.kicker && (
          <motion.span
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-xs text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-white"
          >
            {hero.kicker}
          </motion.span>
        )}

        <h1
          aria-label={hero.title}
          className="mt-5 font-sans font-extrabold lining-nums text-[clamp(2.15rem,4.7vw,3.75rem)] tracking-tight leading-[1.1] text-balance flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4"
        >
          {titleWords.map((word, idx) => (
            <motion.span
              key={`${word}-${idx}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.14 + idx * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block hero-title-shimmer"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={onExploreClick}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm sm:text-base shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <LayoutGrid className="w-4 h-4 text-slate-800" aria-hidden="true" />
            <span>{hero.ctaLabel || 'Jelajahi Layanan'}</span>
          </button>
        </motion.div>

        {/* 2 Glassmorphic Stat Cards (24/7 Akses Online removed) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-5 max-w-md w-full"
        >
          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 sm:px-5 sm:py-4 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
              {visibleServicesCount}
            </div>
            <div className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/85">
              Layanan Digital
            </div>
          </div>

          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 sm:px-5 sm:py-4 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
              {hero.stat3Value || '100%'}
            </div>
            <div className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/85">
              {hero.stat3Label || 'Terintegrasi'}
            </div>
          </div>
        </motion.div>

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
