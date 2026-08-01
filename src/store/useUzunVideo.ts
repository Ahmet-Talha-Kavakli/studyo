"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * useUzunVideo — Uzun Video Stüdyosu durumu (M24).
 *
 * Piyasada nadir bir yetenek: 1 dakikadan 1 saate kadar çok-sahneli uzun video.
 * İki mod:
 *  • "sahne" (storyboard): kullanıcı sahne sahne aralık seçer, her sahneye ayrı
 *    prompt + ayrı model + geçiş verir. Tam kontrol.
 *  • "otomatik" (tek prompt): tek bir istemden hedef süreye göre AI sahneleri
 *    otomatik böler (deterministik senaryo taslağı üretir).
 *
 * Projeler kalıcıdır; render sonuçları useProjeler'e köprülenir (kitaplıkta çıkar).
 */

export type UzunGecis = "kesme" | "erime" | "kaydir" | "yakinlas" | "bulanik";
export const GECISLER: { id: UzunGecis; ad: string }[] = [
  { id: "kesme", ad: "Kesme" },
  { id: "erime", ad: "Çapraz erime" },
  { id: "kaydir", ad: "Kaydırma" },
  { id: "yakinlas", ad: "Yakınlaşma" },
  { id: "bulanik", ad: "Bulanık geçiş" },
];

/** Sahneye bağlanan element referansı (useElements'teki @element). */
export interface SahneElement {
  id: string;   // VElement.id
  ad: string;   // @mention adı (prompt'a girer)
  tur: string;  // karakter | mekan | obje | stil
}

export interface UzunSahne {
  id: string;
  baslik: string;
  prompt: string;
  model: string;      // catalog model adı
  sure: number;       // saniye (4–20 arası tek sahne)
  gecis: UzunGecis;
  seslendirme?: string; // opsiyonel bu sahnenin anlatım metni
  gorselUrl?: string;   // önizleme tohumu/URL
  durum: "taslak" | "hazir";

  /* ── M6: sahne bazında tam kontrol ── */
  /** Bu sahnede kullanılan elementler (karakter/mekan/obje/stil). */
  elementler?: SahneElement[];
  /** Kamera hareketi (KAMERA_HAREKETLERI'nden). */
  kamera?: string;
  /** Referans görsel (data URL) — sahnenin görsel çıpası. */
  referansGorsel?: string;
  /** Bu sahnede çalacak müzik/ambiyans notu. */
  muzikNotu?: string;
  /** Karakter tutarlılığı: önceki sahnenin karakterlerini koru. */
  karakterTutarlilik?: boolean;
  /** Sahne notu (yönetmen notu — üretime girmez, ekip için). */
  not?: string;
}

export interface UzunProje {
  id: string;
  ad: string;
  mod: "sahne" | "otomatik";
  hedefSure: number;   // dakika (1–60)
  enBoy: "16:9" | "9:16" | "1:1";
  cozunurluk: "720p" | "1080p" | "4K";
  varsayilanModel: string;
  tekPrompt: string;   // otomatik mod istemi
  muzik: boolean;
  altyazi: boolean;
  sahneler: UzunSahne[];
  guncelleme: number;
}

interface UzunVideoState {
  projeler: UzunProje[];
  aktifId: string | null;
  projeOlustur: (patch?: Partial<UzunProje>) => string;
  projeSec: (id: string | null) => void;
  projeGuncelle: (id: string, patch: Partial<UzunProje>) => void;
  projeSil: (id: string) => void;
  sahneEkle: (projeId: string, patch?: Partial<UzunSahne>) => string;
  sahneGuncelle: (projeId: string, sahneId: string, patch: Partial<UzunSahne>) => void;
  sahneSil: (projeId: string, sahneId: string) => void;
  sahneTasi: (projeId: string, sahneId: string, yon: -1 | 1) => void;
  /** Sahneyi hemen ardına kopyalar (tüm ayarlar + elementler dahil). */
  sahneCogalt: (projeId: string, sahneId: string) => string | null;
  /** Sahneye element ekler (aynı element iki kez eklenmez). */
  sahneElementEkle: (projeId: string, sahneId: string, el: SahneElement) => void;
  /** Sahneden element çıkarır. */
  sahneElementCikar: (projeId: string, sahneId: string, elementId: string) => void;
  otomatikBol: (projeId: string) => void; // tek prompt → sahne dizisi
}

