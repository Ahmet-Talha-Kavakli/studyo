"use client";

import { Reveal } from "./Reveal";
import { onizlemeArka } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

const ornekler = [
  "Neon Şehir", "Editorial Moda", "3D Robot", "Sinematik Sahil", "Ürün Reklamı",
  "Fantastik Manzara", "AI Portre", "Low-poly Ada", "Marka Jingle", "Karakter Dönüşüm",
  "Mimari Görsel", "Gün Batımı",
];

function Serit({ hiz, yon }: { hiz: number; yon: "sol" | "sag" }) {
  const liste = [...ornekler, ...ornekler];
  return (
    <div className="flex gap-4 overflow-hidden">
      <div
        className="flex shrink-0 gap-4"
        style={{
          animation: `kaydir-${yon} ${hiz}s linear infinite`,
        }}
      >
        {liste.map((o, i) => (
          <div key={i} className="relative h-40 w-64 shrink-0 overflow-hidden rounded-2xl border border-white/10"
            style={{ background: kesfetArka(o + i, "sinematik") }}>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
            <span className="absolute bottom-3 left-3 text-sm font-medium">{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GaleriSerit() {
  return (
    <section className="overflow-hidden py-20">
      <Reveal>
        <div className="mx-auto mb-10 max-w-2xl px-4 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">Vitrin</span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">Vayra ile üretilenler</h2>
        </div>
      </Reveal>
      <div className="space-y-4">
        <Serit hiz={50} yon="sol" />
        <Serit hiz={60} yon="sag" />
      </div>
      <style>{`
        @keyframes kaydir-sol { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes kaydir-sag { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </section>
  );
}
