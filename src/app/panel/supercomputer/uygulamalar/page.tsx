"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trophy, LayoutGrid, Check, X, ChevronRight, Eye, Sparkles,
  Flame, Megaphone, Share2, Video, Frame, ShoppingBag, Camera,
  MoreVertical, ExternalLink, Link2, SlidersHorizontal, BadgeCheck,
  LayoutPanelTop, PenLine,
} from "lucide-react";
import { SCComposer } from "@/components/kabuk/sc/SCComposer";
import { SCArama } from "@/components/kabuk/sc/SCArama";
import {
  SC_UYGULAMA_BOLUMLERI, SC_VAYRA_BOLUMLERI, SC_UYGULAMA_KATEGORILERI,
  SC_UYGULAMA_TIPLERI, SC_UYGULAMA_STILLERI, sayiKisalt,
  type SCUygulama, type SCVayraUygulama,
} from "@/lib/scVitrin";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useRouter } from "next/navigation";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import { toast } from "@/lib/toast";

/* ============================================================
   SUPERCOMPUTER — UYGULAMALAR. SIFIRDAN, referanslar/uygulamalar birebir.

   Yapı (referans sırası):
     0. Sticky üst — "Uygulamalar" · [Uygulamalarım] [🏆 Uygulama gönder]
     1. Hero — koyu kapak + "BİR UYGULAMA KUR VE KAZAN / ₺100 000"
               + geri sayım hapı + composer (Tip/Stil çipleriyle)
     2. Sticky filtre — [Tüm uygulamalar | Vayra uygulamaları] · Ara · Kategori
     3. Bölümler — lime ikon + başlık + "Tümünü gör" · 4 sütun kart ızgarası

   İKİ KART TİPİ (referansta net ayrı):
     • topluluk → 16:9 kapak + ikon + ad + "N görüntülenme · N kredi"
     • Vayra    → kare kapak + ikon + ad + doğrulama rozeti (meta YOK)
   ============================================================ */

const BOLUM_IKON = {
  alev: Flame, megafon: Megaphone, paylas: Share2, kamera: Video,
  yuz: Frame, canta: ShoppingBag, fotograf: Camera,
} as const;

const TIP_IKON = {
  izgara: LayoutGrid, panel: LayoutPanelTop, parilti: Sparkles,
  kalem: PenLine, marka: BadgeCheck,
} as const;

