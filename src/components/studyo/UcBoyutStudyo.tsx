"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Smartphone,
  Box, Boxes, Camera, Check, Cpu, Download, Focus, Grid3x3, Image as ImageIcon, Layers, Loader2, Maximize2, Paintbrush, PersonStanding,
  Plus, Printer, Repeat, RotateCw, Dices, Hash, Triangle, Settings2, Sparkles, Sun, Trash2, TriangleAlert, Type, Wand2, X, Star, ArrowUpRight,
} from "lucide-react";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriRozeti, KartDahaMenusu, YenidenKullanDugmesi, FavoriDugmesi } from "@/components/galeri/KartEylemleri";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { istemTemizlensinMi, zamanaGoreSirala } from "@/lib/galeri/gorunum";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimGeriYukle } from "@/components/studyo/bildirim";
import { cn } from "@/lib/utils";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { useIstemParametresi } from "@/lib/useIstemParametresi";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useMasaustu } from "@/hooks/useMasaustu";
import { Yuzen } from "@/components/ui/Yuzen";
import { KCip, IzgaraSec } from "./Cip";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { AltSayfa } from "./hf";
import { Segment, Kaydirici } from "@/components/montaj/ui";
import { ArVideoPaneli } from "./ucboyut/ArVideoPaneli";
import { Sahne, ISIKLAR, ARKALAR, type Gorunum, type Isik, type Arka, type SahneApi, type SahneBilgi } from "./ucboyut/Sahne";
import { AracPaneli, ARAC_BILGI, type AracAyar } from "./ucboyut/AracPaneli";
import { Olcer, PozFigur } from "./ucboyut/Figur";
import { OzelGirdi } from "@/components/film/ortak";
import { MODELLER_3D, STILLER, POZLAR_3D, POLIGON_HAZIR, GORUNUSLER, ORNEKLER, kisaSayi, type Arac, type GirdiMod } from "./ucboyut/veri";

/**
 * 3D Stüdyo — ortada tam ekran 3D sahne, altta yüzen komut kutusu (Metin / Görsel / Çoklu görünüm,
 * model-stil-topoloji-poz çipleri), sağda Modellerim. Akış: Üret → 4 dokusuz taslak → birini seç →
 * Detaylandır (dokulu model) → araçlar (Dokula, Remesh, Rig, Baskı, İndir); her işlem yeni sürüm açar.
 */
const ARAC_AD = "3D Stüdyo";
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const IKON = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin disabled:pointer-events-none disabled:opacity-30";
const PANEL = "rounded-full bg-[#1b1c1f] ring-1 ring-inset ring-white/[0.09]";
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const MOD_AD: Record<string, string> = { taslak: "Taslak", detay: "Model", doku: "Yeni doku", remesh: "Remesh", rig: "Rig", baski: "Baskı" };
const GORUNUMLER: [Gorunum, string, typeof Box][] = [["doku", "Dokulu", Paintbrush], ["kil", "Kil", Box], ["tel", "Tel kafes", Grid3x3]];
const ARACLAR: [Arac, string, typeof Box][] = [["doku", "Dokula", Paintbrush], ["remesh", "Remesh", Boxes], ["rig", "Rig", PersonStanding], ["baski", "Baskı", Printer], ["indir", "İndir", Download]];

type Kurulum = { model?: string; stil?: string; poz?: string; topoloji?: "quad" | "triangle"; poligon?: number; simetri?: "auto" | "on" | "off" | boolean; tohum?: number; girdi?: GirdiMod; onizleme?: string[]; pbr?: boolean; cozunurluk?: string };
const kurulumu = (u?: Uretim | null): Kurulum => (u?.meta?.kurulum ?? {}) as Kurulum;
const arkaPlan = (s?: string) => (!s ? undefined : s.startsWith("url(") || s.includes("gradient") ? s : `url("${s}") center/contain no-repeat`);

