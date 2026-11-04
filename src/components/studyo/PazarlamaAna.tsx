"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Check, Plus, PenLine, ChevronLeft, ChevronRight, Clapperboard, Megaphone, FileText, ImagePlus, Link2, Loader2, MapPin, Package, Play, Repeat, Settings2,
  Sparkles, Trash2, UserRound, Wand2, X, Zap,
  ChevronDown, Heart, Search, ArrowRight,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { begeniBildir, neden, uretimGeriYukle } from "@/components/studyo/bildirim";
import { cn } from "@/lib/utils";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { icerikDenetle } from "@/lib/moderasyon";
import { useAktifProje } from "@/lib/useAktifProje";
import { useMasaustu } from "@/hooks/useMasaustu";
import { pazGercek } from "@/lib/gercekVeri";
import {
  PAZ_STILLER, PAZ_KANCALAR, PAZ_ORTAMLAR, PAZ_KREDI, REKLAM_REFERANSLARI, ORNEK_URUNLER, KANCA_SEKMELERI, ORTAM_SEKMELERI, type StilTur,
} from "@/lib/pazarlamaVeri";
import { PAZ_AVATARLAR } from "@/lib/pazarlamaAvatar";
import { useElements } from "@/store/useElements";
import { Secici } from "./pazarlama/Secici";
import { Segment } from "@/components/montaj/ui";
import { FormatKarti } from "./pazarlama/FormatKarti";
import { ReklamGoruntuleyici, senaryoBloklari, type TarifSatiri } from "./pazarlama/ReklamGoruntuleyici";
import { KampanyaIzgarasi, type KampanyaBilgi } from "./pazarlama/Kampanya";
import { VitrinSahne, SERUM_SETI, type SahneVaryant } from "./pazarlama/Vitrin";

/**
 * Pazarlama Stüdyosu — ürünü video reklama çevirir.
 * Üstte ürün kartı (bağlantıdan bilgileri çek ya da görsel yükle), ortada format galerisi,
 * altta yüzen komut kutusu (format, avatar, kanca, ortam, referans reklam, ayarlar + senaryo).
 * Üretimler "Reklamlarım" görünümünde varyant ızgarası olarak toplanır.
 */
const ARAC = "Pazarlama Stüdyosu";
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const FORMAT_SEKMELERI: ["Tümü" | StilTur, string][] = [["Tümü", "Tümü"], ["UGC", "UGC"], ["TikTok", "TikTok"], ["Ticari", "Ticari"]];
const ORANLAR = [["9:16", "Dikey"], ["1:1", "Kare"], ["16:9", "Yatay"]] as const;

type Urun = { ad: string; aciklama: string; fiyat?: string; alan?: string; gorseller: string[] };
type Gorunum = "olustur" | "reklamlar" | "favoriler";
type Kurulum = { format?: string; avatar?: string; kanca?: string; ortam?: string; referans?: string; urun?: string; urunGorsel?: string };

