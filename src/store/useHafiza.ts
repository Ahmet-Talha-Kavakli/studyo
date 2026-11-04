import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export type HafizaKategori = "kimlik" | "is" | "tercih" | "proje" | "diger";
export const HAFIZA_KATEGORILERI: { id: HafizaKategori; ad: string }[] = [
  { id: "kimlik", ad: "Hakkımda" }, { id: "is", ad: "İş" }, { id: "proje", ad: "Projeler" }, { id: "tercih", ad: "Tercihler" }, { id: "diger", ad: "Diğer" },
];
/** Metinden kategori tahmini (kullanıcı sonradan değiştirebilir). */
export function kategoriTahmin(metin: string): HafizaKategori {
  const t = metin.toLocaleLowerCase("tr");
  if (/(tercih|sever|sevmez|sevmiyor|istemiyor|istiyor|kısa|uzun|maddeli|ton|üslup|biçim|format|emoji|yanıt|cevap|hitap)/.test(t)) return "tercih";
  if (/(proje|uygulama|site|ürün|kampanya|lansman|kitap|kanal|podcast|oyun|marka)/.test(t)) return "proje";
  if (/(çalış|meslek|şirket|işlet|görev|ekip|müşteri|sektör|girişim|kurucu|freelance|ajans|yönetici|geliştirici|tasarımcı|(^|\s)iş(i|im|inde)?(\s|$))/.test(t)) return "is";
  if (/(^|\s)(adı|adım|ismi|ismim|yaşında|doğum|yaşıyor|evli|anadili|öğrenci)|şehr|ülke|çocu/.test(t)) return "kimlik";
  return "diger";
}

export interface HafizaOge {
  id: string;
  metin: string;
  olusturma: number;
  kategori?: HafizaKategori;
  /** Nereden geldi: elle, sohbetten (otomatik ya da "bunu hatırla"), başka bir yapay zekâdan aktarım. */
  kaynak?: "elle" | "sohbet" | "aktarim";
  /** Kapatılmış öğe hatırlanmaya devam eder ama isteme eklenmez (Claude davranışı). */
  kapali?: boolean;
}

/** Kişisel talimatlar (ChatGPT "özel talimatlar" / Claude "kişisel tercihler"). */
export interface HafizaProfil { hitap: string; is: string; tercih: string }

interface HafizaState {
  profil: HafizaProfil;
  profilAyarla: (p: HafizaProfil) => void;
  /** Hafıza tümden açık mı — Claude'daki ana anahtar. */
  acik: boolean;
  ogeler: HafizaOge[];
  acikAyarla: (v: boolean) => void;
  ekle: (metin: string, secenek?: { kategori?: HafizaKategori; kaynak?: HafizaOge["kaynak"] }) => void;
  /** Toplu ekleme (aktarım/otomatik); aynı metin varsa atlanır. Eklenen sayısını döndürür. */
  topluEkle: (metinler: string[], kaynak: HafizaOge["kaynak"]) => number;
  kategoriAyarla: (id: string, kategori: HafizaKategori) => void;
  /** Sohbetlerden otomatik hatırla (yanıttan sonra kalıcı bilgiler modelce çıkarılır). */
  otomatik: boolean;
  otomatikAyarla: (v: boolean) => void;
  guncelle: (id: string, metin: string) => void;
  degistir: (id: string) => void;
  sil: (id: string) => void;
  tumunuSil: () => void;
}

let sayac = 0;

/**
 * Usta hafızası — kullanıcı marka/tercih bilgisi; ajanlar her üretimde
 * hatırlar. Kalıcı.
 *
 * Claude'un hafıza ekranıyla eşleşmesi için genişletildi: ana açma/kapama
 * anahtarı, öğe düzenleme, öğe bazında devre dışı bırakma ve toplu silme.
 * (Bu ekran daha önce "otomatik yönetiliyor" denip kaldırılmıştı; Claude'da
 * hafıza kullanıcının görüp düzenlediği gerçek bir ayardır.)
 */
/** Modele giden kişisel bağlam: talimatlar + açık bellek öğeleri. Boşsa undefined. */
export function kisiselBaglam(): { hitap?: string; is?: string; tercih?: string; bellek?: string[] } | undefined {
  const s = useHafiza.getState();
  const bellek = s.acik ? s.ogeler.filter((o) => !o.kapali).map((o) => o.metin).slice(0, 60) : [];
  const p = s.profil ?? { hitap: "", is: "", tercih: "" };
  const b = { ...(p.hitap.trim() ? { hitap: p.hitap.trim() } : {}), ...(p.is.trim() ? { is: p.is.trim() } : {}), ...(p.tercih.trim() ? { tercih: p.tercih.trim() } : {}), ...(bellek.length ? { bellek } : {}) };
  return Object.keys(b).length ? b : undefined;
}

export const useHafiza = create<HafizaState>()(
  persist(
    (set) => ({
      acik: true,
      // Boş başlar: kullanıcı yazmadığı bir şeyi "hatırlıyormuş" gibi göstermek yanıltıcıydı.
      ogeler: [],
      profil: { hitap: "", is: "", tercih: "" },
      profilAyarla: (profil) => set({ profil }),
      acikAyarla: (v) => set({ acik: v }),
      otomatik: true,
      otomatikAyarla: (v) => set({ otomatik: v }),
      ekle: (metin, secenek) => {
        sayac += 1;
        set((s) => ({
          ogeler: [{ id: `h_${sayac}_${Math.floor(performance.now())}`, metin, olusturma: Date.now(), kategori: secenek?.kategori ?? kategoriTahmin(metin), kaynak: secenek?.kaynak ?? "elle" }, ...s.ogeler],
        }));
      },
      topluEkle: (metinler, kaynak) => {
        let n = 0;
        set((s) => {
          const var_ = new Set(s.ogeler.map((o) => o.metin.toLocaleLowerCase("tr").trim()));
          const yeni: HafizaOge[] = [];
          for (const m of metinler) {
            const k = m.toLocaleLowerCase("tr").trim();
            if (!k || var_.has(k)) continue;
            var_.add(k); sayac += 1; n += 1;
            yeni.push({ id: `h_${sayac}_${Math.floor(performance.now())}`, metin: m.trim(), olusturma: Date.now(), kategori: kategoriTahmin(m), kaynak });
          }
          return { ogeler: [...yeni, ...s.ogeler] };
        });
        return n;
      },
      kategoriAyarla: (id, kategori) => set((s) => ({ ogeler: s.ogeler.map((x) => (x.id === id ? { ...x, kategori } : x)) })),
      guncelle: (id, metin) =>
        set((s) => ({ ogeler: s.ogeler.map((x) => (x.id === id ? { ...x, metin } : x)) })),
      degistir: (id) =>
        set((s) => ({ ogeler: s.ogeler.map((x) => (x.id === id ? { ...x, kapali: !x.kapali } : x)) })),
      sil: (id) => set((s) => ({ ogeler: s.ogeler.filter((x) => x.id !== id) })),
      tumunuSil: () => set({ ogeler: [] }),
    }),
    {
      name: "vayra-hafiza", version: 3,
      // v3: eski sürümün örnek ("seed") anıları kullanıcıya ait değildi — atılır.
      migrate: (eski, surum) => {
        const d = alanlariKoru(eski, surum) as Partial<HafizaState>;
        return { ...d, ogeler: (d.ogeler ?? []).filter((o) => !o.id.startsWith("h_seed_")) } as HafizaState;
      },
    },
  ),
);
