"use client";

import { cn } from "@/lib/utils";

/**
 * Ayar kaydırıcısı (ElevenLabs deseni): ad (ipucu varsa noktalı alt çizgi), altında iki uçta
 * anlam yazısı ("Daha değişken" ↔ "Daha kararlı"), en altta ince çubuk. Monokrom: dolu kısım
 * beyaz. Çift tıklama varsayılana döndürür; değişmişse adın yanında küçük nokta görünür.
 */
export function EtiketliKaydirici({
  ad, deger, min, max, adim, onDegis, yaz, solUc, sagUc, varsayilan, ipucu, devreDisi,
}: {
  ad: string; deger: number; min: number; max: number; adim: number; onDegis: (n: number) => void;
  yaz?: (n: number) => string; solUc?: string; sagUc?: string; varsayilan?: number; ipucu?: string; devreDisi?: boolean;
}) {
  const yuzde = ((deger - min) / (max - min)) * 100;
  const degisti = varsayilan !== undefined && Math.abs(deger - varsayilan) > adim / 2;
  return (
    <div className={cn("select-none", devreDisi && "pointer-events-none opacity-45")}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin">
          <span title={ipucu} className={cn(ipucu && "cursor-help underline decoration-white/30 decoration-dotted underline-offset-4")}>{ad}</span>
          {degisti && <span className="h-1.5 w-1.5 rounded-full bg-aksan" aria-label="Değiştirildi" />}
        </span>
        {yaz && <span className="text-[12.5px] tabular-nums text-metin-2">{yaz(deger)}</span>}
      </div>
      {(solUc || sagUc) && (
        <div className="mt-1 flex justify-between text-[12px] text-metin-3"><span>{solUc}</span><span>{sagUc}</span></div>
      )}
      <input type="range" min={min} max={max} step={adim} value={deger} aria-label={ad} disabled={devreDisi}
        onChange={(e) => onDegis(Number(e.target.value))}
        onDoubleClick={() => varsayilan !== undefined && onDegis(varsayilan)}
        className="vy-aralik vy-aralik-beyaz mt-2.5 w-full" style={{ ["--d" as string]: `${yuzde}%` }} />
    </div>
  );
}
