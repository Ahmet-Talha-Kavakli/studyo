"use client";

import {
  klipSure, klipDonusum, tamFilter, anlikHiz, sesZarf, montajToplamSure,
  type MontajProje, type MontajKlip, type MontajKatman, type MetinStil,
} from "@/store/useMontaj";

/**
 * Montaj motoru — önizleme ve dışa aktarma AYNI çizim fonksiyonunu kullanır (ne görüyorsan o iner).
 *
 *  • MedyaHavuzu: klip başına <video>/<audio>/<img> öğeleri; playhead'e senkron oynatma/sarma;
 *    sesler WebAudio grafiğinden geçer (önizlemede hoparlöre, dışa aktarmada kayıt akışına).
 *  • kareCiz(): bir anı canvas'a çizer — katmanlar, kırpma, hız, dönüşüm (keyframe), renk,
 *    efekt, geçiş ve yazılar.
 *  • disaAktar(): zaman çizelgesini gerçek zamanlı oynatıp canvas + sesi MediaRecorder ile kaydeder.
 *  • dalgaFormu() / sessizAraliklar(): sesi gerçekten çözümleyip tepe değerleri ve sessiz aralıkları çıkarır.
 */

export const OLCU: Record<string, Record<MontajProje["enBoy"], [number, number]>> = {
  "720p": { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [720, 720], "4:5": [720, 900] },
  "1080p": { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350] },
  "4K": { "16:9": [3840, 2160], "9:16": [2160, 3840], "1:1": [2160, 2160], "4:5": [2160, 2700] },
};

