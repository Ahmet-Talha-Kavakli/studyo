"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowUp, FlaskConical, Lock, MessageCircle, RotateCcw, X } from "lucide-react";
import type { SohbetMesaji, SohbetTanimi } from "@/lib/build/sistemGenel";
import { cn } from "@/lib/utils";

/** Sistemin herkese açık sohbet sayfası (/s/c/<anahtar>); gömülü kutuda gomulu=1 ile açılır. */
const yeniOturum = () => `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/** Basit biçim: paragraflar, madde listeleri, kalın yazı ve bağlantılar. */
function Bicimli({ metin }: { metin: string }) {
  const satir = (s: string, k: number) => s.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s<>"')]+)/g).map((p, i) => p.startsWith("**") && p.endsWith("**") ? <b key={`${k}-${i}`} className="font-semibold">{p.slice(2, -2)}</b> : /^https?:\/\//.test(p) ? <a key={`${k}-${i}`} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-[#8be6ff] underline underline-offset-2">{p}</a> : <span key={`${k}-${i}`}>{p}</span>);
  const bloklar = metin.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {bloklar.map((b, i) => {
        const l = b.split("\n");
        if (l.every((x) => /^\s*([-*]|\d+[.)])\s/.test(x))) return <ul key={i} className="space-y-1">{l.map((x, j) => <li key={j} className="flex gap-2"><span className="shrink-0 text-white/40">{/^\s*\d/.test(x) ? `${x.trim().match(/^\d+/)![0]}.` : "•"}</span><span className="min-w-0">{satir(x.replace(/^\s*([-*]|\d+[.)])\s/, ""), j)}</span></li>)}</ul>;
        if (/^#{1,4}\s/.test(b)) return <p key={i} className="font-semibold">{satir(b.replace(/^#+\s*/, ""), i)}</p>;
        return <p key={i} className="whitespace-pre-wrap">{l.map((x, j) => <span key={j}>{j > 0 && <br />}{satir(x, j)}</span>)}</p>;
      })}
    </div>
  );
}

export function SohbetSayfasi({ anahtar, t, test, gomulu }: { anahtar: string; t: SohbetTanimi; test?: string; gomulu?: boolean }) {
  const anahtarYer = `vayra-sohbet-${anahtar}${test ? "-test" : ""}`;
  const [oturum, setOturum] = useState("");
  const [l, setL] = useState<SohbetMesaji[]>([]);
  const [yaz, setYaz] = useState("");
  const [bekliyor, setBekliyor] = useState<string | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const liste = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const q = test ? `&test=${encodeURIComponent(test)}` : "";

  const yukle = useCallback(async (o: string) => {
    const r = await fetch(`/api/build/sistemler/sohbet/${anahtar}?oturum=${o}${q}`).then((x) => x.json()).catch(() => null);
    if (r?.ok) setL(r.mesajlar ?? []);
    return r?.mesajlar as SohbetMesaji[] | undefined;
  }, [anahtar, q]);
  useEffect(() => {
    let o = "";
    try { o = localStorage.getItem(anahtarYer) ?? ""; } catch { /* gizli sekme */ }
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(o)) { o = yeniOturum(); try { localStorage.setItem(anahtarYer, o); } catch { /* gizli sekme */ } }
    setOturum(o);
    yukle(o);
  }, [anahtarYer, yukle]);
  useLayoutEffect(() => { liste.current?.scrollTo({ top: liste.current.scrollHeight, behavior: "smooth" }); }, [l, bekliyor, gidiyor]);
  // Uzun süren yanıt: oturum yoklanır, yanıt gelince bekleme biter.
  useEffect(() => {
    if (!bekliyor || !oturum) return;
    const bas = Date.now();
    const z = setInterval(async () => {
      const m = await yukle(oturum);
      if (m?.some((x) => x.rol === "asistan" && x.calisma === bekliyor) || Date.now() - bas > 5 * 60_000) { setBekliyor(null); clearInterval(z); }
    }, 2500);
    return () => clearInterval(z);
  }, [bekliyor, oturum, yukle]);

  const gonder = async (metin: string) => {
    const m = metin.trim();
    if (!m || gidiyor || bekliyor || !oturum) return;
    setYaz(""); setHata(""); setGidiyor(true);
    setL((x) => [...x, { rol: "kullanici", metin: m, zaman: Date.now() }]);
    try {
      const r = await fetch(`/api/build/sistemler/sohbet/${anahtar}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oturum, mesaj: m, kaynak: gomulu ? "gomulu" : "sayfa", ...(test ? { test } : {}) }) });
      const v = await r.json().catch(() => ({}));
      if (!r.ok || !v.ok) { setHata(v.hata ?? "Mesaj gönderilemedi; yeniden dene."); return; }
      if (v.bekliyor) setBekliyor(v.calisma);
      else await yukle(oturum);
    } catch { setHata("Bağlantı kurulamadı; yeniden dene."); }
    finally { setGidiyor(false); requestAnimationFrame(() => alan.current?.focus()); }
  };
  const yeni = () => { const o = yeniOturum(); try { localStorage.setItem(anahtarYer, o); } catch { /* gizli sekme */ } setOturum(o); setL([]); setBekliyor(null); setHata(""); };
  const dusunuyor = gidiyor || !!bekliyor;

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("flex flex-col bg-[#0b0b0c] text-white", gomulu ? "h-screen" : "h-[100dvh]")}>
        <header className={cn("flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4", gomulu ? "h-[60px]" : "h-16 sm:px-6")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] text-[#8be6ff]"><MessageCircle className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{t.baslik}</span>{t.altBaslik && <span className="block truncate text-[12.5px] text-white/50">{t.altBaslik}</span>}</span>
          {t.test && <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/[0.12] px-2.5 py-1 text-[11.5px] font-medium text-amber-100"><FlaskConical className="h-3 w-3" />Deneme</span>}
          {l.length > 0 && <button type="button" onClick={yeni} aria-label="Yeni konuşma" title="Yeni konuşma" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><RotateCcw className="h-4 w-4" /></button>}
          {gomulu && <button type="button" onClick={() => parent.postMessage({ vayraSohbet: "kapat" }, "*")} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>}
        </header>
        <div ref={liste} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("mx-auto w-full space-y-3 px-4 py-5", gomulu ? "" : "max-w-[720px] sm:px-6")}>
            {!t.acik ? (
              <div className="mt-6 rounded-[20px] bg-[#141416] p-5 ring-1 ring-inset ring-white/[0.08]"><Lock className="h-5 w-5 text-white/60" /><p className="mt-3 text-[15px] font-semibold">Bu sohbet şu an kapalı</p><p className="mt-1 text-[13.5px] text-white/55">Daha sonra yeniden dene.</p></div>
            ) : (<>
              {t.karsilama && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[85%] rounded-[20px] rounded-bl-[6px] bg-[#18181b] px-4 py-2.5 text-[14.5px] leading-relaxed text-white/90 ring-1 ring-inset ring-white/[0.06]"><Bicimli metin={t.karsilama} /></motion.div>}
              <AnimatePresence initial={false}>
                {l.map((m, i) => (
                  <motion.div key={`${m.zaman}-${i}`} layout initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 36 }} className={cn("flex", m.rol === "kullanici" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] break-words px-4 py-2.5 text-[14.5px] leading-relaxed", m.rol === "kullanici" ? "rounded-[20px] rounded-br-[6px] bg-white text-black" : cn("rounded-[20px] rounded-bl-[6px] ring-1 ring-inset", m.hata ? "bg-rose-500/[0.08] text-rose-100 ring-rose-400/20" : "bg-[#18181b] text-white/90 ring-white/[0.06]"))}>
                      {m.rol === "kullanici" ? <p className="whitespace-pre-wrap">{m.metin}</p> : <Bicimli metin={m.metin} />}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {dusunuyor && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <span className="flex h-9 items-center gap-1 rounded-[18px] rounded-bl-[6px] bg-[#18181b] px-3.5 ring-1 ring-inset ring-white/[0.06]" aria-label="Yanıt yazılıyor">
                      {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/60" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }} />)}
                    </span>
                    {bekliyor && <span className="text-[12px] text-white/45">Biraz uzun sürüyor; yanıt gelince burada görünecek.</span>}
                  </motion.div>
                )}
              </AnimatePresence>
              {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
            </>)}
          </div>
        </div>
        {t.acik && (
          <div className={cn("shrink-0 px-3 pb-3 pt-1", !gomulu && "sm:px-6 sm:pb-5")}>
            <div className={cn("mx-auto w-full", !gomulu && "max-w-[720px]")}>
              {!l.length && t.oneriler.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {t.oneriler.map((o, i) => <motion.button key={o} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} type="button" onClick={() => gonder(o)} className="shrink-0 rounded-full bg-white/[0.06] px-3.5 py-2 text-[13px] text-white/80 ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.1] hover:text-white">{o}</motion.button>)}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); gonder(yaz); }} className="cam-istemci relative flex items-end gap-2 rounded-[24px] p-2 pl-4">
                <textarea ref={alan} value={yaz} onChange={(e) => { setYaz(e.target.value); e.target.style.height = "0px"; e.target.style.height = `${Math.min(160, e.target.scrollHeight)}px`; }} rows={1} maxLength={4000} placeholder={t.yerTutucu} aria-label="Mesaj"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); gonder(yaz); } }}
                  className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/40" />
                <motion.button whileTap={{ scale: 0.92 }} type="submit" disabled={!yaz.trim() || dusunuyor} aria-label="Gönder" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition disabled:bg-white/20 disabled:text-white/50"><ArrowUp className="h-[18px] w-[18px]" /></motion.button>
              </form>
              <p className="mt-2 text-center text-[11.5px] text-white/30">Vayra Build ile çalışır. Yanıtlar yapay zekâyla üretilebilir.</p>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
