"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Video, ImageIcon, Box, AudioLines, Zap, ArrowRight } from "lucide-react";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import { MODELLER, type ModelTur } from "@/lib/catalog";
import { cn, onizlemeArka } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

const turler: { id: ModelTur | "tumu"; ad: string; ikon: typeof Video }[] = [
  { id: "tumu", ad: "Tümü", ikon: Zap },
  { id: "video", ad: "Video", ikon: Video },
  { id: "gorsel", ad: "Görsel", ikon: ImageIcon },
  { id: "3d", ad: "3D", ikon: Box },
  { id: "ses", ad: "Ses", ikon: AudioLines },
];

export default function ModellerPage() {
  const [tur, setTur] = useState<string>("tumu");
  const liste = MODELLER.filter((m) => tur === "tumu" || m.tur === tur);

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Model Kataloğu"
        baslik="Sektörün en iyi modelleri, tek çatı altında"
        aciklama="Video, görsel, 3D ve ses — 20+ model. En uygun modeli seç, kredilerinle üret."
      />

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {turler.map((t) => (
            <button key={t.id} onClick={() => setTur(t.id)}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                tur === t.id ? "border-vayra-400/50 bg-vayra-500/15 text-white" : "border-white/10 text-white/60 hover:border-white/20")}>
              <t.ikon className="h-4 w-4" /> {t.ad}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((m, i) => {
            const hedef = m.tur === "3d" ? "/panel/3d" : m.tur === "ses" ? "/panel/ses" : `/panel/gorsel?model=${m.id}`;
            return (
            <Reveal key={m.id} i={i % 3}>
              <Link href={hedef} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-yuzey transition-all hover:-translate-y-1 hover:border-cyan-glow/40">
                {/* Görsel önizleme */}
                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: kesfetArka(m.ad + m.saglayici, "sinematik") }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="rounded-full bg-ink-950/50 px-2.5 py-1 text-[11px] font-medium capitalize backdrop-blur-sm">
                      {m.tur === "gorsel" ? "Görsel" : m.tur === "3d" ? "3D" : m.tur === "ses" ? "Ses" : "Video"}
                    </span>
                    {m.rozet && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                      m.rozet === "Vayra" ? "bg-cyan-glow/25 text-cyan-glow" : m.rozet === "Yeni" ? "bg-emerald-400/25 text-emerald-300" :
                      m.rozet === "Hızlı" ? "bg-amber-glow/25 text-amber-glow" : "bg-iris-500/25 text-iris-300")}>{m.rozet}</span>}
                  </div>
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-ink-950/50 px-2 py-1 text-xs font-medium text-amber-glow backdrop-blur-sm"><Zap className="h-3 w-3" />{m.kredi}</span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold">{m.ad}</h3>
                    <p className="text-xs text-white/70">{m.saglayici}</p>
                  </div>
                </div>
                {/* İçerik */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex-1 text-sm text-white/60">{m.aciklama}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.yetenekler.map((y) => (
                      <span key={y} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60">{y}</span>
                    ))}
                  </div>
                  <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-cyan-glow opacity-0 transition-opacity group-hover:opacity-100">
                    Bu modelle üret <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/kayit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-vayra-500 px-7 font-medium text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-vayra-400">
            Tüm modelleri kullanmaya başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SayfaKabuk>
  );
}
