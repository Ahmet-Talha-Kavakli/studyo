/// <reference lib="webworker" />
/**
 * Yerel (AI olmayan) büyütme: ayrık Lanczos-3 yeniden örnekleme + hafif keskinleştirme (unsharp mask).
 * Sağlayıcı bağlı değilken dürüst bir alternatif — yeni detay üretmez, yalnız pürüzsüz büyütür.
 * Ana iş parçacığını kilitlememek için Worker'da çalışır.
 */

type Girdi = { w: number; h: number; veri: Uint8ClampedArray; olcek: number; keskinlik: number };

const lanczos = (x: number) => {
  if (x === 0) return 1;
  if (x <= -3 || x >= 3) return 0;
  const px = Math.PI * x;
  return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px);
};

/** Tek eksende yeniden örnekleme için önceden hesaplanmış ağırlıklar. */
function agirliklar(kaynak: number, hedef: number) {
  const oran = kaynak / hedef;
  const yaricap = 3;
  const n = yaricap * 2;
  const bas = new Int32Array(hedef);
  const w = new Float32Array(hedef * n);
  for (let i = 0; i < hedef; i++) {
    const merkez = (i + 0.5) * oran - 0.5;
    const ilk = Math.floor(merkez) - yaricap + 1;
    bas[i] = ilk;
    let top = 0;
    for (let k = 0; k < n; k++) { const v = lanczos(merkez - (ilk + k)); w[i * n + k] = v; top += v; }
    for (let k = 0; k < n; k++) w[i * n + k] /= top;
  }
  return { bas, w, n };
}

function buyut({ w, h, veri, olcek, keskinlik }: Girdi): { w: number; h: number; veri: Uint8ClampedArray } {
  const W = Math.round(w * olcek), H = Math.round(h * olcek);
  const yat = agirliklar(w, W), dik = agirliklar(h, H);
  // Yatay geçiş: h × W × 4 (float)
  const ara = new Float32Array(h * W * 4);
  for (let y = 0; y < h; y++) {
    const satir = y * w * 4, hs = y * W * 4;
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      const b0 = yat.bas[x], o = x * yat.n;
      for (let k = 0; k < yat.n; k++) {
        const sx = Math.min(w - 1, Math.max(0, b0 + k)) * 4 + satir, kw = yat.w[o + k];
        r += veri[sx] * kw; g += veri[sx + 1] * kw; b += veri[sx + 2] * kw; a += veri[sx + 3] * kw;
      }
      const d = hs + x * 4; ara[d] = r; ara[d + 1] = g; ara[d + 2] = b; ara[d + 3] = a;
    }
  }
  // Dikey geçiş
  const cik = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const b0 = dik.bas[y], o = y * dik.n, hs = y * W * 4;
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < dik.n; k++) {
        const sy = Math.min(h - 1, Math.max(0, b0 + k)), kw = dik.w[o + k], s = (sy * W + x) * 4;
        r += ara[s] * kw; g += ara[s + 1] * kw; b += ara[s + 2] * kw; a += ara[s + 3] * kw;
      }
      const d = hs + x * 4; cik[d] = r; cik[d + 1] = g; cik[d + 2] = b; cik[d + 3] = a;
    }
  }
  if (keskinlik > 0) keskinlestir(cik, W, H, keskinlik);
  return { w: W, h: H, veri: cik };
}

/** Unsharp mask: 3×3 kutu bulanıklığından farkı ekler (yalnız RGB). */
function keskinlestir(p: Uint8ClampedArray, W: number, H: number, miktar: number) {
  const kopya = new Uint8ClampedArray(p);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        let t = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) t += kopya[i + (dy * W + dx) * 4 + c];
        const v = kopya[i + c];
        p[i + c] = v + (v - t / 9) * miktar;
      }
    }
  }
}

self.onmessage = (e: MessageEvent<Girdi>) => {
  try {
    const s = buyut(e.data);
    (self as unknown as Worker).postMessage({ ok: true, ...s }, [s.veri.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ ok: false, hata: err instanceof Error ? err.message : "Büyütülemedi" });
  }
};
