"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";
import { anahtarUretDogrulanabilir } from "@/lib/apiAnahtarDogrula";

/* ============================================================
   VAYRA CLOUD — Geliştirici Platformu deposu.

   Higgsfield Cloud birebir + bizim ekstralar:
     · API anahtarları (GERÇEK üretim: crypto.getRandomValues → vy_live_…)
     · Webhook'lar (uç nokta + olay aboneliği + imza sırrı)
     · Sandbox modu (kredi harcamayan test ortamı)
     · Çağrı günlüğü (gerçek gecikme + durum → Analitik/İstekler besler)
     · Ödeme yöntemleri + satın alma geçmişi (Faturalama)

   NOT: Anahtarın TAM değeri yalnızca oluşturulduğu anda gösterilir; sonra
   listede maskeli görünür. Yine de demoda tamamı saklanır ki "göster" düğmesi
   çalışsın (gerçek üründe sunucuda hash tutulurdu — burada kasıtlı basit).
   ============================================================ */

export type AnahtarOrtam = "canli" | "test";

export interface ApiAnahtar {
  id: string;
  ad: string;
  ortam: AnahtarOrtam;
  onEk: string; // maskeli gösterim ön-eki (vy_live_ab12…)
  tam: string; // tam anahtar
  olusturma: number;
  sonKullanim: number | null;
  cagri: number;
  /** Dakikada izin verilen istek — hız limiti paneli bunu düzenler. */
  hizLimiti: number;
}

export interface Webhook {
  id: string;
  url: string;
  olaylar: string[]; // "uretim.tamamlandi" | "uretim.basarisiz" | "kredi.dusuk" …
  sir: string; // imza sırrı (whsec_…)
  aktif: boolean;
  olusturma: number;
  sonTeslim: number | null;
  basarili: number;
  basarisiz: number;
}

/** Bir API çağrısının gerçek kaydı — Analitik ve İstekler sekmeleri buradan beslenir. */
export interface CagriKaydi {
  id: string; // req_…
  anahtarId: string | null;
  modelId: string;
  tur: "gorsel" | "video" | "ses" | "3d" | "muzik";
  durum: "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
  kredi: number;
  gecikmeMs: number;
  zaman: number;
  sandbox: boolean;
  uretimId?: string; // useProjeler.uretimler ile bağ
}

export interface OdemeYontemi {
  id: string;
  marka: "visa" | "mastercard" | "amex";
  son4: string;
  ay: number;
  yil: number;
}

export interface SatinAlma {
  id: string;
  tarih: number;
  kredi: number;
  tutar: number; // ₺
  durum: "tamamlandi" | "beklemede" | "iade";
}

export const WEBHOOK_OLAYLARI = [
  "uretim.kuyrukta",
  "uretim.tamamlandi",
  "uretim.basarisiz",
  "uretim.moderasyon",
  "kredi.dusuk",
  "anahtar.olusturuldu",
] as const;

interface ApiAnahtarState {
  anahtarlar: ApiAnahtar[];
  webhooklar: Webhook[];
  cagrilar: CagriKaydi[];
  odemeYontemleri: OdemeYontemi[];
  satinAlmalar: SatinAlma[];
  sandbox: boolean;
  otomatikYukle: boolean;

  olustur: (ad: string, ortam?: AnahtarOrtam) => Promise<ApiAnahtar>;
  sil: (id: string) => void;
  hizLimitAyarla: (id: string, limit: number) => void;

  webhookEkle: (url: string, olaylar: string[]) => Webhook;
  webhookSil: (id: string) => void;
  webhookToggle: (id: string) => void;
  webhookTest: (id: string) => boolean;

  cagriKaydet: (k: Omit<CagriKaydi, "id" | "zaman">) => string;
  cagriGuncelle: (id: string, patch: Partial<CagriKaydi>) => void;

  sandboxAyarla: (v: boolean) => void;
  odemeEkle: (y: Omit<OdemeYontemi, "id">) => void;
  odemeSil: (id: string) => void;
  otomatikYukleAyarla: (v: boolean) => void;
  krediSatinAl: (kredi: number, tutar: number) => void;
}

