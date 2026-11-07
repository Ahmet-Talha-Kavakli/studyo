"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  BarChart3, CalendarDays, FileText, FlaskConical, Flag, Gift, Images, Link2, Loader2, Mail, MapPin, Megaphone, Palette, Radar, Search, Send, ShieldCheck, Smartphone, Swords, Target, Users, Workflow,
} from "lucide-react";
import { lansmanListesi } from "@/lib/build/buyumeKontrol";
import { bugunTR, type IcerikKanalId } from "@/lib/build/buyumeTipler";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import type { ProjeKanca } from "@/components/build/calisma/useProje";
import { BlogBolumu } from "./Blog";
import { IcerikBolumu } from "./Icerik";
import { LansmanBolumu } from "./Lansman";
import { PlanBolumu } from "./Plan";
import { ReklamBolumu } from "./Reklam";
import { TakvimBolumu } from "./Takvim";
import { KisilerBolumu } from "./Kisiler";
import { EpostaBolumu } from "./Eposta";
import { PaylasimBolumu } from "./Paylasim";
import { BaglantilarBolumu } from "./Baglantilar";
import { DeneylerBolumu } from "./Deneyler";
import { SeoBolumu } from "./Seo";
import { RakiplerBolumu } from "./Rakipler";
import { MarkaBolumu } from "./Marka";
import { KodlarBolumu } from "./Kodlar";
import { RaporBolumu } from "./Rapor";
import { OtomasyonBolumu } from "./Otomasyonlar";
import { BioBolumu } from "./Bio";
import { GorunurlukBolumu } from "./Gorunurluk";
import { GoogleIsletmeBolumu } from "./GoogleIsletme";
import { IzinlerBolumu } from "./Izinler";
import { HataSatiri, yay } from "./ortak";
import { useBuyume } from "./useBuyume";
import { useBuyumeEk } from "./useBuyumeEk";

export type BuyumeBolum = "plan" | "marka" | "rakipler" | "rapor" | "icerik" | "takvim" | "paylasim" | "blog" | "kisiler" | "eposta" | "kodlar" | "reklam" | "seo" | "baglantilar" | "deneyler" | "lansman" | "otomasyon" | "bio" | "gorunurluk" | "gbp" | "izinler";
/** Bölümler arası geçiş; İçerik'e giderken komut kutusunu doldurur. */
export type IcerikIstegi = { kanal?: IcerikKanalId; konu?: string; tarih?: string; takvimId?: string };
export type Git = (b: BuyumeBolum, istek?: IcerikIstegi) => void;
export type AyarHedefi = "seo" | "alan" | "genel";

type Oge = { id: BuyumeBolum; ad: string; ikon: typeof Target };
const GRUPLAR: { ad: string; l: Oge[] }[] = [
  { ad: "Strateji", l: [{ id: "plan", ad: "Plan", ikon: Target }, { id: "marka", ad: "Marka kiti", ikon: Palette }, { id: "rakipler", ad: "Rakipler", ikon: Swords }, { id: "rapor", ad: "Haftalık rapor", ikon: BarChart3 }] },
  { ad: "İçerik", l: [{ id: "icerik", ad: "Gönderiler", ikon: Images }, { id: "takvim", ad: "Takvim", ikon: CalendarDays }, { id: "paylasim", ad: "Paylaşım", ikon: Send }, { id: "gbp", ad: "Google İşletme", ikon: MapPin }, { id: "blog", ad: "Blog", ikon: FileText }] },
  { ad: "Kitle", l: [{ id: "kisiler", ad: "Kişiler", ikon: Users }, { id: "eposta", ad: "E-posta ve bülten", ikon: Mail }, { id: "otomasyon", ad: "Otomasyonlar", ikon: Workflow }, { id: "izinler", ad: "İzinler", ikon: ShieldCheck }, { id: "kodlar", ad: "Tavsiye ve kodlar", ikon: Gift }] },
  { ad: "Edinim", l: [{ id: "reklam", ad: "Reklam metinleri", ikon: Megaphone }, { id: "seo", ad: "SEO", ikon: Search }, { id: "gorunurluk", ad: "Yapay zekâ görünürlüğü", ikon: Radar }, { id: "bio", ad: "Bio sayfası", ikon: Smartphone }, { id: "baglantilar", ad: "Bağlantılar", ikon: Link2 }, { id: "deneyler", ad: "A/B denemeleri", ikon: FlaskConical }] },
  { ad: "Lansman", l: [{ id: "lansman", ad: "Lansman listesi", ikon: Flag }] },
];
const TUM = GRUPLAR.flatMap((g) => g.l);

