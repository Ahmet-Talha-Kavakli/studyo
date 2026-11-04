"use client";

/**
 * Explainer'ı düzenleyici açmadan doğrudan MP4'e çevirir: müzik bestelenir, sahneler montaj motoruna derlenir,
 * tarayıcıda dışa aktarılır ve sonuç "Üretilenler"e (useProjeler) düşer. Kredi harcamaz.
 */

import { useExplainer, type ExProje, type ExSahne } from "@/store/useExplainer";
import { useProjeler } from "@/store/useProjeler";
import { explainerMontaj, toplamSure, stilBul, stilPoster } from "@/lib/explainerMotor";
import { disaAktar, kareAl } from "@/lib/montajMotor";
import { dosyaYukle } from "@/components/montaj/ortak";
import { fontlariYukle } from "@/components/montaj/fontlar";
import { muzikHazirla } from "./exUretim";
import { toast } from "@/lib/toast";

export const EX_ARAC = "Explainer Stüdyosu";

const BOYUT: Record<ExProje["ayar"]["oran"], [number, number]> = { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [960, 960] };

/** Taslakta boş kalan alanlar videoda görünmez: boş maddeler atılır, maddesiz liste ve değersiz rakam sahnesi anlatıma döner. */
function temizle(l: ExSahne[]): ExSahne[] {
  return l.map((s) => {
    if (s.tur === "liste") { const m = (s.maddeler ?? []).filter((x) => x.trim()); return m.length ? { ...s, maddeler: m } : { ...s, tur: "anlatim" as const }; }
    if (s.tur === "istatistik" && !s.deger?.trim()) return { ...s, tur: "anlatim" as const };
    return s;
  });
}

/** Projeyi MP4'e çevirir; ilerleme Üretilenler kartında görünür. Dönen değer üretim kaydının kimliği. */
export async function explainerVideoUret(projeId: string): Promise<string | null> {
  const bul = () => useExplainer.getState().projeler.find((x) => x.id === projeId);
  const p0 = bul();
  if (!p0 || !p0.sahneler.length) return null;
  const pr = useProjeler.getState();
  const stilAd = stilBul(p0.ayar.stil).ad;
  const meta = { oran: p0.ayar.oran, hamIstem: p0.konu || p0.ad, mod: "explainer", stilAd, kaynakId: projeId };
  const id = pr.ekle({ baslik: p0.ad, tur: "video", model: "Vayra kurgu", prompt: p0.konu || p0.ad, durum: "isleniyor", ilerleme: 2, baslama: Date.now(), kredi: 0, arac: EX_ARAC, gorselUrl: stilPoster(p0.ayar.stil), meta });
  try {
    await muzikHazirla(p0).catch(() => {});
    const p = bul() ?? p0;
    const m = explainerMontaj({ ...p, sahneler: temizle(p.sahneler) });
    const sure = Math.ceil(toplamSure(p.sahneler));
    const [W, H] = BOYUT[p.ayar.oran] ?? BOYUT["16:9"];
    await fontlariYukle();
    const kayit = await disaAktar(m, { W, H, fps: 30, bitHizi: 5e6 }, (d) => useProjeler.getState().guncelle(id, { ilerleme: Math.max(2, Math.round(d.ilerleme * 96)) }), new AbortController().signal);
    const videoUrl = await dosyaYukle(kayit.blob, kayit.blob.type || "video/webm");
    let kapak = stilPoster(p.ayar.stil);
    try { kapak = await dosyaYukle(await kareAl(m, Math.min(1.6, sure / 2), Math.round(W / 2), Math.round(H / 2)), "image/jpeg"); } catch { /* stil kapağı kalır */ }
    useProjeler.getState().guncelle(id, { durum: "tamam", ilerleme: 100, videoUrl, gorselUrl: kapak, gercek: true, saglayici: "tarayici", meta: { ...meta, sure: `${sure}sn` } });
    useExplainer.getState().guncelle(projeId, { onayBekliyor: false });
    toast.success("Explainer hazır", { description: p.senaryoKaynak === "ai" ? `${p.sahneler.length} sahne, AI senaryo. Kredi harcanmadı.` : `${p.sahneler.length} sahne. Senaryo yazarı bağlı değil, taslak senaryo kullanıldı.` });
  } catch (e) {
    useProjeler.getState().guncelle(id, { durum: "hata", ilerleme: 0, hata: e instanceof Error ? e.message : "Video kurulamadı" });
    toast.error("Explainer kurulamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
  }
  return id;
}
