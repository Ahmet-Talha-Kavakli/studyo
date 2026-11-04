"use client";

/**
 * Stüdyo dışından (Kitaplık vb.) bir üretimi açan ortak görüntüleyici.
 * Her tür, kendi stüdyosundaki görüntüleyicinin AYNISIYLA açılır:
 *   görsel → GorselGoruntuleyici (+ aynı Bilgi sekmesi), video → VideoGoruntuleyici,
 *   ses ve müzik → SesGoruntuleyici. 3D'nin ayrı görüntüleyicisi yoktur; 3D stüdyosunda açılır (3dAdresi).
 * Besteci (composer) gerektiren eylemler ilgili stüdyoya referans/istemle geçer.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { neden } from "@/components/studyo/bildirim";
import { saltUrl } from "@/lib/utils";
import { urlIndir, uretimIndir } from "@/lib/gercekEylem";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useYorumlar } from "@/store/useYorumlar";
import { useReferansKopru } from "@/store/useReferansKopru";
import { useAuth } from "@/store/useAuth";
import { GorselGoruntuleyici, type AracIstegi } from "@/components/studyo/GorselGoruntuleyici";
import { VideoGoruntuleyici } from "@/components/studyo/VideoGoruntuleyici";
import { SurumKarti } from "@/components/studyo/sinema/Surumler";
import { SesGoruntuleyici, bicimUzantisi } from "@/components/studyo/ses/SesGoruntuleyici";
import { InfoSekmesi } from "@/components/studyo/gorsel/GorselBilgi";
import { YorumSekmesi } from "@/components/studyo/YorumSekmesi";
import { gorselDepola } from "@/components/studyo/gorsel/RuhModallari";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { copeTasi } from "@/components/kitaplik/eylemler";
import { kapakUrl, turBul, uretimTuru } from "@/components/kitaplik/yardimci";

/** 3D üretimi stüdyosunda açan adres (görüntüleyicisi stüdyonun kendisidir). */
export const ucBoyutAdresi = (u: Uretim) => `/panel/3d?u=${encodeURIComponent(u.id)}`;

const tarih = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const hamIstem = (u: Uretim) => (u.meta?.hamIstem as string | undefined) || u.prompt || u.baslik;

