"use client";

import { PaylasimKarti, SeoDenetimi } from "./SeoDenetimi";
import { GitHubBolumu } from "./GitHubBolumu";
import { AJAN_IZINLERI, type AjanIzinKategori, type AjanIzinSeviye } from "@/lib/build/tipler";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, BookOpen, Check, Eye, EyeOff, Globe, KeyRound, Loader2, Lock, Plus, Search, Settings2, Trash2, X, GitBranch, ShieldCheck, Palette } from "lucide-react";
import { Anahtar } from "@/components/ayarlar/ui";
import { api, ApiHatasi, yayinAdresi } from "@/lib/build/istemci";
import type { Proje, ProjeAyarlar, Sir } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { AlanAdlari } from "./AlanAdlari";
import { TasarimSistemi } from "./TasarimSistemi";
import { Diller } from "./Diller";
import { Languages } from "lucide-react";
import type { ProjeKanca } from "./useProje";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export type AyarBolum = "genel" | "alan" | "seo" | "diller" | "tasarim" | "github" | "talimat" | "izin" | "sir" | "tehlike";
const BOLUMLER: { id: AyarBolum; ad: string; ikon: typeof Globe }[] = [
  { id: "genel", ad: "Genel", ikon: Settings2 }, { id: "alan", ad: "Alan adları", ikon: Globe }, { id: "seo", ad: "Arama ve paylaşım", ikon: Search }, { id: "diller", ad: "Diller", ikon: Languages }, { id: "tasarim", ad: "Tasarım sistemi", ikon: Palette }, { id: "github", ad: "GitHub", ikon: GitBranch }, { id: "izin", ad: "Ajan izinleri", ikon: ShieldCheck },
  { id: "talimat", ad: "Ajan talimatları", ikon: BookOpen }, { id: "sir", ad: "Ortam değişkenleri", ikon: KeyRound }, { id: "tehlike", ad: "Tehlikeli bölge", ikon: AlertTriangle },
];
/** Üretim yayın alanı (ör. vayra.app); yoksa bu sunucudaki /b/ yolu. */
const ALAN = process.env.NEXT_PUBLIC_BUILD_ALAN;
const alan = "h-10 w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-[box-shadow] placeholder:text-white/30 focus:ring-[#55d6fd]/60";

function Kart({ baslik, aciklama, children, sag }: { baslik: string; aciklama?: string; children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h3 className="text-[14px] font-semibold text-white">{baslik}</h3>{aciklama && <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{aciklama}</p>}</div>{sag}
      </div>
      {children}
    </section>
  );
}

/** Kaydet düğmesi: değişiklik varsa etkin, kayıtta onay işareti. */
function KaydetDugmesi({ kirli, kaydet }: { kirli: boolean; kaydet: () => Promise<void> }) {
  const [d, setD] = useState<"" | "k" | "ok" | string>("");
  return (
    <span className="flex items-center gap-2">
      {d && d !== "k" && d !== "ok" && <span className="text-[12px] text-rose-300">{d}</span>}
      <button type="button" disabled={!kirli || d === "k"} onClick={async () => { setD("k"); try { await kaydet(); setD("ok"); setTimeout(() => setD(""), 1500); } catch (e) { setD(e instanceof Error ? e.message : "Kaydedilemedi"); } }}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-30">
        {d === "k" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : d === "ok" ? <Check className="h-3.5 w-3.5" /> : null}{d === "ok" ? "Kaydedildi" : "Kaydet"}
      </button>
    </span>
  );
}

