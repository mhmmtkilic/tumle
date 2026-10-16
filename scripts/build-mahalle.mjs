#!/usr/bin/env node
/**
 * Mahalle eşyalarının 3D modellerini üretir: assets/3d/mahalle.glb
 *
 * Kaynak: Kenney paketleri (CC0). Paketler .kits/ altına bir kez indirilir.
 * Her mağaza eşyası bir veya birkaç Kenney parçasından kurulur ve eşya
 * id'siyle tek kök düğüm olur. Düğüm, ayak izi merkezi orijinde, tabanı
 * y=0'da ve 1 birim = 1 ızgara hücresi olacak şekilde ölçeklenir.
 *
 * Kenney renkleri tek bir palet dokusundan gelir. React Native'de doku
 * yükleme sorunlu olduğu için palet köşe renklerine işlenir (çıkan dosyada
 * hiç doku yok). Kenney paleti soluk: renkler doygunlaştırılır, evlerin
 * yeşil çatıları eşyaya özgü tona kaydırılır.
 *
 * Kullanım: npm run mahalle
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Document, getBounds, NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, mergeDocuments, prune, unpartition } from '@gltf-transform/functions';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KITS = path.join(ROOT, '.kits');
const OUT = path.join(ROOT, 'assets/3d/mahalle.glb');

/** Paket → .kits altındaki klasör, model alt klasörü ve kenney.nl sayfası */
const SOURCES = {
  suburban: { dir: 'suburban', models: 'Models/GLB format', page: 'city-kit-suburban' },
  roads: { dir: 'roads', models: 'Models/GLB format', page: 'city-kit-roads' },
  commercial: { dir: 'commercial', models: 'Models/GLB format', page: 'city-kit-commercial' },
  industrial: { dir: 'city-kit-industrial', models: 'Models/GLB format', page: 'city-kit-industrial' },
  cars: { dir: 'cars', models: 'Models/GLB format', page: 'car-kit' },
  coaster: { dir: 'coaster-kit', models: 'Models/GLB format', page: 'coaster-kit' },
  fantasy: { dir: 'fantasy-town-kit', models: 'Models/GLB format', page: 'fantasy-town-kit' },
  watercraft: { dir: 'watercraft-kit', models: 'Models/GLB format', page: 'watercraft-kit' },
  pirate: { dir: 'pirate-kit', models: 'Models/GLB format', page: 'pirate-kit' },
  space: { dir: 'space-kit', models: 'Models/GLTF format', page: 'space-kit' },
  pets: { dir: 'cube-pets', models: 'Models/GLB format', page: 'cube-pets' },
  nature: { dir: 'nature', models: 'Models/GLTF format', page: 'nature-kit' },
};

/*
 * Eşya tarifleri. parts: [paket, model, { at: [x,y,z], rot: derece, scale }]
 * (paketin kendi biriminde). Sonra bütün, ayak izine sığacak şekilde ölçeklenir:
 * `width` = en geniş yatay boyut (hücre), `height` verilirse yükseklik esas alınır.
 * `roof` = yeşil çatının kaydırılacağı ton (derece).
 */
