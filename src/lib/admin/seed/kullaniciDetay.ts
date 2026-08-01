/**
 * Kullanıcı detay verileri — id'den deterministik türetilir (uçtan uca detay sayfası).
 * Kredi ledger, ödeme geçmişi, oturum/login, referans ağacı, moderasyon, ticket, audit.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, normal, BUGUN, GUN, SAAT } from "../cekirdek";
import { MODELLER, TICKET_KATEGORI, IPTAL_SEBEP } from "../tablolar";
import type { AdminKullanici } from "./kullanicilar";

/* ── Kredi ledger — her hareket ── */
export type LedgerTip = "satin_alma" | "harcama" | "iade" | "bonus" | "referans" | "expire" | "manuel";

export interface LedgerHareket {
  id: string;
  tarih: number;
  tip: LedgerTip;
  miktar: number; // + kazanım / − harcama
  sonrakiBakiye: number;
  sebep: string;
  yapan?: string; // manuel ise admin
}

const LEDGER_ETIKET: Record<LedgerTip, string> = {
  satin_alma: "Kredi paketi satın alma", harcama: "Üretim harcaması", iade: "İade",
  bonus: "Kampanya bonusu", referans: "Referans ödülü", expire: "Süre dolumu", manuel: "Manuel düzeltme",
};

export function uretLedger(k: AdminKullanici): LedgerHareket[] {
  const r = prng(tohumla(`ledger-${k.id}`));
  const adet = tamsayi(r, 8, 45);
  const hareketler: LedgerHareket[] = [];
  let bakiye = k.krediBakiye;
  // Geriye doğru üret (en yeniden eskiye)
  for (let i = 0; i < adet; i++) {
    const tip = agirlikliSec(r, [
      ["harcama", 55], ["satin_alma", 18], ["bonus", 8], ["referans", 6], ["iade", 7], ["expire", 3], ["manuel", 3],
    ] as const);
    const miktar = tip === "harcama" || tip === "expire"
      ? -tamsayi(r, 3, 60)
      : tip === "satin_alma" ? tamsayi(r, 200, 3000)
      : tamsayi(r, 5, 200);
    hareketler.push({
      id: `l-${k.id}-${i}`,
      tarih: BUGUN - i * tamsayi(r, 6, 72) * SAAT,
      tip,
      miktar,
      sonrakiBakiye: bakiye,
      sebep: LEDGER_ETIKET[tip],
      yapan: tip === "manuel" ? sec(r, ["super", "finans", "destek"]) : undefined,
    });
    bakiye -= miktar; // geriye doğru
  }
  return hareketler;
}

/* ── Ödeme geçmişi ── */
export interface Odeme {
  id: string;
  tarih: number;
  tutar: number; // ₺
  tur: "abonelik" | "kredi_paketi" | "iade" | "chargeback";
  durum: "basarili" | "iade" | "basarisiz" | "chargeback";
  yontem: string; // kart son 4
  fatura: string;
}

export function uretOdemeler(k: AdminKullanici): Odeme[] {
  if (k.plan === "baslangic" && k.toplamOdenen === 0) return [];
  const r = prng(tohumla(`odeme-${k.id}`));
  const adet = tamsayi(r, 1, 14);
  const son4 = tamsayi(r, 1000, 9999);
  const out: Odeme[] = [];
  for (let i = 0; i < adet; i++) {
    const durum = agirlikliSec(r, [["basarili", 86], ["iade", 6], ["basarisiz", 5], ["chargeback", 3]] as const);
    out.push({
      id: `o-${k.id}-${i}`,
      tarih: BUGUN - i * 30 * GUN - tamsayi(r, 0, 5 * GUN),
      tutar: tamsayi(r, 15, 129) * 33,
      tur: agirlikliSec(r, [["abonelik", 70], ["kredi_paketi", 24], ["iade", 4], ["chargeback", 2]] as const),
      durum,
      yontem: `•••• ${son4}`,
      fatura: `INV-${(2026000 + tamsayi(r, 0, 99999)).toString()}`,
    });
  }
  return out;
}

/* ── Oturum / login geçmişi ── */
export interface Oturum {
  id: string;
  tarih: number;
  ip: string;
  cihaz: string;
  konum: string;
  aktif: boolean;
}

export function uretOturumlar(k: AdminKullanici): Oturum[] {
  const r = prng(tohumla(`oturum-${k.id}`));
  const adet = tamsayi(r, 3, 12);
  const out: Oturum[] = [];
  for (let i = 0; i < adet; i++) {
    out.push({
      id: `s-${k.id}-${i}`,
      tarih: BUGUN - i * tamsayi(r, 8, 96) * SAAT,
      ip: i === 0 ? k.ip : `${tamsayi(r, 1, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 1, 255)}`,
      cihaz: `${k.tarayici} · ${k.isletim}`,
      konum: `${k.sehir}, ${k.ulke}`,
      aktif: i === 0,
    });
  }
  return out;
}

