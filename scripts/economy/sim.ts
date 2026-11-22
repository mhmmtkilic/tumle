/*
 * Ekonomi kalibrasyonu: oyunun GERÇEK motoru, ödeme tablosu, fiyatları ve
 * başarım ödülleriyle botlar oynatır, sonra oyuncu kariyeri simüle eder.
 *
 *   npm run economy            # tam koşu (10 çekirdekte ~1 dk)
 *   npm run economy -- quick   # hızlı göz atma (az oyun)
 *   npm run economy -- cached  # son tam koşunun oyunlarıyla yalnız kariyer (anında)
 *
 * Botlar:
 *   zayıf  — tek adım sezgisel; çoğu oyunda 256-512 görür (gündelik oyuncu)
 *   orta   — usta botun %3 rastgele hamle yapanı; ~%30 Külçe (düzenli oyuncu)
 *   usta   — beklenti-maks derinlik 2; ~%55 Külçe (iyi 2048 oyuncusu)
 *
 * Kariyer: her oyuncu bot oyunlarından rastgele çekilen oyunları art arda
 * oynar, kazancını ve açtığı başarımların ödülünü cüzdana ekler, alabildiği
 * ilk eşyayı alır. Tablo, her eşyanın kaçıncı oyunda alındığının medyanıdır.
 * Tahta kompozisyonu başarımları (koleksiyonlar) seviyeye göre yaklaşıktır.
 * Mahalle çarpanı (kazanç ×) kariyerde uygulanır, başarım ödülü de çarpanla ölçeklenir; botlar Geri Al / Çekiç
 * kullanmaz, araçların etkisi tabloya dahil değildir (gerçek tempo biraz daha hızlı).
 */
import { fork } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CACHE = join(__dirname, 'economy-games.json');
import { aliveTiles, canMove, denominate, Direction, move, newGame, spawnFloor, spawnRandom, Tile } from '../../src/game/engine';
import { moveEarnings } from '../../src/game/payout';
import { earnMultiplier, ITEMS } from '../../src/economy/items';
import { ACHIEVEMENTS, REWARD_BY_TIER } from '../../src/achievements/defs';

type Bot = 'zayıf' | 'orta' | 'usta';
interface GameRec {
  moves: number;
  maxL: number;
  earned: number;
  make4: number;
  make5: number;
  hit5: number;
  hit10: number;
  streak: number;
}

// ---- tekrarlanabilir rastgelelik -------------------------------------------
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DIRS: Direction[] = ['down', 'left', 'right', 'up'];
const maxOf = (t: Tile[]) => aliveTiles(t).reduce((m, x) => Math.max(m, x.level), 0);

function gridOf(t: Tile[]): number[][] {
  const g = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (const x of aliveTiles(t)) g[x.row][x.col] = x.level;
  return g;
}

// ---- zayıf bot: tek adım, kaba sezgisel ------------------------------------
function heuristic(t: Tile[]): number {
  const g = gridOf(t);
  let empty = 0;
  let mono = 0;
  let smooth = 0;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!g[r][c]) empty++;
      if (c < 3) {
        mono += g[r][c] >= g[r][c + 1] ? g[r][c] : -g[r][c + 1] * 1.5;
        if (g[r][c] && g[r][c + 1]) smooth -= Math.abs(g[r][c] - g[r][c + 1]);
      }
      if (r < 3) mono += g[r + 1][c] >= g[r][c] ? g[r + 1][c] : -g[r][c] * 1.5;
    }
  return empty * 10 + mono + smooth * 1.5 + g[3][0] * 4;
}

function weakPick(t: Tile[], rng: () => number): Direction | null {
  let best: Direction | null = null;
  let bs = -Infinity;
  for (const d of DIRS) {
    const r = move(t, d);
    if (!r.moved) continue;
    let s = 0;
    for (let k = 0; k < 6; k++) s += heuristic(denominate(spawnRandom(r.tiles, 4, rng)));
    s = s / 6 + r.mergedLevels.length * 2;
    if (s > bs) {
      bs = s;
      best = d;
    }
  }
  return best;
}

