"use client";

import Link from "next/link";
import { Scale, Download, Trash2, Archive, Clock, MailWarning } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, sayi, tarih, tarihSaat, gorece } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  indirme: { zaman: number; uid: string; email: string; cihaz: string }[];
  yoneticiSilme: { id: string; zaman: number; admin: { email: string }; hedef?: { uid?: string; email?: string }; ayrinti?: string }[];
  kimliksizSiparis: number;
  dogrulanmamisEski: { uid: string; email: string; olusturma: number; son: number }[];
  hesapSayisi: number;
}

/* Saklama süreleri kodun kendisinden (sabitler); burada yalnız açıklanır. */
const SAKLAMA = [
  { veri: "Oturum", sure: "30 gün; bitince ilk temizlikte silinir", yer: "hesap/oturum" },
  { veri: "Hesap güvenlik olayları", sure: "Son 200 olay, hesapla birlikte silinir", yer: "hesap/kullanici" },
  { veri: "Tek kullanımlık bağlantılar", sure: "Doğrulama 24 saat, sıfırlama 1 saat; süresi geçen saatlik temizlenir", yer: "hesap/belirtec" },
  { veri: "Kredi defteri", sure: "Hesap durdukça; hesap silinince silinir", yer: "hesap/kredi" },
  { veri: "Siparişler (mali kayıt)", sure: "Hesap silinince kimlik, fatura ve IP atılır; tutar ve tarih saklanır", yer: "odeme/siparis" },
  { veri: "Ödeme sağlayıcı bildirimleri", sure: "45 gün (tekrar oynatma koruması)", yer: "odeme/olay" },
  { veri: "Build ajan çalışmaları", sure: "Ajan başına son 2000 çalışma", yer: "build/ajan-calisma" },
  { veri: "Destek talepleri", sure: "Elle kapatılana ve silinene kadar", yer: "destek" },
  { veri: "Yönetici denetim günlüğü", sure: "Süresiz, yalnız sona eklenir", yer: "yonetim/denetim.ndjson" },
  { veri: "Engellenen istemler", sure: "İstemin ilk 200 karakteri, kullanıcı kimliği olmadan", yer: "yonetim/moderasyon.ndjson" },
];

export default function Kvkk() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/kvkk");
  return (
    <RotaGuard modul="kvkk">
      <BolumBaslik baslik="KVKK" ozet="Erişim ve silme hakları, saklama süreleri. Bir hesabın kişisel veri dökümü kullanıcı ayrıntısından indirilir." ikon={Scale} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Kullanıcının indirdiği veri" deger={sayi(r.indirme.length)} ikon={Download} alt="Ayarlar, Hesap üzerinden" />
            <MetrikKart etiket="Yöneticinin sildiği hesap" deger={sayi(r.yoneticiSilme.length)} ikon={Trash2} alt="denetim günlüğünden" />
            <MetrikKart etiket="Kimliksiz sipariş" deger={sayi(r.kimliksizSiparis)} ikon={Archive} alt="silinen hesaplardan kalan mali kayıt" />
            <MetrikKart etiket="30 günden eski, doğrulanmamış" deger={sayi(r.dogrulanmamisEski.length)} ikon={MailWarning} alt={`toplam ${sayi(r.hesapSayisi)} hesap`} />
          </div>

          <Kart className="mt-4">
            <KartBaslik ikon={Scale}>Talep geldiğinde</KartBaslik>
            <ol className={cn("list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed", AD.metin2)}>
              <li>Kullanıcılar sayfasında hesabı bul. Kimliği talep e-postasıyla eşleştir.</li>
              <li>Erişim talebinde hesap ayrıntısında Veri dökümü ile JSON dosyasını indir ve kullanıcıya ilet. Gizli alanlar (şifre özeti, iki adım sırrı, oturum belirteçleri) dosyada yoktur.</li>
              <li>Silme talebinde Hesabı sil işlemini kullan; neden alanına talep numarasını yaz. Kullanıcı kendisi de Ayarlar, Hesap bölümünden silebilir.</li>
              <li>Her iki işlem de denetim günlüğüne yazılır.</li>
            </ol>
          </Kart>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Veri indirme kayıtları</h3>
              {r.indirme.length === 0 ? <Bos ikon={Download} baslik="Henüz veri indirilmedi" /> : (
                <BasitTablo baslik={["Zaman", "Hesap", "Cihaz"]} enAz={460}>
                  {r.indirme.map((x, i) => (
                    <tr key={i} className={satirSinif}>
                      <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(x.zaman)}</td>
                      <td className={hucre}><Link href={`/admin/kullanicilar/${x.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{x.email}</Link></td>
                      <td className={cn(hucre, AD.metin3)}>{x.cihaz}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
            <div>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Yöneticinin sildiği hesaplar</h3>
              {r.yoneticiSilme.length === 0 ? <Bos ikon={Trash2} baslik="Yönetici tarafından silinen hesap yok" /> : (
                <BasitTablo baslik={["Zaman", "Hesap", "Yönetici", "Neden"]} enAz={560}>
                  {r.yoneticiSilme.map((x) => (
                    <tr key={x.id} className={satirSinif}>
                      <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(x.zaman)}</td>
                      <td className={cn(hucre, AD.metin)}>{x.hedef?.email ?? ""}</td>
                      <td className={cn(hucre, AD.metin2)}>{x.admin.email}</td>
                      <td className={cn(hucre, AD.metin3)}>{x.ayrinti ?? ""}</td>
                    </tr>
                  ))}
                </BasitTablo>
              )}
            </div>
          </div>

          <h3 className={cn("mb-3 mt-6 flex items-center gap-2 text-sm font-bold", AD.metin)}><Clock className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Saklama süreleri</h3>
          <BasitTablo baslik={["Veri", "Süre", "Konum"]} enAz={640}>
            {SAKLAMA.map((s) => (
              <tr key={s.veri} className={satirSinif}>
                <td className={cn(hucre, AD.metin)}>{s.veri}</td>
                <td className={cn(hucre, AD.metin2)}>{s.sure}</td>
                <td className={cn(hucre, "font-mono text-[12px]", AD.metin3)}>{s.yer}</td>
              </tr>
            ))}
          </BasitTablo>

          {r.dogrulanmamisEski.length > 0 && (
            <>
              <h3 className={cn("mb-3 mt-6 text-sm font-bold", AD.metin)}>30 günden eski, e-postası doğrulanmamış hesaplar</h3>
              <BasitTablo baslik={["Hesap", "Kayıt", "Son görülme"]} enAz={460}>
                {r.dogrulanmamisEski.map((x) => (
                  <tr key={x.uid} className={satirSinif}>
                    <td className={hucre}><Link href={`/admin/kullanicilar/${x.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{x.email}</Link></td>
                    <td className={cn(hucre, AD.metin2)}>{tarih(x.olusturma)}</td>
                    <td className={cn(hucre, AD.metin2)}>{gorece(x.son)}</td>
                  </tr>
                ))}
              </BasitTablo>
            </>
          )}
        </>
      )}
    </RotaGuard>
  );
}
