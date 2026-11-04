"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { saltUrl } from "@/lib/utils";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { medyaSuresi } from "@/lib/montajMotor";
import { besteWavUrl } from "@/lib/muzikMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { useProjeler } from "@/store/useProjeler";
import { useExplainer, exId, type ExProje, type ExSahne, type SahneTur } from "@/store/useExplainer";
import { stilBul, metindenSahneler, taslakSenaryo, toplamSure, telaffuzUygula, MUZIK_RUH } from "@/lib/explainerMotor";
import { dosyaYukle } from "@/components/montaj/ortak";

/** Sahne başına üretim kredileri (kullanıcıya önceden gösterilir). */
export const KREDI = { gorsel: 4, video: videoKrediHesap("Kling 3.0"), ses: (metin: string) => Math.max(1, Math.ceil(metin.length / 1000)) };
export const GORSEL_MODEL = "Nano Banana Pro";
export const VIDEO_MODEL = "Kling 3.0";
export const SES_MODEL = "Eleven Multilingual v2";

/* ═══════════ Senaryo ═══════════ */

let yazarDurum: Promise<boolean> | null = null;
/** Senaryo yazarı (Gemini) bağlı mı — bir kez sorulur. */
export function yazarHazir(): Promise<boolean> {
  yazarDurum ??= fetch("/api/explainer/senaryo").then((r) => r.json()).then((j: { hazir?: boolean }) => !!j.hazir).catch(() => false);
  return yazarDurum;
}

type AiSahne = { tur: string; baslik: string; anlatim: string; maddeler?: string[]; deger?: string; etiket?: string; gorsel: string };
const TURLER: SahneTur[] = ["baslik", "anlatim", "liste", "istatistik", "alinti", "cta"];

/**
 * Senaryoyu oluşturur: Gemini bağlıysa AI senaryo; değilse yapıştırılan metinden sahne (kelimeler aynen)
 * ya da konudan düzenlenebilir taslak. Kredi harcamaz. Dönen değer kaynağı belirtir.
 */
