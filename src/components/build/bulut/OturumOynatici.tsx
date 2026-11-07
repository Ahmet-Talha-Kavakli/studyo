"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, AlertTriangle, ArrowDownToLine, CircleSlash, Flame, Globe, Loader2, Monitor, MousePointerClick, Pause, Play,
  RotateCcw, Send, Smartphone, Sparkles, Tablet, TextCursorInput, Trash2, X,
} from "lucide-react";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { anYazi, CIHAZ_AD, isaretleriCikar, sureYazi, type HamOlay, type Isaret, type IsaretTur, type OturumAi, type OturumCihaz, type OturumOzet } from "@/lib/build/oturumTipler";
import { cn } from "@/lib/utils";

const yay = { type: "spring" as const, stiffness: 420, damping: 40 };
export const CIHAZ_SIMGE: Record<OturumCihaz, typeof Monitor> = { masaustu: Monitor, tablet: Tablet, telefon: Smartphone };

/** İşaret türlerinin görünümü: zaman çubuğu noktası, liste simgesi, ad. */
export const ISARET: Record<IsaretTur, { ad: string; I: typeof Monitor; renk: string; yazi: string }> = {
  sayfa: { ad: "Sayfa", I: Globe, renk: "#ffffff", yazi: "text-white" },
  tik: { ad: "Tık", I: MousePointerClick, renk: "rgba(255,255,255,0.45)", yazi: "text-white/70" },
  ofkeli: { ad: "Öfkeli tık", I: Flame, renk: "#f2b84b", yazi: "text-amber-200" },
  olu: { ad: "Sonuçsuz tık", I: CircleSlash, renk: "#b9a4ff", yazi: "text-violet-200" },
  hata: { ad: "Hata", I: AlertTriangle, renk: "#f0627a", yazi: "text-rose-200" },
  uyari: { ad: "Uyarı", I: AlertCircle, renk: "#d9a03a", yazi: "text-amber-200/80" },
  alan: { ad: "Form alanı", I: TextCursorInput, renk: "rgba(255,255,255,0.45)", yazi: "text-white/70" },
  kaydirma: { ad: "Kaydırma", I: ArrowDownToLine, renk: "rgba(255,255,255,0.3)", yazi: "text-white/55" },
};
const CUBUK_TURLERI: IsaretTur[] = ["sayfa", "tik", "ofkeli", "olu", "hata"];
const HIZLAR = ["1", "2", "4", "8"] as const;

type Rep = {
  play: (t?: number) => void; pause: (t?: number) => void; setConfig: (c: Record<string, unknown>) => void; getCurrentTime: () => number;
  getMetaData: () => { startTime: number; endTime: number; totalTime: number }; on: (e: string, f: (d: unknown) => void) => void; destroy?: () => void;
};

/** Oynatıcı imleci ve tık halkası (rrweb replayer sınıfları); koyu gölge yok, tık camgöbeği halka. */
const IMLEC = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24'><path d='M5 2.5l14 10.6-6.2 1.1 3.6 7-2.7 1.3-3.5-7L5.3 20z' fill='white' stroke='black' stroke-width='1.5' stroke-linejoin='round'/></svg>")}")`;
const STIL = `.oy-sahne .replayer-wrapper{position:relative}
.oy-sahne .replayer-wrapper iframe{border:0;display:block;background:#fff}
.oy-sahne .replayer-mouse{position:absolute;width:22px;height:22px;transition:left .05s linear,top .05s linear;background:${IMLEC} no-repeat 0 0/contain;z-index:2}
.oy-sahne .replayer-mouse::after{content:"";position:absolute;left:0;top:0;width:10px;height:10px;border-radius:50%;border:2px solid #55d6fd;transform:translate(-50%,-50%);opacity:0}
.oy-sahne .replayer-mouse.active::after{animation:oy-tik .45s ease-out 1}
.oy-sahne .replayer-mouse.touch-device{background:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:3px solid rgba(85,214,253,0);transition:left 0s linear,top 0s linear,border-color .2s}
.oy-sahne .replayer-mouse.touch-device.touch-active{border-color:rgba(85,214,253,.9);transition:left .25s linear,top .25s linear,border-color .2s}
.oy-sahne .replayer-mouse.touch-device::after{display:none}
.oy-sahne .replayer-mouse-tail{position:absolute;pointer-events:none;z-index:1}
@keyframes oy-tik{0%{opacity:.95;width:6px;height:6px}100%{opacity:0;width:46px;height:46px}}`;

