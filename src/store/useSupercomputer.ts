import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export type SCKip = "app" | "site" | "oyun";
export type SCDurum = "kuyrukta" | "planlaniyor" | "kodlaniyor" | "test" | "tamam";

export interface SCIs {
  id: string;
  ad: string;
  kip: SCKip;
  durum: SCDurum;
  ilerleme: number;
  tohum: string;
  olusturma: number;
}

/* ── Ajan sohbeti (Higgsfield Supercomputer birebir) ─────────────── */

export type MesajRol = "kullanici" | "ajan";

export interface SCAdim {
  /** Düşünce izi satırı — "Planı oluşturuyor", "40 UGC video üretiliyor" … */
  metin: string;
  tamam: boolean;
}

/** Üretilen çıktı — gerçek görsel/video ya da GERÇEK ÇALIŞAN site/oyun/uygulama (html gömülü). */
export interface SCCikti {
  id: string;
  tur: "gorsel" | "video" | "site" | "oyun" | "dashboard";
  url?: string;        // görsel/video için gerçek URL veya CSS background
  html?: string;       // site/oyun/dashboard için GERÇEK çalışan tek-dosya HTML (iframe srcdoc)
  ad?: string;         // "Nova · Landing" gibi başlık
  durum: "uretiliyor" | "tamam";
}

export interface SCMesaj {
  id: string;
  rol: MesajRol;
  metin: string;
  /** Ajan mesajının düşünce izi (chevron ile açılır) — ESKİ alan. */
  adimlar?: SCAdim[];
  /**
   * Ajan araç-çağrısı ağacı (Claude tarzı akış).
   * Üretim BİTTİKTEN SONRA da mesajla birlikte saklanır: önce akış yalnızca
   * `calisiyor` iken ekrandaydı ve iş bitince tamamen kayboluyordu; Claude'da
   * ise tamamlanan adımlar katlanmış olarak sohbette kalır.
   * Tip: AjanOlay[] (lib/scAjanOlay) — store'un lib'e bağımlı olmaması için
   * burada yapısal olarak gevşek tutulur.
   */
  olaylar?: unknown[];
  /** Üretilen medya/çıktı (galeri/önizleme sütununda gösterilir) */
  ciktilar?: SCCikti[];
  zaman: number;
}

export interface SCSohbet {
  id: string;
  baslik: string;
  mesajlar: SCMesaj[];
  calisiyor: boolean;
  /** Üretim başlangıcı — "Ns'dir çalışıyor" sayacı için */
  basladi?: number;
  /** Ajan çalışma modu: onaylı = her üretimden önce onay iste; otomatik = onaysız çalış */
  onayModu?: "otomatik" | "onayli";
  /** Seçilen model (composer'dan) */
  model?: string;
  /** Sohbet listesinde üste sabitlensin mi */
  sabit?: boolean;
  olusturma: number;
}

interface SupercomputerState {
  /* İşler (mevcut API — kırılmasın) */
  isler: SCIs[];
  ekle: (is: Omit<SCIs, "olusturma">) => void;
  guncelle: (id: string, patch: Partial<SCIs>) => void;
  sil: (id: string) => void;

  /* Sohbetler */
  sohbetler: SCSohbet[];
  sohbetAc: (baslik: string, opts?: { onayModu?: "otomatik" | "onayli"; model?: string }) => string;
  sohbetSil: (id: string) => void;
  /** Ayarlar › Genel "Tüm sohbetleri sil" için — geçmişi tümden temizler. */
  sohbetleriTemizle: () => void;
  sohbetGuncelle: (id: string, patch: Partial<SCSohbet>) => void;
  sohbetYenidenAdlandir: (id: string, baslik: string) => void;
  sohbetSabitle: (id: string) => void;
  mesajEkle: (sohbetId: string, mesaj: Omit<SCMesaj, "id" | "zaman">) => string;
  mesajGuncelle: (sohbetId: string, mesajId: string, patch: Partial<SCMesaj>) => void;
  calisiyorAyarla: (sohbetId: string, calisiyor: boolean) => void;
}

const kimlik = () => Math.random().toString(36).slice(2, 10);

export const useSupercomputer = create<SupercomputerState>()(
  persist(
    (set) => ({
      isler: [],
      ekle: (is) => set((s) => ({ isler: [{ ...is, olusturma: Date.now() }, ...s.isler] })),
      guncelle: (id, patch) =>
        set((s) => ({ isler: s.isler.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      sil: (id) => set((s) => ({ isler: s.isler.filter((x) => x.id !== id) })),

      sohbetler: [],

      sohbetAc: (baslik, opts) => {
        const id = kimlik();
        set((s) => ({
          sohbetler: [
            { id, baslik, mesajlar: [], calisiyor: false, olusturma: Date.now(), onayModu: opts?.onayModu ?? "otomatik", model: opts?.model ?? "Fable 5" },
            ...s.sohbetler,
          ],
        }));
        return id;
      },

      sohbetSil: (id) => set((s) => ({ sohbetler: s.sohbetler.filter((x) => x.id !== id) })),
      sohbetleriTemizle: () => set({ sohbetler: [] }),
      sohbetGuncelle: (id, patch) => set((s) => ({ sohbetler: s.sohbetler.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      sohbetYenidenAdlandir: (id, baslik) =>
        set((s) => ({
          sohbetler: s.sohbetler.map((x) => (x.id === id ? { ...x, baslik } : x)),
        })),

      sohbetSabitle: (id) =>
        set((s) => ({
          sohbetler: s.sohbetler.map((x) => (x.id === id ? { ...x, sabit: !x.sabit } : x)),
        })),

      mesajEkle: (sohbetId, mesaj) => {
        const id = kimlik();
        set((s) => ({
          sohbetler: s.sohbetler.map((x) =>
            x.id === sohbetId
              ? { ...x, mesajlar: [...x.mesajlar, { ...mesaj, id, zaman: Date.now() }] }
              : x,
          ),
        }));
        return id;
      },

      mesajGuncelle: (sohbetId, mesajId, patch) =>
        set((s) => ({
          sohbetler: s.sohbetler.map((x) =>
            x.id === sohbetId
              ? {
                  ...x,
                  mesajlar: x.mesajlar.map((m) => (m.id === mesajId ? { ...m, ...patch } : m)),
                }
              : x,
          ),
        })),

      calisiyorAyarla: (sohbetId, calisiyor) =>
        set((s) => ({
          sohbetler: s.sohbetler.map((x) =>
            x.id === sohbetId
              ? { ...x, calisiyor, basladi: calisiyor ? Date.now() : undefined }
              : x,
          ),
        })),
    }),
    { name: "vayra-supercomputer", version: 2, migrate: alanlariKoru },
  ),
);
