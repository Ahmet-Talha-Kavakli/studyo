"use client";

/**
 * Varlıklar — projenin giriş ekranı (Higgsfield proje mantığı, 2026-10-29 "A · Stüdyo çalışma alanı").
 * Üstte yapışkan araç çubuğu (başlık + sayı, tür segmenti, ara, Model / Tarih, klasör çipi, Yükle, görünüm menüsü),
 * ortada stüdyo galerisinin AYNI kartları tarihe göre gruplu, altta projeye bağlı yüzen stüdyo kutusu.
 * Kartlar sürüklenip raydaki klasörlere bırakılır; seçili klasör açıkken üretim ve yüklemeler oraya da düşer.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Download, EyeOff, FileText, Loader2, Search, SlidersHorizontal, Star, Trash2, Upload, X } from "lucide-react";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi } from "@/lib/galeri/gorunum";
import { SuzgecCubugu, suzgecEtkin, suzgecUygula, useKlasorIdleri, useSuzgec } from "@/components/galeri/SuzgecCubugu";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { Tooltip } from "@/components/ui/Tooltip";
import { oranSayi } from "@/components/panel/UretimKarti";
import { oranDegeri } from "@/components/studyo/video/veri";
import { useProje, type Proje } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useAyarKopru } from "@/store/useAyarKopru";
import { GaleriKart, type GaleriOlaylari } from "@/components/kitaplik/GaleriKart";
import { UretimGoruntuleyici, ucBoyutAdresi } from "@/components/studyo/UretimGoruntuleyici";
import { copeTasi, favoriYap, yayinla } from "@/components/kitaplik/eylemler";
import { tarihGrubu, uretimTuru } from "@/components/kitaplik/yardimci";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { uretimIndir } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn, onizlemeArka } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { ProjeStudyoPaneli } from "@/components/panel/proje/ProjeStudyoPaneli";
import { Hap, KART, MENU, MSATIR, MacKlasor, ease, yay } from "./ortak";

const gorselAdresiOf = (u: Uretim) => u.gorselUrl?.startsWith("data:") || /^(https?:|\/)/.test(u.gorselUrl ?? "") ? u.gorselUrl : u.thumbnailUrl;
const suruyor = (u: Uretim) => u.durum === "kuyrukta" || u.durum === "isleniyor";

/** Boş projede tek tıkla üretim kutusunu dolduran başlangıç istemleri (kare = istemin gerçek örnek çıktısı). */
const BASLANGIC = [
  { studyo: "gorsel", ad: "Ana kare", istem: "Yağmurlu neon caddede tek başına yürüyen karakter, geniş plan, sinematik ışık", img: "/gercek/kesfet/cyberpunk-sokak-yagmurusora-2.webp" },
  { studyo: "gorsel", ad: "Karakter portresi", istem: "Yakın plan karakter portresi, yumuşak yan ışık, sığ alan derinliği, 85mm", img: "/gercek/element/kael-portre.webp" },
  { studyo: "video", ad: "Açılış çekimi", istem: "Gece şehrin üzerinde yavaşça süzülen drone çekimi, neon tabelalar, ince yağmur", img: "/gercek/kesfet/neon-sehir-turuveo-3-1.webp" },
  { studyo: "gorsel", ad: "Mekân", istem: "Buharlı ara sokak, asılı tabelalar, ıslak zemin yansımaları, gece", img: "/gercek/kesfet/cyberpunk-sokakechostudio.webp" },
];