/** Klibin video kaynağı (video klipte videoUrl; eski kayıtlarda sesUrl'de durur). */
export const videoKaynak = (k: MontajKlip): string | undefined =>
  k.tur === "video" ? (k.videoUrl ?? (k.sesUrl && /\.(mp4|webm|mov)(\?|$)|^blob:|^\/api\/dosya\/video\//i.test(k.sesUrl) ? k.sesUrl : undefined)) : undefined;
/** Çizilebilir görsel adresi (CSS gradyan değil). */
export const gorselKaynak = (u?: string): string | undefined => (u && /^(data:image|https?:|\/|blob:)/.test(u) && !/^(linear|radial)-gradient/.test(u) ? u : undefined);
/** Ses kaynağı: ses klibinde sesUrl; video klibinde videonun kendisi. */
const sesKaynak = (k: MontajKlip): string | undefined => (k.tur === "ses" ? k.sesUrl : k.tur === "video" ? videoKaynak(k) : undefined);

type SesDugum = { kaynak: MediaElementAudioSourceNode; kazanc: GainNode; anahtar: string; ara: AudioNode[] };

/** Katman o an duyulabilir mi (sessiz / gizli / başka katman solo). */
export function katmanDuyulur(p: MontajProje, kat: MontajKatman): boolean {
  if (kat.sessiz || (kat.tur === "video" && kat.gizli)) return false;
  const soloVar = p.katmanlar.some((k) => k.solo);
  return !soloVar || !!kat.solo;
}

/** Bu anda müzik dışı duyulan bir ses (video sesi ya da konuşma) var mı — otomatik kısma için. */
export function konusmaVar(p: MontajProje, t: number): boolean {
  for (const kat of p.katmanlar) {
    if (!katmanDuyulur(p, kat) || kat.rol === "muzik" || kat.tur === "metin") continue;
    for (const k of kat.klipler) {
      if (k.sesDuzey <= 0 || (kat.tur === "video" && !videoKaynak(k))) continue;
      if (t >= k.baslangic && t < k.baslangic + klipSure(k)) return true;
    }
  }
  return false;
}

/* ═══════════════════════ Medya havuzu ═══════════════════════ */

export class MedyaHavuzu {
  readonly video = new Map<string, HTMLVideoElement>();   // klip id → video
  private ses = new Map<string, HTMLAudioElement>();     // klip id → audio
  private gorsel = new Map<string, HTMLImageElement>();  // url → img
  private dugum = new Map<HTMLMediaElement, SesDugum>();
  private ctx: AudioContext | null = null;
  private ana: GainNode | null = null;
  /** Kayıt hedefi (dışa aktarmada). */
  hedef: MediaStreamAudioDestinationNode | null = null;
  /** Bir öğe yeni kare hazırladığında (sarma bitti, görsel yüklendi) çağrılır. */
  onHazir: (() => void) | null = null;

  /** Önizleme ana ses çarpanı (sessize alma). */
  private anaDuzey = 1;

  constructor(private hoparlor = true) {}

  anaSes(v: number) {
    this.anaDuzey = v;
    if (this.ana) this.ana.gain.value = v;
    for (const el of [...this.video.values(), ...this.ses.values()]) if (!this.dugum.has(el)) el.muted = v === 0;
  }

  /** Ses grafiğini kurar — tarayıcı kuralı gereği ilk kullanıcı etkileşiminde çağrılmalı. */
  sesBaslat(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.ana = this.ctx.createGain();
      this.ana.gain.value = this.anaDuzey;
      if (this.hoparlor) this.ana.connect(this.ctx.destination);
      if (!this.hoparlor) { this.hedef = this.ctx.createMediaStreamDestination(); this.ana.connect(this.hedef); }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private bagla(el: HTMLMediaElement) {
    if (!this.ctx || !this.ana || this.dugum.has(el)) return;
    try {
      const kaynak = this.ctx.createMediaElementSource(el);
      const kazanc = this.ctx.createGain();
      kaynak.connect(kazanc); kazanc.connect(this.ana);
      this.dugum.set(el, { kaynak, kazanc, anahtar: "", ara: [] });
    } catch { /* aynı öğe zaten bağlı */ }
  }

  /** Klibin ses işleme zincirini (iyileştirme + efekt) kurar; değişmediyse dokunmaz. */
  private zincir(el: HTMLMediaElement, k: MontajKlip) {
    const d = this.dugum.get(el); const c = this.ctx;
    if (!d || !c) return;
    const anahtar = `${k.sesIyilestir ? 1 : 0}|${k.sesEfekt ?? "yok"}`;
    if (d.anahtar === anahtar) return;
    d.anahtar = anahtar;
    d.kaynak.disconnect(); d.ara.forEach((n) => n.disconnect()); d.ara = [];
    const dizi: AudioNode[] = [];
    const bq = (tip: BiquadFilterType, fr: number, q = 0.7, kaz = 0) => { const b = c.createBiquadFilter(); b.type = tip; b.frequency.value = fr; b.Q.value = q; b.gain.value = kaz; return b; };
    if (k.sesIyilestir) {
      // Uğultu/rüzgâr kesme + çamur azaltma + konuşma netliği + seviye dengeleme
      const kmp = c.createDynamicsCompressor(); kmp.threshold.value = -26; kmp.ratio.value = 3.5; kmp.attack.value = 0.004; kmp.release.value = 0.18; kmp.knee.value = 8;
      const telafi = c.createGain(); telafi.gain.value = 1.35;
      dizi.push(bq("highpass", 85), bq("peaking", 300, 1, -3), bq("peaking", 3200, 0.9, 4), bq("highshelf", 9000, 0.7, -2), kmp, telafi);
    }
    const ef = k.sesEfekt ?? "yok";
    if (ef === "radyo") { const ws = c.createWaveShaper(); const e = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 512) - 1; e[i] = Math.tanh(x * 2.2); } ws.curve = e; dizi.push(bq("highpass", 450), bq("lowpass", 3800), bq("peaking", 1500, 1, 5), ws); }
    if (ef === "telefon") dizi.push(bq("highpass", 320, 1), bq("lowpass", 3300, 1), bq("peaking", 1800, 2, 6));
    if (ef === "bas") dizi.push(bq("lowshelf", 110, 0.7, 9), bq("peaking", 60, 1.2, 3));
    // Zinciri bağla
    let son: AudioNode = d.kaynak;
    for (const n of dizi) { son.connect(n); son = n; }
    if (ef === "yanki" || ef === "salon") {
      // Kuru + ıslak (gecikme geri beslemesi) paralel
      const gec = c.createDelay(1.5); gec.delayTime.value = ef === "yanki" ? 0.32 : 0.07;
      const geri = c.createGain(); geri.gain.value = ef === "yanki" ? 0.38 : 0.62;
      const islak = c.createGain(); islak.gain.value = ef === "yanki" ? 0.42 : 0.35;
      const yumus = bq("lowpass", ef === "yanki" ? 4200 : 2600);
      son.connect(gec); gec.connect(yumus); yumus.connect(geri); geri.connect(gec); yumus.connect(islak); islak.connect(d.kazanc);
      dizi.push(gec, geri, islak, yumus);
    }
    son.connect(d.kazanc);
    d.ara = dizi;
  }

  private kazanc(el: HTMLMediaElement, v: number) {
    const d = this.dugum.get(el);
    if (d) d.kazanc.gain.value = v; else el.volume = Math.max(0, Math.min(1, v));
  }

  gorselAl(url: string): HTMLImageElement {
    let img = this.gorsel.get(url);
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.onload = () => this.onHazir?.();
      img.src = url;
      this.gorsel.set(url, img);
    }
    return img;
  }

  videoAl(k: MontajKlip): HTMLVideoElement | null {
    const src = videoKaynak(k);
    if (!src) return null;
    let v = this.video.get(k.id);
    if (v && v.dataset.src !== src) { v.pause(); this.video.delete(k.id); v = undefined; }
    if (!v) {
      v = document.createElement("video");
      v.dataset.src = src;
      v.src = src; v.preload = "auto"; v.playsInline = true; v.crossOrigin = "anonymous";
      v.onseeked = () => this.onHazir?.();
      v.onloadeddata = () => this.onHazir?.();
      this.video.set(k.id, v);
      if (this.ctx) this.bagla(v);
    }
    return v;
  }

  private sesAl(k: MontajKlip): HTMLAudioElement | null {
    if (!k.sesUrl) return null;
    let a = this.ses.get(k.id);
    if (a && a.dataset.src !== k.sesUrl) { a.pause(); this.ses.delete(k.id); a = undefined; }
    if (!a) {
      a = new Audio(); a.dataset.src = k.sesUrl; a.src = k.sesUrl; a.preload = "auto"; a.crossOrigin = "anonymous";
      this.ses.set(k.id, a);
      if (this.ctx) this.bagla(a);
    }
    return a;
  }

  /** Tüm öğeleri playhead'e hizalar: aktif olanı doğru kaynak anında oynatır/sarar, diğerlerini durdurur. */
  senkronla(p: MontajProje, t: number, oynuyor: boolean) {
    if (this.ctx) { for (const el of [...this.video.values(), ...this.ses.values()]) this.bagla(el); }
    const kullanilan = new Set<string>();
    for (const kat of p.katmanlar) {
      for (const k of kat.klipler) {
        const el: HTMLMediaElement | null = k.tur === "video" ? this.videoAl(k) : k.tur === "ses" ? this.sesAl(k) : null;
        if (!el) continue;
        kullanilan.add(k.id);
        const gorunen = klipSure(k);
        const yerel = t - k.baslangic;
        const aktif = yerel >= 0 && yerel < gorunen;
        const sessiz = !katmanDuyulur(p, kat);
        if (!aktif) {
          if (!el.paused) el.pause();
          // Yakında başlayacak klibi önceden başına sar (geçişte siyah kare olmasın).
          if (yerel < 0 && yerel > -1.5 && Math.abs(el.currentTime - k.basKirp) > 0.05 && el.readyState >= 1) el.currentTime = k.basKirp;
          continue;
        }
        const hedef = k.basKirp + yerel * Math.max(0.25, k.hiz);
        const kis = p.kisma && kat.rol === "muzik" && konusmaVar(p, t) ? 0.22 : 1;
        const duzey = sessiz ? 0 : (k.sesDuzey / 100) * sesZarf(k, yerel) * ((kat.duzey ?? 100) / 100) * kis;
        this.kazanc(el, duzey);
        this.zincir(el, k);
        if (oynuyor) {
          el.playbackRate = Math.max(0.25, Math.min(4, anlikHiz(k, yerel)));
          if (Math.abs(el.currentTime - hedef) > 0.25) el.currentTime = hedef;
          if (el.paused) void el.play().catch(() => {});
        } else {
          if (!el.paused) el.pause();
          if (Math.abs(el.currentTime - hedef) > 0.03 && el.readyState >= 1) el.currentTime = hedef;
        }
      }
    }
    for (const [id, v] of this.video) if (!kullanilan.has(id)) { v.pause(); v.removeAttribute("src"); v.load(); this.video.delete(id); }
    for (const [id, a] of this.ses) if (!kullanilan.has(id)) { a.pause(); this.ses.delete(id); }
  }

  /** Dışa aktarma öncesi: tüm medya ilk karesini yükleyene dek bekler. */
  async hazirla(p: MontajProje, zamanAsimi = 15000) {
    const isler: Promise<void>[] = [];
    for (const kat of p.katmanlar) for (const k of kat.klipler) {
      if (k.tur === "video") {
        const v = this.videoAl(k);
        if (v && v.readyState < 2) isler.push(new Promise((ok) => { v.addEventListener("loadeddata", () => ok(), { once: true }); v.addEventListener("error", () => ok(), { once: true }); }));
      }
      const g = gorselKaynak(k.gorselUrl);
      if (g && (k.tur === "gorsel" || k.oge?.tip === "logo" || (k.tur === "video" && !videoKaynak(k)))) {
        const img = this.gorselAl(g);
        if (!img.complete) isler.push(new Promise((ok) => { img.addEventListener("load", () => ok(), { once: true }); img.addEventListener("error", () => ok(), { once: true }); }));
      }
    }
    await Promise.race([Promise.all(isler), new Promise((ok) => setTimeout(ok, zamanAsimi))]);
  }

  durdur() { for (const el of [...this.video.values(), ...this.ses.values()]) el.pause(); }

  kapat() {
    this.durdur();
    for (const v of this.video.values()) { v.removeAttribute("src"); v.load(); }
    this.video.clear(); this.ses.clear(); this.dugum.clear();
    void this.ctx?.close().catch(() => {});
    this.ctx = null; this.ana = null; this.hedef = null;
  }
}

/* ═══════════════════════ Çizim ═══════════════════════ */

/** Yazı tipi kaydı: fontlar.ts gerçek (next/font) aile adlarını buraya yazar. */
const FONT: Record<string, { aile: string; agirlik?: number }> = {};
export function fontKaydet(m: Record<string, { aile: string; agirlik?: number }>) { Object.assign(FONT, m); }
const VARSAYILAN_FONT: Partial<Record<MetinStil, string>> = { tiktok: "montserrat", sinematik: "inter", alinti: "playfair", etiket: "inter", neon: "poppins" };

