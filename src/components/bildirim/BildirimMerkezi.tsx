"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Bell, ChevronDown, ChevronUp, RotateCcw, Settings2, Sparkles, Wallet, X } from "lucide-react";
import { useBildirim, okunmamisSay, type BildirimKategori } from "@/store/useBildirim";
import { useProjeler, YARIM_ESIK } from "@/store/useProjeler";
import { useBildirimGozcusu } from "@/lib/bildirimler";
import { useEarnGozcusu } from "@/lib/earn/gozcu";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { Tercihler, arsivleGeriAlinir, demetBaslik, demetDemo, demetle, istemi, kisaZaman, uretimDemeti, useDakika, useMedya, type Oge } from "./BildirimSatiri";
import { cn } from "@/lib/utils";

/**
 * Üst çubuktaki bildirim merkezi — iPhone / macOS Bildirim Merkezi dili:
 *  - Buzlu cam kartlar: uygulama simgesi karesi, kalın başlık + zaman, iki satır metin, sağda küçük resim.
 *  - Kaynağa göre yığınlar (Üretimler, Kredi ve ödeme, Earn, Vayra); dokununca açılır,
 *    açıkken başlıkta "Daha az göster" ve ×. Kartın üzerine gelince sol üstte × (arşivle).
 *  - Süren üretim en üstte "canlı etkinlik" kartı. Panel kapanınca görülenler okundu sayılır.
 */
export type Sekme = "tumu" | BildirimKategori;

export const KAYNAK: Record<BildirimKategori, string> = { uretim: "Üretimler", hesap: "Kredi ve ödeme", earn: "Earn", duyuru: "Vayra" };
const hedefi = (o: Oge) => (o.uyeler.length > 1 ? `/panel/bildirimler?s=${o.id}` : (o.ana.eylem?.link ?? o.ana.link ?? `/panel/bildirimler?s=${o.id}`));
const kartSinif = "bd-kart";

