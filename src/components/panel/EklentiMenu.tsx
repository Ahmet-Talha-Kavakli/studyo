"use client";

import { motion } from "framer-motion";
import { kopyala } from "@/lib/gercekEylem";

/**
 * Eklentiler menüsü — Higgsfield "Plugins" dropdown'ı birebir.
 * Nav'da hover'da açılır: ikon + ad + "hangi programın içinde ne yapar" açıklaması.
 * Vayra'nın eklentileri kendi markamızla (Photoshop/Premiere/AE/DaVinci/Figma/Blender).
 */
export const EKLENTILER: { kisa: string; ad: string; ozet: string; renk: string }[] = [
  { kisa: "Ps", ad: "Adobe Photoshop", ozet: "Photoshop içinde AI görsel araçları", renk: "bg-[#001e36] text-[#31a8ff]" },
  { kisa: "Pr", ad: "Adobe Premiere Pro", ozet: "Premiere içinde AI video araçları", renk: "bg-[#2a0634] text-[#9999ff]" },
  { kisa: "Ae", ad: "Adobe After Effects", ozet: "After Effects içinde AI video araçları", renk: "bg-[#1d0d3f] text-[#9a9aff]" },
  { kisa: "Dv", ad: "DaVinci Resolve", ozet: "Resolve içinde AI renk & video araçları", renk: "bg-white/8 text-white/80" },
  { kisa: "Fg", ad: "Figma", ozet: "Figma içinde AI görsel & video araçları", renk: "bg-white/8 text-[#f24e1e]" },
  { kisa: "Bl", ad: "Blender", ozet: "Blender içinde AI 3D üretim araçları", renk: "bg-[#2a1a05] text-[#f5792a]" },
];

export function EklentiMenu({ onGit }: { onGit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="menu-surface absolute left-0 top-full z-50 mt-1 w-[380px] rounded-2xl p-2 shadow-2xl"
    >
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/35">Eklentiler</p>
      {EKLENTILER.map((e) => (
        <button
          key={e.ad}
          onClick={() => {
            onGit();
            // Toast'ı gercekEylem basar: kopyalama gerçekten olduysa başarı,
            // olmadıysa dürüst hata. (Eskiden kopyalamadan "kopyalandı" diyordu.)
            void kopyala(
              `https://vayra.ai/eklenti/${e.ad.toLowerCase().replace(/\s+/g, "-")}`,
              `${e.ad} kurulum bağlantısı kopyalandı`,
              e.ozet,
            );
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
        >
          {/* NOT: zemin renkleri gerçek ÜRÜN markalarının rengi (Photoshop lacivert,
              Blender turuncu…) — cam tint'iyle ezilmemeli. Bu yüzden .glass-ikon yerine
              sadece cam KENARI + üst ışığı ekleniyor, marka rengi korunuyor. */}
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ring-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${e.renk}`}>
            {e.kisa}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{e.ad}</span>
            <span className="block truncate text-xs text-white/45">{e.ozet}</span>
          </span>
        </button>
      ))}
    </motion.div>
  );
}
