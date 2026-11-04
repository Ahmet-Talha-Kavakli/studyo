"use client";

/**
 * Uzun video editörü — "1 · Stüdyo" (2026-11-01, kullanıcı seçimi).
 *  Üstte film kartı: geri, ad, ilerleme adımları (Plan, Kareler, Videolar, Montaj), Dışa aktar ve beyaz Montaja aktar.
 *  Solda Animatik kartı: oynatıcı + perde renkli zaman çizgisi (perde blokları, çekim kareleri, müzik izi) ve
 *  kapsamlı toplu üretim (onay penceresiyle). Sağda Çekim / Perde / Film sekmeli müfettiş; Çekim sekmesinin altında
 *  seçili çekimin Apple camı istemcisi (istem + büyük çipler + bölünmüş Kare | Video düğmesi).
 *  Perde ortamı (mekân, zaman, hava) bir kez yazılır, perdedeki her çekimin istemine eklenir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Clapperboard, Clock, Cloud, CloudFog, CloudRain, Moon, Snowflake, Sun, SunDim, Sunrise, Sunset, Combine, Copy, Download, FileSpreadsheet, FileText, Film,
  Image as ImageIcon, Link2, ListVideo, Loader2, MapPin, Maximize2, MoonStar, Music2, Pencil, Plus, Settings2, Sparkles, Trash2, Undo2, Users, Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediJeton } from "@/components/ui/KrediHap";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { MarkaKare } from "@/components/studyo/hf";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useElements } from "@/store/useElements";
import { useFilm, type FilmProje } from "@/store/useFilm";
import {
  CEKIM_BOYLARI, FILM_KAMERALAR, HAVALAR, ZAMANLAR, bolumPlanli, cekimAdi, cekimListesiCsv, fId, filmHedefSn, filmSn, sureYaz, turBul, youtubeBolumleri,
  type FilmBolum, type FilmCekim,
} from "@/lib/filmMotor";
import { ExOynatici, type OynaticiTutamak } from "@/components/explainer/ExOynatici";
import { FILM_STILLER, KARE_KREDI, modelSureleri, sureUydur, bolumuDoldur, cekimKredi, cekimTake, cekimUret, filmMontaj, montajaAktar, stilBul, topluUret } from "./filmUretim";
import { OzelGirdi, Cip, FILM_MODELLER, FORMATLAR, IkonKaro, MUZIKLER, MUZIK_IKON, MenuBaslik, MenuSatiri, OranSimge, PANO, Segment, VideoKaro, VH, SimgeSerit, ease, goreli, perdeRengi, yay } from "./ortak";

const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni"].some((k) => s[k]);
const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
/** Çekim boyu kartlarının örnek kareleri: aynı noir dünyadan, plan boyunu gerçekten gösteren kareler. */
const BOY_GORSEL: Record<FilmCekim["boy"], string> = {
  genis: "/gercek/sinema/sh-city.webp", orta: "/gercek/sinema/tur-Genel.webp", yakin: "/gercek/sinema/ps-superdollyin.webp",
  detay: "/gercek/sinema/ps-eyes.webp", omuz: "/gercek/sinema/sh-tension.webp",
};
const ZAMAN_IKON: Record<string, React.ElementType> = { safak: Sunrise, gunduz: Sun, altin: SunDim, aksam: Sunset, gece: Moon };
const HAVA_IKON: Record<string, React.ElementType> = { acik: Sun, bulutlu: Cloud, yagmur: CloudRain, sis: CloudFog, kar: Snowflake };
type Sekme = "cekim" | "perde" | "film";
type Pop = null | "boy" | "kamera" | "sure" | "model" | "oyuncu" | "surekli" | "kare-onay" | "video-onay" | "disa" | "stil" | "fmodel" | "format" | "muzik";

