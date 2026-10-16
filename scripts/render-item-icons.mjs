#!/usr/bin/env node
/**
 * Mağaza için eşya görselleri: assets/3d/mahalle.glb'deki her eşyayı
 * izometrik çizip assets/items/<id>.png olarak yazar; görsel modülleri
 * src/components/itemIcons.ts'e üretilir. Chrome başsız çalışır.
 *
 * Kullanım: npm run icons   (önce: npm run mahalle)
 */
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ICONS = path.join(ROOT, 'assets/items');
const REQUIRES = path.join(ROOT, 'src/components/itemIcons.ts');
const dir = mkdtempSync(path.join(tmpdir(), 'icons-'));

copyFileSync(path.join(ROOT, 'assets/3d/mahalle.glb'), path.join(dir, 'mahalle.glb'));
await build({
  entryPoints: [path.join(ROOT, 'scripts/preview/icons-entry.ts')],
  bundle: true,
  format: 'esm',
  outfile: path.join(dir, 'bundle.js'),
  logLevel: 'error',
});
writeFileSync(path.join(dir, 'index.html'), '<!doctype html><body style="margin:0"><script type="module" src="bundle.js"></script></body>');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('sayfa hatası:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('konsol:', m.text()));
await page.goto(`file://${dir}/index.html`);
await page.waitForFunction('Array.isArray(window.results)', { timeout: 60000 });
const results = await page.evaluate('window.results');
await browser.close();

mkdirSync(ICONS, { recursive: true });
for (const r of results) {
  writeFileSync(path.join(ICONS, `${r.id}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
}
writeFileSync(
  REQUIRES,
  `// ÜRETİLDİ: scripts/render-item-icons.mjs — elle düzenleme, \`npm run icons\` çalıştır.
// Eşya görselleri (Kenney modellerinden render, assets/items).

export const ITEM_ICONS: Record<string, number> = {
${results.map((r) => `  ${r.id}: require('../../assets/items/${r.id}.png'),`).join('\n')}
};
`
);
console.log(`yazıldı: ${results.length} ikon → ${path.relative(ROOT, ICONS)}`);
