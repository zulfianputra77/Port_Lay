import React from 'react';
import { Code2, LayoutGrid, LogOut, Plus, ShieldCheck, Sliders, UserCheck } from 'lucide-react';

interface AdminBarProps {
  totalServices: number;
  visibleServices: number;
  onAddService: () => void;
  onOpenSettings: (tab: 'layout' | 'header' | 'leadership' | 'security' | 'embed') => void;
  onExitAdmin: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  totalServices,
  visibleServices,
  onAddService,
  onOpenSettings,
  onExitAdmin,
}) => {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mode Admin Aktif</p>
            <p className="text-xs text-slate-300 tabular-nums">
              {visibleServices} dari {totalServices} layanan ditampilkan · Tersimpan di database server
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddService}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Layanan</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings('leadership')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <UserCheck className="w-4 h-4 text-slate-300" aria-hidden="true" />
            <span>Kepala Sekolah &amp; Visi Misi</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings('header')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Sliders className="w-4 h-4 text-slate-300" aria-hidden="true" />
            <span>Hero &amp; Header</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings('layout')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <LayoutGrid className="w-4 h-4 text-slate-300" aria-hidden="true" />
            <span>Tata Letak</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings('embed')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Code2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            <span>Embed &amp; Script</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings('security')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <ShieldCheck className="w-4 h-4 text-slate-300" aria-hidden="true" />
            <span>Akses &amp; Backup</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-200 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
