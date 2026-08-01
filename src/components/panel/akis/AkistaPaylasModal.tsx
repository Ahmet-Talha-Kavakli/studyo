"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { X, Sparkles, Lock, Unlock, Hash, Check, RefreshCw } from "lucide-react";
import { useAkis } from "@/store/useAkis";
import type { Uretim } from "@/store/useProjeler";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { saltUrl, onizlemeArka, cn } from "@/lib/utils";

/**
 * "Akışta Paylaş" — bir kitaplık üretimini topluluk feed'ine (Akış) yayınlar.
 * İzin ayarı (Recreate açık/kapalı), açıklama ve etiketler alınır.
 */
export function AkistaPaylasModal({ uretim, onKapat }: { uretim: Uretim | null; onKapat: () => void }) {
  useScrollKilit(uretim !== null);
  useEscKapat(uretim !== null, onKapat);
  return (
    <AnimatePresence>
      {uretim && <Icerik uretim={uretim} onKapat={onKapat} />}
    </AnimatePresence>
  );
}

function turAkis(tur: string): "video" | "gorsel" {
  return tur === "video" ? "video" : "gorsel";
}

function Icerik({ uretim, onKapat }: { uretim: Uretim; onKapat: () => void }) {
  const router = useRouter();
  const paylas = useAkis((s) => s.paylas);
  const zatenPaylasildi = useAkis((s) => s.paylasimlar.some((p) => p.uretimId === uretim.id));
  const [aciklama, setAciklama] = useState(uretim.baslik);
  const [etiketMetin, setEtiketMetin] = useState("");
  const [izin, setIzin] = useState(true);

  const poster = saltUrl(uretim.gorselUrl) ?? saltUrl(onizlemeArka(uretim.baslik + uretim.model, "portre"));

  const yayinla = () => {
    const etiketler = etiketMetin
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((e) => (e.startsWith("#") ? e : "#" + e))
      .slice(0, 6);
    paylas({
      uretimId: uretim.id,
      tur: turAkis(uretim.tur),
      baslik: aciklama.trim() || uretim.baslik,
      aciklama: aciklama.trim() || uretim.baslik,
      model: uretim.model,
      etiketler: etiketler.length ? etiketler : ["#vayra"],
      gorselUrl: uretim.gorselUrl ?? onizlemeArka(uretim.baslik + uretim.model, "portre"),
      videoUrl: uretim.videoUrl,
      oran: (uretim.meta?.oran as "9:16" | "16:9" | "1:1") ?? "9:16",
      muzik: "Orijinal ses · @ben",
      izinYenidenOlustur: izin,
      kredi: uretim.kredi || (uretim.tur === "video" ? 45 : 5),
    });
    toast.success("Akış'ta paylaşıldı 🎉", {
      description: "Gönderin topluluk akışının en üstünde.",
      action: { label: "Akış'a git", onClick: () => router.push("/panel/akis") },
    });
    onKapat();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16 }}
        className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#151517] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <span className="flex items-center gap-2 text-[16px] font-bold text-white">
            <Sparkles className="h-5 w-5 text-aksan" /> Akış'ta Paylaş
          </span>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
          {/* önizleme */}
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-xl bg-ink-900" style={{ background: uretim.gorselUrl }}>
            {poster && <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{uretim.model}</span>
          </div>

          {/* form */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Açıklama</label>
              <textarea
                value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder:text-metin-3 focus:border-aksan/50 focus:outline-none"
                placeholder="Bu iş hakkında bir şeyler yaz…"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2">
                <Hash className="h-3.5 w-3.5" /> Etiketler
              </label>
              <input
                value={etiketMetin} onChange={(e) => setEtiketMetin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder:text-metin-3 focus:border-aksan/50 focus:outline-none"
                placeholder="neon şehir sinematik (boşlukla ayır)"
              />
            </div>

            {/* izin */}
            <button onClick={() => setIzin((v) => !v)}
              className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition-colors hover:bg-white/[0.05]">
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", izin ? "bg-aksan/15 text-aksan" : "bg-white/8 text-metin-2")}>
                {izin ? <RefreshCw className="h-[18px] w-[18px]" /> : <Lock className="h-[18px] w-[18px]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-white">
                  Yeniden oluşturmaya izin ver
                  <span className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", izin ? "bg-aksan" : "bg-white/15")}>
                    <span className={cn("h-4 w-4 rounded-full bg-white transition-transform", izin && "translate-x-4")} />
                  </span>
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-metin-3">
                  {izin
                    ? "Diğer kullanıcılar bu işi kendi kitaplığında yeniden üretebilir."
                    : "Sadece görüntülenebilir; kimse yeniden oluşturamaz."}
                </span>
              </span>
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={onKapat} className="flex-1 rounded-full bg-white/8 py-2.5 text-[14px] font-semibold text-white hover:bg-white/12">
                Vazgeç
              </button>
              <button onClick={yayinla} disabled={zatenPaylasildi}
                className={cn("flex flex-[1.4] items-center justify-center gap-2 rounded-full py-2.5 text-[14px] font-bold transition-transform",
                  zatenPaylasildi ? "bg-white/10 text-metin-3" : "bg-aksan text-zemin hover:scale-[1.02]")}>
                {zatenPaylasildi ? <><Check className="h-4 w-4" /> Zaten paylaşıldı</> : <><Sparkles className="h-4 w-4" /> Akış'ta yayınla</>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
