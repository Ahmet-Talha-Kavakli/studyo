"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * useMontaj — Montaj Stüdyosu durumu.
 *
 * GERÇEK bir video editörü modeli: çok katmanlı zaman çizelgesi (video / ses /
 * metin), klip başına kırpma + hız + ses + geçiş + efekt, playhead, seçim,
 * geri al / yinele geçmişi ve GERÇEKTEN farklı işler yapan AI komutları.
 *
 * Zaman modeli: her klibin timeline'daki yeri `baslangic` (sn) ile tutulur;
 * `sure` = kaynak süresi, `basKirp`/`sonKirp` = kırpma. Ekranda kapladığı süre
 * `klipSure()` ile hesaplanır (kırpma + hız birlikte).
 */

export type MontajEfekt =
  | "grade-sicak" | "grade-soguk" | "grade-sinematik" | "grade-siyahbeyaz" | "grade-vintage"
  | "bulanik" | "vinyet" | "grenli" | "keskinlik" | "yakinlas" | "sarsinti";

export type MontajGecis = "yok" | "kesme" | "fade" | "kaydir" | "yakinlas" | "bulanik" | "beyazparla";

export type KatmanTur = "video" | "ses" | "metin";

/**
 * Renk düzeltme (color grade) — klip başına CANLI uygulanan gerçek parametreler.
 * Hepsi CSS filter/transform'a çevrilir (renkGradeCss). Preset efektlerin üstüne biner.
 */
export interface RenkAyar {
  pozlama: number;     // -100..100 → brightness
  kontrast: number;    // -100..100 → contrast
  doygunluk: number;   // -100..100 → saturate
  sicaklik: number;    // -100..100 → hue-rotate + sepia karışımı (sıcak/soğuk)
  tonlama: number;     // -100..100 → hue-rotate (renk kayması)
  parlaklik: number;   // -100..100 → ek brightness (highlights hissi)
}

export function bosRenk(): RenkAyar {
  return { pozlama: 0, kontrast: 0, doygunluk: 0, sicaklik: 0, tonlama: 0, parlaklik: 0 };
}

/** Bir keyframe: klip-içi `t` saniyesinde bir özelliğin değeri. */
export interface Keyframe {
  t: number;           // klip-içi zaman (görünen sn, 0..klipSure)
  deger: number;
}

/** Keyframe'lenebilir özellikler. */
export type KfOzellik = "opaklik" | "olcek" | "x" | "y" | "donme";

export interface MontajKlip {
  id: string;
  kaynakId?: string;    // useProjeler üretim id'si (varsa)
  ad: string;
  tur: "video" | "gorsel" | "ses" | "metin";
  baslangic: number;    // timeline'daki başlangıç (sn)
  sure: number;         // kaynak süresi (sn)
  basKirp: number;      // baştan kırpılan (sn)
  sonKirp: number;      // sondan kırpılan (sn)
  hiz: number;          // 0.25–4 (1 = normal)
  hizSonu?: number;     // speed-ramp hedef hızı (varsa hiz→hizSonu rampa)
  sesDuzey: number;     // 0–100
  sesGiris?: number;    // ses fade-in süresi (sn)
  sesCikis?: number;    // ses fade-out süresi (sn)
  opaklik: number;      // 0–100
  sesUrl?: string;      // gerçek ses/video kaynağı (çalınabilir data/http URL)
  videoUrl?: string;    // video klibinin oynatılabilir kaynağı (kare kare çizilir)
  olcek?: number;       // % 100 = normal (dönüşüm)
  konumX?: number;      // % -100..100 (pan)
  konumY?: number;
  donme?: number;       // derece
  gorselUrl?: string;
  efektler: MontajEfekt[];
  renk?: RenkAyar;      // canlı renk düzeltme
  keyframeler?: Partial<Record<KfOzellik, Keyframe[]>>;  // özellik → keyframe dizisi
  gecis: MontajGecis;   // bu klibe GİRİŞ geçişi
  gecisSure: number;    // sn
  // metin klibi alanları
  metin?: string;
  metinBoyut?: number;
  metinRenk?: string;
  metinKonum?: "ust" | "orta" | "alt";
  metinStil?: MetinStil;      // hazır yazı stili
  metinArka?: boolean;        // yazının arkasında kutu
  metinAnim?: MetinAnim;      // giriş animasyonu
  metinHiza?: "sol" | "orta" | "sag";
  metinCikis?: MetinCikis;    // çıkış animasyonu
  /** Karaoke: sözcüklerin klip içi zamanları (yoksa klip süresine eşit dağıtılır). */
  kelimeler?: { k: string; b: number; s: number }[];
  vurguRenk?: string;         // karaoke/vurgulu sözcük rengi
  /* Görüntü */
  sigdir?: "doldur" | "sigdir" | "bulanik";   // kareye yerleşim
  aynaX?: boolean;
  aynaY?: boolean;
  cikisSure?: number;         // sona doğru kararma (sn)
  /** Öğe (şekil, alt bant, ilerleme çubuğu, logo) — yazı katmanında çizilir. */
  oge?: MontajOge;
  etiketRenk?: string;        // zaman çizelgesinde klip rengi
  /* Pro görüntü */
  kirp?: { l: number; t: number; r: number; b: number };  // kaynaktan kırpma (% her kenar)
  maske?: MontajMaske;
  maskeYumusak?: number;      // maske kenar yumuşaklığı (px @1080)
  karisim?: MontajKarisim;    // alt katmanla karışım modu
  krom?: { renk: string; esik: number; yumusak: number };  // renk anahtarı (yeşil/mavi perde)
  /* Pro ses */
  sesIyilestir?: boolean;     // gürültü kesme + netlik + kompresör
  sesEfekt?: SesEfekt;
  /* Pro yazı */
  metinFont?: string;         // yazı tipi kimliği (fontlar.ts)
  metinKontur?: number;       // kontur kalınlığı (% boyut)
  metinKonturRenk?: string;
  metinGolge?: boolean;
  metinAralik?: number;       // harf aralığı (% boyut, -10..60)
  metinSatir?: number;        // satır yüksekliği çarpanı (0.9..2)
  metinKutuRenk?: string;     // arka kutu rengi
}

