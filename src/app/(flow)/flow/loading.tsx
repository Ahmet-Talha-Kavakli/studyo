import { Iskelet, IskeletSatir } from "@/components/ui/Iskelet";

/**
 * Flow yükleme iskeleti — feed izdüşümü (dikey gönderi kartları).
 * Sidebar layout'tan gelir; bu yalnızca ana feed gövdesini kaplar.
 */
export default function FlowLoading() {
  return (
    <div className="mx-auto max-w-[470px] px-2 py-4">
      {/* Story şeridi izdüşümü */}
      <div className="mb-5 flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Iskelet className="h-14 w-14 rounded-full" />
            <Iskelet className="h-2.5 w-10" />
          </div>
        ))}
      </div>

      {/* Gönderi kartları */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <IskeletSatir />
            <Iskelet className="aspect-square w-full rounded-lg" />
            <div className="flex gap-4">
              <Iskelet className="h-6 w-6 rounded" />
              <Iskelet className="h-6 w-6 rounded" />
              <Iskelet className="h-6 w-6 rounded" />
            </div>
            <Iskelet className="h-3.5 w-1/3" />
            <Iskelet className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
