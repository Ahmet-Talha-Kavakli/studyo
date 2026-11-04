"use client";

import { temaSinifi, useTuvalTema } from "@/lib/tuval/tema";
import { KrediJeton } from "@/components/ui/KrediHap";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ArrowUp, Check, Clapperboard, Clock, Copy, ImagePlus, Images, LayoutTemplate, Loader2, MoreHorizontal, Music2, Pencil, Play, Plus, Search, ShoppingBag, Trash2, Type, Upload, UserRound, Video, Workflow, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Yuzen } from "@/components/ui/Yuzen";
import { gorselYukle } from "@/components/arac/kit";
import { KATALOG, PORT_RENK } from "@/lib/tuval/katalog";
import { SABLONLAR, akisPlanla, tarifKredi, tarifKur, type Sablon } from "@/lib/tuval/kurucu";
import { dugumOlustur, useTuval, yeniId, type Tuval } from "@/store/useTuval";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const TUVAL_HERO = havuzSec("tuval", ["soyut", "yapay"]);

/**
 * Canvas ana sayfası (2026-10-30, "B · Akış vitrini + sekmeler"): üstte kart içinde başlık + istekten akış kuran kutu ve
 * sağda gerçek görsellerle çalışan canlı bir akış vitrini; altında Tuvallerim / Şablonlar sekmeleri. Şablonlar yatay satır:
 * kapak, ad, adım çipleri (türüne göre renkli), kredi, süre, Aç.
 */
const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const KART = "overflow-hidden rounded-[24px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const MENU = "rounded-[14px] border border-white/[0.08] bg-[var(--tv-yukselti)] p-1.5";
const MSATIR = "flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.075]";
const KAT: Record<string, string> = { "gorselden-video": "Video", "kisa-film": "Video", karakter: "Görsel", tanitim: "Ses", storyboard: "Görsel", urun: "Pazarlama", afis: "Pazarlama", montaj: "Video", podcast: "Ses", giydir: "Pazarlama", hikaye: "Görsel" };
const KATLAR = ["Tümü", "Video", "Görsel", "Pazarlama", "Ses"];
const ORNEKLER: [string, typeof Type, string][] = [["Reklam videosu", ShoppingBag, "Ürün fotoğrafından 3 reklam videosu"], ["Karakter tutarlılığı", UserRound, "Bir karakteri 4 sahnede aynı tut"], ["Müzikli klip", Music2, "Görseli canlandır, müzik ekle"], ["Kısa film", Clapperboard, "3 sahneli kısa film: görsel ve video"]];
/** Editördeki zeminle aynı: küçük ve büyük kareli çizgi ızgara. */
const IZGARA = { backgroundImage: "linear-gradient(to right, color-mix(in srgb, var(--tv-nokta) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--tv-nokta) 55%, transparent) 1px, transparent 1px), linear-gradient(to right, var(--tv-nokta) 1px, transparent 1px), linear-gradient(to bottom, var(--tv-nokta) 1px, transparent 1px)", backgroundSize: "16px 16px, 16px 16px, 80px 80px, 80px 80px" };

function goreli(t: number) {
  const dk = Math.floor((Date.now() - t) / 60000);
  if (dk < 1) return "az önce"; if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60); if (sa < 24) return `${sa} sa önce`;
  const g = Math.floor(sa / 24); return g === 1 ? "dün" : g < 7 ? `${g} gün önce` : new Date(t).toLocaleDateString("tr", { day: "numeric", month: "short" });
}
const kapakBul = (t: Tuval) => { for (const d of [...t.dugumler].reverse()) { const s = d.surumler[d.aktif] ?? d.surumler.at(-1); if (s?.tip === "gorsel" && s.url) return s.url; if (s?.tip === "video" && s.poster) return s.poster; } return null; };
const altMetin = (s: string) => s.replace(/\s*(→|\+)\s*/g, ", ");

