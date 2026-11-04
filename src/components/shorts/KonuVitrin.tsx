"use client";

/**
 * Konudan short vitrini: mekanizmayı gösterir (dekoratif yelpaze değil).
 * Konu satırı → dört dikey sahne kartı (Başlık, Neden, Maddeler, Kapanış); her kart seçilen stilin gerçek
 * klibi üstünde ekran yazısı ve altyazıyla, sırayla "oynar" (ilerleme çubuğu + vurgulu kart).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { stilBul, stilPoster, stilVideo } from "@/lib/explainerMotor";

const SAHNELER = (konu: string, ornek: boolean) => [
  { tur: "Başlık", yazi: konu, alt: "Çoğu kişi bunu bilmiyor" },
  { tur: "Neden", yazi: "Neden önemli?", alt: "Küçük fark, büyük sonuç" },
  { tur: "Maddeler", yazi: "", maddeler: ornek ? ["Enerji verir", "Odağı artırır", "Ruh halini iyileştirir"] : ["", "", ""], alt: "İşte 3 madde" },
  { tur: "Kapanış", yazi: "Sence hangisi?", alt: "Yorumlara yaz", cta: "Takip et" },
];
const SURE = 2400;

export function KonuVitrin({ konu, stil }: { konu: string; stil: string }) {
  const [aktif, setAktif] = useState(0);
  useEffect(() => { const t = setInterval(() => setAktif((v) => (v + 1) % 4), SURE); return () => clearInterval(t); }, []);
  const st = stilBul(stil);
  const metin = konu.trim() || "Kahvenin bilinmeyen 3 faydası";
  const l = SAHNELER(metin.length > 34 ? `${metin.slice(0, 34).replace(/\s+\S*$/, "")}…` : metin, !konu.trim() || /kahve/i.test(konu));
  return (
    <div aria-hidden className="relative">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-4 ring-1 ring-inset ring-white/[0.1]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-white"><Lightbulb className="h-3.5 w-3.5" /></span>
        <span className="max-w-[300px] truncate text-[13px] font-medium text-white max-sm:max-w-[220px]">{metin}</span>
      </div>
      {/* Konudan sahnelere inen çizgiler */}
      <svg className="mt-1 block h-7 w-full" viewBox="0 0 400 28" preserveAspectRatio="none" fill="none">
        {[50, 150, 250, 350].map((x, i) => <path key={x} d={`M200 0 C200 16 ${x} 10 ${x} 28`} stroke="currentColor" vectorEffect="non-scaling-stroke" className={cn("transition-colors duration-500", i === aktif ? "text-white/70" : "text-white/15")} strokeWidth="1.5" strokeDasharray={i === aktif ? "0" : "3 4"} />)}
      </svg>
      <div className="grid grid-cols-4 gap-2 pt-1.5">
        {l.map((s, i) => {
          const a = i === aktif;
          return (
            <motion.div key={s.tur} animate={{ y: a ? -6 : 0, scale: a ? 1.03 : 1, opacity: a ? 1 : 0.62 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className={cn("relative aspect-[9/16] w-full overflow-hidden rounded-[14px] bg-black ring-1", a ? "ring-white/70" : "ring-white/10")}>
              {a ? <video key={stil} src={stilVideo(stil)} poster={stilPoster(stil)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={stilPoster(stil)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${20 + i * 20}% 50%` }} />}
              <span className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/60" />
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-px text-[10px] font-semibold text-white backdrop-blur">{i + 1} · {s.tur}</span>
              <span className="absolute inset-x-2 top-[34%] text-center">
                {s.maddeler ? (
                  <span className="flex flex-col items-start gap-1">{s.maddeler.map((m, k) => m ? <span key={k} className="max-w-full truncate rounded-[5px] bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white max-sm:text-[8px]">{k + 1}. {m}</span> : <span key={k} className="flex items-center gap-1 rounded-[5px] bg-black/55 px-1.5 py-1"><span className="text-[10px] font-bold text-white max-sm:text-[8px]">{k + 1}.</span><span className="h-1.5 rounded-full bg-white/70" style={{ width: [34, 26, 30][k] }} /></span>)}</span>
                ) : <span className="line-clamp-4 text-[13px] font-extrabold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] max-sm:text-[10px]">{s.yazi}</span>}
                {s.cta && <span className="mt-1.5 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold text-black max-sm:px-1.5 max-sm:text-[8px]" style={{ background: st.vurgu }}>{s.cta}</span>}
              </span>
              <span className="absolute inset-x-2 bottom-4 text-center text-[10px] font-bold text-white max-sm:hidden [paint-order:stroke_fill] [-webkit-text-stroke:2px_#000]">{s.alt}</span>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">{a && <motion.span key={`p${aktif}`} className="block h-full" style={{ background: st.vurgu }} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SURE / 1000, ease: "linear" }} />}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[12px] text-white/55">{st.ad} · ekran yazısı, altyazı ve müzik otomatik</p>
    </div>
  );
}
