"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { BarChart3, Box, Download, ExternalLink, FileText, Globe, ImageIcon, Layers, MessageSquare, Music, PanelRight, Pause, Play, Plus, Presentation, Search, Video, FileSpreadsheet } from "lucide-react";
import { Md } from "./Metin";
import { Kart } from "@/components/film/ortak";
import { api, gorece } from "@/lib/build/istemci";
import { BICIM_ADI } from "@/lib/build/belgeTipler";
import { modelBul } from "@/lib/build/modeller";
import type { Cikti, CiktiTur } from "@/lib/build/sohbetCikti";
import { gorselBelgesi } from "@/lib/build/sohbetGorsel";
import { tarihGrubu, TARIH_GRUPLARI } from "@/lib/build/sohbetYol";
import { cn } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi } from "@/lib/galeri/gorunum";
import { Tooltip } from "@/components/ui/Tooltip";
import { DosyaKucuk, DosyaOnizlemeGovde } from "./DosyaKarti";
import { SagPanel, boyutYaz, dosyaAdi, indir, sayi, yay } from "./ortak";

/**
 * Çıktılar kitaplığı: bütün sohbetlerde üretilen dosyalar (Word, Excel, PowerPoint), görseller, videolar, sesler,
 * HTML sayfaları ve etkileşimli görselleştirmeler tek galeride. Türe göre süzgeç, arama, tarih grupları; kartta gerçek
 * içerikten önizleme, üzerine gelince indir ve kaynak sohbete git; tıklayınca sağ panelde büyük önizleme ve ayrıntılar.
 */
type Suzgec = "tumu" | CiktiTur;
const TURLER: { id: Suzgec; ad: string; I: typeof Layers }[] = [
  { id: "tumu", ad: "Tümü", I: Layers }, { id: "dosya", ad: "Dosyalar", I: FileText }, { id: "gorsel", ad: "Görseller", I: ImageIcon },
  { id: "video", ad: "Videolar", I: Video }, { id: "ses", ad: "Sesler", I: Music }, { id: "html", ad: "Sayfalar", I: Globe },
  { id: "gorsellestirme", ad: "Görselleştirmeler", I: BarChart3 }, { id: "tuval", ad: "Tuvaller", I: PanelRight }, { id: "3d", ad: "3D", I: Box },
];
const TUR_ADI: Record<CiktiTur, string> = { dosya: "Dosya", gorsel: "Görsel", video: "Video", ses: "Ses", html: "HTML sayfası", gorsellestirme: "Görselleştirme", "3d": "3D model", tuval: "Tuval" };
const turAdi = (c: Cikti) => (c.tur === "dosya" && c.dosya ? BICIM_ADI[c.dosya.bicim] : TUR_ADI[c.tur]);
const turIkon = (c: Cikti) => (c.tur === "dosya" ? (c.dosya?.bicim === "xlsx" ? FileSpreadsheet : c.dosya?.bicim === "pptx" ? Presentation : FileText) : TURLER.find((t) => t.id === c.tur)?.I ?? Layers);
const htmlBelgesi = (c: Cikti) => (c.tur === "gorsellestirme" ? gorselBelgesi(c.html ?? "", c.baslik) : c.html ?? "");

/** Medya çıktısını (görsel, video, ses, 3D) galeri indir menüsünün beklediği üretim biçimine çevirir; belgeler kendi dosyasıyla iner. */
function medyaUretimi(c: Cikti): Uretim | null {
  if (!c.url || !(c.tur === "gorsel" || c.tur === "video" || c.tur === "ses" || c.tur === "3d")) return null;
  return {
    id: `build_${c.anahtar}`.replace(/[^\w-]/g, "_").slice(0, 80), baslik: c.baslik, tur: c.tur, model: c.model ? modelBul(c.model).ad : "Vayra Build", prompt: c.baslik,
    durum: "tamam", ilerleme: 100, olusturma: c.zaman, kredi: 0, gercek: true,
    ...(c.tur === "gorsel" ? { gorselUrl: c.url } : c.tur === "video" ? { videoUrl: c.url } : c.tur === "3d" ? { glbUrl: c.url } : { sesUrl: c.url }),
  };
}

