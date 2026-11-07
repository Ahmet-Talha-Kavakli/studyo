"use client";

/**
 * Galeri indirme hattı — tek yer:
 *  · türüne göre gerçek dosya (görsel, video, ses, 3D model)
 *  · plan hakkına bağlı filigran: Başlangıç planında (ya da kullanıcı isterse) indirilen görsele ve
 *    video karesine tarayıcıda canvas ile Vayra işareti basılır. Video dosyasının kendisine filigran
 *    basacak bir sunucu kodlayıcısı yok: video olduğu gibi iner, kare indirmeleri filigranlıdır.
 *  · önce ve sonra şablonu: kaynağı olan üretimlerde (düzenleme, büyütme, çerçeveleme, video başlangıç
 *    karesi) yan yana ya da sürgülü karşılaştırma görseli canvas ile üretilir.
 * Çapraz kökenli görsel canvas'ı kirletirse oturumlu vekil (/api/hesap/galeri?vekil=) denenir.
 */

import { useAuth } from "@/store/useAuth";
import { useAyarTercih } from "@/store/useAyarTercih";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { toast } from "@/lib/toast";
import { filigranKoprusuKur, saltUrl } from "@/lib/utils";

/* ── Hak ve tercih ── */

/** Filigransız indirme hakkı: giriş yapılmış ve plan Başlangıç değil. */
export function filigransizHakki(): boolean {
  const k = useAuth.getState().kullanici;
  return !!k && k.plan !== "baslangic";
}
/** Hakkı olan kullanıcının tercihi (Ayarlar > Gizlilik > Vayra filigranı). */
export function filigranTercihi(): boolean {
  try { return !!useAyarTercih.getState().gizlilik.filigran; } catch { return false; }
}
/** Bu indirmede filigran basılacak mı. */
export function filigranGerekli(): boolean {
  return !filigransizHakki() || filigranTercihi();
}
/** Menüdeki "Filigransız" anahtarı: tercihi Ayarlar ile aynı yere yazar. */
export function filigransizAyarla(filigransiz: boolean) {
  if (!filigransizHakki()) return;
  useAyarTercih.getState().ayarla("gizlilik", { filigran: !filigransiz });
}

/* ── Medya yükleme ── */

const vekilAdresi = (url: string) => `/api/hesap/galeri?vekil=${encodeURIComponent(url)}`;
const ayniKoken = (url: string) => url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/") || (typeof location !== "undefined" && url.startsWith(location.origin));

function resimYukle(src: string, cors: boolean): Promise<HTMLImageElement> {
  return new Promise((coz, red) => {
    const i = new Image();
    if (cors) i.crossOrigin = "anonymous";
    i.decoding = "async";
    i.onload = () => coz(i);
    i.onerror = () => red(new Error("Görsel yüklenemedi"));
    i.src = src;
  });
}

/** Canvas'a çizilebilir (kirletmeyen) görsel. Uzak adreste önce CORS, olmazsa oturumlu vekil. */
export async function gorselAc(url: string): Promise<HTMLImageElement> {
  if (ayniKoken(url)) return resimYukle(url, false);
  try {
    const i = await resimYukle(url, true);
    const c = document.createElement("canvas"); c.width = c.height = 1;
    c.getContext("2d")!.drawImage(i, 0, 0);
    c.toDataURL(); // kirli ise burada fırlatır
    return i;
  } catch {
    const r = await fetch(vekilAdresi(url), { credentials: "same-origin" });
    if (!r.ok) throw new Error(r.status === 401 ? "Bu dosyayı işlemek için giriş yap." : "Dosyaya ulaşılamadı.");
    const b = await r.blob();
    return resimYukle(URL.createObjectURL(b), false);
  }
}

