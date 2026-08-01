"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Geliştirici/API platformu — persist "vayra-admin-apikey".
   Gerçek API anahtarı + webhook + rate limit tier CRUD (kalıcı). */

export type ApiScope = "read" | "write" | "admin";

export interface ApiKey {
  id: string;
  ad: string;
  /** Maskeli gösterim: vay_live_xxxx...son4 */
  anahtar: string;
  scope: ApiScope[];
  olusturma: number;
  sonKullanim: number | null;
  aktif: boolean;
  istekSayisi: number;
}

export type WebhookOlay =
  | "job.completed"
  | "job.failed"
  | "payment.success"
  | "payment.failed"
  | "balance.low"
  | "moderation.flagged";

export const WEBHOOK_OLAYLAR: WebhookOlay[] = [
  "job.completed",
  "job.failed",
  "payment.success",
  "payment.failed",
  "balance.low",
  "moderation.flagged",
];

export interface Webhook {
  id: string;
  url: string;
  olaylar: WebhookOlay[];
  aktif: boolean;
  sonDurum: number | null; // son HTTP durum kodu (200/500...) veya null
  sonTeslim: number | null;
  gizliAnahtar: string;
  basari: number;
  basarisiz: number;
}

export interface RateTier {
  id: string;
  ad: string;
  istekDk: number;
  istekGun: number;
  esZamanli: number;
}

/** Tam anahtarı maskele: vay_live_ + ilk 4 + ... + son 4 */
function maskele(tam: string): string {
  // tam: "vay_live_<40 hex>"
  const on = "vay_live_";
  const govde = tam.slice(on.length);
  if (govde.length <= 8) return tam;
  return `${on}${govde.slice(0, 4)}...${govde.slice(-4)}`;
}

function randHex(n: number): string {
  let s = "";
  const h = "0123456789abcdef";
  for (let i = 0; i < n; i++) s += h[Math.floor(Math.random() * 16)];
  return s;
}

/** Yeni tam anahtar üret (bir kez gösterilir). */
export function yeniTamAnahtar(): string {
  return `vay_live_${randHex(40)}`;
}
function yeniGizli(): string {
  return `whsec_${randHex(32)}`;
}
function id(pre: string): string {
  return `${pre}_${Date.now().toString(36)}${randHex(4)}`;
}

const VARSAYILAN_KEYLER: ApiKey[] = [
  { id: "key_prod01", ad: "Production API", anahtar: "vay_live_a3f2...9c41", scope: ["read", "write"], olusturma: Date.UTC(2026, 4, 12), sonKullanim: Date.UTC(2026, 6, 27, 8, 20), aktif: true, istekSayisi: 1_284_003 },
  { id: "key_ci02", ad: "CI/CD Pipeline", anahtar: "vay_live_7b19...02de", scope: ["read"], olusturma: Date.UTC(2026, 5, 3), sonKullanim: Date.UTC(2026, 6, 26, 22, 10), aktif: true, istekSayisi: 88_420 },
  { id: "key_admin03", ad: "Yönetim scripti", anahtar: "vay_live_ce88...4a10", scope: ["read", "write", "admin"], olusturma: Date.UTC(2026, 3, 21), sonKullanim: null, aktif: false, istekSayisi: 12_004 },
];

const VARSAYILAN_WEBHOOKLAR: Webhook[] = [
  { id: "wh_ac01", url: "https://app.acme.co/hooks/vayra", olaylar: ["job.completed", "job.failed"], aktif: true, sonDurum: 200, sonTeslim: Date.UTC(2026, 6, 27, 9, 12), gizliAnahtar: "whsec_2f9a1c4e7b0d3a6f9e2c5b8d1a4f7c0e", basari: 8420, basarisiz: 14 },
  { id: "wh_pay02", url: "https://api.studio.io/webhook/payments", olaylar: ["payment.success", "payment.failed"], aktif: true, sonDurum: 200, sonTeslim: Date.UTC(2026, 6, 27, 7, 40), gizliAnahtar: "whsec_9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a", basari: 3120, basarisiz: 3 },
  { id: "wh_low03", url: "https://n8n.brand.com/vayra/balance", olaylar: ["balance.low"], aktif: false, sonDurum: 500, sonTeslim: Date.UTC(2026, 6, 25, 3, 5), gizliAnahtar: "whsec_4a7c0e3f6a9b2c5d8e1f4a7c0e3f6a9b", basari: 210, basarisiz: 41 },
];

