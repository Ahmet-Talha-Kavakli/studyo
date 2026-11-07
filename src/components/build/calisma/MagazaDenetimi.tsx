"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ShieldAlert, ShieldCheck, Wand2 } from "lucide-react";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type Bulgu = { seviye: "kritik" | "uyari" | "bilgi"; kural: string; baslik: string; ayrinti: string; ajan: string; magaza: "ikisi" | "apple" | "google" };

/**
 * Mağaza denetimi (App Store İnceleme Yönergeleri ve Google Play politikalarına göre, kural tabanlı):
 * gizlilik politikası, hesap silme, asgari işlevsellik, dijital ödeme, kullanıcı ve yapay zekâ içeriği, destek bağlantısı,
 * çevrimdışı çalışma, simge boyutu. Sonuç: büyük olasılıkla geçer, düzeltmeyle geçer ya da reddedilme riski yüksek.
 */
export function magazaDenetle(p: Proje): Bulgu[] {
  const d = p.dosyalar;
  const tum = Object.values(d).join("\n");
  const sayfalar = Object.keys(d).filter((y) => y.endsWith(".html"));
  const b: Bulgu[] = [];
  const gizlilik = sayfalar.some((y) => /gizlilik|privacy|kvkk/i.test(y)) || /href=["'][^"']*(gizlilik|privacy|kvkk)[^"']*["']/i.test(tum);
  if (!gizlilik) b.push({ seviye: "kritik", kural: "Apple 5.1.1, Google Play Kullanıcı Verileri", magaza: "ikisi", baslik: "Gizlilik politikası yok", ayrinti: "İki mağaza da uygulama içinden ve mağaza sayfasından erişilen bir gizlilik politikası ister.", ajan: "Uygulamaya KVKK'ya uygun bir gizlilik politikası sayfası (gizlilik.html) ekle; hangi verilerin toplandığını, nerede saklandığını, nasıl silineceğini ve iletişim adresini yaz; ayarlar ya da alt menüden bağlantı ver." });
  const uyelik = /vayra\.uye\.(kayit|giris)/.test(tum);
  if (uyelik && !/hesab[ıi]m?[ıi]? ?sil|hesap silme|delete account|vayra\.uye\.hesabiSil/i.test(tum)) b.push({ seviye: "kritik", kural: "Apple 5.1.1(v), Google Play hesap silme", magaza: "ikisi", baslik: "Hesap silme yolu yok", ayrinti: "Kayıt olunabilen uygulamalarda kullanıcı hesabını uygulama içinden silebilmeli.", ajan: "Uygulamaya Hesabım ekranında 'Hesabımı sil' seçeneği ekle: onay iste, kullanıcının kayıtlarını sil, oturumu kapat. Hesap silme köprüde yoksa kullanıcıya silme isteğini veritabanına yazan bir form sun ve bunu özette belirt." });
  const etkilesim = /addEventListener|onclick=|vayra\.veri|localStorage|<form/i.test(tum);
  const sw = /serviceWorker\.register/.test(tum);
  if (sayfalar.length <= 1 && !etkilesim) b.push({ seviye: "kritik", kural: "Apple 4.2 Asgari işlevsellik", magaza: "apple", baslik: "Uygulama bir web sayfası gibi duruyor", ayrinti: "Apple, yalnız bir siteyi saran ve uygulamaya özgü işlevi olmayan uygulamaları reddeder.", ajan: "Uygulamaya uygulamaya özgü işlevler ekle: kayıtlı veriler, kişiselleştirme, çevrimdışı çalışma (service worker), alt sekme gezinmesi ve telefon dostu etkileşimler." });
  if (!sw) b.push({ seviye: "uyari", kural: "Google Play TWA, Apple 4.2", magaza: "ikisi", baslik: "Çevrimdışı çalışma yok", ayrinti: "Service worker olmadan uygulama internetsiz açılmaz; Play paketlemesi ve Apple incelemesi için zayıf noktadır.", ajan: "Uygulamaya bir service worker (sw.js) ekle ve index.html'den kaydet: kabuk dosyalarını önbelleğe alsın, internet yokken anlamlı bir çevrimdışı ekranı göstersin." });
  const odeme = /iyzico|paytr|stripe|checkout|odeme|ödeme/i.test(tum);
  const dijital = /abonelik|premium|pro plan|üyelik planı|kredi paketi|reklamsız|kilidi aç/i.test(tum);
  if (odeme && dijital) b.push({ seviye: "uyari", kural: "Apple 3.1.1 Uygulama içi satın alma", magaza: "apple", baslik: "Dijital içerik dış ödemeyle satılıyor gibi", ayrinti: "Uygulamada kullanılan dijital içerik ve abonelikler App Store'da uygulama içi satın almayla satılmalı; fiziksel ürün ve hizmetler serbesttir.", ajan: "Uygulamadaki ödeme akışını gözden geçir: dijital içerik ya da abonelik satıyorsa iOS sürümünde dış ödeme bağlantısını gizle ve bunu özette belirt; fiziksel ürün ya da hizmet satıyorsa ödeme sayfasında bunu açıkça yaz." });
  const icerik = /vayra\.ai\.|yorum|gonderi|gönderi|paylaş/i.test(tum) && /vayra\.veri\.ekle|vayra\.ai\./.test(tum);
  if (icerik && !/şikayet|şikâyet|bildir|engelle|report|block/i.test(tum)) b.push({ seviye: "uyari", kural: "Apple 1.2 Kullanıcı içeriği", magaza: "ikisi", baslik: "İçerik bildirme ve engelleme yok", ayrinti: "Kullanıcıların ya da yapay zekânın ürettiği içerik görünüyorsa şikâyet etme, engelleme ve süzme yolu gerekir.", ajan: "Kullanıcıların ya da yapay zekânın ürettiği her içeriğin yanına 'Bildir' seçeneği ekle (bildirimler veritabanına yazılsın), kullanıcı engelleme ekle ve kullanım koşullarında uygunsuz içeriğe izin verilmediğini yaz." });
  if (!/mailto:|tel:|iletisim|iletişim|destek|support/i.test(tum)) b.push({ seviye: "uyari", kural: "Apple 1.5 Geliştirici bilgisi", magaza: "apple", baslik: "Destek ve iletişim bağlantısı yok", ayrinti: "Mağaza, kullanıcıların ulaşabileceği bir destek adresi ister.", ajan: "Uygulamaya ayarlar ya da hakkında ekranında destek e-postası (mailto) ve iletişim sayfası bağlantısı ekle." });
  const man = Object.entries(d).find(([y]) => /manifest\.(webmanifest|json)$/.test(y))?.[1];
  let ikon512 = false;
  try { ikon512 = !!(man && (JSON.parse(man).icons as { sizes?: string }[] | undefined)?.some((i) => /512/.test(i.sizes ?? ""))); } catch { /* bozuk */ }
  if (!ikon512) b.push({ seviye: "uyari", kural: "Mağaza simgesi", magaza: "ikisi", baslik: "512 piksel simge yok", ayrinti: "Play 512, App Store 1024 piksel simge ister; paketleme bu simgeden üretir.", ajan: "Uygulama için 1024 piksel kare bir simge üret (gorsel_uret, 1:1) ve manifest.webmanifest'e 192 ve 512 boyutlarıyla ekle." });
  if (!/<meta[^>]+name=["']viewport["'][^>]*user-scalable=no|maximum-scale=1/i.test(d["index.html"] ?? "")) b.push({ seviye: "bilgi", kural: "Uygulama hissi", magaza: "ikisi", baslik: "Sayfa yakınlaştırılabiliyor", ayrinti: "Uygulama gibi hissettirmek için çift dokunarak yakınlaştırmayı kapatmak ve dokunma alanlarını en az 44 piksel yapmak önerilir.", ajan: "Uygulamada dokunma alanlarını en az 44 piksel yap ve çift dokunmayla yakınlaştırmayı kapat (erişilebilirliği bozmadan)." });
  return b;
}

export function MagazaDenetimi({ p, duzelt }: { p: Proje; duzelt: (metin: string) => void }) {
  const l = useMemo(() => magazaDenetle(p), [p]);
  const [acik, setAcik] = useState(false);
  const kritik = l.filter((x) => x.seviye === "kritik").length, uyari = l.filter((x) => x.seviye === "uyari").length;
  const karar = kritik ? { ad: "Reddedilme riski yüksek", sinif: "text-rose-200", ikon: ShieldAlert } : uyari ? { ad: "Düzeltmelerle geçer", sinif: "text-amber-200", ikon: ShieldAlert } : { ad: "Büyük olasılıkla geçer", sinif: "text-[#8be6ff]", ikon: ShieldCheck };
  return (
    <div className="mt-3 overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left">
        <karar.ikon className={cn("h-4 w-4 shrink-0", karar.sinif)} />
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Mağaza incelemesi: <span className={karar.sinif}>{karar.ad}</span></span><span className="block text-[11.5px] text-white/45">App Store yönergeleri ve Google Play politikalarına göre {l.length ? `${l.length} madde` : "sorun yok"}</span></span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik && "rotate-180")} />
      </button>
      {acik && (
        <div className="space-y-2 border-t border-white/[0.06] px-3.5 py-3">
          {l.map((x) => (
            <div key={x.baslik} className="flex items-start gap-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", x.seviye === "kritik" ? "bg-rose-400" : x.seviye === "uyari" ? "bg-amber-300" : "bg-white/30")} />
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white/90">{x.baslik}</span><span className="block text-[12px] leading-snug text-white/50">{x.ayrinti}</span><span className="block text-[11px] text-white/35">{x.kural} · {x.magaza === "ikisi" ? "iki mağaza" : x.magaza === "apple" ? "App Store" : "Google Play"}</span></span>
              <button type="button" onClick={() => duzelt(x.ajan)} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.12]"><Wand2 className="h-3 w-3" />Düzelt</button>
            </div>
          ))}
          {l.length > 1 && <button type="button" onClick={() => duzelt(`Uygulamayı App Store ve Google Play incelemesine hazırla; şu eksikleri gider:\n${l.map((x) => `- ${x.ajan}`).join("\n")}`)} className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Hepsini ajana düzelttir</button>}
          {!l.length && <p className="text-[12.5px] text-white/55">Yönergelere göre bilinen bir sorun yok. Yine de son kararı mağaza incelemecisi verir.</p>}
        </div>
      )}
    </div>
  );
}
