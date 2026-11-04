"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Box, AudioLines, Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/Button";

export function Differentiator() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-cyan-glow/15 px-3 py-1 text-sm font-semibold text-cyan-glow">
            Vayra Farkı
          </span>
          <h2 className="hf-baslik mt-4 text-4xl md:text-5xl">
            Rakiplerde olmayan iki güç
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Video ve görselin ötesine geçtik. Artık 3D varlıklar ve profesyonel ses de
            aynı panelde.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {/* 3D */}
        <Reveal>
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-cyan-glow/5 to-transparent p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-glow to-blue-500">
              <Box className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold">3D Stüdyo · Meshy</h3>
            <p className="mt-3 text-white/60">
              Metinden ya da tek bir görselden üretime hazır 3D model. PBR dokular,
              temiz topoloji, GLB/FBX dışa aktarma.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Metin → 3D model", "Görsel → 3D mesh", "AI ile PBR dokulama", "Oyun & AR'a hazır çıktı"].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-sm text-white/75">
                  <Check className="h-4 w-4 text-cyan-glow" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/urunler/3d">
                <Button variant="glass" size="sm">3D Stüdyo&apos;yu keşfet</Button>
              </Link>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-3xl border border-cyan-glow/20 opacity-40"
            />
          </div>
        </Reveal>

        {/* Ses */}
        <Reveal i={1}>
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-400/5 to-transparent p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500">
              <AudioLines className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Ses Stüdyosu · ElevenLabs & Vali</h3>
            <p className="mt-3 text-white/60">
              32 dilde ultra-gerçekçi seslendirme, kendi sesini klonla, metinden müzik ve
              ses efekti üret. Videolarınla lip-sync&apos;e hazır.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["32 dilde TTS", "Ses klonlama", "Metinden müzik (Vali)", "Ses efekti üretimi"].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-sm text-white/75">
                  <Check className="h-4 w-4 text-emerald-400" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/urunler/ses">
                <Button variant="glass" size="sm">Ses Stüdyosu&apos;nu keşfet</Button>
              </Link>
            </div>
            <div className="pointer-events-none absolute bottom-6 right-8 flex items-end gap-1 opacity-40">
              {[8, 16, 24, 14, 28, 12, 20].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [h, h * 1.8, h] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                  className="w-1.5 rounded-full bg-emerald-400"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
