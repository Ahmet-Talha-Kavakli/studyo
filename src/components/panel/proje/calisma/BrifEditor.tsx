"use client";

/**
 * BRİF — Notion dilinde blok editörü (2026-10-29, "A · Notion belgesi").
 * Ortalanmış 720px belge: sayfa simgesi, başlık, özellik satırları; altında bloklar.
 * Bloklar: metin, başlık, alt başlık, madde, numaralı, yapılacak, açılır, alıntı, bilgi kutusu, ayraç, kod, tablo, projeden görsel, element, bağlantı kartı.
 * Sayfa: kapak, simge, düzenlenebilir başlık ve özellikler (durum, teslim, sorumlu, etiketler), şablonlar, sürüm geçmişi,
 * dışa aktarma, yazı tipi / küçük yazı / tam genişlik / kilit, blok renkleri ve blok yorumları (BrifParcalari).
 * Klavye: "/" komut menüsü, "@" element / kişi / tarih, Markdown kısayolları (## - 1. [] > " ---), Enter böler,
 * Backspace birleştirir ya da metne çevirir, ↑↓ bloklar arası, Ctrl+B/I/E/U, Ctrl+Shift+S, Ctrl+K bağlantı, Ctrl+Z / Ctrl+Shift+Z.
 * Seçimde biçim çubuğu, blokta + ve ⋮⋮ (sürükle, tıkla: blok menüsü). Sağda içindekiler. 500 ms sonra kendiliğinden kaydeder;
 * `brief` alanına düz metin karşılığı da yazılır (AI Yönetmen ve istemler onu okur).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign, Bold, Calendar, Heading1, Columns2, Sparkles, ListTree, Search, Underline, ChevronDown, ChevronUp, Replace, Baseline, Check, CheckSquare, ChevronRight, Code, Copy, FileText, GripVertical, Heading2, Heading3, ImageIcon, Italic, Lightbulb, Link2,
  List, ListOrdered, Minus, Plus, Quote, Strikethrough, Trash2, Type, ArrowUp, ArrowDown, Repeat, X,
  CircleDot, Clock, Gauge, History, Lock, MessageSquare, MessageSquarePlus, Palette, Smile, Table2, Tag, Upload, UserRound, Users,
} from "lucide-react";
import { useProje, type BrifBlok, type BrifBlokTur, type BrifOzellik, type BrifSayfa, type BrifSurum, type Proje } from "@/store/useSinema";
import { mesaj } from "@/lib/mesaj";
import { toast } from "@/lib/toast";
import {
  BaglantiBlok, Kapak, KapakSecici, OzellikDegeri, RENKLER, SIMGELER, SablonSecici, SayfaMenusu, SimgeSecici, SurumPaneli, TabloBlok, YorumKutusu, YorumRozeti,
  gorselKucult, renkBul, yazdirmaBelgesi,
} from "./BrifParcalari";
import { useElements } from "@/store/useElements";
import { SECIM_ISLEMLERI, YazPaneli, type YazIslem } from "./BrifYaz";
import { useAuth } from "@/store/useAuth";
import { gorece } from "@/components/panel/projeler/projeVeri";
import { AvatarYigini, BRIF_BOLUMLERI, brifCoz, ease, gorselAdresi, useProjeVarliklari, useUyeler } from "./ortak";
import { cn } from "@/lib/utils";

/* ── Blok türleri ── */
const METINLI: BrifBlokTur[] = ["p", "h1", "h2", "h3", "madde", "numara", "yap", "kutu", "alinti", "acilir", "kod"];
const TURLER: { tur: BrifBlokTur; ad: string; alt: string; ikon: React.ElementType; kisa?: string; grup: "Temel" | "Proje" }[] = [
  { tur: "p", ad: "Metin", alt: "Düz paragraf", ikon: Type, grup: "Temel" },
  { tur: "h1", ad: "Başlık 1", alt: "Büyük bölüm başlığı", ikon: Heading1, kisa: "#", grup: "Temel" },
  { tur: "h2", ad: "Başlık 2", alt: "Bölüm başlığı", ikon: Heading2, kisa: "##", grup: "Temel" },
  { tur: "h3", ad: "Başlık 3", alt: "Küçük başlık", ikon: Heading3, kisa: "###", grup: "Temel" },
  { tur: "madde", ad: "Madde listesi", alt: "Basit liste", ikon: List, kisa: "-", grup: "Temel" },
  { tur: "numara", ad: "Numaralı liste", alt: "Sıralı adımlar", ikon: ListOrdered, kisa: "1.", grup: "Temel" },
  { tur: "yap", ad: "Yapılacak", alt: "Kişi ve tarihle görev", ikon: CheckSquare, kisa: "[]", grup: "Temel" },
  { tur: "acilir", ad: "Açılır liste", alt: "İçeriği gizle ya da göster", ikon: ChevronRight, kisa: ">", grup: "Temel" },
  { tur: "alinti", ad: "Alıntı", alt: "Öne çıkan söz", ikon: Quote, kisa: "\"", grup: "Temel" },
  { tur: "kutu", ad: "Bilgi kutusu", alt: "Dikkat çeken not", ikon: Lightbulb, grup: "Temel" },
  { tur: "ayrac", ad: "Ayraç", alt: "Bölümleri ayır", ikon: Minus, kisa: "---", grup: "Temel" },
  { tur: "kod", ad: "Kod ya da istem", alt: "Tek aralıklı yazı, kopyalanabilir", ikon: Code, kisa: "```", grup: "Temel" },
  { tur: "tablo", ad: "Tablo", alt: "Satır ve sütunlar", ikon: Table2, grup: "Temel" },
  { tur: "icindekiler", ad: "İçindekiler", alt: "Başlıklara hızlı geçiş", ikon: ListTree, grup: "Temel" },
  { tur: "sutun", ad: "Sütunlar", alt: "Yan yana iki ya da üç sütun", ikon: Columns2, grup: "Temel" },
  { tur: "gorsel", ad: "Projeden görsel", alt: "Varlıklardan kare seç", ikon: ImageIcon, grup: "Proje" },
  { tur: "element", ad: "Element", alt: "Karakter, mekân, nesne kartı", ikon: AtSign, grup: "Proje" },
  { tur: "baglanti", ad: "Bağlantı kartı", alt: "Moodboard, senaryo, kılavuz", ikon: Link2, grup: "Proje" },
];
/** Tab ile girintilenebilen bloklar. */
const GIRINTILI: BrifBlokTur[] = ["p", "madde", "numara", "yap", "acilir"];
/** Ctrl Alt 0-8: Notion'daki dönüştürme kısayolları. */
const KISAYOL_TUR: BrifBlokTur[] = ["p", "h1", "h2", "h3", "yap", "madde", "numara", "acilir", "kod"];
const romen = (n: number) => ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"][(n - 1) % 12];
const numaraYaz = (n: number, g: number) => (g % 3 === 1 ? `${String.fromCharCode(96 + ((n - 1) % 26) + 1)}.` : g % 3 === 2 ? `${romen(n)}.` : `${n}.`);
type SlashOge = (typeof TURLER)[number] | { tur: "ai"; ad: string; alt: string; ikon: React.ElementType; kisa?: string; grup: "AI" };
const AI_OGE: SlashOge = { tur: "ai", ad: "Yapay zekâ ile yaz", alt: "Devam et, özetle, fikir üret", ikon: Sparkles, grup: "AI" };
const turAdi = (t: BrifBlokTur) => TURLER.find((x) => x.tur === t)?.ad ?? "Metin";
const yeniId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blok = (tur: BrifBlokTur, metin = "", ek: Partial<BrifBlok> = {}): BrifBlok => ({ id: yeniId(), tur, metin, ...ek });

