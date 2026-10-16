import { AvatarConfig, randomAvatar } from '../profile/avatar';
import { ITEMS, ShopItem } from '../economy/items';

/*
 * Zenginler Listesi'nin rakipleri. Sunucu yok: rakipler sabit tohumdan
 * üretilir (her cihazda aynı isim, yüz ve servet) ve servetleri gün geçtikçe
 * kendi hızlarında büyür; liste canlı hisseder, oyuncu onları geçmeye çalışır.
 * Oyuncunun serveti = birikim + mahalledeki eşyaların değeri.
 */

export interface Rival {
  id: string;
  name: string;
  avatar: AvatarConfig;
  worth: number;
  /** Servetine göre sahip olabileceği en değerli eşya (satırdaki küçük resim) */
  best: ShopItem | null;
}

const NAMES = [
  'Zeynep K.', 'Emre Y.', 'Selin A.', 'Burak T.', 'Elif D.', 'Mert Ö.', 'Defne S.', 'Can B.',
  'Ece Ç.', 'Kaan G.', 'Ada M.', 'Arda Ş.', 'İrem U.', 'Onur E.', 'Duru P.', 'Barış İ.',
  'Nehir Y.', 'Eren K.', 'Melis T.', 'Ozan A.', 'Buse G.', 'Efe D.', 'Asya Ö.', 'Kerem Ç.',
  'Lara B.', 'Tolga S.', 'Ceren M.', 'Yiğit H.', 'Derin A.', 'Sarp Ü.', 'Naz E.', 'Alp R.',
  'Gizem Ş.', 'Umut K.', 'Pelin Y.', 'Doruk T.',
];

/** Rakip servetleri bu aralıkta log-düzgün dağılır (oyunun tüm eşyaları ≈ ₺16 milyar) */
const MIN_WORTH = 40_000;
const MAX_WORTH = 18_000_000_000;
/** Büyümenin başladığı gün ve en fazla kaç gün büyüyeceği */
const EPOCH = Date.UTC(2026, 9, 1);
const MAX_DAYS = 120;
const DAY = 86_400_000;

/** Küçük, tekrarlanabilir rastgele sayı üreteci */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Base {
  id: string;
  name: string;
  avatar: AvatarConfig;
  base: number;
  /** Günlük büyüme oranı */
  growth: number;
}

const BASES: Base[] = (() => {
  const rnd = seeded(2048);
  return NAMES.map((name, i) => {
    const t = (i + rnd() * 0.8) / NAMES.length;
    // Üst sıralar seyrek, alt sıralar sık: logaritmik ölçekte eşit aralık
    const base = Math.exp(Math.log(MIN_WORTH) + (1 - t) * (Math.log(MAX_WORTH / 3) - Math.log(MIN_WORTH)));
    return { id: `r${i}`, name, avatar: randomAvatar(rnd), base, growth: 0.004 + rnd() * 0.012 };
  });
})();

function bestItem(worth: number): ShopItem | null {
  let best: ShopItem | null = null;
  for (const it of ITEMS) if (it.price <= worth * 0.5) best = it;
  return best;
}

/** Şu anki rakip listesi (servete göre azalan) */
export function rivalsAt(now = Date.now()): Rival[] {
  const days = Math.min(Math.max((now - EPOCH) / DAY, 0), MAX_DAYS);
  return BASES.map((b) => {
    const worth = Math.round(b.base * Math.pow(1 + b.growth, days));
    return { id: b.id, name: b.name, avatar: b.avatar, worth, best: bestItem(worth) };
  }).sort((a, b) => b.worth - a.worth);
}

/** Kısa servet yazısı: ₺1,2 Mr / ₺350 Mn / ₺48 Bin */
export function formatWorth(v: number): string {
  const units: [number, string][] = [
    [1e9, 'Mr'],
    [1e6, 'Mn'],
    [1e3, 'Bin'],
  ];
  for (const [n, u] of units) {
    if (v >= n) {
      const x = v / n;
      const s = x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace('.', ',').replace(/,0$/, '');
      return `₺${s} ${u}`;
    }
  }
  return `₺${Math.round(v)}`;
}
