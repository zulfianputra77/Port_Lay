import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_PORTAL_CONFIG } from '../data/defaultConfig.ts';
import type {
  AboutInfo,
  HeroInfo,
  LayoutSettings,
  PortalConfig,
  PrincipalProfileInfo,
  SchoolInfo,
  ServiceItem,
} from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'portal.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifySecretHash(secret: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const actualBuf = crypto.scryptSync(secret, salt, 32);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function setupDatabase(options?: { reset?: boolean }): void {
  const db = getDb();
  const shouldReset = Boolean(options?.reset);

  db.exec(`
    CREATE TABLE IF NOT EXISTS portal_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      badge_color TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      custom_icon_url TEXT,
      url TEXT NOT NULL,
      link_target TEXT NOT NULL,
      visible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sort_order INTEGER NOT NULL,
      image_url TEXT NOT NULL
    );

    DROP TABLE IF EXISTS admin_otps;
  `);

  const now = new Date().toISOString();

  if (shouldReset) {
    db.exec('DELETE FROM services; DELETE FROM hero_slides;');
    db.prepare(
      "DELETE FROM portal_settings WHERE key IN ('school', 'hero', 'leadership', 'about', 'layout', 'admin_pin_hash', 'admin_password_hash', 'admin_username', 'admin_email')"
    ).run();
  } else {
    // Clean up legacy/partial auth keys when migrating to username + password login
    const hasUsernameRow = db
      .prepare("SELECT value FROM portal_settings WHERE key = 'admin_username'")
      .get() as { value: string } | undefined;
    if (!hasUsernameRow) {
      db.prepare(
        "DELETE FROM portal_settings WHERE key IN ('admin_pin_hash', 'admin_password_hash', 'admin_email')"
      ).run();
    }
  }

  const upsertSetting = db.prepare(`
    INSERT INTO portal_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO NOTHING
  `);

  upsertSetting.run('school', JSON.stringify(DEFAULT_PORTAL_CONFIG.school), now);
  upsertSetting.run('hero', JSON.stringify(DEFAULT_PORTAL_CONFIG.hero), now);
  upsertSetting.run('leadership', JSON.stringify(DEFAULT_PORTAL_CONFIG.leadership), now);
  upsertSetting.run('about', JSON.stringify(DEFAULT_PORTAL_CONFIG.about), now);
  upsertSetting.run('layout', JSON.stringify(DEFAULT_PORTAL_CONFIG.layout), now);

  const serviceCountRow = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as { cnt: number };
  if (serviceCountRow.cnt === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (
        id, sort_order, name, subtitle, description, badge_color,
        icon_name, custom_icon_url, url, link_target, visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    DEFAULT_PORTAL_CONFIG.services.forEach((svc, idx) => {
      insertService.run(
        svc.id,
        idx,
        svc.name,
        svc.subtitle,
        svc.description,
        svc.badgeColor,
        svc.iconName,
        svc.customIconUrl ?? null,
        svc.url,
        svc.linkTarget,
        svc.visible ? 1 : 0
      );
    });
  }

  const slideCountRow = db.prepare('SELECT COUNT(*) as cnt FROM hero_slides').get() as { cnt: number };
  if (slideCountRow.cnt === 0) {
    const insertSlide = db.prepare('INSERT INTO hero_slides (sort_order, image_url) VALUES (?, ?)');
    DEFAULT_PORTAL_CONFIG.hero.backgroundImages.forEach((imgUrl, idx) => {
      insertSlide.run(idx, imgUrl);
    });
  }
}

export interface PublicPortalPayload {
  school: SchoolInfo;
  hero: HeroInfo;
  leadership: PrincipalProfileInfo;
  about: AboutInfo;
  layout: LayoutSettings;
  services: ServiceItem[];
  credentialsConfigured: boolean;
  envCredentialsOverride: boolean;
  adminUsernameHint: string;
}

