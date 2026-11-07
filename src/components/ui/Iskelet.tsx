import { cn } from "@/lib/utils";

/* İSKELET YÜKLEME bileşenleri — içerik gelene kadar gösterilen gri parçalar.
   Gerçek içeriğin izdüşümü olacak şekilde kullanılır: kutu varsa kutu, yazı
   varsa çubuk. Hepsinde soldan sağa shimmer (.iskelet-parca globals.css). */

/** Temel iskelet parçası — className ile boyut/şekil ver (h-4 w-32 rounded-lg). */
export function Iskelet({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("iskelet-parca rounded-md", className)} style={style} aria-hidden />;
}

/** Metin satırı iskeleti — n çubuk, sonuncusu kısa (paragraf hissi). */
export function IskeletMetin({ satir = 3, className }: { satir?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: satir }).map((_, i) => (
        <Iskelet key={i} className={cn("h-3.5", i === satir - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Kart iskeleti — üstte görsel bloğu + altta başlık/satır (medya kartı izdüşümü). */
export function IskeletKart({ oran = "aspect-[4/3]", className }: { oran?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]", className)} aria-hidden>
      <Iskelet className={cn("w-full rounded-none", oran)} />
      <div className="space-y-2 p-3">
        <Iskelet className="h-3.5 w-3/4" />
        <Iskelet className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Kart ızgarası iskeleti — n kart, verilen grid sınıfıyla (gerçek grid izdüşümü). */
export function IskeletIzgara({
  adet = 8,
  oran = "aspect-[4/3]",
  gridClass = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4",
}: { adet?: number; oran?: string; gridClass?: string }) {
  return (
    <div className={gridClass} aria-hidden>
      {Array.from({ length: adet }).map((_, i) => <IskeletKart key={i} oran={oran} />)}
    </div>
  );
}

/** Avatar + iki satır (liste öğesi / yorum izdüşümü). */
export function IskeletSatir({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <Iskelet className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Iskelet className="h-3.5 w-1/3" />
        <Iskelet className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Liste satırı iskeleti (ayarlar, faturalar, günlük gibi satır listeleri): solda simge, ortada iki satır metin,
 * isteğe bağlı sağda iki satır değer. Ölçüler gerçek satırla aynı (px-6 py-3, 14 px ve 12.5 px metin).
 */
export function IskeletListeSatiri({ simge = 40, yuvarlak, sag = true, ilk = "w-48", ikinci = "w-32", className }: {
  simge?: number; yuvarlak?: boolean; sag?: boolean; ilk?: string; ikinci?: string; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3.5 px-6 py-3", className)} aria-hidden>
      <Iskelet className={cn("shrink-0", yuvarlak ? "rounded-full" : "rounded-[12px]")} style={{ width: simge, height: simge }} />
      <span className="min-w-0 flex-1 space-y-2">
        <Iskelet className={cn("h-3.5 max-w-full rounded-full", ilk)} />
        <Iskelet className={cn("h-3 max-w-full rounded-full", ikinci)} />
      </span>
      {sag && (
        <span className="flex shrink-0 flex-col items-end gap-2">
          <Iskelet className="h-3.5 w-16 rounded-full" />
          <Iskelet className="h-3 w-12 rounded-full" />
        </span>
      )}
    </div>
  );
}

/** Ayarlar kartı iskeleti (components/ayarlar/ui Grup ile aynı kabuk): başlık, açıklama ve n satır. */
export function IskeletGrup({ satir = 3, simge = 32, className }: { satir?: number; simge?: number; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[18px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]", className)} aria-hidden>
      <div className="px-6 pb-5 pt-6">
        <Iskelet className="h-[18px] w-40 rounded-full" />
        <Iskelet className="mt-3 h-3.5 w-80 max-w-full rounded-full" />
      </div>
      <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {Array.from({ length: satir }, (_, i) => <IskeletListeSatiri key={i} simge={simge} yuvarlak ilk={["w-48", "w-56", "w-40"][i % 3]} ikinci={["w-32", "w-24", "w-36"][i % 3]} sag={false} />)}
      </div>
    </section>
  );
}
