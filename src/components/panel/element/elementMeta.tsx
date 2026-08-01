"use client";

import { UserRound, MapPin, Box, Palette } from "lucide-react";
import { toast } from "@/lib/toast";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { baglantiyiKopyala, uretimIndir } from "@/lib/gercekEylem";
import { onizlemeArka } from "@/lib/utils";

/** Element tür meta'sı — stüdyo sayfası, New/Edit modal ve seçici popup ortak kullanır. */
/* `hex`: cam rozetlerde renk karışımı için ham değer gerekiyor —
   Tailwind sınıfı (`text-sky-300`) color-mix() içinde kullanılamaz. */
export const TUR_META: Record<ElementTur, { ad: string; ingAd: string; ikon: typeof UserRound; renk: string; hex: string; kat: string }> = {
  karakter: { ad: "Karakter", ingAd: "Character", ikon: UserRound, renk: "text-sky-300", hex: "#7dd3fc", kat: "portre" },
  mekan: { ad: "Mekân", ingAd: "Location", ikon: MapPin, renk: "text-emerald-300", hex: "#6ee7b7", kat: "manzara" },
  obje: { ad: "Obje", ingAd: "Prop", ikon: Box, renk: "text-amber-300", hex: "#fcd34d", kat: "urun" },
  stil: { ad: "Stil", ingAd: "Style", ikon: Palette, renk: "text-violet-300", hex: "#c4b5fd", kat: "soyut" },
};

export const FILTRELER: { id: "tumu" | ElementTur; ad: string }[] = [
  { id: "tumu", ad: "Tümü" },
  { id: "karakter", ad: "Karakterler" },
  { id: "mekan", ad: "Mekânlar" },
  { id: "obje", ad: "Objeler" },
  { id: "stil", ad: "Stiller" },
];

export type Siralama = "olusturma" | "kullanim" | "ad";
export const SIRALAMALAR: { id: Siralama; ad: string }[] = [
  { id: "olusturma", ad: "Son oluşturulan" },
  { id: "kullanim", ad: "Son kullanılan" },
  { id: "ad", ad: "Ad" },
];

/* ------------------------------------------------------------------ */
/* GERÇEK ELEMENT EYLEMLERİ (M9) — toast'lar artık gerçeği anlatıyor.  */
/* ------------------------------------------------------------------ */

/** Elementi GERÇEKTEN çoğaltır (store'a yazar) ve yeni id'yi döner. */
export function elementiCogalt(e: VElement): string | null {
  const yid = useElements.getState().cogalt(e.id);
  if (!yid) {
    toast.error("Kopyalanamadı");
    return null;
  }
  const yeni = useElements.getState().elementler.find((x) => x.id === yid);
  toast.success("Element kopyalandı", { description: `@${yeni?.ad ?? e.ad} kütüphanene eklendi` });
  return yid;
}

/** Elementin paylaşım bağlantısını GERÇEKTEN panoya kopyalar. */
export function elementiPaylas(e: VElement) {
  return baglantiyiKopyala(`/panel/element?el=${encodeURIComponent(e.ad)}`, "Paylaşım bağlantısı kopyalandı");
}

/** Elementi GERÇEKTEN indirir: görseli varsa görsel, yoksa künye JSON'u. */
export function elementiIndir(e: VElement) {
  const gorsel = e.gorseller?.find(Boolean);
  return uretimIndir({
    baslik: e.ad,
    prompt: e.aciklama,
    model: TUR_META[e.tur].ad,
    tur: e.tur,
    arac: "Element",
    id: e.id,
    gorselUrl: gorsel || onizlemeArka(e.tohum, TUR_META[e.tur].kat),
  });
}
