"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { anahtarUretDogrulanabilir, hmacHex, rastgeleHex } from "@/lib/apiAnahtarDogrula";

/* ============================================================
   Vayra API — panel deposu.

   Anahtarlar tarayıcıda üretilir (checksum'lı, sunucu DB'siz doğrular).
   Anahtar ayarları (ad, kapsam, hız limiti, harcama sınırı, bitiş) ve
   webhook uç noktaları sunucuya PUT /v1/keys/self ile senkronlanır; sunucu
   bunları uygular. Üretimler ve webhook teslimleri sunucudan geri okunur ve
   burada aynalanır — Kullanım, İstekler ve Analitik ekranları bu aynadan
   beslenir. Canlı üretimlerin kredisi senkron sırasında hesaptan düşülür.
   ============================================================ */

export type AnahtarOrtam = "canli" | "test";
export type Kapsam = "full" | "generate" | "read";

export const KAPSAMLAR: { id: Kapsam; ad: string; ozet: string }[] = [
  { id: "full", ad: "Tam erişim", ozet: "Üretim, okuma, webhook ve teslim günlüğü." },
  { id: "generate", ad: "Yalnız üretim", ozet: "Üretim başlatır ve okur; webhook yönetemez." },
  { id: "read", ad: "Salt okunur", ozet: "Model ve üretimleri okur; üretim başlatamaz." },
];

export interface ApiAnahtar {
  id: string; // key_… (sunucu kimliğiyle aynı)
  ad: string;
  ortam: AnahtarOrtam;
  tam: string;
  olusturma: number;
  sonKullanim: number | null;
  kapsam: Kapsam;
  hizLimiti: number;
  aylikSinir: number | null;
  bitis: number | null;
}

export type DenetimTur = "anahtar" | "webhook" | "ayar" | "fatura";
/** Denetim kaydı satırı: kim değil (tek kullanıcı), ne ve hangi nesne. */
export interface DenetimKaydi { id: string; zaman: number; tur: DenetimTur; eylem: string; nesne: string; ayrinti?: string }

export interface IptalAnahtar { id: string; ad: string; tam: string; ortam: AnahtarOrtam; iptal: number }

export const OLAY_TANIM: { id: string; ad: string; ozet: string }[] = [
  { id: "generation.completed", ad: "Üretim tamamlandı", ozet: "Çıktı adresleriyle birlikte." },
  { id: "generation.failed", ad: "Üretim başarısız", ozet: "Hata kodu ve mesajıyla; kredi iade edilir." },
  { id: "generation.started", ad: "Üretim başladı", ozet: "Kuyruktan çıkıp işlenmeye başladığında." },
  { id: "generation.canceled", ad: "Üretim iptal edildi", ozet: "İptal isteği işlendiğinde." },
  { id: "credits.low", ad: "Kredi azaldı", ozet: "Bakiye belirlediğin eşiğin altına indiğinde." },
];

export interface Webhook {
  id: string;
  url: string;
  aciklama: string;
  olaylar: string[];
  sir: string;
  aktif: boolean;
  olusturma: number;
}

/** Sunucudaki üretim nesnesinin aynası. */
export interface ApiUretim {
  id: string;
  model: string;
  type: string;
  status: "queued" | "processing" | "succeeded" | "failed" | "canceled";
  input: Record<string, unknown>;
  output: { urls: string[]; content_type: string } | null;
  error: { code: string; message: string } | null;
  credits: number;
  environment: "live" | "test";
  simulated: boolean;
  provider: string | null;
  metadata: Record<string, unknown>;
  webhook_url: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  metrics: { queue_ms: number | null; run_ms: number | null };
  anahtarId: string;
}

export interface TeslimDenemesi { at: string; status: number | null; duration_ms: number; error: string | null; response: string | null }
export interface Teslim {
  id: string; event: string; event_id: string; url: string; endpoint_id: string | null; generation_id: string | null;
  state: "pending" | "succeeded" | "failed"; attempts: TeslimDenemesi[]; created_at: string; payload: string; anahtarId: string;
}

/** Panelden yapılan her HTTP çağrısının kaydı (Konsol + Oyun alanı). */
export interface Cagri {
  id: string;
  zaman: number;
  yontem: string;
  yol: string;
  durumKodu: number;
  sureMs: number;
  anahtarId: string | null;
  kaynak: "oyun-alani" | "konsol" | "panel";
  istek: string | null;
  yanit: string | null;
  uretimId: string | null;
}

