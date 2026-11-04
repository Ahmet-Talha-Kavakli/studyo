"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera, ScanFace, Upload, X, Loader2, Plus, Check, GalleryHorizontal, Sparkles,
  AlertTriangle, Smartphone, Laugh, Footprints, Coffee, Zap, Sunset, Gem, PersonStanding, ArrowDownToLine, Car, Wind, ArrowUpDown, Cookie, Aperture,
  Search, Eye, Layers, Library, ArrowRight, ExternalLink, Info, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useElements } from "@/store/useElements";
import { usePanolar, type Pano } from "@/store/usePanolar";
import { type Uretim } from "@/store/useProjeler";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { cozunurlukCarpani, GORSEL_MODELLER } from "@/lib/gorselModelVeri";
import { DUMP_PAKETLERI, DUMP_KATEGORILERI, KADRAJLAR, kareIstemi, paketOrnekleri, type DumpKategori, type DumpPaket } from "@/lib/dumpVeri";
import { MarkaKare } from "@/components/studyo/hf";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { KitaplikPaneli } from "@/components/studyo/KitaplikPaneli";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { Kayan, YanPanel, DumpSetleri } from "@/components/dump/dumpOrtak";
import {
  OranSekli, useAracUretimleri, useGorselBaglanti, gorselModelBul, modelKredi, krediYaz, dosyaOku, gorselYukle, gorselOlcu, uretimGorseli, GORSEL_TURLERI,
} from "@/components/arac/kit";

/* ═════════════ Sabitler ═════════════ */
const ARAC = "Instadump";
const KADRAJ_IKON: LucideIcon[] = [Smartphone, Laugh, ScanFace, Footprints, Coffee, Zap, Sunset, Gem, PersonStanding, ArrowDownToLine, Car, Wind, ArrowUpDown, Cookie, Aperture];
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex min-h-[52px] items-center gap-2 border-b border-white/[0.07] px-4 py-2.5";
const CAM = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const HAP = "inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2";
const KARE_ONAYAR = [6, 10, 15];
const ORANLAR: { o: string; a: string }[] = [{ o: "4:5", a: "Gönderi" }, { o: "3:4", a: "Izgara" }, { o: "1:1", a: "Kare" }, { o: "9:16", a: "Hikâye" }];
const ADIMLAR = [{ n: 1, a: "Paketini seç" }, { n: 2, a: "Selfie'ni ekle" }, { n: 3, a: "Setlerin" }] as const;
type Adim = 1 | 2 | 3;
type Foto = { id: string; url: string; durum: "yukleniyor" | "hazir" | "hata"; hata?: string; dusuk?: boolean };
type Kat = DumpKategori | "Tümü" | "Senin";
/** Paket: hazır paket ya da kullanıcının ruh panosu (stil referansı). */
type Secim = { tur: "hazir"; p: DumpPaket } | { tur: "pano"; p: Pano };

const kucuk = (s: string) => s.toLocaleLowerCase("tr");
const panoKapak = (p: Pano): [string, string, string] => [0, 1, 2].map((i) => p.gorseller[i % p.gorseller.length]) as [string, string, string];