export function Varliklar({ p, varliklar, aktifKlasor, onKlasorTemizle, onBolum, ilkAcik }: {
  p: Proje; varliklar: Uretim[]; aktifKlasor: string | null; onKlasorTemizle: () => void; onBolum: (b: "brif" | "yonetmen") => void; ilkAcik?: string | null;
}) {
  const router = useRouter();
  const { projeKlasoreAt, uretimBagla } = useProje.getState();
  const uretimEkle = useProjeler((s) => s.ekle);
  /* Süzgeç çubuğu (Favoriler, klasörler, tür, tarih aralığı, sıralama) ve görünüm ayarı: kitaplıkla aynı bileşenler. */
  const [sz, szAyarla] = useSuzgec();
  const klasorIdleri = useKlasorIdleri(sz.klasor);
  const [g] = useGorunum("proje-varlik");
  const [q, setQ] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [hataGizle, setHataGizle] = useState(false);
  const [acik, setAcik] = useState<string | null>(ilkAcik ?? null);
  useEffect(() => { if (ilkAcik) setAcik(ilkAcik); }, [ilkAcik]);
  const [studyo, setStudyo] = useState("gorsel");
  /* Çoklu seçim: kartın sol üstündeki kutu ya da Ctrl/Shift tıklama. Shift aralık seçer. */
  const [secim, setSecim] = useState<string[]>([]);
  const sonSecilen = useRef<string | null>(null);
  useEffect(() => {
    if (!secim.length) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setSecim([]); };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [secim.length]);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const alanRef = useRef<HTMLDivElement>(null);
  const klasor = (p.klasorler ?? []).find((k) => k.id === aktifKlasor);

  /* Sütun sayısı stüdyo galerisindeki formülle, alan genişliğine göre. */
  const [en, setEn] = useState(1100);
  useLayoutEffect(() => {
    const el = alanRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setEn(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sutun = sutunSayisi(en, g);
  const oranOf = (u: Uretim) => { const t = uretimTuru(u); return kartOrani(g, t === "ses" || t === "muzik" ? 4 / 3 : t === "video" ? oranDegeri(u.meta?.oran) : oranSayi(u)); };

  const havuz = useMemo(() => (klasor ? varliklar.filter((u) => (klasor.uretimIdler ?? []).includes(u.id)) : varliklar), [varliklar, klasor]);
  const liste = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    const l = havuz.filter((u) => (!model || u.model === model) && (!hataGizle || u.durum !== "hata") && (!t || `${u.baslik} ${u.prompt} ${u.model}`.toLocaleLowerCase("tr").includes(t)));
    return suzgecUygula(l, sz, klasorIdleri);
  }, [havuz, model, hataGizle, q, sz, klasorIdleri]);
  const surenler = liste.filter(suruyor);
  const gruplar = useMemo(() => {
    const simdi = Date.now();
    const m: { anahtar: string; etiket: string; ogeler: Uretim[] }[] = [];
    if (sz.siralama === "ozel") return [{ anahtar: "hepsi", etiket: "", ogeler: liste.filter((u) => !suruyor(u)) }];
    for (const u of liste) {
      if (suruyor(u)) continue;
      const g = tarihGrubu(u.olusturma, simdi);
      const son = m[m.length - 1];
      if (son?.anahtar === g.anahtar) son.ogeler.push(u); else m.push({ ...g, ogeler: [u] });
    }
    return m;
  }, [liste, sz.siralama]);
  const turSayilari = useMemo(() => { const s: Record<string, number> = {}; for (const u of havuz) s[uretimTuru(u)] = (s[uretimTuru(u)] ?? 0) + 1; return s; }, [havuz]);
  const modeller = useMemo(() => Array.from(new Set(havuz.map((u) => u.model))).sort((a, b) => a.localeCompare(b, "tr")), [havuz]);
  const suzgec = suzgecEtkin(sz) || !!model || hataGizle || !!q.trim();
  const temizle = () => { szAyarla({ favori: false, klasor: null, tur: null, tarih: {} }); setQ(""); setModel(null); setHataGizle(false); };

  const olay: GaleriOlaylari = useMemo(() => ({
    onAc: (u) => (uretimTuru(u) === "3d" ? router.push(ucBoyutAdresi(u)) : setAcik(u.id)), onMenu: () => {},
    onSec: (u, e) => {
      const sira = siraRef.current;
      if (e?.shiftKey && sonSecilen.current && sira.includes(sonSecilen.current)) {
        const [a, b] = [sira.indexOf(sonSecilen.current), sira.indexOf(u.id)].sort((x, y) => x - y);
        const aralik = sira.slice(a, b + 1);
        setSecim((s) => Array.from(new Set([...s, ...aralik])));
      } else setSecim((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]));
      sonSecilen.current = u.id;
    },
    onBegen: (u) => { favoriYap([u.id], !u.favori); toast.success(u.favori ? "Favorilerden çıkarıldı" : "Favorilere eklendi"); },
    onIndir: (u) => uretimIndir(u), onCal: () => {}, onStudyo: (u) => setAcik(u.id), onReferans: () => {}, onAnimate: () => {}, on3d: () => {}, onElement: () => {},
    onYayinla: (u) => yayinla([u.id], true), onSil: (u) => copeTasi([u.id]), projeler: [], onProjeyeEkle: () => {}, onYeniProje: () => {},
  }), [router]);

  const yukle = (dosyalar: FileList | null) => {
    if (!dosyalar?.length) return;
    let n = 0;
    Array.from(dosyalar).forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        const veri = typeof r.result === "string" ? r.result : undefined;
        const t = f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "ses" : "gorsel";
        const id = uretimEkle({ baslik: f.name, tur: t as Uretim["tur"], model: "Yükleme", prompt: "", durum: "tamam", ilerleme: 100, kredi: 0, arac: "Yükleme",
          gorselUrl: t === "gorsel" ? veri : onizlemeArka(f.name, "sinematik"), videoUrl: t === "video" ? veri : undefined, sesUrl: t === "ses" ? veri : undefined, projeId: p.id, gercek: true });
        uretimBagla(p.id, id, "genel");
        if (aktifKlasor) projeKlasoreAt(p.id, aktifKlasor, id);
        if (++n === dosyalar.length) toast.success(`${n} dosya projeye eklendi`, { description: klasor ? `"${klasor.ad}" klasörüne de eklendi.` : "Kitaplıkta da görünür." });
      };
      r.onerror = () => mesaj.yuklenemedi(f.name, "Dosya okunamadı.");
      r.readAsDataURL(f);
    });
  };

  /* Seçim aralığı için görünen sıra (gruplar ve sürenler dahil). */
  const siraRef = useRef<string[]>([]);
  siraRef.current = liste.map((u) => u.id);
  const seciliUretimler = varliklar.filter((u) => secim.includes(u.id));
  const secimKlasore = (kid: string) => {
    const k = (p.klasorler ?? []).find((x) => x.id === kid);
    for (const u of seciliUretimler) projeKlasoreAt(p.id, kid, u.id);
    toast.success(`${seciliUretimler.length} varlık "${k?.ad}" klasörüne eklendi`, { description: "Projede ve kitaplıkta da kalır." });
    setSecim([]);
  };

  /* Fonksiyon çağrısı (bileşen değil): her çizimde yeniden kurulmasın, açılır menünün durumu korunsun. */
  const secimHapi = (konum: string, anahtar: string) => (
    <motion.div key={anahtar} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease }} className={cn("flex justify-center px-3", konum)}>
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.1] bg-[#1c1d20]/95 py-2 pl-2 pr-2 backdrop-blur-xl [scrollbar-width:none]">
        <span className="hidden -space-x-2 pl-1 sm:flex">
          {seciliUretimler.slice(0, 3).map((u) => <span key={u.id} className="h-7 w-7 rounded-full border-2 border-[#1c1d20] bg-white/10 bg-cover bg-center" style={{ backgroundImage: gorselAdresiOf(u) ? `url("${gorselAdresiOf(u)}")` : undefined }} />)}
        </span>
        <motion.span key={secim.length} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="shrink-0 whitespace-nowrap px-2 text-[14.5px] font-semibold tabular-nums text-white">{secim.length} seçili</motion.span>
        {secim.length < liste.length && <button onClick={() => setSecim(liste.map((u) => u.id))} className="hidden h-10 shrink-0 rounded-full px-3 text-[13.5px] text-white/70 transition hover:bg-white/[0.08] hover:text-white md:block">Hepsini seç</button>}
        <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
        {(p.klasorler ?? []).length > 0 && (
          <Acilir etiket="Klasöre ekle" aktif={false}>
            {(kapat) => <>{(p.klasorler ?? []).map((k) => <button key={k.id} onClick={() => { kapat(); secimKlasore(k.id); }} className={MSATIR}><MacKlasor renk={k.renk ?? "#4aa8f0"} kapali className="h-3.5 w-[18px]" /><span className="flex-1 truncate">{k.ad}</span></button>)}</>}
          </Acilir>
        )}
        <KlasoreTasiDugmesi uretimIdler={secim} onBitti={() => setSecim([])} etiketSinif="hidden sm:inline" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] text-white/80 transition hover:bg-white/[0.08] hover:text-white" />
        <button onClick={() => { const fav = !seciliUretimler.every((u) => u.favori); favoriYap(secim, fav); toast.success(fav ? `${secim.length} varlık favorilere eklendi` : "Favorilerden çıkarıldı"); }} title={seciliUretimler.every((u) => u.favori) ? "Favorilerden çıkar" : "Favorilere ekle"} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] text-white/80 transition hover:bg-white/[0.08] hover:text-white"><Star className={cn("h-4 w-4", seciliUretimler.length > 0 && seciliUretimler.every((u) => u.favori) && "fill-aksan text-aksan")} /><span className="hidden sm:inline">Favori</span></button>
        <button onClick={() => { seciliUretimler.filter((u) => u.durum === "tamam").forEach((u) => uretimIndir(u)); }} title="İndir" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] text-white/80 transition hover:bg-white/[0.08] hover:text-white"><Download className="h-4 w-4" /><span className="hidden sm:inline">İndir</span></button>
        <button onClick={() => { const n = secim.length; copeTasi(secim); setSecim([]); toast.success(`${n} varlık çöpe taşındı`, { description: "Kitaplıktaki çöpten 30 gün içinde geri alabilirsin." }); }} aria-label="Çöpe taşı" title="Çöpe taşı" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-rose-500/15 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-white/10" />
        <button onClick={() => setSecim([])} aria-label="Seçimi kaldır (Esc)" title="Seçimi kaldır (Esc)" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
    </motion.div>
  );

  const goruntulenen = acik ? liste.find((u) => u.id === acik) ?? varliklar.find((u) => u.id === acik) : undefined;
  const kart = (u: Uretim) => (
    <div key={u.id} className="mb-1 break-inside-avoid" draggable={u.durum === "tamam"}
      onDragStart={(e) => { e.dataTransfer.setData("application/x-vayra-uretim", u.id); e.dataTransfer.effectAllowed = "copy"; }}>
      <GaleriKart u={u} oran={g.yerlesim === "ozgun" ? undefined : kartOrani(g, 1)} secili={secim.includes(u.id)} secimModu={secim.length > 0} calan={false} ilerleme={0} o={olay} />
    </div>
  );
  /* Masonry: her öğe en kısa sütuna (sıra soldan sağa korunur). */
  const izgara = (ogeler: Uretim[]) => {
    const cols: Uretim[][] = Array.from({ length: sutun }, () => []);
    const boy = new Array(sutun).fill(0);
    for (const u of ogeler) { let i = 0; for (let k = 1; k < sutun; k++) if (boy[k] < boy[i] - 0.02) i = k; cols[i].push(u); boy[i] += 1 / Math.max(0.2, oranOf(u)) + 0.02; }
    return <div className="flex items-start gap-1">{cols.map((c, i) => <div key={i} className="min-w-0 flex-1">{c.map(kart)}</div>)}</div>;
  };
  const baslangic = (b: (typeof BASLANGIC)[number]) => {
    if (window.innerWidth < 640) { useAyarKopru.getState().gonder({ tur: b.studyo, prompt: b.istem }); router.push(`/panel/${b.studyo}?proje=${p.id}`); return; }
    setStudyo(b.studyo);
    setTimeout(() => useAyarKopru.getState().gonder({ tur: b.studyo, prompt: b.istem }), 60);
    document.getElementById("proje-uretim-kutusu")?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-var(--ust-nav)-82px)] flex-col">
      <input ref={dosyaRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => { yukle(e.target.files); e.target.value = ""; }} />

      {/* Araç çubuğu */}
      <div className="sticky top-[var(--ust-nav)] z-20 -mx-4 bg-[#0b0b0c]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="gizli-scroll flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          <h1 className="mr-1 flex shrink-0 items-center gap-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
            {klasor ? <><MacKlasor renk={klasor.renk ?? "#4aa8f0"} className="h-[18px] w-6" kapali />{klasor.ad}</> : "Varlıklar"}
            {havuz.length > 0 && <motion.span key={havuz.length} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Hap>{havuz.length}</Hap></motion.span>}
          </h1>
          {klasor && (
            <button onClick={onKlasorTemizle} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 transition hover:bg-white/[0.12]"><X className="h-3.5 w-3.5" />Tüm varlıklar</button>
          )}
          {havuz.length > 0 && (
            <>
              <label className="flex h-10 w-[190px] shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 ring-1 ring-inset ring-white/[0.06] transition focus-within:bg-white/[0.08]">
                <Search className="h-4 w-4 shrink-0 text-white/50" />
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQ("")} placeholder="İstemde ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
                {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
              </label>
              <Acilir etiket={model ?? "Model"} aktif={!!model}>
                {(kapat) => <>
                  <button onClick={() => { setModel(null); kapat(); }} className={cn(MSATIR, !model && "bg-white/[0.08] ring-1 ring-inset ring-white/40")}>Bütün modeller</button>
                  {modeller.map((m) => <button key={m} onClick={() => { setModel(m); kapat(); }} className={cn(MSATIR, model === m && "bg-white/[0.08] ring-1 ring-inset ring-white/40")}><ModelLogo ad={m} boyut={14} /><span className="flex-1 truncate">{m}</span></button>)}
                </>}
              </Acilir>
              <SuzgecCubugu d={sz} ayarla={szAyarla} sayilar={turSayilari} seciliIdler={secim.length ? secim : undefined} className="overflow-visible max-sm:overflow-visible" />
              <AnimatePresence>{suzgec && <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={temizle} aria-label="Süzgeçleri temizle" title="Süzgeçleri temizle" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/80 hover:bg-white/[0.12]"><X className="h-4 w-4" /></motion.button>}</AnimatePresence>
            </>
          )}
          <span className="flex-1" />
          <button onClick={() => dosyaRef.current?.click()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.12]"><Upload className="h-4 w-4" />Yükle</button>
          {havuz.length > 0 && (
            <>
              <Tooltip label={hataGizle ? "Başarısızları göster" : "Başarısızları gizle"} side="bottom">
                <button onClick={() => setHataGizle((v) => !v)} aria-pressed={hataGizle} aria-label="Başarısızları gizle" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition active:scale-95", hataGizle ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/85 ring-white/[0.06] hover:bg-white/[0.09]")}><EyeOff className="h-4 w-4" /></button>
              </Tooltip>
              <GorunumAyari sayfa="proje-varlik" istemVar={false} siralamaVar={false} dugmeSinif="h-10 w-10" />
            </>
          )}
        </div>
      </div>

      {/* Galeri */}
      <div ref={alanRef} className="min-h-[40vh] pb-28 pt-1 sm:pb-6">
        {havuz.length === 0 ? (
          <BosProje klasorAd={klasor?.ad} kompakt={studyo === "ses" || studyo === "muzik"} onBaslangic={baslangic} onYukle={() => dosyaRef.current?.click()} onBrif={() => onBolum("brif")} onSahne={() => onBolum("yonetmen")} />
        ) : liste.length === 0 ? (
          <section className={cn(KART, "flex flex-wrap items-center gap-3 p-4")}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white"><Search className="h-[18px] w-[18px]" /></span>
            <p className="min-w-0 flex-1 text-[14px] text-white/80">Bu süzgeçlere uyan varlık yok.</p>
            <button onClick={temizle} className="h-9 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">Süzgeçleri temizle</button>
          </section>
        ) : (
          <>
            {surenler.length > 0 && (
              <section className="mb-5">
                <h2 className="flex items-center gap-2 px-1 pb-2.5 pt-2 text-[15px] font-semibold tracking-[-0.01em] text-white"><Loader2 className="h-4 w-4 animate-spin text-[#55d6fd]" />Sürüyor<Hap>{surenler.length}</Hap></h2>
                {izgara(surenler)}
              </section>
            )}
            {gruplar.map((gr) => (
              <section key={gr.anahtar} className="mb-5">
                {gr.etiket && <h2 className="flex items-center gap-2 px-1 pb-2.5 pt-2 text-[15px] font-semibold tracking-[-0.01em] text-white">{gr.etiket}<Hap>{gr.ogeler.length}</Hap></h2>}
                {izgara(gr.ogeler)}
              </section>
            ))}
          </>
        )}
      </div>

      {/* Projeye bağlı yüzen üretim kutusu (stüdyoların gerçek kutusu) */}
      {/* Telefonda stüdyolar tam ekran üretim sayfası açar; kutu yerine projeye bağlı stüdyo kısayolları. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 sm:hidden">
        <div className="pointer-events-auto flex w-full max-w-[420px] items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#16171a]/95 p-1.5 backdrop-blur-xl">
          <span className="pl-3 text-[13px] font-medium text-white/80">Bu projede üret</span>
          <span className="flex-1" />
          {([["gorsel", "Görsel"], ["video", "Video"], ["ses", "Ses"]] as const).map(([y, ad], i) => (
            <Link key={y} href={`/panel/${y}?proje=${p.id}`} className={cn("flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold", i === 0 ? "bg-white text-black" : "bg-white/[0.08] text-white/90")}>{ad}</Link>
          ))}
        </div>
      </div>
      <div aria-hidden className="flex-1" />
      <div id="proje-uretim-kutusu" className="sticky bottom-3 z-20 hidden pt-4 sm:bottom-5 sm:block">
        <motion.div animate={secim.length ? { opacity: 0, y: 28, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.32, ease }}
          className={cn("mx-auto w-full max-w-[1240px]", secim.length > 0 && "pointer-events-none")} aria-hidden={secim.length > 0 || undefined}>
          <ProjeStudyoPaneli projeId={p.id} aktif={studyo} onAktif={setStudyo} ust={klasor && <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85"><MacKlasor renk={klasor.renk ?? "#4aa8f0"} className="h-3 w-4" kapali />{klasor.ad} klasörüne</span>}
            onUretildi={(id) => { if (aktifKlasor) projeKlasoreAt(p.id, aktifKlasor, id); }} />
        </motion.div>
        <AnimatePresence>
          {secim.length > 0 && secimHapi("absolute inset-x-0 bottom-0", "secim")}
        </AnimatePresence>
      </div>
      {/* Telefonda seçim hapı alt çubuğun üstünde */}
      <AnimatePresence>
        {secim.length > 0 && secimHapi("fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 sm:hidden", "secim-m")}
      </AnimatePresence>

      <AnimatePresence>
        {goruntulenen && <UretimGoruntuleyici key="g" u={goruntulenen} liste={liste} onSec={setAcik} onKapat={() => setAcik(null)} projeId={p.id} />}
      </AnimatePresence>
    </div>
  );
}

