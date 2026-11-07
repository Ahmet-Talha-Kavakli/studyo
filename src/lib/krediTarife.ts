/**
 * Kredi tarifesi: kredi harcayan her sunucu rotasının bedeli burada hesaplanır.
 *
 * Saf ve izomorfik: rotalar (sunucu) bedeli buradan keser; istemci aynı fonksiyonla bedeli gösterebilir.
 * Kural: sunucu kendi hesapladığı tabanı keser. İstemci daha yüksek bir bedel bildirirse (araç ek ücreti gibi,
 * kullanıcının onayladığı tutar) o kesilir; tabanın altına hiçbir zaman inilmez. Böylece istemci bedeli
 * düşüremez, yalnız arayüzde gösterdiği tutarla aynı kalınır.
 */
import { MODELLER } from "@/lib/catalog";
import { SINIRSIZ_TEKLIFLER } from "@/lib/fiyat";
import { GORSEL_MODELLER, cozunurlukCarpani } from "@/lib/gorselModelVeri";
import { modelBul as muzikModelBul, muzikKredi, planSuresi, stemKredi, type MuzikPlan } from "@/lib/muzikVeri";
import { ciktiBoyutu, upscaleKredi, upscaleModel, type UpscaleModelId } from "@/lib/upscaleVeri";
import { videoKredi } from "@/components/studyo/video/veri";
import { ARAC_KREDI_3D, MODELLER_3D } from "@/components/studyo/ucboyut/veri";

/** Sabit bedelli işler. */
export const SABIT_KREDI = {
  /** Anlık ses klonu (ElevenLabs IVC). */
  sesKlon: 40,
  /** Metinden ses tasarımı ya da var olan sesi yeniden yorumlama: üç önizleme. */
  sesTasarim: 5,
  /** Karakter derin eğitimi (FLUX LoRA). */
  loraEgitim: 40,
} as const;

/** Ücretli her seslendirme ya da diyalog, aynı metin ve sesle bu kadar kez ücretsiz yeniden üretilebilir. */
export const SES_UCRETSIZ_HAK = 2;

/** İstemcinin bildirebileceği en yüksek bedel: tabanın altı katı ya da tabandan 60 fazlası (hangisi büyükse). */
const tavan = (taban: number) => Math.max(taban * 6, taban + 60);

/**
 * Kesilecek tutar: sunucu tabanı esas; istemci daha yüksek bildirirse (tavana kadar) o.
 * Tam sayıya yukarı yuvarlanır. Taban 0 ise iş ücretsizdir ve istemci ne derse desin kesilmez.
 */
export function kesilecekTutar(taban: number, istemci?: unknown): number {
  const t = Math.max(0, Math.ceil(Number.isFinite(taban) ? taban : 0));
  if (t === 0) return 0;
  const i = typeof istemci === "number" && Number.isFinite(istemci) && istemci > 0 ? Math.ceil(istemci) : 0;
  return Math.max(t, Math.min(i, tavan(t)));
}