/* ── Güvenli HTML ── */
const IZINLI = new Set(["B", "STRONG", "I", "EM", "S", "STRIKE", "CODE", "A", "BR", "SPAN", "U"]);
function temizle(html: string): string {
  if (typeof window === "undefined" || !html) return html ?? "";
  const d = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild!;
  const gez = (el: Element) => {
    for (const c of Array.from(el.childNodes)) {
      if (c.nodeType === 3) continue;
      if (c.nodeType !== 1) { c.remove(); continue; }
      const e = c as Element;
      if (!IZINLI.has(e.tagName) || (e.tagName === "SPAN" && !e.getAttribute("data-isaret") && !e.getAttribute("data-renk") && !e.getAttribute("data-zemin"))) { gez(e); e.replaceWith(...Array.from(e.childNodes)); continue; }
      for (const a of Array.from(e.attributes)) {
        const tut = (e.tagName === "A" && a.name === "href" && /^(https?:|mailto:|\/)/.test(a.value)) || (e.tagName === "SPAN" && /^(data-isaret|data-ad|contenteditable|data-renk|data-zemin)$/.test(a.name));
        if (!tut) e.removeAttribute(a.name);
      }
      if (e.tagName === "A") { e.setAttribute("target", "_blank"); e.setAttribute("rel", "noopener"); }
      gez(e);
    }
  };
  gez(d);
  return d.innerHTML.replace(/(<br>)+$/, "");
}
const duzMetin = (html: string) => (typeof window === "undefined" ? html.replace(/<[^>]+>/g, "") : new DOMParser().parseFromString(html || "", "text/html").body.textContent ?? "");
const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── Markdown ↔ blok ── */
export function bloklardanMetin(b: BrifBlok[]): string {
  let n = 0;
  return b.map((x) => {
    const m = duzMetin(x.metin).trim();
    n = x.tur === "numara" ? n + 1 : 0;
    switch (x.tur) {
      case "h1": return `\n# ${m}`;
      case "h2": return `\n## ${m}`;
      case "icindekiler": return "";
      case "sutun": return (x.sutunlar ?? []).map((c) => duzMetin(c).trim()).filter(Boolean).join("\n\n");
      case "h3": return `### ${m}`;
      case "madde": return `${"  ".repeat(x.girinti ?? 0)}- ${m}`;
      case "numara": return `${"  ".repeat(x.girinti ?? 0)}${n}. ${m}`;
      case "yap": return `${"  ".repeat(x.girinti ?? 0)}- [${x.ok ? "x" : " "}] ${m}`;
      case "kutu": case "alinti": return `> ${m}`;
      case "ayrac": return "---";
      case "gorsel": return (x.src ?? []).map((s) => `![](${s})`).join(" ");
      case "element": return (x.elementler ?? []).map((e) => `@${e}`).join(", ");
      case "acilir": return `${m}\n${duzMetin(x.ic ?? "").trim()}`;
      case "kod": return "```\n" + duzMetin((x.metin ?? "").replace(/<br\s*\/?>/g, "\n")).trim() + "\n```";
      case "tablo": { const t = x.tablo ?? []; return t.length ? [`| ${t[0].join(" | ")} |`, `|${t[0].map(() => " --- ").join("|")}|`, ...t.slice(1).map((r) => `| ${r.join(" | ")} |`)].join("\n") : ""; }
      case "baglanti": return x.url ?? "";
      default: return m;
    }
  }).filter((s) => s.trim()).join("\n").trim();
}
/** Markdown satırlarından bloklar (yapıştırma ve yapay zekâ sonucu): başlık, liste, görev, alıntı, girinti. */
function mdBloklar(t: string): BrifBlok[] {
  return t.replace(/\r/g, "").split("\n").filter((s) => s.trim()).map((s) => {
    const g = Math.min(3, Math.floor((s.match(/^\s*/)?.[0].length ?? 0) / 2));
    const z = s.trim().replace(/\*\*(.+?)\*\*/g, "$1");
    const gi = g ? { girinti: g } : {};
    const yap = z.match(/^[-*] \[( |x)\] (.*)$/i);
    if (yap) return blok("yap", kacis(yap[2]), { ok: yap[1].toLowerCase() === "x" || undefined, ...gi });
    if (/^### /.test(z)) return blok("h3", kacis(z.slice(4)));
    if (/^## /.test(z)) return blok("h2", kacis(z.slice(3)));
    if (/^# /.test(z)) return blok("h1", kacis(z.slice(2)));
    if (/^[-*•] /.test(z)) return blok("madde", kacis(z.slice(2)), gi);
    if (/^\d+[.)] /.test(z)) return blok("numara", kacis(z.replace(/^\d+[.)] /, "")), gi);
    if (/^> /.test(z)) return blok("alinti", kacis(z.slice(2)));
    if (z === "---") return blok("ayrac");
    return blok("p", kacis(z));
  });
}
function metindenBloklar(md?: string): BrifBlok[] {
  const bolum = brifCoz(md);
  const out: BrifBlok[] = [];
  for (const b of BRIF_BOLUMLERI) {
    out.push(blok("h2", b.ad));
    const satirlar = (bolum[b.ad] ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (!satirlar.length) { out.push(blok("p", "", { ipucu: b.ipucu })); continue; }
    for (const s of satirlar) {
      const yap = s.match(/^- \[( |x)\] (.*)$/i);
      if (yap) out.push(blok("yap", kacis(yap[2]), { ok: yap[1].toLowerCase() === "x" }));
      else if (/^[-*] /.test(s)) out.push(blok("madde", kacis(s.slice(2))));
      else if (/^\d+\. /.test(s)) out.push(blok("numara", kacis(s.replace(/^\d+\. /, ""))));
      else if (/^> /.test(s)) out.push(blok("kutu", kacis(s.slice(2))));
      else if (/^### /.test(s)) out.push(blok("h3", kacis(s.slice(4))));
      else out.push(blok("p", kacis(s)));
    }
  }
  return out;
}

/* ── İmleç yardımcıları ── */
function imlecOfseti(el: HTMLElement): number {
  const s = window.getSelection();
  if (!s?.rangeCount || !el.contains(s.anchorNode)) return 0;
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(el);
  r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return r.toString().length;
}
function imleciKoy(el: HTMLElement, konum: "bas" | "son" | number) {
  el.focus();
  const s = window.getSelection();
  if (!s) return;
  const r = document.createRange();
  if (konum === "bas" || konum === "son") { r.selectNodeContents(el); r.collapse(konum === "bas"); }
  else {
    let kalan = konum, bulundu = false;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const t = w.currentNode as Text;
      if (kalan <= t.length) { r.setStart(t, kalan); r.collapse(true); bulundu = true; break; }
      kalan -= t.length;
    }
    if (!bulundu) { r.selectNodeContents(el); r.collapse(false); }
  }
  s.removeAllRanges();
  s.addRange(r);
}
function imlecBasta(el: HTMLElement) { const s = window.getSelection(); return !!s?.isCollapsed && imlecOfseti(el) === 0; }
function imlecSonda(el: HTMLElement) { const s = window.getSelection(); return !!s?.isCollapsed && imlecOfseti(el) >= (el.textContent ?? "").length; }
function satirKonumu(el: HTMLElement): { ilk: boolean; son: boolean } {
  const s = window.getSelection();
  if (!s?.rangeCount) return { ilk: true, son: true };
  const r = s.getRangeAt(0).getClientRects()[0];
  const e = el.getBoundingClientRect();
  if (!r) return { ilk: true, son: true };
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
  return { ilk: r.top - e.top < lh * 0.8, son: e.bottom - r.bottom < lh * 0.8 };
}
/** İmleçten sonrasını ayırıp HTML olarak döndürür; öğede öncesi kalır. */
function imlectenBol(el: HTMLElement): string {
  const s = window.getSelection();
  if (!s?.rangeCount) return "";
  const r = s.getRangeAt(0);
  r.deleteContents();
  const son = document.createRange();
  son.selectNodeContents(el);
  son.setStart(r.endContainer, r.endOffset);
  const d = document.createElement("div");
  d.appendChild(son.extractContents());
  return temizle(d.innerHTML);
}
function imlecKutusu(kap: HTMLElement): { x: number; y: number } | null {
  const s = window.getSelection();
  if (!s?.rangeCount) return null;
  const r = s.getRangeAt(0).cloneRange();
  let k = r.getClientRects()[0];
  if (!k) { const n = (s.anchorNode?.nodeType === 1 ? s.anchorNode : s.anchorNode?.parentElement) as HTMLElement | null; k = n?.getBoundingClientRect() as DOMRect; }
  if (!k) return null;
  const c = kap.getBoundingClientRect();
  return { x: k.left - c.left, y: k.bottom - c.top };
}

type Menu = { tur: "slash" | "isaret"; blokId: string; bas: number; q: string; x: number; y: number; i: number } | null;

export function BrifEditor({ p }: { p: Proje }) {
  const kullanici = useAuth((s) => s.kullanici);
  const uyeler = useUyeler(p);
  const varliklar = useProjeVarliklari(p);
  const tumEl = useElements((s) => s.elementler);
  const projeEl = useMemo(() => {
    const ad = new Set((p.elementler ?? []).map((e) => e.ad.toLocaleLowerCase("tr")));
    return tumEl.filter((e) => e.projeId === p.id || ad.has(e.ad.toLocaleLowerCase("tr")));
  }, [tumEl, p]);

  const [bloklar, setBloklarHam] = useState<BrifBlok[]>(() => (p.brifBloklar?.length ? p.brifBloklar : metindenBloklar(p.brief)));
  const [surum, setSurum] = useState(0); // dışarıdan (geri al, dönüştür) değişince editörlerin içeriğini yeniden yaz
  const [durum, setDurum] = useState<"kayitli" | "yaziliyor">("kayitli");
  const [menu, setMenu] = useState<Menu>(null);
  const [blokMenu, setBlokMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [cubuk, setCubuk] = useState<{ x: number; y: number; link?: boolean; blokId?: string; alt?: "donustur" | "renk" | "ai" } | null>(null);
  const [secim, setSecim] = useState<string[]>([]);
  const [secimMenu, setSecimMenu] = useState(false);
  const [yaz, setYaz] = useState<{ blokId: string; islem?: YazIslem; secim?: string; aralik?: Range } | null>(null);
  const [kement, setKement] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [bul, setBul] = useState<{ q: string; d: string; i: number; degistir: boolean } | null>(null);
  const bulAralik = useRef<Range[]>([]);
  const [bulSayi, setBulSayi] = useState(0);
  const bulGirdi = useRef<HTMLInputElement>(null);
  const [surukle, setSurukle] = useState<{ id: string; hedef: number } | null>(null);
  const [odakId, setOdakId] = useState<string | null>(null);
  const [surumAcik, setSurumAcik] = useState(false);
  const [simgeAcik, setSimgeAcik] = useState(false);
  const [kapakAcik, setKapakAcik] = useState(false);
  const [sablonGec, setSablonGec] = useState(false);
  const [yorum, setYorum] = useState<{ id: string; x: number; y: number } | null>(null);
  const sayfa: BrifSayfa = p.brifSayfa ?? {};
  const ozellik: BrifOzellik = p.brifOzellik ?? {};
  const sayfaGuncelle = (x: Partial<BrifSayfa>) => useProje.getState().projeGuncelle(p.id, { brifSayfa: { ...(useProje.getState().projeler.find((y) => y.id === p.id)?.brifSayfa ?? {}), ...x } });
  const ozellikGuncelle = (x: Partial<BrifOzellik>) => useProje.getState().projeGuncelle(p.id, { brifOzellik: { ...(useProje.getState().projeler.find((y) => y.id === p.id)?.brifOzellik ?? {}), ...x } });
  const kapRef = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  const bekleyenOdak = useRef<{ id: string; konum: "bas" | "son" | number } | null>(null);
  const gecmis = useRef<{ geri: BrifBlok[][]; ileri: BrifBlok[][] }>({ geri: [], ileri: [] });
  const sonAnlik = useRef<BrifBlok[]>(bloklar);
  const anlikZaman = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Kayıt: 500 ms sonra store'a; geçmiş anlıkları 700 ms durakladıkça */
  const kayitZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kaydet = useCallback((b: BrifBlok[]) => {
    setDurum("yaziliyor");
    if (kayitZaman.current) clearTimeout(kayitZaman.current);
    kayitZaman.current = setTimeout(() => {
      const kim = kullanici?.ad ?? "Sen", simdi = Date.now();
      const eski = useProje.getState().projeler.find((x) => x.id === p.id)?.brifSurumleri ?? [];
      const anlik = !eski.length || simdi - eski[0].zaman > 10 * 60e3;
      useProje.getState().projeGuncelle(p.id, { brifBloklar: b, brief: bloklardanMetin(b), brifDuzenleme: { kim, zaman: simdi },
        ...(anlik ? { brifSurumleri: [{ id: yeniId(), zaman: simdi, kim, bloklar: b }, ...eski].slice(0, 30) } : {}) });
      setDurum("kayitli");
    }, 500);
  }, [p.id, kullanici]);
  const setBloklar = useCallback((f: (b: BrifBlok[]) => BrifBlok[], yapisal = false) => {
    setBloklarHam((once) => {
      const yeni = f(once);
      if (yapisal) { gecmis.current.geri.push(sonAnlik.current); gecmis.current.ileri = []; sonAnlik.current = yeni; }
      else {
        if (anlikZaman.current) clearTimeout(anlikZaman.current);
        anlikZaman.current = setTimeout(() => { gecmis.current.geri.push(sonAnlik.current); gecmis.current.ileri = []; sonAnlik.current = yeni; if (gecmis.current.geri.length > 80) gecmis.current.geri.shift(); }, 700);
      }
      kaydet(yeni);
      return yeni;
    });
  }, [kaydet]);
  useEffect(() => () => { if (kayitZaman.current) clearTimeout(kayitZaman.current); }, []);

  const geriAl = (ileri = false) => {
    const g = gecmis.current;
    const kaynak = ileri ? g.ileri : g.geri;
    const hedef = kaynak.pop();
    if (!hedef) return;
    (ileri ? g.geri : g.ileri).push(bloklar);
    sonAnlik.current = hedef;
    setBloklarHam(hedef);
    setSurum((v) => v + 1);
    kaydet(hedef);
  };

  /* Seçili bloklarla klavye: ok, Shift ok, sil, kopyala, kes, çoğalt, girinti, Enter ile düzenle */
  useEffect(() => {
    if (!secim.length) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.("input, textarea, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const idx = secim.map((id) => bloklar.findIndex((b) => b.id === id)).filter((i) => i >= 0).sort((a, b) => a - b);
      const ilk = idx[0], son = idx[idx.length - 1];
      if (e.key === "Escape") { e.preventDefault(); setSecim([]); setSecimMenu(false); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const yon = e.key === "ArrowDown" ? 1 : -1;
        if (e.shiftKey) { const uc = yon > 0 ? son + 1 : ilk - 1; if (uc >= 0 && uc < bloklar.length) setSecim((s) => [...s, bloklar[uc].id]); }
        else { const j = Math.max(0, Math.min(bloklar.length - 1, (yon > 0 ? son : ilk) + yon)); setSecim([bloklar[j].id]); document.querySelector(`[data-satir="${bloklar[j].id}"]`)?.scrollIntoView({ block: "nearest" }); }
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); topluSil(); return; }
      if (e.key === "Enter") { e.preventDefault(); const x = bloklar[ilk]; setSecim([]); if (x && METINLI.includes(x.tur)) odakla(x.id, "son"); return; }
      if (e.key === "Tab") { e.preventDefault(); girintile(secim, e.shiftKey ? -1 : 1); return; }
      if (mod && e.key.toLowerCase() === "a") { e.preventDefault(); setSecim(bloklar.map((b) => b.id)); return; }
      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); void topluKopyala(); return; }
      if (mod && e.key.toLowerCase() === "x") { e.preventDefault(); void topluKopyala().then(topluSil); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); topluCogalt(); return; }
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); geriAl(e.shiftKey); setSecim([]); return; }
    };
    const tik = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest?.("[data-secim-cubugu]")) { setSecim([]); setSecimMenu(false); } };
    window.addEventListener("keydown", k);
    window.addEventListener("mousedown", tik);
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("mousedown", tik); };
  });

  /* Sayfada bul (Ctrl F): CSS Highlight ile metne dokunmadan işaretler */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const sec = window.getSelection()?.toString().trim().slice(0, 60);
        setBul((b) => ({ q: sec || b?.q || "", d: b?.d ?? "", i: 0, degistir: b?.degistir ?? false }));
        setTimeout(() => { bulGirdi.current?.focus(); bulGirdi.current?.select(); }, 30);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    const reg = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    const H = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    reg?.delete("brif-bul"); reg?.delete("brif-bul-aktif");
    const q = bul?.q.trim().toLocaleLowerCase("tr");
    if (!q) { bulAralik.current = []; setBulSayi(0); return; }
    const l: Range[] = [];
    for (const b of bloklar) for (const anahtar of [b.id, `${b.id}:ic`, `${b.id}:s0`, `${b.id}:s1`, `${b.id}:s2`]) {
      const el = refs.current.get(anahtar);
      if (!el) continue;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const t = w.currentNode as Text, m = (t.textContent ?? "").toLocaleLowerCase("tr");
        let i = m.indexOf(q);
        while (i >= 0) { const rg = document.createRange(); rg.setStart(t, i); rg.setEnd(t, i + q.length); l.push(rg); i = m.indexOf(q, i + q.length); }
      }
    }
    bulAralik.current = l; setBulSayi(l.length);
    const a = l[Math.min(bul!.i, l.length - 1)];
    if (H && reg) { reg.set("brif-bul", new H(...l)); if (a) reg.set("brif-bul-aktif", new H(a)); }
    if (a) { const k = a.getBoundingClientRect(); if (k.top < 120 || k.bottom > window.innerHeight - 80) window.scrollTo({ top: window.scrollY + k.top - window.innerHeight / 2, behavior: "smooth" }); }
  }, [bul, bloklar, surum]);
  useEffect(() => () => { const reg = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights; reg?.delete("brif-bul"); reg?.delete("brif-bul-aktif"); }, []);
  const bulGit = (yon: 1 | -1) => { if (!bul || !bulSayi) return; setBul({ ...bul, i: (bul.i + yon + bulSayi) % bulSayi }); };
  /** Düzenlenebilir alanın içeriğini doğru yere yazar: metin, açılır içerik ya da sütun. */
  const bulBlokGuncelle = (el: HTMLElement) => {
    const id = el.getAttribute("data-blok");
    if (!id) return;
    const html = temizle(el.innerHTML);
    if (refs.current.get(`${id}:ic`) === el) { guncelle(id, { ic: html }, true); return; }
    for (let i = 0; i < 3; i++) if (refs.current.get(`${id}:s${i}`) === el) { setBloklar((b) => b.map((y) => { if (y.id !== id) return y; const l = [...(y.sutunlar ?? ["", ""])]; l[i] = html; return { ...y, sutunlar: l }; }), true); return; }
    guncelle(id, { metin: html }, true);
  };
  /* Çerçeveyle seçim: boş alandan sürükle, değdiği bloklar seçilir */
  const kementBasla = (e: React.MouseEvent) => {
    if (e.button !== 0 || kilit) return;
    const t = e.target as HTMLElement;
    if (t.closest("[contenteditable=true], button, input, textarea, select, a, label, figure, table, nav, dl, [data-secim-cubugu]")) return;
    const kap = kapRef.current;
    if (!kap) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY + window.scrollY;
    let basladi = false;
    const hareket = (ev: MouseEvent) => {
      const y1 = ev.clientY + window.scrollY;
      if (!basladi && Math.abs(ev.clientX - x0) + Math.abs(y1 - y0) < 6) return;
      if (!basladi) { basladi = true; window.getSelection()?.removeAllRanges(); (document.activeElement as HTMLElement | null)?.blur?.(); setCubuk(null); setMenu(null); }
      const k = kap.getBoundingClientRect();
      const ust = Math.min(y0, y1) - window.scrollY, alt = Math.max(y0, y1) - window.scrollY;
      setKement({ x: Math.min(x0, ev.clientX) - k.left, y: ust - k.top, w: Math.abs(ev.clientX - x0), h: alt - ust });
      setSecim(bloklar.filter((b) => { const rc = document.querySelector(`[data-satir="${b.id}"]`)?.getBoundingClientRect(); return !!rc && rc.bottom > ust && rc.top < alt; }).map((b) => b.id));
    };
    const bitir = () => { window.removeEventListener("mousemove", hareket); window.removeEventListener("mouseup", bitir); setKement(null); };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", bitir);
  };
  /* Yapay zekâ sonucu: bloklar olarak ekle ya da seçimin yerine koy */
  const yazEkle = (metin: string) => {
    if (!yaz || !metin) return;
    const yeni = mdBloklar(metin);
    if (!yeni.length) return;
    const hedef = bloklar.find((b) => b.id === yaz.blokId);
    const bosHedef = hedef && hedef.tur === "p" && !duzMetin(hedef.metin).trim();
    setBloklar((b) => { const i = b.findIndex((y) => y.id === yaz.blokId); const n = [...b]; n.splice(bosHedef ? i : i + 1, bosHedef ? 1 : 0, ...yeni); return n; }, true);
    setSurum((v) => v + 1); setYaz(null);
    odakla(yeni[yeni.length - 1].id, "son");
    toast.success(yeni.length > 1 ? `${yeni.length} blok eklendi` : "Eklendi", { action: { label: "Geri al", onClick: () => geriAl() } });
  };
  const yazDegistir = (metin: string) => {
    const a = yaz?.aralik;
    if (!a || !metin) return;
    const s = window.getSelection();
    s?.removeAllRanges(); s?.addRange(a);
    const el = ((a.commonAncestorContainer.nodeType === 1 ? a.commonAncestorContainer : a.commonAncestorContainer.parentElement) as HTMLElement | null)?.closest("[data-blok]") as HTMLElement | null;
    a.deleteContents(); a.insertNode(document.createTextNode(metin.replace(/\s*\n+\s*/g, " ")));
    if (el) { el.normalize(); bulBlokGuncelle(el); }
    setYaz(null);
  };
  const degistir = (hepsi: boolean) => {
    if (!bul || !bulSayi || kilit) return;
    const l = hepsi ? [...bulAralik.current].reverse() : [bulAralik.current[Math.min(bul.i, bulSayi - 1)]];
    const els = new Set<HTMLElement>();
    for (const rg of l) {
      const el = (rg.startContainer.parentElement)?.closest("[data-blok]") as HTMLElement | null;
      if (!el) continue;
      rg.deleteContents(); rg.insertNode(document.createTextNode(bul.d)); els.add(el);
    }
    els.forEach((el) => { el.normalize(); bulBlokGuncelle(el); });
    if (hepsi) toast.success(`${l.length} yer değiştirildi`, { action: { label: "Geri al", onClick: () => geriAl() } });
  };

  /* Bloğa bağlantı: #blok-kimliği ile açılınca o bloğa iner ve vurgular */
  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h || !bloklar.some((b) => b.id === h)) return;
    const t = setTimeout(() => { document.querySelector(`[data-satir="${h}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }); setSecim([h]); }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const blokBaglantisi = (id: string) => void mesaj.kopyala(`${location.origin}/panel/projeler/${p.id}?s=brif#${id}`, "Blok bağlantısı");

  /* Odak isteği: render sonrası */
  useLayoutEffect(() => {
    const o = bekleyenOdak.current;
    if (!o) return;
    const el = refs.current.get(o.id);
    if (el) { imleciKoy(el, o.konum); bekleyenOdak.current = null; }
  });
  /* Odak her zaman bir sonraki çizimden sonra uygulanır: blok türü değişince öğe yeniden kurulur, eski öğeye odaklanmak imleci kaybettirir. */
  const [, setTik] = useState(0);
  const odakla = (id: string, konum: "bas" | "son" | number) => { bekleyenOdak.current = { id, konum }; setTik((t) => t + 1); };

  const guncelle = (id: string, patch: Partial<BrifBlok>, yapisal = false) => setBloklar((b) => b.map((x) => (x.id === id ? { ...x, ...patch, ipucu: patch.metin ? undefined : x.ipucu } : x)), yapisal);
  const ekleSonra = (id: string, yeni: BrifBlok | BrifBlok[]) => setBloklar((b) => { const i = b.findIndex((x) => x.id === id); const n = [...b]; n.splice(i + 1, 0, ...(Array.isArray(yeni) ? yeni : [yeni])); return n; }, true);
  const sil = (id: string) => setBloklar((b) => (b.length > 1 ? b.filter((x) => x.id !== id) : [blok("p")]), true);
  const donustur = (id: string, tur: BrifBlokTur) => {
    const x = bloklar.find((b) => b.id === id);
    if (!x) return;
    if (tur === "ayrac") { const yeni = blok("p"); setBloklar((b) => { const i = b.findIndex((y) => y.id === id); const n = [...b]; n.splice(i, 1, { ...x, tur: "ayrac", metin: "" }, yeni); return n; }, true); setSurum((v) => v + 1); odakla(yeni.id, "bas"); return; }
    setBloklar((b) => b.map((y) => (y.id === id ? { ...y, tur, ipucu: undefined, ...(tur === "gorsel" ? { src: y.src ?? [] } : {}), ...(tur === "element" ? { elementler: y.elementler ?? [] } : {}), ...(tur === "acilir" ? { acik: true } : {}), ...(tur === "tablo" && !y.tablo ? { tablo: [["Başlık", "Başlık", "Başlık"], ["", "", ""], ["", "", ""]] } : {}), ...(tur === "sutun" && !y.sutunlar ? { sutunlar: [y.metin || "", ""] } : {}) } : y)), true);
    setSurum((v) => v + 1);
    if (METINLI.includes(tur)) odakla(id, "son");
    else if (tur === "sutun") odakla(`${id}:s0`, "son");
  };
  const tasi = (id: string, yon: -1 | 1) => setBloklar((b) => { const i = b.findIndex((x) => x.id === id); const j = i + yon; if (j < 0 || j >= b.length) return b; const n = [...b]; [n[i], n[j]] = [n[j], n[i]]; return n; }, true);
  const cogalt = (id: string) => { const x = bloklar.find((b) => b.id === id); if (x) ekleSonra(id, { ...x, id: yeniId(), yorumlar: undefined }); setSurum((v) => v + 1); };
  /** Tab / Shift Tab: bir önceki bloğun en çok bir düzey altına girer. */
  const girintile = (ids: string[], yon: 1 | -1) => setBloklar((b) => {
    const n = [...b];
    for (let i = 0; i < n.length; i++) {
      const y = n[i];
      if (!ids.includes(y.id) || !GIRINTILI.includes(y.tur)) continue;
      const g = y.girinti ?? 0;
      const sinir = i > 0 ? Math.min(3, (n[i - 1].girinti ?? 0) + 1) : 0;
      const yeni = yon < 0 ? Math.max(0, g - 1) : Math.min(sinir, g + 1);
      n[i] = { ...y, girinti: yeni || undefined };
    }
    return n;
  }, true);
  /* Çoklu blok seçimi (Esc, Shift ok, Ctrl A) */
  const secimYap = (ids: string[]) => { (document.activeElement as HTMLElement | null)?.blur?.(); window.getSelection()?.removeAllRanges(); setSecim(ids); setCubuk(null); setMenu(null); setBlokMenu(null); };
  const seciliBloklar = () => bloklar.filter((b) => secim.includes(b.id));
  const topluSil = () => {
    const n = secim.length;
    setBloklar((b) => { const k = b.filter((x) => !secim.includes(x.id)); return k.length ? k : [blok("p")]; }, true);
    setSurum((v) => v + 1); setSecim([]); setSecimMenu(false);
    toast.success(n > 1 ? `${n} blok silindi` : "Blok silindi", { action: { label: "Geri al", onClick: () => geriAl() } });
  };
  const topluKopyala = async () => { const l = seciliBloklar(); try { await navigator.clipboard.writeText(bloklardanMetin(l)); toast.success(l.length > 1 ? `${l.length} blok kopyalandı` : "Blok kopyalandı", { description: "Markdown olarak panoda." }); } catch { toast.error("Kopyalanamadı"); } };
  const topluCogalt = () => {
    setBloklar((b) => { const sec = b.filter((x) => secim.includes(x.id)); const son = Math.max(...secim.map((id) => b.findIndex((x) => x.id === id))); const n = [...b]; n.splice(son + 1, 0, ...sec.map((x) => ({ ...x, id: yeniId(), yorumlar: undefined }))); return n; }, true);
    setSurum((v) => v + 1);
  };
  const topluDonustur = (tur: BrifBlokTur) => { setBloklar((b) => b.map((y) => (secim.includes(y.id) && METINLI.includes(y.tur) ? { ...y, tur, ipucu: undefined, ...(tur === "acilir" ? { acik: true } : {}) } : y)), true); setSurum((v) => v + 1); setSecimMenu(false); };
  const topluRenk = (renk: BrifBlok["renk"], zemin?: boolean) => { setBloklar((b) => b.map((y) => (secim.includes(y.id) ? { ...y, renk, zemin: renk ? zemin : undefined } : y)), true); setSecimMenu(false); };

  /* Numaralı listelerin sırası */
  const numaralar = useMemo(() => {
    const m = new Map<string, number>(); const say = [0, 0, 0, 0];
    for (const x of bloklar) {
      const d = x.girinti ?? 0;
      for (let k = d + 1; k < 4; k++) say[k] = 0;
      if (x.tur === "numara") { say[d] += 1; m.set(x.id, say[d]); } else say[d] = 0;
    }
    return m;
  }, [bloklar]);

  /* Doluluk: 7 bölümün her birinde metin var mı */
  const doluluk = useMemo(() => {
    const dolu = new Set<string>();
    let aktif = "";
    for (const x of bloklar) {
      if (x.tur === "h2") { aktif = duzMetin(x.metin).trim(); continue; }
      if (aktif && (duzMetin(x.metin).trim() || x.src?.length || x.elementler?.length)) dolu.add(aktif.toLocaleLowerCase("tr"));
    }
    return BRIF_BOLUMLERI.map((b) => dolu.has(b.ad.toLocaleLowerCase("tr")));
  }, [bloklar]);

  /* ── Menü öğeleri ── */
  const slashOgeleri = useMemo((): SlashOge[] => {
    if (menu?.tur !== "slash") return [];
    const q = menu.q.toLocaleLowerCase("tr");
    const l = [AI_OGE, ...TURLER].filter((t) => !q || t.ad.toLocaleLowerCase("tr").includes(q) || t.alt.toLocaleLowerCase("tr").includes(q) || (t.tur === "ai" && /^(ai|yz|yap|zek|yaz)/.test(q)));
    /* Adı sorguyla başlayan önce, sonra adında geçen, en son yalnız açıklamada geçen */
    const puan = (t: SlashOge) => { const ad = t.ad.toLocaleLowerCase("tr"); return !q ? 0 : ad.startsWith(q) ? 0 : ad.includes(q) ? 1 : 2; };
    return q ? [...l].sort((x, y) => puan(x) - puan(y)) : l;
  }, [menu]);
  const isaretOgeleri = useMemo(() => {
    if (menu?.tur !== "isaret") return [];
    const q = menu.q.toLocaleLowerCase("tr");
    const bugun = new Date();
    const gun = (n: number) => { const d = new Date(bugun); d.setDate(d.getDate() + n); return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }); };
    const l: { tur: "el" | "kisi" | "tarih"; ad: string; alt: string; gorsel?: string; renk?: string }[] = [
      ...projeEl.map((e) => ({ tur: "el" as const, ad: e.ad, alt: e.tur === "mekan" ? "Mekân" : e.tur === "obje" ? "Nesne" : e.tur === "stil" ? "Stil" : "Karakter", gorsel: e.gorseller[0] })),
      ...uyeler.map((u) => ({ tur: "kisi" as const, ad: u.ad.replace(" (sen)", ""), alt: "Üye", renk: u.renk })),
      { tur: "tarih", ad: gun(0), alt: "Bugün" }, { tur: "tarih", ad: gun(1), alt: "Yarın" }, { tur: "tarih", ad: gun(7), alt: "Gelecek hafta" },
    ];
    return l.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q) || x.alt.toLocaleLowerCase("tr").includes(q)).slice(0, 9);
  }, [menu, projeEl, uyeler]);
  const menuUzunluk = menu?.tur === "slash" ? slashOgeleri.length : isaretOgeleri.length;

  /** Menüde yazılan "/sorgu" ya da "@sorgu" metnini bloktan sil. */
  const sorguyuSil = (el: HTMLElement, bas: number) => {
    const son = imlecOfseti(el);
    const s = window.getSelection();
    if (!s) return;
    imleciKoy(el, bas);
    const r = s.getRangeAt(0);
    const sonR = document.createRange();
    let kalan = son, bulundu = false;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode as Text; if (kalan <= t.length) { sonR.setStart(t, kalan); bulundu = true; break; } kalan -= t.length; }
    if (!bulundu) return;
    r.setEnd(sonR.startContainer, sonR.startOffset);
    r.deleteContents();
  };
  const slashSec = (i: number) => {
    if (!menu) return;
    const t = slashOgeleri[i];
    const el = refs.current.get(menu.blokId);
    setMenu(null);
    if (!t || !el) return;
    sorguyuSil(el, menu.bas);
    const metin = temizle(el.innerHTML);
    if (t.tur === "ai") { guncelle(menu.blokId, { metin }); setYaz({ blokId: menu.blokId }); return; }
    if (!duzMetin(metin).trim()) { guncelle(menu.blokId, { metin: "" }); donustur(menu.blokId, t.tur); }
    else {
      guncelle(menu.blokId, { metin });
      const yeni = blok(t.tur, "", t.tur === "gorsel" ? { src: [] } : t.tur === "element" ? { elementler: [] } : t.tur === "acilir" ? { acik: true } : t.tur === "sutun" ? { sutunlar: ["", ""] } : {});
      ekleSonra(menu.blokId, t.tur === "ayrac" ? [yeni, blok("p")] : yeni);
      if (METINLI.includes(t.tur)) odakla(yeni.id, "bas");
      else if (t.tur === "sutun") odakla(`${yeni.id}:s0`, "bas");
    }
  };
  const isaretSec = (i: number) => {
    if (!menu) return;
    const x = isaretOgeleri[i];
    const el = refs.current.get(menu.blokId);
    setMenu(null);
    if (!x || !el) return;
    sorguyuSil(el, menu.bas);
    const s = window.getSelection();
    if (!s?.rangeCount) return;
    const span = document.createElement("span");
    span.setAttribute("data-isaret", x.tur);
    span.setAttribute("data-ad", x.ad);
    span.setAttribute("contenteditable", "false");
    span.textContent = x.tur === "tarih" ? x.ad : `@${x.ad}`;
    const r = s.getRangeAt(0);
    r.insertNode(span);
    const bosluk = document.createTextNode(" ");
    span.after(bosluk);
    r.setStartAfter(bosluk); r.collapse(true);
    s.removeAllRanges(); s.addRange(r);
    guncelle(menu.blokId, { metin: temizle(el.innerHTML) });
  };

  /* Seçim biçim çubuğu */
  useEffect(() => {
    const f = () => {
      const s = window.getSelection();
      const kap = kapRef.current;
      if (!s || s.isCollapsed || !s.rangeCount || !kap || !kap.contains(s.anchorNode)) { setCubuk((c) => (c?.link ? c : null)); return; }
      const k = s.getRangeAt(0).getBoundingClientRect();
      const c = kap.getBoundingClientRect();
      if (!k.width) return;
      const n = (s.anchorNode?.nodeType === 1 ? s.anchorNode : s.anchorNode?.parentElement) as HTMLElement | null;
      setCubuk((o) => ({ x: k.left - c.left + k.width / 2, y: k.top - c.top, blokId: n?.closest("[data-blok]")?.getAttribute("data-blok") ?? undefined, alt: o?.alt }));
    };
    document.addEventListener("selectionchange", f);
    return () => document.removeEventListener("selectionchange", f);
  }, []);
  const bicim = (k: "bold" | "italic" | "strikeThrough" | "underline" | "code") => {
    const s = window.getSelection();
    if (!s?.rangeCount) return;
    if (k === "code") {
      const r = s.getRangeAt(0);
      const ust = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement) as HTMLElement;
      const kod = ust.closest("code");
      if (kod) kod.replaceWith(...Array.from(kod.childNodes));
      else { const c = document.createElement("code"); c.appendChild(r.extractContents()); r.insertNode(c); }
    } else document.execCommand(k);
    const blokEl = (s.anchorNode?.nodeType === 1 ? s.anchorNode : s.anchorNode?.parentElement) as HTMLElement | null;
    const duz = blokEl?.closest("[data-blok]") as HTMLElement | null;
    if (duz) bulBlokGuncelle(duz);
  };
  /** Seçili metne yazı rengi ya da vurgu (Notion'daki gibi); null kaldırır. */
  const renkUygula = (alan: "renk" | "zemin", id: BrifBlok["renk"] | null) => {
    const s = window.getSelection();
    if (!s?.rangeCount || s.isCollapsed) return;
    const rg = s.getRangeAt(0);
    const attr = alan === "renk" ? "data-renk" : "data-zemin";
    const frag = rg.extractContents();
    frag.querySelectorAll(`span[${attr}]`).forEach((sp) => { sp.removeAttribute(attr); if (!sp.getAttribute("data-renk") && !sp.getAttribute("data-zemin") && !sp.getAttribute("data-isaret")) sp.replaceWith(...Array.from(sp.childNodes)); });
    let dugum: Node = frag;
    if (id) { const sp = document.createElement("span"); sp.setAttribute(attr, id); sp.appendChild(frag); dugum = sp; }
    const ilk = dugum.nodeType === 11 ? dugum.firstChild : dugum, son = dugum.nodeType === 11 ? dugum.lastChild : dugum;
    rg.insertNode(dugum);
    if (ilk && son) { const y = document.createRange(); y.setStartBefore(ilk); y.setEndAfter(son); s.removeAllRanges(); s.addRange(y); }
    const blokEl = (ilk?.parentElement ?? (rg.commonAncestorContainer as HTMLElement)).closest?.("[data-blok]") as HTMLElement | null;
    if (blokEl) bulBlokGuncelle(blokEl);
    setCubuk((c) => (c ? { ...c, alt: undefined } : c));
  };
  const kayitliSecim = useRef<Range | null>(null);
  const baglantiEkle = (url: string) => {
    const r = kayitliSecim.current;
    setCubuk(null);
    if (!r || !url.trim()) return;
    const s = window.getSelection();
    s?.removeAllRanges(); s?.addRange(r);
    const tam = /^(https?:|mailto:|\/)/.test(url) ? url : `https://${url}`;
    document.execCommand("createLink", false, tam);
    const blokEl = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement) as HTMLElement;
    const duz = blokEl.closest("[data-blok]") as HTMLElement | null;
    if (duz) bulBlokGuncelle(duz);
  };

  /* ── Klavye ── */
  const tus = (x: BrifBlok, e: React.KeyboardEvent<HTMLElement>, alan: string = "metin") => {
    const el = e.currentTarget;
    const i = bloklar.findIndex((b) => b.id === x.id);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); geriAl(e.shiftKey); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); geriAl(true); return; }
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); bicim("bold"); return; }
    if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); bicim("italic"); return; }
    if (mod && e.key.toLowerCase() === "u") { e.preventDefault(); bicim("underline"); return; }
    if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); bicim("code"); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); bicim("strikeThrough"); return; }
    if (mod && e.altKey && /^Digit[0-8]$/.test(e.code)) { e.preventDefault(); donustur(x.id, KISAYOL_TUR[Number(e.code.slice(5))]); return; }
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "d") { e.preventDefault(); cogalt(x.id); return; }
    if (mod && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); const o = imlecOfseti(el); tasi(x.id, e.key === "ArrowUp" ? -1 : 1); setSurum((v) => v + 1); odakla(x.id, o); return; }
    if (mod && e.key === "Enter" && x.tur !== "kod" && alan === "metin") { e.preventDefault(); if (x.tur === "yap") guncelle(x.id, { ok: !x.ok }, true); else if (x.tur === "acilir") guncelle(x.id, { acik: !x.acik }, true); return; }
    if (mod && e.key.toLowerCase() === "a" && alan === "metin") { const t = el.textContent ?? ""; const sec = window.getSelection()?.toString() ?? ""; if (!t.length || sec.length >= t.length) { e.preventDefault(); secimYap(bloklar.map((b) => b.id)); return; } }
    if (e.key === "Escape" && !menu && !cubuk) { e.preventDefault(); secimYap([x.id]); return; }
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); e.stopPropagation(); const s = window.getSelection(); if (s?.rangeCount && !s.isCollapsed) { kayitliSecim.current = s.getRangeAt(0).cloneRange(); setCubuk((c) => (c ? { ...c, link: true } : c)); } return; }
    if (menu && menu.blokId === x.id) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMenu({ ...menu, i: (menu.i + 1) % Math.max(1, menuUzunluk) }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMenu({ ...menu, i: (menu.i - 1 + Math.max(1, menuUzunluk)) % Math.max(1, menuUzunluk) }); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (menuUzunluk) (menu.tur === "slash" ? slashSec : isaretSec)(menu.i); else setMenu(null); return; }
      if (e.key === "Escape") { e.preventDefault(); setMenu(null); return; }
    }
    if ((e.key === "/" || e.key === "@") && alan === "metin") {
      const kap = kapRef.current;
      const k = kap && imlecKutusu(kap);
      const bas = imlecOfseti(el);
      const once = (el.textContent ?? "").slice(0, bas);
      /* Menü açılırken o ana kadar yazılmış sorguyu da al (hızlı yazımda girdi olayı menüden önce gelir). */
      if (k && (!once || /\s$/.test(once))) setTimeout(() => { const son = imlecOfseti(el); const q = (el.textContent ?? "").slice(bas + 1, Math.max(bas + 1, son)); setMenu({ tur: e.key === "/" ? "slash" : "isaret", blokId: x.id, bas, q: /\s/.test(q) ? "" : q, x: k.x, y: k.y, i: 0 }); }, 0);
      return;
    }
    if (alan !== "metin") return; // açılır içerik ve sütunlar: çok satırlı serbest alan
    if (e.key === "Tab" && x.tur !== "kod") { e.preventDefault(); if (GIRINTILI.includes(x.tur)) girintile([x.id], e.shiftKey ? -1 : 1); return; }
    if (x.tur === "kod") {
      if (e.key === "Enter" && mod) { e.preventDefault(); const y = blok("p"); ekleSonra(x.id, y); odakla(y.id, "bas"); return; }
      if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); guncelle(x.id, { metin: temizle(el.innerHTML) }); return; }
      if (e.key === "Tab") { e.preventDefault(); document.execCommand("insertText", false, "  "); return; }
      if (e.key === "Backspace" && imlecBasta(el) && !(el.textContent ?? "")) { e.preventDefault(); donustur(x.id, "p"); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const bos = !(el.textContent ?? "").trim() && !el.querySelector("[data-isaret]");
      if (bos && (x.girinti ?? 0) > 0 && GIRINTILI.includes(x.tur)) { girintile([x.id], -1); return; }
      if (bos && ["madde", "numara", "yap", "alinti", "kutu"].includes(x.tur)) { donustur(x.id, "p"); return; }
      if (x.tur === "acilir" && imlecSonda(el)) { guncelle(x.id, { acik: true }, true); setTimeout(() => refs.current.get(`${x.id}:ic`)?.focus(), 30); return; }
      const sonra = imlectenBol(el);
      const once = temizle(el.innerHTML);
      const tur: BrifBlokTur = ["madde", "numara", "yap"].includes(x.tur) ? x.tur : "p";
      const yeni = blok(tur, sonra, x.girinti && GIRINTILI.includes(tur) ? { girinti: x.girinti } : {});
      setBloklar((b) => { const n = b.map((y) => (y.id === x.id ? { ...y, metin: once, ipucu: undefined } : y)); n.splice(i + 1, 0, yeni); return n; }, true);
      setSurum((v) => v + 1);
      odakla(yeni.id, "bas");
      return;
    }
    if (e.key === "Backspace" && imlecBasta(el) && !window.getSelection()?.toString()) {
      if ((x.girinti ?? 0) > 0) { e.preventDefault(); girintile([x.id], -1); return; }
      if (x.tur !== "p") { e.preventDefault(); donustur(x.id, "p"); return; }
      const onceki = [...bloklar.slice(0, i)].reverse().find((b) => METINLI.includes(b.tur));
      const oncekiIdx = onceki ? bloklar.indexOf(onceki) : -1;
      if (i > 0 && !METINLI.includes(bloklar[i - 1].tur)) { e.preventDefault(); sil(bloklar[i - 1].id); return; }
      if (!onceki) return;
      e.preventDefault();
      const uzunluk = duzMetin(onceki.metin).length;
      const metin = temizle(onceki.metin + el.innerHTML);
      setBloklar((b) => b.filter((y) => y.id !== x.id).map((y) => (y.id === onceki.id ? { ...y, metin } : y)), true);
      setSurum((v) => v + 1);
      odakla(bloklar[oncekiIdx].id, uzunluk);
      return;
    }
    if (e.key === "Delete" && imlecSonda(el)) {
      const sonraki = bloklar[i + 1];
      if (!sonraki) return;
      e.preventDefault();
      if (!METINLI.includes(sonraki.tur)) { sil(sonraki.id); return; }
      const uzunluk = (el.textContent ?? "").length;
      const metin = temizle(el.innerHTML + sonraki.metin);
      setBloklar((b) => b.filter((y) => y.id !== sonraki.id).map((y) => (y.id === x.id ? { ...y, metin } : y)), true);
      setSurum((v) => v + 1);
      odakla(x.id, uzunluk);
      return;
    }
    if (e.key === "ArrowUp" && !menu) {
      if (!satirKonumu(el).ilk) return;
      const onceki = [...bloklar.slice(0, i)].reverse().find((b) => METINLI.includes(b.tur));
      if (onceki) { e.preventDefault(); odakla(onceki.id, "son"); }
      return;
    }
    if (e.key === "ArrowDown" && !menu) {
      if (!satirKonumu(el).son) return;
      const sonraki = bloklar.slice(i + 1).find((b) => METINLI.includes(b.tur));
      if (sonraki) { e.preventDefault(); odakla(sonraki.id, "bas"); }
      else if (i === bloklar.length - 1 && (el.textContent ?? "").trim()) { e.preventDefault(); const y = blok("p"); ekleSonra(x.id, y); odakla(y.id, "bas"); }
      return;
    }
  };

  /* Yazınca: Markdown kısayolları ve menü sorgusu */
  const girdi = (x: BrifBlok, el: HTMLElement, alan: string = "metin") => {
    const metin = el.textContent ?? "";
    if (menu && menu.blokId === x.id) {
      const son = imlecOfseti(el);
      const isaret = metin[menu.bas];
      if (son <= menu.bas || (isaret !== "/" && isaret !== "@")) setMenu(null);
      else { const q = metin.slice(menu.bas + 1, son); if (/\s{2}|\n/.test(q) || q.length > 24) setMenu(null); else setMenu({ ...menu, q, i: 0 }); }
    }
    if (alan === "ic") { guncelle(x.id, { ic: temizle(el.innerHTML) }); return; }
    if (/^s\d$/.test(alan)) { const i = Number(alan.slice(1)); const html = temizle(el.innerHTML); setBloklar((b) => b.map((y) => { if (y.id !== x.id) return y; const l = [...(y.sutunlar ?? ["", ""])]; l[i] = html; return { ...y, sutunlar: l }; })); return; }
    if (x.tur === "p" || x.tur === "madde" || x.tur === "numara") {
      const kural: [RegExp, BrifBlokTur][] = [[/^###\s/, "h3"], [/^##\s/, "h2"], [/^#\s/, "h1"], [/^[-*•]\s/, "madde"], [/^1[.)]\s/, "numara"], [/^\[\s?\]\s/, "yap"], [/^\[x\]\s/i, "yap"], [/^>\s/, "acilir"], [/^"\s/, "alinti"], [/^!\s/, "kutu"]];
      {
        if (x.tur === "p" && metin === "---") { el.innerHTML = ""; donustur(x.id, "ayrac"); return; }
        if (x.tur === "p" && metin === "```") { el.innerHTML = ""; donustur(x.id, "kod"); return; }
        for (const [re, tur] of kural) {
          if (tur === x.tur) continue;
          const m = metin.match(re);
          if (m) { const kalan = temizle(el.innerHTML).replace(/^(?:#{1,3}|[-*•]|1[.)]|\[\s?\]|\[x\]|>|"|!)(?:\s|&nbsp;)/i, ""); setBloklar((b) => b.map((y) => (y.id === x.id ? { ...y, tur, metin: kalan, ok: /\[x\]/i.test(m[0]) || undefined, acik: tur === "acilir" || undefined, ipucu: undefined } : y)), true); setSurum((v) => v + 1); odakla(x.id, "bas"); return; }
        }
      }
    }
    guncelle(x.id, { metin: temizle(el.innerHTML) });
  };

  /* Yapıştırma: düz metin; çok satırsa bloklara böl */
  const yapistir = (x: BrifBlok, e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const metin = e.clipboardData.getData("text/plain").replace(/\r/g, "");
    const satirlar = metin.split("\n");
    if (satirlar.length <= 1) { document.execCommand("insertText", false, metin); return; }
    document.execCommand("insertText", false, satirlar[0]);
    const yeni = mdBloklar(satirlar.slice(1).join("\n"));
    if (yeni.length) { ekleSonra(x.id, yeni); setSurum((v) => v + 1); odakla(yeni[yeni.length - 1].id, "son"); }
    guncelle(x.id, { metin: temizle(e.currentTarget.innerHTML) });
  };

  /* Sürükle: ⋮⋮ tutamacı */
  const surukleBasla = (id: string, e: React.PointerEvent) => {
    const y0 = e.clientY;
    let hareket = false;
    const hedefBul = (y: number) => {
      let h = bloklar.length;
      for (let i = 0; i < bloklar.length; i++) { const r = document.querySelector(`[data-satir="${bloklar[i].id}"]`)?.getBoundingClientRect(); if (r && y < r.top + r.height / 2) { h = i; break; } }
      return h;
    };
    const hareketF = (ev: PointerEvent) => { if (!hareket && Math.abs(ev.clientY - y0) < 4) return; hareket = true; setSurukle({ id, hedef: hedefBul(ev.clientY) }); };
    const bitir = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", hareketF);
      window.removeEventListener("pointerup", bitir);
      if (!hareket) {
        if (ev.shiftKey || ev.metaKey || ev.ctrlKey) { setSecim((s0) => (s0.includes(id) ? s0.filter((y) => y !== id) : [...s0, id])); return; }
        const kap = kapRef.current!.getBoundingClientRect(); setBlokMenu({ id, x: ev.clientX - kap.left, y: ev.clientY - kap.top }); return;
      }
      const h = hedefBul(ev.clientY);
      setSurukle(null);
      setBloklar((b) => { const i = b.findIndex((x) => x.id === id); const n = [...b]; const [x] = n.splice(i, 1); n.splice(h > i ? h - 1 : h, 0, x); return n; }, true);
      setSurum((v) => v + 1);
    };
    window.addEventListener("pointermove", hareketF);
    window.addEventListener("pointerup", bitir);
  };

  const sonBlogaYaz = () => {
    const son = bloklar[bloklar.length - 1];
    if (son && son.tur === "p" && !duzMetin(son.metin).trim()) { odakla(son.id, "bas"); return; }
    const y = blok("p");
    setBloklar((b) => [...b, y], true);
    odakla(y.id, "bas");
  };

  const kareler = useMemo(() => varliklar.map((u) => gorselAdresi(u)).filter(Boolean) as string[], [varliklar]);
  const yorumSayisi = bloklar.reduce((t, b) => t + (b.yorumlar ?? []).filter((y) => !y.cozuldu).length, 0);
  const doluSayi = doluluk.filter(Boolean).length;
  const duzenleme = p.brifDuzenleme;
  const kilit = !!sayfa.kilit;
  const baslik = sayfa.baslik ?? "Brif";
  const SayfaSimge = sayfa.simge === "yok" ? null : SIMGELER[sayfa.simge ?? "belge"] ?? FileText;
  const kelime = useMemo(() => bloklardanMetin(bloklar).split(/\s+/).filter(Boolean).length, [bloklar]);
  const bosBelge = useMemo(() => bloklar.every((b) => (b.tur === "h2" || !duzMetin(b.metin).trim()) && !b.src?.length && !b.elementler?.length && !b.url && !b.tablo), [bloklar]);
  const markdown = () => `# ${baslik}\n\n${bloklardanMetin(bloklar)}\n`;
  const disaAktar = (t: "md" | "kopya" | "yazdir") => {
    if (t === "kopya") { void mesaj.kopyala(markdown(), "Brif"); return; }
    if (t === "md") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown;charset=utf-8" }));
      a.download = `${p.ad} - ${baslik}.md`.replace(/[\\/:*?"<>|]/g, "");
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      mesaj.indirildi("Markdown dosyası"); return;
    }
    const w = window.open("", "_blank");
    if (!w) { toast.error("Yazdırma penceresi açılamadı", { description: "Tarayıcı açılır pencereyi engelledi; bu site için izin ver." }); return; }
    w.document.write(yazdirmaBelgesi(`${baslik} · ${p.ad}`, bloklardanMetin(bloklar))); w.document.close();
  };
  const sablonUygula = (md: string, ad: string) => {
    const yeni = metindenBloklar(md);
    gecmis.current.geri.push(bloklar); gecmis.current.ileri = []; sonAnlik.current = yeni;
    setBloklarHam(yeni); setSurum((v) => v + 1); kaydet(yeni);
    toast.success(`${ad} şablonu uygulandı`, { description: "Köşeli ayraçlı yerleri kendi bilgilerinle değiştir. Ctrl Z ile geri alabilirsin." });
  };
  const surumGeriYukle = (s: BrifSurum) => {
    gecmis.current.geri.push(bloklar); gecmis.current.ileri = []; sonAnlik.current = s.bloklar;
    setBloklarHam(s.bloklar); setSurum((v) => v + 1); kaydet(s.bloklar);
    setSurumAcik(false);
    toast.success("Sürüme dönüldü", { description: `${new Date(s.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} hâli geri yüklendi.` });
  };
  const elleSurum = () => {
    const g = useProje.getState().projeler.find((x) => x.id === p.id);
    useProje.getState().projeGuncelle(p.id, { brifSurumleri: [{ id: yeniId(), zaman: Date.now(), kim: kullanici?.ad ?? "Sen", bloklar }, ...(g?.brifSurumleri ?? [])].slice(0, 30) });
    toast.success("Sürüm kaydedildi");
  };
  const yorumBlok = yorum ? bloklar.find((b) => b.id === yorum.id) : undefined;

  return (
    <div className={cn("relative", sayfa.yazi === "serif" && "font-serif", sayfa.yazi === "mono" && "font-mono")}>
      <style>{`
        .brif-ed b,.brif-ed strong{font-weight:650;color:#fff}
        .brif-ed code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;background:rgba(255,255,255,.08);color:#ffb4c1;border-radius:5px;padding:.1em .35em}
        .brif-ed .brif-kod code{background:none;color:inherit;padding:0}
        .brif-ed a{color:#fff;text-decoration:underline;text-decoration-color:rgba(255,255,255,.35);text-underline-offset:4px}
        .brif-ed [data-isaret]{display:inline-flex;align-items:center;border-radius:5px;padding:0 .3em;margin:0 .05em;font-size:.95em;line-height:1.5;cursor:default;user-select:all}
        .brif-ed [data-isaret=el]{background:rgba(85,214,253,.13);color:#8be4ff}
        .brif-ed [data-isaret=kisi]{background:rgba(255,255,255,.08);color:#fff}
        .brif-ed [data-isaret=tarih]{color:rgba(255,255,255,.6)}
        .brif-ed [data-bos]:empty::before{content:attr(data-bos);color:rgba(255,255,255,.3);pointer-events:none}
        .brif-kucuk .brif-bloklar{zoom:.92}
        ${RENKLER.map((k) => `.brif-ed [data-renk=${k.id}]{color:${k.yazi}}.brif-ed [data-zemin=${k.id}]{background:${k.zemin};border-radius:4px;padding:0 .12em}`).join("")}
        ::highlight(brif-bul){background-color:rgba(255,214,102,.28)}
        ::highlight(brif-bul-aktif){background-color:#ffd666;color:#111}
      `}</style>

      {/* Üst çubuk: konum, kayıt durumu, yorum sayısı, sürümler, sayfa menüsü */}
      <div className="sticky top-[var(--ust-nav)] z-20 -mx-4 flex h-12 items-center gap-2 border-b border-white/[0.06] bg-[#0b0b0c]/85 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <span className="flex min-w-0 items-center gap-2 text-[13.5px]">
          {SayfaSimge ? <SayfaSimge className="h-4 w-4 shrink-0" style={{ color: sayfa.simgeRenk ?? "#fff" }} /> : <FileText className="h-4 w-4 shrink-0 text-white/60" />}
          <span className="truncate font-medium text-white">{baslik || "Başlıksız"}</span>
          {kilit && <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/65"><Lock className="h-3 w-3" />Kilitli</span>}
        </span>
        <span className="flex-1" />
        <span className="hidden h-7 items-center gap-1.5 rounded-full px-2 text-[12.5px] text-white/55 sm:flex" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={durum} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} className="flex items-center gap-1.5">
              {durum === "kayitli" ? <><Check className="h-3.5 w-3.5" />{duzenleme ? `Kaydedildi, ${gorece(duzenleme.zaman) || "az önce"}` : "Kaydedildi"}</> : <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#55d6fd]" />Kaydediliyor</>}
            </motion.span>
          </AnimatePresence>
        </span>
        {yorumSayisi > 0 && <span title="Açık yorumlar" className="hidden h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12.5px] text-white/75 sm:flex"><MessageSquare className="h-3.5 w-3.5" />{yorumSayisi}</span>}
        <button onClick={() => { setBul((b) => b ?? { q: "", d: "", i: 0, degistir: false }); setTimeout(() => bulGirdi.current?.focus(), 30); }} title="Sayfada bul (Ctrl F)" aria-label="Sayfada bul" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:bg-white/[0.08] hover:text-white"><Search className="h-4 w-4" /></button>
        <button onClick={() => setSurumAcik(true)} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white/75 transition hover:bg-white/[0.08] hover:text-white"><History className="h-4 w-4" /><span className="hidden sm:inline">Sürümler</span></button>
        <SayfaMenusu sayfa={sayfa} kelime={kelime} onGuncelle={sayfaGuncelle} onSurumler={() => setSurumAcik(true)} onDisa={disaAktar} onKopyala={() => void mesaj.kopyala(`${location.origin}/panel/projeler/${p.id}?s=brif`, "Brif bağlantısı")} />
      </div>

      {/* Kapak: içerik alanının tamamına taşar */}
      {sayfa.kapak && <div className="-mx-4 sm:-mx-6"><Kapak sayfa={sayfa} kareler={kareler} kilit={kilit} onGuncelle={sayfaGuncelle} /></div>}

      <div onMouseDown={kementBasla} className={cn("flex justify-center gap-10", sayfa.kucuk && "brif-kucuk")}>
      <article ref={kapRef} className={cn("brif-ed relative w-full pb-[30vh]", sayfa.genis ? "max-w-[1080px]" : "max-w-[720px]", sayfa.kapak ? "pt-0" : "pt-8 sm:pt-12")}>
        {/* Sayfa başı: simge, üzerine gelince Simge / Kapak ekle, başlık */}
        <div className="group/bas">
          {SayfaSimge && (
            <div className={cn("relative", sayfa.kapak && "-mt-10")}>
              <button disabled={kilit} onClick={() => setSimgeAcik((v) => !v)} aria-label="Simgeyi değiştir"
                className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px] bg-[#141517] ring-1 ring-inset ring-white/[0.1] transition hover:bg-[#1a1b1e] disabled:hover:bg-[#141517]">
                <SayfaSimge className="h-9 w-9" strokeWidth={1.5} style={{ color: sayfa.simgeRenk ?? "#fff" }} />
              </button>
              <SimgeSecici acik={simgeAcik} onKapat={() => setSimgeAcik(false)} sayfa={sayfa} onSec={(x) => sayfaGuncelle(x)} />
            </div>
          )}
          {!kilit && (
            <div className={cn("flex h-9 items-center gap-1 opacity-0 transition-opacity group-hover/bas:opacity-100 focus-within:opacity-100", SayfaSimge ? "mt-2" : "mt-0")}>
              {!SayfaSimge && <div className="relative"><button onClick={() => setSimgeAcik(true)} className="flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[13px] text-white/50 hover:bg-white/[0.06] hover:text-white"><Smile className="h-4 w-4" />Simge ekle</button><SimgeSecici acik={simgeAcik} onKapat={() => setSimgeAcik(false)} sayfa={sayfa} onSec={(x) => sayfaGuncelle(x)} /></div>}
              {!sayfa.kapak && <div className="relative"><button onClick={() => setKapakAcik(true)} className="flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[13px] text-white/50 hover:bg-white/[0.06] hover:text-white"><ImageIcon className="h-4 w-4" />Kapak ekle</button><KapakSecici acik={kapakAcik} onKapat={() => setKapakAcik(false)} kareler={kareler} yerlesim="alt-sol" onSec={(k) => { sayfaGuncelle({ kapak: k, kapakY: 50 }); setKapakAcik(false); }} /></div>}
            </div>
          )}
          <textarea value={baslik} readOnly={kilit} rows={1} onChange={(e) => sayfaGuncelle({ baslik: e.target.value.replace(/\n/g, "").slice(0, 120) })} placeholder="Başlıksız"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const ilk = bloklar.find((b) => METINLI.includes(b.tur)); if (ilk) odakla(ilk.id, "bas"); } }} aria-label="Belge başlığı"
            className="mt-1 w-full resize-none bg-transparent text-[34px] font-bold leading-tight tracking-[-0.03em] text-white outline-none placeholder:text-white/25 [field-sizing:content] sm:text-[40px]" />
        </div>

        {/* Özellikler (Notion satırları) */}
        <dl className="mt-3 grid gap-y-0.5 text-[14px]">
          {([
            [CircleDot, "Durum", <OzellikDegeri key="d" tur="durum" oz={ozellik} uyeler={uyeler} kilit={kilit} onGuncelle={ozellikGuncelle} />],
            [Calendar, "Teslim", <OzellikDegeri key="t" tur="teslim" oz={ozellik} uyeler={uyeler} kilit={kilit} onGuncelle={ozellikGuncelle} />],
            [UserRound, "Sorumlu", <OzellikDegeri key="s" tur="sorumlu" oz={ozellik} uyeler={uyeler} kilit={kilit} onGuncelle={ozellikGuncelle} />],
            [Tag, "Etiketler", <OzellikDegeri key="e" tur="etiketler" oz={ozellik} uyeler={uyeler} kilit={kilit} onGuncelle={ozellikGuncelle} />],
            [Users, "Ekip", <span key="k" className="flex items-center gap-2 px-1.5"><AvatarYigini uyeler={uyeler} boyut={20} en={4} /><span className="text-white/60">{uyeler.length === 1 ? "Yalnız sen" : `${uyeler.length} kişi`}</span></span>],
            [Clock, "Son düzenleme", <span key="z" className="px-1.5 text-white/80">{duzenleme ? `${gorece(duzenleme.zaman) || "az önce"}, ${duzenleme.kim}` : "Henüz düzenlenmedi"}</span>],
            [Gauge, "Doluluk", <span key="o" className="flex items-center gap-2.5 px-1.5"><span className="flex gap-[3px]">{doluluk.map((d, i) => (
              <motion.button key={i} title={`${BRIF_BOLUMLERI[i].ad}${d ? "" : ": boş"}`} aria-label={`${BRIF_BOLUMLERI[i].ad} bölümüne git`} initial={false} animate={{ backgroundColor: d ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.15)" }} whileHover={{ scaleY: 1.6 }}
                onClick={() => { const h = bloklar.find((b) => b.tur === "h2" && duzMetin(b.metin).trim().toLocaleLowerCase("tr") === BRIF_BOLUMLERI[i].ad.toLocaleLowerCase("tr")); if (h) document.querySelector(`[data-satir="${h.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                className="h-1.5 w-3 rounded-full sm:w-5" />
            ))}</span><span className="text-white/80">{doluSayi} / {BRIF_BOLUMLERI.length} bölüm</span></span>],
          ] as [React.ElementType, string, React.ReactNode][]).map(([I, k, v]) => (
            <div key={k} className="grid min-h-[34px] grid-cols-[136px_1fr] items-center rounded-[8px] sm:grid-cols-[160px_1fr]">
              <dt className="flex items-center gap-2 whitespace-nowrap px-1.5 text-[13px] text-white/50 sm:text-[14px]"><I className="h-4 w-4 text-white/40" />{k}</dt><dd className="min-w-0 text-white/90">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 h-px bg-white/[0.08]" />

        <AnimatePresence>{bosBelge && !sablonGec && !kilit && <SablonSecici key="sablon" onSec={sablonUygula} onBos={() => setSablonGec(true)} />}</AnimatePresence>

        {/* Bloklar */}
        <div className="brif-bloklar mt-2" onKeyDownCapture={(e) => { if (e.key === "Escape") { setBlokMenu(null); setCubuk(null); setYorum(null); } }}>
          {bloklar.map((x, i) => (
            <div key={x.id} data-satir={x.id} className={cn("relative rounded-[8px] transition-colors duration-150", secim.includes(x.id) && "bg-[#55d6fd]/[0.09] ring-1 ring-inset ring-[#55d6fd]/25")}>
              {surukle && surukle.hedef === i && surukle.id !== x.id && <span className="absolute -top-px left-0 right-0 h-[3px] rounded-full bg-[#55d6fd]" />}
              <BlokSatiri x={x} n={numaralar.get(x.id)} surum={surum} odak={odakId === x.id} surukleniyor={surukle?.id === x.id} kilit={kilit}
                onYorum={(el) => { const k = kapRef.current!.getBoundingClientRect(), r = el.getBoundingClientRect(); setYorum({ id: x.id, x: Math.min(r.right - k.left - 300, k.width - 300), y: r.bottom - k.top + 6 }); }}
                refAyarla={(id, el) => { if (el) refs.current.set(id, el); else refs.current.delete(id); }}
                onTus={tus} onGirdi={girdi} onYapistir={yapistir} onOdak={(v) => setOdakId(v ? x.id : null)}
                onArti={() => { const y = blok("p"); ekleSonra(x.id, y); setTimeout(() => { const el = refs.current.get(y.id); if (el) { el.textContent = "/"; imleciKoy(el, "son"); const k = imlecKutusu(kapRef.current!); if (k) setMenu({ tur: "slash", blokId: y.id, bas: 0, q: "", x: k.x, y: k.y, i: 0 }); } }, 30); }}
                onTutamac={(e) => surukleBasla(x.id, e)} onGuncelle={(patch, y) => guncelle(x.id, patch, y)}
                varliklar={varliklar} projeEl={projeEl} basliklar={bloklar} />
              <AnimatePresence>
                {yaz?.blokId === x.id && (
                  <div className="my-2">
                    <YazPaneli key={`${x.id}-${yaz.islem ?? ""}`} islemIlk={yaz.islem} secim={yaz.secim} sayfa={bloklardanMetin(bloklar)} proje={p.ad}
                      onEkle={yazEkle} onDegistir={yaz.aralik ? yazDegistir : undefined} onKapat={() => setYaz(null)} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {surukle && surukle.hedef === bloklar.length && <span className="block h-[3px] rounded-full bg-[#55d6fd]" />}
          <button onClick={sonBlogaYaz} className="mt-1 block h-24 w-full cursor-text" aria-label="Sona yaz" />
        </div>

        {kement && <div aria-hidden className="pointer-events-none absolute z-20 rounded-[4px] bg-[#55d6fd]/10 ring-1 ring-[#55d6fd]/40" style={{ left: kement.x, top: kement.y, width: kement.w, height: kement.h }} />}
        {/* "/" ve "@" menüsü */}
        <AnimatePresence>
          {menu && menuUzunluk > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
              className="absolute z-30 max-h-[340px] w-[300px] overflow-y-auto rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5" style={{ left: Math.min(menu.x, 420), top: menu.y + 6 }}
              onMouseDown={(e) => e.preventDefault()}>
              {menu.tur === "slash" ? slashOgeleri.map((t, n) => (
                <div key={t.tur}>
                  {(n === 0 || slashOgeleri[n - 1].grup !== t.grup) && <p className="px-2 pb-1 pt-1.5 text-[12px] text-white/45">{t.grup === "Temel" ? "Bloklar" : t.grup === "AI" ? "Yapay zekâ" : "Projeden"}</p>}
                  <button onMouseEnter={() => setMenu({ ...menu, i: n })} onClick={() => slashSec(n)} className={cn("flex w-full items-center gap-3 rounded-[9px] px-2 py-1.5 text-left", menu.i === n && "bg-white/[0.07]")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.07]"><t.ikon className="h-4 w-4 text-white/80" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{t.ad}</span><span className="block truncate text-[12px] text-white/45">{t.alt}</span></span>
                    {t.kisa && <span className="text-[11.5px] text-white/35">{t.kisa}</span>}
                  </button>
                </div>
              )) : isaretOgeleri.map((x, n) => (
                <div key={`${x.tur}-${x.ad}`}>
                  {(n === 0 || isaretOgeleri[n - 1].tur !== x.tur) && <p className="px-2 pb-1 pt-1.5 text-[12px] text-white/45">{x.tur === "el" ? "Elementler" : x.tur === "kisi" ? "Kişiler" : "Tarih"}</p>}
                  <button onMouseEnter={() => setMenu({ ...menu, i: n })} onClick={() => isaretSec(n)} className={cn("flex w-full items-center gap-3 rounded-[9px] px-2 py-1.5 text-left", menu.i === n && "bg-white/[0.07]")}>
                    {x.tur === "el" ? (x.gorsel ? <Kare src={x.gorsel} /> : <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#55d6fd]/10"><AtSign className="h-4 w-4 text-[#55d6fd]" /></span>)
                      : x.tur === "kisi" ? <span className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-black" style={{ background: x.renk }}>{x.ad[0]?.toLocaleUpperCase("tr")}</span>
                      : <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.05]"><Calendar className="h-4 w-4 text-white/70" /></span>}
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{x.tur === "tarih" ? x.ad : `@${x.ad}`}</span><span className="block text-[12px] text-white/45">{x.alt}</span></span>
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seçim biçim çubuğu */}
        <AnimatePresence>
          {cubuk && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
              className="absolute z-30 flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-full flex-wrap items-center gap-0.5 rounded-[12px] border border-white/[0.08] bg-[#1b1c1f] p-1" style={{ left: (() => { const kw = kapRef.current?.clientWidth ?? 720, yari = Math.min(205, kw / 2); return Math.max(yari, Math.min(cubuk.x, kw - yari)); })(), top: cubuk.y - 8 }}
              onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("input")) e.preventDefault(); }}>
              {cubuk.link ? (
                <form onSubmit={(e) => { e.preventDefault(); baglantiEkle(new FormData(e.currentTarget).get("u") as string); }} className="flex items-center gap-1">
                  <Link2 className="ml-1.5 h-3.5 w-3.5 text-white/50" />
                  <input name="u" autoFocus placeholder="Bağlantıyı yapıştır" className="h-8 w-56 bg-transparent px-1.5 text-[13px] text-white outline-none placeholder:text-white/35" onKeyDown={(e) => e.key === "Escape" && setCubuk(null)} />
                  <button className="h-7 rounded-[8px] bg-white px-2.5 text-[12px] font-semibold text-black">Ekle</button>
                </form>
              ) : (
                <>
                  {(() => { const bx = bloklar.find((b) => b.id === cubuk.blokId); return bx && METINLI.includes(bx.tur) && (
                    <button onClick={() => setCubuk((c) => (c ? { ...c, alt: c.alt === "donustur" ? undefined : "donustur" } : c))} aria-expanded={cubuk.alt === "donustur"} className={cn("flex h-8 items-center gap-1 rounded-[8px] px-2 text-[12.5px] text-white/85 hover:bg-white/[0.08]", cubuk.alt === "donustur" && "bg-white/[0.08]")}>{turAdi(bx.tur)}<ChevronDown className="h-3.5 w-3.5 text-white/50" /></button>
                  ); })()}
                  <span className="mx-0.5 h-5 w-px bg-white/10" />
                  {([[Bold, "bold", "Kalın (Ctrl B)"], [Italic, "italic", "İtalik (Ctrl I)"], [Underline, "underline", "Altı çizili (Ctrl U)"], [Strikethrough, "strikeThrough", "Üstü çizili (Ctrl Shift S)"], [Code, "code", "Kod (Ctrl E)"]] as const).map(([I, k, ad]) => (
                    <button key={k} onClick={() => bicim(k)} title={ad} aria-label={ad} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/85 hover:bg-white/[0.08]"><I className="h-4 w-4" /></button>
                  ))}
                  <span className="mx-0.5 h-5 w-px bg-white/10" />
                  <button onClick={() => { const s = window.getSelection(); if (s?.rangeCount) kayitliSecim.current = s.getRangeAt(0).cloneRange(); setCubuk((c) => (c ? { ...c, link: true } : c)); }} title="Bağlantı (Ctrl K)" aria-label="Bağlantı" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/85 hover:bg-white/[0.08]"><Link2 className="h-4 w-4" /></button>
                  <button onClick={() => setCubuk((c) => (c ? { ...c, alt: c.alt === "ai" ? undefined : "ai" } : c))} title="Yapay zekâ" aria-label="Yapay zekâ" aria-expanded={cubuk.alt === "ai"} className={cn("flex h-8 items-center gap-1 rounded-[8px] px-2 text-[12.5px] text-white/85 hover:bg-white/[0.08]", cubuk.alt === "ai" && "bg-white/[0.08]")}><Sparkles className="h-4 w-4" /><span className="max-sm:hidden">Yapay zekâ</span></button>
                  <button onClick={() => setCubuk((c) => (c ? { ...c, alt: c.alt === "renk" ? undefined : "renk" } : c))} title="Renk ve vurgu" aria-label="Renk ve vurgu" aria-expanded={cubuk.alt === "renk"} className={cn("flex h-8 w-8 items-center justify-center rounded-[8px] text-white/85 hover:bg-white/[0.08]", cubuk.alt === "renk" && "bg-white/[0.08]")}><Baseline className="h-4 w-4" /></button>
                  <button onClick={() => { const id = cubuk.blokId; setCubuk(null); const el = id && document.querySelector(`[data-satir="${id}"]`) as HTMLElement | null; if (id && el) { const k = kapRef.current!.getBoundingClientRect(), rr = el.getBoundingClientRect(); setYorum({ id, x: Math.max(0, Math.min(rr.right - k.left - 300, k.width - 300)), y: rr.bottom - k.top + 6 }); } }} title="Yorum ekle" aria-label="Yorum ekle" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/85 hover:bg-white/[0.08]"><MessageSquarePlus className="h-4 w-4" /></button>
                  <AnimatePresence>
                    {cubuk.alt === "donustur" && (
                      <motion.div key="d" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-full mt-1.5 w-[220px] rounded-[12px] border border-white/[0.08] bg-[#18191c] p-1">
                        <p className="px-2 pb-1 pt-1 text-[11.5px] text-white/45">Dönüştür</p>
                        {TURLER.filter((t) => METINLI.includes(t.tur)).map((t) => (
                          <button key={t.tur} onClick={() => { if (cubuk.blokId) donustur(cubuk.blokId, t.tur); setCubuk(null); }} className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]">
                            <t.ikon className="h-4 w-4 text-white/55" /><span className="flex-1">{t.ad}</span>{KISAYOL_TUR.indexOf(t.tur) >= 0 && <span className="text-[11px] tabular-nums text-white/30">Ctrl Alt {KISAYOL_TUR.indexOf(t.tur)}</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {cubuk.alt === "ai" && (
                      <motion.div key="ai" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-full mt-1.5 w-[230px] rounded-[12px] border border-white/[0.08] bg-[#18191c] p-1">
                        <p className="px-2 pb-1 pt-1 text-[11.5px] text-white/45">Seçimle</p>
                        {SECIM_ISLEMLERI.map((t) => (
                          <button key={t.id} onClick={() => { const s = window.getSelection(); if (!s?.rangeCount || !cubuk.blokId) return; const a = s.getRangeAt(0).cloneRange(); setYaz({ blokId: cubuk.blokId, islem: t.id, secim: s.toString(), aralik: a }); setCubuk(null); }}
                            className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><t.ikon className="h-4 w-4 text-white/55" />{t.ad}</button>
                        ))}
                      </motion.div>
                    )}
                    {cubuk.alt === "renk" && (
                      <motion.div key="r" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-1.5 w-[236px] rounded-[12px] border border-white/[0.08] bg-[#18191c] p-2">
                        <p className="px-1 pb-1.5 text-[11.5px] text-white/45">Yazı rengi</p>
                        <div className="grid grid-cols-5 gap-1">
                          <button onClick={() => renkUygula("renk", null)} title="Varsayılan" className="flex h-8 items-center justify-center rounded-[7px] text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 hover:bg-white/[0.06]">A</button>
                          {RENKLER.map((k) => <button key={k.id} onClick={() => renkUygula("renk", k.id)} title={k.ad} className="flex h-8 items-center justify-center rounded-[7px] text-[13px] font-semibold ring-1 ring-inset ring-white/10 hover:bg-white/[0.06]" style={{ color: k.yazi }}>A</button>)}
                        </div>
                        <p className="px-1 pb-1.5 pt-2.5 text-[11.5px] text-white/45">Vurgu</p>
                        <div className="grid grid-cols-5 gap-1">
                          <button onClick={() => renkUygula("zemin", null)} title="Vurgu yok" className="flex h-8 items-center justify-center rounded-[7px] ring-1 ring-inset ring-white/15 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5 text-white/60" /></button>
                          {RENKLER.map((k) => <button key={k.id} onClick={() => renkUygula("zemin", k.id)} title={`${k.ad} vurgu`} className="h-8 rounded-[7px] ring-1 ring-inset ring-white/10" style={{ background: k.zemin }} />)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blok menüsü (⋮⋮ tıklayınca) */}
        <AnimatePresence>
          {blokMenu && (() => {
            const x = bloklar.find((b) => b.id === blokMenu.id);
            if (!x) return null;
            return (
              <>
                <button key="perde" className="fixed inset-0 z-20 cursor-default" aria-label="Menüyü kapat" onClick={() => setBlokMenu(null)} />
                <motion.div key="m" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                  className="absolute z-30 w-[240px] rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5" style={{ left: Math.max(0, blokMenu.x - 10), top: blokMenu.y + 8 }}>
                  <p className="px-2 pb-1 pt-1 text-[12px] text-white/45">{turAdi(x.tur)}</p>
                  {METINLI.includes(x.tur) && (
                    <details className="group/d">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-[13px] text-white/85 hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden"><Repeat className="h-4 w-4 text-white/55" /><span className="flex-1">Dönüştür</span><ChevronRight className="h-3.5 w-3.5 text-white/45 transition-transform group-open/d:rotate-90" /></summary>
                      <div className="ml-3 border-l border-white/[0.08] pl-1.5">
                        {TURLER.filter((t) => METINLI.includes(t.tur)).map((t) => (
                          <button key={t.tur} onClick={() => { setBlokMenu(null); donustur(x.id, t.tur); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><t.ikon className="h-4 w-4 text-white/55" /><span className="flex-1">{t.ad}</span>{x.tur === t.tur && <Check className="h-3.5 w-3.5" />}</button>
                        ))}
                      </div>
                    </details>
                  )}
                  {METINLI.includes(x.tur) && x.tur !== "kod" && (
                    <details className="group/r">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-[13px] text-white/85 hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden"><Palette className="h-4 w-4 text-white/55" /><span className="flex-1">Renk</span>{x.renk && <span className="h-3 w-3 rounded-full" style={{ background: renkBul(x.renk)?.yazi }} />}<ChevronRight className="h-3.5 w-3.5 text-white/45 transition-transform group-open/r:rotate-90" /></summary>
                      <div className="ml-3 border-l border-white/[0.08] pl-1.5">
                        <p className="px-2 pb-1 pt-1.5 text-[11.5px] text-white/40">Yazı</p>
                        <div className="grid grid-cols-5 gap-1 px-1.5 pb-1">
                          <button onClick={() => { guncelle(x.id, { renk: undefined, zemin: undefined }, true); }} title="Varsayılan" className={cn("flex h-7 items-center justify-center rounded-[7px] text-[13px] font-semibold text-white ring-1 ring-inset", !x.renk ? "ring-white/40" : "ring-white/10 hover:bg-white/[0.06]")}>A</button>
                          {RENKLER.map((r) => <button key={r.id} onClick={() => guncelle(x.id, { renk: r.id, zemin: false }, true)} title={r.ad} className={cn("flex h-7 items-center justify-center rounded-[7px] text-[13px] font-semibold ring-1 ring-inset", x.renk === r.id && !x.zemin ? "ring-white/40" : "ring-white/10 hover:bg-white/[0.06]")} style={{ color: r.yazi }}>A</button>)}
                        </div>
                        <p className="px-2 pb-1 pt-1 text-[11.5px] text-white/40">Zemin</p>
                        <div className="grid grid-cols-5 gap-1 px-1.5 pb-1.5">
                          {RENKLER.map((r) => <button key={r.id} onClick={() => guncelle(x.id, { renk: r.id, zemin: true }, true)} title={`${r.ad} zemin`} className={cn("h-7 rounded-[7px] ring-1 ring-inset", x.renk === r.id && x.zemin ? "ring-white/50" : "ring-white/10")} style={{ background: r.zemin }} />)}
                        </div>
                      </div>
                    </details>
                  )}
                  <button onClick={() => { setBlokMenu(null); const el = document.querySelector(`[data-satir="${x.id}"]`) as HTMLElement | null; if (el) { const k = kapRef.current!.getBoundingClientRect(), r = el.getBoundingClientRect(); setYorum({ id: x.id, x: Math.max(0, Math.min(r.right - k.left - 300, k.width - 300)), y: r.bottom - k.top + 6 }); } }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><MessageSquarePlus className="h-4 w-4 text-white/55" />Yorum ekle</button>
                  {([[Copy, "Çoğalt", () => cogalt(x.id), "Ctrl D"], [ArrowUp, "Yukarı taşı", () => tasi(x.id, -1), "Ctrl Shift Yukarı"], [ArrowDown, "Aşağı taşı", () => tasi(x.id, 1), "Ctrl Shift Aşağı"]] as const).map(([I, ad, f, k]) => (
                    <button key={ad} onClick={() => { setBlokMenu(null); f(); setSurum((v) => v + 1); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><I className="h-4 w-4 text-white/55" /><span className="flex-1">{ad}</span><span className="text-[11px] text-white/30">{k}</span></button>
                  ))}
                  <button onClick={() => { setBlokMenu(null); blokBaglantisi(x.id); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><Link2 className="h-4 w-4 text-white/55" />Bloğa bağlantı kopyala</button>
                  <button onClick={() => { setBlokMenu(null); secimYap([x.id]); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><CheckSquare className="h-4 w-4 text-white/55" /><span className="flex-1">Seç</span><span className="text-[11px] text-white/30">Esc</span></button>
                  <div className="my-1 h-px bg-white/[0.08]" />
                  <button onClick={() => { setBlokMenu(null); sil(x.id); setSurum((v) => v + 1); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>
        {/* Yorumlar */}
        <AnimatePresence>
          {yorum && yorumBlok && (
            <>
              <button key="yp" className="fixed inset-0 z-20 cursor-default" aria-label="Yorumları kapat" onClick={() => setYorum(null)} />
              <div key="yk" className="absolute z-30" style={{ left: Math.max(0, yorum.x), top: yorum.y }}>
                <YorumKutusu yorumlar={yorumBlok.yorumlar ?? []} kim={kullanici?.ad ?? "Sen"} onKapat={() => setYorum(null)}
                  onEkle={(m) => guncelle(yorumBlok.id, { yorumlar: [...(yorumBlok.yorumlar ?? []), { id: yeniId(), kim: kullanici?.ad ?? "Sen", metin: m, zaman: Date.now() }] }, true)}
                  onCoz={(id) => guncelle(yorumBlok.id, { yorumlar: (yorumBlok.yorumlar ?? []).map((y) => (y.id === id ? { ...y, cozuldu: !y.cozuldu } : y)) }, true)}
                  onSil={(id) => guncelle(yorumBlok.id, { yorumlar: (yorumBlok.yorumlar ?? []).filter((y) => y.id !== id) }, true)} />
              </div>
            </>
          )}
        </AnimatePresence>
      </article>
      <Icindekiler bloklar={bloklar} />
      <AnimatePresence>
        {secim.length > 0 && !kilit && (
          <motion.div key="secim" data-secim-cubugu initial={{ opacity: 0, y: 16, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 16, x: "-50%" }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-[70] flex max-w-[calc(100vw-16px)] items-center gap-0.5 rounded-full border border-white/[0.1] bg-[#1b1c1f] p-1.5 sm:bottom-6">
            <span className="whitespace-nowrap px-3 text-[13px] font-medium tabular-nums text-white max-sm:px-2">{secim.length} <span className="max-sm:hidden">blok </span>seçili</span>
            <div className="relative">
              <button onClick={() => setSecimMenu((v) => !v)} aria-expanded={secimMenu} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/85 hover:bg-white/[0.08]", secimMenu && "bg-white/[0.08]")}><Repeat className="h-4 w-4" /><span className="max-sm:hidden">Dönüştür</span></button>
              <AnimatePresence>
                {secimMenu && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-0 mb-2 w-[230px] rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5">
                    {TURLER.filter((t) => METINLI.includes(t.tur)).map((t) => (
                      <button key={t.tur} onClick={() => topluDonustur(t.tur)} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]"><t.ikon className="h-4 w-4 text-white/55" />{t.ad}</button>
                    ))}
                    <p className="px-2 pb-1 pt-2 text-[11.5px] text-white/40">Renk</p>
                    <div className="grid grid-cols-5 gap-1 px-1 pb-1">
                      <button onClick={() => topluRenk(undefined)} title="Varsayılan" className="flex h-7 items-center justify-center rounded-[7px] text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15">A</button>
                      {RENKLER.map((k) => <button key={k.id} onClick={() => topluRenk(k.id, true)} title={`${k.ad} zemin`} className="h-7 rounded-[7px] ring-1 ring-inset ring-white/10" style={{ background: k.zemin }} />)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => void topluKopyala()} title="Kopyala (Ctrl C)" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/85 hover:bg-white/[0.08]"><Copy className="h-4 w-4" /><span className="max-sm:hidden">Kopyala</span></button>
            <button onClick={topluCogalt} title="Çoğalt (Ctrl D)" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/85 hover:bg-white/[0.08] max-sm:hidden"><Copy className="h-4 w-4" />Çoğalt</button>
            <button onClick={topluSil} title="Sil (Delete)" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /><span className="max-sm:hidden">Sil</span></button>
            <button onClick={() => { setSecim([]); setSecimMenu(false); }} aria-label="Seçimi bırak" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bul && (
          <motion.div key="bul" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="fixed right-4 top-[calc(var(--ust-nav)+60px)] z-40 w-[min(360px,calc(100vw-32px))] rounded-[16px] border border-white/[0.1] bg-[#18191c] p-1.5 sm:right-6">
            <div className="flex items-center gap-1">
              <Search className="ml-2 h-4 w-4 shrink-0 text-white/45" />
              <input ref={bulGirdi} value={bul.q} onChange={(e) => setBul({ ...bul, q: e.target.value, i: 0 })} placeholder="Sayfada bul" aria-label="Sayfada bul"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); bulGit(e.shiftKey ? -1 : 1); } if (e.key === "Escape") { e.preventDefault(); setBul(null); } }}
                className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[13.5px] text-white outline-none placeholder:text-white/35" />
              <span className="shrink-0 px-1 text-[12px] tabular-nums text-white/45">{bul.q.trim() ? (bulSayi ? `${Math.min(bul.i, bulSayi - 1) + 1}/${bulSayi}` : "Sonuç yok") : ""}</span>
              <button onClick={() => bulGit(-1)} disabled={!bulSayi} aria-label="Önceki" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 hover:bg-white/[0.08] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => bulGit(1)} disabled={!bulSayi} aria-label="Sonraki" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 hover:bg-white/[0.08] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              {!kilit && <button onClick={() => setBul({ ...bul, degistir: !bul.degistir })} aria-pressed={bul.degistir} title="Değiştir" aria-label="Değiştir" className={cn("flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-white/[0.08]", bul.degistir ? "bg-white/[0.08] text-white" : "text-white/70")}><Replace className="h-4 w-4" /></button>}
              <button onClick={() => setBul(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {bul.degistir && !kilit && (
              <div className="mt-1 flex items-center gap-1 border-t border-white/[0.06] pt-1.5">
                <input value={bul.d} onChange={(e) => setBul({ ...bul, d: e.target.value })} placeholder="Yerine yaz" aria-label="Yerine yaz" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); degistir(false); } if (e.key === "Escape") setBul(null); }}
                  className="h-9 min-w-0 flex-1 rounded-[9px] bg-white/[0.04] px-2.5 text-[13.5px] text-white outline-none placeholder:text-white/35" />
                <button onClick={() => degistir(false)} disabled={!bulSayi} className="h-8 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.13] disabled:opacity-35">Değiştir</button>
                <button onClick={() => degistir(true)} disabled={!bulSayi} className="h-8 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-35">Tümü</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      <AnimatePresence>
        {surumAcik && <SurumPaneli key="surum" surumler={p.brifSurumleri ?? []} simdiki={bloklar} metin={bloklardanMetin} onGeriYukle={surumGeriYukle} onKaydet={elleSurum} onKapat={() => setSurumAcik(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Tek blok ── */
function BlokSatiri({ x, n, surum, odak, surukleniyor, kilit, onYorum, refAyarla, onTus, onGirdi, onYapistir, onOdak, onArti, onTutamac, onGuncelle, varliklar, projeEl, basliklar }: {
  x: BrifBlok; n?: number; surum: number; odak: boolean; surukleniyor: boolean; kilit?: boolean; onYorum: (el: HTMLElement) => void;
  refAyarla: (id: string, el: HTMLElement | null) => void;
  onTus: (x: BrifBlok, e: React.KeyboardEvent<HTMLElement>, alan?: string) => void; onGirdi: (x: BrifBlok, el: HTMLElement, alan?: string) => void;
  onYapistir: (x: BrifBlok, e: React.ClipboardEvent<HTMLElement>) => void; onOdak: (v: boolean) => void;
  onArti: () => void; onTutamac: (e: React.PointerEvent) => void; onGuncelle: (patch: Partial<BrifBlok>, yapisal?: boolean) => void;
  varliklar: ReturnType<typeof useProjeVarliklari>; projeEl: ReturnType<typeof useElements.getState>["elementler"]; basliklar: BrifBlok[];
}) {
  const g = x.girinti ?? 0;
  const ust = x.tur === "h1" ? "mt-10" : x.tur === "h2" ? "mt-8" : x.tur === "h3" ? "mt-4" : "";
  const tutamacUst = x.tur === "h1" ? "top-[48px]" : x.tur === "h2" ? "top-[42px]" : x.tur === "h3" ? "top-[22px]" : x.tur === "kutu" ? "top-[14px]" : x.tur === "kod" || x.tur === "tablo" || x.tur === "baglanti" ? "top-[12px]" : "top-[5px]";
  const renk = renkBul(x.renk);
  const yaziRengi = renk && !x.zemin ? { color: renk.yazi } : undefined;
  const ed = (alan: string, cls: string, bos?: string) => (
    <Duzenlenebilir key={`${x.id}:${alan}`} id={alan === "metin" ? x.id : `${x.id}:${alan}`} blokId={x.id} html={(alan === "metin" ? x.metin : alan === "ic" ? x.ic : x.sutunlar?.[Number(alan.slice(1))]) ?? ""} surum={surum} className={cls} bos={kilit ? undefined : bos} kilit={kilit} stil={yaziRengi}
      refAyarla={refAyarla} onKeyDown={(e) => onTus(x, e, alan)} onInput={(el) => onGirdi(x, el, alan)} onPaste={(e) => onYapistir(x, e)} onOdak={onOdak} />
  );
  const bosYazi = x.ipucu ?? (odak ? (x.tur === "p" ? "Yazmak için yaz, komutlar için \"/\"" : turAdi(x.tur)) : x.tur === "p" ? undefined : turAdi(x.tur));
  let govde: React.ReactNode;
  switch (x.tur) {
    case "h1": govde = ed("metin", "text-[30px] font-bold leading-tight tracking-[-0.02em] text-white", "Başlık 1"); break;
    case "icindekiler": {
      const l = basliklar.filter((b) => (b.tur === "h1" || b.tur === "h2" || b.tur === "h3") && duzMetin(b.metin).trim());
      govde = (
        <nav aria-label="İçindekiler" className="my-1 py-0.5">
          {l.length ? l.map((b) => (
            <button key={b.id} onClick={() => document.querySelector(`[data-satir="${b.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={cn("block w-full truncate rounded-[6px] px-2 py-[3px] text-left text-[14px] text-white/60 underline decoration-white/20 underline-offset-4 transition hover:bg-white/[0.04] hover:text-white", b.tur === "h2" && "pl-6", b.tur === "h3" && "pl-10")}>{duzMetin(b.metin)}</button>
          )) : <p className="px-2 py-1 text-[14px] text-white/40">Başlık ekledikçe burada listelenir.</p>}
        </nav>
      );
      break;
    }
    case "sutun": {
      const l = x.sutunlar?.length ? x.sutunlar : ["", ""];
      govde = (
        <div className="group/su relative my-1">
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${l.length}, minmax(0, 1fr))` }}>
            {l.map((_, i) => (
              <div key={i} className="min-w-0 rounded-[8px] border-l border-white/[0.06] pl-3 first:border-l-0 first:pl-0">
                {ed(`s${i}`, "min-h-[28px] whitespace-pre-wrap py-[3px] text-[15px] leading-relaxed text-white/85", `Sütun ${i + 1}`)}
              </div>
            ))}
          </div>
          {!kilit && (
            <span className="absolute -top-7 right-0 flex gap-0.5 rounded-[8px] bg-[#18191c] p-0.5 opacity-0 ring-1 ring-white/[0.08] transition-opacity group-hover/su:opacity-100">
              {l.length < 3 && <button onClick={() => onGuncelle({ sutunlar: [...l, ""] }, true)} className="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[11.5px] text-white/70 hover:bg-white/[0.08] hover:text-white"><Plus className="h-3 w-3" />Sütun</button>}
              {l.length > 2 && <button onClick={() => { const k = l.slice(0, -1); const son = l[l.length - 1]; if (duzMetin(son).trim()) k[k.length - 1] = `${k[k.length - 1]}${k[k.length - 1] ? "<br>" : ""}${son}`; onGuncelle({ sutunlar: k }, true); }} className="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[11.5px] text-white/70 hover:bg-white/[0.08] hover:text-white"><Minus className="h-3 w-3" />Sütun</button>}
            </span>
          )}
        </div>
      );
      break;
    }
    case "h2": govde = <div className="border-b border-white/[0.08] pb-1.5">{ed("metin", "text-[24px] font-semibold leading-snug tracking-[-0.01em] text-white", "Başlık")}</div>; break;
    case "h3": govde = ed("metin", "text-[18px] font-semibold leading-snug text-white", "Alt başlık"); break;
    case "madde": govde = <div className="flex gap-2"><span className={cn("mt-[10px] h-[6px] w-[6px] shrink-0", g % 3 === 0 && "rounded-full bg-white/60", g % 3 === 1 && "rounded-full ring-[1.5px] ring-inset ring-white/60", g % 3 === 2 && "rounded-[1px] bg-white/60")} /><div className="min-w-0 flex-1">{ed("metin", "py-[3px] text-[15px] leading-relaxed text-white/85", "Liste")}</div></div>; break;
    case "numara": govde = <div className="flex gap-2"><span className="min-w-5 shrink-0 pt-[3px] text-right text-[15px] tabular-nums leading-relaxed text-white/60">{numaraYaz(n ?? 1, g)}</span><div className="min-w-0 flex-1">{ed("metin", "py-[3px] text-[15px] leading-relaxed text-white/85", "Liste")}</div></div>; break;
    case "yap": govde = (
      <div className="flex items-start gap-2.5">
        <button disabled={kilit} onClick={() => onGuncelle({ ok: !x.ok }, true)} aria-label={x.ok ? "Yapılmadı olarak işaretle" : "Yapıldı olarak işaretle"} className={cn("mt-[6px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] transition", x.ok ? "bg-[#55d6fd] text-black" : "ring-1 ring-inset ring-white/35 hover:bg-white/[0.06]")}>
          <AnimatePresence>{x.ok && <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}><Check className="h-3 w-3" strokeWidth={3} /></motion.span>}</AnimatePresence>
        </button>
        <div className="min-w-0 flex-1">{ed("metin", cn("py-[3px] text-[15px] leading-relaxed transition-colors", x.ok ? "text-white/40 line-through decoration-white/30" : "text-white/90"), "Yapılacak")}</div>
      </div>
    ); break;
    case "kutu": govde = <div className="my-1 flex gap-3 rounded-[10px] bg-white/[0.045] px-4 py-3"><Lightbulb className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[#55d6fd]" /><div className="min-w-0 flex-1">{ed("metin", "text-[15px] leading-relaxed text-white/90", "Bilgi kutusu")}</div></div>; break;
    case "alinti": govde = <div className="my-1 border-l-[3px] border-white/50 pl-4">{ed("metin", "py-0.5 text-[17px] leading-relaxed text-white/90", "Alıntı")}</div>; break;
    case "ayrac": govde = <div className="py-3"><div className="h-px bg-white/[0.12]" /></div>; break;
    case "acilir": govde = (
      <div>
        <div className="flex items-start gap-1">
          <button onClick={() => onGuncelle({ acik: !x.acik }, true)} aria-label={x.acik ? "Kapat" : "Aç"} className="mt-[4px] flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-white/60 hover:bg-white/[0.06]"><ChevronRight className={cn("h-4 w-4 transition-transform", x.acik && "rotate-90")} /></button>
          <div className="min-w-0 flex-1">{ed("metin", "py-[3px] text-[15px] font-medium leading-relaxed text-white", "Açılır başlık")}</div>
        </div>
        <AnimatePresence initial={false}>
          {x.acik && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease }} className="overflow-hidden pl-7">{ed("ic", "min-h-[28px] whitespace-pre-wrap py-[3px] text-[15px] leading-relaxed text-white/80", "Boş. İçerik yazmak için tıkla")}</motion.div>}
        </AnimatePresence>
      </div>
    ); break;
    case "kod": govde = (
      <div className="brif-kod my-1.5 overflow-hidden rounded-[12px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
          <select value={x.dil ?? "metin"} disabled={kilit} onChange={(e) => onGuncelle({ dil: e.target.value }, true)} aria-label="Dil" className="rounded-[6px] bg-transparent text-[12px] text-white/60 outline-none hover:text-white [&>option]:bg-[#18191c]">
            {[["metin", "Düz metin"], ["istem", "İstem"], ["json", "JSON"], ["markdown", "Markdown"], ["js", "JavaScript"], ["python", "Python"]].map(([k, ad]) => <option key={k} value={k}>{ad}</option>)}
          </select>
          <button onClick={() => void mesaj.kopyala(duzMetin((x.metin ?? "").replace(/<br\s*\/?>/g, "\n")), x.dil === "istem" ? "İstem" : "Kod")} className="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[12px] text-white/55 hover:bg-white/[0.08] hover:text-white"><Copy className="h-3.5 w-3.5" />Kopyala</button>
        </div>
        {ed("metin", "min-h-[44px] whitespace-pre-wrap px-3.5 py-3 font-mono text-[13.5px] leading-relaxed text-white/90", "Kod ya da istem yaz. Ctrl Enter ile çık")}
      </div>
    ); break;
    case "tablo": govde = <TabloBlok x={x} kilit={kilit} onGuncelle={onGuncelle} />; break;
    case "baglanti": govde = <BaglantiBlok x={x} kilit={kilit} onGuncelle={onGuncelle} />; break;
    case "gorsel": govde = <GorselBlok x={x} varliklar={varliklar} onGuncelle={onGuncelle} />; break;
    case "element": govde = <ElementBlok x={x} projeEl={projeEl} onGuncelle={onGuncelle} />; break;
    default: govde = ed("metin", "py-[3px] text-[15px] leading-relaxed text-white/85", bosYazi);
  }
  const acikYorum = (x.yorumlar ?? []).filter((y) => !y.cozuldu).length;
  if (renk && x.zemin) govde = <div className="my-0.5 rounded-[8px] px-2.5 py-0.5" style={{ background: renk.zemin }}>{govde}</div>;
  /* Girinti kabı her zaman çizilir: koşullu sarmalayıcı düzenlenen alanı yeniden kurup imleci kaybettirir. */
  govde = <div style={g ? { paddingLeft: g * 26 } : undefined}>{govde}</div>;
  return (
    <div className={cn("group/blk relative -ml-[52px] pl-[52px] transition-opacity", ust, surukleniyor && "opacity-30")}>
      {acikYorum > 0 && <span className={cn("absolute -right-14 z-10 hidden lg:block", tutamacUst)}><YorumRozeti n={acikYorum} onClick={() => { const el = document.querySelector(`[data-satir="${x.id}"]`) as HTMLElement | null; if (el) onYorum(el); }} /></span>}
      {!kilit && <span className={cn("absolute left-1 flex items-center text-white/35 opacity-0 transition-opacity group-hover/blk:opacity-100", tutamacUst, odak && "opacity-60")}>
        <button onClick={onArti} aria-label="Altına blok ekle" title="Altına blok ekle" className="flex h-6 w-6 items-center justify-center rounded-[6px] hover:bg-white/[0.08] hover:text-white"><Plus className="h-4 w-4" /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onTutamac(e); }} aria-label="Sürükle ya da menüyü aç" title="Sürükle: taşı · Tıkla: menü" className="flex h-6 w-5 cursor-grab touch-none items-center justify-center rounded-[6px] hover:bg-white/[0.08] hover:text-white active:cursor-grabbing"><GripVertical className="h-4 w-4" /></button>
      </span>}
      {govde}
    </div>
  );
}

/** Denetimsiz contentEditable: içerik yalnız ilk açılışta ve `surum` değişince yazılır; imleç kaybolmaz. */
function Duzenlenebilir({ id, blokId, html, surum, className, bos, kilit, stil, refAyarla, onKeyDown, onInput, onPaste, onOdak }: {
  id: string; blokId: string; html: string; surum: number; className: string; bos?: string; kilit?: boolean; stil?: React.CSSProperties;
  refAyarla: (id: string, el: HTMLElement | null) => void; onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void; onInput: (el: HTMLElement) => void;
  onPaste: (e: React.ClipboardEvent<HTMLElement>) => void; onOdak: (v: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current && ref.current.innerHTML !== html && document.activeElement !== ref.current) ref.current.innerHTML = html; }, [html]);
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = html; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [surum]);
  return (
    <div ref={(el) => { ref.current = el; refAyarla(id, el); }} data-blok={blokId} contentEditable={!kilit} suppressContentEditableWarning spellCheck data-bos={bos} style={stil}
      onKeyDown={onKeyDown} onInput={(e) => { const el = e.currentTarget; if (el.innerHTML === "<br>") el.innerHTML = ""; onInput(el); }} onPaste={onPaste}
      onFocus={() => onOdak(true)} onBlur={() => onOdak(false)}
      className={cn("outline-none [overflow-wrap:anywhere]", className)} />
  );
}

/* ── Projeden görsel bloğu ── */
function GorselBlok({ x, varliklar, onGuncelle }: { x: BrifBlok; varliklar: ReturnType<typeof useProjeVarliklari>; onGuncelle: (patch: Partial<BrifBlok>, yapisal?: boolean) => void }) {
  const [sec, setSec] = useState(!(x.src ?? []).length);
  const dosya = useRef<HTMLInputElement>(null);
  const kareler = useMemo(() => varliklar.map((u) => gorselAdresi(u)).filter(Boolean).slice(0, 24) as string[], [varliklar]);
  const src = x.src ?? [];
  return (
    <div className="py-1.5">
      {src.length > 0 && (
        <div className={cn("grid gap-2", src.length === 1 ? "grid-cols-1" : src.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {src.map((s) => (
            <figure key={s} className="group/g relative overflow-hidden rounded-[8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s} alt="" className={cn("w-full object-cover", src.length === 1 ? "max-h-[420px]" : "aspect-[4/3]")} />
              <button onClick={() => onGuncelle({ src: src.filter((y) => y !== s) }, true)} aria-label="Görseli kaldır" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition group-hover/g:opacity-100"><X className="h-3.5 w-3.5" /></button>
            </figure>
          ))}
        </div>
      )}
      {sec ? (
        <div className="mt-2 overflow-hidden rounded-[12px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2"><p className="flex-1 text-[13px] font-medium text-white/85">Projeden görsel seç</p>
            <input ref={dosya} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const l = Array.from(e.target.files ?? []).slice(0, 6); e.target.value = ""; try { const yeni = await Promise.all(l.map((f) => gorselKucult(f))); onGuncelle({ src: [...src, ...yeni].slice(0, 6) }, true); } catch { toast.error("Görsel okunamadı", { description: "Dosya bozuk ya da desteklenmeyen biçimde olabilir." }); } }} />
            <button onClick={() => dosya.current?.click()} className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/90 hover:bg-white/[0.14]"><Upload className="h-3.5 w-3.5" />Bilgisayardan</button>
            <button onClick={() => setSec(false)} className="h-7 rounded-full bg-white px-3 text-[12px] font-semibold text-black">Bitti</button></div>
          {kareler.length ? (
            <div className="grid max-h-[260px] grid-cols-4 gap-1.5 overflow-y-auto p-2 sm:grid-cols-6">
              {kareler.map((s) => { const a = src.includes(s); return (
                <button key={s} onClick={() => onGuncelle({ src: a ? src.filter((y) => y !== s) : [...src, s].slice(0, 6) }, true)} className={cn("relative aspect-square overflow-hidden rounded-[8px] outline outline-2 -outline-offset-2 transition", a ? "outline-white" : "outline-transparent hover:outline-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s} alt="" className="h-full w-full object-cover" />
                  {a && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3} /></span>}
                </button>
              ); })}
            </div>
          ) : <p className="px-3 py-4 text-[13px] text-white/55">Projede henüz görsel yok. Bilgisayardan yükleyebilir ya da Varlıklar bölümünde üretince burada seçebilirsin.</p>}
        </div>
      ) : src.length > 0 && <button onClick={() => setSec(true)} className="mt-1.5 text-[12.5px] text-white/45 hover:text-white">Görselleri düzenle</button>}
    </div>
  );
}

/* ── Element bloğu ── */
function ElementBlok({ x, projeEl, onGuncelle }: { x: BrifBlok; projeEl: ReturnType<typeof useElements.getState>["elementler"]; onGuncelle: (patch: Partial<BrifBlok>, yapisal?: boolean) => void }) {
  const secili = x.elementler ?? [];
  const [sec, setSec] = useState(!secili.length);
  const kartlar = projeEl.filter((e) => secili.includes(e.ad));
  return (
    <div className="py-1.5">
      {kartlar.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {kartlar.map((e) => (
            <span key={e.id} className="flex items-center gap-2 rounded-[10px] bg-white/[0.04] py-1 pl-1 pr-3 ring-1 ring-inset ring-white/[0.07]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {e.gorseller[0] ? <img src={e.gorseller[0]} alt="" className="h-9 w-9 rounded-[7px] object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-[7px] bg-[#55d6fd]/10"><AtSign className="h-4 w-4 text-[#55d6fd]" /></span>}
              <span><span className="block text-[13.5px] font-medium text-white">@{e.ad}</span><span className="block text-[11.5px] text-white/50">{e.tur === "mekan" ? "Mekân" : e.tur === "obje" ? "Nesne" : e.tur === "stil" ? "Stil" : "Karakter"}</span></span>
            </span>
          ))}
        </div>
      )}
      {sec ? (
        <div className="mt-2 overflow-hidden rounded-[12px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2"><p className="text-[13px] font-medium text-white/85">Projenin elementleri</p><button onClick={() => setSec(false)} className="h-7 rounded-full bg-white px-3 text-[12px] font-semibold text-black">Bitti</button></div>
          {projeEl.length ? (
            <div className="space-y-0.5 p-1.5">
              {projeEl.map((e) => { const a = secili.includes(e.ad); return (
                <button key={e.id} onClick={() => onGuncelle({ elementler: a ? secili.filter((y) => y !== e.ad) : [...secili, e.ad] }, true)} className="flex w-full items-center gap-3 rounded-[9px] px-2 py-1.5 text-left hover:bg-white/[0.05]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.gorseller[0] ? <img src={e.gorseller[0]} alt="" className="h-8 w-8 rounded-[7px] object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#55d6fd]/10"><AtSign className="h-4 w-4 text-[#55d6fd]" /></span>}
                  <span className="flex-1 text-[13.5px] text-white">@{e.ad}</span>
                  <span className={cn("flex h-[18px] w-[18px] items-center justify-center rounded-[5px]", a ? "bg-white text-black" : "ring-1 ring-inset ring-white/30")}>{a && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                </button>
              ); })}
            </div>
          ) : <p className="px-3 py-4 text-[13px] text-white/55">Projede element yok. Elementler bölümünden ekleyince burada seçebilirsin.</p>}
        </div>
      ) : kartlar.length > 0 && <button onClick={() => setSec(true)} className="mt-1.5 text-[12.5px] text-white/45 hover:text-white">Elementleri düzenle</button>}
    </div>
  );
}

function Kare({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-8 w-8 rounded-[8px] object-cover" />;
}

/* ── Sağda içindekiler: başlık çizgileri, üzerine gelince adlar ── */
function Icindekiler({ bloklar }: { bloklar: BrifBlok[] }) {
  const basliklar = bloklar.filter((b) => (b.tur === "h1" || b.tur === "h2" || b.tur === "h3") && duzMetin(b.metin).trim());
  const [ust, setUst] = useState(false);
  const [aktif, setAktif] = useState<string | null>(null);
  useEffect(() => {
    const f = () => {
      let a: string | null = basliklar[0]?.id ?? null;
      for (const b of basliklar) { const r = document.querySelector(`[data-satir="${b.id}"]`)?.getBoundingClientRect(); if (r && r.top < 180) a = b.id; }
      setAktif(a);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, [basliklar]);
  if (basliklar.length < 2) return <div className="hidden w-[170px] shrink-0 xl:block" />;
  return (
    <nav aria-label="İçindekiler" onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)} className="sticky top-[calc(var(--ust-nav)+80px)] hidden w-[170px] shrink-0 self-start xl:block">
      <div className="space-y-2.5 pt-2">
        {basliklar.map((b, i) => (
          <button key={b.id} onClick={() => document.querySelector(`[data-satir="${b.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex w-full items-center justify-end gap-2.5">
            <AnimatePresence>{ust && <motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.015 }} className={cn("truncate text-[12.5px]", b.tur === "h3" && "text-[12px]", aktif === b.id ? "text-white" : "text-white/55 hover:text-white")}>{duzMetin(b.metin)}</motion.span>}</AnimatePresence>
            <motion.span animate={{ width: aktif === b.id ? 16 : b.tur === "h3" ? 7 : 12 }} className={cn("h-[2px] shrink-0 rounded-full", aktif === b.id ? "bg-white" : "bg-white/20")} />
          </button>
        ))}
      </div>
    </nav>
  );
}