/** Şablonun adımları: sütunlara göre benzersiz düğüm türleri. */
function adimlar(s: Sablon) {
  const kol = new Map<number, Set<string>>();
  for (const d of s.tarif.dugumler) { const k = kol.get(d.kol) ?? new Set(); k.add(d.tur); kol.set(d.kol, k); }
  return [...kol.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => [...t].map((x) => KATALOG[x as keyof typeof KATALOG]));
}
function AdimCipleri({ s, en = 4 }: { s: Sablon; en?: number }) {
  const l = adimlar(s);
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {l.slice(0, en).map((sut, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="h-px w-2 bg-white/20" />}
          {sut.map((k) => { const I = k.ikon; return <span key={k.tur} title={k.ad} className="flex h-6 items-center gap-1 rounded-full bg-white/[0.065] px-2 text-[11.5px] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.06]"><I className="h-3 w-3" style={{ color: PORT_RENK[k.cikti ?? "metin"] }} />{k.ad}</span>; })}
        </span>
      ))}
      {l.length > en && <span className="text-[11.5px] text-[var(--sc-metin-3)]">+{l.length - en} adım</span>}
    </span>
  );
}

/** Kapak görseli yoksa akışın küçük bir haritası. */
function MiniAkis({ t }: { t: Tuval }) {
  if (!t.dugumler.length) return <div className="flex h-full flex-col items-center justify-center gap-2 text-[12.5px] text-[var(--sc-metin-3)]"><Workflow className="h-5 w-5" />Boş tuval</div>;
  const x0 = Math.min(...t.dugumler.map((d) => d.x)), y0 = Math.min(...t.dugumler.map((d) => d.y));
  const x1 = Math.max(...t.dugumler.map((d) => d.x + KATALOG[d.tur].genislik)), y1 = Math.max(...t.dugumler.map((d) => d.y + 220));
  const o = Math.min(260 / (x1 - x0 + 1), 130 / (y1 - y0 + 1));
  const ox = (280 - (x1 - x0) * o) / 2, oy = (150 - (y1 - y0) * o) / 2;
  return (
    <svg viewBox="0 0 280 150" className="h-full w-full" style={IZGARA}>
      {t.kenarlar.map((k) => { const A = t.dugumler.find((d) => d.id === k.kaynak), B = t.dugumler.find((d) => d.id === k.hedef); if (!A || !B) return null;
        const ax = ox + (A.x + KATALOG[A.tur].genislik - x0) * o, ay = oy + (A.y + 40 - y0) * o, bx = ox + (B.x - x0) * o, by = oy + (B.y + 40 - y0) * o;
        return <path key={k.id} d={`M${ax},${ay} C${ax + 20},${ay} ${bx - 20},${by} ${bx},${by}`} fill="none" stroke={PORT_RENK[KATALOG[A.tur].cikti ?? "metin"]} strokeOpacity={0.6} strokeWidth={1.4} />; })}
      {t.dugumler.map((d) => { const c = KATALOG[d.tur].cikti; const r = c ? PORT_RENK[c] : "#8693a5"; const x = ox + (d.x - x0) * o, y = oy + (d.y - y0) * o, w = KATALOG[d.tur].genislik * o, h = Math.max(14, 200 * o); return (
        <g key={d.id}><rect x={x} y={y} width={w} height={h} rx={4} fill="var(--tv-yukselti)" stroke={r} strokeOpacity={0.45} /><rect x={x} y={y} width={w} height={Math.max(3, h * 0.16)} rx={2} fill={r} fillOpacity={0.55} /></g>
      ); })}
    </svg>
  );
}

