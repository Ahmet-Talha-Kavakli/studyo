"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Palette, Sun, Upload, Images, LayoutGrid, X, Loader2, AlertTriangle, Pipette, Sparkles, Check, Layers, ChevronLeft, ChevronDown, ArrowUpLeft,
  Wand2, Ban, SlidersHorizontal, Info, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { usePanolar, PANO_MAKS_GORSEL, type PanoGuc } from "@/store/usePanolar";
import type { Uretim } from "@/store/useProjeler";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast, uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { paletCikar } from "@/lib/paletCikar";
import { HAZIR_PANOLAR_TAM, STIL_REF_SINIRI } from "@/lib/panoVeri";
import { GORSEL_MODELLER } from "@/lib/gorselModelVeri";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { KitaplikPaneli } from "@/components/studyo/KitaplikPaneli";
import {
  OranSekli, SonucKarti, SonucGoruntuleyici, useAracUretimleri, useGorselBaglanti,
  gorselModelBul, modelKredi, krediYaz, dosyaOku, gorselOlcu, gorselYukle, uretimGorseli, GORSEL_TURLERI,
} from "@/components/arac/kit";
import { PanoMozaik } from "./PanoKitapligi";

type Ref = { id: string; url: string; durum: "yukleniyor" | "hazir" | "hata"; w: number; h: number; hata?: string };
/** Parlaklık (0–1), sıcaklık (−1…1), doygunluk (0–1) ve kontrast (parlaklık sapması). */
type Olcum = { p: number; s: number; d: number; k: number };
const yeniId = () => Math.random().toString(36).slice(2, 9);
const YUZEY = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const CIP = "flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/[0.07] px-3 text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-[0.97]";
const YAY = { type: "spring", stiffness: 480, damping: 38 } as const;

/** Görselin piksel istatistiği; tarayıcıda 48 px'e küçültülerek ölçülür. */
async function istatistik(url: string): Promise<Olcum | null> {
  try {
    const g = await new Promise<HTMLImageElement>((coz, red) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => coz(i); i.onerror = red; i.src = url; });
    const c = document.createElement("canvas"); c.width = 48; c.height = 48;
    const x = c.getContext("2d", { willReadFrequently: true })!; x.drawImage(g, 0, 0, 48, 48);
    const d = x.getImageData(0, 0, 48, 48).data;
    let r = 0, gg = 0, b = 0, doy = 0, l1 = 0, l2 = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; gg += d[i + 1]; b += d[i + 2];
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      doy += mx ? (mx - mn) / mx : 0;
      const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; l1 += l; l2 += l * l;
    }
    const n = d.length / 4;
    const ort = l1 / n;
    return { p: ort, s: (r - b) / n / 255, d: doy / n, k: Math.sqrt(Math.max(0, l2 / n - ort * ort)) };
  } catch { return null; }
}
const sapma = (l: number[]) => { const o = l.reduce((a, b) => a + b, 0) / l.length; return Math.sqrt(l.reduce((a, b) => a + (b - o) ** 2, 0) / l.length); };
/** Ölçümden ruh etiketleri (yalnız belirgin olanlar). */
function etiketCikar(o: { p: number; s: number; d: number; k: number }): string[] {
  const l: string[] = [];
  l.push(o.p < 0.3 ? "Loş" : o.p < 0.55 ? "Yumuşak ışık" : "Aydınlık");
  l.push(o.s > 0.06 ? "Sıcak ton" : o.s < -0.04 ? "Soğuk ton" : "Nötr ton");
  if (o.d > 0.45) l.push("Canlı renk"); else if (o.d < 0.18) l.push("Soluk renk");
  if (o.k > 0.25) l.push("Yüksek kontrast"); else if (o.k < 0.12) l.push("Düşük kontrast");
  return l;
}
const TARIF_KALIP: Record<string, string> = {
  "Loş": "loş, düşük anahtarlı ışık", "Yumuşak ışık": "yumuşak, dağınık ışık", "Aydınlık": "aydınlık, ferah ışık", "Sıcak ton": "sıcak renk tonu", "Soğuk ton": "soğuk renk tonu",
  "Nötr ton": "nötr renk tonu", "Canlı renk": "canlı, doygun renkler", "Soluk renk": "soluk, düşük doygunluk", "Yüksek kontrast": "yüksek kontrast, derin gölgeler", "Düşük kontrast": "düşük kontrast, yumuşak gölgeler",
};

const KONULAR: { id: string; ad: string; gorsel: string; istem: string }[] = [
  { id: "portre", ad: "Portre", gorsel: "/gercek/galeri/portre4.webp", istem: "Bir kadının editöryel portresi, belden yukarı, kameraya bakıyor" },
  { id: "urun", ad: "Ürün", gorsel: "/gercek/galeri/urun1.webp", istem: "Mermer zemin üzerinde bir parfüm şişesi, ürün fotoğrafı" },
  { id: "mekan", ad: "Mekân", gorsel: "/gercek/moodboard/mood-warm.webp", istem: "Pencere ışığı alan sakin bir oturma odası, geniş açı" },
  { id: "moda", ad: "Moda", gorsel: "/gercek/moodboard/mood-h1.webp", istem: "Uzun elbiseli bir model yürüyor, tam boy moda çekimi" },
  { id: "sokak", ad: "Sokak", gorsel: "/gercek/moodboard/mood-street.webp", istem: "Şehirde yürüyen genç bir adam, sokak fotoğrafı" },
];
const ONIZ_ORAN = ["3:4", "1:1", "4:5", "16:9", "9:16"];
const GUCLER: { id: PanoGuc; ad: string; alt: string }[] = [
  { id: "hafif", ad: "Hafif", alt: "İstem önde, stil dokunuşu" },
  { id: "dengeli", ad: "Dengeli", alt: "Işık ve renk panodan" },
  { id: "guclu", ad: "Güçlü", alt: "Görünüm birebir pano" },
];

