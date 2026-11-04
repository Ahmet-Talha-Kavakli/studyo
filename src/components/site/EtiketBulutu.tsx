"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

// Vayra'nın tüm yetenekleri — keşif/SEO etiket bulutu.
// Her etiket ilgili stüdyo/araca yönlenir (ölü link değil, gerçek derinlik).
const etiketler: { ad: string; href: string }[] = [
  { ad: "Sinema Stüdyosu", href: "/panel/sinema" },
  { ad: "3D Modelleme", href: "/panel/3d" },
  { ad: "Ses Üretimi", href: "/panel/ses" },
  { ad: "Ruh 2.0", href: "/panel/gorsel" },
  { ad: "Ruh Sinema", href: "/panel/sinema" },
  { ad: "Seedance 2.0", href: "/panel/video" },
  { ad: "Veo 3.1", href: "/panel/video" },
  { ad: "Kling 3.0", href: "/panel/video" },
  { ad: "Sora 2", href: "/panel/video" },
  { ad: "Nano Banana Pro", href: "/panel/gorsel" },
  { ad: "Kamera Kontrolü", href: "/panel/sinema" },
  { ad: "AI Yönetmen", href: "/panel/sinema" },
  { ad: "Ruh ID", href: "/panel/karakter" },
  { ad: "Yüz Değiştir", href: "/panel/gorsel" },
  { ad: "Video Yüz Değiştir", href: "/panel/gorsel" },
  { ad: "Ses Klonlama", href: "/panel/ses" },
  { ad: "Metinden Müzik", href: "/panel/ses" },
  { ad: "Lip-Sync", href: "/panel/gorsel" },
  { ad: "URL'den Reklam", href: "/panel/pazarlama" },
  { ad: "UGC Video", href: "/panel/pazarlama" },
  { ad: "Meshy 3D", href: "/panel/3d" },
  { ad: "PBR Dokulama", href: "/panel/3d" },
  { ad: "ElevenLabs TTS", href: "/panel/ses" },
  { ad: "Vali Müzik", href: "/panel/ses" },
  { ad: "Upscale 4K", href: "/panel/gorsel" },
  { ad: "Renk Düzenleme", href: "/panel/gorsel" },
  { ad: "Inpaint", href: "/panel/gorsel" },
  { ad: "Arka Plan Sil", href: "/panel/gorsel" },
  { ad: "Vesikalık", href: "/panel/gorsel" },
  { ad: "Kıyafet Değiştir", href: "/panel/gorsel" },
  { ad: "Viral Tahmin", href: "/panel/shorts" },
  { ad: "Açılar 2.0", href: "/panel/sinema" },
  { ad: "Geçişler", href: "/panel/shorts" },
  { ad: "Bullet Time", href: "/panel/sinema" },
  { ad: "Billboard Reklam", href: "/panel/pazarlama" },
  { ad: "Character Swap", href: "/panel/gorsel" },
  { ad: "Skin Enhancer", href: "/panel/gorsel" },
  { ad: "Relight", href: "/panel/gorsel" },
  { ad: "Görsel Genişlet", href: "/panel/gorsel" },
  { ad: "MCP & CLI", href: "/gelistirici" },
  { ad: "Usta", href: "/panel/supercomputer" },
  { ad: "Explainer Video", href: "/panel/explainer" },
  { ad: "Shorts Stüdyo", href: "/panel/shorts" },
];

export function EtiketBulutu() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">
            Tek panelde her şey
          </span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">
            Keşfedecek çok şey var
          </h2>
          <p className="mt-4 text-lg text-white/60">
            {etiketler.length}+ yetenek, 20+ model, 80+ araç. Hepsi Vayra&apos;da, hepsi Türkçe.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-12 flex flex-wrap justify-center gap-2.5">
          {etiketler.map((e, i) => (
            <motion.div
              key={e.ad}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 12) * 0.03 }}
            >
              <Link
                href={e.href}
                className="inline-block rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-all hover:-translate-y-0.5 hover:border-vayra-400/40 hover:bg-vayra-500/10 hover:text-white"
              >
                {e.ad}
              </Link>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
