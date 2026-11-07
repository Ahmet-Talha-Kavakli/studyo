"use client";

/**
 * Uzun video stüdyosunun ortak parçaları (2026-11-01, "1 · Stüdyo" prototipi):
 * sabit listeler, türlerin gerçek örnek medyası, kayan beyaz segment, açılır menü satırı ve oran simgesi.
 * Çip ve video karosu preset stüdyosunun onaylı bileşenleridir (Video stüdyosunun SEG dili).
 */

import { LayoutGroup, motion } from "framer-motion";
import { Briefcase, Clapperboard, Droplets, Heart, Lightbulb, Smile, Waves, VolumeX, Zap, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilmProje } from "@/store/useFilm";
import type { FilmTur } from "@/lib/filmMotor";

export { Cip, VideoKaro, KrediParlak, yay, ease } from "@/components/presetler/studyo/parcalar";

export const VH = (ad: string) => ({ video: `/gercek/video-hareket/${ad}.mp4`, poster: `/gercek/video-hareket/${ad}-poster.webp` });
const S = (ad: string) => `/gercek/sinema/${ad}.webp`;

/** Perde renkleri: yumuşak pastel tonlar (zaman çizgisinde blok, listede şerit). */
export const PERDE_RENK = ["#7dd3fc", "#c4b5fd", "#f9a8d4", "#fde68a", "#86efac", "#fdba74", "#93c5fd", "#fca5a5"];
export const perdeRengi = (i: number) => PERDE_RENK[i % PERDE_RENK.length];

/** Her türün gerçek örnek medyası: vitrinde oynayan klip ve plan karelerinin örnekleri. */
export const TUR_MEDYA: Record<FilmTur, { klip: string; kareler: string[]; sure: string }> = {
  kisa: { klip: "dutch-angle", sure: "5 perde, 1 ile 10 dk", kareler: [S("sh-city"), S("sh-street"), S("tur-Genel"), S("ps-superdollyin"), S("ps-cry"), S("sh-tension")] },
  belgesel: { klip: "handheld", sure: "Konu, tanık, sonuç", kareler: [S("cs-p1"), VH("handheld").poster, S("ps-snorricam"), S("ps-static"), S("tur-Dram"), S("sh-open")] },
  reklam: { klip: "orbit-left", sure: "Kanca, ürün, çağrı", kareler: [VH("orbit-left").poster, VH("commercial").poster, S("ps-car"), VH("push-to-glass").poster, VH("tilt-up").poster, VH("crane-up").poster] },
  klip: { klip: "low-shutter", sure: "Ritim ve görsel motif", kareler: [VH("k-pop").poster, S("ps-concert"), S("top-anime"), VH("low-shutter").poster, VH("viral-spin").poster, VH("whip-pan").poster] },
  egitim: { klip: "focus-pull", sure: "Bölüm bölüm ders", kareler: ["/gercek/explainer-video/ex-isometric.webp", "/gercek/explainer-video/ex-3dmix.webp", VH("focus-pull").poster, "/gercek/explainer-video/ex-whiteboard.webp", VH("dolly-in").poster, "/gercek/explainer-video/ex-papercraft.webp"] },
  hikaye: { klip: "drone-orbit", sure: "Rota boyunca hikâye", kareler: [S("sh-open"), S("cs-p1"), S("ps-train"), S("sh-dune"), S("top-gothic"), S("sh-hero")] },
};

