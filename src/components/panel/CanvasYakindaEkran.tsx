"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, ArrowUpRight, Workflow, LayoutTemplate, Users, Check, Type, Image as ImageIcon, Film, AudioLines } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MorphicBackground } from "@/components/ui/morphic-background";

/**
 * CanvasYakindaEkran — Vayra Canvas'ın bekleme ekranı.
 *
 * Neden ortak YakindaSayfa değil: Canvas'ın tek satırlık vaadi "düğümleri
 * birbirine bağla" — bunu ANLATMAK yerine GÖSTERMEK gerekiyor. Eski ekranda
 * ortada bir Workflow ikonu ve altında bulanık renk lekeleri vardı; ürünün ne
 * olduğu hakkında hiçbir fikir vermiyordu.
 *
 * Buradaki kahraman görsel çalışan bir düğüm grafiği: kartlar bezier
 * bağlantılarla zincirlenmiş, bağlantılar üzerinde akış animasyonu var.
 * Ekranın kendisi ürünün demosu.
 */

const YETENEKLER = [
  { ikon: Workflow, ad: "Düğüm tabanlı iş akışı", aciklama: "Üretimleri bağla, adımları zincirle", renk: "#55d6fd" },
  { ikon: LayoutTemplate, ad: "Moodboard & şablonlar", aciklama: "Hazır şablonla başla, sonsuz tuvalde düzenle", renk: "#a78bfa" },
  { ikon: Users, ad: "Ekiple paylaşım", aciklama: "Tuvalini paylaş, birlikte üret", renk: "#4fd1a5" },
];

/* Grafikteki düğümler. Konumlar 520×360'lık bir görüş kutusuna göre yüzde.
   Gerçek canvas görselleri kullanılıyor (public/gercek/canvas). */
type Dugum = {
  id: string; ad: string; ikon: typeof Type; renk: string;
  x: number; y: number; g?: string; genis?: boolean; metin?: string;
};
/* Her düğüm zincirdeki KENDİ adımını gösterir. (İlk sürümde metinsiz düğümlerin
   hepsi aynı istem cümlesini basıyordu — seslendirme düğümü istem metnini
   tekrar edince akış mantıksız görünüyordu.) */
const DUGUMLER: Dugum[] = [
  { id: "istem", ad: "İstem", ikon: Type, renk: "#8b93a7", x: 2, y: 30,
    metin: "bozkırda kar yağarken kurtlarla yürüyen avcı…" },
  { id: "gorsel", ad: "Görsel", ikon: ImageIcon, renk: "#55d6fd", x: 33, y: 4, g: "/gercek/canvas/cv-hero-portre.webp" },
  { id: "video", ad: "Video", ikon: Film, renk: "#a78bfa", x: 33, y: 57, g: "/gercek/canvas/cv-hero-video.webp", genis: true },
  { id: "ses", ad: "Seslendirme", ikon: AudioLines, renk: "#f0a441", x: 74, y: 33,
    metin: "anlatıcı · sıcak ton · 0:24" },
];

/* Bağlantılar — (kaynak → hedef) bezier eğrileri. */
const BAGLAR = [
  { d: "M 96 148 C 150 148, 150 62, 196 62" },
  { d: "M 96 168 C 150 168, 150 232, 196 232" },
  { d: "M 320 84 C 380 84, 390 140, 440 152" },
  { d: "M 356 236 C 400 236, 410 180, 440 168" },
];

