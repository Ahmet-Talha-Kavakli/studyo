"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Sinema proje sistemi — Higgsfield Cinema Studio "proje" akışı.
 * Bir proje = başlık + tür/stil/kamera ayarları + storyboard (sıralı çekimler).
 * Her çekim (Shot) bir istem + süre + kamera hareketi + üretim durumu taşır.
 * localStorage'da kalıcı; /panel/sinema/[id] editöründe düzenlenir.
 */

export type CekimDurum = "taslak" | "uretiliyor" | "tamam";

export interface Cekim {
  id: string;
  baslik: string;
  istem: string;
  sure: number; // saniye
  hareket: string; // "Statik" | "Kaydırma" | "Zoom" | "Drone" ...
  tohum: string; // önizleme gradyanı için deterministik anahtar
  durum: CekimDurum;
  gorselUrl?: string;
  videoUrl?: string;
  /** Sahnede kullanılan @elementler (ad). */
  elementler?: string[];
  isik?: string;
  palet?: string;
  model?: string;
  /** Çekim listesi alanları (yönetmen ve storyboard): plan ölçeği, açı, lens, diyalog, ses notu, geçiş. */
  plan?: string; aci?: string; lens?: string; diyalog?: string; ses?: string; gecis?: string;
  /** Sahnenin önceki üretimleri; en yenisi başta. */
  surumler?: { id: string; gorselUrl?: string; videoUrl?: string; uretimId?: string; zaman: number }[];
}

// Proje-içi element (karakter/mekan/prop) — Elements sekmesi
export interface ProjeElement {
  id: string;
  ad: string;
  tur: "karakter" | "mekan" | "prop";
  tohum: string;
  aciklama?: string;
}
/** Brif blok editörü (Notion dili). metin: güvenli küçük HTML (b, i, s, code, a, @işaret span). */
export type BrifBlokTur = "p" | "h1" | "h2" | "h3" | "icindekiler" | "sutun" | "madde" | "numara" | "yap" | "kutu" | "alinti" | "ayrac" | "gorsel" | "element" | "acilir" | "kod" | "tablo" | "baglanti";
export type BrifRenk = "gri" | "mavi" | "yesil" | "sari" | "turuncu" | "kirmizi" | "mor" | "pembe";
export interface BrifYorum { id: string; kim: string; metin: string; zaman: number; cozuldu?: boolean }
export interface BrifBlok {
  id: string; tur: BrifBlokTur; metin: string; ok?: boolean; ic?: string; acik?: boolean; src?: string[]; elementler?: string[]; ipucu?: string;
  /** Liste girintisi (0-3), Tab ile artar. */
  girinti?: number;
  /** Sütunlar bloğunda her sütunun güvenli HTML içeriği (2-3 sütun). */
  sutunlar?: string[];
  /** Yazı ya da zemin rengi (Notion'daki gibi blok başına). */
  renk?: BrifRenk; zemin?: boolean;
  /** Tablo hücreleri (ilk satır başlık). */
  tablo?: string[][];
  /** Kod bloğunun dili; bağlantı bloğunun adresi. */
  dil?: string; url?: string;
  yorumlar?: BrifYorum[];
}
/** Brif sayfasının görünümü: kapak, simge, başlık ve okuma seçenekleri. */
export interface BrifSayfa { baslik?: string; kapak?: string; kapakY?: number; simge?: string; simgeRenk?: string; genis?: boolean; kucuk?: boolean; yazi?: "sans" | "serif" | "mono"; kilit?: boolean }
/** Brifin düzenlenebilir özellikleri (Notion veritabanı satırı gibi). */
export interface BrifOzellik { durum?: "taslak" | "inceleme" | "onay" | "arsiv"; teslim?: string; sorumlu?: string; etiketler?: string[] }
export interface BrifSurum { id: string; zaman: number; kim: string; bloklar: BrifBlok[]; baslik?: string }
/** AI Yönetmen: sahne önerisi ve oturum. */
export interface SahneOnerisi {
  id: string; baslik: string; istem: string; kamera: string; isik: string; sure: number; model: string; tur: "video" | "gorsel"; elementler?: string[];
  plan?: string; aci?: string; lens?: string; diyalog?: string; ses?: string; gecis?: string;
  durum: "oneri" | "eklendi" | "reddedildi"; cekimId?: string;
  /** Var olan bir sahnenin güncellemesiyse: hedef sahne ve önerinin geldiği andaki hâli (önce ve sonra kartı için). */
  hedefCekimId?: string; onceki?: { baslik: string; istem: string; kamera: string; isik: string; sure: number; plan?: string; aci?: string; lens?: string };
}
/** Yönetmen yanıtının bir sürümü (Yeniden oluştur ile birikir; mesajda biri gösterilir). */
export interface YonetmenSurum { metin: string; oneriler?: SahneOnerisi[]; dusunce?: string; dusunmeSn?: number; takip?: string[]; demo?: boolean; hata?: boolean; durduruldu?: boolean; zaman: number }
export interface YonetmenMesaj {
  id: string; rol: "ben" | "yonetmen"; metin: string; zaman: number; oneriler?: SahneOnerisi[]; demo?: boolean; hata?: boolean;
  /** Özetlenmiş düşünce ve süresi (saniye). */
  dusunce?: string; dusunmeSn?: number;
  /** Kullanıcının eklediği görseller (küçültülmüş veri adresi ya da proje karesi). */
  gorseller?: string[];
  /** Yanıttan sonra önerilen devam istemleri. */
  takip?: string[];
  durduruldu?: boolean; begeni?: 1 | -1;
  /** Yeniden oluşturulan sürümler; aktif olan mesajın kendi alanlarında durur. */
  surumler?: YonetmenSurum[]; surumNo?: number;
}
export interface YonetmenOturum { id: string; ad: string; zaman: number; mesajlar: YonetmenMesaj[]; sabit?: boolean }
// Canvas düğümü (sonsuz tuval) — Canvas sekmesi
export interface CanvasDugum {
  id: string;
  tur: "not" | "gorsel" | "cekim";
  x: number;
  y: number;
  metin?: string;
  tohum?: string;
}
// Sohbet/AI Yönetmen mesajı
export interface SohbetMesaj {
  id: string;
  ben: boolean;
  metin: string;
}