export const FILM_MODELLER = [
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Tutarlı karakter, akıcı hareket", rozet: "Önerilen" },
  { deger: "Seedance 2.5", ad: "Seedance 2.5", alt: "Sesli, 30 sn'ye kadar, ilk ve son kare" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "4K'ya kadar, sinematik" },
  { deger: "Gemini Omni Flash", ad: "Gemini Omni Flash", alt: "Google, hızlı ve akıllı" },
  { deger: "Kling 3.0 Turbo", ad: "Kling 3.0 Turbo", alt: "Hızlı Kling, 1080p" },
  { deger: "Minimax Hailuo 2.3", ad: "Hailuo 2.3", alt: "Hızlı ve uygun", rozet: "Ekonomik" },
];
export const SURELER = [1, 3, 5, 10, 20, 30, 60];
export const TONLAR = [
  { deger: "sinematik", ad: "Sinematik", alt: "Etkileyici, görkemli" }, { deger: "samimi", ad: "Samimi", alt: "Sıcak, insani" },
  { deger: "gerilimli", ad: "Gerilimli", alt: "Karanlık, merak uyandıran" }, { deger: "neşeli", ad: "Neşeli", alt: "Hafif, enerjik" },
  { deger: "duygusal", ad: "Duygusal", alt: "Dokunaklı, yavaş" }, { deger: "bilgilendirici", ad: "Bilgilendirici", alt: "Net, öğretici" },
];
export const MUZIKLER: { deger: FilmProje["muzik"]; ad: string; alt: string }[] = [
  { deger: "duygusal", ad: "Duygusal", alt: "Yavaş, piyano" }, { deger: "sakin", ad: "Sakin", alt: "Ambiyans, hafif doku" },
  { deger: "kurumsal", ad: "Kurumsal", alt: "Orta tempo, temiz" }, { deger: "enerjik", ad: "Enerjik", alt: "Hızlı tempo, vuruşlu" }, { deger: "yok", ad: "Müziksiz", alt: "Yalnız çekim sesi" },
];
export const FORMATLAR: { deger: FilmProje["oran"]; ad: string; alt: string }[] = [
  { deger: "16:9", ad: "16:9", alt: "YouTube, sinema" }, { deger: "9:16", ad: "9:16", alt: "Dikey dizi, Reels" }, { deger: "1:1", ad: "1:1", alt: "Kare gönderi" },
];
export const ORNEKLER: { tur: FilmTur; ad: string; metin: string }[] = [
  { tur: "kisa", ad: "Yağmurlu gecede dedektif", metin: "Yağmurlu bir gecede emekli bir dedektif, son trenle şehre gelen yabancının eski bir davanın kayıp tanığı olduğunu fark eder." },
  { tur: "belgesel", ad: "Son çömlek ustası", metin: "Kapadokya'da son geleneksel çömlek ustasının bir günü ve zanaatin geleceği." },
  { tur: "reklam", ad: "Akıllı çalar saat reklamı", metin: "Sabahları zor uyananlar için ışıkla uyandıran akıllı çalar saatin lansman reklamı." },
  { tur: "hikaye", ad: "Ege kıyısında bisiklet", metin: "Ege kıyısında üç günlük bir bisiklet yolculuğu: köyler, deniz ve gün batımları." },
];

/** Ton ve müzik satırlarının simgeleri (menülerde düz metin satırı yok). */
export const TON_IKON: Record<string, React.ElementType> = { sinematik: Clapperboard, samimi: Heart, gerilimli: Moon, "neşeli": Smile, duygusal: Droplets, bilgilendirici: Lightbulb };
export const MUZIK_IKON: Record<string, React.ElementType> = { duygusal: Heart, sakin: Waves, kurumsal: Briefcase, enerjik: Zap, yok: VolumeX };
export function IkonKaro({ ikon: I }: { ikon: React.ElementType }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><I className="h-4 w-4" /></span>;
}
/** Açılır pencere başlığı (her menüde aynı). */
export function MenuBaslik({ children, alt }: { children: React.ReactNode; alt?: React.ReactNode }) {
  return <p className="flex items-baseline gap-1.5 px-2.5 pb-1.5 pt-1 text-[13px] font-semibold text-white">{children}{alt && <span className="font-normal text-white/45">{alt}</span>}</p>;
}

export const PANO = "rounded-[20px] border border-white/[0.09] bg-[#18181b] p-1.5";

/** Oran simgesi (SVG: kenarlıklı span bazı yerlerde soluk çıkıyordu). */
export function OranSimge({ o, boy = 16 }: { o: string; boy?: number }) {
  const [w, h] = o.split(":").map(Number); const k = boy / Math.max(w, h); const gw = w * k, gh = h * k;
  return <svg width={gw + 2} height={gh + 2} viewBox={`0 0 ${gw + 2} ${gh + 2}`} fill="none" aria-hidden className="shrink-0 text-white"><rect x={1} y={1} width={gw} height={gh} rx={3} stroke="currentColor" strokeWidth={1.6} /></svg>;
}

/** Açılır menü satırı: solda simge ya da görsel, ad + kısa açıklama, sağda ek bilgi ve seçim tiki. */
export function MenuSatiri({ secili, onClick, on, ad, alt, sag, rozet }: { secili: boolean; onClick: () => void; on?: React.ReactNode; ad: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; rozet?: string }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={secili} onClick={onClick}
      className={cn("flex w-full items-center gap-3 rounded-[14px] p-2 text-left ring-1 ring-inset transition-[background-color,box-shadow] hover:bg-white/[0.05]", secili ? "bg-white/[0.07] ring-white/60" : "ring-transparent")}>
      {on}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-white">{ad}{rozet && <span className="rounded-full bg-white/[0.1] px-1.5 py-px text-[10.5px] font-semibold text-white/80">{rozet}</span>}</span>
        {alt && <span className="mt-0.5 block truncate text-[12.5px] text-white/55">{alt}</span>}
      </span>
      {sag}
    </button>
  );
}

