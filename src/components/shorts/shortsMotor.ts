"use client";

import { dalgaFormu } from "@/lib/montajMotor";
import type { MontajProje, MontajKlip, MontajKatman, MetinStil } from "@/store/useMontaj";

/**
 * Shorts motoru — uzun klipten dikey short: ses enerjisiyle aday bölüm bulma, montaj projesine derleme
 * (yeniden kadraj, kanca başlığı, altyazı, ilerleme çubuğu, müzik). Önizleme ve MP4 aynı montaj motorunu kullanır.
 */

export type Yerlesim = "doldur" | "bulanik" | "sigdir";
export type Odak = "sol" | "orta" | "sag";
export type AltyaziStil = "karaoke" | "tiktok" | "neon" | "altyazi" | "sade" | "yok";
export type ShortsOran = "9:16" | "1:1" | "4:5";
export type Satir = { metin: string; b: number; s: number; kelimeler?: { k: string; b: number; s: number }[] };
export type Aday = { bas: number; son: number; puan: number; konusma: number; enerji: number };

let sayac = 0;
const sid = (p: string) => `${p}_${Date.now().toString(36)}${(sayac += 1)}`;

/**
 * Aday bölümler: 0,1 sn çözünürlüklü ses tepelerinden, hedef uzunlukta pencereler kaydırılır.
 * Puan = %60 ortalama enerji + %40 konuşma yoğunluğu (sessiz olmayan oran). Örtüşmeyen en iyi `adet` pencere.
 * Ses çözülemezse null (çağıran eşit bölmeye düşer).
 */
export async function adaylariBul(url: string, uzunluk: number, adet = 6): Promise<{ adaylar: Aday[]; sure: number } | null> {
  const d = await dalgaFormu(url, 10);
  if (!d || d.sure < 3) return null;
  const t = d.tepeler, n = t.length, adim = d.sure / n;
  const pen = Math.max(1, Math.round(Math.min(uzunluk, d.sure) / adim));
  const sesli = Array.from(t, (v) => (v > 0.08 ? 1 : 0));
  const top = [0], sesTop = [0];
  for (let i = 0; i < n; i++) { top.push(top[i] + t[i]); sesTop.push(sesTop[i] + sesli[i]); }
  const l: Aday[] = [];
  const kaydir = Math.max(1, Math.round(1 / adim));
  for (let i = 0; i + pen <= n; i += kaydir) {
    const enerji = (top[i + pen] - top[i]) / pen, konusma = (sesTop[i + pen] - sesTop[i]) / pen;
    l.push({ bas: i * adim, son: (i + pen) * adim, enerji, konusma, puan: 0.6 * enerji + 0.4 * konusma });
  }
  if (!l.length) l.push({ bas: 0, son: d.sure, enerji: 0, konusma: 0, puan: 0 });
  const enIyi = Math.max(...l.map((x) => x.puan), 0.0001);
  const secilen: Aday[] = [];
  for (const a of [...l].sort((x, y) => y.puan - x.puan)) {
    if (secilen.some((s) => a.bas < s.son - 0.5 && a.son > s.bas + 0.5)) continue;
    // Başlangıcı yakındaki en sessiz ana çek (cümle ortasında başlamasın)
    let bas = a.bas, enAz = Infinity;
    for (let j = Math.max(0, Math.round(a.bas / adim) - 15); j <= Math.round(a.bas / adim); j++) if (t[j] < enAz) { enAz = t[j]; bas = j * adim; }
    const kay = a.bas - bas;
    secilen.push({ ...a, bas, son: Math.min(d.sure, a.son - kay), puan: Math.round((a.puan / enIyi) * 100) });
    if (secilen.length >= adet) break;
  }
  return { adaylar: secilen.sort((x, y) => x.bas - y.bas), sure: d.sure };
}

/** Ses yoksa: eşit bölümler (puan yok). */
export function esitBol(sure: number, uzunluk: number, adet = 6): Aday[] {
  const L = Math.min(uzunluk, sure), n = Math.min(adet, Math.max(1, Math.floor(sure / L)));
  return Array.from({ length: n }, (_, i) => ({ bas: i * L, son: Math.min(sure, (i + 1) * L), puan: -1, konusma: 0, enerji: 0 }));
}

/** Metinden altyazı satırları: ~5 sözcüklük parçalar, aralığa karakter oranında yayılır. */
export function metindenSatirlar(metin: string, sure: number): Satir[] {
  const w = metin.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!w.length) return [];
  const p: string[] = []; let k: string[] = [];
  for (const x of w) { k.push(x); if (k.length >= 5 || (/[.!?,;:]$/.test(x) && k.length >= 3)) { p.push(k.join(" ")); k = []; } }
  if (k.length) p.push(k.join(" "));
  const top = p.reduce((a, x) => a + x.length, 0); let t = 0.2;
  return p.map((m) => { const d = Math.max(0.7, (m.length / top) * (sure - 0.4)); const s = { metin: m, b: t, s: t + d }; t += d; return s; });
}