export type MontajMaske = "yok" | "daire" | "yuvarlak" | "elmas" | "kalp" | "yildiz" | "serit";
export type MontajKarisim = "normal" | "screen" | "multiply" | "overlay" | "lighten" | "darken" | "soft-light" | "difference";
export type SesEfekt = "yok" | "radyo" | "telefon" | "yanki" | "bas" | "salon";

export interface MontajOge {
  tip: "sekil" | "altbant" | "ilerleme" | "logo";
  sekil?: "dikdortgen" | "daire" | "cizgi" | "cerceve" | "kose";
  renk: string;
  renk2?: string;
  baslik?: string;
  alt?: string;
  koseler?: number;           // köşe yuvarlaklığı (%)
}
export type MetinCikis = "yok" | "fade" | "asagi" | "kucul";

export type MetinStil = "baslik" | "altbaslik" | "altyazi" | "etiket" | "alinti" | "sinematik" | "karaoke" | "tiktok" | "neon";
export type MetinAnim = "yok" | "fade" | "yukari" | "pop" | "daktilo";

/** Projeye yüklenen ya da eklenen medya (medya kutusu). */
export interface MedyaOge {
  id: string;
  ad: string;
  tur: "video" | "gorsel" | "ses";
  url: string;            // oynatılabilir kaynak
  poster?: string;        // video için kapak
  sure?: number;          // sn (video/ses)
  kaynakId?: string;      // üretimden geldiyse
}

export interface MontajKatman {
  id: string;
  tur: KatmanTur;
  ad: string;
  klipler: MontajKlip[];
  sessiz: boolean;
  kilitli: boolean;
  gizli: boolean;
  duzey?: number;           // katman ses düzeyi (mikser, 0–150)
  rol?: "muzik" | "konusma"; // otomatik kısma için
  solo?: boolean;           // yalnız bu katmanı dinle
}

export interface MontajProje {
  id: string;
  ad: string;
  katmanlar: MontajKatman[];
  altyazi: boolean;
  enBoy: MontajOran;
  cozunurluk: "720p" | "1080p" | "4K";
  fps: 24 | 30 | 60;
  aiTalimat: string;
  guncelleme: number;
  arkaRenk?: string;      // boş alan / letterbox rengi
  isaretler?: { t: number; ad?: string }[];  // zaman çizelgesi işaretçileri
  kisma?: boolean;        // konuşma/video sesi varken müziği otomatik kıs
  medya?: MedyaOge[];     // medya kutusu
  olusturma?: number;
  /** Elle kaydedilen sürümler (en yenisi başta, en çok 12). */
  surumler?: { id: string; ad: string; tarih: number; katmanlar: MontajKatman[]; sure: number }[];
}

export type MontajOran = "16:9" | "9:16" | "1:1" | "4:5";

export interface MontajMarka { renkler: string[]; font?: string; logo?: string; ad?: string }

/** Geri al/yinele için anlık görüntü (yalnız katmanlar — ayarlar hariç). */
interface Anlik { katmanlar: MontajKatman[] }

interface MontajState {
  projeler: MontajProje[];
  aktifId: string | null;
  // oturumluk (persist edilmez)
  playhead: number;
  oynuyor: boolean;
  seciliKlipId: string | null;
  /** Çoklu seçim (Shift+tık / Ctrl+A); birincil seçim seciliKlipId. */
  secimler: string[];
  secimAyarla: (ids: string[]) => void;
  zoom: number;              // px / saniye
  /** Ripple modu: silme/kırpma sonrası aynı katmandaki sonraki klipler kayar (oturumluk). */
  ripple: boolean;
  rippleAyarla: (v: boolean) => void;
  /** Zaman çizelgesinde incelenen aralıklar (ör. bulunan sessizlikler) — mor şeritle gösterilir. */
  vurgular: { bas: number; son: number; etkin: boolean }[];
  /** Marka seti (kalıcı, tüm projelerde): renkler, yazı tipi, logo. */
  marka: MontajMarka;
  markaAyarla: (patch: Partial<MontajMarka>) => void;
  vurguAyarla: (v: { bas: number; son: number; etkin: boolean }[]) => void;
  pano: MontajKlip | null;   // kopyala/yapıştır panosu (oturumluk)
  gecmis: Record<string, { geri: Anlik[]; ileri: Anlik[] }>;

  projeOlustur: (patch?: Partial<MontajProje>) => string;
  projeSec: (id: string | null) => void;
  projeGuncelle: (id: string, patch: Partial<MontajProje>) => void;
  projeSil: (id: string) => void;

  katmanEkle: (projeId: string, tur: KatmanTur) => void;
  katmanSil: (projeId: string, katmanId: string) => void;
  katmanGuncelle: (projeId: string, katmanId: string, patch: Partial<MontajKatman>) => void;

  klipEkle: (projeId: string, katmanId: string, klip: Partial<MontajKlip> & { ad: string; tur: MontajKlip["tur"] }) => string;
  klipGuncelle: (projeId: string, klipId: string, patch: Partial<MontajKlip>) => void;
  klipSil: (projeId: string, klipId: string) => void;
  klipCogalt: (projeId: string, klipId: string) => void;
  klipBol: (projeId: string, klipId: string, konum: number) => void;   // playhead konumunda böl
  klipTasi: (projeId: string, klipId: string, yeniBaslangic: number, hedefKatmanId?: string) => void;
  klipEfektToggle: (projeId: string, klipId: string, efekt: MontajEfekt) => void;
  klipleriSirala: (projeId: string, katmanId: string) => void;  // boşlukları kapat, sırala

  /* ── PRO ARAÇLAR ── */
  renkAyarla: (projeId: string, klipId: string, patch: Partial<RenkAyar>) => void;
  renkSifirla: (projeId: string, klipId: string) => void;
  /** Klip-içi t anına, o an geçerli değerle bir keyframe koy/güncelle. */
  keyframeEkle: (projeId: string, klipId: string, ozellik: KfOzellik, t: number) => void;
  keyframeSil: (projeId: string, klipId: string, ozellik: KfOzellik, t: number) => void;
  keyframeTemizle: (projeId: string, klipId: string, ozellik: KfOzellik) => void;
  /** Seçili klibi panoya kopyala. */
  klipKopyala: (projeId: string, klipId: string) => void;
  /** Panodaki klibi bir katmana, playhead konumuna yapıştır. */
  klipYapistir: (projeId: string, katmanId: string, konum: number) => string | null;

