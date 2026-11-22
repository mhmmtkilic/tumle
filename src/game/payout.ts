import { PAYOUT_TL } from './levels';

/*
 * Hamle kazancı — saf hesap. Oyun (useGame) ve ekonomi simülasyonu
 * (scripts/economy) aynı formülü buradan kullanır; ikisi ayrışmasın.
 */

/** Combo bu kadar ardışık birleşmeden SONRA başlar */
export const COMBO_START = 3;
/** Combo çarpanı üst sınırı */
export const MAX_COMBO = 20;
/**
 * Combolu hamlede ek bonus: tahtadaki en yüksek taşın ödemesi × bu oran × çarpan.
 * Küçük taşlarla yapılan combolar da oyuncunun servet ölçeğinde kazandırsın diye
 * bonus, birleşen taşa değil tahtadaki en büyük taşa endekslidir.
 */
export const COMBO_BONUS_RATE = 0.02;

export function comboMultiplier(combo: number): number {
  return combo >= COMBO_START ? Math.min(combo, MAX_COMBO) : 1;
}

/**
 * Birleşmeli bir hamlenin kazancı (TL, kuruşa yuvarlı).
 * @param mergedLevels bu hamlede oluşan seviyeler
 * @param combo hamle dahil ardışık birleşmeli hamle sayısı
 * @param boardMax hamle (ve yeni taşın doğuşu) sonrası tahtadaki en yüksek seviye
 * @param mult mahalle eşyalarının kalıcı kazanç çarpanı (items.earnMultiplier)
 */
export function moveEarnings(mergedLevels: readonly number[], combo: number, boardMax: number, mult = 1): number {
  const multiplier = comboMultiplier(combo);
  let gained = mergedLevels.reduce((sum, lv) => sum + PAYOUT_TL[lv], 0) * multiplier;
  if (multiplier > 1) gained += PAYOUT_TL[boardMax] * COMBO_BONUS_RATE * multiplier;
  gained *= mult;
  return Math.round(gained * 100) / 100;
}
