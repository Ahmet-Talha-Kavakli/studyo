"use client";

import { DAVET_INDIRIM } from "./kampanyalar";

/**
 * Davet bağlantısı (/d/[kod]) ile gelen ziyaretçinin kaydı.
 * Kod 30 gün saklanır; kayıt olunca hesaba işlenir ve silinir.
 * İlk plan ödemesinde DAVET_INDIRIM kadar indirim uygulanır.
 */
const ANAHTAR = "vayra-davet";
const SURE = 30 * 86_400_000;

export function davetKaydet(kod: string) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify({ kod, tarih: Date.now() })); } catch { /* depolama kapalı */ }
}

export function davetOku(): { kod: string; tarih: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(ANAHTAR) ?? "null");
    if (!v?.kod || Date.now() - v.tarih > SURE) return null;
    return v;
  } catch { return null; }
}

export function davetTemizle() {
  try { localStorage.removeItem(ANAHTAR); } catch { /* depolama kapalı */ }
}

/** İndirimli ilk ödeme tutarı. */
export const davetliFiyat = (fiyat: number) => Math.round(fiyat * (1 - DAVET_INDIRIM));
