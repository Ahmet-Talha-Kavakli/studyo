/**
 * Vayra Müzik motoru — GERÇEKTEN çalan müzik sentezi (Web Audio API + OfflineAudioContext).
 * Sıfır bağımlılık, dosya gerektirmez. Bir istemi (tür, BPM, key, ruh hali, tohum) alır,
 * akor progresyonu + bass + davul + arpej melodi + (opsiyonel) vokal-vari lead sentezleyip
 * gerçek bir AudioBuffer üretir. Bu buffer:
 *   - MuzikCalar tarafından çalınır (WebAudio ile, gerçek ses)
 *   - WAV olarak encode edilip indirilir / data-URL olarak saklanır
 *   - stem'lere (davul, bass, akor, melodi) ayrı ayrı render edilebilir (STEM ayırma)
 * Her şey deterministik (tohumdan) → SSR/replay güvenli, aynı şarkı hep aynı çalar.
 */

export type StemAdi = "davul" | "bass" | "akor" | "melodi" | "vokal";

export interface BesteAyar {
  tohum: string;
  bpm: number;
  key: string;          // "C", "A", "F#" ...
  minor: boolean;       // mod (moll = minör)
  sure: number;         // saniye
  yogunluk: number;     // 0..1 (ruh hali → enerji)
  parlaklik: number;    // 0..1 (tını)
  enstrumantal: boolean;
  stemler?: StemAdi[];  // yalnızca bu katmanları render et (STEM ayırma). Boşsa hepsi.
}

const NOTA_ADLARI = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Nota adı + oktavdan frekans (A4=440). */
function frekans(yariTon: number): number {
  return 440 * Math.pow(2, (yariTon - 69) / 12);
}
/** "C" + oktav → MIDI nota numarası. */
function midi(kok: string, oktav: number): number {
  const i = NOTA_ADLARI.indexOf(kok);
  return 12 * (oktav + 1) + (i < 0 ? 0 : i);
}

