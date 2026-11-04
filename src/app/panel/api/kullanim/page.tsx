"use client";

import { AnalitikPanosu } from "@/components/api/AnalitikPanosu";
import { SayfaBaslik } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";

export default function KullanimSayfasi() {
  const hazir = useHazir();
  if (!hazir) return <div className="h-[60vh]" />;
  return (
    <>
      <SayfaBaslik baslik="Kullanım" aciklama="İstek hacmi, başarı oranı, çalışma süresi ve kredi harcaması. Veriler tüm anahtarlarından gelen üretimlerden hesaplanır ve 20 saniyede bir tazelenir." />
      <AnalitikPanosu />
    </>
  );
}
