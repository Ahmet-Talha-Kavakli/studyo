"use client";

import { useSyncExternalStore } from "react";
import { sesleriAl, sesSec, tarayiciSesiVar, dilTahmin } from "@/lib/tarayiciSesi";

/**
 * Ses stüdyosunun tek oynatıcısı — aynı anda yalnız bir ses çalar (kart, görüntüleyici,
 * önizleme). İki kaynak türü:
 *  • dosya: gerçek ses dosyası (<audio>) — sarma, hız, ses düzeyi desteklenir.
 *  • tarayici: demo; metin tarayıcı konuşma motoruyla okunur. İlerleme okunan karakterden
 *    hesaplanır; sarma desteklenmez (motor izin vermez).
 */

export type CalKaynak =
  | { tur: "dosya"; url: string }
  | { tur: "tarayici"; metin: string; dil?: string; cinsiyet: "Kadın" | "Erkek" | "Nötr"; hiz?: number;
      /** Diyalog: her satır kendi cinsiyetindeki sesle sırayla okunur. */
      parcalar?: { metin: string; cinsiyet: "Kadın" | "Erkek" | "Nötr" }[] };

/** Model etiketleri ([whispers]) ve SSML duraklamaları tarayıcıda sesli okunmasın. */
const temizMetin = (m: string) => m.replace(/\[[a-z ]{2,20}\]/gi, " ").replace(/<break[^>]*\/?>/gi, " ").replace(/\s+/g, " ").trim();

export type CalDurum = {
  id: string | null;
  calisiyor: boolean;
  an: number;       // sn (dosya) ya da okunan karakter (tarayıcı)
  toplam: number;   // sn (dosya) ya da toplam karakter (tarayıcı)
  tur: "dosya" | "tarayici" | null;
  hiz: number;
  duzey: number;
  uyari?: string;
  hata?: string;
  /** Sona kadar çalınan parça sayısı — "bitti" olayını dinlemek için (sıradakine geçiş). */
  bitis: number;
};

let durum: CalDurum = { id: null, calisiyor: false, an: 0, toplam: 0, tur: null, hiz: 1, duzey: 1, bitis: 0 };
const dinleyiciler = new Set<() => void>();
const yay = (d: Partial<CalDurum>) => { durum = { ...durum, ...d }; dinleyiciler.forEach((f) => f()); };

let audio: HTMLAudioElement | null = null;
let soz: SpeechSynthesisUtterance | null = null;

function temizle() {
  if (audio) { audio.pause(); audio.src = ""; audio.onloadedmetadata = audio.ontimeupdate = audio.ondurationchange = audio.onended = audio.onerror = audio.onplay = audio.onpause = null; audio = null; }
  if (soz && tarayiciSesiVar()) { soz.onend = soz.onboundary = soz.onerror = null; speechSynthesis.cancel(); soz = null; }
}

