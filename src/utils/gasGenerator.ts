import { PortalConfig } from '../types';

export function generateGasBackendScript(config: Omit<PortalConfig, 'adminPin'>): string {
  const initialJson = JSON.stringify(config, null, 2);

  return `/**
 * ============================================================================
 * BACKEND GOOGLE APPS SCRIPT (Code.gs) + SETUP DATABASE + LOGIN ADMIN
 * Portal Layanan Digital - ${config.school.name}
 * ============================================================================
 * Cara Penggunaan:
 * 1. Buka https://script.google.com -> Proyek Baru -> tempel seluruh kode ini ke Code.gs
 * 2. Buat file HTML bernama "Index" (Index.html) -> tempel 1 file Frontend Lengkap
 * 3. Jalankan fungsi "setupDatabase" sekali dari editor Apps Script (Run > setupDatabase)
 *    untuk membuat Google Spreadsheet & tabel database secara otomatis.
 * 4. Klik Terapkan (Deploy) > Deployment baru > Aplikasi Web (Web App)
 *    - Jalankan sebagai: Saya (Me)
 *    - Yang memiliki akses: Siapa saja (Anyone)
 * 5. Salin URL Web App untuk disematkan ke Google Sites atau Blogger!
 */

var PROP_SS_ID = 'PORTAL_SPREADSHEET_ID';
var PROP_ADMIN_USERNAME = 'PORTAL_ADMIN_USERNAME';
var PROP_ADMIN_PASS_HASH = 'PORTAL_ADMIN_PASS_HASH';
var PROP_ADMIN_SALT = 'PORTAL_ADMIN_SALT';

var DEFAULT_DATA = ${initialJson};

function hashSecret_(secret, salt) {
  var raw = salt + ':' + String(secret);
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function getOrCreateSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(PROP_SS_ID);
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {}
  }
  var active = null;
  try {
    active = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  var ss = active || SpreadsheetApp.create('Database Portal - ' + DEFAULT_DATA.school.name);
  props.setProperty(PROP_SS_ID, ss.getId());
  return ss;
}

/**
 * SETUP DATABASE OTOMATIS
 * Jalankan fungsi ini 1x di editor Apps Script untuk membuat sheet Settings,
 * Services, dan HeroSlides beserta seluruh data awal.
 */
function setupDatabase(forceReset) {
  var ss = getOrCreateSpreadsheet_();
  var now = new Date().toISOString();

  var settingsSheet = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  if (forceReset || settingsSheet.getLastRow() === 0) {
    settingsSheet.clear();
    settingsSheet.appendRow(['key', 'value', 'updated_at']);
    settingsSheet.appendRow(['school', JSON.stringify(DEFAULT_DATA.school), now]);
    settingsSheet.appendRow(['hero', JSON.stringify(DEFAULT_DATA.hero), now]);
    settingsSheet.appendRow(['about', JSON.stringify(DEFAULT_DATA.about), now]);
    settingsSheet.appendRow(['leadership', JSON.stringify(DEFAULT_DATA.leadership), now]);
    settingsSheet.appendRow(['layout', JSON.stringify(DEFAULT_DATA.layout), now]);
    settingsSheet.setFrozenRows(1);
  }

  var servicesSheet = ss.getSheetByName('Services') || ss.insertSheet('Services');
  if (forceReset || servicesSheet.getLastRow() === 0) {
    servicesSheet.clear();
    servicesSheet.appendRow([
      'id', 'sort_order', 'name', 'subtitle', 'description',
      'badge_color', 'icon_name', 'custom_icon_url', 'url', 'link_target', 'visible'
    ]);
    DEFAULT_DATA.services.forEach(function (svc, idx) {
      servicesSheet.appendRow([
        svc.id,
        idx,
        svc.name,
        svc.subtitle || '',
        svc.description || '',
        svc.badgeColor || '#1E40AF',
        svc.iconName || 'Layers',
        svc.customIconUrl || '',
        svc.url || '',
        svc.linkTarget || 'global',
        svc.visible !== false ? 'TRUE' : 'FALSE'
      ]);
    });
    servicesSheet.setFrozenRows(1);
  }

  var slidesSheet = ss.getSheetByName('HeroSlides') || ss.insertSheet('HeroSlides');
  if (forceReset || slidesSheet.getLastRow() === 0) {
    slidesSheet.clear();
    slidesSheet.appendRow(['sort_order', 'image_url']);
    var slides = (DEFAULT_DATA.hero && DEFAULT_DATA.hero.backgroundImages) || [];
    slides.forEach(function (imgUrl, idx) {
      slidesSheet.appendRow([idx, imgUrl]);
    });
    slidesSheet.setFrozenRows(1);
  }

  if (forceReset) {
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty(PROP_ADMIN_USERNAME);
    props.deleteProperty(PROP_ADMIN_PASS_HASH);
    props.deleteProperty(PROP_ADMIN_SALT);
  }

  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    message: 'Database berhasil diinisialisasi.'
  };
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(DEFAULT_DATA.school.name + ' - ' + DEFAULT_DATA.school.subtitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getPortalData() {
  var ss = getOrCreateSpreadsheet_();
  if (!ss.getSheetByName('Settings') || !ss.getSheetByName('Services')) {
    setupDatabase(false);
  }

  var settingsSheet = ss.getSheetByName('Settings');
  var settingsRows = settingsSheet.getDataRange().getValues();
  var settingsMap = {};
  for (var i = 1; i < settingsRows.length; i++) {
    var k = String(settingsRows[i][0] || '').trim();
    var v = String(settingsRows[i][1] || '');
    if (k) {
      try { settingsMap[k] = JSON.parse(v); } catch (e) {}
    }
  }

  var servicesSheet = ss.getSheetByName('Services');
  var svcRows = servicesSheet.getDataRange().getValues();
  var services = [];
  for (var j = 1; j < svcRows.length; j++) {
    var row = svcRows[j];
    if (!row[0]) continue;
    services.push({
      id: String(row[0]),
      name: String(row[2] || ''),
      subtitle: String(row[3] || ''),
      description: String(row[4] || ''),
      badgeColor: String(row[5] || '#1E40AF'),
      iconName: String(row[6] || 'Layers'),
      customIconUrl: String(row[7] || '') || undefined,
      url: String(row[8] || ''),
      linkTarget: String(row[9] || 'global'),
      visible: String(row[10]).toUpperCase() !== 'FALSE'
    });
  }

  var slidesSheet = ss.getSheetByName('HeroSlides');
  var backgroundImages = [];
  if (slidesSheet && slidesSheet.getLastRow() > 1) {
    var slideRows = slidesSheet.getDataRange().getValues();
    for (var s = 1; s < slideRows.length; s++) {
      if (slideRows[s][1]) backgroundImages.push(String(slideRows[s][1]));
    }
  }

  var hero = settingsMap.hero || DEFAULT_DATA.hero;
  if (backgroundImages.length > 0) {
    hero.backgroundImages = backgroundImages;
    hero.backgroundUrl = backgroundImages[0];
  }

  var props = PropertiesService.getScriptProperties();
  var storedUsername = String(props.getProperty(PROP_ADMIN_USERNAME) || '');
  var credentialsConfigured = Boolean(storedUsername && props.getProperty(PROP_ADMIN_PASS_HASH));

  return {
    school: settingsMap.school || DEFAULT_DATA.school,
    hero: hero,
    about: settingsMap.about || DEFAULT_DATA.about,
    leadership: settingsMap.leadership || DEFAULT_DATA.leadership,
    layout: settingsMap.layout || DEFAULT_DATA.layout,
    services: services,
    credentialsConfigured: credentialsConfigured,
    adminUsernameHint: storedUsername
  };
}

function setupInitialCredentials(username, password) {
  var cleanUser = String(username || '').trim().toLowerCase();
  var cleanPass = String(password || '').trim();
  if (!/^[a-zA-Z0-9._@-]{3,64}$/.test(cleanUser)) {
    throw new Error('Username minimal 3 karakter (huruf, angka, titik, garis bawah, atau @).');
  }
  if (cleanPass.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty(PROP_ADMIN_USERNAME) && props.getProperty(PROP_ADMIN_PASS_HASH)) {
      throw new Error('Akun Admin sudah terdaftar. Gunakan form login.');
    }
    var salt = Utilities.getUuid();
    props.setProperty(PROP_ADMIN_USERNAME, cleanUser);
    props.setProperty(PROP_ADMIN_SALT, salt);
    props.setProperty(PROP_ADMIN_PASS_HASH, hashSecret_(cleanPass, salt));
  } finally {
    lock.releaseLock();
  }

  var sessionToken = Utilities.getUuid() + '-' + Utilities.getUuid();
  CacheService.getScriptCache().put('admin_sess_' + sessionToken, cleanUser, 21600);
  return { ok: true, sessionToken: sessionToken, adminUsernameHint: cleanUser };
}

function verifyAdminLogin(username, password) {
  var cleanUser = String(username || '').trim().toLowerCase();
  var cleanPass = String(password || '').trim();
  var props = PropertiesService.getScriptProperties();
  var storedUser = String(props.getProperty(PROP_ADMIN_USERNAME) || '').toLowerCase();
  var salt = props.getProperty(PROP_ADMIN_SALT);
  var expectedHash = props.getProperty(PROP_ADMIN_PASS_HASH);

  if (!storedUser || !salt || !expectedHash) {
    throw new Error('Akun Admin belum diatur.');
  }
  if (cleanUser !== storedUser || hashSecret_(cleanPass, salt) !== expectedHash) {
    throw new Error('Username atau password Admin tidak sesuai.');
  }

  var sessionToken = Utilities.getUuid() + '-' + Utilities.getUuid();
  CacheService.getScriptCache().put('admin_sess_' + sessionToken, storedUser, 21600);
  return { ok: true, sessionToken: sessionToken, adminUsernameHint: storedUser };
}

function assertSession_(sessionToken) {
  if (!sessionToken) throw new Error('Sesi Admin tidak valid.');
  var username = CacheService.getScriptCache().get('admin_sess_' + String(sessionToken));
  if (!username) throw new Error('Sesi Admin berakhir. Silakan login ulang.');
}

function changeAdminCredentials(sessionToken, currentPassword, newUsername, newPassword) {
  assertSession_(sessionToken);
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty(PROP_ADMIN_SALT);
  var expectedHash = props.getProperty(PROP_ADMIN_PASS_HASH);
  if (!salt || !expectedHash || hashSecret_(String(currentPassword || '').trim(), salt) !== expectedHash) {
    throw new Error('Password saat ini tidak sesuai.');
  }
  var cleanUser = String(newUsername || '').trim().toLowerCase();
  var cleanNewPass = String(newPassword || '').trim();
  if (cleanUser) {
    if (!/^[a-zA-Z0-9._@-]{3,64}$/.test(cleanUser)) {
      throw new Error('Username minimal 3 karakter.');
    }
    props.setProperty(PROP_ADMIN_USERNAME, cleanUser);
  }
  if (cleanNewPass) {
    if (cleanNewPass.length < 6) throw new Error('Password baru minimal 6 karakter.');
    var newSalt = Utilities.getUuid();
    props.setProperty(PROP_ADMIN_SALT, newSalt);
    props.setProperty(PROP_ADMIN_PASS_HASH, hashSecret_(cleanNewPass, newSalt));
  }
  return { ok: true, adminUsernameHint: props.getProperty(PROP_ADMIN_USERNAME) || cleanUser };
}

function savePortalData(sessionToken, payload) {
  assertSession_(sessionToken);

  var ss = getOrCreateSpreadsheet_();
  var now = new Date().toISOString();

  var settingsSheet = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  settingsSheet.clear();
  settingsSheet.appendRow(['key', 'value', 'updated_at']);
  settingsSheet.appendRow(['school', JSON.stringify(payload.school), now]);
  settingsSheet.appendRow(['hero', JSON.stringify(payload.hero), now]);
  settingsSheet.appendRow(['about', JSON.stringify(payload.about), now]);
  settingsSheet.appendRow(['leadership', JSON.stringify(payload.leadership || DEFAULT_DATA.leadership), now]);
  settingsSheet.appendRow(['layout', JSON.stringify(payload.layout), now]);
  settingsSheet.setFrozenRows(1);

  var servicesSheet = ss.getSheetByName('Services') || ss.insertSheet('Services');
  servicesSheet.clear();
  servicesSheet.appendRow([
    'id', 'sort_order', 'name', 'subtitle', 'description',
    'badge_color', 'icon_name', 'custom_icon_url', 'url', 'link_target', 'visible'
  ]);
  (payload.services || []).forEach(function (svc, idx) {
    servicesSheet.appendRow([
      svc.id,
      idx,
      svc.name,
      svc.subtitle || '',
      svc.description || '',
      svc.badgeColor || '#1E40AF',
      svc.iconName || 'Layers',
      svc.customIconUrl || '',
      svc.url || '',
      svc.linkTarget || 'global',
      svc.visible !== false ? 'TRUE' : 'FALSE'
    ]);
  });
  servicesSheet.setFrozenRows(1);

  var slidesSheet = ss.getSheetByName('HeroSlides') || ss.insertSheet('HeroSlides');
  slidesSheet.clear();
  slidesSheet.appendRow(['sort_order', 'image_url']);
  var slides = (payload.hero && payload.hero.backgroundImages) || [];
  slides.forEach(function (imgUrl, idx) {
    slidesSheet.appendRow([idx, imgUrl]);
  });
  slidesSheet.setFrozenRows(1);

  return getPortalData();
}

function resetDatabaseWithSession(sessionToken) {
  assertSession_(sessionToken);
  setupDatabase(true);
  return getPortalData();
}
`;
}

