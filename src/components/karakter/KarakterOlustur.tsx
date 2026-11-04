"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign, Check, X, Loader2, Upload, Star, Zap, GraduationCap, AlertTriangle, ChevronLeft, ChevronDown, Sun, Focus, Ruler, Images, Plus, RotateCcw, ScanFace, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useElements } from "@/store/useElements";
import { adHatasi, adTemizle, AD_MAX } from "@/lib/elementCekirdek";
import { dosyaOku, gorselOlcu, gorselYukle, GORSEL_TURLERI } from "@/components/arac/kit";
import { KARAKTER_MAKS, YUVALAR, icerikOzeti } from "./ortak";
import { EGITIM_KREDI } from "./DerinEgitim";

type Analiz = { isik: number; netlik: number };
type Foto = { id: string; url: string; durum: "yukleniyor" | "hazir" | "hata"; w: number; h: number; ozet?: string; hata?: string; analiz?: Analiz };
const yeniId = () => Math.random().toString(36).slice(2, 9);
/** Her açı için örnek kare (farklı kişiler; yalnız kadrajı gösterir). */
const ACI_ORNEK: { src: string; konum: string }[] = [
  { src: "/gercek/kabuk/kadro-koken-asyali.webp", konum: "50% 30%" },
  { src: "/gercek/galeri/portre1.webp", konum: "45% 30%" },
  { src: "/gercek/galeri/portre12.webp", konum: "50% 30%" },
  { src: "/gercek/galeri/portre10.webp", konum: "50% 40%" },
  { src: "/gercek/influencer/kart-Lyric.webp", konum: "50% 50%" },
];
const TARIF_GRUP: [string, string[]][] = [
  ["Yaş ve yapı", ["20'li yaşlarda", "30'lu yaşlarda", "ince yapılı", "atletik"]],
  ["Saç", ["dalgalı kahverengi saç", "kısa siyah saç", "uzun sarı saç", "kızıl saç"]],
  ["Yüz", ["yeşil gözlü", "çilli", "kısa sakallı", "belirgin elmacık"]],
  ["Ayırt edici", ["gözlüklü", "sol kaşında küçük iz", "küpeli", "dövmeli"]],
];

/**
 * Tarayıcıda hızlı fotoğraf ölçümü: ortalama parlaklık (0–255) ve Laplace varyansıyla netlik.
 * Görsel 256 px'e küçültülür; sonuç kaba bir işarettir, yüz tanıma yapılmaz.
 */
async function fotoAnaliz(url: string): Promise<Analiz | undefined> {
  const im = await new Promise<HTMLImageElement | null>((coz) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => coz(i); i.onerror = () => coz(null); i.src = url; });
  if (!im) return undefined;
  const k = Math.min(1, 256 / Math.max(im.naturalWidth, im.naturalHeight));
  const w = Math.max(8, Math.round(im.naturalWidth * k)), h = Math.max(8, Math.round(im.naturalHeight * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return undefined;
  x.drawImage(im, 0, 0, w, h);
  let d: Uint8ClampedArray;
  try { d = x.getImageData(0, 0, w, h).data; } catch { return undefined; }
  const g = new Float32Array(w * h);
  let top = 0;
  for (let i = 0; i < w * h; i++) { const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; g[i] = v; top += v; }
  let s = 0, s2 = 0, n = 0;
  for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
    const i = yy * w + xx;
    const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
    s += l; s2 += l * l; n++;
  }
  const ort = s / n;
  return { isik: top / (w * h), netlik: s2 / n - ort * ort };
}
const netlikDerece = (a?: Analiz) => !a ? null : a.netlik < 60 ? "bulanik" : a.netlik < 150 ? "orta" : "iyi";
const isikDerece = (a?: Analiz) => !a ? null : a.isik < 64 ? "karanlik" : a.isik > 215 ? "parlak" : "iyi";

