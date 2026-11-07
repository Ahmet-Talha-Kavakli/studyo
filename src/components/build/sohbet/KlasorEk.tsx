"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpenText, Brain, ChevronDown, Eye, FileText, Folders, History, Loader2, Mail, MessageSquare, PenLine, Plus, RotateCcw, Search, Trash2, UserMinus, UserPlus, Users, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Acilir, MenuSatir, SagPanel, Secici, alanSinif, boyutYaz, sayi, useAcilir } from "./ortak";

/**
 * Klasör derinliği (v5; ChatGPT ve Claude Projects seviyesi): klasör belleği kipleri ve kayıtları, talimat
 * şablonları ve talimat geçmişi, dosya önizleme ve not ekleme, klasör içinde arama, ekip (e-postayla davet,
 * izleyici ya da düzenleyici) ve seninle paylaşılan klasörler.
 */
export type Uye = { eposta: string; rol: "izleyici" | "duzenleyici"; zaman: number; sonGorulme?: number; epostaDurumu?: string };
type Kayit = { id: string; metin: string; zaman: number; kaynak?: { sohbet: string; baslik: string } };

export const TALIMAT_SABLONLARI: { id: string; ad: string; alt: string; talimat: string }[] = [
  { id: "akademik", ad: "Akademik yazım", alt: "Tez, makale, kaynakça", talimat: "Akademik bir dille ve nesnel yaz. İddiaları kaynakla destekle, kaynakları APA 7 biçiminde ver. Belirsiz olduğun yerde bunu belirt. Paragrafları kısa tut, terimleri ilk geçtiği yerde tanımla. Bu klasördeki dosyalar çalışmanın ana kaynaklarıdır; önce onlara dayan." },
  { id: "kod", ad: "Yazılım projesi", alt: "Kod incelemesi, mimari", talimat: "Kıdemli bir yazılım geliştirici gibi davran. Kod önerirken TypeScript ve modern en iyi uygulamaları kullan, değişikliği gerekçesiyle açıkla, güvenlik ve performans risklerini belirt. Uzun kodları tuvalde yaz. Projenin dosyalarındaki adlandırma ve yapıya uy." },
  { id: "pazarlama", ad: "Marka ve pazarlama", alt: "Ton, kampanya, içerik", talimat: "Markanın sesini koru: sıcak, net, abartısız. Hedef kitle Türkiye'deki 25 ile 40 yaş arası kentli profesyoneller. Her içerikte bir kanca cümlesi, fayda ve tek bir eylem çağrısı olsun. Rakamları uydurma; dosyalardaki verileri kullan." },
  { id: "hukuk", ad: "Hukuki inceleme", alt: "Sözleşme, risk listesi", talimat: "Türk hukukuna göre değerlendir. Sözleşmeleri madde madde incele, riskli hükümleri ve eksikleri listele, ilgili kanun maddesine atıf yap. Kesin hukuki görüş vermediğini ve bir avukata danışılması gerektiğini kısaca belirt." },
  { id: "musteri", ad: "Müşteri desteği", alt: "Yanıt taslakları", talimat: "Müşteri temsilcisi gibi yanıt taslakları hazırla: nazik, kısa, çözüm odaklı. Önce sorunu özetle, sonra adımları ver. Politika ve fiyatları yalnız bu klasördeki belgelerden al; bilmediğin bir şey için söz verme." },
  { id: "ogrenme", ad: "Ders çalışma", alt: "Konu anlatımı ve testler", talimat: "Sabırlı bir öğretmen gibi anlat. Konuyu küçük adımlara böl, örnek ver, her adımdan sonra kısa bir soru sor. Dosyalardaki ders notlarını temel al; sonunda bilgi kartları ya da kısa bir test öner." },
  { id: "arastirma", ad: "Pazar araştırması", alt: "Rakip, trend, tablo", talimat: "Analist gibi çalış: verileri tabloyla karşılaştır, kaynakları göster, varsayımları ayrı yaz. Türkiye pazarını öne al. Sonuçta üç maddelik öneri ve bir risk listesi ver." },
  { id: "toplanti", ad: "Toplantı notları", alt: "Özet, karar, eylem", talimat: "Toplantı dökümlerini ve notları özetle: kısa özet, alınan kararlar, sorumlusu ve tarihiyle eylem maddeleri. Belirsiz kalan konuları ayrı listele. Kişi adlarını dökümde geçtiği gibi kullan." },
];

