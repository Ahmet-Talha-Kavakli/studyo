"use client";

import Link from "next/link";
import { AuthDugmeleri } from "@/components/auth/AuthDugmeleri";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowRight, Bell, BookOpen, ChevronRight, Code2, Coins, Crown, FolderOpen, HelpCircle, LogOut, Plus, Search, Settings, Sparkles, UserRound, X, Zap,
} from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";
import { STUDYOLAR, TUR_MENU, CamKaro, BolumEtiket, Rozet } from "./MegaNav";
import { useAuth, krediDurum, PLAN_ADI } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useBildirim, okunmamisSay } from "@/store/useBildirim";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { KrediIsiltiHap, KrediJeton } from "@/components/ui/KrediHap";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";

/**
 * Mobil üst başlık + gezinme sayfası.
 *
 * Başlık: logo · Fiyatlar · zil · menü. Menü, masaüstü navın mobil karşılığıdır:
 * arama, hesap ve kredi kartı, Üret türleri, stüdyolar, hızlı bağlantılar ve
 * hesap bağlantıları tek kaydırılabilir sayfada. Misafirde hesap kartı yerine
 * giriş/kayıt düğmeleri çıkar.
 */

function ElmasIkon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.4 2.6 11.8 12 21.2l9.4-9.4L12 2.4Zm0 3.1 6.3 6.3-6.3 6.3-6.3-6.3L12 5.5Z" />
      <path d="M12 7.4 7.9 11.8 12 16.2l4.1-4.4L12 7.4Z" />
    </svg>
  );
}

const HIZLI = [
  { ad: "Kitaplık", href: "/panel/kitaplik", ikon: FolderOpen, renk: "#fb923c" },
  { ad: "Presetler", href: "/panel/presetler", ikon: Sparkles, renk: "#a78bfa" },
  { ad: "Vayra Earn", href: "/earn", ikon: Coins, renk: "#fbbf24" },
  { ad: "API", href: "/panel/api", ikon: Code2, renk: "#55d6fd" },
  { ad: "Modeller", href: "/modeller", ikon: BookOpen, renk: "#34d399" },
];

const TUR_RENK = { gorsel: "#5cb8ff", video: "#a78bfa", ses: "#f472b6", uc: "#34d399" } as const;
type TurAnahtar = keyof typeof TUR_RENK;
const TUR_SIRA: TurAnahtar[] = ["gorsel", "video", "ses", "uc"];

