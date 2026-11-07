"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Download, FileCode2, FileJson, FileText, Folder, Image as ImageIcon, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import type { Proje } from "@/lib/build/tipler";
import { yolGecerli } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import type { ProjeKanca } from "./useProje";
import { zipOlustur } from "./zip";
import { vurgula } from "./vurgula";

function ikon(yol: string) {
  if (/\.(json|webmanifest)$/.test(yol)) return FileJson;
  if (/\.(svg|png|jpe?g|webp)$/.test(yol)) return ImageIcon;
  if (/\.(md|txt)$/.test(yol)) return FileText;
  return FileCode2;
}

type Dugum = { ad: string; yol: string; cocuklar?: Dugum[] };
function agac(yollar: string[]): Dugum[] {
  const kok: Dugum[] = [];
  for (const y of yollar) {
    const p = y.split("/");
    let l = kok;
    p.forEach((ad, i) => {
      const yol = p.slice(0, i + 1).join("/");
      let d = l.find((x) => x.ad === ad && (!!x.cocuklar === (i < p.length - 1)));
      if (!d) { d = { ad, yol, ...(i < p.length - 1 ? { cocuklar: [] } : {}) }; l.push(d); }
      if (d.cocuklar) l = d.cocuklar;
    });
  }
  const sirala = (l: Dugum[]) => { l.sort((a, b) => (!!b.cocuklar === !!a.cocuklar ? (a.ad === "index.html" ? -1 : b.ad === "index.html" ? 1 : a.ad.localeCompare(b.ad)) : b.cocuklar ? 1 : -1)); l.forEach((x) => x.cocuklar && sirala(x.cocuklar)); return l; };
  return sirala(kok);
}

