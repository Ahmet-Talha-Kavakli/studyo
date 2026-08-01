"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowUpRight, Play, Heart, Globe, ChevronLeft, ChevronRight,
  Eye, Zap, Cpu, Clock, Search, MoreVertical,
  Gift, Scissors, Film, Terminal, ArrowRight, BookOpen, Clapperboard,
  type LucideIcon,
} from "lucide-react";

/** SC ürün/model kartı ikon adı → lucide bileşeni (Vayra kartları için, m2). */
const KESFET_URUN_IKON: Record<string, LucideIcon> = {
  BookOpen, Sparkles, Clapperboard, Terminal,
};

/**
 * MarkaRozet — SC ürün kartının sol-üst logo karesi (m2).
 * `logo` varsa GERÇEK marka SVG'si (public/marka/*.svg — Google Gemini,
 * ByteDance, Claude); yoksa Vayra kartı → lucide ikon + lime. Kare zemin
 * markanın resmi renginin hafif tonudur.
 */
function MarkaRozet({ u }: { u: { logo?: string; ikon?: string; marka: string; ad: string } }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl"
      style={{ background: `color-mix(in oklab, ${u.marka} 20%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${u.marka} 32%, transparent)` }}>
      {u.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={u.logo} alt={u.ad} className="h-[19px] w-[19px]" />
      ) : (() => {
        const Ikon = (u.ikon && KESFET_URUN_IKON[u.ikon]) || Sparkles;
        return <Ikon className="h-[18px] w-[18px]" strokeWidth={2} style={{ color: u.marka }} />;
      })()}
    </span>
  );
}
import { SCVitrin } from "@/components/panel/SCVitrin";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { onizlemeArka, gorselArka, saltUrl, cn } from "@/lib/utils";
import {
  HERO_KARTLAR, PROJE_KESFET, SC_URUN_KARTLARI, YARISMA_UYGULAMALAR,
  PRESET_KATEGORILER, MODEL_BOLUMLERI, CANVAS_BANNER, PHOTODUMP_BANNER, OZELLIK_CIPLERI,
  galeriGorsel, galeriVideo, gercekGorsel,
  type KesfetBolum,
} from "@/lib/kesfetVeri";

/**
 * Keşfet (/panel) — Higgsfield "Explore" sayfasının birebir Türkçe klonu.
 * 17 bölüm: hero kartlar → SC showcase → proje galeri → yarışma → model banner'ları
 * → masonry model galerileri (Seedance/Presetler/GPT Image/Pazarlama/Soul) → chip bulutu.
 * Galeriler GERÇEK üretimlerden (useProjeler) + deterministik zenginleştirme ile beslenir.
 */

function kisaSayi(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "B";
  return String(n);
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

/* ── Hero kart videosu — GERÇEK Seedance 2.0, kaliteyi bozmadan oynar ──
   Görünür olunca oynar, dışarı çıkınca durur (performans). Yüklenene kadar / hata
   olursa gradyan görsel arka plana düşer. object-cover ile 16:10 kartı doldurur. */
function HeroVideo({ src, tohum, poster }: { src?: string; tohum: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const gozlemci = new IntersectionObserver(
      ([g]) => { if (g.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.25 },
    );
    gozlemci.observe(v);
    return () => gozlemci.disconnect();
  }, []);
  return (
    <>
      {/* Fallback — video hazır olana kadar görünür (kalite kesintisiz).
          `poster` verilirse videonun GERÇEK karesi kullanılır; yoksa eski
          davranış (tohumdan üretilen gradyan) sürer. Gradyan, gerçek kareye
          göre alakasız bir renk lekesi bırakıyordu. */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: gorselArka(tohum, "sinematik"), filter: "saturate(1.1) contrast(1.03)" }} />
      )}
      {src && (
        <video ref={ref} muted loop playsInline preload="metadata"
          onCanPlay={() => setHazir(true)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", hazir ? "opacity-100" : "opacity-0")}>
          <source src={src} type="video/mp4" />
        </video>
      )}
    </>
  );
}