export default function UygulamalarSayfasi() {
  const router = useRouter();
  const [sekme, setSekme] = useState<"tum" | "vayra">("tum");
  const [ara, setAra] = useState("");
  const [kategori, setKategori] = useState(SC_UYGULAMA_KATEGORILERI[0]);
  const [katAcik, setKatAcik] = useState(false);
  const [metin, setMetin] = useState("");
  const [sihirbaz, setSihirbaz] = useState<null | "tip" | "stil">(null);
  const [tip, setTip] = useState<string | null>(null);
  const [stil, setStil] = useState<string | null>(null);

  const baslat = (istem: string) => {
    const t = istem.trim();
    if (t.length < 2) return;
    const sc = useSupercomputer.getState();
    const ek = [tip && `Yerleşim: ${tip}`, stil && `Stil: ${stil}`].filter(Boolean).join(" · ");
    const id = sc.sohbetAc(t.length > 40 ? t.slice(0, 40) + "…" : t);
    sc.mesajEkle(id, { rol: "kullanici", metin: ek ? `${t}\n${ek}` : t });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  /* Arama + kategori süzgeci — iki sekme için ayrı ayrı. */
  const q = ara.trim().toLocaleLowerCase("tr");
  const toplulukBolumleri = useMemo(() =>
    SC_UYGULAMA_BOLUMLERI
      .filter((b) => kategori === SC_UYGULAMA_KATEGORILERI[0] || b.ad === kategori)
      .map((b) => ({ ...b, uygulamalar: b.uygulamalar.filter((u) => !q || u.ad.toLocaleLowerCase("tr").includes(q)) }))
      .filter((b) => b.uygulamalar.length > 0),
  [q, kategori]);

  const vayraBolumleri = useMemo(() =>
    SC_VAYRA_BOLUMLERI
      .filter((b) => kategori === SC_UYGULAMA_KATEGORILERI[0] || b.ad === kategori)
      .map((b) => ({ ...b, uygulamalar: b.uygulamalar.filter((u) => !q || u.ad.toLocaleLowerCase("tr").includes(q)) }))
      .filter((b) => b.uygulamalar.length > 0),
  [q, kategori]);

  const bosMu = sekme === "tum" ? toplulukBolumleri.length === 0 : vayraBolumleri.length === 0;

  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* ═══════ 0. ÜST ═══════
          NOT: Bu çubuk sticky DEĞİL. Aşağıdaki filtre çubuğu da top-0'a
          yapıştığından ikisi üst üste biniyordu; sayfayla birlikte kaysın. */}
      <div className="relative z-40 flex items-center justify-between px-6 py-3.5">
        <span className="text-[15px] text-[var(--sc-metin-3)]">Uygulamalar</span>
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.dispatchEvent(new Event("sc-arama-ac"))}
            className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-white/75"
            title="Sohbetlerde ara (⌘K)">
            <Search className="h-4 w-4 text-white/50" /> Ara
          </button>
          <button onClick={() => toast("Henüz bir uygulama göndermedin.")}
            className="sc-hap flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] text-white">
            <LayoutGrid className="h-[16px] w-[16px]" /> Uygulamalarım
          </button>
          <button onClick={() => setSihirbaz("tip")}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}>
            <Trophy className="h-[16px] w-[16px]" /> Uygulama gönder
          </button>
        </div>
      </div>

      {/* ═══════ 1. HERO ═══════ */}
      <section className="relative -mt-[60px] overflow-hidden">
        <div className="absolute inset-0" style={{ background: scArka("uyg-hero", "sinema") }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(0,0,0,0.35),rgba(0,0,0,0.86))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--sc-zemin)] to-transparent" />

        <div className="relative mx-auto max-w-[1180px] px-6 pb-10 pt-[132px]">
          <div className="text-center">
            <h1 className="sc-baslik text-[34px] sm:text-[44px]">BİR UYGULAMA KUR VE KAZAN</h1>
            <div className="mt-1 flex items-center justify-center gap-4">
              <Defne yon="sol" />
              <span className="sc-baslik text-[58px] leading-none sm:text-[76px]"
                style={{ color: "var(--sn-lime,#55d6fd)" }}>
                ₺100 000
              </span>
              <Defne yon="sag" />
            </div>
            <button onClick={() => toast("Yarışma 1 gün 0 saat sonra kapanıyor.")}
              className="mx-auto mt-6 flex items-center gap-3 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[13.5px] backdrop-blur-md transition-colors hover:bg-black/65">
              <span className="flex items-center gap-1.5 tabular-nums text-white/80">
                <b className="text-white">1</b> G <span className="text-white/25">|</span> <b className="text-white">0</b> S
              </span>
              <span className="h-3.5 w-px bg-white/20" />
              <span className="font-semibold uppercase tracking-wide text-white">Yarışma hakkında</span>
              <ChevronRight className="h-4 w-4 text-white/55" />
            </button>
          </div>

          {/* hero composer — üstünde MCP şeridi */}
          <div className="mx-auto mt-9 max-w-[880px]">
            <div className="flex items-center gap-2 rounded-t-[22px] border border-b-0 border-white/[0.07] bg-white/[0.045] px-4 py-2.5 text-[13.5px] text-white/60 backdrop-blur-xl">
              Uygulamayı şununla kur
              <Sparkles className="h-[15px] w-[15px] text-[#e0784f]" />
              <span className="text-white/85">Vayra MCP ile Claude</span>
              <ChevronRight className="ml-auto h-4 w-4 text-white/35" />
            </div>
            <SCComposer
              deger={metin} onDegis={setMetin} onGonder={baslat}
              satirCipler={
                <>
                  <SihirbazCip etiket="Tip" deger={tip} ikon={LayoutGrid} onAc={() => setSihirbaz("tip")} onSil={() => setTip(null)} />
                  <SihirbazCip etiket="Stil" deger={stil} ikon={PenLine} onAc={() => setSihirbaz("stil")} onSil={() => setStil(null)} />
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* ═══════ 2. STICKY FİLTRE ═══════ */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[var(--sc-zemin)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-3.5">
          <div className="flex items-center gap-1 rounded-full bg-white/[0.055] p-1">
            {([["tum", "Tüm uygulamalar"], ["vayra", "Vayra uygulamaları"]] as const).map(([id, ad]) => (
              <button key={id} onClick={() => setSekme(id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[14px] transition-colors",
                  sekme === id ? "bg-white font-semibold text-black" : "text-white/60 hover:text-white",
                )}>
                {ad}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <SCArama deger={ara} onDegis={setAra} />
            <KategoriSecici acik={katAcik} onAc={setKatAcik} deger={kategori}
              onSec={(k) => { setKategori(k); setKatAcik(false); }} />
          </div>
        </div>
      </div>

      {/* ═══════ 3. BÖLÜMLER ═══════ */}
      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-8">
        {bosMu && (
          <div className="flex flex-col items-center py-28">
            <span className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white/[0.055]">
              <Search className="h-9 w-9 text-white/30" />
            </span>
            <p className="mt-5 text-[15px] text-[var(--sc-metin-3)]">Aramanla eşleşen uygulama yok</p>
          </div>
        )}

        {sekme === "tum"
          ? toplulukBolumleri.map((b) => (
              <section key={b.ad} className="mb-14">
                <BolumBasligi ad={b.ad} ikon={b.ikon} tumunuGor />
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {b.uygulamalar.map((u) => <ToplulukKarti key={u.ad} u={u} />)}
                </div>
              </section>
            ))
          : vayraBolumleri.map((b) => (
              <section key={b.ad} className="mb-14">
                <BolumBasligi ad={b.ad} ikon={b.ikon} />
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {b.uygulamalar.map((u) => <VayraKarti key={u.ad} u={u} />)}
                </div>
              </section>
            ))}
      </div>

      <SihirbazModal adim={sihirbaz} onKapat={() => setSihirbaz(null)}
        onSecTip={(v) => { setTip(v); setSihirbaz("stil"); }}
        onSecStil={(v) => { setStil(v); setSihirbaz(null); }} />
    </div>
  );
}

/* ── Hero'daki lime defne yaprağı ── */
function Defne({ yon }: { yon: "sol" | "sag" }) {
  return (
    <svg viewBox="0 0 40 90" aria-hidden
      className={cn("h-[70px] w-[32px] shrink-0 sm:h-[92px] sm:w-[42px]", yon === "sag" && "-scale-x-100")}
      fill="none" stroke="var(--sn-lime,#55d6fd)" strokeWidth="2.4" strokeLinecap="round">
      <path d="M32 84C18 72 10 55 12 34 13 20 20 10 30 5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={26 - i * 2.2} cy={70 - i * 12} rx="9" ry="4.6"
          transform={`rotate(${-38 - i * 5} ${26 - i * 2.2} ${70 - i * 12})`} />
      ))}
    </svg>
  );
}

