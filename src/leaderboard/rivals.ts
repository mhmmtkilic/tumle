import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarConfig, randomAvatar } from '../profile/avatar';
import { ITEMS, ShopItem } from '../economy/items';
import { formatShort } from '../game/levels';

/*
 * Zenginler Listesi'nin rakipleri. Sunucu yok: rakipler sabit tohumdan
 * üretilir (her cihazda aynı isim, yüz ve başlangıç serveti) ve servetleri
 * oyunun ilk açılışından itibaren gün geçtikçe kendi hızlarında büyür; liste canlı hisseder, oyuncu onları geçmeye çalışır.
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

/**
 * Rakip servetleri bu aralıkta log-düzgün dağılır. Fiyatlar gerçek Türkiye
 * ölçeğinde (kedi ₺35 bin → kruvaziyer ₺30 milyar): tüm eşyalar ≈ ₺52 Mr, orta
 * oyuncu ilk oyunda ~₺550 bin kazanır, mahalleyi bitirdiğinde serveti ~₺55 Mr
 * olur (scripts/economy). Zirve bunun biraz üstünde biter: rakipler
 * MAX_WORTH / TOTAL_GROWTH'tan başlar ve en hızlısı MAX_DAYS günde en çok
 * TOTAL_GROWTH katına çıkar. Sonrasında liste donmaz: herkes LATE_GROWTH
 * hızıyla (günde binde bir) büyümeye devam eder.
 */
const MIN_WORTH = 15_000;
const MAX_WORTH = 60_000_000_000;
const TOTAL_GROWTH = 3;
/** Hızlı büyüme dönemi; sonrası LATE_GROWTH */
const MAX_DAYS = 120;
const DAY = 86_400_000;
const LATE_GROWTH = 0.001;
/** Günlük büyüme oranı aralığı; üst sınır MAX_DAYS günde tam TOTAL_GROWTH kat eder */
const MIN_GROWTH = 0.004;
const MAX_GROWTH = Math.pow(TOTAL_GROWTH, 1 / MAX_DAYS) - 1;

/*
 * Büyüme takvime değil oyuncuya bağlıdır: sayaç oyunun ilk açıldığı gün başlar
 * (eskiden sabit bir tarihten başlıyordu; geç yükleyen oyuncu en zor ve donmuş
 * listeyle karşılaşıyordu). Başlangıç günü diskte saklanır.
 */
const EPOCH_KEY = '@gamemoney/rivals_epoch';
let epoch = Date.now();

function saveEpoch() {
  AsyncStorage.setItem(EPOCH_KEY, String(epoch)).catch(() => {});
}

AsyncStorage.getItem(EPOCH_KEY)
  .then((raw) => {
    const saved = Number(raw);
    // Gelecekteki (saat geri alınmış) ya da bozuk kayıt yok sayılır
    if (raw && Number.isFinite(saved) && saved > 0 && saved <= Date.now()) epoch = saved;
    else saveEpoch();
  })
  .catch(() => {});

/** Rakipleri başlangıç servetlerine döndürür (ilerleme sıfırlamada kullanılır) */
export function resetRivals(): void {
  epoch = Date.now();
  saveEpoch();
}

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
    const base = Math.exp(Math.log(MIN_WORTH) + (1 - t) * (Math.log(MAX_WORTH / TOTAL_GROWTH) - Math.log(MIN_WORTH)));
    return { id: `r${i}`, name, avatar: randomAvatar(rnd), base, growth: MIN_GROWTH + rnd() * (MAX_GROWTH - MIN_GROWTH) };
  });
})();

function bestItem(worth: number): ShopItem | null {
  let best: ShopItem | null = null;
  for (const it of ITEMS) if (it.price <= worth * 0.5) best = it;
  return best;
}

/** Şu anki rakip listesi (servete göre azalan) */
export function rivalsAt(now = Date.now()): Rival[] {
  const total = Math.max((now - epoch) / DAY, 0);
  const days = Math.min(total, MAX_DAYS);
  const late = Math.pow(1 + LATE_GROWTH, total - days);
  return BASES.map((b) => {
    const worth = Math.round(b.base * Math.pow(1 + b.growth, days) * late);
    return { id: b.id, name: b.name, avatar: b.avatar, worth, best: bestItem(worth) };
  }).sort((a, b) => b.worth - a.worth);
}

/** Kısa servet yazısı (aşağı yuvarlar) — levels.formatShort ile aynı */
export const formatWorth = formatShort;
