import { alanAdindanKimlik, altAlandanProje, projeOkuHam } from "@/lib/build/depo";
import { cihaz, gunlukYaz } from "@/lib/build/gunluk";
import { fonksiyonAyrintisi, fonksiyonIstegi } from "@/lib/build/fonksiyon";
import { dosyaSun, sifreKontrol } from "@/lib/build/sun";
import { CORS } from "@/lib/build/sunucu";
import { bulutAyarOku, istemciIp, ipOzeti, tarayiciAdi, ulkeBul } from "@/lib/build/bulutAyar";
import { bakimSayfasi, duvarDenetle, sinavSayfasi } from "@/lib/build/bulutDuvar";
import { bulunamadiSay } from "@/lib/build/bulutAnalitik";
import { kodZamanlamalariniEsitle, zamanliBaslat } from "@/lib/build/bulutZamanli";
import { siteHaritasi } from "@/lib/build/bulutSiteHaritasi";
import type { Proje } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";

/**
 * Yayındaki Vayra Build projesi: /b/<adres>/… (üretimde <adres>.vayra.app ve bağlı özel alan adları aynı içeriği sunar).
 * Yalnız yayınlanan sürümün dosyaları sunulur; taslak değişiklikler "Değişiklikleri yayınla" denene kadar görünmez.
 * Her istekte sırayla: bakım modu, güvenlik duvarı (kurallar, saldırı modu sınavı), şifre, dosya ya da fonksiyon.
 *
 * Özel alan adı ve alt alan: ara katman (src/middleware.ts) ana uygulama alanı olmayan bir Host gelince isteği
 * /b/__alan/<asıl yol> adresine yeniden yazar ve asıl Host'u x-vayra-host başlığıyla taşır. Burada Host çözülür:
 * <alt>.<NEXT_PUBLIC_BUILD_ALAN> ise alt alan, değilse bağlı alan adı (www. önekiyle de denenir). Bu adreslerde site
 * kökten sunulur (kok ""): /menu.html gibi kökten başlayan yollar /b/ öneki olmadan çalışır; köprünün çağırdığı
 * /api/build/... adresleri aynı sunucuya gider (ara katman bunları yeniden yazmaz, CORS açık).
 */
type Ctx = { params: Promise<{ ad: string; yol?: string[] }> };
type Cozum = { p: Proje; kok: string; koken: string };

/** Dışarıdan görünen köken (vekil arkasında x-forwarded-*, yoksa Host başlığı). */
function kokenBul(req: Request, host?: string) {
  const h = req.headers, u = new URL(req.url);
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? u.protocol.replace(":", "");
  return `${proto}://${host ?? h.get("x-forwarded-host")?.split(",")[0] ?? h.get("host") ?? u.host}`;
}

const sadeSayfa = (baslik: string, metin: string, durum = 404) => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${baslik}</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0b0d;color:#e9eef5;font:16px system-ui"><div style="text-align:center;padding:24px;max-width:520px"><p style="font-size:22px;font-weight:600;margin:0">${baslik}</p><p style="color:#9aa3ad;line-height:1.5">${metin}</p></div>`, { status: durum, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...CORS } });

/** Alan adının sitesi açılabilir mi: DNS doğrulandıysa (bağlı ya da SSL bekleniyor). */
const acilir = (d: string) => d === "bagli" || d === "ssl";

/**
 * İsteğin projesini bulur. /b/<altAlan> yolu ya da (ad "__alan") ara katmanın taşıdığı Host. Response dönerse o
 * yanıt (bulunamadı, doğrulanmamış alan adı, www yönlendirmesi) olduğu gibi verilir.
 */
