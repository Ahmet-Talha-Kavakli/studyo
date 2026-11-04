"use client";

/**
 * Bağlı hesaplar sihirbazı (2026-10-29, seçilen "C · Sihirbaz", Apple kurulum akışı dilinde):
 * hesabı olan kullanıcı önce özet ekranını görür (bağlı hesap kartları, zarif kaldırma onayı, "Hesap ekle"),
 * sihirbaz tek ekranda tek adım ilerler: platform → kullanıcı adı → kod → bitti.
 * Solda canlı bio önizlemesi kodun yerini gösterir; Enter ilerletir, Esc geri götürür.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Check, Copy, ExternalLink, Loader2, Plus, ShieldCheck } from "lucide-react";
import { kopyala } from "@/lib/gercekEylem";
import { useEarn, type BagliHesap } from "@/store/useEarn";
import { useAuth } from "@/store/useAuth";
import { PLATFORMLAR, sayi, type Platform } from "@/lib/earn/kampanyalar";
import { hesapDogrulaIstek, useEntegrasyon } from "@/lib/earn/istemci";
import { PlatformLogo } from "@/components/earn/ortak";
import { MARKA, VARSAYILAN_AVATAR, ease, yay } from "./ortak";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PROFIL_DUZENLE: Record<Platform, string> = {
  instagram: "https://www.instagram.com/accounts/edit/",
  tiktok: "https://www.tiktok.com/profile",
  youtube: "https://studio.youtube.com/",
  x: "https://x.com/settings/profile",
};
const platformAd = (p: Platform) => PLATFORMLAR.find((x) => x.id === p)!.ad;
const ADIMLAR = ["Platform", "Kullanıcı adı", "Kod", "Bitti"];

/** Adım geçişi: ileri giderken sağdan, geri dönerken soldan kayar. */
const kay = {
  gir: (y: number) => ({ opacity: 0, x: y * 28 }),
  dur: { opacity: 1, x: 0 },
  cik: (y: number) => ({ opacity: 0, x: y * -28 }),
};