const VARSAYILAN_TIERLER: RateTier[] = [
  { id: "baslangic", ad: "Başlangıç", istekDk: 20, istekGun: 1000, esZamanli: 2 },
  { id: "arti", ad: "Artı", istekDk: 60, istekGun: 10000, esZamanli: 5 },
  { id: "ultra", ad: "Ultra", istekDk: 300, istekGun: 100000, esZamanli: 20 },
  { id: "kurumsal", ad: "Kurumsal", istekDk: 1200, istekGun: 2000000, esZamanli: 100 },
];

interface ApiKeyState {
  keyler: ApiKey[];
  webhooklar: Webhook[];
  tierler: RateTier[];

  /** Yeni anahtar üretir, store'a maskeli kaydeder, TAM anahtarı döndürür (bir kez). */
  keyOlustur: (ad: string, scope: ApiScope[]) => { id: string; tam: string };
  keyIptal: (id: string) => void;
  /** Rotate: yeni tam anahtar üretir, döndürür, maskesini günceller, istek sayacını korur. */
  keyRotate: (id: string) => string | null;
  keyToggle: (id: string) => void;

  webhookEkle: (url: string, olaylar: WebhookOlay[]) => void;
  webhookSil: (id: string) => void;
  webhookToggle: (id: string) => void;
  /** Test teslimi: son durumu 200 olarak günceller + başarı sayacını artırır. */
  webhookTest: (id: string) => void;

  tierGuncelle: (id: string, alan: "istekDk" | "istekGun" | "esZamanli", deger: number) => void;
}

export const useAdminApiKey = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      keyler: VARSAYILAN_KEYLER,
      webhooklar: VARSAYILAN_WEBHOOKLAR,
      tierler: VARSAYILAN_TIERLER,

      keyOlustur: (ad, scope) => {
        const tam = yeniTamAnahtar();
        const yeni: ApiKey = {
          id: id("key"),
          ad: ad.trim() || "Adsız anahtar",
          anahtar: maskele(tam),
          scope: scope.length ? scope : ["read"],
          olusturma: Date.now(),
          sonKullanim: null,
          aktif: true,
          istekSayisi: 0,
        };
        set((s) => ({ keyler: [yeni, ...s.keyler] }));
        return { id: yeni.id, tam };
      },
      keyIptal: (kid) => set((s) => ({ keyler: s.keyler.filter((k) => k.id !== kid) })),
      keyRotate: (kid) => {
        const varMi = get().keyler.find((k) => k.id === kid);
        if (!varMi) return null;
        const tam = yeniTamAnahtar();
        set((s) => ({
          keyler: s.keyler.map((k) =>
            k.id === kid ? { ...k, anahtar: maskele(tam), olusturma: Date.now(), aktif: true } : k,
          ),
        }));
        return tam;
      },
      keyToggle: (kid) => set((s) => ({ keyler: s.keyler.map((k) => (k.id === kid ? { ...k, aktif: !k.aktif } : k)) })),

      webhookEkle: (url, olaylar) =>
        set((s) => ({
          webhooklar: [
            {
              id: id("wh"),
              url: url.trim(),
              olaylar: olaylar.length ? olaylar : ["job.completed"],
              aktif: true,
              sonDurum: null,
              sonTeslim: null,
              gizliAnahtar: yeniGizli(),
              basari: 0,
              basarisiz: 0,
            },
            ...s.webhooklar,
          ],
        })),
      webhookSil: (wid) => set((s) => ({ webhooklar: s.webhooklar.filter((w) => w.id !== wid) })),
      webhookToggle: (wid) => set((s) => ({ webhooklar: s.webhooklar.map((w) => (w.id === wid ? { ...w, aktif: !w.aktif } : w)) })),
      webhookTest: (wid) =>
        set((s) => ({
          webhooklar: s.webhooklar.map((w) =>
            w.id === wid ? { ...w, sonDurum: 200, sonTeslim: Date.now(), basari: w.basari + 1 } : w,
          ),
        })),

      tierGuncelle: (tid, alan, deger) =>
        set((s) => ({
          tierler: s.tierler.map((t) => (t.id === tid ? { ...t, [alan]: Math.max(0, Math.round(deger)) } : t)),
        })),
    }),
    { name: "vayra-admin-apikey", version: 1 },
  ),
);
