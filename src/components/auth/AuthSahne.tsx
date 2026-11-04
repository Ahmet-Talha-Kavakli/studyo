"use client";

import { cn } from "@/lib/utils";

/**
 * Giriş ekranının arka planı: hafif eğik açıyla duran, sütunları zıt yönlere yavaşça akan
 * gerçek Vayra üretimleri duvarı (aralarda oynayan videolar). Ortası formun okunması için koyulaşır.
 * `kucuk`: açılır pencere için daha az sütun.
 */
const G = (n: number) => `/gercek/panel/gal-gpt-${n}.webp`;
const K = (n: number) => `/gercek/proje-kesfet/kesfet-0${n}.webp`;
const V = (ad: string) => ({ v: `/gercek/preset-video/${ad}.mp4`, p: `/gercek/preset-video/${ad}.webp` });
type Oge = string | { v: string; p: string };

const SUTUNLAR: Oge[][] = [
  [G(0), V("orbit-360"), K(1), G(4), K(5)],
  [K(2), G(1), V("moonwalk"), K(6), G(5)],
  [G(2), K(3), G(6), V("earth-zoom"), K(7)],
  [V("fairytale-castle"), G(3), K(4), G(7), K(8)],
  [K(1), G(5), V("float-spin"), K(2), G(0)],
  [G(6), V("action-figure"), K(3), G(2), K(5)],
];

function Kutu({ o }: { o: Oge }) {
  if (typeof o === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={o} alt="" loading="lazy" draggable={false} className="aspect-[3/4] w-full rounded-[18px] object-cover" />;
  }
  return <video src={o.v} poster={o.p} autoPlay muted loop playsInline preload="metadata" className="aspect-[3/4] w-full rounded-[18px] object-cover" />;
}

export function AuthSahne({ kucuk, className }: { kucuk?: boolean; className?: string }) {
  const sutunlar = kucuk ? SUTUNLAR.slice(0, 4) : SUTUNLAR;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-[#08080a]", className)}>
      <div className="auth-duvar absolute left-1/2 top-1/2 flex gap-4" style={{ width: kucuk ? 900 : 1700 }}>
        {sutunlar.map((s, i) => (
          <div key={i} className={cn("auth-sutun flex flex-1 flex-col gap-4", i % 2 && "auth-sutun-ters")} style={{ animationDuration: `${70 + i * 9}s` }}>
            {[...s, ...s].map((o, j) => <Kutu key={j} o={o} />)}
          </div>
        ))}
      </div>
      {/* Okunabilirlik: ortada koyu, kenarlarda yumuşak geçiş */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(48% 58% at 50% 50%, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.78) 45%, rgba(8,8,10,0.45) 100%)" }} />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#08080a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08080a] to-transparent" />
    </div>
  );
}
