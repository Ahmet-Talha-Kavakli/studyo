"use client";

/**
 * Görselden baskın renk paleti çıkarır (tarayıcıda, ücretsiz): görsel 96 px'e küçültülür,
 * pikseller median-cut ile `adet` kutuya bölünür, her kutunun ortalaması bir renk olur.
 * Sonuç kutu büyüklüğüne (kapsadığı alan) göre sıralıdır.
 */
export async function paletCikar(url: string, adet = 6): Promise<string[]> {
  const g = await new Promise<HTMLImageElement>((coz, red) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => coz(i);
    i.onerror = () => red(new Error("Görsel okunamadı"));
    i.src = url;
  });
  const k = 96 / Math.max(g.naturalWidth, g.naturalHeight);
  const w = Math.max(1, Math.round(g.naturalWidth * k)), h = Math.max(1, Math.round(g.naturalHeight * k));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(g, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const pikseller: number[][] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) pikseller.push([d[i], d[i + 1], d[i + 2]]);
  if (!pikseller.length) return [];

  let kutular: number[][][] = [pikseller];
  while (kutular.length < adet) {
    // En geniş renk aralığına sahip kutuyu en uzun ekseninden ortadan böl.
    let en = -1, ei = 0, ek = 0;
    kutular.forEach((b, bi) => {
      if (b.length < 2) return;
      for (let x = 0; x < 3; x++) {
        let mn = 255, mx = 0;
        for (const p of b) { if (p[x] < mn) mn = p[x]; if (p[x] > mx) mx = p[x]; }
        if (mx - mn > en) { en = mx - mn; ei = bi; ek = x; }
      }
    });
    if (en <= 0) break;
    const b = kutular[ei].sort((a, z) => a[ek] - z[ek]);
    const o = b.length >> 1;
    kutular = [...kutular.slice(0, ei), b.slice(0, o), b.slice(o), ...kutular.slice(ei + 1)];
  }
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  // Birbirine çok yakın renkler (az renkli görselde aynı rengin kutuları) tek renge indirgenir.
  const secilen: number[][] = [];
  for (const b of kutular.sort((a, z) => z.length - a.length)) {
    const t = b.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map((x) => x / b.length);
    if (secilen.every((c) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]) > 28)) secilen.push(t);
  }
  return secilen.map((c) => `#${hex(c[0])}${hex(c[1])}${hex(c[2])}`);
}
