"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Braces, Check, Clock, Copy, KeyRound, Loader2, Play, Plus, ScrollText, Sparkles, Wand2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { vurgula } from "@/components/build/calisma/vurgula";
import { api, ApiHatasi, gorece, yayinAdresi } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { KayitAyrintisi, hataIstemi, seviyeBul, type Gunluk } from "./Gunlukler";
import { SEVIYE_SERI, YanPanel, YiginCubuk, ajanaTasi, sureYaz, zamanEtiketi } from "./ortak";

type Ozet = { ad: string; cagri: number; hata: number; p50: number; p95: number; son: number };
type Ayrinti = { kova: number; hacim: { z: number; basarili: number; uyari: number; hata: number }[]; sure: { z: number; p50: number; p95: number }[]; ozet: { cagri: number; hata: number; hataOrani: number; p50: number; p95: number; sonHata: Gunluk | null }; cagrilar: Gunluk[] };
type Sonuc = { durum: number; basliklar: Record<string, string>; govde: string; loglar: string[]; disIstekler: { adres: string; yontem: string; durum: number; sure: number; hata?: string }[]; sure: number; hata: string | null };
type Satir = { a: string; d: string };
const ORNEKLER = [
  { ad: "PayTR ödeme token'ı", istem: "PayTR iFrame ödemesi için api/odeme.js sunucu fonksiyonu yaz: sepetten token al (PAYTR_MERCHANT_ID, PAYTR_KEY, PAYTR_SALT sırlarıyla), ödeme sayfasında iFrame'i göster; bildirim için api/paytr-bildirim.js yaz, hash'i doğrula, siparişi veritabanında ödendi yap ve OK dön." },
  { ad: "İletişim formunu e-postala", istem: "İletişim formu gönderilince api/iletisim.js fonksiyonu Resend API ile (RESEND_API_KEY sırrı) bana e-posta göndersin, kaydı veritabanına da yazsın; formda başarı ve hata mesajı göster." },
  { ad: "Gizli API vekili", istem: "Hava durumu için api/hava.js fonksiyonu yaz: OPENWEATHER_KEY sırrıyla şehir sorgusunu sunucuda yapsın, anahtar tarayıcıya gitmesin; sayfada şehir arama kutusu olsun." },
];
const ZAMANLAR = [{ id: "24s", ad: "Son 24 saat" }, { id: "7g", ad: "Son 7 gün" }, { id: "14g", ad: "Son 14 gün" }, { id: "1s", ad: "Son 1 saat" }, { id: "ozel", ad: "Özel aralık" }];
const RENK = { basarili: "text-emerald-300/80", uyari: "text-amber-200", hata: "text-rose-300" } as const;
const kaynakAdi = (g: Gunluk) => (/ \(deneme\)$/.test(g.y ?? "") ? "Deneme" : / \(önizleme\)$/.test(g.y ?? "") || g.f?.onizleme ? "Önizleme" : "Canlı");
const yuzde = (x: number) => `yüzde ${(x * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
const yerelGirdi = (z: number) => { const d = new Date(z); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

/** Anahtar ve değer satırları (sorgu parametreleri, başlıklar). */
function AnahtarDeger({ l, set, ph, oneriler }: { l: Satir[]; set: (l: Satir[]) => void; ph: [string, string]; oneriler?: { ad: string; satir: Satir }[] }) {
  return (
    <div className="space-y-1.5">
      {l.map((x, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input value={x.a} onChange={(e) => set(l.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)))} placeholder={ph[0]} className={cn(alanSinif, "h-9 min-w-0 flex-[2] font-mono text-[12.5px]")} />
          <input value={x.d} onChange={(e) => set(l.map((y, j) => (j === i ? { ...y, d: e.target.value } : y)))} placeholder={ph[1]} className={cn(alanSinif, "h-9 min-w-0 flex-[3] font-mono text-[12.5px]")} />
          <button type="button" onClick={() => set(l.filter((_, j) => j !== i))} aria-label="Satırı kaldır" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => set([...l, { a: "", d: "" }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Satır ekle</button>
        {oneriler?.filter((o) => !l.some((x) => x.a.toLowerCase() === o.satir.a.toLowerCase())).map((o) => <button key={o.ad} type="button" onClick={() => set([...l.filter((x) => x.a || x.d), o.satir])} className="inline-flex h-8 items-center rounded-full bg-white/[0.04] px-3 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:text-white">{o.ad}</button>)}
      </div>
    </div>
  );
}

/** İstek deneyici: yöntem, sorgu, başlık, gövde; sunucuda çalışır, durum, başlıklar, yanıt, console ve dış istekler döner. */
function Deneyici({ p, ad, yayinda, taslakta }: { p: Proje; ad: string; yayinda: boolean; taslakta: boolean }) {
  const [yontem, setYontem] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("POST");
  const [surum, setSurum] = useState<"taslak" | "yayin">(taslakta ? "taslak" : "yayin");
  const [sorgu, setSorgu] = useState<Satir[]>([]);
  const [basliklar, setBasliklar] = useState<Satir[]>([]);
  const [govde, setGovde] = useState('{\n  "ad": "Deneme"\n}');
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [sekme, setSekme] = useState<"govde" | "basliklar" | "console" | "dis">("govde");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const gonder = async () => {
    setGidiyor(true); setHata(""); setSonuc(null);
    try {
      const x = await api<Sonuc>(`/api/build/bulut/${p.id}/fonksiyon`, { govde: { ad, yontem, surum, sorgu: Object.fromEntries(sorgu.filter((s) => s.a).map((s) => [s.a, s.d])), basliklar: Object.fromEntries(basliklar.filter((s) => s.a).map((s) => [s.a, s.d])), govde: yontem === "GET" ? "" : govde } });
      setSonuc(x); setSekme(x.loglar.length && x.durum >= 400 ? "console" : "govde");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Gönderilemedi."); }
    finally { setGidiyor(false); }
  };
  const bicimli = useMemo(() => { if (!sonuc) return ""; try { return JSON.stringify(JSON.parse(sonuc.govde), null, 2); } catch { return sonuc.govde; } }, [sonuc]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Secici id={`fn-yontem-${ad}`} kucuk deger={yontem} set={setYontem} l={(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((x) => ({ id: x, ad: x }))} />
          <Secici id={`fn-surum-${ad}`} kucuk deger={surum} set={setSurum} l={[{ id: "taslak", ad: "Taslak kod", kapali: !taslakta }, { id: "yayin", ad: "Yayındaki kod", kapali: !yayinda }]} />
        </div>
        <section><h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Sorgu parametreleri</h4><AnahtarDeger l={sorgu} set={setSorgu} ph={["ad", "değer"]} /></section>
        <section><h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Başlıklar</h4><AnahtarDeger l={basliklar} set={setBasliklar} ph={["Başlık", "değer"]} oneriler={[{ ad: "İçerik türü JSON", satir: { a: "Content-Type", d: "application/json" } }, { ad: "Üye oturumu", satir: { a: "x-vayra-oturum", d: "" } }, { ad: "Yetki", satir: { a: "Authorization", d: "Bearer " } }]} /></section>
        {yontem !== "GET" && (
          <section>
            <div className="mb-1.5 flex items-center justify-between"><h4 className="text-[12.5px] font-medium text-white/55">Gövde</h4><button type="button" onClick={() => { try { setGovde(JSON.stringify(JSON.parse(govde), null, 2)); } catch { setHata("Gövde geçerli JSON değil."); } }} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] text-white/55 hover:bg-white/[0.06] hover:text-white"><Wand2 className="h-3 w-3" />Biçimlendir</button></div>
            <textarea value={govde} onChange={(e) => setGovde(e.target.value)} rows={7} spellCheck={false} className={cn(alanSinif, "resize-y py-2.5 font-mono text-[12.5px] leading-relaxed")} />
          </section>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={gonder} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Gönder</button>
          <p className="text-[12px] leading-snug text-white/45">Sunucuda, kum havuzunda çalışır. Gerçek veriye yazabilir; sonuç Günlüklerde deneme olarak görünür.</p>
        </div>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      </div>
      <div className="min-w-0">
        {!sonuc ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-[18px] bg-white/[0.02] px-6 text-center ring-1 ring-inset ring-white/[0.06]">
            {gidiyor ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <><Play className="h-5 w-5 text-white/25" /><p className="mt-2 text-[13px] text-white/55">Yanıt burada görünecek</p><p className="mt-1 text-[12px] text-white/35">Durum kodu, başlıklar, yanıt gövdesi, console çıktısı ve dış istekler</p></>}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <span className={cn("rounded-full px-2.5 py-0.5 font-mono text-[12.5px] font-semibold", sonuc.durum >= 500 ? "bg-rose-500/[0.14] text-rose-200" : sonuc.durum >= 400 ? "bg-amber-400/[0.12] text-amber-200" : "bg-emerald-400/[0.12] text-emerald-200")}>{sonuc.durum}</span>
              <span className="text-[12.5px] text-white/50">{sureYaz(sonuc.sure)}</span>
              <span className="flex-1" />
              <Secici id={`fn-sonuc-${ad}`} kucuk deger={sekme} set={setSekme} l={[{ id: "govde", ad: "Yanıt" }, { id: "basliklar", ad: "Başlıklar" }, { id: "console", ad: `Console ${sonuc.loglar.length}` }, { id: "dis", ad: `Dış ${sonuc.disIstekler.length}` }]} />
            </div>
            {sonuc.hata && <p className="flex items-start gap-2 border-b border-white/[0.06] bg-rose-500/[0.05] px-3 py-2 text-[12.5px] text-rose-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{sonuc.hata}</p>}
            {sekme === "govde" && <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words bg-[#0c0d0f] p-3 font-mono text-[12px] leading-relaxed text-white/80 [scrollbar-width:thin]">{bicimli || "Boş yanıt"}</pre>}
            {sekme === "basliklar" && <dl className="divide-y divide-white/[0.05] bg-[#0c0d0f]">{Object.entries(sonuc.basliklar).map(([k, v]) => <div key={k} className="flex gap-3 px-3 py-2 font-mono text-[12px]"><dt className="w-[160px] shrink-0 text-white/45">{k}</dt><dd className="min-w-0 break-all text-white/80">{v}</dd></div>)}</dl>}
            {sekme === "console" && (sonuc.loglar.length ? <pre className="max-h-[420px] overflow-auto bg-[#0c0d0f] p-3 font-mono text-[12px] leading-relaxed text-white/80 [scrollbar-width:thin]">{sonuc.loglar.join("\n")}</pre> : <p className="bg-[#0c0d0f] px-3 py-4 text-[12.5px] text-white/45">console.log çıktısı yok.</p>)}
            {sekme === "dis" && (sonuc.disIstekler.length ? <div className="divide-y divide-white/[0.05] bg-[#0c0d0f]">{sonuc.disIstekler.map((x, i) => <div key={i} className="flex items-center gap-2.5 px-3 py-2 font-mono text-[12px]"><span className="w-12 shrink-0 text-white/45">{x.yontem}</span><span className="min-w-0 flex-1 truncate text-white/80" title={x.adres}>{x.adres}</span><span className={cn("shrink-0", !x.durum || x.durum >= 500 ? "text-rose-300" : x.durum >= 400 ? "text-amber-200" : "text-emerald-300/80")}>{x.durum || "Ağ hatası"}</span><span className="w-14 shrink-0 text-right text-white/40">{sureYaz(x.sure)}</span></div>)}</div> : <p className="bg-[#0c0d0f] px-3 py-4 text-[12.5px] text-white/45">Fonksiyon dışarıya istek yapmadı.</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Seçili fonksiyonun genel bakışı: çağrı ve hata grafiği, p50 ve p95 süre, son hata. */
function GenelBakis({ p, ad, ajana, ac }: { p: Proje; ad: string; ajana: (m: string) => void; ac: (g: Gunluk) => void }) {
  const [zaman, setZaman] = useState("24s");
  const [aralik, setAralik] = useState({ bas: Date.now() - 864e5, bit: Date.now() });
  const [kaynak, setKaynak] = useState<"hepsi" | "canli" | "deneme">("hepsi");
  const [v, setV] = useState<Ayrinti | null>(null);
  const getir = useCallback(() => api<Ayrinti>(`/api/build/bulut/${p.id}/fonksiyon?ad=${encodeURIComponent(ad)}&zaman=${zaman}&kaynak=${kaynak}${zaman === "ozel" ? `&bas=${aralik.bas}&bit=${aralik.bit}` : ""}`).then(setV).catch(() => setV(null)), [p.id, ad, zaman, kaynak, aralik]);
  useEffect(() => { setV(null); getir(); }, [getir]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[170px]"><AcilirSecim deger={zaman} set={setZaman} l={ZAMANLAR} /></div>
        <Secici id={`fn-kaynak-${ad}`} kucuk deger={kaynak} set={setKaynak} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "canli", ad: "Canlı" }, { id: "deneme", ad: "Deneme ve önizleme" }]} />
        {zaman === "ozel" && (
          <div className="flex w-full flex-wrap items-center gap-2 text-[12.5px] text-white/50">
            <input type="datetime-local" value={yerelGirdi(aralik.bas)} onChange={(e) => { const z = new Date(e.target.value).getTime(); if (z) setAralik((a) => ({ ...a, bas: z })); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} /><span>ile</span>
            <input type="datetime-local" value={yerelGirdi(aralik.bit)} onChange={(e) => { const z = new Date(e.target.value).getTime(); if (z) setAralik((a) => ({ ...a, bit: z })); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} /><span>arası</span>
          </div>
        )}
      </div>
      {!v ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["Çağrı", v.ozet.cagri.toLocaleString("tr-TR")], ["Hata oranı", v.ozet.cagri ? yuzde(v.ozet.hataOrani) : "Çağrı yok"], ["Ortanca süre (p50)", v.ozet.cagri ? sureYaz(v.ozet.p50) : "Çağrı yok"], ["Yavaş uç (p95)", v.ozet.cagri ? sureYaz(v.ozet.p95) : "Çağrı yok"]].map(([a, b]) => (
              <div key={a} className="rounded-[16px] bg-white/[0.03] px-4 py-3 ring-1 ring-inset ring-white/[0.07]"><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{b}</dd></div>
            ))}
          </dl>
          {v.ozet.sonHata && (
            <div className="flex flex-wrap items-start gap-3 rounded-[16px] bg-rose-500/[0.06] px-4 py-3 ring-1 ring-inset ring-rose-300/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <button type="button" onClick={() => ac(v.ozet.sonHata!)} className="min-w-0 flex-1 text-left"><span className="block text-[13px] font-medium text-rose-100">Son hata, {gorece(v.ozet.sonHata.z)}</span><span className="block truncate text-[12.5px] text-rose-100/70">{v.ozet.sonHata.f?.hata ?? v.ozet.sonHata.m ?? `Durum ${v.ozet.sonHata.d}`}</span></button>
              <button type="button" onClick={() => ajana(hataIstemi(v.ozet.sonHata!))} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Ajana düzelt</button>
            </div>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <h4 className="text-[13.5px] font-semibold text-white">Çağrılar ve hatalar</h4>
              <p className="mb-3 text-[12px] text-white/45">Durum sınıfına göre</p>
              <YiginCubuk veri={v.hacim} seriler={SEVIYE_SERI} yukseklik={130} etiket={(z) => zamanEtiketi(z, v.kova)} ipucuBaslik={(z) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
            </section>
            <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <h4 className="text-[13.5px] font-semibold text-white">Süre</h4>
              <p className="mb-3 text-[12px] text-white/45">Her aralığın yavaş ucu (p95), milisaniye</p>
              <YiginCubuk veri={v.sure.map((x) => ({ z: x.z, p95: x.p95 }))} seriler={[{ anahtar: "p95", ad: "p95", renk: "#1e9fcf" }]} birim=" ms" yukseklik={130} etiket={(z) => zamanEtiketi(z, v.kova)}
                ipucuBaslik={(z) => { const x = v.sure.find((s) => s.z === z); return `${new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${x?.p95 ? `, ortanca ${x.p50} ms` : ""}`; }} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/** Son çağrılar listesi. */
function Cagrilar({ p, ad, ac }: { p: Proje; ad: string; ac: (g: Gunluk) => void }) {
  const [l, setL] = useState<Gunluk[] | null>(null);
  useEffect(() => { api<Ayrinti>(`/api/build/bulut/${p.id}/fonksiyon?ad=${encodeURIComponent(ad)}&zaman=14g`).then((x) => setL(x.cagrilar)).catch(() => setL([])); }, [p.id, ad]);
  if (!l) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  if (!l.length) return <div className="flex flex-col items-center gap-2 py-10 text-center"><Clock className="h-5 w-5 text-white/25" /><p className="text-[13px] text-white/60">Son 14 günde çağrı yok</p><p className="text-[12px] text-white/40">Dene sekmesinden bir istek gönder ya da sitede fonksiyonu çalıştır.</p></div>;
  return (
    <div className="-mx-4 divide-y divide-white/[0.04] sm:-mx-5">
      {l.map((g, i) => {
        const s = seviyeBul(g);
        return (
          <button key={`${g.i}-${i}`} type="button" onClick={() => ac(g)} className={cn("grid w-full grid-cols-[64px_40px_1fr_auto] items-center gap-2.5 border-l-2 px-4 py-2 text-left text-[12.5px] hover:bg-white/[0.03] sm:grid-cols-[120px_44px_56px_76px_1fr_auto] sm:px-5", s === "hata" ? "border-l-rose-400/70" : s === "uyari" ? "border-l-amber-300/60" : "border-l-transparent")}>
            <span className="text-white/45" title={new Date(g.z).toLocaleString("tr-TR")}><span className="max-sm:hidden">{new Date(g.z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} </span>{new Date(g.z).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className={cn("font-mono", RENK[s])}>{g.d}</span>
            <span className="font-mono text-[11.5px] text-white/45 max-sm:hidden">{g.yt ?? ""}</span>
            <span className="text-[11.5px] text-white/50 max-sm:hidden">{kaynakAdi(g)}</span>
            <span className="min-w-0 truncate text-white/70">{g.f?.hata ?? g.f?.log?.at(-1) ?? g.m ?? ""}{g.f?.dis?.length ? <span className="text-white/35">, {g.f.dis.length} dış istek</span> : null}</span>
            <span className="shrink-0 font-mono text-white/40">{sureYaz(g.ms)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Bulut > Fonksiyonlar: projedeki api/*.js dosyaları; liste, genel bakış grafikleri, çağrılar, istek deneyici, kod. */
export function Fonksiyonlar({ p, ajana: ajanaVerilen }: { p: Proje; ajana?: (metin: string) => void }) {
  const router = useRouter();
  const yayindaki = useMemo(() => (p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? {} : {}), [p.yayin, p.surumler]);
  const adlar = useMemo(() => [...new Set([...Object.keys(p.dosyalar), ...Object.keys(yayindaki)].filter((y) => /^api\/[A-Za-z0-9_-]+\.js$/.test(y)).map((y) => y.slice(4, -3)))].sort(), [p.dosyalar, yayindaki]);
  const [secili, setSecili] = useState<string | null>(adlar[0] ?? null);
  const [sekme, setSekme] = useState<"genel" | "cagrilar" | "dene" | "kod">("genel");
  const [ozet, setOzet] = useState<Record<string, Ozet>>({});
  const [kopya, setKopya] = useState<string | null>(null);
  const [ayrinti, setAyrinti] = useState<Gunluk | null>(null);
  useEffect(() => { api<{ fonksiyonlar: Ozet[] }>(`/api/build/bulut/${p.id}/fonksiyon`).then((v) => setOzet(Object.fromEntries(v.fonksiyonlar.map((x) => [x.ad, x])))).catch(() => {}); }, [p.id]);
  const adres = yayinAdresi(p.ayarlar.altAlan);
  const sirlar = (p.ayarlar.sirlar ?? []).filter((s) => s.gorunurluk === "sunucu");
  const ajana = ajanaVerilen ?? ((istem: string) => ajanaTasi(p.id, istem, (y) => router.push(y)));
  const kod = secili ? p.dosyalar[`api/${secili}.js`] ?? yayindaki[`api/${secili}.js`] : undefined;

  return (
    <div className="space-y-4">
      <Kart ikon={Braces} baslik="Fonksiyonlar" alt="Projedeki api/ klasörü sunucuda, kum havuzunda çalışır; gizli anahtarlar tarayıcıya gitmez">
        {!adlar.length ? (
          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-[13.5px] leading-relaxed text-white/65">Ödeme token&apos;ı almak, webhook imzası doğrulamak ya da gizli anahtarlı bir API çağırmak gibi işler sunucuda yapılmalı. Projeye <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-white">api/ad.js</code> dosyası eklenince yayında <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-white">/api/ad</code> adresinde çalışır. Build ajanı bu dosyaları kendisi yazar:</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {ORNEKLER.map((o) => <button key={o.ad} type="button" onClick={() => ajana(o.istem)} className="flex items-start gap-2.5 rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="text-[13px] text-white/80">{o.ad}</span></button>)}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {adlar.map((ad) => {
              const taslak = p.dosyalar[`api/${ad}.js`], yayin = yayindaki[`api/${ad}.js`];
              const durum = !yayin ? { ad: "Yalnız taslakta", s: "bg-amber-400/[0.12] text-amber-200" } : !taslak ? { ad: "Taslaktan silindi", s: "bg-white/[0.07] text-white/55" } : taslak !== yayin ? { ad: "Taslakta değişti", s: "bg-amber-400/[0.12] text-amber-200" } : { ad: "Yayında", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" };
              const o = ozet[ad];
              const uc = `${adres.tam}/api/${ad}`;
              return (
                <button key={ad} type="button" onClick={() => setSecili(ad)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5", secili === ad ? "bg-white/[0.04]" : "hover:bg-white/[0.02]")}>
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ring-1 ring-inset", secili === ad ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.06] text-white/65 ring-white/[0.08]")}><Braces className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">/api/{ad}</span>
                    <span className="block truncate text-[12px] text-white/45">{o ? `${o.cagri} çağrı, 7 gün${o.hata ? `, ${o.hata} hata` : ""}, ortanca ${sureYaz(o.p50)}, p95 ${sureYaz(o.p95)}` : "Son 7 günde çağrı yok"}</span></span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium max-sm:hidden", durum.s)}>{durum.ad}</span>
                  <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(uc); setKopya(ad); setTimeout(() => setKopya(null), 1300); }} title="Adresi kopyala" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white">{kopya === ad ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</span>
                </button>
              );
            })}
          </div>
        )}
      </Kart>

      {secili && kod !== undefined && (
        <Kart ikon={ScrollText} baslik={`/api/${secili}`} alt={`${adres.gorunen}/api/${secili}`} govde="p-4 sm:p-5"
          sag={<span className="max-sm:hidden"><Secici id="fn-sekme" deger={sekme} set={setSekme} l={[{ id: "genel", ad: "Genel bakış" }, { id: "cagrilar", ad: "Çağrılar" }, { id: "dene", ad: "Dene" }, { id: "kod", ad: "Kod" }]} /></span>}>
          <div className="mb-4 sm:hidden"><Secici id="fn-sekme-m" kucuk deger={sekme} set={setSekme} l={[{ id: "genel", ad: "Genel" }, { id: "cagrilar", ad: "Çağrılar" }, { id: "dene", ad: "Dene" }, { id: "kod", ad: "Kod" }]} /></div>
          {sekme === "genel" && <GenelBakis p={p} ad={secili} ajana={ajana} ac={setAyrinti} />}
          {sekme === "cagrilar" && <Cagrilar p={p} ad={secili} ac={setAyrinti} />}
          {sekme === "dene" && <Deneyici key={secili} p={p} ad={secili} yayinda={!!yayindaki[`api/${secili}.js`]} taslakta={!!p.dosyalar[`api/${secili}.js`]} />}
          {sekme === "kod" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2"><p className="flex-1 text-[12.5px] text-white/50">{p.dosyalar[`api/${secili}.js`] ? "Taslaktaki kod" : "Yayındaki kod (taslaktan silinmiş)"}</p><Link href={`/panel/build/${p.id}`} className="inline-flex h-8 items-center rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">Çalışma alanında düzenle</Link></div>
              <pre className="kod-renk max-h-[520px] overflow-auto rounded-[14px] bg-[#0c0d0f] p-4 font-mono text-[12px] leading-[1.6] text-white/85 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]"><code dangerouslySetInnerHTML={{ __html: vurgula(kod, "x.js") }} /></pre>
            </div>
          )}
        </Kart>
      )}

      <Kart ikon={KeyRound} baslik="Sunucu sırları" alt="Fonksiyonlar vayra.sir(&quot;AD&quot;) ile okur; sitenin kaynağında görünmez">
        {sirlar.length ? <div className="flex flex-wrap gap-1.5 p-4 sm:p-5">{sirlar.map((s) => <span key={s.ad} className="rounded-full bg-white/[0.06] px-3 py-1.5 font-mono text-[12px] text-white/75 ring-1 ring-inset ring-white/[0.07]">{s.ad}</span>)}</div>
          : <p className="px-5 py-4 text-[13px] text-white/50">Henüz sunucu sırrı yok. Ortam ve sırlar bölümünden &quot;Sunucu&quot; görünürlüklü sır ekle.</p>}
      </Kart>

      <YanPanel acik={!!ayrinti} kapat={() => setAyrinti(null)} genis baslik={ayrinti ? <span className="flex items-center gap-2"><span className={cn("font-mono", RENK[seviyeBul(ayrinti)])}>{ayrinti.d}</span><span className="font-mono text-[14px]">/api/{secili}</span></span> : ""}
        alt={ayrinti ? `${kaynakAdi(ayrinti)} çağrı · ${new Date(ayrinti.z).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
        alt2={ayrinti && seviyeBul(ayrinti) !== "basarili" ? <button type="button" onClick={() => { ajana(hataIstemi(ayrinti)); setAyrinti(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Ajana düzelt</button> : undefined}>
        {ayrinti && <KayitAyrintisi g={ayrinti} />}
      </YanPanel>
    </div>
  );
}