function Agac({ l, secili, sec, derinlik = 0, degisen }: { l: Dugum[]; secili: string; sec: (y: string) => void; derinlik?: number; degisen: Set<string> }) {
  const [kapali, setKapali] = useState<Set<string>>(new Set());
  return (
    <>
      {l.map((d) => d.cocuklar ? (
        <div key={d.yol}>
          <button type="button" onClick={() => setKapali((k) => { const y = new Set(k); if (y.has(d.yol)) y.delete(d.yol); else y.add(d.yol); return y; })} className="flex w-full items-center gap-1.5 rounded-[8px] py-1.5 pr-2 text-left text-[12.5px] text-white/60 hover:bg-white/[0.04]" style={{ paddingLeft: 8 + derinlik * 12 }}>
            <ChevronRight className={cn("h-3 w-3 transition-transform", !kapali.has(d.yol) && "rotate-90")} /><Folder className="h-3.5 w-3.5 text-white/40" />{d.ad}
          </button>
          {!kapali.has(d.yol) && <Agac l={d.cocuklar} secili={secili} sec={sec} derinlik={derinlik + 1} degisen={degisen} />}
        </div>
      ) : (() => {
        const I = ikon(d.yol);
        return (
          <button key={d.yol} type="button" onClick={() => sec(d.yol)} className={cn("flex w-full items-center gap-1.5 rounded-[8px] py-1.5 pr-2 text-left text-[12.5px] transition-colors", secili === d.yol ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")} style={{ paddingLeft: 22 + derinlik * 12 }}>
            <I className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="min-w-0 flex-1 truncate">{d.ad}</span>{degisen.has(d.yol) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" title="Kaydedilmedi" />}
          </button>
        );
      })())}
    </>
  );
}

/** Kod sekmesi: dosya ağacı, düzenleyici (Ctrl+S kaydeder, yeni sürüm oluşur), ajan yazarken canlı akış, zip indirme. */
export function KodSekme({ k, acilacak }: { k: ProjeKanca; acilacak?: string | null }) {
  const p = k.proje as Proje;
  const yollar = useMemo(() => Object.keys(p.dosyalar), [p.dosyalar]);
  const [secili, setSecili] = useState(acilacak && acilacak.split("#")[0] in p.dosyalar ? acilacak.split("#")[0] : yollar.includes("index.html") ? "index.html" : yollar[0] ?? "");
  const [taslak, setTaslak] = useState<Record<string, string>>({});
  const [durum, setDurum] = useState<"" | "kaydediliyor" | "kaydedildi">("");
  const [hata, setHata] = useState("");
  const [yeni, setYeni] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const alan = useRef<HTMLTextAreaElement>(null);
  const numara = useRef<HTMLDivElement>(null);
  const canliKutu = useRef<HTMLPreElement>(null);
  const renkli = useRef<HTMLPreElement>(null);
  const [isaretliSatir, setIsaretliSatir] = useState<number | null>(null);
  const [arama, setArama] = useState<string | null>(null);
  const [yerine, setYerine] = useState<string | null>(null);
  const [degistirBilgi, setDegistirBilgi] = useState("");
  /** Bütün dosyalarda değiştir (büyük küçük harf duyarsız); sonuç taslağa yazılır, Ctrl+S ile kaydedilir. */
  const hepsiniDegistir = () => {
    const q = (arama ?? "").trim();
    if (q.length < 2 || yerine === null) return;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
    const yeniTaslak: Record<string, string> = {};
    let adet = 0;
    for (const y of Object.keys(p.dosyalar)) {
      const eski = taslak[y] ?? p.dosyalar[y];
      const n = eski.match(re)?.length ?? 0;
      if (!n) continue;
      adet += n;
      yeniTaslak[y] = eski.replace(re, () => yerine);
    }
    if (!adet) { setDegistirBilgi("Değiştirilecek bir şey yok."); return; }
    setTaslak((t) => ({ ...t, ...yeniTaslak }));
    setDegistirBilgi(`${Object.keys(yeniTaslak).length} dosyada ${adet} değişiklik taslağa yazıldı; kaydetmek için Ctrl S.`);
  };
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); setArama((x) => x ?? ""); } };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, []);
  const sonuclar = useMemo(() => {
    const q = (arama ?? "").trim().toLocaleLowerCase("tr");
    if (q.length < 2) return [];
    const l: { yol: string; satir: number; metin: string; sutun: number }[] = [];
    for (const y of Object.keys(p.dosyalar).sort()) {
      (taslak[y] ?? p.dosyalar[y]).split("\n").forEach((m, i) => { const c = m.toLocaleLowerCase("tr").indexOf(q); if (c >= 0 && l.length < 300) l.push({ yol: y, satir: i, metin: m.trim().slice(0, 140), sutun: c }); });
    }
    return l;
  }, [arama, p.dosyalar, taslak]);
  const satiraGit = (yol: string, satir: number, sutun: number, uzunluk: number) => {
    setSecili(yol); setIsaretliSatir(satir);
    setTimeout(() => {
      const t = alan.current; if (!t) return;
      const satirlar = t.value.split("\n");
      const bas = satirlar.slice(0, satir).reduce((a, x) => a + x.length + 1, 0) + sutun;
      t.focus(); t.setSelectionRange(bas, bas + uzunluk);
      t.scrollTop = Math.max(0, satir * 20 - t.clientHeight / 3);
    }, 30);
  };

  // acilacak: "yol" ya da "yol#satır#n" (önizlemede seçilen öğenin kaynak satırı; n aynı satırı yeniden açmak için).
  useEffect(() => {
    if (!acilacak) return;
    const [yol, satir] = acilacak.split("#");
    if (!(yol in p.dosyalar)) return;
    if (satir && Number(satir) > 0) satiraGit(yol, Number(satir) - 1, 0, 0); else setSecili(yol);
  }, [acilacak]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (secili && !(secili in p.dosyalar) && !(secili in taslak)) setSecili(yollar[0] ?? ""); }, [p.dosyalar, secili, taslak, yollar]);
  useEffect(() => { if (canliKutu.current) canliKutu.current.scrollTop = canliKutu.current.scrollHeight; }, [k.canliKod?.icerik]);

  const icerik = taslak[secili] ?? p.dosyalar[secili] ?? "";
  const degisen = useMemo(() => new Set(Object.keys(taslak).filter((y) => taslak[y] !== p.dosyalar[y])), [taslak, p.dosyalar]);
  const satir = icerik.split("\n").length;

  const kaydet = async () => {
    if (!degisen.size) return;
    setDurum("kaydediliyor"); setHata("");
    try {
      await k.guncelle({ dosyalar: { ...p.dosyalar, ...taslak }, aciklama: degisen.size === 1 ? `Elle düzenleme: ${[...degisen][0]}` : `Elle düzenleme: ${degisen.size} dosya`, kaynak: "elle" });
      setTaslak({}); setDurum("kaydedildi"); setTimeout(() => setDurum(""), 1600);
    } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); setDurum(""); }
  };
  const sil = async () => {
    if (!secili || secili === "index.html") return;
    const d = { ...p.dosyalar }; delete d[secili];
    await k.guncelle({ dosyalar: d, aciklama: `${secili} silindi`, kaynak: "elle" }).catch((e) => setHata(e.message));
    setTaslak((t) => { const y = { ...t }; delete y[secili]; return y; });
    setSilOnay(false);
  };
  const yeniOlustur = () => {
    const y = (yeni ?? "").trim().replace(/^\/+/, "");
    if (!yolGecerli(y)) { setHata("Geçersiz dosya adı. Örnek: sayfalar/iletisim.html"); return; }
    if (y in p.dosyalar) { setSecili(y); setYeni(null); return; }
    setTaslak((t) => ({ ...t, [y]: "" })); setSecili(y); setYeni(null); setHata("");
    setTimeout(() => alan.current?.focus(), 30);
  };
  const indir = () => {
    const b = zipOlustur(p.dosyalar, p.ayarlar.altAlan);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `${p.ayarlar.altAlan}.zip`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const canliBuDosya = k.canliKod && k.calisiyor;

  return (
    <div className="flex h-full min-h-0">
      {/* ağaç */}
      <div className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] max-md:hidden">
        <div className="flex h-11 shrink-0 items-center justify-between px-3 text-[12.5px] text-white/55">
          <span>{yollar.length} dosya</span>
          <span className="flex">
            <button type="button" title="Dosyalarda ara (Ctrl+Shift+F)" onClick={() => setArama((x) => (x === null ? "" : null))} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white", arama !== null && "bg-white/[0.1] text-white")}><Search className="h-3.5 w-3.5" /></button>
            {!k.saltOkunur && <button type="button" title="Yeni dosya" onClick={() => setYeni("")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white"><Plus className="h-3.5 w-3.5" /></button>}
            <button type="button" title="Projeyi indir (.zip)" onClick={indir} disabled={!yollar.length} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><Download className="h-3.5 w-3.5" /></button>
          </span>
        </div>
        {arama !== null && (
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-3 [scrollbar-width:thin]">
            <label className="mb-1.5 flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.08] px-2 text-white/45 ring-1 ring-inset ring-white/15">
              <Search className="h-3.5 w-3.5 shrink-0" /><input autoFocus value={arama} onChange={(e) => { setArama(e.target.value); setDegistirBilgi(""); }} onKeyDown={(e) => e.key === "Escape" && setArama(null)} placeholder="Bütün dosyalarda ara" className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/35" />
              {!k.saltOkunur && <button type="button" title="Değiştir" aria-label="Değiştir alanını aç" onClick={() => setYerine((x) => (x === null ? "" : null))} className={cn("flex h-6 shrink-0 items-center rounded-[6px] px-1.5 text-[11px]", yerine !== null ? "bg-white/[0.14] text-white" : "text-white/45 hover:text-white")}>Değiştir</button>}
            </label>
            {yerine !== null && (
              <div className="mb-1.5 flex items-center gap-1.5">
                <input value={yerine} onChange={(e) => setYerine(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") hepsiniDegistir(); }} placeholder="Yerine" className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.06] px-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/10 placeholder:text-white/35 focus:ring-white/25" />
                <button type="button" onClick={hepsiniDegistir} disabled={(arama ?? "").trim().length < 2 || !sonuclar.length} className="h-8 shrink-0 rounded-[9px] bg-white px-2.5 text-[11.5px] font-semibold text-black disabled:opacity-35">Hepsini</button>
              </div>
            )}
            {degistirBilgi && <p className="px-1.5 pb-1.5 text-[11.5px] leading-snug text-[#8be6ff]">{degistirBilgi}</p>}
            {arama.trim().length >= 2 && <p className="px-1.5 pb-1 text-[11.5px] text-white/40">{sonuclar.length ? `${sonuclar.length}${sonuclar.length >= 300 ? "+" : ""} sonuç, ${new Set(sonuclar.map((x) => x.yol)).size} dosya` : "Sonuç yok"}</p>}
            {sonuclar.map((r, i) => (
              <button key={i} type="button" onClick={() => satiraGit(r.yol, r.satir, r.sutun, arama.trim().length)} className="block w-full rounded-[8px] px-2 py-1.5 text-left hover:bg-white/[0.05]">
                <span className="flex items-center justify-between gap-2 text-[11.5px] text-white/45"><span className="truncate font-mono">{r.yol}</span><span className="shrink-0 tabular-nums">{r.satir + 1}</span></span>
                <span className="block truncate font-mono text-[12px] text-white/75">{r.metin}</span>
              </button>
            ))}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-1.5 pb-3 [scrollbar-width:thin]", arama !== null && "hidden")}>
          {yeni !== null && (
            <form onSubmit={(e) => { e.preventDefault(); yeniOlustur(); }} className="mb-1 flex items-center gap-1 px-1">
              <input autoFocus value={yeni} onChange={(e) => setYeni(e.target.value)} onBlur={() => !yeni && setYeni(null)} placeholder="ad.html" className="h-8 min-w-0 flex-1 rounded-[8px] bg-white/[0.06] px-2 font-mono text-[12px] text-white outline-none ring-1 ring-inset ring-white/20" />
            </form>
          )}
          <Agac l={agac([...new Set([...yollar, ...Object.keys(taslak)])])} secili={secili} sec={setSecili} degisen={degisen} />
          {!yollar.length && yeni === null && <p className="px-2 pt-2 text-[12px] leading-relaxed text-white/40">Henüz dosya yok. Ajan yazdıkça burada görünür ya da artıya basıp kendin ekle.</p>}
        </div>
      </div>

      {/* düzenleyici */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
          <span className={cn("min-w-0 flex-1 truncate font-mono text-[12.5px] text-white/75", !canliBuDosya && "max-md:hidden")}>{canliBuDosya ? k.canliKod!.yol ?? "…" : secili || "Dosya seç"}</span>
          {/* telefonda ağaç yerine açılır dosya seçici */}
          {!canliBuDosya && (
            <select value={secili} onChange={(e) => setSecili(e.target.value)} aria-label="Dosya" className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.06] px-2 font-mono text-[12.5px] text-white outline-none md:hidden">
              {[...new Set([...yollar, ...Object.keys(taslak)])].sort().map((y) => <option key={y} value={y} className="bg-[#17181b]">{y}{degisen.has(y) ? " (kaydedilmedi)" : ""}</option>)}
            </select>
          )}
          {canliBuDosya ? <span className="flex items-center gap-1.5 text-[12px] text-[#55d6fd]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Ajan yazıyor</span> : (
            <>
              {hata && <span className="truncate text-[12px] text-rose-300">{hata}</span>}
              <span className="text-[11.5px] tabular-nums text-white/35 max-md:hidden">{satir} satır</span>
              {secili && secili !== "index.html" && secili in p.dosyalar && !k.saltOkunur && (silOnay
                ? <span className="flex items-center gap-1"><button type="button" onClick={sil} className="h-7 rounded-full bg-rose-500/15 px-2.5 text-[12px] text-rose-200 hover:bg-rose-500/25">Sil</button><button type="button" onClick={() => setSilOnay(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button></span>
                : <button type="button" title="Dosyayı sil" onClick={() => setSilOnay(true)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>)}
              <button type="button" onClick={kaydet} disabled={!degisen.size || durum === "kaydediliyor" || k.calisiyor || k.saltOkunur} title={k.saltOkunur ? "İzleyici olarak kaydedemezsin" : undefined} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-30">
                {durum === "kaydediliyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : durum === "kaydedildi" ? <Check className="h-3.5 w-3.5" /> : null}{durum === "kaydedildi" ? "Kaydedildi" : "Kaydet"}
              </button>
            </>
          )}
        </div>
        {canliBuDosya ? (
          <pre ref={canliKutu} className="kod-renk min-h-0 flex-1 overflow-auto bg-[#0c0d0f] p-4 font-mono text-[12.5px] leading-[1.6] text-white/80 [scrollbar-width:thin]"><span dangerouslySetInnerHTML={{ __html: vurgula(k.canliKod!.icerik, k.canliKod!.yol ?? "") }} /><span className="build-imlec" /></pre>
        ) : secili ? (
          <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#0c0d0f]">
            <div ref={numara} aria-hidden className="w-12 shrink-0 select-none overflow-hidden py-4 pr-3 text-right font-mono text-[12.5px] leading-[1.6] text-white/20">
              {Array.from({ length: satir }, (_, i) => <div key={i} className={cn(isaretliSatir === i && "text-[#55d6fd]")}>{i + 1}</div>)}
            </div>
            <div className="relative min-w-0 flex-1">
            {/* Renkli kod: saydam textarea'nın arkasında aynı ölçülerle çizilir, kaydırma eşlenir. */}
            <pre ref={renkli} aria-hidden className="kod-renk pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre py-4 pr-4 font-mono text-[12.5px] leading-[1.6] text-white/85 [tab-size:2]"
              dangerouslySetInnerHTML={{ __html: vurgula(icerik, secili) + "\n" }} />
            <textarea ref={alan} value={icerik} spellCheck={false} readOnly={k.calisiyor || k.saltOkunur}
              onChange={(e) => setTaslak((t) => ({ ...t, [secili]: e.target.value }))}
              onScroll={(e) => { if (numara.current) numara.current.scrollTop = e.currentTarget.scrollTop; if (renkli.current) { renkli.current.scrollTop = e.currentTarget.scrollTop; renkli.current.scrollLeft = e.currentTarget.scrollLeft; } }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); kaydet(); }
                if (e.key === "Tab") {
                  e.preventDefault();
                  const t = e.currentTarget, a = t.selectionStart, b = t.selectionEnd;
                  const y = icerik.slice(0, a) + "  " + icerik.slice(b);
                  setTaslak((x) => ({ ...x, [secili]: y }));
                  requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; });
                }
              }}
              className="kod-alan absolute inset-0 h-full w-full resize-none whitespace-pre bg-transparent py-4 pr-4 font-mono text-[12.5px] leading-[1.6] outline-none [scrollbar-width:thin] [tab-size:2]" />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-white/40">Soldan bir dosya seç</div>
        )}
        <AnimatePresence>
          {degisen.size > 0 && !k.calisiyor && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="shrink-0 border-t border-white/[0.06] px-3 py-1.5 text-[11.5px] text-white/45">
              {degisen.size} dosyada kaydedilmemiş değişiklik · Ctrl+S ile kaydet, yeni sürüm oluşur
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
