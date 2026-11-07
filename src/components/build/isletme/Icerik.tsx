"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CalendarClock, Eye, FileText, Import, Loader2, Plus, Rss, Scale, Search, Settings2, Trash2, UploadCloud, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { YanPanel } from "@/components/build/paylasim/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { VARSAYILAN_BLOG, VARSAYILAN_YASAL, YASAL_TURLER, yasalOneri, yasalRejimleri, yaziYayinda, type BlogAyar, type YasalAyar, type YasalTur, type Yazi, type YaziDurum } from "@/lib/build/isletmeTipler";
import { GIZLILIK_REJIMLERI, ULKELER, ulkeBul, type Gizlilik } from "@/lib/build/bolge";
import { cn } from "@/lib/utils";
import { Alan, BilgiSatiri, BosDurum, birincil, Girdi, GorselAlani, gorece, HataSatiri, ikincil, imza, isletmeApi, KaydetSeridi, MetinAlani, OnayliDugme, Rozet, SecenekCipleri, tarihSaat, useTaslak, type IsletmeKanca } from "./ortak";
import { SatirAyar } from "./Magaza";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void; ajanaGonder?: (m: string) => void; calisiyor?: boolean; projeYenile?: () => void };

/* ═════════════ Blog ═════════════ */
type Liste = { yazilar: Yazi[]; buyume: { id: string; baslik: string; olusturma: number }[]; sayfaKurulu: boolean };
const durumRozet = (y: Yazi) => y.durum === "taslak" ? <Rozet>Taslak</Rozet> : yaziYayinda(y) ? <Rozet ton="iyi">Yayında</Rozet> : <Rozet ton="imza">Zamanlandı</Rozet>;
export function Blog({ o }: { o: Ortak }) {
  const [l, setL] = useState<Liste | null>(null);
  const [panel, setPanel] = useState<Yazi | "yeni" | null>(null);
  const [ayar, setAyar] = useState(false);
  const [ara, setAra] = useState("");
  const [suz, setSuz] = useState<"hepsi" | YaziDurum>("hepsi");
  const [yaziyor, setYaziyor] = useState(false);
  const [hata, setHata] = useState("");
  const getir = useCallback(async () => { try { setL(await isletmeApi<Liste>(o.projeId, "yazilar")); } catch (e) { setHata((e as Error).message); } }, [o.projeId]);
  useEffect(() => { getir(); }, [getir]);
  const siteyeYaz = async () => {
    setYaziyor(true); setHata("");
    try { const r = await isletmeApi<{ surumNo: number | null; dosyalar: string[] }>(o.projeId, "blog/siteye-yaz", { govde: {} }); o.goster(r.surumNo ? `Blog sayfaları yazıldı: sürüm ${r.surumNo}. Yayına almak için yayınla.` : "Sitedeki blog sayfaları zaten güncel"); o.projeYenile?.(); await getir(); }
    catch (e) { setHata((e as Error).message); } finally { setYaziyor(false); }
  };
  const iceAktar = async (id: string) => { try { await isletmeApi(o.projeId, "yazi/ice-aktar", { govde: { makaleId: id } }); o.goster("Makale taslak olarak eklendi"); await getir(); } catch (e) { setHata((e as Error).message); } };
  const yazilar = (l?.yazilar ?? []).filter((y) => (suz === "hepsi" || y.durum === suz) && (!ara || y.baslik.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr"))));
  const eskiler = (l?.yazilar ?? []).filter((y) => yaziYayinda(y) && (!y.statik || y.statik < y.guncelleme)).length;
  const b = o.k.d?.veri.blog ?? VARSAYILAN_BLOG;
  return (
    <div className="space-y-4">
      <Kart ikon={FileText} baslik="Blog" alt={l ? `${l.yazilar.length} yazı · sitede ${b.sayfa}` : "Yükleniyor"} sag={<><button type="button" onClick={() => setAyar(true)} className={ikincil} aria-label="Blog ayarları"><Settings2 className="h-4 w-4" /><span className="max-sm:hidden">Ayarlar</span></button><button type="button" onClick={() => setPanel("yeni")} className={birincil} aria-label="Yazı yaz"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yazı yaz</span></button></>}>
        <div className="space-y-3 p-3 sm:p-4">
          <HataSatiri mesaj={hata} kapat={() => setHata("")} />
          {l && (
            <div className={cn("flex flex-wrap items-center gap-3 rounded-[16px] px-3.5 py-3 ring-1 ring-inset", !l.sayfaKurulu || eskiler ? "bg-[#55d6fd]/[0.06] ring-[#55d6fd]/20" : "bg-white/[0.03] ring-white/[0.07]")}>
              <UploadCloud className="h-5 w-5 shrink-0 text-[#8be6ff]" />
              <span className="min-w-[220px] flex-1 text-[13px] leading-relaxed text-white/80">{!l.sayfaKurulu ? `Blog sayfaları sitede yok. Siteye yazınca ${b.sayfa}, yazı sayfası ve her yazı için arama motorlarının okuyacağı kalıcı sayfa oluşur; sitenin üst menüsü ve stili kullanılır.` : eskiler ? `${eskiler} yazının sitedeki kalıcı sayfası eski ya da yok. Liste ve zamanlanmış yazılar sitede kendiliğinden güncellenir; kalıcı sayfalar için yeniden yaz.` : "Sitedeki blog sayfaları güncel. Zamanlanan yazı vakti gelince listeye kendiliğinden girer."}</span>
              <button type="button" disabled={yaziyor || o.calisiyor} title={o.calisiyor ? "Ajan çalışırken sayfa yazılmaz" : ""} onClick={siteyeYaz} className={imza}>{yaziyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{l.sayfaKurulu ? "Sayfaları güncelle" : "Siteye blog ekle"}</button>
            </div>
          )}
          {!l ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
            : !l.yazilar.length ? (
              <BosDurum ikon={FileText} baslik="Henüz yazı yok" alt="Yazılar taslak, yayında ya da zamanlanmış olur; kapak, kategori ve arama motoru başlığıyla. Yapay zekâ ilk taslağı çıkarabilir." birincilEylem={{ ad: "Yazı yaz", tikla: () => setPanel("yeni") }} ikincilEylem={l.buyume.length ? { ad: "Büyüme makalesini al", tikla: () => iceAktar(l.buyume[0].id) } : undefined} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Secici id="blog-suz" kucuk deger={suz} set={setSuz} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "yayinda", ad: "Yayında" }, { id: "zamanli", ad: "Zamanlı" }, { id: "taslak", ad: "Taslak" }]} />
                  <div className="relative ml-auto min-w-[200px] max-sm:w-full"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Yazı ara" className="pl-9" /></div>
                </div>
                <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                  {yazilar.map((y) => (
                    <button key={y.id} type="button" onClick={() => setPanel(y)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04]">
                      <span className="h-12 w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">{y.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={y.kapak} alt="" className="h-full w-full object-cover" />}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{y.baslik}</span><span className="block truncate text-[12px] text-white/50">{[y.kategori, `${y.okumaDk} dk okuma`, y.durum === "zamanli" && y.yayinZamani && !yaziYayinda(y) ? `${tarihSaat(y.yayinZamani)} yayına girer` : `güncellendi ${gorece(y.guncelleme)}`, y.kaynak?.startsWith("buyume") ? "Büyüme'den" : null].filter(Boolean).join(" · ")}</span></span>
                      {durumRozet(y)}
                    </button>
                  ))}
                </div>
              </>
            )}
          {l && l.buyume.length > 0 && l.yazilar.length > 0 && (
            <div className="rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white"><Import className="h-4 w-4 text-white/55" />Büyüme sekmesindeki makaleler</p>
              <div className="flex flex-wrap gap-1.5">{l.buyume.slice(0, 8).map((m) => <button key={m.id} type="button" onClick={() => iceAktar(m.id)} className="h-8 max-w-full truncate rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:text-white">{m.baslik}</button>)}</div>
            </div>
          )}
        </div>
      </Kart>
      <YaziPaneli o={o} yazi={panel} kapat={() => setPanel(null)} bitti={() => { setPanel(null); getir(); }} kategoriler={b.kategoriler} />
      <BlogAyarPaneli o={o} acik={ayar} kapat={() => setAyar(false)} />
    </div>
  );
}

