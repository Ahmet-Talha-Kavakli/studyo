"use client";

/**
 * FANS STÜDYOSU — Higgsfield create-fans-studio mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-fans-studio.
 *
 *  Composer + iki seçim modalı:
 *   - Karakter Seç (büyük kart, "+")
 *   - Ses & Dublaj (dil çipleri)
 *   - Arka Plan
 *  Alt: lime "Üret"
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ChevronDown, X, Plus, ChevronRight, AudioLines, Image as ImageIcon } from "lucide-react";
import { useElements } from "@/store/useElements";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

const DILLER = ["Türkçe", "İngilizce", "İspanyolca", "Almanca", "Fransızca"];

export default function FansPage() {
  const router = useRouter();
  const [karakter, setKarakter] = useState<string | null>(null);
  const [dil, setDil] = useState("Türkçe");
  const [karakterModal, setKarakterModal] = useState(false);
  const [modalSekme, setModalSekme] = useState<"tumu" | "preset" | "benim">("preset");

  const elementler = useElements((s) => s.elementler);
  const karakterler = elementler.filter((e) => e.tur === "karakter");

  const uret = () => {
    const s = uretimBaslat({
      baslik: "Fans içeriği", tur: "video", model: "Vayra Fans",
      prompt: `karakter: ${karakter ?? "seçili"}, dil: ${dil}, dublajlı fans içeriği`, kredi: 15, arac: "Fans Stüdyosu",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Fans içeriği üretiliyor ✦");
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Fans Stüdyosu <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {/* Karakter seç */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-metin-2">Karakter Seç</p>
          <button onClick={() => setKarakterModal(true)}
            className={cn("relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[16px] bg-cover bg-center",
              karakter ? "ring-2 ring-aksan" : "border-2 border-dashed border-white/12")}
            style={karakter ? { background: onizlemeArka("fans-" + karakter, "portre") } : undefined}>
            {karakter ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-left text-[15px] font-bold uppercase text-white">{karakter}</span>
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07] text-white"><Plus className="h-6 w-6" /></span>
            )}
          </button>
        </div>

        {/* Ses & Dublaj */}
        <div>
          <p className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-metin-2"><AudioLines className="h-4 w-4" /> Ses & Dublaj</p>
          <div className="flex gap-2 overflow-x-auto gizli-scroll">
            {DILLER.map((d) => (
              <button key={d} onClick={() => setDil(d)}
                className={cn("shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                  dil === d ? "bg-white text-[#131517]" : "bg-yuzey-2 text-white")}>{d}</button>
            ))}
          </div>
        </div>

        {/* Arka plan */}
        <button className="flex w-full items-center gap-3 rounded-[14px] bg-yuzey-2 p-3.5 text-left">
          <ImageIcon className="h-5 w-5 shrink-0 text-metin-2" />
          <span className="flex-1 text-[15px] font-medium text-white">Arka Plan</span>
          <ChevronRight className="h-5 w-5 text-metin-2" />
        </button>
      </div>

      <div className="shrink-0 px-3 pb-4">
        <button onClick={uret} disabled={!karakter}
          className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
          Üret <span className="flex items-center gap-1">✦ 15</span>
        </button>
      </div>

      {/* Karakter seçim modalı */}
      {karakterModal && (
        <>
          <div className="fixed inset-0 z-[95] bg-black/60" onClick={() => setKarakterModal(false)} />
          <div className="mobil-lime fixed inset-x-0 bottom-0 z-[96] flex h-[80dvh] flex-col rounded-t-[18px] bg-[#131517]">
            <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
              <span className="text-[17px] font-bold text-white">Karakter Seç veya Ekle</span>
              <button onClick={() => setKarakterModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white"><X className="h-[18px] w-[18px]" /></button>
            </div>
            <div className="flex gap-1.5 px-4 pb-2">
              {([["tumu", "Tümü"], ["preset", "Presetler"], ["benim", "Karakterlerim"]] as const).map(([id, ad]) => (
                <button key={id} onClick={() => setModalSekme(id)}
                  className={cn("flex-1 rounded-[10px] py-2 text-[13.5px] font-medium transition-colors",
                    modalSekme === id ? "bg-white/[0.12] text-white" : "text-metin-2")}>{ad}</button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {(karakterler.length ? karakterler : [{ id: "z", ad: "Zara", tohum: "el-zara" }]).map((k) => (
                  <button key={k.id} onClick={() => { setKarakter(k.ad); setKarakterModal(false); }}
                    className="relative aspect-[3/4] overflow-hidden rounded-[16px] bg-cover bg-center text-left"
                    style={{ background: aracArka((k as { tohum?: string }).tohum ?? k.ad, "portre") }}>
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-[14px] font-bold uppercase text-white">{k.ad}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-white/[0.07] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button onClick={() => setKarakterModal(false)} className="h-12 flex-1 rounded-[12px] bg-[#26282a] text-[15px] font-semibold text-white">İptal</button>
              <button onClick={() => router.push("/panel/karakter/yeni")} className="h-12 flex-1 rounded-[12px] bg-white text-[15px] font-semibold text-zemin">Yeni Ekle</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
