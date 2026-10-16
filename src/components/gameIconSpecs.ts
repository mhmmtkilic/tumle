/*
 * Renkli oyun ikonlarının çizim tanımları (Clash Royale tarzı): her ikon kendi
 * renginde, kalın koyu konturlu, altta kabartma gölgesi, üstte parlak yansıma.
 * Saf veri — React'e bağlı değil: hem uygulama (icons.tsx, react-native-svg)
 * hem önizleme (scripts/preview-icons.mjs) aynı tanımdan çizer.
 *
 * Kutu: 48×48. Katman sırası: önce tüm katmanların koyu kontur gölgesi, sonra
 * renkli katmanlar, en son parlak yansımalar (`shine`).
 */

export const OUTLINE = '#1B2238';

export interface Layer {
  d?: string;
  circle?: [number, number, number];
  rect?: [number, number, number, number, number];
  /** Dolgu rengi (yoksa yalnız çizgi) */
  fill?: string;
  /** Çizgi rengi ve kalınlığı (açık uçlu şekiller: kulp, dalga, ok) */
  stroke?: string;
  sw?: number;
  /** Parlak yansıma: konturu yok, yarı saydam beyaz */
  shine?: boolean;
}

/** Dişli: dış ve iç yarıçap arasında dişli çokgen */
function gear(cx: number, cy: number, ro: number, ri: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / (teeth * 4);
  for (let i = 0; i < teeth * 4; i++) {
    const r = i % 4 === 0 || i % 4 === 1 ? ro : ri;
    const a = i * step - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

const WHITE = '#FFFFFF';
const GOLD = '#FFC531';
const GOLD_DARK = '#E08A12';
const RED = '#FF5A4E';
const RED_DARK = '#C8302B';
const BLUE = '#3FB2F5';
const GREEN = '#5BD43A';
const PURPLE = '#B05CFF';
const SILVER = '#D5DCE6';
const SILVER_DARK = '#8E99AB';
const CREAM = '#FFE9BF';
const BROWN = '#A0582C';
const ORANGE = '#FF9A3D';

export const ICON_SPECS = {
  back: [{ d: 'M26 7 6 24l20 17v-9.5h16v-15H26z', fill: WHITE }, { d: 'M24 12 12 22h14z', shine: true }],
  plus: [{ d: 'M19 6h10v13h13v10H29v13H19V29H6V19h13z', fill: WHITE }, { d: 'M20 8h8v4h-8z', shine: true }],
  minus: [{ d: 'M6 19h36v10H6z', fill: WHITE }, { d: 'M8 21h32v3H8z', shine: true }],
  check: [{ d: 'M5 25l8-8 8 8 15-15 8 8-23 23z', fill: GREEN }, { d: 'M7 25l6-6 6 6-2 2z', shine: true }],
  cross: [{ d: 'M11 4l13 13L37 4l7 7-13 13 13 13-7 7-13-13-13 13-7-7 13-13L4 11z', fill: RED }, { d: 'M11 7l5 5-3 3-5-5z', shine: true }],
  gear: [
    { d: gear(24, 24, 20, 15, 8), fill: SILVER },
    { circle: [24, 24, 7], fill: SILVER_DARK },
    { d: 'M14 11a14 14 0 0 1 20 0l-3 3a10 10 0 0 0-14 0z', shine: true },
  ],
  trophy: [
    { d: 'M13 11H7c0 8 4 12 9 13', stroke: GOLD, sw: 4 },
    { d: 'M35 11h6c0 8-4 12-9 13', stroke: GOLD, sw: 4 },
    { d: 'M12 6h24v11c0 9-5 14-12 14S12 26 12 17z', fill: GOLD },
    { d: 'M21 30h6v7h-6z', fill: GOLD_DARK },
    { d: 'M13 37h22v7H13z', fill: GOLD_DARK },
    { d: 'M15 9h5v9c0 4 1 7 3 9-5-1-8-5-8-10z', shine: true },
  ],
  bag: [
    { d: 'M17 17v-5a7 7 0 0 1 14 0v5', stroke: RED_DARK, sw: 4 },
    { d: 'M8 16h32l-2 27H10z', fill: RED },
    { d: 'M11 19h8l-1 9h-7z', shine: true },
  ],
  house: [
    { d: 'M32 9h6v12h-6z', fill: RED_DARK },
    { d: 'M10 21h28v22H10z', fill: CREAM },
    { d: 'M20 30h8v13h-8z', fill: BROWN },
    { d: 'M3 25 24 6l21 19z', fill: RED },
    { d: 'M12 20 24 10l4 3.5L14 22z', shine: true },
  ],
  speaker: [
    { d: 'M5 18h9l12-10v32L14 30H5z', fill: WHITE },
    { d: 'M32 17a9 9 0 0 1 0 14', stroke: BLUE, sw: 4 },
    { d: 'M37 11a16 16 0 0 1 0 26', stroke: BLUE, sw: 4 },
    { d: 'M7 20h6v4H7z', shine: true },
  ],
  speakerOff: [
    { d: 'M5 18h9l12-10v32L14 30H5z', fill: WHITE },
    { d: 'M31 18l12 12M43 18 31 30', stroke: RED, sw: 5 },
  ],
  music: [
    { d: 'M17 12 39 6v6l-22 6z', fill: PURPLE },
    { d: 'M17 12h5v22h-5zM34 7h5v21h-5z', fill: PURPLE },
    { circle: [14, 35, 7], fill: PURPLE },
    { circle: [31, 29, 7], fill: PURPLE },
    { circle: [12, 33, 2.5], shine: true },
  ],
  musicOff: [
    { d: 'M17 12 39 6v6l-22 6z', fill: PURPLE },
    { d: 'M17 12h5v22h-5zM34 7h5v21h-5z', fill: PURPLE },
    { circle: [14, 35, 7], fill: PURPLE },
    { circle: [31, 29, 7], fill: PURPLE },
    { d: 'M6 6l36 36', stroke: RED, sw: 5 },
  ],
  share: [
    { d: 'M14 24 34 13M14 24l20 11', stroke: WHITE, sw: 4 },
    { circle: [13, 24, 7], fill: GREEN },
    { circle: [35, 12, 7], fill: GREEN },
    { circle: [35, 36, 7], fill: GREEN },
    { circle: [33, 10, 2.5], shine: true },
  ],
  restart: [
    { d: 'M38 25a14 14 0 1 1-6-12', stroke: WHITE, sw: 6 },
    { d: 'M25 9 41 5l-3 16z', fill: WHITE },
  ],
  shuffle: [
    { d: 'M5 14h8c10 0 12 20 22 20h3M5 34h8c4 0 7-3 9-7M26 21c2-4 5-7 9-7h3', stroke: WHITE, sw: 5 },
    { d: 'M37 7l8 7-8 7z', fill: WHITE },
    { d: 'M37 27l8 7-8 7z', fill: WHITE },
  ],
  pencil: [
    { d: 'M33 5 43 15 18 40 8 30z', fill: GOLD },
    { d: 'M8 30l10 10-13 3z', fill: CREAM },
    { d: 'M5 39l4 4-5 1z', fill: OUTLINE },
    { d: 'M36 2l10 10-3 3-10-10z', fill: '#FF8FB1' },
    { d: 'M31 9l2 2-19 19-2-2z', shine: true },
  ],
  vibrate: [
    { rect: [15, 4, 18, 40, 4], fill: '#2E5DA8' },
    { rect: [18, 9, 12, 27, 2], fill: '#8FE1FF' },
    { d: 'M9 17v14M39 17v14M4 21v6M44 21v6', stroke: ORANGE, sw: 4 },
    { d: 'M19 10h4v10h-4z', shine: true },
  ],
  crown: [
    { d: 'M5 15l11 9 8-15 8 15 11-9-4 22H9z', fill: GOLD },
    { d: 'M9 35h30v7H9z', fill: GOLD_DARK },
    { circle: [5, 14, 3.5], fill: RED },
    { circle: [24, 8, 3.5], fill: RED },
    { circle: [43, 14, 3.5], fill: RED },
    { circle: [24, 29, 3.5], fill: BLUE },
    { d: 'M11 22l5 4-3 8h-3z', shine: true },
  ],
  trash: [
    { d: 'M19 5h10v6H19z', fill: SILVER_DARK },
    { d: 'M11 17h26l-3 27H14z', fill: SILVER },
    { d: 'M7 11h34v7H7z', fill: SILVER_DARK },
    { d: 'M19 23v15M24 23v15M29 23v15', stroke: SILVER_DARK, sw: 3 },
    { d: 'M14 19h5l1 10h-5z', shine: true },
  ],
} satisfies Record<string, Layer[]>;

export type IconName = keyof typeof ICON_SPECS;

/** Kontur kalınlığı ve alt gölge kayması (kutu biriminde) */
export const OUTLINE_W = 4;
export const SHADOW_DY = 2.5;

/** Tarayıcı önizlemesi için düz SVG metni (uygulama icons.tsx ile aynı katmanları çizer) */
export function iconSvg(name: IconName, size: number): string {
  const layers: Layer[] = ICON_SPECS[name];
  const geom = (l: Layer, attrs: string) =>
    l.circle
      ? `<circle cx="${l.circle[0]}" cy="${l.circle[1]}" r="${l.circle[2]}" ${attrs}/>`
      : l.rect
        ? `<rect x="${l.rect[0]}" y="${l.rect[1]}" width="${l.rect[2]}" height="${l.rect[3]}" rx="${l.rect[4]}" ${attrs}/>`
        : `<path d="${l.d}" ${attrs}/>`;
  const outline = (dy: number) =>
    layers
      .filter((l) => !l.shine)
      .map((l) =>
        geom(
          l,
          `transform="translate(0 ${dy})" fill="${l.fill ? OUTLINE : 'none'}" stroke="${OUTLINE}" stroke-width="${(l.sw ?? 0) + OUTLINE_W}" stroke-linejoin="round" stroke-linecap="round"`
        )
      )
      .join('');
  const body = layers
    .filter((l) => !l.shine)
    .map((l) => geom(l, `fill="${l.fill ?? 'none'}" stroke="${l.stroke ?? 'none'}" stroke-width="${l.sw ?? 0}" stroke-linejoin="round" stroke-linecap="round"`))
    .join('');
  const shine = layers
    .filter((l) => l.shine)
    .map((l) => geom(l, `fill="#FFFFFF" fill-opacity="0.45"`))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 54 57" width="${size}" height="${size * (57 / 54)}">${outline(SHADOW_DY)}${outline(0)}${body}${shine}</svg>`;
}
