"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Images, ScanFace, Camera, Upload, X, Loader2, Plus, Check, Sparkles, Search, Eye, ArrowRight, Info, Layers, AlertTriangle, GalleryHorizontal, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useElements } from "@/store/useElements";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { cozunurlukCarpani, GORSEL_MODELLER } from "@/lib/gorselModelVeri";
import { DUMP_PAKETLERI, DUMP_KATEGORILERI, kareIstemi, paketOrnekleri, type DumpKategori, type DumpPaket } from "@/lib/dumpVeri";
import { MarkaKare } from "@/components/studyo/hf";
import { KCip } from "@/components/studyo/Cip";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { Kayan, YanPanel, DumpSetleri, useDumpSetleri } from "@/components/dump/dumpOrtak";
import { OranSekli, useGorselBaglanti, gorselModelBul, modelKredi, krediYaz, dosyaOku, gorselYukle, gorselOlcu, GORSEL_TURLERI } from "@/components/arac/kit";

/**
 * Photodump — "Aynı yüz, farklı sahneler". Karakterini (ya da bir fotoğrafını) seç, bir konsept seç;
 * tek tıkla 10, 15 ya da 26 karelik set. Her kare ayrı üretimdir ve aynı kişi referansını alır.
 */
const ARAC = "Photodump";
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex min-h-[52px] items-center gap-2 border-b border-white/[0.07] px-4 py-2.5";
const CAM = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const KARELER = [10, 15, 26];
const ORANLAR: { o: string; a: string }[] = [{ o: "4:5", a: "Gönderi" }, { o: "3:4", a: "Izgara" }, { o: "1:1", a: "Kare" }, { o: "9:16", a: "Hikâye" }];
const ONERILEN = ["Nano Banana 2.1", "Nano Banana Pro", "Vayra Ruh 2.0", "GPT Image 2", "Seedream 5.0 Pro"];
type Kat = DumpKategori | "Tümü";
type Foto = { id: string; url: string; durum: "yukleniyor" | "hazir" | "hata"; dusuk?: boolean };
const kucuk = (s: string) => s.toLocaleLowerCase("tr");
const dortlu = (p: DumpPaket) => paketOrnekleri(p).slice(0, 4);

