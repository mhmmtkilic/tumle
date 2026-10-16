/**
 * Mahalle stil önizlemesi (tarayıcıda): aynı soyut ızgara haritasını iki
 * farklı model paketiyle (Kenney City Kit / KayKit City Builder Bits) kurar.
 * scripts/preview-city.mjs paketler, modelleri kopyalar ve ekran görüntüsünü alır.
 *
 * URL: ?style=kenney|kaykit&yaw=<derece>
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addLights } from '../../src/three/kit';

const params = new URLSearchParams(location.search);
const STYLE = (params.get('style') ?? 'kenney') as 'kenney' | 'kaykit';
const YAW = Number(params.get('yaw') ?? 35);

/*
 * Soyut harita: R yol, H ev arsası, P park. Satır = z (kuzey üstte), sütun = x.
 */
const MAP = [
  'RRRRRRR',
  'RHHRHHR',
  'RHPRHHR',
  'RRRRRRR',
  'RHHRPPR',
  'RHHRPPR',
  'RRRRRRR',
];
const ROWS = MAP.length;
const COLS = MAP[0].length;

// Yön bitleri: N = -z, E = +x, S = +z, W = -x
const N = 1, E = 2, S = 4, W = 8;

/** Y ekseninde +90° dönüş yönleri şöyle taşır: E→N, N→W, W→S, S→E */
function rot90(mask: number): number {
  let out = 0;
  if (mask & E) out |= N;
  if (mask & N) out |= W;
  if (mask & W) out |= S;
  if (mask & S) out |= E;
  return out;
}

interface Kit {
  cell: number;
  /** Yol parçaları: model adı ve dönüşsüz hâlinin bağlandığı yönler */
  roads: { straight: [string, number]; corner: [string, number]; tee: [string, number]; cross: [string, number] };
  houses: string[];
  houseScale: number;
  /** Evin ön yüzü dönüşsüz hâlde hangi yöne bakıyor */
  houseFront: number;
  trees: string[];
  park: string[];
  lamp?: string;
  cars: string[];
  carScale: number;
  carY: number;
  files: (name: string) => string;
  ground: string;
}

const KITS: Record<string, Kit> = {
  kenney: {
    cell: 1,
    roads: {
      straight: ['road-straight', E | W],
      corner: ['road-bend', S | W],
      tee: ['road-intersection', E | S | W],
      cross: ['road-crossroad', N | E | S | W],
    },
    houses: ['building-type-a', 'building-type-c', 'building-type-e', 'building-type-j', 'building-type-k', 'building-type-o', 'building-type-p', 'building-type-r', 'building-type-l', 'building-type-h'],
    houseScale: 0.7,
    houseFront: S,
    trees: ['tree-large', 'tree-small'],
    park: ['planter'],
    lamp: 'light-square',
    cars: ['sedan', 'taxi', 'suv', 'van', 'police', 'hatchback-sports'],
    carScale: 0.17,
    carY: 0.02,
    files: (n) =>
      n.startsWith('road-') || n.startsWith('light-')
        ? `roads/${n}.glb`
        : KITS.kenney.cars.includes(n)
          ? `cars/${n}.glb`
          : `suburban/${n}.glb`,
    ground: '#7CCB55',
  },
  kaykit: {
    cell: 2,
    roads: {
      straight: ['road_straight', N | S],
      corner: ['road_corner', S | E],
      tee: ['road_tsplit', E | S | W],
      cross: ['road_junction', N | E | S | W],
    },
    houses: ['building_A', 'building_B', 'building_C', 'building_D', 'building_E', 'building_F', 'building_G', 'building_H'],
    houseScale: 1,
    houseFront: S,
    trees: ['bush'],
    park: ['bench'],
    lamp: 'streetlight',
    cars: ['car_sedan', 'car_taxi', 'car_hatchback', 'car_police', 'car_stationwagon'],
    carScale: 1,
    carY: 0.06,
    files: (n) => `kaykit/${n}.gltf`,
    ground: '#7CCB55',
  },
};

const kit = KITS[STYLE];

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const isRoad = (x: number, z: number) => x >= 0 && z >= 0 && x < COLS && z < ROWS && MAP[z][x] === 'R';

function roadPiece(x: number, z: number): [string, number] {
  let mask = 0;
  if (isRoad(x, z - 1)) mask |= N;
  if (isRoad(x + 1, z)) mask |= E;
  if (isRoad(x, z + 1)) mask |= S;
  if (isRoad(x - 1, z)) mask |= W;
  const count = [N, E, S, W].filter((b) => mask & b).length;
  const [name, base] =
    count === 4 ? kit.roads.cross : count === 3 ? kit.roads.tee : count === 2 && (mask === (N | S) || mask === (E | W)) ? kit.roads.straight : count === 2 ? kit.roads.corner : kit.roads.straight;
  let m = base;
  for (let k = 0; k < 4; k++) {
    if (m === mask) return [name, k * 90];
    m = rot90(m);
  }
  return [name, 0];
}

/** Ön yüzü `dir` yönüne çevirecek açı (derece) */
function faceAngle(dir: number): number {
  let m = kit.houseFront;
  for (let k = 0; k < 4; k++) {
    if (m === dir) return k * 90;
    m = rot90(m);
  }
  return 0;
}

/** Kenney çatı renkleri: paletteki yeşil tonlar bu renklere çevrilir (derece) */
const ROOF_HUES = [4, 24, 205, 345, 42, 265, 190];
const roofCache = new Map<string, THREE.Texture>();

