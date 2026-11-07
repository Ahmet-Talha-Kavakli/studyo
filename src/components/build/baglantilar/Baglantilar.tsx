"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, BadgeCheck, ChevronRight, LayoutGrid, Link2, Loader2, Plug, RefreshCw, Search, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { BAGLANTI_KATALOGU, BAGLANTI_KATEGORI, katalogBul, yetkiRozetleri, type BaglantiKategori, type KatalogBaglanti } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { KayitSunucu } from "@/lib/build/mcpKayit";
import { cn } from "@/lib/utils";
import { AyrintiPaneli } from "./AyrintiPaneli";
import { KatalogPaneli } from "./KatalogPaneli";
import { GecitKarti } from "./Gecit";
import { RestEkle } from "./RestEkle";
import { PaketlerKarti } from "./Paketler";
import { DURUM, HataKutusu, katalogLogo, Logo, oauthBaslat, pencereAc, Rozet, type BaglantiAcik } from "./ortak";

export type { BaglantiAcik } from "./ortak";
export { Logo } from "./ortak";

type Siralama = "onerilen" | "populer" | "yeni" | "az";
type RozetSuz = "resmi" | "turkiye" | "etkilesimli" | "oauth" | "anahtar" | "rest";
const ROZETLER: { id: RozetSuz; ad: string; uy: (k: KatalogBaglanti) => boolean }[] = [
  { id: "resmi", ad: "Resmî", uy: (k) => !!k.resmi },
  { id: "turkiye", ad: "Türkiye", uy: (k) => !!k.turkiye },
  { id: "etkilesimli", ad: "Etkileşimli", uy: (k) => !!k.etkilesimli },
  { id: "oauth", ad: "Hesapla giriş", uy: (k) => k.yetki.includes("oauth") },
  { id: "anahtar", ad: "Anahtarla", uy: (k) => k.yetki.includes("anahtar") },
  { id: "rest", ad: "REST API", uy: (k) => k.yol === "rest" },
];
const ONERILEN = (k: KatalogBaglanti) => (k.one ? 3e5 : 0) + (k.turkiye ? 2e5 : 0) + (k.populerlik ?? 0);
const tr = (s: string) => s.toLocaleLowerCase("tr");

