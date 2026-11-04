"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HttpGunlugu, UretimTablosu } from "@/components/api/IstekGunlugu";
import { SayfaBaslik, SecimSerit } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { useApiAnahtar } from "@/store/useApiAnahtar";

export default function IsteklerSayfasi() {
  return <Suspense><Icerik /></Suspense>;
}

function Icerik() {
  const hazir = useHazir();
  const sp = useSearchParams();
  const uretimSayi = useApiAnahtar((s) => s.uretimler.length);
  const cagriSayi = useApiAnahtar((s) => s.cagrilar.length);
  const [sekme, setSekme] = useState<"uretim" | "http">("uretim");
  if (!hazir) return <div className="h-[60vh]" />;
  const sayi = (n: number) => <span className="ml-1.5 tabular-nums opacity-55">{n}</span>;
  return (
    <>
      <SayfaBaslik baslik="İstekler" aciklama="Tüm anahtarlarınla yapılan üretimler, kendi sunucundan curl ya da SDK ile yaptıkların dahil. Bir satıra tıkla; girdiyi, çıktıyı, zaman çizelgesini ve webhook teslimlerini gör." />
      <div className="mb-5">
        <SecimSerit id="istek-sekme" deger={sekme} onDegis={setSekme}
          secenek={[{ id: "uretim" as const, ad: <>Üretimler{sayi(uretimSayi)}</> }, { id: "http" as const, ad: <>HTTP günlüğü{sayi(cagriSayi)}</> }]} />
      </div>
      {sekme === "uretim" ? <UretimTablosu seciliId={sp.get("id")} /> : <HttpGunlugu />}
    </>
  );
}
