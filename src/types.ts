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

export interface PrincipalProfileInfo {
  visible: boolean;
  sectionTitle: string;
  principalName: string;
  principalTitle: string;
  principalNip: string;
  photoUrl: string;
  greetingTitle: string;
  greetingMessage: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionItems: string[];
}

export interface AboutExtraItem {
  id: string;
  label: string;
  value: string;
}

export interface AboutInfo {
  title: string;
  description: string;
  address: string;
  email?: string;
  phone?: string;
  serviceHours: string;
  extraItems: AboutExtraItem[];
}

export interface LayoutSettings {
  columns: LayoutColumns;
  cardStyle: CardStyle;
  globalLinkTarget: GlobalLinkTarget;
}

export interface PortalConfig {
  school: SchoolInfo;
  hero: HeroInfo;
  leadership: PrincipalProfileInfo;
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
