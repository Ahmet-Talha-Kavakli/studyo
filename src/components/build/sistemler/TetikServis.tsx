"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Link2, Loader2, Radio, Search, ShieldCheck, Store, Zap } from "lucide-react";
import { AcilirSecim, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Tetikleyici } from "@/lib/build/sistemKatalog";
import { ISLETME_OLAYLARI, KANCA_IMZALARI, OLAY_EK_ALANLARI, SERVIS_OLAYLARI, YOKLAMA_ARALIKLARI, kancaImzaBul, servisOlayBul } from "@/lib/build/sistemTetikKatalog";
import { eylemBul, gerekenSirlar, turetilmis, uygulamaBul, type UygAlan, type Uygulama } from "@/lib/build/sistemUygulama";
import { cn } from "@/lib/utils";
import { Alan } from "./AdimAyari";
import { DegiskenBaglam } from "./SablonAlani";
import type { SistemAcik } from "./ortak";

/**
 * Servis tetikleri, işletme tetikleri, imzalı web kancası ve kimlik seçimi (uygulama eylemi ile servis tetiği ortak).
 * Kimlik: Bağlantılar'da bu servise kayıtlı bağlantı seçilir ya da hesabın sistem sırları kullanılır.
 */
type BaglantiOzet = { id: string; ad: string; katalogId?: string; durum: string; etiket?: string; logo?: string };
let BAGLANTI_ONBELLEK: Promise<BaglantiOzet[]> | null = null;
const baglantilariGetir = () => (BAGLANTI_ONBELLEK ??= api<{ baglantilar: BaglantiOzet[] }>("/api/build/baglantilar").then((v) => v.baglantilar).catch(() => { BAGLANTI_ONBELLEK = null; return []; }));

