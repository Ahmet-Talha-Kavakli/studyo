"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useMasaustu } from "@/hooks/useMasaustu";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { IzgaraSec } from "@/components/studyo/Cip";
import {
  Play, Scissors, Wand2, Lightbulb, Upload, Images, Loader2, Sparkles, Check, X, Captions, Type as TypeIcon, Crop, Music2, Clock, Smartphone,
  Download, Combine, Film, Plus, Trash2, Copy, AlertTriangle, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Palette, Layers, VolumeX, Pause,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { medyaSuresi, videoKapak, kareAl, disaAktar } from "@/lib/montajMotor";
import { besteWavUrl } from "@/lib/muzikMotoru";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useMontaj, type MontajProje } from "@/store/useMontaj";
import { varsayilanAyar, exId, type ExProje, type ExSahne } from "@/store/useExplainer";
import { EX_STILLER, explainerMontaj, sahneAnlari, sahneSure, toplamSure, stilPoster, stilVideo, stilBul, ozelStil, stilTaban } from "@/lib/explainerMotor";
import { OzelGirdi } from "@/components/film/ortak";
import { Tooltip } from "@/components/ui/Tooltip";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { istemTemizlensinMi, kartOrani, sutunSayisi, zamanaGoreSirala } from "@/lib/galeri/gorunum";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi, KartDahaMenusu, YenidenKullanDugmesi, eylemDugmesi } from "@/components/galeri/KartEylemleri";
import { ArrowUpRight } from "lucide-react";
import { uretimGeriAl } from "@/components/panel/uretimGeriAl";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { Dalga } from "@/components/speak/SesSecici";
import { UretimSecici as UretimPaneli } from "@/components/studyo/video/UretimSecici";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { ExOynatici, type OynaticiTutamak } from "@/components/explainer/ExOynatici";
import { MontajDisaAktar } from "@/components/montaj/MontajDisaAktar";
import { dosyaYukle } from "@/components/montaj/ortak";
import { fontlariYukle } from "@/components/montaj/fontlar";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import { AltBaslik, Kaydirici, Segment, AnahtarSatir, Renkler } from "@/components/montaj/ui";
import { Bolum } from "@/components/explainer/ExParca";
import {
  adaylariBul, esitBol, metindenSatirlar, kelimelerdenSatirlar, klipShortu, sureYaz, hareketOlc, anGerekce,
  type AltyaziStil, type Yerlesim, type Odak, type ShortsOran, type Satir,
} from "./shortsMotor";
import { konuAnlamli, shortSenaryo, sahneGorselUret } from "./konuSenaryo";
import { KonuVitrin } from "./KonuVitrin";
import { StilVitrin } from "./StilVitrin";
import { KrediJeton } from "@/components/ui/KrediHap";
import { KREDI } from "@/components/explainer/exUretim";
import { Cip, SecSatir, AltyaziIzgara, AltyaziOrnek, KadrajOrnek, AnKart, KADRAJLAR, FORMATLAR, ORAN_KUTU, ALTYAZI_STILLERI, type AnKartVeri } from "./ShortsParcalar";

const ORNEK_PUAN = Array.from({ length: 64 }, (_, i) => Math.round(18 + 30 * Math.abs(Math.sin(i * 0.37)) + 22 * Math.abs(Math.sin(i * 0.11 + 1)) * (i % 7 === 3 ? 1.2 : 0.8)));
const ORNEK_ZIRVE = 41;
ORNEK_PUAN[ORNEK_ZIRVE] = 100;

const ARAC_ADI = "Shorts Stüdyosu";
type Mod = "klip" | "konu" | "stil";
type Gorunum = "giris" | "sonuc" | "duzen";
type Muzik = "yok" | "enerjik" | "sakin" | "duygusal";

const MODLAR: { id: Mod; ad: string; ikon: typeof Scissors; b1: string; b2: string; alt: string }[] = [
  { id: "klip", ad: "Videodan klip", ikon: Scissors, b1: "Uzun videon,", b2: "hazır shortlar.", alt: "Podcast, vlog ya da röportajını ekle; en güçlü anlar bulunsun, dikeye kadrajlansın, altyazısı eklensin." },
  { id: "konu", ad: "Konudan short", ikon: Lightbulb, b1: "Bir konu yaz,", b2: "short hazır olsun.", alt: "Yüzsüz anlatımlı bir short: sahneler, ekran yazıları ve altyazı birkaç saniyede kurulur." },
  { id: "stil", ad: "Stil uygula", ikon: Wand2, b1: "Klibine yeni", b2: "bir görsel dil.", alt: "Kısa klibini 34 stil presetinden biriyle baştan üret; konuşma ve tempo korunur." },
];

/** Higgsfield Shorts Studio presetleri (gerçek örnek kareleri: public/gercek/shorts). */
const PRESETLER: { ad: string; tohum: string; en: string }[] = [
  ["Cesur kent", "sp-boldurban", "bold urban street style, punchy contrast"], ["Yeşil kontrast", "sp-greencontrast", "high contrast green duotone"], ["Kentsel huzur", "sp-urbanserenity", "calm urban cinematic, soft light"],
  ["Sıcak ışıltı", "sp-warmglow", "warm golden glow"], ["Sarı çerçeve", "sp-yellowframe", "bold yellow frame graphics"], ["Monokrom", "sp-monochrome", "black and white editorial"],
  ["Kil animasyon", "sp-claymation", "claymation stop-motion"], ["Marker karalama", "sp-markerscribble", "hand-drawn marker scribbles overlay"], ["Etiket tipo", "sp-stickertype", "sticker typography"],
  ["Asit yeşili", "sp-acidgreen", "acid green graphic design"], ["Balon tipo", "sp-balloontype", "inflated balloon typography"], ["Mavi kopya", "sp-blueprint", "blueprint technical lines"],
  ["Cesur altyazı", "sp-boldcaption", "bold oversized captions"], ["Sınırlayıcı kutu", "sp-boundingbox", "tech bounding box tracking overlay"], ["Devre", "sp-circuit", "circuit board neon lines"],
  ["Çizgi patlaması", "sp-comicburst", "comic burst panels"], ["Comic pop", "sp-comicpop", "pop art comic halftone"], ["Pembe yıkama", "sp-pinkwash", "pink color wash"],
  ["Altın yıldız", "sp-goldstars", "gold stars sparkle"], ["Sıvı krom", "sp-liquidchrome", "liquid chrome 3D"], ["Maskot", "sp-mascot", "cute mascot character"],
  ["Neon pop", "sp-neonpop", "neon pop colors"], ["Neon tipo", "sp-neontype", "neon sign typography"], ["Desenli", "sp-patterned", "patterned background"],
  ["Pembe pop", "sp-pinkpop", "pink pop art"], ["Pembe karalama", "sp-pinkscribble", "pink doodle scribbles"], ["Puan pop", "sp-polkapop", "polka dot pop"],
  ["Retro kolaj", "sp-retrocollage", "retro paper collage"], ["İstif tipo", "sp-stackedtype", "stacked kinetic typography"], ["Yıldız comic", "sp-starcomic", "star comic"],
  ["Sokak sanatı", "sp-streetart", "street art graffiti"], ["Vintage kağıt", "sp-vintagepaper", "vintage paper texture"], ["Sarı patlama", "sp-yellowburst", "yellow burst"],
  ["Sarı kapı", "sp-yellowdoor", "yellow door surreal"],
].map(([ad, tohum, en]) => ({ ad, tohum, en }));
const presetKapak = (t: string) => `/gercek/shorts/${t === "ozel" ? "sp-boldurban" : t}.webp`;
const SAHNE_TUR: Record<string, string> = { baslik: "Başlık", anlatim: "Anlatım", liste: "Liste", istatistik: "Rakam", alinti: "Alıntı", cta: "Kapanış" };

const VURGULAR = ["#facc15", "#55d6fd", "#a3e635", "#f472b6", "#fb923c", "#ffffff"];
const KANCALAR = ["Bunu kimse söylemiyor", "Sonuna kadar izle", "3 saniyede öğren", "Bu bir oyun değiştirici", "Herkes bunu yanlış yapıyor", "Bunu bilmen gerek", "İşte asıl sır", "Bunu denemelisin"];
const SURELER = [15, 30, 45, 60];
const MUZIKLER: [Muzik, string, string][] = [["yok", "Müziksiz", "Yalnız orijinal ses"], ["enerjik", "Enerjik", "Hızlı, coşkulu"], ["sakin", "Sakin", "Lo-fi ambiyans"], ["duygusal", "Duygusal", "Yavaş, minör"]];
const MUZIK_RENK: Record<Muzik, string> = { yok: "#71717a", enerjik: "#f59e0b", sakin: "#34d399", duygusal: "#f472b6" };
const MUZIK_BPM: Record<Muzik, number> = { yok: 0, enerjik: 124, sakin: 84, duygusal: 76 };
const KONU_ORNEK: [string, string][] = [["Sabah rutini verimliliği nasıl artırır?", "ex-2dillustrator"], ["Yapay zekâ işimizi elimizden alacak mı?", "ex-isometric"], ["Kahvenin bilinmeyen 3 faydası", "ex-papercraft"], ["Para biriktirmenin en kolay yolu", "ex-claymotion"]];
/** Demo kaynak: birbirine eklenmiş örnek klipler (her biri bir an olarak gösterilir). */
const DEMO: [string, string][] = [["preset-video/moonwalk", "Ay yürüyüşü"], ["preset-video/float-spin", "Süzülüş"], ["preset-video/selfie-twin", "Selfie ikiz"], ["preset-video/sticker-peel", "Çıkartma"], ["preset-video/orbit-360", "360 tur"], ["preset-video/fairytale-castle", "Masal şatosu"]];
/** Hero: uzun video şeridindeki üç güçlü an (yüzde konumları) ve onlardan çıkan dikey shortlar. alt = kart altının yüzde yüksekliği. */
const VITRIN_AN = [
  { d: "preset-video/selfie-twin", a: 6, b: 20, x: 15, alt: 56, puan: 88, kanca: "Bunu bilmen gerek", orta: false },
  { d: "preset-video/moonwalk", a: 41, b: 57, x: 50, alt: 66, puan: 94, kanca: "Bunu kimse söylemiyor", orta: true },
  { d: "preset-video/orbit-360", a: 78, b: 92, x: 85, alt: 56, puan: 79, kanca: "Sonuna kadar izle", orta: false },
];
const VITRIN_SERIT = ["preset-video/fairytale-castle", "preset-video/elevate", "preset-video/float-spin", "preset-video/earth-zoom", "preset-video/sticker-peel", "preset-video/action-figure", "preset-video/cardboard-cutout", "preset-video/elevate", "preset-video/fairytale-castle", "preset-video/float-spin"];

type Parca = { url: string; ad: string; sure: number; poster?: string };
type Kaynak = Parca & { parcalar?: Parca[] };
type An = AnKartVeri & { kaynakSure: number; sira: number; enerji: number; konusma: number; hareket?: number };

