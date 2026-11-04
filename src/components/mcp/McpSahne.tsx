"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Braces, Check, Loader2, Pause, Play, Plug } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { MODELLER } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/* ── İstemciler (sayfa ile ortak) ── */

export type IstemciId = "claude-code" | "claude-desktop" | "cursor" | "vscode" | "windsurf" | "diger";
/** ek: [bulunma, yönelme] — "Cursor'da", "Cursor'a" */
export const ISTEMCILER: { id: IstemciId; ad: string; logo?: string; alt: string; tekTik?: boolean; ek: [string, string] }[] = [
  { id: "claude-code", ad: "Claude Code", logo: "/marka/renkli/claude-color.svg", alt: "Terminal", ek: ["Claude Code'da", "Claude Code'a"] },
  { id: "claude-desktop", ad: "Claude Desktop", logo: "/marka/renkli/claude-color.svg", alt: "Masaüstü uygulaması", ek: ["Claude Desktop'ta", "Claude Desktop'a"] },
  { id: "cursor", ad: "Cursor", logo: "/marka/renkli/cursor-beyaz.svg", alt: "Editör", tekTik: true, ek: ["Cursor'da", "Cursor'a"] },
  { id: "vscode", ad: "VS Code", logo: "/marka/renkli/vscode.svg", alt: "Copilot ajan modu", tekTik: true, ek: ["VS Code'da", "VS Code'a"] },
  { id: "windsurf", ad: "Windsurf", logo: "/marka/renkli/windsurf.svg", alt: "Cascade", ek: ["Windsurf'te", "Windsurf'e"] },
  { id: "diger", ad: "Diğer", alt: "Streamable HTTP", ek: ["Ajanında", "Ajanına"] },
];

export function IstemciLogo({ id, boyut = 18, className }: { id: IstemciId; boyut?: number; className?: string }) {
  const i = ISTEMCILER.find((x) => x.id === id)!;
  return i.logo
    ? <img src={i.logo} alt="" style={{ width: boyut, height: boyut }} className={className} />
    : <Braces style={{ width: boyut, height: boyut }} className={cn("text-white/85", className)} />;
}

/* ── Senaryolar: gerçek Vayra çıktıları, bedeller katalogdan ── */

const model = (id: string) => MODELLER.find((m) => m.id === id)!;
const turSayisi = (tur: string) => MODELLER.filter((m) => m.tur === tur).length;

const SAHNE = [
  { id: "parfum", ad: "Parfüm reklamı", istem: "Cam parfüm şişesi için 8 saniyelik lüks bir reklam videosu üret.", video: "/gercek/video-hareket/commercial.mp4", poster: "/gercek/video-hareket/commercial-poster.webp", model: "veo-31", logo: "/marka/renkli/google-color.svg", ayar: "8 sn · 16:9 · sesli" },
  { id: "araba", ad: "Araba tanıtımı", istem: "Kırmızı spor araba için şehirde yörünge çekimi, sinematik ışık.", video: "/gercek/video-hareket/orbit-left.mp4", poster: "/gercek/video-hareket/orbit-left-poster.webp", model: "kling-3", logo: "/marka/renkli/kling-color.svg", ayar: "5 sn · 16:9" },
  { id: "moda", ad: "Moda çekimi", istem: "Neon ceketli model etrafında yavaş bir kamera dönüşü yap.", video: "/gercek/video-hareket/camera-orbit.mp4", poster: "/gercek/video-hareket/camera-orbit-poster.webp", model: "seedance-2", logo: "/marka/renkli/bytedance-color.svg", ayar: "5 sn · 16:9" },
  { id: "dag", ad: "Drone çekimi", istem: "Gün doğumunda karlı bir zirvenin etrafında drone çekimi.", video: "/gercek/video-hareket/drone-orbit.mp4", poster: "/gercek/video-hareket/drone-orbit-poster.webp", model: "sora-2", logo: "/marka/renkli/openai.svg", ayar: "8 sn · 16:9" },
  { id: "kahve", ad: "Ürün görseli", istem: "Kahve markam için sıcak ışıklı, sade bir ürün görseli üret.", video: "", poster: "/gercek/paz/urun-kahve.webp", model: "nano-banana-pro", logo: "/marka/renkli/nanobanana-color.svg", ayar: "2K · 16:9" },
].map((s) => { const m = model(s.model); return { ...s, modelAd: m.ad, kredi: m.kredi, tur: m.tur }; });

type Sahne = (typeof SAHNE)[number];
const TUR_AD: Record<string, string> = { video: "video", gorsel: "görsel" };

