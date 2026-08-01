"use client";

/**
 * MODA FABRİKASI (Fashion Factory) — Higgsfield create-fashion-factory mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-fashion-factory.
 *
 *  ┌ "Moda Fabrikası ⌄" + ✕
 *  │ "Preset seç" + "Foto seti için bir şablon veya estetik seç"
 *  │ 2 sütun preset kartları (carousel oklu + alt-etiket)
 *  └ lime "Devam"
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

const PRESETLER = [
  { id: "bold", ad: "ULTRA CESUR", kat: "moda" },
  { id: "gradient", ad: "MAVİ-YEŞİL GRADYAN", kat: "moda" },
  { id: "street", ad: "SOKAK ŞIKLIĞI", kat: "portre" },
  { id: "sky", ad: "GÖKYÜZÜ ÜSTÜ", kat: "moda" },
  { id: "noir", ad: "NOIR EDİTORYAL", kat: "portre" },
  { id: "pastel", ad: "PASTEL RÜYA", kat: "moda" },
];

export default function FashionPage() {
  const router = useRouter();
  const [secili, setSecili] = useState<string | null>(null);

  const uret = () => {
    const s = uretimBaslat({
      baslik: "Moda seti", tur: "gorsel", model: "Vayra Fashion",
      prompt: `${PRESETLER.find((p) => p.id === secili)?.ad ?? "moda"} estetiğinde moda foto seti`, kredi: 8, arac: "Moda Fabrikası",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Moda seti üretiliyor ✦");
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Moda Fabrikası <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div className="px-1">
          <h2 className="text-[22px] font-bold text-white">Preset seç</h2>
          <p className="mt-1 text-[13.5px] text-metin-2">Foto seti için bir şablon veya estetik seç.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETLER.map((p) => (
            <button key={p.id} onClick={() => setSecili(p.id)}
              className={cn("relative aspect-[3/4] overflow-hidden rounded-[16px] bg-cover bg-center text-left",
                secili === p.id && "ring-2 ring-aksan")}
              style={{ background: aracArka("fashion-" + p.id, p.kat) }}>
              {/* carousel okları (dekoratif) */}
              <span className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/80"><ChevronLeft className="h-4 w-4" /></span>
              <span className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/80"><ChevronRight className="h-4 w-4" /></span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-[13px] font-bold uppercase text-white">{p.ad}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-3 pb-4">
        <button onClick={uret} disabled={!secili}
          className="hf-uret flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-bold disabled:opacity-45">Devam</button>
      </div>
    </div>
  );
}
