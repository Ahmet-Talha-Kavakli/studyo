"use client";

/**
 * YENİDEN ÇERÇEVELE (Reframe) — Higgsfield create-reframe mobil akışı BİREBİR.
 * Referans: ~/Desktop/responsive/create-reframe (4 ekran).
 *
 * Yapı:
 *  ┌ "Yeniden Çerçevele ⌄" + ✕
 *  │ ÜST BANNER: video önizleme + sağ-üst "Nasıl çalışır" + lime başlık +
 *  │   "Videoları herhangi bir en-boy oranına çevir ve yeniden boyutlandır"
 *  │ kesikli yükleme kutusu: kamera ikonu + "Yeniden çerçevelemek için video yükle"
 *  │ Model kartı: "Vayra Reframe 〰" + ›
 *  ├ ALT ÇİPLER: oran (DİKEY liste — grid DEĞİL!) + kalite
 *  └ "Üret" (video yokken pasif)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Video, BookOpen, ChevronRight } from "lucide-react";
import {
  MobilComposerKabuk, MobilAltCip, MobilUretButonu, MobilSecici,
  type SeciciOge,
} from "@/components/panel/MobilComposer";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

/* Reframe modelleri — referans "All models" birebir. */
const MODELLER: SeciciOge[] = [
  { id: "gemini", ad: "Gemini Omni Flash", ozet: "Videoları görsel ve istemlerle düzenle", rozet: "YENİ", rozetTip: "yeni" },
  { id: "reframe", ad: "Vayra Reframe", ozet: "Videoları herhangi bir en-boy oranına çevir" },
  { id: "kling-omni", ad: "Kling 3.0 Omni Edit", ozet: "Videoları metin istemleriyle düzenle", rozet: "Özel", rozetTip: "pro" },
  { id: "kling-o1", ad: "Kling O1 Video Düzenle", ozet: "Öğe ve referanslarla üret" },
  { id: "kling-motion", ad: "Kling Hareket Kontrolü", ozet: "Video referanslarıyla hareketi kontrol et" },
  { id: "kling-3motion", ad: "Kling 3.0 Hareket Kontrolü", ozet: "Videodan görsele hareket aktar" },
  { id: "grok-edit", ad: "Grok Imagine Düzenle", ozet: "Videoları metin istemleriyle düzenle" },
];

export default function ReframePage() {
  const router = useRouter();
  const [video, setVideo] = useState<string | null>(null);
  const [model, setModel] = useState(MODELLER[1]); // Vayra Reframe
  const [oran, setOran] = useState("16:9");
  const [kalite, setKalite] = useState("720p");
  const [modelAcik, setModelAcik] = useState(false);

  const yukle = (dosyalar: FileList) => {
    const d = dosyalar[0];
    const r = new FileReader();
    r.onload = () => setVideo(String(r.result));
    r.readAsDataURL(d);
  };

  const uret = () => {
    const s = uretimBaslat({
      baslik: `Yeniden çerçevelendi · ${oran}`, tur: "video", model: model.ad,
      prompt: `${oran} oranına yeniden çerçevele, ${kalite}`, kredi: 4, arac: "Reframe",
      meta: { oran, cozunurluk: kalite },
    });
    if (!s.ok) return uretimHataToast(s, "Çerçevelenemedi");
    toast.success("Yeniden çerçeveleniyor ✦", { description: `${oran} · ${kalite}` });
    router.push("/panel/kitaplik");
  };

  return (
    <MobilComposerKabuk
      baslik="Yeniden Çerçevele"
      modId="reframe"
      onKapat={() => router.push("/panel/gorsel")}
      altCipler={
        <>
          {/* Oran DİKEY liste (referansta grid DEĞİL) — MobilAltCip zaten liste açar */}
          <MobilAltCip tip="oran" deger={oran} secenekler={["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"]} onSec={setOran} />
          <MobilAltCip tip="kalite" deger={kalite} secenekler={["480p", "720p", "1080p", "4K"]} onSec={setKalite} />
        </>
      }
      uretButonu={<MobilUretButonu etiket="Üret" kredi={4} onTikla={uret} devreDisi={!video} />}
    >
      {/* ── ÜST BANNER ── */}
      <div className="relative overflow-hidden rounded-[16px]">
        <div className="aspect-video w-full bg-cover bg-center" style={{ background: aracArka("reframe-banner", "sinematik") }} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <button className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm">
          <BookOpen className="h-3.5 w-3.5" /> Nasıl çalışır
        </button>
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h2 className="text-[19px] font-extrabold uppercase tracking-tight text-aksan">Vayra Reframe</h2>
          <p className="mt-0.5 text-[12.5px] text-white/75">Videoları herhangi bir en-boy oranına çevir ve yeniden boyutlandır</p>
        </div>
      </div>

      {/* ── VİDEO YÜKLE ── */}
      {video ? (
        // eslint-disable-next-line @next/next/no-img-element
        <video src={video} className="w-full rounded-[16px]" controls />
      ) : (
        <label className="flex h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-white/12">
          <input type="file" accept="video/*" className="hidden"
            onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07] text-metin-2">
            <Video className="h-6 w-6" />
          </span>
          <span className="text-[14px] text-metin-2">Yeniden çerçevelemek için video yükle</span>
        </label>
      )}

      {/* ── MODEL KARTI ── */}
      <button onClick={() => setModelAcik(true)}
        className="flex w-full items-center gap-3 rounded-[14px] bg-yuzey-2 p-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-metin-2">Model</span>
          <span className="block truncate text-[15px] font-semibold text-white">{model.ad}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-metin-2" />
      </button>

      <MobilSecici acik={modelAcik} onKapat={() => setModelAcik(false)}
        baslik="Tüm modeller" ogeler={MODELLER} seciliId={model.id}
        onSec={(o) => { const m = MODELLER.find((x) => x.id === o.id); if (m) setModel(m); }}
        aramaYerTutucu="Model ara…" />
    </MobilComposerKabuk>
  );
}
