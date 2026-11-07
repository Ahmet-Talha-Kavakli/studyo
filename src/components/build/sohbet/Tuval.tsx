"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle, ArrowUp, Check, ChevronRight, Code2, Copy, Download, FileText, GitCompare, Languages, Loader2, Pencil, Play, RotateCcw, Sparkles, Terminal, Wand2, X,
} from "lucide-react";
import { vurgula } from "@/components/build/calisma/vurgula";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { api } from "@/lib/build/istemci";
import type { TuvalSonucu } from "@/lib/build/sohbetTipler";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { cn } from "@/lib/utils";
import { Md } from "./Metin";
import { Acilir, SurumGecis, dosyaAdi, indir, useAcilir } from "./ortak";

type Surum = { no: number; icerik: string; zaman: number; kaynak: "vayra" | "sen"; not?: string };
type Tuval = { id: string; sohbet: string; baslik: string; tip: "belge" | "kod"; dil?: string; surumler: Surum[]; guncelleme: number };
type Oneri = { alinti: string; oneri: string; yeni: string };
type Secim = { bas: number; son: number; metin: string };

const UZANTI: Record<string, string> = { python: "py", py: "py", javascript: "js", js: "js", typescript: "ts", ts: "ts", html: "html", css: "css", java: "java", "c#": "cs", csharp: "cs", go: "go", php: "php", swift: "swift", kotlin: "kt", rust: "rs", "c++": "cpp", cpp: "cpp", ruby: "rb", sql: "sql", bash: "sh", shell: "sh", json: "json", yaml: "yml" };
const VURGU: Record<string, string> = { javascript: "js", js: "js", typescript: "js", ts: "js", json: "json", html: "html", css: "css", xml: "html", svg: "html" };
const DILLER = ["Python", "JavaScript", "TypeScript", "Java", "C#", "Go", "PHP", "Swift", "Kotlin", "Rust", "C++", "SQL"];
const UZUNLUK = ["En kısa", "Kısa", "Şimdiki", "Uzun", "En uzun"];
const OKUMA = ["İlkokul", "Ortaokul", "Lise", "Üniversite", "Uzman"];
const TONLAR = [{ id: "resmi", ad: "Resmî" }, { id: "gunluk", ad: "Gündelik" }, { id: "samimi", ad: "Samimi" }, { id: "ikna", ad: "İkna edici" }, { id: "akademik", ad: "Akademik" }];
const HIZLI = ["Kısalt", "Uzat", "Sadeleştir", "Resmîleştir", "Düzelt"];
const kelime = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;

/* ── Fark: satır düzeyinde LCS, değişen satır öbeklerinde kelime düzeyinde ── */
type FarkParca = { t: string; tur: "ayni" | "ekle" | "sil" };
function lcs<T>(a: T[], b: T[], esit: (x: T, y: T) => boolean): [number, number][] | null {
  const n = a.length, m = b.length;
  if (n * m > 3_000_000) return null;
  const d = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) d[i * (m + 1) + j] = esit(a[i], b[j]) ? d[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(d[(i + 1) * (m + 1) + j], d[i * (m + 1) + j + 1]);
  const o: [number, number][] = [];
  for (let i = 0, j = 0; i < n && j < m;) { if (esit(a[i], b[j])) { o.push([i, j]); i++; j++; } else if (d[(i + 1) * (m + 1) + j] >= d[i * (m + 1) + j + 1]) i++; else j++; }
  return o;
}
function kelimeFarki(a: string, b: string): FarkParca[] {
  const ta = a.split(/(\s+)/), tb = b.split(/(\s+)/);
  const e = lcs(ta, tb, (x, y) => x === y);
  if (!e) return [{ t: a, tur: "sil" }, { t: b, tur: "ekle" }];
  const o: FarkParca[] = [];
  let i = 0, j = 0;
  for (const [x, y] of [...e, [ta.length, tb.length] as [number, number]]) {
    if (i < x) o.push({ t: ta.slice(i, x).join(""), tur: "sil" });
    if (j < y) o.push({ t: tb.slice(j, y).join(""), tur: "ekle" });
    if (x < ta.length) o.push({ t: ta[x], tur: "ayni" });
    i = x + 1; j = y + 1;
  }
  return o;
}
export function farkHesapla(a: string, b: string): FarkParca[] | null {
  const la = a.split("\n"), lb = b.split("\n");
  const e = lcs(la, lb, (x, y) => x === y);
  if (!e) return null;
  const o: FarkParca[] = [];
  let i = 0, j = 0;
  for (const [x, y] of [...e, [la.length, lb.length] as [number, number]]) {
    const sil = la.slice(i, x).join("\n"), ekle = lb.slice(j, y).join("\n");
    if (sil && ekle) o.push(...kelimeFarki(sil, ekle), { t: "\n", tur: "ayni" });
    else if (sil) o.push({ t: `${sil}\n`, tur: "sil" });
    else if (ekle) o.push({ t: `${ekle}\n`, tur: "ekle" });
    if (x < la.length) o.push({ t: `${la[x]}\n`, tur: "ayni" });
    i = x + 1; j = y + 1;
  }
  return o;
}

