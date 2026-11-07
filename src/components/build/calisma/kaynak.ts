"use client";

import { konumBul, oznitelikYaz, stilYaz } from "./kaynakKonum";

/**
 * Görsel düzenlemeleri (metni yerinde düzenle, stil paneli, görsel değiştir) KAYNAK HTML'e kredisiz uygular.
 * Önizlemedeki seçici "body > div:nth-of-type(2) > h1:nth-of-type(1)" biçimindedir; öğe kaynakta konumBul ile
 * bulunur ve YALNIZ o etiket/içerik değişir (dosyanın biçimi korunur). Kaynakta yoksa (JS ile oluşan öğe) DOMParser
 * yedeği çalışır; o da bulamazsa null döner ve değişiklik ajana yönlendirilir.
 */

function bul(doc: Document, secici: string): Element | null {
  try { return doc.querySelector(secici); } catch { return null; }
}

function yaz(doc: Document, eski: string): string {
  const doctype = /^\s*<!doctype[^>]*>/i.exec(eski)?.[0] ?? "<!doctype html>";
  return `${doctype}\n${doc.documentElement.outerHTML}\n`;
}

/** Seçici kaynakta bulunursa yalnız o bölge değişir; bulunamazsa (JS ile oluşan öğe) DOMParser yedeği. */
export function metniDegistir(html: string, secici: string, yeniIc: string): string | null {
  const gecici = new DOMParser().parseFromString(`<body>${yeniIc}</body>`, "text/html").body;
  gecici.querySelectorAll("script,style,iframe").forEach((x) => x.remove());
  gecici.querySelectorAll("[contenteditable]").forEach((x) => x.removeAttribute("contenteditable"));
  const temiz = gecici.innerHTML;
  const k = konumBul(html, secici);
  if (k) {
    if (html.slice(k.icBas, k.icSon).trim() === temiz.trim()) return null;
    return html.slice(0, k.icBas) + temiz + html.slice(k.icSon);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = bul(doc, secici);
  if (!el || el.innerHTML === temiz) return null;
  el.innerHTML = temiz;
  return yaz(doc, html);
}

export function stilUygula(html: string, secici: string, stiller: Record<string, string>): string | null {
  const k = konumBul(html, secici);
  if (k) {
    const acilis = html.slice(k.acilisBas, k.acilisSon);
    return html.slice(0, k.acilisBas) + stilYaz(acilis, stiller) + html.slice(k.acilisSon);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = bul(doc, secici) as HTMLElement | null;
  if (!el) return null;
  for (const [a, v] of Object.entries(stiller)) { if (v) el.style.setProperty(a, v); else el.style.removeProperty(a); }
  return yaz(doc, html);
}

/** Öğeyi kaynaktan siler (açılıştan kapanış etiketinin sonuna kadar); bulunamazsa DOMParser yedeği. */
export function ogeSil(html: string, secici: string): string | null {
  const k = konumBul(html, secici);
  if (k) {
    let son = k.icSon;
    const kapanis = new RegExp(`^</${k.etiket}\\s*>`, "i").exec(html.slice(k.icSon));
    if (kapanis) son += kapanis[0].length;
    else if (k.icSon === k.icBas) son = k.acilisSon;
    // Satır yalnız bu öğeden oluşuyorsa boş satırı da al.
    let bas = k.acilisBas;
    const once = html.lastIndexOf("\n", bas - 1);
    if (/^[ \t]*$/.test(html.slice(once + 1, bas)) && /^[ \t]*\r?\n/.test(html.slice(son))) { bas = once + 1; son += /^[ \t]*\r?\n/.exec(html.slice(son))![0].length; }
    return html.slice(0, bas) + html.slice(son);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = bul(doc, secici);
  if (!el) return null;
  el.remove();
  return yaz(doc, html);
}

export function gorselDegistir(html: string, secici: string, src: string): string | null {
  const k = konumBul(html, secici);
  if (k && k.etiket === "img") return html.slice(0, k.acilisBas) + oznitelikYaz(html.slice(k.acilisBas, k.acilisSon), "src", src) + html.slice(k.acilisSon);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = bul(doc, secici);
  if (!el || el.tagName !== "IMG") return null;
  el.setAttribute("src", src);
  return yaz(doc, html);
}

/** rgb(…) → #rrggbb (renk girdisi için). */
export function hexe(renk: string): string {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(renk);
  if (!m) return renk.startsWith("#") ? renk : "#000000";
  if (m[4] === "0") return "";
  return `#${[m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("")}`;
}

/** Oyun ayarları: ayarlar.json → kaydırıcılar. */
export type OyunAyari = { anahtar: string; etiket: string; deger: number; min: number; max: number; adim: number };
export function oyunAyarlari(json?: string): OyunAyari[] | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Record<string, { etiket?: string; deger?: number; min?: number; max?: number; adim?: number }>;
    const l = Object.entries(v).filter(([, x]) => x && typeof x === "object" && typeof x.deger === "number").map(([k, x]) => ({
      anahtar: k, etiket: x.etiket ?? k, deger: x.deger!, min: x.min ?? 0, max: x.max ?? Math.max(10, x.deger! * 2), adim: x.adim ?? (Number.isInteger(x.deger) ? 1 : 0.1),
    }));
    return l.length ? l : null;
  } catch { return null; }
}