export async function senaryoOlustur(p: ExProje): Promise<{ sahneler: ExSahne[]; kaynak: "ai" | "taslak" | "metin" }> {
  const metin = p.kaynakMetin?.trim() ?? "";
  if (await yazarHazir()) {
    const r = await fetch("/api/explainer/senaryo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "yaz", konu: p.konu, kaynak: metin, ton: p.ayar.ton, kitle: p.ayar.kitle, dil: p.ayar.dil, hedefSn: p.ayar.hedefSn, stil: stilBul(p.ayar.stil).aciklama }) });
    const j = (await r.json()) as { ok: boolean; sahneler?: AiSahne[]; hata?: string };
    if (!j.ok || !j.sahneler?.length) throw new Error(j.hata ?? "Senaryo yazılamadı");
    return {
      kaynak: "ai",
      sahneler: j.sahneler.map((x) => ({ id: exId("sh"), tur: TURLER.includes(x.tur as SahneTur) ? (x.tur as SahneTur) : "anlatim", baslik: (x.baslik ?? "").trim(), anlatim: (x.anlatim ?? "").trim(), maddeler: x.maddeler?.slice(0, 4), deger: x.deger, etiket: x.etiket, gorselIstem: (x.gorsel ?? x.anlatim ?? "").trim() })),
    };
  }
  if (metin.split(/\s+/).length >= 25) return { kaynak: "metin", sahneler: metindenSahneler(p.konu, metin, p.ayar) };
  return { kaynak: "taslak", sahneler: taslakSenaryo(p.konu || metin, p.ayar) };
}

/** Tek sahnenin metnini AI ile dönüştürür. */
export async function sahneDonustur(p: ExProje, s: ExSahne, mod: "kisalt" | "sadelestir" | "enerjik" | "genislet" | "yeniden"): Promise<{ baslik: string; anlatim: string }> {
  const r = await fetch("/api/explainer/senaryo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "sahne", konu: p.konu, baslik: s.baslik, anlatim: s.anlatim, mod, dil: p.ayar.dil }) });
  const j = (await r.json()) as { ok: boolean; baslik?: string; anlatim?: string; hata?: string };
  if (!j.ok) throw new Error(j.hata ?? "Dönüştürülemedi");
  return { baslik: j.baslik ?? s.baslik, anlatim: j.anlatim ?? s.anlatim };
}

/** Senaryonun çevrilmiş kopyasını yeni proje olarak oluşturur (görseller korunur, sesler yeniden üretilmeli). */
export async function ceviriKopya(p: ExProje, hedef: "en" | "tr"): Promise<string> {
  const r = await fetch("/api/explainer/senaryo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "cevir", hedef: hedef === "en" ? "English" : "Turkish", sahneler: p.sahneler.map((s) => ({ baslik: s.baslik, anlatim: s.anlatim, maddeler: s.maddeler, etiket: s.etiket })) }) });
  const j = (await r.json()) as { ok: boolean; sahneler?: { baslik: string; anlatim: string; maddeler?: string[]; etiket?: string }[]; hata?: string };
  if (!j.ok || !j.sahneler) throw new Error(j.hata ?? "Çevrilemedi");
  const st = useExplainer.getState();
  const id = st.olustur({ ad: `${p.ad} · ${hedef.toUpperCase()}`, konu: p.konu, kaynakMetin: p.kaynakMetin, ayar: { ...p.ayar, dil: hedef }, senaryoKaynak: "ai" });
  st.sahneleriAyarla(id, p.sahneler.map((s, i) => ({ ...s, id: exId("sh"), ...j.sahneler![i], sesUrl: undefined, sesSure: undefined, sesMetni: undefined })));
  return id;
}

/** Bağlantıdaki sayfayı metne çevirir. */
export async function baglantiOku(url: string): Promise<{ baslik: string; metin: string }> {
  const r = await fetch("/api/explainer/kaynak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  const j = (await r.json()) as { ok: boolean; baslik?: string; metin?: string; hata?: string };
  if (!j.ok) throw new Error(j.hata ?? "Sayfa okunamadı");
  return { baslik: j.baslik ?? "", metin: j.metin ?? "" };
}

/* ═══════════ Müzik ═══════════ */

/** Ruh haline göre, video süresine tam oturan enstrümantal sentezler ve yükler (kredi harcamaz). */
export async function muzikHazirla(p: ExProje): Promise<void> {
  if (p.ayar.muzik === "yok") return;
  const sure = Math.max(8, Math.ceil(toplamSure(p.sahneler)) + 1);
  const anahtar = `${p.ayar.muzik}|${sure}`;
  if (p.ayar.muzikUrl && p.ayar.muzikAnahtar === anahtar) return;
  const r = MUZIK_RUH[p.ayar.muzik];
  const wav = await besteWavUrl({ tohum: `${p.id}-${p.ayar.muzik}`, bpm: r.bpm, key: "A", minor: r.minor, sure, yogunluk: r.yogunluk, parlaklik: r.parlaklik, enstrumantal: true });
  let url = wav;
  try { url = await dosyaYukle(await (await fetch(wav)).blob(), "audio/wav"); } catch { /* yerel data URL ile devam */ }
  useExplainer.getState().ayarGuncelle(p.id, { muzikUrl: url, muzikAnahtar: anahtar });
}

/* ═══════════ Sahne üretimleri (görsel / video / ses) ═══════════ */

type Bekleyen = { uretimId: string; projeId: string; sahneId: string; tur: "gorsel" | "video" | "ses"; metin?: string };
const bekleyenler: Bekleyen[] = [];

/** Bir sahne için görsel/video/seslendirme başlatır. Sonuç geldiğinde sahneye yazılır (useExUretimIzle). */
export function sahneUret(p: ExProje, s: ExSahne, tur: "gorsel" | "video" | "ses"): boolean {
  const st = stilBul(p.ayar.stil);
  const oran = p.ayar.oran;
  if (tur === "ses" && !s.anlatim.trim()) { toast.error("Seslendirme metni boş", { description: "Seslendirmek için önce sahnenin anlatım metnini yaz." }); return false; }
  if (tur === "video" && !s.gorselUrl) { toast.error("Sahne görseli yok", { description: "Hareketli klip görselden başlar. Önce sahne görselini üret." }); return false; }
  const okunus = tur === "ses" ? telaffuzUygula(s.anlatim, useExplainer.getState().sozluk) : "";
  const r = tur === "gorsel"
    ? uretimBaslat({ baslik: `Explainer · ${s.baslik || "sahne"}`.slice(0, 48), tur: "gorsel", model: GORSEL_MODEL, prompt: `${s.gorselIstem || s.anlatim}. Style: ${st.aciklama}. No text, no letters.`, kredi: KREDI.gorsel, arac: "Explainer Stüdyosu", meta: { oran, islem: "uret", hamIstem: s.gorselIstem || s.anlatim } })
    : tur === "video"
      ? uretimBaslat({ baslik: `Explainer · ${s.baslik || "sahne"} · hareket`.slice(0, 48), tur: "video", model: VIDEO_MODEL, prompt: `${s.gorselIstem || s.anlatim}. Gentle camera move, ${st.aciklama}`, kredi: KREDI.video, arac: "Explainer Stüdyosu", meta: { oran, sure: "5sn", gorselUrl: s.gorselUrl, hamIstem: s.gorselIstem } })
      : uretimBaslat({ baslik: `Explainer · ${s.baslik || "sahne"} · ses`.slice(0, 48), tur: "ses", model: SES_MODEL, prompt: okunus, kredi: KREDI.ses(okunus), arac: "Explainer Stüdyosu", meta: { mod: "seslendirme", ses: p.ayar.ses, sesId: p.ayar.sesId, hamIstem: okunus, karakter: okunus.length } });
  if (!r.ok) { uretimHataToast(r); return false; }
  if (r.id) bekleyenler.push({ uretimId: r.id, projeId: p.id, sahneId: s.id, tur, metin: s.anlatim });
  useExplainer.getState().sahneGuncelle(p.id, s.id, tur === "ses" ? {} : { gorselDurum: "uretiliyor" });
  return true;
}

/** Bekleyen üretimleri izler; tamamlananı sahneye işler. Editörde bir kez çağrılır. */
export function useExUretimIzle(): number {
  const uretimler = useProjeler((s) => s.uretimler);
  const islendi = useRef(new Set<string>());
  useEffect(() => {
    for (const b of [...bekleyenler]) {
      const u = uretimler.find((x) => x.id === b.uretimId);
      if (!u || (u.durum !== "tamam" && u.durum !== "hata") || islendi.current.has(b.uretimId)) continue;
      islendi.current.add(b.uretimId);
      bekleyenler.splice(bekleyenler.indexOf(b), 1);
      const st = useExplainer.getState();
      if (u.durum === "hata") { st.sahneGuncelle(b.projeId, b.sahneId, { gorselDurum: "hata" }); toast.error("Sahne üretimi başarısız", { description: `${u.hata ?? "Sağlayıcı bir hata döndürdü."} Yeniden üretmeyi dene.` }); continue; }
      if (b.tur === "gorsel") {
        const url = saltUrl(u.gorselUrl);
        if (url && u.gercek) st.sahneGuncelle(b.projeId, b.sahneId, { gorselUrl: url, videoUrl: undefined, gorselKaynak: "ai", gorselDurum: "hazir" });
        else { st.sahneGuncelle(b.projeId, b.sahneId, { gorselDurum: "bos" }); toast.info("Görsel sağlayıcısı bağlı değil", { description: "Sahne stil klibiyle gösterilmeye devam ediyor. Kredi iade edildi." }); }
      } else if (b.tur === "video") {
        if (u.videoUrl && u.gercek) st.sahneGuncelle(b.projeId, b.sahneId, { videoUrl: u.videoUrl, gorselDurum: "hazir" });
        else { st.sahneGuncelle(b.projeId, b.sahneId, { gorselDurum: "hazir" }); toast.info("Video sağlayıcısı bağlı değil", { description: "Sahne görseli Ken Burns hareketiyle oynuyor. Kredi iade edildi." }); }
      } else if (u.sesUrl && u.gercek) {
        void medyaSuresi(u.sesUrl, "ses").then((sure) => useExplainer.getState().sahneGuncelle(b.projeId, b.sahneId, { sesUrl: u.sesUrl, sesSure: sure ?? undefined, sesMetni: b.metin }));
      } else toast.info("Ses sağlayıcısı bağlı değil", { description: "Seslendirme ElevenLabs anahtarıyla açılır. Kredi iade edildi." });
    }
  }, [uretimler]);
  return bekleyenler.length;
}
export const bekleyenVar = (projeId: string, sahneId: string, tur: Bekleyen["tur"]) => bekleyenler.some((b) => b.projeId === projeId && b.sahneId === sahneId && b.tur === tur);
