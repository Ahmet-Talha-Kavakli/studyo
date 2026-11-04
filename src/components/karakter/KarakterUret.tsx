"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScanFace, Pencil, Sparkles, Images, Wand2, Palette, Layers, ChevronDown, Fingerprint, Dices, Ban, X, Plus, Search, Check, Download,
  GraduationCap, Zap, Star, ImagePlus, Loader2, MapPin, Shirt, PersonStanding, Sun, Minus, SlidersHorizontal, MoreHorizontal, Pin, PinOff,
  Copy, Trash2, RotateCcw, Users, Clapperboard, ArrowDownAZ, History, Clock, ChevronLeft, AtSign, Info, Smile, Camera, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useElements, goreliZamanKisa, type VElement } from "@/store/useElements";
import type { Uretim } from "@/store/useProjeler";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast, uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { cozunurlukCarpani, GORSEL_MODELLER } from "@/lib/gorselModelVeri";
import { adHatasi, adTemizle, bostakiAd } from "@/lib/elementCekirdek";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { KCip, IzgaraSec } from "@/components/studyo/Cip";
import { PanoModal, PaletModal, type SeciliPano, type SeciliPalet } from "@/components/studyo/gorsel/RuhModallari";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { SAHNELER as SAHNE_LISTE, SAHNE_KAT, KIYAFETLER, POZLAR, ISIKLAR, type SahneKat } from "@/components/influencer/veri";
import { SonucKarti, SonucGoruntuleyici, useAracUretimleri, useGorselBaglanti, gorselModelBul, modelKredi, krediYaz, topluIndir, uretimGorseli, OranSekli } from "@/components/arac/kit";
import { PAKETLER, KARAKTER_MAKS, YUVALAR, ORNEK_KARAKTERLER, karakterler as karakterSuz, eskiKarakterleriTasi } from "./ortak";
import { DerinEgitim, useLoraTakip } from "./DerinEgitim";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { Tooltip } from "@/components/ui/Tooltip";

const VARSAYILAN_MODEL = "Nano Banana Pro";
const LORA_MODEL = "Vayra Karakter LoRA";
const YUZEY = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const YAY = { type: "spring", stiffness: 480, damping: 38 } as const;
type OzelK = "sahne" | "kiyafet" | "poz" | "isik";
const uygunModel = (x: (typeof GORSEL_MODELLER)[number]) => x.api.refMax >= 1 && x.tip !== "swap" && !x.api.refZorunlu && !x.gizli;
type Benzerlik = "serbest" | "dengeli" | "birebir";
const BENZERLIK: { id: Benzerlik; ad: string; alt: string; en: string; lora: number }[] = [
  { id: "serbest", ad: "Serbest", alt: "Stile göre yorumlar", en: "Loosely resemble the reference person; stylization is allowed.", lora: 0.75 },
  { id: "dengeli", ad: "Dengeli", alt: "Tanınır, doğal", en: "Keep the person clearly recognizable as the same person from the reference photos.", lora: 1 },
  { id: "birebir", ad: "Birebir", alt: "Yüz hatları aynen", en: "Keep the face exactly identical to the reference photos: same facial structure, eyes, nose, lips and skin tone.", lora: 1.2 },
];
/** Set kartlarının küçük resimleri (gerçek örnekler). */
const SET_GORSEL: Record<string, string[]> = {
  set: ["/gercek/galeri/urun5.webp", "/gercek/paz/ortam-sokak.webp", "/gercek/galeri/sinematik1.webp", "/gercek/paz/ortam-cati.webp"],
  sayfa: ["/gercek/element/kael-portre.webp", "/gercek/element/kael-yan.webp", "/gercek/element/kael-aksiyon.webp", "/gercek/element/kael-cokme.webp"],
  ifade: ["/gercek/element/nova-on.webp", "/gercek/element/nova-ofke.webp", "/gercek/element/nova-yakin.webp", "/gercek/element/nova-tam.webp"],
  kiyafet: KIYAFETLER.slice(1, 5).map((k) => k.kapak),
};
const SET_IKON: Record<string, typeof Camera> = { set: Camera, sayfa: LayoutGrid, ifade: Smile, kiyafet: Shirt };
const HIZLI_SAHNE = ["kafe", "neon", "cati", "editoryel", "plaj", "sokak", "ayna"].map((id) => SAHNE_LISTE.find((s) => s.id === id)).filter((s): s is (typeof SAHNE_LISTE)[number] => !!s);

/**
 * Karakter stüdyosu (tam ekran): üstte karakter seçici, ortada karakterin yelpaze kareleri ya da
 * üretim akışı, altta görselli çipli komut kutusu. id yoksa son kullanılan karakter açılır;
 * hiç karakter yoksa başlangıç ekranı gösterilir.
 */
