import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
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
import { PRIMARY_ADMIN_EMAIL, auth, googleProvider } from './firebase';
import {
  resetPortalConfigInFirestore,
  savePortalConfigToFirestore,
  subscribePortalConfig,
  verifyUserIsAdmin,
} from './services/portalFirestore';
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

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(DEFAULT_PORTAL_CONFIG);
  const [remoteReady, setRemoteReady] = useState<boolean>(false);
  const [hasRemoteData, setHasRemoteData] = useState<boolean>(false);

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

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

  const autoSeededRef = useRef<boolean>(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

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

  // Listen to Firebase Auth state and verify Admin role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdminMode(false);
        setAdminEmail(null);
        setAuthReady(true);
        return;
      }
      const allowed = await verifyUserIsAdmin(user);
      if (allowed) {
        setIsAdminMode(true);
        setAdminEmail(user.email || PRIMARY_ADMIN_EMAIL);
      } else {
        setIsAdminMode(false);
        setAdminEmail(null);
      }
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Subscribe to permanent Cloud Firestore portal data after auth state is ready
  useEffect(() => {
    if (!authReady) return;
    const unsubscribe = subscribePortalConfig(
      isAdminMode,
      (nextConfig, meta) => {
        setConfig(nextConfig);
        setHasRemoteData(meta.hasRemoteData);
        setRemoteReady(meta.remoteReady);
      },
      () => {
        showToast('Gagal memuat data portal dari database cloud.', 'error');
      }
    );
    return unsubscribe;
  }, [authReady, isAdminMode, showToast]);

  const enqueueWrite = useCallback(
    (task: () => Promise<void>, errorMessage: string) => {
      writeQueueRef.current = writeQueueRef.current
        .then(task)
        .catch(() => {
          showToast(errorMessage, 'error');
        });
      return writeQueueRef.current;
    },
    [showToast]
  );

  // Bootstrap Firestore once if an Admin logs in and no remote document exists yet
  useEffect(() => {
    if (isAdminMode && remoteReady && !hasRemoteData && !autoSeededRef.current) {
      autoSeededRef.current = true;
      void enqueueWrite(
        () => savePortalConfigToFirestore(DEFAULT_PORTAL_CONFIG),
        'Gagal menginisialisasi data awal ke Cloud Firestore.'
      );
    }
  }, [isAdminMode, remoteReady, hasRemoteData, enqueueWrite]);

  const persistToFirestore = useCallback(
    (nextConfig: PortalConfig) => {
      if (!isAdminMode) return;
      void enqueueWrite(
        () => savePortalConfigToFirestore(nextConfig),
        'Gagal menyimpan perubahan ke Cloud Firestore. Periksa koneksi internet Anda.'
      );
    },
    [isAdminMode, enqueueWrite]
  );

  const commitConfigUpdate = useCallback(
    (updater: (prev: PortalConfig) => PortalConfig) => {
      setConfig((prev) => {
        const next = updater(prev);
        persistToFirestore(next);
        return next;
      });
    },
    [persistToFirestore]
  );

  const handleGoogleSignIn = async (): Promise<AuthActionResponse> => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const allowed = await verifyUserIsAdmin(credential.user);
      if (!allowed) {
        const attemptedEmail = credential.user.email || 'akun terpilih';
        await signOut(auth);
        return {
          ok: false,
          error: `Akun ${attemptedEmail} tidak terdaftar sebagai Admin portal. Gunakan akun resmi ${PRIMARY_ADMIN_EMAIL}.`,
        };
      }
      setIsAdminMode(true);
      setAdminEmail(credential.user.email || PRIMARY_ADMIN_EMAIL);
      setPinModalOpen(false);
      showToast('Login berhasil. Mode Admin aktif dan perubahan tersimpan permanen.', 'success');
      return { ok: true };
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'Jendela login Google ditutup sebelum proses selesai.' };
      }
      if (code === 'auth/popup-blocked') {
        return {
          ok: false,
          error: 'Pop-up login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.',
        };
      }
      if (code === 'auth/unauthorized-domain') {
        return {
          ok: false,
          error: 'Domain ini belum diotorisasi pada konfigurasi Firebase Auth.',
        };
      }
      return {
        ok: false,
        error: 'Gagal terhubung ke Google Sign-In. Pastikan koneksi internet aktif lalu coba lagi.',
      };
    }
  };

  const handleExitAdmin = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore signOut errors
    }
    setIsAdminMode(false);
    setAdminEmail(null);
    setSettingsModalOpen(false);
    setEditorModalOpen(false);
    showToast('Anda telah keluar dari Mode Admin.', 'info');
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
    if (!isAdminMode) return;
    setConfig(DEFAULT_PORTAL_CONFIG);
    setSettingsModalOpen(false);
    await enqueueWrite(
      () => resetPortalConfigInFirestore(),
      'Gagal mereset database portal di Cloud Firestore.'
    );
    showToast('Database portal telah dikembalikan ke pengaturan awal.', 'info');
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
        onExitAdmin={() => void handleExitAdmin()}
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
          onExitAdmin={() => void handleExitAdmin()}
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
          /* Services View: Digital Service Cards (Beranda, Profil & Tentang hidden) */
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
        onClose={() => setPinModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
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
        adminEmail={adminEmail}
        onClose={() => setSettingsModalOpen(false)}
        onUpdateLayout={handleUpdateLayout}
        onUpdateIdentity={handleUpdateIdentity}
        onUpdateLeadership={handleUpdateLeadership}
        onImportConfig={handleImportConfig}
        onResetDefaults={() => void handleResetDefaults()}
        onNotify={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