/** Sözcük zamanlarından (Scribe) altyazı satırları; zamanlar klibe göre (0 = klip başı). */
export function kelimelerdenSatirlar(k: { k: string; b: number; s: number }[], bas: number, son: number): Satir[] {
  const l = k.filter((x) => x.b >= bas && x.s <= son + 0.3 && !/^\(.*\)$/.test(x.k));
  const r: Satir[] = []; let p: typeof l = [];
  const it = () => { if (!p.length) return; const b0 = p[0].b - bas; r.push({ metin: p.map((x) => x.k).join(" "), b: b0, s: p[p.length - 1].s - bas + 0.1, kelimeler: p.map((x) => ({ k: x.k, b: x.b - bas - b0, s: x.s - bas - b0 })) }); p = []; };
  for (const x of l) { p.push(x); if (p.length >= 4 || /[.!?]$/.test(x.k) || (p.length > 1 && x.s - p[0].b > 2.4)) it(); }
  it();
  return r;
}

const ALTYAZI_STIL: Record<Exclude<AltyaziStil, "yok">, { stil: MetinStil; boyut: number; font: string; anim: "pop" | "fade" }> = {
  karaoke: { stil: "karaoke", boyut: 62, font: "montserrat", anim: "pop" },
  tiktok: { stil: "tiktok", boyut: 66, font: "montserrat", anim: "pop" },
  neon: { stil: "neon", boyut: 60, font: "poppins", anim: "fade" },
  altyazi: { stil: "altyazi", boyut: 50, font: "inter", anim: "fade" },
  sade: { stil: "baslik", boyut: 58, font: "poppins", anim: "fade" },
};

const klip = (k: Partial<MontajKlip> & { ad: string; tur: MontajKlip["tur"]; baslangic: number; sure: number }): MontajKlip => ({ id: sid("kl"), basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: k.tur === "ses" ? 100 : 0, opaklik: 100, efektler: [], gecis: "yok", gecisSure: 0.4, ...k });
const katman = (tur: MontajKatman["tur"], ad: string, klipler: MontajKlip[], ek?: Partial<MontajKatman>): MontajKatman => ({ id: sid("kat"), tur, ad, klipler, sessiz: false, kilitli: false, gizli: false, ...ek });

/** Klipten short: kaynak [bas, son] aralığı dikey çerçeveye, kanca + altyazı + ilerleme + müzikle. */
export function klipShortu(o: {
  ad: string; url: string; poster?: string; kaynakSure: number; bas: number; son: number; oran: ShortsOran;
  yerlesim: Yerlesim; odak: Odak; zoom: number; kanca: string; satirlar: Satir[]; altyazi: AltyaziStil; vurgu: string;
  ilerleme: boolean; muzikUrl?: string; sesDuzey: number;
}): MontajProje {
  const sure = Math.max(1, o.son - o.bas);
  const video = klip({
    ad: o.ad, tur: "video", videoUrl: o.url, sesUrl: o.url, gorselUrl: o.poster, baslangic: 0, sure: o.kaynakSure, basKirp: o.bas, sonKirp: Math.max(0, o.kaynakSure - o.son),
    sesDuzey: o.sesDuzey, sigdir: o.yerlesim, olcek: o.zoom, konumX: o.yerlesim === "doldur" ? { sol: 22, orta: 0, sag: -22 }[o.odak] : 0,
  });
  const yazi: MontajKlip[] = [];
  if (o.kanca.trim()) yazi.push(klip({ ad: "Kanca", tur: "metin", metin: o.kanca.trim(), baslangic: 0.1, sure: Math.min(3.6, sure - 0.2), metinStil: "baslik", metinArka: true, metinKutuRenk: o.vurgu, metinRenk: "#06121a", metinBoyut: 54, metinGolge: false, metinKonum: "ust", konumY: 4, metinAnim: "pop", metinCikis: "fade", metinFont: "montserrat" }));
  if (o.ilerleme) yazi.push(klip({ ad: "İlerleme", tur: "metin", oge: { tip: "ilerleme", renk: o.vurgu }, baslangic: 0, sure }));
  const alt: MontajKlip[] = [];
  if (o.altyazi !== "yok") {
    const A = ALTYAZI_STIL[o.altyazi];
    for (const s of o.satirlar) {
      if (s.b >= sure) break;
      alt.push(klip({ ad: s.metin.slice(0, 30), tur: "metin", metin: s.metin, baslangic: Math.max(0, s.b), sure: Math.max(0.5, Math.min(sure, s.s) - Math.max(0, s.b)), metinStil: A.stil, metinBoyut: A.boyut, metinFont: A.font, metinAnim: A.anim, metinCikis: "yok", metinKonum: "orta", konumY: 18, metinRenk: o.altyazi === "neon" ? o.vurgu : "#ffffff", vurguRenk: o.vurgu, kelimeler: s.kelimeler, metinArka: o.altyazi === "altyazi" ? true : undefined }));
    }
  }
  const muzik = o.muzikUrl ? [klip({ ad: "Müzik", tur: "ses", sesUrl: o.muzikUrl, baslangic: 0, sure: Math.ceil(sure), sesDuzey: 40, sesGiris: 0.5, sesCikis: 1.2 })] : [];
  return {
    id: sid("shm"), ad: o.ad, enBoy: o.oran, cozunurluk: "1080p", fps: 30, aiTalimat: "", altyazi: o.altyazi !== "yok", guncelleme: Date.now(), olusturma: Date.now(), arkaRenk: "#05070a", kisma: true, medya: [],
    katmanlar: [katman("metin", "Kanca ve ilerleme", yazi), katman("metin", "Altyazı", alt), katman("video", "Klip", [video]), katman("ses", "Müzik", muzik, { rol: "muzik" })],
  };
}

