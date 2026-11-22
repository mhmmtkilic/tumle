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

/**
 * Birleşme ödemesi (TL): seviye N'yi oluşturan birleşme cüzdana PAYOUT_TL[N] ekler
 * (combo çarpanı ve bonusu ayrıca). Taşın adındaki değer değildir, yalnız oyun
 * ekonomisidir; ekranda hiçbir yerde taşın "kuru" olarak gösterilmez.
 *
 * 1–7: her seviye ×2 (klasik 2048). 8+: her seviye yalnız ×1,2. Taban
 * yükseldikçe tüm birleşmeler üst seviyelerde olur; eğri burada dik kalırsa
 * kazanç her seviyede katlanır ve iyi oyuncu tek oyunda ekonomiyi bitirir
 * (eski tablo: usta bot oyun başına ₺200-500 milyar, mağazanın tamamı ₺16 milyar).
 * Bu eğriyle oyun başına ortalama: zayıf ~₺125 bin, orta ~₺550 bin, usta ~₺1,9 Mn.
 * Değiştirirsen `npm run economy` ile mağaza temposunu yeniden doğrula.
 */
export const PAYOUT_TL: number[] = [0];
for (let lv = 1; lv <= 24; lv++) {
  PAYOUT_TL.push(Math.round(10 * (lv <= 7 ? 2 ** (lv - 1) : 64 * 1.2 ** (lv - 7))));
}

export function formatTL(v: number): string {
  if (v < 1) return `${Math.round(v * 100)} kr`;
  const [int, frac] = v.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return frac === '00' ? `₺${grouped}` : `₺${grouped},${frac}`;
}

/**
 * Kısa tutar: ₺35 Bin / ₺2,4 Mn / ₺1,25 Mr / ₺3 Tn. Hep AŞAĞI yuvarlar: ekranda
 * görünen para, gerçekte olandan fazla olamaz (yoksa "₺2,1 Mn" yazıp ₺2,1 Mn'lik
 * eşyayı aldırmıyordu).
 */
export function formatShort(v: number): string {
  const units: [number, string][] = [
    [1e12, 'Tn'],
    [1e9, 'Mr'],
    [1e6, 'Mn'],
    [1e3, 'Bin'],
  ];
  for (const [n, u] of units) {
    if (v >= n) {
      const x = v / n;
      const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2;
      const k = 10 ** digits;
      // +1e-6: 1,15 gibi değerler ikilikte 1,1499… tutulur, taban almada bir alta düşmesin
      const fixed = (Math.floor(x * k + 1e-6) / k).toFixed(digits);
      const s = (digits > 0 ? fixed.replace(/\.?0+$/, '') : fixed).replace('.', ',');
      return `₺${s} ${u}`;
    }
  }
  return `₺${Math.floor(v)}`;
}

/** Ekran tutarı: milyonun altında tam (₺350.000), üstünde kısa (₺2,4 Mn); kuruş gösterilmez */
export function formatMoney(v: number): string {
  return v >= 1_000_000 ? formatShort(v) : formatTL(Math.floor(v));
}

export function levelKind(level: number): TileKind {
  return LEVELS[level].kind;
}

// Birleşme puanı: oluşan seviyenin 2^n değeri (2048 geleneği)
export function mergeScore(resultLevel: number): number {
  return 2 ** resultLevel;
}
