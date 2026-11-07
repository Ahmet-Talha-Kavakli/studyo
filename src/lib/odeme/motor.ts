import "server-only";
import { timingSafeEqual } from "crypto";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { hesapGuncelle, hesapOku, kilitle, type HesapKaydi } from "@/lib/hesap/depo";
import { ayEkle, defterPlanDurumu, krediEkle, krediHarca, krediOzeti, planAyarla } from "@/lib/hesap/kredi";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import { iyzicoAyar, saglayiciModu, saglayiciSec, stripeAyar, type StripeAyar } from "./ayar";
import {
  aktifAbonelik, dizinOku, dizinYaz, kayitGuncelle, kayitOku, makbuzNoAl, siparisGuncelle, siparisNoUret, siparisOku, siparisYaz,
  type Abonelik, type OdemeKaydi, type Siparis,
} from "./depo";
import { faturaTamam } from "./fatura";
import { OdemeHatasi } from "./hata";
import * as IY from "./iyzico";
import { DAVET_ORANI, HIZ_GUN, PLAN_AD, PLAN_SIRA, planAdi, planDonemTutari, tutarHesapla, urunCoz, type Urun } from "./katalog";
import * as ST from "./stripe";
import { alanKrediUygula, alanPlanUygula } from "@/lib/alan/odeme";
import type {
  AbonelikOzeti, Donem, FiyatSatiri, HaklarYaniti, OdemeIstegi, OdemeModu, OnizlemeYaniti, Para, PlanAmaci, SaglayiciKimligi, SiparisDurum, SiparisOzeti,
} from "./tipler";

/**
 * Vayra satış motoru. Akış:
 *  1. teklifHazirla: ürün katalogdan sunucuda fiyatlanır; abonelik varsa yükseltme farkı (kalan süre) ya da dönem sonu
 *     geçişi hesaplanır; davet indirimi ilk plan ödemesine uygulanır.
 *  2. odemeBaslat: sipariş "bekliyor" yazılır, sağlayıcının barındırılan ödeme sayfası açılır (kart Vayra'ya gelmez).
 *  3. Dönüş ya da bildirim: sonuç sağlayıcıdan sunucuya sorgulanır, tutar ve para birimi siparişle karşılaştırılır,
 *     sonucIsle durumu tek yönlü değiştirir (bekliyor → ödendi | başarısız; başarısız → ödendi; ödendi → iade).
 *  4. hakUygula: ödenen siparişin hakkı bir kez işlenir (kredi defterinde işlem anahtarı odeme:<no>; sipariş islendi).
 *
 * Abonelik:
 *  - Stripe: Stripe Billing aboneliği; yenileme, ödenemedi ve iptal webhook'larla gelir. Yükseltme hemen olur, Stripe kalan
 *    süreyi saniyesine kadar düşer (proration, billing_cycle_anchor=now). Düşürme ve dönem değişikliği abonelik takvimiyle
 *    (subscription schedule) dönem sonunda geçerli olur.
 *  - iyzico: dönemlik tek ödeme ve hatırlatmalı yenileme. Gerekçe: iyzico Abonelik ürünü üye işyerinde ayrıca açtırılmalı,
 *    ürün ve fiyat planlarının iyzico panelinde tanımlanmasını ister ve Ultra kademeleri ile kalan süre farkı gibi değişken
 *    tutarları desteklemez. Ödeme Formu her iyzico hesabında çalışır, kart saklanmaz; dönem bitmeden 7 ve 1 gün önce e-posta
 *    ile hatırlatılır, ödenmezse plan dönem sonunda Başlangıç'a döner, kalan satın alınmış kredi silinmez.
 */

const GUN = 864e5;
const YENILEME_PENCERESI = 7 * GUN;
const donemAy = (d?: Donem) => (d === "yillik" ? 12 : 1);
/** Defterle aynı takvim: aylar tek tek eklenir (31'inde başlayan dönem defterle kaymasın). */
export function donemSonu(bas: number, d?: Donem) { let t = bas; for (let i = 0; i < donemAy(d); i++) t = ayEkle(t); return t; }
const tarihYaz = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
const esit = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export interface Baglam { uid: string; hesap: HesapKaydi; ip: string; koken: string }

const aktifMi = (a?: Abonelik): a is Abonelik => !!a && (a.durum === "etkin" || a.durum === "iptal") && a.donemBitis > Date.now();
export const yenilenebilir = (a?: Abonelik) => aktifMi(a) && a.saglayici !== "stripe" && a.donemBitis - Date.now() <= YENILEME_PENCERESI;

/* ═════════════ 1. Teklif ═════════════ */

interface Teklif {
  u: Urun;
  amac?: PlanAmaci;
  indirimler: FiyatSatiri[];
  net: number; kdv: number; toplam: number;
  zamanlama: "hemen" | "donem-sonu";
  saglayici: SaglayiciKimligi | null;
  mod: OdemeModu | null;
  notlar: string[];
  davet: boolean;
  mevcut?: Abonelik;
  faturaEksik: boolean;
}

function kalanDeger(a: Abonelik): { tutar: number; gun: number } {
  const d = a.deger ?? { net: a.sonOdeme?.net ?? 0, bas: a.donemBaslangic, bit: a.donemBitis };
  const sure = Math.max(1, d.bit - d.bas), kalan = Math.max(0, d.bit - Date.now());
  return { tutar: Math.round(d.net * Math.min(1, kalan / sure)), gun: Math.ceil(kalan / GUN) };
}
const sira = (p: PlanKimligi, k: number) => PLAN_SIRA[p] * 1_000_000 + k;

