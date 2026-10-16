#!/usr/bin/env node
/**
 * Para taşı görselleri: src/components/MoneySvg.tsx'teki çizimleri birebir aynı
 * haliyle PNG'ye çevirir (assets/coins/<seviye>.png) ve görsel modüllerini
 * src/components/coinImages.ts'e üretir.
 *
 * Neden: her para onlarca şekil + degradeli bir SVG; her hamlede doğan/birleşen
 * taşlarda bu ağaçları yerel görünüm olarak kurmak UI iş parçacığını kilitliyor
 * (yayın sürümünde %15 takılan kare). Oyun taşları artık hazır resim çizer.
 * Çizim değişirse: npm run coins
 *
 * Yazılar Android'deki gibi Roboto ile çizilir (MoneySvg font belirtmez).
 */
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { globSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/coins');
const MODULES = path.join(ROOT, 'src/components/coinImages.ts');
/** PNG kenarı (px): taş hücresi ~95dp × 2.75 yoğunluk ≈ 260px */
const SIZE = 256;

const dir = mkdtempSync(path.join(tmpdir(), 'coins-'));
await build({
  entryPoints: [path.join(ROOT, 'scripts/coins/entry.tsx')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  outfile: path.join(dir, 'coins.cjs'),
  alias: { 'react-native-svg': path.join(ROOT, 'scripts/coins/svg-shim.tsx') },
  logLevel: 'error',
});
const { coins } = createRequire(import.meta.url)(path.join(dir, 'coins.cjs'));

const font = (w) => globSync(path.join(ROOT, `node_modules/@expo-google-fonts/roboto/**/Roboto_${w}*.ttf`)).find((f) => !f.includes('Italic'));
const faces = [400, 500, 700, 800, 900].map((w) => `@font-face{font-family:Roboto;font-weight:${w};src:url('file://${font(w)}')}`).join('');
const html = `<html><head><style>${faces}
body{margin:0;background:transparent;font-family:Roboto}
svg text{font-family:Roboto}
.c{width:${SIZE}px;height:${SIZE}px}
.c svg{width:100%;height:100%}
</style></head><body>${coins.map((c) => `<div class="c" id="c${c.level}">${c.svg}</div>`).join('')}</body></html>`;
writeFileSync(path.join(dir, 'index.html'), html);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: SIZE, height: SIZE * coins.length, deviceScaleFactor: 1 });
await page.goto(`file://${dir}/index.html`);
await page.evaluate(() => document.fonts.ready);
mkdirSync(OUT, { recursive: true });
for (const c of coins) {
  const el = await page.$(`#c${c.level}`);
  await el.screenshot({ path: path.join(OUT, `${c.level}.png`), omitBackground: true });
}
await browser.close();

writeFileSync(
  MODULES,
  `// ÜRETİLDİ: scripts/render-coins.mjs — elle düzenleme, \`npm run coins\` çalıştır.
// Para taşı görselleri (MoneySvg çizimlerinin birebir PNG'si), seviye → modül.

export const COIN_IMAGES: Record<number, number> = {
${coins.map((c) => `  ${c.level}: require('../../assets/coins/${c.level}.png'),`).join('\n')}
};
`
);
console.log(`yazıldı: ${coins.length} para görseli → ${path.relative(ROOT, OUT)}`);
