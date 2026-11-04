"use client";

/**
 * Brif belgesinin Notion parçaları: kapak ve simge, düzenlenebilir özellikler (durum, teslim, sorumlu, etiketler),
 * sayfa seçenekleri (yazı tipi, küçük yazı, tam genişlik, kilit), dışa aktarma, sürüm geçmişi, şablonlar,
 * tablo / bağlantı / kod blokları, blok renkleri ve yorumlar.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, BookOpen, Calendar, Camera, Check, Clapperboard, Copy, Download, FileText, Film, Globe2, History, Lightbulb,
  Link2, Lock, Megaphone, MessageSquare, MoreHorizontal, Music, Palette, Plus, Printer, Rocket, RotateCcw, Shapes, Smartphone, Sparkles, Star,
  Target, Trash2, Type, Upload, User, X,
} from "lucide-react";
import { Yuzen } from "@/components/ui/Yuzen";
import { mesaj } from "@/lib/mesaj";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BrifBlok, BrifOzellik, BrifRenk, BrifSayfa, BrifSurum, BrifYorum, ProjeUye } from "@/store/useSinema";
import { gorece } from "@/components/panel/projeler/projeVeri";
import { Avatar, ease } from "./ortak";
import { YanPanel } from "./YanPanel";

/* ── Renkler: blok yazısı ya da zemini ── */
export const RENKLER: { id: BrifRenk; ad: string; yazi: string; zemin: string }[] = [
  { id: "gri", ad: "Gri", yazi: "#a3a3a3", zemin: "rgba(255,255,255,0.07)" },
  { id: "mavi", ad: "Mavi", yazi: "#7cc4ff", zemin: "rgba(56,139,253,0.16)" },
  { id: "yesil", ad: "Yeşil", yazi: "#7ee2a0", zemin: "rgba(46,160,67,0.17)" },
  { id: "sari", ad: "Sarı", yazi: "#f3d36b", zemin: "rgba(212,167,44,0.17)" },
  { id: "turuncu", ad: "Turuncu", yazi: "#ffad6b", zemin: "rgba(219,109,40,0.17)" },
  { id: "kirmizi", ad: "Kırmızı", yazi: "#ff8f8f", zemin: "rgba(248,81,73,0.16)" },
  { id: "mor", ad: "Mor", yazi: "#c9a5ff", zemin: "rgba(163,113,247,0.17)" },
  { id: "pembe", ad: "Pembe", yazi: "#ff9fd0", zemin: "rgba(219,97,162,0.17)" },
];
export const renkBul = (r?: BrifRenk) => RENKLER.find((x) => x.id === r);