/** Klasör belleği: kip seçimi ve klasöre özel kayıtlar. */
export function KlasorBellekKarti({ mod, kayitlar, yama, duzenleyebilir, sahip }: { mod: "hesap" | "klasor" | "kapali"; kayitlar: Kayit[]; yama: (g: Record<string, unknown>) => Promise<unknown>; duzenleyebilir: boolean; sahip: boolean }) {
  const [yeni, setYeni] = useState("");
  return (
    <Kart ikon={Brain} baslik="Bellek" alt={mod === "klasor" ? "Yalnız bu klasörün belleği kullanılır; hesap belleği görülmez" : mod === "hesap" ? "Hesap belleğin bu klasörde de kullanılır" : "Bu klasörde bellek kapalı"} govde="">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        {sahip ? <Secici id="klasor-bellek" kucuk deger={mod} set={(v) => yama({ bellekModu: v })} l={[{ id: "hesap", ad: "Hesap belleği" }, { id: "klasor", ad: "Yalnız klasör" }, { id: "kapali", ad: "Kapalı" }]} />
          : <span className="text-[12.5px] text-white/55">{mod === "klasor" ? "Klasör belleği" : mod === "hesap" ? "Hesap belleği" : "Bellek kapalı"} (sahibi seçer)</span>}
      </div>
      {mod === "klasor" && <>
        {duzenleyebilir && <form onSubmit={async (e) => { e.preventDefault(); if (!yeni.trim()) return; await yama({ kayitEkle: yeni }); setYeni(""); }} className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <input value={yeni} onChange={(e) => setYeni(e.target.value)} maxLength={400} placeholder="Bu klasörde hatırlanacak bir şey" className={cn(alanSinif, "h-9 flex-1 text-[13px]")} />
          <button type="submit" disabled={!yeni.trim()} aria-label="Ekle" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"><Plus className="h-4 w-4" /></button>
        </form>}
        {kayitlar.length ? <ul className="max-h-[260px] divide-y divide-white/[0.05] overflow-y-auto [scrollbar-width:thin]">
          {[...kayitlar].reverse().map((k) => <li key={k.id} className="group flex items-start gap-2.5 px-4 py-2.5"><Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span className="min-w-0 flex-1"><span className="block text-[13px] text-white/85">{k.metin}</span><span className="block text-[11.5px] text-white/40">{gorece(k.zaman)}{k.kaynak ? ` · ${k.kaynak.baslik}` : ""}</span></span>{duzenleyebilir && <button type="button" onClick={() => yama({ kayitSil: k.id })} aria-label="Kaydı sil" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 opacity-0 hover:bg-white/[0.06] hover:text-rose-300 group-hover:opacity-100 max-sm:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}</li>)}
        </ul> : <p className="px-4 py-3 text-[12.5px] text-white/50">Henüz kayıt yok. Sohbetlerde &quot;bunu hatırla&quot; dediğinde ya da yukarıdan eklediğinde burada görünür.</p>}
      </>}
    </Kart>
  );
}