export function KarakterUret({ id }: { id?: string }) {
  const router = useRouter();
  const masaustu = useMasaustu();
  const tum = useElements((s) => s.elementler);
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); void eskiKarakterleriTasi(); }, []);
  const liste = useMemo(() => karakterSuz(tum).sort((a, b) => (b.sonKullanim ?? b.olusturma) - (a.sonKullanim ?? a.olusturma)), [tum]);
  const e = id ? liste.find((x) => x.id === id) : undefined;
  // Kimliksiz giriş: son kullanılan karaktere geç.
  useEffect(() => { if (hazir && !id && liste[0]) router.replace(`/panel/karakter/${liste[0].id}`); }, [hazir, id, liste[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useLoraTakip(e);
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();

  const [secModel, setModel] = useState(VARSAYILAN_MODEL);
  const [yontem, setYontem] = useState<"ref" | "lora">("ref");
  const loraHazir = e?.lora?.durum === "hazir" && !!e.lora.url;
  const lora = loraHazir && yontem === "lora";
  const model = lora ? LORA_MODEL : secModel;
  const m = gorselModelBul(model);
  const [istem, setIstem] = useState("");
  const [paket, setPaket] = useState<string | null>(null);
  const [sahne, setSahne] = useState<string | null>(null);
  const [kat, setKat] = useState<SahneKat | "tum">("tum");
  const [kiyafet, setKiyafet] = useState("imza");
  const [ozel, setOzel] = useState<Record<OzelK, string>>({ sahne: "", kiyafet: "", poz: "", isik: "" });
  const [poz, setPoz] = useState<string | null>(null);
  const [isik, setIsik] = useState<string | null>(null);
  const [benzerlik, setBenzerlik] = useState<Benzerlik>("dengeli");
  const [sacKoru, setSacKoru] = useState(true);
  const [ekler, setEkler] = useState<string[]>([]);
  const [oran, setOran] = useState(m.varsayilanOran ?? "3:4");
  const [cozunurluk, setCozunurluk] = useState("2K");
  const [adet, setAdet] = useState(2);
  const [gelistir, setGelistir] = useState(false);
  const [pano, setPano] = useState<SeciliPano | null>(null);
  const [palet, setPalet] = useState<SeciliPalet | null>(null);
  const [modal, setModal] = useState<null | "pano" | "palet">(null);
  const [negatif, setNegatif] = useState("");
  const [tohum, setTohum] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [cip, setCip] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "kimlik" | "tumu">(null);
  const rafEn = useKenarGenisligi("karakter-raf", 272, 220, 420);
  const [rafAra, setRafAra] = useState("");
  const uretKilit = useRef(0);
  const istemRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = istemRef.current; if (!t) return; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 110)}px`; }, [istem]);
  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("egit")) setPanel("kimlik"); }, []);
  // Karakter değişince karaktere özgü seçimleri sıfırla.
  useEffect(() => { setEkler([]); setYontem("ref"); setSecili(null); }, [id]);
  // Model değişince desteklenmeyen oran/çözünürlüğü düzelt.
  useEffect(() => {
    if (m.api.oranlar.length && !m.api.oranlar.includes(oran)) setOran(m.varsayilanOran && m.api.oranlar.includes(m.varsayilanOran) ? m.varsayilanOran : m.api.oranlar[0]);
    if (m.api.cozunurluklar.length && !m.api.cozunurluklar.includes(cozunurluk)) setCozunurluk(m.api.cozunurluklar.includes("2K") ? "2K" : m.api.cozunurluklar[0]);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const ad = e?.ad ?? "";
  const sonuclar = useAracUretimleri(useMemo(() => (u: { meta?: { elementler?: { ad: string }[] } }) => !!ad && !!u.meta?.elementler?.some((x) => x.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr")), [ad]));
  const surer = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  /** Akış: günlere göre kartlar (Görsel stüdyosundaki galeriyle aynı dil); en yeni başta. */
  const gruplar = useMemo(() => {
    const gun = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const h = new Map<number, Uretim[]>();
    for (const u of [...sonuclar].sort((a, c) => c.olusturma - a.olusturma)) { const k = gun(u.olusturma); h.set(k, [...(h.get(k) ?? []), u]); }
    const bugun = gun(Date.now());
    return [...h.entries()].sort((a, c) => c[0] - a[0]).map(([k, l]) => ({
      k: String(k), l, ad: k === bugun ? "Bugün" : k === bugun - 86_400_000 ? "Dün" : new Date(k).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }),
    }));
  }, [sonuclar]);

  // Komut kutusu yüksekliği → içerik altta o kadar pay bırakır.
  const komutRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(150);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, [hazir, masaustu, !!e]); // eslint-disable-line react-hooks/exhaustive-deps

  const demo = b.bagli(m) === false;
  const birim = demo ? 0 : modelKredi(m) * (m.api.cozunurluklar.length ? cozunurlukCarpani(cozunurluk) : 1);
  const pk = PAKETLER.find((p) => p.id === paket);
  const kac = pk ? pk.istemler.length : m.adetGizli ? 1 : adet;
  const fotolar = e?.gorseller.filter(Boolean) ?? [];
  const stilDestekli = !lora && m.api.refMax > 5;
  const ozelSec = (k: OzelK) => ({ id: "ozel", ad: ozel[k], en: ozel[k], kapak: "", alt: "Kendi tarifin" });
  const S = sahne === "ozel" ? ozelSec("sahne") : SAHNE_LISTE.find((x) => x.id === sahne);
  const K = kiyafet === "ozel" ? ozelSec("kiyafet") : KIYAFETLER.find((x) => x.id === kiyafet);
  const P = poz === "ozel" ? ozelSec("poz") : POZLAR.find((x) => x.id === poz);
  const I = isik === "ozel" ? ozelSec("isik") : ISIKLAR.find((x) => x.id === isik);
  const B = BENZERLIK.find((x) => x.id === benzerlik)!;
  const ekKarakterler = ekler.map((x) => liste.find((k) => k.id === x)).filter((k): k is VElement => !!k);
  const eksik = !pk && istem.trim().length < 3 && !S ? "Sahneyi birkaç kelimeyle anlat ya da bir sahne seç" : b.hazir ? null : "Sağlayıcı durumu kontrol ediliyor";
  const ekAyar = [pano, palet, gelistir, negatif.trim(), tohum].filter(Boolean).length;

  /** Seçimlerden tam istem: @Ad + yazılan + sahne, kıyafet, poz, ışık + benzerlik yönergesi. */
  const istemKur = (govde: string) => {
    if (!e) return govde;
    const kim = lora ? e.lora!.tetik : `@${ad}`;
    const yan = ekKarakterler.map((k) => `@${k.ad}`).join(" ve ");
    const parca = [S?.en, K && K.en ? `wearing ${K.en}` : "", P?.en, I?.en].filter(Boolean).join(", ");
    const koru = [lora ? "" : B.en, sacKoru ? "Keep the same hairstyle and hair color." : ""].filter(Boolean).join(" ");
    return `${kim}${yan ? ` ve ${yan}` : ""} ${govde}${parca ? `${govde ? ", " : ""}${parca}` : ""}${koru ? `. ${koru}` : ""}`.trim();
  };

  /** Kullanıcıya gösterilen istem: Türkçe seçimler (modele giden İngilizce yönergeler değil). */
  const gorunurIstem = (govde: string) => [`${lora ? e!.lora!.tetik : `@${ad}`}${ekKarakterler.length ? ` ve ${ekKarakterler.map((k) => `@${k.ad}`).join(" ve ")}` : ""} ${govde}`.trim(), S?.ad, K && K.id !== "imza" ? K.ad : "", P?.ad, I?.ad, benzerlik !== "dengeli" ? `Benzerlik: ${B.ad.toLocaleLowerCase("tr")}` : ""].filter(Boolean).join(", ");
  const uret = async () => {
    if (!e) return;
    if (Date.now() - uretKilit.current < 800) return;
    uretKilit.current = Date.now();
    if (eksik) return void toast.error("Üretim başlatılamadı", { description: `${eksik}.` });
    const govdeler = pk ? pk.istemler.map((x) => x.istem.replace("@{ad} ", "")) : Array.from({ length: kac }, () => istem.trim());
    if (lora) useElements.getState().kullanildi([e.id]);
    const ilk = istemKur(govdeler[0]);
    const d = icerikDenetle(ilk);
    if (!d.izin) return void toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}: ${d.mesaj} İstemi değiştirip yeniden dene.` });
    setGonderiliyor(true);
    const grupId = `kar-${Date.now().toString(36)}`;
    const tohumSayi = tohum.trim() ? Number(tohum) : undefined;
    let n = 0;
    for (let i = 0; i < govdeler.length; i++) {
      const tam = pk ? `${lora ? e.lora!.tetik : `@${ad}`} ${govdeler[i]}` : istemKur(govdeler[i]);
      const etiket = pk ? `${pk.ad} · ${pk.istemler[i].ad}` : [istem.trim().slice(0, 40), S?.ad].filter(Boolean).join(" · ") || "Sahne";
      const s = uretimBaslat({
        baslik: `@${ad} · ${etiket}`, tur: "gorsel", model, prompt: tam, kredi: birim, arac: "Karakter", projeId: aktifProjeId ?? undefined,
        meta: {
          islem: "uret", oran, ...(lora ? { lora: { url: e.lora!.url!, olcek: B.lora }, elementler: [{ ad, tur: "karakter" }] } : {}), ...(m.api.cozunurluklar.length ? { cozunurluk } : {}), hamIstem: pk ? tam : gorunurIstem(govdeler[i]), grupId,
          ...(stilDestekli && pano ? { stilRefler: pano.gorseller.slice(0, 3), pano: pano.ad } : {}),
          ...(palet ? { renkler: palet.renkler, palet: palet.ad } : {}),
          ...(m.api.negatif && negatif.trim() ? { negatif: negatif.trim() } : {}),
          ...(m.api.tohum && Number.isInteger(tohumSayi) ? { tohum: tohumSayi! + i } : {}),
          ...(gelistir ? { gelistir: true } : {}),
        },
      });
      if (!s.ok) { if (!n) uretimHataToast(s); break; }
      n++;
    }
    setTimeout(() => setGonderiliyor(false), 500);
    if (!n) return;
    toast(pk ? `${pk.ad} üretiliyor` : n > 1 ? `${n} görsel üretiliyor` : "Görsel üretiliyor", { description: `@${ad} · ${model} · ${demo ? "Kredi düşmez." : `${krediYaz(birim * n)} kredi.`}` });
  };

  /* ═════════════ Parçalar ═════════════ */
  const img = (g?: string) => (g ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g} alt="" className="h-full w-full object-cover" /> : null);
  const cipAc = (k: string) => (v: boolean) => setCip(v ? k : null);
  const modeller = GORSEL_MODELLER.filter(uygunModel);

  const ozelKart = (k: OzelK, ph: string, secili: boolean, uygula: () => void) => {
    const hazir = ozel[k].trim().length >= 3;
    return (
      <div className={cn("mb-2 rounded-[14px] p-2 ring-1 ring-inset transition-[background-color,box-shadow]", secili ? "bg-white/[0.06] ring-white/60" : "bg-white/[0.03] ring-white/[0.07]")}>
        <div className="flex items-center gap-2 px-1 pb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Pencil className="h-3 w-3" /></span>
          <span className="text-[12.5px] font-semibold text-metin">Özel</span>
          <span className="text-[11.5px] text-metin-3">Listede yoksa kendin tarif et</span>
        </div>
        <div className="flex gap-1.5">
          <input value={ozel[k]} onChange={(x) => setOzel((o) => ({ ...o, [k]: x.target.value.slice(0, 160) }))} onKeyDown={(x) => { if (x.key === "Enter" && hazir) { x.preventDefault(); uygula(); } }}
            placeholder={ph} aria-label="Özel tarif" spellCheck={false}
            className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.05] px-3.5 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-3 focus:ring-white/40" />
          <button onClick={uygula} disabled={!hazir} className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-35">{secili ? "Güncelle" : "Uygula"}</button>
        </div>
      </div>
    );
  };
  const ozelIkon = <Pencil className="h-3.5 w-3.5" />;
  const sahneListe = SAHNE_LISTE.filter((s) => kat === "tum" || s.kat === kat);
  const sahneCip = (
    <KCip buyuk etiket="Sahne" ikon={S ? (S.kapak ? img(S.kapak) : ozelIkon) : <MapPin className="h-3.5 w-3.5" />} deger={S?.ad ?? "Serbest"} acik={cip === "sahne"} setAcik={cipAc("sahne")} genislik={480}
      sag={S ? <button onClick={() => { setSahne(null); setCip(null); }} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">Kaldır</button> : undefined}>
      {ozelKart("sahne", "Ör. yağmurlu İstanbul vapurunda, akşamüstü", sahne === "ozel", () => { setSahne("ozel"); setPaket(null); setCip(null); })}
      <div className="isolate mb-2 flex gap-0.5 overflow-x-auto rounded-full bg-white/[0.05] p-[3px] [scrollbar-width:none]">
        {SAHNE_KAT.map((c) => (
          <button key={c.id} onClick={() => setKat(c.id)} className={cn("relative h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium transition-colors duration-200", kat === c.id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {kat === c.id && <motion.span layoutId="kr-sahne-kat" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 -z-10 rounded-full bg-white" />}{c.ad}
          </button>
        ))}
      </div>
      <motion.div key={kat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }} className="grid grid-cols-3 gap-2 p-1">
        {sahneListe.map((s) => <IzgaraSec key={s.id} sec={sahne === s.id} ad={s.ad} kapak={s.kapak} onClick={() => { setSahne(s.id); setPaket(null); setCip(null); }} />)}
      </motion.div>
    </KCip>
  );
  const OZEL_PH: Record<string, string> = { kiyafet: "Ör. krem rengi keten takım, beyaz sneaker", poz: "Ör. merdivende oturmuş, kameraya gülümsüyor", isik: "Ör. pencereden giren sıcak akşam ışığı" };
  const secenekCip = (k: OzelK, etiket: string, l: { id: string; ad: string; alt?: string; kapak: string }[], deger: string | null, set: (v: string | null) => void, Bos: typeof Sun, bosAd: string, bosAlt = false) => {
    const x = deger === "ozel" ? ozelSec(k) : l.find((y) => y.id === deger);
    const kapak = (y: { id: string; kapak: string }) => (k === "kiyafet" && y.id === "imza" && fotolar[0] ? fotolar[0] : y.kapak);
    return (
      <KCip buyuk etiket={etiket} ikon={x ? (x.id === "ozel" ? ozelIkon : img(kapak(x))) : <Bos className="h-3.5 w-3.5" />} deger={x?.ad ?? bosAd} acik={cip === k} setAcik={cipAc(k)} genislik={440}>
        {ozelKart(k, OZEL_PH[k] ?? "Kendi tarifini yaz", deger === "ozel", () => { set("ozel"); setCip(null); })}
        <div className="grid grid-cols-3 gap-2 p-1">
          {bosAlt && (
            <button onClick={() => { set(null); setCip(null); }} className="group min-w-0 text-left">
              <span className={cn("flex aspect-[4/3] items-center justify-center rounded-[10px] bg-white/[0.04]", !deger ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.1]")}><Dices className="h-5 w-5 text-metin-2" /></span>
              <span className="mt-1 block text-[12.5px] font-medium text-metin">{bosAd}</span><span className="block text-[11.5px] text-metin-3">Model seçsin</span>
            </button>
          )}
          {l.map((y) => <IzgaraSec key={y.id} sec={deger === y.id} ad={y.ad} alt={y.alt} kapak={kapak(y)} onClick={() => { set(y.id); setCip(null); }} />)}
        </div>
      </KCip>
    );
  };
  const benzerlikCip = (
    <KCip buyuk etiket="Benzerlik" ikon={<ScanFace className="h-4 w-4" />} deger={B.ad} acik={cip === "benzer"} setAcik={cipAc("benzer")} genislik={340}>
      <div className="space-y-2 p-1">
        <div className="isolate flex rounded-full bg-white/[0.06] p-[3px]">
          {BENZERLIK.map((x) => (
            <button key={x.id} onClick={() => setBenzerlik(x.id)} className={cn("relative h-9 flex-1 rounded-full text-[13px] font-medium transition-colors", benzerlik === x.id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {benzerlik === x.id && <motion.span layoutId="kr-benzer" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}{x.ad}
            </button>
          ))}
        </div>
        <p className="px-1 text-[12px] text-metin-2">{B.alt}{lora ? ` · LoRA gücü ${B.lora.toLocaleString("tr-TR")}` : ""}</p>
        <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[14px] bg-white/[0.04]">
          {([["Yüzü koru", "Her zaman açık", true, () => undefined, true], ["Saçı koru", "Aynı saç rengi ve modeli", sacKoru, () => setSacKoru((v) => !v), false], ["İmza kıyafeti", "Referanstaki kıyafet", kiyafet === "imza", () => setKiyafet(kiyafet === "imza" ? "rahat" : "imza"), false]] as const).map(([a, alt, acik, f, kilit]) => (
            <button key={a} onClick={f} disabled={kilit} role="switch" aria-checked={acik} className="flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:cursor-default">
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-medium text-metin">{a}</span><span className="block text-[11.5px] text-metin-2">{alt}</span></span>
              <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/15", kilit && "opacity-60")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-transform", acik ? "translate-x-[18px] bg-black" : "translate-x-0.5 bg-white")} /></span>
            </button>
          ))}
        </div>
      </div>
    </KCip>
  );
  const modelCip = (
    <KCip buyuk etiket={lora ? "Model, LoRA" : "Model"} ikon={<ModelLogo ad={lora ? "FLUX" : model} boyut={36} />} deger={lora ? "FLUX LoRA" : model} acik={cip === "model"} setAcik={(v) => !lora && cipAc("model")(v)} genislik={390}>
      <div className="space-y-0.5">
        {modeller.map((x) => {
          const sec = x.ad === secModel;
          return (
            <button key={x.ad} onClick={() => { setModel(x.ad); setYontem("ref"); setCip(null); }} className="relative flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.05]">
              {sec && <motion.span layoutId="kr-model" transition={YAY} className="absolute inset-0 rounded-[12px] bg-white/[0.08]" />}
              <span className="relative"><ModelLogo ad={x.ad} boyut={34} /></span>
              <span className="relative min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{x.ad}</span><span className="block truncate text-[12px] text-metin-2">{x.ozet}</span></span>
              <span className="relative flex shrink-0 items-center gap-1.5">{!demo && <KrediHap deger={modelKredi(x)} secili={sec} />}{sec && <Check className="h-4 w-4 text-white" />}</span>
            </button>
          );
        })}
      </div>
    </KCip>
  );
  const oranCip = m.api.oranlar.length > 0 && (
    <KCip buyuk etiket="Oran ve kalite" ikon={<OranSekli oran={oran} boyut={15} />} deger={<span className="tabular-nums">{oran}{m.api.cozunurluklar.length ? <span className="text-metin-2"> · {cozunurluk}</span> : null}</span>} acik={cip === "oran"} setAcik={cipAc("oran")} genislik={330}>
      <div className="grid grid-cols-5 gap-1.5 p-1">
        {m.api.oranlar.map((o) => (
          <button key={o} onClick={() => setOran(o)} aria-pressed={oran === o} className={cn("flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-[12px] text-[11.5px] font-semibold tabular-nums transition", oran === o ? "bg-white text-black" : "bg-white/[0.05] text-metin-2 hover:bg-white/[0.09] hover:text-metin")}>
            <OranSekli oran={o} boyut={20} />{o}
          </button>
        ))}
      </div>
      {m.api.cozunurluklar.length > 0 && (
        <div className="isolate mx-1 mt-2 flex gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
          {m.api.cozunurluklar.map((c) => (
            <button key={c} onClick={() => setCozunurluk(c)} className={cn("relative h-9 flex-1 rounded-full text-[12.5px] font-semibold transition-colors", cozunurluk === c ? "text-black" : "text-metin-2 hover:text-metin")}>
              {cozunurluk === c && <motion.span layoutId="kr-coz" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}{c}{cozunurlukCarpani(c) !== 1 && <span className="ml-1 text-[10.5px] font-medium opacity-60">×{cozunurlukCarpani(c)}</span>}
            </button>
          ))}
        </div>
      )}
    </KCip>
  );
  const adetSec = !pk && !m.adetGizli && (
    <div className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-white/[0.06] py-1.5 pl-3.5 pr-1.5 ring-1 ring-inset ring-white/[0.08]" role="radiogroup" aria-label="Görsel sayısı">
      <span className="mr-1.5 text-[12px] font-medium text-metin-3">Adet</span>
      {[1, 2, 3, 4].map((k) => (
        <button key={k} onClick={() => setAdet(k)} role="radio" aria-checked={adet === k} aria-label={`${k} görsel`}
          className={cn("relative h-9 w-9 rounded-full text-[13.5px] font-semibold tabular-nums transition-colors duration-200", adet === k ? "text-black" : "text-metin-2 hover:text-metin")}>
          {adet === k && <motion.span layoutId="kr-adet" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 rounded-full bg-white" />}
          <span className="relative">{k}</span>
        </button>
      ))}
    </div>
  );
  const ayarCip = (
    <KCip buyuk etiket="Gelişmiş" ikon={<SlidersHorizontal className="h-4 w-4" />} deger={ekAyar ? `${ekAyar} ayar açık` : "Stil, palet"} acik={cip === "ayar"} setAcik={cipAc("ayar")} genislik={360}>
      <div className="space-y-2 p-0.5">
        <div className="grid grid-cols-2 gap-2">
          {([["pano", Layers, "Ruh panosu", "Görsel stil referansı", pano?.ad, pano?.gorseller?.slice(0, 3) ?? [], !stilDestekli], ["palet", Palette, "Renk paleti", "Baskın renkler", palet?.ad, [], false]] as const).map(([k, Ik, a, alt, v, onizleme, kapali]) => (
            <div key={k} className="relative">
              <button onClick={() => { setCip(null); setModal(k); }} disabled={kapali} title={kapali ? "Bu model stil referansı almaz" : undefined}
                className={cn("block w-full overflow-hidden rounded-[14px] text-left ring-1 ring-inset transition-[background-color,box-shadow] disabled:opacity-40", v ? "bg-white/[0.07] ring-white/60" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06] hover:ring-white/20")}>
                <span className="m-1 mb-0 flex h-[54px] items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-white/[0.04]">
                  {k === "palet" && palet ? palet.renkler.slice(0, 5).map((r) => <span key={r} className="h-8 w-5 rounded-[6px] ring-1 ring-white/10" style={{ background: r }} />)
                    : onizleme.length ? onizleme.map((g) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="h-10 w-10 rounded-[8px] object-cover" />))
                    : <Ik className="h-5 w-5 text-metin-3" />}
                </span>
                <span className="block px-2.5 pb-2 pt-1.5 leading-tight"><span className="block text-[12.5px] font-semibold text-metin">{a}</span><span className="block truncate text-[11.5px] text-metin-3">{v ?? alt}</span></span>
              </button>
              {v && <button onClick={() => (k === "pano" ? setPano(null) : setPalet(null))} aria-label={`${a} kaldır`} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"><X className="h-3 w-3" /></button>}
            </div>
          ))}
        </div>
        <button onClick={() => setGelistir((v) => !v)} role="switch" aria-checked={gelistir} className={cn("flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-colors", gelistir ? "bg-white/[0.06] ring-white/30" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.05]")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Wand2 className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-semibold text-metin">İstemi geliştir</span><span className="block text-[11.5px] text-metin-3">Kısa tarifi ayrıntılı istemle zenginleştirir</span></span>
          <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", gelistir ? "bg-white" : "bg-white/15")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-transform", gelistir ? "translate-x-[18px] bg-black" : "translate-x-0.5 bg-white")} /></span>
        </button>
        {m.api.negatif && (
          <label className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 py-2.5 outline outline-1 -outline-offset-1 outline-transparent focus-within:outline-white/30">
            <Ban className="h-4 w-4 text-metin-2" />
            <input value={negatif} onChange={(x) => setNegatif(x.target.value.slice(0, 300))} placeholder="Olmasın: bulanık, fazla parmak" aria-label="Negatif istem" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-2" />
          </label>
        )}
        {m.api.tohum && (
          <div className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 py-2">
            <Fingerprint className="h-4 w-4 text-metin-2" />
            <input inputMode="numeric" value={tohum} onChange={(x) => setTohum(x.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Tohum, rastgele" aria-label="Tohum" className="min-w-0 flex-1 bg-transparent text-[13px] tabular-nums text-metin outline-none placeholder:text-metin-2" />
            <button onClick={() => setTohum(String(Math.floor(Math.random() * 2_000_000_000)))} aria-label="Rastgele tohum" className="flex h-7 w-7 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.08] active:scale-90"><Dices className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
    </KCip>
  );
  /** Sahneye ikinci karakter: @ ile çağrılır. */
  const ekKarakterCip = liste.length > 1 && (
    <div className="relative">
      <button onClick={() => setCip(cip === "ek" ? null : "ek")} aria-label="Sahneye karakter ekle" title="Sahneye karakter ekle" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] active:scale-90"><AtSign className="h-4 w-4" /></button>
      <Yuzen acik={cip === "ek"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Sahneye karakter ekle" className={cn("w-[300px] overflow-hidden", POP)}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Users className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Sahneye ekle</span><span className="ml-auto rounded-full bg-white/[0.08] px-2 text-[11px] tabular-nums text-metin-2">{ekler.length}/2</span></div>
        <div className="max-h-[300px] space-y-0.5 overflow-y-auto p-1.5">
          {liste.filter((k) => k.id !== e?.id).map((k) => {
            const sec = ekler.includes(k.id);
            return (
              <button key={k.id} onClick={() => setEkler((l) => (sec ? l.filter((x) => x !== k.id) : l.length >= 2 ? l : [...l, k.id]))} className={cn("flex w-full items-center gap-2.5 rounded-[12px] p-1.5 text-left transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.08]")}>
                <ElementKapak e={k} className="h-9 w-9 shrink-0 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-metin">@{k.ad}</span>
                {sec && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      </Yuzen>
    </div>
  );

  /* ── Komut kutusu ── */
  const kimlikHap = e && (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.12] py-0.5 pl-0.5 pr-1 text-[13px] font-semibold text-white">
      {lora ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><GraduationCap className="h-3.5 w-3.5" /></span>
        : <ElementKapak e={e} className="h-6 w-6 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />}
      <span className="pr-1.5">{lora ? e.lora!.tetik : `@${e.ad}`}</span>
      {ekKarakterler.map((k) => (
        <motion.span key={k.id} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full bg-white/[0.12] py-0.5 pl-0.5 pr-1.5 text-[12.5px]">
          <ElementKapak e={k} className="h-5 w-5 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />@{k.ad}
          <button onClick={() => setEkler((l) => l.filter((x) => x !== k.id))} aria-label={`@${k.ad} çıkar`} className="text-white/60 hover:text-white"><X className="h-3 w-3" /></button>
        </motion.span>
      ))}
    </span>
  );
  const uretDugmesi = (
    <Tooltip label={eksik ?? "Ctrl+Enter ile de üretebilirsin"} side="top" className={masaustu ? "ml-auto inline-flex" : "flex w-full"}>
      <button onClick={() => void uret()} disabled={gonderiliyor || !e}
        className={cn("flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white text-black transition hover:bg-white/90 active:scale-[0.97] disabled:opacity-60", masaustu ? "pl-5 pr-2" : "w-full")}>
        <span className="flex items-center gap-1.5 text-[15px] font-semibold">{gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{pk ? "Seti üret" : "Üret"}</span>
        <motion.span key={birim * kac} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-black/[0.08] px-2.5 py-1 text-[12px] font-medium tabular-nums text-black/70">
          {demo ? "Ücretsiz" : <><KrediYildiz className="h-3 w-3" />{krediYaz(birim * kac)}</>}{kac > 1 && <span className="text-black/45">· {kac} görsel</span>}
        </motion.span>
      </button>
    </Tooltip>
  );
  const komut = (
    <div className="cam-istemci w-full rounded-[26px] p-2.5">
      <div className={cn("flex items-stretch gap-2.5", !masaustu && "flex-col")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 px-1 pt-0.5">
            {kimlikHap}
            {pk ? (
              <div className="flex min-h-[32px] flex-1 flex-wrap items-center gap-1.5">
                <span className="text-[13.5px] text-metin-2">{pk.ad}:</span>
                {pk.istemler.map((x) => <span key={x.ad} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-metin">{x.ad}</span>)}
                <button onClick={() => setPaket(null)} className="ml-auto flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><X className="h-3.5 w-3.5" />Seti kaldır</button>
              </div>
            ) : (
              <>
                <textarea ref={istemRef} value={istem} onChange={(x) => setIstem(x.target.value.replace(/@\S*/g, "").slice(0, 800))} rows={1} aria-label="Sahne istemi" spellCheck={false}
                  onKeyDown={(x) => { if (x.key === "Enter" && (x.ctrlKey || x.metaKey)) { x.preventDefault(); void uret(); } }}
                  placeholder={S ? `${S.ad} · istersen ayrıntı ekle` : "Ne yapıyor, nerede, nasıl bir an?"}
                  className="block min-h-[32px] w-full resize-none bg-transparent py-1 text-[15px] leading-relaxed text-metin outline-none placeholder:text-metin-2" />
                {istem && <button onClick={() => setIstem("")} aria-label="İstemi temizle" className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.06] hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
              </>
            )}
          </div>
          <div className={cn("mt-2.5 flex items-center gap-1.5", masaustu ? "flex-wrap" : "gizli-scroll -mx-2.5 overflow-x-auto px-2.5 [mask-image:linear-gradient(90deg,transparent,#000_12px,#000_calc(100%-24px),transparent)]")}>
            {ekKarakterCip}
            {!pk && sahneCip}
            {!pk && secenekCip("kiyafet", "Kıyafet", KIYAFETLER, kiyafet, (v) => setKiyafet(v ?? "imza"), Shirt, "İmza tarzı")}
            {!pk && secenekCip("poz", "Poz", POZLAR, poz, setPoz, PersonStanding, "Otomatik", true)}
            {!pk && secenekCip("isik", "Işık", ISIKLAR, isik, setIsik, Sun, "Otomatik", true)}
            {benzerlikCip}
            {modelCip}
            {oranCip}
            {adetSec}
            {ayarCip}
            {masaustu && uretDugmesi}
          </div>
        </div>
        {!masaustu && uretDugmesi}
      </div>
    </div>
  );

  /* ── Karakter seçici (üst orta) ── */
  const seciciListe = liste.slice(0, masaustu ? 6 : 12);
  const secici = (
    <div className={cn("flex items-center gap-1 rounded-full p-1", YUZEY, !masaustu && "gizli-scroll max-w-full overflow-x-auto")} role="tablist" aria-label="Karakterler">
      {seciciListe.map((k) => {
        const a = k.id === e?.id;
        return (
          <button key={k.id} role="tab" aria-selected={a} onClick={() => router.push(`/panel/karakter/${k.id}`)} className={cn("relative flex h-9 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] transition-colors", a ? "font-semibold text-black" : "text-metin-2 hover:text-metin")}>
            {a && <motion.span layoutId="kr-secici" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <ElementKapak e={k} className="h-7 w-7 shrink-0 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
            <span className="max-w-[90px] truncate">{k.ad}</span>
            {(k.lora?.durum === "sirada" || k.lora?.durum === "egitiliyor") && <Loader2 className="h-3 w-3 animate-spin" />}
          </button>
        );
      })}
      {liste.length > seciciListe.length && <button onClick={() => setPanel("tumu")} className="flex h-9 shrink-0 items-center rounded-full px-3 text-[13px] text-metin-2 hover:text-metin">+{liste.length - seciciListe.length}</button>}
      <span className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />
      <button onClick={() => setPanel("tumu")} aria-label="Tüm karakterler" title="Tüm karakterler" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90"><Users className="h-4 w-4" /></button>
      <Link href="/panel/karakter/yeni" aria-label="Yeni karakter" title="Yeni karakter" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-metin transition hover:bg-white/[0.16] active:scale-90"><Plus className="h-4 w-4" /></Link>
    </div>
  );

  /* ── Boş akış: yelpaze + başlık + hızlı sahneler + tek tıkla setler ── */
  const yelpazeListe = useMemo(() => {
    const f = fotolar.slice(0, 5);
    const doldur = HIZLI_SAHNE.map((s) => s.kapak);
    const l: { g: string; foto: boolean }[] = f.map((g) => ({ g, foto: true }));
    let i = 0;
    while (l.length < 5) { const s = { g: doldur[i++ % doldur.length], foto: false }; if (l.length % 2) l.push(s); else l.unshift(s); }
    return l;
  }, [fotolar.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const bosAkis = e && (
    <div className="mx-auto max-w-[1100px] px-5 pt-6 text-center">
      <Yelpaze l={yelpazeListe} buyuk={masaustu} />
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn("font-semibold tracking-[-0.035em] text-metin", masaustu ? "mt-6 text-[40px] leading-[1.02]" : "mt-6 text-[30px] leading-[1.05]")}>{masaustu ? "İlk sahneyi anlat" : `@${e.ad} ile üretmeye başla`}</motion.h1>
      <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-metin-2">{masaustu ? "Bir sahne yaz ya da aşağıdan seç; referans fotoğrafların her karede kimlik olarak gider, yüz aynı kalır." : `Bir sahne anlat ya da aşağıdan seç. ${fotolar.length} referans fotoğraf her karede kimlik olarak gider; yüz aynı kalır.`}</p>
      <div className="mx-auto mt-5 flex max-w-[820px] flex-wrap justify-center gap-1.5">
        {HIZLI_SAHNE.map((s, i) => (
          <motion.button key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }} onClick={() => { setSahne(s.id); setPaket(null); istemRef.current?.focus(); }}
            className={cn("flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] transition active:scale-95", sahne === s.id ? "bg-white font-medium text-black" : "bg-white/[0.07] text-metin hover:bg-white/[0.12]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.kapak} alt="" className="h-7 w-7 rounded-full object-cover" />{s.ad}
          </motion.button>
        ))}
      </div>
      <section className={cn(KART, "mx-auto mt-6 max-w-[1000px] text-left")}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3"><Layers className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Tek tıkla set</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2">4 görsel, istem gerekmez</span></div>
        <div className={cn("grid gap-2 p-2.5", masaustu ? "grid-cols-4" : "grid-cols-2")}>
          {PAKETLER.map((p) => {
            const sec = paket === p.id;
            const Ik = SET_IKON[p.id] ?? Camera;
            return (
              <button key={p.id} onClick={() => setPaket(sec ? null : p.id)} aria-pressed={sec} className={cn("group rounded-[16px] p-1.5 text-left outline outline-1 -outline-offset-1 transition active:scale-[0.98]", sec ? "bg-white/[0.1] outline-white/80" : "bg-white/[0.03] outline-white/[0.07] hover:bg-white/[0.06]")}>
                <span className="grid grid-cols-4 gap-1">
                  {(SET_GORSEL[p.id] ?? []).map((g, j) => (
                    <span key={g} className="aspect-[3/4] overflow-hidden rounded-[8px] transition-transform duration-300 group-hover:-translate-y-0.5" style={{ transitionDelay: `${j * 30}ms` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </span>
                <span className="mt-2 flex items-center gap-2 px-1 pb-0.5">
                  <Ik className="h-4 w-4 shrink-0 text-metin-2" />
                  <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-semibold text-metin">{p.id === "sayfa" ? "Açı seti" : p.ad}</span><span className="block truncate text-[11.5px] text-metin-2">{p.alt}</span></span>
                  <span className="flex shrink-0 items-center gap-0.5 text-[11.5px] tabular-nums text-metin-2">{!demo && <><KrediYildiz className="h-3 w-3" />{krediYaz(birim * p.istemler.length)}</>}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  /* ── Akış ── */
  const akis = (
    <div className={cn("mx-auto max-w-[1240px] space-y-3 px-5", masaustu ? "pt-3" : "pt-4")}>
      <AnimatePresence initial={false}>
        {gruplar.map(({ k, l, ad: gunAd }) => {
          const surenler = l.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
          const tamam = l.filter((u) => u.durum === "tamam" && u.gercek !== false);
          return (
            <motion.section key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={KART}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
                <span className="text-[14px] font-semibold text-metin first-letter:uppercase">{gunAd}</span>
                <span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] tabular-nums text-metin-2">{l.length}</span>
                <AnimatePresence>{surenler > 0 && <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin"><Loader2 className="h-3 w-3 animate-spin" />{surenler} üretiliyor</motion.span>}</AnimatePresence>
                <span className="flex-1" />
                {tamam.length > 1 && <button onClick={() => void topluIndir(`vayra-${ad}`, tamam)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-metin transition hover:bg-white/[0.12] active:scale-95"><Download className="h-3.5 w-3.5" />Tümünü indir</button>}
              </div>
              <div className={cn("grid gap-1 p-1", masaustu ? "grid-cols-4 2xl:grid-cols-5" : "grid-cols-2")}>
                <AnimatePresence initial={false}>
                  {l.map((u) => {
                    const sr = u.durum === "kuyrukta" || u.durum === "isleniyor";
                    const [w, h] = String(u.meta?.oran ?? "3:4").split(":").map(Number);
                    return (
                      <motion.div key={u.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
                        {sr ? (
                          <div className="relative overflow-hidden rounded-[14px] bg-[#121214]" style={{ aspectRatio: `${w || 3} / ${h || 4}` }}>
                            <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} />
                          </div>
                        )   : <SonucKarti u={u} onAc={() => setSecili(u.id)} demoGizle />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );

  /* ── Kimlik paneli ── */
  const kimlik = e && (
    <div className="space-y-3">
      <section className={KART}>
        <div className="relative h-[112px] overflow-hidden">
          <ElementKapak e={e} className="absolute inset-0 scale-125 opacity-60 blur-2xl [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
          <span className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-[#141517]" />
        </div>
        <div className="relative -mt-12 flex items-end gap-3.5 px-4">
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative block h-[96px] w-[96px] shrink-0 overflow-hidden rounded-[24px] ring-4 ring-[#141517]">
            <ElementKapak e={e} className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-top" oynat={false} />
          </motion.span>
          <div className="min-w-0 flex-1 pb-1.5">
            <p className="truncate text-[22px] font-semibold tracking-[-0.02em] text-metin">@{e.ad}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-metin-2">{loraHazir ? <><GraduationCap className="h-3 w-3" />LoRA hazır</> : <><Zap className="h-3 w-3" />Anında referans</>}</span>
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-metin-2">{e.kullanim} üretim</span>
              {e.ornek && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-metin-2">Örnek</span>}
            </div>
          </div>
        </div>
        <div className="m-3 mt-3.5 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-metin-3" /><span className="text-[12px] font-medium text-metin-3">Tarif</span>
            <Link href={`/panel/karakter/yeni?id=${e.id}`} className="ml-auto rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">Düzenle</Link></div>
          <p className={cn("mt-1 text-[13.5px] leading-relaxed", e.aciklama ? "text-metin" : "text-metin-3")}>{e.aciklama || "Henüz tarif yok. Fotoğrafta görünmeyen ayrıntıları yazmak benzerliği artırır."}</p>
        </div>
      </section>
      <section className={KART}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5">
          <Images className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Referans fotoğraflar</span><span className="rounded-full bg-white/[0.08] px-2 text-[11.5px] tabular-nums text-metin-2">{fotolar.length}/{KARAKTER_MAKS}</span>
          <Link href={`/panel/karakter/yeni?id=${e.id}`} className="ml-auto flex h-7 items-center gap-1 rounded-full bg-white/[0.07] px-2.5 text-[12px] font-medium text-metin transition hover:bg-white/[0.12]"><Pencil className="h-3 w-3" />Düzenle</Link>
        </div>
        <div className="grid grid-cols-5 gap-1.5 p-3">
          {fotolar.map((g, i) => (
            <motion.span key={g} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 * i }} className="relative block aspect-[3/4] overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute inset-x-1 bottom-1 rounded-full bg-black/60 py-0.5 text-center text-[10.5px] font-semibold text-white backdrop-blur">Kapak</span>}
            </motion.span>
          ))}
          {fotolar.length < KARAKTER_MAKS && (
            <Link href={`/panel/karakter/yeni?id=${e.id}`} className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-white/20 text-metin-3 transition hover:border-white/45 hover:bg-white/[0.03] hover:text-metin">
              <Plus className="h-4 w-4" /><span className="text-[11.5px] font-medium">Ekle</span>
            </Link>
          )}
        </div>
        <div className="border-t border-white/[0.06] px-3.5 py-3">
          <div className="flex items-center justify-between text-[12px]"><span className="font-medium text-metin-2">Benzerlik gücü</span><span className="tabular-nums text-metin-3">{fotolar.length >= 3 ? "Güçlü" : fotolar.length === 2 ? "Orta" : "Temel"}</span></div>
          <div className="mt-2 grid grid-cols-5 gap-1">{Array.from({ length: KARAKTER_MAKS }, (_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-500", i < fotolar.length ? "bg-white" : "bg-white/[0.08]")} />)}</div>
          {fotolar.length < 3 && <p className="mt-2 text-[12px] leading-snug text-metin-3">Farklı açılardan {3 - fotolar.length} fotoğraf daha eklersen yüz her karede daha tutarlı olur.</p>}
        </div>
      </section>
      {loraHazir && (
        <section className={KART}>
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Fingerprint className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Kimlik yöntemi</span></div>
          <div className="isolate m-2.5 flex rounded-full bg-white/[0.06] p-[3px]">
            {([["ref", Zap, "Referans"], ["lora", GraduationCap, "LoRA"]] as const).map(([k, Ik, a]) => (
              <button key={k} onClick={() => setYontem(k)} className={cn("relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", yontem === k ? "text-black" : "text-metin-2 hover:text-metin")}>
                {yontem === k && <motion.span layoutId="kr-yontem" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}<Ik className="h-3.5 w-3.5" />{a}
              </button>
            ))}
          </div>
        </section>
      )}
      <section className={KART}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><GraduationCap className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Derin eğitim</span><span className="text-[12px] text-metin-3">Sana özel FLUX LoRA</span></div>
        <div className="p-3"><DerinEgitim e={e} fal={b.hazir ? b.fal : null} gomulu /></div>
      </section>
    </div>
  );

  const ekEylem = (u: Uretim) => {
    const g = uretimGorseli(u);
    if (!g || u.gercek === false || !e) return null;
    const varMi = fotolar.includes(g);
    const st = useElements.getState();
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => { st.guncelle(e.id, { gorseller: [g, ...fotolar.filter((x) => x !== g)].slice(0, KARAKTER_MAKS) }); toast.success("Kapak güncellendi"); }}
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[12.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Star className="h-3.5 w-3.5" />Kapak yap</button>
        <button disabled={varMi || fotolar.length >= KARAKTER_MAKS} title={varMi ? "Zaten referansta" : fotolar.length >= KARAKTER_MAKS ? `En fazla ${KARAKTER_MAKS} referans` : "Bu görseli kimlik referanslarına ekler"}
          onClick={() => { st.guncelle(e.id, { gorseller: [...fotolar, g] }); toast.success("Referansa eklendi", { description: `@${e.ad} artık ${fotolar.length + 1} fotoğrafla çalışır.` }); }}
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[12.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-40"><ImagePlus className="h-3.5 w-3.5" />Referansa ekle</button>
        <button onClick={() => { sessionStorage.setItem("vayra-animate-ref", g); router.push("/panel/video"); }}
          className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black transition active:scale-95"><Clapperboard className="h-3.5 w-3.5" />Videoya çevir</button>
      </div>
    );
  };

  const modallar = (
    <>
      <AnimatePresence>{secili && <SonucGoruntuleyici liste={sonuclar.filter((u) => u.durum === "tamam" || u.durum === "hata")} id={secili} onSec={setSecili} onKapat={() => setSecili(null)} ekEylem={ekEylem} />}</AnimatePresence>
      {modal === "pano" && <PanoModal secili={pano} onSec={(p) => { setPano(p); setModal(null); }} onKapat={() => setModal(null)} />}
      {modal === "palet" && <PaletModal secili={palet} onSec={(p) => { setPalet(p); setModal(null); }} onKapat={() => setModal(null)} />}
      <AnimatePresence>
        {panel && (
          <YanPanel taraf={panel === "tumu" ? "sol" : "sag"} baslik={panel === "tumu" ? "Karakterlerin" : "Kimlik"} alt={panel === "tumu" ? `${liste.length} karakter` : e ? `@${e.ad}` : ""} ikon={panel === "tumu" ? Users : ScanFace} onKapat={() => setPanel(null)}>
            {panel === "tumu" ? <TumKarakterler liste={liste} seciliId={e?.id} onKapat={() => setPanel(null)} /> : kimlik}
          </YanPanel>
        )}
      </AnimatePresence>
    </>
  );

  /* ═════════════ Durumlar ═════════════ */
  const zemin = "bg-[#0b0b0c] bg-[radial-gradient(ellipse_at_50%_20%,#1a1b1f_0%,#0b0b0c_60%)]";
  if (!hazir || (!id && liste.length)) return <div className={cn("min-h-[calc(100dvh-var(--ust-nav))]", zemin)} />;
  if (id && !e) return (
    <div className={cn("flex min-h-[calc(100dvh-var(--ust-nav))] items-center justify-center p-6", zemin)}>
      <section className={cn(KART, "w-full max-w-[420px]")}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3"><ScanFace className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Karakter bulunamadı</span></div>
        <p className="px-4 py-3 text-[13px] text-metin-2">Silinmiş ya da bu tarayıcıda oluşturulmamış olabilir.</p>
        <div className="flex gap-2 border-t border-white/[0.07] p-3">
          <Link href="/panel/karakter" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black active:scale-95"><ChevronLeft className="h-4 w-4" />Karakterlere dön</Link>
          <Link href="/panel/karakter/yeni" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin"><Plus className="h-4 w-4" />Yeni karakter</Link>
        </div>
      </section>
    </div>
  );
  if (!e) return <Baslangic zemin={zemin} masaustu={masaustu} />;

  const ustSag = (
    <div className="flex items-center gap-1.5">
      {surer > 0 && <span className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-metin" aria-live="polite"><Loader2 className="h-3.5 w-3.5 animate-spin" />{surer}{masaustu && " üretiliyor"}</span>}
      <button onClick={() => setPanel("kimlik")} aria-label="Kimlik" className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin transition active:scale-95", YUZEY)}>
        <ElementKapak e={e} className="h-6 w-6 overflow-hidden rounded-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />{masaustu && "Kimlik"}
        {loraHazir ? <GraduationCap className="h-3.5 w-3.5 text-metin-2" /> : e.lora?.durum === "egitiliyor" || e.lora?.durum === "sirada" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-metin-2" /> : null}
      </button>
    </div>
  );

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    return (
      <div data-kendi-kisayol className={cn("flex min-h-[100dvh] flex-col overflow-x-clip", zemin)}>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-[#0b0b0c]/90 px-2 backdrop-blur-md">
          <button onClick={() => router.push("/panel/gorsel")} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin active:scale-90"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-metin">Karakter</h1>
          {ustSag}
        </header>
        <div className="flex justify-center px-2 pb-1">{secici}</div>
        <div className="flex-1 pb-4">{gruplar.length ? akis : bosAkis}</div>
        <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komut}</div>
        {modallar}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  const rafQ = rafAra.trim().toLocaleLowerCase("tr").replace(/^@/, "");
  const rafListe = [...liste.filter((k) => k.sabitli), ...liste.filter((k) => !k.sabitli)].filter((k) => !rafQ || `${k.ad} ${k.aciklama}`.toLocaleLowerCase("tr").includes(rafQ));
  const raf = (
    <>
      <div className="space-y-2 p-3 pb-2">
        <div className="flex items-center gap-2.5 rounded-[16px] bg-white/[0.04] p-1.5 pr-2.5 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-metin"><ScanFace className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14px] font-semibold text-metin">Karakterler</span><span className="block whitespace-nowrap text-[11.5px] text-metin-2">Aynı yüz, her sahnede</span></span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-metin-2">{liste.length}</span>
        </div>
        {liste.length > 5 && (
          <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.04] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-metin-3" />
            <input value={rafAra} onChange={(x) => setRafAra(x.target.value)} placeholder="Karakter ara" aria-label="Karakter ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
            {rafAra && <button onClick={() => setRafAra("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
          </label>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
        <Link href="/panel/karakter/yeni" className="group mb-1.5 flex items-center gap-2.5 rounded-[14px] border border-dashed border-white/15 p-1.5 transition-colors hover:border-white/40 hover:bg-white/[0.03]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white text-black transition-transform group-hover:scale-[1.04]"><Plus className="h-5 w-5" /></span>
          <span className="min-w-0 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Yeni karakter</span><span className="block whitespace-nowrap text-[11.5px] text-metin-3">1-{KARAKTER_MAKS} fotoğraf, ücretsiz</span></span>
        </Link>
        <AnimatePresence initial={false}>
          {rafListe.map((k, i) => <RafSatiri key={k.id} k={k} sira={i} secili={k.id === e.id} onSec={() => router.push(`/panel/karakter/${k.id}`)} />)}
        </AnimatePresence>
        {!rafListe.length && <p className="mx-1 rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] text-metin-2">“{rafAra}” ile eşleşen karakter yok</p>}
      </div>
    </>
  );
  const durum = e.lora?.durum === "sirada" || e.lora?.durum === "egitiliyor" ? { ik: <Loader2 className="h-3 w-3 animate-spin" />, a: "LoRA eğitiliyor" } : loraHazir ? { ik: <GraduationCap className="h-3 w-3" />, a: "LoRA hazır" } : { ik: <Zap className="h-3 w-3" />, a: "Anında referans" };
  const baslikKart = (
    <motion.section key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn(KART, "flex items-center gap-4 p-2.5 pr-3")}>
      <button onClick={() => setPanel("kimlik")} aria-label="Kimliği aç" className="group relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/10">
        <ElementKapak e={e} className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.06]" oynat={false} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-metin">@{e.ad}</h1>
          <span className="flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-metin-2">{durum.ik}{durum.a}</span>
          {surer > 0 && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-metin" aria-live="polite"><Loader2 className="h-3 w-3 animate-spin" />{surer} üretiliyor</span>}
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-metin-2">{e.aciklama || "Tarif eklenmedi. Kimlik panelinden kısa bir tarif yazmak benzerliği artırır."}</p>
      </div>
      <Tooltip label="Referans fotoğraflar" side="bottom">
        <button onClick={() => setPanel("kimlik")} className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.04] py-1 pl-1 pr-3 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.08]">
          <span className="flex -space-x-2">
            {fotolar.slice(0, 4).map((g, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <motion.img key={g} src={g} alt="" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="h-8 w-8 rounded-full object-cover ring-2 ring-[#18191c]" />
            ))}
          </span>
          <span className="whitespace-nowrap text-[12.5px] font-medium tabular-nums text-metin">{fotolar.length}/{KARAKTER_MAKS}</span>
        </button>
      </Tooltip>
      <button onClick={() => setPanel("kimlik")} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] active:scale-95">
        <Fingerprint className="h-4 w-4" />Kimlik
      </button>
    </motion.section>
  );
  return (
    <div data-kendi-kisayol className={cn("flex h-[calc(100vh-var(--ust-nav))] w-full overflow-hidden", zemin)}>
      <motion.aside style={{ width: rafEn }} className="relative flex shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e10]">
        <KenarTutamac en={rafEn} anahtar="karakter-raf" varsayilan={272} min={220} max={420} taraf="sol" etiket="Karakter rafının genişliği" />
        {raf}
      </motion.aside>
      <div className="relative min-w-0 flex-1">
        <div className="h-full overflow-y-auto [scrollbar-width:thin]" style={{ paddingBottom: komutH + 40 }}>
          <div className="mx-auto max-w-[1240px] px-5 pt-4">{baslikKart}</div>
          {gruplar.length ? akis : bosAkis}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-5">
          <div ref={komutRef} className="pointer-events-auto w-full max-w-[1040px]">{komut}</div>
        </div>
      </div>
      {modallar}
    </div>
  );
}

/** Sol raftaki karakter satırı: kapak, ad, sayılar; üzerine gelince seçenekler menüsü. */
function RafSatiri({ k, secili, sira, onSec }: { k: VElement; secili: boolean; sira: number; onSec: () => void }) {
  const [menu, setMenu] = useState(false);
  const { ogeler, adDuzen, setAdDuzen, hata, kaydet } = useKarakterMenu(k, secili);
  const egitiliyor = k.lora?.durum === "sirada" || k.lora?.durum === "egitiliyor";
  const foto = k.gorseller.filter(Boolean).length;
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ delay: Math.min(sira, 10) * 0.02 }} className="group relative">
      {adDuzen != null ? (
        <div className="rounded-[14px] bg-white/[0.06] p-1.5 ring-1 ring-inset ring-white/30">
          <label className={cn("flex h-9 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 outline outline-1 -outline-offset-1", hata ? "outline-rose-400/60" : "outline-transparent focus-within:outline-white/40")}>
            <AtSign className="h-3.5 w-3.5 text-metin-2" />
            <input autoFocus value={adDuzen} onChange={(x) => setAdDuzen(adTemizle(x.target.value))} onKeyDown={(x) => { if (x.key === "Enter") kaydet(); if (x.key === "Escape") { x.stopPropagation(); setAdDuzen(null); } }} aria-label="Karakter adı" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-metin outline-none" />
          </label>
          {hata && <p className="mt-1 px-1 text-[11px] text-rose-300">{hata}</p>}
          <div className="mt-1.5 flex gap-1">
            <button onClick={() => setAdDuzen(null)} className="h-8 flex-1 rounded-full bg-white/[0.07] text-[12px] text-metin">Vazgeç</button>
            <button onClick={kaydet} disabled={!!hata} className="h-8 flex-1 rounded-full bg-white text-[12px] font-semibold text-black disabled:opacity-40">Kaydet</button>
          </div>
        </div>
      ) : (
        <button onClick={onSec} aria-current={secili ? "page" : undefined}
          className={cn("flex w-full items-center gap-2.5 rounded-[14px] p-1.5 pr-10 text-left ring-1 ring-inset transition-[background-color,box-shadow]", secili ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.04]")}>
          <span className="relative h-12 w-12 shrink-0">
            <ElementKapak e={k} className="absolute inset-0 overflow-hidden rounded-[12px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover" oynat={false} />
            {(egitiliyor || k.lora?.durum === "hazir") && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black ring-2 ring-[#0e0e10]" title={egitiliyor ? "LoRA eğitiliyor" : "LoRA hazır"}>
                {egitiliyor ? <Loader2 className="h-3 w-3 animate-spin" /> : <GraduationCap className="h-3 w-3" />}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">@{k.ad}</span>{k.sabitli && <Pin className="h-3 w-3 shrink-0 fill-current text-metin-2" />}</span>
            <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11.5px] tabular-nums text-metin-3">
              {k.ornek && <span className="rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-metin-2">Örnek</span>}
              <span>{foto} foto</span><span className="h-0.5 w-0.5 rounded-full bg-current" /><span>{k.kullanim} üretim</span>
            </span>
          </span>
        </button>
      )}
      {adDuzen == null && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <button onClick={() => setMenu((v) => !v)} aria-label={`@${k.ad} seçenekleri`} aria-expanded={menu}
            className={cn("flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90", menu || secili ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
          <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sol" bosluk={6} etiket="Karakter seçenekleri" kaydirmadaKapat className={cn("w-64 overflow-hidden", POP)} z={140}>
            <MenuKart className="rounded-none ring-0" baslik={`@${k.ad}`}>
              <div className="p-1">
                {ogeler.map(([Ik, a, f, tehlike], i) => (
                  <div key={a}>
                    {tehlike && i > 0 && <span className="mx-2 my-1 block h-px bg-white/[0.06]" />}
                    <button role="menuitem" onClick={() => { setMenu(false); f(); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors", tehlike ? "text-rose-300 hover:bg-rose-400/[0.08]" : "text-metin hover:bg-white/[0.06]")}>
                      <Ik className="h-4 w-4 shrink-0" />{a}
                    </button>
                  </div>
                ))}
              </div>
            </MenuKart>
          </Yuzen>
        </div>
      )}
    </motion.div>
  );
}

/* ═════════════ Parçalar ═════════════ */

/** Higgsfield usulü yelpaze: eğik, üst üste binen kareler; karakterin fotoğrafları ortada, sahneler kenarda. */
function Yelpaze({ l, buyuk }: { l: { g: string; foto: boolean }[]; buyuk?: boolean }) {
  const n = l.length;
  const w = buyuk ? 150 : 112, h = buyuk ? 200 : 150, ara = buyuk ? 118 : 66;
  return (
    <div className="relative mx-auto" style={{ height: h + 30 }} aria-hidden>
      {l.map((x, i) => {
        const d = i - (n - 1) / 2;
        return (
          <motion.span key={x.g + i} initial={{ opacity: 0, y: 24, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(d) * 10, rotate: d * 7 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 150, damping: 18 }}
            className="absolute top-0 overflow-hidden rounded-[22px] ring-[3px] ring-white/[0.14]"
            style={{ width: w, height: h, left: `calc(50% + ${d * ara}px - ${w / 2}px)`, zIndex: 10 - Math.abs(Math.round(d)) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.g} alt="" className={cn("h-full w-full object-cover", !x.foto && "brightness-[0.55] saturate-[0.8]")} />
          </motion.span>
        );
      })}
    </div>
  );
}

function ModelLogo({ ad, boyut = 24 }: { ad: string; boyut?: number }) {
  const l = modelLogoUrl(ad);
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full", /bria/i.test(ad) ? "bg-white" : "bg-white/[0.1]")} style={{ width: boyut, height: boyut }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {l ? <img src={l} alt="" aria-hidden style={{ width: boyut * 0.56, height: boyut * 0.56 }} /> : <Sparkles className="text-metin-2" style={{ width: boyut * 0.45, height: boyut * 0.45 }} />}
    </span>
  );
}

/** Sağdan ya da soldan açılan panel (ortada pencere değil); sayfa arkada görünür kalır. */
function YanPanel({ taraf, baslik, alt, ikon: Ik, onKapat, children }: { taraf: "sol" | "sag"; baslik: string; alt: string; ikon: typeof Users; onKapat: () => void; children: React.ReactNode }) {
  useEffect(() => { const f = (k: KeyboardEvent) => { if (k.key === "Escape") onKapat(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onKapat]);
  const x = taraf === "sol" ? -50 : 50;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn("fixed inset-0 z-[120] flex bg-black/55", taraf === "sag" ? "justify-end" : "justify-start")} onClick={onKapat}>
      <motion.aside initial={{ x, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={baslik} className={cn("flex h-full w-full max-w-[440px] flex-col bg-[#121315]", taraf === "sag" ? "border-l" : "border-r", "border-white/[0.08]")}>
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08]"><Ik className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{baslik}</span><span className="block truncate text-[12px] text-metin-2">{alt}</span></span>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">{children}</div>
      </motion.aside>
    </motion.div>
  );
}

/** Tüm karakterler: arama, sıralama, kapaklı kartlar; menüde yerinde yeniden adlandırma. */
function TumKarakterler({ liste, seciliId, onKapat }: { liste: VElement[]; seciliId?: string; onKapat: () => void }) {
  const router = useRouter();
  const [ara, setAra] = useState("");
  const [sira, setSira] = useState<"son" | "yeni" | "az">("son");
  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr").replace(/^@/, "");
    const l = liste.filter((e) => !q || `${e.ad} ${e.aciklama}`.toLocaleLowerCase("tr").includes(q));
    const s = [...l].sort((a, b) => sira === "az" ? a.ad.localeCompare(b.ad, "tr") : sira === "yeni" ? b.olusturma - a.olusturma : (b.sonKullanim ?? b.olusturma) - (a.sonKullanim ?? a.olusturma));
    return [...s.filter((e) => e.sabitli), ...s.filter((e) => !e.sabitli)];
  }, [liste, ara, sira]);
  return (
    <div className="space-y-3">
      <label className="flex h-10 items-center gap-2 rounded-full bg-white/[0.06] px-3.5 outline outline-1 -outline-offset-1 outline-transparent focus-within:outline-white/30">
        <Search className="h-4 w-4 text-metin-2" />
        <input value={ara} onChange={(x) => setAra(x.target.value)} placeholder="Ad ya da tarif ara" aria-label="Karakter ara" autoFocus className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
        {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="text-metin-2 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
      </label>
      <div className="isolate flex rounded-full bg-white/[0.06] p-[3px]">
        {([["son", "Son kullanılan", History], ["yeni", "Yeni", Clock], ["az", "A-Z", ArrowDownAZ]] as const).map(([k, a, Ik]) => (
          <button key={k} onClick={() => setSira(k)} className={cn("relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition-colors", sira === k ? "text-black" : "text-metin-2 hover:text-metin")}>
            {sira === k && <motion.span layoutId="kr-sira" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}<Ik className="h-3.5 w-3.5" />{a}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/panel/karakter/yeni" onClick={onKapat} className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/15 text-center transition hover:border-white/35 hover:bg-white/[0.03]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black"><Plus className="h-5 w-5" /></span>
          <span className="text-[13.5px] font-semibold text-metin">Yeni karakter</span>
          <span className="-mt-1.5 text-[11.5px] text-metin-2">1-{KARAKTER_MAKS} fotoğraf, ücretsiz</span>
        </Link>
        <AnimatePresence initial={false}>
          {gorunen.map((k) => <TumKart key={k.id} k={k} secili={k.id === seciliId} onSec={() => { router.push(`/panel/karakter/${k.id}`); onKapat(); }} />)}
        </AnimatePresence>
      </div>
      {!gorunen.length && <p className="rounded-full bg-white/[0.05] px-4 py-2 text-center text-[12.5px] text-metin-2">“{ara}” ile eşleşen karakter yok</p>}
    </div>
  );
}

/** Karakter menüsü: fotoğrafları düzenle, yeniden adlandır, çoğalt, sabitle, kullan, sil. */
function useKarakterMenu(k: VElement, secili: boolean) {
  const router = useRouter();
  const [adDuzen, setAdDuzen] = useState<string | null>(null);
  const st = useElements.getState;
  const tumAd = useElements((s) => s.elementler).filter((x) => x.id !== k.id).map((x) => x.ad);
  const hata = adDuzen != null ? adHatasi(adDuzen, tumAd) : null;
  const kaydet = () => {
    if (adDuzen == null || hata) return;
    const r = st().guncelle(k.id, { ad: adDuzen });
    if (r.hata) return void toast.error("Ad değiştirilemedi", { description: r.hata });
    toast.success(`@${adDuzen} olarak kaydedildi`, { description: "Eski üretimlerdeki istemler değişmez." });
    setAdDuzen(null);
  };
  const sil = () => { const yedek = k; st().sil(k.id); toast(`@${k.ad} silindi`, { description: "Önceki üretimler kitaplığında kalır.", action: { label: "Geri al", onClick: () => st().geriYukle(yedek) } }); if (secili) router.push("/panel/karakter"); };
  const ogeler: [typeof Pencil, string, () => void, boolean?][] = [
    [Images, "Fotoğrafları düzenle", () => router.push(`/panel/karakter/yeni?id=${k.id}`)],
    [Pencil, "Yeniden adlandır", () => setAdDuzen(k.ad)],
    [Copy, "Çoğalt", () => { if (st().cogalt(k.id)) toast.success("Karakter çoğaltıldı"); }],
    [k.sabitli ? PinOff : Pin, k.sabitli ? "Sabitlemeyi kaldır" : "Sabitle", () => st().guncelle(k.id, { sabitli: !k.sabitli })],
    [Wand2, "Görsel stüdyosunda kullan", () => router.push(`/panel/gorsel?prompt=${encodeURIComponent(`@${k.ad} `)}`)],
    [Trash2, "Sil", sil, true],
  ];
  return { ogeler, adDuzen, setAdDuzen, hata, kaydet };
}

function TumKart({ k, secili, onSec }: { k: VElement; secili: boolean; onSec: () => void }) {
  const [menu, setMenu] = useState(false);
  const { ogeler, adDuzen, setAdDuzen, hata, kaydet } = useKarakterMenu(k, secili);
  const egitiliyor = k.lora?.durum === "sirada" || k.lora?.durum === "egitiliyor";
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="group relative">
      <button onClick={onSec} className={cn("relative block aspect-[4/5] w-full overflow-hidden rounded-[18px] text-left outline outline-2 -outline-offset-2 transition", secili ? "outline-white" : "outline-transparent hover:outline-white/30")}>
        <ElementKapak e={k} className="absolute inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.04]" oynat={false} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 flex gap-1">
          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">{egitiliyor ? <><Loader2 className="h-3 w-3 animate-spin" />Eğitiliyor</> : k.lora?.durum === "hazir" ? <><GraduationCap className="h-3 w-3" />LoRA</> : <><Zap className="h-3 w-3" />Anında</>}</span>
          {k.ornek && <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-amber-200 backdrop-blur">Örnek</span>}
          {k.sabitli && <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"><Pin className="h-3 w-3" /></span>}
        </span>
        <span className="absolute inset-x-2.5 bottom-2.5"><span className="block truncate text-[14.5px] font-semibold text-white">@{k.ad}</span><span className="block truncate text-[11.5px] tabular-nums text-white/65">{k.gorseller.filter(Boolean).length} fotoğraf · {k.kullanim} üretim</span></span>
      </button>
      <div className="absolute right-2 top-2">
        <button onClick={() => setMenu((v) => !v)} aria-label={`@${k.ad} seçenekleri`} aria-expanded={menu} className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 active:scale-90", menu ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
        <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="Karakter seçenekleri" kaydirmadaKapat className={cn("w-60 p-1.5", POP)} z={140}>
          {ogeler.map(([Ik, a, f, tehlike], i) => (
            <div key={a}>
              {tehlike && i > 0 && <span className="mx-2 my-1 block h-px bg-white/[0.06]" />}
              <button role="menuitem" onClick={() => { setMenu(false); f(); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors", tehlike ? "text-rose-300 hover:bg-rose-400/[0.08]" : "text-metin hover:bg-white/[0.06]")}>
                <Ik className="h-4 w-4 shrink-0" />{a}
              </button>
            </div>
          ))}
        </Yuzen>
      </div>
      <AnimatePresence>
        {adDuzen != null && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className={cn("absolute inset-x-1.5 bottom-1.5 z-10 rounded-[14px] p-2", "bg-[#1b1c1f] ring-1 ring-white/[0.12]")}>
            <label className={cn("flex h-9 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 outline outline-1 -outline-offset-1", hata ? "outline-rose-400/60" : "outline-transparent focus-within:outline-white/40")}>
              <AtSign className="h-3.5 w-3.5 text-metin-2" />
              <input autoFocus value={adDuzen} onChange={(x) => setAdDuzen(adTemizle(x.target.value))} onKeyDown={(x) => { if (x.key === "Enter") kaydet(); if (x.key === "Escape") { x.stopPropagation(); setAdDuzen(null); } }} aria-label="Karakter adı" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-metin outline-none" />
            </label>
            {hata && <p className="mt-1 px-1 text-[11px] text-rose-300">{hata}</p>}
            <div className="mt-1.5 flex gap-1">
              <button onClick={() => setAdDuzen(null)} className="h-8 flex-1 rounded-full bg-white/[0.07] text-[12px] text-metin">Vazgeç</button>
              <button onClick={kaydet} disabled={!!hata} className="h-8 flex-1 rounded-full bg-white text-[12px] font-semibold text-black disabled:opacity-40">Kaydet</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Hiç karakter yokken: örnek karakter yelpazesi, başlık, iki eylem, örnek karakter kartları. */
function Baslangic({ zemin, masaustu }: { zemin: string; masaustu: boolean }) {
  const router = useRouter();
  const ornekEkle = (o: (typeof ORNEK_KARAKTERLER)[number]) => {
    const st = useElements.getState();
    const var_ = st.elementler.find((x) => x.ornek && x.gorseller[0] === o.gorsel);
    if (var_) return router.push(`/panel/karakter/${var_.id}`);
    const r = st.ekle({ ad: bostakiAd(o.ad, st.elementler.map((x) => x.ad)), tur: "karakter", aciklama: o.aciklama, gorseller: o.gorseller ?? [o.gorsel], ornek: true, tohum: o.ad });
    if (r.id) { toast.success(`@${o.ad} örnek karakteri eklendi`, { description: "Kendi fotoğraflarınla da bir tane oluşturabilirsin." }); router.push(`/panel/karakter/${r.id}`); }
    else if (r.hata) toast.error("Örnek karakter eklenemedi", { description: r.hata });
  };
  return (
    <div data-kendi-kisayol className={cn("min-h-[calc(100dvh-var(--ust-nav))] overflow-x-clip overflow-y-auto pb-16", zemin)}>
      <div className="mx-auto max-w-[1100px] px-5 pt-10 text-center">
        <Yelpaze l={ORNEK_KARAKTERLER.slice(0, 5).map((o) => ({ g: o.gorsel, foto: true }))} buyuk={masaustu} />
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn("font-semibold tracking-[-0.035em] text-metin", masaustu ? "mt-9 text-[48px] leading-[1.02]" : "mt-6 text-[32px] leading-[1.05]")}>Kendi karakterini oluştur</motion.h1>
        <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-metin-2">1-{KARAKTER_MAKS} net fotoğraf ve bir ad yeter. İstemde @Ad yazdığın her görselde aynı kişi üretilir; eğitim beklemen gerekmez.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/panel/karakter/yeni" className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition active:scale-95"><Plus className="h-4 w-4" />Karakter oluştur</Link>
          <button onClick={() => ornekEkle(ORNEK_KARAKTERLER[0])} className="flex h-12 items-center gap-2 rounded-full bg-white/[0.08] px-6 text-[15px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Sparkles className="h-4 w-4" />Örnekle dene</button>
        </div>
        <p className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-metin-2"><Info className="h-3.5 w-3.5" />Kaydetmek ücretsiz; kredi yalnız üretimde düşer</p>
      </div>
      <section className={cn(KART, "mx-auto mt-10 max-w-[1100px] text-left")}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3"><Users className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">Örnek karakterler</span><span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[11.5px] text-amber-100 ring-1 ring-inset ring-amber-300/25">Örnek</span><span className="ml-auto text-[12px] text-metin-2 max-sm:hidden">Kitaplığına eklenir, hemen üretebilirsin</span></div>
        <div className={cn("grid gap-2 p-2.5", masaustu ? "grid-cols-6" : "grid-cols-2")}>
          {ORNEK_KARAKTERLER.map((o, i) => (
            <motion.button key={o.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} onClick={() => ornekEkle(o)} className="group text-left">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[16px] outline outline-1 -outline-offset-1 outline-white/[0.08] transition group-hover:outline-white/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute inset-x-2.5 bottom-2.5"><span className="block text-[14px] font-semibold text-white">@{o.ad}</span><span className="block text-[11px] text-white/65">{(o.gorseller ?? [o.gorsel]).length} fotoğraf</span></span>
                <span className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100"><Plus className="h-3 w-3" />Dene</span>
              </span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