// ---- usta bot: beklenti-maks, yılan ağırlıkları --------------------------------
const SNAKE = [
  [0, 1, 2, 3],
  [7, 6, 5, 4],
  [8, 9, 10, 11],
  [15, 14, 13, 12],
].map((r) => r.map((x) => 4 ** (x / 2)));

function evaluate(t: Tile[]): number {
  const f = spawnFloor(t);
  const g = gridOf(t);
  let s = 0;
  let e = 0;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!g[r][c]) e++;
      else s += SNAKE[r][c] * 2 ** (g[r][c] - f);
    }
  return s * (1 + e * 0.1);
}

/** Olası tüm doğuşlar (hücre × taban/taban+1) ve olasılıkları */
function spawns(t: Tile[]): [Tile[], number][] {
  const alive = aliveTiles(t);
  const occ = new Set(alive.map((x) => x.row * 4 + x.col));
  const cells: number[] = [];
  for (let i = 0; i < 16; i++) if (!occ.has(i)) cells.push(i);
  const f = spawnFloor(t);
  const out: [Tile[], number][] = [];
  for (const i of cells)
    for (const [lv, p] of [
      [f, 0.9],
      [f + 1, 0.1],
    ]) {
      const tile: Tile = { id: -1, level: lv, row: Math.floor(i / 4), col: i % 4, spawned: true, popped: false, dying: false };
      out.push([denominate([...alive, tile]), p / cells.length]);
    }
  return out;
}

function search(t: Tile[], depth: number): number {
  if (depth === 0) return evaluate(t);
  let best = -1;
  for (const d of DIRS) {
    const r = move(t, d);
    if (!r.moved) continue;
    const sp = spawns(r.tiles);
    const step = Math.ceil(sp.length / 6);
    const sub = sp.filter((_, i) => i % step === 0);
    const tot = sub.reduce((a, b) => a + b[1], 0);
    let s = 0;
    for (const [n, p] of sub) s += (p / tot) * search(n, depth - 1);
    if (s > best) best = s;
  }
  return Math.max(best, 0);
}

function strongPick(t: Tile[]): Direction | null {
  let best: Direction | null = null;
  let bs = -1;
  for (const d of DIRS) {
    const r = move(t, d);
    if (!r.moved) continue;
    let s = 0;
    for (const [n, p] of spawns(r.tiles)) s += p * search(n, 1);
    if (s > bs) {
      bs = s;
      best = d;
    }
  }
  return best;
}

// ---- bir oyun -----------------------------------------------------------------
function playGame(bot: Bot, rng: () => number): GameRec {
  let t = newGame(4, rng);
  const rec: GameRec = { moves: 0, maxL: 0, earned: 0, make4: 0, make5: 0, hit5: 0, hit10: 0, streak: 0 };
  let combo = 0;
  while (canMove(t) && rec.moves < 8000) {
    let d: Direction | null;
    if (bot === 'zayıf') d = weakPick(t, rng);
    else if (bot === 'orta' && rng() < 0.03) {
      const ok = DIRS.filter((x) => move(t, x).moved);
      d = ok.length ? ok[Math.floor(rng() * ok.length)] : null;
    } else d = strongPick(t);
    if (!d) break;
    const r = move(t, d);
    const next = denominate(spawnRandom(r.tiles, 4, rng));
    rec.moves++;
    if (r.mergedLevels.length) {
      combo++;
      rec.earned += moveEarnings(r.mergedLevels, combo, maxOf(next));
      for (const lv of r.mergedLevels) {
        if (lv === 4) rec.make4++;
        if (lv === 5) rec.make5++;
      }
      if (combo === 5) rec.hit5++;
      if (combo === 10) rec.hit10++;
      rec.streak = Math.max(rec.streak, combo);
    } else combo = 0;
    t = next;
    rec.maxL = Math.max(rec.maxL, maxOf(t));
  }
  return rec;
}

