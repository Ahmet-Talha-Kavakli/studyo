"use client";

import { useState } from "react";
import {
  AudioLines, Check, Clock, Copy, Download, Drum, GitBranch, Guitar, Heart, Star, Quote, Layers, ListMusic, Maximize2, Mic, MoreHorizontal, Music2, Pause, Piano,
  Play, RefreshCw, Sparkles, Tags, Waves, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { type IkonRenk } from "@/components/studyo/hf";
import { Dalga, goreliZaman } from "@/components/studyo/ses/ortak";
import { sureBicim, type Parca } from "@/store/useMuzik";
import { bolumRengi, istemdenStiller, stilEtiketi } from "@/lib/muzikVeri";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { PlanSeridi } from "./BolumEditoru";
import { CalanCubuklar, Kapak } from "./ortak";
import { ParcaMenusu, modelKisa, parcaCal, turetmeAdi, type ParcaEylemleri } from "./ParcaSatiri";

export const kopyala = async (t: string, m: string) => {
  try { await navigator.clipboard.writeText(t); toast.success(m); } catch { mesaj.kopyalanamadi(); }
};

/* ── Kanal (stem / videodan müziğin müzik + efekt kanalları) ── */
const KANAL: [RegExp, string, LucideIcon, IkonRenk][] = [
  [/vocal|vokal|voice/i, "Vokal", Mic, "gul"],
  [/drum|davul|perc/i, "Davul", Drum, "kehribar"],
  [/bass|bas\b/i, "Bas", Guitar, "mor"],
  [/sfx|effect|efekt/i, "Efekt", Waves, "yesil"],
  [/music|muzik|müzik|instrumental/i, "Müzik", Music2, "cyan"],
  [/other|diğer|diger|piano|keys/i, "Diğer", Piano, "gok"],
];
export const kanalBilgi = (ad: string) => {
  const k = KANAL.find(([r]) => r.test(ad));
  return k ? { ad: k[1], ikon: k[2], renk: k[3] } : { ad: ad.replace(/[_-]+/g, " "), ikon: AudioLines, renk: "cyan" as IkonRenk };
};

/** Kanal satırları: renkli ikon kutusu = çal/duraklat, ad, ince ilerleme, indir. */
export function KanalListesi({ p }: { p: Parca }) {
  const cal = useCalici();
  if (!p.stemler?.length) return null;
  return (
    <div className="space-y-1.5">
      {p.stemler.map((s) => {
        const id = `${p.id}-stem-${s.ad}`;
        const benim = cal.id === id;
        const c = benim && cal.calisiyor;
        const k = kanalBilgi(s.ad);
        const I = k.ikon;
        const uzanti = s.url.match(/\.([a-z0-9]{2,4})$/i)?.[1] ?? "mp3";
        return (
          <div key={s.url} className="relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-black/20 p-1.5 pr-2 ring-1 ring-inset ring-white/[0.06]">
            <button onClick={() => (c ? sesCalici.duraklat() : void sesCalici.cal(id, { tur: "dosya", url: s.url }))} aria-label={c ? `${k.ad} duraklat` : `${k.ad} çal`}
              className="group/k relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin-2">
              <I className={cn("h-4 w-4 transition-opacity", c ? "opacity-0" : "group-hover/k:opacity-0")} />
              <span className={cn("absolute inset-0 flex items-center justify-center transition-opacity", c ? "opacity-100" : "opacity-0 group-hover/k:opacity-100")}>
                {c ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
              </span>
            </button>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-metin">{k.ad}{c && <CalanCubuklar />}</span>
              <span className="block truncate text-[11.5px] text-metin-3">{s.ad} · {uzanti}</span>
            </span>
            <a href={s.url} download={`${p.ad} - ${k.ad}.${uzanti}`} aria-label={`${k.ad} indir`} className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin"><Download className="h-3.5 w-3.5" /></a>
            {benim && cal.toplam > 0 && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.065]"><span className="block h-full bg-aksan" style={{ width: `${(cal.an / cal.toplam) * 100}%` }} /></span>}
          </div>
        );
      })}
    </div>
  );
}

/** Sözler: plan bölümleri varsa renkli bölüm başlıklarıyla, yoksa [Etiket] satırları renkli. */
export function SozGorunumu({ p, buyuk }: { p: Parca; buyuk?: boolean }) {
  const bolumler = p.plan?.bolumler.filter((b) => b.satirlar.some((s) => s.trim())) ?? [];
  const metin = buyuk ? "text-[14px] leading-7" : "text-[13.5px] leading-relaxed";
  if (bolumler.length) return (
    <div className="space-y-3">
      {bolumler.map((b) => {
        const r = bolumRengi(b.ad);
        return (
          <div key={b.id} className="relative pl-3">
            <span className="absolute inset-y-1 left-0 w-[3px] rounded-full" style={{ background: r }} />
            <span className="inline-flex rounded-md px-1.5 py-px text-[10.5px] font-bold" style={{ color: r, background: `color-mix(in srgb, ${r} 14%, transparent)` }}>{b.ad}</span>
            <p className={cn("mt-1 whitespace-pre-wrap text-metin", metin)}>{b.satirlar.join("\n")}</p>
          </div>
        );
      })}
    </div>
  );
  return (
    <p className={cn("whitespace-pre-wrap text-metin", metin)}>
      {p.sozler.trim().split(/(\[[^\]\n]*\])/g).map((t, i) => {
        if (!/^\[[^\]\n]*\]$/.test(t)) return <span key={i}>{t}</span>;
        const r = bolumRengi(t.slice(1, -1));
        return <span key={i} className="rounded-md px-1 text-[12px] font-bold" style={{ color: r, background: `color-mix(in srgb, ${r} 14%, transparent)` }}>{t.slice(1, -1)}</span>;
      })}
    </p>
  );
}
export const sozMetni = (p: Parca) => {
  const b = p.plan?.bolumler.filter((x) => x.satirlar.some((s) => s.trim())) ?? [];
  return b.length ? b.map((x) => `[${x.ad}]\n${x.satirlar.join("\n")}`).join("\n\n") : p.sozler;
};

