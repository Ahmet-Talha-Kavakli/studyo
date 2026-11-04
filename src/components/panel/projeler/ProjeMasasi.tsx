"use client";

/**
 * PROJELER (2026-10-29, "3 · Ray + tablo" + Higgsfield proje yönetimi):
 * solda ray (Yeni proje, arama, görünümler, renkli klasörler, son projeler, şablon kartı),
 * sağda klasöre göre gruplu tablo kartları. Satır açılınca kare şeridi, proje içi klasörler,
 * @elementler ve eylemler. Projeler satırdan sürüklenip raydaki klasöre bırakılarak taşınır.
 * Veri ortak: proje = useProje (useSinema), varlık = useProjeler.uretimler.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { ArrowDownWideNarrow, ArrowRight, AtSign, AudioLines, Check, ChevronDown, ChevronRight, Clapperboard, Clock, CornerDownRight, FileStack, Folder, FolderInput, FolderPlus, Lock, Users, Globe, ImageIcon, LayoutGrid, Library, Link2, Loader2, Megaphone, MoreHorizontal, Music, Sparkles, Pencil, Pin, PinOff, Plus, Search, Trash2, Wand2, X, Drama, Film, Mountain, Rocket, Smartphone, Tag, Tv, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Yuzen } from "@/components/ui/Yuzen";
import { useProje, type Proje } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { Hap, KART } from "@/components/kitaplik/KitaplikKarti";
import { gorece, gorselMi, projeOzetiCikar, type ProjeOzet } from "./projeVeri";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { Agac, AgacBolumu, AgacEylem, AgacSatiri } from "@/components/panel/proje/calisma/Agac";
import { YeniProjeModal } from "./ProjeModallar";
import { AdPaneli, SilPaneli } from "@/components/panel/proje/calisma/YanPanel";
import { AltProjePenceresi } from "@/components/panel/proje/calisma/Ayarlar";

const ease = [0.22, 1, 0.36, 1] as const;
const yay = { type: "spring", stiffness: 420, damping: 36 } as const;
const SERIT = "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5";
const SUTUN = "md:grid-cols-[minmax(0,2.3fr)_140px_minmax(0,1.5fr)_110px_110px_72px] xl:grid-cols-[minmax(0,2.3fr)_140px_minmax(0,1.4fr)_96px_104px_104px_100px_72px]";
const MENU = "rounded-[16px] border border-white/[0.08] bg-[#151517] p-1.5";
const MSATIR = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/85 transition-colors hover:bg-white/[0.075] hover:text-white";

export const SABLONLAR = [
  { ad: "Kısa film", tur: "Kısa film", alt: "Sahne sahne sinematik çekim", img: "/gercek/galeri/sinematik6.webp", renk: "#55d6fd" },
  { ad: "Reklam", tur: "Reklam", alt: "Ürün görseli ve UGC video", img: "/gercek/galeri/urun3.webp", renk: "#fb923c" },
  { ad: "Müzik videosu", tur: "Müzik videosu", alt: "Şarkı ve ritimli klipler", img: "/gercek/sinema/ps-rapflex.webp", renk: "#4ade80" },
  { ad: "Karakter seti", tur: "Karakter", alt: "Aynı yüz, farklı sahneler", img: "/gercek/element/nova-on.webp", renk: "#f472b6" },
];

type Gorunum = "tumu" | "son" | "sabit" | "yayin" | "bos" | `k:${string}`;
const SIRALAR: { id: string; ad: string; f: (a: Oz, b: Oz) => number }[] = [
  { id: "degisen", ad: "Son düzenlenen", f: (a, b) => b.zaman - a.zaman },
  { id: "son", ad: "Son oluşturulan", f: (a, b) => (b.p.olusturma ?? 0) - (a.p.olusturma ?? 0) },
  { id: "varlik", ad: "En çok üretim", f: (a, b) => b.toplam - a.toplam },
  { id: "az", ad: "Ada göre", f: (a, b) => a.p.ad.localeCompare(b.p.ad, "tr") },
];
const HAFTA = 7 * 86_400_000;

type Oz = ProjeOzet & { ait: Uretim[] };
type Klasor = { id: string; ad: string; renk: string; n: number };

export function ProjeMasasi() {
  const router = useRouter();
  const tum = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const ozetler: Oz[] = useMemo(() => tum.filter((p) => !p.klasor).map((p) => {
    const ref = new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]);
    return { ...projeOzetiCikar(p, uretimler), ait: uretimler.filter((u) => u.projeId === p.id || ref.has(u.id)).sort((a, b) => b.olusturma - a.olusturma) };
  }), [tum, uretimler]);
  const klasorler: Klasor[] = useMemo(() => tum.filter((p) => p.klasor).map((k) => ({ id: k.id, ad: k.ad, renk: k.renk ?? "#55d6fd", n: ozetler.filter((o) => o.p.klasorId === k.id).length })), [tum, ozetler]);

  const [gorunum, setGorunum] = useState<Gorunum>("tumu");
  const [arama, setArama] = useState("");
  const [sira, setSira] = useState("degisen");
  const [acik, setAcik] = useState<string | null>(null);
  const [yeni, setYeni] = useState<null | { tur?: string; renk?: string; ad?: string }>(null);
  /* Başka yerden "Yeni proje" ile gelinince (?yeni=1) pencere doğrudan açılır. */
  useEffect(() => { const u = new URL(window.location.href); if (u.searchParams.get("yeni") === "1") { setYeni({}); u.searchParams.delete("yeni"); window.history.replaceState(null, "", u.pathname + u.search); } }, []);
  const [adDuzenle, setAdDuzenle] = useState<Proje | null>(null);
  const [surukle, setSurukle] = useState<string | null>(null);
  const aramaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const yaziyor = /INPUT|TEXTAREA/.test(t.tagName) || t.isContentEditable;
      if ((e.key === "/" && !yaziyor) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); e.stopImmediatePropagation(); aramaRef.current?.focus(); }
    };
    /* Yakalama aşaması: sitenin genel Ctrl K araması bu sayfada proje aramasına yol verir. */
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, []);

  const simdi = hazir ? Date.now() : 0;
  const suz = (o: Oz, g: Gorunum) => g === "tumu" ? true : g === "son" ? !!o.zaman && simdi - o.zaman < HAFTA : g === "sabit" ? !!o.p.sabit
    : g === "yayin" ? !!o.p.yayinda : g === "bos" ? o.toplam === 0 : o.p.klasorId === g.slice(2);
  const sayi = (g: Gorunum) => ozetler.filter((o) => suz(o, g)).length;
  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const f = SIRALAR.find((s) => s.id === sira)!.f;
    return ozetler.filter((o) => suz(o, gorunum) && (!q || `${o.p.ad} ${o.p.tur} ${o.p.aciklama ?? ""}`.toLocaleLowerCase("tr").includes(q)))
      .sort((a, b) => Number(!!b.p.sabit) - Number(!!a.p.sabit) || f(a, b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ozetler, arama, sira, gorunum, simdi]);
  /* Tüm projelerde klasöre göre grupla; diğer görünümlerde tek grup. */
  const agacModu = gorunum === "tumu" && !arama.trim();
  const cocuklar = useMemo(() => {
    const m = new Map<string, Oz[]>();
    const idler = new Set(ozetler.map((o) => o.p.id));
    for (const o of gorunen) if (o.p.ustProjeId && idler.has(o.p.ustProjeId)) m.set(o.p.ustProjeId, [...(m.get(o.p.ustProjeId) ?? []), o]);
    return m;
  }, [gorunen, ozetler]);
  const [kapaliAlt, setKapaliAlt] = useState<string[]>([]);
  const gruplar = useMemo(() => {
    if (gorunum !== "tumu") return [{ id: "tek", ad: "", renk: "", liste: gorunen }];
    const idler = new Set(ozetler.map((o) => o.p.id));
    const kokMu = (o: Oz) => !agacModu || !o.p.ustProjeId || !idler.has(o.p.ustProjeId);
    const m: { id: string; ad: string; renk: string; liste: Oz[] }[] = klasorler.map((k) => ({ id: k.id, ad: k.ad, renk: k.renk, liste: gorunen.filter((o) => kokMu(o) && o.p.klasorId === k.id) }));
    const kok = gorunen.filter((o) => kokMu(o) && (!o.p.klasorId || !klasorler.some((k) => k.id === o.p.klasorId)));
    return [...m.filter((g) => g.liste.length), ...(kok.length ? [{ id: "kok", ad: klasorler.length ? "Klasörsüz" : "", renk: "", liste: kok }] : [])];
  }, [gorunum, gorunen, klasorler, ozetler, agacModu]);
  const [altProje, setAltProje] = useState<Proje | null>(null);
  const [silinecek, setSilinecek] = useState<Proje | null>(null);
  const ustAdi = (o: Oz) => (o.p.ustProjeId ? tum.find((x) => x.id === o.p.ustProjeId)?.ad : undefined);

  const { projeOlustur, projeSil, projeGuncelle, projeSabitle, projeTasi, klasorOlustur } = useProje.getState();
  const projeSilGeriAl = (p: Proje, ne = "projesi") => {
    const once = useProje.getState().projeler;
    projeSil(p.id);
    toast(`"${p.ad}" ${ne} silindi`, {
      description: p.klasor ? "İçindeki projeler Klasörsüz grubuna taşındı." : "Üretimler kitaplıkta kalır.",
      action: { label: "Geri al", onClick: () => useProje.setState({ projeler: once }) },
    });
  };
  const tasi = (o: Oz, kid?: string) => {
    if (o.p.klasorId === kid) return;
    projeTasi(o.p.id, kid);
    const k = klasorler.find((x) => x.id === kid);
    toast.success(k ? `"${o.p.ad}", ${k.ad} klasörüne taşındı` : `"${o.p.ad}" klasörden çıkarıldı`);
  };
  const yeniKlasor = () => {
    const id = klasorOlustur("Yeni klasör");
    useProje.getState().projeGuncelle(id, { renk: ["#55d6fd", "#f472b6", "#a3e635", "#fb923c", "#a78bfa"][klasorler.length % 5] });
    setAdDuzenle(useProje.getState().projeler.find((p) => p.id === id) ?? null);
  };
  const olustur = (ad: string, tur: string, renk: string) => {
    const id = projeOlustur(ad, tur, { kaynakStudyo: "Projeler", renk });
    if (gorunum.startsWith("k:")) projeTasi(id, gorunum.slice(2));
    setYeni(null);
    router.push(`/panel/projeler/${id}`);
  };
  const islem = { onSabitle: (o: Oz) => { projeSabitle(o.p.id); toast.success(o.p.sabit ? "Sabitleme kaldırıldı" : "Proje sabitlendi", { description: o.p.sabit ? undefined : "Listenin en üstünde durur." }); },
    onAd: (o: Oz) => setAdDuzenle(o.p), onLink: (o: Oz) => { void mesaj.kopyala(`${location.origin}/panel/projeler/${o.p.id}`, "Proje bağlantısı"); },
    onSil: (o: Oz) => setSilinecek(o.p), onTasi: tasi, onAlt: (o: Oz) => setAltProje(o.p), onAc: (o: Oz) => router.push(`/panel/projeler/${o.p.id}`) };

  const gorunumAdi = gorunum === "tumu" ? "Tüm projeler" : gorunum === "son" ? "Son açılanlar" : gorunum === "sabit" ? "Sabitlenenler" : gorunum === "yayin" ? "Yayında" : gorunum === "bos" ? "Boş taslaklar" : klasorler.find((k) => `k:${k.id}` === gorunum)?.ad ?? "Klasör";
  const varlikToplam = ozetler.reduce((t, o) => t + o.toplam, 0);
  const gorunumAlt = gorunum === "tumu" ? [klasorler.length && `${klasorler.length} klasör`, varlikToplam && `${varlikToplam} varlık`, "klasörlere göre gruplu"].filter(Boolean).join(" · ").replace(/^./, (h) => h.toLocaleUpperCase("tr"))
    : gorunum === "son" ? "Son bir haftada açtığın ya da üretim yaptığın projeler" : gorunum === "sabit" ? "Listenin en üstünde tuttukların"
    : gorunum === "yayin" ? "Bağlantısı paylaşılan projeler" : gorunum === "bos" ? "Henüz içinde üretim olmayan projeler" : "Satırları buraya sürükleyerek taşıyabilirsin";
  const agacVar = agacModu && cocuklar.size > 0;
  const sec = (g: Gorunum) => { setGorunum(g); setAcik(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]" />;

  return (
    <MotionConfig reducedMotion="user">
      <div data-mikro className="flex min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c]">
        <Ray sablonGizle={ozetler.every((o) => o.toplam === 0)} ozetler={ozetler} klasorler={klasorler} gorunum={gorunum} sayi={sayi} onGorunum={sec} arama={arama} setArama={setArama} aramaRef={aramaRef}
          surukle={surukle} onBirak={(kid) => { const o = ozetler.find((x) => x.p.id === surukle); if (o) tasi(o, kid); setSurukle(null); }}
          onYeni={() => setYeni({})} onSablon={(t) => setYeni({ tur: t.tur, renk: t.renk, ad: t.ad })} onYeniKlasor={yeniKlasor}
          onKlasorAd={(id) => setAdDuzenle(tum.find((p) => p.id === id) ?? null)} onKlasorSil={(id) => setSilinecek(tum.find((p) => p.id === id) ?? null)}
          onProje={(id) => { setGorunum("tumu"); setArama(""); setAcik(id); setTimeout(() => document.getElementById(`proje-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120); }} />

        <main className="min-w-0 flex-1 px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pt-7">
          <MobilUst ozetler={ozetler} klasorler={klasorler} gorunum={gorunum} sayi={sayi} onGorunum={sec} arama={arama} setArama={setArama} onYeni={() => setYeni({})} />

          <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className={cn(KART, "flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white">
              {gorunum.startsWith("k:") ? <MacKlasor renk={klasorler.find((k) => `k:${k.id}` === gorunum)?.renk ?? "#4aa8f0"} className="h-[17px] w-[22px]" kapali /> : <GorunumIkon g={gorunum} />}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.02em] text-white">
                <span className="truncate">{gorunumAdi}</span><motion.span key={gorunen.length} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Hap>{gorunen.length}</Hap></motion.span>
              </h1>
              <p className="mt-0.5 truncate text-[12.5px] text-white/55">{gorunumAlt}</p>
            </div>
            {ozetler.length > 0 && <SiraMenusu sira={sira} setSira={setSira} />}
          </motion.header>

          {ozetler.length === 0 ? <IlkAdim onYeni={() => setYeni({})} onSablon={(t) => setYeni({ tur: t.tur, renk: t.renk, ad: t.ad })} /> : gorunen.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(KART, "mt-4 flex flex-wrap items-center gap-3.5 p-4 sm:p-5")}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white">{arama ? <Search className="h-5 w-5" /> : <Folder className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15.5px] font-semibold text-white">{arama ? "Eşleşen proje yok" : "Burada henüz proje yok"}</p>
                <p className="mt-0.5 text-[13px] text-white/60">{arama ? `"${arama}" ile eşleşen bir proje bulunamadı.` : gorunum.startsWith("k:") ? "Projeleri satırdan sürükleyip soldaki klasöre bırakabilir ya da menüden taşıyabilirsin." : "Bu görünüme uyan proje yok."}</p>
              </div>
              {arama ? <motion.button whileTap={{ scale: 0.96 }} onClick={() => setYeni({ ad: arama })} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />&quot;{arama}&quot; adıyla oluştur</motion.button>
                : <motion.button whileTap={{ scale: 0.96 }} onClick={() => setYeni({})} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni proje</motion.button>}
            </motion.div>
          ) : (
            <div className="mt-4 space-y-4">
              {gorunum === "tumu" && !arama && ozetler.every((o) => o.toplam === 0) && <IlkAdim dolu onYeni={() => setYeni({})} onSablon={(t) => setYeni({ tur: t.tur, renk: t.renk, ad: t.ad })} />}
              {gruplar.map((g, gi) => (
                <motion.section key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05, duration: 0.45, ease }} className={KART}
                  onDragOver={(e) => { if (surukle && g.id !== "tek") e.preventDefault(); }} onDrop={() => { const o = ozetler.find((x) => x.p.id === surukle); if (o && g.id !== "tek") tasi(o, g.id === "kok" ? undefined : g.id); setSurukle(null); }}>
                  {g.ad && (
                    <header className={SERIT}>
                      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-white">
                        <MacKlasor renk={g.renk || "#8e8e93"} className="h-[15px] w-[19px]" kapali /><span className="truncate">{g.ad}</span><Hap>{g.liste.length}</Hap>
                      </h2>
                    </header>
                  )}
                  {gi === 0 && (
                    <div aria-hidden className={cn("hidden items-center gap-4 border-b border-white/[0.06] px-4 py-2.5 text-[12px] font-medium text-white/50 sm:px-5 md:grid", SUTUN)}>
                      <span className={cn(agacVar && "pl-8")}>Proje</span><span>Tür</span><span>İçerik</span><span className="hidden xl:block">Sahne</span><span className="hidden xl:block">Erişim</span><span>Düzenlendi</span><span>Durum</span><span />
                    </div>
                  )}
                  {g.liste.map((o) => {
                    const ciz = (x: Oz, d: number): React.ReactNode => {
                      const alt = agacModu ? cocuklar.get(x.p.id) ?? [] : [];
                      const altAcik = !kapaliAlt.includes(x.p.id);
                      return (
                        <div key={x.p.id}>
                          <Satir o={x} derinlik={d} altSayi={alt.length} altAcik={altAcik} onAltAcKapat={() => setKapaliAlt((s) => (altAcik ? [...s, x.p.id] : s.filter((y) => y !== x.p.id)))}
                            ust={agacModu ? undefined : ustAdi(x)} acik={acik === x.p.id} onAc={() => setAcik(acik === x.p.id ? null : x.p.id)} klasorler={klasorler} islem={islem}
                            onSurukle={(v) => setSurukle(v ? x.p.id : null)} surukleniyor={surukle === x.p.id} agacVar={agacVar} />
                          {altAcik && alt.map((c) => ciz(c, d + 1))}
                        </div>
                      );
                    };
                    return ciz(o, 0);
                  })}
                </motion.section>
              ))}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {yeni && <YeniProjeModal key="yeni" baslangic={yeni} onKapat={() => setYeni(null)} onOlustur={olustur} />}
        {altProje && <AltProjePenceresi key="alt" ust={altProje} onKapat={() => setAltProje(null)} />}
        {silinecek && (() => {
          const k = silinecek, ic = tum.filter((x) => x.klasorId === k.id && !x.klasor).length, alt = tum.filter((x) => x.ustProjeId === k.id && !x.klasor).length;
          const ozet = ozetler.find((o) => o.p.id === k.id);
          return <SilPaneli key="sil" baslik={k.klasor ? "Klasörü sil" : "Projeyi sil"} ad={k.ad} renk={k.renk} eylem={k.klasor ? "Klasörü sil" : "Projeyi sil"} onKapat={() => setSilinecek(null)}
            aciklama={k.klasor ? (ic ? `İçindeki ${ic} proje silinmez, Klasörsüz grubuna taşınır.` : "Klasör boş; yalnız klasör kaldırılır.")
              : `Proje, brifi, elementleri ve klasörleriyle kaldırılır.${ozet?.toplam ? ` Ürettiğin ${ozet.toplam} varlık kitaplıkta kalır.` : ""}${alt ? ` ${alt} alt proje en üst düzeye taşınır.` : ""}`}
            onSil={() => { if (k.klasor && gorunum === `k:${k.id}`) setGorunum("tumu"); setSilinecek(null); projeSilGeriAl(k, k.klasor ? "klasörü" : "projesi"); }} />;
        })()}
        {adDuzenle && <AdPaneli key="ad" ad={adDuzenle.ad} tur={adDuzenle.klasor ? "klasör" : "proje"} renk={adDuzenle.renk} onKapat={() => setAdDuzenle(null)} onKaydet={(ad) => { projeGuncelle(adDuzenle.id, { ad }); setAdDuzenle(null); toast.success(adDuzenle.klasor ? "Klasör adı güncellendi" : "Proje adı güncellendi", { description: `Yeni ad: ${ad}.` }); }} />}
      </AnimatePresence>
    </MotionConfig>
  );
}

/* ── Sol ray ── */
function Ray({ sablonGizle, ozetler, klasorler, gorunum, sayi, onGorunum, arama, setArama, aramaRef, surukle, onBirak, onYeni, onSablon, onYeniKlasor, onKlasorAd, onKlasorSil, onProje }: {
  sablonGizle: boolean; ozetler: Oz[]; klasorler: Klasor[]; gorunum: Gorunum; sayi: (g: Gorunum) => number; onGorunum: (g: Gorunum) => void;
  arama: string; setArama: (s: string) => void; aramaRef: React.RefObject<HTMLInputElement | null>;
  surukle: string | null; onBirak: (kid?: string) => void;
  onYeni: () => void; onSablon: (t: (typeof SABLONLAR)[number]) => void; onYeniKlasor: () => void; onKlasorAd: (id: string) => void; onKlasorSil: (id: string) => void; onProje: (id: string) => void;
}) {
  const [hedef, setHedef] = useState<string | null>(null);
  const [klasorAcik, setKlasorAcik] = useState(true);
  const [gezginAcik, setGezginAcik] = useState(true);
  const [kapali, setKapali] = useState<string[]>([]);
  /* VS Code gezgini: kök projeler ve altları, en son düzenlenen üstte. */
  const gezgin = useMemo(() => {
    const idler = new Set(ozetler.map((o) => o.p.id));
    const sirali = [...ozetler].sort((a, b) => b.zaman - a.zaman);
    const out: React.ReactNode[] = [];
    const gez = (o: Oz, d: number) => {
      const alt = sirali.filter((x) => x.p.ustProjeId === o.p.id);
      const acik = !kapali.includes(o.p.id);
      out.push(<AgacSatiri key={o.p.id} d={d} altVar={alt.length > 0} acik={acik} onAcKapat={() => setKapali((s) => (acik ? [...s, o.p.id] : s.filter((x) => x !== o.p.id)))}
        href={`/panel/projeler/${o.p.id}`} title={o.p.ad} simge={<MacKlasor renk={o.p.renk ?? "#4aa8f0"} className="h-[14px] w-[18px]" kapali />}
        ad={o.p.ad} bilgi={o.zaman ? gorece(o.zaman) : undefined} />);
      if (acik) for (const c of alt) gez(c, d + 1);
    };
    for (const o of sirali) if (!o.p.ustProjeId || !idler.has(o.p.ustProjeId)) gez(o, 0);
    return out;
  }, [ozetler, kapali]);
  const GORUNUMLER: [Gorunum, string, React.ElementType][] = [["tumu", "Tüm projeler", LayoutGrid], ["son", "Son 7 gün", Clock], ["sabit", "Sabitlenenler", Pin], ["yayin", "Yayında", Globe], ["bos", "Boş taslaklar", FileStack]];
  return (
    <aside className="sticky top-[var(--ust-nav)] hidden h-[calc(100dvh-var(--ust-nav))] w-[300px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
      <div className="space-y-2 px-3 pt-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onYeni} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90"><Plus className="h-4 w-4" />Yeni proje</motion.button>
        <label className="group flex h-10 items-center gap-2.5 rounded-[12px] bg-white/[0.055] px-3 ring-1 ring-inset ring-white/[0.06] transition focus-within:bg-white/[0.08] hover:bg-white/[0.085]">
          <Search className="h-4 w-4 shrink-0 text-white/50 group-focus-within:text-white" />
          <input ref={aramaRef} value={arama} onChange={(e) => setArama(e.target.value)} onKeyDown={(e) => e.key === "Escape" && (setArama(""), e.currentTarget.blur())} placeholder="Proje ara" aria-label="Projelerde ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          {arama ? <button onClick={() => setArama("")} aria-label="Aramayı temizle" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button> : <kbd className="rounded-md bg-white/[0.08] px-1.5 text-[11px] text-white/50">Ctrl K</kbd>}
        </label>
      </div>
      <nav aria-label="Projeler" className="gizli-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)]">
        <LayoutGroup id="proje-ray">
          {GORUNUMLER.map(([g, ad, I]) => <RaySatir key={g} ad={ad} ikon={I} n={sayi(g)} a={gorunum === g} onClick={() => onGorunum(g)} />)}

          <AgacBolumu ad="Klasörler" acik={klasorAcik} onAcKapat={() => setKlasorAcik((v) => !v)} sayi={klasorler.length || undefined}
            eylem={<AgacEylem onClick={onYeniKlasor} etiket="Yeni klasör"><FolderPlus className="h-3.5 w-3.5" /></AgacEylem>}>
            <Agac etiket="Klasörler">
              {klasorler.map((k) => (
                <div key={k.id} className="relative">
                  <AgacSatiri d={0} secili={gorunum === `k:${k.id}`} onClick={() => onGorunum(`k:${k.id}`)} hedef={hedef === k.id}
                    onDragOver={(e) => { if (surukle) { e.preventDefault(); setHedef(k.id); } }} onDrop={(e) => { e.preventDefault(); setHedef(null); onBirak(k.id); }}
                    simge={<MacKlasor renk={k.renk} className="h-[14px] w-[18px]" kapali />} ad={k.ad} bilgi={k.n || undefined}
                    eylem={<>
                      <AgacEylem onClick={() => onKlasorAd(k.id)} etiket="Yeniden adlandır"><Pencil className="h-3 w-3" /></AgacEylem>
                      <AgacEylem onClick={() => onKlasorSil(k.id)} etiket="Klasörü sil"><Trash2 className="h-3 w-3" /></AgacEylem>
                    </>} />
                </div>
              ))}
              <AgacSatiri d={0} onClick={onYeniKlasor} simge={<FolderPlus className="h-4 w-4 text-white/45" />} ad={<span className="text-white/55">Yeni klasör</span>} />
            </Agac>
          </AgacBolumu>

          {ozetler.length > 0 && (
            <AgacBolumu ad="Gezgin" acik={gezginAcik} onAcKapat={() => setGezginAcik((v) => !v)} sayi={ozetler.length}>
              <Agac etiket="Tüm projeler ağacı">{gezgin}</Agac>
            </AgacBolumu>
          )}
        </LayoutGroup>
      </nav>
      {!sablonGizle && <div className="border-t border-white/[0.06] p-3">
        <div className="rounded-[18px] bg-white/[0.055] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="px-1 pb-2 text-[12.5px] text-white/60">Şablondan başla</p>
          <div className="grid grid-cols-4 gap-1.5">
            {SABLONLAR.map((t) => (
              <button key={t.ad} onClick={() => onSablon(t)} title={t.ad} aria-label={`${t.ad} şablonuyla başla`} className="group relative aspect-square overflow-hidden rounded-[9px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <span className="absolute inset-0 ring-1 ring-inset ring-white/10" />
              </button>
            ))}
          </div>
        </div>
      </div>}
    </aside>
  );
}

function RaySatir({ ad, ikon: I, renk, n, a, onClick, sagBosluk }: { ad: string; ikon?: React.ElementType; renk?: string; n?: number; a: boolean; onClick: () => void; sagBosluk?: boolean }) {
  return (
    <button onClick={onClick} aria-current={a ? "page" : undefined}
      className={cn("relative flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] transition-colors", a ? "font-semibold text-white" : "text-white/70 hover:bg-white/[0.055] hover:text-white")}>
      {a && <motion.span layoutId="proje-ray-zemin" transition={yay} className="absolute inset-0 rounded-[12px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" />}
      {renk ? <Folder className="relative h-[18px] w-[18px] shrink-0" style={{ color: renk }} /> : I && <I className={cn("relative h-[18px] w-[18px] shrink-0", a && "text-[#55d6fd]")} strokeWidth={a ? 2.1 : 1.8} />}
      <span className="relative min-w-0 flex-1 truncate">{ad}</span>
      {!!n && <motion.span key={n} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={yay} className={cn("relative min-w-[22px] rounded-full px-1.5 text-center text-[11.5px] font-medium leading-5 tabular-nums transition-opacity", a ? "bg-white/[0.12] text-white/85" : "bg-white/[0.085] text-white/60", sagBosluk && "group-hover/k:opacity-0")}>{n}</motion.span>}
    </button>
  );
}

function KlasorMenu({ a, onAd, onSil }: { a: boolean; onAd: () => void; onSil: () => void }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className={cn("absolute right-1 top-1/2 -translate-y-1/2 transition-opacity", acik ? "opacity-100" : "opacity-0 group-hover/k:opacity-100")}>
      <button onClick={() => setAcik((v) => !v)} aria-label="Klasör eylemleri" aria-expanded={acik} className={cn("flex h-7 w-7 items-center justify-center rounded-full", a ? "text-black/70 hover:bg-black/10" : "text-white/60 hover:bg-white/[0.08] hover:text-white")}><MoreHorizontal className="h-4 w-4" /></button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Klasör eylemleri" className={cn(MENU, "w-[200px]")}>
        <button onClick={() => { setAcik(false); onAd(); }} className={MSATIR}><Pencil className="h-4 w-4 text-white/55" />Yeniden adlandır</button>
        <button onClick={() => { setAcik(false); onSil(); }} className={cn(MSATIR, "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200")}><Trash2 className="h-4 w-4" />Klasörü sil</button>
      </Yuzen>
    </div>
  );
}

/* ── Mobil üst: ray yerine ── */
function MobilUst({ ozetler, klasorler, gorunum, sayi, onGorunum, arama, setArama, onYeni }: {
  ozetler: Oz[]; klasorler: Klasor[]; gorunum: Gorunum; sayi: (g: Gorunum) => number; onGorunum: (g: Gorunum) => void; arama: string; setArama: (s: string) => void; onYeni: () => void;
}) {
  const ogeler: [Gorunum, string][] = [["tumu", "Tümü"], ["son", "Son 7 gün"], ["sabit", "Sabitlenen"], ["yayin", "Yayında"], ["bos", "Boş"], ...klasorler.map((k) => [`k:${k.id}`, k.ad] as [Gorunum, string])];
  if (!ozetler.length) return null;
  return (
    <div className="mb-5 space-y-2.5 lg:hidden">
      <div className="flex gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.065] px-3.5 ring-1 ring-inset ring-white/[0.06]"><Search className="h-4 w-4 text-white/50" /><input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Proje ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" /></label>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onYeni} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni</motion.button>
      </div>
      <LayoutGroup id="proje-mobil">
        <div className="gizli-scroll -mx-4 flex gap-1 overflow-x-auto px-4">
          {ogeler.map(([g, ad]) => (
            <button key={g} onClick={() => onGorunum(g)} className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium", gorunum === g ? "text-black" : "bg-white/[0.065] text-white/75")}>
              {gorunum === g && <motion.span layoutId="proje-mobil-hap" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
              <span className="relative">{ad}</span>{sayi(g) > 0 && <span className={cn("relative text-[12px] tabular-nums", gorunum === g ? "text-black/55" : "text-white/45")}>{sayi(g)}</span>}
            </button>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

function SiraMenusu({ sira, setSira }: { sira: string; setSira: (s: string) => void }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.065] px-3.5 text-[13.5px] font-medium text-white/85 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.09]">
        <ArrowDownWideNarrow className="h-4 w-4 text-white/55" /><span className="max-sm:hidden">{SIRALAR.find((s) => s.id === sira)!.ad}</span><ChevronDown className={cn("h-3.5 w-3.5 text-white/50 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Sırala" className={cn(MENU, "w-[210px]")}>
        {SIRALAR.map((s) => <button key={s.id} onClick={() => { setSira(s.id); setAcik(false); }} className={cn(MSATIR, "justify-between")}>{s.ad}{sira === s.id && <Check className="h-4 w-4" />}</button>)}
      </Yuzen>
    </div>
  );
}

/* ── Kapak: macOS klasörü; projede görsel varsa klasörün içinden görünür ── */
const kareAdresi = (u: Uretim) => gorselMi(u.gorselUrl ?? u.thumbnailUrl ?? u.muzik?.kapak ?? u.meta?.demoKlip?.poster);
const videoAdresi = (u: Uretim) => u.videoUrl || u.meta?.demoKlip?.video;
function ProjeKapak({ o, className }: { o: ProjeOzet; className?: string; ikon?: string; buyut?: boolean }) {
  return <MacKlasor renk={o.p.renk ?? "#4aa8f0"} className={className} />;
}

/* ── Satır ── */
const sayiMetni = (o: ProjeOzet) => [o.gorsel && `${o.gorsel} görsel`, o.video && `${o.video} video`, o.ses && `${o.ses} ses`].filter(Boolean).join(" · ") || "Boş";

function IcerikCubugu({ o }: { o: ProjeOzet }) {
  const t = Math.max(1, o.toplam);
  return (
    <span className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full bg-white/[0.08]" title={sayiMetni(o)}>
      {o.toplam > 0 && ([[o.gorsel, "bg-white"], [o.video, "bg-[#55d6fd]"], [o.ses, "bg-white/45"]] as const).map(([n, c], i) => n > 0 && (
        <motion.span key={i} initial={{ width: 0 }} animate={{ width: `${(n / t) * 100}%` }} transition={{ duration: 0.7, ease, delay: 0.15 }} className={cn("h-full", c)} />
      ))}
    </span>
  );
}

function Durum({ o }: { o: ProjeOzet }) {
  const HAP = "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium";
  if (o.durum === "uretiliyor") return <span className={cn(HAP, "bg-white/[0.085] text-white")}><Loader2 className="h-3 w-3 animate-spin" />Üretiliyor</span>;
  if (o.p.yayinda) return <span className={HAP} style={{ background: "rgba(85,214,253,0.12)", color: "#9be6ff" }}><Globe className="h-3 w-3" />Yayında</span>;
  if (o.toplam) return <span className={cn(HAP, "bg-white/[0.085] text-white/85")}><span className="h-1.5 w-1.5 rounded-full bg-white" />İçerikli</span>;
  return <span className={cn(HAP, "bg-white/[0.055] text-white/60")}><span className="h-1.5 w-1.5 rounded-full bg-white/40" />Taslak</span>;
}

type Islem = { onSabitle: (o: Oz) => void; onAd: (o: Oz) => void; onLink: (o: Oz) => void; onSil: (o: Oz) => void; onTasi: (o: Oz, kid?: string) => void; onAlt: (o: Oz) => void; onAc: (o: Oz) => void };

function Satir({ o, acik, onAc, klasorler, islem, onSurukle, surukleniyor, derinlik = 0, altSayi = 0, altAcik, onAltAcKapat, ust, agacVar }: {
  o: Oz; acik: boolean; onAc: () => void; klasorler: Klasor[]; islem: Islem; onSurukle: (v: boolean) => void; surukleniyor: boolean;
  derinlik?: number; altSayi?: number; altAcik?: boolean; onAltAcKapat?: () => void; ust?: string; agacVar?: boolean;
}) {
  const sahneBiten = o.p.cekimler.filter((c) => c.durum !== "uretiliyor" && (c.gorselUrl || c.videoUrl)).length;
  const uyeSayisi = 1 + (o.p.uyeler?.length ?? 0);
  return (
    <div id={`proje-${o.p.id}`} className={cn("border-b border-white/[0.05] transition-opacity last:border-0", surukleniyor && "opacity-40")}>
      <div role="button" tabIndex={0} onClick={onAc} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onAc())} aria-expanded={acik}
        draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", o.p.id); onSurukle(true); }} onDragEnd={() => onSurukle(false)}
        className={cn("group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 outline-none transition-colors hover:bg-white/[0.045] focus-visible:bg-white/[0.065] sm:px-5", SUTUN, acik && "bg-white/[0.045]")}>
        <span className="relative flex min-w-0 items-center gap-3 self-stretch pl-[calc(var(--d)*14px)] sm:pl-[calc(var(--d)*28px)]" style={{ "--d": derinlik } as React.CSSProperties}>
          {Array.from({ length: derinlik }, (_, i) => <span key={i} aria-hidden className="absolute -inset-y-2.5 left-[calc(var(--i)*14px_+_4px)] w-px bg-white/[0.1] group-hover:bg-white/[0.18] sm:left-[calc(var(--i)*28px_+_8px)]" style={{ "--i": i } as React.CSSProperties} />)}
          {altSayi > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); onAltAcKapat?.(); }} aria-label={altAcik ? "Alt projeleri gizle" : "Alt projeleri göster"} className="-ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white">
              <ChevronRight className={cn("h-4 w-4 transition-transform", altAcik && "rotate-90")} />
            </button>
          ) : agacVar || derinlik > 0 ? <span className="-ml-1 w-6 shrink-0" /> : null}
          <ProjeKapak o={o} className="h-[38px] w-[49px] transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-white">{o.p.sabit && <Pin className="h-3 w-3 shrink-0 text-white/55" />}<span className="truncate">{o.p.ad}</span></span>
            <span className="block truncate text-[12.5px] text-white/55 md:hidden">{o.p.tur} · {sayiMetni(o)}{o.zaman ? ` · ${gorece(o.zaman)}` : ""}</span>
            {(o.p.aciklama || ust || altSayi > 0) && <span className="hidden truncate text-[12.5px] text-white/50 md:block">{[ust && `${ust} altında`, altSayi > 0 && `${altSayi} alt proje`, o.p.aciklama].filter(Boolean).join(" · ")}</span>}
          </span>
        </span>
        <span className="hidden min-w-0 items-center md:flex"><TurHap tur={o.p.tur} renk={o.p.renk} /></span>
        <span className="hidden min-w-0 items-center gap-3 md:flex"><span className="w-14 shrink-0"><IcerikCubugu o={o} /></span><span className="truncate text-[12.5px] text-white/65">{sayiMetni(o)}</span></span>
        <span className="hidden items-center gap-1.5 text-[12.5px] text-white/65 xl:flex" title="Biten sahne / toplam sahne"><Clapperboard className="h-3.5 w-3.5 text-white/40" />{o.p.cekimler.length ? <span><b className="font-semibold text-white/85">{sahneBiten}</b> / {o.p.cekimler.length}</span> : ""}</span>
        <span className="hidden items-center gap-1.5 text-[12.5px] text-white/65 xl:flex" title={o.p.gizlilik === "acik" ? "Ekiple paylaşımlı" : "Gizli"}>{o.p.gizlilik === "acik" ? <Users className="h-3.5 w-3.5 text-white/40" /> : <Lock className="h-3.5 w-3.5 text-white/40" />}{uyeSayisi === 1 ? "Yalnız sen" : `${uyeSayisi} üye`}</span>
        <span className="hidden text-[12.5px] text-white/60 md:block">{o.zaman ? gorece(o.zaman) : ""}</span>
        <span className="hidden md:block"><Durum o={o} /></span>
        <span className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <SatirMenu o={o} klasorler={klasorler} islem={islem} />
          <button onClick={onAc} aria-label={acik ? "Kapat" : "Aç"} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.075] hover:text-white"><ChevronDown className={cn("h-4 w-4 transition-transform", acik && "rotate-180")} /></button>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease }} className="overflow-hidden">
            <Ayrinti o={o} derinlik={derinlik} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SatirMenu({ o, klasorler, islem }: { o: Oz; klasorler: Klasor[]; islem: Islem }) {
  const [acik, setAcik] = useState(false);
  const [tasi, setTasi] = useState(false);
  const kapat = () => { setAcik(false); setTasi(false); };
  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-label={`${o.p.ad} eylemleri`} aria-expanded={acik} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.08] hover:text-white", acik && "bg-white/[0.08] text-white")}><MoreHorizontal className="h-4 w-4" /></button>
      <Yuzen acik={acik} onKapat={kapat} yerlesim="alt-sag" bosluk={6} etiket="Proje eylemleri" className={cn(MENU, "w-[230px]")}>
        <AnimatePresence mode="wait" initial={false}>
          {!tasi ? (
            <motion.div key="ana" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              <button onClick={() => { kapat(); islem.onAc(o); }} className={MSATIR}><ArrowRight className="h-4 w-4 text-white/55" />Projeyi aç</button>
              <button onClick={() => { kapat(); islem.onAlt(o); }} className={MSATIR}><CornerDownRight className="h-4 w-4 text-white/55" />Alt proje aç</button>
              <div className="my-1 h-px bg-white/[0.08]" />
              <button onClick={() => { kapat(); islem.onSabitle(o); }} className={MSATIR}>{o.p.sabit ? <PinOff className="h-4 w-4 text-white/55" /> : <Pin className="h-4 w-4 text-white/55" />}{o.p.sabit ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
              <button onClick={() => { kapat(); islem.onAd(o); }} className={MSATIR}><Pencil className="h-4 w-4 text-white/55" />Yeniden adlandır</button>
              <button onClick={() => setTasi(true)} className={MSATIR}><FolderInput className="h-4 w-4 text-white/55" /><span className="flex-1">Klasöre taşı</span><ChevronRight className="h-3.5 w-3.5 text-white/45" /></button>
              <button onClick={() => { kapat(); islem.onLink(o); }} className={MSATIR}><Link2 className="h-4 w-4 text-white/55" />Bağlantıyı kopyala</button>
              <div className="my-1 h-px bg-white/[0.08]" />
              <button onClick={() => { kapat(); islem.onSil(o); }} className={cn(MSATIR, "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200")}><Trash2 className="h-4 w-4" />Sil</button>
            </motion.div>
          ) : (
            <motion.div key="tasi" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>
              <button onClick={() => setTasi(false)} className={cn(MSATIR, "text-white/60")}><ChevronRight className="h-4 w-4 rotate-180" />Klasöre taşı</button>
              <div className="my-1 h-px bg-white/[0.08]" />
              <button onClick={() => { kapat(); islem.onTasi(o, undefined); }} className={MSATIR}><LayoutGrid className="h-4 w-4 text-white/55" /><span className="flex-1">Klasörsüz</span>{!o.p.klasorId && <Check className="h-4 w-4" />}</button>
              {klasorler.map((k) => (
                <button key={k.id} onClick={() => { kapat(); islem.onTasi(o, k.id); }} className={MSATIR}><Folder className="h-4 w-4" style={{ color: k.renk }} /><span className="flex-1 truncate">{k.ad}</span>{o.p.klasorId === k.id && <Check className="h-4 w-4" />}</button>
              ))}
              {!klasorler.length && <p className="px-2.5 py-2 text-[12.5px] leading-snug text-white/50">Henüz klasör yok. Soldaki Klasörler başlığındaki + ile aç.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </Yuzen>
    </div>
  );
}

/* ── Açılan ayrıntı: tek kart. Üstte projenin gerçek kareleri (video ise oynar), altta sayılar + son üretim + eylemler ── */
const BASLA = [
  { ad: "Varlık üret", alt: "Görsel, video ya da ses; doğrudan bu projeye", ikon: Wand2, s: "varliklar" },
  { ad: "AI Yönetmen", alt: "Fikrinden sahne planı çıkarsın", ikon: Clapperboard, s: "yonetmen" },
  { ad: "Brif yaz", alt: "Hedef, ton ve teslimleri tek belgede topla", ikon: Pencil, s: "brif" },
];
/** Tür etiketi: türe özgü simge, proje rengiyle hafif boyanmış hap. */
const TUR_SIMGE: Record<string, React.ElementType> = {
  "Kısa film": Film, Reklam: Megaphone, "Müzik videosu": Music, Karakter: UserRound, Belgesel: Mountain, Dizi: Tv, "Sosyal medya": Smartphone,
  "Bilim Kurgu": Rocket, Epik: Mountain, Dram: Drama, Genel: Sparkles,
};
function TurHap({ tur, renk = "#4aa8f0" }: { tur: string; renk?: string }) {
  const I = TUR_SIMGE[tur] ?? Tag;
  return (
    <span title={`Tür: ${tur}`} className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full pl-1 pr-2.5 text-[12.5px] font-medium text-white/85"
      style={{ background: `color-mix(in srgb, ${renk} 9%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${renk} 22%, transparent)` }}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${renk} 22%, transparent)`, color: `color-mix(in srgb, ${renk} 70%, #fff)` }}><I className="h-3 w-3" strokeWidth={2.2} /></span>
      <span className="truncate">{tur}</span>
    </span>
  );
}

function Ayrinti({ o, derinlik = 0 }: { o: Oz; derinlik?: number }) {
  const ici = o.p.klasorler ?? [];
  const el = o.p.elementler ?? [];
  const goster = o.ait.slice(0, 9);
  const fazla = o.ait.length - goster.length;
  const son = o.ait[0];
  return (
    <div className="px-4 pb-4 sm:px-5 md:pl-[calc(52px+var(--d)*28px)]" style={{ "--d": derinlik } as React.CSSProperties}>
      <div className="overflow-hidden rounded-[18px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]">
        {o.toplam === 0 ? (
          <div className="grid gap-2 p-2.5 sm:grid-cols-3">
            {BASLA.map((b, i) => (
              <motion.div key={b.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/panel/projeler/${o.p.id}?s=${b.s}`} className="group/b flex items-center gap-3 rounded-[14px] p-3 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.065] hover:ring-white/[0.16] active:scale-[0.99]" style={{ background: "rgba(255,255,255,0.035)" }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white transition group-hover/b:bg-white group-hover/b:text-black"><b.ikon className="h-[18px] w-[18px]" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">{b.ad}</span><span className="block text-[12.5px] leading-snug text-white/60">{b.alt}</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover/b:translate-x-0.5 group-hover/b:text-white" />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="gizli-scroll flex gap-2 overflow-x-auto p-2.5">
            {goster.map((u, i) => {
              const g = kareAdresi(u), v = videoAdresi(u);
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="shrink-0">
                  <Link href={`/panel/projeler/${o.p.id}?u=${u.id}`} title={u.prompt} className="group/k relative block h-[120px] w-[120px] overflow-hidden rounded-[13px] bg-white/[0.065]">
                    {g ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g} alt="" className="h-full w-full object-cover transition duration-500 group-hover/k:scale-[1.06]" />
                    ) : v ? <video src={v} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
                      : <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-white/55">{u.tur === "ses" || u.tur === "muzik" ? <AudioLines className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}<span className="max-w-[100px] truncate text-[11px]">{u.model}</span></span>}
                    <span className="absolute inset-0 rounded-[13px] ring-1 ring-inset ring-white/[0.08]" />
                    {u.tur === "video" && <span className="absolute bottom-1.5 left-1.5 flex h-5 items-center gap-1 rounded-full bg-black/60 px-1.5 text-[10.5px] font-medium text-white backdrop-blur"><Clapperboard className="h-3 w-3" />Video</span>}
                  </Link>
                </motion.div>
              );
            })}
            {fazla > 0 && <Link href={`/panel/projeler/${o.p.id}`} className="flex h-[120px] w-[120px] shrink-0 flex-col items-center justify-center rounded-[13px] bg-white/[0.065] text-white/80 transition hover:bg-white/[0.09]"><span className="text-[18px] font-semibold">+{fazla}</span><span className="text-[11.5px] text-white/55">Tümünü gör</span></Link>}
            <Link href={`/panel/projeler/${o.p.id}`} className="group/y flex h-[120px] w-[120px] shrink-0 flex-col items-center justify-center gap-2 rounded-[13px] bg-white/[0.035] text-white/70 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.065] hover:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.085] transition group-hover/y:bg-white group-hover/y:text-black"><Plus className="h-4 w-4" /></span>
              <span className="text-[12.5px] font-medium">Bu projede üret</span>
            </Link>
          </div>
        )}
        {(ici.length > 0 || el.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] px-3.5 py-2.5">
            {ici.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[12.5px] text-white/50">Klasörler</span>
                {ici.map((k) => {
                  const n = k.uretimIdler?.length ?? 0;
                  return <span key={k.id} className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.065] pl-2 pr-2.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.06]"><MacKlasor renk={k.renk ?? "#4aa8f0"} className="h-3 w-4" kapali />{k.ad}<span className="text-white/45">{n ? `${n} varlık` : "boş"}</span></span>;
                })}
              </div>
            )}
            {el.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[12.5px] text-white/50">Elementler</span>
                {el.map((e) => <span key={e.id} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.065] pl-2 pr-2.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.06]"><AtSign className="h-3.5 w-3.5 text-[#55d6fd]" />{e.ad}<span className="text-white/45">{e.tur === "karakter" ? "karakter" : e.tur === "mekan" ? "mekân" : "nesne"}</span></span>)}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] px-3.5 py-2.5">
          {o.toplam === 0 ? <p className="min-w-0 flex-1 text-[13px] text-white/65">Proje boş. İçinde ürettiğin her şey buraya ve kitaplığa birlikte düşer.</p> : (
            <>
              <p className="flex items-center gap-3.5 text-[13px] text-white/80">
                {([["görsel", o.gorsel, ImageIcon], ["video", o.video, Clapperboard], ["ses", o.ses, AudioLines]] as const).filter(([, n]) => n > 0).map(([ad, n, I]) => (
                  <span key={ad} className="flex items-center gap-1.5"><I className="h-3.5 w-3.5 text-white/50" /><b className="font-semibold tabular-nums text-white">{n}</b>{ad}</span>
                ))}
              </p>
              {son && <p className="flex min-w-0 flex-1 items-center gap-2 text-[12.5px] text-white/60"><span className="h-3.5 w-px bg-white/[0.12]" /><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.075]"><ModelLogo ad={son.model} boyut={13} /></span><span className="truncate">Son üretim {son.model}, {gorece(son.olusturma)}</span></p>}
            </>
          )}
          <div className="ml-auto flex gap-2">
            {o.toplam > 0 && <Link href={`/panel/kitaplik?proje=${o.p.id}`} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.12]"><Library className="h-3.5 w-3.5" />Kitaplıkta gör</Link>}
            <Link href={`/panel/projeler/${o.p.id}`} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition hover:bg-white/90">Projeyi aç<ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── İlk adım (hiç proje yokken): Higgsfield'daki üç fikir + şablonlar ── */
function IlkAdim({ onYeni, onSablon, dolu }: { onYeni: () => void; onSablon: (t: (typeof SABLONLAR)[number]) => void; dolu?: boolean }) {
  const ADIM = [
    { ikon: Folder, ad: "Düzenle", alt: "Çekimleri bölüm, müşteri ya da temaya göre klasörlere ayır." },
    { ikon: AtSign, ad: "Elementleri yeniden kullan", alt: "Karakter ve mekânları kaydet, istemde @ ile çağır." },
    { ikon: Wand2, ad: "Üret", alt: "Görsel, video ve ses tek projede toplanır; her stüdyodan erişilir." },
  ];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className={cn(KART, !dolu && "mt-4")}>
      <header className={SERIT}>
        <div><h2 className="text-[17px] font-semibold text-white">{dolu ? "Projelerin henüz boş" : "İlk projeni oluştur"}</h2><p className="mt-0.5 text-[13px] text-white/60">{dolu ? "Bir projeyi açıp üretmeye başla ya da hazır bir şablonla yeni proje kur." : "Proje, bir işin tüm üretimlerini, klasörlerini ve elementlerini bir arada tutar."}</p></div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onYeni} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Boş proje</motion.button>
      </header>
      <div className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
        {ADIM.map((a, i) => (
          <motion.div key={a.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }} className="flex items-start gap-3 rounded-[18px] p-3.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.035)" }}>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><a.ikon className="h-[18px] w-[18px]" /><span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10.5px] font-bold text-black">{i + 1}</span></span>
            <span className="min-w-0"><span className="block text-[14.5px] font-semibold text-white">{a.ad}</span><span className="mt-0.5 block text-[13px] leading-snug text-white/60">{a.alt}</span></span>
          </motion.div>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <span className="text-[14.5px] font-semibold text-white">Şablonla başla</span><Hap>{SABLONLAR.length}</Hap>
          <span className="ml-auto hidden text-[12.5px] text-white/50 sm:block">Tür ve renk hazır gelir, adını sen verirsin</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          {SABLONLAR.map((t) => (
            <button key={t.ad} onClick={() => onSablon(t)} className="group relative aspect-[4/3] overflow-hidden rounded-[16px] text-left 2xl:aspect-[16/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.img} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute inset-x-3 bottom-2.5"><span className="block text-[14px] font-semibold text-white">{t.ad}</span><span className="block text-[12px] leading-snug text-white/70">{t.alt}</span></span>
              <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black opacity-0 transition group-hover:opacity-100"><Plus className="h-3.5 w-3.5" /></span>
              <span className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/[0.08] transition group-hover:ring-white/30" />
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function GorunumIkon({ g }: { g: Gorunum }) {
  const I = g === "son" ? Clock : g === "sabit" ? Pin : g === "yayin" ? Globe : g === "bos" ? FileStack : LayoutGrid;
  return <I className="h-[19px] w-[19px]" />;
}
