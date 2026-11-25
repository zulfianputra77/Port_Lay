import type { User } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_HERO_BACKGROUND,
  DEFAULT_PORTAL_CONFIG,
  DEFAULT_PRINCIPAL_PHOTO,
  DEFAULT_SCHOOL_LOGO,
} from '../data/defaultConfig';
import { OperationType, db, handleFirestoreError, PRIMARY_ADMIN_EMAIL } from '../firebase';
import { PortalConfig, ServiceItem } from '../types';
import { mergeWithDefaults, normalizeImageUrl } from '../utils/storage';

interface FirestorePortalMainDoc {
  school?: PortalConfig['school'];
  heroMeta?: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    slideIntervalSeconds: number;
    stat3Value: string;
    stat3Label: string;
  };
  leadership?: PortalConfig['leadership'];
  about?: PortalConfig['about'];
  layout?: PortalConfig['layout'];
}

interface FirestoreServiceDoc {
  id: string;
  sortOrder: number;
  name: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  iconName: string;
  customIconUrl?: string;
  url: string;
  linkTarget: 'global' | 'new_tab' | 'same_tab';
  visible: boolean;
}

interface FirestoreSlideDoc {
  sortOrder: number;
  imageUrl: string;
}

function sanitizeDocId(rawId: string, fallbackPrefix: string, idx: number): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}-${idx}`;
}

export async function verifyUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if ((user.email || '').toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    // Expected permission denial for non-admins when checking admins/{uid}
    return false;
  }
}

export function subscribePortalConfig(
  includeHiddenServices: boolean,
  onConfig: (config: PortalConfig, meta: { hasRemoteData: boolean; remoteReady: boolean }) => void,
  onError?: (err: Error) => void
): () => void {
  let mainDocData: FirestorePortalMainDoc | null = null;
  let mainExists = false;
  let mainLoaded = false;
  let servicesList: ServiceItem[] | null = null;
  let servicesLoaded = false;
  let slidesList: string[] | null = null;
  let slidesLoaded = false;

  const emit = () => {
    if (!mainLoaded || !servicesLoaded || !slidesLoaded) return;

    const hasRemoteData =
      mainExists ||
      (servicesList !== null && servicesList.length > 0) ||
      (slidesList !== null && slidesList.length > 0);

    const merged = mergeWithDefaults({
      school: mainDocData?.school ?? DEFAULT_PORTAL_CONFIG.school,
      hero: {
        kicker: mainDocData?.heroMeta?.kicker ?? DEFAULT_PORTAL_CONFIG.hero.kicker,
        title: mainDocData?.heroMeta?.title ?? DEFAULT_PORTAL_CONFIG.hero.title,
        subtitle: mainDocData?.heroMeta?.subtitle ?? DEFAULT_PORTAL_CONFIG.hero.subtitle,
        ctaLabel: mainDocData?.heroMeta?.ctaLabel ?? DEFAULT_PORTAL_CONFIG.hero.ctaLabel,
        slideIntervalSeconds:
          mainDocData?.heroMeta?.slideIntervalSeconds ??
          DEFAULT_PORTAL_CONFIG.hero.slideIntervalSeconds,
        stat2Value: '',
        stat2Label: '',
        stat3Value: mainDocData?.heroMeta?.stat3Value ?? DEFAULT_PORTAL_CONFIG.hero.stat3Value,
        stat3Label: mainDocData?.heroMeta?.stat3Label ?? DEFAULT_PORTAL_CONFIG.hero.stat3Label,
        backgroundImages:
          slidesList && slidesList.length > 0
            ? slidesList
            : DEFAULT_PORTAL_CONFIG.hero.backgroundImages,
        backgroundUrl:
          slidesList && slidesList.length > 0
            ? slidesList[0]
            : DEFAULT_PORTAL_CONFIG.hero.backgroundUrl,
      },
      leadership: mainDocData?.leadership ?? DEFAULT_PORTAL_CONFIG.leadership,
      about: mainDocData?.about ?? DEFAULT_PORTAL_CONFIG.about,
      layout: mainDocData?.layout ?? DEFAULT_PORTAL_CONFIG.layout,
      services: mainExists
        ? servicesList ?? []
        : servicesList && servicesList.length > 0
          ? servicesList
          : DEFAULT_PORTAL_CONFIG.services,
    });

    onConfig(merged, { hasRemoteData, remoteReady: true });
  };

  const handleSubError = (err: unknown, op: OperationType, path: string) => {
    try {
      handleFirestoreError(err, op, path);
    } catch (wrapped) {
      if (onError && wrapped instanceof Error) {
        onError(wrapped);
      }
    }
  };

  const unsubMain = onSnapshot(
    doc(db, 'portal', 'main'),
    (snap) => {
      mainLoaded = true;
      mainExists = snap.exists();
      mainDocData = snap.exists() ? (snap.data() as FirestorePortalMainDoc) : null;
      emit();
    },
    (err) => handleSubError(err, OperationType.GET, 'portal/main')
  );

  const servicesQuery = includeHiddenServices
    ? query(collection(db, 'services'), limit(200))
    : query(collection(db, 'services'), where('visible', '==', true), limit(200));

  const unsubServices = onSnapshot(
    servicesQuery,
    (snap) => {
      servicesLoaded = true;
      if (snap.empty) {
        servicesList = [];
      } else {
        const sortedDocs = [...snap.docs].sort((a, b) => {
          const ao = Number((a.data() as FirestoreServiceDoc).sortOrder ?? 0);
          const bo = Number((b.data() as FirestoreServiceDoc).sortOrder ?? 0);
          return ao - bo;
        });
        servicesList = sortedDocs.map((d) => {
          const data = d.data() as FirestoreServiceDoc;
          return {
            id: data.id || d.id,
            name: data.name || '',
            subtitle: data.subtitle || '',
            description: data.description || '',
            badgeColor: data.badgeColor || '#1E40AF',
            iconName: data.iconName || 'Layers',
            customIconUrl: data.customIconUrl || undefined,
            url: data.url || '',
            linkTarget:
              data.linkTarget === 'new_tab' || data.linkTarget === 'same_tab'
                ? data.linkTarget
                : 'global',
            visible: typeof data.visible === 'boolean' ? data.visible : true,
          };
        });
      }
      emit();
    },
    (err) => handleSubError(err, OperationType.LIST, 'services')
  );

  const slidesQuery = includeHiddenServices
    ? query(collection(db, 'heroSlides'), limit(50))
    : query(collection(db, 'heroSlides'), where('portalId', '==', 'main'), limit(50));

  const unsubSlides = onSnapshot(
    slidesQuery,
    (snap) => {
      slidesLoaded = true;
      if (snap.empty) {
        slidesList = [];
      } else {
        const sortedSlides = [...snap.docs].sort((a, b) => {
          const ao = Number((a.data() as FirestoreSlideDoc).sortOrder ?? 0);
          const bo = Number((b.data() as FirestoreSlideDoc).sortOrder ?? 0);
          return ao - bo;
        });
        slidesList = sortedSlides
          .map((d) => (d.data() as FirestoreSlideDoc).imageUrl)
          .filter((u) => typeof u === 'string' && u.trim().length > 0);
      }
      emit();
    },
    (err) => handleSubError(err, OperationType.LIST, 'heroSlides')
  );

  return () => {
    unsubMain();
    unsubServices();
    unsubSlides();
  };
}

function buildMainDocPayload(config: PortalConfig) {
  const safeInterval = Math.min(
    120,
    Math.max(3, Math.round(Number(config.hero.slideIntervalSeconds) || 15))
  );

  return {
    school: {
      name: (config.school.name || DEFAULT_PORTAL_CONFIG.school.name).trim().slice(0, 140),
      subtitle: (config.school.subtitle || '').trim().slice(0, 140),
      logoUrl: (config.school.logoUrl || DEFAULT_SCHOOL_LOGO).trim().slice(0, 350000),
    },
    heroMeta: {
      kicker: (config.hero.kicker || '').trim().slice(0, 80),
      title: (config.hero.title || config.school.name || 'SMP NEGERI 004 JAMBI')
        .trim()
        .slice(0, 140),
      subtitle: (config.hero.subtitle || '').trim().slice(0, 200),
      ctaLabel: (config.hero.ctaLabel || 'Jelajahi Layanan').trim().slice(0, 80),
      slideIntervalSeconds: safeInterval,
      stat3Value: (config.hero.stat3Value || '100%').trim().slice(0, 24),
      stat3Label: (config.hero.stat3Label || 'Terintegrasi').trim().slice(0, 60),
    },
    leadership: {
      visible: Boolean(config.leadership.visible),
      sectionTitle: (config.leadership.sectionTitle || 'Profil Kepala Sekolah & Visi Misi')
        .trim()
        .slice(0, 140),
      principalName: (config.leadership.principalName || '').trim().slice(0, 140),
      principalTitle: (config.leadership.principalTitle || 'Kepala Sekolah').trim().slice(0, 140),
      principalNip: (config.leadership.principalNip || '').trim().slice(0, 60),
      photoUrl: normalizeImageUrl(config.leadership.photoUrl || DEFAULT_PRINCIPAL_PHOTO).slice(
        0,
        600000
      ),
      greetingTitle: (config.leadership.greetingTitle || 'Sambutan Kepala Sekolah')
        .trim()
        .slice(0, 160),
      greetingMessage: (config.leadership.greetingMessage || '').trim().slice(0, 3000),
      visionTitle: (config.leadership.visionTitle || 'Visi Sekolah').trim().slice(0, 100),
      visionText: (config.leadership.visionText || '').trim().slice(0, 1000),
      missionTitle: (config.leadership.missionTitle || 'Misi Sekolah').trim().slice(0, 100),
      missionItems: (config.leadership.missionItems || [])
        .map((m) => String(m || '').trim().slice(0, 400))
        .filter(Boolean)
        .slice(0, 20),
    },
    about: {
      title: (config.about.title || '').trim().slice(0, 140),
      description: (config.about.description || '').trim().slice(0, 1000),
      address: (config.about.address || '').trim().slice(0, 250),
      serviceHours: (config.about.serviceHours || '').trim().slice(0, 120),
      extraItems: (config.about.extraItems || [])
        .filter((item) => item && (item.label.trim() || item.value.trim()))
        .slice(0, 20)
        .map((item, idx) => ({
          id: sanitizeDocId(item.id || '', 'about-extra', idx),
          label: item.label.trim().slice(0, 120),
          value: item.value.trim().slice(0, 500),
        })),
    },
    layout: {
      columns:
        config.layout.columns === 2 || config.layout.columns === 3 || config.layout.columns === 4
          ? config.layout.columns
          : 4,
      cardStyle:
        config.layout.cardStyle === 'horizontal' || config.layout.cardStyle === 'minimal'
          ? config.layout.cardStyle
          : 'vertical',
      globalLinkTarget:
        config.layout.globalLinkTarget === 'same_tab' ? 'same_tab' : 'new_tab',
    },
  };
}

export async function savePortalConfigToFirestore(nextConfig: PortalConfig): Promise<void> {
  const mainRef = doc(db, 'portal', 'main');
  let mainExists = false;
  let existingServiceDocs = new Map<string, { hasCustomIcon: boolean }>();
  let existingSlideIds = new Set<string>();

  try {
    const [mainSnap, svcSnap, slideSnap] = await Promise.all([
      getDoc(mainRef),
      getDocs(query(collection(db, 'services'), limit(200))),
      getDocs(query(collection(db, 'heroSlides'), limit(50))),
    ]);
    mainExists = mainSnap.exists();
    svcSnap.forEach((d) => {
      const data = d.data() as FirestoreServiceDoc;
      existingServiceDocs.set(d.id, { hasCustomIcon: 'customIconUrl' in data });
    });
    slideSnap.forEach((d) => existingSlideIds.add(d.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'portal/main');
  }

  const batch = writeBatch(db);
  const mainPayload = buildMainDocPayload(nextConfig);

  if (mainExists) {
    batch.update(mainRef, {
      ...mainPayload,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(mainRef, {
      ...mainPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Services sync
  const nextServiceIds = new Set<string>();
  nextConfig.services.slice(0, 200).forEach((svc, idx) => {
    const svcId = sanitizeDocId(svc.id, 'svc', idx);
    nextServiceIds.add(svcId);
    const svcRef = doc(db, 'services', svcId);
    const cleanCustomIcon = (svc.customIconUrl || '').trim().slice(0, 350000);
    const baseFields = {
      sortOrder: idx,
      name: (svc.name || 'Layanan').trim().slice(0, 120),
      subtitle: (svc.subtitle || '').trim().slice(0, 160),
      description: (svc.description || '').trim().slice(0, 500),
      badgeColor: /^#[0-9a-fA-F]{6}$/.test(svc.badgeColor) ? svc.badgeColor : '#1E40AF',
      iconName: (svc.iconName || 'Layers').trim().slice(0, 60),
      url: (svc.url || '').trim().slice(0, 1000),
      linkTarget:
        svc.linkTarget === 'new_tab' || svc.linkTarget === 'same_tab'
          ? svc.linkTarget
          : 'global',
      visible: Boolean(svc.visible),
      updatedAt: serverTimestamp(),
    };

    const prevMeta = existingServiceDocs.get(svcId);
    if (prevMeta) {
      if (cleanCustomIcon) {
        batch.update(svcRef, { ...baseFields, customIconUrl: cleanCustomIcon });
      } else if (prevMeta.hasCustomIcon) {
        batch.update(svcRef, { ...baseFields, customIconUrl: deleteField() });
      } else {
        batch.update(svcRef, baseFields);
      }
    } else {
      batch.set(svcRef, {
        id: svcId,
        ...baseFields,
        ...(cleanCustomIcon ? { customIconUrl: cleanCustomIcon } : {}),
        createdAt: serverTimestamp(),
      });
    }
  });

  existingServiceDocs.forEach((_, existingId) => {
    if (!nextServiceIds.has(existingId)) {
      batch.delete(doc(db, 'services', existingId));
    }
  });

  // Hero slides sync
  const rawSlides = (nextConfig.hero.backgroundImages || [])
    .map((u) => normalizeImageUrl(u).trim())
    .filter((u) => u.length > 0)
    .slice(0, 30);
  const slides = rawSlides.length > 0 ? rawSlides : [DEFAULT_HERO_BACKGROUND];

  const nextSlideIds = new Set<string>();
  slides.forEach((imgUrl, idx) => {
    const slideId = `slide-${idx}`;
    nextSlideIds.add(slideId);
    const slideRef = doc(db, 'heroSlides', slideId);
    const slideFields = {
      sortOrder: idx,
      imageUrl: imgUrl.slice(0, 900000),
      updatedAt: serverTimestamp(),
    };

    if (existingSlideIds.has(slideId)) {
      batch.update(slideRef, slideFields);
    } else {
      batch.set(slideRef, {
        portalId: 'main',
        ...slideFields,
        createdAt: serverTimestamp(),
      });
    }
  });

  existingSlideIds.forEach((existingId) => {
    if (!nextSlideIds.has(existingId)) {
      batch.delete(doc(db, 'heroSlides', existingId));
    }
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'portal/main');
  }
}

export async function resetPortalConfigInFirestore(): Promise<void> {
  await savePortalConfigToFirestore(DEFAULT_PORTAL_CONFIG);
}
