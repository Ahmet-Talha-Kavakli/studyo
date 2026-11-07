"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildKrediEsitle } from "@/lib/build/istemciKredi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Bell, BookOpen, ChevronDown, Cloud, GitBranch, ChevronLeft, Code2, Copy, PanelLeft, Volume2, X, Database, Eye, Gamepad2, Globe, History, LayoutDashboard, Loader2, MessageSquare, PenLine, Rocket, Settings2, Share2, Smartphone, Users, Target, TrendingUp, Store,
} from "lucide-react";
import { BuyumeSekme } from "@/components/build/buyume/BuyumeSekme";
import { IsletmeSekme } from "@/components/build/isletme/IsletmeSekme";
import { Komut, gorselOku, type KomutEki } from "@/components/build/Komut";
import { EkKarosu, ekYukle } from "@/components/build/sohbet/Besteci";
import type { Ek } from "@/components/build/sohbet/tipler";
import { api, projeOlustur } from "@/lib/build/istemci";
import { krediTahmini, modelBul, VARSAYILAN_MODEL } from "@/lib/build/modeller";
import type { BuildMesaj, FormGonderimi, OgeBaglam, ProjeTur } from "@/lib/build/tipler";
import { konumBul } from "./kaynakKonum";
import { useAuth } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { cn } from "@/lib/utils";
import { AyarlarSekme, type AyarBolum } from "./AyarlarSekme";
import { KodSekme } from "./KodSekme";
import { Onizleme, type Secim } from "./Onizleme";
import { GecmisPanel, YayinPanel } from "./Paneller";
import { SohbetAkisi } from "./Sohbet";
import { useProje } from "./useProje";
import { BulutKonsol, type BulutBolum } from "@/components/build/bulut/BulutProje";
import { SonrakiAdimlar } from "./Adimlar";
import { CanliHatalar } from "./CanliHatalar";
import { DalBandi } from "./DalBandi";
import { bildir, bildirimAcik, bildirimAyarla, canCal, sesAcik, sesAyarla } from "./bitis";
import { PaylasPaneli } from "@/components/build/paylasim/PaylasPaneli";
import { ToplulugaEklePaneli } from "@/components/build/paylasim/ToplulugaEklePaneli";
import { usePaylasimDurumu } from "@/components/build/paylasim/ortak";
import { EkipPaneli } from "@/components/build/ekip/EkipPaneli";
import { GorevDugmesi, GorevPaneli, useGorevler } from "./Gorevler";
import { useKomutOnerileri } from "./KomutOnerileri";
import { KomutPaleti, type PaletKomutu } from "./KomutPaleti";
import { HAZIR_ISTEKLER } from "@/lib/build/calismaIstekler";
import { PlanBelgesi, planMetni } from "./PlanBelgesi";
import { FileCode2, Gauge, Keyboard, MessagesSquare, MousePointer2, Sparkles as Kivilcim } from "lucide-react";
import { EkipDugmesi, IzleyiciSeridi, VarlikAvatarlari, useVarlik } from "@/components/build/ekip/ortak";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
type Sekme = "sohbet" | "onizleme" | "kod" | "veriler" | "buyume" | "isletme" | "ayarlar";
type Mod = "yap" | "plan" | "sohbet";
const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
const BASLANGIC: Record<ProjeTur, string[]> = {
  site: ["Renkleri daha sıcak yap", "İletişim sayfası ekle", "İngilizce dil seçeneği ekle"],
  uygulama: ["Karanlık mod ekle", "Verileri dışa aktarma ekle", "Grafiklere filtre ekle"],
  oyun: ["Oyunu zorlaştır", "Ses efektleri ekle", "Mobil dokunmatik kontrol ekle"],
  mobil: ["Hatırlatma ekranı ekle", "Karanlık mod ekle", "Uygulamayı mağaza yayınına hazırla"],
};

/** Proje menüsündeki açık/kapalı tercih satırı. */
function Tercih({ ad, alt, acik, degis, ikon: I }: { ad: string; alt?: string; acik: boolean; degis: (v: boolean) => void; ikon: typeof Bell }) {
  return (
    <button type="button" role="switch" aria-checked={acik} onClick={() => degis(!acik)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">
      <I className="h-4 w-4 shrink-0 text-white/50" /><span className="min-w-0 flex-1"><span className="block">{ad}</span>{alt && <span className="block text-[11.5px] text-white/40">{alt}</span>}</span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/15")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-transform", acik ? "translate-x-[18px] bg-[#0a0a0b]" : "translate-x-0.5 bg-white")} /></span>
    </button>
  );
}

function oku<T>(k: string, v: T): T { try { const x = localStorage.getItem(k); return x ? (JSON.parse(x) as T) : v; } catch { return v; } }