/** Araç işlemi için kaynak model: sağlayıcı görevi ya da herkese açık GLB adresi (örnek ve yerel dosyalar gönderilmez). */
const kaynakModel = (u: Uretim): { kaynakGorev?: { id?: string; tur?: string }; kaynakGlb?: string } => ({
  ...(u.gercek && u.meta?.saglayiciGorev ? { kaynakGorev: u.meta.saglayiciGorev } : {}),
  ...(u.gercek && u.glbUrl && /^https:\/\//.test(u.glbUrl) ? { kaynakGlb: u.glbUrl } : {}),
});

/** Görseli 160 px'lik küçük önizlemeye indirir (kayıtta saklanır; büyük dosya depoya yazılmaz). */
async function kucult(dataUrl: string): Promise<string> {
  return new Promise((coz) => {
    const img = new Image();
    img.onload = () => {
      const o = Math.min(1, 160 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      coz(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => coz("");
    img.src = dataUrl;
  });
}
const dosyaOku = (f: File) => new Promise<string>((coz, red) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.onerror = red; r.readAsDataURL(f); });
const indirUrl = (url: string, ad: string) => { const a = document.createElement("a"); a.href = url; a.download = ad; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); };
const dosyaAdi = (s: string) => s.replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, "").trim().slice(0, 40) || "vayra-3d";

export function UcBoyutStudyo() {
  const yanBoy = useKenarStili("ucboyut-yan", 320);
  const { aktifProjeId } = useAktifProje();
  const masaustu = useMasaustu();
  const saglayici = useSaglayicilar();
  const bagli = saglayici?.meshy === true;
  const demo = saglayici !== null && !bagli;

  const tum = useProjeler((s) => s.uretimler);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  /* Görünüm ayarı: sıralama, sütun yoğunluğu ve gönderdikten sonra istemi temizle (sayfa başına kalıcı). */
  const [galeriGorunum] = useGorunum("3d");
  const guncelle = useProjeler((s) => s.guncelle);
  const sil = useProjeler((s) => s.sil);
  // Yalnız bu stüdyonun kayıtları ve 3D dosyası olanlar (dosyasız eski örnek kayıtlar sahnede boş kalırdı).
  const modeller = useMemo(() => tum.filter((u) => u.tur === "3d" && (!!u.glbUrl || !!u.meta?.mod)), [tum]);

  /* ── Komut kutusu ── */
  const [girdi, setGirdi] = useState<GirdiMod>("metin");
  const [istem, setIstem] = useState("");
  /* ?istem= (üst çubuktaki komut paleti, paylaşılan bağlantılar): metinden 3D isteği olarak yazılır. */
  useIstemParametresi((i) => { setGirdi("metin"); setIstem(i.slice(0, 800)); });
  const [gorseller, setGorseller] = useState<(string | null)[]>([null, null, null, null]);
  const [modelId, setModelId] = useState<string>(MODELLER_3D[0].id);
  /** Karşılaştırma: aynı girdi birden çok modelde (en çok 3); boşsa yalnız seçili model. */
  const [kiyas, setKiyas] = useState<string[]>([]);
  // Görsel stüdyosundan "3D'ye çevir": ?gorsel= adresiyle gelen görsel girdiye yerleşir.
  const arama = useSearchParams();
  useEffect(() => {
    const g = arama.get("gorsel");
    if (g && /^(\/|https:\/\/|blob:|data:image\/)/.test(g)) { setGirdi("gorsel"); setGorseller([g, null, null, null]); toast.success("Görsel 3D girdisine eklendi", { description: "İstersen not ekle, sonra Üret." }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [stilId, setStilId] = useState<string>("gercekci");
  const [poz, setPoz] = useState<string>("serbest");
  const [topoloji, setTopoloji] = useState<"quad" | "triangle">("triangle");
  const [poligon, setPoligon] = useState(30000);
  const [simetri, setSimetri] = useState<"auto" | "on" | "off">("auto");
  const [tohum, setTohum] = useState("");
  const [cip, setCip] = useState<string | null>(null);
  const yukleRef = useRef<HTMLInputElement>(null);
  const yuvaRef = useRef(0);
  const istemRef = useRef<HTMLTextAreaElement>(null);

  /* ── Sahne ── */
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [ornek, setOrnek] = useState<number | null>(null);
  const [gorunum, setGorunum] = useState<Gorunum>("doku");
  const [isik, setIsik] = useState<Isik>("studyo");
  const [arka, setArka] = useState<Arka>("koyu");
  const [donme, setDonme] = useState(true);
  const [isikAcik, setIsikAcik] = useState(false);
  const [bilgi, setBilgi] = useState<SahneBilgi | null>(null);
  const [arac, setArac] = useState<Arac | null>(null);
  const [filtre, setFiltre] = useState<"tumu" | "taslak" | "model">("tumu");
  const [mobilListe, setMobilListe] = useState(false);
  const [dokulu, setDokulu] = useState(true);
  const [coz, setCoz] = useState<"2K" | "4K">("2K");
  const sahneRef = useRef<SahneApi>(null);
  const [arAcik, setArAcik] = useState(false);

  const model = MODELLER_3D.find((m) => m.id === modelId) ?? MODELLER_3D[0];
  const [stilOzel, setStilOzel] = useState("");
  const stil = stilId === "ozel" ? { ...STILLER[0], id: "ozel", ad: stilOzel.trim() || "Özel", alt: "Kendi tarifin", istem: stilOzel.trim() } : STILLER.find((s) => s.id === stilId) ?? STILLER[0];
  const secili = modeller.find((u) => u.id === seciliId) ?? null;
  const k = kurulumu(secili);
  const mod = secili?.meta?.mod ?? "detay";
  const surecte = !!secili && (secili.durum === "kuyrukta" || secili.durum === "isleniyor");
  const aday = secili?.secilenVaryasyon ?? 0;
  const aktifIs = modeller.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;

  /* Seçili yoksa en yeni modeli aç; ilk açılışta liste boşsa örnek gösterilmez (karşılama). */
  useEffect(() => { if (!seciliId && ornek === null) { if (modeller[0]) setSeciliId(modeller[0].id); else setOrnek(0); } }, [seciliId, ornek, modeller]);
  useEffect(() => { if (seciliId && !modeller.some((u) => u.id === seciliId)) setSeciliId(null); }, [seciliId, modeller]);
  /* Kitaplıktan gelen derin bağlantı: ?u=<id> o modeli açar. */
  useEffect(() => { const id = new URLSearchParams(window.location.search).get("u"); if (id) { setOrnek(null); setSeciliId(id); } }, []);
  useEffect(() => { setCip(null); }, [girdi]);

  /* Derin bağlantı (?mod=gorsel) ve Görsel stüdyosundan "3D'ye çevir" ile gelen görsel. */
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mod");
    if (m === "gorsel" || m === "coklu" || m === "metin") setGirdi(m);
    const ref = sessionStorage.getItem("vayra-3d-ref");
    if (ref) { sessionStorage.removeItem("vayra-3d-ref"); setGirdi("gorsel"); setGorseller([ref, null, null, null]); toast.success("Görsel 3D için eklendi", { description: "Model ve stil seçip üretebilirsin." }); }
  }, []);

  /* Sağlayıcı bağlı değilken (demo) tamamlanan kayıtları motorumuzun gerçek örnek çıktılarıyla doldurur:
     taslak → 4 dokusuz aday, diğer işlemler → seçilen adayın dokulu modeli ya da kaynağın kopyası. */
  useEffect(() => {
    for (const u of modeller) {
      if (u.durum !== "tamam" || u.arac !== ARAC_AD) continue;
      const m = u.meta?.mod;
      if (m === "taslak" && !u.varyasyonlar?.length) {
        guncelle(u.id, { varyasyonlar: u.gercek && u.glbUrl ? [{ thumb: u.thumbnailUrl ?? "", glb: u.glbUrl }] : ornekSirasi(`${u.meta?.hamIstem ?? ""} ${u.baslik}`).map((o) => ({ thumb: o.hamPoster, glb: o.ham })), secilenVaryasyon: 0 });
      } else if (m && m !== "taslak" && !u.glbUrl) {
        const kaynak = modeller.find((x) => x.id === u.meta?.kaynakId);
        const kaynakGlb = kaynak?.varyasyonlar?.[kaynak.secilenVaryasyon ?? 0]?.glb;
        const o = ORNEKLER.find((x) => x.ham === kaynakGlb || x.glb === kaynakGlb) ?? ornekSirasi(`${u.meta?.hamIstem ?? ""} ${u.baslik}`)[0];
        guncelle(u.id, m === "detay" ? { glbUrl: o.glb, thumbnailUrl: o.poster } : { glbUrl: kaynak?.glbUrl ?? o.glb, thumbnailUrl: kaynak?.thumbnailUrl ?? o.poster });
      }
    }
  }, [modeller, guncelle]);

  /* Sahnede gösterilecek dosya. */
  const sahne = useMemo(() => {
    if (ornek !== null) { const o = ORNEKLER[ornek]; return { glb: o.glb, poster: o.poster }; }
    if (!secili || surecte || secili.durum === "hata") return null;
    if (mod === "taslak") { const v = secili.varyasyonlar?.[aday]; return v?.glb ? { glb: v.glb, poster: v.thumb } : null; }
    return secili.glbUrl ? { glb: secili.glbUrl, poster: secili.thumbnailUrl } : null;
  }, [ornek, secili, surecte, mod, aday]);
  useEffect(() => { setBilgi(null); }, [sahne?.glb]);
  // Taslaklar dokusuz gelir: kil görünümü daha okunur.
  useEffect(() => { setGorunum(mod === "taslak" && ornek === null ? "kil" : "doku"); }, [seciliId, mod, ornek]);
  useEffect(() => { if (!secili || surecte || mod === "taslak") setArac(null); }, [secili, surecte, mod]);
  useEffect(() => { if (arac) setArAcik(false); }, [arac]);

  /* ── Sürüm zinciri (kaynaktan bugüne) ── */
  const zincir = useMemo(() => {
    const l: Uretim[] = [];
    let u = secili;
    for (let i = 0; u && i < 8; i++) { l.unshift(u); u = modeller.find((x) => x.id === u!.meta?.kaynakId) ?? null; }
    return l;
  }, [secili, modeller]);

  /* ── Görsel yükleme ── */
  const gorselEkle = async (dosyalar: FileList | File[], yuva?: number) => {
    const liste = [...dosyalar].filter((f) => /^image\/(png|jpe?g|webp)$/.test(f.type));
    if (!liste.length) return mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    if (liste.some((f) => f.size > 12 * 1024 * 1024)) return mesaj.dosyaCokBuyuk(12);
    const veriler = await Promise.all(liste.map(dosyaOku));
    setGorseller((g) => {
      const y = [...g];
      if (girdi === "gorsel") { y[0] = veriler[0]; return y; }
      let i = yuva ?? y.findIndex((x) => !x);
      for (const v of veriler) { if (i < 0 || i > 3) break; y[i] = v; i = y.findIndex((x, j) => !x && j > i); }
      return y;
    });
  };
  const yuvaSec = (i: number) => { yuvaRef.current = i; yukleRef.current?.click(); };

  /* ── Üret (4 taslak) ── */
  const doluGorsel = (girdi === "gorsel" ? gorseller.slice(0, 1) : girdi === "coklu" ? gorseller : []).filter(Boolean) as string[];
  const eksik = girdi === "metin" ? (istem.trim() ? null : "3D modelini anlat")
    : girdi === "gorsel" ? (doluGorsel.length ? null : "Bir görsel ekle")
      : (gorseller[0] ? (doluGorsel.length >= 2 ? null : "En az iki görünüm ekle") : "Ön görünümü ekle");
  const uret = async (mid?: string) => {
    const model = MODELLER_3D.find((m) => m.id === (mid ?? modelId)) ?? MODELLER_3D[0];
    if (eksik) { toast.info("3D üretimi başlatılamadı", { description: `${eksik}.` }); if (girdi === "metin") istemRef.current?.focus(); return; }
    const pozAd = POZLAR_3D.find((p) => p.id === poz);
    const parcalar = [istem.trim() || (girdi === "coklu" ? "Çoklu görünümden 3D" : "Görselden 3D"), stil.ad, poz !== "serbest" ? pozAd?.ad : ""].filter(Boolean);
    const onizleme = (await Promise.all(doluGorsel.map(kucult))).filter(Boolean);
    const t = Number(tohum);
    const kurulum: Kurulum = { model: model.id, stil: stil.id, poz, topoloji: "quad" in model && model.quad ? "quad" : topoloji, poligon, simetri, girdi, onizleme, ...(tohum && Number.isInteger(t) ? { tohum: t } : {}) };
    const sonuc = uretimBaslat({
      baslik: ((istem.trim().split(/[,.;\n]/)[0] || "").trim() || (girdi === "coklu" ? "Çoklu görünümden 3D" : "Görselden 3D")).slice(0, 36), tur: "3d", model: model.ad,
      prompt: `${parcalar.join(" · ")}${stil.istem ? ` · ${stil.istem}` : ""}`.slice(0, 600), kredi: model.taslak, arac: ARAC_AD, projeId: aktifProjeId ?? undefined,
      meta: { mod: "taslak", hamIstem: istem.trim(), kurulum, ...(kurulum.tohum !== undefined ? { tohum: kurulum.tohum } : {}) },
      ...(doluGorsel.length ? { girdi: { gorseller: doluGorsel } } : {}),
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    if (sonuc.id) {
      guncelle(sonuc.id, { topoloji: { poligon, tip: kurulum.topoloji ?? "triangle", pbr: false }, ...(poz !== "serbest" ? { poz: pozAd?.ad } : {}) });
      setOrnek(null); setSeciliId(sonuc.id); setFiltre("tumu");
      if (istemTemizlensinMi("3d")) setIstem("");
    }
  };
  const uretHepsi = async () => {
    if (kiyas.length < 2) return void uret();
    for (const mid of kiyas) await uret(mid);
    toast.success(`${kiyas.length} modelle üretiliyor`, { description: "Sonuçlar Modellerim'de yan yana; döndürüp karşılaştır." });
  };

  /* ── Detaylandır (seçili taslak → dokulu model) ── */
  const detaylandir = () => {
    if (!secili) return;
    const m = MODELLER_3D.find((x) => x.id === k.model) ?? MODELLER_3D[0];
    const sonuc = uretimBaslat({
      baslik: secili.baslik, tur: "3d", model: m.ad, prompt: `${secili.prompt} · ${dokulu ? `${coz} PBR doku` : "dokusuz"}`.slice(0, 600), kredi: m.detay, arac: ARAC_AD, projeId: aktifProjeId ?? undefined,
      meta: { mod: "detay", kaynakId: secili.id, sira: aday, hamIstem: secili.meta?.hamIstem, kurulum: { ...k, pbr: dokulu, cozunurluk: coz }, ...kaynakModel(secili) },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    if (sonuc.id) { guncelle(sonuc.id, { topoloji: { poligon: k.poligon ?? 30000, tip: k.topoloji ?? "triangle", pbr: dokulu }, dokuCozunurluk: coz, poz: secili.poz }); setSeciliId(sonuc.id); }
  };

  /* ── Araçlar (her biri yeni sürüm) ── */
  const aracCalistir = (a: AracAyar) => {
    if (!secili) return;
    const b = ARAC_BILGI[a.arac];
    if (!bagli) return void toast.error(`${b.ad} yapılamadı`, { description: "3D sağlayıcısı bağlı değil. Kredi düşmedi." });
    const ozet = a.arac === "doku" ? `Doku: ${a.istem} · ${a.cozunurluk}` : a.arac === "remesh" ? `Remesh: ${a.tip === "quad" ? "dörtgen" : "üçgen"} · ${a.poligon}` : a.arac === "rig" ? `Rig: ${a.boy.toFixed(2).replace(".", ",")} m` : `Baskı: ${a.yukseklik} mm`;
    const stilIstem = a.arac === "doku" ? STILLER.find((x) => x.id === a.stil)?.istem : undefined;
    const sonuc = uretimBaslat({
      baslik: secili.baslik, tur: "3d", model: `Vayra 3D ${b.ad}`, prompt: `${secili.meta?.hamIstem || secili.baslik} · ${ozet}`.slice(0, 600), kredi: b.kredi, arac: ARAC_AD, projeId: aktifProjeId ?? undefined,
      meta: { mod: a.arac, kaynakId: secili.id, sira: secili.meta?.sira, hamIstem: secili.meta?.hamIstem, kurulum: { ...k, ...a, ...(stilIstem ? { stilIstem } : {}) }, ...kaynakModel(secili) },
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    if (sonuc.id) {
      guncelle(sonuc.id, {
        topoloji: a.arac === "remesh" ? { poligon: a.poligon, tip: a.tip, pbr: secili.topoloji?.pbr ?? true } : secili.topoloji,
        ...(a.arac === "doku" ? { dokuCozunurluk: a.cozunurluk } : {}),
      });
      setSeciliId(sonuc.id); setArac(null);
    }
  };

  const goruntuAl = async () => {
    const blob = await sahneRef.current?.goruntu();
    if (!blob) return toast.error("Görüntü alınamadı", { description: "Model henüz yüklenmedi. Görünümde belirdikten sonra yeniden dene." });
    const url = URL.createObjectURL(blob);
    const ad = `${dosyaAdi(secili?.baslik ?? (ornek !== null ? ORNEKLER[ornek].ad : "vayra-3d"))}.png`;
    indirUrl(url, ad);
    toast.success("Görüntü indiriliyor", { description: ad });
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const indir = (format: string) => {
    const baskiDosyasi = format !== "glb" ? secili?.meta?.dosyalar?.[format] : undefined;
    if (baskiDosyasi) {
      indirUrl(baskiDosyasi, `${dosyaAdi(secili?.baslik ?? "vayra-3d")}.${format}`);
      return void toast.success("Baskı dosyası indiriliyor", { description: `${dosyaAdi(secili?.baslik ?? "vayra-3d")}.${format}` });
    }
    if (format !== "glb" || !sahne?.glb) return;
    indirUrl(sahne.glb, `${dosyaAdi(secili?.baslik ?? "vayra-3d")}.glb`);
    toast.success("3D model indiriliyor", { description: `${dosyaAdi(secili?.baslik ?? "vayra-3d")}.glb` });
  };
  const istemiKullan = (i: number) => { const o = ORNEKLER[i]; setGirdi("metin"); setIstem(o.istem); setStilId(o.stil); istemRef.current?.focus(); };
  const ayarlariYukle = (u: Uretim) => {
    const kk = kurulumu(u);
    setIstem(u.meta?.hamIstem ?? ""); if (kk.model) setModelId(kk.model); if (kk.stil) setStilId(kk.stil); if (kk.poz) setPoz(kk.poz);
    if (kk.topoloji) setTopoloji(kk.topoloji); if (kk.poligon) setPoligon(kk.poligon); if (kk.simetri !== undefined) setSimetri(kk.simetri === true ? "on" : kk.simetri === false ? "off" : kk.simetri);
    setGirdi(kk.girdi && kk.girdi !== "metin" && !gorseller.some(Boolean) ? "metin" : (kk.girdi ?? "metin"));
    toast.success("Ayarlar yüklendi", { description: "Komut kutusunda düzenleyip yeniden üretebilirsin." });
  };

  /* ═══════════ KOMUT KUTUSU ═══════════ */
  const girdiSecici = (
    <div role="radiogroup" aria-label="Girdi" className="cam-istemci isolate flex items-center gap-0.5 rounded-full p-1 max-sm:overflow-x-auto max-sm:[scrollbar-width:none]">
      {([["metin", "Metin", Type], ["gorsel", "Görsel", ImageIcon], ["coklu", "Çoklu görünüm", Layers]] as const).map(([id, ad, I]) => (
        <button key={id} role="radio" aria-checked={girdi === id} onClick={() => setGirdi(id)}
          className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", girdi === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {girdi === id && <motion.span layoutId="ucb-girdi" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          <I className="relative h-3.5 w-3.5" /><span className="relative whitespace-nowrap">{ad}</span>
        </button>
      ))}
    </div>
  );

  const yuva = (i: number, etiket?: string, buyuk?: boolean) => {
    const g = gorseller[i];
    return (
      <div key={i} className="flex shrink-0 flex-col items-center gap-1">
        <div className={cn("group relative overflow-hidden rounded-[12px]", buyuk ? "h-[72px] w-[72px]" : "h-14 w-14")}>
          {g ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt={etiket ?? "Referans görsel"} className="h-full w-full object-cover" />
              <button onClick={() => setGorseller((l) => l.map((x, j) => (j === i ? null : x)))} aria-label="Görseli kaldır"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"><X className="h-3 w-3" /></button>
            </>
          ) : (
            <button onClick={() => yuvaSec(i)} aria-label={`${etiket ?? "Görsel"} ekle`}
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[12px] bg-white/[0.065] text-metin-2 ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.1] hover:text-metin active:scale-95">
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {etiket && <span className={cn("text-[11.5px]", i === 0 ? "text-metin" : "text-metin-2")}>{etiket}</span>}
      </div>
    );
  };

  const modelCipi = (
    <KCip buyuk etiket="Model" acik={cip === "model"} setAcik={(v) => setCip(v ? "model" : null)} genislik={420}
      ikon={<Cpu className="h-3.5 w-3.5" />} deger={kiyas.length > 1 ? `${kiyas.length} model` : model.kisa}>
      <MenuKart baslik="3D modelleri" sag={<span className="text-[11.5px] text-metin-3">Süre ve kredi 4 taslak için</span>}>
      <div className="space-y-1 p-1.5">
        {MODELLER_3D.map((m) => {
          const sec = m.id === modelId;
          return (
            <motion.button whileTap={{ scale: 0.99 }} key={m.id} onClick={() => { setModelId(m.id); setCip(null); }} aria-pressed={sec}
              className={cn("flex w-full items-center gap-3 rounded-[14px] p-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.085] ring-2 ring-white" : "ring-transparent hover:bg-white/[0.055]")}>
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[radial-gradient(circle_at_50%_40%,#34363b,#16171a)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.kapak} alt="" className="h-full w-full object-contain p-1.5" style={m.id === "vayra-3d-turbo" ? { filter: "grayscale(1) brightness(1.15)" } : undefined} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold text-metin">{m.ad}{"rozet" in m && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">{m.rozet}</span>}</span>
                <span className="block text-[12px] leading-snug text-metin-2">{m.alt}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1"><Olcer ad="Hız" deger={m.hiz} /><Olcer ad="Detay" deger={m.detayPuan} /></span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 self-stretch py-0.5">
                <span className="text-[11.5px] tabular-nums text-metin-2">{m.sure}</span>
                <span className={cn("mt-auto flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.075] text-metin-2")}><KrediYildiz className="h-3 w-3" />{m.taslak}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
      </MenuKart>
      <div className="mt-2"><MenuKart baslik="Modelleri karşılaştır" sag={<span className="text-[11.5px] text-metin-3">Aynı girdi, yan yana</span>}>
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {MODELLER_3D.map((m) => {
            const sec = kiyas.includes(m.id), no = kiyas.indexOf(m.id) + 1;
            return (
              <button key={m.id} onClick={() => setKiyas((l) => (sec ? l.filter((x) => x !== m.id) : [...l, m.id].slice(-3)))} aria-pressed={sec}
                className={cn("relative flex flex-col items-center gap-1.5 rounded-[12px] p-2 text-center ring-1 ring-inset transition active:scale-95", sec ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.06] hover:bg-white/[0.065]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.kapak} alt="" className="h-12 w-12 object-contain" />
                <span className="w-full truncate text-[12px] font-medium text-metin">{m.kisa}</span>
                <AnimatePresence>{sec && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY} className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{no}</motion.span>}</AnimatePresence>
              </button>
            );
          })}
        </div>
        <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] text-metin-2">{kiyas.length > 1 ? `${kiyas.length} model seçili; Üret yerine Karşılaştır çalışır.` : "İki ya da üç model seç; her biri ayrı taslak seti üretir."}</p>
      </MenuKart></div>
    </KCip>
  );
  const stilCipi = (
    <KCip buyuk etiket="Stil" acik={cip === "stil"} setAcik={(v) => setCip(v ? "stil" : null)} genislik={400}
      // eslint-disable-next-line @next/next/no-img-element
      ikon={stilId === "ozel" ? <Sparkles className="h-3.5 w-3.5" /> : <img src={stil.kapak} alt="" className="h-full w-full object-cover" />} deger={stil.ad}>
      <OzelGirdi deger={stilOzel} set={setStilOzel} secili={stilId === "ozel"} ph="Ör. ahşap oyma, el yapımı, sıcak cila" alt="Listede yoksa stili tarif et" uygula={() => { setStilId("ozel"); setCip(null); }} />
      <MenuKart baslik="Görünüm stili"><div className="grid grid-cols-3 gap-2 p-2">
        {STILLER.map((s) => <IzgaraSec key={s.id} sec={s.id === stilId} ad={s.ad} alt={s.alt} kapak={s.kapak} oran="aspect-square" onClick={() => { setStilId(s.id); setCip(null); }} />)}
      </div></MenuKart>
    </KCip>
  );
  const quadZorunlu = "quad" in model && model.quad;
  const topolojiCipi = (
    <KCip buyuk etiket="Topoloji" acik={cip === "topo"} setAcik={(v) => setCip(v ? "topo" : null)} genislik={360}
      ikon={<Boxes className="h-3.5 w-3.5" />} deger={`${quadZorunlu || topoloji === "quad" ? "Dörtgen" : "Üçgen"} · ${kisaSayi(poligon)}`}>
      <div className="space-y-2">
        <MenuKart baslik="Yüzey yapısı"><div className="space-y-2.5 p-2.5">
        <Segment deger={quadZorunlu ? "quad" : topoloji} onDegis={setTopoloji} etiket="Topoloji" kapali={quadZorunlu ? ["triangle"] : []} secenekler={[["triangle", "Üçgen"], ["quad", "Dörtgen"]]} />
        <p className="text-[12px] leading-snug text-metin-2">{quadZorunlu ? "Akıllı Topoloji her zaman temiz dörtgen mesh üretir." : topoloji === "quad" ? "Temiz kenar akışı; rig ve animasyon için." : "En hafif mesh; web ve oyun motorları için."}</p>
        </div></MenuKart>
        <MenuKart baslik="Poligon sayısı" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{kisaSayi(poligon)}</span>}><div className="space-y-3 p-2.5">
        <Segment deger={POLIGON_HAZIR.includes(poligon) ? poligon : 0} onDegis={(v) => v && setPoligon(v)} etiket="Poligon" secenekler={[...POLIGON_HAZIR.map((n) => [n, kisaSayi(n)] as const), [0, "Özel"] as const]} />
        <Kaydirici ad="Hedef poligon" deger={poligon} min={1000} max={200000} adim={1000} onDegis={setPoligon} yaz={(v) => v.toLocaleString("tr")} />
        </div></MenuKart>
      </div>
    </KCip>
  );
  const pozCipi = (
    <KCip buyuk etiket="Poz" acik={cip === "poz"} setAcik={(v) => setCip(v ? "poz" : null)} genislik={420}
      ikon={<PersonStanding className="h-3.5 w-3.5" />} deger={POZLAR_3D.find((p) => p.id === poz)?.ad ?? "Serbest"}>
      <MenuKart baslik="Karakter duruşu" sag={<span className="text-[11.5px] text-metin-3">Rig ve animasyon için T ya da A</span>}>
      <div className="grid grid-cols-3 gap-2 p-2">
        {POZLAR_3D.map((p) => {
          const sec = p.id === poz;
          return (
            <motion.button whileTap={{ scale: 0.97 }} key={p.id} onClick={() => { setPoz(p.id); setCip(null); }} aria-pressed={sec} className="group min-w-0 text-left">
              <span className={cn("relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_50%_35%,#2c2e33,#16171a)] pb-2 transition-[outline-color]",
                sec ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25")}>
                <PozFigur id={p.id} className={cn("h-[78%] w-[78%] transition-colors", sec ? "text-white" : "text-metin-2 group-hover:text-metin")} />
              </span>
              <span className={cn("mt-1.5 block text-[13px] font-semibold", sec ? "text-metin" : "text-metin-2")}>{p.ad}</span>
              <span className="block text-[11.5px] leading-snug text-metin-2">{p.kisa}</span>
            </motion.button>
          );
        })}
      </div>
      </MenuKart>
    </KCip>
  );
  const gelismisCipi = (
    <KCip buyuk etiket="Gelişmiş" acik={cip === "gelismis"} setAcik={(v) => setCip(v ? "gelismis" : null)} genislik={340}
      ikon={<Settings2 className="h-3.5 w-3.5" />} deger={tohum ? "Tohumlu" : simetri === "on" ? "Simetrik" : simetri === "off" ? "Simetrisiz" : "Varsayılan"}>
      <div className="space-y-2">
      <MenuKart baslik="Simetri" sag={<span className="text-[11.5px] text-metin-3">Sol ve sağ yarıyı eşitler</span>}>
        <div className="p-3">
          <div className="mb-2.5 hidden items-center gap-2.5">
            <SimetriSekli acik={simetri !== "off"} />
            <span className="min-w-0"><span className="block text-[13.5px] font-medium text-metin">Simetri</span><span className="block text-[12px] text-metin-2">Sol ve sağ yarıyı eşitler</span></span>
          </div>
          <Segment deger={simetri} onDegis={setSimetri} etiket="Simetri" secenekler={[["auto", "Otomatik"], ["on", "Açık"], ["off", "Kapalı"]]} />
        </div>
      </MenuKart>
      <MenuKart baslik="Tohum" sag={<span className="text-[11.5px] text-metin-3">Aynı tohum aynı şekli verir</span>}>
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <input value={tohum} onChange={(e) => setTohum(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="Rastgele" aria-label="Tohum"
              className="h-9 min-w-0 flex-1 rounded-[10px] bg-white/[0.055] px-3 text-[13.5px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
            <motion.button whileTap={{ scale: 0.9, rotate: -20 }} onClick={() => setTohum(String(Math.floor(Math.random() * 2147483647)))} aria-label="Rastgele tohum" title="Rastgele tohum"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.075] hover:text-metin"><Dices className="h-4 w-4" /></motion.button>
            {tohum && <button onClick={() => setTohum("")} aria-label="Tohumu temizle" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </MenuKart>
      </div>
    </KCip>
  );

  const uretDugmesi = (
    <motion.button whileTap={{ scale: 0.97 }} onClick={() => void uretHepsi()} title={eksik ?? "Üret (Ctrl+Enter)"}
      className="group ml-auto flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:ml-0 max-sm:w-full">
      <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      {kiyas.length > 1 ? <>Karşılaştır<span className="font-medium text-black/55">{kiyas.length} model</span></> : <>Üret<span className="font-medium text-black/55">4 taslak</span></>}
      {bagli && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kiyas.length > 1 ? kiyas.reduce((t, id) => t + (MODELLER_3D.find((m) => m.id === id)?.taslak ?? 0), 0) : model.taslak}</span>}
    </motion.button>
  );

  const komut = (
    <div className="pointer-events-auto w-full min-w-0">
    <div className="mb-2 flex">{girdiSecici}</div>
    <div className="cam-istemci pointer-events-auto relative w-full min-w-0 rounded-[26px] p-3"
      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void uretHepsi(); } }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
      onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); if (girdi === "metin") setGirdi("gorsel"); void gorselEkle(e.dataTransfer.files); }}>
      {eksik && istem.trim() ? <div className="mb-2 flex justify-end"><span title={eksik} className="max-w-[340px] shrink-0 truncate rounded-full bg-amber-300/[0.08] px-2.5 py-1 text-[11.5px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden">{eksik}</span></div> : null}
      <div className="flex items-start gap-2.5 px-1">
        <AnimatePresence initial={false}>
          {girdi !== "metin" && (
            <motion.div key={girdi} initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={YAY} className="flex shrink-0 gap-2 overflow-hidden pt-1">
              {girdi === "gorsel" ? yuva(0, undefined, true) : GORUNUSLER.map((g, i) => yuva(i, g))}
            </motion.div>
          )}
        </AnimatePresence>
        <textarea ref={istemRef} value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 800))} rows={girdi === "metin" ? 2 : 2} spellCheck={false} aria-label="İstem"
          onPaste={(e) => { const f = [...e.clipboardData.files]; if (f.length) { e.preventDefault(); if (girdi === "metin") setGirdi("gorsel"); void gorselEkle(f); } }}
          placeholder={girdi === "metin" ? "3D modelini anlat: nesne, malzeme, renk, duruş…" : girdi === "gorsel" ? "İsteğe bağlı not: malzeme, ölçek, arka yüz…" : "Ön, sağ, arka, sol görünümleri ekle; en az iki görünüm gerekir"}
          className="block max-h-[140px] min-h-[52px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-metin outline-none [field-sizing:content] placeholder:text-metin-2" />
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&>*]:shrink-0 max-sm:grid max-sm:grid-cols-2 max-sm:overflow-visible max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">
          {modelCipi}{stilCipi}{topolojiCipi}{pozCipi}{gelismisCipi}
        </div>
        {uretDugmesi}
      </div>
      <input ref={yukleRef} type="file" accept="image/png,image/jpeg,image/webp" multiple={girdi === "coklu"} className="hidden"
        onChange={(e) => { if (e.target.files?.length) void gorselEkle(e.target.files, girdi === "coklu" ? yuvaRef.current : 0); e.target.value = ""; }} />
    </div>
    </div>
  );

  /* ═══════════ SAHNE ÜSTÜ ═══════════ */
  const arkaRenk = ARKALAR.find((a) => a.id === arka)?.renk ?? "#141517";
  const sahneUstu = sahne && (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 max-sm:left-3 max-sm:top-3">
      <div className={cn(PANEL, "pointer-events-auto flex items-center gap-0.5 p-[3px]")} role="radiogroup" aria-label="Görünüm">
        {GORUNUMLER.map(([id, ad, I]) => (
          <button key={id} role="radio" aria-checked={gorunum === id} onClick={() => setGorunum(id)} title={ad}
            className={cn("relative isolate flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors max-sm:px-2.5", gorunum === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {gorunum === id && <motion.span layoutId="ucb-gorunum" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="relative h-3.5 w-3.5" /><span className="relative max-sm:hidden">{ad}</span>
          </button>
        ))}
      </div>
      <div className={cn(PANEL, "pointer-events-auto flex items-center gap-0.5 p-[3px]")}>
        <div className="relative">
          <button onClick={() => setIsikAcik((v) => !v)} aria-expanded={isikAcik} aria-label="Işık ve arka plan" title="Işık ve arka plan" className={cn(IKON, "h-8 w-8", isikAcik && "bg-white/[0.1] text-metin")}><Sun className="h-4 w-4" /></button>
          <AnimatePresence>
            <Yuzen acik={isikAcik} onKapat={() => setIsikAcik(false)} yerlesim="alt-sol" bosluk={8} etiket="Işık" className={cn(POP, "p-2")} style={{ width: "min(300px, calc(100vw - 24px))" }}>
              <MenuKart baslik="Işık düzeni"><div className="space-y-0.5 p-1.5">
              {ISIKLAR.map((x) => (
                <button key={x.id} onClick={() => setIsik(x.id)} aria-pressed={isik === x.id}
                  className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left ring-1 ring-inset transition-colors", isik === x.id ? "bg-white/[0.085] ring-2 ring-white" : "ring-transparent hover:bg-white/[0.055]")}>
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff ${x.poz * 18}%, #6b6f78 ${40 + x.poz * 20}%, #1b1c1f)` }} />
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{x.ad}</span><span className="block text-[11.5px] text-metin-2">{x.alt}</span></span>
                </button>
              ))}
              </div></MenuKart>
              <div className="mt-2"><MenuKart baslik="Arka plan"><div className="flex gap-1.5 p-2">
                {ARKALAR.map((a) => (
                  <button key={a.id} onClick={() => setArka(a.id)} aria-pressed={arka === a.id} className="flex flex-1 flex-col items-center gap-1 text-[12px] text-metin-2">
                    <span className={cn("h-9 w-full rounded-[10px] ring-1 ring-inset", arka === a.id ? "outline outline-2 outline-offset-2 outline-white ring-transparent" : "ring-white/15")} style={{ background: a.renk }} />{a.ad}
                  </button>
                ))}
              </div></MenuKart></div>
            </Yuzen>
          </AnimatePresence>
        </div>
        <button onClick={() => setDonme((v) => !v)} aria-pressed={donme} aria-label="Otomatik döndür" title="Otomatik döndür" className={cn(IKON, "h-8 w-8", donme && "text-aksan")}><RotateCw className="h-4 w-4" /></button>
        <button onClick={() => sahneRef.current?.kadraj()} aria-label="Kadrajı sıfırla" title="Kadrajı sıfırla" className={cn(IKON, "h-8 w-8 max-sm:hidden")}><Focus className="h-4 w-4" /></button>
        <button onClick={() => void goruntuAl()} aria-label="Görüntü al" title="Görüntü al (PNG)" className={cn(IKON, "h-8 w-8 max-sm:hidden")}><Camera className="h-4 w-4" /></button>
        <button onClick={() => sahneRef.current?.tamEkran()} aria-label="Tam ekran" title="Tam ekran" className={cn(IKON, "h-8 w-8 max-sm:hidden")}><Maximize2 className="h-4 w-4" /></button>
        <button onClick={() => { setArac(null); setArAcik((v) => !v); }} aria-pressed={arAcik} title="AR ve döner video" className={cn("ml-0.5 flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95", arAcik ? "bg-white text-black" : "bg-white/[0.085] text-metin hover:bg-white/[0.12]")}><Smartphone className="h-3.5 w-3.5" />AR · Video</button>
      </div>
    </div>
  );

  const mesh = bilgi ? `${kisaSayi(bilgi.ucgen)} üçgen · ${kisaSayi(bilgi.kose)} köşe · ${bilgi.doku ? `${bilgi.doku} doku` : "dokusuz"}` : null;
  const ozet = bilgi && (
    <motion.dl key={sahne?.glb} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={YAY} aria-label={mesh ?? undefined}
      className={cn(PANEL, "pointer-events-auto hidden h-10 shrink-0 items-center divide-x divide-white/[0.08] px-1 lg:flex")}>
      {([[Triangle, kisaSayi(bilgi.ucgen), "üçgen", `${bilgi.ucgen.toLocaleString("tr")} üçgen`], [Grid3x3, kisaSayi(bilgi.kose), "köşe", `${bilgi.kose.toLocaleString("tr")} köşe`], [Paintbrush, bilgi.doku ? String(bilgi.doku) : "0", "doku", bilgi.doku ? `${bilgi.doku} doku haritası` : "Doku yok"]] as const).map(([I, d, a, t]) => (
        <div key={a} title={t} className="flex items-center gap-1.5 px-2.5">
          <I className="h-3.5 w-3.5 text-metin-2" />
          <dd className="text-[13px] font-semibold tabular-nums text-metin">{d}</dd>
          <dt className="text-[12px] text-metin-2">{a}</dt>
        </div>
      ))}
    </motion.dl>
  );
  const baslikAlani = (ornek !== null || secili) && (
    <div className="pointer-events-none absolute right-4 top-4 z-10 flex max-w-[52%] flex-col items-end gap-2 max-sm:hidden">
      <div className="flex min-w-0 items-center gap-2">
        {ozet}
        <span className={cn(PANEL, "pointer-events-auto flex h-10 min-w-0 items-center gap-2 pl-2 pr-4")}>
          <span className="w-1" />
          <span className="truncate text-[14px] font-semibold text-metin">{ornek !== null ? ORNEKLER[ornek].ad : secili?.baslik}</span>
        </span>
      </div>
      {secili && ornek === null && zincir.length > 1 && (
        <div className={cn(PANEL, "pointer-events-auto flex items-center gap-0.5 p-[3px]")} role="tablist" aria-label="Sürümler">
          {zincir.map((z) => (
            <button key={z.id} role="tab" aria-selected={z.id === secili.id} onClick={() => setSeciliId(z.id)}
              className={cn("relative h-7 rounded-full px-2.5 text-[12px] font-medium transition-colors", z.id === secili.id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {z.id === secili.id && <motion.span layoutId="ucb-surum" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
              <span className="relative">{MOD_AD[z.meta?.mod ?? "detay"] ?? "Model"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* Taslak aday seçici (sahnenin üst ortası). */
  const adaySecici = secili && mod === "taslak" && !surecte && (secili.varyasyonlar?.length ?? 0) > 1 && (
    <div className="absolute left-1/2 top-[68px] z-10 -translate-x-1/2 max-sm:top-14">
      <div className={cn(PANEL, "flex items-center gap-1.5 rounded-[18px] p-1.5")} role="radiogroup" aria-label="Taslaklar">
        {secili.varyasyonlar!.map((v, i) => (
          <button key={i} role="radio" aria-checked={aday === i} onClick={() => guncelle(secili.id, { secilenVaryasyon: i })} title={`Taslak ${i + 1}`} aria-label={`Taslak ${i + 1}`}
            className={cn("relative h-14 w-14 overflow-hidden rounded-[12px] bg-white/[0.055] transition-[outline-color]", aday === i ? "outline outline-2 -outline-offset-2 outline-aksan" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/30")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.thumb} alt="" className="h-full w-full object-contain p-1" />
            <span className="absolute bottom-0.5 left-1 text-[10.5px] font-semibold text-white/80">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* Sahnenin altındaki bağlam çubuğu: taslakta Detaylandır, modelde araçlar, örnekte istemi kullan. */
  const baglamCubugu = ornek !== null ? (
    <div className={cn(PANEL, "pointer-events-auto flex items-center gap-1.5 rounded-[20px] p-1.5")}>
      <div role="radiogroup" aria-label="Örnek modeller" className="flex items-center gap-1">
        {ORNEKLER.map((o, i) => (
          <button key={o.id} role="radio" aria-checked={ornek === i} aria-label={o.ad} title={o.ad} onClick={() => setOrnek(i)}
            className={cn("h-11 w-11 overflow-hidden rounded-[12px] bg-white/[0.055] transition-[outline-color]", ornek === i ? "outline outline-2 -outline-offset-2 outline-aksan" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/30")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.poster} alt="" className="h-full w-full object-contain p-1" />
          </button>
        ))}
      </div>
      <span className="mx-1 h-6 w-px bg-white/[0.08] max-sm:hidden" />
      <span className="min-w-0 max-w-[260px] px-1 max-sm:hidden">
        <span className="block truncate text-[13px] font-medium text-metin">{ORNEKLER[ornek].ad}</span>
        <span className="block truncate text-[12px] text-metin-2">{ORNEKLER[ornek].istem}</span>
      </span>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => istemiKullan(ornek)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e]"><Wand2 className="h-4 w-4" />İstemi kullan</motion.button>
    </div>
  ) : secili && !surecte && secili.durum === "tamam" && mod === "taslak" && (secili.varyasyonlar?.length ?? 0) > 0 ? (
    <div className={cn(PANEL, "pointer-events-auto flex flex-wrap items-center justify-center gap-1 p-1 max-sm:rounded-[20px]")}>
      <span className="px-3 text-[13px] font-medium text-metin">Taslak {aday + 1}<span className="font-normal text-metin-2">/{secili.varyasyonlar!.length}</span></span>
      <div role="radiogroup" aria-label="Doku" className="flex items-center rounded-full bg-white/[0.055] p-[3px] ring-1 ring-inset ring-white/[0.06]">
        {([["yok", "Dokusuz"], ["2K", "2K doku"], ["4K", "4K doku"]] as const).map(([v, ad]) => {
          const sec = v === "yok" ? !dokulu : dokulu && coz === v;
          return (
            <button key={v} role="radio" aria-checked={sec} onClick={() => { if (v === "yok") setDokulu(false); else { setDokulu(true); setCoz(v); } }}
              className={cn("relative h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", sec ? "text-black" : "text-metin-2 hover:text-metin")}>
              {sec && <motion.span layoutId="ucb-coz" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{ad}</span>
            </button>
          );
        })}
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={detaylandir} className="hf-cta flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold">
        <Sparkles className="h-4 w-4" />Detaylandır
        {bagli ? <span className="tabular-nums">{(MODELLER_3D.find((x) => x.id === k.model) ?? MODELLER_3D[0]).detay} kredi</span> : null}
      </motion.button>
    </div>
  ) : secili && sahne && mod !== "taslak" && (
    <div className={cn(PANEL, "pointer-events-auto flex items-center gap-0.5 p-1 max-sm:max-w-full max-sm:overflow-x-auto max-sm:[scrollbar-width:none]")}>
      {ARACLAR.map(([id, ad, I]) => (
        <motion.button whileTap={{ scale: 0.95 }} key={id} onClick={() => { setArac(arac === id ? null : id); if (!masaustu) setMobilListe(false); }} aria-pressed={arac === id}
          className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors", arac === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {arac === id && <motion.span layoutId="ucb-arac" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
          <I className="relative h-4 w-4" /><span className="relative">{ad}</span>
        </motion.button>
      ))}
      <span className="mx-1 h-5 w-px bg-white/[0.08]" />
      <button onClick={() => ayarlariYukle(secili)} title="Bu ayarlarla yeniden üret" aria-label="Bu ayarlarla yeniden üret" className={IKON}><Repeat className="h-4 w-4" /></button>
    </div>
  );

  /* Sahne içeriği (karşılama, süreç, hata, canlı model). */
  const ilerleme = secili?.ilerleme ?? 0;
  const sahneIcerik = secili && surecte ? (
    mod === "taslak" ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 pb-56">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...YAY, delay: i * 0.05 }}
              className="relative h-[clamp(84px,14vh,140px)] w-[clamp(84px,14vh,140px)] overflow-hidden rounded-[18px] bg-white/[0.055] ring-1 ring-inset ring-white/[0.07]">
              <motion.span animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
              <TelKure gecikme={i * 0.35} />
            </motion.div>
          ))}
        </div>
        <Surec yuzde={ilerleme} adimlar={["Şekil çıkarılıyor", "Dört aday", "Hazır"]} />
      </div>
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 pb-56">
        <div className="relative h-[clamp(160px,30vh,280px)] w-[clamp(160px,30vh,280px)] overflow-hidden rounded-[24px]">
          {(() => { const kaynak = modeller.find((x) => x.id === secili.meta?.kaynakId); const o = ORNEKLER[(secili.meta?.sira ?? 0) % ORNEKLER.length]; const p = kaynak?.meta?.mod === "taslak" ? kaynak.varyasyonlar?.[secili.meta?.sira ?? 0]?.thumb : kaynak?.thumbnailUrl; return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p || o.hamPoster} alt="" className="h-full w-full object-contain opacity-70 grayscale" />
          ); })()}
          <motion.span initial={{ top: "-20%" }} animate={{ top: "110%" }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute inset-x-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.22),transparent)]" />
        </div>
        <Surec yuzde={ilerleme} adimlar={mod === "detay" ? ["Geometri", "Doku", "Hazır"] : [MOD_AD[mod] ?? "İşlem", "Hazır"]} />
      </div>
    )
  ) : secili?.durum === "hata" ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 pb-56 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300"><TriangleAlert className="h-5 w-5" /></span>
      <p className="text-[16px] font-semibold text-metin">Üretim tamamlanamadı</p>
      <p className="max-w-[420px] text-[13.5px] text-metin-2">{secili.hata ?? "Beklenmeyen bir hata oluştu."} Kredin iade edildi.</p>
      <button onClick={() => ayarlariYukle(secili)} className="mt-1 flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e]"><RotateCw className="h-4 w-4" />Ayarları yükle</button>
    </div>
  ) : secili && !sahne ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 pb-56 text-center">
      <div className="h-40 w-40 rounded-[20px] bg-white/[0.055]" style={{ background: arkaPlan(secili.thumbnailUrl ?? secili.gorselUrl) }} />
      <p className="text-[13.5px] text-metin-2">Bu kayıtta 3D dosya yok; yalnız önizleme görseli var.</p>
    </div>
  ) : null;

  /* ═══════════ MODELLERİM ═══════════ */
  const liste = zamanaGoreSirala(modeller.filter((u) => filtre === "tumu" || (filtre === "taslak" ? u.meta?.mod === "taslak" : u.meta?.mod !== "taslak")), galeriGorunum.siralama);
  const sutun = galeriGorunum.boyut === "kucuk" ? 3 : galeriGorunum.boyut === "buyuk" ? 1 : galeriGorunum.boyut === "ozel" ? Math.min(4, Math.max(1, Math.round(galeriGorunum.sutun / 2))) : 2;
  const ornekKarti = (baslik: string, alt: string) => (
    <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Sparkles className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{baslik}</span><span className="block truncate text-[12px] text-metin-3">{alt}</span></span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2">
        {ORNEKLER.map((o, i) => (
          <motion.button key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.04 }} whileTap={{ scale: 0.97 }} onClick={() => { setOrnek(i); setMobilListe(false); }}
            className={cn("group relative block aspect-square overflow-hidden rounded-[14px] text-left ring-1 ring-inset transition", ornek === i ? "ring-2 ring-white" : "ring-white/[0.08] hover:ring-white/30")} style={{ background: "radial-gradient(circle at 50% 40%, #2c2e33, #141517)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.poster} alt="" className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-6 text-[12.5px] font-semibold text-white">{o.ad}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
  const modellerim = (sayfa: boolean) => (
    <div className="flex h-full flex-col">
      {!sayfa && (
        <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.085] text-metin"><Boxes className="h-4 w-4" /></span>
          <h2 className="text-[15px] font-semibold text-metin">Modellerim</h2>
          {modeller.length > 0 && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] tabular-nums text-metin-2">{modeller.length}</span>}
          {aktifIs > 0 && <span className="flex items-center gap-1 rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] text-metin-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />{aktifIs} sürüyor</span>}
          <span className="flex-1" />
          <GorunumAyari sayfa="3d" yerlesimVar={false} dugmeSinif="h-8 w-8" />
        </div>
      )}
      {modeller.length > 0 && <div className="px-4 pb-3"><Segment deger={filtre} onDegis={setFiltre} etiket="Filtre" secenekler={[["tumu", "Tümü"], ["taslak", "Taslaklar"], ["model", "Modeller"]]} /></div>}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {modeller.length === 0 ? ornekKarti("Örneklerle başla", "Ürettiklerin burada toplanır; bir örneği aç") : (
          <>
          <motion.div layout className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${sutun}, minmax(0, 1fr))` }}>
            <AnimatePresence initial={false}>
              {liste.map((u) => <ModelKarti key={u.id} u={u} sec={u.id === seciliId && ornek === null} onSec={() => { setOrnek(null); setSeciliId(u.id); setMobilListe(false); }}
                onSil={() => { sil(u.id); mesaj.silindi("Model", () => uretimGeriYukle(u)); }} onFavori={() => favoriToggle(u.id)} onYenidenKullan={() => ayarlariYukle(u)} onIndir={u.glbUrl ? () => { indirUrl(u.glbUrl!, `${dosyaAdi(u.baslik)}.glb`); toast.success("3D model indiriliyor", { description: `${dosyaAdi(u.baslik)}.glb` }); } : undefined} />)}
            </AnimatePresence>
          </motion.div>
          {modeller.length < 6 && <div className="mt-4">{ornekKarti("Örnek modeller", "Aç, döndür, istemini kullan")}</div>}
          </>
        )}
      </div>
    </div>
  );

  const arPaneli = arAcik && sahne && (
    <ArVideoPaneli key={sahne.glb} glb={sahne.glb} poster={sahne.poster} ad={ornek !== null ? ORNEKLER[ornek].ad : secili?.baslik ?? "3D model"} onKapat={() => setArAcik(false)}
      onVideo={(sn, ilerleme) => sahneRef.current?.donusVideo({ sn, zemin: arkaRenk, ilerleme }) ?? Promise.resolve(null)} />
  );
  const aracPaneli = arac && secili && (
    <AracPaneli key={`${arac}-${secili.id}`} arac={arac} model={secili} bilgi={bilgi} bagli={bagli}
      onKapat={() => setArac(null)} onCalistir={aracCalistir} onIndir={indir} onGoruntu={() => void goruntuAl()} />
  );

  const durumNotu = eksik && (istem.trim() || doluGorsel.length > 0) ? <p className="mt-2 truncate text-center text-[12.5px] text-amber-200/90">{eksik}</p> : null;

  /* ═══════════ DÜZEN ═══════════ */
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-[calc(100dvh-var(--ust-nav))] w-full bg-zemin max-sm:h-auto max-sm:min-h-[calc(100dvh-var(--ust-nav))] max-sm:flex-col">
        <div className="relative flex min-w-0 flex-1 flex-col max-sm:flex-none">
          <div className="relative min-h-0 flex-1 overflow-hidden max-sm:h-[58vh] max-sm:flex-none" style={{ background: `radial-gradient(120% 90% at 50% 38%, color-mix(in srgb, ${arkaRenk} 86%, #ffffff), ${arkaRenk} 62%)` }}>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-[0.5] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_top,#000,transparent)] [transform:perspective(600px)_rotateX(60deg)] [transform-origin:bottom]" />
            {sahne && (
              <Sahne ref={sahneRef} glb={sahne.glb} poster={sahne.poster} gorunum={gorunum} isik={isik} donme={donme} onBilgi={setBilgi}
                className="absolute inset-0 sm:pb-[170px] sm:pt-[40px]" />
            )}
            {sahneIcerik}
            {sahneUstu}
            {baslikAlani}
            {adaySecici}
            {!masaustu && modeller.length > 0 && (
              <button onClick={() => setMobilListe(true)} className={cn(PANEL, "absolute right-3 top-3 z-10 flex h-9 items-center gap-1.5 px-3 text-[13px] font-medium text-metin")}>
                <Boxes className="h-4 w-4" /><span className="max-[380px]:hidden">Modellerim</span>{modeller.length > 0 && <span className="tabular-nums text-metin-2">{modeller.length}</span>}{aktifIs > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin text-aksan" />}
              </button>
            )}
            {!masaustu && <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">{baglamCubugu}</div>}
          </div>
          {masaustu ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-6">
              <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...YAY, delay: 0.05 }} className="flex w-full max-w-[1120px] flex-col items-center gap-2.5">
                <AnimatePresence mode="wait">
                  {baglamCubugu && <motion.div key={ornek !== null ? "ornek" : mod === "taslak" ? "taslak" : "arac"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={YAY}>{baglamCubugu}</motion.div>}
                </AnimatePresence>
                {komut}
                {durumNotu}
              </motion.div>
            </div>
          ) : (
            <div className="px-3 pb-6 pt-3">{komut}{durumNotu}</div>
          )}
        </div>

        {masaustu && (modeller.length > 0 || !!aracPaneli || !!arPaneli) && (
          <motion.aside style={yanBoy.stil} className="relative w-[var(--yan-en)] shrink-0 overflow-hidden border-l border-white/[0.06] bg-[#111214]">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
            <AnimatePresence initial={false} mode="popLayout">
              {arPaneli ? (
                <motion.div key="ar" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={YAY} className="absolute inset-0">{arPaneli}</motion.div>
              ) : aracPaneli ? (
                <motion.div key="arac" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={YAY} className="absolute inset-0">{aracPaneli}</motion.div>
              ) : (
                <motion.div key="liste" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={YAY} className="absolute inset-0">{modellerim(false)}</motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        )}
      </div>

      {!masaustu && (
        <>
          <AltSayfa acik={mobilListe} baslik="Modellerim" onKapat={() => setMobilListe(false)}><div className="h-[70vh]">{modellerim(true)}</div></AltSayfa>
          <AltSayfa acik={!!arPaneli} baslik="AR ve video" onKapat={() => setArAcik(false)}><div className="h-[78vh]">{arPaneli}</div></AltSayfa>
          <AltSayfa acik={!!aracPaneli} baslik={arac ? ARAC_BILGI[arac].ad : ""} onKapat={() => setArac(null)}><div className="h-[75vh]">{aracPaneli}</div></AltSayfa>
        </>
      )}
    </MotionConfig>
  );
}

/** İlerleme: yüzde + adım adları. */
/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}

function Surec({ yuzde, adimlar }: { yuzde: number; adimlar: string[] }) {
  const etkin = Math.min(adimlar.length - 1, Math.floor((yuzde / 100) * adimlar.length));
  return (
    <div className="flex w-[min(360px,80vw)] flex-col items-center gap-2.5">
      <div className="flex w-full items-center justify-between text-[13px]">
        <span className="flex items-center gap-1.5 font-medium text-metin"><Loader2 className="h-3.5 w-3.5 animate-spin text-aksan" />{adimlar[etkin]}</span>
        <motion.span key={Math.round(yuzde / 5)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="tabular-nums text-metin-2">yüzde {Math.round(yuzde)}</motion.span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div className="h-full rounded-full bg-aksan" animate={{ width: `${Math.max(4, yuzde)}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

/** Modellerim kartı: taslakta 2×2 aday, modelde kapak; süreçte ilerleme. */
function ModelKarti({ u, sec, onSec, onSil, onIndir, onFavori, onYenidenKullan }: { u: Uretim; sec: boolean; onSec: () => void; onSil: () => void; onIndir?: () => void; onFavori: () => void; onYenidenKullan: () => void }) {
  const mod = u.meta?.mod ?? "detay";
  const surecte = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const v = u.varyasyonlar ?? [];
  const kapak = u.thumbnailUrl ?? (u.gercek ? u.gorselUrl : undefined);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={YAY} className="group relative min-w-0">
      <button onClick={onSec} className="block w-full text-left" aria-pressed={sec}>
        <span className={cn("relative block aspect-square overflow-hidden rounded-[14px] bg-white/[0.035] transition-[outline-color]", sec ? "outline outline-2 -outline-offset-2 outline-aksan" : "outline outline-1 -outline-offset-1 outline-white/[0.07] group-hover:outline-white/20")}>
          {surecte ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <Halka yuzde={u.ilerleme} />
              <span className="text-[11.5px] text-metin-2">{u.durum === "kuyrukta" ? "Sırada" : MOD_AD[mod] ?? "İşleniyor"}</span>
            </span>
          ) : u.durum === "hata" ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-rose-300"><TriangleAlert className="h-5 w-5" /><span className="text-[11.5px]">Başarısız</span></span>
          ) : mod === "taslak" && v.length > 1 ? (
            <span className="grid h-full w-full grid-cols-2 gap-px">
              {v.slice(0, 4).map((x, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={x.thumb} alt="" className={cn("h-full w-full object-contain p-1", i === (u.secilenVaryasyon ?? 0) ? "bg-white/[0.075]" : "opacity-75")} />
              ))}
            </span>
          ) : kapak ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kapak} alt="" className="h-full w-full object-contain p-2" />
          ) : (
            <span className="absolute inset-0" style={{ background: arkaPlan(u.gorselUrl) }} />
          )}
          {u.durum === "tamam" && mod !== "taslak" && mod !== "detay" && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-px text-[10.5px] font-medium text-white/90">{MOD_AD[mod]}</span>}
        </span>
        <span className="mt-1.5 block truncate text-[13px] font-medium text-metin">{u.baslik}</span>
        <span className="block truncate text-[11.5px] text-metin-2">
          {(MODELLER_3D.find((m) => m.ad === u.model)?.kisa ?? u.model)} · {mod === "taslak" ? `${v.length || 4} taslak` : u.topoloji ? `${u.topoloji.tip === "quad" ? "Dörtgen" : "Üçgen"} · ${kisaSayi(u.topoloji.poligon)}` : MOD_AD[mod] ?? "Model"}
        </span>
      </button>
      {u.durum === "tamam" && u.favori && <FavoriRozeti boyut="kucuk" className="right-1.5 top-1.5" />}
      {u.durum === "tamam" ? (
        <span className="absolute right-1.5 top-1.5 z-20 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <FavoriDugmesi favori={!!u.favori} onClick={onFavori} boyut="kucuk" side="bottom" />
          {(onIndir || u.thumbnailUrl) && <IndirDugmesi u={u} side="bottom" className="hf-btn glass-ikon flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform active:scale-90" ikonSinif="h-3.5 w-3.5" />}
          <YenidenKullanDugmesi onClick={onYenidenKullan} boyut="kucuk" side="bottom" />
          <KartDahaMenusu u={u} boyut="kucuk" side="bottom" onSil={onSil} eylemler={[{ ad: "Aç", ikon: ArrowUpRight, fn: onSec }]} />
        </span>
      ) : (
        <span className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button onClick={onSil} aria-label={`${u.baslik} sil`} title="Sil" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/85 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </span>
      )}
    </motion.div>
  );
}

const gorece = (ms: number) => {
  const dk = Math.floor((Date.now() - ms) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const g = Math.floor(sa / 24);
  return g < 30 ? `${g} gün önce` : new Date(ms).toLocaleDateString("tr", { day: "numeric", month: "short" });
};

/** Taslak beklerken dönen tel küre (şekil oluşuyor hissi). */
function TelKure({ gecikme = 0 }: { gecikme?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto h-[64%] w-[64%] text-aksan/70" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="50" cy="50" r="34" strokeOpacity=".35" />
      {[0, 1, 2].map((i) => (
        <motion.ellipse key={i} cx="50" cy="50" rx="34" ry="34" strokeOpacity=".7" initial={{ rx: 34 }} animate={{ rx: [34, 2, 34] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: gecikme + i * 1.07 }} />
      ))}
      {[-17, 0, 17].map((y) => <ellipse key={y} cx="50" cy={50 + y} rx={Math.sqrt(34 * 34 - y * y)} ry={4} strokeOpacity=".3" />)}
    </svg>
  );
}

function Halka({ yuzde }: { yuzde: number }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
      <motion.circle cx="18" cy="18" r={r} fill="none" stroke="var(--aksan, #55d6fd)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - Math.max(4, yuzde) / 100) }} transition={{ duration: 0.5 }} className="text-aksan" style={{ stroke: "currentColor" }} />
    </svg>
  );
}

function SimetriSekli({ acik }: { acik: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", acik ? "text-aksan" : "text-metin-2")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M12 3v18" strokeDasharray="2 2.5" />
      <path d="M9 7L4 12l5 5V7z" fill="currentColor" fillOpacity=".25" />
      <path d="M15 7l5 5-5 5V7z" fill="currentColor" fillOpacity={acik ? ".25" : "0"} />
    </svg>
  );
}

/** Örnek taslakları isteme en yakından uzağa sıralar (sağlayıcı yokken çıktı istemle tutarlı olsun). */
const ORNEK_ANAHTAR: Record<string, RegExp> = {
  kask: /kask|astronot|uzay|helmet|vizör|pilot/i,
  savasci: /şövalye|zırh|savaşçı|asker|insan|kahraman|heykel|kadın|erkek|kız|adam|kılıç/i,
  lamba: /lamba|ışık|masa|mobilya|vazo|sandalye|ürün|şişe|bardak|obje|aksesuar/i,
  robot: /robot|oyuncak|android|makine|mekanik|sevimli|maskot/i,
};
function ornekSirasi(metin: string) {
  const puan = (id: string) => (ORNEK_ANAHTAR[id]?.test(metin) ? 1 : 0);
  return [...ORNEKLER].sort((a, b) => puan(b.id) - puan(a.id));
}
