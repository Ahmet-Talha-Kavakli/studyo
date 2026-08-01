"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Minus,
  Plus,
  Sparkles,
  X,
  Disc,
  CheckCircle2,
  Palette,
  Boxes,
  Package,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";

/* ============================================================
   VAYRA EKLENTİ LANDING — Higgsfield /plugins/[slug] birebir klon
   ------------------------------------------------------------
   slug === "adobe"     → Adobe (After Effects) landing
   slug === "minecraft" → Minecraft landing
   tanınmayan           → jenerik "Yakında"

   TEMA: `.sinema-kapsam` sarıcı → lime (--sn-lime) imzası aktif.
   KOYU bölüm var(--sn-zemin) zemin; BEYAZ bölüm #FFFFFF + #0f1113 metin.
   Ortak FİYATLANDIRMA + SSS iki landing'de PAYLAŞILIR.
   Butonlar GERÇEK hedeflere gider (router.push / sayfa-içi kaydırma); henüz
   karşılığı olmayanlar dürüst "yakında" mesajı verir. SSR güvenli
   (render'da Date.now/Math.random YOK).
   ============================================================ */

const LIME = "var(--sn-lime)";
const LIME_METIN = "var(--sn-lime-metin)";
const PEMBE = "#ec2d6e";
const MAVI = "#2b5cff";
const ADOBE_KIRMIZI = "#eb1000";

export default function EklentiLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <div className="sinema-kapsam bg-[var(--sn-zemin)]">
      {slug === "adobe" ? (
        <AdobeLanding />
      ) : slug === "minecraft" ? (
        <MinecraftLanding />
      ) : (
        <YakindaLanding slug={slug} />
      )}
    </div>
  );
}

/* ============================================================
   ORTAK: geri linki
   ============================================================ */
function GeriBar({ koyu = true }: { koyu?: boolean }) {
  return (
    <Link
      href="/panel/eklentiler"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-colors",
        koyu ? "text-white/60 hover:text-white" : "text-neutral-500 hover:text-neutral-900",
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Tüm eklentiler
    </Link>
  );
}

/* ============================================================
   ORTAK: İndir butonu (lime, koyu metin) + toast
   ============================================================ */
function IndirButonu({
  metin = "İndir",
  onClick,
  className,
}: {
  metin?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick ?? (() => toast.success(`${metin} başlatıldı`, { description: "Kurulum sihirbazı yeni sekmede açılıyor — talimatları izle." }))}
      className={cn(
        "hf-uret hf-btn inline-flex items-center gap-2 px-7 py-3.5 text-sm md:text-base",
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {metin}
    </button>
  );
}

/* ============================================================
   ORTAK: bölüm başlığı (koyu/beyaz)
   ============================================================ */
function BolumBaslik({
  ust,
  baslik,
  alt,
  koyu,
}: {
  ust?: string;
  baslik: string;
  alt?: string;
  koyu: boolean;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
      {ust && (
        <div
          className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: koyu ? LIME : ADOBE_KIRMIZI }}
        >
          {ust}
        </div>
      )}
      <h2
        className={cn("hf-baslik text-3xl md:text-5xl", koyu ? "text-white" : "text-[#0f1113]")}
      >
        {baslik}
      </h2>
      {alt && (
        <p className={cn("mt-4 text-base md:text-lg", koyu ? "text-[var(--sn-metin-2)]" : "text-neutral-500")}>
          {alt}
        </p>
      )}
    </div>
  );
}

/* ============================================================================
   ADOBE LANDING
   ============================================================================ */
function AdobeLanding() {
  return (
    <main>
      <AdobeHero />
      <MarkaKarti />
      <UcAdim
        koyu={false}
        baslik="ÜÇ ADIMDA BAŞLA"
        segmentTipi="os"
        adimlar={ADOBE_ADIMLAR}
      />
      <YeniMotorlar />
      <YayinaGiden />
      <Topluluk />
      <Fiyatlandirma />
      <Sss sorular={ADOBE_SSS} />
      <BlogCarousel />
    </main>
  );
}

/* ---- Adobe HERO (koyu) ---------------------------------------------------- */
const ADOBE_SEKMELER = [
  { ad: "Photoshop", ikon: "Ps", renk: "#31a8ff", aktif: false },
  { ad: "After Effects", ikon: "Ae", renk: "#9999ff", aktif: true },
  { ad: "Premiere Pro", ikon: "Pr", renk: "#ea77ff", aktif: false },
  { ad: "DaVinci Resolve", ikon: "◧", renk: "#fb923c", aktif: false },
  { ad: "Figma", ikon: "F", renk: "#a259ff", aktif: false },
];

