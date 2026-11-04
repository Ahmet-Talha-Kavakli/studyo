"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Bildirim merkezi verisi.
 *
 * Bildirimler gerçek olaylardan üretilir: üretim tamamlandı / başarısız
 * (uretimMotoru), kredi azaldı, satın alma ve plan değişikliği (fiyat bileşenleri),
 * sınırsız erişimin bitmesine az kaldı (useBildirimGozcusu). Kategori, panelin
 * sekmelerini ve ikonunu belirler; `gorsel` varsa satırda küçük resim gösterilir.
 */
export type BildirimKategori = "uretim" | "hesap" | "duyuru" | "earn";
export type BildirimTur = "basari" | "bilgi" | "uyari" | "hata";

export interface Bildirim {
  id: string;
  kategori: BildirimKategori;
  tur: BildirimTur;
  baslik: string;
  mesaj: string;
  okundu: boolean;
  zaman: number;
  /** Satıra tıklanınca gidilecek rota. */
  link?: string;
  /** Satırdaki birincil buton; yoksa yalnız satır tıklanabilir. */
  eylem?: { ad: string; link: string };
  /** Küçük resim (üretim çıktısı, model görseli). */
  gorsel?: string;
  /** İlgili üretimin kimliği — kitaplıkta o üretimin lightbox'ı açılır. */
  uretimId?: string;
  /** Aynı olayın tekrar tekrar bildirilmesini engelleyen anahtar (ör. "kredi-dusuk"). */
  anahtar?: string;
  /** Demo çıktısı (gerçek sağlayıcı değil) — başlığa yazılmaz, rozet olarak gösterilir. */
  demo?: boolean;
  /** Arşivlenme zamanı; arşivdekiler gelen kutusunda görünmez, 30 gün sonra silinir. */
  arsiv?: number;
}

export type YeniBildirim = Omit<Bildirim, "id" | "zaman" | "okundu">;

interface BildirimState {
  bildirimler: Bildirim[];
  /** Kapatılan tanıtım kartlarının kimlikleri. */
  kapatilanKartlar: string[];
  ekle: (b: YeniBildirim) => void;
  /** `anahtar` ile aynı olayı yalnızca bir kez (ya da soğuma süresi sonra) bildirir. */
  ekleTek: (b: YeniBildirim & { anahtar: string }, soguma?: number) => void;
  okunduIsaretle: (id: string) => void;
  okunmadiIsaretle: (id: string) => void;
  tumunuOku: (kategori?: BildirimKategori) => void;
  sil: (id: string) => Bildirim | undefined;
  geriYukle: (b: Bildirim) => void;
  tumunuSil: () => void;
  arsivle: (ids: string[]) => Bildirim[];
  arsivdenCikar: (ids: string[]) => void;
  /** Gelen kutusundaki (isteğe bağlı kategori) tüm okunmuşları arşive taşır. */
  okunanlariArsivle: () => number;
  arsiviBosalt: () => void;
  kartKapat: (id: string) => void;
}

const UST_SINIR = 200;
const ARSIV_OMRU = 30 * 86_400_000;
let sayac = 0;
const yeniId = () => `b_${Date.now().toString(36)}_${(sayac += 1)}`;

const DK = 60_000, SA = 3_600_000, GUN = 86_400_000;

