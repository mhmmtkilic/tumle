/**
 * Tümle 2026 logosu (SVG): oyundaki taşlar gibi altın kare "para taşı" üstünde
 * ₺ işareti + Baloo 2 yazı. render-logo.mjs çizer.
 *
 *  tile(...)    yalnız taş (yerel açılış, uyarlanabilir ikon)
 *  lockup(...)  taş + "Tümle" + "2026" (JS açılış ekranı)
 *  icon(...)    gökyüzü zeminde büyük taş (uygulama ikonu, kenardan kenara)
 */

const OUT = '#1B2238';
const S = 1024;

const defs = (font) => `
  <style>@font-face{font-family:G;src:url('file://${font}')}</style>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE36B"/><stop offset="1" stop-color="#FFB21E"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF08A"/><stop offset="0.55" stop-color="#FFC531"/><stop offset="1" stop-color="#F08A12"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E9BEA"/><stop offset="1" stop-color="#9ED8FF"/></linearGradient>`;

/** Altın para taşı: koyu kontur, altta kalınlık, üstte parlak bant, ortada ₺. (x, y) sol üst, k ölçek (1 = 200 birim) */
function tileG(x, y, k) {
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <rect x="0" y="16" width="200" height="200" rx="46" fill="${OUT}"/>
    <rect x="0" y="0" width="200" height="200" rx="46" fill="${OUT}"/>
    <rect x="10" y="10" width="180" height="180" rx="38" fill="url(#face)"/>
    <rect x="26" y="20" width="148" height="44" rx="22" fill="#FFFFFF" opacity="0.38"/>
    <text x="100" y="156" font-size="150" text-anchor="middle" font-family="G" fill="#FFFFFF" stroke="${OUT}" stroke-width="18" stroke-linejoin="round" paint-order="stroke">₺</text>
  </g>`;
}

/** Konturlu, alttan kabartmalı oyun yazısı */
function word(txt, cx, y, size, fill) {
  const sw = size * 0.2;
  return `
    <text x="${cx}" y="${y + size * 0.09}" font-size="${size}" text-anchor="middle" font-family="G" fill="${OUT}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round">${txt}</text>
    <text x="${cx}" y="${y}" font-size="${size}" text-anchor="middle" font-family="G" fill="${fill}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
}

const svg = (font, body, w = S, h = S) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs(font)}</defs>${body}</svg>`;

/** Yalnız taş, kutunun ortasında (`fill` = kutunun ne kadarını kaplar) */
export function tile({ font, fill = 0.8 }) {
  const k = (S * fill) / 216;
  const size = 200 * k;
  return svg(font, tileG((S - size) / 2, (S - 216 * k) / 2, k));
}

/** Taş + ad: açılış ekranı */
export function lockup({ font }) {
  const k = 2.2;
  const size = 200 * k;
  return svg(font, `${tileG((S - size) / 2, 40, k)}${word('Tümle', S / 2, 690, 220, '#FFFFFF')}${word('2026', S / 2, 905, 170, 'url(#gold)')}`);
}

/** Uygulama ikonu: gökyüzü zemin, büyük taş */
export function icon({ font }) {
  const k = 3.4;
  const size = 200 * k;
  return svg(font, `<rect width="${S}" height="${S}" fill="url(#sky)"/>${tileG((S - size) / 2, (S - 216 * k) / 2, k)}`);
}