/** Çekim küçük resmi: seçili video kapağı, yoksa taslak kare; ikisi de yoksa nötr koyu karo (alakasız görsel gösterilmez). */
function CekimKapak({ c, uretimler, className, rozet = true }: { c: FilmCekim; p: FilmProje; uretimler: Uretim[]; className?: string; rozet?: boolean }) {
  const { video, kare } = cekimTake(c, uretimler);
  const bekleyen = c.takes.some((t) => { const u = uretimler.find((x) => x.id === t.uretimId); return u && u.durum !== "tamam" && u.durum !== "hata"; });
  const src = saltUrl(video?.gorselUrl) ?? saltUrl(kare?.gorselUrl);
  return (
    <span className={cn("relative block overflow-hidden bg-[linear-gradient(160deg,#1e1f23,#141518)]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {bekleyen && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 className="h-3.5 w-3.5 animate-spin text-white" /></span>}
      {rozet && video && <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-white text-black"><Film className="h-2.5 w-2.5" /></span>}
    </span>
  );
}

export function FilmEditor({ p }: { p: FilmProje }) {
  const router = useRouter();
  const masaustu = useMasaustu();
  const sag = useSaglayicilar();
  const st = useFilm.getState;
  const secili = useFilm((s) => s.secili);
  const gecmisVar = useFilm((s) => (s.gecmis[p.id]?.length ?? 0) > 0);
  const uretimler = useProjeler((s) => s.uretimler);
  const oynatici = useRef<OynaticiTutamak>(null);
  const [sekme, setSekme] = useState<Sekme>("cekim");
  const [pop, setPop] = useState<Pop>(null);
  const [mesgul, setMesgul] = useState<null | "kare" | "video" | "aktar">(null);
  const [kapsam, setKapsam] = useState<"bolum" | "film">("bolum");
  const [acikTake, setAcikTake] = useState<Uretim | null>(null);
  const [ozelStil, setOzelStil] = useState(p.stil.startsWith("ozel:") ? p.stil.slice(5) : "");
  const ac = (x: Pop) => setPop((v) => (v === x ? null : x));

  const tum = useMemo(() => p.bolumler.flatMap((b) => b.cekimler.map((c) => ({ b, c }))), [p.bolumler]);
  const c = tum.find((x) => x.c.id === secili.cekim)?.c ?? null;
  const bolum = p.bolumler.find((b) => b.id === secili.bolum) ?? (c ? p.bolumler.find((b) => b.cekimler.some((x) => x.id === c.id)) : p.bolumler[0]) ?? null;
  const bolumNo = bolum ? p.bolumler.indexOf(bolum) : 0;
  const toplam = filmSn(p.bolumler), hedef = filmHedefSn(p.bolumler);
  const videolu = tum.filter((x) => cekimTake(x.c, uretimler).video).length;
  const kareli = tum.filter((x) => cekimTake(x.c, uretimler).kare || cekimTake(x.c, uretimler).video).length;
  const montaj = useMemo(() => filmMontaj(p, uretimler), [p, uretimler]);
  const anlar = useMemo(() => { const r: number[] = []; let t = 0; for (const x of tum) { r.push(t); t += x.c.sure; } return r; }, [tum]);
  const secIndex = Math.max(0, tum.findIndex((x) => x.c.id === c?.id));
  const hedefCekimler = kapsam === "bolum" && bolum ? bolum.cekimler : tum.map((x) => x.c);
  const surenVar = (x: FilmCekim, tip: "kare" | "video") => x.takes.some((t) => t.tip === tip && uretimler.find((u) => u.id === t.uretimId)?.durum !== "hata");
  const eksikKare = hedefCekimler.filter((x) => !cekimTake(x, uretimler).kare && !cekimTake(x, uretimler).video && !surenVar(x, "kare"));
  const eksikVideo = hedefCekimler.filter((x) => !cekimTake(x, uretimler).video && !surenVar(x, "video"));
  const videoKredi = eksikVideo.reduce((a, x) => a + cekimKredi(x, p), 0);
  const demoVideo = sag !== null && !VIDEO_HAZIR(sag), demoKare = sag !== null && !GORSEL_HAZIR(sag);

  /* Buzlu cam istemcinin yüksekliği: önizleme altına bu kadar uzanır */
  const istRef = useRef<HTMLDivElement>(null);
  const [istH, setIstH] = useState(0);
  useEffect(() => { const el = istRef.current; if (!el) return; const ro = new ResizeObserver(() => setIstH(Math.round(el.offsetHeight))); ro.observe(el); return () => ro.disconnect(); }, [sekme, secili.cekim, masaustu]);
  /* Zaman çizgisi oynatma çizgisi: her karede state değil doğrudan transform güncellenir */
  const seritIc = useRef<HTMLDivElement>(null), kafa = useRef<HTMLSpanElement>(null), sonT = useRef(0);
  const hucreler = useRef(new Map<string, HTMLElement>());
  const kafaKonumla = (zt: number) => {
    sonT.current = zt;
    let i = 0; for (let k = 0; k < anlar.length; k++) if (zt >= anlar[k] - 0.001) i = k;
    const x = tum[i], el = x && hucreler.current.get(x.c.id), h = kafa.current;
    if (!el || !h) return;
    const oran = Math.max(0, Math.min(1, (zt - anlar[i]) / Math.max(0.01, x.c.sure)));
    h.style.transform = `translateX(${el.offsetLeft + oran * el.offsetWidth}px)`;
  };
  useEffect(() => { kafaKonumla(sonT.current); const ro = new ResizeObserver(() => kafaKonumla(sonT.current)); if (seritIc.current) ro.observe(seritIc.current); return () => ro.disconnect(); }); // eslint-disable-line react-hooks/exhaustive-deps
  const perdeAnlari = useMemo(() => { const r: number[] = []; let zt = 0; for (const b of p.bolumler) { if (zt > 0) r.push(zt); zt += b.cekimler.reduce((a, x) => a + x.sure, 0); } return r; }, [p.bolumler]);
  const isikSrc = c ? (saltUrl(cekimTake(c, uretimler).video?.gorselUrl) ?? saltUrl(cekimTake(c, uretimler).kare?.gorselUrl)) : undefined;

  useEffect(() => { if (!secili.cekim && tum[0]) st().secim(tum[0].b.id, tum[0].c.id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Kapanan ya da adı değişen eski model kayıtlarını bağlanabilir modele taşır.
  useEffect(() => { if (!FILM_MODELLER.some((m) => m.deger === p.model)) st().guncelle(p.id, { model: /hailuo/i.test(p.model) ? "Minimax Hailuo 2.3" : "Kling 3.0" }); }, [p.id, p.model]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (h && (/^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); st().geriAl(p.id); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); const x = tum[secIndex + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1)]; if (x) sec(x.b.id, x.c.id);
      }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const sec = (bolumId: string, cekimId: string | null, git = true) => {
    st().secim(bolumId, cekimId);
    if (git && cekimId) { const i = tum.findIndex((x) => x.c.id === cekimId); if (i >= 0) oynatici.current?.git(anlar[i] + 0.4); }
  };
  const cekimEkle = (b: FilmBolum, sonra?: string) => {
    const yeni: FilmCekim = { id: fId("ck"), baslik: `${b.baslik} · ${b.cekimler.length + 1}`, istem: "", boy: "orta", kamera: "sabit", sure: 6, elementler: [], surekli: true, takes: [] };
    st().bolumYaz(p.id, (l) => l.map((x) => { if (x.id !== b.id) return x; const i = sonra ? x.cekimler.findIndex((k) => k.id === sonra) : x.cekimler.length - 1; const k = [...x.cekimler]; k.splice(i + 1, 0, yeni); return { ...x, cekimler: k, acik: true }; }));
    sec(b.id, yeni.id, false); setSekme("cekim");
  };
  const cekimTasi = (id: string, yon: -1 | 1) => st().bolumYaz(p.id, (l) => l.map((b) => { const i = b.cekimler.findIndex((x) => x.id === id); if (i < 0) return b; const j = i + yon; if (j < 0 || j >= b.cekimler.length) return b; const k = [...b.cekimler]; [k[i], k[j]] = [k[j], k[i]]; return { ...b, cekimler: k }; }));
  const cekimSil = (id: string) => {
    const i = tum.findIndex((x) => x.c.id === id); const komsu = tum[i + 1] ?? tum[i - 1];
    st().bolumYaz(p.id, (l) => l.map((b) => ({ ...b, cekimler: b.cekimler.filter((x) => x.id !== id) })));
    if (komsu) st().secim(komsu.b.id, komsu.c.id);
    toast("Çekim silindi", { action: { label: "Geri al", onClick: () => st().geriAl(p.id) } });
  };
  const cekimCogalt = (x: FilmCekim) => { const k = { ...x, id: fId("ck"), takes: [], secili: undefined }; st().bolumYaz(p.id, (l) => l.map((b) => { const j = b.cekimler.findIndex((y) => y.id === x.id); if (j < 0) return b; const m = [...b.cekimler]; m.splice(j + 1, 0, k); return { ...b, cekimler: m }; })); sec(bolum!.id, k.id, false); toast.success("Çekim çoğaltıldı"); };
  const bolumEkle = () => { const b: FilmBolum = { id: fId("bl"), baslik: `Perde ${p.bolumler.length + 1}`, ozet: "", anlatim: "", hedefSn: 30, acik: true, cekimler: [], mekan: bolum?.mekan, zaman: bolum?.zaman, hava: bolum?.hava }; st().bolumYaz(p.id, (l) => [...l, b]); cekimEkle(b); setSekme("perde"); };
  const bolumSil = (b: FilmBolum) => {
    if (p.bolumler.length <= 1) return void toast.error("Perde silinemedi", { description: "Filmde en az bir perde kalmalı. Önce yeni bir perde ekle." });
    const i = p.bolumler.indexOf(b); const komsu = p.bolumler[i + 1] ?? p.bolumler[i - 1];
    st().bolumYaz(p.id, (l) => l.filter((x) => x.id !== b.id));
    st().secim(komsu.id, komsu.cekimler[0]?.id ?? null);
    toast("Perde silindi", { description: b.baslik, action: { label: "Geri al", onClick: () => st().geriAl(p.id) } });
  };

  const toplu = async (tip: "kare" | "video") => {
    setPop(null);
    const l = tip === "kare" ? eksikKare : eksikVideo;
    if (!l.length) return void toast.info("Üretilecek çekim yok", { description: tip === "kare" ? "Bu kapsamdaki çekimlerin karesi zaten var." : "Bu kapsamdaki çekimlerin videosu zaten var." });
    setMesgul(tip);
    try { const n = await topluUret(p, l, tip); if (n) toast.success(`${n} ${tip === "kare" ? "kare" : "çekim"} üretiliyor`, { description: (tip === "kare" ? demoKare : demoVideo) ? "Sağlayıcı bağlı değil, örnek gösterilir, kredi düşmez." : "Bittikçe animatiğe eklenir." }); }
    finally { setMesgul(null); }
  };
  const indir = (ad: string, icerik: string, tip: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([icerik], { type: tip })); a.download = ad; a.click(); toast.success("Dosya indirildi", { description: ad }); setTimeout(() => URL.revokeObjectURL(a.href), 2000); setPop(null); };
  const senaryoMetni = () => [p.ad, "", p.logline, "", ...p.bolumler.flatMap((b, i) => [`${i + 1}. ${b.baslik.toLocaleUpperCase("tr")}${[b.mekan, ZAMANLAR.find((z) => z.id === b.zaman)?.ad, HAVALAR.find((h) => h.id === b.hava)?.ad].filter(Boolean).length ? ` (${[b.mekan, ZAMANLAR.find((z) => z.id === b.zaman)?.ad, HAVALAR.find((h) => h.id === b.hava)?.ad].filter(Boolean).join(", ")})` : ""}`, b.ozet, "", ...b.cekimler.map((x, k) => `  ${k + 1}. ${cekimAdi(x)} · ${CEKIM_BOYLARI.find((y) => y.id === x.boy)?.ad}, ${FILM_KAMERALAR.find((y) => y.id === x.kamera)?.ad}, ${x.sure} sn`), ""])].join("\n");
  const aktar = async () => { setMesgul("aktar"); try { await montajaAktar(p); router.push("/panel/montaj"); } finally { setMesgul(null); } };

  /* ═════════ Üst kart ═════════ */
  const adimlar = [
    { ad: "Plan", tamam: true, ikon: ListVideo },
    { ad: `Kareler ${kareli}/${tum.length}`, tamam: tum.length > 0 && kareli === tum.length, ikon: ImageIcon },
    { ad: `Videolar ${videolu}/${tum.length}`, tamam: tum.length > 0 && videolu === tum.length, ikon: Film },
    { ad: "Montaj", tamam: false, ikon: Combine },
  ];
  const aktifAdim = adimlar.findIndex((a) => !a.tamam);
  const ustKart = (
    <div className="flex min-h-[60px] shrink-0 items-center gap-2 rounded-[20px] bg-[#121315] px-2.5 py-2 ring-1 ring-inset ring-white/[0.07] sm:gap-3 sm:px-3">
      <Tooltip label="Filmlere dön"><button onClick={() => st().sec(null)} aria-label="Filmlere dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white transition hover:bg-white/[0.12] active:scale-90"><ChevronLeft className="h-5 w-5" /></button></Tooltip>
      <label className="group flex min-w-0 max-w-[340px] flex-1 items-center gap-1.5 rounded-[12px] px-2 py-1 transition-colors hover:bg-white/[0.04] focus-within:bg-white/[0.06]">
        <span className="min-w-0 flex-1">
          <input value={p.ad} onChange={(e) => st().guncelle(p.id, { ad: e.target.value.slice(0, 60) })} aria-label="Film adı" className="block w-full truncate bg-transparent text-[15px] font-semibold text-white outline-none" />
          <span className="block truncate text-[12px] text-white/45">{turBul(p.tur).ad} · {goreli(p.guncelleme)} kaydedildi</span>
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </label>
      <ol className="mx-auto hidden items-center gap-0.5 rounded-full bg-white/[0.05] p-1 lg:flex">
        {adimlar.map((a, i) => (
          <li key={a.ad} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-white/20" />}
            <span className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] tabular-nums transition-colors", i === aktifAdim ? "bg-white font-semibold text-black" : a.tamam ? "text-white/85" : "text-white/45")}>
              {a.tamam ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3} /></span> : <a.ikon className="h-3.5 w-3.5" />}{a.ad}
            </span>
          </li>
        ))}
      </ol>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
        <Tooltip label="Geri al · Ctrl Z"><button onClick={() => st().geriAl(p.id)} disabled={!gecmisVar} aria-label="Geri al" className="flex h-9 w-9 items-center max-sm:hidden justify-center rounded-full text-white/70 transition hover:bg-white/[0.08] hover:text-white active:scale-90 disabled:opacity-30"><Undo2 className="h-4 w-4" /></button></Tooltip>
        <div className="relative">
          <button onClick={() => ac("disa")} aria-expanded={pop === "disa"} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white/85 transition active:scale-[0.97]", pop === "disa" ? "bg-white/[0.13]" : "bg-white/[0.07] hover:bg-white/[0.12]")}><Download className="h-4 w-4" /><span className="max-md:hidden">Dışa aktar</span></button>
          <Yuzen acik={pop === "disa"} onKapat={() => setPop(null)} yerlesim="alt-sag" bosluk={8} etiket="Dışa aktar" className={PANO} style={{ width: 340 }}>
            <MenuSatiri secili={false} onClick={() => { void navigator.clipboard.writeText(youtubeBolumleri(p.bolumler)).then(() => toast.success("YouTube bölümleri kopyalandı", { description: "Video açıklamasına yapıştırabilirsin." }), () => mesaj.kopyalanamadi()); setPop(null); }}
              on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><ListVideo className="h-4 w-4" /></span>} ad="YouTube bölümleri" alt="Zaman damgalı perde listesi" />
            <MenuSatiri secili={false} onClick={() => indir(`${p.ad}-cekim-listesi.csv`, cekimListesiCsv(p.bolumler, p.model), "text/csv")}
              on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><FileSpreadsheet className="h-4 w-4" /></span>} ad="Çekim listesi" alt="Yapım ekibi için CSV" />
            <MenuSatiri secili={false} onClick={() => indir(`${p.ad}-senaryo.txt`, senaryoMetni(), "text/plain")}
              on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><FileText className="h-4 w-4" /></span>} ad="Senaryo" alt="Perdeler ve çekimler, metin dosyası" />
          </Yuzen>
        </div>
        <button onClick={() => void aktar()} disabled={mesgul === "aktar"} title={aktifAdim === 3 ? "Bütün çekimler hazır" : "Hazır olmayan çekimler montajda açıklama kartı olarak kalır"} className={cn("flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition active:scale-[0.97]", aktifAdim === 3 ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.07] text-white/90 hover:bg-white/[0.12]")}>
          {mesgul === "aktar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Combine className="h-4 w-4" />}<span className="max-sm:hidden">Montaja aktar</span>
        </button>
      </span>
    </div>
  );

  /* ═════════ Animatik kartı ═════════ */
  const topluDugme = (tip: "kare" | "video") => {
    const l = tip === "kare" ? eksikKare : eksikVideo, demo = tip === "kare" ? demoKare : demoVideo, kredi = tip === "kare" ? l.length * KARE_KREDI : videoKredi;
    const id = tip === "kare" ? "kare-onay" : "video-onay";
    // Beyaz yalnız sıradaki adımın düğmesi (her yer beyaz olunca hiçbiri öne çıkmaz)
    const birincil = tip === "kare" ? aktifAdim === 1 : aktifAdim === 2;
    return (
      <div className="relative">
        <button onClick={() => ac(id)} disabled={!!mesgul} aria-expanded={pop === id}
          className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-[0.97]", birincil ? "bg-white text-black hover:bg-white/90" : pop === id ? "bg-white/[0.13] text-white" : "bg-white/[0.07] text-white/90 hover:bg-white/[0.12]")}>
          {mesgul === tip ? <Loader2 className="h-4 w-4 animate-spin" /> : tip === "kare" ? <ImageIcon className="h-4 w-4" /> : <Clapperboard className="h-4 w-4" />}
          {tip === "kare" ? "Kareleri çek" : "Videoya çevir"}
        </button>
        <Yuzen acik={pop === id} onKapat={() => setPop(null)} yerlesim="alt-sag" bosluk={8} etiket={tip === "kare" ? "Kareleri üret" : "Videoları üret"} className={cn(PANO, "p-0")} style={{ width: 340 }}>
          <div className="border-b border-white/[0.06] px-4 pb-3 pt-3.5">
            <p className="text-[14px] font-semibold text-white">{tip === "kare" ? "Taslak kareleri çek" : "Çekimleri videoya çevir"}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-white/55">{tip === "kare" ? "Karesi olmayan çekimler için ucuz bir taslak." : "Videosu olmayan çekimler, varsa taslak karesinden başlar."}</p>
          </div>
          <div className="p-3">
          <Segment id={`kapsam-${tip}`} kucuk deger={kapsam} set={setKapsam} secenekler={[{ id: "bolum", ad: `${bolumNo + 1}. perde` }, { id: "film", ad: "Tüm film" }]} />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {([[tip === "kare" ? ImageIcon : Clapperboard, "Çekim", `${l.length}`], [Sparkles, "Bedel", demo ? "Ücretsiz" : <><KrediJeton boyut={12} />{kredi.toLocaleString("tr-TR")}</>]] as const).map(([I, e, v]) => (
              <div key={e} className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.04] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/70"><I className="h-4 w-4" /></span>
                <span className="min-w-0 leading-tight"><span className="block text-[11px] text-white/50">{e}</span><span className="mt-0.5 flex items-center gap-1 text-[14px] font-semibold tabular-nums text-white">{v}</span></span>
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-white/55 ring-1 ring-inset ring-white/[0.05]">{tip === "kare" ? "Her çekime ucuz bir taslak kare çekilir; kadrajı videodan önce görürsün." : "Süreklilik açık çekimler önceki çekimin son karesinden başlar; sahneler kesintisiz akar."}</p>
          <button onClick={() => void toplu(tip)} disabled={!l.length} className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.08] disabled:text-white/40">
            {l.length ? <>Başlat<span className="text-black/50">· {l.length} çekim</span></> : <><Check className="h-4 w-4" />Hepsi hazır</>}
          </button>
          </div>
        </Yuzen>
      </div>
    );
  };

  const seritGen = masaustu ? (tum.length > 36 ? tum.length * 30 : undefined) : Math.max(tum.length * 34, 340);
  const zamanCizgisi = (
    <div className="gizli-scroll -mx-1 overflow-x-auto px-1 pb-1">
      <div ref={seritIc} className="relative isolate flex min-w-full gap-1" style={{ width: seritGen }}>
        <span ref={kafa} aria-hidden className="pointer-events-none absolute -bottom-1 -top-1 left-0 z-10 w-[2px] -translate-x-1/2 rounded-full bg-white will-change-transform" style={{ boxShadow: "0 0 0 1px rgba(13,14,16,0.6)" }}><span className="absolute -left-[4px] -top-[3px] h-[10px] w-[10px] rounded-full bg-white" /></span>
        {p.bolumler.map((b, bi) => {
          const sn = Math.max(1, bolumPlanli(b)), secB = bolum?.id === b.id, renk = perdeRengi(bi);
          return (
            <div key={b.id} style={{ flexGrow: Math.max(sn, 30), flexBasis: 0 }} className="min-w-[96px]">
              <button onClick={() => { st().secim(b.id, b.cekimler[0]?.id ?? null); setSekme("perde"); if (b.cekimler[0]) sec2(b.cekimler[0].id); }} title={`${bi + 1}. ${b.baslik} · ${sureYaz(bolumPlanli(b))}`}
                className={cn("relative flex h-8 w-full items-center gap-1.5 overflow-hidden rounded-[9px] px-2.5 text-left outline outline-[1.5px] -outline-offset-[1.5px] transition-[outline-color,background-color] active:scale-[0.99]", secB ? "outline-white/90" : "outline-transparent hover:outline-white/25")}
                style={{ background: `color-mix(in srgb, ${renk} ${secB ? 26 : 15}%, #141518)` }}>
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: renk }} />
                <span className="min-w-0 truncate text-[12px] font-semibold text-white">{b.baslik}</span>
                {sn >= 40 && <span className="ml-auto shrink-0 text-[11px] tabular-nums text-white/45 max-[1180px]:hidden">{sureYaz(bolumPlanli(b))}</span>}
              </button>
              <div className="mt-1 flex gap-[3px]">
                {b.cekimler.map((x) => {
                  const n = tum.findIndex((y) => y.c.id === x.id) + 1, s = c?.id === x.id;
                  return (
                    <button key={x.id} ref={(el) => { if (el) hucreler.current.set(x.id, el); else hucreler.current.delete(x.id); }} onClick={() => { sec(b.id, x.id); setSekme("cekim"); }} title={`${n}. ${cekimAdi(x)}`} aria-label={`${n}. çekim`} style={{ flexGrow: x.sure, flexBasis: 0 }}
                      className={cn("group/k relative h-[50px] min-w-0 overflow-hidden rounded-[7px] outline outline-2 -outline-offset-2 transition-[outline-color]", s ? "outline-white" : "outline-transparent hover:outline-white/30")}>
                      <CekimKapak c={x} p={p} uretimler={uretimler} className="absolute inset-0" />
                      {!cekimTake(x, uretimler).kare && !cekimTake(x, uretimler).video && <span className={cn("absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums", s ? "text-white" : "text-white/30 group-hover/k:text-white/60")}>{n}</span>}
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] opacity-70" style={{ background: renk }} />
                    </button>
                  );
                })}
                {!b.cekimler.length && <button onClick={() => cekimEkle(b)} aria-label="Çekim ekle" className="flex h-[50px] flex-1 items-center justify-center rounded-[7px] bg-white/[0.05] text-white/50 hover:bg-white/[0.09]"><Plus className="h-4 w-4" /></button>}
              </div>
            </div>
          );
        })}
        <Tooltip label="Perde ekle"><button onClick={bolumEkle} aria-label="Perde ekle" className="flex w-9 shrink-0 items-center justify-center self-stretch rounded-[9px] bg-white/[0.05] text-white/60 transition hover:bg-white/[0.1] hover:text-white active:scale-95"><Plus className="h-4 w-4" /></button></Tooltip>
      </div>
      {p.muzik !== "yok" && (
        <button onClick={() => { setSekme("film"); }} title="Müzik montaja aktarırken filmin süresine göre bestelenir" className="group/m mt-1 flex h-7 w-full min-w-full items-center gap-2 overflow-hidden rounded-[8px] bg-white/[0.04] pl-2.5 pr-2 text-left transition-colors hover:bg-white/[0.07]" style={{ width: seritGen }}>
          <Music2 className="h-3.5 w-3.5 shrink-0 text-[#55d6fd]" /><span className="shrink-0 text-[11.5px] font-medium text-white/80">{MUZIKLER.find((m) => m.deger === p.muzik)?.ad}</span>
          <span aria-hidden className="flex h-4 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
            {Array.from({ length: 420 }, (_, k) => <span key={k} className="w-[2px] shrink-0 rounded-full bg-[#55d6fd]/35" style={{ height: `${28 + Math.abs(Math.sin(k * 0.73) * Math.cos(k * 0.21)) * 72}%` }} />)}
          </span>
        </button>
      )}
    </div>
  );
  function sec2(id: string) { const i = tum.findIndex((x) => x.c.id === id); if (i >= 0) oynatici.current?.git(anlar[i] + 0.4); }

  const animatik = (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
      <header className="flex min-h-[62px] shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><ListVideo className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0"><h2 className="text-[16px] font-semibold tracking-[-0.02em] text-white">Animatik</h2><p className="truncate text-[12.5px] text-white/50">{p.bolumler.length} perde · {tum.length} çekim · {sureYaz(toplam)}{toplam < hedef * 0.8 ? ` · hedefin altında, ${sureYaz(hedef - toplam)} eksik` : ""}</p></span>
        <span className="ml-auto flex items-center gap-1.5">
          {topluDugme("kare")}{topluDugme("video")}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="relative flex min-h-[200px] flex-1 flex-col">
          {/* Sinematik arka ışık: seçili çekimin bulanık rengi sahnenin çevresine taşar (boş siyah kenar kalmasın) */}
          <AnimatePresence initial={false}>
            {isikSrc && <motion.img key={isikSrc} src={isikSrc} alt="" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="pointer-events-none absolute inset-x-[6%] bottom-12 top-0 h-[calc(100%-48px)] w-[88%] scale-110 object-cover blur-[70px]" />}
          </AnimatePresence>
          <ExOynatici ref={oynatici} proje={montaj} anlar={anlar} basliklar={tum.map((x) => cekimAdi(x.c))} secili={secIndex} ince etiket="Çekim" kesitler={perdeAnlari} onZaman={kafaKonumla} onSahne={(i) => { const x = tum[i]; if (x) st().secim(x.b.id, x.c.id); }} sinif="relative min-h-[200px] flex-1" />
        </div>
        {zamanCizgisi}
      </div>
    </section>
  );

  /* ═════════ Müfettiş: Çekim ═════════ */
  const cekimGorunum = c && bolum ? (() => {
    const g = (patch: Partial<FilmCekim>) => st().cekimGuncelle(p.id, c.id, patch);
    const takeler = c.takes.map((t) => ({ t, u: uretimler.find((u) => u.id === t.uretimId) })).filter((x) => x.u) as { t: FilmCekim["takes"][number]; u: Uretim }[];
    const { video, kare } = cekimTake(c, uretimler);
    const gosterilen = video ?? kare;
    const kapakSrc = saltUrl(video?.gorselUrl) ?? saltUrl(kare?.gorselUrl);
    const i = tum.findIndex((x) => x.c.id === c.id);
    const bolumIci = bolum.cekimler.findIndex((x) => x.id === c.id) + 1;
    const ortam = [bolum.mekan && { ikon: MapPin, ad: bolum.mekan }, bolum.zaman && { ikon: MoonStar, ad: ZAMANLAR.find((z) => z.id === bolum.zaman)?.ad }, bolum.hava && { ikon: CloudRain, ad: HAVALAR.find((h) => h.id === bolum.hava)?.ad }].filter(Boolean) as { ikon: React.ElementType; ad: string }[];
    return (
      <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="flex h-full min-h-0 flex-col gap-3">
        <div className={cn("relative min-h-[220px] flex-1 overflow-hidden rounded-[16px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08]", masaustu && "order-2")}
          style={{ ...(masaustu ? { minHeight: "calc(240px + var(--ist, 0px))" } : {}), backgroundImage: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${perdeRengi(bolumNo)} 16%, transparent), transparent 70%)` }}>
          {/* Kalan alanı doldurur: kare/klip ortada bütün görünür, arkası aynı görüntünün bulanık hali. Masaüstünde buzlu cam istemci bu zeminin üstünde yüzer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {kapakSrc && <img src={kapakSrc} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl" />}
          <div className="absolute inset-x-0 top-0" style={{ bottom: masaustu ? "calc(var(--ist, 0px) + 4px)" : 0 }}>
          {video?.videoUrl
            ? <video key={video.videoUrl} src={video.videoUrl} poster={saltUrl(video.gorselUrl)} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" />
            // eslint-disable-next-line @next/next/no-img-element
            : kapakSrc ? <img src={kapakSrc} alt="" className="absolute inset-0 h-full w-full object-contain" /> : null}
          {c.takes.some((t) => { const u = uretimler.find((x) => x.id === t.uretimId); return u && u.durum !== "tamam" && u.durum !== "hata"; }) && <span className="absolute inset-0 flex items-center justify-center bg-black/35"><span className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl"><Loader2 className="h-3.5 w-3.5 animate-spin" />Üretiliyor</span></span>}
          {!gosterilen && !c.takes.length && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"><ImageIcon className="h-[18px] w-[18px]" /></span>
              <span className="leading-tight"><span className="block text-[14px] font-semibold text-white">Henüz kare yok</span><span className="mt-1 block text-[12.5px] text-white/55">Önce {KARE_KREDI} kredilik bir taslak kare çek, beğenirsen videoya çevir.</span></span>
            </span>
          )}
          {gosterilen && <button onClick={() => setAcikTake(gosterilen)} aria-label="Büyük aç" className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl transition hover:bg-black/65 active:scale-90"><Maximize2 className="h-3.5 w-3.5" /></button>}
          {takeler.length > 0 && (
            <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] gap-1 overflow-x-auto">
              {takeler.slice(-5).map(({ t, u }) => {
                const bitti = u.durum === "tamam", s = c.secili ? c.secili === u.id : (video ?? kare)?.id === u.id;
                return (
                  <button key={u.id} onClick={() => { if (!bitti) return; if (t.tip === "video") g({ secili: u.id }); else setAcikTake(u); }} title={t.tip === "video" ? "Bu denemeyi kullan" : "Kareyi aç"}
                    className={cn("relative h-10 w-14 shrink-0 overflow-hidden rounded-[8px] bg-black outline outline-2 -outline-offset-2 transition-[outline-color]", s ? "outline-white" : "outline-white/25 hover:outline-white/60")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {saltUrl(u.gorselUrl) && <img src={saltUrl(u.gorselUrl)} alt="" className={cn("h-full w-full object-cover", !bitti && "opacity-30")} />}
                    {!bitti && <span className="absolute inset-0 flex items-center justify-center">{u.durum === "hata" ? <span className="text-[10px] font-semibold text-rose-300">Hata</span> : <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}</span>}
                    <span className="absolute bottom-0.5 left-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-black/65 text-white">{t.tip === "video" ? <Film className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}</span>
                  </button>
                );
              })}
              {takeler.length > 5 && <span className="flex h-10 shrink-0 items-center rounded-[8px] bg-black/55 px-2 text-[11px] text-white backdrop-blur">+{takeler.length - 5}</span>}
            </span>
          )}
          </div>
        </div>
        <div className={cn("shrink-0 overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]", masaustu && "order-1")}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] py-2 pl-3.5 pr-2">
            <span aria-hidden className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: perdeRengi(bolumNo) }} />
            <button onClick={() => setSekme("perde")} className="min-w-0 truncate text-left text-[13.5px] font-semibold text-white transition-colors hover:text-white/75">{bolum.baslik}</button>
            <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white/70">{bolumIci}/{bolum.cekimler.length}</span>
            <span className="ml-auto flex shrink-0 items-center gap-0.5">
              {([[ArrowUp, "Yukarı taşı", () => cekimTasi(c.id, -1)], [ArrowDown, "Aşağı taşı", () => cekimTasi(c.id, 1)], [Copy, "Çoğalt", () => cekimCogalt(c)], [Trash2, "Sil", () => cekimSil(c.id)]] as const).map(([I, a, fn]) => (
                <Tooltip key={a} label={a}><button onClick={fn} aria-label={a} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/[0.08] active:scale-90", a === "Sil" ? "hover:text-rose-300" : "hover:text-white")}><I className="h-3.5 w-3.5" /></button></Tooltip>
              ))}
              <span aria-hidden className="mx-1 h-4 w-px bg-white/10" />
              {([[-1, ChevronLeft, "Önceki çekim"], [1, ChevronRight, "Sonraki çekim"]] as const).map(([d, I, a]) => {
                const x = tum[i + d];
                return <Tooltip key={d} label={`${a} · ok tuşları`}><button onClick={() => x && sec(x.b.id, x.c.id)} disabled={!x} aria-label={a} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.12] active:scale-90 disabled:opacity-30"><I className="h-4 w-4" /></button></Tooltip>;
              })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
            {ortam.length ? <>
              {ortam.map(({ ikon: I, ad }) => <span key={ad} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/85"><I className="h-3.5 w-3.5 text-white/55" />{ad}</span>)}
              <button onClick={() => setSekme("perde")} className="ml-auto flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"><Pencil className="h-3 w-3" />Perdede düzenle</button>
            </> : <>
              <span className="text-[12.5px] text-white/55">Mekân, zaman ve hava perdeye bir kez yazılır.</span>
              <button onClick={() => setSekme("perde")} className="ml-auto flex h-8 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]"><Plus className="h-3.5 w-3.5" />Ortam ekle</button>
            </>}
          </div>
        </div>
      </motion.div>
    );
  })() : (
    <div className="flex flex-col items-center gap-2 py-16 text-center"><Clapperboard className="h-6 w-6 text-white/40" /><p className="text-[13px] text-white/50">Zaman çizgisinden bir çekim seç</p></div>
  );

  /* Seçili çekimin cam istemcisi */
  const istemci = c && bolum ? (() => {
    const g = (patch: Partial<FilmCekim>) => st().cekimGuncelle(p.id, c.id, patch);
    const i = tum.findIndex((x) => x.c.id === c.id);
    const onceki = i > 0 ? tum[i - 1].c : undefined;
    const { video } = cekimTake(c, uretimler);
    const kam = FILM_KAMERALAR.find((k) => k.id === c.kamera) ?? FILM_KAMERALAR[0];
    const mdl = c.model ?? p.model;
    const elemanlar = useElements.getState().elementler.filter((e) => e.tur === "karakter" || e.tur === "mekan" || e.tur === "obje");
    const seciliEl = elemanlar.filter((e) => c.elementler.includes(e.id));
    const demo = demoKare || demoVideo;
    return (
      <div className="cam-istemci relative m-2 mt-0 shrink-0 rounded-[24px] p-2.5" onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void cekimUret(p, c, "video", onceki); } }}>
        <textarea value={c.istem} onChange={(e) => g({ istem: e.target.value.slice(0, 600) })} rows={1} aria-label="Çekimde ne oluyor"
          placeholder="Çekimde ne oluyor? Kim, nerede, ne yapıyor; ışık ve hareket"
          className="block max-h-[120px] min-h-[24px] w-full resize-none bg-transparent px-2 pt-1 text-[14px] leading-relaxed text-white outline-none [field-sizing:content] placeholder:text-white/40" />
        <div className="mt-2 grid grid-cols-6 gap-1.5 [&>div:nth-child(-n+2)]:col-span-3 [&>div]:col-span-2 [&>div>button]:h-11 [&>div>button]:w-full [&>div>button]:pr-3 [&>div>button>img]:h-8 [&>div>button>img]:w-8 [&>div>button>span:first-child]:h-8 [&>div>button>span:first-child]:w-8">
          <div className="relative">
            <Cip etiket="Boy" deger={CEKIM_BOYLARI.find((k) => k.id === c.boy)?.ad} gorsel={BOY_GORSEL[c.boy]} acik={pop === "boy"} onClick={() => ac("boy")} />
            <Yuzen acik={pop === "boy"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Çekim boyu" className={cn(PANO, "p-2.5")} style={{ width: "min(400px, calc(100vw - 24px))" }}>
              <p className="px-1 pb-2 text-[13px] font-semibold text-white">Çekim boyu</p>
              <div className="grid grid-cols-5 gap-1.5">
                {CEKIM_BOYLARI.map((k) => (
                  <button key={k.id} onClick={() => { g({ boy: k.id }); setPop(null); }} aria-pressed={c.boy === k.id} className="group text-left">
                    <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[11px] outline outline-2 -outline-offset-2 transition-[outline-color]", c.boy === k.id ? "outline-white" : "outline-transparent")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={BOY_GORSEL[k.id]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </span>
                    <span className={cn("mt-1 block truncate text-[11.5px] font-medium", c.boy === k.id ? "text-white" : "text-white/55")}>{k.ad}</span>
                  </button>
                ))}
              </div>
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Kamera" deger={kam.ad} gorsel={VH(kam.klip).poster} acik={pop === "kamera"} onClick={() => ac("kamera")} />
            <Yuzen acik={pop === "kamera"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Kamera hareketi" className={cn(PANO, "p-2.5")} style={{ width: "min(480px, calc(100vw - 24px))" }}>
              <p className="px-1 pb-2 text-[13px] font-semibold text-white">Kamera hareketi <span className="font-normal text-white/45">· üzerine gel, oynasın</span></p>
              <div className="grid max-h-[360px] grid-cols-3 gap-2 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                {FILM_KAMERALAR.map((k) => <VideoKaro key={k.id} ad={k.ad} gorsel={VH(k.klip).poster} video={VH(k.klip).video} secili={c.kamera === k.id} oran="16/10" onSec={() => { g({ kamera: k.id }); setPop(null); }} />)}
              </div>
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Süre" deger={`${sureUydur(mdl, c.sure)} sn`} ikon={<Clock className="h-4 w-4" />} acik={pop === "sure"} onClick={() => ac("sure")} />
            <Yuzen acik={pop === "sure"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Süre" className={cn(PANO, "overflow-hidden p-0")} style={{ width: 300 }}>
              {(() => {
                const sl = modelSureleri(mdl), su = sureUydur(mdl, c.sure);
                return (
                  <>
                    <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><Clock className="h-4 w-4 text-white/55" /><span className="text-[13px] font-semibold text-white">Çekim süresi</span><span className="ml-auto text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{su} sn</span></div>
                    <div className="p-3">
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(sl.length, 7)}, minmax(0,1fr))` }}>
                        {sl.map((d) => <button key={d} onClick={() => g({ sure: d })} className={cn("h-8 rounded-full text-[12px] font-semibold tabular-nums transition-colors", d === su ? "bg-white text-black" : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white")}>{d}</button>)}
                      </div>
                      <p className="mt-2.5 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-white/55 ring-1 ring-inset ring-white/[0.05]">{FILM_MODELLER.find((m) => m.deger === mdl)?.ad ?? mdl} {sl[0]}–{sl[sl.length - 1]} sn üretir. {bolum.baslik}: planlı {sureYaz(bolumPlanli(bolum))}, hedef {sureYaz(bolum.hedefSn)}.</p>
                    </div>
                  </>
                );
              })()}
            </Yuzen>
          </div>
          <div className="relative">
            <button type="button" onClick={() => ac("model")} aria-expanded={pop === "model"} className={cn("flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full pl-1.5 pr-3.5 text-left transition-[background-color,transform] duration-200 active:scale-[0.97]", pop === "model" ? "bg-white/[0.13]" : "bg-white/[0.07] hover:bg-white/[0.11]")}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full [&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={mdl} boyut={36} /></span>
              <span className="flex min-w-0 flex-col items-start leading-none"><span className="text-[11px] text-white/55">{mdl === p.model ? "Model" : "Model · bu çekime"}</span><span className="mt-1 truncate text-[13px] font-medium text-white">{FILM_MODELLER.find((m) => m.deger === mdl)?.ad ?? mdl}</span></span>
            </button>
            <Yuzen acik={pop === "model"} onKapat={() => setPop(null)} yerlesim="ust-sag" bosluk={10} etiket="Model" className={PANO} style={{ width: "min(380px, calc(100vw - 24px))" }}>
              <MenuBaslik>Bu çekimin video modeli</MenuBaslik>
              {FILM_MODELLER.map((m) => (
                <MenuSatiri key={m.deger} secili={m.deger === mdl} onClick={() => { g({ model: m.deger === p.model ? undefined : m.deger }); setPop(null); }} ad={m.ad} alt={m.alt} rozet={m.rozet} on={<MarkaKare ad={m.deger} boyut={38} />}
                  sag={<span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold tabular-nums text-white/80"><KrediJeton boyut={11} />{videoKrediHesap(m.deger)}</span>} />
              ))}
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Oyuncular" deger={seciliEl.length ? seciliEl.map((e) => e.ad).join(", ") : "Ekle"} gorsel={seciliEl[0]?.gorseller[0]} ikon={<Users className="h-4 w-4" />} acik={pop === "oyuncu"} onClick={() => ac("oyuncu")} />
            <Yuzen acik={pop === "oyuncu"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Oyuncular ve mekân" className={PANO} style={{ width: "min(340px, calc(100vw - 24px))" }}>
              <MenuBaslik>Oyuncular ve mekân</MenuBaslik>
              {elemanlar.length ? (
                <div className="max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
                  {elemanlar.slice(0, 30).map((e) => {
                    const a = c.elementler.includes(e.id);
                    return (
                      <MenuSatiri key={e.id} secili={a} onClick={() => g({ elementler: a ? c.elementler.filter((x) => x !== e.id) : [...c.elementler, e.id] })} ad={`@${e.ad}`} alt={e.tur === "karakter" ? "Karakter" : e.tur === "mekan" ? "Mekân" : "Obje"}
                        // eslint-disable-next-line @next/next/no-img-element
                        on={e.gorseller[0] ? <img src={e.gorseller[0]} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-full bg-white/10" />} />
                    );
                  })}
                </div>
              ) : <p className="px-2.5 pb-2 text-[12.5px] leading-snug text-white/55">Henüz elementin yok. Karakter ya da mekân elementi oluşturursan her çekimde aynı yüz ve yer korunur.</p>}
              <a href="/panel/elementler" className="mt-1 flex items-center gap-2 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12.5px] font-medium text-white/75 hover:text-white"><Plus className="h-3.5 w-3.5" />Element oluştur</a>
            </Yuzen>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          
          {onceki && (
            <button onClick={() => g({ surekli: !c.surekli })} aria-pressed={c.surekli} title={c.surekli ? "Video önceki çekimin son karesinden başlar: sahneler kesintisiz akar. Kapatınca kendi taslak karesinden başlar." : "Video kendi taslak karesinden başlar. Açınca önceki çekimin son karesinden devam eder."}
              className={cn("ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95", c.surekli ? "bg-[#55d6fd]/[0.16] text-[#7fe2ff] ring-1 ring-inset ring-[#55d6fd]/30" : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white")}>
              <Link2 className="h-4 w-4" /><span className="sr-only">Önceki çekimden devam</span>
            </button>
          )}
          <button title="Ucuz taslak kare: kadrajı videodan önce gör" onClick={() => void cekimUret(p, c, "kare", onceki)} className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] max-[420px]:px-3.5 font-semibold text-white transition hover:bg-white/[0.13] active:scale-[0.97]", !onceki && "ml-auto")}>
              <ImageIcon className="h-4 w-4 shrink-0" /><span className="max-[420px]:sr-only">Kare</span>{!demoKare && <span className="flex items-center gap-0.5 text-[12px] tabular-nums text-white/55"><KrediJeton boyut={11} />{KARE_KREDI}</span>}
            </button>
          <button onClick={() => void cekimUret(p, c, "video", onceki)} className={cn("flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]", "flex-1")}>
            <Clapperboard className="h-4 w-4 shrink-0" /><span className="truncate">{video ? "Yeni deneme" : "Video çek"}</span>{!demoVideo && <span className="flex shrink-0 items-center gap-0.5 text-[12px] tabular-nums text-black/55"><KrediJeton boyut={11} />{cekimKredi(c, p)}</span>}
          </button>
        </div>
      </div>
    );
  })() : null;

  /* ═════════ Müfettiş: Perde ═════════ */
  const perdeGorunum = bolum ? (() => {
    const gb = (patch: Partial<FilmBolum>) => st().bolumGuncelle(p.id, bolum.id, patch);
    const planli = bolumPlanli(bolum), eksik = bolum.hedefSn - planli;
    const hedefUst = Math.max(120, Math.ceil((planli * 3) / 30) * 30, Math.ceil(bolum.hedefSn / 30) * 30);
    return (
      <motion.div key={bolum.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="space-y-3">
        <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-3">
            <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: perdeRengi(bolumNo) }} />
                        <input value={bolum.baslik} onChange={(e) => gb({ baslik: e.target.value.slice(0, 40) })} aria-label="Perde başlığı" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none" />
            <Tooltip label="Perdeyi sil"><button onClick={() => bolumSil(bolum)} aria-label="Perdeyi sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/[0.07] hover:text-rose-300 active:scale-90"><Trash2 className="h-4 w-4" /></button></Tooltip>
          </div>
          <textarea value={bolum.ozet} onChange={(e) => gb({ ozet: e.target.value.slice(0, 300) })} rows={2} aria-label="Perde özeti" placeholder="Bu perdede ne oluyor?"
            className="block w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px] leading-relaxed text-white/85 outline-none placeholder:text-white/35 focus:text-white" />
        </div>

        <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><p className="text-[13px] font-semibold text-white">Ortam</p><p className="truncate text-[12px] text-white/45">perdedeki her çekimin istemine eklenir</p></div>
          <div className="divide-y divide-white/[0.06]">
            <label className="flex h-12 items-center gap-2.5 px-3.5 focus-within:bg-white/[0.03]">
              <MapPin className="h-4 w-4 shrink-0 text-white/55" />
              <span className="w-14 shrink-0 text-[13px] text-white/60">Mekân</span>
              <input value={bolum.mekan ?? ""} onChange={(e) => gb({ mekan: e.target.value.slice(0, 40) || undefined })} placeholder="ör. eski tren garı" aria-label="Mekân" className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-white outline-none placeholder:font-normal placeholder:text-white/35" />
            </label>
            <div className="space-y-2 px-3.5 py-3">
              <p className="flex items-center gap-2.5 text-[13px] text-white/60"><MoonStar className="h-4 w-4 text-white/55" />Zaman</p>
              <SimgeSerit id={`zaman-${bolum.id}`} deger={bolum.zaman} set={(v) => gb({ zaman: v })} secenekler={ZAMANLAR.map((z) => ({ ...z, ikon: ZAMAN_IKON[z.id] ?? Sun }))} />
            </div>
            <div className="space-y-2 px-3.5 py-3">
              <p className="flex items-center gap-2.5 text-[13px] text-white/60"><CloudRain className="h-4 w-4 text-white/55" />Hava</p>
              <SimgeSerit id={`hava-${bolum.id}`} deger={bolum.hava} set={(v) => gb({ hava: v })} secenekler={HAVALAR.map((z) => ({ ...z, ikon: HAVA_IKON[z.id] ?? Cloud }))} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
            <p className="text-[13px] font-semibold text-white">Süre</p>
            <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums", Math.abs(eksik) < 3 ? "bg-white/[0.07] text-white/70" : "bg-amber-300/[0.12] text-amber-200")}>{Math.abs(eksik) < 3 ? "Hedefte" : eksik > 0 ? `${sureYaz(eksik)} eksik` : `${sureYaz(-eksik)} fazla`}</span>
          </div>
          <div className="p-3.5">
            <div className="flex items-baseline justify-between"><span className="text-[12.5px] text-white/55">Hedef</span><span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{sureYaz(bolum.hedefSn)}</span></div>
            <input type="range" min={10} max={hedefUst} step={5} value={Math.min(hedefUst, bolum.hedefSn)} onChange={(e) => gb({ hedefSn: Number(e.target.value) })} aria-label="Perde hedef süresi"
              className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-white" style={{ background: `linear-gradient(90deg,#fff ${((Math.min(hedefUst, bolum.hedefSn) - 10) / (hedefUst - 10)) * 100}%,rgba(255,255,255,0.12) 0)` }} />
            <div className="mt-2.5 flex items-center justify-between text-[12px] text-white/50"><span>Çekimlerin toplamı</span><span className="tabular-nums text-white/75">{sureYaz(planli)}</span></div>
            {eksik >= 3 && (
              <button onClick={() => { const n = bolumuDoldur(p, bolum); toast.success(`${n} çekim eklendi`, { description: `${bolum.baslik} hedef süreye tamamlandı.` }); }}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-white transition hover:bg-white/[0.13] active:scale-[0.98]"><Wand2 className="h-4 w-4" />Eksik süre için çekim ekle</button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><p className="text-[13px] font-semibold text-white">Çekimler</p><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white/70">{bolum.cekimler.length}</span></div>
          <div className="p-1.5">
            {bolum.cekimler.map((x, k) => (
              <button key={x.id} onClick={() => { sec(bolum.id, x.id); setSekme("cekim"); }} className={cn("flex w-full items-center gap-2.5 rounded-[12px] p-1.5 text-left transition-colors", c?.id === x.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]")}>
                <CekimKapak c={x} p={p} uretimler={uretimler} className="h-9 w-14 shrink-0 rounded-[7px]" />
                <span className="min-w-0 flex-1"><span className="line-clamp-2 block text-[13px] font-medium leading-snug text-white">{k + 1}. {x.istem.trim() ? cekimAdi(x) : "Yeni çekim"}</span><span className="block truncate text-[11.5px] text-white/45">{CEKIM_BOYLARI.find((y) => y.id === x.boy)?.ad} · {FILM_KAMERALAR.find((y) => y.id === x.kamera)?.ad} · {x.sure} sn</span></span>
              </button>
            ))}
            <button onClick={() => cekimEkle(bolum)} className="mt-1 flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.05] text-[12.5px] font-medium text-white/75 transition hover:bg-white/[0.09] hover:text-white"><Plus className="h-3.5 w-3.5" />Çekim ekle</button>
          </div>
        </div>
      </motion.div>
    );
  })() : null;

  /* ═════════ Müfettiş: Film ═════════ */
  const stil = stilBul(p.stil);
  const filmGorunum = (
    <motion.div key="film" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="space-y-3">
      <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
        <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-white">Hikâye</p>
        <textarea value={p.logline} onChange={(e) => st().guncelle(p.id, { logline: e.target.value.slice(0, 1200) })} rows={4} aria-label="Hikâye"
          className="block w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px] leading-relaxed text-white/85 outline-none focus:text-white" />
      </div>
      <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
        <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-white">Film ayarları <span className="font-normal text-white/45">· tüm çekimlere uygulanır</span></p>
        <div className="grid grid-cols-2 gap-1.5 p-2.5 [&>div>button]:w-full">
          <div className="relative">
            <Cip etiket="Stil" deger={stil.ad} gorsel={stil.kapak} acik={pop === "stil"} onClick={() => ac("stil")} />
            <Yuzen acik={pop === "stil"} onKapat={() => setPop(null)} yerlesim="alt-sol" bosluk={8} etiket="Stil" className={cn(PANO, "p-2.5")} style={{ width: "min(400px, calc(100vw - 24px))" }}>
              <p className="px-1 pb-2 text-[13px] font-semibold text-white">Görsel stil</p>
              <OzelGirdi deger={ozelStil} set={setOzelStil} secili={p.stil.startsWith("ozel:")} ph="Ör. 90'lar VHS, sıcak tonlu analog film"
                uygula={() => { st().guncelle(p.id, { stil: `ozel:${ozelStil.trim()}` }); setPop(null); }} />
              <div className="grid grid-cols-4 gap-2">
                {FILM_STILLER.map((s) => (
                  <button key={s.id} onClick={() => { st().guncelle(p.id, { stil: s.id }); setPop(null); }} aria-pressed={s.id === p.stil} className="group text-left">
                    <span className={cn("relative block aspect-square overflow-hidden rounded-[12px] outline outline-2 -outline-offset-2", s.id === p.stil ? "outline-white" : "outline-transparent")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </span>
                    <span className={cn("mt-1 block truncate text-[12px] font-medium", s.id === p.stil ? "text-white" : "text-white/60")}>{s.ad}</span>
                  </button>
                ))}
              </div>
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Model" deger={FILM_MODELLER.find((m) => m.deger === p.model)?.ad ?? p.model} ikon={<span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={p.model} boyut={36} /></span>} acik={pop === "fmodel"} onClick={() => ac("fmodel")} />
            <Yuzen acik={pop === "fmodel"} onKapat={() => setPop(null)} yerlesim="alt-sag" bosluk={8} etiket="Varsayılan model" className={PANO} style={{ width: "min(380px, calc(100vw - 24px))" }}>
              <MenuBaslik alt="her çekimde değiştirilebilir">Filmin video modeli</MenuBaslik>
              {FILM_MODELLER.map((m) => <MenuSatiri key={m.deger} secili={m.deger === p.model} onClick={() => { st().guncelle(p.id, { model: m.deger }); setPop(null); }} ad={m.ad} alt={m.alt} rozet={m.rozet} on={<MarkaKare ad={m.deger} boyut={38} />} sag={<span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold tabular-nums text-white/80"><KrediJeton boyut={11} />{videoKrediHesap(m.deger)}</span>} />)}
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Format" deger={p.oran} ikon={<OranSimge o={p.oran} />} acik={pop === "format"} onClick={() => ac("format")} />
            <Yuzen acik={pop === "format"} onKapat={() => setPop(null)} yerlesim="alt-sol" bosluk={8} etiket="Format" className={PANO} style={{ width: 280 }}>
              <MenuBaslik>Format</MenuBaslik>
              {FORMATLAR.map((f) => <MenuSatiri key={f.deger} secili={f.deger === p.oran} onClick={() => { st().guncelle(p.id, { oran: f.deger }); setPop(null); }} ad={f.ad} alt={f.alt} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07]"><OranSimge o={f.deger} /></span>} />)}
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Müzik" deger={MUZIKLER.find((m) => m.deger === p.muzik)?.ad} ikon={<Music2 className="h-4 w-4" />} acik={pop === "muzik"} onClick={() => ac("muzik")} />
            <Yuzen acik={pop === "muzik"} onKapat={() => setPop(null)} yerlesim="alt-sag" bosluk={8} etiket="Müzik" className={PANO} style={{ width: 300 }}>
              <MenuBaslik>Müzik</MenuBaslik>
              {MUZIKLER.map((m) => <MenuSatiri key={m.deger} secili={m.deger === p.muzik} onClick={() => { st().guncelle(p.id, { muzik: m.deger }); setPop(null); }} ad={m.ad} alt={m.alt} on={<IkonKaro ikon={MUZIK_IKON[m.deger] ?? Music2} />} />)}
              <p className="mt-1 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12px] leading-snug text-white/50">Montaja aktarırken filmin süresine göre bestelenir.</p>
            </Yuzen>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
          <p className="text-[13px] font-semibold text-white">Perdeler</p>
          <span className="ml-auto text-[12px] text-white/50">{p.plan === "ai" ? "AI yönetmen planı" : `${turBul(p.tur).ad} yapısı`}</span>
        </div>
        <div className="p-1.5">
          {p.bolumler.map((b, bi) => {
            const n = b.cekimler.length, v = b.cekimler.filter((x) => cekimTake(x, uretimler).video).length, k = b.cekimler.filter((x) => { const t = cekimTake(x, uretimler); return t.kare || t.video; }).length;
            return (
              <button key={b.id} onClick={() => { st().secim(b.id, b.cekimler[0]?.id ?? null); setSekme("perde"); if (b.cekimler[0]) sec2(b.cekimler[0].id); }} className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.05]">
                <span aria-hidden className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: perdeRengi(bi) }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2"><span className="truncate text-[13.5px] font-medium text-white">{b.baslik}</span><span className="ml-auto shrink-0 text-[12px] tabular-nums text-white/50">{sureYaz(bolumPlanli(b))}</span></span>
                  <span className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.08]" title={`${k} kare, ${v} video / ${n} çekim`}>
                    <span className="h-full bg-white transition-[width] duration-500" style={{ width: `${n ? (v / n) * 100 : 0}%` }} />
                    <span className="h-full bg-white/35 transition-[width] duration-500" style={{ width: `${n ? ((k - v) / n) * 100 : 0}%` }} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] px-3.5 py-2.5 text-[12px] text-white/55">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white" />Video</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/35" />Taslak kare</span>
          <span className="ml-auto flex items-center gap-1 tabular-nums text-white/75">{demoVideo ? null : <>Kalan <KrediJeton boyut={11} />{tum.filter((x) => !cekimTake(x.c, uretimler).video).reduce((a, x) => a + cekimKredi(x.c, p), 0).toLocaleString("tr-TR")}</>}</span>
        </div>
      </div>
    </motion.div>
  );

  const mufettis = (
    <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]" style={{ "--ist": `${istH}px` } as React.CSSProperties}>
      <header className="flex min-h-[62px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <Segment id="film-mufettis" deger={sekme} set={setSekme} className="flex-1"
          secenekler={[{ id: "cekim", ad: "Çekim", ikon: Clapperboard }, { id: "perde", ad: bolum ? `${bolumNo + 1}. perde` : "Perde", ikon: ListVideo }, { id: "film", ad: "Film", ikon: Settings2 }]} />
      </header>
      <div className="gizli-scroll min-h-0 flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait" initial={false}>{sekme === "cekim" ? cekimGorunum : sekme === "perde" ? perdeGorunum : filmGorunum}</AnimatePresence>
      </div>
      {sekme === "cekim" && istemci && (masaustu ? <div ref={istRef} className="absolute inset-x-0 bottom-0 z-10">{istemci}</div> : istemci)}
    </section>
  );

  const filmTakeleri = tum.flatMap((x) => x.c.takes.map((t) => uretimler.find((u) => u.id === t.uretimId)).filter((u): u is Uretim => !!u && u.durum === "tamam"));
  const modal = <AnimatePresence>{acikTake && <UretimGoruntuleyici key="take" u={uretimler.find((x) => x.id === acikTake.id) ?? acikTake} liste={filmTakeleri.length ? filmTakeleri : [acikTake]} onSec={(id) => { const u = uretimler.find((x) => x.id === id); if (u) setAcikTake(u); }} onKapat={() => setAcikTake(null)} />}</AnimatePresence>;

  if (!masaustu) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-zemin pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 bg-zemin/90 p-2 backdrop-blur-xl">{ustKart}</div>
        <div className="space-y-3 px-2 pb-6">
          <section className="overflow-hidden rounded-[22px] bg-[#121315] p-3 ring-1 ring-inset ring-white/[0.07]">
            <div className="h-[30vh]"><ExOynatici ref={oynatici} proje={montaj} anlar={anlar} basliklar={tum.map((x) => cekimAdi(x.c))} secili={secIndex} ince etiket="Çekim" kesitler={perdeAnlari} onZaman={kafaKonumla} onSahne={(i) => { const x = tum[i]; if (x) st().secim(x.b.id, x.c.id); }} sinif="h-full" /></div>
            <div className="mt-3">{zamanCizgisi}</div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 [&>div>button]:w-full [&>div>button]:justify-center">{topluDugme("kare")}{topluDugme("video")}</div>
          </section>
          {mufettis}
        </div>
        {modal}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-var(--ust-nav))] flex-col gap-3 bg-zemin p-3">
      {ustKart}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_420px] gap-3 xl:grid-cols-[minmax(0,1fr)_448px]">
        {animatik}
        {mufettis}
      </div>
      {modal}
    </div>
  );
}
