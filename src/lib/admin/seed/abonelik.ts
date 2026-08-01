/**
 * Abonelik & ödeme finansı — abonelik listesi, iade/chargeback, başarısız-retry,
 * vergi (KDV), kredi paketleri, bakiye anomalileri. Seed evreninden türetilir.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, BUGUN, GUN } from "../cekirdek";
import { PLANLAR } from "../tablolar";
import type { AdminEvren } from "./index";

export type AbonelikDurum = "active" | "trialing" | "past_due" | "canceled" | "paused";

export interface Abonelik {
  id: string;
  kullaniciId: string;
  ad: string;
  plan: string;
  durum: AbonelikDurum;
  baslangic: number;
  sonrakiYenileme: number;
  tutar: number; // aylık ₺
  yontem: string;
  yenilemeSayisi: number;
  mrrKatki: number;
  iptalTarih?: number;
  iptalSebep?: string;
}

const IPTAL_SEBEP = ["Çok pahalı", "Yeterince kullanmadım", "Kalite yetersiz", "Rakibe geçtim", "Geçici ara", "Diğer"];

export function uretAbonelikler(evren: AdminEvren): Abonelik[] {
  const aboneler = evren.kullanicilar.filter((k) => k.plan !== "baslangic");
  return aboneler.slice(0, 3000).map((k, i) => {
    const r = prng(tohumla(`abo-${k.id}`));
    const plan = PLANLAR.find((p) => p.id === k.plan)!;
    const durum: AbonelikDurum = k.durum === "banli" || k.durum === "silinme_talebi"
      ? "canceled"
      : agirlikliSec(r, [["active", 78], ["trialing", 6], ["past_due", 7], ["canceled", 6], ["paused", 3]] as const);
    const iptal = durum === "canceled";
    const yenileme = tamsayi(r, 1, 24);
    return {
      id: `sub_${(500000 + i).toString(36)}`,
      kullaniciId: k.id,
      ad: k.ad,
      plan: k.plan,
      durum,
      baslangic: k.kayitTarih,
      sonrakiYenileme: BUGUN + tamsayi(r, 1, 30) * GUN,
      tutar: plan.fiyatTRY,
      yontem: `•••• ${tamsayi(r, 1000, 9999)}`,
      yenilemeSayisi: yenileme,
      mrrKatki: durum === "active" ? plan.fiyatTRY : 0,
      iptalTarih: iptal ? BUGUN - tamsayi(r, 1, 90) * GUN : undefined,
      iptalSebep: iptal ? sec(r, IPTAL_SEBEP) : undefined,
    };
  });
}

/* ── İade & Chargeback ── */
export interface IadeKayit {
  id: string;
  kullaniciId: string;
  ad: string;
  tutar: number;
  tur: "iade" | "chargeback";
  sebepKategori: string;
  durum: "beklemede" | "onaylandi" | "reddedildi" | "dispute";
  tarih: number;
  sonTarih?: number; // chargeback için dispute son tarihi
}

export function uretIadeler(evren: AdminEvren): IadeKayit[] {
  const out: IadeKayit[] = [];
  const kul = evren.kullanicilar.filter((k) => k.toplamOdenen > 0);
  for (let i = 0; i < 180; i++) {
    const r = prng(tohumla(`iade-${i}`));
    const k = sec(r, kul);
    const tur = agirlikliSec(r, [["iade", 78], ["chargeback", 22]] as const);
    out.push({
      id: `ref_${i}`,
      kullaniciId: k.id,
      ad: k.ad,
      tutar: tamsayi(r, 15, 129) * 33,
      tur,
      sebepKategori: sec(r, ["Teknik hata", "Memnuniyetsizlik", "Yanlışlıkla", "Fraud", "Süre dolmadan iptal"]),
      durum: tur === "chargeback"
        ? agirlikliSec(r, [["dispute", 40], ["onaylandi", 30], ["reddedildi", 30]] as const)
        : agirlikliSec(r, [["onaylandi", 60], ["beklemede", 25], ["reddedildi", 15]] as const),
      tarih: BUGUN - tamsayi(r, 0, 90) * GUN,
      sonTarih: tur === "chargeback" ? BUGUN + tamsayi(r, 1, 12) * GUN : undefined,
    });
  }
  return out.sort((a, b) => b.tarih - a.tarih);
}

