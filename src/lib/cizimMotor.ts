/**
 * Çizim motoru — Çizim Stüdyosu'nun vektör tuvali.
 *
 * Nesneler tuval (artboard) boyutuna göre 0..1 normalize koordinatta tutulur; böylece görüntü
 * hangi boyutta gösterilirse gösterilsin çizimler yerinde kalır. Aynı çizim fonksiyonu ekranda
 * ve modele gönderilen birleşik karede kullanılır.
 *
 * Renk anlamları sabittir (rakiplerde yok): her rol bir renk ve bir talimat kalıbıdır.
 */

export type CizimArac = "sec" | "el" | "kalem" | "ok" | "kare" | "daire" | "metin" | "silgi";
export type CizimRol = "hareket" | "sabit" | "ekle" | "kaldir" | "degistir" | "not";
export type CizimTur = "kalem" | "ok" | "kare" | "daire" | "metin";
export type Nokta = { x: number; y: number };

export interface CizimNesne {
  id: string;
  tur: CizimTur;
  rol: CizimRol;
  noktalar: Nokta[];        // kalem: yol; ok/kare/daire: [baş, son]; metin: [konum]
  egri?: Nokta;             // ok: bükme kontrol noktası (yoksa düz)
  kalinlik: number;         // kısa kenara oranla (0.004–0.02)
  metin?: string;           // metin aracı: tuvalde görünen yazı
  not?: string;             // nesnenin talimatı (sağ panelde yazılır)
}

export const ROLLER: Record<CizimRol, { ad: string; renk: string; aciklama: string }> = {
  hareket: { ad: "Hareket", renk: "#22d3ee", aciklama: "Ok yönünde hareket eder" },
  sabit: { ad: "Sabit", renk: "#a1a1aa", aciklama: "Bu alan kıpırdamaz" },
  ekle: { ad: "Ekle", renk: "#4ade80", aciklama: "Buraya yeni öğe" },
  kaldir: { ad: "Kaldır", renk: "#f43f5e", aciklama: "İçindekini sil" },
  degistir: { ad: "Değiştir", renk: "#facc15", aciklama: "Başka bir şeye dönüştür" },
  not: { ad: "Not", renk: "#ffffff", aciklama: "Serbest talimat" },
};
export const ROL_SIRA: CizimRol[] = ["hareket", "sabit", "ekle", "kaldir", "degistir", "not"];

let sayac = 0;
export const cId = () => `cz_${Date.now().toString(36)}${(sayac += 1)}`;

/* ═══════════ Çizim ═══════════ */

/** Ok başı için ikinci dereceden eğri üzerinde nokta ve teğet. */
function egriNokta(a: Nokta, k: Nokta, b: Nokta, t: number): Nokta {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * k.x + t * t * b.x, y: u * u * a.y + 2 * u * t * k.y + t * t * b.y };
}
export const okKontrol = (n: CizimNesne): Nokta => n.egri ?? { x: (n.noktalar[0].x + n.noktalar[1].x) / 2, y: (n.noktalar[0].y + n.noktalar[1].y) / 2 };

/**
 * Nesneleri çizer. `W,H` artboard piksel boyutu (ctx zaten artboard koordinatına dönüştürülmüş olmalı).
 * `numara`: numaralı rozet; `secili`: seçim vurgusu; `akis`: 0..1 hareket önizleme fazı.
 */
