import React from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { AboutInfo, SchoolInfo } from '../types';

interface AboutSectionProps {
  school: SchoolInfo;
  about: AboutInfo;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ school, about }) => {
  return (
    <section
      id="tentang"
      className="mt-16 pt-12 border-t border-slate-200/80 scroll-mt-24"
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight text-balance">
              {about.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {about.description}
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-10">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Alamat Sekolah</p>
                <p className="text-sm text-slate-600 mt-0.5">{about.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Jam Layanan</p>
                <p className="text-sm text-slate-600 mt-0.5">{about.serviceHours}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Surel Resmi</p>
                <p className="text-sm text-slate-600 mt-0.5">{about.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Telepon</p>
                <p className="text-sm text-slate-600 mt-0.5 tabular-nums">{about.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {school.name}. Seluruh hak cipta dilindungi.
        </p>
        <p>{school.subtitle}</p>
      </footer>
    </section>
  );
};
