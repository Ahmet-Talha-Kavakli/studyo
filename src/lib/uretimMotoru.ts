"use client";

import { toast } from "@/lib/toast";
import { useProjeler } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useBildirim } from "@/store/useBildirim";
import { useTercih } from "@/store/useTercih";
import { gradientOnizleme, onizlemeArka } from "./utils";
import { kategoriEtiket, type IhlalKategori } from "./moderasyon";
import type { ModelTur } from "./catalog";

export { gradientOnizleme };

/**
 * uretimBaslat sonucu başarısızsa uygun hata toast'ını gösterir.
 * Kredi yetersizse "Kredi Yükle" aksiyon butonlu toast (Higgsfield birebir yönlendirme).
 * Kullanım: const s = uretimBaslat(...); if (!s.ok) return uretimHataToast(s);
 */
export function uretimHataToast(sonuc: { hata?: string; kod?: "giris" | "kredi" }, baslik = "Üretilemedi") {
  if (sonuc.kod === "kredi") {
    toast.error("Yetersiz kredi", {
      description: sonuc.hata,
      action: { label: "Kredi Yükle", onClick: () => { window.location.href = "/panel/kredi"; } },
    });
  } else if (sonuc.kod === "giris") {
    // Misafir üretmeye kalktı → toast yerine merkezi giriş/kayıt POP-UP'ı aç.
    useAuthKapi.getState().ac({
      baslik: "Üretmek için giriş yap",
      altBaslik: "Ücretsiz kaydol, saniyeler içinde üretmeye başla",
    });
  } else {
    toast.error(baslik, { description: sonuc.hata });
  }
}

/** Üretim türüne göre en uygun stok görsel kategorisi (Higgsfield görünümü). */
function turKategori(tur: ModelTur): string {
  if (tur === "video") return "sinematik";
  if (tur === "3d") return "3d";
  if (tur === "ses") return "soyut";
  if (tur === "muzik") return "soyut";
  return "portre"; // görsel
}

export interface UretimIstek {
  baslik: string;
  tur: ModelTur;
  model: string;
  prompt: string;
  kredi: number;
  arac?: string;
  projeId?: string; // bu üretimi bağlayacağın ortak proje (useProje). Geçilmezse bağımsız üretim.
  /* hamIstem: kullanıcının yazdığı istem — ayar notları hariç.
     Bkz. useProjeler.Uretim.meta açıklaması. */
  meta?: { oran?: string; cozunurluk?: string; sure?: string; ses?: string; gorselUrl?: string; hamIstem?: string };
}

/** ModelTur → API üretim türü. Müzik ses altyapısını kullanır; bilinmeyen türler görsele düşer. */
function apiTuru(tur: ModelTur): "gorsel" | "video" | "ses" | "3d" {
  if (tur === "muzik") return "ses";
  if (tur === "video" || tur === "ses" || tur === "3d") return tur;
  return "gorsel";
}

/**
 * Gerçek çalışır üretim akışı:
 * kredi kontrol → düş → kuyruğa ekle → deterministik progress →
 * /api/uretim'e POST (anahtar varsa GERÇEK sağlayıcı: ElevenLabs/Meshy/OpenAI/Replicate,
 * yoksa simülasyon) → gerçek çıktıyı yerleştir → bildirim.
 * Kredi yetmezse hata döner.
 */