const dosyaOku = (f: File) => new Promise<string>((coz, red) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.onerror = red; r.readAsDataURL(f); });
const gorece = (ms: number) => {
  const dk = Math.floor((Date.now() - ms) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  return sa < 24 ? `${sa} sa önce` : new Date(ms).toLocaleDateString("tr", { day: "numeric", month: "short" });
};

/** Ürün ve formata göre senaryo taslağı: kanca → gösterim → çağrı (şablondan, düzenlenebilir). */
function senaryoTaslagi(urun: Urun | null, formatAd: string, kancaIstem?: string, avatarAd?: string) {
  const ad = urun?.ad?.split(/[|–-]/)[0].trim();
  const kisi = avatarAd ?? "Konuşan kişi";
  const ozellik = urun?.aciklama ? urun.aciklama.split(/[.!?]/)[0].trim() : "Hayatımı gerçekten kolaylaştırdı";
  return [
    `Kanca: ${kancaIstem ?? (ad ? `"${ad} hakkında kimsenin söylemediği bir şey var."` : `"Bunu keşfetmeden önce her şeyi yanlış yapıyormuşum."`)}`,
    `Sahne (${formatAd}): ${kisi} elindeki ${ad ?? "ürünle"} kameraya döner. "${ozellik}."`,
    `Kapanış: "${ad ? `${ad} için` : "Bağlantı"} açıklamada; denemeye değer."`,
  ].join("\n");
}

/** Görseli 160 px'lik küçük önizlemeye indirir (kayıtta saklanır; büyük dosya depoya yazılmaz). */
function kucult(src: string): Promise<string> {
  if (!src.startsWith("data:")) return Promise.resolve(src);
  return new Promise((coz) => {
    const img = new Image();
    img.onload = () => {
      const o = Math.min(1, 160 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      coz(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => coz("");
    img.src = src;
  });
}

export function PazarlamaAna({ gomulu, projeId, onUretildi, baslangic = "olustur" }: StudyoGomuluProps & { baslangic?: "olustur" | "reklamlar" | "favoriler" } = {}) {
  const { aktifProjeId } = useAktifProje();
  const masaustu = useMasaustu();
  const tum = useProjeler((s) => s.uretimler);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const sil = useProjeler((s) => s.sil);
  const reklamlar = useMemo(() => tum.filter((u) => u.arac === ARAC), [tum]);

  const [gorunum, setGorunum] = useState<Gorunum>(baslangic);
  const [urun, setUrun] = useState<Urun | null>(null);
  const [link, setLink] = useState("");
  const [cekiliyor, setCekiliyor] = useState(false);
  const [sekme, setSekme] = useState<"Tümü" | StilTur>("Tümü");
  const [formatId, setFormatId] = useState("ugc");
  const [avatarId, setAvatarId] = useState<string | null>("a1");
  const [kancaId, setKancaId] = useState<string | null>(null);
  const [ortamId, setOrtamId] = useState<string | null>(null);
  const [refId, setRefId] = useState<string | null>(null);
  const [oran, setOran] = useState<string>("9:16");
  const [sure, setSure] = useState("15 sn");
  const [kalite, setKalite] = useState("720p");
  const [adet, setAdet] = useState(2);
  const [metin, setMetin] = useState("");
  const [cip, setCip] = useState<string | null>(null);
  const [avatarCins, setAvatarCins] = useState<"tum" | "kadin" | "erkek">("tum");
  const [avatarAra, setAvatarAra] = useState("");
  const [avatarOzel, setAvatarOzel] = useState("");
  /** Listede olmayan seçimler için kullanıcının tarifi (Format, Kanca, Ortam, Referans). */
  const [ozel, setOzel] = useState<Record<"format" | "kanca" | "ortam" | "ref", string>>({ format: "", kanca: "", ortam: "", ref: "" });
  const [ozelTaslak, setOzelTaslak] = useState<Record<string, string>>({});
  const [avatarOzelTaslak, setAvatarOzelTaslak] = useState("");
  const [kancaSek, setKancaSek] = useState("Tümü");
  const [ortamSek, setOrtamSek] = useState("Tümü");
  const [acikId, setAcikId] = useState<string | null>(null);
  const yukleRef = useRef<HTMLInputElement>(null);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const ustRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<Partial<Record<StilTur, HTMLDivElement | null>>>({});

  const format = PAZ_STILLER.find((s) => s.slug === formatId) ?? PAZ_STILLER[0];
  const avatar = PAZ_AVATARLAR.find((a) => a.id === avatarId) ?? null;
  /* Elementler › karakterler de avatar olarak seçilebilir. */
  const karakterler = useElements((st) => st.elementler).filter((e) => e.tur === "karakter");
  const [elAvatarId, setElAvatarId] = useState<string | null>(null);
  const elAvatar = karakterler.find((e) => e.id === elAvatarId) ?? null;
  /* Avatar menüsü kaynak sekmeleri: Hazır | Karakterlerin | Özel — menü açılınca seçimin olduğu sekme. */
  const [avKaynak, setAvKaynak] = useState<"hazir" | "karakter" | "ozel">("hazir");
  const [refKaynak, setRefKaynak] = useState<"liste" | "ozel">("liste");
  const [refKat, setRefKat] = useState("Tümü");
  const kanca = PAZ_KANCALAR.find((k) => k.slug === kancaId) ?? null;
  const ortam = PAZ_ORTAMLAR.find((o) => o.slug === ortamId) ?? null;
  const referans = REKLAM_REFERANSLARI.find((r) => r.id === refId) ?? null;
  const kredi = urun ? PAZ_KREDI.urunlu.indirimli : PAZ_KREDI.urunsuz.indirimli;
  const aktifIs = reklamlar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const liste = gorunum === "favoriler" ? reklamlar.filter((u) => u.favori) : reklamlar;
  const acik = acikId ? liste.find((u) => u.id === acikId) ?? null : null;
  const kampanyalar = useMemo(() => {
    const m = new Map<string, Uretim[]>();
    for (const u of liste) { const k = u.meta?.grupId ?? u.id; m.set(k, [...(m.get(k) ?? []), u]); }
    return [...m.values()].map((l) => l.sort((a, b) => (a.meta?.sira ?? 0) - (b.meta?.sira ?? 0)));
  }, [liste]);
  const izlenen = useMemo(() => kampanyalar.flat().filter((u) => u.durum === "tamam"), [kampanyalar]);

  useEffect(() => { setSure(format.sure); }, [format.sure]);
  useEffect(() => { if (cip === "ref") setRefKaynak(ozel.ref && !refId ? "ozel" : "liste"); }, [cip]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (cip === "avatar") setAvKaynak(elAvatarId ? "karakter" : avatarOzel && !avatarId ? "ozel" : "hazir"); }, [cip]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Ürün ── */
  const bilgiCek = async () => {
    const u = link.trim();
    if (!u) return toast.info("Ürün bağlantısı eksik", { description: "Önce ürün sayfasının bağlantısını yapıştır." });
    setCekiliyor(true);
    try {
      const r = await fetch("/api/ugc/urun", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u }) });
      const j = (await r.json()) as { ok: boolean; hata?: string; ad?: string; aciklama?: string; gorsel?: string; fiyat?: string; alan?: string };
      if (!j.ok) return toast.error("Ürün bilgileri çekilemedi", { description: `${neden(j.hata, "Sayfa okunamadı.")} Görsel yükleyerek devam edebilirsin.` });
      setUrun({ ad: j.ad ?? "", aciklama: j.aciklama ?? "", fiyat: j.fiyat, alan: j.alan, gorseller: j.gorsel ? [j.gorsel] : [] });
      toast.success("Ürün bilgileri çekildi", j.alan ? { description: `${j.alan} sayfasından alındı.` } : undefined);
    } catch {
      toast.error("Ürün sayfasına ulaşılamadı", { description: "Bağlantıyı kontrol et ya da görsel yükleyerek devam et." });
    } finally { setCekiliyor(false); }
  };
  const gorselYukle = async (dosyalar: FileList) => {
    const l = [...dosyalar].filter((f) => /^image\//.test(f.type) && f.size <= 12 * 1024 * 1024).slice(0, 5);
    if (!l.length) return toast.error("Görsel eklenemedi", { description: "PNG, JPG ya da WebP seç. Her görsel en çok 12 MB olabilir." });
    const veriler = await Promise.all(l.map(dosyaOku));
    setUrun((u) => u ? { ...u, gorseller: [...u.gorseller, ...veriler].slice(0, 5) } : { ad: l[0].name.replace(/\.[^.]+$/, ""), aciklama: "", gorseller: veriler });
  };
  const ornekUrun = (i: number) => {
    const o = ORNEK_URUNLER[i];
    setUrun({ ad: o.ad, aciklama: o.aciklama, alan: new URL(o.url).hostname.replace(/^www\./, ""), gorseller: [o.tohum, `${o.tohum}-2`].map((t) => pazGercek(t)).filter(Boolean) as string[] });
  };

  /* ── Üret ── */
  const senaryoYaz = () => {
    setMetin(senaryoTaslagi(urun, format.ad, kanca?.istem, avatar?.ad));
  };
  const eksik = !metin.trim() && !urun ? "Ürününü ekle ya da reklamı anlat" : null;
  const uret = async () => {
    if (eksik) { toast.info("Reklam üretimi başlatılamadı", { description: `${eksik}.` }); metinRef.current?.focus(); return; }
    const istem = [
      `${ozel.format || format.ad} formatında ${oran} video reklam.`,
      urun && `Ürün: ${urun.ad}. ${urun.aciklama}`,
      avatar && `Oyuncu: ${avatar.ad}.`,
      !avatar && elAvatar && `Oyuncu: ${elAvatar.ad} — ${elAvatar.aciklama}. Yüzü ve görünüşü referans görsellerdeki gibi tutarlı kalsın.`,
      !avatar && !elAvatar && avatarOzel && `Oyuncu: ${avatarOzel}.`,
      kanca ? `Kanca: ${kanca.istem}` : ozel.kanca && `Kanca: ${ozel.kanca}`,
      ortam ? `Ortam: ${ortam.istem}` : ozel.ortam && `Ortam: ${ozel.ortam}`,
      referans ? `Referans reklamın yapısını izle: ${referans.marka} — ${referans.baslik}.` : ozel.ref && `Şu reklamın yapısını izle: ${ozel.ref}.`,
      metin.trim(),
    ].filter(Boolean).join(" ");
    const denetim = icerikDenetle(istem);
    if (!denetim.izin) return toast.error("İçerik engellendi", { description: denetim.mesaj });
    const grupId = `paz_${Date.now().toString(36)}`;
    const urunGorsel = urun?.gorseller[0] ? (await kucult(urun.gorseller[0])) || undefined : undefined;
    const kurulum: Kurulum = { format: format.slug, avatar: avatar?.id, kanca: kanca?.slug, ortam: ortam?.slug, referans: referans?.id, urun: urun?.ad.split(/[|–-]/)[0].trim(), urunGorsel };
    const taban = reklamlar.length;
    let ilk: string | undefined;
    for (let i = 0; i < adet; i++) {
      const sonuc = uretimBaslat({
        baslik: `${format.ad}${urun ? ` · ${urun.ad.slice(0, 40)}` : ""}`, tur: "video", model: "Vayra Reklam 2", prompt: istem.slice(0, 1800),
        kredi, arac: ARAC, projeId: projeId ?? aktifProjeId ?? undefined,
        meta: { oran, cozunurluk: kalite, sure, hamIstem: metin.trim() || undefined, grupId, sira: i, kurulum, demoOrnek: (urun?.gorseller.length ? urun.gorseller[i % urun.gorseller.length] : undefined) ?? urunGorsel ?? pazGercek(format.tohumlar[(taban + i) % format.tohumlar.length]) },
        ...(urun?.gorseller.some((g) => g.startsWith("data:")) ? { girdi: { gorseller: urun.gorseller.filter((g) => g.startsWith("data:")).slice(0, 3) } } : {}),
      });
      if (!sonuc.ok) { uretimHataToast(sonuc); break; }
      ilk ??= sonuc.id;
      if (sonuc.id) onUretildi?.(sonuc.id);
    }
    if (ilk && !gomulu) { setGorunum("reklamlar"); ustRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };
  const ayarlariYukle = (u: Uretim) => {
    const k = (u.meta?.kurulum ?? {}) as Kurulum;
    if (k.format) setFormatId(k.format); setAvatarId(k.avatar ?? null); setKancaId(k.kanca ?? null); setOrtamId(k.ortam ?? null); setRefId(k.referans ?? null);
    if (u.meta?.oran) setOran(u.meta.oran); if (u.meta?.sure) setSure(u.meta.sure); if (u.meta?.cozunurluk) setKalite(u.meta.cozunurluk);
    setMetin(u.meta?.hamIstem ?? ""); setAcikId(null); setGorunum("olustur");
    toast.success("Ayarlar yüklendi", { description: "Komut kutusunda düzenleyip yeniden üretebilirsin." });
  };
  const indir = (u: Uretim, sessiz = false) => {
    if (!u.videoUrl) return;
    const a = document.createElement("a"); a.href = u.videoUrl; a.download = `${u.baslik.replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, "").slice(0, 40) || "reklam"}.mp4`; document.body.appendChild(a); a.click(); a.remove();
    if (!sessiz) toast.success("Video indiriliyor", { description: a.download });
  };

  /* ═══════════ ÇİPLER ═══════════ */
  const secAc = (ad: string) => ({ acik: cip === ad, setAcik: (v: boolean) => setCip(v ? ad : null) });
  const bosSecenek = (sec: boolean, ad: string, alt: string, onClick: () => void, ikon: React.ReactNode) => (
    <button key={`bos-${ad}`} onClick={onClick} aria-pressed={sec} className="group min-w-0 text-left">
      <span className={cn("relative flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.045] text-metin-2 transition-colors group-hover:bg-white/[0.07] group-hover:text-metin", sec && "text-metin")}>{ikon}<span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")} /></span>
      <span className={cn("mt-1 block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad}</span>
      <span className="block truncate text-[11.5px] text-metin-2">{alt}</span>
    </button>
  );
  const resimSecenek = (sec: boolean, ad: string, alt: string, src: string | undefined, onClick: () => void, oran = "aspect-[4/5]") => (
    <button key={`${ad}-${src}`} onClick={onClick} aria-pressed={sec} className="group min-w-0 text-left">
      <span className={cn("relative block overflow-hidden rounded-[12px] bg-white/[0.045]", oran)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
        <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")} />
      </span>
      <span className={cn("mt-1 block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad}</span>
      {alt && <span className="block truncate text-[11.5px] text-metin-2">{alt}</span>}
    </button>
  );
  const ozelKutu = (k: "format" | "kanca" | "ortam" | "ref", ph: string, alt: string, temizle: () => void) => {
    const t = ozelTaslak[k] ?? ozel[k];
    const uygula = () => { if (t.trim().length < 3) return; setOzel((o) => ({ ...o, [k]: t.trim() })); temizle(); setCip(null); };
    return (
      <div className={cn("mb-2.5 rounded-[14px] p-2 ring-1 ring-inset transition", ozel[k] ? "ring-white/50" : "ring-white/[0.08]")} style={{ background: "rgba(255,255,255,0.035)" }}>
        <div className="flex items-center gap-2 px-1 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.085] text-metin-2"><Sparkles className="h-3 w-3" /></span>
          <span className="text-[12.5px] font-semibold text-metin">Özel</span><span className="truncate text-[11.5px] text-metin-3">{alt}</span>
          {ozel[k] && <button onClick={() => { setOzel((o) => ({ ...o, [k]: "" })); setOzelTaslak((o) => ({ ...o, [k]: "" })); }} className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium text-metin-2 hover:bg-white/[0.085] hover:text-metin">Kaldır</button>}
        </div>
        <div className="flex gap-1.5">
          <input value={t} onChange={(e) => setOzelTaslak((o) => ({ ...o, [k]: e.target.value.slice(0, 160) }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); uygula(); } }} placeholder={ph} aria-label={`Özel ${k}`}
            className="h-9 min-w-0 flex-1 rounded-full bg-black/25 px-3.5 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-white/30" />
          <button disabled={t.trim().length < 3} onClick={uygula} className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">{ozel[k] ? "Güncelle" : "Uygula"}</button>
        </div>
      </div>
    );
  };
  const sekmeSecici = (deger: string, onDegis: (v: string) => void, secenekler: string[], id: string) => (
    <div role="radiogroup" className="mb-2.5 flex gap-0.5 rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.07]">
      {secenekler.map((s) => (
        <button key={s} role="radio" aria-checked={deger === s} onClick={() => onDegis(s)} className={cn("relative h-8 flex-1 rounded-full px-3 text-[12.5px] font-semibold transition-colors", deger === s ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
          {deger === s && <motion.span layoutId={`paz-sek-${id}`} transition={YAY} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{s}</span>
        </button>
      ))}
    </div>
  );

  /* Görsel slot (Ürün · Avatar · Format) ve hafif metin çipi tetikleyicileri. */
  const slot = (id: string, etiket: string, deger: string | null, gorsel: string | undefined, I: typeof Package, genislik: number, icerik: React.ReactNode) => (
    <Secici etiket={etiket} {...secAc(id)} genislik={genislik} tetik={({ acik, ac }) => (
      <motion.button whileTap={{ scale: 0.96 }} onClick={ac} aria-expanded={acik} aria-label={`${etiket}: ${deger ?? "seçilmedi"}`} title={etiket}
        className="group flex w-[64px] shrink-0 flex-col items-center gap-1.5 text-center">
        <span className={cn("relative block h-14 w-14 overflow-hidden rounded-[14px] transition-[outline-color,transform] group-hover:-translate-y-0.5",
          gorsel ? "bg-black" : "bg-white/[0.035]", acik ? "outline outline-2 -outline-offset-2 outline-white" : gorsel ? "outline outline-1 -outline-offset-1 outline-white/[0.12] group-hover:outline-white/30" : "outline-dashed outline-[1.5px] -outline-offset-[1.5px] outline-white/[0.2] group-hover:outline-white/45")}>
          <AnimatePresence initial={false}>
            {gorsel && <motion.img key={gorsel} src={gorsel} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 h-full w-full object-cover" />}
          </AnimatePresence>
          {!gorsel && <span className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.1] text-metin-2 transition-colors group-hover:bg-white group-hover:text-[#0a0a0b]"><Plus className="h-4 w-4" strokeWidth={2.5} /></span>}
        </span>
        <span className="w-full leading-tight">
          <span className="block text-[10.5px] text-metin-2">{etiket}</span>
          <span className={cn("block truncate text-[12px] font-semibold", deger ? "text-metin" : "text-metin-2")}>{deger ?? "Ekle"}</span>
        </span>
      </motion.button>
    )}>{icerik}</Secici>
  );
  const hafif = (id: string, etiket: string, deger: string, gorsel: string | undefined, I: typeof Package, secili: boolean, genislik: number, icerik: React.ReactNode) => (
    <Secici etiket={etiket} {...secAc(id)} genislik={genislik} tetik={({ acik, ac }) => (
      <button onClick={ac} aria-expanded={acik} title={etiket}
        className={cn("flex h-12 shrink-0 items-center gap-2.5 rounded-full pl-1.5 pr-3 text-[13.5px] ring-1 ring-inset transition-[color,background-color,transform] active:scale-[0.97]", acik ? "bg-white/[0.12] text-metin ring-white/20" : "bg-white/[0.08] text-metin ring-transparent hover:bg-white/[0.13]")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-white/85">
          {gorsel ? <img src={gorsel} alt="" className="h-full w-full object-cover" /> : <I className="h-4 w-4" />}{/* eslint-disable-line @next/next/no-img-element */}
        </span>
        <span className="flex max-w-[160px] flex-col items-start leading-tight"><span className="whitespace-nowrap text-[11px] text-white/55">{etiket}</span><span className={cn("max-w-full truncate whitespace-nowrap font-medium", !secili && "text-metin-2")}>{deger}</span></span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-metin-3 transition-transform", acik && "rotate-180")} />
      </button>
    )}>{icerik}</Secici>
  );

  const avatarlar = PAZ_AVATARLAR.filter((a) => (avatarCins === "tum" || a.cinsiyet === avatarCins) && (!avatarAra.trim() || a.ad.toLocaleLowerCase("tr").includes(avatarAra.trim().toLocaleLowerCase("tr"))));
  const urunSlot = slot("urun", "Ürün", urun ? urun.ad.split(/[|–-]/)[0].trim() : null, urun?.gorseller[0], Package, 420, (
    <div className="space-y-3 p-1">
      {urun && (
        <div className="overflow-hidden rounded-[16px] bg-black/20 ring-1 ring-inset ring-white/[0.08]">
          <div className="flex items-start gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {urun.gorseller[0] ? <img src={urun.gorseller[0]} alt="" className="h-16 w-16 shrink-0 rounded-[12px] object-cover" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.065]"><Package className="h-5 w-5 text-metin-2" /></span>}
            <div className="min-w-0 flex-1">
              <input value={urun.ad} onChange={(e) => setUrun((u) => u && { ...u, ad: e.target.value.slice(0, 120) })} aria-label="Ürün adı" spellCheck={false}
                className="w-full rounded-[8px] bg-transparent px-1 py-0.5 text-[14.5px] font-semibold text-metin outline-none transition hover:bg-white/[0.045] focus:bg-white/[0.065]" />
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 px-1">
                {urun.alan && <span className="flex items-center gap-1 rounded-full bg-white/[0.065] px-2 py-0.5 text-[11.5px] text-metin-2"><Link2 className="h-3 w-3" />{urun.alan}</span>}
                <input value={urun.fiyat ?? ""} onChange={(e) => setUrun((u) => u && { ...u, fiyat: e.target.value.slice(0, 20) || undefined })} placeholder="Fiyat ekle" aria-label="Fiyat"
                  className="h-6 w-[96px] rounded-full bg-white/[0.065] px-2.5 text-[11.5px] tabular-nums text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-white/25" />
              </div>
            </div>
          </div>
          <textarea value={urun.aciklama} onChange={(e) => setUrun((u) => u && { ...u, aciklama: e.target.value.slice(0, 600) })} rows={2} aria-label="Ürün açıklaması" placeholder="Ürünü bir iki cümleyle anlat: ne işe yarar, kimin için?"
            className="block w-full resize-none border-t border-white/[0.06] bg-transparent px-3.5 py-2.5 text-[12.5px] leading-snug text-metin-2 outline-none [field-sizing:content] placeholder:text-metin-3 focus:text-metin" />
          <div className="flex items-center gap-1.5 border-t border-white/[0.06] p-2">
            {urun.gorseller.slice(0, 5).map((g, i) => (
              <span key={i} className="group/g relative h-10 w-10 overflow-hidden rounded-[9px] ring-1 ring-inset ring-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g} alt="" className="h-full w-full object-cover" />
                <button onClick={() => setUrun((u) => u && { ...u, gorseller: u.gorseller.filter((_, j) => j !== i) })} aria-label="Görseli kaldır" className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover/g:opacity-100"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            {urun.gorseller.length < 5 && <button onClick={() => yukleRef.current?.click()} aria-label="Görsel ekle" className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-white/[0.065] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] hover:text-metin"><Plus className="h-4 w-4" /></button>}
            <button onClick={() => { setUrun(null); setLink(""); }} className="ml-auto flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-metin-2 transition hover:bg-white/[0.065] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-full bg-black/25 p-1 pl-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25">
        <Link2 className="h-4 w-4 shrink-0 text-metin-2" />
        <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { void bilgiCek(); setCip(null); } }} placeholder={urun ? "Başka bir ürün bağlantısı" : "Ürün sayfasının bağlantısı"} aria-label="Ürün bağlantısı" spellCheck={false}
          className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
        <button onClick={() => { void bilgiCek(); setCip(null); }} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-[#0b0c0e] active:scale-95"><Wand2 className="h-3.5 w-3.5" />Bilgileri çek</button>
      </div>
      <button onClick={() => { yukleRef.current?.click(); setCip(null); }} className="flex w-full items-center gap-3 rounded-[14px] bg-black/20 p-2.5 text-left ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.045]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.085]"><ImagePlus className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-metin">Ürün görseli yükle</span><span className="block text-[11.5px] text-metin-3">PNG, JPG ya da WebP · en çok 5 görsel</span></span>
      </button>
      <div>
        <p className="mb-1.5 px-0.5 text-[12px] font-semibold text-metin-2">Örnek ürünler</p>
        <div className="grid grid-cols-3 gap-2">
          {ORNEK_URUNLER.map((o, i) => resimSecenek(urun?.ad === o.ad, ["Finovela", "Serum", "Kahve seti"][i] ?? o.ad, new URL(o.url).hostname.replace(/^www\./, ""), pazGercek(o.tohum), () => { ornekUrun(i); setCip(null); }, "aspect-square"))}
        </div>
      </div>
    </div>
  ));
  const avatarSlot = slot("avatar", "Avatar", avatar?.ad ?? (elAvatar ? `@${elAvatar.ad}` : avatarOzel ? "Özel" : "Avatarsız"), avatar ? pazGercek(avatar.tohum) : elAvatar?.gorseller[0], UserRound, 580, (
    <>
      <div className="mb-2.5 flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-black/25 px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25 max-sm:flex-none">
          <Search className="h-3.5 w-3.5 text-metin-3" />
          <input value={avatarAra} onChange={(e) => setAvatarAra(e.target.value)} placeholder="Avatar ara" aria-label="Avatar ara" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
        </label>
        <div className="w-[230px] shrink-0 max-sm:w-full [&>div]:mb-0">{sekmeSecici(avatarCins === "tum" ? "Tümü" : avatarCins === "kadin" ? "Kadın" : "Erkek", (v) => setAvatarCins(v === "Tümü" ? "tum" : v === "Kadın" ? "kadin" : "erkek"), ["Tümü", "Kadın", "Erkek"], "av")}</div>
      </div>
      <div role="tablist" aria-label="Avatar kaynağı" className="mb-3 flex gap-1 rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.07]">
        {([["hazir", "Hazır avatarlar", PAZ_AVATARLAR.length, !!avatar], ["karakter", "Karakterlerin", karakterler.length, !!elAvatar], ["ozel", "Özel", 0, !!avatarOzel && !avatar && !elAvatar]] as const).map(([id, ad, n, secili]) => (
          <button key={id} role="tab" aria-selected={avKaynak === id} onClick={() => setAvKaynak(id)}
            className={cn("relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors", avKaynak === id ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
            {avKaynak === id && <motion.span layoutId="av-kaynak" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative">{id === "hazir" ? <><span className="sm:hidden">Hazır</span><span className="max-sm:hidden">{ad}</span></> : ad}</span>
            {n > 0 && <span className={cn("relative rounded-full px-1.5 text-[11px] tabular-nums leading-[17px]", avKaynak === id ? "bg-black/10 text-black/60" : "bg-white/[0.1] text-metin-2")}>{n}</span>}
            {secili && <span className={cn("relative h-1.5 w-1.5 rounded-full", avKaynak === id ? "bg-black/50" : "bg-aksan")} title="Seçimin burada" />}
          </button>
        ))}
      </div>
      {avKaynak === "hazir" && (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {bosSecenek(!avatar && !avatarOzel && !elAvatar, "Avatarsız", "", () => { setAvatarId(null); setAvatarOzel(""); setElAvatarId(null); setCip(null); }, <Package className="h-5 w-5" />)}
            {avatarlar.map((a) => resimSecenek(a.id === avatarId, a.benim ? `${a.ad} · Senin` : a.ad, "", pazGercek(a.tohum), () => { setAvatarId(a.id); setAvatarOzel(""); setElAvatarId(null); setCip(null); }))}
          </div>
          {avatarlar.length === 0 && <p className="px-1 py-4 text-center text-[12.5px] text-metin-3">"{avatarAra}" adında avatar yok; Özel sekmesinde tarif edebilirsin.</p>}
        </>
      )}
      {avKaynak === "karakter" && (() => {
        const q = avatarAra.trim().toLocaleLowerCase("tr");
        const kl = karakterler.filter((e) => !q || e.ad.toLocaleLowerCase("tr").includes(q));
        return (
          <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.085] text-metin-2"><UserRound className="h-3 w-3" /></span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-metin-2">Elementler'deki karakterlerin; yüzü her reklamda aynı kalır</span>
              <a href="/panel/element" className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/[0.085] px-2.5 text-[12px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12]">Elementler<ChevronRight className="h-3 w-3" /></a>
            </div>
            {karakterler.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <span className="flex -space-x-3">
                  {["av-mei", "av-emma", "av-kai"].map((t, i) => <img key={t} src={"/gercek/paz/" + t + ".webp"} alt="" className={cn("h-12 w-12 rounded-full object-cover ring-4 ring-[#1a1b1e]", i === 1 && "relative z-10 -translate-y-1")} />)}{/* eslint-disable-line @next/next/no-img-element */}
                </span>
                <p className="mt-4 text-[14px] font-semibold text-metin">Henüz karakterin yok</p>
                <p className="mt-1 max-w-[340px] text-[12.5px] leading-relaxed text-metin-2">Elementler sayfasında bir kez karakter oluştur; her reklamda aynı yüzle oynasın.</p>
                <a href="/panel/element" className="mt-4 flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0a0a0b] transition hover:bg-white/90"><Plus className="h-4 w-4" />Karakter oluştur</a>
              </div>
            ) : (
            <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-5">
              {kl.map((e) => {
                const sec = e.id === elAvatarId; const g = e.gorseller[0];
                return (
                  <button key={e.id} onClick={() => { setElAvatarId(e.id); setAvatarId(null); setAvatarOzel(""); setCip(null); }} aria-pressed={sec} className="group min-w-0 text-left">
                    <span className="relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-gradient-to-br from-white/[0.09] to-white/[0.02]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {g ? <img src={g} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        : <span className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold uppercase text-metin-2">{e.ad.trim().slice(0, 1)}</span>}
                      <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")} />
                    </span>
                    <span className={cn("mt-1 block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")} title={e.ad}>{e.ad}</span>
                  </button>
                );
              })}
              <a href="/panel/element" className="group min-w-0 text-left">
                <span className="flex aspect-[4/5] items-center justify-center rounded-[12px] border border-dashed border-white/[0.14] text-metin-2 transition group-hover:border-white/30 group-hover:text-metin"><Plus className="h-5 w-5" /></span>
                <span className="mt-1 block truncate text-[12.5px] font-medium text-metin-2">Yeni karakter</span>
              </a>
            </div>
            )}
            {karakterler.length > 0 && kl.length === 0 && <p className="px-3 pb-3 text-center text-[12.5px] text-metin-3">"{avatarAra}" adında karakter yok.</p>}
          </div>
        );
      })()}
      {avKaynak === "ozel" && (
        <div className={cn("rounded-[14px] p-2.5 ring-1 ring-inset transition-colors", avatarOzel && !avatar && !elAvatar ? "ring-white/50" : "ring-white/[0.08]")} style={{ background: "rgba(255,255,255,0.035)" }}>
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.085] text-metin-2"><Sparkles className="h-3 w-3" /></span>
            <span className="text-[12.5px] font-semibold text-metin">Oyuncuyu tarif et</span><span className="text-[11.5px] text-metin-3">Yaş, görünüş, tavır</span>
            {avatarOzel && !avatar && !elAvatar && <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Seçili</span>}
          </div>
          <textarea value={avatarOzelTaslak} onChange={(e) => setAvatarOzelTaslak(e.target.value.slice(0, 160))} rows={3} spellCheck={false}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && avatarOzelTaslak.trim().length >= 3) { e.preventDefault(); setAvatarOzel(avatarOzelTaslak.trim()); setAvatarId(null); setElAvatarId(null); setCip(null); } }}
            placeholder="Ör. 30'larında, kısa saçlı, gülümseyen bir kadın; mutfakta, samimi" aria-label="Özel avatar tarifi"
            className="block w-full resize-none rounded-[12px] bg-black/25 px-3.5 py-2.5 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-white/30" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {["20'lerinde sporcu erkek", "Ellili yaşlarda anne", "Gözlüklü yazılımcı kadın", "Sakallı berber"].map((o) => (
              <button key={o} onClick={() => setAvatarOzelTaslak(o)} className="h-7 rounded-full bg-white/[0.065] px-2.5 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.1] hover:text-metin">{o}</button>
            ))}
            <button disabled={avatarOzelTaslak.trim().length < 3} onClick={() => { setAvatarOzel(avatarOzelTaslak.trim()); setAvatarId(null); setElAvatarId(null); setCip(null); }} className="ml-auto h-8 shrink-0 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">Uygula</button>
          </div>
        </div>
      )}
    </>
  ));
  const formatSlot = hafif("format", "Format", ozel.format ? "Özel" : format.ad, ozel.format ? undefined : pazGercek(format.tohumlar[0]), Clapperboard, true, 540, (
    <>
      {ozelKutu("format", "Ör. Ürünü mutfakta tarif yaparken tanıtan kısa vlog", "Listede yoksa formatı tarif et", () => {})}
      {sekmeSecici(sekme, (v) => setSekme(v as "Tümü" | StilTur), FORMAT_SEKMELERI.map(([v]) => v), "fmt")}
      <div className="grid grid-cols-4 gap-2">
        {PAZ_STILLER.filter((x) => sekme === "Tümü" || x.tur === sekme).map((x) => resimSecenek(x.slug === formatId && !ozel.format, x.ad, x.ozet, pazGercek(x.tohumlar[0]), () => { setFormatId(x.slug); setOzel((o) => ({ ...o, format: "" })); setCip(null); }, "aspect-[9/16]"))}
      </div>
    </>
  ));
  const kancaCipi = hafif("kanca", "Kanca", kanca?.ad ?? (ozel.kanca ? "Özel" : "Doğal açılış"), kanca ? pazGercek(kanca.tohum) : undefined, Zap, !!kanca || !!ozel.kanca, 480, (
    <>
      {ozelKutu("kanca", "Ör. İlk saniyede ürünü yere düşürüp yakalasın", "Listede yoksa açılışı tarif et", () => setKancaId(null))}
      {sekmeSecici(kancaSek, setKancaSek, KANCA_SEKMELERI, "kn")}
      <div className="grid grid-cols-4 gap-2">
        {bosSecenek(!kanca && !ozel.kanca, "Kanca yok", "Doğal açılış", () => { setKancaId(null); setOzel((o) => ({ ...o, kanca: "" })); setCip(null); }, <X className="h-5 w-5" />)}
        {PAZ_KANCALAR.filter((x) => kancaSek === "Tümü" || x.kat === kancaSek).map((x) => resimSecenek(x.slug === kancaId, x.ad, x.ozet, pazGercek(x.tohum), () => { setKancaId(x.slug); setOzel((o) => ({ ...o, kanca: "" })); setCip(null); }))}
      </div>
    </>
  ));
  const ortamCipi = hafif("ortam", "Ortam", ortam?.ad ?? (ozel.ortam ? "Özel" : "Formata göre"), ortam ? pazGercek(ortam.tohum) : undefined, MapPin, !!ortam || !!ozel.ortam, 480, (
    <>
      {ozelKutu("ortam", "Ör. Sabah güneşi alan, bitkili küçük bir balkon", "Listede yoksa mekânı tarif et", () => setOrtamId(null))}
      {sekmeSecici(ortamSek, setOrtamSek, ORTAM_SEKMELERI, "or")}
      <div className="grid grid-cols-4 gap-2">
        {bosSecenek(!ortam && !ozel.ortam, "Formata göre", "Otomatik", () => { setOrtamId(null); setOzel((o) => ({ ...o, ortam: "" })); setCip(null); }, <Sparkles className="h-5 w-5" />)}
        {PAZ_ORTAMLAR.filter((x) => ortamSek === "Tümü" || x.kat === ortamSek).map((x) => resimSecenek(x.slug === ortamId, x.ad, x.ozet, pazGercek(x.tohum), () => { setOrtamId(x.slug); setOzel((o) => ({ ...o, ortam: "" })); setCip(null); }))}
      </div>
    </>
  ));
  const REF_KATLAR = ["Tümü", ...Array.from(new Set(REKLAM_REFERANSLARI.map((r) => r.kategori)))];
  const refCipi = hafif("ref", "Referans", referans ? referans.marka : ozel.ref ? "Özel" : "Yok", referans ? pazGercek(referans.tohum) : undefined, Clapperboard, !!referans || !!ozel.ref, 600, (
    <>
      <div role="tablist" aria-label="Referans kaynağı" className="mb-3 flex gap-1 rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.07]">
        {([["liste", "Reklam kütüphanesi", REKLAM_REFERANSLARI.length, !!referans], ["ozel", "Özel", 0, !!ozel.ref && !referans]] as const).map(([id, ad, n, secili]) => (
          <button key={id} role="tab" aria-selected={refKaynak === id} onClick={() => setRefKaynak(id)}
            className={cn("relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors", refKaynak === id ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
            {refKaynak === id && <motion.span layoutId="ref-kaynak" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative">{ad}</span>
            {n > 0 && <span className={cn("relative rounded-full px-1.5 text-[11px] tabular-nums leading-[17px]", refKaynak === id ? "bg-black/10 text-black/60" : "bg-white/[0.1] text-metin-2")}>{n}</span>}
            {secili && <span className={cn("relative h-1.5 w-1.5 rounded-full", refKaynak === id ? "bg-black/50" : "bg-aksan")} title="Seçimin burada" />}
          </button>
        ))}
      </div>
      {refKaynak === "liste" ? (
        <>
          <div className="gizli-scroll -mx-0.5 mb-2.5 flex gap-1.5 overflow-x-auto px-0.5">
            {REF_KATLAR.map((k) => (
              <button key={k} onClick={() => setRefKat(k)} aria-pressed={refKat === k}
                className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition-colors", refKat === k ? "bg-white text-[#0a0a0b] ring-white" : "bg-white/[0.065] text-metin-2 ring-white/[0.07] hover:bg-white/[0.1] hover:text-metin")}>{k}</button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button onClick={() => { setRefId(null); setOzel((o) => ({ ...o, ref: "" })); setCip(null); }} aria-pressed={!referans && !ozel.ref} title="Referans kullanma; reklam seçili formatın kalıbını izler"
              className="group relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-white/[0.16] px-2 text-center transition-colors hover:border-white/35 hover:bg-white/[0.03]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.085] text-metin-2 group-hover:text-metin"><X className="h-4 w-4" /></span>
              <span className="text-[12px] font-semibold leading-tight text-metin">Referanssız</span>
              <span className="text-[11px] leading-tight text-metin-3">Formatın kalıbı</span>
              {!referans && !ozel.ref && <span className="pointer-events-none absolute -inset-px rounded-[12px] ring-2 ring-inset ring-white" />}
            </button>
            {REKLAM_REFERANSLARI.filter((x) => refKat === "Tümü" || x.kategori === refKat).map((x) => {
              const sec = x.id === refId;
              return (
                <button key={x.id} onClick={() => { setRefId(x.id); setOzel((o) => ({ ...o, ref: "" })); setCip(null); }} aria-pressed={sec} title={x.baslik}
                  className="group relative aspect-[3/4] overflow-hidden rounded-[12px] bg-white/[0.045] text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pazGercek(x.tohum)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  <span className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 text-[10.5px] font-semibold leading-[18px] text-white backdrop-blur-md">{x.platform} · {x.sure}</span>
                  <span className="absolute inset-x-2 bottom-1.5 leading-tight">
                    <span className="block truncate text-[12px] font-semibold text-white">{x.marka}</span>
                    <span className="line-clamp-2 text-[10.5px] text-white/70">{x.baslik}</span>
                  </span>
                  <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")} />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className={cn("rounded-[14px] p-2.5 ring-1 ring-inset transition-colors", ozel.ref ? "ring-white/50" : "ring-white/[0.08]")} style={{ background: "rgba(255,255,255,0.035)" }}>
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.085] text-metin-2"><Sparkles className="h-3 w-3" /></span>
            <span className="text-[12.5px] font-semibold text-metin">Beğendiğin reklamı anlat</span><span className="truncate text-[11.5px] text-metin-3">Kanca, tempo ve kapanış ürününe uyarlanır</span>
            {ozel.ref && <button onClick={() => { setOzel((o) => ({ ...o, ref: "" })); setOzelTaslak((o) => ({ ...o, ref: "" })); }} className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium text-metin-2 hover:bg-white/[0.085] hover:text-metin">Kaldır</button>}
          </div>
          <textarea value={ozelTaslak.ref ?? ozel.ref} onChange={(e) => setOzelTaslak((o) => ({ ...o, ref: e.target.value.slice(0, 240) }))} rows={3} spellCheck={false} aria-label="Özel referans"
            onKeyDown={(e) => { const t = (ozelTaslak.ref ?? ozel.ref).trim(); if (e.key === "Enter" && !e.shiftKey && t.length >= 3) { e.preventDefault(); setOzel((o) => ({ ...o, ref: t })); setRefId(null); setCip(null); } }}
            placeholder="Ör. Önce/sonra karşılaştırmalı, hızlı kesmeli; ilk saniyede sonuç, sonda fiyat"
            className="block w-full resize-none rounded-[12px] bg-black/25 px-3.5 py-2.5 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-3 focus:ring-white/30" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {["Önce ve sonra, hızlı kesme", "Sokak röportajı", "Kutu açma, yakın çekim", "Üç neden listesi"].map((o) => (
              <button key={o} onClick={() => setOzelTaslak((t) => ({ ...t, ref: o }))} className="h-7 rounded-full bg-white/[0.065] px-2.5 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.1] hover:text-metin">{o}</button>
            ))}
            <button disabled={(ozelTaslak.ref ?? ozel.ref).trim().length < 3} onClick={() => { setOzel((o) => ({ ...o, ref: (ozelTaslak.ref ?? ozel.ref).trim() })); setRefId(null); setCip(null); }}
              className="ml-auto h-8 shrink-0 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">{ozel.ref ? "Güncelle" : "Uygula"}</button>
          </div>
        </div>
      )}
    </>
  ));
  const ayarCipi = hafif("ayar", "Oran · süre", `${oran} · ${sure} · ${kalite}`, undefined, Settings2, true, 340, (
    <div className="space-y-3.5 p-1">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-metin">Oran</p>
        <div className="grid grid-cols-3 gap-2">
          {ORANLAR.map(([o, ad]) => {
            const [w, h] = o.split(":").map(Number); const sec = oran === o;
            return (
              <button key={o} onClick={() => setOran(o)} aria-pressed={sec}
                className={cn("flex flex-col items-center gap-1.5 rounded-[12px] py-2.5 ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/25" : "ring-white/[0.08] hover:bg-white/[0.04]")}>
                <span className={cn("rounded-[4px] border-2", sec ? "border-aksan" : "border-metin-2")} style={{ width: 26 * Math.min(1, w / h), height: 26 * Math.min(1, h / w) }} />
                <span className={cn("text-[12px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad} <span className="tabular-nums text-metin-2">{o}</span></span>
              </button>
            );
          })}
        </div>
      </div>
      <div><p className="mb-1.5 text-[13px] font-medium text-metin">Süre</p><Segment deger={sure} onDegis={setSure} etiket="Süre" secenekler={[["8 sn", "8 sn"], ["10 sn", "10 sn"], ["15 sn", "15 sn"]]} /></div>
      <div><p className="mb-1.5 text-[13px] font-medium text-metin">Kalite</p><Segment deger={kalite} onDegis={setKalite} etiket="Kalite" secenekler={[["720p", "720p"], ["1080p", "1080p"]]} /></div>
      <div><p className="mb-1.5 text-[13px] font-medium text-metin">Varyant</p><Segment deger={adet} onDegis={setAdet} etiket="Varyant" secenekler={[[1, "1"], [2, "2"], [3, "3"], [4, "4"]]} /></div>
    </div>
  ));

  const hazirMi = !eksik;
  const uretDugmesi = (
    <div className={cn("flex h-12 shrink-0 items-center rounded-[14px] p-1 transition-[background-color] duration-300 max-sm:w-full", hazirMi ? "bg-white" : "bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]")}>
      <Secici etiket="Kaç varyant?" {...secAc("adet")} genislik={220} tetik={({ acik, ac }) => (
        <button onClick={ac} aria-expanded={acik} aria-label={`Varyant sayısı: ${adet}`} title="Aynı ayarla kaç reklam"
          className={cn("flex h-10 items-center gap-0.5 rounded-[11px] pl-3 pr-2 text-[13px] font-bold tabular-nums transition-colors", hazirMi ? "text-[#0a0a0b] hover:bg-black/[0.06]" : "text-metin-2 hover:bg-white/[0.06]")}>
          {adet}×<ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
        </button>
      )}>
        <div className="p-1">
          {[1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => { setAdet(n); setCip(null); }} aria-pressed={adet === n} className={cn("relative flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition-colors", adet === n ? "bg-white/[0.085]" : "hover:bg-white/[0.055]")}>
              <span className="flex-1 text-[13px] font-medium text-metin">{n} reklam</span>
              <span className="text-[11.5px] tabular-nums text-metin-3">{kredi * n} kredi</span>
              {adet === n && <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-white/40" />}
            </button>
          ))}
        </div>
      </Secici>
      <span aria-hidden className={cn("h-5 w-px", hazirMi ? "bg-black/15" : "bg-white/10")} />
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => void uret()} title={eksik ?? "Üret (Ctrl+Enter)"}
        className={cn("group flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[11px] pl-3 pr-1 text-[14.5px] font-semibold transition-colors", hazirMi ? "text-[#0a0a0b] hover:bg-black/[0.04]" : "text-metin-3")}>
        <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />Üret
        <motion.span key={adet} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className={cn("flex h-7 items-center rounded-full px-2.5 text-[11.5px] font-semibold tabular-nums", hazirMi ? "bg-black/[0.08]" : "bg-white/[0.06] text-metin-3")}>{kredi * adet} kredi</motion.span>
      </motion.button>
    </div>
  );

  const bl = senaryoBloklari(metin);
  const taslakBloklari = bl.length === 3 && bl.every((b) => b.ad) ? bl : null;
  const komut = (
    <div className="cam-istemci pointer-events-auto w-full min-w-0 rounded-[26px] p-3"
      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void uret(); } }}>
      <div className="flex items-start gap-3 max-sm:flex-wrap">
      <div className="flex shrink-0 gap-2">{urunSlot}{avatarSlot}</div>
      <div className="flex min-w-0 flex-1 flex-col max-sm:order-last max-sm:basis-full">
        {taslakBloklari ? (
          <div className="max-h-[132px] flex-1 space-y-1 overflow-y-auto py-0.5 [scrollbar-width:thin]">
            {taslakBloklari.map((b, i) => (
              <div key={b.ad} className="flex items-start gap-2">
                <span className={cn("mt-[3px] w-[64px] shrink-0 rounded-full py-0.5 text-center text-[11px] font-semibold", { Kanca: "bg-amber-300/15 text-amber-200", Sahne: "bg-aksan/15 text-aksan", Kapanış: "bg-violet-400/15 text-violet-200" }[b.ad])}>{b.ad}</span>
                <textarea value={b.metin} rows={1} spellCheck={false} aria-label={b.ad}
                  onChange={(e) => setMetin(taslakBloklari.map((x, j) => `${x.ad}${x.ad === "Sahne" ? ` (${format.ad})` : ""}: ${j === i ? e.target.value.replace(/\n/g, " ") : x.metin}`).join("\n"))}
                  className="block min-w-0 flex-1 resize-none bg-transparent text-[14px] leading-snug text-metin outline-none [field-sizing:content]" />
              </div>
            ))}
          </div>
        ) : (
          <textarea ref={metinRef} value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 1500))} rows={2} spellCheck={false} aria-label="Senaryo"
            placeholder={urun ? `${urun.ad.split(/[|–-]/)[0].trim().slice(0, 40)} için reklamı anlat ya da senaryo taslağı al…` : "Reklamı anlat: kanca, sahne, söylenecek cümle…"}
            className="block max-h-[150px] min-h-[52px] w-full flex-1 resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed text-metin outline-none [field-sizing:content] placeholder:text-metin-2" />
        )}
      </div>
      <div className="flex shrink-0 items-center rounded-full bg-white/[0.035] p-0.5 ring-1 ring-inset ring-white/[0.07]">
          <button onClick={taslakBloklari ? () => setMetin("") : senaryoYaz} title={taslakBloklari ? "Taslağı temizle, serbest yaz" : "Ürün, format ve kancadan senaryo taslağı yazar"}
            className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin">
            {taslakBloklari ? <><PenLine className="h-4 w-4" />Serbest yaz</> : <><FileText className="h-4 w-4" />Senaryo taslağı</>}
          </button>
      </div>
      </div>
      <div className="mt-3 flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
        <div className="gizli-scroll min-w-0 flex-1 overflow-x-auto sm:pr-5 sm:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
          <div className="flex w-max gap-1.5">{formatSlot}{kancaCipi}{ortamCipi}{refCipi}{ayarCipi}</div>
        </div>
        {uretDugmesi}
      </div>
    </div>
  );

  if (gomulu) return <MotionConfig reducedMotion="user">{komut}</MotionConfig>;

  /* ═══════════ VİTRİN ═══════════
     Solda başlık + ürün girişi (bağlantı, yükleme, örnek ürünler) ya da eklenen ürünün kartı;
     sağda ürün → reklam mekanizması (Vitrin). */
  const urunGirisi = !urun ? (
    <>
      <div className="mt-6 flex items-center gap-2 rounded-full bg-black/25 p-1.5 pl-4 ring-1 ring-inset ring-white/[0.1] transition-shadow focus-within:ring-white/30">
        <Link2 className="h-[18px] w-[18px] shrink-0 text-metin-2" />
        <input ref={linkRef} value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void bilgiCek()} placeholder="Ürün sayfasının bağlantısını yapıştır" aria-label="Ürün bağlantısı" spellCheck={false}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-metin outline-none placeholder:text-metin-2" />
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => void bilgiCek()} disabled={cekiliyor}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] transition hover:bg-white/90 disabled:opacity-60">
          {cekiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Bilgileri çek
        </motion.button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => yukleRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12] active:scale-95">
          <ImagePlus className="h-4 w-4" />Görsel yükle
        </button>
        {ORNEK_URUNLER.map((o, i) => (
          <motion.button whileTap={{ scale: 0.96 }} key={o.id} onClick={() => ornekUrun(i)} title={o.ad}
            className="flex h-9 items-center gap-2 rounded-full bg-white/[0.065] py-1 pl-1 pr-3 text-[13px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-metin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pazGercek(o.tohum)} alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="whitespace-nowrap">{["Finovela", "Serum", "Kahve seti"][i] ?? o.ad}</span>
          </motion.button>
        ))}
      </div>
    </>
  ) : (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY}
      className="mt-6 rounded-[20px] bg-black/20 p-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/20">
      <div className="flex items-center gap-1.5">
        <span className="text-[12.5px] font-medium text-metin-2">Ürün bilgileri</span>
        {urun.alan && <span className="flex min-w-0 items-center gap-1 truncate rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-metin-2"><Link2 className="h-3 w-3 shrink-0" />{urun.alan}</span>}
        {urun.fiyat && <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-metin">{urun.fiyat}</span>}
        <button onClick={() => { setUrun(null); setLink(""); }} className="ml-auto flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin"><Repeat className="h-3.5 w-3.5" />Değiştir</button>
      </div>
      <input value={urun.ad} onChange={(e) => setUrun((u) => u && { ...u, ad: e.target.value.slice(0, 120) })} aria-label="Ürün adı" spellCheck={false}
        className="mt-1.5 w-full rounded-[8px] bg-transparent px-1 py-0.5 text-[17px] font-semibold tracking-tight text-metin outline-none transition-colors hover:bg-white/[0.04] focus:bg-white/[0.05]" />
      <textarea value={urun.aciklama} onChange={(e) => setUrun((u) => u && { ...u, aciklama: e.target.value.slice(0, 600) })} rows={2} spellCheck={false} aria-label="Ürün açıklaması"
        placeholder="Ürünü bir iki cümleyle anlat: ne işe yarar, kimin için?"
        className="block w-full resize-none rounded-[8px] bg-transparent px-1 py-0.5 text-[13.5px] leading-relaxed text-metin-2 outline-none transition-colors [field-sizing:content] placeholder:text-metin-2 hover:bg-white/[0.03] focus:bg-white/[0.05] focus:text-metin" />
    </motion.div>
  );
  const SAYI = ["bir", "iki", "üç", "dört"];
  /* Sahne: ürün yokken (ya da örnek serum seçiliyken) gerçek serum seti; başka üründe ürün görselleri + formatın kareleri. */
  const serumMu = !urun || /lumea|serum/i.test((urun.alan ?? "") + urun.ad);
  const urunKisa = urun ? urun.ad.split(/[|–]/)[0].trim() : "Gece Onarıcı Serum";
  const ALTYAZI = [kanca?.ozet ?? `${urunKisa} ile tanış`, "Herkes bunu soruyor", "Bir haftada fark", "Neden bu kadar sevildi?"];
  const sahneVaryantlari: SahneVaryant[] = serumMu ? SERUM_SETI : Array.from({ length: 4 }, (_, k) => {
    const fk = format.tohumlar.map((t) => pazGercek(t)).filter(Boolean) as string[];
    const ug2 = urun?.gorseller ?? []; const kr = ug2.length ? ug2.map((_, j) => ug2[(j + k) % ug2.length]) : fk.slice(0, 1);
    return { etiket: [format.ad, "Ürün odaklı", "Kısa demo", "Yorum"][k], altyazi: ALTYAZI[k], kareler: kr };
  });
  const vitrin = (
    <section className="relative overflow-hidden rounded-[28px] bg-[#141517] ring-1 ring-inset ring-white/[0.07]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,#000,transparent_65%)]" />
      <div className="relative grid items-center gap-6 px-10 py-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] max-lg:p-7 max-sm:p-5">
        <div className="min-w-0">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={YAY}
            className="text-[clamp(32px,3.6vw,50px)] font-semibold leading-[1.04] tracking-[-0.03em] text-metin">
            Bir bağlantı,{" "}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={adet} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                className="inline-block text-aksan">{SAYI[adet - 1] ?? adet} reklam</motion.span>
            </AnimatePresence>
          </motion.h1>
          <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-metin-2">Ürün sayfanı yapıştır; aynı üründen {SAYI[adet - 1] ?? adet} farklı reklam çıkar. Her biri başka bir kanca, sahne ve anlatımla.</p>
          {urunGirisi}
          <div className="mt-7 grid grid-cols-3 gap-2.5 max-sm:gap-2">
            {([
              ["avatar", PAZ_AVATARLAR.length, "hazır avatar", PAZ_AVATARLAR.slice(1, 4).map((a) => pazGercek(a.tohum))],
              ["kanca", PAZ_KANCALAR.length, "kanca", PAZ_KANCALAR.slice(0, 3).map((k) => pazGercek(k.tohum))],
              ["format", PAZ_STILLER.length, "reklam formatı", PAZ_STILLER.slice(0, 3).map((f) => pazGercek(f.tohumlar[0]))],
            ] as const).map(([id, n, ad, gl]) => (
              <motion.button key={id} whileTap={{ scale: 0.97 }} onClick={() => setCip(id)} title={`${ad} seç`}
                className="group flex flex-col items-start gap-2.5 rounded-[16px] bg-white/[0.04] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.07] hover:ring-white/[0.14]">
                <span className="flex -space-x-2.5">
                  {gl.map((g, k) => (
                    <span key={k} className="h-9 w-9 overflow-hidden rounded-full bg-white/[0.08] ring-[3px] ring-[#17181b] transition-transform group-hover:-translate-y-0.5 max-sm:h-7 max-sm:w-7" style={{ transitionDelay: `${k * 30}ms` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {g && <img src={g} alt="" className="h-full w-full object-cover" />}
                    </span>
                  ))}
                </span>
                <span className="leading-tight">
                  <span className="block text-[19px] font-semibold tabular-nums tracking-tight text-metin">{n}</span>
                  <span className="block text-[12.5px] text-metin-2">{ad}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
        <VitrinSahne adet={adet} varyantlar={sahneVaryantlari} urunAd={urunKisa} urunGorsel={urun?.gorseller[0] ?? (serumMu ? "/gercek/paz/urun-serum.webp" : undefined)} sure={sure} />
      </div>
    </section>
  );

  /* Kategori rafı: yatay kayan format kartları, sağda ok düğmeleri. */
  const raf = (tur: StilTur, baslik: string, alt: string) => {
    const l = PAZ_STILLER.filter((x) => x.tur === tur);
    return (
      <section key={tur} className="mt-5 overflow-hidden rounded-[24px] bg-[#141517] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-metin">{baslik}<span className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{l.length}</span></h2>
            <p className="mt-0.5 text-[13px] text-metin-2">{alt}</p>
          </div>
          <div className="flex gap-1.5 max-sm:hidden">
            {([-1, 1] as const).map((y) => (
              <button key={y} onClick={() => rafRef.current[tur]?.scrollBy({ left: y * 640, behavior: "smooth" })} aria-label={y < 0 ? "Geri kaydır" : "İleri kaydır"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.065] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] hover:text-metin active:scale-90">
                {y < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
        <div ref={(el) => { rafRef.current[tur] = el; }} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 p-4 [scrollbar-width:none]">
          {l.map((x, i) => (
            <motion.div key={x.slug} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ ...YAY, delay: Math.min(i, 6) * 0.04 }}
              className="w-[200px] shrink-0 snap-start max-sm:w-[156px]">
              <FormatKarti s={x} sec={x.slug === formatId} onSec={() => { setFormatId(x.slug); toast.success(`${x.ad} seçildi`, { description: "Komut kutusunda hazır." }); }} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  };

  /* ═══════════ REKLAM KARTLARI ═══════════ */
  const kampanyaBilgisi = (l: Uretim[]): KampanyaBilgi => {
    const k = (l[0].meta?.kurulum ?? {}) as Kurulum;
    const f = PAZ_STILLER.find((x) => x.slug === k.format);
    const av = PAZ_AVATARLAR.find((a) => a.id === k.avatar);
    const kn = PAZ_KANCALAR.find((x) => x.slug === k.kanca);
    const or = PAZ_ORTAMLAR.find((x) => x.slug === k.ortam);
    return {
      baslik: k.urun || (f ? `${f.ad} reklamı` : l[0].baslik),
      gorsel: k.urunGorsel ?? (f ? pazGercek(f.tohumlar[0]) : undefined),
      haplar: [
        f && { ad: f.ad, gorsel: pazGercek(f.tohumlar[0]) },
        { ad: av?.ad ?? "Avatarsız", gorsel: av ? pazGercek(av.tohum) : undefined },
        kn && { ad: kn.ad, gorsel: pazGercek(kn.tohum) },
        or && { ad: or.ad, gorsel: pazGercek(or.tohum) },
        { ad: `${l[0].meta?.oran ?? "9:16"} · ${l[0].meta?.sure ?? "15 sn"}` },
      ].filter(Boolean) as KampanyaBilgi["haplar"],
      zaman: gorece(l[0].olusturma),
      senaryo: senaryoBloklari(l[0].meta?.hamIstem),
    };
  };
  const kampanyaListesi = (ks: Uretim[][], baslik: string, sag?: React.ReactNode, toplam?: number, onYeni?: () => void) => (
    <KampanyaIzgarasi ks={ks} baslik={baslik} sag={sag} toplam={toplam} onYeni={onYeni} bilgi={kampanyaBilgisi}
      kare={(l) => { const f = PAZ_STILLER.find((x) => x.slug === (l[0].meta?.kurulum as Kurulum | undefined)?.format); return f ? pazGercek(f.tohumlar[0]) : undefined; }}
      islem={(l) => ({
        onAc: setAcikId,
        onBegen: (id) => { begeniBildir(l.find((x) => x.id === id)?.favori); favoriToggle(id); },
        onIndir: (u) => indir(u),
        onTumunuIndir: () => { const h = l.filter((u) => u.videoUrl); h.forEach((u, k) => setTimeout(() => indir(u, true), k * 300)); toast.success(`${h.length} video indiriliyor`, { description: "Tarayıcı indirmeleri sırayla başlatır." }); },
        onYeniden: () => ayarlariYukle(l[0]),
        onHepsiniSil: () => { l.forEach((u) => sil(u.id)); mesaj.silindi("Kampanya", () => uretimGeriYukle(l)); },
      })} />
  );
  /* Boş hal (Reklamlarım / Beğenilenler): Sinema Favorilerim dili — üç kare yelpazesi, renkli rozet, başlık, açıklama, iki yol.
     Beğenilenler boşken yelpazede kendi reklamlarının kareleri; hiç reklam yoksa formatın gerçek kareleri. */
  const fav = gorunum === "favoriler";
  const yelpaze = (fav && reklamlar.length ? reklamlar.slice(0, 3).map((u) => u.gorselUrl ?? "") : PAZ_STILLER.slice(0, 3).map((x) => `url("${pazGercek(x.tohumlar[0])}") center/cover no-repeat`));
  const bosReklam = (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] bg-[#141517] px-6 py-16 text-center ring-1 ring-inset ring-white/[0.07]">
      <div className="relative h-[190px] w-[300px]">
        {yelpaze.map((arka, k) => (
          <motion.div key={k} initial={{ opacity: 0, y: 16, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: (k - 1) * 9 }} transition={{ delay: 0.06 * k, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute left-1/2 top-0 aspect-[9/14] w-[112px] overflow-hidden rounded-[16px] ring-1 ring-white/15", k === 1 ? "z-10" : "opacity-70")}
            style={{ marginLeft: -56 + (k - 1) * 78, background: arka || "#1c1c1f" }} />
        ))}
        <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...YAY, delay: 0.25 }}
          className="absolute -bottom-2 left-1/2 z-20 -ml-6 flex h-12 w-12 items-center justify-center rounded-full text-white ring-4 ring-[#141517]"
          style={{ background: fav ? "linear-gradient(140deg,#fda4af,#f43f5e)" : "linear-gradient(140deg,#a5f3fc,#0891b2)" }}>
          {fav ? <Heart className="h-5 w-5 fill-current" /> : <Megaphone className="h-5 w-5" />}
        </motion.span>
      </div>
      <h2 className="mt-9 text-[24px] font-semibold tracking-[-0.02em] text-metin">{fav ? "Henüz beğendiğin reklam yok" : "Henüz reklam üretmedin"}</h2>
      <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-metin-2">
        {fav ? "Bir varyantın üzerindeki kalbe dokun; en iyi reklamların burada toplanır. Yeniden üretmek ve indirmek buradan kolay."
          : "Ürününü ekle, format ve avatar seç, üret. Her üretim bir kampanya olur; varyantlar burada yan yana gelir."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setGorunum(fav && reklamlar.length ? "reklamlar" : "olustur")} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px">
          {fav && reklamlar.length ? <><Megaphone className="h-4 w-4" />Reklamlarıma dön</> : <><Sparkles className="h-4 w-4" />Reklam oluştur</>}
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => { ornekUrun(1); setGorunum("olustur"); }} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.085] px-5 text-[14px] font-semibold text-metin ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.12]">
          <Package className="h-4 w-4" />Örnek ürünle dene
        </motion.button>
      </div>
    </motion.section>
  );

  const sayi = (n: number, koyu?: boolean) => n > 0 && <span className={cn("rounded-full px-1.5 text-[11.5px] tabular-nums", koyu ? "bg-black/10 text-black/60" : "bg-white/[0.1] text-metin-2")}>{n}</span>;
  const gorunumSecici = (
    <div role="tablist" aria-label="Görünüm" className="flex items-center gap-0.5 rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.08]">
      {([["olustur", "Oluştur", null], ["reklamlar", "Reklamlarım", reklamlar.length], ["favoriler", "Beğenilenler", reklamlar.filter((u) => u.favori).length]] as const).map(([id, ad, n]) => (
        <button key={id} role="tab" aria-selected={gorunum === id} onClick={() => setGorunum(id)}
          className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors", gorunum === id ? "text-[#0a0a0b]" : "text-metin-2 hover:text-metin")}>
          {gorunum === id && <motion.span layoutId="paz-gorunum" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
          <span className="relative">{ad}</span>{n !== null && <span className="relative">{sayi(n, gorunum === id)}</span>}
          {id === "reklamlar" && aktifIs > 0 && <Loader2 className="relative h-3.5 w-3.5 animate-spin text-aksan" />}
        </button>
      ))}
    </div>
  );

  const tarifSatirlari = (u: Uretim): TarifSatiri[] => {
    const k = (u.meta?.kurulum ?? {}) as Kurulum;
    const f = PAZ_STILLER.find((s) => s.slug === k.format);
    const av = PAZ_AVATARLAR.find((a) => a.id === k.avatar);
    const kn = PAZ_KANCALAR.find((x) => x.slug === k.kanca);
    const or = PAZ_ORTAMLAR.find((x) => x.slug === k.ortam);
    const rf = REKLAM_REFERANSLARI.find((r) => r.id === k.referans);
    return ([
      f && { etiket: "Format", deger: f.ad, gorsel: pazGercek(f.tohumlar[0]) },
      { etiket: "Avatar", deger: av?.ad ?? "Avatarsız", gorsel: av ? pazGercek(av.tohum) : undefined },
      { etiket: "Kanca", deger: kn?.ad ?? "Doğal açılış", gorsel: kn ? pazGercek(kn.tohum) : undefined },
      { etiket: "Ortam", deger: or?.ad ?? "Formata göre", gorsel: or ? pazGercek(or.tohum) : undefined },
      { etiket: "Referans", deger: rf?.marka ?? "Yok", gorsel: rf ? pazGercek(rf.tohum) : undefined },
    ].filter(Boolean)) as TarifSatiri[];
  };


  return (
    <MotionConfig reducedMotion="user">
      <div ref={ustRef} className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin pb-[230px] max-sm:pb-10">
        <div className="mx-auto max-w-[1320px] px-8 pt-6 max-sm:px-4 max-sm:pt-4">
          <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="flex flex-wrap items-center gap-3 rounded-[22px] bg-[#141517] px-4 py-3 ring-1 ring-inset ring-white/[0.07] sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Megaphone className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1"><h1 className="text-[16px] font-semibold tracking-[-0.01em] text-metin">Pazarlama stüdyosu</h1><p className="truncate text-[12.5px] text-metin-2">Ürününden UGC, TikTok ve ticari video reklamlar</p></div>
            <div className="gizli-scroll max-sm:w-full max-sm:overflow-x-auto">{gorunumSecici}</div>
          </motion.header>

          {!masaustu && gorunum !== "olustur" && <div className="mt-5">{komut}</div>}

          <AnimatePresence mode="wait">
            {gorunum === "olustur" ? (
              <motion.div key="olustur" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                <div className="mt-4">{vitrin}</div>
                {!masaustu && <div className="mt-4">{komut}</div>}
                {reklamlar.length > 0 && (
                  <div className="mt-5">
                    {kampanyaListesi(kampanyalar.slice(0, masaustu ? 4 : 2), "Son kampanyaların",
                      <button onClick={() => setGorunum("reklamlar")} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12]">Tümünü gör<ChevronRight className="h-3.5 w-3.5" /></button>, kampanyalar.length)}
                  </div>
                )}
                {raf("UGC", "UGC formatları", "Gerçek insanlar, samimi anlatım; sosyal akışta reklam gibi durmaz")}
                {raf("TikTok", "TikTok trendleri", "İlk saniyede kaydırmayı durduran kancalar ve akım formatları")}
                {raf("Ticari", "Ticari filmler", "Stüdyo ışığında, markaya yakışan ürün filmleri")}
              </motion.div>
            ) : (
              <motion.div key={gorunum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-4">
                {liste.length ? kampanyaListesi(kampanyalar, gorunum === "favoriler" ? "Beğendiğin kampanyalar" : "Kampanyaların", undefined, undefined, gorunum === "reklamlar" ? () => { setGorunum("olustur"); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined) : bosReklam}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {masaustu && (
          <>
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-36 bg-gradient-to-t from-zemin via-zemin/85 to-transparent" />
            <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-6">
              <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...YAY, delay: 0.05 }} className="w-full max-w-[1000px]">{komut}</motion.div>
            </div>
          </>
        )}
      </div>

      <input ref={yukleRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) void gorselYukle(e.target.files); e.target.value = ""; }} />

      {acik && (() => {
        const grup = kampanyalar.find((l) => l.some((x) => x.id === acik.id)) ?? [acik];
        const b = kampanyaBilgisi(grup);
        return (
          <ReklamGoruntuleyici u={acik} grup={grup} urunAd={b.baslik} urunGorsel={(acik.meta?.kurulum as Kurulum | undefined)?.urunGorsel} tarif={tarifSatirlari(acik)} teknik={[acik.meta?.oran, acik.meta?.sure, acik.meta?.cozunurluk].filter(Boolean) as string[]} zaman={gorece(acik.olusturma)}
            sira={{ i: Math.max(0, izlenen.indexOf(acik)), n: izlenen.length }} onSec={setAcikId}
            onGez={(y) => { const i = izlenen.indexOf(acik); const s2 = izlenen[(i + y + izlenen.length) % izlenen.length]; if (s2) setAcikId(s2.id); }}
            onKapat={() => setAcikId(null)} onBegen={() => { begeniBildir(acik.favori); favoriToggle(acik.id); }} onIndir={() => indir(acik)} onYeniden={() => ayarlariYukle(acik)}
            onSil={() => { const eski = acik; setAcikId(null); sil(eski.id); mesaj.silindi("Varyant", () => uretimGeriYukle(eski)); }} />
        );
      })()}
    </MotionConfig>
  );
}
