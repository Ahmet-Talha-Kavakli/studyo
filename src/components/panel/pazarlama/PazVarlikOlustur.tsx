"use client";

/**
 * PazVarlikOlustur — Pazarlama Stüdyosu'nda KENDİ ortam / kanca / stil'ini oluşturma.
 *
 * Kullanıcı isteği (2026-07-31):
 *  · "ortam oluşturma ekleyelim prompt ile ve görseller ekleyerek olarak iki seçenek"
 *  · "kanca oluşturma ekleyelim prompt ile ve video ekleyerek olarak iki seçenek"
 *  · "stil oluşturma ekleyelim prompt ile ve video ekleyerek olarak iki seçenek"
 *
 * Öncesi: seçici modallar yalnız hazır listeyi gösteriyordu; kullanıcı kendi
 * ortam/kanca/stil'ini hiç ekleyemiyordu. Kayıtlar `usePazarlama` store'una
 * KALICI yazılır ve seçicilerde "Benim" grubunda görünür.
 */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Upload, Wand2, Film, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { usePazarlama, type PazVarlik } from "@/store/usePazarlama";

const LIME = "var(--sn-lime,#55d6fd)";

/** Tür başına metinler + hangi medya kabul edilir. */
const TUR_META: Record<PazVarlik["tur"], {
  baslik: string; ozet: string;
  istemEtiket: string; istemOrnek: string;
  medyaEtiket: string; medyaOzet: string; kabul: string; medyaIkon: typeof ImageIcon;
}> = {
  ortam: {
    baslik: "YENİ ORTAM", ozet: "Reklamın geçtiği mekânı tarif et ya da görsellerinden öğret.",
    istemEtiket: "Ortamı tarif et",
    istemOrnek: "Örn: minimal beyaz stüdyo, yumuşak gölgeler, açık ahşap masa, sabah ışığı…",
    medyaEtiket: "Ortam görselleri", medyaOzet: "Mekânı gösteren 6 adede kadar görsel",
    kabul: "image/*", medyaIkon: ImageIcon,
  },
  kanca: {
    baslik: "YENİ KANCA", ozet: "İlk 3 saniyeyi yazıyla kur ya da örnek videodan öğret.",
    istemEtiket: "Kancayı yaz",
    istemOrnek: "Örn: “Bunu 10 yıldır yanlış yapıyorsun” — kameraya doğrudan, şaşkın ifade…",
    medyaEtiket: "Örnek videolar", medyaOzet: "Açılışı gösteren 6 adede kadar video",
    kabul: "video/*", medyaIkon: Film,
  },
  stil: {
    baslik: "YENİ STİL", ozet: "Görsel dili yazıyla tarif et ya da örnek videodan öğret.",
    istemEtiket: "Stili tarif et",
    istemOrnek: "Örn: el kamerası, doğal ışık, sıcak grade, hızlı kesmeler, samimi UGC hissi…",
    medyaEtiket: "Örnek videolar", medyaOzet: "Stili taşıyan 6 adede kadar video",
    kabul: "video/*", medyaIkon: Film,
  },
};