export function uretimBaslat(istek: UretimIstek): { ok: boolean; id?: string; hata?: string; kod?: "giris" | "kredi" } {
  const auth = useAuth.getState();
  const projeler = useProjeler.getState();
  const bildirim = useBildirim.getState();

  if (!auth.kullanici) return { ok: false, hata: "Önce giriş yapmalısın.", kod: "giris" };
  if (auth.kullanici.krediler < istek.kredi)
    return { ok: false, hata: `Bu üretim ${istek.kredi} kredi gerektiriyor, bakiyende ${auth.kullanici.krediler} kredi var.`, kod: "kredi" };

  const oncekiKredi = auth.kullanici.krediler;
  auth.krediDus(istek.kredi);

  // Düşük kredi uyarısı — bakiye 200 eşiğinin ALTINA yeni indiyse bir kez bildir (spam yok).
  const kalanKredi = oncekiKredi - istek.kredi;
  const ESIK = 200;
  if (oncekiKredi >= ESIK && kalanKredi < ESIK && useTercih.getState().bildirimTercih.uretim) {
    // ekleTek: aynı uyarı arka arkaya üretimlerde spam yapmasın.
    bildirim.ekleTek({
      anahtar: kalanKredi <= 0 ? "kredi-bitti" : "kredi-dusuk",
      baslik: kalanKredi <= 0 ? "Kredin bitti ⚠️" : "Kredin azalıyor ⚡",
      mesaj: kalanKredi <= 0
        ? "Bakiyen tükendi. Üretime devam için kredi yükle."
        : `${kalanKredi} kredi kaldı. Kesintisiz üretim için bakiyeni artır.`,
      tur: "uyari",
      link: "/panel/kredi",
    });
  }

  const id = projeler.ekle({
    baslik: istek.baslik,
    tur: istek.tur,
    model: istek.model,
    prompt: istek.prompt,
    durum: "kuyrukta",
    ilerleme: 0,
    kredi: istek.kredi,
    arac: istek.arac,
    projeId: istek.projeId,
    meta: istek.meta,
  });

  // Ortak proje mimarisi: üretim bir projeye aitse o projenin uretimIdler'ine bağla (çift-yönlü erişim).
  if (istek.projeId) {
    try { useProje.getState().uretimBagla(istek.projeId, id, istek.arac === "Shorts Stüdyosu" ? "shorts" : "genel"); } catch { /* proje store hazır değilse sessiz geç */ }
  }

  // İşleme animasyonu — gerçek ilerleyen progress (API yanıtı gelene kadar akar)
  // Hız kademesi (Hız & Güç): Standart 1× · Öncelikli 2× · Turbo 4× — progress o oranda hızlı akar.
  const hizCarpani = [1, 2, 4][useTercih.getState().hizKademe] ?? 1;
  setTimeout(() => projeler.guncelle(id, { durum: "isleniyor", ilerleme: 8 }), 250 / hizCarpani);
  const adimlar = [22, 38, 55, 71, 86];
  const zamanlayicilar = adimlar.map((p, i) =>
    setTimeout(() => projeler.guncelle(id, { ilerleme: p }), (500 + i * 420) / hizCarpani)
  );

  // Minimum "işleniyor" süresi — demo/simülasyon API'si anında dönse bile kullanıcı
  // süreç animasyonunu (spinner + progress) yaşasın (Higgsfield hissi). Türe göre gerçekçi süre.
  const tabanSure = istek.tur === "video" ? 2800 : istek.tur === "3d" ? 3200 : istek.tur === "ses" ? 2000 : 2300;
  const minSure = tabanSure / hizCarpani;
  const baslangic = performance.now();

  // Gerçek üretim çağrısı — arka planda, progress animasyonuyla örtüşür.
  (async () => {
    // Gerçek API çıktısı yoksa: gradyan yerine GERÇEK stok görsel (türüne uygun kategori).
    const yedekOnizleme = onizlemeArka(istek.prompt + istek.model, turKategori(istek.tur));
    try {
      const yanit = await fetch("/api/uretim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tur: apiTuru(istek.tur),
          model: istek.model,
          prompt: istek.prompt,
          meta: istek.meta,
        }),
      });
      const veri = (await yanit.json()) as {
        ok: boolean;
        gercek?: boolean;
        moderasyon?: boolean;
        kategori?: string;
        hata?: string;
        saglayici?: string;
        ciktiUrl?: string;
        dataUri?: string;
        detay?: { glb?: string; thumbnail?: string };
      };

      // MODERASYON REDDİ (422) → üretim "hata", KREDİ İADE + bildirim.
      // Kullanıcı isteği: "NFC(+18) içerik üretiminde hata mesajı + kredilerin geri gelmesi."
      if (veri.moderasyon) {
        zamanlayicilar.forEach(clearTimeout);
        auth.krediEkle(istek.kredi); // iade
        projeler.guncelle(id, { durum: "hata", ilerleme: 0 });
        bildirim.ekle({
          baslik: veri.kategori ? `Üretim engellendi ⛔ · ${kategoriEtiket(veri.kategori as IhlalKategori)}` : "Üretim engellendi ⛔",
          mesaj: `${veri.hata ?? "İçerik politikası ihlali."} ${istek.kredi} kredi iade edildi.`,
          tur: "uyari",
          link: "/panel/kredi",
        });
        return;
      }

      // GERÇEK SUNUCU HATASI (400/500 vb. — ok:false, moderasyon değil): KREDİ İADE + hata bildirimi.
      // Higgsfield birebir: teknik başarısızlıkta kullanıcı kredisini kaybetmez, net hata görür.
      if (!yanit.ok || veri.ok === false) {
        zamanlayicilar.forEach(clearTimeout);
        auth.krediEkle(istek.kredi); // iade
        projeler.guncelle(id, { durum: "hata", ilerleme: 0 });
        bildirim.ekle({
          baslik: "Üretim başarısız ⚠️",
          mesaj: `${veri.hata ?? "Beklenmeyen bir hata oluştu, lütfen tekrar dene."} ${istek.kredi} kredi iade edildi.`,
          tur: "hata",
          link: `/panel/kitaplik?u=${id}`,
          uretimId: id,
        });
        return;
      }

      // Gerçek API çıktısı DEĞİLSE (demo) minimum süreyi bekle — progress akıp bitsin (%86'ya dek),
      // kullanıcı gerçek bir "üretiliyor" süreci görsün. Gerçek API ise bekletme (zaten zaman aldı).
      if (!veri.gercek) {
        const kalan = minSure - (performance.now() - baslangic);
        if (kalan > 0) await new Promise((r) => setTimeout(r, kalan));
      }

      zamanlayicilar.forEach(clearTimeout);
      // Son adım: %96 → sonra tamam (higgs'te olduğu gibi tam bitiş hissi)
      projeler.guncelle(id, { ilerleme: 96 });
      await new Promise((r) => setTimeout(r, 180 / hizCarpani));

      const cikti = veri.dataUri ?? veri.ciktiUrl;
      const tur = apiTuru(istek.tur);
      const sesMi = tur === "ses";
      const ucBoyutMu = tur === "3d";
      const videoMu = tur === "video";
      const glb = veri.detay?.glb ?? (ucBoyutMu ? veri.ciktiUrl : undefined);
      const thumb = veri.detay?.thumbnail;
      // Video URL'i http olmalı (data-uri video pratik değil); yoksa gradient önizleme kalır.
      const videoLink = videoMu && veri.ciktiUrl ? veri.ciktiUrl : undefined;
      projeler.guncelle(id, {
        durum: "tamam",
        ilerleme: 100,
        // Ses → sesUrl; 3D → thumbnail/gradient gorselUrl'e; görsel → gorselUrl; video → gradient önizleme + videoUrl.
        gorselUrl: sesMi ? yedekOnizleme : (ucBoyutMu ? (thumb ?? yedekOnizleme) : (videoMu ? yedekOnizleme : (cikti ?? yedekOnizleme))),
        ...(sesMi && cikti ? { sesUrl: cikti } : {}),
        ...(videoLink ? { videoUrl: videoLink } : {}),
        ...(ucBoyutMu && glb ? { glbUrl: glb } : {}),
        ...(ucBoyutMu && thumb ? { thumbnailUrl: thumb } : {}),
        ...(veri.saglayici ? { saglayici: veri.saglayici, gercek: veri.gercek } : {}),
      });

      const gercekEk = veri.gercek ? "" : " (demo)";
      // Kullanıcı "Üretim tamamlandı" bildirimini kapatmışsa bildirim düşürme (Ayarlar tercihi).
      if (useTercih.getState().bildirimTercih.uretim) {
        bildirim.ekle({
          baslik: `Üretim tamamlandı ✨${gercekEk}`,
          mesaj: `"${istek.baslik}" hazır. Görüntülemek için dokun.`,
          tur: "basari",
          // Derin bağlantı: bildirime tıklayınca kitaplıkta O ÜRETİMİN lightbox'ı açılır.
          link: `/panel/kitaplik?u=${id}`,
          uretimId: id,
        });
      }
    } catch {
      // Hata/çevrimdışı durumunda da minimum süreyi bekle — süreç hissi korunsun (demo).
      const kalan = minSure - (performance.now() - baslangic);
      if (kalan > 0) await new Promise((r) => setTimeout(r, kalan));
      zamanlayicilar.forEach(clearTimeout);
      projeler.guncelle(id, { durum: "tamam", ilerleme: 100, gorselUrl: yedekOnizleme });
      if (useTercih.getState().bildirimTercih.uretim) {
        bildirim.ekle({
          baslik: "Üretim tamamlandı ✨ (demo)",
          mesaj: `"${istek.baslik}" hazır. Görüntülemek için dokun.`,
          tur: "basari",
          link: `/panel/kitaplik?u=${id}`,
          uretimId: id,
        });
      }
    }
  })();

  return { ok: true, id };
}
