/*
 * Mağaza kataloğu — tek liste. Her eşya mahalleye (tek sahne) aittir ve
 * ızgarada bir hücreye yerleşir. Liste fiyat sırasındadır; ilerlemeyi yalnız
 * para ve `requires` belirler, evre/kategori yoktur. Ön şart (arsa) kendisine
 * bağlı eşyadan pahalı olabilir; sıradaki hedefi seçen kod buna göre yazılmıştır.
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
  /** Eşyanın oyuna kazandırdığı: kalıcı kazanç çarpanı ya da oyun başına araç hakkı */
  perk: Perk;
}

export type Tool = 'undo' | 'hammer';

/**
 * Mahalle oyuna geri verir: çoğu eşya tüm birleşme kazançlarını kalıcı olarak
 * ÇARPAR (çarpanlar birbiriyle çarpılır), birkaçı her oyunda kullanılabilecek
 * bir araç hakkı açar.
 *  undo   — son hamleyi geri al (kazancı da geri alınır); oyun bitince de kullanılır
 *  hammer — tahtadan istediğin bir taşı kır; tıkanmış tahtayı açar
 */
export type Perk = { mult: number } | { tool: Tool };

/**
 * Fiyatlar Türkiye'nin enflasyon yemiş gerçek piyasasına yakındır (2026 sonu):
 * cins kedi ₺35 bin, sıfır araba ₺2,4 Mn, müstakil ev ₺14 Mn, denize sıfır arsa
 * ₺280 Mn, gökdelen ₺12 Mr, kruvaziyer gemisi ₺30 Mr. İlk eşyayla son eşya
 * arasında ~1 milyon kat fark olduğundan kazanç toplanarak değil ÇARPILARAK
 * büyür: her eşya geliri katlar, bir sonraki büyük hedef yine birkaç oyunluk iş
 * olur. Taşların temel ödemesi (levels.PAYOUT_TL) değişmez.
 *
 * Liste ucuzdan pahalıya; mağaza bu sırayı gösterir. Arsaya bağlı ucuz eşyalar
 * (fıskiye, büfe, park, tekne) arsadan ÖNCE sıralanır ama arsa alınana dek
 * gizlidir — arsa alınınca "içini doldur" diye peş peşe alınırlar.
 *
 * Tempo (`npm run economy`, çarpanlar ve başarım ödülleri dahil; oyun no medyanı):
 * orta oyuncu ilk oyunda 3 eşya, arabayı ~3., Yan Arsa'yı ~17., Sahil Arsası'nı
 * ~37. oyunda, mahallenin tamamını ~97. oyunda alır (usta ~33, zayıf ~408). Botlar Geri Al / Çekiç
 * kullanmadığından gerçek tempo biraz daha hızlıdır. Fiyat ya da çarpan
 * değiştirirsen simülasyonu yeniden koştur.
 */