let sayac = 0;
const yid = (p: string) => { sayac += 1; return `${p}_${sayac}_${Math.floor(performance.now())}`; };

const VARSAYILAN_MODEL = "Kling 3.0";

function bosSahne(patch?: Partial<UzunSahne>): UzunSahne {
  return {
    id: yid("sh"),
    baslik: "Yeni sahne",
    prompt: "",
    model: VARSAYILAN_MODEL,
    sure: 8,
    gecis: "kesme",
    durum: "taslak",
    ...patch,
  };
}

// Tek prompt → sahne taslakları. Deterministik: hedef süreye göre sahne sayısı,
// her sahneye jenerik ama anlamlı bir "beat" başlığı. (LLM'siz, SSR-güvenli.)
const BEAT_SABLON = [
  "Açılış — mekân ve atmosfer kurulur",
  "Tanıtım — ana özne sahneye girer",
  "Gelişme — olay/aksiyon başlar",
  "Yükseliş — gerilim ve tempo artar",
  "Doruk — en yoğun an",
  "Dönüş — beklenmedik değişim",
  "Çözülme — sonuca doğru",
  "Kapanış — final kare ve imza",
];

function beatBaslik(i: number, toplam: number): string {
  if (toplam <= BEAT_SABLON.length) return BEAT_SABLON[Math.min(i, BEAT_SABLON.length - 1)];
  // uzun videoda beat'leri döngüsel + numaralı ver
  return `${BEAT_SABLON[i % BEAT_SABLON.length]} · Bölüm ${i + 1}`;
}

/**
 * Beat'e göre sinematik yönerge: açıklama + kamera + süre + geçiş.
 * "AI sahne önerisi"nin deterministik (LLM'siz, SSR-güvenli) karşılığı —
 * her beat'in dramaturjik işlevine uygun çekim dili üretir.
 */
const BEAT_YONERGE: { aciklama: string; kamera: string; sure: number; gecis: UzunGecis }[] = [
  { aciklama: "geniş açı kuruluş çekimi, mekânın atmosferi ve ışığı tanıtılır", kamera: "Drone Çekim", sure: 8, gecis: "erime" },
  { aciklama: "ana özne kadraja girer, orta boy çekim, yüzünde ilk ifade", kamera: "Dolly İçeri", sure: 8, gecis: "erime" },
  { aciklama: "olay başlar, hareket ve tempo yükselir, takip çekimi", kamera: "Kamera Takip", sure: 10, gecis: "kesme" },
  { aciklama: "gerilim artar, yakın plan detaylar ve hızlı kesmeler", kamera: "El Kamerası", sure: 8, gecis: "kesme" },
  { aciklama: "doruk an, en yoğun kare, yavaş çekim vurgusu", kamera: "Yörünge", sure: 12, gecis: "yakinlas" },
  { aciklama: "beklenmedik dönüş, açı değişir, yeni bilgi ortaya çıkar", kamera: "360 Roll", sure: 8, gecis: "bulanik" },
  { aciklama: "tempo düşer, sonuca doğru sakinleşen kamera", kamera: "Dolly Dışarı", sure: 8, gecis: "erime" },
  { aciklama: "kapanış karesi, geniş plana açılır, imza görüntü", kamera: "Uzaklaş", sure: 10, gecis: "erime" },
];

