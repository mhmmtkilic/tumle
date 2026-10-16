#!/usr/bin/env node
/**
 * Renkli oyun ikonlarının önizlemesi: src/components/gameIconSpecs.ts'teki
 * tanımları tek başına ve uygulamadaki gibi kalın butonlar üstünde çizer.
 * Kullanım: node scripts/preview-icons.mjs <çıktı.png>
 */
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { mkdtempSync, writeFileSync, globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const out = process.argv[2] ?? 'icons.png';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = mkdtempSync(path.join(tmpdir(), 'icons-'));
await build({ entryPoints: [path.join(ROOT, 'src/components/gameIconSpecs.ts')], bundle: true, format: 'esm', outfile: path.join(dir, 'specs.mjs'), logLevel: 'error' });
const { ICON_SPECS, iconSvg } = await import(pathToFileURL(path.join(dir, 'specs.mjs')).href);
const font = globSync(path.join(ROOT, 'node_modules/@expo-google-fonts/baloo-2/**/Baloo2_800ExtraBold.ttf'))[0];

const names = Object.keys(ICON_SPECS);
const grid = names.map((n) => `<div class="cell">${iconSvg(n, 64)}<span>${n}</span></div>`).join('');
const btn = (skin, icon, label = '') =>
  `<div class="btn ${skin}${label ? '' : ' sq'}">${iconSvg(icon, label ? 30 : 34)}${label ? `<b>${label}</b>` : ''}</div>`;
const html = `<html><head><style>
@font-face{font-family:G;src:url('file://${font}')}
body{margin:0;width:1000px;padding:24px;background:linear-gradient(#4DA8F0,#BDE6FF);font-family:G}
h2{color:#fff;text-shadow:0 2.5px 0 #1B2238;margin:6px 0 12px;font-size:26px}
.grid{display:flex;flex-wrap:wrap;gap:10px}
.cell{width:110px;height:104px;background:#24406E;border:3px solid #1B2238;border-bottom-width:7px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.cell span{font:600 12px sans-serif;color:#C9D8F2}
.row{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.btn{display:flex;align-items:center;gap:8px;border:3px solid #1B2238;border-bottom-width:8px;border-radius:16px;padding:8px 20px;color:#fff;text-shadow:0 2.5px 0 #1B2238;font-size:26px}
.btn.sq{width:58px;height:58px;padding:0;justify-content:center}
.blue{background:linear-gradient(#7FD0FF,#2E8CF0)}.green{background:linear-gradient(#9BEA62,#43B52A)}
.yellow{background:linear-gradient(#FFE36B,#FFB21E)}.red{background:linear-gradient(#FF8A7A,#E8413A)}
.panel{display:flex;align-items:center;gap:12px;background:#24406E;border:3px solid #1B2238;border-bottom-width:7px;border-radius:16px;padding:10px 16px;color:#fff;font-size:22px;text-shadow:0 2px 0 #1B2238;width:420px}
.box{width:44px;height:44px;border:2.5px solid #1B2238;border-radius:12px;display:flex;align-items:center;justify-content:center}
</style></head><body>
<h2>İkonlar</h2><div class="grid">${grid}</div>
<h2 style="margin-top:22px">Butonlarda</h2>
<div class="row">${btn('blue', 'back')}${btn('green', 'share')}${btn('yellow', 'bag')}${btn('blue', 'gear')}${btn('blue', 'trophy')}${btn('blue', 'speaker')}${btn('blue', 'plus')}${btn('blue', 'minus')}${btn('yellow', 'restart')}</div>
<div class="row">${btn('blue', 'bag', 'MAĞAZA')}${btn('green', 'house', 'MAHALLEM')}${btn('green', 'check', 'Ödülü Al')}${btn('red', 'cross', 'Vazgeç')}</div>
<h2>Ayarlar satırları</h2>
<div class="row" style="flex-direction:column;align-items:flex-start;gap:10px">
<div class="panel"><div class="box" style="background:#2E8CF0">${iconSvg('speaker', 30)}</div>Ses Efektleri</div>
<div class="panel"><div class="box" style="background:#7B4BD9">${iconSvg('music', 30)}</div>Müzik</div>
<div class="panel"><div class="box" style="background:#FF8A3D">${iconSvg('vibrate', 30)}</div>Titreşim</div>
<div class="panel"><div class="box" style="background:#E8413A">${iconSvg('trash', 30)}</div>İlerlemeyi Sıfırla</div>
</div></body></html>`;
writeFileSync(path.join(dir, 'index.html'), html);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 1048, height: 900 });
await p.goto(`file://${dir}/index.html`);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('yazıldı:', out);