/** Renk görselindeki yeşil bölgeyi başka bir tona kaydırılmış kopya */
function roofVariant(src: THREE.Texture, hue: number): THREE.Texture {
  const key = `${src.uuid}:${hue}`;
  const hit = roofCache.get(key);
  if (hit) return hit;
  const img = src.image as HTMLImageElement | ImageBitmap;
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const ctx = cv.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, cv.width, cv.height);
  const c = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  for (let i = 0; i < data.data.length; i += 4) {
    c.setRGB(data.data[i] / 255, data.data[i + 1] / 255, data.data[i + 2] / 255, THREE.SRGBColorSpace).getHSL(hsl);
    if (hsl.h > 0.22 && hsl.h < 0.5 && hsl.s > 0.2) {
      c.setHSL(hue / 360, Math.min(1, hsl.s * 1.1), hsl.l, THREE.SRGBColorSpace);
      data.data[i] = Math.round(c.r * 255);
      data.data[i + 1] = Math.round(c.g * 255);
      data.data[i + 2] = Math.round(c.b * 255);
    }
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = src.colorSpace;
  tex.flipY = src.flipY;
  tex.magFilter = src.magFilter;
  tex.minFilter = src.minFilter;
  roofCache.set(key, tex);
  return tex;
}

async function main() {
  const loader = new GLTFLoader();
  const cache = new Map<string, THREE.Object3D>();
  const get = async (name: string) => {
    if (!cache.has(name)) cache.set(name, (await loader.loadAsync(kit.files(name))).scene);
    return cache.get(name)!.clone();
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9ED8FF');
  scene.fog = new THREE.Fog('#9ED8FF', 30 * kit.cell, 60 * kit.cell);
  addLights(scene);

  const C = kit.cell;
  const ox = ((COLS - 1) * C) / 2;
  const oz = ((ROWS - 1) * C) / 2;
  const at = (x: number, z: number) => new THREE.Vector3(x * C - ox, 0, z * C - oz);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(COLS * C * 1.6, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: kit.ground }));
  ground.position.y = -0.005;
  scene.add(ground);

  const rnd = seeded(11);
  let houseIdx = 0;
  const place = async (name: string, pos: THREE.Vector3, deg = 0, scale = 1) => {
    const o = await get(name);
    o.position.copy(pos);
    o.rotation.y = THREE.MathUtils.degToRad(deg);
    o.scale.setScalar(scale);
    scene.add(o);
    return o;
  };

  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const c = MAP[z][x];
      const p = at(x, z);
      if (c === 'R') {
        const [name, deg] = roadPiece(x, z);
        await place(name, p, deg);
        // Düz yollara ara sıra araba
        if (kit.cars.length && name === kit.roads.straight[0] && rnd() < 0.35) {
          const horiz = deg % 180 !== 0;
          const lane = (rnd() < 0.5 ? -1 : 1) * C * 0.22;
          const cp = p.clone().add(horiz ? new THREE.Vector3(0, kit.carY, lane) : new THREE.Vector3(lane, kit.carY, 0));
          // Arabalar Z ekseni boyunca uzanır: yatay yolda 90° çevrilir
          const along = STYLE === 'kenney' ? (horiz ? 90 : 0) : deg;
          await place(kit.cars[Math.floor(rnd() * kit.cars.length)], cp, along + (lane > 0 ? 180 : 0), kit.carScale);
        }
      } else if (c === 'H') {
        // Ev en yakın yola bakar
        const dir = isRoad(x, z + 1) ? S : isRoad(x, z - 1) ? N : isRoad(x + 1, z) ? E : W;
        const house = await place(kit.houses[houseIdx % kit.houses.length], p, faceAngle(dir), kit.houseScale);
        if (STYLE === 'kenney') {
          const hue = ROOF_HUES[houseIdx % ROOF_HUES.length];
          house.traverse((o) => {
            const mesh = o as THREE.Mesh;
            const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
            if (mesh.isMesh && mat?.map) {
              mesh.material = mat.clone();
              (mesh.material as THREE.MeshStandardMaterial).map = roofVariant(mat.map, hue);
            }
          });
        }
        houseIdx++;
        if (STYLE === 'kenney') {
          for (let i = 0; i < 2; i++) {
            const t = p.clone().add(new THREE.Vector3((rnd() - 0.5) * C * 0.8, 0, (rnd() - 0.5) * C * 0.8));
            if (rnd() < 0.5) await place(kit.trees[Math.floor(rnd() * kit.trees.length)], t, rnd() * 360, 0.8 + rnd() * 0.4);
          }
        }
      } else if (c === 'P') {
        for (let i = 0; i < 4; i++) {
          const t = p.clone().add(new THREE.Vector3((rnd() - 0.5) * C * 0.8, 0, (rnd() - 0.5) * C * 0.8));
          await place(kit.trees[Math.floor(rnd() * kit.trees.length)], t, rnd() * 360, (STYLE === 'kaykit' ? 1.6 : 1) * (0.9 + rnd() * 0.5));
        }
        await place(kit.park[Math.floor(rnd() * kit.park.length)], p, rnd() * 360);
      }
    }
  }

  // Kenar süsü: haritanın çevresine ağaç halkası
  const edge = Math.max(COLS, ROWS) * C * 0.5 + C * 0.9;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + rnd() * 0.1;
    const r = edge + rnd() * C * 1.5;
    const tree = STYLE === 'kaykit' ? 'bush' : kit.trees[i % 2];
    await place(tree, new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), rnd() * 360, (STYLE === 'kaykit' ? 2.2 : 1.3) * (0.8 + rnd() * 0.5));
  }

  const W2 = 900, H2 = 1300;
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W2, H2);
  const camera = new THREE.PerspectiveCamera(40, W2 / H2, 0.1, 200 * C);
  const dist = COLS * C * 1.75;
  const pitch = THREE.MathUtils.degToRad(48);
  const yaw = THREE.MathUtils.degToRad(YAW);
  camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  (window as unknown as { done: boolean }).done = true;
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
});
