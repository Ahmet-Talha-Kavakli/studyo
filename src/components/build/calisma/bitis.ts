"use client";

/**
 * Tur bitişi geri bildirimi: kısa iki tonlu çan (Web Audio, dosya yok) ve sekme arka plandayken masaüstü bildirimi.
 * Tercihler tarayıcıda: vayra-build-ses (açık varsayılan), vayra-build-bildirim (izin verildiyse açık).
 */
const oku = (k: string, v: boolean) => { try { const x = localStorage.getItem(k); return x === null ? v : x === "1"; } catch { return v; } };
const yaz = (k: string, v: boolean) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch { /* özel pencere */ } };

export const sesAcik = () => oku("vayra-build-ses", true);
export const sesAyarla = (v: boolean) => yaz("vayra-build-ses", v);
export const bildirimAcik = () => typeof Notification !== "undefined" && Notification.permission === "granted" && oku("vayra-build-bildirim", true);

export async function bildirimAyarla(v: boolean): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (v && Notification.permission === "default") { const s = await Notification.requestPermission(); if (s !== "granted") return false; }
  if (v && Notification.permission !== "granted") return false;
  yaz("vayra-build-bildirim", v);
  return v;
}

export function canCal(hata = false) {
  if (!sesAcik()) return;
  try {
    const A = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new A();
    const notalar = hata ? [523.25, 392] : [659.25, 987.77];
    notalar.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.55);
    });
    setTimeout(() => c.close(), 1200);
  } catch { /* ses yok */ }
}

export function bildir(baslik: string, govde: string) {
  if (!bildirimAcik() || !document.hidden) return;
  try { const n = new Notification(baslik, { body: govde, icon: "/icon.png", tag: "vayra-build" }); n.onclick = () => { window.focus(); n.close(); }; } catch { /* yok */ }
}