const STIL: Record<MetinStil, { agirlik: number; buyukHarf?: boolean; aralik?: number; italik?: boolean; golge?: boolean; font: string }> = {
  karaoke: { agirlik: 800, font: "Inter, system-ui, sans-serif" },
  tiktok: { agirlik: 900, buyukHarf: true, font: "Inter, system-ui, sans-serif" },
  neon: { agirlik: 700, font: "Inter, system-ui, sans-serif" },
  baslik: { agirlik: 800, font: "Inter, system-ui, sans-serif", golge: true },
  altbaslik: { agirlik: 500, font: "Inter, system-ui, sans-serif", golge: true },
  altyazi: { agirlik: 700, font: "Inter, system-ui, sans-serif" },
  etiket: { agirlik: 700, buyukHarf: true, aralik: 0.08, font: "Inter, system-ui, sans-serif" },
  alinti: { agirlik: 500, italik: true, font: "Georgia, 'Times New Roman', serif", golge: true },
  sinematik: { agirlik: 300, buyukHarf: true, aralik: 0.32, font: "Inter, system-ui, sans-serif", golge: true },
};

let gren: HTMLCanvasElement | null = null;
function grenDoku(): HTMLCanvasElement {
  if (gren) return gren;
  gren = document.createElement("canvas"); gren.width = gren.height = 128;
  const c = gren.getContext("2d")!; const d = c.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 40; }
  c.putImageData(d, 0, 0);
  return gren;
}

/** Kaynağı hedef alana "cover" sığdırır (sx/sy: kırpma başlangıcı). */
function coverCiz(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, W: number, H: number, sx = 0, sy = 0) {
  if (!sw || !sh) return;
  const o = Math.max(W / sw, H / sh);
  const w = sw * o, h = sh * o;
  ctx.drawImage(src, sx, sy, sw, sh, (W - w) / 2, (H - h) / 2, w, h);
}

function satirlaraBol(ctx: CanvasRenderingContext2D, metin: string, enGenis: number): string[] {
  const satirlar: string[] = [];
  for (const paragraf of metin.split("\n")) {
    let s = "";
    for (const kelime of paragraf.split(/\s+/)) {
      const deneme = s ? `${s} ${kelime}` : kelime;
      if (ctx.measureText(deneme).width > enGenis && s) { satirlar.push(s); s = kelime; } else s = deneme;
    }
    satirlar.push(s);
  }
  return satirlar;
}

const VURGU = "#22d3ee";

/** Yazı bloğunun ölçüsü ve çizim yerleşimi (çizim ve seçim kutusu aynı hesabı kullanır). */
function yaziYerlesim(ctx: CanvasRenderingContext2D, k: MontajKlip, W: number, H: number) {
  const stil = STIL[k.metinStil ?? "altyazi"];
  const olcek = Math.min(W, H) / 1080;
  const boyut = Math.max(8, (k.metinBoyut ?? 42) * olcek);
  const fnt = FONT[k.metinFont ?? VARSAYILAN_FONT[k.metinStil ?? "altyazi"] ?? "inter"];
  const aile = fnt ? `${fnt.aile}, ${stil.font}` : stil.font;
  ctx.font = `${stil.italik ? "italic " : ""}${fnt?.agirlik ?? stil.agirlik} ${boyut}px ${aile}`;
  const aralik = k.metinAralik !== undefined ? k.metinAralik / 100 : stil.aralik ?? 0;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = aralik ? `${aralik * boyut}px` : "0px";
  const ham = stil.buyukHarf ? (k.metin ?? "").toLocaleUpperCase("tr") : (k.metin ?? "");
  const satirlar = satirlaraBol(ctx, ham, W * 0.84);
  const satirH = boyut * (k.metinSatir ?? 1.22);
  const blokH = satirlar.length * satirH;
  const genis = Math.max(...satirlar.map((x) => ctx.measureText(x).width), 1);
  const hiza = k.metinHiza ?? "orta";
  const konum = k.metinKonum ?? "alt";
  const yUst = konum === "ust" ? H * 0.1 : konum === "orta" ? H / 2 - blokH / 2 : H * 0.9 - blokH;
  const x = hiza === "sol" ? W * 0.08 : hiza === "sag" ? W * 0.92 : W / 2;
  const merkezX = hiza === "sol" ? x + genis / 2 : hiza === "sag" ? x - genis / 2 : x;
  return { stil, boyut, satirlar, satirH, blokH, genis, hiza, x, yUst, merkezX, merkezY: yUst + blokH / 2 };
}

