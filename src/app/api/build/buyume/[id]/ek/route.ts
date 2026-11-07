import { projeOku } from "@/lib/build/depo";
import { yardimciModel } from "@/lib/build/ajanZeka";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { buildKrediYeterli, yanittanKes } from "@/lib/hesap/buildKredi";
import { canliDeneyYaz, type CanliDeney } from "@/lib/build/buyumeDeneyCanli";
import { deneyIzSil, deneySayac, ekGuncelle, ekOku, kisaAyir, kisaBirak, kisaKodUret } from "@/lib/build/buyumeEkDepo";
import { denemeGonder, epostaDurumu, gonderimBaslat, zamanla, zamanlayiciKur } from "@/lib/build/buyumeEposta";
import { kisileriKur } from "@/lib/build/buyumeKisiler";
import { AnalizHatasi, anahtarKelimeler, kampanyaYaz, markaCikar, markaSesi, ModelYok2, rakipKarsilastir, rakipOku, raporHesapla, raporYorumu } from "@/lib/build/buyumeAnaliz";
import {
  bosMarka, dogumTemizle, epostaGecerli, IZINLER, izinYaz, kampanyaOzetle, kimlikUret, kisiAnahtari, kodGecerli, saatGecerli, utmTemizle,
  type Baglanti, type Deney, type EkVeri, type IndirimKodu, type Kampanya, type KisiMeta, type Suzgec,
} from "@/lib/build/buyumeEkTipler";
import { abTemizle, blokTemizle, v5Duzenle, v5Islem, v5Veri } from "@/lib/build/buyumeIslem";
import type { Proje } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
zamanlayiciKur();

/**
 * Büyüme v4 (kişiler, e-posta, bağlantılar, denemeler, marka, kodlar, paylaşım saatleri, rakipler, SEO, rapor).
 *  GET          { ek, kisiler, eposta, sosyal, model, site }
 *  PATCH {tur}  sahibin düzenlemesi (izleyici yazamaz)
 *  POST {islem} işlem: kampanya-yaz, deneme, gonder, zamanla, iptal, kopyala, rakip, marka-cikar, marka-ses, anahtar-kelime,
 *               rapor, rapor-yorum, deney-baslat, deney-durdur, deney-bitir, kisi-ekle
 *  v5 (buyumeIslem.ts): akışlar, bülten, bio sayfası, yapay zekâ görünürlüğü, Google İşletme, İYS, sosyal bağlantılar
 */
async function erisim(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return { yanit: yetkisiz() } as const;
  const id = (await ctx.params).id;
  const p = await projeOku(id, sahip);
  if (!p) return { yanit: bulunamadi() } as const;
  if (req.method !== "GET") { const e = await izleyiciEngeli(id, sahip); if (e) return { yanit: e } as const; }
  return { p, id, sahip } as const;
}

const SOSYAL = [
  { id: "meta", anahtarlar: ["META_APP_ID", "META_APP_SECRET"] }, { id: "x", anahtarlar: ["X_CLIENT_ID", "X_CLIENT_SECRET"] },
  { id: "linkedin", anahtarlar: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] }, { id: "tiktok", anahtarlar: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] },
];
/** Yayındaki sürümde sayfa var mı (deneme ancak iki sayfa da yayındaysa çalışır). */
const yayinDosyalari = (p: Proje) => (p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? null : null);
function canliYenile(p: Proje, v: EkVeri) {
  const l: CanliDeney[] = v.deneyler.filter((d) => d.durum === "calisiyor").map((d) => ({ i: d.id, a: d.sayfa, b: d.varyant, p: d.pay, h: d.hedef.tur === "form" ? { t: "form" } : { t: d.hedef.tur, s: d.hedef.tur === "sayfa" ? d.hedef.sayfa : d.hedef.ad } }));
  canliDeneyYaz(p.id, l);
}

