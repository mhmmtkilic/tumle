import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { addLights } from './kit';
import { BLOCK_SIZE, BLOCKS, BlockId, openBlocks } from '../city/world';
import { blocksFor, CELLS, cellCenter, CityLayout, CityPos, fits, footOf, snapCell } from '../city/grid';
import { isPlaceable } from '../economy/items';

/*
 * 3D Mahallem sahnesi (React'ten bağımsız). Mahalle gökyüzünde duran bir
 * diorama: yalnız AÇIK arsalardan oluşan çimen bir platform, çevresinde yol
 * halkası, kenarlarında ağaçlar. Yeni arsa alındıkça platform büyür; sahil
 * açılınca doğu kıyısına kumsal ve deniz eklenir.
 *
 * Modeller scripts/build-mahalle.mjs ile üretilen mahalle.glb'den gelir:
 * mağaza eşyaları id'leriyle, sahne dekoru `_` önekiyle. Bileşen (Mahalle3D)
 * jestleri buraya iletir, her karede `update` çağırır.
 *
 * Koordinatlar: 1 birim = 1 ızgara hücresi; x doğu, z güney, y yukarı.
 */

type Models = Record<string, THREE.Object3D>;

const C = {
  skyTop: '#4DA8F0',
  skyHorizon: '#CDEBFF',
  grass: '#5FC943',
  lot: '#74D84F',
  sand: '#F4D58D',
  dirt: '#B9783F',
  dirtDark: '#8E5A2E',
  water: '#38B6F7',
  select: '#FFD43B',
  ok: '#4CD964',
  bad: '#FF3B30',
};
const CONFETTI_COLORS = ['#FF4A3D', '#FFC834', '#3FB2F5', '#46CF3A', '#B05CFF', '#FF8A3D'];

/** Blok zemininin üst yüzü: eşyalar buraya oturur */
const GROUND_Y = 0.05;
/** Platform kenarında yolların dışındaki çimen şerit (ağaçlar burada) */
const MARGIN = 1.5;
/** Sahil açıkken doğu kıyısı: kumsal + deniz genişliği */
const BEACH = 1.6;
const SEA = 3.2;

/** Kenney yol parçalarının dönüşsüz bağlantıları: N = -z, E = +x, S = +z, W = -x */
const N = 1, E = 2, S = 4, W = 8;
const ROAD_PIECES: Record<string, number> = {
  '_road-straight': E | W,
  '_road-bend': S | W,
  '_road-tee': E | S | W,
  '_road-cross': N | E | S | W,
};

/** Y ekseninde +90° dönüş yönleri şöyle taşır: E→N, N→W, W→S, S→E */
function rot90(mask: number): number {
  let out = 0;
  if (mask & E) out |= N;
  if (mask & N) out |= W;
  if (mask & W) out |= S;
  if (mask & S) out |= E;
  return out;
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeInQuad = (t: number) => t * t;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Kamera hissi: piksel başına dönüş/eğim (rad), takip ve atalet sönümü (1/s) */
const ROTATE_SPEED = 0.0045;
const TILT_SPEED = 0.0025;
const CAMERA_EASE = 9;
const INERTIA_DECAY = 2.6;

/**
 * Bulut halkası: adanın üstünde, kuş bakışı yükseklikte 3 bulut. Ana ekran
 * ve Mahallem aynı sahneyi aynı açıdan gösterdiği için tek ayar.
 * r = platform yarı köşegeninin oranı
 */
const RING = { count: 3, r: [0.4, 0.6], y: [6, 6.6], scale: [1.1, 1.35] };

/**
 * Sahnenin iki çerçevesi. Aynı GL sahnesi ana ekranda arka plan, Mahallem'de
 * etkileşimli sahne olarak kullanılır; mod değişince kamera bu değerlere süzülür.
 *  spin: kendi kendine dönüş (rad/s), shiftY: sahneyi ekranda yukarı kaydırma
 *  (yüksekliğin oranı), zoom: uzaklık çarpanı, pitch: bakış açısı (rad)
 */
export interface WorldView {
  spin: number;
  shiftY: number;
  zoom: number;
  pitch: number;
}

/**
 * Ezilme/esneme: modelin KENDİ ölçeği (ayak izine sığdırılmış, 1 değil) temel
 * alınır; `sq` = 0 iken model tam olarak ilk ölçeğine döner.
 */
function squashScale(model: THREE.Object3D, sq: number) {
  const base = (model.userData.baseScale as THREE.Vector3 | undefined) ?? (model.userData.baseScale = model.scale.clone());
  model.scale.set(base.x * (1 + sq * 0.5), base.y * (1 - sq), base.z * (1 + sq * 0.5));
}

/** Aynı malzemeyi kullanan durağan parçaları tek geometride birleştirir (çizim çağrısı azalır) */
function mergeStatic(group: THREE.Object3D): THREE.Group {
  group.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material;
    const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'color') g.deleteAttribute(name);
    }
    if (!g.getAttribute('color')) {
      const n = g.getAttribute('position').count;
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    }
    const list = byMat.get(mat) ?? [];
    list.push(g.index ? g.toNonIndexed() : g);
    byMat.set(mat, list);
  });
  const out = new THREE.Group();
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.matrixAutoUpdate = false;
    out.add(mesh);
  }
  return out;
}

