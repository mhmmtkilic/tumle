/**
 * Eşya ikonları (tarayıcıda): mahalle.glb'deki her eşyayı 2D mahalle
 * ızgarasıyla birebir aynı 2:1 izometrik açı ve ölçekte, şeffaf zeminde çizer.
 * scripts/render-item-icons.mjs sonuçları PNG + çapa verisi olarak yazar.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { addLights } from '../../src/three/kit';

/** Bir hücre kenarının sahne (viewBox) birimi: 2D ızgara adımı 190/6 · √2 */
const SVG_PER_UNIT = (190 / 6) * Math.SQRT2;
/** PNG çözünürlüğü: sahne birimi başına piksel */
const PX = 3;

interface Out {
  id: string;
  png: string;
  w: number;
  h: number;
  ax: number;
  ay: number;
}

async function main() {
  const gltf = await new GLTFLoader().loadAsync('mahalle.glb');
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  // 2:1 izometri: 45° yön, 30° yükseklik (zemin karesi 2:1 eşkenar dörtgen olur)
  const el = THREE.MathUtils.degToRad(30);
  const dir = new THREE.Vector3(Math.cos(el) * Math.SQRT1_2, Math.sin(el), Math.cos(el) * Math.SQRT1_2);
  const right = new THREE.Vector3(1, 0, -1).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();

  const results: Out[] = [];
  for (const item of gltf.scene.children.filter((c) => !c.name.startsWith('_'))) {
    const scene = new THREE.Scene();
    addLights(scene);
    scene.add(item);
    item.updateMatrixWorld(true);

    // Ekran düzlemindeki sıkı kutu: tüm köşeleri sağ/yukarı eksenlere izdüşür
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const v = new THREE.Vector3();
    item.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const pos = mesh.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        const x = v.dot(right);
        const y = v.dot(up);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
    const pad = 0.03;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;

    const w = Math.ceil((maxX - minX) * SVG_PER_UNIT);
    const h = Math.ceil((maxY - minY) * SVG_PER_UNIT);
    maxX = minX + w / SVG_PER_UNIT;
    minY = maxY - h / SVG_PER_UNIT;
    renderer.setSize(w * PX, h * PX);

    const camera = new THREE.OrthographicCamera(minX, maxX, maxY, minY, 0.1, 200);
    camera.position.copy(dir).multiplyScalar(80);
    camera.up.copy(up);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    results.push({
      id: item.name,
      png: canvas.toDataURL('image/png'),
      w,
      h,
      // Ayak izi merkezi (orijin) PNG'de nereye düşüyor (sahne birimi)
      ax: Math.round(-minX * SVG_PER_UNIT * 10) / 10,
      ay: Math.round(maxY * SVG_PER_UNIT * 10) / 10,
    });
  }
  (window as unknown as { results: Out[] }).results = results;
}

main().catch((e) => console.error(String(e?.stack ?? e)));
