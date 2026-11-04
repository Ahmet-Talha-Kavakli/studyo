"use client";

import { useMemo, useRef, useState } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Link2, Upload, Loader2, Check, X, Plus, Sparkles, Film, Image as ImageIcon, Clapperboard, Wand2, Trash2, AlertTriangle, Tag, Megaphone,
  Users, Pencil, Play, LayoutGrid, Clock, Minus, Layers, ShoppingBag, MessageCircle, Download, Package, MapPin, UserPlus,
} from "lucide-react";
import Link from "next/link";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";
import { Tooltip } from "@/components/ui/Tooltip";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { OzelGirdi } from "@/components/film/ortak";
import { useElements } from "@/store/useElements";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { UgcVitrin } from "./UgcVitrin";
import { UgcOnizleme } from "./UgcOnizleme";
import { MarkaKare } from "@/components/studyo/hf";
import { KCip, IzgaraSec } from "@/components/studyo/Cip";
import { Bayrak } from "@/components/ui/Bayrak";
import { Yuzen } from "@/components/ui/Yuzen";
import { Segment } from "@/components/montaj/ui";
import { dosyaYukle } from "@/components/montaj/ortak";
import { AVATARLAR, DILLER } from "@/components/speak/speakVeri";

const ARAC_ADI = "UGC Fabrikası";
const KARE_KREDI = 5;
const EN_COK = 12;
type Format = "kutu" | "inceleme" | "demo" | "sorun" | "grwm" | "oncesonra" | "ozel";
type Mod = "kare" | "video";

const FORMATLAR: { id: Format; ad: string; alt: string; kapak: string; sahne: string; govde: (u: string, f: string) => string }[] = [
  { id: "inceleme", ad: "Dürüst yorum", alt: "Kullandım, anlatıyorum", kapak: "/gercek/paz/paz-inceleme-1.webp", sahne: "giving an honest review while holding the product next to the face, selfie style", govde: (u, f) => `İki haftadır ${u} kullanıyorum ve dürüst olmak gerekirse ${f || "hayatımı kolaylaştırdı"}. Bence denemeye kesinlikle değer.` },
  { id: "kutu", ad: "Kutu açma", alt: "Heyecanlı ilk bakış", kapak: "/gercek/paz/paz-kutu-1.webp", sahne: "excitedly unboxing the product at home, opening the package toward the camera", govde: (u, f) => `${u} sonunda elime ulaştı! Kutusundan çıkarıyorum… ilk izlenimim: ${f || "kalitesi gerçekten çok iyi"}. Kesinlikle beklentimin üstünde.` },
  { id: "demo", ad: "Ürün demosu", alt: "Nasıl çalıştığını göster", kapak: "/gercek/paz/paz-egitim-1.webp", sahne: "demonstrating how to use the product step by step, close-up on hands and product", govde: (u, f) => `${u} nasıl kullanılır, hemen göstereyim: bir, iki, üç… işte bu kadar. ${f || "Sonuç inanılmaz"}.` },
  { id: "sorun", ad: "Sorundan çözüme", alt: "Derdi göster, ürünle çöz", kapak: "/gercek/paz/paz-ezme-1.webp", sahne: "first showing a frustrating everyday problem, then smiling with relief while presenting the product", govde: (u, f) => `Bu sorunu yaşayan tek ben değilim, değil mi? Sonra ${u} ile tanıştım: ${f || "artık dert değil"}. Keşke daha önce bilseydim.` },
  { id: "grwm", ad: "Benimle hazırlan", alt: "Rutinin içinde doğal", kapak: "/gercek/paz/paz-selfie-1.webp", sahne: "getting ready in front of a mirror, naturally using the product as part of the routine", govde: (u, f) => `Benimle hazırlanın! Rutinimin vazgeçilmezi ${u}: ${f || "her sabah kullanıyorum"}.` },
  { id: "oncesonra", ad: "Önce · sonra", alt: "Farkı tek karede göster", kapak: "/gercek/paz/paz-oncesonra-1.webp", sahne: "showing a clear before-and-after comparison with the product in hand", govde: (u, f) => `Önce böyleydi… şimdi bakın! ${u} sayesinde ${f || "fark çok net"}.` },
];

const MEKANLAR = [
  { deger: "yatak", ad: "Yatak odası", en: "sitting on a cozy bed" }, { deger: "mutfak", ad: "Mutfak", en: "in a bright home kitchen" },
  { deger: "banyo", ad: "Banyo", en: "in a clean bathroom with mirror" }, { deger: "araba", ad: "Araba", en: "sitting in a parked car" },
  { deger: "ofis", ad: "Ofis", en: "at a modern office desk" }, { deger: "sokak", ad: "Sokak", en: "walking on a city street" },
  { deger: "spor", ad: "Spor salonu", en: "in a gym" }, { deger: "doga", ad: "Doğa", en: "outdoors in nature" },
  { deger: "cati", ad: "Çatı katı", en: "on a sunny rooftop terrace" },
];
const OZEL_KAPAK = "/gercek/paz/paz-ugc-1.webp";
const KANCA_KUTUPHANE: { ad: string; kapak: string; yaz: (u: string, f: string) => string }[] = [
  { ad: "Durdur", kapak: "/gercek/paz/kanca-kamera.webp", yaz: () => "Kaydırmayı bırak, bunu görmen lazım!" },
  { ad: "Sır", kapak: "/gercek/paz/kanca-mikrofon.webp", yaz: (u) => `Size kimsenin söylemediği bir şey söyleyeceğim: ${u}.` },
  { ad: "Soru", kapak: "/gercek/paz/kanca-roportaj.webp", yaz: () => "Bunu her gün yaşayan başka biri var mı?" },
  { ad: "Şok", kapak: "/gercek/paz/kanca-carpma.webp", yaz: (u) => `${u} için bu kadar para verdiğime inanamıyorum… ama değdi.` },
  { ad: "İtiraf", kapak: "/gercek/paz/kanca-fiyasko.webp", yaz: () => "Yıllarca yanlış yapıyormuşum meğer." },
  { ad: "Liste", kapak: "/gercek/paz/kanca-tipi.webp", yaz: (u) => `${u} hakkında bilmen gereken 3 şey.` },
  { ad: "Sonuç", kapak: "/gercek/paz/kanca-baharat.webp", yaz: (_u, f) => (f ? `${f[0].toLocaleUpperCase("tr")}${f.slice(1)}… evet, gerçekten.` : "Sonuca inanamayacaksın.") },
  { ad: "Kıyas", kapak: "/gercek/paz/kanca-kacis.webp", yaz: (u) => `Pahalı muadilini bırakıp ${u} denedim.` },
];
const CTA_TUR: { metin: string; kisa: string; amac: string; ikon: typeof Link2 }[] = [
  { metin: "Linke tıkla, sen de dene.", kisa: "Linke tıkla", amac: "Trafik · siteye yönlendir", ikon: Link2 },
  { metin: "Şimdi indirimli, kaçırma.", kisa: "İndirim var", amac: "Aciliyet · kampanya", ikon: Tag },
  { metin: "Bio'daki bağlantıdan sipariş ver.", kisa: "Bio'dan al", amac: "Satış · profilden alışveriş", ikon: ShoppingBag },
  { metin: "Yorumlara yaz, sana da önereyim.", kisa: "Yorum yaz", amac: "Etkileşim · yorum topla", ikon: MessageCircle },
];
const CTALAR = CTA_TUR.map((c) => c.metin);
const ORNEK_REKLAMLAR: { kapak: string; format: Format; kanca: string }[] = [
  { kapak: "/gercek/paz/paz-ugc-1.webp", format: "inceleme", kanca: "Bunu her gün yaşayan başka biri var mı?" },
  { kapak: "/gercek/paz/paz-kutu-2.webp", format: "kutu", kanca: "Sonunda geldi, birlikte açalım!" },
  { kapak: "/gercek/paz/paz-selfie-2.webp", format: "grwm", kanca: "Sabah rutinimin gizli kahramanı" },
  { kapak: "/gercek/paz/paz-ugc-2.webp", format: "inceleme", kanca: "Kaydırmayı bırak, bunu görmen lazım!" },
  { kapak: "/gercek/paz/paz-oncesonra-2.webp", format: "oncesonra", kanca: "Önce böyleydi… şimdi bakın!" },
];
/** Konuşan reklam: yalnız sesi açılabilen, sağlayıcısı bağlı modeller (kapanan Veo/Sora listede yok). */
const VIDEO_MODELLER = ([
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Doğal mimik ve el hareketi", rozet: "Önerilen" },
  { deger: "Kling 4.0", ad: "Kling 4.0", alt: "En yeni Kling, 4K", rozet: "Yeni" },
  { deger: "Seedance 2.5", ad: "Seedance 2.5", alt: "Uzun konuşma, 30 sn'ye kadar" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "Sinematik ve akıcı" },
  { deger: "MiniMax H3 Max", ad: "MiniMax H3 Max", alt: "Güçlü hareket, sesli", rozet: "Yeni" },
  { deger: "HappyHorse 1.1", ad: "HappyHorse 1.1", alt: "Canlı ve dinamik" },
  { deger: "Kling 2.6", ad: "Kling 2.6", alt: "Dengeli, sesli" },
  { deger: "Seedance 2.0 Fast", ad: "Seedance 2.0 Fast", alt: "Hızlı ve uygun", rozet: "Hızlı" },
] as { deger: string; ad: string; alt: string; rozet?: string }[]).filter((m) => { const e = videoErisim(m.deger); return e.durum === "gercek" && e.ses === "toggle"; });
/** Senaryonun konuşma süresine en uygun, modelin izin verdiği süre. */
const sureSec = (model: string, konusma: number) => {
  const e = videoErisim(model);
  if (e.durum !== "gercek" || !e.sureler.length) return undefined;
  const hedef = Math.max(5, konusma + 1);
  return e.sureler.find((x) => x >= hedef) ?? e.sureler[e.sureler.length - 1];
};
const ORNEK_URUNLER = [
  { ad: "Işıltı Serum", fayda: "cildim bir haftada aydınlandı", gorsel: "/gercek/paz/urun-serum.webp", alan: "isiltiserum.com" },
  { ad: "Sabah Kahvesi", fayda: "kafede içtiğimden daha lezzetli", gorsel: "/gercek/paz/urun-kahve.webp", alan: "sabahkahvesi.com" },
  { ad: "Finovela", fayda: "her sabah yanımda", gorsel: "/gercek/paz/urun-finovela.webp", alan: "finovela.co" },
];

