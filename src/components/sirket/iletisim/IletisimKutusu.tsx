"use client";

/** Ofisler: canlı yerel saat ve mesai durumu (İletişim ve Hakkında'da kullanılır). */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { OFISLER, TR_SIRKET } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

const SAAT_DILIMI: Record<string, string> = { Amsterdam: "Europe/Amsterdam", "İstanbul": "Europe/Istanbul", Londra: "Europe/London", "New York": "America/New_York", Singapur: "Asia/Singapore" };

export function OfisSeridi() {
  const [simdi, setSimdi] = useState<Date | null>(null);
  useEffect(() => { setSimdi(new Date()); const t = setInterval(() => setSimdi(new Date()), 20_000); return () => clearInterval(t); }, []);
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-white">Ofislerimiz</h2>
          <p className="mt-1 text-[14.5px] text-white/65">Beş şehirde, aynı ekip. Saatler canlı.</p>
        </div>
        <Link href="/hakkinda" className="group flex shrink-0 items-center gap-1 text-[13.5px] text-white/65 transition hover:text-white">Ekibimizi tanı<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
      <ul className="mt-5 grid grid-cols-2 overflow-hidden rounded-[22px] bg-white/[0.08] ring-1 ring-white/[0.08] sm:grid-cols-3 lg:grid-cols-5" style={{ gap: 1 }}>
        {OFISLER.map((o, i) => {
          const tz = SAAT_DILIMI[o.sehir];
          const saat = simdi && tz ? simdi.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: tz }) : "--:--";
          const sa = simdi && tz ? Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(simdi)) : 0;
          const gun = simdi && tz ? new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(simdi) : "";
          const acik = !!simdi && sa >= 9 && sa < 18 && gun !== "Sat" && gun !== "Sun";
          return (
            <motion.li key={o.sehir} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.05 }}
              className={cn("bg-[#111113] p-5 transition-colors hover:bg-[#151517]", i === OFISLER.length - 1 && "col-span-2 sm:col-span-1")}>
              <p className="text-[13px] text-white/60">{o.rol}</p>
              <p className="mt-0.5 text-[16px] font-semibold text-white">{o.sehir}</p>
              <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">{saat}</p>
              <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-white/65">
                <span className="relative flex h-1.5 w-1.5">
                  {acik && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />}
                  <span className={cn("relative h-1.5 w-1.5 rounded-full", acik ? "bg-emerald-400" : "bg-white/30")} />
                </span>
                {acik ? "Mesaide" : "Mesai dışı"} · {o.adres}
              </p>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-5 text-[12.5px] leading-relaxed text-white/55">{TR_SIRKET.yasalAd} · {TR_SIRKET.adres} · KEP {TR_SIRKET.kep}</p>
    </section>
  );
}