export function PanoOlustur({ id }: { id?: string }) {
  const router = useRouter();
  const ara = useSearchParams();
  const masaustu = useMasaustu();
  const panolar = usePanolar((s) => s.panolar);
  const mevcut = id ? panolar.find((p) => p.id === id) : undefined;
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();

  const [refler, setRefler] = useState<Ref[]>([]);
  const [ad, setAd] = useState("");
  const [renkler, setRenkler] = useState<string[]>([]);
  const [paletGonder, setPaletGonder] = useState(false);
  const [tarif, setTarif] = useState("");
  const [kacin, setKacin] = useState("");
  const [guc, setGuc] = useState<PanoGuc>("dengeli");
  const [paletYukleniyor, setPaletYukleniyor] = useState(false);
  const [olcum, setOlcum] = useState<Record<string, Olcum>>({});
  const [suruklenen, setSuruklenen] = useState<number | null>(null);
  const [hedef, setHedef] = useState<number | null>(null);
  const [panoUstunde, setPanoUstunde] = useState(false);
  const [kitaplikAcik, setKitaplikAcik] = useState(false);
  const [hazirAcik, setHazirAcik] = useState(false);
  const [model, setModel] = useState("Vayra Ruh 2.0");
  const [cip, setCip] = useState<null | "model" | "oran">(null);
  const [istem, setIstem] = useState(KONULAR[0].istem);
  const [oran, setOran] = useState("3:4");
  const [karsilastir, setKarsilastir] = useState(true);
  const [rehberAcik, setRehberAcik] = useState(false);
  const [secili, setSecili] = useState<string | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [kayitli, setKayitli] = useState("");

  const anlik = () => JSON.stringify({ ad: ad.trim(), g: refler.map((r) => r.url), renkler, paletGonder, tarif: tarif.trim(), kacin: kacin.trim(), guc });

  // Mevcut pano ya da ?hazir= ile ön doldur.
  useEffect(() => {
    if (yuklendi || !hazir) return;
    const h = HAZIR_PANOLAR_TAM.find((x) => x.id === ara.get("hazir"));
    if (id && !mevcut) return;
    setYuklendi(true);
    const k = mevcut ?? (h ? { ad: h.ad, gorseller: h.gorseller } : null);
    if (!k) return;
    setAd(k.ad);
    if (mevcut) { setRenkler(mevcut.renkler ?? []); setPaletGonder(!!mevcut.paletGonder); setTarif(mevcut.tarif ?? ""); setKacin(mevcut.kacin ?? ""); setGuc(mevcut.guc ?? "dengeli"); }
    setRefler(k.gorseller.map((url) => ({ id: yeniId(), url, durum: "hazir", w: 0, h: 0 })));
    k.gorseller.forEach((url) => void gorselOlcu(url).then(({ w, h: hh }) => setRefler((l) => l.map((r) => (r.url === url ? { ...r, w, h: hh } : r)))));
  }, [mevcut, hazir, yuklendi, ara, id]);
  // Kayıtlı durum: kaydedilmemiş değişiklik var mı?
  useEffect(() => { if (yuklendi && !kayitli && mevcut) setKayitli(anlik()); }, [yuklendi, refler.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const hazirlar = refler.filter((r) => r.durum === "hazir");
  const urlListesi = hazirlar.map((r) => r.url).join("|");
  useEffect(() => {
    let iptal = false;
    hazirlar.forEach((r) => { if (!olcum[r.url]) void istatistik(r.url).then((o) => { if (!iptal && o) setOlcum((m) => ({ ...m, [r.url]: o })); }); });
    return () => { iptal = true; };
  }, [urlListesi]); // eslint-disable-line react-hooks/exhaustive-deps

  const ekleUrl = (urller: string[]) => {
    const yer = PANO_MAKS_GORSEL - refler.length;
    if (yer <= 0) return void toast.error("Görsel sınırına ulaşıldı", { description: `Pano en çok ${PANO_MAKS_GORSEL} görsel tutar. Yenisi için birini kaldır.` });
    const yeni = urller.filter((u) => !refler.some((r) => r.url === u)).slice(0, yer);
    if (urller.length > yer) toast(`İlk ${yer} görsel alındı`, { description: `Pano en fazla ${PANO_MAKS_GORSEL} görsel tutar.` });
    setRefler((l) => [...l, ...yeni.map((url) => ({ id: yeniId(), url, durum: "hazir" as const, w: 0, h: 0 }))]);
    yeni.forEach((url) => void gorselOlcu(url).then(({ w, h }) => setRefler((l) => l.map((r) => (r.url === url ? { ...r, w, h } : r)))));
  };
  const ekle = useCallback(async (dosyalar: File[]) => {
    const uygun = dosyalar.filter((d) => GORSEL_TURLERI.includes(d.type));
    if (!uygun.length) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    const yer = PANO_MAKS_GORSEL - refler.length;
    if (yer <= 0) return void toast.error("Görsel sınırına ulaşıldı", { description: `Pano en çok ${PANO_MAKS_GORSEL} görsel tutar. Yenisi için birini kaldır.` });
    if (uygun.length > yer) toast(`İlk ${yer} görsel alındı`, { description: `Pano en fazla ${PANO_MAKS_GORSEL} görsel tutar.` });
    for (const d of uygun.slice(0, yer)) {
      if (d.size > 15 * 1024 * 1024) { toast.error(`${d.name} çok büyük`, { description: "En çok 15 MB yükleyebilirsin. Daha küçük bir dosya seç." }); continue; }
      const dataUrl = await dosyaOku(d);
      const rid = yeniId();
      const { w, h } = await gorselOlcu(dataUrl);
      setRefler((l) => [...l, { id: rid, url: dataUrl, durum: "yukleniyor" as const, w, h }].slice(0, PANO_MAKS_GORSEL));
      gorselYukle(dataUrl).then((url) => setRefler((l) => l.map((r) => (r.id === rid ? { ...r, url, durum: "hazir" } : r))))
        .catch((e: Error) => setRefler((l) => l.map((r) => (r.id === rid ? { ...r, durum: "hata", hata: e.message } : r))));
    }
  }, [refler.length]);
  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const l = [...(e.clipboardData?.files ?? [])].filter((x) => GORSEL_TURLERI.includes(x.type));
      if (l.length) { e.preventDefault(); void ekle(l); }
    };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  }, [ekle]);

  const tasi = (from: number, to: number) => setRefler((l) => { if (!l[from] || !l[to] || from === to) return l; const k = [...l]; const [x] = k.splice(from, 1); k.splice(to, 0, x); return k; });
  const paletiCikar = async (sessiz = false) => {
    if (!hazirlar.length) return;
    setPaletYukleniyor(true);
    try {
      const l = await Promise.all(hazirlar.slice(0, STIL_REF_SINIRI).map((r) => paletCikar(r.url, 4).catch(() => [] as string[])));
      const birlesik: string[] = [];
      for (let i = 0; i < 4; i++) for (const p of l) if (p[i] && !birlesik.includes(p[i])) birlesik.push(p[i]);
      setRenkler(birlesik.slice(0, 6));
      if (!birlesik.length && !sessiz) toast.error("Palet çıkarılamadı", { description: "Görsellerden renk okunamadı. Başka görsellerle yeniden dene." });
    } finally { setPaletYukleniyor(false); }
  };
  // Stil görselleri değişince paleti kendiliğinden çıkar (kullanıcı silmediyse).
  const stilAnahtar = hazirlar.slice(0, STIL_REF_SINIRI).map((r) => r.url).join("|");
  const ilkAnahtar = useRef<string | null>(null);
  useEffect(() => {
    if (!stilAnahtar || !yuklendi) return;
    if (ilkAnahtar.current === null) { ilkAnahtar.current = stilAnahtar; if (renkler.length) return; }
    else if (ilkAnahtar.current === stilAnahtar) return;
    ilkAnahtar.current = stilAnahtar;
    void paletiCikar(true);
  }, [stilAnahtar, yuklendi]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Ölçümler ── */
  const olculer = hazirlar.map((r) => ({ r, o: olcum[r.url] })).filter((x) => x.o) as { r: Ref; o: Olcum }[];
  const ort = (k: keyof Olcum) => (olculer.length ? olculer.reduce((a, x) => a + x.o[k], 0) / olculer.length : 0);
  const pSapma = olculer.length > 1 ? sapma(olculer.map((x) => x.o.p)) : 0;
  const sSapma = olculer.length > 1 ? sapma(olculer.map((x) => x.o.s)) : 0;
  const tutarlilik = olculer.length > 1 ? Math.max(0, Math.min(100, Math.round(100 - (pSapma / 0.22) * 50 - (sSapma / 0.12) * 50))) : null;
  const aykiri = new Set(olculer.length > 2 ? olculer.filter((x) => Math.abs(x.o.p - ort("p")) > Math.max(0.18, pSapma * 1.6) || Math.abs(x.o.s - ort("s")) > Math.max(0.1, sSapma * 1.6)).map((x) => x.r.id) : []);
  const dusukCoz = hazirlar.filter((r) => r.w && Math.min(r.w, r.h) < 512);
  const etiketler = olculer.length ? etiketCikar({ p: ort("p"), s: ort("s"), d: ort("d"), k: ort("k") }) : [];
  const tarifOner = () => setTarif(etiketler.map((e) => TARIF_KALIP[e]).filter(Boolean).join(", "));

  /* ── Önizleme ── */
  const m = gorselModelBul(model);
  const demo = b.bagli(m) === false;
  const birim = demo ? 0 : modelKredi(m);
  const panoAdi = ad.trim() || "Adsız pano";
  const onizlemeler = useAracUretimleri(useMemo(() => (u: { arac?: string; meta?: { pano?: string } }) => u.arac === "Ruh Panosu" && (u.meta?.pano === panoAdi || u.meta?.pano === `${panoAdi} · panosuz`), [panoAdi]));
  const yukleniyor = refler.some((r) => r.durum === "yukleniyor");
  const kac = karsilastir ? 2 : 1;
  const degisti = !mevcut || anlik() !== kayitli;

  const kaydetEksik = !hazirlar.length ? "En az bir görsel ekle" : yukleniyor ? "Görseller yükleniyor" : refler.some((r) => r.durum === "hata") ? "Yüklenemeyen görseli kaldır" : !ad.trim() ? "Panoya bir ad ver" : null;
  const kaydet = (): string | null => {
    if (kaydetEksik) { toast.error("Pano kaydedilemedi", { description: `${kaydetEksik}.` }); return null; }
    const st = usePanolar.getState();
    const veri = { ad: ad.trim().slice(0, 40), gorseller: hazirlar.map((r) => r.url), renkler: renkler.length ? renkler : undefined, paletGonder, tarif: tarif.trim() || undefined, kacin: kacin.trim() || undefined, guc, etiketler };
    setKayitli(anlik());
    if (mevcut) { st.panoGuncelle(mevcut.id, veri); toast.success("Pano güncellendi"); return mevcut.id; }
    const yeni = st.panoEkle(veri.ad, veri.gorseller);
    st.panoGuncelle(yeni, veri);
    toast.success(`“${veri.ad}” kaydedildi`, { description: "Görsel stüdyosunda Ruh panosu olarak seçebilirsin." });
    router.replace(`/panel/moodboard/${yeni}`);
    return yeni;
  };
  const onizle = () => {
    if (!hazirlar.length) return void toast.error("Önizleme başlatılamadı", { description: "Önce panoya görsel ekle." });
    if (yukleniyor) return void toast.error("Önizleme başlatılamadı", { description: "Görseller hâlâ yükleniyor. Bitince yeniden dene." });
    if (istem.trim().length < 3) return void toast.error("Önizleme başlatılamadı", { description: "Önizlemenin konusunu birkaç kelimeyle yaz." });
    const ortak = { tur: "gorsel" as const, model, prompt: istem.trim(), kredi: birim, arac: "Ruh Panosu", projeId: aktifProjeId ?? undefined };
    const coz = m.api.cozunurluklar.length ? { cozunurluk: "1K" } : {};
    const s = uretimBaslat({
      ...ortak, baslik: `${panoAdi} · önizleme`,
      meta: { islem: "uret", oran, hamIstem: istem.trim(), stilRefler: hazirlar.slice(0, STIL_REF_SINIRI).map((r) => r.url), stilGuc: guc, pano: panoAdi, ...(tarif.trim() ? { stilIstem: tarif.trim() } : {}), ...(kacin.trim() ? { negatif: kacin.trim() } : {}), ...(paletGonder && renkler.length ? { renkler, palet: panoAdi } : {}), ...coz },
    });
    if (!s.ok) return uretimHataToast(s);
    if (karsilastir) uretimBaslat({ ...ortak, baslik: `${panoAdi} · panosuz`, meta: { islem: "uret", oran, hamIstem: istem.trim(), pano: `${panoAdi} · panosuz`, ...coz } });
    toast.success(karsilastir ? "Panolu ve panosuz üretiliyor" : "Önizleme üretiliyor", { description: `${model} · ${demo ? "Kredi düşmez." : `${krediYaz(birim * kac)} kredi.`}` });
  };

  /* ═════════════ Görseller kartı ═════════════ */
  const yukleGirdi = (
    <input type="file" accept={GORSEL_TURLERI.join(",")} multiple hidden onChange={(e) => { void ekle([...(e.target.files ?? [])]); e.target.value = ""; }} />
  );
  const hazirMenu = (
    <div className="relative">
      <button onClick={() => setHazirAcik((v) => !v)} aria-expanded={hazirAcik} className={cn(CIP, hazirAcik && "bg-white/[0.12]")}><LayoutGrid className="h-4 w-4" /><span className="max-sm:hidden">Hazır panodan</span></button>
      <Yuzen acik={hazirAcik} onKapat={() => setHazirAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Hazır panodan ekle" className={cn("flex max-h-[min(480px,70vh)] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden", POP)}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><LayoutGrid className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Hazır panodan ekle</span></div>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-y-auto p-2.5 [scrollbar-width:thin]">
          {HAZIR_PANOLAR_TAM.map((h) => (
            <button key={h.id} onClick={() => { ekleUrl(h.gorseller); if (!ad) setAd(h.ad); setHazirAcik(false); }} className="group text-left">
              <span className="relative block aspect-square overflow-hidden rounded-[12px] outline outline-1 -outline-offset-1 outline-white/10 transition group-hover:outline-white/40">
                <PanoMozaik gorseller={h.gorseller} className="absolute inset-0 h-full w-full" />
              </span>
              <span className="mt-1 block truncate text-[11.5px] font-medium text-metin-2 group-hover:text-metin">{h.ad}</span>
            </button>
          ))}
        </div>
      </Yuzen>
    </div>
  );
  const kaynakDugmeleri = (
    <div className="flex items-center gap-1.5">
      <label className={cn(CIP, "cursor-pointer")}>{yukleGirdi}<Upload className="h-4 w-4" /><span className="max-sm:hidden">Yükle</span></label>
      <button onClick={() => setKitaplikAcik(true)} className={CIP}><Images className="h-4 w-4" /><span className="max-sm:hidden">Kitaplıktan</span></button>
      {hazirMenu}
    </div>
  );

  const kare = (r: Ref, i: number) => {
    const stil = i < STIL_REF_SINIRI;
    const ayk = aykiri.has(r.id);
    const kisa = r.w ? Math.min(r.w, r.h) : 0;
    return (
      <motion.div key={r.id} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} draggable
        onDragStart={() => setSuruklenen(i)} onDragEnd={() => { setSuruklenen(null); setHedef(null); }}
        onDragOver={(e) => { e.preventDefault(); if (suruklenen !== null) setHedef(i); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setPanoUstunde(false); if (suruklenen !== null) tasi(suruklenen, i); else if (e.dataTransfer.files.length) void ekle([...e.dataTransfer.files]); setSuruklenen(null); setHedef(null); }}
        className={cn("group relative aspect-square cursor-grab overflow-hidden rounded-[16px] bg-white/[0.04] outline outline-2 -outline-offset-2 active:cursor-grabbing",
          r.durum === "hata" ? "outline-rose-400/70" : hedef === i ? "outline-white" : "outline-transparent", suruklenen === i && "opacity-40")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.url} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-500 group-hover:scale-[1.03]", r.durum === "yukleniyor" && "opacity-40", !stil && "brightness-[0.7] group-hover:brightness-100")} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
        {r.durum === "yukleniyor" && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
        {r.durum === "hata" && <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-[10px] bg-black/75 p-2 text-center text-[11px] text-rose-200"><AlertTriangle className="mx-auto mb-1 h-4 w-4" />{r.hata ?? "Yüklenemedi"}</span>}
        <span className="absolute left-2 top-2 flex flex-wrap gap-1">
          {r.durum === "hazir" && (stil
            ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Stil {i + 1}</span>
            : <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur">Panoda</span>)}
          {ayk && <span className="flex items-center gap-1 rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-medium text-[#1a1203]" title="Işık ya da ton diğerlerinden belirgin farklı"><AlertTriangle className="h-3 w-3" />Ayrışıyor</span>}
        </span>
        <button onClick={() => setRefler((l) => l.filter((x) => x.id !== r.id))} aria-label="Görseli kaldır"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition hover:bg-black/80 active:scale-90 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="h-3.5 w-3.5" /></button>
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
          {!stil && r.durum === "hazir"
            ? <button onClick={() => tasi(i, 0)} className="flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black opacity-0 transition active:scale-95 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><ArrowUpLeft className="h-3 w-3" />Stile al</button>
            : <span />}
          {kisa > 0 && kisa < 512 && <span className="rounded-full bg-black/60 px-1.5 py-px text-[10.5px] tabular-nums text-rose-200 backdrop-blur">{kisa} px</span>}
        </span>
      </motion.div>
    );
  };

  const rehber = (
    <div className="border-t border-white/[0.07]">
      <button onClick={() => setRehberAcik((v) => !v)} aria-expanded={rehberAcik} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.02]">
        <span className="flex -space-x-2">{["mb-iyi-0", "mb-iyi-2", "mb-kotu-1"].map((g) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={`/gercek/moodboard/${g}.webp`} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[#16171a]" />))}</span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-medium text-metin">İyi pano nasıl olur?</span><span className="block text-[11.5px] text-metin-2">Tek ışık ve renk dili; konu önemsiz</span></span>
        <ChevronDown className={cn("h-4 w-4 text-metin-2 transition-transform duration-300", rehberAcik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {rehberAcik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="grid gap-2.5 px-3.5 pb-3 sm:grid-cols-2">
              {([
                ["iyi", "Tutarlı pano", "Aynı atmosfer, benzer ton", "Sonuç: her üretimde aynı görsel dil", "bg-emerald-400/15 text-emerald-300", "ring-emerald-400/20", Check],
                ["kotu", "Karışık pano", "Stüdyo, akvaryum, gece bir arada", "Sonuç: model hangi dili izleyeceğini bilemez", "bg-rose-400/15 text-rose-300", "ring-rose-400/20", X],
              ] as const).map(([k, a, alt, sonuc, rozet, halka, I], j) => (
                <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * j }} className={cn("overflow-hidden rounded-[16px] bg-white/[0.025] ring-1 ring-inset", halka)}>
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", rozet)}><I className="h-3.5 w-3.5" strokeWidth={2.6} /></span>
                    <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold text-metin">{a}</span><span className="block text-[11.5px] text-metin-3">{alt}</span></span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 px-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="group relative block aspect-[3/4] overflow-hidden rounded-[10px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/gercek/moodboard/mb-${k}-${i}.webp`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                      </span>
                    ))}
                  </div>
                  <p className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-metin-2"><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", k === "iyi" ? "bg-emerald-300" : "bg-rose-300")} />{sonuc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mx-3.5 mb-3.5 grid grid-cols-3 gap-1.5">
              {([[Sun, "Tek ışık", "Gece ya da gündüz, karıştırma"], [Palette, "Ortak renkler", "Benzer tonlar baskın olsun"], [X, "Yazı yok", "Logo ve metin kopyalanabilir"]] as const).map(([I, a, n]) => (
                <span key={a} className="flex items-start gap-2 rounded-[12px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.05]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><I className="h-3 w-3" /></span>
                  <span className="min-w-0 leading-tight"><span className="block text-[12px] font-semibold text-metin">{a}</span><span className="mt-0.5 block text-[11px] text-metin-3">{n}</span></span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const gorsellerKarti = (
    <section className={cn(KART, "transition-shadow", panoUstunde && "ring-2 ring-white/60")}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <Images className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Görseller</span>
        <span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] tabular-nums text-metin-2">{refler.length}/{PANO_MAKS_GORSEL}</span>
        <span className="flex-1" />
        {refler.length > 0 && kaynakDugmeleri}
      </div>
      {refler.length ? (
        <div className="p-2.5">
          <div className={cn("grid gap-2", masaustu ? "grid-cols-4" : "grid-cols-2")}>
            {refler.map(kare)}
            {refler.length < PANO_MAKS_GORSEL && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[16px] border border-dashed border-white/15 text-center transition hover:border-white/35 hover:bg-white/[0.03]">
                {yukleGirdi}
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black"><Plus className="h-5 w-5" /></span>
                <span className="text-[13px] font-semibold text-metin">Görsel ekle</span>
                <span className="-mt-1.5 text-[11.5px] tabular-nums text-metin-2">{PANO_MAKS_GORSEL - refler.length} yer kaldı</span>
              </label>
            )}
          </div>
          <p className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-metin-2"><Info className="h-3.5 w-3.5" />Sürükleyerek sırala; ilk {STIL_REF_SINIRI} görsel stil olarak modele gider</p>
        </div>
      ) : (
        <div className={cn("m-3 flex flex-col items-center rounded-[18px] border border-dashed px-5 pb-6 pt-8 text-center transition-colors", panoUstunde ? "border-white/60 bg-white/[0.05]" : "border-white/15")}>
          <div className="mb-5 flex -space-x-6">
            {["/gercek/moodboard/mood-h1.webp", "/gercek/moodboard/mood-warm.webp", "/gercek/moodboard/mood-theatr.webp"].map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img key={g} src={g} alt="" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.85, y: Math.abs(i - 1) * 6, rotate: (i - 1) * 7 }} transition={{ delay: i * 0.06 }} className="h-28 w-[88px] rounded-[16px] object-cover ring-[3px] ring-[#16171a]" />
            ))}
          </div>
          <p className="text-[17px] font-semibold text-metin">Aynı ruhu taşıyan 4-8 görsel bırak</p>
          <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] text-metin-2">Benzer ışık, renk ve doku yeter; konu önemsiz.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95">{yukleGirdi}<Upload className="h-4 w-4" />Görsel yükle</label>
            <button onClick={() => setKitaplikAcik(true)} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Images className="h-4 w-4" />Kitaplıktan</button>
          </div>
          <span className="mt-3 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-metin-2 max-sm:hidden">Sürükle bırak ya da yapıştır <kbd>Ctrl</kbd><kbd>V</kbd></span>
          <div className="mt-6 w-full max-w-[560px] border-t border-white/[0.07] pt-4">
            <p className="mb-2.5 text-[12.5px] text-metin-2">ya da hazır bir panoyla başla</p>
            <div className={cn("grid gap-2", masaustu ? "grid-cols-4" : "grid-cols-2")}>
              {HAZIR_PANOLAR_TAM.filter((h) => h.gorseller.length > 1 || ["sicak-ambiyans", "frutiger-aero"].includes(h.id)).slice(0, 4).map((h) => (
                <button key={h.id} onClick={() => { ekleUrl(h.gorseller); if (!ad) setAd(h.ad); }} className="group text-left">
                  <span className="relative block aspect-square overflow-hidden rounded-[12px] outline outline-1 -outline-offset-1 outline-white/10 transition group-hover:outline-white/40">
                    <PanoMozaik gorseller={h.gorseller} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-1.5 block truncate text-[12px] font-medium text-metin-2 group-hover:text-metin">{h.ad}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {rehber}
    </section>
  );

  /* ═════════════ Panoyu dene ═════════════ */
  const modeller = GORSEL_MODELLER.filter((x) => x.api.refMax > STIL_REF_SINIRI && x.tip !== "swap" && !x.api.refZorunlu && !x.gizli);
  const dene = (
    <section className={KART}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Panoyu dene</span>
        {onizlemeler.length > 0 && <span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] tabular-nums text-metin-2">{onizlemeler.length}</span>}
        <span className="ml-auto text-[12px] text-metin-2 max-sm:hidden">Kaydetmeden önce panonun bir konuya nasıl yansıdığını gör</span>
      </div>
      <div className="p-2.5">
        {onizlemeler.length === 0 ? (
          <div className={cn("grid gap-2", masaustu ? "grid-cols-[repeat(2,minmax(0,220px))]" : "grid-cols-2")}>
            {["Panolu", "Panosuz"].map((e, i) => (
              <div key={e} className={cn("relative overflow-hidden rounded-[16px] bg-white/[0.03] transition-opacity", i === 1 && !karsilastir && "opacity-35")} style={{ aspectRatio: oran.replace(":", " / ") }}>
                {i === 0 && hazirlar.length > 0 && <PanoMozaik gorseller={hazirlar.slice(0, STIL_REF_SINIRI).map((r) => r.url)} className="absolute inset-0 h-full w-full scale-110 opacity-30 blur-2xl saturate-150" />}
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin-2">{i === 0 ? <Layers className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
                  <span className="text-[12.5px] text-metin-2">{i === 0 ? "Panolu sonuç burada" : karsilastir ? "Aynı istem, panosuz" : "Karşılaştırma kapalı"}</span>
                </span>
                <span className={cn("absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium", i === 0 ? "bg-white text-black" : "bg-black/60 text-white/85")}>{e}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-1.5", masaustu ? "grid-cols-4" : "grid-cols-2")}>
            <AnimatePresence initial={false}>
              {onizlemeler.map((u) => <OnizlemeKutusu key={u.id} u={u} panosuz={String(u.meta?.pano ?? "").endsWith("· panosuz")} onAc={() => setSecili(u.id)} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
      {/* Komut kutusu */}
      <div className={cn("m-2.5 mt-0 rounded-[22px] p-2.5", YUZEY)}>
        <div className="gizli-scroll flex items-center gap-1.5 overflow-x-auto">
          {KONULAR.map((k) => {
            const sec = istem === k.istem;
            return (
              <button key={k.id} onClick={() => setIstem(k.istem)} aria-pressed={sec}
                className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-3 text-[12.5px] font-medium transition active:scale-95", sec ? "bg-white text-black" : "bg-white/[0.07] text-metin hover:bg-white/[0.12]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={k.gorsel} alt="" className="h-7 w-7 rounded-full object-cover" />{k.ad}
              </button>
            );
          })}
        </div>
        <textarea value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 400))} rows={2} aria-label="Önizleme istemi" spellCheck={false}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onizle(); } }}
          placeholder="Ne görmek istersin? Panonun ışığı, rengi ve dokusu uygulanır"
          className="mt-1.5 block w-full resize-none bg-transparent px-1.5 py-1.5 text-[14.5px] leading-relaxed text-metin outline-none placeholder:text-metin-2" />
        <div className="flex items-center gap-1.5 max-sm:flex-wrap">
          <div className="relative">
            <button onClick={() => setCip(cip === "model" ? null : "model")} aria-expanded={cip === "model"} className={cn(CIP, "pl-1", cip === "model" && "bg-white/[0.12]")}>
              <ModelLogo ad={model} /><span className="max-w-[140px] truncate">{model}</span><ChevronDown className={cn("-mr-1 h-3.5 w-3.5 text-metin-2 transition-transform", cip === "model" && "rotate-180")} />
            </button>
            <Yuzen acik={cip === "model"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Model" className={cn("flex max-h-[56vh] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden", POP)}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Stil referansı alan modeller</span></div>
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
                {modeller.map((x) => {
                  const sec = x.ad === model;
                  return (
                    <button key={x.ad} onClick={() => { setModel(x.ad); setCip(null); if (x.api.oranlar.length && !x.api.oranlar.includes(oran)) setOran(x.api.oranlar.includes("3:4") ? "3:4" : x.api.oranlar[0]); }} className="relative flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.05]">
                      {sec && <motion.span layoutId="pano-model" transition={YAY} className="absolute inset-0 rounded-[12px] bg-white/[0.08]" />}
                      <span className="relative"><ModelLogo ad={x.ad} boyut={34} /></span>
                      <span className="relative min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{x.ad}</span><span className="block truncate text-[12px] text-metin-2">{x.ozet}</span></span>
                      <span className="relative flex shrink-0 items-center gap-1.5">{b.bagli(x) !== false && <KrediHap deger={modelKredi(x)} secili={sec} />}{sec && <Check className="h-4 w-4 text-white" />}</span>
                    </button>
                  );
                })}
              </div>
            </Yuzen>
          </div>
          <div className="relative">
            <button onClick={() => setCip(cip === "oran" ? null : "oran")} aria-expanded={cip === "oran"} aria-label="Oran" className={cn(CIP, cip === "oran" && "bg-white/[0.12]")}><OranSekli oran={oran} boyut={14} /><span className="tabular-nums">{oran}</span></button>
            <Yuzen acik={cip === "oran"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Oran" className={cn("w-[270px] p-2", POP)}>
              <div className="grid grid-cols-5 gap-1">
                {ONIZ_ORAN.filter((o) => !m.api.oranlar.length || m.api.oranlar.includes(o)).map((o) => (
                  <button key={o} onClick={() => { setOran(o); setCip(null); }} aria-pressed={oran === o}
                    className={cn("flex h-[54px] flex-col items-center justify-center gap-1.5 rounded-[12px] text-[11px] font-semibold tabular-nums transition", oran === o ? "bg-white text-black" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
                    <OranSekli oran={o} boyut={18} />{o}
                  </button>
                ))}
              </div>
            </Yuzen>
          </div>
          <button onClick={() => setKarsilastir((v) => !v)} role="switch" aria-checked={karsilastir} title="Aynı istemi panosuz da üretir; farkı yan yana görürsün" className={cn(CIP, "gap-2.5 pl-2.5")}>
            <span className={cn("relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors", karsilastir ? "bg-white" : "bg-white/15")} style={{ minWidth: 28 }}><span className={cn("absolute left-0 top-0.5 h-3 w-3 rounded-full transition-transform", karsilastir ? "translate-x-[14px] bg-black" : "translate-x-0.5 bg-white")} /></span>
            <span className="whitespace-nowrap">Panosuzla karşılaştır</span>
          </button>
          <span className="flex-1 max-sm:hidden" />
          <button onClick={onizle} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white pl-4 pr-1.5 text-[14px] font-semibold text-black transition active:scale-95 max-sm:h-11 max-sm:w-full max-sm:justify-center">
            <Sparkles className="h-4 w-4" />{karsilastir ? "2 görsel üret" : "Önizle"}
            <span className="flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-1 text-[12px] leading-none tabular-nums">{demo ? "Ücretsiz" : <><KrediYildiz className="h-3 w-3" />{krediYaz(birim * kac)}</>}</span>
          </button>
        </div>
      </div>
    </section>
  );

  /* ═════════════ Stil kartı (sağ) ═════════════ */
  const altKart = (Ik: React.ElementType, baslik: string, sag: React.ReactNode, govde: React.ReactNode) => (
    <section className={KART}>
      <div className="flex min-h-[46px] items-center gap-2 border-b border-white/[0.07] px-3.5 py-2"><Ik className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">{baslik}</span><span className="ml-auto flex items-center">{sag}</span></div>
      <div className="p-3">{govde}</div>
    </section>
  );
  const kucukDugme = "flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-40";
  const stilKarti = (
    <>
      {altKart(Layers, ad.trim() || "Adsız pano", <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{hazirlar.length} görsel</span>, (
        <>
          <div className={cn("relative overflow-hidden rounded-[14px] bg-white/[0.03]", hazirlar.length ? "aspect-[16/10]" : "flex h-[120px] items-center justify-center")}>
            {hazirlar.length > 0 ? <PanoMozaik gorseller={hazirlar.map((r) => r.url)} className="absolute inset-0 h-full w-full" />
              : <span className="flex flex-col items-center gap-2 text-center"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-metin-3"><Images className="h-4 w-4" /></span><span className="text-[12px] text-metin-3">Görsel ekleyince kapak oluşur</span></span>}
          </div>
          {hazirlar.length > 0 && <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-metin-2"><span className="h-1.5 w-1.5 rounded-full bg-white/60" />İlk {Math.min(STIL_REF_SINIRI, hazirlar.length)} görsel stil referansı olarak modele gider</p>}
        </>
      ))}
      {altKart(Palette, "Palet", <button onClick={() => void paletiCikar()} disabled={!hazirlar.length || paletYukleniyor} className={kucukDugme}>{paletYukleniyor ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pipette className="h-3 w-3" />}Yeniden çıkar</button>, (
        <>
          {renkler.length ? (
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${renkler.length}, minmax(0, 1fr))` }}>
              {renkler.map((r, k) => (
                <motion.div key={r} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * k }} className="group relative">
                  <button onClick={() => void mesaj.kopyala(r, r)} title={`${r}, kopyala`} className="block h-12 w-full rounded-[12px] ring-1 ring-inset ring-white/[0.12] transition-transform duration-200 group-hover:-translate-y-0.5" style={{ background: r }} />
                  <span className="mt-1 block text-center text-[10.5px] uppercase tabular-nums text-metin-3">{r.replace("#", "")}</span>
                  <button onClick={() => setRenkler((l) => l.filter((x) => x !== r))} aria-label={`${r} kaldır`} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white opacity-0 ring-1 ring-white/15 transition group-hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
                </motion.div>
              ))}
            </div>
          ) : <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.05]">{hazirlar.length ? "Renkler çıkarılıyor" : "Görsel ekleyince renkler kendiliğinden çıkar"}</p>}
          <button onClick={() => (renkler.length ? setPaletGonder((v) => !v) : undefined)} role="switch" aria-checked={paletGonder && renkler.length > 0} disabled={!renkler.length}
            className="mt-2.5 flex w-full items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-left ring-1 ring-inset ring-white/[0.05] disabled:opacity-40">
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[12.5px] font-semibold text-metin">Renkleri de gönder</span><span className="block text-[11.5px] text-metin-3">Renk kodları istemde yönerge olur</span></span>
            <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", paletGonder && renkler.length ? "bg-white" : "bg-white/15")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-transform", paletGonder && renkler.length ? "translate-x-[18px] bg-black" : "translate-x-0.5 bg-white")} /></span>
          </button>
        </>
      ))}
      {altKart(Wand2, "Ruh", tutarlilik != null ? <span className="text-[12px] tabular-nums text-metin-2">Tutarlılık <b className="font-semibold text-metin">{tutarlilik}</b></span> : null, (
        <>
          {tutarlilik != null && (
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${tutarlilik}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={cn("h-full rounded-full", tutarlilik >= 80 ? "bg-emerald-300" : tutarlilik >= 55 ? "bg-white" : "bg-amber-300")} />
            </div>
          )}
          {etiketler.length ? (
            <div className="flex flex-wrap gap-1.5">
              {etiketler.map((e, k) => <motion.span key={e} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] text-metin ring-1 ring-inset ring-white/[0.06]">{e}</motion.span>)}
            </div>
          ) : <p className="text-[12px] text-metin-3">Görsel ekleyince ışık, ton ve renk ölçülür</p>}
          {(aykiri.size > 0 || dusukCoz.length > 0) && (
            <div className="mt-2.5 space-y-1.5">
              {aykiri.size > 0 && <p className="flex items-center gap-2 rounded-[12px] bg-amber-300/[0.06] px-3 py-2 text-[12px] text-amber-100 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{aykiri.size} görsel panonun genel dilinden ayrışıyor</p>}
              {dusukCoz.length > 0 && <p className="flex items-center gap-2 rounded-[12px] bg-amber-300/[0.06] px-3 py-2 text-[12px] text-amber-100 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{dusukCoz.length} görsel 512 px altında, detay az aktarılır</p>}
            </div>
          )}
        </>
      ))}
      {altKart(SlidersHorizontal, "Stil tarifi", <button onClick={tarifOner} disabled={!etiketler.length} className={kucukDugme}><Sparkles className="h-3 w-3" />Ölçümden öner</button>, (
        <>
          <textarea value={tarif} onChange={(e) => setTarif(e.target.value.slice(0, 300))} rows={3} aria-label="Stil tarifi" spellCheck={false}
            placeholder="İsteğe bağlı: grenli 35 mm film, kehribar lambalar, yumuşak gölgeler"
            className="block w-full resize-none rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-3 focus:ring-white/35" />
          <label className="mt-2 flex h-10 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/35">
            <Ban className="h-4 w-4 shrink-0 text-metin-3" />
            <input value={kacin} onChange={(e) => setKacin(e.target.value.slice(0, 160))} placeholder="Kaçın: yazı, logo, parlak renk" aria-label="Kaçınılacaklar" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
          </label>
        </>
      ))}
      {altKart(Layers, "Pano gücü", <span className="text-[12px] text-metin-3">{GUCLER.find((g) => g.id === guc)!.alt}</span>, (
        <div className="isolate flex rounded-full bg-white/[0.05] p-[3px]">
          {GUCLER.map((g) => (
            <button key={g.id} onClick={() => setGuc(g.id)} className={cn("relative h-9 flex-1 rounded-full text-[13px] font-medium transition-colors duration-200", guc === g.id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {guc === g.id && <motion.span layoutId="pano-guc" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 -z-10 rounded-full bg-white" />}{g.ad}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  if (id && hazir && !mevcut) return (
    <div className="flex min-h-[calc(100dvh-var(--ust-nav))] items-center justify-center bg-[#0b0b0c] p-6">
      <section className={cn(KART, "w-full max-w-[420px]")}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3"><Palette className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Pano bulunamadı</span></div>
        <p className="px-4 py-3 text-[13px] text-metin-2">Silinmiş ya da bu tarayıcıda oluşturulmamış olabilir.</p>
        <div className="flex gap-2 border-t border-white/[0.07] p-3">
          <button onClick={() => router.push("/panel/moodboard")} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black active:scale-95"><ChevronLeft className="h-4 w-4" />Panolara dön</button>
          <button onClick={() => router.push("/panel/moodboard/yeni")} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin"><Plus className="h-4 w-4" />Yeni pano</button>
        </div>
      </section>
    </div>
  );

  const modallar = (
    <>
      <AnimatePresence>{secili && <SonucGoruntuleyici liste={onizlemeler.filter((u) => u.durum === "tamam" || u.durum === "hata")} id={secili} onSec={setSecili} onKapat={() => setSecili(null)} />}</AnimatePresence>
      <AnimatePresence>
        {kitaplikAcik && <KitaplikPaneli tur="gorsel" turler={["gorsel"]} alt="Panoya eklemek istediğin görseli seç" eylem="Ekle" eylemIkon={Plus} onKapat={() => setKitaplikAcik(false)} onYukle={() => (document.querySelector("label input[type=file]") as HTMLInputElement | null)?.click()} onSec={(u: Uretim) => { const g = uretimGorseli(u); if (g) ekleUrl([g]); toast.success("Görsel panoya eklendi"); }} />}
      </AnimatePresence>
    </>
  );
  const kaydetDugmesi = (
    <button onClick={() => void kaydet()} title={kaydetEksik ?? undefined} disabled={!!mevcut && !degisti}
      className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition active:scale-95", mevcut && !degisti ? "bg-white/[0.08] text-metin-2" : "bg-white text-black")}>
      <Check className="h-4 w-4" strokeWidth={2.6} />{mevcut ? (degisti ? "Kaydet" : "Kaydedildi") : "Panoyu kaydet"}
    </button>
  );
  const kullanDugmesi = mevcut && (
    <button onClick={() => router.push(`/panel/gorsel?pano=${mevcut.id}`)} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Sparkles className="h-4 w-4" /><span className="max-sm:hidden">Görsel stüdyosunda kullan</span></button>
  );
  const baslik = (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0b0b0c]/85 px-3 backdrop-blur-xl sm:px-4">
      <button onClick={() => router.push("/panel/moodboard")} aria-label="Panolara dön" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><ChevronLeft className="h-5 w-5" /></button>
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 40))} placeholder="Panoya ad ver" aria-label="Pano adı" spellCheck={false}
          className="min-w-0 flex-1 rounded-[10px] bg-transparent px-2 py-1 text-[20px] font-semibold tracking-[-0.01em] text-metin outline-none transition placeholder:text-metin-2 hover:bg-white/[0.04] focus:bg-white/[0.06] max-sm:text-[17px]" />
      </label>
      {masaustu && kaydetEksik && <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-metin-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />{kaydetEksik}</span>}
      {kullanDugmesi}
      {kaydetDugmesi}
    </header>
  );

  const zemin = "bg-[#0b0b0c] bg-[radial-gradient(ellipse_at_50%_0%,#18191c_0%,#0b0b0c_55%)]";
  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div className={cn("min-h-[100dvh] overflow-x-clip", zemin)}>
        {baslik}
        <div className="space-y-3 px-3 pb-10 pt-3">
          {gorsellerKarti}
          {stilKarti}
          {dene}
        </div>
        {modallar}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div className={cn("h-[calc(100vh-var(--ust-nav))] overflow-y-auto [scrollbar-width:thin]", zemin)}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setPanoUstunde(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setPanoUstunde(false); }}
      onDrop={(e) => { e.preventDefault(); setPanoUstunde(false); if (e.dataTransfer.files.length) void ekle([...e.dataTransfer.files]); }}>
      {baslik}
      <div className="mx-auto grid max-w-[1400px] items-start gap-3 px-4 pb-16 pt-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          {gorsellerKarti}
          {dene}
        </div>
        <aside className="sticky top-20 space-y-3">{stilKarti}</aside>
      </div>
      {modallar}
    </div>
  );
}

function ModelLogo({ ad, boyut = 26 }: { ad: string; boyut?: number }) {
  const l = modelLogoUrl(ad);
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-white/[0.1]" style={{ width: boyut, height: boyut }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {l ? <img src={l} alt="" aria-hidden style={{ width: boyut * 0.56, height: boyut * 0.56 }} /> : <Sparkles className="text-metin-2" style={{ width: boyut * 0.45, height: boyut * 0.45 }} />}
    </span>
  );
}

/** Önizleme sonucu: sürerken yükleme kartı, bitince sonuç kartı; panolu ve panosuz etiketlenir. */
function OnizlemeKutusu({ u, panosuz, onAc }: { u: Uretim; panosuz: boolean; onAc: () => void }) {
  const suruyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const [w, h] = String(u.meta?.oran ?? "3:4").split(":").map(Number);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="relative">
      {suruyor ? (
        <div className="relative overflow-hidden rounded-[14px] bg-[#121214]" style={{ aspectRatio: `${w || 3} / ${h || 4}` }}>
          <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} />
        </div>
      ) : <SonucKarti u={u} onAc={onAc} demoGizle />}
      <span className={cn("pointer-events-none absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[11px] font-medium", panosuz ? "bg-black/60 text-white/85 backdrop-blur" : "bg-white text-black")}>{panosuz ? "Panosuz" : "Panolu"}</span>
    </motion.div>
  );
}

