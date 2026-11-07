/**
 * Satış kataloğu: istemcinin gönderdiği ürün kimliğinden fiyatı sunucuda hesaplar. İstemciden fiyat alınmaz.
 * Rakamların tek kaynağı lib/fiyat (TL, KDV hariç) ve lib/catalog (plan USD fiyatları). Saf modül: arayüz de
 * aynı hesabı göstermek için kullanabilir, ama ödenen tutar her zaman sunucuda yeniden hesaplanır.
 *
 * Tutarlar en küçük birimdedir (kuruş ya da sent).
 */
import { DAVET_INDIRIM } from "@/lib/earn/kampanyalar";
import {
  EK_ESZAMANLI, HIZ_SEVIYELERI, KREDI_PAKETLERI, PLAN_KREDI, SINIRSIZ_GUNLER, SINIRSIZ_TEKLIFLER, ULTRA_KREDI_KADEMELERI, YILLIK_INDIRIM,
  aylikFiyat, krediBasina, planBul, sinirsizFiyat,
} from "@/lib/fiyat";
import { MODELLER } from "@/lib/catalog";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import type { Donem, FiyatSatiri, OdemeIstegi, OdemeTur, Para } from "./tipler";

export const KDV_ORANI = 0.2;
export const KREDI_MIN = 100;
export const KREDI_MAX = 100_000;
export const KREDI_ADIM = 50;
/** Hız ve ek eşzamanlı üretim 30 günlük süreli haktır. */
export const HIZ_GUN = 30;
/** TL liste fiyatından USD liste fiyatına geçiş oranı (Artı planı 1.299 TL ile 49 USD arasındaki oran). Döviz kuru değildir. */
export const USD_LISTE_ORANI = 26.5;
export const DAVET_ORANI = DAVET_INDIRIM;

export const PLAN_SIRA: Record<PlanKimligi, number> = { baslangic: 0, arti: 1, ultra: 2, kurumsal: 3 };
export const PLAN_AD: Record<PlanKimligi, string> = { baslangic: "Başlangıç", arti: "Artı", ultra: "Ultra", kurumsal: "Kurumsal" };

export interface Urun {
  tur: OdemeTur;
  /** Normalleştirilmiş ürün kimliği. */
  urun: string;
  ad: string;
  aciklama: string;
  para: Para;
  donem?: Donem;
  /** KDV hariç liste tutarı (bir dönem). */
  liste: number;
  kdvOrani: number;
  kredi?: number;
  plan?: PlanKimligi;
  kota?: number;
  model?: string;
  kalite?: string;
  gun?: number;
  hiz?: "standart" | "oncelikli" | "turbo";
  ekEsZamanli?: number;
}

const tlKurus = (tl: number) => Math.round(tl * 100);
/** TL liste fiyatının USD karşılığı: yukarı yuvarlanmış dolar eksi bir sent (7,99 gibi). */
export const usdSent = (tl: number) => Math.max(99, Math.ceil(tl / USD_LISTE_ORANI) * 100 - 1);
const fiyatYaz = (tl: number, para: Para) => (para === "TRY" ? tlKurus(tl) : usdSent(tl));

export const kdvOrani = (para: Para) => (para === "TRY" ? KDV_ORANI : 0);

/** Kredi miktarının fiyatı: miktara eşit ya da altındaki en büyük paketin kredi başı fiyatı (TL, tam sayı). */
export function krediFiyatiTL(kredi: number): number {
  const kademe = [...KREDI_PAKETLERI].reverse().find((p) => p.kredi <= kredi) ?? KREDI_PAKETLERI[0];
  return Math.round(kredi * krediBasina(kademe.fiyat, kademe.kredi));
}

/** Planın bir dönemlik liste tutarı (KDV hariç, en küçük birim). */
export function planDonemTutari(plan: PlanKimligi, kota: number, donem: Donem, para: Para): number {
  const p = planBul(plan);
  if (!p || plan === "kurumsal") return 0;
  if (para === "TRY") return tlKurus(aylikFiyat(p, donem, kota) * (donem === "yillik" ? 12 : 1));
  const oran = kota / p.kredi;
  const aylik = donem === "yillik" ? (p.yillikUSD ?? p.fiyatUSD * (1 - YILLIK_INDIRIM)) : p.fiyatUSD;
  return Math.round(aylik * oran * 100) * (donem === "yillik" ? 12 : 1);
}

export function planCoz(urun: string): { plan: PlanKimligi; kota: number } | null {
  const m = /^(baslangic|arti|ultra)(?:-(\d{3,5}))?$/.exec(urun);
  if (!m) return null;
  const plan = m[1] as PlanKimligi;
  if (plan !== "ultra") return m[2] ? null : { plan, kota: PLAN_KREDI[plan] };
  const kota = m[2] ? Number(m[2]) : ULTRA_KREDI_KADEMELERI[0];
  return ULTRA_KREDI_KADEMELERI.includes(kota) ? { plan, kota } : null;
}
export const planUrunu = (plan: PlanKimligi, kota: number) => (plan === "ultra" && kota !== ULTRA_KREDI_KADEMELERI[0] ? `ultra-${kota}` : plan);
export const planAdi = (plan: PlanKimligi, kota: number, donem?: Donem) =>
  `${PLAN_AD[plan]} planı${plan === "ultra" ? `, aylık ${kota.toLocaleString("tr-TR")} kredi` : ""}${donem ? `, ${donem === "yillik" ? "yıllık" : "aylık"}` : ""}`;