  playheadAyarla: (sn: number) => void;
  oynatDurdur: (v?: boolean) => void;
  klipSec: (id: string | null) => void;
  zoomAyarla: (z: number) => void;

  geriAl: (projeId: string) => void;
  yinele: (projeId: string) => void;
  /** Sürükleme/kırpma gibi çok adımlı işlemlerden ÖNCE bir kez çağrılır (tek geri al adımı). */
  anlikKaydet: (projeId: string) => void;
  gecmisVar: (projeId: string) => { geri: boolean; ileri: boolean };

  aiUygula: (projeId: string, komut: AiKomutId) => string;  // sonuç açıklaması döner
}

export type AiKomutId = "kurgu" | "reel" | "grade" | "tempo" | "altyazi" | "sessizlik" | "gecis";

let sayac = 0;
const yid = (p: string) => { sayac += 1; return `${p}_${sayac}_${Math.floor(Math.random() * 1e6)}`; };

/** Bir klibin timeline'da kapladığı gerçek süre (kırpma + hız). */
export function klipSure(k: MontajKlip): number {
  const ham = Math.max(0.1, k.sure - k.basKirp - k.sonKirp);
  return ham / Math.max(0.25, k.hiz);
}

/** Projenin toplam süresi = en uzak klip bitişi. */
export function montajToplamSure(p: MontajProje): number {
  let son = 0;
  for (const kat of p.katmanlar) {
    for (const k of kat.klipler) son = Math.max(son, k.baslangic + klipSure(k));
  }
  return son;
}

/** Verilen anda o katmanda çalan klip. */
export function anlikKlip(kat: MontajKatman, t: number): MontajKlip | null {
  for (const k of kat.klipler) {
    if (t >= k.baslangic && t < k.baslangic + klipSure(k)) return k;
  }
  return null;
}

function bosKatmanlar(): MontajKatman[] {
  return [
    { id: yid("kat"), tur: "video", ad: "Video 1", klipler: [], sessiz: false, kilitli: false, gizli: false },
    { id: yid("kat"), tur: "ses", ad: "Ses 1", klipler: [], sessiz: false, kilitli: false, gizli: false },
  ];
}

/** Katmanlardaki tüm klipleri düz liste yapar (arama için). */
function tumKlipler(p: MontajProje): MontajKlip[] {
  return p.katmanlar.flatMap((k) => k.klipler);
}

