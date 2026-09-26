export type AchTier = 'normal' | 'zor' | 'elit' | 'efsanevi';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  tier: AchTier;
}

/**
 * Başarımlar: 4 normal + 6 zor + 6 elit + 6 efsanevi. Bilerek kolay başarım yok.
 * Normal: gümüş madalya. Zor: altın madalya. Elit: mücevher mineli altın
 * madalya. Efsanevi: zincirin mücevher/kripto/epik ucu — taçlı, yanardöner
 * jantlı, faset yüzlü madalyalar.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Normal ----
  {
    id: 'dolar',
    title: 'Dövize Kaçış',
    desc: 'İlk 100 Dolar taşını oluştur.',
    tier: 'normal',
  },
  {
    id: 'altin',
    title: 'Altın Günü',
    desc: 'İlk 1 Gram Altın taşını oluştur.',
    tier: 'normal',
  },
  {
    id: 'zincir',
    title: 'Zincir Reaksiyon',
    desc: 'Combo çarpanını ×5 seviyesine çıkar.',
    tier: 'normal',
  },
  {
    id: 'anahtar',
    title: 'İlk Anahtar',
    desc: 'Mağazadan ilk eşyanı satın al.',
    tier: 'normal',
  },
  // ---- Zor ----
  {
    id: 'kulce',
    title: 'Külçe Avcısı',
    desc: 'Külçe Altın taşına ulaş.',
    tier: 'zor',
  },
  {
    id: 'efsane',
    title: 'EFSANE',
    desc: 'Combo çarpanını ×10 tavana dayandır.',
    tier: 'zor',
  },
  {
    id: 'milyoner',
    title: 'Kağıt Üstünde Milyoner',
    desc: 'Birikimini 1.000.000 TL yap.',
    tier: 'zor',
  },
  {
    id: 'boga',
    title: 'Boğa Piyasası',
    desc: 'Tek oyunda 100.000 TL kazan.',
    tier: 'zor',
  },
  {
    id: 'agalik',
    title: 'Toprak Ağası',
    desc: 'Yan Arsa’yı satın al.',
    tier: 'zor',
  },
  {
    id: 'kral',
    title: 'Mahalle Kralı',
    desc: 'Mahalledeki her eşyaya sahip ol.',
    tier: 'zor',
  },
  // ---- Elit ----
  {
    id: 'ciftekulce',
    title: 'Çifte Külçe',
    desc: 'Tahtada aynı anda iki Külçe Altın bulundur.',
    tier: 'elit',
  },
  {
    id: 'altincag',
    title: 'Altın Çağ',
    desc: 'Tahtada aynı anda dört altın taşı bulundur.',
    tier: 'elit',
  },
  {
    id: 'numizmat',
    title: 'Nümizmat',
    desc: '12 para türünün hepsini aynı anda tahtada topla.',
    tier: 'elit',
  },
  {
    id: 'hiper',
    title: 'Hiper Enflasyon',
    desc: 'Tek oyunda 1.000.000 TL kazan.',
    tier: 'elit',
  },
  {
    id: 'holding',
    title: 'Holding',
    desc: 'Birikimini 10.000.000 TL yap.',
    tier: 'elit',
  },
  {
    id: 'serimanyagi',
    title: 'Seri Manyağı',
    desc: '15 hamlelik kesintisiz birleşme serisi yap.',
    tier: 'elit',
  },
  // ---- Efsanevi ----
  {
    id: 'kuyumcu',
    title: 'Kuyumcu',
    desc: 'İlk Yeşim Taşı’nı oluştur — mücevher çağı başlasın.',
    tier: 'efsanevi',
  },
  {
    id: 'mucevherkutusu',
    title: 'Mücevher Kutusu',
    desc: 'Tahtada aynı anda üç mücevher taşı bulundur.',
    tier: 'efsanevi',
  },
  {
    id: 'elmaseller',
    title: 'Elmas Eller',
    desc: 'Bitcoin taşını oluştur. Satmak yok.',
    tier: 'efsanevi',
  },
  {
    id: 'sogukdepo',
    title: 'Soğuk Depo',
    desc: 'Soğuk Cüzdan’a ulaş.',
    tier: 'efsanevi',
  },
  {
    id: 'define',
    title: 'Define Avcısı',
    desc: 'Hazine Sandığı’nı aç.',
    tier: 'efsanevi',
  },
  {
    id: 'dunyanin',
    title: 'Dünyanın Sahibi',
    desc: 'Zincirin sonuna ulaş: Dünya Serveti.',
    tier: 'efsanevi',
  },
];

/** Başarım ödülü (TL), kademeye göre: rozet ne kadar zorsa ödül o kadar büyük */
export const REWARD_BY_TIER: Record<AchTier, number> = {
  normal: 25_000,
  zor: 250_000,
  elit: 2_500_000,
  efsanevi: 25_000_000,
};

export function rewardOf(def: AchievementDef): number {
  return REWARD_BY_TIER[def.tier];
}

export function getAchievement(id: string): AchievementDef {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}
