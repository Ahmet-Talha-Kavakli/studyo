"use client";

/**
 * Tarayıcıda (AI olmayan) büyütme: görseli çöz → Worker'da Lanczos-3 + unsharp → WebP'ye kodla →
 * sunucu deposuna yükle. Sağlayıcı bağlı değilken dürüst seçenek; yeni detay üretmez.
 */
export async function yerelBuyut(kaynakUrl: string, olcek: number, keskinlik = 0.35): Promise<{ url: string; w: number; h: number }> {
  const g = await gorselYukle(kaynakUrl);
  const c = document.createElement("canvas");
  c.width = g.naturalWidth; c.height = g.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(g, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);

  const sonuc = await new Promise<{ w: number; h: number; veri: Uint8ClampedArray }>((coz, red) => {
    const w = new Worker(new URL("./yerelBuyut.worker.ts", import.meta.url));
    w.onmessage = (e: MessageEvent<{ ok: boolean; w: number; h: number; veri: Uint8ClampedArray; hata?: string }>) => {
      w.terminate();
      if (e.data.ok) coz(e.data); else red(new Error(e.data.hata));
    };
    w.onerror = (e) => { w.terminate(); red(new Error(e.message || "Büyütme başarısız")); };
    w.postMessage({ w: c.width, h: c.height, veri: id.data, olcek, keskinlik }, [id.data.buffer]);
  });

  const o = document.createElement("canvas");
  o.width = sonuc.w; o.height = sonuc.h;
  o.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(sonuc.veri), sonuc.w, sonuc.h), 0, 0);
  const blob = await new Promise<Blob>((coz, red) => o.toBlob((b) => (b ? coz(b) : red(new Error("Kodlanamadı"))), "image/webp", 0.95));
  const fd = new FormData();
  fd.append("dosya", new File([blob], "buyutulmus.webp", { type: "image/webp" }));
  fd.append("sonuc", "1");
  const r = await fetch("/api/upscale/yukle", { method: "POST", body: fd }).then((x) => x.json()) as { ok: boolean; url?: string; hata?: string };
  if (!r.ok || !r.url) throw new Error(r.hata ?? "Kaydedilemedi");
  return { url: r.url, w: sonuc.w, h: sonuc.h };
}

function gorselYukle(url: string): Promise<HTMLImageElement> {
  return new Promise((coz, red) => {
    const g = new Image();
    g.crossOrigin = "anonymous";
    g.onload = () => coz(g);
    g.onerror = () => red(new Error("Görsel okunamadı"));
    g.src = url;
  });
}
