"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Check, ChevronRight, ClipboardPaste, ImagePlus, Images, Loader2, Lock, Plus, RefreshCw, Sparkles, Star, Trash2, Upload, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { useProjeler } from "@/store/useProjeler";
import { uretimBaslat } from "@/lib/uretimMotoru";
import { adHatasi, adTemizle, bostakiAd, AD_MAX } from "@/lib/elementCekirdek";
import { TUR_META, TUR_SIRA, MAKS_GORSEL, elementGorseliHazirla } from "./elementMeta";

const ACIKLAMA_MAX = 600;
const ACI_KREDI = 3;
/** Ana görselden eksik açıyı üretmek için yuva başına talimat (Kling "ek açı üret" karşılığı). */
const ACI_ISTEM: Record<ElementTur, string[]> = {
  karakter: ["", "Same character, identical face, hair, outfit and colors, seen in strict side profile view, upper body, plain neutral studio background, even soft light", "Same character, identical hair, outfit and colors, seen from behind (back view), upper body, plain neutral studio background", "Same character, identical face and hair, tight close-up portrait facing camera, plain neutral background, soft light"],
  mekan: ["", "The exact same location, same architecture, materials and lighting, seen from a clearly different camera angle", "A close detail shot inside the exact same location, same materials and colors", "The exact same location and composition at a different time of day, same architecture"],
  obje: ["", "The exact same object, identical shape, colors, materials and logos, seen from the side, plain neutral background", "The exact same object seen from above (top view), plain neutral background", "Macro detail close-up of the exact same object showing its texture and markings, plain neutral background"],
  stil: ["", "A new image with a different subject, rendered in exactly the same visual style, palette, lighting, texture and lens", "A new image with a different subject, rendered in exactly the same visual style, palette, lighting, texture and lens", "A new image with a different subject, rendered in exactly the same visual style, palette, lighting, texture and lens"],
};

/** Tür kartlarının örnek görselleri ve kullanım örneği (önizleme cümlesi). */
const TUR_GORSEL: Record<ElementTur, { gorsel: string; ornek: [string, string] }> = {
  karakter: { gorsel: "/gercek/gorsel/gorsel-karakter-Aria.webp", ornek: ["", "yağmurlu sokakta kameraya dönüp gülümsüyor"] },
  mekan: { gorsel: "/gercek/kabuk/secim-ortam-1.webp", ornek: ["Gece yarısı ", "içinde yürüyen bir yolcu, sinematik geniş plan"] },
  obje: { gorsel: "/gercek/3d/kask-poster.png", ornek: ["Mermer masada duran ", ", yumuşak stüdyo ışığı"] },
  stil: { gorsel: "/gercek/moodboard/mood-h2.webp", ornek: ["Sahilde koşan bir köpek, ", " tarzında"] },
};

/**
 * Element oluştur / düzenle — tek düzenleyici (sayfa, seçici, stüdyolar, üretim kartı ortak). 2026-10-30: tam ekran, üç adım
 * (Tür ve görseller, Ad ve tarif, Kontrol), solda her adımda dolan canlı element kartı; Ctrl Enter ilerletir.
 *
 * Kling Element Kütüphanesi akışı temel alındı: ana görsel → tür → ek açılar → ad + tarif
 * (yapay zekâ ile otomatik tarif) → kaydet. Görseller sunucu deposuna yüklenir; ilk görsel kapak
 * ve ana referanstır. Sağda elementin istemde nasıl çağrılacağı canlı önizlenir.
 */
