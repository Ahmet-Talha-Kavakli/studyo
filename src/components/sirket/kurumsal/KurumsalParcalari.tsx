"use client";

/**
 * /kurumsal — "B · Üretim hattı" (2026-10-29, HeyGen/Synthesia dili).
 *  Videolu başlık + güven hapları
 *  Brif, Üret, Onayla, Yayınla: kendi kendine ilerleyen hat; her aşamada o adımın canlı ürün görünümü ve kuralları
 *  Yönetici için üç kart (kredi havuzu, model izinleri, kimlik ve denetim), satın alma listesi, karşılaştırma, SSS
 * Örnek çalışma alanı ("Atlas Kozmetik") her görünümde "Örnek görünüm" diye etiketlenir.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, Download, FileText, Lock, MessageCircle, PenLine, Send, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const KURUMSAL_HERO = havuzSec("kurumsal", ["is", "sehir"]);

const yay = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

function Cip({ children, cam, className }: { children: React.ReactNode; cam?: boolean; className?: string }) {
  return (
    <span className={cn("flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium backdrop-blur-md",
      cam ? "bg-[#55d6fd]/20 text-[#d6f6ff] ring-1 ring-inset ring-[#55d6fd]/35" : "bg-black/55 text-white ring-1 ring-inset ring-white/15", className)}>{children}</span>
  );
}

/* ── Başlık ── */
export function HatBaslik() {
  return (
    <section className="relative isolate h-[600px] overflow-hidden rounded-[28px] ring-1 ring-white/[0.08] sm:h-[560px]">
      <video src={KURUMSAL_HERO.video} poster={KURUMSAL_HERO.poster} autoPlay muted loop playsInline
        className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,8,10,.94)_0%,rgba(8,8,10,.6)_55%,rgba(8,8,10,.15)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_55%,rgba(8,8,10,.85)_100%)]" />
      <div className="flex h-full max-w-[660px] flex-col justify-center p-6 sm:p-12">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
          className="text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[64px]">
          Ekibinin <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">yaratıcı üretim</span> hattı.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 max-w-md text-pretty text-[16px] leading-relaxed text-white/80">
          Tüm modeller tek güvenli çalışma alanında. Brif'ten yayına her adımda kurumunun kuralı var; hiçbir şey onaysız çıkmaz.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-7 flex flex-wrap gap-2.5">
          <a href="#gorusme" className="group flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
            Demo planla<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a href="#hat" className="flex h-11 items-center rounded-full bg-white/[0.12] px-5 text-[14.5px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition hover:bg-white/[0.2]">Nasıl çalışır</a>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="absolute inset-x-6 bottom-6 hidden flex-wrap gap-1.5 sm:inset-x-12 sm:flex">
        {["SAML SSO ve SCIM", "Verilerin eğitimde kullanılmaz", "AB · ABD · Asya-Pasifik veri bölgesi", "GDPR · KVKK uyumlu DPA"].map((t) => (
          <Cip key={t}><Lock className="h-3 w-3" />{t}</Cip>
        ))}
      </motion.div>
    </section>
  );
}

/* ── Aşama görünümleri (örnek çalışma alanı) ── */
function BrifGorunumu() {
  return (
    <div className="relative grid h-full gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-5">
      <div className="flex flex-col rounded-[18px] bg-white/[0.05] p-4 ring-1 ring-white/[0.08]">
        <p className="text-[12.5px] text-white/60">Marka kiti</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gradient-to-br from-amber-200 to-rose-300 text-[17px] font-bold text-black">A</span>
          <span><span className="block text-[15px] font-semibold text-white">Atlas Kozmetik</span><span className="text-[12.5px] text-white/60">Sıcak, sade, doğal ışık</span></span>
        </div>
        <div className="mt-4 flex gap-1.5">{["#f3e6d6", "#c9a27e", "#8a5a3c", "#2c2420", "#e8c8c0"].map((r, i) => (
          <motion.span key={r} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + i * 0.05, ...yay }} className="h-8 flex-1 rounded-[8px] ring-1 ring-inset ring-white/10" style={{ background: r }} />
        ))}</div>
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-white/[0.05] px-3 py-2 text-[12.5px]"><span className="text-white/65">Yazı tipi</span><span className="font-medium text-white">Canela · Inter</span></div>
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[12.5px] font-medium text-emerald-300"><Lock className="h-3.5 w-3.5" />Kilitli · yalnız marka sorumlusu düzenler</div>
      </div>
      <div className="flex flex-col rounded-[18px] bg-white/[0.05] p-4 ring-1 ring-white/[0.08]">
        <p className="text-[12.5px] text-white/60">Stil referansları</p>
        <div className="mt-3 grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-2">
          {["/gercek/paz/ref-serum.webp", "/gercek/paz/urun-serum-2.webp", "/gercek/galeri/manzara3.webp", "/gercek/paz/urun-kahve.webp"].map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={g} src={g} alt="" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="h-full min-h-[70px] w-full rounded-[10px] object-cover" />
          ))}
        </div>
        <p className="mt-3 rounded-[10px] bg-white/[0.05] px-3 py-2 text-[12.5px] leading-snug text-white/80">"Serum şişesi, mermer zemin, sabah ışığı. Etiket her zaman okunur."</p>
      </div>
    </div>
  );
}