export function PazVarlikOlustur({ tur, onKapat, onOlustu }: {
  tur: PazVarlik["tur"];
  onKapat: () => void;
  onOlustu?: (id: string) => void;
}) {
  const varlikEkle = usePazarlama((s) => s.varlikEkle);
  const m = TUR_META[tur];
  const [yontem, setYontem] = useState<"istem" | "medya">("istem");
  const [ad, setAd] = useState("");
  const [istem, setIstem] = useState("");
  const [medyalar, setMedyalar] = useState<string[]>([]);
  const dosyaRef = useRef<HTMLInputElement>(null);

  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const olustur = () => {
    const temizAd = ad.trim();
    if (temizAd.length < 2) { toast.error("Bir ad gir"); return; }
    if (yontem === "istem" && istem.trim().length < 6) {
      toast.error(`${m.istemEtiket.toLocaleLowerCase("tr")}`, { description: "Birkaç kelimeden fazlasını yaz." });
      return;
    }
    if (yontem === "medya" && medyalar.length === 0) {
      toast.error("Örnek medya gerekli", { description: m.medyaOzet });
      return;
    }
    const id = varlikEkle({
      ad: temizAd, tur, kaynak: yontem,
      aciklama: yontem === "istem" ? istem.trim() : `${medyalar.length} örnek medya`,
      medyaUrl: medyalar[0],
      tohum: `${tur}-${temizAd.toLocaleLowerCase("tr").replace(/\s+/g, "-")}`,
    });
    toast.success(`${temizAd} oluşturuldu ✦`, {
      description: yontem === "istem" ? "İsteminden öğrenildi" : `${medyalar.length} medyadan öğrenildi`,
    });
    onOlustu?.(id);
    onKapat();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="sinema-kapsam fixed left-1/2 top-1/2 z-[261] flex max-h-[88vh] w-[min(94vw,660px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#232327]">

        <input ref={dosyaRef} type="file" accept={m.kabul} multiple hidden
          onChange={(e) => {
            const liste = Array.from(e.target.files ?? []);
            e.target.value = "";
            liste.slice(0, 6).forEach((f) => {
              const r = new FileReader();
              r.onload = () => setMedyalar((v) => [...v, String(r.result)].slice(0, 6));
              r.readAsDataURL(f);
            });
          }} />

        {/* Başlık */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.07] p-5">
          <div className="min-w-0">
            <h3 className="text-[20px] font-black text-white">{m.baslik}</h3>
            <p className="mt-1 text-[13px] text-[#A0A0A8]">{m.ozet}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[#B0B0B8] transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {/* Yöntem seçimi — iki seçenek (kullanıcı isteği) */}
          <div className="inline-flex rounded-full bg-white/[0.06] p-1">
            {([["istem", "Yazıyla", Wand2], ["medya", m.medyaEtiket.split(" ")[0], m.medyaIkon]] as const).map(([id, etiket, Ik]) => (
              <button key={id} onClick={() => setYontem(id)} aria-pressed={yontem === id}
                className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  yontem === id ? "bg-white text-[#111114]" : "text-[#A0A0A8] hover:text-white")}>
                <Ik className="h-3.5 w-3.5" /> {etiket}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#C9C9D1]">
              <span className="text-rose-400">*</span> Ad
            </label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} autoFocus
              placeholder={tur === "ortam" ? "Örn. Minimal Stüdyo" : tur === "kanca" ? "Örn. Şok Açılış" : "Örn. Sıcak UGC"}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[14px] text-white outline-none focus:border-aksan/60" />
          </div>

          {yontem === "istem" ? (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#C9C9D1]">{m.istemEtiket}</label>
              <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={5}
                placeholder={m.istemOrnek}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] leading-relaxed text-white outline-none focus:border-aksan/60" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#C9C9D1]">
                {m.medyaEtiket}
                {medyalar.length > 0 && <span className="text-[12px] tabular-nums text-[#8A8A92]">{medyalar.length}/6</span>}
              </label>
              {medyalar.length === 0 ? (
                <button onClick={() => dosyaRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-10 transition-colors hover:border-white/30">
                  <Upload className="h-6 w-6 text-[#A0A0A8]" />
                  <span className="text-[13.5px] font-medium text-white">Cihazdan yükle</span>
                  <span className="text-[12px] text-[#8A8A92]">{m.medyaOzet}</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  {medyalar.map((g, i) => (
                    <div key={i} className="group/mv relative aspect-square overflow-hidden rounded-lg bg-black/30">
                      {m.kabul.startsWith("video") ? (
                        <video src={g} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g} alt="" className="h-full w-full object-cover" />
                      )}
                      <button onClick={() => setMedyalar((v) => v.filter((_, j) => j !== i))}
                        aria-label="Kaldır"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover/mv:opacity-100 hover:bg-rose-500/75">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {medyalar.length < 6 && (
                    <button onClick={() => dosyaRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-[#8A8A92] transition-colors hover:border-white/30 hover:text-white">
                      <Upload className="h-4 w-4" /><span className="text-[11px]">Ekle</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-white/[0.07] px-5 py-4">
          <button onClick={onKapat}
            className="rounded-xl border border-white/12 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.06]">İptal</button>
          <button onClick={olustur}
            className="rounded-xl px-6 py-2.5 text-[14px] font-bold text-[#0a0a0a] transition-transform hover:scale-[1.02]"
            style={{ background: LIME }}>Oluştur</button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