function yaziCiz(ctx: CanvasRenderingContext2D, k: MontajKlip, yerel: number, W: number, H: number, sabit = false) {
  if (!k.metin) return;
  const gorunen = klipSure(k);
  const anim = sabit ? "yok" : k.metinAnim ?? "fade";
  const cikis = sabit ? "yok" : k.metinCikis ?? "fade";
  const g = Math.max(0, Math.min(1, yerel / 0.45));
  const kolay = 1 - Math.pow(1 - g, 3);
  const c = cikis === "yok" ? 1 : Math.max(0, Math.min(1, (gorunen - yerel) / 0.35));
  const cKolay = 1 - Math.pow(1 - c, 3);
  const d = klipDonusum(k, yerel);
  ctx.save();
  const L = yaziYerlesim(ctx, k, W, H);
  const { stil, boyut, satirH, hiza, x } = L;
  let satirlar = L.satirlar;
  if (anim === "daktilo") {
    let kalan = Math.max(0, Math.floor(yerel / 0.045));
    satirlar = satirlar.map((s) => { const p = s.slice(0, kalan); kalan = Math.max(0, kalan - s.length - 1); return p; });
  }
  const alfa = (d.opaklik / 100) * (anim === "fade" || anim === "yukari" || anim === "pop" ? kolay : 1) * (cikis === "fade" || cikis === "asagi" || cikis === "kucul" ? cKolay : 1);
  if (alfa <= 0.001) { ctx.restore(); return; }
  ctx.globalAlpha = alfa;
  ctx.textAlign = hiza === "sol" ? "left" : hiza === "sag" ? "right" : "center";
  ctx.textBaseline = "middle";
  let y = L.yUst + satirH / 2;
  if (anim === "yukari") y += (1 - kolay) * boyut * 0.8;
  if (cikis === "asagi") y += (1 - cKolay) * boyut * 0.8;
  // Serbest dönüşüm (tuvalden taşıma/ölçek/döndürme) — blok merkezi etrafında
  const mx = L.merkezX, my = L.merkezY;
  ctx.translate((d.x / 100) * W + mx, (d.y / 100) * H + my);
  ctx.rotate((d.donme * Math.PI) / 180);
  let sk = d.olcek / 100;
  if (anim === "pop") sk *= 0.8 + 0.2 * kolay + Math.sin(g * Math.PI) * 0.06;
  if (cikis === "kucul") sk *= 0.7 + 0.3 * cKolay;
  ctx.scale(sk, sk);
  ctx.translate(-mx, -my);
  const arka = k.metinArka ?? k.metinStil === "altyazi";
  // Karaoke: etkin sözcük (kelime zamanları ya da eşit dağılım)
  let etkin = -1;
  const karaoke = k.metinStil === "karaoke";
  if (karaoke) {
    const kel = k.kelimeler;
    const toplamK = satirlar.join(" ").split(/\s+/).filter(Boolean).length;
    if (kel?.length) etkin = kel.findIndex((w) => yerel >= w.b && yerel < w.s + 0.05);
    else etkin = Math.min(toplamK - 1, Math.floor((yerel / Math.max(0.1, gorunen)) * toplamK));
  }
  let sayac = 0;
  satirlar.forEach((s, i) => {
    const sy = y + i * satirH;
    if (!s) return;
    if (arka) {
      const w = ctx.measureText(s).width + boyut * 0.7;
      const bx = hiza === "sol" ? x - boyut * 0.35 : hiza === "sag" ? x - w + boyut * 0.35 : x - w / 2;
      ctx.save(); ctx.globalAlpha = alfa * (k.metinStil === "etiket" ? 1 : 0.62);
      ctx.fillStyle = k.metinKutuRenk ?? (k.metinStil === "etiket" ? (k.metinRenk === "#ffffff" ? VURGU : "#000000") : "#000000");
      if (k.metinKutuRenk) ctx.globalAlpha = alfa * 0.92;
      ctx.beginPath(); ctx.roundRect(bx, sy - satirH / 2 + boyut * 0.04, w, satirH - boyut * 0.08, boyut * 0.22); ctx.fill(); ctx.restore();
    }
    if (karaoke || k.metinStil === "tiktok") {
      // Sözcük sözcük çizim (vurgu ve kontur)
      const kelimeler = s.split(" ");
      // Konturlu sözcüklerde boşluk kontur kalınlığı kadar açılır (yoksa sözcükler yapışık görünür)
      const bosluk = ctx.measureText(" ").width + boyut * 0.14;
      const genis = kelimeler.reduce((t, k) => t + ctx.measureText(k).width, 0) + bosluk * Math.max(0, kelimeler.length - 1);
      let cx = hiza === "sol" ? x : hiza === "sag" ? x - genis : x - genis / 2;
      ctx.save(); ctx.textAlign = "left";
      for (const kel of kelimeler) {
        const w = ctx.measureText(kel).width;
        const aktif = karaoke && sayac === etkin;
        if (k.metinStil === "tiktok" || karaoke) { ctx.lineJoin = "round"; ctx.lineWidth = boyut * (k.metinKontur !== undefined ? k.metinKontur / 100 : 0.16); ctx.strokeStyle = k.metinKonturRenk ?? "rgba(0,0,0,0.85)"; if (ctx.lineWidth > 0) ctx.strokeText(kel, cx, sy); }
        if (aktif) { ctx.fillStyle = k.vurguRenk ?? VURGU; ctx.fillText(kel, cx, sy); }
        else { ctx.fillStyle = karaoke && sayac > etkin ? "rgba(255,255,255,0.92)" : (k.metinRenk ?? "#ffffff"); ctx.fillText(kel, cx, sy); }
        cx += w + bosluk; sayac++;
      }
      ctx.restore();
      return;
    }
    if (k.metinStil === "neon") { ctx.shadowColor = k.metinRenk ?? VURGU; ctx.shadowBlur = boyut * 0.7; ctx.fillStyle = "#ffffff"; ctx.fillText(s, x, sy); ctx.shadowBlur = boyut * 0.3; ctx.fillText(s, x, sy); ctx.shadowColor = "transparent"; return; }
    if ((k.metinGolge ?? stil.golge) && !arka) { ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = boyut * 0.25; ctx.shadowOffsetY = boyut * 0.06; }
    if (k.metinKontur) { ctx.lineJoin = "round"; ctx.lineWidth = (k.metinKontur / 100) * boyut; ctx.strokeStyle = k.metinKonturRenk ?? "#000000"; ctx.strokeText(s, x, sy); ctx.shadowColor = "transparent"; }
    ctx.fillStyle = k.metinStil === "etiket" && arka && k.metinRenk === "#ffffff" && !k.metinKutuRenk ? "#04131a" : k.metinRenk ?? "#ffffff";
    ctx.fillText(s, x, sy);
    ctx.shadowColor = "transparent";
  });
  ctx.restore();
}

/** Öğe yerleşimi (çizim ve seçim kutusu için): merkez + boyut (dönüşümsüz). */
function ogeYerlesim(k: MontajKlip, W: number, H: number): { cx: number; cy: number; w: number; h: number } | null {
  const o = k.oge; if (!o) return null;
  const m = Math.min(W, H);
  if (o.tip === "sekil") {
    if (o.sekil === "cerceve") return null;
    if (o.sekil === "daire") return { cx: W / 2, cy: H / 2, w: m * 0.32, h: m * 0.32 };
    if (o.sekil === "cizgi") return { cx: W / 2, cy: H / 2, w: W * 0.5, h: Math.max(3, m * 0.01) };
    if (o.sekil === "kose") return { cx: W * 0.82, cy: H * 0.12, w: m * 0.26, h: m * 0.09 };
    return { cx: W / 2, cy: H / 2, w: W * 0.42, h: H * 0.24 };
  }
  if (o.tip === "altbant") return { cx: W * 0.08 + m * 0.33, cy: H * 0.8, w: m * 0.66, h: m * 0.15 };
  if (o.tip === "logo") return { cx: W - m * 0.04 - m * 0.08, cy: m * 0.04 + m * 0.08, w: m * 0.16, h: m * 0.16 };
  return null;
}

