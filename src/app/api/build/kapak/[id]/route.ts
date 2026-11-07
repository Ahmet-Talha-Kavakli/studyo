import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { projeOku, projeOkuHam, projeYaz } from "@/lib/build/depo";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { DEPO_KOK } from "@/lib/dosyaDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Proje kapağı: önizlemenin gerçek ekran görüntüsü (1280×800 webp). Sunucuda tarayıcı motoru (playwright-core +
 * Edge/Chromium) varsa çekilir; yoksa 501 döner ve arayüz türün görseline düşer. Proje başına 20 sn'de bir.
 *  POST (sahip): çek ve proje.kapak'ı güncelle   GET: görseli sun (herkese açık, önbellekli)
 */
const dosya = (id: string) => path.join(DEPO_KOK, "build", "kapak", `${id}.webp`);
const son = new Map<string, number>();

export async function GET(_req: Request, { params }: Ctx) {
  const id = (await params).id;
  try {
    const b = await readFile(dosya(id));
    return new Response(new Uint8Array(b), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=60" } });
  } catch { return new Response("Kapak yok", { status: 404 }); }
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  if (!p.dosyalar["index.html"]) return hata("Önce proje oluşsun.", 409);
  if (Date.now() - (son.get(id) ?? 0) < 20_000) return Response.json({ ok: true, kapak: p.kapak, atlandi: true });
  son.set(id, Date.now());
  let tarayici = null as import("playwright-core").Browser | null;
  try {
    const pw = await import("playwright-core").catch(() => null);
    if (!pw) return hata("Kapak çekici bu sunucuda yok.", 501);
    for (const kanal of ["msedge", "chrome", undefined]) {
      try { tarayici = await pw.chromium.launch(kanal ? { channel: kanal } : {}); break; } catch { /* sıradaki */ }
    }
    const t = tarayici as import("playwright-core").Browser | null;
    if (!t) return hata("Kapak çekici bu sunucuda yok.", 501);
    const c = await t.newContext({ viewport: p.tur === "mobil" ? { width: 390, height: 780 } : { width: 1280, height: 800 }, deviceScaleFactor: p.tur === "mobil" ? 2 : 1 });
    const s = await c.newPage();
    const koken = new URL(req.url).origin.replace("0.0.0.0", "localhost");
    await s.goto(`${koken}/api/build/onizleme/${id}/${p.onizlemeBelirteci}/`, { waitUntil: "networkidle", timeout: 15000 });
    await s.waitForTimeout(1200);
    const png = await s.screenshot();
    const sharp = (await import("sharp")).default;
    let cikti: Buffer;
    if (p.tur === "mobil") {
      const tel = await sharp(png).resize({ height: 700 }).png().toBuffer();
      const m = await sharp(tel).metadata();
      const maske = Buffer.from(`<svg width="${m.width}" height="${m.height}"><rect width="${m.width}" height="${m.height}" rx="36" ry="36"/></svg>`);
      const kesik = await sharp(tel).composite([{ input: maske, blend: "dest-in" }]).png().toBuffer();
      cikti = await sharp({ create: { width: 1280, height: 800, channels: 4, background: "#15161a" } }).composite([{ input: kesik, left: Math.round((1280 - (m.width ?? 0)) / 2), top: 50 }]).webp({ quality: 80 }).toBuffer();
    } else cikti = await sharp(png).resize(960, 600).webp({ quality: 80 }).toBuffer();
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), cikti);
    const guncel = await projeOkuHam(id);
    if (guncel) {
      const { sahip: _s, ...temiz } = guncel; void _s;
      temiz.kapak = `/api/build/kapak/${id}?v=${Date.now()}`;
      await projeYaz(temiz, sahip);
      return Response.json({ ok: true, kapak: temiz.kapak });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return hata(`Kapak çekilemedi: ${(e as Error).message.slice(0, 120)}`, 500);
  } finally {
    await (tarayici as import("playwright-core").Browser | null)?.close().catch(() => {});
  }
}