export function teklifHazirla(b: Baglam, i: OdemeIstegi, kayit: OdemeKaydi): Teklif {
  // Alan için satın alma: kişisel abonelik ve davet indirimi devreye girmez; alan planı dönemlik tek ödemedir.
  if (i.alan) {
    if (i.tur !== "plan" && i.tur !== "kredi") throw new OdemeHatasi("Çalışma alanı için yalnız plan ve kredi paketi satın alınır.", 400, "urun");
    kayit = { ...kayit, abonelik: undefined };
  }
  const a = aktifMi(kayit.abonelik) ? kayit.abonelik : undefined;
  // Süren abonelikte para birimi ve sağlayıcı değişmez.
  const para: Para = i.tur === "plan" && a ? a.para : i.para === "USD" ? "USD" : "TRY";
  const u = urunCoz({ ...i, para });
  if (typeof u === "string") throw new OdemeHatasi(u, 400, "urun");
  const notlar: string[] = [];
  const indirimler: FiyatSatiri[] = [];
  let amac: PlanAmaci | undefined;
  let zamanlama: Teklif["zamanlama"] = "hemen";
  let davet = false;
  let saglayici: SaglayiciKimligi | null = saglayiciSec(para);

  if (u.tur === "plan") {
    if (a) {
      saglayici = a.saglayici === "iyzico" ? (iyzicoAyar() ? "iyzico" : null) : a.saglayici === "stripe" ? (stripeAyar() ? "stripe" : null) : saglayiciSec(para) === "deneme" ? "deneme" : null;
      const ayni = a.plan === u.plan && a.kota === u.kota;
      // Planlanmış düşürme varsa yenileme o planla yapılır.
      const sonrakiyle = !!a.sonraki && !a.sonraki.odendi && a.saglayici !== "stripe" && a.sonraki.plan === u.plan && a.sonraki.kota === u.kota && a.sonraki.donem === u.donem;
      if ((ayni && a.donem === u.donem) || sonrakiyle) {
        if (yenilenebilir(a)) amac = "yenileme";
        else throw new OdemeHatasi(a.saglayici === "stripe" ? "Zaten bu plandasın; Stripe aboneliğin kendiliğinden yenilenir." : `Zaten bu plandasın. Yenileme ${tarihYaz(a.donemBitis - YENILEME_PENCERESI)} tarihinde açılır.`, 409, "ayni");
      } else {
        const yukari = (sira(u.plan!, u.kota!) > sira(a.plan, a.kota) && !(a.donem === "yillik" && u.donem === "aylik")) || (ayni && a.donem === "aylik" && u.donem === "yillik");
        if (yukari) {
          amac = "yukseltme";
          const k = kalanDeger(a);
          if (k.tutar > 0) indirimler.push({ ad: `${PLAN_AD[a.plan]} planından kalan ${k.gun} gün`, tutar: Math.min(k.tutar, Math.max(0, u.liste - 100)) });
          notlar.push("Yeni plan hemen başlar ve yeni dönem bugün açılır. Eski planından kalan sürenin değeri bu ödemeden düşüldü.");
          if (a.saglayici === "stripe") notlar.push("Stripe kalan süre farkını saniyesine kadar hesaplar; kesin tutar makbuzda yazar.");
        } else {
          zamanlama = "donem-sonu";
          notlar.push(`Değişiklik ${tarihYaz(a.donemBitis)} tarihinde, bu dönem bitince geçerli olur. O güne kadar ${PLAN_AD[a.plan]} planın açık kalır; şimdi ödeme alınmaz.`);
        }
      }
    } else {
      amac = "yeni";
      if (!i.alan && b.hesap.profil.davetIndirimi === "bekliyor" && !kayit.davetKullanildi) {
        davet = true;
        indirimler.push({ ad: `Davet indirimi, yüzde ${Math.round(DAVET_ORANI * 100)}, ilk ödeme`, tutar: Math.round(u.liste * DAVET_ORANI) });
      }
    }
    if (i.alan) notlar.push(`Plan çalışma alanı için alınır ve ${u.donem === "yillik" ? "12 ay" : "bir ay"} geçerlidir. Kendiliğinden yenilenmez; dönem bitince alan ücretsiz plana döner, havuzdaki satın alınmış kredi kalır. Alanın süren bir planı varsa yeni dönem bugün başlar.`);
    else if (zamanlama === "hemen") {
      if (saglayici === "stripe") notlar.push("Abonelik her dönem kendiliğinden yenilenir. İstediğin an iptal edersin; dönem sonuna kadar plan açık kalır.");
      else if (saglayici) notlar.push(`Plan ${u.donem === "yillik" ? "12 ay" : "bir ay"} için ödenir. Dönem bitmeden 7 gün önce hatırlatılır; kart bilgin saklanmaz, kendiliğinden çekim yapılmaz.`);
    }
  }
  const mod = saglayici ? saglayiciModu(saglayici) : null;
  if (saglayici === "deneme") notlar.unshift("Bu sunucuda ödeme sağlayıcısı bağlı değil. Bu bir deneme ödemesidir: kart istenmez, para çekilmez.");
  else if (mod === "test") notlar.unshift("Sağlayıcı test modunda: gerçek para çekilmez, yalnız test kartları çalışır.");
  if (para === "USD") notlar.push("Yurt dışı satışta KDV uygulanmaz.");
  if (saglayici === "iyzico" && para === "TRY") notlar.push("Kartına göre 2, 3, 6, 9 ya da 12 taksit seçebilirsin; vade farkını banka belirler.");
  const t = tutarHesapla(u.liste, indirimler, u.kdvOrani);
  // Türk lirası satışta (e-Arşiv) ve iyzico ile her ödemede (alıcı adresi zorunlu) fatura bilgisi gerekir.
  const faturaEksik = zamanlama === "hemen" && (para === "TRY" || saglayici === "iyzico") && !faturaTamam(kayit.fatura);
  return { u, amac, indirimler, ...t, zamanlama, saglayici, mod, notlar, davet, mevcut: a, faturaEksik };
}

export function onizlemeYaniti(t: Teklif): OnizlemeYaniti {
  return {
    ok: true, ad: t.u.ad, aciklama: t.u.aciklama, para: t.u.para, liste: t.u.liste, indirimler: t.indirimler, net: t.net, kdv: t.kdv, kdvOrani: t.u.kdvOrani, toplam: t.toplam,
    zamanlama: t.zamanlama, amac: t.amac, yenileme: t.u.tur !== "plan" ? undefined : t.saglayici === "stripe" ? "otomatik" : "hatirlatma",
    saglayici: t.saglayici, mod: t.mod, paralar: t.mevcut && t.u.tur === "plan" ? [t.mevcut.para] : (["TRY", "USD"] as Para[]).filter((p) => !!saglayiciSec(p)),
    taksit: t.saglayici === "iyzico" && t.u.para === "TRY", faturaEksik: t.faturaEksik, notlar: t.notlar, ...(t.zamanlama === "donem-sonu" ? { odemesiz: true } : {}),
  };
}

/* ═════════════ 2. Başlatma ═════════════ */

function aliciKur(b: Baglam, s: Siparis): IY.IyzicoAlici {
  const f = s.fatura!;
  const adParca = (f.tip === "bireysel" ? f.adSoyad : b.hesap.profil.ad || f.unvan).split(" ").filter(Boolean);
  const soyad = adParca.length > 1 ? adParca.pop()! : "Vayra";
  return {
    id: b.uid, ad: adParca.join(" ") || "Vayra", soyad, eposta: (f.eposta || b.hesap.email).slice(0, 120), kimlikNo: f.tip === "bireysel" && f.tckn ? f.tckn : "11111111111",
    ...(f.telefon && /^\+\d{10,15}$/.test(f.telefon) ? { telefon: f.telefon } : {}), adres: [f.adres, f.ilce].filter(Boolean).join(", "), il: f.il, ulke: f.ulke === "Türkiye" || !f.ulke ? "Turkey" : f.ulke,
    ...(f.postaKodu ? { postaKodu: f.postaKodu } : {}), ip: b.ip === "yerel" ? "127.0.0.1" : b.ip, faturaAdi: f.tip === "kurumsal" ? f.unvan : f.adSoyad,
  };
}

export type BaslatSonucu = { no: string; adres: string } | { planlandi: true; mesaj: string };

export async function odemeBaslat(b: Baglam, i: OdemeIstegi): Promise<BaslatSonucu> {
  const kayit = await kayitOku(b.uid);
  const t = teklifHazirla(b, i, kayit);
  if (!t.saglayici) throw new OdemeHatasi("Ödeme altyapısı henüz bağlanmadı. Satın alma şu an yapılamıyor; ödeme alınmadı.", 503, "altyapi");
  if (t.zamanlama === "donem-sonu") return { planlandi: true, mesaj: await donemSonuPlanla(b.uid, t) };
  if (t.faturaEksik) throw new OdemeHatasi("Ödemeden önce fatura bilgilerini tamamla: ad soyad ya da unvan, adres ve il.", 400, "fatura");

  const simdi = Date.now();
  const s: Siparis = {
    no: siparisNoUret(), uid: b.uid, tur: t.u.tur, urun: t.u.urun, ...(i.alan ? { alan: i.alan } : {}),
    ad: t.amac === "yukseltme" ? `${t.u.ad}, yükseltme` : t.amac === "yenileme" ? `${t.u.ad}, yenileme` : t.u.ad, aciklama: t.u.aciklama,
    ...(t.u.donem ? { donem: t.u.donem } : {}), para: t.u.para, liste: t.u.liste, indirimler: t.indirimler, net: t.net, kdvOrani: t.u.kdvOrani, kdv: t.kdv, toplam: t.toplam,
    saglayici: t.saglayici, mod: t.mod ?? "test", durum: "bekliyor", ...(t.amac ? { amac: t.amac } : {}),
    hedef: { kredi: t.u.kredi, plan: t.u.plan, kota: t.u.kota, model: t.u.model, kalite: t.u.kalite, gun: t.u.gun, hiz: t.u.hiz, ekEsZamanli: t.u.ekEsZamanli, ...(t.davet ? { davet: true } : {}) },
    olusturma: simdi, guncelleme: simdi, ...(kayit.fatura ? { fatura: kayit.fatura } : {}), ip: b.ip,
    donus: i.alan ? "/panel/ayarlar/alan/kredi" : t.u.tur === "plan" ? "/panel/ayarlar/abonelik" : t.u.tur === "kredi" ? "/panel/kredi?sekme=kredi" : t.u.tur === "sinirsiz" ? "/panel/kredi?sekme=sinirsiz" : "/panel/kredi?sekme=hiz",
    olaylar: [{ z: simdi, olay: "Sipariş oluşturuldu", ayrinti: `${t.saglayici}, ${t.mod}` }],
  };
  if (s.toplam < 100) throw new OdemeHatasi("Ödeme tutarı en az 1 birim olmalı.", 400, "tutar");
  await siparisYaz(s);
  await kayitGuncelle(b.uid, (k) => { k.siparisler = [s.no, ...k.siparisler.filter((x) => x !== s.no)]; });

  try {
    if (s.saglayici === "deneme") return { no: s.no, adres: `/odeme/deneme/${s.no}` };
    if (s.saglayici === "iyzico") {
      const a = iyzicoAyar()!;
      const r = await IY.formBaslat(a, {
        siparisNo: s.no, tutar: s.toplam, para: s.para, kalemAdi: s.ad, kategori: s.tur === "plan" ? "Abonelik" : "Dijital hizmet",
        donusAdresi: `${b.koken}/api/odeme/donus/iyzico?s=${s.no}`, taksit: true, alici: aliciKur(b, s),
      });
      await siparisGuncelle(s.no, (x) => { x.token = r.token; x.olaylar.push({ z: Date.now(), olay: "iyzico ödeme formu açıldı" }); });
      return { no: s.no, adres: r.adres };
    }
    const a = stripeAyar()!;
    if (s.tur === "plan" && !s.alan && s.amac === "yukseltme" && t.mevcut?.stripe) {
      await stripeYukselt(a, s, t.mevcut);
      return { no: s.no, adres: `/odeme/sonuc?s=${s.no}` };
    }
    const oturum = await stripeOturumAc(a, b, s, kayit, t);
    await siparisGuncelle(s.no, (x) => { x.oturum = oturum.id; x.olaylar.push({ z: Date.now(), olay: "Stripe ödeme sayfası açıldı" }); });
    await dizinYaz("stripe-oturum", oturum.id, s.no);
    return { no: s.no, adres: oturum.url };
  } catch (e) {
    const m = (e as Error).message;
    await sonucIsle(s.no, { durum: "basarisiz", olay: "Ödeme başlatılamadı", ayrinti: m, alanlar: { hata: m.replace(/^(iyzico|Stripe): /, "") } }).catch(() => {});
    throw e;
  }
}

