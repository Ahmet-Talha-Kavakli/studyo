import "server-only";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";

/**
 * Ajanın tarayıcı testi: önizleme görünmez tarayıcıda açılır, verilen adımlar (tıkla, yaz, seç, bekle, gör, git, kaydır)
 * sırayla uygulanır ve her adımdan sonra ekran görüntüsü alınır. Sayfa hataları ve konsol hataları toplanır.
 * Tarayıcı motoru yoksa null döner. En çok 15 adım, adım başına 6 sn, toplam 60 sn.
 */
export type TestEylem = "git" | "tikla" | "yaz" | "sec" | "bekle" | "gor" | "gorme" | "kaydir" | "tus";
export type TestAdimGirdi = { eylem: TestEylem; hedef?: string; deger?: string };
export type TestAdimSonuc = { ad: string; durum: "gecti" | "kaldi"; gorsel?: string; hata?: string };
export type TestSonucu = { baslik: string; cihaz: "masaustu" | "mobil"; adimlar: TestAdimSonuc[]; hatalar: string[]; sonMetin: string; gecti: boolean; sure: number };

const EYLEM_AD: Record<TestEylem, string> = { git: "Sayfaya git", tikla: "Tıkla", yaz: "Yaz", sec: "Seç", bekle: "Bekle", gor: "Görünüyor mu", gorme: "Görünmüyor mu", kaydir: "Kaydır", tus: "Tuşa bas" };

export function adimAdi(a: TestAdimGirdi, etiket?: string): string {
  const h = etiket ? ` "${etiket.slice(0, 50)}"` : a.hedef ? ` "${a.hedef.slice(0, 60)}"` : "";
  if (a.eylem === "tikla" && etiket) return `${h.trim()} öğesine tıkla`;
  if (a.eylem === "yaz") return `${h.trim() || "Alan"} alanına "${(a.deger ?? "").slice(0, 40)}" yaz`;
  if (a.eylem === "sec") return `${h.trim() || "Liste"} içinden "${(a.deger ?? "").slice(0, 40)}" seç`;
  if (a.eylem === "bekle") return `${a.deger ?? "1"} sn bekle`;
  if (a.eylem === "tus") return `${a.deger ?? "Enter"} tuşuna bas`;
  return `${EYLEM_AD[a.eylem]}${h}`;
}