/** Talimat şablonları paneli (Özel: boş talimatla kendin yaz). */
export function SablonPaneli({ acik, kapat, sec }: { acik: boolean; kapat: () => void; sec: (s: { id: string; talimat: string }) => void }) {
  const [bak, setBak] = useState<string | null>(null);
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Talimat şablonları" alt="Birini seç, sonra dilediğin gibi düzenle" ikon={<BookOpenText className="h-[18px] w-[18px]" />} genislik={560}>
      <div className="grid gap-2 sm:grid-cols-2">
        {TALIMAT_SABLONLARI.map((s) => (
          <div key={s.id} className={cn("rounded-[16px] bg-white/[0.035] p-3.5 ring-1 ring-inset transition-colors", bak === s.id ? "ring-2 ring-white" : "ring-white/[0.07]")}>
            <button type="button" onClick={() => setBak(bak === s.id ? null : s.id)} className="flex w-full items-start gap-2 text-left">
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-white">{s.ad}</span><span className="block text-[12px] text-white/50">{s.alt}</span></span>
              <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-white/40 transition-transform", bak === s.id && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>{bak === s.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="mt-2 text-[12.5px] leading-relaxed text-white/70">{s.talimat}</p><button type="button" onClick={() => { sec(s); kapat(); }} className="mt-2.5 inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Bu şablonu kullan</button></motion.div>}</AnimatePresence>
          </div>
        ))}
        <button type="button" onClick={() => { sec({ id: "ozel", talimat: "" }); kapat(); }} className="flex flex-col items-start rounded-[16px] bg-white/[0.02] p-3.5 text-left ring-1 ring-inset ring-dashed ring-white/[0.12] hover:bg-white/[0.05]"><span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white"><PenLine className="h-3.5 w-3.5" />Özel</span><span className="text-[12px] text-white/50">Boş talimatla başla, kendin yaz</span></button>
      </div>
    </SagPanel>
  );
}

