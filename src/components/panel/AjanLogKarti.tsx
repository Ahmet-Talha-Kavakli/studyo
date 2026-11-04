"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, ArrowRight, Check, Loader2 } from "lucide-react";
import { useSupercomputer, type SCDurum } from "@/store/useSupercomputer";
import { cn } from "@/lib/utils";

// Ajanın adım-adım iş akışı — Higgsfield "Agent working for Ns" canlı log mantığı.
const asamalar: { durum: SCDurum; etiket: string }[] = [
  { durum: "planlaniyor", etiket: "İçerik planı oluşturuluyor" },
  { durum: "kodlaniyor", etiket: "Bileşenler ve mantık kodlanıyor" },
  { durum: "test", etiket: "Test ediliyor ve önizleme hazırlanıyor" },
  { durum: "tamam", etiket: "Hazır" },
];
const sira: SCDurum[] = ["kuyrukta", "planlaniyor", "kodlaniyor", "test", "tamam"];

/**
 * Home canlı-ajan log kartı: Usta'da aktif bir iş varsa onu adım-adım
 * checklist olarak gösterir; yoksa Usta'ya davet kartı. Gerçek veriye bağlı.
 */
export function AjanLogKarti() {
  const isler = useSupercomputer((s) => s.isler);
  const aktif = isler.find((i) => i.durum !== "tamam") ?? isler[0] ?? null;

  if (!aktif) {
    return (
      <Link href="/panel/supercomputer"
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-glow/12 to-blue-600/10 p-6 transition-all hover:border-cyan-glow/30">
        <div>
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <Cpu className="h-5 w-5 text-cyan-glow" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-glow/80">Usta</p>
          <h3 className="mt-1 text-lg font-bold">Bir fikir yaz, ajanlar inşa etsin</h3>
          <p className="mt-1 text-sm text-white/60">Uygulama, web sitesi veya oyunu prompt'tan uçtan uca üretir.</p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-cyan-glow px-4 py-2 text-sm font-semibold text-ink-950 transition-transform group-hover:scale-[1.03]">
          Şimdi dene <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  const aktifIdx = sira.indexOf(aktif.durum);

  return (
    <Link href="/panel/supercomputer"
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-yuzey p-6 transition-all hover:border-cyan-glow/30">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl glass-ikon glass-ikon-cyan">
          {aktif.durum === "tamam" ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-glow/80">Usta · Vayra 3D Sol</p>
          <p className="truncate text-sm font-semibold">{aktif.ad}</p>
        </div>
        <span className="shrink-0 text-xs text-white/45">%{Math.round(aktif.ilerleme)}</span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-cyan-glow" animate={{ width: `${Math.max(6, aktif.ilerleme)}%` }} transition={{ ease: "easeOut" }} />
      </div>

      {/* Adım-adım checklist */}
      <ul className="space-y-2">
        {asamalar.map((a) => {
          const idx = sira.indexOf(a.durum);
          const tamamlandi = aktif.durum === "tamam" || idx < aktifIdx;
          const suanda = idx === aktifIdx;
          return (
            <li key={a.durum} className={cn("flex items-center gap-2.5 text-sm transition-colors",
              tamamlandi ? "text-white/70" : suanda ? "text-white" : "text-white/35")}>
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                tamamlandi ? "bg-cyan-glow/20 text-cyan-glow" : suanda ? "bg-cyan-glow/15 text-cyan-glow" : "bg-white/6 text-white/30")}>
                {tamamlandi ? <Check className="h-3 w-3" /> : suanda ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              {a.etiket}
            </li>
          );
        })}
      </ul>
    </Link>
  );
}
