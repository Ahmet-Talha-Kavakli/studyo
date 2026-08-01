"use client";

/**
 * UGC FABRİKASI — Higgsfield create-ugc mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-ugc.
 *
 *  Adım "tur": kategori/tarz seçimi (kart ızgarası, lime kenarlık seçili) + "Devam"
 *  Adım "composer": yükleme + istem + Model + oran/kalite çip + "Üret"
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  MobilComposerKabuk, MobilYukleAlani, MobilIstemKutusu, MobilAltCipler, MobilUretButonu,
} from "@/components/panel/MobilComposer";
import { ChevronDown, X } from "lucide-react";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

const KATEGORILER = [
  { id: "general", ad: "GENEL", kat: "portre" },
  { id: "unboxing", ad: "KUTU AÇMA", kat: "urun" },
  { id: "review", ad: "İNCELEME", kat: "portre" },
  { id: "tutorial", ad: "REHBER", kat: "portre" },
  { id: "haul", ad: "ALIŞVERİŞ", kat: "moda" },
  { id: "grwm", ad: "HAZIRLAN", kat: "moda" },
];

export default function UgcPage() {
  const router = useRouter();
  const [adim, setAdim] = useState<"tur" | "composer">("tur");
  const [kategori, setKategori] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [gorseller, setGorseller] = useState<{ ad: string; url: string }[]>([]);
  const [oran, setOran] = useState("9:16");
  const [kalite, setKalite] = useState("1080p");

  const uret = () => {
    const s = uretimBaslat({
      baslik: prompt.slice(0, 42) || "UGC videosu", tur: "video", model: "Vayra UGC",
      prompt: `${KATEGORILER.find((k) => k.id === kategori)?.ad ?? "genel"} UGC: ${prompt}`, kredi: 12, arac: "UGC Fabrikası",
      meta: { oran, cozunurluk: kalite },
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("UGC videosu üretiliyor ✦");
    router.push("/panel/kitaplik");
  };

  if (adim === "tur") {
    return (
      <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
        <header className="flex h-[52px] shrink-0 items-center px-3">
          <span className="w-9" aria-hidden />
          <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
            UGC Fabrikası <ChevronDown className="h-4 w-4 text-metin-2" />
          </span>
          <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          <div className="px-1">
            <h2 className="text-[22px] font-bold text-white">Bir tarz seç</h2>
            <p className="mt-1 text-[13.5px] text-metin-2">UGC videon için bir kategori seç.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {KATEGORILER.map((k) => (
              <button key={k.id} onClick={() => setKategori(k.id)}
                className={cn("relative aspect-[4/5] overflow-hidden rounded-[16px] bg-cover bg-center text-left",
                  kategori === k.id && "ring-2 ring-aksan")}
                style={{ background: aracArka("ugc-" + k.id, k.kat) }}>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-[13px] font-bold uppercase text-white">{k.ad}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-3 pb-4">
          <button onClick={() => setAdim("composer")} disabled={!kategori}
            className="hf-uret flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-bold disabled:opacity-45">Devam</button>
        </div>
      </div>
    );
  }

  return (
    <MobilComposerKabuk
      baslik="UGC Fabrikası"
      onBaslikTikla={() => setAdim("tur")}
      onKapat={() => router.push("/panel/gorsel")}
      altCipler={
        <MobilAltCipler
          oran={oran} oranSecenek={["9:16", "16:9", "1:1", "4:5"]} onOran={setOran}
          kalite={kalite} kaliteSecenek={["720p", "1080p"]} onKalite={setKalite}
        />
      }
      uretButonu={<MobilUretButonu etiket="Üret" kredi={12} onTikla={uret} devreDisi={!prompt.trim() && gorseller.length === 0} />}
    >
      <MobilYukleAlani etiket="Ürün / avatar görseli yükle" cokluBaslik="Referanslar"
        gorseller={gorseller.map((g) => g.url)}
        onKaldir={(i) => setGorseller((v) => v.filter((_, j) => j !== i))}
        onDosya={(dosyalar) => {
          Array.from(dosyalar).slice(0, 6 - gorseller.length).forEach((d) => {
            const r = new FileReader();
            r.onload = () => setGorseller((v) => [...v, { ad: d.name, url: String(r.result) }]);
            r.readAsDataURL(d);
          });
        }} />
      <MobilIstemKutusu deger={prompt} onDegis={setPrompt} yerTutucu="UGC videosunu anlat…"
        modelAdi="Vayra UGC" onModelTikla={() => {}} />
    </MobilComposerKabuk>
  );
}
