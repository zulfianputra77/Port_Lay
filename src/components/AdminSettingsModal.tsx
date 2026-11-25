import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Code2,
  Copy,
  Download,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  Link2,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sliders,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../firebase';
import {
  DEFAULT_HERO_BACKGROUND,
  DEFAULT_PRINCIPAL_PHOTO,
  DEFAULT_SCHOOL_LOGO,
} from '../data/defaultConfig';
import {
  AboutInfo,
  CardStyle,
  GlobalLinkTarget,
  HeroInfo,
  LayoutColumns,
  LayoutSettings,
  PortalConfig,
  PrincipalProfileInfo,
  SchoolInfo,
} from '../types';
import { EmbedFormat, generateEmbedCode } from '../utils/embedGenerator';
import {
  generateGasBackendScript,
  generateSingleFileFrontendHtml,
} from '../utils/gasGenerator';
import {
  isValidUrl,
  normalizeImageUrl,
  processImageFileToDataUrl,
  validateImportedJson,
} from '../utils/storage';

export type AdminSettingsTab = 'layout' | 'header' | 'leadership' | 'embed' | 'security';
type ExportOutputKind = 'single_frontend' | 'gas_backend' | 'snippet';

interface AdminSettingsModalProps {
  isOpen: boolean;
  initialTab: AdminSettingsTab;
  config: PortalConfig;
  adminEmail: string | null;
  onClose: () => void;
  onUpdateLayout: (layout: LayoutSettings) => void;
  onUpdateIdentity: (school: SchoolInfo, hero: HeroInfo, about: AboutInfo) => void;
  onUpdateLeadership: (leadership: PrincipalProfileInfo) => void;
  onImportConfig: (imported: PortalConfig) => void;
  onResetDefaults: () => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  initialTab,
  config,
  adminEmail,
  onClose,
  onUpdateLayout,
  onUpdateIdentity,
  onUpdateLeadership,
  onImportConfig,
  onResetDefaults,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(initialTab);

  // Header, Hero & About form state
  const [schoolForm, setSchoolForm] = useState<SchoolInfo>(config.school);
  const [heroForm, setHeroForm] = useState<HeroInfo>(config.hero);
  const [aboutForm, setAboutForm] = useState<AboutInfo>(config.about);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [heroBgUploadError, setHeroBgUploadError] = useState('');
  const [newHeroLink, setNewHeroLink] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const heroBgFileInputRef = useRef<HTMLInputElement>(null);

  // Leadership / Principal Profile & Vision Mission form state
  const [leadershipForm, setLeadershipForm] = useState<PrincipalProfileInfo>(config.leadership);
  const [missionText, setMissionText] = useState((config.leadership.missionItems || []).join('\n'));
  const [principalPhotoError, setPrincipalPhotoError] = useState('');
  const principalPhotoInputRef = useRef<HTMLInputElement>(null);

