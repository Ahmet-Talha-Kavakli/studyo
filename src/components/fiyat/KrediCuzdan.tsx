"use client";

/**
 * /panel/kredi?sekme=kredi — "Cüzdan doldurma" (2026-11-04 kullanıcı seçimi; önceki yedi deneme reddedildi).
 * Revolut / Apple Cash dili: ortada dev, yazılabilir tutar; hızlı ekle çipleri ve paket çipleri; bir üst
 * fiyat kademesine ne kadar kaldığı; sağda bakiyenle büyüyen cüzdan kartı (fareyle hafif eğilir) ve ödeme.
 * Fiyat kademeli: miktara eşit ya da altındaki en büyük paketin kredi başı fiyatı. Satın alma demo.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Infinity as Sonsuz, Loader2, Lock, RefreshCw, RotateCcw, Sparkles, Zap } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { useAuth } from "@/store/useAuth";
import { hareketYaz } from "@/store/useHesap";
import { useTercih } from "@/store/useTercih";
import { hesapBildirimi } from "@/lib/bildirimler";
import { toast } from "@/lib/toast";
import { KREDI_PAKETLERI, ORNEK_MALIYET, SINIRSIZ_TEKLIFLER, krediBasina, planBul, sayi, sinirsizFiyat, tl, tlKurus } from "@/lib/fiyat";
import type { KrediSekme } from "@/store/useKrediModal";
import { cn } from "@/lib/utils";

const KDV = 0.2;
const MIN = 100, MAX = 25000;
const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const kademe = (k: number) => [...KREDI_PAKETLERI].reverse().find((p) => p.kredi <= k) ?? KREDI_PAKETLERI[0];
const fiyatHesap = (k: number) => Math.round(k * krediBasina(kademe(k).fiyat, kademe(k).kredi));
const TABAN = krediBasina(KREDI_PAKETLERI[0].fiyat, KREDI_PAKETLERI[0].kredi);
const sinirla = (k: number) => Math.min(MAX, Math.max(MIN, Math.round(k / 50) * 50));

/** Sayıyı yaylı sayarak gösterir. */
function Sayac({ deger, className }: { deger: number; className?: string }) {
  const v = useMotionValue(deger);
  const [g, setG] = useState(deger);
  useEffect(() => v.on("change", (x) => setG(Math.round(x))), [v]);
  useEffect(() => { const c = animate(v, deger, { duration: 0.7, ease: [0.22, 1, 0.36, 1] }); return c.stop; }, [deger, v]);
  return <span className={className}>{sayi(g)}</span>;
}

