"use client";

/**
 * Kitaplık — tüm üretimlerin tek yeri. Görünüm stüdyo galerileriyle BİREBİR aynıdır
 * (2026-10-27 kullanıcı kararı): yapışkan akış çubuğu (alt çizgili tür sekmeleri, arama,
 * Favoriler, Model, Proje, Demoları gizle, yoğunluk), kenardan kenara 4px boşluklu galeri,
 * stüdyo kartları ve araç rayı. Bir üretime tıklayınca stüdyosunun görüntüleyicisi açılır.
 *
 * Kaynak: useProjeler.uretimler + useProjeler.cop. Kapsam: tumu / yukleme / arac:<id> / proje:<id> /
 * akilli:<id> / cop; tür, favori ve süzgeçler kapsamın üstüne uygulanır.
 * Derin bağlantılar: ?u=<id> görüntüleyiciyi açar, ?proje=<id> projeyi seçer.
 */

import { Yuzen } from "@/components/ui/Yuzen";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import {
  ArrowDownAZ, ArrowRight, CalendarClock, Check, Coins, History, ScanSearch, SlidersHorizontal, ChevronDown, Folder, FolderPlus, Hash, Heart, Keyboard, LayoutGrid, List, Loader2, MoreHorizontal, RotateCcw, Search, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import { useProjeler, COP_SURE_GUN, type Uretim } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { useKitaplik, BOS_SUZGEC, type Suzgec, type Siralama } from "@/store/useKitaplik";
import { useReferansKopru } from "@/store/useReferansKopru";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { uretimIndir } from "@/lib/gercekEylem";
import { saltUrl } from "@/lib/utils";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { VarlikSatiri, type KartOlaylari } from "@/components/kitaplik/VarlikKarti";
import { GaleriKart, type GaleriOlaylari } from "@/components/kitaplik/GaleriKart";
import { UretimGoruntuleyici, ucBoyutAdresi } from "@/components/studyo/UretimGoruntuleyici";
import { AdDegistir, BaglamMenusu, BirakKatmani, Karsilastir, KisayolSayfasi, MenuKart, MiniOynatici, SecimCubugu } from "@/components/kitaplik/Katmanlar";
import { copeTasi, etiketEkle, favoriYap, projeyeTasi, yayinla } from "@/components/kitaplik/eylemler";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import {
  ARACLAR, TURLER, YUKLEME_ARAC, aracFiltresi, gorselKucult, kapakUrl, oranBul, sadeMetin, tarihGrubu, turBul, uretimTuru, type Tur,
} from "@/components/kitaplik/yardimci";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { oranSayi } from "@/components/panel/UretimKarti";
import { oranDegeri } from "@/components/studyo/video/veri";
import { OranSekli } from "@/components/arac/kit";
import { Hap, KART } from "@/components/kitaplik/KitaplikKarti";
import { KitaplikRayi, URETIM_SURUKLE } from "@/components/kitaplik/KitaplikRayi";
import { KitaplikBaslik } from "@/components/kitaplik/KitaplikBaslik";
import { KitaplikIskelet } from "@/components/kitaplik/KitaplikIskelet";
import { gorseleGorePuanla } from "@/components/kitaplik/gorselBenzer";
import { useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { cn } from "@/lib/utils";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi as gorunumSutun } from "@/lib/galeri/gorunum";
import { FavoriKutusu, SiralamaMenusu, TurMenusu, useKlasorIdleri, type OzelSira } from "@/components/galeri/SuzgecCubugu";
import { KlasorMenusu, YeniKlasorDugmesi } from "@/components/galeri/Klasorler";
import { TarihAraligi, aralikYazisi, aralikta, type Aralik } from "@/components/galeri/TarihAraligi";
import { useKoleksiyon } from "@/store/useKoleksiyon";

const GUN = 86_400_000;
/** Stüdyo galerisiyle aynı 3 yoğunluk adımı (büyük · orta · sık). */
const YOGUNLUK: [number, string, number][] = [[85, "Büyük kartlar", 2], [45, "Orta kartlar", 3], [10, "Sık ızgara", 4]];
/** Hızlı kalite etiketleri: seçiliyken 1, 2, 3 tuşuyla (fotoğrafçı ayıklama akışı). */
const KALITE: [string, string][] = [["1", "En iyi"], ["2", "Düzeltilecek"], ["3", "Onaylandı"]];
const ZAMANLAR: [Suzgec["zaman"], string][] = [["tumu", "Her zaman"], ["bugun", "Bugün"], ["hafta", "Bu hafta"], ["ay", "Bu ay"], ["yil", "Bu yıl"]];
const ORANLAR = ["16:9", "9:16", "1:1", "4:5", "3:4", "4:3", "21:9"];
const kelimeler = (s: string) => new Set(sadeMetin(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2));
const suruyorMu = (u: Uretim) => u.durum === "isleniyor" || u.durum === "kuyrukta";
const hamIstem = (u: Uretim) => (u.meta?.hamIstem as string | undefined) || u.prompt || u.baslik;

export default function KitaplikSayfasi() {
  return <Suspense fallback={<Yukleniyor />}><Kitaplik /></Suspense>;
}

function Kitaplik() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const uretimler = useProjeler((s) => s.uretimler);
  const cop = useProjeler((s) => s.cop);
  const projeler = useProje((s) => s.projeler);
  const { gorunum, yogunluk, siralama, akilli, setGorunum, setYogunluk, setSiralama, akilliEkle, akilliSil } = useKitaplik();
  /* Eski sürüm kart genişliğini px olarak saklıyordu (140–340); onu stüdyonun varsayılanı "orta"ya çevir. */
  const boyut = yogunluk > 100 ? 45 : YOGUNLUK.reduce((a, b) => (Math.abs(b[0] - yogunluk) < Math.abs(a[0] - yogunluk) ? b : a))[0];

  const [kapsam, setKapsamHam] = useState<string>(() => (sp.get("proje") ? `proje:${sp.get("proje")}` : "tumu"));
  const [tur, setTur] = useState<Tur | null>(null);
  const [favori, setFavori] = useState(false);
  const [demoGizle, setDemoGizle] = useState(false);
  const [suzgec, setSuzgec] = useState<Suzgec>(BOS_SUZGEC);
  /* Süzgeç çubuğu: tarih aralığı (iki aylık takvim) ve gerçek klasörler (useKoleksiyon). */
  const [tarih, setTarih] = useState<Aralik>({});
  const [klasor, setKlasor] = useState<string | null>(null);
  const klasorIdleri = useKlasorIdleri(klasor);
  const klasorAdi = useKoleksiyon((s) => s.koleksiyonlar.find((k) => k.id === klasor)?.ad);
  const [gorunumAyar] = useGorunum("kitaplik");
  const [secili, setSecili] = useState<string[]>([]);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ u: Uretim; x: number; y: number } | null>(null);
  const [adlandir, setAdlandir] = useState<Uretim | null>(null);
  const [element, setElement] = useState<{ gorsel: string; aciklama: string } | null>(null);
  const [karsilastir, setKarsilastir] = useState(false);
  const [kisayol, setKisayol] = useState(false);
  const [birak, setBirak] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(0);
  const aramaRef = useRef<HTMLInputElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sonSecilen = useRef<string | null>(null);
  const rayEn = useKenarGenisligi("kitaplik-ray", 264, 220, 380);
  /* Görselle ara: sorgu görseli + üretimlerin benzerlik puanları (cihazda hesaplanır). */
  const [gorselAra, setGorselAra] = useState<{ url: string; skor: Map<string, number>; hesap: boolean; esik: number } | null>(null);
  const gorselRef = useRef<HTMLInputElement>(null);

  /* ── Kapsam ↔ adres ── */
  const setKapsam = useCallback((k: string) => {
    setKapsamHam(k); setSecili([]);
    const p = new URLSearchParams(Array.from(sp.entries()));
    if (k.startsWith("proje:")) p.set("proje", k.slice(6)); else p.delete("proje");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sp, router, pathname]);

  // Bildirimden derin bağlantı: ?u=<id> → görüntüleyici
  const derinId = sp.get("u");
  useEffect(() => {
    if (!derinId || !hazir) return;
    const u = useProjeler.getState().uretimler.find((x) => x.id === derinId);
    if (u) { if (uretimTuru(u) === "3d") router.push(ucBoyutAdresi(u)); else setAcikId(derinId); }
    const p = new URLSearchParams(Array.from(sp.entries())); p.delete("u");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derinId, hazir]);

  /* ── Proje üyeliği ── */
  const projeIdSet = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const p of projeler) m.set(p.id, new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]));
    return m;
  }, [projeler]);
  const projedeMi = useCallback((u: Uretim, id: string) => u.projeId === id || !!projeIdSet.get(id)?.has(u.id), [projeIdSet]);

  /* ── Süzme ── */
  /** Benzerleri: istemdeki kelimelerin örtüşmesi + aynı tür ve model (cihazda, anında). */
  const benzerKaynak = kapsam.startsWith("benzer:") ? uretimler.find((u) => u.id === kapsam.slice(7)) : undefined;
  const benzerSkor = useMemo(() => {
    const m = new Map<string, number>();
    if (!benzerKaynak) return m;
    const k = kelimeler(hamIstem(benzerKaynak)), t = uretimTuru(benzerKaynak);
    for (const u of uretimler) {
      if (u.id === benzerKaynak.id) { m.set(u.id, 2); continue; }
      const w = kelimeler(hamIstem(u)); let ortak = 0; w.forEach((x) => { if (k.has(x)) ortak++; });
      const skor = (ortak / Math.max(1, Math.min(k.size, w.size))) * 0.8 + (uretimTuru(u) === t ? 0.12 : 0) + (u.model === benzerKaynak.model ? 0.08 : 0);
      if (skor >= 0.22) m.set(u.id, skor);
    }
    return m;
  }, [benzerKaynak, uretimler]);
  const akilliKlasor = kapsam.startsWith("akilli:") ? akilli.find((a) => a.id === kapsam.slice(7)) : undefined;
  const copModu = kapsam === "cop";
  const aktifProjeId = kapsam.startsWith("proje:") ? kapsam.slice(6) : undefined;

  const kapsamUyar = useCallback((u: Uretim, k: string) => {
    if (k === "tumu" || k === "cop") return true;
    if (k === "favori") return !!u.favori;
    if (k === "yukleme") return aracFiltresi(u) === "yukleme";
    if (k.startsWith("tur:")) return uretimTuru(u) === k.slice(4);
    if (k.startsWith("arac:")) return aracFiltresi(u) === k.slice(5);
    if (k.startsWith("proje:")) return projedeMi(u, k.slice(6));
    if (k.startsWith("benzer:")) return benzerSkor.has(u.id);
    if (k === "gorselara") return !!gorselAra && !gorselAra.hesap && (gorselAra.skor.get(u.id) ?? 0) >= gorselAra.esik;
    return true;
  }, [projedeMi, benzerSkor, gorselAra]);

  const suzgecUyar = useCallback((u: Uretim, s: Suzgec, simdi: number) => {
    if (s.q.trim()) {
      const q = sadeMetin(s.q.trim());
      if (!sadeMetin(`${u.baslik} ${u.prompt} ${u.model} ${u.arac ?? ""} ${(u.etiketler ?? []).join(" ")}`).includes(q)) return false;
    }
    if (s.modeller.length && !s.modeller.includes(u.model)) return false;
    if (s.oranlar.length && !s.oranlar.includes(u.meta?.oran ?? "")) return false;
    if (s.etiketler.length && !s.etiketler.every((e) => (u.etiketler ?? []).includes(e))) return false;
    if (s.durum !== "tumu" && u.durum !== s.durum) return false;
    const esik = { tumu: 0, bugun: GUN, hafta: 7 * GUN, ay: 30 * GUN, yil: 365 * GUN }[s.zaman];
    if (esik && simdi - u.olusturma > esik) return false;
    return true;
  }, []);

  /* Kapsam + süzgeç (tür hariç) — sekme sayıları bundan çıkar. */
  const kapsamdakiler = useMemo(() => {
    const simdi = Date.now();
    const kaynak: Uretim[] = copModu ? cop : uretimler;
    return kaynak.filter((u) =>
      (akilliKlasor ? kapsamUyar(u, akilliKlasor.kapsam) && suzgecUyar(u, akilliKlasor.suzgec, simdi) : kapsamUyar(u, kapsam))
      && suzgecUyar(u, suzgec, simdi) && (!favori || u.favori) && (!demoGizle || u.gercek !== false)
      && (!tarih.bas || aralikta(u.olusturma, tarih)) && (!klasorIdleri || klasorIdleri.has(u.id)));
  }, [uretimler, cop, copModu, kapsam, akilliKlasor, suzgec, favori, demoGizle, kapsamUyar, suzgecUyar, tarih, klasorIdleri]);

  /* Üst kart yalnız kapsamı yansıtır; arama ve süzgeçler onu boşaltmaz. */
  const kapsamListesi = useMemo(() => {
    const simdi = Date.now();
    return (copModu ? cop : uretimler).filter((u) => (akilliKlasor ? kapsamUyar(u, akilliKlasor.kapsam) && suzgecUyar(u, akilliKlasor.suzgec, simdi) : kapsamUyar(u, kapsam)));
  }, [uretimler, cop, copModu, kapsam, akilliKlasor, kapsamUyar, suzgecUyar]);

  const turSayilari = useMemo(() => {
    const t = { gorsel: 0, video: 0, ses: 0, muzik: 0, "3d": 0 } as Record<Tur, number>;
    for (const u of kapsamdakiler) t[uretimTuru(u)]++;
    return t;
  }, [kapsamdakiler]);

  const { suranlar, liste } = useMemo(() => {
    const l = kapsamdakiler.filter((u) => !tur || uretimTuru(u) === tur);
    const sirala = (a: Uretim, b: Uretim) =>
      kapsam === "gorselara" ? (gorselAra?.skor.get(b.id) ?? 0) - (gorselAra?.skor.get(a.id) ?? 0) :
      benzerKaynak ? (benzerSkor.get(b.id) ?? 0) - (benzerSkor.get(a.id) ?? 0) : siralama === "eski" ? a.olusturma - b.olusturma : siralama === "ad" ? a.baslik.localeCompare(b.baslik, "tr") : siralama === "kredi" ? (b.kredi ?? 0) - (a.kredi ?? 0) : siralama === "tur" ? uretimTuru(a).localeCompare(uretimTuru(b)) || b.olusturma - a.olusturma : siralama === "model" ? a.model.localeCompare(b.model, "tr") || b.olusturma - a.olusturma : b.olusturma - a.olusturma;
    return { suranlar: copModu ? [] : l.filter(suruyorMu), liste: l.filter((u) => !suruyorMu(u)).sort(sirala) };
  }, [kapsamdakiler, tur, siralama, copModu, benzerKaynak, benzerSkor, kapsam, gorselAra]);

  const gruplar = useMemo(() => {
    if (!hazir) return [];
    if (siralama === "ad" || siralama === "kredi" || siralama === "tur" || siralama === "model" || copModu || benzerKaynak || kapsam === "gorselara") return [{ anahtar: "hepsi", etiket: "", ogeler: liste }];
    const simdi = Date.now();
    const m: { anahtar: string; etiket: string; ogeler: Uretim[] }[] = [];
    for (const u of liste) {
      const g = tarihGrubu(u.olusturma, simdi);
      const son = m[m.length - 1];
      if (son?.anahtar === g.anahtar) son.ogeler.push(u); else m.push({ ...g, ogeler: [u] });
    }
    return m;
  }, [liste, hazir, siralama, copModu, benzerKaynak, kapsam]);

  /* ── Seçim ── */
  const secimModu = secili.length > 0;
  const seciliSet = useMemo(() => new Set(secili), [secili]);
  const secilenler = useMemo(() => liste.filter((u) => seciliSet.has(u.id)), [liste, seciliSet]);
  const sec = useCallback((u: Uretim, e: React.MouseEvent) => {
    if (e.shiftKey && sonSecilen.current) {
      const a = liste.findIndex((x) => x.id === sonSecilen.current), b = liste.findIndex((x) => x.id === u.id);
      if (a >= 0 && b >= 0) {
        const [i, j] = a < b ? [a, b] : [b, a];
        setSecili((s) => Array.from(new Set([...s, ...liste.slice(i, j + 1).map((x) => x.id)])));
        return;
      }
    }
    setSecili((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]));
    sonSecilen.current = u.id;
  }, [liste]);

  /* ── Ses oynatıcı (tek, kalıcı) ── */
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const [oynatma, setOynatma] = useState({ id: null as string | null, oynuyor: false, ilerleme: 0, sure: 0 });
  useEffect(() => {
    const a = new Audio(); sesRef.current = a;
    const g = () => setOynatma((o) => ({ ...o, ilerleme: a.duration ? a.currentTime / a.duration : 0, sure: a.duration || 0 }));
    a.addEventListener("timeupdate", g); a.addEventListener("loadedmetadata", g);
    a.addEventListener("ended", () => setOynatma((o) => ({ ...o, oynuyor: false, ilerleme: 1 })));
    return () => { a.pause(); a.src = ""; };
  }, []);
  const cal = useCallback((u: Uretim) => {
    const a = sesRef.current;
    if (!a) return;
    if (!u.sesUrl) { toast("Bu üretimin ses dosyası yok"); return; }
    if (oynatma.id === u.id) {
      if (a.paused) { a.play().catch(() => {}); setOynatma((o) => ({ ...o, oynuyor: true })); } else { a.pause(); setOynatma((o) => ({ ...o, oynuyor: false })); }
      return;
    }
    a.src = u.sesUrl; a.play().catch(() => toast.error("Ses oynatılamadı", { description: "Ses dosyasına şu an ulaşılamıyor. Biraz sonra yeniden dene." }));
    setOynatma({ id: u.id, oynuyor: true, ilerleme: 0, sure: 0 });
  }, [oynatma.id]);
  const sar = useCallback((oran: number) => { const a = sesRef.current; if (a?.duration) a.currentTime = Math.max(0, Math.min(1, oran)) * a.duration; }, []);
  const calanUretim = oynatma.id ? uretimler.find((u) => u.id === oynatma.id) : undefined;

  /* ── Kart olayları (stüdyo kartlarıyla aynı eylemler) ── */
  const ac = useCallback((u: Uretim) => {
    if (copModu) { setSecili([u.id]); sonSecilen.current = u.id; return; }
    if (uretimTuru(u) === "3d") { router.push(ucBoyutAdresi(u)); return; }
    setAcikId(u.id);
  }, [copModu, router]);
  const referansla = useCallback((u: Uretim, hedef: "gorsel" | "video") => {
    const url = kapakUrl(u);
    if (!url) return;
    useReferansKopru.getState().gonder({ url, tur: hedef, baslik: u.baslik, prompt: u.prompt });
    router.push(hedef === "video" ? "/panel/video" : "/panel/gorsel");
  }, [router]);
  const olaylar: GaleriOlaylari = useMemo(() => ({
    onAc: ac,
    onSec: sec,
    onBegen: (u) => { favoriYap([u.id], !u.favori); toast.success(u.favori ? "Favorilerden çıkarıldı" : "Favorilere eklendi"); },
    onIndir: (u) => uretimIndir(u),
    onMenu: (u, x, y) => { if (!copModu) setMenu({ u, x, y }); },
    onCal: cal,
    onStudyo: (u) => router.push(`${turBul(uretimTuru(u)).studyo}?istem=${encodeURIComponent(hamIstem(u))}`),
    onReferans: (u) => referansla(u, "gorsel"),
    onAnimate: (u) => referansla(u, "video"),
    on3d: (u) => { const url = kapakUrl(u); if (url) { useReferansKopru.getState().gonder({ url, tur: "3d", baslik: u.baslik, prompt: u.prompt }); router.push("/panel/3d"); } },
    onElement: (u) => { const url = kapakUrl(u); if (url) setElement({ gorsel: saltUrl(url) ?? url, aciklama: hamIstem(u) }); },
    onYayinla: (u) => yayinla([u.id], true),
    onSil: (u) => { if (copModu) { useProjeler.getState().kaliciSil([u.id]); toast.success("Üretim kalıcı olarak silindi", { description: u.baslik }); } else copeTasi([u.id]); },
    projeler: projeler.filter((p) => !p.klasor).map((p) => ({ id: p.id, ad: p.ad, adet: uretimler.filter((u) => projedeMi(u, p.id)).length })),
    onProjeyeEkle: (u, id) => projeyeTasi([u.id], id),
    onYeniProje: (u) => { const id = useProje.getState().projeOlustur("Yeni proje", "Genel", { kaynakStudyo: "Kitaplık" }); projeyeTasi([u.id], id); },
  }), [ac, sec, copModu, cal, router, referansla, projeler, uretimler, projedeMi]);
  /* Liste görünümü satırları eski olay şeklini bekler. */
  const satirOlaylari: KartOlaylari = useMemo(() => ({
    onTikla: (u, e) => (secimModu || e.shiftKey || e.metaKey || e.ctrlKey ? sec(u, e) : ac(u)),
    onSec: sec, onFavori: olaylar.onBegen, onIndir: olaylar.onIndir, onMenu: olaylar.onMenu, onCal: cal, onTekrar: olaylar.onStudyo,
  }), [secimModu, sec, ac, olaylar, cal]);

  /* ── Kutu seçimi (sürükle) ── */
  const alanRef = useRef<HTMLDivElement>(null);
  const [kutu, setKutu] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const kutuTaban = useRef<string[]>([]);
  const kutuBasla = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    const h = e.target as HTMLElement;
    if (h.closest("[data-varlik],button,input,select,a,textarea")) return;
    kutuTaban.current = e.ctrlKey || e.metaKey || e.shiftKey ? secili : [];
    setKutu({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
  };
  useEffect(() => {
    if (!kutu) return;
    const hareket = (e: PointerEvent) => {
      setKutu((k) => (k ? { ...k, x1: e.clientX, y1: e.clientY } : k));
      const sol = Math.min(kutu.x0, e.clientX), sag = Math.max(kutu.x0, e.clientX), ust = Math.min(kutu.y0, e.clientY), alt = Math.max(kutu.y0, e.clientY);
      if (sag - sol < 6 && alt - ust < 6) return;
      const vurulan: string[] = [];
      alanRef.current?.querySelectorAll<HTMLElement>("[data-varlik]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > sol && r.left < sag && r.bottom > ust && r.top < alt) vurulan.push(el.dataset.varlik!);
      });
      setSecili(Array.from(new Set([...kutuTaban.current, ...vurulan])));
    };
    const bitir = () => setKutu(null);
    window.addEventListener("pointermove", hareket);
    window.addEventListener("pointerup", bitir, { once: true });
    return () => { window.removeEventListener("pointermove", hareket); window.removeEventListener("pointerup", bitir); };
  }, [kutu]);

  /* ── Klavye ── */
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (acikId || karsilastir || kisayol || element || adlandir || menu) return;
      const h = e.target as HTMLElement;
      const yaziyor = h.tagName === "INPUT" || h.tagName === "TEXTAREA" || h.tagName === "SELECT" || h.isContentEditable;
      let islendi = true;
      if (e.key === "Escape") { if (yaziyor) h.blur(); else if (secili.length) setSecili([]); else islendi = false; }
      else if (yaziyor) islendi = false;
      else if (e.key === "/") aramaRef.current?.focus();
      else if (e.key === "?") setKisayol(true);
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") setSecili(liste.map((u) => u.id));
      else if (e.key === "Delete" && secili.length && !copModu) { copeTasi(secili); setSecili([]); }
      else if (e.key === "f" && secili.length && !e.ctrlKey) favoriYap(secili, !secilenler.every((u) => u.favori));
      else if (secili.length && !e.ctrlKey && !e.metaKey && KALITE.some(([k]) => k === e.key)) { const ad = KALITE.find(([k]) => k === e.key)![1]; etiketEkle(secili, ad); }
      else islendi = false;
      if (islendi) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, [acikId, karsilastir, kisayol, element, adlandir, menu, secili, liste, secilenler, copModu]);

  /* ── Yükleme ── */
  const yukle = useCallback(async (dosyalar: File[]) => {
    const medya = dosyalar.filter((f) => /^(video\/(mp4|webm|quicktime)|audio\/(mpeg|mp3|wav|x-wav|ogg|webm|mp4))$/.test(f.type)).slice(0, 10);
    const gorseller = dosyalar.filter((f) => /^image\/(png|jpe?g|webp|gif|avif)$/.test(f.type)).slice(0, 20);
    if (!gorseller.length && !medya.length) { mesaj.desteklenmeyenDosya("görsel (JPG, PNG, WebP, GIF, AVIF), video (MP4, WebM, MOV) ya da ses (MP3, WAV, OGG)"); return; }
    const atlanan = dosyalar.length - gorseller.length - medya.length;
    if (atlanan > 0) toast.warning(`${atlanan} dosya atlandı`, { description: "Desteklenmeyen tür ya da sınırın üstünde: en çok 20 görsel ve 10 video ya da ses." });
    setYukleniyor(gorseller.length + medya.length);
    let tamam = 0;
    for (const f of medya) {
      try {
        if (f.size > 300 * 1024 * 1024) throw new Error("300 MB'tan büyük");
        const r = (await fetch("/api/montaj/yukle", { method: "POST", headers: { "Content-Type": f.type }, body: f }).then((x) => x.json())) as { ok: boolean; url?: string; hata?: string };
        if (!r.ok || !r.url) throw new Error(r.hata ?? "Yüklenemedi");
        const ad = f.name.replace(/\.[^.]+$/, "").slice(0, 60), video = f.type.startsWith("video/");
        let poster: string | undefined;
        if (video) try { poster = await kareYakala(r.url, 0.2); } catch { /* kapaksız */ }
        const id = useProjeler.getState().ekle({
          baslik: ad, tur: video ? "video" : "ses", model: YUKLEME_ARAC, prompt: ad, durum: "tamam", ilerleme: 100, kredi: 0, arac: YUKLEME_ARAC, gercek: true, projeId: aktifProjeId,
          ...(video ? { videoUrl: r.url, gorselUrl: poster } : { sesUrl: r.url }), meta: { boyutKb: Math.round(f.size / 1024) },
        });
        if (aktifProjeId) useProje.getState().uretimBagla(aktifProjeId, id);
        tamam++;
      } catch (e) {
        toast.error(`${f.name} yüklenemedi`, { description: `${e instanceof Error ? e.message : "Dosya okunamadı"}. Başka bir dosya dene.` });
      }
      setYukleniyor((n) => n - 1);
    }
    for (const f of gorseller) {
      try {
        const { url, en, boy } = await gorselKucult(f);
        const ad = f.name.replace(/\.[^.]+$/, "").slice(0, 60);
        const id = useProjeler.getState().ekle({
          baslik: ad, tur: "gorsel", model: YUKLEME_ARAC, prompt: ad, durum: "tamam", ilerleme: 100, gorselUrl: url, kredi: 0,
          arac: YUKLEME_ARAC, gercek: true, projeId: aktifProjeId, meta: { oran: oranBul(en, boy), cozunurluk: `${en}×${boy}`, boyutKb: Math.round(url.length / 1.37 / 1024) },
        });
        if (aktifProjeId) useProje.getState().uretimBagla(aktifProjeId, id);
        tamam++;
      } catch {
        toast.error(`${f.name} yüklenemedi`, { description: "Dosya okunamadı ya da cihaz depolaması dolu. Başka bir dosya dene ya da yer aç." });
      }
      setYukleniyor((n) => n - 1);
    }
    if (tamam) toast.success(`${tamam} dosya kitaplığa eklendi`, { description: aktifProjeId ? "Açık projeye de eklendi." : "Stüdyolarda referans olarak kullanılabilir." });
  }, [aktifProjeId]);

  useEffect(() => {
    let sayac = 0;
    const dosyaVar = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const gir = (e: DragEvent) => { if (!dosyaVar(e)) return; e.preventDefault(); sayac++; setBirak(true); };
    const ust = (e: DragEvent) => { if (dosyaVar(e)) e.preventDefault(); };
    const cik = (e: DragEvent) => { if (!dosyaVar(e)) return; sayac = Math.max(0, sayac - 1); if (!sayac) setBirak(false); };
    const birakti = (e: DragEvent) => { if (!dosyaVar(e)) return; e.preventDefault(); sayac = 0; setBirak(false); yukle(Array.from(e.dataTransfer?.files ?? [])); };
    window.addEventListener("dragenter", gir); window.addEventListener("dragover", ust); window.addEventListener("dragleave", cik); window.addEventListener("drop", birakti);
    return () => { window.removeEventListener("dragenter", gir); window.removeEventListener("dragover", ust); window.removeEventListener("dragleave", cik); window.removeEventListener("drop", birakti); };
  }, [yukle]);

  /* ── Depolama (gerçek ölçüm) ── */
  const depolamaKb = useMemo(() => {
    if (!hazir) return 0;
    let n = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; n += k.length + (localStorage.getItem(k)?.length ?? 0); } } catch { /* erişim yok */ }
    return Math.round((n * 2) / 1024);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hazir, uretimler, cop]);

  /* ── Galeri sütunları: stüdyodakiyle aynı formül, alan genişliğine göre ── */
  const [en, setEn] = useState(1400);
  useLayoutEffect(() => {
    const el = alanRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setEn(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hazir]);
  /* Görünüm ayarı (yerleşim, boyut) sayfa başına kalıcı; eski yoğunluk değeri yalnız ilk açılışta yön verir. */
  void boyut;
  const sutunSayisi = gorunumSutun(en, gorunumAyar);

  const modeller = useMemo(() => Array.from(new Set(uretimler.map((u) => u.model))).sort((a, b) => a.localeCompare(b, "tr")), [uretimler]);
  const etiketler = useMemo(() => Array.from(new Set(uretimler.flatMap((u) => u.etiketler ?? []))).sort(), [uretimler]);
  const projeSecenek = useMemo(() => projeler.filter((p) => !p.klasor).map((p) => {
    let n = 0, kapak: string | undefined;
    for (const u of uretimler) if (projedeMi(u, p.id)) { n++; kapak ??= kapakUrl(u); }
    return { id: p.id, ad: p.ad, renk: p.renk, n, kapak };
  }).sort((a, b) => b.n - a.n), [projeler, uretimler, projedeMi]);
  const kaynakSecenek = useMemo(() => {
    const say: Record<string, number> = {};
    for (const u of uretimler) { const a = aracFiltresi(u); if (a) say[a] = (say[a] ?? 0) + 1; }
    return [{ id: "yukleme", ad: "Yüklemeler", ikon: Upload, n: say.yukleme ?? 0 }, ...ARACLAR.map((a) => ({ id: `arac:${a.id}`, ad: a.ad, ikon: a.ikon, n: say[a.id] ?? 0 }))].filter((k) => k.n > 0 || k.id === "yukleme");
  }, [uretimler]);
  const kapsamAdi = kapsam === "cop" ? "Çöp kutusu" : kapsam === "yukleme" ? "Yüklemeler"
    : kapsam.startsWith("arac:") ? ARACLAR.find((a) => a.id === kapsam.slice(5))?.ad
    : aktifProjeId ? projeler.find((p) => p.id === aktifProjeId)?.ad
    : benzerKaynak ? `Benzerleri: ${benzerKaynak.baslik || "üretim"}`
    : akilliKlasor?.ad;
  /* ── Sol ray ── */
  const rayAktif = copModu ? "cop" : kapsam === "tumu" ? (favori ? "favori" : suzgec.zaman === "hafta" ? "son7" : "tumu") : kapsam;
  const raySec = (id: string) => {
    setSecili([]); setTur(null);
    if (id === "favori") { setKapsam("tumu"); setFavori(true); setSuzgec((x) => ({ ...x, zaman: "tumu" })); }
    else if (id === "son7") { setKapsam("tumu"); setFavori(false); setSuzgec((x) => ({ ...x, zaman: "hafta" })); }
    else { setKapsam(id); setFavori(false); setSuzgec((x) => ({ ...x, zaman: "tumu" })); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const raySayilari = useMemo(() => {
    const simdi = Date.now();
    return { tumu: uretimler.length, favori: uretimler.filter((u) => u.favori).length, son7: uretimler.filter((u) => simdi - u.olusturma <= 7 * GUN).length, cop: cop.length };
  }, [uretimler, cop]);
  const akilliSayilari = useMemo(() => {
    const simdi = Date.now();
    return akilli.map((a) => ({ id: a.id, ad: a.ad, n: uretimler.filter((u) => kapsamUyar(u, a.kapsam) && suzgecUyar(u, a.suzgec, simdi)).length }));
  }, [akilli, uretimler, kapsamUyar, suzgecUyar]);
  const yeniProje = () => { const id = useProje.getState().projeOlustur("Yeni proje", "Genel", { kaynakStudyo: "Kitaplık" }); raySec(`proje:${id}`); toast.success("Proje oluşturuldu", { description: "Üretimleri soldaki klasöre sürükleyip bırakabilir ya da kart menüsünden ekleyebilirsin." }); };
  const baslikListe = rayAktif === "favori" ? kapsamListesi.filter((u) => u.favori) : rayAktif === "son7" ? kapsamListesi.filter((u) => Date.now() - u.olusturma <= 7 * GUN) : kapsamListesi;
  const aktifProje = aktifProjeId ? projeSecenek.find((p) => p.id === aktifProjeId) : undefined;
  const baslikAd = rayAktif === "favori" ? "Favoriler" : rayAktif === "son7" ? "Son 7 gün" : kapsam === "gorselara" ? "Görsele benzerler" : kapsamAdi ?? "Tüm üretimler";
  const baslikIkon = kapsam.startsWith("akilli:") ? "akilli" as const : copModu ? "cop" as const : rayAktif === "favori" ? "favori" as const : rayAktif === "son7" ? "son7" as const
    : kapsam === "gorselara" ? ScanSearch : kapsam === "yukleme" ? Upload : kapsam.startsWith("arac:") ? (ARACLAR.find((a) => a.id === kapsam.slice(5))?.ikon ?? Sparkles) : "tumu" as const;
  const gorselleAra = async (f: File) => {
    if (!/^image\//.test(f.type)) { mesaj.desteklenmeyenDosya("görsel (JPG, PNG, WebP)"); return; }
    const url = URL.createObjectURL(f);
    setGorselAra({ url, skor: new Map(), hesap: true, esik: 1 }); setTur(null); setFavori(false); setKapsam("gorselara");
    const skor = await gorseleGorePuanla(url, uretimler.map((u) => ({ id: u.id, src: kapakUrl(u) })));
    /* En benzer 8 üretim (puanı 0,6 altındakiler hiç gösterilmez). */
    const sirali = [...skor.values()].sort((x, y) => y - x);
    const esik = Math.max(0.6, sirali[Math.min(7, sirali.length - 1)] ?? 1);
    setGorselAra({ url, skor, hesap: false, esik });
    const n = sirali.filter((v) => v >= esik).length;
    toast(n ? `${n} benzer üretim bulundu` : "Benzer üretim bulunamadı", { description: n ? "En benzerden başlayarak sıralandı." : "Renk ve yerleşimi yakın bir görselle yeniden dene." });
  };
  const suzgecAktif = !!(suzgec.q.trim() || suzgec.modeller.length || suzgec.etiketler.length || suzgec.oranlar.length || suzgec.zaman !== "tumu" || suzgec.durum !== "tumu" || favori || demoGizle || tarih.bas || klasor);
  /** Etkin süzgeçlerin her biri tek tıkla kalkan çip olarak görünür. */
  const cipler: { ad: string; kaldir: () => void }[] = [
    ...(suzgec.q.trim() ? [{ ad: `"${suzgec.q.trim()}"`, kaldir: () => setSuzgec({ ...suzgec, q: "" }) }] : []),
    ...(favori ? [{ ad: "Favoriler", kaldir: () => setFavori(false) }] : []),
    ...suzgec.modeller.map((m) => ({ ad: m, kaldir: () => setSuzgec({ ...suzgec, modeller: suzgec.modeller.filter((x) => x !== m) }) })),
    ...(suzgec.zaman !== "tumu" ? [{ ad: ZAMANLAR.find((z) => z[0] === suzgec.zaman)![1], kaldir: () => setSuzgec({ ...suzgec, zaman: "tumu" }) }] : []),
    ...suzgec.oranlar.map((o) => ({ ad: o, kaldir: () => setSuzgec({ ...suzgec, oranlar: suzgec.oranlar.filter((x) => x !== o) }) })),
    ...(suzgec.durum !== "tumu" ? [{ ad: suzgec.durum === "hata" ? "Başarısız" : "Tamamlanan", kaldir: () => setSuzgec({ ...suzgec, durum: "tumu" }) }] : []),
    ...suzgec.etiketler.map((e) => ({ ad: `#${e}`, kaldir: () => setSuzgec({ ...suzgec, etiketler: suzgec.etiketler.filter((x) => x !== e) }) })),
    ...(demoGizle ? [{ ad: "Eski kayıtlar gizli", kaldir: () => setDemoGizle(false) }] : []),
    ...(tarih.bas ? [{ ad: aralikYazisi(tarih), kaldir: () => setTarih({}) }] : []),
    ...(klasor && klasorAdi ? [{ ad: `Klasör: ${klasorAdi}`, kaldir: () => setKlasor(null) }] : []),
  ];
  const temizle = () => { setSuzgec(BOS_SUZGEC); setFavori(false); setDemoGizle(false); setTarih({}); setKlasor(null); };
  const toplam = Object.values(turSayilari).reduce((a, b) => a + b, 0);
  const aktifIs = uretimler.filter(suruyorMu).length;

  if (!hazir) return <Yukleniyor />;

  /* Masonry: her öğe en kısa sütuna (doğal oranından tahmini boy) — sütun sonları dengeli, sıra soldan sağa yeniden eskiye. */
  const izgara = (ogeler: Uretim[]) => {
    const cols: Uretim[][] = Array.from({ length: sutunSayisi }, () => []);
    const boy = new Array(sutunSayisi).fill(0);
    for (const u of ogeler) {
      const t = uretimTuru(u);
      const oran = kartOrani(gorunumAyar, t === "ses" || t === "muzik" ? 4 / 3 : t === "video" ? oranDegeri(u.meta?.oran) : oranSayi(u));
      let i = 0; for (let k = 1; k < sutunSayisi; k++) if (boy[k] < boy[i] - 0.02) i = k;
      cols[i].push(u); boy[i] += 1 / Math.max(0.2, oran || 1) + 0.02;
    }
    return <div className="flex items-start gap-1">{cols.map((c, i) => <div key={i} className="min-w-0 flex-1">{c.map(kart)}</div>)}</div>;
  };
  const kart = (u: Uretim) => (
    <div key={u.id} className="mb-1 break-inside-avoid" draggable={!copModu}
      onDragStart={(e) => { const ids = seciliSet.has(u.id) ? secili : [u.id]; e.dataTransfer.setData(URETIM_SURUKLE, JSON.stringify(ids)); e.dataTransfer.effectAllowed = "move"; const g = kapakUrl(u); if (g) { const im = new Image(); im.src = g; e.dataTransfer.setDragImage(im, 24, 24); } }}>
      <GaleriKart u={u} oran={gorunumAyar.yerlesim === "ozgun" ? undefined : kartOrani(gorunumAyar, 1)} secili={seciliSet.has(u.id)} secimModu={secimModu} calan={oynatma.id === u.id && oynatma.oynuyor} ilerleme={oynatma.id === u.id ? oynatma.ilerleme : 0}
        copKalan={copModu ? copKalanGun(u as Uretim & { silinme?: number }) : undefined} o={olaylar} />
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="kitaplik-kapsam min-h-[calc(100vh-3.5rem)] bg-zemin">
        <div className="flex">
        <KitaplikRayi en={rayEn} aktif={rayAktif} sayilar={raySayilari} projeler={projeSecenek} akilli={akilliSayilari} kaynaklar={kaynakSecenek} depolamaKb={depolamaKb} yukleniyor={yukleniyor}
          onSec={raySec} onYukle={() => dosyaRef.current?.click()} onYeniProje={yeniProje} onKisayol={() => setKisayol(true)}
          onBirak={(pid, ids) => { projeyeTasi(ids, pid); const p = projeSecenek.find((x) => x.id === pid); toast.success(`${ids.length} üretim projeye eklendi`, { description: p?.ad }); setSecili([]); }}
          onAkilliSil={(id, ad) => { akilliSil(id); if (kapsam === `akilli:${id}`) setKapsam("tumu"); toast.success("Akıllı klasör silindi", { description: `"${ad}" kaldırıldı; içindeki üretimler kitaplıkta duruyor.` }); }} />
        <div className="min-w-0 flex-1">
        <div className="px-3 pt-4 sm:px-5 sm:pt-5">
          <KitaplikBaslik ad={baslikAd} ikon={baslikIkon} proje={aktifProje ? { id: aktifProje.id, renk: aktifProje.renk, kapak: aktifProje.kapak } : undefined}
            liste={baslikListe} aktifIs={aktifIs} copModu={copModu} yukleniyor={yukleniyor} onYukle={() => dosyaRef.current?.click()} onYeniProje={yeniProje}
            onCopBosalt={() => { useProjeler.getState().copuBosalt(); toast.success("Çöp kutusu boşaltıldı"); }} />
        </div>
        <input ref={gorselRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void gorselleAra(f); e.target.value = ""; }} />
        <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4" multiple className="hidden" onChange={(e) => { yukle(Array.from(e.target.files ?? [])); e.target.value = ""; }} />

        {/* Yapışkan araç çubuğu: tür segmenti, arama, süzgeçler, görünüm */}
        {(uretimler.length > 0 || kapsam !== "tumu") && <div className="sticky top-[var(--ust-nav)] z-30 mt-3 bg-zemin">
          <div className="gizli-scroll flex items-center gap-2 overflow-x-auto px-3 py-2.5 sm:flex-wrap sm:overflow-visible sm:px-5">
            <TurMenusu deger={tur} onDegis={(t) => { setTur(t); setSecili([]); }} sayilar={turSayilari} />

            <label className="group flex h-10 w-[180px] shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 ring-1 ring-inset ring-white/[0.06] transition-[width,background-color] focus-within:w-[260px] focus-within:bg-white/[0.08] hover:bg-white/[0.07] min-[1700px]:w-[280px]">
              <Search className="h-4 w-4 shrink-0 text-white/55 group-focus-within:text-white" />
              <input ref={aramaRef} value={suzgec.q} onChange={(e) => setSuzgec({ ...suzgec, q: e.target.value })} placeholder="İstem ya da model ara" aria-label="Kitaplıkta ara"
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/45" />
              {suzgec.q ? <button onClick={() => setSuzgec({ ...suzgec, q: "" })} aria-label="Aramayı temizle" className="flex h-5 w-5 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.1] hover:text-white"><X className="h-3 w-3" /></button>
                : <kbd className="hidden rounded-md bg-white/[0.08] px-1.5 text-[11px] text-white/55 sm:block">/</kbd>}
            </label>

            {!copModu && (
              <>
                <button onClick={() => gorselRef.current?.click()} aria-pressed={kapsam === "gorselara"} title="Bir görsel seç; renk ve yerleşimi benzeyen üretimler sıralansın" className={dugme(kapsam === "gorselara")}>
                  <ScanSearch className="h-4 w-4" /><span className="max-[1600px]:hidden">Görselle ara</span>
                </button>
                <FavoriKutusu acik={favori} onDegis={setFavori} />
                <YeniKlasorDugmesi uretimIdler={secili.length ? secili : undefined} onOlustu={(id) => { if (secili.length) { setKlasor(id); setSecili([]); } }} />
                <KlasorMenusu secili={klasor} onSec={(id) => { setKlasor(id); setSecili([]); }} />
                <TarihAraligi deger={tarih} onDegis={(a) => { setTarih(a); setSuzgec((x) => ({ ...x, zaman: "tumu" })); }} />
                <SiralamaMenusu deger={siralama === "yeni" || siralama === "eski" ? siralama : "ozel"} ozel={(siralama === "yeni" || siralama === "eski" ? "ad" : siralama) as OzelSira} onDegis={(s2, o) => setSiralama(s2 === "ozel" ? (o ?? "ad") : s2)} />
                <ModelMenusu modeller={modeller} secili={suzgec.modeller[0] ?? null} sayilar={uretimler} onSec={(m) => setSuzgec({ ...suzgec, modeller: m ? [m] : [] })} />
                <SuzgecMenusu demoVar={uretimler.some((u) => u.gercek === false)} demoGizle={demoGizle} setDemoGizle={setDemoGizle} suzgec={suzgec} setSuzgec={setSuzgec} oranlar={ORANLAR.filter((o) => uretimler.some((u) => u.meta?.oran === o))} />
                <div className="lg:hidden"><ProjeMenusu secenekler={projeSecenek} aktif={aktifProjeId} onSec={(id) => setKapsam(id ? `proje:${id}` : "tumu")} /></div>
                <AnimatePresence>
                  {suzgecAktif && (
                    <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={temizle} aria-label="Süzgeçleri temizle" title="Süzgeçleri temizle"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/80 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.1] hover:text-white"><RotateCcw className="h-4 w-4" /></motion.button>
                  )}
                </AnimatePresence>
              </>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-2 pl-1">
              <GorunumAyari sayfa="kitaplik" istemVar={false} siralamaVar={false} dugmeSinif="h-10 w-10" />
              <DahaMenusu liste={gorunum === "liste"} onListe={() => setGorunum(gorunum === "liste" ? "izgara" : "liste")} siralama={siralama} setSiralama={setSiralama} kaynaklar={kaynakSecenek} etiketler={etiketler} seciliEtiket={suzgec.etiketler}
                onEtiket={(e) => setSuzgec({ ...suzgec, etiketler: e })} akilli={akilli} aktif={kapsam} copSayi={cop.length} suzgecVar={!!(suzgec.q.trim() || suzgec.modeller.length || suzgec.etiketler.length)}
                onKapsam={setKapsam} onKisayol={() => setKisayol(true)}
                onAkilliKaydet={(ad) => { const id = akilliEkle(ad, tur ? `tur:${tur}` : kapsam.startsWith("akilli:") ? "tumu" : kapsam, suzgec); setSuzgec(BOS_SUZGEC); setTur(null); setKapsam(`akilli:${id}`); toast.success("Akıllı klasör oluşturuldu", { description: `"${ad}": koşula uyan yeni üretimler kendiliğinden içine düşer.` }); }}
                onAkilliSil={(id, ad) => { akilliSil(id); if (kapsam === `akilli:${id}`) setKapsam("tumu"); toast.success("Akıllı klasör silindi", { description: `"${ad}" kaldırıldı; içindeki üretimler kitaplıkta duruyor.` }); }} />
            </div>
          </div>
        </div>}

        {/* Galeri */}
        <div ref={alanRef} onPointerDown={kutuBasla} className="min-h-[60vh] px-3 pb-40 sm:px-5">
          <AnimatePresence initial={false}>
            {(cipler.length > 0 || benzerKaynak || gorselAra && kapsam === "gorselara") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5 pb-2 pt-1">
                  {gorselAra && kapsam === "gorselara" && (
                    <span className="flex h-8 items-center gap-2 rounded-full bg-white/[0.06] pl-1 pr-1 text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08]">
                      <span className="h-6 w-6 rounded-full ring-1 ring-inset ring-white/15" style={{ background: `url("${gorselAra.url}") center/cover, #222` }} />
                      {gorselAra.hesap ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Karşılaştırılıyor</> : "Bu görsele benzerler"}
                      <button onClick={() => gorselRef.current?.click()} className="rounded-full px-2 text-white/60 hover:text-white">Değiştir</button>
                      <button onClick={() => { setKapsam("tumu"); setGorselAra(null); }} aria-label="Görsel aramasını kapat" className="flex h-6 w-6 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </span>
                  )}
                  {benzerKaynak && (
                    <span className="flex h-8 items-center gap-2 rounded-full bg-white/[0.06] pl-1 pr-1 text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08]">
                      <span className="h-6 w-6 rounded-full ring-1 ring-inset ring-white/15" style={{ background: `url("${kapakUrl(benzerKaynak) ?? ""}") center/cover, #222` }} />
                      Benzer üretimler
                      <button onClick={() => setKapsam("tumu")} aria-label="Benzer aramasını kapat" className="flex h-6 w-6 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </span>
                  )}
                  {cipler.map((c) => (
                    <motion.button key={c.ad} onClick={c.kaldir} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="group flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] pl-3 pr-2 text-[12.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1]">
                      {c.ad}<X className="h-3.5 w-3.5 text-white/55 group-hover:text-white" />
                    </motion.button>
                  ))}
                  {cipler.length > 1 && <button onClick={temizle} className="h-8 rounded-full px-3 text-[12.5px] font-medium text-white/60 transition-colors hover:text-white">Hepsini temizle</button>}
                  <span className="ml-auto text-[12.5px] tabular-nums text-white/50">{liste.length} sonuç</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {suranlar.length > 0 && (
            <section className="mb-5">
              <h2 className="flex items-center gap-2 px-1 pb-2.5 pt-2 text-[15px] font-semibold tracking-[-0.01em] text-white"><Loader2 className="h-4 w-4 animate-spin text-white" />Sürüyor<Hap>{suranlar.length}</Hap></h2>
              {izgara(suranlar)}
            </section>
          )}

          {liste.length === 0 && suranlar.length === 0 ? (
            <BosDurum kapsam={kapsam} toplam={(copModu ? cop : uretimler).length} suzgecAktif={suzgecAktif || !!tur} onTemizle={() => { temizle(); setTur(null); }} />
          ) : gruplar.map((g) => {
            const hepsi = g.ogeler.every((u) => seciliSet.has(u.id));
            return (
              <section key={g.anahtar} className="mb-5">
                {g.etiket && (
                  <h2 className="group/g flex items-center gap-2 px-1 pb-2.5 pt-2 text-[15px] font-semibold tracking-[-0.01em] text-white">
                    {g.etiket}<Hap>{g.ogeler.length}</Hap>
                    <button onClick={() => { const ids = g.ogeler.map((u) => u.id); setSecili((s) => (hepsi ? s.filter((x) => !ids.includes(x)) : Array.from(new Set([...s, ...ids])))); }}
                      className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition", hepsi ? "bg-white text-black" : "bg-white/[0.06] text-white/75 opacity-0 hover:bg-white/[0.1] hover:text-white group-hover/g:opacity-100 focus:opacity-100", secimModu && "opacity-100")}>
                      {hepsi ? "Seçimi kaldır" : "Tümünü seç"}
                    </button>
                  </h2>
                )}
                {gorunum === "liste" ? (
                  <div className="space-y-0.5">{g.ogeler.map((u) => <VarlikSatiri key={u.id} u={u} secili={seciliSet.has(u.id)} secimModu={secimModu} calan={oynatma.id === u.id && oynatma.oynuyor} ilerleme={oynatma.id === u.id ? oynatma.ilerleme : 0} {...satirOlaylari} />)}</div>
                ) : (
                  izgara(g.ogeler)
                )}
              </section>
            );
          })}
        </div>

        </div>
        </div>

        {/* Kutu seçimi */}
        {kutu && Math.abs(kutu.x1 - kutu.x0) + Math.abs(kutu.y1 - kutu.y0) > 8 && (
          <div className="pointer-events-none fixed z-[70] rounded-[8px] border border-white/70 bg-white/[0.08]"
            style={{ left: Math.min(kutu.x0, kutu.x1), top: Math.min(kutu.y0, kutu.y1), width: Math.abs(kutu.x1 - kutu.x0), height: Math.abs(kutu.y1 - kutu.y0) }} />
        )}

        <SecimCubugu secilenler={secilenler} toplam={liste.length} onTumu={() => setSecili(liste.map((u) => u.id))} copModu={copModu} aktifProjeId={aktifProjeId} onTemizle={() => setSecili([])} onKarsilastir={() => setKarsilastir(true)}
          onGeriAl={() => { useProjeler.getState().copGeriAl(secili); toast.success(`${secili.length} üretim geri alındı`); setSecili([]); }}
          onKaliciSil={() => { useProjeler.getState().kaliciSil(secili); toast.success(`${secili.length} üretim kalıcı olarak silindi`); setSecili([]); }} />

        {menu && <BaglamMenusu u={menu.u} x={menu.x} y={menu.y} aktifProjeId={aktifProjeId} onKapat={() => setMenu(null)} onAc={() => ac(menu.u)} onAdlandir={() => setAdlandir(menu.u)} onBenzer={() => { setTur(null); setSuzgec(BOS_SUZGEC); setKapsam(`benzer:${menu.u.id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
        {adlandir && <AdDegistir u={adlandir} onKapat={() => setAdlandir(null)} />}

        <AnimatePresence>
          {acikId && !copModu && (() => {
            const u = liste.find((x) => x.id === acikId) ?? uretimler.find((x) => x.id === acikId);
            return u ? <UretimGoruntuleyici key="goruntuleyici" u={u} liste={liste} onSec={setAcikId} onKapat={() => setAcikId(null)} projeId={aktifProjeId} /> : null;
          })()}
          {karsilastir && secilenler.length >= 2 && <Karsilastir key="kars" liste={secilenler.slice(0, 4)} onKapat={() => setKarsilastir(false)} />}
          {calanUretim && !acikId && (
            <MiniOynatici key="oyn" u={calanUretim} oynuyor={oynatma.oynuyor} ilerleme={oynatma.ilerleme} sure={oynatma.sure} onCal={() => cal(calanUretim)} onSar={sar}
              onKapat={() => { sesRef.current?.pause(); setOynatma({ id: null, oynuyor: false, ilerleme: 0, sure: 0 }); }} />
          )}
        </AnimatePresence>
        {element && <ElementDuzenleModal element={null} onKapat={() => setElement(null)} tohumDeger={{ gorsel: element.gorsel, aciklama: element.aciklama }} />}
        {kisayol && <KisayolSayfasi onKapat={() => setKisayol(false)} />}
        <BirakKatmani gorunur={birak} />
      </div>
    </MotionConfig>
  );
}

const copKalanGun = (u: Uretim & { silinme?: number }) => (u.silinme ? Math.max(0, COP_SURE_GUN - Math.floor((Date.now() - u.silinme) / GUN)) : COP_SURE_GUN);

/* Stüdyo galerisindeki açılır menülerle aynı yüzey; içerik başlık şeritli kartlarda. */
const MENU = "rounded-[18px] border border-white/[0.08] bg-[#151517] p-2";
const SATIR = "flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13px] ring-1 ring-inset transition-colors";
const secSatir = (s: boolean) => (s ? "bg-white/[0.08] text-white ring-white/45" : "text-white/75 ring-transparent hover:bg-white/[0.05] hover:text-white");
const dugme = (aktif: boolean) => cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium ring-1 ring-inset transition-colors active:scale-[0.97]", aktif ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/85 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white");

function ModelMenusu({ modeller, secili, sayilar, onSec }: { modeller: string[]; secili: string | null; sayilar: Uretim[]; onSec: (m: string | null) => void }) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const gorunen = modeller.filter((m) => !q.trim() || sadeMetin(m).includes(sadeMetin(q.trim())));
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={dugme(!!secili)}>
        {secili ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1b1c1f]"><ModelLogo ad={secili} boyut={13} /></span> : <LayoutGrid className="h-4 w-4" />}
        <span>{secili ?? "Model"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Modele göre süz" className={cn(MENU, "w-[300px]")}>
        <MenuKart baslik="Model" sag={<span className="text-[11.5px] tabular-nums text-white/45">{modeller.length} model</span>}>
          {modeller.length > 7 && (
            <label className="m-2 flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.04] px-2.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25">
              <Search className="h-3.5 w-3.5 text-white/45" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Model ara" aria-label="Model ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
            </label>
          )}
          <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {(q.trim() ? gorunen : [null, ...gorunen]).map((ad) => {
              const s = secili === ad;
              return (
                <button key={ad ?? "tum"} onClick={() => { onSec(ad); setAcik(false); setQ(""); }} aria-pressed={s} className={cn(SATIR, secSatir(s))}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1b1c1f] ring-1 ring-inset ring-white/[0.08]">{ad ? <ModelLogo ad={ad} boyut={15} /> : <LayoutGrid className="h-3.5 w-3.5 text-white/70" />}</span>
                  <span className="min-w-0 flex-1 leading-snug">{ad ?? "Tüm modeller"}</span>
                  <span className="text-[11.5px] tabular-nums text-white/45">{ad ? sayilar.filter((u) => u.model === ad).length : sayilar.length}</span>
                </button>
              );
            })}
            {!gorunen.length && <p className="px-2 py-3 text-center text-[12.5px] text-white/55">Bu adla model yok.</p>}
          </div>
        </MenuKart>
      </Yuzen>
    </div>
  );
}

function ProjeMenusu({ secenekler, aktif, onSec }: { secenekler: { id: string; ad: string; renk?: string; n: number; kapak?: string }[]; aktif?: string; onSec: (id: string | null) => void }) {
  const [acik, setAcik] = useState(false);
  const aktifAd = secenekler.find((p) => p.id === aktif)?.ad;
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={dugme(!!aktif)}>
        <Folder className="h-4 w-4" /><span>{aktifAd ?? "Proje"}</span><ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Projeye göre süz" className={cn(MENU, "w-[320px]")}>
        <MenuKart baslik="Proje" sag={aktif ? <button onClick={() => { onSec(null); setAcik(false); }} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">Tümünü göster</button> : <span className="text-[11.5px] tabular-nums text-white/45">{secenekler.length} proje</span>}>
          <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {secenekler.map((p) => (
              <button key={p.id} onClick={() => { onSec(aktif === p.id ? null : p.id); setAcik(false); }} aria-pressed={aktif === p.id} className={cn(SATIR, secSatir(aktif === p.id))}>
<MacKlasor renk={p.renk} gorsel={p.kapak} className="h-9 w-10 shrink-0" />
                <span className="min-w-0 flex-1 leading-snug">{p.ad}</span>
                <span className="text-[11.5px] tabular-nums text-white/45">{p.n}</span>
              </button>
            ))}
            {!secenekler.length && <p className="px-2 py-3 text-center text-[12.5px] text-white/55">Henüz proje yok.</p>}
          </div>
          <Link href="/panel/projeler" className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2.5 text-[12.5px] font-medium text-white/75 transition-colors hover:bg-white/[0.04] hover:text-white"><FolderPlus className="h-4 w-4" />Projeleri yönet</Link>
        </MenuKart>
      </Yuzen>
    </div>
  );
}

function DahaMenusu({ liste, onListe, siralama, setSiralama, kaynaklar, etiketler, seciliEtiket, onEtiket, akilli, aktif, copSayi, suzgecVar, onKapsam, onKisayol, onAkilliKaydet, onAkilliSil }: {
  liste: boolean; onListe: () => void;
  siralama: Siralama; setSiralama: (s: Siralama) => void;
  kaynaklar: { id: string; ad: string; ikon: React.ElementType; n: number }[];
  etiketler: string[]; seciliEtiket: string[]; onEtiket: (e: string[]) => void;
  akilli: { id: string; ad: string }[]; aktif: string; copSayi: number; suzgecVar: boolean;
  onKapsam: (k: string) => void; onKisayol: () => void; onAkilliKaydet: (ad: string) => void; onAkilliSil: (id: string, ad: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [akilliAd, setAkilliAd] = useState("");
  const karo = (s: boolean) => cn("flex items-center gap-2 rounded-[11px] px-2.5 py-2 text-left text-[13px] font-medium ring-1 ring-inset transition-[background-color,transform] active:scale-[0.98]", s ? "bg-white text-black ring-white" : "bg-white/[0.03] text-white/75 ring-white/[0.06] hover:bg-white/[0.06] hover:text-white");
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-label="Diğer seçenekler" title="Liste görünümü, kaynak, etiketler, akıllı klasörler, çöp kutusu"
        className={cn("relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset transition-colors", acik ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/85 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white")}>
        <MoreHorizontal className="h-4 w-4" />
        {(liste || seciliEtiket.length > 0) && !acik && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#0b0b0c]" />}
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Kitaplık seçenekleri" className={cn(MENU, "max-h-[78vh] w-[340px] overflow-y-auto [scrollbar-width:thin]")}>
        <MenuKart baslik="Görünüm">
          <div className="grid grid-cols-2 gap-1.5 p-2">
            <button onClick={() => { if (liste) onListe(); }} aria-pressed={!liste} className={karo(!liste)}><LayoutGrid className="h-4 w-4" />Izgara</button>
            <button onClick={() => { if (!liste) onListe(); }} aria-pressed={liste} className={karo(liste)}><List className="h-4 w-4" />Liste</button>
          </div>
        </MenuKart>
        <MenuKart baslik="Kaynak" sag={aktif !== "tumu" && kaynaklar.some((k) => k.id === aktif) ? <button onClick={() => onKapsam("tumu")} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">Temizle</button> : undefined}>
          <div className="space-y-0.5 p-1.5">
            {kaynaklar.map((k) => (
              <button key={k.id} onClick={() => { onKapsam(aktif === k.id ? "tumu" : k.id); setAcik(false); }} aria-pressed={aktif === k.id} className={cn(SATIR, secSatir(aktif === k.id))}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><k.ikon className="h-3.5 w-3.5" /></span>
                <span className="flex-1">{k.ad}</span><span className="text-[11.5px] tabular-nums text-white/45">{k.n}</span>
              </button>
            ))}
          </div>
        </MenuKart>
        {etiketler.length > 0 && (
          <MenuKart baslik="Etiketler" sag={seciliEtiket.length ? <button onClick={() => onEtiket([])} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">Temizle</button> : undefined}>
            <div className="flex flex-wrap gap-1.5 p-2">
              {etiketler.map((e) => { const s = seciliEtiket.includes(e); return <button key={e} onClick={() => onEtiket(s ? seciliEtiket.filter((x) => x !== e) : [...seciliEtiket, e])} aria-pressed={s} className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium ring-1 ring-inset transition-colors active:scale-95", s ? "bg-white text-black ring-white" : "bg-white/[0.04] text-white/75 ring-white/[0.07] hover:text-white")}><Hash className="h-3 w-3" />{e}</button>; })}
            </div>
          </MenuKart>
        )}
        <MenuKart baslik="Akıllı klasörler" sag={<span className="text-[11.5px] tabular-nums text-white/45">{akilli.length}</span>}>
          {akilli.length > 0 && (
            <div className="space-y-0.5 p-1.5">
              {akilli.map((a) => (
                <div key={a.id} className="group/a flex items-center gap-1">
                  <button onClick={() => { onKapsam(`akilli:${a.id}`); setAcik(false); }} aria-pressed={aktif === `akilli:${a.id}`} className={cn(SATIR, "flex-1", secSatir(aktif === `akilli:${a.id}`))}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><Sparkles className="h-3.5 w-3.5" /></span><span className="leading-snug">{a.ad}</span>
                  </button>
                  <button onClick={() => onAkilliSil(a.id, a.ad)} aria-label={`${a.ad} akıllı klasörünü sil`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 opacity-0 transition hover:bg-white/[0.06] hover:text-rose-300 focus-visible:opacity-100 group-hover/a:opacity-100"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          {suzgecVar ? (
            <form onSubmit={(e) => { e.preventDefault(); if (akilliAd.trim()) { onAkilliKaydet(akilliAd.trim()); setAkilliAd(""); setAcik(false); } }} className={cn("flex gap-1.5 p-2", akilli.length > 0 && "border-t border-white/[0.06]")}>
              <input value={akilliAd} onChange={(e) => setAkilliAd(e.target.value.slice(0, 32))} placeholder="Bu aramayı klasör yap: ad yaz" aria-label="Akıllı klasör adı" className="h-9 min-w-0 flex-1 rounded-[10px] bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/40 focus:ring-white/30" />
              <button disabled={!akilliAd.trim()} className="h-9 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95 disabled:opacity-40">Kaydet</button>
            </form>
          ) : !akilli.length && (
            <p className="flex items-start gap-2.5 px-3 py-2.5 text-[12.5px] leading-snug text-white/60"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/70" />Arama ya da model süzgeci uygulayınca o görünümü buradan klasör olarak kaydedersin; uyan yeni üretimler kendiliğinden içine düşer.</p>
          )}
        </MenuKart>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button onClick={() => { onKapsam(aktif === "cop" ? "tumu" : "cop"); setAcik(false); }} aria-pressed={aktif === "cop"} className={cn(karo(aktif === "cop"), "flex-col items-start gap-1.5 py-2.5")}>
            <span className="flex w-full items-center justify-between"><Trash2 className="h-4 w-4" />{copSayi > 0 && <span className="rounded-full bg-white/[0.08] px-1.5 text-[11.5px] tabular-nums text-white/70">{copSayi}</span>}</span>Çöp kutusu
          </button>
          <button onClick={() => { onKisayol(); setAcik(false); }} className={cn(karo(false), "flex-col items-start gap-1.5 py-2.5")}>
            <span className="flex w-full items-center justify-between"><Keyboard className="h-4 w-4" /><kbd className="text-[11px]">?</kbd></span>Kısayollar
          </button>
        </div>
      </Yuzen>
    </div>
  );
}

function SuzgecMenusu({ suzgec, setSuzgec, oranlar, demoVar, demoGizle, setDemoGizle }: { suzgec: Suzgec; setSuzgec: (s: Suzgec) => void; oranlar: string[]; demoVar: boolean; demoGizle: boolean; setDemoGizle: (v: boolean) => void }) {
  const [acik, setAcik] = useState(false);
  const n = suzgec.oranlar.length + (suzgec.durum !== "tumu" ? 1 : 0) + (demoGizle ? 1 : 0);
  const karo = (s: boolean) => cn("flex h-9 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[12.5px] font-medium ring-1 ring-inset transition-[background-color,transform] active:scale-95", s ? "bg-white text-black ring-white" : "bg-white/[0.03] text-white/75 ring-white/[0.06] hover:bg-white/[0.06] hover:text-white");
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={dugme(n > 0)}>
        <SlidersHorizontal className="h-4 w-4" /><span>Süzgeç</span>{n > 0 && <span className="rounded-full bg-black/10 px-1.5 text-[11.5px] tabular-nums">{n}</span>}<ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Süzgeçler" className={cn(MENU, "w-[320px]")}>
        {oranlar.length > 0 && (
          <MenuKart baslik="Oran" sag={suzgec.oranlar.length ? <button onClick={() => setSuzgec({ ...suzgec, oranlar: [] })} className="rounded-full px-2 py-0.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white">Temizle</button> : <span className="text-[11.5px] text-white/45">Birden çok seçilebilir</span>}>
            <div className="grid grid-cols-4 gap-1.5 p-2">
              {oranlar.map((o) => { const s = suzgec.oranlar.includes(o); return (
                <button key={o} onClick={() => setSuzgec({ ...suzgec, oranlar: s ? suzgec.oranlar.filter((x) => x !== o) : [...suzgec.oranlar, o] })} aria-pressed={s} className={cn(karo(s), "h-14 flex-col gap-1")}>
                  <OranSekli oran={o} boyut={16} /><span className="tabular-nums">{o}</span>
                </button>
              ); })}
            </div>
          </MenuKart>
        )}
        <MenuKart baslik="Durum">
          <div className="grid grid-cols-3 gap-1.5 p-2">
            {([["tumu", "Hepsi"], ["tamam", "Tamamlanan"], ["hata", "Başarısız"]] as const).map(([k, a]) => <button key={k} onClick={() => setSuzgec({ ...suzgec, durum: k })} aria-pressed={suzgec.durum === k} className={karo(suzgec.durum === k)}>{a}</button>)}
          </div>
        </MenuKart>
      </Yuzen>
    </div>
  );
}

const BASLANGIC = [
  { ad: "Görsel üret", alt: "İstemini yaz, modelini seç", kapak: "/gercek/kesfet/cyberpunk-sokak-yagmurusora-2.webp", href: "/panel/gorsel" },
  { ad: "Video üret", alt: "Görselini canlandır ya da sıfırdan çek", kapak: "/gercek/sinema/ps-bullet.webp", href: "/panel/video" },
  { ad: "Hazır efekt dene", alt: "Fotoğrafını yükle, efekti seç", kapak: "/gercek/preset-video/earth-zoom.webp", href: "/panel/presetler" },
];

function BosDurum({ kapsam, toplam, suzgecAktif, onTemizle }: { kapsam: string; toplam: number; suzgecAktif: boolean; onTemizle: () => void }) {
  const bilgiKarti = (ikon: React.ElementType, baslik: string, alt: string, eylem: React.ReactNode, ipuclari: [React.ElementType, string, string][]) => {
    const I = ikon;
    return (
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={cn(KART, "mx-auto mt-3 max-w-[880px]")}>
        <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white"><I className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[16px] font-semibold text-white">{baslik}</h2><p className="mt-0.5 text-[13px] text-white/60">{alt}</p></div>
          {eylem}
        </header>
        <div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
          {ipuclari.map(([Ik, a, n], i) => (
            <motion.div key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }} className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white"><Ik className="h-4 w-4" /></span>
              <p className="mt-2.5 text-[13.5px] font-semibold text-white">{a}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">{n}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  };
  if (suzgecAktif && toplam > 0) {
    return bilgiKarti(Search, "Eşleşen üretim yok", `${toplam} üretimin arasında bu süzgeçlere uyan yok.`,
      <motion.button whileTap={{ scale: 0.96 }} onClick={onTemizle} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><RotateCcw className="h-4 w-4" />Süzgeçleri temizle</motion.button>,
      [[Search, "Daha kısa ara", "İstemdeki tek bir kelime, model ya da etiket adı yeterli."], [SlidersHorizontal, "Süzgeçleri gevşet", "Tarih, oran ya da durum süzgeci sonuçları daraltıyor olabilir."], [ScanSearch, "Benzerlerini bul", "Bir kartın menüsünden benzer üretimleri istem içeriğine göre bul."]]);
  }
  if (kapsam === "cop") {
    return bilgiKarti(Trash2, "Çöp kutusu boş", `Sildiğin üretimler ${COP_SURE_GUN} gün boyunca burada bekler.`, null,
      [[RotateCcw, "Geri al", "Silince çıkan bildirimden ya da burada seçip Geri al ile tek tıkla dönersin."], [History, `${COP_SURE_GUN} gün saklanır`, "Süre dolunca üretim kendiliğinden kalıcı olarak silinir."], [Trash2, "Kalıcı sil", "Hemen yer açmak için seçip Kalıcı sil ya da Çöpü boşalt."]]);
  }
  const [baslik, alt] = kapsam === "yukleme" ? ["Henüz yükleme yok", "Görsel yükle ya da sayfaya sürükle; stüdyolarda referans olarak kullan."]
    : kapsam.startsWith("proje:") ? ["Bu projede henüz üretim yok", "Kartların menüsünden Projeye ekle ile buraya taşı ya da görsel sürükle."]
    : ["Kitaplığın burada başlıyor", "Stüdyolarda ürettiğin her şey kendiliğinden buraya düşer. Bir yerden başla:"];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={cn(KART, "mt-3")}>
      <header className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">{baslik}</h2>
        <p className="mt-0.5 text-[13px] text-white/60">{alt}</p>
      </header>
      <div className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
        {BASLANGIC.map((b, i) => (
          <motion.div key={b.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.45 }}>
            <Link href={b.href} className="group relative flex aspect-[16/10] items-end overflow-hidden rounded-[18px] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <span className="relative flex w-full items-end justify-between gap-3">
                <span><span className="block text-[16px] font-semibold text-white">{b.ad}</span><span className="mt-0.5 block text-[12.5px] text-white/70">{b.alt}</span></span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5">
        <span className="text-[13px] text-white/60">Elindeki görselleri de ekleyebilirsin: üstteki Yükle düğmesini kullan ya da sayfaya sürükle.</span>
      </footer>
    </motion.section>
  );
}

/** Yükleme: gerçek düzenin birebir iskeleti (components/kitaplik/KitaplikIskelet). */
function Yukleniyor() {
  return <KitaplikIskelet />;
}
