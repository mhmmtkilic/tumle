import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS, AchievementDef, AchStat, rewardOf } from './defs';
import { KULCE_LEVEL, levelKind, MAX_LEVEL, TileKind } from '../game/levels';
import { SPAWN_FLOOR_GAP } from '../game/engine';
import { PLACED_ITEMS } from '../economy/items';
import { useEconomy } from '../economy/EconomyContext';
import { playAchievement, playMerge } from '../audio';
import AchievementCelebration from '../components/AchievementCelebration';

// v2: başarımlar sınırsız para döneminde kendiliğinden açılıp ödül ödemiş
// olabilir (birikim/eşya eşikleri). Gerçek ekonomiyle birlikte onlar da sıfırlanır.
const ACH_KEY = '@gamemoney/achievements_v2';
const CLAIMED_KEY = '@gamemoney/achievements_claimed_v2';
const STATS_KEY = '@gamemoney/achievement_stats_v1';

type Stats = Record<AchStat, number>;
const EMPTY_STATS: Stats = { make4: 0, make5: 0, hit5: 0, hit10: 0, earned: 0 };
/** Sayaçlı başarımlar (defs'teki `goal`) */
const GOALS = ACHIEVEMENTS.filter((a) => a.goal);

interface AchApi {
  /** Açılmış başarım id'leri */
  unlocked: string[];
  /** Ödülü cüzdana aktarılmış başarım id'leri */
  claimed: string[];
  /** Açılmış ama ödülü alınmamış başarım sayısı (rozet sayacı) */
  claimable: number;
  /** Ödülü cüzdana ekler; başarım açık ve daha önce alınmamışsa true döner */
  claim: (id: string) => boolean;
  /** Tahtadaki canlı taşların seviyeleri (para/altın/külçe/koleksiyon başarımları) */
  reportBoard: (levels: number[]) => void;
  /** Ulaşılan combo çarpanı ve ham seri uzunluğu */
  reportCombo: (mult: number, streak: number) => void;
  /** Devam eden oyunda birikmiş kazanç */
  reportGameEarned: (tl: number) => void;
  /** Bir hamlenin birleşmeleri: oluşan seviyeler, ham combo serisi, kazanılan TL (sayaçlar) */
  reportMerge: (levels: number[], combo: number, gainedTL: number) => void;
  /** Sayaçlı başarımın ilerlemesi (yoksa null) */
  progressOf: (id: string) => { cur: number; n: number } | null;
  /** Tüm başarımları kilitler ve kaydı siler (ilerleme sıfırlamada kullanılır) */
  resetAchievements: () => void;
}

const Ctx = createContext<AchApi | null>(null);

/**
 * Zincir kilometre taşları: tahtada bu seviyeye ULAŞMAK başarımı açar.
 * Her para türünün ilk taşı ve türün tepe taşı burada temsil edilir.
 */
const MILESTONES: { level: number; id: string }[] = [
  { level: 8, id: 'dolar' }, // 100 Dolar
  { level: 9, id: 'altin' }, // 1 Gr Altın — altın başlıyor
  { level: 11, id: 'tamaltin' }, // Tam Altın
  { level: KULCE_LEVEL, id: 'kulce' }, // Külçe Altın
  { level: 13, id: 'kuyumcu' }, // Yeşim Taşı — mücevher başlıyor
  { level: 17, id: 'elmas' }, // Elmas
  { level: 18, id: 'pembeelmas' }, // Pembe Elmas — mücevherin tepesi
  { level: 19, id: 'elmaseller' }, // Bitcoin — kripto başlıyor
  { level: 20, id: 'sogukdepo' }, // Soğuk Cüzdan
  { level: 21, id: 'define' }, // Hazine Sandığı — epik başlıyor
  { level: 22, id: 'kasa' }, // Banka Kasası
  { level: 23, id: 'rezerv' }, // MB Rezervi
  { level: MAX_LEVEL, id: 'dunyanin' }, // Dünya Serveti
];

/**
 * Tür koleksiyonları: aynı anda tahtada kaç FARKLI seviye gerekiyor.
 * Kripto yalnız iki seviyeden oluşur, bu yüzden eşiği ikidir.
 */
