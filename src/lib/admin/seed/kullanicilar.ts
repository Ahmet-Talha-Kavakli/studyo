/**
 * Kullanıcı evreni — 10.000 deterministik kullanıcı. SSR-safe (tohumdan türer).
 * Her kullanıcı: kimlik, plan, edinim kaynağı, coğrafya, kredi, aktiflik, güven skoru.
 */
import {
  prng, tohumla, tamsayi, sec, agirlikliSec, normal, BUGUN, GUN,
} from "../cekirdek";
import { PLANLAR, KAYNAKLAR, ULKELER, CIHAZLAR, TARAYICILAR, DILLER, ISLETIM, ADLAR, SOYADLAR } from "../tablolar";

export type KullaniciDurum = "aktif" | "pasif" | "askida" | "banli" | "silinme_talebi";

export interface AdminKullanici {
  id: string;
  ad: string;
  email: string;
  avatarTohum: string;
  plan: string;
  durum: KullaniciDurum;
  kayitTarih: number;
  sonAktif: number;
  kaynak: string;
  ulkeKod: string;
  ulke: string;
  sehir: string;
  cihaz: string;
  tarayici: string;
  isletim: string;
  dil: string;
  ip: string;
  krediBakiye: number;
  toplamHarcanan: number;
  toplamOdenen: number; // ₺
  jobSayisi: number;
  guvenSkoru: number; // 0-100
  dogrulanmis: boolean;
  vip: boolean;
  etiketler: string[];
  referansEden?: string; // kullanıcı id
  ayCiro: number; // MRR katkısı ₺
}

const ULKE_AGIRLIK = ULKELER.map((u) => [u, u.agirlik] as const);
const PLAN_AGIRLIK = [
  ["baslangic", 55],
  ["arti", 30],
  ["ultra", 12],
  ["kurumsal", 3],
] as const;
const DURUM_AGIRLIK: (readonly [KullaniciDurum, number])[] = [
  ["aktif", 68], ["pasif", 24], ["askida", 4], ["banli", 3], ["silinme_talebi", 1],
];

function ipUret(r: () => number): string {
  return `${tamsayi(r, 1, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 1, 255)}`;
}

/* Paylaşılan IP havuzu — fraud/çoklu-hesap tespiti için kasıtlı çakışma.
   ~40 "şüpheli" IP; kullanıcıların ~%4'ü bunlardan birini paylaşır (aynı
   cihaz zinciri / VPN çıkışı / ofis-NAT), böylece ayniIpKumeleri() gerçek
   kümeler bulur. Deterministik: sabit tohumdan üretilir. */
const PAYLASILAN_IP: string[] = (() => {
  const pr = prng(tohumla("vayra-fraud-ip-havuz"));
  return Array.from({ length: 40 }, () => ipUret(pr));
})();

export function uretKullanicilar(adet = 10000): AdminKullanici[] {
  const liste: AdminKullanici[] = [];
  for (let i = 0; i < adet; i++) {
    const r = prng(tohumla(`vayra-admin-kul-v2-${i}`));
    const ad = sec(r, ADLAR);
    const soyad = sec(r, SOYADLAR);
    const ulke = agirlikliSec(r, ULKE_AGIRLIK);
    const plan = agirlikliSec(r, PLAN_AGIRLIK);
    const durum = agirlikliSec(r, DURUM_AGIRLIK);
    const kayitYasGun = tamsayi(r, 1, 540);
    const kayitTarih = BUGUN - kayitYasGun * GUN;
    const aktif = durum === "aktif";
    const sonAktif = aktif
      ? BUGUN - tamsayi(r, 0, 3) * GUN - tamsayi(r, 0, 86400000)
      : BUGUN - tamsayi(r, 5, 120) * GUN;
    const planObj = PLANLAR.find((p) => p.id === plan)!;
    const ucretli = plan !== "baslangic";
    const jobSayisi = Math.round(normal(r) * (aktif ? 400 : 40));
    const krediBakiye = Math.max(0, Math.round(normal(r) * planObj.kredi * 1.4));
    const guvenSkoru = Math.min(100, Math.max(5, Math.round(
      (durum === "banli" ? 15 : durum === "askida" ? 40 : 70) + normal(r) * 40 - 20,
    )));
    const vip = ucretli && r() > 0.94;
    const etiketler: string[] = [];
    if (vip) etiketler.push("VIP");
    if (guvenSkoru < 35) etiketler.push("Riskli");
    if (r() > 0.97) etiketler.push("Influencer");

    liste.push({
      id: `u_${(100000 + i).toString(36)}`,
      ad: `${ad} ${soyad}`,
      email: `${ad.toLowerCase()}.${soyad.toLowerCase().replace(/[^a-z]/g, "")}${tamsayi(r, 1, 999)}@${sec(r, ["gmail.com", "outlook.com", "icloud.com", "vayra.ai", "proton.me"])}`,
      avatarTohum: `${ad}${soyad}${i}`,
      plan,
      durum,
      kayitTarih,
      sonAktif,
      kaynak: agirlikliSec(r, KAYNAKLAR.map((k) => [k.id, k.id === "organik" ? 40 : k.kanal === "paid" ? 18 : 10] as const)),
      ulkeKod: ulke.kod,
      ulke: ulke.ad,
      sehir: sec(r, ulke.sehir),
      cihaz: agirlikliSec(r, [["Masaüstü", 45], ["Mobil", 48], ["Tablet", 7]] as const),
      tarayici: sec(r, TARAYICILAR),
      isletim: sec(r, ISLETIM),
      dil: ulke.kod === "TR" ? "tr" : sec(r, DILLER),
      // ~%4 kullanıcı paylaşılan (şüpheli) bir IP kullanır → çoklu-hesap kümesi
      ip: r() < 0.04 ? sec(r, PAYLASILAN_IP) : ipUret(r),
      krediBakiye,
      toplamHarcanan: Math.round(normal(r) * jobSayisi * 25),
      toplamOdenen: ucretli ? Math.round(planObj.fiyatTRY * tamsayi(r, 1, Math.max(2, Math.floor(kayitYasGun / 30) + 1))) : 0,
      jobSayisi,
      guvenSkoru,
      dogrulanmis: r() > 0.12,
      vip,
      etiketler,
      referansEden: r() > 0.82 ? `u_${(100000 + tamsayi(r, 0, adet)).toString(36)}` : undefined,
      ayCiro: ucretli && durum === "aktif" ? planObj.fiyatTRY : 0,
    });
  }
  return liste;
}
