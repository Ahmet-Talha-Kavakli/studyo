"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Scissors, Copy, Trash2, FlipHorizontal2, FlipVertical2, Gauge, AudioLines, Maximize, Minimize, Droplets, ChevronDown, Monitor, Smartphone, Square, RectangleVertical,
  Plus, Minus, Palette, Snowflake, Volume2, Music2, Film, Image as ImageIcon, Type as TypeIcon, Check, SunMedium,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { useMontaj, klipSure, type MontajProje, type MontajKlip, type MontajOran, type MetinStil } from "@/store/useMontaj";
import { sesiAyir, kareDondur, tumKlipler } from "./ortak";

const ORANLAR: { oran: MontajOran; ad: string; alt: string; ikon: typeof Monitor }[] = [
  { oran: "16:9", ad: "Yatay", alt: "YouTube · sunum", ikon: Monitor }, { oran: "9:16", ad: "Dikey", alt: "TikTok · Reels · Shorts", ikon: Smartphone },
  { oran: "1:1", ad: "Kare", alt: "Gönderi · reklam", ikon: Square }, { oran: "4:5", ad: "Portre", alt: "Instagram akışı", ikon: RectangleVertical },
];
const RENKLER = ["#ffffff", "#000000", "#55d6fd", "#facc15", "#f472b6", "#a3e635", "#f97316"];
const STILLER: [MetinStil, string][] = [["baslik", "Başlık"], ["altyazi", "Altyazı"], ["tiktok", "TikTok"], ["karaoke", "Karaoke"], ["neon", "Neon"], ["sinematik", "Sinematik"], ["etiket", "Etiket"], ["alinti", "Alıntı"]];