/** Cüzdan kartı: koyu degrade, camgöbeği parlama, fareyle eğilir. */
function CuzdanKarti({ ad, bakiye, eklenecek }: { ad: string; bakiye: number; eklenecek: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 });
  const isik = useTransform([mx, my] as never, ([x, y]: number[]) => `radial-gradient(60% 70% at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.16), transparent 60%)`);
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height); }}
        onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
        className="relative aspect-[1.586] w-full overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/15"
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 120% at 0% 0%, #1d4a5e 0%, #0f1c24 45%, #0a0b0d 100%)" }} />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/[0.08]" />
        <div className="absolute -right-6 -top-8 h-40 w-40 rounded-full border border-white/[0.08]" />
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: isik }} />
        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vayra-mark-kirpik.png" alt="" className="h-5 w-auto" />
            <span className="text-[12px] font-medium text-white/60">Vayra kredi</span>
          </div>
          <div className="mt-auto">
            <p className="text-[12.5px] text-white/55">Bakiye</p>
            <p className="mt-0.5 flex items-center gap-2 text-[34px] font-semibold leading-none tabular-nums tracking-[-0.035em] text-white sm:text-[40px]">
              <KrediJeton boyut={20} /><Sayac deger={bakiye + eklenecek} />
            </p>
            <div className="mt-3 flex items-center justify-between text-[12.5px]">
              <span className="truncate text-white/70">{ad}</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={eklenecek} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="rounded-full bg-[#55d6fd]/15 px-2.5 py-1 font-semibold tabular-nums text-[#7fe2ff] ring-1 ring-inset ring-[#55d6fd]/30">+{sayi(eklenecek)}</motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function KrediCuzdan({ onSekme }: { onSekme: (s: KrediSekme) => void }) {
  const kullanici = useAuth((s) => s.kullanici);
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);
  const oto = useTercih((s) => s.otomatikYukleme);
  const otoToggle = useTercih((s) => s.otomatikYuklemeToggle);
  const [kredi, setKredi] = useState(KREDI_PAKETLERI.find((p) => p.populer)?.kredi ?? 2500);
  const [yaziyor, setYaziyor] = useState(false);
  const [taslak, setTaslak] = useState("");
  const [isliyor, setIsliyor] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = Number(q.get("paket"));
    if (q.has("paket") && Number.isInteger(i) && KREDI_PAKETLERI[i]) setKredi(KREDI_PAKETLERI[i].kredi);
  }, []);

  const bakiye = kullanici?.krediler ?? 0;
  const ara = fiyatHesap(kredi);
  const kdv = Math.round(ara * KDV);
  const kb = ara / kredi;
  const avantaj = Math.round((1 - kb / TABAN) * 100);
  const sonraki = KREDI_PAKETLERI.find((p) => p.kredi > kredi);
  const sonrakiKb = sonraki ? krediBasina(sonraki.fiyat, sonraki.kredi) : 0;
  const arti = planBul("arti")!;
  const artiFark = Math.round((1 - krediBasina(arti.fiyatTRY * 0.8, arti.kredi) / kb) * 100);
  const enUcuzSinirsiz = Math.min(...SINIRSIZ_TEKLIFLER.map((t) => sinirsizFiyat(t, 0, 0)));

  const yazmayiBitir = () => {
    const n = Number(taslak.replace(/\D/g, ""));
    if (n) setKredi(sinirla(n));
    setYaziyor(false);
  };
  const satinAl = () => {
    if (!kullanici) return toast.error("Önce giriş yap", { description: "Kredi yüklemek için hesabınla giriş yapman gerekiyor." });
    setIsliyor(true);
    setTimeout(() => {
      ekKrediEkle(kredi);
      hareketYaz({ tur: "kredi", aciklama: `${sayi(kredi)} kredi`, kredi, tutar: ara, kdv, belge: true });
      hesapBildirimi(`${sayi(kredi)} kredi yüklendi`, `Demo satın alma (${tl(ara + kdv)}), gerçek ödeme alınmadı. Yeni bakiyen ${sayi(bakiye + kredi)} kredi.`, { ad: "Faturaları gör", link: "/panel/ayarlar/faturalar" });
      toast.success(`${sayi(kredi)} kredi yüklendi`, { description: `${tl(ara + kdv)} · Gerçek ödeme alınmadı.` });
      setIsliyor(false);
    }, 700);
  };

  return (
    <div className="space-y-3">
      <div className="grid overflow-hidden rounded-[30px] bg-[#111113] ring-1 ring-inset ring-white/[0.08] lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* ── Sol: tutar ── */}
        <div className="relative flex flex-col items-center px-5 pb-8 pt-10 text-center sm:px-10 sm:pt-14">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[620px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(85,214,253,0.12),transparent)]" />
          <p className="relative text-[14px] text-white/55">Yüklenecek kredi</p>
          <div className="relative mt-3 flex h-[96px] items-center justify-center gap-3 max-sm:h-[72px]">
            <KrediJeton boyut={40} className="max-sm:scale-75" />
            {yaziyor ? (
              <input ref={input} autoFocus inputMode="numeric" value={taslak} aria-label="Kredi miktarı"
                onChange={(e) => setTaslak(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onBlur={yazmayiBitir} onKeyDown={(e) => { if (e.key === "Enter") yazmayiBitir(); if (e.key === "Escape") setYaziyor(false); }}
                className="w-[5.4ch] bg-transparent text-[92px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-white caret-[#55d6fd] outline-none max-sm:text-[64px]" />
            ) : (
              <button type="button" onClick={() => { setTaslak(String(kredi)); setYaziyor(true); }} title="Tutarı yaz"
                className="rounded-[18px] px-2 text-[92px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-white transition-colors hover:bg-white/[0.04] max-sm:text-[64px]">
                <Sayac deger={kredi} />
              </button>
            )}
          </div>
          <p className="relative mt-3 text-[16px] text-white/70">
            <span className="font-semibold tabular-nums text-white">{tl(ara)}</span> · kredi başına {tlKurus(kb)}
            {avantaj > 0 && <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-emerald-400/12 px-2 py-0.5 text-[12.5px] font-semibold text-emerald-300">yüzde {avantaj} avantaj</span>}
          </p>
          <p className="relative mt-1.5 text-[13px] text-white/45">Yaklaşık {sayi(Math.floor(kredi / ORNEK_MALIYET.video.kredi))} video ya da {sayi(Math.floor(kredi / ORNEK_MALIYET.gorsel.kredi))} görsel</p>

          {/* hızlı ekle */}
          <div className="relative mt-8 flex flex-wrap justify-center gap-2">
            {[100, 500, 1000, 5000].map((n) => (
              <motion.button key={n} type="button" whileTap={{ scale: 0.94 }} disabled={kredi >= MAX} onClick={() => setKredi((k) => sinirla(k + n))}
                className="h-11 rounded-full bg-white/[0.06] px-5 text-[14px] font-semibold tabular-nums text-white ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.11] disabled:opacity-35">+{sayi(n)}</motion.button>
            ))}
            <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => setKredi(MIN)} aria-label="Sıfırla" title="En aza indir"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/55 ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-4 w-4" /></motion.button>
          </div>

          {/* paketler */}
          <div className="relative mt-6 w-full max-w-[640px]">
            <p className="mb-2.5 text-[12.5px] text-white/40">Ya da bir paket seç</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {KREDI_PAKETLERI.map((p) => {
                const a = p.kredi === kredi;
                return (
                  <button key={p.kredi} type="button" onClick={() => setKredi(p.kredi)}
                    className={cn("relative rounded-[16px] px-2 py-2.5 transition-colors", a ? "bg-white text-black" : "bg-white/[0.04] text-white hover:bg-white/[0.08]")}>
                    {p.populer && !a && <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#55d6fd] px-1.5 text-[10px] font-semibold text-black">Popüler</span>}
                    <span className="block text-[15px] font-semibold tabular-nums">{sayi(p.kredi)}</span>
                    <span className={cn("block text-[11.5px] tabular-nums", a ? "text-black/55" : "text-white/45")}>{tl(p.fiyat)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* bir üst kademe */}
          <AnimatePresence mode="wait">
            {sonraki && sonrakiKb < kb && (
              <motion.button key={sonraki.kredi} type="button" onClick={() => setKredi(sonraki.kredi)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="relative mt-5 flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] text-white/70 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#55d6fd]" />{sayi(sonraki.kredi - kredi)} kredi daha ekle, kredi başı fiyat {tlKurus(sonrakiKb)} olsun<ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sağ: cüzdan ve ödeme ── */}
        <div className="flex flex-col gap-5 border-white/[0.06] bg-white/[0.015] p-5 sm:p-7 max-lg:border-t lg:border-l">
          <CuzdanKarti ad={kullanici?.ad ?? "Vayra"} bakiye={bakiye} eklenecek={kredi} />
          <div className="space-y-2 text-[13.5px]">
            <p className="flex justify-between text-white/55"><span>Şu anki bakiye</span><span className="tabular-nums text-white">{sayi(bakiye)} kredi</span></p>
            <p className="flex justify-between text-white/55"><span>{sayi(kredi)} kredi</span><span className="tabular-nums text-white">{tl(ara)}</span></p>
            <p className="flex justify-between text-white/55"><span>KDV (yüzde 20)</span><span className="tabular-nums text-white">{tl(kdv)}</span></p>
            <p className="flex justify-between border-t border-white/[0.06] pt-3 text-[16px] font-semibold text-white"><span>Toplam</span><span className="tabular-nums">{tl(ara + kdv)}</span></p>
          </div>
          <div className="mt-auto">
            <button type="button" onClick={satinAl} disabled={isliyor}
              className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-70">
              {isliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{tl(ara + kdv)} öde{!isliyor && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/40"><Lock className="h-3 w-3" />Test ödemesi · süresi dolmaz · anında yüklenir · 14 gün iade</p>
          </div>
        </div>
      </div>

      {/* ── Alt: otomatik yükleme ve öneriler ── */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[22px] bg-[#111113] p-4 ring-1 ring-inset ring-white/[0.08]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06]"><RefreshCw className="h-[18px] w-[18px] text-white/75" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">Otomatik yükleme</span><span className="block truncate text-[12px] text-white/50">{oto ? `Bakiye 100'ün altına inince ${sayi(useTercih.getState().otoPaket)} kredi` : "Kapalı: bakiye bitince üretim durur"}</span></span>
          <button type="button" role="switch" aria-checked={oto} aria-label="Otomatik yükleme" onClick={() => { const y = otoToggle(); toast.success(y ? "Otomatik yükleme açıldı" : "Otomatik yükleme kapatıldı"); }}
            className={cn("relative h-7 w-11 shrink-0 rounded-full transition-colors", oto ? "bg-[#55d6fd]" : "bg-white/15")}>
            <motion.span layout transition={yay} className={cn("absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white", oto ? "right-[3px]" : "left-[3px]")} />
          </button>
        </div>
        <button type="button" onClick={() => onSekme("plan")} className="group flex items-center gap-3 rounded-[22px] bg-[#111113] p-4 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.04]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06]"><Zap className="h-[18px] w-[18px] text-white/75" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">Her ay mı alıyorsun?</span><span className="block truncate text-[12px] text-white/50">{artiFark > 0 ? `Artı planında kredi yüzde ${artiFark} daha ucuz` : "Artı planı ile her ay 1.000 kredi"}</span></span>
          <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </button>
        <button type="button" onClick={() => onSekme("sinirsiz")} className="group flex items-center gap-3 rounded-[22px] bg-[#111113] p-4 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.04]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06]"><Sonsuz className="h-[18px] w-[18px] text-white/75" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">Kredi saymadan üret</span><span className="block truncate text-[12px] text-white/50">Sınırsız erişim günde {tl(enUcuzSinirsiz)}&apos;den</span></span>
          <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </button>
      </div>
      <p className="text-[12.5px] text-white/40">Önce plan kredin, sonra yüklediğin kredi harcanır. Yüklediğin kredinin süresi dolmaz.</p>
    </div>
  );
}
