import { projeOkuHam } from "@/lib/build/depo";
import { belirtecCoz, cikBelirteciCoz, ekGuncelle, ekOku, hizAsildi, istekIp } from "@/lib/build/buyumeEkDepo";
import { akisGonderimBul, akisIzle } from "@/lib/build/buyumeAkis";
import { izinYaz } from "@/lib/build/buyumeEkTipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ tur: string; t: string }> };

/**
 * E-posta izleme ve abonelikten çıkma (herkese açık, imzalı belirteç):
 *  GET  a/<t>        açılma pikseli (1x1 GIF; Apple Mail gizlilik koruması açılmaları şişirebilir)
 *  GET  t/<t>?i=n    tık: kampanyanın n. bağlantısına yönlenir (yalnız kampanyada kayıtlı adresler; açık yönlendirme yok)
 *  GET  c/<t>        çıkma onay sayfası (tarayıcı ön yüklemesi yanlışlıkla çıkarmasın diye düğmeyle)
 *  POST c/<t>        çıkma (sayfadaki düğme ve RFC 8058 tek tık başlığı); çıkan kişiye bir daha pazarlama iletisi gitmez
 * Otomasyon akışı e-postalarının belirtecinde kampanya yerine "A<akış>" ve gönderim sırası bulunur.
 */