const ITEMS = {
  kedi: { width: 0.4, parts: [['pets', 'animal-cat', { rot: 30 }]] },
  agac: { height: 1.5, parts: [['suburban', 'tree-large']] },
  kart: { width: 0.5, parts: [['cars', 'kart-oobi', { rot: 30 }]] },
  araba: { width: 0.95, parts: [['cars', 'sedan-sports', { rot: 30 }]] },
  dukkan: { width: 1.7, parts: [['commercial', 'building-e']] },
  park: {
    width: 1.75,
    parts: [
      ['nature', 'ground_grass', { at: [-0.5, 0, -0.5] }],
      ['nature', 'ground_grass', { at: [0.5, 0, -0.5] }],
      ['nature', 'ground_grass', { at: [-0.5, 0, 0.5] }],
      ['nature', 'ground_grass', { at: [0.5, 0, 0.5] }],
      ['coaster', 'tree-large', { at: [-0.55, 0, -0.55], scale: 0.55 }],
      ['coaster', 'tree', { at: [0.6, 0, -0.5], scale: 0.55 }],
      ['coaster', 'bench', { at: [0, 0, 0.45], scale: 0.6 }],
      ['coaster', 'flowers', { at: [0.55, 0, 0.5], scale: 0.5 }],
      ['coaster', 'flowers', { at: [-0.5, 0, 0.4], scale: 0.5 }],
    ],
  },
  bufe: { width: 0.8, parts: [['coaster', 'stall-food']] },
  ev: { width: 1.65, roof: 4, parts: [['suburban', 'building-type-f']] },
  fiskiye: { width: 1.65, parts: [['fantasy', 'fountain-round-detail']] },
  arsa: {
    width: 0.9,
    parts: [
      ['nature', 'ground_grass'],
      ['nature', 'sign', { at: [0.1, 0, 0.1], scale: 1.8 }],
    ],
  },
  villa: { width: 1.75, roof: 205, parts: [['suburban', 'building-type-n']] },
  gokdelen: { width: 1.35, parts: [['commercial', 'building-skyscraper-b']] },
  turbin: { height: 2.4, parts: [['industrial', 'windmill']] },
  arsa2: {
    width: 0.9,
    parts: [
      ['pirate', 'patch-sand'],
      ['pirate', 'palm-straight', { at: [0.5, 0, -0.3] }],
    ],
  },
  malikane: {
    width: 1.8,
    roof: 24,
    parts: [
      ['suburban', 'building-type-d'],
      ['suburban', 'tree-large', { at: [-1.05, 0, 0.3] }],
      ['suburban', 'tree-large', { at: [1.05, 0, 0.3] }],
      ['suburban', 'fence-low', { at: [0, 0, 0.25], scale: 1.6 }],
    ],
  },
  yat: { width: 1.75, parts: [['watercraft', 'boat-speed-a', { rot: 30 }]] },
  gemi: { width: 1.85, parts: [['watercraft', 'ship-ocean-liner-small', { rot: 30 }]] },
  ada: {
    width: 1.8,
    parts: [
      ['pirate', 'patch-sand'],
      ['pirate', 'palm-bend', { at: [-1.6, 0, -0.8] }],
      ['pirate', 'palm-straight', { at: [1.4, 0, -1.0] }],
      ['pirate', 'chest', { at: [0.6, 0.2, 1.0] }],
      ['pirate', 'rocks-sand-a', { at: [1.8, 0, 1.3], scale: 0.35 }],
    ],
  },
  roket: {
    height: 3.2,
    parts: [
      ['space', 'rocket_baseA'],
      ['space', 'rocket_finsA', { at: [0, 1.6, 0] }],
      ['space', 'rocket_sidesA', { at: [0, 1.6, 0] }],
      ['space', 'rocket_fuelA', { at: [0, 2.6, 0] }],
      ['space', 'rocket_sidesA', { at: [0, 3.1, 0] }],
      ['space', 'rocket_topA', { at: [0, 4.1, 0] }],
    ],
  },
};

/*
 * Sahne dekoru (mağazada satılmaz): yollar, ağaçlar, dolaşan arabalar vb.
 * Adları `_` ile başlar. `scale` verilirse ayak izine sığdırılmaz, paketin
 * kendi ölçeği o çarpanla kullanılır (yol karosu = 1 hücre).
 */
const DECOR = {
  '_road-straight': { scale: 1, parts: [['roads', 'road-straight']] },
  '_road-bend': { scale: 1, parts: [['roads', 'road-bend']] },
  '_road-tee': { scale: 1, parts: [['roads', 'road-intersection']] },
  '_road-cross': { scale: 1, parts: [['roads', 'road-crossroad']] },
  '_lamp': { height: 0.8, parts: [['roads', 'light-square']] },
  '_tree': { height: 1.25, parts: [['suburban', 'tree-large']] },
  '_tree-small': { height: 0.85, parts: [['suburban', 'tree-small']] },
  '_tree-oak': { height: 1.1, parts: [['nature', 'tree_oak']] },
  '_bush': { height: 0.35, parts: [['nature', 'plant_bushLarge']] },
  '_palm': { height: 1.4, parts: [['pirate', 'palm-straight']] },
  '_sign': { height: 0.9, parts: [['nature', 'sign']] },
  '_car-sedan': { scale: 0.17, parts: [['cars', 'sedan']] },
  '_car-taxi': { scale: 0.17, parts: [['cars', 'taxi']] },
  '_car-suv': { scale: 0.17, parts: [['cars', 'suv']] },
  '_car-van': { scale: 0.17, parts: [['cars', 'van']] },
  '_car-police': { scale: 0.17, parts: [['cars', 'police']] },
};

