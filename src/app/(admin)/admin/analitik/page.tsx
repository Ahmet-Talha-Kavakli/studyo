"use client";

import { useState } from "react";
import { LineChart, Users, Activity, Coins, Filter, Grid3x3 } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, FiltreCip, HataKutusu, Kart, KartBaslik, MetrikKart, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { CizgiGrafik, DonutGrafik, YatayCubuk } from "@/components/admin/grafik";
import { Funnel } from "@/components/admin/grafik/Funnel";
import { CohortMatris } from "@/components/admin/grafik/CohortMatris";
import { useAdminVeri, sayi, gunEtiket, PLAN_AD, PLAN_RENK } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  gun: number;
  seri: { gun: string; kayit: number; aktif: number; uretim: number; kredi: number; odeme: number }[];
  huni: { asama: string; sayi: number }[];
  kohortlar: { hafta: string; boyut: number; oranlar: (number | null)[] }[];
  kaynaklar: { kaynak: string; etiket: string; adet: number; kredi: number; kullanici: number }[];
  harcamaSinif: { sinif: string; etiket: string; kredi: number }[];
  planlar: Record<string, number>;
  aktif: { gun7: number; gun30: number; toplam: number };
}
const RENK = ["#55d6fd", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#f87171", "#94a3b8", "#60a5fa"];

export default function Analitik() {
  const [gun, setGun] = useState(30);
  const { veri: r, hata, yenile, yukleniyor } = useAdminVeri<Rapor>(`/api/admin/analitik?gun=${gun}`);
  const toplam = (k: keyof Rapor["seri"][number]) => (r ? r.seri.reduce((a, g) => a + (g[k] as number), 0) : 0);
  const adim = r ? Math.max(1, Math.ceil(r.seri.length / 8)) : 1;

  return (
    <RotaGuard modul="analitik">
      <BolumBaslik baslik="Analitik" ozet="Kayıt, kullanım ve elde tutma. Kullanım, kredi defterindeki harcamalardan hesaplanır." ikon={LineChart}
        sag={<div className="flex gap-2">{[7, 30, 90, 365].map((g) => <FiltreCip key={g} aktif={gun === g} onClick={() => setGun(g)}>{g === 365 ? "1 yıl" : `${g} gün`}</FiltreCip>)}</div>} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <div className={cn("transition-opacity", yukleniyor && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket={`Kayıt, son ${r.gun} gün`} deger={sayi(toplam("kayit"))} ikon={Users} alt={`toplam ${sayi(r.aktif.toplam)} hesap`} />
            <MetrikKart etiket="Üretim yapan, son 7 gün" deger={sayi(r.aktif.gun7)} ikon={Activity} alt={`son 30 gün ${sayi(r.aktif.gun30)}`} />
            <MetrikKart etiket={`Üretim, son ${r.gun} gün`} deger={sayi(toplam("uretim"))} ikon={Activity} alt="kredi harcayan işler" />
            <MetrikKart etiket={`Harcanan kredi, son ${r.gun} gün`} deger={sayi(toplam("kredi"))} ikon={Coins} alt={`${sayi(toplam("odeme"))} ödeme`} />
          </div>

          <Kart className="mt-4">
            <KartBaslik ikon={LineChart}>Günlük eğilim</KartBaslik>
            {r.seri.some((g) => g.kayit || g.aktif || g.uretim) ? (
              <>
                <CizgiGrafik seriler={[{ ad: "Kayıt", renk: "#a78bfa", veri: r.seri.map((g) => g.kayit) }, { ad: "Üretim yapan kişi", renk: "#55d6fd", veri: r.seri.map((g) => g.aktif) }, { ad: "Ödeme", renk: "#34d399", veri: r.seri.map((g) => g.odeme) }]} yukseklik={190} />
                <div className={cn("mt-1 flex justify-between text-[10px]", AD.metin3)}>{r.seri.map((g, i) => (i % adim === 0 || i === r.seri.length - 1 ? <span key={g.gun}>{gunEtiket(g.gun)}</span> : null))}</div>
              </>
            ) : <Bos baslik="Bu aralıkta hareket yok" />}
          </Kart>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Kart>
              <KartBaslik ikon={Filter}>Huni, son {r.gun} günde kaydolanlar</KartBaslik>
              {r.huni[0]?.sayi ? <Funnel adimlar={r.huni} /> : <Bos baslik="Bu aralıkta kayıt yok" />}
            </Kart>
            <Kart>
              <KartBaslik>Plan dağılımı</KartBaslik>
              {Object.keys(r.planlar).length ? <DonutGrafik veri={Object.entries(r.planlar).map(([k, v]) => ({ etiket: PLAN_AD[k] ?? k, deger: v, renk: PLAN_RENK[k] ?? "#64748b" }))} boyut={140} /> : <Bos baslik="Hesap yok" />}
              {r.harcamaSinif.length > 0 && (
                <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-4">
                  <p className={cn("mb-2 text-[12px]", AD.metin3)}>Harcanan kredinin dağılımı</p>
                  <DonutGrafik veri={r.harcamaSinif.map((x, i) => ({ etiket: x.etiket, deger: x.kredi, renk: RENK[i % RENK.length] }))} boyut={120} />
                </div>
              )}
            </Kart>
          </div>

          <Kart className="mt-4">
            <KartBaslik ikon={Grid3x3}>Haftalık elde tutma</KartBaslik>
            {r.kohortlar.some((k) => k.boyut) ? <CohortMatris satirlar={r.kohortlar} /> : <Bos baslik="Son sekiz haftada kayıt yok" />}
          </Kart>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Kart>
              <KartBaslik ikon={Coins}>Stüdyolara göre kredi</KartBaslik>
              {r.kaynaklar.length ? <YatayCubuk veri={r.kaynaklar.slice(0, 10).map((k) => ({ etiket: k.etiket, deger: k.kredi, alt: `${sayi(k.kredi)} kredi` }))} /> : <Bos baslik="Bu aralıkta kullanım yok" />}
            </Kart>
            {r.kaynaklar.length > 0 && (
              <BasitTablo baslik={["Kaynak", "İş", "Kredi", "Kişi"]} sag={[1, 2, 3]} enAz={420}>
                {r.kaynaklar.map((k) => (
                  <tr key={k.kaynak} className={satirSinif}>
                    <td className={cn(hucre, AD.metin)}>{k.etiket}<div className={cn("text-[11px]", AD.metin3)}>{k.kaynak}</div></td>
                    <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.adet)}</td>
                    <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(k.kredi)}</td>
                    <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.kullanici)}</td>
                  </tr>
                ))}
              </BasitTablo>
            )}
          </div>
        </div>
      )}
    </RotaGuard>
  );
}
