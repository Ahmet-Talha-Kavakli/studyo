/**
 * Dashboard pano verileri — alarm kutusu, funnel, ülke/model dağılımı, canlı akış.
 * Seed evreninden türetilir.
 */
import { prng, tohumla, tamsayi, sec, BUGUN, SAAT } from "../cekirdek";
import { ULKELER, MODELLER, PROVIDERLAR } from "../tablolar";
import type { AdminEvren } from "./index";
import type { AdminOzet } from "./index";

export interface Alarm {
  id: string;
  seviye: "kritik" | "uyari" | "bilgi";
  baslik: string;
  detay: string;
}

/** Eşiklere göre canlı alarm türet. */
export function alarmlar(o: AdminOzet): Alarm[] {
  const liste: Alarm[] = [];
  const dusukBakiye = PROVIDERLAR.filter((p) => p.bakiyeUsd < p.alarmEsigiUsd);
  for (const p of dusukBakiye) {
    liste.push({ id: `bal-${p.id}`, seviye: p.bakiyeUsd < p.alarmEsigiUsd * 0.6 ? "kritik" : "uyari",
      baslik: `${p.ad} bakiyesi düşük`, detay: `$${p.bakiyeUsd} kaldı (eşik $${p.alarmEsigiUsd})` });
  }
  if (o.basariOran < 92) liste.push({ id: "basari", seviye: "uyari", baslik: "Job başarı oranı düştü", detay: `Son 24s başarı %${o.basariOran.toFixed(0)}` });
  if (o.kuyruk > 90) liste.push({ id: "kuyruk", seviye: "uyari", baslik: "Kuyruk uzadı", detay: `${o.kuyruk} job bekliyor` });
  if (o.silinmeTalep > 0) liste.push({ id: "kvkk", seviye: "bilgi", baslik: "KVKK silme talebi", detay: `${o.silinmeTalep} talep inceleme bekliyor` });
  if (o.churnOran > 6) liste.push({ id: "churn", seviye: "uyari", baslik: "Churn yükseldi", detay: `Aylık churn %${o.churnOran.toFixed(1)}` });
  liste.push({ id: "mod", seviye: "bilgi", baslik: "Moderasyon kuyruğu", detay: "23 içerik inceleme bekliyor" });
  return liste;
}

/** Edinim funnel'ı — ziyaret → kayıt → ilk üretim → ödeme. */
export function funnel(o: AdminOzet): { asama: string; sayi: number; oran: number }[] {
  const ziyaret = Math.round(o.yeniKayit30 / 0.06);
  const kayit = o.yeniKayit30;
  const dogrulama = Math.round(kayit * 0.78);
  const ilkUretim = Math.round(kayit * 0.54);
  const odemeSayfa = Math.round(kayit * 0.19);
  const ilkOdeme = Math.round(kayit * 0.087);
  const adimlar = [
    ["Ziyaret", ziyaret], ["Kayıt", kayit], ["E-posta doğrulama", dogrulama],
    ["İlk üretim", ilkUretim], ["Ödeme sayfası", odemeSayfa], ["İlk ödeme", ilkOdeme],
  ] as const;
  return adimlar.map(([asama, sayi]) => ({ asama, sayi, oran: (sayi / ziyaret) * 100 }));
}

/** Ülke bazlı kullanıcı dağılımı. */
export function ulkeDagilim(evren: AdminEvren): { etiket: string; deger: number; alt: string }[] {
  const say = new Map<string, number>();
  for (const k of evren.kullanicilar) say.set(k.ulke, (say.get(k.ulke) ?? 0) + 1);
  return [...say.entries()]
    .map(([etiket, deger]) => ({ etiket, deger, alt: deger.toLocaleString("tr-TR") }))
    .sort((a, b) => b.deger - a.deger).slice(0, 7);
}

/** En çok kullanılan modeller. */
export function modelDagilim(evren: AdminEvren): { etiket: string; deger: number; alt: string }[] {
  const say = new Map<string, number>();
  for (const j of evren.joblar) say.set(j.modelAd, (say.get(j.modelAd) ?? 0) + 1);
  return [...say.entries()]
    .map(([etiket, deger]) => ({ etiket, deger, alt: deger.toLocaleString("tr-TR") }))
    .sort((a, b) => b.deger - a.deger).slice(0, 7);
}

