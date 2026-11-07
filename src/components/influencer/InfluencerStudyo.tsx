"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import {
  Plus, Sparkles, Loader2, MapPin, Shirt, PersonStanding, Sun, Film, Image as ImageIcon, Heart, UserRound, Layers, Images, Download, Copy, Trash2, MoreHorizontal, Star,
  IdCard, LayoutGrid, Smartphone, ScanFace, Feather, Scale, Lock, Clock, Play, AlertTriangle, Wand2, Upload, LayoutTemplate, ArrowRight, Pencil,
} from "lucide-react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { KCip } from "@/components/studyo/Cip";
import { Segment } from "@/components/montaj/ui";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { bostakiAd } from "@/lib/elementCekirdek";
import { useAuth } from "@/store/useAuth";
import { useElements, goreliZamanKisa } from "@/store/useElements";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useInfluencer, type Influencer } from "@/store/useInfluencer";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { MarkaKare } from "@/components/studyo/hf";
import { OzelGirdi } from "@/components/film/ortak";
import { videoErisim } from "@/lib/videoSaglayici";
import { Yuzen } from "@/components/ui/Yuzen";
import { PlatformLogo } from "./ortak";
import { urlIndir } from "@/lib/gercekEylem";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi, FavoriRozeti, KartDahaMenusu, eylemDugmesi } from "@/components/galeri/KartEylemleri";
import { Sihirbaz, type Yol } from "./Sihirbaz";
import { KimlikKarti } from "./KimlikKarti";
import { Profil } from "./Profil";
import {
  ARAC_ADI, SAHNELER, SAHNE_KAT, KIYAFETLER, POZLAR, ISIKLAR, HAREKETLER, FOTO_MODELLER, VIDEO_MODELLER, PLATFORMLAR, NISLER, TONLAR, SABLONLAR,
  sahneIstemi, karakterTarifi, type SahneKat, type PlatformId, type Sadakat,
} from "./veri";

type Mod = "foto" | "video";
type Sekme = "galeri" | "profil" | "kimlik";
type Kurulum = { sahneler: string[]; kiyafet: string; poz: string; isik: string; platform: PlatformId; ek: string };

const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni"].some((k) => s[k]);
const MAKS_SAHNE = 4;
const DUZEN_KREDI = 5;
/** Satır kartı: sabit yükseklik (--kh), genişlik orana göre; farklı oranlı kareler aynı hizada durur. */
const kartBoyut = (o?: string): React.CSSProperties => { const [w, h] = (o ?? "4:5").split(":").map(Number); return { height: "var(--kh)", width: `calc(var(--kh) * ${(w || 4) / (h || 5)})` }; };
const grupOnek = (id: string) => `inf:${id}:`;
const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;
/** Kart yüzeyi (saydam beyaz; temalar bg-white sınıflarını yeniden eşleyebildiği için satır içi). */
const YUZ = { background: "rgba(255,255,255,0.025)" };
/** Galeri kartının opak zemini: komut kutusunun arkasındaki geçiş aynı renge erir. */
const ALAN = "color-mix(in srgb, white 2.5%, var(--color-zemin))";
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const MSATIR = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin transition-colors hover:bg-white/[0.075]";

