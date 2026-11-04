"use client";

/**
 * Tek sürüm girişi — Linear changelog akışı (2026-10-28, onaylanan A):
 * solda yapışkan tarih + sürüm no, sağda dar sütunda başlık, görseller, özet, öne çıkan özellik
 * paragrafları ve renkli hap gruplu değişiklikler (Yeni açık; Geliştirme/Düzeltme uzunsa katlanır).
 */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Bug, ChevronDown, Link2, Share2, Sparkles, Wrench } from "lucide-react";
import { alanAdi, surumCapasi, surumTuru, tarihMetni, type DegisiklikTur, type Surum } from "@/lib/surumler";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";

export const TUR: Record<DegisiklikTur, { ad: string; cogul: string; ikon: React.ElementType; renk: string }> = {
  yeni: { ad: "Yeni", cogul: "Yeni", ikon: Sparkles, renk: "bg-[#55d6fd]/15 text-[#55d6fd]" },
  gelistirme: { ad: "Geliştirme", cogul: "Geliştirmeler", ikon: Wrench, renk: "bg-violet-400/12 text-violet-300" },
  duzeltme: { ad: "Düzeltme", cogul: "Düzeltmeler", ikon: Bug, renk: "bg-amber-400/12 text-amber-200" },
};
/** Liste görünümünde bu sayıdan uzun geliştirme/düzeltme grupları katlanır (Linear gibi). */
const KATLA = 3;

async function paylas(s: Surum) {
  const url = `${window.location.origin}/panel/surum/${s.no}`;
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) { try { await nav.share({ title: `Vayra ${s.no} · ${s.baslik}`, url }); return; } catch { /* iptal */ } }
  void kopyala(url, "Sürüm bağlantısı kopyalandı");
}