/* ── Sayfa simgeleri ── */
export const SIMGELER: Record<string, React.ElementType> = {
  belge: FileText, film: Film, klaket: Clapperboard, reklam: Megaphone, muzik: Music, kamera: Camera, yildiz: Star, roket: Rocket,
  hedef: Target, fikir: Lightbulb, palet: Palette, kitap: BookOpen, dunya: Globe2, sekil: Shapes, telefon: Smartphone, parilti: Sparkles,
};
export const SIMGE_RENKLERI = ["#ffffff", "#55d6fd", "#a78bfa", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#f87171"];

/* ── Kapaklar: projenin kareleri + degradeler ── */
export const DEGRADELER = [
  "linear-gradient(120deg,#0f2027,#203a43,#2c5364)", "linear-gradient(120deg,#1f1c2c,#928dab)", "linear-gradient(120deg,#0b486b,#f56217)",
  "linear-gradient(120deg,#141e30,#243b55)", "linear-gradient(120deg,#42275a,#734b6d)", "linear-gradient(120deg,#000428,#004e92)",
  "linear-gradient(120deg,#16222a,#3a6073)", "linear-gradient(120deg,#3a1c71,#d76d77,#ffaf7b)",
];
export const kapakStili = (k: string, y = 50): React.CSSProperties =>
  k.startsWith("grad:") ? { background: DEGRADELER[Number(k.slice(5))] ?? DEGRADELER[0] } : { backgroundImage: `url("${k}")`, backgroundSize: "cover", backgroundPosition: `center ${y}%` };

/* ── Kapak ── */
export function Kapak({ sayfa, kareler, kilit, onGuncelle }: { sayfa: BrifSayfa; kareler: string[]; kilit?: boolean; onGuncelle: (p: Partial<BrifSayfa>) => void }) {
  const [sec, setSec] = useState(false);
  const [konum, setKonum] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const y = sayfa.kapakY ?? 50;
  const surukle = (e: React.PointerEvent) => {
    if (!konum) return;
    const y0 = e.clientY, bas = y, h = ref.current?.offsetHeight ?? 220;
    const m = (ev: PointerEvent) => onGuncelle({ kapakY: Math.max(0, Math.min(100, bas - ((ev.clientY - y0) / h) * 100)) });
    const b = () => { window.removeEventListener("pointermove", m); window.removeEventListener("pointerup", b); };
    window.addEventListener("pointermove", m); window.addEventListener("pointerup", b);
  };
  if (!sayfa.kapak) return null;
  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onPointerDown={surukle}
      className={cn("group/kapak relative h-[200px] w-full sm:h-[240px]", konum && "cursor-ns-resize")} style={kapakStili(sayfa.kapak, y)}>
      {konum && <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-[13px] font-medium text-white">Konumlandırmak için sürükle</span>}
      {!kilit && (
        <div className={cn("absolute bottom-3 right-3 flex gap-1 rounded-[10px] bg-black/55 p-1 backdrop-blur transition-opacity sm:right-6", konum || sec ? "opacity-100" : "opacity-0 group-hover/kapak:opacity-100")}>
          {konum ? <button onClick={() => setKonum(false)} className="h-7 rounded-[7px] bg-white px-2.5 text-[12.5px] font-semibold text-black">Konumu kaydet</button> : <>
            <div className="relative">
              <button onClick={() => setSec((v) => !v)} className="h-7 rounded-[7px] px-2.5 text-[12.5px] font-medium text-white/90 hover:bg-white/15">Kapağı değiştir</button>
              <KapakSecici acik={sec} onKapat={() => setSec(false)} kareler={kareler} onSec={(k) => { onGuncelle({ kapak: k, kapakY: 50 }); setSec(false); }} />
            </div>
            {!sayfa.kapak.startsWith("grad:") && <button onClick={() => setKonum(true)} className="h-7 rounded-[7px] px-2.5 text-[12.5px] font-medium text-white/90 hover:bg-white/15">Konumlandır</button>}
            <button onClick={() => onGuncelle({ kapak: undefined })} className="h-7 rounded-[7px] px-2.5 text-[12.5px] font-medium text-white/90 hover:bg-white/15">Kaldır</button>
          </>}
        </div>
      )}
    </motion.div>
  );
}

export function KapakSecici({ acik, onKapat, kareler, onSec, yerlesim = "alt-sag" }: { acik: boolean; onKapat: () => void; kareler: string[]; onSec: (k: string) => void; yerlesim?: "alt-sag" | "alt-sol" }) {
  const dosya = useRef<HTMLInputElement>(null);
  return (
    <Yuzen acik={acik} onKapat={onKapat} yerlesim={yerlesim} bosluk={8} etiket="Kapak seç" className="w-[min(420px,calc(100vw-24px))] rounded-[16px] border border-white/[0.08] bg-[#18191c] p-3">
      <input ref={dosya} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onSec(await gorselKucult(f, 1800)); }} />
      <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-white">Kapak</p>
        <button onClick={() => dosya.current?.click()} className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/90 hover:bg-white/[0.14]"><Upload className="h-3.5 w-3.5" />Yükle</button></div>
      <p className="mb-1.5 mt-3 text-[12px] text-white/50">Renk geçişleri</p>
      <div className="grid grid-cols-4 gap-1.5">{DEGRADELER.map((g, i) => <button key={g} onClick={() => onSec(`grad:${i}`)} aria-label={`Renk geçişi ${i + 1}`} className="h-11 rounded-[8px] ring-1 ring-inset ring-white/10 transition hover:scale-[1.03]" style={{ background: g }} />)}</div>
      <p className="mb-1.5 mt-3 text-[12px] text-white/50">Projeden</p>
      {kareler.length ? (
        <div className="grid max-h-[200px] grid-cols-4 gap-1.5 overflow-y-auto">{kareler.slice(0, 24).map((k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <button key={k} onClick={() => onSec(k)} className="h-14 overflow-hidden rounded-[8px] ring-1 ring-inset ring-white/10 transition hover:scale-[1.03]"><img src={k} alt="" className="h-full w-full object-cover" /></button>
        ))}</div>
      ) : <p className="rounded-[10px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] text-white/55">Projede henüz görsel yok. Ürettiklerin burada kapak olarak seçilebilir.</p>}
    </Yuzen>
  );
}