async function coz(req: Request, ad: string, yol: string[] | undefined): Promise<Cozum | Response> {
  if (ad !== "__alan") {
    const p = await altAlandanProje(ad);
    return p ? { p, kok: `/b/${ad}`, koken: kokenBul(req) } : sadeSayfa("Bu adreste yayında bir proje yok", `Adres yanlış olabilir ya da proje yayından kaldırılmış. <a href="/panel/build" style="color:#55d6fd">Vayra Build ile kendi siteni yap</a>`);
  }
  const host = (req.headers.get("x-vayra-host") ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (!/^[a-z0-9.-]{3,253}$/.test(host)) return sadeSayfa("Bu alan adı bir Vayra sitesine bağlı değil", "İstek bir alan adı taşımıyor.", 400);
  // Köprünün API adresleri ara katmandan geçmemeli; geçtiyse açıkça söyle (sessiz 404 yerine).
  if (yol?.[0] === "api" && yol[1] === "build") return Response.json({ hata: "Vayra API adresleri yeniden yazılmamalı (ara katman /api/build yollarını olduğu gibi geçirmeli)." }, { status: 404, headers: CORS });
  const koken = kokenBul(req, host);
  const platform = process.env.NEXT_PUBLIC_BUILD_ALAN?.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  if (platform && host.endsWith(`.${platform}`)) {
    const alt = host.slice(0, -(platform.length + 1));
    const p = !alt.includes(".") ? await altAlandanProje(alt) : null;
    return p ? { p, kok: "", koken } : sadeSayfa("Bu adreste yayında bir proje yok", `${host} adresinde bir Vayra sitesi bulunamadı.`);
  }
  let alan = host, id = await alanAdindanKimlik(host);
  if (!id && host.startsWith("www.")) { alan = host.slice(4); id = await alanAdindanKimlik(alan); }
  const p = id ? await projeOkuHam(id) : null;
  const kayit = p?.alanAdlari.find((a) => a.ad === alan);
  if (!p || !kayit) return sadeSayfa("Bu alan adı bir Vayra sitesine bağlı değil", `${host} hiçbir Vayra Build projesine eklenmemiş. Alan adının sahibiysen projede Bulut, Alan adları bölümünden ekle.`);
  if (!acilir(kayit.durum)) return sadeSayfa("Alan adı doğrulanmayı bekliyor", `${alan} bir Vayra sitesine eklendi ama DNS kayıtları henüz doğrulanmadı. Kayıtlar yayıldıktan sonra site bu adreste açılır.`, 421);
  // www → kök yönlendirmesi (yalnız sayfa istekleri; fonksiyon çağrılarında gövde kaybolmasın diye 308).
  if (alan !== host && kayit.wwwYonlendir) {
    const u = new URL(req.url);
    return new Response(null, { status: 308, headers: { Location: `${koken.replace(`//${host}`, `//${alan}`)}/${(yol ?? []).map(encodeURIComponent).join("/")}${u.search}`, "Cache-Control": "no-store" } });
  }
  return { p, kok: "", koken };
}

/** İsteğin günlükte ortak alanları (IP yalnız tuzlu özet olarak). */
async function istekBilgisi(req: Request, projeId: string) {
  const a = await bulutAyarOku(projeId);
  const u = new URL(req.url);
  const ip = ipOzeti(a.tuz, istemciIp(req));
  const ua = req.headers.get("user-agent");
  return {
    ayar: a, ip,
    alan: { yt: req.method, c: cihaz(ua), ua: tarayiciAdi(ua), ip, ...(ulkeBul(req) ? { u: ulkeBul(req) } : {}), ...(u.search.length > 1 ? { q: u.search.slice(1, 201) } : {}) },
  };
}

/** api/<ad> istekleri projedeki api/<ad>.js sunucu fonksiyonunu çalıştırır (yayındaki sürüm). */
async function istekIsle(req: Request, { params }: Ctx) {
  const { ad, yol } = await params;
  zamanliBaslat();
  const c = await coz(req, ad, yol);
  // Fonksiyon çağrısında sayfa yerine JSON hata (yönlendirme olduğu gibi).
  if (c instanceof Response) return c.status === 308 || (c.headers.get("content-type") ?? "").includes("json") ? c : Response.json({ hata: c.status === 421 ? "Bu alan adı henüz doğrulanmadı." : "Bu adreste yayında bir proje yok." }, { status: c.status, headers: CORS });
  const { p } = c;
  const s = p.yayin ? p.surumler.find((x) => x.id === p.yayin!.surumId) : null;
  if (!s) return Response.json({ hata: "Bu adreste yayında bir proje yok." }, { status: 404, headers: CORS });
  if (yol?.[0] !== "api" || yol.length !== 2 || !/^[A-Za-z0-9_-]{1,60}$/.test(yol[1])) return new Response("Bu yöntem desteklenmiyor.", { status: 405, headers: CORS });
  const { ayar, ip, alan } = await istekBilgisi(req, p.id);
  const y = "/api/" + yol[1];
  if (ayar.bakim.acik) return Response.json({ hata: "Site bakımda." }, { status: 503, headers: { ...CORS, "Retry-After": "600" } });
  const duvar = duvarDenetle(p.id, ayar, { yol: y, ip, ulke: alan.u, belge: false, cerez: req.headers.get("cookie") });
  if (duvar.karar === "engel") {
    gunlukYaz(p.id, { t: "fonksiyon", d: duvar.durum, y, ms: 0, m: duvar.neden, e: duvar.neden, ...alan });
    return Response.json({ hata: duvar.durum === 429 ? "Çok fazla istek; biraz sonra tekrar dene." : "Bu istek engellendi." }, { status: duvar.durum, headers: { ...CORS, ...(duvar.durum === 429 ? { "Retry-After": String(duvar.bekle ?? 60) } : {}) } });
  }
  const { yanit, sonuc } = await fonksiyonIstegi(req, p, s.dosyalar, yol[1]);
  if (sonuc) gunlukYaz(p.id, { t: "fonksiyon", d: sonuc.durum, y, ms: sonuc.sure, m: sonuc.hata ?? (sonuc.loglar.length ? req.method + " · " + sonuc.loglar.slice(-1)[0] : req.method), f: fonksiyonAyrintisi(sonuc), ...alan });
  return yanit;
}
export const POST = istekIsle, PUT = istekIsle, PATCH = istekIsle, DELETE = istekIsle;

export async function GET(req: Request, ctx: Ctx) {
  const { ad, yol } = await ctx.params;
  if (yol?.[0] === "api" && yol.length === 2 && !yol[1].includes(".")) return istekIsle(req, ctx);
  zamanliBaslat();
  const c = await coz(req, ad, yol);
  if (c instanceof Response) return c;
  const { p, kok, koken } = c;
  const s = p.yayin ? p.surumler.find((x) => x.id === p.yayin!.surumId) : null;
  if (!s) return sadeSayfa("Bu adreste yayında bir proje yok", `Adres yanlış olabilir ya da proje yayından kaldırılmış. <a href="/panel/build" style="color:#55d6fd">Vayra Build ile kendi siteni yap</a>`);
  // Koddaki "export const zamanlama" tanımları yayındaki sürüm başına bir kez eşitlenir.
  kodZamanlamalariniEsitle(p).catch(() => {});
  const bas = Date.now();
  const { ayar, ip, alan } = await istekBilgisi(req, p.id);
  const y = `/${(yol ?? []).join("/")}`;
  const ref = (() => { try { return new URL(req.headers.get("referer") ?? "").hostname || undefined; } catch { return undefined; } })();
  const yaz = (r: Response, ek: { b?: number; e?: string } = {}) => gunlukYaz(p.id, { t: "istek", d: r.status, y, ms: Date.now() - bas, k: ref, ...alan, ...ek });
  if (ayar.bakim.acik) { const r = bakimSayfasi(p.ad, ayar.bakim.mesaj); gunlukYaz(p.id, { t: "istek", d: 503, y, ms: Date.now() - bas, k: ref, m: "Bakım modu", ...alan }); return r; }
  const belge = (req.headers.get("sec-fetch-dest") ?? "") === "document" || ((req.headers.get("accept") ?? "").includes("text/html") && !/\.[a-z0-9]{2,5}$/i.test(y));
  const duvar = duvarDenetle(p.id, ayar, { yol: y, ip, ulke: alan.u, belge, cerez: req.headers.get("cookie") });
  if (duvar.karar === "engel") {
    const r = new Response(duvar.durum === 429 ? "Çok fazla istek. Biraz sonra tekrar dene." : "Bu istek sitenin güvenlik kurallarınca engellendi.", { status: duvar.durum, headers: { "Content-Type": "text/plain; charset=utf-8", ...(duvar.durum === 429 ? { "Retry-After": String(duvar.bekle ?? 60) } : {}) } });
    yaz(r, { e: duvar.neden });
    return r;
  }
  if (duvar.karar === "sinav") { const r = sinavSayfasi(p.id, ayar, ip, p.ad); yaz(r, { e: "Saldırı modu sınavı" }); return r; }
  // Dinamik site haritası (blog yazıları ve ürün sayfalarıyla); projenin kendi sitemap.xml'i varsa o sunulur.
  if (y === "/sitemap.xml" && !s.dosyalar["sitemap.xml"] && !sifreKontrol(req, p)) {
    const xml = await siteHaritasi(p, s.dosyalar, koken + kok).catch(() => null);
    if (xml) { const r = new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600", ...CORS } }); yaz(r, { b: xml.length }); return r; }
  }
  const kilit = sifreKontrol(req, p);
  const yanit = kilit ?? await dosyaSun(p, s.dosyalar, yol, { onizleme: false, kok, koken });
  // Bant genişliği için gövde bir kez okunur (dosyalar en çok 400 KB).
  const govde = await yanit.arrayBuffer();
  const son = new Response(govde, { status: yanit.status, headers: yanit.headers });
  yaz(son, { b: govde.byteLength });
  if (yanit.status === 404) bulunamadiSay(p.id, y);
  return son;
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
