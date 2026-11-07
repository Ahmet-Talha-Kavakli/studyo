"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import { Play, Heart, Eye, Zap, Video, ImageIcon, Box, AudioLines, Search, TrendingUp, Clock, Flame, Shuffle, Sparkles, ArrowRight } from "lucide-react";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { onizlemeArka, cn } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

type GaleriOge = {
  baslik: string; yazar: string; tur: "video" | "gorsel" | "3d" | "ses";
  begeni: number; goruntulenme: number; kredi: number; model: string;
};

// El yapımı öne çıkan seçkiler (galerinin başını dolduran en kaliteli işler).
const oneCikanlar: GaleriOge[] = [
  { baslik: "Neon Şehir Turu", yazar: "@cinemadreams", tur: "video", begeni: 2400, goruntulenme: 48200, kredi: 55, model: "Veo 3.1" },
  { baslik: "Editorial Moda Serisi", yazar: "@studio.ela", tur: "gorsel", begeni: 1820, goruntulenme: 31500, kredi: 4, model: "Ruh 2.0" },
  { baslik: "Sci-Fi Robot Karakter", yazar: "@3dworks", tur: "3d", begeni: 3100, goruntulenme: 62100, kredi: 25, model: "Meshy" },
  { baslik: "Marka Jingle'ı", yazar: "@soundlab", tur: "ses", begeni: 940, goruntulenme: 12800, kredi: 8, model: "Vali" },
  { baslik: "Gün Batımı Sahili", yazar: "@wanderer", tur: "video", begeni: 5200, goruntulenme: 104000, kredi: 42, model: "Seedance 2.0" },
  { baslik: "Ürün Reklamı — Saat", yazar: "@adcraft", tur: "video", begeni: 1200, goruntulenme: 22400, kredi: 40, model: "Seedance 2.0" },
  { baslik: "Fantastik Manzara", yazar: "@dreamscape", tur: "gorsel", begeni: 4300, goruntulenme: 88300, kredi: 6, model: "Ruh Sinema" },
  { baslik: "Düşük Poligon Ada", yazar: "@lowpoly", tur: "3d", begeni: 2750, goruntulenme: 41000, kredi: 25, model: "Meshy" },
  { baslik: "Sinematik Anlatı", yazar: "@narration", tur: "ses", begeni: 680, goruntulenme: 9400, kredi: 3, model: "ElevenLabs" },
  { baslik: "Karakter Dönüşümü", yazar: "@transform", tur: "video", begeni: 3900, goruntulenme: 71600, kredi: 48, model: "Kling 3.0" },
  { baslik: "Mimari Görselleştirme", yazar: "@archviz", tur: "gorsel", begeni: 2100, goruntulenme: 34900, kredi: 5, model: "Nano Banana" },
  { baslik: "AI Influencer Portre", yazar: "@virtualstar", tur: "gorsel", begeni: 6400, goruntulenme: 128000, kredi: 4, model: "Ruh 2.0" },
];

// Higgsfield Explore birebir: galeri onlarca kartla sonsuz-akar hisseder.
// Aşağıdaki parçalardan deterministik (SSR-güvenli, Math.random YOK) 48 kart daha üretilir.
const G_KONULAR = [
  "Kış Ormanı Rüyası", "Retro Sinemaskop", "Cyberpunk Sokak", "Altın Saat Portresi", "Su Altı Şehri",
  "Çöl Kervanı", "Volkanik Manzara", "Kristal Mağara", "Uzay İstasyonu", "Antik Tapınak",
  "Fırtına Öncesi", "Neon Ninja", "Buzul Çağı", "Tropik Cennet", "Steampunk Atölye",
  "Kayıp Şehir", "Aurora Gecesi", "Robot Bahçıvan", "Deniz Feneri", "Gökdelen Silüeti",
  "Mistik Orman Perisi", "Yağmurlu Tokyo", "Kum Fırtınası", "Kutup Ekspresi", "Piksel Kahramanı",
  "Barok Balo Salonu", "Nebula Yolculuğu", "Samuray Düellosu", "Bulut Şehri", "Fütüristik Metro",
  "Vahşi Batı Kasabası", "Denizatı Krallığı", "Zaman Makinesi", "Gölge Avcısı", "Işık Festivali",
  "Terkedilmiş Fabrika", "Dağ Manastırı", "Karnaval Gecesi", "Kayan Yıldızlar", "Kuantum Laboratuvarı",
  "Ejder Yuvası", "Yeraltı Pazarı", "Buz Sarayı", "Çöl Gülü", "Sisli Vadi",
  "Kozmik Bahçe", "Titan Savaşı", "Rüya Kapısı",
];
const G_YAZARLAR = [
  "@pixelforge", "@auralab", "@frame.by.frame", "@neonmancer", "@studio.mira", "@velvetlens",
  "@dreamloop", "@0xrender", "@atlas.creative", "@lunavisuals", "@echostudio", "@primeframe",
  "@nocturne.ai", "@vividworks", "@render.house", "@synthwave", "@monolith.co", "@auroraworks",
];
const G_TURLER: GaleriOge["tur"][] = ["video", "gorsel", "3d", "ses", "gorsel", "video"];
const G_MODELLER = ["Veo 3.1", "Kling 3.0", "Ruh 2.0", "Seedance 2.0", "Ruh Sinema", "Nano Banana", "Meshy", "Vali", "Sora 2", "Minimax Hailuo", "Wan 2.5"];