function beatYonerge(i: number, toplam: number) {
  // Beat şablonuyla aynı hizada kalsın (toplam kısa ise doğrudan indeks).
  const idx = toplam <= BEAT_YONERGE.length ? Math.min(i, BEAT_YONERGE.length - 1) : i % BEAT_YONERGE.length;
  return BEAT_YONERGE[idx];
}

export const useUzunVideo = create<UzunVideoState>()(
  persist(
    (set, get) => ({
      projeler: [],
      aktifId: null,
      projeOlustur: (patch) => {
        const id = yid("uv");
        const proje: UzunProje = {
          id,
          ad: patch?.ad ?? "Adsız uzun video",
          mod: patch?.mod ?? "sahne",
          hedefSure: patch?.hedefSure ?? 3,
          enBoy: patch?.enBoy ?? "16:9",
          cozunurluk: patch?.cozunurluk ?? "1080p",
          varsayilanModel: patch?.varsayilanModel ?? VARSAYILAN_MODEL,
          tekPrompt: patch?.tekPrompt ?? "",
          muzik: patch?.muzik ?? true,
          altyazi: patch?.altyazi ?? false,
          sahneler: patch?.sahneler ?? [bosSahne({ baslik: "Sahne 1" })],
          guncelleme: Date.now(),
        };
        set((s) => ({ projeler: [proje, ...s.projeler], aktifId: id }));
        return id;
      },
      projeSec: (id) => set({ aktifId: id }),
      projeGuncelle: (id, patch) =>
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, ...patch, guncelleme: Date.now() } : p)) })),
      projeSil: (id) =>
        set((s) => ({ projeler: s.projeler.filter((p) => p.id !== id), aktifId: s.aktifId === id ? null : s.aktifId })),
      sahneEkle: (projeId, patch) => {
        const sh = bosSahne(patch);
        set((s) => ({
          projeler: s.projeler.map((p) => p.id === projeId
            ? { ...p, sahneler: [...p.sahneler, { ...sh, baslik: patch?.baslik ?? `Sahne ${p.sahneler.length + 1}`, model: p.varsayilanModel }], guncelleme: Date.now() }
            : p),
        }));
        return sh.id;
      },
      sahneGuncelle: (projeId, sahneId, patch) =>
        set((s) => ({
          projeler: s.projeler.map((p) => p.id === projeId
            ? { ...p, sahneler: p.sahneler.map((sh) => (sh.id === sahneId ? { ...sh, ...patch } : sh)), guncelleme: Date.now() }
            : p),
        })),
      sahneSil: (projeId, sahneId) =>
        set((s) => ({
          projeler: s.projeler.map((p) => p.id === projeId
            ? { ...p, sahneler: p.sahneler.filter((sh) => sh.id !== sahneId), guncelleme: Date.now() }
            : p),
        })),
      sahneTasi: (projeId, sahneId, yon) =>
        set((s) => ({
          projeler: s.projeler.map((p) => {
            if (p.id !== projeId) return p;
            const i = p.sahneler.findIndex((sh) => sh.id === sahneId);
            const j = i + yon;
            if (i < 0 || j < 0 || j >= p.sahneler.length) return p;
            const yeni = [...p.sahneler];
            [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
            return { ...p, sahneler: yeni, guncelleme: Date.now() };
          }),
        })),
      sahneCogalt: (projeId, sahneId) => {
        const proje = get().projeler.find((p) => p.id === projeId);
        const kaynak = proje?.sahneler.find((sh) => sh.id === sahneId);
        if (!proje || !kaynak) return null;
        const yeniId = yid("sh");
        const kopya: UzunSahne = {
          ...kaynak,
          id: yeniId,
          baslik: kaynak.baslik + " (kopya)",
          elementler: kaynak.elementler ? [...kaynak.elementler] : undefined,
        };
        const i = proje.sahneler.findIndex((sh) => sh.id === sahneId);
        const yeniListe = [...proje.sahneler];
        yeniListe.splice(i + 1, 0, kopya);
        set((s) => ({
          projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, sahneler: yeniListe, guncelleme: Date.now() } : p)),
        }));
        return yeniId;
      },
      sahneElementEkle: (projeId, sahneId, el) =>
        set((s) => ({
          projeler: s.projeler.map((p) => p.id === projeId
            ? {
              ...p,
              sahneler: p.sahneler.map((sh) => {
                if (sh.id !== sahneId) return sh;
                const mevcut = sh.elementler ?? [];
                if (mevcut.some((x) => x.id === el.id)) return sh; // çift ekleme yok
                return { ...sh, elementler: [...mevcut, el] };
              }),
              guncelleme: Date.now(),
            }
            : p),
        })),
      sahneElementCikar: (projeId, sahneId, elementId) =>
        set((s) => ({
          projeler: s.projeler.map((p) => p.id === projeId
            ? {
              ...p,
              sahneler: p.sahneler.map((sh) => sh.id === sahneId
                ? { ...sh, elementler: (sh.elementler ?? []).filter((x) => x.id !== elementId) }
                : sh),
              guncelleme: Date.now(),
            }
            : p),
        })),
      otomatikBol: (projeId) => {
        const proje = get().projeler.find((p) => p.id === projeId);
        if (!proje) return;
        const toplamSn = proje.hedefSure * 60;
        const sahneSure = 8; // ortalama sahne uzunluğu
        const adet = Math.max(2, Math.min(60, Math.round(toplamSn / sahneSure)));
        const konu = proje.tekPrompt.trim();
        const sahneler: UzunSahne[] = Array.from({ length: adet }, (_, i) => {
          const beat = beatBaslik(i, adet);
          const yon = beatYonerge(i, adet);
          return bosSahne({
            baslik: beat,
            // Zengin taslak: konu + beat yönergesi + kamera önerisi (LLM'siz, deterministik).
            prompt: konu ? `${konu} — ${yon.aciklama}` : "",
            model: proje.varsayilanModel,
            sure: yon.sure,
            gecis: i === 0 ? "kesme" : yon.gecis,
            kamera: yon.kamera,
            // İlk sahne hariç karakter tutarlılığı açık gelir (aynı kadro devam etsin).
            karakterTutarlilik: i > 0,
            durum: "taslak",
          });
        });
        set((s) => ({
          projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, sahneler, guncelleme: Date.now() } : p)),
        }));
      },
    }),
    {
      name: "vayra-uzun-video",
      version: 2,
      // v1 → v2: sahnelere element/kamera/referans alanları eklendi.
      // Eski projeler KORUNUR; yeni alanlar sadece varsayılanla doldurulur.
      migrate: (persisted: unknown, ver: number) => {
        const s = persisted as UzunVideoState | undefined;
        if (s?.projeler && ver < 2) {
          s.projeler = s.projeler.map((p) => ({
            ...p,
            sahneler: p.sahneler.map((sh) => ({ elementler: [], kamera: "Statik", ...sh })),
          }));
        }
        return s as UzunVideoState;
      },
    },
  ),
);

