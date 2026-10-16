// ÜRETİLDİ: scripts/render-combo.mjs — elle düzenleme, `npm run combo` çalıştır.
// Combo patlaması görselleri ve piksel boyutları (oyunda 1/3 ölçekte çizilir).

export const COMBO_IMAGES = {
  "combo": { src: require('../../assets/combo/combo.png'), w: 501, h: 184 },
  "x3": { src: require('../../assets/combo/x3.png'), w: 404, h: 394 },
  "x4": { src: require('../../assets/combo/x4.png'), w: 431, h: 394 },
  "x5": { src: require('../../assets/combo/x5.png'), w: 405, h: 394 },
  "x6": { src: require('../../assets/combo/x6.png'), w: 417, h: 394 },
  "x7": { src: require('../../assets/combo/x7.png'), w: 392, h: 394 },
  "x8": { src: require('../../assets/combo/x8.png'), w: 417, h: 394 },
  "x9": { src: require('../../assets/combo/x9.png'), w: 417, h: 394 },
  "x10": { src: require('../../assets/combo/x10.png'), w: 565, h: 394 },
  "x11": { src: require('../../assets/combo/x11.png'), w: 494, h: 394 },
  "x12": { src: require('../../assets/combo/x12.png'), w: 540, h: 394 },
  "x13": { src: require('../../assets/combo/x13.png'), w: 536, h: 394 },
  "x14": { src: require('../../assets/combo/x14.png'), w: 565, h: 394 },
  "x15": { src: require('../../assets/combo/x15.png'), w: 537, h: 394 },
  "x16": { src: require('../../assets/combo/x16.png'), w: 549, h: 394 },
  "x17": { src: require('../../assets/combo/x17.png'), w: 526, h: 394 },
  "x18": { src: require('../../assets/combo/x18.png'), w: 549, h: 394 },
  "x19": { src: require('../../assets/combo/x19.png'), w: 549, h: 394 },
  "x20": { src: require('../../assets/combo/x20.png'), w: 605, h: 394 },
  "super": { src: require('../../assets/combo/super.png'), w: 418, h: 174 },
  "cilginca": { src: require('../../assets/combo/cilginca.png'), w: 558, h: 174 },
  "efsane": { src: require('../../assets/combo/efsane.png'), w: 476, h: 174 },
  "durdurulamaz": { src: require('../../assets/combo/durdurulamaz.png'), w: 857, h: 164 },
  "imkansiz": { src: require('../../assets/combo/imkansiz.png'), w: 582, h: 174 },
  "basarim": { src: require('../../assets/combo/basarim.png'), w: 791, h: 160 },
  "rays": { src: require('../../assets/combo/rays.png'), w: 828, h: 832 },
  "coin": { src: require('../../assets/combo/coin.png'), w: 152, h: 156 },
} as const;

export type ComboImageId = keyof typeof COMBO_IMAGES;
