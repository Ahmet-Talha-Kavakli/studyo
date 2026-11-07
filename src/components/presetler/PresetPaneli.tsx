"use client";

/**
 * Preset yan paneli (2026-11-01 yenilendi): galerideki karta dokununca sağdan açılır.
 * Oynayan örnek (videosu yoksa kapak yavaşça kayar, etiketsiz), yaratıcı kartı + takip, tek sıra eylem hapları
 * (beğen, kaydet, paylaş, bildir), Ayrıntılar kartı (kullanım, süre, girdi; açıklama, gereken fotoğraf, yaratıcı payı,
 * kategoriler, istem), yaratıcının diğer presetleri ve benzerleri; altta tek beyaz "Bu efekti kullan · N kredi".
 * Bedel yalnız alttaki düğmede görünür (aynı bilgi iki yerde yok).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Bookmark, Check, ChevronDown, Copy, EyeOff, Flag, Heart, Link2, Lock, Play, Share2, Sparkles, UserPlus, X } from "lucide-react";
import { usePresetler } from "@/store/usePresetler";
import { KATEGORI_AD, type KatalogPreset } from "@/lib/presetKatalog";
import { sayiKisa, yaraticiBul, yaraticiPayi } from "@/lib/presetTopluluk";
import { KrediJeton } from "@/components/ui/KrediHap";
import { Yuzen } from "@/components/ui/Yuzen";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { PresetKapak } from "./PresetKarti";
import { GIRDI, presetGirdi, usePresetOturum } from "./presetOrtak";

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
const BILDIRIM = ["Uygunsuz içerik", "Telif ya da marka ihlali", "Yanıltıcı örnek", "Spam ya da kopya"];

/** Yaratıcı avatarı: Vayra için beyaz işaret, toplulukta yaratıcının tonundan degrade baş harf. */
export function YaraticiAvatar({ yazar, boyut = 20, className }: { yazar?: string; boyut?: number; className?: string }) {
  if (!yazar) return <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-white text-[#0a0a0b]", className)} style={{ width: boyut, height: boyut }}><Sparkles style={{ width: boyut * 0.55, height: boyut * 0.55 }} /></span>;
  const y = yaraticiBul(yazar);
  const ton = y?.ton ?? [...yazar].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: boyut, height: boyut, fontSize: boyut * 0.42, background: `linear-gradient(140deg, hsl(${ton} 72% 62%), hsl(${(ton + 50) % 360} 70% 42%))` }}>
      {(y?.ad ?? yazar.slice(1)).slice(0, 1).toLocaleUpperCase("tr")}
    </span>
  );
}