// Bir tohumdan deterministik hash (SSR/hydration güvenli, Math.random yok).
function gHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const uretilenGaleri: GaleriOge[] = G_KONULAR.map((baslik, i) => {
  const h = gHash(baslik + i);
  const tur = G_TURLER[h % G_TURLER.length];
  const kredi = tur === "video" ? 35 + (h % 30) : tur === "3d" ? 20 + (h % 10) : tur === "ses" ? 2 + (h % 8) : 3 + (h % 6);
  return {
    baslik,
    yazar: G_YAZARLAR[h % G_YAZARLAR.length],
    tur,
    begeni: 200 + (h % 6800),
    goruntulenme: 4000 + (h % 145000),
    kredi,
    model: G_MODELLER[(h >> 3) % G_MODELLER.length],
  };
});

const galeri: GaleriOge[] = [...oneCikanlar, ...uretilenGaleri];

function kisaSayi(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "b" : String(n);
}

const filtreler = [
  { id: "tumu", ad: "Tümü" }, { id: "video", ad: "Video" },
  { id: "gorsel", ad: "Görsel" }, { id: "3d", ad: "3D" }, { id: "ses", ad: "Ses" },
];
const turIkon = { video: Video, gorsel: ImageIcon, "3d": Box, ses: AudioLines };
// Her tür için görsel kategorisi — masonry gerçek görsel çeşitliliğiyle dolsun.
const turKategori: Record<string, string> = { video: "sinematik", gorsel: "portre", "3d": "3d", ses: "soyut" };

const siralamalar = [
  { id: "trend", ad: "Trend", ikon: TrendingUp },
  { id: "yeni", ad: "Yeni", ikon: Clock },
  { id: "populer", ad: "Popüler", ikon: Flame },
];

