"use client";

import { useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, ExternalLink, KeyRound, Loader2, Plus, Search, Trash2, Undo2, Wand2 } from "lucide-react";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import type { Adim, Dal } from "@/lib/build/sistemKatalog";
import { UYGULAMALAR, UYG_EYLEM_SAYISI, UYG_KATEGORILERI, eylemBul, uygulamaBul } from "@/lib/build/sistemUygulama";
import { cn } from "@/lib/utils";
import { Alan } from "./AdimAyari";
import { Segment } from "./ortak";
import { DegiskenBaglam, SablonAlani, type VeriKaynagi } from "./SablonAlani";
import { KimlikDurumu, KimlikSecici, Logo } from "./TetikServis";

/** v4 adımlarının ayar formları: Yanıt ver, Paralel dallar, Depo, Uygulama eylemi ve Alanları ayarla. */
type P = { a: Adim; set: (a: Adim) => void; kaynaklar: VeriKaynagi[]; s: (p: Record<string, unknown>) => void };
const kimlik = () => Math.random().toString(36).slice(2, 8);
const Kart = ({ on, onClick, ad, alt, className }: { on: boolean; onClick: () => void; ad: string; alt?: string; className?: string }) => (
  <button type="button" onClick={onClick} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", on ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]", className)}>
    <span className="block text-[12.5px] font-medium text-white">{ad}</span>{alt && <span className="block text-[11px] leading-snug text-white/45">{alt}</span>}
  </button>
);
const Bilgi = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] leading-relaxed text-white/45">{children}</p>;

/* ───── Yanıt ver ───── */
export function YanitAyari({ a, kaynaklar, s }: P) {
  const ay = a.ayar as Record<string, string | number | undefined>;
  const bicim = String(ay.bicim || "metin") as "metin" | "json" | "html";
  const durum = Number(ay.durum) || 200;
  const [ozel, setOzel] = useState(![200, 201, 202, 400, 404, 422].includes(durum));
  return (<>
    <Alan etiket="Biçim"><Segment id={`ybicim-${a.id}`} kucuk deger={bicim} set={(v) => s({ bicim: v })} l={[{ id: "metin", ad: "Metin" }, { id: "json", ad: "JSON" }, { id: "html", ad: "HTML" }]} /></Alan>
    <Alan etiket="Yanıt" ipucu={bicim === "json" ? "Geçerli bir JSON nesnesi yaz; tırnak içindeki veriler kaçışlı metin, tırnak dışındakiler JSON değeri olarak yerleşir." : "Sohbette asistanın mesajı, form sayfasında gösterilen sonuç, API ve MCP'de dönen çıktı olur."}>
      <SablonAlani deger={String(ay.icerik ?? "")} set={(v) => s({ icerik: v })} kaynaklar={kaynaklar} satir={5} kod={bicim !== "metin"} yer={bicim === "json" ? "{\"durum\": \"tamam\", \"siparis\": \"{{tetik.siparisNo}}\"}" : "/ ile önceki adımın yanıtını seç"} etiket="Yanıt" />
    </Alan>
    <Alan etiket="Durum kodu" ipucu="API çağrısında HTTP durum kodu olarak döner.">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><AcilirSecim deger={ozel ? "ozel" : String(durum)} set={(v) => { if (v === "ozel") { setOzel(true); return; } setOzel(false); s({ durum: Number(v) }); }} l={[{ id: "200", ad: "200, tamam" }, { id: "201", ad: "201, oluşturuldu" }, { id: "202", ad: "202, kabul edildi" }, { id: "400", ad: "400, hatalı istek" }, { id: "404", ad: "404, bulunamadı" }, { id: "422", ad: "422, işlenemedi" }, { id: "ozel", ad: "Özel", alt: "100 ile 599 arası" }]} /></div>
        {ozel && <input type="number" min={100} max={599} value={durum} onChange={(e) => s({ durum: Math.max(100, Math.min(599, Number(e.target.value) || 200)) })} aria-label="Durum kodu" className={cn(alanSinif, "h-10 w-24")} />}
      </div>
    </Alan>
    <div className="rounded-[14px] bg-[#55d6fd]/[0.05] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/70 ring-1 ring-inset ring-[#55d6fd]/15">Yanıt bu adıma gelindiği an gider; sonraki adımlar arka planda sürer. Böylece müşteriye hemen yanıt verip kayıt ve bildirim işlerini sonra yapabilirsin. Yanıt ver yoksa son adımın çıktısı döner.</div>
  </>);
}