export function nesneCiz(ctx: CanvasRenderingContext2D, n: CizimNesne, W: number, H: number, o: { numara?: number; secili?: boolean; akis?: number; olcek?: number; murekkep?: string } = {}) {
  const kisa = Math.min(W, H);
  const lw = Math.max(1.5, n.kalinlik * kisa);
  // Eskizde (kâğıt üstü) mürekkep koyu; diğer modlarda rol rengi
  const renk = o.murekkep ?? ROLLER[n.rol].renk;
  const p = (q: Nokta) => ({ x: q.x * W, y: q.y * H });
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = renk; ctx.fillStyle = renk; ctx.lineWidth = lw;
  // Okunurluk için ince koyu hale
  ctx.shadowColor = o.murekkep ? "transparent" : "rgba(0,0,0,0.55)"; ctx.shadowBlur = o.murekkep ? 0 : lw * 1.2;
  if (n.tur === "kalem" && n.noktalar.length) {
    ctx.beginPath();
    const [a, ...r] = n.noktalar.map(p);
    ctx.moveTo(a.x, a.y);
    if (!r.length) ctx.lineTo(a.x + 0.1, a.y);
    for (let i = 0; i < r.length; i++) {
      const s = r[i], s2 = r[i + 1];
      if (s2) ctx.quadraticCurveTo(s.x, s.y, (s.x + s2.x) / 2, (s.y + s2.y) / 2); else ctx.lineTo(s.x, s.y);
    }
    if (n.rol === "sabit") { ctx.globalAlpha = 0.55; ctx.lineWidth = lw * 2.4; }
    ctx.stroke();
  } else if (n.tur === "ok" && n.noktalar.length >= 2) {
    const a = p(n.noktalar[0]), b = p(n.noktalar[1]), k = p(okKontrol(n));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(k.x, k.y, b.x, b.y);
    if (o.akis !== undefined) ctx.setLineDash([lw * 2.4, lw * 2.2]), (ctx.lineDashOffset = -o.akis * lw * 46);
    ctx.stroke(); ctx.setLineDash([]);
    // Ok başı: uca yakın teğet
    const t1 = egriNokta(a, k, b, 0.92);
    const ac = Math.atan2(b.y - t1.y, b.x - t1.x), bo = lw * 4.2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - bo * Math.cos(ac - 0.45), b.y - bo * Math.sin(ac - 0.45));
    ctx.lineTo(b.x - bo * Math.cos(ac + 0.45), b.y - bo * Math.sin(ac + 0.45));
    ctx.closePath(); ctx.fill();
    // Hareket önizleme: yol üzerinde kayan nokta
    if (o.akis !== undefined) {
      const q = egriNokta(a, k, b, o.akis);
      ctx.shadowBlur = lw * 4; ctx.shadowColor = renk;
      ctx.beginPath(); ctx.arc(q.x, q.y, lw * 2.2, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
    }
  } else if ((n.tur === "kare" || n.tur === "daire") && n.noktalar.length >= 2) {
    const a = p(n.noktalar[0]), b = p(n.noktalar[1]);
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    ctx.beginPath();
    if (n.tur === "daire") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.06);
    ctx.globalAlpha = 0.14; ctx.fill(); ctx.globalAlpha = 1;
    if (n.rol === "kaldir") ctx.setLineDash([lw * 2.5, lw * 1.6]);
    ctx.stroke(); ctx.setLineDash([]);
  } else if (n.tur === "metin" && n.noktalar.length) {
    const a = p(n.noktalar[0]);
    const boy = Math.max(12, kisa * 0.032);
    ctx.font = `700 ${boy}px Inter, system-ui, sans-serif`;
    const yazi = n.metin?.trim() || "Not";
    const sol = o.numara !== undefined ? boy * 1.25 : boy * 0.55;
    const w = ctx.measureText(yazi).width + sol + boy * 0.55, h = boy * 1.7;
    ctx.shadowBlur = boy * 0.6;
    ctx.beginPath(); ctx.roundRect(a.x, a.y - h / 2, w, h, h / 2); ctx.fillStyle = "rgba(10,12,15,0.86)"; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = Math.max(1.5, boy * 0.09); ctx.strokeStyle = renk; ctx.stroke();
    ctx.fillStyle = renk === "#ffffff" ? "#ffffff" : renk; ctx.textBaseline = "middle"; ctx.fillText(yazi, a.x + sol, a.y + boy * 0.04);
  }
  ctx.restore();
  // Numara rozeti (yalnız ekranda)
  if (o.numara !== undefined) {
    const k = nesneKutusu(n);
    const r = Math.max(9, kisa * 0.018) * (o.olcek ?? 1);
    const c = { x: k.x * W, y: k.y * H };
    ctx.save();
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fillStyle = renk; ctx.fill();
    ctx.lineWidth = r * 0.18; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
    ctx.fillStyle = n.rol === "not" || n.rol === "degistir" || n.rol === "sabit" ? "#0b0d10" : "#04131a";
    ctx.font = `800 ${r * 1.15}px Inter, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(o.numara), c.x, c.y + r * 0.05);
    ctx.restore();
  }
  if (o.secili) {
    const b = sinirlar(n);
    ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(1, kisa * 0.0016); ctx.setLineDash([6, 4]);
    const pad = kisa * 0.012;
    ctx.strokeRect(b.x1 * W - pad, b.y1 * H - pad, (b.x2 - b.x1) * W + pad * 2, (b.y2 - b.y1) * H + pad * 2);
    ctx.restore();
  }
}

/** Numara rozetinin yeri: nesnenin başlangıç köşesi (ok: kuyruk). */
export function nesneKutusu(n: CizimNesne): Nokta {
  if (n.tur === "ok" || n.tur === "kalem" || n.tur === "metin") return n.noktalar[0];
  const [a, b] = n.noktalar; return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) };
}

export function sinirlar(n: CizimNesne): { x1: number; y1: number; x2: number; y2: number } {
  const l = n.tur === "ok" ? [...n.noktalar, okKontrol(n)] : n.noktalar;
  let x1 = 1, y1 = 1, x2 = 0, y2 = 0;
  for (const q of l) { x1 = Math.min(x1, q.x); y1 = Math.min(y1, q.y); x2 = Math.max(x2, q.x); y2 = Math.max(y2, q.y); }
  if (n.tur === "metin") { x2 = x1 + Math.max(0.06, (n.metin?.length ?? 3) * 0.018); y1 -= 0.025; y2 += 0.025; }
  return { x1, y1, x2, y2 };
}

/** İsabet testi (normalize nokta, tolerans normalize). Üstteki nesne önce. */
export function isabet(l: CizimNesne[], q: Nokta, tol: number): CizimNesne | null {
  for (let i = l.length - 1; i >= 0; i--) {
    const n = l[i];
    const t = tol + n.kalinlik;
    if (n.tur === "kare" || n.tur === "daire" || n.tur === "metin") {
      const b = sinirlar(n);
      if (q.x >= b.x1 - t && q.x <= b.x2 + t && q.y >= b.y1 - t && q.y <= b.y2 + t) return n;
      continue;
    }
    const yol = n.tur === "ok" ? Array.from({ length: 24 }, (_, j) => egriNokta(n.noktalar[0], okKontrol(n), n.noktalar[1], j / 23)) : n.noktalar;
    for (let j = 0; j < yol.length; j++) {
      const a = yol[j], b = yol[j + 1] ?? a;
      if (parcaUzaklik(q, a, b) < t) return n;
    }
  }
  return null;
}
function parcaUzaklik(p: Nokta, a: Nokta, b: Nokta): number {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function tasi(n: CizimNesne, dx: number, dy: number): CizimNesne {
  const k = (q: Nokta) => ({ x: q.x + dx, y: q.y + dy });
  return { ...n, noktalar: n.noktalar.map(k), egri: n.egri ? k(n.egri) : undefined };
}

/* ═══════════ Talimat derleme ═══════════ */

const yerTr = (q: Nokta) => `${q.y < 0.34 ? "üst" : q.y > 0.66 ? "alt" : "orta"}${q.x < 0.34 ? " sol" : q.x > 0.66 ? " sağ" : q.y >= 0.34 && q.y <= 0.66 ? "" : " orta"}`.replace("orta orta", "orta");
const yerEn = (q: Nokta) => `${q.y < 0.34 ? "upper" : q.y > 0.66 ? "lower" : "middle"}-${q.x < 0.34 ? "left" : q.x > 0.66 ? "right" : "center"}`;
const merkez = (n: CizimNesne): Nokta => { const b = sinirlar(n); return { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 }; };
const yonTr = (a: Nokta, b: Nokta) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? "sağa" : "sola";
  if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? "aşağı" : "yukarı";
  return `${dy > 0 ? "aşağı" : "yukarı"} ${dx > 0 ? "sağa" : "sola"}`;
};
const yonEn = (a: Nokta, b: Nokta) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? "to the right" : "to the left";
  if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? "downward" : "upward";
  return `diagonally ${dy > 0 ? "down" : "up"} and to the ${dx > 0 ? "right" : "left"}`;
};

export type Mod = "video" | "duzenle" | "eskiz";
export type Kamera = "sabit" | "yaklas" | "uzaklas" | "sola" | "saga" | "yorunge" | "yukari" | "elde" | "ozel";
/** Kamera hareketleri — `klip`: gerçek örnek hareket klibi (public/gercek/video-hareket). */
export const KAMERALAR: { id: Kamera; ad: string; tr: string; en: string; klip: string }[] = [
  { id: "sabit", ad: "Sabit", tr: "Yalnız oklar hareket eder", en: "locked-off static camera", klip: "skate-cruise" },
  { id: "yaklas", ad: "Yaklaş", tr: "Özneye doğru ilerler", en: "slow push-in", klip: "dolly-in" },
  { id: "uzaklas", ad: "Uzaklaş", tr: "Geri çekilip açar", en: "slow pull-out", klip: "dolly-out" },
  { id: "sola", ad: "Sola dön", tr: "Soldan yay çizer", en: "smooth arc to the left", klip: "orbit-left" },
  { id: "saga", ad: "Sağa dön", tr: "Sağdan yay çizer", en: "smooth arc to the right", klip: "orbit-right" },
  { id: "yorunge", ad: "Yörünge", tr: "Etrafında döner", en: "slow orbit around the subject", klip: "drone-orbit" },
  { id: "yukari", ad: "Yükselen", tr: "Vinç gibi kalkar", en: "crane up", klip: "crane-up" },
  { id: "elde", ad: "El kamerası", tr: "Doğal sallantı", en: "subtle handheld movement", klip: "handheld" },
];

/** Her nesne için Türkçe "anladığım" cümlesi + modele giden İngilizce talimat. */
export function nesneTalimati(n: CizimNesne, i: number): { tr: string; en: string } {
  const not = n.not?.trim();
  const c = merkez(n);
  if (n.tur === "metin") {
    const m = n.metin?.trim() || not || "";
    return { tr: `${yerTr(c)} bölgedeki not: “${m}”`, en: `Text note #${i} near the ${yerEn(c)}: "${m}" — follow it.` };
  }
  if (n.tur === "ok") {
    const [a, b] = n.noktalar;
    const kim = not || (n.rol === "hareket" ? "oktaki özne" : "bu öğe");
    return { tr: `${yerTr(a)} bölgedeki ${kim}, ${yonTr(a, b)} doğru ok boyunca ${n.egri ? "kavis çizerek " : ""}hareket eder`, en: `Arrow #${i} (${ROLLER[n.rol].ad.toLowerCase()}): ${not ? `"${not}"` : "the subject at the arrow tail"} near the ${yerEn(a)} moves ${yonEn(a, b)} along the ${n.egri ? "curved " : ""}arrow path, ending near the ${yerEn(b)}.` };
  }
  const bolge = `${yerTr(c)} bölge`;
  switch (n.rol) {
    case "hareket": return { tr: `${bolge}: ${not || "bu öğe hareket eder"}`, en: `Region #${i} (${yerEn(c)}): ${not ? `"${not}"` : "this element moves naturally"}.` };
    case "sabit": return { tr: `${bolge} sabit kalır`, en: `Region #${i} (${yerEn(c)}): keep completely still, no motion.` };
    case "ekle": return { tr: `${bolge}: ${not ? `“${not}” eklenir` : "yeni bir öğe eklenir (ne eklenecek?)"}`, en: `Region #${i} (${yerEn(c)}): add ${not ? `"${not}"` : "a fitting new element"} here.` };
    case "kaldir": return { tr: `${bolge}deki ${not || "öğe"} kaldırılır`, en: `Region #${i} (${yerEn(c)}): remove ${not ? `"${not}"` : "what is inside"} and fill naturally.` };
    case "degistir": return { tr: `${bolge}: ${not ? `“${not}” olarak değişir` : "değişir (neye?)"}`, en: `Region #${i} (${yerEn(c)}): change it into ${not ? `"${not}"` : "something different"}.` };
    default: return { tr: `${bolge}: ${not || "not"}`, en: `Mark #${i} (${yerEn(c)}): ${not ? `"${not}"` : "pay attention here"}.` };
  }
}

