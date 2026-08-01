import { cn } from "@/lib/utils";

/* İSKELET YÜKLEME bileşenleri — içerik gelene kadar gösterilen gri parçalar.
   Gerçek içeriğin izdüşümü olacak şekilde kullanılır: kutu varsa kutu, yazı
   varsa çubuk. Hepsinde soldan sağa shimmer (.iskelet-parca globals.css). */

/** Temel iskelet parçası — className ile boyut/şekil ver (h-4 w-32 rounded-lg). */
export function Iskelet({ className }: { className?: string }) {
  return <div className={cn("iskelet-parca rounded-md", className)} aria-hidden />;
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