async function stripeOturumAc(a: StripeAyar, b: Baglam, s: Siparis, kayit: OdemeKaydi, t: Teklif): Promise<{ id: string; url: string }> {
  const f = new URLSearchParams();
  const kok = `${b.koken}/api/odeme/donus/stripe?s=${s.no}`;
  f.set("success_url", `${kok}&session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${kok}&iptal=1`);
  f.set("client_reference_id", s.no);
  f.set("locale", "tr");
  f.set("expires_at", String(Math.floor(Date.now() / 1000) + 3600));
  f.set("metadata[no]", s.no); f.set("metadata[uid]", s.uid);
  if (kayit.stripeMusteri) f.set("customer", kayit.stripeMusteri);
  else f.set("customer_email", (s.fatura?.eposta || b.hesap.email).slice(0, 200));
  const para = s.para.toLowerCase();
  if (s.tur === "plan" && !s.alan) {
    // Eski, ödenemedi durumundaki Stripe aboneliği yenisiyle çift ücret almasın.
    const eski = kayit.abonelik;
    if (eski?.stripe && eski.durum === "odenemedi") await ST.stripeIstek(a, "DELETE", `/v1/subscriptions/${eski.stripe.abonelik}`).catch(() => {});
    const urun = await ST.urunKimligi(a, `plan_${s.urun}`, planAdi(s.hedef.plan!, s.hedef.kota!));
    const tamTutar = s.liste + Math.round(s.liste * s.kdvOrani);
    f.set("mode", "subscription");
    f.set("line_items[0][price_data][currency]", para);
    f.set("line_items[0][price_data][product]", urun);
    f.set("line_items[0][price_data][unit_amount]", String(tamTutar));
    f.set("line_items[0][price_data][recurring][interval]", s.donem === "yillik" ? "year" : "month");
    f.set("line_items[0][quantity]", "1");
    for (const [k, v] of Object.entries({ no: s.no, uid: s.uid, plan: s.hedef.plan!, kota: String(s.hedef.kota), donem: s.donem ?? "aylik" })) f.set(`subscription_data[metadata][${k}]`, v);
    if (t.davet) f.set("discounts[0][coupon]", await ST.davetKuponu(a, DAVET_ORANI));
  } else {
    f.set("mode", "payment");
    f.set("line_items[0][price_data][currency]", para);
    f.set("line_items[0][price_data][product_data][name]", s.ad.slice(0, 120));
    f.set("line_items[0][price_data][unit_amount]", String(s.toplam));
    f.set("line_items[0][quantity]", "1");
    f.set("payment_intent_data[metadata][no]", s.no);
    if (!kayit.stripeMusteri) f.set("customer_creation", "always");
  }
  const j = await ST.stripeIstek(a, "POST", "/v1/checkout/sessions", f, `oturum-${s.no}`);
  if (typeof j.id !== "string" || typeof j.url !== "string") throw new OdemeHatasi("Stripe ödeme sayfası adresi dönmedi.", 502);
  return { id: j.id, url: j.url };
}

/** Stripe aboneliğini hemen yükseltir: kalan süre düşülür, fark aynı anda tahsil edilir; ödeme alınamazsa hiçbir şey değişmez. */
async function stripeYukselt(a: StripeAyar, s: Siparis, ab: Abonelik) {
  const st = ab.stripe!;
  const sub = await ST.stripeIstek(a, "GET", `/v1/subscriptions/${st.abonelik}`);
  if (sub.schedule) await ST.stripeIstek(a, "POST", `/v1/subscription_schedules/${ST.kimlikAl(sub.schedule)}/release`).catch(() => {});
  const urun = await ST.urunKimligi(a, `plan_${s.urun}`, planAdi(s.hedef.plan!, s.hedef.kota!));
  const f = new URLSearchParams({
    "items[0][id]": st.oge ?? ST.abonelikOgesi(sub) ?? "", "items[0][price_data][currency]": s.para.toLowerCase(), "items[0][price_data][product]": urun,
    "items[0][price_data][unit_amount]": String(s.liste + Math.round(s.liste * s.kdvOrani)), "items[0][price_data][recurring][interval]": s.donem === "yillik" ? "year" : "month",
    proration_behavior: "always_invoice", billing_cycle_anchor: "now", payment_behavior: "error_if_incomplete", cancel_at_period_end: "false",
    "metadata[no]": s.no, "metadata[plan]": s.hedef.plan!, "metadata[kota]": String(s.hedef.kota), "metadata[donem]": s.donem ?? "aylik", "expand[]": "latest_invoice",
  });
  await siparisGuncelle(s.no, (x) => { x.abonelik = st.abonelik; });
  let yeni: Record<string, unknown>;
  try { yeni = await ST.stripeIstek(a, "POST", `/v1/subscriptions/${st.abonelik}`, f, `yukselt-${s.no}`); }
  catch (e) {
    const m = (e as OdemeHatasi).durum === 402 ? "Kart ödemeyi onaylamadı; plan değişmedi." : (e as Error).message;
    await sonucIsle(s.no, { durum: "basarisiz", olay: "Stripe yükseltme ödemesi alınamadı", ayrinti: (e as Error).message, alanlar: { hata: m } });
    return;
  }
  const inv = (yeni.latest_invoice ?? {}) as Record<string, unknown>;
  if (inv.status !== "paid") { await sonucIsle(s.no, { durum: "basarisiz", olay: "Stripe yükseltme faturası ödenmedi", ayrinti: String(inv.status ?? ""), alanlar: { hata: "Ödeme tamamlanmadı" } }); return; }
  if (String(inv.currency ?? "").toUpperCase() !== s.para) { await sonucIsle(s.no, { durum: "bekliyor", olay: "Stripe faturasının para birimi uyuşmuyor" }); return; }
  if (inv.id) await dizinYaz("stripe-fatura", String(inv.id), s.no);
  await sonucIsle(s.no, { durum: "odendi", olay: "Stripe yükseltme ödemesi alındı", ayrinti: String(inv.id ?? ""), alanlar: { saglayiciKimligi: String(inv.id ?? ""), tahsil: Number(inv.amount_paid) || s.toplam } });
}

/* ═════════════ 3. Sonuç ═════════════ */

type Sonuc = { durum: SiparisDurum; olay: string; ayrinti?: string; alanlar?: Partial<Siparis> };
const gecisIzni = (eski: SiparisDurum, yeni: SiparisDurum) =>
  eski !== yeni && (yeni === "odendi" ? eski === "bekliyor" || eski === "basarisiz" : yeni === "basarisiz" ? eski === "bekliyor" : yeni === "iade" ? eski === "odendi" : false);

