import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, X } from 'lucide-react';
import { AboutSection } from './components/AboutSection';
import { AdminBar } from './components/AdminBar';
import { AdminSettingsModal, AdminSettingsTab } from './components/AdminSettingsModal';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { AuthActionResponse, PinLoginModal } from './components/PinLoginModal';
import { PrincipalProfileSection } from './components/PrincipalProfileSection';
import { ServiceCard } from './components/ServiceCard';
import { ServiceEditorModal } from './components/ServiceEditorModal';
import { PortalTheme, ThemeToggle } from './components/ThemeToggle';
import { ToastContainer } from './components/Toast';
import { DEFAULT_PORTAL_CONFIG } from './data/defaultConfig';
import {
  AboutInfo,
  HeroInfo,
  LayoutSettings,
  PortalConfig,
  PrincipalProfileInfo,
  SchoolInfo,
  ServiceItem,
  ToastMessage,
  ToastType,
} from './types';
import { mergeWithDefaults } from './utils/storage';

interface ServerPortalResponse {
  school: SchoolInfo;
  hero: HeroInfo;
  about: AboutInfo;
  leadership: PrincipalProfileInfo;
  layout: LayoutSettings;
  services: ServiceItem[];
  credentialsConfigured: boolean;
  envCredentialsOverride: boolean;
  adminUsernameHint: string;
}

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(DEFAULT_PORTAL_CONFIG);
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean>(false);
  const [envCredentialsOverride, setEnvCredentialsOverride] = useState<boolean>(false);
  const [adminUsernameHint, setAdminUsernameHint] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const isAdminMode = Boolean(adminToken);

  const [activeSection, setActiveSection] = useState<
    'beranda' | 'layanan' | 'profil' | 'tentang'
  >('beranda');
  const [showServices, setShowServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<PortalTheme>(() => {
    try {
      const saved = localStorage.getItem('smpn4_portal_theme_v1');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('smpn4_portal_theme_v1', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Modals state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<AdminSettingsTab>('layout');

  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyServerPayload = useCallback((payload: ServerPortalResponse) => {
    setConfig((prev) =>
      mergeWithDefaults({
        ...prev,
        school: payload.school,
        hero: payload.hero,
        about: payload.about,
        leadership: payload.leadership,
        layout: payload.layout,
        services: payload.services,
      })
    );
    setCredentialsConfigured(Boolean(payload.credentialsConfigured));
    setEnvCredentialsOverride(Boolean(payload.envCredentialsOverride));
    setAdminUsernameHint(payload.adminUsernameHint || '');
  }, []);

  const refreshPortalState = useCallback(async () => {
    try {
      const res = await fetch('/api/portal');
      if (!res.ok) return;
      const data = (await res.json()) as ServerPortalResponse;
      applyServerPayload(data);
    } catch {
      // Fallback keeps default configuration visible if offline
    }
  }, [applyServerPayload]);

  // Load initial portal state from backend SQLite database
  useEffect(() => {
    void refreshPortalState();
  }, [refreshPortalState]);

  useEffect(() => {
    if (pinModalOpen) {
      void refreshPortalState();
    }
  }, [pinModalOpen, refreshPortalState]);

  const persistToServer = useCallback(
    async (nextConfig: PortalConfig) => {
      if (!adminToken) return;
      try {
        const res = await fetch('/api/portal', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            school: nextConfig.school,
            hero: nextConfig.hero,
            about: nextConfig.about,
            leadership: nextConfig.leadership,
            layout: nextConfig.layout,
            services: nextConfig.services,
          }),
        });
        if (res.status === 401) {
          setAdminToken(null);
          showToast('Sesi Admin berakhir. Silakan login kembali.', 'warning');
          return;
        }
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          showToast(errBody.error || 'Gagal menyimpan perubahan ke database.', 'error');
          return;
        }
        const saved = (await res.json()) as ServerPortalResponse;
        applyServerPayload(saved);
      } catch {
        showToast('Tidak dapat menghubungi server database.', 'error');
      }
    },
    [adminToken, applyServerPayload, showToast]
  );

  const commitConfigUpdate = useCallback(
    (updater: (prev: PortalConfig) => PortalConfig) => {
      setConfig((prev) => {
        const next = updater(prev);
        void persistToServer(next);
        return next;
      });
    },
    [persistToServer]
  );

  const handleAuthenticate = async (
    username: string,
    password: string,
    isInitialSetup: boolean
  ): Promise<AuthActionResponse> => {
    try {
      const endpoint = isInitialSetup ? '/api/auth/setup-credentials' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        token?: string;
        credentialsConfigured?: boolean;
        adminUsernameHint?: string;
        error?: string;
      };
      if (body.credentialsConfigured) {
        setCredentialsConfigured(true);
      }
      if (body.adminUsernameHint) {
        setAdminUsernameHint(body.adminUsernameHint);
      }
      if (!res.ok || !body.token) {
        return {
          ok: false,
          error: body.error || 'Username atau password Admin tidak sesuai.',
        };
      }
      setAdminToken(body.token);
      setCredentialsConfigured(true);
      setAdminUsernameHint(body.adminUsernameHint || username.trim().toLowerCase());
      setPinModalOpen(false);
      showToast(
        isInitialSetup
          ? 'Akun Admin berhasil dibuat. Mode Admin aktif.'
          : 'Login berhasil. Mode Admin aktif.',
        'success'
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal terhubung ke server autentikasi.' };
    }
  };

  const handleChangeCredentials = async (
    currentPassword: string,
    newUsername: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!adminToken) return { ok: false, error: 'Sesi Admin tidak aktif.' };
    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        adminUsernameHint?: string;
        error?: string;
      };
      if (!res.ok) {
        return { ok: false, error: body.error || 'Gagal memperbarui akun Admin.' };
      }
      if (body.adminUsernameHint) {
        setAdminUsernameHint(body.adminUsernameHint);
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Gagal menghubungi server.' };
    }
  };

  const handleNavigate = (section: 'beranda' | 'layanan' | 'profil' | 'tentang') => {
    setActiveSection(section);
    if (section === 'layanan') {
      setShowServices(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowServices(false);
    if (section === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.setTimeout(() => {
      const targetEl = document.getElementById(section);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const handleEmptyLinkClick = (service: ServiceItem) => {
    showToast(
      `Tautan untuk layanan "${service.name}" belum diatur. Masuk ke menu Admin untuk menambahkan link.`,
      'warning'
    );
  };

  const handleOpenAddService = () => {
    setShowServices(true);
    setActiveSection('layanan');
    setEditingService(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditService = (service: ServiceItem) => {
    setEditingService(service);
    setEditorModalOpen(true);
  };

  const handleSaveService = (data: Omit<ServiceItem, 'id'>, existingId?: string) => {
    if (existingId) {
      commitConfigUpdate((prev) => ({
        ...prev,
        services: prev.services.map((svc) =>
          svc.id === existingId ? { ...data, id: existingId } : svc
        ),
      }));
      showToast(`Layanan "${data.name}" berhasil diperbarui.`, 'success');
    } else {
      const newService: ServiceItem = {
        ...data,
        id: `svc-${Date.now()}`,
      };
      commitConfigUpdate((prev) => ({
        ...prev,
        services: [...prev.services, newService],
      }));
      showToast(`Layanan "${data.name}" berhasil ditambahkan.`, 'success');
    }
    setEditorModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    const target = config.services.find((s) => s.id === serviceId);
    commitConfigUpdate((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
    showToast(`Layanan "${target?.name || 'terpilih'}" telah dihapus.`, 'info');
  };

  const handleToggleVisibility = (serviceId: string) => {
    commitConfigUpdate((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? { ...s, visible: !s.visible } : s
      ),
    }));
  };

  const handleMoveService = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= config.services.length) return;
    commitConfigUpdate((prev) => {
      const next = [...prev.services];
      const [moved] = next.splice(index, 1);
      next.splice(newIndex, 0, moved);
      return { ...prev, services: next };
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    commitConfigUpdate((prev) => {
      const next = [...prev.services];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, services: next };
    });
    setDraggedIndex(null);
  };

  const handleUpdateLayout = (layout: LayoutSettings) => {
    commitConfigUpdate((prev) => ({ ...prev, layout }));
  };

  const handleUpdateIdentity = (school: SchoolInfo, hero: HeroInfo, about: AboutInfo) => {
    commitConfigUpdate((prev) => ({ ...prev, school, hero, about }));
  };

  const handleUpdateLeadership = (leadership: PrincipalProfileInfo) => {
    commitConfigUpdate((prev) => ({ ...prev, leadership }));
  };

  const handleImportConfig = (imported: PortalConfig) => {
    commitConfigUpdate(() => imported);
    setSettingsModalOpen(false);
  };

  const handleResetDefaults = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/portal/setup-database', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        showToast('Gagal mereset database portal.', 'error');
        return;
      }
      const data = (await res.json()) as ServerPortalResponse;
      applyServerPayload(data);
      setSettingsModalOpen(false);
      if (!data.credentialsConfigured) {
        setAdminToken(null);
      }
      showToast('Database portal telah direset ke pengaturan awal.', 'info');
    } catch {
      showToast('Gagal menghubungi server database.', 'error');
    }
  };

  const displayedServices = useMemo(() => {
    const base = isAdminMode
      ? config.services
      : config.services.filter((s) => s.visible);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [config.services, isAdminMode, searchQuery]);

  const visibleCount = useMemo(
    () => config.services.filter((s) => s.visible).length,
    [config.services]
  );

  const gridColumnClasses: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        school={config.school}
        isAdminMode={isAdminMode}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onAdminClick={() => setPinModalOpen(true)}
        onExitAdmin={() => {
          setAdminToken(null);
          showToast('Anda telah keluar dari Mode Admin.', 'info');
        }}
      />

      {isAdminMode && (
        <AdminBar
          totalServices={config.services.length}
          visibleServices={visibleCount}
          onAddService={handleOpenAddService}
          onOpenSettings={(tab) => {
            setSettingsTab(tab);
            setSettingsModalOpen(true);
          }}
          onExitAdmin={() => {
            setAdminToken(null);
            showToast('Anda telah keluar dari Mode Admin.', 'info');
          }}
        />
      )}

      {/* Hero Landing Page Banner (hidden when Services view is open) */}
      {!showServices && (
        <HeroSection
          hero={config.hero}
          visibleServicesCount={visibleCount}
          onExploreClick={() => handleNavigate('layanan')}
        />
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {showServices ? (
          /* Services View: 8 Digital Service Cards (Beranda, Profil & Tentang hidden) */
          <section id="layanan" className="scroll-mt-24">
            <div className="mb-5">
              <button
                type="button"
                onClick={() => handleNavigate('beranda')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
                  {config.school.subtitle}
                </h2>
                <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Pilih layanan digital {config.school.name} yang ingin Anda akses.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>{visibleCount} layanan tersedia</span>
                  <span aria-hidden="true">·</span>
                  <span>Akses terpadu satu pintu</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search
                    className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari layanan..."
                    aria-label="Cari layanan sekolah"
                    className="w-full pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                      aria-label="Hapus pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isAdminMode && (
                  <button
                    type="button"
                    onClick={handleOpenAddService}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Tambah</span>
                  </button>
                )}
              </div>
            </div>

            {/* Service Cards Grid */}
            {displayedServices.length > 0 ? (
              <div className={`grid gap-5 sm:gap-6 ${gridColumnClasses[config.layout.columns]}`}>
                {displayedServices.map((service) => {
                  const actualIndex = config.services.findIndex((s) => s.id === service.id);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      index={actualIndex}
                      totalCount={config.services.length}
                      cardStyle={config.layout.cardStyle}
                      globalLinkTarget={config.layout.globalLinkTarget}
                      isAdminMode={isAdminMode}
                      isDragging={draggedIndex === actualIndex}
                      onEmptyLinkClick={handleEmptyLinkClick}
                      onEdit={handleOpenEditService}
                      onDelete={handleDeleteService}
                      onToggleVisibility={handleToggleVisibility}
                      onMove={handleMoveService}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {searchQuery
                    ? `Tidak ada layanan yang cocok dengan "${searchQuery}"`
                    : 'Belum ada layanan yang ditampilkan.'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {searchQuery
                    ? 'Coba kata kunci lain atau bersihkan kotak pencarian.'
                    : 'Masuk ke Mode Admin untuk menambahkan atau menampilkan kartu layanan.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/70 rounded-xl transition-colors"
                  >
                    Tampilkan Semua Layanan
                  </button>
                )}
              </div>
            )}

            <footer className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <p>
                &copy; {new Date().getFullYear()} {config.school.name}. Seluruh hak cipta dilindungi.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span>Tema Tampilan:</span>
                <ThemeToggle theme={theme} onChangeTheme={setTheme} />
              </div>
            </footer>
          </section>
        ) : (
          /* Landing Page View: Beranda (above) + Profil Kepala Sekolah & Visi Misi + Tentang */
          <>
            <PrincipalProfileSection
              leadership={config.leadership}
              isAdminMode={isAdminMode}
              onEditClick={() => {
                setSettingsTab('leadership');
                setSettingsModalOpen(true);
              }}
            />

            <AboutSection
              school={config.school}
              about={config.about}
              isAdminMode={isAdminMode}
              onAddClick={() => {
                setSettingsTab('header');
                setSettingsModalOpen(true);
              }}
              theme={theme}
              onChangeTheme={setTheme}
            />
          </>
        )}
      </main>

      {/* Modals */}
      <PinLoginModal
        isOpen={pinModalOpen}
        credentialsConfigured={credentialsConfigured}
        adminUsernameHint={adminUsernameHint}
        onClose={() => setPinModalOpen(false)}
        onAuthenticate={handleAuthenticate}
      />

      <ServiceEditorModal
        isOpen={editorModalOpen}
        service={editingService}
        onClose={() => {
          setEditorModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
      />

      <AdminSettingsModal
        isOpen={settingsModalOpen}
        initialTab={settingsTab}
        config={config}
        envCredentialsOverride={envCredentialsOverride}
        adminUsernameHint={adminUsernameHint}
        onClose={() => setSettingsModalOpen(false)}
        onUpdateLayout={handleUpdateLayout}
        onUpdateIdentity={handleUpdateIdentity}
        onUpdateLeadership={handleUpdateLeadership}
        onChangeCredentials={handleChangeCredentials}
        onImportConfig={handleImportConfig}
        onResetDefaults={handleResetDefaults}
        onNotify={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