/** İlk açılış örnekleri — gerçek olay biçiminde (kategori, görsel, eylem). */
function ornekler(): Bildirim[] {
  const t = Date.now();
  return [
    { id: "o1", kategori: "uretim", tur: "basari", okundu: false, zaman: t - 4 * DK,
      baslik: "Video hazır", mesaj: "\"Yağmurlu ara sokak, neon yansımalar\" · Kling 3.0 · 5 sn",
      gorsel: "/gercek/proje-kesfet/kesfet-04.webp", link: "/panel/kitaplik", eylem: { ad: "Görüntüle", link: "/panel/kitaplik" } },
    { id: "o2", kategori: "uretim", tur: "basari", okundu: false, zaman: t - 26 * DK,
      demo: true, baslik: "4 görsel hazır", mesaj: "\"Mermer zeminde lüks saat, dramatik yan ışık\" · Nano Banana Pro",
      gorsel: "/gercek/proje-kesfet/kesfet-03.webp", link: "/panel/kitaplik", eylem: { ad: "Görüntüle", link: "/panel/kitaplik" } },
    { id: "o3", kategori: "duyuru", tur: "bilgi", okundu: false, zaman: t - 3 * SA,
      baslik: "Kling 4.0 Vayra'da", mesaj: "30 saniyelik doğal video, 15 referans ve 10 anahtar kare. Video stüdyosunda dene.",
      gorsel: "/gercek/hero-video/seedance-banner-poster.webp", link: "/panel/video", eylem: { ad: "Dene", link: "/panel/video" } },
    { id: "o4", kategori: "hesap", tur: "uyari", okundu: true, zaman: t - 20 * SA,
      baslik: "Kredin azalıyor", mesaj: "Bakiyende 640 kredi kaldı. Kesintisiz üretim için kredi yükleyebilirsin.",
      link: "/panel/kredi?sekme=kredi", eylem: { ad: "Kredi yükle", link: "/panel/kredi?sekme=kredi" }, anahtar: "kredi-dusuk" },
    { id: "o5", kategori: "uretim", tur: "hata", okundu: true, zaman: t - 26 * SA,
      baslik: "Üretim tamamlanamadı", mesaj: "\"Kapadokya balonları\" · Seedance 2.0 · Sağlayıcı zaman aşımı. 42 kredi iade edildi.",
      link: "/panel/video", eylem: { ad: "Tekrar dene", link: "/panel/video" } },
    { id: "o6", kategori: "duyuru", tur: "bilgi", okundu: true, zaman: t - 3 * GUN,
      baslik: "Fiyatlar artık Türk lirası", mesaj: "Tüm planlar ve paketler TL; yıllık ödemede %20 indirim.",
      link: "/fiyatlandirma", eylem: { ad: "Planları gör", link: "/fiyatlandirma" } },
    { id: "o7", kategori: "hesap", tur: "basari", okundu: true, zaman: t - 6 * GUN,
      baslik: "Vayra'ya hoş geldin", mesaj: "Hesabına 50 kredi hoş geldin hediyesi tanımlandı.",
      link: "/panel", eylem: { ad: "Üretmeye başla", link: "/panel" } },
  ];
}

/** Eski kayıtlarda kategori yoktu — içerikten tahmin edilir. */
function kategoriTahmin(b: Partial<Bildirim>): BildirimKategori {
  if (b.uretimId || /üretim/i.test(b.baslik ?? "")) return "uretim";
  if ((b.link ?? "").includes("/panel/kredi") || /kredi/i.test(b.baslik ?? "")) return "hesap";
  return "duyuru";
}

