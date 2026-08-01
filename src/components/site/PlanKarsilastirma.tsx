"use client";

import { Check, Minus } from "lucide-react";
import { Reveal } from "./Reveal";

const planlar = ["Başlangıç", "Artı", "Ultra"];

// Özellik satırları — her plan için değer
const satirlar: { ozellik: string; degerler: (string | boolean)[] }[] = [
  { ozellik: "Aylık kredi", degerler: ["200", "1.000", "3.000"] },
  { ozellik: "Model erişimi", degerler: ["Seçili", "Tümü", "Tümü"] },
  { ozellik: "Paralel video üretimi", degerler: ["2", "6", "8"] },
  { ozellik: "Paralel görsel üretimi", degerler: ["2", "8", "8"] },
  { ozellik: "3D Stüdyo (Meshy)", degerler: [false, true, true] },
  { ozellik: "Ses Stüdyosu", degerler: [false, true, true] },
  { ozellik: "Akış (görsel workflow)", degerler: [false, true, true] },
  { ozellik: "Ruh ID kimlik", degerler: ["—", "5 kimlik", "Sınırsız"] },
  { ozellik: "Maksimum çözünürlük", degerler: ["1080p", "2K", "4K"] },
  { ozellik: "Topaz upscale", degerler: [false, false, true] },
  { ozellik: "API & MCP erişimi", degerler: [false, false, true] },
  { ozellik: "Öncelikli kuyruk", degerler: [false, true, true] },
  { ozellik: "Filigransız çıktı", degerler: [true, true, true] },
];

function Hucre({ deger, vurgu }: { deger: string | boolean; vurgu?: boolean }) {
  if (deger === true) return <span className="flex justify-center"><Check className="h-4 w-4 text-cyan-glow" strokeWidth={2.5} /></span>;
  if (deger === false) return <span className="flex justify-center"><Minus className="h-4 w-4 text-white/25" /></span>;
  return <span className={`block text-center text-sm ${vurgu ? "font-semibold text-white" : "text-white/70"}`}>{deger}</span>;
}

export function PlanKarsilastirma() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <Reveal>
        <h2 className="mb-10 text-center text-3xl font-bold">Planları karşılaştır</h2>
      </Reveal>
      <Reveal>
        <div className="overflow-x-auto">
          <div className="min-w-[560px] overflow-hidden rounded-3xl border border-white/10">
            {/* Başlık */}
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center border-b border-white/10 bg-white/[0.03]">
              <span className="px-5 py-4 text-sm font-semibold text-white/70">Özellik</span>
              {planlar.map((p, i) => (
                <span key={p} className={`px-3 py-4 text-center text-sm font-bold ${i === 1 ? "text-cyan-glow" : "text-white"}`}>
                  {p}{i === 1 && <span className="ml-1 rounded-full bg-cyan-glow/15 px-1.5 py-0.5 text-[9px]">Popüler</span>}
                </span>
              ))}
            </div>
            {/* Satırlar */}
            {satirlar.map((s, i) => (
              <div key={s.ozellik} className={`grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                <span className="px-5 py-3 text-sm text-white/80">{s.ozellik}</span>
                {s.degerler.map((d, j) => (
                  <span key={j} className={`px-3 py-3 ${j === 1 ? "bg-cyan-glow/[0.04]" : ""}`}>
                    <Hucre deger={d} vurgu={j === 1} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