function AdobeHero() {
  const [sekme, setSekme] = useState(1);
  return (
    <section className="hf-nokta-izgara relative overflow-hidden bg-[var(--sn-zemin)] px-5 pb-16 pt-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <GeriBar />

        <div className="mt-10 grid items-center gap-10 md:mt-14 md:grid-cols-[1.15fr_1fr]">
          {/* Sol: metin */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70"
            >
              Şimdi Kullanılabilir
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="hf-baslik mt-4 text-4xl text-white md:text-6xl"
            >
              VAYRA ARTIK{" "}
              <span
                className="inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-lg text-lg md:h-12 md:w-12 md:text-2xl"
                style={{ background: "#00005b", color: "#9999ff" }}
              >
                Ae
              </span>{" "}
              AFTER EFFECTS İÇİNDE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-lg text-base text-[var(--sn-metin-2)] md:text-lg"
            >
              After Effects artık Reframe, Arka Plan Sil, Yükselt, Çiz ve
              Düzenle ile — beş profesyonel eklenti, dışa aktarma yok, uygulama
              değiştirme yok.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8"
            >
              <IndirButonu metin="İndir" />
            </motion.div>

            {/* App sekmeleri */}
            <div className="mt-8 flex flex-wrap gap-2">
              {ADOBE_SEKMELER.map((s, i) => (
                <button
                  key={s.ad}
                  onClick={() => setSekme(i)}
                  className={cn(
                    "hf-btn inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors md:text-sm",
                    sekme === i
                      ? "bg-[var(--sn-cip-hover)] text-white ring-1 ring-white/15"
                      : "bg-[var(--sn-cip)] text-[var(--sn-metin-2)] hover:text-white",
                  )}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-black"
                    style={{ background: "rgba(255,255,255,0.08)", color: s.renk }}
                  >
                    {s.ikon}
                  </span>
                  {s.ad}
                </button>
              ))}
            </div>
          </div>

          {/* Sağ: Eklenti paneli mockup'ı */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <EklentiPaneliMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Higgsfield After Effects içi eklenti paneli mockup'ı (birebir) */
function EklentiPaneliMockup() {
  const router = useRouter();
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1113] p-3.5 shadow-2xl">
      {/* Başlık satırı */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-bold text-white">Vayra</span>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
          style={{ background: LIME, color: LIME_METIN }}
        >
          Eklentiler
        </span>
        <span className="text-[11px] text-[var(--sn-metin-3)]">v0.4</span>
        <div className="ml-auto h-6 w-6 rounded-full bg-[var(--sn-cip)]" />
      </div>

      {/* REFRAME promo kartı — turuncu gradyan */}
      <div
        className="relative mb-3 overflow-hidden rounded-xl p-3"
        style={{ background: "linear-gradient(120deg,#f4794a,#f9b48a)" }}
      >
        <div className="max-w-[62%]">
          <div className="text-sm font-black text-[#3a1500]">REFRAME</div>
          <div className="mt-0.5 text-[10px] leading-tight text-[#5a2a10]">
            İstediğin orana yeniden çerçevele — özne merkezde kalır
          </div>
          <button
            onClick={() => router.push("/panel/reframe")}
            className="hf-btn mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#3a1500]"
          >
            Şimdi dene ↗
          </button>
        </div>
        <div className="absolute -right-1 top-2 flex gap-1">
          <div className="h-16 w-12 -rotate-6 rounded-md bg-white/40 ring-1 ring-white/50" />
          <div className="h-16 w-12 rotate-3 rounded-md bg-white/60 ring-1 ring-white/60" />
        </div>
      </div>

      {/* Son üretimler */}
      <div className="mb-1 text-xs font-semibold text-white">Son üretimler</div>
      <div className="mb-3 text-[10px] text-[var(--sn-metin-3)]">
        Yüksek kaliteli videolar üret
      </div>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => router.push("/panel/video")}
          className="flex aspect-square items-center justify-center rounded-lg bg-[var(--sn-cip)] text-lg text-[var(--sn-metin-2)]"
        >
          +
        </button>
        <div
          className="aspect-square rounded-lg"
          style={{ background: "linear-gradient(135deg,#5b6472,#2a2f38)" }}
        />
        <div
          className="aspect-square rounded-lg"
          style={{ background: "linear-gradient(135deg,#7a5a3a,#3a2a1a)" }}
        />
      </div>

      {/* Uygulamalar */}
      <div className="mb-1 text-xs font-semibold text-white">Uygulamalar</div>
      <div className="mb-3 text-[10px] text-[var(--sn-metin-3)]">
        Yüksek kaliteli videolar üret
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-[var(--sn-cip)] p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="h-4 w-4 rounded" style={{ background: LIME }} />
            <span className="text-[11px] font-semibold text-white">Supercomputer</span>
            <span
              className="rounded px-1 py-px text-[7px] font-black"
              style={{ background: LIME, color: LIME_METIN }}
            >
              YENİ
            </span>
          </div>
          <div className="text-[9px] text-[var(--sn-metin-3)]">Her şey için tek sohbet</div>
        </div>
        <div className="rounded-lg bg-[var(--sn-cip)] p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-white/20" />
            <span className="text-[11px] font-semibold text-white">Arka planı kaldır</span>
          </div>
          <div className="text-[9px] text-[var(--sn-metin-3)]">Video öznesini kes</div>
        </div>
      </div>
    </div>
  );
}

/* ---- Marka kartı (beyaz gradient) ---------------------------------------- */
function MarkaKarti() {
  return (
    <section className="bg-white px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div
          className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[28px] p-10 text-center md:min-h-[300px]"
          style={{ background: "linear-gradient(180deg,#efe9ff 0%,#ffffff 70%)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="h-9 w-9 rounded-lg" style={{ background: LIME }} />
            <div className="text-left leading-none">
              <div className="hf-baslik text-4xl text-[#0f1113] md:text-6xl">Vayra</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Eklentiler
              </div>
            </div>
            <span className="hf-baslik text-3xl text-neutral-400 md:text-5xl">—</span>
            <span
              className="hf-baslik text-5xl md:text-8xl"
              style={{ color: ADOBE_KIRMIZI }}
            >
              Adobe
            </span>
            <span className="hf-baslik text-2xl text-[#0f1113] md:text-4xl">için</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- YENİ MOTORLAR (beyaz bento) ----------------------------------------- */
function YeniMotorlar() {
  const router = useRouter();
  return (
    <section className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <BolumBaslik baslik="ARAÇLARINDA TAZE MOTORLAR" koyu={false} />
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Sol büyük — Supercomputer */}
          <div className="rounded-3xl bg-[#f4f4f5] p-6 md:row-span-2">
            <div className="mb-4 h-10 w-10 rounded-xl" style={{ background: LIME }} />
            <h3 className="hf-baslik text-2xl text-[#0f1113] md:text-3xl">
              EKLENTİLERİN İÇİNDE SUPERCOMPUTER
            </h3>
            <button
              onClick={() => router.push("/panel/supercomputer")}
              className="hf-uret hf-btn mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <Sparkles className="h-4 w-4" /> Şimdi başla
            </button>
            <div className="mt-6 scale-95 origin-top">
              <EklentiPaneliMockupAcik />
            </div>
          </div>

          {/* Gemini Omni Flash */}
          <div className="rounded-3xl bg-[#f4f4f5] p-6">
            <h3 className="hf-baslik text-2xl text-[#0f1113]">GEMINI OMNI FLASH</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Gerçek dünyayı anlayan video üretimi
            </p>
            <div
              className="mt-4 aspect-[16/7] rounded-xl"
              style={{ background: "linear-gradient(120deg,#1e293b,#0f172a)" }}
            />
          </div>

          {/* Seed Audio 1.0 */}
          <div className="rounded-3xl bg-[#f4f4f5] p-6">
            <h3 className="hf-baslik text-2xl text-[#0f1113]">SEED AUDIO 1.0</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Komuttan sesler, diyalog ve ambiyans
            </p>
            <div className="mt-4 flex h-16 items-end gap-1">
              {[8, 16, 10, 22, 14, 28, 12, 20, 9, 24, 15, 30, 11].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-neutral-300"
                  style={{ height: `${h * 2}px` }}
                />
              ))}
            </div>
          </div>

          {/* MCP Köprüsü — KOYU kart, 2 kolon */}
          <div className="rounded-3xl bg-[#0f1113] p-6 md:col-span-2">
            <div className="mb-3 h-9 w-9 rounded-xl" style={{ background: LIME }} />
            <h3 className="hf-baslik text-2xl text-white md:text-3xl">MCP KÖPRÜSÜ</h3>
            <p className="mt-2 max-w-lg text-sm text-white/60">
              MCP köprüsü Vayra'nın motorlarını Claude'a bağlar; uygulama
              değiştirmeden üretirsin.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <code className="text-sm" style={{ color: LIME }}>
                bridge.vayra.ai/mcp
              </code>
              <button
                onClick={() => { void kopyala("bridge.vayra.ai/mcp", "MCP adresi kopyalandı"); }}
                className="text-white/50 transition-colors hover:text-white"
              >
                ⧉
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Açık temalı küçük panel mockup (bento içinde) */
function EklentiPaneliMockupAcik() {
  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold text-[#0f1113]">Vayra</span>
        <span
          className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase"
          style={{ background: LIME, color: LIME_METIN }}
        >
          Eklentiler
        </span>
      </div>
      <div
        className="mb-2 rounded-lg p-2.5"
        style={{ background: "linear-gradient(120deg,#f4794a,#f9b48a)" }}
      >
        <div className="text-xs font-black text-[#3a1500]">REFRAME</div>
        <div className="text-[9px] text-[#5a2a10]">Özne merkezde kalır</div>
      </div>
      <div className="mb-1 text-[10px] font-semibold text-[#0f1113]">Son üretimler</div>
      <div className="grid grid-cols-3 gap-1">
        <div className="aspect-square rounded bg-neutral-100" />
        <div className="aspect-square rounded" style={{ background: "linear-gradient(135deg,#5b6472,#2a2f38)" }} />
        <div className="aspect-square rounded" style={{ background: "linear-gradient(135deg,#7a5a3a,#3a2a1a)" }} />
      </div>
    </div>
  );
}

/* ---- YAYINA GİDEN İŞ (beyaz) — zigzag özellik blokları -------------------- */
type AdobeOzellik = {
  baslik: string;
  metin: string;
  mockup: "video" | "gorsel" | "reframe" | "arkaplan" | "ciz" | "buyut";
};

const ADOBE_OZELLIKLER: AdobeOzellik[] = [
  {
    baslik: "GÖRSEL VİDEO ÜRET",
    metin:
      "Herhangi bir klibi doğal dille oluştur. Sahneler, karakterler, B-roll ya da kamera hareketleri — ne istediğini yaz, Vayra sonucu doğrudan Adobe zaman çizelgene bıraksın.",
    mockup: "video",
  },
  {
    baslik: "GÖRSEL ÜRET",
    metin:
      "Herhangi bir görseli doğal dille oluştur. Arka planlar, kaplamalar, başlık kartları ya da sahne öğeleri — yaz, Vayra sonucu doğrudan tuvaline düşürsün.",
    mockup: "gorsel",
  },
  {
    baslik: "YENİDEN ÇERÇEVELE",
    metin:
      "Herhangi bir klibi 9:16, 16:9, 4:3, 3:4, 21:9 veya 1:1'e tek tıkla kırp. Akıllı özne takibi, oran değişse de odak noktasını tam merkezde tutar.",
    mockup: "reframe",
  },
  {
    baslik: "ARKA PLANI KALDIR",
    metin:
      "Yeşil perde olmadan temiz key çıkar. AI özneleri piksel hassasiyetiyle algılar — keskin kenarlar, yumuşak saç detayı ve kompozisyona hazır saf alpha kanalı.",
    mockup: "arkaplan",
  },
  {
    baslik: "ÇİZ VE DÜZENLE",
    metin:
      "Ne değişsin istiyorsan doğrudan karenin üstüne çiz. İstenmeyen nesneleri kaldır, yeni öğe ekle ya da tüm bir alanı tek fırça darbesiyle değiştir — Adobe içinde çalışan inpainting.",
    mockup: "ciz",
  },
  {
    baslik: "BÜYÜT",
    metin:
      "Herhangi bir klibi gerçek detay geri kazanımıyla 4K veya 8K'ya çıkar — piksel gerdirme değil. Arşiv görüntüsünü kurtar, düşük çözünürlüğü toparla, modern kaliteyi teslim et.",
    mockup: "buyut",
  },
];

function YayinaGiden() {
  return (
    <section className="bg-white">
      <div className="px-5 pt-16 md:px-10 md:pt-24">
        <BolumBaslik baslik="GERÇEKTEN YAYINA GİDEN İŞ İÇİN" koyu={false} />
      </div>
      {ADOBE_OZELLIKLER.map((o, i) => (
        <div key={i} className="px-5 py-10 md:px-10 md:py-14">
          <div
            className={cn(
              "mx-auto flex max-w-5xl flex-col items-center gap-8 md:gap-14",
              i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse",
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="w-full md:w-1/2"
            >
              <h3 className="hf-baslik text-3xl text-[#0f1113] md:text-4xl">{o.baslik}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-500 md:text-lg">
                {o.metin}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="w-full md:w-1/2"
            >
              <OzellikMockup tip={o.mockup} />
            </motion.div>
          </div>
        </div>
      ))}
    </section>
  );
}

function OzellikMockup({ tip }: { tip: AdobeOzellik["mockup"] }) {
  const cerceve =
    "aspect-[4/3] w-full rounded-2xl border border-neutral-200 bg-[#111114] p-4 shadow-xl overflow-hidden";

  if (tip === "video") {
    return (
      <div className={cerceve}>
        <div
          className="mb-3 aspect-video w-full rounded-lg"
          style={{ background: "linear-gradient(135deg,#2e7d5b,#1a4d3a)" }}
        />
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["⌗ Reframe", "✎ Temizle", "⧉ Arka Plan Sil", "⤢ Büyüt"].map((c) => (
            <span key={c} className="rounded-md bg-white/8 px-2 py-1 text-[10px] text-white/80">
              {c}
            </span>
          ))}
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white/40">
          Fikrini yaz
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/60">
          <span className="rounded bg-white/8 px-1.5 py-0.5">+</span>
          <span className="rounded bg-white/8 px-1.5 py-0.5">▮▮ Seedance 2.0</span>
          <span className="rounded bg-white/8 px-1.5 py-0.5">16:9 · 720p ⌄</span>
          <span className="ml-auto rounded px-1.5 py-0.5 font-bold" style={{ background: LIME, color: LIME_METIN }}>
            ✦ 12
          </span>
        </div>
      </div>
    );
  }
  if (tip === "gorsel") {
    return (
      <div className={cerceve}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] text-white/50">◁</span>
          <div className="flex rounded-lg bg-white/8 p-0.5 text-[10px]">
            <span className="rounded px-2 py-1 text-white/50">▢ Video</span>
            <span className="rounded bg-white/15 px-2 py-1 font-semibold text-white">▣ Görsel</span>
          </div>
          <span className="rounded bg-white/8 px-2 py-1 text-[10px] text-white/70">⊞ Görünüm</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            "linear-gradient(135deg,#6d4a8a,#2a1a3a)",
            "linear-gradient(135deg,#8a6d4a,#3a2a1a)",
            "linear-gradient(135deg,#4a6d8a,#1a2a3a)",
            "linear-gradient(135deg,#8a4a6d,#3a1a2a)",
          ].map((bg, i) => (
            <div
              key={i}
              className={cn("aspect-square rounded-lg", i === 1 && "ring-2")}
              style={{ background: bg, ...(i === 1 ? { boxShadow: `0 0 0 2px ${"var(--sn-lime)"}` } : {}) }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (tip === "reframe") {
    return (
      <div className={cerceve}>
        <div
          className="relative flex aspect-[4/3] w-full items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg,#3a4a5a,#1a242e)" }}
        >
          <div className="absolute inset-8 rounded border-2 border-dashed border-white/70" />
          <span className="absolute left-6 top-6 text-white/80">↖</span>
          <span className="absolute bottom-6 right-6 text-white/80">↘</span>
          <span className="absolute right-4 top-1/3 text-lg">🖐</span>
          <div className="flex gap-1.5">
            {["9:16", "16:9", "1:1", "21:9"].map((o, i) => (
              <span
                key={o}
                className="rounded px-2 py-1 text-[10px] font-semibold"
                style={i === 1 ? { background: LIME, color: LIME_METIN } : { background: "rgba(255,255,255,0.1)", color: "#fff" }}
              >
                {o}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (tip === "arkaplan") {
    return (
      <div className={cerceve}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg hf-dama">
          <div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ background: "linear-gradient(135deg,#c9a880,#8a6a4a)" }}
          />
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
          <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] text-neutral-600 shadow">
            ‹›
          </div>
        </div>
      </div>
    );
  }
  if (tip === "ciz") {
    return (
      <div className={cerceve}>
        <div
          className="relative mb-3 aspect-video w-full rounded-lg"
          style={{ background: "linear-gradient(135deg,#2e7d5b,#1a4d3a)" }}
        >
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
            <path d="M20 30 q10 -14 24 0 t24 4" fill="none" stroke="var(--sn-lime)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">5.4s</span>
        </div>
        <div className="mb-2 flex items-center gap-1.5">
          {["var(--sn-lime)", "#fff", "#ef4444", "#f97316", "#22c55e", "#3b82f6", "#a855f7"].map((c, i) => (
            <span
              key={i}
              className={cn("h-4 w-4 rounded-full", i === 0 && "ring-2 ring-white")}
              style={{ background: c }}
            />
          ))}
          <span className="ml-auto text-[10px] text-white/50">Fırça</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
          <span className="rounded bg-white/8 px-1.5 py-0.5">✎ Çiz ve Düzenle · 720p ⌄</span>
          <span className="ml-auto rounded px-1.5 py-0.5 font-bold" style={{ background: LIME, color: LIME_METIN }}>↑</span>
        </div>
      </div>
    );
  }
  // buyut — before/after
  return (
    <div className={cerceve}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <div
          className="absolute inset-0 blur-sm"
          style={{ background: "linear-gradient(135deg,#4a4a5a,#2a2a3a)" }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2"
          style={{ background: "linear-gradient(135deg,#6a6a8a,#3a3a4a)" }}
        />
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
        <span className="absolute left-3 top-3 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">4K</span>
        <span className="absolute right-3 top-3 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: LIME, color: LIME_METIN }}>8K</span>
      </div>
    </div>
  );
}

/* ---- TOPLULUK (beyaz) — testimonial carousel ------------------------------ */
const YORUMLAR = [
  {
    baslik: "Bir süredir Vayra kullanıyorum…",
    govde:
      "Bir süredir yaratıcı işlerim için Vayra kullanıyorum ve dürüst olmak gerekirse piyasadaki en iyi platformlardan biri — araçlar güçlü, sonuçlar kendini gösteriyor. Ama bunu yazmama sebep olan destekti. Kredilerimle ilgili bir sorum vardı, nadir görülen bir şeffaflık ve özenle çözdüler.",
    ad: "Alperen",
    harf: "A",
  },
  {
    baslik: "Yeni müşteriyim ve bayıldım!",
    govde:
      "Vayra'nın yeni müşterisiyim ve çok keyif alıyorum! Harika videolar üretiyorum. Platformdaki gelişmeleri sabırsızlıkla bekliyorum! Ayrıca destek servisi mükemmel!",
    ad: "Selin",
    harf: "S",
  },
  {
    baslik: "Vayra A.I.",
    govde:
      "Vayra A.I., 2008'de kurguya başladığımdan beri kullandığım en iyi ve en heyecan verici araç oldu! Bir cümle yazıp diğer uçtan sinema kalitesinde video almak inanılmaz. Site bazen çok kapsamlı gelebiliyor ama iyi anlamda.",
    ad: "Rüya",
    harf: "R",
  },
  {
    baslik: "İçerik üreticisiyim…",
    govde:
      "Bir içerik üreticisi olarak çevrimiçi varlığımı büyütmek için Vayra'ya güveniyorum. Özellikle tüm iş akışımı tek yerde toplaması ve bu desteğin arkamda olması çok değerli.",
    ad: "Kaan",
    harf: "K",
  },
];

function Topluluk() {
  return (
    <section className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="hf-baslik text-3xl text-[#0f1113] md:text-5xl">
            TOPLULUK — 25 MİLYON+ KULLANICI
          </h2>
          <p className="mt-4 text-neutral-500">
            İnsanların her gün AI görseller ürettiği, fikirlerini paylaştığı ve
            birbirine ilham verdiği küresel yaratıcı ağa katıl.
          </p>
        </div>
        <div className="gizli-scroll flex gap-4 overflow-x-auto pb-2">
          {YORUMLAR.map((y, i) => (
            <div
              key={i}
              className="w-[300px] shrink-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex gap-0.5 text-sm text-[#0f1113]">
                {"★★★★★".split("").map((s, j) => (
                  <span key={j}>{s}</span>
                ))}
              </div>
              <div className="mb-2 font-semibold text-[#0f1113]">{y.baslik}</div>
              <p className="mb-4 text-sm leading-relaxed text-neutral-500">{y.govde}</p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">
                  {y.harf}
                </div>
                <span className="text-sm font-medium text-[#0f1113]">{y.ad}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- BLOG carousel (koyu) ------------------------------------------------- */
const BLOG = [
  { baslik: "Agentic AI ile İçerik Üretimi Nasıl Yapılır", etiket: "Supercomputer" },
  { baslik: "AI Sonuçların Neden Değişiyor?", etiket: "Vayra" },
  { baslik: "Seedance 2.0 ile Sinema Kalitesi Video", etiket: "Video" },
];

function BlogCarousel() {
  return (
    <section className="bg-[var(--sn-zemin)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <h2 className="hf-baslik text-3xl text-white md:text-5xl">
              UZMANLARDAN İÇGÖRÜLER — BLOG
            </h2>
            <p className="mt-4 text-[var(--sn-metin-2)]">
              İhtiyacın olan içgörüler. Uzmanlarımız uygulanabilir ipuçları
              paylaşır, en sıcak konuları çözümler ve rehberler sunar.
            </p>
          </div>
          <button
            onClick={() => window.open("/blog", "_blank", "noopener")}
            className="hf-ikincil hf-btn shrink-0 px-5 py-2.5 text-sm"
          >
            Blogumuzu oku
          </button>
        </div>
        <div className="gizli-scroll flex gap-4 overflow-x-auto pb-2">
          {BLOG.map((b, i) => (
            <div
              key={i}
              className="w-[320px] shrink-0 overflow-hidden rounded-2xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)]"
            >
              <div
                className="flex aspect-[16/9] items-center justify-center"
                style={{ background: "linear-gradient(135deg,#232323,#0f1113)" }}
              >
                <span className="text-xs font-semibold text-white/50">{b.etiket}</span>
              </div>
              <div className="p-4">
                <div className="font-semibold text-white">{b.baslik}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   MINECRAFT LANDING
   ============================================================================ */
function MinecraftLanding() {
  return (
    <main>
      <MinecraftHero />
      <PromptToBuild />
      <MinecraftKamera />
      <MinecraftUretim />
      <UcAdim
        koyu={false}
        baslik="ÜÇ ADIM"
        segmentTipi="surum"
        adimlar={MINECRAFT_ADIMLAR}
      />
      <AracSeti />
      <YapilanlarCarousel />
      <DunyandaUret />
      <Fiyatlandirma />
      <Sss sorular={MINECRAFT_SSS} />
    </main>
  );
}

/* ---- Minecraft HERO (koyu, pixel lime) ------------------------------------ */
function MinecraftHero() {
  return (
    <section className="relative overflow-hidden bg-black px-5 pb-0 pt-8 md:px-10">
      {/* seyrek blok noktalar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 2px, transparent 2px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <GeriBar />
        <div className="mt-16 text-center md:mt-24">
          <motion.h1
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-3xl"
          >
            <span
              className="block text-5xl font-black uppercase leading-none tracking-tight md:text-8xl"
              style={{
                color: LIME,
                textShadow: "4px 4px 0 #6a8a12, 8px 8px 0 rgba(0,0,0,0.4)",
                fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace",
              }}
            >
              VAYRA
            </span>
            <span
              className="mt-2 block text-3xl font-black uppercase leading-none tracking-tight text-white md:text-6xl"
              style={{
                textShadow: "3px 3px 0 #555, 6px 6px 0 rgba(0,0,0,0.4)",
                fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace",
              }}
            >
              MINECRAFT'A GELİYOR
            </span>
          </motion.h1>

          <div className="mt-10 flex items-center justify-center gap-4">
            <IndirButonu metin="İndir" />
            <button
              onClick={() => document.getElementById("nasil-calisir")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="hf-btn text-sm font-semibold text-white/80 hover:text-white"
            >
              Nasıl çalışır?
            </button>
          </div>
        </div>

        {/* Minecraft dünyası manzarası (blok kenarlı çerçeve) */}
        <div className="relative mt-16 h-40 overflow-hidden md:h-56">
          <div
            className="absolute inset-x-0 top-0 h-8"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#5a7d2e 0 32px,#6a8d3e 32px 64px)",
            }}
          />
          <div
            className="absolute inset-x-0 top-8 bottom-0"
            style={{
              background: "linear-gradient(180deg,#8ec5ff 0%,#c8e6ff 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#7a5230 0 32px,#8a6240 32px 64px)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ---- PROMPT TO BUILD (beyaz) + Minecraft GUI mockup ----------------------- */
function PromptToBuild() {
  return (
    <section className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 md:flex-row md:gap-16">
        <div className="w-full md:w-1/2">
          <h2 className="hf-baslik text-4xl text-[#0f1113] md:text-6xl">
            İSTEMDEN İNŞA
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-500 md:text-lg">
            Tam yapılar üret ve tam durduğun yerde blok blok belirişini izle.
            Bir istem yaz, gerisini Vayra Supercomputer halletsin.
          </p>
        </div>
        <div className="w-full md:w-1/2">
          <MinecraftGuiMockup />
        </div>
      </div>
    </section>
  );
}

/* Minecraft crafting-table stili gri GUI (Supercomputer penceresi) */
function MinecraftGuiMockup() {
  const router = useRouter();
  const mono = { fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace" };
  return (
    <div
      className="w-full rounded-md border-4 p-4 shadow-xl"
      style={{ background: "#c6c6c6", borderColor: "#8b8b8b", ...mono }}
    >
      <div className="mb-3 text-sm font-bold text-[#3f3f3f]">Supercomputer</div>
      <div className="grid grid-cols-2 gap-3">
        {/* Input */}
        <div>
          <div className="mb-1.5 text-xs font-bold text-[#3f3f3f]">Input</div>
          <div className="mb-1.5 rounded-sm bg-[#8b8b8b] px-2 py-1.5 text-[11px] text-white">
            detaylı ortaçağ kulübesi
          </div>
          <div className="mb-1.5 rounded-sm border border-[#8b8b8b] bg-[#b0b0b0] px-2 py-1 text-center text-[11px] text-[#3f3f3f]">
            Tür: Foto Slayt
          </div>
          <div className="mb-2 rounded-sm border border-[#8b8b8b] bg-[#b0b0b0] px-2 py-1 text-center text-[11px] text-[#3f3f3f]">
            Boyut: 2x2
          </div>
          <div className="text-[10px] font-bold text-[#3f3f3f]">Referanslar</div>
          <div className="mb-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-6 w-6 border border-[#8b8b8b] bg-[#9a9a9a]" />
            ))}
          </div>
          <div className="text-[10px] text-[#3f3f3f]">Kredi: 999.999</div>
          <div className="text-[10px] text-[#3f3f3f]">Tahmini maliyet: 1</div>
        </div>
        {/* Output */}
        <div>
          <div className="mb-1.5 text-xs font-bold text-[#3f3f3f]">Output</div>
          <div
            className="mb-2 aspect-square w-full border border-[#8b8b8b]"
            style={{ background: "linear-gradient(135deg,#6a4a2a,#3a2a1a)" }}
          />
          <div className="mb-2 text-center text-[10px] text-[#3f3f3f]">
            Sonuç burada belirir
          </div>
          <button
            onClick={() => router.push("/panel/supercomputer")}
            className="hf-btn w-full rounded-sm border border-[#7a7a7a] bg-[#b0b0b0] py-1.5 text-[11px] font-bold text-[#3f3f3f]"
          >
            Üret ✦
          </button>
        </div>
      </div>
      {/* Inventory */}
      <div className="mt-3 text-xs font-bold text-[#3f3f3f]">Envanter</div>
      <div className="mt-1 grid grid-cols-9 gap-1">
        {Array.from({ length: 27 }).map((_, i) => (
          <div key={i} className="aspect-square border border-[#8b8b8b] bg-[#9a9a9a]" />
        ))}
      </div>
    </div>
  );
}

/* ---- KAMERA (beyaz) ------------------------------------------------------- */
function MinecraftKamera() {
  return (
    <section className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 md:flex-row-reverse md:gap-16">
        <div className="w-full md:w-1/2">
          <h2 className="hf-baslik text-4xl text-[#0f1113] md:text-6xl">KAMERA</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-500 md:text-lg">
            Odakla, yaklaştır, çek. Kamera oyun içindeki herhangi bir görünümü,
            Supercomputer'ın inşa edebileceği, hayal edebileceği ya da
            canlandırabileceği bir referans görsele dönüştürür.
          </p>
        </div>
        <div className="w-full md:w-1/2">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-xl">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg,#8ec5ff,#c9e6c0 60%,#6a8d3e)" }}
            />
            {/* HUD köşe braketleri */}
            {[
              "left-4 top-4 border-l-2 border-t-2",
              "right-4 top-4 border-r-2 border-t-2",
              "left-4 bottom-4 border-l-2 border-b-2",
              "right-4 bottom-4 border-r-2 border-b-2",
            ].map((c, i) => (
              <div key={i} className={cn("absolute h-6 w-6 border-white", c)} />
            ))}
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
              109mm ◫ · 1/16
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- GÖRSEL & VİDEO ÜRETİMİ (koyu) ---------------------------------------- */
function MinecraftUretim() {
  const bloklar = [
    {
      baslik: "GÖRSEL ÜRETİMİ",
      metin:
        "Bir istem yaz, Üret'e bas; sonuç bir Foto Slayt olarak çıkış slotuna düşsün — tıpkı bir tablo gibi duvara asabilirsin.",
      bg: "linear-gradient(135deg,#3a5a2e,#1a2e1a)",
      solda: true,
    },
    {
      baslik: "VİDEO ÜRETİMİ",
      metin:
        "Bir Film Rulosuna geç, bir klip için istem yaz ve Video Ekranı ya da Projektörde oynat — hareket Kling 3 ile üretilir.",
      bg: "linear-gradient(135deg,#5a3a2e,#2e1a1a)",
      solda: false,
    },
  ];
  return (
    <section className="bg-[var(--sn-zemin)]">
      {bloklar.map((b, i) => (
        <div key={i} className="px-5 py-14 md:px-10 md:py-20">
          <div
            className={cn(
              "mx-auto flex max-w-5xl flex-col items-center gap-8 md:gap-14",
              b.solda ? "md:flex-row" : "md:flex-row-reverse",
            )}
          >
            <div className="w-full md:w-1/2">
              <h3 className="hf-baslik text-3xl text-white md:text-5xl">{b.baslik}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--sn-metin-2)] md:text-lg">
                {b.metin}
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div
                className="aspect-video w-full rounded-2xl border-4 border-[#2a2a2a] shadow-2xl"
                style={{ background: b.bg }}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---- ARAÇ SETİNİ İNŞA ET (koyu, crafting grid) ---------------------------- */
const ARAC_SETI = [
  { ad: "Supercomputer", metin: "Çekirdek blok — bir istem yaz, görsel, video ve yapı üret." },
  { ad: "Video Projektörü", metin: "Bir Film Rulosu yükle ve üretilen videoyu büyük ekrana yansıt." },
  { ad: "Kamera", metin: "Oyun içi herhangi bir sahneyi sonraki üretimin için referans al." },
  { ad: "Üretim Arşivi", metin: "Geçmiş üretimlerini saklar; herhangi bir eseri tekrar çağırırsın." },
  { ad: "Foto Slayt", metin: "Üretilen bir görseli tutar — tablo gibi duvara yerleştir." },
  { ad: "Film Rulosu", metin: "Üretilen bir video klibi saklar, projektöre yüklemeye hazır." },
];

function AracSeti() {
  return (
    <section className="bg-[var(--sn-zemin)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2
            className="text-4xl font-black uppercase tracking-tight md:text-6xl"
            style={{
              color: LIME,
              textShadow: "3px 3px 0 #6a8a12",
              fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace",
            }}
          >
            ARAÇ SETİNİ İNŞA ET
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARAC_SETI.map((a, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-5"
            >
              {/* 3x3 crafting grid + ok + sonuç */}
              <div className="mb-4 flex items-center gap-3">
                <div className="grid grid-cols-3 gap-0.5">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-4 w-4 border border-[#3a3a3a] bg-[#232323]"
                      style={
                        [0, 4, 8].includes(j)
                          ? { background: "#3a5a2e" }
                          : undefined
                      }
                    />
                  ))}
                </div>
                <span className="text-[var(--sn-metin-3)]">→</span>
                <div className="h-8 w-8 rounded-sm" style={{ background: LIME }} />
              </div>
              <div className="font-bold text-white">{a.ad}</div>
              <p className="mt-1 text-sm text-[var(--sn-metin-2)]">{a.metin}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- VAYRA İLE YAPILDI (koyu) — carousel ---------------------------------- */
const YAPILAR = [
  { ad: "Özgürlük Heykeli", bg: "linear-gradient(160deg,#8ec5ff,#5a9a6a)" },
  { ad: "Dev Kurbağa Heykeli", bg: "linear-gradient(160deg,#6abf4a,#2e6a2e)" },
  { ad: "Ortaçağ Kalesi", bg: "linear-gradient(160deg,#b06a4a,#5a2a1a)" },
  { ad: "Modern Şehir", bg: "linear-gradient(160deg,#8a8a9a,#3a3a4a)" },
];

function YapilanlarCarousel() {
  return (
    <section className="bg-[var(--sn-zemin)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="hf-baslik mb-10 text-center text-3xl text-white md:text-5xl">
          VAYRA İLE YAPILDI
        </h2>
        <div className="gizli-scroll flex gap-4 overflow-x-auto pb-2">
          {YAPILAR.map((y, i) => (
            <div
              key={i}
              className="relative w-[300px] shrink-0 overflow-hidden rounded-2xl border-4 border-[#2a2a2a]"
            >
              <div className="aspect-[4/3]" style={{ background: y.bg }} />
              <div className="absolute bottom-3 left-3 rounded bg-black/50 px-2 py-1 text-xs font-semibold text-white">
                {y.ad}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- DÜNYANDA ÜRET (koyu) — final CTA banner ------------------------------ */
function DunyandaUret() {
  return (
    <section className="bg-[var(--sn-zemin)] px-5 pb-16 md:px-10 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] border-4 border-[#2a2a2a] bg-[#0f1113] p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/70">
                İndir
              </span>
              <h2 className="hf-baslik mt-4 text-3xl text-white md:text-5xl">
                TAM DÜNYANDA ÜRET
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <IndirButonu metin="İndir" />
                <span className="text-xs text-white/50">Oyun Sürümü</span>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                  1.21.1
                </span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div
                className="text-3xl font-black uppercase leading-none tracking-tight md:text-5xl"
                style={{
                  color: LIME,
                  textShadow: "3px 3px 0 #6a8a12",
                  fontFamily: "'DejaVu Sans Mono', ui-monospace, monospace",
                }}
              >
                VAYRA
                <br />
                ÜRET & İNŞA ET
              </div>
            </div>
          </div>
          <p className="mt-6 text-[10px] text-white/30">
            Resmi bir Minecraft ürünü değildir. Mojang veya Microsoft tarafından
            onaylanmamış ya da ilişkilendirilmemiştir. Vayra tarafından yapılan
            bağımsız bir moddur.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   ORTAK: ÜÇ ADIM (beyaz)
   ============================================================================ */
type Adim = { ikon: LucideIcon; baslik: string; metin: string };

const ADOBE_ADIMLAR: [Adim, Adim, Adim] = [
  { ikon: Disc, baslik: ".DMG'Yİ İNDİR", metin: "Aşağıdan macOS için İndir'e tıkla. Yerel yükleyicimiz dosyayı indirir." },
  { ikon: CheckCircle2, baslik: "YÜKLEYİCİYİ ÇALIŞTIR", metin: ".dmg'yi aç, Vayra'yı Uygulamalar'a sürükle; kurulum saniyeler sürer." },
  { ikon: Palette, baslik: "ADOBE'DE VAYRA'YI BUL", metin: "After Effects'i başlat, Pencere > Eklentiler menüsünden Vayra'yı seç." },
];

const MINECRAFT_ADIMLAR: [Adim, Adim, Adim] = [
  { ikon: Boxes, baslik: "NEOFORGE KUR", metin: "Minecraft 1.21.1 için NeoForge yükleyicisini çalıştır ve profili bir kez başlat." },
  { ikon: Package, baslik: ".JAR DOSYASINI İNDİR", metin: "Modu mods/ klasörüne yükle." },
  { ikon: Terminal, baslik: "SOHBETTE YETKİLENDİR", metin: "Oyunu başlat ve sohbete /vayra auth yaz; anahtarını yapıştır, üretmeye başla." },
];

function UcAdim({
  koyu,
  baslik,
  segmentTipi,
  adimlar,
}: {
  koyu: boolean;
  baslik: string;
  segmentTipi: "os" | "surum";
  adimlar: [Adim, Adim, Adim];
}) {
  const [seg, setSeg] = useState(0);
  const segmentler =
    segmentTipi === "surum"
      ? ["Sürüm 1.21.1", "Sürüm 1.20.4"]
      : ["macOS", "Windows"];

  return (
    /* id: "Nasıl çalışır?" butonu bu bölüme GERÇEKTEN kaydırır. */
    <section id="nasil-calisir" className="scroll-mt-20 bg-[#f7f7f7] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="hf-baslik text-3xl text-[#0f1113] md:text-5xl">{baslik}</h2>
          <div className="mt-6 inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            {segmentler.map((s, i) => (
              <button
                key={s}
                onClick={() => setSeg(i)}
                className={cn(
                  "hf-btn rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  seg === i ? "bg-[#0f1113] text-white" : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {adimlar.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_40px_-16px_rgba(0,0,0,0.15)] ring-1 ring-neutral-100">
                <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200">
                  <div className="text-center">
                    <a.ikon className="mx-auto h-16 w-16 text-neutral-700 md:h-[72px] md:w-[72px]" strokeWidth={1.5} />
                    <div
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: "rgba(85, 214, 253,0.25)", color: "#5a6a12" }}
                    >
                      Adım {i + 1}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <h3 className="hf-baslik text-lg text-[#0f1113]">{a.baslik}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{a.metin}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   ORTAK: FİYATLANDIRMA (koyu panel, grup2 birebir)
   ============================================================================ */
type Plan = {
  id: string;
  ad: string;
  aciklama: string;
  indirim?: string;
  seedanceRozet?: boolean;
  krediBaslik: string;
  krediDenklik: string[];
  fiyat: number;
  fiyatEski?: number;
  tasarruf?: string;
  cta: string;
  ctaTip: "beyaz" | "lime" | "pembe" | "mavi";
  altNot?: string;
  ozellikler: { metin: string; aktif: boolean; rozet?: string }[];
  seedance: { ad: string; erisim: boolean }[];
  vurgu?: "populer" | "deger";
  slider?: boolean;
  koltuk?: boolean;
};

const PLANLAR: Plan[] = [
  {
    id: "starter",
    ad: "STARTER",
    aciklama: "İlk kez AI içerik üretenler için",
    krediBaslik: "270 kredi/ay",
    krediDenklik: ["= 135 Nano Banana üretimi", "~ 15 Seedance 2.0 Fast video"],
    fiyat: 19,
    cta: "Planı düşür",
    ctaTip: "beyaz",
    altNot: "Aylıkla arasında fark yok",
    ozellikler: [
      { metin: "Paralel üretim: 2 Video, 4 Görsel", aktif: true },
      { metin: "Supercomputer erişimi", aktif: true },
      { metin: "Seedance 2.0 Fast & 2.0 Mini erişimi", aktif: true },
      { metin: "Yalnızca seçili modeller & özellikler", aktif: true },
      { metin: "Gelişmiş AI özelliklerine erken erişim", aktif: false },
      { metin: "Sınırsız pazar yerine erişim", aktif: false },
      { metin: "Kredi başına en düşük maliyet", aktif: false },
    ],
    seedance: [
      { ad: "Seedance 2.0", erisim: false },
      { ad: "Seedance 2.0 Fast", erisim: true },
    ],
  },
  {
    id: "plus",
    ad: "PLUS",
    aciklama: "Tutarlı ve kolay AI içerik üretimi için",
    indirim: "%20 İNDİRİM",
    seedanceRozet: true,
    krediBaslik: "1.200 kredi/ay",
    krediDenklik: ["= 600 Nano Banana üretimi", "~ 53 Seedance 2.0 video"],
    fiyat: 47,
    fiyatEski: 59,
    cta: "Taahhüdü değiştir",
    ctaTip: "lime",
    ozellikler: [
      { metin: "Paralel üretim: 6 Video, 8 Görsel", aktif: true },
      { metin: "Supercomputer erişimi", aktif: true },
      { metin: "Tüm Seedance modellerine erişim", aktif: true },
      { metin: "Tüm modeller & özelliklere erişim", aktif: true },
      { metin: "Gelişmiş AI özelliklerine erken erişim", aktif: true },
      { metin: "Sınırsız pazar yerine erişim", aktif: true },
      { metin: "Kredi başına en düşük maliyet", aktif: false },
    ],
    seedance: [
      { ad: "Seedance 2.0", erisim: true },
      { ad: "Seedance 2.0 Fast", erisim: true },
    ],
  },
  {
    id: "ultra",
    ad: "ULTRA",
    aciklama: "AI projeleri kuran üreticiler için",
    indirim: "%23 İNDİRİM",
    seedanceRozet: true,
    krediBaslik: "3.000 kredi/ay",
    krediDenklik: ["= 1500 Nano Banana üretimi", "~ 133 Seedance 2.0 video"],
    fiyat: 99,
    fiyatEski: 429,
    tasarruf: "Aylığa göre 360$ tasarruf",
    cta: "Planı yükselt",
    ctaTip: "pembe",
    vurgu: "populer",
    slider: true,
    ozellikler: [
      { metin: "Paralel üretim: 8 Video, 8 Görsel", aktif: true },
      { metin: "Supercomputer erişimi", aktif: true },
      { metin: "Tüm Seedance modellerine erişim", aktif: true },
      { metin: "Tüm modeller & özelliklere erişim", aktif: true },
      { metin: "Gelişmiş AI özelliklerine erken erişim", aktif: true },
      { metin: "Sınırsız pazar yerine erişim", aktif: true },
      { metin: "Kredi başına en düşük maliyet", aktif: true, rozet: "%55 UCUZ" },
    ],
    seedance: [
      { ad: "Seedance 2.0", erisim: true },
      { ad: "Seedance 2.0 Fast", erisim: true },
    ],
  },
  {
    id: "team",
    ad: "Team",
    aciklama: "Ajanslar ve küçük ekipler için",
    indirim: "%18 İNDİRİM",
    seedanceRozet: true,
    krediBaslik: "2.000 kredi toplam/ay",
    krediDenklik: [
      "= koltuk başına 1.000 kredi/ay",
      "= 1.000 Nano Banana görseli",
      "~ 229 Kling 3.0 video",
    ],
    fiyat: 65,
    fiyatEski: 79,
    tasarruf: "Aylığa göre 168$ tasarruf",
    cta: "Planı yükselt",
    ctaTip: "mavi",
    vurgu: "deger",
    koltuk: true,
    ozellikler: [
      { metin: "Paylaşımlı alanda 2-9 üye", aktif: true },
      { metin: "Paralel üretim: 16 video & 16 görsel", aktif: true },
      { metin: "Tüm özellikler & modellere erişim", aktif: true },
      { metin: "Paylaşımlı kredi havuzu", aktif: true },
      { metin: "Ekibin için paylaşımlı çalışma alanı", aktif: true },
      { metin: "Gelişmiş AI özelliklerine erken erişim", aktif: true },
      { metin: "Öncelikli destek", aktif: true },
    ],
    seedance: [{ ad: "Seedance 2.0", erisim: true }],
  },
];

function Fiyatlandirma() {
  const [yillik, setYillik] = useState(true);
  const [slider, setSlider] = useState(0); // 0,1,2 → 3000/6000/9000
  const [koltuk, setKoltuk] = useState(2);

  return (
    <section className="bg-[var(--sn-zemin)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="hf-baslik text-3xl text-white md:text-5xl">PLANINI SEÇ</h2>
          <p className="mt-3 text-[var(--sn-metin-2)]">
            Daha fazla üretime ve yeni özelliklere öncelikli erişim al.
          </p>
          {/* Aylık / Yıllık toggle */}
          <div className="mt-6 inline-flex items-center gap-3">
            <span className={cn("text-sm", yillik ? "text-[var(--sn-metin-2)]" : "text-white")}>
              Aylık
            </span>
            <button
              onClick={() => setYillik((v) => !v)}
              className="relative h-6 w-11 rounded-full bg-[var(--sn-cip)] transition-colors"
              aria-label="Faturalama dönemi"
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  yillik ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
            <span className={cn("text-sm", yillik ? "text-white" : "text-[var(--sn-metin-2)]")}>
              Yıllık
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
              style={{ background: PEMBE }}
            >
              %30 İNDİRİM
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANLAR.map((p) => (
            <PlanKarti
              key={p.id}
              plan={p}
              yillik={yillik}
              slider={slider}
              setSlider={setSlider}
              koltuk={koltuk}
              setKoltuk={setKoltuk}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const ULTRA_TICKS = [3000, 6000, 9000];

function PlanKarti({
  plan,
  yillik,
  slider,
  setSlider,
  koltuk,
  setKoltuk,
}: {
  plan: Plan;
  yillik: boolean;
  slider: number;
  setSlider: (n: number) => void;
  koltuk: number;
  setKoltuk: (n: number) => void;
}) {
  const router = useRouter();
  const populer = plan.vurgu === "populer";
  const deger = plan.vurgu === "deger";
  const tasar = populer || deger;

  // ULTRA slider → kredi + fiyat türet
  const carpan = plan.slider ? ULTRA_TICKS[slider] / 3000 : 1;
  const koltukCarpan = plan.koltuk ? koltuk : 1;
  const fiyat = Math.round(plan.fiyat * carpan * koltukCarpan);
  const fiyatEski = plan.fiyatEski
    ? Math.round((yillik ? plan.fiyatEski : Math.round(plan.fiyatEski * 1.4)) * carpan * koltukCarpan)
    : undefined;
  const gosterFiyat = yillik ? fiyat : Math.round(fiyat * 1.4);

  const krediBaslik = plan.slider
    ? `${ULTRA_TICKS[slider].toLocaleString("tr-TR")} kredi/ay`
    : plan.koltuk
      ? `${(2000 * (koltuk / 2)).toLocaleString("tr-TR")} kredi toplam/ay`
      : plan.krediBaslik;

  const ctaStil: Record<Plan["ctaTip"], string> = {
    beyaz: "bg-white text-[#0f1113] hover:bg-neutral-100",
    lime: "hf-uret",
    pembe: "text-white",
    mavi: "text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className={cn("relative", tasar && "md:-mt-8")}
    >
      {/* Üst şerit rozet */}
      {tasar && (
        <div
          className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-center rounded-t-2xl text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ background: populer ? PEMBE : MAVI }}
        >
          ◆ {populer ? "EN POPÜLER" : "EN İYİ DEĞER"}
        </div>
      )}

      <div
        className={cn(
          "flex h-full flex-col rounded-2xl border p-5",
          tasar ? "pt-11" : "",
        )}
        style={{
          background: "var(--sn-yuzey)",
          borderColor: populer ? PEMBE : deger ? MAVI : "var(--sn-kenar)",
          ...(tasar ? { boxShadow: `0 0 30px -10px ${populer ? PEMBE : MAVI}` } : {}),
        }}
      >
        {/* Ad + rozetler */}
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="hf-baslik text-lg text-white">{plan.ad}</h3>
          {plan.indirim && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
              style={{ background: PEMBE }}
            >
              {plan.indirim}
            </span>
          )}
          {plan.seedanceRozet && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: LIME, color: LIME_METIN }}
            >
              ▮ SEEDANCE 2.0
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-[var(--sn-metin-2)]">{plan.aciklama}</p>

        {/* Kredi kutusu */}
        <div className="mt-4 rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-zemin)] p-3">
          <div className="text-sm font-semibold text-white">✦ {krediBaslik}</div>
          <div className="mt-1.5 space-y-0.5">
            {(plan.slider
              ? [
                  `= ${(ULTRA_TICKS[slider] / 2).toLocaleString("tr-TR")} Nano Banana üretimi`,
                  `~ ${Math.round(ULTRA_TICKS[slider] / 22.5).toLocaleString("tr-TR")} Seedance 2.0 video`,
                ]
              : plan.krediDenklik
            ).map((d, j) => (
              <div key={j} className="text-[11px] text-[var(--sn-metin-3)]">{d}</div>
            ))}
          </div>

          {/* ULTRA slider */}
          {plan.slider && (
            <div className="mt-3">
              <div className="relative flex items-center justify-between">
                <div className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--sn-cip)]" />
                <div
                  className="absolute left-1 top-1/2 h-1 -translate-y-1/2 rounded-full"
                  style={{ background: LIME, width: `${(slider / 2) * 100}%` }}
                />
                {ULTRA_TICKS.map((t, ti) => (
                  <button
                    key={t}
                    onClick={() => setSlider(ti)}
                    aria-label={`${t} kredi`}
                    className={cn(
                      "relative z-10 flex items-center justify-center rounded-full text-[9px] font-bold transition-all",
                      ti === slider ? "h-6 w-6" : "h-3 w-3",
                    )}
                    style={
                      ti === slider
                        ? { background: LIME, color: LIME_METIN }
                        : { background: "var(--sn-cip)" }
                    }
                  >
                    {ti === slider ? "◇" : ""}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] text-[var(--sn-metin-3)]">
                {ULTRA_TICKS.map((t) => (
                  <span key={t}>{t.toLocaleString("tr-TR")}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Koltuk stepper (Team) */}
        {plan.koltuk && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-zemin)] px-3 py-2">
            <button
              onClick={() => setKoltuk(Math.max(2, koltuk - 1))}
              className="hf-btn flex h-6 w-6 items-center justify-center rounded-md bg-[var(--sn-cip)] text-white"
              aria-label="Koltuk azalt"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-white">{koltuk} koltuk</span>
            <button
              onClick={() => setKoltuk(koltuk + 1)}
              className="hf-btn flex h-6 w-6 items-center justify-center rounded-md bg-[var(--sn-cip)] text-white"
              aria-label="Koltuk artır"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Fiyat */}
        <div className="mt-5 flex flex-wrap items-end gap-2">
          {fiyatEski && (
            <span className="text-sm line-through" style={{ color: PEMBE }}>
              ${(yillik ? fiyatEski : Math.round(fiyatEski * 1.4)).toLocaleString("tr-TR")}
            </span>
          )}
          <span className="hf-baslik text-3xl text-white">
            ${gosterFiyat.toLocaleString("tr-TR")}
          </span>
          <span className="pb-1 text-xs text-[var(--sn-metin-3)]">
            {plan.koltuk ? "/koltuk/ay" : "/ay"}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--sn-metin-3)]">
          {yillik ? "yıllık faturalandırılır" : "aylık faturalandırılır"}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/panel/kredi")}
          className={cn(
            "hf-btn mt-4 w-full rounded-xl py-3 text-sm font-semibold",
            ctaStil[plan.ctaTip],
          )}
          style={
            plan.ctaTip === "pembe"
              ? { background: PEMBE }
              : plan.ctaTip === "mavi"
                ? { background: MAVI }
                : undefined
          }
        >
          {plan.cta}
        </button>
        {plan.altNot && (
          <div className="mt-1.5 text-center text-[11px] text-[var(--sn-metin-3)]">{plan.altNot}</div>
        )}
        {plan.tasarruf && (
          <div className="mt-1.5 text-center text-[11px] text-[var(--sn-metin-2)]">{plan.tasarruf}</div>
        )}

        {/* Özellik listesi */}
        <ul className="mt-5 space-y-2.5">
          {plan.ozellikler.map((oz, k) => (
            <li
              key={k}
              className={cn(
                "flex items-start gap-2 text-xs",
                oz.aktif ? "text-[var(--sn-metin)]" : "text-[var(--sn-metin-3)] opacity-60",
              )}
            >
              {oz.aktif ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: LIME }} />
              ) : (
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--sn-metin-3)]" />
              )}
              <span className="flex-1">{oz.metin}</span>
              {oz.rozet && (
                <span
                  className="rounded px-1.5 py-0.5 text-[8px] font-black"
                  style={{ background: LIME, color: LIME_METIN }}
                >
                  {oz.rozet}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* SEEDANCE 2.0 alt tablo */}
        <div className="mt-5 rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-zemin)] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--sn-metin-2)]">
            ▮ Seedance 2.0
          </div>
          {plan.seedance.map((s, k) => (
            <div key={k} className="mb-1 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-[var(--sn-metin)]">
                {s.erisim ? (
                  <Check className="h-3 w-3" style={{ color: LIME }} />
                ) : (
                  <X className="h-3 w-3 text-[var(--sn-metin-3)]" />
                )}
                {s.ad}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[8px] font-black"
                style={
                  s.erisim
                    ? { background: LIME, color: LIME_METIN }
                    : { background: "var(--sn-cip)", color: "var(--sn-metin-2)" }
                }
              >
                {s.erisim ? "TAM ERİŞİM" : "ERİŞİM YOK"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================================
   ORTAK: SSS (koyu accordion)
   ============================================================================ */
const ADOBE_SSS: { s: string; c: string }[] = [
  { s: "Vayra Eklentilerini macOS'ta nasıl kurarım?", c: "İndir butonuna tıkla, .dmg dosyasını aç ve Vayra'yı Uygulamalar klasörüne sürükle. Adobe uygulamasını yeniden başlat." },
  { s: "Windows'ta nasıl kurulur?", c: "Windows yükleyicisini indir, çalıştır ve kurulum sihirbazını takip et. Yükleme bittiğinde Adobe'de panel hazır olur." },
  { s: "Panel Adobe'de görünmüyor. Ne yapmalıyım?", c: "Adobe'yi yeniden başlat ve Pencere > Eklentiler menüsünden Vayra'yı seç. Görünmezse eklentiyi yeniden kur." },
  { s: "Kurulumdan sonra Adobe'yi yeniden başlatmam gerekir mi?", c: "Evet, panelin menüde görünmesi için kurulumdan sonra Adobe'yi bir kez yeniden başlatman gerekir." },
  { s: "Adobe'nin hangi sürümleri destekleniyor?", c: "Adobe After Effects 2025+ ve Premiere Pro 2025+ desteklenir. Daha eski sürümlerde bazı özellikler kısıtlı olabilir." },
  { s: "Hem Apple Silicon hem Intel Mac'lerde çalışır mı?", c: "Evet, yükleyicimiz hem Apple Silicon hem de Intel tabanlı Mac'leri destekler." },
  { s: "Eklentileri kullanmak için internet bağlantısı gerekir mi?", c: "Evet, üretim bulutta yapıldığı için aktif bir internet bağlantısı gereklidir." },
  { s: "Kuruluma hangi eklentiler dahil?", c: "Reframe, Arka Plan Sil, Yükselt, Çiz ve Düzenle, Görsel/Video Üret — beş profesyonel eklenti tek yükleyicide gelir." },
  { s: "Eklentileri kullanmak için Vayra aboneliği gerekir mi?", c: "Ücretsiz planla temel özellikleri kullanabilirsin; daha fazla kredi ve gelişmiş model için abonelik gerekir." },
  { s: "Eklentileri ticari projelerde kullanabilir miyim?", c: "Evet, tüm planlar üretilen içeriğin ticari kullanımına izin verir." },
];

const MINECRAFT_SSS: { s: string; c: string }[] = [
  { s: "Vayra Minecraft eklentisi nedir?", c: "Minecraft dünyanın içinden istem yazarak görsel, video ve yapı üretmeni sağlayan bir moddur." },
  { s: "Çalıştırmak için neye ihtiyacım var?", c: "Minecraft 1.21.1, NeoForge yükleyicisi ve bir Vayra hesabı yeterli." },
  { s: "Nasıl giriş yaparım?", c: "Oyunu başlat ve sohbete /vayra auth yaz; ardından anahtarını yapıştır." },
  { s: "Foto Slayt ile Film Rulosu arasındaki fark nedir?", c: "Foto Slayt üretilen bir görseli tutar (tablo gibi asılır); Film Rulosu üretilen bir video klibi tutar (projektöre yüklenir)." },
  { s: "Sonucum nerede belirir?", c: "Üretim tamamlanınca sonuç Supercomputer penceresinin çıkış slotunda belirir." },
  { s: "Bir üretim ne kadara mal olur?", c: "Maliyet üretim türüne göre değişir; tahmini maliyet Supercomputer penceresinde gösterilir." },
  { s: "Video ne kadar sürer?", c: "Video üretimi genellikle birkaç dakika sürer; hareket Kling 3 ile üretilir." },
  { s: "Kendi ekran görüntülerimi referans olarak kullanabilir miyim?", c: "Evet, Kamera bloğuyla oyun içi herhangi bir sahneyi referans görsele dönüştürebilirsin." },
  { s: "Yeni öğelerin crafting tarifleri var mı?", c: "Evet, tüm araç seti blokları gerçek crafting tarifleriyle üretilir." },
];

function Sss({ sorular }: { sorular: { s: string; c: string }[] }) {
  const [acik, setAcik] = useState<number | null>(null);
  return (
    <section className="bg-[var(--sn-zemin)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h2 className="hf-baslik text-3xl text-white md:text-5xl">
            BAŞKA SORUN VAR MI?
          </h2>
          <p className="mt-3 text-[var(--sn-metin-2)]">
            En sık sorulan soruları yanıtladık
          </p>
        </div>
        <div>
          {sorular.map((q, i) => (
            <div key={i} className="border-b border-[var(--sn-kenar)]">
              <button
                onClick={() => setAcik(acik === i ? null : i)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="pr-4 font-medium text-white">{q.s}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-[var(--sn-metin-2)] transition-transform",
                    acik === i && "rotate-180",
                  )}
                />
              </button>
              {acik === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden pb-4 text-sm leading-relaxed text-[var(--sn-metin-2)]"
                >
                  {q.c}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   JENERİK "YAKINDA" LANDING (figma / davinci / chrome / bilinmeyen)
   ============================================================================ */
function YakindaLanding({ slug }: { slug: string }) {
  const adlar: Record<string, string> = {
    figma: "Figma",
    davinci: "DaVinci Resolve",
    chrome: "Chrome",
  };
  const ad = adlar[slug] ?? "Bu eklenti";
  // GERÇEK bekleme listesi — localStorage'da kalıcı dizi (vayra-bekleme-listesi).
  const [listede, setListede] = useState(false);
  useEffect(() => {
    try {
      const liste = JSON.parse(localStorage.getItem("vayra-bekleme-listesi") ?? "[]") as string[];
      setListede(Array.isArray(liste) && liste.includes(slug));
    } catch { /* bozuk kayıt → yoksay */ }
  }, [slug]);
  const listeyeKatil = () => {
    let liste: string[] = [];
    try { liste = JSON.parse(localStorage.getItem("vayra-bekleme-listesi") ?? "[]") as string[]; } catch { liste = []; }
    if (!Array.isArray(liste)) liste = [];
    if (liste.includes(slug)) {
      setListede(true);
      toast.info("Zaten listedesin", { description: `${ad} hazır olduğunda haber vereceğiz.` });
      return;
    }
    liste.push(slug);
    try { localStorage.setItem("vayra-bekleme-listesi", JSON.stringify(liste)); } catch { /* kota → yoksay */ }
    setListede(true);
    toast.success(`${ad} bekleme listesine eklendin!`, { description: `Listede ${liste.length} eklenti var.` });
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--sn-zemin)] px-5 text-center">
      <GeriBar />
      <div className="mt-8">
        <span
          className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: LIME, color: LIME_METIN }}
        >
          Yakında
        </span>
        <h1 className="hf-baslik mt-4 text-4xl text-white md:text-6xl">
          {ad} EKLENTİSİ
        </h1>
        <p className="mt-4 max-w-md text-[var(--sn-metin-2)]">
          Vayra'yı {ad} içine getiriyoruz. Hazır olduğunda ilk sen haberdar ol.
        </p>
        <button
          onClick={listeyeKatil}
          className="hf-uret hf-btn mt-8 px-7 py-3.5 text-sm"
        >
          {listede ? "Bekleme listesindesin ✓" : "Bekleme listesine katıl"}
        </button>
      </div>
    </main>
  );
}
