import { randomBytes } from "crypto";
import { projeOkuHam } from "@/lib/build/depo";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { gunlukYaz } from "@/lib/build/gunluk";
import { htmlKacir, ipBul, isletmeOku, kokenBul, listeDegistir, listeOku, sinirli } from "@/lib/build/isletme";
import { eklentiBetigi } from "@/lib/build/isletmeEklenti";
import { ceviriAnahtari, rssUret, yaziGenel, yayindakiler } from "@/lib/build/isletmeIcerik";
import { kuponDenetle, magazaGenel, magazaOdemeBaslat, mutabakat, sepetHesapla, siparisTakip, siteAdresi, urunGenelPara, urunler } from "@/lib/build/isletmeMagaza";
import { randevuZamanYaz } from "@/lib/build/isletmeRandevu";
import { cerezBicimi, dilimTarih, ulkeBul } from "@/lib/build/bolge";
import { icsUret, kodGecerli, musaitGunler, musaitSaatler, randevuDurumu, randevuEpostalari, randevuGenel, randevuOlustur, RandevuHata } from "@/lib/build/isletmeRandevu";
import { eposta as epostaTemizle, kimlikUret, metin, nesne, type Abone, type CeviriSatir, type Randevu, type Sohbet, type Yazi, type Yorum } from "@/lib/build/isletmeTipler";
import { isletmeZamanlayici, kokenNotEt, sahipCevrimici } from "@/lib/build/isletmeZamanlayici";
import { OdemeHata, odemeAyarOku, siparisNoGecerli } from "@/lib/build/odeme";
import { istekOrtami } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; yol?: string[] }> };