/** Deterministik PRNG (mulberry32). */
function prng(tohum: string) {
  let h = 1779033703 ^ tohum.length;
  for (let i = 0; i < tohum.length; i++) { h = Math.imul(h ^ tohum.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Majör/minör diatonik derece → yarım ton ofseti. */
const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];
/** Yaygın akor progresyonları (derece indeksleri, 0-tabanlı). */
const PROGRESYONLAR = [
  [0, 4, 5, 3], // I–V–vi–IV (pop)
  [5, 3, 0, 4], // vi–IV–I–V
  [0, 3, 4, 4], // I–IV–V
  [0, 5, 3, 4], // I–vi–IV–V (50s)
  [3, 4, 0, 5], // IV–V–I–vi
];

/** Bir dereceden triad (kök, 3'lü, 5'li) MIDI notaları. */
function triad(kokMidi: number, derece: number, minor: boolean): number[] {
  const skala = minor ? MIN : MAJ;
  const n = (d: number) => {
    const oktav = Math.floor(d / 7);
    return kokMidi + skala[((d % 7) + 7) % 7] + 12 * oktav;
  };
  return [n(derece), n(derece + 2), n(derece + 4)];
}

/** ADSR zarflı osilatör → hedef buffer'a örnek ekle. */
function tonEkle(
  data: Float32Array, sr: number, f: number, bas: number, uzun: number,
  gain: number, tip: "sine" | "square" | "sawtooth" | "triangle", pan = 0,
  dataR?: Float32Array,
) {
  const n0 = Math.floor(bas * sr);
  const n1 = Math.min(data.length, Math.floor((bas + uzun) * sr));
  const atk = Math.floor(0.008 * sr);
  const rel = Math.floor(Math.min(0.12, uzun * 0.5) * sr);
  const solG = dataR ? Math.cos((pan + 1) * Math.PI / 4) : 1;
  const sagG = dataR ? Math.sin((pan + 1) * Math.PI / 4) : 1;
  for (let i = n0; i < n1; i++) {
    const t = (i - n0) / sr;
    const faz = 2 * Math.PI * f * t;
    let s: number;
    switch (tip) {
      case "square": s = Math.sign(Math.sin(faz)); break;
      case "sawtooth": s = 2 * ((f * t) % 1) - 1; break;
      case "triangle": s = 2 * Math.abs(2 * ((f * t) % 1) - 1) - 1; break;
      default: s = Math.sin(faz);
    }
    // ADSR
    const rel0 = n1 - n0 - rel;
    let env = 1;
    if (i - n0 < atk) env = (i - n0) / atk;
    else if (i - n0 > rel0) env = Math.max(0, 1 - (i - n0 - rel0) / rel);
    const v = s * gain * env;
    data[i] += v * solG;
    if (dataR) dataR[i] += v * sagG;
  }
}

/** Davul vuruşu (kick/snare/hat) — gürültü + zarf. */
function vurusEkle(data: Float32Array, sr: number, bas: number, tur: "kick" | "snare" | "hat", gain: number, rng: () => number, dataR?: Float32Array) {
  const uzun = tur === "kick" ? 0.16 : tur === "snare" ? 0.14 : 0.04;
  const n0 = Math.floor(bas * sr);
  const n1 = Math.min(data.length, Math.floor((bas + uzun) * sr));
  for (let i = n0; i < n1; i++) {
    const t = (i - n0) / sr;
    const env = Math.exp(-t * (tur === "kick" ? 22 : tur === "snare" ? 30 : 90));
    let s: number;
    if (tur === "kick") { const f = 110 * Math.exp(-t * 20) + 42; s = Math.sin(2 * Math.PI * f * t); }
    else if (tur === "snare") { s = (rng() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * 180 * t) * 0.3; }
    else { s = (rng() * 2 - 1); }
    const v = s * gain * env;
    data[i] += v;
    if (dataR) dataR[i] += v;
  }
}

/**
 * Bir besteyi stereo AudioBuffer olarak sentezle (OfflineAudioContext gerekmez — saf DSP).
 * Döner: { sol, sag, sr, sure }. WAV/çalma için kullanılır.
 */
export function bestele(ayar: BesteAyar): { sol: Float32Array; sag: Float32Array; sr: number; sure: number } {
  const sr = 44100;
  const sure = Math.max(4, Math.min(240, ayar.sure));
  const N = Math.floor(sure * sr);
  const sol = new Float32Array(N);
  const sag = new Float32Array(N);
  const rng = prng(ayar.tohum);

  const stemGoster = (s: StemAdi) => !ayar.stemler || ayar.stemler.length === 0 || ayar.stemler.includes(s);

  const kokMidi = midi(ayar.key, 3); // bass oktavı
  const prog = PROGRESYONLAR[Math.floor(rng() * PROGRESYONLAR.length)];
  const vurusSure = 60 / ayar.bpm;      // bir vuruş
  const olcuSure = vurusSure * 4;        // 4/4 ölçü
  const toplamOlcu = Math.ceil(sure / olcuSure);
  const en = 0.35 + ayar.yogunluk * 0.5; // enerji

  for (let o = 0; o < toplamOlcu; o++) {
    const t0 = o * olcuSure;
    if (t0 >= sure) break;
    const derece = prog[o % prog.length];
    const akor = triad(kokMidi, derece, ayar.minor);

    // AKOR pad (uzun, yumuşak)
    if (stemGoster("akor")) {
      akor.forEach((m, i) => {
        const f = frekans(m + 12); // orta oktav
        tonEkle(sol, sr, f, t0, olcuSure * 0.98, 0.05 + ayar.parlaklik * 0.03, ayar.parlaklik > 0.5 ? "sawtooth" : "triangle", (i - 1) * 0.4, sag);
      });
    }

    // BASS (kök nota, her vuruşta)
    if (stemGoster("bass")) {
      for (let b = 0; b < 4; b++) {
        const f = frekans(akor[0] - 12);
        tonEkle(sol, sr, f, t0 + b * vurusSure, vurusSure * 0.9, 0.14 * en, "triangle", 0, sag);
      }
    }

    // DAVUL (kick 1&3, snare 2&4, hat 8'lik)
    if (stemGoster("davul") && ayar.yogunluk > 0.15) {
      vurusEkle(sol, sr, t0, "kick", 0.5 * en, rng, sag);
      vurusEkle(sol, sr, t0 + 2 * vurusSure, "kick", 0.45 * en, rng, sag);
      vurusEkle(sol, sr, t0 + vurusSure, "snare", 0.35 * en, rng, sag);
      vurusEkle(sol, sr, t0 + 3 * vurusSure, "snare", 0.35 * en, rng, sag);
      for (let h = 0; h < 8; h++) vurusEkle(sol, sr, t0 + h * (vurusSure / 2), "hat", 0.12 * en, rng, sag);
    }

    // MELODİ / lead arpej (akor notalarından, 8'lik)
    if (stemGoster("melodi")) {
      for (let s = 0; s < 8; s++) {
        if (rng() > 0.35) {
          const m = akor[Math.floor(rng() * 3)] + 24 + (rng() > 0.7 ? 12 : 0);
          const f = frekans(m);
          tonEkle(sol, sr, f, t0 + s * (vurusSure / 2), vurusSure * 0.45, 0.08 * (0.6 + en * 0.4), "square", (rng() - 0.5), sag);
        }
      }
    }

    // VOKAL-vari lead (enstrümantal değilse) — akor tepesinde sürekli, formant benzeri
    if (!ayar.enstrumantal && stemGoster("vokal")) {
      const m = akor[2] + 24;
      const f = frekans(m);
      tonEkle(sol, sr, f, t0 + vurusSure * 0.5, olcuSure * 0.6, 0.07 * en, "sine", 0, sag);
      tonEkle(sol, sr, f * 1.5, t0 + vurusSure * 0.5, olcuSure * 0.4, 0.02 * en, "sine", 0, sag); // 5'li üst harmonik
    }
  }

  // Basit yumuşatma + normalizasyon (clipping önle)
  let tepe = 0;
  for (let i = 0; i < N; i++) { tepe = Math.max(tepe, Math.abs(sol[i]), Math.abs(sag[i])); }
  const k = tepe > 0 ? 0.89 / tepe : 1;
  for (let i = 0; i < N; i++) { sol[i] *= k; sag[i] *= k; }

  return { sol, sag, sr, sure };
}

/** Float32 stereo → 16-bit PCM WAV Blob. */
export function wavBlob(sol: Float32Array, sag: Float32Array, sr: number): Blob {
  const N = sol.length;
  const bytesPerSample = 2, kanal = 2;
  const blockAlign = kanal * bytesPerSample;
  const buf = new ArrayBuffer(44 + N * blockAlign);
  const dv = new DataView(buf);
  const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  yaz(0, "RIFF"); dv.setUint32(4, 36 + N * blockAlign, true); yaz(8, "WAVE");
  yaz(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, kanal, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * blockAlign, true); dv.setUint16(32, blockAlign, true); dv.setUint16(34, 16, true);
  yaz(36, "data"); dv.setUint32(40, N * blockAlign, true);
  let off = 44;
  for (let i = 0; i < N; i++) {
    const l = Math.max(-1, Math.min(1, sol[i])), r = Math.max(-1, Math.min(1, sag[i]));
    dv.setInt16(off, l < 0 ? l * 0x8000 : l * 0x7fff, true); off += 2;
    dv.setInt16(off, r < 0 ? r * 0x8000 : r * 0x7fff, true); off += 2;
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** Beste ayarını doğrudan WAV data-URL'e çevir (saklama/çalma için). Ağır olabilir → kısa süreler. */
export function besteWavUrl(ayar: BesteAyar): Promise<string> {
  const { sol, sag, sr } = bestele(ayar);
  const blob = wavBlob(sol, sag, sr);
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(blob);
  });
}

/** Nota adı listesi (Key seçici için). */
export const NOTALAR = NOTA_ADLARI;

/* ─────────────────────────────────────────────────────────────
   WAV DIŞA AKTARMA — sentezlenen Float32 kanalları 16-bit PCM WAV Blob'a çevirir.
   Sıfır bağımlılık; indirme (WAV/MP3 butonu) ve stem ayırma için kullanılır.
   ───────────────────────────────────────────────────────────── */

/** Stereo Float32 kanalları 16-bit PCM WAV Blob'a kodlar. */
export function wavKodla(sol: Float32Array, sag: Float32Array, sr: number): Blob {
  const uzunluk = sol.length;
  const kanalSayisi = 2;
  const bytePerSample = 2;
  const blockAlign = kanalSayisi * bytePerSample;
  const dataBoyut = uzunluk * blockAlign;
  const buf = new ArrayBuffer(44 + dataBoyut);
  const dv = new DataView(buf);
  const yazStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  // RIFF başlık
  yazStr(0, "RIFF");
  dv.setUint32(4, 36 + dataBoyut, true);
  yazStr(8, "WAVE");
  yazStr(12, "fmt ");
  dv.setUint32(16, 16, true);       // fmt chunk boyutu
  dv.setUint16(20, 1, true);        // PCM
  dv.setUint16(22, kanalSayisi, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true);       // bit derinliği
  yazStr(36, "data");
  dv.setUint32(40, dataBoyut, true);
  // Interleaved 16-bit örnekler
  let ofs = 44;
  for (let i = 0; i < uzunluk; i++) {
    const l = Math.max(-1, Math.min(1, sol[i]));
    const r = Math.max(-1, Math.min(1, sag[i]));
    dv.setInt16(ofs, l < 0 ? l * 0x8000 : l * 0x7fff, true); ofs += 2;
    dv.setInt16(ofs, r < 0 ? r * 0x8000 : r * 0x7fff, true); ofs += 2;
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** Bir BesteAyar'ı sentezleyip WAV olarak indirir. stemler verilirse yalnız o katmanlar. */
export function parcaWavIndir(ayar: BesteAyar, dosyaAd: string, stemler?: StemAdi[]): void {
  const { sol, sag, sr } = bestele(stemler ? { ...ayar, stemler } : ayar);
  const blob = wavKodla(sol, sag, sr);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAd.replace(/[^\w.-]+/g, "_") + ".wav";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
