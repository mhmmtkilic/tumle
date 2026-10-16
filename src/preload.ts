import { Asset } from 'expo-asset';
import { initAudio } from './audio';
import { ITEM_ICONS } from './components/itemIcons';
import { COIN_IMAGES } from './components/coinImages';
import { loadGlb } from './three/gl';

// Eşya görselleri de baştan yüklenir: mağaza ve mahalle ilk açılışta boş kare göstermesin
const IMAGE_MODULES = [require('../assets/logo.png'), ...Object.values(ITEM_ICONS), ...Object.values(COIN_IMAGES)];

const SOUND_MODULES = [
  require('../assets/sounds/coin.wav'),
  require('../assets/sounds/paper.wav'),
  require('../assets/sounds/gold.wav'),
  require('../assets/sounds/gem.wav'),
  require('../assets/sounds/crypto.wav'),
  require('../assets/sounds/epic.wav'),
  require('../assets/sounds/combo.wav'),
];

/**
 * Tüm asset'leri sırayla yükler ve her adımda 0..1 arası ilerleme bildirir.
 * Son adım ses motorunun başlatılmasıdır; hata olsa da ilerleme tamamlanır.
 */
export async function preloadAll(onProgress: (p: number) => void): Promise<void> {
  const totalSteps = IMAGE_MODULES.length + SOUND_MODULES.length + 2;
  let done = 0;
  const tick = () => onProgress(++done / totalSteps);

  for (const mod of [...IMAGE_MODULES, ...SOUND_MODULES]) {
    try {
      await Asset.fromModule(mod).downloadAsync();
    } catch {
      // yüklenemeyen ses oyunu engellemez
    }
    tick();
  }

  // 3D mahalle modelleri ayrıştırılıp bellekte tutulur (sahne açılışta bir kez kurulur)
  try {
    await loadGlb(require('../assets/3d/mahalle.glb'));
  } catch {
    // sahne kendisi yeniden dener
  }
  tick();

  await initAudio();
  tick();
}
