"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { sahipAnahtari } from "@/lib/build/istemci";
import type { Deney, EkVeri, KampanyaOzet, Kisi, SaatProfili } from "@/lib/build/buyumeEkTipler";
import type { AkisIstemci } from "@/lib/build/buyumeAkisTipler";
import type { AnilmaMotor } from "@/lib/build/buyumeGorunurluk";
import type { SosyalAg } from "@/lib/build/buyumeKanalTipler";
import { useAuth } from "@/store/useAuth";

export type DeneyIstemci = Deney & { a: { g: number; d: number }; b: { g: number; d: number }; yayinda: boolean; taslakta: boolean };
export type EkIstemci = Omit<EkVeri, "kampanyalar" | "deneyler" | "akislar"> & { kampanyalar: KampanyaOzet[]; deneyler: DeneyIstemci[]; akislar: AkisIstemci[] };
export type IsletmeOzet = { kuponlar: { kod: string; ozet: string; bitis?: string }[]; hizmetler: { id: string; ad: string }[]; terkAcik: boolean; profilAd: string; googleProfil: string; whatsapp: string; sosyal: Record<string, string>; logo: string; kvkk: string; gizlilik?: string; ulkeKodu?: string; postaAdresi?: string; saatDilimi?: string; randevuAcik: boolean };
export type EkYanit = {
  ek: EkIstemci; kisiler: Kisi[]; model: string | null; site: string; koken: string; gsc: boolean;
  eposta: { kurulu: boolean; deneme: boolean; gonderen: string; alanDogrulandi: boolean };
  sosyal: { id: "meta" | "x" | "linkedin" | "tiktok"; anahtar: boolean; eksik: string[] }[];
  akisSon?: number; akisUyari?: string; saatProfili: SaatProfili; isletme: IsletmeOzet;
  sosyalDurum: { ag: SosyalAg; anahtar: boolean; eksik: string[]; bagli: boolean; donus: string }[];
  gbpDurum: { anahtar: boolean; eksik: string[]; bagli: boolean; konum: { hesap: string; konum: string; ad: string; adres?: string } | null; donus: string };
  iysDurum: { anahtar: boolean; eksik: string[]; adres: string };
  motorlar: { id: AnilmaMotor; anahtar: boolean; eksik: string[] }[]; bioAdres: string | null;
};
export class ModelYokEk extends Error {}

/**
 * Büyüme v4 veri kancası (kişiler, e-posta, bağlantılar, denemeler, marka, kodlar, saatler, rakipler, SEO, rapor).
 * Sunucu her düzenlemeden sonra güncel hâli döndürür; süren gönderim varsa 4 sn'de bir yoklanır.
 */
export function useBuyumeEk(projeId: string) {
  const [d, setD] = useState<EkYanit | null>(null);
  const [hata, setHata] = useState("");
  const [suren, setSuren] = useState<string[]>([]);
  const yol = `/api/build/buyume/${projeId}/ek`;
  const iste = useCallback(async (method: string, govde?: unknown) => {
    const r = await fetch(yol, { method, headers: { "x-build-sahip": sahipAnahtari(), ...(govde ? { "Content-Type": "application/json" } : {}) }, body: govde ? JSON.stringify(govde) : undefined, cache: "no-store" });
    let j: Record<string, unknown> = {};
    try { j = await r.json(); } catch { /* boş */ }
    return { durum: r.status, j };
  }, [yol]);
  const yukle = useCallback(async () => {
    try { const { j } = await iste("GET"); if (j.ok) setD(j as unknown as EkYanit); else setHata(String(j.hata ?? "Büyüme verisi okunamadı.")); } catch { setHata("Büyüme verisi okunamadı."); }
  }, [iste]);
  useEffect(() => { yukle(); }, [yukle]);
  const gonderiyor = !!d?.ek.kampanyalar.some((k) => k.durum === "gonderiliyor" && k.sayac.bekliyor > 0 && (!k.sayac.sonraki || k.sayac.sonraki - Date.now() < 60_000));
  const akisAcik = !!d?.ek.akislar?.some((a) => a.durum === "acik") || !!d?.ek.kampanyalar.some((k) => k.durum === "gonderiliyor");
  const yoklama = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (!gonderiyor && !akisAcik) return; yoklama.current = setTimeout(() => { if (document.visibilityState === "visible") yukle(); }, gonderiyor ? 4000 : 30_000); return () => { if (yoklama.current) clearTimeout(yoklama.current); }; }, [gonderiyor, akisAcik, d, yukle]);
  // OAuth penceresi bitince (buyume-genel/oauth) veriyi yenile.
  useEffect(() => { const f = (e: MessageEvent) => { if (e.origin === location.origin && e.data && typeof e.data === "object" && "vayraBuyumeOauth" in e.data) yukle(); }; addEventListener("message", f); return () => removeEventListener("message", f); }, [yukle]);

  /** Düzenleme: hata olursa Error atar (çağıran gösterir). */
  const duzenle = useCallback(async (tur: string, govde: Record<string, unknown> = {}) => {
    const { j } = await iste("PATCH", { tur, ...govde });
    if (!j.ok) throw new Error(String(j.hata ?? "Kaydedilemedi."));
    setD(j as unknown as EkYanit);
    return j;
  }, [iste]);
  /** İşlem: model yoksa ModelYokEk atar; kredi düşer. */
  const islem = useCallback(async (ad: string, govde: Record<string, unknown> = {}, anahtar = ad) => {
    setSuren((l) => [...l, anahtar]);
    try {
      const { durum, j } = await iste("POST", { islem: ad, ...govde });
      if (durum === 424 && j.modelYok) throw new ModelYokEk(String(j.hata ?? "Model bağlı değil."));
      if (!j.ok) throw new Error(String(j.hata ?? "İşlem tamamlanamadı."));
      if (j.ek) setD(j as unknown as EkYanit);
      buildKrediUygula(j);
      return j;
    } finally { setSuren((l) => { const i = l.indexOf(anahtar); return i < 0 ? l : [...l.slice(0, i), ...l.slice(i + 1)]; }); }
  }, [iste]);
  return { d, hata, setHata, yukle, duzenle, islem, suruyor: (a: string) => suren.includes(a) };
}
export type EkKanca = ReturnType<typeof useBuyumeEk>;
