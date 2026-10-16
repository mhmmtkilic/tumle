import { Platform } from 'react-native';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/*
 * three.js'i doğrudan expo-gl üzerinde çalıştırmanın ortak parçaları
 * (3D Mahallem ve ana ekran arka planı). r3f kullanılmıyor: ekrana çizmedi.
 */

// GLTFLoader GLB'nin JSON bölümünü TextDecoder ile okur; Hermes'te yoksa UTF-8 yedeği
if (typeof (globalThis as { TextDecoder?: unknown }).TextDecoder === 'undefined') {
  (globalThis as { TextDecoder?: unknown }).TextDecoder = class {
    decode(input?: ArrayBufferView | ArrayBuffer): string {
      if (!input) return '';
      const b = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      let out = '';
      for (let i = 0; i < b.length; ) {
        const c = b[i++];
        let cp = c;
        if (c >= 0xf0) cp = ((c & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
        else if (c >= 0xe0) cp = ((c & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63);
        else if (c >= 0xc0) cp = ((c & 31) << 6) | (b[i++] & 63);
        out += String.fromCodePoint(cp);
      }
      return out;
    }
  };
}

const parsed = new Map<number, Promise<THREE.Group>>();

/**
 * Paketlenmiş bir GLB'yi yükler. Sonuç modül başına önbelleklenir: three
 * geometrileri GL bağlamından bağımsızdır, ekran her açıldığında yeniden
 * ayrıştırılmaz (yalnız yeni bağlama yüklenir). Dönen sahne paylaşılır;
 * kullanan taraf parçaları KLONLAMALI.
 */
export function loadGlb(module: number): Promise<THREE.Group> {
  let p = parsed.get(module);
  if (!p) {
    p = (async () => {
      const asset = await Asset.fromModule(module).downloadAsync();
      const bytes = await new File(asset.localUri ?? asset.uri).bytes();
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const gltf = await new GLTFLoader().parseAsync(buf, '');
      return gltf.scene;
    })();
    p.catch(() => parsed.delete(module));
    parsed.set(module, p);
  }
  return p;
}

/** GLB kökündeki adlı modeller (ad → nesne) */
export async function loadModels(module: number): Promise<Record<string, THREE.Object3D>> {
  const scene = await loadGlb(module);
  const models: Record<string, THREE.Object3D> = {};
  for (const child of scene.children) models[child.name] = child;
  return models;
}

/** expo-gl bağlamını three.js'in beklediği canvas biçimine sarar */
export function makeRenderer(gl: ExpoWebGLRenderingContext): THREE.WebGLRenderer {
  const canvas = {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;
  // three.js `context instanceof WebGLRenderingContext` ise WebGL1 sanıp reddeder;
  // expo-gl'in WebGL2 bağlamı da bu sınıftan türer. Kurulum anında global gizlenir.
  const g = globalThis as { WebGLRenderingContext?: unknown };
  const saved = g.WebGLRenderingContext;
  g.WebGLRenderingContext = undefined;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGL2RenderingContext, antialias: false });
  } finally {
    g.WebGLRenderingContext = saved;
  }
  // expo-gl çizim tamponu zaten piksel ölçüsünde: oran 1
  renderer.setPixelRatio(1);
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  return renderer;
}

const flushPixel = new Uint8Array(4);

/**
 * Kareyi ekrana gönderir. iOS'ta kare, GPU işi bitmeden gönderilirse ekrana
 * çıkmıyor: 1 piksellik okuma komut kuyruğunu bekletir. Android'de gerekmez.
 */
export function present(gl: ExpoWebGLRenderingContext) {
  if (Platform.OS === 'ios') gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, flushPixel);
  gl.endFrameEXP();
}