/* 0 boş · 1 istem · 2 list_models · 3 get_model · 4 bedel onayı · 5 generate · 6 hazır */
const SURE = [500, 1700, 1000, 1000, 2000, 2800, 7000];
const TOPLAM = SURE.reduce((t, n) => t + n, 0);
const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

function Video({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const r = useRef<HTMLVideoElement>(null);
  useEffect(() => { const v = r.current; if (v) { v.currentTime = 0; void v.play().catch(() => {}); } }, [src]);
  return <video ref={r} src={src} poster={poster} muted loop playsInline className={className} />;
}

function Yaz({ metin, sure }: { metin: string; sure: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => { if (x >= metin.length) { clearInterval(t); return x; } return x + 1; }), Math.max(14, sure / metin.length));
    return () => clearInterval(t);
  }, [metin, sure]);
  return <>{metin.slice(0, n)}{n < metin.length && <span className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-black/70" />}</>;
}

function Sayac({ hedef, sure }: { hedef: number; sure: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = performance.now(); let raf = 0;
    const f = (t: number) => { const p = Math.min(1, (t - t0) / sure); setN(Math.round(hedef * (1 - Math.pow(1 - p, 2)))); if (p < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [hedef, sure]);
  return <>{n}</>;
}

function AracSatiri({ ad, arg, sonuc, bitti }: { ad: string; arg: string; sonuc?: string; bitti: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={yay}
      className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/[0.08]">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300", bitti ? "bg-emerald-400/15 text-emerald-300" : "bg-[#55d6fd]/15 text-[#55d6fd]")}>
        <AnimatePresence mode="wait" initial={false}>
          {bitti ? <motion.span key="b" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Check className="h-3.5 w-3.5" /></motion.span> : <motion.span key="c" exit={{ opacity: 0 }}><Loader2 className="h-3.5 w-3.5 animate-spin" /></motion.span>}
        </AnimatePresence>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-white"><span className="font-semibold">vayra · {ad}</span> <span className="text-white/50">{arg}</span></p>
        {sonuc && <p className="truncate text-[12px] text-white/65">{bitti ? sonuc : "çalışıyor"}</p>}
      </div>
    </motion.div>
  );
}

