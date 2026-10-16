import * as THREE from 'three';

/*
 * 3D sahnelerin ortak ışığı: mahalle sahnesi, eşya ikonları ve önizlemeler
 * aynı ışıkla çizilir ki ikonlar sahneyle birebir aynı görünsün.
 */

export function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#C9B48A', 1.25));
  const key = new THREE.DirectionalLight('#FFF0D8', 2.6);
  key.position.set(-5, 9, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#CFE4FF', 0.7);
  fill.position.set(6, 4, -4);
  scene.add(fill);
}
