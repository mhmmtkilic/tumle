import { TextStyle, ViewStyle } from 'react-native';

/**
 * Tasarım dili: Clash Royale tarzı oyun arayüzü — gökyüzü zemini, kalın dış
 * çizgili lacivert paneller, parlak kalın butonlar (src/ui/game/), beyaz kalın
 * yazı. Tüm arayüz renk, yazı, boşluk ve köşe değerlerini buradan alır;
 * ekranlarda elle renk/boyut yazılmaz.
 */

/** Başlık / buton fontu: Baloo 2 ExtraBold — kalın, yuvarlak; Türkçe harfler ve ₺ tam (App'te yüklenir) */
export const GAME_FONT = 'Baloo2-ExtraBold';
/** Gövde metni: yuvarlak, kalın; oyun fontuyla uyumlu ama uzun metinde okunaklı */
export const BODY_FONT = 'Nunito-Bold';
export const BODY_FONT_HEAVY = 'Nunito-ExtraBold';

export const colors = {
  /** Ekran zemini (gökyüzü; arka plan bileşeni üstünü süsler) */
  background: '#4DA8F0',
  /** Panel yüzeyi: koyu lacivert */
  surface: '#24406E',
  /** Panelin üst açık şeridi ve iç kenarı */
  surfaceTop: '#3B5B92',
  surfaceStroke: '#5E83C0',
  /** Tüm panellerin, butonların ve yazı konturlarının koyu dış çizgisi */
  outline: '#1B2238',
  /** Panel üstündeki ikincil dolgu: çip, iz, boş çubuk */
  fill: 'rgba(255,255,255,0.12)',
  fillStrong: 'rgba(255,255,255,0.22)',
  separator: 'rgba(255,255,255,0.14)',

  label: '#FFFFFF',
  secondaryLabel: '#C9D8F2',
  tertiaryLabel: 'rgba(201,216,242,0.5)',

  /** Ana vurgu (para / ilerleme): lacivert üstünde parlak yeşil */
  accent: '#7CE24F',
  accentSoft: 'rgba(124,226,79,0.18)',
  /** Ödül, fiyat */
  gold: '#FFD43B',
  goldSoft: 'rgba(255,212,59,0.18)',
  destructive: '#FF6B5E',
  destructiveSoft: 'rgba(255,107,94,0.18)',
  onAccent: '#FFFFFF',

  /** Modal arkası karartma */
  scrim: 'rgba(12,22,48,0.6)',
  /** Koyu bilgi balonu (toast) */
  toast: 'rgba(27,34,56,0.94)',
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 } as const;

export const radius = { s: 8, m: 12, l: 16, xl: 22, pill: 999 } as const;

/** Koyu konturlu yazı gölgesi: gökyüzü ve panel üstünde okunaklılık */
export const textOutline: TextStyle = {
  textShadowColor: colors.outline,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 0.1,
};

/**
 * Metin stilleri. Başlıklar oyun fontuyla, gövde Nunito ile. Özel fontta
 * fontWeight verilmez (Android'de yedek fonta düşer); kalınlık font adında.
 */
export const type = {
  largeTitle: { fontFamily: GAME_FONT, fontSize: 34, ...textOutline },
  title1: { fontFamily: GAME_FONT, fontSize: 28, ...textOutline },
  title2: { fontFamily: GAME_FONT, fontSize: 22, ...textOutline },
  title3: { fontFamily: GAME_FONT, fontSize: 20, ...textOutline },
  headline: { fontFamily: GAME_FONT, fontSize: 18, ...textOutline },
  body: { fontFamily: BODY_FONT_HEAVY, fontSize: 16 },
  callout: { fontFamily: BODY_FONT, fontSize: 15 },
  subhead: { fontFamily: BODY_FONT, fontSize: 14 },
  footnote: { fontFamily: BODY_FONT, fontSize: 13 },
  caption: { fontFamily: BODY_FONT, fontSize: 12 },
  /** Küçük etiket başlığı (büyük harfe çevrilmez: JS'te i→I Türkçe'yi bozar) */
  overline: { fontFamily: BODY_FONT_HEAVY, fontSize: 12, letterSpacing: 0.3 },
} satisfies Record<string, TextStyle>;

/** Para gibi hizalı rakamlar */
export const numeric: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * Oyun paneli görünümü (kart, liste, diyalog): koyu dış çizgi, altta kalın
 * gölge kenarı, üstte açık şerit. `Panel` bileşeninin tek katmanlı karşılığı;
 * içeriği doğrudan dizilen kartlarda kullanılır.
 */
export const panelStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.l,
  borderWidth: 2.5,
  borderColor: colors.outline,
  borderBottomWidth: 6,
};
