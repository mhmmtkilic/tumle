/*
 * Mağaza kataloğu — tek liste. Her eşya mahalleye (tek sahne) aittir ve
 * ızgarada bir hücreye yerleşir. Liste fiyat sırasındadır; ilerlemeyi yalnız
 * para ve `requires` belirler, evre/kategori yoktur.
 *
 * ÖNEMLİ: Kayıtlı oyunlarda id'ler diske yazıldığından mevcut id'leri
 * yeniden adlandırma; yeni eşya eklemek serbesttir.
 */

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  /** Mahalledeki kare ayak izi (hücre cinsinden) */
  foot: 1 | 2;
  /** Satın alma ön şartı: bu eşyaların hepsi alınmış olmalı */
  requires?: string[];
}

/** Ucuzdan pahalıya: mağaza listesinin sırası budur */
export const ITEMS: ShopItem[] = [
  { id: 'kedi', name: 'Kedi', desc: 'Mama masrafı sende, sevgi ondan.', price: 8_000, foot: 1 },
  { id: 'agac', name: 'Bahçe Ağacı', desc: 'Gölgesi bedava, oksijeni sınırsız.', price: 10_000, foot: 1 },
  { id: 'kart', name: 'Go-Kart', desc: 'Mahalle turu, kask dahil.', price: 200_000, foot: 1 },
  { id: 'araba', name: 'Araba', desc: 'ÖTV dahil. Şaka değil.', price: 500_000, foot: 1 },
  { id: 'dukkan', name: 'Köşe Dükkanı', desc: 'Artık kirayı sen ödemiyorsun, sana ödüyorlar.', price: 2_500_000, foot: 2 },
  { id: 'park', name: 'Park', desc: 'Bank senin, güvercinler herkesin.', price: 3_000_000, foot: 2, requires: ['arsa'] },
  { id: 'bufe', name: 'Büfe', desc: 'Tost, ayran, mahalle dedikodusu.', price: 3_500_000, foot: 1, requires: ['arsa'] },
  { id: 'ev', name: 'Müstakil Ev', desc: 'Kredisiz, peşin, kırmızı çatılı.', price: 8_000_000, foot: 2 },
  { id: 'fiskiye', name: 'Fıskiye', desc: 'Bozuk para atana dilek bizden.', price: 10_000_000, foot: 2, requires: ['arsa'] },
  { id: 'arsa', name: 'Yan Arsa', desc: 'Komşu arsa satılık! Mahalle bir blok büyür.', price: 15_000_000, foot: 1 },
  { id: 'villa', name: 'Villa', desc: 'Mavi çatı, ferah salon; emlakçı hâlâ kapıda.', price: 30_000_000, foot: 2, requires: ['arsa'] },
  { id: 'gokdelen', name: 'Gökdelen', desc: 'Artık manzara sensin.', price: 50_000_000, foot: 2 },
  { id: 'turbin', name: 'Rüzgar Türbini', desc: 'Elektrik faturası tarihe karıştı.', price: 120_000_000, foot: 1, requires: ['arsa'] },
  { id: 'arsa2', name: 'Sahil Arsası', desc: 'Deniz manzaralı! Mahalle sahile iner.', price: 200_000_000, foot: 1, requires: ['arsa'] },
  { id: 'malikane', name: 'Malikane', desc: 'Kapısından girince hava değişiyor.', price: 400_000_000, foot: 2, requires: ['arsa2'] },
  { id: 'yat', name: 'Sürat Teknesi', desc: 'Marina parası ayrı; neyse ki o da sende.', price: 800_000_000, foot: 2, requires: ['arsa2'] },
  { id: 'gemi', name: 'Kruvaziyer Gemisi', desc: 'Kendi gemin, kaptanı da sensin.', price: 2_000_000_000, foot: 2, requires: ['arsa2'] },
  { id: 'ada', name: 'Özel Ada', desc: 'Kendi kıyın, kendi kuralların.', price: 4_000_000_000, foot: 2, requires: ['arsa2'] },
  { id: 'roket', name: 'Uzay Roketi', desc: 'Sıradaki durak: Ay’da arsa.', price: 8_000_000_000, foot: 2, requires: ['arsa2'] },
];

// ---- Doğrulama (geliştirme sırasında yanlış veri anında patlasın) ----------

const BY_ID = new Map<string, ShopItem>();
for (const it of ITEMS) {
  if (BY_ID.has(it.id)) throw new Error(`Eşya id çakışması: ${it.id}`);
  BY_ID.set(it.id, it);
}
for (const it of ITEMS) {
  for (const r of it.requires ?? []) {
    if (!BY_ID.has(r)) throw new Error(`${it.id} bilinmeyen şart istiyor: ${r}`);
  }
}
// Mağaza listeyi olduğu gibi gösterir; sıra ucuzdan pahalıya olmalı
for (let i = 1; i < ITEMS.length; i++) {
  if (ITEMS[i].price < ITEMS[i - 1].price) {
    throw new Error(`Katalog fiyat sırası bozuk: ${ITEMS[i].id}`);
  }
}

// ---- Erişim -----------------------------------------------------------------

export function getItem(id: string): ShopItem {
  const it = BY_ID.get(id);
  if (!it) throw new Error(`Bilinmeyen eşya: ${id}`);
  return it;
}

export function hasItem(id: string): boolean {
  return BY_ID.has(id);
}

/**
 * Arsalar sahnenin zeminidir: ızgaraya yerleşmez, ayak izi kullanılmaz.
 * Sahnede "yerleştirilebilir" olan her şey bunların dışındaki eşyalardır.
 */
export const LAND_IDS: readonly string[] = ['arsa', 'arsa2'];

export function isPlaceable(id: string): boolean {
  return BY_ID.has(id) && !LAND_IDS.includes(id);
}

/** Sahneye yerleşen eşyalar (arsalar hariç) */
export const PLACED_ITEMS: readonly ShopItem[] = ITEMS.filter((i) => isPlaceable(i.id));
