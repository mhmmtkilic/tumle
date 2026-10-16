import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

/**
 * Avataaars (Pablo Stanley, getavataaars.com) parçaları — DiceBear portu üzerinden
 * SVG metni üretilir, react-native-svg'nin SvgXml'i ile çizilir.
 */

type SchemaProp = { items?: { enum?: string[] }; default?: string[] };
const P = (avataaars.schema.properties ?? {}) as Record<string, SchemaProp>;
const enumOf = (k: string) => P[k]?.items?.enum ?? [];
const colorsOf = (k: string) => P[k]?.default ?? [];

/** Parça listesindeki "yok" seçeneği (gözlük/sakal/saç için) */
export const NONE = 'none';

export interface AvatarConfig {
  top: string;
  hairColor: string;
  hatColor: string;
  accessories: string;
  accessoriesColor: string;
  facialHair: string;
  facialHairColor: string;
  eyebrows: string;
  eyes: string;
  mouth: string;
  skinColor: string;
  clothing: string;
  clothesColor: string;
  clothingGraphic: string;
  backgroundColor: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  top: 'shortFlat',
  hairColor: '2c1b18',
  hatColor: '25557c',
  accessories: NONE,
  accessoriesColor: '262e33',
  facialHair: NONE,
  facialHairColor: '2c1b18',
  eyebrows: 'defaultNatural',
  eyes: 'default',
  mouth: 'smile',
  skinColor: 'edb98a',
  clothing: 'hoodie',
  clothesColor: '4fb477',
  clothingGraphic: 'bear',
  backgroundColor: 'b1e2ff',
};

const HATS = ['hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04'];

/** Oyunun paletine uyan arkaplanlar + kıyafet rengine oyunun yeşili eklendi */
const BACKGROUNDS = ['b1e2ff', 'a7ffc4', 'ffdeb5', 'ffafb9', 'ffffb1', 'd9c8ff', 'e3eae4', 'f6b93b', '5fb6d9', 'ffffff'];

export type AvatarKey = keyof AvatarConfig;

export interface AvatarCategory {
  key: AvatarKey;
  label: string;
  kind: 'part' | 'color';
  options: string[];
  /** Küçük önizlemede yüze yakınlaştırılsın mı */
  zoom?: 'face' | 'body';
  /** Bu kategori ancak koşul sağlanınca listelenir (ör. şapka rengi yalnızca şapkada) */
  when?: (c: AvatarConfig) => boolean;
}

export const CATEGORIES: AvatarCategory[] = [
  { key: 'top', label: 'Saç', kind: 'part', options: [NONE, ...enumOf('top')] },
  { key: 'hairColor', label: 'Saç Rengi', kind: 'color', options: colorsOf('hairColor'), when: (c) => c.top !== NONE && !HATS.includes(c.top) },
  { key: 'hatColor', label: 'Şapka Rengi', kind: 'color', options: colorsOf('hatColor'), when: (c) => HATS.includes(c.top) },
  { key: 'eyes', label: 'Gözler', kind: 'part', options: enumOf('eyes'), zoom: 'face' },
  { key: 'eyebrows', label: 'Kaşlar', kind: 'part', options: enumOf('eyebrows'), zoom: 'face' },
  { key: 'mouth', label: 'Ağız', kind: 'part', options: enumOf('mouth'), zoom: 'face' },
  { key: 'facialHair', label: 'Sakal', kind: 'part', options: [NONE, ...enumOf('facialHair')], zoom: 'face' },
  { key: 'facialHairColor', label: 'Sakal Rengi', kind: 'color', options: colorsOf('facialHairColor'), when: (c) => c.facialHair !== NONE },
  { key: 'accessories', label: 'Gözlük', kind: 'part', options: [NONE, ...enumOf('accessories')], zoom: 'face' },
  { key: 'accessoriesColor', label: 'Gözlük Rengi', kind: 'color', options: colorsOf('accessoriesColor'), when: (c) => c.accessories !== NONE },
  { key: 'skinColor', label: 'Ten', kind: 'color', options: colorsOf('skinColor') },
  { key: 'clothing', label: 'Kıyafet', kind: 'part', options: enumOf('clothing'), zoom: 'body' },
  { key: 'clothesColor', label: 'Kıyafet Rengi', kind: 'color', options: ['4fb477', ...colorsOf('clothesColor')] },
  { key: 'clothingGraphic', label: 'Tişört Deseni', kind: 'part', options: enumOf('clothingGraphic'), zoom: 'body', when: (c) => c.clothing === 'graphicShirt' },
  { key: 'backgroundColor', label: 'Arkaplan', kind: 'color', options: BACKGROUNDS },
];