/* ── Vitrin: gerçek görsellerle çalışan küçük bir akış (İstem, Görsel, Video), kenarlarda akan veri ── */
function VitrinAkis() {
  const kutu = "absolute overflow-hidden rounded-[14px] bg-[var(--tv-kart)] ring-1 ring-inset ring-white/[0.1]";
  const bas = (I: React.ElementType, ad: string, renk: string, model?: string) => (
    <div className="flex h-7 items-center gap-1.5 whitespace-nowrap border-b border-white/[0.06] px-2.5 text-[11px] font-medium"><I className="h-3 w-3 shrink-0" style={{ color: renk }} />{ad}{model && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title={model} />}</div>
  );
  const kenar = (d: string, renk: string, gec: number) => (
    <g>
      <path d={d} fill="none" stroke={renk} strokeOpacity={0.35} strokeWidth={1.6} />
      <motion.path d={d} fill="none" stroke={renk} strokeWidth={1.6} strokeDasharray="6 14" initial={{ strokeDashoffset: 40 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: gec }} />
    </g>
  );
  return (
    <div aria-hidden className="relative h-[300px] w-[520px]">
      <svg viewBox="0 0 520 300" className="absolute inset-0 h-full w-full">
        {kenar("M150 92 C180 92 180 70 205 70", "var(--tv-p-metin)", 0)}
        {kenar("M150 92 C190 92 185 210 205 210", "var(--tv-p-metin)", 0.3)}
        {kenar("M345 70 C370 70 365 120 380 120", "var(--tv-p-gorsel)", 0.6)}
        {kenar("M345 210 C370 210 365 140 380 140", "var(--tv-p-gorsel)", 0.9)}
      </svg>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }} className={cn(kutu, "left-0 top-[52px] w-[150px]")}>
        {bas(Type, "İstem", "var(--tv-p-metin)")}
        <p className="p-2.5 text-[11px] leading-snug text-[var(--sc-metin-2)]">Çölde yalnız bir gezgin, altın saat, anamorfik</p>
      </motion.div>
      {[["/gercek/canvas/sablon-uzun.webp", 18, "Görsel 1"], ["/gercek/canvas/cv-hero-portre.webp", 158, "Görsel 2"]].map(([src, y, ad], i) => (
        <motion.div key={ad as string} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.1, duration: 0.5, ease: EASE }} className={cn(kutu, "left-[205px] w-[140px]")} style={{ top: y as number }}>
          {bas(ImagePlus, "Görsel üret", "var(--tv-p-gorsel)", "Vayra Ruh")}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src as string} alt="" className="h-[76px] w-full object-cover" />
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: EASE }} className={cn(kutu, "left-[380px] top-[78px] w-[140px]")}>
        {bas(Video, "Video üret", "var(--tv-p-video)", "Seedance")}
        <div className="relative h-[92px]">
          <video src={TUVAL_HERO.video} poster={TUVAL_HERO.poster} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10.5px] text-[var(--sc-metin-3)]"><Check className="h-3 w-3 text-[var(--tv-p-video)]" />Bitti</div>
      </motion.div>
    </div>
  );
}

