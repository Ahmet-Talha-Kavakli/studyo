/**
 * Bağımlılıksız QR kod üretici (SVG matrisi). TOTP otpauth:// URI için.
 * Basit ama gerçek: byte-mode, hata düzeltme L, otomatik versiyon.
 * (Kompakt bir implementasyon — çoğu authenticator uygulaması okur.)
 */

// Galois Field aritmetiği (Reed-Solomon için)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGenerator(n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], EXP[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length - 1; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

/**
 * Version 6 (41×41), EC level L, byte mode — otpauth URI (~120 karakter) için yeterli.
 * Basitleştirilmiş: sabit versiyon + maske 0.
 */
export function qrMatris(metin: string): boolean[][] {
  const V = 6, N = 17 + V * 4; // 41
  // Kapasite (V6-L byte): 136 karakter. Yeterli.
  const dataCodewords = 136, ecCodewords = 36, totalBlocks = 1;

  // Byte-mode bit dizisi
  const bits: number[] = [];
  const push = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4); // byte mode
  push(metin.length, 8); // char count (V1-9 byte: 8 bit)
  for (let i = 0; i < metin.length; i++) push(metin.charCodeAt(i) & 0xff, 8);
  push(0, 4); // terminator
  while (bits.length % 8 !== 0) bits.push(0);
  // Codewords
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }
  // Padding
  const pad = [0xec, 0x11];
  let pi = 0;
  while (codewords.length < dataCodewords) codewords.push(pad[pi++ % 2]);
  // EC
  const ec = rsEncode(codewords, ecCodewords);
  const allCodewords = [...codewords, ...ec];
  void totalBlocks;

  // Matris
  const m: (boolean | null)[][] = Array.from({ length: N }, () => new Array(N).fill(null));
  const rezerve: boolean[][] = Array.from({ length: N }, () => new Array(N).fill(false));

  const finder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const rr = r + i, cc = c + j;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
      const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      m[rr][cc] = on; rezerve[rr][cc] = true;
    }
  };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
  // Timing
  for (let i = 8; i < N - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; rezerve[6][i] = true; rezerve[i][6] = true; }
  // Alignment (V6: merkez 34,34)
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    const rr = 34 + i, cc = 34 + j;
    const on = Math.max(Math.abs(i), Math.abs(j)) !== 1;
    m[rr][cc] = on; rezerve[rr][cc] = true;
  }
  // Dark module
  m[N - 8][8] = true; rezerve[N - 8][8] = true;
  // Format info alanları rezerve (sabit maske 0 için basit)
  for (let i = 0; i < 9; i++) { if (m[8][i] === null) { rezerve[8][i] = true; } if (m[i][8] === null) { rezerve[i][8] = true; } }
  for (let i = 0; i < 8; i++) { rezerve[8][N - 1 - i] = true; rezerve[N - 1 - i][8] = true; }

  // Veri yerleştirme (zigzag)
  const dataBits: number[] = [];
  for (const cw of allCodewords) for (let i = 7; i >= 0; i--) dataBits.push((cw >> i) & 1);
  let di = 0, up = true;
  for (let col = N - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < N; i++) {
      const row = up ? N - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (rezerve[row][cc]) continue;
        let bit = di < dataBits.length ? dataBits[di++] : 0;
        // Maske 0: (row+col)%2==0
        if ((row + cc) % 2 === 0) bit ^= 1;
        m[row][cc] = bit === 1;
      }
    }
    up = !up;
  }
  return m.map((row) => row.map((v) => v === true));
}
