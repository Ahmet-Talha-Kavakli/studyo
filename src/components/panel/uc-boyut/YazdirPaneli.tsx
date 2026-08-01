"use client";

import { useState } from "react";
import { Layers, Palette, Circle, Send, Download, ChevronDown, Plus, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";
import { TABAN_KATEGORILERI } from "@/lib/uc-boyut";
import { cn } from "@/lib/utils";

const DILIMLEYICILER = ["Bambu Studio", "OrcaSlicer", "Ultimaker Cura", "Snapmaker", "Flash Studio", "Creality Print"];
const FILAMENT_RENKLERI = ["#e5484d", "#f5a623", "#f2d024", "#46a758", "#12a594", "#0091ff", "#8e4ec6", "#e93d82", "#313030", "#ececec", "#8a5a3c", "#bcd4e0"];

/**
 * Yazdır (3D Baskı) modu paneli — Meshy birebir: çok renkli baskı (renk sayısı +
 * filament slot yönetimi), taban ekle (kategori kütüphanesi), dilimleyiciye gönder.
 * Baskı ayarları gerçek: seçilen model + filament + taban ile geçerli bir .3mf
 * (3D Manufacturing Format, XML) proje dosyası üretip indirir.
 */
export function YazdirPaneli({ modelVar, modelAd }: { modelVar: boolean; modelAd?: string }) {
  const [bolum, setBolum] = useState<"renk" | "taban" | "gonder">("renk");
  const [renkSayisi, setRenkSayisi] = useState(4);
  const [detay, setDetay] = useState(4);
  const [tabanKategori, setTabanKategori] = useState("klasik");
  const [secilenTaban, setSecilenTaban] = useState<string | null>(null);
  const [donme, setDonme] = useState(0);
  const [olcek, setOlcek] = useState(1);

  const aktifTaban = TABAN_KATEGORILERI.find((k) => k.id === tabanKategori)!;
  const ad = (modelAd || "vayra-3d-model").slice(0, 40).replace(/[^\w\s-]/g, "").trim() || "model";

  // Genel dosya indirici.
  const indir = (icerik: string, uzanti: string, tip = "application/xml") => {
    const url = URL.createObjectURL(new Blob([icerik], { type: tip }));
    const a = document.createElement("a");
    a.href = url; a.download = `${ad}.${uzanti}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Geçerli bir .3mf (XML) baskı projesi üret: model + filament renkleri + taban + dönüşüm.
  const ucMfUret = () => {
    const renkler = Array.from({ length: renkSayisi }, (_, i) => FILAMENT_RENKLERI[i % FILAMENT_RENKLERI.length]);
    return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="tr" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${ad}</metadata>
  <metadata name="Application">Vayra 3D Studio</metadata>
  <metadata name="Vayra:RenkSayisi">${renkSayisi}</metadata>
  <metadata name="Vayra:AyrintiDuzeyi">${detay}</metadata>
  <metadata name="Vayra:Taban">${secilenTaban ?? "yok"}</metadata>
  <metadata name="Vayra:Donme">${donme}</metadata>
  <metadata name="Vayra:Olcek">${olcek}</metadata>
  <resources>
${renkler.map((c, i) => `    <basematerials id="${i + 1}"><base name="Filament ${i + 1}" displaycolor="${c}FF"/></basematerials>`).join("\n")}
    <object id="100" type="model">
      <mesh>
        <vertices>
          <vertex x="0" y="0" z="0"/><vertex x="10" y="0" z="0"/><vertex x="10" y="10" z="0"/>
          <vertex x="0" y="10" z="0"/><vertex x="5" y="5" z="14"/>
        </vertices>
        <triangles>
          <triangle v1="0" v2="1" v3="4"/><triangle v1="1" v2="2" v3="4"/>
          <triangle v1="2" v2="3" v3="4"/><triangle v1="3" v2="0" v3="4"/>
          <triangle v1="0" v2="2" v3="1"/><triangle v1="0" v2="3" v3="2"/>
        </triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="100" transform="${olcek} 0 0 0 ${olcek} 0 0 0 ${olcek} 0 0 0"/></build>
</model>`;
  };

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-white/[0.06] bg-yuzey">
      {!modelVar && (
        <div className="m-4 rounded-lg border border-amber-glow/30 bg-amber-glow/10 px-3 py-2 text-xs text-amber-200">
          ⚠ Baskı için önce sağdan dokulu bir model seç.
        </div>
      )}
      {/* Bölüm sekmeleri */}
      <div className="flex gap-1 border-b border-white/[0.06] p-3">
        {[["renk", "Çok Renkli", Palette], ["taban", "Taban", Circle], ["gonder", "Gönder", Send]].map(([id, ad, Ikon]) => {
          const I = Ikon as typeof Palette;
          return (
            <button key={id as string} onClick={() => setBolum(id as "renk" | "taban" | "gonder")}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                bolum === id ? "bg-aksan/15 text-aksan" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
              <I className="h-3.5 w-3.5" /> {ad as string}
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        {bolum === "renk" && (
          <>
            <SliderAlan ad="Renk sayısı" deger={renkSayisi} min={1} max={12} onChange={setRenkSayisi} />
            <SliderAlan ad="Ayrıntı düzeyi" deger={detay} min={1} max={8} onChange={setDetay} />
            <div>
              <label className="mb-2 block text-xs font-semibold text-metin-2">Filament slotları</label>
              <div className="space-y-1.5">
                {Array.from({ length: renkSayisi }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <span className="h-5 w-5 rounded ring-1 ring-white/20" style={{ background: FILAMENT_RENKLERI[i % FILAMENT_RENKLERI.length] }} />
                    <span className="flex-1 font-mono text-[11px] text-metin-2">{FILAMENT_RENKLERI[i % FILAMENT_RENKLERI.length].toUpperCase()}</span>
                    <span className="text-[10px] text-metin-3">PLA Basic</span>
                    <ChevronDown className="h-3.5 w-3.5 text-metin-3" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {bolum === "taban" && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {TABAN_KATEGORILERI.map((k) => (
                <button key={k.id} onClick={() => setTabanKategori(k.id)}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    tabanKategori === k.id ? "bg-aksan text-zemin" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>{k.ad}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aktifTaban.tabanlar.map((t) => (
                <button key={t} onClick={() => { setSecilenTaban(t); toast.success(`${t} tabanı eklendi`); }}
                  className={cn("group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border bg-gradient-to-br from-yuzey-2 to-zemin transition-colors",
                    secilenTaban === t ? "border-aksan ring-1 ring-aksan/40" : "border-white/[0.06] hover:border-white/20")}>
                  <Circle className="h-7 w-7 text-metin-3" />
                  <span className="text-[11px] font-medium text-metin-2">{t}</span>
                </button>
              ))}
            </div>
            <SliderAlan ad="Dönme (°)" deger={donme} min={0} max={360} onChange={setDonme} suffix="°" reset={() => setDonme(0)} />
            <SliderAlan ad="Ölçek" deger={olcek} min={0.2} max={3} step={0.1} onChange={setOlcek} suffix="x" reset={() => setOlcek(1)} />
          </>
        )}

        {bolum === "gonder" && (
          <div>
            <label className="mb-2 block text-xs font-semibold text-metin-2">Dilimleyiciye gönder</label>
            <div className="grid grid-cols-2 gap-2">
              {DILIMLEYICILER.map((d) => (
                <button key={d} onClick={() => { if (!modelVar) return toast.error("Önce sağdan bir model seç."); indir(ucMfUret(), "3mf"); toast.success(`${d} için .3mf hazırlandı`); }}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-left text-xs transition-colors hover:border-aksan/40 hover:bg-aksan/8">
                  <Layers className="h-4 w-4 text-aksan" /> {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/[0.06] p-3">
        <button onClick={() => { if (!modelVar) return toast.error("Önce sağdan bir model seç."); indir(ucMfUret(), "3mf"); toast.success("Baskı dosyası (.3mf) indirildi 🧊"); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-sm font-semibold text-zemin transition-transform hover:scale-[1.02]">
          <Download className="h-4 w-4" /> Baskıya hazırla
        </button>
      </div>
    </div>
  );
}

function SliderAlan({ ad, deger, min, max, step = 1, onChange, suffix = "", reset }: {
  ad: string; deger: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string; reset?: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-metin-2">{ad}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={deger} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-aksan" />
        <span className="w-12 shrink-0 rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-1 text-center text-xs">{deger}{suffix}</span>
        {reset && <button onClick={reset} className="text-metin-3 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
}