function Genel({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [ad, setAd] = useState(p.ad);
  const [altAlan, setAltAlan] = useState(p.ayarlar.altAlan);
  const [gor, setGor] = useState(p.ayarlar.gorunurluk);
  const [sifre, setSifre] = useState(p.ayarlar.sifre ?? "");
  const [sifreGoster, setSifreGoster] = useState(false);
  const kirli = ad !== p.ad || altAlan !== p.ayarlar.altAlan || gor !== p.ayarlar.gorunurluk || sifre !== (p.ayarlar.sifre ?? "");
  return (
    <div className="space-y-4">
      <Kart baslik="Proje" sag={<KaydetDugmesi kirli={kirli} kaydet={async () => {
        if (gor === "sifreli" && sifre.length < 4) throw new Error("Şifre en az 4 karakter olmalı");
        await k.guncelle({ ad, ayarlar: { altAlan, gorunurluk: gor, sifre } });
      }} />}>
        <label className="block text-[12.5px] text-white/55">Proje adı<input value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} className={cn(alan, "mt-1.5")} /></label>
        <label className="mt-3 block text-[12.5px] text-white/55">Ücretsiz yayın adresi
          <span className="mt-1.5 flex h-10 items-center overflow-hidden rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-[#55d6fd]/60">
            {!ALAN && <span className="whitespace-nowrap pl-3.5 text-[14px] text-white/40">{typeof location !== "undefined" ? location.host : ""}/b/</span>}
            <input value={altAlan} onChange={(e) => setAltAlan(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={40} className={cn("h-full min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none", ALAN ? "pl-3.5" : "pl-0.5")} />
            {ALAN && <span className="pr-3.5 text-[14px] text-white/40">.{ALAN}</span>}
          </span>
          <span className="mt-1 block text-[11.5px] text-white/35">Küçük harf, rakam ve tire. Adresi değiştirirsen eski adres çalışmaz.</span>
        </label>
      </Kart>
      <Kart baslik="Kimler görebilir" aciklama="Şifreli yayında ziyaretçi, tarayıcının giriş penceresine şifreyi yazar (kullanıcı adı önemsiz).">
        <LayoutGroup id="gorunurluk">
          <div className="grid grid-cols-2 gap-2">
            {([["herkes", Globe, "Herkes", "Bağlantıyı bilen herkes açar"], ["sifreli", Lock, "Şifreli", "Yalnız şifreyi bilenler"]] as const).map(([id, I, a, alt]) => (
              <button key={id} type="button" onClick={() => setGor(id)} className={cn("rounded-[14px] p-3 text-left ring-1 ring-inset transition-[box-shadow,background-color]", gor === id ? "bg-white/[0.07] ring-white/80" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.05]")}>
                <I className="h-4 w-4 text-white/70" /><p className="mt-2 text-[13.5px] text-white">{a}</p><p className="text-[12px] text-white/45">{alt}</p>
              </button>
            ))}
          </div>
        </LayoutGroup>
        {gor === "sifreli" && (
          <span className="mt-3 flex h-10 items-center overflow-hidden rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-[#55d6fd]/60">
            <input type={sifreGoster ? "text" : "password"} value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="Site şifresi" maxLength={64} className="h-full min-w-0 flex-1 bg-transparent pl-3.5 text-[14px] text-white outline-none placeholder:text-white/30" />
            <button type="button" onClick={() => setSifreGoster((x) => !x)} className="flex h-10 w-10 items-center justify-center text-white/45 hover:text-white">{sifreGoster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </span>
        )}
      </Kart>
      <Kart baslik="Vayra rozeti" aciklama="Yayındaki sitenin köşesinde küçük bir &quot;Vayra Build ile yapıldı&quot; bağlantısı.">
        <label className="flex items-center gap-2.5 text-[13px] text-white/75"><Anahtar acik={p.ayarlar.rozet} onDegis={(v) => k.guncelle({ ayarlar: { rozet: v } })} etiket="Rozet" kayit={false} />Rozeti göster</label>
      </Kart>
    </div>
  );
}

function Seo({ k, ajanaGonder }: { k: ProjeKanca; ajanaGonder?: (metin: string) => void }) {
  const p = k.proje as Proje;
  const [s, setS] = useState(p.ayarlar.seo);
  const kirli = JSON.stringify(s) !== JSON.stringify(p.ayarlar.seo);
  return (
    <div className="space-y-4">
      <Kart baslik="Arama ve sosyal medya" aciklama="Google sonuçlarında ve bağlantı paylaşıldığında görünen bilgiler." sag={<KaydetDugmesi kirli={kirli} kaydet={async () => { await k.guncelle({ ayarlar: { seo: s } }); }} />}>
        <label className="block text-[12.5px] text-white/55"><span className="flex justify-between">Başlık<span className={cn("tabular-nums", s.baslik.length > 60 ? "text-amber-300" : "text-white/35")}>{s.baslik.length} / 60</span></span><input value={s.baslik} maxLength={70} onChange={(e) => setS({ ...s, baslik: e.target.value })} className={cn(alan, "mt-1.5")} /></label>
        <label className="mt-3 block text-[12.5px] text-white/55"><span className="flex justify-between">Açıklama<span className={cn("tabular-nums", s.aciklama.length > 155 ? "text-amber-300" : "text-white/35")}>{s.aciklama.length} / 155</span></span><textarea value={s.aciklama} maxLength={170} rows={3} onChange={(e) => setS({ ...s, aciklama: e.target.value })} className={cn(alan, "mt-1.5 h-auto resize-none py-2.5")} /></label>
        <label className="mt-3 block text-[12.5px] text-white/55">Paylaşım görseli adresi<input value={s.ogGorsel ?? ""} onChange={(e) => setS({ ...s, ogGorsel: e.target.value })} placeholder="https://… ya da /gercek/… (1200 × 630 önerilir)" className={cn(alan, "mt-1.5")} /></label>
        <label className="mt-3 flex items-center gap-2.5 text-[13px] text-white/75"><Anahtar acik={s.indeks} onDegis={(v) => setS({ ...s, indeks: v })} etiket="Arama motorları" kayit={false} />Arama motorları siteyi listeleyebilsin</label>
      </Kart>
      <Kart baslik="Önizleme" aciklama="Google sonucunda ve bağlantı paylaşıldığında böyle görünür.">
        <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="rounded-[14px] bg-white p-4">
          <p className="text-[12px] text-[#202124]">{p.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad ?? yayinAdresi(p.ayarlar.altAlan).gorunen}</p>
          <p className="mt-0.5 truncate text-[18px] text-[#1a0dab]">{s.baslik || p.ad}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-[#4d5156]">{s.aciklama || "Açıklama yazılmadı; arama motoru sayfadan bir parça seçer."}</p>
        </div>
        <PaylasimKarti baslik={s.baslik || p.ad} aciklama={s.aciklama} gorsel={s.ogGorsel || p.kapak} alan={p.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad ?? yayinAdresi(p.ayarlar.altAlan).gorunen} />
        </div>
      </Kart>
      <SeoDenetimi p={p} ajanaGonder={ajanaGonder} />
    </div>
  );
}

/** Ajan izinleri: her yetenek için her zaman, sor ya da asla. Sor seçilince ajan durup sohbette izin kartı gösterir. */
function AjanIzinleri({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [l, setL] = useState(p.ayarlar.ajanIzinleri ?? {});
  useEffect(() => setL(p.ayarlar.ajanIzinleri ?? {}), [p.ayarlar.ajanIzinleri]);
  const degis = async (id: AjanIzinKategori, v: AjanIzinSeviye) => { const y = { ...l, [id]: v }; setL(y); await k.guncelle({ ayarlar: { ajanIzinleri: y } }).catch(() => {}); };
  return (
    <Kart baslik="Ajan izinleri" aciklama="Ajanın bu projede neyi kendiliğinden yapabileceğini seç. Sor seçersen ajan durur, sohbette izin ister; Her zaman izin ver dersen bir daha sormaz.">
      <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
        {AJAN_IZINLERI.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
            <span className="min-w-0 flex-1 basis-[220px]"><span className="block text-[13.5px] text-white">{x.ad}</span><span className="block text-[12px] text-white/45">{x.alt}</span></span>
            <Secici id={`izin-${x.id}`} kucuk deger={l[x.id] ?? "her-zaman"} set={(v) => degis(x.id, v)} l={[{ id: "her-zaman" as const, ad: "Her zaman" }, { id: "sor" as const, ad: "Sor" }, { id: "asla" as const, ad: "Asla" }]} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-white/40">Dosya yazma ve düzenleme her zaman açıktır; istemediğin bir değişikliği Geçmiş&apos;ten tek tıkla geri alırsın.</p>
    </Kart>
  );
}

function Talimat({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [t, setT] = useState(p.ayarlar.talimat);
  const [notlar, setNotlar] = useState(p.ayarlar.hafiza ?? []);
  const [yeniNot, setYeniNot] = useState("");
  useEffect(() => setNotlar(p.ayarlar.hafiza ?? []), [p.ayarlar.hafiza]);
  const notKaydet = async (l: typeof notlar) => { setNotlar(l); await k.guncelle({ ayarlar: { hafiza: l } }).catch(() => {}); };
  return (
    <div className="space-y-4">
    <Kart baslik="Ajan talimatları" aciklama="Ajan her istekte bunları okur: marka sesi, renkler, kurallar, kaçınılacaklar; &quot;Hep resmî dil kullan, ana renk lacivert, fiyatları TL yaz&quot; gibi." sag={<KaydetDugmesi kirli={t !== p.ayarlar.talimat} kaydet={async () => { await k.guncelle({ ayarlar: { talimat: t } }); }} />}>
      <textarea value={t} onChange={(e) => setT(e.target.value)} rows={12} maxLength={10000} placeholder="Bu proje için kalıcı talimatlar…" className={cn(alan, "h-auto resize-y py-3 leading-relaxed")} />
      <p className="mt-1.5 text-right text-[11.5px] tabular-nums text-white/35">{t.length.toLocaleString("tr-TR")} / 10.000</p>
    </Kart>
    <Kart baslik="Ajanın notları" aciklama="Konuşurken öğrendiği kalıcı tercihler. Ajan her istekte bunlara uyar; yanlış olanı sil, eksik olanı ekle.">
      {notlar.length ? (
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {notlar.map((n) => (
            <li key={n.id} className="group flex items-start gap-3 px-3.5 py-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" />
              <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/85">{n.metin}</span>
              <span className="shrink-0 pt-0.5 text-[11.5px] text-white/35">{new Date(n.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
              <button type="button" aria-label="Notu sil" onClick={() => notKaydet(notlar.filter((x) => x.id !== n.id))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[13px] text-white/50 ring-1 ring-inset ring-white/[0.06]">Henüz not yok. &quot;Bundan sonra hep resmî dil kullan&quot; gibi bir şey söylediğinde ajan burada not alır.</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (yeniNot.trim()) { notKaydet([...notlar, { id: Math.random().toString(36).slice(2, 10), metin: yeniNot.trim().slice(0, 300), zaman: Date.now() }]); setYeniNot(""); } }} className="mt-3 flex gap-2">
        <input value={yeniNot} onChange={(e) => setYeniNot(e.target.value)} maxLength={300} placeholder="Yeni not: fiyatları her zaman TL ve KDV dahil yaz" className={cn(alan, "flex-1")} />
        <button disabled={!yeniNot.trim()} className="inline-flex h-11 shrink-0 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-35">Ekle</button>
      </form>
    </Kart>
    </div>
  );
}

export function Sirlar({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [l, setL] = useState<Sir[]>(p.ayarlar.sirlar);
  const [goster, setGoster] = useState<Set<number>>(new Set());
  const kirli = JSON.stringify(l) !== JSON.stringify(p.ayarlar.sirlar);
  const gecersiz = l.some((s) => !/^[A-Z][A-Z0-9_]{1,40}$/.test(s.ad));
  return (
    <Kart baslik="Ortam değişkenleri" aciklama="Harita, analitik ya da ödeme servislerinin herkese açık anahtarları. Sitede window.VAYRA_ENV.AD olarak okunur; ajan adlarını bilir, değerlerini görmez. Bu değerler ziyaretçinin tarayıcısında görünür: şifre ya da gizli anahtar koyma."
      sag={<KaydetDugmesi kirli={kirli && !gecersiz} kaydet={async () => { await k.guncelle({ ayarlar: { sirlar: l } as Partial<ProjeAyarlar> }); }} />}>
      <div className="space-y-2">
        {l.map((s, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] items-center gap-2 max-sm:grid-cols-[minmax(0,1fr)_auto]">
            <input value={s.ad} onChange={(e) => setL(l.map((x, j) => (j === i ? { ...x, ad: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") } : x)))} placeholder="AD" className={cn(alan, "font-mono text-[13px]", s.ad && !/^[A-Z][A-Z0-9_]{1,40}$/.test(s.ad) && "ring-rose-400/50")} />
            <span className="flex h-10 items-center overflow-hidden rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] max-sm:col-span-2 max-sm:row-start-2">
              <input type={goster.has(i) ? "text" : "password"} value={s.deger} onChange={(e) => setL(l.map((x, j) => (j === i ? { ...x, deger: e.target.value } : x)))} placeholder="değer" className="h-full min-w-0 flex-1 bg-transparent pl-3.5 font-mono text-[13px] text-white outline-none" />
              <button type="button" onClick={() => setGoster((g) => { const y = new Set(g); if (y.has(i)) y.delete(i); else y.add(i); return y; })} className="flex h-10 w-9 items-center justify-center text-white/40 hover:text-white">{goster.has(i) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </span>
            <button type="button" onClick={() => setL(l.filter((_, j) => j !== i))} aria-label="Sil" className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/40 hover:bg-white/[0.05] hover:text-rose-200"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setL([...l, { ad: "", deger: "", gorunurluk: "herkese" }])} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Değişken ekle</button>
      </div>
    </Kart>
  );
}

function Tehlike({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const router = useRouter();
  const [onay, setOnay] = useState("");
  const [d, setD] = useState<"" | "kaldir" | "sil">("");
  const [hata, setHata] = useState("");
  return (
    <div className="space-y-4">
      {p.yayin && (
        <Kart baslik="Yayından kaldır" aciklama="Site ve bağlı alan adları kapanır; ziyaretçiler &quot;yayında değil&quot; sayfası görür. Proje ve sürümler silinmez, istediğin an yeniden yayınlarsın.">
          <button type="button" disabled={d === "kaldir"} onClick={async () => { setD("kaldir"); try { await api(`/api/build/yayinla/${p.id}`, { method: "DELETE" }); await k.yukle(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Olmadı"); } setD(""); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500/12 px-4 text-[13px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/25 hover:bg-rose-500/20 disabled:opacity-50">{d === "kaldir" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Yayından kaldır</button>
        </Kart>
      )}
      <Kart baslik="Projeyi sil" aciklama="Proje çöp kutusuna taşınır ve yayındaki site hemen kapanır. 30 gün içinde Projeler sayfasındaki Çöp kutusundan geri alabilirsin; sonra dosyalar, sürümler, sohbet, veritabanı ve form gönderimleri kalıcı olarak silinir.">
        <label className="block text-[12.5px] text-white/55">Onaylamak için proje adını yaz: <span className="font-semibold text-white/85">{p.ad}</span><input value={onay} onChange={(e) => setOnay(e.target.value)} className={cn(alan, "mt-1.5")} /></label>
        <button type="button" disabled={onay !== p.ad || d === "sil"} onClick={async () => { setD("sil"); try { await api(`/api/build/proje/${p.id}`, { method: "DELETE" }); router.push("/panel/build/projeler"); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Silinemedi"); setD(""); } }}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[13px] font-semibold text-white disabled:opacity-30">{d === "sil" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Projeyi sil</button>
        {hata && <p className="mt-2 text-[12.5px] text-rose-300">{hata}</p>}
      </Kart>
    </div>
  );
}

/** Ayarlar sekmesi: solda bölüm listesi, sağda içerik. */
export function AyarlarSekme({ k, bolum, setBolum, ajanaGonder }: { k: ProjeKanca; bolum: AyarBolum; setBolum: (b: AyarBolum) => void; ajanaGonder?: (metin: string) => void }) {
  useEffect(() => { document.getElementById("build-ayar-icerik")?.scrollTo({ top: 0 }); }, [bolum]);
  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <LayoutGroup id="ayar-bolum">
        <nav className="w-[210px] shrink-0 space-y-0.5 border-r border-white/[0.06] p-2 max-md:flex max-md:w-full max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto max-md:border-b max-md:border-r-0 [scrollbar-width:none]">
          {BOLUMLER.map((b) => (
            <button key={b.id} type="button" onClick={() => setBolum(b.id)} className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left text-[13px] transition-colors max-md:w-auto max-md:shrink-0 max-md:whitespace-nowrap", bolum === b.id ? "text-white" : "text-white/55 hover:text-white", b.id === "tehlike" && bolum !== b.id && "text-rose-300/70")}>
              {bolum === b.id && <motion.span layoutId="ayar-z" transition={yay} className="absolute inset-0 rounded-[11px] bg-white/[0.08]" />}
              <b.ikon className="relative h-4 w-4 shrink-0" /><span className="relative">{b.ad}</span>
            </button>
          ))}
        </nav>
      </LayoutGroup>
      <div id="build-ayar-icerik" className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
        <div className="mx-auto max-w-[760px]">
          {k.saltOkunur && <p className="mb-4 rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]">İzleyici olarak ayarları görebilirsin; değiştiremez ve kaydedemezsin.</p>}
          {/* İzleyicide bütün denetimler kapalı (sunucu da engeller). */}
          <fieldset disabled={k.saltOkunur} className="m-0 min-w-0 border-0 p-0">
          {bolum === "genel" && <Genel k={k} />}
          {bolum === "alan" && <AlanAdlari k={k} />}
          {bolum === "seo" && <Seo k={k} ajanaGonder={ajanaGonder} />}
          {bolum === "diller" && <Diller k={k} ajanaGonder={ajanaGonder} />}
          {bolum === "tasarim" && <TasarimSistemi k={k} />}
          {bolum === "github" && <GitHubBolumu k={k} />}
          {bolum === "izin" && <AjanIzinleri k={k} />}
          {bolum === "talimat" && <Talimat k={k} />}
          {bolum === "sir" && <Sirlar k={k} />}
          {bolum === "tehlike" && <Tehlike k={k} />}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
