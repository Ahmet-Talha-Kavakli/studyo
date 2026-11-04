"use client";

import { useEffect, useState } from "react";
import { OFISLER } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

const BOLGE: Record<string, string> = {
  Amsterdam: "Europe/Amsterdam", "İstanbul": "Europe/Istanbul", Londra: "Europe/London", "New York": "America/New_York", Singapur: "Asia/Singapore",
};

/** Ofisler — yerel saat canlı; mesai içindeyse "Çevrimiçi" rozeti. */
export function OfisSaatleri() {
  const [simdi, setSimdi] = useState<Date | null>(null);
  useEffect(() => {
    setSimdi(new Date());
    const t = setInterval(() => setSimdi(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid gap-px overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-5">
      {OFISLER.map((o) => {
        const tz = BOLGE[o.sehir];
        const saat = simdi ? new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(simdi) : "--:--";
        const s = simdi ? Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(simdi)) : -1;
        const gun = simdi ? new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(simdi) : "";
        const mesai = s >= 9 && s < 18 && !["Sat", "Sun"].includes(gun);
        return (
          <div key={o.sehir} className="bg-zemin p-6">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-metin-3">{o.ulke}</p>
              <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", mesai ? "text-tur-3d" : "text-metin-3")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", mesai ? "bg-tur-3d" : "bg-white/25")} />{mesai ? "Çevrimiçi" : "Mesai dışı"}
              </span>
            </div>
            <p className="mt-6 text-[22px] font-semibold tracking-[-0.02em] text-white">{o.sehir}</p>
            <p className="text-[13px] text-metin-2">{o.rol}</p>
            <p className="mt-5 text-[30px] font-semibold tabular-nums tracking-[-0.03em] text-white/90">{saat}</p>
            <p className="text-[12px] text-metin-3">{o.saat} · {o.adres}</p>
          </div>
        );
      })}
    </div>
  );
}
