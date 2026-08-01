import { Iskelet, IskeletIzgara } from "@/components/ui/Iskelet";

/**
 * Panel route-level yükleme iskeleti (Next.js App Router otomatik).
 * Boş ekran/spinner yerine gerçek stüdyo düzeninin izdüşümü: üst araç şeridi
 * (filtreler + arama) + tarih başlığı + kart ızgarası. Üzerinde shimmer akar.
 * Alt rotaların çoğu (gorsel/video/ses/muzik/sinema…) kendi loading'i yoksa buna düşer.
 */
export default function PanelLoading() {
  return (
    <div className="min-h-[calc(100vh-3rem)] px-4 py-5 sm:px-6">
      {/* Üst araç şeridi — filtre çipleri + arama + görünüm */}
      <div className="mb-6 flex items-center gap-2">
        <Iskelet className="h-8 w-20 rounded-full" />
        <Iskelet className="h-8 w-24 rounded-full" />
        <Iskelet className="h-8 w-20 rounded-full" />
        <Iskelet className="ml-auto h-8 w-40 rounded-full" />
      </div>

      {/* Tarih başlığı */}
      <Iskelet className="mb-3 h-5 w-24" />

      {/* Kart ızgarası — gerçek galeri izdüşümü */}
      <IskeletIzgara adet={8} oran="aspect-[4/3]" />

      {/* İkinci grup */}
      <Iskelet className="mb-3 mt-8 h-5 w-20" />
      <IskeletIzgara adet={4} oran="aspect-[4/3]" />
    </div>
  );
}