export const useMontaj = create<MontajState>()(
  persist(
    (set, get) => {
      /** Değişiklikten ÖNCE anlık görüntü al (geri al için). */
      const anlikAl = (projeId: string) => {
        const p = get().projeler.find((x) => x.id === projeId);
        if (!p) return;
        set((s) => {
          const g = s.gecmis[projeId] ?? { geri: [], ileri: [] };
          return {
            gecmis: {
              ...s.gecmis,
              [projeId]: {
                geri: [...g.geri, { katmanlar: JSON.parse(JSON.stringify(p.katmanlar)) }].slice(-40),
                ileri: [], // yeni işlem → yinele zinciri kırılır
              },
            },
          };
        });
      };

      /** Katmanları güncelleyen ortak yardımcı (geçmiş kaydıyla). */
      const katmanlariYaz = (projeId: string, fn: (kats: MontajKatman[]) => MontajKatman[], gecmisle = true) => {
        if (gecmisle) anlikAl(projeId);
        set((s) => ({
          projeler: s.projeler.map((p) =>
            p.id === projeId ? { ...p, katmanlar: fn(p.katmanlar), guncelleme: Date.now() } : p),
        }));
      };

      return {
        projeler: [],
        aktifId: null,
        playhead: 0,
        oynuyor: false,
        seciliKlipId: null,
        secimler: [],
        secimAyarla: (ids) => set({ secimler: ids, seciliKlipId: ids[ids.length - 1] ?? null }),
        zoom: 40,
        ripple: false,
        rippleAyarla: (v) => set({ ripple: v }),
        vurgular: [],
        marka: { renkler: ["#22d3ee", "#ffffff", "#0b0d10"] },
        markaAyarla: (patch) => set((s) => ({ marka: { ...s.marka, ...patch } })),
        vurguAyarla: (v) => set({ vurgular: v }),
        pano: null,
        gecmis: {},

        projeOlustur: (patch) => {
          const id = yid("mn");
          const proje: MontajProje = {
            id,
            ad: patch?.ad ?? "Adsız montaj",
            katmanlar: patch?.katmanlar ?? bosKatmanlar(),
            altyazi: patch?.altyazi ?? false,
            enBoy: patch?.enBoy ?? "16:9",
            cozunurluk: patch?.cozunurluk ?? "1080p",
            fps: patch?.fps ?? 30,
            aiTalimat: patch?.aiTalimat ?? "",
            guncelleme: Date.now(),
            olusturma: Date.now(),
            arkaRenk: patch?.arkaRenk ?? "#000000",
            medya: patch?.medya ?? [],
          };
          set((s) => ({ projeler: [proje, ...s.projeler], aktifId: id, playhead: 0, seciliKlipId: null }));
          return id;
        },
        projeSec: (id) => set({ aktifId: id, playhead: 0, oynuyor: false, seciliKlipId: null }),
        projeGuncelle: (id, patch) =>
          set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, ...patch, guncelleme: Date.now() } : p)) })),
        projeSil: (id) =>
          set((s) => ({ projeler: s.projeler.filter((p) => p.id !== id), aktifId: s.aktifId === id ? null : s.aktifId })),

        katmanEkle: (projeId, tur) =>
          katmanlariYaz(projeId, (kats) => {
            const ayni = kats.filter((k) => k.tur === tur).length + 1;
            const ad = tur === "video" ? `Video ${ayni}` : tur === "ses" ? `Ses ${ayni}` : `Metin ${ayni}`;
            const yeni: MontajKatman = { id: yid("kat"), tur, ad, klipler: [], sessiz: false, kilitli: false, gizli: false };
            // video katmanları üstte, ses altta kalsın
            return tur === "ses" ? [...kats, yeni] : [yeni, ...kats];
          }),
        katmanSil: (projeId, katmanId) =>
          katmanlariYaz(projeId, (kats) => (kats.length <= 1 ? kats : kats.filter((k) => k.id !== katmanId))),
        katmanGuncelle: (projeId, katmanId, patch) =>
          katmanlariYaz(projeId, (kats) => kats.map((k) => (k.id === katmanId ? { ...k, ...patch } : k)), false),

        klipEkle: (projeId, katmanId, klip) => {
          const id = yid("kl");
          katmanlariYaz(projeId, (kats) => kats.map((kat) => {
            if (kat.id !== katmanId) return kat;
            // varsayılan: katmanın sonuna ekle
            const son = kat.klipler.reduce((a, k) => Math.max(a, k.baslangic + klipSure(k)), 0);
            const yeni: MontajKlip = {
              id, kaynakId: klip.kaynakId, ad: klip.ad, tur: klip.tur,
              baslangic: klip.baslangic ?? son,
              sure: klip.sure ?? (klip.tur === "video" ? 8 : klip.tur === "ses" ? 15 : 4),
              basKirp: 0, sonKirp: 0, hiz: 1,
              sesDuzey: klip.tur === "ses" ? 70 : 100,
              opaklik: 100,
              gorselUrl: klip.gorselUrl, videoUrl: klip.videoUrl, sesUrl: klip.sesUrl,
              efektler: [], gecis: "yok", gecisSure: 0.5,
              metin: klip.metin, metinBoyut: klip.metinBoyut ?? 42,
              metinRenk: klip.metinRenk ?? "#ffffff", metinKonum: klip.metinKonum ?? "alt",
              metinStil: klip.metinStil, metinArka: klip.metinArka, metinAnim: klip.metinAnim, metinHiza: klip.metinHiza,
              metinCikis: klip.metinCikis, kelimeler: klip.kelimeler, vurguRenk: klip.vurguRenk, sigdir: klip.sigdir,
              oge: klip.oge, etiketRenk: klip.etiketRenk, olcek: klip.olcek, konumX: klip.konumX, konumY: klip.konumY,
              kirp: klip.kirp, maske: klip.maske, maskeYumusak: klip.maskeYumusak, karisim: klip.karisim, krom: klip.krom,
              sesIyilestir: klip.sesIyilestir, sesEfekt: klip.sesEfekt, metinFont: klip.metinFont, metinKontur: klip.metinKontur,
              metinKonturRenk: klip.metinKonturRenk, metinGolge: klip.metinGolge, metinAralik: klip.metinAralik, metinSatir: klip.metinSatir, metinKutuRenk: klip.metinKutuRenk,
              ...(klip.sesDuzey !== undefined ? { sesDuzey: klip.sesDuzey } : {}), ...(klip.hiz ? { hiz: klip.hiz } : {}),
              ...(klip.gecis ? { gecis: klip.gecis, gecisSure: klip.gecisSure ?? 0.5 } : {}), ...(klip.efektler ? { efektler: klip.efektler } : {}),
              ...(klip.basKirp ? { basKirp: klip.basKirp } : {}), ...(klip.sonKirp ? { sonKirp: klip.sonKirp } : {}),
            };
            return { ...kat, klipler: [...kat.klipler, yeni] };
          }));
          return id;
        },
        klipGuncelle: (projeId, klipId, patch) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat, klipler: kat.klipler.map((k) => (k.id === klipId ? { ...k, ...patch } : k)),
          })), false),
        klipSil: (projeId, klipId) => {
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({ ...kat, klipler: kat.klipler.filter((k) => k.id !== klipId) })));
          if (get().seciliKlipId === klipId) set({ seciliKlipId: null });
        },
        klipCogalt: (projeId, klipId) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => {
            const k = kat.klipler.find((x) => x.id === klipId);
            if (!k) return kat;
            const kopya: MontajKlip = { ...k, id: yid("kl"), baslangic: k.baslangic + klipSure(k) };
            // kopyayı araya sok, sonrakileri kaydır
            const kaydirilmis = kat.klipler.map((x) =>
              x.baslangic >= kopya.baslangic && x.id !== k.id ? { ...x, baslangic: x.baslangic + klipSure(k) } : x);
            return { ...kat, klipler: [...kaydirilmis, kopya].sort((a, b) => a.baslangic - b.baslangic) };
          })),
        klipBol: (projeId, klipId, konum) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => {
            const k = kat.klipler.find((x) => x.id === klipId);
            if (!k) return kat;
            const yerel = konum - k.baslangic;              // klip içi konum (görünen sn)
            const gorunen = klipSure(k);
            if (yerel <= 0.2 || yerel >= gorunen - 0.2) return kat;  // uçlara çok yakınsa bölme
            const hamYerel = yerel * Math.max(0.25, k.hiz); // kaynak zamanına çevir
            const sol: MontajKlip = { ...k, sonKirp: k.sonKirp + (k.sure - k.basKirp - k.sonKirp) - hamYerel };
            const sag: MontajKlip = {
              ...k, id: yid("kl"), baslangic: konum,
              basKirp: k.basKirp + hamYerel, gecis: "yok",
            };
            return { ...kat, klipler: [...kat.klipler.filter((x) => x.id !== klipId), sol, sag].sort((a, b) => a.baslangic - b.baslangic) };
          })),
        klipTasi: (projeId, klipId, yeniBaslangic, hedefKatmanId) =>
          katmanlariYaz(projeId, (kats) => {
            let tasinan: MontajKlip | null = null;
            const cikarilmis = kats.map((kat) => {
              const bul = kat.klipler.find((k) => k.id === klipId);
              if (bul && (hedefKatmanId ? kat.id !== hedefKatmanId : false)) {
                tasinan = bul;
                return { ...kat, klipler: kat.klipler.filter((k) => k.id !== klipId) };
              }
              return kat;
            });
            return cikarilmis.map((kat) => {
              // aynı katmanda taşıma
              if (kat.klipler.some((k) => k.id === klipId)) {
                return {
                  ...kat,
                  klipler: kat.klipler.map((k) => (k.id === klipId ? { ...k, baslangic: Math.max(0, yeniBaslangic) } : k))
                    .sort((a, b) => a.baslangic - b.baslangic),
                };
              }
              // farklı katmana taşıma
              if (tasinan && hedefKatmanId && kat.id === hedefKatmanId) {
                return {
                  ...kat,
                  klipler: [...kat.klipler, { ...(tasinan as MontajKlip), baslangic: Math.max(0, yeniBaslangic) }]
                    .sort((a, b) => a.baslangic - b.baslangic),
                };
              }
              return kat;
            });
          }, false),
        klipEfektToggle: (projeId, klipId, efekt) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat,
            klipler: kat.klipler.map((k) => k.id === klipId
              ? { ...k, efektler: k.efektler.includes(efekt) ? k.efektler.filter((e) => e !== efekt) : [...k.efektler, efekt] }
              : k),
          })), false),
        klipleriSirala: (projeId, katmanId) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => {
            if (kat.id !== katmanId) return kat;
            let imlec = 0;
            const sirali = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic).map((k) => {
              const y = { ...k, baslangic: imlec };
              imlec += klipSure(k);
              return y;
            });
            return { ...kat, klipler: sirali };
          })),

        /* ── PRO ARAÇLAR ── */
        renkAyarla: (projeId, klipId, patch) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat,
            klipler: kat.klipler.map((k) => k.id === klipId
              ? { ...k, renk: { ...(k.renk ?? bosRenk()), ...patch } } : k),
          })), false),
        renkSifirla: (projeId, klipId) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat, klipler: kat.klipler.map((k) => (k.id === klipId ? { ...k, renk: bosRenk() } : k)),
          }))),
        keyframeEkle: (projeId, klipId, ozellik, t) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat,
            klipler: kat.klipler.map((k) => {
              if (k.id !== klipId) return k;
              // o an geçerli değeri anahtar olarak koy (yoksa özelliğin taban değeri)
              const anlik = kfAnlikDeger(k, ozellik, t);
              const mevcut = k.keyframeler?.[ozellik] ?? [];
              const digerleri = mevcut.filter((kf) => Math.abs(kf.t - t) > 0.02);
              const yeni = [...digerleri, { t: Math.max(0, t), deger: anlik }].sort((a, b) => a.t - b.t);
              return { ...k, keyframeler: { ...k.keyframeler, [ozellik]: yeni } };
            }),
          })), false),
        keyframeSil: (projeId, klipId, ozellik, t) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat,
            klipler: kat.klipler.map((k) => {
              if (k.id !== klipId) return k;
              const mevcut = k.keyframeler?.[ozellik] ?? [];
              const yeni = mevcut.filter((kf) => Math.abs(kf.t - t) > 0.02);
              return { ...k, keyframeler: { ...k.keyframeler, [ozellik]: yeni } };
            }),
          })), false),
        keyframeTemizle: (projeId, klipId, ozellik) =>
          katmanlariYaz(projeId, (kats) => kats.map((kat) => ({
            ...kat,
            klipler: kat.klipler.map((k) => {
              if (k.id !== klipId) return k;
              const kfs = { ...k.keyframeler }; delete kfs[ozellik];
              return { ...k, keyframeler: kfs };
            }),
          }))),
        klipKopyala: (projeId, klipId) => {
          const p = get().projeler.find((x) => x.id === projeId);
          const k = p ? tumKlipler(p).find((x) => x.id === klipId) : null;
          if (k) set({ pano: JSON.parse(JSON.stringify(k)) });
        },
        klipYapistir: (projeId, katmanId, konum) => {
          const pano = get().pano;
          if (!pano) return null;
          const id = yid("kl");
          katmanlariYaz(projeId, (kats) => kats.map((kat) => {
            if (kat.id !== katmanId) return kat;
            const kopya: MontajKlip = { ...JSON.parse(JSON.stringify(pano)), id, baslangic: Math.max(0, konum), gecis: "yok" };
            return { ...kat, klipler: [...kat.klipler, kopya].sort((a, b) => a.baslangic - b.baslangic) };
          }));
          return id;
        },

        playheadAyarla: (sn) => set({ playhead: Math.max(0, sn) }),
        oynatDurdur: (v) => set((s) => ({ oynuyor: v ?? !s.oynuyor })),
        klipSec: (id) => set({ seciliKlipId: id, secimler: id ? [id] : [] }),
        zoomAyarla: (z) => set({ zoom: Math.max(10, Math.min(200, z)) }),

        geriAl: (projeId) => {
          const s = get();
          const g = s.gecmis[projeId];
          const p = s.projeler.find((x) => x.id === projeId);
          if (!g?.geri.length || !p) return;
          const oncekiler = [...g.geri];
          const hedef = oncekiler.pop()!;
          set({
            projeler: s.projeler.map((x) => (x.id === projeId ? { ...x, katmanlar: hedef.katmanlar, guncelleme: Date.now() } : x)),
            gecmis: { ...s.gecmis, [projeId]: { geri: oncekiler, ileri: [...g.ileri, { katmanlar: p.katmanlar }] } },
          });
        },
        yinele: (projeId) => {
          const s = get();
          const g = s.gecmis[projeId];
          const p = s.projeler.find((x) => x.id === projeId);
          if (!g?.ileri.length || !p) return;
          const sonrakiler = [...g.ileri];
          const hedef = sonrakiler.pop()!;
          set({
            projeler: s.projeler.map((x) => (x.id === projeId ? { ...x, katmanlar: hedef.katmanlar, guncelleme: Date.now() } : x)),
            gecmis: { ...s.gecmis, [projeId]: { geri: [...g.geri, { katmanlar: p.katmanlar }], ileri: sonrakiler } },
          });
        },
        anlikKaydet: (projeId) => anlikAl(projeId),
        gecmisVar: (projeId) => {
          const g = get().gecmis[projeId];
          return { geri: !!g?.geri.length, ileri: !!g?.ileri.length };
        },

        /* ── AI KOMUTLARI — her biri GERÇEKTEN farklı bir dönüşüm yapar ── */
        aiUygula: (projeId, komut) => {
          const proje = get().projeler.find((p) => p.id === projeId);
          if (!proje) return "Proje bulunamadı";
          const videoKat = proje.katmanlar.filter((k) => k.tur === "video");
          const toplamKlip = videoKat.reduce((a, k) => a + k.klipler.length, 0);
          if (toplamKlip === 0 && komut !== "altyazi") return "Önce klip ekle";

          if (komut === "kurgu") {
            // Dinamik kurgu: kısa kesimler + sinematik grade + geçişler + sıkıştır
            katmanlariYaz(projeId, (kats) => kats.map((kat) => {
              if (kat.tur !== "video") return kat;
              let imlec = 0;
              const klipler = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic).map((k, i) => {
                const hedefSure = i === 0 ? 4 : 2.6;
                const ham = Math.max(0.5, k.sure - k.basKirp);
                const sonKirp = Math.max(0, k.sure - k.basKirp - Math.min(ham, hedefSure));
                const y: MontajKlip = {
                  ...k, sonKirp, hiz: 1, baslangic: imlec,
                  efektler: Array.from(new Set([...k.efektler, "grade-sinematik" as MontajEfekt])),
                  gecis: i === 0 ? "fade" : "kesme", gecisSure: 0.4,
                };
                imlec += klipSure(y);
                return y;
              });
              return { ...kat, klipler };
            }));
            return `${toplamKlip} klip dinamik kurgulandı · sinematik grade + geçişler`;
          }

          if (komut === "reel") {
            // 30sn reel: her klibin başından en çok 3 sn'lik dilim (içerik analizi yok), toplam 30sn'i
            // aşmasın; hepsini sıkıştır ve 9:16 dikeye al.
            const payDilim = Math.max(1.2, Math.min(3, 30 / Math.max(1, toplamKlip)));
            katmanlariYaz(projeId, (kats) => kats.map((kat) => {
              if (kat.tur !== "video") return kat;
              let imlec = 0;
              const klipler = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic).map((k) => {
                const ham = Math.max(0.5, k.sure - k.basKirp);
                const sonKirp = Math.max(0, k.sure - k.basKirp - Math.min(ham, payDilim));
                const y: MontajKlip = {
                  ...k, sonKirp, baslangic: imlec, gecis: "yakinlas", gecisSure: 0.25,
                  efektler: Array.from(new Set([...k.efektler, "yakinlas" as MontajEfekt])),
                };
                imlec += klipSure(y);
                return y;
              });
              return { ...kat, klipler };
            }));
            set((s) => ({ projeler: s.projeler.map((p) => (p.id === projeId ? { ...p, enBoy: "9:16", altyazi: true } : p)) }));
            return `30 saniyeye kadar dikey reel hazırlandı · 9:16, altyazı açık`;
          }

          if (komut === "grade") {
            // Sadece renk: tüm video kliplere sinematik + vinyet, başka şeye dokunma
            katmanlariYaz(projeId, (kats) => kats.map((kat) => kat.tur !== "video" ? kat : {
              ...kat,
              klipler: kat.klipler.map((k) => ({
                ...k,
                efektler: Array.from(new Set([...k.efektler.filter((e) => !e.startsWith("grade-")), "grade-sinematik" as MontajEfekt, "vinyet" as MontajEfekt])),
              })),
            }));
            return `${toplamKlip} klibe sinematik grade + vinyet uygulandı`;
          }

          if (komut === "tempo") {
            // Tempo: dönüşümlü hız (1.5× / 0.6×) — ritmik his
            katmanlariYaz(projeId, (kats) => kats.map((kat) => {
              if (kat.tur !== "video") return kat;
              let imlec = 0;
              const klipler = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic).map((k, i) => {
                const y: MontajKlip = { ...k, hiz: i % 3 === 2 ? 0.6 : 1.5, baslangic: imlec };
                imlec += klipSure(y);
                return y;
              });
              return { ...kat, klipler };
            }));
            return `Ritmik tempo uygulandı · hızlı kesim + ağır çekim vurgular`;
          }

          if (komut === "gecis") {
            // Geçiş: sırayla fade / kaydır / bulanık dağıt
            const desen: MontajGecis[] = ["fade", "kaydir", "bulanik", "beyazparla"];
            katmanlariYaz(projeId, (kats) => kats.map((kat) => kat.tur !== "video" ? kat : {
              ...kat,
              klipler: kat.klipler.map((k, i) => ({ ...k, gecis: desen[i % desen.length], gecisSure: 0.5 })),
            }));
            return `Tüm kesimlere geçiş eklendi · fade / kaydır / bulanık`;
          }

          if (komut === "sessizlik") {
            // Sessizlikleri kes: kısa klipleri at, kalanları sıkıştır (boşluk bırakma)
            let atilan = 0;
            katmanlariYaz(projeId, (kats) => kats.map((kat) => {
              if (kat.tur !== "video") return kat;
              const kalan = kat.klipler.filter((k) => { const ok = klipSure(k) >= 1; if (!ok) atilan += 1; return ok; });
              let imlec = 0;
              const klipler = [...kalan].sort((a, b) => a.baslangic - b.baslangic).map((k) => {
                const y = { ...k, baslangic: imlec };
                imlec += klipSure(k);
                return y;
              });
              return { ...kat, klipler };
            }));
            return atilan > 0 ? `${atilan} kısa/boş klip atıldı · boşluklar kapatıldı` : `Boşluklar kapatıldı · timeline sıkıştırıldı`;
          }

          if (komut === "altyazi") {
            // Altyazı: metin katmanı oluştur + her video klibi için metin klibi üret
            const kaynak = videoKat[0]?.klipler ?? [];
            if (kaynak.length === 0) return "Önce klip ekle";
            anlikAl(projeId);
            const metinKlipler: MontajKlip[] = kaynak.map((k) => ({
              id: yid("kl"), ad: `Altyazı: ${k.ad.slice(0, 18)}`, tur: "metin",
              baslangic: k.baslangic, sure: klipSure(k), basKirp: 0, sonKirp: 0,
              hiz: 1, sesDuzey: 0, opaklik: 100, efektler: [], gecis: "fade", gecisSure: 0.2,
              metin: "Altyazı metni", metinBoyut: 38, metinRenk: "#ffffff", metinKonum: "alt",
            }));
            set((s) => ({
              projeler: s.projeler.map((p) => {
                if (p.id !== projeId) return p;
                const mevcut = p.katmanlar.find((x) => x.tur === "metin");
                const katmanlar = mevcut
                  ? p.katmanlar.map((x) => (x.id === mevcut.id ? { ...x, klipler: [...x.klipler, ...metinKlipler] } : x))
                  : [{ id: yid("kat"), tur: "metin" as KatmanTur, ad: "Metin 1", klipler: metinKlipler, sessiz: false, kilitli: false, gizli: false }, ...p.katmanlar];
                return { ...p, katmanlar, altyazi: true, guncelleme: Date.now() };
              }),
            }));
            return `${metinKlipler.length} altyazı yeri eklendi; metinleri sen yaz`;
          }

          return "Komut uygulanamadı";
        },
      };
    },
    {
      name: "vayra-montaj",
      version: 2,
      // oturumluk alanlar persist edilmez
      partialize: (s) => ({ projeler: s.projeler, aktifId: s.aktifId, marka: s.marka }) as unknown as MontajState,
      migrate: () => ({ projeler: [], aktifId: null }) as unknown as MontajState, // v1 şeması uyumsuz
    },
  ),
);