async function istemciVerisi(p: Proje, id: string, koken: string) {
  const ek = await ekOku(id);
  const kisiler = await kisileriKur(id, ek);
  const yd = yayinDosyalari(p);
  const v5 = await v5Veri(p, id, ek, koken);
  const { akislar, ...v5Ek } = v5;
  return {
    ok: true, ...v5Ek,
    ek: { ...ek, akislar, kampanyalar: ek.kampanyalar.map(kampanyaOzetle), deneyler: ek.deneyler.map((d) => ({ ...d, ...deneySayac(id, d.id), yayinda: !!yd && d.sayfa in yd && d.varyant in yd, taslakta: d.varyant in p.dosyalar })) },
    kisiler, eposta: epostaDurumu(), model: yardimciModel()?.ad ?? null, site: siteAdresi(p, koken), koken,
    sosyal: SOSYAL.map((s) => ({ id: s.id, anahtar: s.anahtarlar.every((a) => !!process.env[a]), eksik: s.anahtarlar.filter((a) => !process.env[a]) })),
    gsc: !!process.env.GOOGLE_SEARCH_CONSOLE_ISTEMCI_ID,
  };
}

export async function GET(req: Request, ctx: Ctx) {
  const s = await erisim(req, ctx);
  if ("yanit" in s) return s.yanit;
  return Response.json(await istemciVerisi(s.p, s.id, kokenBul(req)));
}