/* ── Galeri kartı (hover: yazar + GERÇEK beğeni) ── */
function GaleriKart({ tohum, kat, oran, i, url, video }: { tohum: string; kat: string; oran: "dikey" | "yatay" | "karisik"; i: number; url?: string; video?: string }) {
  const h = hash(tohum + i);
  const temelBegeni = 80 + (h % 900);
  const [begenildi, setBegenildi] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const en = oran === "dikey" ? "aspect-[9/16]" : oran === "yatay" ? "aspect-[16/10]" : (i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-[4/5]" : "aspect-[16/11]");
  const arka = url ? `center/cover no-repeat url("${url}")` : onizlemeArka(tohum + i, kat);
  const begeni = temelBegeni + (begenildi ? 1 : 0);
  const kisa = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "b" : String(n));

  /* Video varsa yalnız GÖRÜNÜRKEN oynar — 8 video aynı anda çalışırsa
     sayfa donuyordu. PresetKart ile aynı desen (IntersectionObserver). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const gozlemci = new IntersectionObserver(
      ([g]) => { if (g.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.25 },
    );
    gozlemci.observe(v);
    return () => gozlemci.disconnect();
  }, []);

  return (
    <div className={cn("group/kart relative w-full overflow-hidden rounded-xl", en)} style={{ background: arka }}>
      {/* Görsel arka planda POSTER olarak kalır; video onun üstüne biner.
          Böylece video yüklenene kadar kart boş görünmez. */}
      {video && (
        <video ref={videoRef} muted loop playsInline preload="metadata" poster={url}
          className="absolute inset-0 h-full w-full object-cover" src={video} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover/kart:opacity-100" />
      {/* Sol üstteki YAZAR rozeti KALDIRILDI (2026-07-31, kullanıcı kararı):
          kurgusal bir isim taşıyordu ve kartın üstünü kalabalıklaştırıyordu. */}

      {/* GERÇEK beğeni — glassmorphism, büyütüldü. Medya ÜSTÜNDE durduğu için
          .glass-kenar değil kendi koyu cam reçetesi kullanılıyor: backdrop-filter
          altındaki parlak kareyi çekince rozet okunmaz hale geliyordu. */}
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setBegenildi((v) => !v); }}
        aria-label="Beğen" aria-pressed={begenildi}
        className={cn(
          "kart-begeni absolute right-2.5 top-2.5 flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-bold text-white transition-all active:scale-90",
          begenildi ? "opacity-100" : "opacity-0 group-hover/kart:opacity-100",
        )}>
        <Heart className={cn("h-5 w-5 transition-all", begenildi ? "scale-110 fill-rose-500 text-rose-500" : "text-white")} />
        {kisa(begeni)}
      </button>
    </div>
  );
}

/* ── Viral preset kartı — GERÇEK video, hover'da oynar (Higgsfield birebir) ── */
const PRESET_VIDEOLARI = [
  "action-figure", "float-spin", "earth-zoom", "orbit-360", "moonwalk",
  "sticker-peel", "elevate", "selfie-twin", "fairytale-castle", "cardboard-cutout", "sketch-to-fabric",
];
function PresetKart({ i, etiket, onClick }: { i: number; etiket: string; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slug = PRESET_VIDEOLARI[i % PRESET_VIDEOLARI.length];
  // Görünür olunca otomatik oynat (hover'a gerek yok); görünmezken duraklat (performans).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const gozlemci = new IntersectionObserver(
      ([giris]) => { if (giris.isIntersecting) v.play().catch(() => {}); else v.pause(); },
      { threshold: 0.25 },
    );
    gozlemci.observe(v);
    return () => gozlemci.disconnect();
  }, []);
  return (
    <button onClick={onClick} className="hf-kart relative block overflow-hidden aspect-[9/16] text-left">
      <video ref={videoRef} muted loop playsInline autoPlay preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        poster={gercekGorsel("preset" + i)}
        src={`/gercek/preset-video/${slug}.mp4`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-3 left-3 text-[12px] font-semibold uppercase tracking-wide text-white drop-shadow sm:bottom-2 sm:left-2 sm:text-[10px] sm:font-bold">{etiket}</span>
    </button>
  );
}

