"use client";

/**
 * Preset stüdyosu, "Kendi efektini yap" (2026-10-29, galeri ve onaylı stüdyo düzeni diliyle baştan):
 * üstte ince satır (geri, yerinde düzenlenen ad, kayıt durumu, tikli adım hapı, Yayınla);
 * ortada büyük tuval adıma göre değişir:
 *   1 Hareketi tarif et: büyük istem kartı + görselli çip popover'ları (kamera, atmosfer, tempo, kategori),
 *     altında hazır fikir kartları ve "bir efektten çoğalt" rafı.
 *   2 Farklı yüzlerle test et: test yüzü şeridi, seçili testin büyük önizlemesi, test ızgarası.
 *   3 Kapak ve yayınla: test sonuçlarından kapak, açıklama, kategori; sağda galerideki kartın canlı hali + hazırlık listesi.
 * Altta yüzen komut kutusu: test yüzü, model (gerçek logo), kalite, oran, beyaz "Test et" + kredi.
 * Taslak her değişiklikte otomatik kaydedilir; yayındaki preset "Değişiklikleri yayınla"ya kadar canlıya yazılmaz.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, Copy, Pencil, FlaskConical, Gauge, ImagePlus, Images, Loader2, Play, Rocket,
  Search, ShieldCheck, Globe, Link2, Lock, Eye, EyeOff, Sparkles, Sun, Trash2, Upload, Wand2, Zap,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { usePresetler, type OzelPreset, type TarifYapisi } from "@/store/usePresetler";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { KATEGORI_AD, KATEGORI_SIRA, OZEL_KREDI, RESMI_PRESETLER, type KatalogPreset } from "@/lib/presetKatalog";
import { ATMOSFERLER, BOS_YAPI, FIKIRLER, KAMERALAR, TEMPOLAR, TEST_FOTOLARI, ozneUyarisi, tarifDerle } from "@/lib/presetTarif";
import { gorselKucult, kapakUrl } from "@/components/kitaplik/yardimci";
import { MarkaKare } from "@/components/studyo/hf";
import { Yuzen } from "@/components/ui/Yuzen";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import { usePaylasim } from "@/store/usePaylasim";
import { EK_PAYLAR, tutamac, yaraticiPayi } from "@/lib/presetTopluluk";
import { PRESET_KREDI_TL, tl } from "@/lib/earn/kampanyalar";
import { KrediJeton } from "@/components/ui/KrediHap";
import { KAT_IKON, PresetKapak } from "./PresetKarti";
import { PRESET_MODELLER, presetBedel, useGorunur, type Kalite } from "./presetOrtak";
import { Anahtar, Cip, KrediParlak, Segment, VideoKaro, YayinKarti, ease, yay } from "./studyo/parcalar";

const EYLEM_MIN = 20;
const ORAN_NOT: Record<string, string> = { "9:16": "Reels, TikTok", "1:1": "Gönderi", "16:9": "YouTube" };

/* Görselli seçiciler: her kamera hareketi kendi örnek videosuyla, atmosfer ve tempo örnek kareyle. */
const H = (ad: string) => ({ gorsel: `/gercek/video-hareket/${ad}-poster.webp`, video: `/gercek/video-hareket/${ad}.mp4` });
const KAMERA_MEDYA: Record<string, { gorsel: string; video: string }> = {
  sabit: H("focus-pull"), yaklas: H("dolly-in"), uzaklas: H("dolly-out"), yorunge: H("camera-orbit"), crash: H("crash-zoom"),
  fpv: H("fpv-dive"), el: H("handheld"), vinc: H("crane-up"), "dolly-zoom": H("vertigo"),
};
const ATMOSFER_GORSEL: Record<string, string> = {
  sinematik: "/gercek/sinema/cark-isik-contre-jour.webp", altin: "/gercek/sinema/cark-isik-altin-saat.webp", neon: "/gercek/sinema/cark-isik-neon.webp",
  karanlik: "/gercek/sinema/cark-isik-tepe-dusus.webp", ruya: "/gercek/moodboard/mood-pastel.webp", studyo: "/gercek/sinema/cark-isik-yumusak-capraz.webp",
  vfx: "/gercek/arac/vfx-cgi.webp", retro: "/gercek/sinema/cark-renk-paleti-sepya-film.webp",
};
const TEMPO_MEDYA: Record<string, { gorsel: string; video: string }> = { agir: H("slow-motion"), dogal: H("skate-cruise"), enerjik: H("whip-pan") };
const tr = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/**
 * Demo test sonucu tarifle uyuşsun: sağlayıcı bağlı değilken rastgele klip yerine tarifin kelimelerine ve atmosfere
 * en yakın örnek klip seçilir; eşleşme yoksa 1. adımda gösterilen kamera hareketinin klibi kullanılır.
 */
const DEMO_ETIKET: [string, string][] = [
  ["camera-orbit", "neon mor isik sahne dans gece kulup parti"],
  ["crash-zoom", "aksiyon savas zirh dovus patlama asker"],
  ["dolly-out", "depo bos yalniz endustriyel fabrika"],
  ["fpv-dive", "kanyon doga ucus drone dag kaya"],
  ["crane-up", "ucurum deniz manzara sahil okyanus"],
  ["vertigo", "koridor otel gerilim korku karanlik"],
  ["focus-pull", "kahve ev sakin sabah fincan"],
  ["dolly-in", "oda portre koltuk kitap"],
  ["handheld", "pazar carsi kalabalik sokak yurur"],
];
function demoKlipSec(tarif: string, kamera: string, atmosfer: string[]) {
  const kelime = tr(`${tarif} ${atmosfer.join(" ")} ${atmosfer.join(" ")}`).split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const puan = (etiket: string) => etiket.split(" ").reduce((a, e) => a + kelime.filter((w) => w.startsWith(e)).length, 0);
  const en = DEMO_ETIKET.map(([ad, e]) => ({ ad, p: puan(e) })).sort((a, b) => b.p - a.p)[0];
  const m = en && en.p > 0 ? H(en.ad) : KAMERA_MEDYA[kamera] ?? KAMERA_MEDYA.sabit;
  return { video: m.video, poster: m.gorsel };
}

type Gorunurluk = "topluluk" | "baglanti" | "ozel";
type Form = { ad: string; kategori: string; aciklama: string; yapi: TarifYapisi; kapak?: string; kapakVideo?: string; kaynak?: string; gorunurluk: Gorunurluk; ekKredi: number; istemGorunur: boolean; ozgun: boolean };
type Adim = 1 | 2 | 3;
type Pop = null | "kamera" | "atmosfer" | "tempo" | "kategori" | "yuz" | "model" | "kalite" | "oran";

const ORNEK_EYLEMLER = [
  "Kameraya dönüp göz kırpar, sonra gülümser",
  "Yavaşça yerden yükselir, etrafında ışık parçacıkları döner",
  "Elini sallar, bedeni altın tozuna dönüşüp dağılır",
  "Rüzgârda saçları savrulurken uzaklara bakar",
];
const PAYLASIM_VARSAYILAN = { gorunurluk: "topluluk" as Gorunurluk, ekKredi: 8, istemGorunur: false, ozgun: false };
const bosForm = (): Form => ({ ad: "", kategori: "SİNEMATİK", aciklama: "", yapi: { ...BOS_YAPI, atmosfer: [...BOS_YAPI.atmosfer] }, ...PAYLASIM_VARSAYILAN });
const formdan = (p: OzelPreset): Form => ({
  ad: p.ad, kategori: p.kategori, aciklama: p.aciklama, kapak: p.kapak, kapakVideo: p.kapakVideo, kaynak: p.kaynak,
  gorunurluk: p.gorunurluk ?? "topluluk", ekKredi: p.kaynak ? 0 : p.ekKredi ?? 8, istemGorunur: p.istemGorunur ?? false, ozgun: p.durum === "yayinda",
  // Eski presetlerin yapısı yok: tarifleri "elle" alanına taşınır, hiçbir şey kaybolmaz.
  yapi: p.yapi ?? { ...BOS_YAPI, eylem: "", elle: p.tarif },
});
/** Resmi bir presetten çoğaltma: tarifi elle alanına gelir, kullanıcı oradan değiştirir. */
const resmidenForm = (r: KatalogPreset): Form => ({
  ad: `${r.ad} (benim)`.slice(0, 32), kategori: r.kategoriler.find((k) => k !== "VIRAL") ?? "SİNEMATİK", aciklama: r.aciklama.slice(0, 140),
  yapi: { ...BOS_YAPI, eylem: "", elle: r.tarif }, kaynak: r.slug, ...PAYLASIM_VARSAYILAN, ekKredi: 0,
});
/** Test bedeli: preset bedel kuralıyla, Kling 3.0 HD karşılığı OZEL_KREDI. */
const TEST_TABAN = { kredi: OZEL_KREDI } as KatalogPreset;

