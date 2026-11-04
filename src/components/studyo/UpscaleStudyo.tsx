"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronLeft, Columns2, Download, Film, Image as ImageIcon, Images, Info, Loader2, Maximize, RotateCcw,
  SplitSquareHorizontal, Square, Trash2, Upload, X, Wand2, Repeat2, Sparkles, Cpu, Maximize2, Monitor, Tv, Fingerprint, Dices, Ban,
  ScanFace, Mountain, Zap, Gem, Palette, Volume2, SlidersHorizontal, History, Minimize2, Box, Type, Crown, ChevronDown, PanelRightClose, ScanSearch, Keyboard,
} from "lucide-react";
import { cn, saltUrl, gorseliFormatlaIndir } from "@/lib/utils";
import { KaroSecici, HapKaydirici, AnahtarKart } from "@/components/studyo/hf";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { neden } from "@/components/studyo/bildirim";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useProjeler } from "@/store/useProjeler";
import { useMasaustu } from "@/hooks/useMasaustu";
import {
  GIRDI_MAX_MB, HAZIR_AYARLAR, TOPAZ_ALT, UPSCALE_MODELLERI, YEREL_MAX_MP, ciktiBoyutu, upscaleKredi, upscaleModel,
  type UpscaleAyar, type UpscaleModelId, type UpscaleTur,
} from "@/lib/upscaleVeri";
import { useUpscale, isiIzle, isleriSurdur, basarisiz, kitapligaYansit, medyaBoyutu, type UpscaleIs } from "@/store/useUpscale";
import { yerelBuyut } from "@/lib/yerelBuyut";
import { KitaplikPaneli } from "./KitaplikPaneli";
import { Karsilastirici, type GoruntuMod, type Yakinlik } from "./upscale/Karsilastirici";

/**
 * Büyüt (Upscale) stüdyosu. Solda kaynak + hazır ayar + model + ölçek + gelişmiş ayarlar, ortada
 * önce/sonra görüntüleyici, sağda geçmiş. Gerçek modeller fal.ai üzerinden çalışır (çıktı MP'ye göre
 * kredi). Sağlayıcı bağlı değilken görsel tarayıcıda Lanczos ile büyütülebilir — açıkça "AI değil"
 * olarak etiketlenir ve kredi düşmez. Video büyütme yalnız gerçek sağlayıcıyla çalışır.
 */

type ModelSecim = UpscaleModelId | "yerel";
type Kaynak = { url: string; onizleme: string; w: number; h: number; sure?: number; ad: string; boyutMb?: number; tur: UpscaleTur; uretimId?: string; yukleniyor?: boolean };

const YEREL_OLCEKLER = [2, 3, 4];
const GIRDI_MAX_MP = 36;

const sayi = (n: number, k = 1) => n.toLocaleString("tr-TR", { maximumFractionDigits: k });
/** 300 DPI baskı boyutu (cm). */
const baskiCm = (w: number, h: number) => `${sayi((w / 300) * 2.54, 1)} × ${sayi((h / 300) * 2.54, 1)} cm baskı`;
const zamanOnce = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

function useFalDurum() {
  const [bagli, setBagli] = useState<boolean | null>(null);
  useEffect(() => {
    let iptal = false;
    fetch("/api/upscale/durum").then((r) => r.json()).then((j: { fal: boolean }) => { if (!iptal) setBagli(!!j.fal); }).catch(() => { if (!iptal) setBagli(false); });
    return () => { iptal = true; };
  }, []);
  return bagli;
}

