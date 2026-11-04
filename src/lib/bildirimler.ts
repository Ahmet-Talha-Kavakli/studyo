"use client";

import { useEffect } from "react";
import { useBildirim, type YeniBildirim } from "@/store/useBildirim";
import { useTercih } from "@/store/useTercih";
import { useEkler, aktifSinirsizlar } from "@/store/useEkler";
import { MODELLER } from "@/lib/catalog";

/**
 * Bildirim üreticileri — olay gerçekleştiği yerde tek satırla çağrılır.
 * Kullanıcının bildirim tercihleri (useTercih.bildirimTercih) burada uygulanır:
 *   uretim    → üretim bildirimleri
 *   pazarlama → duyurular
 * Hesap (ödeme, kredi, plan) bildirimleri kapatılamaz.
 */
export function bildir(b: YeniBildirim) {
  const tercih = useTercih.getState();
  const t = tercih.bildirimTercih;
  if (b.kategori === "uretim" && !t.uretim) return;
  if (b.kategori === "duyuru" && !t.pazarlama) return;
  useBildirim.getState().ekle(b);
  if (typeof window === "undefined") return;
  // Sekme arka plandayken işletim sistemi bildirimi (izin verildiyse)
  if (tercih.masaustuBildirim && document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(b.baslik, { body: b.mesaj, icon: b.gorsel ?? "/icon.png", tag: b.anahtar ?? b.baslik });
      n.onclick = () => { window.focus(); if (b.link) window.location.assign(b.link); n.close(); };
    } catch { /* bazı tarayıcılar yalnız service worker'dan izin verir */ }
  }
  if (tercih.bildirimSesi && b.kategori === "uretim") bildirimSesiCal(b.tur === "hata");
}

/** Otomatik kredi yüklemenin tetiklendiği bakiye (Ayarlar › Abonelik). */
export const OTO_YUKLEME_ESIGI = 100;

/** Kısa, yumuşak iki notalı bildirim sesi (WebAudio; dosya gerektirmez). */
export function bildirimSesiCal(hata = false) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notalar = hata ? [440, 330] : [660, 880];
    notalar.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch { /* ses desteklenmiyor */ }
}

export function hesapBildirimi(baslik: string, mesaj: string, eylem?: { ad: string; link: string }, tur: YeniBildirim["tur"] = "basari") {
  bildir({ kategori: "hesap", tur, baslik, mesaj, link: eylem?.link, eylem });
}

const SA = 3_600_000;

/**
 * Zamana bağlı bildirimler için gözcü — panel kabuğunda bir kez çalışır.
 * Şimdilik: sınırsız erişimin bitmesine 24 saatten az kaldıysa bir kez uyarır.
 */
export function useBildirimGozcusu() {
  const sinirsizlar = useEkler((s) => s.sinirsizlar);
  useEffect(() => {
    const kontrol = () => {
      for (const a of aktifSinirsizlar(sinirsizlar)) {
        const kalan = a.bitis - Date.now();
        if (kalan > 24 * SA) continue;
        const ad = MODELLER.find((m) => m.id === a.model)?.ad ?? a.model;
        useBildirim.getState().ekleTek({
          anahtar: `sinirsiz-bitiyor-${a.model}-${a.bitis}`,
          kategori: "hesap", tur: "uyari",
          baslik: `Sınırsız ${ad} bitiyor`,
          mesaj: `Erişimin ${Math.max(1, Math.round(kalan / SA))} saat içinde sona eriyor. Süreyi uzatabilir ya da kredilerinle devam edebilirsin.`,
          link: "/panel/kredi?sekme=sinirsiz", eylem: { ad: "Süreyi uzat", link: "/panel/kredi?sekme=sinirsiz" },
        }, 7 * 24 * SA);
      }
    };
    kontrol();
    const t = setInterval(kontrol, 10 * 60_000);
    return () => clearInterval(t);
  }, [sinirsizlar]);
}