export function McpSahne({ istemci, setIstemci, sunucu, onBagla }: {
  istemci: IstemciId; setIstemci: (i: IstemciId) => void;
  sunucu: { ok: boolean; ms: number; surum?: string } | null; onBagla: () => void;
}) {
  const azalt = useReducedMotion();
  const [sec, setSec] = useState(0);
  const [a, setA] = useState(azalt ? 6 : 0);
  const [durdu, setDurdu] = useState(false);
  const s: Sahne = SAHNE[sec];
  const ist = ISTEMCILER.find((i) => i.id === istemci)!;

  useEffect(() => { setA(azalt ? 6 : 0); }, [sec, azalt]);
  useEffect(() => {
    if (azalt || durdu) return;
    const t = setTimeout(() => { if (a === 6) setSec((x) => (x + 1) % SAHNE.length); else setA(a + 1); }, SURE[a]);
    return () => clearTimeout(t);
  }, [a, azalt, durdu]);

  const durumMetni = sunucu === null ? "Bağlantı ölçülüyor" : sunucu.ok ? `MCP sunucusu çalışıyor · ${sunucu.ms} ms` : "MCP sunucusuna ulaşılamıyor";

  return (
    <section aria-label="Vayra MCP tanıtımı">
      <div className="relative overflow-clip rounded-[30px] ring-1 ring-white/[0.08] sm:rounded-[36px]">
        <AnimatePresence initial={false}>
          <motion.img key={s.poster} src={s.poster} alt="" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-[60px]" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.55),#08080a_92%)] lg:bg-[linear-gradient(100deg,#08080a_32%,rgba(8,8,10,0.5)_72%,rgba(8,8,10,0.72))]" />

        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-6 p-5 sm:p-8 lg:min-h-[720px] lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:gap-10 lg:p-10">
          {/* Sol: başlık + sohbet */}
          <div className="contents lg:flex lg:min-w-0 lg:flex-col">
            <div className="order-1 lg:order-none">
            <span className="inline-flex w-max items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12.5px] font-medium text-white/85 ring-1 ring-white/[0.1] backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                {sunucu?.ok && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />}
                <span className={cn("h-1.5 w-1.5 rounded-full", sunucu === null ? "bg-white/40" : sunucu.ok ? "bg-emerald-400" : "bg-rose-400")} />
              </span>
              {durumMetni}
            </span>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.0] tracking-[-0.045em] text-white sm:text-[54px]">
              Sohbetten<br />çıkmadan<br /><span className="bg-gradient-to-r from-white to-[#55d6fd] bg-clip-text text-transparent">film üret.</span>
            </h1>
            <p className="mt-4 max-w-[430px] text-[15.5px] leading-relaxed text-white/75">
              {ist.ek[1]} tek adres ekle; Vayra&apos;nın {MODELLER.length} modeliyle görsel, video, ses, müzik ve 3D üretsin. Bedeli önce söyler, onayınla harcar, çıktı kitaplığına düşer.
            </p>
            </div>

            <div className="order-3 flex min-h-[330px] flex-1 flex-col rounded-[24px] bg-black/45 p-3 ring-1 ring-white/[0.09] backdrop-blur-xl lg:order-none lg:mt-7">
              <div className="mb-2.5 flex items-center gap-2 px-1.5 pt-0.5">
                <IstemciLogo id={istemci} boyut={15} />
                <span className="text-[12.5px] font-semibold text-white">{istemci === "diger" ? "Ajan" : ist.ad}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300"><span className="h-1 w-1 rounded-full bg-emerald-400" />vayra</span>
                <button onClick={() => setDurdu((d) => !d)} aria-label={durdu ? "Akışı sürdür" : "Akışı duraklat"} title={durdu ? "Sürdür" : "Duraklat"}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white active:scale-90">
                  {durdu ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {a >= 1 && (
                    <motion.p key={"i" + sec} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      className="ml-auto max-w-[90%] rounded-[18px] rounded-br-md bg-white px-3.5 py-2.5 text-[13.5px] font-medium leading-snug text-black">
                      {a === 1 ? <Yaz metin={s.istem} sure={1200} /> : s.istem}
                    </motion.p>
                  )}
                  {a >= 2 && <AracSatiri key={"l" + sec} ad="list_models" arg={`type: ${s.tur === "video" ? "video" : "image"}`} sonuc={`${turSayisi(s.tur)} ${TUR_AD[s.tur]} modeli`} bitti={a >= 3} />}
                  {a >= 3 && <AracSatiri key={"g" + sec} ad="get_model" arg={s.model} sonuc={s.ayar} bitti={a >= 4} />}
                  {a >= 4 && (
                    <motion.div key={"o" + sec} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={yay}
                      className="relative flex items-center gap-3 rounded-[14px] bg-[#55d6fd]/[0.09] px-3 py-2.5 ring-1 ring-[#55d6fd]/35">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><img src={s.logo} alt="" className="h-4 w-4" /></span>
                      <p className="min-w-0 flex-1 text-[13px] leading-snug text-white">{s.modelAd} ile 1 {TUR_AD[s.tur]}<br /><span className="font-semibold">{s.kredi} kredi</span> <span className="text-white/60">· onaylıyor musun?</span></p>
                      <motion.span animate={a === 4 ? { scale: [1, 1, 0.9, 1] } : {}} transition={{ duration: 1.7, times: [0, 0.7, 0.8, 1] }}
                        className={cn("shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-300", a >= 5 ? "bg-emerald-400/15 text-emerald-300" : "bg-white text-black")}>
                        {a >= 5 ? "Onaylandı" : "Onayla"}
                      </motion.span>
                    </motion.div>
                  )}
                  {a >= 5 && <AracSatiri key={"u" + sec} ad="generate" arg={s.model} sonuc={`Hazır · ${s.kredi} kredi harcandı`} bitti={a >= 6} />}
                  {a >= 6 && (
                    <motion.div key={"s" + sec} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={yay} className="flex items-start gap-2.5 px-1 pt-1">
                      <img src={s.poster} alt="" className="h-11 w-16 shrink-0 rounded-[10px] object-cover ring-1 ring-white/10" />
                      <p className="text-[13px] leading-relaxed text-white/80">Hazır; kitaplığına da kaydettim. Dikey bir sürümünü de ister misin?</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sağ: tuval + senaryolar */}
          <div className="order-2 flex min-w-0 flex-col justify-center lg:order-none">
            <div className="relative aspect-video overflow-hidden rounded-[22px] bg-white/[0.04] ring-1 ring-white/[0.12] sm:rounded-[26px]">
              <AnimatePresence mode="wait">
                {a >= 6 ? (
                  <motion.div key={"v" + sec} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
                    {s.video ? <Video src={s.video} poster={s.poster} className="h-full w-full object-cover" /> : <img src={s.poster} alt="" className="h-full w-full object-cover" />}
                  </motion.div>
                ) : (
                  <motion.div key={"b" + sec} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                    <img src={s.poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl" />
                    {a >= 5 && (
                      <motion.div initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: SURE[5] / 1000, ease: [0.45, 0, 0.2, 1] }} className="absolute inset-0">
                        <img src={s.poster} alt="" className="h-full w-full object-cover opacity-80 saturate-[0.55]" />
                        <span className="absolute inset-y-0 right-0 w-[2px] bg-[#55d6fd]" />
                        <span className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#55d6fd]/25 to-transparent" />
                      </motion.div>
                    )}
                    <div className="absolute inset-0 animate-[hf-shimmer_2.4s_linear_infinite] bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.06)_50%,transparent_70%)] bg-[length:200%_100%]" />
                    <div className="relative flex flex-col items-center rounded-[20px] bg-black/45 px-6 py-4 backdrop-blur-md">
                      <VayraIsaret size={36} />
                      <p className="mt-2.5 text-[14px] font-medium text-white">{a >= 5 ? <>Üretiliyor · %<Sayac key={sec} hedef={100} sure={SURE[5]} /></> : a >= 4 ? "Onayın bekleniyor" : a >= 1 ? "Ajan model seçiyor" : "İstek bekleniyor"}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-x-2.5 top-2.5 flex justify-end sm:inset-x-3 sm:top-3">
                <AnimatePresence>
                  {a >= 6 && (
                    <motion.span initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, ...yay }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
                      <Check className="h-3.5 w-3.5 text-emerald-300" />Kitaplığa kaydedildi
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5 sm:inset-x-3 sm:bottom-3 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur"><img src={s.logo} alt="" className="h-3.5 w-3.5" />{s.modelAd}</span>
                <span className="hidden rounded-full bg-black/60 px-2.5 py-1 text-[12px] text-white/90 backdrop-blur sm:inline">{s.ayar}</span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[12px] text-white/90 backdrop-blur"><IstemciLogo id={istemci} boyut={13} /><span className="hidden sm:inline">{istemci === "diger" ? "Ajan" : ist.ad} üzerinden</span></span>
              </div>
            </div>

            <LayoutGroup id="mcp-sahne">
              <div role="tablist" aria-label="Örnek akışlar" className="-mx-5 mt-3.5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
                {SAHNE.map((x, k) => (
                  <button key={x.id} role="tab" aria-selected={k === sec} onClick={() => { setSec(k); setDurdu(false); }}
                    className="group relative w-[132px] shrink-0 overflow-hidden rounded-[16px] text-left ring-1 ring-white/[0.1] transition active:scale-[0.97] sm:w-auto">
                    <img src={x.poster} alt="" className={cn("aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105", k !== sec && "opacity-55 group-hover:opacity-90")} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-x-2.5 bottom-2">
                      <p className="truncate text-[12.5px] font-semibold text-white">{x.ad}</p>
                      <p className="flex min-w-0 items-center gap-1 text-[11px] text-white/70"><img src={x.logo} alt="" className="h-3 w-3 shrink-0" /><span className="truncate">{x.modelAd}</span></p>
                    </div>
                    {k === sec && <motion.span layoutId="mcp-sahne-z" className="pointer-events-none absolute inset-0 rounded-[16px] ring-2 ring-[#55d6fd]" transition={yay} />}
                    {k === sec && !durdu && !azalt && (
                      <motion.span key={"p" + sec} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: TOPLAM / 1000, ease: "linear" }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#55d6fd]" />
                    )}
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <p className="mt-2.5 text-[12px] text-white/50">Örnek akış: araç adları ve kredi bedelleri gerçek, videolar Vayra&apos;da üretildi.</p>
          </div>
        </div>
      </div>

      {/* Bağla dock'u */}
      <div className="mx-auto mt-4 flex w-full max-w-max items-center gap-1 overflow-x-auto rounded-full bg-[#141416]/90 p-1.5 ring-1 ring-white/[0.1] backdrop-blur-xl [scrollbar-width:none]">
        <LayoutGroup id="mcp-dock">
          {ISTEMCILER.map((i) => (
            <button key={i.id} onClick={() => setIstemci(i.id)} title={i.ad} aria-pressed={istemci === i.id} className="relative flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition active:scale-95">
              {istemci === i.id && <motion.span layoutId="mcp-dock-z" className="absolute inset-0 rounded-full bg-white/[0.1] ring-1 ring-white/[0.12]" transition={yay} />}
              <IstemciLogo id={i.id} boyut={18} className="relative" />
              <AnimatePresence initial={false}>
                {istemci === i.id && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="relative hidden overflow-hidden whitespace-nowrap text-white sm:block">{i.ad}</motion.span>}
              </AnimatePresence>
            </button>
          ))}
        </LayoutGroup>
        <button onClick={onBagla} className="ml-1 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">
          <Plug className="h-4 w-4" />{ist.ek[1]} bağla
        </button>
      </div>
    </section>
  );
}
