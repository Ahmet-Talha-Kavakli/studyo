import { projeOku, projeOkuHam, projeSahibiMi, projeYaz } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { sahipAl } from "@/lib/build/sunucu";
import { oturumdanUye } from "@/lib/build/uye";
import { istekOrtami, koleksiyonAdiGecerli, ortamAyariOku, veriOku, type VeriOrtami } from "@/lib/build/veri";
import {
  ANAHTARLAR, OdemeHata, anahtarlarHazir, SAGLAYICILAR, SAGLAYICI_AD, SIPARIS_TABLOSU, TEST_AYRI, aliciTemizle, anahtarDurumu, iadeEt, iyzicoSonuc, kontrolListesi, kurus, odemeAyarDegistir, odemeAyarOku,
  paytrBildirimDogrula, paytrSonuc, saglayiciBaslat, sepetHesapla, siparisBul, siparisGenel, siparisNoGecerli, siparisNoUret, siparisOlustur, siparisRaporu, siparisSorgula, sonucIsle,
  stripeImzaDogrula, stripeOturumGetir, stripeOturumSonuc, testAdi, urunTablosuKur, yerelAdresGecerli, type OdemeAyar, type OdemeMod, type Saglayici, type Siparis,
  paraDestekli, paypalImzaDogrula, paypalSonuc, paypalYakalamaSonuc,
} from "@/lib/build/odeme";
import { isletmeOku } from "@/lib/build/isletme";
import { paraAdi, paraOndalik, paraYaz } from "@/lib/build/bolge";
import type { Proje } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; yol?: string[] }> };