/** Videonun bir karesi (saniye). Kaynak çapraz kökenliyse vekil üzerinden. */
export async function videoKaresi(url: string, sn = 0.1): Promise<HTMLCanvasElement> {
  const dene = (src: string) => new Promise<HTMLCanvasElement>((coz, red) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    if (!ayniKoken(src)) v.crossOrigin = "anonymous";
    const bitir = (e?: Error) => { v.removeAttribute("src"); v.load(); if (e) red(e); };
    v.onloadedmetadata = () => { v.currentTime = Math.min(Math.max(0, sn), Math.max(0, (v.duration || 1) - 0.05)); };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        c.toDataURL();
        coz(c); bitir();
      } catch (e) { bitir(e as Error); }
    };
    v.onerror = () => bitir(new Error("Video açılamadı"));
    v.src = src;
  });
  try { return await dene(url); } catch (e) {
    if (ayniKoken(url)) throw e;
    const r = await fetch(vekilAdresi(url), { credentials: "same-origin" });
    if (!r.ok) throw new Error("Videoya ulaşılamadı.");
    return dene(URL.createObjectURL(await r.blob()));
  }
}

/* ── Filigran ── */

let isaret: Promise<HTMLImageElement | null> | null = null;
const isaretAl = () => (isaret ??= resimYukle("/brand/vayra-mark-beyaz.png", false).catch(() => null));

