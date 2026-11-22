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
  fillOpacity?: number;
  strokeOpacity?: number;
  /** Dikey degrade dolgu [üst, alt]; `fill` yerine geçer (hacim/ışık verir) */
  grad?: [string, string];
  /** İç detay (pencere çerçevesi, kiremit çizgisi…): koyu kontur ve gölge almaz */
  detail?: boolean;
  /** Parlak yansıma: konturu yok, yarı saydam beyaz */
  shine?: boolean;
}

/** Konturu çizilen gövde katmanları (detay ve parlama hariç) */
export function isSolid(l: Layer): boolean {
  return !l.shine && !l.detail;
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
    { d: gear(24, 24, 20, 15, 8), grad: ['#F4F7FC', '#9AA5B8'] },
    { circle: [24, 24, 11], stroke: '#8792A6', sw: 2, detail: true },
    { circle: [24, 24, 7], grad: ['#7D889E', '#4A5468'] },
    { circle: [22, 22, 2.2], fill: '#FFFFFF', detail: true },
    { d: 'M14 11a14 14 0 0 1 20 0l-3 3a10 10 0 0 0-14 0z', shine: true },
  ],
  trophy: [
    { d: 'M13 11H7c0 8 4 12 9 13', stroke: GOLD_DARK, sw: 4 },
    { d: 'M35 11h6c0 8-4 12-9 13', stroke: GOLD_DARK, sw: 4 },
    { d: 'M12 5h24v12c0 9-5 14-12 14S12 26 12 17z', grad: ['#FFF08A', '#F2A91B'] },
    { d: 'M12 5h24v3H12z', fill: '#E39A12', detail: true },
    { d: 'M21 30h6v6h-6z', grad: ['#F0B12A', '#C47A0C'] },
    { d: 'M16 35h16v3H16z', grad: ['#F2C04A', '#C47A0C'] },
    { d: 'M11 38h26v7H11z', grad: ['#9A6332', '#5E3A18'] },
    { d: 'M18 40h12v3H18z', fill: '#FFD45A', detail: true },
    { d: 'M24 10.5l2 4.2 4.6.6-3.4 3.2.9 4.6-4.1-2.3-4.1 2.3.9-4.6-3.4-3.2 4.6-.6z', fill: '#FFF7CF', detail: true },
    { d: 'M15 9h4v9c0 4 1 7 3 9-5-1-7-5-7-10z', shine: true },
  ],
  bag: [
    { d: 'M17 17v-5a7 7 0 0 1 14 0v5', stroke: '#B5302A', sw: 4 },
    { d: 'M8 16h32l-2 27H10z', grad: ['#FF7E6E', '#D3302A'] },
    { d: 'M9 16h30l-.3 4H9.3z', fill: '#B5302A', fillOpacity: 0.5, detail: true },
    { circle: [17, 21, 1.8], fill: '#6E1614', detail: true },
    { circle: [31, 21, 1.8], fill: '#6E1614', detail: true },
    { circle: [24, 32, 7.5], grad: ['#FFE680', '#F2A91B'] },
    { circle: [24, 32, 4.6], stroke: '#C97A0C', sw: 1.6, detail: true },
    { d: 'M11 20h6l-1 13h-4z', shine: true },
    { circle: [21.5, 29.5, 1.8], shine: true },
  ],
  house: [
    { d: 'M31 8h7v14h-7z', grad: ['#E0584A', '#A8302A'] },
    { d: 'M29.5 5h10v4.5h-10z', grad: ['#9AA3B6', '#5E667A'] },
    { d: 'M9 22h30v21H9z', grad: ['#FFF7DE', '#EFCB86'] },
    { d: 'M33 23h6v20h-6z', fill: '#B4782E', fillOpacity: 0.2, detail: true },
    { rect: [27, 27, 9, 8.5, 1.5], grad: ['#C8F4FF', '#4AB0EC'] },
    { d: 'M31.5 27.5v7.5M27.5 31.2h8', stroke: '#FFFFFF', sw: 1.8, detail: true },
    { d: 'M13 43V33a5 5 0 0 1 10 0v10z', grad: ['#C97B40', '#874420'] },
    { circle: [20.5, 38.5, 1.4], fill: GOLD, detail: true },
    { d: 'M2 26 24 5l22 21z', grad: ['#FF8D6B', '#D5352B'] },
    { d: 'M15.5 15h17M10.5 20h27', stroke: '#A8241E', strokeOpacity: 0.45, sw: 1.8, detail: true },
    { d: 'M4 42c5-3 35-3 40 0v3H4z', grad: ['#8BE64F', '#3FA52A'] },
    { d: 'M10 22 24 9l3 2.8-14 12.5z', shine: true },
    { d: 'M11 25h2.5v9H11z', shine: true },
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
    { d: 'M5 15l11 9 8-15 8 15 11-9-4 21H9z', grad: ['#FFF08A', '#F2A91B'] },
    { d: 'M9 34h30v8H9z', grad: ['#F2B12A', '#C47A0C'] },
    { circle: [16, 38, 1.6], fill: '#FFF2B0', detail: true },
    { circle: [32, 38, 1.6], fill: '#FFF2B0', detail: true },
    { d: 'M21.5 38h5', stroke: '#FFF2B0', sw: 2.4, detail: true },
    { circle: [5, 14, 3.8], grad: ['#FF9A90', '#D8302B'] },
    { circle: [24, 8, 3.8], grad: ['#FF9A90', '#D8302B'] },
    { circle: [43, 14, 3.8], grad: ['#FF9A90', '#D8302B'] },
    { d: 'M24 23l4.5 5L24 33l-4.5-5z', grad: ['#9FE3FF', '#2E8CF0'] },
    { d: 'M11 21l5 4-3 8h-3z', shine: true },
    { circle: [23, 6.8, 1.3], shine: true },
  ],
  trash: [
    { d: 'M19 5h10v6H19z', fill: SILVER_DARK },
    { d: 'M11 17h26l-3 27H14z', fill: SILVER },
    { d: 'M7 11h34v7H7z', fill: SILVER_DARK },
    { d: 'M19 23v15M24 23v15M29 23v15', stroke: SILVER_DARK, sw: 3 },
    { d: 'M14 19h5l1 10h-5z', shine: true },
  ],
  /** Kilit: henüz açılmamış araç / içerik */
  lock: [
    { d: 'M15 22v-6a9 9 0 0 1 18 0v6', stroke: SILVER_DARK, sw: 5 },
    { rect: [9, 21, 30, 23, 5], grad: ['#FFE680', '#E08A12'] },
    { d: 'M24 28a3.2 3.2 0 0 1 1.8 5.8V38h-3.6v-4.2A3.2 3.2 0 0 1 24 28z', fill: '#7A4A0A', detail: true },
    { d: 'M12 24h5v8h-5z', shine: true },
  ],
    /** Geri Al: sola kıvrılan kalın ok (oyun aracı, Köşe Dükkanı / Malikane) */
  undo: [
    { d: 'M14 20h16a10 10 0 0 1 0 20H22', stroke: BLUE, sw: 7 },
    { d: 'M4 20 17 8v24z', fill: BLUE },
    { d: 'M8 19l7-6v5z', shine: true },
  ],
  /** Çekiç: tahtadan bir taşı kırar (oyun aracı, Gökdelen / Kruvaziyer) */
  hammer: [
    { d: 'M23 21l5 5-15 17a3.5 3.5 0 0 1-5-5z', fill: BROWN },
    { d: 'M14 13l12-9 18 18-9 12z', fill: SILVER },
    { d: 'M26 4l18 18-4 3L23 7z', fill: SILVER_DARK },
    { d: 'M17 14l8-6 3 3-8 6z', shine: true },
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
      .filter(isSolid)
      .map((l) =>
        geom(
          l,
          `transform="translate(0 ${dy})" fill="${l.fill || l.grad ? OUTLINE : 'none'}" stroke="${OUTLINE}" stroke-width="${(l.sw ?? 0) + OUTLINE_W}" stroke-linejoin="round" stroke-linecap="round"`
        )
      )
      .join('');
  const defs = layers
    .map((l, i) => (l.grad ? `<linearGradient id="${name}-g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l.grad[0]}"/><stop offset="1" stop-color="${l.grad[1]}"/></linearGradient>` : ''))
    .join('');
  const body = layers
    .map((l, i) =>
      l.shine
        ? ''
        : geom(
            l,
            `fill="${l.grad ? `url(#${name}-g${i})` : (l.fill ?? 'none')}" fill-opacity="${l.fillOpacity ?? 1}" stroke="${l.stroke ?? 'none'}" stroke-opacity="${l.strokeOpacity ?? 1}" stroke-width="${l.sw ?? 0}" stroke-linejoin="round" stroke-linecap="round"`
          )
    )
    .join('');
  const shine = layers
    .filter((l) => l.shine)
    .map((l) => geom(l, `fill="#FFFFFF" fill-opacity="0.45"`))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 54 57" width="${size}" height="${size * (57 / 54)}"><defs>${defs}</defs>${outline(SHADOW_DY)}${outline(0)}${body}${shine}</svg>`;
}
