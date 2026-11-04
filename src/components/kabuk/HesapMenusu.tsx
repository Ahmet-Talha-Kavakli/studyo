"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, FolderKanban, Gauge, HelpCircle, Infinity, LogOut, Play, Plus, Receipt, Settings, Sparkles, type LucideIcon } from "lucide-react";
import { useAuth, krediDurum, PLAN_ADI, PLAN_AYLIK_KREDI } from "@/store/useAuth";
import { useHesap } from "@/store/useHesap";
import { useProjeler } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { sonrakiYenileme } from "@/lib/ayarlar";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";

/**
 * Hesap menüsü — "E · Son işler" (Krea/Higgsfield dili).
 *
 *  [avatar] Ad / e-posta                 kimlik → profil
 *  ┌ [✦] 551.446 kredi               (+) ┐  bakiye + yuvarlak kredi yükle
 *  │     Artı · 20 Kasım'da yenilenir    │  son 7 günün harcaması gerçek üretim kayıtlarından
 *  │ ━━━━━━━━━━━━━━━━━━━━━━  %99 kaldı    │
 *  ├ ⚡ Ultra'ya yükselt               →  ┤  parlayan şerit (en üst planda yok)
 *  ├ Son üretimler              Kitaplık › ┤  son 5 gerçek çıktı
 *  └ satırlar · altta durum + çıkış
 */

const ODAK = "outline-none focus-visible:ring-2 focus-visible:ring-aksan/70";
const EASE = [0.22, 1, 0.36, 1] as const;
const GERCEK = /^(\/|https?:|data:image|blob:)/;
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
/* "28 Kasım'da": ay adına uyan bulunma eki. */
const AY = ["Ocak'ta", "Şubat'ta", "Mart'ta", "Nisan'da", "Mayıs'ta", "Haziran'da", "Temmuz'da", "Ağustos'ta", "Eylül'de", "Ekim'de", "Kasım'da", "Aralık'ta"];
const gunAy = (n: number) => { const d = new Date(n); return `${d.getDate()} ${AY[d.getMonth()]}`; };

function Satir({ href, ad, ikon: I, sag, onTik, ilk }: { href: string; ad: string; ikon: LucideIcon; sag?: React.ReactNode; onTik: () => void; ilk?: boolean }) {
  return (
    <Link href={href} data-gez role="menuitem" onClick={onTik}
      className={cn("group relative flex h-[38px] items-center gap-3 rounded-[11px] px-2.5 transition-colors hover:bg-white/[0.06] active:bg-white/[0.09]", ODAK)}>
      <I className="h-[17px] w-[17px] shrink-0 text-white/75 transition-colors group-hover:text-white" strokeWidth={1.9} />
      <span className="flex-1 truncate text-[14px] font-medium text-white/95 transition-colors group-hover:text-white">{ad}</span>
      {sag}
      <ChevronRight className="h-[15px] w-[15px] shrink-0 text-white/35 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-white/50" strokeWidth={2.2} />
      {!ilk && <span aria-hidden className="pointer-events-none absolute left-[38px] right-2.5 top-0 h-px bg-white/[0.06] transition-opacity group-hover:opacity-0" />}
    </Link>
  );
}