export const MONTAJ_EFEKT_META: Record<MontajEfekt, { ad: string; grup: "renk" | "stil" | "hareket"; css: string }> = {
  "grade-sinematik": { ad: "Sinematik", grup: "renk", css: "contrast(1.15) saturate(1.1) brightness(0.95)" },
  "grade-sicak": { ad: "Sıcak", grup: "renk", css: "sepia(0.28) saturate(1.25) hue-rotate(-8deg)" },
  "grade-soguk": { ad: "Soğuk", grup: "renk", css: "saturate(1.1) hue-rotate(12deg) brightness(1.02)" },
  "grade-siyahbeyaz": { ad: "Siyah-beyaz", grup: "renk", css: "grayscale(1) contrast(1.15)" },
  "grade-vintage": { ad: "Vintage", grup: "renk", css: "sepia(0.45) contrast(0.92) saturate(0.85)" },
  "vinyet": { ad: "Vinyet", grup: "stil", css: "brightness(0.94)" },
  "grenli": { ad: "Grenli", grup: "stil", css: "contrast(1.08) saturate(0.95)" },
  "bulanik": { ad: "Yumuşak", grup: "stil", css: "blur(1.2px)" },
  "keskinlik": { ad: "Keskin", grup: "stil", css: "contrast(1.25) saturate(1.05)" },
  "yakinlas": { ad: "Yakınlaş", grup: "hareket", css: "" },
  "sarsinti": { ad: "Sarsıntı", grup: "hareket", css: "" },
};

