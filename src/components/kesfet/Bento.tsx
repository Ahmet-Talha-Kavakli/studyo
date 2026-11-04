"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Film, Image as ImageIcon, Play, Type, AudioLines, FolderOpen } from "lucide-react";
import { BolumBaslik, Belir, GorunurVideo, Kap, butonSinif } from "./ortak";
import { AVATAR } from "./veri";
import { cn } from "@/lib/utils";

const G = "/gercek";

/**
 * "Basit başla, büyüdükçe ölçekle" — dört kart; her biri gerçek bir ekranın
 * küçük, canlı maketini taşır (kanvas düğümleri, kitaplık, ekip, preset).
 */
export function Bento() {
  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust="İş akışı"
          baslik={<>Basit başla.<br className="hidden sm:block" /> Büyüdükçe ölçekle.</>}
          alt="Tek bir araçtan eksiksiz bir prodüksiyon hattına kadar, kendi hızında ilerle."
          sag={<Link href="/panel/canvas" className={butonSinif("beyaz")}>Kanvası aç <ArrowRight className="h-4 w-4" /></Link>} />

        {/* Satır yükseklikleri sabit: kitaplık kartı (2 satır) ızgarayı uzatmasın */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[420px_340px]">
          <Belir className="lg:col-span-2"><KanvasKart /></Belir>
          <Belir className="lg:row-span-2" gecikme={0.05}><KitaplikKart /></Belir>
          <Belir gecikme={0.1}><EkipKart /></Belir>
          <Belir gecikme={0.15}><PresetKart /></Belir>
        </div>
      </Kap>
    </section>
  );
}

function KartBaslik({ baslik, ozet, koyu }: { baslik: string; ozet: string; koyu?: boolean }) {
  return (
    <div className="relative z-10 max-w-[380px]">
      <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{baslik}</h3>
      <p className={cn("mt-2 text-[14px] leading-relaxed", koyu ? "text-white/70" : "text-metin-2")}>{ozet}</p>
    </div>
  );
}

/* ── Kanvas: düğümler + akan bağlantılar ── */
function KanvasKart() {
  return (
    <Link href="/panel/canvas" className="group relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-[24px] border border-[#2a2852] bg-[#13122a] p-7">
      <div aria-hidden className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <KartBaslik baslik="Tüm süreç tek bir sonsuz kanvasta" ozet="Araçları düğümlerle zincirle, fikirleri dallandır, versiyonları karşılaştır ve ekibinle aynı anda çalış." />

      <div className="relative mt-6 flex-1">
        {/* Bağlantılar — düğüm konumlarıyla aynı yüzde koordinatlarında */}
        <svg className="absolute inset-0 hidden h-full w-full sm:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path d="M 22 30 C 32 30, 30 55, 40 55" className="kesfet-akis" stroke="var(--color-tur-gorsel)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
          <path d="M 58 55 C 66 55, 64 28, 72 28" className="kesfet-akis" stroke="var(--color-tur-video)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
          <path d="M 58 55 C 66 55, 64 78, 72 78" className="kesfet-akis" stroke="var(--color-tur-ses)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>

        <Dugum className="left-0 top-[10%] w-[22%] min-w-[130px]" ikon={Type} ad="İstem" renk="text-white/70">
          <p className="text-[11px] leading-snug text-white/60">Kapadokya&apos;da gün doğumu, sıcak balonlar, sinematik</p>
        </Dugum>
        {/* Dar ekranda orta düğüm gizlenir — üç düğüm üst üste binmeden sığar */}
        <Dugum className="left-[40%] top-[30%] hidden w-[18%] min-w-[120px] transition-transform duration-500 group-hover:-translate-y-1 sm:block" ikon={ImageIcon} ad="Görsel" renk="text-tur-gorsel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${G}/galeri/manzara3.webp`} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
        </Dugum>
        <Dugum className="right-0 top-[4%] w-[24%] min-w-[130px]" ikon={Film} ad="Video" renk="text-tur-video">
          <div className="relative overflow-hidden rounded-md">
            <GorunurVideo src={`${G}/video-hareket/drone-orbit.mp4`} className="aspect-video w-full object-cover" />
          </div>
        </Dugum>
        <Dugum className="right-0 top-[64%] w-[24%] min-w-[130px]" ikon={AudioLines} ad="Ses" renk="text-tur-ses">
          <div className="flex h-9 items-center gap-[3px]">
            {[5, 9, 14, 8, 18, 11, 6, 15, 20, 12, 7, 13, 17, 9, 5, 10, 14, 6].map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-tur-ses/80" style={{ height: h * 1.5 }} />
            ))}
          </div>
        </Dugum>

        {/* Ortak çalışma imleci */}
        <span className="absolute left-[30%] top-[72%] flex items-center gap-1 transition-transform duration-700 group-hover:translate-x-6">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M1 1 L13 6 L7 7.5 L5.5 13 Z" fill="#ffffff" /></svg>
          <span className="flex items-center gap-1 rounded-full bg-white py-0.5 pl-0.5 pr-2 text-[10.5px] font-semibold text-zemin"><img src={AVATAR.elif} alt="" className="h-4 w-4 rounded-full object-cover" />Elif</span>
        </span>
      </div>
    </Link>
  );
}