type YaziTaslak = Pick<Yazi, "baslik" | "slug" | "ozet" | "icerik" | "kapak" | "kategori" | "etiketler" | "yazar" | "durum" | "seoBaslik" | "seoAciklama"> & { yayinZamani: string };
const bosYazi = (): YaziTaslak => ({ baslik: "", slug: "", ozet: "", icerik: "", kapak: "", kategori: "", etiketler: [], yazar: "", durum: "taslak", seoBaslik: "", seoAciklama: "", yayinZamani: "" });
const yerel = (z: number | null) => (z ? new Date(z + 3 * 3600_000).toISOString().slice(0, 16) : "");
function YaziPaneli({ o, yazi, kapat, bitti, kategoriler }: { o: Ortak; yazi: Yazi | "yeni" | null; kapat: () => void; bitti: () => void; kategoriler: string[] }) {
  const [t, setT] = useState<YaziTaslak>(bosYazi());
  const [onizle, setOnizle] = useState(false);
  const [konu, setKonu] = useState("");
  const [ai, setAi] = useState(false);
  const [is, setIs] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { if (yazi) { setHata(""); setOnizle(false); setT(yazi === "yeni" ? bosYazi() : { ...yazi, yayinZamani: yerel(yazi.yayinZamani) }); } }, [yazi]);
  const d = <K extends keyof YaziTaslak>(k: K, v: YaziTaslak[K]) => setT((x) => ({ ...x, [k]: v }));
  const kaydet = async (durum?: YaziDurum) => {
    setIs(true); setHata("");
    try { await isletmeApi(o.projeId, "yazi", { govde: { id: yazi && yazi !== "yeni" ? yazi.id : undefined, yazi: { ...t, durum: durum ?? t.durum, yayinZamani: t.yayinZamani || null } } }); o.goster(durum === "yayinda" ? "Yazı yayında" : "Yazı kaydedildi"); bitti(); }
    catch (e) { setHata((e as Error).message); } finally { setIs(false); }
  };
  const sil = async () => { if (!yazi || yazi === "yeni") return; await isletmeApi(o.projeId, `yazi/${yazi.id}`, { method: "DELETE" }); bitti(); };
  const aiYaz = async () => {
    setAi(true); setHata("");
    try { const r = await isletmeApi<{ veri: Partial<YaziTaslak> }>(o.projeId, "yazi/ai", { govde: { konu: konu || t.baslik, ton: "" } }); setT((x) => ({ ...x, ...Object.fromEntries(Object.entries(r.veri).filter(([, v]) => v !== undefined && v !== "")) })); setKonu(""); }
    catch (e) { setHata((e as Error).message); } finally { setAi(false); }
  };
  const kelime = (t.icerik.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  return (
    <YanPanel acik={!!yazi} kapat={kapat} genislik={720} baslik={yazi === "yeni" ? "Yeni yazı" : t.baslik || "Yazı"} alt={`${kelime} kelime · ${Math.max(1, Math.round(kelime / 200))} dk okuma`}
      alt2={<>{yazi !== "yeni" && <OnayliDugme soru="Yazı silinsin mi?" onayla={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</OnayliDugme>}<span className="flex-1" />
        <button type="button" disabled={is || !t.baslik} onClick={() => kaydet("taslak")} className={ikincil}>Taslak kaydet</button>
        {t.durum === "zamanli" ? <button type="button" disabled={is || !t.baslik || !t.yayinZamani} onClick={() => kaydet("zamanli")} className={birincil}><CalendarClock className="h-4 w-4" />Zamanla</button>
          : <button type="button" disabled={is || !t.baslik || !t.icerik} onClick={() => kaydet("yayinda")} className={birincil}>{is && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Yayınla</button>}</>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        <div className="cam-istemci flex items-center gap-2 rounded-[18px] p-1.5 pl-3.5">
          <Wand2 className="h-4 w-4 shrink-0 text-[#8be6ff]" />
          <input value={konu} onChange={(e) => setKonu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !ai && aiYaz()} placeholder={o.k.d?.servis.ai ? "Konu yaz, yapay zekâ taslağı çıkarsın: kışın seramik bakımı" : "Yapay zekâ modeli bağlı değil"} disabled={!o.k.d?.servis.ai} className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          <button type="button" disabled={ai || !o.k.d?.servis.ai || !(konu || t.baslik)} onClick={aiYaz} className={imza}>{ai ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}Taslak yaz</button>
        </div>
        <Alan etiket="Başlık"><Girdi value={t.baslik} onChange={(e) => d("baslik", e.target.value)} maxLength={160} className="h-11 text-[16px] font-semibold" /></Alan>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <GorselAlani projeId={o.projeId} deger={t.kapak} set={(x) => d("kapak", x)} oran="aspect-[16/10]" etiket="Kapak görseli" />
          <div className="space-y-3">
            <Alan etiket="Kategori"><Girdi value={t.kategori} onChange={(e) => d("kategori", e.target.value)} list="blog-kategoriler" maxLength={60} /><datalist id="blog-kategoriler">{kategoriler.map((c) => <option key={c} value={c} />)}</datalist></Alan>
            <Alan etiket="Yazar"><Girdi value={t.yazar} onChange={(e) => d("yazar", e.target.value)} maxLength={80} placeholder={o.k.d?.veri.blog.yazar || o.k.d?.veri.profil.ad || ""} /></Alan>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[12.5px] font-medium text-white/75">İçerik <span className="font-normal text-white/45">markdown: ## başlık, **kalın**, - liste, [bağlantı](adres)</span></span><button type="button" onClick={() => setOnizle(!onizle)} className="inline-flex items-center gap-1 text-[12px] text-white/60 hover:text-white"><Eye className="h-3.5 w-3.5" />{onizle ? "Düzenle" : "Önizle"}</button></div>
          {onizle ? <div className="prose-vayra min-h-[280px] rounded-[14px] bg-white/[0.03] p-4 text-[14px] leading-[1.75] text-white/85 ring-1 ring-inset ring-white/[0.07] [&_a]:text-[#8be6ff] [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3"><ReactMarkdown remarkPlugins={[remarkGfm]}>{t.icerik || "İçerik boş."}</ReactMarkdown></div>
            : <MetinAlani value={t.icerik} onChange={(e) => d("icerik", e.target.value)} rows={14} maxLength={60000} className="font-[inherit]" />}
        </div>
        <Alan etiket="Özet" alt="listede ve paylaşımlarda"><MetinAlani value={t.ozet} onChange={(e) => d("ozet", e.target.value)} rows={2} maxLength={400} className="min-h-[60px]" /></Alan>
        <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <p className="mb-2.5 text-[13px] font-medium text-white">Arama motoru</p>
          <div className="space-y-3">
            <Alan etiket="Başlık" alt={`${(t.seoBaslik || t.baslik).length} / 60`}><Girdi value={t.seoBaslik} onChange={(e) => d("seoBaslik", e.target.value)} maxLength={70} placeholder={t.baslik} /></Alan>
            <Alan etiket="Açıklama" alt={`${(t.seoAciklama || t.ozet).length} / 160`}><MetinAlani value={t.seoAciklama} onChange={(e) => d("seoAciklama", e.target.value)} rows={2} maxLength={170} className="min-h-[60px]" placeholder={t.ozet} /></Alan>
            <Alan etiket="Adres"><div className="flex items-center gap-1 text-[12.5px] text-white/50">blog/<Girdi value={t.slug} onChange={(e) => d("slug", e.target.value)} maxLength={80} className="h-9" placeholder="baslik-kendiliginden" />.html</div></Alan>
          </div>
        </div>
        <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <p className="mb-2.5 text-[13px] font-medium text-white">Yayın</p>
          <Secici id="yazi-durum" kucuk deger={t.durum} set={(x) => d("durum", x)} l={[{ id: "taslak", ad: "Taslak" }, { id: "yayinda", ad: "Hemen" }, { id: "zamanli", ad: "Zamanla" }]} />
          {t.durum === "zamanli" && <div className="mt-3 flex items-center gap-2"><Girdi type="datetime-local" value={t.yayinZamani} onChange={(e) => d("yayinZamani", e.target.value)} className="w-[230px]" /><span className="text-[12px] text-white/45">Türkiye saati; vakti gelince sitede kendiliğinden görünür</span></div>}
        </div>
      </div>
    </YanPanel>
  );
}

function BlogAyarPaneli({ o, acik, kapat }: { o: Ortak; acik: boolean; kapat: () => void }) {
  const tk = useTaslak<BlogAyar>(o.k.d?.veri.blog ?? VARSAYILAN_BLOG, (v) => o.k.kaydet("blog", v));
  const [kat, setKat] = useState("");
  const t = tk.t;
  const rss = `${typeof location !== "undefined" ? location.origin : ""}/api/build/isletme-genel/${o.projeId}/blog/rss.xml`;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Blog ayarları" alt2={<KaydetSeridi {...tk} kaydet={tk.kaydet} />}>
      <div className="space-y-4">
        <Alan etiket="Blog başlığı"><Girdi value={t.baslik} onChange={(e) => tk.d("baslik", e.target.value)} maxLength={80} /></Alan>
        <Alan etiket="Açıklama"><MetinAlani value={t.aciklama} onChange={(e) => tk.d("aciklama", e.target.value)} rows={2} maxLength={300} /></Alan>
        <Alan etiket="Varsayılan yazar"><Girdi value={t.yazar} onChange={(e) => tk.d("yazar", e.target.value)} maxLength={80} placeholder={o.k.d?.veri.profil.ad} /></Alan>
        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="Liste sayfası"><Girdi value={t.sayfa} onChange={(e) => tk.d("sayfa", e.target.value)} maxLength={80} /></Alan>
          <Alan etiket="Yazı sayfası"><Girdi value={t.yaziSayfasi} onChange={(e) => tk.d("yaziSayfasi", e.target.value)} maxLength={80} /></Alan>
        </div>
        <Alan etiket="Sayfa başına yazı"><SecenekCipleri<number> deger={t.sayfaBasi} set={(x) => tk.d("sayfaBasi", x)} l={[6, 9, 12].map((x) => ({ id: x, ad: String(x) }))} ozel /></Alan>
        <Alan etiket="Kategoriler">
          <div className="flex flex-wrap items-center gap-1.5">{t.kategoriler.map((c) => <span key={c} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12.5px] text-white">{c}<button type="button" onClick={() => tk.d("kategoriler", t.kategoriler.filter((x) => x !== c))} className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:text-white" aria-label="Kaldır">×</button></span>)}
            <Girdi value={kat} onChange={(e) => setKat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && kat.trim()) { e.preventDefault(); tk.d("kategoriler", [...new Set([...t.kategoriler, kat.trim()])]); setKat(""); } }} placeholder="Ekle, Enter" className="h-8 w-[150px]" /></div>
        </Alan>
        <BilgiSatiri ikon={Rss}>RSS akışı: <a href={rss} target="_blank" rel="noopener noreferrer" className="break-all text-[#8be6ff]">{rss}</a></BilgiSatiri>
      </div>
    </YanPanel>
  );
}

