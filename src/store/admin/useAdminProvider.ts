"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PROVIDERLAR } from "@/lib/admin/tablolar";

/* Provider (AI sağlayıcı) yönetimi — panelden düzenlenebilir bağlantı + limit + failover ayarları.
   Seed default'u (tablolar.ts + providerDetay.ts) üstüne override; anlık geçerli, deploy beklemez.
   apiKey maskeli tutulur (asla düz anahtar saklanmaz); rotate yeni maskeli anahtar üretir. */

export interface ProviderAyar {
  apiKey: string;              // maskeli gösterim, örn "sk-fal-••••3f9a"
  baseUrl: string;
  rateLimit: number;           // istek/dk
  esZamanlilikLimiti: number;  // aynı anda açık istek
  oncelik: number;             // 1 = en yüksek
  aktif: boolean;
  circuitBreakerEsik: number;  // hata % — bu eşiği aşınca devre açılır
  failoverHedef: string;       // başka provider id ("" = yok)
  alarmEsigiUsd: number;       // bakiye bu tutarın altına inince alarm
}

/* Provider id → varsayılan bağlantı ayarları. baseUrl gerçek endpoint desenleri. */
const VARSAYILAN_BASE: Record<string, string> = {
  fal: "https://fal.run/fal-ai",
  kie: "https://api.kie.ai/v1",
  replicate: "https://api.replicate.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  openai: "https://api.openai.com/v1",
  elevenlabs: "https://api.elevenlabs.io/v1",
};

const ANAHTAR_ONEK: Record<string, string> = {
  fal: "key-fal",
  kie: "sk-kie",
  replicate: "r8",
  google: "AIza",
  openai: "sk-proj",
  elevenlabs: "sk-el",
};

/* Deterministik maskeli anahtar kuyruğu (SSR/seed-safe; store dışı ilk üretim sabit). */
function maskeliAnahtar(onek: string, tohum: string): string {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) {
    h ^= tohum.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const kuyruk = (h >>> 0).toString(16).slice(0, 4).padStart(4, "0");
  return `${onek}-••••••••${kuyruk}`;
}

function varsayilanAyarlar(): Record<string, ProviderAyar> {
  const out: Record<string, ProviderAyar> = {};
  for (const p of PROVIDERLAR) {
    const yedek = PROVIDERLAR.find((x) => x.id !== p.id);
    out[p.id] = {
      apiKey: maskeliAnahtar(ANAHTAR_ONEK[p.id] ?? "sk", `init-${p.id}`),
      baseUrl: VARSAYILAN_BASE[p.id] ?? "https://api.example.com/v1",
      rateLimit: p.oncelik === 1 ? 600 : p.oncelik === 2 ? 300 : 120,
      esZamanlilikLimiti: p.oncelik === 1 ? 40 : p.oncelik === 2 ? 24 : 12,
      oncelik: p.oncelik,
      aktif: true,
      circuitBreakerEsik: 5,
      failoverHedef: yedek?.id ?? "",
      alarmEsigiUsd: p.alarmEsigiUsd,
    };
  }
  return out;
}

interface ProviderState {
  ayarlar: Record<string, ProviderAyar>;

  ayar: (id: string) => ProviderAyar;
  guncelle: (id: string, delta: Partial<ProviderAyar>) => void;
  keyRotate: (id: string) => string; // yeni maskeli anahtar üretir + kaydeder, döndürür
  toggle: (id: string) => void;
  failoverAyarla: (id: string, hedef: string) => void;
}

export const useAdminProvider = create<ProviderState>()(
  persist(
    (set, get) => ({
      ayarlar: varsayilanAyarlar(),

      ayar: (id) => get().ayarlar[id] ?? varsayilanAyarlar()[id],

      guncelle: (id, delta) =>
        set((s) => ({ ayarlar: { ...s.ayarlar, [id]: { ...(s.ayarlar[id] ?? varsayilanAyarlar()[id]), ...delta } } })),

      keyRotate: (id) => {
        const mevcut = get().ayarlar[id] ?? varsayilanAyarlar()[id];
        const onek = mevcut.apiKey.split("-").slice(0, 2).join("-") || (ANAHTAR_ONEK[id] ?? "sk");
        // store action → Date.now serbest (kullanıcı tıklamasıyla çalışır)
        const yeni = maskeliAnahtar(onek, `rotate-${id}-${Date.now()}`);
        set((s) => ({ ayarlar: { ...s.ayarlar, [id]: { ...mevcut, apiKey: yeni } } }));
        return yeni;
      },

      toggle: (id) =>
        set((s) => {
          const mevcut = s.ayarlar[id] ?? varsayilanAyarlar()[id];
          return { ayarlar: { ...s.ayarlar, [id]: { ...mevcut, aktif: !mevcut.aktif } } };
        }),

      failoverAyarla: (id, hedef) =>
        set((s) => {
          const mevcut = s.ayarlar[id] ?? varsayilanAyarlar()[id];
          return { ayarlar: { ...s.ayarlar, [id]: { ...mevcut, failoverHedef: hedef } } };
        }),
    }),
    { name: "vayra-admin-provider", version: 1 },
  ),
);