function Dugum({ className, ikon: Ikon, ad, renk, children }: { className?: string; ikon: typeof Type; ad: string; renk: string; children: React.ReactNode }) {
  return (
    <div className={cn("absolute rounded-xl border border-white/[0.1] bg-yuzey-2 p-2", className)}>
      <p className={cn("mb-1.5 flex items-center gap-1.5 text-[11px] font-medium", renk)}>
        <Ikon className="h-3 w-3" /> {ad}
      </p>
      {children}
    </div>
  );
}

/* ── Kitaplık: filtre çipleri + karışık varlık ızgarası ── */
const VARLIKLAR = [
  { tur: "gorsel", src: `${G}/proje-kesfet/kesfet-04.webp` },
  { tur: "video", src: `${G}/paz-video/gal-pazarlama-2.mp4`, poster: `${G}/panel/gal-pazarlama-2.webp` },
  { tur: "gorsel", src: `${G}/gorsel/gorsel-karakter-Aria.webp` },
  { tur: "ses", src: `${G}/arac/ses-ilham-dalga.webp` },
  { tur: "gorsel", src: `${G}/proje-kesfet/kesfet-03.webp` },
  { tur: "video", src: `${G}/video-hareket/slow-motion.mp4` },
  { tur: "gorsel", src: `${G}/galeri/sinematik4.webp` },
  { tur: "gorsel", src: `${G}/arac/3d-ilham-render.webp` },
] as const;

function KitaplikKart() {
  const [filtre, setFiltre] = useState<"tumu" | "gorsel" | "video" | "ses">("tumu");
  const liste = VARLIKLAR.filter((v) => filtre === "tumu" || v.tur === filtre);
  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[24px] lg:min-h-0 border border-white/[0.07] bg-yuzey p-7">
      <KartBaslik baslik="Her şey hazır, her şey düzenli" ozet="Ürettiğin her görsel, video ve ses kitaplığında. Ara, filtrele, projelere taşı." />
      <div className="mt-6 flex gap-1">
        {([["tumu", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"], ["ses", "Ses"]] as const).map(([id, ad]) => (
          <button key={id} onClick={() => setFiltre(id)}
            className={cn("rounded-full px-3 py-1 text-[12px] font-medium transition-colors", filtre === id ? "bg-white text-zemin" : "bg-white/[0.06] text-metin-2 hover:text-white")}>
            {ad}
          </button>
        ))}
      </div>
      {/* Satırlar kalan yüksekliği eşit paylaşır — filtre değişince kart boş kalmaz */}
      <div className="mt-4 grid min-h-[280px] flex-1 auto-rows-fr grid-cols-2 gap-2 lg:min-h-0">
        {liste.map((v) => (
          <div key={v.src} className="relative overflow-hidden rounded-xl bg-yuzey-2">
            {v.tur === "video"
              ? <GorunurVideo src={v.src} className="h-full w-full object-cover" />
              : /* eslint-disable-next-line @next/next/no-img-element */
                <img src={v.src} alt="" loading="lazy" className="h-full w-full object-cover" />}
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur">
              {v.tur === "video" ? <Play className="h-2.5 w-2.5" /> : v.tur === "ses" ? <AudioLines className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
              {v.tur === "video" ? "Video" : v.tur === "ses" ? "Ses" : "Görsel"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ekip: proje klasörleri + üye yığını ── */
function EkipKart() {
  return (
    <Link href="/panel/projeler" className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[24px] border border-[#1d4a4a] bg-[#0f2c2d] p-7">
      <KartBaslik koyu baslik="Tek yer, tüm ekip" ozet="Marka varlıklarını, üretimleri ve iş akışlarını projelerde topla. Ekibin birlikte çalışsın." />
      <div className="mt-auto flex items-end gap-3 pt-6">
        {[
          { ad: "Marka Kiti", src: `${G}/arac/fashion-noir.webp`, aci: "-rotate-3" },
          { ad: "Yaz Kampanyası", src: `${G}/galeri/manzara3.webp`, aci: "rotate-2" },
        ].map((k) => (
          <div key={k.ad} className={cn("w-1/2 rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-white/[0.08] transition-transform duration-500 group-hover:rotate-0", k.aci)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k.src} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <p className="flex items-center gap-1.5 px-1 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/80"><FolderOpen className="h-3 w-3" />{k.ad}</p>
          </div>
        ))}
      </div>
      <div className="absolute right-6 top-7 flex -space-x-2">
        {[AVATAR.elif, AVATAR.kaan, AVATAR.zeynep, AVATAR.mert].map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[#0f2c2d]" />
        ))}
      </div>
    </Link>
  );
}

/* ── Preset: tek tıkla uygulanan iş akışı ── */
function PresetKart() {
  return (
    <Link href="/panel/presetler" className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[24px] border border-white/[0.07] p-7">
      <GorunurVideo src={`${G}/preset-video/elevate.mp4`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-black/40" />
      <KartBaslik koyu baslik="Tek tıkla iş akışı" ozet="Karmaşık bir efekti preset olarak kaydet. Ekipteki herkes tek tıkla aynı sonucu alsın." />
      <span className="relative mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-zemin">
        <Play className="h-3.5 w-3.5 fill-current" /> Preseti uygula
      </span>
    </Link>
  );
}
