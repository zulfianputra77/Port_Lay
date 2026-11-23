import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, RotateCcw, Search, Upload, X } from 'lucide-react';
import { PRESET_BADGE_COLORS } from '../data/defaultConfig';
import { CardLinkTarget, ServiceItem } from '../types';
import { ICON_OPTIONS, ServiceIcon } from '../utils/iconRegistry';
import { isValidUrl, normalizeUrl, processImageFileToDataUrl } from '../utils/storage';

interface ServiceEditorModalProps {
  isOpen: boolean;
  service: ServiceItem | null;
  onClose: () => void;
  onSave: (serviceData: Omit<ServiceItem, 'id'>, existingId?: string) => void;
}

const EMPTY_FORM: Omit<ServiceItem, 'id'> = {
  name: '',
  subtitle: '',
  description: '',
  badgeColor: '#1E40AF',
  iconName: 'Layers',
  customIconUrl: undefined,
  url: '',
  linkTarget: 'global',
  visible: true,
};

export const ServiceEditorModal: React.FC<ServiceEditorModalProps> = ({
  isOpen,
  service,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<ServiceItem, 'id'>>(EMPTY_FORM);
  const [iconQuery, setIconQuery] = useState('');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (service) {
        setForm({
          name: service.name,
          subtitle: service.subtitle,
          description: service.description,
          badgeColor: service.badgeColor,
          iconName: service.iconName,
          customIconUrl: service.customIconUrl,
          url: service.url,
          linkTarget: service.linkTarget,
          visible: service.visible,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setIconQuery('');
      setError('');
      setUploadError('');
    }
  }, [isOpen, service]);

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return ICON_OPTIONS;
    return ICON_OPTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [iconQuery]);

  if (!isOpen) return null;

  const handleCustomIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await processImageFileToDataUrl(file, 160);
      setForm((prev) => ({ ...prev, customIconUrl: dataUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal memproses gambar ikon.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError('Nama layanan wajib diisi.');
      return;
    }

    let finalUrl = form.url.trim();
    if (finalUrl) {
      const normalized = normalizeUrl(finalUrl);
      if (!isValidUrl(normalized)) {
        setError('Format URL tautan tidak valid. Gunakan format https://contoh.sch.id');
        return;
      }
      finalUrl = normalized;
    }

    onSave(
      {
        ...form,
        name: trimmedName,
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        url: finalUrl,
        customIconUrl: form.customIconUrl?.trim() || undefined,
      },
      service?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-editor-title"
    >
      <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 id="service-editor-title" className="text-lg font-bold text-slate-900">
              {service ? `Edit Layanan: ${service.name}` : 'Tambah Layanan Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              Atur informasi layanan, tautan tujuan, warna badge, dan ikon kartu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup editor layanan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Preview + Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <div>
                <label htmlFor="svc-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Layanan <span className="text-rose-600">*</span>
                </label>
                <input
                  id="svc-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    if (error) setError('');
                  }}
                  placeholder="Contoh: SIAKAD"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="svc-subtitle" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subjudul / Label
                </label>
                <input
                  id="svc-subtitle"
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Contoh: Sistem Agenda Kelas Digital"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="svc-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deskripsi Singkat
                </label>
                <textarea
                  id="svc-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan kegunaan layanan secara singkat..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 rounded-2xl border border-slate-200/80 p-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-3">Pratinjau Kartu</p>
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: form.badgeColor }}
                  >
                    <ServiceIcon
                      iconName={form.iconName}
                      customIconUrl={form.customIconUrl}
                      className="w-6 h-6 text-white"
                      alt={form.name || 'Pratinjau ikon'}
                    />
                  </div>
                  <h4 className="mt-4 text-base font-bold text-slate-900 truncate">
                    {form.name || 'Nama Layanan'}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                    {form.subtitle || 'Subjudul layanan'}
                  </p>
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {form.description || 'Deskripsi singkat layanan sekolah akan tampil di sini.'}
                  </p>
                </div>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Tampilkan di Portal Publik
                </span>
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm((prev) => ({ ...prev, visible: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* URL & Target */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-slate-100">
            <div className="md:col-span-8">
              <label htmlFor="svc-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Tujuan Layanan
              </label>
              <input
                id="svc-url"
                type="text"
                value={form.url}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, url: e.target.value }));
                  if (error) setError('');
                }}
                placeholder="https://contoh.sch.id/layanan (kosongkan jika belum tersedia)"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-4">
              <label htmlFor="svc-target" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Buka Tautan
              </label>
              <select
                id="svc-target"
                value={form.linkTarget}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, linkTarget: e.target.value as CardLinkTarget }))
                }
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="global">Ikuti Pengaturan Global</option>
                <option value="new_tab">Buka di Tab Baru</option>
                <option value="same_tab">Buka di Tab yang Sama</option>
              </select>
            </div>
          </div>

          {/* Badge Color Picker */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
              Warna Badge Ikon
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_BADGE_COLORS.map((preset) => {
                const isSelected = form.badgeColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, badgeColor: preset.hex }))}
                    title={preset.name}
                    aria-label={`Pilih warna ${preset.name}`}
                    className={`w-8 h-8 rounded-xl transition-transform ${
                      isSelected ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                );
              })}

              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <input
                  type="color"
                  value={form.badgeColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                  aria-label="Pemilih warna kustom"
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={form.badgeColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, badgeColor: e.target.value }))}
                  maxLength={7}
                  aria-label="Kode warna hex"
                  className="w-24 px-2.5 py-1.5 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-300 rounded-lg uppercase"
                />
              </div>
            </div>
          </div>

          {/* Icon Picker & Custom Upload */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Ikon Kartu ({ICON_OPTIONS.length} ikon tersedia)
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomIconUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Unggah Ikon Kustom</span>
                </button>
                {form.customIconUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, customIconUrl: undefined }))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Gunakan Ikon Bawaan</span>
                  </button>
                )}
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
            )}

            {form.customIconUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                <ImageIcon className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>Ikon gambar kustom sedang aktif dan menggantikan ikon vektor Lucide.</span>
              </div>
            )}

            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                placeholder="Cari ikon (misal: buku, absensi, grafik, surat, sekolah)..."
                className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {filteredIcons.map((item) => {
                const IconComp = item.component;
                const isSelected = !form.customIconUrl && form.iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={`${item.label} (${item.name})`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        iconName: item.name,
                        customIconUrl: undefined,
                      }))
                    }
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                    }`}
                    aria-label={`Pilih ikon ${item.label}`}
                  >
                    <IconComp className="w-5 h-5" aria-hidden="true" />
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-slate-500">
                  Tidak ada ikon yang cocok dengan kata kunci &ldquo;{iconQuery}&rdquo;.
                </div>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              {service ? 'Simpan Perubahan' : 'Tambahkan Layanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