export const MONTAJ_GECIS_META: Record<MontajGecis, { ad: string }> = {
  "yok": { ad: "Yok" },
  "kesme": { ad: "Sert kesme" },
  "fade": { ad: "Fade" },
  "kaydir": { ad: "Kaydır" },
  "yakinlas": { ad: "Yakınlaş" },
  "bulanik": { ad: "Bulanık" },
  "beyazparla": { ad: "Beyaz parla" },
};

/**
 * AI komutunun UYGULANMADAN etki tahmini — onay şeridinde gösterilir.
 * Kaç klip etkilenecek, süre nasıl değişecek, hangi alanlara dokunacak.
 */
export function aiOnizle(p: MontajProje, komut: AiKomutId): { etkilenen: number; sonrakiSure: number; notlar: string[] } {
  const videoKlipler = p.katmanlar.filter((k) => k.tur === "video").flatMap((k) => k.klipler);
  const n = videoKlipler.length;
  const suSure = montajToplamSure(p);
  const notlar: string[] = [];
  let sonraki = suSure;
  switch (komut) {
    case "kurgu":
      sonraki = 4 + Math.max(0, n - 1) * 2.6;
      notlar.push("Kısa, dinamik kesimlere sıkıştırır", "Sinematik renk uygular", "Geçiş ekler");
      break;
    case "reel":
      sonraki = Math.min(30, n * Math.max(1.2, Math.min(3, 30 / Math.max(1, n))));
      notlar.push("Dikey 9:16 formata çevirir", "En iyi anlardan 30 saniyelik kurgu çıkarır", "Altyazı açar");
      break;
    case "grade": notlar.push("Yalnız renk: sinematik ton ve vinyet", "Kesimlere dokunmaz"); break;
    case "tempo": notlar.push("Kliplerin hızı sırayla 1,5 kat ve 0,6 kat olur", "Ritmik his verir"); break;
    case "gecis": notlar.push("Her kesime sırayla fade, kaydır ve bulanık geçiş", "Süre değişmez"); break;
    case "sessizlik": {
      const kalan = videoKlipler.filter((k) => klipSure(k) >= 1);
      sonraki = kalan.reduce((a, k) => a + klipSure(k), 0);
      notlar.push(`${n - kalan.length} kısa klip atılır`, "Boşluklar kapatılır");
      break;
    }
    case "altyazi": notlar.push(`${n} altyazı klibi üretir`, "Metin katmanı oluşturur", "Süre değişmez"); break;
  }
  return { etkilenen: komut === "altyazi" ? n : n, sonrakiSure: sonraki, notlar };
}

