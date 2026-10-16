import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { TileKind } from './game/levels';

let players: Record<TileKind, AudioPlayer> | null = null;
let comboPlayer: AudioPlayer | null = null;
let comboBigPlayer: AudioPlayer | null = null;
let musicPlayer: AudioPlayer | null = null;
let soundEnabled = true;
let hapticsEnabled = true;
let musicEnabled = true;

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
}

export function setHapticsEnabled(v: boolean) {
  hapticsEnabled = v;
}

export function setMusicEnabled(v: boolean) {
  musicEnabled = v;
  if (!musicPlayer) return;
  if (v) {
    musicPlayer.play();
  } else {
    musicPlayer.pause();
  }
}

/** Arkaplan müziğini başlatır; ayar kapalıysa çalar hazır bekler */
export async function initMusic() {
  if (musicPlayer) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    musicPlayer = createAudioPlayer(require('../assets/sounds/music.mp3'));
    musicPlayer.loop = true;
    musicPlayer.volume = 0.4; // efektler müziğin önünde kalsın
    if (musicEnabled) musicPlayer.play();
  } catch {
    musicPlayer = null; // müzik yüklenemezse oyun sessiz devam eder
  }
}

export async function initAudio() {
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    players = {
      coin: createAudioPlayer(require('../assets/sounds/coin.wav')),
      note: createAudioPlayer(require('../assets/sounds/paper.wav')),
      gold: createAudioPlayer(require('../assets/sounds/gold.wav')),
      gem: createAudioPlayer(require('../assets/sounds/gem.wav')),
      crypto: createAudioPlayer(require('../assets/sounds/crypto.wav')),
      epic: createAudioPlayer(require('../assets/sounds/epic.wav')),
    };
    // Combo sesleri: Kenney Casino/Interface/Music Jingles paketlerinden (CC0)
    comboPlayer = createAudioPlayer(require('../assets/sounds/combo.wav'));
    comboBigPlayer = createAudioPlayer(require('../assets/sounds/combo-big.wav'));
    // Isınma turu: sessiz çalıp durdur ki ilk birleşmede ses gecikmesin
    const all = [...Object.values(players), comboPlayer, comboBigPlayer];
    for (const p of all) {
      p.volume = 0;
      p.play();
    }
    setTimeout(() => {
      for (const p of all) {
        p.pause();
        p.seekTo(0);
        p.volume = 1;
      }
    }, 350);
  } catch {
    players = null; // ses yoksa oyun sessiz devam eder
    comboPlayer = null;
    comboBigPlayer = null;
  }
}

export function playMerge(kind: TileKind) {
  if (soundEnabled) {
    const p = players?.[kind];
    if (p) {
      p.seekTo(0);
      p.play();
    }
  }
  if (hapticsEnabled) {
    if (kind === 'coin' || kind === 'note') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // altın ve üzeri: kutlama titreşimi
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }
}

export function playMove() {
  if (hapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Büyük combo eşikleri: SÜPER (x6), ÇILGINCA (x8), EFSANE (x10) */
export const COMBO_MILESTONES = [6, 8, 10];

/**
 * Combo sesi: para yığını + cam çın; seri büyüdükçe tizleşir. Eşiğe ulaşınca
 * (x6, x8, x10) kısa zafer müziği çalar. Haptik seriyle sertleşir.
 */
export function playCombo(mult: number) {
  const big = COMBO_MILESTONES.includes(mult);
  const p = big ? comboBigPlayer : comboPlayer;
  if (soundEnabled && p) {
    p.setPlaybackRate(big ? 1 : Math.min(1 + (mult - 3) * 0.06, 1.45));
    p.seekTo(0);
    p.play();
  }
  if (hapticsEnabled) {
    if (mult >= 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }
}