export async function tarayiciTesti(koken: string, id: string, belirtec: string, g: { baslik: string; sayfa: string; cihaz: "masaustu" | "mobil"; adimlar: TestAdimGirdi[] }): Promise<TestSonucu | null> {
  const pw = await import("playwright-core").catch(() => null);
  if (!pw) return null;
  let tarayici: import("playwright-core").Browser | null = null;
  for (const kanal of ["msedge", "chrome", undefined]) {
    try { tarayici = await pw.chromium.launch(kanal ? { channel: kanal } : {}); break; } catch { /* sıradaki */ }
  }
  if (!tarayici) return null;
  const t = tarayici as import("playwright-core").Browser;
  const bas = Date.now();
  const kok = `${koken}/api/build/onizleme/${id}/${belirtec}`;
  const adres = (s: string) => `${kok}/${s.replace(/^\/+/, "").replace(/^index\.html$/, "")}`;
  try {
    const c = await t.newContext(g.cihaz === "mobil" ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
    const s = await c.newPage();
    const hatalar: string[] = [];
    s.on("pageerror", (e) => hatalar.push(`Hata: ${e.message.slice(0, 300)}`));
    s.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/i.test(m.text())) hatalar.push(`Konsol: ${m.text().slice(0, 300)}`); });
    const cek = async () => {
      try {
        const b = await s.screenshot({ type: "jpeg", quality: 62 });
        return await ciktiKalicilastir("gorsel", `data:image/jpeg;base64,${b.toString("base64")}`);
      } catch { return undefined; }
    };
    /** Hedef: CSS seçici ya da görünür metin (önce seçici denenir). */
    const bul = async (h: string) => {
      const secici = s.locator(h).first();
      if (await secici.count().catch(() => 0)) return secici;
      const etiket = s.getByLabel(h, { exact: false }).first();
      if (await etiket.count().catch(() => 0)) return etiket;
      const yer = s.getByPlaceholder(h, { exact: false }).first();
      if (await yer.count().catch(() => 0)) return yer;
      const rol = s.getByRole("button", { name: h, exact: false }).first();
      if (await rol.count().catch(() => 0)) return rol;
      return s.getByText(h, { exact: false }).first();
    };
    /** Öğenin insanca adı: etiket, aria-label, yer tutucu, ad ya da görünen metin. */
    const insanAdi = async (h: string) => {
      try {
        const l = await bul(h);
        return await l.evaluate((el) => {
          const e = el as HTMLInputElement;
          const t = (x?: string | null) => (x ?? "").replace(/\s+/g, " ").trim();
          return t(e.labels?.[0]?.innerText) || t(e.getAttribute("aria-label")) || t(e.getAttribute("placeholder")) || t((el as HTMLElement).innerText).slice(0, 50) || t(e.getAttribute("name")) || "";
        }, undefined, { timeout: 1500 });
      } catch { return ""; }
    };
    const sonuc: TestAdimSonuc[] = [];
    await s.goto(adres(g.sayfa || "index.html"), { waitUntil: "load", timeout: 10000 }).catch((e) => hatalar.push(`Sayfa açılamadı: ${(e as Error).message.split("\n")[0].slice(0, 200)}`));
    await s.waitForTimeout(900);
    sonuc.push({ ad: `${g.sayfa || "index.html"} açıldı`, durum: hatalar.some((h) => h.startsWith("Sayfa açılamadı")) ? "kaldi" : "gecti", gorsel: await cek() });
    for (const a of g.adimlar.slice(0, 15)) {
      if (Date.now() - bas > 60_000) { sonuc.push({ ad: adimAdi(a), durum: "kaldi", hata: "Test süresi (60 sn) doldu" }); break; }
      let hata: string | undefined;
      const etiket = a.hedef && a.eylem !== "git" && a.eylem !== "gor" && a.eylem !== "gorme" ? await insanAdi(a.hedef) : "";
      try {
        switch (a.eylem) {
          case "git": await s.goto(adres(a.hedef ?? ""), { waitUntil: "load", timeout: 8000 }); await s.waitForTimeout(600); break;
          case "tikla": await (await bul(a.hedef ?? "")).click({ timeout: 5000 }); await s.waitForTimeout(700); break;
          case "yaz": await (await bul(a.hedef ?? "")).fill(a.deger ?? "", { timeout: 5000 }); break;
          case "sec": await (await bul(a.hedef ?? "")).selectOption({ label: a.deger ?? "" }, { timeout: 5000 }).catch(async () => (await bul(a.hedef ?? "")).selectOption(a.deger ?? "", { timeout: 3000 })); break;
          case "bekle": await s.waitForTimeout(Math.min(5, Math.max(0.2, Number(a.deger) || 1)) * 1000); break;
          case "gor": await (await bul(a.hedef ?? "")).waitFor({ state: "visible", timeout: 5000 }); break;
          case "gorme": await (await bul(a.hedef ?? "")).waitFor({ state: "hidden", timeout: 5000 }); break;
          case "kaydir": if (a.hedef) await (await bul(a.hedef)).scrollIntoViewIfNeeded({ timeout: 5000 }); else await s.mouse.wheel(0, 700); await s.waitForTimeout(400); break;
          case "tus": await s.keyboard.press(a.deger || "Enter"); await s.waitForTimeout(500); break;
        }
      } catch (e) { hata = (e as Error).message.split("\n")[0].replace(/locator\.[a-zA-Z]+: /, "").slice(0, 220); }
      sonuc.push({ ad: adimAdi(a, etiket), durum: hata ? "kaldi" : "gecti", hata, gorsel: a.eylem === "bekle" ? undefined : await cek() });
      if (hata && a.eylem !== "gor" && a.eylem !== "gorme") break;
    }
    const sonMetin = (await s.evaluate(() => document.body?.innerText ?? "").catch(() => "")).replace(/\n{3,}/g, "\n\n").slice(0, 1500);
    const tekil = [...new Set(hatalar)].slice(0, 10);
    return { baslik: g.baslik, cihaz: g.cihaz, adimlar: sonuc, hatalar: tekil, sonMetin, gecti: sonuc.every((x) => x.durum === "gecti") && !tekil.some((h) => h.startsWith("Hata")), sure: Math.round((Date.now() - bas) / 1000) };
  } finally {
    await t.close().catch(() => {});
  }
}