/* ───── Paralel dallar ───── */
export function ParalelAyari({ a, set, s }: P) {
  const dallar = a.dallar ?? [];
  const d = (i: number, p: Partial<Dal>) => set({ ...a, dallar: dallar.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const harf = (i: number) => String.fromCharCode(65 + i);
  return (<>
    <Alan etiket="Dallar" ipucu="Her dal öbürlerini beklemeden aynı anda çalışır. Dal adları birleşen çıktıda alan adı olur.">
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {dallar.map((x, i) => (
            <motion.div key={x.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 rounded-[14px] bg-white/[0.03] p-1.5 pl-2 ring-1 ring-inset ring-white/[0.07]">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] px-1.5 text-[11.5px] font-semibold text-[#8be6ff]">{harf(i)}</span>
              <input value={x.ad} onChange={(e) => d(i, { ad: e.target.value.replace(/[^\p{L}\p{N}_ -]/gu, "").slice(0, 40) })} aria-label="Dal adı" className="h-8 min-w-0 flex-1 rounded-[10px] bg-transparent px-2 text-[13.5px] font-medium text-white outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]" />
              <span className="shrink-0 text-[11.5px] text-white/40">{x.adimlar.length} adım</span>
              <button type="button" disabled={dallar.length <= 2} onClick={() => set({ ...a, dallar: dallar.filter((_, j) => j !== i) })} aria-label="Dalı sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300 disabled:opacity-25"><Trash2 className="h-3.5 w-3.5" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
        {dallar.length < 5 && <button type="button" onClick={() => set({ ...a, dallar: [...dallar, { id: kimlik(), ad: `Dal ${harf(dallar.length)}`, adimlar: [] }] })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Dal ekle</button>}
      </div>
    </Alan>
    <Alan etiket="Bitince nasıl birleşsin">
      <div className="grid grid-cols-2 gap-1.5">
        <Kart on={(a.ayar.birlestir ?? "nesne") !== "liste"} onClick={() => s({ birlestir: "nesne" })} ad="Dal adlarıyla" alt="Her dalın son çıktısı kendi adıyla" />
        <Kart on={a.ayar.birlestir === "liste"} onClick={() => s({ birlestir: "liste" })} ad="Tek liste" alt="Çıktılar uç uca tek listede" />
      </div>
    </Alan>
    <Bilgi>Dallarda süzgeç tutmazsa yalnız o dal biter. Bekle, insan onayı ve bitmesi beklenen sistem çağrısı paralel dalda kullanılamaz; bunları bloğun öncesine ya da sonrasına koy. Bir dal hata verirse öbürleri bitince adımın hata ayarı uygulanır.</Bilgi>
  </>);
}

/* ───── Depo ───── */
const DEPO_ISLEMLERI = [
  { id: "yaz", ad: "Yaz", alt: "Anahtara değer kaydet" }, { id: "oku", ad: "Oku", alt: "Kayıtlı değeri al" },
  { id: "artir", ad: "Artır", alt: "Sayaç: ekle ya da çıkar" }, { id: "ekle", ad: "Listeye ekle", alt: "Kuyruğun sonuna koy" },
  { id: "cek", ad: "Listeden çek", alt: "Kuyruktan bir öğe al" }, { id: "sil", ad: "Sil", alt: "Anahtarı kaldır" },
  { id: "goruldu", ad: "Daha önce görüldü mü", alt: "Tekrarları ayıkla: aynı değer ikinci kez gelirse dur" },
];
export function DepoAyari({ a, kaynaklar, s }: P) {
  const ay = a.ayar as Record<string, string | number | undefined>;
  const islem = String(ay.islem || "yaz");
  const sure = Number(ay.sure) || 0;
  const [sureOzel, setSureOzel] = useState(![0, 1, 7, 30, 90].includes(sure));
  const dg = useContext(DegiskenBaglam);
  return (<>
    <Alan etiket="İşlem">
      <div className="grid grid-cols-2 gap-1.5">{DEPO_ISLEMLERI.map((x) => <Kart key={x.id} on={islem === x.id} onClick={() => s({ islem: x.id })} ad={x.ad} alt={x.alt} className={x.id === "goruldu" ? "col-span-2" : undefined} />)}</div>
    </Alan>
    <Alan etiket="Anahtar" ipucu={islem === "goruldu" ? "Görülen değerlerin tutulduğu listenin adı, ör. islenen_siparisler." : "Ör. son_siparis_no, gunluk_sayac. / ile önceki adımdan da kurabilirsin: musteri_{{tetik.eposta}}."}>
      <SablonAlani tekSatir deger={String(ay.anahtar ?? "")} set={(v) => s({ anahtar: v })} kaynaklar={kaynaklar} yer={islem === "goruldu" ? "islenen_siparisler" : "son_siparis_no"} etiket="Anahtar" />
    </Alan>
    <Alan etiket="Kimin deposu"><Segment id={`dkap-${a.id}`} kucuk deger={(ay.kapsam === "hesap" ? "hesap" : "sistem") as "sistem" | "hesap"} set={(v) => s({ kapsam: v })} l={[{ id: "sistem", ad: "Yalnız bu sistem" }, { id: "hesap", ad: "Bütün sistemlerim" }]} /></Alan>
    {(islem === "yaz" || islem === "ekle" || islem === "goruldu" || islem === "oku") && (
      <Alan etiket={islem === "oku" ? "Yoksa varsayılan değer" : islem === "goruldu" ? "Denetlenecek değer" : "Değer"} ipucu={islem === "goruldu" ? "Ör. sipariş numarası ya da e-posta. İlk gelişte kaydedilir; ikinci gelişte görüldü olur." : islem === "oku" ? "Anahtar yoksa bu değer döner (boşsa boş)." : "Metin, sayı ya da JSON. / ile önceki adımın verisini seç."}>
        <SablonAlani deger={String(ay.deger ?? "")} set={(v) => s({ deger: v })} kaynaklar={kaynaklar} satir={2} yer="/ ile veri seç ya da yaz" etiket="Değer" />
      </Alan>
    )}
    {islem === "artir" && <Alan etiket="Ne kadar" ipucu="Azaltmak için eksi sayı yaz. Anahtar yoksa sıfırdan başlar."><input type="number" value={Number(ay.miktar ?? 1)} onChange={(e) => s({ miktar: Number(e.target.value) || 0 })} className={cn(alanSinif, "h-10 w-32")} /></Alan>}
    {islem === "cek" && <Alan etiket="Hangi uçtan"><Segment id={`dcek-${a.id}`} kucuk deger={(ay.nereden === "son" ? "son" : "ilk") as "ilk" | "son"} set={(v) => s({ nereden: v })} l={[{ id: "ilk", ad: "En eski (sıra)" }, { id: "son", ad: "En yeni (yığın)" }]} /></Alan>}
    {islem === "goruldu" && <Alan etiket="Daha önce görüldüyse"><Segment id={`dgor-${a.id}`} kucuk deger={(ay.gorulduyse === "devam" ? "devam" : "dur") as "dur" | "devam"} set={(v) => s({ gorulduyse: v })} l={[{ id: "dur", ad: "Sistemi durdur" }, { id: "devam", ad: "Devam et, görüldü bilgisiyle" }]} /></Alan>}
    {(islem === "yaz" || islem === "ekle" || islem === "goruldu" || islem === "artir") && (
      <Alan etiket="Ne kadar saklansın">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={sureOzel ? "ozel" : String(sure)} set={(v) => { if (v === "ozel") { setSureOzel(true); return; } setSureOzel(false); s({ sure: Number(v) }); }} l={[{ id: "0", ad: "Süresiz", alt: "Sen silene kadar" }, { id: "1", ad: "1 gün" }, { id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }, { id: "ozel", ad: "Özel", alt: "Gün sayısını yaz" }]} /></div>
          {sureOzel && <input type="number" min={1} max={3650} value={sure || 1} onChange={(e) => s({ sure: Math.max(1, Math.min(3650, Number(e.target.value) || 1)) })} aria-label="Gün" className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
    )}
    <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
      <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-white/55">Depodaki anahtarları Değişkenler ve sırlar panelinin Depo bölümünde görür, silebilirsin. Adımı dene yazmaz; taslak deneme ve canlı çalışma yazar.</span>
      {dg.yonet && <button type="button" onClick={dg.yonet} className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/[0.12]">Depoyu aç</button>}
    </div>
  </>);
}

/* ───── Alanları ayarla (Dönüştür > JSON) ───── */
type Satir = { ad: string; deger: string; tur: string };
export function AlanAyarla({ a, kaynaklar, s }: P) {
  const ay = a.ayar as Record<string, unknown>;
  const l: Satir[] = useMemo(() => { try { const j = JSON.parse(String(ay.satirlar || "[]")); return Array.isArray(j) ? j : []; } catch { return []; } }, [ay.satirlar]);
  const yaz = (x: Satir[]) => s({ satirlar: JSON.stringify(x) });
  const d = (i: number, p: Partial<Satir>) => yaz(l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (<>
    <Alan etiket="Alanlar" ipucu="Her satır çıktı nesnesinde bir alan olur. Nokta ile iç içe yaz: musteri.ad. Değeri / ile önceki adımlardan seç, hapa tıklayıp işlev ekle.">
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {l.map((x, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
              <div className="flex gap-1.5">
                <input value={x.ad} onChange={(e) => d(i, { ad: e.target.value.replace(/[^\p{L}\p{N}_.]/gu, "").slice(0, 60) })} placeholder="alan_adi" aria-label="Alan adı" className={cn(alanSinif, "sc-kod h-9 min-w-0 flex-1 text-[13px]")} />
                <div className="w-[128px] shrink-0"><AcilirSecim deger={x.tur || "otomatik"} set={(v) => d(i, { tur: v })} l={[{ id: "otomatik", ad: "Olduğu gibi", alt: "Seçilen verinin türü korunur" }, { id: "metin", ad: "Metin" }, { id: "sayi", ad: "Sayı" }, { id: "evet-hayir", ad: "Evet ya da hayır" }, { id: "json", ad: "JSON" }]} /></div>
                <button type="button" onClick={() => yaz(l.filter((_, j) => j !== i))} aria-label="Alanı sil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <SablonAlani tekSatir deger={x.deger} set={(v) => d(i, { deger: v })} kaynaklar={kaynaklar} yer="/ ile değer seç ya da yaz" etiket={`${x.ad || "alan"} değeri`} />
            </motion.div>
          ))}
        </AnimatePresence>
        {l.length < 60 && <button type="button" onClick={() => yaz([...l, { ad: `alan${l.length + 1}`, deger: "", tur: "otomatik" }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Alan ekle</button>}
      </div>
    </Alan>
    <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="text-[13px] text-white/80">Gelen nesnenin alanlarını koru<span className="block text-[11.5px] text-white/45">Açıksa aşağıdaki nesnenin üstüne yazar; kapalıysa yalnız bu alanlar çıkar</span></span><Anahtar acik={ay.koru === true} etiket="Koru" set={(v) => s({ koru: v })} /></label>
    {ay.koru === true && <Alan etiket="Gelen nesne"><SablonAlani tekSatir deger={String(ay.deger ?? "")} set={(v) => s({ deger: v })} kaynaklar={kaynaklar} yer="/ ile nesne seç, ör. Tetik verisi" etiket="Gelen nesne" /></Alan>}
  </>);
}

/* ───── Uygulama eylemi ───── */
export function UygulamaAyari({ a, set, kaynaklar, s }: P) {
  const ay = a.ayar as Record<string, unknown>;
  const u = uygulamaBul(ay.servis), e = eylemBul(u, ay.eylem);
  const dg = useContext(DegiskenBaglam);
  const [ara, setAra] = useState("");
  const [kat, setKat] = useState("Tümü");
  const [secici, setSecici] = useState(!u);
  const q = ara.trim().toLocaleLowerCase("tr");
  const l = UYGULAMALAR.filter((x) => (kat === "Tümü" || (kat === "Türkiye" ? x.turkiye : x.kategori === kat)) && (!q || `${x.ad} ${x.aciklama} ${x.kategori} ${x.eylemler.map((y) => y.ad).join(" ")}`.toLocaleLowerCase("tr").includes(q)));
  const sec = (id: string) => { const y = uygulamaBul(id)!; const ilk = y.eylemler[0]; set({ ...a, ad: a.ad === "Uygulama eylemi" || UYGULAMALAR.some((z) => z.eylemler.some((w) => `${z.ad}: ${w.ad}` === a.ad)) ? `${y.ad}: ${ilk.ad}` : a.ad, ayar: { servis: id, eylem: ilk.id, ...Object.fromEntries(ilk.alanlar.filter((f) => f.varsayilan).map((f) => [f.ad, f.varsayilan!])) } }); setSecici(false); };
  if (secici || !u) return (
    <div className="space-y-2.5">
      {u && <button type="button" onClick={() => setSecici(false)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/65 hover:bg-white/[0.06]"><ArrowLeft className="h-3.5 w-3.5" />{u.ad} ayarlarına dön</button>}
      <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08]"><Search className="h-4 w-4 text-white/40" /><input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder={`${UYGULAMALAR.length} servis, ${UYG_EYLEM_SAYISI} eylem: Trendyol, SMS, E-Tablolar`} className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" /></div>
      <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">{["Tümü", "Türkiye", ...UYG_KATEGORILERI].map((x) => <button key={x} type="button" onClick={() => setKat(x)} className={cn("h-7 shrink-0 rounded-full px-2.5 text-[11.5px] font-medium transition", kat === x ? "bg-white text-black" : "bg-white/[0.05] text-white/60 hover:text-white")}>{x}</button>)}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {l.map((x) => (
          <button key={x.id} type="button" onClick={() => sec(x.id)} className={cn("flex min-w-0 items-center gap-2.5 rounded-[14px] p-2 text-left transition", u?.id === x.id ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
            <Logo src={x.logo} ad={x.ad} koyu={x.koyu} />
            <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-white">{x.ad}</span><span className="block truncate text-[11px] text-white/45">{x.eylemler.length} eylem · {x.kategori}</span></span>
          </button>
        ))}
      </div>
      {!l.length && <p className="text-[12.5px] text-white/45">Bu aramaya uyan servis yok. HTTP isteği adımıyla her API'yi, Bağlantı adımıyla bağlı MCP servislerini kullanabilirsin.</p>}
    </div>
  );
  return (<>
    <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
      <Logo src={u.logo} ad={u.ad} k="h-10 w-10" koyu={u.koyu} />
      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{u.ad}</span><span className="block truncate text-[11.5px] text-white/45">{u.kategori} · {u.aciklama}</span></span>
      <a href={u.belge} target="_blank" rel="noopener noreferrer" aria-label="API belgesi" title="Servisin API belgesi" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
      <button type="button" onClick={() => setSecici(true)} className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/[0.12]">Değiştir</button>
    </div>
    <Alan etiket="Eylem">
      <div className="grid grid-cols-1 gap-1.5">{u.eylemler.map((x) => <Kart key={x.id} on={e?.id === x.id} onClick={() => set({ ...a, ad: !a.ad || a.ad === `${u.ad}: ${e?.ad}` || a.ad === "Uygulama eylemi" ? `${u.ad}: ${x.ad}` : a.ad, ayar: { ...a.ayar, eylem: x.id, ...Object.fromEntries(x.alanlar.filter((f) => f.varsayilan && a.ayar[f.ad] === undefined).map((f) => [f.ad, f.varsayilan!])) } })} ad={x.ad} alt={x.aciklama} />)}</div>
    </Alan>
    <KimlikSecici u={u} deger={typeof ay.baglanti === "string" ? ay.baglanti : undefined} set={(v) => s({ baglanti: v ?? "" })} />
    {e && <KimlikDurumu u={u} sirlar={e.sirlar} baglanti={typeof ay.baglanti === "string" && ay.baglanti ? ay.baglanti : undefined} />}
    {e?.alanlar.map((f) => (
      <Alan key={f.ad} etiket={`${f.etiket}${f.zorunlu ? "" : ""}`} sag={!f.zorunlu ? <span className="text-[11px] text-white/35">isteğe bağlı</span> : undefined} ipucu={f.aciklama}>
        {f.tur === "secim" && f.secenekler ? <AcilirSecim deger={String(ay[f.ad] ?? f.varsayilan ?? f.secenekler[0]?.id ?? "")} set={(v) => s({ [f.ad]: v })} l={f.secenekler.map((x) => ({ id: x.id || "_", ad: x.ad }))} />
          : f.tur === "evet-hayir" ? <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="text-[13px] text-white/80">{ay[f.ad] === true ? "Evet" : "Hayır"}</span><Anahtar acik={ay[f.ad] === true} etiket={f.etiket} set={(v) => s({ [f.ad]: v })} /></label>
          : <SablonAlani tekSatir={f.tur !== "uzunMetin" && f.tur !== "json"} satir={f.tur === "json" ? 3 : 4} kod={f.tur === "json"} deger={String(ay[f.ad] ?? "")} set={(v) => s({ [f.ad]: v })} kaynaklar={kaynaklar} yer={f.yer ?? "/ ile veri seç ya da yaz"} etiket={f.etiket} />}
      </Alan>
    ))}
    <Bilgi>İstek servisin resmî API'sine sunucudan gider; Adımı dene gerçek istek gönderir (ör. Slack'e mesaj düşer). Geçici hatalarda adımın yeniden deneme ayarı uygulanır.</Bilgi>
  </>);
}

/* ───── Kod adımı: yapay zekâyla yaz ───── */
type KodSonucu = { kod: string; aciklama: string; kredi: number; deneme: { deger?: unknown; hata?: string; loglar: string[] } };
export function KodYazici({ sistemId, a, set }: { sistemId: string; a: Adim; set: (a: Adim) => void }) {
  const [acik, setAcik] = useState(false);
  const [tarif, setTarif] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [son, setSon] = useState<(KodSonucu & { onceki: string }) | null>(null);
  const yaz = async () => {
    setGidiyor(true); setHata("");
    try {
      const v = await api<KodSonucu>(`/api/build/sistemler/${sistemId}/kod`, { govde: { adimId: a.id, tarif, kod: String(a.ayar.kod ?? "") } });
      setSon({ ...v, onceki: String(a.ayar.kod ?? "") });
      set({ ...a, ayar: { ...a.ayar, kod: v.kod } });
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kod yazılamadı."); }
    finally { setGidiyor(false); }
  };
  return (
    <div className="rounded-[16px] bg-[#55d6fd]/[0.05] p-3 ring-1 ring-inset ring-[#55d6fd]/15">
      {!acik ? (
        <button type="button" onClick={() => setAcik(true)} className="flex w-full items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.14] text-[#8be6ff]"><Wand2 className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Yapay zekâyla yaz</span><span className="block text-[11.5px] text-white/50">Ne yapacağını anlat; kod deneme verisiyle denenip yazılır</span></span>
        </button>
      ) : (
        <div className="space-y-2">
          <textarea autoFocus value={tarif} onChange={(e) => setTarif(e.target.value)} rows={2} maxLength={3000} placeholder="Örneğin: sipariş kalemlerinin KDV dahil toplamını hesapla, 1.000 TL üstüyse buyuk alanını doğru yap" className={cn(alanSinif, "cam-istemci resize-y py-2.5 text-[13px]")} />
          {hata && <p className="text-[12px] text-rose-300">{hata}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={yaz} disabled={gidiyor || tarif.trim().length < 4} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}{String(a.ayar.kod ?? "").trim() ? "Yaz ya da düzelt" : "Yaz"}</button>
            <button type="button" onClick={() => { setAcik(false); setHata(""); }} className="h-9 rounded-full px-3 text-[13px] text-white/60 hover:bg-white/[0.06]">Kapat</button>
            {son && <button type="button" onClick={() => { set({ ...a, ayar: { ...a.ayar, kod: son.onceki } }); setSon(null); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06]"><Undo2 className="h-3.5 w-3.5" />Önceki koda dön</button>}
          </div>
          <AnimatePresence>
            {son && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("rounded-[12px] px-3 py-2 text-[12px] leading-relaxed ring-1 ring-inset", son.deneme.hata ? "bg-rose-500/[0.07] text-rose-200 ring-rose-400/20" : "bg-emerald-400/[0.06] text-emerald-100/90 ring-emerald-300/15")}>
                <p className="font-medium">{son.deneme.hata ? "Kod yazıldı ama denemede hata verdi" : "Kod yazıldı ve deneme verisiyle çalıştı"}{son.kredi ? ` · ${son.kredi} kredi` : ""}</p>
                {son.aciklama && <p className="mt-0.5 text-white/60">{son.aciklama}</p>}
                <p className="sc-kod mt-1 line-clamp-3 break-all text-[11.5px] text-white/70">{son.deneme.hata ?? JSON.stringify(son.deneme.deger)}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
