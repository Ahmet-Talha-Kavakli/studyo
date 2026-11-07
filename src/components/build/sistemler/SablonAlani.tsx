"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Braces, CalendarDays, ChevronRight, Clock3, Hash, KeyRound, Search, SquareFunction, Variable } from "lucide-react";
import { ifadeAyir, islevBul } from "@/lib/build/sistemIslev";
import { gondermeler, yolBirlestir, yolParcala } from "@/lib/build/sistemSablon";
import { HapPenceresi, Onizleme, onizlemeBaglami } from "./IfadeDuzenleyici";
import { cn } from "@/lib/utils";

/**
 * Şablon alanı: metnin içinde veri hapları. "/" yazınca (satır başında ya da boşluktan sonra) ya da sağ alttaki
 * düğmeyle veri seçici açılır; seçilen alan hap olarak görünür, değer {{adim.<kimlik>.alan}} biçiminde saklanır.
 */
export type VeriAlani = { yol: string[]; ad: string; tur?: string; aciklama?: string };
export type VeriKaynagi = { onEk: string; baslik: string; alt?: string; no?: number; ikon: typeof Clock3; ornek?: unknown; cikti?: string; alanlar?: VeriAlani[]; tumu?: string };
type Dugum = { yol: string[]; ad: string; ornek?: unknown; tur?: string; aciklama?: string; cocuk?: Dugum[] };

const ornekMetin = (v: unknown) => (v === undefined ? "" : v === null ? "boş" : typeof v === "string" ? (v.length > 48 ? `${v.slice(0, 48)}…` : v || "boş metin") : typeof v === "object" ? (Array.isArray(v) ? `${v.length} öğe` : `${Object.keys(v as object).length} alan`) : String(v));

function agacKur(ornek: unknown, alanlar: VeriAlani[] = [], derinlik = 0, yol: string[] = []): Dugum[] {
  const o: Dugum[] = [];
  if (ornek && typeof ornek === "object" && derinlik < 5) {
    const giris = Array.isArray(ornek) ? (ornek.length ? [["0", ornek[0]] as const] : []) : Object.entries(ornek as object).slice(0, 60);
    for (const [k, v] of giris) {
      const y = [...yol, k];
      const ic = v && typeof v === "object" ? agacKur(v, [], derinlik + 1, y) : undefined;
      o.push({ yol: y, ad: Array.isArray(ornek) ? "ilk öğe" : k, ornek: v, cocuk: ic?.length ? ic : undefined });
    }
  }
  for (const a of alanlar) if (!o.some((x) => x.yol.join(".") === a.yol.join("."))) o.push({ yol: a.yol, ad: a.ad, tur: a.tur, aciklama: a.aciklama });
  return o;
}
function duzle(l: Dugum[]): Dugum[] { return l.flatMap((x) => [x, ...(x.cocuk ? duzle(x.cocuk) : [])]); }

const SISTEM_DEGISKENLERI: { s: string; ad: string; ikon: typeof Clock3 }[] = [
  { s: "tarih", ad: "Bugünün tarihi", ikon: CalendarDays }, { s: "saat", ad: "Saat", ikon: Clock3 }, { s: "simdi.tr", ad: "Şimdi (Türkiye saati)", ikon: Clock3 }, { s: "simdi", ad: "Şimdi (ISO)", ikon: Clock3 },
  { s: "calisma.no", ad: "Çalışma no", ikon: Hash }, { s: "calisma.id", ad: "Çalışma kimliği", ikon: Braces }, { s: "calisma.devam", ad: "Devam adresi", ikon: Braces }, { s: "sistem.ad", ad: "Sistem adı", ikon: Braces },
];

/** Hesap değişkenleri ve sırların adları (veri seçicide; değerler tarayıcıya gelmez). */
export type DegiskenAdlari = { degiskenler: { ad: string; deger?: string }[]; sirlar: { ad: string }[]; yonet?: () => void };
export const DegiskenBaglam = createContext<DegiskenAdlari>({ degiskenler: [], sirlar: [] });