function cikIndir(c: Cikti) {
  if (c.tur === "html" || c.tur === "gorsellestirme") { indir(`${dosyaAdi(c.baslik)}.html`, htmlBelgesi(c), "text/html;charset=utf-8"); return; }
  if (c.tur === "tuval") { indir(`${dosyaAdi(c.baslik)}.${c.tuval?.tip === "kod" ? "txt" : "md"}`, c.metin ?? ""); return; }
  if (!c.url) return;
  const a = document.createElement("a"); a.href = c.url; a.download = c.dosya?.ad ?? ""; document.body.appendChild(a); a.click(); a.remove();
}

/** Görünür olunca yüklenen, küçültülmüş canlı sayfa (etkileşimsiz). */
function KucukSayfa({ c }: { c: Cikti }) {
  const kap = useRef<HTMLDivElement>(null);
  const [gor, setGor] = useState(false);
  const [olcek, setOlcek] = useState(0.25);
  useEffect(() => {
    const k = kap.current; if (!k) return;
    const io = new IntersectionObserver((l) => { if (l.some((x) => x.isIntersecting)) { setGor(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(k);
    const r = new ResizeObserver(() => setOlcek(k.clientWidth / 760)); r.observe(k);
    return () => { io.disconnect(); r.disconnect(); };
  }, []);
  return (
    <div ref={kap} className="relative h-full w-full overflow-hidden bg-[#121315]">
      {gor && <iframe title={c.baslik} srcDoc={htmlBelgesi(c)} sandbox="allow-scripts" tabIndex={-1} loading="lazy" style={{ width: 760, height: 570, transform: `scale(${olcek})`, transformOrigin: "0 0" }} className={cn("pointer-events-none absolute left-0 top-0 border-0", c.tur === "html" && "bg-white")} />}
    </div>
  );
}

function SesKapak({ c }: { c: Cikti }) {
  const [caliyor, setCaliyor] = useState(false);
  const ses = useRef<HTMLAudioElement>(null);
  const cubuklar = useMemo(() => { let h = 0; for (const x of c.anahtar) h = (h * 31 + x.charCodeAt(0)) >>> 0; return Array.from({ length: 28 }, (_, i) => 0.25 + (((h >> (i % 24)) ^ (i * 2654435761)) % 100) / 140); }, [c.anahtar]);
  return (
    <div className="flex h-full w-full flex-col justify-end bg-gradient-to-br from-[#10232b] to-[#121315] p-3">
      <audio ref={ses} src={c.url} preload="none" onEnded={() => setCaliyor(false)} />
      <div className="mb-3 flex h-12 items-end gap-[3px]">{cubuklar.map((v, i) => <span key={i} style={{ height: `${Math.min(100, v * 100)}%` }} className={cn("w-full rounded-full bg-[#55d6fd]/60", caliyor && "animate-pulse")} />)}</div>
      <button type="button" onClick={(e) => { e.stopPropagation(); const a = ses.current; if (!a) return; if (caliyor) { a.pause(); setCaliyor(false); } else { a.play().then(() => setCaliyor(true)).catch(() => {}); } }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">{caliyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
    </div>
  );
}

function Onizleme({ c }: { c: Cikti }) {
  if (c.tur === "dosya") return <DosyaKucuk k={c.dosya?.kucuk} ad={c.baslik.replace(/\.\w+$/, "")} buyuk />;
  /* eslint-disable-next-line @next/next/no-img-element */
  if (c.tur === "gorsel") return <img src={c.url} alt={c.baslik} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />;
  if (c.tur === "video") return <video src={`${c.url}#t=0.4`} muted playsInline preload="metadata" onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} className="h-full w-full object-cover" />;
  if (c.tur === "ses") return <SesKapak c={c} />;
  if (c.tur === "3d") return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#14202a] to-[#121315]"><Box className="h-9 w-9 text-[#8be6ff]" /></div>;
  if (c.tur === "tuval") return (
    <div className="h-full w-full overflow-hidden bg-[#0f1012] p-3.5">
      <p className={cn("line-clamp-[9] whitespace-pre-wrap text-[11px] leading-[1.55] text-white/60", c.tuval?.tip === "kod" && "sc-kod text-[10.5px] text-[#8be6ff]/70")}>{(c.metin ?? "").slice(0, 700)}</p>
    </div>
  );
  return <KucukSayfa c={c} />;
}

function CiktiKarti({ c, ac, oran }: { c: Cikti; ac: () => void; oran: number }) {
  const I = turIkon(c);
  const medya = medyaUretimi(c);
  const ikonBtn = "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#0b0b0c]/80 text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-[#0b0b0c] active:scale-90";
  return (
    <div className="group relative overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
      <button type="button" onClick={ac} aria-label={`${c.baslik} aç`} className="block w-full overflow-hidden" style={{ aspectRatio: String(oran) }}>{<Onizleme c={c} />}</button>
      <div className="pointer-events-none absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100">
        {medya ? <IndirDugmesi u={medya} side="bottom" className={ikonBtn} ikonSinif="h-3.5 w-3.5" />
          : <Tooltip label="İndir" side="bottom"><button type="button" onClick={() => cikIndir(c)} aria-label="İndir" className={ikonBtn}><Download className="h-3.5 w-3.5" /></button></Tooltip>}
        <Tooltip label="Kaynak sohbete git" side="bottom"><Link href={`/panel/build/sohbet/${c.sohbet.id}`} aria-label="Kaynak sohbete git" className={ikonBtn}><MessageSquare className="h-3.5 w-3.5" /></Link></Tooltip>
      </div>
      <button type="button" onClick={ac} className="block w-full px-3 pb-3 pt-2.5 text-left">
        <span className="block truncate text-[13.5px] font-semibold text-white">{c.baslik}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-white/45">
          <I className="h-3.5 w-3.5 shrink-0" /><span className="shrink-0">{turAdi(c)}</span>
          {c.dosya && c.dosya.surum > 1 && <span className="shrink-0 rounded-full bg-[#55d6fd]/[0.12] px-1.5 text-[11px] text-[#8be6ff]">Sürüm {c.dosya.surum}</span>}
          <span className="shrink-0">·</span><span className="min-w-0 truncate">{c.sohbet.baslik}</span>
        </span>
      </button>
    </div>
  );
}

const BASLANGIC = [
  { metin: "Aylık gelir ve giderlerim için formüllü bir bütçe tablosu hazırla", I: FileSpreadsheet, renk: "#1f9d5a", ad: "Excel tablosu" },
  { metin: "Yeni ürünümüz için 8 slaytlık bir lansman sunumu yap", I: Presentation, renk: "#d9572b", ad: "Sunum" },
  { metin: "Serbest çalışan tasarımcı için hizmet sözleşmesi taslağı yaz, Word belgesi olsun", I: FileText, renk: "#2b7cd3", ad: "Word belgesi" },
  { metin: "Son 12 ayın satışlarını gösteren etkileşimli bir grafik çiz", I: BarChart3, renk: "#55d6fd", ad: "Görselleştirme" },
];

export function Ciktilar() {
  const router = useRouter();
  const [l, setL] = useState<Cikti[] | null>(null);
  const [suzgec, setSuzgec] = useState<Suzgec>("tumu");
  const [ara, setAra] = useState("");
  const [secili, setSecili] = useState<Cikti | null>(null);
  /* Görünüm ayarı (yerleşim, boyut, sıralama) sayfa başına kalıcı. */
  const [g] = useGorunum("build-ciktilar");
  const [alanRef, en] = useAlanGenisligi<HTMLDivElement>(1100);
  const sutun = sutunSayisi(en, g, { enCok: 6 });
  const kartOran = kartOrani(g, 4 / 3);
  useEffect(() => { api<{ ciktilar: Cikti[] }>("/api/build/sohbet/ciktilar").then((v) => setL(v.ciktilar)).catch(() => setL([])); }, []);
  const sayilar = useMemo(() => { const o: Partial<Record<Suzgec, number>> = { tumu: l?.length ?? 0 }; for (const c of l ?? []) o[c.tur] = (o[c.tur] ?? 0) + 1; return o; }, [l]);
  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return (l ?? []).filter((c) => (suzgec === "tumu" || c.tur === suzgec) && (!q || c.baslik.toLocaleLowerCase("tr").includes(q) || c.sohbet.baslik.toLocaleLowerCase("tr").includes(q)))
      .sort((a, b) => (g.siralama === "eski" ? a.zaman - b.zaman : b.zaman - a.zaman));
  }, [l, suzgec, ara, g.siralama]);
  const gruplar = useMemo(() => { const l2 = TARIH_GRUPLARI.map((t) => [t, gorunen.filter((c) => tarihGrubu(c.zaman) === t)] as const).filter(([, x]) => x.length); return g.siralama === "eski" ? [...l2].reverse() : l2; }, [gorunen, g.siralama]);
  const sohbetSayisi = useMemo(() => new Set((l ?? []).map((c) => c.sohbet.id)).size, [l]);
  const turler = TURLER.filter((t) => t.id === "tumu" || (sayilar[t.id] ?? 0) > 0);

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Layers} baslik="Çıktılar" alt={l ? (l.length ? `${sayi(l.length)} çıktı · ${sayi(sohbetSayisi)} sohbetten` : "Sohbetlerde üretilen dosyalar, görseller ve sayfalar burada toplanır") : "Yükleniyor"} govde=""
        sag={<>
          <Link href="/panel/build/sohbet" title="Sohbetler" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-sm:w-9 max-sm:justify-center max-sm:px-0"><MessageSquare className="h-4 w-4" /><span className="max-sm:hidden">Sohbetler</span></Link>
          <Link href="/panel/build/sohbet/yeni" title="Yeni sohbet" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black max-sm:w-9 max-sm:justify-center max-sm:px-0"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yeni sohbet</span></Link>
        </>}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-3 sm:px-4">
          <LayoutGroup id="cikti-suzgec">
            <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-full bg-white/[0.05] p-1 [scrollbar-width:none]">
              {turler.map((t) => (
                <button key={t.id} type="button" onClick={() => setSuzgec(t.id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", suzgec === t.id ? "text-black" : "text-white/65 hover:text-white")}>
                  {suzgec === t.id && <motion.span layoutId="cikti-suzgec-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                  <t.I className="relative h-3.5 w-3.5" /><span className="relative">{t.ad}</span>
                  {!!sayilar[t.id] && <span className={cn("relative rounded-full px-1.5 text-[11px] tabular-nums", suzgec === t.id ? "bg-black/10 text-black/70" : "bg-white/[0.08] text-white/55")}>{sayi(sayilar[t.id]!)}</span>}
                </button>
              ))}
            </div>
          </LayoutGroup>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white/[0.05] px-3.5 text-white/45 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25 md:ml-auto md:w-[280px] md:flex-none">
            <Search className="h-4 w-4 shrink-0" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Çıktılarda ve sohbet adlarında ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          </label>
          {!!l?.length && <GorunumAyari sayfa="build-ciktilar" istemVar={false} dugmeSinif="h-10 w-10" />}
        </div>
        {l === null ? (
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/3.6] animate-pulse rounded-[18px] bg-white/[0.03]" />)}</div>
        ) : !l.length ? (
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Layers className="h-5 w-5" /></span>
              <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">Henüz çıktı yok</span><span className="block text-[13px] text-white/55">Sohbette dosya, görsel, video ya da etkileşimli grafik ürettiğinde burada toplanır.</span></span>
              <Link href="/panel/build/sohbet" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><MessageSquare className="h-4 w-4" />Sohbetler</Link>
              <Link href="/panel/build/sohbet/yeni" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni sohbet</Link>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {BASLANGIC.map((b) => (
                <button key={b.metin} type="button" onClick={() => { try { sessionStorage.setItem("vayra-sohbet-taslak", JSON.stringify({ metin: b.metin })); } catch { /* yok */ } router.push("/panel/build/sohbet/yeni"); }}
                  className="flex items-center gap-3 rounded-[16px] bg-white/[0.035] p-3 text-left ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.07]">
                  <span style={{ background: `${b.renk}22`, color: b.renk }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"><b.I className="h-5 w-5" /></span>
                  <span className="min-w-0"><span className="block text-[12px] text-white/45">{b.ad}</span><span className="block text-[13.5px] leading-snug text-white/85">{b.metin}</span></span>
                </button>
              ))}
            </div>
          </div>
        ) : !gorunen.length ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-white/50">{ara.trim() ? `"${ara.trim()}" geçen bir çıktı yok.` : "Bu türde çıktı yok."}</p>
        ) : (
          <div ref={alanRef} className="space-y-5 p-3 sm:p-4">
            {gruplar.map(([grup, x]) => (
              <section key={grup}>
                <p className="mb-2 flex items-center gap-2 px-1 text-[12.5px] font-medium text-white/50">{grup}<span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] text-white/45">{sayi(x.length)}</span></p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${sutun}, minmax(0, 1fr))` }}>
                  {x.map((c) => <motion.div key={c.anahtar} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, layout: { type: "spring", stiffness: 420, damping: 38 } }}><CiktiKarti c={c} oran={kartOran} ac={() => setSecili(c)} /></motion.div>)}
                </div>
              </section>
            ))}
          </div>
        )}
      </Kart>
      <CiktiPaneli c={secili} kapat={() => setSecili(null)} />
    </div>
  );
}

