"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Bell, ArrowLeft, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { onizlemeArka, cn } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

/**
 * YakindaSayfa — "Yakında burada olacağız" tanıtım/bekleme ekranı.
 *
 * Henüz yayında olmayan (veya yeniden yapım aşamasındaki) özellikler için
 * tekrar kullanılabilir premium bekleme sayfası. Error/boş-durum sayfası gibi
 * düşünülür: başlık + açıklama + animasyonlu görsel + "haber ver" CTA + öne
 * çıkan alt-özellik kartları. `.sinema-kapsam` ile lime imza aktif olur.
 */
export function YakindaSayfa({
  etiket = "Çok yakında",
  baslik,
  aciklama,
  ikon: Ikon = Sparkles,
  ozellikler = [],
  gorselTohum = "yakinda",
}: {
  etiket?: string;
  baslik: string;
  aciklama: string;
  ikon?: LucideIcon;
  ozellikler?: { ikon: LucideIcon; ad: string; aciklama: string }[];
  gorselTohum?: string;
}) {
  const [haberVerildi, setHaberVerildi] = useState(false);

  return (
    <div className="sinema-kapsam relative min-h-[calc(100vh-3rem)] overflow-hidden bg-zemin">
      {/* Arka plan — yumuşak lime ışıma + ince ızgara */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--sn-lime), transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(var(--sn-lime) 1px, transparent 1px), linear-gradient(90deg, var(--sn-lime) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center sm:py-24">
        {/* Rozet */}
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-aksan/25 bg-aksan/10 px-4 py-1.5 text-[13px] font-semibold text-aksan">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aksan opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-aksan" />
          </span>
          {etiket}
        </motion.span>

        {/* İkon rozeti — hafif salınım */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 200 }}
          className="mb-7">
          <motion.span
            animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-aksan to-emerald-400 text-zemin shadow-[0_12px_40px_-8px_rgba(85,_214,_253,0.5)]">
            <Ikon className="h-10 w-10" strokeWidth={2} />
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          {baslik}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mt-4 max-w-xl text-[16px] leading-relaxed text-metin-2">
          {aciklama}
        </motion.p>

        {/* CTA'lar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={() => { setHaberVerildi(true); toast.success("Haber listesine eklendin", { description: "Yayına girince ilk sen haberdar olacaksın." }); }}
            disabled={haberVerildi}
            className={cn("flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-transform",
              haberVerildi ? "bg-white/10 text-metin-2" : "bg-aksan text-zemin hover:scale-[1.03]")}>
            <Bell className="h-4.5 w-4.5" /> {haberVerildi ? "Haber verilecek ✓" : "Yayına girince haber ver"}
          </button>
          <Link href="/panel"
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/8">
            <ArrowLeft className="h-4.5 w-4.5" /> Keşfet'e göz at
          </Link>
        </motion.div>

        {/* Öne çıkan özellik önizlemeleri */}
        {ozellikler.length > 0 && (
          <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
            {ozellikler.map((o, i) => (
              <motion.div key={o.ad}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.07 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-left transition-colors hover:border-aksan/20 hover:bg-white/[0.04]">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-aksan/12 text-aksan">
                  <o.ikon className="h-5 w-5" />
                </span>
                <p className="text-[15px] font-semibold text-white">{o.ad}</p>
                <p className="mt-1 text-[13px] leading-snug text-metin-3">{o.aciklama}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Görsel şerit — yakında gelecek içerik hissi (bulanık, karartılı önizleme) */}
        <div className="pointer-events-none mt-16 flex w-full max-w-3xl gap-3 overflow-hidden opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] flex-1 rounded-xl blur-[2px]"
              style={{ background: kabukArka(gorselTohum + i, i % 2 ? "sinematik" : "portre") }} />
          ))}
        </div>
      </div>
    </div>
  );
}
