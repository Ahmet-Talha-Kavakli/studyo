"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Brain, CalendarClock, Lock, MousePointer2, Presentation, Rocket, Sparkles, Wand2, X, ListChecks } from "lucide-react";

/** Usta yenilikleri (Claude/ChatGPT "What's new"). Sürüm anahtarı değişince menüde nokta görünür. */
export const YENILIK_SURUM = "2026-10-27";
const LISTE = [
  { ikon: MousePointer2, baslik: "Siteyi tıklayarak düzenle", metin: "Önizlemede öğe seç ve ne değişeceğini yaz ya da metni yerinde düzenle; her değişiklik yeni sürüm olur.", href: null },
  { ikon: Rocket, baslik: "Yayınla ve remixle", metin: "Uygulamanı herkese açık bir bağlantıyla yayınla; istersen başkaları kendi sohbetinde kopyalasın.", href: null },
  { ikon: ListChecks, baslik: "Çok adımlı plan", metin: "Görsel, sayfa ve metinden oluşan işlerde önce plan ve kredi tahmini; onaylamadan hiçbir şey çalışmaz.", href: null },
  { ikon: Wand2, baslik: "Görselde alan seçip düzenle", metin: "Panelde fırçayla bir bölgeyi işaretle, ne değişeceğini yaz.", href: null },
  { ikon: CalendarClock, baslik: "Zamanlanmış görevler", metin: "Her sabah özet, her pazartesi içerik planı… Sonuç yeni bir sohbette.", href: "/panel/supercomputer/gorevler" },
  { ikon: BarChart3, baslik: "Yanıt içi grafikler", metin: "Sayısal karşılaştırmalar etkileşimli grafikle; tablo görünümü ve CSV indirme.", href: null },
  { ikon: Presentation, baslik: "Belgeden sunum", metin: "Belge panelindeki düğmeyle slaytlara çevir, tam ekran sun, PDF al.", href: null },
  { ikon: Brain, baslik: "Daha akıllı bellek", metin: "Kategoriler, başka yapay zekâlardan aktarma ve sohbetlerden otomatik hatırlama.", href: "/panel/supercomputer/ayarlar/hafiza" },
  { ikon: Lock, baslik: "Sohbet kilidi", metin: "Bir sohbeti şifreyle kilitle; kenar çubuğunda ve aramada görünmez.", href: null },
];

export function Yenilikler({ onKapat }: { onKapat: () => void }) {
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return createPortal(
    <div className="sc-kapsam fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label="Yenilikler" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[86vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] bg-[#18181b] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-start gap-3 px-6 pb-3 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#55d6fd]/25 to-[#8b7bff]/25 text-[var(--sc-aksan)]"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold">Usta'da yeni</h2>
            <p className="text-[13px] text-[var(--sc-metin-3)]">{new Date(YENILIK_SURUM).toLocaleDateString("tr", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
          {LISTE.map((y, i) => {
            const ic = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.05] text-[var(--sc-metin-2)]"><y.ikon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium">{y.baslik}</span><span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--sc-metin-3)]">{y.metin}</span></span>
              </>
            );
            return (
              <motion.li key={y.baslik} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                {y.href ? <Link href={y.href} onClick={onKapat} className="flex gap-3 rounded-[14px] p-3 hover:bg-white/[0.04]">{ic}</Link> : <div className="flex gap-3 rounded-[14px] p-3">{ic}</div>}
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </div>,
    document.body,
  );
}
