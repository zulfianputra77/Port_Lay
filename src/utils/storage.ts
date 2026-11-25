import { DEFAULT_PORTAL_CONFIG } from '../data/defaultConfig';
import { CardStyle, LayoutColumns, PortalConfig, ServiceItem } from '../types';

const STORAGE_KEY = 'smpn4_jambi_portal_config_v1';

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizeImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return trimmed;

  // Convert Google Drive share links to direct renderable thumbnail URLs
  const filePathMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (filePathMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${filePathMatch[1]}&sz=w1600`;
  }

  const queryIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i);
  if (queryIdMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${queryIdMatch[1]}&sz=w1600`;
  }

  return trimmed;
}

export function loadPortalConfig(): PortalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PORTAL_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PortalConfig>;
    return mergeWithDefaults(parsed);
  } catch {
    return DEFAULT_PORTAL_CONFIG;
  }
}

export function savePortalConfig(config: PortalConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function clearPortalConfig(): PortalConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  return DEFAULT_PORTAL_CONFIG;
}

export function mergeWithDefaults(partial: Partial<PortalConfig>): PortalConfig {
  const validColumns: LayoutColumns =
    partial.layout?.columns === 2 || partial.layout?.columns === 3 || partial.layout?.columns === 4
      ? partial.layout.columns
      : DEFAULT_PORTAL_CONFIG.layout.columns;

  const validCardStyle: CardStyle =
    partial.layout?.cardStyle === 'vertical' ||
    partial.layout?.cardStyle === 'horizontal' ||
    partial.layout?.cardStyle === 'minimal'
      ? partial.layout.cardStyle
      : DEFAULT_PORTAL_CONFIG.layout.cardStyle;

  const validGlobalTarget =
    partial.layout?.globalLinkTarget === 'same_tab' ? 'same_tab' : 'new_tab';

  const services: ServiceItem[] = Array.isArray(partial.services)
    ? partial.services
        .filter((s): s is ServiceItem => Boolean(s && typeof s.id === 'string' && typeof s.name === 'string'))
        .map((s) => ({
          id: s.id,
          name: s.name,
          subtitle: typeof s.subtitle === 'string' ? s.subtitle : '',
          description: typeof s.description === 'string' ? s.description : '',
          badgeColor: typeof s.badgeColor === 'string' && s.badgeColor ? s.badgeColor : '#1E40AF',
          iconName: typeof s.iconName === 'string' && s.iconName ? s.iconName : 'Layers',
          customIconUrl: typeof s.customIconUrl === 'string' ? s.customIconUrl : undefined,
          url: typeof s.url === 'string' ? s.url : '',
          linkTarget:
            s.linkTarget === 'new_tab' || s.linkTarget === 'same_tab' ? s.linkTarget : 'global',
          visible: typeof s.visible === 'boolean' ? s.visible : true,
        }))
    : DEFAULT_PORTAL_CONFIG.services;

  const rawHeroImages = Array.isArray(partial.hero?.backgroundImages)
    ? partial.hero.backgroundImages
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .map((url) => normalizeImageUrl(url))
    : [];

  const fallbackBg = normalizeImageUrl(
    partial.hero?.backgroundUrl || DEFAULT_PORTAL_CONFIG.hero.backgroundUrl
  );

  const heroImages = rawHeroImages.length > 0 ? rawHeroImages : [fallbackBg];

  return {
    adminPin:
      typeof partial.adminPin === 'string' && /^\d{4,6}$/.test(partial.adminPin)
        ? partial.adminPin
        : DEFAULT_PORTAL_CONFIG.adminPin,
    school: {
      name: partial.school?.name?.trim() || DEFAULT_PORTAL_CONFIG.school.name,
      subtitle: partial.school?.subtitle?.trim() || DEFAULT_PORTAL_CONFIG.school.subtitle,
      logoUrl: partial.school?.logoUrl || DEFAULT_PORTAL_CONFIG.school.logoUrl,
    },
    hero: {
      kicker: partial.hero?.kicker?.trim() || DEFAULT_PORTAL_CONFIG.hero.kicker,
      title: partial.hero?.title?.trim() || DEFAULT_PORTAL_CONFIG.hero.title,
      subtitle: partial.hero?.subtitle?.trim() || DEFAULT_PORTAL_CONFIG.hero.subtitle,
      ctaLabel: partial.hero?.ctaLabel?.trim() || DEFAULT_PORTAL_CONFIG.hero.ctaLabel,
      backgroundUrl: heroImages[0] || DEFAULT_PORTAL_CONFIG.hero.backgroundUrl,
      backgroundImages: heroImages,
      slideIntervalSeconds:
        typeof partial.hero?.slideIntervalSeconds === 'number' &&
        partial.hero.slideIntervalSeconds >= 3
          ? partial.hero.slideIntervalSeconds
          : DEFAULT_PORTAL_CONFIG.hero.slideIntervalSeconds,
      stat2Value: partial.hero?.stat2Value?.trim() || DEFAULT_PORTAL_CONFIG.hero.stat2Value,
      stat2Label: partial.hero?.stat2Label?.trim() || DEFAULT_PORTAL_CONFIG.hero.stat2Label,
      stat3Value: partial.hero?.stat3Value?.trim() || DEFAULT_PORTAL_CONFIG.hero.stat3Value,
      stat3Label: partial.hero?.stat3Label?.trim() || DEFAULT_PORTAL_CONFIG.hero.stat3Label,
    },
    leadership: {
      visible:
        typeof partial.leadership?.visible === 'boolean'
          ? partial.leadership.visible
          : DEFAULT_PORTAL_CONFIG.leadership.visible,
      sectionTitle:
        partial.leadership?.sectionTitle?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.sectionTitle,
      principalName:
        partial.leadership?.principalName?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.principalName,
      principalTitle:
        partial.leadership?.principalTitle?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.principalTitle,
      principalNip:
        typeof partial.leadership?.principalNip === 'string'
          ? partial.leadership.principalNip.trim()
          : DEFAULT_PORTAL_CONFIG.leadership.principalNip,
      photoUrl: normalizeImageUrl(
        partial.leadership?.photoUrl || DEFAULT_PORTAL_CONFIG.leadership.photoUrl
      ),
      greetingTitle:
        partial.leadership?.greetingTitle?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.greetingTitle,
      greetingMessage:
        partial.leadership?.greetingMessage?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.greetingMessage,
      visionTitle:
        partial.leadership?.visionTitle?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.visionTitle,
      visionText:
        partial.leadership?.visionText?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.visionText,
      missionTitle:
        partial.leadership?.missionTitle?.trim() ||
        DEFAULT_PORTAL_CONFIG.leadership.missionTitle,
      missionItems: Array.isArray(partial.leadership?.missionItems)
        ? partial.leadership.missionItems
            .map((item) => String(item || '').trim())
            .filter(Boolean)
        : DEFAULT_PORTAL_CONFIG.leadership.missionItems,
    },
    about: {
      title: partial.about?.title?.trim() || DEFAULT_PORTAL_CONFIG.about.title,
      description: partial.about?.description?.trim() || DEFAULT_PORTAL_CONFIG.about.description,
      address: partial.about?.address?.trim() || DEFAULT_PORTAL_CONFIG.about.address,
      email: typeof partial.about?.email === 'string' ? partial.about.email.trim() : '',
      phone: typeof partial.about?.phone === 'string' ? partial.about.phone.trim() : '',
      serviceHours: partial.about?.serviceHours?.trim() || DEFAULT_PORTAL_CONFIG.about.serviceHours,
      extraItems: Array.isArray(partial.about?.extraItems)
        ? partial.about.extraItems
            .filter(
              (item) =>
                item &&
                typeof item.label === 'string' &&
                typeof item.value === 'string' &&
                (item.label.trim().length > 0 || item.value.trim().length > 0)
            )
            .map((item, idx) => ({
              id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `about-extra-${idx}`,
              label: item.label.trim(),
              value: item.value.trim(),
            }))
        : [],
    },
    layout: {
      columns: validColumns,
      cardStyle: validCardStyle,
      globalLinkTarget: validGlobalTarget,
    },
    services,
  };
}

export function validateImportedJson(jsonText: string): PortalConfig {
  const parsed = JSON.parse(jsonText) as Partial<PortalConfig>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format file JSON tidak valid.');
  }
  if (!Array.isArray(parsed.services)) {
    throw new Error('Konfigurasi tidak memiliki daftar layanan yang valid.');
  }
  return mergeWithDefaults(parsed);
}

export async function processImageFileToDataUrl(file: File, maxSize = 256): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih harus berupa gambar (PNG, JPG, SVG, atau WEBP).');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file gambar maksimal 5 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const result = reader.result as string;
      if (file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat diproses.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        if (maxSize >= 800) {
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(canvas.toDataURL('image/png', 0.9));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
