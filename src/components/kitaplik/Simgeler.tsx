import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const L = "/marka/renkli";
/** Model adı → sağlayıcı logosu. Sıra önemli: daha özel desen önce. */
const DESENLER: [RegExp, string][] = [
  [/nano.?banana/i, `${L}/nanobanana-color.svg`],
  [/veo|gemini|imagen|lyria/i, `${L}/gemini-color.svg`],
  [/seedream|seedance|seededit|bytedance|^seed/i, `${L}/bytedance-color.svg`],
  [/recraft/i, `${L}/recraft.svg`],
  [/ideogram/i, `${L}/ideogram.svg`],
  [/vibevoice|microsoft/i, `${L}/microsoft-color.svg`],
  [/kling/i, `${L}/kling-color.svg`],
  [/sora|gpt|dall/i, `${L}/openai.svg`],
  [/flux/i, `${L}/flux.svg`],
  [/wan|qwen/i, `${L}/qwen-color.svg`],
  [/z-image|happy.?horse/i, `${L}/alibaba-color.svg`],
  [/hailuo|minimax/i, `${L}/hailuo-color.svg`],
  [/eleven|ses klonu/i, `${L}/elevenlabs.svg`],
  [/meshy/i, `${L}/meshy-color.svg`],
  [/claude/i, `${L}/claude-color.svg`],
  [/grok/i, `${L}/grok.svg`],
  [/topaz/i, `${L}/topaz.png`],
  [/clarity|crystal/i, `${L}/clarity.png`],
  [/bria/i, `${L}/bria.png`],
  [/luma|photon|ray.?[23]/i, `${L}/luma-color.svg`],
  [/vidu/i, `${L}/vidu-color.svg`],
  [/pixverse/i, `${L}/pixverse-color.svg`],
  [/ltx|lightricks/i, `${L}/lightricks.svg`],
];

export function modelLogoUrl(ad: string): string | null {
  return DESENLER.find(([d]) => d.test(ad))?.[1] ?? null;
}

/** Model logosu — bilinmeyen/Vayra modellerinde Vayra işareti, yüklemelerde yükleme simgesi. */
export function ModelLogo({ ad, boyut = 16, className }: { ad: string; boyut?: number; className?: string }) {
  if (/^y[üu]kleme$/i.test(ad)) {
    return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-[5px] bg-white/[0.1] text-white/80", className)} style={{ width: boyut, height: boyut }}><Upload style={{ width: boyut * 0.62, height: boyut * 0.62 }} /></span>;
  }
  const url = modelLogoUrl(ad) ?? "/brand/vayra-mark.png";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" aria-hidden width={boyut} height={boyut} className={cn("shrink-0 object-contain", className)} style={{ width: boyut, height: boyut }} />;
}

/** En-boy oranını çizen dörtgen: 16:9 yatay, 9:16 dikey, 1:1 kare … Kutunun içine sığdırılır. */
export function OranSekli({ oran, boyut = 16, className }: { oran: string; boyut?: number; className?: string }) {
  const [a, b] = oran.split(":").map(Number);
  const r = a && b ? a / b : 1;
  const g = r >= 1 ? boyut : Math.max(4, Math.round(boyut * r));
  const y = r >= 1 ? Math.max(4, Math.round(boyut / r)) : boyut;
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center", className)} style={{ width: boyut, height: boyut }}>
      <span className="rounded-[3px] border-2 border-current" style={{ width: g, height: y }} />
    </span>
  );
}