/** Renk ayarları (onaylanan önizlemeyle aynı) */
const SATURATE = 1.6;

/**
 * Nature Kit renkleri soluk/turkuaz: malzeme adına göre doğrudan canlı renge
 * çekilir (arena ile aynı palet, sRGB). Bunlara ayrıca doygunluk uygulanmaz.
 */
const VIVID = {
  grass: '#5FCB3B',
  leafsGreen: '#3CC03A',
  leafsDark: '#2A9E3C',
  water: '#38B6F7',
  dirt: '#EDB86A',
  dirtDark: '#B8763C',
  wood: '#CF8443',
  woodBarkDark: '#8E5A31',
  stone: '#B9C6CF',
};

function ensureKit(kit) {
  const src = SOURCES[kit];
  const dir = path.join(KITS, src.dir);
  if (existsSync(dir)) return dir;
  mkdirSync(KITS, { recursive: true });
  const page = execSync(`curl -sL "https://kenney.nl/assets/${src.page}"`).toString();
  const url = page.match(new RegExp(`https://kenney.nl/media/pages/assets/${src.page}/[^"]+\\.zip`))?.[0];
  if (!url) throw new Error(`indirme bağlantısı bulunamadı: ${src.page}`);
  const zip = path.join(KITS, `${src.dir}.zip`);
  console.log(`indiriliyor: ${src.page}`);
  execSync(`curl -sSfL -o "${zip}" "${url}"`, { stdio: 'inherit' });
  execSync(`unzip -qo "${zip}" -d "${dir}"`);
  return dir;
}

// ---- Renk yardımcıları (köşe renkleri doğrusal uzayda) -----------------------

const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/** Doğrusal RGB'yi canlandırır; `roof` verilirse yeşil tonlar o tona kayar */
function grade(rgb, roof) {
  let [h, s, l] = rgbToHsl(...rgb.map(toSrgb));
  if (roof !== undefined && h > 0.22 && h < 0.5 && s > 0.2) h = roof / 360;
  s = Math.min(1, s * SATURATE);
  return hslToRgb(h, s, l).map(toLinear);
}

/**
 * Palet dokusunu UV'den örnekleyip köşe rengine çevirir, dokuyu kaldırır.
 * Dokusuz malzemelerin (Space Kit) taban rengi de köşe rengine taşınır,
 * böylece tüm eşyalar aynı renk işleminden geçer.
 */
function bakeColors(doc, roof) {
  const cache = new Map();
  const vivid = (name) => {
    const hex = VIVID[name];
    return hex && [1, 3, 5].map((o) => toLinear(parseInt(hex.slice(o, o + 2), 16) / 255));
  };
  const buffer = doc.getRoot().listBuffers()[0];
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (!mat) continue;
      const pos = prim.getAttribute('POSITION');
      const count = pos.getCount();
      const factor = mat.getBaseColorFactor();
      const fixed = vivid(mat.getName());
      const tex = mat.getBaseColorTexture();
      const uv = prim.getAttribute('TEXCOORD_0');
      // Kenney renk çeşitlemesini paletteki UV kaydırmasıyla yapar (KHR_texture_transform)
      const tr = mat.getBaseColorTextureInfo()?.getExtension('KHR_texture_transform');
      const off = tr?.getOffset() ?? [0, 0];
      const sc = tr?.getScale() ?? [1, 1];
      const rot = tr?.getRotation() ?? 0;
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const colors = new Float32Array(count * 4);
      let png = null;
      if (tex && uv) {
        png = cache.get(tex);
        if (!png) {
          png = PNG.sync.read(Buffer.from(tex.getImage()));
          cache.set(tex, png);
        }
      }
      const t = [0, 0];
      for (let i = 0; i < count; i++) {
        let rgb = [factor[0], factor[1], factor[2]];
        if (fixed) {
          colors.set([...fixed, 1], i * 4);
          continue;
        }
        if (png) {
          uv.getElement(i, t);
          const u = cr * sc[0] * t[0] + sr * sc[1] * t[1] + off[0];
          const w = -sr * sc[0] * t[0] + cr * sc[1] * t[1] + off[1];
          t[0] = u;
          t[1] = w;
          const x = Math.min(png.width - 1, Math.max(0, Math.floor((t[0] - Math.floor(t[0])) * png.width)));
          const y = Math.min(png.height - 1, Math.max(0, Math.floor((t[1] - Math.floor(t[1])) * png.height)));
          const o = (y * png.width + x) * 4;
          rgb = rgb.map((f, c) => toLinear(png.data[o + c] / 255) * f);
        }
        const [r, g, b] = grade(rgb, roof);
        colors.set([r, g, b, 1], i * 4);
      }
      prim.setAttribute('COLOR_0', doc.createAccessor().setType('VEC4').setArray(colors).setBuffer(buffer));
      prim.setAttribute('TEXCOORD_0', null);
    }
  }
  // Malzemeler parçalar arasında paylaşılır: doku ancak hepsi işlendikten sonra kalkar
  for (const mat of doc.getRoot().listMaterials()) {
    const a = mat.getBaseColorFactor()[3];
    mat.setBaseColorTexture(null).setBaseColorFactor([1, 1, 1, a]);
    mat.setMetallicFactor(0).setRoughnessFactor(0.85);
  }
}

