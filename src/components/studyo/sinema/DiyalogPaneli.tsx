"use client";

/* Sinema komut kutusunun Diyalog menüsü: replik kartları (konuşan, ton menüsü, metin),
   dil seçici, konuşma süresi ve simgeli ses/ortam karoları. */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown, CloudRain, MessageSquareQuote, Music, Plus, Sparkles, Users, VolumeX, Waves, Wind, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";

export type DiyalogSatiri = { id: string; kim: string; metin: string; ton: string };

const TONLAR: [string, string, string][] = [
  ["dogal", "Doğal", "Günlük konuşma"], ["sakin", "Sakin", "Yavaş ve yumuşak"], ["heyecanli", "Heyecanlı", "Hızlı, enerjik"],
  ["fisilti", "Fısıltı", "Alçak sesle"], ["ofkeli", "Öfkeli", "Sert ve yüksek"], ["huzunlu", "Hüzünlü", "Kırık, ağır"], ["neseli", "Neşeli", "Gülümseyerek"],
];
const ORTAM: [string, string, React.ElementType][] = [
  ["yağmur sesi", "Yağmur", CloudRain], ["uzak şehir uğultusu", "Şehir uğultusu", Building2], ["uğuldayan rüzgâr", "Rüzgâr", Wind],
  ["kalabalık uğultusu", "Kalabalık", Users], ["dalga sesi", "Dalga", Waves], ["gerilimli film müziği", "Gerilim müziği", Music], ["neredeyse sessizlik", "Sessizlik", VolumeX],
];
const RENK = ["#55d6fd", "#f472b6", "#a3e635", "#fb923c", "#a78bfa", "#facc15"];
const ZEMIN = { background: "rgba(255,255,255,0.035)" };

function Kart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-2" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[42px] items-center gap-2 border-b border-white/[0.06] px-3 py-2">{baslik}<span className="flex-1" />{sag}</div>
      {children}
    </div>
  );
}