/** Ürün kimliğini çözer ve fiyatlar. Geçersizse Türkçe hata metni döner. */
export function urunCoz(i: OdemeIstegi): Urun | string {
  const para: Para = i.para === "USD" ? "USD" : "TRY";
  const kdv = kdvOrani(para);
  const urun = String(i.urun ?? "").trim().slice(0, 120);
  if (i.tur === "plan") {
    if (urun === "kurumsal") return "Kurumsal plan satış ekibiyle sözleşmeyle açılır; iletişim sayfasından ulaşabilirsin.";
    const p = planCoz(urun);
    if (!p) return "Plan tanınmadı.";
    const donem: Donem = i.donem === "yillik" ? "yillik" : "aylik";
    const liste = planDonemTutari(p.plan, p.kota, donem, para);
    if (liste <= 0) return "Bu plan için fiyat bulunamadı.";
    return {
      tur: "plan", urun: planUrunu(p.plan, p.kota), ad: planAdi(p.plan, p.kota, donem),
      aciklama: `Her ay ${p.kota.toLocaleString("tr-TR")} kredi, ${donem === "yillik" ? "12 ay için yılda bir kez ödenir" : "her ay yenilenir"}.`,
      para, donem, liste, kdvOrani: kdv, plan: p.plan, kota: p.kota,
    };
  }
  if (i.tur === "kredi") {
    const kredi = Number(urun);
    if (!Number.isInteger(kredi) || kredi < KREDI_MIN || kredi > KREDI_MAX || kredi % KREDI_ADIM !== 0) return `Kredi miktarı ${KREDI_MIN.toLocaleString("tr-TR")} ile ${KREDI_MAX.toLocaleString("tr-TR")} arasında, ${KREDI_ADIM}'nin katı olmalı.`;
    const paket = KREDI_PAKETLERI.some((p) => p.kredi === kredi);
    return {
      tur: "kredi", urun: String(kredi), ad: `${kredi.toLocaleString("tr-TR")} kredi${paket ? " paketi" : ""}`,
      aciklama: "Tek seferlik. Süresi dolmaz, ödeme onaylanınca bakiyene eklenir.", para, liste: fiyatYaz(krediFiyatiTL(kredi), para), kdvOrani: kdv, kredi,
    };
  }
  if (i.tur === "sinirsiz") {
    const [model, kalite, gunMetin] = urun.split("|");
    const t = SINIRSIZ_TEKLIFLER.find((x) => x.model === model);
    if (!t) return "Bu model için sınırsız erişim satılmıyor.";
    const ki = t.kaliteler.findIndex((k) => k.ad === kalite);
    const gi = SINIRSIZ_GUNLER.findIndex((g) => g.gun === Number(gunMetin));
    if (ki < 0 || gi < 0) return "Kalite ya da süre tanınmadı.";
    const tl = sinirsizFiyat(t, ki, gi);
    const ad = MODELLER.find((m) => m.id === model)?.ad ?? model;
    const gun = SINIRSIZ_GUNLER[gi].gun;
    return {
      tur: "sinirsiz", urun: `${model}|${t.kaliteler[ki].ad}|${gun}`, ad: `${ad} sınırsız, ${t.kaliteler[ki].ad}, ${gun} gün`,
      aciklama: `${gun} gün boyunca bu modelde kredi düşmeden üretim. Aynı modeli yeniden alırsan süre eklenir.`, para, liste: fiyatYaz(tl, para), kdvOrani: kdv,
      model, kalite: t.kaliteler[ki].ad, gun,
    };
  }
  if (i.tur === "hiz") {
    const [seviye, ekMetin] = urun.split(":");
    const sv = HIZ_SEVIYELERI.find((h) => h.id === seviye);
    const ek = EK_ESZAMANLI.find((e) => e.adet === Number(ekMetin ?? 0));
    if (!sv || !ek) return "Hız seviyesi tanınmadı.";
    const tl = sv.fiyat + ek.fiyat;
    if (tl <= 0) return "Standart hız ücretsizdir; ödeme gerekmez.";
    const parca = [sv.fiyat ? `${sv.ad} hız` : "", ek.adet ? `${ek.adet} ek eşzamanlı üretim` : ""].filter(Boolean).join(" ve ");
    return {
      tur: "hiz", urun: `${sv.id}:${ek.adet}`, ad: `${parca}, ${HIZ_GUN} gün`, aciklama: `${HIZ_GUN} gün geçerli, kendiliğinden yenilenmez. Süre bitmeden yeniden alırsan süre eklenir.`,
      para, liste: fiyatYaz(tl, para), kdvOrani: kdv, hiz: sv.id as Urun["hiz"], ekEsZamanli: ek.adet, gun: HIZ_GUN,
    };
  }
  return "Ürün türü tanınmadı.";
}

/** İndirimler düşülür, KDV eklenir. */
export function tutarHesapla(liste: number, indirimler: FiyatSatiri[], oran: number): { net: number; kdv: number; toplam: number } {
  const net = Math.max(0, liste - indirimler.reduce((t, x) => t + x.tutar, 0));
  const kdv = Math.round(net * oran);
  return { net, kdv, toplam: net + kdv };
}

/** Görünüm için: en küçük birimden para metni ("₺1.299,00", "$49.00"). */
export function paraYaz(birim: number, para: Para): string {
  const v = birim / 100;
  return para === "TRY"
    ? `₺${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`
    : `$${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
}