/** Doğrulanmış sonucu siparişe yazar; ödendiyse hakkı bir kez uygular. Aynı sonucun tekrarı bir şey değiştirmez. */
export async function sonucIsle(no: string, r: Sonuc): Promise<Siparis> {
  const x = await siparisGuncelle(no, (s) => {
    const izin = gecisIzni(s.durum, r.durum);
    s.olaylar.push({ z: Date.now(), olay: r.olay, ...(r.ayrinti ? { ayrinti: r.ayrinti.slice(0, 300) } : {}) });
    if (izin) {
      Object.assign(s, r.alanlar ?? {});
      s.durum = r.durum;
      if (r.durum === "odendi") { s.odemeZamani = Date.now(); delete s.hata; }
    }
    return izin;
  });
  if (!x) throw new OdemeHatasi("Sipariş bulunamadı.", 404);
  if (x.s.durum === "odendi" && !x.s.islendi) await hakUygula(no);
  return (await siparisOku(no))!;
}

/** iyzico dönüşü ya da bildirimi: sonuç belirteçle iyzico'dan çekilir. */
export async function iyzicoSonucIsle(no: string, token: string, kaynak: string): Promise<Siparis> {
  const s = await siparisOku(no);
  if (!s || s.saglayici !== "iyzico") throw new OdemeHatasi("Sipariş bulunamadı.", 404);
  if (!token || !s.token || !esit(token, s.token)) throw new OdemeHatasi("Ödeme belirteci siparişle eşleşmedi.", 400);
  if (s.durum === "odendi" || s.durum === "iade") return s.islendi ? s : sonucIsle(no, { durum: s.durum, olay: `${kaynak}: tekrar` });
  const a = iyzicoAyar();
  if (!a) throw new OdemeHatasi("iyzico ayarları bu sunucuda yok.", 503);
  let r: IY.IyzicoSonuc;
  try { r = await IY.formSonucu(a, { siparisNo: no, token, tutar: s.toplam, para: s.para }); }
  catch (e) { await siparisGuncelle(no, (x) => { x.olaylar.push({ z: Date.now(), olay: `${kaynak}: iyzico sorgulanamadı`, ayrinti: (e as Error).message }); }); return (await siparisOku(no))!; }
  if (r.durum === "odendi") return sonucIsle(no, { durum: "odendi", olay: `${kaynak}: iyzico ödemeyi onayladı`, ayrinti: `paymentId ${r.odemeKimligi}`, alanlar: { saglayiciKimligi: r.odemeKimligi, tahsil: r.tahsil, taksit: r.taksit, ...(r.kart ? { kart: r.kart } : {}) } });
  if (r.durum === "basarisiz") return sonucIsle(no, { durum: "basarisiz", olay: `${kaynak}: iyzico ödemesi başarısız`, ayrinti: r.hata, alanlar: { hata: r.hata } });
  return sonucIsle(no, { durum: "bekliyor", olay: `${kaynak}: ${r.neden}` });
}

/** Stripe Checkout oturumundan sonuç (webhook ya da dönüşte sunucudan çekilen oturum). */
export async function stripeOturumIsle(no: string, oturumKimligi: string, kaynak: string): Promise<Siparis> {
  const s = await siparisOku(no);
  if (!s || s.saglayici !== "stripe") throw new OdemeHatasi("Sipariş bulunamadı.", 404);
  if (!/^cs_[A-Za-z0-9_]+$/.test(oturumKimligi) || (s.oturum && s.oturum !== oturumKimligi)) throw new OdemeHatasi("Stripe oturumu siparişle eşleşmedi.", 400);
  const a = stripeAyar();
  if (!a) throw new OdemeHatasi("Stripe ayarları bu sunucuda yok.", 503);
  const o = await ST.stripeIstek(a, "GET", `/v1/checkout/sessions/${oturumKimligi}`);
  if (String(o.client_reference_id ?? "") !== no) return sonucIsle(no, { durum: "bekliyor", olay: `${kaynak}: Stripe oturumu başka siparişe ait` });
  if (o.status === "expired") return sonucIsle(no, { durum: "basarisiz", olay: `${kaynak}: Stripe ödeme süresi doldu`, alanlar: { hata: "Ödeme süresi doldu" } });
  if (o.payment_status !== "paid") return sonucIsle(no, { durum: "bekliyor", olay: `${kaynak}: Stripe ödemesi ${o.status === "complete" ? "onay bekliyor" : "tamamlanmadı"}` });
  const tutar = Number(o.amount_total), para = String(o.currency ?? "").toUpperCase();
  // Davet kuponunda Stripe'ın yuvarlaması birkaç kuruş fark edebilir.
  const pay = s.hedef.davet ? 3 : 0;
  if (para !== s.para || Math.abs(tutar - s.toplam) > pay) return sonucIsle(no, { durum: "bekliyor", olay: `${kaynak}: Tutar uyuşmuyor`, ayrinti: `Stripe ${tutar} ${para}, sipariş ${s.toplam} ${s.para}`, alanlar: { hata: "Tutar uyuşmuyor; destekle iletişime geç" } });
  const pi = ST.kimlikAl(o.payment_intent), sub = ST.kimlikAl(o.subscription), musteri = ST.kimlikAl(o.customer), fatura = ST.kimlikAl(o.invoice);
  if (musteri) { await kayitGuncelle(s.uid, (k) => { k.stripeMusteri ??= musteri; }); await dizinYaz("stripe-musteri", musteri, s.uid); }
  if (pi) await dizinYaz("stripe-pi", pi, no);
  if (sub) await dizinYaz("stripe-abonelik", sub, s.uid);
  if (fatura) await dizinYaz("stripe-fatura", fatura, no);
  return sonucIsle(no, { durum: "odendi", olay: `${kaynak}: Stripe ödemesi onaylandı`, ayrinti: pi ?? fatura ?? oturumKimligi, alanlar: { saglayiciKimligi: pi ?? fatura ?? oturumKimligi, tahsil: tutar, ...(sub ? { abonelik: sub } : {}) } });
}

/** Bekleyen siparişi sağlayıcıdan yeniden sorgular (kullanıcı dönüşten önce sekmeyi kapattıysa). */
export async function siparisSorgula(no: string): Promise<Siparis | null> {
  const s = await siparisOku(no);
  if (!s) return null;
  if (s.durum === "odendi" && !s.islendi) { await hakUygula(no).catch(() => {}); return siparisOku(no); }
  if (s.durum !== "bekliyor") return s;
  try {
    if (s.saglayici === "iyzico" && s.token) return await iyzicoSonucIsle(no, s.token, "Sorgu");
    if (s.saglayici === "stripe" && s.oturum) return await stripeOturumIsle(no, s.oturum, "Sorgu");
  } catch { /* sağlayıcıya ulaşılamadı: bekliyor kalır */ }
  // İki saattir ödeme sayfası açılmadıysa ya da sağlayıcı yanıt vermiyorsa sipariş kapanır.
  if (Date.now() - s.olusturma > 2 * 3_600_000 && (s.saglayici === "deneme" || (!s.token && !s.oturum))) return sonucIsle(no, { durum: "basarisiz", olay: "Süresi doldu", alanlar: { hata: "Ödeme süresi doldu" } });
  return siparisOku(no);
}

/* ═════════════ 4. Hak uygulama ═════════════ */