/**
 * Proje-İÇİ klasör (Higgsfield proje sidebar'ındaki "Folders" bölümü).
 * DİKKAT: SinemaProje.klasor (proje LİSTESİ klasörü) ile karıştırma —
 * bu, tek bir projenin varlıklarını gruplayan iç klasördür.
 */
/** İç içe klasör sınırı — kök klasör 1. kademe, en fazla 5 kademe (2026-08-01). */
export const KLASOR_MAKS_DERINLIK = 5;

/** Bir klasörün kademesi (kök = 1). Sınır kontrolleri için ortak yardımcı. */
export function klasorDerinligi(hepsi: ProjeKlasor[], id?: string): number {
  let d = 0;
  let k = id ? hepsi.find((x) => x.id === id) : undefined;
  while (k) {
    d += 1;
    if (d > 64) break; // bozuk veriye karşı emniyet
    k = k.ustId ? hepsi.find((x) => x.id === k!.ustId) : undefined;
  }
  return d;
}

export interface ProjeKlasor {
  id: string;
  ad: string;
  renk: string;      // hex — referanstaki 7 renkli nokta seçici
  aciklama?: string;
  olusturma: number;
  uretimIdler?: string[]; // bu klasöre atanmış üretim id'leri
  /** Üst klasör id'si — ALT KLASÖR desteği (2026-08-01). Kök klasörlerde boş. */
  ustId?: string;
}

/** Yayın (Publish) durumu — 4 adımlı sihirbazın çıktısı. */
export type YayinBicim = "feature" | "series" | "carousel";
export type YayinErisim = "istemli" | "istemsiz"; // With prompts / Prompts hidden
export interface ProjeYayin {
  baslik: string;
  aciklama: string;
  etiketler: string[];
  bicim: YayinBicim;
  kapakUretimId?: string;
  seriDurum?: "devam" | "tamam"; // Series status: Ongoing / Completed
  erisim: YayinErisim;
  yayinTarihi: number;
}