// ---- Eşyaları kur --------------------------------------------------------------

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const out = new Document();
out.createBuffer();
const outScene = out.createScene('mahalle');

for (const [id, spec] of Object.entries({ ...ITEMS, ...DECOR })) {
  const holder = out.createNode(id);
  const inner = out.createNode(`${id}-parts`);
  holder.addChild(inner);
  outScene.addChild(holder);

  for (const [kit, name, opts = {}] of spec.parts) {
    const dir = path.join(ensureKit(kit), SOURCES[kit].models);
    const file = path.join(dir, `${name}.glb`);
    if (!existsSync(file)) throw new Error(`model yok: ${kit}/${name}`);
    // Yol ile okunur: GLB'nin işaret ettiği harici doku (Textures/colormap.png) çözülsün
    const doc = await io.read(file);
    bakeColors(doc, spec.roof);
    const part = doc.createNode(name);
    for (const n of doc.getRoot().listScenes()[0].listChildren()) part.addChild(n);
    doc.getRoot().listScenes()[0].addChild(part);
    // Parçanın kendi kutusu ortalanır: bazı paketler (Space Kit) orijinden kaymış
    const b = getBounds(part);
    const cx = (b.min[0] + b.max[0]) / 2;
    const cz = (b.min[2] + b.max[2]) / 2;
    const at = opts.at ?? [0, 0, 0];
    const s = opts.scale ?? 1;
    const a = ((opts.rot ?? 0) * Math.PI) / 180;
    const wrap = doc.createNode(`${name}-at`);
    wrap.setTranslation([at[0], at[1] - b.min[1] * s, at[2]]);
    wrap.setRotation([0, Math.sin(a / 2), 0, Math.cos(a / 2)]);
    wrap.setScale([s, s, s]);
    part.setTranslation([-cx, 0, -cz].map((v, i) => v + part.getTranslation()[i]));
    wrap.addChild(part);
    doc.getRoot().listScenes()[0].addChild(wrap);
    const map = mergeDocuments(out, doc);
    inner.addChild(map.get(wrap));
  }

  // Bütünü ayak izine sığdır: ortala, tabanı y=0'a indir, ölçekle
  const b = getBounds(inner);
  const w = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
  const h = b.max[1] - b.min[1];
  const k = spec.scale ?? (spec.height ? spec.height / h : spec.width / w);
  inner.setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2]);
  holder.setScale([k, k, k]);
}

for (const s of out.getRoot().listScenes()) if (s !== outScene) s.dispose();
// Renkler köşelere işlendi: doku kaydırması ve ışıksız malzeme uzantıları gereksiz
for (const ext of out.getRoot().listExtensionsUsed()) ext.dispose();
out.getRoot().setDefaultScene(outScene);
await out.transform(unpartition(), dedup(), prune());

mkdirSync(path.dirname(OUT), { recursive: true });
await io.write(OUT, out);
const kb = Math.round(readFileSync(OUT).length / 1024);
console.log(`yazıldı: ${path.relative(ROOT, OUT)} (${kb} KB, ${Object.keys(ITEMS).length} eşya + ${Object.keys(DECOR).length} dekor)`);
