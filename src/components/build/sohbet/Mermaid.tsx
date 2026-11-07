"use client";

import { useEffect, useId, useState } from "react";
import { Check, Code2, Copy, Download, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { indir } from "./ortak";

/**
 * ```mermaid blokları: kütüphane ilk diyagramda tembel yüklenir, koyu tema, sıkı güvenlik (betik yok).
 * Yanıt akarken yarım kod çizilmez; sözdizimi hatasında kod bloğu ve kısa not gösterilir.
 */
type Mermaid = { initialize: (o: Record<string, unknown>) => void; render: (id: string, kod: string) => Promise<{ svg: string }> };
let yukleme: Promise<Mermaid> | null = null;
function mermaidAl(): Promise<Mermaid> {
  yukleme ??= import("mermaid").then((m) => {
    const x = (m as unknown as { default: Mermaid }).default;
    x.initialize({
      startOnLoad: false, securityLevel: "strict", theme: "dark", suppressErrorRendering: true,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 14,
      themeVariables: {
        darkMode: true, background: "#0c0d0f", primaryColor: "#1a2a33", primaryTextColor: "#f4f4f5", primaryBorderColor: "#55d6fd",
        secondaryColor: "#1c1d21", tertiaryColor: "#16171a", lineColor: "#8be6ff", textColor: "#e4e4e7", mainBkg: "#1a2a33", nodeBorder: "#55d6fd",
        clusterBkg: "#141518", clusterBorder: "#2a2b30", edgeLabelBackground: "#16171a", noteBkgColor: "#1c1d21", noteTextColor: "#e4e4e7", noteBorderColor: "#3f3f46",
        actorBkg: "#1a2a33", actorBorder: "#55d6fd", actorTextColor: "#f4f4f5", signalColor: "#8be6ff", signalTextColor: "#e4e4e7",
      },
    });
    return x;
  });
  return yukleme;
}

export function MermaidBlok({ kod, akiyor, yedek }: { kod: string; akiyor?: boolean; yedek: React.ReactNode }) {
  const kimlik = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState("");
  const [hata, setHata] = useState("");
  const [kodGoster, setKodGoster] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (akiyor) return;
    let iptal = false;
    const t = setTimeout(() => {
      mermaidAl().then((m) => m.render(`mm${kimlik}${Date.now() % 100000}`, kod)).then((r) => { if (!iptal) { setSvg(r.svg); setHata(""); } })
        .catch((e: Error) => { if (!iptal) { setHata(String(e?.message ?? "Diyagram çizilemedi").split("\n")[0].slice(0, 160)); setSvg(""); } });
    }, 120);
    return () => { iptal = true; clearTimeout(t); };
  }, [kod, akiyor, kimlik]);
  if (akiyor) return <>{yedek}</>;
  if (hata) return <div>{yedek}<p className="-mt-1.5 mb-3 text-[12px] text-white/45">Diyagram çizilemedi: {hata}</p></div>;
  if (!svg) return <div className="my-3 flex h-[160px] items-center justify-center rounded-[14px] bg-[#0c0d0f] text-[12.5px] text-white/40 ring-1 ring-inset ring-white/[0.08]"><Workflow className="mr-2 h-4 w-4 animate-pulse" />Diyagram çiziliyor</div>;
  if (kodGoster) return (
    <div>
      <div className="-mb-1.5 mt-3 flex justify-end"><button type="button" onClick={() => setKodGoster(false)} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] text-white hover:bg-white/[0.13]"><Workflow className="h-3 w-3" />Diyagramı gör</button></div>
      {yedek}
    </div>
  );
  return (
    <div className="my-3 overflow-hidden rounded-[14px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex h-9 items-center gap-1 border-b border-white/[0.06] pl-3 pr-1.5 text-[12px] text-white/45">
        <Workflow className="mr-1 h-3.5 w-3.5" /><span className="flex-1">Diyagram</span>
        <button type="button" onClick={() => setKodGoster(true)} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 hover:bg-white/[0.07] hover:text-white"><Code2 className="h-3 w-3" />Kodu gör</button>
        <button type="button" title="SVG indir" aria-label="SVG indir" onClick={() => indir("diyagram.svg", svg, "image/svg+xml")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white"><Download className="h-3 w-3" /></button>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(kod); setOk(true); setTimeout(() => setOk(false), 1300); }} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 hover:bg-white/[0.07] hover:text-white">{ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{ok ? "Kopyalandı" : "Kopyala"}</button>
      </div>
      <div className={cn("flex justify-center overflow-x-auto p-4 [&_svg]:h-auto [&_svg]:max-w-full")} dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