export function Logo({ src, ad, k = "h-9 w-9", koyu }: { src: string; ad: string; k?: string; koyu?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={cn("flex shrink-0 items-center justify-center rounded-[10px] p-1.5", koyu ? "bg-black ring-1 ring-inset ring-white/15" : "bg-white", k)}><img src={src} alt={ad} className="max-h-full max-w-full object-contain" /></span>;
}

/** Kimlik kaynağı: sistem sırları ya da bu servisin bağlantılarından biri. */
export function KimlikSecici({ u, deger, set }: { u: Uygulama; deger?: string; set: (id: string | undefined) => void }) {
  const [l, setL] = useState<BaglantiOzet[] | null>(null);
  const kataloglar = useMemo(() => (u.baglanti ?? []).map((b) => b.katalog), [u]);
  useEffect(() => { if (kataloglar.length) baglantilariGetir().then((x) => setL(x.filter((b) => b.katalogId && kataloglar.includes(b.katalogId)))); else setL([]); }, [kataloglar]);
  if (!kataloglar.length) return null;
  const secenek = [{ id: "_sir", ad: "Sistem sırları", alt: "Değişkenler ve sırlar panelindeki değerler" }, ...(l ?? []).map((b) => ({ id: b.id, ad: b.etiket ? `${b.ad} (${b.etiket})` : b.ad, alt: b.durum === "etkin" ? "Bağlantılar'dan, bağlı" : b.durum === "giris-gerekli" ? "Bağlantılar'dan, yeniden giriş gerekli" : "Bağlantılar'dan", gorsel: b.logo }))];
  return (
    <Alan etiket="Kimlik" ipucu={l && !l.length ? <>Bağlantılar'da {u.ad} bağlarsan anahtar bir kez girilir, burada seçilir. <Link href="/panel/build/baglantilar" className="text-[#8be6ff] underline-offset-2 hover:underline">Bağlantılar</Link></> : "Bağlantı seçersen anahtar ve belirteç oradan gelir; oturum süresi dolarsa kendiliğinden yenilenir."}>
      {l === null ? <div className="h-10 animate-pulse rounded-[14px] bg-white/[0.04]" /> : <AcilirSecim deger={deger || "_sir"} set={(v) => set(v === "_sir" ? undefined : v)} l={secenek} />}
    </Alan>
  );
}

/** Eylemin (ya da tetiğin okuma eyleminin) gereken sırları ve durumu; nokta ile, tik kullanmadan. */
export function KimlikDurumu({ u, sirlar: eylemSirlari, baglanti }: { u: Uygulama; sirlar: string[]; baglanti?: string }) {
  const dg = useContext(DegiskenBaglam);
  const es = baglanti ? u.baglanti?.flatMap((b) => Object.keys(b.esle)) ?? [] : [];
  const gerek = gerekenSirlar(u, { sirlar: eylemSirlari }).filter((x) => !(baglanti && es.includes(x)));
  const bagTuretir = baglanti && eylemSirlari.filter(turetilmis).every((x) => es.includes(x));
  const liste = bagTuretir ? gerek.filter((x) => !u.kimlik?.sirlar.includes(x) || eylemSirlari.includes(x)) : gerek;
  const sirVar = (ad: string) => dg.sirlar.some((x) => x.ad === ad);
  const eksik = liste.filter((x) => !sirVar(x));
  return (
    <section className={cn("space-y-2 rounded-[16px] p-3 ring-1 ring-inset", eksik.length ? "bg-amber-400/[0.05] ring-amber-300/20" : "bg-emerald-400/[0.04] ring-emerald-300/15")}>
      <p className="flex items-center gap-2 text-[13px] font-semibold text-white/90"><KeyRound className="h-3.5 w-3.5" />Kimlik bilgileri<span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium", eksik.length ? "bg-amber-400/[0.14] text-amber-100" : "bg-emerald-400/[0.14] text-emerald-200")}>{eksik.length ? `${eksik.length} sır eksik` : baglanti ? "Bağlantıdan" : "Hazır"}</span></p>
      {baglanti && <p className="flex items-center gap-2 text-[12px] text-white/60"><Link2 className="h-3.5 w-3.5" />{es.length} değer seçilen bağlantıdan gelir.</p>}
      {liste.map((ad) => { const t = u.sirlar.find((x) => x.ad === ad); const v = sirVar(ad); return (
        <div key={ad} className="flex items-start gap-2.5">
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", v ? "bg-emerald-300" : "bg-amber-300")} aria-label={v ? "Var" : "Eksik"} />
          <span className="min-w-0 flex-1"><span className="block text-[12.5px] text-white/85">{t?.etiket ?? ad} <span className="sc-kod text-[11px] text-white/45">{ad}</span></span><span className="block text-[11.5px] leading-relaxed text-white/45">{t?.nasil}</span></span>
        </div>
      ); })}
      {eksik.length > 0 && dg.yonet && <button type="button" onClick={dg.yonet} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><KeyRound className="h-3.5 w-3.5" />Sırları ekle</button>}
      {u.kimlik && eylemSirlari.some(turetilmis) && !bagTuretir && <p className="text-[11.5px] leading-relaxed text-white/40">Erişim belirteci bu değerlerle sunucuda alınır, süresi dolunca yenilenir{u.kimlik.sirlar.some((x) => /REFRESH/.test(x)) ? "; servis yeni yenileme belirteci verirse sır kendiliğinden güncellenir" : ""}.</p>}
      <p className="text-[11.5px] leading-relaxed text-white/40">Sırlar şifreli saklanır, yalnız istek anında çözülür; günlüklerde ve çıktılarda maskelenir.</p>
    </section>
  );
}

function DuzAlan({ f, deger, set }: { f: UygAlan; deger: string; set: (v: string) => void }) {
  if (f.tur === "secim" && f.secenekler) return <AcilirSecim deger={deger || f.varsayilan || f.secenekler[0]?.id || ""} set={set} l={f.secenekler.map((x) => ({ id: x.id || "_", ad: x.ad }))} />;
  if (f.tur === "uzunMetin" || f.tur === "json") return <textarea value={deger} onChange={(e) => set(e.target.value)} rows={3} placeholder={f.yer} className={cn(alanSinif, "cam-istemci resize-y py-2.5 text-[13px]", f.tur === "json" && "sc-kod")} />;
  return <input value={deger} onChange={(e) => set(e.target.value)} placeholder={f.yer} inputMode={f.tur === "sayi" ? "numeric" : undefined} className={cn(alanSinif, "cam-istemci h-10 text-[13px]")} />;
}

type Onizleme = { ogeler: unknown[]; toplam: number };
function OnizlemeListesi({ o, testVerisi }: { o: Onizleme; testVerisi: (v: unknown) => void }) {
  if (!o.ogeler.length) return <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-white/50 ring-1 ring-inset ring-white/[0.06]">Şu an öğe yok. Yeni öğe gelince sistem çalışır.</p>;
  return (
    <div className="space-y-1.5">
      <p className="text-[12.5px] font-medium text-white/80">{o.toplam} öğe bulundu; en yeniler</p>
      <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
        {o.ogeler.slice(0, 5).map((x, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2">
            <span className="sc-kod min-w-0 flex-1 truncate text-[11.5px] text-white/70">{JSON.stringify(x).slice(0, 160)}</span>
            <button type="button" onClick={() => testVerisi(x)} className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] text-white/80 hover:bg-white/[0.12]">Test verisi yap</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServisTetikAyari({ t, set, s, testVerisi }: { t: Extract<Tetikleyici, { tur: "servis" }>; set: (t: Tetikleyici) => void; s: SistemAcik; testVerisi: (v: unknown) => void }) {
  const o = servisOlayBul(t.olay);
  const u = uygulamaBul(o?.servis ?? t.servis), e = eylemBul(u, o?.eylem);
  const [ara, setAra] = useState("");
  const [secici, setSecici] = useState(!o);
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [gidiyor, setGidiyor] = useState<"oku" | "yokla" | null>(null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [aralikOzel, setAralikOzel] = useState(!YOKLAMA_ARALIKLARI.includes(t.aralik));
  const durum = s.yoklama?.[t.id];
  const q = ara.trim().toLocaleLowerCase("tr");
  const l = SERVIS_OLAYLARI.filter((x) => !q || `${x.ad} ${x.alt} ${uygulamaBul(x.servis)?.ad}`.toLocaleLowerCase("tr").includes(q));
  const oku = async () => {
    setGidiyor("oku"); setHata(""); setBilgi("");
    try { setOnizleme(await api<Onizleme>(`/api/build/sistemler/${s.id}/yokla`, { govde: { tetik: t } })); } catch (er) { setOnizleme(null); setHata(er instanceof ApiHatasi ? er.message : "Okunamadı."); } finally { setGidiyor(null); }
  };
  const yokla = async () => {
    setGidiyor("yokla"); setHata(""); setBilgi("");
    try { const v = await api<{ yeni: number }>(`/api/build/sistemler/${s.id}/yokla`, { govde: { yokla: t.id } }); setBilgi(v.yeni ? `${v.yeni} yeni öğe için çalışma başladı.` : "Yeni öğe yok."); } catch (er) { setHata(er instanceof ApiHatasi ? er.message : "Yoklanamadı."); } finally { setGidiyor(null); }
  };
  if (secici || !o || !u || !e) return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08]"><Search className="h-4 w-4 text-white/40" /><input autoFocus value={ara} onChange={(x) => setAra(x.target.value)} placeholder="Olay ara: sipariş, satır, e-posta" className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" /></div>
      <div className="grid grid-cols-1 gap-1.5">
        {l.map((x) => { const y = uygulamaBul(x.servis); if (!y) return null; return (
          <button key={x.id} type="button" onClick={() => { set({ id: t.id, tur: "servis", servis: x.servis, olay: x.id, ayar: {}, aralik: t.aralik || 5, ...(t.olay && servisOlayBul(t.olay)?.servis === x.servis && t.baglanti ? { baglanti: t.baglanti } : {}) }); setSecici(false); setOnizleme(null); }}
            className={cn("flex min-w-0 items-center gap-2.5 rounded-[14px] p-2 text-left transition", t.olay === x.id ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
            <Logo src={y.logo} ad={y.ad} koyu={y.koyu} />
            <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-white">{x.ad}</span><span className="block truncate text-[11px] text-white/45">{y.ad} · {x.alt}</span></span>
          </button>
        ); })}
      </div>
      <p className="text-[11.5px] leading-relaxed text-white/40">{SERVIS_OLAYLARI.length} servis olayı. Servis olayı göndermeyi destekliyorsa Web kancası tetiğinde imza doğrulamasını da seçebilirsin.</p>
    </div>
  );
  const alanlar = e.alanlar.filter((f) => (o.alanlar ?? e.alanlar.filter((x) => x.zorunlu).map((x) => x.ad)).includes(f.ad));
  const ek = OLAY_EK_ALANLARI[o.id] ?? [];
  const ayarYaz = (ad: string, v: string) => set({ ...t, ayar: { ...(t.ayar ?? {}), [ad]: v } });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
        <Logo src={u.logo} ad={u.ad} k="h-10 w-10" koyu={u.koyu} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{o.ad}</span><span className="block truncate text-[11.5px] text-white/45">{u.ad} · {o.alt}</span></span>
        <button type="button" onClick={() => setSecici(true)} className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/[0.12]">Değiştir</button>
      </div>
      <KimlikSecici u={u} deger={t.baglanti} set={(v) => set({ ...t, baglanti: v })} />
      <KimlikDurumu u={u} sirlar={e.sirlar} baglanti={t.baglanti} />
      {[...alanlar, ...ek].map((f) => <Alan key={f.ad} etiket={f.etiket} ipucu={f.aciklama}><DuzAlan f={f} deger={String(t.ayar?.[f.ad] ?? "")} set={(v) => ayarYaz(f.ad, v)} /></Alan>)}
      <Alan etiket="Ne sıklıkla yoklansın" ipucu="İlk okumada var olan öğeler işaretlenir; sistem yalnız sonradan gelen yeni öğeler için çalışır.">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1"><AcilirSecim deger={aralikOzel ? "ozel" : String(t.aralik)} set={(v) => { if (v === "ozel") { setAralikOzel(true); return; } setAralikOzel(false); set({ ...t, aralik: Number(v) }); }} l={[...YOKLAMA_ARALIKLARI.map((x) => ({ id: String(x), ad: x === 1 ? "Dakikada bir" : x === 60 ? "Saatte bir" : `${x} dakikada bir` })), { id: "ozel", ad: "Özel", alt: "1 ile 1440 dakika" }]} /></div>
          {aralikOzel && <input type="number" min={1} max={1440} value={t.aralik} onChange={(x) => set({ ...t, aralik: Math.max(1, Math.min(1440, Number(x.target.value) || 5)) })} aria-label="Dakika" className={cn(alanSinif, "h-10 w-24")} />}
        </div>
      </Alan>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={oku} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor === "oku" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}Şimdi oku</button>
        {s.durum === "acik" && <button type="button" onClick={yokla} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{gidiyor === "yokla" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}Yayındakini şimdi yokla</button>}
      </div>
      {durum && <p className="text-[12px] text-white/50">{durum.hata ? <span className="text-rose-300">Son yoklama başarısız: {durum.hata}</span> : <>Son yoklama {gorece(durum.son)} · {durum.gorulen.length} öğe işaretli · şimdiye kadar {durum.yeni ?? 0} çalışma</>}</p>}
      {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      {bilgi && <p className="text-[12.5px] text-emerald-200">{bilgi}</p>}
      {onizleme && <OnizlemeListesi o={onizleme} testVerisi={testVerisi} />}
    </div>
  );
}

export function IsletmeTetikAyari({ t, set, s, projeler, testVerisi }: { t: Extract<Tetikleyici, { tur: "isletme" }>; set: (t: Tetikleyici) => void; s: SistemAcik; projeler: { id: string; ad: string }[]; testVerisi: (v: unknown) => void }) {
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const durum = s.yoklama?.[t.id];
  const oku = async () => {
    setGidiyor(true); setHata("");
    try { setOnizleme(await api<Onizleme>(`/api/build/sistemler/${s.id}/yokla`, { govde: { tetik: t } })); } catch (er) { setOnizleme(null); setHata(er instanceof ApiHatasi ? er.message : "Okunamadı."); } finally { setGidiyor(false); }
  };
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2.5 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/55 ring-1 ring-inset ring-white/[0.06]"><Store className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" />Build sitendeki İşletme sekmesinin mağaza, randevu, yorum ve abone kayıtları dakikada bir taranır; yeni ya da değişen her kayıt için sistem çalışır.</p>
      <Alan etiket="Build projesi"><AcilirSecim deger={t.projeId} set={(v) => set({ ...t, projeId: v })} l={projeler} bos="Proje seç" /></Alan>
      <Alan etiket="Ne olunca">
        <div className="grid grid-cols-2 gap-1.5">{ISLETME_OLAYLARI.map((o) => (
          <button key={o.id} type="button" aria-pressed={t.olay === o.id} onClick={() => { set({ ...t, olay: o.id }); setOnizleme(null); }} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", t.olay === o.id ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
            <span className="block text-[12.5px] font-medium text-white">{o.ad}</span><span className="block text-[11px] leading-snug text-white/45">{o.alt}</span>
          </button>
        ))}</div>
      </Alan>
      <button type="button" onClick={oku} disabled={gidiyor || !t.projeId} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}Şimdi oku</button>
      {durum && <p className="text-[12px] text-white/50">{durum.hata ? <span className="text-rose-300">Son tarama başarısız: {durum.hata}</span> : <>Son tarama {gorece(durum.son)} · şimdiye kadar {durum.yeni ?? 0} çalışma</>}</p>}
      {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      {onizleme && <OnizlemeListesi o={onizleme} testVerisi={testVerisi} />}
    </div>
  );
}

/** Web kancası: imza doğrulaması ve yanıt modu. */
export function KancaImzaAyari({ t, set }: { t: Extract<Tetikleyici, { tur: "webhook" }>; set: (t: Tetikleyici) => void }) {
  const dg = useContext(DegiskenBaglam);
  const k = kancaImzaBul(t.imza);
  const sirVar = k ? dg.sirlar.some((x) => x.ad === k.sir) : false;
  return (
    <div className="space-y-3">
      <Alan etiket="İmza doğrulaması" ipucu="Servis web kancasını imzalıyorsa seç; imzası tutmayan istek 401 alır ve çalışmaz.">
        <AcilirSecim deger={t.imza ?? "_yok"} set={(v) => set({ ...t, imza: v === "_yok" ? undefined : v, imzaBaslik: v === "ozel" ? t.imzaBaslik ?? "X-Signature" : undefined })} l={[{ id: "_yok", ad: "Doğrulama yok", alt: "Adresi bilen herkes gönderebilir" }, ...KANCA_IMZALARI.map((x) => ({ id: x.id, ad: x.ad, alt: x.baslik, gorsel: x.logo || undefined }))]} />
      </Alan>
      {k && (
        <div className={cn("space-y-2 rounded-[14px] px-3.5 py-2.5 ring-1 ring-inset", sirVar ? "bg-emerald-400/[0.04] ring-emerald-300/15" : "bg-amber-400/[0.05] ring-amber-300/20")}>
          <p className="flex items-center gap-2 text-[12.5px] text-white/85"><ShieldCheck className="h-3.5 w-3.5" />Gizli anahtar sırrı <span className="sc-kod text-[11.5px] text-white/60">{k.sir}</span><span className={cn("ml-auto h-2 w-2 rounded-full", sirVar ? "bg-emerald-300" : "bg-amber-300")} aria-label={sirVar ? "Var" : "Eksik"} /></p>
          <p className="text-[11.5px] leading-relaxed text-white/45">{k.nasil}</p>
          {!sirVar && dg.yonet && <button type="button" onClick={dg.yonet} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><KeyRound className="h-3.5 w-3.5" />Sırrı ekle</button>}
          {t.imza === "ozel" && <input value={t.imzaBaslik ?? ""} onChange={(e) => set({ ...t, imzaBaslik: e.target.value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 60) || undefined })} placeholder="İmza başlığı, ör. X-Signature" aria-label="İmza başlığı" className={cn(alanSinif, "sc-kod h-9 text-[12.5px]")} />}
        </div>
      )}
      <Alan etiket="Çağırana ne dönsün">
        <AcilirSecim deger={t.yanitModu ?? "hemen"} set={(v) => set({ ...t, yanitModu: v === "bitince" ? "bitince" : undefined })} l={[{ id: "hemen", ad: "Hemen kabul", alt: "Akış arka planda çalışır; yanıt metni ya da kabul JSON'u döner" }, { id: "bitince", ad: "Akış bitince", alt: "En çok 25 saniye bekler; Yanıt ver adımı ya da son adımın çıktısı döner" }]} />
      </Alan>
    </div>
  );
}
