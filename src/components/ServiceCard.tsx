import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CardStyle, GlobalLinkTarget, ServiceItem } from '../types';
import { ServiceIcon } from '../utils/iconRegistry';
import { isValidUrl } from '../utils/storage';

interface ServiceCardProps {
  service: ServiceItem;
  index: number;
  totalCount: number;
  cardStyle: CardStyle;
  globalLinkTarget: GlobalLinkTarget;
  isAdminMode: boolean;
  isDragging?: boolean;
  onEmptyLinkClick: (service: ServiceItem) => void;
  onEdit: (service: ServiceItem) => void;
  onDelete: (serviceId: string) => void;
  onToggleVisibility: (serviceId: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  index,
  totalCount,
  cardStyle,
  globalLinkTarget,
  isAdminMode,
  isDragging = false,
  onEmptyLinkClick,
  onEdit,
  onDelete,
  onToggleVisibility,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const hasValidUrl = isValidUrl(service.url);
  const resolvedTarget =
    service.linkTarget === 'global' ? globalLinkTarget : service.linkTarget;
  const openInNewTab = resolvedTarget === 'new_tab';

  const cardInnerContent = () => {
    if (cardStyle === 'horizontal') {
      return (
        <div className="flex items-start gap-4 h-full">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: service.badgeColor }}
          >
            <ServiceIcon
              iconName={service.iconName}
              customIconUrl={service.customIconUrl}
              className="w-6 h-6 text-white"
              alt={service.name}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col h-full">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {service.name}
            </h3>
            {service.subtitle && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {service.subtitle}
              </p>
            )}
            {service.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2 flex-1">
                {service.description}
              </p>
            )}
            <div className="mt-3 pt-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                <span>Buka</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
              {hasValidUrl && openInNewTab && !isAdminMode && (
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      );
    }

    if (cardStyle === 'minimal') {
      return (
        <div className="flex items-center justify-between gap-3.5 h-full">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: service.badgeColor }}
            >
              <ServiceIcon
                iconName={service.iconName}
                customIconUrl={service.customIconUrl}
                className="w-5 h-5 text-white"
                alt={service.name}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {service.name}
              </h3>
              {service.subtitle && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {service.subtitle}
                </p>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-sky-400 group-hover:text-blue-700 dark:group-hover:text-sky-300 shrink-0 whitespace-nowrap">
            <span>Buka</span>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      );
    }

    // Default: vertical
    return (
      <div className="flex flex-col h-full">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: service.badgeColor }}
        >
          <ServiceIcon
            iconName={service.iconName}
            customIconUrl={service.customIconUrl}
            className="w-6 h-6 text-white"
            alt={service.name}
          />
        </div>

        <div className="mt-5 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
            {service.name}
          </h3>
          {service.subtitle && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {service.subtitle}
            </p>
          )}
          {service.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
            <span>Buka</span>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
          {hasValidUrl && openInNewTab && !isAdminMode && (
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          )}
        </div>
      </div>
    );
  };

  // Visitor Mode: Interactive Link or Toast-trigger Button
  if (!isAdminMode) {
    const baseCardClasses = `group block w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 hover:-translate-y-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
      cardStyle === 'minimal' ? 'p-4 sm:p-5' : 'p-6'
    }`;

    if (hasValidUrl) {
      return (
        <a
          href={service.url.trim()}
          target={openInNewTab ? '_blank' : '_self'}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          className={baseCardClasses}
        >
          {cardInnerContent()}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onEmptyLinkClick(service)}
        className={baseCardClasses}
      >
        {cardInnerContent()}
      </button>
    );
  }

  // Admin Mode Card Wrapper with Controls
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all duration-200 ${
        cardStyle === 'minimal' ? 'p-4 sm:p-5' : 'p-6'
      } ${
        service.visible
          ? 'border-slate-200/90 dark:border-slate-800'
          : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 opacity-75'
      } ${isDragging ? 'ring-2 ring-blue-500 scale-[0.98]' : ''}`}
    >
      {/* Top Admin Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
          <GripVertical
            className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium tabular-nums">#{index + 1}</span>
          <span aria-hidden="true">·</span>
          <span className={`truncate ${hasValidUrl ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {hasValidUrl ? 'Tautan aktif' : 'Link kosong'}
          </span>
          {!service.visible && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">Tersembunyi</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Geser maju"
            aria-label={`Geser ${service.name} maju`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === totalCount - 1}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Geser mundur"
            aria-label={`Geser ${service.name} mundur`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleVisibility(service.id)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={service.visible ? 'Sembunyikan kartu' : 'Tampilkan kartu'}
            aria-label={service.visible ? `Sembunyikan ${service.name}` : `Tampilkan ${service.name}`}
          >
            {service.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Card Body Preview */}
      <div className="flex-1">{cardInnerContent()}</div>

      {/* Bottom Admin Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {confirmingDelete ? (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Hapus layanan ini?</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => onDelete(service.id)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(service)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/70 rounded-xl transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/70 rounded-xl transition-colors"
              aria-label={`Hapus ${service.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hapus</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
