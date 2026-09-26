/*
 * Mağaza kataloğu — tek liste. Her eşya mahalleye (tek sahne) aittir ve
 * ızgarada bir hücreye yerleşir. Liste fiyat sırasındadır; ilerlemeyi yalnız
 * para ve `requires` belirler, evre/kategori yoktur.
 *
 * ÖNEMLİ: Kayıtlı oyunlarda id'ler diske yazıldığından mevcut id'leri
 * yeniden adlandırma; yeni eşya eklemek serbesttir.
 */

export interface Placement {
  /** Kare ayak izi (hücre cinsinden) */
  foot: 1 | 2;
  /**
   * Çizimin izometrik TABAN MERKEZİ (viewBox koordinatında). Eşya, bu nokta
   * hücre ayak izinin merkezine gelecek şekilde yerleştirilir.
   */
  anchor: { x: number; y: number };
}

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  /** Çizimin viewBox boyutu = sahnedeki dünya boyutu */
  art: { w: number; h: number };
  place: Placement;
  /** Satın alma ön şartı: bu eşyaların hepsi alınmış olmalı */
  requires?: string[];
}

/** Çizim boyutu + elle ölçülmüş çapa (ItemSvg kutu orijinlerinden) */
function lot(w: number, h: number, foot: 1 | 2, ax: number, ay: number): Pick<ShopItem, 'art' | 'place'> {
  return { art: { w, h }, place: { foot, anchor: { x: ax, y: ay } } };
}

/** Ucuzdan pahalıya: mağaza listesinin sırası budur */
export const ITEMS: ShopItem[] = [
  { id: 'bisiklet', name: 'Şehir Bisikleti', desc: 'Vites yok ama zam da yok.', price: 8_000, ...lot(80, 60, 1, 40, 52) },
  { id: 'agac', name: 'Bahçe Ağacı', desc: 'Gölgesi bedava, oksijeni sınırsız.', price: 10_000, ...lot(70, 90, 1, 33, 82) },
  { id: 'motosiklet', name: 'Motosiklet', desc: 'Trafikte süzülmek paha biçilemezmiş… değilmiş.', price: 200_000, ...lot(85, 60, 1, 42, 52) },
  { id: 'araba', name: 'Araba', desc: 'ÖTV dahil. Şaka değil.', price: 500_000, ...lot(110, 80, 2, 49, 42.5) },
  { id: 'dukkan', name: 'Köşe Dükkanı', desc: 'Artık kirayı sen ödemiyorsun, sana ödüyorlar.', price: 2_500_000, ...lot(110, 100, 2, 53, 66.5) },
  { id: 'park', name: 'Çocuk Parkı', desc: 'Salıncak sırası kavgası dahil değildir.', price: 3_000_000, ...lot(80, 70, 1, 38, 56), requires: ['arsa'] },
  { id: 'karavan', name: 'Karavan', desc: 'Ev değil, özgürlük. Öyle diyorlar.', price: 3_500_000, ...lot(100, 80, 2, 44, 47), requires: ['arsa'] },
  { id: 'ev', name: 'Müstakil Ev', desc: 'Kredisiz, peşin, bacası tüten cinsten.', price: 8_000_000, ...lot(118, 108, 2, 57, 70.5) },
  { id: 'havuz', name: 'Yüzme Havuzu', desc: 'Site aidatı yok, klor bizden.', price: 10_000_000, ...lot(95, 60, 2, 47, 27.5), requires: ['arsa'] },
  { id: 'arsa', name: 'Yan Arsa', desc: 'Komşu arsa satılık! Mahalle bir blok büyür.', price: 15_000_000, ...lot(90, 70, 1, 45, 60) },
  { id: 'villa', name: 'Villa', desc: 'Beyaz, ferah; emlakçı hâlâ kapıda.', price: 30_000_000, ...lot(120, 110, 2, 59, 76.5), requires: ['arsa'] },
  { id: 'gokdelen', name: 'Gökdelen', desc: 'Artık manzara sensin.', price: 50_000_000, ...lot(100, 190, 2, 40, 166) },
  { id: 'helikopter', name: 'Helikopter', desc: 'Trafik artık altında kaldı.', price: 120_000_000, ...lot(90, 70, 2, 45, 39), requires: ['arsa'] },
  { id: 'arsa2', name: 'Sahil Arsası', desc: 'Deniz manzaralı! Mahalle sahile iner.', price: 200_000_000, ...lot(90, 70, 1, 45, 60), requires: ['arsa'] },
  { id: 'malikane', name: 'Malikane', desc: 'Kapısından girince hava değişiyor.', price: 400_000_000, ...lot(130, 115, 2, 63, 73.5), requires: ['arsa2'] },
  { id: 'yat', name: 'Yat', desc: 'Marina parası ayrı; neyse ki o da sende.', price: 800_000_000, ...lot(110, 80, 2, 55, 60), requires: ['arsa2'] },
  { id: 'jet', name: 'Özel Jet', desc: 'Pasaport kuyruğu artık bulutların altında.', price: 2_000_000_000, ...lot(120, 70, 2, 60, 52), requires: ['arsa2'] },
  { id: 'ada', name: 'Özel Ada', desc: 'Kendi kıyın, kendi kuralların.', price: 4_000_000_000, ...lot(100, 85, 2, 50, 60), requires: ['arsa2'] },
  { id: 'roket', name: 'Uzay Roketi', desc: 'Sıradaki durak: Ay’da arsa.', price: 8_000_000_000, ...lot(90, 130, 2, 45, 108), requires: ['arsa2'] },
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
