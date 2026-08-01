"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Kullanici {
  ad: string;
  email: string;
  plan: "baslangic" | "arti" | "ultra" | "kurumsal";
  krediler: number;
  /** Satın alınan ek kredi paketleri toplamı — halka paydasına eklenir (M10). */
  ekKredi?: number;
  avatar?: string;
  // Profil alanları (Higgsfield Edit profile karşılığı)
  slogan?: string; // headline
  bio?: string;
  konum?: string;
  sosyal?: { x?: string; instagram?: string; youtube?: string; tiktok?: string };
}

interface AuthState {
  kullanici: Kullanici | null;
  girisYapildi: boolean;
  girisYap: (email: string, ad?: string) => void;
  kayitOl: (ad: string, email: string) => void;
  cikisYap: () => void;
  krediDus: (miktar: number) => boolean;
  krediEkle: (miktar: number) => void;
  /** Satın alınan paket — hem bakiyeyi hem kotayı (halka paydası) artırır. */
  ekKrediEkle: (miktar: number) => void;
  profilGuncelle: (patch: Partial<Kullanici>) => void;
}

const varsayilanKullanici = (ad: string, email: string): Kullanici => ({
  ad,
  email,
  plan: "arti",
  krediler: 1000,
});

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      kullanici: null,
      girisYapildi: false,
      girisYap: (email, ad) =>
        set({
          kullanici: varsayilanKullanici(ad ?? email.split("@")[0], email),
          girisYapildi: true,
        }),
      kayitOl: (ad, email) =>
        set({ kullanici: varsayilanKullanici(ad, email), girisYapildi: true }),
      cikisYap: () => set({ kullanici: null, girisYapildi: false }),
      krediDus: (miktar) => {
        const k = get().kullanici;
        if (!k || k.krediler < miktar) return false;
        set({ kullanici: { ...k, krediler: k.krediler - miktar } });
        return true;
      },
      krediEkle: (miktar) => {
        const k = get().kullanici;
        if (!k) return;
        set({ kullanici: { ...k, krediler: k.krediler + miktar } });
      },
      profilGuncelle: (patch) => {
        const k = get().kullanici;
        if (!k) return;
        set({ kullanici: { ...k, ...patch } });
      },
      ekKrediEkle: (miktar) => {
        const k = get().kullanici;
        if (!k) return;
        set({ kullanici: { ...k, krediler: k.krediler + miktar, ekKredi: (k.ekKredi ?? 0) + miktar } });
      },
    }),
    { name: "vayra-auth" },
  ),
);

/** Plan başına AYLIK kredi kotası (KrediModal'daki PLANLAR ile aynı). */
export const PLAN_AYLIK_KREDI: Record<Kullanici["plan"], number> = {
  baslangic: 300,
  arti: 1200,
  ultra: 3000,
  kurumsal: 12000,
};

export const PLAN_ADI: Record<Kullanici["plan"], string> = {
  baslangic: "Başlangıç",
  arti: "Plus",
  ultra: "Ultra",
  kurumsal: "Kurumsal",
};

/**
 * Kredi doluluk oranı ve rengi (M10 — avatar halkası).
 * Payda = planın aylık kotası + satın alınan ek kredi paketleri.
 * Renk eşiği: >%80 yeşil · >%50 sarı · >%30 turuncu · altı kırmızı.
 */
export function krediDurum(k: Kullanici | null): {
  oran: number; renk: string; toplam: number; kalan: number; etiket: string;
} {
  if (!k) return { oran: 0, renk: "#ef4444", toplam: 0, kalan: 0, etiket: "Kredi yok" };
  const taban = PLAN_AYLIK_KREDI[k.plan] ?? 300;
  const toplam = Math.max(1, taban + (k.ekKredi ?? 0));
  const kalan = Math.max(0, k.krediler);
  const oran = Math.max(0, Math.min(1, kalan / toplam));
  const renk =
    oran > 0.8 ? "#4ade80"      // yeşil
      : oran > 0.5 ? "#facc15"  // sarı
        : oran > 0.3 ? "#fb923c" // turuncu
          : "#ef4444";           // kırmızı
  const etiket =
    oran > 0.8 ? "Kredin bol"
      : oran > 0.5 ? "Kredin yeterli"
        : oran > 0.3 ? "Kredin azalıyor"
          : "Kredin kritik";
  return { oran, renk, toplam, kalan, etiket };
}