/**
 * Büyüme sekmesi: yapılan siteyi ya da uygulamayı tanıtan pazarlama bölümü (Base44 Marketing Agent, Lovable growth,
 * Mailchimp, Klaviyo, Linktree, Buffer ve Semrush karşılıkları tek yerde). Görseller Vayra görsel stüdyosunda üretilir, siteye dair işler
 * Build ajanına gider; kişiler, e-posta, kısa bağlantı ve A/B denemesi Vayra Bulut verisiyle çalışır.
 */
export function BuyumeSekme({ k, ajanaGonder, ayaraGit, yayinla }: { k: ProjeKanca; ajanaGonder?: (m: string) => void; ayaraGit?: (b: AyarHedefi) => void; yayinla?: () => void }) {
  const p = k.proje as Proje;
  const b = useBuyume(p.id);
  const e = useBuyumeEk(p.id);
  const [bolum, setBolum] = useState<BuyumeBolum>("plan");
  const [istek, setIstek] = useState<IcerikIstegi | null>(null);
  useEffect(() => { try { const x = sessionStorage.getItem(`vayra-buyume-bolum-${p.id}`); if (x && TUM.some((y) => y.id === x)) setBolum(x as BuyumeBolum); } catch { /* yok */ } }, [p.id]);
  useEffect(() => { try { sessionStorage.setItem(`vayra-buyume-bolum-${p.id}`, bolum); } catch { /* yok */ } document.getElementById("build-buyume-icerik")?.scrollTo({ top: 0 }); }, [bolum, p.id]);
  const git: Git = (y, i) => { setIstek(i ?? null); setBolum(y); };

  const liste = useMemo(() => (b.veri ? lansmanListesi(p, b.veri) : []), [p, b.veri]);
  const tamam = liste.filter((x) => x.otomatik || b.veri?.kontrol[x.id]).length;
  const bugun = bugunTR();
  const saatiGelen = b.veri?.gonderiler.filter((g) => g.durum === "hazir" && g.tarih && g.tarih <= bugun).length ?? 0;
  const sayilar: Partial<Record<BuyumeBolum, string>> = {
    icerik: b.veri?.gonderiler.length ? String(b.veri.gonderiler.length) : undefined,
    lansman: liste.length ? `${tamam}/${liste.length}` : undefined,
    kisiler: e.d?.kisiler.length ? String(e.d.kisiler.length) : undefined,
    paylasim: saatiGelen ? String(saatiGelen) : undefined,
    deneyler: e.d?.ek.deneyler.some((x) => x.durum === "calisiyor") ? "Açık" : undefined,
    otomasyon: e.d?.ek.akislar?.some((x) => x.durum === "acik") ? String(e.d.ek.akislar.filter((x) => x.durum === "acik").length) : undefined,
    gorunurluk: e.d?.ek.gorunurluk?.son ? String(e.d.ek.gorunurluk.son.puan) : undefined,
  };
  const surenBolum = (id: BuyumeBolum) => (id === "eposta" && !!e.d?.ek.kampanyalar.some((x) => x.durum === "gonderiliyor")) || b.suren.some((s) => (id === "plan" ? s === "plan" : id === "icerik" ? s === "icerik" || s.startsWith("benzer:") || s.startsWith("gorsel:") : id === "reklam" ? s === "reklam" : id === "blog" ? s === "blog-konu" || s.startsWith("makale:") : false));
  const ortak = { p, b, e, git, ajanaGonder };

  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <LayoutGroup id="buyume-bolum">
        <nav className="flex w-[212px] shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] p-2 [scrollbar-width:none] max-md:w-full max-md:flex-row max-md:gap-1 max-md:overflow-x-auto max-md:overflow-y-visible max-md:border-b max-md:border-r-0">
          <div className="max-md:flex max-md:gap-1">
            {GRUPLAR.map((g, gi) => (
              <div key={g.ad} className={cn("max-md:flex max-md:gap-1", gi > 0 && "mt-3 max-md:mt-0")}>
                <p className="px-3 pb-1 text-[11.5px] font-medium text-white/35 max-md:hidden">{g.ad}</p>
                <div className="space-y-0.5 max-md:flex max-md:gap-1 max-md:space-y-0">
                  {g.l.map((x) => (
                    <button key={x.id} type="button" onClick={() => git(x.id)} className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-3 py-[7px] text-left text-[13px] transition-colors max-md:w-auto max-md:shrink-0 max-md:whitespace-nowrap", bolum === x.id ? "text-white" : "text-white/55 hover:text-white")}>
                      {bolum === x.id && <motion.span layoutId="buyume-z" transition={yay} className="absolute inset-0 rounded-[11px] bg-white/[0.08]" />}
                      <x.ikon className="relative h-4 w-4 shrink-0" /><span className="relative min-w-0 flex-1 truncate">{x.ad}</span>
                      {surenBolum(x.id) ? <Loader2 className="relative h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" />
                        : sayilar[x.id] && <span className={cn("relative shrink-0 rounded-full px-1.5 py-px text-[10.5px] tabular-nums", x.id === "paylasim" ? "bg-[#55d6fd]/[0.16] text-[#8be6ff]" : "bg-white/[0.07] text-white/55")}>{sayilar[x.id]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06] max-md:hidden">
            <p className="text-[12.5px] font-medium text-white">Büyüme ajanı</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] leading-snug text-white/50">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", b.model ? "bg-[#55d6fd]" : b.model === null ? "bg-amber-300" : "bg-white/30")} />
              {b.model ? `${b.model} ile yazıyor` : b.model === null ? "Model bağlı değil" : "Bağlanıyor"}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] leading-snug text-white/50">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", e.d?.eposta.kurulu ? "bg-[#55d6fd]" : e.d ? "bg-amber-300" : "bg-white/30")} />
              {e.d ? (e.d.eposta.kurulu ? "E-posta gönderimi açık" : "E-posta servisi kurulu değil") : "E-posta denetleniyor"}
            </p>
          </div>
        </nav>
      </LayoutGroup>
      <div id="build-buyume-icerik" className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:thin] sm:p-5">
        <div className="mx-auto max-w-[960px]">
          {b.hata && <div className="mb-3"><HataSatiri mesaj={b.hata} kapat={() => b.setHata("")} /></div>}
          {e.hata && <div className="mb-3"><HataSatiri mesaj={e.hata} kapat={() => e.setHata("")} /></div>}
          {!b.veri ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          ) : (
            <>
              {bolum === "plan" && <PlanBolumu p={p} b={b} git={git} ajanaGonder={ajanaGonder} />}
              {bolum === "icerik" && <IcerikBolumu p={p} b={b} git={git} istek={istek} istegiTuket={() => setIstek(null)} />}
              {bolum === "takvim" && <TakvimBolumu p={p} b={b} git={git} />}
              {bolum === "reklam" && <ReklamBolumu p={p} b={b} git={git} />}
              {bolum === "blog" && <BlogBolumu p={p} b={b} git={git} ajanaGonder={ajanaGonder} />}
              {bolum === "lansman" && <LansmanBolumu p={p} b={b} liste={liste} git={git} ajanaGonder={ajanaGonder} ayaraGit={ayaraGit} yayinla={yayinla} />}
              {!["plan", "icerik", "takvim", "reklam", "blog", "lansman"].includes(bolum) && (!e.d ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
              ) : (
                <>
                  {bolum === "kisiler" && <KisilerBolumu {...ortak} />}
                  {bolum === "eposta" && <EpostaBolumu {...ortak} />}
                  {bolum === "paylasim" && <PaylasimBolumu {...ortak} />}
                  {bolum === "baglantilar" && <BaglantilarBolumu {...ortak} />}
                  {bolum === "deneyler" && <DeneylerBolumu {...ortak} yayinla={yayinla} />}
                  {bolum === "seo" && <SeoBolumu {...ortak} ayaraGit={ayaraGit} />}
                  {bolum === "rakipler" && <RakiplerBolumu {...ortak} />}
                  {bolum === "marka" && <MarkaBolumu {...ortak} />}
                  {bolum === "kodlar" && <KodlarBolumu {...ortak} />}
                  {bolum === "rapor" && <RaporBolumu {...ortak} />}
                  {bolum === "otomasyon" && <OtomasyonBolumu {...ortak} />}
                  {bolum === "bio" && <BioBolumu {...ortak} />}
                  {bolum === "gorunurluk" && <GorunurlukBolumu {...ortak} />}
                  {bolum === "gbp" && <GoogleIsletmeBolumu {...ortak} />}
                  {bolum === "izinler" && <IzinlerBolumu {...ortak} />}
                </>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export type BolumProps = { p: Proje; b: import("./useBuyume").BuyumeKanca; e: import("./useBuyumeEk").EkKanca; git: Git; ajanaGonder?: (m: string) => void };