/* ── Model showcase bölümü (lime başlık + gri açıklama + masonry + floating "Tümünü gör") ── */
function ModelBolum({ b, uretimler }: { b: KesfetBolum; uretimler: Uretim[] }) {
  const n = b.oran === "dikey" ? b.sutun * 2 : 8;
  return (
    <section className="relative">
      {/* Mobil referansta başlık 20px/800 lime, alt yazı 14px gri (masaüstünde büyür). */}
      <h2 className="hf-baslik text-xl text-aksan sm:text-2xl md:text-3xl">{b.baslik}</h2>
      <p className="mb-4 mt-1.5 text-[14px] leading-snug text-metin-2 sm:mb-5 sm:text-sm">{b.ozet}</p>
      <div className="relative">
        {/* Mobilde 2 kolon 8px gap — referans ölçüsü; masaüstünde eski ızgara. */}
        <div className={cn("grid gap-2 sm:gap-3", b.sutun === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
          {Array.from({ length: n }).map((_, i) => {
            // Öncelik: bu bölüm için ÜRETTİĞİMİZ gerçek galeri görseli (stok'a düşme).
            // Yoksa kullanıcının kendi gerçek üretimi (data:/http), o da yoksa placeholder.
            const havuz = galeriGorsel(b.id, i);
            let kullaniciGorsel: string | undefined;
            if (!havuz) {
              const u = uretimler[(hash(b.id) + i * 7) % Math.max(1, uretimler.length)];
              kullaniciGorsel = u ? (saltUrl(u.gorselUrl) || saltUrl(u.thumbnailUrl)) : undefined;
            }
            const url = havuz ?? kullaniciGorsel;
            // Video yalnız GERÇEK galeri görseli varken aranır: kullanıcının
            // kendi üretimine ait karta bizim video havuzumuz bağlanmamalı.
            const vid = havuz ? galeriVideo(b.id, i) : undefined;
            return <GaleriKart key={i} tohum={b.id} kat={b.kat} oran={b.oran} i={i} url={url} video={vid} />;
          })}
        </div>
        {/* Floating "Tümünü gör" — alt kartlar fade-out */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-40 items-end justify-center bg-gradient-to-t from-zemin via-zemin/70 to-transparent pb-2">
          <Link href="/panel/kitaplik" className="hf-btn glass-cip-aktif pointer-events-auto flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-aksan sm:rounded-full sm:py-2 sm:text-[13px]">
            {b.tumunuGor} tümünü gör <ArrowUpRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function KesfetPage() {
  const router = useRouter();
  const uretimler = useProjeler((s) => s.uretimler);
  const gorunur = useMemo(() => uretimler.filter((u) => u.durum === "tamam"), [uretimler]);

  /* Mobil uygulama listesi — segment + arama gerçekten çalışır (dekoratif değil).
     "Vayra yapımı" sekmesi kredi eşiğine göre öne çıkanları süzer. */
  const [uygSekme, setUygSekme] = useState(0);
  const [uygArama, setUygArama] = useState("");
  const mobilUygulamalar = useMemo(() => {
    const q = uygArama.trim().toLocaleLowerCase("tr");
    return YARISMA_UYGULAMALAR
      .filter((a) => (uygSekme === 1 ? a.kredi >= 20000 : true))
      .filter((a) => (q ? a.ad.toLocaleLowerCase("tr").includes(q) : true));
  }, [uygSekme, uygArama]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:py-6 lg:px-8">
      {/* ═══ 2. HERO KARTLAR ═══
          Mobil referansta bunlar yatay KAYAN bir ray: iki kart görünür, üçüncü
          sağ kenardan taşar (kaydırılabilirlik ipucu). Masaüstünde 3'lü ızgara. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-1 gizli-scroll [scroll-padding-left:1rem] sm:mx-0 sm:grid sm:grid-cols-1 sm:gap-6 sm:overflow-visible sm:px-0 md:grid-cols-3">
        {HERO_KARTLAR.map((k, i) => (
          <motion.button key={k.ad} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => router.push(k.href)} className="group w-[84%] shrink-0 snap-start text-left sm:w-auto sm:shrink">
            <div className={cn("relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br", k.grad)}>
              {/* GERÇEK Seedance 2.0 videosu — kaliteyi bozmadan object-cover ile doldurur */}
              <HeroVideo src={k.video} tohum={k.tohum} />
              {/* Ortadaki büyük etiket (VİDEO/MÜZİK/3D) KALDIRILDI — başlık
                  zaten kartın altında duruyordu, video üstünde tekrar ediyor
                  ve görüntüyü kapatıyordu. Karartma da hafifletildi: metin
                  taşımadığı için artık yalnız hover rozetini okunur tutuyor. */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="absolute right-3 top-3 flex h-8 items-center gap-1.5 rounded-full bg-black/50 px-3 text-[11px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Play className="h-3 w-3 fill-white text-white" /> Keşfet
              </span>
            </div>

            {/* ── Kart altı: düz iki satır yerine katmanlı bir künye ──
                Önce sadece <h3> + <p> vardı ve vitrinde zayıf kalıyordu.
                Şimdi: renkli tür noktası + başlık + ok (hover'da kayar),
                altında özet. Renk her kartın kendi gradyanından türer. */}
            <div className="mt-3.5 flex items-center gap-2">
              <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", k.nokta)} />
              <h3 className="text-[15.5px] font-bold leading-snug tracking-[-0.01em] text-metin">{k.ad}</h3>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-metin-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-metin" />
            </div>
            <p className="mt-1 pl-[14px] text-[13px] leading-relaxed text-metin-2">{k.ozet}</p>
          </motion.button>
        ))}
      </div>

      {/* ═══ 2a. YENİ ÖZELLİKLER ŞERİDİ (m2) ═══
          Yeni eklenen özellikleri keşfedilebilir kılar: Görevler, yeni stüdyolar. */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-aksan/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-aksan">Yeni</span>
          <h2 className="text-[15px] font-bold text-metin">Vayra&rsquo;da yenilikler</h2>
          <Link href="/panel/surum" className="ml-auto text-[13px] text-metin-3 transition-colors hover:text-metin">Tüm sürüm notları →</Link>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 gizli-scroll sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {[
            { ad: "Görevler & Ödüller", ozet: "Görev tamamla, gerçek kredi kazan", href: "/panel/gorevler", ikon: Gift, grad: "from-amber-500/25 to-transparent", renk: "text-amber-300", gorsel: "/gercek/panel/yenilik-gorevler.webp" },
            { ad: "Montaj Stüdyosu", ozet: "AI ile çok katmanlı video montaj", href: "/panel/montaj", ikon: Scissors, grad: "from-cyan-500/25 to-transparent", renk: "text-cyan-300", beta: true, gorsel: "/gercek/panel/yenilik-montaj.webp" },
            { ad: "Uzun Video Stüdyosu", ozet: "1 dk–1 saat çok sahneli video", href: "/panel/uzun-video", ikon: Film, grad: "from-lime-500/25 to-transparent", renk: "text-lime-300", gorsel: "/gercek/panel/yenilik-uzunvideo.webp" },
            { ad: "Vayra Cloud (API)", ozet: "Anahtar üret, üretimi otomatikleştir", href: "/panel/api", ikon: Terminal, grad: "from-violet-500/25 to-transparent", renk: "text-violet-300", gorsel: "/gercek/panel/yenilik-api.webp" },
          ].map((k) => (
            <Link key={k.ad} href={k.href}
              className={cn("group relative flex w-[70%] shrink-0 snap-start flex-col gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1 ring-inset ring-white/[0.06] transition-transform hover:-translate-y-0.5 sm:w-auto", k.grad)}>
              {/* Gerçek görsel arka plan — üstte hafif karartma ile okunurluk */}
              <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: `center/cover no-repeat url("${k.gorsel}")` }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/40 to-ink-950/20" />
              <span className={cn("relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] backdrop-blur-sm", k.renk)}>
                <k.ikon className="h-5 w-5" />
              </span>
              <div className="relative">
                <p className="flex items-center gap-1.5 text-[14.5px] font-bold text-metin">
                  {k.ad}
                  {k.beta && <span className="rounded bg-amber-400/15 px-1 py-px text-[9px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/25">BETA</span>}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-metin-2">{k.ozet}</p>
              </div>
              <span className="relative mt-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-metin-3 transition-colors group-hover:text-metin">
                Keşfet <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ 2b. SÜRE SINIRLI KAMPANYA BANNERI (yalnız mobil) ═══
          Referansta hero rayının hemen altında tam genişlik teal banner var:
          fuşya geri sayım hapı → iki satır başlık (1. satır cyan) → gri alt metin
          → sola yaslı BEYAZ CTA. Masaüstünde bu alan zaten fiyat sayfasında. */}
      <Link href="/panel/kredi" className="relative mt-4 block overflow-hidden rounded-2xl p-5 sm:hidden"
        style={{ background: "linear-gradient(150deg, #10484f 0%, #0d3239 55%, #0b2126 100%)" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fusya px-2.5 py-1 text-[11px] font-bold uppercase leading-none text-white">
          <Clock className="h-3 w-3" /> 1G 16SA 45DK KALDI
        </span>
        <h2 className="hf-baslik mt-4 text-[26px] leading-[1.1] text-aksan-parlak">TÜM ÜST MODELLER SINIRSIZ</h2>
        <h2 className="hf-baslik text-[26px] leading-[1.1] text-white">3 GÜN BOYUNCA ERİŞİM</h2>
        <p className="mt-3 text-[13px] text-white/70">%70&apos;e varan özel indirimle sınırsız kullan</p>
        <span className="mt-14 inline-flex h-11 items-center rounded-[10px] bg-white px-6 text-[15px] font-semibold text-zemin">
          Sınırsız erişim al
        </span>
      </Link>

      {/* ═══ 2c. 2×2 ÖZELLİK IZGARASI (yalnız mobil) ═══
          Referansta 292px kartlar, 10px gap, 132px yükseklik: sol üstte ikon,
          sağ üstte rozet (gri "Video/Görsel" ya da lime italik "YENİ"), sonra
          başlık + iki satırlık gri açıklama. */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:hidden">
        {SC_URUN_KARTLARI.slice(0, 4).map((u) => (
          <Link key={u.ad} href={u.href} className="hf-kart flex min-h-[132px] flex-col bg-yuzey-2 p-4">
            <div className="flex items-start justify-between">
              <MarkaRozet u={u} />
              {u.rozet && (
                <span className={cn(
                  "shrink-0 rounded px-1.5 py-[3px] text-[10px] font-bold leading-none",
                  u.rozetTip === "lime" ? "bg-aksan italic text-zemin"
                    : u.rozetTip === "pembe" ? "bg-fusya text-white"
                    : "bg-white/[0.08] not-italic text-metin-2",
                )}>{u.rozet}</span>
              )}
            </div>
            <div className="mt-auto pt-3">
              <div className="text-[15px] font-semibold leading-tight text-metin">{u.ad}</div>
              <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-metin-2">{u.ozet}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══ 3. SÜPER BİLGİSAYAR VİTRİNİ ═══
          Eski hâli DONMUŞ bir ekran görüntüsüydü ("Ajan 23sn'dir çalışıyor"
          yazıp hiç ilerlemeyen adımlar) + yanında ikon/yazıdan ibaret 6 boş
          kutu. Yerine kendi kendine çalışan canlı bir gösteri geldi:
          istem yazılır, adımlar ilerler, çıktılar düşer, sonra sıradaki iş.
          Mobilde de görünür (eski blok `hidden sm:grid` ile gizliydi). */}
      <SCVitrin />

      {/* ═══ 4. HER PROJENİN İÇİNİ KEŞFET ═══ */}
      <section className="relative mt-8 sm:mt-12">
        <h2 className="hf-baslik text-xl text-aksan sm:text-2xl md:text-3xl">HER PROJENİN İÇİNİ KEŞFET</h2>
        <p className="mb-4 mt-1.5 text-[14px] leading-snug text-metin-2 sm:mb-5 sm:text-sm">Tüm prompt&apos;ları, öğeleri ve her projenin nasıl oluşturulduğunu gör.</p>
        <div className="relative">
          {/* Mobilde referans 6 kart gösterip son satırı fade + "Topluluğu keşfet"
              butonuyla örtüyor; masaüstünde 8 kart + altta buton. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-4">
            {PROJE_KESFET.map((p, i) => (
              <button key={p.gorsel} onClick={() => router.push("/panel/kesfet")}
                className={cn("group/pk block text-left", i >= 6 && "hidden sm:block")}>
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                  <img src={p.gorsel} alt={p.baslik} loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/pk:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover/pk:opacity-100" />
                  {/* hover: prompt önizleme (bölümün amacı "prompt'ları gör") */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-300 group-hover/pk:translate-y-0 group-hover/pk:opacity-100">
                    <p className="line-clamp-2 text-[11px] italic leading-snug text-white/90">&ldquo;{p.prompt}&rdquo;</p>
                  </div>
                  <span className="glass-cip absolute right-2 top-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover/pk:opacity-100"><Sparkles className="h-2.5 w-2.5" /> Prompt</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-aksan to-cyan-500" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-metin-2">{p.baslik} · {p.yazar}</span>
                  <span className="glass-cip flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] text-metin-3"><Globe className="h-2.5 w-2.5" />Açık</span>
                </div>
              </button>
            ))}
          </div>
          {/* Mobil: son satırın üstüne binen yüzen buton (referans birebir) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-zemin via-zemin/70 to-transparent pb-1 sm:hidden">
            <Link href="/panel/kesfet" className="hf-btn glass-cip-aktif pointer-events-auto flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-aksan">
              Topluluğu keşfet <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 hidden justify-center sm:flex">
            <Link href="/panel/kesfet" className="hf-btn glass-cip-aktif flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-aksan">Topluluğu keşfet <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* ═══ 5m. YARIŞMA — MOBİL ═══
          Referansta masaüstündeki "sol sticky panel + sağ ızgara" ikilisi yerine
          TEK sütun: ortalanmış ödül hero'su → lime "Tüm uygulamaları keşfet" →
          yapışkan segment (Tüm uygulamalar / Vayra yapımı) + arama → tam genişlik
          uygulama kartları (kapak, ⋮, avatar+ad+istatistik, lime "Aç"). */}
      <div className="mt-8 sm:hidden">
        <div className="hf-kart bg-yuzey px-4 pb-5 pt-6 text-center">
          <p className="text-[12px] uppercase tracking-wider text-metin-2">
            KAZANANLAR <span className="font-bold text-white">29 TEMMUZ</span>&apos;DA AÇIKLANIYOR
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[32px] font-black leading-none">
            <span className="text-aksan/60">❰</span>
            <span className="bg-gradient-to-b from-aksan-parlak to-aksan bg-clip-text text-transparent">₺750.000</span>
            <span className="text-aksan/60">❱</span>
          </div>
          <h3 className="hf-baslik mt-3 text-[26px] leading-[1.1] text-white">VAYRA<br />UYGULAMA YARIŞMASI</h3>
          <p className="mt-2 text-[14px] text-metin-2">Vayra&apos;da en iyi uygulamanı oluştur</p>
          <div className="my-5 flex aspect-square items-center justify-center overflow-hidden rounded-2xl" style={{ background: gorselArka("yarisma-heykel", "3d") }} />
          <Link href="/panel/supercomputer/uygulamalar"
            className="block w-full rounded-xl bg-aksan py-3.5 text-[16px] font-bold text-zemin">
            Tüm uygulamaları keşfet
          </Link>
        </div>

        {/* Filtre + liste TEK kapsayıcıda: `sticky` en yakın kaydırma atasına
            (burada sayfa) göre çalıştığı için, kapsayıcı olmadan başlık bölüm
            bittikten sonra da ekranda asılı kalıyordu. Kapsayıcı bitince
            yapışkanlık da biter. */}
        <div className="relative">
        <div className="sticky top-0 z-20 -mx-4 bg-zemin px-4 pb-2 pt-3">
          <div className="flex rounded-full border border-white/[0.08] bg-yuzey-2 p-[3px]">
            {["Tüm uygulamalar", "Vayra yapımı"].map((s, i) => (
              <button key={s} onClick={() => setUygSekme(i)}
                className={cn("flex-1 rounded-full py-2 text-[14px] font-semibold transition-colors",
                  uygSekme === i ? "bg-white text-zemin" : "text-metin-2")}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 flex h-11 items-center gap-2.5 rounded-xl bg-yuzey-2 px-4">
            <Search className="h-4 w-4 shrink-0 text-metin-2" />
            <input value={uygArama} onChange={(e) => setUygArama(e.target.value)}
              placeholder="Uygulama ara..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-metin-2" />
          </div>
        </div>

        <div className="mt-2 space-y-3">
          {mobilUygulamalar.map((a) => (
            <div key={a.ad} className="hf-kart overflow-hidden bg-yuzey p-2">
              <button onClick={() => router.push("/panel/supercomputer/uygulamalar")}
                className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg"
                style={{ background: gorselArka(a.tohum, a.kat) }}>
                <span className="glass-cip absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] text-white/85">Şimdi vayra.app&apos;te</span>
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                </span>
              </button>
              <div className="flex items-center gap-2.5 px-1 py-2.5">
                <span className="h-9 w-9 shrink-0 rounded-[9px]" style={{ background: gorselArka(a.tohum + "ic", a.kat) }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight text-metin">{a.ad}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-metin-2">
                    <Eye className="h-3 w-3" />{kisaSayi(a.goruntulenme)} görüntülenme
                    <span className="text-metin-3">·</span>
                    <Zap className="h-3 w-3" />{kisaSayi(a.kredi)} kredi
                  </div>
                </div>
                <button onClick={() => router.push("/panel/supercomputer/uygulamalar")}
                  className="shrink-0 rounded-lg bg-aksan px-3.5 py-1.5 text-[13px] font-bold text-zemin">Aç</button>
              </div>
            </div>
          ))}
          {mobilUygulamalar.length === 0 && (
            <p className="py-10 text-center text-[14px] text-metin-2">
              &ldquo;{uygArama}&rdquo; için uygulama bulunamadı.
            </p>
          )}
        </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Link href="/panel/supercomputer/uygulamalar"
            className="hf-btn glass-cip-aktif flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-aksan">
            Tüm uygulamaları keşfet <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ═══ 5. YARIŞMA — MASAÜSTÜ ═══ */}
      <div className="mt-12 hidden grid-cols-1 gap-6 sm:grid lg:grid-cols-[300px_1fr]">
        {/* Sol sticky panel */}
        <div className="lg:sticky lg:top-16 lg:self-start">
          <div className="hf-kart bg-gradient-to-br from-yuzey to-yuzey p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-black">
              <span className="text-aksan/60">❰</span>
              <span className="bg-gradient-to-b from-aksan-parlak to-aksan bg-clip-text text-transparent">₺750.000</span>
              <span className="text-aksan/60">❱</span>
            </div>
            <h3 className="hf-baslik mt-3 text-lg text-metin">VAYRA UYGULAMA YARIŞMASI</h3>
            <p className="mt-1 text-[13px] text-metin-2">Vayra'da en iyi uygulamanı oluştur</p>
            <div className="my-5 flex aspect-video items-center justify-center overflow-hidden rounded-xl" style={{ background: gorselArka("yarisma-heykel", "3d") }} />
            <Link href="/panel/supercomputer/uygulamalar" className="block w-full rounded-xl bg-aksan py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">Yarışmaya katıl</Link>
          </div>
        </div>
        {/* Sağ uygulama grid */}
        <div>
          <h2 className="hf-baslik mb-4 text-2xl text-metin">Öne çıkan uygulamalar</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {YARISMA_UYGULAMALAR.map((a) => (
              <button key={a.ad} onClick={() => router.push("/panel/supercomputer/uygulamalar")} className="hf-kart group overflow-hidden text-left">
                <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: gorselArka(a.tohum, a.kat) }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="glass-cip absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[9px] text-white/80">Şimdi vayra.app'te</span>
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-aksan px-2 py-1 text-[10px] font-bold text-zemin opacity-0 transition-opacity group-hover:opacity-100">Aç</span>
                </div>
                <div className="flex items-center gap-2.5 p-3">
                  <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: gorselArka(a.tohum + "ic", a.kat) }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-metin">{a.ad}</div>
                    <div className="flex items-center gap-2 text-[11px] text-metin-3"><span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{kisaSayi(a.goruntulenme)}</span><span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" />{kisaSayi(a.kredi)}</span></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 6. SEEDANCE TV-BANNER ═══
          Mobilde TV çerçevesi 4:3'e yaklaşır (referans), masaüstünde 21:9 kalır. */}
      <div className="mt-8 overflow-hidden rounded-[22px] border-[6px] border-[#2b2d30] bg-yuzey-2 p-1.5 sm:mt-12 sm:rounded-[28px] sm:border-4 sm:p-2">
        <div className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl sm:aspect-[21/9] sm:rounded-2xl">
          {/* GERÇEK 8sn video (Veo 3.1, 16:9). Önce statik gradyandı; banner
              bir video modelini tanıttığı hâlde hareket göstermiyordu.
              HeroVideo görünürlükte oynatır, ekrandan çıkınca duraklatır. */}
          <HeroVideo src="/gercek/hero-video/seedance-banner.mp4" tohum="seedance-tv"
            poster="/gercek/hero-video/seedance-banner-poster.webp" />
          {/* Karartma: video parlak mavi şimşekler içeriyor, metin okunur
              kalmalı. Değer ölçümle seçildi — videonun EN PARLAK karesinde
              (7.5sn, elektrik girdabı: rgb(132,156,189)) bu iki katmanla
              aksan metni 8.2:1 veriyor, AA'nın (4.5) çok üstünde.
              Daha koyusu (/45) gereksizdi ve videoyu boğuyordu. */}
          <div className="pointer-events-none absolute inset-0 bg-black/35" />
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0,0,0,0.55), transparent 75%)" }} />
          <span className="absolute right-3 top-3 -rotate-6 rounded bg-aksan px-2 py-0.5 text-[15px] font-black italic text-zemin sm:right-4 sm:top-4 sm:text-sm">4K</span>
          <span className="hf-baslik relative text-[42px] leading-none text-aksan drop-shadow-lg sm:text-5xl md:text-7xl">SEEDANCE 2.0</span>
          <span className="relative mt-2 rounded-full bg-white px-3 py-[3px] text-[11px] font-bold text-zemin sm:text-[13px]">ŞİMDİ 4K&apos;DA</span>
          <span className="hf-baslik relative mt-2.5 text-[11px] tracking-wide text-aksan sm:mt-3 sm:text-sm md:text-base">ARTIK VAYRA&apos;DA</span>
          <Link href="/panel/video" className="relative mt-4 rounded-lg bg-aksan px-5 py-2 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.03]">Şimdi dene</Link>
        </div>
      </div>

      {/* ═══ 7. SEEDANCE GALERİ (model bölümü #1) ═══ */}
      <div className="mt-8 sm:mt-12"><ModelBolum b={MODEL_BOLUMLERI[0]} uretimler={gorunur} /></div>

      {/* ═══ 9. SUPERCOMPUTER TANITIM ═══
          Mobilde referans uzun bir dikey kart: üstte ve altta lime parlama,
          ortada perspektif ızgara + ikon kümesi + dev kelime markası. */}
      <div className="relative mt-8 flex aspect-[5/6] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-aksan/30 bg-[#0b0f0c] px-5 text-center sm:mt-12 sm:aspect-[21/9] sm:rounded-[28px] sm:px-0"
        style={{ boxShadow: "inset 0 0 80px -20px var(--color-aksan)" }}>
        {/* Mobilde üst+alt lime bant (referans), masaüstünde sadece iç parıltı */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[14%] bg-gradient-to-b from-aksan to-transparent opacity-90 sm:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-aksan to-transparent opacity-90 sm:hidden" />
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--color-aksan) 1px, transparent 1px), linear-gradient(90deg, var(--color-aksan) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "linear-gradient(to top, black, transparent 70%)" }} />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-aksan text-zemin"><Cpu className="h-7 w-7" /></span>
        <h2 className="hf-baslik relative mt-4 text-[34px] leading-none text-aksan sm:text-4xl md:text-5xl">SÜPER BİLGİSAYAR</h2>
        <p className="relative mt-2 max-w-md text-[14px] text-metin sm:text-[15px]">Tüm yaratıcı iş akışın için tek süper-ajan</p>
        <Link href="/panel/supercomputer" className="relative mt-5 rounded-full bg-white px-6 py-2.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.03] sm:rounded-lg sm:text-[14px]">Süper Bilgisayar&apos;ı Dene</Link>
      </div>

      {/* ═══ 10. VİRAL PRESETLER ═══ */}
      <section className="mt-8 sm:mt-12">
        <div className="mb-3 flex items-end justify-between sm:mb-4">
          <div>
            <h2 className="hf-baslik text-xl text-aksan sm:text-2xl md:text-3xl">VAYRA VİRAL PRESETLER</h2>
            <p className="mt-1.5 text-[14px] leading-snug text-metin-2 sm:mt-1 sm:text-sm">Patlamalardan gerçeküstü dönüşümlere, büyük bütçeli görsel efektler.</p>
          </div>
        </div>
        {/* Çip şeridi: mobilde kenardan taşarak kaydırılabilir (referansta son çip
            sağ kenarda yarım kesilir), ok butonları YOK. Masaüstünde oklar döner. */}
        <div className="mb-4 flex items-center gap-2">
          <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 gizli-scroll sm:mx-0 sm:px-0">
            {PRESET_KATEGORILER.map((k) => (
              <button key={k} onClick={() => router.push("/panel/presetler")} className="hf-btn glass-cip shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-metin hover:text-metin sm:rounded-full sm:py-1.5 sm:font-medium sm:normal-case sm:tracking-normal sm:text-metin-2">{k}</button>
            ))}
          </div>
          <div className="hidden shrink-0 gap-1.5 sm:flex">
            <button className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Geri"><ChevronLeft className="h-4 w-4" /></button>
            <button className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="İleri"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <PresetKart key={i} i={i} etiket={PRESET_KATEGORILER[i % PRESET_KATEGORILER.length]} onClick={() => router.push("/panel/presetler")} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-40 items-end justify-center bg-gradient-to-t from-zemin via-zemin/70 to-transparent pb-2">
            <Link href="/panel/presetler" className="hf-btn glass-cip-aktif pointer-events-auto flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-aksan sm:rounded-full sm:py-2 sm:text-[13px]">Tüm presetleri gör <ArrowUpRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* ═══ 11. GPT IMAGE 2 (model bölümü #2) ═══ */}
      <div className="mt-8 sm:mt-12"><ModelBolum b={MODEL_BOLUMLERI[2]} uretimler={gorunur} /></div>

      {/* ═══ 12. CANVAS BANNER ═══
          Mobilde: görsel ÜSTTE (16:10), metin altta, CTA tam genişlik beyaz. */}
      <div className="relative mt-8 flex flex-col gap-5 overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-800/40 via-teal-700/25 to-sky-800/30 p-5 sm:mt-12 sm:grid sm:grid-cols-1 sm:items-center sm:gap-6 sm:rounded-[28px] sm:p-8 lg:grid-cols-2">
        <div className="order-2 sm:order-1">
          <span className="rounded-full bg-aksan/20 px-2.5 py-1 text-[11px] font-bold text-aksan">{CANVAS_BANNER.rozet}</span>
          <h2 className="hf-baslik mt-3 text-[27px] leading-[1.1] text-white sm:text-3xl md:text-4xl">{CANVAS_BANNER.baslik1}<br />{CANVAS_BANNER.baslik2}</h2>
          <p className="mt-3 max-w-md text-[14px] text-white/70">{CANVAS_BANNER.ozet}</p>
          <Link href={CANVAS_BANNER.href} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-white py-3.5 text-[16px] font-bold text-zemin transition-transform hover:scale-[1.03] sm:inline-flex sm:w-auto sm:px-5 sm:py-2.5 sm:text-[14px]"><Sparkles className="h-4 w-4" /> {CANVAS_BANNER.buton}</Link>
        </div>
        <div className="relative order-1 aspect-[16/10] overflow-hidden rounded-2xl bg-black/20 sm:order-2 sm:aspect-auto sm:h-52" style={{ background: gorselArka("canvas-mockup", "portre") }} />
      </div>

      {/* ═══ 13. PAZARLAMA (model bölümü #4) ═══ */}
      <div className="mt-8 sm:mt-12"><ModelBolum b={MODEL_BOLUMLERI[3]} uretimler={gorunur} /></div>

      {/* ═══ 14. PHOTODUMP BANNER ═══
          Mobilde referans: istiflenmiş foto kartları ÜSTTE (arka plan olarak),
          altta rozet + iki satır başlık + gri açıklama + tam genişlik beyaz CTA. */}
      <div className="hf-kart relative mt-8 flex flex-col gap-5 overflow-hidden bg-yuzey p-5 sm:mt-12 sm:grid sm:grid-cols-1 sm:items-center sm:gap-6 sm:p-8 lg:grid-cols-2">
        <div className="relative order-1 flex h-56 items-center justify-center gap-2 sm:order-2 sm:h-52 sm:justify-end">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-44 w-32 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl sm:h-40 sm:w-28", i === 1 && "z-10 scale-110")} style={{ background: gorselArka("photodump" + i, "portre"), rotate: `${(i - 1) * 8}deg` }} />
          ))}
        </div>
        <div className="order-2 sm:order-1">
          <span className="rounded-full bg-aksan/20 px-2.5 py-1 text-[11px] font-bold text-aksan">{PHOTODUMP_BANNER.rozet}</span>
          <h2 className="hf-baslik mt-3 text-[27px] leading-[1.1] text-white sm:text-3xl md:text-4xl">{PHOTODUMP_BANNER.baslik1}<br />{PHOTODUMP_BANNER.baslik2}</h2>
          <p className="mt-3 max-w-md text-[14px] text-white/70">{PHOTODUMP_BANNER.ozet}</p>
          <Link href={PHOTODUMP_BANNER.href} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-white py-3.5 text-[16px] font-bold text-zemin transition-transform hover:scale-[1.03] sm:inline-flex sm:w-auto sm:px-5 sm:py-2.5 sm:text-[14px]">{PHOTODUMP_BANNER.buton}</Link>
        </div>
      </div>

      {/* ═══ 15. SOUL CINEMA (model bölümü #5) ═══ */}
      <div className="mt-8 sm:mt-12"><ModelBolum b={MODEL_BOLUMLERI[4]} uretimler={gorunur} /></div>

      {/* ═══ 16. SOUL 2.0 (model bölümü #6) ═══ */}
      <div className="mt-8 sm:mt-12"><ModelBolum b={MODEL_BOLUMLERI[5]} uretimler={gorunur} /></div>

      {/* ═══ 17. DAHA FAZLA AI ÖZELLİĞİ ═══
          Referansta mobilde başlık 24px/800 BEYAZ (lime değil), hap 15px metin,
          33px yükseklik, satırlar ortalanmış sarma. */}
      <section className="mt-12 pb-8 text-center sm:mt-16">
        <h2 className="hf-baslik text-2xl text-metin sm:text-3xl md:text-4xl">DAHA FAZLA AI ÖZELLİĞİ KEŞFET</h2>
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-3 gap-y-2 sm:mt-6 sm:gap-2">
          {OZELLIK_CIPLERI.map((c) => (
            <button key={c} onClick={() => router.push("/panel/presetler")} className="hf-btn glass-cip flex h-[33px] items-center rounded-full px-3 text-[15px] text-metin hover:text-metin sm:h-auto sm:px-3.5 sm:py-1.5 sm:text-[12px] sm:text-metin-2">{c}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
