"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Globe, FolderPlus, Heart, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriAl } from "./uretimGeriAl";
import { useProjeler } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { gorseliIndir } from "@/lib/utils";

/**
 * Toplu işlem çubuğu — Higgsfield birebir.
 * Kartların sol-üst kutucuğuyla seçim yapılınca sayfanın altında yüzer:
 * "N seçili · İndir · Yayınla · Koleksiyona ekle · Beğen · Sil · ✕"
 */
export function TopluIslemCubugu() {
  const secililer = useSecim((s) => s.secililer);
  const temizle = useSecim((s) => s.temizle);
  const { uretimler, guncelle, sil, favoriToggle } = useProjeler();

  if (secililer.length === 0) return null;
  const secilenler = uretimler.filter((u) => secililer.includes(u.id));

  const btn = "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white";

  const hepsiniIndir = () => {
    secilenler.forEach((u) => {
      const gercek = u.gercek && u.gorselUrl && (u.gorselUrl.startsWith("data:") || u.gorselUrl.startsWith("http")) ? u.gorselUrl : undefined;
      gorseliIndir(u.prompt + u.model, u.baslik, gercek);
    });
    toast.success(`${secilenler.length} üretim indiriliyor`, { description: "Dosyalar indirilenler klasörüne düşer." });
  };

  const hepsiniYayinla = () => {
    secilenler.forEach((u) => guncelle(u.id, { yayinda: true }));
    toast.success(`${secilenler.length} üretim Keşfet'te yayınlandı`);
    temizle();
  };

  const hepsiniBegen = () => {
    secilenler.filter((u) => !u.favori).forEach((u) => favoriToggle(u.id));
    toast.success(`${secilenler.length} üretim beğenildi`);
  };

  const hepsiniSil = () => {
    const n = secilenler.length, geriAl = uretimGeriAl(secilenler.map((u) => u.id));
    secilenler.forEach((u) => sil(u.id));
    temizle();
    mesaj.silindi(`${n} üretim`, geriAl);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[55] flex justify-center px-4"
      >
        <div className="menu-surface pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
          <span className="px-3 text-sm font-semibold text-white">
            {secililer.length} seçili
          </span>
          <span className="mx-1 h-6 w-px bg-white/10" />

          <button onClick={hepsiniIndir} className={btn}>
            <Download className="h-4 w-4" /> İndir
          </button>
          <button onClick={hepsiniYayinla} className={btn}>
            <Globe className="h-4 w-4" /> Yayınla
          </button>
          <button onClick={() => { toast.info("Koleksiyona toplu ekleme yakında", { description: "Şimdilik üretimleri tek tek kartın menüsünden klasöre ekleyebilirsin." }); temizle(); }} className={btn}>
            <FolderPlus className="h-4 w-4" /> Koleksiyon
          </button>
          <button onClick={hepsiniBegen} className={btn}>
            <Heart className="h-4 w-4" /> Beğen
          </button>
          <button onClick={hepsiniSil}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/15">
            <Trash2 className="h-4 w-4" /> Sil
          </button>

          <span className="mx-1 h-6 w-px bg-white/10" />
          <button onClick={temizle} aria-label="Seçimi temizle"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