export const sureYaz = (sn: number) => { const s = Math.max(0, Math.round(sn)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/**
 * Görüntü hareketi: her aralıktan eşit aralıklı küçük kareler alınır, ardışık kareler arasındaki ortalama
 * parlaklık farkı ölçülür (0–1). Sessiz videolarda anları puanlamak için gerçek bir ölçü.
 */
export function hareketOlc(url: string, araliklar: [number, number][], ornek = 6): Promise<number[]> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.playsInline = true;
    const c = document.createElement("canvas"); c.width = 36; c.height = 36;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const anlar = araliklar.flatMap(([b, s]) => Array.from({ length: ornek }, (_, i) => b + ((i + 0.5) / ornek) * Math.max(0.1, s - b)));
    const parlak: Float32Array[] = [];
    let i = 0;
    const bitir = () => {
      clearTimeout(zaman);
      v.removeAttribute("src"); v.load();
      ok(araliklar.map((_, a) => {
        let top = 0, n = 0;
        for (let k = 1; k < ornek; k++) {
          const x = parlak[a * ornek + k - 1], y = parlak[a * ornek + k];
          if (!x || !y) continue;
          let f = 0; for (let p = 0; p < x.length; p++) f += Math.abs(x[p] - y[p]);
          top += f / x.length; n++;
        }
        return n ? top / n / 38 : 0;
      }));
    };
    const zaman = setTimeout(bitir, 15000);
    v.onerror = bitir;
    v.onloadedmetadata = () => { v.currentTime = Math.min(anlar[0] ?? 0, Math.max(0, v.duration - 0.05)); };
    v.onseeked = () => {
      try {
        ctx!.drawImage(v, 0, 0, 36, 36);
        const d = ctx!.getImageData(0, 0, 36, 36).data, g = new Float32Array(36 * 36);
        for (let p = 0; p < g.length; p++) g[p] = 0.3 * d[p * 4] + 0.59 * d[p * 4 + 1] + 0.11 * d[p * 4 + 2];
        parlak.push(g);
      } catch { parlak.push(new Float32Array(0)); }
      i++;
      if (i >= anlar.length) return bitir();
      v.currentTime = Math.min(anlar[i], Math.max(0, v.duration - 0.05));
    };
    v.src = url;
  });
}

/** Ölçülerden kısa, dürüst bir gerekçe cümlesi. */
export function anGerekce(a: { enerji: number; konusma: number; hareket?: number }, sesVar: boolean): string {
  const l: string[] = [];
  if (sesVar) {
    if (a.enerji >= 0.55) l.push("yüksek ses enerjisi"); else if (a.enerji >= 0.3) l.push("dengeli ses");
    if (a.konusma >= 0.75) l.push("kesintisiz konuşma"); else if (a.konusma >= 0.45) l.push("yoğun konuşma");
  }
  if (a.hareket !== undefined) { if (a.hareket >= 0.6) l.push("bol hareket"); else if (a.hareket >= 0.2) l.push("akıcı hareket"); else l.push("sakin kadraj"); }
  const m = l.join(" · ") || "eşit bölüm";
  return m.charAt(0).toLocaleUpperCase("tr") + m.slice(1);
}
