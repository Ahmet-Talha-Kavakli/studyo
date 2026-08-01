import { Iskelet } from "@/components/ui/Iskelet";

/**
 * Earn yükleme iskeleti — dashboard izdüşümü (hero bakiye + metrikler + grafik).
 * Sidebar layout'tan gelir; bu yalnızca ana içerik gövdesini kaplar.
 */
export default function EarnLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* Başlık */}
      <Iskelet className="h-7 w-40" />
      <Iskelet className="mt-2 h-4 w-56" />

      {/* Hero bakiye kartı */}
      <div className="mt-6 rounded-2xl border border-white/[0.07] p-6 md:p-8">
        <Iskelet className="h-4 w-32" />
        <Iskelet className="mt-3 h-12 w-52" />
        <Iskelet className="mt-2 h-4 w-40" />
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Iskelet className="h-5 w-16" />
              <Iskelet className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Nasıl kazanırım kartları */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] p-4">
            <Iskelet className="h-13 w-13 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Iskelet className="h-4 w-1/2" />
              <Iskelet className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Grafik */}
      <div className="mt-8 rounded-2xl border border-white/[0.07] p-6">
        <Iskelet className="h-4 w-28" />
        <Iskelet className="mt-4 h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
