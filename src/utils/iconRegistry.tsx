import React, { useState } from 'react';
import {
  Activity,
  Archive,
  Award,
  BarChart2,
  Bell,
  Bookmark,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  Database,
  Download,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Headphones,
  HelpCircle,
  Home,
  Key,
  Laptop,
  Layers,
  Library,
  LineChart,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Monitor,
  NotebookPen,
  PieChart,
  Printer,
  QrCode,
  School,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Table,
  Target,
  TrendingUp,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  keywords: string;
  component: LucideIcon;
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'Layers', label: 'Lapisan / Terpadu', keywords: 'layers stack silat terpadu sistem', component: Layers },
  { name: 'BookOpen', label: 'Buku Terbuka', keywords: 'book open tamu baca buku', component: BookOpen },
  { name: 'BarChart2', label: 'Grafik Batang', keywords: 'bar chart survei statistik data', component: BarChart2 },
  { name: 'CalendarCheck', label: 'Kalender Cuti', keywords: 'calendar check cuti izin jadwal', component: CalendarCheck },
  { name: 'UserCheck', label: 'Kehadiran', keywords: 'user check absensi hadir siswa guru', component: UserCheck },
  { name: 'ClipboardList', label: 'Agenda / Daftar', keywords: 'clipboard list agenda siakad kelas', component: ClipboardList },
  { name: 'ShieldCheck', label: 'Perisai / Konseling', keywords: 'shield check sp3k prestasi aman', component: ShieldCheck },
  { name: 'Activity', label: 'Aktivitas / Tracking', keywords: 'activity tracking pulse monitor', component: Activity },
  { name: 'GraduationCap', label: 'Pendidikan', keywords: 'graduation cap sekolah lulus akademik', component: GraduationCap },
  { name: 'School', label: 'Gedung Sekolah', keywords: 'school gedung sekolah kampus', component: School },
  { name: 'Users', label: 'Pengguna / Komunitas', keywords: 'users siswa guru staf komunitas', component: Users },
  { name: 'UserPlus', label: 'Pendaftaran', keywords: 'user plus ppdb daftar baru', component: UserPlus },
  { name: 'FileText', label: 'Dokumen / Surat', keywords: 'file text surat dokumen arsip', component: FileText },
  { name: 'FolderOpen', label: 'Berkas', keywords: 'folder open berkas direktori', component: FolderOpen },
  { name: 'Award', label: 'Prestasi', keywords: 'award piala prestasi penghargaan', component: Award },
  { name: 'Star', label: 'Bintang', keywords: 'star unggulan favorit rating', component: Star },
  { name: 'Bell', label: 'Notifikasi', keywords: 'bell pengumuman info pengingat', component: Bell },
  { name: 'Megaphone', label: 'Pengumuman', keywords: 'megaphone siaran pengumuman berita', component: Megaphone },
  { name: 'Mail', label: 'Surel / Pesan', keywords: 'mail email surat kontak', component: Mail },
  { name: 'MessageSquare', label: 'Konsultasi / Chat', keywords: 'message chat konseling diskusi', component: MessageSquare },
  { name: 'Globe', label: 'Portal Web', keywords: 'globe web internet situs', component: Globe },
  { name: 'Compass', label: 'Panduan', keywords: 'compass arah panduan navigasi', component: Compass },
  { name: 'Database', label: 'Basis Data', keywords: 'database dapodik server data', component: Database },
  { name: 'Search', label: 'Pencarian', keywords: 'search cari lacak telusur', component: Search },
  { name: 'CheckCircle2', label: 'Verifikasi', keywords: 'check circle verifikasi selesai', component: CheckCircle2 },
  { name: 'CheckSquare', label: 'Tugas / Ceklis', keywords: 'check square tugas evaluasi', component: CheckSquare },
  { name: 'Clock', label: 'Waktu / Jam', keywords: 'clock jam waktu jadwal', component: Clock },
  { name: 'Calendar', label: 'Kalender', keywords: 'calendar tanggal agenda', component: Calendar },
  { name: 'Briefcase', label: 'Kepegawaian', keywords: 'briefcase kerja pegawai guru', component: Briefcase },
  { name: 'Building2', label: 'Instansi', keywords: 'building kantor gedung dinas', component: Building2 },
  { name: 'CreditCard', label: 'Kartu Pelajar / Bayar', keywords: 'credit card kartu pembayaran', component: CreditCard },
  { name: 'Wallet', label: 'Keuangan / BOS', keywords: 'wallet keuangan dana bos kas', component: Wallet },
  { name: 'Download', label: 'Unduh Berkas', keywords: 'download unduh materi formulir', component: Download },
  { name: 'Upload', label: 'Unggah Berkas', keywords: 'upload unggah kirim berkas', component: Upload },
  { name: 'Headphones', label: 'Pusat Bantuan', keywords: 'headphones layanan bantuan support', component: Headphones },
  { name: 'HelpCircle', label: 'FAQ / Bantuan', keywords: 'help tanya informasi panduan', component: HelpCircle },
  { name: 'Home', label: 'Beranda', keywords: 'home beranda utama', component: Home },
  { name: 'Key', label: 'Akses / Token', keywords: 'key kunci akses login', component: Key },
  { name: 'Lock', label: 'Keamanan', keywords: 'lock keamanan privat', component: Lock },
  { name: 'Laptop', label: 'Ujian / CBT', keywords: 'laptop komputer ujian cbt daring', component: Laptop },
  { name: 'Monitor', label: 'Sistem Informasi', keywords: 'monitor layar dashboard', component: Monitor },
  { name: 'Library', label: 'Perpustakaan', keywords: 'library perpustakaan buku literasi', component: Library },
  { name: 'BookMarked', label: 'Kurikulum / Modul', keywords: 'book marked modul ajar kurikulum', component: BookMarked },
  { name: 'Bookmark', label: 'Penanda', keywords: 'bookmark simpan arsip', component: Bookmark },
  { name: 'NotebookPen', label: 'Jurnal / Catatan', keywords: 'notebook pen jurnal mengajar catatan', component: NotebookPen },
  { name: 'LineChart', label: 'Tren Nilai', keywords: 'line chart grafik nilai rapor', component: LineChart },
  { name: 'PieChart', label: 'Persentase', keywords: 'pie chart diagram statistik', component: PieChart },
  { name: 'TrendingUp', label: 'Peningkatan', keywords: 'trending up kinerja mutu', component: TrendingUp },
  { name: 'Table', label: 'Rekap Tabel', keywords: 'table spreadsheet rekap data', component: Table },
  { name: 'MapPin', label: 'Lokasi', keywords: 'map pin lokasi peta sekolah', component: MapPin },
  { name: 'Printer', label: 'Cetak Dokumen', keywords: 'printer cetak rapor surat', component: Printer },
  { name: 'QrCode', label: 'Kode QR', keywords: 'qr code scan presensi validasi', component: QrCode },
  { name: 'Send', label: 'Kirim Layanan', keywords: 'send kirim pengajuan', component: Send },
  { name: 'Settings', label: 'Pengaturan', keywords: 'settings pengaturan konfigurasi', component: Settings },
  { name: 'Target', label: 'Sasaran / Kinerja', keywords: 'target sasaran skp kinerja', component: Target },
  { name: 'Video', label: 'Pembelajaran Video', keywords: 'video kelas daring zoom', component: Video },
  { name: 'Wrench', label: 'Sarpras / Perbaikan', keywords: 'wrench sarpras fasilitas perbaikan', component: Wrench },
  { name: 'Zap', label: 'Akses Cepat', keywords: 'zap cepat kilat otomatis', component: Zap },
  { name: 'Archive', label: 'Arsip Sekolah', keywords: 'archive arsip dokumen lama', component: Archive },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((item) => [item.name, item.component])
);

interface ServiceIconProps {
  iconName: string;
  customIconUrl?: string;
  className?: string;
  alt?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({
  iconName,
  customIconUrl,
  className = 'w-6 h-6 text-white',
  alt = 'Ikon layanan',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (customIconUrl && !imgFailed) {
    return (
      <img
        src={customIconUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-7 h-7 object-contain rounded"
      />
    );
  }

  const IconComponent = ICON_MAP[iconName] || Layers;
  return <IconComponent className={className} aria-hidden="true" />;
};