export function PresetPaneli({ p, tumu, benimTutamac, onKapat, onSec, onYaratici }: {
  p: KatalogPreset; tumu: KatalogPreset[]; benimTutamac: string;
  onKapat: () => void; onSec: (p: KatalogPreset) => void; onYaratici: (yazar: string) => void;
}) {
  const { kayitli, begenilen, takip, kayitDegis, begeniDegis, takipDegis, bildir, bildirGeriAl } = usePresetler();
  const foto = usePresetOturum((s) => s.foto);
  const [istemAcik, setIstemAcik] = useState(false);
  const [bildirAcik, setBildirAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const govdeRef = useRef<HTMLDivElement>(null);
  const yaratici = yaraticiBul(p.yazar);
  const benim = p.yazar === benimTutamac;
  const begendi = begenilen.includes(p.slug), kaydetti = kayitli.includes(p.slug), takipte = !!p.yazar && takip.includes(p.yazar);
  const girdi = GIRDI[presetGirdi(p)];
  const ek = p.ekKredi ?? 0;
  const adres = `/panel/presetler/${p.slug}`;

  useEffect(() => { govdeRef.current?.scrollTo({ top: 0 }); setIstemAcik(false); }, [p.slug]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !bildirAcik && !paylasAcik) onKapat(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onKapat, bildirAcik, paylasAcik]);

  const ayniYazar = useMemo(() => tumu.filter((x) => x.slug !== p.slug && x.yazar === p.yazar && !x.taslak).slice(0, 6), [tumu, p]);
  const benzer = useMemo(() => tumu.filter((x) => x.slug !== p.slug && !x.taslak && x.yazar !== p.yazar && x.kategoriler.some((k) => k !== "VIRAL" && p.kategoriler.includes(k))).slice(0, 6), [tumu, p]);

  const begen = () => { const v = begeniDegis(p.slug); if (v) toast.success("Beğendin", { description: p.ad }); };
  const kaydet = () => { const v = kayitDegis(p.slug); toast.success(v ? "Kaydedilenlere eklendi" : "Kaydedilenlerden çıkarıldı", { description: p.ad }); };
  const takipEt = () => { if (!p.yazar) return; const v = takipDegis(p.yazar); toast.success(v ? `${yaratici?.ad ?? p.yazar} takip ediliyor` : "Takipten çıkıldı", { description: v ? "Yeni presetleri Takip görünümünde toplanır." : p.yazar }); };
  const tamAdres = () => (typeof window === "undefined" ? adres : `${window.location.origin}${adres}`);
  const kopyala = async () => { try { await navigator.clipboard.writeText(tamAdres()); toast.success("Bağlantı kopyalandı", { description: p.ad }); } catch { toast.error("Kopyalanamadı"); } setPaylasAcik(false); };
  const sistemPaylas = async () => { try { await navigator.share({ title: p.ad, text: `${p.ad}: Vayra preseti`, url: tamAdres() }); } catch { /* vazgeçildi */ } setPaylasAcik(false); };
  const menuSatir = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white hover:bg-white/[0.06]";

  return (
    <>
      <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="fixed inset-0 top-[var(--ust-nav)] z-[60] bg-black/45 lg:bg-black/25" aria-hidden />
      <motion.aside key="panel" role="dialog" aria-label={p.ad} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
        className="fixed bottom-0 right-0 top-[var(--ust-nav)] z-[61] flex w-[min(460px,100vw)] flex-col border-l border-white/[0.08] bg-[#0f1012]">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] pl-4 pr-2.5">
          <p lang="en" className="min-w-0 flex-1 truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">{p.ad}</p>
          <Link href={adres} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-white/75 transition hover:bg-white/[0.1] hover:text-white">Tam sayfa<ArrowRight className="h-3.5 w-3.5" /></Link>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.08] hover:text-white active:scale-90"><X className="h-4 w-4" /></button>
        </header>

        <div ref={govdeRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          {/* Örnek */}
          <div className="p-4 pb-0">
            <div className="relative mx-auto aspect-[4/5] max-h-[54vh] overflow-hidden rounded-[22px] bg-[#111113] ring-1 ring-inset ring-white/[0.07]">
              <AnimatePresence initial={false} mode="wait">
                <motion.span key={p.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                  <span className={cn("absolute inset-0 block", !p.video && "preset-kb")}><PresetKapak p={p} /></span>
                  {p.video && <video src={p.video} poster={p.kapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
                </motion.span>
              </AnimatePresence>
              <span className="absolute left-3 top-3 flex gap-1.5">
                {p.etiket === "Yeni" && <Hap><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yeni</Hap>}
                {p.pro && <Hap>Pro</Hap>}
                {p.taslak && <Hap>Taslak</Hap>}
              </span>
              {p.video && <span className="absolute bottom-3 left-3"><Hap><Play className="h-3 w-3 fill-current" />Efekt videosu · {p.sureSn} sn</Hap></span>}
            </div>
          </div>

          {/* Yaratıcı */}
          <section className="mx-4 mt-3 flex items-center gap-3 rounded-[18px] bg-white/[0.035] p-2.5 pl-3 ring-1 ring-inset ring-white/[0.07]">
            <button onClick={() => p.yazar && onYaratici(p.yazar)} disabled={!p.yazar} className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-default">
              <YaraticiAvatar yazar={p.yazar} boyut={40} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[14.5px] font-semibold text-white"><span className="truncate">{p.yazar ? (benim ? "Sen" : yaratici?.ad ?? p.yazar) : "Vayra"}</span>{(!p.yazar || yaratici?.dogrulanmis) && <BadgeCheck className="h-4 w-4 shrink-0 text-white" />}</span>
                <span className="block truncate text-[12.5px] text-white/55">{p.yazar ? p.yazar : "Resmi Vayra efekti"}</span>
              </span>
            </button>
          </section>

          {/* Eylemler: tek sıra hap */}
          <section className="mt-2.5 flex gap-1.5 px-4">
            <Eylem aktif={kaydetti} onClick={kaydet} aria="Kaydet"><Bookmark className={cn("h-4 w-4", kaydetti && "fill-current")} />{kaydetti ? "Kaydedildi" : "Kaydet"}</Eylem>
            <div className="relative flex">
              <Eylem onClick={() => setPaylasAcik((v) => !v)} aria="Paylaş"><Share2 className="h-4 w-4" />Paylaş</Eylem>
              <Yuzen acik={paylasAcik} onKapat={() => setPaylasAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Paylaş" className="w-[240px] rounded-[16px] border border-white/[0.09] bg-[#18191c] p-1.5">
                <button onClick={() => void kopyala()} className={menuSatir}><Copy className="h-4 w-4 text-white/60" />Bağlantıyı kopyala</button>
                {typeof navigator !== "undefined" && "share" in navigator && <button onClick={() => void sistemPaylas()} className={menuSatir}><Share2 className="h-4 w-4 text-white/60" />Uygulamayla paylaş</button>}
                <a href={`https://x.com/intent/post?text=${encodeURIComponent(`${p.ad}: Vayra preseti`)}&url=${encodeURIComponent(tamAdres())}`} target="_blank" rel="noreferrer" onClick={() => setPaylasAcik(false)} className={menuSatir}><Link2 className="h-4 w-4 text-white/60" />X&apos;te paylaş</a>
              </Yuzen>
            </div>
            {p.yazar && !benim && (
              <div className="relative ml-auto">
                <button onClick={() => setBildirAcik((v) => !v)} aria-label="Bildir" title="Bildir" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-white/60 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.09] hover:text-white active:scale-95"><Flag className="h-4 w-4" /></button>
                <Yuzen acik={bildirAcik} onKapat={() => setBildirAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Bildir" className="w-[260px] rounded-[16px] border border-white/[0.09] bg-[#18191c] p-1.5">
                  <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-white">Neden bildiriyorsun?</p>
                  {BILDIRIM.map((x) => (
                    <button key={x} onClick={() => {
                      setBildirAcik(false); bildir(p.slug); onKapat();
                      // Bildirim destek kaydı olarak sunucuya gider (yönetim paneli, Destek); gitmezse "inceleyecek" denmez.
                      const k = useAuth.getState().kullanici;
                      const geri = { label: "Geri al", onClick: () => bildirGeriAl(p.slug) };
                      if (!k?.email) return void toast("Preset akışından kaldırıldı", { description: "Ekibe iletmek için giriş yapman gerekiyor.", action: geri });
                      void fetch("/api/iletisim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: k.ad && k.ad.length >= 2 ? k.ad : "Vayra kullanıcısı", email: k.email, konu: "Geri bildirim", mesaj: `Preset bildirimi: ${p.ad} (${p.slug}). Neden: ${x}.`, detay: { tur: "preset-bildirimi", slug: p.slug, neden: x } }) })
                        .then((r) => r.ok ? toast.success("Bildirimin ekibe iletildi", { description: "Preset senin akışından kaldırıldı.", action: geri }) : toast.error("Bildirim iletilemedi", { description: "Preset senin akışından kaldırıldı; ekibe ulaşmadı. Yeniden dene.", action: geri }))
                        .catch(() => toast.error("Bildirim iletilemedi", { description: "Sunucuya ulaşılamadı.", action: geri }));
                    }}
                      className="flex w-full items-center rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/85 hover:bg-white/[0.06] hover:text-white">{x}</button>
                  ))}
                </Yuzen>
              </div>
            )}
          </section>

          {/* Ayrıntılar */}
          <section className="mx-4 mt-3 overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <dl className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
              {([...(p.kullanimSayi ? [["Kullanım", sayiKisa(p.kullanimSayi)] as const] : []), ["Süre", `${p.sureSn} sn`], ["Girdi", girdi.ad]] as const).map(([k, v]) => (
                <div key={k} className="px-3 py-2.5"><dt className="text-[11.5px] text-white/45">{k}</dt><dd className="mt-0.5 truncate text-[14px] font-semibold tabular-nums text-white">{v}</dd></div>
              ))}
            </dl>
            <div className="space-y-3 p-3.5">
              <p className="text-[13.5px] leading-relaxed text-white/80">{p.aciklama}</p>
              <div className="flex items-start gap-2.5 rounded-[12px] bg-white/[0.035] p-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white"><girdi.ikon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[13px] font-medium text-white">{girdi.slot} fotoğrafı gerekir</span><span className="block text-[12px] leading-snug text-white/55">{girdi.iyi}</span></span>
              </div>
              <div className="flex flex-wrap gap-1.5">{p.kategoriler.map((k) => <span key={k} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] text-white/65">{KATEGORI_AD[k] ?? k}</span>)}</div>
            </div>
            <div className="border-t border-white/[0.06]">
              {p.istemGorunur === false && !benim ? (
                <p className="flex items-center gap-2 px-3.5 py-3 text-[12.5px] text-white/50"><EyeOff className="h-4 w-4" />Yaratıcı istemi gizli tutuyor; yalnız sonucu görürsün.</p>
              ) : (
                <>
                  <button onClick={() => setIstemAcik((v) => !v)} aria-expanded={istemAcik} className="flex w-full items-center gap-2 px-3.5 py-3 text-left text-[13px] font-medium text-white/80 hover:text-white">
                    {p.istemGorunur === false ? <Lock className="h-4 w-4 text-white/50" /> : <Sparkles className="h-4 w-4 text-white/50" />}İstemi gör{p.istemGorunur === false && <span className="text-[11.5px] font-normal text-white/40">(yalnız sana görünür)</span>}
                    <ChevronDown className={cn("ml-auto h-4 w-4 text-white/45 transition-transform", istemAcik && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {istemAcik && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p lang="en" className="mx-3.5 mb-3.5 rounded-[12px] bg-black/30 p-3 text-[12px] leading-relaxed text-white/65">{p.tarif}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </section>

          {ayniYazar.length > 0 && <MiniRaf baslik={p.yazar ? `${yaratici?.ad ?? p.yazar} imzalı` : "Vayra'dan"} liste={ayniYazar} onSec={onSec}
            sag={p.yazar ? <button onClick={() => onYaratici(p.yazar!)} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12px] font-medium text-white/80 hover:bg-white/[0.1] hover:text-white">Tümü<ArrowRight className="h-3 w-3" /></button> : undefined} />}
          {benzer.length > 0 && <MiniRaf baslik="Benzer efektler" liste={benzer} onSec={onSec} />}
          <div className="h-4" />
        </div>

        {/* Kullan */}
        <footer className="shrink-0 border-t border-white/[0.06] p-3">
          <Link href={adres} className="flex h-12 w-full items-center gap-2.5 rounded-full bg-white pl-2 pr-5 text-[14.5px] font-semibold text-[#0a0a0b] transition hover:bg-white/90 active:scale-[0.98]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/[0.07]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {foto ? <img src={foto.url} alt="" className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1 truncate">{p.taslak ? "Taslağı düzenle" : foto ? "Fotoğrafınla dene" : "Bu efekti kullan"}</span>
            {!p.taslak && <span className="flex shrink-0 items-center gap-1 tabular-nums text-black/60"><KrediJeton boyut={12} />{p.kredi} kredi</span>}
          </Link>
        </footer>
      </motion.aside>
    </>
  );
}

function Hap({ children }: { children: React.ReactNode }) {
  return <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/45 px-2.5 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{children}</span>;
}

function Eylem({ children, aria, onClick, aktif }: { children: React.ReactNode; aria: string; onClick: () => void; aktif?: boolean }) {
  return (
    <button onClick={onClick} aria-label={aria} aria-pressed={aktif}
      className={cn("flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium ring-1 ring-inset transition active:scale-[0.96]",
        aktif ? "bg-white/[0.11] text-white ring-white/[0.14]" : "bg-white/[0.05] text-white/75 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white")}>
      <motion.span key={String(aktif)} initial={{ scale: 0.85, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={yay} className="flex items-center gap-1.5">{children}</motion.span>
    </button>
  );
}

function MiniRaf({ baslik, liste, onSec, sag }: { baslik: string; liste: KatalogPreset[]; onSec: (p: KatalogPreset) => void; sag?: React.ReactNode }) {
  return (
    <section className="mx-4 mt-3 overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-3.5"><p className="truncate text-[13.5px] font-semibold text-white">{baslik}</p>{sag}</div>
      <div className="grid grid-cols-3 gap-2 p-2.5">
        {liste.map((x) => (
          <button key={x.slug} onClick={() => onSec(x)} className="group text-left">
            <span className="relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-[#111113] ring-1 ring-inset ring-white/[0.06]">
              <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.05]"><PresetKapak p={x} kucuk /></span>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <span lang="en" className="absolute inset-x-2 bottom-1.5 truncate text-[12px] font-semibold text-white">{x.ad}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
