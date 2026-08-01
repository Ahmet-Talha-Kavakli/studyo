"use client";

/**
 * /panel/kredi — GERÇEK tam sayfa yükseltme/kredi deneyimi (m59).
 * Kullanıcı geri bildirimi: "pop-up gibi duruyor, ayrı sayfa olsun." Artık
 * "Yükselt" ve profil menüsündeki kredi bağlantıları bu sayfaya gelir; içerik
 * KrediModal ile TEK kaynaktan paylaşılan KrediPano'dan gelir (sekme şeridi +
 * plan/kredi/sınırsız/hız gövdeleri). Sekme, URL query (?sekme=plan) ile açılır.
 */

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { YukseltPano } from "@/components/kabuk/YukseltPano";
import { useKrediModal, type KrediSekme } from "@/store/useKrediModal";
import { useAuth } from "@/store/useAuth";

const GECERLI: KrediSekme[] = ["plan", "kredi", "sinirsiz", "hiz"];

function KrediSayfaIc() {
  const router = useRouter();
  const params = useSearchParams();
  const kullanici = useAuth((s) => s.kullanici);
  // Modal açıksa kapat — aynı içerik iki kez görünmesin (nav'dan sayfaya geçişte).
  const modalKapat = useKrediModal((s) => s.kapat);

  const ilk = (params.get("sekme") as KrediSekme) || "plan";
  const [sekme, setSekme] = useState<KrediSekme>(GECERLI.includes(ilk) ? ilk : "plan");

  useEffect(() => { modalKapat(); }, [modalKapat]);

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin">
      {/* TAM EKRAN (kullanıcı kararı): max-w-5xl sayfayı ortada dar bir şeride
          sıkıştırıp iki yanda devasa boşluk bırakıyordu. Artık ürünün geri
          kalanıyla (kitaplık, projeler) aynı genişlik: 1600px tavan + kenar
          boşluğu, yani geniş ekranda gerçekten yayılıyor. */}
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {/* Üst çubuk — geri + bakiye */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="glass-kenar flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] text-metin-2 transition-colors hover:text-white">
            <ChevronRight className="h-4 w-4 rotate-180" /> Geri
          </button>
          {kullanici && (
            <span className="glass-kenar rounded-full px-3.5 py-2 text-[13.5px] text-metin-2">
              Bakiye: <span className="font-semibold text-white">{kullanici.krediler.toLocaleString("tr-TR")}</span> kredi
            </span>
          )}
        </div>

        <YukseltPano sekme={sekme} setSekme={setSekme} />
      </div>
    </div>
  );
}

export default function KrediSayfa() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3 text-metin-3">
        <Loader2 className="h-6 w-6 animate-spin text-aksan" />
      </div>
    }>
      <KrediSayfaIc />
    </Suspense>
  );
}