export interface Olcum { zaman: number; ms: number; ok: boolean }

interface Durum {
  anahtarlar: ApiAnahtar[];
  iptaller: IptalAnahtar[];
  webhooklar: Webhook[];
  uretimler: ApiUretim[];
  teslimler: Teslim[];
  cagrilar: Cagri[];
  faturalanan: string[];
  olcumler: Olcum[];
  dusukBakiyeEsigi: number | null;
  sonSenkron: number | null;
  /** Panelde yapılan yönetim işlemleri (anahtar, webhook, ayar) — en yeni başta. */
  denetim: DenetimKaydi[];
  /** Oyun alanı ve konsolun varsayılan anahtar ortamı. */
  varsayilanOrtam: AnahtarOrtam;

  anahtarOlustur: (a: { ad: string; ortam: AnahtarOrtam; kapsam?: Kapsam; hizLimiti?: number; aylikSinir?: number | null; bitis?: number | null }) => Promise<ApiAnahtar>;
  anahtarGuncelle: (id: string, p: Partial<Pick<ApiAnahtar, "ad" | "kapsam" | "hizLimiti" | "aylikSinir" | "bitis">>) => void;
  anahtarIptal: (id: string) => void;
  anahtarDondur: (id: string, eskiyiSaatSonraKapat: number) => Promise<ApiAnahtar | null>;

  webhookEkle: (w: { url: string; aciklama: string; olaylar: string[] }) => Webhook;
  webhookGuncelle: (id: string, p: Partial<Pick<Webhook, "url" | "aciklama" | "olaylar" | "aktif">>) => void;
  webhookSil: (id: string) => void;
  webhookSirYenile: (id: string) => void;

  cagriEkle: (c: Omit<Cagri, "id" | "zaman">) => void;
  cagrilariTemizle: () => void;
  uretimleriBirlestir: (l: ApiUretim[]) => void;
  teslimleriBirlestir: (l: Teslim[]) => void;
  faturalandi: (ids: string[]) => void;
  olcumEkle: (o: Olcum) => void;
  setDusukBakiyeEsigi: (v: number | null) => void;
  setSonSenkron: (t: number) => void;
  denetimEkle: (k: Omit<DenetimKaydi, "id" | "zaman">) => void;
  setVarsayilanOrtam: (o: AnahtarOrtam) => void;
}

/** Anahtar kimliği — sunucuyla aynı türetme (lib/api/motor.anahtarKimligi). */
export async function anahtarKimligi(tam: string) {
  const govde = tam.match(/^vy_(?:live|test)_([0-9a-f]{32})/)?.[1] ?? tam;
  return `key_${(await hmacHex(`kid:${govde}`)).slice(0, 16)}`;
}
/** İstek bazlı webhook_url teslimlerinin imza sırrı — anahtardan türetilir. */
export async function istekSirri(tam: string) {
  const govde = tam.match(/^vy_(?:live|test)_([0-9a-f]{32})/)?.[1] ?? tam;
  return `whsec_${(await hmacHex(`wh:${govde}`)).slice(0, 40)}`;
}

export function anahtarMaske(tam: string): string {
  if (tam.length < 20) return tam;
  return `${tam.slice(0, 12)}${"•".repeat(10)}${tam.slice(-4)}`;
}

const sinirla = <T,>(l: T[], n: number) => (l.length > n ? l.slice(0, n) : l);