/** Karakter oluşturucu ve düzenleyici (?id=). Fotoğraflar seçildiği anda sunucu deposuna yüklenir. */
export function KarakterOlustur() {
  const router = useRouter();
  const ara = useSearchParams();
  const duzenId = ara.get("id");
  const marka = ara.get("amac") === "marka";
  const masaustu = useMasaustu();
  const tum = useElements((s) => s.elementler);
  const mevcut = duzenId ? tum.find((e) => e.id === duzenId) : undefined;
  const [fotolar, setFotolar] = useState<Foto[]>([]);
  const [ad, setAd] = useState("");
  const [tarif, setTarif] = useState("");
  const [izin, setIzin] = useState(false);
  const [derin, setDerin] = useState(false);
  const [suruklenen, setSuruklenen] = useState<number | null>(null);
  const [panoUstunde, setPanoUstunde] = useState(false);
  const [hedef, setHedef] = useState<number | null>(null);
  const [rehberAcik, setRehberAcik] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const hedefYuva = useRef<number | null>(null);
  const yuklendi = useRef(false);

  const analizEt = (id: string, url: string) => void fotoAnaliz(url).then((a) => a && setFotolar((l) => l.map((f) => (f.id === id ? { ...f, analiz: a } : f))));

  // Düzenleme: mevcut karakteri forma al (bir kez).
  useEffect(() => {
    if (!mevcut || yuklendi.current) return;
    yuklendi.current = true;
    setAd(mevcut.ad); setTarif(mevcut.aciklama); setIzin(true);
    const l: Foto[] = mevcut.gorseller.filter(Boolean).slice(0, KARAKTER_MAKS).map((url) => ({ id: yeniId(), url, durum: "hazir", w: 0, h: 0 }));
    setFotolar(l);
    l.forEach((f) => { void gorselOlcu(f.url).then(({ w, h }) => setFotolar((x) => x.map((y) => (y.id === f.id ? { ...y, w, h } : y)))); analizEt(f.id, f.url); });
  }, [mevcut]); // eslint-disable-line react-hooks/exhaustive-deps

  const digerAdlar = tum.filter((e) => e.id !== duzenId).map((e) => e.ad);
  const adHata = ad ? adHatasi(ad, digerAdlar) : null;
  const hazirlar = fotolar.filter((f) => f.durum === "hazir");
  const yukleniyor = fotolar.some((f) => f.durum === "yukleniyor");

  const ekle = useCallback(async (dosyalar: File[], yuva?: number) => {
    const uygun = dosyalar.filter((d) => GORSEL_TURLERI.includes(d.type));
    if (!uygun.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    let yer = KARAKTER_MAKS - fotolar.length + (yuva !== undefined && fotolar[yuva] ? 1 : 0);
    if (yer <= 0) return void toast.error("Fotoğraf sınırı doldu", { description: `Karakter başına en çok ${KARAKTER_MAKS} fotoğraf eklenebilir. Önce bir fotoğrafı kaldır.` });
    if (uygun.length > yer) toast.warning(`Yalnızca ilk ${yer} fotoğraf eklendi`, { description: `Karakter başına en çok ${KARAKTER_MAKS} fotoğraf modele gider. Fazlası eklenmedi.` });
    const gorulen = new Set(fotolar.map((f) => f.ozet).filter(Boolean));
    for (const d of uygun.slice(0, yer)) {
      if (d.size > 12 * 1024 * 1024) { toast.error(`${d.name} çok büyük`, { description: "En çok 12 MB yükleyebilirsin. Daha küçük bir dosya seç." }); continue; }
      const ozet = await icerikOzeti(d);
      if (gorulen.has(ozet)) { toast.warning("Bu fotoğraf zaten ekli", { description: `${d.name} ikinci kez eklenmedi.` }); continue; }
      gorulen.add(ozet);
      const dataUrl = await dosyaOku(d);
      const id = yeniId();
      const { w, h } = await gorselOlcu(dataUrl);
      const foto: Foto = { id, url: dataUrl, durum: "yukleniyor", w, h, ozet };
      setFotolar((l) => {
        if (yuva !== undefined && l[yuva]) { const k = [...l]; k[yuva] = foto; return k; }
        return [...l, foto].slice(0, KARAKTER_MAKS);
      });
      analizEt(id, dataUrl);
      yuva = undefined; yer--;
      gorselYukle(dataUrl, "/api/element/gorsel")
        .then((url) => setFotolar((l) => l.map((f) => (f.id === id ? { ...f, url, durum: "hazir" } : f))))
        .catch((e: Error) => setFotolar((l) => l.map((f) => (f.id === id ? { ...f, durum: "hata", hata: e.message } : f))));
    }
  }, [fotolar]);

  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const l = [...(e.clipboardData?.files ?? [])].filter((x) => GORSEL_TURLERI.includes(x.type));
      if (l.length) { e.preventDefault(); void ekle(l); }
    };
    window.addEventListener("paste", f);
    return () => window.removeEventListener("paste", f);
  }, [ekle]);

  const kaldir = (id: string) => setFotolar((l) => l.filter((f) => f.id !== id));
  const kapakYap = (i: number) => setFotolar((l) => [l[i], ...l.filter((_, j) => j !== i)]);
  const tasi = (from: number, to: number) => setFotolar((l) => { if (!l[from] || !l[to]) return l; const k = [...l]; [k[from], k[to]] = [k[to], k[from]]; return k; });
  const sec = (yuva: number | null) => { hedefYuva.current = yuva; dosyaRef.current?.click(); };

  const eksik = !hazirlar.length ? "En az bir fotoğraf ekle"
    : yukleniyor ? "Fotoğraflar yükleniyor"
    : fotolar.some((f) => f.durum === "hata") ? "Yüklenemeyen fotoğrafı kaldır ya da yeniden dene"
    : !ad ? "Karaktere bir ad ver"
    : adHata ? adHata
    : !izin ? "İzin onayını işaretle"
    : null;

  const kaydet = () => {
    if (eksik) return void toast.error("Karakter henüz kaydedilemez", { description: `${eksik}.` });
    const gorseller = hazirlar.map((f) => f.url);
    const st = useElements.getState();
    if (mevcut) {
      const r = st.guncelle(mevcut.id, { ad, aciklama: tarif.trim(), gorseller, ornek: mevcut.ornek && gorseller.every((g) => mevcut.gorseller.includes(g)) ? true : undefined });
      if (r.hata) return void toast.error("Karakter güncellenemedi", { description: r.hata });
      toast.success(`@${ad} güncellendi`);
      return router.push(`/panel/karakter/${mevcut.id}${derin ? "?egit=1" : ""}`);
    }
    const r = st.ekle({ ad, tur: "karakter", aciklama: tarif.trim(), gorseller, tohum: `kar-${ad.toLocaleLowerCase("tr")}` });
    if (!r.id) return void toast.error("Karakter kaydedilemedi", { description: r.hata ?? "Tarayıcı deposu dolu ya da kapalı olabilir. Sayfayı yenileyip yeniden dene." });
    toast.success(`@${ad} hazır`, { description: `Tüm görsel modellerinde istemine @${ad} yazarak kullanabilirsin.` });
    router.push(`/panel/karakter/${r.id}${derin ? "?egit=1" : ""}`);
  };

  /* ── Hazırlık ölçümü ── */
  const n = fotolar.filter((f) => f.durum !== "hata").length;
  const olculen = fotolar.filter((f) => f.analiz);
  const kisa = fotolar.filter((f) => f.durum !== "hata" && f.w).map((f) => Math.min(f.w, f.h));
  const ortKisa = kisa.length ? Math.round(kisa.reduce((a, b) => a + b, 0) / kisa.length) : 0;
  const bulanik = olculen.filter((f) => netlikDerece(f.analiz) === "bulanik").length;
  const isikSorun = olculen.filter((f) => isikDerece(f.analiz) !== "iyi").length;
  const kontroller: { ad: string; ikon: typeof Sun; durum: "iyi" | "uyari" | "bos"; metin: string }[] = [
    { ad: "Fotoğraf sayısı", ikon: Images, durum: n === 0 ? "bos" : n >= 3 ? "iyi" : "uyari", metin: n === 0 ? "Henüz yok" : n >= 3 ? `${n} · yeterli` : `${n} · 3+ önerilir` },
    { ad: "Çözünürlük", ikon: Ruler, durum: !ortKisa ? "bos" : ortKisa >= 768 ? "iyi" : "uyari", metin: !ortKisa ? "Bekleniyor" : `${ortKisa} px${ortKisa < 768 ? " · düşük" : " · iyi"}` },
    { ad: "Netlik", ikon: Focus, durum: !olculen.length ? "bos" : bulanik ? "uyari" : "iyi", metin: !olculen.length ? "Bekleniyor" : bulanik ? `${bulanik} bulanık` : "Net görünüyor" },
    { ad: "Işık", ikon: Sun, durum: !olculen.length ? "bos" : isikSorun ? "uyari" : "iyi", metin: !olculen.length ? "Bekleniyor" : isikSorun ? `${isikSorun} karanlık ya da parlak` : "Dengeli" },
  ];
  const puan = n === 0 ? 0 : Math.round(Math.min(1, n / 4) * 40 + (ortKisa ? Math.min(1, ortKisa / 1024) * 20 : 0) + (olculen.length ? (1 - bulanik / olculen.length) * 25 : 0) + (olculen.length ? (1 - isikSorun / olculen.length) * 15 : 0));
  const puanAd = puan === 0 ? "Fotoğraf bekleniyor" : puan >= 85 ? "Çok iyi" : puan >= 65 ? "İyi" : puan >= 40 ? "Geliştirilebilir" : "Zayıf";

  /* ── Fotoğraf yuvası ── */
  const sonrakiYuva = fotolar.length < KARAKTER_MAKS ? fotolar.length : -1;
  const yuva = (i: number, kompakt = false) => {
    const y = YUVALAR[i];
    const f = fotolar[i];
    const sira = sonrakiYuva === i;
    const net = netlikDerece(f?.analiz), isik = isikDerece(f?.analiz);
    const kisaKenar = f && f.w ? Math.min(f.w, f.h) : 0;
    const uyari = net === "bulanik" || (isik && isik !== "iyi") || (kisaKenar > 0 && kisaKenar < 512);
    return (
      <div key={y.ad} className={cn("relative", kompakt && "w-[112px] shrink-0")}
        draggable={!!f} onDragStart={() => setSuruklenen(i)} onDragEnd={() => { setSuruklenen(null); setHedef(null); }}
        onDragOver={(e) => { e.preventDefault(); setHedef(i); }} onDragLeave={() => setHedef((h) => (h === i ? null : h))}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setHedef(null); setPanoUstunde(false); if (suruklenen !== null && f) { tasi(suruklenen, i); setSuruklenen(null); } else if (e.dataTransfer.files.length) void ekle([...e.dataTransfer.files], i); }}>
        {f ? (
          <div className={cn("group relative aspect-[3/4] overflow-hidden rounded-[16px] bg-white/[0.04] ring-1 ring-inset transition-all duration-300",
            f.durum === "hata" ? "ring-rose-400/60" : hedef === i ? "ring-2 ring-white" : "ring-white/[0.1]", suruklenen === i && "scale-95 opacity-40")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt={y.ad} draggable={false} className={cn("absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.04]", f.durum === "yukleniyor" && "opacity-40")} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            {f.durum === "yukleniyor" && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></span>}
            {f.durum === "hata" && <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-[10px] bg-black/75 p-2 text-center text-[11px] text-rose-200 backdrop-blur"><AlertTriangle className="mx-auto mb-1 h-4 w-4" />{f.hata ?? "Yüklenemedi"}</span>}
            {i === 0 && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#0a0a0b]"><Star className="h-2.5 w-2.5 fill-current" />Kapak</span>}
            {i > 0 && uyari && f.durum !== "hata" && <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-[#1a1203]" title="Kaliteyi düşürebilir"><AlertTriangle className="h-3.5 w-3.5" /></span>}
            <button onClick={() => kaldir(f.id)} aria-label={`${y.ad} fotoğrafını kaldır`} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity hover:bg-rose-500/80 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="h-3.5 w-3.5" /></button>
            {i > 0 && f.durum === "hazir" && !kompakt && (
              <button onClick={() => kapakYap(i)} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#0a0a0b] opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:hidden"><Star className="h-3 w-3" />Kapak yap</button>
            )}
            <span className="absolute inset-x-2 bottom-2">
              <span className="block truncate text-[12px] font-semibold text-white">{y.ad}</span>
              <span className={cn("mt-0.5 block truncate text-[10.5px] tabular-nums", uyari ? "text-amber-200" : "text-white/65")}>
                {f.durum === "yukleniyor" ? "Yükleniyor" : net === "bulanik" ? "Bulanık görünüyor" : isik === "karanlik" ? "Çok karanlık" : isik === "parlak" ? "Çok parlak" : kisaKenar > 0 && kisaKenar < 512 ? `Düşük · ${kisaKenar} px` : kisaKenar > 0 ? `${kisaKenar} px${net ? " · net" : ""}` : ""}
              </span>
            </span>
          </div>
        ) : (
          <button onClick={() => sec(i)} title={y.ipucu}
            className={cn("group relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] text-left ring-1 ring-inset transition-all duration-300",
              hedef === i ? "ring-2 ring-white" : sira ? "ring-white/40 hover:ring-white" : "ring-white/[0.08] hover:ring-white/20")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ACI_ORNEK[i].src} alt="" loading="lazy" draggable={false} style={{ objectPosition: ACI_ORNEK[i].konum }}
              className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-70 group-hover:grayscale-0",
                sira ? "opacity-55 grayscale-[0.4]" : "opacity-30 grayscale")} />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/40 to-[#0b0b0c]/10" />
            {/* Kadraj köşeleri */}
            <span className={cn("pointer-events-none absolute inset-3 transition-colors duration-300", sira ? "text-white/80" : "text-white/25 group-hover:text-white/50")}>
              {["left-0 top-0 border-l border-t rounded-tl-[6px]", "right-0 top-0 border-r border-t rounded-tr-[6px]", "bottom-0 left-0 border-b border-l rounded-bl-[6px]", "bottom-0 right-0 border-b border-r rounded-br-[6px]"].map((k) => (
                <span key={k} className={cn("absolute h-3.5 w-3.5 border-current", k)} />
              ))}
            </span>
            <span className="absolute left-3.5 top-3 text-[10.5px] font-semibold tabular-nums text-white/60">{i + 1}</span>
            {sira && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0a0a0b] transition-transform group-hover:scale-110"><Plus className="h-3.5 w-3.5" strokeWidth={2.6} /></span>}
            <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
              <span className="block text-[12.5px] font-semibold text-white">{y.ad}</span>
              {!kompakt && <span className="block truncate text-[11px] text-white/55">{y.ipucu}</span>}
            </span>
          </button>
        )}
      </div>
    );
  };

  /* ── Fotoğraf rehberi ── */
  const rehber = (
    <div className="mt-4 overflow-hidden rounded-[16px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
      <button onClick={() => setRehberAcik((v) => !v)} aria-expanded={rehberAcik} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.02]">
        <span className="flex -space-x-2">
          {["/gercek/kabuk/ornek-iyi.webp", "/gercek/gorsel/gorsel-karakter-Kai.webp", "/gercek/kabuk/ornek-kotu.webp"].map((g) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0f0f11]" />))}
        </span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-semibold text-metin">Hangi fotoğraflar işe yarar?</span><span className="block text-[11.5px] text-metin-3">Az ama temiz bir set, çok ama tutarsız bir setten iyidir</span></span>
        <ChevronDown className={cn("h-4 w-4 text-metin-3 transition-transform duration-300", rehberAcik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {rehberAcik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-white/[0.06] p-3.5 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" />Böyle olsun</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {([["/gercek/kabuk/ornek-iyi.webp", "Net yüz"], ["/gercek/kabuk/auth-kimlik-portre-tutarli.webp", "Doğal ışık"], ["/gercek/gorsel/gorsel-karakter-Emma.webp", "Tek kişi"], ["/gercek/gorsel/gorsel-karakter-Kai.webp", "Göz hizası"]] as const).map(([g, a]) => (
                    <figure key={a}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-[9px] object-cover object-top ring-1 ring-inset ring-emerald-400/30" />
                      <figcaption className="mt-1 text-center text-[11px] text-metin-2">{a}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-rose-300"><X className="h-3.5 w-3.5" />Bunlardan kaçın</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    ["Karanlık", <img key="a" src="/gercek/kabuk/ornek-kotu.webp" alt="" className="aspect-[3/4] w-full object-cover" />],
                    ["Bulanık", <img key="b" src="/gercek/kabuk/ornek-iyi.webp" alt="" className="aspect-[3/4] w-full object-cover object-top blur-[3px]" />],
                    ["Kırpık yüz", <img key="c" src="/gercek/gorsel/gorsel-karakter-Emma.webp" alt="" className="aspect-[3/4] w-full scale-[2.4] object-cover [object-position:50%_20%]" style={{ transformOrigin: "30% 10%" }} />],
                    ["Kalabalık", <span key="d" className="flex aspect-[3/4] w-full">{["Kai", "Leo"].map((k) => <img key={k} src={`/gercek/gorsel/gorsel-karakter-${k}.webp`} alt="" className="h-full w-1/2 object-cover" />)}</span>],
                  ] as const).map(([a, g]) => (
                    <figure key={a}>
                      <span className="block overflow-hidden rounded-[9px] ring-1 ring-inset ring-rose-400/30">{g}</span>
                      <figcaption className="mt-1 text-center text-[11px] text-metin-2">{a}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <p className="text-[11.5px] leading-snug text-metin-3 sm:col-span-2">Güneş gözlüğü, şapka, maske, ağır filtre ve uzak çekimler de benzerliği düşürür.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── Adımlar ── */
  const adim = (no: number, baslik: string, alt: string, tamam: boolean, icerik: React.ReactNode, son = false, sag?: React.ReactNode) => (
    <section className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors duration-300", tamam ? "bg-white text-black" : "bg-white/[0.06] text-metin-2 ring-1 ring-inset ring-white/[0.1]")}>
          {tamam ? <Check className="h-4 w-4" strokeWidth={3} /> : no}
        </span>
        {!son && <span className={cn("mt-2 w-px flex-1 transition-colors duration-300", tamam ? "bg-white/40" : "bg-white/[0.08]")} />}
      </div>
      <div className={cn("min-w-0", !son && "pb-6")}>
        <div className="overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]">
          <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
            <div className="min-w-0 flex-1 leading-tight"><h2 className="text-[15px] font-semibold text-metin">{baslik}</h2><p className="text-[12.5px] text-metin-2">{alt}</p></div>
            {sag}
          </div>
          <div className="p-3.5">{icerik}</div>
        </div>
      </div>
    </section>
  );

  const fotoAdim = (
    <>
      <div className={cn("grid grid-cols-5 gap-2.5 rounded-[20px] transition-shadow", panoUstunde && "ring-2 ring-white/70 ring-offset-4 ring-offset-[#0b0b0c]")}>
        {YUVALAR.map((_, i) => yuva(i))}
      </div>
      <button onClick={() => sec(null)} disabled={fotolar.length >= KARAKTER_MAKS}
        className={cn("mt-2.5 flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-dashed text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          panoUstunde ? "border-white/70 bg-white/[0.06] text-metin" : "border-white/[0.12] text-metin-3 hover:border-white/25 hover:text-metin-2")}>
        <Upload className="h-4 w-4" />
        {fotolar.length >= KARAKTER_MAKS ? "5 fotoğraf eklendi" : <>Birden çok fotoğrafı buraya bırak ya da <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#0a0a0b]">Seç</span><span className="hidden items-center gap-1 lg:flex">· <kbd>Ctrl</kbd><kbd>V</kbd></span></>}
      </button>
      {rehber}
    </>
  );

  const kapakFoto = hazirlar[0]?.url ?? fotolar[0]?.url;
  const kimlikAdim = (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-[18px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
          <AtSign className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Ad</span>
          <span className="ml-auto text-[11.5px] tabular-nums text-metin-3">{ad.length}/{AD_MAX}</span>
        </div>
        <div className="p-3">
          <label className={cn("flex h-16 items-center gap-3 rounded-[16px] bg-white/[0.04] pl-2 pr-3 ring-1 ring-inset transition-shadow", adHata ? "ring-rose-400/50" : "ring-white/[0.08] focus-within:ring-white/45")}>
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/[0.06] text-metin-2">
              {kapakFoto ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kapakFoto} alt="" className="h-full w-full object-cover" />) : <ScanFace className="h-5 w-5" />}
            </span>
            <span className="text-[22px] font-semibold text-metin-3">@</span>
            <input value={ad} onChange={(e) => setAd(adTemizle(e.target.value))} placeholder={marka ? "MarkaYuzu" : "Zeynep"} aria-label="Karakter adı" spellCheck={false} maxLength={AD_MAX}
              className="-ml-2 min-w-0 flex-1 bg-transparent text-[22px] font-semibold tracking-[-0.01em] text-metin outline-none placeholder:font-normal placeholder:text-metin-3/60" />
            <AnimatePresence>
              {ad && !adHata && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[12px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Uygun
                </motion.span>
              )}
            </AnimatePresence>
          </label>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={adHata ? "h" : ad ? "o" : "b"} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className={cn("mt-2.5 flex flex-wrap items-center gap-1.5 text-[12.5px]", adHata ? "text-rose-300" : "text-metin-2")}>
              {adHata ?? (ad ? <>İstemde böyle görünür:<span className="flex items-center gap-1 rounded-full bg-white/[0.08] py-0.5 pl-0.5 pr-2 font-semibold text-metin">{kapakFoto && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kapakFoto} alt="" className="h-5 w-5 rounded-full object-cover" />)}@{ad}</span>kafede kitap okuyor</> : "Harf, rakam ve alt çizgi. İstemde @ ile çağırırsın.")}
            </motion.p>
          </AnimatePresence>
        </div>
      </section>
      <section className="overflow-hidden rounded-[18px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
          <Pencil className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Tarif</span>
          <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-metin-2">İsteğe bağlı</span>
          <span className="ml-auto text-[11.5px] tabular-nums text-metin-3">{tarif.length}/200</span>
        </div>
        <div className="p-3">
          <textarea value={tarif} onChange={(e) => setTarif(e.target.value.slice(0, 200))} rows={2} aria-label="Tarif" spellCheck={false}
            placeholder={marka ? "Ör. 30'larında, kısa kahverengi saçlı; sıcak ve güven veren kampanya yüzü" : "Ör. 25 yaşında, dalgalı kahverengi saçlı, çilli; sol kaşında küçük iz"}
            className="block min-h-[84px] w-full resize-none rounded-[14px] bg-white/[0.04] p-3.5 text-[14.5px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3/70 focus:ring-white/45" />
          <p className="mt-2.5 text-[12px] text-metin-3">Fotoğrafta görünmeyen ya da modelin kaçırdığı ayrıntıları yaz. Dokununca eklenir:</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {TARIF_GRUP.map(([grup, l], gi) => (
              <motion.div key={grup} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * gi }} className="rounded-[14px] bg-white/[0.02] p-2 ring-1 ring-inset ring-white/[0.05]">
                <p className="px-1 pb-1.5 text-[11.5px] font-medium text-metin-3">{grup}</p>
                <div className="flex flex-wrap gap-1">
                  {l.map((t) => {
                    const var_ = tarif.toLocaleLowerCase("tr").includes(t.toLocaleLowerCase("tr"));
                    return (
                      <button key={t} disabled={var_} aria-pressed={var_} onClick={() => setTarif((x) => (x.trim() ? `${x.trim().replace(/[,;]$/, "")}, ${t}` : t).slice(0, 200))}
                        className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] ring-1 ring-inset transition-colors active:scale-95", var_ ? "bg-white/[0.1] text-metin ring-white/40" : "bg-white/[0.04] text-metin-2 ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
                        {!var_ && <Plus className="h-3 w-3" />}{t}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const yontemAdim = (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {([
        [false, Zap, "Anında referans", "Fotoğrafların her üretimde kimlik olarak modele gider. Beklemeden başlarsın.", [["Hazır", "Hemen"], ["Ücret", "Ücretsiz"], ["Fotoğraf", `1–${KARAKTER_MAKS}`]], ["Nano Banana, Seedream, GPT Image ile çalışır", "Fotoğrafı istediğin an değiştirirsin", "Görsel ve video stüdyolarında @ ile çağrılır"]],
        [true, GraduationCap, "Anında + derin eğitim", "Karakterine özel bir FLUX LoRA eğitilir. Yüz ve vücut her açıda daha tutarlı olur.", [["Hazır", "3–8 dk"], ["Ücret", `${EGITIM_KREDI} kredi`], ["Fotoğraf", "5–20"]], ["Eğitim sürerken referansla üretmeye devam edersin", "Zor açı ve ifadelerde daha yüksek benzerlik", "Kredi yalnız eğitimi başlattığında düşer"]],
      ] as const).map(([k, I, a, alt, l, maddeler], j) => {
        const sec = derin === k;
        return (
          <motion.button key={a} onClick={() => setDerin(k)} aria-pressed={sec} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * j }} whileTap={{ scale: 0.99 }}
            className={cn("flex flex-col rounded-[18px] p-4 text-left ring-1 ring-inset transition-[background-color,box-shadow] duration-300", sec ? "bg-white/[0.06] ring-white/70" : "bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.04] hover:ring-white/20")}>
            <span className="flex items-center gap-3">
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition-colors", sec ? "bg-white text-black" : "bg-white/[0.06] text-metin-2")}><I className="h-5 w-5" /></span>
              <span className="min-w-0 leading-tight"><span className="block text-[15px] font-semibold text-metin">{a}</span><span className="mt-0.5 block text-[12px] text-metin-3">{k ? "Önerilen: sürekli kullanacağın karakter" : "Önerilen: hızlı deneme"}</span></span>
            </span>
            <span className="mt-3 text-[13px] leading-relaxed text-metin-2">{alt}</span>
            <span className="mt-3.5 grid grid-cols-3 gap-2 rounded-[12px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.05]">
              {l.map(([x, v]) => <span key={x} className="leading-tight"><span className="block text-[11px] text-metin-3">{x}</span><span className="mt-0.5 block text-[13.5px] font-semibold tabular-nums text-metin">{v}</span></span>)}
            </span>
            <span className="mt-3.5 space-y-2">
              {maddeler.map((m) => <span key={m} className="flex items-start gap-2 text-[12.5px] leading-snug text-metin-2"><span className={cn("mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full", sec ? "bg-white" : "bg-white/30")} />{m}</span>)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );

  const izinKutusu = (
    <div onClick={() => setIzin((v) => !v)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setIzin((v) => !v); } }} role="checkbox" aria-checked={izin} tabIndex={0}
      className={cn("flex w-full cursor-pointer items-start gap-3 rounded-[14px] p-3.5 text-left outline-none ring-1 ring-inset transition-colors duration-300 focus-visible:ring-white/50", izin ? "bg-white/[0.05] ring-white/60" : "bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.04]")}>
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] ring-1 ring-inset transition-colors", izin ? "bg-white text-black ring-white" : "ring-white/30")}>{izin && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
      <span className="text-[13px] leading-relaxed text-metin-2">
        <Link href="/kimlik-kosullari" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="font-semibold text-metin underline decoration-white/30 underline-offset-[3px] transition-colors hover:decoration-white">Kimlik ve Benzerlik Kullanım Koşulları</Link>
        &apos;nı okudum, onaylıyorum ve kabul ediyorum; rızam var.
      </span>
    </div>
  );

  /* ── Canlı karakter kartı ── */
  const kapak = hazirlar[0] ?? fotolar[0];
  const digerleri = fotolar.slice(1);
  const canliKart = (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-[#111113]">
      <AnimatePresence mode="wait">
        {kapak ? (
          <motion.img key={kapak.id} src={kapak.url} alt="" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
            className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <motion.span key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(120%_80%_at_50%_30%,rgba(255,255,255,0.06),transparent_70%)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><ScanFace className="h-5 w-5" /></span>
            <span className="text-[12.5px] text-metin-3">İlk fotoğraf kapak olur</span>
          </motion.span>
        )}
      </AnimatePresence>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
      <span className="absolute inset-x-3.5 bottom-3.5">
        <span className={cn("block truncate text-[24px] font-semibold tracking-[-0.02em]", ad ? "text-white" : "text-white/40")}>@{ad || (marka ? "MarkaYuzu" : "Ad")}</span>
        <span className={cn("mt-0.5 block text-[12.5px] leading-snug", tarif ? "text-white/75" : "text-white/40")}>{tarif || "Tarif eklersen burada görünür"}</span>
      </span>
    </div>
  );
  const ozetSatirlari: [React.ElementType, string, string][] = [
    [Images, "Fotoğraf", `${n}/${KARAKTER_MAKS}`],
    [derin ? GraduationCap : Zap, "Yöntem", derin ? "Anında + LoRA" : "Anında referans"],
  ];

  const hazirlik = (
    <div className="border-t border-white/[0.06]">
      <div className="flex items-center gap-3 px-3.5 pb-2 pt-3">
        <PuanHalkasi deger={puan} />
        <span className="min-w-0 leading-tight">
          <span className="block text-[13.5px] font-semibold text-metin">Hazırlık · {puanAd}</span>
          <span className="mt-0.5 block text-[11.5px] text-metin-3">Tarayıcıda ölçülür, yüz tanıma yapılmaz</span>
        </span>
      </div>
      <ul className="divide-y divide-white/[0.05] px-3.5 pb-1">
        {kontroller.map((k, i) => (
          <motion.li key={k.ad} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }} className="flex items-center gap-2.5 py-2">
            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", k.durum === "iyi" ? "bg-emerald-400/15 text-emerald-300" : k.durum === "uyari" ? "bg-amber-300/15 text-amber-200" : "bg-white/[0.06] text-metin-3")}>
              {k.durum === "iyi" ? <Check className="h-3 w-3" strokeWidth={3} /> : k.durum === "uyari" ? <AlertTriangle className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <span className="flex-1 text-[12.5px] font-medium text-metin">{k.ad}</span>
            <span className="text-right text-[12px] text-metin-2">{k.metin}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );

  const kaydetDugmesi = (
    <button onClick={kaydet} title={eksik ?? undefined}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
      <Check className="h-4 w-4" strokeWidth={2.6} />{mevcut ? "Değişiklikleri kaydet" : "Karakteri kaydet"}
      <span className="rounded-full bg-black/10 px-2.5 py-1 text-[12px] leading-none">Ücretsiz</span>
    </button>
  );

  const dosyaGirdisi = <input ref={dosyaRef} type="file" accept={GORSEL_TURLERI.join(",")} multiple hidden onChange={(e) => { void ekle([...(e.target.files ?? [])], hedefYuva.current ?? undefined); hedefYuva.current = null; e.target.value = ""; }} />;
  const geri = () => router.push(mevcut ? `/panel/karakter/${mevcut.id}` : "/panel/karakter");
  const fotoSag = (
    <div className="flex items-center gap-1.5">
      {fotolar.length > 0 && <button onClick={() => setFotolar([])} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-metin-3 transition-colors hover:bg-white/[0.05] hover:text-metin"><RotateCcw className="h-3.5 w-3.5" />Temizle</button>}
      <span className="text-[13px] font-medium tabular-nums text-metin-2">{n}<span className="text-metin-3">/{KARAKTER_MAKS}</span></span>
    </div>
  );
  const adimlar = (
    <>
      {adim(1, "Fotoğraflar", "Farklı açılar tutarlılığı artırır · sürükleyerek sırala, ilki kapak olur", n > 0, fotoAdim, false, fotoSag)}
      {adim(2, "Kimlik", "İstemde çağıracağın ad ve modele giden kısa tarif", !!ad && !adHata, kimlikAdim)}
      {adim(3, "Yöntem", "Hemen başla; daha yüksek benzerlik için eğit", true, yontemAdim)}
      {adim(4, "İzin", "Gerçek kişilerin fotoğraflarını izinle kullan", izin, izinKutusu, true)}
    </>
  );

  const mobilKart = (baslik: string, icerik: React.ReactNode, sag?: React.ReactNode) => (
    <section className="overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex h-12 items-center gap-2 border-b border-white/[0.07] px-3.5"><h2 className="flex-1 text-[15px] font-semibold text-metin">{baslik}</h2>{sag}</div>
      <div className="p-3.5">{icerik}</div>
    </section>
  );

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0b0b0c]">
        {dosyaGirdisi}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-[#0b0b0c]/90 px-2 backdrop-blur-md">
          <button onClick={geri} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="flex-1 truncate text-[17px] font-semibold text-metin">{mevcut ? `@${mevcut.ad} düzenle` : "Yeni karakter"}</h1>
        </header>
        <div className="space-y-3 px-3 pb-36 pt-1">
          {mobilKart("Fotoğraflar", <><div className="gizli-scroll -mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-1">{YUVALAR.map((_, i) => yuva(i, true))}</div>{rehber}</>, fotoSag)}
          {mobilKart("Kimlik", kimlikAdim)}
          <section className="overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07] [&>div]:border-t-0">{hazirlik}</section>
          {mobilKart("Yöntem", yontemAdim)}
          {izinKutusu}
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#0b0b0c]/90 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md">
          {kaydetDugmesi}
          {eksik && <p className="mx-auto mt-1.5 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11.5px] text-metin-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />{eksik}</p>}
        </div>
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="h-[calc(100vh-var(--ust-nav))] overflow-y-auto bg-[#0b0b0c] [scrollbar-width:thin]"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setPanoUstunde(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setPanoUstunde(false); }}
      onDrop={(e) => { e.preventDefault(); setPanoUstunde(false); if (e.dataTransfer.files.length) void ekle([...e.dataTransfer.files]); }}>
      {dosyaGirdisi}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#0b0b0c]/90 px-4 backdrop-blur-md">
        <button onClick={geri} aria-label="Geri" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex min-w-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><ScanFace className="h-4 w-4" /></span>
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">{mevcut ? `@${mevcut.ad} düzenle` : "Yeni karakter"}</span>
            <span className="block whitespace-nowrap text-[11.5px] text-metin-2 max-sm:hidden">Birkaç fotoğraf ve bir ad yeter; istemde @{ad || "Ad"} yazınca hazır</span>
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-[1180px] px-8 pb-20 pt-6">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {adimlar}
          </div>
          <aside className="sticky top-20 overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" /><span className="relative h-2 w-2 rounded-full bg-white" /></span>
              <span className="text-[13.5px] font-semibold text-metin">Canlı önizleme</span>
              {digerleri.length > 0 && (
                <span className="ml-auto flex -space-x-1.5">
                  {digerleri.map((f) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={f.id} src={f.url} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-[#151517]" />))}
                </span>
              )}
            </div>
            <div className="p-2.5">{canliKart}</div>
            <div className="grid grid-cols-2 gap-1.5 px-2.5 pb-2.5">
              {ozetSatirlari.map(([I, e, d]) => (
                <span key={e} className="flex items-center gap-2 rounded-[12px] bg-white/[0.03] px-2.5 py-2 ring-1 ring-inset ring-white/[0.05]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><I className="h-3.5 w-3.5" /></span>
                  <span className="min-w-0 leading-tight"><span className="block text-[11px] text-metin-3">{e}</span><span className="block whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-metin">{d}</span></span>
                </span>
              ))}
            </div>
            {hazirlik}
            <div className="space-y-2 border-t border-white/[0.06] p-3">
              {kaydetDugmesi}
              <p className={cn("flex items-center justify-center gap-1.5 text-[12px]", eksik ? "text-amber-100/80" : "text-metin-2")}>{eksik ? <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> : <Check className="h-3.5 w-3.5" />}{eksik ?? "Kaydedince karakter stüdyosu açılır"}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Hazırlık puanı halkası (0–100). */
function PuanHalkasi({ deger }: { deger: number }) {
  const r = 20, c = 2 * Math.PI * r;
  const renk = deger >= 85 ? "#6ee7b7" : deger >= 65 ? "#ffffff" : deger >= 40 ? "#fcd34d" : "#fda4af";
  return (
    <span className="relative flex h-[50px] w-[50px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 50 50" className="absolute inset-0 -rotate-90">
        <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" />
        <motion.circle cx="25" cy="25" r={r} fill="none" stroke={deger ? renk : "transparent"} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={c}
          initial={false} animate={{ strokeDashoffset: c * (1 - deger / 100) }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="text-[14px] font-semibold tabular-nums text-metin">{deger}</span>
    </span>
  );
}
