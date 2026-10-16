#!/usr/bin/env node
/**
 * Logo ve ikon dosyalarını tasarımdan üretir (scripts/logo/logo.mjs):
 *   assets/logo.png                    1024, taş + "Tümle 2026", şeffaf (JS açılış ekranı)
 *   assets/icon.png                    1024, gökyüzü zeminde taş (uygulama ikonu)
 *   assets/splash-logo.png             1200, yalnız taş, şeffaf (iOS yerel açılış)
 *   assets/splash-logo-android.png     1152, yalnız taş, şeffaf (Android yerel açılış; sistem daire içine alır)
 *   assets/android-icon-foreground.png 1024, yalnız taş, güvenli alanda (uyarlanabilir ikon)
 * Kullanım: npm run logo [önizleme.png]
 *   (ikon / yerel açılış değişikliği için bir kez yerel derleme gerekir)
 */
import puppeteer from 'puppeteer-core';
import { globSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { icon, lockup, tile } from './logo/logo.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const font = globSync(path.join(ROOT, 'node_modules/@expo-google-fonts/baloo-2/**/Baloo2_800ExtraBold.ttf'))[0];
const dir = mkdtempSync(path.join(tmpdir(), 'logo-'));
const preview = process.argv[2];

const jobs = [
  { out: 'assets/logo.png', size: 1024, svg: lockup({ font }) },
  { out: 'assets/icon.png', size: 1024, svg: icon({ font }) },
  { out: 'assets/splash-logo.png', size: 1200, svg: tile({ font, fill: 0.62 }) },
  // Android 12+ açılış simgesi daireyle kırpılır: taş dairenin içinde kalsın
  { out: 'assets/splash-logo-android.png', size: 1152, svg: tile({ font, fill: 0.56 }) },
  // Uyarlanabilir ikon: içerik ortadaki ~%66'lık güvenli alanda, zemin rengi app.json'da
  { out: 'assets/android-icon-foreground.png', size: 1024, svg: tile({ font, fill: 0.5 }) },
];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();

if (preview) {
  // Önizleme: açılış ekranı (telefon oranı) + ikon + Android açılışı, dosya yazmadan
  const shrink = (s, w) => s.replace('width="1024" height="1024"', `width="${w}" height="${w}"`);
  const html = `<body style="margin:0;display:flex;gap:24px;padding:24px;background:#ddd;align-items:center;font-family:sans-serif">
    <div style="width:360px;height:780px;border-radius:28px;overflow:hidden;background:linear-gradient(#4DA8F0,#BDE6FF);display:flex;align-items:center;justify-content:center">${shrink(lockup({ font }), 300)}</div>
    <div style="width:360px;height:780px;border-radius:28px;background:#4DA8F0;display:flex;align-items:center;justify-content:center"><div style="width:288px;height:288px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center">${shrink(tile({ font, fill: 0.56 }), 288)}</div></div>
    <div style="display:flex;flex-direction:column;gap:20px;align-items:center"><div style="width:180px;height:180px;border-radius:40px;overflow:hidden">${shrink(icon({ font }), 180)}</div><div style="width:180px;height:180px;border-radius:50%;overflow:hidden;background:#4DA8F0">${shrink(tile({ font, fill: 0.5 }), 180)}</div></div>
  </body>`;
  writeFileSync(path.join(dir, 'p.html'), html);
  await page.setViewport({ width: 1000, height: 830 });
  await page.goto('file://' + path.join(dir, 'p.html'));
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: preview });
  console.log('önizleme:', preview);
} else {
  for (const j of jobs) {
    const inner = Math.round(j.size * (j.inset ?? 1));
    const svg = j.svg.replace('width="1024" height="1024"', `width="${inner}" height="${inner}"`);
    writeFileSync(
      path.join(dir, 'i.html'),
      `<body style="margin:0;background:transparent"><div id="c" style="width:${j.size}px;height:${j.size}px;display:flex;align-items:center;justify-content:center">${svg}</div></body>`
    );
    await page.setViewport({ width: j.size, height: j.size });
    await page.goto('file://' + path.join(dir, 'i.html'));
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 200));
    await (await page.$('#c')).screenshot({ path: path.join(ROOT, j.out), omitBackground: true });
    console.log('yazıldı:', j.out);
  }
}
await browser.close();
