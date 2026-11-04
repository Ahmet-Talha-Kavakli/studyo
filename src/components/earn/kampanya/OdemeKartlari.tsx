"use client";

/**
 * Kampanya listesi (2026-10-29, 3 prototipten "C · Ödeme kartları"; Vyro kampanya kartı deseni):
 * kartta marka avatarı (kapak kesiti), ad, tür + kalan süre, özet, gerçek platform logoları ve sağ altta büyük ödeme.
 * Masaüstünde üzerine gelinen/odaklanan kart sağdaki yapışkan önizlemeyi sürer (video, künye, ilk 3 koşul, CTA).
 */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock, Trophy, Users } from "lucide-react";
import { TUR_AD, kalanGun, kisaSayi, tl, type Kampanya, type Platform } from "@/lib/earn/kampanyalar";
import { PlatformLogo } from "../ortak";
import { KampanyaKapak, kampanyaOdul, tarihMetni } from "../PosterKart";
import { ease } from "./parcalar";
import { cn } from "@/lib/utils";

/** Kapağın yuvarlatılmış kesiti: kampanyanın "marka avatarı". */
export function KampanyaAvatar({ k, boyut = 44, className }: { k: Kampanya; boyut?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={k.kapak} alt="" className={cn("shrink-0 rounded-[30%] object-cover ring-1 ring-white/[0.12]", className)} style={{ width: boyut, height: boyut }} />;
}

export function OdemeKarti({ k, i, simdi, secili, katildi, bagli, bitti, onSec }: {
  k: Kampanya; i: number; simdi: number; secili: boolean; katildi: boolean; bagli: Platform[]; bitti?: boolean; onSec: () => void;
}) {
  const o = kampanyaOdul(k);
  const uygunDegil = !bitti && bagli.length > 0 && !k.platformlar.some((p) => bagli.includes(p));
  const oran = k.butce ? Math.min(1, (k.odenen ?? 0) / k.butce) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(i, 8) * 0.035, duration: 0.4, ease }}>
      <Link href={`/earn/kampanyalar/${k.id}`} onMouseEnter={onSec} onFocus={onSec}
        className={cn("group relative flex h-full flex-col overflow-hidden rounded-[22px] p-4 ring-1 outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-white/60",
          secili ? "bg-white/[0.07] ring-white/[0.2]" : "bg-white/[0.025] ring-white/[0.07] hover:bg-white/[0.045]", bitti && "opacity-60 hover:opacity-90")}>
        <span className="flex items-center gap-3">
          <KampanyaAvatar k={k} boyut={46} className={cn(bitti && "grayscale-[60%]")} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">{k.ad}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/50">
              {TUR_AD[k.tur]}<span className="text-white/25">·</span>{bitti ? "Sona erdi" : kalanGun(k.bitis, simdi)}
              {katildi && !bitti && <span className="ml-1 inline-flex items-center gap-0.5 font-medium text-[#8fe6ff]"><Check className="h-3 w-3" strokeWidth={3} />Katıldın</span>}
            </span>
          </span>
        </span>
        <span className="mt-3 line-clamp-2 min-h-[42px] text-[13.5px] leading-[1.55] text-white/60">{k.ozet}</span>
        <span className="mt-auto flex items-end justify-between gap-3 pt-4">
          <span className="flex gap-1.5">
            {k.platformlar.map((p) => (
              <span key={p} title={bagli.length && !bagli.includes(p) ? "Bu platformda bağlı hesabın yok" : undefined}
                className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.06] transition", bagli.length > 0 && !bagli.includes(p) && "opacity-35")}>
                <PlatformLogo id={p} boyut={15} />
              </span>
            ))}
          </span>
          <span className="text-right">
            <span className="block text-[25px] font-semibold leading-none tracking-[-0.03em] text-white">{o.deger}</span>
            <span className="mt-1 block text-[11.5px] text-white/50">{o.birim}</span>
          </span>
        </span>
        {oran !== null && !bitti && (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.04]"><motion.span initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.03, ease }} className="block h-full bg-[#55d6fd]/70" /></span>
        )}
        {uygunDegil && <span className="mt-3 rounded-[10px] bg-white/[0.04] px-3 py-2 text-[12px] text-white/55">Bu platformlarda bağlı hesabın yok</span>}
      </Link>
    </motion.div>
  );
}

