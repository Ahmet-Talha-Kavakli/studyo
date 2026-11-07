"use client";

import Link from "next/link";
import { Code2, KeyRound, Activity, Users, BookOpen } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { CubukGrafik, YatayCubuk } from "@/components/admin/grafik";
import { useAdminVeri, sayi, tarih, gorece, gunEtiket } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  bagliAnahtar: number; bagliHesap: number;
  sahipler: { uid: string; email: string; baglanma: number }[];
  anahtarlar: { kid: string; uid: string; email: string; adet: number; kredi: number; iade: number; son: number }[];
  modeller: { ad: string; adet: number }[];
  gunluk: { gun: string; adet: number }[];
}

export default function Gelistirici() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/gelistirici");
  const top30 = r ? r.gunluk.reduce((a, g) => a + g.adet, 0) : 0;
  return (
    <RotaGuard modul="gelistirici">
      <BolumBaslik baslik="Geliştirici" ozet="Vayra API: hesaba bağlı anahtarlar ve kredi harcayan API çağrıları. Anahtarın kendisi saklanmaz, yalnız kısa kimliği görünür." ikon={Code2}
        sag={<Link href="/panel/api/dokuman" className="ad-btn-glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold"><BookOpen className="h-4 w-4" /> API belgeleri</Link>} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Bağlı anahtar" deger={sayi(r.bagliAnahtar)} ikon={KeyRound} alt={`${sayi(r.bagliHesap)} hesap`} />
            <MetrikKart etiket="Çağrı, son 30 gün" deger={sayi(top30)} ikon={Activity} alt="kredi harcayan" />
            <MetrikKart etiket="Kullanılan anahtar" deger={sayi(r.anahtarlar.length)} ikon={KeyRound} alt="en az bir çağrı" />
            <MetrikKart etiket="Toplam API kredisi" deger={sayi(r.anahtarlar.reduce((a, k) => a + k.kredi, 0))} ikon={Users} alt={`${sayi(r.anahtarlar.reduce((a, k) => a + k.iade, 0))} iade`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Activity}>Günlük API çağrısı, son 30 gün</KartBaslik>
              {top30 ? <CubukGrafik veri={r.gunluk.map((g) => ({ etiket: gunEtiket(g.gun), deger: g.adet }))} yukseklik={150} /> : <Bos baslik="Son 30 günde API çağrısı yok" />}
            </Kart>
            <Kart>
              <KartBaslik>Modele göre</KartBaslik>
              {r.modeller.length ? <YatayCubuk veri={r.modeller.map((m) => ({ etiket: m.ad, deger: m.adet }))} /> : <p className={cn("text-sm", AD.metin3)}>Henüz çağrı yok.</p>}
            </Kart>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Anahtar kullanımı</h3>
              {r.anahtarlar.length === 0 ? <Bos ikon={KeyRound} baslik="Henüz API çağrısı yok" /> : (
                <BasitTablo baslik={["Anahtar", "Hesap", "Çağrı", "Kredi", "Son"]} sag={[2, 3]} enAz={560}>
                  {r.anahtarlar.map((k) => (
                    <tr key={k.kid + k.uid} className={satirSinif}>
                      <td className={cn(hucre, "font-mono text-[12px]", AD.metin2)}>{k.kid}</td>
                      <td className={hucre}><Link href={`/admin/kullanicilar/${k.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{k.email}</Link></td>
                      <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(k.adet)}</td>
                      <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.kredi)}</td>
                      <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{gorece(k.son)}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Anahtar bağlanan hesaplar</h3>
              {r.sahipler.length === 0 ? <Bos ikon={Users} baslik="Henüz hesaba bağlı anahtar yok" /> : (
                <BasitTablo baslik={["Hesap", "Bağlanma"]} enAz={360}>
                  {r.sahipler.map((s, i) => (
                    <tr key={i} className={satirSinif}>
                      <td className={hucre}><Link href={`/admin/kullanicilar/${s.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{s.email}</Link></td>
                      <td className={cn(hucre, AD.metin2)}>{tarih(s.baglanma)}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
          </div>
        </>
      )}
    </RotaGuard>
  );
}
