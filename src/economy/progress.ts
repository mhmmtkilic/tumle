import { getItem, hasItem, ShopItem } from './items';

/*
 * İlerleme — hepsi `owned` listesinden türetilen SAF fonksiyonlar. Ekstra
 * kayıt tutulmaz; bu sayede eski kayıtlar (düz owned listesi) olduğu gibi
 * çalışır ve katalogdan kalkmış id'ler kimseyi geri düşürmez.
 */

/** Şart listesinden henüz alınmamış olanlar */
export function missingRequirements(owned: readonly string[], item: ShopItem): string[] {
  return (item.requires ?? []).filter((r) => !owned.includes(r));
}

export type BuyBlock = 'owned' | 'requires' | 'money';

export interface BuyCheck {
  ok: boolean;
  /** ok=false ise ilk engel; öncelik: alınmış > şart > para */
  block?: BuyBlock;
  missing: string[];
}

export function checkBuy(owned: readonly string[], wallet: number, item: ShopItem): BuyCheck {
  const missing = missingRequirements(owned, item);
  if (owned.includes(item.id)) return { ok: false, block: 'owned', missing };
  if (missing.length > 0) return { ok: false, block: 'requires', missing };
  if (wallet < item.price) return { ok: false, block: 'money', missing };
  return { ok: true, missing };
}

/** Sahip olunan eşyaların toplam değeri */
export function totalValue(owned: readonly string[]): number {
  let sum = 0;
  for (const id of owned) {
    if (!hasItem(id)) continue;
    sum += getItem(id).price;
  }
  return sum;
}
