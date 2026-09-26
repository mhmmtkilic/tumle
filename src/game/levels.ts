export type TileKind = 'coin' | 'note' | 'gold' | 'gem' | 'crypto' | 'epic';

export interface LevelDef {
  name: string;
  short: string;
  kind: TileKind;
  bg: string;
}

// 24 seviyelik dönüşüm zinciri (1 tabanlı erişim için index 0 boş)
export const LEVELS: LevelDef[] = [
  { name: '', short: '', kind: 'coin', bg: '' },
  { name: '1 Kuruş', short: '1kr', kind: 'coin', bg: '#F3EDE6' },
  { name: '10 Kuruş', short: '10kr', kind: 'coin', bg: '#F3EEE0' },
  { name: '50 Kuruş', short: '50kr', kind: 'coin', bg: '#EFEFE8' },
  { name: '1 TL', short: '1tl', kind: 'coin', bg: '#EAEEF0' },
  { name: '10 TL', short: '10tl', kind: 'note', bg: '#F7E7E7' },
  { name: '50 TL', short: '50tl', kind: 'note', bg: '#F8EEE1' },
  { name: '200 TL', short: '200tl', kind: 'note', bg: '#EEE9F6' },
  { name: '100 Dolar', short: '100usd', kind: 'note', bg: '#E6F0E9' },
  { name: '1 Gr Altın', short: '1gr', kind: 'gold', bg: '#FBF3DC' },
  { name: 'Çeyrek Altın', short: 'ceyrek', kind: 'gold', bg: '#FBF1D4' },
  { name: 'Tam Altın', short: 'tam', kind: 'gold', bg: '#FAEECB' },
  { name: 'Külçe Altın', short: 'kulce', kind: 'gold', bg: '#F9E9B8' },
  { name: 'Yeşim Taşı', short: 'yesim', kind: 'gem', bg: '#E3F0DF' },
  { name: 'Zümrüt', short: 'zumrut', kind: 'gem', bg: '#DCEFE3' },
  { name: 'Yakut', short: 'yakut', kind: 'gem', bg: '#F8E2E2' },
  { name: 'Safir', short: 'safir', kind: 'gem', bg: '#E1E8F7' },
  { name: 'Elmas', short: 'elmas', kind: 'gem', bg: '#F0F4F9' },
  { name: 'Pembe Elmas', short: 'pembe', kind: 'gem', bg: '#FAE5EF' },
  { name: 'Bitcoin', short: 'btc', kind: 'crypto', bg: '#FCEEDA' },
  { name: 'Soğuk Cüzdan', short: 'wallet', kind: 'crypto', bg: '#E7EBEF' },
  { name: 'Hazine Sandığı', short: 'sandik', kind: 'epic', bg: '#F6EBD2' },
  { name: 'Banka Kasası', short: 'kasa', kind: 'epic', bg: '#E5E8EC' },
  { name: 'MB Rezervi', short: 'rezerv', kind: 'epic', bg: '#F4E8C6' },
  { name: 'Dünya Serveti', short: 'dunya', kind: 'epic', bg: '#FBEFC4' },
];

export const MAX_LEVEL = 24;
/** Külçe Altın: ilk büyük kilometre taşı (ara kutlama burada) */
export const KULCE_LEVEL = 12;

// Her seviyenin yaklaşık TL karşılığı (satirik kur; 13'ten sonra her seviye ikiye katlar)
export const VALUES_TL = [
  0, 0.01, 0.1, 0.5, 1, 10, 50, 200, 4100, 4500, 8000, 32000, 500000,
  1_000_000, 2_000_000, 4_000_000, 8_000_000, 16_000_000, 32_000_000,
  64_000_000, 128_000_000, 256_000_000, 512_000_000, 1_000_000_000, 2_000_000_000,
];

export function formatTL(v: number): string {
  if (v < 1) return `${Math.round(v * 100)} kr`;
  const [int, frac] = v.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac === '00' ? `₺${grouped}` : `₺${grouped},${frac}`;
}

export function levelKind(level: number): TileKind {
  return LEVELS[level].kind;
}

// Birleşme puanı: oluşan seviyenin 2^n değeri (2048 geleneği)
export function mergeScore(resultLevel: number): number {
  return 2 ** resultLevel;
}
