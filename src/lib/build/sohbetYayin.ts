import "server-only";

/**
 * Süren sohbet turlarının yayını (süreç içi): tur istekten bağımsız çalışır, her olay tampona yazılır ve bağlı
 * bütün dinleyicilere gider. Sayfa yenilenince ya da sekme değişince istemci aynı yayına yeniden bağlanır, tampondaki
 * olaylar baştan oynatılır, sonra canlı devam eder. Tur bitince yayın bir dakika daha tutulur (geç bağlananlar için).
 * Aynı süreçteki bütün rota paketleri aynı haritayı görsün diye globalThis üzerinde durur.
 */
export type Yayin = {
  satirlar: string[]; dinleyiciler: Set<() => void>; bitti: boolean; durdur: AbortController;
  baslangic: number; asistanId?: string;
};
const G = globalThis as unknown as { __vayraSohbetYayin?: Map<string, Yayin>; __vayraSohbetCalisan?: Map<string, AbortController> };
export const yayinlar = (G.__vayraSohbetYayin ??= new Map<string, Yayin>());
/** Çalışan turlar: sohbet kimliği → durdurma denetleyicisi. */
export const calisanTurlar = (G.__vayraSohbetCalisan ??= new Map<string, AbortController>());

export function yayinBaslat(id: string): Yayin {
  const y: Yayin = { satirlar: [], dinleyiciler: new Set(), bitti: false, durdur: new AbortController(), baslangic: Date.now() };
  yayinlar.set(id, y);
  calisanTurlar.set(id, y.durdur);
  return y;
}
export function yayinYaz(y: Yayin, o: Record<string, unknown>) {
  if (y.bitti) return;
  y.satirlar.push(JSON.stringify(o) + "\n");
  for (const d of y.dinleyiciler) d();
}
export function yayinBitir(id: string, y: Yayin) {
  y.bitti = true;
  for (const d of y.dinleyiciler) d();
  if (calisanTurlar.get(id) === y.durdur) calisanTurlar.delete(id);
  setTimeout(() => { if (yayinlar.get(id) === y) yayinlar.delete(id); }, 60_000);
}

/** Yayını NDJSON akışı olarak verir: tampon baştan, sonra canlı. İstemci koparsa yalnız dinleyici düşer, tur sürer. */
export function yayinAkisi(y: Yayin, signal?: AbortSignal): Response {
  const kodla = new TextEncoder();
  let dinle: (() => void) | null = null;
  const akis = new ReadableStream<Uint8Array>({
    start(c) {
      let i = 0;
      let kapandi = false;
      const kapat = () => { if (kapandi) return; kapandi = true; if (dinle) y.dinleyiciler.delete(dinle); try { c.close(); } catch { /* kapalı */ } };
      dinle = () => {
        if (kapandi) return;
        try { while (i < y.satirlar.length) c.enqueue(kodla.encode(y.satirlar[i++])); } catch { kapat(); return; }
        if (y.bitti) kapat();
      };
      y.dinleyiciler.add(dinle);
      signal?.addEventListener("abort", kapat);
      dinle();
    },
    cancel() { if (dinle) y.dinleyiciler.delete(dinle); },
  });
  return new Response(akis, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