/** Önizlemenin altında, seçime göre değişen hızlı eylem çubuğu. */
export function MontajBaglam({ proje, havuzKare }: { proje: MontajProje; havuzKare: () => string | null }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const playhead = useMontaj((s) => s.playhead);
  const k = tumKlipler(proje).find((x) => x.id === seciliId) ?? null;
  const st = useMontaj.getState;
  const [menu, setMenu] = useState<null | "oran" | "hiz" | "renk" | "stil" | "arka" | "ses">(null);
  const g = (patch: Partial<MontajKlip>) => { st().anlikKaydet(proje.id); st().klipGuncelle(proje.id, k!.id, patch); };
  const ib = "flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-2 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin disabled:pointer-events-none disabled:opacity-30";
  const ayrac = <span className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />;
  const icinde = !!k && playhead > k.baslangic + 0.1 && playhead < k.baslangic + klipSure(k) - 0.1;
  const Pop = ({ id, children, gen = 220 }: { id: typeof menu; children: React.ReactNode; gen?: number }) => (
    <AnimatePresence>
      <Yuzen acik={menu === id} onKapat={() => setMenu(null)} yerlesim="ust-orta" bosluk={8} className="rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5" style={{ width: gen }}>{children}</Yuzen>
    </AnimatePresence>
  );

  return (
    <div className="mt-2.5 flex h-11 shrink-0 items-center justify-center px-2">
      <div className="gizli-scroll flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-white/[0.065] p-1 ring-1 ring-inset ring-white/[0.07]">
        {!k ? (
          <>
            <div className="relative">
              <button onClick={() => setMenu(menu === "oran" ? null : "oran")} className={cn(ib, "text-metin")}>
                {(() => { const I = ORANLAR.find((x) => x.oran === proje.enBoy)?.ikon ?? Monitor; return <I className="h-4 w-4" />; })()} {proje.enBoy} <ChevronDown className="h-3.5 w-3.5 text-metin-3" />
              </button>
              <Pop id="oran" gen={240}>
                {ORANLAR.map((o) => (
                  <button key={o.oran} onClick={() => { st().projeGuncelle(proje.id, { enBoy: o.oran }); setMenu(null); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left hover:bg-white/[0.06]", proje.enBoy === o.oran && "bg-white/[0.065]")}>
                    <o.ikon className={cn("h-4 w-4 shrink-0", proje.enBoy === o.oran ? "text-aksan" : "text-metin-2")} />
                    <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{o.ad} · {o.oran}</span><span className="block text-[11px] text-metin-3">{o.alt}</span></span>
                    {proje.enBoy === o.oran && <Check className="h-4 w-4 text-aksan" />}
                  </button>
                ))}
              </Pop>
            </div>
            {ayrac}
            <div className="relative">
              <button onClick={() => setMenu(menu === "arka" ? null : "arka")} className={ib}><span className="h-4 w-4 rounded-full ring-1 ring-white/30" style={{ background: proje.arkaRenk ?? "#000" }} /> <span className="whitespace-nowrap">Arka plan</span></button>
              <Pop id="arka" gen={212}>
                <div className="flex flex-wrap gap-2 p-1.5">
                  {["#000000", "#111827", "#ffffff", "#0e7490", "#7c3aed", "#be185d", "#f59e0b", "#16a34a"].map((c) => (
                    <button key={c} onClick={() => st().projeGuncelle(proje.id, { arkaRenk: c })} aria-label={c} className={cn("h-7 w-7 rounded-full ring-1 ring-inset ring-white/15", (proje.arkaRenk ?? "#000000") === c && "outline outline-2 outline-offset-2 outline-aksan")} style={{ background: c }} />
                  ))}
                </div>
              </Pop>
            </div>
          </>
        ) : (
          <>
            <span className="flex max-w-[160px] items-center gap-1.5 truncate px-2 text-[12px] font-semibold text-metin">
              {k.tur === "video" ? <Film className="h-3.5 w-3.5 text-sky-300" /> : k.tur === "gorsel" ? <ImageIcon className="h-3.5 w-3.5 text-sky-300" /> : k.tur === "ses" ? <Music2 className="h-3.5 w-3.5 text-emerald-300" /> : <TypeIcon className="h-3.5 w-3.5 text-amber-300" />}
              <span className="truncate">{k.ad}</span>
            </span>
            {ayrac}
            <Tooltip label="Oynatma çizgisinde böl · S"><button onClick={() => { st().klipBol(proje.id, k.id, playhead); }} disabled={!icinde} className={ib}><Scissors className="h-4 w-4" /></button></Tooltip>
            <Tooltip label="Çoğalt · Ctrl+D"><button onClick={() => st().klipCogalt(proje.id, k.id)} className={ib}><Copy className="h-4 w-4" /></button></Tooltip>
            {(k.tur === "video" || k.tur === "gorsel") && (
              <>
                {ayrac}
                {([["doldur", Maximize, "Doldur"], ["sigdir", Minimize, "Sığdır"], ["bulanik", Droplets, "Bulanık arka plan"]] as const).map(([m, I, a]) => (
                  <Tooltip key={m} label={a}><button onClick={() => g({ sigdir: m })} aria-pressed={(k.sigdir ?? "doldur") === m} className={cn(ib, (k.sigdir ?? "doldur") === m && "bg-white/[0.1] text-metin")}><I className="h-4 w-4" /></button></Tooltip>
                ))}
                {ayrac}
                <Tooltip label="Yatay aynala"><button onClick={() => g({ aynaX: !k.aynaX })} aria-pressed={!!k.aynaX} className={cn(ib, k.aynaX && "bg-white/[0.1] text-white")}><FlipHorizontal2 className="h-4 w-4" /></button></Tooltip>
                <Tooltip label="Dikey aynala"><button onClick={() => g({ aynaY: !k.aynaY })} aria-pressed={!!k.aynaY} className={cn(ib, k.aynaY && "bg-white/[0.1] text-white")}><FlipVertical2 className="h-4 w-4" /></button></Tooltip>
              </>
            )}
            {(k.tur === "video" || k.tur === "ses") && (
              <div className="relative">
                <Tooltip label="Hız"><button onClick={() => setMenu(menu === "hiz" ? null : "hiz")} className={cn(ib, k.hiz !== 1 && "text-amber-200")}><Gauge className="h-4 w-4" />{k.hiz !== 1 && <span className="tabular-nums">{k.hiz}×</span>}</button></Tooltip>
                <Pop id="hiz" gen={236}>
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((h) => (
                      <button key={h} onClick={() => { g({ hiz: h }); setMenu(null); }} className={cn("rounded-[8px] py-1.5 text-[12.5px] font-medium tabular-nums", k.hiz === h ? "bg-white text-[#0b0c0e]" : "bg-white/[0.065] text-metin hover:bg-white/[0.1]")}>{h}×</button>
                    ))}
                  </div>
                </Pop>
              </div>
            )}
            {k.tur === "video" && (
              <>
                <Tooltip label="Sesi ayrı katmana ayır"><button onClick={() => sesiAyir(proje.id, k.id)} disabled={k.sesDuzey === 0} className={ib}><AudioLines className="h-4 w-4" /></button></Tooltip>
                <Tooltip label="Kareyi dondur (2 sn)"><button onClick={() => { const kare = havuzKare(); if (kare) void kareDondur(proje.id, k.id, kare); }} disabled={!icinde} className={ib}><Snowflake className="h-4 w-4" /></button></Tooltip>
              </>
            )}
            {(k.tur === "ses" || k.tur === "video") && (
              <Tooltip label={k.sesIyilestir ? "Ses iyileştirme açık" : "Sesi iyileştir (gürültü kes, netleştir)"}><button onClick={() => g({ sesIyilestir: !k.sesIyilestir })} aria-pressed={!!k.sesIyilestir} className={cn(ib, k.sesIyilestir && "text-aksan")}><SunMedium className="h-4 w-4" /></button></Tooltip>
            )}
            {(k.tur === "ses" || k.tur === "video") && (
              <div className="relative">
                <Tooltip label="Ses düzeyi"><button onClick={() => setMenu(menu === "ses" ? null : "ses")} className={cn(ib, k.sesDuzey === 0 && "text-amber-200")}><Volume2 className="h-4 w-4" /><span className="text-[12px] tabular-nums">{k.sesDuzey}</span></button></Tooltip>
                <Pop id="ses" gen={220}>
                  <label className="flex items-center gap-2.5 px-2 py-2 text-metin-2">
                    <Volume2 className="h-4 w-4 shrink-0" />
                    <input type="range" min={0} max={100} value={k.sesDuzey} onChange={(e) => st().klipGuncelle(proje.id, k.id, { sesDuzey: Number(e.target.value) })} aria-label="Ses düzeyi" className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--color-aksan)]" autoFocus />
                    <span className="w-8 text-right text-[12px] tabular-nums text-metin">{k.sesDuzey}</span>
                  </label>
                </Pop>
              </div>
            )}
            {k.tur === "metin" && !k.oge && (
              <>
                {ayrac}
                <div className="relative">
                  <button onClick={() => setMenu(menu === "stil" ? null : "stil")} className={ib}><TypeIcon className="h-4 w-4" /> {STILLER.find(([s]) => s === (k.metinStil ?? "altyazi"))?.[1] ?? "Stil"} <ChevronDown className="h-3 w-3" /></button>
                  <Pop id="stil" gen={200}>
                    {STILLER.map(([s, a]) => (
                      <button key={s} onClick={() => { g({ metinStil: s }); setMenu(null); }} className="flex w-full items-center justify-between rounded-[9px] px-2.5 py-1.5 text-left text-[13px] text-metin hover:bg-white/[0.06]">{a}{(k.metinStil ?? "altyazi") === s && <Check className="h-3.5 w-3.5 text-aksan" />}</button>
                    ))}
                  </Pop>
                </div>
                <Tooltip label="Küçült"><button onClick={() => g({ metinBoyut: Math.max(12, (k.metinBoyut ?? 42) - 6) })} className={ib}><Minus className="h-4 w-4" /></button></Tooltip>
                <span className="w-7 text-center text-[12px] tabular-nums text-metin">{k.metinBoyut ?? 42}</span>
                <Tooltip label="Büyüt"><button onClick={() => g({ metinBoyut: Math.min(200, (k.metinBoyut ?? 42) + 6) })} className={ib}><Plus className="h-4 w-4" /></button></Tooltip>
                <div className="relative">
                  <Tooltip label="Renk"><button onClick={() => setMenu(menu === "renk" ? null : "renk")} className={ib}><span className="h-4 w-4 rounded-full ring-1 ring-white/30" style={{ background: k.metinRenk ?? "#fff" }} /></button></Tooltip>
                  <Pop id="renk" gen={196}>
                    <div className="flex flex-wrap gap-2 p-1.5">
                      {RENKLER.map((c) => <button key={c} onClick={() => g({ metinRenk: c })} aria-label={c} className={cn("h-7 w-7 rounded-full ring-1 ring-inset ring-white/15", k.metinRenk === c && "outline outline-2 outline-offset-2 outline-aksan")} style={{ background: c }} />)}
                    </div>
                  </Pop>
                </div>
              </>
            )}
            {k.oge && k.oge.tip !== "logo" && (
              <div className="relative">
                <Tooltip label="Renk"><button onClick={() => setMenu(menu === "renk" ? null : "renk")} className={ib}><Palette className="h-4 w-4" /><span className="h-4 w-4 rounded-full ring-1 ring-white/30" style={{ background: k.oge.renk }} /></button></Tooltip>
                <Pop id="renk" gen={196}>
                  <div className="flex flex-wrap gap-2 p-1.5">
                    {RENKLER.map((c) => <button key={c} onClick={() => g({ oge: { ...k.oge!, renk: c } })} aria-label={c} className={cn("h-7 w-7 rounded-full ring-1 ring-inset ring-white/15", k.oge!.renk === c && "outline outline-2 outline-offset-2 outline-aksan")} style={{ background: c }} />)}
                  </div>
                </Pop>
              </div>
            )}
            {ayrac}
            <Tooltip label="Sil · Delete"><button onClick={() => { st().klipSil(proje.id, k.id); toast("Klip silindi", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } }); }} className={cn(ib, "hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button></Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
