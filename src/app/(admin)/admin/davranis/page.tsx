"use client";

import Link from "next/link";
import { Activity, Monitor, Globe, LogIn, Users2, Clock, ShieldAlert } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { DonutGrafik, YatayCubuk } from "@/components/admin/grafik";
import { Heatmap } from "@/components/admin/grafik/Heatmap";
import { useAdminVeri, sayi, tarihSaat, gorece } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

type L = { etiket: string; deger: number }[];
interface Rapor {
  acikOturum: number; cihazTuru: L; tarayici: L; isletim: L; yontem: L; girisIsi: number[][]; olayTur: L;
  cokluHesap: { ip: string; hesaplar: { uid: string; email: string }[] }[];
  sonOlaylar: { zaman: number; tur: string; uid: string; email: string; cihaz: string; ayrinti?: string; ip?: string }[];
  sonGorulme: { uid: string; email: string; ad: string; son: number }[];
}
const CIHAZ_AD: Record<string, string> = { masaustu: "Masaüstü", mobil: "Mobil", tablet: "Tablet" };
const OLAY_AD: Record<string, string> = {
  giris: "Giriş", "giris-hatali": "Hatalı giriş", cikis: "Çıkış", kayit: "Kayıt", sifre: "Şifre değişti", "2fa-ac": "İki adım açıldı", "2fa-kapat": "İki adım kapatıldı",
  "yedek-kod": "Yedek kod", "yedek-yenile": "Yedek kod yenileme", eposta: "E-posta değişikliği", "oturum-kapat": "Oturum kapatma", "veri-indir": "Veri indirme",
  "eposta-dogrula": "E-posta doğrulama", sifirla: "Şifre sıfırlama", "saglayici-bagla": "Sosyal hesap bağlama", "saglayici-kaldir": "Sosyal hesap kaldırma", kilit: "Kilit ya da askı",
};
const RENK = ["#55d6fd", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];

export default function Davranis() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/davranis");
  const sayac = (t: string) => r?.olayTur.find((x) => x.etiket === t)?.deger ?? 0;
  return (
    <RotaGuard modul="analitik">
      <BolumBaslik baslik="Davranış" ozet="Oturumlar, cihazlar ve giriş olayları; son 90 gün. Sayfa içi tıklama izlenmez." ikon={Activity} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Açık oturum" deger={sayi(r.acikOturum)} ikon={Monitor} />
            <MetrikKart etiket="Giriş, son 90 gün" deger={sayi(sayac("giris"))} ikon={LogIn} alt={`${sayi(sayac("kayit"))} kayıt`} />
            <MetrikKart etiket="Hatalı giriş" deger={sayi(sayac("giris-hatali"))} ikon={ShieldAlert} alt={`${sayi(sayac("kilit"))} kilit`} />
            <MetrikKart etiket="Aynı IP'den çoklu hesap" deger={sayi(r.cokluHesap.length)} ikon={Users2} alt="IP adresi grubu" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart>
              <KartBaslik ikon={Monitor}>Cihaz türü</KartBaslik>
              {r.cihazTuru.length ? <DonutGrafik veri={r.cihazTuru.map((x, i) => ({ etiket: CIHAZ_AD[x.etiket] ?? x.etiket, deger: x.deger, renk: RENK[i % RENK.length] }))} boyut={120} /> : <Bos baslik="Açık oturum yok" />}
            </Kart>
            <Kart>
              <KartBaslik ikon={Globe}>Tarayıcı</KartBaslik>
              {r.tarayici.length ? <YatayCubuk veri={r.tarayici} /> : <Bos baslik="Veri yok" />}
            </Kart>
            <Kart>
              <KartBaslik>İşletim sistemi ve giriş yöntemi</KartBaslik>
              {r.isletim.length ? <YatayCubuk veri={r.isletim} renk="#a78bfa" /> : <Bos baslik="Veri yok" />}
              {r.yontem.length > 0 && <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-4"><YatayCubuk veri={r.yontem} renk="#34d399" /></div>}
            </Kart>
          </div>

          <Kart className="mt-4">
            <KartBaslik ikon={Clock}>Giriş saatleri (İstanbul saati)</KartBaslik>
            {r.girisIsi.flat().some(Boolean) ? <Heatmap veri={r.girisIsi} birim="giriş" /> : <Bos baslik="Son 90 günde giriş yok" />}
          </Kart>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Kart>
              <KartBaslik ikon={Users2}>Aynı IP adresinden açılan hesaplar</KartBaslik>
              <p className={cn("-mt-1 mb-3 text-[12px]", AD.metin3)}>Oturum ve kayıt IP'lerinden. Aynı ev ya da ofis ağı da burada görünür; tek başına kötüye kullanım kanıtı değildir.</p>
              {r.cokluHesap.length === 0 ? <Bos baslik="Çoklu hesap görülmedi" /> : (
                <div className="space-y-2">
                  {r.cokluHesap.map((c) => (
                    <div key={c.ip} className="rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2">
                      <div className="flex items-center justify-between text-[13px]"><span className={cn("font-mono", AD.metin2)}>{c.ip}</span><Rozet ton="uyari">{c.hesaplar.length} hesap</Rozet></div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">{c.hesaplar.map((h) => <Link key={h.uid} href={`/admin/kullanicilar/${h.uid}`} className="text-[12px] text-[color:var(--ad-aksan)] hover:underline">{h.email}</Link>)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Kart>
            <Kart>
              <KartBaslik>Son görülenler</KartBaslik>
              {r.sonGorulme.length === 0 ? <Bos baslik="Hesap yok" /> : r.sonGorulme.map((h) => (
                <Link key={h.uid} href={`/admin/kullanicilar/${h.uid}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] hover:bg-white/[0.04]">
                  <span className={cn("min-w-0 truncate", AD.metin)}>{h.ad || h.email}<span className={cn("ml-2 text-[12px]", AD.metin3)}>{h.email}</span></span>
                  <span className={cn("shrink-0 text-[12px]", AD.metin3)}>{gorece(h.son)}</span>
                </Link>
              ))}
            </Kart>
          </div>

          <h3 className={cn("mb-3 mt-6 text-sm font-bold", AD.metin)}>Son hesap olayları</h3>
          {r.sonOlaylar.length === 0 ? <Bos baslik="Olay yok" /> : (
            <BasitTablo baslik={["Zaman", "Olay", "Hesap", "Cihaz", "Ayrıntı"]} enAz={820}>
              {r.sonOlaylar.map((o, i) => (
                <tr key={i} className={satirSinif}>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(o.zaman)}</td>
                  <td className={hucre}><Rozet ton={o.tur === "giris-hatali" || o.tur === "kilit" ? "tehlike" : o.tur === "kayit" ? "mor" : "notr"}>{OLAY_AD[o.tur] ?? o.tur}</Rozet></td>
                  <td className={hucre}><Link href={`/admin/kullanicilar/${o.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{o.email}</Link></td>
                  <td className={cn(hucre, AD.metin2)}>{o.cihaz}{o.ip ? ` · ${o.ip}` : ""}</td>
                  <td className={cn(hucre, AD.metin3)}>{o.ayrinti ?? ""}</td>
                </tr>
              ))}
            </BasitTablo>
          )}
        </>
      )}
    </RotaGuard>
  );
}