/** Proje üyesi — Higgsfield rolleri: Sahip / Yönetici / Katılımcı / İzleyici. */
export type ProjeRol = "sahip" | "yonetici" | "katilimci" | "izleyici";
export interface ProjeUye { email: string; ad: string; rol: ProjeRol; renk: string; davet: number; bekliyor?: boolean }
/** Proje etkinlik kaydı — yalnız gerçekten yapılan eylemler yazılır. */
export interface ProjeEtkinlik { id: string; kim: string; metin: string; tur: "proje" | "sahne" | "element" | "uretim" | "uye" | "klasor" | "yayin"; zaman: number }

export interface SinemaProje {
  id: string;
  ad: string;
  tur: string;
  renk?: string;                  // m27: proje/klasör rengi (hex) — kart ikonunda gösterilir
  gizlilik: "ozel" | "acik";
  olusturma: number;
  guncelleme: number;
  kapakTohum: string;
  ayar: { palet: string; isik: string; hareket: string; kamera: string; lens: string; oran: string };
  cekimler: Cekim[];
  // ── Proje-içi kalıcı içerik (editör sekmeleri) ──
  brief?: string;                 // Proje Özeti (Notion-tarzı düz metin)
  elementler?: ProjeElement[];    // Elementler sekmesi
  canvas?: CanvasDugum[];         // Canvas sekmesi
  sohbet?: SohbetMesaj[];         // Ekip sohbeti
  yonetmenSohbet?: SohbetMesaj[]; // AI Yönetmen sohbeti
  // ── Ortak proje mimarisi (Higgsfield mantığı: tek proje tüm stüdyolarda) ──
  boardIdler?: string[];          // bu projeye ait useCanvas board id'leri (referans)
  uretimIdler?: string[];         // bu projeye ait genel üretim id'leri (useProjeler referans)
  shortsKlipleri?: string[];      // bu projeye ait shorts üretim id'leri (useProjeler referans)
  kaynakStudyo?: string;          // projenin oluşturulduğu stüdyo (Sinema/Shorts/Görsel...)
  // ── Sidebar proje yönetimi (Higgsfield: Rename/Move to/Pin/Delete) ──
  sabit?: boolean;                // Pin — listenin en üstünde tutulur
  klasor?: boolean;               // bu kayıt bir KLASÖR (proje değil, taşıma hedefi)
  klasorId?: string;              // ait olduğu klasörün id'si (Move to ile atanır)
  // ── Projeler sayfası (Higgsfield proje yönetimi) ──
  aciklama?: string;              // kısa proje açıklaması (kart + yayın sihirbazı)
  kapakUrl?: string;              // kapak görseli (yoksa kapakTohum'dan üretilir)
  klasorler?: ProjeKlasor[];      // proje-İÇİ klasörler (detay sidebar "Klasörler")
  yayin?: ProjeYayin;             // yayınlandıysa yayın bilgisi
  yayinda?: boolean;              // yayın bayrağı (hızlı kontrol)
  // ── Proje çalışma alanı (2026-10-29) ──
  ustProjeId?: string;            // alt proje ise üst projenin id'si (ağaç)
  uyeler?: ProjeUye[];            // sahip dışındaki üyeler + davetler
  butce?: number;                 // kredi bütçesi (0/boş = sınırsız)
  etkinlik?: ProjeEtkinlik[];     // en yeni başta, en fazla 80
  brifBloklar?: BrifBlok[];       // Notion dili brif; brief alanı bunun düz metin karşılığıdır
  brifDuzenleme?: { kim: string; zaman: number };
  brifSayfa?: BrifSayfa;
  brifOzellik?: BrifOzellik;
  brifSurumleri?: BrifSurum[];    // en yeni başta, en fazla 30
  yonetmenOturumlari?: YonetmenOturum[]; // AI Yönetmen oturumları, en yeni başta
}

// Ortak proje = SinemaProje (stüdyo-nötr). Diğer stüdyolar `Proje` adıyla import eder.
export type Proje = SinemaProje;