/** Kayan beyaz segment (onaylı stüdyo dili). */
export function Segment<T extends string>({ id, deger, set, secenekler, kucuk, className }: {
  id: string; deger: T; set: (v: T) => void; secenekler: { id: T; ad: React.ReactNode; ikon?: React.ElementType }[]; kucuk?: boolean; className?: string;
}) {
  return (
    <LayoutGroup id={id}>
      <div role="tablist" className={cn("flex items-center gap-0.5 rounded-full bg-white/[0.06] p-1", className)}>
        {secenekler.map((s) => {
          const a = s.id === deger;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={a} onClick={() => set(s.id)}
              className={cn("relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors active:scale-[0.97]", kucuk ? "h-7 px-3 text-[12.5px]" : "h-8 px-3.5 text-[13px]", a ? "text-black" : "text-white/60 hover:text-white")}>
              {a && <motion.span layoutId={`${id}-z`} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              {s.ikon && <s.ikon className="relative h-3.5 w-3.5" />}<span className="relative flex items-center gap-1.5">{s.ad}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** Simgeli seçim şeridi: simge üstte, ad altta; seçili karo beyaz kayar. Seçiliye yeniden basınca seçim kalkar (isteğe bağlı alanlar). */
export function SimgeSerit({ id, deger, set, secenekler }: { id: string; deger?: string; set: (v?: string) => void; secenekler: { id: string; ad: string; ikon: React.ElementType }[] }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className="grid gap-1 rounded-[14px] bg-white/[0.05] p-1" style={{ gridTemplateColumns: `repeat(${secenekler.length}, minmax(0, 1fr))` }}>
        {secenekler.map((s) => {
          const a = s.id === deger;
          return (
            <button key={s.id} type="button" role="radio" aria-checked={a} onClick={() => set(a ? undefined : s.id)}
              className={cn("relative flex h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-[10px] transition-colors active:scale-[0.96]", a ? "text-black" : "text-white/65 hover:bg-white/[0.05] hover:text-white")}>
              {a && <motion.span layoutId={`${id}-z`} className="absolute inset-0 rounded-[10px] bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <s.ikon className="relative h-4 w-4" />
              <span className="relative max-w-full truncate px-1 text-[11.5px] font-medium">{s.ad}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** Bölüm başlıklı kart (havada başlık yok). */
export function Kart({ baslik, alt, ikon: I, sag, children, className, govde, altSerit }: {
  baslik: React.ReactNode; alt?: React.ReactNode; ikon: React.ElementType; sag?: React.ReactNode; children: React.ReactNode; className?: string; govde?: string; altSerit?: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]", className)}>
      <header className="flex min-h-[62px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><I className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0"><h2 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-white">{baslik}</h2>{alt && <p className="line-clamp-2 text-[12.5px] leading-snug text-white/50">{alt}</p>}</span>
        {sag && <span className="ml-auto flex shrink-0 items-center gap-1.5">{sag}</span>}
      </header>
      <div className={cn("min-h-0 flex-1", govde)}>{children}</div>
      {altSerit && <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">{altSerit}</footer>}
    </section>
  );
}

export function goreli(t: number): string {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return "az önce"; if (d < 3600) return `${Math.floor(d / 60)} dk önce`; if (d < 86400) return `${Math.floor(d / 3600)} sa önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
export const zaman = (sn: number) => { const t = Math.round(sn), m = Math.floor(t / 60), r = t % 60; return `${m}:${String(r).padStart(2, "0")}`; };

/** Popover başındaki "Özel" kartı: listede olmayanı kendin tarif et. */
export function OzelGirdi({ deger, set, secili, ph, alt, uygula }: { deger: string; set: (v: string) => void; secili: boolean; ph: string; alt?: string; uygula: () => void }) {
  const hazir = deger.trim().length >= 3;
  return (
    <div className={cn("mb-2 rounded-[14px] p-2 ring-1 ring-inset transition-[background-color,box-shadow]", secili ? "bg-white/[0.07] ring-white/60" : "bg-white/[0.03] ring-white/[0.08]")}>
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-white/70"><Sparkles className="h-3 w-3" /></span>
        <span className="text-[12.5px] font-semibold text-white">Özel</span><span className="text-[11.5px] text-white/45">{alt ?? "Listede yoksa kendin tarif et"}</span>
      </div>
      <div className="flex gap-1.5">
        <input value={deger} onChange={(e) => set(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === "Enter" && hazir) { e.preventDefault(); uygula(); } }} placeholder={ph} aria-label="Özel tarif"
          className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.05] px-3.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/40" />
        <button onClick={uygula} disabled={!hazir} className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">{secili ? "Güncelle" : "Uygula"}</button>
      </div>
    </div>
  );
}