/** Bir projenin toplam süresini (sn) hesapla. */
export function toplamSure(p: UzunProje): number {
  return p.sahneler.reduce((a, sh) => a + sh.sure, 0);
}

/**
 * Bir sahnenin GERÇEK kredi maliyeti.
 * Taban: modelin 5 saniyelik kredisi × (süre / 5).
 * Ek yükler: 4K +%40, 1080p +%15 · her element +%5 (tutarlılık işi) ·
 * referans görsel +2 · seslendirme +3 kredi.
 */
export function sahneKredi(
  sahne: UzunSahne,
  modelKredi: number,
  cozunurluk: UzunProje["cozunurluk"],
): number {
  const taban = modelKredi * (sahne.sure / 5);
  const cozCarpan = cozunurluk === "4K" ? 1.4 : cozunurluk === "1080p" ? 1.15 : 1;
  const elementCarpan = 1 + (sahne.elementler?.length ?? 0) * 0.05;
  let toplam = taban * cozCarpan * elementCarpan;
  if (sahne.referansGorsel) toplam += 2;
  if (sahne.seslendirme?.trim()) toplam += 3;
  return Math.max(1, Math.round(toplam));
}

/** Projenin toplam kredi maliyeti (müzik/altyazı ek yükleri dahil). */
export function projeKredi(
  proje: UzunProje,
  modelKredisi: (modelAd: string) => number,
): number {
  const sahneToplam = proje.sahneler.reduce(
    (a, sh) => a + sahneKredi(sh, modelKredisi(sh.model), proje.cozunurluk), 0);
  const dk = toplamSure(proje) / 60;
  const muzik = proje.muzik ? Math.ceil(dk) * 4 : 0;   // dakika başı 4 kredi
  const altyazi = proje.altyazi ? Math.ceil(dk) * 2 : 0; // dakika başı 2 kredi
  return sahneToplam + muzik + altyazi;
}

