"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, Timer, AlertTriangle, Radio, Layers } from "lucide-react";
import { liveMetrik, providerLatency } from "@/lib/admin/seed/liveops";
import { useLiveTik } from "@/lib/admin/useLiveTik";
import { DurumNokta, AD } from "@/components/admin/ui/temel";
import { cn } from "@/lib/utils";

/* Live Ops — 5sn'de bir yenilenen gerçek zamanlı operasyon paneli. */

function CanliDeger({ deger, birim, renk }: { deger: number | string; birim?: string; renk?: string }) {
  return (
    <motion.span key={String(deger)} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }}
      className="tabular-nums font-bold" style={{ color: renk }}>
      {typeof deger === "number" ? deger.toLocaleString("tr-TR") : deger}{birim && <span className="ml-0.5 text-[11px] font-normal opacity-60">{birim}</span>}
    </motion.span>
  );
}

export function LiveOps() {
  const tik = useLiveTik(5000);
  const m = liveMetrik(tik);
  const lat = providerLatency(tik);
  const kapasiteOran = Math.round((m.isleniyor / m.kapasite) * 100);

  const kutular = [
    { ikon: Layers, etiket: "Kuyrukta", deger: m.kuyruk, renk: m.kuyruk > 90 ? "var(--ad-uyari)" : "var(--ad-metin)" },
    { ikon: Cpu, etiket: "İşleniyor", deger: `${m.isleniyor}/${m.kapasite}`, renk: "var(--ad-aksan)" },
    { ikon: Timer, etiket: "Ort. bekleme", deger: m.ortBeklemeSn, birim: "sn", renk: "var(--ad-metin)" },
    { ikon: Radio, etiket: "Anlık aktif", deger: m.anlikAktif, renk: "var(--ad-basari)" },
    { ikon: Activity, etiket: "Son 5dk ✓", deger: m.son5Tamamlanan, renk: "var(--ad-basari)" },
    { ikon: AlertTriangle, etiket: "Hata (15dk)", deger: `%${m.hataOran15dk}`, renk: m.hataOran15dk > 3 ? "var(--ad-tehlike)" : "var(--ad-metin)" },
  ];

  return (
    <div className="ad-glass p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DurumNokta ton="basari" nabiz />
          <h3 className={cn("text-sm font-bold", AD.metin)}>Canlı Operasyon</h3>
          <span className={cn("text-[11px]", AD.metin3)}>· 5sn'de yenilenir</span>
        </div>
        <span className={cn("text-[11px] tabular-nums", AD.metin3)}>kapasite %{kapasiteOran}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kutular.map((k) => (
          <div key={k.etiket} className="rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <k.ikon className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" />
              <span className={cn("text-[11px]", AD.metin3)}>{k.etiket}</span>
            </div>
            <div className="text-[19px]"><CanliDeger deger={k.deger} birim={k.birim} renk={k.renk} /></div>
          </div>
        ))}
      </div>

      {/* Provider latency */}
      <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-4">
        <p className={cn("mb-2.5 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Provider latency (p50 / p95 / p99)</p>
        <div className="space-y-1.5">
          {lat.map((l) => (
            <div key={l.ad} className="flex items-center gap-3 text-[13px]">
              <DurumNokta ton={l.devreKesici === "acik" ? "tehlike" : l.devreKesici === "yarim" ? "uyari" : "basari"} />
              <span className={cn("w-40 shrink-0 truncate", AD.metin2)}>{l.ad}</span>
              <span className="tabular-nums text-[color:var(--ad-metin)]">{l.p50}<span className={AD.metin3}>ms</span></span>
              <span className="tabular-nums text-[color:var(--ad-metin-2)]">{l.p95}</span>
              <span className="tabular-nums text-[color:var(--ad-metin-3)]">{l.p99}</span>
              <span className="ml-auto tabular-nums" style={{ color: l.basariOran < 95 ? "var(--ad-uyari)" : "var(--ad-basari)" }}>%{l.basariOran}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