/** Göndermenin hap etiketi (işlev zinciri varsa sonuna işlev adları eklenir). */
export function hapEtiketi(ifade: string, kaynaklar: VeriKaynagi[]): { metin: string; bulunamadi?: boolean } {
  if (!ifade.includes("|")) return yolEtiketi(ifade, kaynaklar);
  let a: ReturnType<typeof ifadeAyir>;
  try { a = ifadeAyir(ifade); } catch { return { metin: ifade, bulunamadi: true }; }
  const e = yolEtiketi(a.yol, kaynaklar);
  const bilinmeyen = a.islevler.some((x) => !islevBul(x.ad));
  return { metin: `${e.metin} · ${a.islevler.map((x) => islevBul(x.ad)?.etiket ?? x.ad).join(" · ")}`, bulunamadi: e.bulunamadi || bilinmeyen };
}
function yolEtiketi(ifade: string, kaynaklar: VeriKaynagi[]): { metin: string; bulunamadi?: boolean } {
  const p = yolParcala(ifade);
  const sis = SISTEM_DEGISKENLERI.find((x) => x.s === p.join("."));
  if (sis) return { metin: sis.ad };
  if (p[0] === "degisken" && p[1]) return { metin: `Değişken › ${p.slice(1).join(" › ")}` };
  if (p[0] === "sir" && p[1]) return { metin: `Sır › ${p[1]}` };
  if (p[0] === "tetik") return { metin: p.length > 1 ? `Tetik › ${p.slice(1).join(" › ")}` : "Tetik verisi" };
  if (p[0] === "dongu") return { metin: p[1] === "oge" ? (p.length > 2 ? `Öğe › ${p.slice(2).join(" › ")}` : "Döngü öğesi") : p[1] === "sira" ? "Öğe sırası" : "Öğe sayısı" };
  if (p[0] === "hata") return { metin: p[1] === "adim" ? "Hatalı adım" : "Hata iletisi" };
  if (p[0] === "adim" && p[1]) {
    const k = kaynaklar.find((x) => x.onEk === `adim.${p[1]}` || (/^\d+$/.test(p[1]) && x.no === Number(p[1])));
    if (!k) return { metin: `Silinmiş adım › ${p.slice(2).join(" › ") || "çıktı"}`, bulunamadi: true };
    const alan = p.slice(2);
    return { metin: `${k.no ? `${k.no}. ` : ""}${k.baslik} › ${alan.length ? (alan[0] === "cikti" && alan.length === 1 ? "metin çıktısı" : alan.join(" › ")) : "metin çıktısı"}` };
  }
  return { metin: ifade, bulunamadi: true };
}

const HAP = "mx-[1px] inline-flex max-w-full items-center rounded-[7px] px-1.5 align-baseline text-[12.5px] font-medium leading-[1.55] select-none";
const HAP_RENK = "bg-[#55d6fd]/[0.13] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20";
const HAP_HATA = "bg-rose-500/[0.13] text-rose-200 ring-1 ring-inset ring-rose-400/25";

function domDoldur(el: HTMLElement, deger: string, kaynaklar: VeriKaynagi[]) {
  el.textContent = "";
  let i = 0;
  for (const g of gondermeler(deger)) {
    if (g.bas > i) el.appendChild(document.createTextNode(deger.slice(i, g.bas)));
    el.appendChild(hapOlustur(`{{${g.ifade}}}`, g.ifade, kaynaklar));
    i = g.son;
  }
  if (i < deger.length) el.appendChild(document.createTextNode(deger.slice(i)));
}
function hapOlustur(sablon: string, ifade: string, kaynaklar: VeriKaynagi[]) {
  const e = hapEtiketi(ifade, kaynaklar);
  const s = document.createElement("span");
  s.contentEditable = "false";
  s.dataset.s = sablon;
  s.className = cn(HAP, e.bulunamadi ? HAP_HATA : HAP_RENK, "cursor-pointer");
  s.title = e.bulunamadi ? "Bu veri artık yok; hapı silip yeniden seç." : `${sablon} · tıkla, işlev ekle`;
  s.textContent = e.metin;
  return s;
}
function domOku(el: Node): string {
  let o = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) o += (n.textContent ?? "").replace(/​/g, "");
    else if (n instanceof HTMLElement) {
      if (n.dataset.s) o += n.dataset.s;
      else if (n.tagName === "BR") o += "\n";
      else { const ic = domOku(n); o += (n.tagName === "DIV" || n.tagName === "P") && o && !o.endsWith("\n") ? `\n${ic}` : ic; }
    }
  });
  return o;
}