/** Sağ alt köşeye Vayra işareti ve yazısı (kısa kenarın yüzde 3,2'si kadar yüksek). */
export async function filigranCiz(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const m = await isaretAl();
  const boy = Math.max(14, Math.round(Math.min(w, h) * 0.032));
  const pay = Math.round(boy * 0.9);
  ctx.save();
  ctx.font = `600 ${boy}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = "middle";
  const yazi = "Vayra";
  const yaziEn = ctx.measureText(yazi).width;
  const isaretEn = m ? Math.round(boy * 1.15 * (m.naturalWidth / Math.max(1, m.naturalHeight))) : 0;
  const bosluk = m ? Math.round(boy * 0.4) : 0;
  const x = w - pay - yaziEn - isaretEn - bosluk;
  const y = h - pay - boy * 0.6;
  ctx.globalAlpha = 0.78;
  // Açık zeminde de okunsun: ince koyu kontur (içerik üstünde, arayüz gölgesi değil)
  ctx.lineWidth = Math.max(1.5, boy * 0.09);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.strokeText(yazi, x + isaretEn + bosluk, y);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(yazi, x + isaretEn + bosluk, y);
  if (m) ctx.drawImage(m, x, y - boy * 0.58, isaretEn, boy * 1.15);
  ctx.restore();
}

/* ── Dosya kaydetme ── */

export const dosyaAdi = (ad: string, uzanti: string) =>
  `${(ad || "vayra").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 70) || "vayra"}.${uzanti}`;

function kaydet(href: string, ad: string) {
  const a = document.createElement("a");
  a.href = href; a.download = ad; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
}
const canvasKaydet = (c: HTMLCanvasElement, ad: string, mime: string) => new Promise<void>((coz, red) => {
  c.toBlob((b) => {
    if (!b) return red(new Error("Görsel kodlanamadı"));
    const u = URL.createObjectURL(b);
    kaydet(u, ad);
    setTimeout(() => URL.revokeObjectURL(u), 4000);
    coz();
  }, mime, 0.95);
});

/** Uzak dosyayı adıyla indir (download özniteliği çapraz kökende yok sayılır; blob'a çevrilir). */
export async function dosyaIndir(url: string, ad: string) {
  if (ayniKoken(url)) { kaydet(url, ad); return; }
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) throw new Error();
    const u = URL.createObjectURL(await r.blob());
    kaydet(u, ad); setTimeout(() => URL.revokeObjectURL(u), 4000);
  } catch {
    try {
      const r = await fetch(vekilAdresi(url), { credentials: "same-origin" });
      if (!r.ok) throw new Error();
      const u = URL.createObjectURL(await r.blob());
      kaydet(u, ad); setTimeout(() => URL.revokeObjectURL(u), 4000);
    } catch { kaydet(url, ad); }
  }
}

export type GorselBicim = "png" | "jpg" | "webp";
const MIME: Record<GorselBicim, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Görseli seçilen biçimde, gerekiyorsa filigranla indir. */
export async function gorselIndir(url: string, ad: string, s: { bicim?: GorselBicim; filigran?: boolean } = {}): Promise<boolean> {
  const bicim = s.bicim ?? "png";
  const filigran = s.filigran ?? filigranGerekli();
  if (!filigran && bicim === "png" && /\.png($|\?)|^data:image\/png/.test(url)) { await dosyaIndir(url, dosyaAdi(ad, "png")); return true; }
  try {
    const i = await gorselAc(url);
    const c = document.createElement("canvas");
    c.width = i.naturalWidth || 1024; c.height = i.naturalHeight || 1024;
    const ctx = c.getContext("2d")!;
    if (bicim === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(i, 0, 0);
    if (filigran) await filigranCiz(ctx, c.width, c.height);
    await canvasKaydet(c, dosyaAdi(ad, bicim), MIME[bicim]);
    return true;
  } catch (e) {
    if (!filigran) { await dosyaIndir(url, dosyaAdi(ad, bicim)); return true; }
    toast.error("İndirilemedi", { description: `${e instanceof Error ? e.message : "Görsel işlenemedi"} Filigranlı kopya hazırlanamadı.` });
    return false;
  }
}

/* ── Kaynak (önce) görseli ── */

const gorselMi = (s?: string) => !!s && /^(data:image|https?:|\/|blob:)/.test(s) && !/\.(mp4|webm|mov)(\?|$)/i.test(s);
const videoMu = (s?: string) => !!s && /^(https?:|\/|blob:)/.test(s);

export type Kaynak = { tur: "gorsel"; url: string } | { tur: "video"; url: string };

/** Üretimin "önce" hâli: düzenleme/büyütme/çerçeveleme kaynağı, ya da videonun başlangıç karesi. */
export function kaynakBul(u: Uretim): Kaynak | null {
  const m = u.meta ?? {};
  const kaynakUretim = m.kaynakId ? useProjeler.getState().uretimler.find((x) => x.id === m.kaynakId) : undefined;
  if (u.tur === "gorsel") {
    const g = saltUrl(m.gorselUrl) ?? (m.islem && m.islem !== "uret" ? saltUrl(kaynakUretim?.gorselUrl) : undefined);
    if (gorselMi(g) && g !== saltUrl(u.gorselUrl)) return { tur: "gorsel", url: g! };
    return null;
  }
  if (u.tur === "video") {
    const kv = m.videoUrl && m.videoUrl !== u.videoUrl ? m.videoUrl : undefined; // yeniden çerçeveleme / büyütme kaynağı
    if (videoMu(kv)) return { tur: "video", url: kv! };
    const g = saltUrl(m.gorselUrl);
    if (gorselMi(g)) return { tur: "gorsel", url: g! };
    if (kaynakUretim?.tur === "gorsel" && gorselMi(saltUrl(kaynakUretim.gorselUrl))) return { tur: "gorsel", url: saltUrl(kaynakUretim.gorselUrl)! };
    return null;
  }
  return null;
}

/** "Sonra" görseli: görselde kendisi, videoda kapak ya da ilk kare. */
async function sonraCiz(u: Uretim): Promise<CanvasImageSource & { width: number; height: number }> {
  if (u.tur === "video") {
    if (u.videoUrl) { try { return await videoKaresi(u.videoUrl, 0.6); } catch { /* kapağa düş */ } }
    const p = saltUrl(u.gorselUrl);
    if (p) { const i = await gorselAc(p); return Object.assign(i, { width: i.naturalWidth, height: i.naturalHeight }); }
    throw new Error("Videonun karesi alınamadı.");
  }
  const g = saltUrl(u.gorselUrl);
  if (!g) throw new Error("Görsel dosyası yok.");
  const i = await gorselAc(g);
  return Object.assign(i, { width: i.naturalWidth, height: i.naturalHeight });
}
async function onceCiz(k: Kaynak): Promise<CanvasImageSource & { width: number; height: number }> {
  if (k.tur === "video") return videoKaresi(k.url, 0.6);
  const i = await gorselAc(k.url);
  return Object.assign(i, { width: i.naturalWidth, height: i.naturalHeight });
}

function kapla(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const o = Math.max(w / img.width, h / img.height);
  const iw = img.width * o, ih = img.height * o;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}
function hap(ctx: CanvasRenderingContext2D, metin: string, x: number, y: number, boy: number, sag = false) {
  ctx.save();
  ctx.font = `600 ${boy}px Inter, "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = "middle";
  const en = ctx.measureText(metin).width + boy * 1.4;
  const yuk = boy * 2;
  const sx = sag ? x - en : x;
  ctx.fillStyle = "rgba(12,13,15,0.62)";
  ctx.beginPath(); ctx.roundRect(sx, y, en, yuk, yuk / 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(metin, sx + boy * 0.7, y + yuk / 2 + 1);
  ctx.restore();
}