// ---- kariyer ----------------------------------------------------------------------
/** AchievementsContext'teki eşiklerin kopyası — orada değişirse burada da değiştir */
const T = { make4: 100, make5: 60, hit5: 50, hit10: 20, kumbara: 5_000_000, boga: 50_000_000, hiper: 1_000_000_000, milyoner: 10_000_000, holding: 1_000_000_000 };
/** Seviyeye ulaşınca açılan başarımlar (koleksiyonlar yaklaşık: türün tepesine ulaşmak) */
const LEVEL_ACH: [number, string[]][] = [
  [8, ['dolar']],
  [9, ['altin', 'deste']],
  [11, ['tamaltin', 'numizmat']],
  [12, ['kulce']],
  [13, ['kuyumcu', 'altinseti', 'ciftekulce', 'altincag']],
  [16, ['mucevherkutusu']],
  [17, ['elmas']],
  [18, ['pembeelmas', 'mucevherseti']],
  [19, ['elmaseller']],
  [20, ['sogukdepo', 'sogukzincir']],
  [21, ['define']],
  [22, ['kasa']],
  [23, ['rezerv']],
  [24, ['dunyanin']],
];
const reward = (id: string) => REWARD_BY_TIER[ACHIEVEMENTS.find((a) => a.id === id)!.tier];

function career(games: GameRec[], rng: () => number) {
  const owned = new Set<string>();
  const boughtAt: Record<string, number> = {};
  const ach = new Set<string>();
  let wallet = 0;
  let earned = 0;
  let rewards = 0;
  const c = { make4: 0, make5: 0, hit5: 0, hit10: 0 };
  const unlock = (id: string) => {
    if (ach.has(id)) return;
    ach.add(id);
    const r = reward(id) * earnMultiplier([...owned]);
    wallet += r;
    rewards += r;
  };
  for (let g = 1; g <= 2000 && owned.size < ITEMS.length; g++) {
    const s = games[Math.floor(rng() * games.length)];
    // Bot oyunları çarpansız kaydedilir; mahalle çarpanı kazancı doğrusal büyütür
    const gameEarned = s.earned * earnMultiplier([...owned]);
    wallet += gameEarned;
    earned += gameEarned;
    c.make4 += s.make4;
    c.make5 += s.make5;
    c.hit5 += s.hit5;
    c.hit10 += s.hit10;
    for (const [lv, ids] of LEVEL_ACH) if (s.maxL >= lv) ids.forEach(unlock);
    if (c.make4 >= T.make4) unlock('madeni');
    if (c.make5 >= T.make5) unlock('banknot');
    if (c.hit5 >= T.hit5) unlock('zincir');
    if (c.hit10 >= T.hit10) unlock('efsane');
    if (earned >= T.kumbara) unlock('kumbara');
    if (gameEarned >= T.boga) unlock('boga');
    if (gameEarned >= T.hiper) unlock('hiper');
    if (s.streak >= 15) unlock('serimanyagi');
    if (wallet >= T.milyoner) unlock('milyoner');
    if (wallet >= T.holding) unlock('holding');
    for (let bought = true; bought; ) {
      bought = false;
      for (const it of ITEMS) {
        if (owned.has(it.id) || (it.requires ?? []).some((r) => !owned.has(r)) || wallet < it.price) continue;
        wallet -= it.price;
        owned.add(it.id);
        boughtAt[it.id] = g;
        unlock('anahtar');
        if (it.id === 'arsa') unlock('agalik');
        bought = true;
        break;
      }
    }
    if (owned.size === ITEMS.length) unlock('kral');
  }
  return { boughtAt, rewardShare: rewards / (rewards + earned) };
}

// ---- rapor ---------------------------------------------------------------------------
const fmt = (v: number) =>
  v >= 1e9 ? `₺${(v / 1e9).toFixed(1)} Mr` : v >= 1e6 ? `₺${(v / 1e6).toFixed(1)} Mn` : v >= 1e3 ? `₺${Math.round(v / 1e3)} bin` : `₺${Math.round(v)}`;
const quant = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];