export function SablonAlani({ deger, set, kaynaklar, satir = 3, tekSatir, yer, kod, etiket }: { deger: string; set: (v: string) => void; kaynaklar: VeriKaynagi[]; satir?: number; tekSatir?: boolean; yer?: string; kod?: boolean; etiket?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const son = useRef<string | null>(null);
  const aralik = useRef<Range | null>(null);
  const egik = useRef(false);
  const [secici, setSecici] = useState<{ x: number; y: number; alt?: number } | null>(null);
  const [odak, setOdak] = useState(false);
  const [hap, setHap] = useState<{ el: HTMLElement; ifade: string; konum: { x: number; y: number; alt?: number } } | null>(null);
  const dg = useContext(DegiskenBaglam);
  const baglam = useMemo(() => onizlemeBaglami(kaynaklar, dg), [kaynaklar, dg]);
  const ornekVar = useMemo(() => kaynaklar.some((k) => k.ornek !== undefined), [kaynaklar]);
  const imza = useMemo(() => kaynaklar.map((k) => `${k.onEk}:${k.no}:${k.baslik}`).join("|"), [kaynaklar]);
  const imzaRef = useRef(imza);

  useLayoutEffect(() => {
    const e = el.current;
    if (!e) return;
    const odak = document.activeElement === e;
    if (deger !== son.current || (imza !== imzaRef.current && !odak)) { domDoldur(e, deger, kaynaklar); son.current = deger; imzaRef.current = imza; }
  }, [deger, imza, kaynaklar]);

  const yaz = useCallback(() => { const e = el.current; if (!e) return; const v = domOku(e); son.current = v; set(tekSatir ? v.replace(/\n/g, " ") : v); }, [set, tekSatir]);
  const araligiSakla = () => { const s = getSelection(); if (s && s.rangeCount && el.current?.contains(s.getRangeAt(0).startContainer)) aralik.current = s.getRangeAt(0).cloneRange(); };
  const ac = (egikle: boolean) => {
    egik.current = egikle;
    araligiSakla();
    const r = aralik.current?.getBoundingClientRect();
    const k = el.current!.getBoundingClientRect();
    const x = r && r.height ? r.left : k.left, y = r && r.height ? r.bottom : k.bottom;
    const asagi = innerHeight - y > 340;
    setSecici({ x: Math.max(8, Math.min(x, innerWidth - 356)), y: asagi ? y + 6 : 0, alt: asagi ? undefined : innerHeight - (r && r.height ? r.top : k.top) + 6 });
  };
  /** Hapa tıklayınca işlev penceresi: zincir değişince hap yerinde güncellenir. */
  const hapAc = (h: HTMLElement) => {
    const r = h.getBoundingClientRect();
    const asagi = innerHeight - r.bottom > 420;
    setSecici(null);
    setHap({ el: h, ifade: (h.dataset.s ?? "").slice(2, -2), konum: { x: Math.max(8, Math.min(r.left, innerWidth - 408)), y: asagi ? r.bottom + 6 : 0, alt: asagi ? undefined : innerHeight - r.top + 6 } });
  };
  const hapDegistir = (ifade: string) => {
    if (!hap) return;
    const e = hapEtiketi(ifade, kaynaklar);
    hap.el.dataset.s = `{{${ifade}}}`;
    hap.el.textContent = e.metin;
    hap.el.title = e.bulunamadi ? "Bu veri ya da işlev geçersiz; hapa tıklayıp düzelt." : `{{${ifade}}}`;
    hap.el.className = cn(HAP, e.bulunamadi ? HAP_HATA : HAP_RENK, "cursor-pointer");
    setHap({ ...hap, ifade });
    yaz();
  };
  const ekle = (sablon: string) => {
    const e = el.current!;
    const s = getSelection()!;
    let r = aralik.current;
    if (!r || !e.contains(r.startContainer)) { r = document.createRange(); r.selectNodeContents(e); r.collapse(false); }
    // "/" ile açıldıysa eğik çizgiyi sil.
    if (egik.current && r.startContainer.nodeType === Node.TEXT_NODE && r.startOffset > 0 && r.startContainer.textContent?.[r.startOffset - 1] === "/") {
      r.setStart(r.startContainer, r.startOffset - 1);
    }
    r.deleteContents();
    const hap = hapOlustur(sablon, sablon.slice(2, -2), kaynaklar);
    r.insertNode(hap);
    const sonra = hap.nextSibling;
    const bosluk = document.createTextNode(sonra && /^\s/.test(sonra.textContent ?? "") ? "" : " ");
    hap.after(bosluk);
    const y = document.createRange(); y.setStart(bosluk, bosluk.length); y.collapse(true);
    e.focus(); s.removeAllRanges(); s.addRange(y);
    aralik.current = y.cloneRange();
    setSecici(null);
    yaz();
  };

  return (
    <div className="relative">
      <div
        ref={el}
        role="textbox" aria-multiline={!tekSatir} aria-label={etiket}
        contentEditable={"plaintext-only" as unknown as boolean} suppressContentEditableWarning spellCheck={!kod}
        onInput={yaz} onBlur={() => { araligiSakla(); setOdak(false); }} onFocus={() => setOdak(true)} onKeyUp={araligiSakla} onMouseUp={araligiSakla}
        onMouseDown={(ev) => { const h = (ev.target as HTMLElement).closest<HTMLElement>("[data-s]"); if (h && el.current?.contains(h)) { ev.preventDefault(); hapAc(h); } }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" && tekSatir) { ev.preventDefault(); return; }
          if (ev.key === "/" && !ev.ctrlKey && !ev.metaKey) {
            const s = getSelection();
            const n = s?.rangeCount ? s.getRangeAt(0) : null;
            const onceki = n && n.startContainer.nodeType === Node.TEXT_NODE ? n.startContainer.textContent?.[n.startOffset - 1] ?? "" : "";
            if (!onceki || /[\s("'[{,]/.test(onceki)) requestAnimationFrame(() => ac(true));
          } else if (secici && ev.key !== "Shift") setSecici(null);
        }}
        onCopy={(ev) => {
          const s = getSelection();
          if (!s?.rangeCount) return;
          const d = document.createElement("div"); d.appendChild(s.getRangeAt(0).cloneContents());
          ev.clipboardData.setData("text/plain", domOku(d)); ev.preventDefault();
        }}
        onPaste={() => { setTimeout(() => { const e = el.current; if (e && /\{\{/.test(e.textContent ?? "")) { const v = domOku(e); domDoldur(e, v, kaynaklar); son.current = v; set(v); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); } }, 0); }}
        style={{ minHeight: tekSatir ? 40 : 18 + satir * 22 }}
        className={cn("w-full rounded-[14px] bg-white/[0.05] px-3.5 py-[9px] pr-10 text-[14px] leading-[22px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-shadow focus:ring-white/30", tekSatir ? "whitespace-pre-wrap break-all" : "max-h-[340px] overflow-y-auto whitespace-pre-wrap break-words [scrollbar-width:thin]", kod && "sc-kod text-[12.5px]")}
      />
      {!deger && yer && <span className={cn("pointer-events-none absolute left-3.5 top-[9px] right-10 truncate text-[14px] leading-[22px] text-white/30", kod && "sc-kod text-[12.5px]")}>{yer}</span>}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); ac(false); }} title="Veri ekle (ya da / yaz)" aria-label="Veri ekle"
        className={cn("absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white/45 transition hover:bg-[#55d6fd]/[0.12] hover:text-[#8be6ff]", tekSatir ? "top-1.5" : "bottom-1.5")}><Braces className="h-3.5 w-3.5" /></button>
      <VeriSecici acik={!!secici} konum={secici} kaynaklar={kaynaklar} sec={ekle} kapat={() => setSecici(null)} />
      <AnimatePresence>{(odak || hap) && deger.includes("{{") && <Onizleme deger={deger} baglam={baglam} ornekVar={ornekVar} />}</AnimatePresence>
      <AnimatePresence>
        {hap && <HapPenceresi key="hap" konum={hap.konum} ifade={hap.ifade} etiket={hapEtiketi((() => { try { return ifadeAyir(hap.ifade).yol; } catch { return hap.ifade.split("|")[0].trim(); } })(), kaynaklar).metin} baglam={baglam}
          degistir={hapDegistir} kapat={() => setHap(null)} sil={() => { hap.el.remove(); setHap(null); yaz(); }} />}
      </AnimatePresence>
    </div>
  );
}

function AgacSatiri({ d, k, derinlik, sec }: { d: Dugum; k: VeriKaynagi; derinlik: number; sec: (s: string) => void }) {
  const [ac, setAc] = useState(false);
  return (<>
    <div className="flex items-center" style={{ paddingLeft: 6 + derinlik * 14 }}>
      {d.cocuk ? <button type="button" onClick={() => setAc(!ac)} aria-label={ac ? "Daralt" : "Genişlet"} className="flex h-7 w-6 shrink-0 items-center justify-center text-white/40 hover:text-white"><ChevronRight className={cn("h-3.5 w-3.5 transition-transform", ac && "rotate-90")} /></button> : <span className="w-6 shrink-0" />}
      <button type="button" onClick={() => sec(`{{${k.onEk}.${yolBirlestir(d.yol)}}}`)} className="flex min-w-0 flex-1 items-center gap-2 rounded-[9px] px-2 py-1.5 text-left hover:bg-white/[0.07]">
        <span className="shrink-0 text-[13px] text-white">{d.ad}</span>
        <span className="min-w-0 flex-1 truncate text-right text-[12px] text-white/40">{d.ornek !== undefined ? ornekMetin(d.ornek) : d.aciklama ?? d.tur ?? ""}</span>
      </button>
    </div>
    {d.cocuk && ac && d.cocuk.map((c) => <AgacSatiri key={c.yol.join(".")} d={c} k={k} derinlik={derinlik + 1} sec={sec} />)}
  </>);
}

function VeriSecici({ acik, konum, kaynaklar, sec, kapat }: { acik: boolean; konum: { x: number; y: number; alt?: number } | null; kaynaklar: VeriKaynagi[]; sec: (s: string) => void; kapat: () => void }) {
  const dg = useContext(DegiskenBaglam);
  const [ara, setAra] = useState("");
  const [acikGrup, setAcikGrup] = useState<Record<string, boolean>>({});
  const [hazir, setHazir] = useState(false);
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    setAra("");
    const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) kapat(); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    const z = setTimeout(() => { addEventListener("mousedown", f); }, 0);
    addEventListener("keydown", t);
    return () => { clearTimeout(z); removeEventListener("mousedown", f); removeEventListener("keydown", t); };
  }, [acik, kapat]);
  const gruplar = useMemo(() => kaynaklar.map((k) => ({ k, agac: agacKur(k.ornek, k.alanlar) })), [kaynaklar]);
  const q = ara.trim().toLocaleLowerCase("tr");
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <motion.div ref={kok} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
          style={{ left: konum.x, top: konum.alt === undefined ? konum.y : undefined, bottom: konum.alt }}
          onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault(); }}
          className="bd-panel fixed z-[140] flex max-h-[380px] w-[348px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[16px]">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Veri ara"
              onKeyDown={(e) => { if (e.key === "Enter") { const ilk = gruplar.flatMap(({ k, agac }) => duzle(agac).filter((d) => `${k.baslik} ${d.yol.join(".")}`.toLocaleLowerCase("tr").includes(q)).map((d) => `{{${k.onEk}.${yolBirlestir(d.yol)}}}`))[0]; if (ilk) sec(ilk); } }}
              className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {gruplar.map(({ k, agac }) => {
              const I = k.ikon;
              const bulunan = q ? duzle(agac).filter((d) => `${k.baslik} ${d.yol.join(".")} ${d.ad}`.toLocaleLowerCase("tr").includes(q)) : null;
              if (q && !bulunan?.length && !k.baslik.toLocaleLowerCase("tr").includes(q)) return null;
              const acikMi = q ? true : acikGrup[k.onEk] ?? (k.onEk === "tetik" || kaynaklar.indexOf(k) >= kaynaklar.length - 2);
              return (
                <div key={k.onEk} className="mb-0.5">
                  <button type="button" onClick={() => setAcikGrup((x) => ({ ...x, [k.onEk]: !acikMi }))} className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left hover:bg-white/[0.05]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.07] text-white/75"><I className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-white/85">{k.no ? `${k.no}. ` : ""}{k.baslik}</span>
                    {k.alt && <span className="shrink-0 text-[11.5px] text-white/35">{k.alt}</span>}
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-white/35 transition-transform", acikMi && "rotate-90")} />
                  </button>
                  {acikMi && (
                    <div className="pb-1">
                      {k.tumu && !q && <button type="button" onClick={() => sec(k.tumu!)} className="ml-[30px] flex w-[calc(100%-30px)] items-center gap-2 rounded-[9px] px-2 py-1.5 text-left hover:bg-white/[0.07]"><span className="text-[13px] text-white/80">{k.onEk === "tetik" ? "Verinin tamamı" : "Metin çıktısı"}</span></button>}
                      {(bulunan ?? agac).map((d) => (bulunan ? (
                        <button key={d.yol.join(".")} type="button" onClick={() => sec(`{{${k.onEk}.${yolBirlestir(d.yol)}}}`)} className="ml-[30px] flex w-[calc(100%-30px)] items-center gap-2 rounded-[9px] px-2 py-1.5 text-left hover:bg-white/[0.07]">
                          <span className="shrink-0 text-[13px] text-white">{d.yol.join(" › ")}</span><span className="min-w-0 flex-1 truncate text-right text-[12px] text-white/40">{ornekMetin(d.ornek)}</span>
                        </button>
                      ) : <AgacSatiri key={d.yol.join(".")} d={d} k={k} derinlik={1} sec={sec} />))}
                      {!agac.length && !k.tumu && <p className="ml-[36px] py-1 text-[12px] text-white/40">Alan yok; adımı deneyince çıktı alanları burada görünür.</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const dl = dg.degiskenler.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q) || "değişken".includes(q));
              const sl = dg.sirlar.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q) || "sır".includes(q));
              if (q && !dl.length && !sl.length) return null;
              return (
                <div className="mt-1 border-t border-white/[0.06] pt-1.5">
                  <div className="flex items-center gap-2 px-2 pb-1"><p className="flex-1 text-[12px] font-medium text-white/45">Değişkenler ve sırlar</p>{dg.yonet && <button type="button" onClick={() => { kapat(); dg.yonet!(); }} className="text-[11.5px] text-[#8be6ff]/80 hover:text-[#8be6ff]">Yönet</button>}</div>
                  {!dl.length && !sl.length ? <p className="px-2 pb-1.5 text-[12px] leading-relaxed text-white/40">Hesap değişkeni ya da şifreli sır yok. Sistemler sayfasındaki Değişkenler panelinden ekle.</p> : (
                    <div className="grid grid-cols-2 gap-0.5">
                      {dl.map((x) => <button key={`d-${x.ad}`} type="button" onClick={() => sec(`{{degisken.${x.ad}}}`)} title={x.deger} className="flex min-w-0 items-center gap-2 rounded-[9px] px-2 py-1.5 text-left text-[12.5px] text-white/80 hover:bg-white/[0.07]"><Variable className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]/70" /><span className="truncate">{x.ad}</span></button>)}
                      {sl.map((x) => <button key={`s-${x.ad}`} type="button" onClick={() => sec(`{{sir.${x.ad}}}`)} title="Şifreli sır; çalışmada çözülür, çıktılarda maskelenir" className="flex min-w-0 items-center gap-2 rounded-[9px] px-2 py-1.5 text-left text-[12.5px] text-white/80 hover:bg-white/[0.07]"><KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-200/70" /><span className="truncate">{x.ad}</span></button>)}
                    </div>
                  )}
                </div>
              );
            })()}
            {(!q || SISTEM_DEGISKENLERI.some((x) => x.ad.toLocaleLowerCase("tr").includes(q))) && (
              <div className="mt-1 border-t border-white/[0.06] pt-1.5">
                <p className="px-2 pb-1 text-[12px] font-medium text-white/45">Sistem</p>
                <div className="grid grid-cols-2 gap-0.5">
                  {SISTEM_DEGISKENLERI.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q)).map((x) => { const I = x.ikon; return (
                    <button key={x.s} type="button" onClick={() => sec(`{{${x.s}}}`)} className="flex items-center gap-2 rounded-[9px] px-2 py-1.5 text-left text-[12.5px] text-white/80 hover:bg-white/[0.07]"><I className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="truncate">{x.ad}</span></button>
                  ); })}
                </div>
              </div>
            )}
          </div>
          <p className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2 text-[11.5px] text-white/45"><SquareFunction className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]/70" />Eklediğin veriye tıkla: büyük harf, Türk lirası, tarih biçimi gibi işlevler ekle.</p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
