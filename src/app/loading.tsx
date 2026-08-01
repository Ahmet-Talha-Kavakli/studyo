import { Iskelet, IskeletIzgara } from "@/components/ui/Iskelet";

/**
 * Kök route-level yükleme iskeleti (landing/pazarlama alt sayfaları).
 * Boş ekran/spinner yerine hero + kart ızgarası izdüşümü (shimmer'lı).
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-zemin">
      {/* Hero izdüşümü */}
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-10 text-center">
        <Iskelet className="mx-auto h-7 w-32 rounded-full" />
        <Iskelet className="mx-auto mt-5 h-11 w-4/5" />
        <Iskelet className="mx-auto mt-3 h-11 w-2/3" />
        <Iskelet className="mx-auto mt-6 h-5 w-3/4" />
        <div className="mt-8 flex justify-center gap-3">
          <Iskelet className="h-12 w-36 rounded-xl" />
          <Iskelet className="h-12 w-36 rounded-xl" />
        </div>
      </div>
      {/* Kart ızgarası */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <IskeletIzgara adet={6} oran="aspect-video" gridClass="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" />
      </div>
    </div>
  );
}