export function SimgeSecici({ acik, onKapat, sayfa, onSec }: { acik: boolean; onKapat: () => void; sayfa: BrifSayfa; onSec: (p: Partial<BrifSayfa>) => void }) {
  return (
    <Yuzen acik={acik} onKapat={onKapat} yerlesim="alt-sol" bosluk={8} etiket="Simge seç" className="w-[300px] rounded-[16px] border border-white/[0.08] bg-[#18191c] p-3">
      <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-white">Simge</p>{sayfa.simge && <button onClick={() => onSec({ simge: "yok" })} className="text-[12px] text-white/55 hover:text-white">Kaldır</button>}</div>
      <div className="mt-2.5 grid grid-cols-8 gap-1">
        {Object.entries(SIMGELER).map(([k, I]) => (
          <button key={k} onClick={() => onSec({ simge: k })} aria-label={k} className={cn("flex h-8 w-8 items-center justify-center rounded-[8px] transition hover:bg-white/[0.08]", sayfa.simge === k && "bg-white/[0.1]")}>
            <I className="h-[18px] w-[18px]" style={{ color: sayfa.simgeRenk ?? "#fff" }} />
          </button>
        ))}
      </div>
      <p className="mb-1.5 mt-3 text-[12px] text-white/50">Renk</p>
      <div className="flex gap-1.5">{SIMGE_RENKLERI.map((r) => (
        <button key={r} onClick={() => onSec({ simgeRenk: r })} aria-label={`Renk ${r}`} className={cn("flex h-6 w-6 items-center justify-center rounded-full ring-2 transition", (sayfa.simgeRenk ?? "#ffffff") === r ? "ring-white/80" : "ring-transparent")} style={{ background: r }}>
          {(sayfa.simgeRenk ?? "#ffffff") === r && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
        </button>
      ))}</div>
    </Yuzen>
  );
}

/* ── Düzenlenebilir özellikler ── */
const DURUMLAR: { id: NonNullable<BrifOzellik["durum"]>; ad: string; renk: string }[] = [
  { id: "taslak", ad: "Taslak", renk: "#a3a3a3" }, { id: "inceleme", ad: "İncelemede", renk: "#f3d36b" },
  { id: "onay", ad: "Onaylandı", renk: "#7ee2a0" }, { id: "arsiv", ad: "Arşivde", renk: "#6b6b6b" },
];
const etiketRengi = (t: string) => RENKLER[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % RENKLER.length];
const OZ_DEGER = "flex min-h-[30px] w-full items-center gap-2 rounded-[7px] px-1.5 text-left transition hover:bg-white/[0.05] disabled:hover:bg-transparent";
const BOS = <span className="text-white/35">Boş</span>;

export function DurumHap({ d }: { d?: BrifOzellik["durum"] }) {
  const x = DURUMLAR.find((y) => y.id === (d ?? "taslak"))!;
  return <span className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium" style={{ background: `color-mix(in srgb, ${x.renk} 16%, transparent)`, color: x.renk }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: x.renk }} />{x.ad}</span>;
}

export function OzellikDegeri({ tur, oz, uyeler, kilit, onGuncelle }: { tur: "durum" | "teslim" | "sorumlu" | "etiketler"; oz: BrifOzellik; uyeler: ProjeUye[]; kilit?: boolean; onGuncelle: (p: Partial<BrifOzellik>) => void }) {
  const [acik, setAcik] = useState(false);
  const [yeni, setYeni] = useState("");
  const girdi = useRef<HTMLInputElement>(null);
  const kapat = () => { setAcik(false); setYeni(""); };
  /* Menü gövdeye taşınıp konumlandıktan sonra odak: autoFocus portalda güvenilir değil. */
  useEffect(() => { if (!acik) return; const t = setTimeout(() => girdi.current?.focus(), 60); return () => clearTimeout(t); }, [acik]);
  const MENU = "rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5";
  const SATIR = "flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]";
  let deger: React.ReactNode, icerik: React.ReactNode;
  if (tur === "durum") {
    deger = <DurumHap d={oz.durum} />;
    icerik = DURUMLAR.map((d) => <button key={d.id} onClick={() => { onGuncelle({ durum: d.id }); kapat(); }} className={SATIR}><DurumHap d={d.id} /><span className="flex-1" />{(oz.durum ?? "taslak") === d.id && <Check className="h-4 w-4" />}</button>);
  } else if (tur === "teslim") {
    const t = oz.teslim ? new Date(`${oz.teslim}T12:00:00`) : null;
    const kalan = t ? Math.round((t.getTime() - new Date(new Date().toDateString()).getTime() - 12 * 3600e3) / 86400e3) : 0;
    deger = t ? <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-white/45" />{t.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
      <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-medium", kalan < 0 ? "bg-rose-500/15 text-rose-300" : kalan <= 3 ? "bg-amber-400/15 text-amber-200" : "bg-white/[0.07] text-white/60")}>{kalan === 0 ? "Bugün" : kalan > 0 ? `${kalan} gün kaldı` : `${-kalan} gün geçti`}</span></span> : BOS;
    const gun = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    icerik = <>
      <input type="date" value={oz.teslim ?? ""} onChange={(e) => onGuncelle({ teslim: e.target.value || undefined })} className="mb-1 h-9 w-full rounded-[9px] bg-white/[0.06] px-2.5 text-[13px] text-white outline-none [color-scheme:dark]" />
      {([["Bugün", 0], ["Yarın", 1], ["Gelecek hafta", 7], ["İki hafta sonra", 14]] as const).map(([ad, n]) => <button key={ad} onClick={() => { onGuncelle({ teslim: gun(n) }); kapat(); }} className={SATIR}>{ad}</button>)}
      {oz.teslim && <><div className="my-1 h-px bg-white/[0.08]" /><button onClick={() => { onGuncelle({ teslim: undefined }); kapat(); }} className={cn(SATIR, "text-white/60")}>Tarihi temizle</button></>}
    </>;
  } else if (tur === "sorumlu") {
    const u = uyeler.find((x) => x.email === oz.sorumlu);
    deger = u ? <span className="flex items-center gap-2"><Avatar u={u} boyut={20} />{u.ad}</span> : BOS;
    icerik = <>{uyeler.map((x) => <button key={x.email} onClick={() => { onGuncelle({ sorumlu: x.email }); kapat(); }} className={SATIR}><Avatar u={x} boyut={22} /><span className="flex-1 truncate">{x.ad}</span>{oz.sorumlu === x.email && <Check className="h-4 w-4" />}</button>)}
      {oz.sorumlu && <><div className="my-1 h-px bg-white/[0.08]" /><button onClick={() => { onGuncelle({ sorumlu: undefined }); kapat(); }} className={cn(SATIR, "text-white/60")}>Sorumluyu kaldır</button></>}</>;
  } else {
    const l = oz.etiketler ?? [];
    deger = l.length ? <span className="flex flex-wrap gap-1">{l.map((t) => { const r = etiketRengi(t); return <span key={t} className="rounded-[6px] px-1.5 py-0.5 text-[12.5px]" style={{ background: r.zemin, color: r.yazi }}>{t}</span>; })}</span> : BOS;
    const ekle = () => { const t = yeni.trim().slice(0, 24); if (t && !l.includes(t)) onGuncelle({ etiketler: [...l, t] }); setYeni(""); };
    icerik = <>
      <input ref={girdi} value={yeni} onChange={(e) => setYeni(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ekle(); } }} placeholder="Etiket yaz, Enter ile ekle" className="mb-1 h-9 w-full rounded-[9px] bg-white/[0.06] px-2.5 text-[13px] text-white outline-none placeholder:text-white/35" />
      {l.length ? l.map((t) => { const r = etiketRengi(t); return <div key={t} className={cn(SATIR, "justify-between")}><span className="rounded-[6px] px-1.5 py-0.5 text-[12.5px]" style={{ background: r.zemin, color: r.yazi }}>{t}</span><button onClick={() => onGuncelle({ etiketler: l.filter((x) => x !== t) })} aria-label={`${t} etiketini kaldır`} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/45 hover:bg-white/[0.08] hover:text-white"><X className="h-3.5 w-3.5" /></button></div>; })
        : <p className="px-2 py-1.5 text-[12.5px] text-white/45">Örneğin: Müşteri, Acil, Sosyal medya</p>}
    </>;
  }
  return (
    <div className="relative">
      <button disabled={kilit} onClick={() => setAcik((v) => !v)} className={OZ_DEGER}>{deger}</button>
      <Yuzen acik={acik} onKapat={kapat} yerlesim="alt-sol" bosluk={4} etiket="Özellik" className={cn(MENU, "w-[260px]")}>{icerik}</Yuzen>
    </div>
  );
}

/* ── Sayfa menüsü (⋯) ── */
export function SayfaMenusu({ sayfa, kelime, onGuncelle, onSurumler, onDisa, onKopyala }: {
  sayfa: BrifSayfa; kelime: number; onGuncelle: (p: Partial<BrifSayfa>) => void; onSurumler: () => void; onDisa: (t: "md" | "kopya" | "yazdir") => void; onKopyala: () => void;
}) {
  const [acik, setAcik] = useState(false);
  const SATIR = "flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[13px] text-white/85 hover:bg-white/[0.06]";
  const Anahtar = ({ a }: { a?: boolean }) => <span className={cn("relative h-[18px] w-8 rounded-full transition-colors", a ? "bg-[#55d6fd]" : "bg-white/20")}><motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={cn("absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white", a ? "right-[2px]" : "left-[2px]")} /></span>;
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-label="Sayfa seçenekleri" aria-expanded={acik} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.08] hover:text-white", acik && "bg-white/[0.08] text-white")}><MoreHorizontal className="h-4 w-4" /></button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Sayfa seçenekleri" className="w-[260px] rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5">
        <p className="px-2 pb-1.5 pt-1 text-[12px] text-white/45">Yazı tipi</p>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1.5">
          {([["sans", "Varsayılan", "font-sans"], ["serif", "Serif", "font-serif"], ["mono", "Mono", "font-mono"]] as const).map(([k, ad, f]) => (
            <button key={k} onClick={() => onGuncelle({ yazi: k })} className={cn("flex flex-col items-center gap-0.5 rounded-[10px] py-2 transition hover:bg-white/[0.06]", (sayfa.yazi ?? "sans") === k && "bg-white/[0.08] ring-1 ring-inset ring-white/15")}>
              <span className={cn("text-[22px] leading-none text-white", f)}>Ag</span><span className="text-[11.5px] text-white/55">{ad}</span>
            </button>
          ))}
        </div>
        <div className="my-1 h-px bg-white/[0.08]" />
        <button onClick={() => onGuncelle({ kucuk: !sayfa.kucuk })} className={SATIR}><Type className="h-4 w-4 text-white/55" /><span className="flex-1">Küçük yazı</span><Anahtar a={sayfa.kucuk} /></button>
        <button onClick={() => onGuncelle({ genis: !sayfa.genis })} className={SATIR}><ArrowUpRight className="h-4 w-4 rotate-45 text-white/55" /><span className="flex-1">Tam genişlik</span><Anahtar a={sayfa.genis} /></button>
        <button onClick={() => { onGuncelle({ kilit: !sayfa.kilit }); toast.success(sayfa.kilit ? "Sayfanın kilidi açıldı" : "Sayfa kilitlendi", { description: sayfa.kilit ? undefined : "Yanlışlıkla değişiklik yapılmaz; kilidi buradan açabilirsin." }); }} className={SATIR}><Lock className="h-4 w-4 text-white/55" /><span className="flex-1">Sayfayı kilitle</span><Anahtar a={sayfa.kilit} /></button>
        <div className="my-1 h-px bg-white/[0.08]" />
        <button onClick={() => { setAcik(false); onKopyala(); }} className={SATIR}><Link2 className="h-4 w-4 text-white/55" />Bağlantıyı kopyala</button>
        <button onClick={() => { setAcik(false); onSurumler(); }} className={SATIR}><History className="h-4 w-4 text-white/55" />Sürüm geçmişi</button>
        <button onClick={() => { setAcik(false); onDisa("kopya"); }} className={SATIR}><Copy className="h-4 w-4 text-white/55" />Markdown olarak kopyala</button>
        <button onClick={() => { setAcik(false); onDisa("md"); }} className={SATIR}><Download className="h-4 w-4 text-white/55" />Markdown dosyası indir</button>
        <button onClick={() => { setAcik(false); onDisa("yazdir"); }} className={SATIR}><Printer className="h-4 w-4 text-white/55" />Yazdır ya da PDF kaydet</button>
        <div className="my-1 h-px bg-white/[0.08]" />
        <p className="px-2 py-1 text-[12px] text-white/45">{kelime.toLocaleString("tr-TR")} kelime · okuması {Math.max(1, Math.round(kelime / 200))} dk</p>
      </Yuzen>
    </div>
  );
}

