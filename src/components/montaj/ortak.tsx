"use client";

import { Film, Music2, Type as TypeIcon, Image as ImageIcon, type LucideIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import { useMontaj, klipSure, type MontajProje, type MedyaOge, type KatmanTur, type MontajKlip } from "@/store/useMontaj";
import { medyaSuresi, videoKapak, dalgaFormu } from "@/lib/montajMotor";

/** 0:12.05 (dk:sn.kare) zaman kodu. */
export function zamanKodu(t: number, fps = 30): string {
  const s = Math.max(0, t);
  const dk = Math.floor(s / 60), sn = Math.floor(s % 60), kare = Math.floor((s - Math.floor(s)) * fps);
  return `${dk}:${String(sn).padStart(2, "0")}.${String(kare).padStart(2, "0")}`;
}
/** 0:12 kısa süre. */
export function kisaSure(t: number): string {
  const s = Math.max(0, Math.round(t * 10) / 10);
  if (s < 60) return `${s.toFixed(s < 10 && s % 1 ? 1 : 0)} sn`;
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

/** Katman türü görünümü. */
export const KATMAN: Record<KatmanTur, { ikon: LucideIcon; ad: string; renk: string; klip: string; yukseklik: number }> = {
  video: { ikon: Film, ad: "Video", renk: "text-sky-300", klip: "bg-[#1b2328]", yukseklik: 60 },
  ses: { ikon: Music2, ad: "Ses", renk: "text-emerald-300", klip: "bg-[#14251f]", yukseklik: 48 },
  metin: { ikon: TypeIcon, ad: "Yazı", renk: "text-amber-300", klip: "bg-[#3a2e14]", yukseklik: 34 },
};
export const MEDYA_IKON: Record<MedyaOge["tur"], LucideIcon> = { video: Film, gorsel: ImageIcon, ses: Music2 };

/** Dosyayı sunucuya yükler → kalıcı adres. */
export async function dosyaYukle(d: Blob, tip = d.type): Promise<string> {
  const r = await fetch("/api/montaj/yukle", { method: "POST", headers: { "Content-Type": tip }, body: d });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; hata?: string };
  if (!r.ok || !j.url) throw new Error(j.hata ?? "Yüklenemedi");
  return j.url;
}

/** Bilgisayardan seçilen dosyaları projenin medya kutusuna ekler. */
export async function dosyalariIceAl(projeId: string, dosyalar: File[]): Promise<MedyaOge[]> {
  const eklenen: MedyaOge[] = [];
  for (const d of dosyalar) {
    const tur: MedyaOge["tur"] | null = d.type.startsWith("video/") ? "video" : d.type.startsWith("audio/") ? "ses" : d.type.startsWith("image/") ? "gorsel" : null;
    if (!tur) { toast.error("Bu dosya türü desteklenmiyor", { description: `${d.name} eklenemedi. Video, görsel ya da ses dosyası seç.` }); continue; }
    const kimlik = toast.loading(`${d.name} yükleniyor…`);
    try {
      const yerel = URL.createObjectURL(d);
      const [url, sure, kapak] = await Promise.all([
        dosyaYukle(d),
        tur === "gorsel" ? Promise.resolve(null) : medyaSuresi(yerel, tur),
        tur === "video" ? videoKapak(yerel) : Promise.resolve(null),
      ]);
      let poster: string | undefined;
      if (kapak) {
        const b = await (await fetch(kapak)).blob();
        poster = await dosyaYukle(b, "image/jpeg").catch(() => undefined);
      }
      URL.revokeObjectURL(yerel);
      const oge: MedyaOge = { id: `md_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, ad: d.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60), tur, url, poster: tur === "gorsel" ? url : poster, ...(sure ? { sure } : {}) };
      eklenen.push(oge);
      toast.success(`${oge.ad} eklendi`, { id: kimlik });
    } catch (e) {
      toast.error(`${d.name} yüklenemedi`, { id: kimlik, description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    }
  }
  if (eklenen.length) {
    const st = useMontaj.getState();
    const p = st.projeler.find((x) => x.id === projeId);
    if (p) st.projeGuncelle(projeId, { medya: [...eklenen, ...(p.medya ?? [])] });
  }
  return eklenen;
}

/** Uygun türde bir katman bulur; yoksa oluşturur. */
/**
 * Verilen türde kilitsiz bir katman bulur (yoksa açar). `aralik` verilirse o aralıkta boş olan katmanı seçer;
 * hepsi doluysa yeni katman açar — üst üste binen yazı/öğe/ses klipleri birbirini gizlemesin.
 */
export function katmanBul(projeId: string, tur: KatmanTur, aralik?: [number, number]): string | null {
  const uygun = () => useMontaj.getState().projeler.find((x) => x.id === projeId)?.katmanlar.filter((k) => k.tur === tur && !k.kilitli) ?? [];
  const bos = (kat: { klipler: MontajKlip[] }) => !aralik || !kat.klipler.some((k) => k.baslangic < aralik[1] - 0.01 && k.baslangic + klipSure(k) > aralik[0] + 0.01);
  let kat = uygun().find(bos);
  if (!kat) {
    const once = new Set(uygun().map((k) => k.id));
    useMontaj.getState().katmanEkle(projeId, tur);
    kat = uygun().find((k) => !once.has(k.id));
  }
  return kat?.id ?? null;
}

/** Medya öğesini zaman çizelgesine ekler (verilen anda ya da katmanın sonuna). */
export function medyayiEkle(projeId: string, oge: MedyaOge, konum?: number, katmanId?: string): string | null {
  const tur: KatmanTur = oge.tur === "ses" ? "ses" : "video";
  const sure = oge.tur === "gorsel" ? 4 : Math.max(0.5, oge.sure ?? (oge.tur === "ses" ? 15 : 5));
  // Belirli bir ana eklenirken doluysa üstte yeni katman açılır (mevcut klibin üstüne binmesin)
  const kat = katmanId ?? katmanBul(projeId, tur, konum !== undefined ? [konum, konum + sure] : undefined);
  if (!kat) return null;
  const id = useMontaj.getState().klipEkle(projeId, kat, {
    ad: oge.ad, tur: oge.tur, kaynakId: oge.kaynakId,
    sure: oge.tur === "gorsel" ? 4 : Math.max(0.5, oge.sure ?? (oge.tur === "ses" ? 15 : 5)),
    gorselUrl: oge.poster ?? (oge.tur === "gorsel" ? oge.url : undefined),
    ...(oge.tur === "video" ? { videoUrl: oge.url, sesUrl: oge.url } : {}),
    ...(oge.tur === "ses" ? { sesUrl: oge.url } : {}),
    ...(konum !== undefined ? { baslangic: Math.max(0, konum) } : {}),
  });
  return id;
}

/** Bir projede tüm klipler. */
export const tumKlipler = (p: MontajProje): MontajKlip[] => p.katmanlar.flatMap((k) => k.klipler);
export const klipBitis = (k: MontajKlip) => k.baslangic + klipSure(k);

/** Sürükle-bırak taşıma türü. */
export const MEDYA_SURUKLE = "application/x-vayra-medya";

/**
 * Dönüşüm yaz: özelliğin anahtar kareleri varsa ve playhead klibin içindeyse o andaki anahtar kareyi
 * günceller (yoksa ekler); aksi halde temel değeri değiştirir. Tuval ve denetleyici aynı kuralı kullanır.
 */
export function donusumYaz(projeId: string, k: MontajKlip, degerler: Partial<Record<"x" | "y" | "olcek" | "donme" | "opaklik", number>>) {
  const st = useMontaj.getState();
  const yerel = st.playhead - k.baslangic;
  const icinde = yerel >= 0 && yerel <= klipSure(k);
  const TABAN = { x: "konumX", y: "konumY", olcek: "olcek", donme: "donme", opaklik: "opaklik" } as const;
  const patch: Partial<MontajKlip> = {};
  let kfs = { ...(k.keyframeler ?? {}) };
  for (const [oz, v] of Object.entries(degerler) as [keyof typeof TABAN, number][]) {
    const mevcut = kfs[oz];
    if (mevcut?.length && icinde) kfs = { ...kfs, [oz]: [...mevcut.filter((f) => Math.abs(f.t - yerel) > 0.02), { t: yerel, deger: v }].sort((a, b) => a.t - b.t) };
    else (patch as Record<string, number>)[TABAN[oz]] = v;
  }
  st.klipGuncelle(projeId, k.id, { ...patch, keyframeler: kfs });
}

/** Videonun sesini ses katmanına ayrı klip olarak çıkarır (zamanlama, kırpma ve hız korunur); videonun sesi kapanır. */
export function sesiAyir(projeId: string, klipId: string) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p) return;
  const k = tumKlipler(p).find((x) => x.id === klipId);
  const url = k?.videoUrl ?? k?.sesUrl;
  if (!k || !url) return void toast.error("Ayrılacak ses yok", { description: "Bu klipte ses izi bulunmuyor. Sesli bir video klip seç." });
  st.anlikKaydet(projeId);
  const kat = katmanBul(projeId, "ses", [k.baslangic, k.baslangic + klipSure(k)]); if (!kat) return;
  const id = useMontaj.getState().klipEkle(projeId, kat, { ad: `${k.ad} · ses`, tur: "ses", sesUrl: url, sure: k.sure, baslangic: k.baslangic, basKirp: k.basKirp, sonKirp: k.sonKirp, hiz: k.hiz, sesDuzey: k.sesDuzey || 100 });
  useMontaj.getState().klipGuncelle(projeId, k.id, { sesDuzey: 0 });
  useMontaj.getState().klipSec(id);
  toast.success("Ses ayrıldı", { description: "Ses katmanında ayrı klip olarak düzenleyebilirsin." });
}

/** Playhead'deki kareyi 2 sn'lik görsel olarak araya ekler (sonrası kayar). */
export async function kareDondur(projeId: string, klipId: string, kare: string, sure = 2) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p) return;
  const kat = p.katmanlar.find((x) => x.klipler.some((c) => c.id === klipId)); if (!kat) return;
  const t = st.playhead;
  let url = kare;
  try { url = await dosyaYukle(await (await fetch(kare)).blob(), "image/jpeg"); } catch { /* yerel kalsın */ }
  st.anlikKaydet(projeId);
  st.klipBol(projeId, klipId, t);
  const p2 = useMontaj.getState().projeler.find((x) => x.id === projeId)!;
  const kat2 = p2.katmanlar.find((x) => x.id === kat.id)!;
  for (const c of kat2.klipler) if (c.baslangic >= t - 0.01) useMontaj.getState().klipGuncelle(projeId, c.id, { baslangic: c.baslangic + sure });
  const id = useMontaj.getState().klipEkle(projeId, kat.id, { ad: "Dondurulmuş kare", tur: "gorsel", gorselUrl: url, sure, baslangic: t });
  useMontaj.getState().klipSec(id);
  toast.success("Kare donduruldu", { description: `${sure} sn eklendi. Ctrl+Z ile geri alabilirsin.` });
}

/** Klibi siler; aynı katmanda sonrasındaki klipleri boşluğu kapatacak kadar sola kaydırır (ripple delete). */
export function rippleSil(projeId: string, klipId: string) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p) return;
  const kat = p.katmanlar.find((k) => k.klipler.some((x) => x.id === klipId)); if (!kat) return;
  const k = kat.klipler.find((x) => x.id === klipId)!;
  const d = klipSure(k), bitis = k.baslangic + d;
  st.klipSil(projeId, klipId);
  for (const c of kat.klipler) if (c.id !== klipId && c.baslangic >= bitis - 0.01) useMontaj.getState().klipGuncelle(projeId, c.id, { baslangic: Math.max(0, c.baslangic - d) });
}

/** Aynı katmanda `sonra` anından sonra başlayan klipleri `fark` kadar kaydırır (ripple kırpma). */
export function sonrakileriKaydir(projeId: string, katmanId: string, haricId: string, sonra: number, fark: number) {
  if (Math.abs(fark) < 0.001) return;
  const p = useMontaj.getState().projeler.find((x) => x.id === projeId);
  const kat = p?.katmanlar.find((k) => k.id === katmanId); if (!kat) return;
  for (const c of kat.klipler) if (c.id !== haricId && c.baslangic >= sonra - 0.01) useMontaj.getState().klipGuncelle(projeId, c.id, { baslangic: Math.max(0, c.baslangic + fark) });
}

/** Klibi aynı türdeki bir üst (-1) ya da alt (+1) katmana taşır; yoksa yeni katman açar. */
export function katmanaTasi(projeId: string, klipId: string, yon: -1 | 1) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p) return;
  const i = p.katmanlar.findIndex((k) => k.klipler.some((x) => x.id === klipId)); if (i < 0) return;
  const kat = p.katmanlar[i];
  const k = kat.klipler.find((x) => x.id === klipId)!;
  const ayni = p.katmanlar.map((x, j) => ({ x, j })).filter((o) => o.x.tur === kat.tur && !o.x.kilitli);
  const sira = ayni.findIndex((o) => o.j === i);
  let hedef = ayni[sira + yon]?.x.id;
  st.anlikKaydet(projeId);
  if (!hedef) {
    // Yeni video/yazı katmanı en üste, ses katmanı en alta açılır
    if ((yon === 1) !== (kat.tur === "ses")) return void toast.info(yon === 1 ? "Klip zaten en alt katmanda" : "Klip zaten en üst katmanda", { description: "Daha fazla taşınamaz." });
    const once = new Set(p.katmanlar.map((x) => x.id));
    st.katmanEkle(projeId, kat.tur);
    const yeni = useMontaj.getState().projeler.find((x) => x.id === projeId)!.katmanlar.find((x) => !once.has(x.id))?.id;
    if (!yeni) return;
    hedef = yeni;
  }
  useMontaj.getState().klipTasi(projeId, klipId, k.baslangic, hedef);
  toast.success(yon === -1 ? "Klip üst katmana taşındı" : "Klip alt katmana taşındı");
}

/**
 * Ritim (vuruş) tespiti: ses dalgasının enerji sıçramalarını bulur. Kaynak saniyesi cinsinden döner.
 * Yerel ortalamanın belirgin üstündeki tepe noktaları alınır; vuruşlar arası en az 0,22 sn.
 */
export async function ritimBul(url: string): Promise<number[]> {
  const d = await dalgaFormu(url, 100);
  if (!d) return [];
  const e = d.tepeler, n = e.length, adim = d.sure / n;
  const sonuc: number[] = [];
  let son = -1;
  for (let i = 2; i < n - 2; i++) {
    let top = 0, say = 0;
    for (let j = Math.max(0, i - 12); j < Math.min(n, i + 12); j++) { top += e[j]; say++; }
    const ort = top / say;
    const tepe = e[i] >= e[i - 1] && e[i] >= e[i + 1] && e[i] > e[i - 2];
    const t = i * adim;
    if (tepe && e[i] > 0.28 && e[i] > ort * 1.32 && (son < 0 || t - son >= 0.22)) { sonuc.push(Math.round(t * 1000) / 1000); son = t; }
  }
  return sonuc;
}

/** Ses klibindeki vuruşları zaman çizelgesine işaretçi olarak koyar (yapışma noktası olur). */
export async function ritimIsaretle(projeId: string, klipId: string): Promise<number> {
  const p = useMontaj.getState().projeler.find((x) => x.id === projeId);
  const k = p && tumKlipler(p).find((x) => x.id === klipId);
  const url = k?.sesUrl ?? k?.videoUrl;
  if (!p || !k || !url) return 0;
  const kaynak = await ritimBul(url);
  const hiz = Math.max(0.25, k.hiz), son = k.sure - k.sonKirp;
  const zaman = kaynak.filter((t) => t >= k.basKirp && t <= son).map((t) => Math.round((k.baslangic + (t - k.basKirp) / hiz) * 1000) / 1000);
  const diger = (p.isaretler ?? []).filter((m) => m.ad !== "Ritim" || m.t < k.baslangic || m.t > k.baslangic + klipSure(k));
  useMontaj.getState().projeGuncelle(projeId, { isaretler: [...diger, ...zaman.map((t) => ({ t, ad: "Ritim" }))].sort((a, b) => a.t - b.t) });
  return zaman.length;
}

/**
 * Ritme göre kurgu: video katmanındaki kliplerin kesimlerini sırayla en yakın vuruşa hizalar
 * (kaynak yetmiyorsa klip olduğu gibi kalır). Ripple: klipler arka arkaya dizilir.
 */
export function ritmeHizala(projeId: string, vuruslar: number[]): number {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p || vuruslar.length < 2) return 0;
  const kat = p.katmanlar.find((k) => k.tur === "video" && k.klipler.length && !k.kilitli); if (!kat) return 0;
  st.anlikKaydet(projeId);
  const sirali = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic);
  let t = sirali[0].baslangic, degisen = 0;
  for (const k of sirali) {
    const hedefSon = t + klipSure(k);
    const yakin = vuruslar.filter((v) => v > t + 0.4).reduce((a, v) => (Math.abs(v - hedefSon) < Math.abs(a - hedefSon) ? v : a), Infinity);
    const hiz = Math.max(0.25, k.hiz);
    let gorunen = klipSure(k);
    if (Number.isFinite(yakin) && Math.abs(yakin - hedefSon) < 1.5) {
      const ist = yakin - t;
      const esnek = k.tur === "gorsel";
      const kaynakGerek = ist * hiz;
      if (esnek) { st.klipGuncelle(projeId, k.id, { baslangic: t, sure: k.basKirp + kaynakGerek, sonKirp: 0 }); gorunen = ist; degisen++; }
      else if (k.basKirp + kaynakGerek <= k.sure) { st.klipGuncelle(projeId, k.id, { baslangic: t, sonKirp: Math.max(0, k.sure - k.basKirp - kaynakGerek) }); gorunen = ist; degisen++; }
      else st.klipGuncelle(projeId, k.id, { baslangic: t });
    } else st.klipGuncelle(projeId, k.id, { baslangic: t });
    t += gorunen;
  }
  return degisen;
}

/** Projenin o anki halini adlandırılmış sürüm olarak saklar (en çok 12). */
export function surumKaydet(projeId: string, ad?: string) {
  const p = useMontaj.getState().projeler.find((x) => x.id === projeId); if (!p) return;
  const l = p.surumler ?? [];
  const yeni = { id: `sr_${Date.now().toString(36)}`, ad: ad?.trim() || `Sürüm ${l.length + 1}`, tarih: Date.now(), katmanlar: JSON.parse(JSON.stringify(p.katmanlar)), sure: montajSure(p) };
  useMontaj.getState().projeGuncelle(projeId, { surumler: [yeni, ...l].slice(0, 12) });
  toast.success("Sürüm kaydedildi", { description: `${yeni.ad} olarak kaydedildi.` });
}
const montajSure = (p: MontajProje) => p.katmanlar.reduce((a, k) => Math.max(a, ...k.klipler.map((c) => c.baslangic + klipSure(c))), 0);

/** Sürüme döner (geri alınabilir). */
export function surumYukle(projeId: string, surumId: string) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); const s = p?.surumler?.find((x) => x.id === surumId);
  if (!p || !s) return;
  st.anlikKaydet(projeId);
  st.projeGuncelle(projeId, { katmanlar: JSON.parse(JSON.stringify(s.katmanlar)) });
  st.klipSec(null);
  toast.success(`"${s.ad}" yüklendi`, { description: "Ctrl+Z ile önceki hale dönebilirsin." });
}

/**
 * Metinle düzenleme (Descript tarzı): [bas, son) aralığını TÜM katmanlardan çıkarır ve sonrasını sola kaydırır.
 * Aralığa taşan klipler kırpılır, aralığı kapsayan klipler ikiye ayrılır.
 */
export function araligiKes(projeId: string, bas: number, son: number) {
  const st = useMontaj.getState();
  const p = st.projeler.find((x) => x.id === projeId); if (!p || son - bas < 0.05) return;
  const d = son - bas;
  st.anlikKaydet(projeId);
  for (const kat of p.katmanlar) {
    if (kat.kilitli) continue;
    for (const k of kat.klipler) {
      const s0 = k.baslangic, e0 = s0 + klipSure(k), hiz = Math.max(0.25, k.hiz);
      const g = (patch: Partial<MontajKlip>) => useMontaj.getState().klipGuncelle(projeId, k.id, patch);
      if (e0 <= bas + 0.001) continue;
      if (s0 >= son - 0.001) { g({ baslangic: Math.max(0, s0 - d) }); continue; }
      if (s0 >= bas && e0 <= son) { useMontaj.getState().klipSil(projeId, k.id); continue; }
      if (s0 < bas && e0 <= son) { g({ sonKirp: k.sonKirp + (e0 - bas) * hiz }); continue; }
      if (s0 >= bas && e0 > son) { g({ baslangic: bas, basKirp: k.basKirp + (son - s0) * hiz }); continue; }
      // Aralığı kapsıyor: yazılarda kısalt, medyada ikiye ayır
      if (k.tur === "metin") { g({ sonKirp: k.sonKirp + d * hiz }); continue; }
      const { id: _id, ...kopya } = k; void _id;
      g({ sonKirp: k.sonKirp + (e0 - bas) * hiz });
      useMontaj.getState().klipEkle(projeId, kat.id, { ...kopya, baslangic: bas, basKirp: k.basKirp + (son - s0) * hiz, sonKirp: k.sonKirp, gecis: "yok" });
    }
  }
}

/** Altyazı kliplerini SRT ya da WebVTT metnine çevirir. */
export function altyaziMetni(klipler: MontajKlip[], bicim: "srt" | "vtt"): string {
  const zk = (t: number) => {
    const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), x = ms % 1000;
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(h)}:${p(m)}:${p(s)}${bicim === "srt" ? "," : "."}${p(x, 3)}`;
  };
  const satirlar = [...klipler].sort((a, b) => a.baslangic - b.baslangic).map((k, i) => `${bicim === "srt" ? `${i + 1}\n` : ""}${zk(k.baslangic)} --> ${zk(k.baslangic + klipSure(k))}\n${(k.metin ?? "").trim()}\n`);
  return (bicim === "vtt" ? "WEBVTT\n\n" : "") + satirlar.join("\n");
}