/**
 * Vayra Ödeme API (tek fonksiyon):
 *  POST /api/build/odeme/<proje>/baslat                 site: sipariş oluşturur, ödeme sayfası adresini döndürür (herkese açık)
 *  GET  /api/build/odeme/<proje>/durum/<siparisNo>       site: siparişin genel durumu (kişisel veri yok)
 *  GET  /api/build/odeme/<proje>/sayfa/<siparisNo>       PayTR iFrame'ini taşıyan güvenli ödeme sayfası
 *  GET|POST /api/build/odeme/<proje>/donus/<sağlayıcı>   alıcının tarayıcısı dönerken (iyzico token POST eder)
 *  POST /api/build/odeme/<proje>/bildirim/<sağlayıcı>    PayTR bildirimi, Stripe ve PayPal webhook (imza doğrulanır)
 *  GET  /api/build/odeme/<proje>                         sahip: ayarlar, anahtar durumu, adresler, canlıya geçiş listesi
 *  GET  /api/build/odeme/<proje>/siparisler?ortam=&gun=  sahip: siparişler, gelir özeti ve günlük gelir
 *  POST /api/build/odeme/<proje>                         sahip: { islem: ayar | anahtar | canliyaGec | teste | urunTablosu | iade | sorgula | gelistirici }
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-onizleme, x-vayra-oturum" };
const yanit = (v: unknown, durum = 200, cors = true) => new Response(JSON.stringify(v), { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(cors ? CORS : {}) } });
const red = (hata: string, durum = 400, cors = true) => yanit({ ok: false, hata }, durum, cors);
const yonlendir = (adres: string) => new Response(null, { status: 303, headers: { Location: adres, "Cache-Control": "no-store" } });

/** Dışarıdan görünen köken (vekil arkasında x-forwarded-*, yoksa Host başlığı). */
function kokenBul(req: Request) {
  const h = req.headers, u = new URL(req.url);
  return `${h.get("x-forwarded-proto")?.split(",")[0] ?? u.protocol.replace(":", "")}://${h.get("x-forwarded-host")?.split(",")[0] ?? h.get("host") ?? u.host}`;
}
function ipBul(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  return !ip || ip === "::1" || ip.startsWith("::ffff:127.") ? "127.0.0.1" : ip.replace(/^::ffff:/, "").slice(0, 39);
}
const sayac = new Map<string, number[]>();
function sinirli(anahtar: string, n: number) {
  const s = Date.now(), l = (sayac.get(anahtar) ?? []).filter((t) => s - t < 60_000);
  l.push(s); sayac.set(anahtar, l);
  return l.length > n;
}
/** Site içi göreli sayfa yolu ("tesekkurler.html", "siparis/basarili.html?x=1"); dış adres ya da ".." kabul edilmez. */
function sayfaYolu(x: unknown): string | null {
  const y = String(x ?? "").trim().replace(/^\.?\/+/, "");
  if (!y || y.length > 160 || y.includes("..") || y.includes("//") || y.includes(":") || y.includes("\\")) return null;
  return /^[A-Za-z0-9._\-/]+(\?[A-Za-z0-9._\-=&%]*)?(#[A-Za-z0-9_-]*)?$/.test(y) ? y : null;
}
const ekle = (adres: string, q: Record<string, string>) => {
  const [on, parca] = adres.split("#");
  return `${on}${on.includes("?") ? "&" : "?"}${new URLSearchParams(q)}${parca ? `#${parca}` : ""}`;
};

/* ───────────── Herkese açık uçlar ───────────── */
async function baslat(req: Request, id: string) {
  if (id.startsWith("sablon-")) return red("Şablon önizlemesinde ödeme alınmaz.", 403);
  const p = await projeOkuHam(id);
  if (!p) return red("Proje yok.", 404);
  const ip = ipBul(req);
  if (sinirli(`b:${id}:${ip}`, 10)) return red("Çok fazla deneme; biraz bekle.", 429);
  let g: { urunler?: unknown; alici?: unknown; basariSayfasi?: unknown; hataSayfasi?: unknown; kok?: unknown; sayfa?: unknown; saglayici?: unknown } = {};
  try { g = await req.json(); } catch { return red("Geçersiz gövde."); }
  const ayar = await odemeAyarOku(id);
  if (!ayar.saglayici) return red("Bu sitede ödeme henüz kurulmadı.", 409);
  const belirtec = req.headers.get("x-vayra-onizleme");
  const onizleme = !!belirtec && belirtec === p.onizlemeBelirteci;
  if (!onizleme && !p.yayin) return red("Site yayında değil.", 409);
  // Önizlemeden başlayan ödeme her zaman testtir; yayındaki site ayardaki modu kullanır.
  const mod: OdemeMod = onizleme ? "test" : ayar.mod;
  const urunOrtami = await istekOrtami(id, onizleme);
  const koken = kokenBul(req);
  // Dönüş kökü: yayında /b/<adres> ya da (alt alan adı, özel alan adı) kök; önizlemede önizleme yolu.
  const kokGirdi = typeof g.kok === "string" ? g.kok : "";
  let kok = `/b/${p.ayarlar.altAlan}`;
  if (onizleme) {
    const m = /^\/api\/build\/onizleme\/([^/]+)\/([^/]+)$/.exec(kokGirdi);
    kok = m && m[1] === id && decodeURIComponent(m[2]).split("~")[0] === p.onizlemeBelirteci ? kokGirdi : `/api/build/onizleme/${id}/${p.onizlemeBelirteci}`;
  } else if (g.kok === "") kok = ""; // alt alan adı ya da özel alan adında site kökte
  const basari = sayfaYolu(g.basariSayfasi) ?? (ayar.basariSayfasi || "index.html");
  const hata = sayfaYolu(g.hataSayfasi) ?? (ayar.hataSayfasi || basari);
  try {
    const sepet = await sepetHesapla(id, urunOrtami, ayar.urunTablosu || "urunler", g.urunler);
    const isl = await isletmeOku(id);
    const paraBirimi = isl.magaza.paraBirimi || "TRY";
    // Alıcı ek sağlayıcılardan birini seçebilir (örneğin PayPal); yoksa birincil sağlayıcı.
    const sag = typeof g.saglayici === "string" && (ayar.ekSaglayicilar ?? []).includes(g.saglayici as Saglayici) ? (g.saglayici as Saglayici) : ayar.saglayici;
    if (!paraDestekli(sag, paraBirimi)) return red(`${SAGLAYICI_AD[sag]} ${paraAdi(paraBirimi)} (${paraBirimi}) ile ödeme almıyor. Site sahibi başka bir sağlayıcı seçmeli.`, 409);
    if (paraOndalik(paraBirimi) === 0 && sepet.kalemler.some((x) => x.fiyat % 1)) return red(`${paraBirimi} fiyatları tam sayı olmalı.`, 409);
    const alici = aliciTemizle(g.alici, sag, isl.profil.ulkeKodu);
    const uye = await oturumdanUye(id, req.headers.get("x-vayra-oturum")).catch(() => null);
    // Anahtar eksikse sipariş açılmadan hata döner.
    anahtarlarHazir(p, sag, mod);
    const s = await siparisOlustur(id, {
      siparisNo: siparisNoUret(), durum: "bekliyor", tutar: sepet.toplam / 100, paraBirimi, saglayici: sag, mod, kalemler: sepet.kalemler, alici, eposta: alici.eposta,
      olaylar: [{ z: Date.now(), olay: "Sipariş oluşturuldu", ayrinti: onizleme ? "Önizlemeden, test" : mod === "test" ? "Yayındaki site, test modu" : undefined }],
      ic: { donus: { basari: `${koken}${kok}/${basari}`, hata: `${koken}${kok}/${hata}` }, urunOrtami, kaynak: typeof g.sayfa === "string" ? g.sayfa.slice(0, 160) : undefined, ip },
      ...(uye ? { uyeId: uye.id } : {}),
    });
    const ortam: VeriOrtami = mod === "test" ? "test" : "canli";
    try {
      const r = await saglayiciBaslat({ p, ayar, mod, koken, ip, s });
      await sonucIsle(id, ortam, s.siparisNo, { durum: "bekliyor", olay: `${SAGLAYICI_AD[s.saglayici]} ödeme sayfası açıldı`, ic: r.ic });
      return yanit({ ok: true, siparisNo: s.siparisNo, adres: r.adres, ...(r.iframe ? { iframe: r.iframe } : {}), tutar: s.tutar, test: mod === "test" });
    } catch (e) {
      const m = (e as Error).message;
      await sonucIsle(id, ortam, s.siparisNo, { durum: "basarisiz", olay: "Ödeme başlatılamadı", ayrinti: m, alanlar: { hata: m } }).catch(() => {});
      return red(m, e instanceof OdemeHata ? e.durum : 502);
    }
  } catch (e) {
    return red((e as Error).message, e instanceof OdemeHata ? e.durum : 400);
  }
}

async function durum(id: string, no: string, req: Request) {
  if (!siparisNoGecerli(no)) return red("Sipariş numarası geçersiz.", 400);
  if (sinirli(`d:${ipBul(req)}`, 60)) return red("Çok fazla istek.", 429);
  const b = await siparisBul(id, no);
  return b ? yanit({ ok: true, siparis: siparisGenel(b.s) }) : red("Sipariş bulunamadı.", 404);
}

/** PayTR iFrame'ini taşıyan sayfa (PayTR ödeme formunu kendi sayfasında iframe olarak göstermeyi ister). */
async function paytrSayfasi(id: string, no: string) {
  const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
  if (!b || b.s.saglayici !== "paytr" || !b.s.ic.iframe) return new Response("Ödeme bulunamadı.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (b.s.durum === "odendi") return yonlendir(ekle(b.s.ic.donus.basari, { siparis: no }));
  const k = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const tutar = paraYaz(b.s.tutar, b.s.paraBirimi || "TRY");
  const yerel = !b.s.ic.iframe.startsWith("https://www.paytr.com/");
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Güvenli ödeme</title>
<style>body{margin:0;background:#f4f5f7;color:#16181d;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}.ust{max-width:720px;margin:0 auto;padding:18px 16px 8px;display:flex;align-items:center;gap:10px}.ust b{font-size:16px}.ust span{color:#5b6270;font-size:13.5px}.etiket{margin-left:auto;padding:3px 10px;border-radius:999px;background:#fff4d6;color:#7a5200;font-size:12px;font-weight:600}.kutu{max-width:720px;margin:0 auto 24px;padding:0 8px}iframe{width:100%;min-height:620px;border:0;border-radius:14px;background:#fff}a{color:#0a6c8f}</style></head>
<body><div class="ust"><div><b>Sipariş ${k(no)}</b><br><span>${k(tutar)} · PayTR güvenli ödeme</span></div>${b.s.mod === "test" ? '<span class="etiket">Test modu</span>' : ""}</div>
<div class="kutu"><iframe src="${k(b.s.ic.iframe)}" id="paytriframe" frameborder="0" scrolling="no" title="PayTR ödeme formu"></iframe></div>
${yerel ? "" : '<script src="https://www.paytr.com/js/iframeResizer.min.js"></script><script>iFrameResize({},"#paytriframe");</script>'}</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

/** Tarayıcıyı siteye döndürür; iframe içindeyse üst pencereyi taşır (PayTR iFrame). */
function ustPencereyeDon(adres: string) {
  const k = adres.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Yönlendiriliyor</title><body style="font:15px system-ui;padding:32px;color:#16181d"><p>Siteye dönülüyor. Olmazsa <a href="${k}" target="_top">buraya dokun</a>.</p><script>try{window.top.location.href=${JSON.stringify(adres).replace(/</g, "\\u003c")}}catch(e){location.href=${JSON.stringify(adres).replace(/</g, "\\u003c")}}</script>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function donus(req: Request, id: string, sag: string) {
  const u = new URL(req.url);
  const no = u.searchParams.get("s") ?? "";
  const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
  const p = await projeOkuHam(id);
  if (!b || !p || b.s.saglayici !== sag) return new Response("Sipariş bulunamadı.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const s = b.s;
  const ayar = await odemeAyarOku(id);
  const git = (x: Siparis, sebep?: string) => (x.durum === "odendi" || x.durum === "bekliyor" ? ekle(x.ic.donus.basari, { siparis: no, ...(x.durum === "bekliyor" ? { durum: "bekliyor" } : {}) }) : ekle(x.ic.donus.hata, { siparis: no, hata: sebep ?? x.hata ?? "Ödeme tamamlanmadı" }));
  try {
    if (sag === "iyzico") {
      let token = "";
      if (req.method === "POST") { const f = new URLSearchParams(await req.text()); token = f.get("token") ?? ""; }
      const r = await sonucIsle(id, b.ortam, no, await iyzicoSonuc(p, ayar, s, token));
      return yonlendir(git(r.s));
    }
    if (sag === "paytr") {
      // Asıl sonuç Bildirim URL'ye gelir; burada yalnız alıcı siteye döner (başarı sayfası durumu vayra.odeme.durum ile okur).
      const basarili = u.searchParams.get("sonuc") === "basarili";
      const guncel = (await siparisBul(id, no))?.s ?? s;
      return ustPencereyeDon(basarili ? (guncel.durum === "basarisiz" ? git(guncel) : ekle(guncel.ic.donus.basari, { siparis: no, ...(guncel.durum === "odendi" ? {} : { durum: "bekliyor" }) })) : ekle(guncel.ic.donus.hata, { siparis: no, hata: guncel.hata ?? "Ödeme tamamlanmadı" }));
    }
    if (sag === "stripe") {
      if (u.searchParams.get("iptal") === "1") {
        const r = await sonucIsle(id, b.ortam, no, { durum: "basarisiz", olay: "Alıcı Stripe ödeme sayfasından vazgeçti", alanlar: { hata: "Ödemeden vazgeçildi" } });
        return yonlendir(git(r.s, "Ödemeden vazgeçildi"));
      }
      const oturum = u.searchParams.get("session_id") ?? s.ic.oturum ?? "";
      const r = await sonucIsle(id, b.ortam, no, stripeOturumSonuc(s, await stripeOturumGetir(p, ayar, s, oturum), "donus"));
      return yonlendir(git(r.s));
    }
    if (sag === "paypal") {
      // PayPal dönüşte ?token=<sipariş kimliği>&PayerID=.. ekler; kimlik siparişteki PayPal siparişiyle eşleşmeli.
      if (u.searchParams.get("iptal") === "1") {
        const r = await sonucIsle(id, b.ortam, no, { durum: "basarisiz", olay: "Alıcı PayPal ödeme sayfasından vazgeçti", alanlar: { hata: "Ödemeden vazgeçildi" } });
        return yonlendir(git(r.s, "Ödemeden vazgeçildi"));
      }
      const token = u.searchParams.get("token") ?? "";
      if (token && s.ic.oturum && token !== s.ic.oturum) return yonlendir(ekle(s.ic.donus.hata, { siparis: no, hata: "PayPal dönüşü siparişle eşleşmedi" }));
      const r = await sonucIsle(id, b.ortam, no, await paypalSonuc(p, ayar, s));
      return yonlendir(git(r.s));
    }
  } catch (e) {
    return yonlendir(ekle(s.ic.donus.hata, { siparis: no, hata: (e as Error).message.slice(0, 120) }));
  }
  return new Response("Bilinmeyen sağlayıcı.", { status: 404 });
}

async function bildirim(req: Request, id: string, sag: string) {
  const p = await projeOkuHam(id);
  if (!p) return new Response("Proje yok.", { status: 404 });
  const govde = await req.text();
  if (sag === "paytr") {
    const f = Object.fromEntries(new URLSearchParams(govde)) as Record<string, string>;
    const no = f.merchant_oid ?? "";
    const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
    if (!b) {
      // Bilinmeyen sipariş: imza doğruysa OK (PayTR tekrar göndermesin), değilse reddet.
      if (paytrBildirimDogrula(p, "canli", f) || paytrBildirimDogrula(p, "test", f)) { gunlukYaz(id, { t: "veri", d: 404, y: "/odeme/bildirim/paytr", m: `PayTR bildirimi bilinmeyen sipariş: ${no.slice(0, 40)}` }); return new Response("OK", { headers: { "Content-Type": "text/plain" } }); }
      return new Response("PAYTR notification failed: bad hash", { status: 400, headers: { "Content-Type": "text/plain" } });
    }
    if (!paytrBildirimDogrula(p, b.s.mod, f)) {
      gunlukYaz(id, { t: "veri", d: 401, y: "/odeme/bildirim/paytr", m: `PayTR bildiriminin imzası doğrulanamadı: ${no}` });
      return new Response("PAYTR notification failed: bad hash", { status: 400, headers: { "Content-Type": "text/plain" } });
    }
    await odemeAyarDegistir(id, (a) => { a.sonBildirim = { ...a.sonBildirim, [`paytr-${b.s.mod}`]: Date.now() }; });
    await sonucIsle(id, b.ortam, no, paytrSonuc(b.s, f));
    return new Response("OK", { headers: { "Content-Type": "text/plain" } });
  }
  if (sag === "stripe") {
    const mod = stripeImzaDogrula(p, req.headers.get("stripe-signature"), govde);
    if (!mod) { gunlukYaz(id, { t: "veri", d: 400, y: "/odeme/bildirim/stripe", m: "Stripe webhook imzası doğrulanamadı" }); return red("İmza doğrulanamadı.", 400, false); }
    let e: { type?: string; livemode?: boolean; data?: { object?: Record<string, unknown> } };
    try { e = JSON.parse(govde); } catch { return red("Geçersiz gövde.", 400, false); }
    const o = e.data?.object ?? {};
    const olayMod: OdemeMod = e.livemode ? "canli" : "test";
    await odemeAyarDegistir(id, (a) => { a.sonBildirim = { ...a.sonBildirim, [`stripe-${olayMod}`]: Date.now() }; });
    const tur = e.type ?? "";
    if (tur.startsWith("checkout.session.")) {
      const no = String(o.client_reference_id ?? (o.metadata as Record<string, string> | undefined)?.siparisNo ?? "");
      const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
      if (b && b.s.mod === olayMod) await sonucIsle(id, b.ortam, no, stripeOturumSonuc(b.s, o, tur));
    } else if (tur === "charge.refunded" && typeof o.payment_intent === "string") {
      const b = await siparisBul(id, (x) => x.odemeKimligi === o.payment_intent);
      if (b && b.s.mod === olayMod && o.refunded === true) await sonucIsle(id, b.ortam, b.s.siparisNo, { durum: "iade", olay: "Stripe panelinden iade edildi", alanlar: { iadeTutari: Number(o.amount_refunded) ? Number(o.amount_refunded) / 10 ** paraOndalik(b.s.paraBirimi || "TRY") : b.s.tutar, iadeZamani: new Date().toISOString() } });
    }
    return yanit({ received: true }, 200, false);
  }
  if (sag === "paypal") {
    let e: { event_type?: string; resource?: Record<string, unknown> };
    try { e = JSON.parse(govde); } catch { return red("Geçersiz gövde.", 400, false); }
    const ayar = await odemeAyarOku(id);
    const mod = await paypalImzaDogrula(p, ayar, req.headers, e);
    if (!mod) { gunlukYaz(id, { t: "veri", d: 400, y: "/odeme/bildirim/paypal", m: "PayPal webhook imzası doğrulanamadı (Webhook ID girildi mi?)" }); return red("İmza doğrulanamadı.", 400, false); }
    await odemeAyarDegistir(id, (a) => { a.sonBildirim = { ...a.sonBildirim, [`paypal-${mod}`]: Date.now() }; });
    const tur = e.event_type ?? "", o = e.resource ?? {};
    const birim = (Array.isArray(o.purchase_units) ? o.purchase_units[0] : {}) as { custom_id?: string; reference_id?: string };
    const no = String(o.custom_id ?? birim.custom_id ?? birim.reference_id ?? "");
    const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
    if (b && b.s.mod === mod && b.s.saglayici === "paypal") {
      if (tur === "CHECKOUT.ORDER.APPROVED") await sonucIsle(id, b.ortam, no, await paypalSonuc(p, ayar, b.s));
      else if (tur === "PAYMENT.CAPTURE.COMPLETED" || tur === "PAYMENT.CAPTURE.DENIED" || tur === "PAYMENT.CAPTURE.DECLINED") await sonucIsle(id, b.ortam, no, paypalYakalamaSonuc(b.s, o as never, "PayPal tahsilatı onaylandı (webhook)"));
      else if (tur === "PAYMENT.CAPTURE.REFUNDED") await sonucIsle(id, b.ortam, no, { durum: "iade", olay: "PayPal panelinden iade edildi", alanlar: { iadeTutari: Number((o.amount as { value?: string } | undefined)?.value) || b.s.tutar, iadeZamani: new Date().toISOString() } });
    }
    return yanit({ ok: true }, 200, false);
  }
  return new Response("Bilinmeyen sağlayıcı.", { status: 404 });
}

/* ───────────── Sahip uçları ───────────── */
async function sahipProjesi(req: Request, id: string) {
  const sahip = sahipAl(req);
  if (!sahip || !(await projeSahibiMi(id, sahip))) return null;
  const p = await projeOku(id, sahip);
  return p ? { p, sahip } : null;
}
function adresler(koken: string, id: string) {
  const k = `${koken}/api/build/odeme/${id}`;
  return { iyzicoDonus: `${k}/donus/iyzico`, paytrBildirim: `${k}/bildirim/paytr`, stripeWebhook: `${k}/bildirim/stripe`, paypalWebhook: `${k}/bildirim/paypal` };
}
async function sahipOzet(req: Request, p: Proje) {
  const ayar = await odemeAyarOku(p.id);
  const koken = kokenBul(req);
  const tablo = ayar.urunTablosu || "urunler";
  const [canli, test, ortamAyari] = await Promise.all([veriOku(p.id, "canli"), veriOku(p.id, "test"), ortamAyariOku(p.id)]);
  const urun = (v: typeof canli) => { const k = v.koleksiyonlar[tablo]; return k ? { var: true, adet: k.kayitlar.length, fiyatli: k.kayitlar.filter((r) => Number(String(r.fiyat ?? "").replace(",", ".")) > 0).length } : { var: false, adet: 0, fiyatli: 0 }; };
  const { gelistirici, ...acik } = ayar;
  const dosyalar = p.dosyalar;
  return {
    ok: true, ayar: { ...acik, gelistirici: !!gelistirici && Object.values(gelistirici).some(Boolean) && process.env.NODE_ENV !== "production" },
    anahtarlar: Object.fromEntries(SAGLAYICILAR.map((s) => [s, anahtarDurumu(p, s)])), testAyri: TEST_AYRI, paraBirimi: (await isletmeOku(p.id)).magaza.paraBirimi,
    adresler: adresler(koken, p.id), kontrol: await kontrolListesi(p, ayar, koken),
    sayfalar: Object.keys(dosyalar).filter((y) => y.endsWith(".html")).sort(),
    urunler: { canli: urun(canli), test: urun(test) }, ortamAyari,
    siparisSayisi: { canli: canli.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.length ?? 0, test: test.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.length ?? 0 },
  };
}

const ANAHTAR_ADLARI = new Set(SAGLAYICILAR.flatMap((s) => ANAHTARLAR[s].flatMap((a) => [a.ad, testAdi(a.ad)])));

async function sahipIslem(req: Request, p: Proje, sahip: string) {
  let g: Record<string, unknown> = {};
  try { g = await req.json(); } catch { return red("Geçersiz gövde.", 400, false); }
  const id = p.id;
  try {
    switch (g.islem) {
      case "ayar": {
        if (g.saglayici !== undefined && g.saglayici !== null && !SAGLAYICILAR.includes(g.saglayici as Saglayici)) return red("Sağlayıcı geçersiz.", 400, false);
        for (const a of ["basariSayfasi", "hataSayfasi"] as const) if (typeof g[a] === "string" && g[a] !== "" && !sayfaYolu(g[a])) return red("Sayfa yolu geçersiz; site içindeki bir sayfa seç.", 400, false);
        if (typeof g.urunTablosu === "string" && !koleksiyonAdiGecerli(g.urunTablosu)) return red("Tablo adı geçersiz.", 400, false);
        const a = await odemeAyarDegistir(id, (x) => {
          if (g.saglayici !== undefined) {
            if (x.saglayici !== g.saglayici && x.mod === "canli") x.mod = "test"; // sağlayıcı değişince yeniden test edilsin
            x.saglayici = (g.saglayici as Saglayici | null) ?? null;
          }
          if (Array.isArray(g.ekSaglayicilar)) x.ekSaglayicilar = [...new Set(g.ekSaglayicilar.filter((y): y is Saglayici => SAGLAYICILAR.includes(y as Saglayici) && y !== x.saglayici))];
          else if (x.ekSaglayicilar?.includes(x.saglayici as Saglayici)) x.ekSaglayicilar = x.ekSaglayicilar.filter((y) => y !== x.saglayici);
          if (typeof g.basariSayfasi === "string") x.basariSayfasi = g.basariSayfasi ? sayfaYolu(g.basariSayfasi)! : "";
          if (typeof g.hataSayfasi === "string") x.hataSayfasi = g.hataSayfasi ? sayfaYolu(g.hataSayfasi)! : "";
          if (g.taksit !== undefined) x.taksit = Math.min(12, Math.max(1, Math.round(Number(g.taksit)) || 1));
          if (typeof g.urunTablosu === "string") x.urunTablosu = g.urunTablosu;
        });
        gunlukYaz(id, { t: "bulut", m: "Ödeme ayarları güncellendi" });
        return yanit({ ok: true, ayar: a }, 200, false);
      }
      case "anahtar": {
        const l = (g.anahtarlar ?? {}) as Record<string, unknown>;
        const adlar = Object.keys(l).filter((a) => ANAHTAR_ADLARI.has(a));
        if (!adlar.length) return red("Kaydedilecek anahtar yok.", 400, false);
        let sirlar = [...p.ayarlar.sirlar];
        for (const ad of adlar) {
          const v = String(l[ad] ?? "").trim().slice(0, 2000);
          sirlar = sirlar.filter((s) => s.ad !== ad);
          if (v) sirlar.push({ ad, deger: v, gorunurluk: "sunucu" });
        }
        if (sirlar.length > 40) return red("En çok 40 ortam değişkeni ve sır tutulur.", 400, false);
        p.ayarlar.sirlar = sirlar;
        await projeYaz(p, sahip);
        gunlukYaz(id, { t: "bulut", m: `Ödeme anahtarları güncellendi: ${adlar.join(", ")}` });
        return yanit({ ok: true, anahtarlar: Object.fromEntries(SAGLAYICILAR.map((s) => [s, anahtarDurumu(p, s)])) }, 200, false);
      }
      case "canliyaGec": {
        const ayar = await odemeAyarOku(id);
        const eksik = (await kontrolListesi(p, ayar, kokenBul(req))).filter((m) => m.zorunlu && m.durum === "eksik");
        if (eksik.length) return yanit({ ok: false, hata: `Canlıya geçmeden önce: ${eksik.map((m) => m.ad.toLocaleLowerCase("tr")).join(", ")}.`, eksik }, 409, false);
        const a = await odemeAyarDegistir(id, (x) => { x.mod = "canli"; });
        gunlukYaz(id, { t: "bulut", m: `Ödemeler canlıya geçti (${SAGLAYICI_AD[a.saglayici!]})` });
        return yanit({ ok: true, ayar: a }, 200, false);
      }
      case "teste": {
        const a = await odemeAyarDegistir(id, (x) => { x.mod = "test"; });
        gunlukYaz(id, { t: "bulut", m: "Ödemeler test moduna alındı" });
        return yanit({ ok: true, ayar: a }, 200, false);
      }
      case "urunTablosu": {
        const ortam: VeriOrtami = g.ortam === "test" ? "test" : "canli";
        const ayar = await odemeAyarOku(id);
        const r = await urunTablosuKur(id, ortam, ayar.urunTablosu || "urunler");
        return yanit({ ok: true, sonuc: r }, 200, false);
      }
      case "iade": case "sorgula": {
        const no = String(g.siparisNo ?? "");
        const b = siparisNoGecerli(no) ? await siparisBul(id, no) : null;
        if (!b) return red("Sipariş bulunamadı.", 404, false);
        const ayar = await odemeAyarOku(id);
        const r = g.islem === "iade" ? await iadeEt(p, ayar, b.s, ipBul(req)) : await siparisSorgula(p, ayar, b.s);
        const x = await sonucIsle(id, b.ortam, no, r);
        return yanit({ ok: true, siparis: x.s, degisti: x.degisti }, 200, false);
      }
      case "gelistirici": {
        // Yalnız geliştirmede: sağlayıcıları yerel deneme sunucularına yönlendirir (arayüzde görünmez, üretimde yok sayılır).
        if (process.env.NODE_ENV === "production") return red("Bu ayar yalnız geliştirmede.", 403, false);
        const v = g.gelistirici as Record<string, string> | null;
        if (v && Object.values(v).some((x) => x && !yerelAdresGecerli(x))) return red("Yalnız http://localhost adresleri.", 400, false);
        const a = await odemeAyarDegistir(id, (x) => { if (!v) delete x.gelistirici; else x.gelistirici = Object.fromEntries(Object.entries(v).filter(([k, y]) => SAGLAYICILAR.includes(k as Saglayici) && y)) as OdemeAyar["gelistirici"]; });
        return yanit({ ok: true, gelistirici: a.gelistirici ?? null }, 200, false);
      }
    }
    return red("Bilinmeyen işlem.", 400, false);
  } catch (e) {
    return red((e as Error).message, e instanceof OdemeHata ? e.durum : 400, false);
  }
}

/* ───────────── Yönlendirici ───────────── */
export async function GET(req: Request, ctx: Ctx) {
  const { id, yol = [] } = await ctx.params;
  if (yol[0] === "durum" && yol[1]) return durum(id, decodeURIComponent(yol[1]), req);
  if (yol[0] === "sayfa" && yol[1]) return paytrSayfasi(id, decodeURIComponent(yol[1]));
  if (yol[0] === "donus" && yol[1]) return donus(req, id, yol[1]);
  const sp = await sahipProjesi(req, id);
  if (!sp) return red("Ödeme ayarlarını ve anahtarlarını yalnız proje sahibi görebilir.", 403, false);
  if (!yol.length) return yanit(await sahipOzet(req, sp.p), 200, false);
  if (yol[0] === "siparisler") {
    const q = new URL(req.url).searchParams;
    const gun = Math.min(365, Math.max(1, Number(q.get("gun")) || 30));
    return yanit({ ok: true, ortam: q.get("ortam") === "test" ? "test" : "canli", ...(await siparisRaporu(id, q.get("ortam") === "test" ? "test" : "canli", gun)) }, 200, false);
  }
  return red("Bulunamadı.", 404, false);
}

export async function POST(req: Request, ctx: Ctx) {
  const { id, yol = [] } = await ctx.params;
  if (yol[0] === "baslat") return baslat(req, id);
  if (yol[0] === "donus" && yol[1]) return donus(req, id, yol[1]);
  if (yol[0] === "bildirim" && yol[1]) return bildirim(req, id, yol[1]);
  if (yol.length) return red("Bulunamadı.", 404);
  const sp = await sahipProjesi(req, id);
  if (!sp) return red("Ödeme ayarlarını ve anahtarlarını yalnız proje sahibi görebilir.", 403, false);
  return sahipIslem(req, sp.p, sp.sahip);
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