/* ── Kritik güvenlik olayları ── */
export interface GuvenlikOlay {
  id: string;
  tarih: number;
  olay: string;
  detay: string;
}

export function uretGuvenlikOlaylar(k: AdminKullanici): GuvenlikOlay[] {
  const r = prng(tohumla(`guv-${k.id}`));
  const olaylar: { o: string; d: string }[] = [
    { o: "Şifre değişikliği", d: "Kullanıcı kaynaklı" },
    { o: "E-posta doğrulandı", d: k.email },
    { o: "Yeni cihazdan giriş", d: `${k.tarayici} · ${k.isletim}` },
  ];
  return olaylar.filter(() => r() > 0.35).map((x, i) => ({
    id: `g-${k.id}-${i}`, tarih: BUGUN - tamsayi(r, 1, 200) * GUN, olay: x.o, detay: x.d,
  }));
}

/* ── Kullanıcının joblarının bir dilimi (detay) ── */
export interface KullaniciJob {
  id: string;
  tarih: number;
  model: string;
  kredi: number;
  durum: "tamam" | "hata" | "isleniyor";
  sureSn: number;
}

export function uretKullaniciJoblar(k: AdminKullanici): KullaniciJob[] {
  const r = prng(tohumla(`kjob-${k.id}`));
  const adet = Math.min(24, Math.max(0, k.jobSayisi));
  const out: KullaniciJob[] = [];
  for (let i = 0; i < adet; i++) {
    const m = sec(r, MODELLER);
    out.push({
      id: `kj-${k.id}-${i}`, tarih: BUGUN - i * tamsayi(r, 2, 40) * SAAT,
      model: m.ad, kredi: m.kredi,
      durum: agirlikliSec(r, [["tamam", 88], ["hata", 9], ["isleniyor", 3]] as const),
      sureSn: tamsayi(r, 3, 90),
    });
  }
  return out;
}

/* ── Ticket geçmişi ── */
export interface KullaniciTicket {
  id: string;
  tarih: number;
  konu: string;
  kategori: string;
  durum: "acik" | "yanitlandi" | "kapandi";
}

export function uretKullaniciTicketlar(k: AdminKullanici): KullaniciTicket[] {
  const r = prng(tohumla(`ktik-${k.id}`));
  const adet = tamsayi(r, 0, 5);
  const konular = ["Ödeme sorunu", "Kredi iadesi talebi", "Üretim başarısız", "Plan değişikliği", "Hesap erişimi", "Öneri"];
  return Array.from({ length: adet }, (_, i) => ({
    id: `t-${k.id}-${i}`, tarih: BUGUN - tamsayi(r, 1, 120) * GUN,
    konu: sec(r, konular), kategori: sec(r, TICKET_KATEGORI),
    durum: agirlikliSec(r, [["kapandi", 60], ["yanitlandi", 25], ["acik", 15]] as const),
  }));
}

/* ── Fraud sinyalleri ── */
export interface FraudSinyal {
  etiket: string;
  seviye: "yuksek" | "orta" | "dusuk";
  detay: string;
}

export function fraudSinyaller(k: AdminKullanici): FraudSinyal[] {
  const r = prng(tohumla(`fraud-${k.id}`));
  const out: FraudSinyal[] = [];
  if (k.guvenSkoru < 35) out.push({ etiket: "Düşük güven skoru", seviye: "yuksek", detay: `Güven skoru ${k.guvenSkoru}/100` });
  if (r() > 0.85) out.push({ etiket: "Aynı IP'de çoklu hesap", seviye: "yuksek", detay: `${tamsayi(r, 2, 6)} hesap aynı IP` });
  if (!k.dogrulanmis) out.push({ etiket: "Doğrulanmamış e-posta", seviye: "orta", detay: "E-posta onaylanmadı" });
  if (r() > 0.9) out.push({ etiket: "Geçici e-posta domain'i", seviye: "orta", detay: "Disposable email" });
  if (r() > 0.92) out.push({ etiket: "VPN / datacenter IP", seviye: "dusuk", detay: "Proxy tespit edildi" });
  if (k.referansEden && r() > 0.88) out.push({ etiket: "Self-referral şüphesi", seviye: "orta", detay: "Aynı cihaz zinciri" });
  return out;
}

/* ── Referans getirdikleri ── */
export function referansGetirilenler(k: AdminKullanici, tumu: AdminKullanici[]): AdminKullanici[] {
  return tumu.filter((x) => x.referansEden === k.id).slice(0, 8);
}
