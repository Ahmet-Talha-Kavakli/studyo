"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, FlaskConical, Loader2, Lock, RotateCcw } from "lucide-react";
import type { GirdiAlani } from "@/lib/build/sistemKatalog";
import type { FormTanimi } from "@/lib/build/sistemGenel";
import { cn } from "@/lib/utils";

/** Sistemin herkese açık form sayfası (/s/f/<anahtar>). Alanlar sistemin girdi alanlarıdır. */
const ALAN = "w-full rounded-[14px] bg-white/[0.05] px-4 text-[15px] text-white outline-none ring-1 ring-inset ring-white/[0.1] transition-shadow placeholder:text-white/35 focus:ring-2 focus:ring-[#55d6fd]/60";
const yay = { type: "spring" as const, stiffness: 420, damping: 38 };
/** Etiket yoksa alan adından okunur ad: musteri_adi yerine Musteri adi. */
const etiketi = (a: GirdiAlani) => a.etiket || a.ad.replace(/_/g, " ").replace(/^./, (c) => c.toLocaleUpperCase("tr"));

function Metin({ metin }: { metin: string }) {
  return <>{metin.split(/(https?:\/\/[^\s<>"')]+)/g).map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-[#8be6ff] underline underline-offset-2">{p}</a> : <span key={i}>{p}</span>))}</>;
}

function AlanGirisi({ a, v, set, hatali }: { a: GirdiAlani; v: unknown; set: (v: unknown) => void; hatali: boolean }) {
  const ad = a.etiket || a.ad;
  const ortak = { id: `alan-${a.ad}`, name: a.ad, "aria-invalid": hatali || undefined, required: a.zorunlu };
  const r = hatali ? "ring-rose-400/60" : "";
  switch (a.tur) {
    case "uzunMetin": return <textarea {...ortak} value={String(v ?? "")} onChange={(e) => set(e.target.value)} rows={5} maxLength={10_000} placeholder={a.yer} className={cn(ALAN, "resize-y py-3 leading-relaxed", r)} />;
    case "evet-hayir": {
      const on = v === true || v === "true";
      return (
        <button type="button" role="switch" aria-checked={on} aria-label={ad} onClick={() => set(!on)} className={cn("flex w-full items-center justify-between gap-3 rounded-[14px] bg-white/[0.04] px-4 py-3 text-left ring-1 ring-inset ring-white/[0.1]", r)}>
          <span className="text-[14.5px] text-white/85">{a.aciklama || "Evet"}</span>
          <span className={cn("relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors", on ? "bg-[#55d6fd]" : "bg-white/[0.16]")}><motion.span layout transition={yay} className={cn("absolute top-[3px] h-5 w-5 rounded-full bg-white", on ? "right-[3px]" : "left-[3px]")} /></span>
        </button>
      );
    }
    case "secim": {
      const l = a.secenekler ?? [];
      if (l.length > 8) return <select {...ortak} value={String(v ?? "")} onChange={(e) => set(e.target.value)} className={cn(ALAN, "h-12 appearance-none", r)}><option value="" className="bg-[#141416]">Seç</option>{l.map((x) => <option key={x} value={x} className="bg-[#141416]">{x}</option>)}</select>;
      return <div role="radiogroup" aria-label={ad} className="flex flex-wrap gap-2">{l.map((x) => { const on = v === x; return <button key={x} type="button" role="radio" aria-checked={on} onClick={() => set(on && !a.zorunlu ? "" : x)} className={cn("rounded-full px-4 py-2 text-[14px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/75 ring-1 ring-inset ring-white/[0.1] hover:text-white")}>{x}</button>; })}</div>;
    }
    case "coklu": {
      const sec = Array.isArray(v) ? (v as string[]) : [];
      return <div role="group" aria-label={ad} className="flex flex-wrap gap-2">{(a.secenekler ?? []).map((x) => { const on = sec.includes(x); return <button key={x} type="button" aria-pressed={on} onClick={() => set(on ? sec.filter((y) => y !== x) : [...sec, x])} className={cn("rounded-full px-4 py-2 text-[14px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/75 ring-1 ring-inset ring-white/[0.1] hover:text-white")}>{x}</button>; })}</div>;
    }
    default: {
      const tip = a.tur === "eposta" ? "email" : a.tur === "telefon" ? "tel" : a.tur === "sayi" ? "text" : a.tur === "tarih" ? "date" : "text";
      return <input {...ortak} type={tip} inputMode={a.tur === "sayi" ? "decimal" : a.tur === "telefon" ? "tel" : undefined} autoComplete={a.tur === "eposta" ? "email" : a.tur === "telefon" ? "tel" : undefined} value={String(v ?? "")} onChange={(e) => set(e.target.value)} maxLength={2000} placeholder={a.yer ?? (a.tur === "telefon" ? "0532 123 45 67" : a.tur === "eposta" ? "ad@ornek.com" : undefined)} className={cn(ALAN, "h-12 [color-scheme:dark]", r)} />;
    }
  }
}

export function FormSayfasi({ anahtar, t, test }: { anahtar: string; t: FormTanimi; test?: string }) {
  const alanlar = t.alanlar.filter((a) => a.tur !== "gizli");
  const [d, setD] = useState<Record<string, unknown>>({});
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState<{ metin: string; l: string[] } | null>(null);
  const [bitti, setBitti] = useState<{ mesaj?: string; sonuc?: string; suruyor?: boolean } | null>(null);
  const [web, setWeb] = useState("");
  const bas = useRef(0);
  const sorgu = useRef<Record<string, string>>({});
  useEffect(() => {
    bas.current = performance.now();
    const q = Object.fromEntries(new URLSearchParams(location.search).entries());
    delete q.test;
    sorgu.current = q;
    // Sorgu parametresiyle önceden doldurma (yalnız tanımlı alanlar).
    const on: Record<string, unknown> = {};
    for (const a of t.alanlar) { const x = q[a.ad]; if (x !== undefined) on[a.ad] = a.tur === "coklu" ? x.split(",").filter(Boolean) : a.tur === "evet-hayir" ? /^(1|true|evet)$/i.test(x) : x; else if (a.varsayilan && a.tur !== "gizli") on[a.ad] = a.tur === "coklu" ? a.varsayilan.split(",").map((y) => y.trim()) : a.tur === "evet-hayir" ? a.varsayilan === "true" : a.varsayilan; }
    setD(on);
  }, [t.alanlar]);
  const hataliMi = (a: GirdiAlani) => !!hata?.l.some((x) => x.startsWith(a.etiket || a.ad));
  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gidiyor) return;
    const eksik = alanlar.filter((a) => a.zorunlu && (d[a.ad] === undefined || d[a.ad] === "" || (Array.isArray(d[a.ad]) && !(d[a.ad] as unknown[]).length)));
    if (eksik.length) { setHata({ metin: "Zorunlu alanları doldur.", l: eksik.map((a) => `${a.etiket || a.ad} zorunlu`) }); document.getElementById(`alan-${eksik[0].ad}`)?.focus(); return; }
    setGidiyor(true); setHata(null);
    try {
      const r = await fetch(`/api/build/sistemler/form/${anahtar}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alanlar: d, _web: web, _t: Math.round(performance.now() - bas.current), sorgu: sorgu.current, ...(test ? { test } : {}) }) });
      const v = await r.json().catch(() => ({}));
      if (!r.ok || !v.ok) { setHata({ metin: v.hata ?? "Gönderilemedi; bağlantını denetleyip yeniden dene.", l: v.hatalar ?? [] }); return; }
      if (v.yonlendir) { location.href = v.yonlendir; return; }
      setBitti({ mesaj: v.mesaj, sonuc: v.sonuc, suruyor: v.suruyor });
      scrollTo({ top: 0, behavior: "smooth" });
    } catch { setHata({ metin: "Gönderilemedi; bağlantını denetleyip yeniden dene.", l: [] }); }
    finally { setGidiyor(false); }
  };
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0b0b0c] px-4 pb-16 pt-10 text-white sm:pt-16">
        <div className="mx-auto w-full max-w-[580px]">
          {t.test && <p className="mb-4 flex items-center gap-2 rounded-[14px] bg-amber-400/[0.08] px-4 py-2.5 text-[13px] text-amber-100 ring-1 ring-inset ring-amber-300/20"><FlaskConical className="h-4 w-4 shrink-0" />Deneme: taslak akış çalışır, gönderim düzenleyicide deneme verisi olur.</p>}
          <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6 px-1">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{t.baslik}</h1>
            {t.aciklama && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-white/60"><Metin metin={t.aciklama} /></p>}
          </motion.header>
          <AnimatePresence mode="wait">
            {!t.acik ? (
              <motion.div key="kapali" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] bg-[#141416] p-6 ring-1 ring-inset ring-white/[0.08]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-white/70"><Lock className="h-5 w-5" /></span>
                <p className="mt-4 text-[17px] font-semibold">Bu form şu an yanıt almıyor</p>
                <p className="mt-1 text-[14px] leading-relaxed text-white/55">Form sahibi formu kapatmış ya da henüz yayınlamamış. Daha sonra yeniden dene.</p>
              </motion.div>
            ) : bitti ? (
              <motion.div key="bitti" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={yay} className="rounded-[24px] bg-[#141416] p-6 ring-1 ring-inset ring-white/[0.08]">
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...yay, delay: 0.05 }} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd] text-black"><Check className="h-6 w-6" strokeWidth={2.6} /></motion.span>
                <p className="mt-4 whitespace-pre-wrap text-[18px] font-semibold leading-snug"><Metin metin={bitti.mesaj || "Teşekkürler, yanıtın alındı."} /></p>
                {bitti.sonuc && <div className="mt-4 rounded-[16px] bg-white/[0.04] p-4 text-[14.5px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.07]"><p className="whitespace-pre-wrap break-words"><Metin metin={bitti.sonuc} /></p></div>}
                {bitti.suruyor && <p className="mt-3 text-[13.5px] text-white/55">Yanıtın işleniyor; sonuç hazır olunca form sahibi seninle iletişime geçecek.</p>}
                {t.tekrar && <button type="button" onClick={() => { setBitti(null); setD({}); bas.current = performance.now(); }} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[14px] text-white hover:bg-white/[0.13]"><RotateCcw className="h-4 w-4" />Yeni yanıt gönder</button>}
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={gonder} noValidate initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-5 rounded-[24px] bg-[#141416] p-5 ring-1 ring-inset ring-white/[0.08] sm:p-6">
                {alanlar.map((a, i) => (
                  <motion.div key={a.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                    <label htmlFor={`alan-${a.ad}`} className="mb-2 flex items-baseline gap-2"><span className="text-[14.5px] font-medium text-white">{etiketi(a)}</span>{!a.zorunlu && <span className="text-[12.5px] text-white/40">isteğe bağlı</span>}</label>
                    <AlanGirisi a={a} v={d[a.ad]} set={(v) => { setD((x) => ({ ...x, [a.ad]: v })); if (hata) setHata((h) => (h ? { ...h, l: h.l.filter((y) => !y.startsWith(a.etiket || a.ad)) } : h)); }} hatali={hataliMi(a)} />
                    {a.aciklama && a.tur !== "evet-hayir" && <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">{a.aciklama}</p>}
                    {hata?.l.filter((x) => x.startsWith(a.etiket || a.ad)).map((x) => <p key={x} className="mt-1.5 text-[12.5px] text-rose-300">{x.slice((a.etiket || a.ad).length).trim().replace(/^./, (c) => c.toLocaleUpperCase("tr"))}</p>)}
                  </motion.div>
                ))}
                {!alanlar.length && <p className="text-[14px] text-white/55">Bu formda doldurulacak alan yok; göndermek yeterli.</p>}
                <input tabIndex={-1} autoComplete="off" aria-hidden value={web} onChange={(e) => setWeb(e.target.value)} name="web_sitesi" className="absolute -left-[9999px] h-px w-px opacity-0" />
                <AnimatePresence>{hata && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-4 py-3 text-[13.5px] text-rose-200 ring-1 ring-inset ring-rose-400/20"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{hata.metin}</motion.p>}</AnimatePresence>
                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={gidiyor} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black disabled:opacity-60 sm:w-auto sm:px-7">
                  {gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{gidiyor ? (t.bitis === "sonuc" ? "Hazırlanıyor" : "Gönderiliyor") : t.dugme}{!gidiyor && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
          <p className="mt-8 text-center text-[12.5px] text-white/35">Vayra Build ile hazırlandı. Bilgilerin yalnız bu formun sahibine iletilir.</p>
        </div>
      </div>
    </MotionConfig>
  );
}
