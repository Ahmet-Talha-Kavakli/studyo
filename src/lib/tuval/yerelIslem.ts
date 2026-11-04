"use client";

/**
 * Tarayıcıda çalışan ücretsiz görsel işlemleri (Kırp ve boyutlandır, Renk ayarı).
 * Görsel fetch → blob → ImageBitmap ile açılır (başka kökenden gelse de tuval kirlenmez); çıktı PNG data URL.
 */
async function ac(url: string): Promise<ImageBitmap> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Görsel açılamadı");
  return createImageBitmap(await r.blob());
}

const oranSayi = (o: string) => { const [a, b] = o.split(":").map(Number); return a && b ? a / b : 0; };

export async function kirpBoyutla(url: string, a: Record<string, unknown>): Promise<{ url: string; w: number; h: number }> {
  const img = await ac(url);
  const donme = Number(a.donme ?? 0) % 360;
  // 1) Kırpma alanı (kaynak koordinatlarında)
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  const hedef = oranSayi(String(a.oran ?? "Orijinal"));
  if (hedef) {
    // Döndürme 90/270 ise oran döndürülmüş görsele göre uygulanır.
    const h = donme === 90 || donme === 270 ? 1 / hedef : hedef;
    if (sw / sh > h) { const yeni = Math.round(sh * h); sx = a.konum === "ust" ? 0 : a.konum === "alt" ? sw - yeni : Math.round((sw - yeni) / 2); sw = yeni; }
    else { const yeni = Math.round(sw / h); sy = a.konum === "ust" ? 0 : a.konum === "alt" ? sh - yeni : Math.round((sh - yeni) / 2); sh = yeni; }
  }
  // 2) Ölçek
  const maks = Number(a.genislik ?? 0);
  const yan = donme === 90 || donme === 270;
  const cw0 = yan ? sh : sw, ch0 = yan ? sw : sh;
  const k = maks > 0 && cw0 > maks ? maks / cw0 : 1;
  const cw = Math.round(cw0 * k), ch = Math.round(ch0 * k);
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const x = c.getContext("2d")!;
  x.imageSmoothingQuality = "high";
  x.translate(cw / 2, ch / 2);
  x.rotate((donme * Math.PI) / 180);
  x.scale(a.yatay ? -1 : 1, a.dikey ? -1 : 1);
  const dw = sw * k, dh = sh * k;
  x.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  return { url: c.toDataURL("image/png"), w: cw, h: ch };
}

const HAZIR: Record<string, { p?: number; k?: number; d?: number; s?: number; filtre?: string; v?: number }> = {
  "Sıcak": { s: 25, d: 10 }, "Soğuk": { s: -25, d: -5 }, "Sinematik": { k: 15, d: -15, s: 8, v: 35 }, "Soluk film": { k: -20, p: 6, d: -30, v: 15 },
  "Canlı": { d: 40, k: 10 }, "Siyah beyaz": { filtre: "grayscale(1)", k: 12 }, "Sepya": { filtre: "sepia(0.85)" },
};