function ogeCiz(ctx: CanvasRenderingContext2D, k: MontajKlip, yerel: number, W: number, H: number, havuz: MedyaHavuzu, sabit = false) {
  const o = k.oge; if (!o) return;
  const gorunen = klipSure(k);
  const d = klipDonusum(k, yerel);
  const g = sabit ? 1 : Math.max(0, Math.min(1, yerel / 0.4)), c = sabit ? 1 : Math.max(0, Math.min(1, (gorunen - yerel) / 0.35));
  const kol = 1 - Math.pow(1 - g, 3), ckol = 1 - Math.pow(1 - c, 3);
  const m = Math.min(W, H);
  ctx.save();
  ctx.globalAlpha = (d.opaklik / 100) * Math.min(kol, ckol);
  if (o.tip === "ilerleme") {
    const h = Math.max(4, m * 0.012), oran = Math.max(0, Math.min(1, yerel / Math.max(0.1, gorunen)));
    const y = (k.metinKonum ?? "alt") === "ust" ? 0 : H - h;
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(0, y, W, h);
    ctx.fillStyle = o.renk; ctx.fillRect(0, y, W * oran, h);
    ctx.restore(); return;
  }
  if (o.tip === "sekil" && o.sekil === "cerceve") {
    const kal = m * 0.014, p = m * 0.04;
    ctx.strokeStyle = o.renk; ctx.lineWidth = kal;
    ctx.beginPath(); ctx.roundRect(p, p, W - p * 2, H - p * 2, m * 0.02); ctx.stroke();
    ctx.restore(); return;
  }
  const y = ogeYerlesim(k, W, H)!;
  ctx.translate(y.cx + (d.x / 100) * W, y.cy + (d.y / 100) * H);
  ctx.rotate((d.donme * Math.PI) / 180);
  const sk = d.olcek / 100;
  ctx.scale(sk, sk);
  if (o.tip === "altbant") {
    const kay = (1 - kol) * -y.w * 0.6;
    ctx.translate(kay, 0);
    const sol = -y.w / 2, ust = -y.h / 2;
    ctx.fillStyle = o.renk2 ?? "rgba(10,12,15,0.82)";
    ctx.beginPath(); ctx.roundRect(sol, ust, y.w, y.h, m * 0.012); ctx.fill();
    ctx.fillStyle = o.renk; ctx.fillRect(sol, ust, m * 0.012, y.h);
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff"; ctx.font = `800 ${m * 0.05}px Inter, system-ui, sans-serif`;
    ctx.fillText(o.baslik ?? "Ad Soyad", sol + m * 0.04, ust + y.h * 0.36, y.w - m * 0.06);
    ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.font = `500 ${m * 0.03}px Inter, system-ui, sans-serif`;
    ctx.fillText(o.alt ?? "Unvan", sol + m * 0.04, ust + y.h * 0.72, y.w - m * 0.06);
  } else if (o.tip === "logo") {
    const u = gorselKaynak(k.gorselUrl);
    const img = u ? havuz.gorselAl(u) : null;
    if (img?.complete && img.naturalWidth) {
      const o2 = Math.min(y.w / img.naturalWidth, y.h / img.naturalHeight);
      ctx.drawImage(img, (-img.naturalWidth * o2) / 2, (-img.naturalHeight * o2) / 2, img.naturalWidth * o2, img.naturalHeight * o2);
    }
  } else {
    ctx.fillStyle = o.renk;
    const r = ((o.koseler ?? 12) / 100) * Math.min(y.w, y.h);
    ctx.beginPath();
    if (o.sekil === "daire") ctx.ellipse(0, 0, y.w / 2, y.h / 2, 0, 0, Math.PI * 2);
    else ctx.roundRect(-y.w / 2, -y.h / 2, y.w, y.h, o.sekil === "cizgi" ? y.h / 2 : r);
    ctx.fill();
    if (o.sekil === "kose" && o.baslik) { ctx.fillStyle = o.renk2 ?? "#04131a"; ctx.font = `800 ${y.h * 0.42}px Inter, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(o.baslik.toLocaleUpperCase("tr"), 0, 0, y.w * 0.9); }
  }
  ctx.restore();
}

/** Kaynağı hedef alana "contain" sığdırır. */
function sigdirCiz(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number, W: number, H: number, sx = 0, sy = 0) {
  if (!sw || !sh) return;
  const o = Math.min(W / sw, H / sh);
  const w = sw * o, h = sh * o;
  ctx.drawImage(src, sx, sy, sw, sh, (W - w) / 2, (H - h) / 2, w, h);
}

type Kaynak = { kaynak: CanvasImageSource | null; sx: number; sy: number; sw: number; sh: number };

function hamKaynak(k: MontajKlip, havuz: MedyaHavuzu): { kaynak: CanvasImageSource | null; sw: number; sh: number } {
  const v = k.tur === "video" ? havuz.videoAl(k) : null;
  if (v && v.readyState >= 2) return { kaynak: v, sw: v.videoWidth, sh: v.videoHeight };
  const u = gorselKaynak(k.gorselUrl);
  if (u) { const img = havuz.gorselAl(u); if (img.complete && img.naturalWidth) return { kaynak: img, sw: img.naturalWidth, sh: img.naturalHeight }; }
  return { kaynak: null, sw: 0, sh: 0 };
}

/** Kırpma (kaynak dikdörtgeni) + renk anahtarı uygulanmış kaynak. */
function kaynakAl(k: MontajKlip, havuz: MedyaHavuzu): Kaynak {
  const h = hamKaynak(k, havuz);
  if (!h.kaynak) return { kaynak: null, sx: 0, sy: 0, sw: 0, sh: 0 };
  const kp = k.kirp;
  const sx = kp ? (kp.l / 100) * h.sw : 0, sy = kp ? (kp.t / 100) * h.sh : 0;
  const sw = Math.max(2, h.sw - sx - (kp ? (kp.r / 100) * h.sw : 0)), sh = Math.max(2, h.sh - sy - (kp ? (kp.b / 100) * h.sh : 0));
  if (!k.krom) return { kaynak: h.kaynak, sx, sy, sw, sh };
  return { kaynak: kromUygula(k.id, h.kaynak, sx, sy, sw, sh, k.krom), sx: 0, sy: 0, sw: Math.round(sw * kromOlcek(sw, sh)), sh: Math.round(sh * kromOlcek(sw, sh)) };
}

const kromTuval = new Map<string, HTMLCanvasElement>();
const kromOlcek = (sw: number, sh: number) => Math.min(1, 960 / Math.max(sw, sh));
function hexRgb(h: string): [number, number, number] { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
/**
 * Renk anahtarı (chroma key): seçilen rengin krominansına yakın pikselleri saydamlaştırır,
 * kenarlarda yumuşak geçiş ve renk taşmasını (spill) bastırma uygular. En fazla 960 px işlenir.
 */
function kromUygula(id: string, src: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, kr: { renk: string; esik: number; yumusak: number }): HTMLCanvasElement {
  const o = kromOlcek(sw, sh);
  const w = Math.max(2, Math.round(sw * o)), hh = Math.max(2, Math.round(sh * o));
  let c = kromTuval.get(id);
  if (!c) { c = document.createElement("canvas"); kromTuval.set(id, c); }
  if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.clearRect(0, 0, w, hh);
  x.drawImage(src, sx, sy, sw, sh, 0, 0, w, hh);
  const img = x.getImageData(0, 0, w, hh); const d = img.data;
  const [R, G, B] = hexRgb(kr.renk);
  const cb0 = -0.168736 * R - 0.331264 * G + 0.5 * B, cr0 = 0.5 * R - 0.418688 * G - 0.081312 * B;
  const esik = (kr.esik / 100) * 120, yum = Math.max(1, (kr.yumusak / 100) * 90);
  const yesil = G >= R && G >= B, mavi = B > R && B > G;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const cb = -0.168736 * r - 0.331264 * g + 0.5 * b, cr = 0.5 * r - 0.418688 * g - 0.081312 * b;
    const mesafe = Math.hypot(cb - cb0, cr - cr0);
    if (mesafe < esik) { d[i + 3] = 0; continue; }
    if (mesafe < esik + yum) {
      const a = (mesafe - esik) / yum;
      d[i + 3] = d[i + 3] * a;
      if (yesil) d[i + 1] = Math.min(g, Math.max(r, b));
      else if (mavi) d[i + 2] = Math.min(b, Math.max(r, g));
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

/** Maske yolunu (merkez 0,0; w×h kutusu) çizer. */
function maskeYolu(ctx: CanvasRenderingContext2D, m: MontajKlip["maske"], w: number, h: number) {
  ctx.beginPath();
  const r = Math.min(w, h) / 2;
  if (m === "daire") ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  else if (m === "yuvarlak") ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.12);
  else if (m === "elmas") { ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); }
  else if (m === "serit") ctx.rect(-w / 2, -h * 0.29, w, h * 0.58);
  else if (m === "kalp") {
    const s = r * 1.05; ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(-s * 1.25, -s * 0.05, -s * 0.6, -s * 1.05, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.6, -s * 1.05, s * 1.25, -s * 0.05, 0, s * 0.85); ctx.closePath();
  } else if (m === "yildiz") {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath();
  } else ctx.rect(-w / 2, -h / 2, w, h);
}

function klipCiz(ctx: CanvasRenderingContext2D, k: MontajKlip, t: number, W: number, H: number, havuz: MedyaHavuzu, sabit = false) {
  const yerel = t - k.baslangic;
  const gorunen = klipSure(k);
  const gecisVar = !sabit && k.gecis !== "yok" && k.gecis !== "kesme";
  const g = gecisVar && yerel < k.gecisSure ? Math.max(0, Math.min(1, yerel / Math.max(0.05, k.gecisSure))) : 1;
  const d = klipDonusum(k, yerel);
  const zoomEf = k.efektler.includes("yakinlas") ? 1 + (yerel / Math.max(0.1, gorunen)) * 0.12 : 1;
  const sars = k.efektler.includes("sarsinti") ? { x: Math.sin(t * 47) * 0.006 * W, y: Math.cos(t * 61) * 0.006 * H } : { x: 0, y: 0 };
  const { kaynak, sx, sy, sw, sh } = kaynakAl(k, havuz);
  const mod = k.sigdir ?? "doldur";
  const cikis = k.cikisSure && !sabit ? Math.max(0, Math.min(1, (gorunen - yerel) / k.cikisSure)) : 1;
  ctx.save();
  let alfa = (d.opaklik / 100) * cikis;
  if (k.gecis === "fade" || k.gecis === "yakinlas") alfa *= 0.15 + g * 0.85;
  if (k.gecis === "bulanik") alfa *= 0.4 + g * 0.6;
  ctx.globalAlpha = Math.max(0, Math.min(1, alfa));
  const filtre = [tamFilter(k) === "none" ? "" : tamFilter(k), k.gecis === "bulanik" && g < 1 ? `blur(${((1 - g) * 14 * W) / 1280}px)` : ""].filter(Boolean).join(" ");
  // Bulanık arka plan: kaynağın büyütülmüş, bulanık ve koyulaştırılmış hali tüm kareyi doldurur
  if (mod === "bulanik" && kaynak) {
    ctx.save(); ctx.filter = `blur(${Math.round(W / 40)}px) brightness(0.55) ${filtre}`.trim();
    coverCiz(ctx, kaynak, sw, sh, W, H, sx, sy); ctx.restore();
  }
  ctx.filter = filtre || "none";
  const olcek = (d.olcek / 100) * zoomEf * (k.gecis === "yakinlas" ? 1 + (1 - g) * 0.25 : 1);
  const kaydir = k.gecis === "kaydir" ? (1 - g) * W : 0;
  ctx.translate(W / 2 + (d.x / 100) * W + sars.x + kaydir, H / 2 + (d.y / 100) * H + sars.y);
  ctx.rotate((d.donme * Math.PI) / 180);
  ctx.scale(olcek, olcek);
  if (k.karisim && k.karisim !== "normal") ctx.globalCompositeOperation = k.karisim;
  if (k.maske && k.maske !== "yok") {
    // Maske kutusu: doldurda kare boyutu, sığdırda görüntü dikdörtgeni
    let mw = W, mh = H;
    if (mod !== "doldur" && sw && sh) { const o = Math.min(W / sw, H / sh); mw = sw * o; mh = sh * o; }
    if (k.maskeYumusak) { ctx.shadowColor = "transparent"; }
    maskeYolu(ctx, k.maske, mw, mh);
    ctx.clip();
  }
  ctx.scale(k.aynaX ? -1 : 1, k.aynaY ? -1 : 1);
  ctx.translate(-W / 2, -H / 2);
  if (kaynak) (mod === "doldur" ? coverCiz : sigdirCiz)(ctx, kaynak, sw, sh, W, H, sx, sy);
  else { ctx.fillStyle = "#16181b"; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  if (k.efektler.includes("vinyet")) {
    const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  if (k.efektler.includes("grenli")) {
    ctx.save(); ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = "overlay";
    const pat = ctx.createPattern(grenDoku(), "repeat");
    if (pat) { ctx.translate((t * 997) % 128, (t * 613) % 128); ctx.fillStyle = pat; ctx.fillRect(-128, -128, W + 256, H + 256); }
    ctx.restore();
  }
  if (k.gecis === "beyazparla" && g < 1) { ctx.save(); ctx.globalAlpha = 1 - g; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

/** Seçim kutusu: klibin o andaki ekran kutusu (canvas pikseli). Tuvalde taşıma/ölçek/döndürme için. */
export function klipKutusu(k: MontajKlip, t: number, W: number, H: number, havuz: MedyaHavuzu): { cx: number; cy: number; w: number; h: number; donme: number } | null {
  const yerel = Math.max(0, Math.min(klipSure(k) - 0.001, t - k.baslangic));
  const d = klipDonusum(k, yerel);
  const sk = d.olcek / 100;
  if (k.tur === "metin" && k.oge) {
    const y = ogeYerlesim(k, W, H); if (!y) return null;
    return { cx: y.cx + (d.x / 100) * W, cy: y.cy + (d.y / 100) * H, w: y.w * sk, h: y.h * sk, donme: d.donme };
  }
  if (k.tur === "metin") {
    if (!k.metin) return null;
    const c = document.createElement("canvas").getContext("2d")!;
    const L = yaziYerlesim(c, k, W, H);
    const pay = L.boyut * 0.3;
    return { cx: L.merkezX + (d.x / 100) * W, cy: L.merkezY + (d.y / 100) * H, w: (L.genis + pay * 2) * sk, h: (L.blokH + pay) * sk, donme: d.donme };
  }
  if (k.tur === "ses") return null;
  let w = W, h = H;
  if ((k.sigdir ?? "doldur") !== "doldur") {
    const { sw, sh } = kaynakAl(k, havuz);
    if (sw && sh) { const o = Math.min(W / sw, H / sh); w = sw * o; h = sh * o; }
  }
  if (k.maske === "daire" || k.maske === "elmas" || k.maske === "kalp" || k.maske === "yildiz") { const m = Math.min(w, h); w = m; h = m; }
  else if (k.maske === "serit") h = h * 0.58;
  return { cx: W / 2 + (d.x / 100) * W, cy: H / 2 + (d.y / 100) * H, w: w * sk, h: h * sk, donme: d.donme };
}

/**
 * Verilen anı canvas'a çizer. Katman sırası: dizideki ilk katman en üstte.
 * `sabitId`: duraklatılmış önizlemede seçili klip giriş/çıkış animasyonu olmadan, tam görünür çizilir (düzenlenebilsin diye).
 */
export function kareCiz(ctx: CanvasRenderingContext2D, p: MontajProje, t: number, W: number, H: number, havuz: MedyaHavuzu, sabitId?: string | null) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = "none";
  ctx.fillStyle = p.arkaRenk ?? "#000000";
  ctx.fillRect(0, 0, W, H);
  const gorunur = (kat: MontajKatman) => !kat.gizli;
  const videolar = p.katmanlar.filter((k) => k.tur === "video" && gorunur(k));
  for (const kat of [...videolar].reverse()) {
    for (const k of kat.klipler) {
      if (t >= k.baslangic && t < k.baslangic + klipSure(k)) klipCiz(ctx, k, t, W, H, havuz, k.id === sabitId);
    }
  }
  for (const kat of [...p.katmanlar.filter((k) => k.tur === "metin" && gorunur(k))].reverse()) {
    for (const k of kat.klipler) {
      if (t >= k.baslangic && t < k.baslangic + klipSure(k)) (k.oge ? ogeCiz(ctx, k, t - k.baslangic, W, H, havuz, k.id === sabitId) : yaziCiz(ctx, k, t - k.baslangic, W, H, k.id === sabitId));
    }
  }
  ctx.restore();
}

/* ═══════════════════════ Dışa aktarma ═══════════════════════ */

export function kayitBicimi(): { mime: string; uzanti: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const adaylar: [string, "mp4" | "webm"][] = [
    ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "mp4"], ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9,opus", "webm"], ["video/webm;codecs=vp8,opus", "webm"], ["video/webm", "webm"],
  ];
  for (const [m, u] of adaylar) if (MediaRecorder.isTypeSupported(m)) return { mime: m, uzanti: u };
  return null;
}

export type DisaAktarDurum = { asama: "hazirlaniyor" | "kayit" | "bitti"; ilerleme: number };

/** Yalnız ses kaydı için desteklenen biçim. */
export function sesKayitBicimi(): { mime: string; uzanti: "m4a" | "webm" | "ogg" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const [mime, uzanti] of [["audio/mp4;codecs=mp4a.40.2", "m4a"], ["audio/mp4", "m4a"], ["audio/webm;codecs=opus", "webm"], ["audio/ogg;codecs=opus", "ogg"]] as const)
    if (MediaRecorder.isTypeSupported(mime)) return { mime, uzanti };
  return null;
}

/** Bir anı çevrimdışı çizer: tüm aktif videolar o kareye sarılana dek bekler. */
async function kareHazirla(havuz: MedyaHavuzu, p: MontajProje, t: number) {
  havuz.senkronla(p, t, false);
  await Promise.all([...havuz.video.values()].map((v) => (v.seeking ? new Promise<void>((ok) => { v.addEventListener("seeked", () => ok(), { once: true }); setTimeout(ok, 2500); }) : Promise.resolve())));
}

/**
 * GIF: aralığı kare kare (gerçek zamandan bağımsız) çizip 256 renge indirger. Sessizdir.
 * Uzun aralıklar dosyayı şişirir; 20 sn ile sınırlıdır.
 */
export async function gifAl(p: MontajProje, ayar: { W: number; H: number; fps: number; bas: number; son: number }, onDurum: (d: DisaAktarDurum) => void, iptal: AbortSignal): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const sure = Math.min(20, ayar.son - ayar.bas);
  if (sure <= 0) throw new Error("Montaj boş.");
  const havuz = new MedyaHavuzu(false);
  onDurum({ asama: "hazirlaniyor", ilerleme: 0 });
  havuz.senkronla(p, ayar.bas, false);
  await havuz.hazirla(p);
  const tuval = document.createElement("canvas"); tuval.width = ayar.W; tuval.height = ayar.H;
  const ctx = tuval.getContext("2d", { alpha: false, willReadFrequently: true })!;
  const gif = GIFEncoder();
  const n = Math.max(1, Math.round(sure * ayar.fps)), gecikme = Math.round(1000 / ayar.fps);
  try {
    for (let i = 0; i < n; i++) {
      if (iptal.aborted) throw new DOMException("İptal", "AbortError");
      const t = ayar.bas + i / ayar.fps;
      await kareHazirla(havuz, p, t);
      kareCiz(ctx, p, t, ayar.W, ayar.H, havuz);
      const { data } = ctx.getImageData(0, 0, ayar.W, ayar.H);
      const palet = quantize(data, 256, { format: "rgb444" });
      gif.writeFrame(applyPalette(data, palet, "rgb444"), ayar.W, ayar.H, { palette: palet, delay: gecikme, repeat: 0 });
      onDurum({ asama: "kayit", ilerleme: (i + 1) / n });
      if (i % 4 === 3) await new Promise((ok) => setTimeout(ok, 0)); // arayüz nefes alsın
    }
  } finally { havuz.kapat(); }
  gif.finish();
  onDurum({ asama: "bitti", ilerleme: 1 });
  return new Blob([gif.bytes().slice()], { type: "image/gif" });
}

/** Tek kare: `t` anını tam çözünürlükte PNG olarak çizer (videolar o kareye sarılır). */
export async function kareAl(p: MontajProje, t: number, W: number, H: number): Promise<Blob> {
  const havuz = new MedyaHavuzu(false);
  havuz.senkronla(p, t, false);
  await havuz.hazirla(p);
  await kareHazirla(havuz, p, t);
  const tuval = document.createElement("canvas");
  tuval.width = W; tuval.height = H;
  kareCiz(tuval.getContext("2d", { alpha: false })!, p, t, W, H, havuz);
  havuz.kapat();
  return new Promise((ok, red) => tuval.toBlob((b) => (b ? ok(b) : red(new Error("Kare oluşturulamadı"))), "image/png"));
}

/**
 * Zaman çizelgesini (ya da bir aralığını) gerçek zamanlı oynatıp kaydeder; süre aralık kadar sürer.
 * Sekme arka plana alınırsa tarayıcı kareleri yavaşlatır; bu yüzden kullanıcıdan sekmeyi açık tutması istenir.
 */
export async function disaAktar(p: MontajProje, ayar: { W: number; H: number; fps: number; bitHizi: number; bas?: number; son?: number; sadeceSes?: boolean },
  onDurum: (d: DisaAktarDurum) => void, iptal: AbortSignal): Promise<{ blob: Blob; uzanti: string; kapak: string }> {
  const bicim = ayar.sadeceSes ? sesKayitBicimi() : kayitBicimi();
  if (!bicim) throw new Error("Tarayıcın kaydı desteklemiyor (MediaRecorder yok). Chrome ya da Edge ile dene.");
  const bas0 = Math.max(0, ayar.bas ?? 0);
  const son = Math.min(montajToplamSure(p), ayar.son ?? Infinity);
  const toplam = son - bas0;
  if (toplam <= 0) throw new Error("Montaj boş.");
  const tuval = document.createElement("canvas");
  tuval.width = ayar.W; tuval.height = ayar.H;
  const ctx = tuval.getContext("2d", { alpha: false })!;
  const havuz = new MedyaHavuzu(false);
  const sesCtx = havuz.sesBaslat();
  onDurum({ asama: "hazirlaniyor", ilerleme: 0 });
  havuz.senkronla(p, bas0, false);
  await havuz.hazirla(p);
  if (iptal.aborted) { havuz.kapat(); throw new DOMException("İptal", "AbortError"); }
  kareCiz(ctx, p, bas0, ayar.W, ayar.H, havuz);
  const kapak = tuval.toDataURL("image/jpeg", 0.82);

  const akis = ayar.sadeceSes ? new MediaStream() : tuval.captureStream(ayar.fps);
  const sesIz = havuz.hedef?.stream.getAudioTracks()[0];
  if (sesIz) akis.addTrack(sesIz);
  // Sessiz montajda bile ses izi olsun (bazı oynatıcılar ses izsiz dosyada süre gösteremiyor).
  if (!sesIz) { const o = sesCtx.createOscillator(); const g = sesCtx.createGain(); g.gain.value = 0; o.connect(g); const d = sesCtx.createMediaStreamDestination(); g.connect(d); o.start(); akis.addTrack(d.stream.getAudioTracks()[0]); }
  const kayit = new MediaRecorder(akis, ayar.sadeceSes ? { mimeType: bicim.mime, audioBitsPerSecond: 256_000 } : { mimeType: bicim.mime, videoBitsPerSecond: ayar.bitHizi, audioBitsPerSecond: 192_000 });
  const parcalar: Blob[] = [];
  kayit.ondataavailable = (e) => { if (e.data.size) parcalar.push(e.data); };
  const bitti = new Promise<void>((ok) => { kayit.onstop = () => ok(); });

  kayit.start(500);
  const bas = performance.now();
  await new Promise<void>((ok) => {
    const adim = () => {
      if (iptal.aborted) return ok();
      const g = Math.min(toplam, (performance.now() - bas) / 1000);
      const t = bas0 + g;
      havuz.senkronla(p, t, true);
      if (!ayar.sadeceSes) kareCiz(ctx, p, t, ayar.W, ayar.H, havuz);
      onDurum({ asama: "kayit", ilerleme: g / toplam });
      if (g >= toplam) return ok();
      setTimeout(adim, 1000 / ayar.fps);
    };
    adim();
  });
  kayit.stop();
  await bitti;
  havuz.kapat();
  akis.getTracks().forEach((x) => x.stop());
  if (iptal.aborted) throw new DOMException("İptal", "AbortError");
  onDurum({ asama: "bitti", ilerleme: 1 });
  return { blob: new Blob(parcalar, { type: bicim.mime.split(";")[0] }), uzanti: bicim.uzanti, kapak };
}

/* ═══════════════════════ Ses çözümleme ═══════════════════════ */

const cozulmus = new Map<string, Promise<AudioBuffer | null>>();
function sesCoz(url: string): Promise<AudioBuffer | null> {
  let p = cozulmus.get(url);
  if (!p) {
    p = (async () => {
      try {
        const r = await fetch(url); if (!r.ok) return null;
        const ctx = new OfflineAudioContext(1, 1, 44100);
        return await ctx.decodeAudioData(await r.arrayBuffer());
      } catch { return null; }
    })();
    cozulmus.set(url, p);
  }
  return p;
}

/** Saniye başına `yogunluk` tepe değeri (0..1). Kaynak süresi boyunca. */
export async function dalgaFormu(url: string, yogunluk = 40): Promise<{ tepeler: Float32Array; sure: number } | null> {
  const b = await sesCoz(url);
  if (!b) return null;
  const veri = b.getChannelData(0);
  const n = Math.max(1, Math.ceil(b.duration * yogunluk));
  const blok = Math.max(1, Math.floor(veri.length / n));
  const tepeler = new Float32Array(n);
  let enYuksek = 0;
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (let j = i * blok; j < Math.min(veri.length, (i + 1) * blok); j += 8) { const v = Math.abs(veri[j]); if (v > m) m = v; }
    tepeler[i] = m; if (m > enYuksek) enYuksek = m;
  }
  if (enYuksek > 0) for (let i = 0; i < n; i++) tepeler[i] = tepeler[i] / enYuksek;
  return { tepeler, sure: b.duration };
}

/** Kaynak içinde sessiz aralıklar (sn). esikDb altındaki ve en az minSure süren bölümler. */
export async function sessizAraliklar(url: string, esikDb = -38, minSure = 0.6): Promise<[number, number][] | null> {
  const b = await sesCoz(url);
  if (!b) return null;
  const veri = b.getChannelData(0);
  const pencere = Math.floor(b.sampleRate * 0.05);
  const esik = Math.pow(10, esikDb / 20);
  const araliklar: [number, number][] = [];
  let bas = -1;
  for (let i = 0; i < veri.length; i += pencere) {
    let top = 0; const son = Math.min(veri.length, i + pencere);
    for (let j = i; j < son; j++) top += veri[j] * veri[j];
    const rms = Math.sqrt(top / Math.max(1, son - i));
    const t = i / b.sampleRate;
    if (rms < esik) { if (bas < 0) bas = t; }
    else if (bas >= 0) { if (t - bas >= minSure) araliklar.push([bas, t]); bas = -1; }
  }
  if (bas >= 0 && b.duration - bas >= minSure) araliklar.push([bas, b.duration]);
  return araliklar;
}

/** Medyanın süresini öğrenir (video/ses). */
export function medyaSuresi(url: string, tur: "video" | "ses"): Promise<number | null> {
  return new Promise((ok) => {
    const el = document.createElement(tur === "video" ? "video" : "audio");
    el.preload = "metadata";
    const bitir = (v: number | null) => { el.removeAttribute("src"); ok(v); };
    el.onloadedmetadata = () => bitir(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => bitir(null);
    setTimeout(() => bitir(null), 12000);
    el.src = url;
  });
}

/** Videonun ilk karesinden kapak (JPEG data URL). */
export function videoKapak(url: string): Promise<string | null> {
  return new Promise((ok) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.crossOrigin = "anonymous";
    const bitti = (s: string | null) => { v.removeAttribute("src"); v.load(); ok(s); };
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 3); };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas"); const o = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight));
        c.width = Math.round(v.videoWidth * o); c.height = Math.round(v.videoHeight * o);
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height); bitti(c.toDataURL("image/jpeg", 0.8));
      } catch { bitti(null); }
    };
    v.onerror = () => bitti(null);
    setTimeout(() => bitti(null), 12000);
    v.src = url;
  });
}

/* ═══════════════════════ Kare şeridi (zaman çizelgesi) ═══════════════════════ */

const seritOnbellek = new Map<string, Promise<{ kareler: string[]; sure: number; oran: number } | null>>();
/** Videodan eşit aralıklı `adet` küçük kare (JPEG data URL) çıkarır; sonuç önbelleğe alınır. */
export function kareSeridi(url: string, adet = 20): Promise<{ kareler: string[]; sure: number; oran: number } | null> {
  let p = seritOnbellek.get(url);
  if (!p) {
    p = new Promise((ok) => {
      const v = document.createElement("video");
      v.muted = true; v.preload = "auto"; v.crossOrigin = "anonymous"; v.playsInline = true;
      const kareler: string[] = [];
      let i = 0, sure = 0;
      const zaman = setTimeout(() => ok(kareler.length ? { kareler, sure, oran: 1.6 } : null), 20000);
      const c = document.createElement("canvas");
      const sonraki = () => {
        if (i >= adet) { clearTimeout(zaman); v.removeAttribute("src"); v.load(); ok({ kareler, sure, oran: c.width / Math.max(1, c.height) }); return; }
        v.currentTime = Math.min(sure - 0.05, (i + 0.5) * (sure / adet));
      };
      v.onloadedmetadata = () => {
        sure = v.duration || 1;
        // Zaman çizelgesi döşemesi: kaynak oranından bağımsız 16:10 karelere ortadan kırpılır
        c.height = 120; c.width = 192;
        sonraki();
      };
      v.onseeked = () => {
        try {
          const kw = v.videoWidth || c.width, kh = v.videoHeight || c.height, hedef = c.width / c.height;
          const [sw, sh] = kw / kh > hedef ? [kh * hedef, kh] : [kw, kw / hedef];
          c.getContext("2d")!.drawImage(v, (kw - sw) / 2, (kh - sh) / 2, sw, sh, 0, 0, c.width, c.height);
          kareler.push(c.toDataURL("image/jpeg", 0.78));
        } catch { /* çapraz köken */ }
        i++; sonraki();
      };
      v.onerror = () => { clearTimeout(zaman); ok(null); };
      v.src = url;
    });
    seritOnbellek.set(url, p);
  }
  return p;
}