/** Kaydedilmiş/dışarıdan gelen veriyi bilinen değerlere süzer; bilinmeyen alan varsayılana döner */
export function sanitizeAvatar(raw: unknown): AvatarConfig {
  const out: AvatarConfig = { ...DEFAULT_AVATAR };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  for (const cat of CATEGORIES) {
    const v = r[cat.key];
    if (typeof v === 'string' && cat.options.includes(v)) out[cat.key] = v;
  }
  return out;
}

/** Rastgele avatar; `rnd` verilirse tekrarlanabilir (ör. sıralamadaki rakipler) */
export function randomAvatar(rnd: () => number = Math.random): AvatarConfig {
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const c = { ...DEFAULT_AVATAR };
  for (const cat of CATEGORIES) c[cat.key] = pick(cat.options);
  // Gözlük ve sakal her seferinde çıkmasın; ifade de çoğunlukla olumlu kalsın
  if (rnd() < 0.6) c.accessories = NONE;
  if (rnd() < 0.7) c.facialHair = NONE;
  if (rnd() < 0.6) c.mouth = pick(['smile', 'default', 'twinkle', 'tongue']);
  if (rnd() < 0.6) c.eyes = pick(['default', 'happy', 'wink', 'side']);
  return c;
}

const VIEWBOX = {
  face: '60 30 160 160',
  body: '70 140 140 140',
} as const;

const cache = new Map<string, string>();

/** Avatarın SVG metni; aynı yapılandırma tekrar istenince önbellekten gelir */
export function avatarSvg(c: AvatarConfig, zoom?: 'face' | 'body', bg = true): string {
  const cacheKey = `${JSON.stringify(c)}|${zoom ?? ''}|${bg}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const opt = (v: string) => (v === NONE ? [] : [v]);
  let svg = createAvatar(avataaars, {
    seed: 'tumle',
    style: ['default'],
    backgroundColor: bg ? [c.backgroundColor] : ['transparent'],
    top: opt(c.top) as never,
    topProbability: c.top === NONE ? 0 : 100,
    hairColor: [c.hairColor],
    hatColor: [c.hatColor],
    accessories: opt(c.accessories) as never,
    accessoriesProbability: c.accessories === NONE ? 0 : 100,
    accessoriesColor: [c.accessoriesColor],
    facialHair: opt(c.facialHair) as never,
    facialHairProbability: c.facialHair === NONE ? 0 : 100,
    facialHairColor: [c.facialHairColor],
    eyebrows: [c.eyebrows] as never,
    eyes: [c.eyes] as never,
    mouth: [c.mouth] as never,
    nose: ['default'],
    skinColor: [c.skinColor],
    clothing: [c.clothing] as never,
    clothesColor: [c.clothesColor],
    clothingGraphic: [c.clothingGraphic] as never,
  }).toString();

  // RDF metadata'sı SvgXml için gereksiz; ayrıştırmayı da hızlandırır
  svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/, '');
  if (zoom) svg = svg.replace('viewBox="0 0 280 280"', `viewBox="${VIEWBOX[zoom]}"`);

  if (cache.size > 400) cache.clear();
  cache.set(cacheKey, svg);
  return svg;
}