export function generateSingleFileFrontendHtml(config: Omit<PortalConfig, 'adminPin'>): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  const resolveUrl = (u: string): string => {
    const t = String(u || '').trim();
    if (!t) return '';
    if (t.startsWith('data:') || /^https?:\/\//i.test(t)) return t;
    if (origin && t.startsWith('/')) return `${origin}${t}`;
    return t;
  };

  const resolvedConfig = {
    ...config,
    school: {
      ...config.school,
      logoUrl: resolveUrl(config.school.logoUrl),
    },
    hero: {
      ...config.hero,
      backgroundUrl: resolveUrl(config.hero.backgroundUrl),
      backgroundImages: (config.hero.backgroundImages || []).map(resolveUrl).filter(Boolean),
    },
    leadership: {
      ...config.leadership,
      photoUrl: resolveUrl(config.leadership.photoUrl),
    },
  };

  const safeJson = JSON.stringify(resolvedConfig)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--');

  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${resolvedConfig.school.name} - ${resolvedConfig.school.subtitle}</title>
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
            serif: ['"Playfair Display"', 'Georgia', 'serif']
          }
        }
      }
    };
  </script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    html { font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .hero-lining { font-variant-numeric: lining-nums tabular-nums; }
    @keyframes heroShimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes heroFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .hero-title-anim {
      background-image: linear-gradient(110deg, #ffffff 0%, #ffffff 36%, #fde68a 50%, #ffffff 64%, #ffffff 100%);
      background-size: 240% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: heroFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both, heroShimmer 5.5s ease-in-out infinite;
      filter: drop-shadow(0 4px 18px rgba(15, 23, 42, 0.45));
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
      .hero-title-anim { background-image: none; color: #ffffff; animation: none; }
    }
  </style>
</head>
<body class="bg-[#F1F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased m-0 p-0 transition-colors duration-200">
  <div id="smpn4-app" class="min-h-screen flex flex-col"></div>

  <script>
  (function () {
    var INITIAL_DATA = ${safeJson};
    var HAS_GAS = typeof google !== 'undefined' && google.script && google.script.run;

    var ICON_CHOICES = [
      'layers', 'book-open', 'bar-chart-2', 'calendar-check', 'user-check',
      'clipboard-list', 'shield-check', 'activity', 'graduation-cap', 'school',
      'users', 'file-text', 'award', 'bell', 'mail', 'globe', 'database', 'laptop'
    ];

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function normalizeImgUrl(url) {
      var t = String(url || '').trim();
      if (!t || t.indexOf('data:') === 0) return t;
      var m1 = t.match(/drive\\.google\\.com\\/file\\/d\\/([a-zA-Z0-9_-]+)/i);
      if (m1 && m1[1]) return 'https://drive.google.com/thumbnail?id=' + m1[1] + '&sz=w1600';
      var m2 = t.match(/drive\\.google\\.com\\/(?:open|uc|thumbnail)\\?[^#]*\\bid=([a-zA-Z0-9_-]+)/i);
      if (m2 && m2[1]) return 'https://drive.google.com/thumbnail?id=' + m2[1] + '&sz=w1600';
      return t;
    }

    function isValidHttpUrl(val) {
      var s = String(val || '').trim();
      if (!s) return false;
      try {
        var u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch (e) { return false; }
    }

    var THEME_KEY = 'smpn4_portal_theme_v1';

    function loadTheme() {
      try {
        return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
      } catch (e) { return 'light'; }
    }

    function applyTheme(t) {
      document.documentElement.classList.toggle('dark', t === 'dark');
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    }

    var state = {
      data: JSON.parse(JSON.stringify(INITIAL_DATA)),
      theme: loadTheme(),
      credentialsConfigured: false,
      adminUsernameHint: '',
      sessionToken: '',
      isAdmin: false,
      showServices: false,
      search: '',
      heroIdx: 0,
      loginModalOpen: false,
      editModalOpen: false,
      editingId: null,
      settingsModalOpen: false,
      leadershipModalOpen: false,
      toastMsg: '',
      toastTimer: null
    };

    applyTheme(state.theme);

    var root = document.getElementById('smpn4-app');

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

    function showToast(msg) {
      state.toastMsg = msg;
      render();
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(function () {
        state.toastMsg = '';
        render();
      }, 4200);
    }

    function loadInitialData() {
      if (HAS_GAS) {
        google.script.run
          .withSuccessHandler(function (res) {
            if (res) {
              state.data = Object.assign({}, INITIAL_DATA, res);
              state.credentialsConfigured = Boolean(res.credentialsConfigured);
              state.adminUsernameHint = res.adminUsernameHint || '';
              render();
            }
          })
          .withFailureHandler(function () {
            showToast('Menggunakan data awal bawaan.');
          })
          .getPortalData();
      }
    }

    function persistData(onDone) {
      if (HAS_GAS) {
        google.script.run
          .withSuccessHandler(function (res) {
            if (res) state.data = Object.assign({}, state.data, res);
            render();
            if (onDone) onDone();
          })
          .withFailureHandler(function (err) {
            showToast((err && err.message) || 'Gagal menyimpan ke Google Sheets.');
          })
          .savePortalData(state.sessionToken, state.data);
      } else {
        render();
        if (onDone) onDone();
      }
    }

    setInterval(function () {
      var imgs = (state.data.hero && state.data.hero.backgroundImages) || [];
      if (imgs.length <= 1) return;
      state.heroIdx = (state.heroIdx + 1) % imgs.length;
      root.querySelectorAll('[data-hero-slide]').forEach(function (el, idx) {
        el.classList.toggle('opacity-100', idx === state.heroIdx);
        el.classList.toggle('opacity-0', idx !== state.heroIdx);
      });
      root.querySelectorAll('[data-hero-dot]').forEach(function (dot, idx) {
        dot.classList.toggle('w-7', idx === state.heroIdx);
        dot.classList.toggle('bg-white', idx === state.heroIdx);
        dot.classList.toggle('w-2', idx !== state.heroIdx);
        dot.classList.toggle('bg-white/45', idx !== state.heroIdx);
      });
    }, 15000);

    function getColsClass(cols) {
      if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
      if (cols === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }

    function renderServiceCard(svc, idx, total) {
      var cfg = state.data;
      var hasUrl = isValidHttpUrl(svc.url);
      var targetMode = svc.linkTarget === 'global' ? cfg.layout.globalLinkTarget : svc.linkTarget;
      var targetAttr = targetMode === 'new_tab' ? ' target="_blank" rel="noopener noreferrer"' : '';
      var iconName = String(svc.iconName || 'layers').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      var iconHtml = svc.customIconUrl
        ? '<img src="' + esc(svc.customIconUrl) + '" alt="' + esc(svc.name) + '" class="w-7 h-7 object-contain rounded" />'
        : '<i data-lucide="' + esc(iconName) + '" class="w-6 h-6 text-white"></i>';

      var style = cfg.layout.cardStyle || 'vertical';
      var body = '';

      if (style === 'horizontal') {
        body =
          '<div class="flex items-start gap-4 h-full">' +
            '<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
            '<div class="flex-1 min-w-0 flex flex-col h-full">' +
              '<h3 class="text-base font-bold text-slate-900 dark:text-white truncate">' + esc(svc.name) + '</h3>' +
              (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">' + esc(svc.subtitle) + '</p>' : '') +
              (svc.description ? '<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2 flex-1">' + esc(svc.description) + '</p>' : '') +
              '<div class="mt-3 pt-1"><span class="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span></div>' +
            '</div>' +
          '</div>';
      } else if (style === 'minimal') {
        body =
          '<div class="flex items-center justify-between gap-3 h-full">' +
            '<div class="flex items-center gap-3 min-w-0">' +
              '<div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
              '<div class="min-w-0"><h3 class="text-base font-bold text-slate-900 dark:text-white truncate">' + esc(svc.name) + '</h3>' +
              (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">' + esc(svc.subtitle) + '</p>' : '') + '</div>' +
            '</div>' +
            '<span class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-sky-400 shrink-0">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span>' +
          '</div>';
      } else {
        body =
          '<div class="flex flex-col h-full">' +
            '<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background-color:' + esc(svc.badgeColor) + '">' + iconHtml + '</div>' +
            '<div class="mt-5 flex-1">' +
              '<h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">' + esc(svc.name) + '</h3>' +
              (svc.subtitle ? '<p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">' + esc(svc.subtitle) + '</p>' : '') +
              (svc.description ? '<p class="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">' + esc(svc.description) + '</p>' : '') +
            '</div>' +
            '<div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800"><span class="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400">Buka <i data-lucide="arrow-right" class="w-4 h-4"></i></span></div>' +
          '</div>';
      }

      if (!state.isAdmin) {
        var cardCls = 'group block w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 ' + (style === 'minimal' ? 'p-4 sm:p-5' : 'p-6');
        return hasUrl
          ? '<a href="' + esc(svc.url.trim()) + '"' + targetAttr + ' class="' + cardCls + '">' + body + '</a>'
          : '<button type="button" data-empty-svc="' + esc(svc.name) + '" class="' + cardCls + '">' + body + '</button>';
      }

      return (
        '<div class="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border ' + (svc.visible ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-75') + ' shadow-sm p-6">' +
          '<div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">' +
            '<span>#' + (idx + 1) + ' · ' + (hasUrl ? '<span class="text-emerald-700 dark:text-emerald-400 font-medium">Tautan aktif</span>' : '<span class="text-amber-700 dark:text-amber-400 font-medium">Link kosong</span>') + '</span>' +
            '<div class="flex items-center gap-1">' +
              '<button type="button" data-move="' + idx + ':-1" ' + (idx === 0 ? 'disabled ' : '') + 'class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>' +
              '<button type="button" data-move="' + idx + ':1" ' + (idx === total - 1 ? 'disabled ' : '') + 'class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>' +
              '<button type="button" data-vis="' + esc(svc.id) + '" class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><i data-lucide="' + (svc.visible ? 'eye' : 'eye-off') + '" class="w-4 h-4"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="flex-1">' + body + '</div>' +
          '<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">' +
            '<button type="button" data-edit="' + esc(svc.id) + '" class="flex-1 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 rounded-xl">Edit</button>' +
            '<button type="button" data-del="' + esc(svc.id) + '" class="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl">Hapus</button>' +
          '</div>' +
        '</div>'
      );
    }

    function renderLeadershipSection(cfg) {
      var lead = cfg.leadership;
      if (!lead) return '';
      if (!lead.visible && !state.isAdmin) return '';

      var photoHtml = lead.photoUrl
        ? '<img src="' + esc(normalizeImgUrl(lead.photoUrl)) + '" alt="' + esc(lead.principalName) + '" referrerpolicy="no-referrer" class="w-full h-full object-cover object-top" />'
        : '<div class="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"><i data-lucide="user" class="w-12 h-12"></i></div>';

      var missionListHtml = (lead.missionItems || []).map(function (m, idx) {
        var num = (idx + 1 < 10 ? '0' : '') + (idx + 1) + '.';
        return '<li class="flex items-start gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">' +
          '<span class="font-semibold text-blue-700 dark:text-sky-400 shrink-0 mt-0.5">' + num + '</span>' +
          '<span>' + esc(m) + '</span>' +
        '</li>';
      }).join('');

      return (
        '<section id="profil" class="scroll-mt-24">' +
          '<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">' +
            '<div><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">' + esc(lead.sectionTitle || 'Profil Kepala Sekolah & Visi Misi') + '</h2></div>' +
            (state.isAdmin
              ? '<button type="button" id="btn-edit-leadership" class="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 border border-blue-200 dark:border-sky-800 rounded-xl whitespace-nowrap shrink-0"><i data-lucide="pencil" class="w-4 h-4"></i> Edit Profil & Visi Misi</button>'
              : ''
            ) +
          '</div>' +
          '<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 lg:p-10">' +
            '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">' +
              '<div class="lg:col-span-4 flex flex-col items-center lg:items-start">' +
                '<div class="w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">' + photoHtml + '</div>' +
                '<div class="mt-4 w-full max-w-[280px] text-center lg:text-left">' +
                  '<h3 class="text-lg font-bold text-slate-900 dark:text-white">' + esc(lead.principalName) + '</h3>' +
                  '<p class="text-sm font-semibold text-blue-700 dark:text-sky-400 mt-0.5">' + esc(lead.principalTitle) + '</p>' +
                  (lead.principalNip ? '<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">NIP. ' + esc(lead.principalNip) + '</p>' : '') +
                '</div>' +
              '</div>' +
              '<div class="lg:col-span-8 flex flex-col justify-center">' +
                '<h3 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">' + esc(lead.greetingTitle || 'Sambutan Kepala Sekolah') + '</h3>' +
                '<div class="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">' + esc(lead.greetingMessage) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">' +
              '<div class="lg:col-span-5">' +
                '<h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">' + esc(lead.visionTitle || 'Visi Sekolah') + '</h3>' +
                '<p class="font-serif text-lg sm:text-xl text-slate-800 dark:text-slate-100 leading-relaxed">&ldquo;' + esc(lead.visionText) + '&rdquo;</p>' +
              '</div>' +
              '<div class="lg:col-span-7 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-10">' +
                '<h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">' + esc(lead.missionTitle || 'Misi Sekolah') + '</h3>' +
                '<ol class="space-y-3">' + missionListHtml + '</ol>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>'
      );
    }

    function render() {
      applyTheme(state.theme);
      var cfg = state.data;
      var visibleList = cfg.services.filter(function (s) { return s.visible; });
      var q = state.search.trim().toLowerCase();
      var displayed = (state.isAdmin ? cfg.services : visibleList).filter(function (s) {
        if (!q) return true;
        return s.name.toLowerCase().indexOf(q) !== -1 || s.subtitle.toLowerCase().indexOf(q) !== -1 || s.description.toLowerCase().indexOf(q) !== -1;
      });

      var logoHtml = cfg.school.logoUrl
        ? '<img src="' + esc(cfg.school.logoUrl) + '" alt="Logo" referrerpolicy="no-referrer" class="w-full h-full object-cover" />'
        : '<i data-lucide="shield" class="w-5 h-5 text-blue-700"></i>';

      var heroImgs = (cfg.hero.backgroundImages && cfg.hero.backgroundImages.length > 0)
        ? cfg.hero.backgroundImages
        : (cfg.hero.backgroundUrl ? [cfg.hero.backgroundUrl] : []);

      var slidesHtml = heroImgs.map(function (src, idx) {
        var active = idx === (state.heroIdx % heroImgs.length);
        return '<img data-hero-slide="' + idx + '" src="' + esc(src) + '" alt="Background Hero" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover object-center scale-110 origin-bottom-left pointer-events-none transition-opacity duration-1000 ' + (active ? 'opacity-100' : 'opacity-0') + '" />';
      }).join('');

      var dotsHtml = heroImgs.length > 1
        ? '<div class="mt-7 flex items-center justify-center gap-2">' + heroImgs.map(function (_, idx) {
            var active = idx === (state.heroIdx % heroImgs.length);
            return '<button type="button" data-hero-dot="' + idx + '" class="h-2 rounded-full transition-all ' + (active ? 'w-7 bg-white' : 'w-2 bg-white/45') + '"></button>';
          }).join('') + '</div>'
        : '';

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
              '<div class="text-xs sm:text-sm font-semibold">Mode Admin Aktif · Tersinkron ke Google Sheets</div>' +
              '<div class="flex flex-wrap items-center gap-2">' +
                '<button type="button" id="btn-add-svc" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg"><i data-lucide="plus" class="w-4 h-4"></i> Tambah Layanan</button>' +
                '<button type="button" id="btn-open-leadership" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"><i data-lucide="user-check" class="w-4 h-4"></i> Kepala Sekolah &amp; Visi Misi</button>' +
                '<button type="button" id="btn-open-settings" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"><i data-lucide="sliders" class="w-4 h-4"></i> Pengaturan Portal</button>' +
                '<button type="button" id="btn-reset-db" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg">Reset Database</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      if (!state.showServices) {
        // Hero Banner (Landing View)
        html +=
          '<section id="beranda" class="relative w-full overflow-hidden bg-gradient-to-br from-slate-800 via-sky-900 to-slate-900 text-white">' +
            slidesHtml +
            '<div class="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-sky-950/60 to-slate-900/80"></div>' +
            '<div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center text-center">' +
              (cfg.hero.subtitle ? '<p class="text-base sm:text-xl lg:text-2xl font-bold tracking-[0.18em] uppercase text-sky-100 drop-shadow-sm">' + esc(cfg.hero.subtitle) + '</p>' : '') +
              (cfg.hero.kicker ? '<span class="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold tracking-[0.18em] uppercase text-white">' + esc(cfg.hero.kicker) + '</span>' : '') +
              '<h1 class="mt-5 font-sans text-[2.15rem] sm:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.08] hero-lining hero-title-anim">' + esc(cfg.hero.title) + '</h1>' +
              '<button type="button" data-nav-view="services" class="mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-50 font-bold text-sm sm:text-base shadow-lg transition-all"><i data-lucide="layout-grid" class="w-4 h-4 text-slate-800"></i> ' + esc(cfg.hero.ctaLabel) + '</button>' +
              '<div class="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-5 max-w-md w-full">' +
                '<div class="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 text-center"><div class="text-xl sm:text-3xl font-extrabold tabular-nums">' + visibleList.length + '</div><div class="mt-1 text-xs text-white/85">Layanan Digital</div></div>' +
                '<div class="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-4 text-center"><div class="text-xl sm:text-3xl font-extrabold tabular-nums">' + esc(cfg.hero.stat3Value || '100%') + '</div><div class="mt-1 text-xs text-white/85">' + esc(cfg.hero.stat3Label || 'Terintegrasi') + '</div></div>' +
              '</div>' +
              dotsHtml +
            '</div>' +
          '</section>';
      }

      // Main Content
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
              '<div class="grid gap-5 sm:gap-6 ' + getColsClass(cfg.layout.columns) + '">' +
                displayed.map(function (svc) {
                  var actualIdx = cfg.services.findIndex(function (x) { return x.id === svc.id; });
                  return renderServiceCard(svc, actualIdx, cfg.services.length);
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
            renderLeadershipSection(cfg) +
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

      if (state.toastMsg) {
        html += '<div class="fixed bottom-5 right-5 z-50 max-w-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 shadow-lg text-sm font-medium">' + esc(state.toastMsg) + '</div>';
      }

      if (state.loginModalOpen) {
        var setupMode = !state.credentialsConfigured;
        html +=
          '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
            '<div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">' +
              '<h3 class="text-base font-bold text-slate-900">' + (setupMode ? 'Buat Akun Admin Pertama Kali' : 'Login Mode Admin') + '</h3>' +
              '<p class="text-xs text-slate-500">' + (setupMode ? 'Tetapkan username dan password admin portal Anda.' : 'Masukkan username dan password Admin untuk mengelola portal.') + '</p>' +
              (HAS_GAS ? '' : '<p class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">Mode Admin aktif setelah file ini dijalankan melalui Google Apps Script Web App.</p>') +
              '<form id="form-login-cred" class="space-y-3">' +
                '<div><label class="block text-xs font-semibold mb-1">Username Admin</label><input id="login-user" type="text" required value="' + esc(state.adminUsernameHint) + '" placeholder="Contoh: admin_smpn4" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl" /></div>' +
                '<div><label class="block text-xs font-semibold mb-1">Password</label><input id="login-pass" type="password" required placeholder="Masukkan password..." class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl" /></div>' +
                '<div class="flex justify-end gap-2 pt-1"><button type="button" id="btn-close-login" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button><button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">' + (setupMode ? 'Simpan & Masuk' : 'Masuk Admin') + '</button></div>' +
              '</form>' +
            '</div>' +
          '</div>';
      }

      if (state.editModalOpen) {
        var tSvc = state.editingId ? cfg.services.find(function (s) { return s.id === state.editingId; }) : null;
        var sData = tSvc || { name: '', subtitle: '', description: '', url: '', badgeColor: '#1E40AF', iconName: 'layers' };
        html +=
          '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
            '<div class="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">' +
              '<h3 class="text-base font-bold text-slate-900">' + (tSvc ? 'Edit Layanan' : 'Tambah Layanan Baru') + '</h3>' +
              '<form id="form-svc" class="space-y-3">' +
                '<input id="svc-name" required value="' + esc(sData.name) + '" placeholder="Nama Layanan" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
                '<input id="svc-sub" value="' + esc(sData.subtitle) + '" placeholder="Subjudul" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
                '<textarea id="svc-desc" rows="2" placeholder="Deskripsi" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl">' + esc(sData.description) + '</textarea>' +
                '<input id="svc-url" value="' + esc(sData.url) + '" placeholder="URL Tujuan (https://...)" class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl" />' +
                '<div class="grid grid-cols-2 gap-3">' +
                  '<div><label class="block text-xs font-semibold mb-1">Warna Badge</label><input id="svc-color" type="color" value="' + esc(sData.badgeColor) + '" class="w-full h-10 rounded-lg border border-slate-300" /></div>' +
                  '<div><label class="block text-xs font-semibold mb-1">Ikon Lucide</label><select id="svc-icon" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' +
                    ICON_CHOICES.map(function (ic) {
                      return '<option value="' + ic + '"' + (String(sData.iconName).toLowerCase() === ic ? ' selected' : '') + '>' + ic + '</option>';
                    }).join('') +
                  '</select></div>' +
                '</div>' +
                '<div class="flex justify-end gap-2 pt-2"><button type="button" id="btn-close-svc" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button><button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Simpan</button></div>' +
              '</form>' +
            '</div>' +
          '</div>';
      }

      if (state.settingsModalOpen) {
        html +=
          '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
            '<div class="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">' +
              '<h3 class="text-base font-bold text-slate-900">Pengaturan Tata Letak &amp; Hero</h3>' +
              '<form id="form-settings" class="space-y-3">' +
                '<div class="grid grid-cols-2 gap-3">' +
                  '<div><label class="block text-xs font-semibold mb-1">Kolom Grid</label><select id="set-cols" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"><option value="2"' + (cfg.layout.columns === 2 ? ' selected' : '') + '>2 Kolom</option><option value="3"' + (cfg.layout.columns === 3 ? ' selected' : '') + '>3 Kolom</option><option value="4"' + (cfg.layout.columns === 4 ? ' selected' : '') + '>4 Kolom</option></select></div>' +
                  '<div><label class="block text-xs font-semibold mb-1">Gaya Kartu</label><select id="set-style" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"><option value="vertical"' + (cfg.layout.cardStyle === 'vertical' ? ' selected' : '') + '>Vertikal</option><option value="horizontal"' + (cfg.layout.cardStyle === 'horizontal' ? ' selected' : '') + '>Horizontal</option><option value="minimal"' + (cfg.layout.cardStyle === 'minimal' ? ' selected' : '') + '>Minimalis</option></select></div>' +
                '</div>' +
                '<div><label class="block text-xs font-semibold mb-1">Daftar Link Background Hero (1 link per baris, dukung Google Drive)</label><textarea id="set-slides" rows="3" placeholder="https://drive.google.com/file/d/..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl">' + esc((cfg.hero.backgroundImages || []).join('\\n')) + '</textarea></div>' +
                '<div class="flex justify-end gap-2 pt-2"><button type="button" id="btn-close-set" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button><button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Simpan Pengaturan</button></div>' +
              '</form>' +
            '</div>' +
          '</div>';
      }

      if (state.leadershipModalOpen && cfg.leadership) {
        var ld = cfg.leadership;
        html +=
          '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">' +
            '<div class="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">' +
              '<h3 class="text-base font-bold text-slate-900">Edit Profil Kepala Sekolah &amp; Visi Misi</h3>' +
              '<form id="form-leadership" class="space-y-3">' +
                '<label class="inline-flex items-center gap-2 text-xs font-semibold"><input id="ld-visible" type="checkbox"' + (ld.visible ? ' checked' : '') + ' /> Tampilkan di beranda</label>' +
                '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
                  '<div><label class="block text-xs font-semibold mb-1">Nama Kepala Sekolah</label><input id="ld-name" required value="' + esc(ld.principalName) + '" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
                  '<div><label class="block text-xs font-semibold mb-1">Jabatan</label><input id="ld-title" value="' + esc(ld.principalTitle) + '" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
                  '<div><label class="block text-xs font-semibold mb-1">NIP (Opsional)</label><input id="ld-nip" value="' + esc(ld.principalNip) + '" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
                  '<div><label class="block text-xs font-semibold mb-1">URL Foto Kepala Sekolah</label><input id="ld-photo" value="' + esc(ld.photoUrl) + '" placeholder="https://drive.google.com/file/d/..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
                '</div>' +
                '<div><label class="block text-xs font-semibold mb-1">Judul Kata Sambutan</label><input id="ld-greet-title" value="' + esc(ld.greetingTitle) + '" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl" /></div>' +
                '<div><label class="block text-xs font-semibold mb-1">Isi Kata Sambutan</label><textarea id="ld-greet-msg" rows="4" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' + esc(ld.greetingMessage) + '</textarea></div>' +
                '<div><label class="block text-xs font-semibold mb-1">Visi Sekolah</label><textarea id="ld-vision" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' + esc(ld.visionText) + '</textarea></div>' +
                '<div><label class="block text-xs font-semibold mb-1">Misi Sekolah (1 poin per baris)</label><textarea id="ld-mission" rows="4" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl">' + esc((ld.missionItems || []).join('\\n')) + '</textarea></div>' +
                '<div class="flex justify-end gap-2 pt-2"><button type="button" id="btn-close-ld" class="px-4 py-2 text-sm bg-slate-100 rounded-xl">Batal</button><button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl">Simpan Profil</button></div>' +
              '</form>' +
            '</div>' +
          '</div>';
      }

      root.innerHTML = html;
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      bindEvents();
    }

    function bindEvents() {
      var searchEl = document.getElementById('search-svc');
      if (searchEl) {
        searchEl.oninput = function (e) {
          var pos = e.target.selectionStart;
          state.search = e.target.value;
          render();
          var nextEl = document.getElementById('search-svc');
          if (nextEl) { nextEl.focus(); nextEl.setSelectionRange(pos, pos); }
        };
      }
      root.querySelectorAll('[data-set-theme]').forEach(function (btn) {
        btn.onclick = function () {
          var nextTheme = btn.getAttribute('data-set-theme') === 'dark' ? 'dark' : 'light';
          state.theme = nextTheme;
          applyTheme(nextTheme);
          render();
        };
      });
      root.querySelectorAll('[data-hero-dot]').forEach(function (dot) {
        dot.onclick = function () {
          state.heroIdx = parseInt(dot.getAttribute('data-hero-dot'), 10) || 0;
          render();
        };
      });
      root.querySelectorAll('[data-empty-svc]').forEach(function (b) {
        b.onclick = function () { showToast('Tautan untuk layanan "' + b.getAttribute('data-empty-svc') + '" belum diatur. Masuk ke menu Admin untuk menambahkan link.'); };
      });
      var btnOpen = document.getElementById('btn-open-admin');
      if (btnOpen) btnOpen.onclick = function () { state.loginModalOpen = true; render(); };
      var btnExit = document.getElementById('btn-exit-admin');
      if (btnExit) btnExit.onclick = function () { state.isAdmin = false; state.sessionToken = ''; render(); };
      var btnCloseLogin = document.getElementById('btn-close-login');
      if (btnCloseLogin) btnCloseLogin.onclick = function () { state.loginModalOpen = false; render(); };

      var formCred = document.getElementById('form-login-cred');
      if (formCred) {
        formCred.onsubmit = function (e) {
          e.preventDefault();
          if (!HAS_GAS) { showToast('Login Admin memerlukan Google Apps Script Web App.'); return; }
          var user = document.getElementById('login-user').value.trim().toLowerCase();
          var pass = document.getElementById('login-pass').value.trim();
          var fn = state.credentialsConfigured ? 'verifyAdminLogin' : 'setupInitialCredentials';
          google.script.run
            .withSuccessHandler(function (res) {
              if (res && res.ok && res.sessionToken) {
                state.credentialsConfigured = true;
                state.adminUsernameHint = res.adminUsernameHint || user;
                state.sessionToken = res.sessionToken;
                state.isAdmin = true;
                state.loginModalOpen = false;
                showToast('Login berhasil. Mode Admin aktif.');
              }
            })
            .withFailureHandler(function (err) {
              showToast((err && err.message) || 'Username atau password tidak sesuai.');
            })[fn](user, pass);
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
          var item = {
            id: state.editingId || 'svc-' + Date.now(),
            name: document.getElementById('svc-name').value.trim(),
            subtitle: document.getElementById('svc-sub').value.trim(),
            description: document.getElementById('svc-desc').value.trim(),
            url: document.getElementById('svc-url').value.trim(),
            badgeColor: document.getElementById('svc-color').value,
            iconName: document.getElementById('svc-icon').value || 'layers',
            linkTarget: 'global',
            visible: true
          };
          if (state.editingId) {
            state.data.services = state.data.services.map(function (s) { return s.id === state.editingId ? Object.assign({}, s, item) : s; });
          } else {
            state.data.services.push(item);
          }
          state.editModalOpen = false;
          persistData(function () { showToast('Layanan berhasil disimpan.'); });
        };
      }

      root.querySelectorAll('[data-edit]').forEach(function (b) {
        b.onclick = function () { state.editingId = b.getAttribute('data-edit'); state.editModalOpen = true; render(); };
      });
      root.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-del');
          state.data.services = state.data.services.filter(function (s) { return s.id !== id; });
          persistData(function () { showToast('Layanan dihapus.'); });
        };
      });
      root.querySelectorAll('[data-vis]').forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-vis');
          state.data.services = state.data.services.map(function (s) { return s.id === id ? Object.assign({}, s, { visible: !s.visible }) : s; });
          persistData();
        };
      });
      root.querySelectorAll('[data-move]').forEach(function (b) {
        b.onclick = function () {
          var p = b.getAttribute('data-move').split(':'), idx = parseInt(p[0], 10), dir = parseInt(p[1], 10), nxt = idx + dir;
          if (nxt < 0 || nxt >= state.data.services.length) return;
          var arr = state.data.services.slice(), m = arr.splice(idx, 1)[0];
          arr.splice(nxt, 0, m); state.data.services = arr;
          persistData();
        };
      });

      var btnSet = document.getElementById('btn-open-settings');
      if (btnSet) btnSet.onclick = function () { state.settingsModalOpen = true; render(); };
      var btnCloseSet = document.getElementById('btn-close-set');
      if (btnCloseSet) btnCloseSet.onclick = function () { state.settingsModalOpen = false; render(); };

      var btnLead = document.getElementById('btn-open-leadership');
      if (btnLead) btnLead.onclick = function () { state.leadershipModalOpen = true; render(); };
      var btnEditLead = document.getElementById('btn-edit-leadership');
      if (btnEditLead) btnEditLead.onclick = function () { state.leadershipModalOpen = true; render(); };
      var btnCloseLd = document.getElementById('btn-close-ld');
      if (btnCloseLd) btnCloseLd.onclick = function () { state.leadershipModalOpen = false; render(); };

      var formLd = document.getElementById('form-leadership');
      if (formLd) {
        formLd.onsubmit = function (e) {
          e.preventDefault();
          var lines = document.getElementById('ld-mission').value.split(/\\r?\\n/).map(function (x) { return x.trim(); }).filter(Boolean);
          state.data.leadership = Object.assign({}, state.data.leadership || {}, {
            visible: document.getElementById('ld-visible').checked,
            principalName: document.getElementById('ld-name').value.trim(),
            principalTitle: document.getElementById('ld-title').value.trim(),
            principalNip: document.getElementById('ld-nip').value.trim(),
            photoUrl: normalizeImgUrl(document.getElementById('ld-photo').value.trim()),
            greetingTitle: document.getElementById('ld-greet-title').value.trim(),
            greetingMessage: document.getElementById('ld-greet-msg').value.trim(),
            visionText: document.getElementById('ld-vision').value.trim(),
            missionItems: lines
          });
          state.leadershipModalOpen = false;
          persistData(function () { showToast('Profil Kepala Sekolah & Visi Misi disimpan.'); });
        };
      }

      var formSet = document.getElementById('form-settings');
      if (formSet) {
        formSet.onsubmit = function (e) {
          e.preventDefault();
          state.data.layout.columns = parseInt(document.getElementById('set-cols').value, 10);
          state.data.layout.cardStyle = document.getElementById('set-style').value;
          var lines = document.getElementById('set-slides').value.split(/\\r?\\n/).map(normalizeImgUrl).filter(Boolean);
          state.data.hero.backgroundImages = lines;
          state.data.hero.backgroundUrl = lines[0] || '';
          state.settingsModalOpen = false;
          persistData(function () { showToast('Pengaturan portal disimpan.'); });
        };
      }

      var btnReset = document.getElementById('btn-reset-db');
      if (btnReset) {
        btnReset.onclick = function () {
          if (HAS_GAS) {
            google.script.run.withSuccessHandler(function (res) {
              if (res) state.data = res;
              state.isAdmin = false;
              state.sessionToken = '';
              state.credentialsConfigured = false;
              state.adminUsernameHint = '';
              showToast('Database direset ke pengaturan awal.');
            }).resetDatabaseWithSession(state.sessionToken);
          }
        };
      }
    }

    render();
    loadInitialData();
  })();
  </script>
</body>
</html>`;
}