async function hakUygula(no: string) {
  await kilitle(`hak:${no}`, async () => {
    const s = await siparisOku(no);
    if (!s || s.durum !== "odendi" || s.islendi) return;
    const anahtar = `odeme:${no}`;
    if (s.alan && s.tur === "kredi") {
      await alanKrediUygula(s.alan, { kredi: s.hedef.kredi!, no, ad: s.ad, uid: s.uid });
    } else if (s.alan && s.tur === "plan") {
      await alanPlanUygula(s.alan, { plan: s.hedef.plan!, kota: s.hedef.kota!, donem: s.donem ?? "aylik", no, ad: s.ad, uid: s.uid });
    } else if (s.tur === "kredi") {
      const r = await krediEkle(s.uid, s.hedef.kredi!, { kaynak: anahtar, aciklama: s.ad, anahtar });
      if (!r.ok) throw new Error(`Kredi eklenemedi: ${r.neden}`);
    } else if (s.tur === "sinirsiz") {
      await kayitGuncelle(s.uid, (k) => {
        if (k.sinirsiz.some((x) => x.no === no)) return;
        const simdi = Date.now();
        const mevcut = k.sinirsiz.find((x) => x.model === s.hedef.model && x.bitis > simdi);
        const bitis = (mevcut ? mevcut.bitis : simdi) + (s.hedef.gun ?? 1) * GUN;
        k.sinirsiz = [...k.sinirsiz.filter((x) => x.model !== s.hedef.model && x.bitis > simdi - 30 * GUN), { model: s.hedef.model!, kalite: s.hedef.kalite!, bitis, no }];
      });
    } else if (s.tur === "hiz") {
      await kayitGuncelle(s.uid, (k) => {
        if (k.hiz?.no === no) return;
        const simdi = Date.now();
        const ayni = k.hiz && k.hiz.bitis > simdi && k.hiz.seviye === s.hedef.hiz && k.hiz.ekEsZamanli === s.hedef.ekEsZamanli;
        k.hiz = { seviye: s.hedef.hiz!, ekEsZamanli: s.hedef.ekEsZamanli ?? 0, bitis: (ayni ? k.hiz!.bitis : simdi) + HIZ_GUN * GUN, no };
      });
    } else if (s.tur === "plan") {
      await planUygula(s);
    }
    const makbuzNo = s.makbuzNo ?? (await makbuzNoAl());
    await siparisGuncelle(no, (x) => { x.islendi = true; x.makbuzNo = makbuzNo; x.olaylar.push({ z: Date.now(), olay: "Hak hesaba işlendi", ayrinti: makbuzNo }); });
    if (s.hedef.davet) {
      await kayitGuncelle(s.uid, (k) => { k.davetKullanildi ??= Date.now(); });
      await hesapGuncelle(s.uid, (h) => { if (h.profil.davetEden) h.profil.davetIndirimi = "kullanildi"; });
    }
    await makbuzGonder({ ...s, makbuzNo }).catch(() => {});
  });
}

async function planEsitle(uid: string, plan: PlanKimligi) {
  await hesapGuncelle(uid, (h) => { h.plan = plan; });
}

/** Ödenen plan siparişini aboneliğe ve kredi defterine işler. */
async function planUygula(s: Siparis) {
  const plan = s.hedef.plan!, kota = s.hedef.kota!, donem: Donem = s.donem ?? "aylik";
  const anahtar = `odeme:${s.no}`;
  const kaynak = anahtar;
  const kayit = await kayitOku(s.uid);
  const once = kayit.abonelik;
  if (s.saglayici === "stripe") {
    const a = stripeAyar();
    if (!a || !s.abonelik) throw new Error("Stripe aboneliği bulunamadı.");
    const sub = await ST.stripeIstek(a, "GET", `/v1/subscriptions/${s.abonelik}`);
    const { bas, bit } = ST.abonelikDonemi(sub);
    await planAyarla(s.uid, { plan, kota, yeniDonem: true, planBitis: bit, otomatik: !sub.cancel_at_period_end, gecis: null, ...(donem === "aylik" ? { donemBitis: bit } : {}), kaynak, aciklama: `${planAdi(plan, kota)} başladı`, anahtar });
    const musteri = ST.kimlikAl(sub.customer) ?? kayit.stripeMusteri ?? "";
    await kayitGuncelle(s.uid, (k) => {
      if (k.abonelik && k.abonelik.stripe?.abonelik !== sub.id) k.gecmis = [{ ...k.abonelik, durum: "bitti" }, ...(k.gecmis ?? [])];
      const ayni = k.abonelik?.stripe?.abonelik === sub.id;
      k.abonelik = {
        saglayici: "stripe", mod: s.mod, plan, kota, donem, para: s.para, durum: sub.cancel_at_period_end ? "iptal" : "etkin", baslangic: ayni ? k.abonelik!.baslangic : Date.now(),
        donemBaslangic: bas, donemBitis: bit, otomatik: true, deger: { net: s.net, bas, bit }, sonOdeme: { no: s.no, net: s.net, toplam: s.tahsil ?? s.toplam, zaman: Date.now() },
        stripe: { abonelik: String(sub.id), oge: ST.abonelikOgesi(sub) ?? undefined, musteri, urun: ST.ogeUrunu(sub) ?? undefined },
      };
      if (musteri) k.stripeMusteri ??= musteri;
    });
    await dizinYaz("stripe-abonelik", String(sub.id), s.uid);
    await planEsitle(s.uid, plan);
    return;
  }
  // iyzico ve deneme: dönemlik ödeme.
  if (s.amac === "yenileme" && aktifMi(once)) {
    const bas = once.donemBitis, bit = donemSonu(bas, donem);
    const degisti = plan !== once.plan || kota !== once.kota || donem !== once.donem;
    await planAyarla(s.uid, {
      plan: once.plan, yeniDonem: false, otomatik: false, kaynak, anahtar,
      ...(degisti ? { gecis: { zaman: once.donemBitis, plan, kota, bitis: bit } } : { planBitis: bit, gecis: null }),
    });
    await kayitGuncelle(s.uid, (k) => {
      const a = k.abonelik!;
      const d = a.deger ?? { net: a.sonOdeme?.net ?? 0, bas: a.donemBaslangic, bit: a.donemBitis };
      a.deger = { net: d.net + s.net, bas: d.bas, bit };
      a.donemBitis = bit;
      a.durum = "etkin";
      a.hatirlatma = [];
      delete a.iptalTarihi;
      a.sonOdeme = { no: s.no, net: s.net, toplam: s.tahsil ?? s.toplam, zaman: Date.now() };
      if (degisti) a.sonraki = { plan, kota, donem, zaman: bas, odendi: true }; else delete a.sonraki;
    });
    return;
  }
  const bas = Date.now(), bit = donemSonu(bas, donem);
  await planAyarla(s.uid, { plan, kota, yeniDonem: true, planBitis: bit, otomatik: false, gecis: null, kaynak, aciklama: `${planAdi(plan, kota)} başladı`, anahtar });
  await kayitGuncelle(s.uid, (k) => {
    const yukseltme = s.amac === "yukseltme" && k.abonelik && aktifMi(k.abonelik);
    if (k.abonelik && !yukseltme) k.gecmis = [{ ...k.abonelik, durum: "bitti" }, ...(k.gecmis ?? [])];
    k.abonelik = {
      saglayici: s.saglayici, mod: s.mod, plan, kota, donem, para: s.para, durum: "etkin", baslangic: yukseltme ? k.abonelik!.baslangic : bas,
      donemBaslangic: bas, donemBitis: bit, otomatik: false, deger: { net: s.net, bas, bit }, sonOdeme: { no: s.no, net: s.net, toplam: s.tahsil ?? s.toplam, zaman: bas },
    };
  });
  await planEsitle(s.uid, plan);
}

/* ═════════════ Abonelik yönetimi ═════════════ */

/** Dönem sonunda geçilecek plan ya da dönem (ödeme alınmaz). */
async function donemSonuPlanla(uid: string, t: Teklif): Promise<string> {
  const a = t.mevcut!;
  const hedef = { plan: t.u.plan!, kota: t.u.kota!, donem: t.u.donem ?? "aylik" as Donem };
  if (a.saglayici === "stripe") {
    const ayar = stripeAyar();
    if (!ayar || !a.stripe) throw new OdemeHatasi("Stripe ayarları bu sunucuda yok; değişiklik yapılamadı.", 503, "altyapi");
    await stripeTakvimKur(ayar, a, hedef);
    // Dönüm anında yeni planın kotası verilir; yenileme ödenmezse bildirim planı düşürür.
    await planAyarla(uid, { plan: a.plan, yeniDonem: false, kaynak: "abonelik", anahtar: `dusur:${uid.slice(2, 10)}:${Date.now()}`, gecis: { zaman: a.donemBitis, plan: hedef.plan, kota: hedef.kota, bitis: a.donemBitis } });
  }
  await kayitGuncelle(uid, (k) => { if (k.abonelik) k.abonelik.sonraki = { ...hedef, zaman: a.donemBitis }; });
  return `${tarihYaz(a.donemBitis)} tarihinde ${planAdi(hedef.plan, hedef.kota, hedef.donem)} geçerli olacak.${a.saglayici === "stripe" ? "" : " O tarihten önce yenileme ödemesi bu planın fiyatıyla alınır."}`;
}