export const AI_KOMUT_META: Record<AiKomutId, { ad: string; ozet: string }> = {
  kurgu: { ad: "Otomatik kurgula", ozet: "Kısa kesimler, sinematik renk ve geçişler" },
  reel: { ad: "30 saniyelik reel yap", ozet: "Her klibin başından kısa dilim, dikey, altyazı açık" },
  grade: { ad: "Sinematik renk", ozet: "Yalnız renk, kesimlere dokunmaz" },
  tempo: { ad: "Ritmik tempo", ozet: "Hızlı kesimler arasında ağır çekim vurgu" },
  gecis: { ad: "Geçiş ekle", ozet: "Her kesime yumuşak geçiş" },
  sessizlik: { ad: "Boşlukları kapat", ozet: "Bir saniyeden kısa klipleri çıkar, çizelgeyi sıkıştır" },
  altyazi: { ad: "Altyazı yerleri ekle", ozet: "Her klibin altına yazılacak boş altyazı klibi; konuşmadan altyazı Akıllı panelde" },
};

/** CSS filter zinciri — önizlemede klip görünümünü GERÇEKTEN değiştirir. */
export function efektCss(k: MontajKlip): string {
  const f = k.efektler.map((e) => MONTAJ_EFEKT_META[e]?.css).filter(Boolean).join(" ");
  return f || "none";
}