/** Modele giden tam istem. */
export function istemDerle(l: CizimNesne[], o: { mod: Mod; istem: string; kamera?: Kamera; kameraOzel?: string; stil?: string; cizimliKare?: boolean }): string {
  const parca = l.map((n, i) => nesneTalimati(n, i + 1).en);
  const genel = o.istem.trim();
  if (o.mod === "eskiz") return [genel, o.stil ? `Style: ${o.stil}.` : "", parca.length ? `Extra notes: ${parca.join(" ")}` : ""].filter(Boolean).join("\n");
  if (o.mod === "duzenle") return [genel, parca.length ? `Annotated edits:\n${parca.join("\n")}` : ""].filter(Boolean).join("\n\n");
  const kam = KAMERALAR.find((k) => k.id === o.kamera);
  return [
    genel,
    parca.length ? `Directions${o.cizimliKare ? " (drawn on the first frame)" : ""}, in order:\n${parca.join("\n")}` : "",
    o.kamera === "ozel" && o.kameraOzel?.trim() ? `Camera: ${o.kameraOzel.trim()}.` : kam ? `Camera: ${kam.en}.` : "",
    o.cizimliKare ? "The first frame contains colored hand-drawn annotations (arrows, outlines, labels). They are instructions only: follow them and make sure no annotation marks, arrows or text appear in the video." : "",
  ].filter(Boolean).join("\n\n");
}

