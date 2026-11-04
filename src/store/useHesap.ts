"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "./useAuth";
import { cihazBilgisi } from "@/lib/guvenlik";

/**
 * Hesap kayıtları — e-posta başına: şifre özeti, iki adımlı doğrulama, oturumlar,
 * kredi ve ödeme hareketleri, fatura bilgileri, abonelik durumu, kullanılan kodlar.
 * Ayarlar sayfaları ve giriş akışı (AuthKart) bu depoyu kullanır.
 */

export interface Oturum { id: string; tarayici: string; isletim: string; tur: "masaustu" | "mobil" | "tablet"; baslangic: number; sonGorulme: number }

export type HareketTur = "kredi" | "plan" | "sinirsiz" | "hiz" | "promo" | "hediye" | "odul" | "iade" | "hediye-gonder";
export interface Hareket {
  id: string;
  zaman: number;
  tur: HareketTur;
  aciklama: string;
  /** Hesaba eklenen (+) ya da düşen (−) kredi. */
  kredi: number;
  /** KDV hariç tutar (₺); ödemesiz hareketlerde yok. */
  tutar?: number;
  kdv?: number;
  /** Makbuz numarası (ödemeli hareketlerde). */
  belgeNo?: string;
}

export interface FaturaBilgisi {
  tip: "bireysel" | "kurumsal";
  adSoyad: string;
  tckn: string;
  unvan: string;
  vkn: string;
  vergiDairesi: string;
  adres: string;
  il: string;
  ilce: string;
  postaKodu: string;
  eposta: string;
}

export type OlayTur = "giris" | "giris-hatali" | "cikis" | "kayit" | "sifre" | "2fa-ac" | "2fa-kapat" | "yedek-kod" | "yedek-yenile" | "eposta" | "oturum-kapat" | "veri-indir";
export interface GuvenlikOlayi { id: string; zaman: number; tur: OlayTur; cihaz: string; ayrinti?: string }

export interface IkiAdim { sir: string; aktif: boolean; acilis: number | null; yedekler: { kod: string; kullanildi: number | null }[] }

export interface HesapKaydi {
  olusturma: number;
  sifre?: { hash: string; tuz: string; guncelleme: number };
  ikiAdim?: IkiAdim;
  oturumlar: Oturum[];
  olaylar: GuvenlikOlayi[];
  /** Sosyal girişle açıldıysa sağlayıcı (google, apple, microsoft). */
  saglayici?: string;
  hareketler: Hareket[];
  fatura?: FaturaBilgisi;
  abonelik: { donem: "aylik" | "yillik"; baslangic: number; iptal: boolean; iptalTarihi: number | null; sonrakiDonem?: "aylik" | "yillik"; sonrakiDonemTarihi?: number; iptalNedeni?: string };
  kodlar: string[];
  /** Gönderilen hediye kodları. */
  gonderilenler?: { kod: string; kredi: number; zaman: number; not?: string }[];
}

const yeni = (): HesapKaydi => ({ olusturma: Date.now(), oturumlar: [], olaylar: [], hareketler: [], abonelik: { donem: "aylik", baslangic: Date.now(), iptal: false, iptalTarihi: null }, kodlar: [] });
const anahtar = (e: string) => e.trim().toLowerCase();
const id = (on: string) => `${on}_${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")}`;

interface Durum {
  hesaplar: Record<string, HesapKaydi>;
  getir: (email: string) => HesapKaydi;
  guncelle: (email: string, f: (h: HesapKaydi) => HesapKaydi) => void;
  hareketEkle: (email: string, h: Omit<Hareket, "id" | "zaman" | "belgeNo"> & { belge?: boolean }) => Hareket;
  sil: (email: string) => void;
}

export const useHesap = create<Durum>()(
  persist(
    (set, get) => ({
      hesaplar: {},
      getir: (email) => get().hesaplar[anahtar(email)] ?? yeni(),
      guncelle: (email, f) => set((s) => ({ hesaplar: { ...s.hesaplar, [anahtar(email)]: f(s.hesaplar[anahtar(email)] ?? yeni()) } })),
      hareketEkle: (email, h) => {
        const { belge, ...geri } = h;
        const yil = new Date().getFullYear();
        const sira = (get().getir(email).hareketler.filter((x) => x.belgeNo).length + 1).toString().padStart(5, "0");
        const kayit: Hareket = { ...geri, id: id("hr"), zaman: Date.now(), ...(belge ? { belgeNo: `VYR-${yil}-${sira}` } : {}) };
        get().guncelle(email, (x) => ({ ...x, hareketler: [kayit, ...x.hareketler].slice(0, 500) }));
        return kayit;
      },
      sil: (email) => set((s) => { const h = { ...s.hesaplar }; delete h[anahtar(email)]; return { hesaplar: h }; }),
    }),
    {
      name: "vayra-hesap",
      version: 2,
      migrate: (eski) => {
        const d = eski as { hesaplar?: Record<string, HesapKaydi> };
        for (const h of Object.values(d.hesaplar ?? {})) h.olaylar ??= [];
        return d as Durum;
      },
    },
  ),
);

/* ── Oturumlar ve güvenlik olayları ── */

/** Bu tarayıcıdaki oturumun kimliği (sekmeler arasında ortak). */
const OTURUM_ANAHTARI = "vayra-oturum";
export function buOturum(): string | null {
  try { return localStorage.getItem(OTURUM_ANAHTARI); } catch { return null; }
}

const cihazAdi = () => { const c = cihazBilgisi(); return `${c.tarayici} · ${c.isletim}`; };

export function olayYaz(email: string, tur: OlayTur, ayrinti?: string) {
  const o: GuvenlikOlayi = { id: id("ev"), zaman: Date.now(), tur, cihaz: cihazAdi(), ...(ayrinti ? { ayrinti } : {}) };
  useHesap.getState().guncelle(email, (h) => ({ ...h, olaylar: [o, ...(h.olaylar ?? [])].slice(0, 200) }));
}

/** Girişte çağrılır: bu cihaz için yeni oturum açar ve olayı kaydeder. */
export function oturumBaslat(email: string, yontem: string) {
  const c = cihazBilgisi();
  const o: Oturum = { id: id("ss"), tarayici: c.tarayici, isletim: c.isletim, tur: c.tur, baslangic: Date.now(), sonGorulme: Date.now() };
  const onceki = buOturum();
  useHesap.getState().guncelle(email, (h) => ({ ...h, oturumlar: [o, ...h.oturumlar.filter((x) => x.id !== onceki)].slice(0, 20) }));
  try { localStorage.setItem(OTURUM_ANAHTARI, o.id); } catch { /* gizli pencere */ }
  olayYaz(email, "giris", yontem);
}

/** Çıkışta çağrılır: bu cihazın oturumunu kapatır. */
export function oturumBitir(email: string) {
  const s = buOturum();
  useHesap.getState().guncelle(email, (h) => ({ ...h, oturumlar: h.oturumlar.filter((x) => x.id !== s) }));
  try { localStorage.removeItem(OTURUM_ANAHTARI); } catch { /* */ }
  olayYaz(email, "cikis");
}

/** Giriş yapmış kullanıcının hesabına hareket yazar (React dışından çağrılabilir). */
export function hareketYaz(h: Omit<Hareket, "id" | "zaman" | "belgeNo"> & { belge?: boolean }) {
  const email = useAuth.getState().kullanici?.email;
  if (!email) return null;
  return useHesap.getState().hareketEkle(email, h);
}

export const KDV_ORANI = 0.2;
export const yeniId = id;