const sayi = (x: unknown): number | undefined => {
  const n = typeof x === "number" ? x : typeof x === "string" ? parseFloat(x) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

type Meta = Record<string, unknown> | undefined;

/* ── /api/uretim ── */

/** Video: katalog bedeli süre, kalite ve sese göre ölçeklenir (video stüdyosuyla aynı hesap). */
export function videoTutari(model: string, meta: Meta): number {
  return videoKredi(model, { sure: sayi(meta?.sure), coz: typeof meta?.cozunurluk === "string" ? meta.cozunurluk : undefined, ses: !!meta?.ses });
}

/** Görsel: görsel başına model bedeli; çözünürlük seçilebilen modellerde 3K ve 4K çarpanı. */
export function gorselTutari(model: string, meta: Meta): number {
  const g = GORSEL_MODELLER.find((x) => x.ad === model);
  const taban = g?.kredi ?? MODELLER.find((x) => x.ad === model || x.id === model)?.kredi ?? 1;
  const carpan = g?.cozunurluk && typeof meta?.cozunurluk === "string" ? cozunurlukCarpani(meta.cozunurluk) : 1;
  return Math.max(1, Math.ceil(taban * carpan));
}

/** Ses: seslendirme ve diyalog 1.000 karakter başına 1; efekt 2 (süre seçilirse 10 sn başına 1); kaynaklı işler dakika başına. */
export function sesTutari(prompt: string, meta: Meta): number {
  const mod = typeof meta?.mod === "string" ? meta.mod : "seslendirme";
  if (mod === "efekt") { const sn = sayi(meta?.efektSn); return sn ? Math.max(1, Math.ceil(sn / 10)) : 2; }
  if (mod === "ceviri") return 12;
  if (mod === "sesdegistir" || mod === "temizle" || mod === "transkript") return 1;
  if (mod === "diyalog" && Array.isArray(meta?.diyalog)) {
    const n = (meta.diyalog as { metin?: unknown }[]).reduce((t, x) => t + (typeof x?.metin === "string" ? x.metin.length : 0), 0);
    return Math.max(1, Math.ceil((n || prompt.length) / 1000));
  }
  return Math.max(1, Math.ceil(prompt.length / 1000));
}

/** 3D: araç işlemi (meta.mod: doku, remesh, rig, baski) kendi bedeliyle; stüdyo modelinin taslak bedeli; katalogdaki 3D modeli; bilinmiyorsa 5. */
export function ucBoyutTutari(model: string, meta?: Meta): number {
  const mod = String(meta?.mod ?? "");
  if (mod in ARAC_KREDI_3D) return ARAC_KREDI_3D[mod as keyof typeof ARAC_KREDI_3D];
  const s = MODELLER_3D.find((m) => m.ad === model);
  if (s) return Math.min(s.taslak, s.detay);
  const k = MODELLER.find((x) => (x.ad === model || x.id === model) && x.tur === "3d");
  return k?.kredi ?? 5;
}

/** /api/uretim isteğinin taban bedeli. */
export function uretimTutari(g: { tur: string; model?: string; prompt: string; meta?: Meta }): number {
  const model = g.model ?? "";
  switch (g.tur) {
    case "video": return videoTutari(model, g.meta);
    case "gorsel": return gorselTutari(model, g.meta);
    case "ses": return sesTutari(g.prompt, g.meta);
    case "3d": return ucBoyutTutari(model, g.meta);
    case "muzik": return muzikKredi(muzikModelBul(model).ad, sayi(g.meta?.sure) ?? null);
    default: return 1;
  }
}

/* ── Süreli sınırsız erişim ──
   Hak sunucudaki ödeme kaydındadır (lib/odeme); burada yalnız bir işin hangi hakla kapsandığı hesaplanır. */

/** Stüdyo model adı → sınırsız erişim teklifinin kimliği (fiyat.SINIRSIZ_TEKLIFLER). Yoksa null. */
export function sinirsizModelKimligi(tur: string, model: string): string | null {
  const a = model.toLowerCase();
  if (tur === "video") {
    if (/^kling 3\.0( turbo| omni)?$/.test(a)) return "kling-3";
    if (/^seedance 2\.0( fast| mini)?$/.test(a)) return "seedance-2";
    if (/^minimax hailuo 2\.3( fast)?$/.test(a)) return "hailuo-23";
    return null;
  }
  if (tur === "gorsel") {
    if (/nano banana pro/.test(a)) return "nano-banana-pro";
    if (/gpt image 2/.test(a)) return "gpt-image-2";
    if (/seedream 5/.test(a)) return "seedream-5";
    if (/flux\.?2/.test(a)) return "flux-2";
  }
  return null;
}

const KALITE_SIRA = ["360p", "480p", "512p", "540p", "720p", "768p", "1080p", "1K", "2K", "3K", "4K"];
const kaliteSira = (k: string) => { const i = KALITE_SIRA.indexOf(k); return i < 0 ? KALITE_SIRA.length : i; };

/**
 * Bu iş etkin sınırsız haklardan biriyle kapsanıyor mu: aynı model, hakkın kalitesini aşmayan çözünürlük ve
 * (teklifte varsa) azami süreyi aşmayan video. Kapsıyorsa o hak döner; kredi kesilmez.
 */
export function sinirsizKapsar<H extends { model: string; kalite: string; bitis: number }>(haklar: H[], g: { tur: string; model?: string; meta?: Meta }, simdi = Date.now()): H | null {
  const kimlik = sinirsizModelKimligi(g.tur, g.model ?? "");
  if (!kimlik) return null;
  const hak = haklar.find((x) => x.model === kimlik && x.bitis > simdi);
  if (!hak) return null;
  const coz = typeof g.meta?.cozunurluk === "string" ? g.meta.cozunurluk : undefined;
  if (coz && kaliteSira(coz) > kaliteSira(hak.kalite)) return null;
  if (g.tur === "video") {
    const teklif = SINIRSIZ_TEKLIFLER.find((t) => t.model === kimlik);
    const maxSn = teklif?.maxSure ? parseInt(teklif.maxSure, 10) : undefined;
    const sn = sayi(g.meta?.sure);
    if (maxSn && sn && sn > maxSn) return null;
  }
  return hak;
}

/** Hız seviyesinin üretim akışındaki çarpanı (Standart 1, Öncelikli 2, Turbo 4). */
export const HIZ_CARPANI: Record<string, number> = { standart: 1, oncelikli: 2, turbo: 4 };

/* ── /api/muzik ── */

/** Şarkı: plan varsa planın süresi, yoksa seçilen süre (otomatikte 2 dk); sabit süreli modelde modelin süresi. */
export function muzikUretTutari(g: { model?: string; sureSn?: number | null; plan?: MuzikPlan }): number {
  const m = muzikModelBul(g.model ?? "");
  if (g.plan?.bolumler?.length) return muzikKredi(m.ad, Math.round(planSuresi(g.plan) / 1000));
  return muzikKredi(m.ad, sayi(g.sureSn) ?? (m.sure.tur === "sabit" ? m.sure.sn : null));
}
/** Stem ayırma: başlayan her dakika 3 kredi. Süre sunucuda bilinmiyorsa en az bir dakika. */
export const stemTutari = (sn?: number | null) => stemKredi(sayi(sn) ?? 1);
/** Videodan müzik: toplam video süresi (en az 3 sn) kadar şarkı. */
export const videodanMuzikTutari = (model: string, sn?: number | null) => muzikKredi(muzikModelBul(model).ad, Math.max(3, Math.round(sayi(sn) ?? 3)));

/* ── /api/upscale ── */

/** Büyütme: çıktı megapikseline (görsel) ya da süreye (video) göre. Boyut bilinmiyorsa 1 MP kaynak varsayılır. */
export function upscaleTutari(model: string, g: { w?: number; h?: number; sureSn?: number; olcek?: number }): number {
  const m = upscaleModel(model);
  if (!m) return 0;
  const olcek = sayi(g.olcek) ?? 2;
  const w = sayi(g.w) ?? 1000, h = sayi(g.h) ?? 1000;
  return upscaleKredi(m.id as UpscaleModelId, ciktiBoyutu(w, h, olcek).mp, sayi(g.sureSn) ?? 1, olcek);
}