/* ── Sürüm geçmişi ── */
export function SurumPaneli({ surumler, simdiki, metin, onGeriYukle, onKaydet, onKapat }: {
  surumler: BrifSurum[]; simdiki: BrifBlok[]; metin: (b: BrifBlok[]) => string; onGeriYukle: (s: BrifSurum) => void; onKaydet: () => void; onKapat: () => void;
}) {
  const [secili, setSecili] = useState<string | null>(surumler[0]?.id ?? null);
  const s = surumler.find((x) => x.id === secili);
  const kelime = (b: BrifBlok[]) => metin(b).split(/\s+/).filter(Boolean).length;
  const simdi = kelime(simdiki);
  return (
    <YanPanel baslik="Sürüm geçmişi" ust={<><History className="h-3.5 w-3.5" />Brif</>} onKapat={onKapat} genislik={560}
      alt={<><button onClick={onKaydet} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/90 hover:bg-white/[0.12]"><Plus className="h-4 w-4" />Şimdiki hâli kaydet</button>
        <button disabled={!s} onClick={() => s && onGeriYukle(s)} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black disabled:opacity-40"><RotateCcw className="h-4 w-4" />Bu sürüme dön</button></>}>
      {surumler.length === 0 ? (
        <div className="rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
          <p className="text-[14px] font-semibold text-white">Henüz kayıtlı sürüm yok</p>
          <p className="mt-1 text-[13px] leading-relaxed text-white/60">Brif yazdıkça her on dakikada bir sürüm kendiliğinden saklanır. Önemli bir anı elle de kaydedebilirsin.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            {surumler.map((x, i) => {
              const k = kelime(x.bloklar), fark = simdi - k;
              return (
                <button key={x.id} onClick={() => setSecili(x.id)} className={cn("flex w-full items-center gap-3 border-b border-white/[0.05] px-3.5 py-2.5 text-left transition last:border-0", secili === x.id ? "bg-white/[0.07]" : "hover:bg-white/[0.03]")}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-[#55d6fd]" : "bg-white/25")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-white">{new Date(x.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="block text-[12px] text-white/50">{x.kim} · {k.toLocaleString("tr-TR")} kelime{fark ? `, şimdikinden ${Math.abs(fark)} kelime ${fark > 0 ? "az" : "fazla"}` : ""}</span>
                  </span>
                  {secili === x.id && <Check className="h-4 w-4 text-white" />}
                </button>
              );
            })}
          </div>
          {s && (
            <div className="rounded-[16px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.07]">
              <p className="mb-2 text-[12px] text-white/45">Önizleme · {gorece(s.zaman) || "az önce"}</p>
              <div className="max-h-[42vh] space-y-1 overflow-y-auto text-[13.5px] leading-relaxed text-white/80 [scrollbar-width:thin]">
                {metin(s.bloklar).split("\n").map((l, i) => {
                  if (l.startsWith("## ")) return <p key={i} className="pt-2 text-[15px] font-semibold text-white">{l.slice(3)}</p>;
                  if (l.startsWith("### ")) return <p key={i} className="pt-1 font-semibold text-white">{l.slice(4)}</p>;
                  const yap = l.match(/^- \[( |x)\] (.*)$/i);
                  if (yap) return <p key={i} className="flex items-start gap-2"><span className={cn("mt-[5px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px]", yap[1] === " " ? "ring-1 ring-inset ring-white/35" : "bg-[#55d6fd] text-black")}>{yap[1] !== " " && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span><span className={yap[1] !== " " ? "text-white/45 line-through" : ""}>{yap[2]}</span></p>;
                  if (l.startsWith("- ")) return <p key={i} className="flex gap-2"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-white/50" />{l.slice(2)}</p>;
                  if (l.startsWith("> ")) return <p key={i} className="rounded-[8px] bg-white/[0.05] px-3 py-1.5">{l.slice(2)}</p>;
                  if (l === "---") return <hr key={i} className="my-2 border-white/10" />;
                  return l.trim() ? <p key={i}>{l}</p> : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </YanPanel>
  );
}

/* ── Şablonlar ── */
export const SABLONLAR: { id: string; ad: string; alt: string; ikon: React.ElementType; md: string }[] = [
  { id: "reklam", ad: "Reklam filmi", alt: "Ürün, mesaj, çağrı ve teslimler", ikon: Megaphone, md: `## Bağlam
- Marka ve ürün: [adı yaz]
- Yayın yeri: Instagram, YouTube, TV
- Hedef kitle: [yaş, ilgi, alışkanlık]
## Anlatı
- Tek cümlelik mesaj: [izleyici ne hatırlasın?]
- Akış: kanca (ilk 2 saniye), sorun, ürün, sonuç, çağrı
## Görseller
- Ruh hâli: [enerjik, sakin, premium]
- Renk paleti: [marka renkleri]
- Referanslar: aşağıya projeden görsel ekle
## Prodüksiyon
- [ ] 15 saniyelik dikey sürüm
- [ ] 30 saniyelik yatay sürüm
- [ ] Altyazılı kopya
## Durum
> Taslak aşamasında. İlk storyboard AI Yönetmen ile çıkarılacak.
## Kaynaklar
- Marka kılavuzu: [bağlantı]
## Notlar
- [Kararları buraya yaz]` },
  { id: "kisa", ad: "Kısa film", alt: "Hikâye, karakterler, sahne listesi", ikon: Film, md: `## Bağlam
- Tür ve süre: [dram, 3 dakika]
- Nerede gösterilecek: [festival, YouTube]
## Anlatı
- Logline: [bir cümlede hikâye]
- Başlangıç: [karakter ve dünya]
- Gelişme: [çatışma]
- Son: [dönüşüm]
## Görseller
- Görüntü dili: [anamorfik, sıcak tonlar, el kamerası]
- Karakterler: @ ile elementleri bağla
## Prodüksiyon
- [ ] Sahne listesi
- [ ] Karakter referansları
- [ ] Müzik ve ses
## Durum
> Senaryo aşaması.
## Kaynaklar
- Senaryo: [bağlantı]
## Notlar
- [Notlar]` },
  { id: "klip", ad: "Müzik klibi", alt: "Parça, ritim, görsel motifler", ikon: Music, md: `## Bağlam
- Sanatçı ve parça: [adı]
- Süre: [3:20]
## Anlatı
- Konsept: [klibin fikri]
- Bölümler: giriş, nakarat, köprü, final
## Görseller
- Motifler: [ışık, renk, tekrar eden imge]
- Kurgu ritmi: vuruşlara göre kesme
## Prodüksiyon
- [ ] Performans çekimleri
- [ ] Hikâye çekimleri
- [ ] Renk düzenleme
## Durum
> Konsept onayı bekleniyor.
## Kaynaklar
- Parça: [bağlantı]
## Notlar
- [Notlar]` },
  { id: "sosyal", ad: "Sosyal medya serisi", alt: "Kanal, takvim, içerik ayakları", ikon: Smartphone, md: `## Bağlam
- Kanallar: Instagram, TikTok, YouTube Shorts
- Amaç: [farkındalık, satış, topluluk]
## Anlatı
- Seri adı: [adı]
- İçerik ayakları: eğitici, kamera arkası, ürün, topluluk
## Görseller
- Biçim: 9:16, altyazılı, ilk karede yazı
## Prodüksiyon
- [ ] Haftalık takvim
- [ ] İlk 3 bölüm
- [ ] Kapak şablonu
## Durum
> İlk bölüm hazırlanıyor.
## Kaynaklar
- [Bağlantılar]
## Notlar
- [Notlar]` },
  { id: "lansman", ad: "Ürün lansmanı", alt: "Duyuru, sayfa görselleri, video", ikon: Rocket, md: `## Bağlam
- Ürün: [adı ve tek cümle açıklama]
- Lansman günü: [tarih]
## Anlatı
- Vaat: [neyi değiştiriyor?]
- Kanıt: [özellik, kullanıcı sözü]
## Görseller
- Ürün çekimleri, kullanım sahneleri, kapak görseli
## Prodüksiyon
- [ ] Duyuru videosu
- [ ] Sayfa görselleri
- [ ] Sosyal medya kesitleri
## Durum
> Planlama.
## Kaynaklar
- [Ürün sayfası]
## Notlar
- [Notlar]` },
];

export function SablonSecici({ onSec, onBos }: { onSec: (md: string, ad: string) => void; onBos: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}
      className="mt-6 overflow-hidden rounded-[18px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <span><span className="block text-[14px] font-semibold text-white">Şablonla başla</span><span className="block text-[12.5px] text-white/55">Bölümler hazır başlıklar, listeler ve yapılacaklarla dolar; sonra düzenlersin.</span></span>
        <button onClick={onBos} className="h-8 shrink-0 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 hover:bg-white/[0.12]">Boş devam et</button>
      </div>
      <div className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-3">
        {SABLONLAR.map((s, i) => (
          <motion.button key={s.id} onClick={() => onSec(s.md, s.ad)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
            className="group flex items-center gap-3 rounded-[12px] p-2.5 text-left transition hover:bg-white/[0.05]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.07] transition group-hover:bg-white group-hover:text-black"><s.ikon className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0"><span className="block truncate text-[13.5px] font-medium text-white">{s.ad}</span><span className="block truncate text-[12px] text-white/50">{s.alt}</span></span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Tablo bloğu ── */
export function TabloBlok({ x, kilit, onGuncelle }: { x: BrifBlok; kilit?: boolean; onGuncelle: (p: Partial<BrifBlok>, yapisal?: boolean) => void }) {
  const t = x.tablo?.length ? x.tablo : [["Başlık", "Başlık", "Başlık"], ["", "", ""], ["", "", ""]];
  const yaz = (r: number, c: number, v: string) => onGuncelle({ tablo: t.map((s, i) => (i === r ? s.map((h, j) => (j === c ? v : h)) : s)) });
  return (
    <div className="group/t relative my-2">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[420px] border-collapse text-[14px]">
          <tbody>
            {t.map((s, r) => (
              <tr key={r} className="group/r">
                {s.map((h, c) => (
                  <td key={c} className={cn("border border-white/[0.1] p-0", r === 0 && "bg-white/[0.04]")}>
                    <input value={h} readOnly={kilit} onChange={(e) => yaz(r, c, e.target.value)} placeholder={r === 0 ? "Başlık" : ""} aria-label={`Satır ${r + 1}, sütun ${c + 1}`}
                      className={cn("h-9 w-full min-w-[110px] bg-transparent px-2.5 text-white outline-none placeholder:text-white/25 focus:bg-white/[0.04]", r === 0 ? "font-semibold" : "text-white/85")} />
                  </td>
                ))}
                {!kilit && t.length > 2 && r > 0 && <td className="w-0 border-0 p-0"><button onClick={() => onGuncelle({ tablo: t.filter((_, i) => i !== r) }, true)} aria-label="Satırı sil" className="ml-1 flex h-6 w-6 items-center justify-center rounded-[6px] text-white/35 opacity-0 hover:bg-white/[0.08] hover:text-white group-hover/r:opacity-100"><X className="h-3.5 w-3.5" /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!kilit && (
        <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover/t:opacity-100 focus-within:opacity-100">
          <button onClick={() => onGuncelle({ tablo: [...t, t[0].map(() => "")] }, true)} className="flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Satır</button>
          {t[0].length < 8 && <button onClick={() => onGuncelle({ tablo: t.map((s, i) => [...s, i === 0 ? "Başlık" : ""]) }, true)} className="flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Sütun</button>}
          {t[0].length > 1 && <button onClick={() => onGuncelle({ tablo: t.map((s) => s.slice(0, -1)) }, true)} className="flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white"><Trash2 className="h-3.5 w-3.5" />Son sütunu sil</button>}
        </div>
      )}
    </div>
  );
}

/* ── Bağlantı (yer imi) bloğu ── */
export function BaglantiBlok({ x, kilit, onGuncelle }: { x: BrifBlok; kilit?: boolean; onGuncelle: (p: Partial<BrifBlok>, yapisal?: boolean) => void }) {
  const [v, setV] = useState("");
  const url = x.url;
  const host = useMemo(() => { try { return url ? new URL(url).hostname.replace(/^www\./, "") : ""; } catch { return url ?? ""; } }, [url]);
  if (!url) return (
    <form onSubmit={(e) => { e.preventDefault(); const u = v.trim(); if (!u) return; onGuncelle({ url: /^https?:/.test(u) ? u : `https://${u}` }, true); }} className="my-1.5 flex items-center gap-2 rounded-[12px] bg-white/[0.04] p-1.5 pl-3 ring-1 ring-inset ring-white/[0.08]">
      <Link2 className="h-4 w-4 shrink-0 text-white/45" />
      <input value={v} disabled={kilit} onChange={(e) => setV(e.target.value)} placeholder="Bağlantıyı yapıştır: moodboard, senaryo, marka kılavuzu" className="h-8 min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35" />
      <button disabled={!v.trim()} className="h-8 shrink-0 rounded-[9px] bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-40">Ekle</button>
    </form>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group/l my-1.5 flex items-center gap-3 rounded-[12px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.06]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" className="h-5 w-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-white">{host}</span><span className="block truncate text-[12.5px] text-white/50">{url}</span></span>
      {!kilit && <button onClick={(e) => { e.preventDefault(); onGuncelle({ url: undefined }, true); }} aria-label="Bağlantıyı değiştir" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-white/45 opacity-0 hover:bg-white/[0.08] hover:text-white group-hover/l:opacity-100"><X className="h-3.5 w-3.5" /></button>}
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5 group-hover/l:text-white" />
    </a>
  );
}

/* ── Yorumlar ── */
export function YorumKutusu({ yorumlar, kim, onEkle, onCoz, onSil, onKapat }: { yorumlar: BrifYorum[]; kim: string; onEkle: (m: string) => void; onCoz: (id: string) => void; onSil: (id: string) => void; onKapat: () => void }) {
  const [m, setM] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = setTimeout(() => ref.current?.focus(), 40); return () => clearTimeout(t); }, []);
  const gonder = () => { const t = m.trim(); if (!t) return; onEkle(t); setM(""); };
  return (
    <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16, ease }}
      className="w-[300px] overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#18191c]" onKeyDown={(e) => e.key === "Escape" && onKapat()}>
      {yorumlar.length > 0 && (
        <div className="max-h-[260px] space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
          {yorumlar.map((y) => (
            <div key={y.id} className={cn("group/y", y.cozuldu && "opacity-50")}>
              <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#55d6fd] text-[11px] font-semibold text-black"><User className="h-3.5 w-3.5" /></span>
                <span className="text-[13px] font-medium text-white">{y.kim}</span><span className="text-[11.5px] text-white/40">{gorece(y.zaman) || "az önce"}</span>
                <span className="flex-1" />
                <button onClick={() => onCoz(y.id)} title={y.cozuldu ? "Yeniden aç" : "Çözüldü"} className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/45 opacity-0 hover:bg-white/[0.08] hover:text-white group-hover/y:opacity-100"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => onSil(y.id)} title="Sil" className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/45 opacity-0 hover:bg-white/[0.08] hover:text-rose-300 group-hover/y:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <p className={cn("mt-1 whitespace-pre-wrap pl-8 text-[13.5px] leading-relaxed text-white/85", y.cozuldu && "line-through")}>{y.metin}</p>
            </div>
          ))}
        </div>
      )}
      <div className={cn("flex items-end gap-2 p-2.5", yorumlar.length > 0 && "border-t border-white/[0.06]")}>
        <textarea ref={ref} value={m} rows={1} onChange={(e) => setM(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } }}
          placeholder={yorumlar.length ? "Yanıtla" : `${kim} olarak yorum yaz`} className="max-h-28 min-h-9 flex-1 resize-none rounded-[10px] bg-white/[0.05] px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/35 [field-sizing:content]" />
        <button onClick={gonder} disabled={!m.trim()} className="h-9 shrink-0 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-40">Gönder</button>
      </div>
    </motion.div>
  );
}

export function YorumRozeti({ n, onClick }: { n: number; onClick: () => void }) {
  return (
    <button onClick={onClick} title={`${n} yorum`} className="flex h-6 items-center gap-1 rounded-full bg-white/[0.06] px-2 text-[11.5px] font-medium text-white/70 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] hover:text-white">
      <MessageSquare className="h-3 w-3" />{n}
    </button>
  );
}

/* ── Yardımcılar ── */
/** Yüklenen görseli tarayıcıda küçültür (localStorage'a sığsın). */
export function gorselKucult(f: File, en = 1600): Promise<string> {
  return new Promise((coz, red) => {
    const r = new FileReader();
    r.onerror = red;
    r.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const o = Math.min(1, en / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        coz(c.toDataURL("image/jpeg", 0.84));
      };
      img.onerror = red;
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
  });
}

/** Yazdırma için temiz HTML belge. */
export function yazdirmaBelgesi(baslik: string, md: string) {
  const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const govde = md.split("\n").map((l) => {
    const t = kacis(l);
    if (l.startsWith("## ")) return `<h2>${t.slice(3)}</h2>`;
    if (l.startsWith("### ")) return `<h3>${t.slice(4)}</h3>`;
    if (/^- \[x\] /i.test(l)) return `<p class="yap ok">☑ ${t.slice(6)}</p>`;
    if (/^- \[ \] /.test(l)) return `<p class="yap">☐ ${t.slice(6)}</p>`;
    if (l.startsWith("- ")) return `<li>${t.slice(2)}</li>`;
    if (l.startsWith("> ")) return `<blockquote>${t.slice(2)}</blockquote>`;
    if (l === "---") return "<hr>";
    return l.trim() ? `<p>${t}</p>` : "";
  }).join("\n");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${kacis(baslik)}</title><style>
body{font:15px/1.65 -apple-system,Segoe UI,Inter,sans-serif;color:#111;max-width:720px;margin:48px auto;padding:0 24px}
h1{font-size:34px;margin:0 0 24px}h2{font-size:21px;margin:28px 0 8px;border-bottom:1px solid #e5e5e5;padding-bottom:6px}h3{font-size:17px;margin:18px 0 6px}
li{margin:2px 0 2px 18px}blockquote{margin:8px 0;padding:10px 14px;background:#f4f4f5;border-radius:8px}.yap.ok{color:#888;text-decoration:line-through}hr{border:0;border-top:1px solid #ddd;margin:20px 0}
</style></head><body><h1>${kacis(baslik)}</h1>${govde}<script>onload=()=>setTimeout(()=>print(),200)</script></body></html>`;
}

