"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, BarChart3, Boxes, Coins, CreditCard, Download, Globe, Loader2, Mail, Package, Plus, RefreshCcw, Search, ShoppingBag, ShoppingCart, Sparkles, Tag, Trash2, Truck, Wand2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { YanPanel } from "@/components/build/paylasim/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { YiginCubuk } from "@/components/build/bulut/ortak";
import { api, sahipAnahtari } from "@/lib/build/istemci";
import {
  KARGO_FIRMALARI_AYRINTI, kuponOzeti, SIPARIS_ASAMALARI, ulkeFirmalari, ulkeVergiVarsayilani, varyantAdi, varyantTemizle, VARSAYILAN_MAGAZA,
  type KargoYontem, type Kupon, type MagazaAyar, type SiparisAsama, type SiparisIsletme, type VergiKurali, type Varyantlar,
} from "@/lib/build/isletmeTipler";
import { ABD_EYALETLERI, ALT_BOLGELER, AB_ULKELERI, PARA_BIRIMLERI, ULKE_GRUPLARI, ULKELER, VERGI_MODELLERI, paraAdi, paraSimgesi, ulkeBul, ulkeGrubu, vergiAdi, type VergiModeli } from "@/lib/build/bolge";
import { cn } from "@/lib/utils";
import {
  Alan, BilgiSatiri, BosDurum, birincil, Girdi, GorselAlani, gorece, HataSatiri, ikincil, imza, isletmeApi, Istatistikler, KaydetSeridi, MetinAlani, OnayliDugme, panelBolgesi, Rozet, SayiGirdi, SecenekCipleri, simgeDugme, tarihSaat, tlYaz, useTaslak,
  type IsletmeKanca,
} from "./ortak";

type Urun = { id: string; ad: string; fiyat: number; aciklama?: string; gorsel?: string; gorseller?: string[]; stok?: number | null; aktif?: boolean; kategori?: string; eskiFiyat?: number | null; kdv?: number | null; sku?: string; varyantlar?: Varyantlar | null; agirlik?: number | null; olusturma: number; guncelleme: number };
type Kalem = { id: string; ad: string; fiyat: number; adet: number; tutar: number };
type Siparis = {
  id: string; siparisNo: string; durum: "bekliyor" | "odendi" | "basarisiz" | "iade"; tutar: number; saglayici: string; mod: "test" | "canli"; kalemler: Kalem[]; eposta: string;
  alici?: { ad: string; soyad: string; telefon: string; adres: string; sehir: string; postaKodu?: string; tc?: string; ulke?: string; bolge?: string }; paraBirimi?: string; olusturma: number; odemeZamani?: string | null; hata?: string | null; iadeTutari?: number | null;
  olaylar?: { z: number; olay: string; ayrinti?: string }[]; isletme?: SiparisIsletme; asama: SiparisAsama;
};
const DURUM: Record<Siparis["durum"], { ad: string; ton: "iyi" | "uyari" | "kotu" | "notr" }> = { odendi: { ad: "Ödendi", ton: "iyi" }, bekliyor: { ad: "Ödeme bekliyor", ton: "uyari" }, basarisiz: { ad: "Ödenmedi", ton: "kotu" }, iade: { ad: "İade edildi", ton: "notr" } };
const ASAMA_TON: Record<SiparisAsama, "notr" | "imza" | "iyi" | "uyari" | "kotu"> = { yeni: "imza", hazirlaniyor: "uyari", kargoda: "imza", teslim: "iyi", iptal: "kotu" };
const SAGLAYICI_AD: Record<string, string> = { iyzico: "iyzico", paytr: "PayTR", stripe: "Stripe", paypal: "PayPal" };
/** Panelde tutar girişlerinin birimi: işletmenin para birimi simgesi. */
const pbSimge = () => paraSimgesi(panelBolgesi().para, "tr-TR");
const asamaAd = (a: SiparisAsama) => SIPARIS_ASAMALARI.find((x) => x.id === a)?.ad ?? a;

type Ortak = { k: IsletmeKanca; projeId: string; ortam: "canli" | "test"; setOrtam: (o: "canli" | "test") => void; bulutaGit?: (b: string) => void; goster: (m: string, t?: "iyi" | "kotu") => void };

/** Canlı ve test verisi arasında geçiş. Ürünlerde yalnız test ortamı açıkken; siparişte ve raporda her zaman (önizleme ödemeleri test siparişidir). */
export function OrtamSecici({ o, her }: { o: Ortak; her?: boolean }) {
  if (!her && !o.k.d?.servis.testOrtami) return null;
  return <Secici id="isletme-ortam" kucuk deger={o.ortam} set={o.setOrtam} l={[{ id: "canli", ad: "Canlı" }, { id: "test", ad: "Test" }]} />;
}

