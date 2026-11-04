"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight, KeyRound, Sparkles } from "lucide-react";
import { useAuth, PLAN_ADI, krediDurum } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useAyarTercih, useGorunurluk } from "@/store/useAyarTercih";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { TURLER, turModelleri } from "@/components/anasayfa/Komut";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { aileGorselleri } from "@/lib/modelGorsel";
import { guvenlikAdimlari, sonrakiYenileme, tarih } from "@/lib/ayarlar";
import { aylikFiyat, planBul, tl, sayi } from "@/lib/fiyat";
import { cn } from "@/lib/utils";
import { Avatar, useHesapKaydi } from "./AyarKabugu";
import { akis } from "./ui";

const KAPAK = "/gercek/sinirsiz/unl-kling.webp";
const PLAN_KAPAK: Record<string, string> = {
  baslangic: "/gercek/sinirsiz/unl-nano-banana-pro.webp", arti: "/gercek/sinirsiz/unl-kling.webp",
  ultra: "/gercek/sinirsiz/unl-hero-dragon.webp", kurumsal: "/gercek/sinirsiz/unl-seedance.webp",
};
const YEDEK = ["/gercek/galeri/portre4.webp", "/gercek/galeri/sinematik2.webp", "/gercek/galeri/manzara3.webp", "/gercek/galeri/soyut5.webp", "/gercek/galeri/sinematik8.webp", "/gercek/galeri/portre7.webp"];
const TUR_RENK: Record<string, string> = { video: "#55d6fd", gorsel: "#a78bfa", muzik: "#f472b6", ses: "#fbbf24", "3d": "#34d399" };
const GUN = 86_400_000;

/** Pano kartı: başlık + kısa durum, içerik; tamamı ayar sayfasına bağlantı. */
function Karo({ href, baslik, durum, children, className, i }: { href: string; baslik: string; durum?: React.ReactNode; children: React.ReactNode; className?: string; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: akis }} className={className}>
      <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08] transition-[background-color,box-shadow,transform] duration-300 hover:bg-[#151517] hover:ring-white/[0.14] active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0"><p className="text-[14px] font-semibold text-white">{baslik}</p>{durum && <p className="mt-0.5 truncate text-[12.5px] text-white/45">{durum}</p>}</div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/25 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-white/70" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </Link>
    </motion.div>
  );
}

