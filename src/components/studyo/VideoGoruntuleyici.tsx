"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ChevronDown, X, Maximize2, Pencil, Info, Wand2, MessageCircle, Loader2, FastForward, ImagePlus, ImageDown, Camera, Copy, RefreshCw, Download, Heart, Trash2, Film, ArrowLeft, Palette, Crop, Brush,
  Clock, Gem, Volume2, Layers, Gauge, FileVideo, Coins, CalendarClock, Move,
} from "lucide-react";
import { KadrajKatmani, KadrajPaneli, RENK_SIFIR, RenkKatmani, RenkPaneli, atolyeHata, klipIsle, renkBos, renkFiltre, type Kadraj, type Renk } from "@/components/studyo/sinema/KlipAtolyesi";
import { toast } from "@/lib/toast";
import { hareketAdi } from "@/components/studyo/video/veri";
import { cn, saltUrl } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import type { Uretim } from "@/store/useProjeler";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { Tooltip } from "@/components/ui/Tooltip";
import { Star } from "lucide-react";

/* ───────────────────────────────────────────────────────────────────────────
   Video görüntüleyici — büyük oynatıcı + sağ panel (Bilgi · Araçlar · Yorumlar).
   Araçlar videonun KENDİ karesiyle çalışır: uzatma son kareyi yakalayıp yeni
   çekimin başlangıç karesi yapar; kare araçları duraklatılan anı kullanır.
   ─────────────────────────────────────────────────────────────────────────── */

/** Bir video öğesinin o anki karesini WebP/PNG data URL olarak çizer (en uzun kenar 1280 px). */
function kareCiz(v: HTMLVideoElement, tur: "image/webp" | "image/png" = "image/webp"): string {
  const olcek = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(v.videoWidth * olcek); c.height = Math.round(v.videoHeight * olcek);
  const x = c.getContext("2d");
  if (!x || !c.width) throw new Error("kare çizilemedi");
  x.drawImage(v, 0, 0, c.width, c.height);
  return c.toDataURL(tur, 0.92); // çapraz köken kirlenmişse burada hata fırlar
}

/** Videonun belirli bir anını (ya da son karesini) oynatıcıyı bozmadan, ayrı bir öğede yakalar. */
export function kareYakala(src: string, an: number | "son" | "orta"): Promise<string> {
  return new Promise((ok, hata) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.playsInline = true;
    if (/^https?:/.test(src) && !src.startsWith(location.origin)) v.crossOrigin = "anonymous";
    const zaman = setTimeout(() => hata(new Error("zaman aşımı")), 10000);
    v.onerror = () => { clearTimeout(zaman); hata(new Error("video yüklenemedi")); };
    v.onloadedmetadata = () => { v.currentTime = an === "son" ? Math.max(0, v.duration - 0.08) : an === "orta" ? v.duration / 2 : Math.min(an, Math.max(0, v.duration - 0.05)); };
    v.onseeked = () => {
      clearTimeout(zaman);
      try { ok(kareCiz(v)); } catch (e) { hata(e); }
    };
    v.src = src;
  });
}

const sureYaz = (s: number) => {
  const dk = Math.floor(s / 60);
  const sn = s - dk * 60;
  return `${dk}:${sn < 10 ? "0" : ""}${sn.toFixed(1).replace(".", ",")}`;
};

type AracId = "uzat" | "renk" | "kadraj";
/** Atölye çıktısı: işlenmiş klip ve hangi işlemle üretildiği. */
export type AtolyeSonuc = { blob: Blob; uzanti: string; w: number; h: number; sure: number };
export type AtolyeIslem = { tur: "renk"; renk: Renk } | { tur: "kadraj"; kadraj: Kadraj };