/** Stripe abonelik takvimi: şimdiki dönem aynen sürer, sonraki dönem yeni fiyatla başlar. */
async function stripeTakvimKur(a: StripeAyar, ab: Abonelik, hedef: { plan: PlanKimligi; kota: number; donem: Donem }) {
  const st = ab.stripe!;
  const sub = await ST.stripeIstek(a, "GET", `/v1/subscriptions/${st.abonelik}`);
  let takvim = ST.kimlikAl(sub.schedule);
  if (!takvim) takvim = String((await ST.stripeIstek(a, "POST", "/v1/subscription_schedules", new URLSearchParams({ from_subscription: st.abonelik }))).id);
  const t = await ST.stripeIstek(a, "GET", `/v1/subscription_schedules/${takvim}`);
  const faz = ((t.phases as Record<string, unknown>[] | undefined) ?? [])[0] ?? {};
  const fiyat = ST.kimlikAl((((sub.items as Record<string, unknown>)?.data as Record<string, unknown>[] | undefined)?.[0]?.price));
  const { bit } = ST.abonelikDonemi(sub);
  const urun = await ST.urunKimligi(a, `plan_${hedef.plan === "ultra" && hedef.kota !== 3000 ? `ultra-${hedef.kota}` : hedef.plan}`, planAdi(hedef.plan, hedef.kota));
  const yeniTutar = planDonemTutari(hedef.plan, hedef.kota, hedef.donem, ab.para);
  const kdv = ab.para === "TRY" ? Math.round(yeniTutar * 0.2) : 0;
  const f = new URLSearchParams({
    end_behavior: "release", proration_behavior: "none",
    "phases[0][items][0][price]": fiyat ?? "", "phases[0][items][0][quantity]": "1", "phases[0][start_date]": String(faz.start_date ?? Math.floor(ab.donemBaslangic / 1000)), "phases[0][end_date]": String(Math.floor(bit / 1000)),
    "phases[1][items][0][price_data][currency]": ab.para.toLowerCase(), "phases[1][items][0][price_data][product]": urun, "phases[1][items][0][price_data][unit_amount]": String(yeniTutar + kdv),
    "phases[1][items][0][price_data][recurring][interval]": hedef.donem === "yillik" ? "year" : "month", "phases[1][items][0][quantity]": "1", "phases[1][iterations]": "1",
    "phases[1][metadata][plan]": hedef.plan, "phases[1][metadata][kota]": String(hedef.kota), "phases[1][metadata][donem]": hedef.donem,
  });
  await ST.stripeIstek(a, "POST", `/v1/subscription_schedules/${takvim}`, f);
}

export type AbonelikIslemi = { islem: "iptal"; neden?: string } | { islem: "surdur" } | { islem: "degisikligiKaldir" };

export async function abonelikIslem(uid: string, g: AbonelikIslemi): Promise<string> {
  const k = await kayitOku(uid);
  const a = k.abonelik;
  if (!aktifMi(a)) throw new OdemeHatasi("Süren bir aboneliğin yok.", 404, "yok");
  const st = a.saglayici === "stripe" ? stripeAyar() : null;
  if (a.saglayici === "stripe" && (!st || !a.stripe)) throw new OdemeHatasi("Stripe ayarları bu sunucuda yok; abonelik değiştirilemedi. Destekle iletişime geç.", 503, "altyapi");
  if (g.islem === "iptal") {
    if (st && a.stripe) {
      const sub = await ST.stripeIstek(st, "GET", `/v1/subscriptions/${a.stripe.abonelik}`);
      if (sub.schedule) await ST.stripeIstek(st, "POST", `/v1/subscription_schedules/${ST.kimlikAl(sub.schedule)}/release`).catch(() => {});
      await ST.stripeIstek(st, "POST", `/v1/subscriptions/${a.stripe.abonelik}`, new URLSearchParams({ cancel_at_period_end: "true", "metadata[iptalNedeni]": (g.neden ?? "").slice(0, 200) }));
      await planAyarla(uid, { plan: a.plan, yeniDonem: false, otomatik: false, planBitis: a.donemBitis, gecis: null, kaynak: "abonelik", anahtar: `iptal:${uid.slice(2, 10)}:${Date.now()}` });
    }
    await kayitGuncelle(uid, (x) => { if (!x.abonelik) return; x.abonelik.durum = "iptal"; x.abonelik.iptalTarihi = Date.now(); x.abonelik.iptalNedeni = (g.neden ?? "").slice(0, 120); delete x.abonelik.sonraki; });
    return `Aboneliğin ${tarihYaz(a.donemBitis)} tarihinde sona erecek. O güne kadar planın açık; kalan satın alınmış kredin silinmez.`;
  }
  if (g.islem === "surdur") {
    if (a.durum !== "iptal") return "Aboneliğin zaten sürüyor.";
    if (st && a.stripe) {
      await ST.stripeIstek(st, "POST", `/v1/subscriptions/${a.stripe.abonelik}`, new URLSearchParams({ cancel_at_period_end: "false" }));
      await planAyarla(uid, { plan: a.plan, yeniDonem: false, otomatik: true, planBitis: a.donemBitis, kaynak: "abonelik", anahtar: `surdur:${uid.slice(2, 10)}:${Date.now()}` });
    }
    await kayitGuncelle(uid, (x) => { if (!x.abonelik) return; x.abonelik.durum = "etkin"; delete x.abonelik.iptalTarihi; delete x.abonelik.iptalNedeni; });
    return a.saglayici === "stripe" ? `Aboneliğin ${tarihYaz(a.donemBitis)} tarihinde kendiliğinden yenilenecek.` : `Aboneliğin sürüyor. ${tarihYaz(a.donemBitis - YENILEME_PENCERESI)} tarihinden itibaren yenileme ödemesi yapabilirsin.`;
  }
  if (!a.sonraki || a.sonraki.odendi) return "Planlanmış bir değişiklik yok.";
  if (st && a.stripe) {
    const sub = await ST.stripeIstek(st, "GET", `/v1/subscriptions/${a.stripe.abonelik}`);
    if (sub.schedule) await ST.stripeIstek(st, "POST", `/v1/subscription_schedules/${ST.kimlikAl(sub.schedule)}/release`);
    await planAyarla(uid, { plan: a.plan, yeniDonem: false, gecis: null, kaynak: "abonelik", anahtar: `geri:${uid.slice(2, 10)}:${Date.now()}` });
  }
  await kayitGuncelle(uid, (x) => { if (x.abonelik) delete x.abonelik.sonraki; });
  return `Planlanmış değişiklik kaldırıldı; ${PLAN_AD[a.plan]} planın sürüyor.`;
}

/**
 * Aboneliğin zamanla değişen durumunu işler: iyzico dönemi bittiyse kapatır, yenileme hatırlatmasını gönderir, ödenmiş
 * planlı geçişi uygular, Stripe bildirimi gelmediyse aboneliği Stripe'tan sorgular. Sayfa açılışında ve zamanlayıcıda çağrılır.
 */
