import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "./gocHelper";
import { KATALOG, uyumlu, type DugumTur, type PortTip } from "@/lib/tuval/katalog";
import { ayarNormalize } from "@/lib/tuval/ayarlar";

/**
 * Canvas deposu (sıfırdan): tuvaller, düğümler, tipli bağlantılar, düğüm başına sürüm geçmişi,
 * tuval başına geri al / yinele (bellekte, 60 adım). Yüklenen dosyalar sunucuya gider; depoda yalnız URL kalır.
 */
export type Surum = { id: string; tip: PortTip; url?: string; metin?: string; zaman: number; demo?: boolean; poster?: string;
  /** 3D düğümü: model dosyası (görsel çıktı önizlemesidir). */
  glb?: string };
/** Çalıştırma geçmişi kaydı (son 40). */
export type CalismaAdim = { dugum: string; ad: string; tur: DugumTur; durum: "sirada" | "calisiyor" | "bitti" | "hata" | "atlandi"; bas?: number; bit?: number; kredi: number; hata?: string };
export type CalismaKaydi = { id: string; bas: number; bit?: number; kapsam: "tum" | "secili" | "tek"; adimlar: CalismaAdim[] };
/** Tuval yorumu: konuma ya da düğüme iğnelenir; yanıtlanır, çözülür. */
export type YorumYanit = { id: string; yazar: string; renk: string; metin: string; zaman: number };
export type Yorum = { id: string; x: number; y: number; dugum?: string; yazar: string; renk: string; metin: string; zaman: number; cozuldu?: boolean; yanitlar: YorumYanit[] };
export type DugumDurum = "bos" | "sirada" | "calisiyor" | "bitti" | "hata";
export type Dugum = {
  id: string; tur: DugumTur; x: number; y: number;
  /** İstem / not / asistan talimatı metni. */
  metin?: string;
  model?: string;
  ayar: Record<string, string | number | boolean>;
  surumler: Surum[]; aktif: number;
  durum: DugumDurum; hata?: string; baslangic?: number;
  /** Kilitli: taşınmaz, silinmez, düzenlenmez. */
  kilit?: boolean;
  /** Küçültülmüş (yalnız başlık). */
  kucuk?: boolean;
  /** Girdiler son çalıştırmadan sonra değişti (yeniden üretilmeli). */
  eski?: boolean;
  ad?: string;
  renk?: string;
  /** Devre dışı: "Tümünü çalıştır" atlar, son sonucu aşağıya akmaya devam eder. */
  kapali?: boolean;
  /** Renk etiketi (düzenleme için; port rengini değiştirmez). */
  etiket?: string;
};
export type Kenar = { id: string; kaynak: string; hedef: string; port: string };
/** Grup çerçevesi (Ctrl G): içindeki düğümler birlikte taşınır. */
export type Grup = { id: string; ad: string; renk: string; dugumler: string[] };
export type Gorunum = { x: number; y: number; z: number };
export type Tuval = { id: string; ad: string; olusturma: number; guncelleme: number; dugumler: Dugum[]; kenarlar: Kenar[]; gruplar?: Grup[]; gorunum: Gorunum; sablon?: string;
  /** Salt okunur paylaşım (/t/<id>); anahtar yalnız bu tarayıcıda. */
  paylasim?: { id: string; anahtar: string; zaman: number };
  /** Uygulama olarak yayın (/a/<id>) ve form ayarı. */
  uygulama?: { id?: string; anahtar?: string; zaman?: number; ad: string; aciklama: string; girdiler: { dugum: string; etiket: string; aciklama?: string; zorunlu?: boolean }[]; ciktilar: { dugum: string; etiket: string }[] };
  /** Uygulama çalıştırması için geçici kopya: listede görünmez. */
  gizli?: boolean;
  gecmis?: CalismaKaydi[];
  yorumlar?: Yorum[];
  /** Birlikte düzenleme: sunucudaki ortak belge ve düzenleme anahtarı. */
  ortak?: { id: string; anahtar: string; sahip?: boolean } };

let sayac = 0;
export const yeniId = (on: string) => `${on}${Date.now().toString(36)}${(++sayac).toString(36)}`;

export function dugumOlustur(tur: DugumTur, x: number, y: number, p: Partial<Dugum> = {}): Dugum {
  const model = p.model ?? KATALOG[tur].model;
  const ayar = { ...ayarNormalize(tur, model, p.ayar ?? {}), ...(tur === "ses" ? { sesAd: "George" } : {}), ...(p.ayar ?? {}) };
  return { id: yeniId("d"), tur, x, y, surumler: [], aktif: 0, durum: "bos", ...p, model, ayar };
}

