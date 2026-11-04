"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, TriangleAlert, Info, CreditCard, UserPlus, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { goreceZaman } from "@/lib/admin/cekirdek";
import { AD } from "@/components/admin/ui/temel";
import { canliAkis } from "@/lib/admin/seed/panolar";
import { useLiveTik } from "@/lib/admin/useLiveTik";
import type { Alarm } from "@/lib/admin/seed/panolar";

/* Alarm kutusu (eşik bazlı) + canlı olay akışı (job/ödeme/kayıt, tik ile yenilenir). */

const ALARM_STIL = {
  kritik: { ikon: AlertOctagon, renk: "var(--ad-tehlike)", bg: "rgba(248,113,113,0.1)" },
  uyari: { ikon: TriangleAlert, renk: "var(--ad-uyari)", bg: "rgba(251,191,36,0.1)" },
  bilgi: { ikon: Info, renk: "var(--ad-aksan)", bg: "rgba(85,214,253,0.1)" },
} as const;

export function AlarmKutusu({ liste }: { liste: Alarm[] }) {
  const sirali = [...liste].sort((a, b) => {
    const p = { kritik: 0, uyari: 1, bilgi: 2 };
    return p[a.seviye] - p[b.seviye];
  });
  return (
    <div className="space-y-2">
      {sirali.map((a, i) => {
        const st = ALARM_STIL[a.seviye];
        return (
          <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-xl border border-[color:var(--ad-kenar)] p-3" style={{ background: st.bg }}>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${st.renk}20`, color: st.renk }}>
              <st.ikon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className={cn("text-[13px] font-semibold", AD.metin)}>{a.baslik}</div>
              <div className={cn("text-[12px]", AD.metin3)}>{a.detay}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const AKIS_IKON = { job: ListChecks, odeme: CreditCard, kayit: UserPlus } as const;
const AKIS_RENK = { job: "var(--ad-aksan)", odeme: "var(--ad-basari)", kayit: "var(--ad-mor)" } as const;

export function CanliAkis() {
  const tik = useLiveTik(5000);
  const olaylar = canliAkis(tik).slice(0, 8);
  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {olaylar.map((o) => {
          const Ikon = AKIS_IKON[o.tur];
          return (
            <motion.div key={o.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-lg px-2 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${AKIS_RENK[o.tur]}18`, color: AKIS_RENK[o.tur] }}>
                <Ikon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-[13px]", AD.metin)}>{o.metin}</div>
                <div className={cn("text-[11px]", AD.metin3)}>{o.alt}</div>
              </div>
              <span className={cn("shrink-0 text-[11px] tabular-nums", AD.metin3)}>{goreceZaman(o.zaman)}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