export interface AkisOge {
  id: string;
  tur: "job" | "odeme" | "kayit";
  metin: string;
  alt: string;
  zaman: number;
}

/** Canlı akış — son olaylar (tik ile yenilenir). */
export function canliAkis(tik: number): AkisOge[] {
  const liste: AkisOge[] = [];
  for (let i = 0; i < 12; i++) {
    const r = prng(tohumla(`akis-${tik}-${i}`));
    const tur = sec(r, ["job", "odeme", "kayit"] as const);
    const zaman = BUGUN - i * tamsayi(r, 20000, 90000);
    if (tur === "job") {
      const m = sec(r, MODELLER);
      liste.push({ id: `a-${tik}-${i}`, tur, metin: `${m.ad} üretimi tamamlandı`, alt: `${m.kredi} kredi · ${m.saglayici}`, zaman });
    } else if (tur === "odeme") {
      const u = sec(r, ULKELER);
      liste.push({ id: `a-${tik}-${i}`, tur, metin: `Yeni abonelik · ${u.ad}`, alt: `${tamsayi(r, 15, 129) * 33} ₺`, zaman });
    } else {
      const u = sec(r, ULKELER);
      liste.push({ id: `a-${tik}-${i}`, tur, metin: `Yeni kayıt · ${u.ad}`, alt: sec(r, ["Organik", "Meta Ads", "Referans", "TikTok"]), zaman });
    }
    void SAAT;
  }
  return liste.sort((a, b) => b.zaman - a.zaman);
}

/** Nakit akış projeksiyonu — mevcut MRR + churn tahminiyle 6 ay. */
export function nakitProjeksiyon(mrr: number, churnOran: number): { ay: string; deger: number }[] {
  const aylar = ["Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const buyume = 1.08; // aylık net büyüme (yeni - churn)
  let kumulatif = 0;
  let aylikMrr = mrr;
  return aylar.map((ay) => {
    kumulatif += aylikMrr;
    aylikMrr = Math.round(aylikMrr * (buyume - churnOran / 100));
    return { ay, deger: kumulatif };
  });
}

/** En çok kredi harcayan 10 kullanıcı (bu ay). */
export function enCokHarcayan(evren: AdminEvren): { id: string; ad: string; plan: string; harcanan: number; ulke: string }[] {
  return [...evren.kullanicilar]
    .sort((a, b) => b.toplamHarcanan - a.toplamHarcanan)
    .slice(0, 10)
    .map((k) => ({ id: k.id, ad: k.ad, plan: k.plan, harcanan: k.toplamHarcanan, ulke: k.ulke }));
}

/** Tier (plan) bazlı abone dağılımı. */
export function tierDagilim(evren: AdminEvren): { etiket: string; deger: number; renk: string }[] {
  const renk: Record<string, string> = { baslangic: "#646a73", arti: "#a78bfa", ultra: "#f472b6", kurumsal: "#34d399" };
  const ad: Record<string, string> = { baslangic: "Başlangıç", arti: "Artı", ultra: "Ultra", kurumsal: "Kurumsal" };
  const say = new Map<string, number>();
  for (const k of evren.kullanicilar) if (k.durum === "aktif") say.set(k.plan, (say.get(k.plan) ?? 0) + 1);
  return [...say.entries()].map(([p, deger]) => ({ etiket: ad[p] ?? p, deger, renk: renk[p] ?? "#9aa0a8" }));
}

export interface Servis {
  ad: string;
  saglik: number; // 0-100
  durum: "saglikli" | "yavas" | "sorunlu";
}

/** Sistem sağlık halkaları. */
export function sistemSaglik(tik: number): Servis[] {
  const servisler = ["API", "Veritabanı", "Redis", "Kuyruk", "Storage", "CDN"];
  return servisler.map((ad, i) => {
    const r = prng(tohumla(`saglik-${ad}-${Math.floor(tik / 4)}`));
    const saglik = Math.round(94 + r() * 6 - (i === 3 ? 8 : 0));
    return { ad, saglik: Math.min(100, saglik), durum: saglik >= 97 ? "saglikli" : saglik >= 90 ? "yavas" : "sorunlu" };
  });
}