/** Uyarılar (lint): tutarlılığı düşüren durumlar, harcamadan önce. */
export function uyarilar(l: CizimNesne[], o: { mod: Mod; tabanVar: boolean; istem: string }): { seviye: "hata" | "uyari"; metin: string }[] {
  const r: { seviye: "hata" | "uyari"; metin: string }[] = [];
  if (o.mod !== "eskiz" && !o.tabanVar) r.push({ seviye: "hata", metin: "Önce bir görsel ekle: çizimler görselin üstüne yapılır." });
  if (o.mod === "eskiz" && !l.length) r.push({ seviye: "hata", metin: "Tuvale bir eskiz çiz." });
  if (o.mod !== "eskiz" && !l.length && o.istem.trim().length < 3) r.push({ seviye: "hata", metin: "Çizim ya da istem ekle." });
  const hareket = l.filter((n) => n.rol === "hareket").length;
  if (o.mod === "video" && hareket > 3) r.push({ seviye: "uyari", metin: `${hareket} hareket var; 3'ten fazlasında modeller tutarlılığı kaybediyor.` });
  if (o.mod === "duzenle" && l.some((n) => n.rol === "hareket")) r.push({ seviye: "uyari", metin: "Düzenleme durağan görsel üretir; hareket okları yön olarak yorumlanır." });
  for (const [i, n] of l.entries()) {
    if ((n.rol === "ekle" || n.rol === "degistir") && !n.not?.trim() && n.tur !== "metin") r.push({ seviye: "uyari", metin: `#${i + 1}: ne ${n.rol === "ekle" ? "ekleneceğini" : "olacağını"} yaz.` });
    if (n.tur === "metin" && (n.metin?.length ?? 0) > 50) r.push({ seviye: "uyari", metin: `#${i + 1}: not uzun; kısa notları modeller daha iyi okur.` });
  }
  if (l.length > 6) r.push({ seviye: "uyari", metin: `${l.length} işaret var; sade çizimler daha isabetli sonuç verir.` });
  return r;
}

