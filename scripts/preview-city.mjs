#!/usr/bin/env node
/**
 * Mahalle stil önizlemesi: aynı haritayı Kenney ve KayKit paketleriyle çizip
 * PNG olarak kaydeder (Chrome başsız çalışır). Paketler .kits/ altında olmalı.
 * Kullanım: node scripts/preview-city.mjs <çıktı-klasörü> [stil] [yaw]
 */
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { PNG } from 'pngjs';

const outDir = process.argv[2] ?? '.';
const styles = process.argv[3] ? [process.argv[3]] : ['kenney', 'kaykit'];
const yaws = process.argv[4] ? [Number(process.argv[4])] : [35, 215];
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KITS = path.join(ROOT, '.kits');
const dir = mkdtempSync(path.join(tmpdir(), 'city-'));

cpSync(path.join(KITS, 'suburban/Models/GLB format'), path.join(dir, 'suburban'), { recursive: true });
cpSync(path.join(KITS, 'roads/Models/GLB format'), path.join(dir, 'roads'), { recursive: true });
cpSync(path.join(KITS, 'cars/Models/GLB format'), path.join(dir, 'cars'), { recursive: true });

/** Kenney paletleri soluk: renk görseli HSL doygunluğu artırılarak canlandırılır */
const SATURATE = Number(process.env.SATURATE ?? 1.5);
for (const kit of ['suburban', 'roads', 'cars']) {
  const file = path.join(dir, kit, 'Textures/colormap.png');
  const png = PNG.sync.read(readFileSync(file));
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = [png.data[i] / 255, png.data[i + 1] / 255, png.data[i + 2] / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) continue;
    const d = max - min;
    let s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
    s = Math.min(1, s * SATURATE);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    png.data[i] = Math.round(f(h + 1 / 3) * 255);
    png.data[i + 1] = Math.round(f(h) * 255);
    png.data[i + 2] = Math.round(f(h - 1 / 3) * 255);
  }
  writeFileSync(file, PNG.sync.write(png));
}
cpSync(path.join(KITS, 'kaykit-city/KayKit-City-Builder-Bits-1.0-main/addons/kaykit_city_builder_bits/Assets/gltf'), path.join(dir, 'kaykit'), { recursive: true });

await build({
  entryPoints: [path.join(ROOT, 'scripts/preview/city-entry.ts')],
  bundle: true,
  format: 'esm',
  outfile: path.join(dir, 'bundle.js'),
  logLevel: 'error',
});
writeFileSync(path.join(dir, 'index.html'), '<!doctype html><body style="margin:0"><script type="module" src="bundle.js"></script></body>');

mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'],
});
for (const style of styles) {
  for (const yaw of yaws) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('sayfa hatası:', e.message));
    page.on('console', (m) => m.type() === 'error' && console.error('konsol:', m.text()));
    await page.setViewport({ width: 900, height: 1300 });
    await page.goto(`file://${dir}/index.html?style=${style}&yaw=${yaw}`);
    await page.waitForFunction('window.done === true', { timeout: 30000 });
    const out = path.join(outDir, `${style}-${yaw}.png`);
    await (await page.$('canvas')).screenshot({ path: out });
    await page.close();
    console.log('yazıldı:', out);
  }
}
await browser.close();
