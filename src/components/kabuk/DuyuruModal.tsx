"use client";

import { useState, useEffect, useMemo } from "react";
import { kopyala } from "@/lib/gercekEylem";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { FileText, Gift, Sparkles, Wrench, Megaphone, Check, Copy, X } from "lucide-react";
import { useDuyuru, DUYURULAR, type Duyuru, type DuyuruTur } from "@/store/useDuyuru";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

/**
 * DuyuruModal — sistem duyurularını (politika/promo/güncelleme/bakım) merkezi,
 * tekrar-kullanılabilir bir pop-up ile gösterir. Panel layout'una global asılır.
 * Katalogdaki (DUYURULAR) ilk GÖRÜLMEMİŞ duyuruyu gösterir; kapatınca işaretler.
 */

const TUR_STIL: Record<DuyuruTur, { ikon: typeof FileText; renk: string; bg: string }> = {
  politika: { ikon: FileText, renk: "text-sky-300", bg: "from-sky-400 to-blue-500" },
  promo: { ikon: Gift, renk: "text-aksan", bg: "from-aksan to-emerald-400" },
  guncelleme: { ikon: Sparkles, renk: "text-violet-300", bg: "from-violet-400 to-fuchsia-500" },
  bakim: { ikon: Wrench, renk: "text-amber-300", bg: "from-amber-400 to-orange-500" },
  duyuru: { ikon: Megaphone, renk: "text-rose-300", bg: "from-rose-400 to-pink-500" },
};

export function DuyuruModal() {
  const goruldu = useDuyuru((s) => s.goruldu);
  const gordu = useDuyuru((s) => s.gordu);
  const girisYapildi = useAuth((s) => s.girisYapildi);
  const [hazir, setHazir] = useState(false);

  // Promosyon/koşul pop-up'ı ANINDA çıkmasın — kullanıcı kaybını önlemek için
  // önce ürünü keşfetsin (kullanıcı isteği). 45sn sonra göster; sekme arka planda
  // sayarken de sorun değil (görünür olunca çıkar).
  useEffect(() => { const t = setTimeout(() => setHazir(true), 45_000); return () => clearTimeout(t); }, []);

  // Gösterilecek ilk görülmemiş duyuru (giriş şartını da uygula).
  const aktif = useMemo<Duyuru | null>(() => {
    if (!hazir) return null;
    return DUYURULAR.find((d) => !goruldu.includes(d.id) && (!d.yalnizGirisli || girisYapildi)) ?? null;
  }, [hazir, goruldu, girisYapildi]);

  return (
    <AnimatePresence>
      {aktif && <DuyuruIcerik key={aktif.id} duyuru={aktif} onKapat={() => gordu(aktif.id)} />}
    </AnimatePresence>
  );
}

function DuyuruIcerik({ duyuru, onKapat }: { duyuru: Duyuru; onKapat: () => void }) {
  const router = useRouter();
  const [onayli, setOnayli] = useState(false);
  const stil = TUR_STIL[duyuru.tur];
  const Ikon = stil.ikon;

  const devam = () => {
    if (duyuru.onayGerekli && !onayli) return;
    if (duyuru.link) router.push(duyuru.link);
    onKapat();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={duyuru.onayGerekli ? undefined : onKapat}
        className="perde absolute inset-0 bg-black/55 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-white/10 bg-[#141416] p-7 text-center">
        {/* politika gibi zorunlu duyurularda X yok */}
        {!duyuru.onayGerekli && (
          <button onClick={onKapat} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        )}

        <span className={cn("mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-zemin", stil.bg)}>
          <Ikon className="h-8 w-8" />
        </span>
        <h2 className="mb-2 text-[22px] font-bold text-white">{duyuru.baslik}</h2>
        <p className="mb-5 text-[14.5px] leading-relaxed text-metin-2">{duyuru.mesaj}</p>

        {/* PROMO KOD */}
        {duyuru.promoKod && (
          <button onClick={() => { void kopyala(duyuru.promoKod!, "Promo kod kopyalandı"); }}
            className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-aksan/40 bg-aksan/[0.07] px-4 py-3">
            <span className="font-mono text-[16px] font-bold tracking-wider text-aksan">{duyuru.promoKod}</span>
            <Copy className="h-4 w-4 text-aksan" />
          </button>
        )}

        {/* ONAY KUTUSU (politika)
            role="checkbox" + aria-checked ŞART: bu bir <button>'du ve ekran
            okuyucular onay kutusu olarak tanımıyordu (durumu da okunmuyordu). */}
        {duyuru.onayGerekli && (
          <button
            type="button"
            role="checkbox"
            aria-checked={onayli}
            onClick={() => setOnayli((v) => !v)}
            className="mb-5 flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left">
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors", onayli ? "border-aksan bg-aksan text-zemin" : "border-white/25")}>
              {onayli && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-snug text-metin-2">{duyuru.onayMetni}</span>
          </button>
        )}

        <button onClick={devam} disabled={duyuru.onayGerekli && !onayli}
          className={cn("flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition-transform",
            (!duyuru.onayGerekli || onayli) ? "bg-aksan text-zemin hover:scale-[1.02]" : "bg-white/10 text-metin-3")}>
          {duyuru.btnMetin}
        </button>
      </motion.div>
    </div>
  );
}
