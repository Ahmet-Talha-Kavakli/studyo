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

/* ── Ajan sohbeti (Higgsfield Usta birebir) ─────────────── */

export type MesajRol = "kullanici" | "ajan";

export interface SCAdim {
  /** Düşünce izi satırı — "Planı oluşturuyor", "40 UGC video üretiliyor" … */
  metin: string;
  tamam: boolean;
}

/** Üretilen çıktı — gerçek görsel/video ya da GERÇEK ÇALIŞAN site/oyun/uygulama (html gömülü). */
export interface SCCikti {
  id: string;
  tur: "gorsel" | "video" | "site" | "oyun" | "dashboard" | "uygulama";
  url?: string;        // görsel/video için gerçek URL veya CSS background
  html?: string;       // site/oyun/dashboard için GERÇEK çalışan tek-dosya HTML (iframe srcdoc)
  ad?: string;         // "Nova · Landing" gibi başlık
  durum: "uretiliyor" | "tamam";
  /** Sağlayıcı bağlı değilken üretilen örnek çıktı. */
  demo?: boolean;
  /** Site çıktısının üretim planı — takip istekleri bunun üstüne revize edilir. */
  plan?: import("@/lib/siteUretici").SitePlan;
}

/** Sohbetin yayınlanmış site/uygulaması (/y/<id>); anahtar yalnız bu tarayıcıda. */
export interface SCYayin { id: string; anahtar: string; ciktiId: string; zaman: number; remix: boolean }

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
  /** Model yanıtı (akış parçaları, kaynaklar, durum) — lib/scSohbet ScYanit. */
  yanit?: import("@/lib/scSohbet").ScYanit;
  /** Kullanıcı mesajının ekleri (yalnız küçük önizleme ve ad saklanır). */
  ekler?: { tur: "gorsel" | "metin"; ad: string; onizleme?: string; boyut?: number }[];
  /** Mesaj gönderilirken seçili niyet (sohbet / görsel / site). */
  niyet?: "oto" | "gorsel" | "site";
  /** Ajan işi: plan başlangıcı/bitişi ve onay/soru durumu. */
  is?: { tur: "gorsel" | "site"; basla?: number; bitis?: number; bekleyen?: "onay" | "oran"; kredi?: number; oran?: string; reddedildi?: boolean; toplam?: number };
  /** Kullanıcı geri bildirimi. */
  geri?: { puan: 1 | -1; neden?: string[]; not?: string };
  /** Kullanıcı mesajı: yanıttan alıntılanan parça (mesajın üstünde gösterilir, modele alıntı olarak gider). */
  alinti?: string;
  /** Kullanıcı mesajı: bu mesajda uygulanan beceri (ad). */
  beceri?: string;
  /** Bu mesajda "@" ile çağrılan çalışanın adı. */
  calisan?: string;
  /** Asistan yanıtı belge olarak açıldıysa: başlık ve sürümler (Belge paneli). */
  belge?: import("@/components/sc/sohbet/BelgePaneli").ScBelge;
  /** Karşılaştırma: aynı soruya ikinci modelin yanıtı (kullanıcı birini seçince kaldırılır). */
  ikinci?: import("@/lib/scSohbet").ScYanit;
  /** Asistan yanıtı: sonraki soru önerileri. */
  oneriler?: string[];
  /** Çok adımlı iş planı (onaylanınca adım adım çalışır). */
  plan?: import("@/lib/scPlan").ScPlan;
  /** Bu yanıttan sonra belleğe eklenen bilgiler ("Bellek güncellendi"). */
  anilar?: string[];
}

/** Dal: bir konumdan itibaren alternatif mesaj kuyrukları (düzenle / yeniden üret). */
export interface SCDal { surumler: SCMesaj[][]; aktif: number }

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
  /** Composer ayarları (model, düşünme, web, stil, onay). */
  ayar?: import("@/components/sc/sohbet/Composer").ScAyar;
  /** Konum (mesaj sırası) → alternatif kuyruklar. */
  dallar?: Record<string, SCDal>;
  yayin?: SCYayin;
  /** Kilitli sohbet: şifrenin SHA-256 özeti (kenar çubuğunda/aramada görünmez, açmak için şifre). */
  kilit?: string;
  /** Arşivlenmiş: kenar çubuğunda görünmez, Sohbetler › Arşiv'de durur. */
  arsiv?: boolean;
  /** Paylaşım bağlantısı (/s/<id>); anahtar yalnız bu tarayıcıda güncelleme/kaldırma için tutulur. */
  paylasim?: { id: string; anahtar: string; zaman: number };
  /** Çalışanla açılan sohbet: çalışanın talimatı ve dosyaları her mesajda modele gider. */
  calisanId?: string;
  /** Bağlı olduğu proje (talimat ve dosyalar modele bağlam olarak gider). */
  projeId?: string;
  /** Geçici sohbet: geçmişte listelenmez, tarayıcıya kaydedilmez (sayfa yenilenince/çıkınca silinir). */
  gecici?: boolean;
}

/** Proje: sohbetleri bir arada tutar; talimatı ve dosyaları her sohbette modele bağlam olarak gider. */
export interface SCProje {
  id: string;
  ad: string;
  aciklama?: string;
  /** Projeye özel talimat (sistem istemine eklenir). */
  talimat?: string;
  /** Bilgi dosyaları (yalnız metin; tarayıcıda saklandığı için boyut sınırlı). */
  dosyalar: { id: string; ad: string; boyut: number; icerik: string }[];
  olusturma: number;
  sabit?: boolean;
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

  /* Projeler */
  projeler: SCProje[];
  projeAc: (ad: string, aciklama?: string) => string;
  projeGuncelle: (id: string, patch: Partial<SCProje>) => void;
  /** Projeyi siler; sohbetleri silinmez, projeden çıkarılır. */
  projeSil: (id: string) => void;
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

      projeler: [],
      projeAc: (ad, aciklama) => {
        const id = kimlik();
        set((s) => ({ projeler: [{ id, ad, aciklama, dosyalar: [], olusturma: Date.now() }, ...s.projeler] }));
        return id;
      },
      projeGuncelle: (id, patch) => set((s) => ({ projeler: s.projeler.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      projeSil: (id) => set((s) => ({ projeler: s.projeler.filter((x) => x.id !== id), sohbetler: s.sohbetler.map((x) => (x.projeId === id ? { ...x, projeId: undefined } : x)) })),

      calisiyorAyarla: (sohbetId, calisiyor) =>
        set((s) => ({
          sohbetler: s.sohbetler.map((x) =>
            x.id === sohbetId
              ? { ...x, calisiyor, basladi: calisiyor ? Date.now() : undefined }
              : x,
          ),
        })),
    }),
    {
      name: "vayra-supercomputer", version: 2, migrate: alanlariKoru,
      // Geçici sohbetler diske yazılmaz.
      partialize: (s) => ({ ...s, sohbetler: s.sohbetler.filter((x) => !x.gecici) }),
    },
  ),
);
