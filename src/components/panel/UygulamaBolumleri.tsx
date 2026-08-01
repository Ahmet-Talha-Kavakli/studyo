"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown, ChevronLeft, ChevronRight, Star, Infinity as Sonsuz,
  Video, CircleDot, CloudDownload, Sparkles,
} from "lucide-react";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";

/* ============================================================
   UYGULAMA DETAY — PAZARLAMA BÖLÜMLERİ.
   Referans: referanslar/apps (face-swap, transitions, meme-generator…)
   Bu bölümler TÜM uygulama sayfalarında aynı iskelette tekrar eder;
   yalnızca metinler uygulamaya göre değişir.
   ============================================================ */

/* ── "3 ADIMDA …" — 3 sütun ── */
export function NasilYapilir({
  baslik, adimlar, tohum,
}: {
  baslik: string;
  adimlar: { baslik: string; metin: string; etiket?: string; alt?: string }[];
  tohum: string;
}) {
  return (
    <section className="mt-24">
      <h2 className="text-[30px] font-extrabold uppercase tracking-[-0.015em] sm:text-[38px]">{baslik}</h2>
      <div className="mt-10 grid gap-7 md:grid-cols-3">
        {adimlar.map((a, i) => {
          const arka = onizlemeArka(`${tohum}-adim-${i}`, "gorsel");
          const url = saltUrl(arka);
          return (
            <div key={a.baslik}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#2a2a2c]">
                <span className="absolute inset-0" style={{ background: arka }} />
                {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                {a.etiket && (
                  <span className="absolute inset-x-4 bottom-4 rounded-xl bg-black/65 p-3 backdrop-blur-sm">
                    <span className="block text-[13px] font-bold uppercase text-white">{a.etiket}</span>
                    {a.alt && <span className="mt-0.5 block text-[12.5px] text-white/60">{a.alt}</span>}
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-[19px] font-extrabold uppercase tracking-tight text-white">{a.baslik}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-[#9e9e9e]">{a.metin}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 4 sütunlu özellik ızgarası ── */
export function OzellikIzgarasi({
  baslik, vurgu, altMetin, kartlar, butonEtiket, onTikla,
}: {
  baslik: string; vurgu?: string; altMetin: string;
  kartlar: { ikon: "sonsuz" | "video" | "hiz" | "indir"; baslik: string; metin: string }[];
  butonEtiket?: string; onTikla?: () => void;
}) {
  const IKON = { sonsuz: Sonsuz, video: Video, hiz: CircleDot, indir: CloudDownload };
  return (
    <section className="mt-24">
      <h2 className="max-w-[900px] text-[30px] font-extrabold uppercase leading-tight tracking-[-0.015em] sm:text-[38px]">
        {baslik}{" "}
        {vurgu && <span style={{ color: "var(--sn-lime,#d3f04a)" }}>{vurgu}</span>}
      </h2>
      <p className="mt-4 max-w-[820px] text-[16px] leading-relaxed text-[#9e9e9e]">{altMetin}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kartlar.map((k) => {
          const I = IKON[k.ikon];
          return (
            <div key={k.baslik} className="rounded-2xl border border-[#2a2a2c] bg-[#111113] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06]"
                style={{ color: "var(--sn-lime,#d3f04a)" }}>
                <I className="h-[21px] w-[21px]" />
              </span>
              <h3 className="mt-5 text-[17px] font-bold text-white">{k.baslik}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#9e9e9e]">{k.metin}</p>
            </div>
          );
        })}
      </div>

      {butonEtiket && (
        <div className="mt-10 flex justify-center">
          <button onClick={onTikla}
            className="rounded-full bg-white px-7 py-3 text-[15px] font-bold text-black transition-all hover:brightness-95">
            {butonEtiket}
          </button>
        </div>
      )}
    </section>
  );
}

/* ── Masonry vitrin galerisi ── */
export function VitrinGalerisi({
  baslik, altMetin, butonEtiket, onTikla, tohum, adet = 8,
}: {
  baslik: string; altMetin: string; butonEtiket?: string; onTikla?: () => void;
  tohum: string; adet?: number;
}) {
  return (
    <section className="mt-24 text-center">
      <h2 className="mx-auto max-w-[900px] text-[30px] font-extrabold uppercase leading-tight tracking-[-0.015em] sm:text-[38px]">
        {baslik}
      </h2>
      <p className="mx-auto mt-4 max-w-[760px] text-[16px] leading-relaxed text-[#9e9e9e]">{altMetin}</p>
      {butonEtiket && (
        <button onClick={onTikla}
          className="mx-auto mt-7 flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-all hover:brightness-110"
          style={{ background: "var(--sn-lime,#d3f04a)", color: "#111" }}>
          <Sparkles className="h-4 w-4" /> {butonEtiket}
        </button>
      )}
      {/* asimetrik masonry */}
      <div className="mt-10" style={{ columnCount: 3, columnGap: "18px" }}>
        {Array.from({ length: adet }).map((_, i) => {
          const arka = onizlemeArka(`${tohum}-gal-${i}`, i % 3 === 0 ? "sinema" : "gorsel");
          const url = saltUrl(arka);
          const y = [220, 300, 260, 340, 240, 290, 320, 250][i % 8];
          return (
            <div key={i} className="mb-[18px] overflow-hidden rounded-xl"
              style={{ breakInside: "avoid", height: y }}>
              <span className="block h-full w-full" style={{ background: arka }}>
                {url && <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Before/After karşılaştırma slider'ı ── */
export function KarsilastirmaSlider({
  baslik, altMetin, tohum, model,
}: { baslik: string; altMetin: string; tohum: string; model: string }) {
  const [oran, setOran] = useState(50);
  const solArka = onizlemeArka(`${tohum}-once`, "gorsel");
  const sagArka = onizlemeArka(`${tohum}-sonra`, "sinema");
  const solUrl = saltUrl(solArka), sagUrl = saltUrl(sagArka);

  return (
    <section className="mt-24 text-center">
      <h2 className="text-[30px] font-extrabold uppercase tracking-[-0.015em] sm:text-[38px]">{baslik}</h2>
      <p className="mx-auto mt-4 max-w-[760px] text-[16px] leading-relaxed text-[#9e9e9e]">{altMetin}</p>

      <div className="relative mx-auto mt-9 aspect-[16/9] max-w-[980px] overflow-hidden rounded-2xl border-2 border-white/15">
        <span className="absolute inset-0" style={{ background: sagArka }} />
        {sagUrl && <img src={sagUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${oran}%` }}>
          <span className="absolute inset-0" style={{ background: solArka, width: "980px" }} />
          {solUrl && <img src={solUrl} alt="" className="absolute inset-0 h-full object-cover" style={{ width: 980 }} />}
        </span>
        {/* ayraç */}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${oran}%` }}>
          <span className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full bg-white text-black">
            <ChevronLeft className="h-3.5 w-3.5" /><ChevronRight className="h-3.5 w-3.5" />
          </span>
        </span>
        <input type="range" min={0} max={100} value={oran} onChange={(e) => setOran(Number(e.target.value))}
          aria-label="Karşılaştırma" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
        {/* sağ alt rozet */}
        <span className="pointer-events-none absolute bottom-3.5 right-3.5 rounded-full bg-black/55 px-3 py-1.5 text-[12.5px] text-white backdrop-blur-sm">
          {model} ile üretildi
        </span>
      </div>
    </section>
  );
}

/* ── Yorumlar — referansta metinler SABİT ── */
const YORUMLAR = [
  { ad: "Olivia Bennett", baslik: "Sonuçlar inanılmaz", metin: "Aylardır bunun için ajanslara para ödüyordum. Şimdi dakikalar içinde daha iyisini üretiyorum." },
  { ad: "Sophia Turner", baslik: "İş akışımı değiştirdi", metin: "Kampanya görsellerini bir günde değil, bir kahve molasında hazırlıyorum. Ekip inanamadı." },
  { ad: "Ethan Wright", baslik: "Tam olarak beklediğim gibi", metin: "Yüz tutarlılığı ve ışık eşleşmesi kusursuz. Elle düzeltme yapmama gerek kalmadı." },
];

export function Yorumlar() {
  return (
    <section className="mt-24">
      <span className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13px] text-white/70">
        İnsanlar seviyor
      </span>
      <h2 className="mt-5 max-w-[1000px] text-[30px] font-extrabold uppercase leading-tight tracking-[-0.015em] sm:text-[38px]">
        <span style={{ color: "var(--sn-lime,#d3f04a)" }}>25 MİLYON ÜRETİCİNİN</span> GÜVENDİĞİ PLATFORM
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {YORUMLAR.map((y) => (
          <div key={y.ad} className="rounded-2xl border border-[#2a2a2c] bg-[#111113] p-6">
            <span className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4" fill="var(--sn-lime,#d3f04a)"
                  style={{ color: "var(--sn-lime,#d3f04a)" }} />
              ))}
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-white">{y.baslik}</h3>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#9e9e9e]">{y.metin}</p>
            <span className="mt-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-[13px] font-semibold text-white">
                {y.ad.charAt(0)}
              </span>
              <span className="text-[14px] text-white/80">{y.ad}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Büyük kapanış CTA'sı — lime blur köşeler ── */
export function BuyukCTA({
  baslik, vurgu, altMetin, butonEtiket, onTikla,
}: { baslik: string; vurgu?: string; altMetin: string; butonEtiket: string; onTikla?: () => void }) {
  return (
    <section className="relative mt-24 overflow-hidden rounded-[28px] border border-[#2a2a2c] bg-[#0f0f11] px-8 py-16 text-center">
      <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-25 blur-[90px]"
        style={{ background: "var(--sn-lime,#d3f04a)" }} />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-25 blur-[90px]"
        style={{ background: "var(--sn-lime,#d3f04a)" }} />
      <h2 className="relative mx-auto max-w-[900px] text-[30px] font-extrabold uppercase leading-tight tracking-[-0.015em] sm:text-[40px]">
        {baslik} {vurgu && <span style={{ color: "var(--sn-lime,#d3f04a)" }}>{vurgu}</span>}
      </h2>
      <p className="relative mx-auto mt-4 max-w-[720px] text-[16px] leading-relaxed text-[#9e9e9e]">{altMetin}</p>
      <button onClick={onTikla}
        className="relative mx-auto mt-8 flex items-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-bold transition-all hover:brightness-110"
        style={{ background: "var(--sn-lime,#d3f04a)", color: "#111" }}>
        <Sparkles className="h-[17px] w-[17px]" /> {butonEtiket}
      </button>
    </section>
  );
}

/* ── SSS akordiyonu ── */
export function SSS({ sorular }: { sorular: { s: string; c: string }[] }) {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <section className="mt-24">
      <h2 className="text-[30px] font-extrabold uppercase tracking-[-0.015em] sm:text-[38px]">
        BAŞKA SORUN VAR MI?
      </h2>
      <p className="mt-3 text-[16px] text-[#9e9e9e]">En sık sorulan soruları yanıtladık</p>
      <div className="mt-8 max-w-[900px]">
        {sorular.map((q, i) => (
          <div key={q.s} className="border-b border-[#242426]">
            <button onClick={() => setAcik(acik === i ? null : i)}
              className="flex w-full items-center gap-4 py-5 text-left">
              <span className="flex-1 text-[17px] font-medium text-white">{q.s}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-white/50 transition-transform", acik === i && "rotate-180")} />
            </button>
            {acik === i && (
              <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden pb-5 text-[15.5px] leading-relaxed text-[#9e9e9e]">
                {q.c}
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── "DAHA FAZLA AI ÖZELLİĞİ KEŞFET" — pill bulutu (sabit) ── */
const PILLER = [
  "Sinema Stüdyosu", "Görsel Efektler", "Vayra Ruh", "Kling 2.1 Master", "Kamera Kontrolleri",
  "Viral", "Aksiyon hareketleri", "Ticari", "MiniMax Hailuo 02", "Topluluk", "Wan 2.2 Görsel",
  "Seedream 4.0", "Nano Banana", "Flux Kontext", "GPT Image", "Topaz", "Google Veo3",
  "Kling 2.5 Turbo", "Kling Avatar 2.0", "Wan 2.5", "Sora 2", "Sora 2 Hazır Ayarlar",
  "Banana Yerleşim", "Ürün Yerleşimi", "Görsel Düzenle", "Çoklu Referans", "Büyüt",
  "Asistanlar", "YouTube", "TikTok", "Instagram Reels",
];

export function OzellikBulutu() {
  return (
    <section className="mt-24">
      <h2 className="text-[30px] font-extrabold uppercase tracking-[-0.015em] sm:text-[38px]">
        DAHA FAZLA AI ÖZELLİĞİ KEŞFET
      </h2>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {PILLER.map((p, i) => (
          <span key={p}
            className={cn("rounded-full px-4 py-2 text-[14px] transition-colors",
              i % 5 === 0 ? "bg-[#1c1c1c] text-[var(--sn-lime,#d3f04a)]" : "bg-[#1c1c1c] text-[#9e9e9e] hover:text-white")}>
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