interface SinemaState {
  projeler: SinemaProje[];
  projeOlustur: (ad?: string, tur?: string, opts?: { kaynakStudyo?: string; renk?: string; ustProjeId?: string; aciklama?: string }) => string;
  uyeEkle: (projeId: string, uye: Omit<ProjeUye, "davet">) => void;
  uyeGuncelle: (projeId: string, email: string, patch: Partial<ProjeUye>) => void;
  uyeSil: (projeId: string, email: string) => void;
  etkinlikEkle: (projeId: string, metin: string, tur?: ProjeEtkinlik["tur"]) => void;
  projeSil: (id: string) => void;
  projeGuncelle: (id: string, patch: Partial<Omit<SinemaProje, "cekimler">>) => void;
  projeGetir: (id: string) => SinemaProje | undefined;
  // ── Sidebar proje yönetimi (Rename için projeGuncelle yeter) ──
  projeSabitle: (id: string) => void;                     // Pin toggle
  projeTasi: (id: string, klasorId?: string) => void;     // Move to (klasör hedefi; boş = kök)
  klasorOlustur: (ad?: string) => string;                 // "Yeni klasör"
  cekimEkle: (projeId: string, kismi?: Partial<Cekim>) => string;
  cekimGuncelle: (projeId: string, cekimId: string, patch: Partial<Cekim>) => void;
  cekimSil: (projeId: string, cekimId: string) => void;
  cekimSirala: (projeId: string, idListe: string[]) => void;
  // ── Editör sekme action'ları ──
  briefGuncelle: (projeId: string, brief: string) => void;
  elementEkle: (projeId: string, el: Omit<ProjeElement, "id">) => void;
  elementSil: (projeId: string, elId: string) => void;
  canvasDugumEkle: (projeId: string, dugum: Omit<CanvasDugum, "id">) => void;
  canvasDugumGuncelle: (projeId: string, dugumId: string, patch: Partial<CanvasDugum>) => void;
  canvasDugumSil: (projeId: string, dugumId: string) => void;
  sohbetEkle: (projeId: string, mesaj: Omit<SohbetMesaj, "id">) => void;
  yonetmenSohbetEkle: (projeId: string, mesaj: Omit<SohbetMesaj, "id">) => void;
  // ── Ortak proje bağları (Canvas & üretim referansları) ──
  boardBagla: (projeId: string, boardId: string) => void;
  boardCoz: (projeId: string, boardId: string) => void;
  projeBoardBul: (projeId: string) => string | undefined;
  uretimBagla: (projeId: string, uretimId: string, kanal?: "shorts" | "genel") => void;
  uretimCoz: (projeId: string, uretimId: string) => void;
  // ── Proje-İÇİ klasörler (detay sayfası sidebar "Klasörler") ──
  projeKlasorEkle: (projeId: string, ad: string, renk?: string, aciklama?: string, ustId?: string) => string;
  projeKlasorSil: (projeId: string, klasorId: string) => void;
  projeKlasorGuncelle: (projeId: string, klasorId: string, patch: Partial<Omit<ProjeKlasor, "id">>) => void;
  projeKlasoreAt: (projeId: string, klasorId: string, uretimId: string) => void;
  // ── Yayınlama (4 adımlı sihirbaz) ──
  projeYayinla: (projeId: string, yayin: Omit<ProjeYayin, "yayinTarihi">) => void;
  projeYayinKaldir: (projeId: string) => void;
}

let sayac = 0;
// performance.now() SSR'de yok → güvenli fallback. Persist için deterministik yeterli.
const zaman = () => (typeof performance !== "undefined" ? Math.floor(performance.now()) : 0);
const yeniId = (p: string) => `${p}${(sayac += 1)}_${zaman()}`;

const HAREKETLER = ["Statik", "Yavaş Kaydırma", "Zoom In", "Drone", "Handheld"];

