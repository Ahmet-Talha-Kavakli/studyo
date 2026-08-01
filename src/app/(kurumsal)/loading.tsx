import { Iskelet } from "@/components/ui/Iskelet";

/**
 * Kurumsal route-group yükleme iskeleti — BEYAZ zemin izdüşümü.
 * .kurumsal-kapsam sarmalı → .iskelet-parca beyaz zeminde koyu gri parçalara döner.
 * Hero (rozet + başlık + açıklama + CTA) + bölüm kartları izdüşümü.
 */
export default function KurumsalLoading() {
  return (
    <div className="kurumsal-kapsam min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center">
        <Iskelet className="mx-auto h-7 w-28 rounded-full" />
        <Iskelet className="mx-auto mt-5 h-10 w-4/5" />
        <Iskelet className="mx-auto mt-3 h-10 w-3/5" />
        <Iskelet className="mx-auto mt-5 h-5 w-3/4" />
        <div className="mt-8 flex justify-center gap-3">
          <Iskelet className="h-12 w-40 rounded-xl" />
          <Iskelet className="h-12 w-40 rounded-xl" />
        </div>
      </div>

      {/* İstatistik bandı izdüşümü */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[color:var(--color-kenar)] p-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Iskelet className="h-8 w-20" />
              <Iskelet className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Bölüm kartları izdüşümü */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[color:var(--color-kenar)] p-6">
              <Iskelet className="h-11 w-11 rounded-xl" />
              <Iskelet className="mt-4 h-4 w-1/2" />
              <Iskelet className="mt-2 h-3 w-full" />
              <Iskelet className="mt-1.5 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