/** Kaynağın çıktısı hedef portun tipine uyar mı, döngü oluşur mu. */
export function baglantiKontrol(t: Tuval, kaynak: string, hedef: string, port: string): string | null {
  if (kaynak === hedef) return "Düğüm kendine bağlanamaz.";
  const K = t.dugumler.find((d) => d.id === kaynak), H = t.dugumler.find((d) => d.id === hedef);
  if (!K || !H) return "Düğüm bulunamadı.";
  const g = KATALOG[H.tur].girisler.find((x) => x.id === port);
  if (!g) return "Bu düğümün böyle bir girişi yok.";
  const c = KATALOG[K.tur].cikti;
  if (!uyumlu(c, g.tip)) return `${KATALOG[K.tur].ad} çıktısı (${c ?? "yok"}) ${g.ad} girişine uymaz.`;
  // döngü: hedeften kaynağa ulaşılabiliyor mu
  const ziyaret = new Set<string>(); const yigin = [hedef];
  while (yigin.length) { const u = yigin.pop()!; if (u === kaynak) return "Bu bağlantı döngü oluşturur."; if (ziyaret.has(u)) continue; ziyaret.add(u); t.kenarlar.filter((e) => e.kaynak === u).forEach((e) => yigin.push(e.hedef)); }
  return null;
}

type Durum = {
  tuvaller: Tuval[];
  olustur: (p?: Partial<Tuval>) => string;
  sil: (id: string) => void;
  cogalt: (id: string) => string | null;
  guncelle: (id: string, f: (t: Tuval) => Tuval, gecmis?: boolean) => void;
  geriAl: (id: string) => void;
  yinele: (id: string) => void;
};

/* Geri al / yinele: tuval başına anlık görüntüler (kalıcı değil). */
const geri = new Map<string, Tuval[]>(), ileri = new Map<string, Tuval[]>();
export const geriVar = (id: string) => (geri.get(id)?.length ?? 0) > 0;
export const ileriVar = (id: string) => (ileri.get(id)?.length ?? 0) > 0;

export const useTuval = create<Durum>()(
  persist(
    (set, get) => ({
      tuvaller: [],
      olustur: (p) => {
        const id = yeniId("t");
        const t: Tuval = { id, ad: "İsimsiz tuval", olusturma: Date.now(), guncelleme: Date.now(), dugumler: [], kenarlar: [], gorunum: { x: 0, y: 0, z: 1 }, ...p };
        t.id = id;
        set((s) => ({ tuvaller: [t, ...s.tuvaller] }));
        return id;
      },
      sil: (id) => set((s) => ({ tuvaller: s.tuvaller.filter((t) => t.id !== id) })),
      cogalt: (id) => {
        const t = get().tuvaller.find((x) => x.id === id); if (!t) return null;
        const yeni = get().olustur({ ...JSON.parse(JSON.stringify(t)), ad: `${t.ad} (kopya)` });
        return yeni;
      },
      guncelle: (id, f, gecmis = true) => set((s) => ({
        tuvaller: s.tuvaller.map((t) => {
          if (t.id !== id) return t;
          if (gecmis) { const g = geri.get(id) ?? []; g.push(t); if (g.length > 60) g.shift(); geri.set(id, g); ileri.set(id, []); }
          return { ...f(t), guncelleme: Date.now() };
        }),
      })),
      geriAl: (id) => {
        const g = geri.get(id); if (!g?.length) return;
        const onceki = g.pop()!;
        set((s) => ({ tuvaller: s.tuvaller.map((t) => { if (t.id !== id) return t; const i = ileri.get(id) ?? []; i.push(t); ileri.set(id, i); return { ...onceki, gorunum: t.gorunum }; }) }));
      },
      yinele: (id) => {
        const i = ileri.get(id); if (!i?.length) return;
        const sonraki = i.pop()!;
        set((s) => ({ tuvaller: s.tuvaller.map((t) => { if (t.id !== id) return t; const g = geri.get(id) ?? []; g.push(t); geri.set(id, g); return { ...sonraki, gorunum: t.gorunum }; }) }));
      },
    }),
    {
      name: "vayra-tuval", version: 1, migrate: alanlariKoru,
      // Çalışma anındaki "çalışıyor/sırada" durumları yenilemede yarım kalır; açılışta düzeltilir.
      onRehydrateStorage: () => (s) => {
        if (!s) return;
        s.tuvaller = s.tuvaller.map((t) => ({ ...t, dugumler: t.dugumler.map((d) => (d.durum === "calisiyor" || d.durum === "sirada" ? { ...d, durum: d.surumler.length ? "bitti" : "bos" } : d)) }));
      },
    },
  ),
);

/** Bir düğümün aktif çıktısı. */
export const aktifCikti = (d: Dugum | undefined): Surum | undefined => (d ? d.surumler[d.aktif] ?? d.surumler[d.surumler.length - 1] : undefined);
