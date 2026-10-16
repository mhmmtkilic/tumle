#!/usr/bin/env node
/**
 * Combo patlaması görselleri: oyun fontuyla kalın lacivert konturlu, alttan
 * kabartmalı yazılar ve efekt parçaları PNG olarak assets/combo/ altına yazılır;
 * modül listesi src/components/comboImages.ts'e üretilir.
 *
 * Neden PNG: RN yazıya kontur çizemiyor; resim hem birebir tasarımdaki gibi
 * görünür hem de animasyonda en ucuz katmandır (paralarda olduğu gibi).
 * Tasarım değişirse: npm run combo
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { globSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/combo');
const MODULES = path.join(ROOT, 'src/components/comboImages.ts');
const font = globSync(path.join(ROOT, 'node_modules/@expo-google-fonts/baloo-2/**/Baloo2_800ExtraBold.ttf'))[0];
const OUTLINE = '#1B2238';

/** Çarpan rengi: seri büyüdükçe ısınır (mavi → yeşil → turuncu → mor) */
export const tierColor = (m) => (m >= 10 ? '#B05CFF' : m >= 8 ? '#FF9A3D' : m >= 6 ? '#5BD43A' : '#3FB2F5');

// Yazılar 3x çizilir (ekranda ~1/3 boyutta gösterilir)
const word = (id, text, size, color) => ({ id, html: `<span class="w" style="font-size:${size}px;color:${color}">${text}</span>` });
const items = [
  word('combo', 'COMBO!', 120, '#FFFFFF'),
  ...Array.from({ length: 8 }, (_, i) => word(`x${i + 3}`, `x${i + 3}`, 330, tierColor(i + 3))),
  word('super', 'SÜPER!', 110, '#FFFFFF'),
  word('cilginca', 'ÇILGINCA!', 110, '#FFFFFF'),
  word('efsane', 'EFSANE!', 110, '#FFFFFF'),
  // Işın patlaması: beyaz (oyunda kademe rengiyle boyanır), merkezden dışa solar
  {
    id: 'rays',
    html: `<div style="width:768px;height:768px;background:repeating-conic-gradient(#fff 0 10deg,transparent 10deg 22.5deg);-webkit-mask:radial-gradient(circle,#000 0 16%,rgba(0,0,0,.85) 30%,transparent 68%)"></div>`,
  },
  // Saçılan para: altın, ₺ işaretli
  {
    id: 'coin',
    html: `<div style="width:84px;height:84px;padding:4px"><div style="width:76px;height:76px;border-radius:50%;box-sizing:border-box;border:8px solid ${OUTLINE};background:radial-gradient(circle at 38% 32%,#FFF6B0 0 12%,#FFC531 40%,#E8961A 75%);display:grid;place-items:center;font:800 44px G;color:#B86A06;line-height:1;padding-top:6px">₺</div></div>`,
  },
];

const dir = mkdtempSync(path.join(tmpdir(), 'combo-'));
const html = `<html><head><style>
@font-face{font-family:G;src:url('file://${font}')}
body{margin:0;background:transparent}
.item{display:inline-block;padding:24px 30px 40px}
.w{font-family:G;line-height:1;white-space:nowrap;-webkit-text-stroke:.16em ${OUTLINE};paint-order:stroke fill;filter:drop-shadow(0 .07em 0 ${OUTLINE});display:inline-block}
</style></head><body>${items.map((it) => `<div><div class="item" id="${it.id}">${it.html}</div></div>`).join('')}</body></html>`;
writeFileSync(path.join(dir, 'index.html'), html);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
await page.goto(`file://${dir}/index.html`);
await page.evaluate(() => document.fonts.ready);
mkdirSync(OUT, { recursive: true });
const sizes = {};
for (const it of items) {
  const el = await page.$(`#${it.id}`);
  const box = await el.boundingBox();
  sizes[it.id] = [Math.round(box.width), Math.round(box.height)];
  await el.screenshot({ path: path.join(OUT, `${it.id}.png`), omitBackground: true });
}
await browser.close();

writeFileSync(
  MODULES,
  `// ÜRETİLDİ: scripts/render-combo.mjs — elle düzenleme, \`npm run combo\` çalıştır.
// Combo patlaması görselleri ve piksel boyutları (oyunda 1/3 ölçekte çizilir).

export const COMBO_IMAGES = {
${items.map((it) => `  ${JSON.stringify(it.id)}: { src: require('../../assets/combo/${it.id}.png'), w: ${sizes[it.id][0]}, h: ${sizes[it.id][1]} },`).join('\n')}
} as const;

export type ComboImageId = keyof typeof COMBO_IMAGES;
`
);
console.log(`yazıldı: ${items.length} combo görseli → ${path.relative(ROOT, OUT)}`);