export function HesapMenusu({ kapat, git, onCikis }: { kapat: () => void; git: (href: string) => void; onCikis: () => void }) {
  const kullanici = useAuth((s) => s.kullanici);
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);
  const az = kredi.oran < 0.2;
  const sonraki = kullanici?.plan === "baslangic" ? "arti" : kullanici?.plan === "arti" ? "ultra" : null;
  const uretimler = useProjeler((s) => s.uretimler);
  const projeSayisi = useProje((s) => s.projeler.length);
  const abonelik = useHesap((h) => (kullanici?.email ? h.hesaplar[kullanici.email.toLowerCase()]?.abonelik : undefined));

  const yenileme = useMemo(() => {
    if (!abonelik || !kullanici || kullanici.plan === "baslangic") return null;
    if (abonelik.iptal && abonelik.iptalTarihi) return `${gunAy(abonelik.iptalTarihi)} sona erer`;
    return `${gunAy(sonrakiYenileme(abonelik.baslangic, abonelik.donem))} yenilenir`;
  }, [abonelik, kullanici]);

  /* Son 7 günün harcaması (bugün en sağda) ve son 5 gerçek çıktı. */
  const { haftaToplam, son } = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const gunler = Array.from({ length: 7 }, (_, i) => {
      const bas = bugun.getTime() - (6 - i) * 864e5;
      return { bas, kredi: 0 };
    });
    for (const u of uretimler) {
      if (u.durum === "hata") continue;
      const g = gunler.find((x) => u.olusturma >= x.bas && u.olusturma < x.bas + 864e5);
      if (g) g.kredi += u.kredi || 0;
    }
    const son = [...uretimler].filter((u) => u.durum === "tamam").sort((a, b) => b.olusturma - a.olusturma)
      .map((u) => ({ u, kapak: [u.thumbnailUrl, u.meta?.demoKlip?.poster, u.gorselUrl, u.muzik?.kapak].find((x) => x && GERCEK.test(x)) }))
      .filter((x) => x.kapak).slice(0, 5);
    return { haftaToplam: gunler.reduce((t, g) => t + g.kredi, 0), son };
  }, [uretimler]);

  if (!kullanici) return null;
  return (
    <>
      {/* Kimlik */}
      <Link href="/panel/ayarlar/hesap" data-gez role="menuitem" onClick={kapat}
        className={cn("group flex items-center gap-3.5 rounded-[16px] px-2 py-2.5 transition-colors hover:bg-white/[0.05]", ODAK)}>
        <KullaniciAvatar boyut={50} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[16px] font-semibold tracking-[-0.015em] text-white">{kullanici.ad}</span>
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-white/65">{kullanici.email}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-white/50" />
      </Link>

      {/* Bakiye: etiket + plan, büyük sayı + "Yükle", kalan kredi çubuğu, alt bilgi */}
      <div className="bd-kart mt-1 rounded-[18px] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/70">
            <KrediJeton boyut={14} az={az} className="kredi-isilti-yildiz" />Kalan kredi
          </span>
          <span className={cn("rounded-full px-2 py-[3px] text-[11.5px] font-semibold", az ? "bg-amber-400/[0.14] text-amber-200" : "bg-white/[0.08] text-white/85")}>
            {az ? "Kredin azalıyor" : `${PLAN_ADI[kullanici.plan ?? "baslangic"]} planı`}
          </span>
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <motion.span key={kullanici.krediler} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={cn("truncate text-[30px] font-semibold leading-none tracking-[-0.04em] tabular-nums", az ? "text-amber-100" : "text-white")}>
              {fmt(kullanici.krediler ?? 0)}
            </motion.span>
          </span>
          <button data-gez role="menuitem" onClick={() => git("/panel/kredi?sekme=kredi")}
            className={cn("group flex h-8 shrink-0 items-center gap-1 rounded-full bg-white pl-2.5 pr-3 text-[12.5px] font-semibold text-[#0b0b0d] transition-transform duration-200 hover:scale-[1.04] active:scale-95", ODAK)}>
            <Plus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.8} />Yükle
          </button>
        </div>
        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/[0.1]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, Math.round(kredi.oran * 100))}%` }} transition={{ duration: 0.9, ease: EASE }}
            className={cn("h-full rounded-full", az ? "bg-gradient-to-r from-amber-500 to-amber-200" : "bg-gradient-to-r from-[#55d6fd] to-[#c8f3ff]")} />
        </div>
        <p className="mt-2 flex justify-between gap-2 text-[12px] tabular-nums text-white/60">
          <span className="truncate">{haftaToplam ? <>Bu hafta <span className="font-medium text-white/90">{fmt(haftaToplam)}</span> harcadın</> : "Bu hafta harcama yok"}</span>
          <span className="shrink-0">{yenileme ?? `%${Math.round(kredi.oran * 100)} kaldı`}</span>
        </p>
      </div>

      {/* Yükselt: planın gerçek örnek görseli üzerinde kısa teklif (en üst planda gizli) */}
      {sonraki && (
        <button data-gez role="menuitem" onClick={() => git("/panel/kredi?sekme=plan")}
          className={cn("group relative mt-1.5 block h-[76px] w-full overflow-hidden rounded-[18px] text-left ring-1 ring-inset ring-white/[0.1] transition-transform duration-200 active:scale-[0.985]", ODAK)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sonraki === "ultra" ? "/gercek/sinirsiz/unl-hero-dragon.webp" : "/gercek/sinirsiz/unl-kling.webp"} alt=""
            className="absolute inset-0 h-full w-full object-cover object-[70%_40%] transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,12,.94)_0%,rgba(10,10,12,.78)_48%,rgba(10,10,12,.15)_100%)]" />
          <span aria-hidden className="plan-karti-parilti pointer-events-none absolute inset-0" />
          <span className="relative flex h-full items-center gap-3 px-3.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold tracking-[-0.01em] text-white">{PLAN_ADI[sonraki]}'ya yükselt</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-white/80">Ayda {fmt(PLAN_AYLIK_KREDI[sonraki])} kredi, tüm modeller</span>
            </span>
            <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.16] px-2.5 text-[12.5px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-colors duration-200 group-hover:bg-white group-hover:text-[#0b0b0d]">
              Geç<ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>
      )}

      {/* Son üretimler */}
      <div className="bd-kart mt-1.5 rounded-[18px] p-3">
        <Link href="/panel/kitaplik" data-gez role="menuitem" onClick={kapat} className={cn("group flex items-center justify-between rounded-md", ODAK)}>
          <span className="text-[13.5px] font-semibold text-white">Son üretimler</span>
          <span className="flex items-center gap-0.5 text-[12.5px] font-medium text-white/65 transition-colors group-hover:text-white">Kitaplık<ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
        {son.length ? (
          <div className="mt-2.5 grid grid-cols-5 gap-1">
            {son.map(({ u, kapak }, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.035, duration: 0.25, ease: EASE }}>
                <Link href={`/panel/kitaplik?u=${encodeURIComponent(u.id)}`} onClick={kapat} title={u.baslik || u.prompt}
                  className={cn("group relative block aspect-square overflow-hidden rounded-[9px] bg-white/[0.04]", ODAK)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kapak} alt={u.baslik || "Üretim"} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <span aria-hidden className="absolute inset-0 rounded-[9px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-shadow group-hover:shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.45)]" />
                  {u.tur === "video" && <span className="absolute bottom-1 left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/55"><Play className="h-2 w-2 fill-white text-white" /></span>}
                </Link>
              </motion.div>
            ))}
            {Array.from({ length: 5 - son.length }, (_, i) => <span key={i} className="aspect-square rounded-[9px] border border-dashed border-white/[0.08]" />)}
          </div>
        ) : (
          <Link href="/panel/gorsel" data-gez role="menuitem" onClick={kapat}
            className={cn("group mt-2.5 flex h-[52px] items-center gap-2.5 rounded-[11px] border border-dashed border-white/[0.1] px-3 transition-colors hover:border-white/20 hover:bg-white/[0.03]", ODAK)}>
            <Sparkles className="h-4 w-4 text-[#55d6fd]" />
            <span className="flex-1 text-[12.5px] text-white/60 group-hover:text-white/85">Henüz bir üretimin yok. İlk görselini üret</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Bağlantılar */}
      <div className="mt-1.5 px-0.5">
        <Satir ilk href="/panel/projeler" ad="Projeler" ikon={FolderKanban} onTik={kapat} sag={projeSayisi ? <span className="text-[12.5px] tabular-nums text-white/55">{projeSayisi}</span> : undefined} />
        <Satir href="/panel/ayarlar" ad="Ayarlar" ikon={Settings} onTik={kapat} />
        <Satir href="/panel/ayarlar/abonelik" ad="Faturalar ve abonelik" ikon={Receipt} onTik={kapat} />
        <Satir href="/panel/kredi?sekme=hiz" ad="Öncelikli hız" ikon={Gauge} onTik={kapat} />
        <Satir href="/panel/kredi?sekme=sinirsiz" ad="Sınırsız modeller" ikon={Infinity} onTik={kapat} sag={<span className="text-[12.5px] text-white/55">Ek paket</span>} />
        <Satir href="/sss" ad="Yardım merkezi" ikon={HelpCircle} onTik={kapat} />
      </div>

      {/* Alt: durum + çıkış */}
      <div className="mt-1 flex items-center border-t border-white/[0.06] px-1 pb-0.5 pt-1.5">
        <Link href="/durum" data-gez role="menuitem" onClick={kapat}
          className={cn("flex h-8 items-center gap-2 rounded-full px-2 text-[12.5px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white/85", ODAK)}>
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-[#34d399]/50" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#34d399]" /></span>
          Tüm sistemler çalışıyor
        </Link>
        <button data-gez role="menuitem" onClick={onCikis}
          className={cn("ml-auto flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-white/75 transition-colors hover:bg-[#ff453a]/[0.1] hover:text-[#ff6961]", ODAK)}>
          <LogOut className="h-3.5 w-3.5" />Çıkış yap
        </button>
      </div>
    </>
  );
}