export async function renkAyarla(url: string, a: Record<string, unknown>): Promise<{ url: string; w: number; h: number }> {
  const img = await ac(url);
  const h = HAZIR[String(a.hazir ?? "")] ?? {};
  const p = Number(a.parlaklik ?? 0) + (h.p ?? 0), k = Number(a.kontrast ?? 0) + (h.k ?? 0), d = Number(a.doygunluk ?? 0) + (h.d ?? 0);
  const s = Number(a.sicaklik ?? 0) + (h.s ?? 0), b = Number(a.bulaniklik ?? 0), v = Number(a.vinyet ?? 0) + (h.v ?? 0);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d")!;
  x.filter = [`brightness(${1 + p / 100})`, `contrast(${1 + k / 100})`, `saturate(${Math.max(0, 1 + d / 100)})`, b ? `blur(${b}px)` : "", a.ters ? "invert(1)" : "", h.filtre ?? ""].filter(Boolean).join(" ");
  x.drawImage(img, 0, 0);
  x.filter = "none";
  if (s) { x.globalCompositeOperation = "soft-light"; x.fillStyle = s > 0 ? `rgba(255,150,40,${Math.abs(s) / 120})` : `rgba(40,120,255,${Math.abs(s) / 120})`; x.fillRect(0, 0, c.width, c.height); }
  if (v) {
    x.globalCompositeOperation = "multiply";
    const r = Math.hypot(c.width, c.height) / 2;
    const g = x.createRadialGradient(c.width / 2, c.height / 2, r * 0.45, c.width / 2, c.height / 2, r);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, v / 100)})`);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  }
  x.globalCompositeOperation = "source-over";
  const ks = Number(a.keskinlik ?? 0);
  if (ks > 0) keskinlestir(x, c.width, c.height, ks / 100);
  return { url: c.toDataURL("image/png"), w: c.width, h: c.height };
}

/** Keskinleştirme: 3x3 keskinlik çekirdeği, güçle karıştırılır. */
function keskinlestir(x: CanvasRenderingContext2D, w: number, h: number, guc: number) {
  const kaynak = x.getImageData(0, 0, w, h), hedef = x.createImageData(w, h);
  const s = kaynak.data, d = hedef.data, k = guc * 1.6;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const o = (y * w + i) * 4;
    for (let c = 0; c < 3; c++) {
      const m = s[o + c];
      const u = y > 0 ? s[o - w * 4 + c] : m, a2 = y < h - 1 ? s[o + w * 4 + c] : m, l = i > 0 ? s[o - 4 + c] : m, r = i < w - 1 ? s[o + 4 + c] : m;
      d[o + c] = Math.max(0, Math.min(255, m + k * (4 * m - u - a2 - l - r)));
    }
    d[o + 3] = s[o + 3];
  }
  x.putImageData(hedef, 0, 0);
}

/** Üst katmanı zemine yerleştirir (konum, boyut, opaklık, karışım). Çıktı zemin boyutundadır. */
export async function katmanBirlestir(zeminUrl: string, ustUrl: string, a: Record<string, unknown>): Promise<{ url: string; w: number; h: number }> {
  const [z, u] = await Promise.all([ac(zeminUrl), ac(ustUrl)]);
  const c = document.createElement("canvas"); c.width = z.width; c.height = z.height;
  const x = c.getContext("2d")!; x.drawImage(z, 0, 0);
  const konum = String(a.konum ?? "orta");
  let w: number, h: number;
  if (konum === "kapla") { const o = Math.max(c.width / u.width, c.height / u.height); w = u.width * o; h = u.height * o; }
  else { const o = (Number(a.olcek ?? 40) / 100) * Math.min(c.width / u.width, c.height / u.height); w = u.width * o; h = u.height * o; }
  const k = (Number(a.kenar ?? 4) / 100) * Math.min(c.width, c.height);
  const px = konum === "solUst" || konum === "solAlt" ? k : konum === "sagUst" || konum === "sagAlt" ? c.width - w - k : (c.width - w) / 2;
  const py = konum === "solUst" || konum === "sagUst" ? k : konum === "solAlt" || konum === "sagAlt" ? c.height - h - k : (c.height - h) / 2;
  x.globalAlpha = Math.max(0, Math.min(1, Number(a.opaklik ?? 100) / 100));
  x.globalCompositeOperation = String(a.karisim ?? "source-over") as GlobalCompositeOperation;
  x.drawImage(u, px, py, w, h);
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  return { url: c.toDataURL("image/png"), w: c.width, h: c.height };
}

/** Herhangi bir adresi data URL'e çevirir (ses sağlayıcıları dosyayı gövdede ister). */
export async function dataUrlAl(url: string): Promise<{ veri: string; ad: string }> {
  if (url.startsWith("data:")) return { veri: url, ad: "kaynak" };
  const r = await fetch(url);
  if (!r.ok) throw new Error("Kaynak dosya açılamadı");
  const blob = await r.blob();
  const veri = await new Promise<string>((coz, red) => { const f = new FileReader(); f.onload = () => coz(String(f.result)); f.onerror = () => red(new Error("Dosya okunamadı")); f.readAsDataURL(blob); });
  return { veri, ad: url.split("/").pop()?.split("?")[0] || "kaynak" };
}

/** Görsele yazı (başlık, altyazı, etiket). Yazı genişliğe göre satırlara bölünür. */
export async function yaziEkle(url: string, metin: string, a: Record<string, unknown>): Promise<{ url: string; w: number; h: number }> {
  const img = await ac(url);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d")!; x.drawImage(img, 0, 0);
  const px = Math.round((Number(a.boyut ?? 6) / 100) * Math.min(c.width, c.height * 1.4));
  x.font = `${a.kalin === false ? 500 : 800} ${px}px Inter, "Segoe UI", system-ui, sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle";
  const kenar = c.width * 0.08, maks = c.width - kenar * 2;
  const satirlar: string[] = [];
  for (const par of metin.split(/\n/)) {
    let s = "";
    for (const k of par.split(/\s+/)) { const dene = s ? `${s} ${k}` : k; if (x.measureText(dene).width > maks && s) { satirlar.push(s); s = k; } else s = dene; }
    if (s) satirlar.push(s);
  }
  const lh = px * 1.18, toplam = satirlar.length * lh;
  const y0 = a.konum === "ust" ? kenar + lh / 2 : a.konum === "orta" ? c.height / 2 - toplam / 2 + lh / 2 : c.height - kenar - toplam + lh / 2;
  const renk = String(a.renk ?? "#ffffff");
  if (a.stil === "serit") { x.fillStyle = "rgba(0,0,0,0.55)"; x.fillRect(0, y0 - lh / 2 - px * 0.4, c.width, toplam + px * 0.8); }
  satirlar.forEach((s, i) => {
    const y = y0 + i * lh;
    if (a.stil === "etiket") {
      const w = x.measureText(s).width + px * 0.9, h = lh * 0.98;
      x.fillStyle = renk; x.beginPath(); x.roundRect(c.width / 2 - w / 2, y - h / 2, w, h, px * 0.25); x.fill();
      x.fillStyle = renk.toLowerCase() === "#ffffff" || renk === "#fbbf24" || renk === "#22d3ee" ? "#111" : "#fff"; x.fillText(s, c.width / 2, y + px * 0.04);
      return;
    }
    if (a.stil !== "sade") { x.shadowColor = "rgba(0,0,0,0.65)"; x.shadowBlur = px * 0.35; x.shadowOffsetY = px * 0.05; }
    x.fillStyle = renk; x.fillText(s, c.width / 2, y); x.shadowColor = "transparent";
  });
  return { url: c.toDataURL("image/png"), w: c.width, h: c.height };
}

