import { stat } from "fs/promises";
import { projeOku } from "@/lib/build/depo";
import { dosyaOku, dosyaTasi, dosyaYolu, guvenliAd, imzaGecerli, imzala, klasorTemizle, kovalar, onbellekBasligi, turBul, yolGecerli } from "@/lib/build/depolama";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { gunlukYaz } from "@/lib/build/gunluk";
import { donusebilirMi, donusumCoz, gorselDonustur, GorselSiniri } from "@/lib/build/bulutGorsel";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; kova: string; ad: string[] }> };
/** Adres parçaları çözülüp birleştirilir ("klasor/alt/ad.png"). */
const yolAl = (l: string[]) => l.map((x) => { try { return decodeURIComponent(x); } catch { return x; } }).join("/");

/**
 * Dosyayı sunar: herkese açık kovada herkes; imzalı kovada geçerli ?imza=&bitis= ya da sahip. Önbellek başlığı kovanın
 * ayarından (süre, değişmez); ETag ve If-None-Match ile 304. Görsellerde ?w=&h=&fit=&fm=&q= ile dönüşüm (bulutGorsel):
 * önbellekte yoksa üretilir; yeni dönüşüm IP başına dakikada 60 ile sınırlıdır.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id, kova, ad: parcalar } = await params;
  const ad = yolAl(parcalar);
  const k = (await kovalar(id)).find((x) => x.ad === kova);
  if (!k || !yolGecerli(ad)) return new Response("Bulunamadı", { status: 404 });
  const sahip = sahipAl(req);
  if (k.okuma === "imzali") {
    const q = new URL(req.url).searchParams;
    const izin = imzaGecerli(id, kova, ad, Number(q.get("bitis")), q.get("imza") ?? "") || (!!sahip && !!(await projeOku(id, sahip)));
    if (!izin) return new Response("Bu dosyanın bağlantısı geçersiz ya da süresi dolmuş.", { status: 403 });
  }
  const yol = dosyaYolu(id, kova, ad)!;
  const st = await stat(yol).catch(() => null);
  if (!st?.isFile()) return new Response("Bulunamadı", { status: 404 });
  const tur = turBul(ad);
  const d = donusumCoz(new URL(req.url).searchParams, req.headers.get("accept") ?? "");
  const etiket = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}${d && !("hata" in d) ? `-${Buffer.from(new URL(req.url).search).toString("base64url").slice(0, 24)}` : ""}"`;
  const ortak = { "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*", "Cache-Control": onbellekBasligi(k), ETag: etiket };
  if (req.headers.get("if-none-match") === etiket) return new Response(null, { status: 304, headers: ortak });
  const v = await dosyaOku(id, kova, ad);
  if (!v) return new Response("Bulunamadı", { status: 404 });
  if (d && "hata" in d) return new Response(`Geçersiz dönüşüm: ${d.hata}.`, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", ...ortak } });
  if (d && donusebilirMi(tur)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
    try {
      const r = await gorselDonustur(id, yol, v, tur, d, () => !!sahip || hizSiniri(`gorsel:${id}:${ip}`, 60, 60_000));
      return new Response(new Uint8Array(r.veri), { headers: { "Content-Type": r.tur, "Content-Length": String(r.veri.length), ...ortak, ...(new URL(req.url).searchParams.get("fm") ?? "auto") === "auto" ? { Vary: "Accept" } : {}, "X-Vayra-Donusum": r.onbellek ? "onbellek" : "uretildi", "X-Vayra-Kaynak-Boyut": String(v.length) } });
    } catch (e) {
      if (e instanceof GorselSiniri) return new Response(e.message, { status: 429, headers: { "Retry-After": "60", "Content-Type": "text/plain; charset=utf-8", ...ortak } });
      return new Response(`Görsel dönüştürülemedi: ${(e as Error).message}`, { status: 422, headers: { "Content-Type": "text/plain; charset=utf-8", ...ortak } });
    }
  }
  const dosyaAdi = ad.split("/").pop() ?? ad;
  return new Response(new Uint8Array(v), {
    headers: {
      "Content-Type": tur, "Content-Length": String(v.length), ...ortak, "Last-Modified": new Date(st.mtimeMs).toUTCString(),
      // SVG ve HTML benzeri içerik betik çalıştırmasın.
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox",
      ...(/^(image|video|audio|font)\//.test(tur) || tur === "application/pdf" || tur.startsWith("model/") ? {} : { "Content-Disposition": `attachment; filename="${dosyaAdi}"` }),
    },
  });
}

/** Süreli imzalı bağlantı üret (sahip): { dakika } → { adres, bitis } */
export async function POST(req: Request, { params }: Ctx) {
  const { id, kova, ad: parcalar } = await params;
  const ad = yolAl(parcalar);
  const sahip = sahipAl(req);
  if (!sahip || !(await projeOku(id, sahip))) return hata("Yetki yok.", 403);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!yolGecerli(ad)) return hata("Dosya yolu geçersiz.");
  let g: { dakika?: number } = {};
  try { g = await req.json(); } catch { /* varsayılan */ }
  const bitis = Date.now() + Math.max(5, Math.min(60 * 24 * 30, Number(g.dakika) || 60)) * 60_000;
  return Response.json({ ok: true, bitis, adres: `/api/build/depolama/${id}/${kova}/${ad.split("/").map(encodeURIComponent).join("/")}?bitis=${bitis}&imza=${imzala(id, kova, ad, bitis)}` });
}