export function HesapSihirbazi() {
  const hesaplar = useEarn((s) => s.hesaplar);
  const [mod, setMod] = useState<"ozet" | "sihirbaz">(() => (useEarn.getState().hesaplar.length ? "ozet" : "sihirbaz"));
  const [sec, setSec] = useState<Platform | null>(null);
  const [yon, setYon] = useState(1);
  const h = sec ? hesaplar.find((x) => x.platform === sec) : undefined;
  const adim = !sec ? 1 : !h ? 2 : h.durum === "dogrulandi" ? 4 : 3;

  const platformSec = (p: Platform) => { setYon(1); setSec(p); };
  const geri = () => {
    setYon(-1);
    // Geri, bekleyen hesabı silmez: kod alınmış hesap platform listesinde "Kod bekleniyor" olarak kalır.
    if (adim >= 2) { setSec(null); return; }
    if (hesaplar.length) setMod("ozet");
  };
  const bitir = () => { setYon(-1); setSec(null); setMod("ozet"); };
  const yeni = () => { setYon(1); setSec(null); setMod("sihirbaz"); };

  // Esc: bir adım geri (giriş alanındayken de).
  useEffect(() => {
    if (mod !== "sihirbaz") return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("[role=dialog]")) { e.preventDefault(); geri(); } };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });

  if (mod === "ozet") return <Ozet hesaplar={hesaplar} onEkle={yeni} onAc={(p) => { setYon(1); setSec(p); setMod("sihirbaz"); }} />;

  return (
    <div className="mx-auto max-w-[880px]">
      {/* İlerleme */}
      <div className="flex items-center gap-4">
        {(adim > 1 || hesaplar.length > 0) && <button onClick={geri} aria-label="Geri" title="Geri (Esc)"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 ring-1 ring-white/[0.1] transition hover:bg-white/[0.06] hover:text-white active:scale-90">
          <ArrowLeft className="h-4 w-4" />
        </button>}
        <ol className="flex flex-1 gap-2" aria-label="Adımlar">
          {ADIMLAR.map((a, i) => (
            <li key={a} className="flex flex-1 flex-col gap-2" aria-current={adim === i + 1 ? "step" : undefined}>
              <span className="h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={false} animate={{ width: adim > i ? "100%" : "0%" }} transition={{ duration: 0.55, ease }} className="block h-full rounded-full bg-white" /></span>
              <span className={cn("hidden text-[12.5px] transition-colors duration-300 sm:block", adim === i + 1 ? "font-medium text-white" : adim > i ? "text-white/60" : "text-white/35")}>{a}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative mt-10 sm:mt-14">
        <AnimatePresence mode="wait" custom={yon} initial={false}>
          <motion.section key={adim === 1 ? "p" : `${sec}-${adim}`} custom={yon} variants={kay} initial="gir" animate="dur" exit="cik" transition={{ duration: 0.32, ease }}>
            {adim === 1 ? <PlatformAdimi hesaplar={hesaplar} onSec={platformSec} /> : (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] md:items-center md:gap-12">
                <div className="order-2 md:order-1"><BioOnizleme platform={sec!} hesap={h} /></div>
                <div className="relative z-10 order-1 md:order-2">
                  {adim === 2 && <KullaniciAdi platform={sec!} />}
                  {adim === 3 && h && <KodAdimi hesap={h} />}
                  {adim === 4 && h && <Bitti hesap={h} onBitir={bitir} onYeni={yeni} kalan={PLATFORMLAR.length - hesaplar.filter((x) => x.durum === "dogrulandi").length} />}
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
      <p className="relative z-10 mt-12 flex items-center justify-center gap-2 text-center text-[13px] text-white/45"><ShieldCheck className="h-4 w-4 shrink-0" />Şifreni ya da hesap erişimini istemiyoruz; yalnızca profil açıklamandaki kodu okuyoruz.</p>
    </div>
  );
}

/* ── Adım 1: platform ── */
function PlatformAdimi({ hesaplar, onSec }: { hesaplar: BagliHesap[]; onSec: (p: Platform) => void }) {
  const ent = useEntegrasyon();
  return (
    <div>
      <h1 className="text-center text-[32px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[42px]">Hangi hesabını bağlayalım?</h1>
      <p className="mx-auto mt-3 max-w-[480px] text-center text-[15.5px] leading-relaxed text-white/60">Kampanyalara bu hesaplardan gönderi yapacaksın. Profil açıklamana ekleyeceğin kısa bir kod yeter.</p>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {PLATFORMLAR.map((p, i) => {
          const x = hesaplar.find((y) => y.platform === p.id);
          const ok = x?.durum === "dogrulandi";
          return (
            <motion.button key={p.id} onClick={() => onSec(p.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease }}
              className="group relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#0f1013] ring-1 ring-white/[0.08] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:ring-white/[0.22] focus-visible:ring-white/[0.5] active:scale-[0.98] sm:aspect-square">
              <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" style={{ background: `radial-gradient(70% 70% at 50% 35%, ${MARKA[p.id].isik}, transparent)` }} aria-hidden />
              <span className="relative transition-transform duration-500 group-hover:scale-110"><PlatformLogo id={p.id} boyut={44} /></span>
              <span className="relative mt-4 text-[16px] font-semibold text-white">{p.ad}</span>
              <span className="relative mt-1 text-[12.5px] text-white/45">{ok ? `@${x!.kadi}` : x ? "Kod bekleniyor" : ent ? (ent.dogrulama[p.id] ? "Otomatik doğrulama" : "Ekip doğrular") : "Bio koduyla"}</span>
              {ok && <span className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#55d6fd]/15 text-[#8fe6ff] ring-1 ring-[#55d6fd]/30"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Adım 2: kullanıcı adı ── */
function KullaniciAdi({ platform }: { platform: Platform }) {
  const { hesapEkle } = useEarn();
  const [kadi, setKadi] = useState("");
  const girdi = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => girdi.current?.focus(), 320); return () => clearTimeout(t); }, []);
  const temiz = kadi.replace(/^@/, "").trim();
  const gecerli = /^[\w.]{2,30}$/.test(temiz);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (gecerli) hesapEkle(platform, temiz); }}>
      <p className="flex items-center gap-2 text-[13.5px] text-white/55"><PlatformLogo id={platform} boyut={16} />{platformAd(platform)}</p>
      <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[32px]">Kullanıcı adın ne?</h2>
      <label className="mt-6 flex h-14 items-center rounded-[18px] bg-black/30 ring-1 ring-white/[0.12] transition focus-within:bg-black/40 focus-within:ring-white/[0.35]">
        <span className="pl-5 text-[18px] text-white/40">@</span>
        <input ref={girdi} value={kadi} onChange={(e) => setKadi(e.target.value)} placeholder="kullaniciadi" autoComplete="off" spellCheck={false} aria-label={`${platformAd(platform)} kullanıcı adı`}
          className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-[18px] text-white outline-none placeholder:text-white/25" />
        <AnimatePresence>{gecerli && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={yay} className="mr-4 flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.1]"><Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /></motion.span>}</AnimatePresence>
      </label>
      <p className={cn("mt-2.5 text-[13px] transition-colors", kadi && !gecerli ? "text-rose-300" : "text-white/45")}>{kadi && !gecerli ? "Yalnız harf, rakam, nokta ve alt çizgi; 2 ile 30 karakter." : "Sana bu hesaba özel bir kod vereceğiz."}</p>
      <button disabled={!gecerli} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.07] disabled:text-white/35">
        Kodu al<ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-[12px] text-white/35">Enter ile devam et, Esc ile geri dön</p>
    </form>
  );
}

/* ── Adım 3: kod + doğrula ── */
function KodAdimi({ hesap }: { hesap: BagliHesap }) {
  const { hesapGuncelle } = useEarn();
  const [kopyalandi, setKopyalandi] = useState(false);
  const p = hesap.platform, ad = platformAd(p);
  const bekle = hesap.durum === "dogrulaniyor";

  const dogrula = async () => {
    hesapGuncelle(p, { durum: "dogrulaniyor", hata: undefined });
    const r = await hesapDogrulaIstek(p, hesap.kadi, hesap.kod);
    if (!r.ok) { hesapGuncelle(p, { durum: "bekliyor", hata: r.hata ?? "Doğrulama yapılamadı. Biraz sonra tekrar dene." }); return; }
    if (!r.gercek) {
      // Bu platform için otomatik doğrulama kapalı: hesap, kreatör ekibinin elle kontrolüne kadar bağlı sayılır.
      hesapGuncelle(p, { durum: "dogrulandi", gercek: false, takipci: 0 });
      toast.success(`${ad} hesabın bağlandı`, { description: "Bio kodun ilk incelemede ekip tarafından kontrol edilecek." });
      return;
    }
    if (!r.bulundu) { hesapGuncelle(p, { durum: "bekliyor", hata: r.hata ?? `@${hesap.kadi} adında bir ${ad} hesabı bulunamadı.` }); return; }
    if (!r.kodVar) { hesapGuncelle(p, { durum: "bekliyor", hata: `${hesap.kod} kodu @${hesap.kadi} profil açıklamasında bulunamadı. Profili kaydettiğinden emin ol; değişiklik birkaç dakikada yansıyabilir.` }); return; }
    hesapGuncelle(p, { durum: "dogrulandi", gercek: true, takipci: r.takipci ?? 0, ad: r.ad, hata: undefined });
    toast.success(`${ad} hesabın doğrulandı`, { description: `@${hesap.kadi}, ${sayi(r.takipci ?? 0)} takipçi.` });
  };

  return (
    <div onKeyDown={(e) => { if (e.key === "Enter" && !bekle && (e.target as HTMLElement).tagName !== "A") { e.preventDefault(); void dogrula(); } }}>
      <p className="flex items-center gap-2 text-[13.5px] text-white/55"><PlatformLogo id={p} boyut={16} />@{hesap.kadi}</p>
      <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[32px]">Kodu profil açıklamana ekle</h2>
      <button type="button" autoFocus onClick={async () => { if (await kopyala(hesap.kod, "Kod kopyalandı", `${ad} profil açıklamana yapıştır.`)) { setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1800); } }}
        className="group mt-6 flex h-16 w-full items-center justify-between rounded-[18px] bg-black/30 pl-5 pr-2 ring-1 ring-white/[0.12] transition hover:ring-white/[0.28] focus-visible:ring-white/[0.45] active:scale-[0.99]">
        <span className="text-[24px] font-semibold tracking-[0.14em] text-white">{hesap.kod}</span>
        <span className={cn("flex h-11 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", kopyalandi ? "bg-[#55d6fd]/15 text-[#8fe6ff]" : "bg-white/[0.08] text-white group-hover:bg-white group-hover:text-black")}>
          <AnimatePresence mode="wait" initial={false}>{kopyalandi ? <motion.span key="o" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-1.5"><Check className="h-4 w-4" strokeWidth={3} />Kopyalandı</motion.span> : <motion.span key="k" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-1.5"><Copy className="h-4 w-4" />Kopyala</motion.span>}</AnimatePresence>
        </span>
      </button>
      <ol className="mt-5 space-y-2.5 text-[14px] text-white/70">
        <li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">1</span><span>Kodu kopyala ve <a href={PROFIL_DUZENLE[p]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-white underline decoration-white/25 underline-offset-4 hover:decoration-white">{ad} profilinde<ExternalLink className="h-3 w-3" /></a> açıklamanın herhangi bir yerine yapıştır.</span></li>
        <li className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">2</span><span>Profili kaydet ve buraya dönüp doğrula. Doğrulama bitince kodu silebilirsin.</span></li>
      </ol>
      <AnimatePresence>
        {hesap.hata && !bekle && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease }} className="overflow-hidden">
            <p className="mt-5 flex gap-2.5 rounded-[16px] bg-rose-400/[0.07] p-3.5 text-[13.5px] leading-snug text-rose-200 ring-1 ring-rose-300/20"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{hesap.hata}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => void dogrula()} disabled={bekle} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.07] disabled:text-white/50">
        {bekle ? <><Loader2 className="h-4 w-4 animate-spin" />Profil kontrol ediliyor</> : hesap.hata ? "Tekrar dene" : "Ekledim, doğrula"}
      </button>
    </div>
  );
}

