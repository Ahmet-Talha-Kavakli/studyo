"use client";

import { create } from "zustand";
import * as A from "@/lib/alan/istemci";
import type { AlanOzet } from "@/lib/alan/tipler";
import { useAuth } from "./useAuth";
import { toast } from "@/lib/toast";

/**
 * Çalışma alanı deposu (önbellek; kaynak sunucu). etkin null ise kişisel alan.
 * Alan değişince sunucu çerezi ve hesap kaydını yazar; ekrandaki kredi (useAuth.kullanici.krediler) /api/hesap/ben ile
 * etkin alanın cüzdanına eşitlenir. Sayfalar "vayra-alan" olayıyla yenilenir.
 */
interface AlanDurum {
  alanlar: AlanOzet[];
  etkin: A.EtkinOzet | null;
  katilabilir: A.Katilabilir | null;
  yuklendi: boolean;
  geciliyor: string | null;
  yukle: () => Promise<void>;
  /** id null: kişisel alan. */
  gec: (id: string | null, sessiz?: boolean) => Promise<boolean>;
  olustur: (ad: string) => Promise<AlanOzet | null>;
  /** /api/hesap/ben yanıtındaki etkin alan (useAuth.benUygula çağırır). */
  benAlan: (a: A.EtkinOzet | null) => void;
  temizle: () => void;
}

const duyur = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event("vayra-alan")); };

export const useAlan = create<AlanDurum>()((set, get) => ({
  alanlar: [],
  etkin: null,
  katilabilir: null,
  yuklendi: false,
  geciliyor: null,
  yukle: async () => {
    const r = await A.alanlarGetir();
    if (!r.ok) { set({ yuklendi: true }); return; }
    const once = get().etkin?.id ?? null;
    set({ alanlar: r.alanlar, etkin: r.etkin, katilabilir: r.katilabilir, yuklendi: true });
    if ((r.etkin?.id ?? null) !== once) { void useAuth.getState().esitle(); duyur(); }
  },
  gec: async (id, sessiz) => {
    if ((get().etkin?.id ?? null) === id) return true;
    set({ geciliyor: id ?? "kisisel" });
    const r = await A.etkinSec(id);
    set({ geciliyor: null });
    if (!r.ok) { toast.error("Alan değiştirilemedi", { description: r.hata }); return false; }
    set({ etkin: r.etkin });
    await useAuth.getState().esitle();
    void get().yukle();
    duyur();
    if (!sessiz) toast(r.etkin ? `${r.etkin.ad} alanına geçtin` : "Kişisel alana geçtin", { description: r.etkin ? "Üretimler ve Build harcamaları bu alanın ortak kredisinden düşer." : "Harcamalar kişisel bakiyenden düşer." });
    return true;
  },
  olustur: async (ad) => {
    const r = await A.alanOlustur(ad);
    if (!r.ok) { toast.error("Alan oluşturulamadı", { description: r.hata }); return null; }
    await get().yukle();
    await useAuth.getState().esitle();
    duyur();
    return r.alan;
  },
  benAlan: (a) => {
    const once = get().etkin?.id ?? null;
    set({ etkin: a });
    if ((a?.id ?? null) !== once) duyur();
  },
  temizle: () => set({ alanlar: [], etkin: null, katilabilir: null, yuklendi: false }),
}));

/** Etkin alan değişince (ya da sayfa yeniden odaklanınca) çalışan etki için yardımcı. */
export function alanDegisinceDinle(f: () => void) {
  window.addEventListener("vayra-alan", f);
  return () => window.removeEventListener("vayra-alan", f);
}
