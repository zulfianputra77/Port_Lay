import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  claimInitialAdminCredentials,
  getStoredAdminCredentials,
  readPortalData,
  savePortalData,
  setupDatabase,
  updateAdminCredentials,
  verifySecretHash,
} from './src/db/database.ts';
import type { PortalConfig, ServiceItem } from './src/types.ts';

dotenv.config();

const PORT = 3000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

setupDatabase();

function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signPayload(payloadObj: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedToken<T extends { exp?: number }>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
    if (typeof decoded.exp !== 'number' || decoded.exp <= Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function createAdminToken(): string {
  return signPayload({
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const decoded = token ? verifySignedToken<{ role?: string; exp?: number }>(token) : null;
  if (!decoded || decoded.role !== 'admin') {
    res.status(401).json({ error: 'Sesi admin tidak valid atau sudah berakhir.' });
    return;
  }
  next();
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._@-]{3,64}$/.test(username);
}

function verifyCredentials(inputUsername: string, inputPassword: string): boolean {
  const cleanUser = inputUsername.trim().toLowerCase();
  const cleanPass = inputPassword.trim();

  const stored = getStoredAdminCredentials();
  if (stored) {
    return (
      timingSafeStringEqual(cleanUser, stored.username.toLowerCase()) &&
      verifySecretHash(cleanPass, stored.passwordHash)
    );
  }

  const envUsername = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (envUsername && envPassword) {
    return (
      timingSafeStringEqual(cleanUser, envUsername) &&
      timingSafeStringEqual(cleanPass, envPassword)
    );
  }

  return false;
}

function verifyCurrentPassword(inputPassword: string): boolean {
  const cleanPass = inputPassword.trim();
  const stored = getStoredAdminCredentials();
  if (stored) {
    return verifySecretHash(cleanPass, stored.passwordHash);
  }
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPassword) {
    return timingSafeStringEqual(cleanPass, envPassword);
  }
  return false;
}

function isSafeHttpOrAssetUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isSafeExternalLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizePortalPayload(body: unknown): Omit<PortalConfig, 'adminPin'> | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as Partial<PortalConfig>;
  if (
    !data.school ||
    !data.hero ||
    !data.leadership ||
    !data.about ||
    !data.layout ||
    !Array.isArray(data.services)
  ) {
    return null;
  }

  if (!isSafeHttpOrAssetUrl(String(data.school.logoUrl || ''))) return null;
  if (!isSafeHttpOrAssetUrl(String(data.leadership.photoUrl || ''))) return null;

  const rawSlides = Array.isArray(data.hero.backgroundImages)
    ? data.hero.backgroundImages.map((u) => String(u || '').trim()).filter(Boolean)
    : [];
  const validSlides = rawSlides.filter((u) => isSafeHttpOrAssetUrl(u));
  if (validSlides.length === 0 && data.hero.backgroundUrl) {
    if (!isSafeHttpOrAssetUrl(String(data.hero.backgroundUrl))) return null;
    validSlides.push(String(data.hero.backgroundUrl));
  }

  const sanitizedServices: ServiceItem[] = [];
  for (const s of data.services) {
    if (!s || typeof s.id !== 'string' || typeof s.name !== 'string') continue;
    const svcUrl = String(s.url || '').trim();
    if (!isSafeExternalLink(svcUrl)) return null;
    const customIcon = s.customIconUrl ? String(s.customIconUrl).trim() : undefined;
    if (customIcon && !isSafeHttpOrAssetUrl(customIcon)) return null;

    sanitizedServices.push({
      id: s.id.slice(0, 80),
      name: s.name.trim().slice(0, 120),
      subtitle: String(s.subtitle || '').trim().slice(0, 160),
      description: String(s.description || '').trim().slice(0, 500),
      badgeColor: /^#[0-9a-fA-F]{6}$/.test(String(s.badgeColor || ''))
        ? String(s.badgeColor)
        : '#1E40AF',
      iconName: String(s.iconName || 'Layers').slice(0, 60),
      customIconUrl: customIcon,
      url: svcUrl,
      linkTarget:
        s.linkTarget === 'new_tab' || s.linkTarget === 'same_tab' ? s.linkTarget : 'global',
      visible: Boolean(s.visible),
    });
  }

  const columns =
    data.layout.columns === 2 || data.layout.columns === 3 || data.layout.columns === 4
      ? data.layout.columns
      : 4;

  const cardStyle =
    data.layout.cardStyle === 'vertical' ||
    data.layout.cardStyle === 'horizontal' ||
    data.layout.cardStyle === 'minimal'
      ? data.layout.cardStyle
      : 'vertical';

  const missionItems = Array.isArray(data.leadership.missionItems)
    ? data.leadership.missionItems
        .map((item) => String(item || '').trim().slice(0, 400))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  return {
    school: {
      name: String(data.school.name || '').trim().slice(0, 140),
      subtitle: String(data.school.subtitle || '').trim().slice(0, 140),
      logoUrl: String(data.school.logoUrl || '').trim(),
    },
    hero: {
      kicker: String(data.hero.kicker || '').trim().slice(0, 80),
      title: String(data.hero.title || '').trim().slice(0, 140),
      subtitle: String(data.hero.subtitle || '').trim().slice(0, 200),
      ctaLabel: String(data.hero.ctaLabel || 'Jelajahi Layanan').trim().slice(0, 80),
      backgroundUrl: validSlides[0] || '',
      backgroundImages: validSlides,
      slideIntervalSeconds:
        typeof data.hero.slideIntervalSeconds === 'number' &&
        data.hero.slideIntervalSeconds >= 3
          ? Math.min(120, Math.round(data.hero.slideIntervalSeconds))
          : 15,
      stat2Value: String(data.hero.stat2Value || '24/7').trim().slice(0, 24),
      stat2Label: String(data.hero.stat2Label || 'Akses Online').trim().slice(0, 60),
      stat3Value: String(data.hero.stat3Value || '100%').trim().slice(0, 24),
      stat3Label: String(data.hero.stat3Label || 'Terintegrasi').trim().slice(0, 60),
    },
    leadership: {
      visible: Boolean(data.leadership.visible),
      sectionTitle: String(data.leadership.sectionTitle || 'Profil Kepala Sekolah & Visi Misi')
        .trim()
        .slice(0, 140),
      principalName: String(data.leadership.principalName || '').trim().slice(0, 140),
      principalTitle: String(data.leadership.principalTitle || 'Kepala Sekolah')
        .trim()
        .slice(0, 140),
      principalNip: String(data.leadership.principalNip || '').trim().slice(0, 60),
      photoUrl: String(data.leadership.photoUrl || '').trim(),
      greetingTitle: String(data.leadership.greetingTitle || 'Sambutan Kepala Sekolah')
        .trim()
        .slice(0, 160),
      greetingMessage: String(data.leadership.greetingMessage || '').trim().slice(0, 3000),
      visionTitle: String(data.leadership.visionTitle || 'Visi Sekolah')
        .trim()
        .slice(0, 100),
      visionText: String(data.leadership.visionText || '').trim().slice(0, 1000),
      missionTitle: String(data.leadership.missionTitle || 'Misi Sekolah')
        .trim()
        .slice(0, 100),
      missionItems,
    },
    about: {
      title: String(data.about.title || '').trim().slice(0, 140),
      description: String(data.about.description || '').trim().slice(0, 1000),
      address: String(data.about.address || '').trim().slice(0, 250),
      email: String(data.about.email || '').trim().slice(0, 120),
      phone: String(data.about.phone || '').trim().slice(0, 60),
      serviceHours: String(data.about.serviceHours || '').trim().slice(0, 120),
      extraItems: Array.isArray(data.about.extraItems)
        ? data.about.extraItems
            .filter((item) => item && typeof item === 'object')
            .map((item, idx) => ({
              id: String(item.id || `about-extra-${idx}`).trim().slice(0, 80),
              label: String(item.label || '').trim().slice(0, 120),
              value: String(item.value || '').trim().slice(0, 500),
            }))
            .filter((item) => item.label.length > 0 || item.value.length > 0)
            .slice(0, 20)
        : [],
    },
    layout: {
      columns,
      cardStyle,
      globalLinkTarget: data.layout.globalLinkTarget === 'same_tab' ? 'same_tab' : 'new_tab',
    },
    services: sanitizedServices,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/portal', (_req, res) => {
    try {
      const payload = readPortalData();
      res.json(payload);
    } catch {
      res.status(500).json({ error: 'Gagal memuat data portal dari database.' });
    }
  });

  app.post('/api/auth/setup-credentials', (req, res) => {
    const existing = getStoredAdminCredentials();
    if (existing) {
      res.status(409).json({
        error: 'Akun Admin sudah terdaftar. Silakan masuk melalui Login Mode Admin.',
        credentialsConfigured: true,
        adminUsernameHint: existing.username,
      });
      return;
    }

    const envUsername = (process.env.ADMIN_USERNAME || '').trim();
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (envUsername && envPassword) {
      res.status(409).json({
        error: 'Akun Admin sudah aktif dari environment server. Silakan masuk melalui Login Mode Admin.',
        credentialsConfigured: true,
        adminUsernameHint: envUsername.toLowerCase(),
      });
      return;
    }

    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!isValidUsername(username)) {
      res.status(400).json({
        error: 'Username minimal 3 karakter (boleh huruf, angka, titik, garis bawah, atau @).',
      });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password harus terdiri dari minimal 6 karakter.' });
      return;
    }

    const claimed = claimInitialAdminCredentials(username, password);
    if (!claimed) {
      const latest = getStoredAdminCredentials();
      res.status(409).json({
        error: 'Username dan password Admin sudah dikonfigurasi sebelumnya.',
        credentialsConfigured: true,
        adminUsernameHint: latest?.username || username,
      });
      return;
    }

    res.json({
      token: createAdminToken(),
      credentialsConfigured: true,
      adminUsernameHint: username,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!username || !password) {
      res.status(400).json({ error: 'Masukkan username dan password Admin.' });
      return;
    }

    if (!verifyCredentials(username, password)) {
      res.status(401).json({ error: 'Username atau password Admin tidak sesuai.' });
      return;
    }

    res.json({
      token: createAdminToken(),
      adminUsernameHint: username.toLowerCase(),
    });
  });

  app.post('/api/auth/change-credentials', requireAdmin, (req, res) => {
    const hasDb = Boolean(getStoredAdminCredentials());
    const envUsername = (process.env.ADMIN_USERNAME || '').trim();
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (!hasDb && envUsername && envPassword) {
      res.status(400).json({
        error: 'Kredensial dikelola melalui variabel lingkungan ADMIN_USERNAME & ADMIN_PASSWORD di server.',
      });
      return;
    }

    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword.trim() : '';
    const newUsername =
      typeof req.body?.newUsername === 'string' ? req.body.newUsername.trim().toLowerCase() : '';
    const newPassword =
      typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';

    if (!verifyCurrentPassword(currentPassword)) {
      res.status(401).json({ error: 'Password saat ini tidak sesuai.' });
      return;
    }

    if (newUsername && !isValidUsername(newUsername)) {
      res.status(400).json({ error: 'Format username baru tidak valid (min. 3 karakter).' });
      return;
    }

    if (newPassword && (newPassword.length < 6 || newPassword.length > 128)) {
      res.status(400).json({ error: 'Password baru harus minimal 6 karakter.' });
      return;
    }

    if (!newUsername && !newPassword) {
      res.status(400).json({ error: 'Masukkan username baru atau password baru.' });
      return;
    }

    updateAdminCredentials(newUsername || null, newPassword || null);
    const updated = getStoredAdminCredentials();
    res.json({ ok: true, adminUsernameHint: updated?.username || '' });
  });

  app.put('/api/portal', requireAdmin, (req, res) => {
    const sanitized = sanitizePortalPayload(req.body);
    if (!sanitized) {
      res.status(400).json({ error: 'Format data portal tidak valid.' });
      return;
    }

    try {
      savePortalData(sanitized);
      res.json(readPortalData());
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan data portal ke database.' });
    }
  });

  app.post('/api/portal/setup-database', requireAdmin, (_req, res) => {
    try {
      setupDatabase({ reset: true });
      res.json(readPortalData());
    } catch {
      res.status(500).json({ error: 'Gagal mereset database portal.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