/* ═══════════ SAHNE AI YARDIMCILARI (deterministik, LLM'siz) ═══════════ */

// Sinematik betimleme ekleri — promptun tonuna göre zenginleştirir.
const AI_ATMOSFER = [
  "yumuşak sinematik ışık", "sığ alan derinliği, arka plan bokeh", "film grain dokusu",
  "altın saat tonlaması", "atmosferik sis ve hacimsel ışık", "35mm anamorfik parlamalar",
];
const AI_HAREKET = [
  "yavaş kamera kaydırması", "hafif el kamerası dokusu", "akıcı dolly hareketi",
  "yörünge çekimi", "yavaş zoom", "sabit tripod kompozisyon",
];

/**
 * Bir sahnenin kısa promptunu SİNEMATİK bir çekim tarifine genişletir.
 * LLM'siz, deterministik: sahne id'sine göre tutarlı atmosfer + hareket ekler.
 */
export function aiSahneGenislet(sahne: UzunSahne): string {
  const taban = sahne.prompt.trim();
  if (!taban) return taban;
  // sahne id'sinden deterministik indeks (SSR-güvenli)
  const tohum = sahne.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const atmosfer = AI_ATMOSFER[tohum % AI_ATMOSFER.length];
  const hareket = AI_HAREKET[(tohum >> 2) % AI_HAREKET.length];
  const kam = sahne.kamera && sahne.kamera !== "Statik" ? `, ${sahne.kamera.toLowerCase()}` : "";
  // zaten genişletilmişse tekrar ekleme yapma
  if (taban.includes(atmosfer)) return taban;
  return `${taban} — ${atmosfer}, ${hareket}${kam}. Profesyonel renk düzeltmesi, yüksek prodüksiyon değeri.`;
}

/**
 * Sahnenin konumuna (beat) göre akıllı kamera + geçiş + süre önerisi.
 * beatYonerge'yi kullanır; sahne sırasına göre dramaturjik uygun çekim dili.
 */
export function aiSahneOner(sira: number, toplam: number): { kamera: string; gecis: UzunGecis; sure: number } {
  const y = beatYonerge(sira, toplam);
  return { kamera: y.kamera, gecis: sira === 0 ? "kesme" : y.gecis, sure: y.sure };
}

/** Saniyeyi "3:24" / "1:02:15" biçimine çevir. */
export function sureBicim(sn: number): string {
  const s = Math.max(0, Math.round(sn));
  const sa = Math.floor(s / 3600);
  const dk = Math.floor((s % 3600) / 60);
  const sn2 = s % 60;
  if (sa > 0) return `${sa}:${String(dk).padStart(2, "0")}:${String(sn2).padStart(2, "0")}`;
  return `${dk}:${String(sn2).padStart(2, "0")}`;
}
