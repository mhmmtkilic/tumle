/** Clash Royale tarzı arayüz renkleri: butonlar ve paneller burada tanımlanır */

/** Tüm butonların ve panellerin dış çizgisi */
export const OUTLINE = '#1B2238';

export type Skin = 'yellow' | 'blue' | 'green' | 'red' | 'gray';

export interface SkinColors {
  /** Yüz degradesi üst/alt */
  top: string;
  bottom: string;
  /** Yüzün altındaki koyu gövde (derinlik) */
  base: string;
  text: string;
  /** Yazının altındaki koyu kontur */
  textShadow: string;
}

export const SKINS: Record<Skin, SkinColors> = {
  yellow: { top: '#FFE36B', bottom: '#FFB21E', base: '#B9700A', text: '#FFFFFF', textShadow: '#8A4E00' },
  blue: { top: '#7FD0FF', bottom: '#2E8CF0', base: '#1A5AAE', text: '#FFFFFF', textShadow: '#123E7A' },
  green: { top: '#9BEA62', bottom: '#43B52A', base: '#287A17', text: '#FFFFFF', textShadow: '#1B5A0E' },
  red: { top: '#FF8A7A', bottom: '#E8413A', base: '#9E2420', text: '#FFFFFF', textShadow: '#6E1614' },
  gray: { top: '#D8DDE6', bottom: '#A9B1BF', base: '#6F7887', text: '#F4F6FA', textShadow: '#545C69' },
};

/** Panel (bilgi kutusu) renkleri: koyu lacivert, üstte açık şerit */
export const PANEL = {
  top: '#3B5B92',
  bottom: '#24406E',
  stroke: '#5E83C0',
  text: '#FFFFFF',
  subtext: '#C9D8F2',
} as const;