function TonSecici({ ton, onTon, etiket }: { ton: string; onTon: (t: string) => void; etiket: string }) {
  const [acik, setAcik] = useState(false);
  const t = TONLAR.find((x) => x[0] === ton) ?? TONLAR[0];
  return (
    <div className="relative shrink-0">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-label={etiket}
        className={cn("flex h-7 items-center gap-1 rounded-full pl-2.5 pr-2 text-[12px] font-medium ring-1 ring-inset transition active:scale-95", acik ? "bg-white/[0.12] text-white ring-white/20" : "bg-white/[0.065] text-white/85 ring-white/[0.08] hover:bg-white/[0.1]")}>
        {t[1]}<ChevronDown className={cn("h-3 w-3 text-white/55 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Konuşma tonu" className="w-[220px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#151517]">
        <p className="border-b border-white/[0.06] px-3 py-2.5 text-[12.5px] font-semibold text-white">Konuşma tonu</p>
        <div className="p-1">
          {TONLAR.map(([k, ad, alt]) => (
            <button key={k} onClick={() => { onTon(k); setAcik(false); }} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left transition-colors", k === ton ? "bg-white/[0.085]" : "hover:bg-white/[0.055]")}>
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white">{ad}</span><span className="block text-[11.5px] text-white/50">{alt}</span></span>
              {k === ton && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      </Yuzen>
    </div>
  );
}

export function DiyalogPaneli({ diyalog, setDiyalog, dil, setDil, kisiler, konusma, sure, sesNotu, setSesNotu }: {
  diyalog: DiyalogSatiri[]; setDiyalog: (f: (l: DiyalogSatiri[]) => DiyalogSatiri[]) => void;
  dil: "tr" | "en"; setDil: (d: "tr" | "en") => void; kisiler: string[]; konusma: number; sure?: number;
  sesNotu: string; setSesNotu: (f: string | ((s: string) => string)) => void;
}) {
  const guncelle = (id: string, d: Partial<DiyalogSatiri>) => setDiyalog((l) => l.map((x) => (x.id === id ? { ...x, ...d } : x)));
  const ekle = () => diyalog.length < 6 && setDiyalog((l) => [...l, { id: `d${Date.now().toString(36)}`, kim: kisiler[l.length % Math.max(1, kisiler.length)] ?? "", metin: "", ton: "dogal" }]);
  const fazla = !!sure && konusma > sure;
  const ozelOrtam = sesNotu.split(",").map((x) => x.trim()).filter((x) => x && !ORTAM.some(([k]) => k === x)).join(", ");
  const ortamDegis = (k: string) => setSesNotu((s) => {
    const l = s.split(",").map((x) => x.trim()).filter(Boolean);
    return (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]).join(", ").slice(0, 160);
  });
  const ozelYaz = (v: string) => setSesNotu((s) => [...s.split(",").map((x) => x.trim()).filter((x) => ORTAM.some(([k]) => k === x)), v.trim() ? v : ""].filter(Boolean).join(", ").slice(0, 160));

  return (
    <>
      <Kart
        baslik={<><span className="text-[13px] font-semibold text-white">Diyalog</span>{diyalog.length > 0 && <span className="rounded-full bg-white/[0.085] px-1.5 text-[11.5px] font-medium tabular-nums leading-5 text-white/75">{diyalog.length}</span>}</>}
        sag={
          <span className="flex h-7 items-center gap-0.5 rounded-full bg-white/[0.065] p-0.5 ring-1 ring-inset ring-white/[0.07]">
            {([["tr", "Türkçe"], ["en", "İngilizce"]] as const).map(([k, a]) => (
              <button key={k} onClick={() => setDil(k)} aria-pressed={dil === k} className={cn("relative isolate h-6 rounded-full px-2.5 text-[11.5px] font-semibold transition-colors", dil === k ? "text-[#0a0a0b]" : "text-white/55 hover:text-white")}>
                {dil === k && <motion.span layoutId="sinema-diyalog-dil" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{a}
              </button>
            ))}
          </span>}>
        {diyalog.length === 0 ? (
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><MessageSquareQuote className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-white">Karakterler konuşsun</span><span className="block text-[12px] leading-snug text-white/55">Replikleri yaz, model dudakları senkronlar</span></span>
            <motion.button whileTap={{ scale: 0.95 }} onClick={ekle} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Plus className="h-3.5 w-3.5" />Replik</motion.button>
          </div>
        ) : (
          <>
            <div className="space-y-2 p-2">
              <AnimatePresence initial={false}>
                {diyalog.map((d, i) => {
                  const renk = RENK[i % RENK.length];
                  return (
                    <motion.div key={d.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.22 }}
                      className="overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/20" style={ZEMIN}>
                      <div className="flex items-center gap-2 px-2.5 pt-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${renk} 22%, transparent)`, color: renk }}>{d.kim.trim() ? d.kim.trim()[0] : i + 1}</span>
                        <input value={d.kim} onChange={(e) => guncelle(d.id, { kim: e.target.value.slice(0, 30) })} placeholder="Kim konuşuyor?" aria-label={`Replik ${i + 1} konuşan`}
                          className="h-7 min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/40" />
                        <TonSecici ton={d.ton} onTon={(t) => guncelle(d.id, { ton: t })} etiket={`Replik ${i + 1} tonu`} />
                        <button onClick={() => setDiyalog((l) => l.filter((x) => x.id !== d.id))} aria-label={`Replik ${i + 1} sil`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      {kisiler.length > 0 && !d.kim && (
                        <div className="flex flex-wrap gap-1 px-2.5 pt-1.5">{kisiler.map((k) => <button key={k} onClick={() => guncelle(d.id, { kim: k })} className="h-6 rounded-full bg-white/[0.065] px-2 text-[11.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white">@{k}</button>)}</div>
                      )}
                      <textarea value={d.metin} onChange={(e) => guncelle(d.id, { metin: e.target.value.slice(0, 220) })} rows={2} aria-label={`Replik ${i + 1} metin`}
                        placeholder={i === 0 ? "Ne söylüyor? Örnek: Burada olmaman gerekiyordu." : "Cevap? Örnek: Biliyorum, ama başka yolum yoktu."}
                        className="mt-1 block w-full resize-none bg-transparent px-3 pb-2.5 pl-[46px] text-[13px] leading-snug text-white outline-none placeholder:text-white/40" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 py-1.5">
              <button onClick={ekle} disabled={diyalog.length >= 6} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.065] hover:text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Replik ekle</button>
              {konusma > 0 && <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular-nums", fazla ? "bg-amber-300/10 text-amber-200" : "bg-white/[0.065] text-white/70")}>Konuşma yaklaşık {konusma} sn{sure ? ` / ${sure} sn` : ""}</span>}
            </div>
          </>
        )}
      </Kart>

      <Kart baslik={<span className="text-[13px] font-semibold text-white">Ses ve ortam</span>}
        sag={sesNotu ? <button onClick={() => setSesNotu("")} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.065] hover:text-white">Temizle</button> : undefined}>
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {ORTAM.map(([k, ad, I]) => {
            const a = sesNotu.split(",").map((x) => x.trim()).includes(k);
            return (
              <button key={k} onClick={() => ortamDegis(k)} aria-pressed={a}
                className={cn("relative flex h-10 items-center gap-2 rounded-[11px] px-2.5 text-left text-[12.5px] font-medium transition active:scale-[0.97]", a ? "bg-white/[0.1] text-white" : "text-white/75 hover:bg-white/[0.065] hover:text-white")} style={a ? undefined : ZEMIN}>
                <I className={cn("h-4 w-4 shrink-0", a ? "text-white" : "text-white/50")} />{ad}
                <span className={cn("pointer-events-none absolute inset-0 rounded-[11px] ring-inset", a ? "ring-2 ring-white" : "ring-1 ring-white/[0.06]")} />
              </button>
            );
          })}
          <label className="col-span-2 flex h-10 items-center gap-2 rounded-[11px] px-2.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/30" style={ZEMIN}>
            <Sparkles className="h-4 w-4 shrink-0 text-white/50" />
            <input value={ozelOrtam} onChange={(e) => ozelYaz(e.target.value)} placeholder="Özel: kendi ortam sesini yaz, örnek gök gürültüsü" aria-label="Özel ortam sesi"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/40" />
          </label>
        </div>
      </Kart>
    </>
  );
}
