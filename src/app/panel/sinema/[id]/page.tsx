"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * m35: ESKİ sinema proje sayfası KALDIRILDI.
 * Artık sinema projesine tıklayınca ORTAK proje iç sayfası (/panel/projeler/[id])
 * açılır — sinema/kitaplık/projeler tek birleşik proje deneyimi. Bu rota yalnızca
 * eski link'ler/yer imleri kırılmasın diye kalıcı olarak yeni sayfaya yönlendirir.
 * Proje verisi zaten ortak (useProje = useSinema) olduğundan id birebir taşınır.
 */
export default function EskiSinemaProjeYonlendir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/panel/projeler/${id}`);
  }, [id, router]);
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3 text-metin-3">
      <Loader2 className="h-6 w-6 animate-spin text-aksan" />
      <p className="text-sm">Proje açılıyor…</p>
    </div>
  );
}