export type OnceSonraSablon = "yanyana" | "surgulu";

/** Önce ve sonra şablonu: yan yana iki panel ya da tek karede sürgülü bölme. */
export async function onceSonraUret(u: Uretim, sablon: OnceSonraSablon, filigran = filigranGerekli()): Promise<HTMLCanvasElement> {
  const k = kaynakBul(u);
  if (!k) throw new Error("Bu üretimin kaynağı yok.");
  const [once, sonra] = await Promise.all([onceCiz(k), sonraCiz(u)]);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  // Sonra görselinin oranı esas; kısa kenar en az 720, uzun kenar en çok 2400
  const oran = sonra.width / Math.max(1, sonra.height);
  let H = Math.min(2400, Math.max(720, sonra.height));
  if (sablon === "yanyana") {
    const panelW = Math.round(H * oran);
    if (panelW * 2 > 4096) H = Math.round(4096 / 2 / oran);
    const pW = Math.round(H * oran), ara = Math.round(H * 0.012);
    c.width = pW * 2 + ara; c.height = H;
    ctx.fillStyle = "#0d0e10"; ctx.fillRect(0, 0, c.width, c.height);
    kapla(ctx, once, 0, 0, pW, H);
    kapla(ctx, sonra, pW + ara, 0, pW, H);
    const b = Math.max(14, Math.round(H * 0.026));
    hap(ctx, "Önce", b, b, b);
    hap(ctx, "Sonra", pW + ara + b, b, b);
  } else {
    const W = Math.round(H * oran);
    c.width = W; c.height = H;
    kapla(ctx, sonra, 0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip(); kapla(ctx, once, 0, 0, W, H); ctx.restore();
    const cizgi = Math.max(2, Math.round(W * 0.003));
    ctx.fillStyle = "#ffffff"; ctx.fillRect(W / 2 - cizgi / 2, 0, cizgi, H);
    const r = Math.max(18, Math.round(Math.min(W, H) * 0.035));
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.fillStyle = "#0d0e10";
    const o = r * 0.38;
    ctx.beginPath(); ctx.moveTo(W / 2 - o * 0.4, H / 2 - o); ctx.lineTo(W / 2 - o * 1.5, H / 2); ctx.lineTo(W / 2 - o * 0.4, H / 2 + o); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W / 2 + o * 0.4, H / 2 - o); ctx.lineTo(W / 2 + o * 1.5, H / 2); ctx.lineTo(W / 2 + o * 0.4, H / 2 + o); ctx.fill();
    const b = Math.max(14, Math.round(H * 0.026));
    hap(ctx, "Önce", b, b, b);
    hap(ctx, "Sonra", W - b, b, b, true);
  }
  if (filigran) await filigranCiz(ctx, c.width, c.height);
  return c;
}

export async function onceSonraIndir(u: Uretim, sablon: OnceSonraSablon, filigran = filigranGerekli()): Promise<boolean> {
  try {
    const c = await onceSonraUret(u, sablon, filigran);
    await canvasKaydet(c, dosyaAdi(`${u.baslik || "vayra"} önce sonra`, "png"), "image/png");
    toast.success("Karşılaştırma indirildi", { description: sablon === "yanyana" ? "Yan yana şablon" : "Sürgülü şablon" });
    return true;
  } catch (e) {
    toast.error("Karşılaştırma hazırlanamadı", { description: e instanceof Error ? e.message : "Kaynak ya da sonuç görseli açılamadı." });
    return false;
  }
}