/**
 * Kayıttaki dış stil dosyalarını (link rel=stylesheet) bir kez indirip olaylara gömer (_cssText; rrweb bunu <style> olarak
 * kurar). Böylece her ileri-geri atlamada CSS yeniden indirilmez, sayfa biçimsiz görünmez. İndirilemeyen bağlantı olduğu
 * gibi kalır. url(...) adresleri stil dosyasının adresine göre mutlaklaştırılır.
 */
type SnDugum = { type?: number; tagName?: string; attributes?: Record<string, unknown>; childNodes?: SnDugum[] };
async function stilleriGom(olaylar: HamOlay[]) {
  const linkler: Record<string, unknown>[] = [];
  const gez = (n?: SnDugum) => {
    if (!n) return;
    if (n.type === 2 && n.tagName === "link" && n.attributes?.rel === "stylesheet" && typeof n.attributes.href === "string" && n.attributes._cssText === undefined) linkler.push(n.attributes);
    n.childNodes?.forEach(gez);
  };
  for (const e of olaylar) {
    const d = e.data as { node?: SnDugum; source?: number; adds?: { node?: SnDugum }[] } | undefined;
    if (e.type === 2) gez(d?.node);
    else if (e.type === 3 && d?.source === 0) d.adds?.forEach((a) => gez(a.node));
  }
  const hrefler = [...new Set(linkler.map((a) => String(a.href)))].filter((h) => /^https?:/i.test(h)).slice(0, 24);
  const metin = new Map<string, string>();
  const mutlak = (css: string, taban: string) => css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q: string, u: string) => {
    if (/^(data:|https?:|\/\/|#|blob:)/i.test(u.trim())) return m;
    try { return `url(${q}${new URL(u.trim(), taban).href}${q})`; } catch { return m; }
  });
  await Promise.all(hrefler.map(async (h) => {
    try {
      const r = await fetch(h, { signal: AbortSignal.timeout(6000), credentials: "omit" });
      if (r.ok && (r.headers.get("content-type") ?? "").includes("css")) metin.set(h, mutlak(await r.text(), h));
    } catch { /* bağlantı olduğu gibi kalır */ }
  }));
  for (const a of linkler) { const t = metin.get(String(a.href)); if (t) a._cssText = t; }
}

/** Etkileşim olmayan aralıklar (5 sn üstü): zaman çubuğunda silik taranır, "hareketsiz anları atla" bunları hızlı geçer. */
function bosluklar(olaylar: HamOlay[], bas: number, toplam: number) {
  const z: number[] = [];
  for (const e of olaylar) {
    const d = e.data as { source?: number } | undefined;
    if (e.type === 2 || e.type === 4 || (e.type === 3 && d && [1, 2, 3, 5, 6].includes(d.source ?? -1))) z.push(e.timestamp - bas);
  }
  const l: { a: number; b: number }[] = [];
  for (let i = 1; i < z.length; i++) if (z[i] - z[i - 1] > 5000) l.push({ a: z[i - 1], b: z[i] });
  if (z.length && toplam - z[z.length - 1] > 5000) l.push({ a: z[z.length - 1], b: toplam });
  return l;
}

