"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, ArrowUpRight, Film, Trophy, Users, Check, Play } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MorphicBackground } from "@/components/ui/morphic-background";

/**
 * OriginalsYakinda — Vayra Originals'ın bekleme ekranı.
 *
 * Neden ortak YakindaSayfa değil: o şablon her sayfaya aynı ortalanmış afişi
 * veriyor ve altındaki "önizleme şeridi" `kabukArka()` ile üretilmiş bulanık
 * renk lekelerinden ibaret — yani bir YAPIM vitrininin bekleme ekranında tek
 * bir kare bile görünmüyordu.
 *
 * Burada bunun yerine ilk yapımımızın (SIFIR NOKTASI) GERÇEK kareleri var. Ekran
 * "yakında içerik gelecek" demiyor; gelecek içeriği gösteriyor.
 */

/* SIFIR NOKTASI kareleri — 3D animasyon filmi (kullanıcı kararı 2026-07-31:
   "kök börü olmasın, konusu da kök börü olmasın").
   Yapım: terk edilmiş bir yörünge istasyonunda uyanan biyo-mekanik balinayı
   bulan genç bir mühendis-astronot. Palet kasıtlı olarak bizim cyan/turkuaz
   aksanımızla aynı — ekran markanın içinde durur, yabancı durmaz.
   Kareler Gemini görsel motoruyla üretildi (scripts/is-originals-sifir.json). */
const YAPIM = { ad: "SIFIR NOKTASI", altBaslik: "Uyanan sessizlik" };
const KAHRAMAN = "/gercek/orig/sn-hero.webp";
const KARELER = [
  { src: "/gercek/orig/sn-1.webp", oran: "aspect-[16/9]" },
  { src: "/gercek/orig/sn-2.webp", oran: "aspect-[3/4]" },
  { src: "/gercek/orig/sn-3.webp", oran: "aspect-[16/9]" },
  { src: "/gercek/orig/sn-4.webp", oran: "aspect-[3/4]" },
  { src: "/gercek/orig/sn-5.webp", oran: "aspect-[16/9]" },
  { src: "/gercek/orig/sn-6.webp", oran: "aspect-[3/4]" },
];

const YETENEKLER = [
  { ikon: Film, ad: "Orijinal dizi & filmler", aciklama: "Baştan sona AI ile üretilmiş özgün yapımlar", renk: "#a78bfa" },
  { ikon: Trophy, ad: "Yarışmalar & ödüller", aciklama: "İşini gönder, sahnede yerini al", renk: "#f0a441" },
  { ikon: Users, ad: "Topluluk seçkileri", aciklama: "En çok beğenilen işler öne çıkar", renk: "#4fd1a5" },
];