function TuvalKarti({ t, i }: { t: Tuval; i: number }) {
  const [menu, setMenu] = useState(false);
  const [adlandir, setAdlandir] = useState(false);
  const kapak = kapakBul(t);
  const cikti = t.dugumler.reduce((n, d) => n + d.surumler.filter((x) => x.url && x.tip !== "metin").length, 0);
  const sil = () => { const yedek = t; useTuval.getState().sil(t.id); toast("Tuval silindi", { description: `${t.ad} silindi.`, action: { label: "Geri al", onClick: () => useTuval.setState((s) => ({ tuvaller: [yedek, ...s.tuvaller.filter((x) => x.id !== yedek.id)] })) } }); };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...YAY, delay: Math.min(i, 8) * 0.03 }}
      whileHover={{ y: -2 }} className="group relative overflow-hidden rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] transition-shadow hover:ring-white/[0.16]">
      <Link href={`/panel/canvas/${t.id}`} className="relative block aspect-[16/10] overflow-hidden bg-[var(--tv-sayfa)]">
        {kapak ? <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]" style={{ backgroundImage: `url("${kapak}")` }} /> : <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"><MiniAkis t={t} /></div>}
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-2 top-2 flex gap-1">
          {t.dugumler.length > 0 && <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm"><Workflow className="h-3 w-3" />{t.dugumler.length}</span>}
          {cikti > 0 && <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm"><Images className="h-3 w-3" />{cikti}</span>}
        </span>
        <span className="absolute bottom-2 right-2 flex translate-y-1 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-black opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">Aç<ArrowRight className="h-3 w-3" /></span>
      </Link>
      <div className="flex items-center gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          {adlandir ? (
            <input autoFocus defaultValue={t.ad} onBlur={(e) => { const v = e.target.value.trim(); if (v) useTuval.getState().guncelle(t.id, (x) => ({ ...x, ad: v.slice(0, 60) }), false); setAdlandir(false); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setAdlandir(false); }}
              className="h-7 w-full rounded-md bg-white/[0.075] px-2 text-[13.5px] outline-none ring-1 ring-white/30" />
          ) : <Link href={`/panel/canvas/${t.id}`} className="block truncate text-[14px] font-medium">{t.ad}</Link>}
          <p className="flex items-center gap-1 text-[12px] text-[var(--sc-metin-3)]"><Clock className="h-3 w-3" />{goreli(t.guncelleme)}{!t.dugumler.length && <span> · Boş</span>}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} aria-label={`${t.ad} menüsü`} aria-expanded={menu} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[var(--sc-metin-3)] transition hover:bg-white/[0.08] hover:text-[var(--sc-metin)]", menu ? "bg-white/[0.08] opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
          <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="ust-sag" bosluk={6} etiket="Tuval eylemleri" className={cn(MENU, "w-[190px]")}>
            <button onClick={() => { setMenu(false); setAdlandir(true); }} className={MSATIR}><Pencil className="h-4 w-4 text-[var(--sc-metin-3)]" />Yeniden adlandır</button>
            <button onClick={() => { setMenu(false); if (useTuval.getState().cogalt(t.id)) toast.success("Tuval çoğaltıldı"); }} className={MSATIR}><Copy className="h-4 w-4 text-[var(--sc-metin-3)]" />Çoğalt</button>
            <div className="my-1 h-px bg-white/[0.08]" />
            <button onClick={() => { setMenu(false); sil(); }} className={cn(MSATIR, "text-rose-300 hover:bg-rose-500/10")}><Trash2 className="h-4 w-4" />Sil</button>
          </Yuzen>
        </div>
      </div>
    </motion.div>
  );
}

function SablonKarti({ s, i, onAc }: { s: Sablon; i: number; onAc: () => void }) {
  const kr = tarifKredi(s.tarif);
  const yukle = s.tarif.dugumler.some((d) => d.tur === "yukle");
  const sut = adimlar(s).flat();
  return (
    <motion.button onClick={onAc} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i, 9) * 0.035, duration: 0.35, ease: EASE }}
      className="group overflow-hidden rounded-[20px] text-left ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.2]" style={{ background: "rgba(255,255,255,0.03)" }}>
      <span className="relative block aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
        <span className="absolute left-3 top-3 flex gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white backdrop-blur"><KrediJeton boyut={12} />{kr}</span>
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-medium text-white backdrop-blur"><Clock className="h-3 w-3" />{s.sure.replace("yaklaşık ", "")}</span>
        </span>
        {yukle && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-medium text-white backdrop-blur"><Upload className="h-3 w-3" />Görselinle</span>}
        <span className="absolute inset-x-3.5 bottom-3"><span className="block truncate text-[16px] font-semibold text-white">{s.ad}</span><span className="block truncate text-[12.5px] text-white/70">{altMetin(s.alt)}</span></span>
      </span>
      <span className="flex items-center gap-3 px-3.5 py-3">
        <span className="flex min-w-0 flex-1 items-center">
          {sut.slice(0, 6).map((k, j) => { const I = k.ikon; const r = k.cikti ? PORT_RENK[k.cikti] : "#8693a5"; return (
            <span key={k.tur + j} className="flex items-center">
              {j > 0 && <span className="h-px w-3" style={{ background: "rgba(255,255,255,0.18)" }} />}
              <span title={k.ad} className="flex h-8 w-8 items-center justify-center rounded-[10px] ring-1 ring-inset ring-white/[0.08]" style={{ background: `color-mix(in srgb, ${r} 16%, transparent)` }}><I className="h-3.5 w-3.5" style={{ color: r }} /></span>
            </span>
          ); })}
          {sut.length > 6 && <span className="ml-1.5 text-[11.5px] text-[var(--sc-metin-3)]">+{sut.length - 6}</span>}
        </span>
        <span className="flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold text-white transition group-hover:bg-white group-hover:text-black" style={{ background: "rgba(255,255,255,0.085)" }}>Kullan<ArrowRight className="h-3.5 w-3.5" /></span>
      </span>
    </motion.button>
  );
}