export const useApiAnahtar = create<Durum>()(
  persist(
    (set, get) => ({
      anahtarlar: [],
      iptaller: [],
      webhooklar: [],
      uretimler: [],
      teslimler: [],
      cagrilar: [],
      faturalanan: [],
      olcumler: [],
      dusukBakiyeEsigi: null,
      sonSenkron: null,
      denetim: [],
      varsayilanOrtam: "test",

      anahtarOlustur: async ({ ad, ortam, kapsam = "full", hizLimiti, aylikSinir = null, bitis = null }) => {
        const tam = await anahtarUretDogrulanabilir(ortam);
        const yeni: ApiAnahtar = {
          id: await anahtarKimligi(tam),
          ad: ad.trim() || (ortam === "canli" ? "Canlı anahtar" : "Test anahtarı"),
          ortam, tam, olusturma: Date.now(), sonKullanim: null, kapsam,
          hizLimiti: hizLimiti ?? (ortam === "canli" ? 60 : 20), aylikSinir, bitis,
        };
        set((s) => ({ anahtarlar: [yeni, ...s.anahtarlar] }));
        get().denetimEkle({ tur: "anahtar", eylem: "Anahtar oluşturuldu", nesne: yeni.ad, ayrinti: `${ortam === "canli" ? "Canlı" : "Test"} · ${kapsam}` });
        return yeni;
      },
      anahtarGuncelle: (id, p) => {
        const a = get().anahtarlar.find((x) => x.id === id);
        set((s) => ({ anahtarlar: s.anahtarlar.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        if (a) get().denetimEkle({ tur: "anahtar", eylem: "Anahtar ayarı değişti", nesne: p.ad ?? a.ad, ayrinti: Object.keys(p).map((k) => ({ ad: "ad", kapsam: "kapsam", hizLimiti: "hız limiti", aylikSinir: "aylık sınır", bitis: "bitiş" }[k] ?? k)).join(", ") });
      },
      anahtarIptal: (id) => {
        const a = get().anahtarlar.find((x) => x.id === id);
        if (!a) return;
        set((s) => ({
          anahtarlar: s.anahtarlar.filter((x) => x.id !== id),
          iptaller: sinirla([{ id: a.id, ad: a.ad, tam: a.tam, ortam: a.ortam, iptal: Date.now() }, ...s.iptaller], 100),
        }));
        get().denetimEkle({ tur: "anahtar", eylem: "Anahtar iptal edildi", nesne: a.ad });
      },
      anahtarDondur: async (id, saat) => {
        const a = get().anahtarlar.find((x) => x.id === id);
        if (!a) return null;
        const yeni = await get().anahtarOlustur({ ad: a.ad, ortam: a.ortam, kapsam: a.kapsam, hizLimiti: a.hizLimiti, aylikSinir: a.aylikSinir });
        get().denetimEkle({ tur: "anahtar", eylem: "Anahtar döndürüldü", nesne: a.ad, ayrinti: saat <= 0 ? "Eski anahtar hemen kapandı" : `Eski anahtar ${saat} saat sonra kapanır` });
        if (saat <= 0) get().anahtarIptal(id);
        else get().anahtarGuncelle(id, { bitis: Date.now() + saat * 3600_000, ad: `${a.ad} (eski)` });
        return yeni;
      },

      webhookEkle: ({ url, aciklama, olaylar }) => {
        const w: Webhook = { id: `we_${rastgeleHex(8)}`, url: url.trim(), aciklama: aciklama.trim(), olaylar, sir: `whsec_${rastgeleHex(20)}`, aktif: true, olusturma: Date.now() };
        set((s) => ({ webhooklar: [w, ...s.webhooklar] }));
        get().denetimEkle({ tur: "webhook", eylem: "Uç nokta eklendi", nesne: w.url, ayrinti: `${olaylar.length} olay` });
        return w;
      },
      webhookGuncelle: (id, p) => {
        const w = get().webhooklar.find((x) => x.id === id);
        set((s) => ({ webhooklar: s.webhooklar.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        if (w) get().denetimEkle({ tur: "webhook", eylem: p.aktif === false ? "Uç nokta durduruldu" : p.aktif === true ? "Uç nokta etkinleştirildi" : "Uç nokta güncellendi", nesne: p.url ?? w.url });
      },
      webhookSil: (id) => {
        const w = get().webhooklar.find((x) => x.id === id);
        set((s) => ({ webhooklar: s.webhooklar.filter((x) => x.id !== id) }));
        if (w) get().denetimEkle({ tur: "webhook", eylem: "Uç nokta silindi", nesne: w.url });
      },
      webhookSirYenile: (id) => {
        const w = get().webhooklar.find((x) => x.id === id);
        set((s) => ({ webhooklar: s.webhooklar.map((x) => (x.id === id ? { ...x, sir: `whsec_${rastgeleHex(20)}` } : x)) }));
        if (w) get().denetimEkle({ tur: "webhook", eylem: "İmza sırrı yenilendi", nesne: w.url });
      },

      cagriEkle: (c) => set((s) => ({
        cagrilar: sinirla([{ ...c, id: `call_${rastgeleHex(6)}`, zaman: Date.now() }, ...s.cagrilar], 300),
        anahtarlar: c.anahtarId ? s.anahtarlar.map((a) => (a.id === c.anahtarId ? { ...a, sonKullanim: Date.now() } : a)) : s.anahtarlar,
      })),
      cagrilariTemizle: () => set({ cagrilar: [] }),
      uretimleriBirlestir: (l) => {
        if (!l.length) return;
        set((s) => {
          const m = new Map(s.uretimler.map((u) => [u.id, u]));
          for (const u of l) m.set(u.id, u);
          const son = Array.from(m.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
          // Anahtarın son kullanımı: sunucuda görülen en yeni üretim
          const enYeni = new Map<string, number>();
          for (const u of l) enYeni.set(u.anahtarId, Math.max(enYeni.get(u.anahtarId) ?? 0, Date.parse(u.created_at)));
          return {
            uretimler: sinirla(son, 1000),
            anahtarlar: s.anahtarlar.map((a) => (enYeni.has(a.id) ? { ...a, sonKullanim: Math.max(a.sonKullanim ?? 0, enYeni.get(a.id)!) } : a)),
          };
        });
      },
      teslimleriBirlestir: (l) => {
        if (!l.length) return;
        set((s) => {
          const m = new Map(s.teslimler.map((t) => [t.id, t]));
          for (const t of l) m.set(t.id, t);
          return { teslimler: sinirla(Array.from(m.values()).sort((a, b) => b.created_at.localeCompare(a.created_at)), 300) };
        });
      },
      faturalandi: (ids) => set((s) => ({ faturalanan: sinirla([...ids, ...s.faturalanan], 2000) })),
      olcumEkle: (o) => set((s) => ({ olcumler: sinirla([o, ...s.olcumler], 2000) })),
      setDusukBakiyeEsigi: (v) => {
        set({ dusukBakiyeEsigi: v });
        get().denetimEkle({ tur: "fatura", eylem: v === null ? "Düşük bakiye uyarısı kapatıldı" : "Düşük bakiye eşiği ayarlandı", nesne: "Faturalama", ayrinti: v === null ? undefined : `${v} kredi` });
      },
      setSonSenkron: (t) => set({ sonSenkron: t }),
      denetimEkle: (k) => set((s) => ({ denetim: sinirla([{ ...k, id: `ev_${rastgeleHex(6)}`, zaman: Date.now() }, ...s.denetim], 500) })),
      setVarsayilanOrtam: (o) => {
        if (get().varsayilanOrtam === o) return;
        set({ varsayilanOrtam: o });
        get().denetimEkle({ tur: "ayar", eylem: "Varsayılan ortam değişti", nesne: o === "canli" ? "Canlı" : "Test" });
      },
    }),
    {
      name: "vayra-api-anahtar",
      version: 3,
      // v1 → v2: anahtarlar yeni alanlarla taşınır (kimlik senkron sırasında düzeltilir),
      // webhook olayları İngilizce kimliklere çevrilir; eski sahte ödeme kayıtları atılır.
      migrate: (eski, surum) => {
        const s = (eski ?? {}) as Record<string, unknown>;
        if (surum < 2) {
          const olay: Record<string, string> = { "uretim.tamamlandi": "generation.completed", "uretim.basarisiz": "generation.failed", "uretim.kuyrukta": "generation.started", "kredi.dusuk": "credits.low" };
          const anahtarlar = ((s.anahtarlar as Record<string, unknown>[]) ?? []).map((a) => ({
            id: a.id, ad: a.ad, ortam: a.ortam, tam: a.tam, olusturma: a.olusturma, sonKullanim: a.sonKullanim ?? null,
            kapsam: "full", hizLimiti: a.hizLimiti ?? (a.ortam === "canli" ? 60 : 20), aylikSinir: null, bitis: null,
          }));
          const webhooklar = ((s.webhooklar as Record<string, unknown>[]) ?? []).map((w) => ({
            id: String(w.id).replace(/^wh_/, "we_"), url: w.url, aciklama: "", sir: w.sir, aktif: w.aktif !== false, olusturma: w.olusturma ?? Date.now(),
            olaylar: Array.from(new Set(((w.olaylar as string[]) ?? []).map((o) => olay[o]).filter(Boolean))),
          }));
          return { anahtarlar, webhooklar, iptaller: [], uretimler: [], teslimler: [], cagrilar: [], faturalanan: [], olcumler: [], dusukBakiyeEsigi: null, sonSenkron: null, denetim: [], varsayilanOrtam: "test" };
        }
        if (surum < 3) return { ...s, denetim: [], varsayilanOrtam: "test" };
        return s;
      },
    },
  ),
);
