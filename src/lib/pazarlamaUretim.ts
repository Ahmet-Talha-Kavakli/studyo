"use client";

import { toast } from "@/lib/toast";
import { uretimBaslat, uretimHataToast } from "./uretimMotoru";
import { icerikDenetle } from "./moderasyon";
import { PAZ_KREDI } from "./pazarlamaVeri";

/* ============================================================
   PAZARLAMA ÜRETİM KÖPRÜSÜ

   Tüm pazarlama ekranları (ana composer, Ürün Bağlantısı sihirbazı,
   Reklam Referansı sihirbazı) üretimi BURADAN başlatır. Böylece
   moderasyon → kredi kontrolü → gerçek /api/uretim çağrısı tek
   yerde toplanır ve üretimler `arac: "Pazarlama Stüdyosu"` ile
   damgalanır (Üretimler/Favoriler ekranları buna göre süzer).
   ============================================================ */

export interface PazUretIstek {
  istem: string;
  stilAdi: string;
  oran: string;
  kalite: string;
  sure: string;
  /** Ürün eklenmişse indirimli kredi kademesi uygulanır (referans birebir). */
  urunlu: boolean;
  /** Uygulama modu ayrı kredi kademesi kullanır. */
  uygulamaModu?: boolean;
}

/** Üretimi başlatır. Başarılıysa true döner (çağıran yönlendirme yapabilir). */
export function pazUret(istek: PazUretIstek): boolean {
  const metin = istek.istem.trim();
  if (metin.length < 3) {
    toast.error("İstem çok kısa", { description: "Reklamda ne olacağını en az birkaç kelimeyle anlat." });
    return false;
  }

  // İçerik politikası — reddedilirse kredi hiç düşmez.
  const denetim = icerikDenetle(metin);
  if (!denetim.izin) {
    toast.error("Üretim engellendi", { description: denetim.mesaj ?? "İstem içerik kurallarına takıldı. İstemi değiştirip yeniden dene." });
    return false;
  }

  const kademe = istek.uygulamaModu
    ? PAZ_KREDI.app
    : istek.urunlu ? PAZ_KREDI.urunlu : PAZ_KREDI.urunsuz;

  const sonuc = uretimBaslat({
    baslik: `${istek.stilAdi} · ${metin.slice(0, 38)}${metin.length > 38 ? "…" : ""}`,
    tur: "video",
    model: "Vayra Reklam 2",
    prompt: metin,
    kredi: kademe.indirimli,
    arac: "Pazarlama Stüdyosu",
    meta: {
      oran: istek.oran,
      cozunurluk: istek.kalite,
      sure: istek.sure,
    },
  });

  if (!sonuc.ok) {
    uretimHataToast(sonuc);
    return false;
  }

  toast.success("Reklam üretimi başladı", { description: "İlerlemeyi Üretimler ekranında izleyebilirsin." });
  return true;
}