  // Embed tab state
  const [embedKind, setEmbedKind] = useState<ExportOutputKind>('single_frontend');
  const [embedLogoOverride, setEmbedLogoOverride] = useState('');
  const [embedHeroBgOverride, setEmbedHeroBgOverride] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Import/Reset states
  const importFileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSchoolForm(config.school);
      setHeroForm({
        ...config.hero,
        backgroundImages:
          config.hero.backgroundImages && config.hero.backgroundImages.length > 0
            ? config.hero.backgroundImages
            : [config.hero.backgroundUrl || DEFAULT_HERO_BACKGROUND],
      });
      setAboutForm({
        ...config.about,
        extraItems: config.about.extraItems || [],
      });
      setLeadershipForm(config.leadership);
      setMissionText((config.leadership.missionItems || []).join('\n'));
      setLogoUploadError('');
      setHeroBgUploadError('');
      setPrincipalPhotoError('');
      setNewHeroLink('');
      setConfirmReset(false);
      setCopiedEmbed(false);
    }
  }, [isOpen, initialTab, config]);

  const generatedOutputCode = useMemo(() => {
    if (!isOpen || activeTab !== 'embed') return '';
    const overriddenConfig: PortalConfig = {
      ...config,
      school: {
        ...config.school,
        logoUrl: embedLogoOverride.trim() || config.school.logoUrl,
      },
      hero: {
        ...config.hero,
        backgroundUrl: embedHeroBgOverride.trim() || config.hero.backgroundUrl,
        backgroundImages: embedHeroBgOverride.trim()
          ? [normalizeImageUrl(embedHeroBgOverride)]
          : config.hero.backgroundImages,
      },
    };
    if (embedKind === 'gas_backend') {
      const { adminPin: _omit, ...publicCfg } = overriddenConfig;
      return generateGasBackendScript(publicCfg);
    }
    if (embedKind === 'snippet') {
      return generateEmbedCode(overriddenConfig, {
        format: 'snippet' as EmbedFormat,
        publicLogoUrl: embedLogoOverride,
        publicHeroBgUrl: embedHeroBgOverride,
      });
    }
    const { adminPin: _omit, ...publicCfg } = overriddenConfig;
    return generateSingleFileFrontendHtml(publicCfg);
  }, [isOpen, activeTab, config, embedKind, embedLogoOverride, embedHeroBgOverride]);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploadError('');
    try {
      const dataUrl = await processImageFileToDataUrl(file, 240);
      setSchoolForm((prev) => ({ ...prev, logoUrl: dataUrl }));
    } catch (err) {
      setLogoUploadError(err instanceof Error ? err.message : 'Gagal mengunggah logo.');
    } finally {
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setHeroBgUploadError('');
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const dataUrl = await processImageFileToDataUrl(file, 1440);
        uploadedUrls.push(dataUrl);
      }
      setHeroForm((prev) => {
        const nextImages = [...(prev.backgroundImages || []), ...uploadedUrls];
        return {
          ...prev,
          backgroundImages: nextImages,
          backgroundUrl: nextImages[0] || DEFAULT_HERO_BACKGROUND,
        };
      });
    } catch (err) {
      setHeroBgUploadError(err instanceof Error ? err.message : 'Gagal mengunggah gambar background.');
    } finally {
      if (heroBgFileInputRef.current) heroBgFileInputRef.current.value = '';
    }
  };

  const handleAddHeroDriveOrUrl = () => {
    const trimmed = newHeroLink.trim();
    if (!trimmed) {
      setHeroBgUploadError('Masukkan tautan Google Drive atau URL gambar terlebih dahulu.');
      return;
    }
    const normalized = normalizeImageUrl(trimmed);
    if (!isValidUrl(normalized) && !normalized.startsWith('/')) {
      setHeroBgUploadError('Format link tidak valid. Pastikan diawali https:// atau link Google Drive yang benar.');
      return;
    }
    setHeroBgUploadError('');
    setHeroForm((prev) => {
      const nextImages = [...(prev.backgroundImages || []), normalized];
      return {
        ...prev,
        backgroundImages: nextImages,
        backgroundUrl: nextImages[0] || DEFAULT_HERO_BACKGROUND,
      };
    });
    setNewHeroLink('');
  };

  const handleMoveHeroImage = (index: number, direction: -1 | 1) => {
    setHeroForm((prev) => {
      const arr = [...(prev.backgroundImages || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= arr.length) return prev;
      const [moved] = arr.splice(index, 1);
      arr.splice(nextIndex, 0, moved);
      return {
        ...prev,
        backgroundImages: arr,
        backgroundUrl: arr[0] || DEFAULT_HERO_BACKGROUND,
      };
    });
  };

  const handleRemoveHeroImage = (index: number) => {
    setHeroForm((prev) => {
      const arr = [...(prev.backgroundImages || [])];
      arr.splice(index, 1);
      const safeArr = arr.length > 0 ? arr : [DEFAULT_HERO_BACKGROUND];
      return {
        ...prev,
        backgroundImages: safeArr,
        backgroundUrl: safeArr[0],
      };
    });
  };

  const getHeroImageLabel = (src: string) => {
    if (src === DEFAULT_HERO_BACKGROUND) return 'Foto Gedung Bawaan';
    if (src.startsWith('data:')) return 'Foto Unggahan Perangkat';
    if (src.includes('drive.google.com')) return 'Link Google Drive';
    return 'URL Gambar Eksternal';
  };

  const handleAddAboutExtraItem = () => {
    setAboutForm((prev) => ({
      ...prev,
      extraItems: [
        ...(prev.extraItems || []),
        {
          id: `about-extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: '',
          value: '',
        },
      ],
    }));
  };

  const handleUpdateAboutExtraItem = (id: string, field: 'label' | 'value', val: string) => {
    setAboutForm((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).map((item) =>
        item.id === id ? { ...item, [field]: val } : item
      ),
    }));
  };

  const handleRemoveAboutExtraItem = (id: string) => {
    setAboutForm((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((item) => item.id !== id),
    }));
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) {
      onNotify('Nama sekolah tidak boleh kosong.', 'error');
      return;
    }
    const normalizedImages = (heroForm.backgroundImages || [])
      .map((u) => normalizeImageUrl(u))
      .filter((u) => u.length > 0);
    const finalImages =
      normalizedImages.length > 0 ? normalizedImages : [DEFAULT_HERO_BACKGROUND];

    const cleanedExtraItems = (aboutForm.extraItems || [])
      .map((item) => ({
        id: item.id,
        label: item.label.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.label.length > 0 || item.value.length > 0);

    onUpdateIdentity(
      {
        name: schoolForm.name.trim(),
        subtitle: schoolForm.subtitle.trim() || 'Portal Layanan Digital',
        logoUrl: schoolForm.logoUrl.trim() || DEFAULT_SCHOOL_LOGO,
      },
      {
        kicker: heroForm.kicker.trim(),
        title: heroForm.title.trim() || schoolForm.name.trim(),
        subtitle: heroForm.subtitle.trim(),
        ctaLabel: heroForm.ctaLabel.trim() || 'Jelajahi Layanan',
        backgroundUrl: finalImages[0],
        backgroundImages: finalImages,
        slideIntervalSeconds: heroForm.slideIntervalSeconds || 15,
        stat2Value: '',
        stat2Label: '',
        stat3Value: heroForm.stat3Value.trim() || '100%',
        stat3Label: heroForm.stat3Label.trim() || 'Terintegrasi',
      },
      {
        title: aboutForm.title.trim() || 'Tentang Portal',
        description: aboutForm.description.trim(),
        address: aboutForm.address.trim(),
        email: '',
        phone: '',
        serviceHours: aboutForm.serviceHours.trim(),
        extraItems: cleanedExtraItems,
      }
    );
    onNotify('Informasi Hero, Header & Tentang berhasil diperbarui.', 'success');
  };

  const handleCopyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedOutputCode);
      setCopiedEmbed(true);
      onNotify('Kode lengkap berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setCopiedEmbed(false), 3000);
    } catch {
      onNotify('Gagal menyalin otomatis. Gunakan tombol Unduh File atau salin manual dari kotak kode.', 'warning');
    }
  };

  const handleDownloadOutputFile = () => {
    const isGas = embedKind === 'gas_backend';
    const mime = isGas ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8';
    const filename = isGas ? 'Code.gs' : 'Index.html';
    const blob = new Blob([generatedOutputCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify(`File ${filename} berhasil diunduh.`, 'success');
  };

  const handlePrincipalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPrincipalPhotoError('');
    try {
      const dataUrl = await processImageFileToDataUrl(file, 720);
      setLeadershipForm((prev) => ({ ...prev, photoUrl: dataUrl }));
    } catch (err) {
      setPrincipalPhotoError(
        err instanceof Error ? err.message : 'Gagal mengunggah foto kepala sekolah.'
      );
    } finally {
      if (principalPhotoInputRef.current) principalPhotoInputRef.current.value = '';
    }
  };

  const handleSaveLeadership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadershipForm.principalName.trim()) {
      onNotify('Nama Kepala Sekolah tidak boleh kosong.', 'error');
      return;
    }
    const normalizedPhoto = normalizeImageUrl(leadershipForm.photoUrl) || DEFAULT_PRINCIPAL_PHOTO;
    const parsedMissions = missionText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    onUpdateLeadership({
      visible: leadershipForm.visible,
      sectionTitle: leadershipForm.sectionTitle.trim() || 'Profil Kepala Sekolah & Visi Misi',
      principalName: leadershipForm.principalName.trim(),
      principalTitle: leadershipForm.principalTitle.trim() || 'Kepala Sekolah',
      principalNip: leadershipForm.principalNip.trim(),
      photoUrl: normalizedPhoto,
      greetingTitle: leadershipForm.greetingTitle.trim() || 'Sambutan Kepala Sekolah',
      greetingMessage: leadershipForm.greetingMessage.trim(),
      visionTitle: leadershipForm.visionTitle.trim() || 'Visi Sekolah',
      visionText: leadershipForm.visionText.trim(),
      missionTitle: leadershipForm.missionTitle.trim() || 'Misi Sekolah',
      missionItems: parsedMissions,
    });
    onNotify('Profil Kepala Sekolah, Kata Sambutan & Visi Misi berhasil disimpan.', 'success');
  };

  const handleExportJson = () => {
    const { adminPin: _omit, ...safeExport } = config;
    const exportPayload = JSON.stringify(safeExport, null, 2);
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konfigurasi-portal-smpn4-jambi-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Konfigurasi JSON berhasil diekspor.', 'success');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const validated = validateImportedJson(text);
      onImportConfig(validated);
      onNotify('Konfigurasi JSON berhasil diimpor dan diterapkan.', 'success');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Gagal membaca file konfigurasi JSON.',
        'error'
      );
    } finally {
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const tabs: { id: AdminSettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'layout', label: 'Tata Letak', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'header', label: 'Hero, Header & Tentang', icon: <Sliders className="w-4 h-4" /> },
    { id: 'leadership', label: 'Kepala Sekolah & Visi Misi', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'embed', label: 'Embed Sites & Blogger', icon: <Code2 className="w-4 h-4" /> },
    { id: 'security', label: 'Akses & Backup', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 id="settings-modal-title" className="text-lg font-bold text-slate-900">
              Pengaturan Portal Admin
            </h2>
            <p className="text-xs text-slate-500">
              Sesuaikan tata letak, hero landing page, kode sematan Google Sites &amp; Blogger, dan keamanan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="overflow-y-auto p-6 space-y-6">
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Jumlah Kolom Grid Desktop</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Pilih jumlah kolom kartu layanan pada layar komputer/desktop.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([2, 3, 4] as LayoutColumns[]).map((cols) => {
                    const active = config.layout.columns === cols;
                    return (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => onUpdateLayout({ ...config.layout, columns: cols })}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex gap-1 mb-2.5">
                          {Array.from({ length: cols }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-3 flex-1 rounded-xs ${
                                active ? 'bg-blue-500' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold tabular-nums">{cols} Kolom</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Gaya Tampilan Kartu</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Atur susunan elemen di dalam setiap kartu layanan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        id: 'vertical',
                        title: 'Vertikal',
                        desc: 'Ikon di atas, judul, deskripsi & tombol buka (Default)',
                      },
                      {
                        id: 'horizontal',
                        title: 'Horizontal / Kompak',
                        desc: 'Ikon di kiri, teks & deskripsi di sebelah kanan',
                      },
                      {
                        id: 'minimal',
                        title: 'Minimalis',
                        desc: 'Ikon, judul layanan & tombol buka ringkas',
                      },
                    ] as { id: CardStyle; title: string; desc: string }[]
                  ).map((style) => {
                    const active = config.layout.cardStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() =>
                          onUpdateLayout({ ...config.layout, cardStyle: style.id })
                        }
                        className={`p-4 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-bold">{style.title}</div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{style.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Pengaturan Buka Tautan Global
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Berlaku untuk seluruh kartu layanan yang memilih opsi &ldquo;Ikuti Pengaturan Global&rdquo;.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        id: 'new_tab',
                        label: 'Buka di Tab Baru',
                        desc: 'Menjaga portal tetap terbuka saat layanan dibuka',
                      },
                      {
                        id: 'same_tab',
                        label: 'Buka di Tab yang Sama',
                        desc: 'Langsung berpindah halaman ke URL layanan',
                      },
                    ] as { id: GlobalLinkTarget; label: string; desc: string }[]
                  ).map((opt) => {
                    const active = config.layout.globalLinkTarget === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onUpdateLayout({ ...config.layout, globalLinkTarget: opt.id })
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-bold">{opt.label}</div>
                        <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'header' && (
            <form onSubmit={handleSaveIdentity} className="space-y-6">
              {/* Hero Banner Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tampilan Beranda (Hero Banner)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tambahkan satu atau beberapa gambar. Jika lebih dari 1 gambar, latar belakang beranda otomatis berganti setiap <strong>15 detik</strong>.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 tabular-nums shrink-0">
                    {(heroForm.backgroundImages || []).length} gambar
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* Action Buttons: Upload & Reset */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={heroBgFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleHeroBgUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => heroBgFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Unggah Foto (Bisa Banyak)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroForm((prev) => ({
                          ...prev,
                          backgroundUrl: DEFAULT_HERO_BACKGROUND,
                          backgroundImages: [DEFAULT_HERO_BACKGROUND],
                        }));
                        setHeroBgUploadError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reset Foto Awal</span>
                    </button>
                  </div>

                  {/* Add Google Drive Link / Image URL */}
                  <div className="space-y-1.5">
                    <label htmlFor="hero-drive-link" className="block text-xs font-semibold text-slate-700">
                      Tambah Link Google Drive atau URL Gambar
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Link2
                          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                        <input
                          id="hero-drive-link"
                          type="text"
                          value={newHeroLink}
                          onChange={(e) => {
                            setNewHeroLink(e.target.value);
                            if (heroBgUploadError) setHeroBgUploadError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddHeroDriveOrUrl();
                            }
                          }}
                          placeholder="Tempel link Google Drive (https://drive.google.com/file/d/...) atau URL gambar"
                          className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddHeroDriveOrUrl}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Tambah Link</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Untuk Google Drive, pastikan akses berbagi file diatur ke <em>&ldquo;Siapa saja yang memiliki link&rdquo;</em> agar foto tampil di beranda.
                    </p>
                  </div>

                  {heroBgUploadError && (
                    <p className="text-xs text-rose-600 font-medium" role="alert">
                      {heroBgUploadError}
                    </p>
                  )}

                  {/* Gallery List */}
                  <div className="space-y-2 pt-1">
                    {(heroForm.backgroundImages || []).map((imgSrc, idx) => (
                      <div
                        key={`${idx}-${imgSrc.slice(0, 24)}`}
                        className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl"
                      >
                        <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-800 shrink-0 flex items-center justify-center">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={`Slide Hero ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate tabular-nums">
                            Slide #{idx + 1} · {getHeroImageLabel(imgSrc)}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {imgSrc.startsWith('data:') ? 'Tersimpan lokal (Base64)' : imgSrc}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveHeroImage(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                            title="Naikkan urutan"
                            aria-label={`Naikkan slide ${idx + 1}`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveHeroImage(idx, 1)}
                            disabled={idx === (heroForm.backgroundImages || []).length - 1}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                            title="Turunkan urutan"
                            aria-label={`Turunkan slide ${idx + 1}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHeroImage(idx)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Hapus gambar"
                            aria-label={`Hapus slide ${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hero-subtitle" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Teks Baris 1 (Atas)
                    </label>
                    <input
                      id="hero-subtitle"
                      type="text"
                      value={heroForm.subtitle}
                      onChange={(e) =>
                        setHeroForm((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      placeholder="SELAMAT DATANG DI"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="hero-kicker" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Teks Baris 2 (Badge Portal)
                    </label>
                    <input
                      id="hero-kicker"
                      type="text"
                      value={heroForm.kicker}
                      onChange={(e) =>
                        setHeroForm((prev) => ({ ...prev, kicker: e.target.value }))
                      }
                      placeholder="PORTAL RESMI"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="hero-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Sekolah Hero (Animasi)
                    </label>
                    <input
                      id="hero-title"
                      type="text"
                      value={heroForm.title}
                      onChange={(e) =>
                        setHeroForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="SMP NEGERI 004 JAMBI"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="hero-cta" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Teks Tombol Utama
                    </label>
                    <input
                      id="hero-cta"
                      type="text"
                      value={heroForm.ctaLabel}
                      onChange={(e) =>
                        setHeroForm((prev) => ({ ...prev, ctaLabel: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* School Header Info */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Identitas Header &amp; Logo Sekolah</h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-300 bg-white flex items-center justify-center shrink-0">
                    {schoolForm.logoUrl ? (
                      <img
                        src={schoolForm.logoUrl}
                        alt="Preview logo sekolah"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-7 h-7 text-blue-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Unggah Logo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSchoolForm((prev) => ({ ...prev, logoUrl: DEFAULT_SCHOOL_LOGO }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Logo Awal</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={schoolForm.logoUrl}
                      onChange={(e) =>
                        setSchoolForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                      }
                      placeholder="Atau tempel URL gambar logo sekolah..."
                      className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {logoUploadError && (
                      <p className="text-xs text-rose-600 font-medium">{logoUploadError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="school-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Sekolah (Navbar)
                    </label>
                    <input
                      id="school-name"
                      type="text"
                      value={schoolForm.name}
                      onChange={(e) =>
                        setSchoolForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="school-sub" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Subjudul Portal (Navbar)
                    </label>
                    <input
                      id="school-sub"
                      type="text"
                      value={schoolForm.subtitle}
                      onChange={(e) =>
                        setSchoolForm((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* About Page Content */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Konten Bagian Tentang</h3>
                  <button
                    type="button"
                    onClick={handleAddAboutExtraItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tambah</span>
                  </button>
                </div>
                <div>
                  <label htmlFor="about-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Judul Bagian Tentang
                  </label>
                  <input
                    id="about-title"
                    type="text"
                    value={aboutForm.title}
                    onChange={(e) =>
                      setAboutForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="about-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Deskripsi Informasi Sekolah
                  </label>
                  <textarea
                    id="about-desc"
                    rows={3}
                    value={aboutForm.description}
                    onChange={(e) =>
                      setAboutForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="about-addr" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Alamat
                    </label>
                    <input
                      id="about-addr"
                      type="text"
                      value={aboutForm.address}
                      onChange={(e) =>
                        setAboutForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="about-hours" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jam Layanan
                    </label>
                    <input
                      id="about-hours"
                      type="text"
                      value={aboutForm.serviceHours}
                      onChange={(e) =>
                        setAboutForm((prev) => ({ ...prev, serviceHours: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Dynamic Extra Items added via Tambah button */}
                {(aboutForm.extraItems || []).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Informasi Tambahan
                    </p>
                    {(aboutForm.extraItems || []).map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-start"
                      >
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Label Info #{idx + 1}
                          </label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) =>
                              handleUpdateAboutExtraItem(item.id, 'label', e.target.value)
                            }
                            placeholder="Contoh: Akreditasi / NPSN"
                            className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-7">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Isi / Keterangan
                          </label>
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              handleUpdateAboutExtraItem(item.id, 'value', e.target.value)
                            }
                            placeholder="Masukkan keterangan..."
                            className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-1 flex sm:justify-end sm:pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveAboutExtraItem(item.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Hapus informasi ini"
                            aria-label={`Hapus informasi tambahan ${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Simpan Hero, Header &amp; Tentang
                </button>
              </div>
            </form>
          )}

          {activeTab === 'leadership' && (
            <form onSubmit={handleSaveLeadership} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tampilkan Bagian Profil Kepala Sekolah &amp; Visi Misi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur apakah profil kepala sekolah, kata sambutan, serta visi dan misi tampil di beranda.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={leadershipForm.visible}
                    onChange={(e) =>
                      setLeadershipForm((prev) => ({ ...prev, visible: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {leadershipForm.visible ? 'Ditampilkan' : 'Disembunyikan'}
                  </span>
                </label>
              </div>

              {/* Foto & Identitas Kepala Sekolah */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Foto &amp; Identitas Kepala Sekolah</h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-24 h-32 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center shrink-0">
                    {leadershipForm.photoUrl ? (
                      <img
                        src={normalizeImageUrl(leadershipForm.photoUrl)}
                        alt="Preview Foto Kepala Sekolah"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <UserCheck className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={principalPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePrincipalPhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => principalPhotoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Unggah Foto Kepala Sekolah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLeadershipForm((prev) => ({
                            ...prev,
                            photoUrl: DEFAULT_PRINCIPAL_PHOTO,
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Foto Bawaan</span>
                      </button>
                    </div>
                    <div>
                      <label htmlFor="lead-photo-url" className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Atau tempel URL foto / link Google Drive
                      </label>
                      <input
                        id="lead-photo-url"
                        type="text"
                        value={leadershipForm.photoUrl}
                        onChange={(e) =>
                          setLeadershipForm((prev) => ({ ...prev, photoUrl: e.target.value }))
                        }
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {principalPhotoError && (
                      <p className="text-xs text-rose-600 font-medium">{principalPhotoError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="lead-sec-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Judul Bagian di Beranda
                    </label>
                    <input
                      id="lead-sec-title"
                      type="text"
                      value={leadershipForm.sectionTitle}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, sectionTitle: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Kepala Sekolah &amp; Gelar
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      value={leadershipForm.principalName}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, principalName: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jabatan
                    </label>
                    <input
                      id="lead-title"
                      type="text"
                      value={leadershipForm.principalTitle}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, principalTitle: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="lead-nip" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP Kepala Sekolah (Opsional)
                    </label>
                    <input
                      id="lead-nip"
                      type="text"
                      value={leadershipForm.principalNip}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, principalNip: e.target.value }))
                      }
                      placeholder="Contoh: 19720514 199802 1 002"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Kata Sambutan */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Kata Sambutan Kepala Sekolah</h3>
                <div>
                  <label htmlFor="lead-greet-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Judul Kata Sambutan
                  </label>
                  <input
                    id="lead-greet-title"
                    type="text"
                    value={leadershipForm.greetingTitle}
                    onChange={(e) =>
                      setLeadershipForm((prev) => ({ ...prev, greetingTitle: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lead-greet-msg" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Isi Kata Sambutan
                  </label>
                  <textarea
                    id="lead-greet-msg"
                    rows={5}
                    value={leadershipForm.greetingMessage}
                    onChange={(e) =>
                      setLeadershipForm((prev) => ({ ...prev, greetingMessage: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Visi & Misi Sekolah */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Visi &amp; Misi Sekolah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="lead-vision-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Judul Visi
                    </label>
                    <input
                      id="lead-vision-title"
                      type="text"
                      value={leadershipForm.visionTitle}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, visionTitle: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-mission-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Judul Misi
                    </label>
                    <input
                      id="lead-mission-title"
                      type="text"
                      value={leadershipForm.missionTitle}
                      onChange={(e) =>
                        setLeadershipForm((prev) => ({ ...prev, missionTitle: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lead-vision-text" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Teks Visi Sekolah
                  </label>
                  <textarea
                    id="lead-vision-text"
                    rows={2}
                    value={leadershipForm.visionText}
                    onChange={(e) =>
                      setLeadershipForm((prev) => ({ ...prev, visionText: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="lead-mission-items" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Daftar Poin Misi Sekolah (Tulis 1 poin misi per baris)
                  </label>
                  <textarea
                    id="lead-mission-items"
                    rows={5}
                    value={missionText}
                    onChange={(e) => setMissionText(e.target.value)}
                    placeholder="Tulis setiap poin misi pada baris baru..."
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Simpan Profil &amp; Visi Misi
                </button>
              </div>
            </form>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Script Backend (`Code.gs`) &amp; 1-File Frontend Lengkap (`Index.html`)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pilih antara <strong>1 File Frontend Lengkap</strong> (gabungan HTML + CSS + JS siap pakai untuk Google Apps Script, Google Sites, maupun Blogger) atau <strong>Script Backend Google Apps Script</strong> yang memiliki fungsi <code>setupDatabase()</code> untuk membuat database Google Sheets otomatis.
                </p>
              </div>

              {/* Format Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setEmbedKind('single_frontend')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    embedKind === 'single_frontend'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">Frontend 1 File (Index.html)</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Gabungan lengkap HTML + CSS + JS. Siap untuk Apps Script &amp; Google Sites.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedKind('gas_backend')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    embedKind === 'gas_backend'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">Backend Script (Code.gs)</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Berisi fungsi <code>setupDatabase()</code> otomatis ke Google Sheets + login Admin.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedKind('snippet')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    embedKind === 'snippet'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">Cuplikan HTML Blogger</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tanpa tag <code>&lt;html&gt;</code> untuk Postingan/Halaman/Gadget Blogger.
                  </p>
                </button>
              </div>

              {/* Optional Public Image URL Overrides */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-800">
                  Opsional: URL Gambar Publik untuk Google Sites / Blogger / Apps Script
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL Foto Background Hero (Mendukung Google Drive)
                    </label>
                    <input
                      type="text"
                      value={embedHeroBgOverride}
                      onChange={(e) => setEmbedHeroBgOverride(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL Logo Sekolah (Opsional)
                    </label>
                    <input
                      type="text"
                      value={embedLogoOverride}
                      onChange={(e) => setEmbedLogoOverride(e.target.value)}
                      placeholder="https://blogger.googleusercontent.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions + Code Preview */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmbedCode}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  >
                    {copiedEmbed ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>Salin Kode Lengkap</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOutputFile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>
                      Unduh {embedKind === 'gas_backend' ? 'Code.gs' : 'Index.html'}
                    </span>
                  </button>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {generatedOutputCode.length.toLocaleString('id-ID')} karakter
                </span>
              </div>

              <textarea
                readOnly
                value={generatedOutputCode}
                onFocus={(e) => e.target.select()}
                rows={10}
                aria-label="Kode lengkap siap salin"
                className="w-full p-3.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Quick Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 mb-1">1. Setup Backend Google Apps Script:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Buka <strong>script.google.com</strong> &rarr; Proyek Baru.</li>
                    <li>Tempel <strong>Backend Script (Code.gs)</strong> ke file <code>Code.gs</code>.</li>
                    <li>Buat file HTML bernama <code>Index</code>, tempel <strong>Frontend 1 File</strong>.</li>
                    <li>Jalankan fungsi <code>setupDatabase</code> sekali, lalu <strong>Deploy &rarr; Web App</strong>.</li>
                  </ol>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <p className="font-bold text-slate-900 mb-1">2. Pasang di Google Sites / Blogger:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Di <strong>Google Sites</strong>: Sisipkan &rarr; Sematkan URL Web App (atau Sematkan Kode HTML).</li>
                    <li>Di <strong>Blogger</strong>: Gunakan <strong>Cuplikan HTML</strong> di Tampilan HTML halaman/postingan, atau sematkan <code>&lt;iframe&gt;</code> URL Web App.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Akses Admin Terverifikasi Google
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 rounded-md">
                        Aktif
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-700 break-all">
                      Akun aktif: <strong>{adminEmail || PRIMARY_ADMIN_EMAIL}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-3 border-t border-emerald-200/70">
                  <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Database portal terhubung ke <strong>Cloud Firestore permanen</strong>. Semua perubahan pada beranda, profil kepala sekolah, visi misi, tentang sekolah, dan layanan digital otomatis tersimpan permanen di server cloud dan tidak akan kembali ke data awal saat halaman dimuat ulang.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cadangkan &amp; Pulihkan Konfigurasi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simpan salinan konfigurasi portal ke berkas JSON atau muat ulang dari cadangan sebelumnya untuk disimpan permanen ke database.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    <span>Export Konfigurasi (JSON)</span>
                  </button>

                  <input
                    ref={importFileRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    <span>Import Konfigurasi (JSON)</span>
                  </button>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100">
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-rose-900">Kembalikan Konten Portal ke Awal</h4>
                      <p className="text-xs text-rose-800/80 mt-1 leading-relaxed">
                        Mengembalikan seluruh konten di database ke pengaturan bawaan (8 layanan default, logo, foto gedung sekolah, profil kepala sekolah default, dan tata letak 4 kolom).
                      </p>

                      {confirmReset ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-rose-900">
                            Yakin ingin mereset semua pengaturan?
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onResetDefaults();
                              setConfirmReset(false);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                          >
                            Ya, Reset Sekarang
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reset ke Pengaturan Awal</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
