"use client";

/**
 * m4: "Bu ses" sayfası — TikTok mantığı. Bir sese tıklayınca:
 *  • sesin başlığı + kaç videoda kullanıldığı
 *  • "Bu sesi kullan" (müzik stüdyosuna taşır)
 *  • o sesi kullanan diğer gönderilerin ızgarası (tıklayınca akışta açılır)
 */

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Music2, Play, Sparkles, Bookmark } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAkis, birlesikFeed } from "@/store/useAkis";
import { kisaSayi } from "@/lib/akisVeri";
import { saltUrl, cn } from "@/lib/utils";

export default function AkisSesPage({ params }: { params: Promise<{ muzik: string }> }) {
  const { muzik } = use(params);
  const sesAd = decodeURIComponent(muzik);
  const router = useRouter();
  const paylasimlar = useAkis((s) => s.paylasimlar);
  const gizlenenler = useAkis((s) => s.gizlenenler);

  // Bu sesi kullanan tüm gönderiler.
  const gonderiler = useMemo(
    () => birlesikFeed(paylasimlar, gizlenenler).filter((g) => g.muzik === sesAd),
    [paylasimlar, gizlenenler, sesAd],
  );
  const toplamGoruntulenme = gonderiler.reduce((a, g) => a + g.goruntulenmeTohum, 0);

  const sesiKullan = () => {
    // Sesi müzik stüdyosuna köprüle (sessionStorage) ve yönlendir.
    try { sessionStorage.setItem("vayra-ses-kullan", sesAd); } catch { /* yoksay */ }
    toast.success("Ses stüdyoya aktarıldı 🎵", { description: `"${sesAd}" ile üretime başla.` });
    router.push("/panel/muzik");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-metin-3 transition-colors hover:text-metin">
        <ChevronLeft className="h-4 w-4" /> Geri
      </button>

      {/* ses hero */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aksan to-emerald-400 text-zemin shadow-lg shadow-aksan/20">
          <Music2 className="h-10 w-10" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-metin-3">Orijinal ses</p>
          <h1 className="truncate text-[24px] font-black leading-tight text-metin">{sesAd}</h1>
          <p className="mt-1 text-[13.5px] text-metin-2">
            {gonderiler.length} gönderi · {kisaSayi(toplamGoruntulenme)} görüntülenme
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={sesiKullan}
              className="flex items-center gap-2 rounded-full bg-aksan px-5 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-105">
              <Sparkles className="h-4 w-4" /> Bu sesi kullan
            </button>
            <button onClick={() => { void toast.success("Ses kaydedildi 🔖"); }}
              className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-[14px] font-medium text-metin transition-colors hover:bg-white/8">
              <Bookmark className="h-4 w-4" /> Kaydet
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-bold text-metin">Bu sesi kullanan gönderiler</h2>
        <span className="text-[13px] text-metin-3">{gonderiler.length}</span>
      </div>

      {gonderiler.length === 0 ? (
        <p className="py-16 text-center text-sm text-metin-3">Bu sesle henüz gönderi yok.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {gonderiler.map((g) => {
            const poster = saltUrl(g.gorselUrl);
            return (
              <button key={g.id} onClick={() => router.push(`/panel/akis?g=${g.id}`)}
                className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-ink-900" style={{ background: g.gorselUrl }}>
                {poster && <img src={poster} alt={g.baslik} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <p className={cn("line-clamp-1 text-[12px] font-medium text-white")}>{g.baslik}</p>
                  <span className="flex items-center gap-1 text-[11px] text-white/70">
                    <Play className="h-3 w-3" /> {kisaSayi(g.goruntulenmeTohum)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
