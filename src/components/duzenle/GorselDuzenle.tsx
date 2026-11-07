"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import {
  Wand2, Eraser, ImageOff, Sun, Brush, Square, MousePointerClick, Hand, Undo2, Redo2, FlipHorizontal2, Trash2, ZoomIn, ZoomOut, Maximize,
  Images, Upload, Loader2, Download, Maximize2, Crop, Lock, ArrowLeft, X, Layers, RefreshCw, ScanSearch, ChevronDown,
  ChevronLeft, Eye, EyeOff, Star, Quote, PanelRightClose, PanelRightOpen, ClipboardPaste, ArrowUp, History, Sparkles, Keyboard, SlidersHorizontal, RotateCcw, Expand, Lasso, UserRound, Mountain, ImagePlus, Video as VideoIcon, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast, uretimIptal } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { uretimIndir } from "@/lib/gercekEylem";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { MarkaKare } from "@/components/studyo/hf";
import { useGorselBaglanti, dosyaOku, gorselYukle, uretimGorseli, GORSEL_TURLERI, krediYaz } from "@/components/arac/kit";
import { MaskeTuvali, type MaskeArac, type MaskeTuvaliRef } from "./MaskeTuvali";
import { uretimGeriYukle } from "@/components/studyo/bildirim";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi, KartDahaMenusu, eylemDugmesi } from "@/components/galeri/KartEylemleri";
import { istemTemizlensinMi, kartOrani } from "@/lib/galeri/gorunum";

/**
 * Görsel düzenle (inpaint) — tam ekran düzenleyici.
 *
 * Firefly Generative Fill / Higgsfield Draw-to-Edit / Picsart Replace desenleri:
 *  - Tuval sayfanın merkezinde; seçim araçları solda yüzen ray, bağlam çubuğu üstte.
 *  - Komut kutusu tuvalin altında yüzer: istem + öneri çipleri + motor + varyasyon + kredi + üret.
 *    Moda göre içerik değişir (Sil istemsiz; Arka plan görselli zemin karoları; Işık yön küresi).
 *  - Sağda sürümler: orijinal + her düzenleme; seçince görselin üzerinde sürüklenen önce/sonra çizgisi.
 *  - Boş durumda dört modu animasyonla anlatan vitrin ve örnekler.
 */

const ARAC = "Görsel Düzenle";
type Mod = "degistir" | "sil" | "arkaplan" | "isik" | "genislet";
type Zemin = "seffaf" | "beyaz" | "sahne";
const MODLAR: { id: Mod; ad: string; ikon: LucideIcon; aciklama: string }[] = [
  { id: "degistir", ad: "Değiştir", ikon: Wand2, aciklama: "Boyadığın alanı istemine göre yeniden üret" },
  { id: "sil", ad: "Sil", ikon: Eraser, aciklama: "Seçili nesneyi kaldır, boşluğu çevreyle doldur" },
  { id: "arkaplan", ad: "Arka plan", ikon: ImageOff, aciklama: "Zemini kaldır ya da yeni bir sahneye taşı" },
  { id: "isik", ad: "Işık", ikon: Sun, aciklama: "Kompozisyonu koruyup ışığı yeniden kur" },
  { id: "genislet", ad: "Genişlet", ikon: Expand, aciklama: "Görseli yeni orana büyüt, kenarları doldur" },
];
const GENISLET_ORAN = ["16:9", "9:16", "1:1", "4:5", "3:2", "21:9"];
const MOTORLAR: { id: string; ad: string; logo: string; not: string }[] = [
  { id: "flux", ad: "FLUX.1 Fill Pro", logo: "FLUX.2 Pro", not: "Gerçekçi dolgu, kusursuz kenar uyumu" },
  { id: "ideogram", ad: "Ideogram 3 Edit", logo: "Ideogram 3", not: "Yazı ve grafik düzenlemede en iyisi" },
  { id: "bria", ad: "Bria GenFill", logo: "Bria", not: "Lisanslı veriyle eğitilmiş, ticari güvenli" },
];
const ORNEKLER: { ad: string; gorsel: string; mod: Mod; istem?: string; zemin?: Zemin }[] = [
  { ad: "Kıyafeti değiştir", gorsel: "/gercek/galeri/portre1.webp", mod: "degistir", istem: "kırmızı kadife ceket" },
  { ad: "Saçı değiştir", gorsel: "/gercek/arac/upscale-once.webp", mod: "degistir", istem: "kızıl dalgalı saç" },
  { ad: "Nesneyi sil", gorsel: "/gercek/galeri/sinematik3.webp", mod: "sil" },
  { ad: "Zemini değiştir", gorsel: "/gercek/galeri/urun1.webp", mod: "arkaplan", zemin: "sahne", istem: "beyaz mermer tezgâh, sabah ışığı, yumuşak gölgeler" },
  { ad: "Arka planı kaldır", gorsel: "/gercek/galeri/urun4.webp", mod: "arkaplan", zemin: "seffaf" },
  { ad: "Yeniden ışıklandır", gorsel: "/gercek/gorsel/gorsel-karakter-Sofia.webp", mod: "isik", istem: "soldan sıcak gün batımı ışığı, sinematik" },
  { ad: "Görseli genişlet", gorsel: "/gercek/galeri/manzara3.webp", mod: "genislet" },
  { ad: "Sahneyi genişlet", gorsel: "/gercek/galeri/sinematik1.webp", mod: "genislet", istem: "yağmurlu neon sokak devam etsin" },
];
const ARACLAR = [["firca", "Fırça", Brush, "B"], ["silgi", "Silgi", Eraser, "E"], ["kutu", "Kutu", Square, "R"], ["kement", "Kement", Lasso, "L"], ["akilli", "Akıllı seçim", MousePointerClick, "S"], ["el", "Kaydır", Hand, "H"]] as const;
const YONLER: { id: string; ad: string }[] = [{ id: "None", ad: "Serbest" }, { id: "Left", ad: "Soldan" }, { id: "Right", ad: "Sağdan" }, { id: "Top", ad: "Yukarıdan" }, { id: "Bottom", ad: "Aşağıdan" }];

/** Yüzen yüzey (ray, bağlam çubuğu, komut kutusu) — tek görünüm. */
const YUZEY = "cam-istemci";