/** Sağdaki yapışkan önizleme: seçili kampanyanın videosu, künyesi, ilk 3 koşul ve tek eylem. */
export function KampanyaOnizleme({ k, simdi, katildi, bitti }: { k: Kampanya; simdi: number; katildi: boolean; bitti: boolean }) {
  const oran = k.butce ? Math.min(1, (k.odenen ?? 0) / k.butce) : null;
  const ucuncu = k.maxOdeme ? { a: "En çok", d: tl(k.maxOdeme) } : k.kota ? { a: "Kalan yer", d: `${k.kotaKalan}/${k.kota}` } : { a: "Ödüllü", d: `İlk ${k.dereceler?.length ?? 0}` };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease }}
        className="overflow-hidden rounded-[26px] bg-[#0f1013] ring-1 ring-white/[0.08]">
        <div className="relative aspect-[4/5] max-h-[calc(100vh-var(--ust-nav)-380px)] min-h-[260px] w-full">
          <KampanyaKapak k={k} oynat={!bitti} className={cn(bitti && "grayscale-[60%]")} />
          <span className="absolute inset-0 bg-gradient-to-t from-[#0f1013] via-transparent to-black/25" />
          <span className="absolute left-3 top-3 flex gap-1.5 rounded-full bg-black/45 px-2 py-1 backdrop-blur-md">{k.platformlar.map((p) => <PlatformLogo key={p} id={p} boyut={13} />)}</span>
          {katildi && !bitti && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-medium text-[#8fe6ff] backdrop-blur-md"><Check className="h-3 w-3" strokeWidth={3} />Katıldın</span>}
        </div>
        <div className="relative -mt-12 px-5 pb-5">
          <p className="text-[12.5px] text-white/55">{TUR_AD[k.tur]} · {k.kategori}</p>
          <p className="mt-1 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-white">{k.ad}</p>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-white/[0.08] rounded-[16px] bg-white/[0.04] py-3 ring-1 ring-white/[0.06]">
            <div className="px-3"><dt className="flex items-center gap-1 text-[11.5px] text-white/50"><Clock className="h-3 w-3" />{bitti ? "Bitti" : "Bitiş"}</dt><dd className="mt-0.5 text-[14px] font-semibold text-white">{tarihMetni(k.bitis)}</dd></div>
            <div className="px-3"><dt className="flex items-center gap-1 text-[11.5px] text-white/50"><Users className="h-3 w-3" />Katılımcı</dt><dd className="mt-0.5 text-[14px] font-semibold text-white">{kisaSayi(k.katilimci)}</dd></div>
            <div className="px-3"><dt className="flex items-center gap-1 text-[11.5px] text-white/50">{k.dereceler && <Trophy className="h-3 w-3" />}{ucuncu.a}</dt><dd className="mt-0.5 text-[14px] font-semibold text-white">{ucuncu.d}</dd></div>
          </dl>
          {oran !== null && !bitti && (
            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.9, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
              <p className="mt-1.5 text-[12px] text-white/50">Bütçeden {tl(k.butce! - (k.odenen ?? 0))} kaldı</p>
            </div>
          )}
          <ul className="mt-4 space-y-2">
            {k.gereksinimler.slice(0, 3).map((g) => (
              <li key={g} className="flex gap-2.5 text-[13px] leading-snug text-white/75"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /></span>{g}</li>
            ))}
          </ul>
          <Link href={`/earn/kampanyalar/${k.id}`} className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
            {bitti ? "Sonuçları gör" : katildi ? "Kampanyaya git" : "Brifi aç ve katıl"}<ArrowRight className="h-4 w-4" />
          </Link>
          {!bitti && <p className="mt-2.5 text-center text-[12px] text-white/40">{kalanGun(k.bitis, simdi)}</p>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