export function PresetStudyosu() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const kaynakParam = params.get("kaynak");
  const girisli = useAuth((s) => !!s.kullanici);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const uretimler = useProjeler((s) => s.uretimler);
  const ozel = usePresetler((s) => s.ozel);
  const ekle = usePresetler((s) => s.ozelEkle);
  const guncelle = usePresetler((s) => s.ozelGuncelle);
  const sil = usePresetler((s) => s.ozelSil);
  const testEkle = usePresetler((s) => s.testEkle);
  const sag = useSaglayicilar();

  const [hazir, setHazir] = useState(false);
  const [slug, setSlug] = useState<string | null>(idParam);
  const kayit = slug ? ozel.find((x) => x.slug === slug) ?? null : null;
  const [f, setF] = useState<Form>(bosForm);
  const [baslandi, setBaslandi] = useState(false);
  const [kaydedildi, setKaydedildi] = useState<number | null>(null);
  const [adim, setAdim] = useState<Adim>(1);
  const [testFoto, setTestFoto] = useState<string>(TEST_FOTOLARI[0].url);
  const [yukleme, setYukleme] = useState<string | null>(null);
  const [yuzKaynak, setYuzKaynak] = useState<"ornek" | "kitaplik">("ornek");
  const [oran, setOran] = useState<string>("9:16");
  const [modelAd, setModelAd] = useState("Kling 3.0");
  const [kalite, setKalite] = useState<Kalite>("hd");
  const [secili, setSecili] = useState<string | null>(null);
  const [pop, setPop] = useState<Pop>(null);
  const [elleAcik, setElleAcik] = useState(false);
  const [onayYok, setOnayYok] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [isleniyor, setIsleniyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const kapakRef = useRef<HTMLInputElement>(null);
  const istemRef = useRef<HTMLTextAreaElement>(null);

  // İlk yükleme: düzenlenecek kayıt, çoğaltılacak resmi preset ya da boş başlangıç
  useEffect(() => {
    if (hazir) return;
    setHazir(true);
    if (idParam) {
      const p = usePresetler.getState().ozel.find((x) => x.slug === idParam);
      if (!p) { toast.error("Preset bulunamadı", { description: "Silinmiş ya da bağlantı hatalı olabilir. Yeni bir preset oluşturabilirsin." }); router.replace("/panel/presetler/olustur"); setSlug(null); return; }
      setF(formdan(p)); setBaslandi(true);
      if (p.testler?.length) setAdim(2);
      return;
    }
    if (kaynakParam) {
      const r = RESMI_PRESETLER.find((x) => x.slug === kaynakParam);
      if (r) { setF(resmidenForm(r)); setBaslandi(true); setElleAcik(true); }
    }
  }, [hazir, idParam, kaynakParam, router]);

  const model = PRESET_MODELLER.find((m) => m.ad === modelAd) ?? PRESET_MODELLER[0];
  useEffect(() => { if (model.oranlar.length && !model.oranlar.includes(oran)) setOran(model.oranlar[0]); }, [model, oran]);
  const testKredi = presetBedel(TEST_TABAN, model.ad, kalite);
  const bagli = sag ? !!sag[model.saglayici] : null;

  const tarif = tarifDerle(f.yapi);
  const elleMi = !!f.yapi.elle?.trim();
  const eylemTamam = elleMi ? (f.yapi.elle ?? "").trim().length >= 40 : f.yapi.eylem.trim().length >= EYLEM_MIN;
  const ozneKelime = ozneUyarisi(elleMi ? f.yapi.elle ?? "" : f.yapi.eylem);
  const icerikVar = !!(f.ad.trim() || f.yapi.eylem.trim() || f.yapi.elle?.trim());

  // Otomatik taslak: ilk anlamlı girişte kayıt açılır, sonra her değişiklik 600 ms sonra yazılır.
  const [bekleyen, setBekleyen] = useState(false);
  useEffect(() => {
    if (!hazir || !baslandi || !icerikVar) return;
    const mevcut = slug ? usePresetler.getState().ozel.find((x) => x.slug === slug) : undefined;
    if (mevcut && mevcut.durum !== "taslak") { setBekleyen(true); return; }
    const t = setTimeout(() => {
      const veri = { ad: f.ad.trim(), kategori: f.kategori, aciklama: f.aciklama.trim(), tarif, yapi: f.yapi, kapak: f.kapak, kapakVideo: f.kapakVideo, kaynak: f.kaynak };
      if (slug && usePresetler.getState().ozel.some((x) => x.slug === slug)) guncelle(slug, veri);
      else {
        const y = ekle({ ...veri, durum: "taslak" });
        setSlug(y.slug);
        router.replace(`/panel/presetler/olustur?id=${y.slug}`, { scroll: false });
      }
      setKaydedildi(Date.now());
    }, 600);
    return () => clearTimeout(t);
  }, [f, tarif, hazir, baslandi, icerikVar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (slug) router.prefetch(`/panel/presetler/${slug}`); }, [slug, router]);
  useEffect(() => {
    if (!bekleyen) return;
    const uyar = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, [bekleyen]);

  const ayarla = <K extends keyof Form>(k: K, v: Form[K]) => { setBaslandi(true); setF((x) => ({ ...x, [k]: v })); };
  const yapiAyarla = (p: Partial<TarifYapisi>) => { setBaslandi(true); setF((x) => ({ ...x, yapi: { ...x.yapi, ...p } })); };

  const testler = useMemo(() => {
    const idler = kayit?.testler ?? [];
    return idler.map((id) => uretimler.find((u) => u.id === id)).filter(Boolean).reverse() as Uretim[];
  }, [kayit?.testler, uretimler]);
  const tamamTest = testler.filter((u) => u.durum === "tamam");
  const seciliTest = testler.find((u) => u.id === secili) ?? testler[0] ?? null;
  const kitaplikGorselleri = useMemo(() => uretimler.filter((u) => u.durum === "tamam" && u.tur === "gorsel" && kapakUrl(u)).slice(0, 24), [uretimler]);

  const dosyaAl = useCallback(async (d: File | undefined | null, hedef: "test" | "kapak") => {
    if (!d) return;
    if (!/^image\/(png|jpe?g|webp|avif)$/.test(d.type)) return mesaj.desteklenmeyenDosya("PNG, JPG, WebP ya da AVIF");
    setIsleniyor(true);
    try {
      const k = await gorselKucult(d, hedef === "kapak" ? 640 : 1024);
      if (hedef === "test") { setYukleme(k.url); setTestFoto(k.url); }
      else { setBaslandi(true); setF((x) => ({ ...x, kapak: k.url, kapakVideo: undefined })); toast.success("Kapak güncellendi"); }
    } catch { mesaj.dosyaOkunamadi(); }
    setIsleniyor(false);
  }, []);

  /** Taslak yoksa hemen açar (test üretimleri bir presete bağlanmalı). */
  const kaydiGaranti = () => {
    if (slug && usePresetler.getState().ozel.some((x) => x.slug === slug)) return slug;
    const y = ekle({ ad: f.ad.trim(), kategori: f.kategori, aciklama: f.aciklama.trim(), tarif, yapi: f.yapi, kapak: f.kapak, kapakVideo: f.kapakVideo, kaynak: f.kaynak, durum: "taslak" });
    setSlug(y.slug); setBaslandi(true);
    router.replace(`/panel/presetler/olustur?id=${y.slug}`, { scroll: false });
    return y.slug;
  };

  const testEt = (yuz?: string) => {
    const foto = yuz ?? testFoto;
    if (!eylemTamam) {
      toast.error("Tarif çok kısa", { description: elleMi ? "Tarifi en az 40 karakterle yaz." : `Özneye ne olduğunu en az ${EYLEM_MIN} karakterle anlat.` });
      setAdim(1); setTimeout(() => istemRef.current?.focus(), 250); return;
    }
    const s = kaydiGaranti();
    const gorselUrl = foto.startsWith("/") ? `${window.location.origin}${foto}` : foto;
    const r = uretimBaslat({
      baslik: `${f.ad.trim() || "Taslak preset"} · test`, tur: "video", model: model.ad, prompt: tarif, kredi: bagli === false ? 0 : testKredi, arac: "Preset Stüdyosu", // demo: hiç düşmesin (önce düşüp sonra iade edilmesin)
      meta: { oran: model.oranlar.length ? oran : undefined, sure: model.sure ? `${model.sure} sn` : undefined, cozunurluk: model.coz[kalite], gorselUrl, hamIstem: f.ad.trim() || "Taslak preset", demoKlip: demoKlipSec(`${f.ad} ${elleMi ? f.yapi.elle ?? "" : f.yapi.eylem}`, f.yapi.kamera, f.yapi.atmosfer) },
    });
    if (!r.ok || !r.id) { uretimHataToast(r, "Test başlatılamadı"); return; }
    testEkle(s, r.id); setSecili(r.id); setAdim(2);
    toast.success("Test başladı", { description: bagli === false ? "Kredi düşmez." : `${testKredi} kredi · ${model.ad}.` });
  };

  const kapakYap = (u: Uretim) => {
    const g = kapakUrl(u) ?? u.gorselUrl;
    setBaslandi(true);
    setF((x) => ({ ...x, kapak: g, kapakVideo: u.videoUrl }));
    toast.success("Kapak seçildi");
  };

  const kontroller = [
    { ad: "Ad verildi", tamam: f.ad.trim().length >= 2, adim: 1 as Adim },
    { ad: "Tarif yeterince açık", tamam: eylemTamam, adim: 1 as Adim },
    { ad: "Özne nötr tarif edildi", tamam: !ozneKelime, uyari: true, adim: 1 as Adim },
    { ad: "En az bir test tamamlandı", tamam: tamamTest.length > 0, uyari: true, adim: 2 as Adim },
    { ad: f.kapak || !tamamTest.length ? "Kapak seçildi" : "Kapak: ilk test kullanılacak", tamam: !!f.kapak || tamamTest.length > 0, uyari: true, adim: 3 as Adim },
    ...(f.gorunurluk !== "ozel" ? [{ ad: "Özgünlük onaylandı", tamam: f.ozgun, adim: 3 as Adim }] : []),
  ];
  const zorunluTamam = kontroller.filter((k) => !k.uyari).every((k) => k.tamam);
  const yayinda = kayit?.durum !== "taslak" && !!kayit;

  const yayinla = () => {
    if (!zorunluTamam) {
      toast.error("Preset yayınlanamadı", { description: `Şunları tamamla: ${kontroller.filter((k) => !k.uyari && !k.tamam).map((k) => k.ad).join(", ")}.` });
      setAdim(kontroller.find((k) => !k.uyari && !k.tamam)!.adim); return;
    }
    if (!tamamTest.length && !onayYok) { setOnayYok(true); setAdim(3); return; }
    const s = kaydiGaranti();
    const kapak = f.kapak ?? (tamamTest[0] ? kapakUrl(tamamTest[0]) ?? tamamTest[0].gorselUrl : undefined);
    const aciklama = f.aciklama.trim() || (elleMi ? (f.yapi.elle ?? "") : f.yapi.eylem).trim().slice(0, 140);
    // Satış kaydı sunucuda yok: ek fiyat konmaz.
    const ek = 0;
    guncelle(s, { ad: f.ad.trim(), kategori: f.kategori, aciklama, tarif, yapi: f.yapi, kapak, kapakVideo: f.kapakVideo, kaynak: f.kaynak, durum: "yayinda", gorunurluk: f.gorunurluk, ekKredi: ek, istemGorunur: f.istemGorunur });
    /* Earn > Marketplace: toplulukta ya da bağlantıyla paylaşılan preset satış panelinde görünür. */
    const pay = usePaylasim.getState();
    const onceki = pay.benimPaylasimlar.find((x) => x.tur === "preset" && x.tohum === s);
    if (onceki) pay.paylasimKaldir(onceki.id);
    if (f.gorunurluk !== "ozel") pay.paylas({ tur: "preset", ad: f.ad.trim(), aciklama, tohum: s, kategori: KATEGORI_AD[f.kategori] ?? f.kategori, yazar: tutamac(kullaniciAd), prompt: tarif, model: "Kling 3.0", minFiyat: OZEL_KREDI, ekstraFiyat: ek, kazanc: onceki?.kazanc ?? 0, gorsel: kapak });
    toast.success(yayinda ? "Preset güncellendi" : "Preset yayınlandı", { description: f.gorunurluk === "topluluk" ? "Preset galerinde bu tarayıcıda görünür; başka kullanıcılarla paylaşılmaz." : "Yalnız sen görebilirsin." });
    router.push(`/panel/presetler/${s}`);
  };

  const fikirSec = (i: number) => {
    const fi = FIKIRLER[i];
    setF((x) => ({ ad: fi.ad, kategori: fi.kategori === "VIRAL" ? "SİNEMATİK" : fi.kategori, aciklama: "", yapi: { ...fi.yapi, atmosfer: [...fi.yapi.atmosfer] }, kapak: undefined, gorunurluk: x.gorunurluk, ekKredi: x.ekKredi, istemGorunur: x.istemGorunur, ozgun: x.ozgun }));
    setBaslandi(true); setElleAcik(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`${fi.ad} hazır`, { description: "Tarif dolduruldu; istediğin yerini değiştir, sonra test et." });
  };
  const cogalt = (r: KatalogPreset) => { setF(resmidenForm(r)); setBaslandi(true); setElleAcik(true); window.scrollTo({ top: 0, behavior: "smooth" }); toast.success("Tarif kopyalandı", { description: `${r.ad} tarifini kendine göre değiştir.` }); };

  if (!hazir) return <div className="min-h-[calc(100vh-var(--ust-nav))]" />;

  const adimlar = [
    { n: 1 as Adim, ad: "Hareketi tarif et", kisa: "Tarif", tamam: eylemTamam && f.ad.trim().length >= 2 },
    { n: 2 as Adim, ad: "Farklı yüzlerle test et", kisa: "Test", tamam: tamamTest.length > 0 },
    { n: 3 as Adim, ad: "Kapak ve yayınla", kisa: "Yayınla", tamam: yayinda && !bekleyen },
  ];
  const yuzler = [...TEST_FOTOLARI, ...(yukleme ? [{ ad: "Senin fotoğrafın", url: yukleme }] : [])];
  const kamera = KAMERALAR.find((k) => k.id === f.yapi.kamera) ?? KAMERALAR[0];
  const tempo = TEMPOLAR.find((t) => t.id === f.yapi.tempo) ?? TEMPOLAR[0];
  const atmosferAd = f.yapi.atmosfer.map((a) => ATMOSFERLER.find((x) => x.id === a)?.ad).filter(Boolean).join(", ") || "Seçilmedi";
  const KatI = KAT_IKON[f.kategori] ?? Sparkles;
  const durum = yayinda ? (bekleyen ? "Yayında, kaydedilmemiş değişiklik var" : "Yayında") : kaydedildi ? "Taslak kaydedildi" : icerikVar ? "Taslak" : "Yeni";

  /* ═════════ Üst satır ═════════ */
  const ust = (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-zemin/85 backdrop-blur-2xl sm:top-[var(--ust-nav)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link href="/panel/presetler?sekme=benim" aria-label="Presetlerime dön" title="Presetlerim" className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.11] hover:text-white active:scale-95"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /></Link>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:flex-none">
          <label className="group relative flex h-10 min-w-0 flex-1 items-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.07] transition focus-within:bg-white/[0.08] focus-within:ring-white/25 hover:bg-white/[0.07] lg:w-[280px] lg:flex-none">
            <Pencil className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-white/45 transition-colors group-focus-within:text-white" />
            <input value={f.ad} onChange={(e) => ayarla("ad", e.target.value.slice(0, 32))} placeholder="Efektine ad ver" aria-label="Preset adı"
              className="h-full w-full min-w-0 truncate bg-transparent pl-9 pr-4 text-[14.5px] font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/45" />
          </label>
          <span className="hidden shrink-0 items-center gap-1.5 text-[12px] text-white/50 xl:flex" aria-live="polite">
            <span className={cn("h-1.5 w-1.5 rounded-full", yayinda ? "bg-emerald-400" : kaydedildi ? "bg-white/60" : "bg-white/25")} />{durum}
          </span>
        </div>

        {/* Adım hapı */}
        <LayoutGroup id="st-adim">
          <nav aria-label="Adımlar" className="mx-auto hidden items-center rounded-full bg-white/[0.05] p-1 lg:flex">
            {adimlar.map((a) => {
              const s = adim === a.n;
              return (
                <button key={a.n} onClick={() => setAdim(a.n)} aria-current={s ? "step" : undefined} className="relative flex h-9 items-center gap-2 rounded-full pl-1.5 pr-4 text-[13px] font-medium">
                  {s && <motion.span layoutId="st-adim-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className={cn("relative flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors", a.tamam ? (s ? "bg-black text-white" : "bg-white text-black") : s ? "bg-black/10 text-black" : "bg-white/[0.08] text-white/60")}>
                    {a.tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : a.n}
                  </span>
                  <span className={cn("relative whitespace-nowrap", s ? "text-black" : "text-white/60 hover:text-white")}>{a.ad}</span>
                </button>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="flex shrink-0 items-center gap-1.5">
          {kayit && (
            <div className="relative">
              <button onClick={() => setSilOnay((v) => !v)} aria-label="Preseti sil" title="Preseti sil" className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-[18px] w-[18px]" /></button>
              <Yuzen acik={silOnay} onKapat={() => setSilOnay(false)} yerlesim="alt-sag" bosluk={8} etiket="Preseti sil" className="w-[260px] rounded-[18px] border border-white/[0.09] bg-[#161618] p-3">
                <p className="text-[14px] font-semibold text-white">Preset silinsin mi?</p>
                <p className="mt-1 text-[12.5px] text-white/55">Testlerin kitaplığında kalır; preset galeriden kalkar.</p>
                <div className="mt-3 flex justify-end gap-1.5">
                  <button onClick={() => setSilOnay(false)} className="h-9 rounded-full px-3.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
                  <button onClick={() => { sil(kayit.slug); toast.success("Preset silindi"); router.push("/panel/presetler?sekme=benim"); }} className="h-9 rounded-full bg-rose-500/90 px-3.5 text-[13px] font-semibold text-white hover:bg-rose-500">Sil</button>
                </div>
              </Yuzen>
            </div>
          )}
          {adim !== 3 && (
            <button onClick={() => setAdim(3)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-semibold text-white ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] active:scale-[0.97]">
              <Rocket className="h-4 w-4" /><span className="max-sm:hidden">{yayinda ? "Yayın ayarları" : "Yayına geç"}</span>
            </button>
          )}
        </div>
      </div>
      {/* Mobil adımlar */}
      <div className="px-3 pb-2.5 lg:hidden">
        <Segment id="st-adim-m" kucuk deger={String(adim) as "1" | "2" | "3"} set={(v) => setAdim(Number(v) as Adim)}
          secenek={adimlar.map((a) => ({ id: String(a.n) as "1" | "2" | "3", ad: <>{a.tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="tabular-nums">{a.n}</span>}{a.kisa}</> }))} />
      </div>
    </div>
  );

  /* ═════════ Adım 1: tarif ═════════ */
  const popKaro = (id: Pop, icerik: React.ReactNode, genislik = 520) => (
    <Yuzen acik={pop === id} onKapat={() => setPop(null)} yerlesim="alt-sol" bosluk={8} etiket={String(id)}
      className="rounded-[22px] border border-white/[0.09] bg-[#161618] p-3" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
      {icerik}
    </Yuzen>
  );
  const adim1 = (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className={cn("flex flex-col overflow-hidden rounded-[28px] bg-[#111214] ring-1 ring-inset transition-colors", ozneKelime ? "ring-amber-400/30" : "ring-white/[0.08] focus-within:ring-white/20")}>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[26px]">Kendi efektini <span className="hero-isilti">sen yap</span></h1>
              <p className="mt-1 text-[13.5px] text-white/55">Kişiye ne olacağını yaz, kamerayı ve atmosferi seç. Her fotoğrafa tek tıkla uygulanır.</p>
            </div>
          </header>
          <div className="flex flex-1 flex-col p-2">
          <div className="flex-1 px-4 pb-1 pt-3.5 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-colors", eylemTamam ? "bg-white text-black" : "bg-white/[0.08] text-white/60")}>{eylemTamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Wand2 className="h-3.5 w-3.5" />}</span>
                {elleMi ? "Modele giden tarif" : "Özneye ne oluyor?"}
              </p>
              <span className={cn("text-[12px] tabular-nums", (elleMi ? f.yapi.elle ?? "" : f.yapi.eylem).length && !eylemTamam ? "text-amber-300" : "text-white/35")}>
                {elleMi ? `${(f.yapi.elle ?? "").length}/900` : `${f.yapi.eylem.length}/400`}
              </span>
            </div>
            {elleMi ? (
              <textarea ref={istemRef} value={f.yapi.elle} onChange={(e) => yapiAyarla({ elle: e.target.value.slice(0, 900) })} rows={6} aria-label="Tarif"
                className="mt-2 block w-full resize-none bg-transparent text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35" />
            ) : (
              <textarea ref={istemRef} value={f.yapi.eylem} onChange={(e) => yapiAyarla({ eylem: e.target.value.slice(0, 400) })} rows={3} aria-label="Özneye ne oluyor"
                placeholder="ör. Özne yağmurlu neon bir sokakta kameraya doğru yürür, durur ve gözlüğünü indirip gülümser"
                className="mt-2 block w-full resize-none bg-transparent text-[17px] leading-relaxed text-white outline-none placeholder:text-white/40 sm:text-[19px]" />
            )}
            <AnimatePresence>
              {ozneKelime && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <span className="mt-2 flex gap-2 rounded-[14px] bg-amber-400/[0.08] p-3 text-[13px] leading-relaxed text-amber-100/90">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>&ldquo;{ozneKelime}&rdquo; kişiyi tarif ediyor. Efekt her fotoğrafa uymalı: kim olduğunu değil, <b className="font-semibold">ne yaptığını</b> anlat.</span>
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {!elleMi && (
            <div className="mt-auto px-4 pb-2 pt-3 sm:px-5">
              <p className="text-[12px] font-medium text-white/45">Örnek eylemler</p>
              <div className="gizli-scroll -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {ORNEK_EYLEMLER.map((e) => (
                  <button key={e} onClick={() => { yapiAyarla({ eylem: e }); setTimeout(() => istemRef.current?.focus(), 0); }} aria-pressed={f.yapi.eylem === e}
                    className={cn("h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition active:scale-[0.97]", f.yapi.eylem === e ? "bg-white text-black" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09] hover:text-white")}>{e}</button>
                ))}
              </div>
            </div>
          )}

          {/* Görselli çipler */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-2 pt-2">
            <div className="relative">
              <Cip etiket="Kamera" deger={kamera.ad} gorsel={(KAMERA_MEDYA[kamera.id] ?? KAMERA_MEDYA.sabit).gorsel} acik={pop === "kamera"} devre={elleMi} onClick={() => setPop(pop === "kamera" ? null : "kamera")} />
              {popKaro("kamera", (
                <>
                  <p className="mb-2.5 px-0.5 text-[13.5px] font-semibold text-white">Kamera hareketi</p>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Kamera">
                    {KAMERALAR.map((k) => <VideoKaro key={k.id} ad={k.ad} alt={k.ipucu} {...(KAMERA_MEDYA[k.id] ?? KAMERA_MEDYA.sabit)} secili={f.yapi.kamera === k.id} onSec={() => { yapiAyarla({ kamera: k.id }); setPop(null); }} />)}
                  </div>
                </>
              ))}
            </div>
            <div className="relative">
              <Cip etiket="Atmosfer" deger={atmosferAd} gorsel={ATMOSFER_GORSEL[f.yapi.atmosfer[0]] ?? ATMOSFER_GORSEL.sinematik} acik={pop === "atmosfer"} devre={elleMi} onClick={() => setPop(pop === "atmosfer" ? null : "atmosfer")} />
              {popKaro("atmosfer", (
                <>
                  <p className="mb-2.5 flex items-baseline justify-between px-0.5 text-[13.5px] font-semibold text-white">Atmosfer<span className="text-[12px] font-normal text-white/45">{f.yapi.atmosfer.length}/3 seçili</span></p>
                  <div className="grid grid-cols-4 gap-2">
                    {ATMOSFERLER.map((a) => {
                      const s = f.yapi.atmosfer.includes(a.id);
                      return <VideoKaro key={a.id} rol="checkbox" oran="1/1" ad={a.ad} gorsel={ATMOSFER_GORSEL[a.id] ?? ATMOSFER_GORSEL.sinematik} secili={s}
                        onSec={() => yapiAyarla({ atmosfer: s ? f.yapi.atmosfer.filter((x) => x !== a.id) : [...f.yapi.atmosfer, a.id].slice(-3) })} />;
                    })}
                  </div>
                </>
              ))}
            </div>
            <div className="relative">
              <Cip etiket="Tempo" deger={tempo.ad} gorsel={(TEMPO_MEDYA[tempo.id] ?? TEMPO_MEDYA.dogal).gorsel} acik={pop === "tempo"} devre={elleMi} onClick={() => setPop(pop === "tempo" ? null : "tempo")} />
              {popKaro("tempo", (
                <>
                  <p className="mb-2.5 px-0.5 text-[13.5px] font-semibold text-white">Tempo</p>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tempo">
                    {TEMPOLAR.map((t) => <VideoKaro key={t.id} ad={t.ad} {...(TEMPO_MEDYA[t.id] ?? TEMPO_MEDYA.dogal)} secili={f.yapi.tempo === t.id} onSec={() => { yapiAyarla({ tempo: t.id }); setPop(null); }} />)}
                  </div>
                </>
              ), 420)}
            </div>
            <label className={cn("flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-white/[0.07] pl-1.5 pr-2 transition hover:bg-white/[0.11]", elleMi && "pointer-events-none opacity-35")}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/80"><ShieldCheck className="h-4 w-4" /></span>
              <span className="flex flex-col leading-none"><span className="text-[11px] text-white/55">Yüz</span><span className="mt-1 text-[13px] font-medium text-white">{f.yapi.kimlik ? "Korunsun" : "Serbest"}</span></span>
              <Anahtar acik={f.yapi.kimlik} etiket="Kimliği koru" onDegis={() => yapiAyarla({ kimlik: !f.yapi.kimlik })} />
            </label>
          </div>
          </div>
          <footer className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3.5 sm:px-6">
            <p className="min-w-0 flex-1 text-[13px] text-white/55">{eylemTamam ? "Tarif hazır. Şimdi farklı yüzlerde dene." : "Kişiye ne olacağını birkaç kelimeyle yaz ya da aşağıdan bir fikir seç."}</p>
            <button onClick={() => setAdim(2)} className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition active:scale-[0.97]", eylemTamam ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white")}>
              Teste geç<ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        </div>

        {/* Canlı tarif: seçilen kameranın örneği + modele giden tarif */}
        <aside className="overflow-hidden rounded-[28px] bg-[#111214] ring-1 ring-inset ring-white/[0.08] lg:sticky lg:top-[calc(var(--ust-nav)+88px)] lg:self-start">
          <header className="flex h-[60px] items-center gap-3 border-b border-white/[0.06] px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><Wand2 className="h-[18px] w-[18px]" /></span>
            <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.01em] text-white">Canlı tarif</h2>
            <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] font-medium tabular-nums text-white/70">8 sn</span>
          </header>
          <div className="relative aspect-[16/10] overflow-hidden bg-black">
            <AnimatePresence initial={false}>
              <motion.video key={kamera.id} src={(KAMERA_MEDYA[kamera.id] ?? KAMERA_MEDYA.sabit).video} poster={(KAMERA_MEDYA[kamera.id] ?? KAMERA_MEDYA.sabit).gorsel} autoPlay muted loop playsInline
                initial={{ clipPath: "inset(0 100% 0 0)", zIndex: 2 }} animate={{ clipPath: "inset(0 0% 0 0)", zIndex: 2, transition: { duration: 0.6, ease } }} exit={{ zIndex: 1, transition: { duration: 0.6 } }}
                className="absolute inset-0 h-full w-full object-cover" />
            </AnimatePresence>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute left-3 top-3 z-[3] rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">Kamera örneği</span>
            <span className="absolute inset-x-3 bottom-3 z-[3] flex flex-wrap gap-1.5">
              {[kamera.ad, tempo.ad, ...f.yapi.atmosfer.map((a) => ATMOSFERLER.find((x) => x.id === a)?.ad ?? "")].filter(Boolean).map((t) => (
                <motion.span key={t} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{t}</motion.span>
              ))}
            </span>
          </div>
          <div className="p-5">
            <p className="flex items-center justify-between text-[12.5px] font-medium text-white/55">{elleMi ? "Tarifi elle düzenliyorsun" : "Modele giden tarif"}<span className="tabular-nums text-white/35">{tarif.length}</span></p>
            <p lang="en" className={cn("mt-2 max-h-[180px] overflow-y-auto text-[13px] leading-relaxed [scrollbar-width:thin]", tarif ? "text-white/80" : "text-white/40")}>{tarif || "Özneye ne olduğunu yazınca kamera, atmosfer ve tempo seçimlerinle birlikte burada derlenir."}</p>
          </div>
          <footer className="flex items-center gap-1.5 border-t border-white/[0.06] p-3">
            <button onClick={() => void kopyala(tarif, "Tarif kopyalandı")} disabled={!tarif} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-40"><Copy className="h-3.5 w-3.5" />Kopyala</button>
            {elleMi ? (
              <button onClick={() => { yapiAyarla({ elle: "" }); setElleAcik(false); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white">Seçimlere dön</button>
            ) : (
              <button onClick={() => { if (!tarif) return; yapiAyarla({ elle: tarif }); setElleAcik(true); setTimeout(() => istemRef.current?.focus(), 60); }} disabled={!tarif} title="Kamera, atmosfer ve tempo seçimleri devre dışı kalır"
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-40"><Pencil className="h-3.5 w-3.5" />Elle düzenle</button>
            )}
          </footer>
        </aside>
      </section>

      {/* Hazır fikirler */}
      <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
        <header className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Bir fikirden başla</h2>
          <p className="mt-0.5 text-[13px] text-white/50">Tarif hazır gelir; adını ve ayrıntıları değiştirirsin.</p>
        </header>
        <div className="grid grid-cols-2 gap-3 p-4 sm:p-5 lg:grid-cols-4 lg:grid-rows-2">
          {FIKIRLER.slice(0, 5).map((fi, i) => {
            const sec = f.ad === fi.ad;
            const buyuk = i === 0;
            const kam = KAMERALAR.find((k) => k.id === fi.yapi.kamera)?.ad;
            const tem = TEMPOLAR.find((k) => k.id === fi.yapi.tempo)?.ad;
            return (
              <motion.button key={fi.ad} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.45, ease }}
                onClick={() => fikirSec(i)} aria-pressed={sec}
                className={cn("group relative overflow-hidden rounded-[20px] text-left outline outline-2 -outline-offset-2 transition", sec ? "outline-white" : "outline-transparent",
                  buyuk ? "col-span-2 aspect-[16/11] lg:row-span-2 lg:aspect-auto" : "aspect-[4/5] lg:aspect-auto lg:min-h-[230px]")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fi.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <span className="absolute left-3 top-3 flex gap-1">
                  <span className="rounded-full bg-black/40 px-2 py-[3px] text-[11px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-md">{KATEGORI_AD[fi.kategori] ?? fi.kategori}</span>
                </span>
                {sec && <motion.span layoutId="fikir-sec" transition={yay} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black"><Check className="h-4 w-4" strokeWidth={3} /></motion.span>}
                <span className="absolute inset-x-0 bottom-0 p-3.5 transition-transform duration-300 group-hover:-translate-y-11 [@media(hover:none)]:group-hover:translate-y-0 sm:p-4">
                  <span className={cn("block font-semibold leading-tight tracking-[-0.02em] text-white", buyuk ? "text-[22px] sm:text-[28px]" : "text-[15.5px]")}>{fi.ad}</span>
                  <span className={cn("mt-1 line-clamp-2 leading-snug text-white/70", buyuk ? "text-[14px]" : "text-[12.5px]")}>{fi.ozet}</span>
                  {buyuk && <span className="mt-3 flex flex-wrap gap-1.5 text-[11.5px] text-white/80">{kam && <span className="rounded-full bg-white/[0.12] px-2.5 py-1 backdrop-blur-md">{kam}</span>}{tem && <span className="rounded-full bg-white/[0.12] px-2.5 py-1 backdrop-blur-md">{tem}</span>}</span>}
                </span>
                <span className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-[13px] font-semibold text-black opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden sm:inset-x-4 sm:bottom-4">
                  {sec ? <><Check className="h-3.5 w-3.5" strokeWidth={3} />Seçili</> : <>Bu fikirle başla<ArrowRight className="h-3.5 w-3.5" /></>}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <Cogalt onSec={cogalt} kaynak={f.kaynak} />
    </div>
  );

  /* ═════════ Adım 2: test ═════════ */
  // Her şey bir kartın içinde: başlık şeridi + içerik + alt şerit. Havada duran yazı ya da düğme yok.
  const adim2 = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <div className="space-y-5">
        {/* Test yüzü kartı */}
        <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Test yüzü</h2>
              <p className="mt-0.5 text-[13px] text-white/50">Aynı tarifi farklı yüzlerde dene; en az iki yüz öneririz.</p>
            </div>
            <LayoutGroup id="st-yuz-kaynak">
              <div className="flex shrink-0 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.07]">
                {([["ornek", "Örnek yüzler"], ["kitaplik", "Kitaplığın"]] as const).map(([id, ad]) => (
                  <button key={id} onClick={() => setYuzKaynak(id)} className="relative h-8 rounded-full px-3.5 text-[12.5px] font-medium">
                    {yuzKaynak === id && <motion.span layoutId="st-yuz-kaynak-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                    <span className={cn("relative", yuzKaynak === id ? "text-black" : "text-white/60 hover:text-white")}>{ad}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </header>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={yuzKaynak} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="p-4 sm:p-5">
              {yuzKaynak === "ornek" ? (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                  {yuzler.map((t) => {
                    const s = testFoto === t.url;
                    return (
                      <button key={t.url} onClick={() => setTestFoto(t.url)} aria-pressed={s} className="group text-left">
                        <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[16px] outline outline-2 -outline-offset-2 transition", s ? "outline-white" : "outline-transparent")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.url} alt={t.ad} className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-105", !s && "opacity-75 group-hover:opacity-100")} />
                          {s && <motion.span layoutId="st-yuz-tik" transition={yay} className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3.2} /></motion.span>}
                        </span>
                        <span className={cn("mt-1.5 block truncate text-[12px]", s ? "font-medium text-white" : "text-white/50")}>{t.ad}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => dosyaRef.current?.click()} aria-label="Kendi fotoğrafını yükle" className="group text-left">
                    <span className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[16px] bg-white/[0.04] text-white/60 ring-1 ring-inset ring-white/[0.08] transition group-hover:bg-white/[0.08] group-hover:text-white">
                      {isleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    </span>
                    <span className="mt-1.5 block text-[12px] text-white/50">Yükle</span>
                  </button>
                </div>
              ) : kitaplikGorselleri.length ? (
                <div className="grid max-h-[300px] grid-cols-4 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:grid-cols-6">
                  {kitaplikGorselleri.map((u) => {
                    const url = kapakUrl(u)!;
                    const s = testFoto === url;
                    return (
                      <button key={u.id} onClick={() => { setYukleme(url); setTestFoto(url); }} aria-pressed={s} title={u.baslik}
                        className={cn("relative aspect-square overflow-hidden rounded-[12px] outline outline-2 -outline-offset-2 transition", s ? "outline-white" : "outline-transparent hover:opacity-85")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        {s && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Check className="h-3 w-3" strokeWidth={3.2} /></span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60"><Images className="h-4 w-4" /></span>
                  <p className="min-w-0 flex-1 text-[13px] text-white/55">Kitaplığında henüz görsel yok. Örnek yüzlerle dene ya da kendi fotoğrafını yükle.</p>
                  <button onClick={() => dosyaRef.current?.click()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Upload className="h-3.5 w-3.5" />Yükle</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Testlerin kartı */}
        <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
          <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Testlerin</h2>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium tabular-nums text-white/70">{tamamTest.length}/{testler.length} tamam</span>
          </header>
          <div className="p-4 sm:p-5">
            {testler.length ? (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {testler.map((u) => <TestKarti key={u.id} u={u} secili={seciliTest?.id === u.id} kapak={!!f.kapak && f.kapak === (kapakUrl(u) ?? u.gorselUrl)} onSec={() => setSecili(u.id)} onKapak={() => kapakYap(u)} />)}
                {(() => {
                  /* Satırı denenmemiş yüzlerle doldur: her karo tek tıkla o yüzle test eder. */
                  const kullanilan = testler.map((u) => u.meta?.gorselUrl ?? "");
                  const kalan = yuzler.filter((y) => !kullanilan.some((k) => k.endsWith(y.url)));
                  const n = testler.length % 4 === 0 ? 1 : 4 - (testler.length % 4);
                  return (kalan.length ? kalan : yuzler).slice(0, n).map((y, j) => (
                    <motion.button key={y.url} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.05 }} onClick={() => { setTestFoto(y.url); testEt(y.url); }}
                      className="group relative flex aspect-[9/16] flex-col items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-2 text-center ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/25 active:scale-[0.98]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={y.url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20 transition-transform group-hover:scale-105" />
                      <span className="text-[12.5px] font-semibold leading-tight text-white">{y.ad} ile dene</span>
                      <span className="text-[11px] leading-tight text-white/50">{j === 0 ? "Tutarlılığı gör" : "Tek tıkla test"}</span>
                    </motion.button>
                  ));
                })()}
              </div>
            ) : (
              <ol className="grid gap-2 sm:grid-cols-3">
                {[["Yüz seç", "Yukarıdan bir yüz"], ["Test et", "Alttaki kutudan"], ["Karşılaştır", "Tutarlı mı bak"]].map(([a, b], i) => (
                  <li key={a} className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[13px] font-semibold text-white">{i + 1}</span>
                    <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{a}</span><span className="block text-[12px] text-white/45">{b}</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      {/* Sonuç kartı: başlık şeridi, sahne, durum + sonraki adım şeridi */}
      <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08] lg:sticky lg:top-[calc(var(--ust-nav)+88px)] lg:self-start">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Sonuç</h2>
          <span className="flex items-center gap-2 text-[12.5px] text-white/55">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seciliTest?.meta?.gorselUrl ?? testFoto} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
            {seciliTest ? "Bu yüzle üretildi" : "Seçili yüz"}
          </span>
        </header>
        <div className="bg-black/30 p-4 sm:p-6"><TestSahnesi u={seciliTest} foto={testFoto} oran={model.oranlar.length ? oran : "9:16"} /></div>
        <footer className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-4">
          <p className="min-w-0 flex-1 text-[13px] text-white/55">
            {!seciliTest ? "Test et'e basınca sonuç burada oynar." : tamamTest.length >= 2 ? "Testlerin hazır; kapak seçip yayınlayabilirsin." : "Bir yüzle daha dene, tutarlılığı gör."}
          </p>
          <button onClick={() => setAdim(3)} className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition active:scale-[0.97]", tamamTest.length ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white")}>
            Kapak ve yayın<ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </section>
    </div>
  );

  /* ═════════ Adım 3: kapak ve yayınla ═════════ */
  const adim3 = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
          <header className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Kapak</h2>
            <p className="mt-0.5 text-[13px] text-white/50">Galeride efektini bu kapakla görecekler.</p>
          </header>
          <div className="p-4 sm:p-5">
          {tamamTest.length ? (
            <div className="grid grid-cols-3 gap-2.5">
              {tamamTest.map((u) => {
                const g = kapakUrl(u) ?? u.gorselUrl;
                const s = !!f.kapak && f.kapak === g;
                return (
                  <button key={u.id} onClick={() => kapakYap(u)} aria-pressed={s} className="group relative aspect-[9/16] overflow-hidden rounded-[14px] bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {g && <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <span className={cn("absolute inset-0 rounded-[14px] outline outline-2 -outline-offset-2 transition", s ? "outline-white" : "outline-transparent")} />
                    <span className={cn("absolute inset-x-2 bottom-2 flex h-7 items-center justify-center gap-1 rounded-full text-[12px] font-semibold transition", s ? "bg-white text-black" : "bg-black/45 text-white opacity-0 backdrop-blur-md group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>
                      {s ? <><Check className="h-3.5 w-3.5" strokeWidth={3} />Kapak</> : "Kapak yap"}
                    </span>
                  </button>
                );
              })}
              <button onClick={() => kapakRef.current?.click()} className="group flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-2 text-center ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/25 active:scale-[0.98]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition group-hover:bg-white group-hover:text-black"><ImagePlus className="h-4 w-4" /></span>
                <span className="text-[12.5px] font-semibold leading-tight text-white">Kendi görselin</span>
                <span className="text-[11px] leading-tight text-white/50">Görsel ya da kare</span>
              </button>
              {tamamTest.length < 2 && (
                <button onClick={() => setAdim(2)} className="group flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-2 text-center ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/25 active:scale-[0.98]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition group-hover:bg-white group-hover:text-black"><FlaskConical className="h-4 w-4" /></span>
                  <span className="text-[12.5px] font-semibold leading-tight text-white">Bir test daha</span>
                  <span className="text-[11px] leading-tight text-white/50">Daha çok kapak seçeneği</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60"><FlaskConical className="h-4 w-4" /></span>
              <p className="min-w-0 flex-1 text-[13px] text-white/55">Kapağı bir test sonucundan seç ya da kendi görselini yükle.</p>
              <button onClick={() => kapakRef.current?.click()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/85 hover:bg-white/[0.12]"><ImagePlus className="h-3.5 w-3.5" />Yükle</button>
              <button onClick={() => setAdim(2)} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">Teste git<ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {f.kapak && !tamamTest.some((u) => (kapakUrl(u) ?? u.gorselUrl) === f.kapak) && (
            <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.07]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.kapak} alt="" className="h-12 w-9 rounded-[8px] object-cover" />
              <p className="min-w-0 flex-1 text-[13px] text-white/70"><Check className="mr-1 inline h-3.5 w-3.5 text-white" />Yüklediğin görsel kapak olarak seçili.</p>
              <button onClick={() => { setBaslandi(true); setF((x) => ({ ...x, kapak: undefined, kapakVideo: undefined })); }} className="h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium text-white/65 hover:bg-white/[0.06] hover:text-rose-300">Kaldır</button>
            </div>
          )}
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
          <header className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Kart bilgileri</h2>
            <p className="mt-0.5 text-[13px] text-white/50">Galeride kartın altında ve aramada görünür.</p>
          </header>
          <div className="p-4 sm:p-5">
          <label className="block">
            <span className="mb-2 flex items-baseline justify-between text-[13.5px] font-semibold text-white">Kart açıklaması<span className="text-[12px] font-normal tabular-nums text-white/40">{f.aciklama.length}/140</span></span>
            <input value={f.aciklama} onChange={(e) => ayarla("aciklama", e.target.value.slice(0, 140))} placeholder="Boş kalırsa tariften alınır" aria-label="Kart açıklaması"
              className="h-12 w-full rounded-[16px] bg-white/[0.05] px-4 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:bg-white/[0.08]" />
          </label>
          <p className="mb-2 mt-6 text-[13.5px] font-semibold text-white">Kategori</p>
          <div className="flex flex-wrap gap-1.5">
            {KATEGORI_SIRA.filter((k) => k !== "VIRAL").map((k) => {
              const I = KAT_IKON[k] ?? Sparkles, s = f.kategori === k;
              return (
                <button key={k} onClick={() => ayarla("kategori", k)} aria-pressed={s} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition active:scale-[0.97]", s ? "bg-white text-black" : "bg-white/[0.05] text-white/65 hover:bg-white/[0.09] hover:text-white")}>
                  <I className="h-3.5 w-3.5" />{KATEGORI_AD[k]}
                </button>
              );
            })}
          </div>
          </div>
        </section>
        </div>

        <PaylasimBolumu f={f} ayarla={ayarla} />
      </div>

      <aside className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08] lg:sticky lg:top-[calc(var(--ust-nav)+88px)] lg:self-start">
        <header className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Galeride böyle görünecek</h2>
        </header>
        <div className="bg-black/30 px-5 py-6"><div className="mx-auto w-[220px]"><YayinKarti ad={f.ad.trim()} kapak={f.kapak ?? (tamamTest[0] ? kapakUrl(tamamTest[0]) ?? tamamTest[0].gorselUrl : undefined)} kapakVideo={f.kapak ? f.kapakVideo : tamamTest[0]?.videoUrl} kredi={OZEL_KREDI + (f.kaynak || f.gorunurluk === "ozel" ? 0 : f.ekKredi)} /></div></div>

        <div className="border-t border-white/[0.06] px-3 py-3">
        <p className="px-2 pb-1.5 text-[12.5px] font-medium text-white/50">Yayın öncesi</p>
        <ul className="space-y-0.5">
          {kontroller.map((k) => (
            <li key={k.ad}>
              <button onClick={() => setAdim(k.adim)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13px] transition hover:bg-white/[0.04]">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", k.tamam ? "bg-white text-black" : k.uyari ? "bg-white/[0.08] text-white/40" : "bg-amber-400/20 text-amber-300")}>
                  {k.tamam ? <Check className="h-3 w-3" strokeWidth={3.2} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className={cn("flex-1", k.tamam ? "text-white/80" : "text-white/55")}>{k.ad}</span>
                {!k.tamam && <span className="text-[11.5px] text-white/35">{k.uyari ? "önerilir" : "gerekli"}</span>}
              </button>
            </li>
          ))}
        </ul>
        </div>
        <footer className="border-t border-white/[0.06] p-4">
        <AnimatePresence>
          {onayYok && !tamamTest.length && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 rounded-[14px] bg-amber-400/[0.08] p-3 text-[12.5px] leading-snug text-amber-100/90">
              Hiç test etmeden yayınlıyorsun; sonuç beklediğinden farklı olabilir. Yine de yayınlamak için tekrar bas.
            </motion.p>
          )}
        </AnimatePresence>
        <button onClick={yayinla} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition active:scale-[0.98]", zorunluTamam ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.07] text-white/45")}>
          <Rocket className="h-4 w-4" />{yayinda ? "Değişiklikleri yayınla" : onayYok && !tamamTest.length ? "Yine de yayınla" : "Yayınla"}
        </button>
        </footer>
      </aside>
    </div>
  );

  /* ═════════ Yüzen komut kutusu (yalnız test adımında; yüz seçimi Test yüzü kartında) ═════════ */
  const PANO = "rounded-[20px] border border-white/[0.09] bg-[#18181b] p-1.5";
  const komut = (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 px-3 sm:bottom-5">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5, ease }}
        className="cam-istemci pointer-events-auto mx-auto flex max-w-[860px] items-center gap-2 rounded-[26px] p-2.5 max-sm:flex-wrap">
        <div className="gizli-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto max-sm:basis-full">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/15" title="Seçili test yüzü">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={testFoto} alt="Test yüzü" className="h-full w-full object-cover" />
          </span>
          <div className="relative">
            <Cip etiket="Model" deger={model.ad} ikon={<span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={model.ad} boyut={36} /></span>} acik={pop === "model"} onClick={() => setPop(pop === "model" ? null : "model")} />
            <Yuzen acik={pop === "model"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Model" className={PANO} style={{ width: "min(420px, calc(100vw - 24px))" }}>
              <p className="px-2.5 pb-1.5 pt-1 text-[13px] font-semibold text-white">Test modeli</p>
              {PRESET_MODELLER.map((m) => {
                const sc = m.ad === model.ad;
                return (
                  <button key={m.ad} onClick={() => { setModelAd(m.ad); setPop(null); }} className={cn("flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition-colors hover:bg-white/[0.05]", sc && "bg-white/[0.07]")}>
                    <MarkaKare ad={m.ad} boyut={38} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-white">{m.ad}{m.rozet && <span className="rounded-full bg-white/[0.1] px-1.5 py-px text-[10.5px] font-semibold text-white/80">{m.rozet}</span>}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-white/55">{m.aciklama}</span>
                    </span>
                    <KrediParlak n={presetBedel(TEST_TABAN, m.ad, kalite)} />
                    <span className="flex w-4 justify-center">{sc && <Check className="h-4 w-4 text-white" />}</span>
                  </button>
                );
              })}
              {sag && PRESET_MODELLER.some((m) => !sag[m.saglayici]) && <p className="mt-1 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12px] leading-snug text-white/50">Sağlayıcısı bağlı olmayan modellerde örnek video üretilir, kredi düşmez.</p>}
            </Yuzen>
          </div>
          <div className="relative">
            <Cip etiket="Kalite" deger={`${kalite === "taslak" ? "Taslak" : "HD"} · ${model.coz[kalite]}`} ikon={kalite === "taslak" ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} acik={pop === "kalite"} onClick={() => setPop(pop === "kalite" ? null : "kalite")} />
            <Yuzen acik={pop === "kalite"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Kalite" className={PANO} style={{ width: 300 }}>
              {(["taslak", "hd"] as Kalite[]).map((k) => (
                <button key={k} onClick={() => { setKalite(k); setPop(null); }} className={cn("flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.05]", kalite === k && "bg-white/[0.07]")}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.07] text-white">{k === "taslak" ? <Gauge className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14px] font-semibold text-white">{k === "taslak" ? "Taslak" : "HD"} · {model.coz[k]}</span><span className="mt-0.5 block text-[12px] text-white/55">{k === "taslak" ? "Hızlı dene, yüzde 40 daha ucuz" : "Kapak için en net sonuç"}</span></span>
                  <KrediParlak n={presetBedel(TEST_TABAN, model.ad, k)} />
                  <span className="flex w-4 justify-center">{kalite === k && <Check className="h-4 w-4 text-white" />}</span>
                </button>
              ))}
            </Yuzen>
          </div>
          {model.oranlar.length > 0 && (
            <div className="relative">
              <Cip etiket="Oran" deger={oran} ikon={<OranIkon oran={oran} />} acik={pop === "oran"} onClick={() => setPop(pop === "oran" ? null : "oran")} />
              <Yuzen acik={pop === "oran"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Oran" className={PANO} style={{ width: 250 }}>
                {model.oranlar.map((ro) => (
                  <button key={ro} onClick={() => { setOran(ro); setPop(null); }} className={cn("flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.05]", oran === ro && "bg-white/[0.07]")}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.07]"><OranIkon oran={ro} /></span>
                    <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14px] font-semibold text-white">{ro}</span><span className="mt-0.5 block text-[12px] text-white/55">{ORAN_NOT[ro]}</span></span>
                    <span className="flex w-4 justify-center">{oran === ro && <Check className="h-4 w-4 text-white" />}</span>
                  </button>
                ))}
              </Yuzen>
            </div>
          )}
        </div>
        <button onClick={() => testEt()} title={!eylemTamam ? "Önce tarifi tamamla" : undefined}
          className={cn("flex h-12 shrink-0 items-center gap-2 rounded-[14px] pl-4 pr-1.5 text-[14.5px] font-semibold transition active:scale-[0.97] max-sm:w-full max-sm:justify-center", eylemTamam ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.08] text-white/55")}>
          <FlaskConical className="h-4 w-4" />Test et
          <span className={cn("flex h-8 items-center rounded-full px-2.5 text-[12px] font-semibold", eylemTamam ? "bg-black/[0.07]" : "bg-white/[0.06]")}>{bagli === false ? "Ücretsiz" : <KrediParlak n={testKredi} koyu={eylemTamam} />}</span>
        </button>
      </motion.div>
      {girisli && krediler < testKredi && bagli !== false && (
        <p className="pointer-events-auto mx-auto mt-1.5 w-fit rounded-full bg-black/60 px-3 py-1 text-center text-[12px] text-white/80 backdrop-blur"><Link href="/panel/kredi?sekme=kredi" className="hover:underline">Kredin yetersiz: {testKredi} gerekli. Kredi yükle</Link></p>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin">
      {ust}
      <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(e) => { void dosyaAl(e.target.files?.[0], "test"); e.target.value = ""; }} />
      <input ref={kapakRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(e) => { void dosyaAl(e.target.files?.[0], "kapak"); e.target.value = ""; }} />
      <main className={cn("mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 sm:pt-8", adim === 2 ? "pb-48" : "pb-28 sm:pb-16")}>
        <AnimatePresence mode="wait">
          <motion.div key={adim} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease }}>
            {adim === 1 ? adim1 : adim === 2 ? adim2 : adim3}
          </motion.div>
        </AnimatePresence>
      </main>
      {adim === 2 && komut}
    </div>
  );
}

/* ═════════ Parçalar ═════════ */

function OranIkon({ oran }: { oran: string }) {
  const [w, h] = oran === "16:9" ? [16, 9] : oran === "1:1" ? [1, 1] : [9, 16];
  const k = 16 / Math.max(w, h), gw = w * k, gh = h * k;
  return (
    <svg width={gw + 2} height={gh + 2} viewBox={`0 0 ${gw + 2} ${gh + 2}`} fill="none" aria-hidden className="shrink-0 text-white">
      <rect x={1} y={1} width={gw} height={gh} rx={3} stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

/** Seçili testin büyük sahnesi; test yoksa test yüzü ve ne olacağını gösteren sakin bir kart. */
function TestSahnesi({ u, foto, oran }: { u: Uretim | null; foto: string; oran: string }) {
  const calisiyor = !!u && (u.durum === "kuyrukta" || u.durum === "isleniyor");
  const g = u ? kapakUrl(u) ?? u.gorselUrl : null;
  const genislik = oran === "16:9" ? "w-full" : oran === "1:1" ? "w-[min(100%,380px)]" : "w-[min(100%,260px)]";
  return (
    <div className="relative mx-auto flex flex-col items-center">
      <div className={cn("relative overflow-hidden rounded-[28px] bg-black ring-1 ring-white/[0.1]", genislik)} style={{ aspectRatio: (u?.meta?.oran ?? oran).replace(":", " / ") }}>
        {u?.videoUrl ? <video key={u.videoUrl} src={u.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          : g ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={g} alt="" className={cn("absolute inset-0 h-full w-full object-cover", calisiyor && "opacity-40 blur-[2px]")} />)
          : (/* eslint-disable-next-line @next/next/no-img-element */ <img src={foto} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />)}
        {!u && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.14] text-white ring-1 ring-white/20 backdrop-blur-md"><Play className="h-4 w-4 translate-x-px fill-current" /></span>
          </span>
        )}
        {calisiyor && u && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
            <span className="text-[13px] font-medium text-white/90">Üretiliyor · yüzde {u.ilerleme}</span>
            <span className="h-1 w-36 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${u.ilerleme}%` }} /></span>
          </span>
        )}
        {u?.durum === "hata" && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[13.5px] text-rose-300">Başarısız · kredi iade edildi</span>}
        
        {u?.meta?.gorselUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.meta.gorselUrl} alt="Test girdisi" className="absolute bottom-3 right-3 h-[72px] w-[54px] rounded-[12px] object-cover ring-2 ring-white/70" />
        )}
      </div>
    </div>
  );
}

function TestKarti({ u, secili, kapak, onSec, onKapak }: { u: Uretim; secili: boolean; kapak: boolean; onSec: () => void; onKapak: () => void }) {
  const calisiyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
  const g = kapakUrl(u) ?? u.gorselUrl;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group relative">
      <button onClick={onSec} className="relative block aspect-[9/16] w-full overflow-hidden rounded-[14px] bg-black" aria-label="Testi önizle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {g && <img src={g} alt="" className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", calisiyor && "opacity-35")} />}
        <span className={cn("absolute inset-0 rounded-[14px] outline outline-2 -outline-offset-2 transition", secili ? "outline-white" : "outline-transparent")} />
        {u.meta?.gorselUrl && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={u.meta.gorselUrl} alt="" className="absolute left-1.5 top-1.5 h-9 w-7 rounded-[8px] object-cover ring-1 ring-white/50" />)}
        {calisiyor && <span className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-white"><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />yüzde {u.ilerleme}</span>}
        {u.durum === "hata" && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11.5px] text-rose-300">Başarısız</span>}
      </button>
      {u.durum === "tamam" && (
        <button onClick={onKapak} className={cn("absolute inset-x-1.5 bottom-1.5 flex h-7 items-center justify-center gap-1 rounded-full text-[11.5px] font-semibold transition", kapak ? "bg-white text-black" : "bg-black/50 text-white opacity-0 backdrop-blur-md group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>
          {kapak ? <><Check className="h-3 w-3" strokeWidth={3} />Kapak</> : "Kapak yap"}
        </button>
      )}
    </motion.div>
  );
}


/** "Bir efektten çoğalt" rafı: K1 dilinde yazısız oynayan kartlar; seçince tarifi gelir. */
function Cogalt({ onSec, kaynak }: { onSec: (p: KatalogPreset) => void; kaynak?: string }) {
  const [q, setQ] = useState("");
  const liste = RESMI_PRESETLER.filter((p) => !q.trim() || tr(`${p.ad} ${p.aciklama}`).includes(tr(q.trim()))).sort((a, b) => a.sira - b.sira);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div><h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Ya da bir efektten çoğalt</h2><p className="mt-0.5 text-[13px] text-white/50">Sevdiğin efektin tarifini al, kendine göre değiştir.</p></div>
        <div className="flex items-center gap-1.5">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Efekt ara" aria-label="Çoğaltılacak efekti ara"
              className="h-10 w-[200px] rounded-full bg-white/[0.06] pl-10 pr-4 text-[13.5px] text-white outline-none placeholder:text-white/35 focus:bg-white/[0.09]" />
          </label>
          {[-1, 1].map((d) => (
            <button key={d} onClick={() => ref.current?.scrollBy({ left: d * 600, behavior: "smooth" })} aria-label={d < 0 ? "Geri" : "İleri"} className="hidden h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] sm:flex">
              <ArrowRight className={cn("h-4 w-4", d < 0 && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="flex snap-x scroll-px-4 gap-2 overflow-x-auto p-4 [scrollbar-width:none] sm:scroll-px-5 sm:p-5">
        {liste.map((p) => <CogaltKart key={p.slug} p={p} secili={kaynak === p.slug} onSec={() => onSec(p)} />)}
        {!liste.length && <p className="flex h-[120px] w-full items-center justify-center rounded-[16px] bg-white/[0.03] text-[13.5px] text-white/50">&ldquo;{q}&rdquo; ile eşleşen efekt yok.</p>}
      </div>
    </section>
  );
}

function CogaltKart({ p, secili, onSec }: { p: KatalogPreset; secili: boolean; onSec: () => void }) {
  const [ref, gorunur] = useGorunur<HTMLButtonElement>("150px");
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { const x = v.current; if (!x) return; if (gorunur) void x.play().catch(() => {}); else x.pause(); }, [gorunur]);
  return (
    <button ref={ref} onClick={onSec} className="group relative aspect-[9/16] w-[150px] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[#111113] text-left sm:w-[170px]">
      <span className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]"><PresetKapak p={p} /></span>
      {p.video && gorunur && <video ref={v} src={p.video} poster={p.kapak} muted loop playsInline autoPlay preload="metadata" className="absolute inset-0 h-full w-full object-cover" />}
      <span className={cn("absolute inset-0 rounded-[14px] outline outline-2 -outline-offset-2", secili ? "outline-white" : "outline-transparent")} />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
      {secili && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
      <span className="absolute inset-x-3 bottom-3 transition-transform duration-300 [@media(hover:hover)]:group-hover:-translate-y-10">
        <span lang="en" className="block truncate text-[14px] font-semibold text-white">{p.ad}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-white/60">{p.kategoriler.filter((k) => k !== "VIRAL").map((k) => KATEGORI_AD[k] ?? k)[0] ?? "Viral"}</span>
      </span>
      <span className="absolute inset-x-2 bottom-2 flex h-8 translate-y-2 items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
        {secili ? <><Check className="h-3.5 w-3.5" strokeWidth={3} />Seçili</> : <><Copy className="h-3.5 w-3.5" />Tarifini çoğalt</>}
      </span>
    </button>
  );
}


/** Yayın adımı: kim görebilir, istem görünürlüğü, ek fiyat (yarısı yaratıcıya) ve özgünlük onayı. */
function PaylasimBolumu({ f, ayarla }: { f: Form; ayarla: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  const kopya = !!f.kaynak;
  void kopya;
  const SECENEK: [Gorunurluk, string, string, React.ElementType][] = [
    ["topluluk", "Galeride", "Preset galerinde, Vayra presetlerinin yanında", Globe],
    ["ozel", "Yalnız ben", "Yalnız Benim presetlerim sekmesinde", Lock],
  ];
  return (
    <section className="overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]">
      <header className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Görünürlük</h2>
        <p className="mt-0.5 text-[13px] text-white/50">Presetlerin şimdilik yalnız senin hesabında ve bu tarayıcıda görünür; başka kullanıcılarla paylaşılmaz.</p>
      </header>
      <div className="space-y-6 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[13.5px] font-semibold text-white">Kim görebilir</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SECENEK.map(([k, ad, alt, I]) => (
              <button key={k} onClick={() => ayarla("gorunurluk", k)} aria-pressed={f.gorunurluk === k}
                className={cn("flex items-center gap-2.5 rounded-[16px] p-2.5 text-left ring-1 ring-inset transition active:scale-[0.98]", f.gorunurluk === k ? "bg-white/[0.09] ring-white/50" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", f.gorunurluk === k ? "bg-white text-black" : "bg-white/[0.06] text-white/65")}><I className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[13px] font-semibold text-white">{ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{alt}</span></span>
              </button>
            ))}
          </div>
        </div>

        {f.gorunurluk !== "ozel" && (
          <>
            <button role="switch" aria-checked={f.istemGorunur} onClick={() => ayarla("istemGorunur", !f.istemGorunur)}
              className="flex w-full items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05]">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", f.istemGorunur ? "bg-white text-black" : "bg-white/[0.06] text-white/65")}>{f.istemGorunur ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-white">İstemi göster</span><span className="block text-[11.5px] leading-snug text-white/45">{f.istemGorunur ? "Kullananlar tarifini görüp öğrenebilir." : "Tarifin gizli kalır; yalnız sonuç görünür."}</span></span>
              <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", f.istemGorunur ? "bg-white" : "bg-white/15")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-all", f.istemGorunur ? "left-[18px] bg-[#0a0a0b]" : "left-0.5 bg-white")} /></span>
            </button>

            <label className="flex cursor-pointer items-start gap-3 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <input type="checkbox" checked={f.ozgun} onChange={(e) => ayarla("ozgun", e.target.checked)} className="peer sr-only" />
              <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] ring-1 ring-inset transition peer-focus-visible:ring-2 peer-focus-visible:ring-white", f.ozgun ? "bg-white text-black ring-white" : "ring-white/30")}>{f.ozgun && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
              <span className="text-[12.5px] leading-snug text-white/65">Bu preset benim eserim; başkasının markasını, karakterini ya da yüzünü izinsiz kullanmıyor. Topluluk kurallarına aykırı presetler incelemede kaldırılır.</span>
            </label>
          </>
        )}
      </div>
    </section>
  );
}