export function GorselDuzenle() {
  const router = useRouter();
  const ara = useSearchParams();
  const masaustu = useMasaustu();
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();
  const s = useSaglayiciDurum();
  const tuval = useRef<MaskeTuvaliRef>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const istemRef = useRef<HTMLTextAreaElement>(null);
  const [kaynak, setKaynak] = useState<{ url: string; goster: string; durum: "yukleniyor" | "hazir" | "hata"; uretimId?: string; ad?: string } | null>(null);
  const [mod, setMod] = useState<Mod>("degistir");
  const [arac, setArac] = useState<MaskeArac>("firca");
  const [boyut, setBoyut] = useState(48);
  // İstem her mod için ayrı tutulur (Değiştir'de yazılan, Işık'a taşınmasın).
  const [istemler, setIstemler] = useState<Record<Mod, string>>({ degistir: "", sil: "", arkaplan: "", isik: "", genislet: "" });
  const [hedefOran, setHedefOran] = useState("16:9");
  // Değiştir modunda dolgu için referans görsel (ör. bu ceketi giydir).
  const [refGorsel, setRefGorsel] = useState<{ goster: string; url: string | null } | null>(null);
  const refDosya = useRef<HTMLInputElement>(null);
  const refSec = async (d: File) => {
    if (!GORSEL_TURLERI.includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    const g = await dosyaOku(d); setRefGorsel({ goster: g, url: null });
    gorselYukle(g).then((url) => setRefGorsel((x) => (x && x.goster === g ? { goster: g, url } : x))).catch(() => { setRefGorsel(null); mesaj.yuklenemedi("Referans görsel"); });
  };
  const silUretim = useProjeler((st) => st.sil);
  const [motor, setMotor] = useState("flux");
  const [zemin, setZemin] = useState<Zemin>("seffaf");
  const [yon, setYon] = useState("None");
  const [adet, setAdet] = useState(1);
  const [metinSec, setMetinSec] = useState("");
  const [durum, setDurum] = useState({ alan: 0, geri: false, ileri: false, zoom: 1, w: 0, h: 0 });
  const [akilliMesgul, setAkilliMesgul] = useState(false);
  const [seciliSonuc, setSeciliSonuc] = useState<string | null>(null);
  const [karsi, setKarsi] = useState(50);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kitaplikAcik, setKitaplikAcik] = useState(false);
  const [motorAcik, setMotorAcik] = useState(false);
  const [surumAcik, setSurumAcik] = useState(true);
  const surumEn = useKenarGenisligi("duzenle-surum", 248);
  const yanEn = useKenarGenisligi("duzenle-yan", 300, 240);
  const [surukle, setSurukle] = useState(false);
  const bekleyen = useRef<string | null>(null);
  const [maskeGizli, setMaskeGizli] = useState(false);
  const [yumusak, setYumusak] = useState<0 | 1 | 2>(1);
  const [secimAyarAcik, setSecimAyarAcik] = useState(false);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [boyutTik, setBoyutTik] = useState(0);
  const [gelistiriliyor, setGelistiriliyor] = useState(false);
  const [istemHazir, setIstemHazir] = useState(false);
  const [editorSurukle, setEditorSurukle] = useState(false);
  useEffect(() => { fetch("/api/istem").then((x) => x.json()).then((j: { hazir?: boolean }) => setIstemHazir(!!j.hazir)).catch(() => {}); }, []);
  const boyutAyarla = (v: number) => { setBoyut(v); setBoyutTik((t) => t + 1); };
  // Komut kutusunun yüksekliği → tuval görseli kalan alana sığdırır.
  const komutRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(150);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  });

  // ?kaynak=<url> — başka araçlardan "Düzenle" köprüsü
  useEffect(() => {
    const k = ara.get("kaynak");
    if (k && /^\/(api\/dosya|gercek)\//.test(k)) setKaynak({ url: k, goster: k, durum: "hazir", uretimId: ara.get("uretim") ?? undefined });
  }, [ara]);
  useEffect(() => { if (durum.w) setBoyut(Math.round(Math.max(durum.w, durum.h) * 0.035)); }, [durum.w, durum.h]);

  const kaynakSec = async (d: File) => {
    if (!GORSEL_TURLERI.includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    if (d.size > 15 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(15);
    const dataUrl = await dosyaOku(d);
    setKaynak({ url: dataUrl, goster: dataUrl, durum: "yukleniyor", ad: d.name }); setSeciliSonuc(null);
    gorselYukle(dataUrl).then((url) => setKaynak({ url, goster: dataUrl, durum: "hazir", ad: d.name })).catch((e: Error) => { setKaynak(null); mesaj.yuklenemedi("Görsel", e.message || undefined); });
  };
  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const d = [...(e.clipboardData?.files ?? [])].find((x) => GORSEL_TURLERI.includes(x.type));
      if (d) { e.preventDefault(); void kaynakSec(d); }
    };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  });

  const istem = istemler[mod];
  const setIstem = (v: string) => setIstemler((x) => ({ ...x, [mod]: v }));
  const maskeli = mod === "degistir" || mod === "sil";
  const modSec = (v: Mod) => {
    // Mod değişince sonuç karşılaştırması kapanır: yeni işlem orijinal (ya da "üzerinde devam et" ile seçilen) kaynakta yapılır.
    if (v !== mod) setSeciliSonuc(null);
    setMod(v);
    // Telefonda sekme şeridi kayar: seçilen mod görünür alana gelsin.
    requestAnimationFrame(() => document.querySelectorAll(`[data-mod="${v}"]`).forEach((el) => el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })));
    const m = v === "degistir" || v === "sil";
    if (!m) setArac("el"); else if (arac === "el") setArac("firca");
  };

  // Klavye: Ctrl+Z / Ctrl+Shift+Z, B/E/R/S/H araçlar, [ ] fırça, 1–4 modlar, Ctrl+Enter üret
  const calistirRef = useRef<() => void>(() => {});
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); calistirRef.current(); return; }
      if (/^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) tuval.current?.ileriAl(); else tuval.current?.geriAl(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k: Record<string, MaskeArac> = { b: "firca", e: "silgi", r: "kutu", l: "kement", s: "akilli", h: "el" };
      if (k[e.key.toLowerCase()]) setArac(k[e.key.toLowerCase()]);
      if (["1", "2", "3", "4", "5"].includes(e.key)) modSec(MODLAR[Number(e.key) - 1].id);
      if (e.key === "[") { setBoyut((v) => Math.max(4, Math.round(v * 0.85))); setBoyutTik((t) => t + 1); }
      if (e.key === "]") { setBoyut((v) => Math.min(600, Math.round(v * 1.18))); setBoyutTik((t) => t + 1); }
      if (e.key.toLowerCase() === "m") setMaskeGizli((v) => !v);
      if (e.key === "?") setKisayolAcik((v) => !v);
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && surumlerRef.current.length) {
        const hazirlar = surumlerRef.current.filter((u) => u.durum === "tamam");
        const sira = [null, ...hazirlar.map((u) => u.id)];
        const i = sira.indexOf(seciliRef.current);
        const j = Math.max(0, Math.min(sira.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)));
        setSeciliSonuc(sira[j]); setKarsi(50);
      }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  });

  // Sürümler: bu kaynaktan yapılan düzenlemeler
  const uretimler = useProjeler((st) => st.uretimler);
  const surumler = useMemo(() => (kaynak ? uretimler.filter((u) => u.arac === ARAC && u.meta?.gorselUrl === kaynak.url).sort((a, c) => a.olusturma - c.olusturma) : []), [uretimler, kaynak]);
  const secili = surumler.find((u) => u.id === seciliSonuc);
  const surumlerRef = useRef(surumler); surumlerRef.current = surumler;
  const [gorunum] = useGorunum("inpaint");
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const gorunenSurumler = gorunum.siralama === "yeni" ? [...surumler].reverse() : surumler;
  const seciliRef = useRef(seciliSonuc); seciliRef.current = seciliSonuc;
  const seciliGorsel = secili && secili.durum === "tamam" ? uretimGorseli(secili) ?? null : null;
  // Genişletme sonucu farklı orandadır: orijinal çerçevede kırpılmasın diye kendi oranında, karşılaştırmasız gösterilir.
  const genisSonuc = !!seciliGorsel && secili?.meta?.islem === "genislet";
  useEffect(() => {
    const id = bekleyen.current; if (!id) return;
    const u = uretimler.find((x) => x.id === id);
    if (u && (u.durum === "tamam" || u.durum === "hata")) { bekleyen.current = null; if (u.durum === "tamam") { setSeciliSonuc(u.id); setKarsi(50); setSurumAcik(true); } }
  }, [uretimler]);
  const surer = surumler.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor");

  // Akıllı seçim (SAM 3)
  const akilliSec = useCallback(async (nokta?: { x: number; y: number; cikar: boolean }, metin?: string) => {
    if (!kaynak || kaynak.durum !== "hazir") return;
    if (!s.fal) return void toast.error("Akıllı seçim kullanılamıyor", { description: "Bunun için fal.ai bağlantısı gerekli. Şimdilik fırça ya da kutuyla seç." });
    setAkilliMesgul(true);
    try {
      const j = (await (await fetch("/api/gorsel/segment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gorselUrl: kaynak.url, ...(nokta ? { noktalar: [{ x: nokta.x, y: nokta.y, ekle: !nokta.cikar }] } : { metin: metin ?? metinSec }) }) })).json()) as { ok: boolean; maskeUrl?: string; hata?: string };
      if (!j.ok || !j.maskeUrl) throw new Error(j.hata ?? "Seçilemedi");
      await tuval.current?.maskeUygula(j.maskeUrl, nokta?.cikar);
    } catch (e) { toast.error("Seçim yapılamadı", { description: e instanceof Error ? e.message : "Akıllı seçim yanıt vermedi. Fırça ya da kutuyla seç." }); }
    finally { setAkilliMesgul(false); }
  }, [kaynak, s.fal, metinSec]);

  /* ── Kredi, motor, eksik ── */
  const sahne = mod === "arkaplan" && zemin === "sahne";
  const istemli = mod === "degistir" || sahne || mod === "isik";
  const genislet = mod === "genislet";
  const fiyat = mod === "degistir" ? 3 : mod === "sil" ? 1 : mod === "isik" ? 3 : genislet ? 2 : sahne ? 2 : 1;
  const demo = b.hazir && !b.herhangi;
  const birim = !b.herhangi ? 0 : fiyat;
  // Yalnız gerçek bir sağlayıcı bağlıyken (ama ayırma modeli yokken) kilitlenir; demo modunda örnek sonuç gösterilir.
  const kilit = mod === "arkaplan" && zemin === "seffaf" && b.herhangi && !s.fal && !s.openai;
  const fal = s.fal || demo;
  const motorAdi = mod === "degistir" ? (fal ? MOTORLAR.find((m) => m.id === motor)!.ad : "Nano Banana 2.1 · anlamsal") : mod === "sil" ? (fal ? "Bria Eraser" : "Nano Banana 2.1 · anlamsal")
    : mod === "isik" ? (fal ? "IC-Light v2" : "Nano Banana 2.1 · talimat") : genislet ? (fal ? "Bria Expand" : "Nano Banana 2.1 · genişletme") : sahne ? (fal ? "Bria Background Replace" : "Nano Banana 2.1 · talimat") : zemin === "seffaf" ? (fal ? "BiRefNet v2" : "GPT Image 1.5") : "Nano Banana 2.1 · talimat";
  const motorLogo = motorAdi.includes("Nano") ? "Nano Banana 2.1" : motorAdi.includes("GPT") ? "GPT Image 2" : motorAdi.includes("FLUX") ? "FLUX.2 Pro" : motorAdi.includes("Ideogram") ? "Ideogram 3" : motorAdi;
  const coklu = mod === "degistir" || mod === "sil" || sahne || mod === "isik" || genislet;
  const n = coklu ? adet : 1;
  const eksik = !kaynak ? "Önce bir görsel seç" : kaynak.durum !== "hazir" ? "Görsel yükleniyor"
    : maskeli && durum.alan <= 0 ? (mod === "sil" ? "Silinecek nesneyi boya" : "Değişecek alanı boya")
    : istemli && istem.trim().length < 3 ? (mod === "isik" ? "Işığı birkaç kelimeyle anlat" : sahne ? "Yeni arka planı anlat" : "Ne olacağını yaz")
    : kilit ? "Şeffaf arka plan için fal.ai ya da OpenAI bağlı olmalı"
    : refGorsel && !refGorsel.url && mod === "degistir" ? "Referans görsel yükleniyor" : null;

  const calistir = async () => {
    if (gonderiliyor) return;
    if (eksik || !kaynak) { toast.error("Düzenleme başlatılamadı", { description: `${eksik ?? "Önce bir görsel seç"}.` }); if (istemli && istem.trim().length < 3) istemRef.current?.focus(); return; }
    if (istemli) { const d = icerikDenetle(istem); if (!d.izin) return void toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}. ${d.mesaj}` }); }
    setGonderiliyor(true);
    let maskeUrl: string | undefined;
    try {
      if (maskeli) { const m = tuval.current?.maskeAl([0, Math.max(2, Math.round(Math.max(durum.w, durum.h) * 0.004)), Math.max(6, Math.round(Math.max(durum.w, durum.h) * 0.012))][yumusak]); if (!m) throw new Error("Maske boş"); maskeUrl = await gorselYukle(m); }
    } catch (e) { setGonderiliyor(false); return void toast.error("Maske yüklenemedi", { description: e instanceof Error ? e.message : "Seçim alanı sunucuya gönderilemedi. Yeniden dene." }); }
    const islem = mod === "degistir" ? "maske" : mod === "sil" ? "sil" : mod === "isik" ? "isik" : genislet ? "genislet" : sahne ? "zemin-degistir" : "arkaplan";
    const prompt = mod === "sil" ? (istem.trim() || "Seçili nesneyi kaldır") : genislet ? (istem.trim() || `${hedefOran} orana genişlet`) : mod === "arkaplan" && !sahne ? (zemin === "seffaf" ? "Arka planı kaldır" : "Beyaz zemine al") : istem.trim();
    let basarili = 0;
    for (let i = 0; i < n; i++) {
      const r = uretimBaslat({
        baslik: `${MODLAR.find((m) => m.id === mod)!.ad} · ${prompt.slice(0, 40)}`, tur: "gorsel", model: motorAdi, prompt, kredi: birim, arac: ARAC, projeId: aktifProjeId ?? undefined,
        meta: { islem, gorselUrl: kaynak.url, hamIstem: prompt, ...(maskeUrl ? { maskeUrl } : {}), ...(mod === "degistir" ? { motor } : {}), ...(mod === "isik" ? { yon } : {}),
          ...(mod === "arkaplan" && !sahne ? { zemin } : {}), ...(kaynak.uretimId ? { kaynakId: kaynak.uretimId } : {}), oran: genislet ? hedefOran : "Auto", ...(genislet && !istem.trim() ? { istemsiz: true } : {}),
          ...(mod === "degistir" && refGorsel?.url ? { referanslar: [refGorsel.url] } : {}) },
      });
      if (!r.ok) { if (!basarili) uretimHataToast(r); break; }
      basarili++; bekleyen.current = r.id ?? null;
    }
    setGonderiliyor(false);
    if (basarili && istemTemizlensinMi("inpaint")) setIstem("");
    if (basarili) { setSurumAcik(true); toast.success(basarili > 1 ? `${basarili} varyasyon hazırlanıyor` : "Düzenleniyor", { description: `${motorAdi} · ${birim ? `${krediYaz(birim * basarili)} kredi.` : "Kredi düşmez."}` }); }
  };
  calistirRef.current = () => void calistir();

  /** Başarısız sürümü aynı girdilerle (maske, istem, motor) yeniden dener. */
  const yenidenDene = (u: Uretim) => {
    const r = uretimBaslat({ baslik: u.baslik, tur: "gorsel", model: u.model, prompt: u.prompt, kredi: u.kredi ?? 0, arac: ARAC, projeId: aktifProjeId ?? undefined, meta: u.meta });
    if (!r.ok) return uretimHataToast(r);
    bekleyen.current = r.id ?? null;
    toast.success("Yeniden deneniyor", { description: u.model });
  };
  const istemGelistir = async () => {
    if (!istemHazir) return void toast.info("İstem geliştirme kapalı", { description: "Yapay zekâ (Gemini) anahtarı bağlanınca açılır." });
    if (istem.trim().length < 2) return void toast.info("İstem çok kısa", { description: "Geliştirmek için önce birkaç kelime yaz." });
    setGelistiriliyor(true);
    try {
      const j = (await (await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "gelistir", istem }) })).json()) as { ok: boolean; istem?: string; hata?: string };
      if (!j.ok || !j.istem) throw new Error(j.hata);
      setIstem(j.istem.slice(0, 500));
    } catch (e) { toast.error("İstem geliştirilemedi", { description: e instanceof Error ? e.message : "Yapay zekâ yanıt vermedi. Biraz sonra yeniden dene." }); }
    finally { setGelistiriliyor(false); }
  };
  const ISLEM_MOD: Record<string, Mod> = { maske: "degistir", sil: "sil", isik: "isik", "zemin-degistir": "arkaplan", arkaplan: "arkaplan", genislet: "genislet" };
  /** Boş ekran: daha önce düzenlenen kaynaklar (en son düzenlenen önce). */
  const sonKaynaklar = useMemo(() => {
    const m = new Map<string, { url: string; adet: number; son: number; kapak?: string }>();
    for (const u of uretimler) {
      if (u.arac !== ARAC || !u.meta?.gorselUrl || u.meta.gorselUrl.startsWith("data:")) continue;
      const k = u.meta.gorselUrl; const x = m.get(k);
      const kapak = u.durum === "tamam" && u.gercek !== false ? uretimGorseli(u) : undefined;
      if (x) { x.adet++; if (u.olusturma > x.son) { x.son = u.olusturma; x.kapak = kapak ?? x.kapak; } }
      else m.set(k, { url: k, adet: 1, son: u.olusturma, kapak });
    }
    return [...m.values()].sort((a, c) => c.son - a.son).slice(0, 6);
  }, [uretimler]);

  const kaynakYap = (u: Uretim) => {
    const g = uretimGorseli(u); if (!g || u.gercek === false) return;
    setKaynak({ url: g, goster: g, durum: "hazir", uretimId: u.id }); setSeciliSonuc(null); tuval.current?.temizle();
    toast.success("Sonuç yeni kaynak yapıldı", { description: "Üzerinde düzenlemeye devam edebilirsin." });
  };
  const ornekAc = (o: (typeof ORNEKLER)[number]) => {
    setKaynak({ url: o.gorsel, goster: o.gorsel, durum: "hazir", ad: o.ad }); setSeciliSonuc(null);
    modSec(o.mod); setIstemler((x) => ({ ...x, [o.mod]: o.istem ?? "" })); if (o.zemin) setZemin(o.zemin);
  };
  const kitaplikListe = uretimler.filter((u) => u.tur === "gorsel" && u.durum === "tamam" && u.gercek !== false && !u.id.startsWith("seed_")).slice(0, 24);

  const ctaEtiket = mod === "degistir" ? "Düzenle" : mod === "sil" ? "Sil" : mod === "isik" ? "Işığı uygula" : genislet ? "Genişlet" : sahne ? "Zemini değiştir" : zemin === "seffaf" ? "Arka planı kaldır" : "Beyaz zemine al";

  /* ═════════════ Parçalar ═════════════ */

  const modSekmeleri = (
    <div role="tablist" aria-label="İşlem" className="isolate flex items-center gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
      {MODLAR.map((m, i) => (
        masaustu ? (
          <Tooltip key={m.id} label={`${m.ad}: ${m.aciklama} (${i + 1})`} side="bottom">
            <button role="tab" data-mod={m.id} aria-selected={mod === m.id} onClick={() => modSec(m.id)}
            className={cn("relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors active:scale-[0.97]", mod === m.id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {mod === m.id && <motion.span layoutId="dzMod" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
            <m.ikon className="h-4 w-4" /><span>{m.ad}</span>
          </button>
          </Tooltip>
        ) : <span key={m.id} className="contents"><button role="tab" data-mod={m.id} aria-selected={mod === m.id} onClick={() => modSec(m.id)}
            className={cn("relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors active:scale-[0.97]", mod === m.id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {mod === m.id && <motion.span layoutId="dzMod" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
            <m.ikon className="h-4 w-4" /><span>{m.ad}</span>
          </button></span>
      ))}
    </div>
  );

  /** Motor çipi + popover. */
  const motorCipi = (
    <div className="relative">
      <button onClick={() => mod === "degistir" && fal && setMotorAcik((v) => !v)} aria-expanded={motorAcik}
        className={cn("flex h-11 items-center gap-2.5 rounded-full bg-white/[0.05] pl-1.5 pr-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors max-sm:pr-1.5", mod === "degistir" && fal ? "hover:bg-white/[0.09] active:scale-[0.98]" : "cursor-default", motorAcik && "bg-white/[0.1]")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full [&>span]:!h-8 [&>span]:!w-8 [&>span]:!rounded-full"><MarkaKare ad={motorLogo} boyut={32} /></span>
        <span className="min-w-0 leading-tight max-sm:hidden">
          <span className="block text-[11px] text-metin-3">Motor</span>
          <span className="block whitespace-nowrap text-[13px] font-semibold text-metin">{motorAdi}</span>
        </span>
        {mod === "degistir" && fal && <ChevronDown className={cn("h-3.5 w-3.5 text-metin-3 transition-transform max-sm:hidden", motorAcik && "rotate-180")} />}
      </button>
      <Yuzen acik={motorAcik} onKapat={() => setMotorAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Motor"
        className="w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#1b1c1f]">
        <MenuKart className="rounded-none ring-0" baslik="Doldurma motoru" sag={<span className="text-[11.5px] text-metin-3">Boyadığın alanı doldurur</span>}>
          <div className="space-y-1 p-1.5">
            {MOTORLAR.map((m, k) => {
              const sec = motor === m.id;
              return (
                <motion.button key={m.id} onClick={() => { setMotor(m.id); setMotorAcik(false); }} aria-pressed={sec}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * k }} whileTap={{ scale: 0.98 }}
                  className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.05]")}>
                  <MarkaKare ad={m.logo} boyut={36} />
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-metin">{m.ad}</span><span className="block text-[11.5px] leading-snug text-metin-2">{m.not}</span></span>
                  {!demo && <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] tabular-nums text-metin"><KrediYildiz className="h-3 w-3" />{krediYaz(fiyat)}</span>}
                </motion.button>
              );
            })}
          </div>
        </MenuKart>
      </Yuzen>
    </div>
  );

  /** Moda özel içerik (komut kutusunun üst bölümü). */
  const modIcerik = (
    <>
      {mod === "arkaplan" && (
        <div className="grid grid-cols-3 gap-1.5 px-1 pt-1">
          {([["seffaf", "Şeffaf", "PNG, zeminsiz"], ["beyaz", "Beyaz", "Ürün sayfası için"], ["sahne", "Yeni sahne", "İstemle üret"]] as const).map(([id, ad, alt], k) => {
            const sec = zemin === id;
            const kapali = id === "seffaf" && b.herhangi && !s.fal && !s.openai;
            return (
              <motion.button key={id} onClick={() => setZemin(id)} aria-pressed={sec} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * k }} whileTap={{ scale: 0.97 }}
                className={cn("group overflow-hidden rounded-[14px] text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/80" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06] hover:ring-white/20")}>
                <span className="relative m-1 mb-0 block h-[64px] overflow-hidden rounded-[10px] sm:h-[78px]"
                  style={id === "seffaf" ? { backgroundImage: "conic-gradient(#3a3a40 25%, #26262b 0 50%, #3a3a40 0 75%, #26262b 0)", backgroundSize: "12px 12px" } : id === "beyaz" ? { background: "radial-gradient(120% 90% at 50% 30%, #ffffff, #e9e9ec)" } : undefined}>
                  {id === "sahne" && (/* eslint-disable-next-line @next/next/no-img-element */ <img src="/gercek/galeri/manzara3.webp" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />)}
                  {id === "beyaz" && <span className="absolute inset-x-6 bottom-2 h-2 rounded-full bg-black/[0.08] blur-[3px]" />}
                  {kaynak && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kaynak.goster} alt="" className="absolute inset-x-0 bottom-1.5 top-2 mx-auto h-[calc(100%-14px)] w-auto max-w-[70%] rounded-[5px] object-contain transition-transform duration-300 group-hover:-translate-y-0.5" />)}
                  {kapali && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-amber-300 backdrop-blur"><Lock className="h-3 w-3" /></span>}
                </span>
                <span className="block px-2.5 pb-2 pt-1.5">
                  <span className="block text-[12.5px] font-semibold leading-tight text-metin">{ad}</span>
                  <span className="block text-[11px] leading-tight text-metin-2">{alt}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
      {mod === "isik" && (
        <div className="grid grid-cols-5 gap-1.5 px-1 pt-1">
          {YONLER.map((y, k) => {
            const sec = yon === y.id;
            const isik = y.id === "Left" ? "0% 50%" : y.id === "Right" ? "100% 50%" : y.id === "Top" ? "50% 0%" : y.id === "Bottom" ? "50% 100%" : "50% 35%";
            return (
              <motion.button key={y.id} onClick={() => setYon(y.id)} aria-pressed={sec} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.035 * k }} whileTap={{ scale: 0.97 }}
                className={cn("group overflow-hidden rounded-[14px] text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/80" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06] hover:ring-white/20")}>
                <span className="relative m-1 mb-0 block h-[58px] overflow-hidden rounded-[10px] bg-[#141416] sm:h-[70px]">
                  {kaynak && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kaynak.goster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-[.6]" />)}
                  <span className="absolute inset-0 transition-opacity duration-300" style={{ background: `radial-gradient(circle at ${isik}, rgba(255,214,140,${y.id === "None" ? ".35" : ".7"}), transparent 65%)`, mixBlendMode: "screen", opacity: sec ? 1 : 0.75 }} />
                  {y.id !== "None" && <span className={cn("absolute h-2 w-2 rounded-full bg-amber-200 transition-transform duration-300 group-hover:scale-125", y.id === "Left" ? "left-1.5 top-1/2 -translate-y-1/2" : y.id === "Right" ? "right-1.5 top-1/2 -translate-y-1/2" : y.id === "Top" ? "left-1/2 top-1.5 -translate-x-1/2" : "bottom-1.5 left-1/2 -translate-x-1/2")} />}
                </span>
                <span className="block px-1 pb-2 pt-1.5 text-center text-[11px] font-semibold leading-tight text-metin sm:px-2 sm:text-[12px]">{y.ad}</span>
              </motion.button>
            );
          })}
        </div>
      )}
      {genislet && (
        <div className="grid grid-cols-6 gap-1.5 px-1 pt-1 max-sm:grid-cols-3">
          {GENISLET_ORAN.map((o, j) => {
            const [a, c] = o.split(":").map(Number); const sec = hedefOran === o;
            const hedef = a / c, kutu = 52;
            const kW = hedef >= 1 ? kutu : kutu * hedef, kH = hedef >= 1 ? kutu / hedef : kutu;
            const mevcut = durum.w > 0 ? durum.w / durum.h : 1;
            const ic = mevcut > hedef ? { w: 100, h: (hedef / mevcut) * 100 } : { w: (mevcut / hedef) * 100, h: 100 };
            return (
              <motion.button key={o} onClick={() => setHedefOran(o)} aria-pressed={sec} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * j }} whileTap={{ scale: 0.97 }}
                className={cn("group overflow-hidden rounded-[14px] ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/80" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06] hover:ring-white/20")}>
                <span className="m-1 mb-0 flex h-[46px] items-center sm:h-[66px] justify-center rounded-[10px] bg-white/[0.03]">
                  <span className={cn("relative scale-[.78] overflow-hidden rounded-[5px] border border-dashed transition-colors sm:scale-100", sec ? "border-white/80 bg-white/[0.08]" : "border-white/35 bg-white/[0.03] group-hover:border-white/55")} style={{ width: kW, height: kH }}>
                    {kaynak ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kaynak.goster} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover" style={{ width: `${ic.w}%`, height: `${ic.h}%` }} />) : null}
                  </span>
                </span>
                <span className="block px-2 pb-2 pt-1.5 text-center text-[12px] font-semibold tabular-nums text-metin">{o}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </>
  );

  const komutKutusu = (
    <div className={cn("w-full rounded-[22px] p-1.5", YUZEY)}>
      {modIcerik}
      {(istemli || mod === "sil" || genislet) && (
        <div className="flex items-start gap-2 px-2.5 pt-2">
          {mod === "degistir" && (
            <Tooltip label={refGorsel ? "Referansı kaldır" : "Referans görsel ekle: dolgu bu görsele benzer (ör. bu ceket)"} side="top">
              <button onClick={() => (refGorsel ? setRefGorsel(null) : refDosya.current?.click())} aria-label={refGorsel ? "Referansı kaldır" : "Referans görsel ekle"}
                className="group/rf relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.08] text-metin-2 transition hover:bg-white/[0.13] hover:text-metin active:scale-95">
                {refGorsel ? (<>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={refGorsel.goster} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover/rf:opacity-100">{refGorsel.url ? <X className="h-4 w-4 text-white" /> : <Loader2 className="h-4 w-4 animate-spin text-white" />}</span></>) : <ImagePlus className="h-4 w-4" />}
              </button>
            </Tooltip>
          )}
          {mod === "sil" && (
            <Tooltip label={durum.alan ? "Boyadığın nesne kaldırılır, boşluk çevresine uygun doldurulur. İstem gerekmez." : "Silmek istediğin nesneyi boya ya da Akıllı seçimle tıkla."} side="top">
              <span tabIndex={0} aria-label="Sil ipucu" className="flex h-9 w-9 shrink-0 cursor-help items-center justify-center rounded-[10px] bg-white/[0.08] text-metin-2 transition-colors hover:bg-white/[0.13] hover:text-metin">
                <Eraser className="h-4 w-4" />
              </span>
            </Tooltip>
          )}
          <input ref={refDosya} type="file" accept={GORSEL_TURLERI.join(",")} hidden onChange={(e) => { const d = e.target.files?.[0]; if (d) void refSec(d); e.target.value = ""; }} />
          <textarea ref={istemRef} value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 500))} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void calistir(); } }}
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(120, el.scrollHeight)}px`; }}
            aria-label="Düzenleme istemi" spellCheck={false}
            placeholder={genislet ? "İsteğe bağlı: yeni kenarlarda ne olsun?" : mod === "sil" ? "İsteğe bağlı: yerine ne gelsin?" : mod === "isik" ? "Işığı anlat: soldan sıcak gün batımı, sinematik" : sahne ? "Yeni arka planı anlat: beyaz mermer tezgâh, sabah ışığı" : durum.alan ? "Boyadığın alan ne olsun? ör. kırmızı kadife ceket" : "Önce görselde değişecek alanı boya"}
            className="block max-h-[120px] min-h-[26px] w-full resize-none bg-transparent py-1.5 text-[14.5px] leading-relaxed text-metin outline-none placeholder:text-metin-2" />
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-1.5 border-t border-white/[0.06] px-1 pt-2">
        {motorCipi}
        {coklu && (
          <Tooltip label="Kaç varyasyon üretilsin" side="top">
            <div className="flex h-11 items-center gap-1 rounded-full bg-white/[0.05] py-1 pl-3 pr-1 ring-1 ring-inset ring-white/[0.07]">
              <span className="mr-1 text-[12px] font-medium text-metin-3 max-sm:hidden">Adet</span>
              {[1, 2, 4].map((k) => (
                <button key={k} onClick={() => setAdet(k)} aria-pressed={adet === k} aria-label={k + " varyasyon"}
                  className={cn("relative h-9 min-w-9 rounded-full px-2 text-[13px] font-semibold tabular-nums transition-colors", adet === k ? "text-black" : "text-metin-2 hover:text-metin")}>
                  {adet === k && <motion.span layoutId="duzenle-adet" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <span className="relative">{k}</span>
                </button>
              ))}
            </div>
          </Tooltip>
        )}
        {istemli && (
          <Tooltip label={istemHazir ? "İstemi geliştir: ayrıntı ve ışık ekler" : "İstem geliştirme için yapay zekâ anahtarı gerekli"} side="top">
            <button onClick={() => void istemGelistir()} disabled={gelistiriliyor} aria-label="İstemi geliştir"
              className={cn("relative flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.07] transition-colors", istemHazir ? "text-metin-2 hover:bg-white/[0.09] hover:text-metin active:scale-95" : "text-metin-3")}>
              {gelistiriliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {!istemHazir && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2a2b30] ring-1 ring-white/10"><Lock className="h-2.5 w-2.5" /></span>}
            </button>
          </Tooltip>
        )}
        <span className="flex-1" />
        <Tooltip label={eksik ?? "Ctrl+Enter ile de gönderebilirsin"} side="top">
        <button onClick={() => void calistir()} disabled={gonderiliyor}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-95 max-sm:px-3.5">
          {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : kilit ? <Lock className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.6} />}
          {ctaEtiket}
          {!demo && !kilit && birim > 0 && <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{krediYaz(birim * n)}</span>}
        </button>
        </Tooltip>
      </div>
    </div>
  );

  /** Sol yüzen araç rayı. */
  const aracRayi = maskeli && !seciliGorsel && (
    <div role="toolbar" aria-label="Seçim araçları" className={cn("flex flex-col gap-0.5 rounded-[16px] p-1.5", YUZEY)}>
      {ARACLAR.map(([id, a, I, k]) => {
        const kapali = id === "akilli" && b.hazir && !s.fal && !demo;
        return (
          <Tooltip key={id} label={kapali ? `${a} · fal.ai bağlantısı gerekli` : `${a} · ${k}`} side="right">
            <button onClick={() => !kapali && setArac(id)} aria-pressed={arac === id} aria-label={a}
              className={cn("relative flex h-10 w-10 items-center justify-center rounded-[11px] transition-colors", arac === id ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.08] hover:text-white", kapali && "opacity-40")}>
              <I className="h-[18px] w-[18px]" strokeWidth={arac === id ? 2.2 : 1.9} />
              {kapali && <Lock className="absolute right-1 top-1 h-2.5 w-2.5 text-amber-200" />}
            </button>
          </Tooltip>
        );
      })}
      <span className="mx-2 my-1 h-px bg-white/10" />
      {([[Undo2, "Geri al · Ctrl+Z", () => tuval.current?.geriAl(), !durum.geri], [Redo2, "Yinele · Ctrl+Shift+Z", () => tuval.current?.ileriAl(), !durum.ileri],
        [FlipHorizontal2, "Seçimi ters çevir", () => tuval.current?.tersCevir(), false], [Layers, "Seçimi genişlet · kenar izlerini azaltır", () => tuval.current?.genislet(Math.max(4, Math.round(Math.max(durum.w, durum.h) * 0.008))), !durum.alan],
        [Trash2, "Seçimi temizle", () => tuval.current?.temizle(), !durum.alan]] as const).map(([I, a, f, kapali]) => (
        <Tooltip key={a} label={a} side="right">
          <button onClick={f} disabled={kapali} aria-label={a} className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"><I className="h-[18px] w-[18px]" strokeWidth={1.9} /></button>
        </Tooltip>
      ))}
    </div>
  );

  /** Üst bağlam çubuğu: seçili aracın ayarı + seçim alanı. */
  const firçaMaks = Math.max(120, Math.round(Math.max(durum.w, durum.h) * 0.2));
  const baglamCubugu = maskeli && !seciliGorsel && (
    <div className={cn("flex h-11 items-center gap-3 rounded-full pl-4 pr-1.5", YUZEY)}>
      {arac === "firca" || arac === "silgi" ? (
        <>
          <span className="text-[12.5px] font-semibold text-white">{arac === "firca" ? "Fırça" : "Silgi"}</span>
          <span className="flex h-7 w-7 items-center justify-center"><span className={cn("rounded-full", arac === "silgi" ? "bg-rose-300/80" : "bg-white")} style={{ width: 6 + (boyut / firçaMaks) * 20, height: 6 + (boyut / firçaMaks) * 20 }} /></span>
          <input type="range" min={4} max={firçaMaks} value={boyut} onChange={(e) => boyutAyarla(Number(e.target.value))} aria-label="Fırça boyutu"
            className="vy-aralik-beyaz w-36 cursor-pointer appearance-none rounded-full" style={{ ["--d" as string]: `${((boyut - 4) / (firçaMaks - 4)) * 100}%` }} />
          <span className="w-12 text-[12px] tabular-nums text-white/65">{boyut} px</span>
          <span className="hidden items-center gap-1 text-[11px] text-white/40 xl:flex"><kbd>[</kbd><kbd>]</kbd></span>
        </>
      ) : arac === "akilli" ? (
        <>
          <ScanSearch className="h-4 w-4 text-white" />
          <input value={metinSec} onChange={(e) => setMetinSec(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === "Enter" && metinSec.trim()) void akilliSec(); }}
            placeholder="Nesneye tıkla (Alt+tık çıkarır) ya da yaz: gökyüzü, araba" aria-label="Metinle seç"
            className="w-60 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/50" />
          <button onClick={() => void akilliSec()} disabled={!metinSec.trim() || akilliMesgul} className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-40">{akilliMesgul ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Seç"}</button>
          <span className="h-5 w-px bg-white/15" />
          <button onClick={() => void akilliSec(undefined, "main subject")} disabled={akilliMesgul} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.14] disabled:opacity-40"><UserRound className="h-3.5 w-3.5" />Özne</button>
          <button onClick={() => void akilliSec(undefined, "background")} disabled={akilliMesgul} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.14] disabled:opacity-40"><Mountain className="h-3.5 w-3.5" />Arka plan</button>
        </>
      ) : (
        <span className="text-[12.5px] text-white/75">{arac === "kutu" ? "Sürükleyerek dikdörtgen seçim çiz" : arac === "kement" ? "Alanın çevresini çiz, bırakınca dolar (Alt ile çıkar)" : "Sürükleyerek kaydır, tekerlekle yakınlaş"}</span>
      )}
      <span className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold tabular-nums transition-colors", durum.alan ? "bg-white text-black" : "bg-white/[0.06] text-white/55")}>
        <span className={cn("h-2 w-2 rounded-full", durum.alan ? "bg-black" : "bg-white/25")} />Yüzde {Math.round(durum.alan * 100)} seçili
      </span>
      <Tooltip label={maskeGizli ? "Seçimi göster · M" : "Seçimi gizle · M"} side="bottom">
        <button onClick={() => setMaskeGizli((v) => !v)} aria-pressed={maskeGizli} aria-label="Seçimi göster/gizle"
          className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", maskeGizli ? "bg-white/[0.12] text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
          {maskeGizli ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Tooltip>
      <div className="relative">
        <button onClick={() => setSecimAyarAcik((v) => !v)} aria-expanded={secimAyarAcik} aria-label="Seçim ayarları" title="Seçim kenarı"
          className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", secimAyarAcik ? "bg-white/[0.12] text-white" : "text-white/60 hover:bg-white/10 hover:text-white")}>
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <Yuzen acik={secimAyarAcik} onKapat={() => setSecimAyarAcik(false)} yerlesim="alt-sag" bosluk={10} etiket="Seçim ayarları"
          className="w-[300px] rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-3">
          <p className="text-[13px] font-semibold text-metin">Kenar geçişi</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-metin-2">Yeni içeriğin çevreye ne kadar yumuşak karışacağı.</p>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {(["Keskin", "Yumuşak", "Çok yumuşak"] as const).map((ad, i) => (
              <button key={ad} onClick={() => setYumusak(i as 0 | 1 | 2)} aria-pressed={yumusak === i}
                className={cn("flex flex-col items-center gap-1.5 rounded-[12px] py-2.5 ring-1 ring-inset transition-colors", yumusak === i ? "bg-white/[0.1] ring-white/70" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className="h-7 w-7 rounded-full bg-white" style={{ filter: `blur(${[0, 2.5, 5][i]}px)` }} />
                <span className="text-[11.5px] font-medium text-metin">{ad}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { tuval.current?.genislet(Math.max(4, Math.round(Math.max(durum.w, durum.h) * 0.008))); setSecimAyarAcik(false); }} disabled={!durum.alan}
            className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.05] text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.09] hover:text-metin disabled:opacity-40">
            <Layers className="h-3.5 w-3.5" />Seçimi biraz genişlet
          </button>
        </Yuzen>
      </div>
    </div>
  );

  /** Sağ alt: yakınlaştırma. */
  const zoomCubugu = (
    <div className={cn("flex items-center gap-0.5 rounded-full p-1", YUZEY)}>
      <button onClick={() => tuval.current?.yakinlas(0.8)} aria-label="Uzaklaş" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"><ZoomOut className="h-4 w-4" /></button>
      <button onClick={() => tuval.current?.sigdir()} title="Sığdır" className="w-12 text-center text-[12px] tabular-nums text-white/80 hover:text-white">{Math.round(durum.zoom * 100)}</button>
      <button onClick={() => tuval.current?.yakinlas(1.25)} aria-label="Yakınlaş" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"><ZoomIn className="h-4 w-4" /></button>
      <button onClick={() => tuval.current?.sigdir()} aria-label="Sığdır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"><Maximize className="h-4 w-4" /></button>
      <span className="mx-0.5 h-5 w-px bg-white/15" />
      <div className="relative">
        <button onClick={() => setKisayolAcik((v) => !v)} aria-label="Klavye kısayolları" title="Kısayollar · ?" className={cn("flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 hover:text-white", kisayolAcik ? "bg-white/10 text-white" : "text-white/75")}><Keyboard className="h-4 w-4" /></button>
        <Yuzen acik={kisayolAcik} onKapat={() => setKisayolAcik(false)} yerlesim="alt-sag" bosluk={10} etiket="Kısayollar"
          className="w-[300px] rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-3">
          <p className="mb-2 text-[13px] font-semibold text-metin">Klavye kısayolları</p>
          {([["Fırça · Silgi · Kutu", ["B", "E", "R"]], ["Akıllı seçim · Kaydır", ["S", "H"]], ["Fırça boyutu", ["[", "]"]], ["Kaydır (basılı tut)", ["Space"]], ["Geri al · Yinele", ["Ctrl", "Z"]],
            ["Kement", ["L"]], ["Seçimi göster/gizle", ["M"]], ["Mod değiştir", ["1", "5"]], ["Sürümler arasında gez", ["Sol", "Sağ"]], ["Üret", ["Ctrl", "Enter"]], ["Yakınlaş", ["Tekerlek"]]] as const).map(([ad, t]) => (
            <div key={ad} className="flex items-center justify-between gap-2 py-1 text-[12.5px]">
              <span className="text-metin-2">{ad}</span>
              <span className="flex items-center gap-1">{t.map((k) => <kbd key={k}>{k}</kbd>)}</span>
            </div>
          ))}
        </Yuzen>
      </div>
    </div>
  );

  /** Sürümler paneli. */
  const surumKarti = (u: Uretim | null, i: number) => {
    const g = u ? uretimGorseli(u) : kaynak?.goster;
    const sec = u ? seciliSonuc === u.id : !seciliSonuc;
    const calisiyor = u && (u.durum === "kuyrukta" || u.durum === "isleniyor");
    return (
      <div role="button" tabIndex={0} key={u?.id ?? "orijinal"} title={u ? u.prompt : "Orijinal görsel"} onClick={() => { if (!u) setSeciliSonuc(null); else if (u.durum === "tamam") { setSeciliSonuc(u.id); setKarsi(50); } }}
        onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) { if (!u) setSeciliSonuc(null); else if (u.durum === "tamam") { setSeciliSonuc(u.id); setKarsi(50); } } }}
        style={{ aspectRatio: String(kartOrani(gorunum, 1)) }}
        className={cn("group relative w-full cursor-pointer overflow-hidden rounded-[12px] bg-white/[0.03] ring-inset transition-shadow", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] hover:ring-white/25")}>
        {u?.durum === "hata" ? (
          <span className="flex h-full flex-col items-center justify-center gap-1.5 p-2 text-center">
            <X className="h-4 w-4 text-rose-300" /><span className="text-[10.5px] leading-tight text-rose-200/80">Başarısız · kredi iade</span>
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); yenidenDene(u!); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); yenidenDene(u!); } }}
              className="flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-white hover:bg-white/[0.15]"><RotateCcw className="h-3 w-3" />Tekrar dene</span>
          </span>
        ) : calisiyor ? (
          <span className="uy-kart absolute inset-0">
            <span className="uy-bulut uy-bulut-1" /><span className="uy-bulut uy-bulut-2" /><span className="uy-tara" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1"><Loader2 className="h-4 w-4 animate-spin text-white" /><span className="text-[10.5px] text-white/70">Düzenleniyor</span></span>
            <span role="button" tabIndex={0} aria-label="İptal" onClick={(e) => { e.stopPropagation(); uretimIptal(u!.id); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); uretimIptal(u!.id); } }}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white/80 opacity-0 transition-opacity hover:bg-rose-500/80 group-hover:opacity-100"><X className="h-3 w-3" /></span>
          </span>
        ) : g ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={g} alt="" className="h-full w-full object-cover" />) : null}
        <span className={cn("absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-1.5 py-px text-[10.5px] font-semibold", sec ? "bg-white text-black" : "bg-black/60 text-white backdrop-blur")}>
          {u ? (() => { const md = MODLAR.find((x) => x.id === (ISLEM_MOD[String(u.meta?.islem)] ?? "degistir")); return <>{md && <md.ikon className="h-3 w-3" aria-label={md.ad} />}V{i}</>; })() : "Orijinal"}
        </span>
        {u && u.durum !== "kuyrukta" && u.durum !== "isleniyor" && (
          <span role="button" tabIndex={0} aria-label="Sürümü sil" title="Sürümü sil"
            onClick={(e) => { e.stopPropagation(); if (seciliSonuc === u.id) setSeciliSonuc(null); silUretim(u.id); mesaj.silindi("Sürüm", () => uretimGeriYukle(u)); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); silUretim(u.id); mesaj.silindi("Sürüm", () => uretimGeriYukle(u)); } }}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/85 opacity-0 backdrop-blur transition hover:bg-rose-500/80 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><Trash2 className="h-3 w-3" /></span>
        )}
        {u && u.favori && u.durum === "tamam" && <Star className="pointer-events-none absolute bottom-1.5 left-1.5 h-3.5 w-3.5 fill-aksan text-aksan transition-opacity group-hover:opacity-0" />}
        {u && u.durum === "tamam" && (
          <span onClick={(e) => e.stopPropagation()} className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            <FavoriDugmesi favori={!!u.favori} onClick={() => favoriToggle(u.id)} boyut="kucuk" side="top" className="[@media(hover:none)]:hidden" />
            <IndirDugmesi u={u} className={eylemDugmesi("kucuk")} ikonSinif="h-3.5 w-3.5" side="top" />
            <KartDahaMenusu u={u} boyut="kucuk" side="top" onSil={() => { if (seciliSonuc === u.id) setSeciliSonuc(null); silUretim(u.id); mesaj.silindi("Sürüm", () => uretimGeriYukle(u)); }}
              eylemler={[{ ad: u.favori ? "Favorilerden çıkar" : "Favorilere ekle", ikon: Star, fn: () => favoriToggle(u.id) }, { ad: "Üzerinde devam et", ikon: RefreshCw, fn: () => kaynakYap(u) }, { ad: "Yeniden kullan", ikon: Quote, fn: () => { setIstem((u.meta?.hamIstem ?? u.prompt).slice(0, 500)); istemRef.current?.focus(); } }]} />
          </span>
        )}
      </div>
    );
  };
  const seciliEylemler = secili && secili.durum === "tamam" && (
    <div className="space-y-2 border-t border-white/[0.06] p-3">
      <p className="text-[12px] font-semibold text-metin">V{surumler.indexOf(secili) + 1} · <span className="font-normal text-metin-3">{secili.prompt.slice(0, 40)}</span></p>
      <div className="grid grid-cols-2 gap-1.5">
        {([[RefreshCw, "Üzerinde devam et", () => kaynakYap(secili), secili.gercek === false],
          [Maximize2, "Büyüt", () => { const g = uretimGorseli(secili); if (g) router.push(`/panel/upscale?kaynak=${encodeURIComponent(g)}&uretim=${secili.id}`); }, secili.gercek === false],
          [Crop, "Çerçevele", () => { const g = uretimGorseli(secili); if (g) router.push(`/panel/reframe?kaynak=${encodeURIComponent(g)}&uretim=${secili.id}`); }, secili.gercek === false],
          [VideoIcon, "Videoya çevir", () => { const g = uretimGorseli(secili); if (g) { sessionStorage.setItem("vayra-animate-ref", g); router.push("/panel/video"); } }, secili.gercek === false]] as const).map(([I, a, f, k], j) => (
          <button key={a} onClick={f} disabled={k}
            className={cn("flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[12px] font-medium transition-colors disabled:opacity-35", j === 0 || j === 3 ? "col-span-2 " + (j === 0 ? "bg-white font-semibold text-black hover:bg-white/90" : "bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09] hover:text-metin") : "bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09] hover:text-metin")}>
            <I className="h-3.5 w-3.5" />{a}
          </button>
        ))}
      </div>
      <IndirDugmesi u={secili} yerlesim="ust-sag" side="top" etiket="İndir ya da önce ve sonra"
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.05] text-[12px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.09] hover:text-metin">
        <Download className="h-3.5 w-3.5" />İndir · önce ve sonra
      </IndirDugmesi>
    </div>
  );
  const surumPaneli = kaynak && (
    <AnimatePresence initial={false}>
      {surumAcik && (
        <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative shrink-0 overflow-hidden border-l border-white/[0.06] bg-[#111113]">
          <KenarTutamac en={surumEn} anahtar="duzenle-surum" varsayilan={248} etiket="Sürümler panelinin genişliği" />
          <motion.div style={{ width: surumEn }} className="flex h-full flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between px-3">
            <span className="flex items-center gap-2 text-[13.5px] font-semibold text-metin">Sürümler <span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums text-metin-2">{surumler.length + 1}</span></span>
            <span className="flex items-center gap-1"><GorunumAyari sayfa="inpaint" dugmeSinif="h-8 w-8" />
            <button onClick={() => setSurumAcik(false)} aria-label="Sürümleri gizle" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-metin-3 hover:bg-white/[0.06] hover:text-metin"><PanelRightClose className="h-4 w-4" /></button></span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
            <div className="grid gap-2" style={{ gridTemplateColumns: gorunum.boyut === "ozel" ? `repeat(${Math.min(4, gorunum.sutun)}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${gorunum.boyut === "kucuk" ? 72 : gorunum.boyut === "buyuk" ? 180 : 100}px, 1fr))` }}>
              {surumKarti(null, 0)}
              {gorunenSurumler.map((u) => surumKarti(u, surumler.indexOf(u) + 1))}
            </div>
            {!surumler.length && <div className="mt-3 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]"><p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-metin"><History className="h-3.5 w-3.5 text-metin-2" />Henüz düzenleme yok</p><p className="mt-1 text-[12px] leading-relaxed text-metin-2">Her düzenleme burada yeni bir sürüm olur; birini seçip öncesiyle karşılaştırırsın.</p></div>}
          </div>
          {seciliEylemler}
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );

  /* ═════════════ Boş durum ═════════════ */
  const kitaplikPopover = (
    <Yuzen acik={kitaplikAcik} onKapat={() => setKitaplikAcik(false)} yerlesim="alt-orta" bosluk={8} etiket="Üretimlerinden seç"
      className="max-h-[380px] w-[min(380px,calc(100vw-24px))] overflow-y-auto rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-3 [scrollbar-width:thin]">
      <p className="pb-2 text-[12.5px] font-semibold text-metin">Son görsel üretimlerin</p>
      {kitaplikListe.length ? (
        <div className="grid grid-cols-4 gap-1.5">
          {kitaplikListe.map((u) => (
            <button key={u.id} onClick={() => { const g = uretimGorseli(u); if (g) { setKaynak({ url: g, goster: g, durum: "hazir", uretimId: u.id, ad: u.baslik }); setKitaplikAcik(false); } }}
              className="aspect-square overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/10 transition-shadow hover:ring-2 hover:ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uretimGorseli(u)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[14px] bg-white/[0.04] px-4 py-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08]"><Images className="h-5 w-5 text-metin-2" /></span>
          <span className="text-[13px] font-medium text-metin">Henüz görsel üretimin yok</span>
          <span className="text-[12px] leading-snug text-metin-2">Görsel stüdyosunda ürettiklerin burada listelenir. Şimdilik bir görsel yükleyebilir ya da örnekle deneyebilirsin.</span>
          <div className="flex gap-1.5">
            <button onClick={() => { setKitaplikAcik(false); dosyaRef.current?.click(); }} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black active:scale-95"><Upload className="h-3.5 w-3.5" />Yükle</button>
            <button onClick={() => router.push("/panel/gorsel")} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-metin hover:bg-white/[0.13]"><Sparkles className="h-3.5 w-3.5" />Görsel üret</button>
          </div>
        </div>
      )}
    </Yuzen>
  );
  /** Boş durumda görsel açma kartı (tuvalin ortasında; telefonda sayfanın başında). */
  const acmaKarti = (
    <section className={cn("w-full overflow-hidden rounded-[24px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
        <Upload className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Düzenlenecek görseli aç</span>
        <span className="ml-auto rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2 max-sm:hidden">PNG, JPG, WebP · 15 MB</span>
      </div>
      <div className={cn("m-3 flex flex-col items-center gap-4 rounded-[18px] border border-dashed px-4 py-9 text-center transition-colors", surukle ? "border-white/60 bg-white/[0.06]" : "border-white/15")}>
        <motion.span animate={surukle ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08]"><Upload className="h-6 w-6" /></motion.span>
        <span className="text-[15px] font-medium text-metin">{surukle ? "Bırak, düzenlemeye başla" : "Görseli buraya bırak"}</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => dosyaRef.current?.click()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95"><Upload className="h-4 w-4" />Görsel yükle</button>
          <div className="relative">
            <button onClick={() => setKitaplikAcik((v) => !v)} aria-expanded={kitaplikAcik} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Images className="h-4 w-4" />Üretimlerimden</button>
            {kitaplikPopover}
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-metin-2"><ClipboardPaste className="h-3.5 w-3.5" />Panodan yapıştırmak için <kbd>Ctrl</kbd><kbd>V</kbd></span>
      </div>
      <div className="flex items-center gap-2 border-t border-white/[0.07] px-4 py-2.5">
        {(() => { const m = MODLAR.find((x) => x.id === mod)!; return (<><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-black"><m.ikon className="h-3.5 w-3.5" /></span><span className="min-w-0 text-[12.5px] leading-snug text-metin-2"><span className="font-semibold text-metin">{m.ad}</span> · {m.aciklama}</span></>); })()}
      </div>
    </section>
  );
  /** Örnek görselle hemen dene: görsel + mod + hazır istem. */
  const ornekKarti = (o: (typeof ORNEKLER)[number], i: number) => {
    const m = MODLAR.find((x) => x.id === o.mod)!;
    return (
      <motion.button key={o.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} onClick={() => ornekAc(o)} className="group min-w-0 text-left">
        <span className="relative block aspect-[4/5] overflow-hidden rounded-[14px] outline outline-1 -outline-offset-1 outline-white/[0.08] transition group-hover:outline-white/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-2 text-[11px] font-semibold text-white backdrop-blur"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><m.ikon className="h-3 w-3" /></span>{m.ad}</span>
        </span>
        <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin-2 group-hover:text-metin">{o.ad}</span>
      </motion.button>
    );
  };
  const ornekBolumu = (sutun: string) => (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Örnekle dene</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-metin-2">Tek tıkla aç</span></div>
      <div className={cn("grid gap-2 p-2.5", sutun)}>{ORNEKLER.map(ornekKarti)}</div>
    </section>
  );
  const sonBolumu = sonKaynaklar.length > 0 && (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><History className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Kaldığın yerden</span><span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-metin-2">{sonKaynaklar.length}</span></div>
      <div className="space-y-0.5 p-1.5">
        {sonKaynaklar.map((k) => (
          <button key={k.url} onClick={() => { setKaynak({ url: k.url, goster: k.url, durum: "hazir" }); setSeciliSonuc(null); }}
            className="group flex w-full items-center gap-3 rounded-[14px] p-1.5 pr-2.5 text-left transition-colors hover:bg-white/[0.06]">
            <span className="relative h-12 w-12 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.url} alt="" loading="lazy" className="h-12 w-12 rounded-[10px] object-cover" />
              {k.kapak && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={k.kapak} alt="" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-[6px] object-cover ring-2 ring-[#222328]" />)}
            </span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{k.adet} düzenleme</span><span className="block text-[11.5px] text-metin-2">{goreli(k.son)}</span></span>
            <span className="flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-metin-2 transition group-hover:bg-white group-hover:text-black">Aç<ArrowRightSm /></span>
          </button>
        ))}
      </div>
    </section>
  );
  const birakmaOlaylari = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setSurukle(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurukle(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(false); const d = e.dataTransfer.files[0]; if (d) void kaynakSec(d); },
  };
  /** Telefon: açma kartı + örnekler + kaldığın yer, alt alta. */
  const bos = (
    <div {...birakmaOlaylari} className="space-y-3 px-3 pb-8 pt-1">
      {acmaKarti}
      {sonBolumu}
      {ornekBolumu("grid-cols-2")}
    </div>
  );
  /** Masaüstü: düzenleyici hemen açık gelir; tuvalin ortasında açma kartı, sağda örnekler. */
  const bosMasaustu = (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Görsel stüdyosuna dön" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex min-w-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Wand2 className="h-4 w-4" /></span>
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Görsel düzenle</span>
            <span className="block whitespace-nowrap text-[11.5px] text-metin-2">Seçmediğin her piksel aynı kalır</span>
          </span>
        </div>
        <div className="flex flex-1 justify-center">{modSekmeleri}</div>
        <span className="w-[140px]" />
      </header>
      <div className="flex min-h-0 flex-1">
        <div {...birakmaOlaylari} className="relative min-w-0 flex-1 bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]">
          <div aria-hidden className={cn("absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-0.5 rounded-[16px] p-1.5 opacity-40", YUZEY)}>
            {ARACLAR.map(([id, , I]) => <span key={id} className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white/70"><I className="h-[18px] w-[18px]" strokeWidth={1.9} /></span>)}
          </div>
          <div className="absolute inset-x-0 top-[44%] flex -translate-y-1/2 justify-center px-6">
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-[540px]">{acmaKarti}</motion.div>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className={cn("w-full max-w-[760px] rounded-[22px] p-1.5 opacity-55", YUZEY)}>
              <p className="px-2.5 py-2 text-[14.5px] text-metin-2">Önce bir görsel aç, sonra {mod === "sil" ? "silinecek nesneyi boya" : maskeli ? "değişecek alanı boya" : "ne olacağını yaz"}</p>
              <div className="mt-1 flex items-center border-t border-white/[0.06] px-1 pt-1.5"><span className="flex-1" /><span className="flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-[14px] font-semibold text-black"><ArrowUp className="h-4 w-4" strokeWidth={2.6} />{ctaEtiket}</span></div>
            </div>
          </div>
        </div>
        <motion.div style={{ width: yanEn }} className="relative shrink-0 border-l border-white/[0.06] bg-[#111113]">
          <KenarTutamac en={yanEn} anahtar="duzenle-yan" varsayilan={300} min={240} etiket="Yan panelin genişliği" />
          <aside className="h-full space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
          {sonBolumu}
          {ornekBolumu("grid-cols-2")}
          </aside>
        </motion.div>
      </div>
    </>
  );

  /* ═════════════ Düzenleyici ═════════════ */
  const tuvalAlani = kaynak && (
    <div className="relative min-h-0 min-w-0 flex-1"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setEditorSurukle(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setEditorSurukle(false); }}
      onDrop={(e) => { e.preventDefault(); setEditorSurukle(false); const d = e.dataTransfer.files[0]; if (d) void kaynakSec(d); }}>
      {editorSurukle && (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-[22px] border-2 border-dashed border-white/60 bg-black/60 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-[16px] font-semibold text-white"><Upload className="h-5 w-5" />Yeni görsel olarak aç</span>
        </div>
      )}
      <MaskeTuvali ref={tuval} src={genisSonuc ? seciliGorsel! : kaynak.goster} arac={maskeli ? arac : "el"} boyut={boyut} kapali={!maskeli || !!seciliGorsel} sonuc={genisSonuc ? null : seciliGorsel} karsilastir={karsi}
        pay={{ ust: 68, alt: komutH + 30, sol: maskeli && !seciliGorsel ? 80 : 24, sag: 24 }} maskeGizli={maskeGizli} isleniyor={surer.length > 0} boyutOnizle={boyutTik}
        onKarsilastir={setKarsi} onDurum={setDurum} akilliMesgul={akilliMesgul} onAkilliTik={(x, y, cikar) => void akilliSec({ x, y, cikar })} />
      {/* Üst orta: bağlam çubuğu ya da durum */}
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
        <div className="pointer-events-auto">
          {seciliGorsel ? (
            <div className={cn("flex h-11 items-center gap-2 rounded-full pl-4 pr-1.5", YUZEY)}>
              <span className="text-[12.5px] text-white/80">{genisSonuc ? "Genişletilmiş görsel · yeni oranında" : "Çizgiyi sürükle · öncesiyle karşılaştır"}</span>
              {!genisSonuc && <button onPointerDown={() => setKarsi(100)} onPointerUp={() => setKarsi(50)} onPointerLeave={() => setKarsi((k) => (k === 100 ? 50 : k))}
                className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-white hover:bg-white/[0.14]"><Eye className="h-3.5 w-3.5" />Basılı tut: önce</button>}
              <button onClick={() => setSeciliSonuc(null)} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black active:scale-95">{maskeli ? <><Brush className="h-3.5 w-3.5" />Seçime dön</> : <><RefreshCw className="h-3.5 w-3.5" />Orijinale dön</>}</button>
            </div>
          ) : !maskeli ? (
            <div className={cn("flex h-11 items-center gap-2 rounded-full px-4", YUZEY)}>
              {(() => { const I = MODLAR.find((m) => m.id === mod)!.ikon; return <I className="h-4 w-4 text-white" />; })()}
              <span className="text-[12.5px] text-white/80">{genislet ? `Görsel ${hedefOran} orana büyütülür; yeni kenarlar doldurulur` : "Bu modda seçim gerekmez; tüm görsel işlenir"}</span>
            </div>
          ) : masaustu ? baglamCubugu : null}
        </div>
      </div>
      {masaustu && <div className="absolute left-3 top-1/2 -translate-y-1/2">{aracRayi}</div>}
      {/* İlk ipucu: henüz seçim yokken ortada, çizmeye başlayınca kaybolur */}
      <AnimatePresence>
        {maskeli && !seciliGorsel && !durum.alan && kaynak.durum === "hazir" && durum.w > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: `calc(68px + (100% - 68px - ${komutH + 30}px) / 2 - 22px)` }}>
            <span className="flex items-center gap-2 rounded-full bg-black/70 py-2 pl-2 pr-4 text-[13px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
              <span className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-white text-black">{arac === "akilli" ? <MousePointerClick className="h-4 w-4" /> : arac === "kutu" ? <Square className="h-4 w-4" /> : arac === "kement" ? <Lasso className="h-4 w-4" /> : <Brush className="h-4 w-4" />}</span>
              {arac === "akilli" ? "Seçmek istediğin nesneye tıkla" : arac === "kutu" ? "Sürükleyerek alanı çerçevele" : arac === "kement" ? "Alanın çevresini çiz" : mod === "sil" ? "Silinecek nesnenin üzerini boya" : "Değişecek alanı boya"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {surer.length > 0 && (
        <div className="absolute right-3 top-[60px] flex items-center gap-2 rounded-full bg-black/70 py-1.5 pl-3 pr-1.5 text-[12px] text-white ring-1 ring-white/10 backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />{surer.length > 1 ? `${surer.length} varyasyon hazırlanıyor` : "Düzenleniyor"}
          <button onClick={() => surer.forEach((u) => uretimIptal(u.id))} className="flex h-6 items-center rounded-full bg-white/10 px-2 text-[11px] hover:bg-rose-500/70">İptal</button>
        </div>
      )}
      {masaustu && <div className="absolute right-3 top-3">{zoomCubugu}</div>}
      {/* Komut kutusu */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div ref={komutRef} className="pointer-events-auto w-full max-w-[760px]">{komutKutusu}</div>
      </div>
    </div>
  );

  const ustCubuk = kaynak && (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
      <button onClick={() => { setKaynak(null); setSeciliSonuc(null); }} aria-label="Görseli kapat" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><ChevronLeft className="h-5 w-5" /></button>
      <div className="flex min-w-0 items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kaynak.goster} alt="" className="h-9 w-9 shrink-0 rounded-[9px] object-cover ring-1 ring-white/10" />
        <div className="min-w-0">
          <p className="max-w-[220px] truncate text-[13.5px] font-semibold text-metin">{kaynak.ad ?? "Kaynak görsel"}</p>
          <p className="text-[11.5px] tabular-nums text-metin-3">{kaynak.durum === "yukleniyor" ? "Yükleniyor…" : durum.w ? `${durum.w} × ${durum.h}` : "—"}</p>
        </div>
        <button onClick={() => dosyaRef.current?.click()} className="ml-1 hidden h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin lg:flex"><Upload className="h-3.5 w-3.5" />Değiştir</button>
      </div>
      <div className="flex flex-1 justify-center">{modSekmeleri}</div>
      <div className="flex items-center gap-1">
        {!surumAcik && (
          <button onClick={() => setSurumAcik(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-metin">
            <PanelRightOpen className="h-4 w-4" />Sürümler{surumler.length > 0 && <span className="rounded-full bg-white/[0.1] px-1.5 text-[11px] font-semibold tabular-nums text-metin">{surumler.length}</span>}
          </button>
        )}
      </div>
    </header>
  );

  /* ═════════════ Mobil ═════════════ */
  const mobil = (
    <div data-kendi-kisayol className="flex min-h-[100dvh] flex-col bg-zemin">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-zemin/95 px-2 backdrop-blur-md">
        <button onClick={() => (kaynak ? (setKaynak(null), setSeciliSonuc(null)) : router.push("/panel/gorsel"))} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-metin">Görsel düzenle</h1>
        {kaynak && <button onClick={() => dosyaRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin"><Upload className="h-4 w-4" />Değiştir</button>}
      </header>
      {!kaynak ? <div className="flex-1">{bos}</div> : (
        <>
          <div className="overflow-x-auto px-3 pb-2 [mask-image:linear-gradient(90deg,#000_88%,transparent)] [scrollbar-width:none]">{modSekmeleri}</div>
          <div className="relative mx-3 h-[50vh] overflow-hidden rounded-[18px] ring-1 ring-white/[0.07]">
            <MaskeTuvali ref={tuval} src={genisSonuc ? seciliGorsel! : kaynak.goster} arac={maskeli ? arac : "el"} boyut={boyut} kapali={!maskeli || !!seciliGorsel} sonuc={genisSonuc ? null : seciliGorsel} karsilastir={karsi}
              onKarsilastir={setKarsi} onDurum={setDurum} akilliMesgul={akilliMesgul} onAkilliTik={(x, y, cikar) => void akilliSec({ x, y, cikar })} />
            {surer.length > 0 && <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11.5px] text-white"><Loader2 className="h-3 w-3 animate-spin" />Düzenleniyor</span>}
            {seciliGorsel && <button onClick={() => setSeciliSonuc(null)} className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-black">{maskeli ? "Seçime dön" : "Orijinale dön"}</button>}
          </div>
          {maskeli && !seciliGorsel && (
            <div className="mx-3 mt-2 space-y-2">
              <div className="flex gap-0.5 overflow-x-auto rounded-[14px] bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:none]">
                {ARACLAR.filter(([id]) => id !== "el").map(([id, a, I]) => (
                  <button key={id} onClick={() => setArac(id)} aria-pressed={arac === id} className={cn("flex h-11 min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] text-[10.5px] transition active:scale-95", arac === id ? "bg-white text-black" : "text-metin-2")}>
                    <I className="h-4 w-4" />{a.split(" ")[0]}
                  </button>
                ))}
                <button onClick={() => tuval.current?.geriAl()} disabled={!durum.geri} aria-label="Geri al" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-metin-2 disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
                <button onClick={() => tuval.current?.temizle()} disabled={!durum.alan} aria-label="Temizle" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-metin-2 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </div>
              {(arac === "firca" || arac === "silgi") && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[12px] text-metin-2">Boyut</span>
                  <input type="range" min={4} max={firçaMaks} value={boyut} onChange={(e) => setBoyut(Number(e.target.value))} aria-label="Fırça boyutu" className="vy-aralik-beyaz flex-1 appearance-none rounded-full" style={{ ["--d" as string]: `${((boyut - 4) / (firçaMaks - 4)) * 100}%` }} />
                  <span className="w-14 text-right text-[12px] tabular-nums text-metin-3">Yüzde {Math.round(durum.alan * 100)} seçili</span>
                </div>
              )}
              {arac === "akilli" && (
                <div className="flex flex-wrap items-center gap-1.5 px-1">
                  <span className="text-[12px] text-metin-2">{akilliMesgul ? "Seçiliyor…" : "Nesneye dokun ya da:"}</span>
                  <button onClick={() => void akilliSec(undefined, "main subject")} disabled={akilliMesgul} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-metin disabled:opacity-40"><UserRound className="h-3.5 w-3.5" />Özne</button>
                  <button onClick={() => void akilliSec(undefined, "background")} disabled={akilliMesgul} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] font-medium text-metin disabled:opacity-40"><Mountain className="h-3.5 w-3.5" />Arka plan</button>
                  <span className="ml-auto text-[12px] tabular-nums text-metin-3">Yüzde {Math.round(durum.alan * 100)} seçili</span>
                </div>
              )}
              {(arac === "kutu" || arac === "kement") && (
                <p className="px-1 text-[12px] text-metin-2">{arac === "kutu" ? "Parmağınla sürükleyerek alanı çerçevele" : "Alanın çevresini çiz, bırakınca dolar"} · <span className="tabular-nums">Yüzde {Math.round(durum.alan * 100)} seçili</span></p>
              )}
            </div>
          )}
          {surumler.length > 0 && (
            <div className="mx-3 mt-3 grid grid-cols-5 gap-1.5">{surumKarti(null, 0)}{surumler.slice(-4).map((u) => surumKarti(u, surumler.indexOf(u) + 1))}</div>
          )}
          {secili && secili.durum === "tamam" && <div className="mx-3 mt-2 overflow-hidden rounded-[14px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.06]">{seciliEylemler}</div>}
          <div className="flex-1" />
          <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komutKutusu}</div>
        </>
      )}
    </div>
  );

  return (
    <>
      <input ref={dosyaRef} type="file" accept={GORSEL_TURLERI.join(",")} hidden onChange={(e) => { const d = e.target.files?.[0]; if (d) void kaynakSec(d); e.target.value = ""; }} />
      {!masaustu ? mobil : (
        <div data-kendi-kisayol className="flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0d0e10]">
          {kaynak ? (
            <>
              {ustCubuk}
              <div className="flex min-h-0 flex-1">
                {tuvalAlani}
                {surumPaneli}
              </div>
            </>
          ) : bosMasaustu}
        </div>
      )}
    </>
  );
}

function ArrowRightSm() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
function goreli(t: number) {
  const dk = Math.round((Date.now() - t) / 60000);
  if (dk < 1) return "az önce"; if (dk < 60) return `${dk} dk önce`;
  const sa = Math.round(dk / 60); if (sa < 24) return `${sa} sa önce`;
  const g = Math.round(sa / 24); return g === 1 ? "dün" : `${g} gün önce`;
}

/** Sağlayıcı ayrıntısı (fal / openai ayrı ayrı). */
function useSaglayiciDurum() {
  const [d, setD] = useState<Record<string, boolean>>({});
  useEffect(() => { fetch("/api/saglayici-durum").then((r) => r.json()).then((j: { saglayicilar?: Record<string, boolean> }) => setD(j.saglayicilar ?? {})).catch(() => {}); }, []);
  return { fal: !!d.fal, openai: !!d.openai, gemini: !!d.gemini };
}
