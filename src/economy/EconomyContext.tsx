import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, hasItem } from './items';
import { checkBuy } from './progress';

/** TEST MODU: true iken cüzdan sınırsızdır ve satın almalar para düşmez. Yayınlamadan önce false yap! */
export const DEV_UNLIMITED_MONEY = false;
const DEV_WALLET = 99_999_999_999;

// v3: sınırsız para test dönemi kapandı (DEV_UNLIMITED_MONEY=false). O dönemde
// şişmiş cüzdan ve bedava alınmış eşyalar taşınmasın diye anahtarlar yükseltildi;
// herkes gerçek ekonomiyle sıfırdan başlar.
const WALLET_KEY = '@gamemoney/wallet_v3';
const OWNED_KEY = '@gamemoney/owned_v3';

interface Economy {
  /** Harcanabilir birikim (TL) */
  wallet: number;
  /** Satın alınmış eşya id'leri (düz liste) */
  owned: string[];
  addEarnings: (tl: number) => void;
  /**
   * Başarılıysa true döner ve parayı düşer. Ön şartlar ve para burada da
   * denetlenir (UI yalnızca gösterim için progress.checkBuy kullanır).
   */
  buy: (id: string) => boolean;
  /** Cüzdanı ve satın alınan her şeyi sıfırlar */
  resetProgress: () => void;
}

const Ctx = createContext<Economy | null>(null);

export function EconomyProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const walletRef = useRef(0);
  const ownedRef = useRef<string[]>([]);
  const hydratedRef = useRef(false);

  const persist = useCallback(() => {
    // Diskten okuma bitmeden yazma: eski kayıt yarım veriyle ezilmesin
    if (!hydratedRef.current) return;
    // Test modunda şişirilmiş cüzdanı diske yazma; gerçek kayıt bozulmasın
    if (!DEV_UNLIMITED_MONEY) {
      AsyncStorage.setItem(WALLET_KEY, String(walletRef.current)).catch(() => {});
    }
    AsyncStorage.setItem(OWNED_KEY, JSON.stringify(ownedRef.current)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      let stored = 0;
      let storedOwned: string[] = [];
      try {
        const [w, o] = await Promise.all([
          AsyncStorage.getItem(WALLET_KEY),
          AsyncStorage.getItem(OWNED_KEY),
        ]);
        stored = Number(w) || 0;
        // Katalogdan kaldırılmış/bilinmeyen id'ler ayıklanır; kayıt bozulmaz
        storedOwned = o ? (JSON.parse(o) as string[]).filter((id) => typeof id === 'string' && hasItem(id)) : [];
      } catch {}
      // Okuma sürerken gelen kazançlar ref'te birikmiştir; diskten geleni ÜSTÜNE ekle, ezme
      walletRef.current = DEV_UNLIMITED_MONEY ? DEV_WALLET : stored + walletRef.current;
      ownedRef.current = [...storedOwned, ...ownedRef.current.filter((id) => !storedOwned.includes(id))];
      hydratedRef.current = true;
      setWallet(walletRef.current);
      setOwned(ownedRef.current);
      persist();
    })();
  }, [persist]);

  const addEarnings = useCallback(
    (tl: number) => {
      walletRef.current += tl;
      setWallet(walletRef.current);
      persist();
    },
    [persist]
  );

  const buy = useCallback(
    (id: string) => {
      if (!hasItem(id)) return false;
      const item = getItem(id);
      const wallet = DEV_UNLIMITED_MONEY ? Infinity : walletRef.current;
      if (!checkBuy(ownedRef.current, wallet, item).ok) return false;
      if (!DEV_UNLIMITED_MONEY) walletRef.current -= item.price;
      ownedRef.current = [...ownedRef.current, id];
      setWallet(walletRef.current);
      setOwned(ownedRef.current);
      persist();
      return true;
    },
    [persist]
  );

  const resetProgress = useCallback(() => {
    walletRef.current = DEV_UNLIMITED_MONEY ? DEV_WALLET : 0;
    ownedRef.current = [];
    setWallet(walletRef.current);
    setOwned([]);
    persist();
  }, [persist]);

  const value = useMemo<Economy>(
    () => ({ wallet, owned, addEarnings, buy, resetProgress }),
    [wallet, owned, addEarnings, buy, resetProgress]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEconomy(): Economy {
  const v = useContext(Ctx);
  if (!v) throw new Error('EconomyProvider eksik');
  return v;
}