const KIND_SETS: { kind: TileKind; need: number; id: string }[] = [
  { kind: 'note', need: 4, id: 'deste' },
  { kind: 'gold', need: 4, id: 'altinseti' },
  { kind: 'gem', need: 5, id: 'mucevherseti' },
  { kind: 'crypto', need: 2, id: 'sogukzincir' },
];

// Doğum tabanı her hamlede max-SPAWN_FLOOR_GAP'e yükselip altındaki taşları
// yukarı çektiği için tahtada aynı anda en çok SPAWN_FLOOR_GAP+1 farklı seviye
// durabilir. Daha fazlasını isteyen koleksiyon asla açılmaz — bu yüzden burada
// patlar (ulaşılamaz başarım sessizce kalmasın).
for (const s of KIND_SETS) {
  if (s.need > SPAWN_FLOOR_GAP + 1) throw new Error(`Ulaşılamaz koleksiyon: ${s.id}`);
}
for (const id of [...MILESTONES.map((m) => m.id), ...KIND_SETS.map((s) => s.id)]) {
  if (!ACHIEVEMENTS.some((a) => a.id === id)) throw new Error(`Tanımsız başarım tetiği: ${id}`);
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const unlockedRef = useRef<string[]>([]);
  const [claimed, setClaimed] = useState<string[]>([]);
  const claimedRef = useRef<string[]>([]);
  const [toast, setToast] = useState<AchievementDef | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const statsRef = useRef<Stats>(EMPTY_STATS);
  const statsSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<AchievementDef[]>([]);
  const showing = useRef(false);
  const { wallet, owned, addEarnings } = useEconomy();

  useEffect(() => {
    const valid = (raw: string | null) =>
      raw ? (JSON.parse(raw) as string[]).filter((id) => ACHIEVEMENTS.some((a) => a.id === id)) : [];
    Promise.all([AsyncStorage.getItem(ACH_KEY), AsyncStorage.getItem(CLAIMED_KEY), AsyncStorage.getItem(STATS_KEY)])
      .then(([u, c, st]) => {
        if (st) {
          const parsed = JSON.parse(st) as Partial<Stats>;
          statsRef.current = { ...EMPTY_STATS, ...parsed };
          setStats(statsRef.current);
        }
        const ids = valid(u);
        // Yalnız açık olanlar alınmış sayılabilir
        const got = valid(c).filter((id) => ids.includes(id));
        unlockedRef.current = ids;
        claimedRef.current = got;
        setUnlocked(ids);
        setClaimed(got);
      })
      .catch(() => {});
  }, []);

  const claim = useCallback(
    (id: string) => {
      if (!unlockedRef.current.includes(id) || claimedRef.current.includes(id)) return false;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return false;
      claimedRef.current = [...claimedRef.current, id];
      setClaimed(claimedRef.current);
      AsyncStorage.setItem(CLAIMED_KEY, JSON.stringify(claimedRef.current)).catch(() => {});
      addEarnings(rewardOf(def));
      playMerge('gold');
      return true;
    },
    [addEarnings]
  );

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.includes(id)) return;
    unlockedRef.current = [...unlockedRef.current, id];
    setUnlocked(unlockedRef.current);
    AsyncStorage.setItem(ACH_KEY, JSON.stringify(unlockedRef.current)).catch(() => {});
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) {
      // Aynı anda birden fazla açılırsa kutlamalar sırayla gösterilir
      if (showing.current) queue.current.push(def);
      else {
        showing.current = true;
        playAchievement();
        setToast(def);
      }
    }
  }, []);

  const nextToast = useCallback(() => {
    const next = queue.current.shift();
    if (next) {
      playAchievement();
      setToast(next);
    } else {
      showing.current = false;
      setToast(null);
    }
  }, []);

  // Ekonomiye bağlı başarımlar burada, ekranlardan bağımsız izlenir
  useEffect(() => {
    if (owned.length >= 1) unlock('anahtar');
    if (owned.includes('arsa')) unlock('agalik');
    if (PLACED_ITEMS.every((i) => owned.includes(i.id))) unlock('kral');
  }, [owned, unlock]);

  useEffect(() => {
    if (wallet >= 1_000_000) unlock('milyoner');
    if (wallet >= 10_000_000) unlock('holding');
  }, [wallet, unlock]);

  const reportBoard = useCallback(
    (levels: number[]) => {
      let max = 0;
      let kulceCount = 0;
      let goldCount = 0;
      let gemCount = 0;
      const distinct = new Set<number>();
      /** Para türü → o an tahtada duran farklı seviyeler (koleksiyon başarımları) */
      const perKind = new Map<TileKind, Set<number>>();
      for (const lv of levels) {
        if (lv > max) max = lv;
        if (lv >= KULCE_LEVEL) kulceCount++;
        if (lv >= 9) goldCount++;
        if (lv >= 13 && lv <= 18) gemCount++; // Yeşim…Pembe Elmas
        distinct.add(lv);
        const kind = levelKind(lv);
        const set = perKind.get(kind);
        if (set) set.add(lv);
        else perKind.set(kind, new Set([lv]));
      }
      // Zincir: her para türünün ilk ve tepe taşı
      for (const m of MILESTONES) {
        if (max >= m.level) unlock(m.id);
      }
      // Koleksiyon: bir para türünün tamamı aynı anda tahtada
      for (const s of KIND_SETS) {
        if ((perKind.get(s.kind)?.size ?? 0) >= s.need) unlock(s.id);
      }
      // Tahta kompozisyonu (tür karışımından bağımsız)
      if (kulceCount >= 2) unlock('ciftekulce');
      if (goldCount >= 4) unlock('altincag');
      if (gemCount >= 3) unlock('mucevherkutusu');
      // Tahtada aynı anda en çok SPAWN_FLOOR_GAP+1 (=8) farklı seviye durabilir
      if (distinct.size >= SPAWN_FLOOR_GAP + 1) unlock('numizmat');
    },
    [unlock]
  );

  const reportCombo = useCallback(
    (_mult: number, streak: number) => {
      if (streak >= 15) unlock('serimanyagi');
    },
    [unlock]
  );

  const reportMerge = useCallback(
    (levels: number[], combo: number, gainedTL: number) => {
      const s = { ...statsRef.current };
      for (const lv of levels) {
        if (lv === 4) s.make4++;
        if (lv === 5) s.make5++;
      }
      // Seri ×5'e / ×10'a ilk ulaştığı hamle sayılır (üstünde kalmak saymaz)
      if (combo === 5) s.hit5++;
      if (combo === 10) s.hit10++;
      s.earned += gainedTL;
      statsRef.current = s;
      setStats(s);
      // Her hamlede diske yazılmaz; kısa aralıkla toplanır
      if (statsSave.current) clearTimeout(statsSave.current);
      statsSave.current = setTimeout(() => AsyncStorage.setItem(STATS_KEY, JSON.stringify(statsRef.current)).catch(() => {}), 800);
      for (const g of GOALS) if (s[g.goal!.stat] >= g.goal!.n) unlock(g.id);
    },
    [unlock]
  );

  const progressOf = useCallback(
    (id: string) => {
      const g = GOALS.find((a) => a.id === id)?.goal;
      return g ? { cur: Math.min(stats[g.stat], g.n), n: g.n } : null;
    },
    [stats]
  );

  const reportGameEarned = useCallback(
    (tl: number) => {
      if (tl >= 100_000) unlock('boga');
      if (tl >= 1_000_000) unlock('hiper');
    },
    [unlock]
  );

  const resetAchievements = useCallback(() => {
    unlockedRef.current = [];
    claimedRef.current = [];
    setUnlocked([]);
    setClaimed([]);
    setToast(null);
    queue.current = [];
    showing.current = false;
    statsRef.current = EMPTY_STATS;
    setStats(EMPTY_STATS);
    AsyncStorage.multiRemove([ACH_KEY, CLAIMED_KEY, STATS_KEY]).catch(() => {});
  }, []);

  const claimable = unlocked.filter((id) => !claimed.includes(id)).length;

  return (
    <Ctx.Provider value={{ unlocked, claimed, claimable, claim, reportBoard, reportCombo, reportGameEarned, reportMerge, progressOf, resetAchievements }}>
      <View style={styles.fill}>
        {children}
        {toast ? <AchievementCelebration key={toast.id} def={toast} onDone={nextToast} /> : null}
      </View>
    </Ctx.Provider>
  );
}

export function useAchievements(): AchApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('AchievementsProvider eksik');
  return v;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