/** Videonun karesini (ya da kapağını) görsel olarak indir; filigran kuralı uygulanır. */
export async function kareIndir(u: Uretim, filigran = filigranGerekli()): Promise<boolean> {
  try {
    let c: HTMLCanvasElement;
    if (u.videoUrl) c = await videoKaresi(u.videoUrl, 0.6);
    else {
      const p = saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);
      if (!p) throw new Error("Kare yok.");
      const i = await gorselAc(p);
      c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
      c.getContext("2d")!.drawImage(i, 0, 0);
    }
    if (filigran) await filigranCiz(c.getContext("2d")!, c.width, c.height);
    await canvasKaydet(c, dosyaAdi(`${u.baslik || "vayra"} kare`, "png"), "image/png");
    toast.success("Kare indirildi", { description: u.baslik });
    return true;
  } catch (e) {
    toast.error("Kare alınamadı", { description: e instanceof Error ? e.message : "Video açılamadı." });
    return false;
  }
}

/* ── Türe göre ana indirme ── */

export type IndirTuru = "gorsel" | "video" | "ses" | "model";

export function indirTuru(u: Pick<Uretim, "tur" | "glbUrl" | "videoUrl" | "sesUrl">): IndirTuru {
  if (u.tur === "3d" || u.glbUrl) return "model";
  if (u.tur === "video" || u.videoUrl) return "video";
  if (u.tur === "ses" || u.sesUrl) return "ses";
  return "gorsel";
}

/** Üretimin asıl dosyası. Görselde biçim ve filigran uygulanır. */
export async function uretimDosyasiIndir(u: Uretim, s: { bicim?: GorselBicim; filigran?: boolean } = {}): Promise<boolean> {
  const ad = u.baslik || u.prompt || "vayra";
  const t = indirTuru(u);
  if (t === "model") {
    const glb = u.varyasyonlar?.[u.secilenVaryasyon ?? 0]?.glb ?? u.glbUrl;
    if (glb) { await dosyaIndir(glb, dosyaAdi(ad, "glb")); toast.success("3D model indiriliyor", { description: ad }); return true; }
  }
  if (t === "video" && u.videoUrl) { await dosyaIndir(u.videoUrl, dosyaAdi(ad, "mp4")); toast.success("Video indiriliyor", { description: ad }); return true; }
  if (t === "ses" && u.sesUrl) {
    const uz = String(u.sesUrl).match(/\.(mp3|wav|opus|ogg|m4a|webm)(\?|$)/)?.[1] ?? "mp3";
    await dosyaIndir(u.sesUrl, dosyaAdi(ad, uz)); toast.success("Ses indiriliyor", { description: ad }); return true;
  }
  const g = saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);
  if (g) {
    const ok = await gorselIndir(g, ad, s);
    if (ok) toast.success("Görsel indiriliyor", { description: ad });
    return ok;
  }
  toast.error("İndirilemedi", { description: "Bu üretimin indirilebilir bir dosyası yok." });
  return false;
}

/* Eski indirme yolları (utils.gorseliIndir, gorseliFormatlaIndir, gercekEylem.urlIndir) filigran
   kuralını buradan uygular. Modül yüklenince köprü kurulur (GaleriSenkron panelde içe aktarır). */
filigranKoprusuKur({
  gerekli: filigranGerekli,
  indir: async (url, ad, bicim) => {
    const b = bicim === "jpg" || bicim === "webp" || bicim === "png" ? bicim : "png";
    const ok = await gorselIndir(url, ad, { bicim: b, filigran: true });
    if (ok) toast.success("Görsel indiriliyor", { description: filigransizHakki() ? "Vayra filigranıyla, gizlilik ayarındaki tercihine göre." : "Vayra filigranıyla. Filigransız indirmek için Artı plana geç." });
    return ok;
  },
});