export function OriginalsYakinda() {
  const [haberVerildi, setHaberVerildi] = useState(false);
  const ANAHTAR = "vayra-originals-haber-ver";

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ANAHTAR) === "1") setHaberVerildi(true);
  }, []);

  const haberVer = () => {
    setHaberVerildi(true);
    if (typeof window !== "undefined") localStorage.setItem(ANAHTAR, "1");
    toast.success("Kaydedildi", { description: "Originals yayına girince ilk sen haberdar olacaksın." });
  };

  return (
    <div className="orig-yakinda relative min-h-[calc(100vh-3rem)] overflow-hidden bg-zemin">
      {/* Yükselen "gooey" parçacık arka planı — Vayra mavisi (#55d6fd).
          Kahraman kare üstü kapladığı için parçacıklar ALT bölümde görünür. */}
      <MorphicBackground ballColor="#55d6fd" className="hidden" aralik={200} />

      {/* ══════ KAHRAMAN: gerçek yapım karesi, tam genişlik ══════
          Sinema vitrini olduğu için ekran bir AFİŞ gibi açılır: kare tüm üstü
          kaplar, metin onun üstünde durur. */}
      <div className="relative">
        <div className="relative h-[clamp(340px,52vh,520px)] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KAHRAMAN} alt="" aria-hidden
            className="h-full w-full object-cover" />
          {/* Okunabilirlik örtüsü — metin karenin üstünde AA kontrastı korumalı. */}
          <div className="absolute inset-0 orig-ortu" />
        </div>

        {/* Kahraman metni — karenin alt kısmına oturur. */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-6 pb-9">
            <motion.span
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-kenar inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                  style={{ background: "var(--sn-lime, #55d6fd)" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--sn-lime, #55d6fd)" }} />
              </span>
              Vayra Originals · Yapım aşamasında
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="mt-4 max-w-2xl text-[38px] font-bold leading-[1.05] tracking-tight text-white sm:text-[50px]">
              İlk orijinal yapımlarımız <span className="orig-gradyan">sahneye çıkıyor.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-4 max-w-xl text-[16px] leading-relaxed text-metin-2">
              Topluluğun ve Vayra&apos;nın birlikte ürettiği kısa filmler, diziler ve yarışmalar
              için özel bir sahne hazırlıyoruz. Buradaki kareler yer tutucu değil:{" "}
              <span className="font-semibold text-white">ilk yapımımız {YAPIM.ad}&apos;ndan.</span>
            </motion.p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-9">
        {/* ══════ Yetenekler + CTA ══════ */}
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-1">
            {YETENEKLER.map((y, i) => (
              <motion.li key={y.ad}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.05 }}
                className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: `color-mix(in srgb, ${y.renk} 14%, transparent)`, color: y.renk }}>
                  <y.ikon className="h-[17px] w-[17px]" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold text-white">{y.ad}</span>
                  <span className="block text-[13px] leading-snug text-metin-3">{y.aciklama}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="glass-kenar rounded-2xl p-5">
            <p className="text-[15px] font-semibold text-white">Sahne açıldığında haberin olsun</p>
            <p className="mt-1.5 text-[13px] leading-snug text-metin-3">
              İlk bölüm yayına girdiğinde ve yarışma başvuruları açıldığında sana haber veririz.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button onClick={haberVer} disabled={haberVerildi}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-bold transition-transform",
                  haberVerildi ? "glass-kenar text-metin-2" : "text-zemin hover:scale-[1.02] active:scale-[0.99]")}
                style={haberVerildi ? undefined : { background: "var(--sn-lime, #55d6fd)" }}>
                {haberVerildi ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {haberVerildi ? "Haber verilecek" : "Haber ver"}
              </button>
              <Link href="/panel/akis"
                className="glass-kenar flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
                Akış&apos;a göz at <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ══════ YAPIM KARELERİ ══════
            Eski ekrandaki 5 bulanık renk lekesinin yerine GERÇEK kareler. */}
        <div className="mt-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-metin-3">
              {YAPIM.ad} · {YAPIM.altBaslik}
            </span>
            <span className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[12px] text-metin-3">yapım aşamasında</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {KARELER.map((k, i) => (
              <motion.div key={k.src}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34 + i * 0.05 }}
                className={cn("group relative overflow-hidden rounded-xl border border-white/[0.07]",
                  // Yatay kareler iki sütun kaplasın — ritim tekdüze olmasın.
                  k.oran === "aspect-[16/9]" ? "col-span-2 aspect-[16/9]" : "aspect-[3/4]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.src} alt="" aria-hidden loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                {/* Rozet MEDYA ÜSTÜNDE duruyor: .glass-kenar burada yanlış —
                    backdrop-filter altındaki parlak kareyi çekip rozeti turuncu
                    yapıyordu. Medya üstü rozetlerin kuralı koyu yarı-saydam
                    zemin (ürünün geri kalanındaki .glass deseni). */}
                {k.oran === "aspect-[16/9]" && (
                  <span className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    <Play className="h-2.5 w-2.5 fill-current" /> sahne
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