function varsayilanCekimler(): Cekim[] {
  return [
    { id: yeniId("c"), baslik: "Açılış", istem: "Şafakta uyanan sisli bir vadi, sinematik geniş açı", sure: 4, hareket: "Drone", tohum: "sh-open", durum: "tamam" },
    { id: yeniId("c"), baslik: "Kahraman", istem: "Yağmurluklu bir figür tepede duruyor, arkadan ışık", sure: 3, hareket: "Yavaş Kaydırma", tohum: "sh-hero", durum: "tamam" },
    { id: yeniId("c"), baslik: "Gerilim", istem: "", sure: 3, hareket: "Handheld", tohum: "sh-tension", durum: "taslak" },
  ];
}

const SEED: SinemaProje[] = [
  {
    id: "seed-ilk-proje",
    ad: "İlk proje",
    tur: "Dram",
    gizlilik: "ozel",
    olusturma: 0,
    guncelleme: 0,
    kapakTohum: "cs-p1",
    ayar: { palet: "Sıcak Altın", isik: "Altın Saat", hareket: "İnce Film", kamera: "ARRI Alexa", lens: "Anamorfik", oran: "16:9" },
    cekimler: varsayilanCekimler(),
  },
  {
    id: "seed-neon-sehir",
    ad: "Neon Şehir",
    tur: "Bilim Kurgu",
    gizlilik: "ozel",
    olusturma: 0,
    guncelleme: 0,
    kapakTohum: "cs-p2",
    ayar: { palet: "Soğuk Mavi", isik: "Neon", hareket: "Steadicam", kamera: "RED", lens: "Sferik", oran: "2.39:1" },
    cekimler: [
      { id: yeniId("c"), baslik: "Şehir", istem: "Yağmurlu neon metropol, tepeden geniş açı, cyberpunk", sure: 5, hareket: "Drone", tohum: "sh-city", durum: "tamam" },
      { id: yeniId("c"), baslik: "Sokak", istem: "Islak asfaltta yürüyen yalnız figür, neon yansımalar", sure: 4, hareket: "Handheld", tohum: "sh-street", durum: "tamam" },
    ],
  },
  {
    id: "seed-col-yolculugu",
    ad: "Çöl Yolculuğu",
    tur: "Epik",
    gizlilik: "acik",
    olusturma: 0,
    guncelleme: 0,
    kapakTohum: "cs-p3",
    ayar: { palet: "Sıcak Altın", isik: "Doğal", hareket: "Drone", kamera: "ARRI Alexa", lens: "Anamorfik", oran: "2.39:1" },
    cekimler: [
      { id: yeniId("c"), baslik: "Kum Denizi", istem: "Uçsuz bucaksız kum tepeleri, gün batımı, epik ölçek", sure: 6, hareket: "Drone", tohum: "sh-dune", durum: "tamam" },
    ],
  },
];

const kaydet = (p: SinemaProje, metin: string, tur: ProjeEtkinlik["tur"]): SinemaProje => ({
  ...p, etkinlik: [{ id: yeniId("ev"), kim: "Sen", metin, tur, zaman: Date.now() }, ...(p.etkinlik ?? [])].slice(0, 80),
});