export function BildirimMerkezi({ acik, setAcik }: { acik: boolean; setAcik: (v: boolean) => void }) {
  useBildirimGozcusu();
  useEarnGozcusu();
  const bildirimler = useBildirim((s) => s.bildirimler);
  const [ayarlar, setAyarlar] = useState(false);
  const zilRef = useRef<HTMLButtonElement>(null);
  // Bildirimler localStorage'dan gelir; sunucu çiziminde rozet gösterilmez (uyuşmazlık olmasın).
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useDakika();

  const gelen = useMemo(() => bildirimler.filter((b) => !b.arsiv), [bildirimler]);
  const okunmamis = hazir ? okunmamisSay(gelen) : 0;

  // Kaynağa göre yığınlar; en yeni yığın üstte.
  const yiginlar = useMemo(() => {
    const m = new Map<BildirimKategori, Oge[]>();
    for (const o of demetle(gelen)) { const k = o.ana.kategori; m.set(k, [...(m.get(k) ?? []), o]); }
    return [...m.entries()].map(([k, ogeler]) => ({ k, ogeler: ogeler.slice(0, 12) })).sort((a, b) => b.ogeler[0].zaman - a.ogeler[0].zaman);
  }, [gelen]);

  // Yeni bildirim gelince zil kısa bir sallanır.
  const onceki = useRef(okunmamis);
  const [salla, setSalla] = useState(0);
  useEffect(() => {
    if (okunmamis > onceki.current) setSalla((x) => x + 1);
    onceki.current = okunmamis;
  }, [okunmamis]);

  // iPhone gibi: panel kapanınca görülen bildirimler okundu sayılır.
  const acikti = useRef(false);
  useEffect(() => {
    if (acik) { acikti.current = true; return; }
    if (acikti.current) { acikti.current = false; useBildirim.getState().tumunuOku(); }
    setAyarlar(false);
  }, [acik]);

  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setAcik(false); zilRef.current?.focus(); } };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [acik, setAcik]);
  const kapat = () => setAcik(false);

  return (
    <div className="relative">
      <button ref={zilRef} onClick={() => setAcik(!acik)} aria-expanded={acik} aria-haspopup="dialog"
        aria-label={okunmamis ? `Bildirimler, ${okunmamis} okunmamış` : "Bildirimler"}
        className={cn("relative flex h-10 w-10 items-center justify-center rounded-[11px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60", acik ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/[0.08]" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}>
        <motion.span key={salla} animate={salla ? { rotate: [0, -14, 12, -8, 5, 0] } : undefined} transition={{ duration: 0.6 }} className="flex">
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        </motion.span>
        <AnimatePresence>
          {okunmamis > 0 && (
            <motion.span key="rozet" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff453a] px-1 text-[9.5px] font-bold tabular-nums text-white ring-2 ring-[#0b0b0c]">
              {okunmamis > 9 ? "9+" : okunmamis}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        <Yuzen acik={acik} onKapat={kapat} sag={0} ust={52} bosluk={0}>
          <MotionConfig reducedMotion="user">
            <motion.div role="dialog" aria-label="Bildirimler"
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 520, damping: 38 }} style={{ transformOrigin: "top right" }}
              className="bd-panel flex max-h-[min(660px,calc(100vh-76px))] w-[min(388px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px]">
              {/* Başlık */}
              <div className="flex h-14 shrink-0 items-center gap-2 px-5">
                {ayarlar ? (
                  <button onClick={() => setAyarlar(false)} className="-ml-1.5 flex items-center gap-1 text-[15px] font-medium text-[#55d6fd] transition-opacity hover:opacity-80">
                    <ArrowLeft className="h-4 w-4" />Bildirimler
                  </button>
                ) : (
                  <p className="text-[19px] font-bold tracking-[-0.02em] text-white">Bildirimler</p>
                )}
                <span className="flex-1" />
                {!ayarlar && gelen.length > 0 && (
                  <button onClick={() => arsivleGeriAlinir(gelen.map((b) => b.id))}
                    className="flex h-7 items-center rounded-full bg-white/[0.1] px-3 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/[0.16] active:scale-95">Temizle</button>
                )}
                {!ayarlar && (
                  <button onClick={() => setAyarlar(true)} aria-label="Bildirim tercihleri" title="Bildirim tercihleri"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-white/85 transition-colors hover:bg-white/[0.16] active:scale-95">
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <AnimatePresence initial={false} mode="wait">
                {ayarlar ? (
                  <motion.div key="ayar" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}
                    className="overflow-y-auto px-3 pb-3">
                    <Tercihler />
                    <Link href="/panel/ayarlar/bildirimler" onClick={kapat} className="mt-2 block rounded-[14px] px-3 py-2.5 text-[13px] text-[#55d6fd] transition-colors hover:bg-white/[0.04]">
                      Masaüstü bildirimi, ses ve diğer ayarlar
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="liste" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:none]">
                    <LayoutGroup>
                      <div className="space-y-2.5">
                        {hazir && <CanliEtkinlik onGit={kapat} />}
                        <AnimatePresence initial={false}>
                          {yiginlar.map((y, i) => (
                            <motion.div key={y.k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}>
                              <Yigin kategori={y.k} ogeler={y.ogeler} onGit={kapat} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </LayoutGroup>
                    {hazir && !yiginlar.length && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-[14px] font-medium text-white/45">Bildirim yok</motion.p>
                    )}
                    {hazir && (
                      <Link href="/panel/bildirimler" onClick={kapat} className="mx-auto mt-3 block w-fit rounded-full px-3 py-1.5 text-[12.5px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80">
                        Tüm bildirimler
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </MotionConfig>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

/* ── Uygulama simgesi (kaynağa göre) ── */

const SIMGE_ZEMIN: Record<BildirimKategori, string> = {
  uretim: "linear-gradient(135deg, #6fe0ff, #2f7cf6)",
  earn: "linear-gradient(135deg, #4ade80, #059669)",
  hesap: "linear-gradient(135deg, #2c2c30, #121214)",
  duyuru: "#000",
};

export function UygulamaSimgesi({ k, boyut = 38 }: { k: BildirimKategori; boyut?: number }) {
  const ic = Math.round(boyut * 0.46);
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: boyut, height: boyut, borderRadius: boyut * 0.26, background: SIMGE_ZEMIN[k], boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
      {k === "uretim" ? <Sparkles className="text-white" style={{ width: ic, height: ic }} strokeWidth={2.2} />
        : k === "earn" ? <Wallet className="text-white" style={{ width: ic, height: ic }} strokeWidth={2.2} />
        : k === "hesap" ? <KrediJeton boyut={ic} className="kredi-isilti-yildiz" />
        : <VayraIsaret size={Math.round(boyut * 0.7)} />}
    </span>
  );
}

/* ── Tek bildirim kartı ── */

/** Üretimin tam istemi (bildirim metnindeki başlık kısaltılmış olabilir). */
const tamIstem = (m: { b: Oge["ana"]; uretim?: { prompt: string; baslik: string; meta?: { hamIstem?: string } } }) =>
  (m.uretim?.meta?.hamIstem ?? m.uretim?.prompt ?? istemi(m.b)).trim();

/**
 * Bildirim kartı (iOS). `buyuk`: sayfadaki geniş hâli — görseller kartın içinde açık durur.
 * `arsivde`: köşedeki × yerine geri al.
 */
export function Kart({ o, onGit, kapatilabilir = true, buyuk, arsivde }: { o: Oge; onGit: () => void; kapatilabilir?: boolean; buyuk?: boolean; arsivde?: boolean }) {
  const b = o.ana;
  const medya = useMedya(o);
  const gorseller = medya.filter((m) => m.gorsel);
  const kapak = gorseller[0];
  const uretimMi = b.kategori === "uretim" && b.tur === "basari";
  const model = medya[0]?.uretim?.model ?? (uretimMi ? b.mesaj.split(" · ")[1] : undefined);
  const istemler = [...new Set(medya.map(tamIstem))];
  const metin = uretimMi
    ? `${istemler[0] ?? ""}${istemler.length > 1 ? ` +${istemler.length - 1} istem daha` : ""}${model ? ` · ${model}` : ""}`
    : o.uyeler.length > 1 ? `${o.uyeler.length} kez · ${b.mesaj}` : b.mesaj;
  const ac = buyuk && gorseller.length > 0;
  return (
    <div className="group relative">
      <Link href={hedefi(o)} onClick={() => { o.uyeler.forEach((x) => useBildirim.getState().okunduIsaretle(x.id)); onGit(); }}
        className={cn("flex gap-3 rounded-[20px] transition-[background-color,transform] duration-150 active:scale-[0.985]", buyuk ? "p-3.5" : "p-3", kartSinif)}>
        <UygulamaSimgesi k={b.kategori} boyut={buyuk ? 42 : 38} />
        <span className="min-w-0 flex-1 py-px">
          <span className="flex items-baseline gap-2">
            <span className={cn("min-w-0 truncate font-semibold", buyuk ? "text-[15px] leading-5" : "text-[14px] leading-[18px]", b.tur === "hata" ? "text-[#ff8a80]" : "text-white")}>{demetBaslik(o)}</span>
            <span className="ml-auto shrink-0 text-[12px] leading-[18px] text-white/45">{demetDemo(o) ? "" : ""}{kisaZaman(o.zaman)}</span>
          </span>
          <span className={cn("mt-0.5 text-white/70 [overflow-wrap:anywhere]", buyuk ? "line-clamp-3 text-[14px] leading-5" : "line-clamp-2 text-[13.5px] leading-[18px]")}>{metin}</span>
          {ac && (
            <span className={cn("mt-3 grid gap-1.5", gorseller.length === 1 ? "grid-cols-1" : gorseller.length === 2 ? "grid-cols-2" : gorseller.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
              {gorseller.slice(0, 8).map((m) => (
                <span key={m.b.id} className={cn("relative block overflow-hidden rounded-[12px] bg-white/[0.05]", gorseller.length === 1 ? "aspect-video max-w-[420px]" : "aspect-square")}>
                  {m.video && gorseller.length === 1
                    ? <video src={m.video} poster={m.gorsel} muted loop playsInline autoPlay className="h-full w-full object-cover" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={m.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </span>
              ))}
            </span>
          )}
        </span>
        {kapak && !ac && (
          <span className="relative mt-0.5 block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[8px] bg-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />
            {uretimDemeti(o) && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-bold text-white">+{o.uyeler.length - 1}</span>}
          </span>
        )}
      </Link>
      {kapatilabilir && (
        <button onClick={() => (arsivde ? useBildirim.getState().arsivdenCikar(o.uyeler.map((x) => x.id)) : arsivleGeriAlinir(o.uyeler.map((x) => x.id)))}
          aria-label={arsivde ? "Geri al" : "Bildirimi kaldır"} title={arsivde ? "Bildirimlere geri al" : "Kaldır"}
          className="absolute -left-1.5 -top-1.5 flex h-[22px] w-[22px] scale-75 items-center justify-center rounded-full bg-[#3a3a3e] text-white/85 opacity-0 ring-1 ring-black/40 transition-[opacity,transform] duration-150 hover:bg-[#4a4a4f] group-hover:scale-100 group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100 pointer-coarse:hidden">
          {arsivde ? <RotateCcw className="h-3 w-3" strokeWidth={2.6} /> : <X className="h-3 w-3" strokeWidth={2.6} />}
        </button>
      )}
    </div>
  );
}

/* ── Yığın ── */

function Yigin({ kategori, ogeler, onGit }: { kategori: BildirimKategori; ogeler: Oge[]; onGit: () => void }) {
  const [acik, setAcik] = useState(false);
  const fazla = ogeler.length - 1;
  if (!fazla) return <Kart o={ogeler[0]} onGit={onGit} />;
  return (
    <div>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="overflow-hidden">
            <div className="flex items-center gap-2 px-1 pb-2 pt-1">
              <p className="text-[16px] font-bold tracking-[-0.01em] text-white">{KAYNAK[kategori]}</p>
              <span className="flex-1" />
              <button onClick={() => setAcik(false)} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.1] px-3 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/[0.16] active:scale-95">
                <ChevronUp className="h-3.5 w-3.5" />Daha az göster
              </button>
              <button onClick={() => arsivleGeriAlinir(ogeler.flatMap((o) => o.uyeler.map((b) => b.id)))} aria-label={`${KAYNAK[kategori]} bildirimlerini kaldır`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-white/85 transition-colors hover:bg-white/[0.16] active:scale-95">
                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {acik ? (
        <div className="space-y-2">
          {ogeler.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: -24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 38, delay: i * 0.03 }}>
              <Kart o={o} onGit={onGit} />
            </motion.div>
          ))}
        </div>
      ) : (
        // Kapalı yığın: üstte en yeni kart, altında açıkça okunan "N bildirim daha" satırı
        // (boş kart kenarı gibi görünen katman şeritleri hata sanılıyordu, kaldırıldı)
        <div>
          <Kart o={ogeler[0]} onGit={onGit} kapatilabilir />
          <button onClick={() => setAcik(true)} aria-label={`${KAYNAK[kategori]}: ${fazla} bildirim daha göster`}
            className="mx-auto mt-1 flex h-7 items-center gap-1 rounded-full px-3 text-[12.5px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white active:scale-95">
            <span className="tabular-nums">{fazla}</span> bildirim daha<ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Canlı etkinlik (süren üretim) ── */

export function CanliEtkinlik({ onGit }: { onGit: () => void }) {
  const uretimler = useProjeler((s) => s.uretimler);
  // Takılı kayıt (yarıda kalmış eski iş) canlı kartta gösterilmez
  const suren = useMemo(() => uretimler.filter((u) => (u.durum === "isleniyor" || u.durum === "kuyrukta") && Date.now() - (u.baslama ?? u.olusturma) < YARIM_ESIK), [uretimler]);
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => {
    if (!suren.length) return;
    const t = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(t);
  }, [suren.length]);
  const u = suren[0];
  if (!u) return null;
  const yuzde = u.durum === "kuyrukta" ? 0 : Math.round(u.ilerleme);
  // Kalan süre yalnız tutarlıysa gösterilir (ilerleme %90 üstünde takılıyken dakikalar büyümesin)
  const kalanHam = u.durum === "isleniyor" && u.baslama && u.ilerleme >= 4 && u.ilerleme < 90 ? Math.round(((simdi - u.baslama) / 1000) * (100 / u.ilerleme - 1)) : null;
  const kalan = kalanHam !== null && kalanHam >= 1 && kalanHam <= 600 ? kalanHam : null;
  const g = [u.meta?.demoKlip?.poster, u.gorselUrl, u.meta?.referanslar?.[0]].find((x) => x && /^(\/|https?:|data:image|blob:)/.test(x));
  return (
    <Link href={`/panel/kitaplik?u=${u.id}`} onClick={onGit} className={cn("relative block overflow-hidden rounded-[20px] p-3.5 transition-transform active:scale-[0.985]", kartSinif)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {g && <img src={g} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-2xl" />}
      <span className="relative flex items-center gap-3">
        <span className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[10px] bg-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {g ? <img src={g} alt="" className="h-full w-full object-cover blur-[2px]" /> : <span className="flex h-full items-center justify-center"><ModelLogo ad={u.model} boyut={18} /></span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 truncate text-[14px] font-semibold leading-[18px] text-white">{u.baslik}</span>
            <span className="ml-auto shrink-0 text-[13px] font-semibold tabular-nums text-[#55d6fd]">{yuzde ? `%${yuzde}` : "Sırada"}</span>
          </span>
          <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-white/65">
            {u.model}{suren.length > 1 ? ` · +${suren.length - 1} üretim daha` : ""}{kalan ? ` · yaklaşık ${kalan < 60 ? `${kalan} sn` : `${Math.round(kalan / 60)} dk`} kaldı` : ""}
          </span>
        </span>
      </span>
      <span className="relative mt-3 block h-[5px] overflow-hidden rounded-full bg-white/[0.12]">
        {yuzde ? <motion.span className="block h-full rounded-full bg-[#55d6fd]" initial={false} animate={{ width: `${yuzde}%` }} transition={{ duration: 0.6 }} />
          : <span className="bildirim-kayan absolute inset-y-0 w-1/4 rounded-full bg-white/40" />}
      </span>
    </Link>
  );
}