/** Dört karelik konsept şeridi kartı (Higgsfield preset kartı düzeni). */
function KonseptKarti({ p, secili, onSec, onAyrinti }: { p: DumpPaket; secili: boolean; onSec: () => void; onAyrinti: () => void }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-[18px] bg-white/[0.035] transition-shadow duration-200",
      secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/[0.07] hover:ring-white/[0.16]")}>
      <button onClick={onSec} aria-pressed={secili} aria-label={`${p.ad} konseptini seç`} className="block w-full text-left transition-transform duration-200 active:scale-[0.99]">
        <span className="relative grid aspect-[3.2/1] grid-cols-4 gap-[2px] bg-black">
          {dortlu(p).map((g, i) => (
            <span key={i} className="relative overflow-hidden">
              <img src={g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" style={{ transitionDelay: `${i * 35}ms` }} />
            </span>
          ))}
          {p.yeni && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur">Yeni</span>}
          <AnimatePresence>
            {secili && (
              <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-4 w-4" strokeWidth={3} /></motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="block py-3 pl-4 pr-[112px]">
          <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-metin">{p.ad}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-metin-3">{p.not}</span>
        </span>
      </button>
      <button onClick={onAyrinti} title="Konseptin örneklerini gör"
        className="absolute bottom-[14px] right-3 flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.11] hover:text-metin active:scale-95">
        <Eye className="h-3.5 w-3.5" />Örnekler
      </button>
    </div>
  );
}

export function PhotodumpStudyo() {
  const masaustu = useMasaustu();
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();
  const elementler = useElements((s) => s.elementler);
  const karakterler = useMemo(() => elementler.filter((e) => e.tur === "karakter"), [elementler]);

  const [sekme, setSekme] = useState<"olustur" | "setler">("olustur");
  const [kat, setKat] = useState<Kat>("Tümü");
  const [arama, setArama] = useState("");
  const [konseptId, setKonseptId] = useState(DUMP_PAKETLERI[0].id);
  const [ayrinti, setAyrinti] = useState<string | null>(null);
  const [kisi, setKisi] = useState<"karakter" | "foto">("karakter");
  const [karakterId, setKarakterId] = useState<string | null>(null);
  const [foto, setFoto] = useState<Foto | null>(null);
  const [kare, setKare] = useState(15);
  const [oran, setOran] = useState("4:5");
  const [model, setModel] = useState("Nano Banana 2.1");
  const [cozunurluk, setCozunurluk] = useState("2K");
  const [acik, setAcik] = useState<null | "kisi" | "kare" | "bicim">(null);
  const [modelPanel, setModelPanel] = useState(false);
  const [ayarPanel, setAyarPanel] = useState(false);
  const [aktifGrup, setAktifGrup] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const anaRef = useRef<HTMLDivElement>(null);
  const konseptRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!karakterId && karakterler[0]) setKarakterId(karakterler[0].id); }, [karakterler, karakterId]);
  useEffect(() => { anaRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); }, [sekme]);

  const konsept = DUMP_PAKETLERI.find((p) => p.id === konseptId) ?? DUMP_PAKETLERI[0];
  const karakter = karakterler.find((k) => k.id === karakterId) ?? null;
  const m = gorselModelBul(model);
  const demo = b.bagli(m) === false;
  const birim = demo ? 0 : modelKredi(m) * (m.api.cozunurluklar.length ? cozunurlukCarpani(cozunurluk) : 1);
  const kisiHazir = kisi === "karakter" ? !!karakter : foto?.durum === "hazir";
  const eksik = !kisiHazir ? (kisi === "karakter" ? (karakterler.length ? "Bir karakter seç" : "Karakter oluştur ya da fotoğraf yükle") : foto?.durum === "yukleniyor" ? "Fotoğraf yükleniyor" : "Fotoğrafını yükle") : null;

  const aranan = kucuk(arama.trim());
  const liste = DUMP_PAKETLERI.filter((p) => (kat === "Tümü" || p.kat === kat) && (!aranan || kucuk(`${p.ad} ${p.not} ${p.kat}`).includes(aranan)));
  const { setler, surenSayi } = useDumpSetleri(ARAC);
  const aktif = setler.find((s) => s.id === aktifGrup) ?? setler[0];
  const aktifKonsept = aktif ? DUMP_PAKETLERI.find((p) => p.ad === aktif.l[0].meta?.pano) : undefined;

  /* ── Fotoğraf ── */
  const fotoYukle = async (d?: File) => {
    if (!d) return;
    if (!GORSEL_TURLERI.includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    const dataUrl = await dosyaOku(d);
    const { w, h } = await gorselOlcu(dataUrl);
    const id = `${d.name}-${d.size}`;
    setFoto({ id, url: dataUrl, durum: "yukleniyor", dusuk: Math.min(w, h) > 0 && Math.min(w, h) < 512 });
    setKisi("foto");
    gorselYukle(dataUrl).then((url) => setFoto((f) => (f?.id === id ? { ...f, url, durum: "hazir" } : f)))
      .catch(() => setFoto((f) => (f?.id === id ? { ...f, durum: "hata" } : f)));
  };

  /* ── Üretim ── */
  const uret = () => {
    if (gonderiliyor) return;
    if (eksik) { setAcik("kisi"); return void toast.error("Set başlatılamadı", { description: `${eksik}.` }); }
    const kim = kisi === "karakter" ? `@${karakter!.ad}` : "The person from the reference photo";
    const refler = kisi === "foto" && foto ? [foto.url] : [];
    const d = icerikDenetle(`${kim} ${konsept.tema}`);
    if (!d.izin) return void toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}. ${d.mesaj}` });
    setGonderiliyor(true);
    const grupId = `photodump-${Date.now().toString(36)}`;
    // Demo çıktısı tekrarsız: önce konseptin kendi örnekleri, kare sayısı aşarsa diğer konseptlerin örnekleri.
    const karistir = (l: string[]) => [...l].sort(() => Math.random() - 0.5);
    // Tematik paketler birbirinden çok farklı (yaz, kış, aura); onlarda yalnız kendi örnekleri kullanılır.
    const ayniKat = konsept.kat === "Tematik" ? [] : karistir(DUMP_PAKETLERI.filter((p) => p.kat === konsept.kat && p.id !== konsept.id).flatMap(paketOrnekleri));
    // Başka temanın görselleri set dışı görünür; yalnız aynı kategoriyle dolar, gerekirse başa döner.
    const havuz = [...new Set([...paketOrnekleri(konsept), ...ayniKat])];
    // Havuz bitince her tur kendi içinde karışır; aynı görseller aynı sırada (ve aynı satırda) tekrar etmez.
    const demoSira: string[] = [];
    while (demoSira.length < kare) {
      const tur = demoSira.length ? karistir(havuz) : havuz;
      // Tur sınırında aynı görsel yan yana gelmesin.
      if (tur.length > 1 && tur[0] === demoSira[demoSira.length - 1]) tur.push(tur.shift()!);
      demoSira.push(...tur);
    }
    let n = 0;
    for (let i = 0; i < kare; i++) {
      const { istem, kadraj } = kareIstemi(kim, konsept.tema, i);
      const gorunur = `${konsept.ad} konsepti, ${kucuk(kadraj)} karesi. ${kisi === "karakter" ? `@${karakter!.ad}` : "Fotoğraftaki kişi"}, her karede aynı yüz.`;
      const s = uretimBaslat({
        baslik: `${konsept.ad} · ${kadraj}`, tur: "gorsel", model, prompt: istem, kredi: birim, arac: ARAC, projeId: aktifProjeId ?? undefined,
        meta: { islem: "uret", oran, ...(m.api.cozunurluklar.length ? { cozunurluk } : {}), hamIstem: gorunur, grupId, sira: i, pano: konsept.ad, demoOrnek: demoSira[i],
          ...(refler.length ? { referanslar: refler, gorselUrl: refler[0] } : {}) },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); break; }
      n++;
    }
    setTimeout(() => setGonderiliyor(false), 800);
    if (!n) return;
    setAktifGrup(grupId); setSekme("setler");
    toast.success(`${n} karelik photodump üretiliyor`, { description: `${konsept.ad} · ${model} · ${demo ? "Kredi düşmez." : `${krediYaz(birim * n)} kredi.`}` });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.repeat && !ayrinti && !modelPanel && !ayarPanel && !document.querySelector("[data-goruntuleyici]")) { e.preventDefault(); uret(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  /* ═════════════ Parçalar ═════════════ */
  const kisiAvatar = (sinif: string) => kisi === "karakter"
    ? karakter ? <ElementKapak e={karakter} className={cn(sinif, "overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover")} oynat={false} /> : null
    : foto ? <img src={foto.url} alt="" className={cn(sinif, "object-cover")} /> : null;
  const kisiAd = kisi === "karakter" ? (karakter ? `@${karakter.ad}` : "Seçilmedi") : foto ? "Fotoğrafın" : "Yüklenmedi";

  const kisiPaneli = (
    <div className="p-1.5">
      <div className="mb-3"><Kayan tam id="kisi-tur" etiket="Kişi kaynağı" deger={kisi} onDeger={setKisi} secenekler={[{ v: "karakter", a: "Karakterim" }, { v: "foto", a: "Fotoğraf" }]} /></div>
      {kisi === "karakter" ? (
        karakterler.length ? (
          <div className="grid grid-cols-4 gap-2">
            {karakterler.map((k) => (
              <button key={k.id} onClick={() => { setKarakterId(k.id); setAcik(null); }} aria-pressed={karakterId === k.id} className="group text-left active:scale-[0.97]">
                <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[12px]", karakterId === k.id ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/10 group-hover:ring-white/30")}>
                  <ElementKapak e={k} className="absolute inset-0 h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
                </span>
                <span className="mt-1 block truncate text-[11.5px] font-medium text-metin-2">@{k.ad}</span>
              </button>
            ))}
            <Link href="/panel/karakter/yeni" className="group text-left">
              <span className="flex aspect-[3/4] items-center justify-center rounded-[12px] border border-dashed border-white/15 text-metin-3 group-hover:border-white/30 group-hover:text-metin"><Plus className="h-4 w-4" /></span>
              <span className="mt-1 block text-[11.5px] text-metin-3">Yeni</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/panel/karakter/yeni" className="flex items-center gap-3 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.07]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Plus className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-metin">Karakter oluştur</span><span className="block text-[12px] text-metin-3">1 ile 5 fotoğraf, ücretsiz; her sette aynı yüz</span></span>
              <ArrowRight className="h-4 w-4 text-metin-3" />
            </Link>
            <button onClick={() => setKisi("foto")} className="w-full rounded-full py-2 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.05] hover:text-metin">Ya da tek fotoğrafla dene</button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={() => fotoRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void fotoYukle(e.dataTransfer.files[0]); }}
            className={cn("group relative flex aspect-[4/5] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] active:scale-[0.97]", foto ? "ring-1 ring-inset ring-white/15" : "border border-dashed border-white/[0.22] hover:border-white/40")}>
            {foto ? <img src={foto.url} alt="Fotoğrafın" className={cn("absolute inset-0 h-full w-full object-cover", foto.durum === "yukleniyor" && "opacity-50")} />
              : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Upload className="h-4 w-4" /></span>}
            {foto?.durum === "yukleniyor" && <Loader2 className="absolute h-4 w-4 animate-spin text-white" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-metin">{foto ? (foto.durum === "hata" ? "Yüklenemedi" : foto.durum === "hazir" ? "Fotoğraf hazır" : "Yükleniyor") : "Tek fotoğraf yükle"}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-metin-3">Net, önden, tek kişi. Karakterle yüz daha tutarlı olur.</p>
            {foto?.dusuk && <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-semibold text-[#1a1405]"><AlertTriangle className="h-3 w-3" />Düşük kalite</p>}
            {foto && <div className="mt-2 flex gap-1.5"><button onClick={() => fotoRef.current?.click()} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12px] font-medium text-metin hover:bg-white/[0.11]">Değiştir</button><button onClick={() => setFoto(null)} className="h-8 rounded-full px-3 text-[12px] text-metin-3 hover:bg-white/[0.06] hover:text-metin">Kaldır</button></div>}
          </div>
        </div>
      )}
    </div>
  );

  const bicimSecici = (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {ORANLAR.filter((x) => !m.api.oranlar.length || m.api.oranlar.includes(x.o)).map((x) => (
          <button key={x.o} onClick={() => setOran(x.o)} aria-pressed={oran === x.o}
            className={cn("flex h-[70px] flex-col items-center justify-center gap-1.5 rounded-[12px] transition-colors active:scale-[0.97]", oran === x.o ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]")}>
            <OranSekli oran={x.o} boyut={16} /><span className="text-[12px] font-semibold tabular-nums leading-none">{x.o}</span><span className={cn("text-[10.5px] leading-none", oran === x.o ? "text-black/55" : "text-metin-3")}>{x.a}</span>
          </button>
        ))}
      </div>
      {m.api.cozunurluklar.length > 0 && (
        <div className="mt-2 grid gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]" style={{ gridTemplateColumns: `repeat(${m.api.cozunurluklar.length}, minmax(0, 1fr))` }}>
          {m.api.cozunurluklar.map((c) => (
            <button key={c} onClick={() => setCozunurluk(c)} className={cn("relative isolate h-8 rounded-full text-[12.5px] font-semibold transition-colors", cozunurluk === c ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
              {cozunurluk === c && <motion.span layoutId="pd-kalite" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{c}
            </button>
          ))}
        </div>
      )}
    </>
  );
  const kareSecici = KARELER.map((n) => (
    <button key={n} onClick={() => { setKare(n); setAcik(null); }} className={cn("flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors", kare === n ? "bg-white/[0.08]" : "hover:bg-white/[0.05]")}>
      <span className="w-7 text-[15px] font-semibold tabular-nums text-metin">{n}</span>
      <span className="flex-1 text-[12.5px] text-metin-3">{n === 10 ? "Tek gönderi" : n === 15 ? "Dolu bir karusel" : "Tam çekim, seçerek paylaş"}</span>
      {kare === n && <Check className="h-4 w-4 text-metin" />}
    </button>
  ));

  /* ── Komut çubuğu ── */
  const uretDugmesi = (
    <button onClick={uret} disabled={gonderiliyor} aria-disabled={!!eksik}
      className={cn("flex h-14 shrink-0 items-center justify-center gap-2 rounded-[18px] px-6 text-[15.5px] font-semibold transition-[transform,background-color,color] active:scale-[0.98] max-md:w-full",
        eksik ? "bg-white/[0.08] text-metin-3 ring-1 ring-inset ring-white/[0.08]" : "bg-white text-[#0a0a0b]")}>
      {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{kare} kare üret
      {demo ? <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}>Ücretsiz</span>
        : <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}><KrediYildiz className="h-3 w-3" />{krediYaz(birim * kare)}</span>}
    </button>
  );
  const komut = (
    <div className={cn("w-full rounded-[28px] p-3", CAM)}>
      {eksik && <p className="mb-2 flex items-center justify-center gap-1.5 text-[12.5px] text-metin-2"><Info className="h-3.5 w-3.5" />{eksik}</p>}
      <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
        <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", !masaustu && "[&>*:nth-child(-n+2)]:min-w-0 [&>*:nth-child(-n+2)]:flex-1 [&>*:nth-child(-n+2)>button]:w-full [&>button:nth-child(2)]:w-auto")}>
          <KCip buyuk iri etiket="Kişi" deger={kisiAd} vurgu={!kisiHazir} acik={acik === "kisi"} setAcik={(v) => setAcik(v ? "kisi" : null)} genislik={360}
            ikon={kisiAvatar("h-full w-full") ?? (kisi === "karakter" ? <ScanFace className="h-4 w-4" /> : <Camera className="h-4 w-4" />)}>{kisiPaneli}</KCip>
          <button onClick={() => { if (sekme !== "olustur") setSekme("olustur"); setTimeout(() => konseptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
            className="flex h-14 shrink-0 items-center gap-3 rounded-full bg-white/[0.06] pl-2 pr-5 text-[14.5px] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] active:scale-[0.97]">
            <img src={konsept.kapak[0]} alt="" className="h-10 w-10 rounded-full object-cover" />
            <span className="flex flex-col items-start leading-tight"><span className="text-[11.5px] text-metin-3">Konsept</span><span className="whitespace-nowrap font-medium text-metin">{konsept.ad}</span></span>
          </button>
          {masaustu && <>
          <KCip buyuk iri etiket="Kare sayısı" deger={`${kare} kare`} acik={acik === "kare"} setAcik={(v) => setAcik(v ? "kare" : null)} genislik={250}
            ikon={<span className="text-[13px] font-semibold tabular-nums text-metin">{kare}</span>}>
            {kareSecici}
          </KCip>
          <KCip buyuk iri etiket="Biçim" deger={`${oran}${m.api.cozunurluklar.length ? ` · ${cozunurluk}` : ""}`} acik={acik === "bicim"} setAcik={(v) => setAcik(v ? "bicim" : null)} genislik={300}
            ikon={<OranSekli oran={oran} boyut={16} className="text-metin" />}>
            <div className="p-1">{bicimSecici}</div>
          </KCip>
          <button onClick={() => setModelPanel(true)} title="Model"
            className="flex h-14 shrink-0 items-center gap-3 rounded-full bg-white/[0.06] pl-2 pr-5 text-[14.5px] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] active:scale-[0.97]">
            <span className="[&>span]:!h-10 [&>span]:!w-10 [&>span]:!rounded-full"><MarkaKare ad={model} boyut={40} /></span>
            <span className="flex flex-col items-start leading-tight"><span className="text-[11.5px] text-metin-3">Model</span><span className="whitespace-nowrap font-medium text-metin">{model}</span></span>
          </button>
          </>}
          {!masaustu && (
            <button onClick={() => setAyarPanel(true)} aria-label="Ayarlar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08] active:scale-[0.95]"><SlidersHorizontal className="h-[18px] w-[18px]" /></button>
          )}
        </div>
        {uretDugmesi}
      </div>
    </div>
  );

  /* ── Oluştur ── */
  const ornekler = dortlu(konsept);
  const yelpaze = (
    <div className={cn("relative mx-auto", masaustu ? "h-[300px] w-[640px]" : "h-[200px] w-full max-w-[360px]")}>
      {ornekler.map((g, i) => {
        const d = i - 1.5;
        const g0 = masaustu ? { w: 180, h: 250, ara: 125, dy: 14 } : { w: 112, h: 156, ara: 74, dy: 9 };
        return (
          <motion.img key={konseptId + i} src={g} alt="" initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(d) * g0.dy, rotate: d * 8 }}
            transition={{ type: "spring", stiffness: 170, damping: 19, delay: i * 0.05 }} whileHover={{ y: Math.abs(d) * g0.dy - 8 }}
            className="absolute left-1/2 top-0 rounded-[18px] object-cover ring-1 ring-white/15" style={{ width: g0.w, height: g0.h, marginLeft: -g0.w / 2 + d * g0.ara, zIndex: 4 - Math.round(Math.abs(d)) }} />
        );
      })}
      <button onClick={() => setAcik("kisi")} aria-label="Kişiyi değiştir"
        className={cn("group absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/3 rounded-full bg-[#0b0b0c] p-1 transition-transform active:scale-95")}>
        <span className={cn("relative block overflow-hidden rounded-full ring-2", kisiHazir ? "ring-white" : "ring-white/30", masaustu ? "h-[68px] w-[68px]" : "h-14 w-14")}>
          {kisiAvatar("absolute inset-0 h-full w-full") ?? <span className="absolute inset-0 flex items-center justify-center bg-[#1b1c1f] text-metin-2"><Plus className="h-5 w-5" /></span>}
        </span>
      </button>
    </div>
  );
  const olustur = (
    <div>
      <section className="flex flex-col items-center text-center">
        {yelpaze}
        <button onClick={() => setAcik("kisi")} className={cn("mt-8 flex items-center gap-1.5 rounded-full px-3 py-1 text-[13.5px] font-semibold transition-colors hover:bg-white/[0.06]", kisiHazir ? "text-metin" : "text-metin-2")}>
          {kisiHazir ? kisiAd : kisi === "karakter" ? "Karakterini seç" : "Fotoğrafını yükle"}<span className="font-normal text-metin-3">{kisiHazir ? "Değiştir" : ""}</span>
        </button>
        <h1 className={cn("mt-4 font-semibold leading-none tracking-[-0.035em] text-metin", masaustu ? "text-[46px]" : "text-[30px]")}>Aynı yüz, farklı sahneler</h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-metin-2">Karakterini seç, bir konsept seç. Tek tıkla 26 kareye kadar, her karede aynı yüzle bir photodump.</p>
      </section>

      <section ref={konseptRef} className={cn(KART, "mt-10 scroll-mt-4")}>
        <div className={cn(SERIT, "flex-wrap gap-3 py-3")}>
          <Layers className="h-4 w-4 text-metin-2" /><h2 className="mr-auto text-[14px] font-semibold text-metin">Konseptler</h2>
          <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25 max-sm:order-last max-sm:w-full sm:w-[200px]">
            <Search className="h-3.5 w-3.5 shrink-0 text-metin-3" />
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Konsept ara" aria-label="Konsept ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
            {arama && <button onClick={() => setArama("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
          </label>
          <div className="gizli-scroll -mx-1 min-w-0 overflow-x-auto px-1 max-sm:w-full">
            <Kayan id="pd-kat" serbest etiket="Kategori" deger={kat} onDeger={setKat}
              secenekler={[{ v: "Tümü" as Kat, a: "Tümü", n: DUMP_PAKETLERI.length }, ...DUMP_KATEGORILERI.map((k) => ({ v: k as Kat, a: k, n: DUMP_PAKETLERI.filter((p) => p.kat === k).length }))]} />
          </div>
        </div>
        <div className="p-4">
          {liste.length ? (
            <motion.div key={kat + aranan} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {liste.map((p) => <KonseptKarti key={p.id} p={p} secili={konseptId === p.id} onSec={() => { setKonseptId(p.id); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); if (!masaustu) window.scrollTo({ top: 0, behavior: "smooth" }); }} onAyrinti={() => setAyrinti(p.id)} />)}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-5 w-5 text-metin-3" /><p className="text-[14px] font-medium text-metin">“{arama}” için konsept yok</p>
              <button onClick={() => { setArama(""); setKat("Tümü"); }} className="mt-1 h-9 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-metin hover:bg-white/[0.11]">Tüm konseptleri göster</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const setlerGorunumu = aktif ? (
    <DumpSetleri arac={ARAC} setler={setler} aktifId={aktif.id} onAktif={(id) => { setAktifGrup(id); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
      onSilindi={() => setAktifGrup(null)} avatarYedek={kisiAvatar("h-full w-full")}
      metinler={aktifKonsept?.metinler ?? ["bu hafta kamerama ne girdiyse", "küçük bir döküm", "arşivden seçmeler"]} etiketler={aktifKonsept?.etiketler ?? ["photodump"]} />
  ) : (
    <div className={cn(KART, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><GalleryHorizontal className="h-5 w-5" /></span>
      <p className="text-[16px] font-semibold text-metin">Henüz bir photodump'ın yok</p>
      <p className="max-w-[360px] text-[13.5px] text-metin-3">Karakterini ve bir konsept seç; ilk setin birkaç dakikada burada.</p>
      <button onClick={() => setSekme("olustur")} className="mt-2 flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] active:scale-[0.97]">Konsept seç<ArrowRight className="h-4 w-4" /></button>
    </div>
  );

  /* ── Yan paneller ── */
  const ayrintiP = ayrinti ? DUMP_PAKETLERI.find((p) => p.id === ayrinti) : null;
  const modeller = GORSEL_MODELLER.filter((x) => x.api.refMax >= 1 && x.tip !== "swap" && !x.api.refZorunlu && !x.gizli);
  const modelSatiri = (x: (typeof modeller)[number]) => {
    const sec = x.ad === model;
    return (
      <button key={x.ad} onClick={() => { setModel(x.ad); setModelPanel(false); }} aria-pressed={sec}
        className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors active:scale-[0.99]", sec ? "bg-white/[0.08] ring-1 ring-inset ring-white/25" : "hover:bg-white/[0.05]")}>
        <MarkaKare ad={x.ad} boyut={34} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{x.ad}</span><span className="block truncate text-[11.5px] text-metin-3">{x.ozet}</span></span>
        {b.bagli(x) !== false && <KrediHap deger={modelKredi(x)} secili={sec} />}{sec && <Check className="h-4 w-4 shrink-0 text-metin" />}
      </button>
    );
  };
  const katmanlar = (
    <>
      <input ref={fotoRef} type="file" accept={GORSEL_TURLERI.join(",")} hidden onChange={(e) => { void fotoYukle(e.target.files?.[0]); e.target.value = ""; }} />
      <YanPanel acik={!!ayrintiP} onKapat={() => setAyrinti(null)} baslik={ayrintiP?.ad ?? ""}
        alt={ayrintiP && <button onClick={() => { setKonseptId(ayrintiP.id); setAyrinti(null); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[14.5px] font-semibold text-[#0a0a0b] active:scale-[0.98]">Bu konsepti seç<Check className="h-4 w-4" /></button>}>
        {ayrintiP && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2">{ayrintiP.kat}</span><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2">{paketOrnekleri(ayrintiP).length} örnek</span></div>
            <p className="text-[14px] leading-relaxed text-metin-2">{ayrintiP.not}</p>
            <div className="grid grid-cols-2 gap-2">
              {paketOrnekleri(ayrintiP).map((g, i) => <motion.img key={g} src={g} alt="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cn("w-full rounded-[12px] object-cover ring-1 ring-inset ring-white/10", i === 0 ? "col-span-2 aspect-[4/3] object-[center_22%]" : "aspect-[4/5]")} />)}
            </div>
            <p className="text-[12px] text-metin-3">Örnekler konseptin havasını gösterir; senin setin kendi yüzünle üretilir.</p>
          </div>
        )}
      </YanPanel>
      <YanPanel acik={ayarPanel} onKapat={() => setAyarPanel(false)} baslik="Ayarlar">
        <p className="mb-2 text-[12.5px] font-medium text-metin-2">Kare sayısı</p>
        <div className="space-y-1">{kareSecici}</div>
        <p className="mb-2 mt-5 text-[12.5px] font-medium text-metin-2">Biçim</p>
        {bicimSecici}
        <p className="mb-2 mt-5 text-[12.5px] font-medium text-metin-2">Model</p>
        <button onClick={() => { setAyarPanel(false); setModelPanel(true); }} className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.05] p-2 pr-3 text-left ring-1 ring-inset ring-white/[0.08] active:scale-[0.99]">
          <MarkaKare ad={model} boyut={36} /><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{model}</span><span className="block truncate text-[11.5px] text-metin-3">{m.ozet}</span></span><span className="text-[12.5px] font-medium text-metin-2">Değiştir</span>
        </button>
      </YanPanel>
      <YanPanel acik={modelPanel} onKapat={() => setModelPanel(false)} baslik="Model">
        <p className="mb-2 px-1 text-[12.5px] font-medium text-metin-2">Önerilen</p>
        <div className="space-y-1">{modeller.filter((x) => ONERILEN.includes(x.ad)).map(modelSatiri)}</div>
        <p className="mb-2 mt-5 px-1 text-[12.5px] font-medium text-metin-2">Kişi referansı alan diğer modeller</p>
        <div className="space-y-1">{modeller.filter((x) => !ONERILEN.includes(x.ad)).map(modelSatiri)}</div>
      </YanPanel>
    </>
  );

  const ustSerit = (
    <div className="flex items-center gap-3">
      <div className="flex shrink-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Images className="h-4 w-4" strokeWidth={1.8} /></span><span className="leading-tight"><span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Photodump</span><span className="block whitespace-nowrap text-[11.5px] text-metin-2 max-sm:hidden">Aynı yüz, farklı sahneler</span></span></div>
      <div className="flex flex-1 justify-center max-sm:justify-end">
        <Kayan id="pd-sekme" etiket="Görünüm" deger={sekme} onDeger={setSekme} secenekler={[{ v: "olustur", a: "Oluştur" }, { v: "setler", a: "Setlerim", n: setler.length || undefined }]} />
      </div>
      {surenSayi > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2" aria-live="polite"><Loader2 className="h-3.5 w-3.5 animate-spin" />{surenSayi} kare</span>}
    </div>
  );

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="dump-kapsam flex min-h-[100dvh] flex-col overflow-x-clip bg-[#0b0b0c]" data-kendi-kisayol>
        <header className="sticky top-0 z-30 bg-[#0b0b0c]/95 px-3 py-2.5 backdrop-blur-md">{ustSerit}</header>
        <div ref={anaRef} className="flex-1 px-3 pb-6 pt-4">{sekme === "olustur" ? olustur : setlerGorunumu}</div>
        {sekme === "olustur" && <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komut}</div>}
        {katmanlar}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="dump-kapsam flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0b0b0c]" data-kendi-kisayol>
      <header className="z-20 shrink-0 border-b border-white/[0.06] bg-[#0b0b0c]/95 px-5 py-2.5 backdrop-blur-md">{ustSerit}</header>
      <div className="relative min-h-0 flex-1">
        <main ref={anaRef} className="h-full overflow-y-auto [scrollbar-width:thin]">
          <AnimatePresence mode="wait">
            <motion.div key={sekme} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn("mx-auto max-w-[1240px] px-8 pt-10", sekme === "olustur" ? "pb-44" : "pb-12")}>{sekme === "olustur" ? olustur : setlerGorunumu}</motion.div>
          </AnimatePresence>
        </main>
        {sekme === "olustur" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-6">
            <div className="pointer-events-auto w-full max-w-[1180px]">{komut}</div>
          </div>
        )}
      </div>
      {katmanlar}
    </div>
  );
}