/* ── Başarısız ödeme retry ── */
export interface RetryKayit {
  id: string;
  kullaniciId: string;
  ad: string;
  tutar: number;
  denemeSayisi: number; // 1-4
  sonrakiDeneme: number;
  gonderilenMail: number;
  durum: "retry" | "kurtarildi" | "iptal";
}

export function uretRetryler(evren: AdminEvren): RetryKayit[] {
  const kul = evren.kullanicilar.filter((k) => k.plan !== "baslangic");
  return Array.from({ length: 64 }, (_, i) => {
    const r = prng(tohumla(`retry-${i}`));
    const k = sec(r, kul);
    const deneme = tamsayi(r, 1, 5);
    return {
      id: `rt_${i}`,
      kullaniciId: k.id,
      ad: k.ad,
      tutar: tamsayi(r, 15, 129) * 33,
      denemeSayisi: deneme,
      sonrakiDeneme: BUGUN + [1, 3, 5, 7][Math.min(3, deneme - 1)] * GUN,
      gonderilenMail: deneme,
      durum: deneme >= 4 ? agirlikliSec(r, [["iptal", 60], ["kurtarildi", 40]] as const) : agirlikliSec(r, [["retry", 65], ["kurtarildi", 35]] as const),
    };
  });
}

/* ── Vergi (KDV) raporu — ülke bazlı ── */
export interface VergiSatir {
  ulke: string;
  kod: string;
  oran: number; // KDV %
  matrah: number;
  vergi: number;
}

export const KDV_ORAN: Record<string, number> = {
  TR: 20, DE: 19, GB: 20, FR: 20, NL: 21, ES: 21, IT: 22, US: 0, AE: 5, SA: 15, BR: 0, IN: 18,
};

export function vergiRapor(evren: AdminEvren): VergiSatir[] {
  const say = new Map<string, { ad: string; matrah: number }>();
  for (const k of evren.kullanicilar) {
    if (k.toplamOdenen > 0) {
      const g = say.get(k.ulkeKod) ?? { ad: k.ulke, matrah: 0 };
      g.matrah += k.ayCiro;
      say.set(k.ulkeKod, g);
    }
  }
  return [...say.entries()].map(([kod, g]) => {
    const oran = KDV_ORAN[kod] ?? 0;
    return { ulke: g.ad, kod, oran, matrah: g.matrah, vergi: Math.round((g.matrah * oran) / 100) };
  }).sort((a, b) => b.matrah - a.matrah);
}

/* ── Kredi bakiyesi anomalileri ── */
export interface Anomali {
  kullaniciId: string;
  ad: string;
  tip: "negatif" | "asiri_yuksek" | "tutarsiz" | "hizli_tuketim";
  detay: string;
  deger: number;
}

export function bakiyeAnomalileri(evren: AdminEvren): Anomali[] {
  const out: Anomali[] = [];
  for (const k of evren.kullanicilar) {
    const r = prng(tohumla(`anom-${k.id}`));
    if (r() > 0.994) out.push({ kullaniciId: k.id, ad: k.ad, tip: "negatif", detay: "Bakiye negatife düştü", deger: -tamsayi(r, 5, 200) });
    else if (k.krediBakiye > 20000 && k.toplamOdenen < 500) out.push({ kullaniciId: k.id, ad: k.ad, tip: "asiri_yuksek", detay: "Satın almadan yüksek bakiye", deger: k.krediBakiye });
    else if (r() > 0.996) out.push({ kullaniciId: k.id, ad: k.ad, tip: "tutarsiz", detay: "Ledger toplamı ≠ bakiye", deger: tamsayi(r, 50, 500) });
    else if (r() > 0.995) out.push({ kullaniciId: k.id, ad: k.ad, tip: "hizli_tuketim", detay: "1 saatte 500+ kredi tüketildi", deger: tamsayi(r, 500, 2000) });
  }
  return out.slice(0, 24);
}