/** Gökyüzü kubbesi: tepede koyu mavi, ufukta açık (köşe renkleriyle geçiş) */
function makeSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(180, 32, 16);
  const top = new THREE.Color(C.skyTop);
  const horizon = new THREE.Color(C.skyHorizon);
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / 180;
    c.copy(horizon).lerp(top, clamp(Math.abs(h) * 1.6, 0, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false }));
}

/** Tombul alçak poligon bulut: birkaç ikosahedronun birleşimi */
function makeCloud(rnd: () => number, mat: THREE.Material): THREE.Mesh {
  const parts: THREE.BufferGeometry[] = [];
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const r = 0.7 + rnd() * 0.6;
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.translate((i - (n - 1) / 2) * 0.9, rnd() * 0.35, (rnd() - 0.5) * 0.6);
    parts.push(g);
  }
  const merged = mergeGeometries(parts, false)!;
  for (const g of parts) g.dispose();
  merged.scale(1, 0.62, 1);
  return new THREE.Mesh(merged, mat);
}

interface Car {
  node: THREE.Object3D;
  s: number;
  speed: number;
}

export class MahalleWorld {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private models: Models;
  private owned: readonly string[] = [];
  private layout: CityLayout = {};
  private items = new Map<string, THREE.Group>();
  /** Açık arsaların platformu; arsa sayısı değişince yeniden kurulur */
  private town: THREE.Group | null = null;
  private townKey = '';
  private lots = new Map<BlockId, THREE.Mesh>();
  private cars: Car[] = [];
  /** Etkin animasyonlar: false dönen biter */
  private anims: ((dt: number) => boolean)[] = [];
  private shadowMat = new THREE.MeshBasicMaterial({ color: '#1B3A12', transparent: true, opacity: 0.2, depthWrite: false });
  private time = 0;

  // ---- kamera (yörünge) ----
  // Kamera hedef değerlere (…Goal) yumuşakça akar; jestler yalnız hedefi değiştirir
  private yaw = 0.6;
  private pitch = 0.78;
  private zoom = 1;
  private target = new THREE.Vector3();
  private yawGoal = 0.6;
  private pitchGoal = 0.78;
  private zoomGoal = 1;
  private targetGoal = new THREE.Vector3();
  /** Parmak bırakılınca dönüşü sürdüren hız (rad/s) */
  private yawVel = 0;
  private dragging = false;
  private dragYaw = 0;
  private cameraPlaced = false;
  /** Arka plan modu: kendi kendine dönüş hızı (rad/s), 0 = kapalı; hedefe süzülür */
  private autoSpin = 0;
  private spinGoal = 0;
  /** Sahneyi ekranda yukarı kaydırma (yüksekliğin oranı); arka planda arayüze yer açar */
  private shiftY = 0;
  private shiftGoal = 0;
  /** Bulut halkası (bkz. buildRing): dünyaya bağlı, adayla birlikte döner */
  private ring = new THREE.Group();
  private baseDist = 20;
  /** Açık arsaların ızgara sınırı (yolların içi) */
  private bounds = { x0: 0, x1: BLOCK_SIZE, z0: 0, z1: BLOCK_SIZE };
  /** Platformun ortası ve boyutu (kamera çerçevesi için) */
  private platform = { cx: BLOCK_SIZE / 2, cz: BLOCK_SIZE / 2, w: 10, d: 10 };
  private camDirty = true;