export function ShortsStudyo() {
  const router = useRouter();
  const sag = useSaglayicilar();
  const elevenBagli = sag?.eleven === true;
  const uretimler = useProjeler((s) => s.uretimler);
  /* Görünüm ayarı (yerleşim, boyut, sıralama, istemi temizle) sayfa başına kalıcı. */
  const [galeriGorunum] = useGorunum("shorts");
  const [shortIzgaraRef, shortIzgaraEn] = useAlanGenisligi<HTMLDivElement>(1100);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const shortlar = useMemo(() => zamanaGoreSirala(uretimler.filter((u) => u.arac === ARAC_ADI), galeriGorunum.siralama), [uretimler, galeriGorunum.siralama]);
  const [mod, setMod] = useState<Mod>("klip");
  const [gorunum, setGorunum] = useState<Gorunum>("giris");
  const [cip, setCip] = useState<string | null>(null);
  const [ustSekme, setUstSekme] = useState<"olustur" | "shortlarim">("olustur");
  const masaustu = useMasaustu();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const oynatici = useRef<OynaticiTutamak>(null);
  const shortlarRef = useRef<HTMLDivElement>(null);

  /* ── Kaynak ── */
  const [kaynak, setKaynak] = useState<Kaynak | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [secici, setSecici] = useState(false);
  const [surukle, setSurukle] = useState(false);

  /* ── Anlar ── */
  const [uzunluk, setUzunluk] = useState(30);
  const [anlar, setAnlar] = useState<An[] | null>(null);
  const [analiz, setAnaliz] = useState<string | null>(null);
  const [sesVar, setSesVar] = useState(true);
  const [sirala, setSirala] = useState<"puan" | "sira">("puan");
  const [secId, setSecId] = useState<string | null>(null);
  const [kancalar, setKancalar] = useState<Record<string, string>>({});

  /* ── Short ayarları ── */
  const [sekme, setSekme] = useState<"kanca" | "altyazi" | "kadraj" | "muzik" | "sahne" | "stil">("kanca");
  const [oran, setOran] = useState<ShortsOran>("9:16");
  const [yerlesim, setYerlesim] = useState<Yerlesim>("bulanik");
  const [odak, setOdak] = useState<Odak>("orta");
  const [zoom, setZoom] = useState(100);
  const [altyazi, setAltyazi] = useState<AltyaziStil>("karaoke");
  const [vurgu, setVurgu] = useState("#facc15");
  const [altyaziMetni, setAltyaziMetni] = useState("");
  const [kelimeler, setKelimeler] = useState<{ k: string; b: number; s: number }[] | null>(null);
  const [yaziyaDok, setYaziyaDok] = useState(false);
  const [ilerleme, setIlerleme] = useState(true);
  const [muzik, setMuzik] = useState<Muzik>("yok");
  const [muzikUrl, setMuzikUrl] = useState<string | undefined>();
  const [disa, setDisa] = useState(false);

  /* ── Stil uygula ── */
  const [preset, setPreset] = useState(PRESETLER[0].tohum);
  const [ozelPreset, setOzelPreset] = useState("");
  const [ozelKonuStil, setOzelKonuStil] = useState("");
  const [stilOran, setStilOran] = useState<"9:16" | "16:9">("9:16");
  const [acik, setAcik] = useState<Uretim | null>(null);

  /* ── Konudan short ── */
  const [konu, setKonu] = useState("");
  const [konuSn, setKonuSn] = useState(30);
  const [konuStil, setKonuStil] = useState("ex-2dillustrator");
  const [sahneler, setSahneler] = useState<ExSahne[] | null>(null);
  const [aktifSahne, setAktifSahne] = useState(0);
  const [senaryoKaynak, setSenaryoKaynak] = useState<"ai" | "taslak" | null>(null);
  const [yaziliyor, setYaziliyor] = useState(false);
  const gorselRef = useRef<HTMLInputElement>(null);
  const [sahneKareleri, setSahneKareleri] = useState<string[]>([]);

  const sirali = useMemo(() => (anlar ? [...anlar].sort((a, b) => (sirala === "puan" ? b.puan - a.puan : a.sira - b.sira)) : []), [anlar, sirala]);
  const an = anlar?.find((x) => x.id === secId) ?? null;
  const anSira = an ? sirali.findIndex((x) => x.id === an.id) : -1;
  const klipSure = an ? an.son - an.bas : 0;
  const tekKaynak = !!kaynak && !kaynak.parcalar;

  /* Kaynak yükleme */
  const kaynakKoy = async (url: string, ad: string, poster?: string) => {
    const sure = await medyaSuresi(url, "video");
    if (!sure) return void toast.error("Video okunamadı", { description: "Dosya bozuk olabilir ya da biçimi desteklenmiyor. MP4 ile yeniden dene." });
    const kapak = poster ?? (await videoKapak(url)) ?? undefined;
    setKaynak({ url, ad, sure, poster: kapak });
    setAnlar(null); setKelimeler(null); setSecId(null); setKancalar({});
  };
  const ornekKur = async () => {
    setYukleniyor(true);
    try {
      const parcalar: Parca[] = [];
      for (const [d, ad] of DEMO) { const url = `/gercek/${d}.mp4`; parcalar.push({ url, ad, sure: (await medyaSuresi(url, "video")) ?? 8, poster: `/gercek/${d}.webp` }); }
      const k: Kaynak = { url: parcalar[0].url, ad: "Örnek klipler", sure: parcalar.reduce((a, p) => a + p.sure, 0), poster: parcalar[0].poster, parcalar };
      setKaynak(k); setAnlar(null); setKelimeler(null); setSecId(null); setKancalar({});
      if (mod === "klip") void analizEt(k);
    } finally { setYukleniyor(false); }
  };
  const dosyaKoy = async (d: File) => {
    if (!d.type.startsWith("video/")) return void mesaj.desteklenmeyenDosya("MP4, MOV ya da WebM");
    if (d.size > 300 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(300);
    setYukleniyor(true);
    try { const url = await dosyaYukle(d, d.type); await kaynakKoy(url, d.name.replace(/\.[^.]+$/, "")); toast.success("Video eklendi"); }
    catch { mesaj.yuklenemedi("Video"); } finally { setYukleniyor(false); }
  };

  /* Anları bul: ses enerjisi + konuşma yoğunluğu + görüntü hareketi (gerçek ölçüler) */
  const analizEt = async (k: Kaynak) => {
    setGorunum("sonuc"); setAnlar(null); setSecId(null);
    try {
      let liste: (An & { ham: number })[] = [];
      if (k.parcalar) {
        setAnaliz("Görüntü hareketi ölçülüyor"); setSesVar(false);
        let t = 0;
        for (const [i, p] of k.parcalar.entries()) {
          const [h] = await hareketOlc(p.url, [[0, p.sure]]);
          liste.push({ id: `an${i}`, url: p.url, kaynakSure: p.sure, bas: 0, son: p.sure, sira: i, puan: 0, ham: h, enerji: 0, konusma: 0, hareket: h, kare: p.poster, ad: p.ad, kanca: KANCALAR[i % KANCALAR.length], neden: "", ofset: t });
          t += p.sure;
        }
      } else {
        setAnaliz("Ses çözümleniyor");
        const r = await adaylariBul(k.url, uzunluk, 8);
        const l = r ? r.adaylar : esitBol(k.sure, uzunluk, 8);
        setSesVar(!!r);
        setAnaliz("Görüntü hareketi ölçülüyor");
        const h = await hareketOlc(k.url, l.map((a) => [a.bas, a.son] as [number, number]), 4);
        liste = l.map((a, i) => ({ id: `an${i}`, url: k.url, kaynakSure: k.sure, bas: a.bas, son: a.son, sira: i, puan: 0, ham: r ? 0.8 * (a.puan / 100) + 0.2 * h[i] : h[i], enerji: a.enerji, konusma: a.konusma, hareket: h[i], ad: `${k.ad} · ${i + 1}`, kanca: KANCALAR[i % KANCALAR.length], neden: "" }));
      }
      const enIyi = Math.max(...liste.map((x) => x.ham), 0);
      const son: An[] = liste.map(({ ham, ...x }) => ({ ...x, puan: enIyi > 0.001 ? Math.max(1, Math.round((ham / enIyi) * 99)) : -1, neden: anGerekce(x, !k.parcalar && x.enerji + x.konusma > 0) }));
      setAnlar(son);
      if (!k.parcalar) {
        setAnaliz("Kareler hazırlanıyor");
        for (const a of son) {
          try { const kare = await kareYakala(a.url, a.bas + Math.min(1.2, (a.son - a.bas) / 3)); setAnlar((l) => l?.map((x) => (x.id === a.id ? { ...x, kare } : x)) ?? l); } catch { /* kapak yoksa iskelet kalır */ }
        }
      }
    } catch (e) {
      toast.error("Anlar bulunamadı", { description: e instanceof Error ? e.message : "Video analiz edilemedi. Biraz sonra yeniden dene." });
      setGorunum("giris");
    } finally { setAnaliz(null); }
  };

  const anAc = (id: string) => { setSecId(id); setSekme("kanca"); setGorunum("duzen"); window.scrollTo({ top: 0 }); };
  const kancaSu = an ? kancalar[an.id] ?? an.kanca : "";

  /* Otomatik altyazı (ElevenLabs Scribe): tüm kaynak bir kez yazıya dökülür, anlar arasında yeniden kullanılır */
  const otomatikAltyazi = async () => {
    if (!kaynak || kaynak.parcalar) return;
    if (!elevenBagli) return void toast.info("Otomatik altyazı kapalı", { description: "ElevenLabs anahtarı bağlanınca açılır. Şimdilik altyazı metnini yazabilirsin; klip süresine yayılır." });
    setYaziyaDok(true);
    try {
      const blob = await (await fetch(kaynak.url)).blob();
      if (blob.size > 45 * 1024 * 1024) throw new Error("Video 45 MB'tan büyük; daha kısa bir video seç.");
      const dataUrl = await new Promise<string>((ok, red) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => red(new Error("Okunamadı")); r.readAsDataURL(blob); });
      const j = (await (await fetch("/api/uretim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tur: "ses", model: "Eleven Scribe", prompt: `Altyazı: ${kaynak.ad}`, meta: { mod: "transkript", kaynakAd: kaynak.ad }, girdi: { kaynak: dataUrl } }) })).json()) as { ok: boolean; gercek?: boolean; hata?: string; detay?: { kelimeler?: { k: string; b: number; s: number }[] } };
      if (!j.ok || !j.gercek) throw new Error(j.hata ?? "Ses sağlayıcısı bağlı değil");
      const k = j.detay?.kelimeler ?? [];
      if (!k.length) throw new Error("Videoda konuşma bulunamadı");
      setKelimeler(k);
      toast.success("Altyazı hazır", { description: `${k.length} sözcük, gerçek zamanlamayla yerleşti.` });
    } catch (e) { toast.error("Yazıya dökülemedi", { description: e instanceof Error ? e.message : "Ses çözümlenemedi. Altyazıyı elle yazabilir ya da yeniden deneyebilirsin." }); }
    finally { setYaziyaDok(false); }
  };

  /* Müzik önizlemesi: 10 sn dinlet */
  const [dinlenen, setDinlenen] = useState<Muzik | null>(null);
  const dinleSes = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => dinleSes.current?.pause(), []);
  const muzikDinle = async (d: Muzik) => {
    if (dinlenen === d) { dinleSes.current?.pause(); setDinlenen(null); return; }
    dinleSes.current?.pause();
    const ay = ({ enerjik: [124, false, 0.85], sakin: [84, false, 0.35], duygusal: [76, true, 0.45] } as Record<string, [number, boolean, number]>)[d];
    if (!ay) return;
    const u = await besteWavUrl({ tohum: `shorts-${d}`, bpm: ay[0], key: "A", minor: ay[1], sure: 10, yogunluk: ay[2], parlaklik: 0.65, enstrumantal: true });
    const s = new Audio(u); dinleSes.current = s; s.onended = () => setDinlenen(null);
    try { await s.play(); setDinlenen(d); } catch { toast.error("Önizleme çalınamadı", { description: "Tarayıcı sesi oynatmaya izin vermedi. Sayfaya bir kez tıklayıp yeniden dene." }); }
  };

  /* Müzik: seçilince short süresine bestelenir (tarayıcıda) */
  useEffect(() => {
    if (muzik === "yok") return void setMuzikUrl(undefined);
    let iptal = false;
    const ayar = { enerjik: [124, false, 0.85], sakin: [84, false, 0.35], duygusal: [76, true, 0.45] }[muzik] as [number, boolean, number];
    const sure = Math.max(8, Math.ceil(mod === "konu" ? konuSn : klipSure || uzunluk) + 1);
    const z = setTimeout(() => { void besteWavUrl({ tohum: `shorts-${muzik}`, bpm: ayar[0], key: "A", minor: ayar[1], sure, yogunluk: ayar[2], parlaklik: 0.65, enstrumantal: true }).then((u) => { if (!iptal) setMuzikUrl(u); }); }, 400);
    return () => { iptal = true; clearTimeout(z); };
  }, [muzik, klipSure, konuSn, mod, uzunluk]);

  /* ── Derlenen montaj (önizleme + MP4 aynı motor) ── */
  const satirlar: Satir[] = useMemo(() => (kelimeler && an && tekKaynak ? kelimelerdenSatirlar(kelimeler, an.bas, an.son) : metindenSatirlar(altyaziMetni, klipSure)), [kelimeler, an, tekKaynak, altyaziMetni, klipSure]);
  const konuProje: ExProje | null = useMemo(() => {
    if (!sahneler?.length) return null;
    return { id: "shorts-konu", ad: konu.slice(0, 40) || "Short", konu, ayar: { ...varsayilanAyar(), oran: "9:16", hedefSn: konuSn, stil: konuStil, altyazi: altyazi === "yok" ? "yok" : altyazi === "sade" ? "altyazi" : altyazi === "neon" ? "karaoke" : altyazi, muzik: "yok", sfx: false, ilerleme }, sahneler, senaryoKaynak: "taslak", olusturma: 0, guncelleme: 0 };
  }, [sahneler, konu, konuSn, konuStil, altyazi, ilerleme]);
  const montaj: MontajProje | null = useMemo(() => {
    if (mod === "konu") {
      if (!konuProje) return null;
      const m = explainerMontaj(konuProje);
      if (muzikUrl) m.katmanlar.find((k) => k.ad === "Müzik")?.klipler.push({ id: "muz", ad: "Müzik", tur: "ses", sesUrl: muzikUrl, baslangic: 0, sure: Math.ceil(toplamSure(konuProje.sahneler)), basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: 45, opaklik: 100, efektler: [], gecis: "yok", gecisSure: 0.4 });
      return m;
    }
    if (!an) return null;
    return klipShortu({ ad: an.ad, url: an.url, poster: an.kare, kaynakSure: an.kaynakSure, bas: an.bas, son: an.son, oran, yerlesim, odak, zoom, kanca: kancaSu, satirlar, altyazi, vurgu, ilerleme, muzikUrl, sesDuzey: 100 });
  }, [mod, konuProje, an, oran, yerlesim, odak, zoom, kancaSu, satirlar, altyazi, vurgu, ilerleme, muzikUrl]);
  /* Sahne kareleri: derlenen short'un o sahnedeki gerçek, işlenmiş karesi (ekran yazısı dahil); düzenleme durunca yenilenir */
  useEffect(() => {
    if (mod !== "konu" || !montaj || !sahneler?.length) return;
    let iptal = false;
    const z = setTimeout(() => {
      void (async () => {
        const basla = sahneAnlari(sahneler), l: string[] = [];
        for (const [i, sh] of sahneler.entries()) {
          if (iptal) return;
          try { l[i] = URL.createObjectURL(await kareAl(montaj, basla[i] + Math.min(1.8, sahneSure(sh) - 0.4), 216, 384)); } catch { /* kalsın */ }
        }
        if (!iptal) setSahneKareleri((eski) => { eski.forEach((u) => u && URL.revokeObjectURL(u)); return l; });
      })();
    }, 700);
    return () => { iptal = true; clearTimeout(z); };
  }, [montaj, mod]); // eslint-disable-line react-hooks/exhaustive-deps
  const sahneKaresi = (i: number) => sahneKareleri[i] ?? stilPoster(konuStil);
  const sahneGit = (i: number) => { setAktifSahne(i); oynatici.current?.git((anlarZamanRef.current[i] ?? 0) + 0.6); };
  const sahneDegis = (id: string, patch: Partial<ExSahne>) => setSahneler((l) => l!.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const sahneTasi = (i: number, yon: -1 | 1) => setSahneler((l) => { if (!l) return l; const j = i + yon; if (j < 0 || j >= l.length) return l; const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const sahneSil = (i: number) => { setSahneler((l) => (l && l.length > 1 ? l.filter((_, j) => j !== i) : l)); setAktifSahne((a) => Math.max(0, Math.min(a, (sahneler?.length ?? 1) - 2))); };
  const sahneCogalt = (i: number) => setSahneler((l) => { if (!l) return l; const c = [...l]; c.splice(i + 1, 0, { ...l[i], id: exId("sh") }); return c; });
  const turDegis = (sh: ExSahne, tur: ExSahne["tur"]) => sahneDegis(sh.id, tur === "liste" ? { tur, maddeler: sh.maddeler?.length ? sh.maddeler : sh.anlatim.split(/[.!?]\s*/).filter(Boolean).slice(0, 3) }
    : tur === "istatistik" ? { tur, deger: sh.deger || "yüzde 70", etiket: sh.etiket || sh.baslik } : tur === "cta" ? { tur, etiket: sh.etiket || "Takip et" } : { tur });
  const sahneEkle = () => { const yeri = Math.max(0, (sahneler?.length ?? 1) - 1); setSahneler((l) => { const c = [...(l ?? [])]; c.splice(yeri, 0, { id: exId("sh"), tur: "anlatim", baslik: "Yeni sahne", anlatim: "Bu sahnede ne anlatılsın?", gorselIstem: "" } as ExSahne); return c; }); setAktifSahne(yeri); };
  // Önizleme ilk karede boş görünmesin: kanca ve ilk altyazı görünen ana git
  useEffect(() => { const z = setTimeout(() => oynatici.current?.git(1.2), 500); return () => clearTimeout(z); }, [secId, sahneler?.length, mod, gorunum]);
  const anlarZaman = useMemo(() => (mod === "konu" && konuProje ? sahneAnlari(konuProje.sahneler) : [0]), [mod, konuProje]);
  const anlarZamanRef = useRef(anlarZaman); anlarZamanRef.current = anlarZaman;

  /* ── Stil uygula ── */
  const P = preset === "ozel" ? { ad: ozelPreset.trim() || "Özel stil", tohum: "ozel", en: ozelPreset.trim() } : PRESETLER.find((x) => x.tohum === preset)!;
  const stilKredi = kaynak ? Math.max(1, Math.ceil(Math.min(kaynak.sure, 120) / 25)) * 28 : 28;
  const stilDemo = sag !== null && !sag.kling && !sag.seedance && !sag.omni && !sag.minimax;
  const stilUret = () => {
    if (!kaynak) return void toast.error("Video yok", { description: "Stil uygulamak için önce bir video ekle." });
    if (kaynak.parcalar) return void toast.error("Stil uygulanamadı", { description: "Stil yalnız tek bir videoya uygulanır. Tek bir video ekle." });
    if (kaynak.sure > 120.5) return void toast.error("Video çok uzun", { description: "Stil uygulama en çok 2 dakikalık kliplerle çalışır. Videodan klip modunda önce kısalt." });
    const r = uretimBaslat({ baslik: `${P.ad} · ${kaynak.ad}`.slice(0, 60), tur: "video", model: "Shorts Stüdyosu", prompt: `Restyle this clip as a vertical short in the "${P.ad}" preset: ${P.en}. Keep the speaker, timing and speech; add matching animated captions.`, kredi: stilKredi, arac: ARAC_ADI, meta: { oran: stilOran, cozunurluk: "720p", sure: `${Math.round(kaynak.sure)}sn`, hamIstem: P.ad, gorselUrl: kaynak.poster } });
    if (!r.ok) return void uretimHataToast(r);
    setTimeout(() => shortlarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    toast.success("Short üretiliyor", { description: `${P.ad} · ${stilDemo ? "Kredi düşmez." : `${stilKredi} kredi.`}` });
  };

  /* ── Konudan short ── */
  /** Konudan short: düzenleyici açılmaz. Senaryo kurulur, short tarayıcıda gerçek MP4'e dönüştürülür ve üretilenlere düşer (kredi harcamaz). */
  const konuOlustur = async () => {
    if (konu.trim().length < 4) document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Konu"]')?.focus();
    if (konu.trim().length < 4) return void toast.error("Konu çok kısa", { description: "Short'un neyi anlatacağını bir konu ya da başlıkla yaz." });
    if (!konuAnlamli(konu)) return void toast.error("Konu anlaşılmadı", { description: "Anlamlı bir konu yaz, örneğin: Kahvenin bilinmeyen 3 faydası." });
    if (yaziliyor) return;
    setYaziliyor(true);
    const pr = useProjeler.getState();
    const ad = konu.trim().slice(0, 60);
    const id = pr.ekle({ baslik: ad, tur: "video", model: "Vayra kurgu", prompt: konu.trim(), durum: "isleniyor", ilerleme: 2, baslama: Date.now(), kredi: 0, arac: ARAC_ADI, gorselUrl: stilPoster(konuStil), meta: { oran: "9:16", hamIstem: konu.trim(), mod: "konu", stilAd: stilBul(konuStil).ad } });
    setTimeout(() => shortlarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    if (istemTemizlensinMi("shorts")) setKonu("");
    try {
      const r = await shortSenaryo(konu.trim(), konuSn, konuStil);
      // Taslakta boş kalan maddeler videoda görünmez; liste sahnesi hiç madde içermiyorsa anlatım sahnesine dönüşür
      const sahneL = r.sahneler.map((s) => (s.tur === "liste" && !(s.maddeler ?? []).some((m) => m.trim()) ? { ...s, tur: "anlatim" as const } : s.tur === "istatistik" && !s.deger?.trim() ? { ...s, tur: "anlatim" as const, baslik: s.baslik } : s));
      const proje: ExProje = { id: `shorts-${id}`, ad, konu: konu.trim(), ayar: { ...varsayilanAyar(), oran: "9:16", hedefSn: konuSn, stil: konuStil, altyazi: altyazi === "yok" ? "yok" : altyazi === "sade" ? "altyazi" : altyazi === "neon" ? "karaoke" : altyazi, muzik: "yok", sfx: false, ilerleme }, sahneler: sahneL, senaryoKaynak: r.kaynak, olusturma: 0, guncelleme: 0 };
      const m = explainerMontaj(proje);
      const sure = Math.ceil(toplamSure(sahneL));
      if (muzik !== "yok") {
        const ay = ({ enerjik: [124, false, 0.85], sakin: [84, false, 0.35], duygusal: [76, true, 0.45] } as Record<string, [number, boolean, number]>)[muzik];
        const u = await besteWavUrl({ tohum: `shorts-${muzik}`, bpm: ay[0], key: "A", minor: ay[1], sure: sure + 1, yogunluk: ay[2], parlaklik: 0.65, enstrumantal: true });
        m.katmanlar.find((k) => k.ad === "Müzik")?.klipler.push({ id: "muz", ad: "Müzik", tur: "ses", sesUrl: u, baslangic: 0, sure, basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: 45, opaklik: 100, efektler: [], gecis: "yok", gecisSure: 0.4 });
      }
      await fontlariYukle();
      const kayit = await disaAktar(m, { W: 720, H: 1280, fps: 30, bitHizi: 4e6 }, (d) => pr.guncelle(id, { ilerleme: Math.max(2, Math.round(d.ilerleme * 96)) }), new AbortController().signal);
      const videoUrl = await dosyaYukle(kayit.blob, kayit.blob.type || "video/webm");
      // Kapak: başlık görünen an (ilk kare geçişin karanlık başlangıcı)
      let kapak = stilPoster(konuStil);
      try { kapak = await dosyaYukle(await kareAl(m, Math.min(1.6, sure / 2), 540, 960), "image/jpeg"); } catch { /* stil kapağı kalır */ }
      useProjeler.getState().guncelle(id, { durum: "tamam", ilerleme: 100, videoUrl, gorselUrl: kapak, gercek: true, saglayici: "tarayici", meta: { oran: "9:16", hamIstem: konu.trim(), mod: "konu", stilAd: stilBul(konuStil).ad } });
      toast.success("Short hazır", { description: r.kaynak === "ai" ? `${sahneL.length} sahne, AI senaryo. Kredi harcanmadı.` : `${sahneL.length} sahne. Senaryo yazarı bağlı değil, taslak senaryo kullanıldı.` });
    } catch (e) {
      useProjeler.getState().guncelle(id, { durum: "hata", ilerleme: 0, hata: e instanceof Error ? e.message : "Short oluşturulamadı" });
      toast.error("Short oluşturulamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    } finally { setYaziliyor(false); }
  };
  /** Taslakta kullanıcının doldurması gereken alan var mı (boş madde, boş rakam). */
  const eksik = (x: ExSahne) => (x.tur === "liste" && (x.maddeler ?? []).some((m) => !m.trim())) || (x.tur === "istatistik" && !x.deger?.trim());
  const sahneGorsel = (sh: ExSahne) => {
    sahneDegis(sh.id, { gorselDurum: "uretiliyor" });
    sahneGorselUret(sh, konuStil, (url) => sahneDegis(sh.id, { gorselUrl: url, videoUrl: undefined, gorselKaynak: "ai", gorselDurum: "hazir" }), () => sahneDegis(sh.id, { gorselDurum: "bos" }));
  };
  const sahneGorselYukle = async (sh: ExSahne, d: File) => {
    if (!d.type.startsWith("image/")) return void toast.error("Görsel değil", { description: "PNG, JPG ya da WEBP bir görsel seç." });
    sahneDegis(sh.id, { gorselDurum: "uretiliyor" });
    try { const url = await dosyaYukle(d, d.type); sahneDegis(sh.id, { gorselUrl: url, videoUrl: undefined, gorselKaynak: "yukleme", gorselDurum: "hazir" }); }
    catch { sahneDegis(sh.id, { gorselDurum: "bos" }); toast.error("Görsel yüklenemedi", { description: "Bağlantı kesildi. Yeniden dene." }); }
  };

  const montajdaAc = () => {
    if (!montaj) return;
    const ms = useMontaj.getState();
    const id = ms.projeOlustur({ ad: montaj.ad, enBoy: montaj.enBoy, katmanlar: JSON.parse(JSON.stringify(montaj.katmanlar)), arkaRenk: montaj.arkaRenk });
    ms.projeGuncelle(id, { kisma: true });
    toast.success("Montaj Stüdyosu'nda açıldı");
    router.push("/panel/montaj");
  };

  const M = MODLAR.find((x) => x.id === mod)!;
  const kare = an?.kare ?? kaynak?.poster ?? "/gercek/preset-video/selfie-twin.webp";
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  const altyaziCip = (
    <Cip etiket="Altyazı" ikon={<Captions className="h-4 w-4" />} deger={ALTYAZI_STILLERI.find((s) => s.id === altyazi)!.ad} acik={cip === "altyazi"} setAcik={cipAc("altyazi")} genislik={340}>
      <div className="p-1"><AltyaziIzgara deger={altyazi} onSec={(s) => { setAltyazi(s); setCip(null); }} vurgu={vurgu} kare={kare} /></div>
    </Cip>
  );
  const muzikKaro = (d: Muzik, a: string, b: string, kapat: boolean) => {
    const sec = muzik === d, r = MUZIK_RENK[d];
    return (
      <div key={d} className={cn("relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-[14px] p-3 ring-inset transition-[box-shadow]", d === "yok" && "col-span-2", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/25")}
        style={{ background: `radial-gradient(120% 100% at 0% 0%, ${r}${sec ? "40" : "24"}, transparent 65%), rgba(255,255,255,0.03)` }}>
        <button onClick={() => { setMuzik(d); if (kapat) setCip(null); }} aria-pressed={sec} aria-label={a} className="absolute inset-0" />
        <span className="pointer-events-none relative flex items-center gap-2.5">
          {d === "yok" ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white/80"><VolumeX className="h-4 w-4" /></span>
            : <button onClick={() => void muzikDinle(d)} aria-label={dinlenen === d ? `${a} durdur` : `${a} dinle`} className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/20 transition active:scale-90" style={{ background: `linear-gradient(145deg, ${r}, ${r}80)` }}>{dinlenen === d ? <Pause className="h-4 w-4 fill-current text-white" /> : <Play className="h-4 w-4 translate-x-px fill-current text-white" />}</button>}
          <span className="min-w-0 flex-1 leading-tight"><span className="flex items-center gap-1.5"><span className="text-[14px] font-semibold text-metin">{a}</span>{MUZIK_BPM[d] > 0 && <span className="whitespace-nowrap rounded-full bg-black/25 px-1.5 py-px text-[10.5px] font-medium tabular-nums text-white/80">{MUZIK_BPM[d]} BPM</span>}</span><span className="block text-[11.5px] text-metin-3">{b}</span></span>
        </span>
        {d !== "yok" && <Dalga ad={`sh-${d}`} renk={r} adet={28} yukseklik={20} canli={dinlenen === d} className="pointer-events-none relative w-full justify-between" />}
      </div>
    );
  };
  const muzikCip = (
    <Cip etiket="Müzik" ikon={<span className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(140deg, ${MUZIK_RENK[muzik]}, ${MUZIK_RENK[muzik]}55)` }}><Music2 className="h-4 w-4 text-white" /></span>} deger={MUZIKLER.find((m) => m[0] === muzik)![1]} acik={cip === "muzik"} setAcik={cipAc("muzik")} genislik={440}
      sag={<span className="text-[11.5px] text-metin-3">Süreye göre bestelenir, kredi harcamaz</span>}>
      <div className="grid grid-cols-2 gap-1.5">{MUZIKLER.map(([d, a, b]) => muzikKaro(d, a, b, true))}</div>
    </Cip>
  );
  const sureCip = (deger: number, set: (n: number) => void, id: string) => (
    <Cip etiket="Süre" ikon={<Clock className="h-4 w-4" />} deger={`${deger} sn`} acik={cip === id} setAcik={cipAc(id)} genislik={340}>
      <div className="grid grid-cols-2 gap-1.5">
        {SURELER.map((n) => { const sec = deger === n; return (
          <button key={n} onClick={() => { set(n); setCip(null); }} aria-pressed={sec} className={cn("flex flex-col items-start rounded-[12px] px-3 py-2.5 text-left ring-inset transition", sec ? "bg-white/[0.08] ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:bg-white/[0.045] hover:ring-white/20")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
            <span className="text-[15px] font-semibold tabular-nums text-metin">{n} saniye</span>
            <span className="text-[11.5px] text-metin-3">{n <= 15 ? "Hızlı, tek fikir" : n <= 30 ? "En çok izlenen" : n <= 45 ? "Hikâyeye yer var" : "Uzun anlatım"}</span>
          </button>); })}
      </div>
    </Cip>
  );

  /* Hero görseli: uzun videodaki güçlü anlar → dikey shortlar */
  const vitrin = (
    <div aria-hidden className="relative mx-auto h-[380px] w-full max-w-[420px] max-sm:h-[330px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {VITRIN_AN.map((a) => (
          <path key={a.d} d={`M ${a.x} ${a.alt} C ${a.x} ${(a.alt + 87) / 2}, ${(a.a + a.b) / 2} ${(a.alt + 87) / 2}, ${(a.a + a.b) / 2} 87.2`} fill="none" stroke="rgba(85,214,253,0.7)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" className="shorts-akis" />
        ))}
      </svg>
      {VITRIN_AN.map((a) => {
        const orta = a.orta;
        return (
          <div key={a.d} className={cn("absolute overflow-hidden rounded-[18px] bg-black ring-1 ring-white/[0.14]", orta ? "top-0 z-10 h-[300px] w-[169px] max-sm:h-[236px] max-sm:w-[133px]" : "top-[38px] h-[214px] w-[120px] max-sm:top-[30px] max-sm:h-[168px] max-sm:w-[94px]")}
            style={{ left: `${a.x}%`, transform: "translateX(-50%)" }}>
            {orta ? <video src={`/gercek/${a.d}.mp4`} poster={`/gercek/${a.d}.webp`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              /* eslint-disable-next-line @next/next/no-img-element */
              : <img src={`/gercek/${a.d}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />
            <span className={cn("absolute left-2 top-2 flex items-center justify-center rounded-full px-1.5 font-bold tabular-nums", orta ? "h-6 min-w-6 bg-emerald-400 text-[12px] text-[#052e1b]" : "h-5 min-w-5 bg-white text-[11px] text-black")}>{a.puan}</span>
            <span className={cn("absolute inset-x-2 text-center font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:2.5px_#000]", orta ? "top-10 text-[14px]" : "top-8 text-[11px]")}>{a.kanca}</span>
            {orta && <span className="absolute inset-x-0 bottom-[14%] text-center"><AltyaziOrnek s="karaoke" vurgu="#facc15" /></span>}
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20"><span className="block h-full bg-[#facc15]" style={{ width: orta ? "42%" : "70%" }} /></span>
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0">
        <div className="relative flex h-[58px] gap-[2px] overflow-hidden rounded-[12px] bg-black ring-1 ring-white/[0.1]">
          {VITRIN_SERIT.map((d, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={`/gercek/${d}.webp`} alt="" className="h-full min-w-0 flex-1 object-cover opacity-45" />
          ))}
          {VITRIN_AN.map((a) => (
            <span key={a.d} className="absolute inset-y-0 rounded-[8px] bg-aksan/[0.18] outline outline-2 -outline-offset-2 outline-aksan" style={{ left: `${a.a}%`, width: `${a.b - a.a}%` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/gercek/${a.d}.webp`} alt="" className="absolute inset-0 -z-10 h-full w-full rounded-[8px] object-cover" />
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between px-0.5 text-[12px] text-metin-2">
          <span className="flex items-center gap-1.5"><Film className="h-3.5 w-3.5" />Uzun video</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />3 güçlü an bulundu</span>
        </div>
      </div>
    </div>
  );

  /* ═════════ A · Stüdyo düzeni ═════════ */
  const YUZ = { background: "rgba(255,255,255,0.025)" };
  const KART = "overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]";
  const kartBaslik = (I: typeof Scissors, baslik: string, alt?: string, sag?: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5 max-sm:px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><I className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{baslik}</span>{alt && <span className="block text-[12.5px] text-metin-3">{alt}</span>}</span>
      {sag}
    </div>
  );

  const kaynakAlani = (
    <div onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }} onDragLeave={() => setSurukle(false)}
      onDrop={(e) => { e.preventDefault(); setSurukle(false); const d = e.dataTransfer.files[0]; if (d) void dosyaKoy(d); }}>
      <input ref={dosyaRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaKoy(d); }} />
      {kaynak ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-[16px] p-2 ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.06)" }}>
          <span className="relative h-[60px] w-[44px] shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {kaynak.poster && <img src={kaynak.poster} alt="" className="h-full w-full object-cover" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2"><span className="truncate text-[14.5px] font-semibold text-metin">{kaynak.ad}</span></span>
            <span className="mt-0.5 block text-[12.5px] text-metin-2">{kaynak.parcalar ? `${kaynak.parcalar.length} örnek klip · ${sureYaz(kaynak.sure)}` : `Kaynak video · ${sureYaz(kaynak.sure)}`}</span>
          </span>
          <button onClick={() => dosyaRef.current?.click()} title="Başka video" aria-label="Başka video" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.085] hover:text-metin active:scale-90"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => { setKaynak(null); setAnlar(null); setGorunum("giris"); }} title="Kaldır" aria-label="Videoyu kaldır" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.085] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
        </motion.div>
      ) : (
        <div className={cn("flex items-center gap-3 rounded-[16px] p-2.5 ring-1 ring-inset transition-[background-color,box-shadow] max-sm:flex-col max-sm:items-stretch", surukle ? "ring-2 ring-white" : "ring-white/[0.08]")} style={{ background: surukle ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)" }}>
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black">{yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</span>
            <span className="min-w-0"><span className="block text-[15px] font-medium text-metin">{surukle ? "Bırak, eklensin" : "Videonu sürükle ya da seç"}</span><span className="block text-[12.5px] text-metin-3">{mod === "stil" ? "En çok 2 dakika" : "MP4, MOV, 300 MB'a kadar"}</span></span>
          </span>
          <span className="flex-1" />
          <span className="flex flex-wrap gap-1.5">
            <button onClick={() => dosyaRef.current?.click()} disabled={yukleniyor} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.15] active:scale-95 disabled:opacity-60"><Upload className="h-4 w-4" />Bilgisayardan</button>
            <button onClick={() => setSecici(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.15] active:scale-95"><Images className="h-4 w-4" />Üretimlerimden</button>
            {mod === "klip" && <button onClick={() => void ornekKur()} disabled={yukleniyor} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.15] active:scale-95 disabled:opacity-60"><Play className="h-3.5 w-3.5 fill-current" />Örnekle dene</button>}
          </span>
        </div>
      )}
    </div>
  );

  const ciplerKlip = <>{sureCip(uzunluk, setUzunluk, "sure")}<Cip etiket="Format" ikon={<Smartphone className="h-4 w-4" />} deger={oran} acik={cip === "oran"} setAcik={cipAc("oran")} genislik={380}>
    <div className="grid grid-cols-3 gap-1.5">{FORMATLAR.map((f) => { const sec = oran === f.id; return (
      <button key={f.id} onClick={() => { setOran(f.id); setCip(null); }} aria-pressed={sec} className={cn("flex flex-col items-center gap-2 rounded-[12px] p-2.5 ring-inset transition", sec ? "bg-white/[0.08] ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:bg-white/[0.045] hover:ring-white/20")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
        <span className={cn("relative h-[64px] overflow-hidden rounded-[6px] ring-1 ring-white/20", ORAN_KUTU[f.id])}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={kare} alt="" className="absolute inset-0 h-full w-full object-cover" /></span>
        <span className="text-center leading-tight"><span className="block text-[13px] font-semibold tabular-nums text-metin">{f.ad}</span><span className="block text-[11px] text-metin-3">{f.alt}</span></span>
      </button>); })}</div>
  </Cip>{altyaziCip}{muzikCip}</>;
  const ciplerKonu = (
    <>
      {sureCip(konuSn, setKonuSn, "ksure")}
      <Cip etiket="Görsel stil" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={stilPoster(konuStil)} alt="" className="h-full w-full object-cover" />} deger={stilBul(konuStil).ad} acik={cip === "kstil"} setAcik={cipAc("kstil")} genislik={540} sag={<span className="text-[11.5px] text-metin-3">Üzerine gel, örneği oynasın</span>}>
        <OzelGirdi deger={ozelKonuStil} set={setOzelKonuStil} secili={konuStil.startsWith("ozel|")} ph="Ör. sulu boya, pastel tonlar" alt={`Kendi stilini tarif et; taban: ${EX_STILLER.find((x) => x.tohum === stilTaban(konuStil))?.ad ?? "seçili stil"}`} uygula={() => { setKonuStil(ozelStil(stilTaban(konuStil), ozelKonuStil)); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{EX_STILLER.map((s) => <IzgaraSec key={s.tohum} sec={konuStil === s.tohum} ad={s.ad} alt={s.kisa} kapak={stilPoster(s.tohum)} video={stilVideo(s.tohum)} oran="aspect-video" onClick={() => { setKonuStil(s.tohum); setCip(null); }} />)}</div>
      </Cip>
      {altyaziCip}{muzikCip}
    </>
  );
  const ciplerStil = (
    <>
      <Cip etiket="Stil" ikon={preset === "ozel" ? <Wand2 className="h-4 w-4" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={presetKapak(preset)} alt="" className="h-full w-full object-cover" />} deger={P.ad} acik={cip === "preset"} setAcik={cipAc("preset")} genislik={540} sag={<span className="text-[11.5px] tabular-nums text-metin-3">{PRESETLER.length} preset</span>}>
        <OzelGirdi deger={ozelPreset} set={setOzelPreset} secili={preset === "ozel"} ph="Ör. 90'lar VHS, sıcak renkler, el yazısı başlıklar" alt="Listede yoksa görsel dili tarif et" uygula={() => { setPreset("ozel"); setCip(null); }} />
        <div className="grid grid-cols-4 gap-2 p-1">{PRESETLER.map((x) => <IzgaraSec key={x.tohum} sec={preset === x.tohum} ad={x.ad} kapak={presetKapak(x.tohum)} oran="aspect-[9/16]" onClick={() => { setPreset(x.tohum); setCip(null); }} />)}</div>
      </Cip>
      <Cip etiket="Format" ikon={<Smartphone className="h-4 w-4" />} deger={stilOran} acik={cip === "soran"} setAcik={cipAc("soran")} genislik={280}>
        <SecSatir secili={stilOran === "9:16"} alt="Shorts, Reels, TikTok" onClick={() => { setStilOran("9:16"); setCip(null); }}>9:16 dikey</SecSatir>
        <SecSatir secili={stilOran === "16:9"} alt="YouTube" onClick={() => { setStilOran("16:9"); setCip(null); }}>16:9 yatay</SecSatir>
      </Cip>
    </>
  );
  const BEYAZ = "group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:w-full";
  const aksiyon = mod === "klip"
    ? <button onClick={() => (kaynak ? void analizEt(kaynak) : dosyaRef.current?.click())} disabled={!!analiz} className={BEYAZ}>{analiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{gorunum === "sonuc" && anlar?.length ? "Yeniden ara" : "Anları bul"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></button>
    : mod === "konu"
      ? <button onClick={() => void konuOlustur()} disabled={yaziliyor} className={BEYAZ}>{yaziliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{yaziliyor ? "Senaryo yazılıyor" : "Short oluştur"}</button>
      : <button onClick={() => (kaynak ? stilUret() : dosyaRef.current?.click())} className={BEYAZ}><Sparkles className="h-4 w-4" />Üret{stilDemo ? null : <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{stilKredi}</span>}</button>;

  const modSecici = (
    <div role="tablist" aria-label="Short türü" className="cam-istemci pointer-events-auto isolate mb-2 inline-grid grid-cols-3 gap-0.5 self-start rounded-full p-1 max-sm:grid max-sm:w-full">
      {MODLAR.map((x) => (
        <button key={x.id} role="tab" aria-selected={mod === x.id} onClick={() => { setMod(x.id); setCip(null); }}
          className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors max-sm:px-1 max-sm:text-[12px]", mod === x.id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {mod === x.id && <motion.span layoutId="sh-mod" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          <x.ikon className="h-3.5 w-3.5 max-sm:hidden" />{x.ad}
        </button>
      ))}
    </div>
  );
  const komut = (
    <div className="pointer-events-auto flex w-full flex-col">
    {modSecici}
    <div className="cam-istemci relative w-full rounded-[26px] p-3">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mod === "konu" ? "konu" : "video"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {mod === "konu" ? (
            <textarea value={konu} onChange={(e) => setKonu(e.target.value.slice(0, 300))} rows={2} aria-label="Konu"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void konuOlustur(); }}
              placeholder="Short neyi anlatsın? Örneğin: sabah rutini verimliliği nasıl artırır"
              className="block w-full resize-none bg-transparent px-2 py-2 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2" />
          ) : kaynakAlani}
        </motion.div>
      </AnimatePresence>
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] max-sm:grid max-sm:grid-cols-2 max-sm:[&>*>button]:w-full">{mod === "klip" ? ciplerKlip : mod === "konu" ? ciplerKonu : ciplerStil}</div>
        {aksiyon}
      </div>
    </div>
    </div>
  );

  /* Başlık kartı: stüdyo adı + Oluştur / Shortlarım */
  const ust = (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.085] text-white"><Scissors className="h-5 w-5" /></span>
      <span className="min-w-0 max-sm:hidden"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Shorts stüdyosu</span><span className="block truncate text-[12.5px] text-white/50">Uzun videodan, konudan ya da stil ile dikey klip</span></span>
      <span className="flex-1" />
      <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
        {([["olustur", "Oluştur", Sparkles, 0], ["shortlarim", "Shortlarım", Film, shortlar.length]] as const).map(([id, ad, I, n]) => (
          <button key={id} role="tab" aria-selected={ustSekme === id} onClick={() => setUstSekme(id)} className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", ustSekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {ustSekme === id && <motion.span layoutId="sh-ust" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-4 w-4" />{ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", ustSekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  /* Shortlarım */
  const shortlarKart = (baslik: string, alt: string, ust?: boolean) => (
    <section className={KART} style={YUZ}>
      {kartBaslik(Film, baslik, alt, shortlar.length ? <span className="flex items-center gap-2"><GorunumAyari sayfa="shorts" />{ust && shortlar.length > 6 && <button onClick={() => setUstSekme("shortlarim")} className="flex h-8 items-center rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin">Tümü</button>}<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{shortlar.length}</span></span> : undefined)}
      {shortlar.length ? (
        <div ref={shortIzgaraRef} className="grid gap-3 p-3.5" style={{ gridTemplateColumns: `repeat(${sutunSayisi(shortIzgaraEn, galeriGorunum, { enCok: 8 })}, minmax(0, 1fr))` }}>
          {(ust ? shortlar.slice(0, 6) : shortlar).map((u, i) => {
            const bitti = u.durum === "tamam", kp = saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl;
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} whileHover={{ y: -3 }} className="group relative overflow-hidden rounded-[16px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/25" style={{ aspectRatio: String(kartOrani(galeriGorunum, 9 / 16)) }}>
                <button type="button" onClick={() => setAcik(u)} aria-label={`${u.baslik} aç`} className="absolute inset-0 z-0" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {kp && <img src={kp} alt="" className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", !bitti && "opacity-40 blur-[2px]")} />}
                {bitti && u.videoUrl && <video src={u.videoUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
                {!bitti && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-[12.5px] font-medium text-white">{u.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}{u.durum === "hata" ? "Başarısız" : `yüzde ${Math.round(u.ilerleme ?? 0)}`}{u.durum !== "hata" && u.meta?.mod === "konu" && <span className="text-[11px] font-normal leading-snug text-white/70">Short kuruluyor; bu sekmeyi açık tut</span>}</span>}
                {bitti && u.meta?.stilAd && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{u.meta.stilAd}</span>}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                
                <span className="pointer-events-none absolute inset-x-2.5 bottom-2 line-clamp-2 text-[12.5px] font-medium leading-tight text-white">{u.baslik}</span>
                {bitti && (
        <div onClick={(e) => e.stopPropagation()} className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
          <FavoriDugmesi favori={!!u.favori} onClick={() => favoriToggle(u.id)} boyut="kucuk" />
          <IndirDugmesi u={u} className={eylemDugmesi("kucuk")} ikonSinif="h-3.5 w-3.5" side="left" />
          <YenidenKullanDugmesi onClick={() => { setUstSekme("olustur"); setMod("konu"); setKonu((u.meta?.hamIstem as string) || u.prompt); }} boyut="kucuk" />
          <KartDahaMenusu u={u} boyut="kucuk" eylemler={[{ ad: "Aç", ikon: ArrowUpRight, fn: () => setAcik(u) }]} onSil={() => { const geri = uretimGeriAl([u.id]); useProjeler.getState().sil(u.id); mesaj.silindi("Short", geri); }} />
        </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="relative h-[92px] w-[130px]">{["moonwalk", "selfie-twin", "orbit-360"].map((d, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={d} src={`/gercek/preset-video/${d}.webp`} alt="" className="absolute top-1 h-[84px] w-[48px] rounded-[10px] object-cover ring-2 ring-zemin" style={{ left: 14 + i * 34, transform: `rotate(${(i - 1) * 8}deg)`, zIndex: i === 1 ? 2 : 1 }} />)}</span>
          <p className="mt-4 text-[16px] font-semibold text-metin">Henüz short yok</p>
          <p className="mt-1 max-w-[380px] text-[13.5px] text-metin-3">Alttaki kutuya bir video ekle ya da örnek kliplerle dene; indirdiğin shortlar burada birikir.</p>
          <button onClick={() => { setUstSekme("olustur"); void ornekKur(); }} className="mt-4 flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><Play className="h-3.5 w-3.5 fill-current" />Örnekle dene</button>
        </div>
      )}
    </section>
  );
  const shortlarim = shortlarKart("Shortlarım", "Ürettiğin ve dışa aktardığın shortlar");
  /* Üretilenler: en son short büyük oynar, yanında bilgisi ve indirme; öncekiler altta küçük kareler */
  const son = shortlar[0];
  const konuOlusturRef = useRef(konuOlustur); konuOlusturRef.current = konuOlustur;
  const baskaStil = (t: string) => { if (!son) return; setMod("konu"); setKonu((son.meta?.hamIstem as string) || son.prompt); setKonuStil(t); setTimeout(() => void konuOlusturRef.current(), 60); };
  const sonBitti = son?.durum === "tamam";
  const sonKapak = son ? saltUrl(son.gorselUrl) ?? son.meta?.gorselUrl : undefined;
  const sonBilgi = son ? [son.meta?.stilAd, son.meta?.oran ?? "9:16", son.meta?.mod === "konu" ? "Konudan short" : "Stil uygula", new Date(son.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })].filter(Boolean).join(" · ") : "";
  const kucukBtn = "group relative block overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/[0.1] transition hover:-translate-y-0.5 hover:ring-white/45";
  const uretilenler = son ? (
    <section className={KART} style={YUZ}>
      <div className="grid gap-5 p-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:p-5 max-sm:p-3">
        <button onClick={() => setAcik(son)} className="group relative mx-auto block aspect-[9/16] h-[360px] overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/[0.1] max-sm:h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {sonKapak && <img src={sonKapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover", !sonBitti && "opacity-50 blur-[2px]")} />}
          {sonBitti && son.videoUrl && <video key={son.videoUrl} src={son.videoUrl} poster={sonKapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
          {!sonBitti && (
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-10 text-left">
              {son.durum === "hata" ? <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between text-[12.5px] font-semibold text-white"><span>{son.durum === "hata" ? "Başarısız" : "Kuruluyor"}</span>{son.durum !== "hata" && <span className="tabular-nums text-white/70">yüzde {Math.round(son.ilerleme ?? 0)}</span>}</span>
                {son.durum !== "hata" && <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/20"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(3, son.ilerleme ?? 0)}%` }} transition={{ duration: 0.4 }} /></span>}
              </span>
            </span>
          )}
        </button>
        <div className="flex min-w-0 flex-col py-1">
          <span className="text-[12px] font-medium text-metin-3">Son short</span>
          <p className="mt-1 line-clamp-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-metin">{son.baslik}</p>
          <p className="mt-2 text-[13px] tabular-nums text-metin-2">{sonBilgi}</p>
          {!sonBitti && son.durum !== "hata" && son.meta?.mod === "konu" && <p className="mt-2 text-[12.5px] text-metin-3">Tarayıcında kuruluyor; bitene kadar bu sekmeyi açık tut.</p>}
          {son.durum === "hata" && <p className="mt-2 text-[13px] text-rose-200/90">{son.hata ?? "Üretim tamamlanamadı."}</p>}
          {sonBitti && (
            <div className="mt-5 flex flex-wrap gap-2">
              <IndirDugmesi u={son} side="top" yerlesim="alt-sol" className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95"><Download className="h-4 w-4" />İndir</IndirDugmesi>
              <FavoriDugmesi favori={!!son.favori} onClick={() => favoriToggle(son.id)} side="top" className="!h-11 !w-11 !bg-white/[0.08] hover:!bg-white/[0.13]" />
              <Tooltip label="Klasöre taşı" side="top"><KlasoreTasiDugmesi uretimIdler={[son.id]} etiketSinif="sr-only" yerlesim="alt-sol" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-metin transition hover:bg-white/[0.13] active:scale-95" /></Tooltip>
              <button onClick={() => setAcik(son)} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Play className="h-4 w-4 fill-current" />Büyük izle</button>
            </div>
          )}
          <div className="mt-auto space-y-4 pt-6">
            {sonBitti && son.meta?.mod === "konu" && (
              <div>
                <p className="mb-2 text-[12.5px] font-medium text-metin-2">Aynı konuyu başka stille dene</p>
                <div className="grid max-w-[460px] grid-cols-6 gap-1.5">
                  {EX_STILLER.filter((x) => x.ad !== son.meta?.stilAd).slice(0, 6).map((x) => (
                    <Tooltip key={x.tohum} side="top" label={`${x.ad} ile oluştur`}>
                      <button onClick={() => baskaStil(x.tohum)} disabled={yaziliyor} aria-label={`${x.ad} ile oluştur`} className={cn(kucukBtn, "aspect-square w-full disabled:opacity-40")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stilPoster(x.tohum)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            {shortlar.length > 1 && (
              <div>
                <div className="mb-2 flex max-w-[460px] items-center justify-between"><p className="text-[12.5px] font-medium text-metin-2">Öncekiler</p><button onClick={() => setUstSekme("shortlarim")} className="text-[12.5px] font-medium text-metin-2 transition hover:text-metin">Tümünü gör</button></div>
                <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                  {shortlar.slice(1, 10).map((u) => {
                    const kp = saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl;
                    return (
                      <Tooltip key={u.id} side="top" label={u.baslik}>
                        <button onClick={() => setAcik(u)} aria-label={u.baslik} className={cn(kucukBtn, "aspect-[9/16] h-20 shrink-0 bg-black")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {kp && <img src={kp} alt="" className={cn("absolute inset-0 h-full w-full object-cover", u.durum !== "tamam" && "opacity-40")} />}
                          {u.durum === "isleniyor" && <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />}
                          {u.durum === "hata" && <AlertTriangle className="absolute inset-0 m-auto h-4 w-4 text-rose-300" />}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  ) : null;

  /* İlham: mod'a göre kart kart */
  const ilham = (
    <div className="space-y-4">
      {shortlar.length > 0 && <div ref={shortlarRef} className="scroll-mt-4">{uretilenler}</div>}
      {/* Vitrin: arkada moda göre örnek oynar, solda başlık, sağda buzlu cam mekanizma paneli (Uzun video ile aynı dil) */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08] lg:min-h-[460px]">
        <AnimatePresence initial={false}>
          {mod === "stil" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={`bg-${preset}`} src={presetKapak(preset)} alt="" aria-hidden initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1.08 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_30%] blur-[18px] saturate-[1.2]" />
          ) : (
            <motion.video key={mod === "konu" ? `bg-${konuStil}` : "bg-klip"} src={mod === "konu" ? stilVideo(konuStil) : "/gercek/preset-video/earth-zoom.mp4"} poster={mod === "konu" ? stilPoster(konuStil) : "/gercek/preset-video/earth-zoom.webp"} autoPlay muted loop playsInline aria-hidden
              initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 -z-10 h-full w-full object-cover" />
          )}
        </AnimatePresence>
        <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.92)_30%,rgba(11,12,14,0.5)_62%,rgba(11,12,14,0.3)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.55)_0%,rgba(11,12,14,0.85)_55%,#0b0c0e_100%)]" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#0b0c0e]/80 to-transparent" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-7 sm:px-10 lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-center lg:gap-10 lg:py-10">
          <AnimatePresence mode="wait">
            <motion.div key={mod} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="min-w-0">
              <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px]">
                {M.b1.replace(/,$/, "")}<br /><span className="hero-isilti">{M.b2.replace(/\.$/, "")}</span>
              </h1>
              <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-white/70">{M.alt}</p>
              <ol className="mt-6 flex flex-wrap gap-2">
                {(mod === "klip" ? [[Upload, "Videonu ekle"], [Scissors, "Anlar puanlanır"], [Download, "Düzenle, MP4 indir"]] : mod === "konu" ? [[Lightbulb, "Konunu yaz"], [Layers, "Sahneler kurulur"], [Download, "MP4 hazır"]] : [[Upload, "Klibini ekle"], [Wand2, "Stil seç"], [Sparkles, "Baştan üretilir"]]).map(([I, ad], i) => {
                  const C = I as typeof Scissors;
                  return <motion.li key={ad as string} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.085] pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold tabular-nums text-white">{i + 1}</span><C className="h-3.5 w-3.5 text-white/60" />{ad as string}</motion.li>;
                })}
              </ol>
            </motion.div>
          </AnimatePresence>
          <motion.div key={`panel-${mod}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="cam-istemci relative rounded-[24px] p-3.5">
            {mod === "klip" ? vitrin : mod === "konu" ? <KonuVitrin konu={konu} stil={konuStil} /> : <StilVitrin stiller={PRESETLER.map((x) => ({ ad: x.ad, tohum: x.tohum, kapak: presetKapak(x.tohum) }))} secili={preset} onSec={setPreset} />}
          </motion.div>
        </div>
      </section>

      {mod === "konu" && (
        <section className={KART} style={YUZ}>
          {kartBaslik(Lightbulb, "Konu önerileri", "Tıkla, kutuya yazılsın ve stili seçilsin", <span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{KONU_ORNEK.length}</span>)}
          <div className="grid grid-cols-2 gap-3 p-3.5 lg:grid-cols-4">
            {KONU_ORNEK.map(([k, s], i) => (
              <motion.button key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => { setKonu(k); setKonuStil(s); }}
                className={cn("group overflow-hidden rounded-[16px] text-left ring-inset transition-[box-shadow]", konu === k ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/[0.2]")} style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="relative block aspect-[16/9] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stilPoster(s)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">{EX_STILLER.find((x) => x.tohum === s)?.ad}</span>
                </span>
                <span className="block p-3 text-[13.5px] font-medium leading-snug text-metin">{k}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {mod === "stil" && (
        <section id="stiller" className={cn(KART, "scroll-mt-20")} style={YUZ}>
          {kartBaslik(Wand2, "Stil seç", "Klibin konuşması ve temposu korunur, görsel dili baştan üretilir", <span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{PRESETLER.length} preset</span>)}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 sm:grid-cols-4 lg:grid-cols-8">
            {PRESETLER.map((x, i) => {
              const sec = preset === x.tohum;
              return (
                <motion.button key={x.tohum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 16) * 0.02 }} onClick={() => setPreset(x.tohum)} aria-pressed={sec} className="group min-w-0 text-left">
                  <span className={cn("relative block aspect-[9/16] overflow-hidden rounded-[14px] transition duration-300 group-hover:-translate-y-0.5", sec ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={presetKapak(x.tohum)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </span>
                  <span className={cn("mt-1.5 block truncate text-[13px] font-medium", sec ? "text-metin" : "text-metin-2")}>{x.ad}</span>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {mod === "klip" && (
        <section className={KART} style={YUZ}>
          {kartBaslik(Sparkles, "Anlar nasıl seçilir", "Ses, konuşma ve hareket birlikte puanlanır")}
          <div className="px-5 pb-4 pt-6 max-sm:px-4">
            <div className="relative flex h-28 items-end gap-[3px] max-sm:[&>span:nth-child(odd)]:hidden">
              {ORNEK_PUAN.map((p, i) => {
                const zirve = i === ORNEK_ZIRVE;
                return (
                  <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.008, duration: 0.4 }} style={{ height: `${p}%`, transformOrigin: "bottom" }} className={cn("relative min-w-0 flex-1 rounded-t-[3px]", zirve ? "bg-white" : p > 62 ? "bg-white/35" : "bg-white/[0.14]")}>
                    {zirve && <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold tabular-nums text-black">En güçlü an · 99</span>}
                  </motion.span>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11.5px] tabular-nums text-metin-3"><span>0:00</span><span>Videonun tamamı</span><span>Son</span></div>
          </div>
          <div className="grid border-t border-white/[0.06] sm:grid-cols-3 sm:divide-x max-sm:divide-y divide-white/[0.06]">
            {([[Music2, "Ses enerjisi", "Yüksek ses ve vurgu anları"], [Captions, "Konuşma", "Cümle başları kanca olur"], [Film, "Hareket", "Görüntünün en canlı yerleri"]] as const).map(([I, ad, alt]) => (
              <div key={ad} className="flex items-center gap-3 px-5 py-3.5 max-sm:px-4">
                <I className="h-4 w-4 shrink-0 text-metin-2" />
                <span className="min-w-0 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{ad}</span><span className="block truncate text-[12.5px] text-metin-3">{alt}</span></span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );



  /* ═════════ SONUÇLAR ═════════ */
  const enGuclu = anlar?.length ? [...anlar].sort((a, b) => b.puan - a.puan)[0].id : null;
  // Her kartta aynı gerekçe yazıyorsa ("Bol hareket") tekrar etme
  const tekNeden = !!anlar && anlar.length > 1 && anlar.every((a) => a.neden === anlar[0].neden);
  const sonuc = (
    <section className={KART} style={YUZ}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
        <button onClick={() => setGorunum("giris")} aria-label="Geri" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-metin ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.08] active:scale-90"><ArrowLeft className="h-[18px] w-[18px]" /></button>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.01em] text-metin">
            {analiz ? "Anlar aranıyor" : `${anlar?.length ?? 0} an bulundu`}
          </h1>
          <p className="mt-0.5 truncate text-[12.5px] text-metin-3">{kaynak?.ad} · {analiz ? `${analiz}…` : sesVar ? "ses enerjisi, konuşma ve hareket ölçüldü" : "görüntü hareketi ölçüldü, videoda ses yok"}</p>
        </div>
        {!!anlar?.length && <div className="w-[230px] max-sm:w-full"><Segment etiket="Sırala" deger={sirala} onDegis={setSirala} secenekler={[["puan", "Skora göre"], ["sira", "Videodaki sıra"]]} /></div>}
      </div>
      <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
        {anlar
          ? sirali.map((a, i) => <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }}><AnKart an={a} sira={a.sira + 1} enIyi={a.id === enGuclu} nedenGizle={tekNeden} onAc={() => anAc(a.id)} /></motion.div>)
          : Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.06]">
              <span className="uy-kart absolute inset-0"><span className="uy-bulut uy-bulut-1" /><span className="uy-bulut uy-bulut-2" /><span className="uy-gren" /><span className="uy-tara" style={{ animationDelay: `${i * 0.2}s` }} /></span>
              <span className="absolute inset-x-0 bottom-4 text-center text-[12.5px] text-white/70">{i + 1}. an</span>
            </div>
          ))}
      </div>
      {!!anlar?.length && <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3 text-[12.5px] text-metin-2"><Sparkles className="h-3.5 w-3.5" />Skor bu videodaki anların birbirine göre gücüdür. Bir karta tıkla; kanca, altyazı ve kadrajı ayarla, MP4 indir.</div>}
    </section>
  );

  /* ═════════ DÜZENLEYİCİ ═════════ */
  const sekmeler: [typeof sekme, string, typeof Scissors][] = mod === "konu"
    ? [["sahne", "Sahneler", Layers], ["stil", "Stil", Palette], ["altyazi", "Altyazı", Captions], ["muzik", "Müzik", Music2]]
    : [["kanca", "Kanca", TypeIcon], ["altyazi", "Altyazı", Captions], ["kadraj", "Kadraj", Crop], ["muzik", "Müzik", Music2]];
  const kancaOneri = useMemo(() => {
    const l = [...KANCALAR];
    if (kelimeler && an && tekKaynak) { const w = kelimeler.filter((x) => x.b >= an.bas && x.b < an.bas + 3.5).map((x) => x.k).join(" "); if (w) l.unshift(w.slice(0, 60)); }
    return l;
  }, [kelimeler, an, tekKaynak]);

  const ayarPaneli = (
    <div>
      {sekme === "kanca" && an && (
        <>
          <Bolum baslik="Kanca başlığı" sag={<span className="text-[12px] text-metin-3">İlk 3 saniye</span>}>
            <input value={kancaSu} onChange={(e) => setKancalar((m) => ({ ...m, [an.id]: e.target.value.slice(0, 60) }))} placeholder="Örn. Bunu kimse söylemiyor" aria-label="Kanca başlığı"
              className="h-11 w-full rounded-[12px] bg-white/[0.055] px-3.5 text-[15px] font-semibold text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:font-normal placeholder:text-metin-2 focus:ring-white/25" />
            <div className="flex flex-wrap gap-1.5">
              {kancaOneri.slice(0, 7).map((k, i) => <button key={k} onClick={() => setKancalar((m) => ({ ...m, [an.id]: k }))} className={cn("rounded-full px-3 py-1.5 text-[12.5px] ring-1 ring-inset transition-colors", kancaSu === k ? "bg-white text-[#0b0c0e] ring-white" : "bg-white/[0.045] text-metin-2 ring-white/[0.08] hover:text-metin")}>{i === 0 && kelimeler && tekKaynak ? `“${k}”` : k}</button>)}
              {kancaSu && <button onClick={() => setKancalar((m) => ({ ...m, [an.id]: "" }))} className="flex items-center gap-1 rounded-full bg-white/[0.045] px-3 py-1.5 text-[12.5px] text-metin-3 ring-1 ring-inset ring-white/[0.08] transition hover:text-metin"><X className="h-3 w-3" />Kancasız</button>}
            </div>
          </Bolum>
          <Bolum baslik="Vurgu rengi">
            <Renkler deger={vurgu} onDegis={setVurgu} renkler={VURGULAR} etiket="Vurgu" />
            <p className="text-[12px] text-metin-3">Kanca kutusu, vurgulanan sözcük ve ilerleme çubuğu bu rengi kullanır.</p>
          </Bolum>
          <Bolum><AnahtarSatir ad="İlerleme çubuğu" alt="Altta dolan çizgi izleyiciyi sona kadar tutar." acik={ilerleme} onDegis={() => setIlerleme((v) => !v)} /></Bolum>
        </>
      )}
      {sekme === "altyazi" && (
        <>
          <Bolum baslik="Altyazı stili"><AltyaziIzgara deger={altyazi} onSec={setAltyazi} vurgu={vurgu} kare={mod === "konu" ? stilPoster(konuStil) : kare} /></Bolum>
          {mod === "konu" && <Bolum><AnahtarSatir ad="İlerleme çubuğu" alt="Altta dolan çizgi izleyiciyi sona kadar tutar." acik={ilerleme} onDegis={() => setIlerleme((v) => !v)} /></Bolum>}
          {mod === "klip" && altyazi !== "yok" && (
            <Bolum baslik="Altyazı metni">
              {tekKaynak && (
                <button onClick={() => void otomatikAltyazi()} disabled={yaziyaDok} className="flex w-full items-center gap-3 rounded-[12px] bg-white/[0.045] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.085] disabled:opacity-60">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-metin-2">{yaziyaDok ? <Loader2 className="h-4 w-4 animate-spin" /> : kelimeler ? <Check className="h-4 w-4 text-emerald-300" /> : <Captions className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{kelimeler ? "Konuşmadan altyazı hazır" : "Konuşmadan otomatik altyazı"}</span><span className="mt-0.5 block text-[12px] text-metin-3">{elevenBagli ? "Sözcük zamanlamalı · ElevenLabs Scribe" : "ElevenLabs bağlantısı gerekli"}</span></span>
                </button>
              )}
              {!kelimeler && <textarea value={altyaziMetni} onChange={(e) => setAltyaziMetni(e.target.value.slice(0, 600))} rows={4} placeholder="Altyazı metnini yaz; klip süresine yayılır." style={{ background: "rgba(255,255,255,0.05)" }} className="block w-full resize-none rounded-[12px] p-3 text-[13.5px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/25" />}
              {kelimeler && <button onClick={() => setKelimeler(null)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin"><TypeIcon className="h-3.5 w-3.5" />Elle yazmaya dön</button>}
            </Bolum>
          )}
        </>
      )}
      {sekme === "kadraj" && (
        <>
          <Bolum baslik="Format">
            <div className="grid grid-cols-3 gap-2">
              {FORMATLAR.map((f) => {
                const sec = oran === f.id;
                return (
                  <button key={f.id} onClick={() => setOran(f.id)} aria-pressed={sec} title={f.alt} className="group flex min-w-0 flex-col items-center">
                    <span className={cn("flex h-[92px] w-full items-center justify-center rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white/70" : "ring-1 ring-white/[0.06]")} style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className={cn("relative h-[72px] overflow-hidden rounded-[6px]", ORAN_KUTU[f.id])}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={kare} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <span className={cn("pointer-events-none absolute inset-0 rounded-[6px] ring-inset", sec ? "ring-[2.5px] ring-white" : "ring-1 ring-white/20")} />
                      </span>
                    </span>
                    <span className={cn("mt-1.5 text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{f.ad}</span>
                  </button>
                );
              })}
            </div>
          </Bolum>
          <Bolum baslik="Yerleşim">
            <div className="grid grid-cols-3 gap-2">
              {KADRAJLAR.map((x) => {
                const sec = yerlesim === x.id;
                return (
                  <button key={x.id} onClick={() => setYerlesim(x.id)} aria-pressed={sec} className="group min-w-0 text-left">
                    <span className={cn("block overflow-hidden rounded-[11px] ring-offset-2 ring-offset-[#18191c]", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.1] group-hover:ring-white/30")}><KadrajOrnek kare={kare} yerlesim={x.id} /></span>
                    <span className={cn("mt-1.5 block text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{x.ad}</span>
                    <span className="block text-[11.5px] text-metin-3">{x.alt}</span>
                  </button>
                );
              })}
            </div>
            {yerlesim === "doldur" && <><AltBaslik>Odak</AltBaslik><Segment etiket="Odak" deger={odak} onDegis={setOdak} secenekler={[["sol", "Sol"], ["orta", "Orta"], ["sag", "Sağ"]]} /></>}
            <Kaydirici ad="Yakınlaştırma" deger={zoom} min={100} max={160} adim={1} varsayilan={100} onDegis={setZoom} yaz={(n) => `yüzde ${Math.round(n)}`} />
          </Bolum>
        </>
      )}
      {sekme === "muzik" && (
        <Bolum baslik="Müzik">
          <div className="grid grid-cols-1 gap-1.5 [&>div]:col-span-1">{MUZIKLER.map(([d, a, b]) => muzikKaro(d, a, b, false))}</div>
          <p className="text-[12px] leading-snug text-metin-3">Short süresine göre tarayıcıda bestelenir, konuşma varken kısılır, kredi harcamaz.</p>
        </Bolum>
      )}
      {sekme === "stil" && (
        <Bolum baslik="Görsel stil">
          <div className="grid grid-cols-2 gap-2">
            {EX_STILLER.map((s) => (
              <button key={s.tohum} onClick={() => setKonuStil(s.tohum)} className="group min-w-0 text-left">
                <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[10px] ring-inset", konuStil === s.tohum ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.1] group-hover:outline-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stilPoster(s.tohum)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                </span>
                <span className={cn("mt-1 block truncate text-[12.5px] font-medium", konuStil === s.tohum ? "text-metin" : "text-metin-2")}>{s.ad}</span>
              </button>
            ))}
          </div>
        </Bolum>
      )}
      {sekme === "sahne" && sahneler && (() => {
        const ai = Math.min(aktifSahne, sahneler.length - 1), sh = sahneler[ai];
        const girdi = "w-full rounded-[12px] bg-white/[0.055] px-3.5 text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25";
        return (
          <div>
            <Bolum baslik={<span className="flex items-center gap-2">Sahneler<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white/70">{sahneler.length} sahne · {sureYaz(toplamSure(sahneler))}</span></span>} sag={<button onClick={() => void konuOlustur()} disabled={yaziliyor} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95">{yaziliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Yeniden yaz</button>}>
              {senaryoKaynak === "taslak" && <p className="-mt-1 flex items-start gap-2 rounded-[12px] bg-amber-300/[0.07] px-3 py-2 text-[12px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />Senaryo yazarı bağlı değil; bu bir taslak. Maddeleri ve rakamı kendi bilgilerinle doldur.</p>}
              <div className="-mx-1.5 space-y-0.5">
                {sahneler.map((x, i) => (
                  <button key={x.id} onClick={() => { sahneGit(i); setTimeout(() => { const el = document.getElementById("sahne-duzen"), k = el?.closest("aside"); if (!el) return; if (k && k.scrollHeight > k.clientHeight) k.scrollTo({ top: el.getBoundingClientRect().top - k.getBoundingClientRect().top + k.scrollTop - 76, behavior: "smooth" }); else el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60); }} aria-pressed={ai === i} className={cn("flex w-full scroll-mt-20 items-center gap-3 rounded-[12px] p-1.5 text-left transition-colors active:scale-[0.99]", ai === i ? "bg-white/[0.08]" : "hover:bg-white/[0.045]")}>
                    <span className={cn("relative h-[72px] w-[41px] shrink-0 overflow-hidden rounded-[8px] bg-black ring-1 ring-inset", ai === i ? "ring-white" : "ring-white/[0.1]")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.gorselUrl ?? sahneKaresi(i)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      {x.gorselDurum === "uretiliyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-3.5 w-3.5 animate-spin text-white" /></span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5"><span className="text-[12px] tabular-nums text-metin-3">{i + 1}</span><span className="truncate text-[13.5px] font-medium text-metin">{x.tur === "istatistik" ? (x.deger ? `${x.deger} ${x.etiket ?? ""}` : "Rakam") : x.baslik || "Başlıksız"}</span></span>
                      <span className="mt-0.5 block truncate text-[12px] text-metin-3">{SAHNE_TUR[x.tur] ?? "Sahne"} · {sahneSure(x).toFixed(1)} sn{x.gorselUrl ? " · kendi görseli" : ""}</span>
                    </span>
                    {eksik(x) && <span className="shrink-0 rounded-full bg-amber-300/[0.14] px-2 py-0.5 text-[11.5px] font-semibold text-amber-200">Doldur</span>}
                  </button>
                ))}
              </div>
              <button onClick={sahneEkle} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-[0.98]"><Plus className="h-3.5 w-3.5" />Sahne ekle</button>
            </Bolum>
            {sh && (
              <Bolum className="scroll-mt-[72px]" baslik={<span id="sahne-duzen">{ai + 1}. sahne</span>} sag={
                <span className="flex items-center">
                  <button onClick={() => { sahneTasi(ai, -1); setAktifSahne(ai - 1); }} disabled={ai === 0} title="Öne al" aria-label="Öne al" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.085] hover:text-metin disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <button onClick={() => { sahneTasi(ai, 1); setAktifSahne(ai + 1); }} disabled={ai === sahneler.length - 1} title="Sona al" aria-label="Sona al" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.085] hover:text-metin disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                  <button onClick={() => sahneCogalt(ai)} title="Çoğalt" aria-label="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.085] hover:text-metin"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => sahneSil(ai)} disabled={sahneler.length <= 1} title="Sil" aria-label="Sil" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.085] hover:text-rose-300 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </span>}>
                <AltBaslik>Sahne türü</AltBaslik>
                <Segment etiket="Sahne türü" deger={sh.tur as "baslik" | "anlatim" | "liste" | "istatistik" | "cta"} onDegis={(t) => turDegis(sh, t)} secenekler={(["baslik", "anlatim", "liste", "istatistik", "cta"] as const).map((t) => [t, SAHNE_TUR[t]] as const)} />
                {sh.tur === "istatistik" ? (
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <label><span className="mb-1.5 block text-[12.5px] text-metin-2">Rakam</span><input value={sh.deger ?? ""} onChange={(e) => sahneDegis(sh.id, { deger: e.target.value.slice(0, 12) })} placeholder="yüzde 40" className={cn(girdi, "h-11 text-[16px] font-semibold", !sh.deger?.trim() && "ring-amber-300/40")} /></label>
                    <label><span className="mb-1.5 block text-[12.5px] text-metin-2">Açıklama</span><input value={sh.etiket ?? ""} onChange={(e) => sahneDegis(sh.id, { etiket: e.target.value.slice(0, 50) })} placeholder="Ne ölçüldü, kaynak" className={cn(girdi, "h-11 text-[14px]")} /></label>
                  </div>
                ) : (
                  <label className="block"><span className="mb-1.5 block text-[12.5px] text-metin-2">Ekran yazısı</span>
                    <input value={sh.baslik} onChange={(e) => sahneDegis(sh.id, { baslik: e.target.value.slice(0, 70) })} placeholder="Ekranda görünecek başlık" className={cn(girdi, "h-11 text-[15px] font-semibold")} /></label>
                )}
                {sh.tur === "liste" && (
                  <div className="space-y-1.5">
                    <span className="block text-[12.5px] text-metin-2">Maddeler</span>
                    {(sh.maddeler ?? []).map((m, k) => (
                      <div key={k} className="flex items-center gap-2"><span className="w-4 text-center text-[12.5px] tabular-nums text-metin-3">{k + 1}</span>
                        <input value={m} onChange={(e) => sahneDegis(sh.id, { maddeler: (sh.maddeler ?? []).map((y, z) => (z === k ? e.target.value.slice(0, 50) : y)) })} placeholder={`${k + 1}. maddeyi yaz`} className={cn(girdi, "h-9 text-[13.5px]", !m.trim() && "ring-amber-300/40")} />
                        <button onClick={() => sahneDegis(sh.id, { maddeler: (sh.maddeler ?? []).filter((_, z) => z !== k) })} aria-label="Maddeyi sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.085] hover:text-metin"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    {(sh.maddeler?.length ?? 0) < 4 && <button onClick={() => sahneDegis(sh.id, { maddeler: [...(sh.maddeler ?? []), ""] })} className="flex items-center gap-1 pl-6 text-[12.5px] font-medium text-metin-2 hover:text-metin"><Plus className="h-3.5 w-3.5" />Madde ekle</button>}
                  </div>
                )}
                {sh.tur === "cta" && (
                  <label className="block"><span className="mb-1.5 block text-[12.5px] text-metin-2">Çağrı etiketi</span>
                    <input value={sh.etiket ?? ""} onChange={(e) => sahneDegis(sh.id, { etiket: e.target.value.slice(0, 30) })} placeholder="Örn. Takip et" className={cn(girdi, "h-10 text-[14px]")} /></label>
                )}
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[12.5px] text-metin-2">Anlatım<span className="text-metin-3">Altyazı olur</span></span>
                  <textarea value={sh.anlatim} onChange={(e) => sahneDegis(sh.id, { anlatim: e.target.value.slice(0, 300) })} rows={4} placeholder="Bu sahnede ne anlatılsın?"
                    className="block w-full resize-none rounded-[12px] bg-white/[0.055] p-3.5 text-[14px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25" />
                </label>
                <Kaydirici ad="Süre" deger={sahneSure(sh)} min={2} max={12} adim={0.1} onDegis={(v) => sahneDegis(sh.id, { sure: Math.round(v * 10) / 10 })} yaz={(n) => `${n.toFixed(1)} sn`}
                  sag={sh.sure ? <button onClick={() => sahneDegis(sh.id, { sure: undefined })} className="rounded-full px-2 py-0.5 text-[12px] text-metin-3 hover:bg-white/[0.08] hover:text-metin">Otomatik</button> : <span className="text-[12px] text-metin-3">Otomatik</span>} />
              </Bolum>
            )}
            {sh && (
              <Bolum baslik="Sahne görseli" sag={sh.gorselUrl ? <button onClick={() => sahneDegis(sh.id, { gorselUrl: undefined, videoUrl: undefined, gorselKaynak: undefined, gorselDurum: "bos" })} className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] text-metin-3 transition hover:bg-white/[0.08] hover:text-metin"><X className="h-3 w-3" />Stil klibine dön</button> : undefined}>
                <input ref={gorselRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void sahneGorselYukle(sh, d); }} />
                <div className="flex gap-3">
                  <span className="relative h-[112px] w-[63px] shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-inset ring-white/[0.1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sh.gorselUrl ?? stilPoster(konuStil)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    {sh.gorselDurum === "uretiliyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
                  </span>
                  <textarea value={sh.gorselIstem} onChange={(e) => sahneDegis(sh.id, { gorselIstem: e.target.value.slice(0, 300) })} rows={4} aria-label="Sahnede ne görünsün" placeholder="Sahnede ne görünsün? Örn. buharı tüten kahve fincanı, sabah ışığı"
                    className="block min-w-0 flex-1 resize-none rounded-[12px] bg-white/[0.055] p-3 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/25" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => sahneGorsel(sh)} disabled={sh.gorselDurum === "uretiliyor"} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"><Sparkles className="h-4 w-4" />{sh.gorselUrl ? "Yeniden üret" : "Görsel üret"}<span className="flex items-center gap-0.5 text-[12px] tabular-nums text-black/55"><KrediJeton boyut={11} />{KREDI.gorsel}</span></button>
                  <button onClick={() => gorselRef.current?.click()} disabled={sh.gorselDurum === "uretiliyor"} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-[0.97] disabled:opacity-50"><Upload className="h-4 w-4" />Yükle</button>
                </div>
                {!sh.gorselUrl && <p className="text-[12px] leading-snug text-metin-3">Görsel yokken sahne seçilen stilin örnek klibiyle oynar.</p>}
              </Bolum>
            )}
          </div>
        );
      })()}
    </div>
  );

  const duzen = (
    <section>
      <div className="flex flex-wrap items-center gap-2.5 rounded-[20px] px-2.5 py-2 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <button onClick={() => setGorunum(mod === "konu" ? "giris" : "sonuc")} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] pl-3 pr-4 text-[13.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><ArrowLeft className="h-4 w-4" />{mod === "konu" ? "Konuya dön" : "Tüm anlar"}</button>
        {mod === "klip" && an && (
          <div className="flex items-center gap-1 rounded-full bg-white/[0.045] p-1 ring-1 ring-inset ring-white/[0.07]">
            <button onClick={() => anSira > 0 && setSecId(sirali[anSira - 1].id)} disabled={anSira <= 0} aria-label="Önceki an" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.08] hover:text-metin disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-1.5 text-[13px] tabular-nums text-metin-2">{anSira + 1} / {sirali.length}</span>
            <button onClick={() => anSira < sirali.length - 1 && setSecId(sirali[anSira + 1].id)} disabled={anSira >= sirali.length - 1} aria-label="Sonraki an" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.08] hover:text-metin disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 whitespace-nowrap text-[12.5px] text-metin-2 max-sm:order-last max-sm:basis-full">
          {mod === "konu" ? <span className="flex h-10 min-w-0 items-center gap-2 rounded-full bg-white/[0.045] px-3.5 ring-1 ring-inset ring-white/[0.07]"><span className="truncate text-[13.5px] font-semibold text-metin">{konu.trim() || "Short"}</span><span className="shrink-0 tabular-nums text-metin-3">{sahneler?.length ?? 0} sahne · {sureYaz(toplamSure(sahneler ?? []))} · {stilBul(konuStil).ad}</span></span>
            : an ? <span className="flex h-10 items-center gap-2.5 rounded-full bg-white/[0.045] pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">{an.puan >= 0 && <span className={cn("flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12.5px] font-bold tabular-nums", an.puan >= 80 ? "bg-emerald-400 text-[#052e1b]" : "bg-white text-black")} title="Bu videodaki diğer anlara göre güç skoru">{an.puan}</span>}<span className="truncate text-[13.5px] font-semibold text-metin">{an.kanca}</span><span className="tabular-nums text-metin-3">{sureYaz(an.bas + (an.ofset ?? 0))}–{sureYaz(an.son + (an.ofset ?? 0))}</span></span> : null}
        </div>
        <div className="flex gap-2 max-sm:w-full">
          <button onClick={montajdaAc} disabled={!montaj} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1] max-sm:flex-1"><Combine className="h-4 w-4" /><span className="sm:hidden">Montaj</span><span className="max-sm:hidden">Montajda düzenle</span></button>
          <button onClick={() => montaj && setDisa(true)} disabled={!montaj} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95 disabled:opacity-45 max-sm:flex-1"><Download className="h-4 w-4" />MP4 indir</button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="relative isolate flex h-[min(76vh,760px)] min-w-0 items-stretch justify-center overflow-hidden rounded-[22px] bg-[#0f1012] p-3 ring-1 ring-inset ring-white/[0.06] max-lg:h-[68vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mod === "konu" ? sahneKaresi(Math.min(aktifSahne, (sahneler?.length ?? 1) - 1)) : kare} alt="" aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-25 blur-3xl" />
          {montaj ? <ExOynatici ref={oynatici} key={`${mod}-${secId}`} proje={montaj} anlar={anlarZaman} basliklar={mod === "konu" ? (sahneler ?? []).map((x) => x.baslik) : [""]} secili={mod === "konu" ? aktifSahne : 0} onSahne={(i) => setAktifSahne(i)} ince={mod !== "konu"} etiket={mod === "konu" ? "Sahne" : ""} sinif="h-full w-full max-w-[480px]" />
            : <div className="flex flex-col items-center justify-center gap-2 text-metin-3"><Film className="h-6 w-6" /><span className="text-[13px]">Önizleme hazırlanıyor</span></div>}
        </div>
        <aside className="min-w-0 overflow-hidden rounded-[22px] bg-[#18191c] ring-1 ring-inset ring-white/[0.06] lg:max-h-[min(76vh,760px)] lg:overflow-y-auto lg:[scrollbar-width:thin]">
          <div role="tablist" className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#18191c] p-3"><div className="isolate grid gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)", gridTemplateColumns: `repeat(${sekmeler.length}, minmax(0,1fr))` }}>
            {sekmeler.map(([id, ad]) => (
              <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {sekme === id && <motion.span layoutId="sh-duzen-sekme" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}{ad}
              </button>
            ))}
          </div></div>
          {ayarPaneli}
        </aside>
      </div>
    </section>
  );

  const modallar = (
    <AnimatePresence>
      {disa && montaj && <MontajDisaAktar key="disa" proje={montaj} onKapat={() => setDisa(false)} onOran={(o) => { if (o === "16:9") return void toast.warning("Bu oran short için uygun değil", { description: "Short dikey formatlar içindir. 9:16, 4:5 ya da 1:1 seç." }); setOran(o as ShortsOran); }} />}
      {acik && <UretimGoruntuleyici key="detay" u={shortlar.find((x) => x.id === acik.id) ?? acik} liste={shortlar.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = shortlar.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}
      {secici && <UretimPaneli key="secici" hedef="uzat" uretimler={uretimler} baslik="Kaynak videoyu seç" alt="Seçtiğin video short'un kaynağı olur." onKapat={() => setSecici(false)} onKare={() => {}} onVideo={(u) => { setSecici(false); void kaynakKoy(u.videoUrl!, u.baslik, saltUrl(u.gorselUrl)); }} />}
    </AnimatePresence>
  );

  const govde = ustSekme === "shortlarim" ? shortlarim : gorunum === "sonuc" ? sonuc : ilham;
  if (gorunum === "duzen") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin">
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 sm:px-6">{duzen}</div>
          {modallar}
        </div>
      </MotionConfig>
    );
  }
  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-[calc(100dvh-var(--ust-nav))] space-y-3 overflow-x-hidden bg-zemin px-3 pb-10 pt-3">
          {ust}
          {ustSekme === "olustur" && komut}
          <AnimatePresence mode="wait" initial={false}><motion.div key={ustSekme + gorunum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>{govde}</motion.div></AnimatePresence>
          {modallar}
        </div>
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col overflow-hidden bg-zemin">
        <div className="mx-auto w-full max-w-[1440px] shrink-0 px-6 pt-4">{ust}</div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("mx-auto max-w-[1440px] px-6 pt-4", ustSekme === "olustur" ? "pb-[320px]" : "pb-10")}>
            <AnimatePresence mode="wait" initial={false}><motion.div key={ustSekme + gorunum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>{govde}</motion.div></AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {ustSekme === "olustur" && (
            <motion.div key="komut" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
              <div className="flex justify-center px-6 pb-5 pt-6"><div className="w-full max-w-[1180px]">{komut}</div></div>
            </motion.div>
          )}
        </AnimatePresence>
        {modallar}
      </div>
    </MotionConfig>
  );
}