export function VideoGoruntuleyici({
  u, ad, altBaslik, onAdKaydet, sira, onGez, onKapat, yorumlar, yorumSayisi, ustKatmanAcik = false,
  krediler, uzatKredi, onUzat, onKareBaslangic, onKareKaydet, onKareDuzenle, onIndir, onAyarlariYukle, onYenidenUret, onBegen, onSil, kaynak, atolye, ekBilgi,
}: {
  u: Uretim; ad: string; altBaslik: string; onAdKaydet: (yeni: string) => void;
  sira: { i: number; n: number } | null; onGez: (yon: 1 | -1) => void; onKapat: () => void;
  yorumlar: ReactNode; yorumSayisi: number;
  /** Görüntüleyicinin üstünde başka bir pencere açıkken klavye kısayolları devre dışı. */
  ustKatmanAcik?: boolean;
  krediler: number;
  /** Uzatmanın bedeli (sınırsız erişimde 0). */
  uzatKredi: number;
  onUzat: (sonKare: string, istem: string) => boolean;
  onKareBaslangic: (kare: string) => void;
  onKareKaydet: (kare: string, an: number) => void;
  /** Verilirse kare araçlarında "Kareyi düzenle": kare görsel olarak açılır, düzenlenip yeniden çekilir. */
  onKareDuzenle?: (kare: string, an: number) => void;
  onIndir: () => void;
  onAyarlariYukle: () => void;
  onYenidenUret: () => void;
  onBegen: () => void;
  onSil: () => void;
  /** Bu video bir uzatmanın sonucuysa kaynağı (tıklayınca kaynak açılır). */
  kaynak?: { poster?: string; ad: string; ac: () => void };
  /** Verilirse Araçlar'da renk derecelendirme ve yeniden kadrajlama açılır; çıktı bu işleve gider. */
  atolye?: { onKaydet: (s: AtolyeSonuc, islem: AtolyeIslem) => Promise<void> };
  /** Bilgi sekmesine eklenen ek kart (ör. sürüm geçmişi). */
  ekBilgi?: ReactNode;
}) {
  const yanBoy = useKenarStili("goruntuleyici-video", 360);
  const src = u.videoUrl ?? "";
  const poster = saltUrl(u.gorselUrl);
  const [sekme, setSekme] = useState<"bilgi" | "araclar" | "yorumlar">("bilgi");
  const [arac, setArac] = useState<AracId | null>(null);
  const [adDuzen, setAdDuzen] = useState(false);
  const [adTaslak, setAdTaslak] = useState(ad);
  const [hazir, setHazir] = useState(false);
  const [boyut, setBoyut] = useState<{ w: number; h: number; sure: number } | null>(null);
  const [an, setAn] = useState(0);
  const [isleniyor, setIsleniyor] = useState<string | null>(null);
  const [renk, setRenk] = useState<Renk>(RENK_SIFIR);
  const [kadraj, setKadraj] = useState<Kadraj>({ oran: "9:16", mod: "kirp", x: 0.5, y: 0.5, yakin: 1 });
  const [islemOran, setIslemOran] = useState<number | null>(null);
  const atolyeIsle = async () => {
    if (!atolye || !src || islemOran !== null) return;
    const islem: AtolyeIslem = arac === "renk" ? { tur: "renk", renk } : { tur: "kadraj", kadraj };
    setIslemOran(0);
    try { const s = await klipIsle(src, islem.tur === "renk" ? { renk } : { kadraj }, setIslemOran); await atolye.onKaydet(s, islem); setArac(null); setRenk(RENK_SIFIR); setSekme("bilgi"); }
    catch (e) { atolyeHata(e); }
    finally { setIslemOran(null); }
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  // Video değişince durum sıfırlanır (başka videoya taşınmasın).
  useEffect(() => { setHazir(false); setBoyut(null); setAn(0); setArac(null); setAdDuzen(false); }, [src]);
  useEffect(() => { setAdTaslak(ad); }, [ad]);

  // Klavye: ← → gezin, boşluk oynat/duraklat (yazı alanı ve oynatıcı dışındayken), Esc üst katmandan kapanır.
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (ustKatmanAcik) return;
      if (e.key === "Escape") { e.preventDefault(); if (islemOran !== null) return; if (arac) setArac(null); else onKapat(); return; }
      const h = e.target as HTMLElement;
      // Yazı alanlarında ve oynatıcının kendi denetimlerinde (oklar ileri-geri sarar) kısayol yok.
      if (/INPUT|TEXTAREA|SELECT|VIDEO/.test(h.tagName) || h.isContentEditable) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); onGez(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); onGez(1); }
      // Boşluk bir düğmenin üstündeyken o düğmeye basar; yalnız boştayken oynat/duraklat.
      if (e.key === " " && h.tagName !== "BUTTON") {
        e.preventDefault();
        const v = videoRef.current; if (!v) return;
        if (v.paused) void v.play().catch(() => {}); else v.pause();
      }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onGez, onKapat, arac, ustKatmanAcik, islemOran]);

  const tamEkran = () => {
    const el = kutuRef.current;
    if (!el) return;
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    (el.requestFullscreen?.() ?? Promise.reject()).catch(() => toast.error("Tam ekran açılamadı", { description: "Tarayıcın tam ekrana izin vermedi. F11 ile tarayıcının tam ekranını deneyebilirsin." }));
  };
  const adKaydet = () => { setAdDuzen(false); const y = adTaslak.trim(); if (y && y !== ad) onAdKaydet(y); else setAdTaslak(ad); };

  /** Oynatıcıdaki anlık kare — oynuyorsa önce duraklatılır ki kullanıcı hangi kareyi aldığını görsün. */
  const anlikKare = (tur: "image/webp" | "image/png" = "image/webp") => {
    const v = videoRef.current;
    if (!v || !hazir) { toast.error("Video henüz yüklenmedi", { description: "Oynatıcı hazır olunca kare alabilirsin. Birkaç saniye bekleyip yeniden dene." }); return null; }
    v.pause();
    try { return kareCiz(v, tur); }
    catch { toast.error("Videonun karesi alınamadı", { description: "Video başka bir sunucudan geliyor ve tarayıcı kare okumaya izin vermiyor. Videoyu indirip yeniden yükleyebilirsin." }); return null; }
  };

  const KLIP_ARACLARI: { id: string; ad: string; aciklama: string; ikon: typeof Film; kredi: string; fn: () => void }[] = [
    { id: "uzat", ad: "Videoyu uzat", aciklama: "Son kareden devam eden yeni bir çekim", ikon: FastForward, kredi: uzatKredi ? String(uzatKredi) : "Sınırsız", fn: () => setArac("uzat") },
    ...(atolye ? [
      { id: "renk", ad: "Renk derecelendirme", aciklama: "Hazır görünüm ya da yedi ayarla renk ver", ikon: Palette, kredi: "Ücretsiz", fn: () => setArac("renk") },
      { id: "kadraj", ad: "Yeniden kadrajla", aciklama: "Dikey, kare ya da sinemaskop orana taşı", ikon: Crop, kredi: "Ücretsiz", fn: () => setArac("kadraj") },
    ] : []),
  ];
  const ARACLAR: typeof KLIP_ARACLARI = [
    { id: "devam", ad: "Bu kareden yeni video", aciklama: "Anlık kare başlangıç karesi olur", ikon: ImagePlus, kredi: "Ücretsiz", fn: () => { const k = anlikKare(); if (k) onKareBaslangic(k); } },
    ...(onKareDuzenle ? [{ id: "duzenle", ad: "Kareyi düzenle, yeniden çek", aciklama: "Bölgeyi değiştir, sonra bu kareden yeni çekim", ikon: Brush, kredi: "Ücretsiz", fn: () => { const k = anlikKare(); if (k) onKareDuzenle(k, videoRef.current?.currentTime ?? 0); } }] : []),
    { id: "kaydet", ad: "Kareyi görsel olarak kaydet", aciklama: "Anlık kare Üretimlerim'e görsel olarak eklenir", ikon: Camera, kredi: "Ücretsiz", fn: () => { const k = anlikKare(); if (k) onKareKaydet(k, videoRef.current?.currentTime ?? 0); } },
    { id: "indir", ad: "Kareyi indir", aciklama: "Anlık kareyi PNG olarak indir", ikon: ImageDown, kredi: "Ücretsiz", fn: () => {
      const k = anlikKare("image/png"); if (!k) return;
      const a = document.createElement("a"); a.href = k; a.download = `${ad} - kare ${sureYaz(videoRef.current?.currentTime ?? 0).replace(/[:,]/g, "-")}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Kare indiriliyor", { description: "PNG dosyası indirilenler klasörüne düşer." });
    } },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex bg-black/85 backdrop-blur-sm max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-modal="true" aria-label={ad} onClick={onKapat}>
      {/* ── Sahne ── */}
      <div ref={kutuRef} className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-black/40 p-8 max-md:h-[50dvh] max-md:flex-none max-md:px-3 max-md:pb-3 max-md:pt-16" onClick={(e) => e.stopPropagation()}>
        {poster && <div key={"b-" + poster} className="pointer-events-none absolute inset-0 scale-125" style={{ backgroundImage: `url("${poster}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(60px) saturate(1.4) brightness(0.5)" }} />}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />

        <button onClick={onKapat} className="glass-ikon absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white" aria-label="Kapat (Esc)"><X className="h-5 w-5" /></button>
        {sira && sira.n > 1 && (
          <span className="glass-cip absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] tabular-nums text-white/85">{sira.i + 1} / {sira.n}</span>
        )}
        {sira && sira.i > 0 && (
          <button onClick={() => onGez(-1)} className="hf-btn glass-ikon absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white" aria-label="Önceki video (sol ok tuşu)"><ChevronLeft className="h-6 w-6" /></button>
        )}
        {sira && sira.i < sira.n - 1 && (
          <button onClick={() => onGez(1)} className="hf-btn glass-ikon absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white" aria-label="Sonraki video (sağ ok tuşu)"><ChevronRight className="h-6 w-6" /></button>
        )}

        <div className="relative z-[5] flex max-h-full max-w-full items-center justify-center">
          {src ? (
            <>
              {!hazir && <Loader2 className="absolute h-7 w-7 animate-spin text-white/70" />}
              <motion.video
                ref={videoRef} key={src} src={src} poster={poster}
                style={{ filter: arac === "renk" && !renkBos(renk) ? renkFiltre(renk) : undefined }}
                autoPlay muted loop playsInline controls preload="auto"
                initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: hazir ? 1 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
                onLoadedMetadata={(e) => setBoyut({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, sure: e.currentTarget.duration })}
                onLoadedData={() => setHazir(true)}
                onTimeUpdate={(e) => setAn(e.currentTarget.currentTime)}
                onError={() => { setHazir(true); toast.error("Video oynatılamadı", { description: "Dosyaya ulaşılamıyor. İndirmeyi deneyebilirsin." }); }}
                className="block max-h-[calc(100vh-128px)] max-w-full rounded-xl bg-black object-contain max-md:max-h-[calc(50dvh-76px)]"
                aria-label={ad}
              />
              {hazir && arac === "renk" && <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"><RenkKatmani r={renk} /></span>}
              {hazir && arac === "kadraj" && boyut && <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"><KadrajKatmani k={kadraj} sw={boyut.w} sh={boyut.h} /></span>}
            </>
          ) : poster && !poster.startsWith("linear-gradient") ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt={ad} className="block max-h-[calc(100dvh-120px)] max-w-full object-contain" />
              {(u.meta?.hamIstem as string | undefined) && (
                <p className="absolute inset-x-4 bottom-4 rounded-[14px] bg-black/55 px-3.5 py-2.5 text-center text-[14px] font-medium leading-snug text-white backdrop-blur-xl">{String(u.meta?.hamIstem).replace(/\[[^\]]*\]\s*/g, "")}</p>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-[min(720px,60vw)] flex-col items-center justify-center gap-2 rounded-xl bg-black/50 text-center">
              <Film className="h-7 w-7 text-white/50" />
              <p className="text-[14px] font-medium text-white/80">Bu üretimin video dosyası yok</p>
              <p className="max-w-xs text-[12.5px] text-white/50">Aynı ayarlarla yeniden üretebilirsin.</p>
            </div>
          )}
        </div>

        {src && <button onClick={tamEkran} className="glass-ikon absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white" aria-label="Tam ekran"><Maximize2 className="h-5 w-5" /></button>}
      </div>

      {/* ── Sağ panel ── */}
      <motion.aside initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onClick={(e) => e.stopPropagation()} style={yanBoy.stil} className="flex relative w-[var(--yan-en)] shrink-0 flex-col border-l border-white/10 bg-yuzey max-md:min-h-[50dvh] max-md:w-full max-md:border-l-0 max-md:border-t">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <div className="min-w-0 flex-1">
            {adDuzen ? (
              <input autoFocus value={adTaslak} maxLength={60} onChange={(e) => setAdTaslak(e.target.value)} onBlur={adKaydet}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adKaydet(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAdTaslak(ad); setAdDuzen(false); } }}
                aria-label="Video adı" className="w-full rounded-lg bg-white/8 px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-white/30" />
            ) : (
              <button onClick={() => setAdDuzen(true)} className="group/ad flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-white/6" title="Adı düzenle (indirme dosya adı olur)">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">{ad}</span>
                <Pencil className="h-3 w-3 shrink-0 text-metin-3 group-hover/ad:text-metin" />
              </button>
            )}
            <p className="px-1 text-[11.5px] leading-snug text-metin-3">{altBaslik}{boyut ? ` · ${boyut.w}×${boyut.h} · ${boyut.sure.toFixed(1).replace(".", ",")} sn` : ""}</p>
          </div>
          <button onClick={onKapat} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {arac === "renk" ? (
            <RenkPaneli key="renk" r={renk} setR={setRenk} poster={poster} oran={islemOran} onUygula={() => void atolyeIsle()} onGeri={() => { if (islemOran === null) setArac(null); }} />
          ) : arac === "kadraj" ? (
            <KadrajPaneli key="kadraj" k={kadraj} setK={setKadraj} kaynakOran={boyut ? boyut.w / boyut.h : undefined} videoRef={videoRef} oran={islemOran} onUygula={() => void atolyeIsle()} onGeri={() => { if (islemOran === null) setArac(null); }} />
          ) : arac === "uzat" ? (
            <UzatPaneli key="uzat" src={src} u={u} kredi={uzatKredi} krediler={krediler} onGeri={() => setArac(null)}
              isleniyor={isleniyor === "uzat"} setIsleniyor={(v) => setIsleniyor(v ? "uzat" : null)}
              onUzat={(kare, istem) => { if (onUzat(kare, istem)) setArac(null); }} />
          ) : (
            <motion.div key="ana" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col">
              <div role="tablist" className="flex gap-1.5 border-b border-white/8 px-2.5 py-2.5">
                {([["bilgi", "Bilgi", Info, 0], ["araclar", "Araçlar", Wand2, 0], ["yorumlar", "Yorumlar", MessageCircle, yorumSayisi]] as const).map(([id, a, I, n]) => (
                  <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
                    className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium", sekme === id ? "bg-white text-[#0a0a0b]" : "bg-white/[0.05] text-metin-2 hover:bg-white/[0.09] hover:text-metin")}>
                    <I className="h-3.5 w-3.5" />{a}{n > 0 && <span className="tabular-nums text-metin-3">{n}</span>}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                {sekme === "bilgi" && (
                  <VideoBilgi u={u} klip={boyut} kaynak={kaynak} onAyarlariYukle={onAyarlariYukle} onYenidenUret={onYenidenUret}
                    onIndir={onIndir} onBegen={onBegen} onSil={onSil} ekBilgi={ekBilgi} />
                )}
                {sekme === "araclar" && (
                  <div className="space-y-2.5 p-3">
                    {!src && <p className="rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.07]">Bu üretimin video dosyası olmadığı için araçlar kullanılamıyor.</p>}
                    {([["Klip araçları", KLIP_ARACLARI, null], ["Kare araçları", ARACLAR, sureYaz(an)]] as const).map(([baslik, liste, sag]) => (
                    <section key={baslik} className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="flex-1 text-[13px] font-semibold text-metin">{baslik}</span>{sag && <span className="text-[11.5px] tabular-nums text-metin-3" title="Kare araçları oynatıcıdaki anı kullanır">Şu an {sag}</span>}</div>
                      <div className="p-1">
                    {liste.map((a) => (
                      <button key={a.id} onClick={a.fn} disabled={!src}
                        className="group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-white/6 disabled:pointer-events-none disabled:opacity-40">
                        <span className="glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"><a.ikon className="h-[17px] w-[17px] text-metin-2 group-hover:text-metin" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium text-metin">{a.ad}</span>
                          <span className="block text-[12px] leading-snug text-metin-3">{a.aciklama}</span>
                        </span>
                        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums", a.kredi === "Ücretsiz" || a.kredi === "Sınırsız" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/6 text-metin-2")}>
                          {a.kredi === "Ücretsiz" || a.kredi === "Sınırsız" ? a.kredi : <span className="flex items-center gap-0.5"><KrediYildiz className="h-3 w-3" />{a.kredi}</span>}
                        </span>
                      </button>
                    ))}
                      </div>
                    </section>
                    ))}
                  </div>
                )}
                {sekme === "yorumlar" && yorumlar}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  );
}

/* ── Uzatma paneli: son kare yakalanır, istem düzenlenir, yeni çekim başlar ── */
function UzatPaneli({ src, u, kredi, krediler, onGeri, onUzat, isleniyor, setIsleniyor }: {
  src: string; u: Uretim; kredi: number; krediler: number; onGeri: () => void;
  onUzat: (kare: string, istem: string) => void; isleniyor: boolean; setIsleniyor: (v: boolean) => void;
}) {
  const [kare, setKare] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  const [istem, setIstem] = useState(((u.meta?.hamIstem as string | undefined) ?? u.prompt ?? "").trim());
  useEffect(() => {
    let iptal = false;
    setKare(null); setHata(false);
    kareYakala(src, "son").then((k) => { if (!iptal) setKare(k); }).catch(() => { if (!iptal) setHata(true); });
    return () => { iptal = true; };
  }, [src]);
  const yetersiz = kredi > krediler;
  const hazir = !!kare && istem.trim().length >= 2 && !yetersiz && !isleniyor;
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
        <button onClick={onGeri} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Araçlara dön"><ArrowLeft className="h-4 w-4" /></button>
        <span className="text-[14px] font-semibold text-metin">Videoyu uzat</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
        <BilgiKart baslik="Başlangıç karesi" sag={<span className="text-[11.5px] text-metin-3">Videonun son karesi</span>}>
          <div className="p-2">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[10px] bg-black/50">
              {kare ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kare} alt="Son kare" className="h-full w-full object-contain" />
              ) : hata ? (
                <p className="px-4 text-center text-[12.5px] text-metin-2">Son kare alınamadı. Video başka bir sunucudan geliyorsa tarayıcı kare okumaya izin vermez.</p>
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-metin-3" />
              )}
            </div>
          </div>
        </BilgiKart>
        <BilgiKart baslik="Devamında ne olsun?">
          <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={4} maxLength={1500} aria-label="Devamında ne olsun?"
            className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-metin outline-none placeholder:text-metin-3"
            placeholder="Örnek: kamera yavaşça geri çekilir, karakter ufka doğru yürür" />
        </BilgiKart>
        <BilgiKart baslik="Yeni çekim">
          <div className="space-y-2 px-3 py-2.5 text-[13px]">
            <div className="flex items-center justify-between"><span className="text-metin-3">Model</span><span className="flex items-center gap-1.5 font-medium text-metin"><ModelLogo ad={u.model} boyut={14} />{u.model}</span></div>
            {u.meta?.sure && <div className="flex items-center justify-between"><span className="text-metin-3">Süre</span><span className="font-medium text-metin">{u.meta.sure.replace(/(\d)\s*sn$/, "$1 sn")}</span></div>}
            {u.meta?.oran && <div className="flex items-center justify-between"><span className="text-metin-3">Oran</span><span className="font-medium text-metin">{u.meta.oran}</span></div>}
          </div>
          <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] leading-snug text-metin-3">Yeni çekim ayrı bir video olarak eklenir ve bu videoya bağlı görünür.</p>
        </BilgiKart>
      </div>
      <div className="shrink-0 border-t border-white/8 p-3">
        <button onClick={() => { if (!kare) return; setIsleniyor(true); onUzat(kare, istem.trim()); setIsleniyor(false); }} disabled={!hazir}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.98] disabled:opacity-50">
          {yetersiz ? "Yetersiz kredi" : <>Uzat <KrediYildiz className="h-4 w-4" /> {kredi || "Sınırsız"}</>}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Bilgi sekmesi — yalnız kayıttaki GERÇEK bilgi ── */