/**
 * Renk düzeltme → CSS filter. -100..100 aralığını duyarlı çarpanlara çevirir.
 * efektCss'in üstüne biner (grade preset + manuel düzeltme birlikte çalışır).
 */
export function renkGradeCss(r?: RenkAyar): string {
  if (!r) return "";
  const parcalar: string[] = [];
  const b = 1 + (r.pozlama / 100) * 0.6 + (r.parlaklik / 100) * 0.3;
  if (Math.abs(b - 1) > 0.001) parcalar.push(`brightness(${b.toFixed(3)})`);
  const c = 1 + (r.kontrast / 100) * 0.6;
  if (Math.abs(c - 1) > 0.001) parcalar.push(`contrast(${c.toFixed(3)})`);
  const s = 1 + (r.doygunluk / 100) * 0.9;
  if (Math.abs(s - 1) > 0.001) parcalar.push(`saturate(${Math.max(0, s).toFixed(3)})`);
  // sıcaklık: pozitif → sepia + negatif hue (sıcak); negatif → hue kaydırma (soğuk mavi)
  if (r.sicaklik > 0) parcalar.push(`sepia(${(r.sicaklik / 100 * 0.4).toFixed(3)}) hue-rotate(${(-r.sicaklik / 100 * 12).toFixed(1)}deg)`);
  else if (r.sicaklik < 0) parcalar.push(`hue-rotate(${(-r.sicaklik / 100 * 18).toFixed(1)}deg) saturate(1.05)`);
  if (Math.abs(r.tonlama) > 0.5) parcalar.push(`hue-rotate(${(r.tonlama / 100 * 40).toFixed(1)}deg)`);
  return parcalar.join(" ");
}

/** Klip + renk düzeltmesini tek filter dizesi olarak birleştir. */
export function tamFilter(k: MontajKlip): string {
  const parcalar = [efektCss(k) === "none" ? "" : efektCss(k), renkGradeCss(k.renk)].filter(Boolean);
  return parcalar.length ? parcalar.join(" ") : "none";
}

/** Bir özelliğin klip üzerindeki taban (keyframe'siz) değeri. */
function kfTaban(k: MontajKlip, ozellik: KfOzellik): number {
  switch (ozellik) {
    case "opaklik": return k.opaklik ?? 100;
    case "olcek": return k.olcek ?? 100;
    case "x": return k.konumX ?? 0;
    case "y": return k.konumY ?? 0;
    case "donme": return k.donme ?? 0;
  }
}

/** Klip-içi `t` anında bir özelliğin ANLIK değeri (keyframe interpolasyonu). */
export function kfAnlikDeger(k: MontajKlip, ozellik: KfOzellik, t: number): number {
  const kfs = k.keyframeler?.[ozellik];
  if (!kfs || kfs.length === 0) return kfTaban(k, ozellik);
  if (t <= kfs[0].t) return kfs[0].deger;
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].deger;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const oran = (t - a.t) / Math.max(0.001, b.t - a.t);
      // ease-in-out (yumuşak) — pro editör hissi
      const e = oran < 0.5 ? 2 * oran * oran : 1 - Math.pow(-2 * oran + 2, 2) / 2;
      return a.deger + (b.deger - a.deger) * e;
    }
  }
  return kfTaban(k, ozellik);
}

/** Bir klibin `t` anındaki tüm dönüşüm değerleri (keyframe dahil) — önizleme için. */
export function klipDonusum(k: MontajKlip, yerelT: number): { opaklik: number; olcek: number; x: number; y: number; donme: number } {
  return {
    opaklik: kfAnlikDeger(k, "opaklik", yerelT),
    olcek: kfAnlikDeger(k, "olcek", yerelT),
    x: kfAnlikDeger(k, "x", yerelT),
    y: kfAnlikDeger(k, "y", yerelT),
    donme: kfAnlikDeger(k, "donme", yerelT),
  };
}

/**
 * Speed-ramp: klip hız→hizSonu arası doğrusal değişiyorsa, `yerelT` (görünen sn)
 * anındaki anlık hızı döndür. Yoksa sabit hız.
 */
export function anlikHiz(k: MontajKlip, yerelT: number): number {
  if (k.hizSonu === undefined || Math.abs(k.hizSonu - k.hiz) < 0.01) return k.hiz;
  const gorunen = klipSure(k);
  const oran = gorunen > 0 ? Math.max(0, Math.min(1, yerelT / gorunen)) : 0;
  return k.hiz + (k.hizSonu - k.hiz) * oran;
}

/** Ses fade zarfı: klip-içi `t` anında çarpan (0..1) — giriş/çıkış fade. */
export function sesZarf(k: MontajKlip, yerelT: number): number {
  const gorunen = klipSure(k);
  let g = 1;
  if (k.sesGiris && k.sesGiris > 0 && yerelT < k.sesGiris) g = Math.min(g, yerelT / k.sesGiris);
  if (k.sesCikis && k.sesCikis > 0 && yerelT > gorunen - k.sesCikis) g = Math.min(g, (gorunen - yerelT) / k.sesCikis);
  return Math.max(0, Math.min(1, g));
}