const metin = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
const sayi = (x: unknown, en: number) => { const n = Number(x); return Number.isFinite(n) ? Math.max(0, Math.min(en, n)) : 0; };
const etiketTemizle = (x: unknown) => [...new Set((Array.isArray(x) ? x : []).map((e) => String(e ?? "").trim().toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 30)).filter(Boolean))].slice(0, 20);
function suzgecTemizle(x: unknown): Suzgec {
  const s = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return {
    kaynak: (Array.isArray(s.kaynak) ? s.kaynak : []).filter((k): k is NonNullable<Suzgec["kaynak"]>[number] => ["uye", "form", "siparis", "elle", "abone", "randevu", "bio"].includes(String(k))),
    etiket: etiketTemizle(s.etiket), etiketYok: etiketTemizle(s.etiketYok),
    izin: (["onay", "bilinmiyor", "ret", "tum"].includes(String(s.izin)) ? s.izin : "tum") as Suzgec["izin"],
    sonGun: sayi(s.sonGun, 3650) || undefined, siparis: s.siparis === "var" || s.siparis === "yok" ? s.siparis : undefined,
    enAzHarcama: sayi(s.enAzHarcama, 1e9) || undefined, arama: metin(s.arama, 80) || undefined,
  };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const s = await erisim(req, ctx);
  if ("yanit" in s) return s.yanit;
  const { p, id } = s;
  let g: Record<string, unknown>;
  try { const ham = await req.text(); if (ham.length > 800_000) return hata("İstek çok büyük.", 413); g = JSON.parse(ham); } catch { return hata("Geçersiz istek."); }
  const tur = String(g.tur ?? "");
  const sonraki: (() => Promise<unknown>)[] = [];
  try {
    const { sonuc } = await ekGuncelle(id, (v): string | null => {
      const meta = (a: string): KisiMeta => (v.kisiMeta[a] ??= { etiketler: [] });
      switch (tur) {
        case "kisi": {
          const a = metin(g.anahtar, 200); if (!a) return "Kişi yok.";
          const m = meta(a);
          if ("etiketler" in g) m.etiketler = etiketTemizle(g.etiketler);
          if ("not" in g) m.not = metin(g.not, 2000) || undefined;
          if ("ad" in g) m.ad = metin(g.ad, 80).trim() || undefined;
          if ("telefon" in g) m.telefon = metin(g.telefon, 30).trim() || undefined;
          if ("dogum" in g) { const d = dogumTemizle(g.dogum); if (g.dogum && !d) return "Doğum günü GG.AA ya da GG.AA.YYYY biçiminde olmalı."; m.dogum = d || undefined; }
          if (g.izin && IZINLER.some((x) => x.id === g.izin)) { izinYaz(m, g.izin as NonNullable<KisiMeta["izin"]>, metin(g.izinKaynak, 200) || (g.izin === "onay" ? "Sahip elle onayladı" : g.izin === "ret" ? "Sahip elle reddetti" : "Sahip belirsiz olarak işaretledi")); if (g.izin !== "ret" && !a.startsWith("tel:")) delete v.cikanlar[a]; }
          return null;
        }
        case "kisiToplu": {
          const l = (Array.isArray(g.anahtarlar) ? g.anahtarlar : []).map((x) => String(x).slice(0, 200)).slice(0, 5000);
          const ekle = etiketTemizle(g.etiketEkle), cikar = etiketTemizle(g.etiketCikar);
          for (const a of l) { const m = meta(a); m.etiketler = [...new Set([...m.etiketler.filter((e) => !cikar.includes(e)), ...ekle])].slice(0, 20); if (g.izin && IZINLER.some((x) => x.id === g.izin)) izinYaz(m, g.izin as NonNullable<KisiMeta["izin"]>, metin(g.izinKaynak, 200) || "Sahip toplu işaretledi"); }
          return null;
        }
        case "kisiSil": { const a = metin(g.anahtar, 200); if (v.kisiMeta[a]?.elle) delete v.kisiMeta[a]; else if (v.kisiMeta[a]) v.kisiMeta[a] = { etiketler: [] }; return null; }
        case "cikan": {
          const e = metin(g.eposta, 200).trim().toLocaleLowerCase("tr-TR"); if (!epostaGecerli(e)) return "E-posta geçersiz.";
          if (g.ekle) { v.cikanlar[e] = { z: Date.now(), kaynak: "Sahip elle ekledi" }; izinYaz(meta(e), "ret", "Çıkanlar listesine eklendi"); }
          else { delete v.cikanlar[e]; izinYaz(meta(e), "bilinmiyor", "Çıkanlar listesinden kaldırıldı"); }
          return null;
        }
        case "segment": {
          const x = (g.segment ?? {}) as Record<string, unknown>;
          const sid = typeof x.id === "string" && v.segmentler.some((y) => y.id === x.id) ? x.id : kimlikUret();
          const y = { id: sid, ad: metin(x.ad, 60).trim() || "Segment", suzgec: suzgecTemizle(x.suzgec), olusturma: Date.now() };
          v.segmentler = [...v.segmentler.filter((z) => z.id !== sid), y].slice(-30);
          return null;
        }
        case "segmentSil": v.segmentler = v.segmentler.filter((x) => x.id !== g.id); return null;
        case "kampanya": {
          const x = (g.kampanya ?? {}) as Record<string, unknown>;
          let k = v.kampanyalar.find((y) => y.id === x.id);
          if (k && k.durum !== "taslak") return "Gönderilen ya da zamanlanan kampanya düzenlenemez; önce zamanlamayı iptal et.";
          if (!k) { if (v.kampanyalar.length >= 60) return "En çok 60 kampanya tutulur; eskileri sil."; k = { id: kimlikUret(), ad: "Yeni kampanya", konu: "", onMetin: "", bloklar: [], suzgec: { izin: "tum" }, durum: "taslak", baglantilar: [], alicilar: [], denemeler: [], olusturma: Date.now(), guncelleme: Date.now() }; v.kampanyalar.unshift(k); }
          if ("ad" in x) k.ad = metin(x.ad, 80).trim() || k.ad;
          if ("konu" in x) k.konu = metin(x.konu, 150);
          if ("onMetin" in x) k.onMetin = metin(x.onMetin, 150);
          if ("bloklar" in x) k.bloklar = blokTemizle(x.bloklar);
          if ("suzgec" in x) k.suzgec = suzgecTemizle(x.suzgec);
          if ("segmentId" in x) k.segmentId = typeof x.segmentId === "string" ? x.segmentId.slice(0, 20) : undefined;
          if ("izinsizKat" in x) k.izinsizKat = x.izinsizKat === true;
          if ("ab" in x) k.ab = x.ab ? abTemizle(x.ab, k.konu) : undefined;
          if (k.ab) k.ab.konular[0] = k.konu;
          if ("saatKip" in x) k.saatKip = x.saatKip === "kisisel" ? "kisisel" : undefined;
          k.guncelleme = Date.now(); k.hata = undefined;
          return null;
        }
        case "kampanyaSil": { const k = v.kampanyalar.find((x) => x.id === g.id); if (k?.durum === "gonderiliyor") return "Gönderim sürüyor; önce durdur."; v.kampanyalar = v.kampanyalar.filter((x) => x.id !== g.id); zamanla(id, String(g.id), null); return null; }
        case "baglanti": {
          const x = (g.baglanti ?? {}) as Record<string, unknown>;
          const hedef = metin(x.hedef, 1000).trim();
          if (!/^https?:\/\/[^\s"'<>]+$/i.test(hedef)) return "Hedef adres http ya da https ile başlamalı.";
          let b = v.baglantilar.find((y) => y.id === x.id);
          if (!b) { if (v.baglantilar.length >= 200) return "En çok 200 bağlantı tutulur."; b = { id: kimlikUret(), ad: "", hedef, olusturma: Date.now(), tik: 0, gunler: {}, kaynaklar: {}, cihazlar: {} } as Baglanti; v.baglantilar.unshift(b); }
          b.ad = metin(x.ad, 80).trim() || b.ad || "Bağlantı"; b.hedef = hedef;
          const u = x.utm as Record<string, string> | undefined;
          b.utm = u && (u.kaynak || u.kampanya) ? utmTemizle({ kaynak: metin(u.kaynak, 60), ortam: metin(u.ortam, 60), kampanya: metin(u.kampanya, 60), icerik: metin(u.icerik, 60) || undefined, terim: metin(u.terim, 60) || undefined }) : undefined;
          if (x.kisa && !b.kod) {
            const istenen = metin(x.kod, 32).trim();
            if (istenen && !kodGecerli(istenen)) return "Kısa kod 3 ile 32 karakter; harf, rakam, tire ve alt çizgi.";
            const kod = istenen || kisaKodUret();
            if (!kisaAyir(kod, id)) return "Bu kısa kod başkası tarafından kullanılıyor.";
            b.kod = kod.toLowerCase();
          }
          return null;
        }
        case "baglantiSil": { const b = v.baglantilar.find((x) => x.id === g.id); if (b?.kod) kisaBirak(b.kod, id); v.baglantilar = v.baglantilar.filter((x) => x.id !== g.id); return null; }
        case "deney": {
          const x = (g.deney ?? {}) as Record<string, unknown>;
          let d = v.deneyler.find((y) => y.id === x.id);
          if (d && d.durum === "calisiyor" && ("sayfa" in x || "varyant" in x)) return "Çalışan denemenin sayfaları değiştirilemez; önce durdur.";
          const sayfa = metin(x.sayfa, 120) || d?.sayfa || "index.html";
          if (!(sayfa in p.dosyalar)) return `${sayfa} projede yok.`;
          const varyant = metin(x.varyant, 120) || d?.varyant || sayfa.replace(/\.html$/, "-b.html");
          if (!/^[\w/.-]+\.html$/.test(varyant) || varyant === sayfa) return "B sayfasının adı geçersiz.";
          if (!d) { if (v.deneyler.length >= 30) return "En çok 30 deneme tutulur."; d = { id: kimlikUret(), ad: "", sayfa, varyant, pay: 50, hedef: { tur: "form" }, hipotez: "", durum: "taslak", olusturma: Date.now() } as Deney; v.deneyler.unshift(d); }
          d.sayfa = sayfa; d.varyant = varyant;
          if ("ad" in x) d.ad = metin(x.ad, 80).trim(); if (!d.ad) d.ad = `${sayfa} denemesi`;
          if ("hipotez" in x) d.hipotez = metin(x.hipotez, 1200);
          if ("pay" in x) d.pay = Math.round(Math.min(90, Math.max(10, sayi(x.pay, 90))));
          if (x.hedef && typeof x.hedef === "object") { const h = x.hedef as Record<string, unknown>; d.hedef = h.tur === "sayfa" ? { tur: "sayfa", sayfa: metin(h.sayfa, 120) || "tesekkurler.html" } : h.tur === "olay" ? { tur: "olay", ad: metin(h.ad, 60) || "satin_alma" } : { tur: "form" }; }
          if (d.durum === "calisiyor") canliYenile(p, v);
          return null;
        }
        case "deneySil": { v.deneyler = v.deneyler.filter((x) => x.id !== g.id); deneyIzSil(id, String(g.id)); canliYenile(p, v); return null; }
        case "marka": {
          const x = (g.marka ?? {}) as Record<string, unknown>;
          const m = v.marka ?? bosMarka();
          if (Array.isArray(x.renkler)) m.renkler = x.renkler.slice(0, 8).map((r0) => { const r = (r0 ?? {}) as Record<string, unknown>; return { ad: metin(r.ad, 30) || "Renk", hex: /^#[0-9a-f]{6}$/i.test(String(r.hex)) ? String(r.hex).toLowerCase() : "#111111" }; });
          if ("baslikYazi" in x) m.baslikYazi = metin(x.baslikYazi, 60).replace(/[<>"{};]/g, "");
          if ("govdeYazi" in x) m.govdeYazi = metin(x.govdeYazi, 60).replace(/[<>"{};]/g, "");
          if ("ton" in x) m.ton = metin(x.ton, 1000);
          if ("slogan" in x) m.slogan = metin(x.slogan, 120) || undefined;
          if ("iletisim" in x) m.iletisim = metin(x.iletisim, 400);
          if ("yasakli" in x) m.yasakli = (Array.isArray(x.yasakli) ? x.yasakli : []).map((y) => String(y).trim().slice(0, 40)).filter(Boolean).slice(0, 20);
          if ("logo" in x) { const l = metin(x.logo, 600).trim(); m.logo = /^https:\/\/[^\s"'<>]+$/.test(l) ? l : undefined; }
          m.guncelleme = Date.now(); v.marka = m;
          return null;
        }
        case "kod": {
          const x = (g.kod ?? {}) as Record<string, unknown>;
          const kod = metin(x.kod, 24).trim().toUpperCase();
          if (!/^[A-Z0-9_-]{3,24}$/.test(kod)) return "Kod 3 ile 24 karakter; büyük harf, rakam, tire.";
          let k = v.kodlar.find((y) => y.id === x.id);
          if (v.kodlar.some((y) => y.kod === kod && y.id !== k?.id)) return "Bu kod zaten var.";
          if (!k) { if (v.kodlar.length >= 100) return "En çok 100 kod tutulur."; k = { id: kimlikUret(), kod, tur: "yuzde", deger: 10, kullanim: 0, aciklama: "", aktif: true, olusturma: Date.now() } as IndirimKodu; v.kodlar.unshift(k); }
          k.kod = kod; k.tur = x.tur === "tutar" ? "tutar" : "yuzde";
          k.deger = Math.round(Math.min(k.tur === "yuzde" ? 100 : 1e7, Math.max(1, sayi(x.deger, 1e7) || 10)));
          k.bitis = /^\d{4}-\d{2}-\d{2}$/.test(String(x.bitis ?? "")) ? String(x.bitis) : undefined;
          k.sinir = sayi(x.sinir, 1e6) || undefined; k.aciklama = metin(x.aciklama, 200); k.aktif = x.aktif !== false;
          if (x.kullanimSifirla) k.kullanim = 0;
          return null;
        }
        case "kodSil": v.kodlar = v.kodlar.filter((x) => x.id !== g.id); if (v.tavsiye.kodId === g.id) v.tavsiye.kodId = undefined; return null;
        case "tavsiye": { const x = (g.tavsiye ?? {}) as Record<string, unknown>; v.tavsiye = { acik: x.acik === true, davetEdenOdul: metin(x.davetEdenOdul, 200), davetliOdul: metin(x.davetliOdul, 200), kodId: typeof x.kodId === "string" && v.kodlar.some((k) => k.id === x.kodId) ? x.kodId : undefined }; return null; }
        case "saatler": {
          const x = (g.saatler ?? {}) as Record<string, unknown>;
          const y: EkVeri["saatler"] = {};
          for (const [k, l] of Object.entries(x).slice(0, 10)) if (["instagram", "hikaye", "tiktok", "linkedin", "x", "whatsapp", "eposta", "ozel"].includes(k) && Array.isArray(l)) (y as Record<string, unknown>)[k] = l.slice(0, 28).map((s0) => { const s = (s0 ?? {}) as Record<string, unknown>; return { gun: Math.round(sayi(s.gun, 6)), saat: saatGecerli(s.saat) ? s.saat : "10:00" }; });
          v.saatler = y; return null;
        }
        case "seoHedef": { const sayfa = metin(g.sayfa, 120); if (!(sayfa in p.dosyalar)) return "Sayfa yok."; const k = metin(g.kelime, 80).trim().toLocaleLowerCase("tr-TR"); if (k) v.seo.hedefler[sayfa] = k; else delete v.seo.hedefler[sayfa]; return null; }
        case "kelimeSil": v.seo.kelimeler = v.seo.kelimeler.filter((x) => x.id !== g.id); return null;
        case "rakipSil": v.rakipler = v.rakipler.filter((x) => x.id !== g.id); return null;
        case "raporSil": v.raporlar = v.raporlar.filter((x) => x.id !== g.id); return null;
        case "raporOtomatik": v.raporOtomatik = g.acik === true; return null;
        default: { const r = v5Duzenle(tur, { ...g, koken: kokenBul(req) }, v, p, id, (f) => sonraki.push(f)); return r === undefined ? "Bilinmeyen düzenleme." : r; }
      }
    });
    for (const f of sonraki) await f().catch(() => {});
    if (sonuc) return hata(sonuc);
    return Response.json(await istemciVerisi(p, id, kokenBul(req)));
  } catch (e) { return hata(e instanceof Error ? e.message : "Kaydedilemedi.", 500); }
}

/** Yapay zekâ kullanan işlemlerin bedeli sunucuda düşülür (yanıttaki kredi). */
export async function POST(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  return yanittanKes(await postIsle(req, ctx), sahip, { kaynak: "build:buyume", aciklama: "Büyüme: yapay zekâ işlemi" });
}

async function postIsle(req: Request, ctx: Ctx) {
  const s = await erisim(req, ctx);
  if ("yanit" in s) return s.yanit;
  const { p, id } = s;
  let g: Record<string, unknown>;
  try { g = JSON.parse((await req.text()).slice(0, 600_000)); } catch { return hata("Geçersiz istek."); }
  const islem = String(g.islem ?? "");
  const koken = kokenBul(req);
  const tamam = async (ek: Record<string, unknown> = {}) => Response.json({ ...(await istemciVerisi(p, id, koken)), ...ek });
  try {
    const ek = await ekOku(id);
    const kampanya = (): Kampanya | undefined => ek.kampanyalar.find((x) => x.id === g.kampanyaId);
    switch (islem) {
      case "kampanya-yaz": {
        const r = await kampanyaYaz(p, ek, { amac: metin(g.amac, 400) || "Yenilikleri duyur", kitle: metin(g.kitle, 300) || "Bütün kişiler", ton: metin(g.ton, 80) || "samimi", adres: siteAdresi(p, koken) });
        const { sonuc } = await ekGuncelle(id, (v) => { const k: Kampanya = { id: kimlikUret(), ad: r.ad, konu: r.konu, onMetin: r.onMetin, bloklar: r.bloklar, suzgec: suzgecTemizle(g.suzgec), segmentId: typeof g.segmentId === "string" ? g.segmentId : undefined, durum: "taslak", baglantilar: [], alicilar: [], denemeler: [], olusturma: Date.now(), guncelleme: Date.now(), model: r.model }; v.kampanyalar.unshift(k); return k.id; });
        return tamam({ kampanyaId: sonuc, alternatifler: r.alternatifler, kredi: r.kredi });
      }
      case "deneme": {
        const k = kampanya(); if (!k) return hata("Kampanya bulunamadı.", 404);
        const kime = metin(g.kime, 200).trim();
        if (!epostaGecerli(kime)) return hata("Deneme adresi geçersiz.");
        if (!epostaDurumu().kurulu) return hata("E-posta servisi kurulu değil; deneme gönderilemez.", 424);
        const r = await denemeGonder(id, k, kime, koken, ek);
        await ekGuncelle(id, (v) => { const x = v.kampanyalar.find((y) => y.id === k.id); if (x) x.denemeler = [{ kime, zaman: Date.now(), ok: r.ok, hata: r.ok ? undefined : r.hata }, ...x.denemeler].slice(0, 10); });
        return r.ok ? tamam() : hata(r.hata, 502);
      }
      case "gonder": case "zamanla": {
        const k = kampanya(); if (!k) return hata("Kampanya bulunamadı.", 404);
        if (k.izinsizKat && g.izinBeyan !== true) return hata("İzni belirsiz kişileri katmak için ticari ileti onayı aldığını beyan etmelisin.");
        if (!epostaDurumu().kurulu) return hata("E-posta servisi kurulu değil.", 424);
        if (islem === "zamanla") {
          const z = Number(g.zaman);
          if (!Number.isFinite(z) || z < Date.now() + 60_000 || z > Date.now() + 90 * 864e5) return hata("Zaman en az 1 dakika, en çok 90 gün sonrası olmalı.");
          if (!ek.marka?.iletisim?.trim()) return hata("Marka kitinde gönderen bilgisi (işletme adı ve iletişim) yok; ticari iletide zorunlu.");
          const { sonuc } = await ekGuncelle(id, (v) => { const x = v.kampanyalar.find((y) => y.id === k.id); if (!x || x.durum !== "taslak") return "Kampanya taslak değil."; x.durum = "zamanlandi"; x.zaman = z; x.koken = koken; x.izinBeyan = x.izinsizKat ? Date.now() : undefined; return null; });
          if (sonuc) return hata(sonuc);
          zamanla(id, k.id, z);
          return tamam();
        }
        if (k.izinsizKat) await ekGuncelle(id, (v) => { const x = v.kampanyalar.find((y) => y.id === k.id); if (x) x.izinBeyan = Date.now(); });
        const r = await gonderimBaslat(id, k.id, koken);
        return r.ok ? tamam({ alici: r.alici }) : hata(r.hata);
      }
      case "iptal": {
        const { sonuc } = await ekGuncelle(id, (v) => { const x = v.kampanyalar.find((y) => y.id === g.kampanyaId); if (!x) return "Kampanya bulunamadı."; if (x.durum === "zamanlandi") { x.durum = "taslak"; x.zaman = undefined; } else if (x.durum === "gonderiliyor") { x.durum = "durdu"; x.gonderimBit = Date.now(); } else return "Bu kampanya durdurulamaz."; return null; });
        if (sonuc) return hata(sonuc);
        zamanla(id, String(g.kampanyaId), null);
        return tamam();
      }
      case "kopyala": {
        const k = kampanya(); if (!k) return hata("Kampanya bulunamadı.", 404);
        const { sonuc } = await ekGuncelle(id, (v) => { const y: Kampanya = { ...structuredClone(k), id: kimlikUret(), ad: `${k.ad} (kopya)`, durum: "taslak", alicilar: [], denemeler: [], baglantilar: [], zaman: undefined, gonderimBas: undefined, gonderimBit: undefined, hata: undefined, izinBeyan: undefined, olusturma: Date.now(), guncelleme: Date.now() }; v.kampanyalar.unshift(y); return y.id; });
        return tamam({ kampanyaId: sonuc });
      }
      case "rakip": {
        const adres = metin(g.adres, 500);
        if (!adres.trim()) return hata("Rakip adresini yaz.");
        if (ek.rakipler.length >= 12) return hata("En çok 12 rakip tutulur; birini sil.");
        const o = await rakipOku(adres);
        let analiz: Awaited<ReturnType<typeof rakipKarsilastir>>["analiz"] | undefined, model: string | undefined, uyari: string | undefined, kredi = 0;
        try { const r = await rakipKarsilastir(p, ek, o); analiz = r.analiz; model = r.model; kredi = r.kredi; }
        catch (e) { if (e instanceof ModelYok2) uyari = "Yapay zekâ modeli bağlı değil; yalnız siteden okunanlar gösteriliyor, karşılaştırma yazılmadı."; else if (e instanceof AnalizHatasi) uyari = e.message; else throw e; }
        const { metin: _m, adres: tam, ...okunan } = o; void _m;
        const host = new URL(tam).hostname.replace(/^www\./, "");
        await ekGuncelle(id, (v) => { v.rakipler = [{ id: kimlikUret(), adres: tam, ad: host, okunan, analiz, model, uyari, zaman: Date.now() }, ...v.rakipler.filter((x) => x.adres !== tam)].slice(0, 12); });
        return tamam({ kredi });
      }
      case "marka-cikar": return Response.json({ ok: true, marka: markaCikar(p) });
      case "marka-ses": { const r = await markaSesi(p, ek); return Response.json({ ok: true, ...r }); }
      case "anahtar-kelime": {
        const r = await anahtarKelimeler(p, ek, metin(g.tohum, 80));
        await ekGuncelle(id, (v) => { v.seo.kelimeler = r.kelimeler; v.seo.kelimeZaman = Date.now(); v.seo.model = r.model; });
        return tamam({ kredi: r.kredi });
      }
      case "rapor": {
        const r = await raporHesapla(p, ek);
        let kredi = 0, uyari: string | undefined;
        try { const y = await raporYorumu(p, ek, r); r.yorum = y.yorum; r.model = y.model; kredi = y.kredi; }
        catch (e) { if (e instanceof ModelYok2) uyari = "Model bağlı değil; rapor yalnız ölçülen sayılardan hazırlandı."; else if (e instanceof AnalizHatasi) uyari = e.message; else throw e; }
        await ekGuncelle(id, (v) => { v.raporlar = [r, ...v.raporlar].slice(0, 20); });
        return tamam({ raporId: r.id, kredi, uyari });
      }
      case "deney-baslat": {
        const d = ek.deneyler.find((x) => x.id === g.deneyId); if (!d) return hata("Deneme bulunamadı.", 404);
        const yd = yayinDosyalari(p);
        if (!yd) return hata("Site yayında değil; denemeyi başlatmak için önce yayınla.");
        if (!(d.varyant in yd)) return hata(`${d.varyant} yayındaki sürümde yok. ${d.varyant in p.dosyalar ? "Değişiklikleri yayınla." : "Önce B sürümünü yazdır."}`);
        if (!(d.sayfa in yd)) return hata(`${d.sayfa} yayındaki sürümde yok.`);
        if (ek.deneyler.some((x) => x.id !== d.id && x.durum === "calisiyor" && (x.sayfa === d.sayfa || x.varyant === d.sayfa || x.sayfa === d.varyant))) return hata("Bu sayfada başka bir deneme çalışıyor.");
        await ekGuncelle(id, (v) => { const x = v.deneyler.find((y) => y.id === d.id)!; x.durum = "calisiyor"; x.baslangic ??= Date.now(); x.bitis = undefined; x.kazanan = undefined; canliYenile(p, v); });
        return tamam();
      }
      case "deney-durdur": case "deney-bitir": {
        await ekGuncelle(id, (v) => { const x = v.deneyler.find((y) => y.id === g.deneyId); if (!x) return; x.durum = islem === "deney-bitir" ? "bitti" : "durdu"; x.bitis = Date.now(); if (g.kazanan === "a" || g.kazanan === "b") x.kazanan = g.kazanan; canliYenile(p, v); });
        return tamam();
      }
      case "kisi-ekle": {
        const l = (Array.isArray(g.kisiler) ? g.kisiler : []).slice(0, 5000) as Record<string, unknown>[];
        const izinKaynak = metin(g.izinKaynak, 200).trim();
        const etiket = etiketTemizle(g.etiketler);
        let eklenen = 0, atlanan = 0;
        await ekGuncelle(id, (v) => {
          for (const x of l) {
            const e = metin(x.eposta, 200).trim(), tel = metin(x.telefon, 30).trim();
            const a = kisiAnahtari(e, tel);
            if (!a) { atlanan++; continue; }
            const m = (v.kisiMeta[a] ??= { etiketler: [] });
            m.elle = true; m.eklenme ??= Date.now();
            if (metin(x.ad, 80).trim()) m.ad = metin(x.ad, 80).trim();
            if (tel) m.telefon = tel;
            m.etiketler = [...new Set([...m.etiketler, ...etiket])].slice(0, 20);
            if (izinKaynak && m.izin !== "ret" && !v.cikanlar[a]) { m.izin = "onay"; m.izinKaynak = izinKaynak; m.izinZaman = Date.now(); }
            eklenen++;
          }
        });
        return tamam({ eklenen, atlanan });
      }
      default: return (await v5Islem(islem, g, { p, id, sahip: s.sahip, koken, ek, tamam, hata })) ?? hata("Bilinmeyen işlem.");
    }
  } catch (e) {
    if (e instanceof ModelYok2) return Response.json({ ok: false, modelYok: true, hata: e.message }, { status: 424 });
    if (e instanceof AnalizHatasi) return hata(e.message, 502);
    return hata(e instanceof Error ? `İşlem yarıda kaldı: ${e.message.slice(0, 160)}` : "İşlem yarıda kaldı.", 500);
  }
}
