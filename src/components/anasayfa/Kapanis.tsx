"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Sık sorulanlar — gerçek ürün bilgisiyle (krediler, ödeme, KVKK, ticari kullanım). */
const SSS: { s: string; c: string; konu: string }[] = [
  { konu: "Başlarken", s: "Vayra nedir?", c: "Görsel, video, ses, müzik ve 3D üretimini tek yerde toplayan bir yapay zekâ platformu. Google, OpenAI, ByteDance, Kling ve diğerlerinin modellerini tek hesapla, Türkçe kullanırsın." },
  { konu: "Başlarken", s: "Ücretsiz deneyebilir miyim?", c: "Evet. Kaydolunca deneme kredisi tanımlanır; kart bilgisi girmeden üretmeye başlarsın." },
  { konu: "Kredi", s: "Kredi sistemi nasıl çalışır?", c: "Her üretim seçtiğin model ve ayarlara göre kredi harcar. Bedeli Üret düğmesinin yanında, üretmeden önce görürsün. Planındaki aylık krediyi kullanır, gerekirse ek paket alırsın." },
  { konu: "Kredi", s: "Hangi ödeme yöntemleri var?", c: "Türk lirası ile kredi ve banka kartı. Kurumsal müşteriler için havale ve e-fatura da var." },
  { konu: "Kullanım", s: "Ürettiklerimi ticari olarak kullanabilir miyim?", c: "Ücretli planlarda ürettiğin içerikleri reklam, ürün ve kampanyalarında ticari olarak kullanabilirsin." },
  { konu: "Kullanım", s: "Hangi modeller var?", c: "Seedance, Kling, Nano Banana, GPT Image, Seedream, ElevenLabs ve daha fazlası. Yeni modeller çıktıkça eklenir, ayrı abonelik gerekmez." },
  { konu: "Güvenlik", s: "Verilerim güvende mi?", c: "Yüklediğin dosyalar ve üretimlerin model eğitiminde kullanılmaz. Verilerin KVKK kapsamında işlenir." },
  { konu: "Güvenlik", s: "Ekibimle kullanabilir miyim?", c: "Evet. Ortak kredi havuzu, roller, onay akışı ve SSO ile ekip ve kurumsal planlar var." },
];

const KOLONLAR: { baslik: string; linkler: [string, string][] }[] = [
  { baslik: "Üret", linkler: [["Görsel", "/panel/gorsel"], ["Video", "/panel/video"], ["Ses", "/panel/ses"], ["Müzik", "/panel/muzik"], ["3D", "/panel/3d"], ["Canvas", "/panel/canvas"]] },
  { baslik: "Stüdyolar", linkler: [["Sinema", "/panel/sinema"], ["Pazarlama", "/panel/pazarlama"], ["Uzun video", "/panel/uzun-video"], ["Montaj", "/panel/montaj"], ["Presetler", "/panel/presetler"], ["Usta", "/panel/supercomputer"]] },
  { baslik: "Platform", linkler: [["Modeller", "/modeller"], ["Fiyatlandırma", "/fiyatlandirma"], ["API", "/panel/api"], ["MCP", "/panel/mcp"], ["Entegrasyonlar", "/entegrasyonlar"], ["Sistem durumu", "/durum"]] },
  { baslik: "Şirket", linkler: [["Hakkımızda", "/hakkinda"], ["Kurumsal", "/kurumsal"], ["Kariyer", "/kariyer"], ["Blog", "/blog"], ["Basın", "/basin"], ["İletişim", "/iletisim"]] },
  { baslik: "Yardım", linkler: [["SSS", "/sss"], ["Gizlilik", "/gizlilik"], ["Kullanım şartları", "/sartlar"], ["KVKK", "/veri-koruma"], ["Çerezler", "/cerezler"], ["İade ve iptal", "/iade"]] },
];
const SOSYAL = [["Instagram", "/marka/instagram.svg"], ["X", "/marka/x.svg"], ["TikTok", "/marka/tiktok.svg"], ["LinkedIn", "/marka/linkedin-in.svg"]] as const;