/** Resmî MCP kayıt defterinde arama: yazınca uzak sunucular listelenir, seçilen sunucu formu doldurur. */
function KayitArama({ sec }: { sec: (s: KayitSunucu) => void }) {
  const [q, setQ] = useState("");
  const [v, setV] = useState<{ sunucular: KayitSunucu[]; yerel: number } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const istek = useRef(0);
  useEffect(() => {
    const k = q.trim();
    if (k.length < 2) { setV(null); setHata(""); return; }
    const n = ++istek.current;
    const t = setTimeout(async () => {
      setYukleniyor(true); setHata("");
      try { const r = await api<{ sunucular: KayitSunucu[]; yerel: number }>(`/api/build/baglantilar/kayit?q=${encodeURIComponent(k)}`); if (n === istek.current) setV(r); }
      catch (e) { if (n === istek.current) { setHata(e instanceof ApiHatasi ? e.message : "Kayıt defterine ulaşılamadı."); setV(null); } }
      finally { if (n === istek.current) setYukleniyor(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="rounded-[18px] bg-white/[0.025] p-2 ring-1 ring-inset ring-white/[0.07]">
      <label className="flex h-10 items-center gap-2 rounded-[13px] bg-white/[0.04] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25">
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="MCP kayıt defterinde ara: linear, hubspot, stripe" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" />
        {yukleniyor ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/40" /> : q && <button type="button" aria-label="Aramayı temizle" onClick={() => setQ("")} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>}
      </label>
      {hata && <p className="px-2 pt-2 text-[12.5px] text-rose-300">{hata}</p>}
      {v && (
        <div className="mt-1.5 max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
          {v.sunucular.map((x) => (
            <button key={x.kimlik} type="button" onClick={() => { sec(x); setQ(""); }} className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.05]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {x.ikon ? <img src={x.ikon} alt="" className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Plug className="h-4 w-4 text-black/60" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-[13.5px] font-medium text-white">{x.ad}</span>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10.5px] font-medium", x.yayinci.tur === "alan" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.07] text-white/55")} title={x.yayinci.tur === "alan" ? "Yayıncı bu alan adının sahibi olarak doğrulandı" : "GitHub hesabıyla yayınlandı"}>{x.yayinci.tur === "alan" ? <BadgeCheck className="h-3 w-3" /> : <img src="/marka/baglanti/github.svg" alt="" className="h-3 w-3 opacity-60" />}{x.yayinci.ad}</span>
                </span>
                <span className="block truncate text-[12px] text-white/45">{x.aciklama || x.uclar[0].url}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </button>
          ))}
          {!v.sunucular.length && <p className="px-2 py-3 text-[12.5px] text-white/45">Uzak sunucu bulunamadı.</p>}
          {v.yerel > 0 && <p className="px-2 pb-1 pt-2 text-[11.5px] leading-relaxed text-white/35">{v.yerel} sonuç yalnız bilgisayara kurulan paket olarak yayınlanmış; Vayra uzak sunuculara bağlanır.</p>}
        </div>
      )}
    </div>
  );
}

/** Özel MCP sunucusu: adres, ad, giriş yöntemi (girişsiz, başlıkta anahtar, hesapla giriş; kendi OAuth istemcin). */
function OzelBaglanti({ eklendi }: { eklendi: (b: BaglantiAcik) => void }) {
  const [tur, setTur] = useState<"mcp" | "rest">("mcp");
  const [url, setUrl] = useState("");
  const [ad, setAd] = useState("");
  const [yontem, setYontem] = useState<"yok" | "anahtar" | "oauth">("yok");
  const [anahtar, setAnahtar] = useState("");
  const [baslik, setBaslik] = useState("Authorization");
  const [istId, setIstId] = useState("");
  const [istGizli, setIstGizli] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [kaynak, setKaynak] = useState<{ s: KayitSunucu; uc: number; degerler: Record<string, string>; yoklama: string } | null>(null);
  const uc = kaynak?.s.uclar[kaynak.uc];
  const kaynakSec = async (x: KayitSunucu, i = Math.max(0, x.uclar.findIndex((u) => u.tasima === "streamable-http"))) => {
    const u = x.uclar[i];
    const degerler = Object.fromEntries(u.degiskenler.map((d) => [d.ad, d.varsayilan ?? ""]));
    setKaynak({ s: x, uc: i, degerler, yoklama: "" }); setAd(x.ad); setHata("");
    setUrl(u.url.replace(/\{([^}]+)\}/g, (m, k) => degerler[k] || m));
    const gizli = u.basliklar.find((b) => b.gizli || /authorization|key|token/i.test(b.ad));
    if (gizli) { setYontem("anahtar"); setBaslik(gizli.ad); return; }
    setYontem("yok");
    if (u.degiskenler.length) return;
    const r = await api<{ giris: string }>(`/api/build/baglantilar/kayit?yokla=${encodeURIComponent(u.url)}`).catch(() => null);
    if (r?.giris === "oauth") setYontem("oauth");
    setKaynak((k) => (k && k.s.kimlik === x.kimlik ? { ...k, yoklama: r?.giris ?? "bilinmiyor" } : k));
  };
  const degiskenYaz = (k: string, d: string) => setKaynak((x) => {
    if (!x) return x;
    const degerler = { ...x.degerler, [k]: d };
    setUrl(x.s.uclar[x.uc].url.replace(/\{([^}]+)\}/g, (m, a) => degerler[a] || m));
    return { ...x, degerler };
  });
  const ekle = async () => {
    setGidiyor(true); setHata("");
    const w = yontem === "oauth" ? pencereAc() : null;
    try {
      const v = await api<{ baglanti: BaglantiAcik }>("/api/build/baglantilar", { govde: { url: url.trim(), ad: ad.trim() || undefined, yetki: yontem, anahtar: yontem === "anahtar" ? anahtar : undefined, baslik, onEk: baslik.toLowerCase() === "authorization" ? "Bearer " : "", istemci: yontem === "oauth" && istId.trim() ? { id: istId.trim(), gizli: istGizli.trim() || undefined } : undefined } });
      let son = v.baglanti;
      if (yontem === "oauth") { const o = await oauthBaslat(v.baglanti.id, w); if (o.hata) setHata(o.hata); son = (await api<{ baglanti: BaglantiAcik }>(`/api/build/baglantilar/${v.baglanti.id}`)).baglanti; }
      eklendi(son);
      if (son.durum === "etkin") { setUrl(""); setAd(""); setAnahtar(""); setIstId(""); setIstGizli(""); setKaynak(null); } else if (yontem !== "oauth") setHata(son.hata ?? "Bağlanamadı.");
    } catch (e) { w?.close(); setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); }
    finally { setGidiyor(false); }
  };
  return (
    <Kart ikon={Link2} baslik="Özel bağlantı" alt={tur === "mcp" ? "Resmî MCP kayıt defterinden seç ya da uzak sunucu adresini yaz" : "OpenAPI belgesinden araç üret ya da uç noktaları elle ekle"} govde="space-y-3 p-4 sm:p-5">
      <Secici id="ozel-tur" deger={tur} set={setTur} l={[{ id: "mcp", ad: "MCP sunucusu" }, { id: "rest", ad: "REST API (OpenAPI)" }]} />
      {tur === "rest" ? <RestEkle eklendi={eklendi} /> : <>
      <KayitArama sec={kaynakSec} />
      {kaynak && (
        <div className="space-y-2.5 rounded-[16px] bg-[#55d6fd]/[0.04] p-3 ring-1 ring-inset ring-[#55d6fd]/15">
          <div className="flex items-start gap-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-white">{kaynak.s.ad} <span className="font-normal text-white/45">· sürüm {kaynak.s.surum}</span></span>
              <span className="block text-[12px] leading-relaxed text-white/55">{kaynak.s.yayinci.tur === "alan" ? `Yayıncı ${kaynak.s.yayinci.ad} alan adının sahibi olarak doğrulandı.` : `GitHub hesabı ${kaynak.s.yayinci.ad} tarafından yayınlandı; resmî olup olmadığını kontrol et.`}{kaynak.yoklama === "oauth" ? " Sunucu hesapla giriş istiyor." : kaynak.yoklama === "yok" ? " Sunucu girişsiz yanıt veriyor." : ""}</span>
            </span>
            {(kaynak.s.site || kaynak.s.depo) && <a href={kaynak.s.site ?? kaynak.s.depo} target="_blank" rel="noreferrer" className="shrink-0 text-[12px] text-[#8be6ff] hover:underline">Belgeler</a>}
            <button type="button" aria-label="Seçimi kaldır" onClick={() => setKaynak(null)} className="shrink-0 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          {kaynak.s.uclar.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {kaynak.s.uclar.map((u, i) => <button key={u.url} type="button" onClick={() => kaynakSec(kaynak.s, i)} className={cn("max-w-full truncate rounded-full px-3 py-1 text-[12px] ring-inset", i === kaynak.uc ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-1 ring-white/[0.08] hover:text-white")}>{/readonly|read-only|read_only/i.test(u.url) ? "Salt okunur" : u.tasima === "sse" ? "SSE" : "Tam erişim"} · {u.url.replace(/^https:\/\//, "")}</button>)}
            </div>
          )}
          {uc && uc.degiskenler.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {uc.degiskenler.map((d) => d.secenekler?.length ? (
                <label key={d.ad} className="block"><span className="mb-1 block text-[12px] text-white/55">{d.aciklama || d.ad}</span>
                  <select value={kaynak.degerler[d.ad] ?? ""} onChange={(e) => degiskenYaz(d.ad, e.target.value)} className={cn(alanSinif, "h-10 text-[13px]")}>{["", ...d.secenekler].map((c) => <option key={c} value={c}>{c || "Seç"}</option>)}</select>
                </label>
              ) : (
                <label key={d.ad} className="block"><span className="mb-1 block text-[12px] text-white/55">{d.aciklama || d.ad}</span><input value={kaynak.degerler[d.ad] ?? ""} onChange={(e) => degiskenYaz(d.ad, e.target.value)} placeholder={d.ad} className={cn(alanSinif, "h-10 text-[13px]")} /></label>
              ))}
            </div>
          )}
          {uc && uc.basliklar.filter((b) => !b.gizli).length > 0 && <p className="text-[12px] leading-relaxed text-white/45">Sunucunun istediği başlıklar: {uc.basliklar.map((b) => b.ad).join(", ")}{uc.basliklar.find((b) => b.aciklama) ? `. ${uc.basliklar.find((b) => b.aciklama)!.aciklama}` : ""}</p>}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.servis.com/mcp" className={cn(alanSinif, "h-11")} />
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad (isteğe bağlı)" className={cn(alanSinif, "h-11")} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] text-white/50">Giriş</span>
        <Secici id="ozel-yontem" deger={yontem} set={setYontem} l={[{ id: "yok", ad: "Girişsiz" }, { id: "anahtar", ad: "Anahtarla" }, { id: "oauth", ad: "Hesapla giriş" }]} />
      </div>
      {yontem === "anahtar" && (
        <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          <input value={baslik} onChange={(e) => setBaslik(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))} placeholder="Başlık adı" className={cn(alanSinif, "h-10 text-[13px]")} />
          <input value={anahtar} onChange={(e) => setAnahtar(e.target.value)} type="password" autoComplete="off" placeholder="Anahtar" className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
        </div>
      )}
      {yontem === "oauth" && (
        <div className="space-y-2">
          <p className="text-[12.5px] leading-relaxed text-white/50">Vayra önce sunucunun yayınlanmış kimlik desteğine, sonra otomatik kayda bakar. Sunucu ikisini de desteklemiyorsa kendi OAuth uygulamanın kimliğini gir.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={istId} onChange={(e) => setIstId(e.target.value)} autoComplete="off" placeholder="İstemci kimliği (isteğe bağlı)" className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
            <input value={istGizli} onChange={(e) => setIstGizli(e.target.value)} type="password" autoComplete="off" placeholder="İstemci sırrı (isteğe bağlı)" className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <p className="flex-1 text-[12px] text-white/40">Bağlanınca araçlar okuma ve yazma diye ayrılır; her araca ayrı izin verirsin.</p>
        <button type="button" onClick={ekle} disabled={!/^https?:\/\/[^\s/]+/.test(url.trim()) || gidiyor || (yontem === "anahtar" && !anahtar.trim())} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}Bağlan</button>
      </div>
      {hata && <HataKutusu>{hata}</HataKutusu>}
      </>}
    </Kart>
  );
}

/** Dizin kartı: logo, ad, yayıncı, açıklama, rozetler, durum ya da Bağla. */
function KatalogKarti({ k, b, ac }: { k: KatalogBaglanti; b?: BaglantiAcik; ac: () => void }) {
  return (
    <div className="group relative flex flex-col rounded-[20px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
      <button type="button" onClick={ac} className="absolute inset-0 rounded-[20px]" aria-label={`${k.ad} ayrıntıları`} />
      <div className="flex items-center gap-3">
        {katalogLogo(k, undefined, 44)}
        <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{k.ad}</span><span className="block truncate text-[12px] text-white/45">{k.yapan !== k.ad ? k.yapan : BAGLANTI_KATEGORI[k.kategori]}</span></span>
        {b ? <span className={cn("relative z-[1] shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", DURUM[b.durum].sinif)}>{b.durum === "etkin" ? "Bağlı" : DURUM[b.durum].ad}</span>
          : <span className="relative z-[1] inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Bağla</span>}
      </div>
      <p className="mt-3 line-clamp-2 min-h-[38px] flex-1 text-[13px] leading-[1.45] text-white/55">{k.aciklama}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {k.resmi && <Rozet vurgu>Resmî</Rozet>}{k.adaptor && <Rozet vurgu>Vayra adaptörü</Rozet>}{k.yol === "rest" && <Rozet>REST API</Rozet>}{k.turkiye && <Rozet>Türkiye</Rozet>}{k.etkilesimli && <Rozet>Etkileşimli</Rozet>}
        {yetkiRozetleri(k).map((y) => <Rozet key={y}>{y}</Rozet>)}
      </div>
    </div>
  );
}

/** Bağlantılar sayfası: bağlantıların (sağlık), dizin (kategori, arama, sıralama, rozet süzgeci), özel bağlantı. ?baglan=<katalog> ile ayrıntı açık gelir. */
export function Baglantilar() {
  const ara = useSearchParams();
  const [l, setL] = useState<BaglantiAcik[] | null>(null);
  const [kat, setKat] = useState<"hepsi" | BaglantiKategori>("hepsi");
  const [arama, setArama] = useState("");
  const [sira, setSira] = useState<Siralama>("onerilen");
  const [suz, setSuz] = useState<Set<RozetSuz>>(new Set());
  const [katalogAcik, setKatalogAcik] = useState<KatalogBaglanti | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [denetim, setDenetim] = useState(false);
  const [adet, setAdet] = useState(24);
  const yenile = useCallback(() => { api<{ baglantilar: BaglantiAcik[] }>("/api/build/baglantilar").then((v) => setL(v.baglantilar)).catch(() => setL([])); }, []);
  useEffect(() => { yenile(); const k = katalogBul(ara.get("baglan") ?? undefined); if (k) setKatalogAcik(k); const a = ara.get("ac"); if (a) setAcik(a); }, [yenile, ara]);
  // Sessiz bakım: 6 saattir denenmeyenler denenir, dolmak üzere olan belirteçler önceden yenilenir.
  useEffect(() => { api<{ baglantilar: BaglantiAcik[]; denenen: number }>("/api/build/baglantilar/saglik", { govde: { eskiler: true } }).then((v) => { if (v.denenen) setL(v.baglantilar); }).catch(() => {}); }, []);
  const koy = (b: BaglantiAcik) => setL((x) => { const y = x ?? []; return y.some((z) => z.id === b.id) ? y.map((z) => (z.id === b.id ? b : z)) : [b, ...y]; });
  const katalog = useMemo(() => {
    const s = tr(arama.trim());
    const f = BAGLANTI_KATALOGU.filter((k) => (kat === "hepsi" || k.kategori === kat) && [...suz].every((r) => ROZETLER.find((x) => x.id === r)!.uy(k))
      && (!s || tr(`${k.ad} ${k.yapan} ${k.aciklama} ${BAGLANTI_KATEGORI[k.kategori]}`).includes(s)));
    const p = (k: KatalogBaglanti) => k.populerlik ?? -1;
    return [...f].sort(sira === "az" ? (a, b) => a.ad.localeCompare(b.ad, "tr") : sira === "populer" ? (a, b) => p(b) - p(a) : sira === "yeni" ? (a, b) => (b.yayin ?? "").localeCompare(a.yayin ?? "") || p(b) - p(a) : (a, b) => ONERILEN(b) - ONERILEN(a));
  }, [kat, arama, sira, suz]);
  useEffect(() => setAdet(24), [kat, arama, sira, suz]);
  const kategoriler = (Object.keys(BAGLANTI_KATEGORI) as BaglantiKategori[]).map((k) => ({ id: k, ad: BAGLANTI_KATEGORI[k], sayi: BAGLANTI_KATALOGU.filter((x) => x.kategori === k).length })).filter((k) => k.sayi);
  const bagli = (id: string) => l?.find((b) => b.katalogId === id);
  const secili = l?.find((b) => b.id === acik);
  const tumunuDenetle = async () => { setDenetim(true); try { const v = await api<{ baglantilar: BaglantiAcik[] }>("/api/build/baglantilar/saglik", { govde: {} }); setL(v.baglantilar); } catch { /* sessiz */ } finally { setDenetim(false); } };
  const sayac = l ? { etkin: l.filter((b) => b.durum === "etkin").length, yeniden: l.filter((b) => b.durum === "giris-gerekli").length, hata: l.filter((b) => b.durum === "hata").length } : null;
  const host = (b: BaglantiAcik) => { try { return b.url.startsWith("vayra://") ? "Vayra adaptörü" : (b.rest ? "REST · " : "") + new URL(b.url).host; } catch { return b.url; } };
  const dikkat = (l ?? []).flatMap((b) => {
    const o: { b: BaglantiAcik; metin: string; tur: "hata" | "uyari" }[] = [];
    if (b.durum === "giris-gerekli") o.push({ b, metin: b.hata ?? "Oturum doldu; yeniden giriş yap.", tur: "uyari" });
    else if (b.durum === "hata") o.push({ b, metin: b.hata ?? "Bağlantı hata veriyor.", tur: "hata" });
    else if (b.yetki.tokenBitis && !b.yetki.yenilenebilir && b.yetki.tokenBitis - Date.now() < 86_400_000) o.push({ b, metin: "Belirteç bir gün içinde doluyor ve kendiliğinden yenilenemiyor; yeniden giriş gerekecek.", tur: "uyari" });
    if (b.incelenecek?.length) o.push({ b, metin: `${b.incelenecek.length} araç incelenmeyi bekliyor (yeni ya da tanımı değişmiş)`, tur: b.incelenecek.some((i) => i.neden === "enjeksiyon") ? "hata" : "uyari" });
    return o;
  });

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      {l === null ? <div className="h-[140px] animate-pulse rounded-[26px] bg-white/[0.03]" /> : l.length > 0 && (
        <Kart ikon={Plug} baslik="Bağlantıların" alt={`${l.length} servis · ${sayac!.etkin} sağlıklı${sayac!.yeniden ? ` · ${sayac!.yeniden} yeniden bağlan` : ""}${sayac!.hata ? ` · ${sayac!.hata} hata` : ""} · ${l.reduce((t, b) => t + b.araclar.length, 0)} araç`}
          sag={<button type="button" onClick={tumunuDenetle} disabled={denetim} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-60">{denetim ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Tümünü denetle</span></button>}>
          <div className="divide-y divide-white/[0.05]">
            {l.map((b) => { const D = DURUM[b.durum]; const k = katalogBul(b.katalogId); return (
              <button key={b.id} type="button" onClick={() => setAcik(b.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] sm:px-5">
                {k ? katalogLogo(k, b, 40) : <Logo src={b.logo} ad={b.ad} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-white">{b.ad}</span>
                  <span className="block truncate text-[12.5px] text-white/45">{host(b)}{b.araclar.length ? ` · ${b.araclar.length} araç` : ""}{b.saltOkunur ? " · salt okunur" : ""}{b.sonKontrol ? ` · ${gorece(b.sonKontrol)} denetlendi` : ""}</span>
                </span>
                <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium", D.sinif)}><span className={cn("h-1.5 w-1.5 rounded-full", D.nokta)} />{D.ad}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/30 max-sm:hidden" />
              </button>
            ); })}
          </div>
        </Kart>
      )}
      {dikkat.length > 0 && (
        <Kart ikon={AlertTriangle} baslik="Dikkat isteyenler" alt={`${dikkat.length} konu · bağlantıyı açıp düzelt`}>
          <div className="divide-y divide-white/[0.05]">
            {dikkat.map((d, i) => (
              <button key={i} type="button" onClick={() => setAcik(d.b.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] sm:px-5">
                {katalogLogo(katalogBul(d.b.katalogId), d.b, 36)}
                <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{d.b.ad}</span><span className={cn("block text-[12.5px] leading-snug", d.tur === "hata" ? "text-rose-200/90" : "text-amber-100/85")}>{d.metin}</span></span>
                <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">{d.b.durum === "giris-gerekli" ? "Yeniden bağlan" : "Aç"}</span>
              </button>
            ))}
          </div>
        </Kart>
      )}
      <Kart ikon={LayoutGrid} baslik="Servisler" alt={`${BAGLANTI_KATALOGU.length} servis · ${BAGLANTI_KATALOGU.filter((k) => k.turkiye).length} Türk servisi · ajanların ve sohbet bu servislerde okuyup işlem yapabilir`} govde="p-4 sm:p-5">
        <div className="mb-3"><Suzgec id="baglanti-kat" deger={kat} set={setKat} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: BAGLANTI_KATALOGU.length }, ...kategoriler]} /></div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.08] px-3 text-white/45 ring-1 ring-inset ring-transparent focus-within:ring-white/25 sm:max-w-[300px]"><Search className="h-3.5 w-3.5 shrink-0" /><input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Servis ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" /></label>
          <Secici id="baglanti-sira" deger={sira} set={setSira} l={[{ id: "onerilen", ad: "Önerilen" }, { id: "populer", ad: "Popüler" }, { id: "yeni", ad: "Yeni" }, { id: "az", ad: "A-Z" }]} />
          <div className="flex gap-1.5 max-sm:-mx-1 max-sm:w-full max-sm:overflow-x-auto max-sm:px-1 max-sm:[scrollbar-width:none] sm:flex-wrap">
            {ROZETLER.map((r) => { const on = suz.has(r.id); return (
              <button key={r.id} type="button" aria-pressed={on} onClick={() => setSuz((x) => { const y = new Set(x); if (on) y.delete(r.id); else y.add(r.id); return y; })}
                className={cn("h-8 shrink-0 rounded-full px-3 text-[12px] font-medium transition-colors", on ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white" : "bg-white/[0.04] text-white/55 ring-1 ring-inset ring-white/[0.07] hover:text-white")}>{r.ad}</button>
            ); })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {katalog.slice(0, adet).map((k) => { const b = bagli(k.id); return <KatalogKarti key={k.id} k={k} b={b} ac={() => setKatalogAcik(k)} />; })}
        </div>
        {katalog.length > adet && <div className="mt-4 flex items-center justify-center gap-3"><span className="text-[12.5px] text-white/45">{katalog.length} servisin {adet} tanesi gösteriliyor</span><button type="button" onClick={() => setAdet((x) => x + 48)} className="h-9 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]">Daha fazla göster</button></div>}
        {!katalog.length && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-[13.5px] text-white/55">Süzgece uyan servis yok.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setArama(""); setSuz(new Set()); setKat("hepsi"); }} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Süzgeçleri temizle</button>
              <button type="button" onClick={() => document.getElementById("ozel-baglanti")?.scrollIntoView({ behavior: "smooth" })} className="h-9 rounded-full bg-white/[0.08] px-4 text-[13px] text-white">Özel bağlantı ekle</button>
            </div>
          </div>
        )}
      </Kart>
      <PaketlerKarti bagli={(id) => bagli(id)} ac={(k) => setKatalogAcik(k)} />
      <div id="ozel-baglanti"><OzelBaglanti eklendi={(b) => { koy(b); setAcik(b.id); }} /></div>
      <GecitKarti baglantilar={l ?? []} />
      <AnimatePresence>
        {katalogAcik && !secili && <KatalogPaneli key={`k-${katalogAcik.id}`} k={katalogAcik} bagli={bagli(katalogAcik.id)} kapat={() => setKatalogAcik(null)} bitti={koy} ac={(id) => { setKatalogAcik(null); setAcik(id); }} degistir={setKatalogAcik} />}
        {secili && <AyrintiPaneli key={`a-${secili.id}`} b={secili} setB={koy} kapat={() => setAcik(null)} silindi={() => { setL((x) => (x ?? []).filter((z) => z.id !== secili.id)); setAcik(null); }} />}
      </AnimatePresence>
    </div>
  );
}