export function readPortalData(): PublicPortalPayload {
  const db = getDb();

  const settingRows = db
    .prepare('SELECT key, value FROM portal_settings')
    .all() as { key: string; value: string }[];

  const map = new Map<string, string>(settingRows.map((r) => [r.key, r.value]));

  const parseJson = <T>(key: string, fallback: T): T => {
    const raw = map.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const school = parseJson<SchoolInfo>('school', DEFAULT_PORTAL_CONFIG.school);
  const heroSetting = parseJson<HeroInfo>('hero', DEFAULT_PORTAL_CONFIG.hero);
  const leadership = parseJson<PrincipalProfileInfo>(
    'leadership',
    DEFAULT_PORTAL_CONFIG.leadership
  );
  const about = parseJson<AboutInfo>('about', DEFAULT_PORTAL_CONFIG.about);
  const layout = parseJson<LayoutSettings>('layout', DEFAULT_PORTAL_CONFIG.layout);

  const slideRows = db
    .prepare('SELECT image_url FROM hero_slides ORDER BY sort_order ASC, id ASC')
    .all() as { image_url: string }[];

  const backgroundImages =
    slideRows.length > 0
      ? slideRows.map((r) => r.image_url)
      : heroSetting.backgroundImages?.length
        ? heroSetting.backgroundImages
        : DEFAULT_PORTAL_CONFIG.hero.backgroundImages;

  const serviceRows = db
    .prepare(
      `SELECT id, name, subtitle, description, badge_color, icon_name,
              custom_icon_url, url, link_target, visible
       FROM services ORDER BY sort_order ASC`
    )
    .all() as {
      id: string;
      name: string;
      subtitle: string;
      description: string;
      badge_color: string;
      icon_name: string;
      custom_icon_url: string | null;
      url: string;
      link_target: string;
      visible: number;
    }[];

  const services: ServiceItem[] = serviceRows.map((row) => ({
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    badgeColor: row.badge_color,
    iconName: row.icon_name,
    customIconUrl: row.custom_icon_url || undefined,
    url: row.url,
    linkTarget:
      row.link_target === 'new_tab' || row.link_target === 'same_tab'
        ? row.link_target
        : 'global',
    visible: row.visible === 1,
  }));

  const envUsername = (process.env.ADMIN_USERNAME || '').trim();
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const hasEnvCredentials = envUsername.length > 0 && envPassword.length > 0;

  const dbUsername = map.get('admin_username') || '';
  const hasDbCredentials = Boolean(dbUsername && map.has('admin_password_hash'));

  return {
    school,
    hero: {
      ...heroSetting,
      backgroundImages,
      backgroundUrl: backgroundImages[0] || DEFAULT_PORTAL_CONFIG.hero.backgroundUrl,
      slideIntervalSeconds: heroSetting.slideIntervalSeconds || 15,
    },
    leadership,
    about: {
      ...about,
      extraItems: Array.isArray(about.extraItems) ? about.extraItems : [],
    },
    layout,
    services,
    credentialsConfigured: hasDbCredentials || hasEnvCredentials,
    envCredentialsOverride: !hasDbCredentials && hasEnvCredentials,
    adminUsernameHint: hasDbCredentials ? dbUsername : hasEnvCredentials ? envUsername : '',
  };
}

export function getStoredAdminCredentials(): { username: string; passwordHash: string } | null {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM portal_settings WHERE key IN ('admin_username', 'admin_password_hash')")
    .all() as { key: string; value: string }[];
  const map = new Map<string, string>(rows.map((r) => [r.key, r.value]));
  const username = map.get('admin_username');
  const passwordHash = map.get('admin_password_hash');
  if (!username || !passwordHash) return null;
  return { username, passwordHash };
}

export function claimInitialAdminCredentials(username: string, password: string): boolean {
  const db = getDb();
  const hash = hashSecret(password);
  const now = new Date().toISOString();
  const cleanUsername = username.trim().toLowerCase();

  db.exec('BEGIN');
  try {
    const result = db
      .prepare(
        `INSERT INTO portal_settings (key, value, updated_at)
         VALUES ('admin_password_hash', ?, ?)
         ON CONFLICT(key) DO NOTHING`
      )
      .run(hash, now);

    if (Number(result.changes) <= 0) {
      db.exec('ROLLBACK');
      return false;
    }

    db.prepare(
      `INSERT INTO portal_settings (key, value, updated_at)
       VALUES ('admin_username', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(cleanUsername, now);

    db.exec('COMMIT');
    return true;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function updateAdminCredentials(newUsername: string | null, newPassword: string | null): void {
  const db = getDb();
  const now = new Date().toISOString();

  if (newPassword) {
    const hash = hashSecret(newPassword);
    db.prepare(
      `INSERT INTO portal_settings (key, value, updated_at)
       VALUES ('admin_password_hash', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(hash, now);
  }

  if (newUsername) {
    db.prepare(
      `INSERT INTO portal_settings (key, value, updated_at)
       VALUES ('admin_username', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).run(newUsername.trim().toLowerCase(), now);
  }
}

export function savePortalData(payload: Omit<PortalConfig, 'adminPin'>): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN');
  try {
    const upsertSetting = db.prepare(`
      INSERT INTO portal_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    upsertSetting.run('school', JSON.stringify(payload.school), now);
    upsertSetting.run('hero', JSON.stringify(payload.hero), now);
    upsertSetting.run('leadership', JSON.stringify(payload.leadership), now);
    upsertSetting.run('about', JSON.stringify(payload.about), now);
    upsertSetting.run('layout', JSON.stringify(payload.layout), now);

    db.exec('DELETE FROM services');
    const insertService = db.prepare(`
      INSERT INTO services (
        id, sort_order, name, subtitle, description, badge_color,
        icon_name, custom_icon_url, url, link_target, visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    payload.services.forEach((svc, idx) => {
      insertService.run(
        svc.id,
        idx,
        svc.name,
        svc.subtitle,
        svc.description,
        svc.badgeColor,
        svc.iconName,
        svc.customIconUrl ?? null,
        svc.url,
        svc.linkTarget,
        svc.visible ? 1 : 0
      );
    });

    db.exec('DELETE FROM hero_slides');
    const insertSlide = db.prepare('INSERT INTO hero_slides (sort_order, image_url) VALUES (?, ?)');
    payload.hero.backgroundImages.forEach((imgUrl, idx) => {
      insertSlide.run(idx, imgUrl);
    });

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