const akisMi = (k: string) => /^A[a-z0-9]{8,20}$/.test(k);
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const piksel = () => new Response(GIF, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" } });
const kacir = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const sayfa = (baslik: string, govde: string, durum = 200) => new Response(`<!doctype html><html lang="tr"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${kacir(baslik)}</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f4f5f7;color:#111827;font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"><main style="max-width:420px;margin:24px;padding:28px;background:#fff;border:1px solid #e5e7eb;border-radius:16px"><h1 style="margin:0 0 8px;font-size:20px">${kacir(baslik)}</h1>${govde}</main></body></html>`, { status: durum, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

async function coz(t: string) {
  const k = belirtecCoz(t);
  if (k && akisMi(k.k)) {
    const g = await akisGonderimBul(k.p, k.k.slice(1), k.i);
    if (!g) return null;
    const ek = await ekOku(k.p);
    return { p: k.p, eposta: g.e, kampanya: null, akis: { id: k.k.slice(1), n: k.i, ad: ek.akislar.find((a) => a.id === k.k.slice(1))?.ad ?? "Otomasyon" }, i: -1, cikti: !!ek.cikanlar[g.e] };
  }
  if (k) {
    const ek = await ekOku(k.p);
    const kp = ek.kampanyalar.find((x) => x.id === k.k);
    const a = kp?.alicilar[k.i];
    return a ? { p: k.p, eposta: a.e, kampanya: kp!, akis: null, i: k.i, cikti: !!ek.cikanlar[a.e] } : null;
  }
  const c = cikBelirteciCoz(t);
  if (c) { const ek = await ekOku(c.p); return { p: c.p, eposta: c.eposta, kampanya: null, akis: null, i: -1, cikti: !!ek.cikanlar[c.eposta] }; }
  return null;
}

export async function GET(req: Request, { params }: Ctx) {
  const { tur, t } = await params;
  const sinir = hizAsildi(`eiz:${istekIp(req)}`, 120);
  if (tur === "a") {
    const k = sinir ? null : belirtecCoz(t);
    if (k && akisMi(k.k)) akisIzle(k.p, k.k.slice(1), k.i, "a").catch(() => {});
    else if (k) ekGuncelle(k.p, (v) => { const a = v.kampanyalar.find((x) => x.id === k.k)?.alicilar[k.i]; if (a) { a.a ??= Date.now(); a.ac = (a.ac ?? 0) + 1; } }).catch(() => {});
    return piksel();
  }
  if (tur === "t") {
    const k = belirtecCoz(t);
    const i = Number(new URL(req.url).searchParams.get("i"));
    if (!k || !Number.isInteger(i)) return sayfa("Bağlantı geçersiz", "<p>Bu bağlantı bozulmuş ya da süresi geçmiş.</p>", 404);
    if (akisMi(k.k)) {
      const g = await akisGonderimBul(k.p, k.k.slice(1), k.i);
      const hedef = g?.baglantilar[i];
      if (!hedef || !/^(https?:|mailto:|tel:)/i.test(hedef)) return sayfa("Bağlantı geçersiz", "<p>Bu bağlantı bu e-postada yok.</p>", 404);
      if (!sinir) akisIzle(k.p, k.k.slice(1), k.i, "t", i).catch(() => {});
      return new Response(null, { status: 302, headers: { Location: hedef, "Cache-Control": "no-store" } });
    }
    const kp = (await ekOku(k.p)).kampanyalar.find((x) => x.id === k.k);
    const hedef = kp?.baglantilar[i];
    if (!hedef || !/^(https?:|mailto:|tel:)/i.test(hedef)) return sayfa("Bağlantı geçersiz", "<p>Bu bağlantı bu e-postada yok.</p>", 404);
    if (!sinir) ekGuncelle(k.p, (v) => { const a = v.kampanyalar.find((x) => x.id === k.k)?.alicilar[k.i]; if (a) { const z = Date.now(); a.t ??= z; a.a ??= z; a.tl = [...new Set([...(a.tl ?? []), i])]; } }).catch(() => {});
    return new Response(null, { status: 302, headers: { Location: hedef, "Cache-Control": "no-store" } });
  }
  if (tur === "c") {
    const k = await coz(t);
    if (!k) return sayfa("Bağlantı geçersiz", "<p>Bu abonelikten çıkma bağlantısı bozulmuş. E-postadaki bağlantıyı yeniden açmayı dene.</p>", 404);
    const site = (await projeOkuHam(k.p))?.ad ?? "Site";
    if (k.cikti) return sayfa("Abonelikten çıktın", `<p><b>${kacir(k.eposta)}</b> adresine ${kacir(site)} pazarlama e-postası göndermeyecek.</p>`);
    return sayfa("Abonelikten çık", `<p><b>${kacir(k.eposta)}</b> adresine ${kacir(site)} e-postalarının gelmesini durdurmak istiyor musun?</p><form method="post"><button type="submit" style="margin-top:12px;padding:11px 20px;border:0;border-radius:999px;background:#111;color:#fff;font:600 15px system-ui;cursor:pointer">Abonelikten çık</button></form>`);
  }
  return new Response("Bulunamadı", { status: 404 });
}

export async function POST(req: Request, { params }: Ctx) {
  const { tur, t } = await params;
  if (tur !== "c") return new Response("Bulunamadı", { status: 404 });
  if (hizAsildi(`ecik:${istekIp(req)}`, 30)) return new Response("Çok fazla istek.", { status: 429 });
  const k = await coz(t);
  if (!k) return sayfa("Bağlantı geçersiz", "<p>Bu abonelikten çıkma bağlantısı bozulmuş.</p>", 404);
  const tekTik = (req.headers.get("content-type") ?? "").includes("form") && (await req.text()).includes("List-Unsubscribe=One-Click");
  await ekGuncelle(k.p, (v) => {
    v.cikanlar[k.eposta] ??= { z: Date.now(), kaynak: tekTik ? "E-posta istemcisindeki tek tık çıkma" : k.kampanya ? `"${k.kampanya.ad}" e-postasındaki bağlantı` : k.akis ? `"${k.akis.ad}" otomasyon e-postasındaki bağlantı` : "E-postadaki bağlantı" };
    izinYaz((v.kisiMeta[k.eposta] ??= { etiketler: [] }), "ret", tekTik ? "Abonelikten çıktı (e-posta istemcisinde tek tık)" : "Abonelikten çıktı (e-postadaki bağlantı)", istekIp(req));
    if (k.kampanya) { const a = v.kampanyalar.find((x) => x.id === k.kampanya!.id)?.alicilar[k.i]; if (a) a.c ??= Date.now(); }
  });
  if (k.akis) await akisIzle(k.p, k.akis.id, k.akis.n, "c").catch(() => {});
  const site = (await projeOkuHam(k.p))?.ad ?? "Site";
  return sayfa("Abonelikten çıktın", `<p><b>${kacir(k.eposta)}</b> adresine ${kacir(site)} artık pazarlama e-postası göndermeyecek. Yanlışlıkla çıktıysan site sahibine yazabilirsin.</p>`);
}
