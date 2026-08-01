"use client";

import { useState } from "react";
import { Sparkles, ArrowUp, ImagePlus, Mic, Plus } from "lucide-react";
import { AJAN_HIZLI_BASLANGIC } from "@/lib/uc-boyut";
import { onizlemeArka } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";

/**
 * Ajan (sohbet) modu — Meshy "Ajan/Model Yardımcısı" birebir. Ortada büyük
 * başlık + prompt composer + Hızlı Başlangıç kartları + Son Kullanılanlar.
 * Prompt gönderilince Metin→3D üretimini tetikler (onGonder).
 */
export function AjanPaneli({ onGonder }: { onGonder: (istem: string) => void }) {
  const [metin, setMetin] = useState("");

  const gonder = () => {
    if (metin.trim().length < 3) return;
    onGonder(metin.trim());
    setMetin("");
  };

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-14 [scrollbar-width:thin]">
      <div className="w-full max-w-2xl">
        <div className="mb-2 flex items-center justify-center gap-2 text-aksan">
          <Sparkles className="h-5 w-5" />
          <span className="rounded-full bg-aksan/15 px-2.5 py-0.5 text-[11px] font-semibold">Ajan · Beta</span>
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-aksan to-vayra-500 bg-clip-text text-transparent">Vayra 3D</span>{" "}
          fikrini modele dönüştürür
        </h1>
        <p className="mt-2 text-center text-sm text-metin-2">Fikrini anlat, ajan senin için 3D üretmeye başlasın.</p>

        {/* Composer */}
        <div className="mt-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 focus-within:border-aksan/40">
          <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) gonder(); }}
            placeholder="Örn: elinde kılıç tutan zırhlı bir savaşçı kız, üretime hazır 3D karakter…"
            className="w-full resize-none bg-transparent px-2 pt-1 text-sm outline-none placeholder:text-metin-3" />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-metin-3">
              <button className="rounded-lg p-1.5 hover:bg-white/8 hover:text-white" title="Görsel ekle"><ImagePlus className="h-4 w-4" /></button>
              <button className="rounded-lg p-1.5 hover:bg-white/8 hover:text-white" title="Sesli"><Mic className="h-4 w-4" /></button>
            </div>
            <button onClick={gonder} disabled={metin.trim().length < 3}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan text-zemin transition-transform hover:scale-105 disabled:opacity-40">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hızlı başlangıç */}
        <div className="mt-8">
          <h3 className="mb-2.5 text-xs font-semibold text-metin-2">Hızlı Başlangıç</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {AJAN_HIZLI_BASLANGIC.map((k) => (
              <button key={k.ad} onClick={() => setMetin(k.ad)}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-aksan/30 hover:bg-white/[0.04]">
                <div className="h-10 w-10 shrink-0 rounded-lg" style={{ background: origArka(k.ad, "3d") }} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{k.ad}</div>
                  <div className="mt-0.5 text-[11px] text-metin-3">{k.ipucu}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Son kullanılanlar */}
        <div className="mt-8">
          <h3 className="mb-2.5 text-xs font-semibold text-metin-2">Son Kullanılanlar</h3>
          <button onClick={() => setMetin("")}
            className="flex h-24 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 text-metin-3 transition-colors hover:border-aksan/40 hover:text-white">
            <Plus className="h-5 w-5" />
            <span className="text-[11px]">Yeni Proje</span>
          </button>
        </div>
      </div>
    </div>
  );
}