/* ═════════════ Yasal metinler ═════════════ */
export function YasalMetinler({ o }: { o: Ortak }) {
  const tk = useTaslak<YasalAyar>(o.k.d?.veri.yasal ?? VARSAYILAN_YASAL, (v) => o.k.kaydet("yasal", v));
  const t = tk.t;
  const magazaVar = !!o.k.d?.servis.odeme || (o.k.d?.veri.magaza.kargo.length ?? 0) > 0;
  const ulkeKodu = o.k.d?.veri.profil.ulkeKodu ?? "";
  const rejimler = o.k.d ? yasalRejimleri({ yasal: t, profil: o.k.d.veri.profil }) : (["genel"] as Gizlilik[]);
  const [secili, setSecili] = useState<YasalTur[]>(() => yasalOneri(rejimler, magazaVar));
  const rejimSec = (g: Gizlilik) => { const l = t.rejimler.length ? t.rejimler : rejimler; const yeni = l.includes(g) ? l.filter((x) => x !== g) : [...l.filter((x) => x !== "genel"), g]; tk.d("rejimler", yeni); setSecili(yasalOneri(yeni.length ? yeni : ["genel"], magazaVar)); };
  const [onizle, setOnizle] = useState<YasalTur | null>(null);
  const [html, setHtml] = useState<{ baslik: string; html: string; eksikler: string[] } | null>(null);
  const [is, setIs] = useState(false);
  const [hata, setHata] = useState("");
  const eksik = o.k.d?.ozet.yasalEksik ?? [];
  useEffect(() => { if (!onizle) return; setHtml(null); isletmeApi<{ baslik: string; html: string; eksikler: string[] }>(o.projeId, `yasal/onizle?tur=${onizle}`).then(setHtml).catch((e) => setHata((e as Error).message)); }, [onizle, o.projeId, o.k.d?.veri]);
  const yaz = async () => {
    if (tk.degisti) await tk.kaydet();
    setIs(true); setHata("");
    try { const r = await isletmeApi<{ surumNo: number | null }>(o.projeId, "yasal/siteye-yaz", { govde: { turler: secili } }); o.goster(r.surumNo ? `${secili.length} sayfa siteye eklendi: sürüm ${r.surumNo}` : "Sayfalar zaten güncel"); o.projeYenile?.(); o.k.yukle(); }
    catch (e) { setHata((e as Error).message); } finally { setIs(false); }
  };
  const sayfalar = o.k.d?.veri.yasal.sayfalar ?? {};
  return (
    <div className="space-y-4">
      <Kart ikon={Scale} baslik="Uyulacak gizlilik yasaları" alt="Müşterilerinin bulunduğu bölgeleri seç; gizlilik politikası, çerez bandı ve önerilen sayfalar buna göre hazırlanır" altSerit={<KaydetSeridi {...tk} kaydet={tk.kaydet} />}>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GIZLILIK_REJIMLERI.filter((g) => g.id !== "genel").map((g) => { const s2 = rejimler.includes(g.id); return (
              <button key={g.id} type="button" onClick={() => rejimSec(g.id)} aria-pressed={s2} className={cn("rounded-[14px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", s2 ? "bg-[#55d6fd]/[0.1] ring-[#55d6fd]/45" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className="block text-[13px] font-medium text-white">{g.ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-white/50">{g.alt}</span>
              </button>
            ); })}
          </div>
          {!t.rejimler.length && <p className="text-[12px] text-white/45">Seçim yapılmadı: {ulkeBul(ulkeKodu) ? `${ulkeBul(ulkeKodu)!.ad} için önerilen yasa seçili gösteriliyor` : "işletme ülkesi seçilmediği için genel ilkeler kullanılıyor"}.</p>}
        </div>
      </Kart>
      <Kart ikon={Scale} baslik="Hazır yasal metinler" alt="Gizlilik, çerez, satış, iade ve teslimat metinleri işletme bilgilerinden doldurulur ve siteye sayfa olarak eklenir"
        altSerit={<div className="flex w-full flex-wrap items-center gap-2"><span className="min-w-0 flex-1 text-[12px] text-white/45">Metinler seçili yasalara (GDPR, CCPA, KVKK ve diğerleri) göre hazırlanır; yayınlamadan önce bir hukukçuya kontrol ettir.</span><button type="button" disabled={is || !secili.length || o.calisiyor} onClick={yaz} className={imza}>{is && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{secili.length} sayfayı siteye ekle</button></div>}>
        <div className="space-y-3 p-3 sm:p-4">
          <HataSatiri mesaj={hata} kapat={() => setHata("")} />
          {eksik.length > 0 && <BilgiSatiri ton="uyari">Metinde köşeli parantezle kalacak bilgiler: {eksik.join(", ")}. İşletme profilinden tamamla.</BilgiSatiri>}
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
            {YASAL_TURLER.map((x) => {
              const s = secili.includes(x.id), var_ = sayfalar[x.id];
              return (
                <div key={x.id} className="flex items-center gap-3 px-3.5 py-3">
                  <button type="button" onClick={() => setSecili(s ? secili.filter((y) => y !== x.id) : [...secili, x.id])} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-colors", s ? "bg-white/[0.1] ring-2 ring-white" : "bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]")} aria-pressed={s} aria-label={`${x.ad} seç`}><Scale className={cn("h-4 w-4", s ? "text-white" : "text-white/40")} /></button>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-white">{x.ad}{x.magaza && <Rozet>Satış yapan siteler</Rozet>}{x.rejim && <Rozet ton={rejimler.includes(x.rejim as Gizlilik) || (x.rejim === "gdpr" && rejimler.includes("ukgdpr")) ? "imza" : "notr"}>{x.rejim === "kvkk" ? "Türkiye" : x.rejim === "ccpa" ? "Kaliforniya" : "AB ve İngiltere"}</Rozet>}</span><span className="block text-[12px] text-white/50">{var_ ? `${x.dosya} · ${gorece(var_.zaman)} eklendi` : x.alt}</span></span>
                  <button type="button" onClick={() => setOnizle(x.id)} className={ikincil}><Eye className="h-4 w-4" />Önizle</button>
                </div>
              );
            })}
          </div>
          {o.ajanaGonder && Object.keys(sayfalar).length > 0 && <button type="button" onClick={() => o.ajanaGonder!(`Sitenin bütün sayfalarının alt bilgisine şu yasal sayfalara bağlantı ekle: ${Object.values(sayfalar).map((x) => x!.dosya).join(", ")}.${rejimler.includes("ccpa") && t.ccpaSatis ? ' Alt bilgiye ayrıca data-vayra-satma niteliği taşıyan "Kişisel bilgilerimi satma ya da paylaşma" bağlantısı ekle.' : ""} Ödeme ya da sepet sayfası varsa "Siparişi tamamla" düğmesinin yanına ${rejimler.includes("kvkk") ? '"Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, onaylıyorum"' : '"Satış koşullarını ve gizlilik politikasını okudum, kabul ediyorum"'} onay kutusu koy ve işaretlenmeden ödemeye geçilmesin.`)} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#8be6ff]"><Wand2 className="h-3.5 w-3.5" />Ajana alt bilgi bağlantılarını ve ödeme onay kutusunu ekletmek</button>}
        </div>
      </Kart>
      <Kart ikon={Settings2} baslik="Metin ayarları" alt="Metinlerde geçen ek bilgiler" altSerit={<KaydetSeridi {...tk} kaydet={tk.kaydet} />}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Veri sorumlusu" alt="Boşsa ticari unvan"><Girdi value={t.veriSorumlusu} onChange={(e) => tk.d("veriSorumlusu", e.target.value)} className="w-[260px] max-sm:w-full" maxLength={160} /></SatirAyar>
          <SatirAyar baslik="Veri talepleri e-postası" alt="Boşsa profil e-postası; GDPR, CCPA ve KVKK talepleri buraya"><Girdi type="email" value={t.basvuruEposta} onChange={(e) => tk.d("basvuruEposta", e.target.value)} className="w-[260px] max-sm:w-full" /></SatirAyar>
          <SatirAyar baslik="Saklama süresi"><Girdi value={t.saklamaSuresi} onChange={(e) => tk.d("saklamaSuresi", e.target.value)} className="w-[320px] max-sm:w-full" maxLength={200} /></SatirAyar>
          {(rejimler.includes("gdpr") || rejimler.includes("ukgdpr")) && <>
            <SatirAyar baslik="Veri koruma görevlisi (DPO)" alt="Atadıysan; büyük ölçekte veri işleyenler için zorunlu"><Girdi type="email" value={t.dpoEposta} onChange={(e) => tk.d("dpoEposta", e.target.value)} className="w-[260px] max-sm:w-full" placeholder="dpo@alanadin.com" /></SatirAyar>
            {ulkeBul(ulkeKodu)?.grup !== "ab" && <SatirAyar baslik="AB temsilcisi" alt="AB dışındaki işletme AB'deki kişilere hizmet veriyorsa (GDPR madde 27)"><Girdi value={t.abTemsilci} onChange={(e) => tk.d("abTemsilci", e.target.value)} className="w-[320px] max-sm:w-full" maxLength={300} placeholder="Şirket adı, adres, e-posta" /></SatirAyar>}
            {ulkeKodu !== "GB" && <SatirAyar baslik="Birleşik Krallık temsilcisi" alt="İngiltere'deki kişilere hizmet veriyorsan"><Girdi value={t.ukTemsilci} onChange={(e) => tk.d("ukTemsilci", e.target.value)} className="w-[320px] max-sm:w-full" maxLength={300} /></SatirAyar>}
          </>}
          {rejimler.includes("ccpa") && <SatirAyar baslik="Reklam için bilgi paylaşımı" alt="Meta Pixel, Google Ads gibi araçlarla çapraz bağlam reklam yapıyorsan aç; sitede 'Kişisel bilgilerimi satma ya da paylaşma' bağlantısı gerekir"><Anahtar acik={t.ccpaSatis} set={(x) => tk.d("ccpaSatis", x)} etiket="CCPA paylaşım" /></SatirAyar>}
          <SatirAyar baslik="Uygulanacak hukuk" alt="Kullanım ve satış koşullarında; boşsa işletmenin ülkesi">
            <select value={t.hukukUlke} onChange={(e) => tk.d("hukukUlke", e.target.value)} className="h-9 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">İşletmenin ülkesi</option>{ULKELER.slice().sort((a, b) => a.ad.localeCompare(b.ad, "tr")).map((u) => <option key={u.kod} value={u.kod}>{u.ad}</option>)}</select>
          </SatirAyar>
          <SatirAyar baslik="Yetkili yer" alt="İsteğe bağlı; örneğin mahkeme ya da eyalet"><Girdi value={t.yetkiliYer} onChange={(e) => tk.d("yetkiliYer", e.target.value)} className="w-[260px] max-sm:w-full" maxLength={120} placeholder={ulkeKodu === "US" ? "State of Delaware" : ulkeKodu === "GB" ? "England and Wales" : ""} /></SatirAyar>
          <SatirAyar baslik="Cayma süresi" alt="AB, İngiltere ve Türkiye'de en az 14 gün"><SecenekCipleri<number> deger={t.iadeGun} set={(x) => tk.d("iadeGun", Math.max(14, x))} l={[14, 30].map((x) => ({ id: x, ad: `${x} gün` }))} ozel birim="gün" /></SatirAyar>
          <SatirAyar baslik="İade kargo ücreti"><Secici id="iade-kargo" kucuk deger={t.iadeKargo} set={(x) => tk.d("iadeKargo", x)} l={[{ id: "satici", ad: "Satıcı öder" }, { id: "alici", ad: "Alıcı öder" }]} /></SatirAyar>
          <SatirAyar baslik="Yurt dışı sunucu kullanımı" alt="E-posta, analitik ya da yapay zekâ hizmetleri yurt dışındaysa"><Anahtar acik={t.yurtDisi} set={(x) => tk.d("yurtDisi", x)} etiket="Yurt dışı aktarım" /></SatirAyar>
          <SatirAyar baslik="Ziyaret istatistiği" alt="Vayra analitiği çerezsizdir"><Anahtar acik={t.analitik} set={(x) => tk.d("analitik", x)} etiket="Analitik" /></SatirAyar>
          <SatirAyar baslik="Pazarlama izni" alt="Bülten ve kampanya e-postası gönderiyorsan"><Anahtar acik={t.pazarlamaIzni} set={(x) => tk.d("pazarlamaIzni", x)} etiket="Pazarlama izni" /></SatirAyar>
        </div>
      </Kart>
      <YanPanel acik={!!onizle} kapat={() => setOnizle(null)} genislik={760} baslik={html?.baslik ?? "Önizleme"} alt="Sitede sitenin üst menüsü ve stiliyle görünür">
        {!html ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : <div className="rounded-[16px] bg-white p-6 text-[14.5px] leading-[1.7] text-[#16181d] [&_h1]:mb-3 [&_h1]:text-[26px] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_mark]:rounded [&_mark]:bg-amber-200 [&_mark]:px-1 [&_ol_li]:list-decimal [&_p]:my-2.5 [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-black/10 [&_td]:p-2 [&_th]:border [&_th]:border-black/10 [&_th]:bg-black/[0.03] [&_th]:p-2 [&_th]:text-left" dangerouslySetInnerHTML={{ __html: html.html }} />}
      </YanPanel>
    </div>
  );
}