export const useBildirim = create<BildirimState>()(
  persist(
    (set, get) => ({
      bildirimler: ornekler(),
      kapatilanKartlar: [],
      ekle: (b) =>
        set((s) => ({ bildirimler: [{ ...b, id: yeniId(), zaman: Date.now(), okundu: false }, ...s.bildirimler].slice(0, UST_SINIR) })),
      ekleTek: (b, soguma = 6 * SA) => {
        const varOlan = get().bildirimler.find((x) => x.anahtar === b.anahtar);
        if (varOlan && Date.now() - varOlan.zaman < soguma) return;
        set((s) => ({
          bildirimler: [{ ...b, id: yeniId(), zaman: Date.now(), okundu: false }, ...s.bildirimler.filter((x) => x.anahtar !== b.anahtar)].slice(0, UST_SINIR),
        }));
      },
      okunduIsaretle: (id) => set((s) => ({ bildirimler: s.bildirimler.map((x) => (x.id === id ? { ...x, okundu: true } : x)) })),
      okunmadiIsaretle: (id) => set((s) => ({ bildirimler: s.bildirimler.map((x) => (x.id === id ? { ...x, okundu: false } : x)) })),
      tumunuOku: (kategori) =>
        set((s) => ({ bildirimler: s.bildirimler.map((x) => (!kategori || x.kategori === kategori ? { ...x, okundu: true } : x)) })),
      sil: (id) => {
        const b = get().bildirimler.find((x) => x.id === id);
        set((s) => ({ bildirimler: s.bildirimler.filter((x) => x.id !== id) }));
        return b;
      },
      // Silmeyi geri al: zamana göre doğru yerine geri koyar.
      geriYukle: (b) => set((s) => ({ bildirimler: [...s.bildirimler.filter((x) => x.id !== b.id), b].sort((x, y) => y.zaman - x.zaman) })),
      tumunuSil: () => set({ bildirimler: [] }),
      arsivle: (ids) => {
        const t = Date.now(), giden = get().bildirimler.filter((x) => ids.includes(x.id) && !x.arsiv);
        set((s) => ({ bildirimler: s.bildirimler.map((x) => (ids.includes(x.id) && !x.arsiv ? { ...x, arsiv: t, okundu: true } : x)) }));
        return giden;
      },
      arsivdenCikar: (ids) => set((s) => ({ bildirimler: s.bildirimler.map((x) => (ids.includes(x.id) ? { ...x, arsiv: undefined } : x)) })),
      okunanlariArsivle: () => {
        const t = Date.now(); let n = 0;
        set((s) => ({ bildirimler: s.bildirimler.map((x) => (!x.arsiv && x.okundu ? (n++, { ...x, arsiv: t }) : x)) }));
        return n;
      },
      arsiviBosalt: () => set((s) => ({ bildirimler: s.bildirimler.filter((x) => !x.arsiv) })),
      kartKapat: (id) => set((s) => ({ kapatilanKartlar: s.kapatilanKartlar.includes(id) ? s.kapatilanKartlar : [...s.kapatilanKartlar, id] })),
    }),
    {
      name: "vayra-bildirim",
      version: 5,
      // v3 → v4: kategori ve eylem alanları eklendi; eski örnek (emoji'li, sahte) kayıtlar yenileriyle değişir.
      migrate: (kayitli, surum) => {
        const k = (kayitli ?? {}) as Partial<BildirimState>;
        // v4 → v5: başlıktaki "(demo · kredi iade edildi)" eki demo bayrağına, earn olayları kendi kategorisine taşındı.
        if (surum < 5 && k.bildirimler) {
          k.bildirimler = k.bildirimler.map((b) => {
            const m = / \(demo[^)]*\)$/.exec(b.baslik);
            const earn = (b.link ?? "").startsWith("/earn");
            return { ...b, baslik: m ? b.baslik.slice(0, m.index) : b.baslik, demo: b.demo || !!m || undefined, kategori: earn ? "earn" : b.kategori };
          });
        }
        if (surum < 4) {
          const gercek = (k.bildirimler ?? []).filter((b) => !/^b\d$/.test(b.id)).map((b) => ({ ...b, kategori: b.kategori ?? kategoriTahmin(b) }));
          return { ...k, bildirimler: [...gercek, ...ornekler()].sort((a, b) => b.zaman - a.zaman).slice(0, UST_SINIR), kapatilanKartlar: [] } as BildirimState;
        }
        return k as BildirimState;
      },
      // Açılışta 30 günden eski arşivleri temizle.
      onRehydrateStorage: () => (s) => {
        if (!s) return;
        const sinir = Date.now() - ARSIV_OMRU;
        if (s.bildirimler.some((b) => b.arsiv && b.arsiv < sinir)) useBildirim.setState({ bildirimler: s.bildirimler.filter((b) => !b.arsiv || b.arsiv >= sinir) });
      },
    },
  ),
);

/** Okunmamış sayısı (isteğe bağlı kategori filtresiyle). */
export const okunmamisSay = (liste: Bildirim[], kategori?: BildirimKategori) =>
  liste.filter((b) => !b.okundu && !b.arsiv && (!kategori || b.kategori === kategori)).length;