/** Kriptografik rastgele hex — gerçek anahtar/sır üretimi (sahte string değil). */
function rastgeleHex(bayt: number): string {
  const b = new Uint8Array(bayt);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < bayt; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Maskeli gösterim: vy_live_ab12…cd34 */
export function anahtarMaske(tam: string): string {
  if (tam.length < 20) return tam;
  return `${tam.slice(0, 16)}${"•".repeat(8)}${tam.slice(-4)}`;
}

export const useApiAnahtar = create<ApiAnahtarState>()(
  persist(
    (set, get) => ({
      anahtarlar: [],
      webhooklar: [],
      cagrilar: [],
      odemeYontemleri: [],
      satinAlmalar: [],
      sandbox: false,
      otomatikYukle: false,

      olustur: async (ad, ortam = "canli") => {
        const tam = await anahtarUretDogrulanabilir(ortam); // checksum'lı, endpoint bağımsız doğrular
        const yeni: ApiAnahtar = {
          id: `key_${rastgeleHex(8)}`,
          ad: ad.trim() || (ortam === "canli" ? "Üretim anahtarı" : "Test anahtarı"),
          ortam,
          onEk: tam.slice(0, 16),
          tam,
          olusturma: Date.now(),
          sonKullanim: null,
          cagri: 0,
          hizLimiti: ortam === "canli" ? 60 : 20,
        };
        set((s) => ({ anahtarlar: [yeni, ...s.anahtarlar] }));
        return yeni;
      },

      sil: (id) => set((s) => ({ anahtarlar: s.anahtarlar.filter((k) => k.id !== id) })),

      hizLimitAyarla: (id, limit) =>
        set((s) => ({
          anahtarlar: s.anahtarlar.map((k) => (k.id === id ? { ...k, hizLimiti: limit } : k)),
        })),

      webhookEkle: (url, olaylar) => {
        const yeni: Webhook = {
          id: `wh_${rastgeleHex(6)}`,
          url,
          olaylar: olaylar.length ? olaylar : ["uretim.tamamlandi"],
          sir: `whsec_${rastgeleHex(16)}`,
          aktif: true,
          olusturma: Date.now(),
          sonTeslim: null,
          basarili: 0,
          basarisiz: 0,
        };
        set((s) => ({ webhooklar: [yeni, ...s.webhooklar] }));
        return yeni;
      },
      webhookSil: (id) => set((s) => ({ webhooklar: s.webhooklar.filter((w) => w.id !== id) })),
      webhookToggle: (id) =>
        set((s) => ({ webhooklar: s.webhooklar.map((w) => (w.id === id ? { ...w, aktif: !w.aktif } : w)) })),
      /** Test teslimi — URL geçerliyse "başarılı" sayılır, kayıt tutulur. */
      webhookTest: (id) => {
        const w = get().webhooklar.find((x) => x.id === id);
        if (!w) return false;
        let gecerli = false;
        try { const u = new URL(w.url); gecerli = u.protocol === "https:" || u.protocol === "http:"; } catch { gecerli = false; }
        set((s) => ({
          webhooklar: s.webhooklar.map((x) =>
            x.id === id
              ? {
                  ...x,
                  sonTeslim: Date.now(),
                  basarili: gecerli ? x.basarili + 1 : x.basarili,
                  basarisiz: gecerli ? x.basarisiz : x.basarisiz + 1,
                }
              : x,
          ),
        }));
        return gecerli;
      },

      cagriKaydet: (k) => {
        const id = `req_${rastgeleHex(8)}`;
        const kayit: CagriKaydi = { ...k, id, zaman: Date.now() };
        set((s) => ({
          cagrilar: [kayit, ...s.cagrilar].slice(0, 500),
          anahtarlar: s.anahtarlar.map((a) =>
            a.id === k.anahtarId ? { ...a, cagri: a.cagri + 1, sonKullanim: Date.now() } : a,
          ),
        }));
        return id;
      },

      cagriGuncelle: (id, patch) =>
        set((s) => ({ cagrilar: s.cagrilar.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      sandboxAyarla: (v) => set({ sandbox: v }),
      odemeEkle: (y) =>
        set((s) => ({ odemeYontemleri: [...s.odemeYontemleri, { ...y, id: `pm_${rastgeleHex(4)}` }] })),
      odemeSil: (id) => set((s) => ({ odemeYontemleri: s.odemeYontemleri.filter((p) => p.id !== id) })),
      otomatikYukleAyarla: (v) => set({ otomatikYukle: v }),
      krediSatinAl: (kredi, tutar) =>
        set((s) => ({
          satinAlmalar: [
            { id: `tx_${rastgeleHex(6)}`, tarih: Date.now(), kredi, tutar, durum: "tamamlandi" },
            ...s.satinAlmalar,
          ],
        })),
    }),
    { name: "vayra-api-anahtar", version: 1, migrate: alanlariKoru },
  ),
);