function Akordeon({ liste, ac, setAc }: { liste: typeof SSS; ac: number | null; setAc: (i: number | null) => void }) {
  return (
    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
      {liste.map((x, i) => {
        const a = ac === i;
        return (
          <div key={x.s}>
            <button onClick={() => setAc(a ? null : i)} aria-expanded={a} className="group flex w-full items-center justify-between gap-6 py-5 text-left">
              <span className={cn("text-[16.5px] font-medium tracking-[-0.01em] transition-colors sm:text-[18px]", a ? "text-white" : "text-white/80 group-hover:text-white")}>{x.s}</span>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300", a ? "rotate-45 bg-[#55d6fd] text-[#06141a]" : "bg-white/[0.06] text-white/70")}><Plus className="h-4 w-4" /></span>
            </button>
            <AnimatePresence initial={false}>
              {a && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                  <p className="max-w-[640px] pb-5 text-[15.5px] leading-relaxed text-white/60">{x.c}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Bülten kaydı (demo: yerel onay). */
function Bulten() {
  const [ok, setOk] = useState(false);
  const [e, setE] = useState("");
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); if (/^\S+@\S+\.\S+$/.test(e)) setOk(true); }} className="flex h-12 w-full max-w-[420px] items-center gap-2 rounded-full bg-black/40 p-1 pl-5 ring-1 ring-white/[0.1] focus-within:ring-[#55d6fd]/50">
      <AnimatePresence mode="wait" initial={false}>
        {ok ? (
          <motion.p key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex-1 text-[14.5px] text-[#9ff0ff]">Teşekkürler, listeye eklendin.</motion.p>
        ) : (
          <motion.input key="in" exit={{ opacity: 0 }} type="email" value={e} onChange={(x) => setE(x.target.value)} placeholder="E-posta adresin" aria-label="E-posta adresin" className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35 focus:outline-none" />
        )}
      </AnimatePresence>
      {!ok && <button className="h-10 shrink-0 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition-transform active:scale-[0.97]">Abone ol</button>}
    </form>
  );
}

function AltSatir() {
  return (
    <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-6 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
      <p>© 2026 Vayra. Tüm hakları saklıdır.</p>
      <div className="flex items-center gap-4">
        <Link href="/durum" className="flex items-center gap-1.5 hover:text-white"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>Tüm sistemler çalışıyor</Link>
        <span className="flex gap-1.5">
          {SOSYAL.map(([ad, ikon]) => (
            <span key={ad} title={ad} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/[0.08]"><img src={ikon} alt={ad} className="h-3.5 w-3.5 opacity-75 brightness-0 invert" /></span>
          ))}
        </span>
      </div>
    </div>
  );
}

function Kolonlar({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {KOLONLAR.map((k) => (
        <div key={k.baslik}>
          <p className="mb-4 text-[13px] font-semibold text-white/90">{k.baslik}</p>
          <ul className="space-y-3">{k.linkler.map(([ad, href]) => <li key={ad}><Link href={href} className="group/l inline-flex items-center gap-1 text-[14px] text-white/55 transition-colors hover:text-white">{ad}<ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover/l:translate-x-0 group-hover/l:opacity-100" /></Link></li>)}</ul>
        </div>
      ))}
    </div>
  );
}

/** Kapanış: iki sütun SSS ve altında, kaydırdıkça yükselen dev Vayra yazılı altbilgi. */
export function Kapanis() {
  const [ac, setAc] = useState<number | null>(0);
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  return (
    <>
      <section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[48px]">Sık sorulanlar</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/60">Aradığını bulamadın mı? Ekibimiz Türkçe destek verir.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/sss" className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.1] hover:bg-white/[0.12]">Yardım merkezi<ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/iletisim" className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium text-[#55d6fd]">Bize yaz<ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <Akordeon liste={SSS.slice(0, 6)} ac={ac} setAc={setAc} />
      </section>
      <footer data-altbilgi ref={kok} className="relative overflow-hidden border-t border-white/[0.06] bg-[#08080a]">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#55d6fd]/40 to-transparent" />
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-48 w-[60%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(85,214,253,0.08),transparent)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 pt-16 sm:px-8 sm:pt-20">
          {/* Bülten: yeni modeller çıktığında haber */}
          <div className="flex flex-col gap-6 rounded-[28px] bg-white/[0.03] p-6 ring-1 ring-white/[0.07] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#55d6fd]/10 ring-1 ring-[#55d6fd]/25"><VayraIsaret size={22} /></span>
              <div>
                <p className="text-[20px] font-semibold tracking-[-0.02em] text-white sm:text-[22px]">Yeni modelleri ilk sen dene.</p>
                <p className="mt-1 text-[14.5px] text-white/50">Ayda iki e-posta: yeni modeller, presetler ve ipuçları. İstediğin an ayrılırsın.</p>
              </div>
            </div>
            <Bulten />
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div>
              <Link href="/panel" className="inline-flex items-center gap-2.5 text-[22px] font-semibold tracking-[-0.02em] text-white"><VayraIsaret size={22} />Vayra</Link>
              <p className="mt-3 max-w-[260px] text-[14.5px] leading-relaxed text-white/50">Bir cümle yaz; video, görsel, müzik, ses ve 3D olsun.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Türk lirası ile öde", "KVKK uyumlu", "Ticari kullanım"].map((x) => <span key={x} className="rounded-full bg-white/[0.04] px-3 py-1 text-[12px] text-white/55 ring-1 ring-white/[0.07]">{x}</span>)}
              </div>
            </div>
            <Kolonlar />
          </div>
          <div className="mt-14"><AltSatir /></div>
        </div>
        <div className="pointer-events-none mt-6 overflow-hidden">
          <motion.p style={{ y }} className="select-none bg-gradient-to-b from-[#55d6fd]/30 via-[#55d6fd]/[0.06] to-transparent bg-clip-text text-center text-[26vw] font-semibold leading-[0.8] tracking-[-0.07em] text-transparent">Vayra</motion.p>
        </div>
      </footer>
    </>
  );
}
