"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { ArrowRight, ArrowUp, Check, Clock, Code2, Copy, MousePointer2, Play, ShieldCheck, Sparkles, Terminal, Users } from "lucide-react";
import { MCP_ARACLAR } from "@/lib/mcp/araclar";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
const G = "/gercek";
const MONO = "font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]";
/** p'nin [a,b] aralığındaki 0→1 ilerlemesi. */
const d = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/* ─────────────── Pencere kabuğu (macOS) ─────────────── */
function Pencere({ ust, children }: { ust: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-[#131416] ring-1 ring-white/[0.1]">
      <div className="relative flex h-11 shrink-0 items-center border-b border-white/[0.06] bg-white/[0.02] px-4">
        <span className="flex gap-2">{["#ff5f57", "#febc2e", "#28c840"].map((r) => <span key={r} className="h-3 w-3 rounded-full opacity-80" style={{ background: r }} />)}</span>
        <div className="absolute inset-x-0 flex justify-center">{ust}</div>
        <span className="ml-auto hidden rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/45 sm:inline">Örnek görünüm</span>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/* ─────────────── 1 · MCP: Claude sohbetinde Vayra ─────────────── */
const ISTEM = "Bu parfüm fotoğrafından Instagram için 3 reklam görseli üret";
const GORSELLER = ["gal-gpt-0", "gal-gpt-6", "gal-pazarlama-3"].map((g) => `${G}/panel/${g}.webp`);
function SahneMCP({ p }: { p: number }) {
  const yazi = ISTEM.slice(0, Math.round(ISTEM.length * d(p, 0.02, 0.22)));
  const gonderildi = p > 0.26;
  const arac = p > 0.34;
  const ilerleme = d(p, 0.4, 0.66);
  const bitti = p > 0.66;
  return (
    <Pencere ust={<span className="flex items-center gap-2 text-[12.5px] font-medium text-white/70"><img src="/marka/renkli/claude-color.svg" alt="" className="h-4 w-4" />Claude<span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Vayra bağlı</span></span>}>
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden px-4 pb-3 pt-4 sm:px-8">
          <AnimatePresence>
            {gonderildi && (
              <motion.div key="kul" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease }}
                className="flex items-end justify-end gap-2">
                <img src={GORSELLER[0]} alt="" className="h-14 w-11 rounded-[10px] object-cover ring-1 ring-white/15" />
                <p className="max-w-[78%] rounded-[18px] rounded-br-[6px] bg-white/[0.09] px-4 py-2.5 text-[14px] leading-snug text-white">{ISTEM}</p>
              </motion.div>
            )}
            {arac && (
              <motion.div key="asi" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="flex gap-3">
                <img src="/marka/renkli/claude-color.svg" alt="" className="mt-0.5 h-6 w-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug text-white/85">Vayra ile ürün fotoğrafından 3 reklam görseli üretiyorum.</p>
                  <div className="mt-2.5 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-white/[0.08]">
                    <div className="flex items-center gap-2 text-[12.5px]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#55d6fd]/15"><Sparkles className="h-3.5 w-3.5 text-[#55d6fd]" /></span>
                      <span className={cn(MONO, "text-white/85")}>vayra · generate</span>
                      <span className={cn("ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", bitti ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.06] text-white/60")}>
                        {bitti ? <><Check className="h-3 w-3" />Tamamlandı</> : <>Üretiliyor · %{Math.round(ilerleme * 100)}</>}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11.5px] text-white/70">
                      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5"><ModelLogo ad="Nano Banana Pro" boyut={12} />Nano Banana Pro</span>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5">4:5</span><span className="rounded-full bg-white/[0.06] px-2 py-0.5">3 görsel</span>
                    </div>
                    {!bitti && <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-[#55d6fd]" style={{ width: `${ilerleme * 100}%` }} /></div>}
                  </div>
                  <div className="mt-2.5 grid max-w-[340px] grid-cols-3 gap-2">
                    {GORSELLER.map((g, i) => {
                      const v = d(p, 0.62 + i * 0.06, 0.74 + i * 0.06);
                      return (
                        <div key={g} className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-white/[0.05]">
                          <img src={g} alt="" className="h-full w-full object-cover" style={{ opacity: v, filter: `blur(${(1 - v) * 14}px)`, transform: `scale(${1.08 - v * 0.08})` }} />
                        </div>
                      );
                    })}
                  </div>
                  {p > 0.86 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-1.5 text-[12px] text-white/50"><KrediJeton boyut={11} />12 kredi · Kitaplığına kaydedildi</motion.p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-[16px] bg-white/[0.05] p-2 pl-4 ring-1 ring-white/[0.08] sm:mx-6">
          <p className="min-w-0 flex-1 truncate text-[14px] text-white/85">{gonderildi ? <span className="text-white/35">Claude&apos;a yaz…</span> : <>{yazi}<span className="ml-px inline-block h-4 w-px translate-y-[3px] bg-white" /></>}</p>
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors", yazi.length > 10 && !gonderildi ? "bg-[#d97757] text-white" : "bg-white/[0.08] text-white/40")}><ArrowUp className="h-4 w-4" /></span>
        </div>
      </div>
    </Pencere>
  );
}

/* ─────────────── 2 · API: kod editörü + canlı yanıt ─────────────── */
type Jeton = [string, string];
const S = "text-[#9ff0ff]", A = "text-white/45", B = "text-[#fcd34d]", W = "text-white/90", Y = "text-[#c4b5fd]";
const KOD: Jeton[] = [
  ["curl ", W], ["https://vayra.ai/api/v1/generations", S], [" \\\n", A],
  ["  -H ", B], ['"Authorization: Bearer $VAYRA_API_KEY"', S], [" \\\n", A],
  ["  -d ", B], ["'{\n", A],
  ['    "model"', Y], [": ", A], ['"seedance-2"', S], [",\n", A],
  ['    "input"', Y], [": {\n", A],
  ['      "prompt"', Y], [": ", A], ['"Karlı zirvede gün doğumu, drone etrafında dönüyor"', S], [",\n", A],
  ['      "duration"', Y], [": ", A], ["5", B], [", ", A], ['"aspect_ratio"', Y], [": ", A], ['"16:9"', S], ["\n", A],
  ["    }\n  }'", A],
];
const KOD_UZUNLUK = KOD.reduce((n, [m]) => n + m.length, 0);
function Kod({ p }: { p: number }) {
  let kalan = Math.round(KOD_UZUNLUK * p);
  return (
    <pre className={cn(MONO, "whitespace-pre-wrap break-words text-[12px] leading-[1.7] sm:text-[13px]")}>
      {KOD.map(([m, c], i) => { if (kalan <= 0) return null; const parca = m.slice(0, kalan); kalan -= m.length; return <span key={i} className={c}>{parca}</span>; })}
      {p < 1 && <span className="ml-px inline-block h-4 w-[7px] translate-y-[3px] bg-[#55d6fd]/80" />}
    </pre>
  );
}
function SahneAPI({ p }: { p: number }) {
  const kod = d(p, 0.02, 0.38);
  const durum = p < 0.42 ? null : p < 0.5 ? "queued" : p < 0.78 ? "running" : "succeeded";
  const yuzde = Math.round(d(p, 0.5, 0.78) * 100);
  return (
    <Pencere ust={<span className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/70"><Code2 className="h-3.5 w-3.5" />uret.sh · Vayra API</span>}>
      <div className="grid h-full grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col border-b border-white/[0.06] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-1 px-3 pt-2.5">
            {["cURL", "Python", "Node"].map((t, i) => <span key={t} className={cn("rounded-[8px] px-2.5 py-1 text-[12px] font-medium", i === 0 ? "bg-white/[0.08] text-white" : "text-white/40")}>{t}</span>)}
            <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] text-white/40"><Copy className="h-3.5 w-3.5" /></span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3"><Kod p={kod} /></div>
        </div>
        <div className="flex min-h-0 flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-white/50">Yanıt</span>
            {durum && (
              <motion.span key={durum} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", MONO,
                  durum === "succeeded" ? "bg-emerald-400/10 text-emerald-300" : durum === "running" ? "bg-[#55d6fd]/10 text-[#9ff0ff]" : "bg-white/[0.06] text-white/60")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", durum === "succeeded" ? "bg-emerald-400" : durum === "running" ? "animate-pulse bg-[#55d6fd]" : "bg-white/50")} />{durum}
              </motion.span>
            )}
            {durum && <span className={cn(MONO, "ml-auto text-[11.5px] text-white/35")}>gen_8f2c…</span>}
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-black ring-1 ring-white/[0.08]">
            {durum === "succeeded" ? (
              <motion.video initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease }}
                src={`${G}/video-hareket/drone-orbit.mp4`} poster={`${G}/video-hareket/drone-orbit-poster.webp`} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <img src={`${G}/video-hareket/drone-orbit-poster.webp`} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
                {durum === "running" ? (
                  <>
                    <p className="relative text-[13px] text-white/70">Seedance 2.0 üretiyor</p>
                    <div className="relative h-1 w-1/2 overflow-hidden rounded-full bg-white/[0.12]"><div className="h-full rounded-full bg-[#55d6fd]" style={{ width: `${yuzde}%` }} /></div>
                    <p className={cn(MONO, "relative text-[12px] text-white/50")}>%{yuzde}</p>
                  </>
                ) : <p className="relative text-[13px] text-white/40">{durum ? "Sıraya alındı…" : "İstek bekleniyor"}</p>}
              </div>
            )}
            {durum === "succeeded" && <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur-md"><Play className="h-2.5 w-2.5 fill-white" />5 sn · 16:9</span>}
          </div>
          <div className={cn(MONO, "flex items-center justify-between text-[11.5px] text-white/45")}>
            <span>credits: <span className="text-[#fcd34d]">{durum === "succeeded" ? 42 : "…"}</span></span>
            <span>run_ms: <span className="text-white/70">{durum === "succeeded" ? "38.214" : "…"}</span></span>
          </div>
        </div>
      </div>
    </Pencere>
  );
}

/* ─────────────── 3 · Ekip: çalışma alanı, onay ve kredi havuzu ─────────────── */
const UYELER = [{ h: "T", r: "Tasarım", c: "#55d6fd" }, { h: "P", r: "Pazarlama", c: "#a78bfa" }, { h: "V", r: "Video", c: "#fbbf24" }, { h: "Y", r: "Yönetici", c: "#34d399" }];
const ONAY = [
  { g: `${G}/panel/gal-pazarlama-0.webp`, ad: "Yaz kampanyası · ayakkabı", kim: "Pazarlama", kredi: 168, an: 0.36 },
  { g: `${G}/panel/gal-gpt-1.webp`, ad: "Kafe sosyal medya serisi", kim: "Tasarım", kredi: 32, an: 0.66 },
  { g: `${G}/panel/gal-pazarlama-3.webp`, ad: "Akıllı saat lansman videosu", kim: "Video", kredi: 210, an: 9 },
];
function SahneEkip({ p }: { p: number }) {
  const harcanan = ONAY.filter((x) => p > x.an).reduce((n, x) => n + x.kredi, 0);
  const havuz = 12000 - 1450 - harcanan;
  const oran = havuz / 12000;
  // İmleç: önce 1. satırın Onayla düğmesine, sonra 2. satıra gider.
  const hedef = p < 0.4 ? { x: 88, y: 41, t: d(p, 0.12, 0.32) } : { x: 88, y: 63, t: d(p, 0.44, 0.62) };
  const bas = { x: p < 0.4 ? 60 : 88, y: p < 0.4 ? 92 : 41 };
  const ix = bas.x + (hedef.x - bas.x) * hedef.t, iy = bas.y + (hedef.y - bas.y) * hedef.t;
  const tik = (p > 0.32 && p < 0.37) || (p > 0.62 && p < 0.67);
  return (
    <Pencere ust={<span className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/70"><Users className="h-3.5 w-3.5" />Vayra · Stüdyo ekibi</span>}>
      <div className="grid h-full lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-4 border-r border-white/[0.06] p-4 lg:flex">
          <div>
            <p className="text-[12px] text-white/45">Ortak kredi havuzu</p>
            <div className="mt-2 flex items-center gap-3">
              <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" /><circle cx="20" cy="20" r="16" fill="none" stroke="#55d6fd" strokeWidth="4" strokeLinecap="round" strokeDasharray={100.5} strokeDashoffset={100.5 * (1 - oran)} style={{ transition: "stroke-dashoffset .5s" }} /></svg>
              <div><p className="text-[18px] font-semibold tabular-nums text-white">{havuz.toLocaleString("tr-TR")}</p><p className="text-[11.5px] text-white/45">12.000 krediden</p></div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] text-white/45">Ekipler</p>
            {UYELER.map((u) => (
              <p key={u.r} className="flex items-center gap-2.5 py-1.5 text-[13px] text-white/80">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-black" style={{ background: u.c }}>{u.h}</span>{u.r}
              </p>
            ))}
          </div>
          <p className="mt-auto flex items-center gap-1.5 rounded-[10px] bg-white/[0.04] px-2.5 py-2 text-[11.5px] text-white/55"><ShieldCheck className="h-3.5 w-3.5 text-[#55d6fd]" />SSO etkin · Harcama sınırı açık</p>
        </aside>
        <div className="relative flex min-h-0 flex-col gap-2.5 p-4">
          <div className="flex items-center justify-between"><p className="text-[14px] font-semibold text-white">Onay kuyruğu</p><span className="text-[12px] text-white/45">{ONAY.filter((x) => p <= x.an).length} bekliyor</span></div>
          {ONAY.map((x) => {
            const ok = p > x.an;
            return (
              <div key={x.ad} className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] p-2 pr-2.5 ring-1 ring-white/[0.06]">
                <img src={x.g} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium text-white">{x.ad}</p><p className="flex items-center gap-1 text-[12px] text-white/45">{x.kim} ekibi · <KrediJeton boyut={10} />{x.kredi}</p></div>
                <AnimatePresence mode="wait" initial={false}>
                  {ok ? (
                    <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-emerald-400/12 px-3 text-[12px] font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" />Onaylandı</motion.span>
                  ) : (
                    <motion.span key="bekle" exit={{ opacity: 0, scale: 0.9 }} className="flex shrink-0 items-center gap-1.5">
                      <span className="hidden items-center gap-1 text-[11.5px] text-amber-300 sm:flex"><Clock className="h-3 w-3" />Bekliyor</span>
                      <span className="flex h-8 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-black">Onayla</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <div className="mt-auto rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/55 ring-1 ring-white/[0.05]">
            <span className="font-medium text-white/80">Bu hafta</span> · 46 üretim · en çok Seedance 2.0 ve Nano Banana Pro
          </div>
          {p < 0.72 && (
            <motion.div className="pointer-events-none absolute z-10" style={{ left: `${ix}%`, top: `${iy}%` }} animate={{ scale: tik ? 0.85 : 1 }}>
              <MousePointer2 className="h-5 w-5 -translate-x-1 -translate-y-1 fill-white text-black" />
            </motion.div>
          )}
        </div>
      </div>
    </Pencere>
  );
}

/* ─────────────── Bölüm ─────────────── */
const ADIMLAR = [
  { id: "mcp", ikon: Terminal, ad: "Claude'un içinde", ust: "MCP sunucusu", metin: `Claude, Cursor ve VS Code'a ekle; ${MCP_ARACLAR.length} araçla sohbetten çıkmadan üret.`, href: "/panel/mcp", eylem: "MCP'yi kur", Sahne: SahneMCP },
  { id: "api", ikon: Code2, ad: "Kodunun içinde", ust: "REST API", metin: "Tüm modeller tek uç noktada, aynı kredi ve aynı biçimle. Webhook ve test anahtarı hazır.", href: "/panel/api", eylem: "API'ye başla", Sahne: SahneAPI },
  { id: "ekip", ikon: Users, ad: "Ekibinin içinde", ust: "Ekipler ve kurumsal", metin: "Ortak kredi havuzu, roller, onay akışı ve SSO. Kim ne üretti, tek ekranda.", href: "/kurumsal", eylem: "Kurumsal'ı incele", Sahne: SahneEkip },
] as const;

/**
 * Ekipler ve geliştiriciler — tek büyük pencere; kaydırma sahneyi ilerletir
 * (yazı yazılır, üretim ilerler, onay verilir). Kaydırma durunca sahne de durur.
 */
export function Gelistirici() {
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.6, restDelta: 0.0005 });
  const [v, setV] = useState(0);
  useMotionValueEvent(p, "change", setV);
  const i = Math.min(2, Math.floor(v * 3));
  const ic = Math.min(1, v * 3 - i);
  const a = ADIMLAR[i];
  const git = (j: number) => {
    const el = kok.current; if (!el) return;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * ((j + 0.02) / 3), behavior: "smooth" });
  };

  return (
    <section ref={kok} className="relative h-[460vh]">
      <div className="sticky top-[var(--ust-nav)] flex h-[calc(100svh-var(--ust-nav))] flex-col justify-center overflow-hidden px-4 pb-28 pt-4 sm:px-8 sm:pb-24">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-[28px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[48px]">Vayra, <span className="hero-isilti">nerede çalışıyorsan</span> orada.</h2>
            <p className="max-w-[340px] text-[14.5px] leading-relaxed text-white/55 sm:text-right">Ekipler ve geliştiriciler için MCP, API ve ortak çalışma alanı.</p>
          </div>

          <div className="mt-5 h-[min(52vh,470px)] sm:mt-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={a.id} className="h-full" initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, scale: 0.985, filter: "blur(6px)" }} transition={{ duration: 0.45, ease }}>
                <a.Sahne p={ic} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Adımlar: kaydırmayla dolar, tıklayınca o sahneye gider */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-6">
            {ADIMLAR.map((x, j) => {
              const s = j === i;
              const dolu = j < i ? 1 : s ? ic : 0;
              return (
                <div key={x.id} role="button" tabIndex={0} onClick={() => git(j)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); git(j); } }} className="group cursor-pointer text-left">
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/[0.1]"><span className="block h-full rounded-full bg-[#55d6fd]" style={{ width: `${dolu * 100}%` }} /></span>
                  <span className={cn("mt-3 flex items-center gap-2 text-[13.5px] font-semibold transition-colors sm:text-[15px]", s ? "text-white" : "text-white/40 group-hover:text-white/70")}>
                    <x.ikon className={cn("hidden h-4 w-4 sm:block", s && "text-[#55d6fd]")} />{x.ad}
                  </span>
                  <span className={cn("mt-1 hidden text-[13.5px] leading-snug transition-colors sm:block", s ? "text-white/60" : "text-white/30")}>{x.metin}</span>
                  <span className={cn("mt-2 hidden items-center gap-1 text-[13.5px] font-medium text-[#55d6fd] transition-opacity sm:inline-flex", s ? "opacity-100" : "opacity-0")}>
                    <Link href={x.href} tabIndex={s ? 0 : -1} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1">{x.eylem}<ArrowRight className="h-3.5 w-3.5" /></Link>
                  </span>
                </div>
              );
            })}
          </div>
          <Link href={a.href} className="mt-2 inline-flex items-center gap-1 text-[14px] font-medium text-[#55d6fd] sm:hidden">{a.ust} · {a.eylem}<ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </section>
  );
}