async function main() {
  const quick = process.argv.includes('quick');
  const plan: [Bot, number][] = quick
    ? [
        ['zayıf', 30],
        ['orta', 8],
        ['usta', 8],
      ]
    : [
        ['zayıf', 200],
        ['orta', 120],
        ['usta', 90],
      ];
  // `cached`: motor ve ödeme tablosu değişmediyse son tam koşunun oyunlarıyla
  // yalnız kariyeri (fiyat/çarpan/ödül) yeniden hesaplar — saniyeler sürer
  if (process.argv.includes('cached') && existsSync(CACHE)) {
    report(JSON.parse(readFileSync(CACHE, 'utf8')));
    return;
  }
  // Usta/orta yavaş: oyunlar çekirdeklere bölünür
  const jobs: Promise<GameRec[]>[] = [];
  const byBot: Record<string, Promise<GameRec[]>[]> = {};
  plan.forEach(([bot, n], bi) => {
    const parts = bot === 'zayıf' ? 2 : Math.min(n, 4);
    for (let p = 0; p < parts; p++) {
      const count = Math.floor(n / parts) + (p < n % parts ? 1 : 0);
      const job = new Promise<GameRec[]>((res, rej) => {
        const child = fork(__filename, ['play', bot, String(count), String(1000 * bi + p + 1)], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
        child.on('message', (m) => res(m as GameRec[]));
        child.on('error', rej);
      });
      jobs.push(job);
      (byBot[bot] ??= []).push(job);
    }
  });
  await Promise.all(jobs);
  const results: Record<string, GameRec[]> = {};
  for (const [bot] of plan) results[bot] = (await Promise.all(byBot[bot])).flat();
  if (!quick) writeFileSync(CACHE, JSON.stringify(results));
  report(results);
}

function report(results: Record<string, GameRec[]>) {
  console.log('\nOYUN BAŞINA');
  for (const [bot, gs] of Object.entries(results)) {
    const e = gs.map((g) => g.earned);
    const reach = (lv: number) => `${Math.round((gs.filter((g) => g.maxL >= lv).length / gs.length) * 100)}%`;
    console.log(
      `${bot.padEnd(6)} ${String(gs.length).padStart(3)} oyun · ort. ${Math.round(gs.reduce((a, g) => a + g.moves, 0) / gs.length)} hamle · kazanç medyan ${fmt(quant(e, 0.5))}, ort. ${fmt(e.reduce((a, b) => a + b, 0) / e.length)}, p90 ${fmt(quant(e, 0.9))}`
    );
    console.log(`       ulaşma: Külçe(12) ${reach(12)} · Safir(16) ${reach(16)} · Bitcoin(19) ${reach(19)} · Sandık(21) ${reach(21)} · Dünya(24) ${reach(24)}`);
  }

  const rng = seeded(4242);
  const careers = Object.fromEntries(Object.entries(results).map(([bot, gs]) => [bot, Array.from({ length: 300 }, () => career(gs, rng))]));
  console.log('\nMAĞAZA TEMPOSU (eşyanın alındığı oyun no, medyan)');
  console.log(`${'eşya'.padEnd(18)}${'fiyat'.padStart(12)}${Object.keys(careers).map((b) => b.padStart(8)).join('')}`);
  for (const it of ITEMS) {
    const cols = Object.values(careers).map((cs) => {
      const got = cs.map((c) => c.boughtAt[it.id]).filter((x) => x != null);
      return (got.length < cs.length / 2 ? '>2000' : String(quant(got, 0.5))).padStart(8);
    });
    console.log(`${it.name.padEnd(18)}${fmt(it.price).padStart(12)}${cols.join('')}`);
  }
  console.log(
    `\nBaşarım ödüllerinin gelirdeki payı: ${Object.entries(careers)
      .map(([b, cs]) => `${b} %${Math.round(quant(cs.map((c) => c.rewardShare), 0.5) * 100)}`)
      .join(' · ')}`
  );
}

if (process.argv[2] === 'play') {
  const [, , , bot, n, seed] = process.argv;
  const rng = seeded(Number(seed));
  const out: GameRec[] = [];
  for (let i = 0; i < Number(n); i++) out.push(playGame(bot as Bot, rng));
  process.send!(out, () => process.exit(0));
} else {
  main();
}
