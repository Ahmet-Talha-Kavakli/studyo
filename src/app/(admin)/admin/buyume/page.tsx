"use client";

import { TrendingUp, UserPlus, Gift, Ticket, Trophy, Mail } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { CubukGrafik, YatayCubuk } from "@/components/admin/grafik";
import { useAdminVeri, sayi, tarih, gorece, gunEtiket } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  toplamKayit: number; davetli: number;
  davetler: { davetEden: string; sayi: number; indirimKullanan: number; son: number }[];
  kayitYontem: { etiket: string; deger: number }[];
  hediye: { kayit: number; olusturulan: number; kullanilan: number; iptal: number; kredi: number; son: { olusturan: string; kredi: number; zaman: number; kullanildi?: number; iptal?: number }[] };
  promolar: { kod: string; sayi: number }[];
  gorevler: { kod: string; sayi: number }[];
  haftalik: { hafta: string; kayit: number; davetli: number }[];
  bulten: { sayi: number; son30: number; konular: { etiket: string; deger: number }[]; aboneler: { email: string; konular: string[]; ilk: number; zaman: number }[] };
}

export default function Buyume() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/buyume");
  return (
    <RotaGuard modul="buyume">
      <BolumBaslik baslik="Büyüme" ozet="Davetler, bülten aboneleri, hediye kodları, promosyon ve görev ödülleri; hesap ve ödeme kayıtlarından." ikon={TrendingUp} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Davetle gelen" deger={sayi(r.davetli)} ikon={UserPlus} alt={`toplam ${sayi(r.toplamKayit)} hesap`} />
            <MetrikKart etiket="Hediye kodu" deger={sayi(r.hediye.olusturulan)} ikon={Gift} alt={`${sayi(r.hediye.kullanilan)} kullanıldı, ${sayi(r.hediye.kredi)} kredi`} />
            <MetrikKart etiket="Promosyon kullanımı" deger={sayi(r.promolar.reduce((a, p) => a + p.sayi, 0))} ikon={Ticket} alt={`${sayi(r.promolar.length)} farklı kod`} />
            <MetrikKart etiket="Görev ödülü" deger={sayi(r.gorevler.reduce((a, p) => a + p.sayi, 0))} ikon={Trophy} alt={`${sayi(r.gorevler.length)} görev`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={UserPlus}>Haftalık kayıt, son 12 hafta</KartBaslik>
              {r.haftalik.some((h) => h.kayit) ? (
                <>
                  <CubukGrafik veri={r.haftalik.map((h) => ({ etiket: gunEtiket(h.hafta), deger: h.kayit }))} yukseklik={150} />
                  <p className={cn("mt-2 text-[12px]", AD.metin3)}>Bu sürede davetle gelen: {sayi(r.haftalik.reduce((a, h) => a + h.davetli, 0))}</p>
                </>
              ) : <Bos baslik="Son 12 haftada kayıt yok" />}
            </Kart>
            <Kart>
              <KartBaslik>Kayıt yöntemi</KartBaslik>
              {r.kayitYontem.length ? <YatayCubuk veri={r.kayitYontem.map((k) => ({ ...k, etiket: k.etiket.charAt(0).toLocaleUpperCase("tr") + k.etiket.slice(1) }))} /> : <Bos baslik="Kayıt yok" />}
            </Kart>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>En çok davet getirenler</h3>
              {r.davetler.length === 0 ? <Bos ikon={UserPlus} baslik="Henüz davetle gelen yok" ozet="Davet bağlantısıyla kaydolan hesaplar burada görünür." /> : (
                <BasitTablo baslik={["Davet kodu", "Gelen", "İndirim kullanan", "Son kayıt"]} sag={[1, 2]} enAz={460}>
                  {r.davetler.map((d) => (
                    <tr key={d.davetEden} className={satirSinif}>
                      <td className={cn(hucre, AD.metin)}>{d.davetEden}</td>
                      <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(d.sayi)}</td>
                      <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(d.indirimKullanan)}</td>
                      <td className={cn(hucre, AD.metin2)}>{gorece(d.son)}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Son hediye kodları</h3>
              {r.hediye.son.length === 0 ? <Bos ikon={Gift} baslik="Henüz hediye kodu yok" /> : (
                <BasitTablo baslik={["Oluşturan", "Kredi", "Durum", "Tarih"]} sag={[1]} enAz={460}>
                  {r.hediye.son.map((h, i) => (
                    <tr key={i} className={satirSinif}>
                      <td className={cn(hucre, AD.metin)}>{h.olusturan}</td>
                      <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(h.kredi)}</td>
                      <td className={hucre}><Rozet ton={h.kullanildi ? "basari" : h.iptal ? "notr" : "aksan"}>{h.kullanildi ? "Kullanıldı" : h.iptal ? "İptal" : "Bekliyor"}</Rozet></td>
                      <td className={cn(hucre, AD.metin2)}>{tarih(h.zaman)}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart>
              <KartBaslik ikon={Mail}>Bülten aboneleri</KartBaslik>
              <p className={cn("-mt-1 mb-3 text-[13px]", AD.metin2)}>{sayi(r.bulten.sayi)} abone, son 30 günde {sayi(r.bulten.son30)} yeni</p>
              {r.bulten.konular.length ? <YatayCubuk veri={r.bulten.konular} renk="#fbbf24" /> : <p className={cn("text-sm", AD.metin3)}>Henüz bülten abonesi yok.</p>}
            </Kart>
            <div className="lg:col-span-2">
              {r.bulten.aboneler.length === 0 ? <Bos ikon={Mail} baslik="Henüz bülten abonesi yok" ozet="Blogdaki bülten formundan gelen abonelikler burada görünür." /> : (
                <BasitTablo baslik={["E-posta", "Konular", "Abone oldu"]} enAz={460}>
                  {r.bulten.aboneler.slice(0, 30).map((b) => (
                    <tr key={b.email} className={satirSinif}>
                      <td className={cn(hucre, AD.metin)}>{b.email}</td>
                      <td className={cn(hucre, AD.metin2)}>{b.konular.join(", ")}</td>
                      <td className={cn(hucre, AD.metin2)}>{tarih(b.ilk)}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Kart>
              <KartBaslik ikon={Ticket}>Promosyon kodları</KartBaslik>
              {r.promolar.length ? <YatayCubuk veri={r.promolar.map((p) => ({ etiket: p.kod, deger: p.sayi }))} renk="#a78bfa" /> : <p className={cn("text-sm", AD.metin3)}>Henüz promosyon kodu kullanılmadı.</p>}
            </Kart>
            <Kart>
              <KartBaslik ikon={Trophy}>Görev ödülleri</KartBaslik>
              {r.gorevler.length ? <YatayCubuk veri={r.gorevler.map((p) => ({ etiket: p.kod, deger: p.sayi }))} renk="#34d399" /> : <p className={cn("text-sm", AD.metin3)}>Henüz görev ödülü alınmadı.</p>}
            </Kart>
          </div>
        </>
      )}
    </RotaGuard>
  );
}
