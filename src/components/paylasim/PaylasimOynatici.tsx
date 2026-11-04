"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, Link2, Code2, Check, Sparkles, AudioLines, Music2, ShieldCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Paylasim } from "@/lib/paylasim";
import { mesaj } from "@/lib/mesaj";

const sure = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** Paylaşılan ses/müzik oynatıcısı. `gomulu` iframe içinde sade çubuk olarak çizer. */
export function PaylasimOynatici({ k, gomulu }: { k: Paylasim; gomulu?: boolean }) {
  const ses = useRef<HTMLAudioElement>(null);
  const [calar, setCalar] = useState(false);
  const [t, setT] = useState(0);
  const [toplam, setToplam] = useState(0);
  const [kopya, setKopya] = useState<null | "link" | "gom">(null);
  const renk = k.renk ?? "#55d6fd";
  // Sabit, kimlikten türeyen dalga (her açılışta aynı).
  const cubuklar = useMemo(() => {
    let h = [...k.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
    return Array.from({ length: gomulu ? 56 : 72 }, () => { h = (h * 1103515245 + 12345) >>> 0; return 0.25 + ((h >>> 8) % 1000) / 1333; });
  }, [k.id, gomulu]);

  useEffect(() => {
    const a = ses.current; if (!a) return;
    const z = () => setT(a.currentTime), d = () => setToplam(a.duration), c = () => setCalar(true), p = () => setCalar(false);
    a.addEventListener("timeupdate", z); a.addEventListener("loadedmetadata", d); a.addEventListener("play", c); a.addEventListener("pause", p); a.addEventListener("ended", p);
    return () => { a.removeEventListener("timeupdate", z); a.removeEventListener("loadedmetadata", d); a.removeEventListener("play", c); a.removeEventListener("pause", p); a.removeEventListener("ended", p); };
  }, []);

  const oran = toplam ? t / toplam : 0;
  const cal = () => { const a = ses.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); };
  const sar = (x: number) => { const a = ses.current; if (a && toplam) a.currentTime = Math.max(0, Math.min(toplam, x * toplam)); };
  const kopyala = (ne: "link" | "gom") => {
    const adres = `${location.origin}/p/${k.id}`;
    const metin = ne === "link" ? adres : `<iframe src="${adres}/embed" width="100%" height="96" style="border:0;border-radius:16px" allow="autoplay" title="${k.baslik.replace(/"/g, "")}"></iframe>`;
    void navigator.clipboard.writeText(metin).then(() => { setKopya(ne); setTimeout(() => setKopya(null), 1800); mesaj.kopyalandi(ne === "link" ? "Bağlantı" : "Gömme kodu"); }, () => mesaj.kopyalanamadi());
  };
  const I = k.tur === "muzik" ? Music2 : AudioLines;

  const ilerleme = (
    <div role="slider" tabIndex={0} aria-label="Konum" aria-valuemin={0} aria-valuemax={Math.round(toplam)} aria-valuenow={Math.round(t)} aria-valuetext={`${sure(t)} / ${sure(toplam)}`}
      onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); sar((e.clientX - r.left) / r.width); }}
      onKeyDown={(e) => { const a = ses.current; if (!a) return; if (e.key === "ArrowRight") a.currentTime += 5; else if (e.key === "ArrowLeft") a.currentTime -= 5; else if (e.key === " ") { e.preventDefault(); cal(); } }}
      className="flex h-12 flex-1 cursor-pointer items-center gap-[3px] rounded-md outline-none focus-visible:ring-1 focus-visible:ring-aksan">
      {cubuklar.map((y, i) => (
        <span key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${y * 100}%`, background: i / cubuklar.length <= oran ? renk : "rgba(255,255,255,0.16)" }} />
      ))}
    </div>
  );
  const calDugmesi = (b: number) => (
    <button onClick={cal} aria-label={calar ? "Duraklat" : "Çal"} className="flex shrink-0 items-center justify-center rounded-full text-zemin transition-transform hover:scale-105"
      style={{ width: b, height: b, background: renk, boxShadow: `0 0 28px -4px ${renk}` }}>
      {calar ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
    </button>
  );

  if (gomulu) return (
    <div className="flex h-[96px] items-center gap-3 rounded-2xl border border-kenar bg-yuzey px-3">
      <audio ref={ses} src={k.url} preload="metadata" />
      {calDugmesi(52)}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-metin">{k.baslik}</span>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-metin-3">{sure(t)} / {sure(toplam)}</span>
        </div>
        <div className="h-9">{ilerleme}</div>
      </div>
      <a href={`/p/${k.id}`} target="_blank" rel="noreferrer" className="hidden shrink-0 items-center gap-1 rounded-full border border-kenar px-2.5 py-1 text-[11px] font-semibold text-metin-2 hover:text-metin sm:flex"><Sparkles className="h-3 w-3 text-aksan" />Vayra</a>
    </div>
  );

  // Karaoke: çalan kelime vurgulanır, kelimeye tıklayınca oraya sarılır.
  const kelimeler = k.kelimeler ?? [];
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zemin px-4 py-10">
      <audio ref={ses} src={k.url} preload="metadata" />
      <div className="hf-kart relative w-full max-w-[640px] overflow-hidden rounded-[28px] bg-yuzey">
        <span className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(420px 240px at 50% 0%, color-mix(in srgb, ${renk} 22%, transparent), transparent 70%)` }} />
        <div className="relative flex flex-col items-center px-6 pb-6 pt-9 text-center">
          {k.kapak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={k.kapak} alt="" className="h-40 w-40 rounded-3xl object-cover ring-1 ring-white/10" />
          ) : (
            <span className="h-32 w-32 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${renk} 45%, #0b0b0f 100%)`, boxShadow: `0 0 60px -10px ${renk}` }} />
          )}
          <span className="glass-cip mt-6 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-metin-2"><I className="h-3.5 w-3.5 text-aksan" />{k.tur === "muzik" ? "Müzik" : "Ses"}</span>
          <h1 className="mt-3 text-[26px] font-bold leading-tight text-metin">{k.baslik}</h1>
          {k.alt && <p className="mt-1 text-[13.5px] text-metin-3">{k.alt}</p>}
          <div className="panel-ic mt-6 flex w-full items-center gap-3 rounded-2xl p-3">
            {calDugmesi(56)}
            {ilerleme}
            <span className="w-[74px] shrink-0 text-right text-[11.5px] tabular-nums text-metin-3">{sure(t)} / {sure(toplam)}</span>
          </div>
          {(kelimeler.length > 0 || k.metin) && (
            <div className="panel-ic mt-3 max-h-[260px] w-full overflow-y-auto rounded-2xl p-4 text-left text-[15px] leading-7 text-metin-2 [scrollbar-width:thin]">
              {kelimeler.length ? kelimeler.map((w, i) => (
                <button key={i} onClick={() => { const a = ses.current; if (a) { a.currentTime = w.b; void a.play(); } }}
                  className={cn("rounded px-0.5 transition-colors", t >= w.b && t < w.s ? "bg-aksan/20 text-metin" : t >= w.s ? "text-metin" : "hover:text-metin")}>{w.k}{" "}</button>
              )) : <p className="whitespace-pre-wrap">{k.metin}</p>}
            </div>
          )}
          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            <button onClick={() => kopyala("link")} className="hf-btn glass-cip flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] text-metin">{kopya === "link" ? <Check className="h-4 w-4 text-aksan" /> : <Link2 className="h-4 w-4" />}{kopya === "link" ? "Kopyalandı" : "Bağlantı"}</button>
            <button onClick={() => kopyala("gom")} className="hf-btn glass-cip flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] text-metin">{kopya === "gom" ? <Check className="h-4 w-4 text-aksan" /> : <Code2 className="h-4 w-4" />}{kopya === "gom" ? "Kopyalandı" : "Göm"}</button>
            <a href={k.url} download className="hf-btn glass-cip flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] text-metin"><Download className="h-4 w-4" />İndir</a>
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-[11.5px] text-metin-3"><ShieldCheck className="h-3.5 w-3.5" /> Yapay zekâ ile üretilmiştir · Vayra</p>
        </div>
        <Link href={k.tur === "muzik" ? "/panel/muzik" : "/panel/ses"} className="hf-cta relative mx-6 mb-6 flex items-center justify-center gap-2 py-3 text-[14.5px]">
          <Sparkles className="h-4 w-4" /> Vayra&apos;da kendi {k.tur === "muzik" ? "şarkını" : "sesini"} üret
        </Link>
      </div>
    </div>
  );
}