export function ElementDuzenleModal({ element, onKapat, onOlustu, onKaydedildi, tohumDeger, hedefKapsam }: {
  element: VElement | null;
  onKapat: () => void;
  onOlustu?: (id: string) => void;
  onKaydedildi?: (id: string) => void;
  tohumDeger?: { ad?: string; tur?: ElementTur; aciklama?: string; gorsel?: string };
  hedefKapsam?: { klasorId?: string; projeId?: string; klasorAd?: string };
}) {
  const elementler = useElements((s) => s.elementler);
  const uretimler = useProjeler((s) => s.uretimler);
  const saglayicilar = useSaglayicilar();
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const digerAdlar = useMemo(() => elementler.filter((x) => x.id !== element?.id).map((x) => x.ad), [elementler, element?.id]);
  const [tur, setTur] = useState<ElementTur>(element?.tur ?? tohumDeger?.tur ?? "karakter");
  const [ad, setAd] = useState(element?.ad ?? (tohumDeger?.ad ? bostakiAd(tohumDeger.ad, digerAdlar) : ""));
  const [adDokunuldu, setAdDokunuldu] = useState(!!element);
  const [aciklama, setAciklama] = useState(element?.aciklama ?? tohumDeger?.aciklama ?? "");
  const [gorseller, setGorseller] = useState<string[]>(element?.gorseller.filter(Boolean) ?? []);
  const gorselRef = useRef(gorseller);
  gorselRef.current = gorseller;
  const [uyarilar, setUyarilar] = useState<Record<string, string>>({});
  const [yukleniyor, setYukleniyor] = useState<number[]>([]);
  const [izin, setIzin] = useState(!!element);
  const [kaynakAcik, setKaynakAcik] = useState(false);
  const [surukle, setSurukle] = useState<number | null>(null);
  const [tarifEdiliyor, setTarifEdiliyor] = useState(false);
  const [uretilen, setUretilen] = useState<number[]>([]);
  const [gorselGercek, setGorselGercek] = useState<boolean | null>(null);
  useEffect(() => { fetch("/api/saglayici-durum").then((x) => x.json()).then((j: { durum?: { gorsel?: { gercek?: boolean } } }) => setGorselGercek(!!j.durum?.gorsel?.gercek)).catch(() => setGorselGercek(false)); }, []);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const aciklamaRef = useRef<HTMLTextAreaElement>(null);
  const hedefYuva = useRef(0);
  const [portal, setPortal] = useState(false);
  const [adim, setAdim] = useState(element ? 1 : 0);
  useEffect(() => setPortal(true), []);

  const m = TUR_META[tur];
  const adHata = adHatasi(ad, digerAdlar);
  const adOneri = adHata?.includes("zaten var") ? bostakiAd(ad, digerAdlar) : null;
  const izinGerekli = tur === "karakter" && gorseller.length > 0 && !element;
  const zekaHazir = saglayicilar ? !!saglayicilar.gemini : false;
  const sonUretimler = useMemo(() => uretimler.filter((u) => u.tur === "gorsel" && u.durum === "tamam" && typeof u.gorselUrl === "string" && /^(\/|data:image|https?:)/.test(u.gorselUrl)).slice(0, 24), [uretimler]);

  const adimlar = [
    { ad: "Görsel", tamam: gorseller.length > 0 || aciklama.trim().length >= 12 },
    { ad: "Ad", tamam: !adHata },
    { ad: "Tarif", tamam: aciklama.trim().length >= 12 || gorseller.length > 0 },
    ...(izinGerekli ? [{ ad: "İzin", tamam: izin }] : []),
  ];
  const eksik = adHata ?? (yukleniyor.length ? "Görseller yükleniyor" : !aciklama.trim() && !gorseller.length ? "Bir görsel ekle ya da elementi tarif et" : izinGerekli && !izin ? "Kişi izni onayını işaretle" : null);

  // Tutarlılık göstergesi: görsel sayısı + düşük kalite uyarıları
  const uyariSay = gorseller.filter((g) => uyarilar[g]).length;
  // Uyarılı görsel puanı bir düşürür ama tek görsel hiçbir zaman "Görsel yok" sayılmaz.
  const puan = gorseller.length ? Math.max(1, Math.min(4, gorseller.length - (uyariSay ? 1 : 0))) : 0;
  const puanEtiket = ["Görsel yok", "Temel", "İyi", "Çok iyi", "Mükemmel"][puan];

  useEffect(() => { if (tohumDeger?.gorsel && !element) void yukle(tohumDeger.gorsel, 0); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const yukle = async (kaynak: File | string, yuva: number, degistir = false) => {
    const sira = degistir ? yuva : gorselRef.current.length;
    if (sira >= MAKS_GORSEL) return void toast.error("Görsel sınırına ulaşıldı", { description: `Bir elemente en çok ${MAKS_GORSEL} görsel eklenebilir. Yenisi için birini kaldır.` });
    setYukleniyor((l) => [...l, sira]);
    try {
      const { url, uyari } = await elementGorseliHazirla(kaynak);
      const k = [...gorselRef.current];
      if (degistir && sira < k.length) k[sira] = url; else k.push(url);
      gorselRef.current = k.slice(0, MAKS_GORSEL);
      setGorseller(gorselRef.current);
      setUyarilar((u) => { const k = { ...u }; if (uyari) k[url] = uyari; return k; });
    } catch (e) {
      toast.error("Görsel eklenemedi", { description: e instanceof Error && e.message ? e.message : "Görsel işlenemedi. Başka bir görselle dene." });
    } finally {
      setYukleniyor((l) => l.filter((x) => x !== sira));
    }
  };
  const dosyalar = async (fl: FileList | File[], yuva: number) => {
    const l = Array.from(fl).filter((f) => f.type.startsWith("image/"));
    if (!l.length) return;
    if (yuva < gorselRef.current.length) return void yukle(l[0], yuva, true);
    for (const d of l.slice(0, MAKS_GORSEL - gorselRef.current.length)) await yukle(d, gorselRef.current.length);
  };
  const kaldir = (i: number) => setGorseller((l) => l.filter((_, k) => k !== i));
  const anaYap = (i: number) => setGorseller((l) => [l[i], ...l.filter((_, k) => k !== i)]);
  const sec = (i: number) => { hedefYuva.current = i; dosyaRef.current?.click(); };

  useEffect(() => {
    const yap = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).filter((x) => x.type.startsWith("image/"));
      if (f.length && !(e.target as HTMLElement).closest("input, textarea")) { e.preventDefault(); void dosyalar(f, gorselRef.current.length); }
    };
    window.addEventListener("paste", yap);
    return () => window.removeEventListener("paste", yap);
  });

  const otomatikTarif = async () => {
    if (!gorseller.length) return void toast.info("Önce bir görsel ekle", { description: "Yapay zekâ tarifi görsellerden çıkarır." });
    if (!zekaHazir) return void toast.info("Otomatik tarif kilitli", { description: "Yapay zekâ (Gemini) anahtarı bağlanınca açılır. Şimdilik tarifi kendin yazabilirsin." });
    setTarifEdiliyor(true);
    try {
      const j = (await (await fetch("/api/element/tarif", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gorseller }) })).json()) as { ok: boolean; tur?: ElementTur; ad?: string; aciklama?: string; hata?: string };
      if (!j.ok) throw new Error(j.hata);
      if (j.aciklama) setAciklama(j.aciklama);
      if (j.tur && !element) setTur(j.tur);
      if (j.ad && !ad.trim()) { setAd(bostakiAd(adTemizle(j.ad), digerAdlar)); setAdDokunuldu(true); }
      toast.success("Tarif çıkarıldı", { description: "Kontrol et, gerekirse düzenle." });
    } catch (e) {
      toast.error("Tarif çıkarılamadı", { description: e instanceof Error && e.message ? e.message : "Yeniden dene ya da tarifi kendin yaz." });
    } finally { setTarifEdiliyor(false); }
  };

  /** Ana görselden eksik açıyı üretir; sonuç o yuvaya eklenir (kredi düşer, başarısızsa iade). */
  const aciUret = async (i: number) => {
    const ana0 = gorselRef.current[0];
    if (!ana0) return void toast.info("Önce ana görseli ekle", { description: "Diğer açılar ana görselden üretilir." });
    if (!gorselGercek) return void toast.info("Açı üretimi kilitli", { description: "Görsel sağlayıcısı bağlanınca açılır. Şimdilik açıyı yükleyebilirsin." });
    const istem = ACI_ISTEM[tur][i] || ACI_ISTEM[tur][1];
    const r = uretimBaslat({ baslik: `@${ad || "element"} · ${m.yuvalar[i]}`, tur: "gorsel", model: "Nano Banana 2.1", prompt: istem, kredi: ACI_KREDI, arac: "Element",
      meta: { islem: "duzenle", gorselUrl: new URL(ana0, location.href).href, oran: "3:4", hamIstem: istem } });
    if (!r.ok || !r.id) return void toast.error("Açı üretimi başlatılamadı", { description: r.hata ?? "Yeniden dene." });
    setUretilen((l) => [...l, i]);
    const sonuc = await new Promise<{ url?: string; hata?: string }>((coz) => {
      const bak = () => { const u = useProjeler.getState().uretimler.find((x) => x.id === r.id); if (u?.durum === "tamam") { coz({ url: u.gorselUrl }); return true; } if (u?.durum === "hata") { coz({ hata: u.hata }); return true; } return false; };
      if (bak()) return; const iptal = useProjeler.subscribe(() => { if (bak()) iptal(); });
    });
    setUretilen((l) => l.filter((x) => x !== i));
    const url = sonuc.url?.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? sonuc.url;
    if (!url) return void toast.error(`${m.yuvalar[i]} üretilemedi`, { description: sonuc.hata ? `${sonuc.hata.replace(/\.?$/, ".")} Kredi iade edildi.` : "Kredi iade edildi. Yeniden dene." });
    await yukle(url, i, i < gorselRef.current.length);
  };

  const ipucuEkle = (o: string) => {
    const t = aciklama.trim();
    const yeni = `${t}${t && !/[.,;]$/.test(t) ? ", " : t ? " " : ""}${o.toLocaleLowerCase("tr")}: `;
    setAciklama(yeni.slice(0, ACIKLAMA_MAX));
    requestAnimationFrame(() => { const el = aciklamaRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });
  };

  const kaydet = () => {
    if (eksik) return void toast.error("Element kaydedilemedi", { description: `${eksik}.` });
    const veri = { ad, tur, aciklama: aciklama.trim(), gorseller };
    if (element) {
      const r = useElements.getState().guncelle(element.id, veri);
      if (r.hata) return void toast.error("Element güncellenemedi", { description: `${r.hata}.` });
      toast.success(`@${ad} güncellendi`, { description: element.ad !== ad ? `Eski istemlerdeki @${element.ad} artık tanınmaz.` : undefined });
      onKaydedildi?.(element.id); onKapat();
      return;
    }
    const r = useElements.getState().ekle({ ...veri, klasorId: hedefKapsam?.klasorId, projeId: hedefKapsam?.projeId, klasor: hedefKapsam?.klasorAd });
    if (r.hata || !r.id) return void toast.error("Element oluşturulamadı", { description: r.hata ? `${r.hata}.` : "Yeniden dene." });
    toast.success(`@${ad} oluşturuldu`, { description: "Her üretimde @ yazarak çağırabilirsin." });
    onOlustu?.(r.id); onKapat();
  };

  const surukleProps = (i: number) => ({
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(i); } },
    onDragLeave: () => setSurukle((s) => (s === i ? null : s)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(null); void dosyalar(e.dataTransfer.files, Math.min(i, gorselRef.current.length)); },
  });

  /* ── Ana görsel sahnesi ── */
  const ana = gorseller[0];
  const anaSahne = (
    <div {...surukleProps(0)}
      className={cn("group relative aspect-[16/10] w-full overflow-hidden rounded-[16px] ring-1 ring-inset transition-shadow",
        ana ? "ring-white/[0.1]" : surukle === 0 ? "ring-2 ring-aksan" : "ring-white/[0.08]")}>
      {ana ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ana} alt="Ana görsel" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />Ana görsel · {m.yuvalar[0]}
          </span>
          {uyarilar[ana] && (
            <span className="absolute right-3 top-3 inline-flex max-w-[60%] items-center gap-1.5 rounded-full bg-amber-400/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a1206]">
              <AlertTriangle className="h-3 w-3 shrink-0" /><span className="truncate" title={uyarilar[ana]}>{uyarilar[ana].split(";")[0]}</span>
            </span>
          )}
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <button onClick={() => sec(0)} className="glass-cip flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white"><RefreshCw className="h-3.5 w-3.5" />Değiştir</button>
            <button onClick={() => kaldir(0)} aria-label="Ana görseli kaldır" className="glass-cip flex h-9 w-9 items-center justify-center rounded-full text-white hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
          </div>
          {yukleniyor.includes(0) && <span className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-7 w-7 animate-spin text-white" /></span>}
        </>
      ) : (
        <>
          {/* Boş: türün örnek görseli silik arkada, çizgili çerçeve önde */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TUR_GORSEL[tur].gorsel} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.14] blur-[2px] grayscale" />
          <span className="absolute inset-0 bg-gradient-to-b from-[#121214]/40 via-[#121214]/70 to-[#121214]" />
          <span className={cn("absolute inset-3 rounded-[14px] ring-inset transition-shadow", surukle === 0 ? "ring-2 ring-white" : "ring-1 ring-white/[0.08]")} />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            {yukleniyor.length ? <Loader2 className="h-8 w-8 animate-spin text-aksan" /> : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aksan/[0.12] text-aksan ring-1 ring-inset ring-aksan/30"><ImagePlus className="h-6 w-6" /></span>
            )}
            <div>
              <p className="text-[16px] font-semibold text-metin">Ana görseli ekle</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-metin-3">{tur === "karakter" ? "Önden, yüzü net, iyi ışıkta tek kişi" : tur === "mekan" ? "Mekânı bütünüyle gösteren geniş bir kare" : tur === "obje" ? "Sade zeminde, tamamı görünen obje" : "Stili en iyi anlatan örnek görsel"}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => sec(0)} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90"><Upload className="h-4 w-4" />Dosya seç</button>
              <button onClick={() => setKaynakAcik(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.075] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><Images className="h-4 w-4" />Üretimlerimden</button>
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-metin-3 [@media(hover:none)]:hidden">Sürükle bırak ya da <ClipboardPaste className="h-3 w-3" /> Ctrl+V · en fazla {MAKS_GORSEL} görsel</p>
          </div>
        </>
      )}
    </div>
  );

  /* ── Ek açı yuvaları ── */
  const ekYuva = (i: number) => {
    const g = gorseller[i];
    const aktif = i <= gorseller.length && gorseller.length > 0;
    const yuk = yukleniyor.includes(i);
    return (
      <div key={i} {...surukleProps(i)}
        className={cn("group relative aspect-[4/3] overflow-hidden rounded-[14px] ring-1 ring-inset transition-shadow",
          g ? "ring-white/[0.1]" : surukle === i ? "ring-2 ring-aksan" : "ring-white/[0.07]")}>
        {g ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g} alt={m.yuvalar[i]} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute bottom-1.5 left-2 text-[11px] font-semibold text-white">{m.yuvalar[i]}</span>
            {uyarilar[g] && <span title={uyarilar[g]} className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#1a1206]"><AlertTriangle className="h-3 w-3" /></span>}
            <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <button onClick={() => anaYap(i)} aria-label="Ana görsel yap" title="Ana görsel yap" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:text-amber-300"><Star className="h-3.5 w-3.5" /></button>
              <button onClick={() => kaldir(i)} aria-label={`${m.yuvalar[i]} görselini kaldır`} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
            </div>
          </>
        ) : (
          <>
            <button disabled={!aktif || yuk || uretilen.includes(i)} onClick={() => sec(i)} aria-label={`${m.yuvalar[i]} görseli ekle`}
              className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white/[0.035] pb-6 text-center transition-colors hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.035]">
              {yuk || uretilen.includes(i) ? <Loader2 className="h-5 w-5 animate-spin text-aksan" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.075] text-metin-2 transition-colors group-hover:text-metin"><Plus className="h-4 w-4" /></span>}
              <span className="text-[11.5px] font-medium text-metin-2">{uretilen.includes(i) ? "Üretiliyor…" : m.yuvalar[i]}</span>
            </button>
            {aktif && !uretilen.includes(i) && !yuk && (
              <button onClick={() => void aciUret(i)} title={gorselGercek ? `Ana görselden ${m.yuvalar[i].toLocaleLowerCase("tr")} üret · ${ACI_KREDI} kredi` : "Görsel sağlayıcısı bağlanınca açılır"}
                className={cn("absolute inset-x-1.5 bottom-1.5 flex h-6 items-center justify-center gap-1 rounded-full text-[11px] font-medium ring-1 ring-inset transition-colors",
                  gorselGercek ? "bg-aksan/[0.12] text-aksan ring-aksan/30 hover:bg-aksan/[0.2]" : "bg-white/[0.055] text-metin-3 ring-white/[0.07]")}>
                {gorselGercek ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />}Üret{gorselGercek && <span className="tabular-nums opacity-80">· {ACI_KREDI}</span>}
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  /* ── Adım adım akış ── */
  const ADIMLAR = ["Tür ve görseller", "Ad ve tarif", "Kontrol"];
  const adim0Tamam = gorseller.length > 0;
  const adim1Tamam = !adHata && (aciklama.trim().length >= 12 || gorseller.length > 0) && (!izinGerekli || izin) && !yukleniyor.length;
  const ulasilir = (i: number) => !!element || i === 0 || (i === 1 && (adim0Tamam || adim >= 1)) || (i === 2 && adim1Tamam);
  const ileri = () => {
    if (adim === 0) { if (yukleniyor.length) return void toast.info("Görseller yükleniyor", { description: "Bitince devam edebilirsin." }); setAdim(1); return; }
    if (adim === 1) { setAdDokunuldu(true); if (!adim1Tamam) return void toast.error("Bu adım eksik", { description: `${eksik ?? "Tarif en az 12 karakter olmalı ya da bir görsel ekle"}.` }); setAdim(2); return; }
    kaydet();
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ileri(); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  });

  /* Solda canlı element kartı: her adımda dolar */
  const canliKart = (
    <div className="overflow-hidden rounded-[24px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.08]">
      <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.045]">
        <AnimatePresence mode="wait" initial={false}>
          {ana ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={ana} src={ana} alt="" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <motion.span key={`bos-${tur}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${m.hex} 16%, transparent), transparent 70%)` }}>
              <m.ikon className="h-10 w-10" style={{ color: m.hex }} /><span className="text-[13px] text-white/50">Ana görsel burada görünür</span>
            </motion.span>
          )}
        </AnimatePresence>
        {yukleniyor.includes(0) && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 className="h-7 w-7 animate-spin text-white" /></span>}
      </div>
      <div className="p-4">
        <p className="truncate text-[20px] font-semibold tracking-[-0.01em] text-white">@{ad || "ad"}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/55"><m.ikon className="h-3.5 w-3.5" style={{ color: m.hex }} />{m.ad} · {gorseller.length ? `${gorseller.length} açı` : "Görsel yok"}</p>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {m.yuvalar.map((y, i) => gorseller[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={gorseller[i]} src={gorseller[i]} alt={y} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="aspect-square w-full rounded-[10px] object-cover" />
          ) : <span key={y} title={y} className="aspect-square rounded-[10px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.035)" }} />)}
        </div>
        {aciklama.trim() && <p className="mt-3 line-clamp-3 text-[12.5px] leading-snug text-white/65">{aciklama}</p>}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex flex-1 gap-[3px]">{[0, 1, 2, 3].map((k) => <motion.span key={k} initial={false} animate={{ opacity: k < puan ? 1 : 0.18 }} className="h-1 flex-1 rounded-full" style={{ background: m.hex }} />)}</span>
          <span className="text-[11.5px] text-white/55">Tutarlılık: {puanEtiket}</span>
        </div>
      </div>
    </div>
  );

  if (!portal) return null;
  return createPortal(
    <motion.div role="dialog" aria-modal="true" aria-label={element ? `@${element.ad} düzenle` : "Yeni element"}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[260] flex flex-col bg-[#0b0b0c] text-white">
      <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { if (e.target.files) void dosyalar(e.target.files, hedefYuva.current); e.target.value = ""; }} />

      {/* Üst çubuk: kapat, başlık, adımlar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 sm:px-6">
        <button onClick={onKapat} aria-label="Kapat (Esc)" title="Kapat (Esc)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.075] text-white/80 transition hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
        <p className="min-w-0 truncate text-[15px] font-semibold">{element ? `@${element.ad} düzenle` : "Yeni element"}</p>
        <span className="flex-1" />
        <ol className="flex items-center gap-1">
          {ADIMLAR.map((a, i) => {
            const bitti = i < adim || (i === 0 && adim0Tamam && adim > 0);
            return (
              <li key={a} className="flex items-center gap-1">
                <button onClick={() => ulasilir(i) && setAdim(i)} disabled={!ulasilir(i)} aria-current={adim === i ? "step" : undefined}
                  className={cn("flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3 text-[13px] font-medium ring-1 ring-inset transition", adim === i ? "bg-white text-black ring-white" : bitti ? "text-white ring-white/20 hover:bg-white/[0.075]" : "text-white/45 ring-white/[0.08] disabled:cursor-not-allowed")}>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-semibold", adim === i ? "bg-black text-white" : bitti ? "bg-[#ffffff] text-black" : "bg-white/[0.08]")}>{bitti && adim !== i ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}</span>
                  <span className="hidden md:inline">{a}</span>
                </button>
                {i < ADIMLAR.length - 1 && <span className={cn("hidden h-px w-5 sm:block", i < adim ? "bg-white/40" : "bg-white/10")} />}
              </li>
            );
          })}
        </ol>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:py-10">
          <aside className="hidden lg:block"><div className="sticky top-0">{canliKart}</div></aside>
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={adim} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="max-w-[720px] space-y-6">
                {adim === 0 && <>
                  <div className="rounded-[18px] px-4 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><h2 className="text-[17px] font-semibold tracking-[-0.01em]">Ne tanımlıyorsun?</h2><p className="mt-0.5 text-[13px] text-white/55">Tür, görsel yuvalarını ve tarif ipuçlarını belirler.</p></div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Tür">
                    {TUR_SIRA.map((t) => {
                      const tm = TUR_META[t]; const I = tm.ikon; const a = tur === t;
                      return (
                        <motion.button key={t} whileTap={{ scale: 0.97 }} role="radio" aria-checked={a} onClick={() => setTur(t)}
                          className={cn("group relative h-24 overflow-hidden rounded-[16px] text-left ring-inset transition-shadow", a ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] hover:ring-white/25")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={TUR_GORSEL[t].gorsel} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-105", a ? "opacity-80" : "opacity-40 group-hover:opacity-60")} />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <span className="absolute inset-x-2.5 bottom-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-white"><I className="h-4 w-4" style={{ color: tm.hex }} />{tm.ad}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <section className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1"><p className="text-[16px] font-semibold">Görselleri ekle</p><p className="mt-0.5 text-[12.5px] text-white/55">{m.ipucu}</p></div>
                    </div>
                    {anaSahne}
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5">{[1, 2, 3].map(ekYuva)}</div>
                  </section>
                </>}

                {adim === 1 && <>
                  <div className="rounded-[18px] px-4 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><h2 className="text-[17px] font-semibold tracking-[-0.01em]">Adı ve tarifi</h2><p className="mt-0.5 text-[13px] text-white/55">İstemde <span className="rounded-[5px] bg-[#ffffff]/15 px-1 text-[#ffffff]">@{ad || "ad"}</span> yazınca bu tarif ve görseller modele gider.</p></div>
                  <section className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
                    <div className="mb-2 flex items-center justify-between text-[13px]"><span className="font-semibold">Ad</span><span className="tabular-nums text-white/45">{ad.length}/{AD_MAX}</span></div>
                    <label className={cn("flex h-12 items-center gap-1 rounded-[14px] bg-black/30 px-3.5 ring-1 ring-inset transition-shadow focus-within:ring-white/35", adDokunuldu && adHata ? "ring-rose-400/50" : "ring-white/[0.09]")}>
                      <span className="text-[17px] font-semibold text-[#ffffff]">@</span>
                      <input value={ad} autoFocus onChange={(e) => { setAd(adTemizle(e.target.value)); setAdDokunuldu(true); }} placeholder={tur === "karakter" ? "Zara" : tur === "mekan" ? "NeonSokak" : tur === "obje" ? "AltinSaat" : "SicakFilm"} aria-label="Ad"
                        className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-white outline-none placeholder:font-normal placeholder:text-white/35" />
                      {ad && !adHata && <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-300"><Check className="h-3.5 w-3.5" strokeWidth={2.6} />Uygun</span>}
                    </label>
                    <p className={cn("mt-1.5 text-[12px]", adDokunuldu && adHata ? "text-rose-300" : "text-white/45")}>
                      {adDokunuldu && adHata ? <>{adHata}{adOneri && <> · <button onClick={() => setAd(adOneri)} className="font-semibold text-[#ffffff] hover:underline">@{adOneri}</button> kullan</>}</> : "Harf, rakam ve alt çizgi; boşluk yok."}
                    </p>
                  </section>
                  <section className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
                    <div className="mb-2 flex items-center justify-between gap-2 text-[13px]">
                      <span className="font-semibold">Tarif <span className="font-normal text-white/45">modele giden kimlik</span></span>
                      <button onClick={otomatikTarif} disabled={tarifEdiliyor} title={!gorseller.length ? "Önce görsel ekle" : !zekaHazir ? "Yapay zekâ anahtarı bağlanınca açılır" : "Görsellerden tarif çıkar"}
                        className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors", zekaHazir && gorseller.length ? "bg-white/[0.1] text-white hover:bg-white/[0.16]" : "bg-white/[0.055] text-white/45")}>
                        {tarifEdiliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : zekaHazir ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}Görselden tarif et
                      </button>
                    </div>
                    <div className="rounded-[14px] bg-black/30 ring-1 ring-inset ring-white/[0.09] transition-shadow focus-within:ring-white/35">
                      <textarea ref={aciklamaRef} value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, ACIKLAMA_MAX))} rows={5} placeholder={m.aciklamaYer} aria-label="Tarif"
                        className="block w-full resize-none bg-transparent px-3.5 pt-3 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/35" />
                      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5 pt-1">
                        {m.ornekler.map((o) => <button key={o} onClick={() => ipucuEkle(o)} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.065] px-2.5 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.09] hover:text-white"><Plus className="h-3 w-3" />{o}</button>)}
                        <span className="ml-auto text-[11.5px] tabular-nums text-white/40">{aciklama.length}/{ACIKLAMA_MAX}</span>
                      </div>
                    </div>
                  </section>
                  {izinGerekli && (
                    <label className={cn("flex cursor-pointer items-start gap-3 rounded-[16px] p-3.5 ring-1 ring-inset transition-colors", izin ? "bg-white/[0.065] ring-white/30" : "bg-white/[0.035] ring-white/[0.08]")}>
                      <input type="checkbox" checked={izin} onChange={(e) => setIzin(e.target.checked)} className="sr-only" />
                      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset", izin ? "bg-white text-black ring-white" : "ring-white/25")}>{izin && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                      <span className="text-[13px] leading-relaxed text-white/75">Görseldeki kişi benim ya da kullanma iznim var. Gerçek kişileri yanıltıcı ya da izinsiz içerikte kullanmayacağım.</span>
                    </label>
                  )}
                </>}

                {adim === 2 && <>
                  <div className="rounded-[18px] px-4 py-3 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}><h2 className="text-[17px] font-semibold tracking-[-0.01em]">{element ? "Değişiklikleri kontrol et" : "Neredeyse hazır"}</h2><p className="mt-0.5 text-[13px] text-white/55">Son bir bakış; istersen önceki adımlara dönüp düzelt.</p></div>
                  <section className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
                    <div className="flex items-center justify-between"><p className="text-[15px] font-semibold">Tutarlılık</p><span className="text-[13px] font-semibold" style={{ color: puan >= 3 ? m.hex : undefined }}>{puanEtiket}</span></div>
                    <div className="mt-2.5 grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((k) => <motion.span key={k} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: k * 0.06 }} className={cn("h-1.5 origin-left rounded-full", k < puan ? "" : "bg-white/[0.08]")} style={k < puan ? { background: m.hex } : undefined} />)}</div>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-white/60">{gorseller.length === 0 ? "Görsel yok; model yalnız tarife göre çalışır. Bir görsel eklemek tutarlılığı çok artırır." : gorseller.length < MAKS_GORSEL ? `${MAKS_GORSEL - gorseller.length} açı daha eklersen farklı sahnelerde ${m.ad.toLocaleLowerCase("tr")} daha tutarlı kalır.` : "Tüm açılar tamam. Referans destekleyen modellere hepsi birlikte gider."}</p>
                    {gorseller.length > 0 && gorseller.length < MAKS_GORSEL && <button onClick={() => setAdim(0)} className="mt-3 flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.12]"><ImagePlus className="h-3.5 w-3.5" />Açı ekle</button>}
                  </section>
                  <section className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]">
                    <p className="mb-3 text-[13px] text-white/50">İstemde böyle kullanırsın</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-relaxed">
                      {TUR_GORSEL[tur].ornek[0] && <span>{TUR_GORSEL[tur].ornek[0]}</span>}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff]/[0.14] py-0.5 pl-0.5 pr-2.5 font-semibold text-[#ffffff] ring-1 ring-inset ring-[#ffffff]/30">
                        {ana ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ana} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffffff]/20"><m.ikon className="h-3.5 w-3.5" /></span>}
                        @{ad || "ad"}
                      </span>
                      <span className="text-white/70">{TUR_GORSEL[tur].ornek[1]}</span>
                    </p>
                    <p className="mt-3 text-[12.5px] text-white/45">{gorseller.length ? `${gorseller.length} görsel referans olarak, tarif metin olarak modele gider.` : "Tarif metin olarak modele gider."}</p>
                  </section>
                  <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]">
                    {([["Tür", m.ad, 0], ["Ad", `@${ad}`, 1], ["Tarif", aciklama.trim() || "Yok", 1], ["Konum", hedefKapsam?.klasorAd ?? (hedefKapsam?.projeId ? "Bu proje" : "Kitaplık"), -1]] as const).map(([k, v, a]) => (
                      <div key={k} className="flex items-start gap-4 px-4 py-3">
                        <dt className="w-16 shrink-0 text-[13px] text-white/45">{k}</dt><dd className="line-clamp-2 min-w-0 flex-1 text-[13.5px] text-white/85">{v}</dd>
                        {a >= 0 && <button onClick={() => setAdim(a)} className="shrink-0 text-[12.5px] text-white/50 hover:text-white">Düzenle</button>}
                      </div>
                    ))}
                  </dl>
                </>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Alt çubuk: Geri / Devam */}
      <footer className="flex shrink-0 items-center gap-3 border-t border-white/[0.06] px-4 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] sm:px-6">
        <p className="hidden min-w-0 flex-1 truncate text-[12.5px] text-white/45 sm:block">{adim === 1 && eksik ? eksik : adim === 0 ? (adim0Tamam ? "Ctrl Enter ile devam" : "Görsel eklemeden de devam edebilirsin") : "Ctrl Enter ile devam"}</p>
        <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          {adim > 0 ? <button onClick={() => setAdim(adim - 1)} className="h-11 rounded-full bg-white/[0.085] px-5 text-[14px] font-medium text-white/90 transition hover:bg-white/[0.12]">Geri</button>
            : <button onClick={onKapat} className="h-11 rounded-full px-4 text-[14px] text-white/65 transition hover:bg-white/[0.075] hover:text-white">İptal</button>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={ileri} disabled={adim === 2 && !!eksik}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-6 text-[14px] font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
            {adim === 2 ? <><Check className="h-4 w-4" strokeWidth={2.6} />{element ? "Kaydet" : `@${ad || "element"} oluştur`}</> : <>{adim === 0 && !adim0Tamam ? "Görselsiz devam" : "Devam"}<ChevronRight className="h-4 w-4" /></>}
          </motion.button>
        </div>
      </footer>

      {/* Üretimlerimden seç */}
      <AnimatePresence>
        {kaynakAcik && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={() => setKaynakAcik(false)}>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[560px] rounded-[20px] border border-white/[0.08] bg-[#18181b] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[15px] font-semibold">Üretimlerimden seç</p>
                <button onClick={() => setKaynakAcik(false)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.065] text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              {sonUretimler.length ? (
                <div className="grid max-h-[360px] grid-cols-4 gap-2 overflow-y-auto [scrollbar-width:thin]">
                  {sonUretimler.map((u) => (
                    <button key={u.id} onClick={() => { void yukle(u.gorselUrl!, gorselRef.current.length); setKaynakAcik(false); }} title={u.baslik} className="aspect-square overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.06] transition-shadow hover:ring-2 hover:ring-white/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.gorselUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : <p className="py-10 text-center text-[13px] text-white/45">Henüz görsel üretimin yok.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}