/**
 * Yeniden adlandır ya da taşı (sahip): { yeniAd?, klasor? } → { ad }. yeniAd verilmezse ad korunur; klasor verilirse
 * dosya o klasöre taşınır ("" kök). Uzantı korunur; hedef doluysa hata.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id, kova, ad: parcalar } = await params;
  const ad = yolAl(parcalar);
  const sahip = sahipAl(req);
  if (!sahip || !(await projeOku(id, sahip))) return hata("Yetki yok.", 403);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!(await kovalar(id)).some((x) => x.ad === kova) || !yolGecerli(ad)) return hata("Dosya bulunamadı.", 404);
  let g: { yeniAd?: string; klasor?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const eskiAd = ad.split("/").pop()!, eskiKlasor = ad.includes("/") ? ad.slice(0, ad.lastIndexOf("/")) : "";
  const uzanti = /\.[A-Za-z0-9]{1,6}$/.exec(eskiAd)?.[0] ?? "";
  let yeniAd = g.yeniAd !== undefined ? guvenliAd(String(g.yeniAd).trim()) : eskiAd;
  if (!yeniAd.toLowerCase().endsWith(uzanti.toLowerCase())) yeniAd = yeniAd.replace(/\.[^.]+$/, "") + uzanti;
  const klasor = g.klasor !== undefined ? klasorTemizle(g.klasor) : eskiKlasor;
  if (klasor === null) return hata("Klasör yolu geçersiz.");
  const yeni = klasor ? `${klasor}/${yeniAd}` : yeniAd;
  if (!yolGecerli(yeni)) return hata("Ad yalnız harf, rakam, nokta, tire ve alt çizgi olabilir.");
  if (yeni === ad) return Response.json({ ok: true, ad });
  try { await dosyaTasi(id, kova, ad, yeni); } catch (e) { return hata((e as Error).message); }
  const tasindi = klasor !== eskiKlasor;
  gunlukYaz(id, { t: "dosya", m: `${kova}/${ad} ${tasindi ? "taşındı" : "adı değişti"}: ${yeni}` });
  denetimYaz(id, { tur: "dosya", kim: await denetimKim(id, sahip), mesaj: `${kova}/${ad} ${tasindi ? `${klasor || "kök"} klasörüne taşındı` : `dosyasının adı ${yeniAd} oldu`}` });
  return Response.json({ ok: true, ad: yeni });
}