/** Zaman çubuğu: oynatılan kısım camgöbeği, hareketsiz aralıklar silik, üstte işaretler (tıkla, o ana atla). */
function ZamanCubugu({ toplam, an, isaretler, bos, git }: { toplam: number; an: number; isaretler: Isaret[]; bos: { a: number; b: number }[]; git: (t: number) => void }) {
  const ray = useRef<HTMLDivElement>(null);
  const surukle = useRef(false);
  const [ust, setUst] = useState<{ x: number; t: number; i?: Isaret } | null>(null);
  const konum = (x: number) => { const r = ray.current!.getBoundingClientRect(); return Math.min(1, Math.max(0, (x - r.left) / r.width)) * toplam; };
  const yuzde = (t: number) => `${toplam ? Math.min(100, (t / toplam) * 100) : 0}%`;
  const gosterilen = isaretler.filter((x) => CUBUK_TURLERI.includes(x.tur));
  return (
    <div className="relative select-none pt-5" onMouseLeave={() => setUst(null)}>
      {/* İşaretler */}
      <div className="absolute inset-x-0 top-0 h-5">
        {gosterilen.map((x, i) => {
          const g = ISARET[x.tur], buyuk = x.tur !== "tik";
          return (
            <button key={i} type="button" aria-label={`${g.ad}: ${x.baslik}, ${anYazi(x.z)}`} onClick={() => git(Math.max(0, x.z - 800))} onMouseEnter={() => setUst({ x: (x.z / Math.max(1, toplam)) * 100, t: x.z, i: x })}
              className={cn("absolute bottom-0.5 -translate-x-1/2 rounded-full transition-transform hover:scale-150", x.tur === "sayfa" ? "h-3.5 w-[3px] rounded-[2px]" : buyuk ? "h-2.5 w-2.5" : "h-1.5 w-1.5")}
              style={{ left: yuzde(x.z), background: x.tur === "olu" ? undefined : g.renk, ...(x.tur === "olu" ? { boxShadow: `inset 0 0 0 2px ${g.renk}` } : {}), zIndex: buyuk ? 2 : 1 }} />
          );
        })}
      </div>
      {/* Ray */}
      <div ref={ray} className="relative h-6 cursor-pointer touch-none" role="slider" aria-label="Zaman çubuğu" aria-valuemin={0} aria-valuemax={Math.round(toplam / 1000)} aria-valuenow={Math.round(an / 1000)} tabIndex={0}
        onPointerDown={(e) => { surukle.current = true; e.currentTarget.setPointerCapture(e.pointerId); git(konum(e.clientX)); }}
        onPointerMove={(e) => { const t = konum(e.clientX); if (surukle.current) git(t); else setUst({ x: (t / Math.max(1, toplam)) * 100, t }); }}
        onPointerUp={() => { surukle.current = false; }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") git(Math.min(toplam, an + 5000)); if (e.key === "ArrowLeft") git(Math.max(0, an - 5000)); }}>
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.12]">
          {bos.map((b, i) => <span key={i} className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_3px,transparent_3px_6px)]" style={{ left: yuzde(b.a), width: `${toplam ? ((b.b - b.a) / toplam) * 100 : 0}%` }} />)}
          <span className="absolute inset-y-0 left-0 rounded-full bg-[#55d6fd]" style={{ width: yuzde(an) }} />
        </div>
        <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: yuzde(an) }} />
      </div>
      {ust && (
        <div className="pointer-events-none absolute -top-9 z-10 rounded-[10px] bg-[#1b1c1f] px-2.5 py-1.5 text-[12px] ring-1 ring-inset ring-white/[0.1]" style={{ left: `${ust.x}%`, transform: `translateX(${ust.x > 75 ? "-100%" : ust.x < 25 ? "0" : "-50%"})` }}>
          <p className="whitespace-nowrap text-white"><span className="tabular-nums text-white/55">{anYazi(ust.t)}</span>{ust.i && <span className="ml-1.5">{ISARET[ust.i.tur].ad}: {ust.i.baslik.length > 48 ? ust.i.baslik.slice(0, 47) + "…" : ust.i.baslik}</span>}</p>
        </div>
      )}
    </div>
  );
}

type Sekme = "olaylar" | "konsol" | "ozet";