export function MobilBaslik() {
  const [menu, setMenu] = useState(false);
  const [tur, setTur] = useState<TurAnahtar>("video");
  const [hazir, setHazir] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const kullanici = useAuth((s) => s.kullanici);
  const cikisYap = useAuth((s) => s.cikisYap);
  const girisli = useAuth((s) => s.girisYapildi);
  const acKapi = useAuthKapi((s) => s.ac);
  const okunmamis = useBildirim((s) => okunmamisSay(s.bildirimler));
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);

  useEffect(() => setHazir(true), []);
  useEffect(() => { setMenu(false); }, [path]);
  useEffect(() => {
    if (!menu) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = eski; window.removeEventListener("keydown", esc); };
  }, [menu]);

  const kapatVeGit = (href: string) => { setMenu(false); router.push(href); };
  const araAc = () => { setMenu(false); setTimeout(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })), 160); };
  const basHarf = (kullanici?.ad?.trim()[0] ?? "V").toLocaleUpperCase("tr-TR");

  return (
    <>
      <header className="vayra-mono flex h-[52px] items-center bg-zemin px-4 sm:hidden">
        <Link href="/panel" className="flex items-center gap-2" aria-label="Vayra ana sayfa">
          <VayraIsaret size={34} />
          <span className="text-[19px] font-bold leading-none tracking-tight text-white">Vayra</span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {hazir && girisli ? (
            <KrediIsiltiHap deger={kullanici?.krediler ?? 0} az={kredi.oran < 0.2} href="/panel/kredi?sekme=kredi" />
          ) : (
            <Link href="/fiyatlandirma" className="rgb-cerceve block rounded-full p-[1.5px] active:scale-[0.97]">
              <span className="flex h-[33px] items-center gap-1.5 rounded-full bg-[#0f0f11] px-3">
                <ElmasIkon className="h-3.5 w-3.5 text-white" />
                <span className="text-[13.5px] font-semibold leading-none text-white">Fiyatlar</span>
              </span>
            </Link>
          )}
          <Link href="/panel/bildirimler" aria-label={hazir && girisli && okunmamis ? `Bildirimler, ${okunmamis} okunmamış` : "Bildirimler"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white active:bg-white/[0.06]">
            <Bell className="h-[20px] w-[20px]" strokeWidth={2} />
            {hazir && girisli && okunmamis > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#55d6fd] px-1 text-[9.5px] font-bold tabular-nums text-[#06202a] ring-2 ring-zemin">{okunmamis > 9 ? "9+" : okunmamis}</span>
            )}
          </Link>
          <button onClick={() => setMenu(true)} aria-label="Menüyü aç" aria-expanded={menu} className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full active:bg-white/[0.06]">
            <span className="h-[2px] w-[19px] rounded-full bg-white" />
            <span className="h-[2px] w-[19px] rounded-full bg-white" />
          </button>
        </div>
      </header>

      {hazir && createPortal(
        <AnimatePresence>
          {menu && (
            <motion.div key="mobil-menu" role="dialog" aria-modal="true" aria-label="Menü"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="kesfet-tema vayra-mono fixed inset-0 z-[95] flex flex-col bg-[#0b0b0d] sm:hidden">
              <div className="flex h-[52px] shrink-0 items-center px-4">
                <span className="flex items-center gap-2"><VayraIsaret size={34} /><span className="text-[19px] font-bold leading-none tracking-tight text-white">Vayra</span></span>
                <button onClick={() => setMenu(false)} aria-label="Menüyü kapat" className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white active:bg-white/[0.1]"><X className="h-5 w-5" /></button>
              </div>

              <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2">
                <button onClick={araAc} className="glass-cip flex h-11 w-full items-center gap-2.5 rounded-xl px-3.5 text-left text-[14.5px] text-white/45">
                  <Search className="h-[17px] w-[17px] text-vurgu-acik" />Model, stüdyo ya da yaratıcı ara
                </button>

                {girisli ? (
                  <div className="hf-kart mt-4 p-4 ring-1 ring-inset ring-white/[0.08]" style={{ background: "linear-gradient(135deg, rgba(85,214,253,0.13), rgba(167,139,250,0.07) 55%, rgba(255,255,255,0.02))" }}>
                    <div className="flex items-center gap-3">
                      <KullaniciAvatar boyut={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="truncate text-[15.5px] font-semibold text-white">{kullanici?.ad}</span><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-vurgu/15 px-2 py-0.5 text-[11.5px] font-medium text-vurgu-acik ring-1 ring-inset ring-vurgu/30"><Crown className="h-2.5 w-2.5" strokeWidth={2.6} />{PLAN_ADI[kullanici?.plan ?? "baslangic"]}</span></span>
                        <span className="block truncate text-[12.5px] text-white/45">{kullanici?.email}</span>
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <span>
                        <span className="block text-[12.5px] text-white/55">Kalan kredi</span>
                        <span className="mt-1 flex items-center gap-2"><KrediJeton boyut={18} az={kredi.oran < 0.2} /><span className="text-[24px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white">{new Intl.NumberFormat("tr-TR").format(kullanici?.krediler ?? 0)}</span><span className="text-[12px] tabular-nums text-white/40">/ {kredi.toplam.toLocaleString("tr-TR")}</span></span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-white/60"><span className="h-1.5 w-1.5 rounded-full" style={{ background: kredi.renk }} />{kredi.etiket}</span>
                    </div>
                    <div className="mt-2.5 h-[7px] overflow-hidden rounded-full bg-black/35 ring-1 ring-inset ring-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, Math.round(kredi.oran * 100))}%`, background: `linear-gradient(90deg, ${kredi.renk}aa, ${kredi.renk})`, boxShadow: `0 0 12px ${kredi.renk}66` }} /></div>
                    <div className="mt-3.5 grid grid-cols-2 gap-2">
                      <button onClick={() => kapatVeGit("/panel/kredi?sekme=kredi")} className="glass-cip flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-semibold text-white"><Plus className="h-4 w-4" strokeWidth={2.6} />Kredi yükle</button>
                      <button onClick={() => kapatVeGit("/panel/kredi?sekme=plan")} className="hf-cta flex h-10 items-center justify-center gap-1.5 !rounded-xl text-[13.5px]"><Zap className="h-4 w-4 fill-current" />Yükselt</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <AuthDugmeleri pencere blok className="col-span-2" onTik={() => setMenu(false)} />
                  </div>
                )}

                <BolumEtiket className="mt-6">Üret</BolumEtiket>
                <div role="tablist" aria-label="Üretim türü" className="grid grid-cols-4 gap-1 rounded-2xl bg-black/30 p-1 ring-1 ring-inset ring-white/[0.06]">
                  {TUR_SIRA.map((k) => {
                    const m = TUR_MENU[k];
                    const secili = tur === k;
                    return (
                      <button key={k} role="tab" aria-selected={secili} onClick={() => setTur(k)}
                        className={cn("relative flex flex-col items-center gap-1 rounded-xl py-2 text-[12px] font-medium transition-colors", secili ? "text-white" : "text-white/55")}>
                        {secili && <motion.span layoutId="mobilTur" className="glass-cip absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                        <CamKaro ikon={m.ikon} renk={TUR_RENK[k]} boyut={32} className="relative" />
                        <span className="relative">{k === "ses" ? "Ses" : m.baslik}</span>
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={tur} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="mt-2.5">
                    <Link href={TUR_MENU[tur].studyo} onClick={() => setMenu(false)}
                      className="relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 ring-1 ring-inset active:opacity-80"
                      style={{ "--tw-ring-color": `${TUR_RENK[tur]}40` } as React.CSSProperties}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={TUR_MENU[tur].giris.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                      <span className="absolute inset-0" style={{ background: `linear-gradient(95deg, #0b0b0d 15%, #0b0b0dcc 50%, ${TUR_RENK[tur]}22)` }} />
                      <CamKaro ikon={TUR_MENU[tur].ikon} renk={TUR_RENK[tur]} boyut={40} className="relative rounded-xl" />
                      <span className="relative min-w-0 flex-1">
                        <span className="block text-[14.5px] font-semibold text-white">{TUR_MENU[tur].giris.ad}</span>
                        <span className="block truncate text-[12px] text-white/60">{TUR_MENU[tur].giris.aciklama}</span>
                      </span>
                      <ArrowRight className="relative h-4 w-4 shrink-0 text-white/70" />
                    </Link>
                    <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-3">
                      {TUR_MENU[tur].araclar.map((a) => (
                        <Link key={a.ad} href={a.href} onClick={() => setMenu(false)} className="min-w-0 active:opacity-80">
                          <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />
                            {a.rozet && <Rozet sinif="absolute left-1.5 top-1.5 bg-black/55 backdrop-blur">{a.rozet}</Rozet>}
                          </span>
                          <span className="mt-1.5 block truncate px-0.5 text-[12.5px] font-medium leading-tight text-white/95">{a.ad}</span>
                          <span className="block truncate px-0.5 text-[11px] leading-tight text-white/45">{a.aciklama}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mb-2.5 mt-6 flex items-center justify-between">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Stüdyolar</p>
                  <Link href="/panel/sinema" onClick={() => setMenu(false)} className="flex items-center gap-1 text-[12.5px] font-medium text-vurgu-acik">Sinema Stüdyosu<ArrowRight className="h-3 w-3" /></Link>
                </div>
                <div className="-mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                  {STUDYOLAR.map((s) => (
                    <Link key={s.href} href={s.href} onClick={() => setMenu(false)} className="w-[150px] shrink-0 snap-start">
                      <span className="relative block aspect-[16/11] overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.07]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {s.rozet && <Rozet sinif="absolute left-1.5 top-1.5 bg-black/55 backdrop-blur">{s.rozet}</Rozet>}
                      </span>
                      <span className="mt-1.5 block truncate text-[13px] font-medium text-white">{s.ad}</span>
                      <span className="block truncate text-[11.5px] text-white/45">{s.aciklama}</span>
                    </Link>
                  ))}
                </div>

                <BolumEtiket className="mt-6">Keşfet</BolumEtiket>
                <div className="grid grid-cols-2 gap-2">
                  {HIZLI.map((h) => {
                    const aktif = path.startsWith(h.href);
                    return (
                      <Link key={h.href} href={h.href} onClick={() => setMenu(false)} aria-current={aktif ? "page" : undefined}
                        className={cn("flex h-12 items-center gap-2.5 rounded-xl px-2 text-[14px] font-medium ring-1 ring-inset", aktif ? "bg-vurgu/[0.08] text-white ring-vurgu/40" : "bg-white/[0.025] text-white/85 ring-white/[0.06] active:bg-white/[0.06]")}>
                        <CamKaro ikon={h.ikon} renk={h.renk} boyut={32} />{h.ad}
                      </Link>
                    );
                  })}
                </div>

                <BolumEtiket className="mt-6">Hesap ve destek</BolumEtiket>
                <div className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                  {[
                    ...(girisli ? [{ ad: "Ayarlar", href: "/panel/ayarlar", ikon: Settings }] : []),
                    { ad: "Yardım merkezi", href: "/sss", ikon: HelpCircle },
                    { ad: "Fiyatlandırma", href: "/fiyatlandirma", ikon: Coins },
                  ].map((a) => (
                    <Link key={a.href} href={a.href} onClick={() => setMenu(false)} className="flex h-14 items-center gap-3 px-3 text-[14.5px] text-white/90 active:bg-white/[0.04]">
                      <span className="glass-ikon flex h-8 w-8 items-center justify-center rounded-lg text-white/65"><a.ikon className="h-4 w-4" strokeWidth={1.9} /></span><span className="flex-1">{a.ad}</span><ChevronRight className="h-4 w-4 text-white/30" />
                    </Link>
                  ))}
                  <Link href="/durum" onClick={() => setMenu(false)} className="flex h-14 items-center gap-3 px-3 text-[14.5px] text-white/90 active:bg-white/[0.04]">
                    <span className="glass-ikon flex h-8 w-8 items-center justify-center rounded-lg text-white/65"><Activity className="h-4 w-4" strokeWidth={1.9} /></span><span className="flex-1">Sistem durumu</span><ChevronRight className="h-4 w-4 text-white/30" />
                  </Link>
                </div>

                {girisli && (
                  <button onClick={() => { setMenu(false); cikisYap(); toast("Çıkış yapıldı"); router.push("/"); }}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#fb7185]/[0.06] text-[14.5px] font-medium text-[#fda4af] ring-1 ring-inset ring-[#fb7185]/20 active:bg-[#fb7185]/[0.12]">
                    <LogOut className="h-[18px] w-[18px]" />Çıkış yap
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