export function GenelBakis() {
  const k = useAuth((s) => s.kullanici)!;
  const { kayit } = useHesapKaydi();
  const uretimler = useProjeler((s) => s.uretimler);
  const cop = useProjeler((s) => s.cop);
  const u = useAyarTercih((s) => s.uretim);
  const gorunurluk = useGorunurluk();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const kd = krediDurum(k);
  const adimlar = guvenlikAdimlari(kayit);
  const puan = adimlar.filter((a) => a.tamam).length;
  const ab = kayit.abonelik;
  const plan = planBul(k.plan);
  const yenileme = sonrakiYenileme(ab.baslangic, ab.donem);

  const isler = useMemo(() => {
    const l = uretimler.filter((x) => x.durum === "tamam" && x.gorselUrl && (x.gorselUrl.startsWith("/") || x.gorselUrl.startsWith("http"))).slice(0, 6).map((x) => x.gorselUrl!);
    return l.length >= 6 ? l : [...l, ...YEDEK].slice(0, 6);
  }, [uretimler]);
  // Son 14 günün gerçek kredi harcaması (stüdyo üretimleri).
  const gunler = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const bas = bugun.getTime() - (13 - i) * GUN;
      return [...uretimler, ...cop].filter((x) => !x.id.startsWith("seed_") && x.olusturma >= bas && x.olusturma < bas + GUN && x.durum !== "hata").reduce((a, x) => a + x.kredi, 0);
    });
  }, [uretimler, cop]);
  const tepe = Math.max(1, ...gunler);
  const harcama14 = gunler.reduce((a, b) => a + b, 0);
  const turAdet = useMemo(() => {
    const m: Record<string, number> = {};
    for (const x of uretimler) if (x.durum === "tamam") m[x.tur] = (m[x.tur] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [uretimler]);
  const toplamAdet = turAdet.reduce((a, [, n]) => a + n, 0);
  const gModel = useMemo(() => { const l = turModelleri(TURLER.find((t) => t.id === "gorsel")!, 8); return l.find((m) => m.ad === u.gorselModel) ?? l[0]; }, [u.gorselModel]);
  const gOrnek = gModel ? [...new Set([...(gModel.kapak ? [gModel.kapak] : []), ...aileGorselleri(gModel.aile, gModel.tur).liste])].slice(0, 2) : [];
  const profilAdim = [!!k.avatar, !!k.kullaniciAdi, !!k.slogan, !!k.bio, !!(k.website || k.sosyal?.instagram || k.sosyal?.x)];
  const profilTamam = profilAdim.filter(Boolean).length;
  const C = 2 * Math.PI * 24;

  return (
    <div className="hidden lg:block">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: akis }} className="mb-6 rounded-[22px] bg-[#121214] px-6 py-[18px] ring-1 ring-inset ring-white/[0.08]">
        <h1 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.025em] text-white">Merhaba {k.ad.split(" ")[0]}</h1>
        <p className="mt-1 text-[14px] text-white/55">Hesabının özeti. Bir karta tıkla, o ayarlara git.</p>
      </motion.header>

      <div className="grid auto-rows-[188px] grid-cols-4 gap-4">
        <Karo i={0} href="/panel/ayarlar/hesap" baslik="Hesap" durum="E-posta, giriş yöntemleri ve üyelik" className="col-span-2 row-span-2">
          <div className="relative mx-5 mt-3.5 h-[168px] overflow-hidden rounded-[14px]">
            <img src={k.kapak || KAPAK} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-3">
              <span className="rounded-full ring-2 ring-white/20"><Avatar ad={k.ad} src={k.avatar} boyut={50} /></span>
              <span><span className="block text-[17px] font-semibold text-white">{k.ad}</span><span className="block text-[13px] text-white/70">{k.email}</span></span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5 px-5">
            {isler.map((s, i) => <motion.img key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.04 }} src={s} alt="" className="aspect-square w-full rounded-[8px] object-cover" />)}
          </div>
          {/* Profil doluluğu: etiketsiz gri çubuklar anlaşılmıyordu; ne olduğunu ve kaç adım kaldığını yazar. */}
          <div className="mt-auto flex items-center gap-3 px-5 pb-4">
            <span className="shrink-0 text-[12.5px] text-white/55">{profilTamam === profilAdim.length ? "Profilin tamam" : <>Profil <span className="tabular-nums text-white">{profilTamam}/{profilAdim.length}</span></>}</span>
            <span className="flex flex-1 items-center gap-1.5">{profilAdim.map((t, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", t ? "bg-[#55d6fd]" : "bg-white/[0.08]")} />)}</span>
          </div>
        </Karo>

        <Karo i={1} href="/panel/ayarlar/kullanim" baslik="Kredi" durum={harcama14 ? `Son 14 günde ${sayi(harcama14)} kredi harcandı` : "Son 14 günde harcama yok"} className="col-span-2">
          <div className="mt-auto flex items-end justify-between gap-4 px-5 pb-4">
            <div>
              <p className="flex items-center gap-2 text-[36px] font-semibold leading-none tabular-nums tracking-[-0.035em] text-white"><KrediJeton boyut={20} />{sayi(kd.kalan)}</p>
              <p className="mt-2 text-[12.5px] text-white/45">{sayi(kd.toplam)} krediden kalan</p>
            </div>
            {harcama14 === 0 ? (
              /* Harcama yokken 14 nokta anlamsız kalıyordu: yerine dönem kredisinin ne kadarının durduğu. */
              <div className="w-[46%] max-w-[260px] pb-1">
                <p className="mb-2 flex justify-between text-[12px] text-white/45"><span>Dönem kredisi</span><span className="tabular-nums text-white/70">yüzde {Math.round((kd.kalan / Math.max(1, kd.toplam)) * 100)}</span></p>
                <span className="block h-[6px] overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, kd.kalan / Math.max(1, kd.toplam)) }} transition={{ duration: 0.9, ease: akis }} className="block h-full origin-left rounded-full bg-[#55d6fd]" /></span>
              </div>
            ) : <div className="flex h-[72px] items-end gap-[4px]" aria-hidden>
              {gunler.map((g, i) => <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.03, duration: 0.5, ease: akis }}
                className={cn("w-[10px] origin-bottom rounded-[3px]", i === gunler.length - 1 ? "bg-[#55d6fd]" : "bg-white/[0.16]")} style={{ height: Math.max(4, (g / tepe) * 72) }} />)}
            </div>}
          </div>
        </Karo>

        <Karo i={2} href="/panel/ayarlar/guvenlik" baslik="Güvenlik" durum={puan === adimlar.length ? "Hesabın iyi korunuyor" : `${adimlar.length - puan} adım kaldı`}>
          <div className="mt-auto flex items-center gap-4 px-5 pb-4">
            <span className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90"><circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <motion.circle cx="30" cy="30" r="24" fill="none" stroke={puan === adimlar.length ? "#34d399" : puan >= 2 ? "#fbbf24" : "#fb7185"} strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
                  initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - puan / adimlar.length) }} transition={{ duration: 1, ease: akis }} /></svg>
              <span className="text-[14px] font-semibold tabular-nums text-white">{puan}/{adimlar.length}</span>
            </span>
            <ul className="min-w-0 space-y-1 text-[12.5px]">
              {adimlar.slice(0, 3).map((a) => <li key={a.id} className={cn("flex items-center gap-1.5 truncate", a.tamam ? "text-white/50" : "text-white")}>{a.tamam ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <span className="mx-[3px] h-2 w-2 shrink-0 rounded-full bg-amber-300" />}{({ sifre: "Şifre", "2fa": "İki adımlı", yedek: "Yedek kodlar" } as Record<string, string>)[a.id] ?? a.ad}</li>)}
            </ul>
          </div>
        </Karo>

        <Karo i={3} href="/panel/ayarlar/abonelik" baslik="Plan" durum={`${tarih(yenileme)} yenilenir`}>
          <div className="relative mx-5 mb-4 mt-auto h-[96px] overflow-hidden rounded-[12px]">
            <img src={PLAN_KAPAK[k.plan] ?? KAPAK} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[16px] font-semibold text-white">{PLAN_ADI[k.plan]}</span>
            {plan && k.plan !== "kurumsal" && <span className="absolute bottom-2 right-3 text-[13px] font-medium tabular-nums text-white/85">{tl(aylikFiyat(plan, ab.donem))} / ay</span>}
          </div>
        </Karo>

        <Karo i={4} href="/panel/ayarlar/uretim" baslik="Üretim varsayılanları" durum="Görsel stüdyosu böyle açılır" className="col-span-2">
          <div className="mt-auto flex items-end gap-3 px-5 pb-4">
            {gOrnek.map((s) => <img key={s} src={s} alt="" className="h-[92px] w-[124px] rounded-[10px] object-cover" />)}
            <div className="ml-1 flex flex-col items-start gap-1.5">
              {gModel && <span className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.07] pl-1 pr-2.5 text-[12px] font-medium text-white"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10"><ModelLogo ad={gModel.ad} boyut={11} /></span>{gModel.ad}</span>}
              <span className="flex h-7 items-center rounded-full bg-white/[0.07] px-2.5 text-[12px] font-medium tabular-nums text-white">{u.oran} · {u.adet} görsel</span>
              {u.gelistir && <span className="flex h-7 items-center gap-1 rounded-full bg-[#55d6fd]/12 px-2.5 text-[12px] font-medium text-[#55d6fd]"><Sparkles className="h-3 w-3" />İstemi geliştir</span>}
            </div>
          </div>
        </Karo>

        <Karo i={5} href="/panel/ayarlar/depolama" baslik="Depolama" durum={`${sayi(toplamAdet)} dosya${cop.length ? `, çöpte ${cop.length}` : ""}`}>
          <div className="mt-auto px-5 pb-4">
            <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/[0.06]">
              {turAdet.map(([t, n], i) => <motion.span key={t} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 + i * 0.05, ease: akis }} className="h-full origin-left" style={{ flexGrow: n, background: TUR_RENK[t] ?? "#888" }} />)}
            </div>
            <p className="mt-3 text-[12.5px] text-white/45">Yeni üretimler {{ ozel: "özel", baglanti: "bağlantıyla", acik: "herkese açık" }[gorunurluk]}</p>
          </div>
        </Karo>

        <Karo i={6} href="/panel/ayarlar/gelistirici" baslik="API ve MCP" durum={anahtarlar.length ? `${anahtarlar.length} anahtar` : "Anahtar yok"}>
          <div className="mt-auto flex items-center gap-2 px-5 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.06]"><KeyRound className="h-5 w-5 text-white/70" /></span>
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#f5f0e8]"><img src="/marka/renkli/claude-color.svg" alt="Claude" className="h-6 w-6" /></span>
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white"><img src="/marka/renkli/cursor.svg" alt="Cursor" className="h-6 w-6" /></span>
            <span className="ml-1 text-[12.5px] leading-snug text-white/45">Claude, Cursor ve VS Code ile bağlan</span>
          </div>
        </Karo>
      </div>
    </div>
  );
}