function UretGorunumu() {
  return (
    <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <div className="rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-white/[0.08]">
        <p className="text-[14.5px] leading-relaxed text-white"><span className="rounded-md bg-[#55d6fd]/20 px-1.5 py-0.5 text-[#c4f1ff]">@Atlas</span> serum şişesi, mermer zemin, sabah ışığı, yakın plan</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 text-[12.5px] text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marka/renkli/nanobanana-color.svg" alt="" className="h-4 w-4" />Nano Banana Pro
          </span>
          <span className="flex h-8 items-center gap-1 rounded-full bg-emerald-400/[0.12] px-2.5 text-[12.5px] text-emerald-200"><Check className="h-3.5 w-3.5" />Ekipte izinli model</span>
          <span className="ml-auto flex h-8 items-center gap-2 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/80">Pazarlama bütçesi
            <span className="h-1.5 w-14 rounded-full bg-white/10"><motion.span initial={{ width: 0 }} animate={{ width: "62%" }} transition={{ duration: 1 }} className="block h-full rounded-full bg-[#55d6fd]" /></span>%62
          </span>
        </div>
      </div>
      <div className="grid min-h-[150px] flex-1 grid-cols-2 gap-1.5 sm:grid-cols-4">
        {["/gercek/paz/urun-serum.webp", "/gercek/paz/urun-serum-2.webp", "/gercek/paz/ref-serum.webp", "/gercek/paz/urun-serum.webp"].map((g, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.09, duration: 0.4, ease: EASE }} className="relative overflow-hidden rounded-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g} alt="" className={cn("h-full w-full object-cover", i === 3 && "scale-x-[-1]")} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OnayGorunumu() {
  return (
    <div className="grid h-full gap-3 p-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:p-5">
      <div className="relative h-[260px] overflow-hidden rounded-[18px] sm:h-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gercek/paz/urun-serum.webp" alt="" className="h-full w-full object-cover" />
        {[["38%", "30%", "1"], ["62%", "68%", "2"]].map(([x, y, n], i) => (
          <motion.span key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.15, ...yay }}
            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#55d6fd] text-[12px] font-bold text-[#04212b] ring-4 ring-[#55d6fd]/25" style={{ left: x, top: y }}>{n}</motion.span>
        ))}
        <Cip className="absolute left-3 top-3">Sürüm 3</Cip>
      </div>
      <div className="flex flex-col gap-2 rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-white/[0.08]">
        {[["1", "Ece", "Etiket biraz daha okunur olsun."], ["2", "Mert", "Gölge yumuşak, böyle kalsın."]].map(([n, k, m], i) => (
          <motion.div key={n} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex gap-2.5 rounded-[12px] bg-white/[0.05] p-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[11px] font-bold text-[#04212b]">{n}</span>
            <span className="min-w-0"><span className="block text-[13px] font-semibold text-white">{k}</span><span className="block text-[12.5px] leading-snug text-white/75">{m}</span></span>
          </motion.div>
        ))}
        <div className="mt-auto rounded-[12px] bg-emerald-400/[0.1] p-3 ring-1 ring-inset ring-emerald-400/25">
          <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4" />Marka sorumlusu onayladı</p>
          <p className="mt-0.5 text-[12.5px] text-white/65">Zeynep · 2 dk önce · denetim kaydına yazıldı</p>
        </div>
      </div>
    </div>
  );
}

function YayinlaGorunumu() {
  return (
    <div className="grid h-full gap-3 p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:p-5">
      <div className="flex h-[220px] items-end justify-center sm:h-auto gap-2 rounded-[18px] bg-white/[0.04] p-4 ring-1 ring-white/[0.08]">
        {[["9:16", "aspect-[9/16] w-[26%]"], ["1:1", "aspect-square w-[34%]"], ["16:9", "aspect-video w-[40%]"]].map(([o, c], i) => (
          <motion.div key={o} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08, ease: EASE }} className={cn("relative overflow-hidden rounded-[10px] ring-1 ring-white/15", c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gercek/paz/urun-serum-2.webp" alt="" className="h-full w-full object-cover" />
            <Cip className="absolute bottom-1.5 left-1.5 !px-1.5 !py-0.5 !text-[11px]">{o}</Cip>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-white/[0.08]">
        <div className="flex items-center gap-2 rounded-[12px] bg-[#55d6fd]/[0.1] p-2.5 ring-1 ring-inset ring-[#55d6fd]/25">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#55d6fd]" />
          <span className="text-[12.5px] leading-snug text-white">C2PA içerik kimliği eklendi</span>
        </div>
        {[["/marka/renkli/google-drive.svg", "Google Drive", "Kampanya klasörü"], ["/marka/renkli/dropbox.svg", "Dropbox", "Ajans paylaşımı"]].map(([l, a, b], i) => (
          <motion.div key={a} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] p-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l} alt={a} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-white">{a}</span><span className="block text-[12px] text-white/60">{b}</span></span>
            <Check className="h-4 w-4 text-emerald-300" />
          </motion.div>
        ))}
        <span className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black"><Download className="h-3.5 w-3.5" />3 formatı indir</span>
      </div>
    </div>
  );
}

const ASAMALAR = [
  { ad: "Brif", ikon: PenLine, ozet: "Marka kiti ve stil referansları kilitli", Gorunum: BrifGorunumu,
    kurallar: ["Logo, renk, yazı tipi ve ton tek kitte", "Ekip istemlerine @marka ile ekler", "Kiti yalnız marka sorumlusu değiştirir"] },
  { ad: "Üret", ikon: Sparkles, ozet: "Yalnız izin verilen modeller, ekip bütçesinden", Gorunum: UretGorunumu,
    kurallar: ["Model izinleri ekip bazında açılır", "Her üretim ekibin kredi bütçesinden düşer", "Bütçe dolmadan yöneticiye uyarı gider"] },
  { ad: "Onayla", ikon: MessageCircle, ozet: "Yayından önce marka sorumlusu onayı", Gorunum: OnayGorunumu,
    kurallar: ["Görselin üstüne iğneli yorum", "Sürüm geçmişi ve karşılaştırma", "Onaysız çıktı dışa aktarılamaz"] },
  { ad: "Yayınla", ikon: Send, ozet: "C2PA içerik kimliğiyle dışa aktarım", Gorunum: YayinlaGorunumu,
    kurallar: ["Tek tıkla 9:16, 1:1 ve 16:9", "Drive ve Dropbox'a doğrudan gönderim", "Her dosyada içerik kimliği"] },
];
const ADIM_SURE = 6500;

export function UretimHatti() {
  const [a, setA] = useState(0);
  const [durdu, setDurdu] = useState(false);
  useEffect(() => {
    if (durdu) return;
    const t = setTimeout(() => setA((x) => (x + 1) % ASAMALAR.length), ADIM_SURE);
    return () => clearTimeout(t);
  }, [a, durdu]);
  const s = ASAMALAR[a];
  return (
    <div>
      <LayoutGroup id="kurumsal-hat">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {ASAMALAR.map((x, k) => {
            const on = a === k;
            return (
              <button key={x.ad} onClick={() => { setA(k); setDurdu(true); }} aria-pressed={on}
                className={cn("relative w-[220px] shrink-0 rounded-[20px] p-4 text-left transition-colors sm:w-auto", on ? "bg-[#18181b]" : "bg-[#111113] hover:bg-[#151517]")}>
                <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/[0.07]" />
                {on && <motion.span layoutId="kurumsal-hat-z" transition={yay} className="pointer-events-none absolute inset-0 rounded-[20px] ring-[1.5px] ring-inset ring-[#55d6fd]/80" />}
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300", on ? "bg-[#55d6fd] text-[#04212b]" : "bg-white/[0.07] text-white")}><x.ikon className="h-[17px] w-[17px]" /></span>
                  <span className="text-[13px] tabular-nums text-white/50">{k + 1}</span>
                  <span className="text-[16.5px] font-semibold tracking-[-0.01em] text-white">{x.ad}</span>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-snug text-white/70">{x.ozet}</p>
                <span className="mt-3.5 block h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
                  {on && <motion.span key={`${a}-${durdu}`} initial={{ width: durdu ? "100%" : 0 }} animate={{ width: "100%" }} transition={{ duration: durdu ? 0 : ADIM_SURE / 1000, ease: "linear" }} className="block h-full rounded-full bg-[#55d6fd]" />}
                  {k < a && <span className="block h-full w-full rounded-full bg-[#55d6fd]/40" />}
                </span>
                {k < 3 && <ArrowRight className="absolute -right-[13px] top-[30px] z-10 hidden h-4 w-4 text-[#55d6fd]/80 sm:block" />}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-[24px] bg-[#111113] ring-1 ring-white/[0.08] sm:h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={a} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="h-full">
              <s.Gorunum />
            </motion.div>
          </AnimatePresence>
          <span className="pointer-events-none absolute right-4 top-4 hidden text-[12px] text-white/45 sm:block">Örnek görünüm</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={a} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.28, ease: EASE }}
            className="flex flex-col rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.08]">
            <p className="text-[13px] text-white/55">{a + 1}. adım</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-white">{s.ad}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">{s.ozet}.</p>
            <ul className="mt-6 space-y-3">
              {s.kurallar.map((t, i) => (
                <motion.li key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="flex items-start gap-2.5 text-[14.5px] text-white">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/15"><Check className="h-3 w-3 text-[#55d6fd]" strokeWidth={3} /></span>{t}
                </motion.li>
              ))}
            </ul>
            <p className="mt-auto flex items-center gap-1.5 pt-6 text-[13px] text-white/60"><FileText className="h-3.5 w-3.5" />Her adım denetim kaydına düşer.</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Yönetici için: kredi havuzu, model izinleri, kimlik ve denetim ── */
const EKIP_BUTCE = [["Pazarlama", 62, "#55d6fd"], ["Ajans", 38, "#a78bfa"], ["Sosyal medya", 81, "#fbbf24"], ["Ürün", 24, "#34d399"]] as const;
const MODEL_IZIN = [
  { ad: "Kling", logo: "/marka/renkli/kling-color.svg", acik: true },
  { ad: "Nano Banana", logo: "/marka/renkli/nanobanana-color.svg", acik: true },
  { ad: "Flux", logo: "/marka/renkli/flux.svg", acik: true, koyu: true },
  { ad: "Hailuo", logo: "/marka/renkli/hailuo-color.svg", acik: false },
];

export function YoneticiKartlari() {
  const [izin, setIzin] = useState<Record<string, boolean>>(Object.fromEntries(MODEL_IZIN.map((m) => [m.ad, m.acik])));
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.08]">
        <p className="text-[16px] font-semibold text-white">Ortak kredi havuzu</p>
        <p className="mt-1 text-[13.5px] text-white/65">Tek havuz, ekip bazında bütçe ve uyarılar.</p>
        <p className="mt-5 text-[30px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">412.800 <span className="text-[14px] font-normal text-white/55">/ 600.000</span></p>
        <div className="mt-5 space-y-3.5">
          {EKIP_BUTCE.map(([a, y, r], k) => (
            <div key={a}>
              <div className="flex justify-between text-[13.5px]"><span className="text-white">{a}</span><span className="tabular-nums text-white/70">%{y}</span></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} whileInView={{ width: `${y}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: k * 0.08, ease: EASE }} className="h-full rounded-full" style={{ background: r }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.08]">
        <p className="text-[16px] font-semibold text-white">Model izinleri</p>
        <p className="mt-1 text-[13.5px] text-white/65">Hangi ekip hangi modeli kullanır, sen seçersin.</p>
        <div className="mt-4 divide-y divide-white/[0.06]">
          {MODEL_IZIN.map((m) => (
            <div key={m.ad} className="flex items-center gap-3 py-2.5">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-[9px]", m.koyu ? "bg-black ring-1 ring-white/15" : "bg-white")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt={m.ad} className="h-5 w-5" />
              </span>
              <span className="flex-1 text-[14px] text-white">{m.ad}</span>
              <button onClick={() => setIzin({ ...izin, [m.ad]: !izin[m.ad] })} role="switch" aria-checked={izin[m.ad]} aria-label={`${m.ad} izni`}
                className={cn("relative h-6 w-10 rounded-full transition-colors duration-200", izin[m.ad] ? "bg-[#55d6fd]" : "bg-white/15")}>
                <motion.span layout transition={yay} className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white", izin[m.ad] ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.08]">
        <p className="text-[16px] font-semibold text-white">Kimlik ve denetim</p>
        <p className="mt-1 text-[13.5px] text-white/65">Üyeler kimlik sağlayıcından gelir, her işlem kayda geçer.</p>
        <div className="mt-4 space-y-2">
          {[[ShieldCheck, "SAML SSO", "Okta, Entra ID, Google"], [Users, "48 üye", "SCIM ile eşitlendi"], [FileText, "Denetim kaydı", "Dışa aktarılabilir"], [Lock, "AB veri bölgesi", "Frankfurt"]].map(([I, a, b], k) => {
            const Ik = I as typeof Users;
            return (
              <motion.div key={a as string} initial={{ opacity: 0, x: 6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.06 }}
                className="flex items-center gap-3 rounded-[14px] bg-white/[0.04] px-3 py-2.5">
                <Ik className="h-4 w-4 shrink-0 text-[#55d6fd]" />
                <span className="flex-1 text-[14px] font-medium text-white">{a as string}</span>
                <span className="text-[12.5px] text-white/60">{b as string}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Satın alma listesi: taahhüt dilinde, yalnız gerçekten olanlar ── */
const TAAHHUT = [
  "SAML SSO: Okta, Entra ID, Google, OneLogin", "SCIM ile otomatik üye yönetimi", "Denetim kaydı ve dışa aktarma",
  "Veri bölgesi: AB, ABD, Asya-Pasifik", "Verilerin eğitimde kullanılmaz, sözleşmede yazılı", "Fikrî mülkiyet tazminat güvencesi",
  "GDPR md. 28 ve KVKK uyumlu DPA", "AES-256 depolama, TLS 1.3 aktarım", "%99,9 SLA, kredi iadeli",
];

export function SatinAlmaListesi() {
  return (
    <div className="rounded-[24px] bg-[#111113] p-6 ring-1 ring-white/[0.08] sm:p-8">
      <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {TAAHHUT.map((t, k) => (
          <motion.p key={t} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.03 }} className="flex items-start gap-2.5 text-[14.5px] text-white">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#55d6fd]" />{t}
          </motion.p>
        ))}
        <p className="flex items-start gap-2.5 text-[14.5px] text-white/80"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />SOC 2 Tip II denetimi sürüyor</p>
      </div>
    </div>
  );
}

/* ── Ekip / Kurumsal ── */
const KARSI: [string, string | boolean, string | boolean][] = [
  ["Üye sayısı", "10'a kadar", "Sınırsız"], ["Ortak kredi havuzu", true, true], ["Tüm modeller ve stüdyolar", true, true], ["Üye bazında harcama limiti", true, true],
  ["Marka kiti ve onay akışı", true, true], ["SAML SSO ve SCIM", false, true], ["Denetim kaydı", false, true], ["Veri bölgesi seçimi", false, true],
  ["Özel marka modeli", false, true], ["Ayrılmış GPU kapasitesi", false, true], ["SLA", false, "%99,9"], ["Destek", "Öncelikli", "Atanmış yönetici"], ["Ödeme", "Kart", "Fatura · e-fatura"],
];
export function Karsilastirma() {
  return (
    <div className="overflow-hidden rounded-[24px] bg-[#111113] ring-1 ring-white/[0.08]">
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-4">
        <span className="self-end text-[13px] text-white/60">Özellik</span>
        <span><span className="block text-[15px] font-semibold text-white">Ekip</span><span className="text-[12.5px] text-white/60">Kartla, aylık</span></span>
        <span><span className="block text-[15px] font-semibold text-[#55d6fd]">Kurumsal</span><span className="text-[12.5px] text-white/60">Yıllık sözleşme</span></span>
      </div>
      {KARSI.map(([a, e, k]) => (
        <div key={a} className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 border-b border-white/[0.06] px-5 py-3 text-[14px] transition-colors last:border-0 hover:bg-white/[0.025]">
          <span className="text-white">{a}</span>
          {[e, k].map((v, i) => <span key={i} className={i ? "text-white" : "text-white/75"}>{v === true ? <Check className="h-4 w-4 text-[#55d6fd]" strokeWidth={2.6} /> : v === false ? <span className="text-white/30">—</span> : v}</span>)}
        </div>
      ))}
    </div>
  );
}

export function KurumsalSss({ sorular }: { sorular: { s: string; c: string }[] }) {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
      {sorular.map((s, i) => (
        <div key={s.s}>
          <button onClick={() => setAcik(acik === i ? null : i)} aria-expanded={acik === i} className="group flex w-full items-center gap-4 py-4 text-left">
            <span className="flex-1 text-[15.5px] font-medium text-white">{s.s}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/55 transition-transform duration-200 group-hover:text-white", acik === i && "rotate-180 text-[#55d6fd]")} />
          </button>
          <AnimatePresence initial={false}>
            {acik === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden pb-4 pr-8 text-[14.5px] leading-relaxed text-white/70">{s.c}</motion.p>}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