export function UpscaleStudyo() {
  const router = useRouter();
  const arama = useSearchParams();
  const masaustu = useMasaustu();
  const fal = useFalDurum();
  const isler = useUpscale((s) => s.isler);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);

  const [tur, setTur] = useState<UpscaleTur>("gorsel");
  const [kaynak, setKaynak] = useState<Kaynak | null>(null);
  const [hazir, setHazir] = useState<string | null>("oto");
  const [model, setModel] = useState<ModelSecim>("seedvr");
  const [olcek, setOlcek] = useState(2);
  const [ayar, setAyar] = useState<UpscaleAyar>({ gren: 0.1 });
  const [yerelKeskin, setYerelKeskin] = useState(0.35);
  const [gelismis, setGelismis] = useState(false);
  const [seciliIs, setSeciliIs] = useState<string | null>(null);
  const [gMod, setGMod] = useState<GoruntuMod>("kaydir");
  const [yakinlik, setYakinlik] = useState<Yakinlik>("sigdir");
  const [onceBasili, setOnceBasili] = useState(false);
  const [kitaplikAcik, setKitaplikAcik] = useState(false);
  const [suruklen, setSuruklen] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [yuklendi, setYuklendi] = useState(false);
  useEffect(() => setYuklendi(true), []);

  // Yarıda kalan işler sürsün; sağlayıcı yoksa varsayılan "yerel".
  useEffect(() => { isleriSurdur(); }, []);
  useEffect(() => {
    if (fal === false && tur === "gorsel" && model !== "yerel" && !seciliIs) { setModel("yerel"); setHazir(null); setOlcek(2); }
  }, [fal]); // eslint-disable-line react-hooks/exhaustive-deps

  const mTanim = model === "yerel" ? null : upscaleModel(model)!;
  const olcekler = model === "yerel" ? YEREL_OLCEKLER : mTanim!.olcekler;
  const sabitOlcek = olcekler.length === 0; // Recraft Crisp: ölçeği model belirler
  const etkinOlcek = sabitOlcek ? 0 : olcek;
  // SeedVR hedef çözünürlük modu: kısa kenar hedefe getirilir (ölçek yerine).
  const hedefOlcek = model === "seedvr" && ayar.hedef && kaynak?.w ? ({ "1080p": 1080, "1440p": 1440, "2160p": 2160 }[ayar.hedef] / Math.min(kaynak.w, kaynak.h)) : null;
  const cikti = kaynak && kaynak.w ? ciktiBoyutu(kaynak.w, kaynak.h, hedefOlcek ?? etkinOlcek) : null;
  const gercek = model !== "yerel";
  const kredi = gercek && cikti ? upscaleKredi(model as UpscaleModelId, cikti.mp, kaynak?.sure ?? 0, etkinOlcek || 2) : 0;

  const olcekNeden = useCallback((o: number): string | null => {
    if (!kaynak?.w) return null;
    const c = ciktiBoyutu(kaynak.w, kaynak.h, o);
    if (model === "yerel") return c.mp > YEREL_MAX_MP ? `Tarayıcıda en fazla ${YEREL_MAX_MP} MP` : null;
    return Math.max(c.w, c.h) > mTanim!.maxKenar ? `${mTanim!.ad} en fazla ${sayi(mTanim!.maxKenar, 0)} px üretir` : null;
  }, [kaynak, model, mTanim]);

  // Ölçek geçersizleşirse ilk geçerliye kay.
  useEffect(() => {
    if (sabitOlcek || !olcekler.length) return;
    if (!olcekler.includes(olcek) || olcekNeden(olcek)) {
      const ilk = olcekler.find((o) => !olcekNeden(o));
      if (ilk && ilk !== olcek) setOlcek(ilk);
    }
  }, [olcekler, olcek, olcekNeden, sabitOlcek]);

  /* ── Kaynak ── */
  const kaynakAyarla = useCallback(async (k: Omit<Kaynak, "w" | "h"> & { w?: number; h?: number }) => {
    const b = k.w && k.h ? { w: k.w, h: k.h, sure: k.sure } : await medyaBoyutu(k.onizleme, k.tur);
    if (!b) return void mesaj.dosyaOkunamadi();
    if (k.tur === "gorsel" && (b.w < 32 || b.h < 32)) return void toast.error("Görsel çok küçük", { description: "En az 32×32 piksel olmalı. Daha büyük bir görsel seç." });
    if (k.tur === "gorsel" && (b.w * b.h) / 1e6 > GIRDI_MAX_MP) return void toast.error("Görsel zaten çok büyük", { description: `En çok ${GIRDI_MAX_MP} MP büyütülebilir. Bu görsel zaten yeterince yüksek çözünürlükte.` });
    if (k.tur === "video" && b.sure && b.sure > 60) return void toast.error("Video çok uzun", { description: "En çok 60 saniyelik video büyütülebilir. Videoyu kırpıp yeniden yükle." });
    setTur(k.tur);
    setKaynak({ ...k, w: b.w, h: b.h, sure: b.sure });
    setSeciliIs(null);
    setYakinlik("sigdir");
  }, []);

  const dosyaYukle = useCallback(async (d: File | undefined) => {
    if (!d) return;
    const video = d.type.startsWith("video/");
    if (!video && !["image/png", "image/jpeg", "image/webp"].includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG, WebP görsel ya da MP4, WebM, MOV video");
    const sinir = video ? GIRDI_MAX_MB.video : GIRDI_MAX_MB.gorsel;
    if (d.size > sinir * 1024 * 1024) return void mesaj.dosyaCokBuyuk(sinir);
    const onizleme = URL.createObjectURL(d);
    const ad = d.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Yüklenen dosya";
    const t: UpscaleTur = video ? "video" : "gorsel";
    await kaynakAyarla({ url: "", onizleme, ad, boyutMb: d.size / 1048576, tur: t, yukleniyor: true });
    if (t === "video" && (model === "yerel" || upscaleModel(model)?.tur !== "video")) { setModel("flashvsr"); setHazir(null); setOlcek(2); setAyar({}); }
    if (t === "gorsel" && model !== "yerel" && upscaleModel(model)?.tur === "video") { hazirUygula(fal === false ? null : "oto"); }
    const fd = new FormData();
    fd.append("dosya", d);
    try {
      const r = await fetch("/api/upscale/yukle", { method: "POST", body: fd }).then((x) => x.json()) as { ok: boolean; url?: string; hata?: string };
      if (!r.ok || !r.url) throw new Error(r.hata);
      setKaynak((k) => (k && k.onizleme === onizleme ? { ...k, url: r.url!, yukleniyor: false } : k));
    } catch (e) {
      setKaynak((k) => (k && k.onizleme === onizleme ? null : k));
      toast.error("Dosya yüklenemedi", { description: `${neden(e, "Sunucuya ulaşılamadı.")} Bağlantını kontrol edip yeniden dene.` });
    }
  }, [kaynakAyarla, model, fal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Başka sayfalardan gelen kaynak: /panel/upscale?kaynak=<url>&uretim=<id>
  useEffect(() => {
    const u = arama.get("kaynak");
    if (!u || !/^(\/|https:\/\/|data:image\/)/.test(u)) return;
    const uretim = arama.get("uretim") ?? undefined;
    const ur = uretim ? useProjeler.getState().uretimler.find((x) => x.id === uretim) : undefined;
    const video = ur?.tur === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(u);
    if (video) { setModel("flashvsr"); setHazir(null); setAyar({}); }
    void kaynakAyarla({ url: u, onizleme: u, ad: ur?.baslik?.slice(0, 60) || "Kitaplıktan", tur: video ? "video" : "gorsel", uretimId: uretim });
  }, [arama, kaynakAyarla]);

  // Yapıştır (Ctrl+V) ile görsel
  useEffect(() => {
    const yap = (e: ClipboardEvent) => {
      const d = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
      if (d) { e.preventDefault(); void dosyaYukle(d); }
    };
    window.addEventListener("paste", yap);
    return () => window.removeEventListener("paste", yap);
  }, [dosyaYukle]);

  function hazirUygula(id: string | null) {
    setHazir(id);
    const h = HAZIR_AYARLAR.find((x) => x.id === id);
    if (!h) return;
    setModel(h.model);
    if (h.olcek) setOlcek(h.olcek);
    setAyar({ ...h.ayar });
  }
  const modelSec = (m: ModelSecim) => {
    setModel(m); setHazir(null);
    const t = m === "yerel" ? null : upscaleModel(m)!;
    setAyar(m === "topaz" ? { topazModel: "Standard V2", yuz: true, yuzGuc: 0.6 } : m === "clarity" ? { yaraticilik: 0.35, benzerlik: 0.6 } : m === "crystal" ? { yaraticilik: 2 } : m === "ideogram" ? { benzerlik: 50, detay: 50 } : m === "seedvr" || m === "seedvr-video" ? { gren: 0.1 } : m === "flashvsr" ? { kalite: "high", renkDuzelt: true, sesKoru: true } : {});
    if (t?.olcekler.length && !t.olcekler.includes(olcek)) setOlcek(t.olcekler[0]);
  };
  const turSec = (t: UpscaleTur) => {
    if (t === tur) return;
    setTur(t);
    setKaynak(null);
    setSeciliIs(null);
    if (t === "video") modelSec("flashvsr");
    else if (fal === false) { setModel("yerel"); setHazir(null); setOlcek(2); }
    else hazirUygula("oto");
  };

  /* ── Üret ── */
  const eksik = !kaynak ? (tur === "video" ? "Önce bir video seç" : "Önce bir görsel seç")
    : kaynak.yukleniyor ? "Yükleniyor…"
    : gercek && fal === false ? "Büyütme sağlayıcısı bağlı değil"
    : tur === "video" && !gercek ? "Video için sağlayıcı gerekli"
    : hedefOlcek !== null && hedefOlcek <= 1 ? "Görsel zaten bu çözünürlükte ya da daha büyük"
    : hedefOlcek === null && !sabitOlcek && olcekNeden(etkinOlcek) ? olcekNeden(etkinOlcek)
    : null;

  const uretKilit = useRef(0);
  /** Bir kaynak için büyütme işini kurar ve başlatır (tek ve toplu büyütme aynı yolu kullanır). */
  const isBaslat = (k: { url: string; w: number; h: number; sure?: number; ad: string; tur: UpscaleTur; uretimId?: string }, krediTutar: number, sec: boolean): string | null => {
    if (gercek && !useAuth.getState().krediDus(krediTutar)) {
      mesaj.yetersizKredi(krediTutar, useAuth.getState().kullanici?.krediler ?? 0);
      return null;
    }
    const id = useUpscale.getState().ekle({
      tur: k.tur, ad: k.ad, kaynakUrl: k.url, kaynakW: k.w, kaynakH: k.h, kaynakSure: k.sure, model, olcek: etkinOlcek,
      ayar: model === "yerel" ? { keskinlik: yerelKeskin } : ayar, hazirAyar: hazir ?? undefined, durum: "kuyrukta", kredi: krediTutar, gercek, kaynakUretimId: k.uretimId,
    });
    if (sec) { setSeciliIs(id); setYakinlik("sigdir"); }
    if (model === "yerel") {
      useUpscale.getState().guncelle(id, { durum: "isleniyor" });
      yerelBuyut(k.url, etkinOlcek, yerelKeskin)
        .then((s) => { useUpscale.getState().guncelle(id, { durum: "tamam", sonucUrl: s.url, sonucW: s.w, sonucH: s.h, bitis: Date.now() }); kitapligaYansit(id); })
        .catch((e) => basarisiz(id, e instanceof Error ? e.message : "Büyütülemedi"));
      return id;
    }
    void (async () => {
      try {
        const r = await fetch("/api/upscale", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, kaynakUrl: k.url, olcek: etkinOlcek, ayar }),
        }).then((x) => x.json()) as { ok: boolean; jeton?: string; hata?: string };
        if (!r.ok || !r.jeton) throw new Error(r.hata ?? "Başlatılamadı");
        useUpscale.getState().guncelle(id, { jeton: r.jeton });
        void isiIzle(id);
      } catch (e) {
        basarisiz(id, e instanceof Error ? e.message : "Başlatılamadı");
      }
    })();
    return id;
  };
  const uret = () => {
    if (Date.now() - uretKilit.current < 800) return;
    uretKilit.current = Date.now();
    if (eksik || !kaynak || !cikti) return void (eksik && toast.error("Büyütme başlatılamadı", { description: `${eksik.replace(/…$/, "")}.` }));
    const calistir = () => {
      if (!isBaslat(kaynak, kredi, true)) return;
      toast.success("Büyütme başladı", { description: `${mTanim ? mTanim.ad : "Yerel büyütme"} · ${gercek && kredi ? `${kredi} kredi.` : "Kredi düşmez."} Bitince sonuç burada görünür.` });
    };
    if (gercek) useAuthKapi.getState().kapiKontrol(calistir, { baslik: "Büyütmek için giriş yap" });
    else calistir();
  };

  /** Toplu büyütme: seçili model ve ölçekle birden çok görsel (en fazla 20). Sığmayan ya da sınırı aşan atlanır. */
  const [toplu, setToplu] = useState<{ toplam: number; biten: number } | null>(null);
  const topluBuyut = async (dosyalar: File[]) => {
    const gorseller = dosyalar.filter((d) => ["image/png", "image/jpeg", "image/webp"].includes(d.type) && d.size <= GIRDI_MAX_MB.gorsel * 1024 * 1024).slice(0, 20);
    if (!gorseller.length) return void mesaj.desteklenmeyenDosya(`PNG, JPG ya da WebP (en fazla ${GIRDI_MAX_MB.gorsel} MB)`);
    if (tur !== "gorsel") turSec("gorsel");
    const calistir = async () => {
      setToplu({ toplam: gorseller.length, biten: 0 });
      let baslayan = 0, atlanan = 0, harcanan = 0, ilk: string | null = null;
      for (const d of gorseller) {
        const onizleme = URL.createObjectURL(d);
        const b = await medyaBoyutu(onizleme, "gorsel");
        const olc = b ? ciktiBoyutu(b.w, b.h, sabitOlcek ? 0 : olcek) : null;
        const sinirda = !b || !olc || b.w < 32 || b.h < 32 || (b.w * b.h) / 1e6 > GIRDI_MAX_MP
          || (model === "yerel" ? olc.mp > YEREL_MAX_MP : Math.max(olc.w, olc.h) > mTanim!.maxKenar);
        if (sinirda) { atlanan++; setToplu((t) => t && { ...t, biten: t.biten + 1 }); continue; }
        try {
          const fd = new FormData(); fd.append("dosya", d);
          const r = await fetch("/api/upscale/yukle", { method: "POST", body: fd }).then((x) => x.json()) as { ok: boolean; url?: string; hata?: string };
          if (!r.ok || !r.url) throw new Error(r.hata);
          const k = gercek ? upscaleKredi(model as UpscaleModelId, olc!.mp, 0, etkinOlcek || 2) : 0;
          const id = isBaslat({ url: r.url, w: b!.w, h: b!.h, ad: d.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Görsel", tur: "gorsel" }, k, false);
          if (!id) break;
          ilk ??= id; baslayan++; harcanan += k;
        } catch { atlanan++; }
        setToplu((t) => t && { ...t, biten: t.biten + 1 });
      }
      setToplu(null);
      if (ilk) { setSeciliIs(ilk); setGecmisAcik(true); }
      if (baslayan) toast.success(`${baslayan} görsel büyütülüyor`, { description: `${mTanim ? mTanim.ad : "Yerel büyütme"} · ${gercek && harcanan ? `${harcanan} kredi.` : "Kredi düşmez."}${atlanan ? ` ${atlanan} görsel sınırı aştığı için atlandı.` : ""}` });
      else toast.error("Toplu büyütme başlatılamadı", { description: "Görseller seçili ölçekte modelin sınırını aşıyor ya da yüklenemedi. Daha küçük bir ölçek dene." });
    };
    if (gercek) useAuthKapi.getState().kapiKontrol(() => void calistir(), { baslik: "Büyütmek için giriş yap" });
    else await calistir();
  };
  /** Birden çok dosya bırakılınca toplu, tek dosyada normal akış. */
  const dosyalarGeldi = (l: FileList | File[] | null | undefined) => {
    const d = Array.from(l ?? []);
    if (d.length > 1) void topluBuyut(d); else void dosyaYukle(d[0]);
  };

  /* ── Görüntülenen ── */
  const is = seciliIs ? isler.find((i) => i.id === seciliIs) : undefined;
  useEffect(() => { if (seciliIs && !is) setSeciliIs(null); }, [seciliIs, is]);
  const once = is ? { url: is.kaynakUrl, w: is.kaynakW, h: is.kaynakH } : kaynak ? { url: kaynak.onizleme, w: kaynak.w, h: kaynak.h } : null;
  const sonra = is?.durum === "tamam" && is.sonucUrl && is.sonucW && is.sonucH ? { url: is.sonucUrl, w: is.sonucW, h: is.sonucH } : undefined;
  const gorunenTur = is?.tur ?? tur;

  const isiAc = (i: UpscaleIs) => {
    setSeciliIs(i.id);
    setYakinlik("sigdir");
  };
  const ayarlariYukle = (i: UpscaleIs) => {
    setTur(i.tur);
    void kaynakAyarla({ url: i.kaynakUrl, onizleme: i.kaynakUrl, w: i.kaynakW, h: i.kaynakH, sure: i.kaynakSure, ad: i.ad, tur: i.tur, uretimId: i.kaynakUretimId });
    setModel(i.model); setAyar(i.ayar); if (i.olcek) setOlcek(i.olcek); setHazir(i.hazirAyar ?? null);
    if (i.model === "yerel" && i.ayar.keskinlik != null) setYerelKeskin(i.ayar.keskinlik);
  };
  const sonucuKaynakYap = (i: UpscaleIs) => {
    if (!i.sonucUrl || !i.sonucW || !i.sonucH) return;
    void kaynakAyarla({ url: i.sonucUrl, onizleme: i.sonucUrl, w: i.sonucW, h: i.sonucH, ad: `${i.ad} (büyütülmüş)`, tur: i.tur, uretimId: i.uretimId });
    toast.success("Sonuç kaynak olarak seçildi", { description: "Bir kez daha büyütebilirsin." });
  };
  const indir = async (i: UpscaleIs) => {
    if (!i.sonucUrl) return;
    try {
      const b = await fetch(i.sonucUrl).then((r) => r.blob());
      const uz = b.type.split("/")[1]?.replace("jpeg", "jpg").replace("quicktime", "mov") || (i.tur === "video" ? "mp4" : "png");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `${i.ad.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "vayra"}-${i.sonucW}x${i.sonucH}.${uz}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast.success(i.tur === "video" ? "Video indiriliyor" : "Görsel indiriliyor", { description: a.download });
    } catch { mesaj.indirilemedi("Sonuç dosyasına ulaşılamadı."); }
  };
  const sil = (i: UpscaleIs) => {
    if (i.durum === "kuyrukta" || i.durum === "isleniyor") return void toast.warning("Büyütme sürüyor", { description: "Süren iş silinemez. Bitince silebilirsin." });
    useUpscale.getState().sil(i.id);
    toast("Geçmişten kaldırıldı", { description: "Kitaplıktaki kopya duruyor.", action: { label: "Geri al", onClick: () => useUpscale.setState((d) => (d.isler.some((x) => x.id === i.id) ? d : { isler: [i, ...d.isler].sort((a, b) => b.olusturma - a.olusturma) })) } });
  };

  // Klavye: "\" basılıyken önce, 0/1/2 yakınlık, Ctrl+Enter büyüt
  useEffect(() => {
    const yaz = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "\\") { setOnceBasili(e.type === "keydown"); return; }
      if (e.type !== "keydown") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); uret(); }
      else if (e.key === "0") setYakinlik("sigdir");
      else if (e.key === "1") setYakinlik(1);
      else if (e.key === "2") setYakinlik(2);
      else if (e.key.toLowerCase() === "l") setBuyutec((v) => !v);
      else if (e.key === "?") setKisayolAcik((v) => !v);
    };
    window.addEventListener("keydown", yaz);
    window.addEventListener("keyup", yaz);
    return () => { window.removeEventListener("keydown", yaz); window.removeEventListener("keyup", yaz); };
  });

  const suren = isler.filter((i) => i.durum === "kuyrukta" || i.durum === "isleniyor").length;
  // Komut kutusu yüksekliği → görüntüleyici altta o kadar pay bırakır.
  const komutRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(80);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  });
  const bilgiSatiri = fal === null ? null
    : tur === "video" && !fal ? "Video büyütme gerçek model ister; sağlayıcı (fal.ai) bağlanana kadar kullanılamaz."
    : model === "yerel" ? "Yerel büyütme AI değil: pikselleri çoğaltır, yeni detay eklemez"
    : !fal ? `${mTanim?.ad} için fal.ai bağlı değil. Ücretsiz yerel büyütmeyi seçebilirsin.` : null;

  /* ═════════════ Parçalar ═════════════ */

  const YUZEY = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
  const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
  const [hazirAcik, setHazirAcik] = useState(false);
  const [modelAcik, setModelAcik] = useState(false);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(true);
  const gecmisEn = useKenarGenisligi("buyut-gecmis", 260);
  const yanEn = useKenarGenisligi("buyut-yan", 300, 240);
  const [buyutec, setBuyutec] = useState(false);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [indirAcik, setIndirAcik] = useState(false);
  /** Görsel sonucu seçilen biçimde indirir (PNG kayıpsız, JPG küçük, WebP web için). */
  const bicimleIndir = async (i: UpscaleIs, bicim: "png" | "jpg" | "webp") => {
    if (!i.sonucUrl) return;
    setIndirAcik(false);
    const ad = `${i.ad.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "vayra"}-${i.sonucW}x${i.sonucH}`;
    try { await gorseliFormatlaIndir(i.sonucUrl, ad, bicim); toast.success("Görsel indiriliyor", { description: `${ad}.${bicim}` }); }
    catch { mesaj.indirilemedi("Sonuç dosyasına ulaşılamadı."); }
  };
  const [goruntuSurukle, setGoruntuSurukle] = useState(false);

  const turSekmesi = (
    <div role="tablist" aria-label="Medya türü" className="isolate flex items-center gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
      {([["gorsel", "Görsel", ImageIcon], ["video", "Video", Film]] as const).map(([id, ad, Ikon]) => (
        <button key={id} role="tab" aria-selected={tur === id} onClick={() => turSec(id)}
          className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors active:scale-[0.97]", tur === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {tur === id && <motion.span layoutId="upTur" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
          <Ikon className="h-4 w-4" /><span>{ad}</span>
        </button>
      ))}
    </div>
  );

  const a = (k: keyof UpscaleAyar) => (v: unknown) => { setAyar((x) => ({ ...x, [k]: v })); setHazir(null); };
  const hap = (ad: string, deger: number, onDegis: (v: number) => void, o: { min?: number; max?: number; adim?: number; yaz?: (v: number) => string; ipucu?: string; sol?: string; sag?: string } = {}) => (
    <div className="rounded-[14px] bg-white/[0.03] px-3.5 pb-2.5 pt-3 ring-1 ring-inset ring-white/[0.06]">
      <HapKaydirici ad={ad} deger={deger} min={o.min ?? 0} max={o.max ?? 1} adim={o.adim ?? 0.05} onDegis={onDegis} solUc={o.sol ?? "Az"} sagUc={o.sag ?? "Çok"} yaz={o.yaz ?? ((v) => `${Math.round(v * 100)}`)} ipucu={o.ipucu} />
    </div>
  );
  const tohumAlani = (
    <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Fingerprint className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-medium text-metin">Tohum</span>
          <span className="block text-[11.5px] text-metin-3">{ayar.tohum != null ? "Aynı sonucu yeniden alırsın" : "Her büyütmede rastgele"}</span>
        </span>
        {ayar.tohum != null && <button onClick={() => a("tohum")(undefined)} className="rounded-full px-2 py-1 text-[11.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">Rastgele yap</button>}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <input inputMode="numeric" value={ayar.tohum ?? ""} placeholder="Rastgele" aria-label="Tohum"
          onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 9); a("tohum")(v ? Number(v) : undefined); }}
          className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.05] px-3.5 text-[13px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-3 focus:ring-white/30" />
        <button onClick={() => a("tohum")(Math.floor(Math.random() * 999_999_999))} aria-label="Yeni tohum üret"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-metin active:scale-95"><Dices className="h-3.5 w-3.5" />Zar at</button>
      </div>
    </div>
  );
  const istemAlani = (yer: string) => (
    <textarea value={ayar.istem ?? ""} onChange={(e) => a("istem")(e.target.value.slice(0, 1000))} rows={2} placeholder={yer} aria-label="Yönlendirme istemi"
      className="block w-full resize-none rounded-[14px] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/30" />
  );
  const oto = (v: number) => (v ? String(Math.round(v * 100)) : "Oto");
  const ayarIcerik = (): ReactNode => {
    switch (model) {
      case "yerel": return hap("Keskinleştirme", yerelKeskin, setYerelKeskin, { sol: "Yumuşak", sag: "Keskin" });
      case "seedvr": case "seedvr-video": return <>{hap("Gren / doku", ayar.gren ?? 0.1, a("gren"), { ipucu: "Yüksek değer daha fazla doğal gren ekler", sol: "Temiz", sag: "Grenli" })}{tohumAlani}</>;
      case "recraft": return <p className="rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] leading-relaxed text-metin-2">Bu model ayar almaz; net kenar ve düz renk alanlarına odaklanır.</p>;
      case "crystal": return hap("Yaratıcılık", ayar.yaraticilik ?? 0, a("yaraticilik"), { min: 0, max: 10, adim: 1, yaz: (v) => String(v), sol: "Sadık", sag: "Yaratıcı", ipucu: "0: kaynağa sadık, 10: en fazla yeni detay" });
      case "ideogram": return (<>
        {hap("Benzerlik", ayar.benzerlik ?? 50, a("benzerlik"), { min: 1, max: 100, adim: 1, yaz: (v) => String(v), sol: "Serbest", sag: "Sadık" })}
        {hap("Detay", ayar.detay ?? 50, a("detay"), { min: 1, max: 100, adim: 1, yaz: (v) => String(v), sol: "Sade", sag: "Detaylı" })}
        {istemAlani("İsteğe bağlı: görseli tarif et (detay yönlendirmesi)")}{tohumAlani}
      </>);
      case "clarity": return (<>
        {hap("Yaratıcılık", ayar.yaraticilik ?? 0.35, a("yaraticilik"), { ipucu: "Yüksek: daha fazla yeni detay, kaynaktan sapma", sol: "Sadık", sag: "Yaratıcı" })}
        {hap("Benzerlik", ayar.benzerlik ?? 0.6, a("benzerlik"), { ipucu: "Yüksek: kaynağa daha sadık", sol: "Serbest", sag: "Sadık" })}
        {istemAlani("İsteğe bağlı: eklenecek detay (ör. keskin kirpikler, cilt dokusu)")}
        {hap("Yönlendirme", ayar.yonlendirme ?? 4, a("yonlendirme"), { min: 0, max: 20, adim: 0.5, yaz: (v) => v.toFixed(1), sol: "Serbest", sag: "İsteme bağlı" })}
        {hap("Adım", ayar.adim ?? 18, a("adim"), { min: 4, max: 50, adim: 1, yaz: (v) => String(v), sol: "Hızlı", sag: "Ayrıntılı" })}
        <label className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]">
          <Ban className="h-4 w-4 text-rose-300" />
          <input value={ayar.negatif ?? ""} onChange={(e) => a("negatif")(e.target.value.slice(0, 500))} placeholder="Olmasın: bulanık, plastik cilt…" aria-label="Negatif istem" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
        </label>
        {tohumAlani}
      </>);
      case "topaz": {
        const redefine = ayar.topazModel === "Redefine";
        return (<>
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-metin">Alt model</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TOPAZ_ALT.map((t) => {
                const I = TOPAZ_IKON[t.id] ?? Sparkles; const sec = ayar.topazModel === t.id;
                return (
                  <button key={t.id} onClick={() => a("topazModel")(t.id)} title={t.ozet} aria-pressed={sec}
                    className={cn("flex flex-col items-center gap-1 rounded-[11px] px-1 py-2 text-center text-[10.5px] leading-tight ring-1 ring-inset transition-colors", sec ? "bg-white font-medium text-black ring-white" : "bg-white/[0.04] text-metin-2 ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin")}>
                    <I className="h-4 w-4" />{t.ad}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 rounded-[10px] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] leading-snug text-metin-2">{TOPAZ_ALT.find((t) => t.id === ayar.topazModel)?.ozet}</p>
          </div>
          {redefine ? (<>
            {hap("Yaratıcılık", ayar.yaraticilik ?? 3, a("yaraticilik"), { min: 1, max: 6, adim: 1, yaz: (v) => String(v), sol: "Sadık", sag: "Yaratıcı" })}
            {hap("Doku", ayar.doku ?? 3, a("doku"), { min: 1, max: 5, adim: 1, yaz: (v) => String(v), sol: "Pürüzsüz", sag: "Dokulu" })}
            {istemAlani("İsteğe bağlı: boş bırakırsan model görseli kendisi tarif eder")}
          </>) : (<>
            <KaroSecici etiket="Odak" deger={ayar.odak ?? "All"} onDegis={(v) => a("odak")(v)} secenekler={[["All", "Tümü", Maximize, "Tüm görsel"], ["Foreground", "Özne", ScanFace, "Ön plan"], ["Background", "Arka plan", Mountain, "Zemin"]]} />
            <AnahtarKart ikon={<ScanFace className="h-4 w-4" />} renk="gul" baslik="Yüz iyileştirme" ipucu="Yüzleri ayrı bir modelle netleştirir." acik={!!ayar.yuz} onDegis={() => a("yuz")(!ayar.yuz)} />
            {ayar.yuz && <>{hap("Yüz gücü", ayar.yuzGuc ?? 0.8, a("yuzGuc"))}{hap("Yüz yaratıcılığı", ayar.yuzYaraticilik ?? 0, a("yuzYaraticilik"), { sol: "Sadık", sag: "Yaratıcı" })}</>}
            {hap("Keskinlik", ayar.keskinlik ?? 0, a("keskinlik"), { yaz: oto })}
            {hap("Gürültü azaltma", ayar.gurultu ?? 0, a("gurultu"), { yaz: oto })}
            {hap("Sıkıştırma onarımı", ayar.sikistirma ?? 0, a("sikistirma"), { yaz: oto, ipucu: "JPEG bloklanmasını giderir" })}
          </>)}
        </>);
      }
      case "flashvsr": return (<>
        <KaroSecici etiket="Kalite" deger={ayar.kalite ?? "high"} onDegis={(v) => a("kalite")(v)} secenekler={[["medium", "Hızlı", Zap, "Önizleme"], ["high", "Dengeli", Sparkles, "Önerilen"], ["maximum", "En iyi", Gem, "Final"]]} />
        <AnahtarKart ikon={<Palette className="h-4 w-4" />} renk="mor" baslik="Renk düzeltme" ipucu="Büyütmede oluşan renk kaymasını giderir." acik={ayar.renkDuzelt ?? true} onDegis={() => a("renkDuzelt")(!(ayar.renkDuzelt ?? true))} />
        <AnahtarKart ikon={<Volume2 className="h-4 w-4" />} renk="gok" baslik="Sesi koru" acik={ayar.sesKoru ?? true} onDegis={() => a("sesKoru")(!(ayar.sesKoru ?? true))} />
        {tohumAlani}
      </>);
    }
  };

  /** Ne büyütüyorsun? — görselli hazır ayarlar. */
  const hazirIzgara = (sutun = "grid-cols-4") => (
    <>
    {fal === false && <p className="mb-2 flex items-center gap-1.5 rounded-full bg-amber-300/10 px-2.5 py-1 text-[11.5px] text-amber-100 ring-1 ring-inset ring-amber-300/20"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Bu ayarlar AI modelleri ister; sağlayıcı bağlanınca açılır</p>}
    <div className={cn("grid gap-2", sutun)}>
      {HAZIR_AYARLAR.map((h) => {
        const kapali = fal === false; const sec = hazir === h.id;
        return (
          <button key={h.id} onClick={() => { if (kapali) return void toast.info("AI büyütme modelleri kapalı", { description: "Büyütme sağlayıcısı bağlanınca açılır. Şimdilik ücretsiz yerel büyütmeyi kullanabilirsin." }); hazirUygula(h.id); setHazirAcik(false); }} aria-pressed={sec} title={h.ozet}
            className={cn("group relative aspect-[4/5] overflow-hidden rounded-[14px] text-left ring-inset transition-shadow", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.09] hover:ring-white/30", kapali && "opacity-55")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HAZIR_GORSEL[h.id]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
            {sec && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3} /></span>}
            <span className="absolute inset-x-2 bottom-1.5"><span className="block text-[12px] font-semibold leading-tight text-white">{h.ad}</span><span className="line-clamp-2 text-[10.5px] leading-snug text-white/65">{h.ozet}</span></span>
          </button>
        );
      })}
    </div>
    </>
  );

  const modelSatiri = (id: ModelSecim) => {
    const t = id === "yerel" ? null : upscaleModel(id)!;
    const sec = model === id;
    const k = t && cikti ? upscaleKredi(t.id, cikti.mp, kaynak?.sure ?? 0, etkinOlcek || 2) : 0;
    return (
      <button key={id} onClick={() => { modelSec(id); setModelAcik(false); }} aria-pressed={sec}
        className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.06]")}>
        {t ? <ModelSimge id={t.id} boyut={38} /> : <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Cpu className="h-4 w-4" /></span>}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin">{t ? t.ad : "Yerel büyütme"}
            {t && YENI_MODELLER.includes(t.id) && <span className="rounded-full bg-white px-1.5 py-px text-[10px] font-semibold text-black">Yeni</span>}
            {!t && <span className="rounded-full bg-amber-300/10 px-1.5 py-px text-[10px] font-medium text-amber-100 ring-1 ring-inset ring-amber-300/25">AI değil</span>}
          </span>
          <span className="line-clamp-2 text-[11.5px] leading-snug text-metin-2">{t ? t.ozet : "Tarayıcıda pikselleri çoğaltır; ücretsiz ve anında"}</span>
          {t && (
            <span className="mt-1 flex gap-1">
              {[t.eksen, t.hiz, t.olcekler.length ? `${Math.max(...t.olcekler)}×'e kadar` : "Ölçek otomatik"].map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-1.5 py-px text-[10.5px] text-metin-2">{x}</span>)}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {t ? (fal === false ? <span title="Sağlayıcı (fal.ai) bağlanınca açılır" className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] font-medium text-metin-3 ring-1 ring-inset ring-white/[0.07]"><span className="h-1.5 w-1.5 rounded-full bg-white/30" />Bağlı değil</span> : k > 0 && <KrediHap deger={k} secili={sec} />) : <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-metin">Ücretsiz</span>}
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", sec ? "bg-white text-black" : "opacity-0")}><Check className="h-3 w-3" strokeWidth={3} /></span>
        </span>
      </button>
    );
  };

  const enFazlaOlcek = kaynak?.w ? [...olcekler].reverse().find((o) => !olcekNeden(o)) : undefined;
  const olcekSinirli = !!kaynak?.w && olcekler.some((o) => !!olcekNeden(o));
  const olcekDugmeleri = !sabitOlcek && !(model === "seedvr" && ayar.hedef) ? (
    <div role="radiogroup" aria-label="Ölçek" className="isolate flex items-center gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
      {olcekler.map((o) => {
        const neden = olcekNeden(o);
        return (
          <button key={o} role="radio" aria-checked={olcek === o} disabled={!!neden} title={neden ?? (kaynak?.w ? `${Math.round(kaynak.w * o)}×${Math.round(kaynak.h * o)}` : undefined)} onClick={() => setOlcek(o)}
            className={cn("relative flex min-w-[44px] flex-col items-center justify-center rounded-full px-2.5 tabular-nums leading-none transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-25", kaynak?.w && masaustu ? "h-10" : "h-8", olcek === o ? "text-black" : "text-metin-2 hover:text-metin")}>{olcek === o && <motion.span layoutId="upOlcek" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}<span className="text-[12.5px] font-semibold">{o}×</span>{kaynak?.w && masaustu ? <span className={cn("mt-0.5 text-[9.5px]", olcek === o ? "text-black/60" : "text-white/45")}>{(() => { const c = ciktiBoyutu(kaynak.w, kaynak.h, o); return Math.max(c.w, c.h) >= 1000 ? `${sayi(Math.max(c.w, c.h) / 1000, 1)}K` : Math.max(c.w, c.h); })()}</span> : null}</button>
        );
      })}
    </div>
  ) : model === "seedvr" && ayar.hedef ? (
    <div role="radiogroup" aria-label="Hedef çözünürlük" className="flex items-center gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
      {(["1080p", "1440p", "2160p"] as const).map((h) => (
        <button key={h} role="radio" aria-checked={ayar.hedef === h} onClick={() => a("hedef")(h)}
          className={cn("h-8 rounded-full px-2.5 text-[12.5px] font-semibold transition-colors", ayar.hedef === h ? "bg-white text-black" : "text-metin-2 hover:text-metin")}>{h === "2160p" ? "4K" : h}</button>
      ))}
    </div>
  ) : <span className="rounded-full bg-white/[0.06] px-3 py-2 text-[12px] text-metin-2">Ölçeği model belirler</span>;

  const kilit = gercek && fal === false;
  const ctaEtiket = model === "yerel" ? "Yerel büyüt" : "Büyüt";

  /** Alttaki komut kutusu. */
  const komut = (
    <div className={cn("w-full rounded-[22px] p-1.5", YUZEY)}>
      <div className="flex flex-wrap items-center gap-1 px-1">
        {/* Hazır ayar */}
        {tur === "gorsel" && masaustu && fal !== false && (
          <div className="relative">
            <button onClick={() => setHazirAcik((v) => !v)} aria-expanded={hazirAcik}
              className="flex h-10 items-center gap-2 rounded-[11px] pl-1 pr-2.5 text-[13px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {hazir ? <img src={HAZIR_GORSEL[hazir]} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-metin-2"><SlidersHorizontal className="h-3.5 w-3.5" /></span>}
              <span className="flex flex-col items-start leading-tight"><span className="text-[10.5px] text-white/55">İçerik</span><span className="text-metin">{HAZIR_AYARLAR.find((h) => h.id === hazir)?.ad ?? "Özel"}</span></span>
              <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", hazirAcik && "rotate-180")} />
            </button>
            <Yuzen acik={hazirAcik} onKapat={() => setHazirAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Ne büyütüyorsun?" className={cn("w-[440px] p-3", POP)}>
              <p className="text-[13.5px] font-semibold text-metin">Ne büyütüyorsun?</p>
              <p className="mb-2.5 mt-0.5 text-[11.5px] text-metin-2">İçeriğe göre en uygun model ve ayarlar seçilir.</p>
              {hazirIzgara()}
            </Yuzen>
          </div>
        )}
        {/* Model */}
        <div className="relative">
          <button onClick={() => setModelAcik((v) => !v)} aria-expanded={modelAcik}
            className="flex h-10 items-center gap-2 rounded-[11px] pl-1.5 pr-2.5 text-[13px] font-medium transition-colors hover:bg-white/[0.06]">
            {mTanim ? <ModelSimge id={mTanim.id} boyut={32} /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-metin-2"><Cpu className="h-3.5 w-3.5" /></span>}
            <span className="flex flex-col items-start leading-tight"><span className="text-[10.5px] text-white/55">Model</span><span className="text-metin">{mTanim ? mTanim.ad : "Yerel"}</span></span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-metin-3 transition-transform", modelAcik && "rotate-180")} />
          </button>
          <Yuzen acik={modelAcik} onKapat={() => setModelAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Model" className={cn("max-h-[60vh] w-[380px] overflow-y-auto p-1.5 [scrollbar-width:thin]", POP)}>
            <p className="px-2.5 pb-1.5 pt-1 text-[12.5px] font-semibold text-metin">{tur === "video" ? "Video büyütme modelleri" : "Görsel büyütme modelleri"}</p>
            {tur === "gorsel" && fal === false && modelSatiri("yerel")}
            {UPSCALE_MODELLERI.filter((m) => m.tur === tur).map((m) => modelSatiri(m.id))}
            {tur === "gorsel" && fal !== false && modelSatiri("yerel")}
          </Yuzen>
        </div>
        <span className="mx-1 h-6 w-px bg-white/10" />
        {/* Ölçek */}
        {model === "seedvr" && (
          <button onClick={() => a("hedef")(ayar.hedef ? undefined : "2160p")} title={ayar.hedef ? "Kat sayısına geç" : "Hedef çözünürlüğe geç"}
            className="flex h-8 items-center rounded-[8px] px-2 text-[11.5px] font-medium text-metin-3 hover:bg-white/[0.06] hover:text-metin">{ayar.hedef ? "Hedef" : "Kat"}</button>
        )}
        {olcekDugmeleri}
        {olcekSinirli && enFazlaOlcek && masaustu && <Tooltip label={olcekNeden(Math.max(...olcekler)) ?? ""} side="top"><span className="hidden rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-metin-2 lg:inline">Bu görselde en fazla {enFazlaOlcek}×</span></Tooltip>}
        {/* Ayarlar */}
        <div className="relative">
          <button onClick={() => setAyarAcik((v) => !v)} aria-expanded={ayarAcik} aria-label="Gelişmiş ayarlar" title="Gelişmiş ayarlar"
            className={cn("flex h-10 w-10 items-center justify-center rounded-[11px] transition-colors", ayarAcik ? "bg-white/[0.1] text-metin" : "text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <Yuzen acik={ayarAcik} onKapat={() => setAyarAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Gelişmiş ayarlar" className={cn("max-h-[62vh] w-[min(360px,calc(100vw-24px))] overflow-y-auto [scrollbar-width:thin]", POP)}>
            <MenuKart className="rounded-none ring-0" baslik={<span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5 text-metin-2" />{mTanim ? mTanim.ad : "Yerel büyütme"} ayarları</span>}
              sag={mTanim?.eksen ? <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-metin-2">{mTanim.eksen}</span> : undefined}>
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-2 p-2">{ayarIcerik()}</motion.div>
            </MenuKart>
          </Yuzen>
        </div>
        <span className="flex-1" />
        {/* Çıktı özeti + CTA */}
        {kaynak && cikti && (
          <Tooltip label={tur === "gorsel" ? `300 DPI baskıda ${baskiCm(cikti.w, cikti.h).replace(/ baskı$/, "")}` : "Büyütülmüş videonun boyutu"} side="top">
            <motion.span key={`${cikti.w}x${cikti.h}`} initial={{ opacity: 0.4, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="mr-1 hidden h-11 items-center gap-2.5 rounded-full bg-white/[0.05] pl-1.5 pr-4 ring-1 ring-inset ring-white/[0.07] md:flex">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Maximize2 className="h-3.5 w-3.5" /></span>
              <span className="leading-tight">
                <span className="block text-[11px] text-metin-3">Çıktı boyutu</span>
                <span className="block whitespace-nowrap text-[13px] font-semibold tabular-nums text-metin">{cikti.w} × {cikti.h}<span className="ml-1.5 font-normal text-metin-2">{sayi(cikti.mp)} MP</span></span>
              </span>
            </motion.span>
          </Tooltip>
        )}
        <button onClick={() => (kaynak ? uret() : dosyaRef.current?.click())} title={kaynak ? eksik ?? "Ctrl+Enter" : undefined}
          className={cn("flex h-11 shrink-0 items-center gap-2 rounded-full bg-white pl-4 pr-3 text-[14px] font-semibold text-black transition active:scale-95 max-sm:w-full max-sm:justify-center", ((kaynak && eksik) || kilit) && "opacity-55")}>
          <Maximize2 className="h-4 w-4" strokeWidth={2.4} />
          {kaynak ? ctaEtiket : "Görsel seç"}
          {kaynak && (gercek ? !kilit && kredi > 0 && <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kredi}</span>
            : <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11.5px]">Ücretsiz</span>)}
        </button>
      </div>
      {(eksik && kaynak) || bilgiSatiri ? (
        <p className={cn("mx-1 mt-1.5 flex w-fit max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] max-sm:text-[11px]", kilit || model === "yerel" ? "bg-amber-300/10 text-amber-100 ring-1 ring-inset ring-amber-300/20" : "bg-white/[0.06] text-metin-2")}>
          {kilit || model === "yerel" ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" /> : null}{(kaynak && eksik && eksik !== "Büyütme sağlayıcısı bağlı değil") ? eksik : bilgiSatiri}
        </p>
      ) : null}
    </div>
  );

  /* ── Görüntüleyici ── */
  const isleniyorKatman = is && (is.durum === "kuyrukta" || is.durum === "isleniyor") ? (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25" />
      <div className={cn("relative flex items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-medium text-white", YUZEY)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {is.durum === "kuyrukta" ? (is.sira != null ? `Sırada · ${is.sira + 1}. sıra` : "Sıraya alındı") : is.model === "yerel" ? "Tarayıcıda büyütülüyor" : "Büyütülüyor"}
        <span className="tabular-nums text-white/55"><Sure bas={is.olusturma} /></span>
      </div>
    </div>
  ) : is?.durum === "hata" ? (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6">
      <div className={cn("max-w-[360px] p-5 text-center", POP)}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[12px] bg-rose-400/[0.12] text-rose-300 ring-1 ring-inset ring-rose-400/25"><Info className="h-5 w-5" /></span>
        <p className="mt-3 text-[15px] font-semibold text-metin">Büyütme başarısız</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-metin-2">{is.hata}</p>
        <p className="mx-auto mt-2 w-fit rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11.5px] text-metin-2">{is.kredi ? `${is.kredi} kredi iade edildi` : "Kredi düşmedi"}</p>
        <button onClick={() => ayarlariYukle(is)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-black active:scale-95"><RotateCcw className="h-3.5 w-3.5" />Ayarlarla yeniden dene</button>
      </div>
    </div>
  ) : null;

  const grup = <T extends string>(deger: T, onDegis: (v: T) => void, l: [T, string, typeof Square | null][]) => (
    <div className="flex gap-0.5 rounded-full p-0.5" role="radiogroup">
      {l.map(([id, ad, I]) => (
        <button key={id} role="radio" aria-checked={deger === id} onClick={() => onDegis(id)} title={ad}
          className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors active:scale-95", deger === id ? "bg-white text-black" : "text-white/65 hover:text-white")}>
          {I && <I className="h-3.5 w-3.5" />}<span className={cn(I && "hidden xl:inline")}>{ad}</span>
        </button>
      ))}
    </div>
  );
  const ustAraclar = once && (
    <div className={masaustu ? "pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-wrap items-start justify-between gap-2" : "flex flex-wrap items-center gap-1.5"}>
      <div className="pointer-events-auto flex items-center gap-1.5">
        {sonra && <div className={cn("rounded-full", YUZEY)}>{grup(gMod, setGMod, [["kaydir", "Kaydırıcı", SplitSquareHorizontal], ["yanyana", "Yan yana", Columns2], ["tek", "Tek", Square]])}</div>}
        {sonra && gMod === "tek" && (
          <button onPointerDown={() => setOnceBasili(true)} onPointerUp={() => setOnceBasili(false)} onPointerLeave={() => setOnceBasili(false)}
            className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium text-white", YUZEY)} title="Basılı tut ya da \\ tuşu">Basılı tut: önce</button>
        )}
      </div>
      <div className="pointer-events-auto flex items-center gap-1.5">
        {gorunenTur === "gorsel" && (
          <div className={cn("flex items-center rounded-full", YUZEY)}>
            {grup(String(yakinlik), (v) => setYakinlik(v === "sigdir" ? "sigdir" : (Number(v) as 1 | 2)), [["sigdir", "Sığdır", Maximize], ["1", "%100", null], ["2", "%200", null]])}
            {masaustu && <><span className="h-5 w-px bg-white/15" />
            <Tooltip label={buyutec ? "Büyüteci kapat · L" : "Büyüteç · imlecin altını 3× gösterir · L"} side="bottom">
              <button onClick={() => setBuyutec((v) => !v)} aria-pressed={buyutec} aria-label="Büyüteç"
                className={cn("m-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors", buyutec ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white")}><ScanSearch className="h-4 w-4" /></button>
            </Tooltip></>}
          </div>
        )}
        <div className={cn("relative", !masaustu && "hidden")}>
          <button onClick={() => setKisayolAcik((v) => !v)} aria-label="Klavye kısayolları" title="Kısayollar · ?" className={cn("flex h-9 w-9 items-center justify-center rounded-full", YUZEY, kisayolAcik ? "text-white" : "text-white/70 hover:text-white")}><Keyboard className="h-4 w-4" /></button>
          <Yuzen acik={kisayolAcik} onKapat={() => setKisayolAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Kısayollar" className={cn("w-[290px] p-3", POP)}>
            <p className="mb-2 text-[13px] font-semibold text-metin">Klavye kısayolları</p>
            {([["Önceyi göster (basılı tut)", ["\\"]], ["Sığdır · %100 · %200", ["0", "1", "2"]], ["Büyüteç", ["L"]], ["Büyüt", ["Ctrl", "Enter"]], ["Yakınlaşmayı değiştir", ["Çift tık"]]] as const).map(([ad, t]) => (
              <div key={ad} className="flex items-center justify-between gap-2 py-1 text-[12.5px]"><span className="text-metin-2">{ad}</span><span className="flex gap-1">{t.map((k) => <kbd key={k}>{k}</kbd>)}</span></div>
            ))}
          </Yuzen>
        </div>
        {is?.durum === "tamam" && (
          <div className={cn("flex items-center gap-0.5 rounded-full p-0.5", YUZEY)}>
            
            {is.sonucW && is.sonucH && (
              <span className="ml-1.5 mr-1 hidden text-[11.5px] tabular-nums text-white/70 xl:inline" title="Piksel artışı ve süre">
                <b className="font-semibold text-white">{sayi((is.sonucW * is.sonucH) / (is.kaynakW * is.kaynakH), 1)}×</b> piksel{is.bitis ? ` · ${Math.max(1, Math.round((is.bitis - is.olusturma) / 1000))} sn` : ""}
              </span>
            )}
            <Tooltip label="Sonucu bir kez daha büyüt" side="bottom"><button onClick={() => sonucuKaynakYap(is)} aria-label="Sonucu yeniden büyüt" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"><Repeat2 className="h-4 w-4" /></button></Tooltip>
            <Tooltip label="Bu ayarları geri yükle" side="bottom"><button onClick={() => ayarlariYukle(is)} aria-label="Ayarları geri yükle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"><RotateCcw className="h-4 w-4" /></button></Tooltip>
            <div className="relative ml-0.5 flex">
              <button onClick={() => void indir(is)} className="flex h-8 items-center gap-1.5 rounded-l-full bg-white pl-3.5 pr-2.5 text-[12.5px] font-semibold text-black active:scale-95"><Download className="h-3.5 w-3.5" />İndir</button>
              {is.tur === "gorsel" && (
                <button onClick={() => setIndirAcik((v) => !v)} aria-expanded={indirAcik} aria-label="İndirme biçimi" className="flex h-8 w-7 items-center justify-center rounded-r-full border-l border-black/10 bg-white text-black"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", indirAcik && "rotate-180")} /></button>
              )}
              <Yuzen acik={indirAcik} onKapat={() => setIndirAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="İndirme biçimi" className={cn("w-[260px] p-1.5", POP)}>
                <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-metin">Biçim seç</p>
                {([["png", "PNG", "Kayıpsız, en yüksek kalite"], ["jpg", "JPG", "Küçük dosya, paylaşım için"], ["webp", "WebP", "Web için, küçük ve net"]] as const).map(([b, ad, alt]) => (
                  <button key={b} onClick={() => void bicimleIndir(is, b)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-[10.5px] font-semibold text-metin">{ad}</span>
                    <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{ad} olarak indir</span><span className="block text-[11.5px] text-metin-2">{alt}</span></span>
                  </button>
                ))}
                {is.sonucW && is.sonucH && <p className="mx-1 mt-1 rounded-[10px] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-metin-2">{is.sonucW}×{is.sonucH} px · 300 DPI'da {baskiCm(is.sonucW, is.sonucH)}</p>}
              </Yuzen>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const goruntuleyici = once && (
    <div className="relative h-full w-full overflow-hidden"
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setGoruntuSurukle(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setGoruntuSurukle(false); }}
      onDrop={(e) => { e.preventDefault(); setGoruntuSurukle(false); dosyalarGeldi(e.dataTransfer.files); }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]" aria-hidden />
      <div className="absolute inset-0" style={{ padding: masaustu ? `64px 20px ${komutH + 28}px` : "8px" }}>
        <Karsilastirici key={`${once.url}|${sonra?.url ?? ""}`} tur={gorunenTur} once={once} sonra={sonra} mod={sonra ? gMod : "tek"}
          yakinlik={gorunenTur === "video" ? "sigdir" : yakinlik} onYakinlik={setYakinlik} ust={isleniyorKatman}
          sonraEtiket={is?.model === "yerel" ? "Yerel" : is ? upscaleModel(is.model)?.ad ?? "Sonra" : "Sonra"} onceGoster={onceBasili} buyutec={buyutec && gorunenTur === "gorsel"} />
      </div>
      {masaustu && ustAraclar}
      {goruntuSurukle && (
        <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-[22px] border-2 border-dashed border-white/60 bg-black/60 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-[16px] font-semibold text-white"><Upload className="h-5 w-5" />Yeni kaynak olarak aç</span>
        </div>
      )}
    </div>
  );

  /* ── Boş ekran: düzenleyici kabuğu hazır, ortada açma kartı, yanda örnekler (Düzenle sayfasıyla aynı dil) ── */
  const ornekSec = (o: (typeof ORNEKLER)[number]) => { hazirUygula(fal === false ? null : o.hazir); void kaynakAyarla({ url: o.gorsel, onizleme: o.gorsel, ad: o.ad, tur: "gorsel" }); };
  const birakma = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setSuruklen(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSuruklen(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSuruklen(false); dosyalarGeldi(e.dataTransfer.files); },
  };
  const acmaKarti = (
    <section className={cn("w-full overflow-hidden rounded-[24px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
        <Upload className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">{tur === "video" ? "Büyütülecek videoyu aç" : "Büyütülecek görseli aç"}</span>
        <span className="ml-auto rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2 max-sm:hidden">{tur === "video" ? `MP4, WebM, MOV · ${GIRDI_MAX_MB.video} MB · 60 sn` : `PNG, JPG, WebP · ${GIRDI_MAX_MB.gorsel} MB`}</span>
      </div>
      <div className={cn("m-3 flex flex-col items-center gap-4 rounded-[18px] border border-dashed px-4 py-8 text-center transition-colors", suruklen ? "border-white/60 bg-white/[0.06]" : "border-white/15")}>
        <motion.span animate={suruklen ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08]">{tur === "video" ? <Film className="h-6 w-6" /> : <Upload className="h-6 w-6" />}</motion.span>
        <span className="text-[15px] font-medium text-metin">{suruklen ? "Bırak, büyütmeye başla" : tur === "video" ? "Videoyu buraya bırak" : "Görseli buraya bırak"}</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => dosyaRef.current?.click()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95"><Upload className="h-4 w-4" />{tur === "video" ? "Video yükle" : "Görsel yükle"}</button>
          <button onClick={() => setKitaplikAcik(true)} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Images className="h-4 w-4" />Kitaplıktan</button>
        </div>
        <span className="flex flex-wrap items-center justify-center gap-1.5 text-[12px] text-metin-2"><span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1">Yapıştır <kbd>Ctrl</kbd><kbd>V</kbd></span>{tur === "gorsel" && <span className="rounded-full bg-white/[0.06] px-3 py-1">Toplu: 20 görsele kadar</span>}</span>
      </div>
      <div className="grid grid-cols-3 border-t border-white/[0.07] max-sm:grid-cols-1">
        {(tur === "video"
          ? [[Film, "4×'e kadar", "4K, ses korunur"], [Sparkles, "Renk düzeltme", "Kayma olmaz"], [SplitSquareHorizontal, "Karşılaştırma", "Eşzamanlı oynatma"]]
          : [[Maximize2, "10×'e kadar", "16K kenar"], [ScanFace, "Yüz iyileştirme", "Doğal portre"], [SplitSquareHorizontal, "Karşılaştırma", "Piksel piksel"]]
        ).map(([I, ad, alt], k) => {
          const C = I as typeof Film;
          return (
            <span key={ad as string} className={cn("flex items-center gap-2.5 px-4 py-3", k > 0 && "sm:border-l border-white/[0.07] max-sm:border-t")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><C className="h-4 w-4 text-metin-2" /></span>
              <span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] font-semibold text-metin">{ad as string}</span><span className="block truncate text-[11.5px] text-metin-2">{alt as string}</span></span>
            </span>
          );
        })}
      </div>
    </section>
  );
  const ornekBolumu = (sutun: string) => tur === "gorsel" && (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Örnekle dene</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-metin-2">İçeriğe göre ayar</span></div>
      <div className={cn("grid gap-2 p-2.5", sutun)}>
        {ORNEKLER.map((o, i) => (
          <motion.button key={o.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} onClick={() => ornekSec(o)} className="group min-w-0 text-left">
            <span className="relative block aspect-[4/5] overflow-hidden rounded-[14px] outline outline-1 -outline-offset-1 outline-white/[0.08] transition group-hover:outline-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 py-0.5 pl-1 pr-2 text-[11px] font-medium text-white backdrop-blur"><Maximize2 className="h-3 w-3" />{o.not}</span>
            </span>
            <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin-2 group-hover:text-metin">{o.ad}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
  const sonBolumu = isler.length > 0 && (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><History className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Son büyütmeler</span><span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-metin-2">{isler.length}</span></div>
      <div className="space-y-1.5 p-2">{isler.slice(0, 4).map((i) => <GecmisOgesi key={i.id} i={i} secili={false} yatay={false} onAc={() => isiAc(i)} onSil={() => sil(i)} onIndir={() => void indir(i)} />)}</div>
    </section>
  );
  const adimlar = (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Nasıl çalışır</span></div>
      <ol className="space-y-1.5 p-2">
        {[["Videonu aç", "MP4, MOV ya da WebM; sürükleyip bırakabilirsin."], ["Model ve ölçeği seç", "Çıktı boyutu kutunun sağında görünür."], ["Büyüt", "Sonuç Geçmiş'e düşer; öncesiyle yan yana izlersin."]].map(([a, n], k) => (
          <li key={a} className="flex items-start gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[12px] font-semibold tabular-nums text-metin">{k + 1}</span>
            <span className="min-w-0 leading-snug"><span className="block text-[13px] font-semibold text-metin">{a}</span><span className="block text-[12px] text-metin-2">{n}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
  /** Telefon */
  const bos = (
    <div {...birakma} className="space-y-3 px-3 pb-8 pt-1">
      <div className="w-fit">{turSekmesi}</div>
      {acmaKarti}
      {sonBolumu}
      {ornekBolumu("grid-cols-2")}
    </div>
  );
  /** Masaüstü */
  const bosMasaustu = (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Görsel stüdyosuna dön" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex min-w-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Maximize2 className="h-4 w-4" /></span>
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Büyüt</span>
            <span className="block whitespace-nowrap text-[11.5px] text-metin-2">{tur === "video" ? "Videoyu 4K'ya kadar netleştir" : "Kaybolan detayı geri getir, 10×'e kadar büyüt"}</span>
          </span>
        </div>
        <div className="flex flex-1 justify-center">{turSekmesi}</div>
        <span className="w-[150px]" />
      </header>
      <div className="flex min-h-0 flex-1">
        <div {...birakma} className="relative min-w-0 flex-1 bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]">
          <div className="absolute inset-x-0 top-[44%] flex -translate-y-1/2 justify-center px-6">
            <motion.div key={tur} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-[560px]">{acmaKarti}</motion.div>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className={cn("flex w-full max-w-[860px] items-center gap-2 rounded-[22px] p-2 opacity-55", YUZEY)}>
              <span className="px-2 text-[14px] text-metin-2">Önce bir {tur === "video" ? "video" : "görsel"} aç, sonra model ve ölçeği seç</span>
              <span className="flex-1" />
              <span className="flex h-11 items-center gap-2 rounded-full bg-white/70 px-4 text-[14px] font-semibold text-black"><Maximize2 className="h-4 w-4" />Büyüt</span>
            </div>
          </div>
        </div>
        <motion.div style={{ width: yanEn }} className="relative shrink-0 border-l border-white/[0.06] bg-[#111113]">
          <KenarTutamac en={yanEn} anahtar="buyut-yan" varsayilan={300} min={240} etiket="Yan panelin genişliği" />
          <aside className="h-full space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
          {sonBolumu}
          {tur === "gorsel" ? ornekBolumu("grid-cols-2") : adimlar}
          </aside>
        </motion.div>
      </div>
    </>
  );

  const gecmisListe = (yatay: boolean) => (
    <div className={cn(yatay ? "gizli-scroll flex gap-2 overflow-x-auto pb-1" : "space-y-1.5")}>
      {isler.map((i) => <GecmisOgesi key={i.id} i={i} secili={seciliIs === i.id} yatay={yatay} onAc={() => isiAc(i)} onSil={() => sil(i)} onIndir={() => void indir(i)} />)}
    </div>
  );

  const dosyaGirdisi = (
    <input ref={dosyaRef} type="file" hidden multiple={tur === "gorsel"} accept={tur === "video" ? "video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
      onChange={(e) => { dosyalarGeldi(e.target.files); e.target.value = ""; }} />
  );
  const kitaplikModal = (
    <AnimatePresence>{kitaplikAcik && <KitaplikPaneli tur={tur} alt="Büyütmek istediğin üretimi seç" eylem="Büyüt" eylemIkon={Maximize2} onKapat={() => setKitaplikAcik(false)} onYukle={() => dosyaRef.current?.click()} onSec={(u) => {
      setKitaplikAcik(false);
      const url = (u.tur === "video" ? u.videoUrl : saltUrl(u.gorselUrl))!;
      if (u.tur === "video") modelSec("flashvsr");
      void kaynakAyarla({ url, onizleme: url, ad: u.baslik.slice(0, 60) || "Kitaplıktan", tur: u.tur === "video" ? "video" : "gorsel", uretimId: u.id });
    }} />}</AnimatePresence>
  );

  const topluHap = (
    <AnimatePresence>
      {toplu && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="status"
          className={cn("fixed left-1/2 top-[calc(var(--ust-nav)+64px)] z-[150] flex -translate-x-1/2 items-center gap-2.5 rounded-full py-2 pl-3 pr-4 text-[13px] font-medium text-metin", YUZEY)}>
          <Loader2 className="h-4 w-4 animate-spin" />Toplu büyütme hazırlanıyor
          <span className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[12px] tabular-nums">{toplu.biten}/{toplu.toplam}</span>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.1]"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${(toplu.biten / toplu.toplam) * 100}%` }} /></span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!yuklendi) return <div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />;

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div data-kendi-kisayol className="flex min-h-[100dvh] flex-col bg-zemin">
        {dosyaGirdisi}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-zemin/95 px-2 backdrop-blur-md">
          <button onClick={() => (kaynak ? (setKaynak(null), setSeciliIs(null)) : router.push("/panel/gorsel"))} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="flex-1 text-[17px] font-semibold text-metin">Büyüt</h1>
          {suren > 0 && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-metin-2"><Loader2 className="h-3 w-3 animate-spin" />{suren}</span>}
          {kaynak && <button onClick={() => dosyaRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin"><Upload className="h-4 w-4" />Değiştir</button>}
        </header>
        {!once ? bos : (
          <>
            <div className="w-fit px-3 pb-2">{turSekmesi}</div>
            <div className="relative mx-3 h-[50vh] min-h-[280px] overflow-hidden rounded-[18px] ring-1 ring-white/[0.07]">{goruntuleyici}</div>
            <div className="mx-3 mt-2">{ustAraclar}</div>
            {kaynak && (
              <div className="mx-3 mt-2 flex items-center gap-2 text-[12px] text-metin-3">
                <span className="tabular-nums">{kaynak.w}×{kaynak.h}</span>{cikti && <><ChevronLeft className="h-3 w-3 rotate-180" /><span className="font-semibold tabular-nums text-metin">{cikti.w}×{cikti.h}</span><span>· {sayi(cikti.mp)} MP</span></>}
              </div>
            )}
            {tur === "gorsel" && <section className={cn("mx-3 mt-3 overflow-hidden rounded-[20px]", YUZEY)}><div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Ne büyütüyorsun?</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-metin-2">Model ve ayar seçilir</span></div><div className="p-2.5">{hazirIzgara("grid-cols-3")}</div></section>}
            {isler.length > 0 && <section className={cn("mx-3 mt-3 overflow-hidden rounded-[20px]", YUZEY)}><div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><History className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Geçmiş</span><span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-metin-2">{isler.length}</span></div><div className="p-2.5">{gecmisListe(true)}</div></section>}
            <div className="h-44" />
            <div className="flex-1" />
            <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komut}</div>
          </>
        )}
        {kitaplikModal}
        {topluHap}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div data-kendi-kisayol className="flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0d0e10]">
      {dosyaGirdisi}
      {!once ? bosMasaustu : (
        <>
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
            <button onClick={() => { setKaynak(null); setSeciliIs(null); }} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><ChevronLeft className="h-5 w-5" /></button>
            {kaynak ? (
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[9px] ring-1 ring-white/10">
                  {kaynak.tur === "video" ? <video src={kaynak.onizleme} muted className="h-full w-full object-cover" /> : (/* eslint-disable-next-line @next/next/no-img-element */ <img src={kaynak.onizleme} alt="" className="h-full w-full object-cover" />)}
                  {kaynak.yukleniyor && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-3.5 w-3.5 animate-spin text-white" /></span>}
                </span>
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate text-[13.5px] font-semibold text-metin">{kaynak.ad}</p>
                  <p className="text-[11.5px] tabular-nums text-metin-3">{kaynak.w}×{kaynak.h} · {sayi((kaynak.w * kaynak.h) / 1e6)} MP{kaynak.sure ? ` · ${sayi(kaynak.sure)} sn` : ""}</p>
                </div>
                <button onClick={() => dosyaRef.current?.click()} className="ml-1 flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><Upload className="h-3.5 w-3.5" />Değiştir</button>
              </div>
            ) : is ? (
              <div className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {is.tur === "gorsel" ? <img src={is.sonucUrl ?? is.kaynakUrl} alt="" className="h-9 w-9 shrink-0 rounded-[9px] object-cover ring-1 ring-white/10" /> : <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/[0.08]"><Film className="h-4 w-4" /></span>}
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate text-[13.5px] font-semibold text-metin">{is.ad}</p>
                  <p className="text-[11.5px] tabular-nums text-metin-2">Geçmişten · {is.kaynakW}×{is.kaynakH}{is.sonucW ? ` → ${is.sonucW}×${is.sonucH}` : ""}</p>
                </div>
                <button onClick={() => ayarlariYukle(is)} className="ml-1 flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-metin transition hover:bg-white/[0.12] active:scale-95"><RotateCcw className="h-3.5 w-3.5" />Ayarlarla aç</button>
              </div>
            ) : null}
            <div className="flex flex-1 justify-center">{turSekmesi}</div>
            {!gecmisAcik && isler.length > 0 && (
              <button onClick={() => setGecmisAcik(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.06] hover:text-metin">
                <History className="h-4 w-4" />Geçmiş<span className="rounded-full bg-white/[0.1] px-1.5 text-[11px] font-semibold tabular-nums text-metin">{isler.length}</span>
              </button>
            )}
          </header>
          <div className="flex min-h-0 flex-1">
            <div className="relative min-w-0 flex-1">
              {goruntuleyici}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
                <div ref={komutRef} className="pointer-events-auto w-full max-w-[860px]">{komut}</div>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {gecmisAcik && isler.length > 0 && (
                <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative shrink-0 overflow-hidden border-l border-white/[0.06] bg-[#111113]">
                  <KenarTutamac en={gecmisEn} anahtar="buyut-gecmis" varsayilan={260} etiket="Geçmiş panelinin genişliği" />
                  <motion.div style={{ width: gecmisEn }} className="flex h-full flex-col">
                  <div className="flex h-12 shrink-0 items-center justify-between px-3">
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-metin">Geçmiş <span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums text-metin-2">{isler.length}</span>
                      {suren > 0 && <span className="flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-metin"><Loader2 className="h-3 w-3 animate-spin" />{suren} sürüyor</span>}</span>
                    <button onClick={() => setGecmisAcik(false)} aria-label="Geçmişi gizle" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-metin-3 hover:bg-white/[0.06] hover:text-metin"><PanelRightClose className="h-4 w-4" /></button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">{gecmisListe(false)}</div>
                  <button onClick={() => router.push("/panel/kitaplik")} className="m-3 mt-0 flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/[0.04] text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-metin"><Images className="h-3.5 w-3.5" />Kitaplıkta aç</button>
                  </motion.div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      {kitaplikModal}
      {topluHap}
    </div>
  );
}

/* ═════════════ Küçük parçalar ═════════════ */


const HAZIR_GORSEL: Record<string, string> = {
  oto: "/gercek/galeri/manzara1.webp", portre: "/gercek/arac/upscale-once.webp", foto: "/gercek/galeri/urun1.webp", eski: "/gercek/gorsel/iyilestir-kusurlu.webp",
  dusuk: "/gercek/galeri/portre3.webp", illustrasyon: "/gercek/galeri/3d1.webp", metin: "/gercek/galeri/soyut1.webp", yaratici: "/gercek/galeri/portre1.webp",
};
const ORNEKLER: { ad: string; not: string; gorsel: string; hazir: string }[] = [
  { ad: "Portre", not: "Yüz iyileştirmeli", gorsel: "/gercek/arac/upscale-once.webp", hazir: "portre" },
  { ad: "Ürün", not: "Doğal, dengeli", gorsel: "/gercek/galeri/urun1.webp", hazir: "foto" },
  { ad: "Eski fotoğraf", not: "Onarım", gorsel: "/gercek/gorsel/iyilestir-kusurlu.webp", hazir: "eski" },
  { ad: "İllüstrasyon", not: "3D ve çizim", gorsel: "/gercek/galeri/3d1.webp", hazir: "illustrasyon" },
];
const MODEL_LOGO: Partial<Record<UpscaleModelId, string>> = { seedvr: "Seedream 4.0", topaz: "Topaz", clarity: "Clarity", crystal: "Crystal", ideogram: "Ideogram 3", recraft: "Recraft V4.1", flashvsr: "FlashVSR", "seedvr-video": "Seedream 4.0" };
const YENI_MODELLER: UpscaleModelId[] = ["crystal", "ideogram"];
const TOPAZ_IKON: Record<string, typeof Sparkles> = {
  "Standard V2": Maximize2, "High Fidelity V2": Gem, "Low Resolution V2": Minimize2, "Recovery V2": History, CGI: Box, "Text Refine": Type, Redefine: Wand2, "Wonder 3": Sparkles, "Standard MAX": Crown,
};



function Sure({ bas }: { bas: number }) {
  const [, tik] = useState(0);
  useEffect(() => { const t = setInterval(() => tik((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.round((Date.now() - bas) / 1000));
  return <>{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</>;
}

function GecmisOgesi({ i, secili, yatay, onAc, onSil, onIndir }: { i: UpscaleIs; secili: boolean; yatay: boolean; onAc: () => void; onSil: () => void; onIndir: () => void }) {
  const surer = i.durum === "kuyrukta" || i.durum === "isleniyor";
  const gorsel = i.sonucUrl ?? i.kaynakUrl;
  const m = i.model === "yerel" ? "Yerel" : upscaleModel(i.model)?.ad;
  const kucuk = (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10", yatay ? "h-[88px] w-[88px]" : "h-12 w-12")}>
      {i.tur === "video"
        ? <video src={gorsel} muted className="h-full w-full object-cover" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={gorsel} alt="" className="h-full w-full object-cover" loading="lazy" />}
      {surer && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
      {i.durum === "hata" && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10.5px] font-medium text-rose-300">Hata</span>}
      {i.tur === "video" && <Film className="absolute bottom-1 left-1 h-3 w-3 text-white/80" />}
    </span>
  );
  if (yatay) {
    return (
      <button onClick={onAc} className={cn("shrink-0 rounded-[12px] p-1 text-left ring-1 ring-inset", secili ? "bg-white/[0.1] ring-white/60" : "bg-white/[0.03] ring-white/[0.07]")}>
        {kucuk}
        <span className="mt-1 block w-[88px] truncate px-0.5 text-[10.5px] tabular-nums text-metin-3">{i.olcek ? `${i.olcek}× · ` : ""}{m}</span>
      </button>
    );
  }
  return (
    <div className={cn("group relative flex items-center gap-2.5 rounded-[12px] p-1.5 ring-1 ring-inset transition-colors", secili ? "bg-white/[0.09] ring-white/50" : "bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.05]")}>
      <button onClick={onAc} className="absolute inset-0 rounded-xl" aria-label={`${i.ad} aç`} />
      {kucuk}
      <span className="pointer-events-none min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-metin">{i.ad}</span>
        <span className="mt-0.5 flex flex-wrap gap-1">
          <span className="rounded-full bg-white/[0.07] px-1.5 text-[10.5px] tabular-nums text-metin-2">{surer ? (i.durum === "kuyrukta" ? "Sırada" : "İşleniyor") : i.durum === "hata" ? "Başarısız" : `${i.sonucW}×${i.sonucH}`}</span>
          <span className="rounded-full bg-white/[0.07] px-1.5 text-[10.5px] text-metin-2">{i.olcek ? `${i.olcek}× · ` : ""}{m}</span>
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-metin-3">{zamanOnce(i.olusturma)}{i.kredi ? <> · <KrediYildiz className="h-2.5 w-2.5" />{i.kredi}</> : null}</span>
      </span>
      {!surer && (
        <span className="relative z-10 hidden gap-0.5 group-hover:flex [@media(hover:none)]:flex">
          {i.durum === "tamam" && <button onClick={onIndir} aria-label="İndir" className="rounded-md p-1 text-metin-3 hover:bg-white/[0.08] hover:text-metin"><Download className="h-3.5 w-3.5" /></button>}
          <button onClick={onSil} aria-label="Geçmişten kaldır" className="rounded-md p-1 text-metin-3 hover:bg-white/[0.08] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
        </span>
      )}
    </div>
  );
}

/** Model simgesi: resmî logo (yuvarlak). Logosu olmayan açık kaynak modelde nötr simge (harf karosu değil). */
function ModelSimge({ id, boyut = 32 }: { id: UpscaleModelId; boyut?: number }) {
  const ad = MODEL_LOGO[id];
  const logo = ad ? modelLogoUrl(ad) : null;
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" style={{ width: boyut, height: boyut }}>
      {logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logo} alt="" aria-hidden className="object-contain" style={{ width: boyut * 0.56, height: boyut * 0.56, borderRadius: boyut * 0.12 }} />
        : upscaleModel(id)?.tur === "video" ? <Film className="text-metin-2" style={{ width: boyut * 0.44, height: boyut * 0.44 }} /> : <Maximize2 className="text-metin-2" style={{ width: boyut * 0.44, height: boyut * 0.44 }} />}
    </span>
  );
}