export async function abonelikDenetle(uid: string): Promise<void> {
  await kilitle(`abonelik-denetle:${uid}`, async () => {
    const k = await kayitOku(uid);
    const a = k.abonelik;
    if (!a) return;
    const simdi = Date.now();
    if (a.sonraki?.odendi && a.sonraki.zaman && simdi >= a.sonraki.zaman) {
      const sn = a.sonraki;
      await kayitGuncelle(uid, (x) => { if (!x.abonelik) return; Object.assign(x.abonelik, { plan: sn.plan, kota: sn.kota, donem: sn.donem, donemBaslangic: sn.zaman }); delete x.abonelik.sonraki; });
      await planEsitle(uid, sn.plan);
    }
    if (a.saglayici === "stripe") {
      if (simdi < a.donemBitis + 3_600_000 || a.durum === "bitti") return;
      const st = stripeAyar();
      if (!st || !a.stripe) return;
      const sub = await ST.stripeIstek(st, "GET", `/v1/subscriptions/${a.stripe.abonelik}`).catch(() => null);
      if (sub) await stripeAbonelikEsitle(uid, sub, "Denetim");
      return;
    }
    if (simdi >= a.donemBitis) {
      await kayitGuncelle(uid, (x) => { if (!x.abonelik) return; x.gecmis = [{ ...x.abonelik, durum: "bitti" }, ...(x.gecmis ?? [])]; delete x.abonelik; });
      const oz = await krediOzeti(uid);
      await planEsitle(uid, oz.plan);
      return;
    }
    if (a.durum !== "etkin") return;
    const kalan = a.donemBitis - simdi;
    const tur = kalan <= GUN ? "1g" : kalan <= YENILEME_PENCERESI ? "7g" : null;
    if (!tur || (a.hatirlatma ?? []).includes(`${a.donemBitis}:${tur}`)) return;
    await kayitGuncelle(uid, (x) => { if (x.abonelik) x.abonelik.hatirlatma = [...(x.abonelik.hatirlatma ?? []), `${a.donemBitis}:${tur}`].slice(-6); });
    const h = await hesapOku(uid);
    if (h && epostaKurulu()) {
      const sonraki = a.sonraki ?? { plan: a.plan, kota: a.kota, donem: a.donem };
      void epostaGonder({
        kime: k.fatura?.eposta || h.email, konu: `${PLAN_AD[a.plan]} planın ${tur === "1g" ? "yarın" : "7 gün içinde"} bitiyor`,
        metin: `${PLAN_AD[a.plan]} planının ödenmiş dönemi ${tarihYaz(a.donemBitis)} tarihinde bitiyor. Planının sürmesi için yenileme ödemesini yap; ${planAdi(sonraki.plan, sonraki.kota, sonraki.donem)} olarak yenilenir. Yenilemezsen plan Başlangıç'a döner, satın aldığın kredi silinmez.`,
        dugme: { ad: "Planı yenile", adres: `${process.env.VAYRA_KOKEN?.replace(/\/+$/, "") ?? ""}/panel/ayarlar/abonelik#yenile` },
      }).catch(() => {});
    }
  });
}

/* ═════════════ Stripe bildirimleri ═════════════ */

/** Stripe aboneliğinin güncel hâlini kayda ve kredi defterine işler. */
async function stripeAbonelikEsitle(uid: string, sub: Record<string, unknown>, kaynak: string) {
  const k = await kayitOku(uid);
  const a = k.abonelik;
  if (!a?.stripe || a.stripe.abonelik !== sub.id) return;
  const durum = String(sub.status ?? "");
  const { bas, bit } = ST.abonelikDonemi(sub);
  if (durum === "canceled" || durum === "incomplete_expired" || durum === "unpaid") {
    await kayitGuncelle(uid, (x) => { if (!x.abonelik) return; x.gecmis = [{ ...x.abonelik, durum: "bitti" }, ...(x.gecmis ?? [])]; delete x.abonelik; });
    const d = await defterPlanDurumu(uid);
    if (d && d.plan !== "baslangic") await planAyarla(uid, { plan: "baslangic", yeniDonem: true, planBitis: null, otomatik: false, gecis: null, kaynak: "stripe", aciklama: `${kaynak}: Stripe aboneliği sona erdi`, anahtar: `bitti:${String(sub.id).slice(-20)}` });
    else await planAyarla(uid, { plan: "baslangic", yeniDonem: false, planBitis: null, otomatik: false, gecis: null, kaynak: "stripe", anahtar: `bitti:${String(sub.id).slice(-20)}` });
    await planEsitle(uid, "baslangic");
    return;
  }
  const iptal = !!sub.cancel_at_period_end;
  await kayitGuncelle(uid, (x) => {
    if (!x.abonelik) return;
    x.abonelik.durum = durum === "past_due" ? "odenemedi" : iptal ? "iptal" : "etkin";
    if (bit > x.abonelik.donemBitis) { x.abonelik.donemBaslangic = bas; x.abonelik.donemBitis = bit; }
    if (iptal) x.abonelik.iptalTarihi ??= Date.now(); else delete x.abonelik.iptalTarihi;
  });
  if (durum !== "past_due") await planAyarla(uid, { plan: a.plan, yeniDonem: false, otomatik: !iptal, planBitis: Math.max(bit, a.donemBitis), kaynak: "stripe", anahtar: `es:${String(sub.id).slice(-14)}:${Math.floor(bit / 1000)}:${iptal ? 1 : 0}` });
}

/** Stripe dönem faturası ödendi: yenileme makbuzu yazılır, ödenmiş dönem uzar, planlanmış düşürme uygulanır. */
async function stripeYenilendi(st: StripeAyar, inv: Record<string, unknown>, uid: string, sub: Record<string, unknown>) {
  const k = await kayitOku(uid);
  const a = k.abonelik;
  if (!a?.stripe || a.stripe.abonelik !== sub.id) return;
  const { bas, bit } = ST.abonelikDonemi(sub);
  const toplam = Number(inv.amount_paid) || 0, para = String(inv.currency ?? "").toUpperCase() as Para;
  const oran = para === "TRY" ? 0.2 : 0;
  const net = Math.round(toplam / (1 + oran));
  // Plan kaynağı kendi kaydımız: Stripe metadata'sı başarısız bir güncellemeden kalmış olabilir.
  const sn = a.sonraki;
  const plan = sn?.plan ?? a.plan, kota = sn?.kota ?? a.kota, donem = sn?.donem ?? a.donem;
  const no = siparisNoUret();
  const s: Siparis = {
    no, uid, tur: "plan", urun: plan === "ultra" && kota !== 3000 ? `ultra-${kota}` : plan, ad: `${planAdi(plan, kota, donem)}, yenileme`, aciklama: "Stripe aboneliğinin dönem ödemesi.",
    donem, para: para === "USD" ? "USD" : "TRY", liste: net, indirimler: [], net, kdvOrani: oran, kdv: toplam - net, toplam, saglayici: "stripe", mod: st.mod, durum: "odendi", amac: "yenileme",
    hedef: { plan, kota }, olusturma: Date.now(), guncelleme: Date.now(), odemeZamani: Date.now(), saglayiciKimligi: String(inv.id), abonelik: String(sub.id), tahsil: toplam,
    ...(k.fatura ? { fatura: k.fatura } : {}), islendi: true, makbuzNo: await makbuzNoAl(), donus: "/panel/ayarlar/abonelik",
    olaylar: [{ z: Date.now(), olay: "Stripe dönem faturası ödendi", ayrinti: String(inv.id) }],
  };
  await siparisYaz(s);
  await dizinYaz("stripe-fatura", String(inv.id), no);
  const odenemedi = a.durum === "odenemedi";
  const d = await defterPlanDurumu(uid);
  // Dönem faturası, dönemin bittiğinin kesin işaretidir: defter planı hâlâ eskiyse (dönüm henüz işlenmediyse, ödeme
  // alınamayıp düştüyse ya da planlanmış düşürme bekliyorsa) yeni dönem şimdi başlar.
  const yeniDonem = odenemedi || !d || d.plan !== plan || d.kota !== kota;
  await planAyarla(uid, {
    plan, kota, yeniDonem, planBitis: bit, otomatik: !sub.cancel_at_period_end, gecis: null, ...(donem === "aylik" ? { donemBitis: bit } : {}),
    kaynak: `odeme:${no}`, aciklama: `${planAdi(plan, kota)} yenilendi`, anahtar: `odeme:${no}`,
  });
  await kayitGuncelle(uid, (x) => {
    if (!x.abonelik) return;
    x.siparisler = [no, ...x.siparisler];
    Object.assign(x.abonelik, { plan, kota, donem, durum: sub.cancel_at_period_end ? "iptal" : "etkin", donemBaslangic: bas, donemBitis: bit, deger: { net, bas, bit }, sonOdeme: { no, net, toplam, zaman: Date.now() } });
    delete x.abonelik.sonraki;
  });
  await planEsitle(uid, plan);
  await makbuzGonder(s).catch(() => {});
}