/** Boş proje: kart içinde başlangıç istemleri (tıklayınca kutuyu doldurur) + alt şeritte iki eylem. */
function BosProje({ klasorAd, kompakt, onBaslangic, onYukle, onBrif, onSahne }: { klasorAd?: string; kompakt?: boolean; onBaslangic: (b: (typeof BASLANGIC)[number]) => void; onYukle: () => void; onBrif: () => void; onSahne: () => void }) {
  const ikincil = "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white";
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
      className="mt-1 flex flex-col items-center px-5 py-8 text-center sm:py-6">
      {/* Başlangıç istemlerinin örnek kareleri yelpaze gibi */}
      {!kompakt && <div className="relative flex h-24 items-center justify-center">
        {BASLANGIC.map((b, i, l) => {
          const k = i - (l.length - 1) / 2;
          return (
            <motion.span key={b.ad} initial={{ opacity: 0, y: 10, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(k) * 5, rotate: k * 8 }} transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
              className="relative -mx-2.5 block h-[82px] w-[66px] overflow-hidden rounded-[16px] ring-[3px] ring-[#111214]" style={{ zIndex: 10 - Math.round(Math.abs(k) * 2) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.img} alt="" className="h-full w-full object-cover" />
            </motion.span>
          );
        })}
      </div>}
      <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">{klasorAd ? `"${klasorAd}" klasörü boş` : kompakt ? "İlk sesini üret" : "İlk kareni üret"}</h2>
      <p className="mt-2 max-w-[460px] text-[14px] leading-relaxed text-white/60">
        {klasorAd ? "Bu klasör açıkken ürettiklerin ve yüklediklerin buraya düşer. Galeriden kart sürükleyip klasöre de bırakabilirsin." : kompakt ? "Alttaki kutuya ne istediğini yaz. Ürettiğin her şey bu projeye ve kitaplığa düşer." : "Alttaki kutuya ne istediğini yaz ya da bir başlangıç seç. Ürettiğin her şey bu projeye ve kitaplığa düşer."}
      </p>
      {!klasorAd && !kompakt && (
        <div className="mt-6 flex max-w-[780px] flex-wrap justify-center gap-2">
          {BASLANGIC.map((b, i) => (
            <motion.button key={b.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, ease }} onClick={() => onBaslangic(b)} title={b.istem}
              className="group flex h-10 items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-1 pr-3.5 text-[13px] font-medium text-white/85 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] hover:text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.img} alt="" className="h-8 w-8 rounded-full object-cover" />
              {b.ad}<span className="text-[11.5px] font-normal text-white/40">{b.studyo === "video" ? "Video" : "Görsel"}</span>
            </motion.button>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1">
        <button onClick={onYukle} className={ikincil}><Upload className="h-4 w-4" />Dosya yükle</button>
        {!klasorAd && <>
          <button onClick={onBrif} className={ikincil}><FileText className="h-4 w-4" />Önce brif yaz</button>
          <button onClick={onSahne} className={ikincil}>Yönetmenle planla<ArrowRight className="h-3.5 w-3.5" /></button>
        </>}
      </div>
      {!klasorAd && !kompakt && <p className="mt-4 text-[11.5px] text-white/35">Küçük kareler örnek çıktıdır.</p>}
    </motion.section>
  );
}

function Anahtar({ a }: { a: boolean }) {
  return <span className={cn("relative h-5 w-8 rounded-full transition-colors", a ? "bg-white" : "bg-white/15")}><motion.span layout transition={yay} className={cn("absolute top-0.5 h-4 w-4 rounded-full", a ? "right-0.5 bg-black" : "left-0.5 bg-white")} /></span>;
}

function Acilir({ etiket, aktif, simge, children }: { etiket: string; aktif: boolean; simge?: boolean; children: (kapat: () => void) => React.ReactNode }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative shrink-0">
      {simge ? (
        <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-label={etiket} title={etiket} className={cn("relative flex h-10 w-10 items-center justify-center rounded-full transition", aktif ? "bg-white text-black" : "bg-white/[0.07] text-white/85 hover:bg-white/[0.12]")}><SlidersHorizontal className="h-4 w-4" /></button>
      ) : (
        <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cn("flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ring-1 ring-inset transition", aktif ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/85 ring-white/[0.06] hover:bg-white/[0.09]")}>
          <span className="max-w-[140px] truncate">{etiket}</span><ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
        </button>
      )}
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={simge ? "alt-sag" : "alt-sol"} bosluk={6} etiket={etiket} className={cn(MENU, "max-h-80 w-60 overflow-y-auto")}>{children(() => setAcik(false))}</Yuzen>
    </div>
  );
}