function VideoBilgi({ u, klip, kaynak, onAyarlariYukle, onYenidenUret, onIndir, onBegen, onSil, ekBilgi }: {
  u: Uretim; klip: { w: number; h: number; sure: number } | null; ekBilgi?: ReactNode;
  kaynak?: { poster?: string; ad: string; ac: () => void };
  onAyarlariYukle: () => void; onYenidenUret: () => void; onIndir: () => void; onBegen: () => void; onSil: () => void;
}) {
  const [genis, setGenis] = useState(false);
  const m = u.meta;
  const istem = ((m?.hamIstem as string | undefined) ?? u.prompt ?? "").trim();
  const kisa = istem.length > 160 ? istem.slice(0, 160) + "…" : istem;
  const demo = u.gercek === false;
  const tarih = new Date(u.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const DI: Record<string, typeof Info> = { "Kamera hareketi": Move, "Süre": Clock, "Kalite": Gem, "Ses": Volume2, "Çok çekimli": Layers, "Bit hızı": Gauge, "Boyut": FileVideo, "Kredi": Coins, "Oluşturma": CalendarClock };
  const satirlar: [string, string][] = [
    ...(m?.hareket && m.hareket !== "GENEL" ? [["Kamera hareketi", hareketAdi(m.hareket)] as [string, string]] : []),
    ...(klip ? [["Süre", `${klip.sure.toFixed(1).replace(".", ",").replace(",0", "")} sn`] as [string, string]] : m?.sure ? [["Süre", m.sure.replace(/(\d)\s*sn$/, "$1 sn")] as [string, string]] : []),
    ...(m?.oran ? [["Oran", m.oran] as [string, string]] : []),
    ...(m?.cozunurluk ? [["Kalite", m.cozunurluk] as [string, string]] : []),
    ...(m?.ses ? [["Ses", m.ses] as [string, string]] : []),
    ...(m?.cokCekim ? [["Çok çekimli", "Açık"] as [string, string]] : []),
    ...(m?.bitHizi ? [["Bit hızı", String(m.bitHizi)] as [string, string]] : []),
    ...(klip ? [["Boyut", `${klip.w}×${klip.h}`] as [string, string]] : []),
    ["Kredi", u.kredi ? String(u.kredi) : u.gercek === false ? "Düşmedi" : u.meta?.sinirsiz ? "Sınırsız erişim" : "Ücretsiz"],
    ["Oluşturma", new Date(u.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
  ];
  const detayIkon = (k: string, v: string) => {
    const kutu = "flex h-5 w-5 shrink-0 items-center justify-center text-metin-2";
    if (k === "Oran") {
      const [a, b] = v.split(":").map(Number);
      const en = a && b ? (a >= b ? 14 : Math.max(6, Math.round((14 * a) / b))) : 12;
      const boy = a && b ? (b >= a ? 14 : Math.max(6, Math.round((14 * b) / a))) : 12;
      return <span className={kutu}><span className="rounded-[3px]" style={{ width: en, height: boy, border: "1.5px solid rgba(255,255,255,0.8)" }} /></span>;
    }
    const I = DI[k] ?? Info;
    return <span className={kutu}><I className="h-3.5 w-3.5" /></span>;
  };
  const kareler = [
    m?.gorselUrl ? { et: "Başlangıç", url: m.gorselUrl } : null,
    m?.bitisKareUrl ? { et: "Bitiş", url: m.bitisKareUrl } : null,
  ].filter(Boolean) as { et: string; url: string }[];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
        <BilgiKart baslik="İstem" sag={
          <span className="flex items-center gap-0.5">
            <button onClick={onAyarlariYukle} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin"><Wand2 className="h-3 w-3" />Bu ayarlarla üret</button>
            {istem && <button onClick={() => { void kopyala(istem, "İstem kopyalandı"); }} aria-label="İstemi kopyala" className="flex h-6 w-6 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin"><Copy className="h-3 w-3" /></button>}
          </span>}>
          <div className="px-3 py-2.5">
            <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-metin-2">{istem ? (genis ? istem : kisa) : <span className="text-metin-3">İstem yazılmadan, yalnız başlangıç karesi ve hareketle üretildi.</span>}</p>
            {istem.length > 160 && (
              <button onClick={() => setGenis((v) => !v)} className="mt-2 flex items-center gap-1 text-[12px] font-medium text-metin-2 hover:text-metin">
                {genis ? "Daha az göster" : "Tümünü gör"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", genis && "rotate-180")} />
              </button>
            )}
          </div>
        </BilgiKart>

        {kareler.length > 0 && (
          <BilgiKart baslik={kareler.length === 2 ? "Başlangıç ve bitiş karesi" : "Başlangıç karesi"}>
            <div className="flex gap-2 p-2">
              {kareler.map((k) => (
                <span key={k.et} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[12px] p-1.5 pr-2.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.url} alt={`${k.et} karesi`} className="h-14 w-14 shrink-0 rounded-[9px] object-cover object-top" />
                  <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold text-metin">{k.et}</span><span className="block truncate text-[11.5px] text-metin-3">Videonun {k.et === "Başlangıç" ? "ilk" : "son"} karesi</span></span>
                </span>
              ))}
            </div>
          </BilgiKart>
        )}

        {ekBilgi}
        {kaynak && !ekBilgi && (
          <button onClick={kaynak.ac} className="flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]" style={{ background: "rgba(255,255,255,0.025)" }}>
            {kaynak.poster
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={kaynak.poster} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
              : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/6"><Film className="h-4 w-4 text-metin-3" /></span>}
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-metin-2">Uzatılan video</span>
              <span className="block text-[13px] leading-snug text-metin">{kaynak.ad}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-metin-3" />
          </button>
        )}

        <BilgiKart baslik="Ayrıntılar">
          <dl className="divide-y divide-white/[0.05]">
            <div className="flex items-center gap-3 px-3.5 py-3">
              <dt className="flex min-w-0 flex-1 items-center gap-2.5 text-[13px] text-metin-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center"><ModelLogo ad={u.model} boyut={16} /></span>Model</dt>
              <dd className="min-w-0 truncate text-right text-[13px] font-medium text-metin">{u.model}</dd>
            </div>
            {satirlar.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 px-3.5 py-3">
                <dt className="flex min-w-0 flex-1 items-center gap-2.5 text-[13px] text-metin-3">{detayIkon(k, v)}{k}</dt>
                <dd className="min-w-0 truncate text-right text-[13px] font-medium tabular-nums text-metin">{v}</dd>
              </div>
            ))}
          </dl>
        </BilgiKart>
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/[0.07] bg-[#141517] p-3">
        <button onClick={onYenidenUret} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.98]">
          <RefreshCw className="h-4 w-4" /> Yeniden üret
        </button>
        <div className="flex items-center gap-2">
          {u.videoUrl || u.gorselUrl ? (
            <div className="min-w-0 flex-1 [&_span]:flex [&_span]:w-full">
              <IndirDugmesi u={u} side="top" yerlesim="ust-sol" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13.5px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-[0.98]">
                <Download className="h-3.5 w-3.5" /> İndir
              </IndirDugmesi>
            </div>
          ) : (
            <button onClick={onIndir} disabled className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13.5px] font-medium text-metin opacity-40">
              <Download className="h-3.5 w-3.5" /> İndir
            </button>
          )}
          <Tooltip label="Klasöre taşı" side="top"><KlasoreTasiDugmesi uretimIdler={[u.id]} etiketSinif="sr-only" yerlesim="ust-sag" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin-2 transition-colors hover:bg-white/[0.13] hover:text-metin" /></Tooltip>
          <Tooltip label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="top"><button onClick={onBegen} aria-label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={!!u.favori}
            className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] transition-colors hover:bg-white/[0.13]", u.favori ? "text-aksan" : "text-metin-2 hover:text-aksan")}>
            <Star className={cn("h-4 w-4", u.favori && "fill-aksan text-aksan")} />
          </button></Tooltip>
          <Tooltip label="Sil" side="top"><button onClick={onSil} aria-label="Sil" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin-2 transition-colors hover:bg-rose-500/15 hover:text-rose-400">
            <Trash2 className="h-4 w-4" />
          </button></Tooltip>
        </div>
      </div>
    </div>
  );
}

/** Bilgi sekmesinde başlık şeritli kart. */
function BilgiKart({ baslik, sag, children }: { baslik: ReactNode; sag?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </section>
  );
}
