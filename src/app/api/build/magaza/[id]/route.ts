import { projeOku } from "@/lib/build/depo";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { izleyiciEngeli } from "@/lib/build/ekipRota";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Mağaza görselleri: uygulamanın ekranları telefon ölçüsünde çekilir ve App Store / Google Play tanıtım görseline
 * (1290×2796, üstte başlık, altta yuvarlatılmış ekran, tema renginde zemin) dönüştürülür. Zip olarak iner.
 * Gövde: { basliklar?: string[] } — her görselin üst yazısı (yoksa proje adı ve açıklamasından).
 */
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(dosyalar: { ad: string; veri: Buffer }[]): Buffer {
  const yerel: Buffer[] = [], merkez: Buffer[] = [];
  let o = 0;
  for (const d of dosyalar) {
    const ad = Buffer.from(d.ad), c = crc(d.veri);
    const y = Buffer.alloc(30); y.writeUInt32LE(0x04034b50, 0); y.writeUInt16LE(20, 4); y.writeUInt32LE(c, 14); y.writeUInt32LE(d.veri.length, 18); y.writeUInt32LE(d.veri.length, 22); y.writeUInt16LE(ad.length, 26);
    yerel.push(y, ad, d.veri);
    const m = Buffer.alloc(46); m.writeUInt32LE(0x02014b50, 0); m.writeUInt16LE(20, 4); m.writeUInt16LE(20, 6); m.writeUInt32LE(c, 16); m.writeUInt32LE(d.veri.length, 20); m.writeUInt32LE(d.veri.length, 24); m.writeUInt16LE(ad.length, 28); m.writeUInt32LE(o, 42);
    merkez.push(m, ad);
    o += 30 + ad.length + d.veri.length;
  }
  const mb = Buffer.concat(merkez);
  const s = Buffer.alloc(22); s.writeUInt32LE(0x06054b50, 0); s.writeUInt16LE(dosyalar.length, 8); s.writeUInt16LE(dosyalar.length, 10); s.writeUInt32LE(mb.length, 12); s.writeUInt32LE(o, 16);
  return Buffer.concat([...yerel, mb, s]);
}
const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Uzun başlığı en çok 2 satıra böler (yaklaşık karakter genişliğiyle). */
function satirla(s: string, en = 22): string[] {
  const k = s.split(/\s+/), l: string[] = [];
  let a = "";
  for (const w of k) { if ((a + " " + w).trim().length > en && a) { l.push(a); a = w; } else a = (a + " " + w).trim(); }
  if (a) l.push(a);
  return l.slice(0, 3);
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  if (!p.dosyalar["index.html"]) return hata("Önce uygulama oluşsun.", 409);
  let g: { basliklar?: string[] } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const pw = await import("playwright-core").catch(() => null);
  if (!pw) return hata("Mağaza görseli üretici bu sunucuda yok.", 501);
  let tarayici = null as import("playwright-core").Browser | null;
  for (const kanal of ["msedge", "chrome", undefined]) { try { tarayici = await pw.chromium.launch(kanal ? { channel: kanal } : {}); break; } catch { /* sıradaki */ } }
  const t = tarayici as import("playwright-core").Browser | null;
  if (!t) return hata("Mağaza görseli üretici bu sunucuda yok.", 501);
  try {
    const sharp = (await import("sharp")).default;
    const c = await t.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const s = await c.newPage();
    const koken = new URL(req.url).origin.replace("0.0.0.0", "localhost");
    const kok = `${koken}/api/build/onizleme/${id}/${p.onizlemeBelirteci}`;
    const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html").sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
    const ekranlar: Buffer[] = [];
    for (const y of sayfalar.slice(0, 3)) {
      await s.goto(`${kok}/${y === "index.html" ? "" : y}`, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await s.waitForTimeout(1000);
      ekranlar.push(await s.screenshot());
    }
    // Tek sayfalı uygulamada sekme düğmelerine basarak farklı ekranlar dene (alt sekme çubuğu).
    if (ekranlar.length < 3) {
      const sekmeler = s.locator("nav button, [role=tab], .sekme, .tab");
      const n = Math.min(await sekmeler.count().catch(() => 0), 4);
      for (let i = 1; i < n && ekranlar.length < 4; i++) { await sekmeler.nth(i).click({ timeout: 1500 }).catch(() => {}); await s.waitForTimeout(700); ekranlar.push(await s.screenshot()); }
    }
    const tema = (/name=["']theme-color["'][^>]*content=["']([^"']+)/i.exec(p.dosyalar["index.html"])?.[1] ?? "#14161c").trim();
    const basliklar = g.basliklar?.length ? g.basliklar : [p.ad, p.ayarlar.seo.aciklama || "Her gün yanında", "Basit, hızlı, senin için", "Hemen indir"];
    const W = 1290, H = 2796;
    const cikti: { ad: string; veri: Buffer }[] = [];
    for (const [i, e] of ekranlar.entries()) {
      const ekranG = 980, ekranY = Math.round(ekranG * (932 / 430));
      const yuv = Buffer.from(`<svg width="${ekranG}" height="${ekranY}"><rect width="${ekranG}" height="${ekranY}" rx="72" ry="72"/></svg>`);
      const ekr = await sharp(e).resize(ekranG, ekranY).composite([{ input: yuv, blend: "dest-in" }]).png().toBuffer();
      const satir = satirla(basliklar[i % basliklar.length] ?? p.ad);
      const yazi = Buffer.from(`<svg width="${W}" height="520" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-weight:700;fill:#fff}</style>${satir.map((l, j) => `<text x="${W / 2}" y="${220 + j * 118}" font-size="104" text-anchor="middle">${kac(l)}</text>`).join("")}</svg>`);
      const zemin = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${kac(tema)}"/><stop offset="1" stop-color="#0b0b0e"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
      const png = await sharp(zemin).composite([{ input: yazi, top: 60, left: 0 }, { input: ekr, top: Math.min(H - ekranY + 120, 560), left: Math.round((W - ekranG) / 2) }]).png().toBuffer();
      cikti.push({ ad: `magaza-${i + 1}.png`, veri: png });
    }
    const z = zip(cikti);
    return new Response(new Uint8Array(z), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${p.ayarlar.altAlan}-magaza-gorselleri.zip"` } });
  } catch (e) {
    return hata(`Görseller üretilemedi: ${(e as Error).message.slice(0, 120)}`, 500);
  } finally { await t.close().catch(() => {}); }
}