/* ── Bölüm başlığı: lime ikon + ad + (Tümünü gör) ── */
function BolumBasligi({ ad, ikon, tumunuGor }: { ad: string; ikon: keyof typeof BOLUM_IKON; tumunuGor?: boolean }) {
  const Ikon = BOLUM_IKON[ikon];
  const router = useRouter();
  return (
    <div className="flex items-center gap-2.5">
      <Ikon className="h-[19px] w-[19px] shrink-0" style={{ color: "var(--sn-lime,#55d6fd)" }} />
      <h2 className="text-[20px] font-semibold text-white">{ad}</h2>
      {tumunuGor && (
        <button onClick={() => router.push("/panel/supercomputer/uygulamalar")}
          className="ml-auto flex items-center gap-1 text-[14px] text-[var(--sc-metin-3)] transition-colors hover:text-white">
          Tümünü gör <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ── Kart hover araçları: sağ üstte ⋮ menü ── */
function KartAraclari({ ad, tohum }: { ad: string; tohum?: string }) {
  const [acik, setAcik] = useState(false);
  const router = useRouter();
  // GERÇEK "Aç": bu vitrin uygulamasını SC composer'ında yeni sohbet olarak başlat.
  const uygulamaAc = () => {
    setAcik(false);
    router.push(`/panel/supercomputer?istem=${encodeURIComponent(ad)}`);
  };
  // GERÇEK "Kopyala": paylaşılabilir bağlantıyı panoya yaz.
  const baglantiKopyala = async () => {
    setAcik(false);
    const link = typeof window !== "undefined"
      ? `${window.location.origin}/panel/supercomputer/uygulamalar?u=${encodeURIComponent(tohum ?? ad)}`
      : "";
    try { await navigator.clipboard.writeText(link); toast.success("Bağlantı kopyalandı"); }
    catch { toast.error("Kopyalanamadı"); }
  };
  return (
    <div className={cn("absolute right-2.5 top-2.5 z-10 transition-opacity",
      acik ? "opacity-100" : "opacity-0 group-hover/kart:opacity-100")}>
      <button onClick={() => setAcik((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-md transition-colors hover:bg-black/85"
        aria-label="Daha fazla">
        <MoreVertical className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAcik(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.97 }} transition={{ duration: 0.14 }}
              className="sc-menu absolute right-0 top-9 z-20 w-[184px] rounded-xl p-1.5">
              <button onClick={uygulamaAc}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                <ExternalLink className="h-4 w-4 text-white/55" /> Aç
              </button>
              <button onClick={baglantiKopyala}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-white/[0.07]">
                <Link2 className="h-4 w-4 text-white/55" /> Bağlantıyı kopyala
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Topluluk kartı: 16:9 kapak + ikon + ad + görüntülenme·kredi ── */
function ToplulukKarti({ u }: { u: SCUygulama }) {
  const arka = scArka(u.tohum, "sinema");
  const url = saltUrl(arka);
  const router = useRouter();
  return (
    <div className="group/kart relative rounded-2xl bg-[var(--sc-kart)] p-2 transition-colors hover:bg-[var(--sc-yukselti)]">
      <KartAraclari ad={u.ad} tohum={u.tohum} />
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
        <span className="absolute inset-0" style={{ background: arka }} />
        {url && <img src={url} alt="" loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/kart:scale-[1.04]" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-black/25" />
        {/* kapak tipografisi — referansta her kapakta var */}
        <span className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="sc-baslik text-[19px] leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
            {u.kapakYazi}
          </span>
          {u.kapakAlt && <span className="mt-1 text-[11px] leading-snug text-white/70">{u.kapakAlt}</span>}
        </span>
        <span className="absolute bottom-2 left-2.5 text-[9px] uppercase tracking-wide text-white/45">vayra.ai</span>
      </div>

      <div className="flex items-center gap-2.5 px-1 pb-1 pt-2.5">
        <span className="h-11 w-11 shrink-0 rounded-xl" style={{ background: scArka(u.tohum + "-ikon", "gorsel") }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-white">{u.ad}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--sc-metin-3)]">
            <Eye className="h-[13px] w-[13px] shrink-0" /> {sayiKisalt(u.goruntulenme)} görüntülenme
            {u.kredi != null && (
              <>
                <span className="text-white/20">·</span>
                <Sparkles className="h-[13px] w-[13px] shrink-0" /> {sayiKisalt(u.kredi)} kredi
              </>
            )}
          </span>
        </span>
        <button onClick={() => router.push(`/panel/supercomputer?istem=${encodeURIComponent(u.ad)}`)}
          className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold opacity-0 transition-opacity group-hover/kart:opacity-100"
          style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}>
          Aç
        </button>
      </div>
    </div>
  );
}

/* ── Vayra kartı: kare kapak + ad + doğrulama rozeti (meta YOK) ── */
function VayraKarti({ u }: { u: SCVayraUygulama }) {
  const arka = scArka(u.tohum, "gorsel");
  const url = saltUrl(arka);
  const router = useRouter();
  return (
    <div className="group/kart relative rounded-2xl bg-[var(--sc-kart)] p-2 transition-colors hover:bg-[var(--sc-yukselti)]">
      <KartAraclari ad={u.ad} tohum={u.tohum} />
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <span className="absolute inset-0" style={{ background: arka }} />
        {url && <img src={url} alt="" loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/kart:scale-[1.04]" />}
      </div>
      <div className="flex items-center gap-2.5 px-1 pb-1 pt-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.075] text-white/80">
          <Camera className="h-[17px] w-[17px]" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-[15px] text-white">{u.ad}</span>
          <BadgeCheck className="h-[15px] w-[15px] shrink-0" style={{ color: "var(--sn-lime,#55d6fd)" }} />
        </span>
        <button onClick={() => router.push(`/panel/supercomputer?istem=${encodeURIComponent(u.ad)}`)}
          className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold opacity-0 transition-opacity group-hover/kart:opacity-100"
          style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}>
          Aç
        </button>
      </div>
    </div>
  );
}

/* ── Composer içi Tip/Stil çipi ── */
function SihirbazCip({
  etiket, deger, ikon: Ikon, onAc, onSil,
}: { etiket: string; deger: string | null; ikon: typeof LayoutGrid; onAc: () => void; onSil: () => void }) {
  return (
    <span className="sc-hap flex shrink-0 items-center gap-1.5 rounded-full py-[9px] pl-3 pr-3 text-[14.5px] text-white/90">
      <Ikon className="h-[16px] w-[16px] shrink-0 text-white/50" />
      <button onClick={onAc} className="max-w-[130px] truncate">{deger ?? etiket}</button>
      {deger && (
        <button onClick={onSil} className="text-white/40 transition-colors hover:text-white"
          aria-label={`${etiket} seçimini kaldır`}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

/* ── Kategori açılır menüsü (portal) ── */
function KategoriSecici({
  acik, onAc, deger, onSec,
}: { acik: boolean; onAc: (v: boolean) => void; deger: string; onSec: (k: string) => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [konum, setKonum] = useState<{ right: number; top: number } | null>(null);
  const [hazir, setHazir] = useState(false);
  const [ara, setAra] = useState("");
  useEffect(() => { setHazir(true); }, []);

  const ac = () => {
    if (acik) { onAc(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setKonum({ right: window.innerWidth - r.right, top: r.bottom + 8 });
    onAc(true);
  };

  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = SC_UYGULAMA_KATEGORILERI.filter((k) => !q || k.toLocaleLowerCase("tr").includes(q));

  return (
    <>
      <button ref={btnRef} onClick={ac}
        className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-white">
        <SlidersHorizontal className="h-4 w-4 text-white/55" /> Kategori
      </button>
      {hazir && createPortal(
        <AnimatePresence>
          {acik && konum && (
            <>
              <div className="fixed inset-0 z-[120]" onClick={() => onAc(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.15 }}
                style={{ position: "fixed", right: konum.right, top: konum.top }}
                className="sc-menu z-[121] w-[410px] rounded-2xl p-2">
                {/* referansta bu arama kutusunun odak halkası LIME */}
                <label className="mb-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--sn-lime,#55d6fd)" }}>
                  <Search className="h-4 w-4 shrink-0 text-white/45" />
                  <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" autoFocus
                    className="w-full bg-transparent text-[14.5px] text-white outline-none placeholder:text-white/40" />
                </label>
                <div className="max-h-[340px] overflow-y-auto [scrollbar-width:thin]">
                  {liste.map((k) => (
                    <button key={k} onClick={() => onSec(k)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14.5px] text-white transition-colors hover:bg-white/[0.06]">
                      <span className="flex-1">{k}</span>
                      {deger === k && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--sn-lime,#55d6fd)" }} />}
                    </button>
                  ))}
                  {liste.length === 0 && <p className="px-3 py-6 text-center text-[14px] text-white/45">Sonuç yok</p>}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ── "Uygulama gönder" sihirbazı: 2 adım × 2×2 seçenek ── */
function SihirbazModal({
  adim, onKapat, onSecTip, onSecStil,
}: {
  adim: null | "tip" | "stil";
  onKapat: () => void;
  onSecTip: (v: string) => void;
  onSecStil: (v: string) => void;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);
  // Modal açıkken arka plan kaydırmasını kilitle + ESC ile kapat.
  useEffect(() => {
    if (!adim) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = eski; window.removeEventListener("keydown", esc); };
  }, [adim, onKapat]);

  if (!hazir) return null;
  const tipMi = adim === "tip";
  const secenekler = tipMi ? SC_UYGULAMA_TIPLERI : SC_UYGULAMA_STILLERI;

  return createPortal(
    <AnimatePresence>
      {adim && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[3px]" onClick={onKapat} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog" aria-modal="true"
            className="sc-menu fixed left-1/2 top-1/2 z-[201] max-h-[92vh] w-[min(1120px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] p-7">
            <div className="flex items-center justify-between">
              <span className="text-[16px] text-[var(--sc-metin-3)]">
                {tipMi ? "Uygulama tipini seç" : "Stil seç"}
              </span>
              <button onClick={onKapat}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Kapat">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <h2 className="sc-baslik mt-5 text-[30px] sm:text-[36px]">
              {tipMi ? "NASIL BİR UYGULAMA KURMAK İSTİYORSUN?" : "UYGULAMAN İÇİN STİL SEÇ"}
            </h2>
            <p className="mt-2 text-[16px] text-[var(--sc-metin-3)]">
              {tipMi
                ? "Birini seç: özel, basit uygulama, stüdyo ya da hazır uygulama"
                : "Birini seç: özel, Vayra, Y2K ya da modern"}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {secenekler.map((s) => {
                const Ikon = TIP_IKON[s.ikon as keyof typeof TIP_IKON];
                return (
                  <button key={s.ad} onClick={() => (tipMi ? onSecTip(s.ad) : onSecStil(s.ad))}
                    className="group/sec overflow-hidden rounded-2xl bg-[var(--sc-kart)] p-2.5 text-left transition-colors hover:bg-[var(--sc-yukselti)]">
                    <span className="relative block aspect-[16/10] overflow-hidden rounded-xl"
                      style={{ background: scArka(`sihir-${s.ad}`, "gorsel") }}>
                      <span className="absolute inset-0 bg-black/35" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Ikon className="h-9 w-9 text-white/75" />
                      </span>
                    </span>
                    <span className="flex items-center gap-3 px-1 pb-1 pt-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.075] text-white/85">
                        <Ikon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[19px] text-white">{s.ad}</span>
                        <span className="block truncate text-[13.5px] text-[var(--sc-metin-3)]">{s.ozet}</span>
                      </span>
                      <span className="shrink-0 rounded-xl px-4 py-2 text-[14px] font-semibold opacity-0 transition-opacity group-hover/sec:opacity-100"
                        style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}>
                        Seç
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