export function TuvalAnaSayfa() {
  const router = useRouter();
  const hepsi = useTuval((s) => s.tuvaller);
  const tuvaller = useMemo(() => hepsi.filter((t) => !t.gizli), [hepsi]);
  const tema = useTuvalTema((s) => s.tema);
  const [hazir, setHazir] = useState(false);
  const [istek, setIstek] = useState("");
  const [sekme, setSekme] = useState<"tuval" | "sablon" | null>(null);
  const [kat, setKat] = useState("Tümü");
  const [ara, setAra] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const girdi = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setHazir(true), []);
    const sirali = useMemo(() => [...tuvaller].sort((a, b) => b.guncelleme - a.guncelleme), [tuvaller]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const gorunenTuval = sirali.filter((t) => !q || t.ad.toLocaleLowerCase("tr").includes(q));
  const gorunenSablon = SABLONLAR.filter((s) => (kat === "Tümü" || KAT[s.id] === kat) && (!q || `${s.ad} ${s.alt}`.toLocaleLowerCase("tr").includes(q)));

  const yeniTuval = (p?: Partial<Tuval>) => { const id = useTuval.getState().olustur(p); router.push(`/panel/canvas/${id}`); };
  const istektenKur = () => {
    const t = istek.trim(); if (t.length < 3) return;
    const plan = akisPlanla(t); const k = tarifKur(plan.tarif);
    yeniTuval({ ad: t.slice(0, 48), dugumler: k.dugumler, kenarlar: k.kenarlar });
    toast.success(`${k.dugumler.length} düğümlü akış kuruldu`, { description: `Tahmini ${plan.kredi} kredi. Kontrol et, sonra Tümünü çalıştır.` });
  };
  const sablonAc = (s: Sablon) => { const k = tarifKur(s.tarif); yeniTuval({ ad: s.ad, dugumler: k.dugumler, kenarlar: k.kenarlar, sablon: s.id }); };
  const gorselleBasla = async (f?: File) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { mesaj.desteklenmeyenDosya("PNG, JPG ya da WEBP görsel"); return; }
    setYukleniyor(true);
    try {
      const veri = await new Promise<string>((coz) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.readAsDataURL(f); });
      const url = await gorselYukle(veri);
      const y = dugumOlustur("yukle", 120, 160, { surumler: [{ id: yeniId("s"), tip: "gorsel", url, metin: f.name, zaman: Date.now() }], durum: "bitti" });
      const g = dugumOlustur("gorsel", 500, 120, { metin: "Bu görseli farklı bir sahnede yeniden yorumla", ayar: { oran: "1:1", adet: 1 } });
      yeniTuval({ ad: f.name.replace(/\.[^.]+$/, "").slice(0, 48) || "Görselden akış", dugumler: [y, g], kenarlar: [{ id: yeniId("e"), kaynak: y.id, hedef: g.id, port: "ref" }] });
    } catch { mesaj.yuklenemedi("Görsel"); }
    setYukleniyor(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div data-mikro className={`sc-kapsam ${temaSinifi(tema)} min-h-screen bg-[var(--tv-sayfa)] text-[var(--sc-metin)]`}>
        <div className="mx-auto w-full max-w-[1240px] space-y-4 px-6 pb-24 pt-8 max-sm:px-4 max-sm:pt-5">
          {/* Başlık kartı */}
          <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white" style={{ background: "rgba(255,255,255,0.085)" }}><Workflow className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Canvas</span><span className="block truncate text-[12.5px] text-white/50">Görsel, video ve ses modellerini tek akışa bağla</span></span>
            <button onClick={() => yeniTuval()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95"><Plus className="h-4 w-4" />Boş tuval</button>
          </div>

          {/* Vitrin: editörün ızgarası üzerinde başlık + cam istek kutusu, sağda canlı akış */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="relative isolate overflow-hidden rounded-[28px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "var(--tv-sayfa)" }}>
            <div aria-hidden className="absolute inset-0 -z-10" style={IZGARA} />
            <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 80% at 78% 50%, rgba(85,214,253,0.10), transparent 70%), linear-gradient(90deg, var(--tv-sayfa) 0%, color-mix(in srgb, var(--tv-sayfa) 85%, transparent) 42%, transparent 70%)" }} />
            <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 px-6 py-9 sm:px-10 lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_540px]">
              <div className="min-w-0">
                <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.05em] text-white max-sm:text-[34px]">Fikrini yaz<br /><span className="hero-isilti">akışı ben kurayım</span></h1>
                <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-[var(--sc-metin-2)]">İstem, görsel, video ve ses düğümleri birbirine bağlanır; her adımın kredisi önceden belli, tek tuşla hepsi çalışır.</p>
                <form onSubmit={(e) => { e.preventDefault(); istektenKur(); }} className="cam-istemci mt-6 max-w-[560px] rounded-[24px] p-3">
                  <textarea ref={girdi} value={istek} onChange={(e) => setIstek(e.target.value)} rows={2} aria-label="Akış isteği"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); istektenKur(); } }}
                    placeholder="Ne üretmek istiyorsun? Örneğin: ürün fotoğrafından 3 reklam videosu"
                    className="block w-full resize-none bg-transparent px-1.5 py-1 text-[15.5px] leading-relaxed text-white outline-none placeholder:text-[var(--sc-metin-2)]" />
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => dosya.current?.click()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white/85 ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.1]" style={{ background: "rgba(255,255,255,0.085)" }}>{yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Görsel ekle</button>
                    <span className="flex-1" />
                    <motion.button whileTap={{ scale: 0.94 }} onClick={(e) => { if (istek.trim().length < 3) { e.preventDefault(); girdi.current?.focus(); } }} title="Akışı kur (Enter)" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white pl-4 pr-3.5 text-[13.5px] font-semibold text-black transition">Akışı kur<ArrowUp className="h-4 w-4" strokeWidth={2.4} /></motion.button>
                  </div>
                  <input ref={dosya} type="file" accept="image/*" className="hidden" onChange={(e) => { void gorselleBasla(e.target.files?.[0]); e.target.value = ""; }} />
                </form>
                <ol className="mt-5 flex flex-wrap gap-2">
                  {([[Type, "Fikrini yaz"], [Workflow, "Akış kurulur"], [Play, "Tümünü çalıştır"]] as const).map(([I, ad], i) => (
                    <motion.li key={ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="flex h-9 items-center gap-2 rounded-full pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.06)" }}><span className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums text-white" style={{ background: "rgba(255,255,255,0.1)" }}>{i + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{ad}</motion.li>
                  ))}
                </ol>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }} className="relative hidden h-[340px] lg:block">
                <div className="absolute inset-0 flex items-center justify-center"><VitrinAkis /></div>
              </motion.div>
            </div>
          </motion.section>

          {/* Tuvallerim */}
          {tuvaller.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease: EASE }} className={KART} style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: "rgba(255,255,255,0.085)" }}><Clock className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[15.5px] font-semibold text-white">Tuvallerim<span className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/75" style={{ background: "rgba(255,255,255,0.085)" }}>{tuvaller.length}</span></span><span className="block text-[12.5px] text-white/50">En son düzenlenen önce</span></span>
                {tuvaller.length > 3 && (
                  <label className="flex h-9 w-[220px] items-center gap-2 rounded-full px-3 ring-1 ring-inset ring-white/[0.08] transition focus-within:ring-white/25 max-sm:w-full" style={{ background: "rgba(255,255,255,0.045)" }}>
                    <Search className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" />
                    <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Tuval ara" aria-label="Tuval ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sc-metin-3)]" />
                  </label>
                )}
              </div>
              {gorunenTuval.length ? (
                <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 md:grid-cols-3 lg:grid-cols-4">
                  <AnimatePresence initial={false}>{gorunenTuval.map((t, i) => <TuvalKarti key={t.id} t={t} i={i} />)}</AnimatePresence>
                  {gorunenTuval.length < 4 && !q && (
                    <motion.button whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }} onClick={() => yeniTuval()} className="group relative flex aspect-[16/10] flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/[0.2]" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span aria-hidden className="absolute inset-0 opacity-50" style={IZGARA} />
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition duration-300 group-hover:rotate-90"><Plus className="h-5 w-5" /></span>
                      <span className="relative text-[13.5px] font-semibold text-white">Boş tuval</span>
                    </motion.button>
                  )}
                </div>
              ) : <p className="px-5 py-10 text-center text-[13.5px] text-[var(--sc-metin-3)]">&quot;{ara}&quot; ile eşleşen tuval yok.</p>}
            </motion.section>
          )}

          {/* Şablonlar */}
          <motion.section id="cv-liste" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease: EASE }} className={KART} style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: "rgba(255,255,255,0.085)" }}><LayoutTemplate className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[15.5px] font-semibold text-white">Hazır akışlar<span className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/75" style={{ background: "rgba(255,255,255,0.085)" }}>{SABLONLAR.length}</span></span><span className="block text-[12.5px] text-white/50">Düğümler kurulu gelir; istemi değiştir, çalıştır</span></span>
              <div className="gizli-scroll flex gap-1 overflow-x-auto max-md:order-last max-md:w-full">
                {KATLAR.map((k) => <button key={k} onClick={() => setKat(k)} className={cn("h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium transition", kat === k ? "bg-white text-black" : "text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.08] hover:text-white")} style={kat === k ? undefined : { background: "rgba(255,255,255,0.045)" }}>{k}</button>)}
              </div>
            </div>
            {gorunenSablon.length ? (
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
                <AnimatePresence initial={false}>{gorunenSablon.map((x, i) => <SablonKarti key={x.id} s={x} i={i} onAc={() => sablonAc(x)} />)}</AnimatePresence>
                {gorunenSablon.length % 3 !== 0 && (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => yeniTuval()} className="group relative hidden min-h-[240px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] text-center ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.2] lg:flex" style={{ background: "rgba(255,255,255,0.03)", gridColumn: gorunenSablon.length % 3 === 1 ? "span 2" : undefined }}>
                    <span aria-hidden className="absolute inset-0 opacity-60" style={IZGARA} />
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition duration-300 group-hover:rotate-90"><Plus className="h-5 w-5" /></span>
                    <span className="relative"><span className="block text-[15px] font-semibold text-white">Kendi akışını kur</span><span className="mt-0.5 block text-[12.5px] text-[var(--sc-metin-3)]">Boş tuvalde düğümleri sürükle, bağla</span></span>
                  </motion.button>
                )}
              </div>
            ) : <p className="px-5 py-10 text-center text-[13.5px] text-[var(--sc-metin-3)]">Bu süzgeçle eşleşen şablon yok.</p>}
          </motion.section>
        </div>
      </div>
    </MotionConfig>
  );
}