/* ═════════════ Küçük parçalar ═════════════ */
/** Üçlü kapaklı paket kartı (Higgsfield paket kartı düzeni). */
function PaketKarti({ ad, not, kapak, rozet, secili, onSec, onAyrinti }: {
  ad: string; not: string; kapak: [string, string, string]; rozet?: string; secili: boolean; onSec: () => void; onAyrinti: () => void;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-[18px] bg-white/[0.035] transition-shadow duration-200",
      secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/[0.07] hover:ring-white/[0.16]")}>
      <button onClick={onSec} aria-pressed={secili} aria-label={`${ad} paketini seç`} className="block w-full text-left transition-transform duration-200 active:scale-[0.99]">
        <span className="relative grid aspect-[2.3/1] grid-cols-3 gap-[2px] bg-black">
          {kapak.map((g, i) => (
            <span key={i} className="relative overflow-hidden">
              <img src={g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" style={{ transitionDelay: `${i * 40}ms` }} />
            </span>
          ))}
          {rozet && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur">{rozet}</span>}
          <AnimatePresence>
            {secili && (
              <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-4 w-4" strokeWidth={3} /></motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="block py-3 pl-4 pr-[112px]">
          <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-metin">{ad}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-metin-3">{not}</span>
        </span>
      </button>
      <button onClick={onAyrinti} title="Paketin örneklerini gör"
        className="absolute bottom-[14px] right-3 flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.11] hover:text-metin active:scale-95">
        <Eye className="h-3.5 w-3.5" />Örnekler
      </button>
    </div>
  );
}

/* ═════════════ Ana bileşen ═════════════ */
export function InstadumpStudyo() {
  const masaustu = useMasaustu();
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();
  const elementler = useElements((s) => s.elementler);
  const karakterler = useMemo(() => elementler.filter((e) => e.tur === "karakter"), [elementler]);
  const panolar = usePanolar((s) => s.panolar);
  const panoEkle = usePanolar((s) => s.panoEkle);
  const kullaniciPaketleri = useMemo(() => panolar.filter((p) => p.gorseller.length >= 2), [panolar]);

  const [adim, setAdim] = useState<Adim>(1);
  const [kat, setKat] = useState<Kat>("Tümü");
  const [arama, setArama] = useState("");
  const [paketId, setPaketId] = useState<string>(DUMP_PAKETLERI[0].id);
  const [ayrinti, setAyrinti] = useState<string | null>(null);
  const [kurAcik, setKurAcik] = useState(false);
  const [kisi, setKisi] = useState<"selfie" | "karakter">("selfie");
  const [karakterId, setKarakterId] = useState<string | null>(null);
  const [selfieler, setSelfieler] = useState<Foto[]>([]);
  const [kadrajlar, setKadrajlar] = useState<number[]>(() => KADRAJLAR.slice(0, 10).map((_, i) => i));
  const [oran, setOran] = useState("4:5");
  const [model, setModel] = useState("Nano Banana 2.1");
  const [cozunurluk, setCozunurluk] = useState("2K");
  const [aktifGrup, setAktifGrup] = useState<string | null>(null);
  const [modelPanel, setModelPanel] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const selfieRef = useRef<HTMLInputElement>(null);
  const anaRef = useRef<HTMLDivElement>(null);
  // Telefonda yapışkan araç çubuğu, yapışkan başlığın hemen altında durur.
  const mobilBaslikRef = useRef<HTMLElement>(null);
  const [mobilUst, setMobilUst] = useState(0);
  useEffect(() => {
    const el = mobilBaslikRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setMobilUst(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, [masaustu]);
  useEffect(() => { if (!karakterId && karakterler[0]) setKarakterId(karakterler[0].id); }, [karakterler, karakterId]);
  // Adım değişince içerik başa kayar.
  useEffect(() => { anaRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); }, [adim]);

  /* ── Seçimler ── */
  const secim: Secim | null = useMemo(() => {
    if (paketId.startsWith("pano:")) { const p = kullaniciPaketleri.find((x) => x.id === paketId.slice(5)); return p ? { tur: "pano", p } : null; }
    const p = DUMP_PAKETLERI.find((x) => x.id === paketId); return p ? { tur: "hazir", p } : null;
  }, [paketId, kullaniciPaketleri]);
  const secimAd = secim?.p.ad ?? "";
  const secimKapak = secim ? (secim.tur === "hazir" ? secim.p.kapak : panoKapak(secim.p)) : null;
  const m = gorselModelBul(model);
  const demo = b.bagli(m) === false;
  const birim = demo ? 0 : modelKredi(m) * (m.api.cozunurluklar.length ? cozunurlukCarpani(cozunurluk) : 1);
  const kare = kadrajlar.length;
  const karakter = karakterler.find((k) => k.id === karakterId) ?? null;
  const hazirSelfie = selfieler.filter((s) => s.durum === "hazir");
  const kisiHazir = kisi === "karakter" ? !!karakter : hazirSelfie.length > 0;
  const eksik: { metin: string; adim: Adim } | null = !secim ? { metin: "Bir paket seç", adim: 1 }
    : !kisiHazir ? { metin: kisi === "karakter" ? (karakterler.length ? "Bir karakter seç" : "Önce bir karakter oluştur") : selfieler.some((s) => s.durum === "yukleniyor") ? "Selfie yükleniyor" : "Selfie ekle", adim: 2 }
    : null;

  /* ── Paket listesi ── */
  const aranan = kucuk(arama.trim());
  const hazirListe = DUMP_PAKETLERI.filter((p) => (kat === "Tümü" || p.kat === kat) && (!aranan || kucuk(`${p.ad} ${p.not} ${p.kat}`).includes(aranan)));
  const panoListe = kullaniciPaketleri.filter((p) => (kat === "Tümü" || kat === "Senin") && (!aranan || kucuk(p.ad).includes(aranan)));
  const katSecenek: { v: Kat; a: string; n: number }[] = [
    { v: "Tümü", a: "Tümü", n: DUMP_PAKETLERI.length + kullaniciPaketleri.length },
    ...(kullaniciPaketleri.length ? [{ v: "Senin" as Kat, a: "Senin", n: kullaniciPaketleri.length }] : []),
    ...DUMP_KATEGORILERI.map((k) => ({ v: k as Kat, a: k, n: DUMP_PAKETLERI.filter((p) => p.kat === k).length })),
  ];

  /* ── Setler ── */
  const sonuclar = useAracUretimleri(ARAC);
  const setler = useMemo(() => {
    const h = new Map<string, Uretim[]>();
    for (const u of sonuclar) { const k = u.meta?.grupId ?? u.id; h.set(k, [...(h.get(k) ?? []), u]); }
    return [...h.entries()].map(([id, l]) => ({ id, l: [...l].sort((a, c) => (a.meta?.sira ?? 0) - (c.meta?.sira ?? 0) || a.olusturma - c.olusturma) }))
      .sort((a, c) => Math.max(...c.l.map((u) => u.olusturma)) - Math.max(...a.l.map((u) => u.olusturma)));
  }, [sonuclar]);
  const aktif = setler.find((s) => s.id === aktifGrup) ?? setler[0];
  const surenSayi = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const aktifPaket = aktif ? DUMP_PAKETLERI.find((p) => p.ad === aktif.l[0].meta?.pano) : undefined;
  const metinler = aktifPaket?.metinler ?? ["bu hafta kamerama ne girdiyse", "küçük bir döküm", "arşivden seçmeler"];
  const etiketler = aktifPaket?.etiketler ?? ["photodump", "instadump"];

  /* ── Yükleme ── */
  const selfieYukle = async (dosyalar: File[]) => {
    const yer = 3 - selfieler.length;
    if (yer <= 0) return void toast.error("En fazla 3 fotoğraf", { description: "Birini kaldırıp yenisini ekle." });
    for (const d of dosyalar.slice(0, yer)) {
      if (!GORSEL_TURLERI.includes(d.type)) { mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP"); continue; }
      const id = `${d.name}-${d.size}-${d.lastModified}`;
      if (selfieler.some((x) => x.id === id)) { toast.error("Bu görsel zaten ekli", { description: d.name }); continue; }
      const dataUrl = await dosyaOku(d);
      const { w, h } = await gorselOlcu(dataUrl);
      setSelfieler((l) => [...l, { id, url: dataUrl, durum: "yukleniyor", dusuk: Math.min(w, h) > 0 && Math.min(w, h) < 512 }]);
      gorselYukle(dataUrl).then((url) => setSelfieler((l) => l.map((s) => (s.id === id ? { ...s, url, durum: "hazir" } : s))))
        .catch((e: Error) => setSelfieler((l) => l.map((s) => (s.id === id ? { ...s, durum: "hata", hata: e.message } : s))));
    }
  };
  // Adım 2'de panodan yapıştırılan görsel selfie olarak eklenir.
  useEffect(() => {
    if (adim !== 2 || kisi !== "selfie") return;
    const yapistir = (e: ClipboardEvent) => {
      const d = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (d.length) { e.preventDefault(); void selfieYukle(d); }
    };
    window.addEventListener("paste", yapistir); return () => window.removeEventListener("paste", yapistir);
  });

  /* ── Üretim ── */
  const uret = () => {
    if (gonderiliyor) return;
    if (eksik || !secim) { setAdim(eksik?.adim ?? 1); return void toast.error("Set başlatılamadı", { description: `${eksik?.metin ?? "Bir paket seç"}.` }); }
    const kim = kisi === "karakter" ? `@${karakter!.ad}` : "The person from the reference selfie";
    const pano = secim.tur === "pano" ? secim.p : null;
    const tema = pano ? `the lighting, locations, color grade and mood of the style reference images${pano.tarif ? `; ${pano.tarif}` : ""}` : (secim.p as DumpPaket).tema;
    const refler = kisi === "selfie" ? hazirSelfie.map((s) => s.url) : [];
    const stil = pano ? pano.gorseller.slice(0, 3) : [];
    // Demo çıktısı: hazır pakette paketin kendi örnekleri; kendi panonda genel Instadump örnekleri (referansların kendisi çıktı gibi görünmesin).
    // Demo çıktısı tekrarsız: önce paketin kendi örnekleri, kare sayısı aşarsa diğer paketlerin örnekleri.
    const karistir = (l: string[]) => [...l].sort(() => Math.random() - 0.5);
    const hp = pano ? null : (secim.p as DumpPaket);
    // Tematik paketler birbirinden çok farklı; onlarda yalnız kendi örnekleri. Kendi panonda genel örnekler.
    const ayniKat = !hp || hp.kat === "Tematik" ? [] : karistir(DUMP_PAKETLERI.filter((p) => p.kat === hp.kat && p.id !== hp.id).flatMap(paketOrnekleri));
    const havuz = hp ? [...new Set([...paketOrnekleri(hp), ...ayniKat])] : karistir([...new Set(DUMP_PAKETLERI.flatMap(paketOrnekleri))]);
    const demoSira: string[] = [];
    while (demoSira.length < kadrajlar.length) {
      const tur = demoSira.length ? karistir(havuz) : havuz;
      // Tur sınırında aynı görsel yan yana gelmesin.
      if (tur.length > 1 && tur[0] === demoSira[demoSira.length - 1]) tur.push(tur.shift()!);
      demoSira.push(...tur);
    }
    const d = icerikDenetle(`${kim} ${tema}`);
    if (!d.izin) return void toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}. ${d.mesaj}` });
    setGonderiliyor(true);
    const grupId = `instadump-${Date.now().toString(36)}`;
    let n = 0;
    kadrajlar.forEach((k, sira) => {
      if (n < sira) return; // önceki kare başlatılamadıysa dur
      const { istem, kadraj } = kareIstemi(kim, tema, k);
      const gorunur = `${secimAd} paketi, ${kucuk(kadraj)} karesi. ${kisi === "karakter" ? `@${karakter!.ad}` : "Selfie'deki kişi"}, her karede aynı yüz.`;
      const s = uretimBaslat({
        baslik: `${secimAd} · ${kadraj}`, tur: "gorsel", model, prompt: istem, kredi: birim, arac: ARAC, projeId: aktifProjeId ?? undefined,
        meta: {
          islem: "uret", oran, ...(m.api.cozunurluklar.length ? { cozunurluk } : {}), hamIstem: gorunur, grupId, sira, pano: secimAd, demoOrnek: demoSira[sira],
          ...(refler.length ? { referanslar: refler, gorselUrl: refler[0] } : {}), ...(stil.length ? { stilRefler: stil } : {}),
          ...(pano?.kacin ? { negatif: pano.kacin } : {}), ...(pano?.guc ? { stilGuc: pano.guc } : {}),
        },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); return; }
      n++;
    });
    setTimeout(() => setGonderiliyor(false), 800);
    if (!n) return;
    setAktifGrup(grupId); setAdim(3);
    toast.success(`${n} karelik set üretiliyor`, { description: `${secimAd} · ${model} · ${demo ? "Kredi düşmez." : `${krediYaz(birim * n)} kredi.`}` });
  };
  // Ctrl+Enter ile üret (yalnız keydown, tekrar yok).
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.repeat && !ayrinti && !kurAcik && !modelPanel && !document.querySelector("[data-goruntuleyici]")) { e.preventDefault(); uret(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  /* ═════════════ Parçalar ═════════════ */
  const kisiAvatar = (boyut: string) => kisi === "karakter"
    ? karakter ? <ElementKapak e={karakter} className={cn(boyut, "shrink-0 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover")} oynat={false} /> : null
    : hazirSelfie[0] ? <img src={hazirSelfie[0].url} alt="" className={cn(boyut, "shrink-0 rounded-full object-cover")} /> : null;
  const adimOzet = (n: Adim): { metin: string; tamam: boolean } => n === 1 ? { metin: secim ? secimAd : "Seçilmedi", tamam: !!secim }
    : n === 2 ? { metin: kisi === "karakter" ? (karakter ? `@${karakter.ad}` : "Karakter seçilmedi") : hazirSelfie.length ? `${hazirSelfie.length} fotoğraf` : "Bekleniyor", tamam: kisiHazir }
    : { metin: setler.length ? `${setler.length} set` : "Henüz yok", tamam: false };

  const ileri = eksik && eksik.adim > adim ? eksik.adim : null;
  const uretDugmesi = (genis?: boolean) => ileri ? (
    <button onClick={() => setAdim(ileri)} className={cn("flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-5 text-[14.5px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.98]", genis && "w-full")}>
      Devam: {kucuk(ADIMLAR[ileri - 1].a)}<ArrowRight className="h-4 w-4" />
    </button>
  ) : (
    <button onClick={uret} disabled={gonderiliyor} aria-disabled={!!eksik}
      className={cn("flex h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-[14.5px] font-semibold transition-[transform,background-color,color] active:scale-[0.98]", genis && "w-full",
        eksik ? "bg-white/[0.07] text-metin-3 ring-1 ring-inset ring-white/[0.08]" : "bg-white text-[#0a0a0b]")}>
      {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {kare} kare üret
      {demo ? <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}>Ücretsiz</span>
        : <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", eksik ? "bg-white/[0.06]" : "bg-black/[0.08]")}><KrediYildiz className="h-3 w-3" />{krediYaz(birim * kare)}</span>}
    </button>
  );

  /* ── Adım başlığı ── */
  const baslik = (h: string, p: string, sag?: React.ReactNode) => (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-0 basis-full md:basis-0 md:flex-1">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-metin md:text-[36px]">{h}</h1>
        <p className="mt-1.5 max-w-[560px] text-[14.5px] leading-relaxed text-metin-2">{p}</p>
      </div>
      {sag}
    </div>
  );

  /* ═════════════ 1 · Paket ═════════════ */
  const yelpaze = secimKapak && (
    <div className="relative hidden h-[132px] w-[230px] shrink-0 md:block" aria-hidden>
      {secimKapak.map((g, i) => {
        const d = i - 1;
        return (
          <motion.img key={paketId + i} src={g} alt="" initial={{ opacity: 0, y: 24, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(d) * 8, rotate: d * 8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
            className="absolute left-1/2 top-0 h-[120px] w-[92px] rounded-[12px] object-cover ring-1 ring-white/15" style={{ marginLeft: -46 + d * 66, zIndex: i === 1 ? 2 : 1 }} />
        );
      })}
    </div>
  );
  const paketAdimi = (
    <div>
      {baslik("Paketini seç", `Paket setin ışığını, mekânını ve havasını belirler. Tek selfie'nden aynı yüzle ${kare} karelik bir dump çıkar.`, yelpaze)}
      <div style={{ top: masaustu ? 0 : mobilUst }} className={cn("sticky z-20 -mx-3 mb-4 flex flex-wrap items-center gap-2 bg-[#0b0b0c]/95 px-3 py-3 backdrop-blur-md md:-mx-8 md:px-8")}>
        <label className="flex h-10 w-full items-center gap-2 rounded-full bg-white/[0.05] px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25 sm:w-[240px]">
          <Search className="h-4 w-4 shrink-0 text-metin-3" />
          <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Paket ara" aria-label="Paket ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
          {arama && <button onClick={() => setArama("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
        </label>
        <div className="gizli-scroll -mx-3 min-w-0 flex-1 overflow-x-auto px-3 sm:mx-0 sm:px-0"><Kayan id="kat" serbest etiket="Kategori" deger={kat} onDeger={setKat} secenekler={katSecenek} /></div>
        <button onClick={() => setKurAcik(true)} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.11] active:scale-[0.97] max-sm:hidden">
          <Plus className="h-4 w-4" />Kendi paketini kur
        </button>
      </div>
      <motion.div key={kat + aranan} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {(kat === "Tümü" || kat === "Senin") && !aranan && (
          <button onClick={() => setKurAcik(true)} className="group flex flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed max-md:flex-row max-md:justify-start max-md:gap-3 max-md:px-4 max-md:py-3.5 max-md:text-left md:min-h-[200px] border-white/[0.16] text-center transition-colors hover:border-white/30 hover:bg-white/[0.02] active:scale-[0.99]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0b] transition-transform group-hover:scale-105"><Plus className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block text-[15px] font-semibold text-metin">Kendi paketini kur</span>
            <span className="mt-0.5 block text-[12.5px] text-metin-3">2 ile 10 referansla kendi havanı yakala</span></span>
          </button>
        )}
        {panoListe.map((p) => (
          <PaketKarti key={p.id} ad={p.ad} not={`${p.gorseller.length} referans`} kapak={panoKapak(p)} rozet={kat === "Senin" ? undefined : "Senin"} secili={paketId === `pano:${p.id}`}
            onSec={() => setPaketId(`pano:${p.id}`)} onAyrinti={() => setAyrinti(`pano:${p.id}`)} />
        ))}
        {kat !== "Senin" && hazirListe.map((p) => (
          <PaketKarti key={p.id} ad={p.ad} not={p.not} kapak={p.kapak} rozet={p.yeni ? "Yeni" : undefined} secili={paketId === p.id} onSec={() => setPaketId(p.id)} onAyrinti={() => setAyrinti(p.id)} />
        ))}
      </motion.div>
      {!hazirListe.length && !panoListe.length && (
        <div className={cn(KART, "flex flex-col items-center gap-2 px-6 py-12 text-center")}>
          <Search className="h-5 w-5 text-metin-3" /><p className="text-[14px] font-medium text-metin">“{arama}” için paket yok</p>
          <button onClick={() => { setArama(""); setKat("Tümü"); }} className="mt-1 h-9 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-metin hover:bg-white/[0.11]">Tüm paketleri göster</button>
        </div>
      )}
    </div>
  );

  /* ═════════════ 2 · Selfie ve set ═════════════ */
  const selfieKarti = (
    <section className={KART}>
      <div className={SERIT}>
        <Camera className="h-4 w-4 text-metin-2" /><h2 className="text-[14px] font-semibold text-metin">Yüzün</h2>
        <span className="ml-auto"><Kayan id="kisi" etiket="Kişi kaynağı" deger={kisi} onDeger={setKisi} secenekler={[{ v: "selfie", a: "Selfie" }, { v: "karakter", a: "Karakterim" }]} /></span>
      </div>
      <div className="p-4">
        {kisi === "selfie" ? (
          <>
            <div className="grid items-start gap-5 md:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex gap-2.5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void selfieYukle([...e.dataTransfer.files]); }}>
                {[0, 1, 2].map((yuva) => {
                  const s = selfieler[yuva];
                  if (s) return (
                    <motion.div key={s.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-[104px]">
                      <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[14px] ring-1 ring-inset", s.durum === "hata" ? "ring-rose-400/60" : "ring-white/15")}>
                        <img src={s.url} alt={`Selfie ${yuva + 1}`} className={cn("h-full w-full object-cover", s.durum === "yukleniyor" && "opacity-50")} />
                        {s.durum === "yukleniyor" && <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />}
                        {yuva === 0 && s.durum === "hazir" && <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-1.5 py-px text-[10.5px] font-semibold text-[#0a0a0b]">Ana</span>}
                        {(s.durum === "hata" || s.dusuk) && (
                          <span title={s.durum === "hata" ? s.hata : "Kısa kenarı 512 pikselden küçük; yüz daha az tutarlı olabilir."}
                            className={cn("absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold backdrop-blur", s.durum === "hata" ? "bg-rose-500/85 text-white" : "bg-amber-300/90 text-[#1a1405]")}>
                            <AlertTriangle className="h-3 w-3 shrink-0" />{s.durum === "hata" ? "Yüklenemedi" : "Düşük kalite"}
                          </span>
                        )}
                        <button onClick={() => setSelfieler((l) => l.filter((x) => x.id !== s.id))} aria-label="Fotoğrafı kaldır" className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black active:scale-90"><X className="h-3.5 w-3.5" /></button>
                      </span>
                      <span className="mt-1.5 block text-center text-[11.5px] text-metin-3">{yuva === 0 ? "Önden" : yuva === 1 ? "Yan açı" : "Farklı ışık"}</span>
                    </motion.div>
                  );
                  const ilk = yuva === selfieler.length;
                  return (
                    <div key={`bos-${yuva}`} className="w-[104px]">
                      <button onClick={() => selfieRef.current?.click()} disabled={!ilk} aria-label={yuva === 0 ? "Selfie yükle" : "Başka açı ekle"}
                        className={cn("group flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed transition-colors active:scale-[0.97]",
                          yuva === 0 ? "border-white/[0.24] bg-white/[0.03] hover:border-white/45 hover:bg-white/[0.05]" : ilk ? "border-white/[0.16] text-metin-3 hover:border-white/35 hover:text-metin" : "border-white/[0.07] text-white/20")}>
                        {yuva === 0
                          ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0b] transition-transform group-hover:scale-105"><Upload className="h-[18px] w-[18px]" /></span>
                          : <Plus className="h-5 w-5" />}
                      </button>
                      <span className={cn("mt-1.5 block text-center text-[11.5px]", yuva === 0 ? "font-medium text-metin" : "text-metin-3")}>{yuva === 0 ? "Selfie yükle" : yuva === 1 ? "Yan açı" : "Farklı ışık"}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
                <p className="text-[13px] font-semibold text-metin">İyi bir selfie</p>
                <ul className="mt-2.5 grid gap-y-2 text-[12.5px] text-metin-2 2xl:grid-cols-2 2xl:gap-x-4">
                  {["Net ve iyi ışıklı", "Yüz önden, tam görünür", "Tek kişi, filtresiz"].map((t) => <li key={t} className="flex items-center gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>{t}</li>)}
                  {["Güneş gözlüğü ya da grup fotoğrafı"].map((t) => <li key={t} className="flex items-center gap-2 text-metin-3"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><X className="h-2.5 w-2.5" strokeWidth={3} /></span>{t}</li>)}
                </ul>
                <p className="mt-3 border-t border-white/[0.06] pt-3 text-[12px] leading-snug text-metin-3">Tek selfie yeter. Yan açıdan ve farklı ışıkta birer fotoğraf daha eklersen yüz her karede daha tutarlı olur. Sürükleyip bırakabilir ya da yapıştırabilirsin.</p>
              </div>
            </div>
          </>
        ) : karakterler.length ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {karakterler.map((k) => (
              <button key={k.id} onClick={() => setKarakterId(k.id)} aria-pressed={karakterId === k.id} className="group text-left active:scale-[0.98]">
                <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[14px] transition-shadow", karakterId === k.id ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-inset ring-white/10 group-hover:ring-white/30")}>
                  <ElementKapak e={k} className="absolute inset-0 h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
                  {karakterId === k.id && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-3 w-3" strokeWidth={3.5} /></span>}
                </span>
                <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin-2">@{k.ad}</span>
              </button>
            ))}
            <Link href="/panel/karakter/yeni" className="group text-left">
              <span className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-white/15 text-metin-3 transition-colors group-hover:border-white/30 group-hover:text-metin"><Plus className="h-5 w-5" /></span>
              <span className="mt-1.5 block text-[12.5px] text-metin-3">Yeni karakter</span>
            </Link>
          </div>
        ) : (
          <Link href="/panel/karakter/yeni" className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.05]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Plus className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-metin">Karakter oluştur</span><span className="block text-[12.5px] text-metin-3">1 ile 5 fotoğraf, ücretsiz; her sette aynı yüz</span></span>
            <ArrowRight className="h-4 w-4 text-metin-3" />
          </Link>
        )}
      </div>
    </section>
  );

  const akisKarti = (
    <section className={KART}>
      <div className={SERIT}>
        <Layers className="h-4 w-4 text-metin-2" /><h2 className="text-[14px] font-semibold text-metin">Setin akışı</h2>
        <span className="ml-auto"><Kayan id="kare" etiket="Kare sayısı" deger={KARE_ONAYAR.includes(kare) ? kare : -1}
          onDeger={(n) => n > 0 && setKadrajlar(KADRAJLAR.slice(0, n).map((_, i) => i))} secenekler={KARE_ONAYAR.map((n) => ({ v: n, a: `${n} kare` }))} /></span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]">
          {KADRAJLAR.map((k, i) => {
            const sira = kadrajlar.indexOf(i);
            const sec = sira >= 0;
            const I = KADRAJ_IKON[i];
            return (
              <button key={k.ad} aria-pressed={sec} onClick={() => setKadrajlar((l) => sec ? (l.length > 3 ? l.filter((x) => x !== i) : (toast.error("En az 3 kare", { description: "Bir dump için en az 3 kare gerekir." }), l)) : [...l, i].sort((a, c) => a - c))}
                className={cn("flex h-11 items-center gap-2.5 rounded-[12px] pl-1.5 pr-3 text-left transition-colors active:scale-[0.97]",
                  sec ? "bg-white/[0.06] text-metin hover:bg-white/[0.09]" : "text-metin-3 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.03] hover:text-metin-2")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[11.5px] font-semibold tabular-nums transition-colors", sec ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04]")}>
                  {sec ? sira + 1 : <Plus className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{k.ad}</span>
                <I className={cn("h-4 w-4 shrink-0", sec ? "text-metin-2" : "opacity-50")} strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] text-metin-3">Kadraja dokunarak ekle ya da çıkar. Numara, karenin setteki sırası.</p>
      </div>
    </section>
  );

  const modeller = GORSEL_MODELLER.filter((x) => x.api.refMax >= 1 && x.tip !== "swap" && !x.api.refZorunlu && !x.gizli);
  const ONERILEN = ["Nano Banana 2.1", "Nano Banana Pro", "Vayra Ruh 2.0", "GPT Image 2", "Seedream 5.0 Pro"];
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
  const ciktiKarti = (
    <section className={KART}>
      <div className={SERIT}><Smartphone className="h-4 w-4 text-metin-2" /><h2 className="text-[14px] font-semibold text-metin">Çıktı</h2></div>
      <div className="space-y-5 p-4">
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-metin-2">Biçim</p>
          <div className="grid grid-cols-4 gap-1.5">
            {ORANLAR.filter((x) => !m.api.oranlar.length || m.api.oranlar.includes(x.o)).map((x) => (
              <button key={x.o} onClick={() => setOran(x.o)} aria-pressed={oran === x.o}
                className={cn("flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-[12px] transition-colors active:scale-[0.97]", oran === x.o ? "bg-white text-[#0a0a0b]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]")}>
                <OranSekli oran={x.o} boyut={18} /><span className="text-[12px] font-semibold tabular-nums leading-none">{x.o}</span><span className={cn("text-[10.5px] leading-none", oran === x.o ? "text-black/55" : "text-metin-3")}>{x.a}</span>
              </button>
            ))}
          </div>
        </div>
        {m.api.cozunurluklar.length > 0 && (
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-metin-2">Kalite</p>
            <div role="tablist" aria-label="Kalite" className="grid gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]" style={{ gridTemplateColumns: `repeat(${m.api.cozunurluklar.length}, minmax(0, 1fr))` }}>
              {m.api.cozunurluklar.map((c) => (
                <button key={c} role="tab" aria-selected={cozunurluk === c} onClick={() => setCozunurluk(c)}
                  className={cn("relative isolate h-8 rounded-full text-[12.5px] font-semibold transition-colors active:scale-[0.97]", cozunurluk === c ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>
                  {cozunurluk === c && <motion.span layoutId="kayan-kalite" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}{c}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-metin-2">Model</p>
          <button onClick={() => setModelPanel(true)} className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.05] p-2 pr-3 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] active:scale-[0.99]">
            <MarkaKare ad={model} boyut={36} />
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{model}</span><span className="block truncate text-[11.5px] text-metin-3">{m.ozet}</span></span>
            <span className="text-[12.5px] font-medium text-metin-2">Değiştir</span>
          </button>
        </div>
      </div>
    </section>
  );

  const selfieAdimi = (
    <div>
      {baslik(kisi === "karakter" ? "Karakterini seç" : "Selfie'ni ekle", "Setin her karesi bu yüzle üretilir. Kadrajları ve biçimi buradan ayarla.",
        secim && (
          <button onClick={() => setAdim(1)} className="flex h-11 items-center gap-2.5 rounded-full bg-white/[0.05] py-1 pl-1 pr-4 text-[13px] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] active:scale-[0.98]">
            {secimKapak && <img src={secimKapak[0]} alt="" className="h-9 w-9 rounded-full object-cover" />}<span className="font-medium text-metin">{secimAd}</span><span className="text-metin-3">Değiştir</span>
          </button>
        ))}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">{selfieKarti}{akisKarti}</div>
        {ciktiKarti}
      </div>
    </div>
  );

  /* ═════════════ 3 · Setler ═════════════ */
  const setAdimi = !aktif ? (
    <div>
      {baslik("Setlerin", "Ürettiğin setler burada; ızgara, gönderi ve profil görünümünde bak, ZIP olarak indir.")}
      <div className={cn(KART, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><GalleryHorizontal className="h-5 w-5" /></span>
        <p className="text-[16px] font-semibold text-metin">Henüz bir setin yok</p>
        <p className="max-w-[360px] text-[13.5px] text-metin-3">Paketini seç, selfie'ni ekle; ilk setin birkaç dakikada burada.</p>
        <button onClick={() => setAdim(eksik?.adim ?? 2)} className="mt-2 flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] active:scale-[0.97]">{eksik ? eksik.metin : "Seti üret"}<ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  ) : (
    <DumpSetleri arac={ARAC} setler={setler} aktifId={aktif.id} onAktif={(id) => { setAktifGrup(id); anaRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
      onSilindi={() => setAktifGrup(null)} avatarYedek={kisiAvatar("h-full w-full")} metinler={metinler} etiketler={etiketler} />
  );

  /* ═════════════ Yan paneller ═════════════ */
  const ayrintiSecim: Secim | null = ayrinti ? (ayrinti.startsWith("pano:") ? (() => { const p = kullaniciPaketleri.find((x) => x.id === ayrinti.slice(5)); return p ? { tur: "pano" as const, p } : null; })()
    : (() => { const p = DUMP_PAKETLERI.find((x) => x.id === ayrinti); return p ? { tur: "hazir" as const, p } : null; })()) : null;
  const ayrintiGorseller = ayrintiSecim ? (ayrintiSecim.tur === "hazir" ? paketOrnekleri(ayrintiSecim.p) : ayrintiSecim.p.gorseller) : [];
  const ayrintiPaneli = (
    <YanPanel acik={!!ayrintiSecim} onKapat={() => setAyrinti(null)} baslik={ayrintiSecim?.p.ad ?? ""}
      alt={ayrintiSecim && (
        <button onClick={() => { setPaketId(ayrinti!); setAyrinti(null); setAdim(2); }} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[14.5px] font-semibold text-[#0a0a0b] active:scale-[0.98]">
          Bu paketle devam et<ArrowRight className="h-4 w-4" />
        </button>
      )}>
      {ayrintiSecim && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={HAP}>{ayrintiSecim.tur === "hazir" ? ayrintiSecim.p.kat : "Senin panon"}</span>
            <span className={HAP}>{ayrintiGorseller.length} örnek</span>
            {ayrintiSecim.tur === "pano" && <Link href={`/panel/moodboard/${ayrintiSecim.p.id}`} className={cn(HAP, "hover:bg-white/[0.1] hover:text-metin")}><ExternalLink className="h-3 w-3" />Ruh panosunda düzenle</Link>}
          </div>
          <p className="text-[14px] leading-relaxed text-metin-2">{ayrintiSecim.tur === "hazir" ? ayrintiSecim.p.not : ayrintiSecim.p.tarif || "Görsellerinin ışığı, mekânı ve tonu setin havası olur. İlk 3 görsel stil referansı olarak gider."}</p>
          <div className="grid grid-cols-2 gap-2">
            {ayrintiGorseller.map((g, i) => (
              <motion.img key={g + i} src={g} alt="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={cn("w-full rounded-[12px] object-cover ring-1 ring-inset ring-white/10", i === 0 ? "col-span-2 aspect-[4/3] object-[center_22%]" : "aspect-[4/5]")} />
            ))}
          </div>
          <p className="text-[12px] text-metin-3">Örnek görseller paketin havasını gösterir; senin setin kendi yüzünle üretilir.</p>
        </div>
      )}
    </YanPanel>
  );

  /* Kendi paketini kur: ruh panosu olarak kaydedilir (moodboard ile ortak). */
  const [kurAd, setKurAd] = useState("");
  const [kurRefler, setKurRefler] = useState<Foto[]>([]);
  const [kitaplikAcik, setKitaplikAcik] = useState(false);
  const kurRef = useRef<HTMLInputElement>(null);
  const kurYukle = async (dosyalar: File[]) => {
    for (const d of dosyalar.slice(0, 10 - kurRefler.length)) {
      if (!GORSEL_TURLERI.includes(d.type)) { mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP"); continue; }
      const id = `${d.name}-${d.size}-${d.lastModified}`;
      if (kurRefler.some((x) => x.id === id)) { toast.error("Bu görsel zaten ekli", { description: d.name }); continue; }
      const dataUrl = await dosyaOku(d);
      setKurRefler((l) => [...l, { id, url: dataUrl, durum: "yukleniyor" }]);
      gorselYukle(dataUrl).then((url) => setKurRefler((l) => l.map((r) => (r.id === id ? { ...r, url, durum: "hazir" } : r))))
        .catch((e: Error) => setKurRefler((l) => l.map((r) => (r.id === id ? { ...r, durum: "hata", hata: e.message } : r))));
    }
  };
  const kurHazir = kurRefler.filter((r) => r.durum === "hazir");
  const kurKaydet = () => {
    if (kurHazir.length < 2) return void toast.error("En az 2 görsel ekle");
    const id = panoEkle(kurAd.trim() || "Benim paketim", kurHazir.map((r) => r.url));
    setPaketId(`pano:${id}`); setKurAcik(false); setKurRefler([]); setKurAd(""); setKat("Tümü");
    toast.success("Paketin kaydedildi", { description: "Ruh panolarında da görünür." });
  };
  const kurPaneli = (
    <YanPanel acik={kurAcik} onKapat={() => setKurAcik(false)} baslik="Kendi paketini kur"
      alt={kurHazir.length < 2
        ? <p className="flex h-12 items-center justify-center gap-1.5 rounded-[14px] bg-white/[0.04] text-[13px] text-metin-3 ring-1 ring-inset ring-white/[0.07]"><Info className="h-3.5 w-3.5" />{kurHazir.length ? "1 görsel daha ekle" : "Kaydetmek için en az 2 görsel ekle"}</p>
        : <button onClick={kurKaydet} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[14.5px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.98]">
        <Check className="h-4 w-4" />Paketi kaydet ve seç</button>}>
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-metin-2">Paket adı</span>
          <input value={kurAd} onChange={(e) => setKurAd(e.target.value)} placeholder="Benim paketim" maxLength={40}
            className="h-11 w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-3 focus:ring-white/30" />
        </label>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[12.5px] font-medium text-metin-2">Referanslar</span>
            <span className="text-[12px] tabular-nums text-metin-3">{kurRefler.length}/10</span>
            <button onClick={() => setKitaplikAcik(true)} className="ml-auto flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin hover:bg-white/[0.1] active:scale-[0.97]"><Library className="h-3.5 w-3.5" />Kitaplıktan</button>
          </div>
          {kurRefler.length === 0 ? (
            <button onClick={() => kurRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void kurYukle([...e.dataTransfer.files]); }}
              className="group relative flex h-[210px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[16px] border border-dashed border-white/[0.18] text-center transition-colors hover:border-white/35 hover:bg-white/[0.02] active:scale-[0.995]">
              <span className="relative h-[64px] w-[120px]" aria-hidden>
                {[-9, 0, 9].map((d, i) => (
                  <span key={d} className="absolute left-1/2 top-0 h-[64px] w-[48px] rounded-[8px] border border-white/15 bg-white/[0.04] transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ marginLeft: -24 + (i - 1) * 34, transform: `rotate(${d}deg)`, zIndex: i === 1 ? 2 : 1 }} />
                ))}
                <span className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Upload className="h-4 w-4" /></span>
              </span>
              <span className="text-[14px] font-semibold text-metin">Referans görselleri yükle</span>
              <span className="-mt-2 text-[12px] text-metin-3">Sürükle bırak ya da seç. 2 ile 10 görsel</span>
            </button>
          ) : (
          <div className="grid grid-cols-3 gap-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void kurYukle([...e.dataTransfer.files]); }}>
            {kurRefler.map((r, i) => (
              <span key={r.id} className="relative aspect-square overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
                <img src={r.url} alt="" className={cn("h-full w-full object-cover", r.durum === "yukleniyor" && "opacity-50")} />
                {r.durum === "yukleniyor" && <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />}
                {i < 3 && r.durum === "hazir" && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white px-1.5 py-px text-[10.5px] font-semibold text-[#0a0a0b]">Stil {i + 1}</span>}
                <button onClick={() => setKurRefler((l) => l.filter((x) => x.id !== r.id))} aria-label="Kaldır" className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            {kurRefler.length < 10 && (
              <button onClick={() => kurRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-white/20 text-metin-3 transition-colors hover:border-white/40 hover:text-metin active:scale-[0.97]">
                <Plus className="h-4 w-4" /><span className="text-[11.5px]">Ekle</span>
              </button>
            )}
          </div>
          )}
          <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug text-metin-3"><Info className="mt-px h-3.5 w-3.5 shrink-0" />İlk 3 görsel stil referansı olur. Kişiler değil; ışık, mekân ve ton alınır.</p>
        </div>
        {!!kullaniciPaketleri.length && (
          <div className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="border-b border-white/[0.07] px-4 py-3 text-[13px] font-semibold text-metin">Ya da bir ruh panonu kullan</p>
            <div className="space-y-1 p-2">
              {kullaniciPaketleri.slice(0, 5).map((p) => (
                <button key={p.id} onClick={() => { setPaketId(`pano:${p.id}`); setKurAcik(false); }} className="flex w-full items-center gap-3 rounded-[12px] p-2 text-left hover:bg-white/[0.05] active:scale-[0.99]">
                  <span className="flex h-11 w-[66px] shrink-0 gap-px overflow-hidden rounded-[9px] bg-black ring-1 ring-inset ring-white/10">{panoKapak(p).map((g, i) => <img key={i} src={g} alt="" className="h-full w-1/3 object-cover" />)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{p.ad}</span><span className="block text-[11.5px] text-metin-3">{p.gorseller.length} görsel</span></span>
                  <ArrowRight className="h-4 w-4 text-metin-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </YanPanel>
  );

  const dosyalar = (
    <>
      <input ref={selfieRef} type="file" accept={GORSEL_TURLERI.join(",")} multiple hidden onChange={(e) => { void selfieYukle([...(e.target.files ?? [])]); e.target.value = ""; }} />
      <input ref={kurRef} type="file" accept={GORSEL_TURLERI.join(",")} multiple hidden onChange={(e) => { void kurYukle([...(e.target.files ?? [])]); e.target.value = ""; }} />
    </>
  );
  const modelPaneli = (
    <YanPanel acik={modelPanel} onKapat={() => setModelPanel(false)} baslik="Model">
      <p className="mb-2 px-1 text-[12.5px] font-medium text-metin-2">Önerilen</p>
      <div className="space-y-1">{modeller.filter((x) => ONERILEN.includes(x.ad)).map(modelSatiri)}</div>
      <p className="mb-2 mt-5 px-1 text-[12.5px] font-medium text-metin-2">Kişi referansı alan diğer modeller</p>
      <div className="space-y-1">{modeller.filter((x) => !ONERILEN.includes(x.ad)).map(modelSatiri)}</div>
    </YanPanel>
  );
  const katmanlar = (
    <>
      {ayrintiPaneli}{kurPaneli}{modelPaneli}
      {kitaplikAcik && <KitaplikPaneli tur="gorsel" turler={["gorsel"]} alt="Paketine eklenecek görseli seç" eylem="Pakete ekle" eylemIkon={Plus}
        onKapat={() => setKitaplikAcik(false)} onYukle={() => { setKitaplikAcik(false); kurRef.current?.click(); }}
        onSec={(u) => { const g = uretimGorseli(u); if (g && kurRefler.length < 10) setKurRefler((l) => [...l, { id: u.id, url: g, durum: "hazir" }]); setKitaplikAcik(false); }} />}
    </>
  );
  const icerik = adim === 1 ? paketAdimi : adim === 2 ? selfieAdimi : setAdimi;

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className="dump-kapsam flex min-h-[100dvh] flex-col overflow-x-clip bg-[#0b0b0c]" data-kendi-kisayol>
        {dosyalar}
        <header ref={mobilBaslikRef} className="sticky top-0 z-30 bg-[#0b0b0c]/95 px-3 pb-2.5 pt-3 backdrop-blur-md">
          <div className="mb-2.5 flex items-center gap-2">
            <Camera className="h-5 w-5 text-metin-2" /><h1 className="flex-1 text-[17px] font-semibold text-metin">Instadump</h1>
            {surenSayi > 0 && <span className={HAP}><Loader2 className="h-3 w-3 animate-spin" />{surenSayi} kare</span>}
          </div>
          <div className="flex gap-1">
            {ADIMLAR.map((a) => {
              const o = adimOzet(a.n);
              return (
                <button key={a.n} onClick={() => setAdim(a.n)} className={cn("relative isolate flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition-colors", adim === a.n ? "text-[#0a0a0b]" : "bg-white/[0.05] text-metin-3")}>
                  {adim === a.n && <motion.span layoutId="m-adim" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  {o.tamam && adim !== a.n ? <Check className="h-3.5 w-3.5 text-metin" /> : <span className="tabular-nums">{a.n}</span>}
                  {a.n === 1 ? "Paket" : a.n === 2 ? "Selfie" : "Setler"}
                </button>
              );
            })}
          </div>
        </header>
        <div ref={anaRef} className="flex-1 px-3 pb-6 pt-3 [&_h1]:text-[26px]">{icerik}</div>
        {adim !== 3 && (
          <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
            <div className={cn("rounded-[20px] p-2", CAM)}>
              {eksik && !ileri && <p className="mb-2 flex items-center justify-center gap-1.5 text-[12px] text-metin-2"><Info className="h-3.5 w-3.5" />{eksik.metin}</p>}
              {adim === 1 ? (
                <button onClick={() => setAdim(2)} disabled={!secim} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-[14.5px] font-semibold text-[#0a0a0b] active:scale-[0.98] disabled:opacity-50">
                  {secimKapak && <img src={secimKapak[0]} alt="" className="h-7 w-7 rounded-full object-cover" />}{secimAd} ile devam<ArrowRight className="h-4 w-4" />
                </button>
              ) : uretDugmesi(true)}
            </div>
          </div>
        )}
        {katmanlar}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className="dump-kapsam flex h-[calc(100vh-var(--ust-nav))] w-full bg-[#0b0b0c]" data-kendi-kisayol>
      {dosyalar}
      <aside className="flex w-[288px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e10]/80">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex shrink-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Camera className="h-4 w-4" strokeWidth={1.8} /></span><span className="leading-tight"><span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Instadump</span><span className="block whitespace-nowrap text-[11.5px] text-metin-2 max-sm:hidden">Tek selfie, paylaşıma hazır set</span></span></div>
        </div>
        <nav aria-label="Adımlar" className="relative px-3">
          <span className="absolute bottom-7 left-[30px] top-7 w-px bg-white/[0.08]" aria-hidden />
          {ADIMLAR.map((a) => {
            const o = adimOzet(a.n);
            const akt = adim === a.n;
            return (
              <button key={a.n} onClick={() => setAdim(a.n)} aria-current={akt ? "step" : undefined}
                className={cn("relative isolate flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-colors active:scale-[0.99]", !akt && "hover:bg-white/[0.03]")}>
                {akt && <motion.span layoutId="adim-zemin" className="absolute inset-0 -z-10 rounded-[14px] bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 40 }} />}
                <span className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold tabular-nums transition-colors",
                  akt || o.tamam ? "bg-white text-[#0a0a0b]" : "bg-[#1c1c1f] text-metin-3 ring-1 ring-inset ring-white/[0.1]")}>
                  {o.tamam && !akt ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : a.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[14px] font-medium", akt ? "text-metin" : "text-metin-2")}>{a.a}</span>
                  <span className="block truncate text-[12px] text-metin-3">{o.metin}</span>
                </span>
                {a.n === 3 && surenSayi > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin text-metin-2" />}
              </button>
            );
          })}
        </nav>
        <div className="flex-1" />
        <div className="space-y-3 p-4">
          {adim !== 2 && <div className="rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <span className="[&>span]:!h-8 [&>span]:!w-8 [&>span]:!rounded-[9px]"><MarkaKare ad={model} boyut={32} /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-medium text-metin">{model}</span><span className="block text-[12px] tabular-nums text-metin-3">{kare} kare · {oran}{m.api.cozunurluklar.length ? ` · ${cozunurluk}` : ""}</span></span>
              <button onClick={() => setAdim(2)} className="rounded-full px-2 py-1 text-[12px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-metin">Ayarla</button>
            </div>
          </div>}
          {eksik && !ileri && <p className="flex items-center justify-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] text-metin-2"><Info className="h-3.5 w-3.5" />{eksik.metin}</p>}
          {uretDugmesi(true)}
          {!eksik && <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-metin-3"><kbd className="rounded-[5px] bg-white/[0.07] px-1.5 py-px font-sans text-[10.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08]">Ctrl</kbd><kbd className="rounded-[5px] bg-white/[0.07] px-1.5 py-px font-sans text-[10.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08]">Enter</kbd>ile üret</p>}
        </div>
      </aside>
      <main ref={anaRef} className="min-w-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <AnimatePresence mode="wait">
          <motion.div key={adim} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[1180px] px-8 pb-10 pt-8 min-[1800px]:max-w-[1440px]">{icerik}</motion.div>
        </AnimatePresence>
      </main>
      {katmanlar}
    </div>
  );
}
