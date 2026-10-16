// Oyunun ses efektlerini sentezleyip assets/sounds/ altına 16-bit mono WAV yazar.
// Kullanım: node scripts/gen-sounds.js
const fs = require('fs');
const path = require('path');

const SR = 44100;

function writeWav(file, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
  console.log('yazıldı:', file, (buf.length / 1024).toFixed(1) + ' KB');
}

function seconds(s) {
  return Math.floor(s * SR);
}

// Madeni para: iki kısa metalik tık (yüksek frekanslı çınlama, hızlı sönüm)
function coin() {
  const n = seconds(0.22);
  const out = new Float64Array(n);
  const strikes = [
    { at: 0, freqs: [3900, 5200, 6500], amp: 0.7, decay: 55 },
    { at: 0.07, freqs: [4200, 5600, 7000], amp: 0.45, decay: 65 },
  ];
  for (const s of strikes) {
    const start = seconds(s.at);
    for (let i = start; i < n; i++) {
      const t = (i - start) / SR;
      const env = Math.exp(-t * s.decay);
      let v = 0;
      for (let f = 0; f < s.freqs.length; f++) {
        v += Math.sin(2 * Math.PI * s.freqs[f] * t) / (f + 1);
      }
      out[i] += v * env * s.amp * 0.4;
    }
  }
  return out;
}

// Kağıt: bant sınırlı gürültü hışırtısı, iki dalga halinde
function paper() {
  const n = seconds(0.3);
  const out = new Float64Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // yükselen-inen çift zarf (hışır-hışır)
    const env =
      Math.exp(-Math.pow((t - 0.07) / 0.045, 2)) * 0.9 +
      Math.exp(-Math.pow((t - 0.19) / 0.055, 2)) * 0.7;
    const white = Math.random() * 2 - 1;
    // yüksek geçiren: fark alarak tiz hışırtı
    const hp = white - prev;
    prev = white;
    out[i] = hp * env * 0.5;
  }
  return out;
}

// Altın: "cha-ching" — çan tonları (E6 + B6) çift vuruş + parıltı
function gold() {
  const n = seconds(0.85);
  const out = new Float64Array(n);
  const strikes = [
    { at: 0, base: 1318.5, amp: 0.5 },
    { at: 0.12, base: 1975.5, amp: 0.7 },
  ];
  for (const s of strikes) {
    const start = seconds(s.at);
    for (let i = start; i < n; i++) {
      const t = (i - start) / SR;
      const env = Math.exp(-t * 6);
      let v =
        Math.sin(2 * Math.PI * s.base * t) +
        0.5 * Math.sin(2 * Math.PI * s.base * 2.02 * t) +
        0.25 * Math.sin(2 * Math.PI * s.base * 2.96 * t);
      out[i] += v * env * s.amp * 0.35;
    }
  }
  // başta minik metalik tık (kasa kolu)
  for (let i = 0; i < seconds(0.03); i++) {
    const t = i / SR;
    out[i] += Math.sin(2 * Math.PI * 5000 * t) * Math.exp(-t * 180) * 0.3;
  }
  return out;
}

// Mücevher: kristal "tink" — cam gibi tiz, inharmonik çınlama
function gem() {
  const n = seconds(0.6);
  const out = new Float64Array(n);
  const partials = [
    { f: 2793, a: 0.55 },
    { f: 4434, a: 0.35 },
    { f: 6271, a: 0.22 },
    { f: 8372, a: 0.12 },
  ];
  for (const p of partials) {
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      out[i] += Math.sin(2 * Math.PI * p.f * t) * Math.exp(-t * 11) * p.a * 0.4;
    }
  }
  // minik ikinci tink (kristal yankısı)
  const echo = seconds(0.16);
  for (let i = echo; i < n; i++) {
    const t = (i - echo) / SR;
    out[i] += Math.sin(2 * Math.PI * 5588 * t) * Math.exp(-t * 18) * 0.15;
  }
  return out;
}

// Kripto: dijital arpej — kare dalga blip'leri, yükselen pentatonik
function crypto() {
  const n = seconds(0.45);
  const out = new Float64Array(n);
  const notes = [
    { at: 0, f: 880, dur: 0.07 },
    { at: 0.08, f: 1174.7, dur: 0.07 },
    { at: 0.16, f: 1568, dur: 0.07 },
    { at: 0.24, f: 2093, dur: 0.16 },
  ];
  for (const s of notes) {
    const start = seconds(s.at);
    const end = Math.min(n, start + seconds(s.dur));
    for (let i = start; i < end; i++) {
      const t = (i - start) / SR;
      const env = Math.min(1, t * 400) * Math.exp(-t * 16);
      // kare dalga (yumuşatılmış): temel + 3. harmonik
      const v = Math.sin(2 * Math.PI * s.f * t) + 0.33 * Math.sin(2 * Math.PI * s.f * 3 * t);
      out[i] += v * env * 0.3;
    }
  }
  return out;
}

// Epik: derin çan + timpani gümbürtüsü — servet zirvesi
function epic() {
  const n = seconds(1.2);
  const out = new Float64Array(n);
  // derin çan (A3 + duvarları)
  const bell = [
    { f: 220, a: 0.5 },
    { f: 440, a: 0.35 },
    { f: 660.5, a: 0.2 },
    { f: 1108, a: 0.12 },
  ];
  for (const p of bell) {
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      out[i] += Math.sin(2 * Math.PI * p.f * t) * Math.exp(-t * 3.2) * p.a * 0.4;
    }
  }
  // timpani: alçak frekanslı gürültü darbesi
  let prev = 0;
  for (let i = 0; i < seconds(0.25); i++) {
    const t = i / SR;
    const white = Math.random() * 2 - 1;
    prev = prev * 0.985 + white * 0.015; // alçak geçiren
    out[i] += prev * Math.exp(-t * 14) * 6;
  }
  // tiz parıltı tepede
  const spark = seconds(0.1);
  for (let i = spark; i < n; i++) {
    const t = (i - spark) / SR;
    out[i] += Math.sin(2 * Math.PI * 3520 * t) * Math.exp(-t * 9) * 0.1;
  }
  return out;
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeWav(path.join(dir, 'coin.wav'), coin());
writeWav(path.join(dir, 'paper.wav'), paper());
writeWav(path.join(dir, 'gold.wav'), gold());
// combo.wav ve combo-big.wav artık sentezlenmiyor: Kenney "Casino Audio" +
// "Interface Sounds" + "Music Jingles" (CC0) katmanlarından üretildi; üzerine yazma.
writeWav(path.join(dir, 'gem.wav'), gem());
writeWav(path.join(dir, 'crypto.wav'), crypto());
writeWav(path.join(dir, 'epic.wav'), epic());