/** Sohbetteki tuval kartı: tür simgesi, başlık, kelime ve sürüm, ilk satırlar; tıklayınca yan panelde açılır. */
export function TuvalKarti({ s, ac, paylasim }: { s: TuvalSonucu; ac?: (id: string) => void; paylasim?: string }) {
  const [acik, setAcik] = useState(false);
  const [icerik, setIcerik] = useState<string | null>(null);
  const I = s.tip === "kod" ? Code2 : FileText;
  const tikla = () => {
    if (ac) { ac(s.id); return; }
    if (!paylasim) return;
    setAcik((x) => !x);
    if (icerik === null) api<{ tuval: { icerik: string } }>(`/api/build/sohbet/paylasim/${paylasim}/tuval/${s.id}`).then((v) => setIcerik(v.tuval.icerik)).catch(() => setIcerik(s.onizleme));
  };
  return (
    <div className="my-3 max-w-[620px]">
      <button type="button" onClick={tikla} className="group flex w-full items-stretch gap-3 overflow-hidden rounded-[18px] bg-white/[0.04] p-2.5 text-left ring-1 ring-inset ring-white/[0.09] transition-colors hover:bg-white/[0.07]">
        <span className="relative flex w-[92px] shrink-0 flex-col gap-[5px] overflow-hidden rounded-[12px] bg-[#0d0e10] p-2.5 ring-1 ring-inset ring-white/[0.06] max-sm:hidden">
          {s.tip === "kod"
            ? s.onizleme.split("\n").slice(0, 7).map((l, i) => <span key={i} className="block h-[5px] rounded-full bg-[#55d6fd]/30" style={{ width: `${Math.min(100, 18 + (l.trim().length % 9) * 9)}%`, marginLeft: `${Math.min(30, (l.length - l.trimStart().length) * 3)}%` }} />)
            : [80, 100, 92, 100, 64, 96, 72].map((w, i) => <span key={i} className={cn("block h-[5px] rounded-full", i === 0 ? "h-[7px] bg-white/45" : "bg-white/[0.16]")} style={{ width: `${w}%` }} />)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <span className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><I className="h-3.5 w-3.5" /></span><span className="truncate text-[14.5px] font-semibold text-white">{s.baslik}</span></span>
          <span className="mt-1 truncate pl-9 text-[12.5px] text-white/50">{s.tip === "kod" ? `Kod${s.dil ? ` · ${s.dil}` : ""}` : "Belge"} · {s.kelime} kelime · sürüm {s.surum}</span>
        </span>
        <span className="flex shrink-0 items-center pr-1.5"><span className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition-transform group-active:scale-95">{ac ? "Aç" : acik ? "Gizle" : "Göster"}<ChevronRight className="h-3.5 w-3.5" /></span></span>
      </button>
      <AnimatePresence initial={false}>
        {acik && !ac && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 max-h-[480px] overflow-auto rounded-[16px] bg-[#0f1012] p-4 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">
              {icerik === null ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : s.tip === "kod"
                ? <pre className="kod-renk sc-kod whitespace-pre-wrap text-[12.5px] leading-[1.6] text-white/85"><code dangerouslySetInnerHTML={{ __html: vurgula(icerik, `x.${VURGU[(s.dil ?? "").toLowerCase()] ?? "txt"}`) }} /></pre>
                : <Md metin={icerik} onizle={() => {}} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Kod tuvalinde JavaScript'i kum havuzlu çerçevede çalıştırır, konsol satırlarını toplar. */
function jsCalistir(kod: string): Promise<{ tur: "log" | "hata"; metin: string }[]> {
  return new Promise((coz) => {
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts");
    f.style.display = "none";
    const anahtar = `vt${Math.random().toString(36).slice(2)}`;
    const l: { tur: "log" | "hata"; metin: string }[] = [];
    const bitir = () => { removeEventListener("message", dinle); f.remove(); coz(l.length ? l : [{ tur: "log", metin: "(çıktı yok)" }]); };
    const dinle = (e: MessageEvent) => { if (e.source !== f.contentWindow || e.data?.k !== anahtar) return; if (e.data.son) { bitir(); return; } if (l.length < 300) l.push({ tur: e.data.tur, metin: String(e.data.metin).slice(0, 2000) }); };
    addEventListener("message", dinle);
    const kac = JSON.stringify(kod).replace(/</g, "\\u003c");
    f.srcdoc = `<script>(function(){var K=${JSON.stringify(anahtar)};function g(t,m){parent.postMessage({k:K,tur:t,metin:m},"*")}function s(a){return Array.prototype.map.call(a,function(x){try{return typeof x==="string"?x:JSON.stringify(x)}catch(e){return String(x)}}).join(" ")}
console.log=function(){g("log",s(arguments))};console.info=console.log;console.warn=function(){g("log",s(arguments))};console.error=function(){g("hata",s(arguments))};
window.onerror=function(m,u,l){g("hata",m+(l?" (satır "+l+")":""))};
try{var r=(0,eval)(${kac});if(r&&typeof r.then==="function"){r.then(function(v){if(v!==undefined)g("log",s([v]));parent.postMessage({k:K,son:1},"*")},function(e){g("hata",String(e&&e.message||e));parent.postMessage({k:K,son:1},"*")});return}if(r!==undefined)g("log",s([r]))}catch(e){g("hata",String(e&&e.message||e))}
setTimeout(function(){parent.postMessage({k:K,son:1},"*")},50)})()</script>`;
    document.body.appendChild(f);
    setTimeout(() => { if (f.isConnected) { l.push({ tur: "hata", metin: "Kod 5 saniyede bitmedi; durduruldu." }); bitir(); } }, 5000);
  });
}

/**
 * Tuval paneli (ChatGPT Canvas, Gemini Canvas gibi): belgeyi Markdown görünümünde okur ya da düzenlersin, kodu
 * renklendirilmiş görürsün; seçtiğin parçayı yapay zekâyla yeniden yazdırırsın; kısayollar (uzunluk ve okuma düzeyi
 * kaydırıcıları, ton, son rötuş, düzeltme önerileri; kodda inceleme, yorum, günlük, hata düzeltme, başka dile çevirme);
 * sürümler arasında gezinir, değişiklikleri görür, eski sürümü geri yüklersin; Markdown, Word, PDF ya da kod
 * dosyası indirirsin; HTML'i önizler, JavaScript'i çalıştırırsın.
 */
export function TuvalPaneli({ id, kapat, model, ipucu, calisiyor }: { id: string; kapat: () => void; model: string; ipucu?: number; calisiyor?: boolean }) {
  const [t, setT] = useState<Tuval | null>(null);
  const [yok, setYok] = useState("");
  const [sira, setSira] = useState(-1);
  const [duzen, setDuzen] = useState(false);
  const [taslak, setTaslak] = useState("");
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydediliyor" | "kaydedildi">("");
  const [fark, setFark] = useState(false);
  const [secim, setSecim] = useState<Secim | null>(null);
  const [istek, setIstek] = useState("");
  const [mesgul, setMesgul] = useState("");
  const [hata, setHata] = useState("");
  const [oneriler, setOneriler] = useState<Oneri[] | null>(null);
  const [gorunum, setGorunum] = useState<"kod" | "onizleme">("kod");
  const [konsol, setKonsol] = useState<{ tur: "log" | "hata"; metin: string }[] | null>(null);
  const [baslikDuzen, setBaslikDuzen] = useState<string | null>(null);
  const [uzunluk, setUzunluk] = useState(2);
  const [okuma, setOkuma] = useState(2);
  const [kopya, setKopya] = useState(false);
  const kisayol = useAcilir(320, "yukari");
  const indirMenu = useAcilir(240);
  const govde = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kenar = useKenarStili("build-sohbet-tuval", 640, 400, 1100);

  const yukle = useCallback(async (son = true) => {
    try {
      const v = await api<{ tuval: Tuval }>(`/api/build/sohbet/tuval/${id}`);
      setT(v.tuval); setYok("");
      if (son) setSira(v.tuval.surumler.length - 1);
      return v.tuval;
    } catch (e) { setYok(e instanceof Error ? e.message : "Tuval açılamadı."); return null; }
  }, [id]);
  useEffect(() => { setT(null); setDuzen(false); setFark(false); setSecim(null); setOneriler(null); setKonsol(null); setGorunum("kod"); yukle(); }, [id, yukle]);
  useEffect(() => { if (ipucu) yukle(); }, [ipucu, yukle]);

  const surumler = t?.surumler ?? [];
  const i = sira < 0 ? surumler.length - 1 : Math.min(sira, surumler.length - 1);
  const surum = surumler[i];
  const icerik = surum?.icerik ?? "";
  const sonMu = i === surumler.length - 1;
  const kod = t?.tip === "kod";
  const dil = (t?.dil ?? "").toLowerCase();
  const html = kod && /^(html|htm|svg)$/.test(dil);
  const js = kod && /^(javascript|js)$/.test(dil);
  const farkParcalari = useMemo(() => (fark && i > 0 ? farkHesapla(surumler[i - 1].icerik, icerik) : null), [fark, i, surumler, icerik]);


  const tuvalGeldi = (x: Tuval) => { setT(x); setSira(x.surumler.length - 1); };

  // Elle düzenleme: yazmayı bırakınca kaydedilir (art arda kayıtlar sunucuda tek sürümde birleşir).
  const kaydet = useCallback(async (metin: string) => {
    setKayit("kaydediliyor");
    try { const v = await api<{ tuval: Tuval }>(`/api/build/sohbet/tuval/${id}`, { method: "PATCH", govde: { icerik: metin } }); tuvalGeldi(v.tuval); setKayit("kaydedildi"); setTimeout(() => setKayit((x) => (x === "kaydedildi" ? "" : x)), 1500); }
    catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); setKayit(""); }
  }, [id]);
  const yaz = (v: string) => {
    setTaslak(v); setKayit("bekliyor");
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => kaydet(v), 1200);
  };
  const duzenAc = () => { setTaslak(icerik); setDuzen(true); setFark(false); setSecim(null); setTimeout(() => alan.current?.focus(), 30); };
  const duzenKapat = () => { if (zamanlayici.current) { clearTimeout(zamanlayici.current); zamanlayici.current = null; if (taslak !== icerik) kaydet(taslak); } setDuzen(false); };
  useEffect(() => () => { if (zamanlayici.current) clearTimeout(zamanlayici.current); }, []);

  const islem = async (g: Record<string, unknown>, etiket: string) => {
    if (mesgul) return;
    if (zamanlayici.current) { clearTimeout(zamanlayici.current); zamanlayici.current = null; if (duzen && taslak !== icerik) await kaydet(taslak); }
    setMesgul(etiket); setHata(""); kisayol.setAcik(false);
    try {
      const v = await api<{ tuval?: Tuval; oneriler?: Oneri[]; kredi?: number; bakiye?: number }>(`/api/build/sohbet/tuval/${id}`, { govde: { ...g, model } });
      buildKrediUygula(v);
      if (v.oneriler) setOneriler(v.oneriler);
      if (v.tuval) { tuvalGeldi(v.tuval); if (duzen) setTaslak(v.tuval.surumler[v.tuval.surumler.length - 1].icerik); setSecim(null); setIstek(""); }
    } catch (e) { setHata(e instanceof Error ? e.message : "İşlem yapılamadı."); }
    finally { setMesgul(""); }
  };
  const secimiGonder = (talimat: string) => {
    if (!secim || !talimat.trim()) return;
    // Görünümde seçilen metin kaynakta birebir yoksa (Markdown işaretleri) bütün belgeye o bölümle sınırlı talimat gider.
    if (secim.bas < 0) islem({ islem: "tum", talimat: `Yalnız şu bölümü değiştir, belgenin geri kalanını aynen koru. Bölüm: "${secim.metin.slice(0, 1500)}". İstek: ${talimat}` }, "secim");
    else islem({ islem: "secim", secim, talimat }, "secim");
  };
  const tumuneGonder = (talimat: string) => { if (talimat.trim()) islem({ islem: "tum", talimat }, "tum"); };

  // Görünümde seçim: seçilen metin kaynakta aranır (Markdown işaretleri farkı için ilk eşleşme).
  const gorunumSecimi = () => {
    if (duzen || !sonMu) return;
    const sel = getSelection();
    const metin = sel?.toString().trim() ?? "";
    if (!metin || metin.length < 2 || !govde.current?.contains(sel?.anchorNode ?? null)) return;
    const bas = icerik.indexOf(metin);
    setSecim(bas >= 0 ? { bas, son: bas + metin.length, metin } : { bas: -1, son: -1, metin });
  };
  const alanSecimi = () => {
    const a = alan.current;
    if (!a) return;
    if (a.selectionEnd - a.selectionStart > 1) setSecim({ bas: a.selectionStart, son: a.selectionEnd, metin: a.value.slice(a.selectionStart, a.selectionEnd) });
  };
  const oneriUygula = async (o: Oneri) => {
    if (!icerik.includes(o.alinti)) { setOneriler((l) => l?.filter((x) => x !== o) ?? null); return; }
    setOneriler((l) => l?.filter((x) => x !== o) ?? null);
    try { const v = await api<{ tuval: Tuval }>(`/api/build/sohbet/tuval/${id}`, { method: "PATCH", govde: { icerik: icerik.replace(o.alinti, o.yeni), kaynak: "oneri", not: `Öneri: ${o.oneri.slice(0, 60)}` } }); tuvalGeldi(v.tuval); }
    catch (e) { setHata(e instanceof Error ? e.message : "Uygulanamadı."); }
  };
  const indirDosya = async (tur: "md" | "docx" | "pdf" | "kod") => {
    indirMenu.setAcik(false);
    if (!t) return;
    if (tur === "md") indir(`${dosyaAdi(t.baslik)}.md`, icerik);
    else if (tur === "kod") indir(`${dosyaAdi(t.baslik)}.${UZANTI[dil] ?? "txt"}`, icerik, "text/plain;charset=utf-8");
    else if (tur === "docx") {
      setMesgul("docx");
      try { const v = await api<{ dosya: { url: string } }>(`/api/build/sohbet/tuval/${id}`, { govde: { islem: "docx" } }); const a = document.createElement("a"); a.href = v.dosya.url; a.download = `${t.baslik}.docx`; document.body.appendChild(a); a.click(); a.remove(); }
      catch (e) { setHata(e instanceof Error ? e.message : "Word dosyası üretilemedi."); } finally { setMesgul(""); }
    } else {
      const w = window.open("", "_blank");
      const ic = govde.current?.querySelector("[data-tuval-icerik]")?.innerHTML ?? "";
      if (!w) { setHata("Yeni pencere açılamadı; tarayıcının açılır pencere iznini ver."); return; }
      w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${t.baslik.replace(/</g, "&lt;")}</title><style>body{font:15px/1.7 -apple-system,"Segoe UI",Roboto,sans-serif;color:#111;max-width:720px;margin:40px auto;padding:0 24px}h1,h2,h3,h4{line-height:1.3}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}pre{background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap}button{display:none}blockquote{border-left:3px solid #55d6fd;margin:0;padding-left:14px;color:#444}a{color:#0a66c2}</style></head><body>${ic}<script>setTimeout(function(){print()},300)</script></body></html>`);
      w.document.close();
    }
  };
  const calistir = async () => { if (!js) return; setMesgul("calistir"); setKonsol(await jsCalistir(icerik)); setMesgul(""); };

  const kisayolDugmesi = (ad: string, alt: string, g: Record<string, unknown>, I: typeof Sparkles) => (
    <button type="button" onClick={() => islem({ islem: g.islem ?? "tum", ...g }, String(g.kisayol ?? g.islem))} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left hover:bg-white/[0.06]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/80"><I className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{ad}</span><span className="block truncate text-[12px] text-white/50">{alt}</span></span>
    </button>
  );
  const kaydirici = (ad: string, etiketler: string[], deger: number, set: (n: number) => void, uygula: () => void) => (
    <div className="rounded-[14px] bg-white/[0.035] p-2.5 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center justify-between text-[12.5px]"><span className="text-white/60">{ad}</span><span className="font-medium text-white">{etiketler[deger]}</span></div>
      <input type="range" min={0} max={etiketler.length - 1} step={1} value={deger} onChange={(e) => set(Number(e.target.value))} aria-label={ad} className="mt-2 w-full accent-[#55d6fd]" />
      <div className="mt-1 flex justify-between text-[11px] text-white/40"><span>{etiketler[0]}</span><span>{etiketler[etiketler.length - 1]}</span></div>
      <button type="button" disabled={ad === "Uzunluk" && deger === 2} onClick={uygula} className="mt-2 h-8 w-full rounded-full bg-white text-[12.5px] font-semibold text-black disabled:opacity-30">Uygula</button>
    </div>
  );

  return (
    <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} style={kenar.stil}
      className="fixed inset-y-2 right-2 z-40 flex w-[min(760px,calc(100vw-16px))] flex-col overflow-hidden rounded-[20px] bg-[#111214] ring-1 ring-inset ring-white/[0.09] xl:relative xl:inset-auto xl:right-auto xl:h-[calc(100vh-16px)] xl:w-[var(--yan-en)] xl:shrink-0">
      <KenarTutamac en={kenar.en} anahtar={kenar.anahtar} varsayilan={kenar.varsayilan} min={kenar.min} max={kenar.max} etiket="Tuval panelinin genişliği" className="max-xl:hidden" />
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]">{kod ? <Code2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>
        {baslikDuzen !== null ? (
          <form className="min-w-0 flex-1" onSubmit={async (e) => { e.preventDefault(); const b = baslikDuzen.trim(); setBaslikDuzen(null); if (b && t && b !== t.baslik) { const v = await api<{ tuval: Tuval }>(`/api/build/sohbet/tuval/${id}`, { method: "PATCH", govde: { baslik: b } }).catch(() => null); if (v) setT(v.tuval); } }}>
            <input autoFocus value={baslikDuzen} onChange={(e) => setBaslikDuzen(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={120} className="h-8 w-full rounded-[9px] bg-white/[0.06] px-2.5 text-[13.5px] text-white outline-none ring-1 ring-inset ring-[#55d6fd]/50" />
          </form>
        ) : (
          <button type="button" onClick={() => t && setBaslikDuzen(t.baslik)} title="Adlandır" className="min-w-0 flex-1 truncate rounded-[9px] px-1.5 py-1 text-left text-[14px] font-semibold text-white hover:bg-white/[0.05]">{t?.baslik ?? "Tuval"}</button>
        )}
        {surumler.length > 1 && <span className="flex items-center rounded-full bg-white/[0.05] pl-2.5 text-[12px] text-white/55"><span className="max-sm:hidden">Sürüm</span><SurumGecis sira={i} toplam={surumler.length} sec={(x) => { setSira(x); setDuzen(false); setSecim(null); }} /></span>}
        {i > 0 && <button type="button" onClick={() => { setFark((x) => !x); setDuzen(false); }} title="Önceki sürümle farkı göster" aria-pressed={fark} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", fark ? "bg-[#55d6fd]/[0.16] text-[#8be6ff]" : "text-white/55 hover:bg-white/[0.07] hover:text-white")}><GitCompare className="h-3.5 w-3.5" /></button>}
        <button type="button" title={kopya ? "Kopyalandı" : "Kopyala"} aria-label="Kopyala" onClick={() => { navigator.clipboard?.writeText(icerik); setKopya(true); setTimeout(() => setKopya(false), 1300); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
        <div ref={indirMenu.kok}>
          <button type="button" title="İndir" aria-label="İndir" onClick={() => indirMenu.setAcik(!indirMenu.acik)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{mesgul === "docx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}</button>
          <Acilir a={indirMenu}>
            {kod ? (
              <button type="button" onClick={() => indirDosya("kod")} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] text-white hover:bg-white/[0.06]"><Code2 className="h-4 w-4 text-white/70" />Kod dosyası (.{UZANTI[dil] ?? "txt"})</button>
            ) : (
              <>
                <button type="button" onClick={() => indirDosya("docx")} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] text-white hover:bg-white/[0.06]"><FileText className="h-4 w-4 text-[#7fb3ff]" />Word belgesi (.docx)</button>
                <button type="button" onClick={() => indirDosya("pdf")} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] text-white hover:bg-white/[0.06]"><FileText className="h-4 w-4 text-rose-300" />PDF (yazdır ve kaydet)</button>
                <button type="button" onClick={() => indirDosya("md")} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] text-white hover:bg-white/[0.06]"><FileText className="h-4 w-4 text-white/70" />Markdown (.md)</button>
              </>
            )}
          </Acilir>
        </div>
        <button type="button" title="Kapat" aria-label="Kapat" onClick={() => { duzenKapat(); kapat(); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-white/[0.05] px-2.5 text-[12.5px]">
        {html ? (
          <LayoutGroup id="tuval-gorunum">
            <div className="flex shrink-0 rounded-full bg-white/[0.08] p-0.5">
              {([["kod", "Kod"], ["onizleme", "Önizleme"]] as const).map(([k, a]) => (
                <button key={k} type="button" onClick={() => setGorunum(k)} className={cn("relative h-7 rounded-full px-3 font-medium", gorunum === k ? "text-black" : "text-white/60 hover:text-white")}>
                  {gorunum === k && <motion.span layoutId="tuval-g" transition={{ duration: 0.28, ease: "easeOut" }} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{a}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        ) : <span className="text-white/45">{surum ? `${surum.kaynak === "sen" ? "Senin düzenlemen" : surum.not || "Vayra yazdı"} · ${new Date(surum.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}</span>}
        <span className="ml-auto" />
        {kayit && <span className="flex items-center gap-1 text-white/45">{kayit === "kaydedildi" ? <><Check className="h-3 w-3 text-[#8be6ff]" />Kaydedildi</> : <><Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor</>}</span>}
        {js && <button type="button" onClick={calistir} disabled={mesgul === "calistir"} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-white hover:bg-white/[0.12] disabled:opacity-50">{mesgul === "calistir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Çalıştır</button>}
        {!sonMu ? (
          <button type="button" onClick={() => islem({ islem: "geriYukle", no: surum?.no }, "geri")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 font-semibold text-black"><RotateCcw className="h-3.5 w-3.5" />Bu sürümü geri yükle</button>
        ) : duzen ? (
          <button type="button" onClick={duzenKapat} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 font-semibold text-black"><Check className="h-3.5 w-3.5" />Bitti</button>
        ) : (gorunum === "kod" || !html) && (
          <button type="button" onClick={duzenAc} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-white hover:bg-white/[0.12]"><Pencil className="h-3.5 w-3.5" />Düzenle</button>
        )}
      </div>
      <AnimatePresence>
        {hata && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex items-center gap-2 overflow-hidden bg-rose-500/[0.08] px-3.5 py-2 text-[12.5px] text-rose-200"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span className="flex-1">{hata}</span><button type="button" onClick={() => setHata("")} aria-label="Gizle"><X className="h-3.5 w-3.5" /></button></motion.p>}
      </AnimatePresence>
      <div ref={govde} className="relative min-h-0 flex-1 overflow-auto [scrollbar-width:thin]" onMouseUp={gorunumSecimi}>
        {yok ? <p className="p-6 text-[13.5px] text-white/55">{yok}</p> : !t ? <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : farkParcalari ? (
            <pre className={cn("whitespace-pre-wrap break-words p-5 text-[14px] leading-[1.75] text-white/80", kod && "sc-kod text-[12.5px]")}>
              {farkParcalari.map((p, k) => <span key={k} className={p.tur === "ekle" ? "rounded-[3px] bg-emerald-400/[0.16] text-emerald-200" : p.tur === "sil" ? "rounded-[3px] bg-rose-500/[0.14] text-rose-300/80 line-through" : undefined}>{p.t}</span>)}
            </pre>
          ) : fark ? <p className="p-6 text-[13.5px] text-white/55">Bu iki sürüm arasındaki fark gösterilemeyecek kadar büyük.</p>
          : duzen ? (
            <textarea ref={alan} value={taslak} onChange={(e) => yaz(e.target.value)} onSelect={alanSecimi} onMouseUp={alanSecimi} onKeyUp={alanSecimi} spellCheck={!kod}
              className={cn("block h-full w-full resize-none bg-transparent p-5 text-white outline-none", kod ? "sc-kod text-[12.5px] leading-[1.65]" : "text-[15px] leading-[1.75]")} />
          ) : html && gorunum === "onizleme" ? (
            <iframe srcDoc={icerik} title="Önizleme" sandbox="allow-scripts allow-forms allow-modals" className="h-full w-full border-0 bg-white" />
          ) : kod ? (
            <div className="flex min-h-full text-[12.5px] leading-[1.65]" data-tuval-icerik>
              <pre aria-hidden className="sc-kod select-none py-5 pl-3 pr-3 text-right text-white/25">{icerik.split("\n").map((_, k) => `${k + 1}\n`).join("")}</pre>
              <pre className="kod-renk sc-kod min-w-0 flex-1 overflow-x-auto py-5 pr-5 text-white/85"><code dangerouslySetInnerHTML={{ __html: vurgula(icerik, `x.${VURGU[dil] ?? "txt"}`) }} /></pre>
            </div>
          ) : (
            <div className="mx-auto max-w-[720px] px-6 py-6" data-tuval-icerik><Md metin={icerik} onizle={() => {}} /></div>
          )}
        {mesgul && mesgul !== "docx" && mesgul !== "calistir" && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-[#111214]/40 pt-16">
            <span className="flex items-center gap-2 rounded-full bg-[#111214] px-4 py-2 text-[13px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/30"><Loader2 className="h-3.5 w-3.5 animate-spin" />{mesgul === "oneri" || mesgul === "incele" ? "Öneriler hazırlanıyor" : "Vayra düzenliyor"}</span>
          </div>
        )}
      </div>
      <AnimatePresence>
        {konsol && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="shrink-0 overflow-hidden border-t border-white/[0.06]">
            <div className="flex items-center gap-2 px-3.5 pt-2 text-[12px] text-white/50"><Terminal className="h-3.5 w-3.5" />Konsol<button type="button" onClick={() => setKonsol(null)} aria-label="Konsolu kapat" className="ml-auto flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.07]"><X className="h-3 w-3" /></button></div>
            <pre className="sc-kod max-h-[180px] overflow-auto px-3.5 pb-3 pt-1 text-[12px] leading-relaxed [scrollbar-width:thin]">{konsol.map((k, x) => <div key={x} className={k.tur === "hata" ? "text-rose-300" : "text-white/80"}>{k.metin}</div>)}</pre>
          </motion.div>
        )}
        {oneriler && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden border-t border-white/[0.06]">
            <div className="flex items-center gap-2 px-3.5 pt-2.5 text-[12.5px] font-medium text-white/75"><Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />{oneriler.length ? `${oneriler.length} öneri` : "Öneri yok, metin iyi görünüyor."}<button type="button" onClick={() => setOneriler(null)} className="ml-auto rounded-full px-2 py-0.5 text-[12px] text-white/50 hover:bg-white/[0.06] hover:text-white">Kapat</button></div>
            <div className="max-h-[240px] space-y-2 overflow-auto p-3 [scrollbar-width:thin]">
              {oneriler.map((o, k) => (
                <div key={k} className="rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <p className="text-[13px] text-white/85">{o.oneri}</p>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] text-rose-300/80 line-through">{o.alinti}</p>
                  <p className="line-clamp-3 text-[12.5px] text-emerald-200">{o.yeni}</p>
                  <div className="mt-2 flex gap-1.5"><button type="button" disabled={!sonMu} onClick={() => oneriUygula(o)} className="h-7 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-40">Uygula</button><button type="button" onClick={() => setOneriler((l) => l?.filter((x) => x !== o) ?? null)} className="h-7 rounded-full px-3 text-[12px] text-white/60 hover:bg-white/[0.06]">Geç</button></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {t && sonMu && !fark && (
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          <form onSubmit={(e) => { e.preventDefault(); if (secim) secimiGonder(istek); else tumuneGonder(istek); }} className="cam-istemci rounded-[20px] p-2">
            {secim && (
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-1">
                <span className="flex h-7 max-w-full items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] pl-2.5 pr-1 text-[12px] text-[#8be6ff]">
                  <span className="max-w-[260px] truncate">Seçili: {secim.metin.slice(0, 60)}</span>
                  <button type="button" onClick={() => setSecim(null)} aria-label="Seçimi kaldır" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
                </span>
                {!kod && HIZLI.map((h) => <button key={h} type="button" disabled={!!mesgul || calisiyor} onClick={() => secimiGonder(h)} className="h-7 rounded-full bg-white/[0.07] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.12] hover:text-white disabled:opacity-40">{h}</button>)}
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <div ref={kisayol.kok}>
                <button type="button" onClick={() => kisayol.setAcik(!kisayol.acik)} title="Kısayollar" aria-label="Kısayollar" className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/80 hover:bg-white/[0.12] hover:text-white", kisayol.acik && "bg-white/[0.14] text-white")}><Wand2 className="h-4 w-4" /></button>
                <Acilir a={kisayol}>
                  {kod ? (
                    <>
                      {kisayolDugmesi("Kodu incele", "Hata ve iyileştirme önerileri", { islem: "oneri", kisayol: "incele" }, Sparkles)}
                      {kisayolDugmesi("Yorum ekle", "Açıklayıcı yorum satırları", { kisayol: "yorum" }, Pencil)}
                      {kisayolDugmesi("Günlük ekle", "Hata ayıklama için log satırları", { kisayol: "gunluk" }, Terminal)}
                      {kisayolDugmesi("Hataları düzelt", "Bulduğu hataları düzeltir", { kisayol: "hata" }, Wand2)}
                      {kisayolDugmesi("Sadeleştir", "Okunurluğu artırır", { kisayol: "sadelestir" }, Sparkles)}
                      <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[12px] font-medium text-white/50"><Languages className="h-3.5 w-3.5" />Başka dile çevir</p>
                      <div className="flex flex-wrap gap-1 px-2 pb-1.5">{DILLER.filter((x) => x.toLowerCase() !== dil).map((d) => <button key={d} type="button" onClick={() => islem({ islem: "tum", kisayol: "cevir", param: d }, "cevir")} className="h-7 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.12] hover:text-white">{d}</button>)}</div>
                    </>
                  ) : (
                    <>
                      {kisayolDugmesi("Düzeltme öner", "Satır satır öneriler, tek tek uygula", { islem: "oneri" }, Sparkles)}
                      {kisayolDugmesi("Son rötuş", "Yazım, akış ve tutarlılık", { kisayol: "rotus" }, Wand2)}
                      {kisayolDugmesi("Bölümlere ayır", "Başlık ve listelerle düzenle", { kisayol: "baslik" }, FileText)}
                      <div className="space-y-2 p-1.5">
                        {kaydirici("Uzunluk", UZUNLUK, uzunluk, setUzunluk, () => islem({ islem: "tum", kisayol: "uzunluk", param: uzunluk + 1 }, "uzunluk"))}
                        {kaydirici("Okuma düzeyi", OKUMA, okuma, setOkuma, () => islem({ islem: "tum", kisayol: "okuma", param: okuma + 1 }, "okuma"))}
                      </div>
                      <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-white/50">Ton</p>
                      <div className="flex flex-wrap gap-1 px-2 pb-1.5">{TONLAR.map((x) => <button key={x.id} type="button" onClick={() => islem({ islem: "tum", kisayol: "ton", param: x.id }, "ton")} className="h-7 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.12] hover:text-white">{x.ad}</button>)}</div>
                    </>
                  )}
                </Acilir>
              </div>
              <input value={istek} onChange={(e) => setIstek(e.target.value)} disabled={!!mesgul} placeholder={secim ? "Seçili kısım nasıl değişsin?" : kod ? "Koda ne yapılsın? (bütün dosya)" : "Belgede ne değişsin? Bir parça seçersen yalnız o değişir"}
                className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-white/45" />
              <button type="submit" disabled={!istek.trim() || !!mesgul || calisiyor} aria-label="Gönder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30">{mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}</button>
            </div>
          </form>
        </div>
      )}
    </motion.aside>
  );
}