export const ITEMS: ShopItem[] = [
  { id: 'kedi', name: 'Kedi', desc: 'Cins kedi. Mama masrafı sende, sevgi ondan.', price: 35_000, foot: 1, perk: { mult: 1.25 } },
  { id: 'agac', name: 'Bahçe Ağacı', desc: 'Asırlık zeytin. Gölgesi bedava, oksijeni sınırsız.', price: 75_000, foot: 1, perk: { mult: 1.25 } },
  { id: 'kart', name: 'Go-Kart', desc: 'Mahalle turu, kask dahil.', price: 350_000, foot: 1, perk: { mult: 1.6 } },
  { id: 'fiskiye', name: 'Fıskiye', desc: 'Bozuk para atana dilek bizden.', price: 1_200_000, foot: 2, requires: ['arsa'], perk: { mult: 1.3 } },
  { id: 'bufe', name: 'Büfe', desc: 'Tost, ayran, mahalle dedikodusu.', price: 1_750_000, foot: 1, requires: ['arsa'], perk: { mult: 1.4 } },
  { id: 'araba', name: 'Araba', desc: 'Sıfır kilometre, ÖTV dahil. Şaka değil.', price: 2_400_000, foot: 1, perk: { tool: 'undo' } },
  { id: 'park', name: 'Park', desc: 'Bank senin, güvercinler herkesin.', price: 4_500_000, foot: 2, requires: ['arsa'], perk: { mult: 1.4 } },
  { id: 'dukkan', name: 'Köşe Dükkanı', desc: 'Artık kirayı sen ödemiyorsun, sana ödüyorlar.', price: 9_500_000, foot: 2, perk: { mult: 2.2 } },
  { id: 'ev', name: 'Müstakil Ev', desc: 'Kredisiz, peşin, kırmızı çatılı.', price: 14_000_000, foot: 2, perk: { mult: 1.6 } },
  { id: 'arsa', name: 'Yan Arsa', desc: 'Komşu arsa satılık! Mahalle bir blok büyür.', price: 22_000_000, foot: 1, perk: { mult: 1.5 } },
  { id: 'villa', name: 'Villa', desc: 'Mavi çatı, ferah salon; emlakçı hâlâ kapıda.', price: 65_000_000, foot: 2, requires: ['arsa'], perk: { tool: 'hammer' } },
  { id: 'yat', name: 'Sürat Teknesi', desc: 'Marina parası ayrı; neyse ki o da sende.', price: 140_000_000, foot: 2, requires: ['arsa2'], perk: { tool: 'undo' } },
  { id: 'turbin', name: 'Rüzgar Türbini', desc: 'Elektrik faturası tarihe karıştı.', price: 160_000_000, foot: 1, requires: ['arsa'], perk: { mult: 2.5 } },
  { id: 'arsa2', name: 'Sahil Arsası', desc: 'Denize sıfır! Mahalle sahile iner.', price: 280_000_000, foot: 1, requires: ['arsa'], perk: { mult: 2 } },
  { id: 'malikane', name: 'Malikane', desc: 'Kapısından girince hava değişiyor.', price: 950_000_000, foot: 2, requires: ['arsa2'], perk: { mult: 2.5 } },
  { id: 'ada', name: 'Özel Ada', desc: 'Kendi kıyın, kendi kuralların.', price: 2_500_000_000, foot: 2, requires: ['arsa2'], perk: { mult: 2.2 } },
  { id: 'roket', name: 'Uzay Roketi', desc: 'Sıradaki durak: Ay’da arsa.', price: 6_000_000_000, foot: 2, requires: ['arsa2'], perk: { mult: 2 } },
  { id: 'gokdelen', name: 'Gökdelen', desc: 'Artık manzara sensin.', price: 12_000_000_000, foot: 2, perk: { mult: 2.5 } },
  { id: 'gemi', name: 'Kruvaziyer Gemisi', desc: 'Kendi gemin, kaptanı da sensin.', price: 30_000_000_000, foot: 2, requires: ['arsa2'], perk: { tool: 'hammer' } },
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

// ---- Eşya etkileri ------------------------------------------------------------

/** Sahip olunan eşyaların toplam kazanç çarpanı (çarpanların çarpımı; eşyasız 1) */
export function earnMultiplier(owned: readonly string[]): number {
  let m = 1;
  for (const id of owned) {
    const it = BY_ID.get(id);
    if (it && 'mult' in it.perk) m *= it.perk.mult;
  }
  return m;
}

/** Çarpan yazısı: ×1,6 / ×12,5 / ×4.620 */
export function formatMult(m: number): string {
  if (m >= 100) return `×${Math.round(m).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  const digits = m >= 10 ? 1 : 2;
  return `×${m.toFixed(digits).replace(/\.?0+$/, '').replace('.', ',')}`;
}

/** Her oyunda kullanılabilecek araç hakları (aynı aracı açan her eşya +1) */
export function toolCharges(owned: readonly string[]): Record<Tool, number> {
  const out: Record<Tool, number> = { undo: 0, hammer: 0 };
  for (const id of owned) {
    const it = BY_ID.get(id);
    if (it && 'tool' in it.perk) out[it.perk.tool]++;
  }
  return out;
}

export const TOOL_NAMES: Record<Tool, string> = { undo: 'Geri Al', hammer: 'Çekiç' };

/** Mağaza ve mahalle kartındaki kısa etki yazısı */
export function perkLabel(perk: Perk): string {
  return 'mult' in perk ? `Kazanç ${formatMult(perk.mult)}` : `${TOOL_NAMES[perk.tool]} +1`;
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