/* ── Adım 4: bitti ── */
function Bitti({ hesap, kalan, onBitir, onYeni }: { hesap: BagliHesap; kalan: number; onBitir: () => void; onYeni: () => void }) {
  return (
    <div>
      <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b]"><Check className="h-7 w-7" strokeWidth={3} /></motion.span>
      <h2 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[32px]">{platformAd(hesap.platform)} hesabın {hesap.gercek ? "doğrulandı" : "bağlandı"}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-white/60">{hesap.gercek ? "Artık bu hesaptan kampanyalara gönderi yapabilirsin." : `Gönderi yapabilirsin. ${hesap.kod} kodunu ilk inceleme bitene dek açıklamanda tut; ekip kontrol edecek.`}</p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        {kalan > 0 && <button onClick={onYeni} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><Plus className="h-4 w-4" />Başka hesap bağla</button>}
        <button onClick={onBitir} className={cn("flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium transition active:scale-[0.98]", kalan > 0 ? "text-white ring-1 ring-white/[0.14] hover:bg-white/[0.05]" : "bg-white font-semibold text-black hover:bg-white/90")}>Hesaplarıma dön</button>
      </div>
    </div>
  );
}

/** Mekanizma: profil açıklamasında kodun yeri; doğrulanınca rozet belirir. */
function BioOnizleme({ platform, hesap }: { platform: Platform; hesap?: BagliHesap }) {
  const avatar = useAuth((a) => a.kullanici?.avatar) || VARSAYILAN_AVATAR;
  const m = MARKA[platform];
  const ok = hesap?.durum === "dogrulandi";
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-4 hidden rounded-[48px] blur-[48px] md:block" style={{ background: m.isik }} aria-hidden />
      <div className="relative overflow-hidden rounded-[28px] bg-[#111215] p-6 ring-1 ring-white/[0.1]">
        <div className="flex items-center gap-4">
          <span className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#111215] ring-2 ring-[#111215]"><PlatformLogo id={platform} boyut={15} /></span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[17px] font-semibold text-white">
              @{hesap?.kadi || "kullaniciadi"}
              <AnimatePresence>{ok && hesap?.gercek && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...yay, delay: 0.25 }}><BadgeCheck className="h-[18px] w-[18px] text-[#55d6fd]" /></motion.span>}</AnimatePresence>
            </p>
            <p className="text-[13px] text-white/45">{ok && hesap?.gercek ? `${sayi(hesap.takipci)} takipçi` : `${platformAd(platform)} profilin`}</p>
          </div>
        </div>
        <div className="mt-5 rounded-[18px] bg-black/35 px-4 py-3.5 ring-1 ring-white/[0.06]">
          <p className="text-[12px] text-white/40">Profil açıklaması</p>
          <p className="mt-1.5 text-[14.5px] text-white/80">Yapay zekâ ile kısa filmler</p>
          <div className="mt-1.5 h-7">
            <AnimatePresence mode="wait" initial={false}>
              {hesap ? (
                <motion.span key="k" initial={{ opacity: 0, y: 6, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={yay}
                  className="inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1 text-[14px] font-semibold tracking-[0.08em]" style={{ color: m.vurgu, background: "rgba(255,255,255,0.06)" }}>
                  {hesap.kod}
                  {hesap.durum === "dogrulaniyor" && <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" />}
                </motion.span>
              ) : (
                <motion.span key="b" exit={{ opacity: 0 }} className="inline-flex h-7 w-32 animate-pulse rounded-[9px] bg-white/[0.05]" />
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {["Gönderi", "Takipçi", "Takip"].map((t) => <div key={t} className="rounded-[14px] bg-white/[0.03] py-2.5"><span className="mx-auto block h-3 w-8 rounded-full bg-white/[0.08]" /><span className="mt-1.5 block text-[11.5px] text-white/35">{t}</span></div>)}
        </div>
      </div>
    </div>
  );
}

/* ── Özet: bağlı hesaplar ── */
function Ozet({ hesaplar, onEkle, onAc }: { hesaplar: BagliHesap[]; onEkle: () => void; onAc: (p: Platform) => void }) {
  const { hesapKaldir } = useEarn();
  const avatar = useAuth((a) => a.kullanici?.avatar) || VARSAYILAN_AVATAR;
  const [sor, setSor] = useState<Platform | null>(null);
  const bagli = hesaplar.filter((h) => h.durum === "dogrulandi");
  const bos = PLATFORMLAR.filter((p) => !hesaplar.some((h) => h.platform === p.id));
  return (
    <div className="mx-auto max-w-[880px]">
      <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-white sm:text-[38px]">Bağlı hesaplar</h1>
          <p className="mt-1.5 text-[15px] text-white/60">{bagli.length} / {PLATFORMLAR.length} hesap bağlı. Gönderileri bu hesaplardan yaparsın.</p>
        </div>
        {bos.length > 0 && <button onClick={onEkle} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Plus className="h-4 w-4" />Hesap ekle</button>}
      </motion.header>

      <ul className="mt-8 space-y-3">
        <AnimatePresence initial={false}>
          {hesaplar.map((h, i) => {
            const ok = h.durum === "dogrulandi";
            return (
              <motion.li key={h.platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0, marginTop: 0 }} transition={{ duration: 0.3, delay: i * 0.04, ease }}
                className="relative overflow-hidden rounded-[24px] bg-[#0f1013] ring-1 ring-white/[0.08]">
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-70" style={{ background: `radial-gradient(60% 120% at 0% 50%, ${MARKA[h.platform].isik}, transparent)` }} aria-hidden />
                <div className="relative flex flex-wrap items-center gap-4 p-4 sm:p-5">
                  <span className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10" />
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f1013] ring-2 ring-[#0f1013]"><PlatformLogo id={h.platform} boyut={15} /></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[16.5px] font-semibold text-white">@{h.kadi}{ok && h.gercek && <BadgeCheck className="h-4 w-4 shrink-0 text-[#55d6fd]" />}</p>
                    <p className="text-[13.5px] text-white/55">{platformAd(h.platform)} · {ok ? (h.gercek ? `${sayi(h.takipci)} takipçi` : "Ekip ilk incelemede kontrol edecek") : "Kod profil açıklamasına eklenmedi"}</p>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {sor === h.platform ? (
                      <motion.div key="s" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }} className="flex basis-full items-center justify-end gap-2 sm:basis-auto">
                        <span className="mr-auto text-[13px] text-white/60 sm:mr-0">Bağlantı kaldırılsın mı?</span>
                        <button onClick={() => setSor(null)} className="h-9 rounded-full px-3.5 text-[13px] text-white/70 ring-1 ring-white/[0.12] hover:bg-white/[0.05]">Vazgeç</button>
                        <button onClick={() => { hesapKaldir(h.platform); setSor(null); toast.success(`${platformAd(h.platform)} bağlantısı kaldırıldı`); }} className="h-9 rounded-full bg-rose-400/15 px-3.5 text-[13px] font-medium text-rose-200 ring-1 ring-rose-300/25 hover:bg-rose-400/25">Kaldır</button>
                      </motion.div>
                    ) : (
                      <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex basis-full items-center justify-end gap-2 sm:basis-auto">
                        {!ok && <button onClick={() => onAc(h.platform)} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Doğrulamayı bitir</button>}
                        <button onClick={() => setSor(h.platform)} className="h-9 rounded-full px-3.5 text-[13px] text-white/55 transition hover:bg-white/[0.05] hover:text-white">Kaldır</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {bos.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[13.5px] text-white/50">Bağlanabilir</p>
          <div className="flex flex-wrap gap-2">
            {bos.map((p) => (
              <button key={p.id} onClick={() => onAc(p.id)} className="group flex h-12 items-center gap-2.5 rounded-full bg-white/[0.03] pl-2 pr-4 text-[14px] text-white/80 ring-1 ring-white/[0.08] transition hover:bg-white/[0.07] hover:text-white active:scale-[0.97]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16171a] ring-1 ring-white/[0.08]"><PlatformLogo id={p.id} boyut={15} /></span>{p.ad}<Plus className="h-3.5 w-3.5 text-white/40 transition group-hover:rotate-90 group-hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-12 flex items-center gap-2 text-[13px] text-white/45"><ShieldCheck className="h-4 w-4 shrink-0" />Şifreni ya da hesap erişimini istemiyoruz; yalnızca profil açıklamandaki kodu okuyoruz.</p>
    </div>
  );
}
