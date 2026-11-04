/**
 * Görselle arama (Midjourney "reference image" araması gibi), tamamen cihazda: her görsel 8×8 renk ızgarasına ve
 * parlaklık dağılımına indirgenir; iki imza arasındaki fark ne kadar küçükse görseller o kadar benzer. Sonuçlar
 * bellekte önbelleklenir; dışarıdan gelen ve tuvali kirleten görseller sessizce atlanır.
 */

const BOYUT = 8;
const onbellek = new Map<string, Promise<Float32Array | null>>();

function yukle(src: string): Promise<HTMLImageElement> {
  return new Promise((coz, red) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => coz(img);
    img.onerror = () => red(new Error("yüklenemedi"));
    img.src = src;
  });
}

/** Görselin imzası: 8×8 ızgarada her hücrenin ortalama rengi (0–1) + 8 dilimli parlaklık histogramı. */
export function imza(src: string): Promise<Float32Array | null> {
  const var_ = onbellek.get(src);
  if (var_) return var_;
  const p = (async () => {
    try {
      const img = await yukle(src);
      const c = document.createElement("canvas");
      c.width = BOYUT; c.height = BOYUT;
      const x = c.getContext("2d", { willReadFrequently: true });
      if (!x) return null;
      x.drawImage(img, 0, 0, BOYUT, BOYUT);
      const d = x.getImageData(0, 0, BOYUT, BOYUT).data;
      const v = new Float32Array(BOYUT * BOYUT * 3 + 8);
      for (let i = 0, k = 0; i < d.length; i += 4) {
        v[k++] = d[i] / 255; v[k++] = d[i + 1] / 255; v[k++] = d[i + 2] / 255;
        const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        v[BOYUT * BOYUT * 3 + Math.min(7, Math.floor(l * 8))] += 1 / (BOYUT * BOYUT);
      }
      return v;
    } catch {
      return null;
    }
  })();
  onbellek.set(src, p);
  return p;
}

/** 0–1 arası benzerlik: yerleşim (ızgara) %75, ton dağılımı (histogram) %25. */
export function benzerlik(a: Float32Array, b: Float32Array): number {
  const n = BOYUT * BOYUT * 3;
  let iz = 0; for (let i = 0; i < n; i++) iz += Math.abs(a[i] - b[i]);
  let hs = 0; for (let i = n; i < a.length; i++) hs += Math.abs(a[i] - b[i]);
  return 0.75 * (1 - iz / n) + 0.25 * (1 - hs / 2);
}

/** Sorgu görseline göre kaynakların puanı (id → 0–1). */
export async function gorseleGorePuanla(sorgu: string, kaynaklar: { id: string; src?: string }[]): Promise<Map<string, number>> {
  const q = await imza(sorgu);
  const m = new Map<string, number>();
  if (!q) return m;
  const imzalar = await Promise.all(kaynaklar.map((k) => (k.src ? imza(k.src) : Promise.resolve(null))));
  imzalar.forEach((s, i) => { if (s) m.set(kaynaklar[i].id, benzerlik(q, s)); });
  return m;
}