/** Oturum oynatıcısı: sağdan açılan geniş panel (telefonda tam ekran). rrweb Replayer kum havuzlu iframe içinde çizer. */
export function OturumOynatici({ projeId, izleyici, ozet, kapat, silindi, ajana, aiGeldi }: {
  projeId: string; izleyici?: boolean; ozet: OturumOzet | null; kapat: () => void; silindi: (id: string) => void; ajana: (metin: string) => void; aiGeldi: (id: string, ai: OturumAi) => void;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);
  useEffect(() => { if (!ozet) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [ozet, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {ozet && (
        <>
          <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="perde fixed inset-0 z-[120]" />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} className="bd-panel fixed inset-y-0 right-0 z-[121] flex w-full flex-col overflow-hidden sm:rounded-l-[20px] lg:w-[min(1320px,calc(100vw-56px))]">
            <Govde key={ozet.id} projeId={projeId} izleyici={!!izleyici} ozet={ozet} kapat={kapat} silindi={silindi} ajana={ajana} aiGeldi={aiGeldi} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Govde({ projeId, izleyici, ozet, kapat, silindi, ajana, aiGeldi }: { projeId: string; izleyici: boolean; ozet: OturumOzet; kapat: () => void; silindi: (id: string) => void; ajana: (metin: string) => void; aiGeldi: (id: string, ai: OturumAi) => void }) {
  const [olaylar, setOlaylar] = useState<HamOlay[] | null>(null);
  const [hata, setHata] = useState("");
  const [oynuyor, setOynuyor] = useState(false);
  const [an, setAn] = useState(0);
  const [hiz, setHiz] = useState<(typeof HIZLAR)[number]>("1");
  const [atla, setAtla] = useState(true);
  const [atlaniyor, setAtlaniyor] = useState(false);
  const [boyut, setBoyut] = useState({ w: ozet.en || 1280, h: ozet.boy || 800 });
  const [alan, setAlan] = useState({ w: 0, h: 0 });
  const [sekme, setSekme] = useState<Sekme>("olaylar");
  const [ai, setAi] = useState<OturumAi | null>(ozet.ai ?? null);
  const [aiDurum, setAiDurum] = useState<{ yuk: boolean; hata?: string }>({ yuk: false });
  const [siliniyor, setSiliniyor] = useState(false);
  const [gitti, setGitti] = useState(false);
  const [kuruldu, setKuruldu] = useState(false);
  const sahne = useRef<HTMLDivElement>(null);
  const kap = useRef<HTMLDivElement>(null);
  const rep = useRef<Rep | null>(null);
  const liste = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ olaylar: HamOlay[] }>(`/api/build/oturum/${projeId}/${ozet.id}`).then((v) => setOlaylar(v.olaylar)).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Oturum yüklenemedi."));
  }, [projeId, ozet.id]);

  const { bas, son, isaretler } = useMemo(() => isaretleriCikar(olaylar ?? []), [olaylar]);
  const toplam = Math.max(0, son - bas);
  const bos = useMemo(() => bosluklar(olaylar ?? [], bas, toplam), [olaylar, bas, toplam]);
  const goruntuVar = !!olaylar?.some((e) => e.type === 2);
  const hatalar = isaretler.filter((x) => x.tur === "hata" || x.tur === "uyari");
  const sayfa = [...isaretler].reverse().find((x) => x.tur === "sayfa" && x.z <= an)?.baslik ?? ozet.sayfalar[0]?.yol ?? "";
  const etkinIndis = (() => { let s = -1; isaretler.forEach((x, i) => { if (x.z <= an + 30) s = i; }); return s; })();
  const etkin = etkinIndis >= 0 ? isaretler[etkinIndis] : null;
  const anlik = etkin && (etkin.tur === "ofkeli" || etkin.tur === "olu" || etkin.tur === "hata") && an - etkin.z < 1800 ? etkin : null;

  /* Sahne ölçüsü */
  useEffect(() => {
    const el = sahne.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAlan({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [olaylar]);

  /* Oynatıcıyı kur */
  useEffect(() => {
    if (!olaylar || !goruntuVar || !kap.current) return;
    let iptal = false;
    const ilk = olaylar.find((e) => e.type === 4)?.data as { width?: number; height?: number } | undefined;
    if (ilk?.width) setBoyut({ w: ilk.width, h: ilk.height || 800 });
    Promise.all([import("rrweb"), stilleriGom(olaylar)]).then(([{ Replayer }]) => {
      if (iptal || !kap.current) return;
      kap.current.innerHTML = "";
      const r = new Replayer(olaylar as never, {
        root: kap.current, skipInactive: true, speed: 1, showWarning: false, triggerFocus: false, UNSAFE_replayCanvas: false,
        mouseTail: { duration: 700, lineCap: "round", lineWidth: 2, strokeStyle: "rgba(85,214,253,0.55)" },
      }) as unknown as Rep;
      r.on("resize", (d) => { const x = d as { width: number; height: number }; if (x?.width) setBoyut({ w: x.width, h: x.height }); });
      r.on("finish", () => { setOynuyor(false); setAn(r.getMetaData().totalTime); });
      r.on("skip-start", () => setAtlaniyor(true));
      r.on("skip-end", () => setAtlaniyor(false));
      rep.current = r;
      r.pause(0);
      setKuruldu(true);
    }).catch(() => setHata("Oynatıcı yüklenemedi."));
    return () => { iptal = true; try { rep.current?.pause(); rep.current?.destroy?.(); } catch { /* yok */ } rep.current = null; };
  }, [olaylar, goruntuVar]);

  /* Oynarken zamanı izle */
  useEffect(() => {
    if (!oynuyor) return;
    let k = 0;
    const d = () => { const r = rep.current; if (r) setAn(Math.min(toplam, r.getCurrentTime())); k = requestAnimationFrame(d); };
    k = requestAnimationFrame(d);
    return () => cancelAnimationFrame(k);
  }, [oynuyor, toplam]);

  useEffect(() => { rep.current?.setConfig({ speed: Number(hiz) }); }, [hiz]);
  useEffect(() => { rep.current?.setConfig({ skipInactive: atla }); }, [atla]);

  const git = useCallback((t: number) => {
    const r = rep.current;
    const x = Math.max(0, Math.min(toplam, t));
    setAn(x);
    if (!r) return;
    if (oynuyor) r.play(x); else r.pause(x);
  }, [oynuyor, toplam]);
  const oynat = useCallback(() => {
    const r = rep.current;
    if (!r) return;
    if (oynuyor) { r.pause(); setAn(r.getCurrentTime()); setOynuyor(false); return; }
    const t = an >= toplam - 100 ? 0 : an;
    r.play(t); setAn(t); setOynuyor(true);
  }, [oynuyor, an, toplam]);

  /* Klavye: boşluk oynat, oklar 5 sn */
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && (h.tagName === "INPUT" || h.tagName === "TEXTAREA" || h.isContentEditable || h.getAttribute("role") === "slider")) return;
      if (e.key === " ") { e.preventDefault(); oynat(); }
      if (e.key === "ArrowRight") git(an + 5000);
      if (e.key === "ArrowLeft") git(an - 5000);
    };
    addEventListener("keydown", t);
    return () => removeEventListener("keydown", t);
  }, [oynat, git, an]);

  /* Oynarken olay listesinde etkin satırı görünür tut */
  useEffect(() => {
    if (!oynuyor || sekme !== "olaylar" || etkinIndis < 0) return;
    liste.current?.querySelector(`[data-i="${etkinIndis}"]`)?.scrollIntoView({ block: "nearest" });
  }, [etkinIndis, oynuyor, sekme]);

  const ozetle = async () => {
    setSekme("ozet"); setAiDurum({ yuk: true });
    try {
      const v = await api<{ ai: OturumAi }>(`/api/build/oturum/${projeId}/${ozet.id}`, { govde: {} });
      setAi(v.ai); aiGeldi(ozet.id, v.ai); setAiDurum({ yuk: false });
    } catch (e) { setAiDurum({ yuk: false, hata: e instanceof ApiHatasi ? e.message : "Özet çıkarılamadı." }); }
  };
  const ajanaGonder = () => {
    if (!ai) return;
    const tarih = new Date(ozet.alinma).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const metin = [
      `Bir ziyaretçi oturumunun kaydına göre sitede sorunlar görüldü (Bulut, Oturumlar; ${tarih}, ${CIHAZ_AD[ozet.cihaz]} ${ozet.en} piksel, ${sureYazi(ozet.sure)}).`,
      ai.amac ? `Ziyaretçinin amacı: ${ai.amac}` : "",
      ai.surtunmeler.length ? `Sürtünme noktaları:\n${ai.surtunmeler.map((s) => `- ${s.baslik}${s.an != null ? ` (${anYazi(s.an)})` : ""}: ${s.ayrinti}`).join("\n")}` : "",
      hatalar.length ? `Oturumdaki hatalar:\n${[...new Set(hatalar.map((h) => `- ${h.baslik}${h.ayrinti ? ` (${h.ayrinti}, ${h.yol})` : ""}`))].slice(0, 6).join("\n")}` : "",
      ai.oneriler.length ? `Önerilen düzeltmeler:\n${ai.oneriler.map((s) => `- ${s.baslik}: ${s.ayrinti}`).join("\n")}` : "",
      "Bu düzeltmeleri uygula ve değiştirdiğin her şeyi kısaca özetle.",
    ].filter(Boolean).join("\n\n");
    ajana(metin);
    setGitti(true);
  };
  const sil = async () => {
    if (!confirm("Bu oturum kaydı silinsin mi?")) return;
    setSiliniyor(true);
    try { await api(`/api/build/oturum/${projeId}/${ozet.id}`, { method: "DELETE" }); silindi(ozet.id); kapat(); } catch { setSiliniyor(false); }
  };

  const olcek = alan.w && boyut.w ? Math.min(alan.w / boyut.w, alan.h / boyut.h, 1.25) : 0;
  const CS = CIHAZ_SIMGE[ozet.cihaz];
  const tarih = new Date(ozet.alinma).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{STIL}</style>
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><CS className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white"><span className="max-sm:hidden">Oturum, </span>{tarih}</p>
          <p className="truncate text-[12.5px] text-white/50">{[`${CIHAZ_AD[ozet.cihaz]} ${ozet.en ? `${ozet.en} piksel` : ""}`.trim(), ozet.tarayici, ozet.ulke, sureYazi(ozet.sure), `${ozet.sayfalar.length || 1} sayfa`].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={ozetle} disabled={aiDurum.yuk || !olaylar || izleyici} title={izleyici ? "İzleyiciler özet çıkaramaz" : undefined} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black disabled:opacity-60">
          {aiDurum.yuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Yapay zekâyla özetle</span><span className="sm:hidden">Özetle</span>
        </button>
        {!izleyici && <button type="button" onClick={sil} disabled={siliniyor} aria-label="Oturumu sil" title="Oturumu sil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-rose-500/[0.1] hover:text-rose-200">{siliniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>}
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto max-lg:[scrollbar-width:thin]">
        {/* Sahne ve denetimler */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4 max-lg:shrink-0">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-white/75 ring-1 ring-inset ring-white/[0.07]"><Globe className="h-3.5 w-3.5 shrink-0 text-white/45" /><span className="truncate">{sayfa || "Sayfa"}</span></span>
            <span className="shrink-0 tabular-nums text-white/40 max-sm:hidden">{boyut.w} x {boyut.h}</span>
            <span className="flex-1" />
            <AnimatePresence>{atlaniyor && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] text-white/65">Hareketsiz an geçiliyor</motion.span>}</AnimatePresence>
          </div>
          <div ref={sahne} style={{ "--oy-oran": `${boyut.w} / ${boyut.h}` } as React.CSSProperties} className="oy-sahne relative min-h-[200px] flex-1 overflow-hidden rounded-[16px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.07] max-lg:max-h-[68vh] max-lg:w-full max-lg:flex-none max-lg:[aspect-ratio:var(--oy-oran)]">
            {hata ? <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-rose-200">{hata}</p>
              : !olaylar ? <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
              : !goruntuVar ? <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] text-white/55">Bu oturumda oynatılacak görüntü yok. Ziyaretçi sayfa yüklenmeden ayrılmış olabilir.</p>
              : !kuruldu ? <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2 bg-[#0c0d0f]"><Loader2 className="h-5 w-5 animate-spin text-white/40" /><span className="text-[12.5px] text-white/45">Sayfa kuruluyor</span></div>
              : null}
            <div ref={kap} className="absolute" style={{ left: Math.max(0, (alan.w - boyut.w * olcek) / 2), top: Math.max(0, (alan.h - boyut.h * olcek) / 2), width: boyut.w, height: boyut.h, transform: `scale(${olcek || 0.0001})`, transformOrigin: "0 0", visibility: olcek ? "visible" : "hidden" }} />
            <AnimatePresence>
              {anlik && (
                <motion.span key={`${anlik.z}-${anlik.tur}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-3 top-3 inline-flex max-w-[80%] items-center gap-1.5 rounded-full bg-[#141518]/95 px-3 py-1.5 text-[12.5px] ring-1 ring-inset ring-white/[0.1]">
                  {(() => { const g = ISARET[anlik.tur]; return <><g.I className={cn("h-3.5 w-3.5 shrink-0", g.yazi)} /><span className="truncate text-white">{anlik.tur === "hata" ? anlik.baslik : `${g.ad}: ${anlik.ayrinti ?? anlik.baslik}`}</span></>; })()}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {goruntuVar && (
            <div className="rounded-[16px] bg-white/[0.03] px-3 pb-2.5 pt-1 ring-1 ring-inset ring-white/[0.06] sm:px-4">
              <ZamanCubugu toplam={toplam} an={an} isaretler={isaretler} bos={bos} git={git} />
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={oynat} aria-label={oynuyor ? "Durdur" : "Oynat"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
                  {oynuyor ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
                </motion.button>
                <button type="button" onClick={() => git(0)} aria-label="Başa dön" title="Başa dön" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>
                <span className="shrink-0 text-[13px] tabular-nums text-white/75">{anYazi(an)} <span className="text-white/35">/ {anYazi(toplam)}</span></span>
                <span className="hidden flex-wrap items-center gap-x-3 gap-y-1 xl:flex">
                  {CUBUK_TURLERI.map((t) => <span key={t} className="inline-flex items-center gap-1.5 text-[11.5px] text-white/45"><span className="h-2 w-2 rounded-full" style={t === "olu" ? { boxShadow: `inset 0 0 0 2px ${ISARET[t].renk}` } : { background: ISARET[t].renk }} />{ISARET[t].ad}</span>)}
                </span>
                <span className="flex-1" />
                <label className="flex shrink-0 items-center gap-2 text-[12.5px] text-white/65"><span>Hareketsiz anları atla</span><Anahtar acik={atla} set={setAtla} etiket="Hareketsiz anları atla" /></label>
                <Secici id={`oy-hiz-${ozet.id}`} kucuk deger={hiz} set={setHiz} l={HIZLAR.map((h) => ({ id: h, ad: `${h}x` }))} />
              </div>
            </div>
          )}
        </div>

        {/* Yan panel: olaylar, konsol, yapay zekâ özeti */}
        <aside className="flex w-full shrink-0 flex-col border-white/[0.07] lg:w-[360px] lg:border-l max-lg:border-t">
          <div className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-3">
            <Secici id={`oy-sekme-${ozet.id}`} deger={sekme} set={setSekme} l={[{ id: "olaylar", ad: `Olaylar ${isaretler.length || ""}`.trim() }, { id: "konsol", ad: `Konsol ${hatalar.length || ""}`.trim() }, { id: "ozet", ad: "Özet" }]} />
          </div>
          <div ref={liste} className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:thin] max-lg:max-h-none">
            {sekme === "olaylar" && (
              !olaylar ? <div className="h-40 animate-pulse rounded-[12px] bg-white/[0.02]" /> : !isaretler.length ? <p className="px-3 py-6 text-center text-[13px] text-white/45">Bu oturumda işaretlenecek olay yok.</p> : (
                <div className="space-y-0.5">
                  {isaretler.map((x, i) => {
                    const g = ISARET[x.tur], etkinMi = i === etkinIndis;
                    return (
                      <button key={i} data-i={i} type="button" onClick={() => git(Math.max(0, x.z - 800))} className={cn("flex w-full items-start gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors", etkinMi ? "bg-white/[0.07]" : "hover:bg-white/[0.04]", x.tur === "sayfa" && i > 0 && "mt-2")}>
                        <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px]", x.tur === "sayfa" ? "bg-white/[0.1]" : "bg-white/[0.05]")}><g.I className={cn("h-3.5 w-3.5", g.yazi)} /></span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-[13px] leading-snug", x.tur === "sayfa" ? "font-medium text-white" : x.tur === "hata" ? "text-rose-100" : "text-white/85", "line-clamp-2 break-words")}>{x.baslik}</span>
                          {x.ayrinti && <span className="mt-0.5 block truncate text-[11.5px] text-white/45">{x.ayrinti}</span>}
                        </span>
                        <span className="mt-0.5 shrink-0 text-[11.5px] tabular-nums text-white/40">{anYazi(x.z)}</span>
                      </button>
                    );
                  })}
                </div>
              )
            )}
            {sekme === "konsol" && (
              !hatalar.length ? <p className="px-3 py-6 text-center text-[13px] text-white/45">Bu oturumda JavaScript, konsol ya da ağ hatası yok.</p> : (
                <div className="space-y-1.5 px-1">
                  {hatalar.map((x, i) => (
                    <button key={i} type="button" onClick={() => git(Math.max(0, x.z - 800))} className={cn("block w-full rounded-[12px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", x.tur === "hata" ? "bg-rose-500/[0.06] ring-rose-300/[0.12] hover:bg-rose-500/[0.1]" : "bg-amber-400/[0.05] ring-amber-200/[0.1] hover:bg-amber-400/[0.08]")}>
                      <span className="flex items-center gap-2 text-[11.5px]"><span className={x.tur === "hata" ? "text-rose-200" : "text-amber-200"}>{x.tur === "hata" ? "Hata" : "Uyarı"}</span><span className="text-white/40">{x.ayrinti}</span><span className="flex-1" /><span className="tabular-nums text-white/40">{anYazi(x.z)}</span></span>
                      <span className="sc-kod mt-1 block break-words text-[12px] leading-relaxed text-white/85">{x.baslik}</span>
                      {x.yol && <span className="mt-1 block text-[11.5px] text-white/40">{x.yol}</span>}
                    </button>
                  ))}
                </div>
              )
            )}
            {sekme === "ozet" && (
              <div className="px-2 pt-1">
                {aiDurum.yuk ? (
                  <div className="space-y-3 rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <p className="flex items-center gap-2 text-[13px] text-white/70"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#55d6fd]" />Oturum okunuyor, sürtünme noktaları çıkarılıyor</p>
                    {[80, 64, 72].map((w, i) => <div key={i} className="h-3 animate-pulse rounded-full bg-white/[0.06]" style={{ width: `${w}%` }} />)}
                  </div>
                ) : aiDurum.hata ? (
                  <div className="rounded-[16px] bg-amber-400/[0.06] p-4 ring-1 ring-inset ring-amber-200/[0.12]">
                    <p className="flex items-start gap-2 text-[13px] leading-relaxed text-amber-100/90"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{aiDurum.hata}</p>
                    <button type="button" onClick={ozetle} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><RotateCcw className="h-3.5 w-3.5" />Tekrar dene</button>
                  </div>
                ) : ai ? (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="rounded-[16px] bg-white/[0.04] p-4 ring-1 ring-inset ring-white/[0.07]">
                      <p className="text-[12px] text-white/45">Ziyaretçinin amacı</p>
                      <p className="mt-1 text-[14px] font-medium leading-snug text-white">{ai.amac || "Belirlenemedi"}</p>
                      {ai.ozet && <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">{ai.ozet}</p>}
                    </div>
                    <div>
                      <p className="px-1 text-[12.5px] font-medium text-white/80">Sürtünme noktaları</p>
                      {ai.surtunmeler.length ? <div className="mt-1.5 space-y-1.5">{ai.surtunmeler.map((s, i) => (
                        <div key={i} className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                          <p className="flex items-start gap-2 text-[13px] text-white"><span className="min-w-0 flex-1">{s.baslik}</span>{s.an != null && <button type="button" onClick={() => git(Math.max(0, s.an! - 800))} className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-white/75 hover:bg-white/[0.14]">{anYazi(s.an)}</button>}</p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{s.ayrinti}</p>
                        </div>
                      ))}</div> : <p className="mt-1 px-1 text-[12.5px] text-white/45">Belirgin bir takılma görülmedi.</p>}
                    </div>
                    {ai.oneriler.length > 0 && (
                      <div>
                        <p className="px-1 text-[12.5px] font-medium text-white/80">Önerilen düzeltmeler</p>
                        <ol className="mt-1.5 space-y-1.5">{ai.oneriler.map((s, i) => (
                          <li key={i} className="flex gap-2.5 rounded-[12px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold tabular-nums text-white/75">{i + 1}</span>
                            <span className="min-w-0"><span className="block text-[13px] text-white">{s.baslik}</span><span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/55">{s.ayrinti}</span></span>
                          </li>
                        ))}</ol>
                      </div>
                    )}
                    {!izleyici && <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                      <button type="button" onClick={ajanaGonder} disabled={gitti} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60"><Send className="h-3.5 w-3.5" />{gitti ? "Ajana gönderildi" : "Ajana gönder"}</button>
                      <button type="button" onClick={ozetle} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><RotateCcw className="h-3.5 w-3.5" />Yeniden özetle</button>
                    </div>}
                    <p className="px-1 text-[11.5px] text-white/35">{ai.model} ile, {new Date(ai.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </motion.div>
                ) : (
                  <div className="rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <p className="text-[13.5px] font-medium text-white">Oturumu yapay zekâya okut</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">Sayfalarda ne kadar kaldığı, nereye tıkladığı, nerede takıldığı ve gördüğü hatalar sade bir döküm olarak modele gider. Form değerleri gitmez. Dönen önerileri tek tıkla Build ajanına iletebilirsin.</p>
                    {izleyici ? <p className="mt-3 text-[12px] text-white/40">İzleyiciler özet çıkaramaz; proje sahibi ya da bir düzenleyici çıkardığında burada görünür.</p> : <button type="button" onClick={ozetle} disabled={!olaylar} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60"><Sparkles className="h-3.5 w-3.5" />Yapay zekâyla özetle</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
