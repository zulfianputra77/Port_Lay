import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { AboutSection } from './components/AboutSection';
import { AdminBar } from './components/AdminBar';
import { AdminSettingsModal, AdminSettingsTab } from './components/AdminSettingsModal';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PinLoginModal } from './components/PinLoginModal';
import { ServiceCard } from './components/ServiceCard';
import { ServiceEditorModal } from './components/ServiceEditorModal';
import { ToastContainer } from './components/Toast';
import { DEFAULT_PORTAL_CONFIG } from './data/defaultConfig';
import {
  AboutInfo,
  HeroInfo,
  LayoutSettings,
  PortalConfig,
  SchoolInfo,
  ServiceItem,
  ToastMessage,
  ToastType,
} from './types';
import { clearPortalConfig, loadPortalConfig, savePortalConfig } from './utils/storage';

export default function App() {
  const [config, setConfig] = useState<PortalConfig>(() => loadPortalConfig());
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeSection, setActiveSection] = useState<'beranda' | 'layanan' | 'tentang'>('beranda');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Persist every config change automatically to localStorage
  useEffect(() => {
    savePortalConfig(config);
  }, [config]);

  const handleNavigate = (section: 'beranda' | 'layanan' | 'tentang') => {
    setActiveSection(section);
    if (section === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetEl = document.getElementById(section);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEmptyLinkClick = (service: ServiceItem) => {
    showToast(
      `Tautan untuk layanan "${service.name}" belum diatur. Masuk ke menu Admin untuk menambahkan link.`,
      'warning'
    );
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditService = (service: ServiceItem) => {
    setEditingService(service);
    setEditorModalOpen(true);
  };

  const handleSaveService = (data: Omit<ServiceItem, 'id'>, existingId?: string) => {
    if (existingId) {
      setConfig((prev) => ({
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
      setConfig((prev) => ({
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
    setConfig((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
    showToast(`Layanan "${target?.name || 'terpilih'}" telah dihapus.`, 'info');
  };

  const handleToggleVisibility = (serviceId: string) => {
    setConfig((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? { ...s, visible: !s.visible } : s
      ),
    }));
  };

  const handleMoveService = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= config.services.length) return;
    setConfig((prev) => {
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
    setConfig((prev) => {
      const next = [...prev.services];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return { ...prev, services: next };
    });
    setDraggedIndex(null);
  };

  const handleUpdateLayout = (layout: LayoutSettings) => {
    setConfig((prev) => ({ ...prev, layout }));
  };

  const handleUpdateIdentity = (school: SchoolInfo, hero: HeroInfo, about: AboutInfo) => {
    setConfig((prev) => ({ ...prev, school, hero, about }));
  };

  const handleChangePin = (newPin: string) => {
    setConfig((prev) => ({ ...prev, adminPin: newPin }));
  };

  const handleImportConfig = (imported: PortalConfig) => {
    setConfig(imported);
    setSettingsModalOpen(false);
  };

  const handleResetDefaults = () => {
    const fresh = clearPortalConfig();
    setConfig(fresh);
    setSettingsModalOpen(false);
    showToast('Seluruh pengaturan portal telah dikembalikan ke kondisi awal.', 'info');
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
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900">
      <Navbar
        school={config.school}
        isAdminMode={isAdminMode}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onAdminClick={() => setPinModalOpen(true)}
        onExitAdmin={() => {
          setIsAdminMode(false);
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
            setIsAdminMode(false);
            showToast('Anda telah keluar dari Mode Admin.', 'info');
          }}
        />
      )}

      {/* Hero Landing Page Banner */}
      <HeroSection
        hero={config.hero}
        visibleServicesCount={visibleCount}
        onExploreClick={() => handleNavigate('layanan')}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Layanan Section Header & Search */}
        <section id="layanan" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
                {config.school.subtitle}
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-600">
                Pilih layanan digital {config.school.name} yang ingin Anda akses.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500 tabular-nums">
                <span>{visibleCount} layanan tersedia</span>
                <span aria-hidden="true">·</span>
                <span>Akses terpadu satu pintu</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari layanan..."
                  aria-label="Cari layanan sekolah"
                  className="w-full pl-10 pr-9 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
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
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <p className="text-base font-semibold text-slate-800">
                {searchQuery
                  ? `Tidak ada layanan yang cocok dengan "${searchQuery}"`
                  : 'Belum ada layanan yang ditampilkan.'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery
                  ? 'Coba kata kunci lain atau bersihkan kotak pencarian.'
                  : 'Masuk ke Mode Admin untuk menambahkan atau menampilkan kartu layanan.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  Tampilkan Semua Layanan
                </button>
              )}
            </div>
          )}
        </section>

        {/* About & Quiet Footer */}
        <AboutSection school={config.school} about={config.about} />
      </main>

      {/* Modals */}
      <PinLoginModal
        isOpen={pinModalOpen}
        expectedPin={config.adminPin || DEFAULT_PORTAL_CONFIG.adminPin}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setPinModalOpen(false);
          setIsAdminMode(true);
          showToast('Berhasil masuk ke Mode Admin.', 'success');
        }}
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
        onClose={() => setSettingsModalOpen(false)}
        onUpdateLayout={handleUpdateLayout}
        onUpdateIdentity={handleUpdateIdentity}
        onChangePin={handleChangePin}
        onImportConfig={handleImportConfig}
        onResetDefaults={handleResetDefaults}
        onNotify={showToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
