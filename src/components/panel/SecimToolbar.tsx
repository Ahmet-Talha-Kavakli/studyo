"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, FolderPlus, Heart, Trash2, X, AudioLines } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSecim } from "@/store/useSecim";
import { useProjeler } from "@/store/useProjeler";
import { topluIndir } from "@/lib/gercekEylem";

/* ============================================================
   SecimToolbar — Higgsfield "1 selected" alt-orta yüzen çubuğu (m24).
   Referans birebir: [🎵 N selected] · Download · Publish all · Add to · ♡ · 🗑 · ✕
   Kartlar seçilince belirir. Boyut higgs'e göre bir tık büyük.
   Tüm stüdyolarda ortak (görsel/video/ses).
   ============================================================ */
export function SecimToolbar({ kapsayiciRef }: {
  /** Verilirse çubuk TÜM EKRANA değil, bu elemanın yatay ortasına oturur.
      (Kullanıcı 2026-08-01: video sayfasında kartlar sağ panelde olduğu
      hâlde çubuk sayfanın ortasında duruyordu.) */
  kapsayiciRef?: React.RefObject<HTMLElement | null>;
} = {}) {
  const secililer = useSecim((s) => s.secililer);
  const temizle = useSecim((s) => s.temizle);
  const { favoriToggle, sil, guncelle, uretimler } = useProjeler();
  const adet = secililer.length;

  /* Kapsayıcının yatay merkezini ÖLÇ — panel genişliği açılıp kapanabildiği
     için sabit bir değer yeterli değil; yeniden boyutlanmayı da dinleriz. */
  const [merkez, setMerkez] = useState<number | null>(null);
  useEffect(() => {
    const el = kapsayiciRef?.current;
    if (!el || adet === 0) return setMerkez(null);
    const olc = () => {
      const r = el.getBoundingClientRect();
      setMerkez(r.left + r.width / 2);
    };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    window.addEventListener("resize", olc);
    return () => { ro.disconnect(); window.removeEventListener("resize", olc); };
  }, [kapsayiciRef, adet]);

  const toplu = (fn: (id: string) => void, mesaj: string) => {
    secililer.forEach(fn);
    toast.success(mesaj);
  };
  const indir = () => {
    const secili = uretimler.filter((u) => secililer.includes(u.id));
    topluIndir(secili, `${adet} öğe indiriliyor`);
  };

  return (
    <AnimatePresence>
      {adet > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          /* `whitespace-nowrap` + `w-max`: "Tümünü yayınla" gibi iki kelimelik
             etiketler alt satıra kayıyordu (kullanıcı, 2026-08-02). Çubuk
             artık içeriği kadar genişler, yazılar tek satırda kalır. */
          className="menu-surface fixed bottom-6 z-[90] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[20px] px-3 py-3"
          style={{ left: merkez ?? "50%" }}
        >
          {/* N selected — higgs birebir: dalga ikonu + sayı */}
          <span className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[15px] font-semibold text-metin">
            <AudioLines className="h-5 w-5 text-metin-2" /> {adet} seçili
          </span>
          <ToolbarBtn onClick={indir} ikon={Download} etiket="İndir" metin />
          <ToolbarBtn onClick={() => toplu((id) => guncelle(id, { yayinda: true }), `${adet} öğe yayınlandı 🌍`)} ikon={Upload} etiket="Tümünü yayınla" metin />
          <ToolbarBtn onClick={() => toplu(() => {}, `${adet} öğe klasöre eklendi`)} ikon={FolderPlus} etiket="Ekle" metin />
          <span className="mx-0.5 h-6 w-px bg-white/10" />
          <ToolbarBtn onClick={() => toplu((id) => favoriToggle(id), `${adet} öğe favorilere eklendi`)} ikon={Heart} etiket="Favori" />
          <ToolbarBtn
            onClick={() => { const n = adet; secililer.forEach((id) => sil(id)); temizle(); toast.success(`${n} öğe silindi`); }}
            ikon={Trash2}
            etiket="Sil"
            tehlike
          />
          <ToolbarBtn onClick={temizle} ikon={X} etiket="Seçimi bırak" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolbarBtn({ onClick, ikon: Ikon, etiket, tehlike, metin }: { onClick: () => void; ikon: typeof Download; etiket: string; tehlike?: boolean; metin?: boolean }) {
  // metin=true → higgs "Download / Publish all / Add to" gibi ikon+etiket buton.
  if (metin) {
    return (
      <button onClick={onClick} aria-label={etiket}
        className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-[14.5px] font-medium text-metin-2 transition-colors hover:bg-white/8 hover:text-metin">
        <Ikon className="h-5 w-5" /> {etiket}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title={etiket}
      aria-label={etiket}
      className={
        "flex h-11 w-11 items-center justify-center rounded-xl text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" +
        (tehlike ? " hover:bg-rose-500/15 hover:text-rose-400" : "")
      }
    >
      <Ikon className="h-5 w-5" />
    </button>
  );
}
