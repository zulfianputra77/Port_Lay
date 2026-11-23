export type LayoutColumns = 2 | 3 | 4;

export type CardStyle = 'vertical' | 'horizontal' | 'minimal';

export type GlobalLinkTarget = 'new_tab' | 'same_tab';

export type CardLinkTarget = 'global' | 'new_tab' | 'same_tab';

export interface ServiceItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badgeColor: string;
  iconName: string;
  customIconUrl?: string;
  url: string;
  linkTarget: CardLinkTarget;
  visible: boolean;
}

export interface SchoolInfo {
  name: string;
  subtitle: string;
  logoUrl: string;
}

export interface HeroInfo {
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  backgroundUrl: string;
  backgroundImages: string[];
  slideIntervalSeconds: number;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

export interface AboutInfo {
  title: string;
  description: string;
  address: string;
  email: string;
  phone: string;
  serviceHours: string;
}

export interface LayoutSettings {
  columns: LayoutColumns;
  cardStyle: CardStyle;
  globalLinkTarget: GlobalLinkTarget;
}

export interface PortalConfig {
  school: SchoolInfo;
  hero: HeroInfo;
  about: AboutInfo;
  layout: LayoutSettings;
  services: ServiceItem[];
  adminPin: string;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