export function InfluencerStudyo() {
  const masaustu = useMasaustu();
  const [genis, setGenis] = useState(false);
  useEffect(() => { const m = window.matchMedia("(min-width: 1280px)"); const f = () => setGenis(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  const sag = useSaglayicilar();
  const karakterler = useInfluencer((s) => s.karakterler);
  const aktifId = useInfluencer((s) => s.aktifId);
  const onizleme = useInfluencer((s) => s.onizleme);
  const { sec, guncelle, sil, ekle, onizlemeYaz } = useInfluencer.getState();
  const uretimler = useProjeler((s) => s.uretimler);
  const bakiye = useAuth((s) => s.kullanici?.krediler);
  const aktif = karakterler.find((k) => k.id === aktifId) ?? karakterler[0] ?? null;

  const [mod, setMod] = useState<Mod>("foto");
  const [kat, setKat] = useState<SahneKat | "tum">("tum");
  const [tumSahne, setTumSahne] = useState(false);
  const [sahneler, setSahneler] = useState<string[]>(["kafe"]);
  const [kiyafet, setKiyafet] = useState("imza");
  const [poz, setPoz] = useState("selfie");
  const [isik, setIsik] = useState("dogal");
  const [ozel, setOzel] = useState({ sahne: "", kiyafet: "", poz: "", isik: "", hareket: "" });
  const [ek, setEk] = useState("");
  const [fotoModel, setFotoModel] = useState("Nano Banana Pro");
  const [adet, setAdet] = useState<1 | 2 | 4>(2);
  const [sadakat, setSadakat] = useState<Sadakat>("dengeli");
  const [videoModel, setVideoModel] = useState("Kling 3.0");
  const [hareket, setHareket] = useState("ugc-handheld");
  const [sure, setSure] = useState<string>("5sn");
  useEffect(() => { const e = videoErisim(videoModel); if (e.durum === "gercek" && e.sureler.length && !e.sureler.includes(parseInt(sure))) setSure(`${e.sureler.includes(5) ? 5 : e.sureler[0]}sn`); }, [videoModel]); // eslint-disable-line react-hooks/exhaustive-deps
  const [kaynakKare, setKaynakKare] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformId>("ig-post");
  const [sekme, setSekme] = useState<Sekme>("galeri");
  const [mobil, setMobil] = useState<"uret" | Sekme>("uret");
  const [filtre, setFiltre] = useState<"tum" | "foto" | "video" | "favori">("tum");
  const [sihirbaz, setSihirbaz] = useState<{ duzenle?: Influencer; yol?: Yol; sablon?: number } | null>(null);
  const [cip, setCip] = useState<string | null>(null);
  const [acik, setAcik] = useState<Uretim | null>(null);

  const sonuclar = useMemo(() => (aktif ? uretimler.filter((u) => u.arac === ARAC_ADI && u.meta?.grupId?.startsWith(grupOnek(aktif.id))) : []), [uretimler, aktif]);
  const sayilar = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of uretimler) { const g = u.meta?.grupId; if (u.arac === ARAC_ADI && g?.startsWith("inf:")) { const id = g.split(":")[1]; m[id] = (m[id] ?? 0) + 1; } }
    return m;
  }, [uretimler]);
  const filtreli = sonuclar.filter((u) => filtre === "tum" || (filtre === "favori" ? u.favori : filtre === "video" ? u.tur === "video" : u.tur !== "video"));
  const [gor] = useGorunum("influencer");
  const gruplar = useMemo(() => {
    const m = new Map<string, Uretim[]>();
    for (const u of filtreli) { const g = u.meta?.grupId ?? u.id; m.set(g, [...(m.get(g) ?? []), u]); }
    const enYeni = (l: Uretim[]) => Math.max(...l.map((x) => x.olusturma));
    return [...m.values()].map((l) => l.sort((a, b) => (a.meta?.sira ?? 0) - (b.meta?.sira ?? 0))).sort((a, b) => (gor.siralama === "eski" ? 1 : -1) * (enYeni(a) - enYeni(b)));
  }, [filtreli, gor.siralama]);
  /* Görünüm ayarı: kart yüksekliği (boyut) ve oran (yerleşim). */
  const kartYuk = gor.boyut === "kucuk" ? (masaustu ? 220 : 170) : gor.boyut === "buyuk" ? (masaustu ? 440 : 300) : gor.boyut === "ozel" ? 140 + gor.sutun * 40 : (masaustu ? 320 : 230);
  const kartOlc = (o?: string) => kartBoyut(gor.yerlesim === "yatay" ? "16:9" : gor.yerlesim === "dikey" ? "3:4" : o);
  const hazirFotolar = sonuclar.filter((u) => u.tur !== "video" && u.durum === "tamam");
  const suren = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;

  const P = PLATFORMLAR.find((p) => p.id === platform)!;
  const fotoBirim = FOTO_MODELLER.find((m) => m.deger === fotoModel)?.kredi ?? 5;
  const videoBirim = videoKrediHesap(videoModel);
  const toplam = mod === "foto" ? sahneler.length * adet * fotoBirim : videoBirim;
  const demo = sag !== null && !(mod === "foto" ? GORSEL_HAZIR(sag) : VIDEO_HAZIR(sag));
  const engel = !aktif ? "Önce bir karakter oluştur" : mod === "foto" && !sahneler.length ? "En az bir sahne seç" : null;
  /* Video başlangıç kareleri: portre + biten fotoğraflar (seçim kimlikle tutulur; demo karelerde görünen plan önizlemesidir). */
  const kareler = aktif ? [{ id: "portre", url: aktif.portre, gor: aktif.portre }, ...hazirFotolar.map((u) => { const url = saltUrl(u.gorselUrl) ?? aktif.portre; return { id: u.id, url, gor: u.gercek === false ? onizleme[u.id] ?? url : url }; })] : [];
  const kaynak = kareler.find((x) => x.id === kaynakKare) ?? kareler[1] ?? kareler[0];

  /** Element silinmişse istem @Ad yerine görselleri doğrudan referans olarak gönderir. */
  const kimlik = (k: Influencer) => {
    const var_ = !!k.elementId && useElements.getState().elementler.some((e) => e.id === k.elementId);
    return { k: var_ ? k : { ...k, elementAd: undefined }, referanslar: var_ ? undefined : [k.portre, ...k.referanslar].slice(0, 4) };
  };
  const demoGorsel = (u: Uretim) => {
    const d = u.gercek === false;
    return d ? onizleme[u.id] ?? u.meta?.gorselUrl : undefined;
  };

  /* ═════════ Üretim ═════════ */
  const uret = (o?: Partial<Kurulum> & { mod?: Mod }) => {
    if (!aktif) return void setSihirbaz({});
    const m = o?.mod ?? mod;
    const kur: Kurulum = { sahneler, kiyafet, poz, isik, platform, ek, ...o };
    const Pl = PLATFORMLAR.find((p) => p.id === kur.platform)!;
    const { k, referanslar } = kimlik(aktif);
    const grupId = `${grupOnek(aktif.id)}${Date.now().toString(36)}`;
    let ok = 0, sira = 0;
    if (m === "foto") {
      if (!kur.sahneler.length) return void toast.error("Sahne seçilmedi", { description: "Fotoğraf üretmek için en az bir sahne seç." });
      const oz = (t: "kiyafet" | "poz" | "isik") => ({ id: "ozel", ad: ozel[t].trim(), kapak: "", en: ozel[t].trim() });
      const Ki = kur.kiyafet === "ozel" ? oz("kiyafet") : KIYAFETLER.find((x) => x.id === kur.kiyafet), Po = kur.poz === "ozel" ? oz("poz") : POZLAR.find((x) => x.id === kur.poz), Is = kur.isik === "ozel" ? oz("isik") : ISIKLAR.find((x) => x.id === kur.isik);
      dis: for (const sid of kur.sahneler) {
        const S = sid === "ozel" ? { id: "ozel", ad: ozel.sahne.trim() || "Özel sahne", kapak: aktif.portre, en: ozel.sahne.trim(), kat: "yasam" as const } : SAHNELER.find((x) => x.id === sid)!;
        for (let i = 0; i < adet; i++) {
          const r = uretimBaslat({
            baslik: `${aktif.ad} · ${S.ad}`.slice(0, 60), tur: "gorsel", model: fotoModel, kredi: fotoBirim, arac: ARAC_ADI,
            prompt: sahneIstemi(k, { sahne: S, kiyafet: Ki, poz: Po, isik: Is, ek: kur.ek }),
            meta: { oran: Pl.oran, grupId, sira: sira++, demoOrnek: S.kapak, hamIstem: [S.ad, Ki?.ad, Po?.ad, Is?.ad].filter(Boolean).join(" · "), sadakat, ...(referanslar ? { referanslar } : {}) },
          });
          if (!r.ok || !r.id) { uretimHataToast(r); break dis; }
          onizlemeYaz(r.id, S.kapak); ok++;
        }
      }
    } else {
      const H = hareket === "ozel" ? { id: "ozel", ad: ozel.hareket.trim() || "Özel hareket", kapak: "", en: ozel.hareket.trim(), video: "" } : HAREKETLER.find((x) => x.id === hareket)!;
      const r = uretimBaslat({
        baslik: `${aktif.ad} · ${H.ad}`.slice(0, 60), tur: "video", model: videoModel, kredi: videoBirim, arac: ARAC_ADI,
        prompt: `${sahneIstemi(k, { ek: kur.ek, video: true })}. Motion: ${H.en}. Keep the same face and outfit as the start frame.`,
        meta: { oran: Pl.oran, sure, gorselUrl: kaynak?.url ?? aktif.portre, hareket: H.id, grupId, sira: 0, hamIstem: `${H.ad} · ${sure.replace("sn", " sn")}` },
      });
      if (!r.ok || !r.id) uretimHataToast(r); else { onizlemeYaz(r.id, kaynak?.gor ?? aktif.portre); ok++; }
    }
    if (!ok) return;
    setSekme("galeri"); setFiltre("tum");
    if (!masaustu) setMobil("galeri");
    toast.success(`${ok} ${m === "foto" ? "fotoğraf" : "video"} üretiliyor`, { description: demo ? "Ücretsiz önizleme." : `${aktif.ad} · ${Pl.ad}` });
  };

  const videoyaCevir = (u: Uretim) => {
    setKaynakKare(u.id);
    setMod("video");
    if (!masaustu) setMobil("uret");
    toast("Kaynak kare seçildi", { description: "Bir hareket seç ve videoyu üret." });
  };
  const portreYap = (u: Uretim) => {
    if (!aktif) return;
    const g = saltUrl(u.gorselUrl);
    if (!g || u.gercek === false) return void toast.error("Portre uygulanamadı", { description: "Bu bir örnek çıktı. Sağlayıcı bağlandığında gerçek sonuçlarla çalışır." });
    const refler = [aktif.portre, ...aktif.referanslar.filter((r) => r !== g)].slice(0, 12);
    guncelle(aktif.id, { portre: g, ornek: false, referanslar: refler });
    if (aktif.elementId) useElements.getState().guncelle(aktif.elementId, { gorseller: [g, ...refler].slice(0, 8) });
    toast.success("Kimlik portresi güncellendi");
  };
  const referansYap = (u: Uretim) => {
    if (!aktif) return;
    const g = saltUrl(u.gorselUrl);
    if (!g || u.gercek === false) return void toast.error("Referans eklenemedi", { description: "Bu bir örnek çıktı. Sağlayıcı bağlandığında gerçek sonuçlarla çalışır." });
    if (aktif.referanslar.includes(g)) return void toast.info("Zaten referans setinde", { description: "Bu görsel referans setinde var." });
    const refler = [...aktif.referanslar, g].slice(-12);
    guncelle(aktif.id, { referanslar: refler });
    if (aktif.elementId) useElements.getState().guncelle(aktif.elementId, { gorseller: [aktif.portre, ...refler].slice(0, 8) });
    toast.success("Referans setine eklendi", { description: "Sonraki üretimlerde yüz daha tutarlı kalır." });
  };
  const tekCumle = (metin: string) => {
    if (!aktif) return;
    const { k, referanslar } = kimlik(aktif);
    const r = uretimBaslat({
      baslik: `${aktif.ad} · düzenleme`, tur: "gorsel", model: "Nano Banana Pro", kredi: DUZEN_KREDI, arac: ARAC_ADI,
      prompt: `Edit the identity portrait of ${k.elementAd ? `@${k.elementAd}` : "the person in the reference"} (${karakterTarifi(aktif.ozellikler)}). Change only this: ${metin}. Keep everything else identical: face, expression, framing, background.`,
      meta: { oran: "4:5", grupId: `${grupOnek(aktif.id)}d${Date.now().toString(36)}`, sira: 0, hamIstem: `Düzenleme: ${metin}`, sadakat: "siki", ...(referanslar ? { referanslar } : {}) },
    });
    if (!r.ok || !r.id) return uretimHataToast(r);
    onizlemeYaz(r.id, aktif.portre);
    setSekme("galeri"); if (!masaustu) setMobil("galeri");
    toast.success("Düzenleme üretiliyor", { description: metin });
  };
  const aciSeti = () => {
    if (!aktif) return;
    const { k, referanslar } = kimlik(aktif);
    const grupId = `${grupOnek(aktif.id)}a${Date.now().toString(36)}`;
    const acilar = [["Önden", "front view, facing the camera"], ["Üç çeyrek", "three-quarter view turned slightly left"], ["Profil", "side profile view"], ["Tam boy", "full-body view standing"]] as const;
    let ok = 0;
    for (const [i, [ad, en]] of acilar.entries()) {
      const r = uretimBaslat({
        baslik: `${aktif.ad} · açı · ${ad}`, tur: "gorsel", model: "Nano Banana Pro", kredi: DUZEN_KREDI, arac: ARAC_ADI,
        prompt: `Character reference sheet photo of ${k.elementAd ? `@${k.elementAd}` : "the person in the reference"} (${karakterTarifi(aktif.ozellikler)}), ${en}, neutral light grey studio background, even soft light, same face and hair, wearing their signature outfit.`,
        meta: { oran: i === 3 ? "9:16" : "4:5", grupId, sira: i, hamIstem: `Açı seti · ${ad}`, sadakat: "siki", ...(referanslar ? { referanslar } : {}) },
      });
      if (!r.ok || !r.id) { uretimHataToast(r); break; }
      onizlemeYaz(r.id, aktif.portre); ok++;
    }
    if (ok) { setSekme("galeri"); if (!masaustu) setMobil("galeri"); toast.success("Açı seti üretiliyor", { description: "Beğendiklerini referans setine ekle." }); }
  };
  const cogalt = (k: Influencer) => {
    const els = useElements.getState();
    const ad = bostakiAd(k.ad, karakterler.map((x) => x.ad));
    const elAd = bostakiAd(ad, els.elementler.map((e) => e.ad));
    const r = els.ekle({ ad: elAd, tur: "karakter", aciklama: karakterTarifi(k.ozellikler), gorseller: [k.portre, ...k.referanslar].slice(0, 8), ...(k.ornek ? { ornek: true } : {}) });
    const { id: _id, olusturma: _o, ...geri } = k;
    void _id; void _o;
    ekle({ ...geri, ad, elementId: r.id, elementAd: r.id ? elAd : undefined });
    toast.success(`${ad} oluşturuldu`, { description: "Kopyayı düzenleyip yeni bir karakter türet." });
  };
  const karakterSil = (k: Influencer) => {
    if (!window.confirm(`${k.ad} silinsin mi? Üretimler kitaplıkta kalır.`)) return;
    if (k.elementId) useElements.getState().sil(k.elementId);
    sil(k.id);
    mesaj.silindi(k.ad);
  };

  /* ═════════ Arayüz (A · Stüdyo: karakter rafı + galeri + yüzen komut kutusu) ═════════ */
  const cipAc = (k: string) => (v: boolean) => setCip(v ? k : null);
  const sahneTikla = (id: string) => setSahneler((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= MAKS_SAHNE ? (toast.warning("Sahne sınırına ulaşıldı", { description: `En çok ${MAKS_SAHNE} sahne seçebilirsin. Yenisini eklemek için birini kaldır.` }), l) : [...l, id]));
  const nisAd = (id?: string) => NISLER.find((n) => n.id === id)?.ad;
  const tonAd = (id?: string) => TONLAR.find((n) => n.id === id)?.ad;
  const img = (src?: string) => (src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" className="h-full w-full object-cover" /> : null);

  /* ── Karakter rafı ── */
  const raf = (yatay: boolean) => (
    <LayoutGroup id="inf-raf">
      {karakterler.map((k, i) => {
        const s = k.id === aktif?.id;
        return (
          <motion.button key={k.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...YAY, delay: Math.min(i, 8) * 0.03 }}
            onClick={() => { sec(k.id); setKaynakKare(null); }} title={`${k.ad} · @${k.kullaniciAdi}`} aria-pressed={s}
            className={cn("group flex shrink-0 items-center", yatay ? "gap-2 rounded-full py-1 pl-1 pr-3 transition-colors" : "w-full flex-col gap-1.5", yatay && s && "bg-white/[0.085]", yatay && !s && "hover:bg-white/[0.055]")}>
            <span className={cn("relative block overflow-hidden rounded-full transition duration-200", yatay ? "h-9 w-9" : "h-[64px] w-[64px]", s ? "" : "opacity-60 group-hover:opacity-100")}>
              {img(k.portre)}
              {s && <motion.span layoutId="raf-secili" transition={YAY} className="absolute inset-0 rounded-full outline outline-[2.5px] -outline-offset-[2.5px] outline-white" />}
            </span>
            <span className={cn("max-w-[110px] truncate transition-colors", yatay ? "text-[13.5px]" : "text-[11px]", s ? "font-medium text-metin" : "text-metin-3 group-hover:text-metin-2", yatay && !s && "max-[1100px]:hidden")}>{k.ad}</span>
          </motion.button>
        );
      })}
      <motion.button whileTap={{ scale: 0.94 }} onClick={() => setSihirbaz({})} title="Yeni karakter" aria-label="Yeni karakter"
        className={cn("group flex shrink-0 items-center", yatay ? "h-10 gap-1.5 rounded-full bg-white/[0.085] pl-1 pr-3.5 text-[13px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12] hover:text-metin max-[1100px]:pr-1" : "w-full flex-col gap-1.5")}>
        <span className={cn("flex items-center justify-center rounded-full", yatay ? "h-8 w-8 bg-white/[0.1]" : "h-[64px] w-[64px] bg-white/[0.085] text-metin-2 ring-1 ring-inset ring-white/[0.1] transition group-hover:bg-white/[0.12] group-hover:text-metin")}><Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" /></span>
        <span className={cn(yatay ? "max-[1100px]:hidden" : "text-[11px] text-metin-3")}>{yatay ? "Yeni karakter" : "Yeni"}</span>
      </motion.button>
    </LayoutGroup>
  );

  /* ── Başlık ── */
  const sekmeler = ([["galeri", "Galeri", LayoutGrid, sonuclar.length], ["profil", "Profil", Smartphone, 0], ["kimlik", "Kimlik kartı", IdCard, 0]] as const);
  const menuDugme = aktif && (
    <div className="relative">
      <button onClick={() => setCip(cip === "menu" ? null : "menu")} aria-label="Karakter menüsü" aria-expanded={cip === "menu"} className={cn("flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset transition active:scale-90", cip === "menu" ? "bg-white/[0.1] text-metin ring-white/20" : "text-metin-2 ring-white/[0.08] hover:text-metin")}><MoreHorizontal className="h-4 w-4" /></button>
      <Yuzen acik={cip === "menu"} onKapat={() => setCip(null)} yerlesim="alt-sag" bosluk={8} etiket="Karakter" className={cn(POP, "w-[240px] p-1.5")}>
        {([[Pencil, "Düzenle", () => setSihirbaz({ duzenle: aktif })], [Copy, "Çoğalt", () => cogalt(aktif)], [Plus, "Yeni karakter", () => setSihirbaz({})], [Upload, "Fotoğraflardan oluştur", () => setSihirbaz({ yol: "foto" })]] as const).map(([I, a, f]) => (
          <button key={a} onClick={() => { setCip(null); f(); }} className={MSATIR}><I className="h-4 w-4 text-metin-2" />{a}</button>
        ))}
        <div className="my-1 h-px bg-white/[0.085]" />
        <button onClick={() => { setCip(null); karakterSil(aktif); }} className={cn(MSATIR, "text-rose-300 hover:bg-rose-400/10")}><Trash2 className="h-4 w-4" />Sil</button>
      </Yuzen>
    </div>
  );
  const baslik = aktif && (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 max-sm:px-3">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={aktif.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={YAY} className="block h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">{img(aktif.portre)}</motion.span>
      </AnimatePresence>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5 truncate"><span className="text-[16px] font-semibold tracking-[-0.01em] text-metin">{aktif.ad}</span><span className="truncate text-[13px] text-metin-3">@{aktif.kullaniciAdi}</span></p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-metin-3">
          {nisAd(aktif.nis) && <span>{nisAd(aktif.nis)}</span>}{tonAd(aktif.ton) && <><span className="h-0.5 w-0.5 rounded-full bg-current" /><span>{tonAd(aktif.ton)} ton</span></>}
          {aktif.elementAd && <><span className="h-0.5 w-0.5 rounded-full bg-current" /><button onClick={() => void mesaj.kopyala(`@${aktif.elementAd}`, "Element adı")} title="Diğer stüdyolarda istemine yaz" className="rounded-full px-1.5 text-metin-2 ring-1 ring-inset ring-white/[0.1] transition hover:text-metin hover:ring-white/25">@{aktif.elementAd}</button></>}
        </p>
      </div>
      <div role="tablist" className="flex items-center gap-0.5 rounded-full p-1 ring-1 ring-inset ring-white/[0.07] max-sm:order-last max-sm:w-full" style={YUZ}>
        {sekmeler.map(([id, ad, I, n]) => (
          <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
            className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors max-sm:flex-1 max-sm:justify-center max-sm:px-2", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {sekme === id && <motion.span layoutId="inf-sekme" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
            <I className="relative h-3.5 w-3.5" /><span className="relative">{ad}</span>
            {n > 0 && <motion.span key={n} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("relative rounded-full px-1.5 text-[10.5px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</motion.span>}
          </button>
        ))}
      </div>
      {menuDugme}
    </div>
  );

  /* ── Komut kutusu çipleri ── */
  const ilkSahne = sahneler[0] === "ozel" ? { id: "ozel", ad: ozel.sahne || "Özel sahne", kapak: aktif?.portre ?? "" } : SAHNELER.find((s) => s.id === sahneler[0]);
  const gorunenSahne = SAHNELER.filter((s) => kat === "tum" || s.kat === kat);
  const sahneCip = (
    <KCip buyuk etiket="Sahne" ikon={ilkSahne ? img(ilkSahne.kapak) : <MapPin className="h-3.5 w-3.5" />} deger={!sahneler.length ? "Sahne seç" : sahneler.length === 1 ? ilkSahne?.ad : `${sahneler.length} sahne`} acik={cip === "sahne"} setAcik={cipAc("sahne")} genislik={460} vurgu={!sahneler.length}>
      <div className="flex flex-wrap gap-1 px-0.5 pb-2">
        {SAHNE_KAT.map((c) => (
          <button key={c.id} onClick={() => setKat(c.id)} className={cn("relative h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium transition-colors", kat === c.id ? "text-black" : "bg-white/[0.055] text-metin-2 hover:text-metin")}>
            {kat === c.id && <motion.span layoutId="inf-sahne-kat" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{c.ad}</span>
          </button>
        ))}
      </div>
      <OzelGirdi deger={ozel.sahne} set={(t) => setOzel((o) => ({ ...o, sahne: t }))} secili={sahneler.includes("ozel")} ph="Ör. yağmurlu Paris sokağında şemsiyeyle" alt="Listede yoksa sahneyi tarif et" uygula={() => { if (!sahneler.includes("ozel")) sahneTikla("ozel"); setCip(null); }} />
      <MenuKart baslik="Sahneler" sag={<span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-medium tabular-nums", sahneler.length ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}>{sahneler.length} / {MAKS_SAHNE} seçili</span>}>
        <motion.div className="grid grid-cols-3 gap-2 p-2">
          {gorunenSahne.map((s) => {
            const no = sahneler.indexOf(s.id) + 1;
            return <GorselKaro key={s.id} sec={no > 0} no={no || undefined} ad={s.ad} kapak={s.kapak} onClick={() => sahneTikla(s.id)} />;
          })}
        </motion.div>
      </MenuKart>
    </KCip>
  );
  const secenekCip = (anahtar: string, etiket: string, liste: { id: string; ad: string; alt?: string; kapak: string }[], deger: string, setDeger: (v: string) => void, Bos: typeof Sun) => {
    const S = liste.find((x) => x.id === deger);
    const ozelMi = deger === "ozel";
    const ozelDeger = ozel[anahtar as "kiyafet" | "poz" | "isik"];
    const kapak = (x: { id: string; kapak: string }) => (anahtar === "kiyafet" && x.id === "imza" && aktif ? aktif.portre : x.kapak);
    const ph = ({ kiyafet: "Ör. krem rengi triko ve geniş paça pantolon", poz: "Ör. merdivende oturmuş, dizine yaslanmış", isik: "Ör. pencereden gelen soğuk sabah ışığı" } as Record<string, string>)[anahtar];
    return (
      <KCip buyuk etiket={etiket} ikon={ozelMi ? <Sparkles className="h-3.5 w-3.5" /> : S ? img(kapak(S)) : <Bos className="h-3.5 w-3.5" />} deger={ozelMi ? ozelDeger : S?.ad ?? etiket} acik={cip === anahtar} setAcik={cipAc(anahtar)} genislik={440}>
        <OzelGirdi deger={ozelDeger} set={(t) => setOzel((o) => ({ ...o, [anahtar]: t }))} secili={ozelMi} ph={ph} alt={`Listede yoksa ${etiket.toLocaleLowerCase("tr")} tarif et`} uygula={() => { setDeger("ozel"); setCip(null); }} />
        <MenuKart baslik={{ kiyafet: "Ne giysin", poz: "Nasıl dursun", isik: "Işık nasıl olsun" }[anahtar] ?? etiket}><div className="grid grid-cols-3 gap-2 p-2">{liste.map((x) => <GorselKaro key={x.id} sec={deger === x.id} ad={x.ad} alt={x.alt} kapak={kapak(x)} onClick={() => { setDeger(x.id); setCip(null); }} />)}</div></MenuKart>
      </KCip>
    );
  };
  const modelListe = (l: { deger: string; ad: string; alt: string; rozet?: string; kredi?: number }[], deger: string, setDeger: (v: string) => void) => l.map((m) => (
    <button key={m.deger} onClick={() => { setDeger(m.deger); setCip(null); }} aria-pressed={deger === m.deger} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", deger === m.deger ? "bg-white/[0.085] ring-2 ring-white" : "ring-transparent hover:bg-white/[0.065]")}>
      <MarkaKare ad={m.deger} boyut={34} />
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin">{m.ad}{m.rozet && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">{m.rozet}</span>}</span><span className="block text-[12px] leading-snug text-metin-3">{m.alt}</span></span>
      <span className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium tabular-nums", deger === m.deger ? "bg-white text-black" : "bg-white/[0.075] text-metin-2")}><KrediYildiz className="h-3 w-3" />{m.kredi ?? videoKrediHesap(m.deger)}</span>
    </button>
  ));
  const kareCip = (
    <KCip buyuk etiket="Başlangıç karesi" ikon={img(kaynak?.gor)} deger={kaynak?.id === "portre" || !kaynak ? "Portre" : "Seçili kare"} acik={cip === "kare"} setAcik={cipAc("kare")} genislik={420}>
      <MenuKart baslik="Video bu kareden başlar" sag={<span className="text-[11.5px] text-metin-3">{hazirFotolar.length ? `${hazirFotolar.length} fotoğraf` : "Henüz fotoğraf yok"}</span>}>
      <div className="grid grid-cols-4 gap-2 p-2">
        {kareler.slice(0, 16).map((kr, i) => {
          const s = kr.id === kaynak?.id;
          return (
            <button key={kr.id} onClick={() => { setKaynakKare(kr.id); setCip(null); }} aria-pressed={s} className={cn("relative aspect-[4/5] overflow-hidden rounded-[10px] bg-black transition", s ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/35")}>
              {img(kr.gor)}
              {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pb-1 pt-3 text-center text-[10.5px] font-medium text-white">Portre</span>}
            </button>
          );
        })}
      </div>
      {!hazirFotolar.length && <p className="border-t border-white/[0.06] px-3 py-2.5 text-[12px] leading-snug text-metin-2">Önce bir sahnede fotoğraf üret; o kareyi videoya çevirebilirsin.</p>}
      </MenuKart>
    </KCip>
  );
  const H = HAREKETLER.find((h) => h.id === hareket);
  const hareketCip = (
    <KCip buyuk etiket="Hareket" ikon={H ? img(H.kapak) : <Sparkles className="h-3.5 w-3.5" />} deger={H?.ad ?? ozel.hareket} acik={cip === "hareket"} setAcik={cipAc("hareket")} genislik={460}>
      <OzelGirdi deger={ozel.hareket} set={(t) => setOzel((o) => ({ ...o, hareket: t }))} secili={hareket === "ozel"} ph="Ör. kameraya yürüyüp göz kırpıyor" alt="Listede yoksa hareketi tarif et" uygula={() => { setHareket("ozel"); setCip(null); }} />
      <MenuKart baslik="Nasıl hareket etsin" sag={<span className="text-[11.5px] text-metin-3">Üzerine gel, oynasın</span>}><div className="grid grid-cols-3 gap-2 p-2">{HAREKETLER.map((x) => <GorselKaro key={x.id} sec={hareket === x.id} ad={x.ad} alt={x.alt} kapak={x.kapak} video={x.video} oran="aspect-[3/4]" onClick={() => { setHareket(x.id); setCip(null); }} />)}</div></MenuKart>
    </KCip>
  );
  const vSureler = (() => { const e = videoErisim(videoModel); const l = e.durum === "gercek" && e.sureler.length ? e.sureler : [5, 10]; if (l.length <= 4) return l; const y = [5, 8, 10, 15].filter((n) => l.includes(n)); return y.length >= 2 ? y : [l[0], l[l.length - 1]]; })();
  /* Model, platform, kare ve tutarlılık tek çipte: kutu sade kalır, Üret aynı satırda durur. */
  const ayarCip = (
    <KCip buyuk etiket="Ayarlar" ikon={<MarkaKare ad={mod === "foto" ? fotoModel : videoModel} boyut={24} />} deger={mod === "foto" ? `${P.oran} · ${adet} kare` : `${P.oran} · ${sure.replace("sn", " sn")}`} acik={cip === "ayar"} setAcik={cipAc("ayar")} genislik={760}>
      <div className="grid gap-2 p-0.5 sm:grid-cols-2 [&>*]:min-w-0">
      <MenuKart baslik={mod === "foto" ? "Görsel modeli" : "Video modeli"} sag={<span className="text-[11.5px] text-metin-3">Kredi {mod === "foto" ? "kare" : "video"} başına</span>}><div className="space-y-0.5 p-1.5">
      {mod === "foto" ? modelListe(FOTO_MODELLER, fotoModel, (v) => { setFotoModel(v); setCip("ayar"); }) : modelListe(VIDEO_MODELLER, videoModel, (v) => { setVideoModel(v); setCip("ayar"); })}
      </div></MenuKart>
      <MenuKart baslik="Paylaşılacağı yer" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{P.oran}</span>}>
      <div className="grid grid-cols-2 gap-1.5 p-1.5">
        {PLATFORMLAR.map((p) => (
          <button key={p.id} onClick={() => setPlatform(p.id)} aria-pressed={platform === p.id} className={cn("flex items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", platform === p.id ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.05] hover:bg-white/[0.065]")}>
            <PlatformLogo src={p.logo} boyut={34} /><span className="min-w-0"><span className="block truncate text-[13px] font-medium text-metin">{p.ad}</span><span className="block text-[11.5px] tabular-nums text-metin-3">{p.oran}</span></span>
          </button>
        ))}
      </div>
      </MenuKart>
      {mod === "foto" ? (
        <>
          <MenuKart baslik="Sahne başına kare"><div className="p-2"><Segment etiket="Kare" deger={adet} onDegis={(v) => setAdet(v)} secenekler={[[1, "1 kare"], [2, "2 kare"], [4, "4 kare"]]} /></div></MenuKart>
          <MenuKart baslik="Kimlik tutarlılığı">
            <div className="grid grid-cols-3 gap-1.5 p-1.5">
              {([["serbest", "Serbest", Feather, "Yaratıcı, yüz biraz değişebilir"], ["dengeli", "Dengeli", Scale, "Yüz aynı, sahneye uyumlu"], ["siki", "Sıkı", Lock, "Birebir yüz, poz sınırlı"]] as const).map(([v, a, I, alt]) => (
                <button key={v} onClick={() => setSadakat(v)} aria-pressed={sadakat === v} className={cn("flex flex-col items-center gap-1.5 rounded-[12px] px-1.5 pb-2.5 pt-3 text-center ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-95", sadakat === v ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.06] hover:bg-white/[0.065]")}>
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors", sadakat === v ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}><I className="h-4 w-4" /></span>
                  <span className="text-[13px] font-medium leading-tight text-metin">{a}</span>
                  <span className="-mt-1 text-[11px] leading-tight text-metin-3">{alt}</span>
                </button>
              ))}
            </div>
          </MenuKart>
        </>
      ) : (
        <MenuKart baslik="Video süresi"><div className="p-2"><Segment etiket="Süre" deger={sure} onDegis={(v) => setSure(v)} secenekler={vSureler.map((n) => [`${n}sn`, `${n} sn`] as const)} /></div></MenuKart>
      )}
      </div>
    </KCip>
  );
  const cipler = mod === "foto"
    ? <>{sahneCip}{secenekCip("kiyafet", "Kıyafet", KIYAFETLER, kiyafet, setKiyafet, Shirt)}{secenekCip("poz", "Poz", POZLAR, poz, setPoz, PersonStanding)}{secenekCip("isik", "Işık", ISIKLAR, isik, setIsik, Sun)}{ayarCip}</>
    : <>{kareCip}{hareketCip}{ayarCip}</>;

  const karakterCip = aktif && (
    <div className="relative shrink-0">
      <button onClick={() => setCip(cip === "karakter" ? null : "karakter")} aria-label={`Karakter: ${aktif.ad}, değiştir`} title="Karakteri değiştir"
        className={cn("relative block h-[96px] w-[74px] overflow-hidden rounded-[16px] bg-white/[0.055] transition max-sm:h-[68px] max-sm:w-[52px]", cip === "karakter" ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/15 hover:outline-white/35", "active:scale-95")}>
        <AnimatePresence mode="popLayout" initial={false}><motion.span key={aktif.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={YAY} className="absolute inset-0">{img(aktif.portre)}</motion.span></AnimatePresence>
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1 pb-1 pt-4 text-center text-[11px] font-medium text-white">{aktif.ad}</span>
      </button>
      <Yuzen acik={cip === "karakter"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Karakter" className={cn(POP, "p-2")} style={{ width: "min(440px, calc(100vw - 24px))" }}>
        <MenuKart baslik="Karakterlerin" sag={<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{karakterler.length}</span>}>
          <div className="grid grid-cols-4 gap-2 p-2">
            {karakterler.map((k) => <GorselKaro key={k.id} sec={k.id === aktif.id} ad={k.ad} kapak={k.portre} oran="aspect-[3/4]" onClick={() => { sec(k.id); setKaynakKare(null); setCip(null); }} />)}
            <button onClick={() => { setCip(null); setSihirbaz({}); }} className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.065] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.09] hover:text-metin active:scale-95"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]"><Plus className="h-4 w-4" /></span><span className="text-[12px] font-medium">Yeni</span></button>
          </div>
        </MenuKart>
      </Yuzen>
    </div>
  );

  const hapMetin = engel ?? (!demo && bakiye !== undefined && toplam > bakiye ? `Bakiye yetmiyor: ${toplam} kredi gerekli` : null);
  const durum = hapMetin ? <span title={hapMetin} className="max-w-[340px] truncate rounded-full bg-amber-300/[0.08] px-2.5 py-1 text-[11.5px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden">{hapMetin}</span>
    : null;
  const komut = aktif && (
    <div className="pointer-events-auto w-full min-w-0">
    <div className="mb-2 flex">
          <div role="radiogroup" aria-label="Çıktı türü" className="cam-istemci isolate inline-flex gap-0.5 rounded-full p-1">
            {([["foto", "Fotoğraf", ImageIcon], ["video", "Video", Film]] as const).map(([id, ad, I]) => (
              <button key={id} role="radio" aria-checked={mod === id} onClick={() => { setMod(id); setCip(null); }}
                className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", mod === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {mod === id && <motion.span layoutId="inf-mod" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                <I className="h-4 w-4" />{ad}
              </button>
            ))}
          </div>
    </div>
    <div className="cam-istemci relative w-full min-w-0 rounded-[26px] p-3">
      <div className="flex gap-3 max-sm:gap-2.5">
        {karakterCip}
        <div className="min-w-0 flex-1">
          {durum && <div className="flex justify-end">{durum}</div>}
          <textarea value={ek} onChange={(e) => setEk(e.target.value.slice(0, 300))} rows={2} aria-label="Ek detay"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}
            placeholder={mod === "foto" ? `${aktif.ad} ne yapıyor? Örneğin: elinde kahve, kameraya gülümsüyor` : "Hareket notu: örneğin kameraya el sallıyor, saçları rüzgârda"}
            className="block max-h-[110px] min-h-[72px] w-full resize-none bg-transparent px-1 py-1 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] [scrollbar-width:thin]" />
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={mod} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&>*]:shrink-0 max-sm:grid max-sm:grid-cols-2 max-sm:overflow-visible max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">{cipler}</motion.div>
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => uret()} disabled={!!engel} title={engel ?? "Ctrl+Enter"}
          className="group flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-[15px] font-semibold text-black transition active:scale-95 disabled:opacity-45 max-sm:w-full">
          <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span>Üret <motion.span key={mod === "foto" ? sahneler.length * adet : 1} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{mod === "foto" ? sahneler.length * adet : 1}</motion.span> {mod === "foto" ? "fotoğraf" : "video"}</span>
          {!demo && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{toplam}</span>}
        </motion.button>
      </div>
    </div>
    </div>
  );

  /* ── Galeri ── */
  const kart = (u: Uretim, i: number, etiket?: string) => {
    const bitti = u.durum === "tamam", hata = u.durum === "hata", demoU = u.gercek === false;
    const kapak = (demoU || !bitti) ? demoGorsel(u) ?? onizleme[u.id] ?? saltUrl(u.gorselUrl) : saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl;
    return (
      <motion.div key={u.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ ...YAY, delay: Math.min(i, 8) * 0.035 }} className="group relative shrink-0" style={kartOlc(u.meta?.oran)}>
        <button onClick={() => setAcik(u)} className="relative block h-full w-full overflow-hidden rounded-[14px] bg-black text-left outline outline-1 -outline-offset-1 outline-white/[0.08] transition duration-300 hover:outline-white/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {kapak && <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]", !bitti && "scale-105 opacity-40 blur-[3px]")} />}
          {bitti && u.tur === "video" && u.videoUrl && !demoU && <video src={u.videoUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
          {!bitti && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium text-white">
              {hata ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              {hata ? "Başarısız" : u.durum === "kuyrukta" ? "Sırada" : `yüzde ${Math.round(u.ilerleme ?? 0)}`}
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
          {u.tur === "video" && bitti && <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur transition group-hover:scale-110 group-hover:opacity-0"><Play className="h-4 w-4 translate-x-0.5 fill-white text-white" /></span>}
          <span className="absolute left-2 top-2 flex items-center gap-1">
            <span className="flex h-[22px] items-center gap-1 rounded-full bg-black/55 px-2 text-[11px] font-medium text-white backdrop-blur">{u.tur === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{u.tur === "video" ? "Video" : "Kare"}</span>
          </span>
          {demoU && bitti && aktif && u.tur !== "video" && kapak !== aktif.portre && <span title="Karakter bu sahnede" className="absolute left-2 top-9 block h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/85">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={aktif.portre} alt="" className="h-full w-full object-cover object-top" /></span>}
          {etiket && <span className="absolute inset-x-2.5 bottom-2.5 line-clamp-1 text-[13px] font-semibold text-white transition-opacity group-hover:opacity-0">{etiket}</span>}
        </button>
        {bitti && u.favori && <FavoriRozeti className="right-2 top-2" />}
        {bitti && (
          <div onClick={(e) => e.stopPropagation()} className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 max-sm:pointer-events-auto max-sm:opacity-100">
            <FavoriDugmesi favori={!!u.favori} onClick={() => useProjeler.getState().favoriToggle(u.id)} side="left" />
            <IndirDugmesi u={u} className={eylemDugmesi("orta")} side="left" />
            <KartDahaMenusu u={u} side="left" onSil={() => useProjeler.getState().sil(u.id)}
              eylemler={[{ ad: "Büyük gör", ikon: ImageIcon, fn: () => setAcik(u) }, ...(u.tur !== "video" ? [{ ad: "Videoya çevir", ikon: Film, fn: () => videoyaCevir(u) }, { ad: "Referans setine ekle", ikon: Layers, fn: () => referansYap(u) }, { ad: "Kimlik portresi yap", ikon: UserRound, fn: () => portreYap(u) }] : [])]} />
          </div>
        )}
        {bitti && u.tur !== "video" && (
          <div className="absolute inset-x-2 bottom-2 flex translate-y-1 gap-1 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
            <button onClick={() => videoyaCevir(u)} title="Videoya çevir" className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[12px] font-semibold text-black transition active:scale-95"><Film className="h-3.5 w-3.5" />Videoya çevir</button>
            <button onClick={() => referansYap(u)} title="Referans setine ekle" aria-label="Referans setine ekle" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/80 active:scale-90"><Layers className="h-3.5 w-3.5" /></button>
            <button onClick={() => portreYap(u)} title="Kimlik portresi yap" aria-label="Kimlik portresi yap" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/80 active:scale-90"><UserRound className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </motion.div>
    );
  };
  const gorselAl = (u: Uretim) => (u.gercek === false ? onizleme[u.id] ?? saltUrl(u.gorselUrl) : saltUrl(u.gorselUrl)) ?? aktif?.portre;
  const grupIndir = (g: Uretim[]) => {
    let n = 0;
    for (const u of g.filter((x) => x.durum === "tamam" && x.gercek !== false)) {
      const url = u.tur === "video" ? u.videoUrl : saltUrl(u.gorselUrl); if (!url) continue;
      urlIndir(url, `${u.baslik.replace(/[\\/:*?"<>|]+/g, "-")}.${u.tur === "video" ? "mp4" : "png"}`); n++;
    }
    if (n) toast.success(n > 1 ? `${n} dosya indiriliyor` : "Dosya indiriliyor", { description: "İndirilenler klasörüne kaydedilir." });
    else mesaj.indirilemedi("İndirilecek gerçek dosya yok; önizlemeler indirilemez.");
  };

  const FIKIRLER = [
    { sid: "kafe", kiyafet: "imza", poz: "selfie", isik: "dogal" }, { sid: "cati", kiyafet: "gece", poz: "omuz", isik: "altin" }, { sid: "banyo", kiyafet: "imza", poz: "ayna", isik: "dogal" }, { sid: "plaj", kiyafet: "bohem", poz: "yurume", isik: "altin" },
    { sid: "neon", kiyafet: "gece", poz: "omuz", isik: "neon" }, { sid: "editoryel", kiyafet: "streetwear", poz: "yurume", isik: "dogal" }, { sid: "spor", kiyafet: "spor", poz: "selfie", isik: "dogal" }, { sid: "lavanta", kiyafet: "bohem", poz: "yurume", isik: "altin" },
  ];
  const fikirUret = (k: (typeof FIKIRLER)[number]) => { setSahneler([k.sid]); setKiyafet(k.kiyafet); setPoz(k.poz); setIsik(k.isik); setMod("foto"); uret({ sahneler: [k.sid], kiyafet: k.kiyafet, poz: k.poz, isik: k.isik, mod: "foto" }); };
  const fikirKart = (k: (typeof FIKIRLER)[number], i: number, genis = true) => {
    const S = SAHNELER.find((x) => x.id === k.sid)!;
    const Ki = KIYAFETLER.find((x) => x.id === k.kiyafet), Po = POZLAR.find((x) => x.id === k.poz);
    return (
      <motion.button key={k.sid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.05 + i * 0.05 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => fikirUret(k)}
        className={cn("group relative aspect-[4/5] overflow-hidden rounded-[14px] bg-black text-left outline outline-1 -outline-offset-1 outline-white/[0.08] hover:outline-white/30", genis && "md:aspect-[4/3]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={S.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
        {aktif && <span className="absolute left-2.5 top-2.5 block h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/85">{img(aktif.portre)}</span>}
        <span className="absolute inset-x-3 bottom-3 flex items-end gap-2">
          <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold text-white">{S.ad}</span><span className="block truncate text-[12px] text-white/70">{[Ki?.ad, Po?.ad].filter(Boolean).join(" · ")}</span></span>
          <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white pl-2.5 pr-2 text-[12px] font-semibold text-black transition group-hover:pr-2.5">Üret<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </span>
      </motion.button>
    );
  };
  /* Boş galeri: Görsel stüdyosu gibi ortada başlık + tek sıra küçük başlangıç karoları (tıkla, üret). */
  const hizli = aktif && (
    <section className="mx-auto max-w-[1040px] overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/15">{img(aktif.portre)}</span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[15px] font-semibold text-metin">{aktif.ad} ile ilk çekim</span><span className="block truncate text-[12.5px] text-metin-3">Bir sahneye tıkla, aynı yüzle {adet} kare üretilsin</span></span>
      </div>
      <div className="grid w-full grid-cols-3 gap-2.5 p-3.5 sm:grid-cols-6">
        {FIKIRLER.slice(0, 6).map((k, i) => {
          const S = SAHNELER.find((x) => x.id === k.sid)!;
          return (
            <motion.button key={k.sid} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.1 + i * 0.04 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} onClick={() => fikirUret(k)} title={`${S.ad}: ${adet} kare üret`}
              className="group relative aspect-[4/5] overflow-hidden rounded-[14px] bg-black text-left ring-1 ring-white/10 transition hover:ring-white/35">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={S.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute inset-x-2 bottom-2 text-center"><span className="block truncate text-[12.5px] font-semibold text-white">{S.ad}</span></span>
              <span className="absolute left-1/2 top-1/2 flex h-8 -translate-x-1/2 -translate-y-1/2 scale-90 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-black opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100"><Sparkles className="h-3.5 w-3.5" />Üret</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );

  const galeri = (
    <div className="space-y-3">
      {sonuclar.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full p-1 ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
            {([["tum", "Tümü", LayoutGrid], ["foto", "Fotoğraf", ImageIcon], ["video", "Video", Film], ["favori", "Favoriler", Star]] as const).map(([id, ad, I]) => (
              <button key={id} onClick={() => setFiltre(id)} aria-pressed={filtre === id} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", filtre === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {filtre === id && <motion.span layoutId="inf-filtre" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                <I className="relative h-3.5 w-3.5" /><span className="relative">{ad}</span>
              </button>
            ))}
          </div>
          <AnimatePresence>{suren > 0 && <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-metin ring-1 ring-inset ring-white/[0.1]"><Loader2 className="h-3.5 w-3.5 animate-spin" />{suren} üretiliyor</motion.span>}</AnimatePresence>
          <span className="ml-auto rounded-full bg-white/[0.075] px-2.5 py-1 text-[12px] tabular-nums text-metin-2">{sonuclar.length} içerik, {sonuclar.filter((u) => u.favori).length} favori</span>
          <GorunumAyari sayfa="influencer" istemVar={false} />
        </div>
      )}
      {!sonuclar.length ? hizli : !gruplar.length ? (
        <section className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin">{filtre === "favori" ? <Star className="h-4 w-4" /> : filtre === "video" ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[14.5px] font-semibold text-metin">{filtre === "favori" ? "Henüz favori yok" : filtre === "video" ? "Henüz video yok" : "Henüz fotoğraf yok"}</span>
              <span className="block text-[12.5px] text-metin-3">{filtre === "favori" ? "Aşağıdan beğendiğin karelerin yıldızına dokun" : filtre === "video" ? "Bir fotoğrafı seç, hareket verip videoya çevir" : "Bir sahne seç, aynı yüzle çekim yapılsın"}</span>
            </span>
            <button onClick={() => setFiltre("tum")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><LayoutGrid className="h-3.5 w-3.5" />Tümünü göster</button>
          </div>
          {filtre !== "foto" && hazirFotolar.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto p-3.5 [scrollbar-width:thin]" style={{ ["--kh" as string]: masaustu ? "260px" : "200px" }}>
              {hazirFotolar.slice(0, 12).map((u, i) => {
                const g = (u.gercek === false ? onizleme[u.id] ?? saltUrl(u.gorselUrl) : saltUrl(u.gorselUrl)) ?? aktif?.portre;
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: Math.min(i, 8) * 0.03 }} className="group relative shrink-0 overflow-hidden rounded-[14px] bg-black ring-1 ring-inset ring-white/[0.08]" style={kartBoyut(u.meta?.oran)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <span className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-end gap-2">
                      {filtre === "favori" ? (
                        <button onClick={() => useProjeler.getState().favoriToggle(u.id)} aria-label="Favorilere ekle" title="Favorilere ekle" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition active:scale-90"><Star className="h-4 w-4" /></button>
                      ) : (
                        <button onClick={() => videoyaCevir(u)} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black transition active:scale-95"><Film className="h-3.5 w-3.5" />Videoya çevir</button>
                      )}
                    </span>
                  </motion.div>
                );
              })}
              {filtre === "video" && HAREKETLER.slice(0, 6).map((x, i) => (
                <motion.button key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.1 + i * 0.04 }} whileHover={{ y: -3 }} onClick={() => { setHareket(x.id); setMod("video"); toast("Hareket seçildi", { description: `${x.ad}: başlangıç karesini seçip üret.` }); }}
                  className="group relative shrink-0 overflow-hidden rounded-[14px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/35" style={kartBoyut("3:4")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  {i === 0 && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11.5px] font-medium text-white backdrop-blur">Hareketler</span>}
                  <span className="absolute inset-x-3 bottom-3 leading-tight"><span className="block truncate text-[14px] font-semibold text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/65">{x.alt}</span></span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3.5 md:grid-cols-4">{FIKIRLER.slice(0, 4).map((k, i) => fikirKart(k, i))}</div>
          )}
        </section>
      ) : (
        <AnimatePresence initial={false}>
          {gruplar.map((g, gi) => {
            const hazir = g.filter((u) => u.durum === "tamam").length, video = g[0].tur === "video";
            const ham = g.map((u) => u.meta?.hamIstem ?? "");
            const aci = ham.every((h) => h.startsWith("Açı seti")), duzen = ham.every((h) => h.startsWith("Düzenleme"));
            const parca = (ham[0] ?? "").split(" · ");
            const sahneS = !aci && !duzen ? SAHNELER.find((x) => parca.includes(x.ad)) : undefined;
            const sahneId = sahneS?.id;
            const baslikMetni = aci ? "Açı seti" : duzen ? "Portre düzenlemesi" : video ? (ham[0].split(" · ")[0] || "Video") : sahneS?.ad ?? (parca[0] || "Çekim");
            const ayarlar = ([["Sahne", SAHNELER], ["Kıyafet", KIYAFETLER], ["Poz", POZLAR], ["Işık", ISIKLAR]] as const)
              .map(([tur, l]) => [tur as string, (l as readonly { id: string; ad: string; kapak: string }[]).find((x) => parca.includes(x.ad))] as const)
              .filter((x): x is readonly [string, { id: string; ad: string; kapak: string }] => !!x[1]);
            /* Kart etiketi yalnız karelerin birbirinden farkını söyler (açı adı, düzenleme); aynıysa başlıkta bir kez yazar. */
            const etiket = (u: Uretim) => (aci ? (u.meta?.hamIstem ?? "").replace("Açı seti · ", "") : duzen ? (u.meta?.hamIstem ?? "").replace(/^Düzenleme:\s*/, "") : undefined);
            const poz = ayarlar.find(([t]) => t === "Poz")?.[1].id;
            const oneriler = !video && sahneId ? POZLAR.filter((p) => p.id !== poz).slice(0, 6) : [];
            const ilkHazir = g.find((u) => u.durum === "tamam" && u.tur !== "video");
            return (
              <motion.section key={g[0].meta?.grupId ?? g[0].id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...YAY, delay: Math.min(gi, 5) * 0.04 }}
                className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
                <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin">{video ? <Film className="h-4 w-4" /> : aci ? <ScanFace className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[14.5px] font-semibold text-metin">{baslikMetni}</span>
                    <span className="block truncate text-[12px] text-metin-3">{g.length} {video ? "video" : "kare"}{hazir < g.length ? `, ${hazir} hazır` : ""} · {g[0].model} · {goreliZamanKisa(g[0].olusturma)}</span>
                  </span>
                  
                  {hazir > 0 && <button onClick={() => grupIndir(g)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">Tümünü indir</span></button>}
                </div>
                {ayarlar.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-2.5 [scrollbar-width:none]">
                    {ayarlar.map(([tur, x]) => (
                      <span key={tur} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/[0.065] py-1 pl-1 pr-3 ring-1 ring-inset ring-white/[0.07]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tur === "Kıyafet" && x.id === "imza" && aktif ? aktif.portre : x.kapak} alt="" className="h-8 w-8 rounded-full object-cover" />
                        <span className="leading-tight"><span className="block text-[10.5px] text-metin-3">{tur}</span><span className="block whitespace-nowrap text-[12.5px] font-medium text-metin">{x.ad}</span></span>
                      </span>
                    ))}
                    <span className="flex-1" />
                    <button onClick={() => { const [s, k, p, i] = ["Sahne", "Kıyafet", "Poz", "Işık"].map((t) => ayarlar.find(([a]) => a === t)?.[1].id); if (s) setSahneler([s]); if (k) setKiyafet(k); if (p) setPoz(p); if (i) setIsik(i); setMod("foto"); toast("Ayarlar komut kutusuna alındı"); }}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[12.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Copy className="h-3.5 w-3.5" />Ayarları al</button>
                    {ilkHazir && <button onClick={() => videoyaCevir(ilkHazir)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95"><Film className="h-3.5 w-3.5" />Videoya çevir</button>}
                  </div>
                )}
                {/* Tek satır: kareler, aynı sahneden daha fazla, başka pozlarla öneriler; satır taşarsa yatay kayar */}
                <div className="flex gap-3 overflow-x-auto p-3.5 [scrollbar-width:thin]" style={{ ["--kh" as string]: `${kartYuk}px` }}>
                  {g.map((u, i) => kart(u, i, etiket(u)))}
                  {!video && sahneId && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} whileTap={{ scale: 0.98 }} onClick={() => uret({ sahneler: [sahneId], mod: "foto" })}
                      className="group relative flex shrink-0 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[14px] bg-white/[0.055] text-center ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/30" style={kartBoyut(g[0].meta?.oran)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sahneS!.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-105 group-hover:opacity-70" />
                      <span className="absolute inset-0 bg-black/35" />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:rotate-90"><Plus className="h-5 w-5" /></span>
                      <span className="relative px-3"><span className="block text-[14px] font-semibold text-metin">{adet} kare daha</span><span className="block text-[12px] text-metin-2">Aynı ayarlarla</span></span>
                    </motion.button>
                  )}
                  {(aci || duzen) && ilkHazir && ([
                    [Layers, "Referansa ekle", aci ? "Açıları kimlik setine kat" : "Bu sürümü referans yap", () => g.filter((u) => u.durum === "tamam").forEach(referansYap)],
                    [UserRound, "Portre yap", "İlk kareyi kimlik portresi yap", () => portreYap(ilkHazir)],
                    [Film, "Videoya çevir", "Bu kareden hareketli video", () => videoyaCevir(ilkHazir)],
                  ] as const).map(([I, a, alt, f], i) => (
                    <motion.button key={a} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.15 + i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={f}
                      className="group relative flex shrink-0 flex-col items-start justify-end gap-2 overflow-hidden rounded-[14px] p-4 text-left ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/30" style={{ ...kartBoyut("4:5"), background: "rgba(255,255,255,0.03)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gorselAl(g[Math.min(i, g.length - 1)])} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-50" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                      <span className={cn("relative flex h-11 w-11 items-center justify-center rounded-full transition", i === 0 ? "bg-white text-black" : "bg-white/[0.14] text-white backdrop-blur group-hover:bg-white group-hover:text-black")}><I className="h-5 w-5" /></span>
                      <span className="relative leading-tight"><span className="block text-[15px] font-semibold text-white">{a}</span><span className="mt-0.5 block text-[12.5px] text-white/65">{alt}</span></span>
                    </motion.button>
                  ))}
                  {oneriler.map((p, i) => (
                    <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.15 + i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { setPoz(p.id); uret({ sahneler: [sahneId!], poz: p.id, mod: "foto" }); }}
                      className="group relative shrink-0 overflow-hidden rounded-[14px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/35" style={kartBoyut(g[0].meta?.oran)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      {i === 0 && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11.5px] font-medium text-white backdrop-blur">Başka pozla</span>}
                      <span className="absolute inset-x-3 bottom-3 flex items-end gap-2">
                        <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[14px] font-semibold text-white">{p.ad}</span><span className="block truncate text-[12px] text-white/65">{sahneS!.ad}</span></span>
                        <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Üret</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>
      )}
      {sonuclar.length > 0 && gruplar.length > 0 && filtre !== "favori" && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.1 }} className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Sparkles className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">Sıradaki çekim</span><span className="block text-[12px] text-metin-3">Tıkla, {aktif?.ad} bu sahnede {adet} kare üretilsin</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3.5 md:grid-cols-4">
            {FIKIRLER.filter((k) => !gruplar.some((g) => g[0].baslik.endsWith(SAHNELER.find((x) => x.id === k.sid)!.ad))).slice(0, 4).map((k, i) => fikirKart(k, i))}
          </div>
        </motion.section>
      )}
    </div>
  );

  const icerik = (s: Sekme) => !aktif ? null : (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
        {s === "galeri" ? galeri
          : s === "profil" ? <Profil k={aktif} fotolar={hazirFotolar} gorsel={(u) => (u.gercek === false ? onizleme[u.id] ?? saltUrl(u.gorselUrl) : saltUrl(u.gorselUrl)) ?? aktif.portre} onUret={(sid) => { setSekme("galeri"); setMod("foto"); if (sid) { setSahneler([sid]); uret({ sahneler: [sid], mod: "foto" }); } }} />
          : <KimlikKarti k={aktif} icerik={sonuclar.length} onDuzenle={() => setSihirbaz({ duzenle: aktif })} onCogalt={() => cogalt(aktif)} onSil={() => karakterSil(aktif)} onTekCumle={tekCumle} onAciSeti={aciSeti} aciMaliyet={4 * DUZEN_KREDI} duzenMaliyet={DUZEN_KREDI} onGit={(h) => { if (h === "profil") setSekme("profil"); else { setMod(h); setSekme("galeri"); } }} />}
      </motion.div>
    </AnimatePresence>
  );

  const modal = (
    <>
      <AnimatePresence>{acik && <UretimGoruntuleyici key="d" u={sonuclar.find((x) => x.id === acik.id) ?? acik} liste={sonuclar.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = sonuclar.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}</AnimatePresence>
      <Sihirbaz acik={!!sihirbaz} onKapat={() => setSihirbaz(null)} duzenle={sihirbaz?.duzenle} ilkYol={sihirbaz?.yol} ilkSablon={sihirbaz?.sablon} />
    </>
  );

  /* ═════════ Karakter yok: giriş ═════════ */
  if (!aktif) return <MotionConfig reducedMotion="user"><InfluencerGiris masaustu={masaustu} onSihirbaz={setSihirbaz} />{modal}</MotionConfig>;

  /* ═════════ Mobil ═════════ */
  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-[calc(100dvh-var(--ust-nav))] space-y-3 overflow-x-hidden bg-zemin px-3 pb-8 pt-3">
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">{raf(true)}</div>
          <div className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>{baslik}</div>
          {sekme === "galeri" && <div>{komut}</div>}
          {icerik(sekme)}
          {modal}
        </div>
      </MotionConfig>
    );
  }

  /* ═════════ Masaüstü ═════════ */
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col overflow-hidden bg-zemin">
        {/* Üst çubuk: karakterler + sekmeler (Görsel stüdyosundaki gibi alt çizgili) */}
        <div className="shrink-0 px-6 pt-4">
          <div className="flex min-h-[60px] items-center gap-3 rounded-[22px] bg-[#121315] py-2 pl-2 pr-2.5 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none]">{raf(true)}</div>
            <div role="tablist" className="isolate flex shrink-0 gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
              {sekmeler.map(([id, ad, I, n]) => (
                <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                  {sekme === id && <motion.span layoutId="inf-sekme-ust" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                  <I className="h-4 w-4" />{ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
                  {id === "galeri" && suren > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </button>
              ))}
            </div>
            {menuDugme}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("px-6 pt-5", sekme === "galeri" ? "pb-[260px]" : "mx-auto max-w-[1560px] pb-10")}>{icerik(sekme)}</div>
        </div>
        <AnimatePresence>
          {sekme === "galeri" && (
            <motion.div key="komut" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={YAY} className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
              <div className="flex justify-center px-6 pb-5 pt-6"><div className="w-full max-w-[1100px]">{komut}</div></div>
            </motion.div>
          )}
        </AnimatePresence>
        {modal}
      </div>
    </MotionConfig>
  );
}

/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}
/** Görselli seçim karosu: ad görselin içinde, seçim tek beyaz çerçeve (+ isteğe bağlı sıra numarası), video üzerine gelince oynar. */
function GorselKaro({ sec, ad, alt, kapak, video, onClick, oran = "aspect-[4/3]", no }: { sec: boolean; ad: string; alt?: string; kapak: string; video?: string; onClick: () => void; oran?: string; no?: number }) {
  const [oyna, setOyna] = useState(false);
  return (
    <button onClick={onClick} aria-pressed={sec} onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)}
      className={cn("group relative block w-full min-w-0 overflow-hidden rounded-[12px] bg-black text-left transition-transform active:scale-[0.97]", oran)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {video && oyna && <video src={video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/35")} />
      <AnimatePresence>{no !== undefined && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY} className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{no}</motion.span>}</AnimatePresence>
      <span className="absolute inset-x-2 bottom-1.5 leading-tight">
        <span className={cn("block truncate text-[12.5px] font-semibold max-sm:line-clamp-2 max-sm:whitespace-normal max-sm:text-[11.5px] max-sm:leading-tight", sec ? "text-white" : "text-white/90")}>{ad}</span>
        {alt && <span className="block truncate text-[11px] text-white/60 max-sm:hidden">{alt}</span>}
      </span>
    </button>
  );
}

/* ═════════ Giriş (karakter yokken) ═════════ */
function InfluencerGiris({ masaustu, onSihirbaz }: { masaustu: boolean; onSihirbaz: (s: { yol?: Yol; sablon?: number }) => void }) {
  const ornek = SABLONLAR[0];
  const sahneler = ["kafe", "cati", "plaj"].map((id) => SAHNELER.find((s) => s.id === id)!);
  return (
    <div className={cn("overflow-y-auto bg-zemin", masaustu ? "h-[calc(100dvh-var(--ust-nav))]" : "min-h-[calc(100dvh-112px)]")}>
      <div className="mx-auto max-w-[1200px] space-y-3 px-4 py-5 sm:px-6 sm:py-6">
        {/* Vitrin: bir yüz, her sahnede aynı */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_540px]">
            <div className="min-w-0">
              <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[52px]">Bir yüz.<br /><span className="hero-isilti">Her sahnede aynı.</span></h1>
              <p className="mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-white/70">AI influencer’ını bir kez kur. Sonra onu kafede, plajda, stüdyoda aynı yüzle fotoğraf ve videoda üret.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSihirbaz({})} className="group flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black"><Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />Karakter oluştur</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSihirbaz({ yol: "foto" })} className="flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.065]"><Upload className="h-4 w-4" />Fotoğraflarımdan</motion.button>
              </div>
            </div>
            {/* Mekanizma: portre, ok, üç sahne */}
            <div aria-hidden className="relative hidden h-[300px] lg:block">
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }} className="absolute left-0 top-1/2 w-[150px] -translate-y-1/2">
                <span className="block aspect-[3/4] overflow-hidden rounded-[16px] ring-1 ring-white/15">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ornek.portre} alt="" className="h-full w-full object-cover" /></span>
                <span className="mt-2 block text-center text-[12.5px] font-medium text-metin">{ornek.ad} <span className="text-metin-3">@{ornek.kullaniciAdi}</span></span>
              </motion.div>
              <svg className="absolute left-[150px] top-0 h-full w-[70px]" viewBox="0 0 70 300" fill="none">
                {[50, 150, 250].map((y, i) => (
                  <g key={y}>
                    <path d={`M4 150 C40 150 30 ${y} 66 ${y}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                    <motion.path d={`M4 150 C40 150 30 ${y} 66 ${y}`} stroke="#55d6fd" strokeWidth="1.5" strokeDasharray="5 12" initial={{ strokeDashoffset: 34 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear", delay: i * 0.25 }} />
                  </g>
                ))}
              </svg>
              <div className="absolute right-0 top-0 flex h-full w-[310px] flex-col justify-between">
                {sahneler.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.1, duration: 0.5, ease: EASE }} className="flex h-[88px] items-center gap-3 rounded-[16px] p-2 ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="relative block h-full w-[120px] shrink-0 overflow-hidden rounded-[11px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.kapak} alt="" className="h-full w-full object-cover" /><span className="absolute bottom-1 left-1 block h-7 w-7 overflow-hidden rounded-full ring-2 ring-white/90">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ornek.portre} alt="" className="h-full w-full object-cover" /></span></span>
                    <span className="min-w-0"><span className="block text-[13px] font-medium text-metin">{s.ad}</span><span className="block text-[11.5px] text-metin-3">Aynı yüz · 4:5</span></span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Başlama yolları */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease: EASE }} className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="border-b border-white/[0.06] px-5 py-3.5"><h2 className="text-[15px] font-semibold text-metin">Nasıl başlamak istersin?</h2></div>
          <div className="grid gap-2 p-2.5 md:grid-cols-3">
            {([["tasarim", Wand2, "Özelliklerden tasarla", "Görünüşü karolarla seç, 4 portreden birini al", [SABLONLAR[1].portre, SABLONLAR[2].portre, SABLONLAR[3].portre]], ["foto", Upload, "Fotoğraflarından oluştur", "3 ile 20 fotoğrafından referans seti kur", [SAHNELER[3].kapak, SABLONLAR[4].portre, SAHNELER[0].kapak]], ["sablon", LayoutTemplate, "Hazır karakterle başla", "Hazır bir karakteri al, kendine göre düzenle", [SABLONLAR[5].portre, SABLONLAR[6].portre, SABLONLAR[7].portre]]] as const).map(([y, I, b, a, g], i) => (
              <motion.button key={y} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.1 + i * 0.05 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => onSihirbaz({ yol: y })}
                className="group flex items-center gap-3.5 rounded-[16px] p-3 text-left ring-1 ring-inset ring-white/[0.06] transition hover:ring-white/[0.16]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="relative h-[64px] w-[64px] shrink-0">
                  {g.map((src, k) => <span key={k} className="absolute block h-[52px] w-[40px] overflow-hidden rounded-[9px] ring-2 ring-zemin transition-transform duration-300 group-hover:rotate-0" style={{ left: k * 12, top: k === 1 ? 0 : 8, transform: `rotate(${(k - 1) * 8}deg)`, zIndex: k === 1 ? 2 : 1 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt="" className="h-full w-full object-cover" /></span>)}
                </span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[14px] font-semibold text-metin"><I className="h-4 w-4 text-metin-2" />{b}</span><span className="mt-1 block text-[12.5px] leading-snug text-metin-3">{a}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-metin-3 transition group-hover:translate-x-0.5 group-hover:text-metin" />
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Hazır karakterler */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45, ease: EASE }} className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
            <h2 className="flex-1 text-[15px] font-semibold text-metin">Hazır karakterler</h2>
            <span className="rounded-full px-2 py-0.5 text-[11.5px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{SABLONLAR.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 p-2.5 sm:grid-cols-4 lg:grid-cols-8">
            {SABLONLAR.map((s, i) => (
              <motion.button key={s.ad} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.15 + Math.min(i, 8) * 0.03 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => onSihirbaz({ sablon: i })}
                className="group relative aspect-[3/4] overflow-hidden rounded-[14px] bg-black text-left outline outline-1 -outline-offset-1 outline-white/[0.08] hover:outline-white/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.portre} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-medium text-white/90 backdrop-blur-sm">{NISLER.find((n) => n.id === s.nis)?.ad}</span>
                <span className="absolute inset-x-2.5 bottom-2.5"><span className="block text-[14px] font-semibold text-white">{s.ad}</span><span className="block truncate text-[11px] text-white/70">@{s.kullaniciAdi}</span></span>
                <span className="absolute right-2 top-2 flex h-7 w-7 translate-y-1 items-center justify-center rounded-full bg-white text-black opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight className="h-3.5 w-3.5" /></span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