/* ═════════════ Ürünler ═════════════ */
export function Urunler({ o }: { o: Ortak }) {
  const [l, setL] = useState<Urun[] | null>(null);
  const [kurulu, setKurulu] = useState(true);
  const [ara, setAra] = useState("");
  const [kategori, setKategori] = useState("");
  const [panel, setPanel] = useState<Urun | "yeni" | null>(null);
  const [hata, setHata] = useState("");
  const getir = useCallback(async () => {
    try { const r = await isletmeApi<{ urunler: Urun[]; var: boolean }>(o.projeId, `magaza?ortam=${o.ortam}`); setL(r.urunler); setKurulu(r.var); } catch (e) { setHata((e as Error).message); }
  }, [o.projeId, o.ortam]);
  useEffect(() => { getir(); }, [getir]);
  const kategoriler = useMemo(() => [...new Set((l ?? []).map((x) => x.kategori).filter(Boolean) as string[])], [l]);
  const dusuk = o.k.d?.veri.magaza.dusukStok ?? 3;
  const goster = (l ?? []).filter((x) => (!kategori || x.kategori === kategori) && (!ara || `${x.ad} ${x.sku ?? ""} ${x.kategori ?? ""}`.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr"))));
  const stokToplam = (u: Urun) => (u.varyantlar?.liste.length ? (u.varyantlar.liste.every((v) => typeof v.stok !== "number") ? null : u.varyantlar.liste.reduce((t, v) => t + (typeof v.stok === "number" ? v.stok : 0), 0)) : u.stok ?? null);
  return (
    <Kart ikon={Package} baslik="Ürünler" alt={l ? `${l.length} ürün · fiyatlar ${o.k.d?.veri.magaza.paraBirimi ?? ""} cinsinden${o.k.d?.veri.magaza.vergi.model === "yok" ? "" : o.k.d?.veri.magaza.vergi.dahil ? `, ${vergiAdi(o.k.d.veri.magaza.vergi.model)} dahil` : `, ${vergiAdi(o.k.d!.veri.magaza.vergi.model)} hariç`}; ödeme sunucuda bu tablodan hesaplanır` : "Yükleniyor"} sag={<><OrtamSecici o={o} /><button type="button" onClick={() => setPanel("yeni")} className={birincil} aria-label="Ürün ekle"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Ürün ekle</span></button></>}>
      <div className="p-3 sm:p-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        {!l ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? (
            <BosDurum ikon={ShoppingBag} baslik={kurulu ? "Henüz ürün yok" : "Mağaza henüz kurulmadı"} alt="Ürünleri buradan ekle: beden ve renk gibi seçenekler, stok, KDV oranı ve indirimli fiyat. Site bu listeyi vayra.magaza ile okur, ödeme Vayra Ödeme ile alınır."
              birincilEylem={{ ad: "İlk ürünü ekle", tikla: () => setPanel("yeni") }} ikincilEylem={o.bulutaGit ? { ad: "Ödeme sağlayıcısını bağla", tikla: () => o.bulutaGit!("odemeler") } : undefined} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ürün, stok kodu ya da kategori ara" className="pl-9" /></div>
                {kategoriler.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {["", ...kategoriler].map((c) => <button key={c || "hepsi"} type="button" onClick={() => setKategori(c)} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", kategori === c ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>{c || "Hepsi"}</button>)}
                  </div>
                )}
              </div>
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                {goster.map((u) => {
                  const s = stokToplam(u);
                  const durum = u.aktif === false ? <Rozet>Gizli</Rozet> : s === 0 ? <Rozet ton="kotu">Tükendi</Rozet> : s !== null && s <= dusuk ? <Rozet ton="uyari">Az kaldı</Rozet> : <Rozet ton="iyi">Satışta</Rozet>;
                  return (
                    <button key={u.id} type="button" onClick={() => setPanel(u)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">{u.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={u.gorsel} alt="" className="h-full w-full object-cover" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-white">{u.ad}</span>
                        <span className="block truncate text-[12px] text-white/50">{[u.kategori, u.varyantlar?.liste.length ? `${u.varyantlar.liste.length} seçenek` : null, u.sku ? `Kod ${u.sku}` : null, `güncellendi ${gorece(u.guncelleme)}`].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="hidden w-[90px] shrink-0 text-right text-[12.5px] tabular-nums text-white/60 sm:block">{s === null ? "Sınırsız" : `${s} adet`}</span>
                      <span className="w-[96px] shrink-0 text-right"><span className="block text-[13.5px] font-semibold tabular-nums text-white">{tlYaz(u.fiyat)}</span>{u.eskiFiyat ? <span className="block text-[11.5px] tabular-nums text-white/40 line-through">{tlYaz(u.eskiFiyat)}</span> : null}</span>
                      <span className="hidden w-[78px] shrink-0 justify-end sm:flex">{durum}</span>
                    </button>
                  );
                })}
                {!goster.length && <p className="px-4 py-6 text-center text-[13px] text-white/50">Aramaya uyan ürün yok.</p>}
              </div>
            </>
          )}
      </div>
      <UrunPaneli o={o} urun={panel} kapat={() => setPanel(null)} kategoriler={kategoriler} bitti={() => { setPanel(null); getir(); }} />
    </Kart>
  );
}

type UrunTaslak = Omit<Urun, "id" | "olusturma" | "guncelleme">;
const bosUrun = (): UrunTaslak => ({ ad: "", fiyat: 0, aciklama: "", gorsel: "", gorseller: [], stok: null, aktif: true, kategori: "", eskiFiyat: null, kdv: null, sku: "", varyantlar: null, agirlik: null });
function UrunPaneli({ o, urun, kapat, kategoriler, bitti }: { o: Ortak; urun: Urun | "yeni" | null; kapat: () => void; kategoriler: string[]; bitti: () => void }) {
  const [t, setT] = useState<UrunTaslak>(bosUrun());
  const [kaydediyor, setKaydediyor] = useState(false);
  const [ai, setAi] = useState(false);
  const [hata, setHata] = useState("");
  const [yeniSecenek, setYeniSecenek] = useState("");
  useEffect(() => { if (urun) { setHata(""); setT(urun === "yeni" ? bosUrun() : { ...bosUrun(), ...urun }); } }, [urun]);
  const d = <K extends keyof UrunTaslak>(k: K, v: UrunTaslak[K]) => setT((x) => ({ ...x, [k]: v }));
  const varyant = (v: Varyantlar | null) => d("varyantlar", v && v.secenekler.length ? varyantTemizle(v) : null);
  const kaydet = async () => {
    setKaydediyor(true); setHata("");
    try { await isletmeApi(o.projeId, "magaza/urun", { govde: { ortam: o.ortam, id: urun && urun !== "yeni" ? urun.id : null, urun: t } }); o.goster(urun === "yeni" ? "Ürün eklendi" : "Ürün kaydedildi"); bitti(); }
    catch (e) { setHata((e as Error).message); } finally { setKaydediyor(false); }
  };
  const sil = async () => {
    if (!urun || urun === "yeni") return;
    try { await isletmeApi(o.projeId, `magaza/urun/${urun.id}?ortam=${o.ortam}`, { method: "DELETE" }); o.goster("Ürün silindi"); bitti(); } catch (e) { setHata((e as Error).message); }
  };
  const aiYaz = async () => {
    if (!t.ad) { setHata("Önce ürün adını yaz."); return; }
    setAi(true); setHata("");
    try { const r = await isletmeApi<{ aciklama: string }>(o.projeId, "magaza/ai", { govde: { ad: t.ad, kategori: t.kategori, notlar: t.aciklama } }); d("aciklama", r.aciklama); }
    catch (e) { setHata((e as Error).message); } finally { setAi(false); }
  };
  const v = t.varyantlar;
  return (
    <YanPanel acik={!!urun} kapat={kapat} genislik={620} baslik={urun === "yeni" ? "Yeni ürün" : t.ad || "Ürün"} alt={o.ortam === "test" ? "Test veritabanında" : "Canlı veritabanında"}
      alt2={<>{urun !== "yeni" && <OnayliDugme soru="Ürün silinsin mi? Geçmiş siparişler etkilenmez." onayla={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</OnayliDugme>}<span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" disabled={kaydediyor || !t.ad || !(t.fiyat > 0)} onClick={kaydet} className={birincil}>{kaydediyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
          <GorselAlani projeId={o.projeId} deger={t.gorsel ?? ""} set={(x) => d("gorsel", x)} etiket="Ana görsel" className="max-sm:w-[140px]" />
          <div className="space-y-3">
            <Alan etiket="Ürün adı"><Girdi value={t.ad} onChange={(e) => d("ad", e.target.value)} maxLength={120} placeholder="Sırlı seramik kupa" /></Alan>
            <div className="grid grid-cols-2 gap-3">
              <Alan etiket="Fiyat" alt={o.k.d?.veri.magaza.vergi.model === "yok" ? undefined : o.k.d?.veri.magaza.vergi.dahil ? "vergi dahil" : "vergi hariç"}><SayiGirdi deger={t.fiyat || null} set={(x) => d("fiyat", x ?? 0)} bos birim={pbSimge()} /></Alan>
              <Alan etiket="Eski fiyat" alt="üstü çizili"><SayiGirdi deger={t.eskiFiyat ?? null} set={(x) => d("eskiFiyat", x)} bos birim={pbSimge()} /></Alan>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Alan etiket="Kategori"><Girdi value={t.kategori ?? ""} onChange={(e) => d("kategori", e.target.value)} list="isletme-kategoriler" maxLength={60} placeholder="Kupalar" /><datalist id="isletme-kategoriler">{kategoriler.map((c) => <option key={c} value={c} />)}</datalist></Alan>
          <Alan etiket="Stok kodu"><Girdi value={t.sku ?? ""} onChange={(e) => d("sku", e.target.value)} maxLength={40} placeholder="KUPA-01" /></Alan>
        </div>
        {o.k.d?.veri.magaza.vergi.model !== "yok" && (() => {
          const m = o.k.d?.veri.magaza, u = ulkeBul(o.k.d?.veri.profil.ulkeKodu);
          const ad = vergiAdi(m?.vergi.model ?? "vat"), oranlar = [...new Set([u?.vergi.oran ?? 0, ...(u?.vergi.indirimli ?? [])].filter((x) => x > 0))];
          return (
            <Alan etiket={`${ad} oranı`} alt={m?.vergi.model === "sales" ? "satış vergisi teslimat eyaletinden; vergisiz ürün için 0 seç" : "indirimli oranlı ürünlerde değiştir"}>
              <SecenekCipleri<number> deger={t.kdv ?? -1} set={(x) => d("kdv", x < 0 ? null : x)} ozel l={[{ id: -1, ad: `Varsayılan (yüzde ${m?.vergi.varsayilanOran ?? 0})` }, ...(m?.vergi.model === "sales" ? [] : oranlar.map((x) => ({ id: x, ad: `Yüzde ${String(x).replace(".", ",")}` }))), { id: 0, ad: "Vergisiz" }]} />
            </Alan>
          );
        })()}
        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[12.5px] font-medium text-white/75">Açıklama</span>
            <button type="button" onClick={aiYaz} disabled={ai || !o.k.d?.servis.ai} title={o.k.d?.servis.ai ? "" : "Yapay zekâ modeli bağlı değil"} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8be6ff] disabled:opacity-40">{ai ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Yapay zekâyla yaz</button></div>
          <MetinAlani value={t.aciklama ?? ""} onChange={(e) => d("aciklama", e.target.value)} rows={5} maxLength={4000} placeholder="Malzeme, ölçü, bakım. Notlarını yazıp yapay zekâya düzenletebilirsin." />
        </div>
        <div>
          <Etiket2>Ek görseller</Etiket2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {(t.gorseller ?? []).map((g, i) => <GorselAlani key={i} projeId={o.projeId} deger={g} set={(x) => d("gorseller", (t.gorseller ?? []).map((y, j) => (j === i ? x : y)).filter(Boolean))} etiket="Görsel" />)}
            {(t.gorseller ?? []).length < 8 && <GorselAlani projeId={o.projeId} deger="" set={(x) => x && d("gorseller", [...(t.gorseller ?? []), x])} etiket="Ekle" />}
          </div>
        </div>
        {/* Varyantlar */}
        <div className="rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-white/60" /><span className="flex-1 text-[13.5px] font-medium text-white">Seçenekler</span><span className="text-[12px] text-white/45">Beden, renk, boyut</span></div>
          {v?.secenekler.map((s, i) => (
            <div key={i} className="mt-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
              <div className="flex items-center gap-2">
                <Girdi value={s.ad} onChange={(e) => varyant({ ...v, secenekler: v.secenekler.map((x, j) => (j === i ? { ...x, ad: e.target.value } : x)) })} className="h-9 w-[150px]" maxLength={30} />
                <span className="flex-1" />
                <button type="button" onClick={() => varyant({ ...v, secenekler: v.secenekler.filter((_, j) => j !== i) })} className={simgeDugme} aria-label="Seçeneği kaldır"><Trash2 className="h-4 w-4" /></button>
              </div>
              <DegerGirdi degerler={s.degerler} set={(dl) => varyant({ ...v, secenekler: v.secenekler.map((x, j) => (j === i ? { ...x, degerler: dl } : x)) })} />
            </div>
          ))}
          {(v?.secenekler.length ?? 0) < 3 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {["Beden", "Renk", "Boyut"].filter((x) => !v?.secenekler.some((s) => s.ad === x)).map((x) => <button key={x} type="button" onClick={() => varyant({ secenekler: [...(v?.secenekler ?? []), { ad: x, degerler: x === "Beden" ? ["S", "M", "L"] : [] }], liste: v?.liste ?? [] })} className={ikincil}><Plus className="h-3.5 w-3.5" />{x}</button>)}
              <Girdi value={yeniSecenek} onChange={(e) => setYeniSecenek(e.target.value)} placeholder="Özel seçenek adı" className="h-9 w-[160px]" maxLength={30} onKeyDown={(e) => { if (e.key === "Enter" && yeniSecenek.trim()) { e.preventDefault(); varyant({ secenekler: [...(v?.secenekler ?? []), { ad: yeniSecenek.trim(), degerler: [] }], liste: v?.liste ?? [] }); setYeniSecenek(""); } }} />
            </div>
          )}
          {v && v.liste.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[460px] text-[12.5px]">
                <thead><tr className="text-left text-white/45"><th className="pb-1.5 font-medium">Bileşim</th><th className="pb-1.5 font-medium">Fiyat</th><th className="pb-1.5 font-medium">Stok</th><th className="pb-1.5 font-medium">Kod</th><th className="pb-1.5 font-medium">Satışta</th></tr></thead>
                <tbody>
                  {v.liste.map((x, i) => {
                    const dv = (p: Partial<typeof x>) => varyant({ ...v, liste: v.liste.map((y, j) => (j === i ? { ...y, ...p } : y)) });
                    return (
                      <tr key={x.id} className="border-t border-white/[0.05]">
                        <td className="py-1.5 pr-2 text-white">{varyantAdi(x)}</td>
                        <td className="py-1.5 pr-2"><SayiGirdi deger={x.fiyat} set={(n) => dv({ fiyat: n })} bos birim={pbSimge()} ph={String(t.fiyat || "")} className="w-[110px]" /></td>
                        <td className="py-1.5 pr-2"><SayiGirdi deger={x.stok} set={(n) => dv({ stok: n })} bos ph="Sınırsız" className="w-[90px]" /></td>
                        <td className="py-1.5 pr-2"><Girdi value={x.sku} onChange={(e) => dv({ sku: e.target.value })} className="h-9 w-[100px]" maxLength={40} /></td>
                        <td className="py-1.5"><Anahtar acik={x.aktif} set={(a) => dv({ aktif: a })} etiket={`${varyantAdi(x)} satışta`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-[11.5px] text-white/45">Fiyatı boş bırakılan bileşim ürün fiyatıyla satılır. Stok boşsa sınırsızdır; ödeme alınınca kendiliğinden düşer.</p>
            </div>
          )}
        </div>
        {!v && (
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket="Stok" alt="boşsa sınırsız"><SayiGirdi deger={t.stok ?? null} set={(x) => d("stok", x)} bos ph="Sınırsız" /></Alan>
            <Alan etiket="Ağırlık" alt="gram"><SayiGirdi deger={t.agirlik ?? null} set={(x) => d("agirlik", x)} bos birim="g" /></Alan>
          </div>
        )}
        <div className="flex items-center justify-between rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]">
          <span><span className="block text-[13.5px] font-medium text-white">Sitede göster</span><span className="block text-[12px] text-white/50">Kapalıyken ürün listelenmez ve satın alınamaz</span></span>
          <Anahtar acik={t.aktif !== false} set={(x) => d("aktif", x)} etiket="Sitede göster" />
        </div>
      </div>
    </YanPanel>
  );
}
const Etiket2 = ({ children }: { children: React.ReactNode }) => <span className="mb-1.5 block text-[12.5px] font-medium text-white/75">{children}</span>;
function DegerGirdi({ degerler, set }: { degerler: string[]; set: (l: string[]) => void }) {
  const [m, setM] = useState("");
  const ekle = () => { const l = m.split(",").map((x) => x.trim()).filter(Boolean); if (l.length) set([...new Set([...degerler, ...l])].slice(0, 30)); setM(""); };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {degerler.map((x) => <span key={x} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.08] pl-2.5 pr-1 text-[12.5px] text-white">{x}<button type="button" onClick={() => set(degerler.filter((y) => y !== x))} className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.1] hover:text-white" aria-label={`${x} kaldır`}><X className="h-3 w-3" /></button></span>)}
      <input value={m} onChange={(e) => setM(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); ekle(); } }} onBlur={ekle} placeholder="Değer yaz, Enter" className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-[12.5px] text-white outline-none placeholder:text-white/35" />
    </div>
  );
}

/* ═════════════ Siparişler ═════════════ */
export function Siparisler({ o }: { o: Ortak }) {
  const [l, setL] = useState<Siparis[] | null>(null);
  const [suz, setSuz] = useState<"hepsi" | "hazirla" | SiparisAsama | "odenmedi">("hazirla");
  const [ara, setAra] = useState("");
  const [secili, setSecili] = useState<Siparis | null>(null);
  const [hata, setHata] = useState("");
  const getir = useCallback(async () => {
    try {
      const r = await isletmeApi<{ siparisler: Siparis[] }>(o.projeId, `siparisler?ortam=${o.ortam}`);
      setL((onceki) => {
        // İlk yüklemede hazırlanacak sipariş yoksa bütün siparişler gösterilsin.
        if (!onceki && r.siparisler.length && !r.siparisler.some((s) => s.durum === "odendi" && (s.asama === "yeni" || s.asama === "hazirlaniyor"))) setSuz("hepsi");
        return r.siparisler;
      });
      setSecili((s) => (s ? r.siparisler.find((x) => x.siparisNo === s.siparisNo) ?? null : null));
    } catch (e) { setHata((e as Error).message); }
  }, [o.projeId, o.ortam]);
  useEffect(() => { setL(null); setSuz("hazirla"); getir(); const t = setInterval(getir, 30_000); return () => clearInterval(t); }, [getir]);
  const odenen = (l ?? []).filter((s) => s.durum === "odendi" || s.durum === "iade");
  const sayi = (f: typeof suz) => (l ?? []).filter((s) => eslesir(s, f)).length;
  function eslesir(s: Siparis, f: typeof suz) {
    if (f === "hepsi") return true;
    if (f === "odenmedi") return s.durum === "bekliyor" || s.durum === "basarisiz";
    if (f === "hazirla") return s.durum === "odendi" && (s.asama === "yeni" || s.asama === "hazirlaniyor");
    return (s.durum === "odendi" || s.durum === "iade") && s.asama === f;
  }
  const liste = (l ?? []).filter((s) => eslesir(s, suz) && (!ara || `${s.siparisNo} ${s.eposta} ${s.alici?.ad ?? ""} ${s.alici?.soyad ?? ""}`.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr"))));
  const indir = async () => {
    const r = await fetch(`/api/build/isletme/${o.projeId}/siparisler.csv?ortam=${o.ortam}`, { headers: { "x-build-sahip": sahipAnahtari() } });
    const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `siparisler-${o.ortam}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const SUZ: { id: typeof suz; ad: string }[] = [{ id: "hazirla", ad: "Hazırlanacak" }, { id: "kargoda", ad: "Kargoda" }, { id: "teslim", ad: "Teslim edildi" }, { id: "iptal", ad: "İptal" }, { id: "odenmedi", ad: "Ödenmedi" }, { id: "hepsi", ad: "Hepsi" }];
  return (
    <Kart ikon={ShoppingCart} baslik="Siparişler" alt={l ? `${odenen.length} ödenmiş sipariş · ${tlYaz(odenen.filter((s) => s.durum === "odendi").reduce((t, s) => t + s.tutar, 0))}` : "Yükleniyor"} sag={<><OrtamSecici o={o} her /><button type="button" onClick={getir} className={simgeDugme} aria-label="Yenile"><RefreshCcw className="h-4 w-4" /></button><button type="button" onClick={indir} className={ikincil} aria-label="Excel olarak indir"><Download className="h-4 w-4" /><span className="max-sm:hidden">Excel</span></button></>}>
      <div className="p-3 sm:p-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        {o.ortam === "test" && <div className="mb-3"><BilgiSatiri ton="uyari">Test siparişleri: önizlemeden ve test modundan gelen ödemeler. Canlı stoğa ve raporlara karışmaz.</BilgiSatiri></div>}
        {!l ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? <BosDurum ikon={ShoppingCart} baslik="Henüz sipariş yok" alt="Sitedeki ödeme düğmesi vayra.magaza.ode ya da vayra.odeme.ode ile çalışınca siparişler buraya düşer: hazırlama, kargo takip numarası, müşteri e-postası ve iade burada." birincilEylem={o.bulutaGit ? { ad: "Ödemeleri ayarla", tikla: () => o.bulutaGit!("odemeler"), ikon: CreditCard } : undefined} />
          : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUZ.map((x) => { const n = sayi(x.id); return <button key={x.id} type="button" onClick={() => setSuz(x.id)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium", suz === x.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>{x.ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", x.id === "hazirla" ? "bg-[#55d6fd] text-[#04212b]" : "bg-white/[0.1] text-white/70")}>{n}</span>}</button>; })}
                </div>
                <div className="relative ml-auto min-w-[200px] max-sm:w-full"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Numara, ad ya da e-posta" className="pl-9" /></div>
              </div>
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                {liste.map((s) => (
                  <button key={s.id} type="button" onClick={() => setSecili(s)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium text-white">{s.alici ? `${s.alici.ad} ${s.alici.soyad}` : s.eposta}</span>{s.mod === "test" && <Rozet>Test</Rozet>}</span>
                      <span className="block truncate text-[12px] text-white/50">{s.siparisNo} · {s.kalemler.filter((k) => !k.id.startsWith("kargo-")).reduce((t, k) => t + k.adet, 0)} ürün · {gorece(s.olusturma)}{s.isletme?.kupon ? ` · ${s.isletme.kupon.kod}` : ""}</span>
                    </span>
                    <span className="shrink-0 text-right"><span className="block text-[13.5px] font-semibold tabular-nums text-white">{tlYaz(s.tutar, s.paraBirimi)}</span></span>
                    <span className="flex w-[118px] shrink-0 flex-col items-end gap-1">{s.durum === "odendi" ? <Rozet ton={ASAMA_TON[s.asama]}>{asamaAd(s.asama)}</Rozet> : <Rozet ton={DURUM[s.durum].ton}>{DURUM[s.durum].ad}</Rozet>}</span>
                  </button>
                ))}
                {!liste.length && <p className="px-4 py-6 text-center text-[13px] text-white/50">Bu süzgece uyan sipariş yok.</p>}
              </div>
            </>
          )}
      </div>
      <SiparisPaneli o={o} s={secili} kapat={() => setSecili(null)} yenile={getir} />
    </Kart>
  );
}

function SiparisPaneli({ o, s, kapat, yenile }: { o: Ortak; s: Siparis | null; kapat: () => void; yenile: () => Promise<void> }) {
  const [firma, setFirma] = useState("");
  const [takip, setTakip] = useState("");
  const [not, setNot] = useState("");
  const [isliyor, setIsliyor] = useState("");
  const [hata, setHata] = useState("");
  useEffect(() => { if (s) { setFirma(s.isletme?.kargo?.firma || o.k.d?.veri.magaza.kargo[0]?.firma || ""); setTakip(s.isletme?.kargo?.takipNo ?? ""); setNot(""); setHata(""); } }, [s, o.k.d]);
  if (!s) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const i = s.isletme;
  const islem = async (ad: string, govde: Record<string, unknown>) => {
    setIsliyor(ad); setHata("");
    try {
      const r = await isletmeApi<{ eposta: string }>(o.projeId, `siparis/${s.siparisNo}`, { govde: { ortam: o.ortam, ...govde } });
      o.goster(r.eposta === "gitti" ? "Kaydedildi, müşteriye e-posta gitti" : r.eposta === "kurulu-degil" ? "Kaydedildi. E-posta servisi kurulu olmadığı için müşteriye e-posta gitmedi" : "Kaydedildi", r.eposta === "kurulu-degil" ? "kotu" : "iyi");
      await yenile();
    } catch (e) { setHata((e as Error).message); } finally { setIsliyor(""); }
  };
  const iade = async () => {
    setIsliyor("iade"); setHata("");
    try { await api(`/api/build/odeme/${o.projeId}`, { govde: { islem: "iade", siparisNo: s.siparisNo } }); await isletmeApi(o.projeId, `siparis/${s.siparisNo}`, { govde: { ortam: o.ortam, asama: "iptal", not: "Ödeme iade edildi" } }); o.goster("İade edildi"); await yenile(); }
    catch (e) { setHata((e as Error).message); } finally { setIsliyor(""); }
  };
  const sira: SiparisAsama[] = ["yeni", "hazirlaniyor", "kargoda", "teslim"];
  const firmalar = [...new Set([...(o.k.d?.veri.magaza.kargo.map((k) => k.firma).filter(Boolean) ?? []), ...KARGO_FIRMALARI_AYRINTI.map((x) => x.ad)])];
  const gecmis = [...(s.olaylar ?? []).map((x) => ({ z: x.z, olay: x.olay, ayrinti: x.ayrinti })), ...(i?.gecmis ?? []).map((x) => ({ z: x.z, olay: x.olay, ayrinti: undefined })), ...(i?.notlar ?? []).map((x) => ({ z: x.z, olay: "Not", ayrinti: x.metin }))].sort((a, b) => b.z - a.z);
  return (
    <YanPanel acik={!!s} kapat={kapat} genislik={560} baslik={`Sipariş ${s.siparisNo}`} alt={`${tarihSaat(s.olusturma)} · ${SAGLAYICI_AD[s.saglayici] ?? s.saglayici}${s.mod === "test" ? " · test ödemesi" : ""}`} durum={s.durum === "odendi" ? <Rozet ton={ASAMA_TON[s.asama]} className="mt-1">{asamaAd(s.asama)}</Rozet> : <Rozet ton={DURUM[s.durum].ton} className="mt-1">{DURUM[s.durum].ad}</Rozet>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        {s.durum === "odendi" && s.asama !== "iptal" && (
          <div>
            <ol className="flex items-center gap-1">
              {sira.map((a, n) => { const gecti = sira.indexOf(s.asama) >= n; return <li key={a} className="flex flex-1 flex-col items-center gap-1.5"><span className={cn("h-1.5 w-full rounded-full", gecti ? "bg-[#55d6fd]" : "bg-white/[0.1]")} /><span className={cn("text-[11.5px]", gecti ? "text-white" : "text-white/40")}>{asamaAd(a)}</span></li>; })}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.asama === "yeni" && <button type="button" disabled={!!isliyor} onClick={() => islem("asama", { asama: "hazirlaniyor" })} className={birincil}>{isliyor === "asama" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Hazırlamaya başla</button>}
              {(s.asama === "yeni" || s.asama === "hazirlaniyor") && <span className="text-[12px] text-white/45 self-center">Kargoya vermek için takip numarasını aşağıya yaz</span>}
              {s.asama === "kargoda" && <button type="button" disabled={!!isliyor} onClick={() => islem("asama", { asama: "teslim" })} className={birincil}>{isliyor === "asama" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Teslim edildi</button>}
            </div>
          </div>
        )}
        <div className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          {s.kalemler.map((k) => <div key={k.id} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]"><span className="min-w-0 flex-1 text-white">{k.ad}</span><span className="tabular-nums text-white/55">{k.adet} x {tlYaz(k.fiyat, s.paraBirimi)}</span><span className="w-[84px] text-right tabular-nums text-white">{tlYaz(k.tutar, s.paraBirimi)}</span></div>)}
          <div className="space-y-1 px-3.5 py-2.5 text-[12.5px]">
            {i?.araToplam !== undefined && <p className="flex justify-between text-white/60"><span>Ara toplam</span><span className="tabular-nums">{tlYaz(i.araToplam, s.paraBirimi)}</span></p>}
            {!!i?.indirim && <p className="flex justify-between text-emerald-200/90"><span>İndirim{i.kupon ? ` (${i.kupon.kod})` : ""}</span><span className="tabular-nums">eksi {tlYaz(i.indirim, s.paraBirimi)}</span></p>}
            {i?.kargoUcreti !== undefined && <p className="flex justify-between text-white/60"><span>Kargo{i.kargo?.ad ? `: ${i.kargo.ad}` : ""}</span><span className="tabular-nums">{i.kargoUcreti ? tlYaz(i.kargoUcreti, s.paraBirimi) : "Ücretsiz"}</span></p>}
            {i?.kdv?.map((x) => <p key={x.oran} className="flex justify-between text-white/45"><span>{i?.vergi && !i.vergi.dahil ? `${i.vergi.ad} (yüzde ${x.oran})` : `İçindeki ${i?.vergi?.ad || "KDV"} (yüzde ${x.oran})`}</span><span className="tabular-nums">{tlYaz(x.tutar, s.paraBirimi)}</span></p>)}
            {i?.vergi?.not && <p className="text-[11.5px] text-white/45">{i.vergi.not}</p>}
            <p className="flex justify-between pt-1 text-[14px] font-semibold text-white"><span>Toplam</span><span className="tabular-nums">{tlYaz(s.tutar, s.paraBirimi)}</span></p>
            {s.durum === "iade" && <p className="flex justify-between text-rose-200"><span>İade</span><span className="tabular-nums">{tlYaz(s.iadeTutari ?? s.tutar, s.paraBirimi)}</span></p>}
          </div>
        </div>
        {s.alici && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-white/[0.03] p-3.5 text-[12.5px] leading-relaxed text-white/70 ring-1 ring-inset ring-white/[0.07]"><p className="mb-1 text-[12px] font-medium text-white">Alıcı ve teslimat</p>{s.alici.ad} {s.alici.soyad}<br />{s.alici.adres}<br />{s.alici.sehir}{s.alici.bolge ? `, ${s.alici.bolge}` : ""}{s.alici.postaKodu ? ` ${s.alici.postaKodu}` : ""}{s.alici.ulke ? <><br />{ulkeBul(s.alici.ulke)?.ad ?? s.alici.ulke}</> : null}<br /><a href={`tel:${s.alici.telefon}`} className="text-[#8be6ff]">{s.alici.telefon}</a><br /><a href={`mailto:${s.eposta}`} className="text-[#8be6ff]">{s.eposta}</a></div>
            <div className="rounded-[16px] bg-white/[0.03] p-3.5 text-[12.5px] leading-relaxed text-white/70 ring-1 ring-inset ring-white/[0.07]"><p className="mb-1 text-[12px] font-medium text-white">Fatura</p>{i?.fatura?.tur === "kurumsal" ? <>{i.fatura.unvan}<br />{i.fatura.vergiDairesi} Vergi Dairesi<br />Vergi no {i.fatura.vergiNo}{i.fatura.adres && <><br />{i.fatura.adres}</>}</> : <>Bireysel{s.alici.tc ? <><br />TC {s.alici.tc}</> : null}</>}{i?.not && <><p className="mb-1 mt-2 text-[12px] font-medium text-white">Müşteri notu</p>{i.not}</>}</div>
          </div>
        )}
        {s.durum === "odendi" && s.asama !== "iptal" && s.asama !== "teslim" && (
          <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
            <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white"><Truck className="h-4 w-4 text-white/60" />Kargo</p>
            <SecenekCipleri<string> deger={firma} set={setFirma} l={firmalar.slice(0, 6).map((x) => ({ id: x, ad: x }))} ozel ozelTur="metin" />
            <div className="mt-2 flex gap-2"><Girdi value={takip} onChange={(e) => setTakip(e.target.value)} placeholder="Takip numarası" maxLength={60} />
              <button type="button" disabled={!!isliyor || !takip.trim()} onClick={() => islem("kargo", { kargo: { firma, takipNo: takip.trim() }, asama: "kargoda" })} className={birincil}>{isliyor === "kargo" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kargoya verildi</button></div>
            <p className="mt-1.5 text-[11.5px] text-white/45">{o.k.d?.veri.magaza.musteriEposta ? (o.k.d.servis.eposta ? "Müşteriye takip numarasıyla e-posta gider." : "E-posta servisi kurulu değil; müşteriye e-posta gitmez, takip numarasını sitedeki sipariş sorgusundan görür.") : "Müşteri e-postaları kapalı."}</p>
          </div>
        )}
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-white/75">İç not</p>
          <div className="flex gap-2"><Girdi value={not} onChange={(e) => setNot(e.target.value)} placeholder="Yalnız ekibin görür" maxLength={600} /><button type="button" disabled={!not.trim() || !!isliyor} onClick={() => islem("not", { not })} className={ikincil}>Ekle</button></div>
        </div>
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-white/75">Geçmiş</p>
          <ol className="space-y-2 border-l border-white/[0.1] pl-3.5">
            {gecmis.map((x, n) => <li key={n} className="relative text-[12.5px]"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-white/30" /><span className="text-white">{x.olay}</span>{x.ayrinti && <span className="text-white/55">: {x.ayrinti}</span>}<span className="block text-[11.5px] text-white/40">{tarihSaat(x.z)}</span></li>)}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
          {s.durum === "odendi" && <OnayliDugme disabled={!!isliyor} soru={`${tlYaz(s.tutar, s.paraBirimi)} iade edilsin mi? Geri alınamaz.`} onayla={iade} className={cn(ikincil, "text-rose-200")}>{isliyor === "iade" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-4 w-4" />}Ödemeyi iade et</OnayliDugme>}
          {s.durum === "odendi" && s.asama !== "iptal" && <OnayliDugme disabled={!!isliyor} soru="İptal edilsin mi? İade ayrıca yapılır." onayla={() => islem("iptal", { asama: "iptal" })} className={ikincil}>Siparişi iptal et</OnayliDugme>}
          <a href={`mailto:${s.eposta}?subject=${encodeURIComponent(`Siparişiniz ${s.siparisNo}`)}`} className={ikincil}><Mail className="h-4 w-4" />Müşteriye yaz</a>
        </div>
      </div>
    </YanPanel>
  );
}

/* ═════════════ Kuponlar ═════════════ */
const bosKupon = (): Omit<Kupon, "id" | "olusturma"> => ({ kod: "", tur: "yuzde", deger: 10, minSepet: null, baslangic: "", bitis: "", sinir: null, kisiBasi: 1, kategoriler: [], aktif: true, aciklama: "" });
export function Kuponlar({ o }: { o: Ortak }) {
  const kuponlar = o.k.d?.veri.kuponlar ?? [];
  const [panel, setPanel] = useState<Kupon | "yeni" | null>(null);
  const [kullanim, setKullanim] = useState<Record<string, { adet: number; indirim: number; ciro: number }>>({});
  useEffect(() => { isletmeApi<{ rapor: { kuponlar: { kod: string; adet: number; indirim: number; ciro: number }[] } }>(o.projeId, "rapor?gun=90").then((r) => setKullanim(Object.fromEntries(r.rapor.kuponlar.map((x) => [x.kod, x])))).catch(() => {}); }, [o.projeId]);
  const bugun = new Date(Date.now()).toLocaleDateString("en-CA", { timeZone: panelBolgesi().tz });
  const durum = (k: Kupon) => !k.aktif ? <Rozet>Kapalı</Rozet> : k.bitis && bugun > k.bitis ? <Rozet ton="kotu">Süresi doldu</Rozet> : k.baslangic && bugun < k.baslangic ? <Rozet ton="uyari">Başlamadı</Rozet> : <Rozet ton="iyi">Geçerli</Rozet>;
  return (
    <Kart ikon={Tag} baslik="Kuponlar ve indirimler" alt="Yüzde, tutar ya da ücretsiz kargo; sepet alt sınırı, tarih ve kullanım sınırıyla" sag={<button type="button" onClick={() => setPanel("yeni")} className={birincil} aria-label="Kupon oluştur"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Kupon oluştur</span></button>}>
      <div className="p-3 sm:p-4">
        {!kuponlar.length ? <BosDurum ikon={Tag} baslik="Henüz kupon yok" alt="Açılış indirimi, ücretsiz kargo ya da bültene katılanlara özel kod oluştur. Kod sitenin ödeme adımında sunucuda doğrulanır." birincilEylem={{ ad: "Kupon oluştur", tikla: () => setPanel("yeni") }} />
          : (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
              {kuponlar.map((k) => {
                const u = kullanim[k.kod];
                return (
                  <button key={k.id} type="button" onClick={() => setPanel(k)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]">
                    <span className="flex h-11 min-w-[110px] items-center justify-center rounded-[12px] border border-dashed border-white/25 px-3 font-semibold tracking-[0.04em] text-white">{k.kod}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{kuponOzeti(k)}</span><span className="block truncate text-[12px] text-white/50">{[k.bitis ? `${k.bitis} tarihine kadar` : "Süresiz", k.sinir ? `en çok ${k.sinir} kullanım` : null, k.kisiBasi ? `kişi başı ${k.kisiBasi}` : null, k.kategoriler.length ? k.kategoriler.join(", ") : null].filter(Boolean).join(" · ")}</span></span>
                    <span className="hidden shrink-0 text-right text-[12px] text-white/55 sm:block">{u ? <>{u.adet} kullanım<br />{tlYaz(u.ciro)} satış</> : "Kullanılmadı"}</span>
                    {durum(k)}
                  </button>
                );
              })}
            </div>
          )}
      </div>
      <KuponPaneli o={o} kupon={panel} kapat={() => setPanel(null)} />
    </Kart>
  );
}
function KuponPaneli({ o, kupon, kapat }: { o: Ortak; kupon: Kupon | "yeni" | null; kapat: () => void }) {
  const [t, setT] = useState(bosKupon());
  const [hata, setHata] = useState("");
  const [is, setIs] = useState(false);
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  useEffect(() => { if (kupon) { setHata(""); setT(kupon === "yeni" ? bosKupon() : { ...kupon }); isletmeApi<{ kategoriler: string[] }>(o.projeId, "magaza").then((r) => setKategoriler(r.kategoriler)).catch(() => {}); } }, [kupon, o.projeId]);
  const d = <K extends keyof typeof t>(k: K, v: (typeof t)[K]) => setT((x) => ({ ...x, [k]: v }));
  const kaydet = async () => {
    setIs(true); setHata("");
    try { const r = await isletmeApi<{ kuponlar: Kupon[] }>(o.projeId, "kupon", { govde: { id: kupon && kupon !== "yeni" ? kupon.id : undefined, kupon: t } }); o.k.veriAyarla({ kuponlar: r.kuponlar }); o.goster("Kupon kaydedildi"); kapat(); }
    catch (e) { setHata((e as Error).message); } finally { setIs(false); }
  };
  const sil = async () => {
    if (!kupon || kupon === "yeni") return;
    const r = await isletmeApi<{ kuponlar: Kupon[] }>(o.projeId, `kupon/${kupon.id}`, { method: "DELETE" }); o.k.veriAyarla({ kuponlar: r.kuponlar }); kapat();
  };
  const uret = () => d("kod", (o.k.d?.veri.profil.ad || "VAYRA").toLocaleUpperCase("tr").replace(/[^A-Z0-9]/g, "").slice(0, 6) + Math.random().toString(36).slice(2, 6).toUpperCase());
  return (
    <YanPanel acik={!!kupon} kapat={kapat} baslik={kupon === "yeni" ? "Yeni kupon" : t.kod} alt={kuponOzeti(t)}
      alt2={<>{kupon !== "yeni" && <OnayliDugme soru="Kupon silinsin mi?" onayla={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</OnayliDugme>}<span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" disabled={is || t.kod.length < 3} onClick={kaydet} className={birincil}>{is && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        <Alan etiket="Kod"><div className="flex gap-2"><Girdi value={t.kod} onChange={(e) => d("kod", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} maxLength={30} placeholder="ACILIS20" className="font-semibold tracking-[0.04em]" /><button type="button" onClick={uret} className={ikincil}><Sparkles className="h-4 w-4" />Üret</button></div></Alan>
        <Alan etiket="İndirim türü"><Secici id="kupon-tur" deger={t.tur} set={(x) => d("tur", x)} l={[{ id: "yuzde", ad: "Yüzde" }, { id: "tutar", ad: "Tutar" }, { id: "kargo", ad: "Ücretsiz kargo" }]} /></Alan>
        {t.tur === "yuzde" && <Alan etiket="İndirim oranı"><SecenekCipleri<number> deger={t.deger} set={(x) => d("deger", Math.min(90, Math.max(1, x)))} l={[5, 10, 15, 20, 25, 50].map((x) => ({ id: x, ad: `Yüzde ${x}` }))} ozel birim="yüzde" /></Alan>}
        {t.tur === "tutar" && <Alan etiket="İndirim tutarı"><SayiGirdi deger={t.deger} set={(x) => d("deger", x ?? 0)} birim={pbSimge()} /></Alan>}
        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="En az sepet" alt="isteğe bağlı"><SayiGirdi deger={t.minSepet} set={(x) => d("minSepet", x)} bos birim={pbSimge()} /></Alan>
          <Alan etiket="Kişi başı kullanım"><SayiGirdi deger={t.kisiBasi} set={(x) => d("kisiBasi", x)} bos ph="Sınırsız" min={1} /></Alan>
          <Alan etiket="Başlangıç"><Girdi type="date" value={t.baslangic} onChange={(e) => d("baslangic", e.target.value)} /></Alan>
          <Alan etiket="Bitiş"><Girdi type="date" value={t.bitis} onChange={(e) => d("bitis", e.target.value)} /></Alan>
          <Alan etiket="Toplam kullanım sınırı" className="col-span-2"><SayiGirdi deger={t.sinir} set={(x) => d("sinir", x)} bos ph="Sınırsız" min={1} /></Alan>
        </div>
        {kategoriler.length > 0 && (
          <Alan etiket="Yalnız bu kategorilerde" alt="seçmezsen bütün ürünlerde">
            <div className="flex flex-wrap gap-1.5">{kategoriler.map((c) => { const s = t.kategoriler.includes(c); return <button key={c} type="button" onClick={() => d("kategoriler", s ? t.kategoriler.filter((x) => x !== c) : [...t.kategoriler, c])} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>{c}</button>; })}</div>
          </Alan>
        )}
        <div className="flex items-center justify-between rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]"><span className="text-[13.5px] font-medium text-white">Kupon etkin</span><Anahtar acik={t.aktif} set={(x) => d("aktif", x)} etiket="Kupon etkin" /></div>
        <BilgiSatiri>Kullanım sayısı yalnız ödenmiş canlı siparişlerden sayılır. Yüzde indirim en çok yüzde 90 olabilir.</BilgiSatiri>
      </div>
    </YanPanel>
  );
}

/* ═════════════ Para birimi, vergi, kargo ve mağaza ayarları ═════════════ */
const yeniYontem = (ulke: string): KargoYontem => ({ id: Math.random().toString(36).slice(2, 10), ad: "Yeni kargo", firma: ulkeFirmalari(ulke)[0] ?? "UPS", ucret: 0, ucretsizEsik: null, sure: "2-5 iş günü", aktif: true, takipAdresi: "", ulkeler: ulke ? [ulke] : [], bolgeler: [], ucretTuru: "sabit", kgBasi: 0 });
const ULKE_HAZIR = (ev: string): { ad: string; l: string[] }[] => [
  ...(ev ? [{ ad: "Yurt içi", l: [ev] }] : []),
  { ad: "Avrupa Birliği", l: ulkeGrubu("ab") }, { ad: "Avrupa", l: [...ulkeGrubu("ab"), ...ulkeGrubu("avrupa")] }, { ad: "Kuzey Amerika", l: ulkeGrubu("kuzey-amerika") },
  { ad: "Asya ve Pasifik", l: ulkeGrubu("asya-pasifik") }, { ad: "Orta Doğu", l: ulkeGrubu("orta-dogu") },
];
const ulkeOzeti = (l: string[], ev: string) => (!l.length ? "Tüm ülkeler" : l.length === 1 ? (l[0] === ev ? `Yurt içi (${ulkeBul(l[0])?.ad ?? l[0]})` : ulkeBul(l[0])?.ad ?? l[0]) : `${l.slice(0, 3).map((k) => ulkeBul(k)?.ad ?? k).join(", ")}${l.length > 3 ? ` ve ${l.length - 3} ülke daha` : ""}`);

/** Ülke seçici: hazır bölgeler ve tek tek ülkeler; boş liste "tüm ülkeler" demektir. */
function UlkeSecici({ deger, set, ev, bosAd = "Tüm ülkeler" }: { deger: string[]; set: (l: string[]) => void; ev: string; bosAd?: string }) {
  const [acik, setAcik] = useState(false);
  const [ara, setAra] = useState("");
  const sec = new Set(deger);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => set([])} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", !deger.length ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09]")}>{bosAd}</button>
        {ULKE_HAZIR(ev).map((h) => { const ayni = h.l.length === deger.length && h.l.every((x) => sec.has(x)); return <button key={h.ad} type="button" onClick={() => set(h.l)} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", ayni ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09]")}>{h.ad}</button>; })}
        <button type="button" onClick={() => setAcik(!acik)} className="h-8 rounded-full bg-white/[0.05] px-3 text-[12.5px] font-medium text-[#8be6ff] hover:bg-white/[0.09]">{acik ? "Listeyi kapat" : `Ülke seç${deger.length ? ` (${deger.length})` : ""}`}</button>
      </div>
      {acik && (
        <div className="mt-2 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
          <Girdi value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ülke ara" className="h-9" />
          <div className="mt-2 max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {ULKE_GRUPLARI.map((g) => { const l = ULKELER.filter((u) => u.grup === g.id && (!ara || u.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")))); if (!l.length) return null; return (
              <div key={g.id}><span className="mb-1 block text-[11.5px] text-white/40">{g.ad}</span><div className="flex flex-wrap gap-1">{l.map((u) => (
                <button key={u.kod} type="button" onClick={() => set(sec.has(u.kod) ? deger.filter((x) => x !== u.kod) : [...deger, u.kod])} className={cn("h-7 rounded-full px-2.5 text-[12px]", sec.has(u.kod) ? "bg-[#55d6fd]/[0.16] text-[#c9f3ff] ring-1 ring-inset ring-[#55d6fd]/40" : "bg-white/[0.05] text-white/65 hover:bg-white/[0.09]")}>{u.ad}</button>
              ))}</div></div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
}

export function KargoVergi({ o }: { o: Ortak }) {
  const asil = o.k.d?.veri.magaza ?? VARSAYILAN_MAGAZA;
  const ev = o.k.d?.veri.profil.ulkeKodu ?? "";
  const tk = useTaslak<MagazaAyar>(asil, (v) => o.k.kaydet("magaza", v));
  const t = tk.t;
  const dy = (i: number, p: Partial<KargoYontem>) => tk.d("kargo", t.kargo.map((y, j) => (j === i ? { ...y, ...p } : y)));
  const dv = (p: Partial<MagazaAyar["vergi"]>) => tk.d("vergi", { ...t.vergi, ...p });
  const kuponlar = o.k.d?.veri.kuponlar ?? [];
  const simge = paraSimgesi(t.paraBirimi, "tr-TR");
  const [kurYuk, setKurYuk] = useState(false);
  const [kurHata, setKurHata] = useState("");
  const [yeniKural, setYeniKural] = useState<{ ulke: string; bolge: string; oran: number | null }>({ ulke: "", bolge: "", oran: null });
  const kurYenile = async () => {
    setKurYuk(true); setKurHata("");
    try { if (tk.degisti) await tk.kaydet(); const r = await isletmeApi<{ veri: NonNullable<typeof o.k.d>["veri"] }>(o.projeId, "magaza/doviz", { govde: {} }); o.k.veriAyarla({ magaza: r.veri.magaza }); tk.setT((x) => ({ ...x, kurlar: r.veri.magaza.kurlar })); o.goster("Kurlar güncellendi"); }
    catch (e) { setKurHata((e as Error).message); } finally { setKurYuk(false); }
  };
  const ulkeVarsayilani = () => { const v = ulkeVergiVarsayilani(ev); tk.setT((x) => ({ ...x, vergi: v, varsayilanKdv: v.varsayilanOran, paraBirimi: ulkeBul(ev)?.para ?? x.paraBirimi })); };
  const abdHazir = () => dv({ kurallar: [...t.vergi.kurallar.filter((k) => k.ulke !== "US"), ...ABD_EYALETLERI.filter((e) => (e.oran ?? 0) > 0).map((e): VergiKurali => ({ id: `US-${e.kod}`, ulke: "US", bolge: e.kod, oran: e.oran ?? 0, ad: "Sales tax" }))] });
  const abHazir = () => dv({ kurallar: [...t.vergi.kurallar.filter((k) => !AB_ULKELERI.includes(k.ulke) || k.ulke === ev), ...ULKELER.filter((u) => u.grup === "ab" && u.kod !== ev).map((u): VergiKurali => ({ id: `AB-${u.kod}`, ulke: u.kod, bolge: "", oran: u.vergi.oran, ad: "VAT" }))] });
  const kanadaHazir = () => dv({ kurallar: [...t.vergi.kurallar.filter((k) => k.ulke !== "CA"), ...(ALT_BOLGELER.CA ?? []).map((b): VergiKurali => ({ id: `CA-${b.kod}`, ulke: "CA", bolge: b.kod, oran: b.oran ?? 5, ad: b.not ?? "GST" }))] });
  const kuralGrup = useMemo(() => { const m = new Map<string, VergiKurali[]>(); for (const k of t.vergi.kurallar) m.set(k.ulke, [...(m.get(k.ulke) ?? []), k]); return [...m.entries()]; }, [t.vergi.kurallar]);
  const seri = <KaydetSeridi {...tk} kaydet={tk.kaydet} />;
  const ekPara = PARA_BIRIMLERI.filter((p) => p.kod !== t.paraBirimi);
  return (
    <div className="space-y-4">
      <Kart ikon={Coins} baslik="Para birimi" alt="Ürün fiyatları ana para biriminde girilir; ek para birimlerinde vitrin ve ödeme kurla çevrilir" altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Ana para birimi" alt={t.paraBirimi !== asil.paraBirimi ? "Değiştirince var olan fiyatlar çevrilmez; ürün fiyatlarını yeni birime göre gözden geçir" : "Raporlar ve kuponlar bu birimdedir"}>
            <select value={t.paraBirimi} onChange={(e) => tk.setT((x) => ({ ...x, paraBirimi: e.target.value, ekParaBirimleri: x.ekParaBirimleri.filter((y) => y.kod !== e.target.value) }))} className="h-9 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]">
              {PARA_BIRIMLERI.map((p) => <option key={p.kod} value={p.kod}>{p.kod} · {p.ad}</option>)}
            </select>
          </SatirAyar>
          <div className="space-y-2 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[200px] flex-1"><span className="block text-[13.5px] font-medium text-white">Ek para birimleri</span><span className="mt-0.5 block text-[12px] text-white/50">Ziyaretçi para birimini seçer; ödeme sağlayıcısı destekliyorsa o birimle ödenir. Otomatik kur ECB referans kurundan günde bir kez yenilenir.</span></span>
              <select value="" onChange={(e) => e.target.value && tk.d("ekParaBirimleri", [...t.ekParaBirimleri, { kod: e.target.value, kur: null, otomatik: true, yuvarlama: "yok" }])} className="h-9 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]">
                <option value="">Para birimi ekle</option>
                {ekPara.filter((p) => !t.ekParaBirimleri.some((e) => e.kod === p.kod)).map((p) => <option key={p.kod} value={p.kod}>{p.kod} · {p.ad}</option>)}
              </select>
              {t.ekParaBirimleri.some((e) => e.otomatik) && <button type="button" disabled={kurYuk} onClick={kurYenile} className={ikincil}>{kurYuk ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}Kurları yenile</button>}
            </div>
            {kurHata && <HataSatiri mesaj={kurHata} kapat={() => setKurHata("")} />}
            {t.ekParaBirimleri.map((e, i) => {
              const oto = t.kurlar && t.kurlar.taban === t.paraBirimi ? t.kurlar.oranlar[e.kod] : undefined;
              const de = (p: Partial<typeof e>) => tk.d("ekParaBirimleri", t.ekParaBirimleri.map((y, j) => (j === i ? { ...y, ...p } : y)));
              return (
                <div key={e.kod} className="flex flex-wrap items-center gap-2 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]">
                  <span className="w-[150px] text-[13px] font-medium text-white">{e.kod}<span className="block text-[11.5px] font-normal text-white/45">{paraAdi(e.kod)}</span></span>
                  <Secici id={`kur-${e.kod}`} kucuk deger={e.otomatik ? "oto" : "elle"} set={(x) => de({ otomatik: x === "oto" })} l={[{ id: "oto", ad: "Otomatik kur" }, { id: "elle", ad: "Elle" }]} />
                  {e.otomatik ? <span className="text-[12.5px] tabular-nums text-white/60">{oto ? `1 ${t.paraBirimi} karşılığı ${oto.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} ${e.kod}` : "Kur henüz çekilmedi"}</span>
                    : <SayiGirdi deger={e.kur} set={(x) => de({ kur: x })} bos ph="Kur" birim={e.kod} className="w-[150px]" />}
                  <SecenekCipleri<string> deger={e.yuvarlama} set={(x) => de({ yuvarlama: x as typeof e.yuvarlama })} l={[{ id: "yok", ad: "Yuvarlama yok" }, { id: "tam", ad: "Tam sayıya" }, { id: "99", ad: "Sonu 99" }]} />
                  <span className="flex-1" /><button type="button" onClick={() => tk.d("ekParaBirimleri", t.ekParaBirimleri.filter((_, j) => j !== i))} className={simgeDugme} aria-label={`${e.kod} kaldır`}><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
            {t.kurlar && t.ekParaBirimleri.length > 0 && <p className="text-[11.5px] text-white/40">Son kur: {tarihSaat(t.kurlar.z)} · {t.kurlar.kaynak}</p>}
          </div>
        </div>
      </Kart>

      <Kart ikon={Tag} baslik="Vergi" alt="Teslimat adresine göre hesaplanır; siparişte vergi dökümü tutulur" sag={ev ? <button type="button" onClick={ulkeVarsayilani} className={ikincil}><Globe className="h-4 w-4" /><span className="max-sm:hidden">{ulkeBul(ev)?.ad} düzenine göre ayarla</span></button> : undefined} altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <div className="px-4 py-3 sm:px-5">
            <span className="block text-[13.5px] font-medium text-white">Vergi düzeni</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {VERGI_MODELLERI.map((m) => (
                <button key={m.id} type="button" onClick={() => dv({ model: m.id as VergiModeli, dahil: m.dahil, kargoVergili: m.id !== "sales" })} className={cn("rounded-[14px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", t.vergi.model === m.id ? "bg-[#55d6fd]/[0.1] ring-[#55d6fd]/45" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                  <span className="block text-[13px] font-medium text-white">{m.ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-white/50">{m.alt}</span>
                </button>
              ))}
            </div>
          </div>
          {t.vergi.model !== "yok" && <>
            <SatirAyar baslik="Fiyatlar" alt={t.vergi.dahil ? "Ürün fiyatı vergi dahil girilir, vergi toplamın içinden ayrılır (AB, İngiltere, Avustralya, Türkiye)" : "Vergi ödeme adımında teslimat adresine göre eklenir (ABD, Kanada)"}>
              <Secici id="vergi-dahil" kucuk deger={t.vergi.dahil ? "dahil" : "haric"} set={(x) => dv({ dahil: x === "dahil" })} l={[{ id: "dahil", ad: "Vergi dahil" }, { id: "haric", ad: "Vergi hariç" }]} />
            </SatirAyar>
            <SatirAyar baslik="Standart oran" alt={`${ulkeBul(ev)?.ad ?? "Mağaza ülkesi"} için; ürüne ayrıca oran yazılmadıysa`}><SayiGirdi deger={t.vergi.varsayilanOran} set={(x) => tk.setT((y) => ({ ...y, vergi: { ...y.vergi, varsayilanOran: x ?? 0 }, varsayilanKdv: x ?? 0 }))} adim={0.001} max={50} birim="yüzde" className="w-[130px]" /></SatirAyar>
            <SatirAyar baslik="Kargo ücretine vergi" alt="AB, İngiltere ve Türkiye'de kargo vergilendirilir; ABD'de eyalete göre değişir"><Anahtar acik={t.vergi.kargoVergili} set={(x) => dv({ kargoVergili: x })} etiket="Kargo vergisi" /></SatirAyar>
            <SatirAyar baslik="Yurt dışı satış vergisiz" alt="Kuralı olmayan ülkeye satışta vergi eklenmez (ihracat); gümrük vergisi alıcıya ait"><Anahtar acik={t.vergi.ihracatVergisiz} set={(x) => dv({ ihracatVergisiz: x })} etiket="İhracat vergisiz" /></SatirAyar>
            {t.vergi.model === "vat" && <SatirAyar baslik="Kurumsal alıcıdan VAT numarası iste" alt="AB içinde başka ülkedeki şirkete satışta ters ibraz: KDV alınmaz, faturaya not düşülür"><Anahtar acik={t.vergi.vergiKimligiIste} set={(x) => dv({ vergiKimligiIste: x })} etiket="VAT numarası" /></SatirAyar>}
            <div className="space-y-2 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-[200px] flex-1"><span className="block text-[13.5px] font-medium text-white">Bölgeye göre oranlar</span><span className="mt-0.5 block text-[12px] text-white/50">Teslimat ülkesi ve eyaletine göre; en özel kural kazanır. ABD oranları eyalet temel oranıdır, ilçe ve şehir eklerini ayrıca yazabilirsin.</span></span>
                <button type="button" onClick={abdHazir} className={ikincil}>ABD eyaletleri</button>
                <button type="button" onClick={kanadaHazir} className={ikincil}>Kanada eyaletleri</button>
                <button type="button" onClick={abHazir} className={ikincil}>AB ülkeleri (OSS)</button>
              </div>
              {kuralGrup.map(([u, l]) => (
                <details key={u} className="rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13px] text-white"><span className="flex-1 font-medium">{ulkeBul(u)?.ad ?? u}</span><span className="text-white/50">{l.length} kural</span><button type="button" onClick={(e) => { e.preventDefault(); dv({ kurallar: t.vergi.kurallar.filter((k) => k.ulke !== u) }); }} className={simgeDugme} aria-label="Ülkenin kurallarını sil"><Trash2 className="h-4 w-4" /></button></summary>
                  <div className="grid gap-1.5 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3">
                    {l.map((k) => (
                      <div key={k.id} className="flex items-center gap-2 rounded-[10px] bg-white/[0.03] px-2.5 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/75">{k.bolge ? (ALT_BOLGELER[u]?.find((b) => b.kod === k.bolge)?.ad ?? k.bolge) : "Ülkenin tamamı"}{k.ad ? <span className="text-white/40"> · {k.ad}</span> : null}</span>
                        <SayiGirdi deger={k.oran} set={(x) => dv({ kurallar: t.vergi.kurallar.map((y) => (y.id === k.id ? { ...y, oran: x ?? 0 } : y)) })} adim={0.001} max={50} className="w-[88px]" />
                        <button type="button" onClick={() => dv({ kurallar: t.vergi.kurallar.filter((y) => y.id !== k.id) })} className={simgeDugme} aria-label="Kuralı sil"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
              <div className="flex flex-wrap items-end gap-2">
                <Alan etiket="Ülke" className="w-[200px]"><select value={yeniKural.ulke} onChange={(e) => setYeniKural({ ulke: e.target.value, bolge: "", oran: ulkeBul(e.target.value)?.vergi.oran ?? null })} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Seç</option>{ULKELER.slice().sort((a, b) => a.ad.localeCompare(b.ad, "tr")).map((u) => <option key={u.kod} value={u.kod}>{u.ad}</option>)}</select></Alan>
                {yeniKural.ulke && ALT_BOLGELER[yeniKural.ulke] && <Alan etiket="Eyalet" className="w-[200px]"><select value={yeniKural.bolge} onChange={(e) => setYeniKural({ ...yeniKural, bolge: e.target.value, oran: ALT_BOLGELER[yeniKural.ulke]?.find((b) => b.kod === e.target.value)?.oran ?? yeniKural.oran })} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Ülkenin tamamı</option>{ALT_BOLGELER[yeniKural.ulke]!.map((b) => <option key={b.kod} value={b.kod}>{b.ad}</option>)}</select></Alan>}
                <Alan etiket="Oran" className="w-[120px]"><SayiGirdi deger={yeniKural.oran} set={(x) => setYeniKural({ ...yeniKural, oran: x })} bos adim={0.001} max={50} birim="yüzde" /></Alan>
                <button type="button" disabled={!yeniKural.ulke || yeniKural.oran === null} onClick={() => { dv({ kurallar: [...t.vergi.kurallar.filter((k) => !(k.ulke === yeniKural.ulke && k.bolge === yeniKural.bolge)), { id: Math.random().toString(36).slice(2, 10), ulke: yeniKural.ulke, bolge: yeniKural.bolge, oran: yeniKural.oran ?? 0, ad: vergiAdi(ulkeBul(yeniKural.ulke)?.vergi.model ?? t.vergi.model) }] }); setYeniKural({ ulke: "", bolge: "", oran: null }); }} className={ikincil}><Plus className="h-4 w-4" />Kural ekle</button>
              </div>
              {t.vergi.model === "sales" && <BilgiSatiri ton="uyari">ABD'de satış vergisi toplama yükümlülüğü eyaletteki satış hacmine (economic nexus) bağlıdır. Yalnız kayıtlı olduğun eyaletlere kural ekle; diğer eyaletler vergisiz kalır.</BilgiSatiri>}
            </div>
          </>}
        </div>
      </Kart>

      <Kart ikon={Truck} baslik="Kargo bölgeleri ve yöntemleri" alt="Her yöntem seçtiğin ülkelere gönderir; ödeme adımında teslimat ülkesine uygun yöntemler çıkar" sag={<button type="button" onClick={() => tk.d("kargo", [...t.kargo, yeniYontem(ev)])} className={ikincil}><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yöntem ekle</span></button>} altSerit={seri}>
        <div className="space-y-3 p-3 sm:p-4">
          {!t.kargo.length && <BilgiSatiri ton="uyari">Kargo yöntemi yok: ödemede kargo ücreti alınmaz ve adres sorulmaz. Dijital ürün ya da elden teslim satıyorsan böyle bırakabilirsin.</BilgiSatiri>}
          {t.kargo.map((y, i) => (
            <div key={y.id} className="rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
              <div className="flex flex-wrap items-center gap-2"><Girdi value={y.ad} onChange={(e) => dy(i, { ad: e.target.value })} maxLength={60} className="h-9 min-w-[150px] max-w-[260px] flex-1 font-medium" /><Rozet className="max-sm:order-last">{ulkeOzeti(y.ulkeler, ev)}</Rozet><span className="flex-1" /><Anahtar acik={y.aktif} set={(x) => dy(i, { aktif: x })} etiket={`${y.ad} etkin`} /><button type="button" onClick={() => tk.d("kargo", t.kargo.filter((_, j) => j !== i))} className={simgeDugme} aria-label="Yöntemi sil"><Trash2 className="h-4 w-4" /></button></div>
              <div className="mt-3"><span className="mb-1.5 block text-[12.5px] font-medium text-white/75">Gönderilen ülkeler</span><UlkeSecici deger={y.ulkeler} set={(l) => dy(i, { ulkeler: l, bolgeler: l.length === 1 ? y.bolgeler : [] })} ev={ev} /></div>
              {y.ulkeler.length === 1 && ALT_BOLGELER[y.ulkeler[0]] && (
                <Alan etiket="Eyaletler" alt="boşsa ülkenin tamamı" className="mt-3">
                  <div className="flex flex-wrap gap-1">{ALT_BOLGELER[y.ulkeler[0]]!.map((b) => { const s2 = y.bolgeler.includes(b.kod); return <button key={b.kod} type="button" onClick={() => dy(i, { bolgeler: s2 ? y.bolgeler.filter((x) => x !== b.kod) : [...y.bolgeler, b.kod] })} className={cn("h-7 rounded-full px-2.5 text-[12px]", s2 ? "bg-[#55d6fd]/[0.16] text-[#c9f3ff] ring-1 ring-inset ring-[#55d6fd]/40" : "bg-white/[0.05] text-white/65 hover:bg-white/[0.09]")}>{b.kod}</button>; })}</div>
                </Alan>
              )}
              <div className="mt-3"><SecenekCipleri<string> deger={y.firma} set={(x) => dy(i, { firma: x, takipAdresi: y.takipAdresi || KARGO_FIRMALARI_AYRINTI.find((f) => f.ad === x)?.takip || "" })} l={ulkeFirmalari(y.ulkeler.length === 1 ? y.ulkeler[0] : ev).slice(0, 8).map((x) => ({ id: x, ad: x }))} ozel ozelTur="metin" /></div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Alan etiket="Ücret türü" className="max-sm:col-span-2"><Secici id={`ucret-${y.id}`} kucuk deger={y.ucretTuru} set={(x) => dy(i, { ucretTuru: x })} l={[{ id: "sabit", ad: "Sabit" }, { id: "agirlik", ad: "Ağırlığa göre" }]} /></Alan>
                <Alan etiket={y.ucretTuru === "agirlik" ? "Taban ücret" : "Ücret"}><SayiGirdi deger={y.ucret} set={(x) => dy(i, { ucret: x ?? 0 })} birim={simge} /></Alan>
                {y.ucretTuru === "agirlik" && <Alan etiket="Her kg için"><SayiGirdi deger={y.kgBasi} set={(x) => dy(i, { kgBasi: x ?? 0 })} birim={simge} /></Alan>}
                <Alan etiket="Bu tutardan sonra ücretsiz"><SayiGirdi deger={y.ucretsizEsik} set={(x) => dy(i, { ucretsizEsik: x })} bos ph="Yok" birim={simge} /></Alan>
                <Alan etiket="Teslim süresi" className="max-sm:col-span-2"><Girdi value={y.sure} onChange={(e) => dy(i, { sure: e.target.value })} maxLength={40} placeholder="2-4 iş günü" /></Alan>
              </div>
              {y.ucretTuru === "agirlik" && <p className="mt-2 text-[11.5px] text-white/45">Ağırlık ürünlerin "agirlik" (gram) sütunundan; her başlayan kilogram için ek ücret eklenir.</p>}
              <Alan etiket="Takip adresi" alt="{no} takip numarasıyla değişir" className="mt-3"><Girdi value={y.takipAdresi} onChange={(e) => dy(i, { takipAdresi: e.target.value })} placeholder="https://www.ups.com/track?tracknum={no}" /></Alan>
            </div>
          ))}
          <div className="rounded-[18px] bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="block text-[13.5px] font-medium text-white">Satış yapılan ülkeler</span>
            <span className="mb-2 mt-0.5 block text-[12px] text-white/50">Listede olmayan ülkeye ödeme açılmaz. Boşsa kargo yöntemlerinin ülkeleri geçerlidir.</span>
            <UlkeSecici deger={t.satisUlkeleri} set={(l) => tk.d("satisUlkeleri", l)} ev={ev} bosAd="Kargo yöntemlerine göre" />
          </div>
        </div>
      </Kart>

      <Kart ikon={CreditCard} baslik="Fatura ve bildirimler" alt="Ödeme adımı ve sipariş e-postaları" altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Kurumsal fatura bilgisi iste" alt={ev === "TR" ? "Ödemede unvan, vergi dairesi ve vergi no alanları" : "Ödemede şirket adı ve vergi kimliği (VAT, EIN, GST) alanları"}><Anahtar acik={t.faturaIste} set={(x) => tk.d("faturaIste", x)} etiket="Fatura bilgisi" /></SatirAyar>
          <SatirAyar baslik="Az kaldı eşiği" alt="Bu adet ve altında sitede az kaldı yazar, raporda uyarı çıkar"><SayiGirdi deger={t.dusukStok} set={(x) => tk.d("dusukStok", x ?? 0)} className="w-[100px]" birim="adet" /></SatirAyar>
          <SatirAyar baslik="Müşteriye sipariş e-postaları" alt={o.k.d?.servis.eposta ? "Ödeme alındı, kargoya verildi, teslim edildi, iptal" : "E-posta servisi kurulu değil (RESEND_API_KEY); açık olsa da gönderilmez"}><Anahtar acik={t.musteriEposta} set={(x) => tk.d("musteriEposta", x)} etiket="Müşteri e-postaları" /></SatirAyar>
          <SatirAyar baslik="Teslimden sonra yorum iste" alt={o.k.d?.veri.eklentiler.yorum.acik ? "Müşteriye bir kez yorum davet e-postası gider" : "Önce Eklentiler bölümünden yorum toplamayı aç"}><SecenekCipleri<number> deger={t.yorumIstegiGun} set={(x) => tk.d("yorumIstegiGun", x)} l={[{ id: 0, ad: "Kapalı" }, { id: 3, ad: "3 gün" }, { id: 7, ad: "7 gün" }, { id: 14, ad: "14 gün" }]} /></SatirAyar>
          <SatirAyar baslik="Yeni sipariş bildirimi" alt="Boşsa işletme profilindeki e-posta"><Girdi type="email" value={t.bildirimEposta} onChange={(e) => tk.d("bildirimEposta", e.target.value)} placeholder={o.k.d?.veri.profil.eposta || "siparis@alanadin.com"} className="w-[240px] max-sm:w-full" /></SatirAyar>
        </div>
      </Kart>
      <Kart ikon={ShoppingCart} baslik="Terk edilen sepet hatırlatması" alt="Ödeme sayfasını açıp tamamlamayanlara bir kez e-posta" altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Kendiliğinden hatırlat" alt={o.k.d?.servis.eposta ? "Zamanlayıcı 5 dakikada bir bakar; aynı kişiye bir kez gider" : "E-posta servisi kurulu olmadan gönderilemez"}><Anahtar acik={t.terk.acik} set={(x) => tk.d("terk", { ...t.terk, acik: x })} etiket="Terk hatırlatması" /></SatirAyar>
          <SatirAyar baslik="Ne kadar sonra"><SecenekCipleri<number> deger={t.terk.saat} set={(x) => tk.d("terk", { ...t.terk, saat: x })} l={[1, 3, 6, 24].map((x) => ({ id: x, ad: `${x} saat` }))} /></SatirAyar>
          <SatirAyar baslik="E-postaya kupon ekle" alt="Kuponlar bölümündeki etkin bir kod">
            <select value={t.terk.kuponKod} onChange={(e) => tk.d("terk", { ...t.terk, kuponKod: e.target.value })} className="h-9 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Kupon yok</option>{kuponlar.filter((k) => k.aktif).map((k) => <option key={k.id} value={k.kod}>{k.kod}</option>)}</select>
          </SatirAyar>
        </div>
      </Kart>
    </div>
  );
}
export function SatirAyar({ baslik, alt, children }: { baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"><span className="min-w-[200px] flex-1"><span className="block text-[13.5px] font-medium text-white">{baslik}</span>{alt && <span className="mt-0.5 block text-[12px] leading-relaxed text-white/50">{alt}</span>}</span>{children}</div>;
}

/* ═════════════ Terk edilen sepetler ═════════════ */
type Sepet = { siparisNo: string; eposta: string; ad: string; tutar: number; paraBirimi?: string; kalemler: { ad: string; adet: number; tutar: number }[]; olusturma: number; durum: string; hata: string | null; hatirlatma: number | null };
export function Sepetler({ o, git }: { o: Ortak; git: (b: string) => void }) {
  const [l, setL] = useState<Sepet[] | null>(null);
  const [eposta, setEposta] = useState(true);
  const [is, setIs] = useState("");
  const getir = useCallback(async () => { const r = await isletmeApi<{ sepetler: Sepet[]; eposta: boolean }>(o.projeId, "sepetler"); setL(r.sepetler); setEposta(r.eposta); }, [o.projeId]);
  useEffect(() => { getir().catch(() => setL([])); }, [getir]);
  const hatirlat = async (no: string) => { setIs(no); try { await isletmeApi(o.projeId, `sepet/${no}/hatirlat`, { govde: {} }); o.goster("Hatırlatma gönderildi"); await getir(); } catch (e) { o.goster((e as Error).message, "kotu"); } finally { setIs(""); } };
  const toplam = (l ?? []).reduce((t, s) => t + s.tutar, 0);
  return (
    <Kart ikon={ShoppingCart} baslik="Terk edilen sepetler" alt="Ödeme sayfası açılıp 30 dakikada tamamlanmayan canlı siparişler; aynı kişi sonra ödediyse listelenmez" sag={<button type="button" onClick={() => git("kargo")} className={ikincil}><span className="max-sm:hidden">Otomatik hatırlatma</span><span className="sm:hidden">Ayarlar</span></button>}>
      <div className="space-y-3 p-3 sm:p-4">
        {!eposta && <BilgiSatiri ton="uyari">E-posta servisi kurulu değil (RESEND_API_KEY). Hatırlatma gönderilemez; müşteriye kendi e-postandan yazabilirsin.</BilgiSatiri>}
        {l && l.length > 0 && <Istatistikler l={[{ ad: "Terk edilen sepet", deger: l.length }, { ad: "Kaçan tutar", deger: tlYaz(toplam) }, { ad: "Hatırlatılan", deger: l.filter((x) => x.hatirlatma).length }, { ad: "Ortalama sepet", deger: tlYaz(l.length ? toplam / l.length : 0) }]} />}
        {!l ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
          : !l.length ? <BosDurum ikon={ShoppingCart} baslik="Terk edilen sepet yok" alt="Ödeme sayfasını açıp vazgeçen müşteriler burada görünür; tek tıkla ya da otomatik hatırlatma e-postası gönderebilirsin." ikincilEylem={{ ad: "Otomatik hatırlatmayı ayarla", tikla: () => git("kargo") }} />
          : (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
              {l.map((s) => (
                <div key={s.siparisNo} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                  <span className="min-w-[200px] flex-1"><span className="block text-[13.5px] font-medium text-white">{s.ad || s.eposta}</span><span className="block truncate text-[12px] text-white/50">{s.eposta} · {gorece(s.olusturma)} · {s.kalemler.map((k) => `${k.adet} x ${k.ad}`).join(", ")}</span>{s.hata && <span className="block text-[11.5px] text-rose-200/80">{s.hata}</span>}</span>
                  <span className="text-[13.5px] font-semibold tabular-nums text-white">{tlYaz(s.tutar, s.paraBirimi)}</span>
                  {s.hatirlatma ? <Rozet ton="imza">Hatırlatıldı {gorece(s.hatirlatma)}</Rozet> : <button type="button" disabled={!eposta || is === s.siparisNo} onClick={() => hatirlat(s.siparisNo)} className={imza}>{is === s.siparisNo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-4 w-4" />}Hatırlat</button>}
                </div>
              ))}
            </div>
          )}
      </div>
    </Kart>
  );
}

/* ═════════════ Rapor ═════════════ */
type Rapor = {
  ozet: { ciro: number; adet: number; ortalama: number; iade: number; baslayan: number; indirim: number }; onceki: Rapor["ozet"]; gunler: { tarih: string; ciro: number; adet: number }[];
  enCok: { id: string; ad: string; adet: number; ciro: number }[]; kuponlar: { kod: string; adet: number; indirim: number; ciro: number }[]; musteriSayisi: number; tekrarlayan: number; donusum: number | null;
  asamalar: Record<SiparisAsama, number>; dusukStok: { id: string; ad: string; varyant: string; stok: number }[]; urunSayisi: number;
};
export function RaporBolumu({ o }: { o: Ortak }) {
  const [gun, setGun] = useState("30");
  const [r, setR] = useState<Rapor | null>(null);
  useEffect(() => { setR(null); isletmeApi<{ rapor: Rapor }>(o.projeId, `rapor?gun=${gun}&ortam=${o.ortam}`).then((x) => setR(x.rapor)).catch(() => {}); }, [o.projeId, gun, o.ortam]);
  const fark = (a: number, b: number) => (b ? `önceki döneme göre yüzde ${Math.round(((a - b) / b) * 100)} ${a >= b ? "artış" : "düşüş"}` : a ? "önceki dönemde satış yok" : "");
  return (
    <div className="space-y-4">
      <Kart ikon={BarChart3} baslik="Mağaza raporu" alt={o.ortam === "test" ? "Test siparişleri" : "Canlı siparişler"} sag={<><OrtamSecici o={o} her /><Secici id="rapor-gun" kucuk deger={gun} set={setGun} l={[{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }]} /></>}>
        {!r ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
          <div className="space-y-4 p-3 sm:p-4">
            <Istatistikler l={[
              { ad: "Ciro", deger: tlYaz(r.ozet.ciro), alt: fark(r.ozet.ciro, r.onceki.ciro) },
              { ad: "Sipariş", deger: r.ozet.adet, alt: r.ozet.iade ? `${tlYaz(r.ozet.iade)} iade` : undefined },
              { ad: "Ortalama sepet", deger: tlYaz(Math.round(r.ozet.ortalama * 100) / 100), alt: r.ozet.indirim ? `${tlYaz(r.ozet.indirim)} indirim verildi` : undefined },
              { ad: "Ödeme tamamlama", deger: r.donusum === null ? "Veri yok" : `Yüzde ${r.donusum}`, alt: `${r.ozet.baslayan} ödeme başlatıldı` },
            ]} />
            <div className="rounded-[18px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.07]">
              <p className="mb-3 text-[13px] font-medium text-white">Günlük ciro</p>
              <YiginCubuk veri={r.gunler.map((g) => ({ z: Date.parse(`${g.tarih}T12:00:00Z`), ciro: g.ciro }))} seriler={[{ anahtar: "ciro", ad: "Ciro", renk: "#55d6fd" }]} etiket={(z) => new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ipucuBaslik={(z) => new Date(z).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} birim=" TL" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                <p className="px-4 pt-3.5 text-[13px] font-medium text-white">En çok satanlar</p>
                {r.enCok.length ? <div className="mt-2 divide-y divide-white/[0.06]">{r.enCok.map((u, n) => <div key={u.id} className="flex items-center gap-3 px-4 py-2 text-[12.5px]"><span className="w-4 text-white/40 tabular-nums">{n + 1}</span><span className="min-w-0 flex-1 truncate text-white">{u.ad}</span><span className="tabular-nums text-white/55">{u.adet} adet</span><span className="w-[90px] text-right tabular-nums text-white">{tlYaz(u.ciro)}</span></div>)}</div> : <p className="px-4 py-4 text-[12.5px] text-white/45">Bu dönemde satış yok.</p>}
              </div>
              <div className="rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                <p className="px-4 pt-3.5 text-[13px] font-medium text-white">Stoğu azalanlar</p>
                {r.dusukStok.length ? <div className="mt-2 divide-y divide-white/[0.06]">{r.dusukStok.map((u, n) => <div key={n} className="flex items-center gap-3 px-4 py-2 text-[12.5px]"><span className="min-w-0 flex-1 truncate text-white">{u.ad}{u.varyant && <span className="text-white/50"> · {u.varyant}</span>}</span>{u.stok === 0 ? <Rozet ton="kotu">Tükendi</Rozet> : <Rozet ton="uyari">{u.stok} adet</Rozet>}</div>)}</div> : <p className="px-4 py-4 text-[12.5px] text-white/45">Stok sıkıntısı olan ürün yok.</p>}
              </div>
              <div className="rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                <p className="px-4 pt-3.5 text-[13px] font-medium text-white">Kupon performansı</p>
                {r.kuponlar.length ? <div className="mt-2 divide-y divide-white/[0.06]">{r.kuponlar.map((k) => <div key={k.kod} className="flex items-center gap-3 px-4 py-2 text-[12.5px]"><span className="min-w-0 flex-1 font-semibold tracking-[0.03em] text-white">{k.kod}</span><span className="tabular-nums text-white/55">{k.adet} sipariş</span><span className="tabular-nums text-emerald-200/80">{tlYaz(k.indirim)} indirim</span><span className="w-[90px] text-right tabular-nums text-white">{tlYaz(k.ciro)}</span></div>)}</div> : <p className="px-4 py-4 text-[12.5px] text-white/45">Bu dönemde kupon kullanılmadı.</p>}
              </div>
              <div className="rounded-[18px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.07]">
                <p className="text-[13px] font-medium text-white">Müşteriler ve hazırlık</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
                  <div><dt className="text-white/50">Müşteri</dt><dd className="text-[17px] font-semibold text-white tabular-nums">{r.musteriSayisi}</dd></div>
                  <div><dt className="text-white/50">Tekrar alan</dt><dd className="text-[17px] font-semibold text-white tabular-nums">{r.tekrarlayan}</dd></div>
                  {SIPARIS_ASAMALARI.map((a) => <div key={a.id}><dt className="text-white/50">{a.ad}</dt><dd className="text-[15px] font-medium text-white tabular-nums">{r.asamalar[a.id] ?? 0}</dd></div>)}
                </dl>
              </div>
            </div>
          </div>
        )}
      </Kart>
    </div>
  );
}
export type { Ortak as MagazaOrtak };