function DugumGrafigi() {
  const azHareket = useReducedMotion();
  return (
    <div className="relative aspect-[520/360] w-full overflow-hidden rounded-[24px]">
      {/* Tuval zemini + nokta ızgarası — Canvas'ın imza dokusu */}
      <div aria-hidden className="cv-tuval absolute inset-0" />

      {/* Bağlantılar: sabit çizgi + üstünde akan ışık (veri akışı hissi) */}
      <svg viewBox="0 0 520 360" className="absolute inset-0 h-full w-full" aria-hidden>
        {BAGLAR.map((b, i) => (
          <g key={i}>
            <path d={b.d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            {!azHareket && (
              <path d={b.d} fill="none" stroke="var(--sn-lime, #55d6fd)" strokeWidth="1.5"
                strokeDasharray="6 118" className="cv-akis" style={{ animationDelay: `${i * 0.55}s` }} />
            )}
          </g>
        ))}
        {/* uç noktalar */}
        {[[96, 148], [96, 168], [196, 62], [196, 232], [320, 84], [356, 236], [440, 152], [440, 168]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill="rgba(255,255,255,0.35)" />
        ))}
      </svg>

      {/* Düğüm kartları */}
      {DUGUMLER.map((d, i) => (
        <motion.div key={d.id}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 180 }}
          className="glass-kenar absolute overflow-hidden rounded-xl"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.genis ? "31%" : "24%" }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <d.ikon className="h-3 w-3 shrink-0" style={{ color: d.renk }} strokeWidth={2.4} />
            <span className="truncate text-[10.5px] font-semibold text-white">{d.ad}</span>
          </div>
          {d.g ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.g} alt="" aria-hidden loading="lazy"
              className={cn("w-full object-cover", d.genis ? "aspect-[16/9]" : "aspect-[3/4]")} />
          ) : (
            <div className="px-2 pb-2 text-[9px] leading-[1.5] text-metin-3">{d.metin}</div>
          )}
        </motion.div>
      ))}

      <span className="glass-kenar pointer-events-none absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-medium text-metin-2">
        tek tuvalde zincirlenmiş akış
      </span>
    </div>
  );
}

export function CanvasYakindaEkran() {
  const [haberVerildi, setHaberVerildi] = useState(false);
  const ANAHTAR = "vayra-canvas-haber-ver";

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ANAHTAR) === "1") setHaberVerildi(true);
  }, []);

  const haberVer = () => {
    setHaberVerildi(true);
    if (typeof window !== "undefined") localStorage.setItem(ANAHTAR, "1");
    toast.success("Kaydedildi", { description: "Canvas yayına girince ilk sen haberdar olacaksın." });
  };

  return (
    <div className="cv-yakinda relative min-h-[calc(100vh-3rem)] overflow-hidden bg-zemin">
      {/* Yükselen "gooey" parçacık arka planı — Vayra mavisi (#55d6fd).
          İçerikten (relative z-katmanı) ALTTA, aura'nın ARKASINDA durur. */}
      <MorphicBackground ballColor="#55d6fd" className="hidden" aralik={200} />

      <div aria-hidden className="cv-aura pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20">
        {/* ══════ SOL: anlatı ══════ */}
        <div className="min-w-0">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-kenar inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                style={{ background: "var(--sn-lime, #55d6fd)" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--sn-lime, #55d6fd)" }} />
            </span>
            Vayra Canvas · Yapım aşamasında
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="mt-5 text-[40px] font-bold leading-[1.06] tracking-tight text-white sm:text-[52px]">
            Fikirlerini <span className="cv-gradyan">birbirine bağla.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-metin-2">
            İstemden görsele, görselden videoya, videodan seslendirmeye — her adımı düğüm
            olarak koy, birbirine zincirle ve akışı tek tuvalde izle.{" "}
            <span className="font-semibold text-white">Yandaki tuval bunun canlı örneği.</span>
          </motion.p>

          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
            className="mt-8 grid gap-3.5">
            {YETENEKLER.map((y, i) => (
              <motion.li key={y.ad}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
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
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={haberVer} disabled={haberVerildi}
              className={cn("flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-transform",
                haberVerildi ? "glass-kenar text-metin-2" : "text-zemin hover:scale-[1.03] active:scale-[0.99]")}
              style={haberVerildi ? undefined : { background: "var(--sn-lime, #55d6fd)" }}>
              {haberVerildi ? <Check className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
              {haberVerildi ? "Haber verilecek" : "Yayına girince haber ver"}
            </button>
            <Link href="/panel/moodboard"
              className="glass-kenar flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
              Moodboard&apos;u dene <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </motion.div>
        </div>

        {/* ══════ SAĞ: canlı düğüm grafiği ══════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="glass-kenar relative rounded-[28px] p-3">
          <DugumGrafigi />
        </motion.div>
      </div>
    </div>
  );
}