  // ---- seçim + taşıma ----
  private selectRing: THREE.Mesh;
  private selected: string | null = null;
  private grid: THREE.LineSegments | null = null;
  private highlight: THREE.Mesh;
  private highlightMat = new THREE.MeshBasicMaterial({ color: C.ok, transparent: true, opacity: 0.55, depthWrite: false });
  private editing: { id: string; pos: CityPos; ok: boolean } | null = null;

  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);

  /** Satın alınan eşya yere değdiğinde (titreşim için) */
  onLanded?: (id: string) => void;

  constructor(models: Models, aspect: number) {
    this.models = models;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 400);
    const scene = this.scene;
    scene.background = new THREE.Color(C.skyHorizon);
    scene.add(makeSky());
    addLights(scene);

    const carNames = ['_car-sedan', '_car-taxi', '_car-suv', '_car-van'];
    for (let i = 0; i < carNames.length; i++) {
      const node = this.clone(carNames[i]);
      scene.add(node);
      this.cars.push({ node, s: i / carNames.length, speed: 1 + (i % 2) * 0.3 });
    }

    this.selectRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.52, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: C.select, transparent: true, opacity: 0.9, depthWrite: false })
    );
    this.selectRing.visible = false;
    scene.add(this.selectRing);

    this.highlight = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.highlightMat);
    this.highlight.visible = false;
    scene.add(this.highlight);
  }

  // ---- kurulum ---------------------------------------------------------------

  private clone(name: string): THREE.Object3D {
    const src = this.models[name];
    if (!src) throw new Error(`model yok: ${name}`);
    return src.clone();
  }

  /** Açık arsalardan platformu kurar: toprak gövde, çimen, yollar, ağaçlar, kıyı */
  private buildTown(open: BlockId[]) {
    if (this.town) {
      this.scene.remove(this.town);
      this.town.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.userData.own) mesh.geometry.dispose();
      });
    }
    this.lots.clear();
    const town = new THREE.Group();
    const blocks = open.map((id) => BLOCKS[id]);
    const x1 = Math.max(...blocks.map((b) => b.x + BLOCK_SIZE)); // doğu yol sütunu bu x'te
    const sea = open.includes('sahil');
    this.bounds = { x0: 0, x1, z0: 0, z1: BLOCK_SIZE };

    // Platform: yolların dışında MARGIN kadar çimen; sahil açıksa doğuda kumsal + deniz
    const px0 = -1 - MARGIN;
    const px1 = x1 + 1 + (sea ? BEACH + SEA : MARGIN);
    const pz0 = -1 - MARGIN;
    const pz1 = BLOCK_SIZE + 1 + MARGIN;
    const w = px1 - px0;
    const d = pz1 - pz0;
    const cx = (px0 + px1) / 2;
    const cz = (pz0 + pz1) / 2;
    const own = (m: THREE.Mesh) => {
      m.userData.own = true;
      return m;
    };
    const grass = own(new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), new THREE.MeshStandardMaterial({ color: C.grass, roughness: 1 })));
    grass.position.set(cx, -0.11, cz);
    town.add(grass);
    const soil = own(new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.7, d - 0.12), new THREE.MeshStandardMaterial({ color: C.dirt, roughness: 1 })));
    soil.position.set(cx, -0.57, cz);
    town.add(soil);
    const rock = own(new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.5, d - 0.6), new THREE.MeshStandardMaterial({ color: C.dirtDark, roughness: 1 })));
    rock.position.set(cx, -1.15, cz);
    town.add(rock);
    if (sea) {
      const sand = own(new THREE.Mesh(new THREE.BoxGeometry(BEACH, 0.22, d), new THREE.MeshStandardMaterial({ color: C.sand, roughness: 1 })));
      sand.position.set(x1 + 1 + BEACH / 2, -0.105, cz);
      town.add(sand);
      const water = own(new THREE.Mesh(new THREE.BoxGeometry(SEA, 0.18, d), new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.3, metalness: 0.1 })));
      water.position.set(px1 - SEA / 2, -0.15, cz);
      town.add(water);
    }

    // Arsa zeminleri (eşyalar bunun üstünde)
    for (const b of blocks) {
      const lot = own(
        new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK_SIZE, 0.1, BLOCK_SIZE),
          new THREE.MeshStandardMaterial({ color: b.ground === 'sand' ? C.sand : C.lot, roughness: 0.95 })
        )
      );
      lot.position.set(b.x + BLOCK_SIZE / 2, GROUND_Y - 0.05, b.z + BLOCK_SIZE / 2);
      town.add(lot);
      this.lots.set(b.id, lot);
    }

    // Durağan dekor tek grupta birleşir: yollar, ağaçlar, lambalar, palmiyeler
    const deco = new THREE.Group();
    const roadCells = new Set<string>();
    for (let x = -1; x <= x1; x++) {
      roadCells.add(`${x},-1`);
      roadCells.add(`${x},${BLOCK_SIZE}`);
    }
    for (const col of [...blocks.map((b) => b.x - 1), x1]) {
      for (let z = 0; z < BLOCK_SIZE; z++) roadCells.add(`${col},${z}`);
    }
    const isRoad = (x: number, z: number) => roadCells.has(`${x},${z}`);
    for (const key of roadCells) {
      const [x, z] = key.split(',').map(Number);
      let mask = 0;
      if (isRoad(x, z - 1)) mask |= N;
      if (isRoad(x + 1, z)) mask |= E;
      if (isRoad(x, z + 1)) mask |= S;
      if (isRoad(x - 1, z)) mask |= W;
      const count = [N, E, S, W].filter((bit) => mask & bit).length;
      const name =
        count === 4 ? '_road-cross' : count === 3 ? '_road-tee' : mask === (N | S) || mask === (E | W) || count < 2 ? '_road-straight' : '_road-bend';
      let m = ROAD_PIECES[name];
      let k = 0;
      for (; k < 4 && m !== mask; k++) m = rot90(m);
      const tile = this.clone(name);
      tile.position.set(x + 0.5, 0, z + 0.5);
      tile.rotation.y = (k % 4) * (Math.PI / 2);
      deco.add(tile);
    }

    // Kenar şeridinde ağaçlar (kıyı tarafı hariç)
    const rnd = seeded(17);
    const trees = ['_tree', '_tree-small', '_tree-oak', '_tree', '_bush'];
    const addTree = (x: number, z: number) => {
      const t = this.clone(trees[Math.floor(rnd() * trees.length)]);
      t.position.set(x, 0, z);
      t.rotation.y = rnd() * Math.PI * 2;
      t.scale.setScalar(0.8 + rnd() * 0.4);
      deco.add(t);
    };
    const inner = 0.25;
    const eastEdge = sea ? x1 + 1 : px1 - inner;
    for (let x = px0 + 0.5; x < eastEdge - 0.2; x += 0.8) {
      if (rnd() < 0.8) addTree(x + rnd() * 0.3, pz0 + inner + rnd() * (MARGIN - 0.5));
      if (rnd() < 0.8) addTree(x + rnd() * 0.3, pz1 - inner - rnd() * (MARGIN - 0.5));
    }
    for (let z = pz0 + MARGIN; z < pz1 - MARGIN; z += 0.8) {
      if (rnd() < 0.8) addTree(px0 + inner + rnd() * (MARGIN - 0.5), z + rnd() * 0.3);
      if (!sea && rnd() < 0.8) addTree(px1 - inner - rnd() * (MARGIN - 0.5), z + rnd() * 0.3);
    }
    if (sea) {
      for (let z = pz0 + 0.6; z < pz1 - 0.4; z += 1.5) {
        const p = this.clone('_palm');
        p.position.set(x1 + 1.5 + rnd() * 0.8, 0, z + rnd() * 0.5);
        p.rotation.y = rnd() * Math.PI * 2;
        p.scale.setScalar(0.8);
        deco.add(p);
      }
    }
    // Yol kenarı lambaları: her arsanın dört köşesinde, yolun dış tarafında
    for (const b of blocks) {
      for (const [lx, lz, ry] of [
        [b.x + 0.2, -1.2, 0],
        [b.x + BLOCK_SIZE - 0.2, -1.2, 0],
        [b.x + 0.2, BLOCK_SIZE + 1.2, Math.PI],
        [b.x + BLOCK_SIZE - 0.2, BLOCK_SIZE + 1.2, Math.PI],
      ]) {
        const l = this.clone('_lamp');
        l.position.set(lx, 0, lz);
        l.rotation.y = ry;
        deco.add(l);
      }
    }
    const merged = mergeStatic(deco);
    merged.traverse((o) => (o.userData.own = true));
    town.add(merged);

    this.scene.add(town);
    this.town = town;

    // Bulutlar platformun çevresinde döner; kamera platformu çerçeveler
    this.platform = { cx, cz, w, d };
    this.buildRing();
    this.fitCamera();
  }

  /** Kamera hedefi platformun ortası; uzaklık, platform ekrana sığacak kadar */
  private fitCamera() {
    const { cx, cz, w, d } = this.platform;
    // Kamera hep platformun tam ortasına bakar: dönüş ve yakınlaştırma bu eksende
    this.targetGoal.set(cx, -0.2, cz);
    // İlk kurulumda doğrudan yerleşir; arsa açılınca yeni çerçeveye süzülür
    if (!this.cameraPlaced) {
      this.target.copy(this.targetGoal);
      this.cameraPlaced = true;
    }
    const r = Math.hypot(w / 2, d / 2);
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    this.baseDist = (r / Math.sin(Math.min(vfov, hfov) / 2)) * 0.92;
    this.camDirty = true;
  }

  // ---- durum eşitleme ------------------------------------------------------------

  /**
   * Sahip olunan eşyaları ve yerleşimi sahneye yansıtır. `fresh` içindeki
   * eşyalar gökten iner; yeni açılan arsa yükselerek gelir (yalnız ilk görüşte).
   */
  sync(owned: readonly string[], layout: CityLayout, fresh: readonly string[] = []) {
    this.owned = owned;
    this.layout = layout;

    let delay = 0.35;
    const open = openBlocks(owned);
    const key = open.join(',');
    if (key !== this.townKey) {
      this.buildTown(open);
      this.townKey = key;
      for (const id of open) {
        const by = BLOCKS[id].unlockedBy;
        if (by && fresh.includes(by)) {
          this.riseLot(id, delay);
          delay += 0.6;
        }
      }
    }

    for (const [id, node] of this.items) {
      if (!owned.includes(id)) {
        this.scene.remove(node);
        this.items.delete(id);
      }
    }
    for (const id of owned) {
      if (!isPlaceable(id) || !layout[id]) continue;
      let node = this.items.get(id);
      const isNew = !node;
      if (!node) {
        node = new THREE.Group();
        const model = this.clone(id);
        model.userData.baseScale = model.scale.clone();
        node.add(model);
        const s = footOf(id);
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42 * s, 32).rotateX(-Math.PI / 2), this.shadowMat);
        shadow.position.y = 0.006;
        shadow.renderOrder = -1;
        node.add(shadow);
        node.userData.model = model;
        node.traverse((o) => (o.userData.item = id));
        this.items.set(id, node);
        this.scene.add(node);
      }
      if (this.editing?.id !== id) this.placeNode(node, id, layout[id]);
      if (isNew && fresh.includes(id)) {
        this.dropIn(id, node, delay);
        delay += 0.45;
      }
    }

    if (this.selected && !this.items.has(this.selected)) this.select(null);
    this.camDirty = true;
  }

  private placeNode(node: THREE.Object3D, id: string, pos: CityPos) {
    const c = cellCenter(pos, footOf(id));
    node.position.set(c.x, GROUND_Y, c.z);
  }

  // ---- kamera ------------------------------------------------------------------

  setAspect(aspect: number) {
    if (Math.abs(aspect - this.camera.aspect) < 0.001) return;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.applyViewOffset();
    this.fitCamera();
  }

  /** Tek parmak: yatay sürükleme döndürür, dikey sürükleme eğer (piksel) */
  rotateBy(dxPx: number, dyPx: number) {
    this.yawGoal -= dxPx * ROTATE_SPEED;
    this.pitchGoal = clamp(this.pitchGoal + dyPx * TILT_SPEED, 0.35, 1.3);
    this.camDirty = true;
  }

  /** Parmak indi: süren dönüş durur, hız ölçümü başlar */
  holdStill() {
    this.dragging = true;
    this.yawVel = 0;
    this.dragYaw = this.yawGoal;
  }

  /** Parmak kalktı: son hızla yavaşça sönerek döner */
  release() {
    this.dragging = false;
    if (Math.abs(this.yawVel) < 0.15) this.yawVel = 0;
  }

  getZoom() {
    return this.zoomGoal;
  }

  /**
   * Kamera çerçevesini değiştirir (ana ekran ↔ Mahallem). `instant` değilse
   * kamera yeni açıya, uzaklığa ve konuma yumuşakça süzülür.
   */
  setView(v: WorldView, instant = false) {
    this.spinGoal = v.spin;
    this.shiftGoal = v.shiftY;
    this.pitchGoal = v.pitch;
    this.zoomGoal = v.zoom;
    this.yawVel = 0;
    if (instant) {
      this.autoSpin = v.spin;
      this.shiftY = v.shiftY;
      this.pitch = v.pitch;
      this.zoom = v.zoom;
      this.applyViewOffset();
    }
    this.camDirty = true;
  }

  private applyViewOffset() {
    const cam = this.camera;
    if (this.shiftY === 0) {
      cam.clearViewOffset();
      return;
    }
    // Tam görüntünün alt kısmını göstermek = sahne ekranda yukarı kayar
    const H = 1000;
    const W = H * cam.aspect;
    cam.setViewOffset(W, H, 0, this.shiftY * H, W, H);
  }

  setZoom(z: number) {
    this.zoomGoal = clamp(z, 0.4, 1.35);
    this.camDirty = true;
  }

  /** Kamerayı hedef değerlere doğru yumuşakça yaklaştırır; hâlâ hareket ediyorsa true */
  private easeCamera(dt: number): boolean {
    if (this.dragging) {
      // Parmak hızını ölç (düzgünleştirilmiş), bırakınca atalet bu hızla başlar
      const v = dt > 0 ? (this.yawGoal - this.dragYaw) / dt : 0;
      this.yawVel = this.yawVel * 0.7 + v * 0.3;
      this.dragYaw = this.yawGoal;
    } else if (this.yawVel !== 0) {
      this.yawGoal += this.yawVel * dt;
      this.yawVel *= Math.exp(-INERTIA_DECAY * dt);
      if (Math.abs(this.yawVel) < 0.02) this.yawVel = 0;
    }
    const k = 1 - Math.exp(-CAMERA_EASE * dt);
    this.yaw += (this.yawGoal - this.yaw) * k;
    this.pitch += (this.pitchGoal - this.pitch) * k;
    this.zoom += (this.zoomGoal - this.zoom) * k;
    this.target.lerp(this.targetGoal, k);
    // Mod geçişinde dönüş ve ekran kayması daha yavaş süzülür (sinematik)
    const k2 = 1 - Math.exp(-3.5 * dt);
    this.autoSpin += (this.spinGoal - this.autoSpin) * k2;
    if (Math.abs(this.spinGoal - this.autoSpin) < 1e-3) this.autoSpin = this.spinGoal;
    if (this.shiftY !== this.shiftGoal) {
      this.shiftY += (this.shiftGoal - this.shiftY) * k;
      if (Math.abs(this.shiftGoal - this.shiftY) < 1e-4) this.shiftY = this.shiftGoal;
      this.applyViewOffset();
    }
    const moving =
      this.yawVel !== 0 ||
      Math.abs(this.yawGoal - this.yaw) > 1e-4 ||
      Math.abs(this.pitchGoal - this.pitch) > 1e-4 ||
      Math.abs(this.zoomGoal - this.zoom) > 1e-4 ||
      this.shiftY !== this.shiftGoal ||
      this.target.distanceToSquared(this.targetGoal) > 1e-6;
    return moving;
  }

  private updateCamera() {
    const dist = this.baseDist * this.zoom;
    const t = this.target;
    this.camera.position.set(
      t.x + Math.sin(this.yaw) * Math.cos(this.pitch) * dist,
      t.y + Math.sin(this.pitch) * dist,
      t.z + Math.cos(this.yaw) * Math.cos(this.pitch) * dist
    );
    this.camera.lookAt(t);
  }

  // ---- seçim ve taşıma ----------------------------------------------------------

  private ray(nx: number, ny: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    return this.raycaster;
  }

  /** Ekran noktasındaki eşya (NDC: -1..1) */
  pick(nx: number, ny: number): string | null {
    const hit = this.ray(nx, ny).intersectObjects([...this.items.values()], true)[0];
    return (hit?.object.userData.item as string | undefined) ?? null;
  }

  select(id: string | null) {
    this.selected = id;
    this.selectRing.visible = !!id;
    if (id) this.selectRing.scale.setScalar(footOf(id));
  }

  beginEdit(id: string): boolean {
    const pos = this.layout[id];
    if (!pos) return false;
    this.select(null);
    this.editing = { id, pos, ok: true };
    this.yawVel = 0;
    this.yawGoal = this.yaw;
    this.showGrid(true);
    this.updateEdit(pos);
    return true;
  }

  isEditing() {
    return !!this.editing;
  }

  /** Parmağın altındaki zemin noktasına en yakın hücreye kilitler */
  dragTo(nx: number, ny: number) {
    if (!this.editing) return;
    const p = this.ray(nx, ny).ray.intersectPlane(this.groundPlane, new THREE.Vector3());
    if (!p) return;
    const id = this.editing.id;
    const pos = snapCell(p.x, p.z, footOf(id), blocksFor(id, this.owned));
    if (pos.b !== this.editing.pos.b || pos.i !== this.editing.pos.i || pos.j !== this.editing.pos.j) this.updateEdit(pos);
  }

  private updateEdit(pos: CityPos) {
    if (!this.editing) return;
    const { id } = this.editing;
    const ok = fits(this.layout, this.owned, id, pos);
    this.editing = { id, pos, ok };
    const s = footOf(id);
    const c = cellCenter(pos, s);
    this.highlight.visible = true;
    this.highlight.position.set(c.x, GROUND_Y + 0.012, c.z);
    this.highlight.scale.set(s, 1, s);
    this.highlightMat.color.set(ok ? C.ok : C.bad);
    const node = this.items.get(id);
    if (node) node.position.set(c.x, GROUND_Y + 0.25, c.z);
  }

  /**
   * Taşımayı bitirir. `moved`: geçerli yeni konum (kaydedilmeli); `rejected`:
   * dolu/geçersiz hücreye bırakıldı, eşya eski yerine döndü.
   */
  endEdit(): { moved: { id: string; pos: CityPos } | null; rejected: boolean } | null {
    const e = this.editing;
    if (!e) return null;
    this.editing = null;
    this.highlight.visible = false;
    this.showGrid(false);
    const node = this.items.get(e.id);
    const from = this.layout[e.id];
    const moved = e.pos.b !== from.b || e.pos.i !== from.i || e.pos.j !== from.j;
    if (node) {
      this.placeNode(node, e.id, e.ok ? e.pos : from);
      this.squash(node);
    }
    return { moved: e.ok && moved ? { id: e.id, pos: e.pos } : null, rejected: !e.ok };
  }

  private showGrid(on: boolean) {
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      this.grid = null;
    }
    if (!on) return;
    const pts: number[] = [];
    const y = GROUND_Y + 0.008;
    for (const id of openBlocks(this.owned)) {
      const b = BLOCKS[id];
      for (let k = 0; k <= CELLS; k++) {
        pts.push(b.x + k, y, b.z, b.x + k, y, b.z + CELLS);
        pts.push(b.x, y, b.z + k, b.x + CELLS, y, b.z + k);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.grid = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.6 }));
    this.scene.add(this.grid);
  }

  // ---- animasyonlar ----------------------------------------------------------------

  /** Satın alınan eşya gökten düşer, yere çarpınca ezilip toz ve konfeti saçar */
  private dropIn(id: string, node: THREE.Object3D, delay: number) {
    const model = node.userData.model as THREE.Object3D;
    const baseY = node.position.y;
    const H = 7;
    let t = -delay;
    let landed = false;
    node.visible = false;
    this.anims.push((dt) => {
      t += dt;
      if (t < 0) return true;
      node.visible = true;
      const fall = 0.55;
      if (t < fall) {
        node.position.y = baseY + H * (1 - easeInQuad(t / fall));
        return true;
      }
      if (!landed) {
        landed = true;
        node.position.y = baseY;
        this.onLanded?.(id);
        this.dust(node.position, footOf(id));
        this.confetti(node.position.clone().setY(baseY + 0.6));
      }
      const p = (t - fall) / 0.45;
      if (p >= 1) {
        squashScale(model, 0);
        return false;
      }
      squashScale(model, Math.sin(p * Math.PI * 2) * (1 - p) * 0.28);
      return true;
    });
  }

  /** Bırakılan eşya kısa bir ezilme yapar */
  private squash(node: THREE.Object3D) {
    const model = node.userData.model as THREE.Object3D;
    let t = 0;
    this.anims.push((dt) => {
      t += dt;
      const p = t / 0.3;
      if (p >= 1) {
        squashScale(model, 0);
        return false;
      }
      squashScale(model, Math.sin(p * Math.PI * 2) * (1 - p) * 0.16);
      return true;
    });
  }

  /** Yeni alınan arsa: zemin aşağıdan esneyerek yükselir, üstünde konfeti patlar */
  private riseLot(id: BlockId, delay: number) {
    const lot = this.lots.get(id);
    if (!lot) return;
    const b = BLOCKS[id];
    const baseY = lot.position.y;
    let t = -delay;
    let burst = false;
    lot.scale.set(0.01, 1, 0.01);
    this.anims.push((dt) => {
      t += dt;
      if (t < 0) return true;
      const p = clamp(t / 0.7, 0, 1);
      const k = Math.max(0.01, easeOutBack(p));
      lot.scale.set(k, 1, k);
      lot.position.y = baseY - (1 - easeOutCubic(p)) * 0.6;
      if (!burst && p > 0.6) {
        burst = true;
        this.confetti(new THREE.Vector3(b.x + BLOCK_SIZE / 2, 0.8, b.z + BLOCK_SIZE / 2), 46);
        this.onLanded?.(id);
      }
      if (p >= 1) {
        lot.scale.set(1, 1, 1);
        lot.position.y = baseY;
        return false;
      }
      return true;
    });
  }

  private dust(at: THREE.Vector3, s: number) {
    const mat = new THREE.MeshBasicMaterial({ color: '#E8DCC2', transparent: true, opacity: 0.7, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.55, 40).rotateX(-Math.PI / 2), mat);
    ring.position.set(at.x, GROUND_Y + 0.02, at.z);
    this.scene.add(ring);
    let t = 0;
    this.anims.push((dt) => {
      t += dt;
      const p = t / 0.6;
      if (p >= 1) {
        this.scene.remove(ring);
        ring.geometry.dispose();
        mat.dispose();
        return false;
      }
      ring.scale.setScalar(s * (0.8 + easeOutCubic(p) * 1.6));
      mat.opacity = 0.7 * (1 - p);
      return true;
    });
  }

  private confetti(at: THREE.Vector3, count = 28) {
    const geo = new THREE.PlaneGeometry(0.09, 0.14);
    const parts: { m: THREE.Mesh; v: THREE.Vector3; spin: THREE.Vector3 }[] = [];
    const mats = CONFETTI_COLORS.map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true }));
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mats[i % mats.length]);
      m.position.copy(at);
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 1.8;
      parts.push({
        m,
        v: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 2.5, Math.sin(a) * sp),
        spin: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      });
      this.scene.add(m);
    }
    let t = 0;
    this.anims.push((dt) => {
      t += dt;
      const fade = clamp((1.5 - t) / 0.4, 0, 1);
      for (const p of parts) {
        p.v.y -= 7 * dt;
        p.v.multiplyScalar(1 - 1.2 * dt);
        p.m.position.addScaledVector(p.v, dt);
        if (p.m.position.y < GROUND_Y + 0.02) {
          p.m.position.y = GROUND_Y + 0.02;
          p.v.set(0, 0, 0);
        } else {
          p.m.rotation.x += p.spin.x * dt;
          p.m.rotation.y += p.spin.y * dt;
          p.m.rotation.z += p.spin.z * dt;
        }
      }
      for (const m of mats) m.opacity = fade;
      if (t < 1.5) return true;
      for (const p of parts) this.scene.remove(p.m);
      geo.dispose();
      for (const m of mats) m.dispose();
      return false;
    });
  }

  // ---- kare güncelleme --------------------------------------------------------------

  /** Arabaların turu: açık arsaları çevreleyen yol halkası, sağ şerit (saat yönü) */
  private carPath() {
    const x0 = -0.5;
    const x1 = this.bounds.x1 + 0.5;
    const z0 = -0.5;
    const z1 = BLOCK_SIZE + 0.5;
    return { x0, x1, z0, z1, w: x1 - x0, h: z1 - z0 };
  }

  private carAt(s: number, out: THREE.Vector3): number {
    const { x0, x1, z0, z1, w, h } = this.carPath();
    let d = (((s % 1) + 1) % 1) * 2 * (w + h);
    const lane = 0.2;
    if (d < w) {
      out.set(x0 + d, 0, z0 - lane);
      return Math.PI / 2;
    }
    d -= w;
    if (d < h) {
      out.set(x1 + lane, 0, z0 + d);
      return 0;
    }
    d -= h;
    if (d < w) {
      out.set(x1 - d, 0, z1 + lane);
      return -Math.PI / 2;
    }
    d -= w;
    out.set(x0 - lane, 0, z1 - d);
    return Math.PI;
  }

  /**
   * Bulut halkası: adanın üstünde, kuş bakışı yükseklikte; dünyaya bağlı
   * olduğundan ada döndükçe onunla birlikte döner; hep görünür kalır.
   */
  private buildRing() {
    this.scene.remove(this.ring);
    this.ring = new THREE.Group();
    const rnd = seeded(23);
    const { cx, cz, w, d } = this.platform;
    const style = RING;
    const half = Math.hypot(w / 2, d / 2);
    for (let i = 0; i < style.count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, flatShading: true });
      const cloud = makeCloud(rnd, mat);
      // Eşit aralıklı açılar (düzenli), küçük sapmalarla doğal
      const a = (i / style.count) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
      const r = half * (style.r[0] + rnd() * (style.r[1] - style.r[0]));
      const y = style.y[0] + rnd() * (style.y[1] - style.y[0]);
      cloud.position.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
      cloud.rotation.y = -a;
      cloud.scale.setScalar(style.scale[0] + rnd() * (style.scale[1] - style.scale[0]));
      cloud.userData = { y, phase: rnd() * Math.PI * 2 };
      this.ring.add(cloud);
    }
    this.scene.add(this.ring);
  }

  /** Bulutlar hafifçe yukarı aşağı süzülür (hep görünür; solma yok) */
  private floatClouds() {
    for (const cloud of this.ring.children) {
      const ud = cloud.userData as { y: number; phase: number };
      cloud.position.y = ud.y + Math.sin(this.time * 0.6 + ud.phase) * 0.12;
    }
  }

  /**
   * Bir kare ilerletir. `active`: kamera/animasyon/taşıma sürüyor (tam hızda
   * çiz); değilse yalnız arabalar ve bulutlar oynuyordur, daha seyrek çizilebilir.
   */
  update(dt: number): { active: boolean } {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    let active = this.camDirty || this.anims.length > 0 || !!this.editing;

    // Arka plan dönüşü sürekli ama yavaş: "etkin" sayılmaz, seyrek çizim yeter
    if (this.autoSpin !== 0) {
      this.yaw += this.autoSpin * dt;
      this.yawGoal += this.autoSpin * dt;
      this.updateCamera();
    }
    if (this.easeCamera(dt)) {
      this.camDirty = true;
      active = true;
    }
    if (this.camDirty) {
      this.updateCamera();
      this.camDirty = false;
    }

    if (this.anims.length) this.anims = this.anims.filter((a) => a(dt));

    if (this.selected) {
      const node = this.items.get(this.selected);
      if (node) {
        this.selectRing.position.set(node.position.x, GROUND_Y + 0.01, node.position.z);
        this.selectRing.scale.setScalar(footOf(this.selected) * (1 + Math.sin(this.time * 5) * 0.05));
        active = true;
      }
    }

    this.floatClouds();

    const { w, h } = this.carPath();
    const per = 2 * (w + h);
    const p = new THREE.Vector3();
    for (const car of this.cars) {
      car.s += (car.speed * dt) / per;
      car.node.rotation.y = this.carAt(car.s, p);
      car.node.position.copy(p);
    }
    return { active };
  }

  /**
   * Sahne GL bağlamıyla birlikte bırakılır. Model geometrileri önbellekteki
   * mahalle.glb ile paylaşıldığı için burada silinmez (sonraki ziyarette
   * yeni bağlama yeniden yüklenir).
   */
  dispose() {
    this.anims = [];
    this.onLanded = undefined;
  }
}