export function UretimGoruntuleyici({ u, liste, onSec, onKapat, projeId }: {
  u: Uretim;
  /** Önceki/sonraki gezinmesi için sıralı liste. */
  liste: Uretim[];
  onSec: (id: string) => void;
  onKapat: () => void;
  /** Araç sonuçlarının ekleneceği proje (kitaplıkta açık proje). */
  projeId?: string;
}) {
  const router = useRouter();
  const guncelle = useProjeler((s) => s.guncelle);
  const ekle = useProjeler((s) => s.ekle);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const surumVar = useProjeler((s) => !!u.meta?.kaynakId || s.uretimler.some((x) => x.meta?.kaynakId === u.id));
  const tumu = useProjeler((s) => s.uretimler);
  const yorumSayisi = useYorumlar((s) => s.yorumlar.filter((y) => y.konuId === u.id).length);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const saglayicilar = useSaglayicilar();
  const hicSaglayiciYok = !!saglayicilar && !["gemini", "seedream", "openai", "fal"].some((k) => saglayicilar[k]);
  const [yorum, setYorum] = useState("");
  const [element, setElement] = useState<{ gorsel: string; aciklama: string } | null>(null);

  const i = liste.findIndex((x) => x.id === u.id);
  const sira = i >= 0 ? { i, n: liste.length } : null;
  const gez = (y: 1 | -1) => { const n = liste[i + y]; if (n) onSec(n.id); };
  const tur = uretimTuru(u);
  const altBaslik = `${u.model} · ${tarih(u.olusturma)}`;
  const adKaydet = (ad: string) => { guncelle(u.id, { baslik: ad }); toast.success("Ad değiştirildi", { description: `Artık “${ad}” olarak görünecek.` }); };
  const sil = () => { copeTasi([u.id]); const n = liste[i + 1] ?? liste[i - 1]; if (n) onSec(n.id); else onKapat(); };
  const begen = () => { favoriToggle(u.id); toast.success(u.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); };
  const studyo = turBul(tur).studyo;
  /** Aynı ayarlarla üretmek için ilgili stüdyoyu istemle açar. */
  const studyodaAc = () => { onKapat(); router.push(`${studyo}?istem=${encodeURIComponent(hamIstem(u))}`); };
  /** Görseli stüdyonun besteci kutusuna referans olarak taşır. */
  const referansla = (url: string, hedef: "gorsel" | "video", istemle = false) => {
    useReferansKopru.getState().gonder({ url, tur: hedef, baslik: u.baslik, prompt: u.prompt });
    onKapat();
    router.push(hedef === "video" ? (istemle ? `/panel/video?istem=${encodeURIComponent(hamIstem(u))}` : "/panel/video") : (istemle ? `/panel/gorsel?istem=${encodeURIComponent(hamIstem(u))}` : "/panel/gorsel"));
  };
  const yorumlar = <YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={u.id} isaretDestek={tur === "gorsel"} />;

  if (tur === "gorsel") {
    const url = kapakUrl(u) ?? u.gorselUrl ?? "";
    const k = u.meta?.kaynakId ? tumu.find((x) => x.id === u.meta?.kaynakId) : undefined;
    const aracCalistir = (a: AracIstegi): boolean => {
      const kaynak = saltUrl(url) ?? url;
      void (async () => {
        let kaynakUrl = kaynak, maskeUrl: string | undefined;
        try {
          if (kaynak.startsWith("data:")) kaynakUrl = await gorselDepola(kaynak);
          if (a.maske) maskeUrl = await gorselDepola(a.maske);
        } catch (e) {
          return void toast.error(`${a.arac} başlatılamadı`, { description: `${neden(e, "Görsel yüklenemedi.")} Yeniden dene.` });
        }
        const sonuc = uretimBaslat({
          baslik: a.baslik, tur: "gorsel", model: a.arac, prompt: a.not, kredi: hicSaglayiciYok ? 0 : a.kredi, arac: a.arac, projeId,
          meta: { islem: a.islem, oran: a.oran ?? u.meta?.oran, gorselUrl: kaynakUrl, ...(maskeUrl ? { maskeUrl } : {}), ...(a.zemin ? { zemin: a.zemin } : {}), hamIstem: a.not, kaynakId: u.id },
        });
        if (!sonuc.ok) uretimHataToast(sonuc, `${a.arac} başlatılamadı`);
      })();
      onKapat();
      toast.success(`${a.arac} başladı`, { description: hicSaglayiciYok ? "Kredi düşmez. Sonuç kitaplığın en üstünde görünecek." : `${a.kredi} kredi. Sonuç kitaplığın en üstünde görünecek.` });
      return true;
    };
    const yerelKaydet = (dataUrl: string, baslik: string) => {
      try {
        const id = ekle({ baslik, tur: "gorsel", model: "Renk ayarı", prompt: baslik, durum: "tamam", ilerleme: 100, kredi: 0, arac: "Renk ayarı", gorselUrl: dataUrl, gercek: true, projeId,
          meta: { oran: u.meta?.oran, hamIstem: u.meta?.hamIstem as string | undefined, kaynakId: u.id } });
        onSec(id);
        toast.success("Renk ayarlı görsel kaydedildi", { description: "Kitaplığa eklendi. Kredi düşmedi." });
      } catch {
        toast.error("Görsel kaydedilemedi", { description: "Tarayıcı depolama alanı dolu olabilir. Görseli indirip saklayabilirsin." });
      }
    };
    const indir = (src?: string, ad = u.baslik || "vayra-gorsel") => {
      const k2 = saltUrl(src) ?? src;
      if (!k2) return void toast.error("Görsel indirilemedi", { description: "Bu görselin dosyası bulunamadı. Sayfayı yenileyip yeniden dene." });
      const dosya = ad.replace(/[^\w\s-]/g, "").trim().slice(0, 40) || "vayra";
      if (urlIndir(k2, `${dosya}.png`)) toast.success("Görsel indiriliyor", { description: `${dosya}.png` }); else toast.error("Görsel indirilemedi", { description: "Tarayıcı indirmeyi engelledi. İndirme izinlerini kontrol edip yeniden dene." });
    };
    return (
      <>
        <GorselGoruntuleyici
          uretimId={u.id} url={url} ad={u.baslik || "Görsel"} altBaslik={altBaslik} onAdKaydet={adKaydet}
          sira={sira} onGez={gez} onKapat={onKapat} ustKatmanAcik={!!element} krediler={krediler}
          onIndir={(src, ad) => indir(src, ad)} onAracCalistir={aracCalistir} onYerelKaydet={yerelKaydet}
          yorumSayisi={yorumSayisi} yorumlar={yorumlar}
          bilgi={
            <InfoSekmesi url={url} uretim={u} prompt={hamIstem(u)}
              onIndir={() => indir(url)}
              onYenidenUret={studyodaAc}
              onAyarlariYukle={studyodaAc}
              onElement={() => setElement({ gorsel: saltUrl(url) ?? url, aciklama: hamIstem(u) })}
              onAnimate={() => referansla(saltUrl(url) ?? url, "video")}
              onReferans={() => referansla(saltUrl(url) ?? url, "gorsel")}
              onRemix={() => referansla(saltUrl(url) ?? url, "gorsel", true)}
              begenili={!!u.favori} onBegen={begen} onSil={sil}
              kaynak={k?.gorselUrl ? { url: saltUrl(k.gorselUrl) ?? k.gorselUrl, ad: k.baslik || "Kaynak", ac: () => onSec(k.id) } : undefined}
              ek={surumVar ? <SurumKarti u={u} tum={tumu} onAc={onSec} /> : undefined} />
          }
        />
        {element && <ElementDuzenleModal element={null} onKapat={() => setElement(null)} tohumDeger={{ gorsel: element.gorsel, aciklama: element.aciklama }} />}
      </>
    );
  }

  if (tur === "video") {
    const k = u.meta?.kaynakId ? tumu.find((x) => x.id === u.meta?.kaynakId) : undefined;
    return (
      <VideoGoruntuleyici
        u={u} ad={u.baslik || "Video"} altBaslik={altBaslik} onAdKaydet={adKaydet}
        sira={sira} onGez={gez} onKapat={onKapat} yorumlar={yorumlar} yorumSayisi={yorumSayisi}
        krediler={krediler} uzatKredi={u.kredi ?? 0}
        onUzat={(kare) => { referansla(kare, "video", true); toast("Video stüdyosuna geçildi", { description: "Son kare başlangıç karesi olarak eklendi. Uzatmayı oradan başlat." }); return true; }}
        onKareBaslangic={(kare) => { referansla(kare, "video"); toast.success("Başlangıç karesi eklendi", { description: "Video stüdyosunda bu kareden yeni video üretebilirsin." }); }}
        onKareKaydet={(kare, an) => {
          ekle({ baslik: `${(u.baslik || "Video").slice(0, 36)} · kare ${an.toFixed(1).replace(".", ",")} sn`, tur: "gorsel", model: "Kare yakalama", prompt: u.prompt, durum: "tamam", ilerleme: 100, kredi: 0, arac: "Video Stüdyosu", gorselUrl: kare, projeId, meta: { kaynakId: u.id } });
          toast.success("Kare görsel olarak kaydedildi", { description: "Kitaplığa eklendi." });
        }}
        onIndir={() => uretimIndir(u)} onAyarlariYukle={studyodaAc} onYenidenUret={studyodaAc} onBegen={begen} onSil={sil}
        kaynak={k ? { poster: saltUrl(k.gorselUrl), ad: k.baslik, ac: () => onSec(k.id) } : undefined}
        ekBilgi={surumVar ? <SurumKarti u={u} tum={tumu} onAc={onSec} /> : undefined}
      />
    );
  }

  return (
    <SesGoruntuleyici
      u={u} sira={sira} onGez={gez} onKapat={onKapat}
      onAdKaydet={(ad) => { guncelle(u.id, { baslik: ad }); toast.success("Ad değiştirildi", { description: `${ad}.${bicimUzantisi(u.meta)} olarak inecek.` }); }}
      yorumlar={yorumlar} yorumSayisi={yorumSayisi}
      onAyarlariYukle={studyodaAc} onYenidenUret={studyodaAc}
      onSeslendir={(metin) => { onKapat(); router.push(`/panel/ses?istem=${encodeURIComponent(metin.slice(0, 4000))}`); }}
      onIndir={() => uretimIndir(u)} onBegen={begen} onSil={sil}
    />
  );
}
