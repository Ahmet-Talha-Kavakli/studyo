"use client";

/**
 * POPCORN — Higgsfield create-popcorn mobil BİREBİR (tab dock + sahne stepper).
 * Referans: ~/Desktop/responsive/create-popcorn.
 *
 *  ┌ tab dock: Otomatik · Manuel[N] · Instadump      + ✕
 *  │ OTOMATİK: yükleme + "Sahne mood/aksiyon anlat" istem + "N sonuç ⌄" + "3:4" çip
 *  │ MANUEL: Sahne 1..N numaralı satırlar (+ sil/ekle)
 *  └ lime "Üret ✦3"
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { X, ImagePlus, Wand2, ChevronDown, Trash2, Plus } from "lucide-react";
import { MobilAltCip } from "@/components/panel/MobilComposer";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { cn } from "@/lib/utils";

type Sekme = "auto" | "manuel" | "instadump";

export default function PopcornPage() {
  const router = useRouter();
  const [sekme, setSekme] = useState<Sekme>("auto");
  const [gorsel, setGorsel] = useState<string | null>(null);
  const [istem, setIstem] = useState("");
  const [adet, setAdet] = useState("4");
  const [oran, setOran] = useState("3:4");
  const [sahneler, setSahneler] = useState<string[]>(["", "", "", ""]);
  const [adetAcik, setAdetAcik] = useState(false);

  const yukle = (dosyalar: FileList) => {
    const r = new FileReader();
    r.onload = () => setGorsel(String(r.result));
    r.readAsDataURL(dosyalar[0]);
  };

  const uret = () => {
    const s = uretimBaslat({
      baslik: "Popcorn sahneleri", tur: "video", model: "Vayra Popcorn",
      prompt: sekme === "manuel" ? sahneler.filter(Boolean).map((s, i) => `Sahne ${i + 1}: ${s}`).join(" · ") : istem || "sahne",
      kredi: 3, arac: "Popcorn", meta: { oran },
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Popcorn üretiliyor ✦");
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      {/* Tab dock */}
      <header className="flex h-[52px] shrink-0 items-center justify-between px-4">
        <div className="flex gap-5">
          {([["auto", "Otomatik"], ["manuel", "Manuel"], ["instadump", "Instadump"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setSekme(id)}
              className={cn("flex items-center gap-1.5 border-b-2 pb-1 pt-1 text-[16px] font-medium transition-colors",
                sekme === id ? "border-aksan text-aksan" : "border-transparent text-metin-2")}>
              {ad}
              {id === "manuel" && <span className="rounded-[5px] bg-white/[0.1] px-1.5 text-[11px] font-bold text-white">{sahneler.length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {sekme === "manuel" ? (
          <>
            {sahneler.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[14px] bg-yuzey-2 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[14px] font-bold text-white">{i + 1}</span>
                <input value={s} onChange={(e) => setSahneler((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={`Sahne ${i + 1} açıklaması`}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-metin-3" />
                {sahneler.length > 1 && (
                  <button onClick={() => setSahneler((v) => v.filter((_, j) => j !== i))} aria-label="Sil"
                    className="text-metin-2 hover:text-rose-400"><Trash2 className="h-[18px] w-[18px]" /></button>
                )}
              </div>
            ))}
            <button onClick={() => setSahneler((v) => [...v, ""])}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/15 py-3 text-[14px] font-medium text-metin-2">
              <Plus className="h-4 w-4" /> Sahne ekle
            </button>
          </>
        ) : (
          <>
            {/* Yükleme */}
            {gorsel ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gorsel} alt="Yüklenen" className="w-full rounded-[14px]" />
            ) : (
              <label className="flex h-[120px] cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-yuzey-2">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><ImagePlus className="h-5 w-5" /></span>
              </label>
            )}
            {/* İstem */}
            <div className="flex items-start gap-3 rounded-[14px] bg-yuzey-2 p-3.5">
              <Wand2 className="mt-0.5 h-5 w-5 shrink-0 text-metin-2" />
              <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={2}
                placeholder="Sahnelerini oluşturmak için mood veya aksiyonu anlat"
                className="min-w-0 flex-1 resize-none bg-transparent text-[15px] text-white outline-none placeholder:text-metin-3" />
            </div>
          </>
        )}
      </div>

      {/* Alt çipler + Üret */}
      <div className="shrink-0 space-y-3 px-3 pb-4">
        {sekme !== "manuel" && (
          <div className="flex flex-wrap gap-2">
            {/* Sonuç adedi */}
            <div className="relative">
              <button onClick={() => setAdetAcik((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#2a2c2e] px-4 text-[14px] font-medium text-white">
                {adet} sonuç <ChevronDown className="h-4 w-4 text-metin-2" />
              </button>
              {adetAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAdetAcik(false)} />
                  <div className="menu-surface absolute bottom-full left-0 z-50 mb-2 w-[140px] rounded-[12px] py-1">
                    {["1", "2", "4", "6", "8"].map((n) => (
                      <button key={n} onClick={() => { setAdet(n); setAdetAcik(false); }}
                        className={cn("block w-full px-4 py-2 text-left text-[15px]", n === adet ? "text-white" : "text-metin-2")}>{n} sonuç</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <MobilAltCip tip="oran" deger={oran} secenekler={["3:4", "9:16", "1:1", "16:9"]} onSec={setOran} />
          </div>
        )}
        <button onClick={uret}
          className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold">
          Üret <span className="flex items-center gap-1">✦ 3</span>
        </button>
      </div>
    </div>
  );
}
