"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { KontrolEylem, KontrolMaddesi } from "@/lib/build/buyumeKontrol";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { birincil, Halka, ikincil, Kart, Rozet } from "./ortak";
import type { BuyumeKanca } from "./useBuyume";
import type { AyarHedefi, Git } from "./BuyumeSekme";

const GRUPLAR: KontrolMaddesi["grup"][] = ["Site", "Arama ve ölçüm", "Kanallar"];

export function LansmanBolumu({ b, liste, git, ajanaGonder, ayaraGit, yayinla }: { p: Proje; b: BuyumeKanca; liste: KontrolMaddesi[]; git: Git; ajanaGonder?: (m: string) => void; ayaraGit?: (b: AyarHedefi) => void; yayinla?: () => void }) {
  const isaret = b.veri!.kontrol;
  const tamam = (x: KontrolMaddesi) => x.otomatik || !!isaret[x.id];
  const biten = liste.filter(tamam).length;
  const oran = liste.length ? biten / liste.length : 0;
  const eylem = (e: KontrolEylem) => {
    if (e.tur === "ayar") ayaraGit?.(e.bolum);
    else if (e.tur === "ajan") ajanaGonder?.(e.istem);
    else if (e.tur === "bolum") git(e.bolum);
    else if (e.tur === "yayin") yayinla?.();
    else window.open(e.adres, "_blank", "noopener,noreferrer");
  };
  const kullanilabilir = (e: KontrolEylem) => (e.tur === "ayar" ? !!ayaraGit : e.tur === "ajan" ? !!ajanaGonder : e.tur === "yayin" ? !!yayinla : true);
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Lansman kontrol listesi<Rozet ton={biten === liste.length ? "aksan" : "notr"}>{biten} / {liste.length}</Rozet></span>}
        aciklama="Projeden anlaşılanlar kendiliğinden işaretlenir; Search Console ve sosyal hesaplar gibi dışarıda yapılanları sen işaretlersin.">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="h-full rounded-full bg-[#55d6fd]" /></div>
      </Kart>
      {GRUPLAR.map((grup) => {
        const l = liste.filter((x) => x.grup === grup);
        if (!l.length) return null;
        return (
          <Kart key={grup} baslik={<span className="flex items-center gap-2">{grup}<Rozet ton="soluk">{l.filter(tamam).length} / {l.length}</Rozet></span>}>
            <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              {l.map((x) => {
                const dolu = tamam(x);
                return (
                  <li key={x.id} className="flex flex-wrap items-start gap-3 px-3.5 py-3 sm:flex-nowrap">
                    <button type="button" role="checkbox" aria-checked={dolu} disabled={!x.elle} title={x.elle ? (dolu ? "İşareti kaldır" : "Yapıldı olarak işaretle") : x.otomatik ? "Projeden anlaşıldı" : "Projede yapınca kendiliğinden işaretlenir"}
                      onClick={() => b.degistir((v) => { if (dolu) delete v.kontrol[x.id]; else v.kontrol[x.id] = true; }, { kontrol: { [x.id]: !dolu } })}
                      className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", x.elle && "hover:bg-white/[0.06]")}><Halka dolu={dolu} /></button>
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <p className="flex flex-wrap items-center gap-2">
                        {x.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.logo} alt="" className="h-4 w-4 object-contain" />}
                        <span className={cn("text-[13.5px]", dolu ? "text-white" : "text-white/90")}>{x.baslik}</span>
                        {x.otomatik && <Rozet ton="aksan" className="h-5 px-2 text-[11px]">Kendiliğinden</Rozet>}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{x.aciklama}</p>
                      {x.kanit && <p className={cn("mt-1 text-[12px]", x.otomatik ? "text-[#8be6ff]/85" : "text-white/45")}>{x.kanit}</p>}
                      {x.ilerleme && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="h-1.5 w-[140px] overflow-hidden rounded-full bg-white/[0.09]"><span className="block h-full rounded-full bg-[#1e9fcf]" style={{ width: `${(x.ilerleme[0] / x.ilerleme[1]) * 100}%` }} /></span>
                          <span className="text-[11.5px] tabular-nums text-white/50">{x.ilerleme[0]} / {x.ilerleme[1]} hazır</span>
                        </div>
                      )}
                    </div>
                    {x.eylem && !dolu && kullanilabilir(x.eylem) && (
                      <button type="button" onClick={() => eylem(x.eylem!)} className={cn(x.eylem.tur === "ajan" ? birincil : ikincil, "h-8 px-3 text-[12.5px] max-sm:ml-11")}>
                        {x.eylem.ad}{x.eylem.tur === "dis" && <ArrowUpRight className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Kart>
        );
      })}
    </div>
  );
}