/** Doğrulanmış Stripe olayı. Olaydaki nesneye güvenilmez; kimliğiyle Stripe'tan yeniden çekilir. */
export async function stripeOlayIsle(ev: Record<string, unknown>): Promise<string> {
  const st = stripeAyar();
  if (!st) return "ayar yok";
  const tur = String(ev.type ?? "");
  const nesne = ((ev.data as Record<string, unknown> | undefined)?.object ?? {}) as Record<string, unknown>;
  const kimlik = ST.kimlikAl(nesne);
  if (!kimlik) return "nesne yok";
  if (tur.startsWith("checkout.session.")) {
    const no = String(nesne.client_reference_id ?? "") || (await dizinOku("stripe-oturum", kimlik)) || "";
    if (!no || !(await siparisOku(no))) return "sipariş yok";
    if (tur === "checkout.session.expired" || tur === "checkout.session.async_payment_failed") {
      await sonucIsle(no, { durum: "basarisiz", olay: tur === "checkout.session.expired" ? "Stripe ödeme süresi doldu" : "Stripe ödemesi başarısız", alanlar: { hata: tur === "checkout.session.expired" ? "Ödeme süresi doldu" : "Ödeme tamamlanmadı" } });
    } else await stripeOturumIsle(no, kimlik, "Bildirim");
    return "işlendi";
  }
  if (tur === "invoice.paid" || tur === "invoice.payment_failed") {
    const inv = await ST.stripeIstek(st, "GET", `/v1/invoices/${kimlik}`);
    const subId = ST.faturaAboneligi(inv);
    const uid = subId ? await dizinOku("stripe-abonelik", subId) : null;
    const neden = String(inv.billing_reason ?? "");
    if (!subId || !uid) return "abonelik yok";
    if (neden !== "subscription_cycle") return "dönem dışı fatura";
    const sub = await ST.stripeIstek(st, "GET", `/v1/subscriptions/${subId}`);
    if (tur === "invoice.paid") { if (!(await dizinOku("stripe-fatura", kimlik))) await stripeYenilendi(st, inv, uid, sub); return "yenilendi"; }
    // Dönem ödemesi alınamadı: plan hemen Başlangıç'a döner; Stripe yeniden dener, ödenirse plan geri gelir.
    await kayitGuncelle(uid, (x) => { if (x.abonelik?.stripe?.abonelik === subId) x.abonelik.durum = "odenemedi"; });
    const d = await defterPlanDurumu(uid);
    if (d && d.plan !== "baslangic") await planAyarla(uid, { plan: "baslangic", yeniDonem: true, planBitis: null, otomatik: false, gecis: null, kaynak: "stripe", aciklama: "Dönem ödemesi alınamadı, plan Başlangıç'a döndü", anahtar: `odenemedi:${kimlik.slice(-24)}` });
    await planEsitle(uid, "baslangic");
    return "ödenemedi";
  }
  if (tur === "customer.subscription.updated" || tur === "customer.subscription.deleted") {
    const uid = await dizinOku("stripe-abonelik", kimlik);
    if (!uid) return "abonelik yok";
    const sub = await ST.stripeIstek(st, "GET", `/v1/subscriptions/${kimlik}`);
    await stripeAbonelikEsitle(uid, sub, "Bildirim");
    return "eşitlendi";
  }
  if (tur === "charge.refunded") {
    const pi = ST.kimlikAl(nesne.payment_intent);
    const no = pi ? await dizinOku("stripe-pi", pi) : null;
    if (!no) return "sipariş yok";
    const tutar = Number(nesne.amount_refunded) || 0;
    await iadeIsle(no, tutar, "Stripe iadesi");
    return "iade";
  }
  return "yok sayıldı";
}

/** İade: sipariş iade olur; kredi paketinde eklenen kredi (bakiye yettiği kadar) geri alınır, süreli hak kapanır. */
export async function iadeIsle(no: string, tutar: number, olay: string) {
  const s = await sonucIsle(no, { durum: "iade", olay, alanlar: { iade: { tutar, zaman: Date.now() } } });
  if (s.durum !== "iade") return s;
  if (s.tur === "kredi" && s.hedef.kredi) {
    const anahtar = `iade:${no}`;
    let r = await krediHarca(s.uid, s.hedef.kredi, { kaynak: anahtar, aciklama: `İade: ${s.ad}`, anahtar });
    if (!r.ok && r.neden === "yetersiz" && r.ozet && r.ozet.bakiye > 0) r = await krediHarca(s.uid, r.ozet.bakiye, { kaynak: anahtar, aciklama: `İade: ${s.ad} (bakiyenin tamamı)`, anahtar });
  } else if (s.tur === "sinirsiz") await kayitGuncelle(s.uid, (k) => { k.sinirsiz = k.sinirsiz.filter((x) => x.no !== no); });
  else if (s.tur === "hiz") await kayitGuncelle(s.uid, (k) => { if (k.hiz?.no === no) k.hiz = null; });
  return s;
}

/* ═════════════ Görünüm ═════════════ */

export function siparisOzeti(s: Siparis): SiparisOzeti {
  return {
    no: s.no, tur: s.tur, ad: s.ad, aciklama: s.aciklama, durum: s.durum, para: s.para, liste: s.liste, indirimler: s.indirimler, net: s.net, kdv: s.kdv, toplam: s.toplam,
    ...(s.tahsil && s.tahsil !== s.toplam ? { tahsil: s.tahsil } : {}), saglayici: s.saglayici, mod: s.mod, ...(s.amac ? { amac: s.amac } : {}),
    ...(s.hedef.kredi ? { kredi: s.hedef.kredi } : {}), ...(s.hedef.plan ? { plan: s.hedef.plan } : {}), olusturma: s.olusturma,
    ...(s.odemeZamani ? { odemeZamani: s.odemeZamani } : {}), ...(s.makbuzNo ? { makbuzNo: s.makbuzNo } : {}), ...(s.kart ? { kart: s.kart } : {}), ...(s.taksit && s.taksit > 1 ? { taksit: s.taksit } : {}),
    ...(s.hata ? { hata: s.hata } : {}), ...(s.iade ? { iade: s.iade } : {}), ...(s.fatura ? { fatura: s.fatura } : {}), ...(s.donus ? { donus: s.donus } : {}),
  };
}

export function abonelikOzeti(a: Abonelik | undefined): AbonelikOzeti | null {
  if (!a) return null;
  const sn = a.sonraki && !a.sonraki.odendi ? a.sonraki : undefined;
  const hedef = sn ?? { plan: a.plan, kota: a.kota, donem: a.donem };
  const liste = planDonemTutari(hedef.plan, hedef.kota, hedef.donem, a.para);
  return {
    saglayici: a.saglayici, mod: a.mod, plan: a.plan, kota: a.kota, donem: a.donem, para: a.para, durum: a.durum, donemBaslangic: a.donemBaslangic, donemBitis: a.donemBitis,
    otomatik: a.otomatik, ...(a.iptalTarihi ? { iptalTarihi: a.iptalTarihi } : {}), ...(sn ? { sonraki: { plan: sn.plan, kota: sn.kota, donem: sn.donem } } : {}),
    sonrakiTutar: liste + Math.round(liste * (a.para === "TRY" ? 0.2 : 0)), ...(a.sonOdeme ? { sonOdeme: { no: a.sonOdeme.no, toplam: a.sonOdeme.toplam, zaman: a.sonOdeme.zaman } } : {}),
    yenilenebilir: yenilenebilir(a),
  };
}

export function haklarOzeti(k: OdemeKaydi): HaklarYaniti {
  const simdi = Date.now();
  return { sinirsiz: k.sinirsiz.filter((x) => x.bitis > simdi), hiz: k.hiz && k.hiz.bitis > simdi ? k.hiz : null };
}

export { aktifAbonelik };

/* ═════════════ Makbuz e-postası ═════════════ */

async function makbuzGonder(s: Siparis) {
  if (!epostaKurulu() || s.uid === "silindi") return;
  const h = await hesapOku(s.uid);
  if (!h) return;
  const tutar = IY.iyzicoFiyat(s.tahsil ?? s.toplam);
  const kok = process.env.VAYRA_KOKEN?.replace(/\/+$/, "");
  await epostaGonder({
    kime: s.fatura?.eposta || h.email, konu: `Ödemen alındı: ${s.ad}`,
    metin: `${s.ad} için ${tutar} ${s.para === "TRY" ? "TL" : "USD"} ödemen alındı${s.makbuzNo ? `, makbuz numarası ${s.makbuzNo}` : ""}. ${s.mod === "test" ? "Bu bir test ödemesidir, para çekilmedi. " : ""}Bu e-posta ödeme makbuzudur; mali değeri olan fatura yerine geçmez.`,
    ...(kok ? { dugme: { ad: "Makbuzu gör", adres: `${kok}/odeme/makbuz/${s.no}` } } : {}),
  });
}
