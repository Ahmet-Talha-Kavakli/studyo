/**
 * Admin evreni — tüm seed'leri birleştirir, modül-hafızasında bir kez cache'ler.
 * ozet() türetilmiş metrikleri hesaplar (MRR/ARR/churn/LTV/CAC/kuyruk...).
 * Faz faz genişler; şimdilik kullanıcı + job + seri + özet.
 */
import { BUGUN, GUN, DK } from "../cekirdek";
import { uretKullanicilar, type AdminKullanici } from "./kullanicilar";
import { uretJoblar, type AdminJob } from "./joblar";
import { uretSeriler, uretHeatmap, type GunSeri } from "./seriler";
import { uretOturumlar, type Oturum } from "./oturumlar";

export type { AdminKullanici } from "./kullanicilar";
export type { AdminJob, JobDurum } from "./joblar";
export type { GunSeri } from "./seriler";
export type { Oturum, Olay } from "./oturumlar";

export interface AdminEvren {
  kullanicilar: AdminKullanici[];
  joblar: AdminJob[];
  seri: GunSeri[];
  heatmap: number[][];
  oturumlar: Oturum[];
}

let _cache: AdminEvren | null = null;

export function veri(): AdminEvren {
  if (_cache) return _cache;
  const kullanicilar = uretKullanicilar(10000);
  const joblar = uretJoblar(kullanicilar, 42000);
  const seri = uretSeriler(90);
  const heatmap = uretHeatmap();
  const oturumlar = uretOturumlar(kullanicilar);
  _cache = { kullanicilar, joblar, seri, heatmap, oturumlar };
  return _cache;
}

export interface AdminOzet {
  toplamKullanici: number;
  aktifKullanici: number;
  aktifAbone: number;
  yeniKayit30: number;
  mrr: number;
  arr: number;
  gelir30: number;
  maliyet30: number;
  kar30: number;
  karMarji: number;
  churnOran: number;
  arpu: number;
  ltv: number;
  cac: number;
  ltvCac: number;
  toplamJob: number;
  job24: number;
  basariOran: number;
  ortSureSn: number;
  kuyruk: number;
  isleniyor: number;
  banliSayi: number;
  silinmeTalep: number;
  anlikAktif: number;
}

let _ozetCache: AdminOzet | null = null;

export function ozet(): AdminOzet {
  if (_ozetCache) return _ozetCache;
  const { kullanicilar, joblar, seri } = veri();

  const aktif = kullanicilar.filter((k) => k.durum === "aktif");
  const aboneler = kullanicilar.filter((k) => k.plan !== "baslangic" && k.durum === "aktif");
  const mrr = aboneler.reduce((a, k) => a + k.ayCiro, 0);
  const son30 = seri.slice(-30);
  const gelir30 = son30.reduce((a, g) => a + g.gelir, 0);
  const maliyet30 = son30.reduce((a, g) => a + g.maliyet, 0);
  const kayit30 = son30.reduce((a, g) => a + g.kayit, 0);
  const churn30 = son30.reduce((a, g) => a + g.churn, 0);

  const job24Ms = BUGUN - GUN;
  const job24liste = joblar.filter((j) => j.olusturma > job24Ms);
  const tamamlanan = joblar.filter((j) => j.durum === "tamam");
  const basarili = job24liste.filter((j) => j.durum === "tamam").length;
  const ortSure = tamamlanan.reduce((a, j) => a + j.sureMs, 0) / Math.max(1, tamamlanan.length);

  const ltv = aboneler.length
    ? aboneler.reduce((a, k) => a + k.toplamOdenen, 0) / aboneler.length * 2.4
    : 0;
  const cac = 340; // ortalama edinim maliyeti ₺ (Faz 8'de attribution'dan gelecek)

  _ozetCache = {
    toplamKullanici: kullanicilar.length,
    aktifKullanici: aktif.length,
    aktifAbone: aboneler.length,
    yeniKayit30: kayit30,
    mrr,
    arr: mrr * 12,
    gelir30,
    maliyet30,
    kar30: gelir30 - maliyet30,
    karMarji: gelir30 ? ((gelir30 - maliyet30) / gelir30) * 100 : 0,
    churnOran: aboneler.length ? (churn30 / aboneler.length) * 100 : 0,
    arpu: aboneler.length ? mrr / aboneler.length : 0,
    ltv,
    cac,
    ltvCac: cac ? ltv / cac : 0,
    toplamJob: joblar.length,
    job24: job24liste.length,
    basariOran: job24liste.length ? (basarili / job24liste.length) * 100 : 0,
    ortSureSn: ortSure / 1000,
    kuyruk: joblar.filter((j) => j.durum === "kuyrukta").length,
    isleniyor: joblar.filter((j) => j.durum === "isleniyor").length,
    banliSayi: kullanicilar.filter((k) => k.durum === "banli").length,
    silinmeTalep: kullanicilar.filter((k) => k.durum === "silinme_talebi").length,
    anlikAktif: Math.round(aktif.length * 0.11), // ~%11'i o an online
  };
  return _ozetCache;
}

/** Canlı kuyruk dilimi — son 10 dk içindeki kuyrukta/işleniyor joblar. */
export function canliKuyruk(): AdminJob[] {
  const { joblar } = veri();
  const esik = BUGUN - 10 * DK;
  return joblar
    .filter((j) => j.olusturma > esik && (j.durum === "kuyrukta" || j.durum === "isleniyor"))
    .sort((a, b) => b.oncelik - a.oncelik)
    .slice(0, 40);
}

/** Kullanıcı bul (id ile). */
export function kullaniciBul(id: string): AdminKullanici | undefined {
  return veri().kullanicilar.find((k) => k.id === id);
}