export default function KesfetPage() {
  const router = useRouter();
  const girisYapildi = useAuth((s) => s.girisYapildi);
  const kullanici = useAuth((s) => s.kullanici);
  const uretimler = useProjeler((s) => s.uretimler);
  const [filtre, setFiltre] = useState("tumu");
  const [modelFiltre, setModelFiltre] = useState<string | null>(null); // model-feed "Tümünü gör" filtresi
  const [sirala, setSirala] = useState("trend");
  const [arama, setArama] = useState("");
  const [begenilenler, setBegenilenler] = useState<Set<string>>(new Set());

  // Bir yapımı beğen/geri al — kalp dolar, sayı canlı güncellenir (Higgsfield birebir).
  const begenTikla = (anahtar: string) => {
    setBegenilenler((v) => {
      const y = new Set(v);
      if (y.has(anahtar)) y.delete(anahtar);
      else y.add(anahtar);
      return y;
    });
  };

  // Toplulukta yayınlanan kendi üretimlerin — Keşfet'te "Senin" olarak görünür (üret→yayınla→remix döngüsü).
  const yayinlananlar = uretimler
    .filter((u) => u.yayinda && u.durum === "tamam")
    .map((u) => ({
      baslik: u.baslik,
      yazar: "@" + (kullanici?.ad?.toLowerCase().replace(/\s+/g, "") || "sen"),
      tur: (u.tur === "3d" ? "3d" : u.tur) as "video" | "gorsel" | "3d" | "ses",
      begeni: 0,
      goruntulenme: 0,
      kredi: u.kredi,
      model: u.model,
      benim: true as const,
    }));

  // Remixle — topluluk yapımını kendi versiyonun için üretime taşı.
  const remixle = (baslik: string, tur: string) => {
    try {
      sessionStorage.setItem("vayra-gecis-prompt", `${baslik} tarzında, kendi yorumumla`);
      sessionStorage.setItem("vayra-remix-kaynak", baslik);
    } catch { /* yoksay */ }
    toast.success("Remix hazırlandı", { description: `"${baslik}" istemi görsel stüdyosuna aktarılıyor.` });
    router.push(girisYapildi ? "/panel/gorsel" : "/kayit?geri=/panel/gorsel");
  };

  // Yayınlanan kendi işlerin en başta; ardından topluluk galerisi.
  const tumIcerik = [...yayinlananlar, ...galeri];
  const liste = tumIcerik
    .filter((g) => filtre === "tumu" || g.tur === filtre)
    .filter((g) => !modelFiltre || g.model === modelFiltre)
    .filter((g) => !arama || g.baslik.toLowerCase().includes(arama.toLowerCase()) || g.yazar.toLowerCase().includes(arama.toLowerCase()))
    .slice()
    .sort((a, b) => {
      // Kendi yayınların her zaman önde
      const am = "benim" in a && a.benim ? 1 : 0;
      const bm = "benim" in b && b.benim ? 1 : 0;
      if (am !== bm) return bm - am;
      return sirala === "populer" ? b.begeni - a.begeni
        : sirala === "yeni" ? 0
        : b.goruntulenme - a.goruntulenme;
    });

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Keşfet"
        baslik="Toplulukla üretilenler"
        aciklama="Vayra yaratıcılarının en iyi işleri. İlham al, remixle, kendi versiyonunu üret."
      />

      {/* Öne çıkanlar — Vayra Seçkileri */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold">Vayra Seçkileri</h2>
          <span className="rounded-full bg-cyan-glow/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-glow">Haftanın öne çıkanları</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {galeri.slice(0, 3).map((g, i) => (
            <motion.div key={g.baslik} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group relative aspect-video overflow-hidden rounded-3xl border border-white/10">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: kesfetArka(g.baslik + g.yazar, "sinematik") }} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-ink-950/50 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">#{i + 1} Öne çıkan</span>
              <div className="absolute inset-x-4 bottom-4">
                <h3 className="text-lg font-bold">{g.baslik}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-vayra-400 to-vayra-600 text-[10px] font-bold">{g.yazar.charAt(1).toUpperCase()}</span>
                  {g.yazar}
                  <span className="ml-auto flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {kisaSayi(g.goruntulenme)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Model-bazlı feed'ler — Higgsfield Explore birebir: her model için yatay şerit + "Tümünü gör" */}
      {["Veo 3.1", "Kling 3.0", "Ruh 2.0"].map((modelAd) => {
        const modelKartlari = galeri.filter((g) => g.model === modelAd).slice(0, 8);
        if (modelKartlari.length < 3) return null;
        return (
          <section key={modelAd} className="mx-auto max-w-7xl px-4 pb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md glass-ikon glass-ikon-cyan"><Sparkles className="h-3.5 w-3.5" /></span>
                {modelAd} ile üretilenler
              </h2>
              <button onClick={() => { setModelFiltre(modelAd); setFiltre("tumu"); if (typeof document !== "undefined") document.getElementById("kesfet-galeri")?.scrollIntoView({ behavior: "smooth" }); }} className="flex items-center gap-1 text-sm text-cyan-glow hover:underline">
                Tümünü gör <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="gizli-scroll flex gap-3 overflow-x-auto pb-1">
              {modelKartlari.map((g, i) => {
                const Ikon = turIkon[g.tur];
                return (
                  <Link key={g.baslik + i} href="#" onClick={(e) => e.preventDefault()}
                    className="group relative aspect-[3/4] w-44 shrink-0 overflow-hidden rounded-xl border border-white/8">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      style={{ background: kesfetArka(g.baslik + g.yazar, turKategori[g.tur] ?? "sinematik") }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink-950/60 px-2 py-0.5 text-[10px] backdrop-blur-sm">
                      <Ikon className="h-2.5 w-2.5" /> {g.tur}
                    </span>
                    <div className="absolute inset-x-2 bottom-2">
                      <h3 className="truncate text-[12px] font-semibold">{g.baslik}</h3>
                      <span className="text-[10px] text-white/60">{g.yazar}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <section id="kesfet-galeri" className="mx-auto max-w-7xl px-4 pb-16">
        {/* Aktif model filtresi rozeti (Tümünü gör'den) */}
        {modelFiltre && (
          <div className="mb-4 flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-cyan-glow/15 px-3 py-1.5 text-sm text-cyan-glow">
              {modelFiltre} ile üretilenler
              <button onClick={() => setModelFiltre(null)} aria-label="Filtreyi kaldır" className="transition-colors hover:text-white">✕</button>
            </span>
          </div>
        )}
        {/* Sıralama + arama */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-yuzey p-1">
            {siralamalar.map((s) => (
              <button key={s.id} onClick={() => setSirala(s.id)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  sirala === s.id ? "bg-cyan-glow/15 text-white" : "text-white/55 hover:text-white")}>
                <s.ikon className="h-3.5 w-3.5" /> {s.ad}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Yaratıcı veya başlık ara…"
              className="h-10 w-56 rounded-xl border border-white/12 bg-yuzey pl-9 pr-3 text-sm outline-none placeholder:text-white/35 focus:border-cyan-glow/50" />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filtreler.map((f) => (
            <button key={f.id} onClick={() => setFiltre(f.id)}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filtre === f.id ? "border-transparent bg-cyan-glow text-ink-950" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white")}>
              {f.ad}
            </button>
          ))}
        </div>

        {liste.length === 0 && (
          <p className="py-16 text-center text-sm text-white/40">&quot;{arama}&quot; için sonuç bulunamadı.</p>
        )}
        {/* Higgsfield Explore — edge-to-edge dar-gap masonry */}
        <div className="columns-2 gap-2 sm:columns-3 lg:columns-4 xl:columns-5">
          {liste.map((g, i) => {
            const Ikon = turIkon[g.tur];
            const h = [220, 300, 260, 340, 280, 200, 320, 240, 360, 210][i % 10];
            const benim = "benim" in g && Boolean(g.benim);
            return (
              <motion.div key={g.baslik + "-" + i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className={cn("group mb-2 break-inside-avoid overflow-hidden rounded-xl border", benim ? "border-cyan-glow/40" : "border-white/8")}>
                <div className="relative" style={{ height: h, background: kesfetArka(g.baslik + g.yazar, turKategori[g.tur] ?? "sinematik") }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ink-950/60 px-2 py-1 text-[11px] backdrop-blur-sm">
                    <Ikon className="h-3 w-3" /> {g.tur}
                  </span>
                  {benim && (
                    <span className="absolute left-3 top-11 rounded-full bg-cyan-glow px-2 py-0.5 text-[10px] font-bold text-ink-950">
                      Senin
                    </span>
                  )}
                  {/* Model + kredi rozeti (sağ üst) */}
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink-950/60 px-2 py-1 text-[10px] font-medium text-amber-glow backdrop-blur-sm">
                    <Zap className="h-2.5 w-2.5" /> {g.kredi}
                  </span>
                  {g.tur === "video" || g.tur === "ses" ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full glass-ikon "><Play className="h-5 w-5 fill-white text-white" /></span>
                    </div>
                  ) : null}
                  {/* Remixle — kendi versiyonunu üret */}
                  <button onClick={() => remixle(g.baslik, g.tur)}
                    className="absolute right-3 top-11 z-20 flex items-center gap-1.5 rounded-lg bg-cyan-glow px-2.5 py-1.5 text-xs font-bold text-ink-950 opacity-0 transition-all hover:scale-105 group-hover:opacity-100">
                    <Shuffle className="h-3.5 w-3.5" /> Remixle
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-sm font-semibold">{g.baslik}</h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-vayra-400 to-vayra-600 text-[9px] font-bold">
                        {g.yazar.charAt(1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/70">{g.yazar}</span>
                      <span className="flex items-center gap-1 text-xs text-white/60"><Eye className="h-3 w-3" /> {kisaSayi(g.goruntulenme)}</span>
                      {(() => {
                        const anahtar = g.baslik + "-" + i;
                        const begendim = begenilenler.has(anahtar);
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); begenTikla(anahtar); }}
                            className={cn("flex items-center gap-1 text-xs transition-colors", begendim ? "text-rose-400" : "text-white/60 hover:text-rose-300")}
                            aria-label="Beğen"
                          >
                            <Heart className={cn("h-3 w-3 transition-transform", begendim && "scale-110 fill-rose-400 text-rose-400")} /> {kisaSayi(g.begeni + (begendim ? 1 : 0))}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/kayit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-vayra-500 px-7 font-medium text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-vayra-400">
            Sen de üretmeye başla
          </Link>
        </div>
      </section>
    </SayfaKabuk>
  );
}
