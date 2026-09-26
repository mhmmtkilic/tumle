/*
 * İzometrik (2:1) çizim yardımcıları — mahalle ve oda çizimlerinin ortak dili.
 * Eksenler: u = sağ-arka (1, -0.5), v = sol-arka (-1, -0.5), yükseklik = yukarı.
 * Kutunun orijini ön-alt köşedir.
 */

export type P = [number, number];
export const pts = (l: P[]) => l.map((p) => `${p[0]},${p[1]}`).join(' ');

export function box(a: number, b: number, h: number) {
  return {
    right: pts([[0, 0], [a, -a / 2], [a, -a / 2 - h], [0, -h]]),
    left: pts([[0, 0], [-b, -b / 2], [-b, -b / 2 - h], [0, -h]]),
    top: pts([[0, -h], [a, -a / 2 - h], [a - b, -(a + b) / 2 - h], [-b, -b / 2 - h]]),
  };
}

/**
 * Tabana oturan gölge: yapının ayak izi elması, her yönde `p` kadar genişletilmiş.
 * Kutuyla aynı orijine (ön-alt köşe) göre çizilir — yapı zemine yapışık görünür.
 */
export function footprint(a: number, b: number, p: number): string {
  return pts([
    [0, p],
    [a + p, p - (a + 2 * p) / 2 + p / 2],
    [a - b, -(a + b) / 2 - p],
    [-(b + p), p - (b + 2 * p) / 2 + p / 2],
  ]);
}

export const SHADOW = 'rgba(38,51,44,0.14)';

/** Sağ yüzeye pencere/kapı: u0 = yüzey boyunca konum, y0 = zeminden yükseklik */
export const rQuad = (u0: number, y0: number, uw: number, hh: number) =>
  pts([
    [u0, -u0 / 2 - y0],
    [u0 + uw, -(u0 + uw) / 2 - y0],
    [u0 + uw, -(u0 + uw) / 2 - y0 - hh],
    [u0, -u0 / 2 - y0 - hh],
  ]);

/** Sol yüzeye pencere/kapı: v0 = yüzey boyunca konum, y0 = zeminden yükseklik */
export const lQuad = (v0: number, y0: number, vw: number, hh: number) =>
  pts([
    [-v0, -v0 / 2 - y0],
    [-(v0 + vw), -(v0 + vw) / 2 - y0],
    [-(v0 + vw), -(v0 + vw) / 2 - y0 - hh],
    [-v0, -v0 / 2 - y0 - hh],
  ]);

/**
 * Yükseltilmiş kutu: zeminden `z` yukarıda duran box (raf, duvar paneli).
 * Aynı orijin; tüm noktalar z kadar yukarı kayar.
 */
export function boxAt(a: number, b: number, h: number, z: number) {
  const s = box(a, b, h);
  const shift = (poly: string) =>
    poly
      .split(' ')
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return `${x},${y - z}`;
      })
      .join(' ');
  return { right: shift(s.right), left: shift(s.left), top: shift(s.top) };
}

/** Rengi koyulaştır/açıklaştır (hex, -1..1) */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
