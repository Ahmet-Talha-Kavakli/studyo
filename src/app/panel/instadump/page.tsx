"use client";

/**
 * INSTADUMP — Higgsfield create-instadump mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-instadump.
 *
 *  Adım "pack": intro "INSTADUMP'INI ÜRET" + "Pack Oluştur / Geçmiş" butonları +
 *    pack kartları (3-görselli carousel + alt-etiket) + lime "Paket Seç".
 *  Adım "foto": seçili pack + selfie yükle + Auto(oran) + "Üret 10".
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronDown, X, Plus, History, ImagePlus } from "lucide-react";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

const PACKLER = [
  { id: "winter", ad: "KIŞ ÖZEL", alt: "", kat: "portre" },
  { id: "aura", ad: "AURA FARMING", alt: "neonfluke", kat: "moda" },
  { id: "summer", ad: "YAZ VİBE", alt: "", kat: "moda" },
  { id: "street", ad: "SOKAK STİLİ", alt: "", kat: "portre" },
];

export default function InstadumpPage() {
  const router = useRouter();
  const [adim, setAdim] = useState<"pack" | "foto">("pack");
  const [pack, setPack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  const yukle = (dosyalar: FileList) => {
    const r = new FileReader();
    r.onload = () => setSelfie(String(r.result));
    r.readAsDataURL(dosyalar[0]);
  };

  const uret = () => {
    const s = uretimBaslat({
      baslik: "Instadump seti", tur: "gorsel", model: "Vayra Instadump",
      prompt: `${PACKLER.find((p) => p.id === pack)?.ad ?? "pack"} paketinde sana benzeyen 10 görsel`, kredi: 10, arac: "Instadump",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Instadump üretiliyor ✦", { description: "10 görsel hazırlanıyor" });
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Instadump <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
      </header>

      {adim === "pack" ? (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
            <div>
              <h1 className="text-[24px] font-extrabold uppercase tracking-tight text-white">Instadump'ını Üret</h1>
              <p className="mt-1.5 text-[13.5px] text-metin-2">En sevdiğin fotoğrafları yükle ve sana benzeyen yeni görseller üretmek için bir paket oluştur.</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => router.push("/panel/karakter/yeni")}
                className="flex items-center gap-2 rounded-[12px] bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white"><Plus className="h-4 w-4" /> Paket Oluştur</button>
              <button onClick={() => router.push("/panel/kitaplik")}
                className="flex items-center gap-2 rounded-[12px] bg-yuzey-2 px-4 py-2.5 text-[14px] font-medium text-white"><History className="h-4 w-4" /> Geçmiş</button>
            </div>
            <div className="space-y-3">
              {PACKLER.map((p) => (
                <button key={p.id} onClick={() => setPack(p.id)}
                  className={cn("relative block w-full overflow-hidden rounded-[16px]", pack === p.id && "ring-2 ring-aksan")}>
                  <span className="grid grid-cols-3 gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="aspect-[3/4] bg-cover bg-center" style={{ background: aracArka(p.id + i, p.kat) }} />
                    ))}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-left">
                    {p.alt && <span className="block text-[12px] text-white/70">{p.alt}</span>}
                    <span className="block text-[16px] font-bold uppercase text-white">{p.ad}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 px-3 pb-4">
            <button onClick={() => setAdim("foto")} disabled={!pack}
              className="hf-uret flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-bold disabled:opacity-45">Paket Seç</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
            <h2 className="text-[20px] font-bold text-white">Fotoğrafını ekle</h2>
            {selfie ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selfie} alt="Selfie" className="w-full rounded-[16px] object-cover" />
            ) : (
              <label className="flex h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-white/12">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><ImagePlus className="h-6 w-6" /></span>
                <span className="text-[14px] text-metin-2">Net bir selfie yükle</span>
              </label>
            )}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#2a2c2e] px-4 py-2 text-[14px] text-white">Auto</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 px-3 pb-4">
            <button onClick={() => setAdim("pack")} className="h-14 flex-1 rounded-[14px] bg-[#26282a] text-[16px] font-semibold text-white">Geri</button>
            <button onClick={uret} disabled={!selfie}
              className="hf-uret flex h-14 flex-[2] items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
              Üret <span className="flex items-center gap-1">✦ 10</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
