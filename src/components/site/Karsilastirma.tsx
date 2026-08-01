"use client";

import { Check, X, Minus } from "lucide-react";
import { Reveal } from "./Reveal";

type Deger = "var" | "yok" | "kismi";

const satirlar: { ozellik: string; vayra: Deger; rakip: Deger }[] = [
  { ozellik: "15+ video modeli (Sora 2, Veo, Kling…)", vayra: "var", rakip: "var" },
  { ozellik: "Editorial görsel modelleri", vayra: "var", rakip: "var" },
  { ozellik: "Sinematik kamera kontrolü (70+ preset)", vayra: "var", rakip: "var" },
  { ozellik: "Karakter tutarlılığı (kimlik)", vayra: "var", rakip: "var" },
  { ozellik: "URL'den reklam üretimi", vayra: "var", rakip: "var" },
  { ozellik: "80+ tek-tık uygulama", vayra: "var", rakip: "var" },
  { ozellik: "3D modelleme (metin/görsel → 3D)", vayra: "var", rakip: "yok" },
  { ozellik: "Profesyonel ses üretimi (TTS + müzik)", vayra: "var", rakip: "kismi" },
  { ozellik: "Ses klonlama", vayra: "var", rakip: "yok" },
  { ozellik: "Türkçe arayüz & yerel destek", vayra: "var", rakip: "yok" },
];

function Hucre({ d }: { d: Deger }) {
  if (d === "var") return <span className="flex h-7 w-7 items-center justify-center rounded-full glass-ikon glass-ikon-yesil"><Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} /></span>;
  if (d === "kismi") return <span className="flex h-7 w-7 items-center justify-center rounded-full glass-ikon glass-ikon-kehribar"><Minus className="h-4 w-4 text-amber-glow" strokeWidth={2.5} /></span>;
  return <span className="flex h-7 w-7 items-center justify-center rounded-full glass-ikon"><X className="h-4 w-4 text-white/40" strokeWidth={2.5} /></span>;
}

export function Karsilastirma() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">Neden Vayra</span>
          <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">Rakiplerin yaptığı her şey, fazlası</h2>
          <p className="mt-4 text-lg text-white/60">Aynı gücü sunuyoruz — üstüne 3D, ses ve yerel deneyim ekliyoruz.</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-yuzey">
          {/* Başlık */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold">
            <span className="text-white/70">Özellik</span>
            <span className="w-24 text-center text-vayra-300">Vayra</span>
            <span className="w-24 text-center text-white/50">Diğerleri</span>
          </div>
          {/* Satırlar */}
          {satirlar.map((s, i) => (
            <div key={s.ozellik} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-3.5 ${i % 2 ? "bg-white/[0.015]" : ""}`}>
              <span className="text-sm text-white/80">{s.ozellik}</span>
              <span className="flex w-24 justify-center"><Hucre d={s.vayra} /></span>
              <span className="flex w-24 justify-center"><Hucre d={s.rakip} /></span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-white/35">
          <span className="text-emerald-400">✓ Var</span> · <span className="text-amber-glow">— Kısmi</span> · <span className="text-white/40">✕ Yok</span>
        </p>
      </Reveal>
    </section>
  );
}