function CiktiPaneli({ c, kapat }: { c: Cikti | null; kapat: () => void }) {
  const [son, setSon] = useState<Cikti | null>(c);
  useEffect(() => { if (c) setSon(c); }, [c]);
  const x = c ?? son;
  const I = x ? turIkon(x) : Layers;
  return (
    <SagPanel acik={!!c} kapat={kapat} baslik={x?.baslik ?? ""} alt={x ? `${turAdi(x)} · ${gorece(x.zaman)}` : ""} ikon={<I className="h-[18px] w-[18px]" />} genislik={880}
      alt2={x && <>
        <Link href={`/panel/build/sohbet/${x.sohbet.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white hover:bg-white/[0.12]"><MessageSquare className="h-4 w-4" />Sohbete git</Link>
        {(x.tur === "html" || x.tur === "gorsellestirme") && <button type="button" onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(htmlBelgesi(x)); w.document.close(); } }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white hover:bg-white/[0.12] max-sm:hidden"><ExternalLink className="h-4 w-4" />Yeni sekmede aç</button>}
        <span className="ml-auto" />
        {medyaUretimi(x) ? <IndirDugmesi u={medyaUretimi(x)!} yerlesim="ust-sag" side="top" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Download className="h-4 w-4" />İndir</IndirDugmesi>
          : x.tur !== "3d" ? <button type="button" onClick={() => cikIndir(x)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Download className="h-4 w-4" />İndir</button>
          : <a href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Box className="h-4 w-4" />3D modeli aç</a>}
      </>}>
      {x && (
        <div className="space-y-4">
          <div className={cn("overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]", x.tur === "dosya" ? "bg-[#0d0e10] p-3 sm:p-4" : "bg-[#0e0f11]")}>
            {x.tur === "dosya" && x.dosya ? <DosyaOnizlemeGovde id={x.dosya.id} />
              /* eslint-disable-next-line @next/next/no-img-element */
              : x.tur === "gorsel" ? <img src={x.url} alt={x.baslik} className="max-h-[70vh] w-full object-contain" />
                : x.tur === "video" ? <video src={x.url} controls playsInline className="max-h-[70vh] w-full" />
                  : x.tur === "ses" ? <div className="p-4"><audio src={x.url} controls className="w-full" /></div>
                    : x.tur === "3d" ? <div className="flex h-60 items-center justify-center"><Box className="h-10 w-10 text-[#8be6ff]" /></div>
                    : x.tur === "tuval" ? <div className="max-h-[66vh] overflow-auto p-5 [scrollbar-width:thin]">{x.tuval?.tip === "kod" ? <pre className="sc-kod whitespace-pre-wrap text-[12.5px] leading-[1.6] text-white/85">{x.metin}</pre> : <Md metin={x.metin ?? ""} onizle={() => {}} />}</div>
                      : <iframe title={x.baslik} srcDoc={htmlBelgesi(x)} sandbox="allow-scripts allow-forms allow-modals" className={cn("h-[62vh] w-full border-0", x.tur === "html" ? "bg-white" : "bg-[#121315]")} />}
          </div>
          <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] text-[13px] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex gap-3 px-3.5 py-2.5"><dt className="w-24 shrink-0 text-white/45">Tür</dt><dd className="text-white/85">{turAdi(x)}</dd></div>
            <div className="flex gap-3 px-3.5 py-2.5"><dt className="w-24 shrink-0 text-white/45">Sohbet</dt><dd className="min-w-0"><Link href={`/panel/build/sohbet/${x.sohbet.id}`} className="block truncate text-[#8be6ff] hover:underline">{x.sohbet.baslik}</Link></dd></div>
            <div className="flex gap-3 px-3.5 py-2.5"><dt className="w-24 shrink-0 text-white/45">Tarih</dt><dd className="text-white/85">{new Date(x.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd></div>
            {x.dosya && <div className="flex gap-3 px-3.5 py-2.5"><dt className="w-24 shrink-0 text-white/45">Dosya</dt><dd className="text-white/85">{boyutYaz(x.dosya.boyut)} · {x.dosya.ozet}{x.dosya.surum > 1 ? ` · sürüm ${x.dosya.surum}` : ""}</dd></div>}
            {x.model && <div className="flex gap-3 px-3.5 py-2.5"><dt className="w-24 shrink-0 text-white/45">Model</dt><dd className="text-white/85">{modelBul(x.model).ad}</dd></div>}
          </dl>
        </div>
      )}
    </SagPanel>
  );
}
