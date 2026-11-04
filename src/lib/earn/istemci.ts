"use client";

import { useEffect, useState } from "react";
import type { Platform } from "./kampanyalar";

/**
 * Earn API istemcisi — /api/earn/* uç noktalarını çağırır.
 * Ağ hatasında `gercek: false` döner; çağıran taraf simülasyona düşer.
 */
async function cagir<T>(islem: string, govde: unknown): Promise<T & { ok: boolean; gercek: boolean; hata?: string }> {
  try {
    const r = await fetch(`/api/earn/${islem}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde) });
    const j = await r.json();
    if (!r.ok) return { ok: false, gercek: true, hata: j.hata ?? "İşlem başarısız." } as never;
    return j;
  } catch {
    return { ok: true, gercek: false } as never;
  }
}

export type HesapYaniti = { bulundu?: boolean; kodVar?: boolean; takipci?: number; ad?: string };
export const hesapDogrulaIstek = (platform: Platform, kadi: string, kod: string) => cagir<HesapYaniti>("hesap", { platform, kadi, kod });

export type GonderiYaniti = { var?: boolean; sahibiMi?: boolean | null; yazar?: string; baslik?: string; kucukResim?: string };
export const gonderiKontrolIstek = (platform: Platform, link: string, kadi: string) => cagir<GonderiYaniti>("gonderi", { platform, link, kadi });

export const istatistikIstek = (platform: Platform, link: string) => cagir<{ goruntulenme?: number | null }>("istatistik", { platform, link });

export const kimlikIstek = (tckn: string, ad: string, soyad: string, dogumYili: number) => cagir<{ dogru?: boolean }>("kimlik", { tckn, ad, soyad, dogumYili });

export const cekimIstek = (o: { tur: "iban" | "papara"; hesapNo: string; tutar: number; referans: string; tckn?: string }) =>
  cagir<{ referans?: string }>("cekim", o);

export type EntegrasyonDurumu = {
  dogrulama: Record<Platform, boolean>;
  gonderiKontrol: Record<Platform, boolean>;
  istatistik: Record<Platform, boolean>;
  odeme: { papara: boolean; iban: boolean };
};

let onbellek: Promise<EntegrasyonDurumu | null> | null = null;
/** Hangi entegrasyonların canlı olduğu (oturum boyunca bir kez sorulur). */
export function useEntegrasyon() {
  const [d, setD] = useState<EntegrasyonDurumu | null>(null);
  useEffect(() => {
    onbellek ??= fetch("/api/earn/durum").then((r) => r.json()).then((j) => (j.ok ? (j as EntegrasyonDurumu) : null)).catch(() => null);
    let aktif = true;
    onbellek.then((x) => { if (aktif) setD(x); });
    return () => { aktif = false; };
  }, []);
  return d;
}