/* ═══════════ Birleşik kare ═══════════ */

/** Taban görsel + (isteğe bağlı) çizimleri artboard boyutunda JPEG'e çizer. */
export async function kareCikar(o: { W: number; H: number; taban?: string; zemin: string; nesneler: CizimNesne[]; cizimli: boolean; murekkep?: string }): Promise<Blob> {
  const c = document.createElement("canvas"); c.width = o.W; c.height = o.H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = o.zemin; ctx.fillRect(0, 0, o.W, o.H);
  if (o.taban) {
    const img = await gorselYukle(o.taban);
    ctx.drawImage(img, 0, 0, o.W, o.H);
  }
  if (o.cizimli) for (const n of o.nesneler) nesneCiz(ctx, n, o.W, o.H, { murekkep: o.murekkep });
  return new Promise((ok, red) => c.toBlob((b) => (b ? ok(b) : red(new Error("Kare oluşturulamadı"))), "image/jpeg", 0.92));
}

export function gorselYukle(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, red) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => red(new Error("Görsel yüklenemedi")); i.src = url; });
}

/** Görselin boyutuna göre artboard (uzun kenar en çok 1600). */
export function artboardBoyut(w: number, h: number, enCok = 1600): { W: number; H: number } {
  const o = Math.min(1, enCok / Math.max(w, h));
  return { W: Math.round(w * o), H: Math.round(h * o) };
}
export const ORAN_BOYUT: Record<string, { W: number; H: number }> = { "16:9": { W: 1600, H: 900 }, "9:16": { W: 900, H: 1600 }, "1:1": { W: 1200, H: 1200 }, "4:3": { W: 1440, H: 1080 }, "3:4": { W: 1080, H: 1440 } };