/** Talimatın önceki hâlleri ve geri yükleme. */
export function TalimatGecmisPaneli({ acik, kapat, surumler, simdiki, geriYukle }: { acik: boolean; kapat: () => void; surumler: { id: string; zaman: number; talimat: string }[]; simdiki: string; geriYukle: (id: string) => void }) {
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Talimat geçmişi" alt={`${surumler.length} önceki sürüm`} ikon={<History className="h-[18px] w-[18px]" />} genislik={540}>
      {!surumler.length ? <p className="text-[13px] text-white/55">Henüz önceki sürüm yok. Talimatı değiştirdiğinde eski hâli burada saklanır.</p> : (
        <div className="space-y-2.5">
          {surumler.map((v) => (
            <div key={v.id} className="rounded-[16px] bg-white/[0.035] p-3.5 ring-1 ring-inset ring-white/[0.07]">
              <div className="mb-1.5 flex items-center gap-2"><span className="text-[12.5px] text-white/55">{new Date(v.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span><span className="ml-auto" /><button type="button" disabled={v.talimat === simdiki} onClick={() => geriYukle(v.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-30"><RotateCcw className="h-3.5 w-3.5" />Geri yükle</button></div>
              <p className="line-clamp-6 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/75">{v.talimat}</p>
            </div>
          ))}
        </div>
      )}
    </SagPanel>
  );
}

/** Dosya önizleme (klasör bilgisinin tam metni). */
export function DosyaOnizleme({ kid, q, dosya, kapat }: { kid: string; q: string; dosya: { id: string; ad: string; tur: string; boyut: number; ekleyen?: string } | null; kapat: () => void }) {
  const [icerik, setIcerik] = useState<string | null>(null);
  useEffect(() => { if (!dosya) return; setIcerik(null); api<{ dosya: { icerik: string } }>(`/api/build/sohbet/klasor/${kid}/dosya?dosya=${dosya.id}${q.replace("?", "&")}`).then((v) => setIcerik(v.dosya.icerik)).catch(() => setIcerik("")); }, [dosya, kid, q]);
  return (
    <SagPanel acik={!!dosya} kapat={kapat} baslik={dosya?.ad ?? ""} alt={dosya ? `${dosya.tur === "pdf" ? "PDF" : dosya.tur === "ofis" ? "Office belgesi" : dosya.tur === "not" ? "Not" : "Metin"} · ${boyutYaz(dosya.boyut) || `${sayi(dosya.boyut)} karakter`}${dosya.ekleyen ? ` · ${dosya.ekleyen} ekledi` : ""}` : ""} ikon={<FileText className="h-[18px] w-[18px]" />} genislik={640}>
      {icerik === null ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <pre className="whitespace-pre-wrap break-words font-sans text-[13.5px] leading-relaxed text-white/80">{icerik || "İçerik okunamadı."}</pre>}
    </SagPanel>
  );
}

/** Klasöre metin notu ekleme satırı. */
export function NotEkle({ ekle }: { ekle: (ad: string, metin: string) => Promise<void> }) {
  const [acik, setAcik] = useState(false);
  const [ad, setAd] = useState("");
  const [metin, setMetin] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  if (!acik) return <button type="button" onClick={() => setAcik(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.14]"><PenLine className="h-3.5 w-3.5" /><span className="max-sm:hidden">Not</span></button>;
  return (
    <SagPanel acik={acik} kapat={() => setAcik(false)} baslik="Not ekle" alt="Klasörün bilgisine metin olarak eklenir" ikon={<PenLine className="h-[18px] w-[18px]" />} genislik={520}
      alt2={<><span className="ml-auto" /><button type="button" onClick={() => setAcik(false)} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button><button type="button" disabled={!metin.trim() || gidiyor} onClick={async () => { setGidiyor(true); try { await ekle(ad.trim() || "Not", metin); setAcik(false); setAd(""); setMetin(""); } finally { setGidiyor(false); } }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-30">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}Ekle</button></>}>
      <div className="space-y-3">
        <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={120} placeholder="Başlık (ör. Fiyat listesi 2026)" className={cn(alanSinif, "h-11")} />
        <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={12} placeholder="Notun metni" className={cn(alanSinif, "resize-y py-3 leading-relaxed")} />
      </div>
    </SagPanel>
  );
}

type AramaSonucu = { sohbetler: { id: string; baslik: string; guncelleme: number; eslesmeler: { mesajId: string; parca: string }[] }[]; dosyalar: { id: string; ad: string; tur: string; parcalar: string[] }[]; bellek: { id: string; metin: string }[]; talimat: string[] };
/** Klasör içinde arama kutusu ve sonuçları. */
export function KlasorArama({ kid, q, dosyaAc, sonucVar }: { kid: string; q: string; dosyaAc: (id: string) => void; sonucVar: (v: boolean) => void }) {
  const [sorgu, setSorgu] = useState("");
  const [s, setS] = useState<AramaSonucu | null>(null);
  const [yuk, setYuk] = useState(false);
  const zaman = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(zaman.current);
    if (sorgu.trim().length < 2) { setS(null); sonucVar(false); return; }
    zaman.current = setTimeout(() => { setYuk(true); api<AramaSonucu>(`/api/build/sohbet/klasor/${kid}/ara?q=${encodeURIComponent(sorgu)}${q.replace("?", "&")}`).then((v) => { setS(v); sonucVar(true); }).catch(() => {}).finally(() => setYuk(false)); }, 300);
  }, [sorgu, kid, q, sonucVar]);
  const bos = s && !s.sohbetler.length && !s.dosyalar.length && !s.bellek.length && !s.talimat.length;
  return (
    <div>
      <label className="flex h-10 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
        {yuk ? <Loader2 className="h-4 w-4 animate-spin text-white/45" /> : <Search className="h-4 w-4 text-white/45" />}
        <input value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder="Klasörde ara: sohbetler, dosyalar, bellek" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
        {sorgu && <button type="button" onClick={() => setSorgu("")} aria-label="Temizle" className="text-white/45 hover:text-white"><X className="h-4 w-4" /></button>}
      </label>
      {s && (
        <div className="mt-3 space-y-3">
          {bos && <p className="px-1 text-[13px] text-white/50">&quot;{sorgu}&quot; için bu klasörde sonuç yok.</p>}
          {s.sohbetler.map((x) => (
            <Link key={x.id} href={`/panel/build/sohbet/${x.id}${x.eslesmeler[0] ? `?m=${x.eslesmeler[0].mesajId}` : ""}`} className="block rounded-[16px] bg-white/[0.035] p-3 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]">
              <span className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><MessageSquare className="h-3.5 w-3.5 text-white/45" />{x.baslik}<span className="ml-auto text-[11.5px] font-normal text-white/40">{gorece(x.guncelleme)}</span></span>
              {x.eslesmeler.slice(0, 2).map((m, i) => <span key={i} className="mt-1 block line-clamp-2 text-[12.5px] text-white/60">{m.parca}</span>)}
            </Link>
          ))}
          {s.dosyalar.map((x) => (
            <button key={x.id} type="button" onClick={() => dosyaAc(x.id)} className="block w-full rounded-[16px] bg-white/[0.035] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]">
              <span className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><FileText className="h-3.5 w-3.5 text-[#8be6ff]" />{x.ad}</span>
              {x.parcalar.map((p, i) => <span key={i} className="mt-1 block line-clamp-2 text-[12.5px] text-white/60">{p}</span>)}
            </button>
          ))}
          {s.bellek.map((x) => <p key={x.id} className="flex items-start gap-2 rounded-[14px] bg-white/[0.025] px-3 py-2 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.06]"><Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />{x.metin}</p>)}
          {s.talimat.map((x, i) => <p key={i} className="rounded-[14px] bg-white/[0.025] px-3 py-2 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.06]"><span className="mr-1.5 text-white/45">Talimat:</span>{x}</p>)}
        </div>
      )}
    </div>
  );
}

function RolMenusu({ rol, sec, cikar }: { rol: Uye["rol"]; sec: (r: Uye["rol"]) => void; cikar?: () => void }) {
  const a = useAcilir(260);
  return (
    <div ref={a.kok} className="shrink-0">
      <button type="button" onClick={() => a.setAcik(!a.acik)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.1]">{rol === "duzenleyici" ? "Düzenleyici" : "İzleyici"}<ChevronDown className="h-3.5 w-3.5 text-white/45" /></button>
      <Acilir a={a}>
        <MenuSatir ikon={<Eye className="h-4 w-4" />} ad="İzleyici" alt="Talimat ve dosyaları görür, klasörde sohbet açar" secili={rol === "izleyici"} onClick={() => { a.setAcik(false); sec("izleyici"); }} />
        <MenuSatir ikon={<PenLine className="h-4 w-4" />} ad="Düzenleyici" alt="Talimatı, dosyaları ve belleği de değiştirir" secili={rol === "duzenleyici"} onClick={() => { a.setAcik(false); sec("duzenleyici"); }} />
        {cikar && <><div className="my-1 h-px bg-white/[0.07]" /><MenuSatir tehlike ikon={<UserMinus className="h-4 w-4" />} ad="Ekipten çıkar" onClick={() => { a.setAcik(false); cikar(); }} /></>}
      </Acilir>
    </div>
  );
}

/** Ekip kartı (yalnız sahip): e-postayla davet, rol, çıkarma. */
export function EkipKarti({ kid, ekip: ilk }: { kid: string; ekip: Uye[] }) {
  const [ekip, setEkip] = useState(ilk);
  const [epostalar, setEpostalar] = useState("");
  const [rol, setRol] = useState<Uye["rol"]>("izleyici");
  const [is, setIs] = useState(false);
  const [hata, setHata] = useState("");
  const [epostaKurulu, setEpostaKurulu] = useState(true);
  useEffect(() => setEkip(ilk), [ilk]);
  const gonder = async (g: Record<string, unknown>) => { setIs(true); setHata(""); try { const v = await api<{ ekip: Uye[]; epostaKurulu: boolean }>(`/api/build/sohbet/klasor/${kid}/ekip`, { govde: g }); setEkip(v.ekip); setEpostaKurulu(v.epostaKurulu); return true; } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); return false; } finally { setIs(false); } };
  const liste = epostalar.split(/[\s,;]+/).filter(Boolean);
  return (
    <Kart ikon={Users} baslik={<span className="flex items-center gap-2">Ekip{ekip.length > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/65">{ekip.length}</span>}</span>} alt="Klasörü e-postayla paylaş; üyeler klasörün bağlamıyla sohbet açar" govde="">
      <form onSubmit={async (e) => { e.preventDefault(); if (liste.length && (await gonder({ davet: { epostalar: liste, rol } }))) setEpostalar(""); }} className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] pl-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30"><Mail className="h-4 w-4 shrink-0 text-white/40" /><input value={epostalar} onChange={(e) => setEpostalar(e.target.value)} inputMode="email" name="ekip-eposta" autoComplete="off" placeholder="E-posta adresleri" className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-[13px] text-white outline-none placeholder:text-white/40" /></span>
        <RolMenusu rol={rol} sec={setRol} />
        <button type="submit" disabled={!liste.length || is} aria-label="Davet et" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-30">{is ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}Davet</button>
      </form>
      {hata && <p className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2 text-[12.5px] text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />{hata}</p>}
      {ekip.length ? <ul className="divide-y divide-white/[0.05]">{ekip.map((u) => (
        <li key={u.eposta} className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold text-white">{u.eposta[0]?.toLocaleUpperCase("tr")}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{u.eposta}</span><span className="block truncate text-[11.5px] text-white/45">{u.sonGorulme ? `Son baktı ${gorece(u.sonGorulme)}` : `Eklendi ${gorece(u.zaman)}`}{u.epostaDurumu === "kurulu-degil" ? " · e-posta gitmedi" : u.epostaDurumu === "gonderildi" ? " · e-posta gitti" : ""}</span></span>
          <RolMenusu rol={u.rol} sec={(r) => gonder({ rol: { eposta: u.eposta, rol: r } })} cikar={() => gonder({ cikar: u.eposta })} />
        </li>
      ))}</ul> : <p className="px-4 py-3 text-[12.5px] text-white/50">Henüz kimse yok. Eklediğin kişiler bu e-postayla giriş yapınca klasörü &quot;Seninle paylaşılanlar&quot; altında görür.</p>}
      {!epostaKurulu && <p className="flex items-start gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[12px] text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />E-posta servisi kurulu değil; davet e-postası gitmez. Hesabı olanlar Vayra içinde bildirim alır.</p>}
    </Kart>
  );
}

/** Klasörler sayfasında "Seninle paylaşılanlar" bölümü (oturum gerekir). */
export function PaylasilanKlasorler() {
  const [l, setL] = useState<{ tur: string; id: string; baslik: string; sahipAd: string; rol: string; zaman: number; adres: string }[] | null>(null);
  const [oturum, setOturum] = useState(true);
  useEffect(() => { api<{ oturum: boolean; ogeler: NonNullable<typeof l> }>("/api/build/sohbet/ortak").then((v) => { setOturum(v.oturum); setL(v.ogeler); }).catch(() => setL([])); }, []);
  if (!l || (!l.length && oturum)) return null;
  return (
    <Kart ikon={Users} baslik="Seninle paylaşılanlar" alt={oturum ? "Davet edildiğin klasörler ve sohbetler" : "Paylaşılanları görmek için giriş yap"} govde="">
      {!oturum ? <div className="px-4 py-3"><Link href="/giris?geri=/panel/build/sohbet/klasorler" className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black">Giriş yap</Link></div> : (
        <ul className="divide-y divide-white/[0.05]">{l.map((x) => (
          <li key={`${x.tur}-${x.id}`}><Link href={x.adres} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/80">{x.tur === "klasor" ? <Folders className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{x.baslik}</span><span className="block truncate text-[12px] text-white/50">{x.sahipAd} · {x.tur === "klasor" ? (x.rol === "duzenleyici" ? "Düzenleyici" : "İzleyici") : x.rol === "yorum" ? "Yorum yapabilirsin" : "Görüntüleyebilirsin"} · {gorece(x.zaman)}</span></span>
          </Link></li>
        ))}</ul>
      )}
    </Kart>
  );
}