/** Görselleri ızgarada birleştirir (en fazla 16). Hücre oranı ilk görselden alınır. */
export async function kolajYap(urls: string[], a: Record<string, unknown>): Promise<{ url: string; w: number; h: number }> {
  const l = await Promise.all(urls.slice(0, 16).map(ac));
  const n = l.length; const sutun = Number(a.sutun ?? 0) || Math.ceil(Math.sqrt(n)); const satir = Math.ceil(n / sutun);
  const hw = Math.min(1024, l[0].width), hh = Math.round(hw * (l[0].height / l[0].width)); const b = Number(a.bosluk ?? 12);
  const c = document.createElement("canvas"); c.width = sutun * hw + (sutun + 1) * b; c.height = satir * hh + (satir + 1) * b;
  const x = c.getContext("2d")!; x.fillStyle = String(a.zemin ?? "#121214"); x.fillRect(0, 0, c.width, c.height);
  l.forEach((img, i) => {
    const cx = b + (i % sutun) * (hw + b), cy = b + Math.floor(i / sutun) * (hh + b);
    const o = Math.max(hw / img.width, hh / img.height); const w = img.width * o, h = img.height * o;
    x.save(); x.beginPath(); x.rect(cx, cy, hw, hh); x.clip(); x.drawImage(img, cx + (hw - w) / 2, cy + (hh - h) / 2, w, h); x.restore();
  });
  return { url: c.toDataURL("image/jpeg", 0.92), w: c.width, h: c.height };
}