const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni", "fal"].some((k) => s[k]);
const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const HARF = (i: number) => String.fromCharCode(65 + i);
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;

type Kanca = { id: string; metin: string; acik: boolean };
type Aktor = { id: string; ad: string; gorsel: string; cinsiyet?: string; kendi: boolean };
let sayac = 0; const kId = () => `k${Date.now().toString(36)}${(sayac += 1)}`;

export function UgcStudyo() {
  const masaustu = useMasaustu();
  const sag = useSaglayicilar();
  const elementler = useElements((s) => s.elementler);
  const uretimler = useProjeler((s) => s.uretimler);
  const sonuclar = useMemo(() => uretimler.filter((u) => u.arac === ARAC_ADI), [uretimler]);
  const [format, setFormat] = useState<Format>("inceleme");
  const [urunAd, setUrunAd] = useState("");
  const [fayda, setFayda] = useState("");
  const [urunGorsel, setUrunGorsel] = useState<string | null>(null);
  const [urunUrl, setUrunUrl] = useState("");
  const [urunBilgi, setUrunBilgi] = useState<{ alan?: string; fiyat?: string } | null>(null);
  const [okuyor, setOkuyor] = useState(false);
  const [yukluyor, setYukluyor] = useState(false);
  const [aktorler, setAktorler] = useState<string[]>([AVATARLAR[0].id, AVATARLAR[1].id]);
  const [kancalar, setKancalar] = useState<Kanca[]>([{ id: kId(), metin: "Kaydırmayı bırak, bunu görmen lazım!", acik: true }, { id: kId(), metin: "Bunu her gün yaşayan başka biri var mı?", acik: true }]);
  const [govde, setGovde] = useState("");
  const [govdeElle, setGovdeElle] = useState(false);
  const [cta, setCta] = useState(CTALAR[0]);
  const [mekan, setMekan] = useState("yatak");
  const [ozelFormat, setOzelFormat] = useState("");
  const [ozelMekan, setOzelMekan] = useState("");
  const [model, setModel] = useState(VIDEO_MODELLER[0]?.deger ?? "Kling 3.0");
  const [oran, setOran] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [dil, setDil] = useState("tr");
  const [mod, setMod] = useState<Mod>("kare");
  const [riza, setRiza] = useState(false);
  const [sekme, setSekme] = useState<"pano" | "sonuc">("pano");
  const [secVaryant, setSecVaryant] = useState(0);
  const [cip, setCip] = useState<string | null>(null);
  const [aktorFiltre, setAktorFiltre] = useState<"tumu" | "Kadın" | "Erkek" | "kendi">("tumu");
  const [acik, setAcik] = useState<Uretim | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  const F = format === "ozel"
    ? { id: "ozel" as Format, ad: ozelFormat.trim() || "Özel format", alt: "Kendi tarifin", kapak: OZEL_KAPAK, sahne: ozelFormat.trim(), govde: (u: string, f: string) => `${u} hakkında size dürüstçe anlatayım: ${f || "gerçekten fark yarattı"}. Bence denemeye değer.` }
    : FORMATLAR.find((x) => x.id === format)!;
  const M = mekan === "ozel" ? { deger: "ozel", ad: ozelMekan.trim() || "Özel mekân", en: ozelMekan.trim() } : MEKANLAR.find((x) => x.deger === mekan)!;
  const L = DILLER.find((x) => x.deger === dil) ?? DILLER[0];
  const urun = urunAd.trim() || "bu ürün";
  const govdeMetin = govdeElle ? govde : F.govde(urun, fayda.trim());
  const tumAktorler: Aktor[] = useMemo(() => [
    ...elementler.filter((e) => e.tur === "karakter" && e.gorseller[0] && !e.ornek).map((e) => ({ id: e.id, ad: e.ad, gorsel: e.gorseller[0], kendi: true })),
    ...AVATARLAR.filter((a) => a.cekim === "portre").map((a) => ({ id: a.id, ad: a.ad, gorsel: a.gorsel, cinsiyet: a.cinsiyet, kendi: false })),
  ], [elementler]);
  const seciliAktor = tumAktorler.filter((a) => aktorler.includes(a.id));
  const aktifKanca = kancalar.filter((k) => k.acik && k.metin.trim());
  const varyant = seciliAktor.length * aktifKanca.length;
  const [adetHam, setAdet] = useState(1);
  const enCokAdet = Math.max(1, Math.min(varyant, EN_COK));
  const adet = Math.min(adetHam, enCokAdet);
  const birim = mod === "kare" ? KARE_KREDI : videoKrediHesap(model);
  const kredi = adet * birim;
  const demo = sag !== null && !(mod === "kare" ? GORSEL_HAZIR(sag) : VIDEO_HAZIR(sag));
  const kendiVar = seciliAktor.some((a) => a.kendi);
  const konusma = Math.round(`${aktifKanca[0]?.metin ?? ""} ${govdeMetin} ${cta}`.split(/\s+/).filter(Boolean).length / 2.4);
  const videoSure = sureSec(model, konusma);
  const engel = !urunGorsel ? "Önce ürün ekle: görsel yükle ya da bağlantı ver"
    : !urunAd.trim() ? "Ürün adını yaz"
    : !seciliAktor.length ? "En az bir oyuncu seç"
    : !aktifKanca.length ? "En az bir kanca aç"
    : kendiVar && !riza ? "Kendi karakterin için izin onayını ver" : null;

  const urunOku = async () => {
    if (!urunUrl.trim()) return;
    setOkuyor(true);
    try {
      const r = await fetch("/api/ugc/urun", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urunUrl.trim() }) });
      const j = (await r.json()) as { ok: boolean; ad?: string; aciklama?: string; gorsel?: string; fiyat?: string; alan?: string; hata?: string };
      if (!j.ok) throw new Error(j.hata);
      setUrunAd((j.ad ?? "").split(/[|–-]/)[0].trim().slice(0, 60));
      if (j.aciklama && !fayda) setFayda(j.aciklama.split(/[.!]/)[0].slice(0, 90).toLocaleLowerCase("tr"));
      if (j.gorsel) setUrunGorsel(j.gorsel);
      setUrunBilgi({ alan: j.alan, fiyat: j.fiyat });
      toast.success("Ürün bilgileri alındı", { description: `${j.ad?.slice(0, 50) ?? "Ürün"}${j.gorsel ? "." : ". Görsel bulunamadı, ürün görselini yükle."}` });
    } catch (e) { toast.error("Ürün sayfası okunamadı", { description: e instanceof Error && e.message ? e.message : "Bağlantıyı kontrol et ya da ürün görselini elle yükle." }); }
    finally { setOkuyor(false); }
  };
  const dosyaKoy = async (d: File) => {
    if (!d.type.startsWith("image/")) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    setYukluyor(true);
    try { setUrunGorsel(await dosyaYukle(d, d.type)); if (!urunAd) setUrunAd(d.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 60)); setUrunBilgi(null); mesaj.yuklendi("Ürün görseli"); }
    catch { mesaj.yuklenemedi("Ürün görseli"); } finally { setYukluyor(false); }
  };
  const ornekKoy = (o: (typeof ORNEK_URUNLER)[number]) => { setUrunAd(o.ad); setFayda(o.fayda); setUrunGorsel(o.gorsel); setUrunBilgi({ alan: o.alan }); setCip(null); };
  const kancaYaz = (id: string, p: Partial<Kanca>) => setKancalar((l) => l.map((k) => (k.id === id ? { ...k, ...p } : k)));
  const kancaEkle = (metin: string) => {
    const v = kancalar.find((k) => k.metin === metin); if (v) return kancaYaz(v.id, { acik: true });
    if (kancalar.length >= 6) return void toast.warning("Kanca sınırına ulaşıldı", { description: "En çok 6 kanca ekleyebilirsin. Yenisi için birini kaldır." });
    setKancalar((l) => [...l, { id: kId(), metin, acik: true }]);
  };
  const aktorDegis = (id: string) => setAktorler((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  /* ── Üret ── */
  const uret = (aktorId?: string, kancaId?: string, kare?: Uretim) => {
    if (engel && !kare) return void toast.error("Üretim başlatılamadı", { description: `${engel}.` });
    setMesgul(true);
    const grupId = `ugc_${Date.now().toString(36)}`;
    const aktorL = kare ? [] : seciliAktor.filter((a) => !aktorId || a.id === aktorId);
    const kancaL = kare ? [] : aktifKanca.filter((k) => !kancaId || k.id === kancaId);
    let ok = 0, i = 0;
    const tumIsler: { aktor: Aktor | null; kanca: Kanca | null }[] = kare ? [{ aktor: null, kanca: null }] : aktorL.flatMap((a) => kancaL.map((k) => ({ aktor: a, kanca: k })));
    // Toplu üretimde adet kadar varyant (plan sırasıyla); tek hücre üretiminde yalnız o varyant.
    const isler = !kare && !aktorId && !kancaId ? tumIsler.slice(0, adet) : tumIsler;
    for (const is of isler) {
      const kancaMetin = kare ? kare.meta?.hamIstem ?? "" : is.kanca!.metin.trim();
      const satir = `${kancaMetin} ${govdeMetin} ${cta}`.trim();
      const baslik = kare ? `${kare.baslik.replace(" · kare", "")} · video` : `${urun} · ${is.aktor!.ad} · ${kancaMetin.slice(0, 26)}`;
      const sahne = `Authentic UGC smartphone video, ${F.sahne}, ${M.en}. The person holds and shows the product "${urun}" (keep its exact shape, label and colors from the product reference).`;
      const r = mod === "video" || kare
        ? uretimBaslat({ baslik: baslik.slice(0, 60), tur: "video", model, prompt: `${sahne} Speaking to the camera in ${L.en}${dil === "tr" ? "" : " (translate naturally)"}, saying: "${satir}". Natural lip-sync, handheld feel, vertical social ad.`, kredi: videoKrediHesap(model), arac: ARAC_ADI, meta: { gorselUrl: kare ? saltUrl(kare.gorselUrl) : is.aktor!.gorsel, oran, ...(videoSure ? { sure: `${videoSure}sn` } : {}), ses: "Açık", hamIstem: kancaMetin, grupId, sira: i, urunGorsel: kare?.meta?.urunGorsel ?? kare?.meta?.referanslar?.[0] ?? urunGorsel ?? undefined } })
        : uretimBaslat({ baslik: `${baslik} · kare`.slice(0, 60), tur: "gorsel", model: "Nano Banana Pro", prompt: `${sahne} Photo frame from the video: the same person from the person reference, natural expression, product clearly visible in hand. No text overlays.`, kredi: KARE_KREDI, arac: ARAC_ADI, meta: { oran, hamIstem: kancaMetin, grupId, sira: i, referanslar: [urunGorsel!, is.aktor!.gorsel], demoOrnek: is.aktor!.gorsel, urunGorsel: urunGorsel! } });
      i++;
      if (!r.ok) { uretimHataToast(r); break; }
      ok++;
    }
    setMesgul(false);
    if (!ok) return;
    toast.success(`${ok} ${mod === "video" || kare ? "video" : "kare"} üretiliyor`, { description: demo ? "Bittikçe panoda görünür. Kredi düşmez." : "Bittikçe panoda görünür." });
  };

  /* Panodaki hücre için son üretim (oyuncu + kanca eşleşmesi) */
  const hucreSonuc = (a: Aktor, k: Kanca) => sonuclar.find((u) => u.meta?.hamIstem === k.metin.trim() && (u.meta?.referanslar?.[1] === a.gorsel || u.meta?.gorselUrl === a.gorsel));

  /* ═════════ ÜRÜN ═════════ */
  const ALAN = "block w-full rounded-[12px] bg-white/[0.05] px-3 py-2.5 ring-1 ring-inset ring-white/[0.08] transition focus-within:ring-white/30";
  const ALANK = "block rounded-[14px] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.08] transition focus-within:ring-white/40";
  const urunForm = (
    <div className="space-y-2.5">
      <div className="flex gap-2.5">
        <button onClick={() => dosyaRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void dosyaKoy(f); }}
          aria-label={urunGorsel ? "Ürün görselini değiştir" : "Ürün görseli yükle"}
          className={cn("group relative flex h-[128px] w-[128px] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] transition", urunGorsel ? "bg-white" : "text-metin-2 ring-1 ring-inset ring-white/[0.1] hover:text-metin hover:ring-white/30")}
          style={urunGorsel ? undefined : { background: "radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.09), rgba(255,255,255,0.02))" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urunGorsel ? <motion.img key={urunGorsel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} src={urunGorsel} alt="" className="absolute inset-0 h-full w-full object-cover" />
            : <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105">{yukluyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                <span className="leading-tight"><span className="block text-[12.5px] font-semibold text-metin">Görsel yükle</span><span className="block text-[11px] text-metin-3">ya da sürükle</span></span>
              </>}
          {urunGorsel && <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><Pencil className="h-3.5 w-3.5" />Değiştir</span></span>}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className={ALANK} style={{ background: "rgba(255,255,255,0.045)" }}>
            <span className="flex items-center justify-between text-[11.5px] text-metin-3">Ürün adı{urunBilgi?.alan && <span className="flex items-center gap-1 text-metin-2"><Check className="h-3 w-3 text-emerald-400" />{urunBilgi.alan}</span>}</span>
            <input value={urunAd} onChange={(e) => setUrunAd(e.target.value.slice(0, 60))} placeholder="Işıltı Serum" className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-metin outline-none placeholder:font-normal placeholder:text-metin-3" />
          </label>
          <label className={ALANK} style={{ background: "rgba(255,255,255,0.045)" }}>
            <span className="block text-[11.5px] text-metin-3">Ana fayda</span>
            <input value={fayda} onChange={(e) => setFayda(e.target.value.slice(0, 120))} placeholder="cildim bir haftada aydınlandı" className="mt-0.5 w-full bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-3" />
          </label>
        </div>
      </div>
      <div className="flex h-12 items-center gap-2 rounded-full pl-4 pr-1.5 ring-1 ring-inset ring-white/[0.08] transition focus-within:ring-white/40" style={{ background: "rgba(255,255,255,0.045)" }}>
        <Link2 className="h-4 w-4 shrink-0 text-metin-2" />
        <input value={urunUrl} onChange={(e) => setUrunUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void urunOku(); }} placeholder="Ürün sayfası bağlantısını yapıştır" aria-label="Ürün bağlantısı"
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
        <button onClick={() => void urunOku()} disabled={okuyor || !urunUrl.trim()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">
          {okuyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Oku
        </button>
      </div>
    </div>
  );

  /* ═════════ KOMUT KUTUSU ═════════ */
  const urunCip = (
    <div className="relative min-w-0">
      <button onClick={() => setCip(cip === "urun" ? null : "urun")} aria-expanded={cip === "urun"}
        className={cn("flex h-11 min-w-0 max-w-[240px] items-center gap-2.5 rounded-[14px] p-1 pr-3 text-left ring-1 ring-inset transition-colors", cip === "urun" ? "bg-white/[0.1] ring-white/20" : urunGorsel ? "bg-white/[0.05] ring-white/[0.08] hover:bg-white/[0.08]" : "bg-amber-300/[0.07] ring-amber-300/30 hover:bg-amber-300/[0.1]")}>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]", urunGorsel ? "bg-white" : "bg-white/[0.07] text-metin")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urunGorsel ? <motion.img key={urunGorsel} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={YAY} src={urunGorsel} alt="" className="h-full w-full object-contain" /> : <Plus className="h-4 w-4" />}
        </span>
        <span className="min-w-0 leading-tight"><span className="block truncate text-[13.5px] font-semibold text-metin">{urunGorsel ? urunAd || "Ürün" : "Ürün ekle"}</span><span className="block truncate text-[12px] text-metin-3">{urunGorsel ? fayda || "fayda ekle" : "görsel ya da bağlantı"}</span></span>
      </button>
      <Yuzen acik={cip === "urun"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Ürün" className={cn(POP, "flex max-h-[min(78vh,640px)] flex-col overflow-hidden")} style={{ width: "min(460px, calc(100vw - 24px))" }}>
        <div className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">Ürün</span><span className="text-[11.5px] text-metin-3">Oyuncular bu ürünü eline alıp anlatır</span></div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className="p-3">{urunForm}</div>
          <div className="flex items-center gap-2 border-y border-white/[0.06] px-3.5 py-2"><span className="flex-1 text-[13px] font-semibold text-metin">Örnek ürünle dene</span><span className="text-[11.5px] text-metin-3">Tıkla, hepsi dolsun</span></div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {ORNEK_URUNLER.map((o, k) => {
              const sec = urunGorsel === o.gorsel;
              return (
                <motion.button key={o.ad} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * k }} onClick={() => ornekKoy(o)} aria-pressed={sec}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-white text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span className="absolute inset-x-2 bottom-2 leading-tight"><span className="block truncate text-[13px] font-semibold text-white">{o.ad}</span><span className="block truncate text-[11px] text-white/65">{o.alan}</span></span>
                  <span className={cn("pointer-events-none absolute inset-0 rounded-[14px] ring-inset transition", sec ? "ring-[2.5px] ring-white" : "ring-1 ring-white/10 group-hover:ring-white/40")} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </Yuzen>
    </div>
  );

  const kancaSatiri = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <AnimatePresence initial={false} mode="popLayout">
      {kancalar.map((k, i) => (
        <motion.div key={k.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={YAY} className="relative">
          <button onClick={() => setCip(cip === `k-${k.id}` ? null : `k-${k.id}`)} title={k.metin}
            className={cn("flex h-10 max-w-[340px] items-center gap-2 rounded-full pl-1 pr-3.5 text-[13.5px] ring-1 ring-inset transition-colors max-sm:max-w-[calc(100vw-80px)]", cip === `k-${k.id}` ? "bg-white/[0.12] ring-white/20" : k.acik ? "bg-white/[0.06] ring-white/[0.1] hover:bg-white/[0.09]" : "ring-white/[0.06] opacity-55 hover:opacity-80")}>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors duration-200", k.acik ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}>{HARF(i)}</span>
            <span className={cn("truncate", k.acik ? "text-metin" : "text-metin-2 line-through decoration-white/30")}>{k.metin || "Boş kanca"}</span>
          </button>
          <Yuzen acik={cip === `k-${k.id}`} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket={`Kanca ${HARF(i)}`} className={cn(POP, "overflow-hidden")} style={{ width: "min(360px, calc(100vw - 24px))" }}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[12.5px] font-semibold text-black">{HARF(i)}</span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Kanca {HARF(i)}</span><span className="block text-[11.5px] text-metin-3">Videonun ilk 3 saniyesi</span></span>
            </div>
            <div className="p-3">
            <textarea autoFocus value={k.metin} onChange={(e) => kancaYaz(k.id, { metin: e.target.value.slice(0, 120) })} rows={2} aria-label={`Kanca ${HARF(i)}`}
              className="block w-full resize-none rounded-[12px] bg-white/[0.05] px-3 py-2 text-[14px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />
            <div className="mt-2.5 flex items-center gap-2">
              <button onClick={() => kancaYaz(k.id, { acik: !k.acik })} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.1] hover:text-metin">{k.acik ? "Bu turda kapat" : "Aç"}</button>
              {kancalar.length > 1 && <button onClick={() => { setKancalar((l) => l.filter((x) => x.id !== k.id)); setCip(null); }} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
              <span className="ml-auto text-[12px] tabular-nums text-metin-3">{k.metin.length}/120</span>
            </div>
            </div>
          </Yuzen>
        </motion.div>
      ))}
      </AnimatePresence>
      {kancalar.length < 6 && (
        <motion.div transition={YAY} className="relative">
          <button onClick={() => setCip(cip === "kanca-ekle" ? null : "kanca-ekle")} aria-expanded={cip === "kanca-ekle"} className={cn("flex h-10 items-center gap-2 rounded-full bg-white/[0.06] pl-1 pr-3.5 text-[13.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.1] hover:text-metin", cip === "kanca-ekle" && "bg-white/[0.12] text-metin")}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]"><Plus className="h-4 w-4" /></span>Kanca ekle</button>
          <Yuzen acik={cip === "kanca-ekle"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Kanca ekle" className={cn(POP, "flex max-h-[min(70vh,560px)] flex-col overflow-hidden")} style={{ width: "min(400px, calc(100vw - 24px))" }}>
            <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08]"><Megaphone className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Kanca ekle</span><span className="block text-[11.5px] text-metin-3">Her kanca ayrı bir reklam varyantı olur</span></span>
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-metin-2">{kancalar.length}/6</span>
            </div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 [scrollbar-width:thin]">
              <button onClick={() => { setKancalar((l) => [...l, { id: kId(), metin: "", acik: true }]); setCip(null); }} className="flex w-full items-center gap-3 rounded-[12px] p-2 text-left hover:bg-white/[0.05]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin-2"><Pencil className="h-4 w-4" /></span>
                <span><span className="block text-[13.5px] font-medium text-metin">Kendin yaz</span><span className="block text-[12px] text-metin-3">Boş kanca ekle, tıklayıp düzenle</span></span>
              </button>
              {KANCA_KUTUPHANE.map((s) => {
                const m = s.yaz(urun, fayda.trim()), var_ = kancalar.some((k) => k.metin === m);
                return (
                  <button key={s.ad} onClick={() => { kancaEkle(m); setCip(null); }} aria-pressed={var_} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", var_ ? "bg-white/[0.06] ring-white/50" : "ring-transparent hover:bg-white/[0.05]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.kapak} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{s.ad}</span><span className="block truncate text-[12px] text-metin-3">{m}</span></span>
                    {var_ && <span className="shrink-0 rounded-full bg-white/[0.1] px-2 py-0.5 text-[11px] font-medium text-metin">Planda</span>}
                  </button>
                );
              })}
            </div>
          </Yuzen>
        </motion.div>
      )}
    </div>
  );

  const aktorListe = tumAktorler.filter((a) => aktorFiltre === "tumu" || (aktorFiltre === "kendi" ? a.kendi : a.cinsiyet === aktorFiltre));
  const cipler = (
    <>
      <KCip buyuk okGizli etiket="Reklam formatı" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={F.kapak} alt="" className="h-full w-full object-cover" />} deger={F.ad} acik={cip === "format"} setAcik={cipAc("format")} genislik={440}>
        <OzelGirdi deger={ozelFormat} set={setOzelFormat} secili={format === "ozel"} ph="Ör. iki arkadaş ürünü karşılaştırıyor" alt="Listede yoksa reklamın sahnesini tarif et" uygula={() => { setFormat("ozel"); setGovdeElle(false); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{FORMATLAR.map((x) => <IzgaraSec key={x.id} sec={format === x.id} ad={x.ad} alt={x.alt} kapak={x.kapak} oran="aspect-[3/4]" onClick={() => { setFormat(x.id); setGovdeElle(false); setCip(null); }} />)}</div>
      </KCip>
      <KCip buyuk okGizli etiket="Oyuncular" ikon={<Users className="h-4 w-4" />} deger={
        <span className="flex items-center gap-2">
          <span className="flex -space-x-2">{seciliAktor.slice(0, 3).map((a) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={a.id} src={a.gorsel} alt="" className="h-5 w-5 rounded-full object-cover object-top ring-2 ring-[#2a2b2f]" />)}</span>
          {seciliAktor.length ? `${seciliAktor.length} oyuncu` : "Oyuncu seç"}
        </span>} acik={cip === "aktor"} setAcik={cipAc("aktor")} genislik={520} vurgu={!seciliAktor.length}>
        <div className="space-y-2.5 p-1">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 sm:max-w-[300px]"><Segment etiket="Filtre" deger={aktorFiltre} onDegis={setAktorFiltre} secenekler={[["tumu", "Tümü"], ["Kadın", "Kadın"], ["Erkek", "Erkek"], ...(tumAktorler.some((a) => a.kendi) ? [["kendi", "Benim"] as const] : [])]} /></div>
            <span className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[12.5px] font-medium tabular-nums text-metin">
              <span className="flex -space-x-2">{seciliAktor.slice(0, 3).map((a) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={a.id} src={a.gorsel} alt="" className="h-6 w-6 rounded-full object-cover object-top ring-2 ring-[#1b1c1f]" />)}</span>{seciliAktor.length} seçili
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 max-sm:grid-cols-4">
            <Link href="/panel/karakter/yeni" className="group flex aspect-[3/4] min-w-0 flex-col items-center justify-center gap-2 rounded-[12px] bg-white/[0.03] px-2 text-center ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.07] hover:ring-white/30">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] transition-transform group-hover:scale-105"><UserPlus className="h-4 w-4" /></span>
              <span className="text-[12px] font-semibold leading-tight text-metin">Kendi<br />karakterin</span>
            </Link>
            {aktorListe.map((a) => {
              const s = aktorler.includes(a.id), no = seciliAktor.findIndex((x) => x.id === a.id) + 1;
              return (
                <button key={a.id} onClick={() => aktorDegis(a.id)} aria-pressed={s} title={a.ad} className="group relative block aspect-[3/4] min-w-0 overflow-hidden rounded-[12px] bg-black text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", s ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/35")} />
                  <AnimatePresence>{s && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY} className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{no}</motion.span>}</AnimatePresence>
                  {a.kendi && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 text-[10.5px] font-medium text-white backdrop-blur">Benim</span>}
                  <span className={cn("absolute inset-x-1.5 bottom-1.5 truncate text-[12px] font-semibold", s ? "text-white" : "text-white/80")}>{a.ad}</span>
                </button>
              );
            })}
          </div>
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Mekân" ikon={mekan === "ozel" ? <MapPin className="h-4 w-4" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/gercek/paz/ortam-${mekan}.webp`} alt="" className="h-full w-full object-cover" />} deger={M.ad} acik={cip === "mekan"} setAcik={cipAc("mekan")} genislik={440}>
        <OzelGirdi deger={ozelMekan} set={setOzelMekan} secili={mekan === "ozel"} ph="Ör. kalabalık bir kafede pencere kenarı" uygula={() => { setMekan("ozel"); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{MEKANLAR.map((m) => <IzgaraSec key={m.deger} sec={mekan === m.deger} ad={m.ad} kapak={`/gercek/paz/ortam-${m.deger}.webp`} onClick={() => { setMekan(m.deger); setCip(null); }} />)}</div>
      </KCip>
      <KCip buyuk okGizli etiket="Kapanış çağrısı" ikon={<Megaphone className="h-4 w-4" />} deger={CTA_TUR.find((x) => x.metin === cta)?.kisa ?? (cta ? (cta.length > 16 ? `${cta.slice(0, 15).trim()}…` : cta) : "Yok")} acik={cip === "cta"} setAcik={cipAc("cta")} genislik={380}>
        <div className="space-y-2 p-0.5">
          <div className="space-y-1">
            {CTA_TUR.map((c) => {
              const sec = cta === c.metin;
              return (
                <button key={c.metin} onClick={() => { setCta(c.metin); setCip(null); }} aria-pressed={sec} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/40" : "ring-transparent hover:bg-white/[0.05]")}>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.07] text-metin-2")}><c.ikon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{c.metin}</span><span className="block text-[12px] text-metin-3">{c.amac}</span></span>
                </button>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <p className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">Kendi çağrın</p>
            <div className="space-y-1.5 p-2">
              <label className={cn("flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 ring-1 ring-inset transition focus-within:ring-white/30", !CTALAR.includes(cta) && cta ? "ring-white/40" : "ring-white/[0.08]")}>
                <Pencil className="h-4 w-4 shrink-0 text-metin-2" />
                <input value={CTALAR.includes(cta) ? "" : cta} onChange={(e) => setCta(e.target.value.slice(0, 80))} placeholder="Örneğin: Kodu yorumlara bıraktım" aria-label="Kapanış çağrısı"
                  className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
              </label>
              <button onClick={() => { setCta(""); setCip(null); }} aria-pressed={!cta} className={cn("flex h-10 w-full items-center gap-2.5 rounded-[12px] px-3 text-left text-[13px] ring-1 ring-inset transition-colors", !cta ? "bg-white/[0.08] text-metin ring-white/40" : "text-metin-2 ring-transparent hover:bg-white/[0.05] hover:text-metin")}><X className="h-4 w-4 shrink-0" />Kapanış çağrısı olmasın</button>
            </div>
          </div>
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Video modeli" ikon={<MarkaKare ad={model} boyut={26} />} deger={model} acik={cip === "model"} setAcik={cipAc("model")} genislik={520}
        sag={<span className="text-[11.5px] text-metin-3">Hepsi sesli konuşur</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-0.5">
          {VIDEO_MODELLER.map((m, k) => {
            const sec = model === m.deger, sn = sureSec(m.deger, konusma);
            return (
              <motion.button key={m.deger} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.025 * k }} whileTap={{ scale: 0.98 }}
                onClick={() => { setModel(m.deger); setCip(null); }} aria-pressed={sec}
                className={cn("flex flex-col gap-2 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/70" : "bg-white/[0.025] ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/20")}>
                <span className="flex items-center gap-2">
                  <MarkaKare ad={m.deger} boyut={30} />
                  {sn && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium tabular-nums text-metin-2">{sn} sn</span>}
                  <span className={cn("ml-auto flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.06] text-metin-2")}><KrediYildiz className="h-3 w-3" />{videoKrediHesap(m.deger)}</span>
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">{m.ad}</span>{m.rozet && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-metin-2">{m.rozet}</span>}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{m.alt}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Format ve dil" ikon={<Bayrak b={L.bayrak} boyut={18} />} deger={`${oran} · ${L.ad}`} acik={cip === "dil"} setAcik={cipAc("dil")} genislik={420}>
        <div className="mb-2 overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}><p className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">En-boy oranı</p><div className="p-2"><Segment etiket="Oran" deger={oran} onDegis={setOran} secenekler={[["9:16", "9:16"], ["1:1", "1:1"], ["16:9", "16:9"]]} /></div></div>
        <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}><p className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">Konuşma dili</p><div className="p-1.5">
        <div className="grid grid-cols-2 gap-1.5">
        {DILLER.map((d) => {
          const sec = dil === d.deger;
          return (
            <button key={d.deger} onClick={() => { setDil(d.deger); setCip(null); }} aria-pressed={sec} className={cn("flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/40" : "ring-white/[0.05] hover:bg-white/[0.05]")}>
              <Bayrak b={d.bayrak} boyut={22} /><span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-medium text-metin">{d.ad}</span><span className="block truncate text-[11.5px] text-metin-3">{d.aksan}</span></span>
            </button>
          );
        })}
        </div>
        </div></div>
      </KCip>
    </>
  );

  const urunYok = !urunGorsel;
  const hapMetin = engel && !urunYok ? engel : null;
  const durumHap = hapMetin && <span title={hapMetin} className="max-w-[300px] truncate rounded-full bg-amber-300/[0.08] px-2.5 py-1 text-[11.5px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden">{hapMetin}</span>;
  const komut = (
    <div className="pointer-events-auto w-full min-w-0">
          <div role="radiogroup" aria-label="Üretim şekli" className="cam-istemci isolate mb-2 inline-grid grid-cols-2 gap-0.5 rounded-full p-1 max-sm:grid max-sm:w-full">
            {([["kare", "Önce kare", ImageIcon, `Her varyantın karesini gör, beğendiğini videoya çevir`], ["video", "Doğrudan video", Film, "Doğrudan konuşan video"]] as const).map(([id, ad, I, ip]) => (
              <button key={id} role="radio" aria-checked={mod === id} onClick={() => setMod(id)} title={ip}
                className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors", mod === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {mod === id && <motion.span layoutId="ugc-mod" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                <I className="h-3.5 w-3.5" />{ad}
              </button>
            ))}
          </div>
    <div className="cam-istemci relative w-full min-w-0 rounded-[26px] p-3">
      <div className="flex items-start gap-2 max-sm:flex-col">
        {urunCip}
        <span className="mt-2.5 h-6 w-px shrink-0 bg-white/[0.08] max-sm:hidden" />
        <div className="min-w-0 flex-1 pt-1">{kancaSatiri}</div>
      </div>
      <div className="relative mt-1.5">
        <textarea value={govdeMetin} onChange={(e) => { setGovdeElle(true); setGovde(e.target.value.slice(0, 400)); }} rows={2} aria-label="Senaryo gövdesi"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}
          className="block max-h-[110px] min-h-[52px] w-full resize-none bg-transparent px-2 py-1 pr-20 max-sm:max-h-[170px] text-[16px] leading-relaxed sm:pr-[300px] text-metin outline-none [field-sizing:content] [scrollbar-width:thin]" />
        <span className="absolute right-1 top-1 flex items-center gap-1.5">
          {durumHap}
          {govdeElle && <button onClick={() => setGovdeElle(false)} title="Formata göre yeniden yaz" className="flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-metin"><Wand2 className="h-3.5 w-3.5" />Formata göre</button>}
          <span title="Kanca + gövde + çağrı, tahmini konuşma" className={cn("flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-medium tabular-nums", konusma > 8 ? "bg-amber-300/10 text-amber-200" : "text-metin-3")}><Clock className="h-3.5 w-3.5" />{konusma} sn</span>
        </span>
      </div>
      {kendiVar && (
        <div onClick={() => setRiza((v) => !v)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRiza((v) => !v); } }} role="checkbox" aria-checked={riza} tabIndex={0}
          className={cn("mt-1.5 flex w-full cursor-pointer items-start gap-2.5 rounded-[12px] px-3 py-2.5 text-left outline-none ring-1 ring-inset transition-colors focus-visible:ring-white/50", riza ? "bg-white/[0.04] ring-white/60" : "bg-amber-300/[0.06] ring-amber-300/25")}>
          <span className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ring-1 ring-inset transition-colors", riza ? "bg-white text-black ring-white" : "ring-white/30")}>{riza && <Check className="h-3 w-3" strokeWidth={3} />}</span>
          <span className="text-[12.5px] leading-snug text-metin-2">
            <Link href="/kimlik-kosullari" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="font-semibold text-metin underline decoration-white/30 underline-offset-[3px] transition-colors hover:decoration-white">Kimlik ve Benzerlik Kullanım Koşulları</Link>&apos;nı okudum, onaylıyorum ve kabul ediyorum; kendi karakterlerimdeki gerçek kişilerin rızası var ve reklamı yapay zekâ içeriği olarak etiketleyeceğim.
          </span>
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.08] pt-2.5 max-sm:grid max-sm:grid-cols-2 [&>*]:shrink-0 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">
        {cipler}
        <div className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] pl-1.5 pr-1.5 text-[13.5px] text-metin">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white/85"><Layers className="h-4 w-4" /></span>
          <span className="flex flex-col items-start pl-1 pr-1.5 leading-tight"><span className="text-[11px] text-white/55">Adet</span><span className="whitespace-nowrap font-medium tabular-nums">{adet} / {varyant || 0}</span></span>
          <button onClick={() => setAdet(Math.max(1, adet - 1))} disabled={adet <= 1} aria-label="Azalt" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
          <button onClick={() => setAdet(Math.min(enCokAdet, adet + 1))} disabled={adet >= enCokAdet} aria-label="Artır" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => (urunYok ? setCip("urun") : uret())} disabled={mesgul} title={engel ?? "Ctrl+Enter"} className="group ml-auto flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black max-sm:col-span-2 max-sm:w-full">
          {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />}<span>Üret</span>
          {!demo && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kredi}</span>}
        </motion.button>
      </div>
    </div>
    </div>
  );

  /* ═════════ PANO ═════════ */
  const YELPAZE = [ORNEK_REKLAMLAR[2], ORNEK_REKLAMLAR[1], ORNEK_REKLAMLAR[0], ORNEK_REKLAMLAR[3], ORNEK_REKLAMLAR[4]];
  const hero = (
    <section className="flex flex-col items-center px-4 pb-2 pt-3 text-center">
      <div className={cn("relative mx-auto", masaustu ? "h-[270px] w-[700px]" : "h-[214px] w-full max-w-[360px]")}>
        {YELPAZE.map((o, i) => {
          const dd = i - 2;
          const ol = masaustu ? { w: 150, h: 240, ara: 116, dy: 14 } : { w: 104, h: 172, ara: 62, dy: 11 };
          return (
            <motion.div key={o.kapak} initial={{ opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(dd) * ol.dy, rotate: dd * 7 }}
              transition={{ type: "spring", stiffness: 170, damping: 20, delay: i * 0.05 }}
              className="absolute left-1/2 top-0 overflow-hidden rounded-[20px] bg-black ring-1 ring-white/15"
              style={{ width: ol.w, height: ol.h, marginLeft: -ol.w / 2 + dd * ol.ara, zIndex: 5 - Math.abs(dd) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.kapak} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/20" />
              <span className={cn("absolute left-2.5 top-2.5 flex items-center justify-center rounded-full bg-white font-semibold text-black", masaustu ? "h-6 w-6 text-[12px]" : "h-5 w-5 text-[10.5px]")}>{HARF(i)}</span>
              <span className={cn("absolute inset-x-2.5 bottom-2.5 text-left font-bold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]", masaustu ? "text-[13px]" : "line-clamp-2 text-[10.5px]")}>{o.kanca}</span>
            </motion.div>
          );
        })}
        <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/3 items-center gap-1.5 rounded-full bg-[#0b0b0c] p-1">
          <button onClick={() => dosyaRef.current?.click()} aria-label="Ürün görseli yükle"
            className={cn("flex items-center justify-center rounded-full bg-[#1b1c1f] text-metin-2 ring-2 ring-white/25 transition hover:text-metin active:scale-95", masaustu ? "h-16 w-16" : "h-14 w-14")}>
            {yukluyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
          <button onClick={() => setCip("aktor")} aria-label="Oyuncuları seç" className={cn("relative flex items-center justify-center rounded-full ring-2 ring-white transition-transform active:scale-95", masaustu ? "h-16 w-16" : "h-14 w-14")}>
            <span className="flex -space-x-4">{seciliAktor.slice(0, 2).map((a) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={a.id} src={a.gorsel} alt="" className={cn("rounded-full object-cover object-top ring-2 ring-[#0b0b0c]", masaustu ? "h-14 w-14" : "h-12 w-12")} />)}</span>
          </button>
        </div>
      </div>
      <h1 className={cn("mt-12 font-semibold leading-none tracking-[-0.035em] text-metin", masaustu ? "text-[44px]" : "text-[30px]")}>Ürününü oyuncular anlatsın</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-metin-2">İçerik üreticisi gibi görünen oyuncular ürününü eline alıp anlatır. Her oyuncu ve kanca birleşimi ayrı bir reklam olur.</p>
      <div className="mt-6 flex flex-wrap items-stretch justify-center gap-2">
        {([
          [1, "Ürün", "Fotoğraf yükle", false, () => dosyaRef.current?.click(), Upload],
          [2, "Oyuncular", `${seciliAktor.length} oyuncu`, true, () => setCip("aktor"), Users],
          [3, "Kancalar", `${aktifKanca.length} kanca`, true, () => setCip("kanca-ekle"), Megaphone],
        ] as const).map(([n, e, dg, tamam, f, I], k) => (
          <motion.button key={e} onClick={f} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.05 }}
            className={cn("flex items-center gap-3 rounded-[16px] py-2 pl-2 pr-4 text-left ring-1 ring-inset transition-[background-color,box-shadow] active:scale-[0.98]", !tamam ? "bg-white text-[#0a0a0b] ring-white" : "bg-white/[0.04] ring-white/[0.08] hover:bg-white/[0.08]")}>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", !tamam ? "bg-black/10" : "bg-white/[0.08] text-metin")}><I className="h-4 w-4" /></span>
            <span className="leading-tight"><span className={cn("block text-[11.5px]", !tamam ? "text-black/55" : "text-metin-3")}>{n}. {e}</span><span className={cn("block max-w-[180px] truncate text-[14px] font-semibold", !tamam ? "text-[#0a0a0b]" : "text-metin")}>{dg}</span></span>
          </motion.button>
        ))}
        <motion.button onClick={() => setCip("urun")} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-3 rounded-[16px] py-2 pl-2 pr-4 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] active:scale-[0.98]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-metin"><Link2 className="h-4 w-4" /></span>
          <span className="leading-tight"><span className="block text-[11.5px] text-metin-3">Ya da</span><span className="block text-[14px] font-semibold text-metin">Bağlantıdan ekle</span></span>
        </motion.button>
      </div>
    </section>
  );
  const baslangic = (
    <div className="space-y-4">
      {hero}
      <Kart ikon={Wand2} baslik="Örnek ürünle başla" alt="Tıkla; ürün, fayda ve görsel kutuya yerleşsin" sag={<SayiRozet n={ORNEK_URUNLER.length} />}>
        <div className="grid gap-2.5 p-3.5 sm:grid-cols-3">{ORNEK_URUNLER.map((o, n) => <OrnekUrun key={o.ad} o={o} sira={n} onClick={() => ornekKoy(o)} />)}</div>
      </Kart>
      <Kart ikon={Clapperboard} baslik="Reklam formatı" alt="Senaryonun gövdesi ve sahnesi formata göre yazılır" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium text-metin-2">{F.ad}</span>}>
        <div className="grid grid-cols-3 gap-3 p-3.5 lg:grid-cols-6">
          {FORMATLAR.map((x, n) => {
            const sec = format === x.id;
            return (
              <motion.button key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.04 }} onClick={() => { setFormat(x.id); setGovdeElle(false); }} aria-pressed={sec} className="group min-w-0 text-left">
                <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[16px] bg-black ring-1 ring-inset transition duration-300 group-hover:-translate-y-0.5", sec ? "ring-2 ring-white" : "ring-white/[0.08] group-hover:ring-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
                <span className={cn("mt-1.5 block truncate text-[13.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{x.ad}</span>
                <span className="block truncate text-[12px] text-metin-3">{x.alt}</span>
              </motion.button>
            );
          })}
        </div>
      </Kart>
    </div>
  );

  /* Varyant planı: solda yapışkan önizleme; sağda tek kurulum kartı (oyuncular | kancalar) ve genişliği dolduran reklam ızgarası */
  const varyantlar = seciliAktor.flatMap((a) => aktifKanca.map((k) => ({ a, k })));
  const secV = Math.min(secVaryant, Math.max(0, varyantlar.length - 1));
  const sutun = Math.max(2, Math.min(varyantlar.length, masaustu ? 4 : 2));
  const kurulum = (
    <section className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:divide-x md:divide-white/[0.06] max-md:divide-y max-md:divide-white/[0.06]">
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center gap-2"><Users className="h-4 w-4 text-metin-2" /><span className="flex-1 text-[13.5px] font-semibold text-metin">Oyuncular</span><span className="text-[12px] tabular-nums text-metin-3">{seciliAktor.length}</span></div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {seciliAktor.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="group/a relative w-[64px] text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.gorsel} alt="" className="h-16 w-16 rounded-full object-cover object-top ring-2 ring-white/15" />
                  <span className="mt-1 block truncate text-[12px] font-medium text-metin-2">{a.ad}</span>
                  <button onClick={() => aktorDegis(a.id)} aria-label={`${a.ad} çıkar`} className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2b2f] text-metin ring-2 ring-[#151618] opacity-0 transition group-hover/a:opacity-100 hover:bg-[#3a3b40] [@media(hover:none)]:opacity-100"><X className="h-3 w-3" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button onClick={() => setCip("aktor")} className="group/e w-[64px] text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/20 text-metin-2 transition group-hover/e:border-white/45 group-hover/e:text-metin"><Plus className="h-5 w-5" /></span>
              <span className="mt-1 block text-[12px] font-medium text-metin-3">Ekle</span>
            </button>
          </div>
        </div>
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center gap-2"><Megaphone className="h-4 w-4 text-metin-2" /><span className="flex-1 text-[13.5px] font-semibold text-metin">Kancalar</span><span className="text-[12px] tabular-nums text-metin-3">ilk 3 saniye</span></div>
          <div className="space-y-1.5">
            {aktifKanca.map((k) => (
              <button key={k.id} onClick={() => setCip(`k-${k.id}`)} className="group/k flex h-11 w-full items-center gap-2.5 rounded-[12px] pl-1.5 pr-3 text-left transition-colors hover:bg-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12.5px] font-semibold text-black">{HARF(kancalar.indexOf(k))}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-metin">{k.metin}</span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 opacity-0 transition-opacity group-hover/k:opacity-100" />
              </button>
            ))}
            {kancalar.length < 6 && <button onClick={() => setCip("kanca-ekle")} className="flex h-11 w-full items-center gap-2.5 rounded-[12px] border border-dashed border-white/15 pl-1.5 pr-3 text-[13px] font-medium text-metin-2 transition hover:border-white/35 hover:text-metin"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]"><Plus className="h-4 w-4" /></span>Kanca ekle</button>}
          </div>
        </div>
      </div>
    </section>
  );
  const V0 = varyantlar[secV];
  const onizleme = (
    <section className="overflow-hidden rounded-[20px] p-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <UgcOnizleme dikey secili={secV} onSecili={setSecVaryant}
        varyantlar={varyantlar.map(({ a: ak, k }) => ({ anahtar: ak.id + k.id, aktorId: ak.id, kancaId: k.id, aktorAd: ak.ad, aktorGorsel: ak.gorsel, harf: HARF(kancalar.indexOf(k)), kanca: k.metin }))}
        urun={urunGorsel ?? ""} govde={govdeMetin} cta={cta} mekanAd={M.ad} oran={oran}
        birim={birim} kapali={mesgul || !!engel} onUret={(a, k) => uret(a, k)} uretAd={mod === "kare" ? "Bu kareyi üret" : "Bu videoyu üret"} />
    </section>
  );

  const pano = urunYok ? baslangic : (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setCip("urun")} className="flex h-12 items-center gap-2.5 rounded-full bg-white/[0.08] pl-1.5 pr-4 transition hover:bg-white/[0.13]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urunGorsel!} alt="" className="h-9 w-9 rounded-full bg-white object-cover" />
          <span className="text-left leading-tight"><span className="block text-[11px] text-white/55">Ürün</span><span className="block max-w-[200px] truncate text-[13.5px] font-medium text-metin">{urunAd || "Ürün"}</span></span>
        </button>
        <span className="flex h-12 items-center gap-2.5 rounded-full bg-white/[0.08] pl-1.5 pr-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.1] text-white/85"><LayoutGrid className="h-4 w-4" /></span>
          <span className="leading-tight"><span className="block text-[11px] text-white/55">Plan</span><span className="block text-[13.5px] font-medium tabular-nums text-metin">{seciliAktor.length} oyuncu × {aktifKanca.length} kanca = {varyant} reklam</span></span>
        </span>
        {V0 && <span className="ml-auto flex h-12 items-center gap-2.5 rounded-full bg-white/[0.08] pl-1.5 pr-4 max-sm:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V0.a.gorsel} alt="" className="h-9 w-9 rounded-full object-cover object-top" />
          <span className="leading-tight"><span className="block text-[11px] text-white/55">Önizlemede</span><span className="block text-[13.5px] font-medium text-metin">{V0.a.ad} · Kanca {HARF(kancalar.indexOf(V0.k))}</span></span>
        </span>}
      </div>
      {varyantlar.length ? (
        <div className="grid items-start gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-2">{onizleme}</div>
          <div className="min-w-0 space-y-3">
            {kurulum}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${sutun}, minmax(0, 1fr))` }}>
              {varyantlar.map(({ a, k }, i) => (
                <Hucre key={a.id + k.id} a={a} k={k} harf={HARF(kancalar.indexOf(k))} sira={i} urunGorsel={urunGorsel!} birim={birim} mod={mod} mesgul={mesgul || !!engel}
                  u={hucreSonuc(a, k)} secili={i === secV} onSec={() => setSecVaryant(i)} onUret={() => uret(a.id, k.id)} onAc={setAcik} />
              ))}
            </div>
          </div>
        </div>
      ) : kurulum}
    </div>
  );

  /* ═════════ REKLAMLARIM ═════════ */
  const gruplar = useMemo(() => {
    const m = new Map<string, Uretim[]>();
    for (const u of sonuclar) { const g = u.meta?.grupId ?? u.id; m.set(g, [...(m.get(g) ?? []), u]); }
    return [...m.values()].map((l) => l.sort((a, b) => (a.meta?.sira ?? 0) - (b.meta?.sira ?? 0)));
  }, [sonuclar]);
  const calisan = sonuclar.filter((u) => u.durum !== "tamam" && u.durum !== "hata").length;
  const hatali = sonuclar.filter((u) => u.durum === "hata");
  const reklamlar = gruplar.length ? (
    <div className="space-y-4">
      {hatali.length > 0 && <button onClick={() => { const { sil } = useProjeler.getState(); for (const u of hatali) sil(u.id); }} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />{hatali.length} başarısızı temizle</button>}
      {gruplar.map((g, i) => <Grup key={g[0].meta?.grupId ?? g[0].id} sira={i} g={g} model={model} onAc={setAcik} onVideo={(u) => uret(undefined, undefined, u)} />)}
    </div>
  ) : (
    <Kart ikon={Film} baslik="Henüz reklam yok" alt="Varyant planından üret; kareler ve videolar burada ürün ürün gruplanır"
      sag={<span className="flex gap-2">{urunYok && <button onClick={() => { ornekKoy(ORNEK_URUNLER[0]); setSekme("pano"); }} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Wand2 className="h-4 w-4" /><span className="max-sm:hidden">Örnek ürünle dene</span></button>}<button onClick={() => setSekme("pano")} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><LayoutGrid className="h-4 w-4" />Varyant planı</button></span>}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-2.5 max-sm:px-4">
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">Böyle reklamlar üretirsin</span>
        <span className="text-[12px] text-metin-3 max-sm:hidden">Tıkla; formatı ve kancası plana eklensin</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {ORNEK_REKLAMLAR.map((o, n) => (
          <motion.button key={o.kapak} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.04 }} onClick={() => { setFormat(o.format); setGovdeElle(false); kancaEkle(o.kanca); setSekme("pano"); toast.success("Format ve kanca plana eklendi"); }} className="group min-w-0 text-left">
            <span className="relative block aspect-[9/16] overflow-hidden rounded-[16px] bg-black ring-1 ring-inset ring-white/[0.08] transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[50%_60%] transition-transform duration-500 group-hover:scale-105" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-medium text-white backdrop-blur">{FORMATLAR.find((f) => f.id === o.format)?.ad}</span>
              <p className="absolute inset-x-2.5 bottom-2.5 line-clamp-3 text-[13px] font-semibold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{o.kanca}</p>
              <span className="absolute inset-x-2 bottom-2 flex h-9 translate-y-[150%] items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black transition-transform duration-300 group-hover:translate-y-0 [@media(hover:none)]:hidden"><Plus className="h-3.5 w-3.5" />Plana ekle</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Kart>
  );

  const ust = (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white"><Megaphone className="h-5 w-5" /></span>
      <span className="min-w-0 max-sm:hidden"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">UGC reklam stüdyosu</span><span className="block truncate text-[12.5px] text-white/50">Ürününü gerçek gibi görünen içerik üreticilerine anlattır</span></span>
      <span className="flex-1" />
      <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08] max-sm:w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        {([["pano", "Varyant planı", LayoutGrid, urunYok ? 0 : varyant], ["sonuc", "Reklamlarım", Film, sonuclar.length]] as const).map(([id, ad, I, n]) => (
          <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13.5px] font-medium transition-colors max-sm:flex-1 max-sm:px-2", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {sekme === id && <motion.span layoutId="ugc-sekme" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-4 w-4 max-sm:hidden" />{ad}
            {id === "sonuc" && calisan > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  const modal = <AnimatePresence>{acik && <UretimGoruntuleyici key="d" u={sonuclar.find((x) => x.id === acik.id) ?? acik} liste={sonuclar.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = sonuclar.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}</AnimatePresence>;
  const dosyaGirdi = <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaKoy(d); }} />;

  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
      <div className="min-h-[calc(100dvh-var(--ust-nav))] space-y-4 overflow-x-hidden bg-zemin px-3 pb-8 pt-4">
        {ust}
        {sekme === "pano" && !urunYok && <div>{komut}</div>}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sekme} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>{sekme === "pano" ? pano : reklamlar}</motion.div>
        </AnimatePresence>
        {sekme === "pano" && urunYok && <div>{komut}</div>}
        {dosyaGirdi}
        {modal}
      </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col bg-zemin">
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="mx-auto max-w-[1440px] px-6 pb-[340px] pt-4">
          {ust}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={sekme} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mt-4">{sekme === "pano" ? pano : reklamlar}</motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-5 pt-6">
        <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...YAY, delay: 0.05 }} className="w-full max-w-[1260px]">{komut}</motion.div>
      </div>
      {dosyaGirdi}
      {modal}
    </div>
    </MotionConfig>
  );
}

/* ─────────── Parçalar ─────────── */

function OrnekUrun({ o, onClick, sira = 0 }: { o: (typeof ORNEK_URUNLER)[number]; onClick: () => void; sira?: number }) {
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sira * 0.05 }} onClick={onClick}
      className="group flex w-full min-w-0 items-center gap-3 rounded-[18px] bg-white/[0.03] p-2 pr-3 text-left ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05] hover:ring-white/[0.22] active:scale-[0.99]">
      <span className="relative block h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[13px] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={o.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-semibold text-metin">{o.ad}</span>
        <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-metin-3">&ldquo;{o.fayda}&rdquo;</span>
        <span className="mt-2 inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-metin-2">{o.alan}</span>
      </span>
      <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-medium text-metin transition group-hover:bg-white group-hover:text-black"><Plus className="h-3.5 w-3.5" />Kullan</span>
    </motion.button>
  );
}

/** Başlık şeritli kart: kartsız yüzen başlık yok. */
function Kart({ ikon: I, baslik, alt, sag, children }: { ikon: typeof Film; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5 max-sm:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{baslik}</span>{alt && <span className="block text-[12.5px] text-metin-3">{alt}</span>}</span>
        {sag && <div className="shrink-0 max-sm:w-full">{sag}</div>}
      </div>
      {children}
    </section>
  );
}
const SayiRozet = ({ n }: { n: number }) => <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{n}</span>;

/** Reklam kartının ortak görünümü: 9:16, kanca altyazısı, ürün rozeti (demo/plan). */
function ReklamKart({ kapak, urun, harf, kanca, ad, ust, soluk, secili, sira = 0, children }: { kapak: string; urun?: string; harf?: string; kanca: string; ad?: string; ust?: React.ReactNode; soluk?: boolean; secili?: boolean; sira?: number; children?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ ...YAY, delay: Math.min(sira, 8) * 0.04 }} whileHover={{ y: -3 }}
      className="group relative aspect-[9/16] overflow-hidden rounded-[14px] bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]", soluk && "opacity-40 blur-[2px]")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {urun && <img src={urun} alt="" className="absolute bottom-[30%] right-2 h-[20%] w-[38%] rounded-[10px] bg-white object-cover ring-2 ring-white/80" />}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
      {harf && <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[12px] font-semibold text-black">{harf}</span>}
      <AnimatePresence>{ust && <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={YAY} className="absolute right-2 top-2 flex origin-top-right gap-1">{ust}</motion.span>}</AnimatePresence>
      <p className="absolute inset-x-2.5 bottom-2.5 leading-snug [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {ad && <span className="mb-0.5 block truncate text-[11.5px] font-semibold text-white/70">{ad}</span>}
        <span className="line-clamp-3 text-[13px] font-semibold text-white">{kanca}</span>
      </p>
      {children}
      <span className={cn("pointer-events-none absolute inset-0 rounded-[14px] ring-inset transition-[box-shadow]", secili ? "ring-[2.5px] ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")} />
    </motion.div>
  );
}
const Rozet = ({ tur }: { tur: string; demo?: boolean }) => (
  <span className="flex h-[22px] items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white backdrop-blur">{tur === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{tur === "video" ? "Video" : "Kare"}</span>
);

/** Tablo hücresi: bir oyuncu + bir kanca = bir reklam kartı (üretildiyse sonuç). */
function Hucre({ a, k, harf, sira, urunGorsel, birim, mod, mesgul, u, secili, onSec, onUret, onAc }: {
  a: Aktor; k: Kanca; harf: string; sira: number; urunGorsel: string; birim: number; mod: Mod; mesgul: boolean;
  u: Uretim | undefined; secili?: boolean; onSec?: () => void; onUret: () => void; onAc: (u: Uretim) => void;
}) {
  const bitti = u?.durum === "tamam", calisiyor = !!u && !bitti && u.durum !== "hata";
  const kapak = u && bitti && u.gercek !== false ? saltUrl(u.gorselUrl) ?? a.gorsel : a.gorsel;
  return (
    <div role="button" tabIndex={0} onClick={onSec} onKeyDown={(e) => { if (e.key === "Enter") onSec?.(); }} className="cursor-pointer outline-none">
      <ReklamKart sira={sira} kapak={kapak} urun={!u || u.gercek === false ? urunGorsel : undefined} harf={harf} kanca={k.metin} ad={a.ad} soluk={calisiyor} secili={secili}
        ust={u && bitti ? <Rozet tur={u.tur} /> : u?.durum === "hata" ? <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-rose-200"><AlertTriangle className="h-3 w-3" />Başarısız</span> : undefined}>
        {calisiyor && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium text-white"><Loader2 className="h-5 w-5 animate-spin" />%{Math.round(u!.ilerleme ?? 0)}</span>}
        {u && bitti ? (
          <button onClick={(e) => { e.stopPropagation(); onAc(u); }} aria-label="Büyük izle" className="absolute left-1/2 top-[38%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-[#0b0c0e] opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            <Play className="h-4 w-4 translate-x-px fill-current" />
          </button>
        ) : !calisiyor && (
          <button onClick={(e) => { e.stopPropagation(); onUret(); }} disabled={mesgul} className="absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-[#0b0c0e] opacity-0 transition-opacity group-hover:opacity-100 disabled:hidden [@media(hover:none)]:opacity-100">
            {mod === "kare" ? <ImageIcon className="h-3.5 w-3.5" /> : <Clapperboard className="h-3.5 w-3.5" />}Üret<span className="flex items-center gap-0.5 rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums"><KrediYildiz className="h-2.5 w-2.5" />{birim}</span>
          </button>
        )}
      </ReklamKart>
    </div>
  );
}

/** Grup başlığında etiket + değer hapı (komut kutusu seçicileriyle aynı dil). */
function BilgiHap({ ikon, et, v }: { ikon: React.ReactNode; et: string; v: string }) {
  return (
    <span className="flex h-11 items-center gap-2.5 rounded-full bg-white/[0.08] pl-1.5 pr-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-white/85">{ikon}</span>
      <span className="leading-tight"><span className="block text-[11px] text-white/55">{et}</span><span className="block whitespace-nowrap text-[13.5px] font-medium tabular-nums text-metin">{v}</span></span>
    </span>
  );
}

/** Reklamlarım: bir üretim turu (aynı ürün, aynı anda gönderilen varyantlar). */
function Grup({ g, sira, model, onAc, onVideo }: { g: Uretim[]; sira: number; model: string; onAc: (u: Uretim) => void; onVideo: (u: Uretim) => void }) {
  const [urunAd] = g[0].baslik.split(" · ");
  const urunG = g.map((u) => u.meta?.urunGorsel ?? u.meta?.referanslar?.[0]).find(Boolean) ?? ORNEK_URUNLER.find((o) => o.ad === g[0].baslik.split(" · ")[0])?.gorsel;
  const hazir = g.filter((u) => u.durum === "tamam").length, video = g[0].tur === "video";
  const indir = () => {
    let n = 0;
    for (const u of g.filter((x) => x.durum === "tamam")) {
      const url = video ? u.videoUrl : saltUrl(u.gorselUrl); if (!url) continue;
      const a = document.createElement("a"); a.href = url; a.download = `${u.baslik.replace(/[\\/:*?"<>|]+/g, "-")}.${video ? "mp4" : "png"}`; a.click();
      n++;
    }
    if (n) toast.success(n > 1 ? `${n} dosya indiriliyor` : video ? "Video indiriliyor" : "Görsel indiriliyor", { description: "Dosyalar indirilenler klasörüne kaydedilir." });
    else mesaj.indirilemedi("İndirilecek hazır dosya yok.");
  };
  const oyuncu = new Set(g.map((u) => u.baslik.split(" · ")[1])).size, kanca = new Set(g.map((u) => u.meta?.hamIstem)).size;
  const tarih = new Date(g[0].olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: Math.min(sira, 5) * 0.06 }} className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10", urunG ? "bg-white" : "bg-white/[0.06]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urunG ? <img src={urunG} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[15px] font-semibold text-metin">{urunAd}</span>
          <span className="block text-[12px] tabular-nums text-metin-3">{tarih}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 max-sm:order-last max-sm:w-full">
          <BilgiHap ikon={video ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />} et="Çıktı" v={`${g.length} ${video ? "video" : "kare"}`} />
          <BilgiHap ikon={<Users className="h-4 w-4" />} et="Plan" v={`${oyuncu} oyuncu × ${kanca} kanca`} />
          <BilgiHap ikon={<MarkaKare ad={g[0].model} boyut={22} />} et="Model" v={g[0].model} />
          {hazir < g.length && <BilgiHap ikon={<Loader2 className="h-4 w-4 animate-spin" />} et="Durum" v={`${hazir}/${g.length} hazır`} />}
          {!video && hazir > 0 && (
            <Tooltip side="top" label="Beğendiğin karenin üzerine gel, Videoya çevir'e bas">
              <span><BilgiHap ikon={<Clapperboard className="h-4 w-4" />} et="Sonraki adım" v="Videoya çevir" /></span>
            </Tooltip>
          )}
        </span>
        {hazir > 0 && (
          <Tooltip side="top" label={hazir > 1 ? "Tümünü indir" : "İndir"}>
            <button onClick={indir} aria-label="İndir" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-metin transition hover:bg-white/[0.14] active:scale-95"><Download className="h-4 w-4" /></button>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {g.map((u, i) => <SonucKart key={u.id} sira={i} u={u} model={model} onAc={() => onAc(u)} onVideo={() => onVideo(u)} />)}
      </div>
    </motion.section>
  );
}

function SonucKart({ u, sira, model, onAc, onVideo }: { u: Uretim; sira: number; model: string; onAc: () => void; onVideo: () => void }) {
  const bitti = u.durum === "tamam", demoU = u.gercek === false;
  const aktorG = u.tur === "gorsel" ? u.meta?.referanslar?.[1] : u.meta?.gorselUrl, urunG = u.meta?.urunGorsel ?? (u.tur === "gorsel" ? u.meta?.referanslar?.[0] : undefined);
  const kapak = ((demoU || !bitti) && aktorG ? aktorG : saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl) ?? "";
  const aktorAd = u.baslik.split(" · ")[1];
  return (
    <div className="min-w-0">
      <ReklamKart sira={sira} kapak={kapak} urun={demoU && bitti ? urunG : undefined} kanca={u.meta?.hamIstem ?? u.baslik} ad={aktorAd} soluk={!bitti}
        ust={bitti ? <Rozet tur={u.tur} demo={demoU} /> : undefined}>
        {bitti && u.tur === "video" && u.videoUrl && <video src={u.videoUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
        {!bitti && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium text-white">{u.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}{u.durum === "hata" ? "Başarısız" : `%${Math.round(u.ilerleme ?? 0)}`}</span>}
        {bitti && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={onAc} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-[#0b0c0e] transition active:scale-95"><Play className="h-3.5 w-3.5 fill-current" />Büyük izle</button>
            {u.tur === "gorsel" && <button onClick={onVideo} title={`Bu kareyi ${model} ile videoya çevir`} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.16] px-4 text-[12.5px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-xl transition hover:bg-white/[0.24] active:scale-95"><Film className="h-3.5 w-3.5" />Videoya çevir<span className="flex items-center gap-0.5 rounded-full bg-black/25 px-1.5 text-[11.5px] tabular-nums"><KrediYildiz className="h-2.5 w-2.5" />{videoKrediHesap(model)}</span></button>}
          </div>
        )}
      </ReklamKart>
    </div>
  );
}
