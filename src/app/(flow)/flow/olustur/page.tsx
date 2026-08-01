"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronLeft, Sparkles, Music2, Check } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { useProjeler } from "@/store/useProjeler";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { IG_GRADIENT, Avatar, cn } from "@/components/flow/UI";
import { useAuth } from "@/store/useAuth";
import { useScrollKilit } from "@/hooks/useScrollKilit";

/** Yeni gönderi oluştur — Vayra üretimlerinden seç veya placeholder yükle. */
export default function OlusturSayfa() {
  const router = useRouter();
  const { kullanici } = useAuth();
  const projeler = useProjeler((s) => s.uretimler);
  const gonderiPaylas = useFlow((s) => s.gonderiPaylas);
  const [adim, setAdim] = useState<"sec" | "detay">("sec");
  const [secilenTohum, setSecilenTohum] = useState<string | null>(null);
  const [secilenKat, setSecilenKat] = useState("sinematik");
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");
  const [begeniGizle, setBegeniGizle] = useState(false);
  const [yorumKapali, setYorumKapali] = useState(false);
  const [sesModal, setSesModal] = useState(false);
  const [secilenSes, setSecilenSes] = useState<string | null>(null);
  useScrollKilit(sesModal);

  // Vayra üretimleri (tamamlananlar) + demo placeholder karolar
  const tamamlanan = projeler.filter((u) => u.durum === "tamam").slice(0, 12);
  const demoKarolar = Array.from({ length: 12 }, (_, i) => ({ tohum: `olustur-${i}`, kat: ["sinematik", "portre", "3d", "soyut", "manzara", "fantastik"][i % 6] }));
  const SESLER = ["Orijinal ses", "Chill Lofi — Mavi", "Trend Beat 2026", "Sinematik Yükseliş", "Akustik Gitar", "Synthwave Gece"];

  const paylas = () => {
    if (!secilenTohum) return;
    gonderiPaylas({ tohum: secilenTohum, kat: secilenKat, aciklama, konum: konum || undefined, begeniGizli: begeniGizle, yorumKapali });
    toast.success("Gönderin paylaşıldı 🎉");
    router.push("/flow/profil");
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        {adim === "detay" ? <button onClick={() => setAdim("sec")} className="flex items-center gap-1 text-[14px] text-white/70"><ChevronLeft className="h-4 w-4" />Geri</button> : <h1 className="text-[20px] font-bold">Yeni gönderi</h1>}
        {adim === "sec" ? <button onClick={() => secilenTohum && setAdim("detay")} disabled={!secilenTohum} className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-40">İleri</button>
          : <button onClick={paylas} className="rounded-lg px-4 py-1.5 text-[14px] font-bold text-white" style={{ background: IG_GRADIENT }}>Paylaş</button>}
      </div>

      {adim === "sec" ? (
        <div>
          {/* Vayra kuralı: yalnızca Vayra üretimleri paylaşılabilir — dış medya yükleme YOK */}
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#E1306C]/20 bg-[#E1306C]/[0.06] px-4 py-3 text-[13px] text-white/70">
            <Sparkles className="h-4 w-4 shrink-0 text-[#E1306C]" />
            <span>Flow'da yalnızca <b className="text-white">Vayra ile ürettiklerini</b> paylaşabilirsin. Aşağıdan bir üretim seç.</span>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
            {(tamamlanan.length ? tamamlanan.map((u) => ({ tohum: u.id, kat: "sinematik" })) : demoKarolar).map((k, i) => (
              <button key={i} onClick={() => { setSecilenTohum(k.tohum); setSecilenKat(k.kat); }}
                className={cn("relative aspect-square overflow-hidden rounded-md ring-2 transition-all", secilenTohum === k.tohum ? "ring-[#E1306C]" : "ring-transparent hover:ring-white/20")}
                style={{ background: onizlemeArka(k.tohum, k.kat) }}>
                {secilenTohum === k.tohum && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: IG_GRADIENT }}><Check className="h-3 w-3 text-white" /></span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="aspect-square w-full max-w-[300px] shrink-0 overflow-hidden rounded-lg" style={{ background: onizlemeArka(secilenTohum!, secilenKat) }} />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2.5"><Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={32} /><span className="text-[14px] font-semibold">{kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen"}</span></div>
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Açıklama yaz… #hashtag ekle" rows={5} className="w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-white/40" />
            <div className="flex items-center gap-2 border-t border-white/[0.08] pt-3"><MapPin className="h-5 w-5 text-white/50" /><input value={konum} onChange={(e) => setKonum(e.target.value)} placeholder="Konum ekle" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-white/40" /></div>
            <button onClick={() => setSesModal(true)} className="flex w-full items-center gap-2 border-t border-white/[0.08] pt-3 text-left"><Music2 className="h-5 w-5 text-white/50" /><span className="flex-1 text-[14px]">{secilenSes ?? "Ses ekle (Reels için)"}</span><span className="text-[13px] text-[#0095f6]">{secilenSes ? "Değiştir" : "Ekle"}</span></button>
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[14px]"><span>Beğeni sayısını gizle</span><Anahtar deger={begeniGizle} degis={() => setBegeniGizle(!begeniGizle)} /></div>
            <div className="flex items-center justify-between text-[14px]"><span>Yorumları kapat</span><Anahtar deger={yorumKapali} degis={() => setYorumKapali(!yorumKapali)} /></div>
          </div>
        </div>
      )}

      {/* ses seçme modalı */}
      {sesModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={() => setSesModal(false)}>
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-[#262626]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/[0.1] py-3 text-center text-[15px] font-bold">Ses seç</div>
            <div className="max-h-[50vh] overflow-y-auto py-1">
              {SESLER.map((se) => (
                <button key={se} onClick={() => { setSecilenSes(se); setSesModal(false); }} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] hover:bg-white/[0.06]", secilenSes === se && "font-semibold")}>
                  <Music2 className="h-4 w-4 text-white/50" />{se}
                </button>
              ))}
            </div>
            <button onClick={() => setSesModal(false)} className="block w-full border-t border-white/[0.1] py-3 text-[14px] hover:bg-white/[0.04]">İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Anahtar({ deger, degis }: { deger: boolean; degis: () => void }) {
  return (
    <button onClick={degis} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", deger ? "bg-[#0095f6]" : "bg-white/15")}>
      <span className={cn("absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform", deger ? "translate-x-[22px]" : "translate-x-0")} />
    </button>
  );
}