/** Sürüm ağacı: kapaklı satırlar, v rozeti, türetme çipi, seçili camgöbeği. */
export function SurumListesi({ p, soy, onSec }: { p: Parca; soy: Parca[]; onSec: (id: string) => void }) {
  return (
    <div className="space-y-1">
      {soy.map((s) => {
        const sec = s.id === p.id;
        return (
          <button key={s.id} onClick={() => onSec(s.id)} aria-current={sec}
            className={cn("flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors", sec ? "bg-white/[0.085] ring-2 ring-inset ring-white" : "hover:bg-white/[0.065]")}>
            <Kapak src={s.kapak} boyut={32} yuvarlak={8} />
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{s.ad}</span>
              <span className="block truncate text-[10.5px] text-metin-3">{turetmeAdi(s) ?? "İlk sürüm"} · {goreliZaman(s.olusturma)}</span>
            </span>
            <span className="bg-white/[0.075] rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-metin-2">v{s.surum}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Eylemler: tek satırda yuvarlak düğmeler (simge + ad). */
export function EylemIzgarasi({ p, e, haric = [] }: { p: Parca; e: ParcaEylemleri; sutun?: 2 | 3; haric?: string[] }) {
  const bitti = p.durum === "tamam";
  const l = ([
    [ListMusic, "Yeniden kullan", e.onYenidenKullan, true],
    [RefreshCw, "Varyasyon", e.onVaryasyon, bitti],
    [GitBranch, "Bölümler", e.onPlan, !!e.onPlan && bitti],
    [Layers, "Kanallar", e.onStem, !!e.onStem && bitti],
    [Download, "İndir", e.onIndir, bitti],
  ] as const).filter((x) => x[3] && !haric.includes(x[1]));
  return (
    <div className="grid grid-cols-2 gap-1.5 [&>*:last-child:nth-child(odd)]:col-span-2">
      {l.map(([I, ad, fn]) => (
        <button key={ad} onClick={() => fn?.()} className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.065] px-2 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.1] active:scale-[0.97]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-metin-2"><I className="h-3.5 w-3.5" /></span>{ad}
        </button>
      ))}
    </div>
  );
}

/** Panel bölümü: başlık satırı + içerik, bölümler ince çizgiyle ayrılır. */
export function PBolum({ baslik, ikon, sag, children }: { baslik: string; ikon?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[40px] items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-metin"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.085] text-metin-2">{ikon}</span>{baslik}</span>
        {sag}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}
/** Tek satırlık demo notu. */
export const DemoNotu = ({ metin }: { metin: string }) => <p className="rounded-[12px] bg-amber-300/[0.06] px-3 py-2 text-[12.5px] leading-snug text-amber-100/80 ring-1 ring-inset ring-amber-300/15">{metin}</p>;

/**
 * Seçili şarkı paneli (oluşturma sayfasının üçüncü sütunu): büyük kapak + çal, ad ve ikonlu cam
 * çipler, dalga ve süre, eylem kartları, stil / yapı / sözler / kanallar / sürümler kart bölümleri.
 * Tam ayrıntı "Ayrıntılar" ile açılır.
 */
export function ParcaPaneli({ p, soy, onSec, ...e }: { p: Parca; soy?: Parca[]; onSec?: (id: string) => void } & ParcaEylemleri) {
  const cal = useCalici();
  const [menu, setMenu] = useState(false);
  const benim = cal.id === p.id;
  const calisiyor = benim && cal.calisiyor;
  const oran = benim && cal.toplam ? cal.an / cal.toplam : 0;
  const bitti = p.durum === "tamam";
  const demo = bitti && !p.sesUrl;
  const sozVar = !p.enstrumantal && !!sozMetni(p).trim();
  const stiller = p.stiller?.length ? p.stiller : istemdenStiller(p.istem, 6);
  const toplam = benim && cal.toplam ? cal.toplam : p.sure;
  const cip = "inline-flex items-center gap-1 text-[12.5px] text-metin-3";

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 [scrollbar-width:thin]">
      <div className="group relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-white/[0.055] ring-1 ring-inset ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.kapak && <img src={p.kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s]", calisiyor && "scale-[1.05]")} />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 flex gap-1">
          {p.varyantEtiketi && <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10.5px] font-bold text-white ring-1 ring-white/15">{p.varyantEtiketi}</span>}
          {(p.surum > 1 || turetmeAdi(p)) && <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10.5px] font-semibold text-white ring-1 ring-white/15">v{p.surum}</span>}
        </span>
        <span className="absolute right-3 top-3">
          <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Diğer eylemler" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/15 hover:bg-black/70"><MoreHorizontal className="h-4 w-4" /></button>
          <ParcaMenusu p={p} e={e} acik={menu} onKapat={() => setMenu(false)} />
        </span>
        <button onClick={() => bitti && void parcaCal(p)} disabled={!bitti} aria-label={calisiyor ? "Duraklat" : "Çal"}
          className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0b0c0e] transition-transform hover:scale-105 disabled:opacity-50">
          {calisiyor ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
        </button>
        <span className="absolute bottom-4 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white ring-1 ring-white/15">{benim && cal.toplam ? `${sureBicim(cal.an)} / ${sureBicim(cal.toplam)}` : sureBicim(p.sure)}</span>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[19px] font-semibold leading-tight tracking-[-0.02em] text-metin">{p.ad}</h3>
        <button onClick={e.onBegen} disabled={!bitti} aria-pressed={p.begeni === 1} title={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"} aria-label={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"}
          className={cn("bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40", p.begeni === 1 ? "!text-aksan" : "text-metin-2 hover:text-metin")}>
          <Star className={cn("h-4 w-4", p.begeni === 1 && "fill-current")} />
        </button>
        <button onClick={e.onAc} aria-label="Ayrıntılar" title="Ayrıntılar" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin"><Maximize2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        <span className={cip}><ModelLogo ad={p.model} boyut={12} />{modelKisa(p.model)}</span>
        <span className={cn(cip, "tabular-nums")}><Clock className="h-3 w-3" />{sureBicim(toplam)}</span>
        <span className={cip}>{p.enstrumantal ? <Piano className="h-3 w-3" /> : <Mic className="h-3 w-3" />}{p.enstrumantal ? "Enstrümantal" : "Vokal"}</span>
        <span className={cip}>{goreliZaman(p.olusturma)}</span>
      </div>

      {bitti && (
        <div className="bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] mt-3 rounded-xl px-3 py-2.5">
          <Dalga url={p.sesUrl} tohum={p.id} n={56} oran={oran} sus={demo} toplamSn={toplam} className="h-10"
            onKonum={(o) => { if (benim && cal.toplam) sesCalici.konum(o * cal.toplam); else void parcaCal(p); }} />
          <div className="mt-1 flex justify-between text-[10.5px] tabular-nums text-metin-3"><span>{sureBicim(benim ? cal.an : 0)}</span><span>{sureBicim(toplam)}</span></div>
        </div>
      )}

      <div className="mt-3"><EylemIzgarasi p={p} e={e} /></div>

      <div className="mt-4 space-y-3">
        {stiller.length > 0 && (
          <PBolum baslik="Stil" ikon={<Tags className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {stiller.map((s) => <span key={s} className="rounded-full bg-white/[0.085] px-2.5 py-1 text-[12px] text-metin">{stilEtiketi(s)}</span>)}
              {p.haric?.map((s) => <span key={s} className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11.5px] text-rose-200 ring-1 ring-inset ring-rose-400/25">− {stilEtiketi(s)}</span>)}
            </div>
          </PBolum>
        )}
        {p.plan && p.plan.bolumler.length > 0 && (
          <PBolum baslik="Yapı" ikon={<GitBranch className="h-3.5 w-3.5" />} sag={<span className="text-[12px] tabular-nums text-metin-3">{p.plan.bolumler.length} bölüm</span>}>
            <PlanSeridi plan={p.plan} yukseklik={40} />
          </PBolum>
        )}
        {p.stemler?.length ? <PBolum baslik="Kanallar" ikon={<Layers className="h-3.5 w-3.5" />}><KanalListesi p={p} /></PBolum> : null}
        <PBolum baslik={sozVar ? "Sözler" : "İstem"} ikon={sozVar ? <Mic className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          sag={(sozVar || p.istem) ? <button onClick={() => kopyala(sozVar ? sozMetni(p) : p.istem, sozVar ? "Sözler kopyalandı" : "İstem kopyalandı")} aria-label="Kopyala" className="bg-white/[0.075] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] flex h-7 w-7 items-center justify-center rounded-full text-metin-3 hover:text-metin"><Copy className="h-3.5 w-3.5" /></button> : undefined}>
          {sozVar ? <SozGorunumu p={p} /> : <p className="text-[13.5px] leading-relaxed text-metin-2">{p.istem || "İstem yok, yalnız stillerle üretildi."}</p>}
        </PBolum>
        {soy && onSec && soy.length > 1 && (
          <PBolum baslik="Sürümler" ikon={<GitBranch className="h-3.5 w-3.5" />}><SurumListesi p={p} soy={soy} onSec={onSec} /></PBolum>
        )}
      </div>
    </div>
  );
}
