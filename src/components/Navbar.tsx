import React, { useEffect, useState } from 'react';
import { Lock, LogOut, Menu, Shield, X } from 'lucide-react';
import { SchoolInfo } from '../types';

interface NavbarProps {
  school: SchoolInfo;
  isAdminMode: boolean;
  activeSection: 'beranda' | 'layanan' | 'tentang';
  onNavigate: (section: 'beranda' | 'layanan' | 'tentang') => void;
  onAdminClick: () => void;
  onExitAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  school,
  isAdminMode,
  activeSection,
  onNavigate,
  onAdminClick,
  onExitAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [school.logoUrl]);

  const handleNav = (section: 'beranda' | 'layanan' | 'tentang') => {
    setMobileMenuOpen(false);
    onNavigate(section);
  };

  const navItems: { id: 'beranda' | 'layanan' | 'tentang'; label: string }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'layanan', label: 'Layanan' },
    { id: 'tentang', label: 'Tentang' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
        {/* Brand Left Zone */}
        <button
          type="button"
          onClick={() => handleNav('beranda')}
          className="flex items-center gap-3 text-left min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl py-1 pr-2"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center shadow-xs">
            {school.logoUrl && !logoError ? (
              <img
                src={school.logoUrl}
                alt={`Logo ${school.name}`}
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield className="w-5 h-5 text-blue-700" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {school.name}
            </div>
            <div className="text-xs font-semibold text-blue-600 truncate">
              {school.subtitle}
            </div>
          </div>
        </button>

        {/* Desktop Navigation + Admin Action */}
        <div className="hidden md:flex items-center gap-8 shrink-0">
          <nav aria-label="Navigasi utama" className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {isAdminMode ? (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Keluar Mode Admin</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdminClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Lock className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {isAdminMode ? (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg whitespace-nowrap shrink-0"
              aria-label="Keluar Mode Admin"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdminClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
