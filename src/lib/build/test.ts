import "server-only";

/**
 * Ajanın kendi işini test etmesi: önizleme görünmez tarayıcıda açılır, her sayfada sayfa hataları, konsol hataları
 * ve yüklenemeyen proje dosyaları toplanır. Tarayıcı motoru (playwright-core + Edge/Chrome/Chromium) yoksa null döner
 * ve test adımı atlanır. Sayfa başına en çok 8 sn; en çok 5 sayfa.
 */
export type SayfaSonucu = { sayfa: string; hatalar: string[] };

export async function onizlemeyiTestEt(koken: string, id: string, belirtec: string, sayfalar: string[]): Promise<SayfaSonucu[] | null> {
  const pw = await import("playwright-core").catch(() => null);
  if (!pw) return null;
  let tarayici: import("playwright-core").Browser | null = null;
  for (const kanal of ["msedge", "chrome", undefined]) {
    try { tarayici = await pw.chromium.launch(kanal ? { channel: kanal } : {}); break; } catch { /* sıradaki */ }
  }
  if (!tarayici) return null;
  const t = tarayici as import("playwright-core").Browser;
  try {
    const c = await t.newContext({ viewport: { width: 1280, height: 800 } });
    const kok = `${koken}/api/build/onizleme/${id}/${belirtec}`;
    const sonuc: SayfaSonucu[] = [];
    for (const sayfa of sayfalar.slice(0, 5)) {
      const s = await c.newPage();
      const hatalar: string[] = [];
      s.on("pageerror", (e) => hatalar.push(`Hata: ${e.message}`));
      s.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/i.test(m.text())) hatalar.push(`Konsol: ${m.text().slice(0, 300)}`); });
      s.on("response", (r) => { const u = r.url(); if (r.status() === 404 && u.startsWith(kok)) hatalar.push(`Eksik dosya: ${decodeURIComponent(u.slice(kok.length + 1)) || "index.html"}`); });
      try {
        await s.goto(`${kok}/${sayfa === "index.html" ? "" : sayfa}`, { waitUntil: "load", timeout: 8000 });
        await s.waitForTimeout(1200);
        // Oyun ve uygulamalarda ilk etkileşimi dene: görünür ilk düğmeye bas (başla, oyna …).
        const dugme = s.locator("button:visible").first();
        if (await dugme.count().catch(() => 0)) { await dugme.click({ timeout: 1500 }).catch(() => {}); await s.waitForTimeout(900); }
      } catch (e) { hatalar.push(`Sayfa açılamadı: ${(e as Error).message.split("\n")[0].slice(0, 200)}`); }
      sonuc.push({ sayfa, hatalar: [...new Set(hatalar)].slice(0, 8) });
      await s.close().catch(() => {});
    }
    return sonuc;
  } finally {
    await t.close().catch(() => {});
  }
}