export const useSinema = create<SinemaState>()(
  persist(
    (set, get) => ({
      projeler: SEED,
      projeOlustur: (ad = "Adsız proje", tur = "Genel", opts) => {
        const id = yeniId("p");
        const t = Date.now();
        const proje: SinemaProje = {
          id,
          ad,
          tur,
          renk: opts?.renk ?? "#55d6fd", // m27: klasör/proje rengi (varsayılan lime)
          gizlilik: "ozel",
          olusturma: t,
          guncelleme: t,
          kapakTohum: `proj-${id}`,
          ayar: { palet: "Oto", isik: "Oto", hareket: "Oto", kamera: "Oto", lens: "Oto", oran: "16:9" },
          cekimler: [
            { id: yeniId("c"), baslik: "Sahne 1", istem: "", sure: 4, hareket: "Statik", tohum: `sh-${id}-1`, durum: "taslak" },
          ],
          boardIdler: [],
          uretimIdler: [],
          shortsKlipleri: [],
          kaynakStudyo: opts?.kaynakStudyo,
          ustProjeId: opts?.ustProjeId,
          aciklama: opts?.aciklama,
          etkinlik: [{ id: yeniId("ev"), kim: "Sen", metin: opts?.ustProjeId ? "Alt projeyi oluşturdu" : "Projeyi oluşturdu", tur: "proje", zaman: t }],
        };
        set((s) => ({
          projeler: [proje, ...s.projeler.map((p) => (p.id === opts?.ustProjeId ? kaydet({ ...p, guncelleme: t }, `"${ad}" alt projesini ekledi`, "proje") : p))],
        }));
        return id;
      },
      projeSil: (id) =>
        set((s) => ({
          // Klasör silinince içindeki projeler köke düşer (klasorId temizlenir).
          projeler: (() => {
            const silinen = s.projeler.find((p) => p.id === id);
            return s.projeler
              .filter((p) => p.id !== id)
              .map((p) => (p.klasorId === id ? { ...p, klasorId: undefined } : p))
              .map((p) => (p.ustProjeId === id ? { ...p, ustProjeId: silinen?.ustProjeId } : p));
          })(),
        })),
      projeGuncelle: (id, patch) =>
        set((s) => ({
          projeler: s.projeler.map((p) => (p.id === id ? { ...p, ...patch, guncelleme: Date.now() } : p)),
        })),
      projeSabitle: (id) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, sabit: !p.sabit } : p)) })),
      projeTasi: (id, klasorId) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, klasorId } : p)) })),
      klasorOlustur: (ad = "Yeni klasör") => {
        const id = yeniId("k");
        const t = Date.now();
        const klasor: SinemaProje = {
          id, ad, tur: "Klasör", gizlilik: "ozel", olusturma: t, guncelleme: t,
          kapakTohum: `kls-${id}`,
          ayar: { palet: "Oto", isik: "Oto", hareket: "Oto", kamera: "Oto", lens: "Oto", oran: "16:9" },
          cekimler: [], boardIdler: [], uretimIdler: [], shortsKlipleri: [], klasor: true,
        };
        set((s) => ({ projeler: [klasor, ...s.projeler] }));
        return id;
      },
      projeGetir: (id) => get().projeler.find((p) => p.id === id),
      uyeEkle: (projeId, uye) =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId || (p.uyeler ?? []).some((u) => u.email.toLowerCase() === uye.email.toLowerCase())) return p;
            return kaydet({ ...p, uyeler: [...(p.uyeler ?? []), { ...uye, davet: Date.now() }], gizlilik: "acik", guncelleme: Date.now() }, `${uye.email} adresini davet etti`, "uye");
          }),
        })),
      uyeGuncelle: (projeId, email, patch) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, uyeler: (p.uyeler ?? []).map((u) => (u.email === email ? { ...u, ...patch } : u)) } : p)) })),
      uyeSil: (projeId, email) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? kaydet({ ...p, uyeler: (p.uyeler ?? []).filter((u) => u.email !== email) }, `${email} adresini projeden çıkardı`, "uye") : p)) })),
      etkinlikEkle: (projeId, metin, tur = "proje") =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? kaydet(p, metin, tur) : p)) })),
      cekimEkle: (projeId, kismi) => {
        const id = yeniId("c");
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            const n = p.cekimler.length + 1;
            const cekim: Cekim = {
              ...kismi,
              id,
              baslik: kismi?.baslik ?? `Sahne ${n}`,
              istem: kismi?.istem ?? "",
              sure: kismi?.sure ?? 4,
              hareket: kismi?.hareket ?? HAREKETLER[n % HAREKETLER.length],
              tohum: `sh-${projeId}-${n}`,
              durum: "taslak",
            };
            return kaydet({ ...p, cekimler: [...p.cekimler, cekim], guncelleme: Date.now() }, `"${cekim.baslik}" sahnesini ekledi`, "sahne");
          }),
        }));
        return id;
      },
      cekimGuncelle: (projeId, cekimId, patch) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId
              ? { ...p, cekimler: p.cekimler.map((c) => (c.id === cekimId ? { ...c, ...patch } : c)), guncelleme: Date.now() }
              : p,
          ),
        })),
      cekimSil: (projeId, cekimId) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId ? { ...p, cekimler: p.cekimler.filter((c) => c.id !== cekimId) } : p,
          ),
        })),
      cekimSirala: (projeId, idListe) =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            const harita = Object.fromEntries(p.cekimler.map((c) => [c.id, c]));
            return { ...p, cekimler: idListe.map((id) => harita[id]).filter(Boolean) };
          }),
        })),

      // ── Editör sekme action'ları (proje-içi kalıcı içerik) ──
      briefGuncelle: (projeId, brief) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, brief, guncelleme: Date.now() } : p)) })),
      elementEkle: (projeId, el) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? kaydet({ ...p, elementler: [...(p.elementler ?? []), { ...el, id: yeniId("el") }], guncelleme: Date.now() }, `@${el.ad} elementini ekledi`, "element") : p)) })),
      elementSil: (projeId, elId) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, elementler: (p.elementler ?? []).filter((e) => e.id !== elId) } : p)) })),
      canvasDugumEkle: (projeId, dugum) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, canvas: [...(p.canvas ?? []), { ...dugum, id: yeniId("cv") }] } : p)) })),
      canvasDugumGuncelle: (projeId, dugumId, patch) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, canvas: (p.canvas ?? []).map((d) => (d.id === dugumId ? { ...d, ...patch } : d)) } : p)) })),
      canvasDugumSil: (projeId, dugumId) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, canvas: (p.canvas ?? []).filter((d) => d.id !== dugumId) } : p)) })),
      sohbetEkle: (projeId, mesaj) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, sohbet: [...(p.sohbet ?? []), { ...mesaj, id: yeniId("sm") }] } : p)) })),
      yonetmenSohbetEkle: (projeId, mesaj) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, yonetmenSohbet: [...(p.yonetmenSohbet ?? []), { ...mesaj, id: yeniId("ym") }] } : p)) })),

      // ── Ortak proje bağları ──
      boardBagla: (projeId, boardId) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId && !(p.boardIdler ?? []).includes(boardId)
              ? { ...p, boardIdler: [...(p.boardIdler ?? []), boardId], guncelleme: Date.now() }
              : p,
          ),
        })),
      boardCoz: (projeId, boardId) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId ? { ...p, boardIdler: (p.boardIdler ?? []).filter((b) => b !== boardId) } : p,
          ),
        })),
      projeBoardBul: (projeId) => get().projeler.find((p) => p.id === projeId)?.boardIdler?.[0],
      uretimBagla: (projeId, uretimId, kanal = "genel") =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            const alan = kanal === "shorts" ? "shortsKlipleri" : "uretimIdler";
            const mevcut = (p[alan] ?? []) as string[];
            if (mevcut.includes(uretimId)) return p;
            return { ...p, [alan]: [uretimId, ...mevcut], guncelleme: Date.now() };
          }),
        })),
      uretimCoz: (projeId, uretimId) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId
              ? {
                  ...p,
                  uretimIdler: (p.uretimIdler ?? []).filter((u) => u !== uretimId),
                  shortsKlipleri: (p.shortsKlipleri ?? []).filter((u) => u !== uretimId),
                }
              : p,
          ),
        })),

      // ── Proje-İÇİ klasörler ──
      projeKlasorEkle: (projeId, ad, renk = "#55d6fd", aciklama, ustId) => {
        /* İç içe klasör sınırı: EN FAZLA 5 KADEME (2026-08-01 isteği).
           Kök klasör 1. kademedir; 5. kademedeki bir klasörün altına yeni
           klasör açılamaz. Guard burada, çünkü çağıran her yerde (sidebar,
           menü, ileride başka ekranlar) aynı kural geçerli olmalı. */
        if (ustId) {
          const hepsi = get().projeler.find((x) => x.id === projeId)?.klasorler ?? [];
          // Yeni klasörün kademesi = üstünkü + 1
          if (klasorDerinligi(hepsi, ustId) + 1 > KLASOR_MAKS_DERINLIK) return "";
        }
        const id = yeniId("pk");
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId
              ? {
                  ...p,
                  klasorler: [...(p.klasorler ?? []), { id, ad, renk, aciklama, ustId, olusturma: Date.now(), uretimIdler: [] }],
                  guncelleme: Date.now(),
                  etkinlik: [{ id: yeniId("ev"), kim: "Sen", metin: `"${ad}" klasörünü açtı`, tur: "klasor" as const, zaman: Date.now() }, ...(p.etkinlik ?? [])].slice(0, 80),
                }
              : p,
          ),
        }));
        return id;
      },
      /* Silme ALT AĞACI da siler — yoksa alt klasörler öksüz kalıp
         hiçbir yerde görünmeden veride birikirdi (2026-08-01). */
      projeKlasorSil: (projeId, klasorId) =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            const hepsi = p.klasorler ?? [];
            const silinecek = new Set<string>([klasorId]);
            let degisti = true;
            while (degisti) {
              degisti = false;
              for (const k of hepsi) {
                if (k.ustId && silinecek.has(k.ustId) && !silinecek.has(k.id)) {
                  silinecek.add(k.id);
                  degisti = true;
                }
              }
            }
            return { ...p, klasorler: hepsi.filter((k) => !silinecek.has(k.id)) };
          }),
        })),
      projeKlasorGuncelle: (projeId, klasorId, patch) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId
              ? { ...p, klasorler: (p.klasorler ?? []).map((k) => (k.id === klasorId ? { ...k, ...patch } : k)) }
              : p,
          ),
        })),
      projeKlasoreAt: (projeId, klasorId, uretimId) =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            return {
              ...p,
              klasorler: (p.klasorler ?? []).map((k) => {
                // Üretim her seferinde TEK klasörde olur: diğerlerinden çıkar, hedefe ekle.
                const temiz = (k.uretimIdler ?? []).filter((u) => u !== uretimId);
                return k.id === klasorId ? { ...k, uretimIdler: [uretimId, ...temiz] } : { ...k, uretimIdler: temiz };
              }),
            };
          }),
        })),

      // ── Yayınlama ──
      projeYayinla: (projeId, yayin) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId
              ? {
                  ...p,
                  yayinda: true,
                  gizlilik: "acik",
                  yayin: { ...yayin, yayinTarihi: Date.now() },
                  guncelleme: Date.now(),
                  etkinlik: [{ id: yeniId("ev"), kim: "Sen", metin: "Projeyi yayınladı", tur: "yayin" as const, zaman: Date.now() }, ...(p.etkinlik ?? [])].slice(0, 80),
                }
              : p,
          ),
        })),
      projeYayinKaldir: (projeId) =>
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId ? { ...p, yayinda: false, gizlilik: "ozel", guncelleme: Date.now() } : p,
          ),
        })),
    }),
    {
      name: "vayra-sinema",
      version: 4,
      // v3 (ortak proje mimarisi) / v4 (Projeler sayfası: iç klasörler + yayın):
      // kullanıcı projelerini ASLA sıfırlama. Eski projeleri yeni şekle map'le
      // (yeni opsiyonel alanları default'la doldur). Boşsa SEED yükle. VERİ KAYBI YOK.
      migrate: (persisted: unknown) => {
        const p = persisted as { projeler?: SinemaProje[] } | undefined;
        if (!p?.projeler?.length) return { projeler: SEED };
        return {
          ...p,
          projeler: p.projeler.map((proje) => ({
            ...proje,
            boardIdler: proje.boardIdler ?? [],
            uretimIdler: proje.uretimIdler ?? [],
            shortsKlipleri: proje.shortsKlipleri ?? [],
            klasorler: proje.klasorler ?? [],
            yayinda: proje.yayinda ?? proje.gizlilik === "acik",
          })),
        };
      },
    },
  ),
);

/**
 * useProje — ortak proje store'u (Higgsfield mantığı: tek proje tüm stüdyolarda).
 * useSinema ile AYNI store'dur (aynı `vayra-sinema` persist'i). Sinema-nötr adıyla
 * diğer stüdyolar (shorts/görsel/video/canvas...) buradan proje listesine erişir.
 */
export const useProje = useSinema;
