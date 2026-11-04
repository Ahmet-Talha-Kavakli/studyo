import { AU, CN, CZ, DE, ES, FI, FR, GB, GR, ID, IN, IT, JP, KR, NL, PH, PL, PT, RU, SA, SE, TR, UA, US } from "country-flag-icons/react/3x2";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SVG bayrak — bayrak emojisi Windows'ta çizilmez ("us" yazısı görünür); bu yüzden emoji ya da
 * ülke kodu verilir, yuvarlak köşeli SVG çizilir. Yalnız kullanılan bayraklar içe aktarılır.
 */
const BAYRAKLAR = { AU, CN, CZ, DE, ES, FI, FR, GB, GR, ID, IN, IT, JP, KR, NL, PH, PL, PT, RU, SA, SE, TR, UA, US } as const;

/** "🇺🇸" → "US" */
function emojidenKod(b: string): string {
  const k = [...b].map((c) => c.codePointAt(0)! - 0x1f1e6).filter((n) => n >= 0 && n < 26);
  return k.length === 2 ? String.fromCharCode(65 + k[0], 65 + k[1]) : b.toUpperCase();
}

export function Bayrak({ b, boyut = 16, className }: { b?: string | null; boyut?: number; className?: string }) {
  const Svg = b ? BAYRAKLAR[emojidenKod(b) as keyof typeof BAYRAKLAR] : undefined;
  if (!Svg) return <Globe2 aria-hidden className={cn("shrink-0 text-metin-2", className)} style={{ width: boyut, height: boyut }} />;
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/30", className)} style={{ width: boyut, height: Math.round(boyut * 0.68) }}>
      <Svg className="h-full w-full object-cover" />
    </span>
  );
}