/**
 * Vayra İşletme herkese açık uçları (siteler window.vayra.magaza / randevu / blog / yorum / abone ve eklenti betiğiyle):
 *  GET  eklenti.js                     sitenin eklenti betiği (çerez bandı, duyuru, WhatsApp, sohbet, açılır pencere, dil, blog, randevu …)
 *  GET  profil                          işletme profili (iletişim, saatler, adres)
 *  GET  magaza/ayar                     para birimleri ve kurlar, vergi düzeni, satış ülkeleri, ülkeye göre adres biçimi
 *  GET  magaza/urunler?kategori&ara&para satıştaki ürünler (stok sayısı yerine stokta / az kaldı), istenen para biriminde
 *  GET  magaza/urun/<id>                tek ürün
 *  POST magaza/sepet                    sepet hesabı (varyant, kupon, kargo, KDV) sunucuda
 *  POST magaza/odeme                    ödeme başlatır (Vayra Ödeme), güvenli ödeme sayfasının adresi döner
 *  POST magaza/takip                    sipariş numarası + e-postayla sipariş durumu
 *  GET  randevu | randevu/gunler | randevu/saatler   hizmetler, müsait günler ve saatler
 *  POST randevu                         randevu alır
 *  GET|POST randevu/yonet/<kod>         müşterinin randevu sayfası (iptal)
 *  GET  randevu/ics/<kod> | randevu/takvim/<anahtar>.ics   takvime ekleme ve sahibin takvim aboneliği
 *  GET  blog | blog/yazi/<slug> | blog/rss.xml       yayındaki yazılar
 *  GET  yorumlar?urun | POST yorum       onaylı yorumlar ve yorum gönderme
 *  GET  sohbet/durum | POST sohbet      canlı sohbet
 *  POST abone | cerez | dil/eksik       bülten kaydı, çerez tercihi sayımı, çevrilmemiş metin bildirimi
 *  GET  dil/<kod>                       çeviri tablosu
 * Hepsinde hız sınırı var; fiyat, stok, kupon ve müsaitlik sunucuda hesaplanır.
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-onizleme, x-vayra-oturum", "Access-Control-Max-Age": "600" };
const yanit = (v: unknown, durum = 200, onbellek = "no-store") => new Response(JSON.stringify(v), { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": onbellek, ...CORS } });
const red = (hata: string, durum = 400) => yanit({ ok: false, hata }, durum);
const hataYaniti = (e: unknown) => e instanceof OdemeHata || e instanceof RandevuHata ? red(e.message, e.durum) : red((e as Error).message || "İşlem yapılamadı.", 500);
async function govdeOku(req: Request): Promise<Record<string, unknown>> {
  const t = await req.text();
  if (t.length > 40_000) throw new OdemeHata("İstek çok büyük.", 413);
  try { return nesne(JSON.parse(t || "{}")); } catch { throw new OdemeHata("Geçersiz gövde."); }
}

export async function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

async function hazirla(req: Request, ctx: Ctx) {
  const { id, yol = [] } = await ctx.params;
  isletmeZamanlayici();
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id) || id.startsWith("sablon-")) return { hata: red("Proje yok.", 404) } as const;
  const p = await projeOkuHam(id);
  if (!p) return { hata: red("Proje yok.", 404) } as const;
  const koken = kokenBul(req);
  kokenNotEt(id, koken);
  const belirtec = req.headers.get("x-vayra-onizleme");
  const onizleme = !!belirtec && belirtec === p.onizlemeBelirteci;
  return { id, yol, p, koken, ip: ipBul(req), onizleme } as const;
}

export async function GET(req: Request, ctx: Ctx) {
  const h = await hazirla(req, ctx);
  if ("hata" in h) return h.hata;
  const { id, yol, p, koken, ip, onizleme } = h;
  const u = new URL(req.url);
  const [a, b, c] = yol;
  if (a !== "eklenti.js" && sinirli(`ig:${id}:${ip}`, 180)) return red("Çok fazla istek; biraz bekle.", 429);
  try {
    if (a === "eklenti.js") {
      if (sinirli(`ie:${ip}`, 300)) return new Response("/* hız sınırı */", { status: 429, headers: { "Content-Type": "text/javascript; charset=utf-8", ...CORS } });
      const v = await isletmeOku(id);
      const yorumlar = v.eklentiler.yapisalVeri ? await listeOku<Yorum>(id, "yorumlar") : [];
      const kok = (u.searchParams.get("k") ?? "").slice(0, 200);
      const js = eklentiBetigi(v, { adres: `${koken}/api/build/isletme-genel/${id}`, koken, kok: /^\/[A-Za-z0-9/_~.%-]*$/.test(kok) ? kok : "", site: siteAdresi(p, koken), yorumlar });
      mutabakat(id, koken).catch(() => {});
      return new Response(js, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=20", ...CORS } });
    }
    if (a === "abone" && b === "onay" && c) {
      // Çift onay bağlantısı: aboneliği onaylar, izin kaydına zamanı ve IP'yi yazar.
      if (sinirli(`iao:${ip}`, 20)) return new Response("Çok fazla deneme.", { status: 429 });
      const v = await isletmeOku(id);
      let bulunan: Abone | null = null;
      if (/^[A-Za-z0-9_-]{20,40}$/.test(c)) await listeDegistir<Abone>(id, "aboneler", (l) => {
        const x = l.find((y) => y.onayKodu === c);
        if (!x) return;
        if (!x.onayIstendi || Date.now() - x.onayIstendi < 30 * 864e5) { x.izin = true; x.onayZaman = Date.now(); x.ip = ip; delete x.onayKodu; bulunan = { ...x }; }
      }, 20000);
      const ad = v.profil.ad || p.ad;
      const kup = bulunan ? (bulunan as Abone).kupon : "";
      const govde = bulunan ? `<h1>Aboneliğin onaylandı</h1><p>${htmlKacir(ad)} bültenine katıldın. İstediğin an her e-postanın altındaki bağlantıyla ayrılabilirsin.</p>${kup ? `<p>İndirim kodun: <b>${htmlKacir(kup)}</b></p>` : ""}` : `<h1>Bağlantı geçersiz</h1><p>Bu onay bağlantısının süresi dolmuş ya da daha önce kullanılmış olabilir. Abone olduğun formu yeniden doldurabilirsin.</p>`;
      const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Abonelik | ${htmlKacir(ad)}</title><style>body{margin:0;background:#f4f5f7;color:#15171a;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:520px;margin:40px auto;padding:28px;background:#fff;border-radius:22px}h1{font-size:24px;margin:0 0 10px}</style></head><body><main>${govde}</main></body></html>`;
      return new Response(html, { status: bulunan ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
    }
    if (a === "bolge") {
      // Çerez bandının biçimi ziyaretçinin ülkesine göre (barındırma ağının ülke başlığı; yoksa tarayıcı saat diliminden tahmin edilir).
      const h = req.headers;
      const ulke = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country-code") ?? "").toUpperCase().slice(0, 2);
      if (!/^[A-Z]{2}$/.test(ulke) || ulke === "XX") return yanit({ ok: true, ulke: null, kip: null });
      const u = ulkeBul(ulke);
      return yanit({ ok: true, ulke, bolge: h.get("x-vercel-ip-country-region") ?? null, kip: u ? cerezBicimi(u.gizlilik) : "bildirim" });
    }
    const v = await isletmeOku(id);
    if (a === "profil") {
      const pr = v.profil;
      return yanit({ ok: true, profil: { ad: pr.ad, tur: pr.tur, slogan: pr.slogan, aciklama: pr.aciklama, logo: pr.logo, telefon: pr.telefon, eposta: pr.eposta, whatsapp: pr.whatsapp, adres: pr.adresGizli ? null : pr.adres, hizmetBolgesi: pr.hizmetBolgesi, konum: pr.adresGizli ? null : pr.konum, saatler: pr.saatler, ozelGunler: pr.ozelGunler, sosyal: pr.sosyal, fiyatAraligi: pr.fiyatAraligi } }, 200, "public, max-age=30");
    }
    if (a === "magaza") {
      const ortam = await istekOrtami(id, onizleme);
      mutabakat(id, koken).catch(() => {});
      const { urunler: l } = await urunler(id, ortam);
      const satista = l.filter((r) => r.aktif !== false);
      if (b === "urunler") {
        const kategori = u.searchParams.get("kategori") ?? "", ara = (u.searchParams.get("ara") ?? "").toLocaleLowerCase("tr").slice(0, 60);
        const sonuc = satista.filter((r) => (!kategori || r.kategori === kategori) && (!ara || `${r.ad} ${r.aciklama ?? ""} ${r.kategori ?? ""}`.toLocaleLowerCase("tr").includes(ara))).slice(0, 500).map((r) => urunGenelPara(r, v, u.searchParams.get("para")));
        return yanit({ ok: true, urunler: sonuc, kategoriler: [...new Set(satista.map((r) => r.kategori).filter(Boolean))] });
      }
      if (b === "urun" && c) {
        const r = satista.find((x) => x.id === c);
        return r ? yanit({ ok: true, urun: urunGenelPara(r, v, u.searchParams.get("para")) }) : red("Ürün bulunamadı.", 404);
      }
      if (b === "kargo") return yanit({ ok: true, kargo: v.magaza.kargo.filter((y) => y.aktif).map((y) => ({ id: y.id, ad: y.ad, firma: y.firma, ucret: y.ucret, ucretsizEsik: y.ucretsizEsik, sure: y.sure, ulkeler: y.ulkeler, bolgeler: y.bolgeler, ucretTuru: y.ucretTuru, kgBasi: y.kgBasi })), faturaIste: v.magaza.faturaIste, paraBirimi: v.magaza.paraBirimi });
      if (b === "ayar") { const o = await odemeAyarOku(id); return yanit({ ok: true, magaza: magazaGenel(v, o.saglayici ? [o.saglayici, ...(o.ekSaglayicilar ?? [])] : []) }); }
    }
    if (a === "randevu") {
      const l = await listeOku<Randevu>(id, "randevular");
      if (!b) return yanit({ ok: true, randevu: randevuGenel(v) });
      if (b === "gunler") return yanit({ ok: true, gunler: musaitGunler(v.randevu, u.searchParams.get("hizmet") ?? "", u.searchParams.get("calisan") ?? "", l, 21) });
      if (b === "saatler") return yanit({ ok: true, saatler: musaitSaatler(v.randevu, u.searchParams.get("hizmet") ?? "", u.searchParams.get("calisan") ?? "", u.searchParams.get("tarih") ?? "", l).map((x) => ({ bas: x.bas, saat: x.saat })) });
      if (b === "ics" && c && kodGecerli(c)) {
        const r = l.find((x) => x.kod === c);
        if (!r) return new Response("Randevu bulunamadı.", { status: 404 });
        return new Response(icsUret(v, [r], v.profil.ad || p.ad), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="randevu.ics"`, ...CORS } });
      }
      if (b === "takvim" && c) {
        const anahtar = c.replace(/\.ics$/, "");
        if (!v.randevu.takvimAnahtari || anahtar !== v.randevu.takvimAnahtari) return new Response("Bulunamadı.", { status: 404 });
        const simdi = Date.now();
        return new Response(icsUret(v, l.filter((r) => r.bas > simdi - 30 * 864e5 && r.durum !== "iptal"), `${v.profil.ad || p.ad} randevuları`), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (b === "yonet" && c) return yonetSayfasi(id, c, v, l, p.ad);
    }
    if (a === "blog") {
      const l = yayindakiler(await listeOku<Yazi>(id, "yazilar"));
      if (b === "rss.xml") return new Response(rssUret(v, l, siteAdresi(p, koken), v.profil.ad || p.ad), { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300", ...CORS } });
      if (b === "yazi" && c) {
        const y = l.find((x) => x.slug === decodeURIComponent(c));
        return y ? yanit({ ok: true, yazi: yaziGenel(y, v, true) }, 200, "public, max-age=30") : red("Yazı bulunamadı ya da yayından kalktı.", 404);
      }
      const kategori = u.searchParams.get("kategori") ?? "";
      const adet = Math.min(30, Math.max(1, Number(u.searchParams.get("adet")) || v.blog.sayfaBasi));
      const sayfa = Math.max(1, Number(u.searchParams.get("sayfa")) || 1);
      const suzulmus = l.filter((y) => !kategori || y.kategori === kategori);
      return yanit({ ok: true, yazilar: suzulmus.slice((sayfa - 1) * adet, sayfa * adet).map((y) => yaziGenel(y, v)), toplam: suzulmus.length, sonraki: suzulmus.length > sayfa * adet, kategoriler: [...new Set(l.map((y) => y.kategori).filter(Boolean))], baslik: v.blog.baslik }, 200, "public, max-age=30");
    }
    if (a === "yorumlar") {
      const urun = u.searchParams.get("urun") ?? "";
      const l = (await listeOku<Yorum>(id, "yorumlar")).filter((y) => y.durum === "onayli" && (urun ? y.hedef === "urun" && y.urunId === urun : y.hedef === "isletme"));
      const dagilim = [1, 2, 3, 4, 5].map((n) => l.filter((y) => y.puan === n).length);
      return yanit({
        ok: true, ozet: { adet: l.length, ortalama: l.length ? Math.round((l.reduce((t, y) => t + y.puan, 0) / l.length) * 10) / 10 : 0, dagilim },
        yorumlar: l.slice().sort((x, y) => y.olusturma - x.olusturma).slice(0, 100).map((y) => ({ id: y.id, ad: y.ad, puan: y.puan, baslik: y.baslik, metin: y.metin, yanit: y.yanit, dogrulanmis: y.dogrulanmis, tarih: new Date(y.olusturma).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" }) })),
      }, 200, "public, max-age=20");
    }
    if (a === "sohbet" && b === "durum") {
      const sid = u.searchParams.get("id") ?? "", an = u.searchParams.get("a") ?? "", son = Number(u.searchParams.get("son")) || 0;
      let mesajlar: Sohbet["mesajlar"] = [];
      if (sid) {
        const s = (await listeOku<Sohbet>(id, "sohbetler")).find((x) => x.id === sid);
        if (s && s.anahtar === an) mesajlar = s.mesajlar.filter((m) => m.z > son);
      }
      return yanit({ ok: true, cevrimici: sahipCevrimici(id), mesajlar });
    }
    if (a === "dil" && b && /^[a-z]{2}$/.test(b)) {
      if (!v.dil.diller.includes(b)) return red("Bu dil sitede yok.", 404);
      const l = await listeOku<CeviriSatir>(id, "ceviriler");
      const metinler: Record<string, string> = {};
      for (const s of l) { const c2 = s.ceviri[b]; if (c2?.metin) metinler[s.kaynak] = c2.metin; }
      return yanit({ ok: true, dil: b, metinler }, 200, "public, max-age=30");
    }
    return red("Bulunamadı.", 404);
  } catch (e) { return hataYaniti(e); }
}

export async function POST(req: Request, ctx: Ctx) {
  const h = await hazirla(req, ctx);
  if ("hata" in h) return h.hata;
  const { id, yol, p, koken, ip, onizleme } = h;
  const [a, b, c] = yol;
  try {
    if (a === "randevu" && b === "yonet" && c) {
      // Müşterinin e-postadaki bağlantıdan iptali (form gönderimi).
      if (sinirli(`iy:${ip}`, 10)) return new Response("Çok fazla deneme.", { status: 429 });
      const f = new URLSearchParams(await req.text());
      const v = await isletmeOku(id);
      const l = await listeOku<Randevu>(id, "randevular");
      const r = kodGecerli(c) ? l.find((x) => x.kod === c) : undefined;
      if (r && f.get("islem") === "iptal" && r.durum !== "iptal" && r.bas - Date.now() > v.randevu.iptalSaat * 3600_000) {
        const x = await randevuDurumu(id, r.id, "iptal", "Müşteri iptal etti");
        await randevuEpostalari(id, x.r, koken, "iptal").catch(() => false);
      }
      return yonetSayfasi(id, c, await isletmeOku(id), await listeOku<Randevu>(id, "randevular"), p.ad);
    }
    const g = await govdeOku(req);
    if (a === "magaza") {
      const ortam = await istekOrtami(id, onizleme);
      if (b === "sepet") {
        if (sinirli(`is:${id}:${ip}`, 60)) return red("Çok fazla istek; biraz bekle.", 429);
        const s = await sepetHesapla(id, ortam, { sepet: g.sepet, kupon: g.kupon, kargo: g.kargo, eposta: g.eposta, ulke: g.ulke, bolge: g.bolge, para: g.para, vergiKimligi: g.vergiKimligi });
        const { odemeKalemleri: _o, ...d } = s; void _o;
        return yanit({ ok: true, ...d });
      }
      if (b === "kupon") {
        if (sinirli(`ik:${id}:${ip}`, 20)) return red("Çok fazla deneme; biraz bekle.", 429);
        const v = await isletmeOku(id);
        const d = await kuponDenetle(id, v, String(g.kod ?? ""), Math.round(Number(g.tutar ?? 0) * 100) || 1e9, typeof g.eposta === "string" ? g.eposta : undefined);
        return yanit({ ok: true, gecerli: !!d.kupon, mesaj: d.mesaj });
      }
      if (b === "odeme") {
        if (sinirli(`io:${id}:${ip}`, 10)) return red("Çok fazla deneme; biraz bekle.", 429);
        const r = await magazaOdemeBaslat({ id, girdi: g, onizlemeBelirteci: req.headers.get("x-vayra-onizleme"), oturum: req.headers.get("x-vayra-oturum"), koken, ip });
        return yanit({ ok: true, ...r });
      }
      if (b === "takip") {
        if (sinirli(`it:${ip}`, 20)) return red("Çok fazla deneme; biraz bekle.", 429);
        const no = String(g.siparisNo ?? "").trim().toUpperCase();
        if (!siparisNoGecerli(no)) return red("Sipariş numarası VS ile başlayan 16 karakterdir.");
        const s = await siparisTakip(id, no, String(g.eposta ?? ""));
        return s ? yanit({ ok: true, siparis: s }) : red("Bu numara ve e-postayla eşleşen sipariş bulunamadı.", 404);
      }
    }
    if (a === "randevu" && !b) {
      if (sinirli(`ir:${id}:${ip}`, 6) || sinirli(`irs:${id}:${ip}`, 20, 3600_000)) return red("Çok fazla deneme; biraz sonra yeniden dene.", 429);
      const r = await randevuOlustur(id, g, { kaynak: "site", ip });
      const gitti = await randevuEpostalari(id, r, koken, "yeni").catch(() => false);
      const kok = `${koken}/api/build/isletme-genel/${id}/randevu`;
      return yanit({ ok: true, randevu: { id: r.id, durum: r.durum, hizmetAd: r.hizmetAd, calisanAd: r.calisanAd, bas: r.bas, bit: r.bit, zamanMetin: randevuZamanYaz(await isletmeOku(id), r.bas) }, ics: `${kok}/ics/${r.kod}`, yonet: `${kok}/yonet/${r.kod}`, epostaYok: !gitti && !epostaKurulu() });
    }
    if (a === "yorum") {
      if (sinirli(`iyo:${id}:${ip}`, 3) || sinirli(`iyog:${id}:${ip}`, 10, 864e5)) return red("Çok fazla yorum gönderdin; yarın yeniden dene.", 429);
      const v = await isletmeOku(id);
      if (!v.eklentiler.yorum.acik) return red("Bu sitede yorumlar kapalı.", 409);
      const puan = Math.round(Number(g.puan));
      const ad = metin(g.ad, 60), yorumMetni = metin(g.metin, 1500, true), ep = epostaTemizle(g.eposta);
      if (!(puan >= 1 && puan <= 5)) return red("Puan 1 ile 5 arasında olmalı.");
      if (!ad || yorumMetni.length < 3) return red("Ad ve yorum gerekli.");
      if ((yorumMetni.match(/https?:\/\/|www\./gi) ?? []).length > 1) return red("Yorumda bağlantı paylaşılamaz.");
      const urunId = metin(g.urun, 64);
      let urunAd = "";
      if (urunId) {
        if (!v.eklentiler.yorum.urun) return red("Ürün yorumları kapalı.", 409);
        const { urunler: l } = await urunler(id, "canli");
        const r = l.find((x) => x.id === urunId);
        if (!r) return red("Ürün bulunamadı.", 404);
        urunAd = r.ad;
      } else if (!v.eklentiler.yorum.isletme) return red("İşletme yorumları kapalı.", 409);
      // Doğrulanmış alıcı: bu e-postayla ödenmiş bir sipariş (ürün yorumunda o ürünü içeren) varsa.
      let dogrulanmis = false;
      if (ep) {
        const { siparisler } = await import("@/lib/build/isletmeMagaza");
        dogrulanmis = (await siparisler(id, "canli")).some((s) => s.eposta === ep && s.durum === "odendi" && (!urunId || s.kalemler.some((k) => k.id.split("~")[0] === urunId)));
      }
      const durum = v.eklentiler.yorum.onay === "otomatik" && puan >= 3 ? "onayli" : "bekliyor";
      await listeDegistir<Yorum>(id, "yorumlar", (l) => {
        if (l.filter((y) => y.ip === ip && Date.now() - y.olusturma < 864e5).length >= 10) throw new OdemeHata("Bugün çok fazla yorum gönderildi.", 429);
        l.push({ id: kimlikUret(), hedef: urunId ? "urun" : "isletme", urunId, urunAd, ad, eposta: ep, puan, baslik: metin(g.baslik, 120), metin: yorumMetni, durum, yanit: "", dogrulanmis, olusturma: Date.now(), ip });
      }, 5000);
      gunlukYaz(id, { t: "form", d: 200, y: "/isletme/yorum", m: `Yeni yorum: ${puan} yıldız${urunAd ? `, ${urunAd}` : ""}` });
      return yanit({ ok: true, durum });
    }
    if (a === "sohbet") {
      if (sinirli(`iso:${id}:${ip}`, 12)) return red("Çok hızlı yazıyorsun; biraz bekle.", 429);
      const v = await isletmeOku(id);
      if (!v.eklentiler.sohbet.acik) return red("Canlı sohbet kapalı.", 409);
      const icerik = metin(g.metin, 1000, true);
      if (!icerik) return red("Mesaj boş.");
      const z = Date.now();
      const r = await listeDegistir<Sohbet, { id: string; anahtar: string; mesaj: Sohbet["mesajlar"][number] }>(id, "sohbetler", (l) => {
        let s = typeof g.id === "string" ? l.find((x) => x.id === g.id && x.anahtar === g.a) : undefined;
        if (!s) {
          if (l.filter((x) => x.ip === ip && z - x.olusturma < 3600_000).length >= 5) throw new OdemeHata("Çok fazla yeni sohbet açıldı; biraz bekle.", 429);
          s = { id: kimlikUret(), anahtar: kimlikUret() + kimlikUret(), ad: metin(g.ad, 60), eposta: epostaTemizle(g.eposta), sayfa: metin(g.sayfa, 160), mesajlar: [], okundu: false, kapali: false, olusturma: z, guncelleme: z, ip };
          l.push(s);
        }
        if (s.mesajlar.length >= 300) throw new OdemeHata("Bu sohbet çok uzadı; yeni bir sohbet başlat.", 409);
        const m = { z, kim: "ziyaretci" as const, metin: icerik };
        s.mesajlar.push(m); s.okundu = false; s.kapali = false; s.guncelleme = z;
        if (!s.ad && g.ad) s.ad = metin(g.ad, 60);
        if (!s.eposta && g.eposta) s.eposta = epostaTemizle(g.eposta);
        return { id: s.id, anahtar: s.anahtar, mesaj: m };
      }, 2000);
      return yanit({ ok: true, id: r.id, anahtar: r.anahtar, mesajlar: [r.mesaj] });
    }
    if (a === "abone") {
      if (sinirli(`iab:${id}:${ip}`, 5)) return red("Çok fazla deneme; biraz bekle.", 429);
      const ep = epostaTemizle(g.eposta);
      if (!ep) return red("Geçerli bir e-posta adresi yaz.");
      if (g.izin === false) return red("Kampanya e-postası için onay gerekli.");
      const v = await isletmeOku(id);
      const kupon = String(g.kaynak) === "kupon" && v.eklentiler.popup.acik && v.eklentiler.popup.tur === "kupon" && v.kuponlar.some((k) => k.kod === v.eklentiler.popup.kuponKod && k.aktif) ? v.eklentiler.popup.kuponKod : "";
      // Çift onay (double opt-in): ayara ve ziyaretçinin ülkesine göre. AB, AEA, İngiltere, İsviçre ve Kanada'da önerilir.
      const { ekOku } = await import("@/lib/build/buyumeEkDepo");
      const ek = await ekOku(id);
      const h = req.headers, ziyaretciUlke = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase().slice(0, 2);
      const u = ulkeBul(ziyaretciUlke) ?? ulkeBul(v.profil.ulkeKodu);
      const kip = ek.izinAyar?.ciftOnay ?? "bolge";
      const ciftOnay = kip === "herkes" || (kip === "bolge" && (!u || u.eposta === "gdpr" || u.eposta === "casl"));
      const izinMetni = metin(g.izinMetni, 300) || (v.eklentiler.popup.acik ? v.eklentiler.popup.metin : "");
      const kod = ciftOnay ? randomBytes(18).toString("base64url") : "";
      const z = Date.now();
      let zatenOnayli = false;
      await listeDegistir<Abone>(id, "aboneler", (l) => {
        const var_ = l.find((x) => x.eposta === ep);
        const kayit = { izinMetni, ip, ...(ziyaretciUlke ? { ulke: ziyaretciUlke } : {}) };
        if (var_) {
          if (var_.izin) { zatenOnayli = true; return; }
          if (ciftOnay) Object.assign(var_, kayit, { onayKodu: kod, onayIstendi: z }); else Object.assign(var_, kayit, { izin: true, cikis: undefined });
          return;
        }
        l.push({ id: kimlikUret(), eposta: ep, ad: metin(g.ad, 60), kaynak: metin(g.kaynak, 20) || "form", sayfa: metin(g.sayfa, 160), kupon, olusturma: z, izin: !ciftOnay, ...kayit, ...(ciftOnay ? { onayKodu: kod, onayIstendi: z } : {}) });
      }, 20000);
      if (ciftOnay && !zatenOnayli) {
        const { epostaGonder, epostaKurulu } = await import("@/lib/build/bulutEposta");
        if (!epostaKurulu()) return yanit({ ok: true, onayGerekli: true, epostaGitmedi: true, mesaj: "Kaydın alındı; onay e-postası şu an gönderilemedi. Site sahibi e-posta servisini kurunca yeniden dene." });
        const adres = `${koken}/api/build/isletme-genel/${id}/abone/onay/${kod}`;
        const site = v.profil.ad || "Site";
        const x = await epostaGonder({ projeId: id, kime: ep, konu: `${site} aboneliğini onayla`, metin: `Merhaba,\n\n${site} bültenine abone olmak için aşağıdaki düğmeye dokun. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; onaylamadıkça sana pazarlama e-postası gönderilmez.`, dugme: { ad: "Aboneliğimi onayla", adres }, site, marka: { ...(v.profil.logo ? { logo: v.profil.logo } : {}), altYazi: [site, v.profil.adres.sokak && !v.profil.adresGizli ? [v.profil.adres.sokak, v.profil.adres.il, v.profil.adres.ulke].filter(Boolean).join(", ") : ""].filter(Boolean).join(" · ") } }).catch(() => ({ ok: false }));
        return yanit({ ok: true, onayGerekli: true, ...(x.ok ? {} : { epostaGitmedi: true }), mesaj: x.ok ? "Onay e-postası gönderildi; aboneliği tamamlamak için e-postandaki bağlantıya dokun." : "Onay e-postası gönderilemedi; biraz sonra yeniden dene." });
      }
      return yanit({ ok: true, ...(kupon ? { kupon } : {}) });
    }
    if (a === "cerez") {
      if (sinirli(`ic:${id}:${ip}`, 10)) return yanit({ ok: true });
      const gun = dilimTarih(Date.now(), (await isletmeOku(id)).profil.saatDilimi);
      const tur = g.analitik && g.pazarlama ? "hepsi" : g.analitik || g.pazarlama ? "kismi" : "red";
      await listeDegistir<{ gun: string; hepsi: number; kismi: number; red: number }>(id, "olaylar", (l) => {
        let x = l.find((y) => y.gun === gun);
        if (!x) { x = { gun, hepsi: 0, kismi: 0, red: 0 }; l.push(x); }
        x[tur]++;
      }, 120);
      return yanit({ ok: true });
    }
    if (a === "dil" && b === "eksik") {
      if (sinirli(`id:${id}:${ip}`, 6)) return yanit({ ok: true });
      const v = await isletmeOku(id);
      if (!v.dil.diller.length) return yanit({ ok: true });
      const l0 = (Array.isArray(g.metinler) ? g.metinler : []).slice(0, 120).map((x) => String(x ?? "").replace(/\s+/g, " ").trim()).filter((x) => x.length >= 2 && x.length <= 500 && !/[<>]/.test(x));
      const sayfa = metin(g.sayfa, 160);
      let yeni = 0;
      await listeDegistir<CeviriSatir>(id, "ceviriler", (l) => {
        const var_ = new Set(l.map((x) => x.kaynak));
        for (const s of l0) { if (var_.has(s) || l.length >= 4000) continue; l.push({ id: ceviriAnahtari(s), kaynak: s, sayfalar: [sayfa], tur: "metin", ceviri: {}, gorulme: Date.now() }); var_.add(s); yeni++; }
      }, 4000);
      return yanit({ ok: true, yeni });
    }
    return red("Bulunamadı.", 404);
  } catch (e) { return hataYaniti(e); }
}

/** Müşterinin randevu sayfası: ayrıntı, takvime ekle, iptal (süresi içindeyse). */
function yonetSayfasi(id: string, kod: string, v: Awaited<ReturnType<typeof isletmeOku>>, l: Randevu[], projeAd: string) {
  const r = kodGecerli(kod) ? l.find((x) => x.kod === kod) : undefined;
  const k = htmlKacir;
  const ad = v.profil.ad || projeAd;
  const iptalEdilir = r && r.durum !== "iptal" && r.durum !== "geldi" && r.bas - Date.now() > v.randevu.iptalSaat * 3600_000;
  const durumAd: Record<string, string> = { bekliyor: "Onay bekliyor", onaylandi: "Onaylandı", iptal: "İptal edildi", geldi: "Tamamlandı", gelmedi: "Gelinmedi" };
  const govde = !r ? `<h1>Randevu bulunamadı</h1><p>Bağlantı hatalı ya da randevu silinmiş olabilir.</p>` : `
<p class="d d-${r.durum}">${k(durumAd[r.durum] ?? r.durum)}</p>
<h1>${k(r.hizmetAd)}</h1>
<p class="z">${k(randevuZamanYaz(v, r.bas))}<br><span>${r.sure} dakika${r.calisanAd ? ` · ${k(r.calisanAd)}` : ""}</span></p>
${v.profil.adres.sokak && !v.profil.adresGizli ? `<p>${k([v.profil.adres.sokak, v.profil.adres.ilce, v.profil.adres.il].filter(Boolean).join(", "))}</p>` : ""}
${v.profil.telefon ? `<p>Telefon: <a href="tel:${k(v.profil.telefon.replace(/[^\d+]/g, ""))}">${k(v.profil.telefon)}</a></p>` : ""}
<div class="dg">${r.durum !== "iptal" ? `<a class="b ik" href="../ics/${k(r.kod)}">Takvimime ekle</a>` : ""}
${iptalEdilir ? `<form method="post" onsubmit="return confirm('Randevun iptal edilsin mi?')"><input type="hidden" name="islem" value="iptal"><button class="b">Randevuyu iptal et</button></form>` : r.durum !== "iptal" ? `<p class="n">Randevudan ${v.randevu.iptalSaat} saatten az kaldığı için çevrim içi iptal kapandı; değişiklik için işletmeyi ara.</p>` : ""}</div>`;
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Randevum | ${k(ad)}</title>
<style>body{margin:0;background:#f4f5f7;color:#15171a;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:520px;margin:40px auto;padding:28px;background:#fff;border-radius:22px}header{display:flex;align-items:center;gap:10px;margin-bottom:22px}header img{width:40px;height:40px;border-radius:10px;object-fit:cover}header b{font-size:17px}h1{font-size:26px;line-height:1.2;margin:6px 0 8px}.z{font-size:18px}.z span{font-size:15px;color:#5b6270}.d{display:inline-block;margin:0;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;background:#eef0f3}.d-onaylandi{background:#dff5ea;color:#11643c}.d-iptal{background:#fde8e8;color:#9b1c1c}.d-bekliyor{background:#fff4d6;color:#7a5200}.dg{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}.b{display:inline-flex;border:0;border-radius:999px;padding:11px 18px;font:600 15px system-ui;background:#15171a;color:#fff;text-decoration:none;cursor:pointer}.b.ik{background:#eef0f3;color:#15171a}form{margin:0}.n{font-size:14px;color:#5b6270}a{color:#0a6c8f}@media(max-width:560px){main{margin:0;border-radius:0;min-height:100vh}}</style></head>
<body><main><header>${v.profil.logo ? `<img src="${k(v.profil.logo)}" alt="">` : ""}<b>${k(ad)}</b></header>${govde}</main></body></html>`;
  void id;
  return new Response(html, { status: r ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
