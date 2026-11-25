import { PortalConfig } from '../types';

export type EmbedFormat = 'full_document' | 'snippet';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toKebabCase(iconName: string): string {
  return iconName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();
}

export function generateEmbedCode(
  config: PortalConfig,
  options: {
    format: EmbedFormat;
    publicLogoUrl?: string;
    publicHeroBgUrl?: string;
  }
): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : '';

  const resolveAssetUrl = (url: string, override?: string): string => {
    const chosen = (override ?? '').trim() || url.trim();
    if (!chosen) return '';
    if (chosen.startsWith('data:') || /^https?:\/\//i.test(chosen)) {
      return chosen;
    }
    if (origin && chosen.startsWith('/')) {
      return `${origin}${chosen}`;
    }
    return chosen;
  };

  const embeddedConfig: PortalConfig = {
    ...config,
    school: {
      ...config.school,
      logoUrl: resolveAssetUrl(config.school.logoUrl, options.publicLogoUrl),
    },
    hero: {
      ...config.hero,
      backgroundUrl: resolveAssetUrl(config.hero.backgroundUrl, options.publicHeroBgUrl),
      backgroundImages: (
        options.publicHeroBgUrl?.trim()
          ? [options.publicHeroBgUrl.trim()]
          : config.hero.backgroundImages && config.hero.backgroundImages.length > 0
            ? config.hero.backgroundImages
            : [config.hero.backgroundUrl]
      )
        .map((u) => resolveAssetUrl(u))
        .filter(Boolean),
    },
    leadership: {
      ...config.leadership,
      photoUrl: resolveAssetUrl(config.leadership.photoUrl),
    },
    services: config.services.map((svc) => ({
      ...svc,
      iconName: svc.iconName,
    })),
  };

  const serializedConfig = JSON.stringify(embeddedConfig)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--');

  const iconKebabMap = Object.fromEntries(
    embeddedConfig.services.map((s) => [s.iconName, toKebabCase(s.iconName)])
  );
  const serializedIconMap = JSON.stringify(iconKebabMap);

  const innerBody = `<!-- Portal Layanan Digital - ${escapeHtml(embeddedConfig.school.name)} -->
<!-- Kompatibel untuk Google Sites (Sematkan Kode) & Blogger (Tampilan HTML / Gadget HTML) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          serif: ['"Playfair Display"', 'Georgia', 'serif'],
        }
      }
    }
  };
</script>
<script src="https://unpkg.com/lucide@latest"></script>
<style>
  .smpn4-hero-lining { font-variant-numeric: lining-nums tabular-nums; }
  @keyframes smpn4HeroShimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes smpn4HeroFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .smpn4-hero-title-anim {
    background-image: linear-gradient(110deg, #ffffff 0%, #ffffff 36%, #fde68a 50%, #ffffff 64%, #ffffff 100%);
    background-size: 240% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: smpn4HeroFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both, smpn4HeroShimmer 5.5s ease-in-out infinite;
    filter: drop-shadow(0 4px 18px rgba(15, 23, 42, 0.45));
  }
  @media (prefers-reduced-motion: reduce) {
    .smpn4-hero-title-anim { background-image: none; color: #ffffff; animation: none; }
  }
</style>

<div id="smpn4-portal-root" class="min-h-screen flex flex-col bg-[#F1F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200"></div>

<script>
(function () {
  var STORAGE_KEY = 'smpn4_jambi_embed_portal_v1';
  var DEFAULT_CONFIG = ${serializedConfig};
  var ICON_KEBAB_MAP = ${serializedIconMap};

  function toKebab(name) {
    if (ICON_KEBAB_MAP[name]) return ICON_KEBAB_MAP[name];
    return String(name || 'layers')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
      .toLowerCase();
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isValidUrl(val) {
    var s = String(val || '').trim();
    if (!s) return false;
    try {
      var u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_CONFIG, parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }

  var THEME_KEY = 'smpn4_portal_theme_v1';

  function loadTheme() {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch (e) { return 'light'; }
  }

  var root = document.getElementById('smpn4-portal-root');

  function applyTheme(t) {
    var active = t === 'dark';
    if (root) root.classList.toggle('dark', active);
    document.documentElement.classList.toggle('dark', active);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }

  var state = {
    config: loadConfig(),
    theme: loadTheme(),
    isAdmin: false,
    showServices: false,
    search: '',
    heroSlideIdx: 0,
    pinModalOpen: false,
    editModalOpen: false,
    editingId: null,
    layoutModalOpen: false,
    toastTimer: null,
    toastMessage: ''
  };

  applyTheme(state.theme);

  function renderThemeToggleHtml() {
    var isLight = state.theme === 'light';
    return (
      '<div class="inline-flex items-center gap-3">' +
        '<span>Tema Tampilan:</span>' +
        '<div class="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" role="group" aria-label="Pilih tema tampilan">' +
          '<button type="button" data-set-theme="light" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ' + (isLight ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white') + '"><i data-lucide="sun" class="w-3.5 h-3.5 text-amber-500"></i> Light</button>' +
          '<button type="button" data-set-theme="dark" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ' + (!isLight ? 'bg-slate-900 text-white border border-slate-700 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white') + '"><i data-lucide="moon" class="w-3.5 h-3.5 text-sky-400"></i> Night</button>' +
        '</div>' +
      '</div>'
    );
  }

  setInterval(function () {
    var imgs = (state.config.hero && state.config.hero.backgroundImages) || [];
    if (imgs.length <= 1) return;
    state.heroSlideIdx = (state.heroSlideIdx + 1) % imgs.length;
    var slideEls = root.querySelectorAll('[data-hero-slide]');
    slideEls.forEach(function (el, idx) {
      if (idx === state.heroSlideIdx) {
        el.classList.remove('opacity-0');
        el.classList.add('opacity-100');
      } else {
        el.classList.remove('opacity-100');
        el.classList.add('opacity-0');
      }
    });
  }, 15000);

  function showToast(msg) {
    state.toastMessage = msg;
    render();
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      state.toastMessage = '';
      render();
    }, 4000);
  }

  function getGridColsClass(cols) {
    if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (cols === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  }

  function renderCard(svc, idx, total) {
    var cfg = state.config;
    var hasUrl = isValidUrl(svc.url);
    var resolvedTarget = svc.linkTarget === 'global' ? cfg.layout.globalLinkTarget : svc.linkTarget;
    var targetAttr = resolvedTarget === 'new_tab' ? ' target="_blank" rel="noopener noreferrer"' : '';
    var kebabIcon = toKebab(svc.iconName);

    var iconHtml = svc.customIconUrl
      ? '<img src="' + esc(svc.customIconUrl) + '" alt="' + esc(svc.name) + '" class="w-7 h-7 object-contain rounded" />'
      : '<i data-lucide="' + esc(kebabIcon) + '" class="w-6 h-6 text-white"></i>';

    var style = cfg.layout.cardStyle || 'vertical';
    var inner = '';

    if (style === 'horizontal') {
      inner =
        '<div class="flex items-start gap-4 h-full">' +
          '<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
          '<div class="flex-1 min-w-0 flex flex-col h-full">' +
            '<h3 class="text-base font-bold text-slate-900 dark:text-white truncate">' + esc(svc.name) + '</h3>' +
            (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">' + esc(svc.subtitle) + '</p>' : '') +
            (svc.description ? '<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed flex-1">' + esc(svc.description) + '</p>' : '') +
            '<div class="mt-3 pt-1 flex items-center justify-between"><span class="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span></div>' +
          '</div>' +
        '</div>';
    } else if (style === 'minimal') {
      inner =
        '<div class="flex items-center justify-between gap-3 h-full">' +
          '<div class="flex items-center gap-3 min-w-0">' +
            '<div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
            '<div class="min-w-0"><h3 class="text-base font-bold text-slate-900 dark:text-white truncate">' + esc(svc.name) + '</h3>' +
            (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">' + esc(svc.subtitle) + '</p>' : '') + '</div>' +
          '</div>' +
          '<span class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-sky-400 shrink-0">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span>' +
        '</div>';
    } else {
      inner =
        '<div class="flex flex-col h-full">' +
          '<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
          '<div class="mt-5 flex-1">' +
            '<h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">' + esc(svc.name) + '</h3>' +
            (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">' + esc(svc.subtitle) + '</p>' : '') +
            (svc.description ? '<p class="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">' + esc(svc.description) + '</p>' : '') +
          '</div>' +
          '<div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">' +
            '<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span>' +
          '</div>' +
        '</div>';
    }

    if (!state.isAdmin) {
      var cls = 'group block w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 ' + (style === 'minimal' ? 'p-4 sm:p-5' : 'p-6');
      if (hasUrl) {
        return '<a href="' + esc(svc.url.trim()) + '"' + targetAttr + ' class="' + cls + '">' + inner + '</a>';
      }
      return '<button type="button" data-empty-svc="' + esc(svc.name) + '" class="' + cls + '">' + inner + '</button>';
    }

    return (
      '<div class="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ' + (svc.visible ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-75') + ' shadow-sm p-6">' +
        '<div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">' +
          '<span>#' + (idx + 1) + ' · ' + (hasUrl ? '<span class="text-emerald-700 dark:text-emerald-400 font-medium">Tautan aktif</span>' : '<span class="text-amber-700 dark:text-amber-400 font-medium">Link kosong</span>') + '</span>' +
          '<div class="flex items-center gap-1">' +
            '<button type="button" data-move="' + idx + ':-1" ' + (idx === 0 ? 'disabled ' : '') + 'class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" title="Geser maju"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>' +
            '<button type="button" data-move="' + idx + ':1" ' + (idx === total - 1 ? 'disabled ' : '') + 'class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" title="Geser mundur"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>' +
            '<button type="button" data-toggle-vis="' + esc(svc.id) + '" class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Tampilkan/Sembunyikan"><i data-lucide="' + (svc.visible ? 'eye' : 'eye-off') + '" class="w-4 h-4"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="flex-1">' + inner + '</div>' +
        '<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">' +
          '<button type="button" data-edit-svc="' + esc(svc.id) + '" class="flex-1 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 rounded-xl">Edit</button>' +
          '<button type="button" data-del-svc="' + esc(svc.id) + '" class="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl">Hapus</button>' +
        '</div>' +
      '</div>'
    );
  }

  function render() {
    applyTheme(state.theme);
    var cfg = state.config;
    var visibleList = cfg.services.filter(function (s) { return s.visible; });
    var q = state.search.trim().toLowerCase();
    var displayed = (state.isAdmin ? cfg.services : visibleList).filter(function (s) {
      if (!q) return true;
      return (
        s.name.toLowerCase().indexOf(q) !== -1 ||
        s.subtitle.toLowerCase().indexOf(q) !== -1 ||
        s.description.toLowerCase().indexOf(q) !== -1
      );
    });

    var logoHtml = cfg.school.logoUrl
      ? '<img src="' + esc(cfg.school.logoUrl) + '" alt="Logo ' + esc(cfg.school.name) + '" referrerPolicy="no-referrer" class="w-full h-full object-cover" />'
      : '<i data-lucide="shield" class="w-5 h-5 text-blue-700"></i>';

    var heroImgs = (cfg.hero.backgroundImages && cfg.hero.backgroundImages.length > 0)
      ? cfg.hero.backgroundImages
      : (cfg.hero.backgroundUrl ? [cfg.hero.backgroundUrl] : []);

    var heroBgHtml = heroImgs.map(function (src, idx) {
      var activeCls = idx === (state.heroSlideIdx % heroImgs.length) ? 'opacity-100' : 'opacity-0';
      return '<img data-hero-slide="' + idx + '" src="' + esc(src) + '" alt="' + esc(cfg.hero.title) + '" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover object-center scale-110 origin-bottom-left pointer-events-none transition-opacity duration-1000 ' + activeCls + '" />';
    }).join('');

    var html = '';

    // Navbar
    html +=
      '<header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">' +
        '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">' +
          '<button type="button" data-nav-view="landing" class="flex items-center gap-3 min-w-0 text-left">' +
            '<div class="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-center">' + logoHtml + '</div>' +
            '<div class="min-w-0">' +
              '<div class="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">' + esc(cfg.school.name) + '</div>' +
              '<div class="text-xs font-semibold text-blue-600 dark:text-sky-400 truncate">' + esc(cfg.school.subtitle) + '</div>' +
            '</div>' +
          '</button>' +
          '<div class="flex items-center gap-6 shrink-0">' +
            '<nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">' +
              '<button type="button" data-nav-view="landing" class="hover:text-blue-600 dark:hover:text-sky-400 whitespace-nowrap">Beranda</button>' +
              '<button type="button" data-nav-view="services" class="hover:text-blue-600 dark:hover:text-sky-400 whitespace-nowrap">Layanan</button>' +
              '<button type="button" data-nav-view="landing" data-scroll="profil" class="hover:text-blue-600 dark:hover:text-sky-400 whitespace-nowrap">Profil &amp; Visi</button>' +
              '<button type="button" data-nav-view="landing" data-scroll="tentang" class="hover:text-blue-600 dark:hover:text-sky-400 whitespace-nowrap">Tentang</button>' +
            '</nav>' +
            (state.isAdmin
              ? '<button type="button" id="btn-exit-admin" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl whitespace-nowrap"><i data-lucide="log-out" class="w-4 h-4"></i> Keluar Admin</button>'
              : '<button type="button" id="btn-open-admin" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl whitespace-nowrap"><i data-lucide="lock" class="w-4 h-4 text-slate-500 dark:text-slate-400"></i> Admin</button>'
            ) +
          '</div>' +
        '</div>' +
      '</header>';

    // Admin Bar
    if (state.isAdmin) {
      html +=
        '<div class="bg-slate-900 text-white border-b border-slate-800">' +
          '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">' +
            '<div class="text-xs sm:text-sm font-semibold">Mode Admin Aktif · Perubahan tersimpan otomatis di peramban</div>' +
            '<div class="flex flex-wrap items-center gap-2">' +
              '<button type="button" id="btn-add-svc" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Layanan</button>' +
              '<button type="button" id="btn-open-layout" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"><i data-lucide="sliders" class="w-4 h-4"></i> Tata Letak & PIN</button>' +
              '<button type="button" id="btn-reset-default" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg">Reset Awal</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    if (!state.showServices) {
      // Hero Section (Landing View)
      html +=
        '<section id="beranda" class="relative w-full overflow-hidden bg-gradient-to-br from-slate-800 via-sky-900 to-slate-900 text-white">' +
          heroBgHtml +
          '<div class="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-sky-950/60 to-slate-900/80"></div>' +
          '<div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center text-center">' +
            (cfg.hero.subtitle ? '<p class="text-base sm:text-xl lg:text-2xl font-bold tracking-[0.18em] uppercase text-sky-100 drop-shadow-sm">' + esc(cfg.hero.subtitle) + '</p>' : '') +
            (cfg.hero.kicker ? '<span class="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold tracking-[0.18em] uppercase text-white">' + esc(cfg.hero.kicker) + '</span>' : '') +
            '<h1 class="mt-5 font-sans text-[2.15rem] sm:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.08] smpn4-hero-lining smpn4-hero-title-anim">' + esc(cfg.hero.title) + '</h1>' +
            '<button type="button" data-nav-view="services" class="mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm sm:text-base shadow-lg transition-all">' +
              '<i data-lucide="layout-grid" class="w-4 h-4 text-slate-800"></i> ' + esc(cfg.hero.ctaLabel || 'Jelajahi Layanan') +
            '</button>' +
            '<div class="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-5 max-w-md w-full">' +
              '<div class="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 text-center"><div class="text-xl sm:text-3xl font-extrabold tabular-nums">' + visibleList.length + '</div><div class="mt-1 text-xs text-white/85">Layanan Digital</div></div>' +
              '<div class="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 text-center"><div class="text-xl sm:text-3xl font-extrabold tabular-nums">' + esc(cfg.hero.stat3Value || '100%') + '</div><div class="mt-1 text-xs text-white/85">' + esc(cfg.hero.stat3Label || 'Terintegrasi') + '</div></div>' +
            '</div>' +
          '</div>' +
        '</section>';
    }

    // Main Content Area
    if (state.showServices) {
      html +=
        '<main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">' +
          '<section id="layanan">' +
            '<div class="mb-5"><button type="button" data-nav-view="landing" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"><i data-lucide="arrow-left" class="w-4 h-4 text-slate-500 dark:text-slate-400"></i> Kembali ke Beranda</button></div>' +
            '<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">' +
              '<div>' +
                '<h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">' + esc(cfg.school.subtitle) + '</h2>' +
                '<p class="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">Pilih layanan digital ' + esc(cfg.school.name) + ' yang ingin Anda akses.</p>' +
              '</div>' +
              '<div class="relative w-full md:w-72">' +
                '<i data-lucide="search" class="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"></i>' +
                '<input id="search-svc" type="text" value="' + esc(state.search) + '" placeholder="Cari layanan..." class="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />' +
              '</div>' +
            '</div>' +
            '<div class="grid gap-5 sm:gap-6 ' + getGridColsClass(cfg.layout.columns) + '">' +
              displayed.map(function (svc) {
                var actualIdx = cfg.services.findIndex(function (x) { return x.id === svc.id; });
                return renderCard(svc, actualIdx, cfg.services.length);
              }).join('') +
            '</div>' +
            '<footer class="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">' +
              '<span>&copy; ' + new Date().getFullYear() + ' ' + esc(cfg.school.name) + ' · ' + esc(cfg.school.subtitle) + '</span>' +
              renderThemeToggleHtml() +
            '</footer>' +
          '</section>' +
        '</main>';
    } else {
      var extraAboutHtml = (cfg.about.extraItems || []).map(function (item) {
        if (!item || (!item.label && !item.value)) return '';
        return '<div><strong class="block text-xs text-slate-900 dark:text-white">' + esc(item.label || 'Informasi Tambahan') + '</strong>' + esc(item.value) + '</div>';
      }).join('');
      html +=
        '<main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">' +
          (cfg.leadership && cfg.leadership.visible
            ? '<section id="profil" class="scroll-mt-24">' +
                '<h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">' + esc(cfg.leadership.sectionTitle || 'Profil Kepala Sekolah & Visi Misi') + '</h2>' +
                '<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 lg:p-10">' +
                  '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">' +
                    '<div class="lg:col-span-4 flex flex-col items-center lg:items-start">' +
                      '<div class="w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">' +
                        (cfg.leadership.photoUrl ? '<img src="' + esc(cfg.leadership.photoUrl) + '" alt="' + esc(cfg.leadership.principalName) + '" referrerpolicy="no-referrer" class="w-full h-full object-cover object-top" />' : '') +
                      '</div>' +
                      '<div class="mt-4 w-full max-w-[260px] text-center lg:text-left">' +
                        '<h3 class="text-lg font-bold text-slate-900 dark:text-white">' + esc(cfg.leadership.principalName) + '</h3>' +
                        '<p class="text-sm font-semibold text-blue-700 dark:text-sky-400 mt-0.5">' + esc(cfg.leadership.principalTitle) + '</p>' +
                        (cfg.leadership.principalNip ? '<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">NIP. ' + esc(cfg.leadership.principalNip) + '</p>' : '') +
                      '</div>' +
                    '</div>' +
                    '<div class="lg:col-span-8">' +
                      '<h3 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">' + esc(cfg.leadership.greetingTitle) + '</h3>' +
                      '<div class="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">' + esc(cfg.leadership.greetingMessage) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8">' +
                    '<div class="lg:col-span-5"><h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">' + esc(cfg.leadership.visionTitle) + '</h3><p class="font-serif text-lg text-slate-800 dark:text-slate-100 leading-relaxed">&ldquo;' + esc(cfg.leadership.visionText) + '&rdquo;</p></div>' +
                    '<div class="lg:col-span-7 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-8"><h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">' + esc(cfg.leadership.missionTitle) + '</h3><ol class="space-y-2.5">' +
                      (cfg.leadership.missionItems || []).map(function (m, i) { return '<li class="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"><span class="font-semibold text-blue-700 dark:text-sky-400 shrink-0">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '.</span><span>' + esc(m) + '</span></li>'; }).join('') +
                    '</ol></div>' +
                  '</div>' +
                '</div>' +
              '</section>'
            : ''
          ) +
          '<section id="tentang" class="mt-14 pt-10 border-t border-slate-200/80 dark:border-slate-800">' +
            '<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">' +
              '<div class="lg:col-span-7">' +
                '<h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">' + esc(cfg.about.title) + '</h2>' +
                '<p class="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">' + esc(cfg.about.description) + '</p>' +
              '</div>' +
              '<div class="lg:col-span-5 space-y-3 text-sm text-slate-600 dark:text-slate-300 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-8">' +
                '<div><strong class="block text-xs text-slate-900 dark:text-white">Alamat</strong>' + esc(cfg.about.address) + '</div>' +
                '<div><strong class="block text-xs text-slate-900 dark:text-white">Jam Layanan</strong>' + esc(cfg.about.serviceHours) + '</div>' +
                extraAboutHtml +
              '</div>' +
            '</div>' +
            '<footer class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">' +
              '<span>&copy; ' + new Date().getFullYear() + ' ' + esc(cfg.school.name) + ' · ' + esc(cfg.school.subtitle) + '</span>' +
              renderThemeToggleHtml() +
            '</footer>' +
          '</section>' +
        '</main>';
    }

    // Toast
    if (state.toastMessage) {
      html +=
        '<div class="fixed bottom-5 right-5 z-50 max-w-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 shadow-lg text-sm font-medium">' +
          esc(state.toastMessage) +
        '</div>';
    }

    // PIN Modal
    if (state.pinModalOpen) {
      html +=
        '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
          '<div class="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">' +
            '<h3 class="text-base font-bold text-slate-900">Masuk Mode Admin</h3>' +
            '<form id="form-pin" class="space-y-3">' +
              '<input id="input-pin" type="password" inputmode="numeric" maxlength="6" placeholder="Masukkan PIN (Default: 1234)" class="w-full px-4 py-2.5 text-center tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />' +
              '<div class="flex justify-end gap-2">' +
                '<button type="button" id="btn-close-pin" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button>' +
                '<button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Masuk</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>';
    }

    // Edit/Add Service Modal
    if (state.editModalOpen) {
      var targetSvc = state.editingId ? cfg.services.find(function (s) { return s.id === state.editingId; }) : null;
      var sData = targetSvc || { name: '', subtitle: '', description: '', url: '', badgeColor: '#1E40AF', iconName: 'Layers', linkTarget: 'global', visible: true };
      html +=
        '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
          '<div class="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">' +
            '<h3 class="text-base font-bold text-slate-900">' + (targetSvc ? 'Edit Layanan' : 'Tambah Layanan Baru') + '</h3>' +
            '<form id="form-svc" class="space-y-3">' +
              '<input id="svc-name" required value="' + esc(sData.name) + '" placeholder="Nama Layanan" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
              '<input id="svc-sub" value="' + esc(sData.subtitle) + '" placeholder="Subjudul" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
              '<textarea id="svc-desc" rows="2" placeholder="Deskripsi" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl">' + esc(sData.description) + '</textarea>' +
              '<input id="svc-url" value="' + esc(sData.url) + '" placeholder="URL Tujuan (https://...)" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
              '<div class="grid grid-cols-2 gap-3">' +
                '<div><label class="block text-xs font-semibold mb-1">Warna Badge</label><input id="svc-color" type="color" value="' + esc(sData.badgeColor) + '" class="w-full h-10 rounded-lg border border-slate-300" /></div>' +
                '<div><label class="block text-xs font-semibold mb-1">Nama Ikon Lucide</label><input id="svc-icon" value="' + esc(sData.iconName) + '" placeholder="Layers, BookOpen..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
              '</div>' +
              '<div class="flex justify-end gap-2 pt-2">' +
                '<button type="button" id="btn-close-svc" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button>' +
                '<button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Simpan</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>';
    }

    // Layout & PIN Modal
    if (state.layoutModalOpen) {
      html +=
        '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
          '<div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">' +
            '<h3 class="text-base font-bold text-slate-900">Pengaturan Tata Letak & PIN</h3>' +
            '<form id="form-layout" class="space-y-3">' +
              '<div><label class="block text-xs font-semibold mb-1">Kolom Grid</label>' +
              '<select id="set-cols" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' +
                '<option value="2"' + (cfg.layout.columns === 2 ? ' selected' : '') + '>2 Kolom</option>' +
                '<option value="3"' + (cfg.layout.columns === 3 ? ' selected' : '') + '>3 Kolom</option>' +
                '<option value="4"' + (cfg.layout.columns === 4 ? ' selected' : '') + '>4 Kolom</option>' +
              '</select></div>' +
              '<div><label class="block text-xs font-semibold mb-1">Gaya Kartu</label>' +
              '<select id="set-style" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' +
                '<option value="vertical"' + (cfg.layout.cardStyle === 'vertical' ? ' selected' : '') + '>Vertikal (Default)</option>' +
                '<option value="horizontal"' + (cfg.layout.cardStyle === 'horizontal' ? ' selected' : '') + '>Horizontal / Kompak</option>' +
                '<option value="minimal"' + (cfg.layout.cardStyle === 'minimal' ? ' selected' : '') + '>Minimalis</option>' +
              '</select></div>' +
              '<div><label class="block text-xs font-semibold mb-1">Ganti PIN Admin Baru (opsional)</label>' +
              '<input id="set-pin" type="password" inputmode="numeric" maxlength="6" placeholder="Kosongkan jika tidak diubah" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
              '<div class="flex justify-end gap-2 pt-2">' +
                '<button type="button" id="btn-close-layout" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button>' +
                '<button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Simpan</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>';
    }

    root.innerHTML = html;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    bindEvents();
  }

  function bindEvents() {
    var searchEl = document.getElementById('search-svc');
    if (searchEl) {
      searchEl.addEventListener('input', function (e) {
        var pos = e.target.selectionStart;
        state.search = e.target.value;
        render();
        var nextSearch = document.getElementById('search-svc');
        if (nextSearch) {
          nextSearch.focus();
          nextSearch.setSelectionRange(pos, pos);
        }
      });
    }

    root.querySelectorAll('[data-set-theme]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextTheme = btn.getAttribute('data-set-theme') === 'dark' ? 'dark' : 'light';
        state.theme = nextTheme;
        applyTheme(nextTheme);
        render();
      });
    });

    root.querySelectorAll('[data-empty-svc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showToast('Tautan untuk layanan "' + btn.getAttribute('data-empty-svc') + '" belum diatur. Masuk ke menu Admin untuk menambahkan link.');
      });
    });

    var btnOpenAdmin = document.getElementById('btn-open-admin');
    if (btnOpenAdmin) btnOpenAdmin.onclick = function () { state.pinModalOpen = true; render(); };

    var btnExitAdmin = document.getElementById('btn-exit-admin');
    if (btnExitAdmin) btnExitAdmin.onclick = function () { state.isAdmin = false; render(); };

    var btnClosePin = document.getElementById('btn-close-pin');
    if (btnClosePin) btnClosePin.onclick = function () { state.pinModalOpen = false; render(); };

    var formPin = document.getElementById('form-pin');
    if (formPin) {
      formPin.onsubmit = function (e) {
        e.preventDefault();
        var val = document.getElementById('input-pin').value;
        if (val === state.config.adminPin) {
          state.pinModalOpen = false;
          state.isAdmin = true;
          showToast('Berhasil masuk Mode Admin.');
        } else {
          showToast('PIN salah! PIN default adalah 1234.');
        }
      };
    }

    root.querySelectorAll('[data-nav-view]').forEach(function (btn) {
      btn.onclick = function () {
        var view = btn.getAttribute('data-nav-view');
        var scrollTarget = btn.getAttribute('data-scroll');
        state.showServices = view === 'services';
        render();
        if (scrollTarget) {
          setTimeout(function () {
            var el = document.getElementById(scrollTarget);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 30);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
    });

    var btnAdd = document.getElementById('btn-add-svc');
    if (btnAdd) btnAdd.onclick = function () { state.showServices = true; state.editingId = null; state.editModalOpen = true; render(); };

    var btnCloseSvc = document.getElementById('btn-close-svc');
    if (btnCloseSvc) btnCloseSvc.onclick = function () { state.editModalOpen = false; render(); };

    var formSvc = document.getElementById('form-svc');
    if (formSvc) {
      formSvc.onsubmit = function (e) {
        e.preventDefault();
        var payload = {
          id: state.editingId || 'svc-' + Date.now(),
          name: document.getElementById('svc-name').value.trim(),
          subtitle: document.getElementById('svc-sub').value.trim(),
          description: document.getElementById('svc-desc').value.trim(),
          url: document.getElementById('svc-url').value.trim(),
          badgeColor: document.getElementById('svc-color').value,
          iconName: document.getElementById('svc-icon').value.trim() || 'Layers',
          linkTarget: 'global',
          visible: true
        };
        if (state.editingId) {
          state.config.services = state.config.services.map(function (s) {
            return s.id === state.editingId ? Object.assign({}, s, payload) : s;
          });
        } else {
          state.config.services.push(payload);
        }
        saveConfig(state.config);
        state.editModalOpen = false;
        showToast('Perubahan layanan tersimpan.');
      };
    }

    root.querySelectorAll('[data-edit-svc]').forEach(function (btn) {
      btn.onclick = function () {
        state.editingId = btn.getAttribute('data-edit-svc');
        state.editModalOpen = true;
        render();
      };
    });

    root.querySelectorAll('[data-del-svc]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-del-svc');
        state.config.services = state.config.services.filter(function (s) { return s.id !== id; });
        saveConfig(state.config);
        showToast('Layanan dihapus.');
      };
    });

    root.querySelectorAll('[data-toggle-vis]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-toggle-vis');
        state.config.services = state.config.services.map(function (s) {
          return s.id === id ? Object.assign({}, s, { visible: !s.visible }) : s;
        });
        saveConfig(state.config);
        render();
      };
    });

    root.querySelectorAll('[data-move]').forEach(function (btn) {
      btn.onclick = function () {
        var parts = btn.getAttribute('data-move').split(':');
        var idx = parseInt(parts[0], 10);
        var dir = parseInt(parts[1], 10);
        var next = idx + dir;
        if (next < 0 || next >= state.config.services.length) return;
        var arr = state.config.services.slice();
        var moved = arr.splice(idx, 1)[0];
        arr.splice(next, 0, moved);
        state.config.services = arr;
        saveConfig(state.config);
        render();
      };
    });

    var btnLayout = document.getElementById('btn-open-layout');
    if (btnLayout) btnLayout.onclick = function () { state.layoutModalOpen = true; render(); };

    var btnCloseLayout = document.getElementById('btn-close-layout');
    if (btnCloseLayout) btnCloseLayout.onclick = function () { state.layoutModalOpen = false; render(); };

    var formLayout = document.getElementById('form-layout');
    if (formLayout) {
      formLayout.onsubmit = function (e) {
        e.preventDefault();
        state.config.layout.columns = parseInt(document.getElementById('set-cols').value, 10);
        state.config.layout.cardStyle = document.getElementById('set-style').value;
        var newPin = document.getElementById('set-pin').value.trim();
        if (/^\\d{4,6}$/.test(newPin)) {
          state.config.adminPin = newPin;
        }
        saveConfig(state.config);
        state.layoutModalOpen = false;
        showToast('Pengaturan diperbarui.');
      };
    }

    var btnReset = document.getElementById('btn-reset-default');
    if (btnReset) {
      btnReset.onclick = function () {
        localStorage.removeItem(STORAGE_KEY);
        state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        showToast('Pengaturan dikembalikan ke awal.');
      };
    }
  }

  render();
})();
</script>`;

  if (options.format === 'snippet') {
    return innerBody;
  }

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(embeddedConfig.school.name)} - ${escapeHtml(embeddedConfig.school.subtitle)}</title>
</head>
<body class="bg-[#F1F5F9] m-0 p-0">
${innerBody}
</body>
</html>`;
}