export const sesCalici = {
  durum: () => durum,
  abone(f: () => void) { dinleyiciler.add(f); return () => { dinleyiciler.delete(f); }; },

  /** Çal; aynı id duraklatılmışsa kaldığı yerden devam eder. */
  async cal(id: string, kaynak: CalKaynak) {
    if (durum.id === id && audio && kaynak.tur === "dosya") { await audio.play().catch(() => {}); return; }
    temizle();
    yay({ id, calisiyor: false, an: 0, toplam: 0, tur: kaynak.tur, uyari: undefined, hata: undefined });
    if (kaynak.tur === "dosya") {
      const a = new Audio(kaynak.url);
      a.preload = "auto"; a.playbackRate = durum.hiz; a.volume = durum.duzey;
      audio = a;
      a.onloadedmetadata = () => { if (audio === a && isFinite(a.duration)) yay({ toplam: a.duration }); };
      a.ontimeupdate = () => { if (audio === a) yay({ an: a.currentTime }); };
      a.onplay = () => { if (audio === a) yay({ calisiyor: true }); };
      a.onpause = () => { if (audio === a) yay({ calisiyor: false }); };
      a.onended = () => { if (audio === a) yay({ calisiyor: false, an: 0, bitis: durum.bitis + 1 }); };
      a.onerror = () => { if (audio === a) yay({ calisiyor: false, hata: "Ses dosyası oynatılamadı." }); };
      await a.play().catch(() => { /* hata onerror'da */ });
      return;
    }
    if (!tarayiciSesiVar()) { yay({ hata: "Tarayıcın konuşma motoru sunmuyor." }); return; }
    const sesler = await sesleriAl();
    if (durum.id !== id) return; // bu arada başka bir şey çalındı
    const dil = kaynak.dil || dilTahmin(kaynak.metin);
    const parcalar = (kaynak.parcalar ?? [{ metin: kaynak.metin, cinsiyet: kaynak.cinsiyet }])
      .map((p) => ({ ...p, metin: temizMetin(p.metin) })).filter((p) => p.metin);
    if (!parcalar.length) { yay({ hata: "Okunacak metin yok." }); return; }
    const secimler = parcalar.map((p) => sesSec(sesler, dil, p.cinsiyet));
    if (!secimler[0].ses) { yay({ hata: secimler[0].uyari ?? "Tarayıcı sesi bulunamadı." }); return; }
    const toplam = parcalar.reduce((n, p) => n + p.metin.length + 1, 0);
    yay({ toplam, uyari: secimler.find((s) => s.uyari)?.uyari });
    speechSynthesis.cancel();
    // Parçalar sırayla okunur; ilerleme önceki parçaların karakterleri + o anki konumdur.
    const oku = (i: number, once: number) => {
      const { ses } = secimler[i];
      const u = new SpeechSynthesisUtterance(parcalar[i].metin);
      if (ses) { u.voice = ses; u.lang = ses.lang; }
      u.rate = Math.min(2, Math.max(0.5, kaynak.hiz ?? 1)); u.volume = durum.duzey;
      soz = u;
      u.onstart = () => { if (soz === u) yay({ calisiyor: true }); };
      u.onboundary = (e) => { if (soz === u) yay({ an: once + e.charIndex }); };
      u.onend = () => {
        if (soz !== u) return;
        if (i + 1 < parcalar.length) return oku(i + 1, once + parcalar[i].metin.length + 1);
        soz = null; yay({ calisiyor: false, an: 0 });
      };
      u.onerror = (e) => { if (soz === u && e.error !== "interrupted" && e.error !== "canceled") { soz = null; yay({ calisiyor: false, hata: "Tarayıcı sesi çalınamadı." }); } };
      speechSynthesis.speak(u);
    };
    oku(0, 0);
  },

  /** Tarayıcı MP3 parçalarını MediaSource ile akıtabiliyor mu (akışlı seslendirme için). */
  akisDestek(): boolean {
    return typeof window !== "undefined" && "MediaSource" in window && MediaSource.isTypeSupported("audio/mpeg");
  },

  /**
   * Akışlı çalma: sağlayıcıdan gelen MP3 parçaları geldikçe aynı oynatıcıda çalınır. İlk parçada çalmaya
   * başlar; `bitir` ile akış kapanır ve kayıt baştan yeniden çalınabilir. Başka bir şey çalınırsa akış susar.
   */
  akisBaslat(id: string) {
    temizle();
    const ms = new MediaSource();
    const a = new Audio();
    const nesne = URL.createObjectURL(ms);
    a.src = nesne; a.playbackRate = durum.hiz; a.volume = durum.duzey;
    audio = a;
    yay({ id, calisiyor: false, an: 0, toplam: 0, tur: "dosya", uyari: undefined, hata: undefined });
    let sb: SourceBuffer | null = null, kapat = false, basladi = false;
    const kuyruk: Uint8Array[] = [];
    const besle = () => {
      if (!sb || sb.updating || ms.readyState !== "open") return;
      const p = kuyruk.shift();
      if (p) { try { sb.appendBuffer(p as BufferSource); } catch { /* kota/bozuk parça: kalan sonuç dosyasıyla çalınır */ } }
      else if (kapat) { try { ms.endOfStream(); } catch { /* zaten kapalı */ } }
    };
    ms.addEventListener("sourceopen", () => { sb = ms.addSourceBuffer("audio/mpeg"); sb.addEventListener("updateend", besle); besle(); }, { once: true });
    a.ontimeupdate = () => { if (audio === a) yay({ an: a.currentTime, ...(isFinite(a.duration) ? { toplam: a.duration } : {}) }); };
    a.ondurationchange = () => { if (audio === a && isFinite(a.duration)) yay({ toplam: a.duration }); };
    a.onplay = () => { if (audio === a) yay({ calisiyor: true }); };
    a.onpause = () => { if (audio === a) yay({ calisiyor: false }); };
    a.onended = () => { if (audio === a) yay({ calisiyor: false, an: 0, bitis: durum.bitis + 1 }); };
    a.onerror = () => { if (audio === a) yay({ calisiyor: false }); };
    return {
      ekle(b64: string) {
        if (audio !== a) return;
        const ham = atob(b64), bayt = new Uint8Array(ham.length);
        for (let i = 0; i < ham.length; i++) bayt[i] = ham.charCodeAt(i);
        kuyruk.push(bayt); besle();
        if (!basladi) { basladi = true; void a.play().catch(() => {}); }
      },
      bitir() { kapat = true; besle(); setTimeout(() => URL.revokeObjectURL(nesne), 60_000); },
      iptal() { if (audio === a) sesCalici.durdur(); URL.revokeObjectURL(nesne); },
    };
  },

  duraklat() {
    if (audio) audio.pause();
    else if (soz) { temizle(); yay({ calisiyor: false, an: 0 }); } // konuşma motorunda güvenilir duraklatma yok
  },
  durdur() { temizle(); yay({ id: null, calisiyor: false, an: 0, toplam: 0, tur: null }); },
  /** Yalnız dosyada: saniye cinsinden konuma git. */
  konum(sn: number) { if (audio && isFinite(audio.duration)) { audio.currentTime = Math.max(0, Math.min(audio.duration, sn)); yay({ an: audio.currentTime }); } },
  atla(sn: number) { if (audio) this.konum(audio.currentTime + sn); },
  hiz(h: number) { yay({ hiz: h }); if (audio) audio.playbackRate = h; },
  duzey(d: number) { yay({ duzey: d }); if (audio) audio.volume = d; },
};

/** Bir öğenin oynatma durumu (yalnız o öğe çalıyorsa dolu). */
export function useCalici(): CalDurum {
  return useSyncExternalStore(sesCalici.abone, sesCalici.durum, sesCalici.durum);
}

export function sureYaz(sn: number): string {
  if (!isFinite(sn) || sn < 0) return "0:00";
  const d = Math.floor(sn / 60), s = Math.floor(sn % 60);
  return `${d}:${String(s).padStart(2, "0")}`;
}