export function SurumGirisi({ s, yeni, tam, filtreli, etkin }: { s: Surum; yeni?: boolean; tam?: boolean; filtreli?: boolean; etkin?: boolean }) {
  const gruplar = (Object.keys(TUR) as DegisiklikTur[]).map((t) => [t, s.degisiklikler.filter((d) => d.tur === t)] as const).filter(([, l]) => l.length);
  const ozellikler = !filtreli ? s.ozellikler ?? [] : [];
  // Liste görünümünde iki öne çıkan özellik gösterilir; tamamı sürüm sayfasında.
  const gorunenOzellik = tam ? ozellikler : ozellikler.slice(0, 2);
  const baslik = tam ? s.baslik : <Link href={`/panel/surum/${s.no}`} className="transition-colors hover:text-[#55d6fd]">{s.baslik}</Link>;

  return (
    <article id={surumCapasi(s.no)} data-no={s.no} className="grid scroll-mt-32 gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
      <div className="lg:relative">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:sticky lg:top-32 lg:block">
          <p className="flex items-center gap-2 text-[14px] text-white">
            <span className={cn("h-2 w-2 rounded-full transition-colors", etkin ? "bg-[#55d6fd]" : "bg-white/30")} />
            <time dateTime={s.tarih}>{tarihMetni(s.tarih)}</time>
          </p>
          <p className="text-[13px] tabular-nums text-metin-2 lg:mt-1 lg:pl-4">{surumTuru(s.no)} {s.no}</p>
          {yeni && <span className="rounded-full bg-[#55d6fd]/15 px-2 py-0.5 text-[11.5px] font-medium text-[#55d6fd] lg:ml-4 lg:mt-2 lg:inline-block">Senin için yeni</span>}
        </div>
      </div>

      <div className="min-w-0 max-w-[740px] space-y-5">
        <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[30px]">{baslik}</h2>
        <Medya s={s} />
        <p className="text-[16px] leading-relaxed text-white/80">{s.ozet}</p>
        <div className="flex flex-wrap gap-1.5">{s.alanlar.map((a) => <span key={a} className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[12px] text-metin-2">{alanAdi(a)}</span>)}</div>

        {gorunenOzellik.map((o) => (
          <section key={o.baslik} className="pt-3">
            <h3 className="text-[20px] font-medium tracking-[-0.015em] text-white">{o.baslik}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-metin-2">{o.metin}</p>
            {tam && (o.video || o.gorsel) && (
              <div className="mt-4 overflow-hidden rounded-[18px] ring-1 ring-white/[0.08]">
                {o.video
                  ? <video src={o.video} poster={o.gorsel} autoPlay muted loop playsInline preload="metadata" className="mx-auto max-h-[420px] w-auto" />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={o.gorsel} alt="" loading="lazy" className="block h-auto w-full" />}
              </div>
            )}
            {o.href && <Link href={o.href} className="mt-2 inline-flex items-center gap-1 text-[14px] text-[#55d6fd] hover:underline">{o.eylem ?? "Dene"}<ArrowRight className="h-3.5 w-3.5" /></Link>}
          </section>
        ))}
        {!tam && ozellikler.length > 2 && (
          <Link href={`/panel/surum/${s.no}`} className="inline-flex items-center gap-1 text-[14px] text-metin-2 transition hover:text-white">{ozellikler.length - 2} özellik daha, görselleriyle<ArrowRight className="h-3.5 w-3.5" /></Link>
        )}

        <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {gruplar.map(([t, l]) => <Grup key={t} t={t} l={l} katla={!tam && !filtreli && t !== "yeni" && l.length > KATLA} />)}
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[12.5px] text-metin-2">
          <button onClick={() => void kopyala(`${window.location.origin}/panel/surum/${s.no}`, "Sürüm bağlantısı kopyalandı")} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-white/[0.05] hover:text-white"><Link2 className="h-3.5 w-3.5" />Bağlantıyı kopyala</button>
          <button onClick={() => void paylas(s)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-white/[0.05] hover:text-white"><Share2 className="h-3.5 w-3.5" />Paylaş</button>
          {!tam && <Link href={`/panel/surum/${s.no}`} className="ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-white/80 transition hover:bg-white/[0.05] hover:text-white">Sürüm sayfası<ArrowRight className="h-3.5 w-3.5" /></Link>}
        </div>
      </div>
    </article>
  );
}

/** Kareler (dikey içerik) dörtlü şerit, kapak tek geniş görsel. */
function Medya({ s }: { s: Surum }) {
  if (s.kareler?.length) {
    return (
      <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-[20px]">
        {s.kareler.slice(0, 4).map((k, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img key={k} src={k} alt="" loading="lazy" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="aspect-[3/4] w-full rounded-[12px] object-cover" />
        ))}
      </div>
    );
  }
  if (!s.kapak) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s.kapak} alt="" loading="lazy" className="aspect-[16/9] w-full rounded-[20px] object-cover object-top ring-1 ring-white/[0.08]" />;
}

function Grup({ t, l, katla }: { t: DegisiklikTur; l: Surum["degisiklikler"]; katla: boolean }) {
  const [acikDurum, setAcik] = useState(false);
  const acik = !katla || acikDurum;
  const T = TUR[t];
  const Bas = (
    <>
      <span className={cn("flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-medium", T.renk)}><T.ikon className="h-3 w-3" />{T.cogul}</span>
      <span className="text-[13px] tabular-nums text-metin-2">{l.length}</span>
    </>
  );
  return (
    <div>
      {katla ? (
        <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex w-full items-center gap-2.5 py-3 text-left">
          {Bas}<ChevronDown className={cn("ml-auto h-4 w-4 text-metin-2 transition-transform", acik && "rotate-180")} />
        </button>
      ) : <div className="flex items-center gap-2.5 py-3">{Bas}</div>}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.ul initial={katla ? { height: 0, opacity: 0 } : false} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2 overflow-hidden pb-4">
            {l.map((d) => (
              <li key={d.metin} className="flex gap-2.5 text-[14.5px] leading-relaxed text-white/85">
                <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-white/40" />
                <span>{d.metin}{d.href && <Link href={d.href} className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap text-[13px] text-[#55d6fd] hover:underline">Dene<ArrowUpRight className="h-3 w-3" /></Link>}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
