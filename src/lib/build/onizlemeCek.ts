import "server-only";

/**
 * Sunucuda gerçek tarayıcıyla (playwright-core + Edge/Chrome/Chromium) sayfa görüntüsü. Tarayıcı motoru yoksa null döner;
 * çağıran bunu dürüstçe söyler. Kapak çekicisiyle aynı yoldan açılır. Görüntü JPEG olarak döner.
 */
export async function sayfaGoruntusu(adres: string, g: { genislik: number; yukseklik: number; y?: number; tamSayfa?: boolean; olcek?: number }): Promise<Buffer | null> {
  const pw = await import("playwright-core").catch(() => null);
  if (!pw) return null;
  let t: import("playwright-core").Browser | null = null;
  for (const kanal of ["msedge", "chrome", undefined]) {
    try { t = await pw.chromium.launch(kanal ? { channel: kanal } : {}); break; } catch { /* sıradaki */ }
  }
  if (!t) return null;
  try {
    const w = Math.round(Math.min(2560, Math.max(320, g.genislik))), h = Math.round(Math.min(2400, Math.max(320, g.yukseklik)));
    const c = await t.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: g.olcek ?? 1 });
    const s = await c.newPage();
    await s.goto(adres, { waitUntil: "networkidle", timeout: 15000 }).catch(() => s.waitForTimeout(1500));
    if (g.y) await s.evaluate((y) => window.scrollTo(0, y), Math.round(g.y));
    await s.waitForTimeout(700);
    return await s.screenshot({ type: "jpeg", quality: 82, fullPage: !!g.tamSayfa });
  } catch { return null; } finally { await t.close().catch(() => {}); }
}