export function Calisma({ id }: { id: string }) {
  const router = useRouter();
  const k = useProje(id);
  const p = k.proje;
  const kullanici = useAuth((s) => s.kullanici);
  const krediModal = useKrediModal((s) => s.ac);

  const [sekme, setSekme] = useState<Sekme>("onizleme");
  const [mobilSekme, setMobilSekme] = useState<Sekme>("sohbet");
  const [ayarBolum, setAyarBolum] = useState<AyarBolum>("genel");
  const [veriBolum, setVeriBolum] = useState<BulutBolum>("genel");
  const [acilacakDosya, setAcilacakDosya] = useState<string | null>(null);
  const [gecmis, setGecmis] = useState<{ acik: boolean; odak?: string | null }>({ acik: false });
  const [yayin, setYayin] = useState(false);
  const [menu, setMenu] = useState(false);
  /* Paylaş ve Topluluğa ekle sağ panelleri; menüde "Paylaşılıyor" durumu. */
  const [paylasimPaneli, setPaylasimPaneli] = useState<"paylas" | "topluluk" | null>(null);
  const paylasiliyor = usePaylasimDurumu((d) => !!d.paylasilan[id]);
  const toplulukta = usePaylasimDurumu((d) => !!d.toplulukta[id]);
  const paylasimDurumuYukle = usePaylasimDurumu((d) => d.yukle);
  useEffect(() => { paylasimDurumuYukle(); }, [paylasimDurumuYukle]);
  /* Ekip: sağ panel, rol (izleyici salt okunur), çevrimiçi kişiler (nabız). */
  const [ekipAcik, setEkipAcik] = useState(false);
  const izleyici = p?.ekipRol === "izleyici";
  const sahipMi = !p?.ekipRol || p.ekipRol === "sahip";
  /* Paralel görevler: ana projede, izleyici dışındakilere. */
  const [gorevAcik, setGorevAcik] = useState(false);
  const gorevler = useGorevler(id, !!p && !p.taslak && !izleyici, gorevAcik);
  const [gorevIstem, setGorevIstem] = useState("");
  const [genisEkran, setGenisEkran] = useState(true);
  useEffect(() => { const m = matchMedia("(min-width: 1024px)"); const f = () => setGenisEkran(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  const varlik = useVarlik(p ? id : null, genisEkran ? sekme : mobilSekme, kullanici?.ad);
  const projeYukle = k.yukle;
  // Rol değiştiyse ya da ekipten çıkarıldıysa projeyi yeniden yükle (çıkarıldıysa "bulunamadı" görünür).
  useEffect(() => { if (varlik.kaldirildi || (varlik.rol && p?.ekipRol && varlik.rol !== p.ekipRol)) projeYukle(); }, [varlik.rol, varlik.kaldirildi, p?.ekipRol, projeYukle]);
  const [adlandir, setAdlandir] = useState<string | null>(null);
  const [okunmamis, setOkunmamis] = useState(0);
  const [formToplam, setFormToplam] = useState(0);
  const [secimIstegi, setSecimIstegi] = useState(0);
  const [atlanan, setAtlanan] = useState(0);
  useEffect(() => { try { setAtlanan(Number(sessionStorage.getItem(`vayra-build-not-${id}`)) || 0); } catch { /* yok */ } }, [id]);

  const [deger, setDeger] = useState("");
  const [mod, setMod] = useState<Mod>("yap");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [ekler, setEkler] = useState<KomutEki[]>([]);
  /** Belge ekleri (PDF, metin, CSV): sohbet ek deposuna yüklenir, metni ajana gider. */
  const [belgeler, setBelgeler] = useState<{ tur: "pdf" | "metin"; url: string; ad: string; boyut?: number }[]>([]);
  const [belgeYukleniyor, setBelgeYukleniyor] = useState(0);
  const [belgeHata, setBelgeHata] = useState("");
  /** Hedef kipi: ajan bu kredi tavanına kadar kendi başına çalışır (yalnız bir sonraki gönderim için). */
  const [hedefTavan, setHedefTavan] = useState<number | null>(null);
  /* Komut kutusu: "/" komutları ve "@" ile dosya anma. */
  const komutAlani = useRef<HTMLTextAreaElement | null>(null);
  const komutOneri = useKomutOnerileri({
    deger, setDeger, alanRef: komutAlani, dosyalar: useMemo(() => Object.keys(p?.dosyalar ?? {}), [p?.dosyalar]), kapali: izleyici, etkin: !!p,
    eylem: {
      kip: (m) => { setMod(m); if (m !== "yap") setHedefTavan(null); },
      hedef: () => { setMod("yap"); setHedefTavan(50); },
      gorev: (metin) => { if (p?.taslak) return; setGorevIstem(metin); setGorevAcik(true); },
      gecmis: () => setGecmis({ acik: true }),
      yayin: () => setYayin(true),
      sekme: (x) => { setSekme(x); setMobilSekme(x); },
    },
  });
  const [hedefOzel, setHedefOzel] = useState("");
  const dosyaBirak = async (l: File[]) => {
    setBelgeHata("");
    const gorseller = l.filter((x) => x.type.startsWith("image/")), diger = l.filter((x) => !x.type.startsWith("image/"));
    if (gorseller.length) { const y = (await Promise.all(gorseller.slice(0, 4).map(gorselOku))).filter(Boolean) as KomutEki[]; setEkler((e) => [...e, ...y].slice(0, 4)); }
    for (const d of diger.slice(0, 5)) {
      setBelgeYukleniyor((n) => n + 1);
      try { const e = await ekYukle(d); if (e.tur === "pdf" || e.tur === "metin") setBelgeler((b) => [...b, { tur: e.tur as "pdf" | "metin", url: e.url, ad: e.ad, boyut: e.boyut }].slice(0, 5)); }
      catch (x) { setBelgeHata(x instanceof Error ? x.message : "Belge yüklenemedi."); }
      finally { setBelgeYukleniyor((n) => n - 1); }
    }
  };
  const [secim, setSecim] = useState<Secim | null>(null);
  /** Geçmişten salt okunur açılan eski sürüm (önizlemede şeritle). */
  const [eskiSurum, setEskiSurum] = useState<{ id: string; no: number; aciklama: string; zaman: number } | null>(null);
  const [denetimIstegi, setDenetimIstegi] = useState(0);
  /* Komut paleti (Ctrl K) ve boş sohbetteki hazır istek kategorisi. */
  const [palet, setPalet] = useState(false);
  const [istekKat, setIstekKat] = useState(0);
  const [planBelgeId, setPlanBelgeId] = useState<string | null>(null);
  useEffect(() => { const t = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "k") { e.preventDefault(); setPalet((x) => !x); } }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, []);
  const [oge, setOgeHam] = useState<(Secim & { konum?: OgeBaglam["konum"] }) | null>(null);
  /** Seçili öğe sohbete eklenirken kaynaktaki yeri (dosya ve satır) bulunur; ajan doğrudan oraya gider. */
  const setOge = useCallback((s: Secim | null) => {
    if (!s) { setOgeHam(null); return; }
    const html = k.proje?.dosyalar[s.sayfa];
    const kn = html ? konumBul(html, s.secici) : null;
    const satir = (i: number) => html!.slice(0, i).split("\n").length;
    setOgeHam({ ...s, ...(kn ? { konum: { dosya: s.sayfa, satir: satir(kn.acilisBas), sonSatir: satir(Math.max(kn.acilisBas, kn.icSon)) } } : {}) });
  }, [k.proje?.dosyalar]);
  const ogeBaglam = (o: typeof oge): OgeBaglam | null => (o ? { secici: o.secici, etiket: o.etiket, metin: o.metin, ...(o.konum ? { konum: o.konum } : {}) } : null);
  const [baglantilar, setBaglantilar] = useState<Record<string, string | null>>();
  const ilkGonderildi = useRef(false);
  const komutKutu = useRef<HTMLDivElement>(null);

  /* Sohbet sütunu: sürükleyerek genişlik (hatırlanır, çift tık sıfırlar), Ctrl+B ile gizle/göster. */
  const [genislik, setGenislik] = useState(440);
  const [sohbetGizli, setSohbetGizli] = useState(false);
  useEffect(() => { const g = oku("vayra-build-sohbet-genislik", 440); setGenislik(Math.min(680, Math.max(340, g))); }, []);
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); setSohbetGizli((x) => !x); } };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, []);
  const tutamac = (e: React.PointerEvent) => {
    e.preventDefault();
    const bas = e.clientX, w0 = genislik;
    let son = w0;
    const hareket = (ev: PointerEvent) => { son = Math.min(680, Math.max(340, w0 + ev.clientX - bas)); setGenislik(son); };
    const birak = () => { removeEventListener("pointermove", hareket); removeEventListener("pointerup", birak); document.body.style.cursor = ""; document.body.style.userSelect = ""; try { localStorage.setItem("vayra-build-sohbet-genislik", JSON.stringify(son)); } catch { /* yok */ } };
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    addEventListener("pointermove", hareket); addEventListener("pointerup", birak);
  };

  const [sesAcikMi, setSesAcikMi] = useState(true);
  const [bildirimMi, setBildirimMi] = useState(false);
  useEffect(() => { setSesAcikMi(sesAcik()); setBildirimMi(bildirimAcik()); }, []);

  /* Çalışırken geçen süre sayacı */
  const [simdi, setSimdi] = useState(Date.now());
  useEffect(() => { if (!k.calisiyor) return; const t = setInterval(() => setSimdi(Date.now()), 1000); return () => clearInterval(t); }, [k.calisiyor]);

  /* Sıra: ajan çalışırken yazılan istekler sıraya girer, tur bitince sırayla gider. */
  const [kuyruk, setKuyruk] = useState<{ id: number; istem: string; ekler: KomutEki[]; oge: OgeBaglam | null; mod: Mod }[]>([]);
  const kuyrukSayac = useRef(0);

  useEffect(() => { setModel(oku("vayra-build-model", VARSAYILAN_MODEL)); fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBaglantilar(v.baglantilar)).catch(() => {}); }, []);
  const modelSec = (m: string) => { setModel(m); try { localStorage.setItem("vayra-build-model", JSON.stringify(m)); } catch { /* özel pencere */ } };

  /* Kapağı olmayan (zip, boş) projelerde ilk açılışta kapak çek. */
  const kapakIstendi = useRef(false);
  useEffect(() => { if (p && !p.kapak && p.ekipRol !== "izleyici" && p.dosyalar["index.html"] && !kapakIstendi.current) { kapakIstendi.current = true; api(`/api/build/kapak/${p.id}`, { govde: {} }).catch(() => {}); } }, [p]);

  /* form gelen kutusu sayacı */
  useEffect(() => { if (p?.id) api<{ gonderimler: FormGonderimi[] }>(`/api/build/form/${p.id}`).then((v) => { setOkunmamis(v.gonderimler.filter((x) => !x.okundu).length); setFormToplam(v.gonderimler.length); }).catch(() => {}); }, [p?.id]);

  const tahmin = useMemo(() => (p ? krediTahmini(mod, Object.keys(p.dosyalar).length, modelBul(model)) : undefined), [p, mod, model]);
  const sonDurum = useRef<string | null>(null);

  /* tur bitince gerçek krediyi düş */
  useEffect(() => {
    const son = p?.mesajlar.at(-1);
    if (!son || son.rol !== "asistan" || son.durum === "suruyor" || sonDurum.current === son.id) return;
    // Kredi sunucuda düşüldü; ekrandaki bakiye sunucuyla eşitlenir.
    if (sonDurum.current !== null && son.kredi && !son.duzeltme) buildKrediEsitle(son.kredi);
    sonDurum.current = son.id;
  }, [p?.mesajlar]);
  useEffect(() => { if (p && sonDurum.current === null) sonDurum.current = p.mesajlar.filter((m) => m.rol === "asistan").at(-1)?.id ?? ""; }, [p]);

  const gonder = useCallback((ek: Partial<Parameters<typeof k.gonder>[0]> = {}) => {
    if (!p || p.ekipRol === "izleyici") return;
    const istem = ek.istem ?? deger.trim();
    const hedefli = hedefTavan && ek.istem === undefined && (ek.mod ?? mod) === "yap";
    const g = { istem, mod: ek.mod ?? mod, model, ekler: ek.ekler ?? ekler, belgeler: ek.istem === undefined ? belgeler : [], oge: ek.oge !== undefined ? ek.oge : ogeBaglam(oge), ...(hedefli ? { hedef: { tavan: hedefTavan } } : {}), ...ek };
    if (!g.duzeltme && !g.tekrar && !g.planOnay && !g.cevap && !istem && !g.ekler?.length && !g.belgeler?.length) return;
    if (kullanici && tahmin && !g.duzeltme && kullanici.krediler < tahmin && baglantilar?.[model]) { krediModal("kredi"); return; }
    k.gonder(g);
    if (ek.istem === undefined) { setDeger(""); setEkler([]); setBelgeler([]); setHedefTavan(null); }
    setOge(null);
    setMobilSekme("sohbet");
  }, [p, deger, mod, model, ekler, belgeler, oge, k, kullanici, tahmin, baglantilar, krediModal, hedefTavan, setOge]);

  const kuyrugaEkle = () => {
    const istem = deger.trim();
    if (!istem && !ekler.length) return;
    setKuyruk((l) => [...l, { id: ++kuyrukSayac.current, istem, ekler, oge: ogeBaglam(oge), mod }].slice(0, 20));
    setDeger(""); setEkler([]); setOge(null);
  };
  /* tur bitince sıradakini gönder */
  const oncekiCalisiyor = useRef(false);
  useEffect(() => {
    const bitti = oncekiCalisiyor.current && !k.calisiyor;
    oncekiCalisiyor.current = k.calisiyor;
    if (!bitti || !p) return;
    const son = p.mesajlar.at(-1);
    // Bitiş geri bildirimi: çan + arka plandaysa masaüstü bildirimi.
    canCal(son?.durum === "hata");
    bildir(`${p.ad}`, son?.durum === "hata" ? "Bir sorun çıktı, sohbete göz at." : son?.soru ? "Ajan senden bir seçim bekliyor." : son?.plan ? "Plan hazır, onayını bekliyor." : "Değişiklikler hazır.");
    // Yeni sürüm oluştuysa proje kapağını (gerçek ekran görüntüsü) arka planda yenile.
    if (son?.surumId) api(`/api/build/kapak/${p.id}`, { govde: {} }).catch(() => {});
    if (kuyruk.length && son?.durum !== "hata" && !son?.soru && !son?.plan) {
      const [ilk, ...kalan] = kuyruk;
      setKuyruk(kalan);
      setTimeout(() => gonder({ istem: ilk.istem, ekler: ilk.ekler, mod: ilk.mod, oge: ilk.oge }), 400);
    }
  }, [k.calisiyor, p, kuyruk, gonder]);

  /* Sekme başlığı: çalışırken durum, bitince arka plandaysa "Hazır" */
  useEffect(() => {
    if (!p) return;
    const eski = document.title;
    document.title = k.calisiyor ? `Çalışıyor · ${p.ad}` : `${p.ad} · Vayra Build`;
    return () => { document.title = eski; };
  }, [k.calisiyor, p]);

  /* ana sayfadan gelen ilk istek */
  useEffect(() => {
    if (!p || ilkGonderildi.current) return;
    ilkGonderildi.current = true;
    let ilk: { istem: string; mod: Mod; model?: string; ekler: KomutEki[]; kaynakUrl?: string; tasarimIste?: boolean } | null = null;
    try { const x = sessionStorage.getItem(`vayra-build-ilk-${id}`); if (x) { ilk = JSON.parse(x); sessionStorage.removeItem(`vayra-build-ilk-${id}`); } } catch { /* yok */ }
    if (ilk && !p.mesajlar.length && (ilk.istem || ilk.ekler?.length)) {
      if (ilk.model) modelSec(ilk.model);
      k.gonder({ istem: ilk.istem, mod: ilk.mod, model: ilk.model || model, ekler: ilk.ekler, kaynakUrl: ilk.kaynakUrl, tasarimIste: ilk.tasarimIste });
    }
  }, [p, id, k, model]);

  const sonKullanici = (m: BuildMesaj) => { const l = p?.mesajlar ?? []; const i = l.findIndex((x) => x.id === m.id); return [...l.slice(0, i)].reverse().find((x) => x.rol === "kullanici"); };
  const odakla = () => { setMobilSekme("sohbet"); setTimeout(() => komutKutu.current?.querySelector("textarea")?.focus(), 40); };

  const eylemler = {
    dosyaAc: (yol: string) => { setAcilacakDosya(yol); setSekme("kod"); setMobilSekme("kod"); },
    kodSatiri: (dosya: string, satir: number) => { setAcilacakDosya(`${dosya}#${satir}#${Date.now()}`); setSekme("kod"); setMobilSekme("kod"); },
    geriDon: async (m: BuildMesaj, kod: boolean) => { if (izleyici || !p) return; try { await k.guncelle({ geriDon: { mesajId: m.id, kod } }); } catch (x) { k.setHata(x instanceof Error ? x.message : "Geri dönülemedi."); } },
    surumAc: (surumId: string) => setGecmis({ acik: true, odak: surumId }),
    geriAl: (surumId: string) => { if (!izleyici) k.guncelle({ geriYukle: surumId }).catch(() => {}); },
    planOnayla: (m: BuildMesaj) => gonder({ istem: m.plan?.duzenlendi ? `Planı elle düzenledim; şu son hâliyle onaylıyorum, uygula:
${planMetni(m.plan)}` : "Planı onaylıyorum, uygula.", mod: "yap", planOnay: { mesajId: m.id }, ekler: [], oge: null }),
    planBelge: (m: BuildMesaj) => setPlanBelgeId(m.id),
    planDegistir: () => { setMod("plan"); setDeger("Planı şöyle değiştir: "); odakla(); },
    tasarimSec: (m: BuildMesaj, i: number) => gonder({ istem: "Bu tasarımı seçtim: " + (m.tasarim?.secenekler[i]?.ad ?? "") + ". Bu yönde kur.", mod: "yap", tasarimSecim: { mesajId: m.id, secilen: i }, ekler: [], oge: null }),
    soruCevapla: (m: BuildMesaj, c: Record<string, string>) => gonder({ istem: (m.soru?.sorular ?? []).map((s) => `${s.soru}: ${c[s.id]}`).join("\n"), mod: "yap", cevap: { mesajId: m.id, cevaplar: c }, ekler: [], oge: null }),
    tekrar: (m: BuildMesaj) => { const u = sonKullanici(m); if (u) gonder({ istem: u.metin, tekrar: { mesajId: u.id }, ekler: [], oge: null }); },
    modelDegistir: () => { odakla(); komutKutu.current?.querySelector<HTMLButtonElement>("[data-model-cip]")?.click(); },
    oneri: (s: string) => gonder({ istem: s, mod: "yap", ekler: [], oge: null }),
    ogeVurgula: () => { setSekme("onizleme"); setMobilSekme("onizleme"); },
    duzenle: async (m: BuildMesaj, metin: string) => {
      const l = p?.mesajlar ?? [];
      const i = l.findIndex((x) => x.id === m.id);
      if (i < 0 || !p) return;
      const cevap = l.slice(i + 1).find((x) => x.rol === "asistan");
      const si = cevap?.surumId ? p.surumler.findIndex((s) => s.id === cevap.surumId) : -1;
      try {
        if (si > 0) await k.guncelle({ geriYukle: p.surumler[si - 1].id });
        await k.guncelle({ mesajlar: l.slice(0, i) });
      } catch { return; }
      gonder({ istem: metin, onceGeriAlindi: true, ekler: m.ekler ?? [], oge: m.oge ?? null });
    },
  };

  const yayinNoktasi = !!p && p.surumler.length > 0 && (!p.yayin || p.yayin.surumId !== p.surumler.at(-1)?.id);
  /** Yeni sohbet: ajanın bağlamı sıfırlanır, proje ve dosyalar kalır. */
  const [yeniSohbetGidiyor, setYeniSohbetGidiyor] = useState(false);
  const yeniSohbet = async () => {
    if (!p || izleyici || k.calisiyor || yeniSohbetGidiyor) return;
    setYeniSohbetGidiyor(true);
    try { await k.guncelle({ yeniSohbet: true }); setDeger(""); setOge(null); setKuyruk([]); odakla(); } catch (x) { k.setHata(x instanceof Error ? x.message : "Yeni sohbet açılamadı."); } finally { setYeniSohbetGidiyor(false); }
  };
  /* Ana sayfadaki "Kaldığın yerden devam" kartından "Yayınla" ile gelindiyse yayın paneli açılır. */
  const yayinIstegi = useRef(false);
  useEffect(() => { if (!p || yayinIstegi.current) return; yayinIstegi.current = true; try { if (new URLSearchParams(location.search).get("yayinla") === "1" && p.ekipRol !== "izleyici") { setYayin(true); history.replaceState(null, "", location.pathname); } } catch { /* yok */ } }, [p]);

  if (k.bulunamadi) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zemin px-6 text-center">
        <p className="text-[18px] font-semibold text-white">Bu proje bulunamadı</p>
        <p className="mt-1.5 max-w-[420px] text-[14px] text-white/50">Silinmiş olabilir ya da başka bir tarayıcıda oluşturulmuş. Projeler oluşturulduğu tarayıcıya bağlıdır.</p>
        <Link href="/panel/build" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Projelerime dön</Link>
      </div>
    );
  }
  if (!p) return <div className="flex min-h-screen items-center justify-center bg-zemin"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;

  const TurIkon = TUR_IKON[p.tur];
  const SEKMELER: { id: Sekme; ad: string; ikon: typeof Eye; rozet?: number }[] = [
    { id: "onizleme", ad: "Önizleme", ikon: Eye }, { id: "kod", ad: "Kod", ikon: Code2 }, { id: "veriler", ad: "Bulut", ikon: Cloud, rozet: okunmamis }, { id: "buyume", ad: "Büyüme", ikon: TrendingUp }, { id: "isletme", ad: "İşletme", ikon: Store }, { id: "ayarlar", ad: "Ayarlar", ikon: Settings2 },
  ];
  const sagSekme = mobilSekme !== "sohbet" ? mobilSekme : sekme;

  const icerik = (s: Sekme) => (
    s === "kod" ? <KodSekme k={k} acilacak={acilacakDosya} />
      : s === "veriler" ? <BulutKonsol k={k} bolum={veriBolum} setBolum={setVeriBolum} gomulu okunmamis={setOkunmamis} ajanaGonder={(m) => gonder({ duzeltme: { hata: m }, istem: "", ekler: [], oge: null })} />
        : s === "ayarlar" ? <AyarlarSekme k={k} bolum={ayarBolum} setBolum={setAyarBolum} ajanaGonder={(m) => gonder({ istem: m, mod: "yap", ekler: [], oge: null })} />
        : s === "isletme" ? <IsletmeSekme k={k} ajanaGonder={(m) => gonder({ istem: m, mod: "yap", ekler: [], oge: null })} bulutaGit={(b) => { setVeriBolum(b as BulutBolum); setSekme("veriler"); setMobilSekme("veriler"); }} alanaGit={() => { setAyarBolum("alan"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }} />
        : s === "buyume" ? <BuyumeSekme k={k} ajanaGonder={(m) => gonder({ istem: m, mod: "yap", ekler: [], oge: null })} ayaraGit={(b) => { setAyarBolum(b); setSekme("ayarlar"); setMobilSekme("ayarlar"); }} yayinla={() => setYayin(true)} />
          : <Onizleme k={k} secimIstegi={secimIstegi} secim={secim} setSecim={setSecim} mobilQr={p.tur === "mobil"} duzelt={(h) => gonder({ duzeltme: { hata: h }, istem: "", ekler: [], oge: null })} ajanaYaz={(s2) => { setOge(s2); odakla(); }} cizimEkle={izleyici ? undefined : (g2, not) => { setEkler((e) => [...e, { tur: "gorsel" as const, url: g2, ad: "cizim.jpg" }].slice(-4)); setDeger((d) => (d.trim() ? `${d.trim()}
${not}` : not)); odakla(); }} isaretleriGonder={(m) => gonder({ istem: m, mod: "yap", ekler: [], oge: null })}
            eskiSurum={eskiSurum} eskiKapat={() => setEskiSurum(null)} eskiyeDon={async (sid) => { if (izleyici) return; try { await k.guncelle({ geriYukle: sid }); setEskiSurum(null); } catch { /* sessiz */ } }} denetimIstegi={denetimIstegi} />
  );

  const bosSohbet = (
    <div className="pt-6">
      {atlanan > 0 && <p className="mb-3 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15">Zip içindeki {atlanan} dosya (görsel, yazı tipi gibi) aktarılmadı; yalnız kod dosyaları alınır. Görselleri ajana yeniden ürettirebilir ya da kitaplıktan seçtirebilirsin.</p>}
      <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
        <p className="text-[14px] font-semibold text-white">{p.sablon ? `${p.ad} hazır` : "Projen hazır"}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-white/55">{p.sablon ? "Bu proje çalışan bir şablondan kopyalandı. Sağda çalışıyor; ne değiştirmek istediğini yaz ya da önizlemede bir öğeye tıklayıp doğrudan düzenle." : "Ne yapmak istediğini aşağıya yaz. Ajan dosyaları yazdıkça önizleme sağda canlanır."}</p>
        <LayoutGroup id="istek-kat">
          <div className="mt-3 flex flex-wrap gap-1">
            {HAZIR_ISTEKLER[p.tur].map((c, i) => (
              <button key={c.id} type="button" onClick={() => setIstekKat(i)} className={cn("relative h-7 rounded-full px-2.5 text-[12px] transition-colors", istekKat === i ? "text-black" : "text-white/55 hover:text-white")}>
                {istekKat === i && <motion.span layoutId="istek-kat-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{c.ad}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(HAZIR_ISTEKLER[p.tur][istekKat] ?? HAZIR_ISTEKLER[p.tur][0]).istekler.map((s) => <motion.button layout key={s} type="button" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setDeger(s); odakla(); }} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-left text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white">{s}</motion.button>)}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-white/40"><Keyboard className="h-3.5 w-3.5" />Bütün komutlar için Ctrl K</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b0b0d] text-white">
      {/* üst çubuk */}
      <header className="relative flex h-14 shrink-0 items-center gap-2 px-3">
        <Link href="/panel/build" title="Projeler" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="relative min-w-0">
          {adlandir !== null ? (
            <form onSubmit={async (e) => { e.preventDefault(); if (adlandir.trim()) await k.guncelle({ ad: adlandir.trim() }); setAdlandir(null); }}>
              <input autoFocus value={adlandir} onChange={(e) => setAdlandir(e.target.value)} onBlur={() => setAdlandir(null)} maxLength={60} className="h-9 w-[220px] rounded-[10px] bg-white/[0.07] px-3 text-[14px] text-white outline-none ring-1 ring-inset ring-white/25" />
            </form>
          ) : (
            <button type="button" onClick={() => setMenu((x) => !x)} className="flex h-9 min-w-0 items-center gap-2 rounded-full pl-1.5 pr-2.5 transition-colors hover:bg-white/[0.06]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.08]"><TurIkon className="h-3.5 w-3.5 text-white/75" /></span>
              <span className="max-w-[200px] truncate text-[14px] font-semibold max-sm:max-w-[120px]">{p.ad}</span>
              {k.calisiyor ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" /> : <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/45 transition-transform", menu && "rotate-180")} />}
            </button>
          )}
          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={yay} className="absolute left-0 top-[calc(100%+6px)] z-50 w-[240px] rounded-[16px] bg-[#17181b] p-1.5 ring-1 ring-inset ring-white/[0.1]">
                  <button type="button" onClick={() => { setEkipAcik(true); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">
                    <Users className="h-4 w-4 text-white/50" />Ekip{!!p.ekipSayisi && <span className="ml-auto text-[11.5px] tabular-nums text-white/45">{p.ekipSayisi + 1} kişi</span>}
                  </button>
                  {sahipMi && <>
                  <button type="button" onClick={() => { setPaylasimPaneli("paylas"); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">
                    <Share2 className="h-4 w-4 text-white/50" />Paylaş{paylasiliyor && <span className="ml-auto flex items-center gap-1 text-[11.5px] text-[#a8ecff]"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Paylaşılıyor</span>}
                  </button>
                  <button type="button" onClick={() => { setPaylasimPaneli("topluluk"); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">
                    <Users className="h-4 w-4 text-white/50" />Topluluğa ekle{toplulukta && <span className="ml-auto text-[11.5px] text-[#a8ecff]">Toplulukta</span>}
                  </button>
                  </>}
                  <div className="my-1 h-px bg-white/[0.06]" />
                  {([
                    ...(izleyici ? [] : [[MessagesSquare, "Yeni sohbet", () => { yeniSohbet(); }] as const]),
                    ...(izleyici ? [] : [[PenLine, "Yeniden adlandır", () => setAdlandir(p.ad)] as const]),
                    [Copy, "Kopyasını oluştur", async () => { try { router.push(`/panel/build/${await projeOlustur({ kopya: p.id })}`); } catch { /* sessiz */ } }],
                    ...(p.taslak || izleyici ? [] : [[GitBranch, "Deneme dalı aç", async () => { try { const v = await api<{ id: string }>("/api/build/proje", { govde: { kopya: p.id, taslak: true } }); router.push(`/panel/build/${v.id}`); } catch { /* sessiz */ } }] as const]),
                    [History, "Geçmiş", () => setGecmis({ acik: true })],
                    [BookOpen, "Ajan talimatları", () => { setAyarBolum("talimat"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }],
                    ...(sahipMi ? [[Globe, "Alan adları", () => { setAyarBolum("alan"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }] as const] : []),
                    [Settings2, "Proje ayarları", () => { setAyarBolum("genel"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }],
                  ] as const).map(([I, a, f]) => (
                    <button key={a} type="button" onClick={() => { f(); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white"><I className="h-4 w-4 text-white/50" />{a}</button>
                  ))}
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button type="button" onClick={() => { setSohbetGizli((x) => !x); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white max-lg:hidden">
                    <PanelLeft className="h-4 w-4 text-white/50" />{sohbetGizli ? "Sohbeti göster" : "Sohbeti gizle"}<kbd className="ml-auto rounded-[5px] bg-white/[0.07] px-1.5 text-[10.5px] text-white/45">Ctrl B</kbd>
                  </button>
                  <Tercih ad="Bitiş sesi" acik={sesAcikMi} degis={(v) => { sesAyarla(v); setSesAcikMi(v); if (v) canCal(); }} ikon={Volume2} />
                  <Tercih ad="Bitince bildir" alt="Sekme arka plandayken" acik={bildirimMi} degis={async (v) => setBildirimMi(await bildirimAyarla(v))} ikon={Bell} />
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button type="button" onClick={() => router.push("/panel/build")} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white"><ChevronLeft className="h-4 w-4 text-white/45" />Tüm projeler</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* masaüstü sekmeleri */}
        <LayoutGroup id="build-sekme">
          <nav className="absolute left-1/2 hidden -translate-x-1/2 rounded-full bg-white/[0.05] p-0.5 lg:flex">
            {SEKMELER.map((s) => (
              <button key={s.id} type="button" onClick={() => setSekme(s.id)} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors", sekme === s.id ? "text-black" : "text-white/60 hover:text-white")}>
                {sekme === s.id && <motion.span layoutId="build-sekme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                <s.ikon className="relative h-3.5 w-3.5 max-xl:hidden" /><span className="relative whitespace-nowrap">{s.ad}</span>
                {!!s.rozet && <span className={cn("relative ml-0.5 min-w-[18px] rounded-full px-1 text-center text-[10.5px] font-semibold tabular-nums", sekme === s.id ? "bg-black text-white" : "bg-[#55d6fd] text-[#04212b]")}>{s.rozet}</span>}
              </button>
            ))}
          </nav>
        </LayoutGroup>

        <span className="ml-auto" />
        <VarlikAvatarlari kisiler={varlik.kisiler} ekibiAc={() => setEkipAcik(true)} enCok={genisEkran ? 3 : 2} />
        <EkipDugmesi ac={() => setEkipAcik(true)} sayi={p.ekipSayisi ? p.ekipSayisi + 1 : 0} />
        {!p.taslak && !izleyici && <GorevDugmesi ac={() => setGorevAcik(true)} rozet={gorevler.rozet} suren={gorevler.suren} />}
        <button type="button" title="Geçmiş" onClick={() => setGecmis({ acik: true })} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white">
          <History className="h-4 w-4" /><span className="hidden tabular-nums xl:inline">{p.surumler.length ? `Sürüm ${p.surumler.at(-1)!.no}` : "Geçmiş"}</span>
        </button>
        <button type="button" onClick={() => setYayin(true)} disabled={izleyici} title={izleyici ? "İzleyici olarak yayınlayamazsın" : undefined} className="relative flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35">
          <Rocket className="h-4 w-4" /><span className="max-sm:hidden">{p.yayin ? "Yayında" : "Yayınla"}</span>
          {yayinNoktasi && <span title="Yayınlanmamış değişiklik var" className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#55d6fd] ring-2 ring-[#0b0b0d]" />}
        </button>
      </header>
      {izleyici && <IzleyiciSeridi ekibiAc={() => setEkipAcik(true)} />}

      {/* mobil sekmeler */}
      <LayoutGroup id="build-mobil">
        <nav className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2 lg:hidden [scrollbar-width:none]">
          {[{ id: "sohbet" as Sekme, ad: "Sohbet", ikon: MessageSquare }, ...SEKMELER].map((s) => (
            <button key={s.id} type="button" onClick={() => setMobilSekme(s.id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium", mobilSekme === s.id ? "text-black" : "bg-white/[0.05] text-white/65")}>
              {mobilSekme === s.id && <motion.span layoutId="build-mobil-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
              <s.ikon className="relative h-3.5 w-3.5" /><span className="relative">{s.ad}</span>
              {"rozet" in s && !!s.rozet && <span className="relative rounded-full bg-[#55d6fd] px-1.5 text-[10px] font-semibold text-[#04212b]">{s.rozet}</span>}
            </button>
          ))}
        </nav>
      </LayoutGroup>

      <div className="flex min-h-0 flex-1">
        {/* sohbet sütunu */}
        <aside style={{ ["--sohbet-w" as string]: `${genislik}px` }}
          className={cn("relative flex min-h-0 shrink-0 flex-col max-lg:w-full lg:w-[var(--sohbet-w)]", mobilSekme !== "sohbet" && "max-lg:hidden", sohbetGizli && "lg:hidden")}>
          <DalBandi p={p} />
          {k.hata && <p className="mx-4 mt-2 rounded-[12px] bg-rose-500/10 px-3 py-2 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/15">{k.hata}</p>}
          <SohbetAkisi proje={p} canli={k.canli} eylemler={eylemler} bos={bosSohbet} calisiyor={k.calisiyor} />
          <div ref={komutKutu} className="shrink-0 px-3 pb-3 pt-1">
            {/* çalışma şeridi: canlı süre, adım sayısı, sıra */}
            <AnimatePresence>
              {k.calisiyor && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mb-2 flex items-center gap-2 px-1 text-[12.5px] text-white/60">
                  <span className="build-nokta" />
                  <span className="build-parilti font-medium">{k.durduruluyor ? "Durduruluyor" : "Çalışıyor"}</span>
                  <span className="tabular-nums text-white/45">{(() => { const s = Math.max(0, Math.floor((simdi - (k.canli?.zaman ?? simdi)) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; })()}</span>
                  {!!k.canli?.adimlar?.filter((a) => a.tur.startsWith("dosya")).length && <span className="text-white/40">· {k.canli.adimlar.filter((a) => a.tur.startsWith("dosya")).length} dosya</span>}
                  <span className="ml-auto text-white/35 max-sm:hidden">Yazmaya devam et, sıraya eklenir</span>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {kuyruk.map((q, i) => (
                <motion.div key={q.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mb-1.5 flex items-center gap-2 rounded-[14px] bg-white/[0.04] py-1.5 pl-3 pr-1.5 ring-1 ring-inset ring-white/[0.07]">
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/35">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/60">{q.istem || "Görsel"}</span>
                    <button type="button" title="Düzenle" onClick={() => { setDeger(q.istem); setEkler(q.ekler); setKuyruk((l) => l.filter((x) => x.id !== q.id)); }} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><PenLine className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Sıradan çıkar" onClick={() => setKuyruk((l) => l.filter((x) => x.id !== q.id))} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!k.calisiyor && !izleyici && <CanliHatalar p={p} duzelt={(m) => gonder({ duzeltme: { hata: m }, istem: "", ekler: [], oge: null })} />}
            {izleyici && <p className="mb-2 flex items-start gap-2 px-1 text-[12.5px] leading-relaxed text-white/60"><Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7fe0ff]" />İzleyici olarak ajana istek gönderemezsin. Değişiklik için proje sahibinden Düzenleyici rolü iste.</p>}
            {!k.calisiyor && !kuyruk.length && !izleyici && (
              <SonrakiAdimlar p={p} formGonderimi={formToplam} git={(h) => {
                if (h === "yayin") setYayin(true);
                else if (h === "alan") { setAyarBolum("alan"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }
                else if (h === "veriler") { setVeriBolum("gelen"); setSekme("veriler"); setMobilSekme("veriler"); }
                else { setSekme("onizleme"); setMobilSekme("onizleme"); if (h === "secim") setSecimIstegi((n) => n + 1); }
              }} />
            )}
            <div inert={izleyici} aria-disabled={izleyici || undefined} className={cn(izleyici && "pointer-events-none select-none opacity-50")}>
            <Komut kilit={izleyici ? "İzleyici rolündesin; istek gönderemezsin" : undefined} deger={deger} setDeger={setDeger} gonder={() => (k.calisiyor ? kuyrugaEkle() : gonder())} mod={mod} setMod={setMod} model={model} setModel={modelSec} baglantilar={baglantilar}
              ekler={ekler} setEkler={setEkler} tahmin={tahmin} calisiyor={k.calisiyor} durdur={k.durdur} kuyrugaEkle={kuyrugaEkle} dar={genislik < 520}
              oge={oge ? { etiket: oge.etiket, metin: oge.metin, konum: oge.konum ? `${oge.konum.dosya} satır ${oge.konum.satir}` : undefined } : null} ogeKaldir={() => setOge(null)}
              dosyaBirak={dosyaBirak} doluMu={!!deger.trim() || ekler.length > 0 || belgeler.length > 0}
              ustIcerik={komutOneri.ustIcerik} tusYakala={komutOneri.tusYakala} alanRef={komutAlani}
              araclar={mod === "yap" ? <button type="button" aria-pressed={!!hedefTavan} title="Hedef kipi: ajan hedefe ulaşana kadar kendi başına çalışır, kredi tavanında sorar" onClick={() => setHedefTavan((x) => (x ? null : 50))}
                className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] ring-inset transition-colors max-[420px]:hidden", hedefTavan ? "bg-white/[0.1] text-white ring-2 ring-white" : "text-white/55 ring-1 ring-white/[0.08] hover:text-white")}><Target className="h-3.5 w-3.5" />{genislik >= 520 && "Hedef"}</button> : undefined}
              ekAlani={belgeler.length || belgeYukleniyor || belgeHata || (hedefTavan && mod === "yap") ? <>
                {hedefTavan && mod === "yap" && (
                  <div className="flex w-full flex-wrap items-center gap-1.5 rounded-[14px] bg-[#55d6fd]/[0.06] px-2.5 py-2 ring-1 ring-inset ring-[#55d6fd]/20">
                    <Target className="h-3.5 w-3.5 text-[#8be6ff]" />
                    <span className="mr-1 text-[12px] text-white/80">Hedef kipi: ajan kendi başına çalışır, şu kredide durup sorar</span>
                    {[20, 50, 100, 200].map((t) => <button key={t} type="button" onClick={() => { setHedefTavan(t); setHedefOzel(""); }} className={cn("h-7 rounded-full px-2.5 text-[11.5px] tabular-nums ring-inset", hedefTavan === t && !hedefOzel ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-white/[0.08] hover:text-white")}>{t}</button>)}
                    <input value={hedefOzel} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setHedefOzel(v); if (Number(v) >= 5) setHedefTavan(Number(v)); }} placeholder="Özel" aria-label="Özel kredi tavanı" className={cn("h-7 w-[64px] rounded-full bg-white/[0.05] px-2.5 text-[11.5px] tabular-nums text-white outline-none ring-inset placeholder:text-white/40", hedefOzel ? "ring-2 ring-white" : "ring-1 ring-white/[0.08]")} />
                    <button type="button" aria-label="Hedef kipini kapat" onClick={() => setHedefTavan(null)} className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {belgeler.map((b, i) => <EkKarosu key={b.url} e={b as Ek} kaldir={() => setBelgeler((l) => l.filter((_, j) => j !== i))} />)}
                {belgeYukleniyor > 0 && <span className="flex h-12 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 text-[12px] text-white/55 ring-1 ring-inset ring-white/[0.07]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Belge okunuyor</span>}
                {belgeHata && <span className="flex h-12 items-center rounded-[12px] px-2 text-[12px] text-rose-300">{belgeHata}</span>}
              </> : undefined}
              yer={izleyici ? "İzleyici olarak istek gönderemezsin" : k.calisiyor ? (k.durduruluyor ? "Durduruluyor…" : "Sıradaki isteğini yaz…") : oge ? "Bu öğeyle ilgili ne değişsin?" : mod === "plan" ? "Ne planlayalım?" : mod === "sohbet" ? "Bir şey sor…" : "Ne değiştirmek istiyorsun?"} />
            </div>
          </div>
          {/* genişlik tutamacı */}
          <div role="separator" aria-orientation="vertical" aria-label="Sohbet genişliği" title="Sürükle: genişlik · Çift tık: sıfırla · Ctrl+B: gizle"
            onPointerDown={tutamac} onDoubleClick={() => { setGenislik(440); try { localStorage.setItem("vayra-build-sohbet-genislik", "440"); } catch { /* yok */ } }}
            className="group absolute -right-1.5 bottom-0 top-0 z-10 hidden w-3 cursor-col-resize lg:block">
            <span className="absolute left-1/2 top-1/2 h-12 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/0 transition-colors group-hover:bg-white/30" />
          </div>
        </aside>

        {/* sağ: sekme içeriği */}
        <main className={cn("relative min-w-0 flex-1 pb-2 pr-2 max-lg:px-2", mobilSekme === "sohbet" && "max-lg:hidden", sohbetGizli && "lg:pl-2")}>
          {sohbetGizli && (
            <button type="button" onClick={() => setSohbetGizli(false)} title="Sohbeti aç (Ctrl+B)" className="absolute bottom-5 left-5 z-20 hidden h-11 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black lg:flex">
              <MessageSquare className="h-4 w-4" />Sohbet{k.calisiyor && <span className="build-nokta" />}
            </button>
          )}
          <div className="h-full overflow-hidden rounded-[18px] bg-[#111214] ring-1 ring-inset ring-white/[0.07]">
            <div className="hidden h-full lg:block">{icerik(sekme)}</div>
            <div className="h-full lg:hidden">{mobilSekme !== "sohbet" && icerik(sagSekme)}</div>
          </div>
        </main>
      </div>

      <GecmisPanel k={k} acik={gecmis.acik} odak={gecmis.odak} kapat={() => setGecmis({ acik: false })} onizle={(s) => { setEskiSurum({ id: s.id, no: s.no, aciklama: s.aciklama, zaman: s.zaman }); setGecmis({ acik: false }); setSekme("onizleme"); setMobilSekme("onizleme"); }} />
      <PaylasPaneli projeId={p.id} acik={paylasimPaneli === "paylas"} kapat={() => setPaylasimPaneli(null)} toplulugaEkle={() => setPaylasimPaneli("topluluk")} />
      <ToplulugaEklePaneli projeId={p.id} acik={paylasimPaneli === "topluluk"} kapat={() => setPaylasimPaneli(null)} />
      {!p.taslak && !izleyici && <GorevPaneli projeId={p.id} acik={gorevAcik} kapat={() => { setGorevAcik(false); setGorevIstem(""); }} ilkIstem={gorevIstem} g={gorevler} anaYenile={() => { k.yukle(); k.setOnizlemeAnahtari((n) => n + 1); }} model={model} baglantilar={baglantilar} />}
      <EkipPaneli projeId={p.id} projeAd={p.ad} acik={ekipAcik} kapat={() => setEkipAcik(false)} cevrimici={varlik.kisiler} ayrildi={() => router.push("/panel/build/projeler")}
        degisti={(b) => { if (b.rol !== (p.ekipRol ?? "sahip")) k.yukle(); else if (b.uyeler.length !== (p.ekipSayisi ?? 0)) k.setProje((x) => (x ? { ...x, ekipSayisi: b.uyeler.length } : x)); }} />
      {(() => { const pm = p.mesajlar.find((x) => x.id === planBelgeId); return pm?.plan ? (
        <PlanBelgesi acik={!!planBelgeId} kapat={() => setPlanBelgeId(null)} plan={pm.plan} kilitli={izleyici || k.calisiyor}
          kaydet={async (yeni) => { await k.guncelle({ mesajlar: p.mesajlar.map((x) => (x.id === pm.id ? { ...x, plan: yeni } : x)) }); }}
          onayla={(yeni) => gonder({ istem: yeni.duzenlendi ? `Planı elle düzenledim; şu son hâliyle onaylıyorum, uygula:
${planMetni(yeni)}` : "Planı onaylıyorum, uygula.", mod: "yap", planOnay: { mesajId: pm.id }, ekler: [], oge: null })}
          yorumla={(secili, yorum) => { setMod("plan"); gonder({ istem: `Plandaki şu kısmı yalnız yorumuma göre yeniden yaz; planın geri kalanını aynen koru ve güncel planı yeniden sun.
Seçili kısım: «${secili}»
Yorumum: ${yorum}`, mod: "plan", ekler: [], oge: null }); }} />
      ) : null; })()}
      <KomutPaleti acik={palet} kapat={() => setPalet(false)} komutlar={(() => {
        const git = (x: Sekme) => { setSekme(x); setMobilSekme(x); };
        const l: PaletKomutu[] = [
          ...SEKMELER.map((x) => ({ id: `s-${x.id}`, grup: "Sekmeler", ad: x.ad, ikon: x.ikon, calistir: () => git(x.id) })),
          ...(izleyici ? [] : [
            { id: "e-yayin", grup: "Eylemler", ad: "Yayınla", alt: p.yayin ? "Değişiklikleri yayına al" : "Siteyi herkese aç", ikon: Rocket, calistir: () => setYayin(true) },
            { id: "e-sec", grup: "Eylemler", ad: "Öğe seç ve tasarla", alt: "Önizlemede tıkla; yazı, boşluk, renk, kenarlık", ikon: MousePointer2, calistir: () => { git("onizleme"); setSecimIstegi((n) => n + 1); } },
            { id: "e-denetim", grup: "Eylemler", ad: "Erişilebilirlik ve performans denetimi", alt: "Puan ve tek tıkla düzeltme", ikon: Gauge, anahtar: "lighthouse hız", calistir: () => { git("onizleme"); setDenetimIstegi((n) => n + 1); } },
            { id: "e-yeni-sohbet", grup: "Eylemler", ad: "Yeni sohbet", alt: "Ajanın bağlamını sıfırla; proje ve dosyalar kalır", ikon: MessagesSquare, anahtar: "bağlam sıfırla temizle", calistir: () => { yeniSohbet(); } },
            { id: "e-plan", grup: "Eylemler", ad: "Plan kipine geç", alt: "Önce plan, onaydan sonra kod", ikon: BookOpen, calistir: () => { setMod("plan"); odakla(); } },
            { id: "e-sohbet", grup: "Eylemler", ad: "Sohbet kipine geç", alt: "Kodu değiştirmeden konuş", ikon: MessageSquare, calistir: () => { setMod("sohbet"); odakla(); } },
            { id: "e-hedef", grup: "Eylemler", ad: "Hedef kipini aç", alt: "Ajan kredi tavanına kadar kendi başına çalışır", ikon: Target, calistir: () => { setMod("yap"); setHedefTavan(50); odakla(); } },
            ...(p.taslak ? [] : [{ id: "e-gorev", grup: "Eylemler", ad: "Paralel görev başlat", alt: "Kopyada arka planda çalışır", ikon: GitBranch, calistir: () => setGorevAcik(true) }]),
          ]),
          { id: "e-gecmis", grup: "Eylemler", ad: "Geçmiş", alt: `${p.surumler.length} sürüm`, ikon: History, calistir: () => setGecmis({ acik: true }) },
          { id: "e-ekip", grup: "Eylemler", ad: "Ekip", ikon: Users, calistir: () => setEkipAcik(true) },
          ...(sahipMi ? [{ id: "e-paylas", grup: "Eylemler", ad: "Paylaş", ikon: Share2, calistir: () => setPaylasimPaneli("paylas") }] : []),
          { id: "e-talimat", grup: "Eylemler", ad: "Ajan talimatları", ikon: BookOpen, calistir: () => { setAyarBolum("talimat"); git("ayarlar"); } },
          { id: "e-gizle", grup: "Eylemler", ad: sohbetGizli ? "Sohbeti göster" : "Sohbeti gizle", ikon: PanelLeft, kisayol: "Ctrl B", calistir: () => setSohbetGizli((x) => !x) },
          ...(izleyici ? [] : HAZIR_ISTEKLER[p.tur].flatMap((c) => c.istekler.map((x) => ({ id: `i-${x}`, grup: "Hazır istekler", ad: x, alt: c.ad, ikon: Kivilcim, calistir: () => { setDeger(x); odakla(); } })))),
          ...Object.keys(p.dosyalar).sort().map((y) => ({ id: `d-${y}`, grup: "Dosyalar", ad: y, ikon: FileCode2, calistir: () => eylemler.dosyaAc(y) })),
          ...[...p.surumler].reverse().slice(0, 30).map((x) => ({ id: `v-${x.id}`, grup: "Sürümler", ad: `Sürüm ${x.no}`, alt: x.aciklama, ikon: History, anahtar: "sürüm", calistir: () => { if (x.id === p.surumler.at(-1)?.id) { setEskiSurum(null); } else setEskiSurum({ id: x.id, no: x.no, aciklama: x.aciklama, zaman: x.zaman }); git("onizleme"); } })),
        ];
        return l;
      })()} />
      <YayinPanel k={k} acik={yayin} kapat={() => setYayin(false)} duzelt={(m) => { setYayin(false); gonder({ duzeltme: { hata: `Yayın öncesi denetimde şunlar bulundu, hepsini düzelt:\n${m}` }, istem: "", ekler: [], oge: null }); }} gecmisAc={() => { setYayin(false); setGecmis({ acik: true }); }} alanAdinaGit={() => { setYayin(false); setAyarBolum("alan"); setSekme("ayarlar"); setMobilSekme("ayarlar"); }} />
    </div>
  );
}
