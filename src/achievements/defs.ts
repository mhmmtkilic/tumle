import { TileKind } from '../game/levels';

export type AchTier = 'normal' | 'zor' | 'elit' | 'efsanevi';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  tier: AchTier;
  /**
   * Zincirdeki para türü (madeni/kağıt/altın/mücevher/kripto/epik). Yalnız
   * tahtayla ilgili başarımlarda vardır; combo, cüzdan ve mağaza başarımları
   * bir türe ait değildir. Listedeki sıra kademe içinde bu türü izler.
   */
  kind?: TileKind;
  /**
   * Sayaçlı başarım: oyunlar boyunca biriken bir istatistik bu sayıya ulaşınca
   * açılır (Başarımlar ekranında ilerleme çubuğu gösterilir).
   */
  goal?: { stat: AchStat; n: number };
}

/**
 * Oyunlar boyunca biriken istatistikler (AchievementsContext saklar).
 *  make4 / make5: oluşturulan 1 TL / 10 TL taşı sayısı
 *  hit5 / hit10: combo'nun ×5 / ×10'a ulaştığı sayı
 *  earned: oyunlarda kazanılan toplam TL
 */
export type AchStat = 'make4' | 'make5' | 'hit5' | 'hit10' | 'earned';

/**
 * Başarımlar: 7 normal + 7 zor + 8 elit + 12 efsanevi = 34.
 * Bilerek kolay başarım yok: ilk oyunda kendiliğinden açılanlar (1 TL, 10 TL,
 * ×5 / ×10 combo, madeni para seti) sayaçlı yapıldı. Eşikler simülasyonla
 * seçildi (scratch bot: oyun başına ~25 adet 1 TL, ~12 adet 10 TL, ~12 kez ×5,
 * ~1,5 kez ×10); normal rozet ~4-5 oyun, EFSANE ~15 oyun sürer. TL eşikleri
 * 2026-11 ekonomi kalibrasyonuyla güncellendi (scripts/economy).
 *
 * Kurgu iki eksende ilerler:
 *  1. Zincirin her para türü (coin → note → gold → gem → crypto → epic) hem
 *     bir "ilk taş" kilometre taşı hem de "türün tamamını aynı anda tahtada
 *     topla" koleksiyon görevi verir.
 *  2. Türden bağımsız beceri/ekonomi görevleri (combo, kazanç, mağaza).
 *
 * Kademe malzemesi: normal gümüş, zor altın, elit mücevher mineli altın,
 * efsanevi taçlı/yanardöner — zincirin mücevher ve ötesi ucu buradadır.
 *
 * ÖNEMLİ: id'ler diske yazıldığı için yeniden adlandırılmaz.
 * Her yeni başarımın BadgeSvg'de bir ikonu olmalı, yoksa madalya boş çizilir.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Normal (gümüş madalya) ----
  {
    id: 'madeni',
    title: 'Cebinde Bozukluk',
    desc: 'Toplam 100 adet 1 TL taşı oluştur.',
    tier: 'normal',
    kind: 'coin',
    goal: { stat: 'make4', n: 100 },
  },
  {
    id: 'kumbara',
    title: 'Kumbara Tamam',
    desc: 'Oyunlarda toplam 5 milyon TL kazan.',
    tier: 'normal',
    kind: 'coin',
    goal: { stat: 'earned', n: 5_000_000 },
  },
  {
    id: 'banknot',
    title: 'Kağıda Terfi',
    desc: 'Toplam 60 adet 10 TL banknotu oluştur.',
    tier: 'normal',
    kind: 'note',
    goal: { stat: 'make5', n: 60 },
  },
  {
    id: 'dolar',
    title: 'Dövize Kaçış',
    desc: 'İlk 100 Dolar taşını oluştur.',
    tier: 'normal',
    kind: 'note',
  },
  {
    id: 'altin',
    title: 'Altın Günü',
    desc: 'İlk 1 Gram Altın taşını oluştur.',
    tier: 'normal',
    kind: 'gold',
  },
  {
    id: 'zincir',
    title: 'Zincir Reaksiyon',
    desc: 'Combo çarpanını toplam 50 kez ×5’e çıkar.',
    tier: 'normal',
    goal: { stat: 'hit5', n: 50 },
  },
  {
    id: 'anahtar',
    title: 'İlk Anahtar',
    desc: 'Mağazadan ilk eşyanı satın al.',
    tier: 'normal',
  },
  // ---- Zor (altın madalya + ışıma) ----
  {
    id: 'deste',
    title: 'Deste Deste',
    desc: 'Dört kağıt parayı (10, 50, 200 TL ve 100 Dolar) aynı anda tahtada bulundur.',
    tier: 'zor',
    kind: 'note',
  },
  {
    id: 'tamaltin',
    title: 'Damat Altını',
    desc: 'İlk Tam Altın taşını oluştur.',
    tier: 'zor',
    kind: 'gold',
  },
  {
    id: 'kulce',
    title: 'Külçe Avcısı',
    desc: 'Külçe Altın taşına ulaş.',
    tier: 'zor',
    kind: 'gold',
  },
  {
    id: 'efsane',
    title: 'EFSANE',
    desc: 'Combo çarpanını toplam 20 kez ×10’a çıkar.',
    tier: 'zor',
    goal: { stat: 'hit10', n: 20 },
  },
  {
    id: 'milyoner',
    title: 'Kağıt Üstünde Milyoner',
    desc: 'Birikimini 10 milyon TL yap.',
    tier: 'zor',
  },
  {
    id: 'boga',
    title: 'Boğa Piyasası',
    desc: 'Tek oyunda 50 milyon TL kazan.',
    tier: 'zor',
  },
  {
    id: 'agalik',
    title: 'Toprak Ağası',
    desc: 'Yan Arsa’yı satın al.',
    tier: 'zor',
  },
  // ---- Elit (mücevher mineli altın madalya, ışın + parıltı) ----
  {
    id: 'kuyumcu',
    title: 'Kuyumcu',
    desc: 'İlk Yeşim Taşı’nı oluştur — mücevher çağı başlasın.',
    tier: 'elit',
    kind: 'gem',
  },
  {
    id: 'altinseti',
    title: 'Altın Vitrini',
    desc: 'Dört altın türünü (1 gr, çeyrek, tam, külçe) aynı anda tahtada bulundur.',
    tier: 'elit',
    kind: 'gold',
  },
  {
    id: 'ciftekulce',
    title: 'Çifte Külçe',
    desc: 'Tahtada aynı anda iki Külçe Altın bulundur.',
    tier: 'elit',
    kind: 'gold',
  },
  {
    id: 'altincag',
    title: 'Altın Çağ',
    desc: 'Tahtada aynı anda dört altın taşı bulundur.',
    tier: 'elit',
    kind: 'gold',
  },
  {
    id: 'numizmat',
    title: 'Nümizmat',
    desc: 'Sekiz farklı para taşını aynı anda tahtada topla.',
    tier: 'elit',
  },
  {
    id: 'hiper',
    title: 'Hiper Enflasyon',
    desc: 'Tek oyunda 1 milyar TL kazan.',
    tier: 'elit',
  },
  {
    id: 'holding',
    title: 'Holding',
    desc: 'Birikimini 1 milyar TL yap.',
    tier: 'elit',
  },
  {
    id: 'serimanyagi',
    title: 'Seri Manyağı',
    desc: '15 hamlelik kesintisiz birleşme serisi yap.',
    tier: 'elit',
  },
  // ---- Efsanevi (taçlı, yanardöner jantlı, faset yüzlü madalya) ----
  {
    id: 'kral',
    title: 'Mahalle Kralı',
    desc: 'Mahalledeki her eşyaya sahip ol.',
    tier: 'efsanevi',
  },
  {
    id: 'elmas',
    title: 'Elmas Kesim',
    desc: 'İlk Elmas taşını oluştur.',
    tier: 'efsanevi',
    kind: 'gem',
  },
  {
    id: 'pembeelmas',
    title: 'Pembe Nadir',
    desc: 'Pembe Elmas’a ulaş — mücevher zincirinin ucu.',
    tier: 'efsanevi',
    kind: 'gem',
  },
  {
    id: 'mucevherkutusu',
    title: 'Mücevher Kutusu',
    desc: 'Tahtada aynı anda üç mücevher taşı bulundur.',
    tier: 'efsanevi',
    kind: 'gem',
  },
  {
    id: 'mucevherseti',
    title: 'Mücevher Vitrini',
    desc: 'Beş farklı mücevher türünü aynı anda tahtada bulundur.',
    tier: 'efsanevi',
    kind: 'gem',
  },
  {
    id: 'elmaseller',
    title: 'Elmas Eller',
    desc: 'Bitcoin taşını oluştur. Satmak yok.',
    tier: 'efsanevi',
    kind: 'crypto',
  },
  {
    id: 'sogukdepo',
    title: 'Soğuk Depo',
    desc: 'Soğuk Cüzdan’a ulaş.',
    tier: 'efsanevi',
    kind: 'crypto',
  },
  {
    id: 'sogukzincir',
    title: 'Soğuk Zincir',
    desc: 'Bitcoin ile Soğuk Cüzdan’ı aynı anda tahtada bulundur.',
    tier: 'efsanevi',
    kind: 'crypto',
  },
  {
    id: 'define',
    title: 'Define Avcısı',
    desc: 'Hazine Sandığı’nı aç.',
    tier: 'efsanevi',
    kind: 'epic',
  },
  {
    id: 'kasa',
    title: 'Kasa Kilidi',
    desc: 'Banka Kasası’na ulaş.',
    tier: 'efsanevi',
    kind: 'epic',
  },
  {
    id: 'rezerv',
    title: 'Rezerv Sahibi',
    desc: 'Merkez Bankası Rezervi’ne ulaş.',
    tier: 'efsanevi',
    kind: 'epic',
  },
  {
    id: 'dunyanin',
    title: 'Dünyanın Sahibi',
    desc: 'Zincirin sonuna ulaş: Dünya Serveti.',
    tier: 'efsanevi',
    kind: 'epic',
  },
];

/**
 * Başarım ödülünün TABANI (TL), kademeye göre. Asıl ödül = taban × oyuncunun o
 * anki kazanç çarpanı (items.earnMultiplier): gelir eşyalarla katlandığı için
 * sabit bir tutar ilerledikçe anlamsızlaşırdı. Böylece ödül hep aynı "kaç
 * oyunluk kazanç" değerindedir (efsanevi ≈ orta oyuncunun iki oyunu); ödülü
 * bekletip sonra almak bu ölçüyle bir şey kazandırmaz. Ödüller gelirin küçük
 * bir parçası kalır (scripts/economy): rozet mağazayı açmaz, yalnız hızlandırır.
 */
export const REWARD_BY_TIER: Record<AchTier, number> = {
  normal: 25_000,
  zor: 100_000,
  elit: 400_000,
  efsanevi: 1_000_000,
};

/** @param mult oyuncunun kazanç çarpanı (ödül alınırkenki) */
export function rewardOf(def: AchievementDef, mult = 1): number {
  return Math.round(REWARD_BY_TIER[def.tier] * mult);
}

// ---- Doğrulama (yanlış veri geliştirme sırasında anında patlasın) ----------

const BY_ID = new Map<string, AchievementDef>();
for (const a of ACHIEVEMENTS) {
  if (BY_ID.has(a.id)) throw new Error(`Başarım id çakışması: ${a.id}`);
  BY_ID.set(a.id, a);
}

export function getAchievement(id: string): AchievementDef {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Bilinmeyen başarım: ${id}`);
  return a;
}
